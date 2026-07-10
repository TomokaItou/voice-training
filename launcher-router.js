(function () {
  const TODAY_RECOMMENDATION_KEY = 'mira.todayRecommendation.v1';
  const MIRA_PRACTICE_ROUTE_COPY = {
    probe: {
      title: '连续唱 5 遍，让 Mira 找到今天的状态',
      task: '不用追求好听，保持同一句唱 5 遍，Mira 会找出最不稳定的地方。',
      engine: '后台：Probe Memory Loop',
      action: () => {
        if (typeof window.showAiVocalTeacher === 'function') window.showAiVocalTeacher();
      },
    },
    active_search: {
      title: '找出今天最好的一遍',
      task: '用几个很短的版本试一下，Mira 会帮你留下今天最接近目标的声音。',
      engine: '后台：Active Voice Search',
      action: () => {
        if (typeof window.showActiveVoiceSearch === 'function') window.showActiveVoiceSearch();
      },
    },
    fix: {
      title: '这次只改一个地方',
      task: '只带着 Mira 刚说的一个提醒，做 30 秒小练习。',
      engine: '后台：Fix One Thing',
      action: () => routeTrainingMode('fix'),
    },
    state_kit: {
      title: '录一组更完整的数据',
      task: 'Mira 需要同时看声音和状态，录一组 5 到 10 秒的完整数据。',
      engine: '后台：Vocal State Kit',
      action: () => {
        if (typeof window.showVocalStateKitPage === 'function') window.showVocalStateKitPage();
      },
    },
  };
  const VOCALOID_RECOMMENDATIONS = [
    {
      id: 'roshin-yukai',
      title: '炉心融解',
      segment: '副歌第一句，15 秒',
      reason: '高音稳定性明显，但可以只练一句。',
      difficulty: '中高',
      range: '最高音约 high C',
      tags: ['高音挑战', '经典曲', '短句训练'],
      focus: 'high',
      style: 'vocaloid-classic',
      estimatedTime: '预计 30 秒',
    },
    {
      id: 'instant-reincarnation',
      title: '即刻轮回',
      segment: '主歌进入副歌前，12 秒',
      reason: '节奏密度适中，适合练咬字和拍点。',
      difficulty: '中',
      range: '中高音区',
      tags: ['节奏稳定', '适合热身'],
      focus: 'rhythm',
      style: 'vocaloid-classic',
      estimatedTime: '预计 30 秒',
    },
    {
      id: 'melt',
      title: 'メルト',
      segment: '副歌开头，15 秒',
      reason: '旋律线清楚，适合练从中声区到高音的连接。',
      difficulty: '中',
      range: '最高音约 high B',
      tags: ['经典曲', '高音连接'],
      focus: 'high',
      style: 'vocaloid-classic',
      estimatedTime: '预计 30 秒',
    },
    {
      id: 'senbonzakura',
      title: '千本樱',
      segment: '副歌第一句，10 秒',
      reason: '短句节奏清楚，适合先把拍点贴稳。',
      difficulty: '中',
      range: '中高音区',
      tags: ['经典曲', '节奏挑战'],
      focus: 'rhythm',
      style: 'vocaloid-classic',
      estimatedTime: '预计 30 秒',
    },
    {
      id: 'tell-your-world',
      title: 'Tell Your World',
      segment: '副歌第一句，15 秒',
      reason: '音域压力较温和，适合入门和热身。',
      difficulty: '入门',
      range: '中音区到中高音',
      tags: ['适合热身', '经典曲'],
      focus: 'warmup',
      style: 'vocaloid-classic',
      estimatedTime: '预计 30 秒',
    },
  ];

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

  function setMiraPracticeState(state) {
    const flow = document.getElementById('flowPage');
    if (!flow) return;
    flow.dataset.miraPracticeState = state;
    flow.querySelectorAll('[data-mira-panel]').forEach((panel) => {
      const isActive = panel.getAttribute('data-mira-panel') === state;
      panel.hidden = !isActive;
      panel.classList.toggle('is-active', isActive);
    });
    flow.querySelectorAll('[data-mira-step]').forEach((step) => {
      const isActive = step.getAttribute('data-mira-step') === state;
      step.classList.toggle('is-active', isActive);
    });
  }

  function setClassroomState(state, subtitle = null) {
    const hero = document.querySelector('.mira-classroom');
    if (!hero) return;
    const states = ['idle', 'blink', 'wave', 'speaking', 'listening', 'happy', 'encourage', 'thinking'];
    states.forEach((item) => {
      hero.classList.toggle(`mira-state-${item}`, item === state);
    });
    hero.dataset.miraRoomState = state;
    if (subtitle) {
      const bubble = document.getElementById('miraStateBubble');
      if (bubble) bubble.textContent = subtitle;
    }
  }

  function showClassroomReward(show = true) {
    const reward = document.getElementById('classroomReward');
    if (!reward) return;
    reward.classList.toggle('is-visible', show);
    if (show) {
      window.setTimeout(() => reward.classList.remove('is-visible'), 1600);
    }
  }

  function setClassroomScreenCopy(title, detail) {
    const screen = document.getElementById('classroomScreenStatus');
    if (screen) screen.textContent = detail || title || '';
  }

  async function startClassroomLesson() {
    setClassroomState('wave', 'Mira：我来了。今天只练一句。');
    setClassroomScreenCopy(null, '今天的曲线会在你唱完后出现。');
    await miraSequence(['mira.welcome', 'mira.lesson_start'], { pauseMs: 120 });
    setClassroomState('speaking', 'Mira：准备好就点麦克风。');
    await miraSay('mira.listen');
    setClassroomState('idle', '点麦克风，唱这一句就好。');
  }

  async function startClassroomRecording() {
    setClassroomState('listening', 'Mira 正在听你唱这一句。');
    setClassroomScreenCopy(null, '录音中：只看这一句，不看整首歌。');
    document.getElementById('classroomPracticeAgainButton')?.setAttribute('hidden', '');
    window.MiraVoiceCoach?.stopLiveCues?.();
    await miraSequence(['mira.listen'], {
      pauseMs: 120,
      after: () => window.MiraVoiceCoach?.startLiveCues?.({ intervalMs: 6200 }),
    });
    try {
      if (typeof startVoiceRecording === 'function') {
        await startVoiceRecording();
      }
    } catch (error) {
      console.warn('Classroom recording could not start; keeping prototype flow active.', error);
    }
    window.setTimeout(showClassroomFeedback, 5200);
  }

  async function showClassroomFeedback() {
    window.MiraVoiceCoach?.stopLiveCues?.();
    setClassroomState('happy', 'Mira：很好。这次第一个字再轻一点。');
    setClassroomScreenCopy(null, '反馈：起音更轻一点，尾音保持住。');
    showClassroomReward(true);
    const repeat = document.getElementById('classroomPracticeAgainButton');
    if (repeat) repeat.hidden = false;
    await miraSequence(['mira.success', 'mira.softer'], { pauseMs: 160 });
    setClassroomState('encourage', '下一步：再来一次，或者点谱架换一句。');
  }

  function miraSay(line, options = {}) {
    if (window.MiraVoiceCoach?.say) {
      return window.MiraVoiceCoach.say(line, options);
    }
    const subtitle = document.getElementById('miraVoiceSubtitle') || document.getElementById('miraStateBubble');
    if (subtitle) subtitle.textContent = line;
    return Promise.resolve();
  }

  function miraSequence(lines, options = {}) {
    if (window.MiraVoiceCoach?.sequence) {
      return window.MiraVoiceCoach.sequence(lines, options);
    }
    return Promise.resolve().then(() => {
      const last = lines.filter(Boolean).at(-1);
      if (last) {
        const subtitle = document.getElementById('miraVoiceSubtitle') || document.getElementById('miraStateBubble');
        if (subtitle) subtitle.textContent = last;
      }
      if (typeof options.after === 'function') options.after();
    });
  }

  function getMiraAutoRouteDecision() {
    const records = getLearningRecords();
    const recent = records.slice(0, 5);
    const recentFailures = recent.filter((record) => record && record.improved === false).length;
    const latest = recent[0] || {};
    const latestText = `${latest.problemId || ''} ${latest.summary || ''} ${latest.note || ''}`;
    if (/state|video|camera|multimodal|姿态|口型/.test(latestText)) return 'state_kit';
    if (recentFailures >= 2) return 'probe';
    if (latest.improved === true || /best|success|成功|最好/.test(latestText)) return 'active_search';
    return 'fix';
  }

  function renderMiraPracticeFlow(recommendation = getTodayRecommendation()) {
    if (!recommendation) return;
    const setText = (id, text) => {
      const element = document.getElementById(id);
      if (element) element.textContent = text;
    };
    const songTitle = recommendation.title ? `《${recommendation.title}》` : '今天这首歌';
    const segment = recommendation.segment || '副歌第一句，15 秒';
    setText('miraFlowTeacherLine', '“今天先别想整首歌，我们只练这一句。”');
    setText('miraFlowTaskSegment', `${songTitle}${segment}`);
    setText('routeRecommendationSong', songTitle);
    setText('routeRecommendationSegment', segment);
    setText('routeRecommendationReason', recommendation.reason || '目标：完成这一句后，Mira 会自动决定下一步。');
    renderMiraAutoRoute(getMiraAutoRouteDecision());
  }

  function renderMiraAutoRoute(routeKey = getMiraAutoRouteDecision()) {
    const route = MIRA_PRACTICE_ROUTE_COPY[routeKey] || MIRA_PRACTICE_ROUTE_COPY.fix;
    const setText = (id, text) => {
      const element = document.getElementById(id);
      if (element) element.textContent = text;
    };
    const card = document.getElementById('miraAutoRouteCard');
    const startButton = document.getElementById('miraAutoRouteStartButton');
    if (card) card.dataset.miraRoute = routeKey;
    if (startButton) startButton.dataset.miraRoute = routeKey;
    setText('miraAutoRouteTitle', `“${route.title}。”`);
    setText('miraAutoRouteTask', route.task);
    setText('miraAutoRouteHiddenEngine', route.engine);
    setText('miraAutoRouteReason', 'Mira 已经选好下一步。你看到的是练习任务，底层算法会在后台工作。');
  }

  function openMiraRecorder() {
    setMiraPracticeState('record_once');
    window.MiraVoiceCoach?.stopLiveCues?.();
    miraSequence(['mira.listen'], {
      pauseMs: 120,
      after: () => window.MiraVoiceCoach?.startLiveCues?.({ intervalMs: 6200 }),
    });
    const hasSongTarget = typeof songPitchTrack !== 'undefined' && Array.isArray(songPitchTrack) && songPitchTrack.length > 0;
    if (!hasSongTarget && typeof window.showSongAnalysisPage === 'function') {
      window.showSongAnalysisPage({ autoContinueToPractice: true });
      return;
    }
    routeTrainingMode('curve');
  }

  function openMiraAutoRoute(routeKey) {
    const route = MIRA_PRACTICE_ROUTE_COPY[routeKey] || MIRA_PRACTICE_ROUTE_COPY.fix;
    miraSay(routeKey === 'state_kit' ? 'mira.thinking' : routeKey === 'active_search' ? 'mira.success' : 'mira.softer', {
      mood: 'Mira 下一步',
      subtitleText: route.title,
    });
    route.action();
    window.setTimeout(() => applyMiraRoutePageCopy(routeKey), 0);
  }

  function showMiraFeedbackAndContinue() {
    window.MiraVoiceCoach?.stopLiveCues?.();
    setMiraPracticeState('mira_feedback');
    const headline = document.getElementById('miraFeedbackHeadline');
    const good = document.getElementById('miraFeedbackGoodPoint');
    const oneThing = document.getElementById('miraFeedbackOneThing');
    if (headline) headline.textContent = '“很好。”';
    if (good) good.textContent = '刚刚已经比上一遍稳定。';
    if (oneThing) oneThing.textContent = '这次第一个字轻一点。';
    miraSequence(['mira.success', 'mira.softer'], {
      pauseMs: 180,
      after: () => {
        renderMiraAutoRoute(getMiraAutoRouteDecision());
        setMiraPracticeState('auto_route');
      },
    });
  }

  function applyMiraRoutePageCopy(routeKey) {
    const copy = MIRA_PRACTICE_ROUTE_COPY[routeKey] || MIRA_PRACTICE_ROUTE_COPY.fix;
    const setText = (selector, text) => {
      const element = document.querySelector(selector);
      if (element) element.textContent = text;
    };
    if (routeKey === 'probe') {
      setText('#aiVocalTeacherPage .ai-teacher-header .game-label', 'Mira 状态扫描');
      setText('#aiVocalTeacherPage .ai-teacher-header h1', copy.title);
      setText('#aiTeacherStepText', '连续唱几遍同一句，不用追求好听。Mira 会帮你找到今天最不稳定的地方。');
      setText('#aiTeacherPhaseLabel', '连续 5 遍');
      setText('#aiTeacherTaskName', '保持同一句，让 Mira 听今天的状态');
      setText('#aiTeacherStatus', '每次只要 2 到 4 秒，唱完一组后 Mira 再决定下一步。');
    } else if (routeKey === 'active_search') {
      setText('#activeSearchPage .active-search-header .launcher-kicker', 'Mira 帮你挑样本');
      setText('#activeSearchPage .active-search-header h1', copy.title);
      setText('#activeSearchPage .active-search-header p', '试几个很短的版本，Mira 会留下今天最值得保存的一遍。');
    } else if (routeKey === 'state_kit') {
      setText('#vocalStateKitPage .vocal-state-header .game-label', 'Mira 状态采集');
      setText('#vocalStateKitPage .vocal-state-header h1', copy.title);
      setText('#vocalStateKitPage .vocal-state-header p', '这次 Mira 需要更完整的数据：声音、画面和状态一起看。');
      setText('#vocalStateTitle', '录一组 5 到 10 秒的完整数据');
      setText('#vocalStateStatus', '准备好后开始。只需要一小段稳定音或短句。');
    }
  }

  function openLabAction(action) {
    const actionMap = {
      ai_teacher: () => window.showAiVocalTeacher?.(),
      active_search: () => window.showActiveVoiceSearch?.(),
      ai_experiment: () => window.showAiExperimentPage?.(),
      vocal_state: () => window.showVocalStateKitPage?.(),
      fix: () => routeTrainingMode('fix'),
      history: () => {
        if (typeof window.showLibraryPage === 'function') window.showLibraryPage('success');
      },
    };
    actionMap[action]?.();
  }

  function readJsonStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJsonStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Recommendation state should never block the launcher.
    }
  }

  function getLearningRecords() {
    if (window.VoiceLearningMemory?.readRecords) {
      return window.VoiceLearningMemory.readRecords();
    }
    return readJsonStorage('mira.voiceLearningMemory.v1', []);
  }

  function getRecentRecordings() {
    const recordings = Array.isArray(window.recordingLibrary)
      ? window.recordingLibrary
      : (typeof recordingLibrary !== 'undefined' && Array.isArray(recordingLibrary) ? recordingLibrary : []);
    return [...recordings].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  function isYesterday(isoDate) {
    const time = new Date(isoDate || 0);
    if (Number.isNaN(time.getTime())) return false;
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const start = yesterday.getTime();
    const end = start + 24 * 60 * 60 * 1000;
    return time.getTime() >= start && time.getTime() < end;
  }

  function getDefaultRecommendation() {
    return {
      ...VOCALOID_RECOMMENDATIONS[0],
      reasons: ['适合你当前音域', '今天只练一句，不需要唱整首', '可以练高音稳定性'],
      source: 'default',
    };
  }

  function findRecommendationById(id) {
    return VOCALOID_RECOMMENDATIONS.find((item) => item.id === id) || null;
  }

  function createRecommendationFromSongRecord(record) {
    if (!record?.songTitle) return null;
    const isHard = ['no_clear_change', 'failed', 'worse'].includes(record.status) || record.improved === false;
    return {
      id: `continue-${record.songTitle}`,
      title: record.songTitle,
      segment: record.segmentText || '继续昨天最卡的一句，15 秒',
      reason: isHard ? '昨天这一句还没有明显变好，今天缩短一点继续修。' : '昨天练过这首，今天继续同一个片段更容易形成记忆。',
      difficulty: isHard ? '降难度' : '延续',
      range: '沿用上次片段',
      tags: isHard ? ['继续昨天', '更短片段'] : ['继续昨天', '记忆巩固'],
      focus: record.problemId?.includes('high') ? 'high' : 'continue',
      style: 'recent-song',
      estimatedTime: isHard ? '预计 20 秒' : '预计 30 秒',
      reasons: isHard
        ? ['昨天这句还没稳定，今天改成更短片段', '不用唱整首，只修同一个问题', '完成后 Mira 会判断有没有变好']
        : ['昨天练过这首，继续同一句更容易进步', '今天只练一句，不需要重新选歌', '完成后 Mira 会帮你找一个最值得修的问题'],
      source: 'history',
    };
  }

  function getRuleBasedRecommendation() {
    const records = getLearningRecords();
    const yesterdaySong = records.find((record) => record.songTitle && isYesterday(record.createdAt));
    if (yesterdaySong) {
      const recommendation = createRecommendationFromSongRecord(yesterdaySong);
      if (recommendation) return recommendation;
    }

    const recentSong = records.find((record) => record.songTitle);
    const recentFailures = records
      .filter((record) => record.songTitle && !record.improved && record.status !== 'observed')
      .slice(0, 2);
    if (recentSong && recentFailures.length >= 2) {
      return {
        ...createRecommendationFromSongRecord(recentSong),
        segment: recentSong.segmentText || '最卡的一句，8 秒',
        reason: '最近连续没变好，今天缩短片段并降低压力。',
        difficulty: '降难度',
        tags: ['更短片段', '降低难度'],
        estimatedTime: '预计 20 秒',
      };
    }

    const highFocus = records.find((record) => /high|pitch_high|register|高音/.test(`${record.problemId || ''} ${record.summary || ''}`));
    if (highFocus) {
      const highSong = findRecommendationById('roshin-yukai') || getDefaultRecommendation();
      return {
        ...highSong,
        reasons: ['最近在练高音稳定性', '今天只练一句，不需要唱整首', '完成后 Mira 会帮你找高音里最值得修的问题'],
        source: 'focus',
      };
    }

    const recentRecording = getRecentRecordings()[0];
    if (recentRecording) {
      return {
        ...getDefaultRecommendation(),
        reasons: ['你最近已经开始练习，今天先接一个短任务', '不用先选歌，先完成 30 秒', '完成后 Mira 会把问题收敛到一个动作'],
        source: 'recent-recording',
      };
    }

    return getDefaultRecommendation();
  }

  function getStoredRecommendation() {
    const stored = readJsonStorage(TODAY_RECOMMENDATION_KEY, null);
    if (!stored?.id) return null;
    const created = new Date(stored.createdAt || 0);
    const now = new Date();
    const sameDay = created.getFullYear() === now.getFullYear()
      && created.getMonth() === now.getMonth()
      && created.getDate() === now.getDate();
    if (!sameDay) return null;
    const poolItem = findRecommendationById(stored.id);
    return poolItem ? { ...poolItem, ...(stored.override || {}), source: stored.source || 'stored' } : stored;
  }

  function getTodayRecommendation() {
    return window.currentTodayRecommendation || getStoredRecommendation() || getRuleBasedRecommendation();
  }

  function setTodayRecommendation(recommendation) {
    window.currentTodayRecommendation = recommendation;
    writeJsonStorage(TODAY_RECOMMENDATION_KEY, {
      id: recommendation.id,
      createdAt: new Date().toISOString(),
      source: recommendation.source || 'manual',
      override: recommendation.source === 'history' ? recommendation : null,
    });
    renderTodayRecommendation(recommendation);
  }

  function getShuffleRecommendation() {
    const current = getTodayRecommendation();
    const sameStyle = VOCALOID_RECOMMENDATIONS.filter(
      (item) => item.style === current.style || item.focus === current.focus
    );
    const pool = sameStyle.length > 1 ? sameStyle : VOCALOID_RECOMMENDATIONS;
    const currentIndex = Math.max(0, pool.findIndex((item) => item.id === current.id));
    const next = pool[(currentIndex + 1) % pool.length] || VOCALOID_RECOMMENDATIONS[0];
    return {
      ...next,
      reasons: ['相近风格，切换成本低', '今天仍然只练一句', next.reason],
      source: 'shuffle',
    };
  }

  function renderTodayRecommendation(recommendation = getTodayRecommendation()) {
    if (!recommendation) return;
    const reasons = recommendation.reasons || [
      recommendation.reason || '适合今天做短句练习',
      '今天只练一句，不需要唱整首',
      '完成后 Mira 会帮你找一个最值得修的问题',
    ];
    const setText = (id, text) => {
      const element = document.getElementById(id);
      if (element) element.textContent = text;
    };
    setText('todayRecommendationSong', `《${recommendation.title}》`);
    setText('todayRecommendationSegment', recommendation.segment || '副歌第一句，15 秒');
    setText('todayRecommendationTime', recommendation.estimatedTime || '预计 30 秒');
    setText('todayRecommendationNextStep', '完成后 Mira 会帮你找一个最值得修的问题。');
    setText('routeRecommendationSong', `《${recommendation.title}》`);
    setText('routeRecommendationSegment', recommendation.segment || '副歌第一句，15 秒');
    setText('routeRecommendationReason', recommendation.reason || '先完成歌曲准备，Mira 会自动生成第一句练习。');

    const reasonList = document.getElementById('todayRecommendationReasons');
    if (reasonList) {
      reasonList.innerHTML = '';
      reasons.slice(0, 3).forEach((reason) => {
        const item = document.createElement('li');
        item.textContent = reason;
        reasonList.append(item);
      });
    }
  }

  function renderVocaloidRecommendations() {
    const list = document.getElementById('vocaloidRecommendationList');
    if (!list) return;
    list.innerHTML = '';
    VOCALOID_RECOMMENDATIONS.forEach((song) => {
      const button = document.createElement('button');
      button.className = 'vocaloid-recommendation-item';
      button.type = 'button';
      button.innerHTML = `
        <strong>${song.title}</strong>
        <span>${song.difficulty} · ${song.range}</span>
        <small>${song.tags.slice(0, 2).join(' / ')}</small>
      `;
      button.addEventListener('click', () => {
        setTodayRecommendation({
          ...song,
          reasons: ['你手动选了这首歌', '今天只练一句，不需要唱整首', song.reason],
          source: 'vocaloid-list',
        });
      });
      list.append(button);
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
          renderMiraPracticeFlow();
          setMiraPracticeState('today_task');
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
    document.getElementById('classroomMiraButton')?.addEventListener('click', startClassroomLesson);
    document.getElementById('classroomMicButton')?.addEventListener('click', startClassroomRecording);
    document.getElementById('classroomPracticeAgainButton')?.addEventListener('click', startClassroomRecording);
    document.getElementById('classroomStandButton')?.addEventListener('click', openSongsTab);
    document.getElementById('classroomScreenButton')?.addEventListener('click', () => {
      setHomeTab('flow');
      renderMiraPracticeFlow();
      setMiraPracticeState('mira_feedback');
    });
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
    document.getElementById('miraPracticePrepareSongButton')?.addEventListener('click', () => {
      if (typeof window.showSongAnalysisPage === 'function') {
        window.showSongAnalysisPage({ autoContinueToPractice: true });
      }
      const input = document.getElementById('songAnalysisInput') || document.getElementById('songPitchInput');
      if (input) input.click();
    });
    document.getElementById('miraPracticeRecordButton')?.addEventListener('click', openMiraRecorder);
    document.getElementById('miraPracticeOpenRecorderButton')?.addEventListener('click', openMiraRecorder);
    document.getElementById('miraPracticeShowFeedbackButton')?.addEventListener('click', () => {
      showMiraFeedbackAndContinue();
    });
    document.getElementById('miraPracticeRepeatButton')?.addEventListener('click', openMiraRecorder);
    document.getElementById('miraPracticeSwitchRouteButton')?.addEventListener('click', () => {
      miraSay('mira.retry');
      renderMiraAutoRoute(getMiraAutoRouteDecision());
      setMiraPracticeState('auto_route');
    });
    document.getElementById('miraAutoRouteStartButton')?.addEventListener('click', (event) => {
      const routeKey = event.currentTarget?.dataset?.miraRoute || getMiraAutoRouteDecision();
      openMiraAutoRoute(routeKey);
    });
    document.getElementById('miraAutoRouteBackButton')?.addEventListener('click', () => {
      setMiraPracticeState('today_task');
    });
    document.querySelectorAll('[data-lab-action]').forEach((button) => {
      button.addEventListener('click', () => openLabAction(button.dataset.labAction));
    });

    setTodayRecommendation(getTodayRecommendation());
    renderMiraPracticeFlow();
    setMiraPracticeState('today_task');
    renderVocaloidRecommendations();
    renderSongCenterRecents();
    window.setInterval(() => {
      const hero = document.querySelector('.mira-classroom');
      if (!hero || hero.dataset.miraRoomState !== 'idle') return;
      setClassroomState('blink');
      window.setTimeout(() => setClassroomState('idle'), 420);
    }, 5200);
  }

  function openTodayLessonFlow() {
    setTodayRecommendation(getTodayRecommendation());
    renderMiraPracticeFlow();
    setHomeTab('flow');
    setMiraPracticeState('today_task');
    document.getElementById('flowPage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    miraSequence([
      'mira.welcome',
      'mira.lesson_start',
      'mira.listen',
    ], { pauseMs: 160 });
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

  function focusFlowPracticeStep() {
    const route = document.querySelector('.flow-training-route[data-home-section="flow"]');
    const practiceStep = route?.querySelector('.route-start-card');
    route?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.route-panel.is-focused').forEach((element) => {
      element.classList.remove('is-focused');
    });
    practiceStep?.classList.add('is-focused');
    window.setTimeout(() => practiceStep?.classList.remove('is-focused'), 1800);
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
    const hasSongTarget = typeof songPitchTrack !== 'undefined' && Array.isArray(songPitchTrack) && songPitchTrack.length > 0;
    if (mode === 'curve' && button?.id === 'openCurveModeButton' && !hasSongTarget) {
      if (typeof window.showSongAnalysisPage === 'function') {
        window.showSongAnalysisPage({ autoContinueToPractice: true });
      }
      return;
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
