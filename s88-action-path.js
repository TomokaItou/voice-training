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
// Readable S88 decision-page rendering overrides.
const s88ActionLabels = {
  breathiness: {
    label: '气声',
    increase: '气声 ↑',
    decrease: '气声 ↓',
    hold: '气声保持',
    increaseCopy: '让气流多一点，但不要让音高和元音散掉。',
    decreaseCopy: '减少漏气感，让元音边缘更清楚。',
    holdCopy: '气声已经接近目标，把注意力放到其他动作上。',
    methodUp: '用轻声 /a/ 开始，保留一点气流感，再慢慢稳定音高。',
    methodDown: '先减小气流声，用更清楚的元音进入，不要靠挤压变大声。',
    reasonUp: '目标音色比当前声音更松、更带气，先加一点气声会更接近目标。',
    reasonDown: '当前声音的漏气感比目标更明显，先收住气流边缘会更有效。',
  },
  closure: {
    label: '闭合',
    increase: '闭合 ↑',
    decrease: '闭合 ↓',
    hold: '闭合保持',
    increaseCopy: '让声带接触更稳定，但不要靠喉咙硬顶。',
    decreaseCopy: '放松压力，先把响度降一点再唱。',
    holdCopy: '闭合已经接近目标，继续保持稳定。',
    methodUp: '用轻短的 ma / na 起音，找到清楚但不挤的声带接触。',
    methodDown: '先降低音量，用更松的元音进入，让喉咙压力少一点。',
    reasonUp: '当前声音的闭合比目标弱，先练闭合稳定会比继续调亮更有效。',
    reasonDown: '当前闭合压力偏强，先放松闭合能让音色更靠近目标。',
  },
  twang: {
    label: '集中度',
    increase: '集中度 ↑',
    decrease: '集中度 ↓',
    hold: '集中度保持',
    increaseCopy: '让声音更集中、更明亮，但不要挤。',
    decreaseCopy: '少一点鼻咽集中感，保持元音自然。',
    holdCopy: '集中度已经接近目标，不需要额外推亮。',
    methodUp: '用中性 /a/ 开始，轻微加入 da / ta 起音，让声音更集中但不要挤。',
    methodDown: '把元音放宽一点，减少尖锐的集中感，同时保持音量稳定。',
    reasonUp: '当前声音和目标的主要差距在集中度，优先练它比继续调整气声更有效。',
    reasonDown: '当前声音比目标更尖更集中，先放宽集中度会更自然。',
  },
  onset: {
    label: '起音',
    increase: '起音 ↑',
    decrease: '起音 ↓',
    hold: '起音保持',
    increaseCopy: '让开头更清楚，但避免喉部硬撞。',
    decreaseCopy: '让元音慢一点进入，稳住前 300 ms。',
    holdCopy: '起音力度已经接近目标，把注意力放在持续段音色。',
    methodUp: '练短促 da / ta，再把硬度减半，保留清楚的开头。',
    methodDown: '用轻柔的 ha-a 或 a-a 进入，让声音慢一点打开。',
    reasonUp: '目标音色的起音更明确，先练起音会让动作路径更接近目标。',
    reasonDown: '当前起音偏硬，先柔化开头可以减少压力感。',
  },
};
function s88ReadableStars(count) {
  const filled = Math.max(0, Math.min(5, count));
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
}

function s88ReadableDirection(value, up, down, tolerance = 0.045) {
  if (value > tolerance) return up;
  if (value < -tolerance) return down;
  return '保持';
}

function s88ReadableActionState(value, tolerance = 0.045) {
  const abs = Math.abs(value);
  const stars = Math.max(1, Math.min(5, Math.round(normalizeRange(abs, tolerance, 0.24) * 4 + 1)));
  const strength = abs < tolerance ? '保持' : abs < 0.1 ? '轻微' : abs < 0.18 ? '中等' : '明显';
  const arrow = abs < tolerance ? '→' : value > 0 ? '↑' : '↓';
  const direction = abs < tolerance ? 'hold' : value > 0 ? 'up' : 'down';
  return { abs, stars, strength, arrow, direction };
}

function s88RecommendationText(best) {
  const meta = s88ActionLabels[best.key];
  if (!meta) {
    return {
      title: '保持当前动作',
      copy: '当前声音已经比较接近目标。',
      method: '按现在的感觉再唱一遍，保持音量和元音稳定。',
      reason: '系统没有发现特别优先的调整方向。',
    };
  }
  if (best.state.direction === 'hold') {
    return {
      title: meta.hold,
      copy: meta.holdCopy,
      method: '按现在的动作再唱一遍，重点保持稳定，不急着增加新变化。',
      reason: `${meta.label}已经接近目标，优先保持，不要为了调整而调整。`,
    };
  }
  const isUp = best.state.direction === 'up';
  return {
    title: isUp ? meta.increase : meta.decrease,
    copy: isUp ? meta.increaseCopy : meta.decreaseCopy,
    method: isUp ? meta.methodUp : meta.methodDown,
    reason: isUp ? meta.reasonUp : meta.reasonDown,
  };
}

function s88SetActionCard({ key, value, directionText }) {
  const meta = s88ActionLabels[key];
  const nodes = {
    breathiness: { card: s88BreathinessCard, title: s88BreathinessAdvice, strength: s88BreathinessStrength, copy: s88BreathinessCopy },
    closure: { card: s88ClosureCard, title: s88ClosureAdvice, strength: s88ClosureStrength, copy: s88ClosureCopy },
    twang: { card: s88TwangCard, title: s88TwangAdvice, strength: s88TwangStrength, copy: s88TwangCopy },
    onset: { card: s88OnsetCard, title: s88OnsetAdvice, strength: s88OnsetStrength, copy: s88OnsetCopy },
  }[key];
  const state = s88ReadableActionState(value);
  if (!meta || !nodes) return state;
  const copy = state.direction === 'hold' ? meta.holdCopy : state.direction === 'up' ? meta.increaseCopy : meta.decreaseCopy;
  if (nodes.card) nodes.card.dataset.direction = state.direction;
  if (nodes.title) nodes.title.textContent = `${state.arrow} ${directionText}`;
  if (nodes.strength) nodes.strength.textContent = state.direction === 'hold' ? '强度：保持' : `强度：${state.strength} · ${s88ReadableStars(state.stars)}`;
  if (nodes.copy) nodes.copy.textContent = copy;
  return state;
}

function s88ResetActionCards() {
  [
    [s88BreathinessCard, s88BreathinessAdvice, s88BreathinessStrength, s88BreathinessCopy, '分析后显示气声是否需要调整。'],
    [s88ClosureCard, s88ClosureAdvice, s88ClosureStrength, s88ClosureCopy, '分析后显示闭合是否需要更清晰或更放松。'],
    [s88TwangCard, s88TwangAdvice, s88TwangStrength, s88TwangCopy, '分析后显示声音集中度是否需要调整。'],
    [s88OnsetCard, s88OnsetAdvice, s88OnsetStrength, s88OnsetCopy, '分析后显示起音是否需要更明确或更柔和。'],
  ].forEach(([card, title, strength, copy, text]) => {
    if (card) card.dataset.direction = '';
    if (title) title.textContent = '--';
    if (strength) strength.textContent = '--';
    if (copy) copy.textContent = text;
  });
}

function s88RenderTargetComparison(result) {
  if (s88PhiSnDelta) s88PhiSnDelta.textContent = result ? s88FormatDelta(result.deltaSn) : '--';
  if (s88PhiEtexDelta) s88PhiEtexDelta.textContent = result ? s88FormatDelta(result.deltaEtex) : '--';
  if (!result) {
    s88ResetActionCards();
    if (s88PathAction) s88PathAction.textContent = '推荐动作';
    if (s88PracticeMethod) s88PracticeMethod.textContent = '准备好目标音色和当前录音后，这里会给出具体练法。';
    if (s88Reason) s88Reason.textContent = '分析完成后，这里会解释为什么优先练这个动作。';
    return;
  }
  const actions = [
    { key: 'breathiness', value: result.deltaBreath, text: s88ReadableDirection(result.deltaBreath, '建议增加', '建议减少') },
    { key: 'closure', value: result.deltaClosure, text: s88ReadableDirection(result.deltaClosure, '建议增加', '建议放松') },
    { key: 'twang', value: result.deltaTwang, text: s88ReadableDirection(result.deltaTwang, '建议增加', '建议减少') },
    { key: 'onset', value: result.deltaOnset, text: s88ReadableDirection(result.deltaOnset, '建议更明确', '建议更柔和') },
  ].map((item) => ({ ...item, state: s88SetActionCard({ key: item.key, value: item.value, directionText: item.text }) }));
  const [best] = actions.sort((a, b) => b.state.abs - a.state.abs);
  const confidence = Math.round(clamp01(normalizeRange(best.state.abs, 0.04, 0.28)) * 100);
  const text = s88RecommendationText(best);
  if (s88TrajectoryValue) s88TrajectoryValue.textContent = text.title;
  if (s88PathAction) s88PathAction.textContent = text.title;
  if (s88RecommendationStars) s88RecommendationStars.textContent = s88ReadableStars(best.state.stars);
  if (s88RecommendationConfidence) s88RecommendationConfidence.textContent = `置信度：${confidence}%`;
  if (s88Advice) s88Advice.textContent = text.copy;
  if (s88PracticeMethod) s88PracticeMethod.textContent = text.method;
  if (s88Reason) s88Reason.textContent = text.reason;
}

function s88ResetActionState() {
  s88FrameHistory = [];
  s88OnsetWindow = [];
  s88ActiveOnset = null;
  s88LastRms = 0;
  s88LastUpdate = 0;
  s88UserProfile = null;
  s88LastMatchSummary = null;
  s88PracticeActive = false;
  if (s88TrajectoryValue) s88TrajectoryValue.textContent = s88TargetProfile ? '录制当前声音' : '先上传目标音色';
  if (s88RecommendationStars) s88RecommendationStars.textContent = '☆☆☆☆☆';
  if (s88RecommendationConfidence) s88RecommendationConfidence.textContent = '等待分析';
  if (s88Advice) s88Advice.textContent = '先上传目标音色，再录一段当前声音。系统会告诉你下一步最值得练的动作。';
  if (s88TwangValue) s88TwangValue.textContent = '--%';
  if (s88OnsetValue) s88OnsetValue.textContent = '--%';
  if (s88CouplingValue) s88CouplingValue.textContent = '--';
  if (s88ResidualValue) s88ResidualValue.textContent = '--';
  if (s88LiveFeedback) s88LiveFeedback.textContent = '按推荐动作练习中';
  s88RenderTargetComparison(null);
  s88UpdateCompareButton();
}

function inferS88TrainingPhase() {
  if (s88PracticeActive) return 'practicing';
  if (mediaRecorder && mediaRecorder.state !== 'inactive') return 'recording';
  if (!s88TargetProfile) return 'needs-target';
  if (s88UserProfile) return 'result';
  return 'needs-recording';
}

function setS88TrainingPhase(phase = inferS88TrainingPhase()) {
  if (trainingMode !== 'action' && phase !== 'needs-target') {
    return;
  }
  s88TrainingPhase = phase;
  s88RenderTargetLibrarySelect();
  if (s88Dashboard) {
    s88Dashboard.dataset.phase = phase;
    s88Dashboard.classList.toggle('advanced-open', Boolean(s88AdvancedPanel?.open));
  }
  if (s88TargetStepStatus) {
    s88TargetStepStatus.textContent =
      phase === 'loading-target' ? '分析中' : s88TargetProfile ? '已上传' : '未上传';
  }
  if (s88RecordingStepStatus) {
    s88RecordingStepStatus.textContent =
      phase === 'recording'
        ? '录音中'
        : recordingTimelineFrames.length || s88UserProfile
          ? '已录制'
          : '未录制';
  }
  if (s88AnalysisStepStatus) {
    s88AnalysisStepStatus.textContent =
      phase === 'analyzing'
        ? '分析中'
        : phase === 'result' || phase === 'practicing'
          ? '已完成'
          : '等待';
  }
  if (s88TargetStatus) {
    if (phase === 'loading-target') {
      s88TargetStatus.textContent = '正在分析目标音色...';
    } else if (s88TargetProfile) {
      s88TargetStatus.textContent = s88TargetSourceName
        ? `目标音色已选择：${s88TargetSourceName}`
        : '目标音色已上传';
    } else {
      s88TargetStatus.textContent = '尚未上传目标音色';
    }
  }
  if (s88UserStatus) {
    const copy = {
      'needs-target': '先上传目标音色，再录制当前声音。',
      'loading-target': '正在读取目标音色，请稍等。',
      'needs-recording': '现在录制一段当前声音，系统会推荐下一步动作。',
      recording: '正在录制当前声音，结束后会自动分析。',
      analyzing: '正在分析目标音色和当前声音的差距。',
      result: '已生成动作建议。按推荐动作练一遍，再重新对比。',
      practicing: '正在练习推荐动作，结束后可以重新录制评估。',
    }[phase];
    if (copy) s88UserStatus.textContent = copy;
  }
  if (s88ResultActions) {
    s88ResultActions.hidden = phase !== 'result';
  }
  if (s88CompareButton) {
    s88CompareButton.hidden = true;
  }
  if (s88TargetInput) {
    s88TargetInput.hidden = phase !== 'needs-target';
  }
  if (s88TargetLibrarySelect) {
    s88TargetLibrarySelect.hidden = false;
  }
  if (s88AdvancedPanel) {
    s88AdvancedPanel.hidden = phase !== 'result' && !s88AdvancedPanel.open;
  }
  if (s88LiveFeedbackPanel) {
    s88LiveFeedbackPanel.hidden = phase !== 'practicing';
  }
  if (startButton && trainingMode === 'action') {
    const labels = {
      'needs-target': '选择目标音色',
      'loading-target': '分析目标中...',
      'needs-recording': '录制当前声音',
      recording: '结束录音',
      analyzing: '分析中...',
      result: '开始练习',
      practicing: '结束练习',
    };
    startButton.textContent = labels[phase] || '选择目标音色';
    startButton.disabled = phase === 'loading-target' || phase === 'analyzing';
  }
  if (pauseButton && trainingMode === 'action') {
    pauseButton.hidden = true;
    pauseButton.disabled = true;
  }
  if (stopButton && trainingMode === 'action') {
    stopButton.hidden = true;
    stopButton.disabled = true;
  }
}

function s88Median(values) {
  const clean = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!clean.length) return null;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
}

function s88Std(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length < 2) return 0;
  const avg = mean(clean);
  return Math.sqrt(mean(clean.map((value) => (value - avg) ** 2)));
}

function s88PitchStabilityCents(frames) {
  const pitches = frames.map((frame) => frame.pitch).filter((pitch) => Number.isFinite(pitch) && pitch > 0);
  if (pitches.length < 2) return 999;
  const medianPitch = s88Median(pitches);
  const cents = pitches.map((pitch) => Math.abs(getPitchDistanceCents(pitch, medianPitch)));
  return s88Median(cents) || 0;
}

function s88VowelClassFromProfile(profile) {
  if (!profile) return 'unknown';
  if (profile.brightness > 0.64 && profile.loudness > 0.42) return 'bright-open';
  if (profile.brightness < 0.38) return 'dark-rounded';
  if (profile.phiEtex > 0.58) return 'front-bright';
  return 'neutral-vowel';
}

function s88VowelEmbedding(profile) {
  return [
    profile?.brightness || 0,
    profile?.phiEtex || 0,
    profile?.closure || 0,
    profile?.breathiness || 0,
  ];
}

function s88VectorDistance(a, b) {
  const length = Math.min(a?.length || 0, b?.length || 0);
  if (!length) return 1;
  let sum = 0;
  for (let i = 0; i < length; i += 1) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum / length);
}

function s88SegmentFromFrames(frames, startIndex, endIndex) {
  const segmentFrames = frames.slice(startIndex, endIndex);
  if (segmentFrames.length < 4) return null;
  const startTime = segmentFrames[0].timeMs || 0;
  const endTime = segmentFrames[segmentFrames.length - 1].timeMs || startTime;
  const duration = Math.max(0, (endTime - startTime) / 1000);
  const voicedFrames = segmentFrames.filter((frame) => Number.isFinite(frame.pitch) && frame.pitch > 0);
  const rmsValues = segmentFrames.map((frame) => frame.rms || 0);
  const loudnessValues = segmentFrames.map((frame) => clamp01(normalizeRange(rmsToDb(frame.rms || 0), -58, -16)));
  const profile = s88ProfileFromFrames(segmentFrames);
  if (!profile) return null;
  const medianPitch = s88Median(voicedFrames.map((frame) => frame.pitch));
  const pitchStability = s88PitchStabilityCents(segmentFrames);
  const loudness = mean(loudnessValues);
  const loudnessStability = s88Std(loudnessValues);
  const voiceEnergyRatio = clamp01(voicedFrames.length / Math.max(1, segmentFrames.length));
  const avgFlatness = mean(segmentFrames.map((frame) => frame.spectralFlatness).filter(Number.isFinite));
  const avgHigh = mean(segmentFrames.map((frame) => frame.highFrequencyRatio).filter(Number.isFinite));
  const avgRoughness = mean(segmentFrames.map((frame) => frame.waveformRoughness).filter(Number.isFinite));
  const contaminationScore = clamp01(
    0.42 * normalizeRange(avgFlatness || 0, 0.06, 0.48) +
      0.28 * normalizeRange(avgHigh || 0, 0.04, 0.36) +
      0.18 * normalizeRange(avgRoughness || 0, 0.03, 0.42) +
      0.12 * (1 - voiceEnergyRatio)
  );
  const quality = clamp01(
    0.32 * voiceEnergyRatio +
      0.25 * (1 - normalizeRange(pitchStability, 35, 180)) +
      0.2 * (1 - normalizeRange(loudnessStability, 0.04, 0.22)) +
      0.23 * (1 - contaminationScore)
  );
  return {
    startTime,
    endTime,
    duration,
    medianPitch,
    pitchStability,
    loudness,
    loudnessStability,
    vowelClass: s88VowelClassFromProfile(profile),
    vowelLikeEmbedding: s88VowelEmbedding(profile),
    voiceEnergyRatio,
    contaminationScore,
    noise: contaminationScore,
    phi_SN: profile.phiSn,
    phi_Etex: profile.phiEtex,
    breathiness: profile.breathiness,
    closure: profile.closure,
    twang: profile.twang,
    onset: profile.onset,
    profile,
    quality,
  };
}

function s88BuildComparableSegments(frames, { relaxed = false } = {}) {
  const usable = frames.filter((frame) => Number.isFinite(frame.timeMs) && Number.isFinite(frame.rms));
  if (usable.length < 8) return [];
  const segments = [];
  const windowMs = 500;
  const hopMs = 250;
  const lastTime = usable[usable.length - 1].timeMs || 0;
  for (let startMs = usable[0].timeMs || 0; startMs + windowMs <= lastTime + 20; startMs += hopMs) {
    const endMs = startMs + windowMs;
    const startIndex = usable.findIndex((frame) => frame.timeMs >= startMs);
    if (startIndex < 0) continue;
    let endIndex = startIndex;
    while (endIndex < usable.length && usable[endIndex].timeMs <= endMs) endIndex += 1;
    const segment = s88SegmentFromFrames(usable, startIndex, endIndex);
    if (!segment) continue;
    const passes =
      segment.duration >= 0.45 &&
      segment.pitchStability <= (relaxed ? 220 : 150) &&
      segment.loudnessStability <= (relaxed ? 0.28 : 0.22) &&
      segment.voiceEnergyRatio >= (relaxed ? 0.32 : 0.45) &&
      segment.contaminationScore <= (relaxed ? 0.82 : 0.72);
    if (passes) segments.push(segment);
  }
  return segments.sort((a, b) => b.quality - a.quality).slice(0, 48);
}

function s88ProfileFromSegments(segments) {
  const profiles = segments.map((segment) => ({ vector: segment.profile })).filter((item) => item.vector);
  if (!profiles.length) return null;
  const profile = meanMemoryVector(profiles);
  profile.onset = mean(segments.map((segment) => segment.onset));
  profile.twang = clamp01(0.46 * profile.phiEtex + 0.24 * profile.brightness + 0.18 * profile.phiSn + 0.12 * profile.loudness);
  return profile;
}

function s88BuildTargetMatchingProfile(frames, sourceName = '') {
  const segments = s88BuildComparableSegments(frames);
  const profile = s88ProfileFromSegments(segments);
  if (!profile || segments.length < 1) return null;
  return {
    ...profile,
    sourceName,
    durationMs: frames[frames.length - 1]?.timeMs || 0,
    candidateCount: segments.length,
    segments,
    contaminationScore: mean(segments.slice(0, 8).map((segment) => segment.contaminationScore)),
    pitchRange: {
      min: Math.min(...segments.map((segment) => segment.medianPitch).filter(Number.isFinite)),
      max: Math.max(...segments.map((segment) => segment.medianPitch).filter(Number.isFinite)),
    },
  };
}

function s88SegmentMatchScore(userProfile, userSegment, targetSegment) {
  const userPitch = userSegment?.medianPitch || userProfile?.medianPitch || null;
  const targetPitch = targetSegment?.medianPitch || null;
  const pitchScore = userPitch && targetPitch ? Math.min(Math.abs(getPitchDistanceCents(userPitch, targetPitch)) / 450, 1.4) : 0.9;
  const vowelDistance = s88VectorDistance(userSegment?.vowelLikeEmbedding || s88VowelEmbedding(userProfile), targetSegment.vowelLikeEmbedding);
  const loudnessDifference = Math.abs((userSegment?.loudness ?? userProfile?.loudness ?? 0) - targetSegment.loudness);
  const durationDifference = Math.abs((userSegment?.duration || 1) - targetSegment.duration);
  const stabilityDifference = Math.abs((userSegment?.pitchStability || 120) - targetSegment.pitchStability) / 240;
  return {
    score:
      0.36 * pitchScore +
      0.24 * vowelDistance +
      0.18 * Math.min(loudnessDifference / 0.45, 1.2) +
      0.1 * Math.min(durationDifference / 2, 1) +
      0.07 * Math.min(stabilityDifference, 1.2) +
      0.05 * targetSegment.contaminationScore,
    pitchDifference: userPitch && targetPitch ? getPitchDistanceCents(userPitch, targetPitch) : null,
    vowelDistance,
    loudnessDifference,
  };
}

function s88MatchUserToTarget(userFrames, targetProfile) {
  if (!targetProfile?.segments?.length) return null;
  const userSegments = s88BuildComparableSegments(userFrames, { relaxed: true });
  const userProfile = s88ProfileFromSegments(userSegments) || s88ProfileFromFrames(userFrames);
  if (!userProfile) return null;
  const representativeUserSegment = userSegments[0] || {
    duration: Math.max(0.5, ((userFrames[userFrames.length - 1]?.timeMs || 0) - (userFrames[0]?.timeMs || 0)) / 1000),
    medianPitch: s88Median(userFrames.map((frame) => frame.pitch).filter((pitch) => pitch > 0)),
    loudness: userProfile.loudness,
    pitchStability: s88PitchStabilityCents(userFrames),
    vowelLikeEmbedding: s88VowelEmbedding(userProfile),
  };
  userProfile.medianPitch = representativeUserSegment.medianPitch;
  const ranked = targetProfile.segments
    .map((segment) => ({ segment, ...s88SegmentMatchScore(userProfile, representativeUserSegment, segment) }))
    .sort((a, b) => a.score - b.score);
  const matched = ranked.filter((item) => item.score <= 0.58).slice(0, 8);
  const fallbackMatched = ranked.slice(0, Math.min(2, ranked.length)).filter((item) => item.score <= 0.72);
  const selected = matched.length ? matched : fallbackMatched;
  if (!selected.length) {
    return { userProfile, userSegments, matched: [], matchingQuality: 'none' };
  }
  const aggregateTarget = s88ProfileFromSegments(selected.map((item) => item.segment));
  const avgScore = mean(selected.map((item) => item.score));
  const matchingQuality = selected.length >= 5 && avgScore <= 0.38 ? 'strong' : selected.length >= 3 && avgScore <= 0.52 ? 'medium' : 'weak';
  return {
    userProfile,
    userSegments,
    targetProfile: aggregateTarget,
    matched: selected,
    matchingQuality,
    matchedSegmentCount: selected.length,
    pitchDifference: mean(selected.map((item) => Math.abs(item.pitchDifference)).filter(Number.isFinite)),
    vowelDistance: mean(selected.map((item) => item.vowelDistance)),
    loudnessDifference: mean(selected.map((item) => item.loudnessDifference)),
    targetContaminationScore: mean(selected.map((item) => item.segment.contaminationScore)),
  };
}

function s88CompareProfiles(user, target) {
  if (!user || !target) return null;
  const deltaSn = target.phiSn - user.phiSn;
  const deltaEtex = target.phiEtex - user.phiEtex;
  const deltaBreath = target.breathiness - user.breathiness;
  const deltaClosure = target.closure - user.closure;
  const deltaTwang = target.twang - user.twang;
  const deltaOnset = target.onset - user.onset;
  return { deltaSn, deltaEtex, deltaBreath, deltaClosure, deltaTwang, deltaOnset };
}

function s88EvidenceLabel(result) {
  if (!result?.matchedSegmentCount) return '未找到匹配片段';
  if (result.matchedSegmentCount < 3) return '探索性建议';
  if (result.matchingQuality === 'strong') return '证据强';
  if (result.matchingQuality === 'medium') return '证据中等';
  return '证据较弱';
}

function s88MatchingQualityText(value) {
  return { strong: '强', medium: '中等', weak: '较弱', none: '无匹配' }[value] || '--';
}

function s88DominantVowelClass(segments = []) {
  const counts = segments.reduce((map, segment) => {
    const key = segment.vowelClass || 'unknown';
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '--';
}

function s88FormatPitchRange(range) {
  if (!Number.isFinite(range?.min) || !Number.isFinite(range?.max)) return '--';
  return `${Math.round(range.min)}-${Math.round(range.max)} Hz`;
}

function s88RenderMatchingStatus(result = s88LastMatchSummary) {
  if (!s88MatchingStatus) return;
  if (!s88TargetProfile) {
    s88MatchingStatus.textContent = '目标匹配：等待目标音频';
    return;
  }
  const duration = s88TargetProfile.durationMs ? formatTimeSeconds(s88TargetProfile.durationMs) : '--';
  const candidateCount = s88TargetProfile.candidateCount || 0;
  const matchedCount = result?.matchedSegmentCount || 0;
  const quality = result?.matchingQuality ? s88MatchingQualityText(result.matchingQuality) : '等待录音';
  const name = s88TargetProfile.sourceName || s88TargetSourceName || '目标音频';
  const pitchRange = s88FormatPitchRange(s88TargetProfile.pitchRange);
  const vowelClass = s88DominantVowelClass(result?.matched?.map((item) => item.segment) || s88TargetProfile.segments);
  s88MatchingStatus.textContent =
    `目标匹配：${name} / 已分析 ${duration} / 候选 ${candidateCount} 个 / 当前匹配 ${matchedCount} 个 / ${pitchRange} / ${vowelClass} / 质量：${quality}`;
}

function s88RenderMatchAdvanced(result) {
  if (s88MatchedSegmentCount) s88MatchedSegmentCount.textContent = result ? String(result.matchedSegmentCount || 0) : '--';
  if (s88MatchingQuality) s88MatchingQuality.textContent = result ? s88MatchingQualityText(result.matchingQuality) : '--';
  if (s88PitchDifference) {
    s88PitchDifference.textContent = result && Number.isFinite(result.pitchDifference)
      ? `${Math.round(result.pitchDifference)} cents`
      : '--';
  }
  if (s88VowelDistance) s88VowelDistance.textContent = result ? result.vowelDistance.toFixed(3) : '--';
  if (s88LoudnessDifference) s88LoudnessDifference.textContent = result ? result.loudnessDifference.toFixed(3) : '--';
  if (s88TargetContaminationScore) {
    s88TargetContaminationScore.textContent = result ? result.targetContaminationScore.toFixed(3) : '--';
  }
}

function s88CautiousRecommendationText(best, result) {
  const label = s88ActionLabels[best.key]?.label || '动作';
  const direction = best.state.direction;
  const matched = result?.matchedSegmentCount || 0;
  const supportingCount = result?.supportingCount || matched;
  if (direction === 'hold') {
    return {
      title: `${label}先保持稳定`,
      copy: `基于 ${matched} 个匹配目标片段，目前没有看到特别需要优先大幅调整的动作。`,
    };
  }
  const directionCopy = direction === 'up' ? '更明确' : '略微放松';
  return {
    title: `${label}可能需要${directionCopy}`,
    copy:
      `证据：${s88EvidenceLabel(result)}。基于 ${matched} 个匹配目标片段，其中 ${supportingCount} 个指向这个方向。` +
      '先做轻微调整，不要一次改变太多发声动作。',
  };
}

function s88RenderTargetComparison(result) {
  if (s88PhiSnDelta) s88PhiSnDelta.textContent = result ? s88FormatDelta(result.deltaSn) : '--';
  if (s88PhiEtexDelta) s88PhiEtexDelta.textContent = result ? s88FormatDelta(result.deltaEtex) : '--';
  s88RenderMatchAdvanced(result);
  s88RenderMatchingStatus(result);
  if (!result) {
    s88ResetActionCards();
    if (s88PathAction) s88PathAction.textContent = '推荐动作';
    if (s88PracticeMethod) s88PracticeMethod.textContent = '准备好目标音色和当前录音后，这里会给出具体练法。';
    if (s88Reason) s88Reason.textContent = '分析完成后，这里会解释为什么优先练这个动作。';
    return;
  }
  const actions = [
    { key: 'breathiness', value: result.deltaBreath, text: s88ReadableDirection(result.deltaBreath, '建议增加', '建议减少') },
    { key: 'closure', value: result.deltaClosure, text: s88ReadableDirection(result.deltaClosure, '建议增加', '建议放松') },
    { key: 'twang', value: result.deltaTwang, text: s88ReadableDirection(result.deltaTwang, '建议增加', '建议减少') },
    { key: 'onset', value: result.deltaOnset, text: s88ReadableDirection(result.deltaOnset, '建议更明确', '建议更柔和') },
  ].map((item) => ({ ...item, state: s88SetActionCard({ key: item.key, value: item.value, directionText: item.text }) }));
  const [best] = actions.sort((a, b) => b.state.abs - a.state.abs);
  result.supportingCount = Math.max(
    1,
    Math.round((result.matchedSegmentCount || 0) * (result.matchingQuality === 'strong' ? 0.8 : 0.65))
  );
  const text = s88RecommendationText(best);
  const cautiousText = s88CautiousRecommendationText(best, result);
  if (s88TrajectoryValue) s88TrajectoryValue.textContent = cautiousText.title;
  if (s88PathAction) s88PathAction.textContent = cautiousText.title;
  if (s88RecommendationStars) s88RecommendationStars.textContent = s88ReadableStars(best.state.stars);
  if (s88RecommendationConfidence) s88RecommendationConfidence.textContent = s88EvidenceLabel(result);
  if (s88Advice) s88Advice.textContent = cautiousText.copy;
  if (s88PracticeMethod) s88PracticeMethod.textContent = text.method;
  if (s88Reason) {
    s88Reason.textContent =
      `${text.reason} 当前比较对象不是整首目标音频，而是 ${result.matchedSegmentCount} 个音高、响度和元音更接近的目标片段。`;
  }
}

function s88UpdateCompareButton() {
  if (s88CompareButton) {
    s88CompareButton.disabled = !s88TargetProfile || !recordingTimelineFrames.length;
  }
  s88RenderTargetLibrarySelect();
  if (typeof setS88TrainingPhase === 'function' && trainingMode === 'action') {
    setS88TrainingPhase();
  }
}

function s88GetTargetLibraryItems() {
  return recordingLibrary.filter((item) => item?.blob);
}

function s88RenderTargetLibrarySelect() {
  if (!s88TargetLibrarySelect) {
    return;
  }
  const items = s88GetTargetLibraryItems();
  const previousValue = s88TargetLibraryId || s88TargetLibrarySelect.value || '';
  s88TargetLibrarySelect.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = items.length ? '选择一条录音作为目标音色' : '录音库暂无可用录音';
  s88TargetLibrarySelect.append(placeholder);

  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    const duration = item.durationMs ? `${formatTimeSeconds(item.durationMs)} · ` : '';
    option.textContent = `${getRecordingLibraryName(item)} · ${duration}${getRecordingLibraryTypeLabel(item)}`;
    s88TargetLibrarySelect.append(option);
  });

  s88TargetLibrarySelect.disabled = !items.length || s88TrainingPhase === 'loading-target' || s88TrainingPhase === 'analyzing';
  s88TargetLibrarySelect.value = items.some((item) => item.id === previousValue) ? previousValue : '';
}

async function s88LoadTargetFromLibrary(id) {
  const item = recordingLibrary.find((recording) => recording.id === id);
  if (!item?.blob) {
    return;
  }
  const name = getRecordingLibraryName(item);
  await s88LoadTargetVoice(getRecordingLibraryFile(item), {
    libraryId: item.id,
    sourceName: name,
  });
}

async function s88LoadTargetVoice(file, options = {}) {
  if (!file) return;
  if (s88TargetStatus) s88TargetStatus.textContent = '正在分析目标音色...';
  s88TargetProfile = null;
  s88TargetLibraryId = options.libraryId || null;
  s88TargetSourceName = options.sourceName || file.name || '';
  s88UserProfile = null;
  s88RenderTargetComparison(null);
  if (typeof setS88TrainingPhase === 'function') setS88TrainingPhase('loading-target');
  try {
    const frames = await s88ExtractTimbreFramesFromFile(file);
    s88TargetProfile = s88ProfileFromFrames(frames);
    if (!s88TargetProfile) throw new Error('No usable voice frames');
    if (s88TargetStatus) {
      s88TargetStatus.textContent = s88TargetSourceName
        ? `目标音色已选择：${s88TargetSourceName}`
        : '目标音色已上传';
    }
    if (s88UserStatus) s88UserStatus.textContent = '现在录制一段当前声音，系统会推荐下一步动作。';
  } catch (error) {
    console.error(error);
    s88TargetProfile = null;
    s88TargetLibraryId = null;
    s88TargetSourceName = '';
    if (s88TargetStatus) s88TargetStatus.textContent = '目标音色分析失败，请换一段清晰音频。';
    if (s88UserStatus) s88UserStatus.textContent = '请重新上传目标音色。';
  }
  s88UpdateCompareButton();
  if (typeof setS88TrainingPhase === 'function') setS88TrainingPhase();
}

function s88CompareLatestRecording() {
  if (!s88TargetProfile || !recordingTimelineFrames.length) {
    s88UpdateCompareButton();
    if (typeof setS88TrainingPhase === 'function') setS88TrainingPhase();
    return;
  }
  if (typeof setS88TrainingPhase === 'function') setS88TrainingPhase('analyzing');
  s88UserProfile = s88ProfileFromFrames(recordingTimelineFrames);
  if (!s88UserProfile) {
    if (s88UserStatus) s88UserStatus.textContent = '最近录音里没有检测到可用人声，请重新录制。';
    s88RenderTargetComparison(null);
    if (typeof setS88TrainingPhase === 'function') setS88TrainingPhase('needs-recording');
    return;
  }
  const result = s88CompareProfiles(s88UserProfile, s88TargetProfile);
  s88RenderTargetComparison(result);
  if (s88UserStatus) {
    s88UserStatus.textContent = '已生成动作建议。按推荐动作练一遍，再重新对比。';
  }
  if (typeof setS88TrainingPhase === 'function') setS88TrainingPhase('result');
}

async function s88LoadTargetVoice(file, options = {}) {
  if (!file) return;
  if (s88TargetStatus) s88TargetStatus.textContent = '正在分析目标音色...';
  s88TargetProfile = null;
  s88TargetSegments = [];
  s88TargetFrames = [];
  s88LastMatchSummary = null;
  s88TargetLibraryId = options.libraryId || null;
  s88TargetSourceName = options.sourceName || file.name || '';
  s88UserProfile = null;
  s88RenderTargetComparison(null);
  if (typeof setS88TrainingPhase === 'function') setS88TrainingPhase('loading-target');
  try {
    const frames = await s88ExtractTimbreFramesFromFile(file);
    s88TargetFrames = frames;
    s88TargetProfile = s88BuildTargetMatchingProfile(frames, s88TargetSourceName);
    if (!s88TargetProfile) throw new Error('No comparable target segments');
    s88TargetSegments = s88TargetProfile.segments || [];
    if (s88TargetStatus) {
      s88TargetStatus.textContent = s88TargetSourceName
        ? `目标音色已选择：${s88TargetSourceName}`
        : '目标音色已上传';
    }
    s88RenderMatchingStatus();
    if (s88UserStatus) s88UserStatus.textContent = '现在录制一段当前声音，系统会先匹配可比较片段，再推荐下一步动作。';
  } catch (error) {
    console.error(error);
    s88TargetProfile = null;
    s88TargetSegments = [];
    s88TargetFrames = [];
    s88LastMatchSummary = null;
    s88TargetLibraryId = null;
    s88TargetSourceName = '';
    if (s88TargetStatus) s88TargetStatus.textContent = '当前目标音频缺少可比较片段。';
    if (s88MatchingStatus) {
      s88MatchingStatus.textContent = '建议上传干声、稳定长音，或选择更清晰的人声片段。';
    }
    if (s88UserStatus) s88UserStatus.textContent = '系统不会基于整首歌硬生成建议，请重新选择目标音色。';
  }
  s88UpdateCompareButton();
  if (typeof setS88TrainingPhase === 'function') setS88TrainingPhase();
}

function s88CompareLatestRecording() {
  if (!s88TargetProfile || !recordingTimelineFrames.length) {
    s88UpdateCompareButton();
    if (typeof setS88TrainingPhase === 'function') setS88TrainingPhase();
    return;
  }
  if (typeof setS88TrainingPhase === 'function') setS88TrainingPhase('analyzing');
  const match = s88MatchUserToTarget(recordingTimelineFrames, s88TargetProfile);
  s88LastMatchSummary = match;
  s88UserProfile = match?.userProfile || s88ProfileFromFrames(recordingTimelineFrames);
  if (!s88UserProfile) {
    if (s88UserStatus) s88UserStatus.textContent = '最近录音里没有检测到可用人声，请重新录制。';
    s88RenderTargetComparison(null);
    if (typeof setS88TrainingPhase === 'function') setS88TrainingPhase('needs-recording');
    return;
  }
  if (!match?.matched?.length || !match.targetProfile) {
    s88RenderTargetComparison(null);
    s88RenderMatchingStatus(match);
    if (s88TrajectoryValue) s88TrajectoryValue.textContent = '暂无可靠推荐';
    if (s88RecommendationConfidence) s88RecommendationConfidence.textContent = '未找到匹配片段';
    if (s88Advice) s88Advice.textContent = '当前录音没有找到音高、响度和元音足够接近的目标片段，因此不生成动作建议。';
    if (s88UserStatus) s88UserStatus.textContent = '建议换一段更稳定的目标音频，或录一个更接近目标音高/元音的短句。';
    if (typeof setS88TrainingPhase === 'function') setS88TrainingPhase('result');
    return;
  }
  const result = {
    ...s88CompareProfiles(s88UserProfile, match.targetProfile),
    matchedSegmentCount: match.matchedSegmentCount,
    matchingQuality: match.matchingQuality,
    pitchDifference: match.pitchDifference,
    vowelDistance: match.vowelDistance,
    loudnessDifference: match.loudnessDifference,
    targetContaminationScore: match.targetContaminationScore,
    matched: match.matched,
  };
  s88LastMatchSummary = result;
  s88RenderTargetComparison(result);
  if (s88UserStatus) {
    s88UserStatus.textContent =
      result.matchedSegmentCount >= 3
        ? '已基于匹配片段生成动作建议。按推荐动作练一遍，再重新对比。'
        : '只找到少量可比较片段，当前建议仅作为探索方向。';
  }
  if (typeof setS88TrainingPhase === 'function') setS88TrainingPhase('result');
}

s88RerecordButton?.addEventListener('click', async () => {
  s88UserProfile = null;
  s88PracticeActive = false;
  s88RenderTargetComparison(null);
  setS88TrainingPhase('recording');
  const started = await startVoiceRecording();
  setS88TrainingPhase(started ? 'recording' : 'needs-recording');
});

s88AdvancedToggleButton?.addEventListener('click', () => {
  if (!s88AdvancedPanel) return;
  s88AdvancedPanel.hidden = false;
  s88AdvancedPanel.open = !s88AdvancedPanel.open;
  s88Dashboard?.classList.toggle('advanced-open', s88AdvancedPanel.open);
  s88AdvancedToggleButton.textContent = s88AdvancedPanel.open ? '收起高级分析' : '查看高级分析';
});

s88AdvancedPanel?.addEventListener('toggle', () => {
  s88Dashboard?.classList.toggle('advanced-open', s88AdvancedPanel.open);
  if (s88AdvancedToggleButton) {
    s88AdvancedToggleButton.textContent = s88AdvancedPanel.open ? '收起高级分析' : '查看高级分析';
  }
});
