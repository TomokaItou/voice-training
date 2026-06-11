(function () {
  function dispatchChange(element) {
    try {
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (error) {
      const event = document.createEvent('Event');
      event.initEvent('change', true, true);
      element.dispatchEvent(event);
    }
  }

  function forceBreathView() {
    const modeLauncher = document.getElementById('modeLauncher');
    const libraryPage = document.getElementById('libraryPage');
    const appWindow = document.getElementById('appWindow');
    const displayModeSelect = document.getElementById('displayModeSelect');

    if (modeLauncher) modeLauncher.hidden = true;
    if (libraryPage) libraryPage.hidden = true;
    if (appWindow) appWindow.hidden = false;

    if (displayModeSelect) {
      displayModeSelect.value = 'breath';
      dispatchChange(displayModeSelect);
    }

    const title = document.getElementById('appTitle');
    const description = document.getElementById('appDescription');
    const breathDashboard = document.getElementById('breathDashboard');
    const breathDetailPanel = document.getElementById('breathDetailPanel');
    const breathChartPlaceholder = document.getElementById('breathChartPlaceholder');
    const songTargetPanel = document.getElementById('songTargetPanel');
    const pitchScoreDashboard = document.getElementById('pitchScoreDashboard');
    const readout = document.querySelector('.readout');
    const chart = document.querySelector('.chart');
    const practiceControls = document.getElementById('practiceControls');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const stopButton = document.getElementById('stopButton');
    const status = document.getElementById('status');

    if (title) title.textContent = '出气量训练';
    if (description) {
      description.textContent = '保持平稳、连续的气流，不要一开始就用最大气流。';
    }
    if (breathDashboard) breathDashboard.hidden = false;
    if (breathDetailPanel) breathDetailPanel.hidden = false;
    if (breathChartPlaceholder) breathChartPlaceholder.hidden = false;
    if (songTargetPanel) songTargetPanel.hidden = true;
    if (pitchScoreDashboard) pitchScoreDashboard.hidden = true;
    if (readout) readout.hidden = true;
    if (chart) {
      chart.hidden = true;
      chart.classList.add('breath-practice-empty');
    }
    if (practiceControls) {
      practiceControls.hidden = false;
      practiceControls.classList.add('breath-controls');
      practiceControls.classList.remove('score-controls');
    }
    if (startButton) {
      startButton.hidden = false;
      startButton.disabled = false;
      startButton.textContent = '校准环境';
    }
    if (pauseButton) pauseButton.hidden = true;
    if (stopButton) stopButton.hidden = true;
    if (status) status.hidden = true;
  }

  function routeTrainingMode(mode) {
    if (!mode) return;
    if (mode === 'breath') {
      forceBreathView();
      return;
    }
    if (typeof window.showTrainingView === 'function') {
      window.showTrainingView(mode);
    }
  }

  function handleLauncherEvent(event) {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('[data-training-mode]');
    const mode = button?.dataset.trainingMode;
    if (!mode) return;
    if (mode !== 'breath' && typeof window.showTrainingView !== 'function') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation();
    }
    routeTrainingMode(mode);
  }

  function bindLauncherRouter() {
    window.launchTrainingMode = routeTrainingMode;

    const launcher = document.getElementById('modeLauncher');
    if (launcher) {
      ['pointerdown', 'mousedown', 'click'].forEach((eventName) => {
        launcher.addEventListener(eventName, handleLauncherEvent, true);
      });
    }

    document.querySelectorAll('[data-training-mode]').forEach((button) => {
      ['pointerdown', 'mousedown', 'click'].forEach((eventName) => {
        button.addEventListener(eventName, handleLauncherEvent, true);
      });
    });

    const breathButton = document.getElementById('openBreathModeButton');
    if (breathButton) {
      ['pointerdown', 'mousedown', 'click'].forEach((eventName) => {
        breathButton.addEventListener(eventName, (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
          }
          forceBreathView();
        }, true);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindLauncherRouter);
  } else {
    bindLauncherRouter();
  }
})();
