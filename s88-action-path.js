// S88 ecological vocal action trajectory helpers.

const s88ActionTargets = {
  twang: {
    label: 'Twang trajectory',
    vector: { pitch: 0.14, loudness: 0.1, brightness: 0.3, periodicity: 0.16, onset: -0.06 },
  },
  hardOnset: {
    label: 'Hard-onset trajectory',
    vector: { pitch: 0.09, loudness: 0.08, brightness: 0.12, periodicity: -0.04, onset: 0.34 },
  },
  softOnset: {
    label: 'Soft-onset trajectory',
    vector: { pitch: -0.03, loudness: -0.04, brightness: -0.08, periodicity: 0.04, onset: -0.24 },
  },
};

const s88PracticeActions = {
  breathiness: {
    label: 'Breathiness / 气声感',
    increase: '增加气声感',
    decrease: '减少气声感',
    hold: '保持气声感',
    increaseCopy: '目标声音更松、更带气。练习时让气流多一点，但不要让音高散掉。',
    decreaseCopy: '目标声音更清晰。练习时减少漏气感，让元音边缘更明确。',
    holdCopy: '气声感已经接近目标，把注意力放到其他动作上。',
  },
  closure: {
    label: 'Closure / 闭合感',
    increase: '增加闭合感',
    decrease: '放松闭合感',
    hold: '保持闭合感',
    increaseCopy: '目标声音闭合更清楚。练习时让声带接触更稳定，不要靠挤压变大声。',
    decreaseCopy: '目标声音压力更小。练习时放松喉部，把响度降一点再唱。',
    holdCopy: '闭合感已经接近目标，继续保持稳定。',
  },
  twang: {
    label: 'Twang / 集中度',
    increase: '增加 Twang',
    decrease: '减少 Twang',
    hold: '保持 Twang',
    increaseCopy: '保持音高稳定，尝试增加声音集中度和明亮感。',
    decreaseCopy: '目标声音更宽松。练习时少一点鼻咽集中感，保持元音自然。',
    holdCopy: '集中度已经接近目标，不需要额外推亮。',
  },
  onset: {
    label: 'Onset / 起音力度',
    increase: '起音更明确',
    decrease: '起音更柔和',
    hold: '保持起音力度',
    increaseCopy: '目标声音起音更清楚。练短促 da/ta，但避免喉部硬撞。',
    decreaseCopy: '目标声音起音更软。让元音慢一点进入，先稳住前 300 ms。',
    holdCopy: '起音力度已经接近目标，把注意力放在持续段音色。',
  },
};

function s88ResetActionState() {
  s88FrameHistory = [];
  s88OnsetWindow = [];
  s88ActiveOnset = null;
  s88LastRms = 0;
  s88LastUpdate = 0;
  s88UserProfile = null;
  if (s88TrajectoryValue) s88TrajectoryValue.textContent = '先准备目标和录音';
  if (s88RecommendationStars) s88RecommendationStars.textContent = '☆☆☆☆☆';
  if (s88RecommendationConfidence) s88RecommendationConfidence.textContent = '等待对比';
  if (s88TwangValue) s88TwangValue.textContent = '--%';
  if (s88OnsetValue) s88OnsetValue.textContent = '--%';
  if (s88CouplingValue) s88CouplingValue.textContent = '--';
  if (s88ResidualValue) s88ResidualValue.textContent = '--';
  if (s88Advice) s88Advice.textContent = '先录制当前声音并上传目标声音，系统会推荐下一步动作。';
  if (s88LiveFeedback) s88LiveFeedback.textContent = '等待开始练习';
  s88RenderTargetComparison(null);
  s88UpdateCompareButton();
}

function s88BandRatio(floatFrequencyData, sampleRate, minHz, maxHz) {
  if (!floatFrequencyData?.length || !sampleRate) return 0;
  const nyquist = sampleRate / 2;
  const binHz = nyquist / floatFrequencyData.length;
  let band = 0;
  let total = 0;
  for (let i = 0; i < floatFrequencyData.length; i += 1) {
    const hz = i * binHz;
    const power = Math.pow(10, (Number.isFinite(floatFrequencyData[i]) ? floatFrequencyData[i] : -120) / 10);
    if (hz >= 120 && hz <= Math.min(8000, nyquist)) total += power;
    if (hz >= minHz && hz <= maxHz) band += power;
  }
  return total > 0 ? band / total : 0;
}

function s88SpectralCentroid(floatFrequencyData, sampleRate) {
  if (!floatFrequencyData?.length || !sampleRate) return 0;
  const nyquist = sampleRate / 2;
  const binHz = nyquist / floatFrequencyData.length;
  let weighted = 0;
  let total = 0;
  for (let i = 1; i < floatFrequencyData.length; i += 1) {
    const hz = i * binHz;
    if (hz < 120 || hz > Math.min(8000, nyquist)) continue;
    const power = Math.pow(10, (Number.isFinite(floatFrequencyData[i]) ? floatFrequencyData[i] : -120) / 10);
    weighted += hz * power;
    total += power;
  }
  return total > 0 ? weighted / total : 0;
}

function s88CosineScore(need, vector) {
  const keys = Object.keys(vector);
  let dot = 0;
  let needMag = 0;
  let vectorMag = 0;
  keys.forEach((key) => {
    dot += (need[key] || 0) * vector[key];
    needMag += (need[key] || 0) ** 2;
    vectorMag += vector[key] ** 2;
  });
  if (needMag <= 1e-9 || vectorMag <= 1e-9) return 0;
  return clamp01((dot / Math.sqrt(needMag * vectorMag) + 1) / 2);
}

function s88EstimateFeatures({ now, rms, pitch, floatFrequencyData, sampleRate }) {
  const loudness = clamp01(normalizeRange(rmsToDb(rms || 0), -58, -16));
  const pitchNorm = pitch ? clamp01(normalizeRange(Math.log2(pitch), Math.log2(90), Math.log2(700))) : 0;
  const centroid = s88SpectralCentroid(floatFrequencyData, sampleRate);
  const brightness = clamp01(
    0.45 * normalizeRange(centroid, 700, 4200) +
      0.35 * normalizeRange(s88BandRatio(floatFrequencyData, sampleRate, 2000, 4500), 0.025, 0.28) +
      0.2 * normalizeRange(s88BandRatio(floatFrequencyData, sampleRate, 4000, 6000), 0.01, 0.18)
  );
  const highNoise = clamp01(normalizeRange(s88BandRatio(floatFrequencyData, sampleRate, 4500, 7500), 0.015, 0.16));
  const pitchDelta = pitch && s88FrameHistory.length
    ? getPitchDistanceCents(pitch, s88FrameHistory[s88FrameHistory.length - 1].pitch || pitch)
    : 0;
  const periodicity = clamp01((pitch ? 0.48 : 0.1) + 0.28 * (1 - highNoise) + 0.24 * (1 - normalizeRange(pitchDelta, 25, 180)));
  const twang = clamp01(0.38 * brightness + 0.25 * loudness + 0.2 * pitchNorm + 0.17 * periodicity);

  const rising = rms > Math.max(0.012, s88LastRms * 2.4);
  if (!s88ActiveOnset && rising) {
    s88ActiveOnset = { startedAt: now, peak: rms, frames: [] };
  }
  if (s88ActiveOnset) {
    s88ActiveOnset.peak = Math.max(s88ActiveOnset.peak, rms);
    s88ActiveOnset.frames.push({ now, rms, centroid, loudness });
    s88ActiveOnset.frames = s88ActiveOnset.frames.filter((frame) => now - frame.now <= 320);
    if (now - s88ActiveOnset.startedAt > 360 || rms < 0.009) {
      const frames = s88ActiveOnset.frames;
      const peak = Math.max(s88ActiveOnset.peak, 1e-5);
      const t10 = frames.find((frame) => frame.rms >= peak * 0.1)?.now || s88ActiveOnset.startedAt;
      const t90 = frames.find((frame) => frame.rms >= peak * 0.9)?.now || now;
      let maxSlope = 0;
      for (let i = 1; i < frames.length; i += 1) {
        const dt = Math.max(1, frames[i].now - frames[i - 1].now);
        maxSlope = Math.max(maxSlope, (frames[i].rms - frames[i - 1].rms) / peak / dt);
      }
      const earlyFrames = frames.filter((frame) => frame.now - s88ActiveOnset.startedAt <= 100);
      const earlyEnergy = earlyFrames.reduce((sum, frame) => sum + frame.rms ** 2, 0);
      const totalEnergy = frames.reduce((sum, frame) => sum + frame.rms ** 2, 0);
      const attackMs = Math.max(0, t90 - t10);
      const earlyRatio = totalEnergy > 0 ? earlyEnergy / totalEnergy : 0;
      const onsetHardness = clamp01(
        0.38 * (1 - normalizeRange(attackMs, 35, 280)) +
          0.34 * normalizeRange(maxSlope * 1000, 0.08, 1.8) +
          0.28 * normalizeRange(earlyRatio, 0.12, 0.62)
      );
      s88OnsetWindow.push(onsetHardness);
      s88OnsetWindow = s88OnsetWindow.slice(-8);
      s88ActiveOnset = null;
    }
  }
  s88LastRms = rms;

  const onset = s88OnsetWindow.length ? mean(s88OnsetWindow) : 0.32;
  return { pitch, pitchNorm, loudness, brightness, periodicity, twang, onset };
}

function s88ClassifyTrajectory(current, baseline) {
  const need = {
    pitch: current.pitchNorm - baseline.pitchNorm,
    loudness: current.loudness - baseline.loudness,
    brightness: current.brightness - baseline.brightness,
    periodicity: current.periodicity - baseline.periodicity,
    onset: current.onset - baseline.onset,
  };
  const ranked = Object.entries(s88ActionTargets)
    .map(([id, action]) => ({ id, ...action, score: s88CosineScore(need, action.vector) }))
    .sort((a, b) => b.score - a.score);
  return { best: ranked[0], need };
}

function s88Render(result) {
  if (!s88Dashboard || !result) return;
  const twangPct = Math.round(result.current.twang * 100);
  const onsetPct = Math.round(result.current.onset * 100);
  const coupling = result.coupling > 0.68 ? 'strong' : result.coupling > 0.42 ? 'mixed' : 'light';
  const residual = result.residual > 0.2 ? 'clear' : result.residual > 0.1 ? 'present' : 'weak';
  if (!s88UserProfile && s88TrajectoryValue) s88TrajectoryValue.textContent = result.best.label;
  if (s88TwangValue) s88TwangValue.textContent = `${twangPct}%`;
  if (s88OnsetValue) s88OnsetValue.textContent = `${onsetPct}%`;
  if (s88CouplingValue) s88CouplingValue.textContent = coupling;
  if (s88ResidualValue) s88ResidualValue.textContent = residual;
  if (s88LiveFeedback) {
    if (result.best.id === 'twang') {
      s88LiveFeedback.textContent = '正在向 Twang 方向移动';
    } else if (result.best.id === 'hardOnset') {
      s88LiveFeedback.textContent = '起音力度正在变强';
    } else {
      s88LiveFeedback.textContent = '起音正在变柔和';
    }
  }
  if (!s88UserProfile && s88Advice) {
    if (result.best.id === 'twang') {
      s88Advice.textContent = '正在向集中度方向移动。保持音高稳定，让声音更集中、更明亮。';
    } else if (result.best.id === 'hardOnset') {
      s88Advice.textContent = '当前变化更像起音变硬。先确认起音是否需要更明确，再增加明亮感。';
    } else {
      s88Advice.textContent = '当前变化更像起音变软。让元音渐进进入，然后稳定音高和响度。';
    }
  }
}

function s88UpdateActionPath(frame) {
  if (trainingMode !== 'action') return;
  const now = frame.now || performance.now();
  const current = s88EstimateFeatures(frame);
  if (!current.pitch && current.loudness < 0.08) {
    s88Render(null);
    return;
  }
  s88FrameHistory.push({ ...current, time: now });
  s88FrameHistory = s88FrameHistory.filter((item) => now - item.time <= 6000);
  if (s88FrameHistory.length < 4 || now - s88LastUpdate < 160) return;
  s88LastUpdate = now;
  const baselineFrames = s88FrameHistory.slice(0, Math.max(1, Math.floor(s88FrameHistory.length * 0.35)));
  const recentFrames = s88FrameHistory.slice(-Math.max(3, Math.floor(s88FrameHistory.length * 0.35)));
  const avg = (frames, key) => mean(frames.map((item) => item[key]));
  const baseline = {
    pitchNorm: avg(baselineFrames, 'pitchNorm'),
    loudness: avg(baselineFrames, 'loudness'),
    brightness: avg(baselineFrames, 'brightness'),
    periodicity: avg(baselineFrames, 'periodicity'),
    onset: avg(baselineFrames, 'onset'),
  };
  const recent = {
    pitchNorm: avg(recentFrames, 'pitchNorm'),
    loudness: avg(recentFrames, 'loudness'),
    brightness: avg(recentFrames, 'brightness'),
    periodicity: avg(recentFrames, 'periodicity'),
    onset: avg(recentFrames, 'onset'),
    twang: avg(recentFrames, 'twang'),
  };
  const classified = s88ClassifyTrajectory(recent, baseline);
  const coupling = clamp01(
    0.5 * Math.abs(classified.need.pitch) +
      0.35 * Math.abs(classified.need.loudness) +
      0.15 * Math.abs(classified.need.brightness)
  );
  const residual = clamp01(Math.abs(classified.need.onset) * 0.7 + Math.abs(classified.need.periodicity) * 0.3);
  s88Render({ current: recent, coupling, residual, ...classified });
}

function s88FrameTimbreFeatures(frame, sampleRate, floatFrequencyData) {
  let crossings = 0;
  let diff = 0;
  for (let i = 1; i < frame.length; i += 1) {
    if ((frame[i - 1] < 0 && frame[i] >= 0) || (frame[i - 1] >= 0 && frame[i] < 0)) {
      crossings += 1;
    }
    diff += Math.abs(frame[i] - frame[i - 1]);
  }
  const zcr = crossings / Math.max(1, frame.length - 1);
  const waveformRoughness = clamp01(normalizeRange(diff / Math.max(1, frame.length - 1), 0.002, 0.08));
  const spectralCentroid = s88SpectralCentroid(floatFrequencyData, sampleRate);
  const highFrequencyRatio = s88BandRatio(floatFrequencyData, sampleRate, 3000, 8000);
  let spectralFlatness = null;
  if (floatFrequencyData?.length) {
    let geo = 0;
    let arith = 0;
    let count = 0;
    const binHz = (sampleRate / 2) / floatFrequencyData.length;
    for (let i = 0; i < floatFrequencyData.length; i += 1) {
      const hz = i * binHz;
      if (hz < 120 || hz > Math.min(8000, sampleRate / 2)) continue;
      const power = Math.max(10 ** (floatFrequencyData[i] / 10), 1e-12);
      geo += Math.log(power);
      arith += power;
      count += 1;
    }
    spectralFlatness = count && arith ? Math.exp(geo / count) / (arith / count) : null;
  }
  return {
    zcr,
    waveformRoughness,
    spectralFlatness,
    highFrequencyRatio,
    spectralCentroid,
  };
}

async function s88ExtractTimbreFramesFromFile(file) {
  const audioBuffer = await decodeAudioFile(file);
  const sampleRate = audioBuffer.sampleRate;
  const offlineContext = new OfflineAudioContext(1, audioBuffer.length, sampleRate);
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  const analyserNode = offlineContext.createAnalyser();
  analyserNode.fftSize = 4096;
  const spectrum = new Float32Array(analyserNode.frequencyBinCount);
  const scriptNode = offlineContext.createScriptProcessor(2048, 1, 1);
  const frameLength = Math.max(1024, Math.round((sampleRate * 40) / 1000));
  const hopLength = Math.max(512, Math.round((sampleRate * 20) / 1000));
  let buffer = new Float32Array(frameLength * 2);
  let bufferLength = 0;
  let frameOffsetSamples = 0;
  const frames = [];

  const appendSamples = (input) => {
    if (bufferLength + input.length > buffer.length) {
      const next = new Float32Array(bufferLength + input.length);
      next.set(buffer.subarray(0, bufferLength));
      buffer = next;
    }
    buffer.set(input, bufferLength);
    bufferLength += input.length;
  };
  const readFrame = () => {
    if (bufferLength < frameLength) return null;
    const frame = new Float32Array(frameLength);
    frame.set(buffer.subarray(0, frameLength));
    buffer.copyWithin(0, hopLength, bufferLength);
    bufferLength -= hopLength;
    return frame;
  };

  scriptNode.onaudioprocess = (event) => {
    appendSamples(event.inputBuffer.getChannelData(0));
    let frame = readFrame();
    while (frame) {
      const rms = computeRms(frame);
      analyserNode.getFloatFrequencyData(spectrum);
      const pitchResult = estimatePitchYinWithConfidence(frame, sampleRate, rms);
      if (rms > 0.004 || pitchResult.pitch) {
        frames.push({
          timeMs: (frameOffsetSamples / sampleRate) * 1000,
          rms,
          pitch: pitchResult.confidence >= 0.14 ? pitchResult.pitch : null,
          ...s88FrameTimbreFeatures(frame, sampleRate, spectrum),
        });
      }
      frameOffsetSamples += hopLength;
      frame = readFrame();
    }
  };

  source.connect(analyserNode);
  analyserNode.connect(scriptNode);
  scriptNode.connect(offlineContext.destination);
  source.start();
  await offlineContext.startRendering();
  return frames;
}

function s88ProfileFromFrames(frames) {
  const usable = frames.filter((frame) => (frame.pitch || frame.rms > 0.006) && Number.isFinite(frame.rms));
  if (!usable.length) return null;
  const vectors = usable.map((frame, index) => memoryFrameVector(frame, index, usable));
  const profile = meanMemoryVector(vectors.map((vector) => ({ vector })));
  const onsetValues = s88EstimateOnsetsFromFrames(usable);
  profile.onset = onsetValues.length ? mean(onsetValues) : 0.32;
  profile.twang = clamp01(0.46 * profile.phiEtex + 0.24 * profile.brightness + 0.18 * profile.phiSn + 0.12 * profile.loudness);
  return profile;
}

function s88EstimateOnsetsFromFrames(frames) {
  const onsets = [];
  let active = null;
  let previousRms = 0;
  frames.forEach((frame) => {
    const rms = frame.rms || 0;
    if (!active && rms > Math.max(0.012, previousRms * 2.2)) {
      active = { startedAt: frame.timeMs, peak: rms, frames: [] };
    }
    if (active) {
      active.peak = Math.max(active.peak, rms);
      active.frames.push(frame);
      const age = frame.timeMs - active.startedAt;
      if (age > 360 || rms < 0.008) {
        const peak = Math.max(active.peak, 1e-5);
        const t10 = active.frames.find((item) => item.rms >= peak * 0.1)?.timeMs || active.startedAt;
        const t90 = active.frames.find((item) => item.rms >= peak * 0.9)?.timeMs || frame.timeMs;
        let maxSlope = 0;
        for (let i = 1; i < active.frames.length; i += 1) {
          const dt = Math.max(1, active.frames[i].timeMs - active.frames[i - 1].timeMs);
          maxSlope = Math.max(maxSlope, (active.frames[i].rms - active.frames[i - 1].rms) / peak / dt);
        }
        const early = active.frames.filter((item) => item.timeMs - active.startedAt <= 100);
        const earlyEnergy = early.reduce((sum, item) => sum + item.rms ** 2, 0);
        const totalEnergy = active.frames.reduce((sum, item) => sum + item.rms ** 2, 0);
        const attackMs = Math.max(0, t90 - t10);
        const earlyRatio = totalEnergy > 0 ? earlyEnergy / totalEnergy : 0;
        onsets.push(
          clamp01(
            0.38 * (1 - normalizeRange(attackMs, 35, 280)) +
              0.34 * normalizeRange(maxSlope * 1000, 0.08, 1.8) +
              0.28 * normalizeRange(earlyRatio, 0.12, 0.62)
          )
        );
        active = null;
      }
    }
    previousRms = rms;
  });
  return onsets;
}

function s88FormatDelta(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(3)}`;
}

function s88DirectionText(value, up, down, tolerance = 0.045) {
  if (value > tolerance) return up;
  if (value < -tolerance) return down;
  return '保持';
}

function s88ActionState(value, tolerance = 0.045) {
  const abs = Math.abs(value);
  const stars = Math.max(1, Math.min(5, Math.round(normalizeRange(abs, tolerance, 0.24) * 4 + 1)));
  const strength = abs < tolerance ? '保持' : abs < 0.1 ? '弱' : abs < 0.18 ? '中' : '强';
  const arrow = abs < tolerance ? '→' : value > 0 ? '↑' : '↓';
  const repeatedArrow = abs < tolerance ? arrow : arrow.repeat(Math.min(3, Math.max(1, Math.ceil(stars / 2))));
  const direction = abs < tolerance ? 'hold' : value > 0 ? 'up' : 'down';
  return { abs, stars, strength, arrow: repeatedArrow, direction };
}

function s88Stars(count) {
  const filled = Math.max(0, Math.min(5, count));
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
}

function s88SetActionCard({ key, value, directionText }) {
  const meta = s88PracticeActions[key];
  const nodes = {
    breathiness: { card: s88BreathinessCard, title: s88BreathinessAdvice, strength: s88BreathinessStrength, copy: s88BreathinessCopy },
    closure: { card: s88ClosureCard, title: s88ClosureAdvice, strength: s88ClosureStrength, copy: s88ClosureCopy },
    twang: { card: s88TwangCard, title: s88TwangAdvice, strength: s88TwangStrength, copy: s88TwangCopy },
    onset: { card: s88OnsetCard, title: s88OnsetAdvice, strength: s88OnsetStrength, copy: s88OnsetCopy },
  }[key];
  const state = s88ActionState(value);
  if (!meta || !nodes) return state;
  const copy = state.direction === 'hold' ? meta.holdCopy : state.direction === 'up' ? meta.increaseCopy : meta.decreaseCopy;
  if (nodes.card) nodes.card.dataset.direction = state.direction;
  if (nodes.title) nodes.title.textContent = `${state.arrow} ${directionText}`;
  if (nodes.strength) nodes.strength.textContent = state.direction === 'hold' ? '强度：保持' : `强度：${state.strength} · ${s88Stars(state.stars)}`;
  if (nodes.copy) nodes.copy.textContent = copy;
  return state;
}

function s88ResetActionCards() {
  [
    [s88BreathinessCard, s88BreathinessAdvice, s88BreathinessStrength, s88BreathinessCopy, '上传目标声音并对比录音后显示调整方向。'],
    [s88ClosureCard, s88ClosureAdvice, s88ClosureStrength, s88ClosureCopy, '系统会判断需要更清晰闭合，还是放松压力。'],
    [s88TwangCard, s88TwangAdvice, s88TwangStrength, s88TwangCopy, '练习声音集中度和明亮感，不只看高频能量。'],
    [s88OnsetCard, s88OnsetAdvice, s88OnsetStrength, s88OnsetCopy, '系统会关注开始发声的前 300 ms 是否过硬或过软。'],
  ].forEach(([card, title, strength, copy, text]) => {
    if (card) card.dataset.direction = '';
    if (title) title.textContent = '--';
    if (strength) strength.textContent = '--';
    if (copy) copy.textContent = text;
  });
}

function s88CompareProfiles(user, target) {
  if (!user || !target) return null;
  const deltaSn = target.phiSn - user.phiSn;
  const deltaEtex = target.phiEtex - user.phiEtex;
  const deltaBreath = target.breathiness - user.breathiness;
  const deltaClosure = target.closure - user.closure;
  const deltaTwang = target.twang - user.twang;
  const deltaOnset = target.onset - user.onset;
  return {
    deltaSn,
    deltaEtex,
    deltaBreath,
    deltaClosure,
    deltaTwang,
    deltaOnset,
    breathiness: s88DirectionText(deltaBreath, '建议增加', '建议减少'),
    closure: s88DirectionText(deltaClosure, '建议增加', '建议放松'),
    twang: s88DirectionText(deltaTwang, '建议增加', '建议减少'),
    onset: s88DirectionText(deltaOnset, '建议更明确', '建议更柔和'),
  };
}

function s88RenderTargetComparison(result) {
  if (s88PhiSnDelta) s88PhiSnDelta.textContent = result ? s88FormatDelta(result.deltaSn) : '--';
  if (s88PhiEtexDelta) s88PhiEtexDelta.textContent = result ? s88FormatDelta(result.deltaEtex) : '--';
  if (!result) {
    s88ResetActionCards();
    return;
  }
  const actions = [
    { key: 'breathiness', value: result.deltaBreath, text: result.breathiness },
    { key: 'closure', value: result.deltaClosure, text: result.closure },
    { key: 'twang', value: result.deltaTwang, text: result.twang },
    { key: 'onset', value: result.deltaOnset, text: result.onset },
  ].map((item) => ({ ...item, state: s88SetActionCard({ key: item.key, value: item.value, directionText: item.text }) }));
  const [best] = actions.sort((a, b) => b.state.abs - a.state.abs);
  const bestMeta = s88PracticeActions[best.key];
  const confidence = Math.round(clamp01(normalizeRange(best.state.abs, 0.04, 0.28)) * 100);
  if (s88TrajectoryValue) {
    s88TrajectoryValue.textContent =
      best.state.direction === 'hold'
        ? bestMeta.hold
        : best.state.direction === 'up'
          ? bestMeta.increase
          : bestMeta.decrease;
  }
  if (s88RecommendationStars) s88RecommendationStars.textContent = s88Stars(best.state.stars);
  if (s88RecommendationConfidence) s88RecommendationConfidence.textContent = `置信度：${confidence}%`;
  if (s88Advice) {
    s88Advice.textContent =
      best.state.direction === 'hold'
        ? bestMeta.holdCopy
        : best.state.direction === 'up'
          ? bestMeta.increaseCopy
          : bestMeta.decreaseCopy;
  }
}

function s88UpdateCompareButton() {
  if (!s88CompareButton) return;
  s88CompareButton.disabled = !s88TargetProfile || !recordingTimelineFrames.length;
}

async function s88LoadTargetVoice(file) {
  if (!file) return;
  if (s88TargetStatus) s88TargetStatus.textContent = '正在分析目标声音...';
  s88TargetProfile = null;
  s88RenderTargetComparison(null);
  s88UpdateCompareButton();
  try {
    const frames = await s88ExtractTimbreFramesFromFile(file);
    s88TargetProfile = s88ProfileFromFrames(frames);
    if (!s88TargetProfile) throw new Error('No usable voice frames');
    if (s88TargetStatus) {
      s88TargetStatus.textContent = '目标声音已就绪';
    }
  } catch (error) {
    console.error(error);
    if (s88TargetStatus) s88TargetStatus.textContent = '目标声音分析失败，请换一段清晰 wav/mp3。';
  }
  s88UpdateCompareButton();
}

function s88CompareLatestRecording() {
  if (!s88TargetProfile || !recordingTimelineFrames.length) {
    s88UpdateCompareButton();
    return;
  }
  s88UserProfile = s88ProfileFromFrames(recordingTimelineFrames);
  if (!s88UserProfile) {
    if (s88UserStatus) s88UserStatus.textContent = '最近录音里没有检测到可用人声。';
    s88RenderTargetComparison(null);
    return;
  }
  const result = s88CompareProfiles(s88UserProfile, s88TargetProfile);
  s88RenderTargetComparison(result);
  if (s88UserStatus) {
    s88UserStatus.textContent = '已生成动作建议。现在按推荐动作练一遍，再重新对比。';
  }
}
