// Pluggable neural voice embedding interface.
// The default provider is a lightweight DSP proxy so the app can use the same
// async API before a real ONNX/WebNN/TensorFlow model is bundled.
(function () {
  const VERSION = 'neural-voice-embedding-v1';
  const FALLBACK_MODEL = 'dsp-proxy-v1';
  const DEFAULT_SEGMENT_MS = 1500;
  const DEFAULT_WINDOW_SIZE = 2048;
  const providers = new Map();
  let activeProviderId = null;

  const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

  function toMonoSamples(audioBuffer) {
    if (!audioBuffer?.numberOfChannels || !audioBuffer.length) return new Float32Array();
    const output = new Float32Array(audioBuffer.length);
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
      const data = audioBuffer.getChannelData(channel);
      for (let index = 0; index < data.length; index += 1) {
        output[index] += data[index] / audioBuffer.numberOfChannels;
      }
    }
    return output;
  }

  function mean(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function std(values) {
    if (values.length < 2) return 0;
    const average = mean(values);
    return Math.sqrt(values.reduce((sum, value) => sum + ((value - average) ** 2), 0) / values.length);
  }

  function normalize(value, min, max) {
    if (!Number.isFinite(value) || max <= min) return 0;
    return clamp01((value - min) / (max - min));
  }

  function getWindowFeatures(samples, sampleRate, start, size) {
    const end = Math.min(samples.length, start + size);
    if (end <= start) {
      return null;
    }

    let energy = 0;
    let peak = 0;
    let zcr = 0;
    let absDelta = 0;
    let lowEnergy = 0;
    let highEnergy = 0;
    let previous = samples[start] || 0;

    for (let index = start; index < end; index += 1) {
      const value = samples[index] || 0;
      const abs = Math.abs(value);
      energy += value * value;
      peak = Math.max(peak, abs);
      if (index > start) {
        const last = samples[index - 1] || 0;
        if ((value >= 0 && last < 0) || (value < 0 && last >= 0)) zcr += 1;
        absDelta += Math.abs(value - previous);
      }
      if (index - start < size / 2) lowEnergy += value * value;
      else highEnergy += value * value;
      previous = value;
    }

    const length = end - start;
    const rms = Math.sqrt(energy / length);
    const roughness = absDelta / Math.max(1, length - 1);
    const zeroCrossRate = zcr / Math.max(1, length - 1);
    const brightness = highEnergy / Math.max(0.000001, highEnergy + lowEnergy);
    const crest = peak / Math.max(0.000001, rms);
    const durationMs = (length / sampleRate) * 1000;

    return {
      startMs: (start / sampleRate) * 1000,
      endMs: ((start + length) / sampleRate) * 1000,
      durationMs,
      rms,
      peak,
      zcr: zeroCrossRate,
      roughness,
      brightness,
      crest,
    };
  }

  function extractWindowFeatures(audioBuffer, options = {}) {
    const samples = toMonoSamples(audioBuffer);
    const sampleRate = audioBuffer?.sampleRate || 44100;
    const windowSize = options.windowSize || DEFAULT_WINDOW_SIZE;
    const hopSize = options.hopSize || Math.floor(windowSize / 2);
    const features = [];
    for (let start = 0; start < samples.length; start += hopSize) {
      const feature = getWindowFeatures(samples, sampleRate, start, windowSize);
      if (feature) features.push(feature);
    }
    return features;
  }

  function summarizeFeatures(features = []) {
    const active = features.filter((feature) => feature.rms > 0.003);
    const source = active.length ? active : features;
    const rms = source.map((feature) => feature.rms);
    const zcr = source.map((feature) => feature.zcr);
    const roughness = source.map((feature) => feature.roughness);
    const brightness = source.map((feature) => feature.brightness);
    const crest = source.map((feature) => feature.crest);

    return {
      activeRatio: features.length ? active.length / features.length : 0,
      rmsMean: mean(rms),
      rmsStd: std(rms),
      zcrMean: mean(zcr),
      zcrStd: std(zcr),
      roughnessMean: mean(roughness),
      roughnessStd: std(roughness),
      brightnessMean: mean(brightness),
      brightnessStd: std(brightness),
      crestMean: mean(crest),
      crestStd: std(crest),
    };
  }

  function buildFallbackVector(summary) {
    return [
      normalize(summary.activeRatio, 0, 1),
      normalize(summary.rmsMean, 0, 0.16),
      normalize(summary.rmsStd, 0, 0.08),
      normalize(summary.zcrMean, 0, 0.28),
      normalize(summary.zcrStd, 0, 0.14),
      normalize(summary.roughnessMean, 0, 0.08),
      normalize(summary.roughnessStd, 0, 0.04),
      normalize(summary.brightnessMean, 0, 1),
      normalize(summary.brightnessStd, 0, 0.5),
      normalize(summary.crestMean, 1, 12),
      normalize(summary.crestStd, 0, 6),
      normalize(summary.rmsMean * (1 - summary.zcrMean), 0, 0.14),
      normalize(summary.roughnessMean + summary.zcrMean, 0, 0.32),
      normalize(summary.brightnessMean * summary.zcrMean, 0, 0.18),
      normalize(summary.activeRatio * (1 - summary.rmsStd), 0, 1),
      normalize((summary.crestMean - 1) * summary.rmsMean, 0, 0.6),
    ].map((value) => Number(value.toFixed(6)));
  }

  function cosineSimilarity(a = [], b = []) {
    const length = Math.min(a.length, b.length);
    if (!length) return 0;
    let dot = 0;
    let aNorm = 0;
    let bNorm = 0;
    for (let index = 0; index < length; index += 1) {
      const left = Number(a[index]) || 0;
      const right = Number(b[index]) || 0;
      dot += left * right;
      aNorm += left * left;
      bNorm += right * right;
    }
    if (!aNorm || !bNorm) return 0;
    return clamp01((dot / Math.sqrt(aNorm * bNorm) + 1) / 2);
  }

  function vectorDistance(a = [], b = []) {
    const length = Math.min(a.length, b.length);
    if (!length) return 1;
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      const delta = (Number(a[index]) || 0) - (Number(b[index]) || 0);
      sum += delta * delta;
    }
    return Math.sqrt(sum / length);
  }

  function makeEmbedding({ vector, model, providerId, metadata = {}, segments = [] }) {
    return {
      version: VERSION,
      model: model || FALLBACK_MODEL,
      providerId: providerId || 'fallback',
      vector,
      dimensions: vector.length,
      segments,
      metadata,
      createdAt: new Date().toISOString(),
    };
  }

  async function encodeWithFallback(audioBuffer, options = {}) {
    const features = extractWindowFeatures(audioBuffer, options);
    const summary = summarizeFeatures(features);
    const vector = buildFallbackVector(summary);
    const segments = encodeFallbackSegments(features, options);
    return makeEmbedding({
      vector,
      model: FALLBACK_MODEL,
      providerId: 'fallback',
      segments,
      metadata: {
        durationMs: audioBuffer?.duration ? audioBuffer.duration * 1000 : 0,
        sampleRate: audioBuffer?.sampleRate || null,
        summary,
        proxy: true,
      },
    });
  }

  function encodeFallbackSegments(features = [], options = {}) {
    const segmentMs = options.segmentMs || DEFAULT_SEGMENT_MS;
    if (!features.length) return [];
    const segments = [];
    let group = [];
    let startMs = features[0].startMs || 0;

    features.forEach((feature) => {
      if (!group.length) startMs = feature.startMs || 0;
      group.push(feature);
      if ((feature.endMs || startMs) - startMs >= segmentMs) {
        const summary = summarizeFeatures(group);
        segments.push({
          index: segments.length,
          startMs,
          endMs: feature.endMs,
          vector: buildFallbackVector(summary),
          metadata: { summary },
        });
        group = [];
      }
    });

    if (group.length) {
      const summary = summarizeFeatures(group);
      segments.push({
        index: segments.length,
        startMs,
        endMs: group[group.length - 1].endMs,
        vector: buildFallbackVector(summary),
        metadata: { summary },
      });
    }
    return segments;
  }

  function registerProvider(provider) {
    if (!provider?.id || typeof provider.encodeVoice !== 'function') {
      throw new Error('NeuralVoiceEmbedding provider needs id and encodeVoice(audioBuffer, options).');
    }
    providers.set(provider.id, provider);
    if (!activeProviderId) activeProviderId = provider.id;
    return provider;
  }

  function setActiveProvider(providerId) {
    if (providerId !== null && !providers.has(providerId)) {
      throw new Error(`Unknown NeuralVoiceEmbedding provider: ${providerId}`);
    }
    activeProviderId = providerId;
  }

  function getActiveProvider() {
    return activeProviderId ? providers.get(activeProviderId) : null;
  }

  async function encodeVoice(audioBuffer, options = {}) {
    const provider = options.providerId ? providers.get(options.providerId) : getActiveProvider();
    if (provider) {
      const embedding = await provider.encodeVoice(audioBuffer, options);
      if (embedding?.vector?.length) {
        return makeEmbedding({
          ...embedding,
          providerId: provider.id,
          model: embedding.model || provider.model || provider.id,
        });
      }
    }
    return encodeWithFallback(audioBuffer, options);
  }

  function compareVoiceEmbeddings(reference, candidate) {
    const referenceVector = reference?.vector || [];
    const candidateVector = candidate?.vector || [];
    const distance = vectorDistance(referenceVector, candidateVector);
    return {
      model: candidate?.model || reference?.model || 'unknown',
      similarity: Number(cosineSimilarity(referenceVector, candidateVector).toFixed(4)),
      distance: Number(distance.toFixed(4)),
    };
  }

  function findChangedSegments(beforeEmbedding, afterEmbedding) {
    const beforeSegments = beforeEmbedding?.segments || [];
    const afterSegments = afterEmbedding?.segments || [];
    const count = Math.min(beforeSegments.length, afterSegments.length);
    const changes = [];
    for (let index = 0; index < count; index += 1) {
      const comparison = compareVoiceEmbeddings(beforeSegments[index], afterSegments[index]);
      changes.push({
        index,
        startMs: afterSegments[index].startMs,
        endMs: afterSegments[index].endMs,
        similarity: comparison.similarity,
        distance: comparison.distance,
      });
    }
    return changes.sort((a, b) => b.distance - a.distance);
  }

  async function attachToRepresentation(representation, audioBuffer, options = {}) {
    if (!representation) return null;
    representation.neuralEmbedding = await encodeVoice(audioBuffer, options);
    return representation;
  }

  window.NeuralVoiceEmbedding = {
    VERSION,
    FALLBACK_MODEL,
    registerProvider,
    setActiveProvider,
    getActiveProvider,
    encodeVoice,
    compareVoiceEmbeddings,
    findChangedSegments,
    attachToRepresentation,
  };

  window.encodeVoice = encodeVoice;
  window.compareVoiceEmbeddings = compareVoiceEmbeddings;
  window.findChangedSegments = findChangedSegments;
})();
