function setTrainingCopy(mode) {
  if (mode === 'breath') {
    appTitle.textContent = '出气量训练';
    appDescription.textContent = '保持平稳、连续的气流，不要一开始就用最大气流。';
  } else if (mode === 'curve') {
    appTitle.textContent = '跟唱训练';
    appDescription.textContent = '先准备歌曲目标，再跟着参考音频录一遍；系统会把音准和节奏合成反馈。';
  } else if (mode === 'classic') {
    appTitle.textContent = '实时音高曲线';
    appDescription.textContent = '允许麦克风权限后，直接查看你的实时音高、音名和曲线变化。';
  } else if (mode === 'fix') {
    appTitle.textContent = 'Fix One Thing';
    appDescription.textContent = '唱一句，Mira 只选一个问题；练 30 秒，再判断有没有进步。';
  } else if (mode === 'rhythm') {
    appTitle.textContent = '节奏训练模式';
    appDescription.textContent = '跟着节拍器唱短音、念辅音或拍手，系统会检测起音是否落在拍点附近。';
  } else if (mode === 'range') {
    appTitle.textContent = '音域训练模式';
    appDescription.textContent = '从舒适低音滑到高音，系统会记录最低/最高稳定音并估算可用舒适音区。';
  } else if (mode === 'score') {
    appTitle.textContent = '实时音准训练';
    appDescription.textContent = '对准目标音高持续发声，实时观察偏差和稳定度。';
  } else if (mode === 'memory') {
    appTitle.textContent = '目标音色保持训练';
    appDescription.textContent = '录一段“自然声音 → 接近目标 → 保持目标 → 回到自然”的声音路径，系统会给出下一步练习建议。';
  } else if (mode === 'action') {
    appTitle.textContent = 'S88 动作路径导航';
    appDescription.textContent = '根据目标声音和当前声音，推荐下一步可执行的发声动作。';
  } else if (mode === 'spectrogram') {
    appTitle.textContent = '泛音分析频谱图';
    appDescription.textContent = '同时观察频率刻度、滚动声谱、当前强度剖面和底部能量轨迹。';
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
  if (curveSwitcherDetails) {
    curveSwitcherDetails.hidden = trainingMode !== 'curve';
  }
  if (curveSwitcher) {
    curveSwitcher.hidden = trainingMode !== 'curve';
  }
  const canShowGame = mode === 'pitch' && hasSongPitchTarget();
  if (songGameViewButton) {
    songGameViewButton.hidden = !canShowGame;
    songGameViewButton.classList.toggle('active', canShowGame && songGameViewEnabled);
  }
  curvePitchButton?.classList.toggle('active', mode === 'pitch' && (!canShowGame || !songGameViewEnabled));
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
  setTrainingCopy(displayMode === 'pitch' ? 'curve' : displayMode);
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
  if (typeof hideVocalMoveLibrary === 'function') {
    hideVocalMoveLibrary();
  } else {
    document.getElementById('vocalMoveLibraryPage')?.setAttribute('hidden', '');
  }
  if (typeof hideActiveVoiceSearch === 'function') {
    hideActiveVoiceSearch();
  } else {
    document.getElementById('activeSearchPage')?.setAttribute('hidden', '');
  }
  if (typeof hideAiVocalTeacher === 'function') {
    hideAiVocalTeacher();
  } else {
    document.getElementById('aiVocalTeacherPage')?.setAttribute('hidden', '');
  }
  if (typeof hideSongAnalysisPage === 'function') {
    hideSongAnalysisPage();
  } else {
    document.getElementById('songAnalysisPage')?.setAttribute('hidden', '');
  }
  appWindow.hidden = false;
  trainingMode = mode;
  setReadoutMode(mode);
  setTrainingCopy(mode);

  if (mode === 'curve') {
    setCurveDisplayMode('pitch');
    setSongTargetCollapsed(false);
    updateSongPracticeFlow();
  } else if (mode === 'classic') {
    setCurveSwitcherMode(null);
    trainingMode = mode;
    displayMode = 'pitch';
    if (displayModeSelect) {
      displayModeSelect.value = 'pitch';
    }
    updateCanvasScale(canvasScale);
    setReadoutMode('pitch');
    setTrainingCopy(mode);
    resetPitchScoreDisplay();
    drawPitchHistory();
  } else if (mode === 'fix') {
    setCurveSwitcherMode(null);
    trainingMode = mode;
    setReadoutMode(mode);
    setTrainingCopy(mode);
    displayMode = 'pitch';
    displayModeSelect.value = 'pitch';
    updateCanvasScale(canvasScale);
    if (typeof renderFixOneThingFlow === 'function') {
      renderFixOneThingFlow();
    }
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
    clearBreathReport();
    drawBreathHistory();
    setReadoutMode('breath');
    updateBreathTrainingControls();
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
    setRangeTrainingPhase('ready');
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
    pitchHistory = [];
    volumeHistory = [];
    resetPitchScoreDisplay();
    setTrainingFeedback(
      '目标音高：300 Hz',
      '持续发声 3~6 秒，保持稳定，观察当前偏差和命中率。',
      '音准'
    );
    if (startButton) {
      startButton.textContent = '开始检测';
      startButton.disabled = false;
    }
    if (pauseButton) {
      pauseButton.hidden = true;
    }
    if (stopButton) {
      stopButton.hidden = true;
    }
    setReadoutMode(mode);
    drawPitchHistory();
  } else if (mode === 'memory') {
    setCurveSwitcherMode(null);
    trainingMode = mode;
    setReadoutMode(mode);
    setTrainingCopy(mode);
    displayMode = 'pitch';
    displayModeSelect.value = 'pitch';
    updateCanvasScale(canvasScale);
    memoryHasResult = false;
    setMemoryTrainingPhase('ready');
    setMemoryEmptyState(
      recordingTimelineFrames.length
        ? '可以分析最近录音，也可以重新录制一段“接近-保持-恢复”的片段。'
        : '请先录制一段“接近-保持-恢复”的片段。'
    );
    updateRecordingButtons();
    setMemoryTrainingPhase('ready');
  } else if (mode === 'action') {
    setCurveSwitcherMode(null);
    trainingMode = mode;
    setReadoutMode(mode);
    setTrainingCopy(mode);
    displayMode = 'pitch';
    displayModeSelect.value = 'pitch';
    updateCanvasScale(canvasScale);
    s88ResetActionState();
    setS88TrainingPhase();
  } else if (mode === 'rhythm') {
    setCurveSwitcherMode(null);
    trainingMode = mode;
    setReadoutMode(mode);
    setTrainingCopy(mode);
    displayMode = 'pitch';
    displayModeSelect.value = 'pitch';
    updateRhythmConfig();
    resetRhythmTraining();
  } else {
    setCurveDisplayMode('pitch');
  }
  setDefaultTrainingFeedback(trainingMode);
  applyTaskControls(trainingMode);
  if (trainingMode === 'score') {
    setTrainingFeedback(
      `目标音高：${Math.round(targetPitchHz)} Hz`,
      '持续发声 3~6 秒，保持稳定，观察当前偏差和命中率。',
      '音准'
    );
    setReadoutMode('score');
    if (startButton) {
      startButton.textContent = audioContext && sourceNode ? '结束检测' : '开始检测';
      startButton.disabled = false;
    }
  }
  if (trainingMode === 'range') {
    setRangeTrainingPhase(rangeTrainingPhase);
  }
  if (trainingMode === 'memory') {
    setMemoryTrainingPhase(memoryTrainingPhase);
  }
  if (trainingMode === 'fix' && typeof renderFixOneThingFlow === 'function') {
    renderFixOneThingFlow();
  }
}

window.showTrainingView = showTrainingView;
window.showLauncherView = showLauncherView;
window.showLibraryPage = showLibraryPage;

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
  if (typeof hideVocalMoveLibrary === 'function') {
    hideVocalMoveLibrary();
  } else {
    document.getElementById('vocalMoveLibraryPage')?.setAttribute('hidden', '');
  }
  if (typeof hideActiveVoiceSearch === 'function') {
    hideActiveVoiceSearch();
  } else {
    document.getElementById('activeSearchPage')?.setAttribute('hidden', '');
  }
  if (typeof hideAiVocalTeacher === 'function') {
    hideAiVocalTeacher();
  } else {
    document.getElementById('aiVocalTeacherPage')?.setAttribute('hidden', '');
  }
  if (typeof hideSongAnalysisPage === 'function') {
    hideSongAnalysisPage();
  } else {
    document.getElementById('songAnalysisPage')?.setAttribute('hidden', '');
  }
  appWindow.hidden = true;
}

function showLibraryPage(view) {
  const showRecording = view === 'recordings';
  const showAccompaniment = view === 'accompaniments';
  const showSuccess = view === 'success';
  const shouldShowPage = showRecording || showAccompaniment || showSuccess;
  if (libraryPage) {
    libraryPage.hidden = !shouldShowPage;
  }
  if (modeLauncher) {
    modeLauncher.hidden = shouldShowPage;
  }
  if (appWindow) {
    appWindow.hidden = true;
  }
  if (typeof hideVocalMoveLibrary === 'function') {
    hideVocalMoveLibrary();
  } else {
    document.getElementById('vocalMoveLibraryPage')?.setAttribute('hidden', '');
  }
  if (typeof hideActiveVoiceSearch === 'function') {
    hideActiveVoiceSearch();
  } else {
    document.getElementById('activeSearchPage')?.setAttribute('hidden', '');
  }
  if (typeof hideAiVocalTeacher === 'function') {
    hideAiVocalTeacher();
  } else {
    document.getElementById('aiVocalTeacherPage')?.setAttribute('hidden', '');
  }
  if (typeof hideSongAnalysisPage === 'function') {
    hideSongAnalysisPage();
  } else {
    document.getElementById('songAnalysisPage')?.setAttribute('hidden', '');
  }
  if (recordingLibraryPanel) {
    recordingLibraryPanel.hidden = !showRecording;
  }
  if (successLibraryPanel) {
    successLibraryPanel.hidden = !showSuccess;
  }
  if (accompanimentLibraryPanel) {
    accompanimentLibraryPanel.hidden = !showAccompaniment;
  }
  if (libraryToolsPanel) {
    libraryToolsPanel.hidden = !showRecording;
  }
  recordingLibraryTabButton?.classList.toggle('active', showRecording);
  successLibraryTabButton?.classList.toggle('active', showSuccess);
  accompanimentLibraryTabButton?.classList.toggle('active', showAccompaniment);
  if (libraryPageTitle) {
    libraryPageTitle.textContent = showSuccess ? '我的最佳时刻' : (showAccompaniment ? '伴奏库' : '录音库');
  }
  if (libraryPageDescription) {
    libraryPageDescription.textContent = showSuccess
      ? 'Mira 记住你唱得最好的时刻，并把它们变成个人参照。'
      : showAccompaniment
        ? '管理分离后保存的伴奏，随时加载到练习里。'
        : '管理录音、歌曲目标曲线、歌词和分析结果。';
  }
  if (showSuccess && typeof renderSuccessLibrary === 'function') {
    renderSuccessLibrary();
  }
}
