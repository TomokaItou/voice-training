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

  function setHomeTab(tabName) {
    const launcher = document.getElementById('modeLauncher');
    if (!launcher || !tabName) return;
    launcher.dataset.homeTab = tabName;
    launcher.querySelectorAll('[data-home-section]').forEach((section) => {
      const sectionName = section.getAttribute('data-home-section');
      const isTodayHero = tabName === 'today'
        && sectionName === 'today'
        && section.classList.contains('mira-hero');
      const shouldShow = isTodayHero || (tabName !== 'today' && sectionName === tabName);
      section.hidden = !shouldShow;
      section.style.display = shouldShow ? '' : 'none';
      section.classList.toggle('is-home-section-visible', shouldShow);
    });
    const flowRoute = launcher.querySelector('.flow-training-route[data-home-section="flow"]');
    if (flowRoute) {
      const showFlow = tabName === 'flow';
      flowRoute.hidden = !showFlow;
      flowRoute.style.display = showFlow ? 'grid' : 'none';
      flowRoute.classList.toggle('is-home-section-visible', showFlow);
    }
    document.querySelectorAll('[data-home-tab-button]').forEach((button) => {
      const isActive = button.dataset.homeTabButton === tabName;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function bindHomeTabs() {
    const launcher = document.getElementById('modeLauncher');
    if (!launcher) return;
    setHomeTab(launcher.dataset.homeTab || 'today');

    document.querySelectorAll('[data-home-tab-button]').forEach((button) => {
      button.addEventListener('click', () => {
        const nextTab = button.dataset.homeTabButton || 'today';
        setHomeTab(nextTab);
        if (nextTab === 'songs') {
          renderSongCenterRecents();
        } else if (nextTab === 'flow') {
          focusFlowFirstStep();
        }
      });
    });

    const startTodayButton = document.getElementById('startTodayTrainingButton');
    startTodayButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
      openTodayLessonFlow();
    }, true);

    const songShortcutButton = document.getElementById('miraSongButton');
    songShortcutButton?.addEventListener('click', () => {
      setHomeTab('songs');
      document.getElementById('songAnalysisEntryCard')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    const openLibrary = (view) => {
      if (typeof window.showLibraryPage === 'function') {
        window.showLibraryPage(view);
      }
    };

    const openSongsTab = () => {
      setHomeTab('songs');
      document.getElementById('songAnalysisEntryCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      renderSongCenterRecents();
    };

    document.getElementById('homeQuickChooseSongButton')?.addEventListener('click', openSongsTab);
    document.getElementById('homeQuickMySongsButton')?.addEventListener('click', () => openLibrary('recordings'));
    document.getElementById('homeQuickAccompanimentButton')?.addEventListener('click', () => openLibrary('accompaniments'));
    document.getElementById('songCenterAudioLibraryButton')?.addEventListener('click', () => openLibrary('recordings'));
    document.getElementById('songCenterMySongsButton')?.addEventListener('click', () => openLibrary('recordings'));
    document.getElementById('songCenterAccompanimentButton')?.addEventListener('click', () => openLibrary('accompaniments'));
    document.getElementById('songCenterMaterialsButton')?.addEventListener('click', () => openLibrary('success'));
    document.getElementById('songCenterRefreshRecentsButton')?.addEventListener('click', renderSongCenterRecents);
    document.getElementById('songCenterUploadButton')?.addEventListener('click', () => {
      if (typeof window.showSongAnalysisPage === 'function') {
        window.showSongAnalysisPage();
      }
      const input = document.getElementById('songAnalysisInput') || document.getElementById('songPitchInput');
      if (input) input.click();
    });
    document.getElementById('aiTeacherFixOneThingButton')?.addEventListener('click', () => {
      if (typeof window.showTrainingView === 'function') {
        window.showTrainingView('fix');
      }
    });
    document.getElementById('aiTeacherHistoryButton')?.addEventListener('click', () => openLibrary('success'));
    document.getElementById('routeSongSearchForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = document.getElementById('routeSongSearchInput')?.value || '';
      setHomeTab('songs');
      const songInput = document.getElementById('songSearchInput');
      if (songInput) songInput.value = query;
      if (typeof searchSongs === 'function') {
        searchSongs(query);
      }
    });

    renderSongCenterRecents();
  }

  function openTodayLessonFlow() {
    setHomeTab('flow');
    focusFlowFirstStep();
  }

  function focusFlowFirstStep() {
    const route = document.querySelector('.flow-training-route[data-home-section="flow"]');
    const firstStep = route?.querySelector('.route-song-card');
    route?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.route-panel.is-focused').forEach((element) => {
      element.classList.remove('is-focused');
    });
    firstStep?.classList.add('is-focused');
    window.setTimeout(() => firstStep?.classList.remove('is-focused'), 1800);
  }

  function renderSongCenterRecents() {
    const list = document.getElementById('songCenterRecentList');
    if (!list) return;
    const recordings = Array.isArray(window.recordingLibrary)
      ? window.recordingLibrary
      : (typeof recordingLibrary !== 'undefined' && Array.isArray(recordingLibrary) ? recordingLibrary : []);

    list.innerHTML = '';
    const recent = [...recordings]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);

    if (!recent.length) {
      const empty = document.createElement('p');
      empty.className = 'song-center-empty';
      empty.textContent = '还没有最近练习。先搜索或上传一首歌吧。';
      list.append(empty);
      return;
    }

    recent.forEach((recording, index) => {
      const row = document.createElement('div');
      row.className = 'song-center-recent-item';
      const copy = document.createElement('div');
      const title = document.createElement('strong');
      const name = typeof getRecordingLibraryName === 'function'
        ? getRecordingLibraryName(recording)
        : (recording.name || recording.fileName || `最近练习 ${index + 1}`);
      title.textContent = name;
      const meta = document.createElement('small');
      const duration = recording.durationMs && typeof formatTimeSeconds === 'function'
        ? `${formatTimeSeconds(recording.durationMs)} · `
        : '';
      const createdAt = recording.createdAt ? new Date(recording.createdAt) : null;
      const time = createdAt && !Number.isNaN(createdAt.getTime())
        ? createdAt.toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '刚刚';
      meta.textContent = `${duration}${time}`;
      copy.append(title, meta);

      const button = document.createElement('button');
      button.className = 'secondary';
      button.type = 'button';
      button.textContent = '继续练习';
      button.addEventListener('click', () => {
        if (typeof selectRecordingFromLibrary === 'function') {
          selectRecordingFromLibrary(recording.id);
        }
        if (typeof window.showTrainingView === 'function') {
          window.showTrainingView('curve');
        }
      });

      row.append(copy, button);
      list.append(row);
    });
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
    window.setHomeTab = setHomeTab;

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

    bindHomeTabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindLauncherRouter);
  } else {
    bindLauncherRouter();
  }
})();
