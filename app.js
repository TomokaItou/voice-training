function updateMeterVisibility(activeMode = displayMode) {
  const chart = canvas?.closest('.chart');
  const showVolume = activeMode !== 'spectrogram' && (volumeMeterToggle?.checked ?? true);
  const showTilt = activeMode !== 'spectrogram' && (tiltMeterToggle?.checked ?? true);

  if (volumeMeterColumn) {
    volumeMeterColumn.hidden = !showVolume;
  }
  if (tiltMeterColumn) {
    tiltMeterColumn.hidden = !showTilt;
  }

  chart?.classList.toggle('volume-meter-hidden', !showVolume);
  chart?.classList.toggle('tilt-meter-hidden', !showTilt);
}

updateCanvasScale(canvasScale);
drawVocalScorePlaceholder();
setVocalScoreView(vocalScoreView);
initWindowResize();
showLauncherView();
updateMeterVisibility();
updateRecordingButtons();
loadRecordingLibrary();
loadAccompanimentLibrary();
updateAccompanimentButtons(false);
updateSongPitchPlaybackButtons();
updatePitchAccuracyButton();
setPitchAccuracyResult('--');
resetBreathCalibration();
loadRangeHistory();
renderRangeHistory();

function setStatus(text, tone = 'info') {
  statusEl.textContent = text;
  statusEl.style.background = tone === 'active' ? '#e4f3ef' : '#eef1ed';
  statusEl.style.color = tone === 'active' ? '#0b5d56' : '#697167';
}

function setDataSourceLabel(source) {
  dataSourceValue.textContent = source;
}

function setAnalysisStatus(text) {
  analysisStatus.textContent = text;
}

function setTrainingFeedback(title, text, badge = '建议', tone = 'neutral') {
  if (!trainingFeedbackPanel) {
    return;
  }
  trainingFeedbackTitle.textContent = title;
  trainingFeedbackText.textContent = text;
  trainingFeedbackBadge.textContent = badge;
  trainingFeedbackPanel.dataset.tone = tone;
}

function setDefaultTrainingFeedback(mode = trainingMode) {
  if (mode === 'score') {
    setTrainingFeedback('先唱一个稳定长音', '开始检测后，对准目标音持续 3-6 秒。系统会告诉你该往高一点、低一点，还是继续稳住。', '音准');
  } else if (mode === 'curve' || mode === 'pitch') {
    setTrainingFeedback('先选歌或直接开麦', '跟唱时优先看“开始跟唱”和“停止并评估”；自由练声时看曲线是否连续、稳定。', '跟唱');
  } else if (mode === 'breath') {
    setTrainingFeedback('先校准环境噪声', '保持安静点“校准环境”，再平稳吹气。目标是持续、不断气，而不是一开始就用最大气流。', '气息');
  } else if (mode === 'range') {
    setTrainingFeedback('从舒服的音开始滑动', '先从低音慢慢滑到高音，再回到中声区。采样足够后再保存结果。', '音域');
  } else if (mode === 'memory') {
    setTrainingFeedback('先录一段完整路径', '录“接近目标、保持目标、回到中性或安静”的片段，再看系统判断哪一步最不稳定。', '音色');
  } else {
    setTrainingFeedback('先开始一次练习', '系统会把音高、稳定度和录音结果翻译成下一步练习建议。', '等待');
  }
}

function getTaskModeKey(mode = trainingMode) {
  if (mode === 'curve') {
    return 'curve';
  }
  if (trainingMode === 'curve' && ['pitch', 'volume', 'formants'].includes(mode)) {
    return mode === 'pitch' ? 'curve' : mode;
  }
  return mode;
}

function isTaskAllowed(attributeValue, modeKey) {
  if (!attributeValue) {
    return true;
  }
  const allowed = attributeValue.split(/\s+/).filter(Boolean);
  return allowed.includes('all') || allowed.includes(modeKey);
}

function applyTaskControls(mode = trainingMode) {
  const modeKey = getTaskModeKey(mode);

  document.querySelectorAll('[data-task-control]').forEach((element) => {
    element.hidden = !isTaskAllowed(element.dataset.taskControl, modeKey);
  });

  document.querySelectorAll('[data-task-section]').forEach((element) => {
    if (element.closest('.advanced-settings') && !element.classList.contains('advanced-settings')) {
      element.hidden = !isTaskAllowed(element.dataset.taskSection, modeKey);
      return;
    }
    element.hidden = !isTaskAllowed(element.dataset.taskSection, modeKey);
  });

  document.querySelectorAll('.advanced-settings').forEach((details) => {
    const hasVisibleChild = [...details.querySelectorAll(':scope > .sidebar-card')].some(
      (section) => !section.hidden
    );
    details.hidden = !hasVisibleChild || !isTaskAllowed(details.dataset.taskSection, modeKey);
  });

  if (sidebarToggle) {
    const hasVisibleSettings = [...sidebar.querySelectorAll(':scope > [data-task-section]')].some(
      (section) => !section.hidden
    );
    sidebarToggle.hidden = !hasVisibleSettings;
    if (!hasVisibleSettings && sidebar?.classList.contains('open')) {
      closeSidebarPanel();
    }
  }
}

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

function setAccompanimentStatus(text) {
  accompanimentStatus.textContent = text;
}

function updateAccompanimentButtons(hasSource) {
  const canPlay = Boolean(hasSource);
  playAccompanimentButton.disabled = !canPlay;
  pauseAccompanimentButton.disabled = !canPlay;
  stopAccompanimentButton.disabled = !canPlay;
}

function loadAccompanimentFile(file, statusText = '已加载') {
  if (!file) {
    return;
  }
  if (accompanimentUrl) {
    URL.revokeObjectURL(accompanimentUrl);
  }
  accompanimentUrl = URL.createObjectURL(file);
  if (!accompanimentAudio) {
    accompanimentAudio = new Audio();
    accompanimentAudio.addEventListener('ended', () => {
      setAccompanimentStatus('已停止');
    });
  }
  accompanimentAudio.src = accompanimentUrl;
  accompanimentAudio.volume = Number(accompanimentVolume.value || 0.7);
  accompanimentFile = file;
  setAccompanimentStatus(statusText);
  updateAccompanimentButtons(true);
  updatePitchAccuracyButton();
}

function updatePitchAccuracyButton() {
  const hasReference = Boolean(accompanimentFile || songPitchTrack.length);
  const hasVocal = Boolean(lastRecordingBlob);
  pitchAccuracyButton.disabled =
    !(hasReference && hasVocal) || offlineAnalysisInProgress || songPitchAnalysisInProgress;
  updateSongPracticeFlow();
}

function setPitchAccuracyResult(text, tone = 'neutral') {
  pitchAccuracyResult.textContent = text;
  if (tone === 'good') {
    pitchAccuracyResult.style.color = '#16a34a';
  } else if (tone === 'warn') {
    pitchAccuracyResult.style.color = '#b7791f';
  } else if (tone === 'bad') {
    pitchAccuracyResult.style.color = '#dc2626';
  } else {
    pitchAccuracyResult.style.color = '#1c1f2a';
  }
}

function setSongPitchStatus(text, tone = 'neutral') {
  if (!songPitchStatus) {
    return;
  }
  songPitchStatus.textContent = text;
  if (tone === 'good') {
    songPitchStatus.style.color = '#16a34a';
  } else if (tone === 'bad') {
    songPitchStatus.style.color = '#dc2626';
  } else {
    songPitchStatus.style.color = '#1c1f2a';
  }
}

function setSongPitchPlaybackStatus(text, tone = 'neutral') {
  if (!songPitchPlaybackStatus) {
    return;
  }
  songPitchPlaybackStatus.textContent = text;
  if (tone === 'good') {
    songPitchPlaybackStatus.style.color = '#16a34a';
  } else if (tone === 'bad') {
    songPitchPlaybackStatus.style.color = '#dc2626';
  } else {
    songPitchPlaybackStatus.style.color = '#1c1f2a';
  }
}

function updateSongPitchPlaybackButtons() {
  const hasAudio = Boolean(songPitchAudio);
  if (playSongPitchButton) {
    playSongPitchButton.disabled = !hasAudio || songPitchAnalysisInProgress;
  }
  if (pauseSongPitchButton) {
    pauseSongPitchButton.disabled = !hasAudio || songPitchAnalysisInProgress;
  }
  if (stopSongPitchButton) {
    stopSongPitchButton.disabled = !hasAudio || songPitchAnalysisInProgress;
  }
}

function stopSongPitchPlaybackProgress() {
  if (songPitchPlaybackRaf) {
    cancelAnimationFrame(songPitchPlaybackRaf);
    songPitchPlaybackRaf = null;
  }
}

function syncOfflineWindowToSongPlayback() {
  if (!songPitchAudio || !offlineMode) {
    return;
  }
  const playbackMs = songPitchAudio.currentTime * 1000;
  const durationMs = Number.isFinite(songPitchAudio.duration)
    ? songPitchAudio.duration * 1000
    : getOfflineTrackDurationMs();
  const desiredStart = playbackMs - offlineWindowDurationMs * 0.35;
  offlineWindowStartMs = clampOfflineWindowStart(desiredStart, durationMs);
  drawPitchHistory();
}

function updateSongPitchPlaybackProgress() {
  if (!songPitchAudio || songPitchAudio.paused) {
    stopSongPitchPlaybackProgress();
    return;
  }
  syncOfflineWindowToSongPlayback();
  setSongPitchPlaybackStatus(`播放中 ${formatTimeSeconds(songPitchAudio.currentTime * 1000)}`, 'good');
  songPitchPlaybackRaf = requestAnimationFrame(updateSongPitchPlaybackProgress);
}

function setSongTargetCollapsed(collapsed) {
  if (!songTargetContent || !songTargetCollapseButton) {
    return;
  }
  songTargetContent.hidden = collapsed;
  songTargetPanel?.classList.toggle('is-collapsed', collapsed);
  songTargetCollapseButton.setAttribute('aria-expanded', String(!collapsed));
  songTargetCollapseButton.textContent = collapsed ? '展开' : '收起';
  if (!collapsed && vocalScoreView === 'staff') {
    if (vocalScoreNotes.length) renderVocalScoreSheet();
    else drawVocalScorePlaceholder();
  } else if (!collapsed) {
    if (vocalScoreNotes.length) renderJianpuScoreSheet();
    else drawJianpuPlaceholder();
  }
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarToggle.setAttribute('aria-expanded', 'false');
  sidebar.setAttribute('aria-hidden', 'true');
  sidebar.hidden = true;
}

function setPracticeStepState(step, state) {
  if (!step) {
    return;
  }
  step.classList.toggle('active', state === 'active');
  step.classList.toggle('done', state === 'done');
}

function updateSongPracticeFlow(status = null) {
  if (!songPracticeFlow) {
    return;
  }
  const hasSong = Boolean(songPitchAudio || songPitchTrack.length || songSeparationSourceFile);
  const hasTarget = Boolean(songPitchTrack.length);
  const isRecording = Boolean(mediaRecorder && mediaRecorder.state !== 'inactive');
  const hasRecording = Boolean(lastRecordingBlob);
  const canStart = hasTarget && !isRecording && !offlineAnalysisInProgress && !songPitchAnalysisInProgress;
  const canReview = hasTarget && (hasRecording || isRecording) && !offlineAnalysisInProgress && !songPitchAnalysisInProgress;

  setPracticeStepState(songPracticeStepSong, hasSong ? 'done' : 'active');
  setPracticeStepState(songPracticeStepTarget, hasTarget ? 'done' : hasSong ? 'active' : null);
  setPracticeStepState(songPracticeStepRecord, isRecording ? 'active' : hasRecording ? 'done' : null);
  setPracticeStepState(songPracticeStepReview, hasRecording && hasTarget ? 'active' : null);

  if (songPracticeStartButton) {
    songPracticeStartButton.disabled = !canStart;
    songPracticeStartButton.textContent = isRecording ? '跟唱中' : '开始跟唱';
  }
  if (songPracticeStopReviewButton) {
    songPracticeStopReviewButton.disabled = !canReview;
  }

  if (songPracticeFlowState) {
    if (status) {
      songPracticeFlowState.textContent = status;
    } else if (isRecording) {
      songPracticeFlowState.textContent = '跟唱录音中';
    } else if (hasRecording && hasTarget) {
      songPracticeFlowState.textContent = '可评估';
    } else if (hasTarget) {
      songPracticeFlowState.textContent = '目标已生成';
    } else if (hasSong || songPitchAnalysisInProgress) {
      songPracticeFlowState.textContent = '生成目标中';
    } else {
      songPracticeFlowState.textContent = '等待歌曲';
    }
  }

  if (songPracticeFlowHint) {
    if (isRecording) {
      songPracticeFlowHint.textContent = '正在录你的跟唱。唱完后点“停止并评估”，系统会自动对比目标曲线。';
    } else if (hasRecording && hasTarget) {
      songPracticeFlowHint.textContent = '已经有一段录音，可以直接评估，也可以重新开始跟唱。';
    } else if (hasTarget) {
      songPracticeFlowHint.textContent = '目标曲线准备好了。点“开始跟唱”会播放歌曲并同时录音。';
    } else {
      songPracticeFlowHint.textContent = '先选一首歌，系统会生成目标曲线，然后带你录一遍并自动评估。';
    }
  }
}

function prepareSongPitchPlayback(file) {
  stopSongPitchPlaybackProgress();
  if (songPitchAudio) {
    songPitchAudio.pause();
  }
  if (songPitchAudioUrl) {
    URL.revokeObjectURL(songPitchAudioUrl);
  }
  songPitchAudioUrl = URL.createObjectURL(file);
  songPitchAudio = new Audio(songPitchAudioUrl);
  songPitchAudio.addEventListener('ended', () => {
    stopSongPitchPlaybackProgress();
    setSongPitchPlaybackStatus('已播放完');
    updateSongPitchPlaybackButtons();
  });
  songPitchAudio.addEventListener('loadedmetadata', () => {
    setSongPitchPlaybackStatus(`已加载 ${formatTimeSeconds(songPitchAudio.duration * 1000)}`);
  });
  setSongPitchPlaybackStatus('已加载');
  updateSongPitchPlaybackButtons();
  updateSongPracticeFlow();
}

function clearSongPitchPlayback() {
  stopSongPitchPlaybackProgress();
  if (songPitchAudio) {
    songPitchAudio.pause();
    songPitchAudio = null;
  }
  if (songPitchAudioUrl) {
    URL.revokeObjectURL(songPitchAudioUrl);
    songPitchAudioUrl = null;
  }
  setSongPitchPlaybackStatus('未加载');
  updateSongPitchPlaybackButtons();
  updateSongPracticeFlow();
}

function setSongTrainingResult(text, tone = 'neutral') {
  if (!songTrainingResult) {
    return;
  }
  songTrainingResult.textContent = text;
  if (tone === 'good') {
    songTrainingResult.style.color = '#16a34a';
  } else if (tone === 'warn') {
    songTrainingResult.style.color = '#b7791f';
  } else if (tone === 'bad') {
    songTrainingResult.style.color = '#dc2626';
  } else {
    songTrainingResult.style.color = '#1c1f2a';
  }
}

function isPitchCurveSongPracticeActive() {
  return trainingMode === 'curve' && displayMode === 'pitch' && hasSongPitchTarget();
}

function shouldShowPitchScorePanel(readoutMode = trainingMode) {
  return trainingMode === 'score' || readoutMode === 'score' || (readoutMode === 'pitch' && hasSongPitchTarget());
}

function canUpdatePitchScoreNow() {
  return trainingMode === 'score' || isPitchCurveSongPracticeActive();
}

function isSongReferencePlaying() {
  return Boolean(
    (songPitchAudio && !songPitchAudio.paused) ||
      (accompanimentAudio && !accompanimentAudio.paused)
  );
}

function getPitchScoreDirectionText(cents) {
  const absCents = Math.abs(cents);
  if (absCents <= pitchScoreGoodToleranceCents) {
    return '稳住';
  }
  if (absCents <= pitchScoreHitToleranceCents) {
    return cents > 0 ? '略高' : '略低';
  }
  if (absCents <= 80) {
    return cents > 0 ? '偏高' : '偏低';
  }
  return cents > 0 ? '太高' : '太低';
}

function resetPitchScoreDisplay() {
  const isSongPractice = isPitchCurveSongPracticeActive();
  pitchScoreDashboard?.classList.toggle('song-practice', isSongPractice);
  if (pitchScoreValue) {
    pitchScoreValue.textContent = '--';
  }
  if (pitchScoreCaption) {
    pitchScoreCaption.textContent = hasSongPitchTarget()
      ? '开始检测后，跟着歌曲曲线唱；低八度或高八度也会按旋律判断。'
      : '开始检测后，对准目标音持续发声。';
  }
  if (pitchScoreTargetValue) {
    pitchScoreTargetValue.textContent = hasSongPitchTarget()
      ? '歌曲旋律'
      : `${Math.round(targetPitchHz)} Hz`;
  }
  if (pitchScoreCentsValue) {
    pitchScoreCentsValue.textContent = '-- cents';
  }
  if (pitchScoreStabilityValue) {
    pitchScoreStabilityValue.textContent = '--%';
  }
  if (pitchScoreHitRateValue) {
    pitchScoreHitRateValue.textContent = '--%';
  }
  if (pitchScoreAverageValue) {
    pitchScoreAverageValue.textContent = '-- cents';
  }
  if (pitchScoreCoverageValue) {
    pitchScoreCoverageValue.textContent = '--%';
  }
  setPitchScoreTone('neutral');
}

function formatPitchPointTime(point) {
  if (!point) {
    return '--';
  }
  if (Number.isFinite(point.recordingTimeMs)) {
    return formatTimeSeconds(point.recordingTimeMs);
  }
  if (offlineMode || sessionStartTime === 0) {
    return formatTimeSeconds(point.time);
  }
  return formatTimeSeconds(Math.max(0, point.time - sessionStartTime));
}

function updatePitchInspector(point) {
  selectedPitchPoint = point;
  if (!pitchInspectorPanel || !selectedPitchValue || !selectedPitchHint) {
    return;
  }
  if (!point?.pitch) {
    pitchInspectorPanel.hidden = true;
    selectedPitchValue.textContent = '--';
    selectedPitchHint.textContent = '点击音高曲线查看对应时间点';
    return;
  }
  pitchInspectorPanel.hidden = false;
  selectedPitchValue.textContent = `${point.pitch.toFixed(1)} Hz · ${frequencyToNote(point.pitch)}`;
  selectedPitchHint.textContent = `时间 ${formatPitchPointTime(point)}`;
}

function clearSelectedPitchPoint() {
  updatePitchInspector(null);
  drawPitchHistory();
}

function updatePitchScoreDisplay(now = performance.now()) {
  if (!canUpdatePitchScoreNow()) {
    return;
  }

  const isSongPractice = isPitchCurveSongPracticeActive();
  pitchScoreDashboard?.classList.toggle('song-practice', isSongPractice);
  if (isSongPractice && currentPitch && songPracticeStartTime === 0 && !isSongReferencePlaying()) {
    songPracticeStartTime = now;
  }
  if (pitchScoreTargetValue) {
    pitchScoreTargetValue.textContent = hasSongPitchTarget()
      ? '歌曲旋律'
      : `${Math.round(targetPitchHz)} Hz`;
  }

  const stats = computePitchScoreStats(now);
  if (!stats || !Number.isFinite(stats.currentCents)) {
    resetPitchScoreDisplay();
    return;
  }

  const absCurrentCents = Math.abs(stats.currentCents);
  const isGood = absCurrentCents <= pitchScoreGoodToleranceCents;
  const isClose = absCurrentCents <= pitchScoreHitToleranceCents;
  const direction = getPitchScoreDirectionText(stats.currentCents);
  const directionHint =
    direction === '稳住'
      ? '保持现在的音高'
      : stats.currentCents > 0
        ? '往低一点唱'
        : '往高一点唱';
  const tone = isGood ? 'good' : isClose ? 'close' : 'warn';

  pitchScoreValue.textContent = isSongPractice ? direction : `${stats.score}%`;
  pitchScoreCaption.textContent = isSongPractice
    ? `${directionHint}。旋律准度 ${stats.score}% / 命中 ${stats.hitRate}%（自动兼容高低八度）。`
    : `${directionHint}，最近 ${pitchScoreWindowSeconds} 秒 P90 偏差 ${stats.p90AbsError.toFixed(
        1
      )} cents，覆盖 ${stats.coverage}%。`;
  pitchScoreCentsValue.textContent = formatSignedCents(stats.currentCents);
  if (pitchScoreTargetValue && hasSongPitchTarget() && stats.currentTargetPitch) {
    pitchScoreTargetValue.textContent = `${Math.round(stats.currentTargetPitch)} Hz 旋律`;
  }
  pitchScoreStabilityValue.textContent = `${stats.stability}%`;
  pitchScoreHitRateValue.textContent = `${stats.hitRate}%`;
  if (pitchScoreAverageValue) {
    pitchScoreAverageValue.textContent = `${stats.averageAbsError.toFixed(1)} cents`;
  }
  if (pitchScoreCoverageValue) {
    pitchScoreCoverageValue.textContent = `${stats.coverage}%`;
  }
  if (hasSongPitchTarget()) {
    setSongTrainingResult(
      `${stats.score}% / 命中 ${stats.hitRate}% / 覆盖 ${stats.coverage}%`,
      tone === 'warn' ? 'bad' : 'good'
    );
    setTrainingFeedback(
      direction === '稳住' ? '这段旋律贴得住' : direction,
      `${directionHint}。这一小段旋律准度 ${stats.score}%，命中 ${stats.hitRate}%，覆盖 ${stats.coverage}%。先把覆盖唱满，再追求更高分。`,
      '跟唱',
      tone
    );
  } else {
    setTrainingFeedback(
      direction === '稳住' ? '音高稳定，继续保持' : direction,
      `${directionHint}。最近 ${pitchScoreWindowSeconds} 秒稳定度 ${stats.stability}%，命中 ${stats.hitRate}%。先唱稳 3 秒，再拉长到 6 秒。`,
      '音准',
      tone
    );
  }
  setPitchScoreTone(tone);
}

function formatRangePitch(pitch) {
  if (!Number.isFinite(pitch)) {
    return '--';
  }
  return `${frequencyToNote(pitch)} · ${Math.round(pitch)} Hz`;
}

function getSemitoneSpan(lowPitch, highPitch) {
  if (!Number.isFinite(lowPitch) || !Number.isFinite(highPitch) || lowPitch <= 0 || highPitch <= lowPitch) {
    return 0;
  }
  return 12 * Math.log2(highPitch / lowPitch);
}

function formatRangeSpan(semitones) {
  if (!Number.isFinite(semitones) || semitones <= 0) {
    return '--';
  }
  const octaves = Math.floor(semitones / 12);
  const remainder = Math.round(semitones - octaves * 12);
  if (octaves <= 0) {
    return `${remainder} 半音`;
  }
  if (remainder === 0) {
    return `${octaves} 八度`;
  }
  return `${octaves} 八度 ${remainder} 半音`;
}

function resetRangeTraining() {
  rangeSamples = [];
  rangeLastPitch = null;
  updateRangeDisplay();
  drawPitchHistory();
}

function computeRangeStats() {
  const pitches = rangeSamples.map((sample) => sample.pitch).filter(Number.isFinite);
  if (!pitches.length) {
    return null;
  }

  const sorted = [...pitches].sort((a, b) => a - b);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const comfortLow = percentile(sorted, 0.15);
  const comfortHigh = percentile(sorted, 0.85);
  const recent = rangeSamples.slice(-Math.min(rangeSamples.length, 18));
  const recentPitches = recent.map((sample) => sample.pitch).filter(Number.isFinite);
  const recentMedian = percentile(recentPitches, 0.5);
  const recentErrors = recentPitches.map((pitch) => Math.abs(getPitchDistanceCents(pitch, recentMedian)));
  const p90Jitter = percentile(recentErrors, 0.9);
  const stability = Math.max(0, Math.min(100, Math.round(100 - normalizeRange(p90Jitter, 12, 90) * 100)));

  return {
    lowest,
    highest,
    comfortLow,
    comfortHigh,
    spanSemitones: getSemitoneSpan(lowest, highest),
    comfortSpanSemitones: getSemitoneSpan(comfortLow, comfortHigh),
    stability,
    sampleCount: pitches.length,
  };
}

function createRangeRecord(stats = computeRangeStats()) {
  if (!stats || stats.sampleCount < 6) {
    return null;
  }

  return {
    id: `${Date.now()}-${Math.round(stats.lowest)}-${Math.round(stats.highest)}`,
    createdAt: new Date().toISOString(),
    lowest: Math.round(stats.lowest * 10) / 10,
    highest: Math.round(stats.highest * 10) / 10,
    comfortLow: Math.round(stats.comfortLow * 10) / 10,
    comfortHigh: Math.round(stats.comfortHigh * 10) / 10,
    spanSemitones: Math.round(stats.spanSemitones * 10) / 10,
    comfortSpanSemitones: Math.round(stats.comfortSpanSemitones * 10) / 10,
    stability: stats.stability,
    sampleCount: stats.sampleCount,
  };
}

function loadRangeHistory() {
  try {
    const raw = window.localStorage?.getItem(rangeHistoryStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    rangeHistoryRecords = Array.isArray(parsed)
      ? parsed.filter((record) => record && Number.isFinite(record.spanSemitones))
      : [];
  } catch (error) {
    console.warn('Failed to load range history', error);
    rangeHistoryRecords = [];
  }
}

function persistRangeHistory() {
  try {
    window.localStorage?.setItem(
      rangeHistoryStorageKey,
      JSON.stringify(rangeHistoryRecords.slice(0, rangeHistoryMaxRecords))
    );
  } catch (error) {
    console.warn('Failed to save range history', error);
  }
}

function formatRangeDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '未知时间';
  }
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRangeTrendText(record, previousRecord) {
  if (!previousRecord) {
    return '首次记录';
  }
  const delta = record.spanSemitones - previousRecord.spanSemitones;
  if (Math.abs(delta) < 0.5) {
    return '跨度持平';
  }
  return delta > 0 ? `+${delta.toFixed(1)} 半音` : `${delta.toFixed(1)} 半音`;
}

function renderRangeHistory() {
  if (!rangeHistoryPanel || !rangeHistorySummary || !rangeHistoryList) {
    return;
  }

  rangeHistoryList.innerHTML = '';
  if (rangeClearHistoryButton) {
    rangeClearHistoryButton.disabled = rangeHistoryRecords.length === 0;
  }

  if (!rangeHistoryRecords.length) {
    rangeHistorySummary.textContent = '还没有保存记录';
    const item = document.createElement('li');
    item.className = 'range-history-empty';
    item.textContent = '保存一次测量后，这里会显示最近的音域趋势。';
    rangeHistoryList.appendChild(item);
    return;
  }

  const latest = rangeHistoryRecords[0];
  const previous = rangeHistoryRecords[1] || null;
  rangeHistorySummary.textContent = `最近 ${rangeHistoryRecords.length} 次，最新跨度 ${formatRangeSpan(
    latest.spanSemitones
  )}，${getRangeTrendText(latest, previous)}`;

  rangeHistoryRecords.slice(0, 8).forEach((record, index) => {
    const previousRecord = rangeHistoryRecords[index + 1] || null;
    const item = document.createElement('li');
    item.className = 'range-history-item';

    const title = document.createElement('div');
    title.className = 'range-history-title';
    title.textContent = `${formatRangeDate(record.createdAt)} · ${formatRangeSpan(record.spanSemitones)}`;

    const meta = document.createElement('div');
    meta.className = 'range-history-meta';
    meta.textContent = `${formatRangePitch(record.lowest)} 到 ${formatRangePitch(
      record.highest
    )} · 舒适区 ${formatRangePitch(record.comfortLow)} - ${formatRangePitch(
      record.comfortHigh
    )} · 稳定度 ${record.stability}%`;

    const trend = document.createElement('span');
    trend.className = 'range-history-trend';
    trend.textContent = getRangeTrendText(record, previousRecord);

    item.append(title, meta, trend);
    rangeHistoryList.appendChild(item);
  });
}

function saveRangeTrainingResult() {
  const record = createRangeRecord();
  if (!record) {
    if (rangeCaption) {
      rangeCaption.textContent = '有效采样还不够，先完成一段低到高的稳定滑音。';
    }
    return;
  }

  rangeHistoryRecords = [record, ...rangeHistoryRecords].slice(0, rangeHistoryMaxRecords);
  persistRangeHistory();
  renderRangeHistory();
  if (rangeCaption) {
    rangeCaption.textContent = `已保存 ${formatRangeDate(record.createdAt)} 的音域结果。`;
  }
}

function clearRangeHistory() {
  rangeHistoryRecords = [];
  persistRangeHistory();
  renderRangeHistory();
}

function getRangeCaption(stats) {
  if (!stats || stats.sampleCount < 6) {
    return '从舒适低音慢慢滑到高音，保持每个位置 1-2 秒。';
  }
  if (stats.spanSemitones < 7) {
    return '目前跨度偏窄，可以继续向低音和高音两端探索。';
  }
  if (stats.stability < 55) {
    return '音域已开始展开，但稳定度偏低，先放慢滑音速度。';
  }
  if (stats.comfortSpanSemitones >= 12) {
    return '已经形成可用舒适区，可以记录这一段作为今天的练习范围。';
  }
  return '两端已记录，继续在中声区和换声附近做稳定保持。';
}

function updateRangeDisplay() {
  if (!rangeDashboard) {
    return;
  }

  const stats = computeRangeStats();
  if (rangeCurrentValue) {
    rangeCurrentValue.textContent = formatRangePitch(rangeLastPitch);
  }

  if (!stats) {
    rangeSpanValue.textContent = '--';
    rangeCaption.textContent = '点击开始检测后，从舒适低音滑到高音，再回到中声区。';
    rangeLowestValue.textContent = '--';
    rangeHighestValue.textContent = '--';
    rangeComfortValue.textContent = '--';
    rangeStabilityValue.textContent = '--%';
    rangeSampleValue.textContent = '0';
    rangeDashboard.dataset.tone = 'neutral';
    if (rangeSaveButton) {
      rangeSaveButton.disabled = true;
    }
    if (trainingMode === 'range') {
      setDefaultTrainingFeedback('range');
    }
    return;
  }

  rangeSpanValue.textContent = formatRangeSpan(stats.spanSemitones);
  rangeCaption.textContent = getRangeCaption(stats);
  rangeLowestValue.textContent = formatRangePitch(stats.lowest);
  rangeHighestValue.textContent = formatRangePitch(stats.highest);
  rangeComfortValue.textContent =
    stats.sampleCount >= 6
      ? `${formatRangePitch(stats.comfortLow)} - ${formatRangePitch(stats.comfortHigh)}`
      : '--';
  rangeStabilityValue.textContent = `${stats.stability}%`;
  rangeSampleValue.textContent = String(stats.sampleCount);
  if (rangeSaveButton) {
    rangeSaveButton.disabled = stats.sampleCount < 6;
  }
  rangeDashboard.dataset.tone =
    stats.sampleCount >= 10 && stats.stability >= 70
      ? 'good'
      : stats.sampleCount >= 6
        ? 'active'
        : 'neutral';
  if (trainingMode === 'range') {
    if (stats.sampleCount < 6) {
      setTrainingFeedback('再多唱几秒', `已经采到 ${stats.sampleCount} 个有效点。继续从低到高慢慢滑，让系统先看清你的范围。`, '音域');
    } else if (stats.stability < 55) {
      setTrainingFeedback('跨度有了，先放慢', `目前跨度 ${formatRangeSpan(stats.spanSemitones)}，但稳定度 ${stats.stability}%。下一遍慢一点滑，少冲高音。`, '音域', 'warn');
    } else {
      setTrainingFeedback('可以保存这次音域', `稳定度 ${stats.stability}%，舒适区约 ${formatRangePitch(stats.comfortLow)} 到 ${formatRangePitch(stats.comfortHigh)}。`, '音域', 'good');
    }
  }
}

function updateRangeTraining(now = performance.now(), pitch = currentPitch) {
  if (trainingMode !== 'range') {
    return;
  }

  if (!Number.isFinite(pitch)) {
    rangeLastPitch = null;
    updateRangeDisplay();
    return;
  }

  rangeLastPitch = pitch;
  const lastSample = rangeSamples[rangeSamples.length - 1];
  if (!lastSample || now - lastSample.time >= displayUpdateIntervalMs) {
    rangeSamples.push({ time: now, pitch });
    if (rangeSamples.length > 600) {
      rangeSamples.shift();
    }
  }
  updateRangeDisplay();
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

function hideSidebarPanel() {
  sidebar.classList.remove('open');
  sidebarToggle.setAttribute('aria-expanded', 'false');
  sidebar.setAttribute('aria-hidden', 'true');
  sidebar.hidden = true;
}

function setReadoutMode(mode) {
  const pitchReadouts = [pitchValueEl?.closest('div'), noteValueEl?.closest('div')];
  const breathReadouts = document.querySelectorAll('.breath-readout');
  const breathControls = document.querySelectorAll('.breath-control');
  const readout = document.querySelector('.readout');
  const chart = canvas?.closest('.chart');
  const isBreath = mode === 'breath';
  const isScore = mode === 'score';
  const isRange = mode === 'range';
  const isVolume = mode === 'volume';
  const isFormants = mode === 'formants';
  const isMemory = mode === 'memory';
  chart?.classList.toggle('spectrogram-analyzer', mode === 'spectrogram');
  updateMeterVisibility(mode);
  if (stopButton) {
    stopButton.textContent = mode === 'spectrogram' ? '暂停' : '停止';
  }
  if (mode !== 'pitch' && mode !== 'score' && mode !== 'memory') {
    updatePitchInspector(null);
  }
  if (breathDashboard) {
    breathDashboard.hidden = !isBreath;
  }
  if (pitchScoreDashboard) {
    pitchScoreDashboard.hidden = !shouldShowPitchScorePanel(mode);
  }
  if (rangeDashboard) {
    rangeDashboard.hidden = !isRange;
  }
  if (rangeHistoryPanel) {
    rangeHistoryPanel.hidden = !isRange;
  }
  if (songTargetPanel) {
    songTargetPanel.hidden = !(mode === 'pitch' || isScore);
  }
  if (trainingFeedbackPanel) {
    trainingFeedbackPanel.hidden = isVolume || isFormants || mode === 'spectrogram';
  }
  if (memoryDashboard) {
    memoryDashboard.hidden = !isMemory;
  }
  if (readout) {
    readout.hidden = isVolume || isFormants || isMemory;
    readout.classList.toggle('readout-breath-compact', isBreath);
  }
  pitchReadouts.forEach((el) => {
    if (el) {
      el.hidden = isBreath || isVolume || isFormants;
    }
  });
  breathReadouts.forEach((el) => {
    el.hidden = true;
  });
  breathControls.forEach((el) => {
    el.hidden = !isBreath;
  });
  if (breathReport) {
    breathReport.hidden = !isBreath || !breathReport.dataset.hasReport;
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
}

function setTrainingCopy(mode) {
  if (mode === 'breath') {
    appTitle.textContent = '出气量测量';
    appDescription.textContent = '允许麦克风权限后，对准麦克风平稳吹气，软件会估算相对出气强度、稳定度和持续时间。';
  } else if (mode === 'range') {
    appTitle.textContent = '音域训练模式';
    appDescription.textContent = '从舒适低音滑到高音，系统会记录最低/最高稳定音并估算可用舒适音区。';
  } else if (mode === 'score') {
    appTitle.textContent = '实时音准评分';
    appDescription.textContent = '设置目标音高后开始检测，持续发声即可看到偏差、稳定度和命中率。';
  } else if (mode === 'memory') {
    appTitle.textContent = '记忆感知音色训练';
    appDescription.textContent = '录制“接近目标 → 保持目标 → 回到中性/安静”的片段，分析目标匹配和隐藏路径成本。';
  } else if (mode === 'spectrogram') {
    appTitle.textContent = '泛音分析频谱图';
    appDescription.textContent = '像 Overtone Analyzer 一样同时观察钢琴键频率刻度、滚动声谱、当前强度剖面和底部能量轨迹。';
  } else if (mode === 'formants') {
    appTitle.textContent = '实时共振峰曲线';
    appDescription.textContent = '允许麦克风权限后，可以查看 F1/F2 共振峰随时间变化的曲线。';
  } else if (mode === 'volume') {
    appTitle.textContent = '实时音量曲线';
    appDescription.textContent = '允许麦克风权限后，可以看到声音音量随时间变化。';
  } else {
    appTitle.textContent = '实时音高曲线';
    appDescription.textContent = '允许麦克风权限后，对着手机唱歌即可看到音高变化。';
  }
}

function setCurveSwitcherMode(mode) {
  if (curveSwitcher) {
    curveSwitcher.hidden = trainingMode !== 'curve';
  }
  curvePitchButton?.classList.toggle('active', mode === 'pitch');
  curveVolumeButton?.classList.toggle('active', mode === 'volume');
  curveFormantButton?.classList.toggle('active', mode === 'formants');
}

function setCurveDisplayMode(mode) {
  displayMode = mode === 'volume' || mode === 'formants' ? mode : 'pitch';
  trainingMode = 'curve';
  if (displayModeSelect) {
    displayModeSelect.value = displayMode;
  }
  updateCanvasScale(canvasScale);
  setReadoutMode(displayMode);
  setTrainingCopy(displayMode);
  setCurveSwitcherMode(displayMode);
  if (displayMode === 'volume') {
    drawVolumeHistory();
  } else if (displayMode === 'formants') {
    drawFormantCurveHistory();
  } else {
    resetPitchScoreDisplay();
    drawPitchHistory();
  }
}

function showTrainingView(mode = 'pitch') {
  modeLauncher.hidden = true;
  if (libraryPage) {
    libraryPage.hidden = true;
  }
  appWindow.hidden = false;
  trainingMode = mode;
  setReadoutMode(mode);
  setTrainingCopy(mode);

  if (mode === 'curve') {
    setCurveDisplayMode('pitch');
    setSongTargetCollapsed(false);
    updateSongPracticeFlow();
  } else if (mode === 'spectrogram') {
    setCurveSwitcherMode(null);
    displayMode = 'spectrogram';
    displayModeSelect.value = 'spectrogram';
    updateCanvasScale(canvasScale);
  } else if (mode === 'breath') {
    setCurveSwitcherMode(null);
    displayMode = 'breath';
    displayModeSelect.value = 'breath';
    updateCanvasScale(canvasScale);
    resetBreathMeter();
    drawBreathHistory();
  } else if (mode === 'range') {
    setCurveSwitcherMode(null);
    trainingMode = mode;
    setReadoutMode(mode);
    setTrainingCopy(mode);
    displayMode = 'pitch';
    displayModeSelect.value = 'pitch';
    updateCanvasScale(canvasScale);
    resetRangeTraining();
    renderRangeHistory();
  } else if (mode === 'volume') {
    setCurveDisplayMode('volume');
  } else if (mode === 'pitch') {
    setCurveDisplayMode('pitch');
  } else if (mode === 'score') {
    setCurveSwitcherMode(null);
    trainingMode = mode;
    setReadoutMode(mode);
    setTrainingCopy(mode);
    displayMode = 'pitch';
    displayModeSelect.value = 'pitch';
    updateCanvasScale(canvasScale);
    targetPitchEnabled = true;
    if (targetPitchToggle) {
      targetPitchToggle.checked = true;
    }
    resetPitchScoreDisplay();
    drawPitchHistory();
  } else if (mode === 'memory') {
    setCurveSwitcherMode(null);
    trainingMode = mode;
    setReadoutMode(mode);
    setTrainingCopy(mode);
    displayMode = 'pitch';
    displayModeSelect.value = 'pitch';
    updateCanvasScale(canvasScale);
    setMemoryEmptyState(
      recordingTimelineFrames.length
        ? '可以分析最近录音，也可以重新录制一段“接近-保持-恢复”的片段。'
        : '请先录制一段“接近-保持-恢复”的片段。'
    );
    updateRecordingButtons();
    drawPitchHistory();
  } else {
    setCurveDisplayMode('pitch');
  }
}

function showLauncherView() {
  hideSidebarPanel();
  if (!startButton.disabled) {
    // already stopped
  } else {
    stop();
  }
  showLibraryPage(null);
  modeLauncher.hidden = false;
  if (libraryPage) {
    libraryPage.hidden = true;
  }
  appWindow.hidden = true;
}

function showLibraryPage(view) {
  const showRecording = view === 'recordings';
  const showAccompaniment = view === 'accompaniments';
  const shouldShowPage = showRecording || showAccompaniment;
  if (libraryPage) {
    libraryPage.hidden = !shouldShowPage;
  }
  if (modeLauncher) {
    modeLauncher.hidden = shouldShowPage;
  }
  if (appWindow) {
    appWindow.hidden = true;
  }
  if (recordingLibraryPanel) {
    recordingLibraryPanel.hidden = !showRecording;
  }
  if (accompanimentLibraryPanel) {
    accompanimentLibraryPanel.hidden = !showAccompaniment;
  }
  if (libraryToolsPanel) {
    libraryToolsPanel.hidden = !showRecording;
  }
  recordingLibraryTabButton?.classList.toggle('active', showRecording);
  accompanimentLibraryTabButton?.classList.toggle('active', showAccompaniment);
  if (libraryPageTitle) {
    libraryPageTitle.textContent = showAccompaniment ? '伴奏库' : '录音库';
  }
  if (libraryPageDescription) {
    libraryPageDescription.textContent = showAccompaniment
      ? '管理分离后保存的伴奏，随时加载到练习里。'
      : '管理录音、歌曲目标曲线、歌词和分析结果。';
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

function formatFrameTime(frameIndex) {
  return formatTimeSeconds(frameIndex * offlineHopDurationMs);
}

function findWorstPitchSegment(samples) {
  const problemSamples = samples.filter(
    (sample) => sample.absCents > pitchScoreHitToleranceCents
  );
  if (!problemSamples.length) {
    return null;
  }

  const segments = [];
  let current = null;
  problemSamples.forEach((sample) => {
    if (!current || sample.index - current.endIndex > 1) {
      current = {
        startIndex: sample.index,
        endIndex: sample.index,
        errors: [sample.absCents],
      };
      segments.push(current);
      return;
    }
    current.endIndex = sample.index;
    current.errors.push(sample.absCents);
  });

  return segments
    .map((segment) => ({
      ...segment,
      meanError: mean(segment.errors),
      peakError: Math.max(...segment.errors),
      durationMs: (segment.endIndex - segment.startIndex + 1) * offlineHopDurationMs,
    }))
    .sort((a, b) => b.meanError * b.durationMs - a.meanError * a.durationMs)[0];
}

function evaluatePitchAccuracy(referenceTrack, vocalTrack) {
  const compareLength = Math.min(referenceTrack.length, vocalTrack.length);
  const samples = [];
  let referenceVoicedFrames = 0;
  let vocalVoicedFrames = 0;

  for (let i = 0; i < compareLength; i += 1) {
    const ref = referenceTrack[i];
    const vocal = vocalTrack[i];
    if (ref) {
      referenceVoicedFrames += 1;
    }
    if (vocal) {
      vocalVoicedFrames += 1;
    }
    if (!ref || !vocal) {
      continue;
    }
    const cents = frequencyToCentsError(vocal, ref);
    if (!Number.isFinite(cents)) {
      continue;
    }
    samples.push({
      index: i,
      cents,
      absCents: Math.abs(cents),
      ref,
      vocal,
    });
  }

  if (!samples.length) {
    return null;
  }

  const absErrors = samples.map((sample) => sample.absCents);
  const meanAbsError = mean(absErrors);
  const meanSignedError = mean(samples.map((sample) => sample.cents));
  const hitRate = Math.round(
    (samples.filter((sample) => sample.absCents <= pitchScoreHitToleranceCents).length /
      samples.length) *
      100
  );
  const goodRate = Math.round(
    (samples.filter((sample) => sample.absCents <= pitchScoreGoodToleranceCents).length /
      samples.length) *
      100
  );
  const coverage = Math.round((samples.length / Math.max(referenceVoicedFrames, 1)) * 100);
  const vocalCoverage = Math.round((vocalVoicedFrames / Math.max(compareLength, 1)) * 100);
  const p90AbsError = percentile(absErrors, 0.9);
  const worstSegment = findWorstPitchSegment(samples);
  const score = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        (100 - Math.min(100, (meanAbsError / pitchScoreMaxUsefulCents) * 100)) * 0.4 +
          hitRate * 0.35 +
          coverage * 0.15 +
          goodRate * 0.1
      )
    )
  );
  const label =
    score >= 78 && hitRate >= 70 && coverage >= 45
      ? '音准可信'
      : score >= 58 && coverage >= 30
        ? '接近目标'
        : '需要修正';
  const tone = label === '音准可信' ? 'good' : label === '接近目标' ? 'warn' : 'bad';

  return {
    score,
    label,
    tone,
    meanAbsError,
    meanSignedError,
    p90AbsError,
    hitRate,
    goodRate,
    coverage,
    vocalCoverage,
    sampleCount: samples.length,
    worstSegment,
  };
}

async function runPitchAccuracyAnalysis() {
  if (!(accompanimentFile || songPitchTrack.length) || !lastRecordingBlob || offlineAnalysisInProgress) {
    return;
  }

  pitchAccuracyButton.disabled = true;
  setPitchAccuracyResult('分析中...');
  let vocalBuffer;
  try {
    vocalBuffer = await decodeAudioBlob(lastRecordingBlob);
  } catch (error) {
    console.error(error);
    setPitchAccuracyResult('解码失败');
    updatePitchAccuracyButton();
    updateSongPracticeFlow();
    return;
  }

  let referenceTrack = null;
  if (songPitchTrack.length) {
    referenceTrack = songPitchTrack.map((point) => point.pitch);
  } else {
    try {
      const referenceBuffer = await decodeAudioFile(accompanimentFile);
      referenceTrack = extractPitchTrack(referenceBuffer);
    } catch (error) {
      console.error(error);
      setPitchAccuracyResult('解码失败');
      updatePitchAccuracyButton();
      updateSongPracticeFlow();
      return;
    }
  }
  const vocalTrack = extractPitchTrack(vocalBuffer);
  const result = evaluatePitchAccuracy(referenceTrack, vocalTrack);

  if (!result) {
    setPitchAccuracyResult('有效音高不足');
    updatePitchAccuracyButton();
    updateSongPracticeFlow();
    return;
  }

  const direction =
    Math.abs(result.meanSignedError) <= pitchScoreGoodToleranceCents
      ? '整体居中'
      : result.meanSignedError > 0
        ? '整体偏高'
        : '整体偏低';
  const worstSegmentText = result.worstSegment
    ? `，重点回听 ${formatFrameTime(result.worstSegment.startIndex)}-${formatFrameTime(
        result.worstSegment.endIndex + 1
      )}`
    : '';

  setPitchAccuracyResult(
    `${result.label} ${result.score}%｜命中 ${result.hitRate}%｜P90 ${result.p90AbsError.toFixed(
      1
    )} cents｜覆盖 ${result.coverage}%${worstSegmentText}`,
    result.tone
  );
  setSongTrainingResult(
    songPitchTrack.length
      ? `${direction}，平均 ${result.meanAbsError.toFixed(1)} cents，稳定命中 ${result.goodRate}%`
      : '--',
    result.tone
  );
  if (songPitchTrack.length) {
    setTrainingFeedback(
      result.tone === 'good' ? '这一遍音准不错' : direction,
      `${direction}。平均偏差 ${result.meanAbsError.toFixed(1)} cents，稳定命中 ${result.goodRate}%。下一遍重点回听误差最大的片段。`,
      '评估',
      result.tone
    );
  }
  updatePitchAccuracyButton();
  updateSongPracticeFlow('评估完成');
}

function updateVolumeMeter(rms) {
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

function updateCanvasScale(value) {
  const scale = Number(value) || 1;
  canvasScale = scale;
  const isSpectrogram = displayMode === 'spectrogram';
  const appWidth = Math.round((isSpectrogram ? spectrogramAppMaxWidth : baseAppMaxWidth) * scale);
  document.documentElement.style.setProperty('--app-max-width', `${appWidth}px`);
  const width = Math.round((isSpectrogram ? spectrogramCanvasWidth : baseCanvasWidth) * scale);
  const height = Math.round((isSpectrogram ? spectrogramCanvasHeight : baseCanvasHeight) * scale);
  canvas.width = width;
  canvas.height = height;
  if (canvasScaleValue) {
    canvasScaleValue.textContent = `${Math.round(scale * 100)}%`;
  }
  if (displayMode === 'spectrogram') {
    resetSpectrogram();
  } else if (displayMode === 'breath') {
    resetBreathMeter();
    drawBreathHistory();
  } else {
    drawPitchHistory();
  }
}

function initWindowResize() {
  if (!appWindow || !window.PointerEvent) {
    return;
  }

  const handles = appWindow.querySelectorAll('[data-resize]');
  if (handles.length === 0) {
    return;
  }

  let activePointerId = null;
  let activeHandle = null;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  function onPointerMove(event) {
    if (event.pointerId !== activePointerId || !activeHandle) {
      return;
    }

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    let width = startWidth;
    let height = startHeight;

    if (activeHandle.includes('e')) {
      width = startWidth + dx;
    }
    if (activeHandle.includes('w')) {
      width = startWidth - dx;
    }
    if (activeHandle.includes('s')) {
      height = startHeight + dy;
    }
    if (activeHandle.includes('n')) {
      height = startHeight - dy;
    }

    const maxWidth = window.innerWidth - 32;
    const maxHeight = window.innerHeight - 32;
    width = Math.max(minResizableWidth, Math.min(maxWidth, Math.round(width)));
    height = Math.max(minResizableHeight, Math.min(maxHeight, Math.round(height)));

    appWindow.style.width = `${width}px`;
    appWindow.style.height = `${height}px`;
  }

  function endResize(event) {
    if (activePointerId === null || event.pointerId !== activePointerId) {
      return;
    }

    if (event.target?.releasePointerCapture) {
      try {
        event.target.releasePointerCapture(activePointerId);
      } catch (_error) {
        // no-op
      }
    }

    activePointerId = null;
    activeHandle = null;
    appWindow.classList.remove('is-resizing');
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endResize);
    window.removeEventListener('pointercancel', endResize);
  }

  handles.forEach((handle) => {
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      const direction = handle.dataset.resize;
      if (!direction) {
        return;
      }

      activePointerId = event.pointerId;
      activeHandle = direction;
      startX = event.clientX;
      startY = event.clientY;
      const rect = appWindow.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      appWindow.classList.add('is-resizing');

      if (handle.setPointerCapture) {
        handle.setPointerCapture(event.pointerId);
      }
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', endResize);
      window.addEventListener('pointercancel', endResize);
    });
  });
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

  // 用“音程（cents）”判断是否真的是倍频错误（octave error）
  const cents = (a, b) => 1200 * Math.log2(a / b);
  const absCents = (a, b) => Math.abs(cents(a, b));

  // 如果当前pitch已经离reference很远（比如>300 cents=小三度以上），
  // 不要强行用 pitch/2 去贴reference（否则会把真正的转高/转低压回去）
  const farEnough = absCents(pitch, reference) > 300;
  if (farEnough) return pitch;

  // 只有在“看起来像倍频误判”时才纠错
  const c0 = absCents(pitch, reference);
  const cHalf = absCents(pitch / 2, reference);
  const cDouble = absCents(pitch * 2, reference);

  let best = pitch;
  let bestC = c0;

  if (cHalf < bestC) { bestC = cHalf; best = pitch / 2; }
  if (cDouble < bestC) { bestC = cDouble; best = pitch * 2; }

  // 再加一道门：纠错也必须“真的更接近”，并且接近到一个很小的范围（比如<=80 cents）
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

function updateRecordingButtons() {
  const hasRecording = Boolean(lastRecordingBlob);
  analyzeRecordingButton.disabled = !hasRecording || offlineAnalysisInProgress;
  downloadRecordingButton.disabled = !hasRecording;
  updateRecordingLibraryStatus();
  if (memoryAnalyzeButton) {
    memoryAnalyzeButton.disabled = !hasRecording || !recordingTimelineFrames.length;
  }
  updateSongPracticeFlow();
}

async function startVoiceRecording() {
  if (offlineAnalysisInProgress) {
    return false;
  }
  try {
    if (!audioContext || !sourceNode?.mediaStream) {
      await start();
    }
    if (!sourceNode?.mediaStream) {
      throw new Error('No microphone stream available');
    }
    const stream = sourceNode.mediaStream;
    const recorder = new MediaRecorder(stream);
    recordedChunks = [];
    resetRecordingTimeline();
    recordingStartTime = performance.now();
    if (recordingTimelinePanel) {
      recordingTimelinePanel.hidden = false;
    }
    setTimelineStatus('录音中，时间轴正在记录...');
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    });
    recorder.addEventListener('stop', () => {
      const blob = new Blob(recordedChunks, { type: recorder.mimeType });
      lastRecordingBlob = blob.size > 0 ? blob : null;
      recordedChunks = [];
      recordingTimelineDurationMs = Math.max(
        recordingTimelineDurationMs,
        performance.now() - recordingStartTime
      );
      if (lastRecordingBlob) {
        addRecordingToLibrary(lastRecordingBlob);
        prepareRecordingPlayback(lastRecordingBlob);
        selectRecordingTime(0, false);
        setTimelineStatus('点击时间轴可从任意位置播放，并查看当时波形');
      } else {
        setTimelineStatus('录音为空，请重新录制');
      }
      updateRecordingButtons();
      updatePitchAccuracyButton();
      if (songPracticeAutoReviewPending) {
        songPracticeAutoReviewPending = false;
        if (lastRecordingBlob && songPitchTrack.length) {
          updateSongPracticeFlow('评估中');
          runPitchAccuracyAnalysis();
        } else {
          updateSongPracticeFlow();
        }
      }
    });
    mediaRecorder = recorder;
    recorder.start();
    recordButton.disabled = true;
    stopRecordButton.disabled = false;
    setStatus('录音中', 'active');
    updateSongPracticeFlow();
    return true;
  } catch (error) {
    console.error(error);
    setStatus('无法开始录音，请检查权限设置');
    updateSongPracticeFlow();
    return false;
  }
  setDefaultTrainingFeedback(mode);
  applyTaskControls(mode);
}

function stopVoiceRecording({ reviewAfterStop = false } = {}) {
  songPracticeAutoReviewPending = Boolean(reviewAfterStop);
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  } else if (reviewAfterStop && lastRecordingBlob && songPitchTrack.length) {
    songPracticeAutoReviewPending = false;
    runPitchAccuracyAnalysis();
  } else {
    songPracticeAutoReviewPending = false;
  }
  recordButton.disabled = false;
  stopRecordButton.disabled = true;
  updateSongPracticeFlow(reviewAfterStop ? '准备评估' : null);
}

async function playSongPitchReference() {
  if (!songPitchAudio) {
    return false;
  }
  try {
    if (accompanimentAudio && !accompanimentAudio.paused) {
      accompanimentAudio.pause();
      setAccompanimentStatus('已暂停');
    }
    songPitchAudio.currentTime = 0;
    await songPitchAudio.play();
    syncOfflineWindowToSongPlayback();
    stopSongPitchPlaybackProgress();
    updateSongPitchPlaybackProgress();
    return true;
  } catch (error) {
    console.error(error);
    setSongPitchPlaybackStatus('无法播放', 'bad');
    return false;
  }
}

async function startSongPracticeFlow() {
  if (!songPitchTrack.length) {
    showLibraryPage('recordings');
    updateSongPracticeFlow('请先准备歌曲');
    return;
  }
  setSongTargetCollapsed(false);
  const recordingStarted = await startVoiceRecording();
  if (recordingStarted) {
    const playbackStarted = await playSongPitchReference();
    setSongTrainingResult('正在跟唱，结束后会自动评估。');
    updateSongPracticeFlow(playbackStarted ? '跟唱录音中' : '录音中');
  }
}

function stopSongPracticeAndReview() {
  if (songPitchAudio && !songPitchAudio.paused) {
    songPitchAudio.pause();
    stopSongPitchPlaybackProgress();
    setSongPitchPlaybackStatus(`已暂停 ${formatTimeSeconds(songPitchAudio.currentTime * 1000)}`);
  }
  stopVoiceRecording({ reviewAfterStop: true });
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
  adaptiveNoiseFloorRms = pitchMinEnergyThreshold;
  adaptiveEnergyThreshold = pitchMinEnergyThreshold;
  currentPitch = null;
  lastDisplayUpdate = 0;
  pitchValueEl.textContent = '-- Hz';
  noteValueEl.textContent = '--';
  clearSelectedPitchPoint();
}

startButton.addEventListener('click', start);
stopButton.addEventListener('click', stop);
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
  setTrainingCopy(displayMode);
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
  startSongPracticeFlow();
});
songPracticeStopReviewButton?.addEventListener('click', () => {
  stopSongPracticeAndReview();
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
    await songPitchAudio.play();
    syncOfflineWindowToSongPlayback();
    stopSongPitchPlaybackProgress();
    updateSongPitchPlaybackProgress();
  } catch (error) {
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
  setSongPitchPlaybackStatus(`已暂停 ${formatTimeSeconds(songPitchAudio.currentTime * 1000)}`);
});
stopSongPitchButton?.addEventListener('click', () => {
  if (!songPitchAudio) {
    return;
  }
  songPitchAudio.pause();
  songPitchAudio.currentTime = 0;
  stopSongPitchPlaybackProgress();
  resetOfflineWindow();
  drawPitchHistory();
  setSongPitchPlaybackStatus('已停止');
});
memoryAnalyzeButton?.addEventListener('click', () => {
  analyzeMemoryPath();
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

openCurveModeButton?.addEventListener('click', () => {
  showTrainingView('curve');
});
curvePitchButton?.addEventListener('click', () => {
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
accompanimentLibraryTabButton?.addEventListener('click', () => {
  showLibraryPage('accompaniments');
});
rangeResetButton?.addEventListener('click', () => {
  resetRangeTraining();
});
rangeSaveButton?.addEventListener('click', () => {
  saveRangeTrainingResult();
});
rangeClearHistoryButton?.addEventListener('click', () => {
  clearRangeHistory();
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

accompanimentInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  loadAccompanimentFile(file);
});

playAccompanimentButton.addEventListener('click', async () => {
  if (!accompanimentAudio) {
    return;
  }
  try {
    await accompanimentAudio.play();
    setAccompanimentStatus('播放中');
  } catch (error) {
    console.error(error);
    setAccompanimentStatus('无法播放');
  }
});

pauseAccompanimentButton.addEventListener('click', () => {
  if (!accompanimentAudio) {
    return;
  }
  accompanimentAudio.pause();
  setAccompanimentStatus('已暂停');
});

stopAccompanimentButton.addEventListener('click', () => {
  if (!accompanimentAudio) {
    return;
  }
  accompanimentAudio.pause();
  accompanimentAudio.currentTime = 0;
  setAccompanimentStatus('已停止');
});

accompanimentVolume.addEventListener('input', (event) => {
  if (!accompanimentAudio) {
    return;
  }
  accompanimentAudio.volume = Number(event.target.value);
});
