// S84 memory training analysis helpers. This file is loaded before app.js and uses app-level state.

function memoryNeutralVector() {
  return { pitch: 0.45, loudness: 0.22, brightness: 0.42, breathiness: 0.24, stability: 0.62, phiSn: 0.62, phiEtex: 0.44, closure: 0.42 };
}

function memoryDistance(a, b) {
  const keys = Object.keys(b);
  const sum = keys.reduce((acc, key) => acc + (a[key] - b[key]) ** 2, 0);
  return Math.sqrt(sum / keys.length);
}

function memoryFrameVector(frame, index, frames) {
  const pitch = frame.pitch
    ? clamp01(normalizeRange(Math.log2(frame.pitch), Math.log2(90), Math.log2(700)))
    : 0.35;
  const loudness = clamp01(normalizeRange(rmsToDb(frame.rms || 0), -58, -16));
  const previous = frames[Math.max(0, index - 1)];
  const pitchDelta = frame.pitch && previous?.pitch ? Math.abs(getPitchDistanceCents(frame.pitch, previous.pitch)) : 0;
  const stability = clamp01(1 - normalizeRange(pitchDelta, 20, 180));
  const zcr = Number.isFinite(frame.zcr) ? clamp01(normalizeRange(frame.zcr, 0.015, 0.16)) : 0.28;
  const flatness = Number.isFinite(frame.spectralFlatness) ? clamp01(normalizeRange(frame.spectralFlatness, 0.02, 0.42)) : 0.32;
  const highFrequency = Number.isFinite(frame.highFrequencyRatio) ? clamp01(normalizeRange(frame.highFrequencyRatio, 0.02, 0.42)) : 0.25;
  const roughness = Number.isFinite(frame.waveformRoughness)
    ? frame.waveformRoughness
    : clamp01(normalizeRange(pitchDelta, 25, 220));
  const centroidBrightness = Number.isFinite(frame.spectralCentroid)
    ? clamp01(normalizeRange(frame.spectralCentroid, 700, 4200))
    : 0.35 + pitch * 0.35 + loudness * 0.2;
  const brightness = clamp01(0.62 * centroidBrightness + 0.24 * pitch + 0.14 * loudness);
  const continuity = frame.pitch ? 1 : 0.15;
  const harmonicityProxy = clamp01(0.55 * stability + 0.25 * continuity + 0.2 * (1 - roughness));
  const phiSn = clamp01(
    0.32 * harmonicityProxy +
      0.26 * stability +
      0.18 * continuity +
      0.12 * (1 - flatness) +
      0.12 * (1 - zcr)
  );
  const phiEtex = clamp01(0.38 * brightness + 0.22 * flatness + 0.2 * highFrequency + 0.2 * roughness);
  const breathiness = clamp01(0.56 * (1 - phiSn) + 0.24 * flatness + 0.2 * highFrequency);
  const closureRaw = 0.58 * phiSn + 0.18 * loudness + 0.16 * (1 - breathiness) + 0.08 * phiEtex;
  const pressedPenalty = Math.max(0, loudness - 0.72) * 0.22 + Math.max(0, roughness - 0.62) * 0.16;
  const closure = clamp01(closureRaw - pressedPenalty);
  return { pitch, loudness, brightness, breathiness, stability, phiSn, phiEtex, closure };
}

function memoryEffectiveRank(rows) {
  if (!rows.length) {
    return 1;
  }
  const dims = rows[0].length;
  const means = Array.from({ length: dims }, (_, dim) => mean(rows.map((row) => row[dim])));
  const variances = means.map((m, dim) => mean(rows.map((row) => (row[dim] - m) ** 2)));
  const total = variances.reduce((sum, value) => sum + value, 0);
  if (total <= 1e-9) {
    return 1;
  }
  const sorted = [...variances].sort((a, b) => b - a);
  let acc = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    acc += sorted[i];
    if (acc / total >= 0.9) {
      return i + 1;
    }
  }
  return dims;
}

function meanMemoryVector(frames) {
  const keys = ['pitch', 'loudness', 'brightness', 'breathiness', 'stability', 'phiSn', 'phiEtex', 'closure'];
  return Object.fromEntries(keys.map((key) => [key, mean(frames.map((frame) => frame.vector[key]))]));
}

function memoryVectorNeed(current, target) {
  return {
    phiSn: target.phiSn - current.phiSn,
    phiEtex: target.phiEtex - current.phiEtex,
    breathiness: target.breathiness - current.breathiness,
    closure: target.closure - current.closure,
    loudness: target.loudness - current.loudness,
  };
}

function memoryInstructionScore(need, instruction, current, hiddenLoad, recovery) {
  const next = {
    phiSn: current.phiSn + instruction.vector.phiSn,
    phiEtex: current.phiEtex + instruction.vector.phiEtex,
    breathiness: current.breathiness + instruction.vector.breathiness,
    closure: current.closure + instruction.vector.closure,
    loudness: current.loudness + instruction.vector.loudness,
  };
  const afterDistance = Math.sqrt(
    ['phiSn', 'phiEtex', 'breathiness', 'closure', 'loudness'].reduce(
      (sum, key) => sum + (need[key] - instruction.vector[key]) ** 2,
      0
    ) / 5
  );
  const pressedRisk = clamp01(
    Math.max(0, current.closure - 0.72) * 1.6 +
      Math.max(0, current.loudness - 0.72) * 1.2 +
      Math.max(0, recovery - 0.34) * 0.8
  );
  const closureOvershoot = Math.max(0, next.closure - 0.76);
  const instabilityPenalty = Math.max(0, 0.38 - next.phiSn) * 0.6;
  return clamp01(1 - afterDistance - closureOvershoot * 0.45 - instabilityPenalty - hiddenLoad * 0.14 - pressedRisk * 0.18);
}

function recommendMemoryInstruction(current, target, hiddenLoad, recovery) {
  const need = memoryVectorNeed(current, target);
  const selectedId = memoryInstructionSelect?.value || 'auto';
  const ranked = Object.entries(memoryControlInstructions)
    .map(([id, instruction]) => ({
      id,
      ...instruction,
      score: memoryInstructionScore(need, instruction, current, hiddenLoad, recovery),
    }))
    .sort((a, b) => b.score - a.score);
  if (selectedId !== 'auto' && memoryControlInstructions[selectedId]) {
    const selected = ranked.find((item) => item.id === selectedId);
    return { selected, best: ranked[0], need };
  }
  return { selected: ranked[0], best: ranked[0], need };
}

function analyzeMemoryPath() {
  if (!recordingTimelineFrames.length) {
    setMemoryEmptyState('请先录制一段音频，再分析最近录音。');
    return;
  }
  const durationMs = getRecordingDurationMs();
  const target = memoryTargets[memoryTargetSelect?.value || 'brightStable'] || memoryTargets.brightStable;
  const path = memoryPathClasses[memoryPathSelect?.value || 'neutralBright'] || memoryPathClasses.neutralBright;
  const frames = recordingTimelineFrames.map((frame, index) => ({
    time: frame.timeMs / 1000,
    vector: memoryFrameVector(frame, index, recordingTimelineFrames),
  }));
  const duration = Math.max(durationMs / 1000, frames[frames.length - 1]?.time || 0.1);
  const holdStart = duration * 0.4;
  const holdEnd = duration * 0.75;
  const holdFrames = frames.filter((frame) => frame.time >= holdStart && frame.time <= holdEnd);
  const recoveryFrames = frames.filter((frame) => frame.time > holdEnd);
  const activeFrames = holdFrames.length ? holdFrames : frames;
  const residualRows = frames.map((frame, index) => {
    const localTarget = frame.time > holdEnd ? memoryNeutralVector() : target;
    const residual = memoryDistance(frame.vector, localTarget);
    const lag2 = frames[Math.max(0, index - 2)];
    const lag5 = frames[Math.max(0, index - 5)];
    const velocity = index > 0 ? memoryDistance(frame.vector, frames[index - 1].vector) : 0;
    const components = [
      residual,
      memoryDistance(lag2.vector, localTarget),
      memoryDistance(lag5.vector, localTarget),
      velocity,
      Math.abs(frame.vector.breathiness - target.breathiness),
    ];
    return { residual, components, energy: clamp01(0.5 * components.reduce((sum, value) => sum + value * value, 0)) };
  });
  const soundError = mean(activeFrames.map((frame) => memoryDistance(frame.vector, target))) * path.soundBias;
  const hiddenLoad = mean(residualRows.map((row) => row.energy)) * path.hiddenBias;
  const rank = memoryEffectiveRank(residualRows.map((row) => row.components));
  const recoveryValues = recoveryFrames.map((frame) => memoryDistance(frame.vector, memoryNeutralVector()));
  const recovery = recoveryValues.length
    ? clamp01(0.65 * mean(recoveryValues.map((value, index) => value * ((index + 1) / recoveryValues.length))) + 0.35 * mean(recoveryValues.slice(-4)))
    : 0.5;
  const total = clamp01(0.45 * soundError + 0.3 * hiddenLoad + 0.15 * normalizeRange(rank, 1, 5) + 0.1 * recovery);
  const zone = classifyMemoryZone(soundError, hiddenLoad, recovery);
  const controlState = meanMemoryVector(activeFrames);
  const instruction = recommendMemoryInstruction(controlState, target, hiddenLoad, recovery);
  renderMemoryResult({ zone, soundError, hiddenLoad, rank, recovery, total, path, controlState, instruction });
}

function classifyMemoryZone(soundError, hiddenLoad, recovery) {
  if (soundError > 0.34) {
    return {
      id: 1,
      title: '目标未匹配',
      badge: '1',
      copy: '当前声音和目标音色还有明显距离。先调整音高、响度、明暗、气声比例或元音形状。',
    };
  }
  if (hiddenLoad > 0.2 || recovery > 0.36) {
    return {
      id: 2,
      title: '补偿性匹配',
      badge: '2',
      copy: '声音已经接近目标，但路径成本偏高。建议降低响度、放慢过渡、加入恢复段或换用重置练习。',
    };
  }
  return {
    id: 3,
    title: '稳定匹配',
    badge: '3',
    copy: '目标接近且隐藏负荷较低。可以逐步增加保持时长、音高范围或转换速度。',
  };
}

function renderMemoryResult(result) {
  memoryZoneCard.className = `memory-zone-card zone-${result.zone.id}`;
  memoryZoneTitle.textContent = result.zone.title;
  memoryZoneCopy.textContent = result.zone.copy;
  memoryZoneBadge.textContent = result.zone.badge;
  memorySoundError.textContent = result.soundError.toFixed(3);
  memoryHiddenLoad.textContent = result.hiddenLoad.toFixed(3);
  memoryRank.textContent = result.rank.toFixed(1);
  memoryRecovery.textContent = result.recovery.toFixed(3);
  memoryPhiSn.textContent = result.controlState.phiSn.toFixed(3);
  memoryPhiEtex.textContent = result.controlState.phiEtex.toFixed(3);
  memoryBreathiness.textContent = `${Math.round(result.controlState.breathiness * 100)}%`;
  memoryClosure.textContent = `${Math.round(result.controlState.closure * 100)}%`;
  const selected = result.instruction.selected;
  const best = result.instruction.best;
  const isManual = memoryInstructionSelect?.value && memoryInstructionSelect.value !== 'auto';
  memoryControlTitle.textContent = isManual
    ? `当前指令：${selected.label}`
    : `推荐指令：${selected.label}`;
  memoryControlCopy.textContent =
    selected.id === best.id
      ? selected.advice
      : `${selected.advice} 当前自动评分最高的是“${best.label}”，可作为下一轮对照。`;
  memoryControlScore.textContent = `${Math.round(selected.score * 100)}%`;
  memoryRecommendation.textContent = `${result.path.label}：${result.path.advice}  控制场总分 Ĵ = ${result.total.toFixed(
    3
  )}。目标差距：ΦSN ${formatSignedUnit(result.instruction.need.phiSn)}，ΦEtex ${formatSignedUnit(
    result.instruction.need.phiEtex
  )}，气声 ${formatSignedUnit(result.instruction.need.breathiness)}，闭合 ${formatSignedUnit(
    result.instruction.need.closure
  )}。`;
}

function setMemoryEmptyState(message) {
  if (!memoryZoneCard) {
    return;
  }
  memoryZoneCard.className = 'memory-zone-card';
  memoryZoneTitle.textContent = '等待分析';
  memoryZoneCopy.textContent = message;
  memoryZoneBadge.textContent = '--';
  memorySoundError.textContent = '--';
  memoryHiddenLoad.textContent = '--';
  memoryRank.textContent = '--';
  memoryRecovery.textContent = '--';
  memoryPhiSn.textContent = '--';
  memoryPhiEtex.textContent = '--';
  memoryBreathiness.textContent = '--';
  memoryClosure.textContent = '--';
  memoryControlTitle.textContent = '等待控制场分析';
  memoryControlCopy.textContent = 'S84 思路：比较目标差距和教学指令的预计移动方向，而不只判断当前声音像不像目标。';
  memoryControlScore.textContent = '--';
  memoryRecommendation.textContent = '暂无路径推荐。';
}

function formatSignedUnit(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}
