// Shared application shell helpers: status, controls, layout, and resizing.

function updateMeterVisibility(activeMode = displayMode) {
  const chart = canvas?.closest('.chart');
  const isGameLane = typeof isSongGameLaneActive === 'function' && isSongGameLaneActive();
  const isScoreMode = trainingMode === 'score' || activeMode === 'score';
  const isBreathMode = trainingMode === 'breath' || activeMode === 'breath';
  const showVolume =
    activeMode !== 'spectrogram' && !isScoreMode && !isBreathMode && !isGameLane && (volumeMeterToggle?.checked ?? true);
  const showTilt =
    activeMode !== 'spectrogram' && !isScoreMode && !isBreathMode && !isGameLane && (tiltMeterToggle?.checked ?? true);

  if (volumeMeterColumn) {
    volumeMeterColumn.hidden = !showVolume;
  }
  if (tiltMeterColumn) {
    tiltMeterColumn.hidden = !showTilt;
  }

  chart?.classList.toggle('volume-meter-hidden', !showVolume);
  chart?.classList.toggle('tilt-meter-hidden', !showTilt);
  chart?.classList.toggle('song-game-lane', isSongGameLaneActive());
}

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

function getTaskModeKey(mode = trainingMode) {
  if (mode === 'curve' || mode === 'classic') {
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

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarToggle.setAttribute('aria-expanded', 'false');
  sidebar.setAttribute('aria-hidden', 'true');
  sidebar.hidden = true;
}

function hideSidebarPanel() {
  sidebar.classList.remove('open');
  sidebarToggle.setAttribute('aria-expanded', 'false');
  sidebar.setAttribute('aria-hidden', 'true');
  sidebar.hidden = true;
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
