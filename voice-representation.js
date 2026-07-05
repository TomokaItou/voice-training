// Unified voice representation layer.
// v1 uses existing frame-level acoustic features as a pseudo-embedding so the
// teaching flow can reason over comparable voice objects before a neural model exists.
(function () {
  const VERSION = 'voice-representation-v1';
  const EMBEDDING_MODEL = 'pseudo-v1';
  const DEFAULT_SEGMENT_MS = 1500;
  const MIN_SEGMENT_FRAMES = 3;

  const VECTOR_FIELDS = [
    'pitchStd',
    'pitchRange',
    'loudnessStd',
    'brightness',
    'breathiness',
    'roughness',
    'pressedness',
    'steadiness',
    'continuity',
    'attackHardness',
    'tailDrop',
  ];

  const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

  function cleanNumbers(values) {
    return values.filter(Number.isFinite);
  }

  function mean(values) {
    const source = cleanNumbers(values);
    if (!source.length) return 0;
    return source.reduce((sum, value) => sum + value, 0) / source.length;
  }

  function std(values) {
    const source = cleanNumbers(values);
    if (source.length < 2) return 0;
    const average = mean(source);
    return Math.sqrt(source.reduce((sum, value) => sum + ((value - average) ** 2), 0) / source.length);
  }

  function normalizeRange(value, min, max) {
    if (!Number.isFinite(value) || max <= min) return 0;
    return clamp01((value - min) / (max - min));
  }

  function getActiveFrames(frames = []) {
    const source = Array.isArray(frames) ? frames : [];
    const voiced = source.filter((frame) => Number.isFinite(frame?.rms) && frame.rms > 0.01);
    return voiced.length >= MIN_SEGMENT_FRAMES ? voiced : source;
  }

  function getDurationMs(frames = []) {
    if (!frames.length) return 0;
    const first = frames[0]?.timeMs || 0;
    const last = frames[frames.length - 1]?.timeMs || first;
    return Math.max(0, last - first);
  }

  function getFrameStats(frames = []) {
    const activeFrames = getActiveFrames(frames);
    const pitches = cleanNumbers(activeFrames.map((frame) => frame.pitch));
    const rmsValues = cleanNumbers(activeFrames.map((frame) => frame.rms));
    const centroids = cleanNumbers(activeFrames.map((frame) => frame.spectralCentroid));
    const pitchMean = mean(pitches);
    const pitchStd = std(pitches);
    const pitchRange = pitches.length ? Math.max(...pitches) - Math.min(...pitches) : 0;
    const loudnessMean = mean(rmsValues);
    const loudnessStd = std(rmsValues);
    const activeRatio = frames.length ? activeFrames.length / frames.length : 0;

    return {
      frameCount: frames.length,
      activeFrameCount: activeFrames.length,
      activeRatio: clamp01(activeRatio),
      pitch: {
        mean: pitchMean || null,
        std: pitchStd,
        range: pitchRange,
        coverage: frames.length ? clamp01(pitches.length / frames.length) : 0,
      },
      loudness: {
        mean: loudnessMean,
        std: loudnessStd,
      },
      spectral: {
        centroid: mean(centroids),
        highFrequencyRatio: mean(activeFrames.map((frame) => frame.highFrequencyRatio)),
        flatness: mean(activeFrames.map((frame) => frame.spectralFlatness)),
        zcr: mean(activeFrames.map((frame) => frame.zcr)),
      },
      stability: {
        pitch: clamp01(1 - normalizeRange(pitchStd, 10, 90)),
        loudness: clamp01(1 - (loudnessStd / Math.max(0.001, loudnessMean * 1.8))),
        continuity: clamp01(activeRatio),
      },
      onset: getOnsetStats(activeFrames),
      tail: getTailStats(activeFrames),
    };
  }

  function getOnsetStats(frames = []) {
    const onset = frames.slice(0, Math.min(frames.length, 4));
    const firstRms = onset[0]?.rms || 0;
    const peakRms = Math.max(...onset.map((frame) => frame.rms || 0), 0);
    const roughness = mean(onset.map((frame) => frame.waveformRoughness));
    return {
      hardness: clamp01(normalizeRange(peakRms - firstRms, 0.005, 0.08) * 0.45 + roughness * 0.55),
      rmsRise: peakRms - firstRms,
    };
  }

  function getTailStats(frames = []) {
    const tail = frames.slice(Math.max(0, frames.length - 5));
    const previous = frames.slice(Math.max(0, frames.length - 10), Math.max(0, frames.length - 5));
    const tailPitch = mean(tail.map((frame) => frame.pitch));
    const previousPitch = mean(previous.map((frame) => frame.pitch));
    const pitchDropCents = tailPitch && previousPitch ? 1200 * Math.log2(tailPitch / previousPitch) : 0;
    const tailRms = mean(tail.map((frame) => frame.rms));
    const previousRms = mean(previous.map((frame) => frame.rms));
    return {
      pitchDropCents,
      loudnessDrop: previousRms - tailRms,
      drop: clamp01(normalizeRange(Math.max(0, -pitchDropCents), 15, 140) * 0.65 +
        normalizeRange(Math.max(0, previousRms - tailRms), 0.004, 0.05) * 0.35),
    };
  }

  function getPerceptualStats(frameStats) {
    const spectral = frameStats.spectral;
    const stability = frameStats.stability;
    const roughness = clamp01(spectral.flatness * 0.45 + spectral.zcr * 0.35);
    const brightness = clamp01(
      normalizeRange(spectral.centroid, 900, 3600) * 0.7 +
        normalizeRange(spectral.highFrequencyRatio, 0.02, 0.22) * 0.3
    );
    const breathiness = clamp01(
      spectral.highFrequencyRatio * 2.2 +
        spectral.flatness * 0.45 +
        spectral.zcr * 0.75 +
        (1 - stability.loudness) * 0.2
    );
    const pressedness = clamp01(
      roughness * 0.45 +
        frameStats.onset.hardness * 0.35 +
        normalizeRange(frameStats.loudness.mean, 0.04, 0.14) * 0.2
    );

    return {
      brightness,
      breathiness,
      pressedness,
      roughness,
      steadiness: clamp01((stability.pitch + stability.loudness) / 2),
      continuity: stability.continuity,
      attackHardness: frameStats.onset.hardness,
      tailDrop: frameStats.tail.drop,
    };
  }

  function buildEmbedding(frameStats, perceptual) {
    const vectorByField = {
      pitchStd: normalizeRange(frameStats.pitch.std, 0, 90),
      pitchRange: normalizeRange(frameStats.pitch.range, 0, 420),
      loudnessStd: normalizeRange(frameStats.loudness.std, 0, 0.08),
      brightness: perceptual.brightness,
      breathiness: perceptual.breathiness,
      roughness: perceptual.roughness,
      pressedness: perceptual.pressedness,
      steadiness: perceptual.steadiness,
      continuity: perceptual.continuity,
      attackHardness: perceptual.attackHardness,
      tailDrop: perceptual.tailDrop,
    };

    return {
      model: EMBEDDING_MODEL,
      fields: VECTOR_FIELDS,
      vector: VECTOR_FIELDS.map((field) => Number((vectorByField[field] || 0).toFixed(5))),
      values: vectorByField,
    };
  }

  function getProblemCandidates(perceptual, frameStats) {
    const candidates = [
      {
        type: 'breathiness',
        label: 'sound is airy or scattered',
        score: perceptual.breathiness,
      },
      {
        type: 'pressedness',
        label: 'sound may be pressed',
        score: perceptual.pressedness,
      },
      {
        type: 'tail_drop',
        label: 'tail tends to drop or fade',
        score: perceptual.tailDrop,
      },
      {
        type: 'pitch_instability',
        label: 'pitch center is unstable',
        score: normalizeRange(frameStats.pitch.std, 18, 85),
      },
      {
        type: 'discontinuity',
        label: 'voicing is not continuous enough',
        score: 1 - perceptual.continuity,
      },
    ];

    return candidates
      .map((candidate) => ({ ...candidate, score: Number(clamp01(candidate.score).toFixed(4)) }))
      .sort((a, b) => b.score - a.score);
  }

  function segmentFrames(frames = [], segmentMs = DEFAULT_SEGMENT_MS) {
    const source = Array.isArray(frames) ? frames : [];
    if (!source.length) return [];
    const segments = [];
    let current = [];
    let segmentStartMs = source[0]?.timeMs || 0;

    source.forEach((frame) => {
      if (!current.length) {
        segmentStartMs = frame.timeMs || 0;
      }
      current.push(frame);
      const elapsed = (frame.timeMs || segmentStartMs) - segmentStartMs;
      if (elapsed >= segmentMs && current.length >= MIN_SEGMENT_FRAMES) {
        segments.push(current);
        current = [];
      }
    });

    if (current.length) {
      segments.push(current);
    }
    return segments;
  }

  function summarizeSegment(segmentFramesSource, index, sourceId) {
    const frameStats = getFrameStats(segmentFramesSource);
    const perceptual = getPerceptualStats(frameStats);
    const embedding = buildEmbedding(frameStats, perceptual);
    const startMs = segmentFramesSource[0]?.timeMs || 0;
    const endMs = segmentFramesSource[segmentFramesSource.length - 1]?.timeMs || startMs;
    const problemCandidates = getProblemCandidates(perceptual, frameStats);

    return {
      id: `${sourceId || 'voice'}-seg-${index + 1}`,
      index,
      startMs,
      endMs,
      durationMs: Math.max(0, endMs - startMs),
      frameStats,
      perceptual,
      embedding,
      problemCandidates,
      primaryProblem: problemCandidates[0] || null,
    };
  }

  function createVoiceRepresentation(frames = [], options = {}) {
    const source = Array.isArray(frames) ? frames : [];
    const id = options.id || `voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const frameStats = getFrameStats(source);
    const perceptual = getPerceptualStats(frameStats);
    const embedding = buildEmbedding(frameStats, perceptual);
    const segments = segmentFrames(source, options.segmentMs || DEFAULT_SEGMENT_MS)
      .map((segment, index) => summarizeSegment(segment, index, id));
    const problemCandidates = getProblemCandidates(perceptual, frameStats);

    return {
      id,
      version: VERSION,
      sourceType: options.sourceType || 'user',
      label: options.label || '',
      createdAt: options.createdAt || new Date().toISOString(),
      durationMs: options.durationMs || getDurationMs(source),
      frameStats,
      perceptual,
      embedding,
      segments,
      problemCandidates,
      primaryProblem: problemCandidates[0] || null,
      metadata: options.metadata || {},
    };
  }

  window.VoiceRepresentation = {
    VERSION,
    EMBEDDING_MODEL,
    VECTOR_FIELDS,
    create: createVoiceRepresentation,
    getFrameStats,
    getPerceptualStats,
    buildEmbedding,
    getProblemCandidates,
    segmentFrames,
  };

  window.createVoiceRepresentation = createVoiceRepresentation;
})();
