updateCanvasScale(canvasScale);
drawVocalScorePlaceholder();
setVocalScoreView(vocalScoreView);
initWindowResize();
showLauncherView();
updateMeterVisibility();
updateRecordingButtons();
loadRecordingLibrary();
loadAccompanimentLibrary();
loadSuccessLibrary();
updateAccompanimentButtons(false);
updateSongPitchPlaybackButtons();
updatePitchAccuracyButton();
setPitchAccuracyResult('--');
resetBreathCalibration();
loadRangeHistory();
renderRangeHistory();
initBgmSystem();
initMiraPresence();

function getOfflineTrackDurationMs(history = pitchHistory) {
  if (!history.length) {
    return 0;
  }
  const firstTime = history[0]?.time || 0;
  const lastTime = history[history.length - 1]?.time || 0;
  return Math.max(0, lastTime - firstTime);
}

function clampOfflineWindowStart(startMs, durationMs = getOfflineTrackDurationMs()) {
  const maxStart = Math.max(0, durationMs - offlineWindowDurationMs);
  return Math.max(0, Math.min(Number(startMs) || 0, maxStart));
}

function resetOfflineWindow(startMs = 0) {
  offlineWindowStartMs = clampOfflineWindowStart(startMs);
}

function updateOfflineWindowControl(durationMs = getOfflineTrackDurationMs(), visibleStartMs = offlineWindowStartMs) {
  if (!offlineWindowControl || !offlineWindowRange) {
    return;
  }

  const shouldShow = offlineMode && durationMs > offlineWindowDurationMs;
  offlineWindowControl.hidden = !shouldShow;
  if (!shouldShow) {
    return;
  }

  const maxStart = Math.max(0, durationMs - offlineWindowDurationMs);
  const clampedStart = clampOfflineWindowStart(visibleStartMs, durationMs);
  if (clampedStart !== offlineWindowStartMs) {
    offlineWindowStartMs = clampedStart;
  }

  offlineWindowRange.max = String(maxStart / 1000);
  offlineWindowRange.step = '0.1';
  offlineWindowRange.value = String(clampedStart / 1000);
  if (offlineWindowStartValue) {
    offlineWindowStartValue.textContent = formatTimeSeconds(clampedStart);
  }
  if (offlineWindowEndValue) {
    offlineWindowEndValue.textContent = formatTimeSeconds(
      Math.min(durationMs, clampedStart + offlineWindowDurationMs)
    );
  }
  if (offlineWindowDurationValue) {
    offlineWindowDurationValue.textContent = `${formatTimeSeconds(durationMs)} 全长`;
  }
}

function mean(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) {
    return 0;
  }
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function normalizeRange(value, min, max) {
  return (value - min) / Math.max(max - min, 1e-9);
}

function isBreathTrainingActive() {
  return displayMode === 'breath' && Boolean(audioContext && sourceNode) && !breathCalibrationInProgress;
}

function updateBreathTrainingControls() {
  if (trainingMode !== 'breath' && displayMode !== 'breath') {
    return;
  }
  const active = isBreathTrainingActive();
  if (breathCalibrateButton) {
    breathCalibrateButton.hidden = true;
  }
  if (breathDetailToggleButton) {
    breathDetailToggleButton.hidden = !breathSessionCompleted;
    breathDetailToggleButton.disabled = active || breathCalibrationInProgress;
    breathDetailToggleButton.textContent = breathDetailPanel?.open ? '收起详细数据' : '查看详细数据';
  }
  if (pauseButton) {
    pauseButton.hidden = true;
  }
  if (stopButton) {
    stopButton.hidden = true;
  }
  if (statusEl) {
    statusEl.hidden = true;
  }
  if (startButton) {
    startButton.hidden = false;
    startButton.disabled = breathCalibrationInProgress;
    if (breathCalibrationInProgress) {
      startButton.textContent = '校准中...';
    } else if (!breathCalibration.calibrated) {
      startButton.textContent = '校准环境';
    } else if (active) {
      startButton.textContent = '结束检测';
    } else if (breathSessionCompleted) {
      startButton.textContent = '再测一次';
    } else {
      startButton.textContent = '开始检测';
    }
  }
}

function setReadoutMode(mode) {
  const pitchReadouts = [pitchValueEl?.closest('div'), noteValueEl?.closest('div')];
  const breathReadouts = document.querySelectorAll('.breath-readout');
  const breathControls = document.querySelectorAll('.breath-control');
  const readout = document.querySelector('.readout');
  const chart = canvas?.closest('.chart');
  const practiceControls = document.getElementById('practiceControls');
  const isBreath = mode === 'breath';
  const isScore = mode === 'score';
  const isRange = mode === 'range';
  const isVolume = mode === 'volume';
  const isFormants = mode === 'formants';
  const isMemory = mode === 'memory';
  const isRhythm = mode === 'rhythm';
  const isAction = mode === 'action';
  const isFix = mode === 'fix';
  const isSongPracticeRhythm = mode === 'pitch' && trainingMode === 'curve' && shouldUseSongRhythm();
  const isSongPracticeMode = mode === 'pitch' && trainingMode === 'curve';
  const isScoreTrainingMode = trainingMode === 'score' || mode === 'score';
  const isSongPracticeRecording = Boolean(mediaRecorder && mediaRecorder.state !== 'inactive');
  const isDetecting = Boolean(audioContext && sourceNode);
  const isBreathActive = isBreath && isDetecting && !breathCalibrationInProgress;
  const shouldShowSongPracticeChart =
    !isSongPracticeMode || isSongPracticeRecording || Boolean(lastRecordingBlob || songPracticeLastReview);
  const shouldShowScoreChart = !isScoreTrainingMode || isDetecting || hasRecentPitchData();
  chart?.classList.toggle('spectrogram-analyzer', mode === 'spectrogram');
  chart?.classList.toggle('song-game-lane', isSongGameLaneActive());
  chart?.classList.toggle('song-practice-empty', isSongPracticeMode && !shouldShowSongPracticeChart);
  chart?.classList.toggle('score-practice-empty', isScoreTrainingMode && !shouldShowScoreChart);
  if (chart) {
    chart.hidden =
      isRhythm ||
      isRange ||
      isMemory ||
      isAction ||
      isFix ||
      (isSongPracticeMode && !shouldShowSongPracticeChart) ||
      (isScoreTrainingMode && !shouldShowScoreChart) ||
      (isBreath && !isBreathActive && !breathSessionCompleted);
  }
  if (songChartPlaceholder) {
    songChartPlaceholder.hidden = !isSongPracticeMode || shouldShowSongPracticeChart;
  }
  if (scoreChartPlaceholder) {
    scoreChartPlaceholder.hidden = !isScoreTrainingMode || shouldShowScoreChart;
  }
  if (breathChartPlaceholder) {
    breathChartPlaceholder.hidden = !isBreath || isBreathActive || breathSessionCompleted;
  }
  if (practiceControls) {
    practiceControls.hidden = isSongPracticeMode || isFix;
    practiceControls.classList.toggle('score-controls', isScoreTrainingMode);
    practiceControls.classList.toggle('breath-controls', isBreath);
    practiceControls.classList.toggle('range-controls', isRange);
    practiceControls.classList.toggle('memory-controls-mode', isMemory);
    practiceControls.classList.toggle('action-controls', isAction);
  }
  if (statusEl) {
    statusEl.hidden = isScoreTrainingMode;
  }
  updateMeterVisibility(mode);
  if (stopButton) {
    stopButton.textContent = '停止';
  }
  if (mode !== 'pitch' && mode !== 'score' && mode !== 'memory' && mode !== 'action') {
    updatePitchInspector(null);
  }
  if (breathDashboard) {
    breathDashboard.hidden = !isBreath;
  }
  if (pitchScoreDashboard) {
    pitchScoreDashboard.hidden = !shouldShowPitchScorePanel(mode) || isSongPracticeMode;
  }
  if (rangeDashboard) {
    rangeDashboard.hidden = !isRange;
  }
  if (rangeHistoryPanel) {
    rangeHistoryPanel.hidden = !isRange || !rangeHistoryExpanded || rangeTrainingPhase !== 'complete';
  }
  if (songTargetPanel) {
    songTargetPanel.hidden = mode !== 'pitch' || trainingMode !== 'curve' || trainingMode === 'score' || isFix;
  }
  if (trainingFeedbackPanel) {
    trainingFeedbackPanel.hidden = isVolume || isFormants || mode === 'spectrogram' || isSongPracticeMode || isFix;
  }
  if (fixOneThingPanel) {
    fixOneThingPanel.hidden = !isFix;
  }
  if (memoryDashboard) {
    memoryDashboard.hidden = !isMemory;
  }
  if (s88Dashboard) {
    s88Dashboard.hidden = !isAction;
  }
  if (s88LiveFeedbackPanel) {
    s88LiveFeedbackPanel.hidden = !isAction || s88TrainingPhase !== 'practicing';
  }
  if (rhythmDashboard) {
    rhythmDashboard.hidden = !isRhythm;
    rhythmDashboard.classList.toggle('song-practice', isSongPracticeRhythm);
  }
  if (readout) {
    readout.hidden =
      isVolume ||
      isFormants ||
      isMemory ||
      isRhythm ||
      isAction ||
      isFix ||
      isRange ||
      isSongPracticeMode ||
      isScoreTrainingMode ||
      isBreath;
    readout.classList.toggle('readout-breath-compact', isBreath);
  }
  pitchReadouts.forEach((el) => {
    if (el) {
      el.hidden = isBreath || isVolume || isFormants || isRhythm || isAction || isFix;
    }
  });
  breathReadouts.forEach((el) => {
    el.hidden = true;
  });
  breathControls.forEach((el) => {
    el.hidden = !isBreath;
  });
  if (pauseButton) {
    pauseButton.hidden = isScoreTrainingMode;
  }
  if (stopButton) {
    stopButton.hidden = isScoreTrainingMode;
  }
  if (breathReport) {
    breathReport.hidden = !isBreath || !breathReport.dataset.hasReport;
  }
  if (breathDetailPanel) {
    breathDetailPanel.hidden = !isBreath;
  }
  if (chart) {
    chart.classList.toggle('breath-practice-empty', isBreath && !isBreathActive && !breathSessionCompleted);
  }
  if (chartLegendLow && chartLegendHigh) {
    chartLegendLow.textContent =
      isBreath ? '弱' : mode === 'volume' ? '安静' : mode === 'spectrogram' ? '65 Hz / C2' : '低音';
    chartLegendHigh.textContent =
      isBreath ? '强' : mode === 'volume' ? '响亮' : mode === 'spectrogram' ? '4.2 kHz / C8' : '高音';
  }
  if (chartLegendLow && chartLegendHigh && isFormants) {
    chartLegendLow.textContent = 'F1';
    chartLegendHigh.textContent = 'F2';
  }
  updateBreathTrainingControls();
  if (isRange) {
    setRangeTrainingPhase(rangeTrainingPhase);
  }
  if (isMemory) {
    setMemoryTrainingPhase(memoryTrainingPhase);
  }
}

function percentile(values, ratio) {
  const clean = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!clean.length) {
    return 0;
  }
  const index = Math.min(clean.length - 1, Math.max(0, Math.floor((clean.length - 1) * ratio)));
  return clean[index];
}

async function updateVolumeMeter(rms) {
  if (!volumeMeterBar) {
    return;
  }
  if (rms === null || rms === undefined) {
    volumeMeterBar.style.height = '0%';
    return;
  }
  const db = 20 * Math.log10(Math.max(rms, 1e-5));
  const clamped = Math.max(volumeMeterMinDb, Math.min(volumeMeterMaxDb, db));
  const ratio = (clamped - volumeMeterMinDb) / (volumeMeterMaxDb - volumeMeterMinDb);
  volumeMeterBar.style.height = `${Math.round(ratio * 100)}%`;
}

function appendVolumePoint(time, rms) {
  volumeHistory.push({
    time,
    rms,
    db: rmsToDb(rms),
  });
  if (!offlineMode && volumeHistory.length > 2) {
    const minTime = time - maxHistorySeconds * 1000;
    volumeHistory = volumeHistory.filter((point) => point.time >= minTime);
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function updateSpectralTilt() {
  if (!tiltMeterBar || !analyser || !frequencyData) {
    return;
  }
  analyser.getFloatFrequencyData(frequencyData);
  const nyquist = audioContext ? audioContext.sampleRate / 2 : 0;
  if (!nyquist) {
    tiltMeterBar.style.height = '0%';
    return;
  }

  const binResolution = nyquist / frequencyData.length;
  const bandAverage = (minHz, maxHz) => {
    const start = Math.max(0, Math.floor(minHz / binResolution));
    const end = Math.min(frequencyData.length - 1, Math.ceil(maxHz / binResolution));
    let sum = 0;
    let count = 0;
    for (let i = start; i <= end; i += 1) {
      const value = frequencyData[i];
      if (Number.isFinite(value)) {
        sum += value;
        count += 1;
      }
    }
    return count > 0 ? sum / count : -120;
  };

  const lowDb = bandAverage(tiltLowBandHz.min, tiltLowBandHz.max);
  const highDb = bandAverage(tiltHighBandHz.min, tiltHighBandHz.max);
  const tiltDb = highDb - lowDb;
  const clamped = Math.max(tiltMeterMinDb, Math.min(tiltMeterMaxDb, tiltDb));
  const ratio = (clamped - tiltMeterMinDb) / (tiltMeterMaxDb - tiltMeterMinDb);
  tiltMeterBar.style.height = `${Math.round(ratio * 100)}%`;
}

function median(values) {
  if (!values.length) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function pushPitchSample(buffer, value) {
  const nextBuffer = [...buffer, value].slice(-pitchMedianWindowSize);
  return nextBuffer;
}

function getMaxJumpThresholdHz(reference) {
  if (!reference) {
    return pitchMaxJumpHz;
  }
  const centsFactor = Math.pow(2, pitchMaxJumpCents / 1200) - 1;
  const centsJump = reference * centsFactor;
  return Math.min(pitchMaxJumpHz, centsJump);
}

function getPitchDistanceCents(a, b) {
  if (!a || !b) {
    return 0;
  }
  return Math.abs(1200 * Math.log2(a / b));
}

function isNearOctaveJump(a, b) {
  const distance = getPitchDistanceCents(a, b);
  return Math.abs(distance - 1200) <= pitchOctaveSpikeToleranceCents;
}

function selectPitchCandidate(pitch, reference) {
  if (!pitch) return null;
  if (!reference) return pitch;

  // 用音程差判断是否可能是倍频误判。
  const cents = (a, b) => 1200 * Math.log2(a / b);
  const absCents = (a, b) => Math.abs(cents(a, b));

  // 如果当前 pitch 已经离 reference 很远，不强行折半或翻倍贴近参考音。
  const farEnough = absCents(pitch, reference) > 300;
  if (farEnough) return pitch;

  // 只有在看起来确实像倍频误判时才纠正。
  const c0 = absCents(pitch, reference);
  const cHalf = absCents(pitch / 2, reference);
  const cDouble = absCents(pitch * 2, reference);

  let best = pitch;
  let bestC = c0;

  if (cHalf < bestC) { bestC = cHalf; best = pitch / 2; }
  if (cDouble < bestC) { bestC = cDouble; best = pitch * 2; }

  // 再加一道门：纠正后的结果必须真的更接近，并且落在较小误差内。
  if (best !== pitch && bestC <= 80) return best;

  return pitch;
}

function appendPitchBreak(time) {
  if (!pitchHistory.length || pitchHistory[pitchHistory.length - 1].pitch !== null) {
    pitchHistory.push({ time, pitch: null });
  }
}

function applyPitchEma(previous, next) {
  if (!next) {
    return previous;
  }
  if (!previous) {
    return next;
  }
  return previous + pitchEmaAlpha * (next - previous);
}

function limitJump(previous, next, maxJump) {
  if (previous === null || previous === undefined) {
    return next;
  }
  const delta = next - previous;
  if (Math.abs(delta) <= maxJump) {
    return next;
  }
  return previous + Math.sign(delta) * maxJump;
}

function hasRecentPitchData() {
  if (offlineMode) {
    return pitchHistory.some((point) => point.pitch);
  }
  const now = performance.now();
  const minTime = now - maxHistorySeconds * 1000;
  return pitchHistory.some((point) => point.time >= minTime && point.pitch);
}

async function startPracticeSession() {
  if (typeof hideGameReward === 'function') {
    hideGameReward();
  }
  if (trainingMode === 'action') {
    const phase = s88TrainingPhase || inferS88TrainingPhase();
    if (phase === 'needs-target') {
      if (s88TargetLibrarySelect && s88TargetLibrarySelect.options.length > 1) {
        s88TargetLibrarySelect.focus();
      } else {
        s88TargetInput?.click();
      }
      return;
    }
    if (phase === 'loading-target' || phase === 'analyzing') {
      return;
    }
    if (phase === 'recording') {
      setS88TrainingPhase('analyzing');
      stopVoiceRecording();
      return;
    }
    if (phase === 'practicing') {
      stopPracticeSession();
      return;
    }
    if (phase === 'result') {
      s88PracticeActive = true;
      await start();
      setS88TrainingPhase('practicing');
      return;
    }
    s88UserProfile = null;
    s88RenderTargetComparison(null);
    setS88TrainingPhase('recording');
    const started = await startVoiceRecording();
    setS88TrainingPhase(started ? 'recording' : 'needs-recording');
    return;
  }
  if (trainingMode === 'memory') {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      setMemoryTrainingPhase('analyzing');
      stopVoiceRecording();
      return;
    }
    memoryHasResult = false;
    setMemoryTrainingPhase('recording');
    const started = await startVoiceRecording();
    setMemoryTrainingPhase(started ? 'recording' : 'ready');
    return;
  }
  if (trainingMode === 'range') {
    if (audioContext && sourceNode) {
      rangeTrainingPhase = rangeSamples.length >= 1 ? 'complete' : 'ready';
      stopPracticeSession();
      return;
    }
    rangeSamples = [];
    rangeLastPitch = null;
    rangeHistoryExpanded = false;
    rangeTrainingPhase = 'testing';
    setRangeTrainingPhase('testing');
    await start();
    setRangeTrainingPhase('testing');
    return;
  }
  if (trainingMode === 'breath' || displayMode === 'breath') {
    if (breathCalibrationInProgress) {
      return;
    }
    if (!breathCalibration.calibrated) {
      await calibrateBreathEnvironment();
      setReadoutMode('breath');
      updateBreathTrainingControls();
      return;
    }
    if (isBreathTrainingActive()) {
      stopPracticeSession();
      setReadoutMode('breath');
      updateBreathTrainingControls();
      return;
    }
    breathSessionCompleted = false;
    clearBreathReport();
    await start();
    setReadoutMode('breath');
    updateBreathTrainingControls();
    return;
  }
  if (trainingMode === 'score' && audioContext && sourceNode) {
    stopPracticeSession();
    return;
  }
  if (practicePaused) {
    await resumePracticeSession();
    return;
  }
  if (shouldRecordWithMainSession()) {
    await startVoiceRecording();
    return;
  }
  await start();
}

async function pausePracticeSession() {
  if (practicePaused) {
    return;
  }
  const now = performance.now();
  practicePaused = true;
  songPracticePausedTimeMs = getSongPracticeTimeMs(now);
  resumeSongPitchOnPracticeResume = Boolean(songPitchAudio && !songPitchAudio.paused);
  resumeAccompanimentOnPracticeResume = Boolean(accompanimentAudio && !accompanimentAudio.paused);

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (songPitchAudio && !songPitchAudio.paused) {
    songPitchAudio.pause();
    stopSongPitchPlaybackProgress();
    setSongPitchPlaybackStatus(`已暂停 ${formatTimeSeconds(songPitchAudio.currentTime * 1000)}`);
  }
  if (accompanimentAudio && !accompanimentAudio.paused) {
    accompanimentAudio.pause();
    setAccompanimentStatus('已暂停');
  }
  if (mediaRecorder && mediaRecorder.state === 'recording' && typeof mediaRecorder.pause === 'function') {
    mediaRecorder.pause();
  }
  if (audioContext?.state === 'running') {
    await audioContext.suspend();
  }

  startButton.disabled = false;
  startButton.textContent = '继续练习';
  if (pauseButton) {
    pauseButton.disabled = true;
  }
  stopButton.disabled = false;
  setStatus('已暂停');
  updateSongPracticeFlow('已暂停，可继续');
  drawPitchHistory();
}

async function resumePracticeSession() {
  const resumeStartedAt = performance.now();
  const shouldResumeSongPitch = resumeSongPitchOnPracticeResume;
  const shouldResumeAccompaniment = resumeAccompanimentOnPracticeResume;
  if (Number.isFinite(songPracticePausedTimeMs) && hasSongPitchTarget()) {
    songPracticeStartTime = resumeStartedAt - songPracticePausedTimeMs;
  }
  songPracticePausedTimeMs = null;
  practicePaused = false;
  resumeSongPitchOnPracticeResume = false;
  resumeAccompanimentOnPracticeResume = false;

  if (audioContext?.state === 'suspended') {
    await audioContext.resume();
  }
  if (mediaRecorder && mediaRecorder.state === 'paused' && typeof mediaRecorder.resume === 'function') {
    mediaRecorder.resume();
  }
  if (shouldResumeSongPitch && songPitchAudio && songPitchAudio.paused && hasSongPitchTarget()) {
    try {
      await songPitchAudio.play();
      updateSongPitchPlaybackProgress();
    } catch (error) {
      console.error(error);
      setSongPitchPlaybackStatus('无法继续播放', 'bad');
    }
  }
  if (shouldResumeAccompaniment && accompanimentAudio && accompanimentAudio.paused) {
    try {
      await accompanimentAudio.play();
      setAccompanimentStatus('播放中');
    } catch (error) {
      console.error(error);
      setAccompanimentStatus('无法继续播放', 'bad');
    }
  }
  if (!animationId && analyser && dataArray) {
    animationId = requestAnimationFrame(update);
  }

  startButton.disabled = true;
  startButton.textContent = '开始练习';
  if (pauseButton) {
    pauseButton.disabled = false;
  }
  stopButton.disabled = false;
  setStatus(shouldRecordWithMainSession() ? '录音中' : '正在监听麦克风', 'active');
  updateSongPracticeFlow('继续跟唱中');
}

function stopPracticeSession() {
  const rewardMode = trainingMode;
  stop();
  if (trainingMode === 'action') {
    s88PracticeActive = false;
    setS88TrainingPhase(s88UserProfile ? 'result' : inferS88TrainingPhase());
    return;
  }
  if (trainingMode === 'range') {
    rangeTrainingPhase = computeRangeStats() ? 'complete' : 'ready';
    setRangeTrainingPhase(rangeTrainingPhase);
    if (typeof recordCurrentPracticeReward === 'function') {
      recordCurrentPracticeReward('range');
    }
    return;
  }
  if (startButton) {
    startButton.textContent = trainingMode === 'score' ? '开始检测' : '开始练习';
  }
  if (pauseButton) {
    pauseButton.disabled = true;
  }
  if (recordButton) {
    recordButton.disabled = false;
  }
  if (stopRecordButton) {
    stopRecordButton.disabled = true;
  }
  updateSongPracticeFlow();
  if (trainingMode === 'breath' || displayMode === 'breath') {
    setReadoutMode('breath');
    updateBreathTrainingControls();
  }
  if (typeof recordCurrentPracticeReward === 'function') {
    recordCurrentPracticeReward(rewardMode);
  }
}

function resetPitchStabilizer() {
  recentPitchWindow = [];
  lastStablePitch = null;
  smoothedPitch = null;
  pendingPitch = null;
  pendingPitchFrames = 0;
  pitchHoldCounter = 0;
  voicedStable = false;
  voicedFrames = 0;
  voicedLostFrames = 0;
  adaptiveNoiseFloorRms = pitchInitialNoiseFloorRms;
  adaptiveEnergyThreshold = pitchMinEnergyThreshold;
  currentPitch = null;
  lastDisplayUpdate = 0;
  pitchValueEl.textContent = '-- Hz';
  noteValueEl.textContent = '--';
  clearSelectedPitchPoint();
}

startButton.addEventListener('click', startPracticeSession);
pauseButton?.addEventListener('click', pausePracticeSession);
stopButton.addEventListener('click', stopPracticeSession);
pitchAlgorithmSelect.addEventListener('change', (event) => {
  pitchAlgorithm = event.target.value;
  resetPitchStabilizer();
  if (!offlineAnalysisInProgress) {
    pitchHistory = [];
    volumeHistory = [];
    drawPitchHistory();
  }
});
pitchScaleModeSelect.addEventListener('change', (event) => {
  pitchScaleMode = event.target.value;
  drawPitchHistory();
});
displayModeSelect.addEventListener('change', (event) => {
  displayMode = event.target.value;
  if (offlineMode && (displayMode === 'spectrogram' || displayMode === 'breath')) {
    displayMode = 'pitch';
    displayModeSelect.value = 'pitch';
  }
  trainingMode =
    displayMode === 'pitch' || displayMode === 'volume' || displayMode === 'formants'
      ? 'curve'
      : displayMode;
  setReadoutMode(displayMode);
  setTrainingCopy(displayMode === 'pitch' && trainingMode === 'curve' ? 'curve' : displayMode);
  setCurveSwitcherMode(displayMode);
  updateCanvasScale(canvasScale);
  if (displayMode === 'spectrogram') {
    resetSpectrogram();
  } else if (displayMode === 'breath') {
    resetBreathMeter();
    drawBreathHistory();
  } else if (displayMode === 'volume') {
    drawVolumeHistory();
  } else if (displayMode === 'formants') {
    drawFormantCurveHistory();
  } else {
    resetPitchScoreDisplay();
    drawPitchHistory();
  }
});
spectrogramOverlaySelect.addEventListener('change', (event) => {
  spectrogramOverlayMode = event.target.value;
  if (displayMode === 'spectrogram') {
    resetSpectrogram();
  }
});
canvasScaleRange.addEventListener('input', (event) => {
  updateCanvasScale(event.target.value);
});
targetPitchToggle?.addEventListener('change', (event) => {
  targetPitchEnabled = event.target.checked;
  drawPitchHistory();
});
targetPitchInput?.addEventListener('input', (event) => {
  const value = Number(event.target.value);
  if (!Number.isFinite(value)) {
    return;
  }
  targetPitchHz = Math.max(50, Math.min(1000, value));
  if (trainingMode === 'score') {
    setTrainingFeedback(
      `目标音高：${Math.round(targetPitchHz)} Hz`,
      '持续发声 3~6 秒，保持稳定，观察当前偏差和命中率。',
      '音准'
    );
  }
  drawPitchHistory();
  updatePitchScoreDisplay();
});
offlineWindowRange?.addEventListener('input', (event) => {
  offlineWindowStartMs = clampOfflineWindowStart(Number(event.target.value) * 1000);
  updatePitchInspector(null);
  drawPitchHistory();
});
canvas.addEventListener('click', (event) => {
  if (displayMode !== 'pitch' || !pitchRenderState) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const canvasX = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const point = findNearestPitchPointByCanvasX(canvasX);
  updatePitchInspector(point);
  if (point && pitchRenderState.useRecordingTimeline && Number.isFinite(point.recordingTimeMs)) {
    recordingSelectedTimeMs = Math.max(0, Math.min(getRecordingDurationMs(), point.recordingTimeMs));
    const frame = findNearestRecordingFrame(recordingSelectedTimeMs);
    if (waveformTimeValue) {
      const pitchText = frame?.pitch ? ` · ${Math.round(frame.pitch)} Hz` : '';
      waveformTimeValue.textContent = `${formatTimeSeconds(recordingSelectedTimeMs)}${pitchText}`;
    }
    drawRecordingTimeline();
    drawWaveformPreview(frame);
  }
  drawPitchHistory();
});
volumeMeterToggle?.addEventListener('change', updateMeterVisibility);
tiltMeterToggle?.addEventListener('change', updateMeterVisibility);
breathCalibrateButton?.addEventListener('click', () => {
  calibrateBreathEnvironment();
});
breathDetailToggleButton?.addEventListener('click', () => {
  if (!breathDetailPanel) {
    return;
  }
  breathDetailPanel.hidden = false;
  breathDetailPanel.open = !breathDetailPanel.open;
  breathDetailToggleButton.textContent = breathDetailPanel.open ? '收起详细数据' : '查看详细数据';
});
recordButton.addEventListener('click', () => {
  startVoiceRecording();
});
stopRecordButton.addEventListener('click', () => {
  stopVoiceRecording();
});
recordingTimelineCanvas?.addEventListener('click', (event) => {
  if (!recordingTimelineFrames.length) {
    return;
  }
  const rect = recordingTimelineCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, x / rect.width));
  selectRecordingTime(ratio * getRecordingDurationMs(), Boolean(lastRecordingBlob));
});
timelinePlayPauseButton?.addEventListener('click', () => {
  if (!recordingPlaybackAudio) {
    return;
  }
  if (recordingPlaybackAudio.paused) {
    startRecordingPlayback(recordingSelectedTimeMs);
  } else {
    stopRecordingPlayback();
  }
});
analyzeRecordingButton.addEventListener('click', () => {
  if (lastRecordingBlob) {
    analyzeRecordingBlob(lastRecordingBlob);
  }
});
downloadRecordingButton.addEventListener('click', () => {
  if (!lastRecordingBlob) {
    return;
  }
  const currentRecording = recordingLibrary.find((item) => item.id === selectedRecordingLibraryId);
  const baseName = currentRecording
    ? getRecordingLibraryName(currentRecording).replace(/[\\/:*?"<>|]+/g, '-')
    : `voice-training_recording_${formatTimestamp(new Date())}`;
  const filename = `${baseName}.webm`;
  downloadBlob(lastRecordingBlob, filename);
});
pitchAccuracyButton.addEventListener('click', () => {
  runPitchAccuracyAnalysis();
});
songPitchInput?.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (file) {
    songSeparationSourceFile = file;
    updateSongPracticeFlow('分析歌曲');
    if (separateSongButton) {
      separateSongButton.disabled = false;
    }
    setSongSeparationStatus('上传歌曲后会自动尝试分离人声和伴奏。');
    addAudioFileToLibrary(file, 'song');
    await analyzeSongPitchFile(file);
    updateSongPracticeFlow();
    separateSongToLibraries(file, { auto: true });
  }
});
songPitchToggle?.addEventListener('change', (event) => {
  songPitchEnabled = event.target.checked;
  resetPitchScoreDisplay();
  setReadoutMode(displayMode);
  drawPitchHistory();
});
songTargetCollapseButton?.addEventListener('click', () => {
  setSongTargetCollapsed(!songTargetContent?.hidden);
  updateSongPracticeFlow();
});
songPracticeChooseButton?.addEventListener('click', () => {
  showLibraryPage('recordings');
  updateSongPracticeFlow('请先准备歌曲');
});
songPracticeStartButton?.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    stopSongPracticeAndReview();
  } else {
    startSongPracticeFlow();
  }
});
songPracticeStopReviewButton?.addEventListener('click', () => {
  stopSongPracticeAndReview();
});
bgmToggleButton?.addEventListener('click', () => {
  toggleBgm();
});
bgmVolumeRange?.addEventListener('input', (event) => {
  setBgmVolume(event.target.value);
});
songPracticeStartFixButton?.addEventListener('click', () => {
  startSongPracticeSentenceLoop();
});
songPracticePlayTargetSegmentButton?.addEventListener('click', () => {
  playSongPracticeTargetSegment();
});
songPracticeRecordSegmentButton?.addEventListener('click', () => {
  startSongPracticeSegmentRecording();
});
songPracticePracticeAgainButton?.addEventListener('click', () => {
  startSongPracticeSegmentRecording();
});
songPracticeNextIssueButton?.addEventListener('click', () => {
  goToNextSongPracticeIssue();
});
songPracticeBackOverviewButton?.addEventListener('click', () => {
  returnSongPracticeOverview();
});
songPracticeRepeatButton?.addEventListener('click', () => {
  startSongPracticeFlow();
});
songPracticeReplayButton?.addEventListener('click', () => {
  if (lastRecordingBlob) {
    startRecordingPlayback(0);
  }
});
songPracticeReplaySegmentButton?.addEventListener('click', () => {
  playSongPracticeFocusSegment();
});
songPracticeReviewLibraryButton?.addEventListener('click', () => {
  showLibraryPage('recordings');
});
vocalScoreStaffViewButton?.addEventListener('click', () => {
  setVocalScoreView('staff');
});
vocalScoreJianpuViewButton?.addEventListener('click', () => {
  setVocalScoreView('jianpu');
});
clearSongPitchButton?.addEventListener('click', () => {
  clearSongPitchTrack();
});
separateSongButton?.addEventListener('click', () => {
  if (songSeparationSourceFile) {
    separateSongToLibraries(songSeparationSourceFile);
  }
});
transcribeSongLyricsButton?.addEventListener('click', () => {
  transcribeSongLyricsWithWhisper();
});
saveSongLyricsEditButton?.addEventListener('click', () => {
  saveSongLyricsEdit();
});
songLyricsText?.addEventListener('input', () => {
  if (!songLyricsTranscriptionInProgress) {
    setSongLyricsStatus('歌词已修改，记得保存编辑', 'warn');
  }
});
copySongLyricsButton?.addEventListener('click', async () => {
  try {
    await copySongLyrics();
  } catch (error) {
    console.error(error);
    setSongLyricsStatus('复制失败', 'bad');
  }
});
copySongLyricsAlignmentButton?.addEventListener('click', async () => {
  try {
    await copySongLyricsAlignment();
  } catch (error) {
    console.error(error);
    setSongLyricsStatus('复制映射失败', 'bad');
  }
});
downloadSongLyricsButton?.addEventListener('click', () => {
  downloadSongLyrics();
});
copyVocalScoreButton?.addEventListener('click', async () => {
  try {
    await copyVocalScoreText();
  } catch (error) {
    console.error(error);
    setVocalScoreStatus('复制失败', 'bad');
  }
});
downloadVocalScoreXmlButton?.addEventListener('click', () => {
  downloadVocalScoreMusicXml();
});
downloadVocalScoreCsvButton?.addEventListener('click', () => {
  downloadVocalScoreCsv();
});
playSongPitchButton?.addEventListener('click', async () => {
  if (!songPitchAudio) {
    return;
  }
  try {
    if (accompanimentAudio && !accompanimentAudio.paused) {
      accompanimentAudio.pause();
      setAccompanimentStatus('已暂停');
    }
    if (typeof setBgmDucking === 'function') {
      setBgmDucking('target', true);
    }
    await songPitchAudio.play();
    syncOfflineWindowToSongPlayback();
    stopSongPitchPlaybackProgress();
    updateSongPitchPlaybackProgress();
  } catch (error) {
    if (typeof setBgmDucking === 'function') {
      setBgmDucking('target', false);
    }
    console.error(error);
    setSongPitchPlaybackStatus('无法播放', 'bad');
  }
});
pauseSongPitchButton?.addEventListener('click', () => {
  if (!songPitchAudio) {
    return;
  }
  songPitchAudio.pause();
  stopSongPitchPlaybackProgress();
  if (typeof setBgmDucking === 'function') {
    setBgmDucking('target', false);
  }
  setSongPitchPlaybackStatus(`已暂停 ${formatTimeSeconds(songPitchAudio.currentTime * 1000)}`);
});
stopSongPitchButton?.addEventListener('click', () => {
  if (!songPitchAudio) {
    return;
  }
  songPitchAudio.pause();
  songPitchAudio.currentTime = 0;
  stopSongPitchPlaybackProgress();
  if (typeof setBgmDucking === 'function') {
    setBgmDucking('target', false);
  }
  resetOfflineWindow();
  drawPitchHistory();
  setSongPitchPlaybackStatus('已停止');
});
memoryAnalyzeButton?.addEventListener('click', () => {
  analyzeMemoryPath();
});
s88TargetInput?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (s88TargetLibrarySelect) {
    s88TargetLibrarySelect.value = '';
  }
  s88LoadTargetVoice(file);
});
s88TargetLibrarySelect?.addEventListener('change', (event) => {
  const id = event.target.value;
  if (id) {
    s88LoadTargetFromLibrary(id);
  }
});
s88CompareButton?.addEventListener('click', () => {
  s88CompareLatestRecording();
});
formantToggle.addEventListener('change', () => {
  if (!formantToggle.checked) {
    resetFormants();
    setFormantStatus('');
  }
});
sidebarToggle.addEventListener('click', () => {
  if (appWindow.hidden) {
    return;
  }
  sidebar.hidden = false;
  const isOpen = sidebar.classList.toggle('open');
  sidebarToggle.setAttribute('aria-expanded', String(isOpen));
  sidebar.setAttribute('aria-hidden', String(!isOpen));
  if (!isOpen) {
    closeSidebar();
  }
});
closeSidebarButton?.addEventListener('click', closeSidebar);
songSearchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  searchSongs(songSearchInput?.value || '');
});

function handleLauncherModeEvent(event) {
  const target = event.target instanceof Element ? event.target : null;
  const button = target?.closest('[data-training-mode]');
  if (!button) {
    return;
  }
  const nextMode = button.dataset.trainingMode;
  if (!nextMode) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (typeof event.stopImmediatePropagation === 'function') {
    event.stopImmediatePropagation();
  }
  if (typeof window.launchTrainingMode === 'function') {
    window.launchTrainingMode(nextMode);
    return;
  }
  showTrainingView(nextMode);
  if (nextMode === 'breath') {
    setTimeout(() => showTrainingView('breath'), 0);
  }
}

['pointerdown', 'mousedown', 'click'].forEach((eventName) => {
  modeLauncher?.addEventListener(eventName, handleLauncherModeEvent, true);
});

openCurveModeButton?.addEventListener('click', () => {
  showTrainingView('curve');
});
openFixOneThingButton?.addEventListener('click', () => {
  showTrainingView('fix');
});
startTodayTrainingButton?.addEventListener('click', () => {
  if (typeof openBeginnerPracticeMode === 'function') {
    openBeginnerPracticeMode();
    return;
  }
  showTrainingView('curve');
});
miraSongButton?.addEventListener('click', () => {
  showTrainingView('curve');
});
songGameViewButton?.addEventListener('click', () => {
  songGameViewEnabled = true;
  setCurveDisplayMode('pitch');
});
curvePitchButton?.addEventListener('click', () => {
  songGameViewEnabled = false;
  setCurveDisplayMode('pitch');
});
curveVolumeButton?.addEventListener('click', () => {
  setCurveDisplayMode('volume');
});
curveFormantButton?.addEventListener('click', () => {
  setCurveDisplayMode('formants');
});
openSpectrogramModeButton?.addEventListener('click', () => {
  showTrainingView('spectrogram');
});
openBreathModeButton?.addEventListener('click', () => {
  showTrainingView('breath');
});
openRangeModeButton?.addEventListener('click', () => {
  showTrainingView('range');
});
openPitchScoreModeButton?.addEventListener('click', () => {
  showTrainingView('score');
});
openMemoryModeButton?.addEventListener('click', () => {
  showTrainingView('memory');
});
openActionPathModeButton?.addEventListener('click', () => {
  showTrainingView('action');
});
openRhythmModeButton?.addEventListener('click', () => {
  showTrainingView('rhythm');
});
openRecordingLibraryButton?.addEventListener('click', () => {
  showLibraryPage('recordings');
});
openAccompanimentLibraryButton?.addEventListener('click', () => {
  showLibraryPage('accompaniments');
});
libraryBackButton?.addEventListener('click', () => {
  showLauncherView();
});
libraryOpenCurveButton?.addEventListener('click', () => {
  showTrainingView('curve');
});
recordingLibraryTabButton?.addEventListener('click', () => {
  showLibraryPage('recordings');
});
successLibraryTabButton?.addEventListener('click', () => {
  showLibraryPage('success');
});
accompanimentLibraryTabButton?.addEventListener('click', () => {
  showLibraryPage('accompaniments');
});
rangeResetButton?.addEventListener('click', () => {
  resetRangeTraining();
  setRangeTrainingPhase('ready');
});
rangeSaveButton?.addEventListener('click', () => {
  saveRangeTrainingResult();
  setRangeTrainingPhase('complete');
});
rangeHistoryToggleButton?.addEventListener('click', () => {
  rangeHistoryExpanded = !rangeHistoryExpanded;
  renderRangeHistory();
  setRangeTrainingPhase('complete');
});
rangeClearHistoryButton?.addEventListener('click', () => {
  clearRangeHistory();
  renderRangeHistory();
  setRangeTrainingPhase('complete');
});
rhythmBpmInput?.addEventListener('input', () => {
  updateRhythmConfig();
  if (trainingMode === 'rhythm' && startButton?.disabled) {
    startRhythmTrainingSession(performance.now());
  } else {
    resetRhythmTraining();
  }
});
rhythmMeterSelect?.addEventListener('change', () => {
  updateRhythmConfig();
  if (trainingMode === 'rhythm' && startButton?.disabled) {
    startRhythmTrainingSession(performance.now());
  } else {
    resetRhythmTraining();
  }
});
rhythmPatternSelect?.addEventListener('change', () => {
  updateRhythmConfig();
  if (trainingMode === 'rhythm' && startButton?.disabled) {
    startRhythmTrainingSession(performance.now());
  } else {
    resetRhythmTraining();
  }
});
rhythmDifficultySelect?.addEventListener('change', () => {
  updateRhythmConfig();
  updateRhythmDisplay();
});
rhythmSongToggle?.addEventListener('change', () => {
  rhythmUseSongPattern = Boolean(rhythmSongToggle.checked && songRhythmBeats.length);
  updateRhythmConfig();
  if (trainingMode === 'curve' && displayMode === 'pitch') {
    setReadoutMode('pitch');
  }
  if (trainingMode === 'rhythm' && startButton?.disabled) {
    startRhythmTrainingSession(performance.now());
  } else {
    resetRhythmTraining();
  }
});
rhythmExtractButton?.addEventListener('click', async () => {
  if (!songRhythmSourceFile) {
    updateSongRhythmControls();
    return;
  }
  const result = await analyzeSongRhythmFile(songRhythmSourceFile);
  if (result) {
    saveCurrentSongAssetsToLibrary();
    if (trainingMode === 'rhythm' && startButton?.disabled) {
      startRhythmTrainingSession(performance.now());
    }
  }
});
rhythmResetButton?.addEventListener('click', () => {
  if (trainingMode === 'rhythm' && startButton?.disabled) {
    startRhythmTrainingSession(performance.now());
  } else {
    resetRhythmTraining();
  }
});
backToHomeButton?.addEventListener('click', () => {
  showLauncherView();
});

audioFileInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) {
    addAudioFileToLibrary(file, 'audio');
    analyzeAudioFile(file);
  }
});
clearFileButton.addEventListener('click', () => {
  if (offlineAnalysisInProgress) {
    offlineAbort = true;
    setAnalysisStatus('取消中...');
    return;
  }
  setOfflineMode(false);
  resetOfflineState();
  pitchHistory = [];
  volumeHistory = [];
  drawPitchHistory();
});

window.addEventListener('resize', () => {
  if (vocalScoreView === 'staff') {
    if (vocalScoreNotes.length) renderVocalScoreSheet();
    else drawVocalScorePlaceholder();
  } else {
    if (vocalScoreNotes.length) renderJianpuScoreSheet();
    else drawJianpuPlaceholder();
  }
});

window.addEventListener('beforeunload', stop);

