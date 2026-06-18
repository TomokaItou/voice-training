// Rhythm training helpers. Loaded before audio-engine.js and app.js.

function getRhythmBeatMs() {
  return 60000 / Math.max(40, Math.min(220, rhythmBpm || 90));
}

function getRhythmStepMs() {
  return rhythmPattern === 'eighth' ? getRhythmBeatMs() / 2 : getRhythmBeatMs();
}

function getRhythmHitWindowMs() {
  if (rhythmDifficulty === 'easy') return 150;
  if (rhythmDifficulty === 'hard') return 80;
  return 110;
}

function shouldUseSongRhythm() {
  return Boolean(rhythmUseSongPattern && songRhythmBeats.length);
}

function isRhythmSongPracticeActive() {
  return trainingMode === 'curve' && displayMode === 'pitch' && shouldUseSongRhythm();
}

function canUpdateRhythmTraining() {
  return trainingMode === 'rhythm' || isRhythmSongPracticeActive();
}

function getRhythmPracticeTimeMs(now = performance.now()) {
  if (isRhythmSongPracticeActive() && typeof getSongPracticeTimeMs === 'function') {
    return getSongPracticeTimeMs(now);
  }
  return Math.max(0, now - rhythmSessionStartTime);
}

function isRhythmTargetIndex(index) {
  if (index < 0) {
    return false;
  }
  if (rhythmPattern === 'backbeat') {
    const beatInBar = index % Math.max(1, rhythmBeatsPerBar);
    return beatInBar === 1 || beatInBar === 3;
  }
  return true;
}

function getClosestRhythmTarget(elapsedMs) {
  if (shouldUseSongRhythm()) {
    let closest = null;
    songRhythmBeats.forEach((beat, index) => {
      const offsetMs = elapsedMs - beat.timeMs;
      if (!closest || Math.abs(offsetMs) < Math.abs(closest.offsetMs)) {
        closest = { index, targetMs: beat.timeMs, offsetMs };
      }
    });
    return closest;
  }

  const stepMs = getRhythmStepMs();
  const estimate = Math.round(elapsedMs / stepMs);
  let closest = null;
  for (let index = Math.max(0, estimate - 8); index <= estimate + 8; index += 1) {
    if (!isRhythmTargetIndex(index)) {
      continue;
    }
    const targetMs = index * stepMs;
    const offsetMs = elapsedMs - targetMs;
    if (!closest || Math.abs(offsetMs) < Math.abs(closest.offsetMs)) {
      closest = { index, targetMs, offsetMs };
    }
  }
  return closest;
}

function updateRhythmConfig() {
  rhythmBpm = Math.max(40, Math.min(220, Number(rhythmBpmInput?.value || rhythmBpm || 90)));
  rhythmBeatsPerBar = Math.max(2, Math.min(4, Number(rhythmMeterSelect?.value || rhythmBeatsPerBar || 4)));
  rhythmPattern = rhythmPatternSelect?.value || rhythmPattern || 'quarter';
  rhythmDifficulty = rhythmDifficultySelect?.value || rhythmDifficulty || 'normal';
  rhythmUseSongPattern = Boolean(rhythmSongToggle?.checked && songRhythmBeats.length);
  if (rhythmBpmInput) {
    rhythmBpmInput.value = String(Math.round(rhythmBpm));
  }
  updateSongRhythmControls();
  renderRhythmTrack();
}

function resetRhythmTraining({ keepConfig = true } = {}) {
  if (!keepConfig) {
    rhythmBpm = Number(rhythmBpmInput?.value || 90);
    rhythmBeatsPerBar = Number(rhythmMeterSelect?.value || 4);
    rhythmPattern = rhythmPatternSelect?.value || 'quarter';
    rhythmDifficulty = rhythmDifficultySelect?.value || 'normal';
  }
  rhythmSessionStartTime = 0;
  rhythmLastBeatIndex = -1;
  rhythmLastOnsetTime = 0;
  rhythmPreviousRms = 0;
  rhythmRecentRms = [];
  rhythmEvents = [];
  rhythmCurrentStreak = 0;
  rhythmBestStreak = 0;
  renderRhythmTrack();
  updateRhythmDisplay();
}

function startRhythmTrainingSession(now = performance.now()) {
  updateRhythmConfig();
  rhythmSessionStartTime = now;
  rhythmLastBeatIndex = -1;
  rhythmLastOnsetTime = 0;
  rhythmPreviousRms = 0;
  rhythmRecentRms = [];
  rhythmEvents = [];
  rhythmCurrentStreak = 0;
  rhythmBestStreak = 0;
  updateRhythmDisplay();
}

function syncRhythmToSongPractice(now = performance.now()) {
  updateRhythmConfig();
  rhythmSessionStartTime = now - getRhythmPracticeTimeMs(now);
  rhythmLastBeatIndex = -1;
  rhythmLastOnsetTime = 0;
  rhythmPreviousRms = 0;
  rhythmRecentRms = [];
  rhythmEvents = [];
  rhythmCurrentStreak = 0;
  rhythmBestStreak = 0;
  updateRhythmDisplay();
}

function getRhythmStats() {
  const total = rhythmEvents.length;
  const hits = rhythmEvents.filter((event) => event.hit).length;
  const offsets = rhythmEvents.map((event) => Math.abs(event.offsetMs));
  const signedOffsets = rhythmEvents.map((event) => event.offsetMs).filter((value) => Number.isFinite(value));
  const meanOffset = offsets.length ? mean(offsets) : 0;
  const meanSignedOffset = signedOffsets.length ? mean(signedOffsets) : 0;
  const hitRate = total ? Math.round((hits / total) * 100) : 0;
  const timingScore = total
    ? Math.max(0, 100 - Math.round((meanOffset / getRhythmHitWindowMs()) * 55))
    : 0;
  const score = total ? Math.round(hitRate * 0.72 + timingScore * 0.28) : 0;
  return { total, hits, hitRate, meanOffset, meanSignedOffset, score };
}

function formatRhythmOffset(offsetMs) {
  if (!Number.isFinite(offsetMs)) {
    return '--';
  }
  const abs = Math.round(Math.abs(offsetMs));
  if (abs <= 12) {
    return '正中';
  }
  return offsetMs < 0 ? `早 ${abs} ms` : `晚 ${abs} ms`;
}

function updateRhythmDisplay(lastEvent = null) {
  const stats = getRhythmStats();
  if (rhythmScoreValue) {
    rhythmScoreValue.textContent = stats.total ? String(stats.score) : '--';
  }
  if (rhythmHitRateValue) {
    rhythmHitRateValue.textContent = stats.total ? `${stats.hitRate}%` : '--%';
  }
  if (rhythmAverageOffsetValue) {
    rhythmAverageOffsetValue.textContent = stats.total ? `${Math.round(stats.meanOffset)} ms` : '-- ms';
  }
  if (rhythmStreakValue) {
    rhythmStreakValue.textContent = `${rhythmCurrentStreak}`;
  }
  if (rhythmLastOffsetValue) {
    rhythmLastOffsetValue.textContent = lastEvent ? formatRhythmOffset(lastEvent.offsetMs) : '--';
  }
  if (rhythmCaption) {
    if (!rhythmSessionStartTime) {
      rhythmCaption.textContent = shouldUseSongRhythm()
        ? '点击开始后，会按当前歌曲提取出的拍点评分。'
        : '设置 BPM 后点击开始，跟着高亮拍点发短音。';
    } else if (!stats.total) {
      rhythmCaption.textContent = shouldUseSongRhythm()
        ? '按歌曲拍点唱“da”或拍手，系统会捕捉每次起音。'
        : '跟着节拍器唱“da”或拍手，系统会捕捉每次起音。';
    } else if (lastEvent?.hit) {
      rhythmCaption.textContent = rhythmCurrentStreak >= 4 ? '节奏连击很好，继续保持相同入口速度。' : '命中拍点，保持这个起音位置。';
    } else {
      rhythmCaption.textContent = lastEvent?.offsetMs < 0 ? '这次偏早，等拍点亮起再进。' : '这次偏晚，提前准备气口和辅音。';
    }
  }
  if (rhythmDashboard) {
    const tone = stats.score >= 82 ? 'good' : stats.score >= 62 ? 'close' : stats.total ? 'warn' : 'neutral';
    rhythmDashboard.dataset.tone = tone;
  }
  updateCombinedSongPracticeFeedback();
}

function getSongPracticeCombinedStats() {
  if (!isPitchCurveSongPracticeActive()) {
    return null;
  }
  const pitchStats = typeof computePitchScoreStats === 'function' ? computePitchScoreStats() : null;
  const rhythmStats = shouldUseSongRhythm() ? getRhythmStats() : null;
  if (!pitchStats && !rhythmStats?.total) {
    return null;
  }
  const pitchScore = pitchStats?.score ?? 0;
  const rhythmScore = rhythmStats?.total ? rhythmStats.score : 0;
  const score = pitchStats && rhythmStats?.total
    ? Math.round(pitchScore * 0.62 + rhythmScore * 0.38)
    : pitchStats
      ? pitchScore
      : rhythmScore;
  return { pitchStats, rhythmStats, score };
}

function updateCombinedSongPracticeFeedback() {
  const combined = getSongPracticeCombinedStats();
  if (!combined || !hasSongPitchTarget()) {
    return;
  }
  const pitchText = combined.pitchStats
    ? `音准 ${combined.pitchStats.score}% / 命中 ${combined.pitchStats.hitRate}%`
    : '音准 --';
  const rhythmText = combined.rhythmStats?.total
    ? `节奏 ${combined.rhythmStats.score}% / 命中 ${combined.rhythmStats.hitRate}%`
    : shouldUseSongRhythm()
      ? '节奏等待起音'
      : '节奏未启用';
  const tone = combined.score >= 82 ? 'good' : combined.score >= 62 ? 'warn' : 'bad';
  setSongTrainingResult(`综合 ${combined.score}% · ${pitchText} · ${rhythmText}`, tone);
  if (combined.pitchStats && combined.rhythmStats?.total) {
    const pitchOk = combined.pitchStats.score >= 75;
    const rhythmOk = combined.rhythmStats.score >= 75;
    const title = pitchOk && rhythmOk
      ? '音准和节奏都贴住了'
      : !pitchOk && !rhythmOk
        ? '先慢速拆开练'
        : pitchOk
          ? '音准不错，节奏再收紧'
          : '节奏不错，音准再贴旋律';
    const text = `${pitchText}，${rhythmText}。先把较低的一项拉到 75% 以上，再追求整段稳定。`;
    setTrainingFeedback(title, text, '跟唱', tone === 'bad' ? 'warn' : tone);
  }
}

function renderRhythmTrack(activeIndex = -1) {
  if (!rhythmTrack) {
    return;
  }
  const beats = Math.max(2, rhythmBeatsPerBar || 4);
  rhythmTrack.innerHTML = '';
  rhythmTrack.style.gridTemplateColumns = `repeat(${beats}, minmax(54px, 1fr))`;
  for (let beat = 0; beat < beats; beat += 1) {
    const marker = document.createElement('span');
    marker.dataset.beat = String(beat);
    marker.textContent = String(beat + 1);
    marker.classList.toggle('active', beat === activeIndex);
    marker.classList.toggle('target', rhythmPattern !== 'backbeat' || beat === 1 || beat === 3);
    rhythmTrack.append(marker);
  }
}

function updateSongRhythmControls() {
  const hasSongRhythm = songRhythmBeats.length > 0;
  if (rhythmSongToggle) {
    rhythmSongToggle.disabled = !hasSongRhythm;
    rhythmSongToggle.checked = Boolean(rhythmUseSongPattern && hasSongRhythm);
  }
  if (rhythmExtractButton) {
    rhythmExtractButton.disabled = !songRhythmSourceFile || songRhythmAnalysisInProgress;
    rhythmExtractButton.textContent = songRhythmAnalysisInProgress ? '提取中...' : '提取当前歌曲';
  }
  if (rhythmSourceStatus) {
    if (songRhythmAnalysisInProgress) {
      rhythmSourceStatus.textContent = '正在从当前歌曲分析节奏...';
    } else if (songRhythmSummary) {
      rhythmSourceStatus.textContent = `当前歌曲：${songRhythmSummary.sourceName || '未命名'} · ${Math.round(songRhythmSummary.bpm)} BPM · ${songRhythmSummary.beatCount} 个拍点 · 置信度 ${Math.round(songRhythmSummary.confidence * 100)}%`;
    } else if (songRhythmSourceFile) {
      rhythmSourceStatus.textContent = '当前歌曲可提取节奏。';
    } else {
      rhythmSourceStatus.textContent = '上传歌曲后会自动提取 BPM 和拍点。';
    }
  }
}

function smoothRhythmEnvelope(values, radius = 2) {
  return values.map((_, index) => {
    let total = 0;
    let count = 0;
    for (let i = Math.max(0, index - radius); i <= Math.min(values.length - 1, index + radius); i += 1) {
      total += values[i];
      count += 1;
    }
    return total / Math.max(1, count);
  });
}

function getSongRhythmOnsets(audioBuffer) {
  const data = getMonoChannelData(audioBuffer);
  const sampleRate = audioBuffer.sampleRate;
  const frameSize = Math.max(512, Math.round(sampleRate * 0.046));
  const hopSize = Math.max(128, Math.round(sampleRate * 0.012));
  const energies = [];
  const times = [];

  for (let offset = 0; offset + frameSize <= data.length; offset += hopSize) {
    let sum = 0;
    for (let i = offset; i < offset + frameSize; i += 1) {
      const value = data[i] || 0;
      sum += value * value;
    }
    energies.push(Math.sqrt(sum / frameSize));
    times.push((offset / sampleRate) * 1000);
  }

  if (energies.length < 12) {
    return [];
  }

  const smoothed = smoothRhythmEnvelope(energies, 2);
  const novelty = smoothed.map((value, index) => Math.max(0, value - (smoothed[index - 1] || value)));
  const threshold = percentile(novelty, 0.72);
  const minGapMs = 115;
  const onsets = [];

  for (let i = 2; i < novelty.length - 2; i += 1) {
    const value = novelty[i];
    if (
      value < Math.max(0.0035, threshold * 1.2) ||
      value < novelty[i - 1] ||
      value < novelty[i + 1]
    ) {
      continue;
    }
    const timeMs = times[i];
    const previous = onsets[onsets.length - 1];
    if (previous && timeMs - previous.timeMs < minGapMs) {
      if (value > previous.strength) {
        previous.timeMs = timeMs;
        previous.strength = value;
      }
      continue;
    }
    onsets.push({ timeMs, strength: value });
  }

  return onsets;
}

function estimateSongRhythmBpm(onsets, durationMs) {
  if (onsets.length < 4) {
    return null;
  }
  const candidates = new Map();
  for (let i = 0; i < onsets.length; i += 1) {
    for (let j = i + 1; j < Math.min(onsets.length, i + 9); j += 1) {
      const interval = onsets[j].timeMs - onsets[i].timeMs;
      if (interval < 180 || interval > 2000) {
        continue;
      }
      let bpm = 60000 / interval;
      while (bpm < 70) bpm *= 2;
      while (bpm > 180) bpm /= 2;
      const bucket = Math.round(bpm);
      const weight = onsets[i].strength + onsets[j].strength;
      candidates.set(bucket, (candidates.get(bucket) || 0) + weight);
    }
  }
  if (!candidates.size) {
    return null;
  }
  const ranked = [...candidates.entries()].sort((a, b) => b[1] - a[1]);
  const bpm = ranked[0][0];
  const confidence = Math.min(1, ranked[0][1] / Math.max(1e-6, ranked.slice(0, 5).reduce((sum, item) => sum + item[1], 0)));
  return { bpm, confidence, durationMs };
}

function buildSongRhythmBeats(onsets, bpm, durationMs) {
  const beatMs = 60000 / bpm;
  const searchWindowMs = Math.min(180, beatMs * 0.32);
  const strongOnsets = [...onsets].sort((a, b) => b.strength - a.strength).slice(0, 18);
  let best = null;

  strongOnsets.forEach((onset) => {
    const startOffset = ((onset.timeMs % beatMs) + beatMs) % beatMs;
    let score = 0;
    onsets.forEach((candidate) => {
      const phase = ((candidate.timeMs - startOffset) % beatMs + beatMs) % beatMs;
      const distance = Math.min(phase, beatMs - phase);
      if (distance <= searchWindowMs) {
        score += candidate.strength * (1 - distance / searchWindowMs);
      }
    });
    if (!best || score > best.score) {
      best = { startOffset, score };
    }
  });

  const offset = best?.startOffset ?? onsets[0]?.timeMs ?? 0;
  const beats = [];
  let timeMs = offset;
  while (timeMs > beatMs) {
    timeMs -= beatMs;
  }
  for (; timeMs <= durationMs + beatMs * 0.5; timeMs += beatMs) {
    if (timeMs >= 0) {
      beats.push({ timeMs, strength: 1 });
    }
  }
  return beats;
}

function applySongRhythmAnalysis(result, sourceName = '') {
  songRhythmBeats = result.beats;
  songRhythmBpm = result.bpm;
  songRhythmSummary = {
    sourceName,
    bpm: result.bpm,
    beatCount: result.beats.length,
    confidence: result.confidence,
    durationMs: result.durationMs,
  };
  rhythmUseSongPattern = true;
  rhythmBpm = result.bpm;
  if (rhythmBpmInput) {
    rhythmBpmInput.value = String(Math.round(result.bpm));
  }
  if (rhythmPatternSelect) {
    rhythmPatternSelect.value = 'quarter';
  }
  rhythmPattern = 'quarter';
  updateSongRhythmControls();
  renderRhythmTrack();
  updateRhythmDisplay();
  if (trainingMode === 'curve' && displayMode === 'pitch') {
    setReadoutMode('pitch');
  }
}

function extractSongRhythmFromBuffer(audioBuffer, sourceName = '') {
  const onsets = getSongRhythmOnsets(audioBuffer);
  const durationMs = audioBuffer.duration * 1000;
  const tempo = estimateSongRhythmBpm(onsets, durationMs);
  if (!tempo) {
    return null;
  }
  const beats = buildSongRhythmBeats(onsets, tempo.bpm, durationMs);
  if (beats.length < 4) {
    return null;
  }
  return {
    bpm: tempo.bpm,
    confidence: tempo.confidence,
    durationMs,
    onsets,
    beats,
    sourceName,
  };
}

async function analyzeSongRhythmFile(file, { silent = false } = {}) {
  if (!file || songRhythmAnalysisInProgress) {
    return null;
  }
  songRhythmAnalysisInProgress = true;
  songRhythmSourceFile = file;
  if (!silent) {
    updateSongRhythmControls();
  }
  try {
    const audioBuffer = await decodeAudioFile(file);
    const result = extractSongRhythmFromBuffer(audioBuffer, file.name);
    if (!result) {
      if (rhythmSourceStatus) {
        rhythmSourceStatus.textContent = '这首歌节奏不够清晰，暂时没有提取到稳定 BPM。';
      }
      songRhythmBeats = [];
      songRhythmBpm = null;
      songRhythmSummary = null;
      rhythmUseSongPattern = false;
      updateSongRhythmControls();
      return null;
    }
    applySongRhythmAnalysis(result, file.name);
    return result;
  } catch (error) {
    console.error(error);
    if (rhythmSourceStatus) {
      rhythmSourceStatus.textContent = '节奏提取失败，请换 wav/mp3 或重新上传。';
    }
    return null;
  } finally {
    songRhythmAnalysisInProgress = false;
    updateSongRhythmControls();
  }
}

function playRhythmClick(isAccent = false) {
  if (!rhythmClickToggle?.checked || !audioContext) {
    return;
  }
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.frequency.value = isAccent ? 1180 : 820;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(isAccent ? 0.11 : 0.075, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.07);
}

function updateRhythmBeat(now) {
  if (!rhythmSessionStartTime) {
    return;
  }
  const beatMs = getRhythmBeatMs();
  const elapsedMs = getRhythmPracticeTimeMs(now);
  const beatIndex = Math.floor(elapsedMs / beatMs);
  if (beatIndex === rhythmLastBeatIndex) {
    return;
  }
  rhythmLastBeatIndex = beatIndex;
  const beatInBar = beatIndex % Math.max(1, rhythmBeatsPerBar);
  renderRhythmTrack(beatInBar);
  playRhythmClick(beatInBar === 0);
}

function detectRhythmOnset(now, rms) {
  rhythmRecentRms.push(rms);
  if (rhythmRecentRms.length > 24) {
    rhythmRecentRms.shift();
  }
  const floor = percentile(rhythmRecentRms, 0.45);
  const minGapMs = rhythmPattern === 'eighth' ? 105 : 135;
  const threshold = Math.max(0.028, floor * 2.4);
  const delta = rms - rhythmPreviousRms;
  const hasOnset = rms >= threshold && delta >= Math.max(0.014, floor * 0.9);
  rhythmPreviousRms = rms;
  if (!hasOnset || now - rhythmLastOnsetTime < minGapMs || !rhythmSessionStartTime) {
    return null;
  }
  rhythmLastOnsetTime = now;
  const elapsedMs = getRhythmPracticeTimeMs(now);
  const closest = getClosestRhythmTarget(elapsedMs);
  if (!closest) {
    return null;
  }
  const hit = Math.abs(closest.offsetMs) <= getRhythmHitWindowMs();
  rhythmCurrentStreak = hit ? rhythmCurrentStreak + 1 : 0;
  rhythmBestStreak = Math.max(rhythmBestStreak, rhythmCurrentStreak);
  const event = {
    timeMs: elapsedMs,
    targetMs: closest.targetMs,
    offsetMs: closest.offsetMs,
    hit,
  };
  rhythmEvents.push(event);
  if (rhythmEvents.length > 160) {
    rhythmEvents.shift();
  }
  updateRhythmDisplay(event);
  return event;
}

function updateRhythmTraining(now, rms) {
  updateRhythmBeat(now);
  detectRhythmOnset(now, rms);
}
