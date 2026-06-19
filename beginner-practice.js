const BEGINNER_PRACTICE_STORAGE_KEY = 'voiceTrainingBeginnerPractice.v1';
const BEGINNER_PRACTICE_TASKS = [
  {
    id: 'listen-favorite-moment',
    level: 0,
    title: '今天不用唱歌。先听 10 秒就可以。',
    description: '听一小段目标声音，只要在心里选出一个你喜欢的瞬间。',
    estimatedTime: '约 30 秒',
    requiresVoice: false,
    requiresSinging: false,
    requiresRecording: false,
    successCondition: '听完一次，并选出最喜欢的一句。',
  },
  {
    id: 'listen-high-note',
    level: 0,
    title: '只听一遍，找最高的那个音。',
    description: '不用判断准不准，只要感觉哪一处最像“往上走”。',
    estimatedTime: '约 30 秒',
    requiresVoice: false,
    requiresSinging: false,
    requiresRecording: false,
    successCondition: '指出或记住你觉得最高的一处。',
  },
  {
    id: 'shoulder-release',
    level: 1,
    title: '先放松肩膀，不急着发声。',
    description: '吸气时轻轻耸肩，呼气时放下肩膀，重复一次就好。',
    estimatedTime: '约 20 秒',
    requiresVoice: false,
    requiresSinging: false,
    requiresRecording: false,
    successCondition: '完成一次深呼吸和肩膀放松。',
  },
  {
    id: 'silent-yawn',
    level: 1,
    title: '做一个安静的哈欠感。',
    description: '像要打哈欠一样打开口腔，不需要发出声音。',
    estimatedTime: '约 20 秒',
    requiresVoice: false,
    requiresSinging: false,
    requiresRecording: false,
    successCondition: '感受到口腔和喉咙放松一次。',
  },
  {
    id: 'soft-hum',
    level: 2,
    title: '今天只发一个“嗯——”，不用唱准。',
    description: '用很轻的声音 hum 一下，舒服就停。',
    estimatedTime: '约 30 秒',
    requiresVoice: true,
    requiresSinging: false,
    requiresRecording: false,
    successCondition: '轻轻发出一次舒服的“嗯——”。',
  },
  {
    id: 'tiny-a',
    level: 2,
    title: '轻轻发一个“啊”，一秒就够。',
    description: '音量小一点，不追求好听，只要愿意开口。',
    estimatedTime: '约 30 秒',
    requiresVoice: true,
    requiresSinging: false,
    requiresRecording: false,
    successCondition: '发出一个短短的“啊”。',
  },
  {
    id: 'read-one-line',
    level: 3,
    title: '读一句歌词，不需要唱。',
    description: '用舒服的说话声读一句，像在和 Mira 说话。',
    estimatedTime: '约 30 秒',
    requiresVoice: true,
    requiresSinging: false,
    requiresRecording: false,
    successCondition: '用说话声读完一句歌词或台词。',
  },
  {
    id: 'character-line',
    level: 3,
    title: '模仿角色台词说一句。',
    description: '可以可爱一点、轻一点，重点是让声音动起来。',
    estimatedTime: '约 30 秒',
    requiresVoice: true,
    requiresSinging: false,
    requiresRecording: false,
    successCondition: '用喜欢的语气说完一句话。',
  },
  {
    id: 'melody-speech',
    level: 4,
    title: '半说半唱读一句。',
    description: '让语气稍微有高低变化，不用唱准旋律。',
    estimatedTime: '约 40 秒',
    requiresVoice: true,
    requiresSinging: false,
    requiresRecording: false,
    successCondition: '用接近旋律的语气读完一句。',
  },
  {
    id: 'first-note',
    level: 5,
    title: '今天只唱 1 秒，完成就算赢。',
    description: '只唱目标片段的第一个音，短短一下就可以。',
    estimatedTime: '约 40 秒',
    requiresVoice: true,
    requiresSinging: true,
    requiresRecording: false,
    successCondition: '唱出一个 1 秒以内的短音。',
  },
  {
    id: 'three-second-phrase',
    level: 6,
    title: '跟唱 3 秒，不分析也可以。',
    description: '选一句里最短的一小段，跟着感觉唱出来。',
    estimatedTime: '约 1 分钟',
    requiresVoice: true,
    requiresSinging: true,
    requiresRecording: true,
    successCondition: '完成一段 3～5 秒的跟唱。',
  },
  {
    id: 'full-loop',
    level: 7,
    title: '进入正式闭环：唱一句，再修一处。',
    description: '录下一个完整片段，让 Mira 帮你找到最值得修的一点。',
    estimatedTime: '约 2 分钟',
    requiresVoice: true,
    requiresSinging: true,
    requiresRecording: true,
    successCondition: '完成一次正式录音并进入 Fix One Thing。',
  },
];

function createDefaultBeginnerPracticeState() {
  return {
    currentLevel: 0,
    totalCompleted: 0,
    consecutiveCompleted: 0,
    skippedCount: 0,
    daily: {
      date: typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10),
      taskId: '',
      completed: false,
    },
  };
}

function normalizeBeginnerPracticeState(raw) {
  const fallback = createDefaultBeginnerPracticeState();
  const state = raw && typeof raw === 'object' ? { ...fallback, ...raw } : fallback;
  state.currentLevel = Math.max(0, Math.min(7, Number(state.currentLevel) || 0));
  state.totalCompleted = Math.max(0, Number(state.totalCompleted) || 0);
  state.consecutiveCompleted = Math.max(0, Number(state.consecutiveCompleted) || 0);
  state.skippedCount = Math.max(0, Number(state.skippedCount) || 0);
  state.daily = state.daily && typeof state.daily === 'object' ? state.daily : fallback.daily;
  return ensureBeginnerPracticeToday(state);
}

function loadBeginnerPracticeState() {
  try {
    const raw = window.localStorage?.getItem(BEGINNER_PRACTICE_STORAGE_KEY);
    return normalizeBeginnerPracticeState(raw ? JSON.parse(raw) : null);
  } catch (error) {
    console.warn('Failed to load beginner practice state', error);
    return createDefaultBeginnerPracticeState();
  }
}

function saveBeginnerPracticeState(state) {
  try {
    window.localStorage?.setItem(BEGINNER_PRACTICE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save beginner practice state', error);
  }
}

let beginnerPracticeState = loadBeginnerPracticeState();

function ensureBeginnerPracticeToday(state = beginnerPracticeState) {
  const today = typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10);
  if (!state.daily || state.daily.date !== today) {
    state.daily = {
      date: today,
      taskId: '',
      completed: false,
    };
  }
  return state;
}

function getBeginnerLevelLabel(level) {
  const labels = {
    0: 'Lv0 · 只听',
    1: 'Lv1 · 身体准备',
    2: 'Lv2 · 轻声发声',
    3: 'Lv3 · 说话练习',
    4: 'Lv4 · 半说半唱',
    5: 'Lv5 · 唱 1 秒',
    6: 'Lv6 · 3～5 秒片段',
    7: 'Lv7 · 正式闭环',
  };
  return labels[level] || `Lv${level}`;
}

function getBeginnerRequirementText(task) {
  const parts = [];
  parts.push(task.requiresVoice ? '需要轻声开口' : '不需要发声');
  parts.push(task.requiresSinging ? '需要唱一点' : '不需要唱歌');
  parts.push(task.requiresRecording ? '建议录音' : '不需要录音');
  return parts.join(' · ');
}

function pickBeginnerTaskForToday() {
  ensureBeginnerPracticeToday();
  const existing = BEGINNER_PRACTICE_TASKS.find((task) => task.id === beginnerPracticeState.daily.taskId);
  if (existing) {
    return existing;
  }
  const onboardingLevel = Math.min(2, beginnerPracticeState.totalCompleted);
  const targetLevel = Math.min(beginnerPracticeState.currentLevel, Math.max(0, onboardingLevel || beginnerPracticeState.currentLevel));
  const pool = BEGINNER_PRACTICE_TASKS.filter((task) => task.level === targetLevel);
  const index = beginnerPracticeState.totalCompleted % Math.max(1, pool.length);
  const task = pool[index] || BEGINNER_PRACTICE_TASKS[0];
  beginnerPracticeState.daily.taskId = task.id;
  saveBeginnerPracticeState(beginnerPracticeState);
  return task;
}

function renderBeginnerPracticePreview(task = pickBeginnerTaskForToday()) {
  if (beginnerQuestPreviewLevel) {
    beginnerQuestPreviewLevel.textContent = getBeginnerLevelLabel(task.level);
  }
  if (beginnerQuestPreviewTitle) {
    beginnerQuestPreviewTitle.textContent = task.title;
  }
  if (beginnerQuestPreviewMeta) {
    beginnerQuestPreviewMeta.textContent = `${task.estimatedTime} · ${task.requiresSinging ? '唱一点点' : '不要求唱歌'}`;
  }
}

function renderBeginnerPracticePanel(task = pickBeginnerTaskForToday()) {
  beginnerPractice.currentTaskId = task.id;
  if (beginnerPracticeLevel) {
    beginnerPracticeLevel.textContent = getBeginnerLevelLabel(task.level);
  }
  if (beginnerPracticeTitle) {
    beginnerPracticeTitle.textContent = task.title;
  }
  if (beginnerPracticeDescription) {
    beginnerPracticeDescription.textContent = task.description;
  }
  if (beginnerPracticeEstimatedTime) {
    beginnerPracticeEstimatedTime.textContent = task.estimatedTime;
  }
  if (beginnerPracticeRequirements) {
    beginnerPracticeRequirements.textContent = getBeginnerRequirementText(task);
  }
  if (beginnerPracticeCondition) {
    beginnerPracticeCondition.textContent = task.successCondition;
  }
  if (beginnerPracticeFeedback) {
    beginnerPracticeFeedback.textContent = beginnerPracticeState.daily.completed
      ? '今日任务完成。你已经向唱歌靠近了一步。'
      : 'Mira 只看你有没有开始，不评价你唱得好不好。';
  }
  if (beginnerPracticeCompleteButton) {
    beginnerPracticeCompleteButton.textContent = beginnerPracticeState.daily.completed ? '今日已完成' : '完成今日小练习';
    beginnerPracticeCompleteButton.disabled = beginnerPracticeState.daily.completed;
  }
}

function openBeginnerPracticeMode() {
  const task = pickBeginnerTaskForToday();
  beginnerPractice.active = true;
  renderBeginnerPracticePanel(task);
  if (beginnerPracticePanel) {
    beginnerPracticePanel.hidden = false;
    beginnerPracticePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (typeof setMiraPresenceState === 'function') {
    setMiraPresenceState('thinking', task.requiresVoice ? '慢慢来，我陪你开口' : '今天先不用唱');
  }
}

function showBeginnerCompletionReward(task) {
  const xp = 10 + task.level * 3;
  if (typeof markPracticeDay === 'function') {
    markPracticeDay();
  }
  if (typeof addGameXp === 'function') {
    addGameXp(xp);
  }
  if (gameState) {
    gameState.rewards = [
      {
        id: `${Date.now()}-beginner`,
        createdAt: new Date().toISOString(),
        mode: 'beginner',
        score: 100,
        totalScore: 100,
        xp,
        summary: `完成 ${getBeginnerLevelLabel(task.level)} 小练习`,
      },
      ...gameState.rewards,
    ].slice(0, 12);
  }
  if (typeof saveGameState === 'function') {
    saveGameState();
  }
  if (typeof renderGameState === 'function') {
    renderGameState();
  }
  if (gameRewardPanel) {
    gameRewardPanel.hidden = false;
    gameRewardPanel.dataset.grade = 'S';
  }
  if (gameRewardTitle) {
    gameRewardTitle.textContent = '今日任务完成';
  }
  if (gameRewardText) {
    gameRewardText.textContent = `连续练习天数已更新，Mira 经验值 +${xp}。下一次会解锁更靠近唱歌的小任务。`;
  }
  if (gameRewardGrade) {
    gameRewardGrade.textContent = 'OK';
  }
  if (gameRewardXp) {
    gameRewardXp.textContent = `+${xp} XP`;
  }
  if (typeof renderMiraFeedback === 'function') {
    renderMiraFeedback({
      encouragement: '完成就很好。今天 Mira 记住的是：你愿意开始。',
      observation: task.requiresSinging ? '你已经碰到一点点唱歌任务了。' : '今天还不用证明自己会唱，只要让身体和耳朵进入练习状态。',
      nextStep: '下一步仍然只做一个小动作，不急着完整唱。',
      source: 'local',
    }, 'Mira 的新手陪练反馈');
  }
  if (typeof pulseMiraSuccess === 'function') {
    pulseMiraSuccess('今天的小练习完成了');
  }
}

function completeBeginnerPracticeTask() {
  const task = pickBeginnerTaskForToday();
  if (beginnerPracticeState.daily.completed) {
    return;
  }
  beginnerPracticeState.daily.completed = true;
  beginnerPracticeState.totalCompleted += 1;
  beginnerPracticeState.consecutiveCompleted += 1;
  if (beginnerPracticeState.consecutiveCompleted >= 2 && beginnerPracticeState.currentLevel < 7) {
    beginnerPracticeState.currentLevel += 1;
    beginnerPracticeState.consecutiveCompleted = 0;
  }
  saveBeginnerPracticeState(beginnerPracticeState);
  renderBeginnerPracticePreview(task);
  renderBeginnerPracticePanel(task);
  showBeginnerCompletionReward(task);
}

function skipBeginnerPracticeTask() {
  ensureBeginnerPracticeToday();
  beginnerPracticeState.skippedCount += 1;
  beginnerPracticeState.consecutiveCompleted = 0;
  beginnerPracticeState.currentLevel = Math.max(0, beginnerPracticeState.currentLevel - 1);
  const easierTasks = BEGINNER_PRACTICE_TASKS.filter((task) => task.level === beginnerPracticeState.currentLevel);
  const currentTask = BEGINNER_PRACTICE_TASKS.find((task) => task.id === beginnerPracticeState.daily.taskId);
  const nextTask = easierTasks.find((task) => task.id !== currentTask?.id) || easierTasks[0] || BEGINNER_PRACTICE_TASKS[0];
  beginnerPracticeState.daily.taskId = nextTask.id;
  beginnerPracticeState.daily.completed = false;
  saveBeginnerPracticeState(beginnerPracticeState);
  renderBeginnerPracticePreview(nextTask);
  renderBeginnerPracticePanel(nextTask);
  if (beginnerPracticeFeedback) {
    beginnerPracticeFeedback.textContent = '好，Mira 把任务调轻一点。今天只要能开始就算赢。';
  }
}

function initBeginnerPracticeMode() {
  const task = pickBeginnerTaskForToday();
  renderBeginnerPracticePreview(task);
  renderBeginnerPracticePanel(task);
}

beginnerPracticeCompleteButton?.addEventListener('click', completeBeginnerPracticeTask);
beginnerPracticeSkipButton?.addEventListener('click', skipBeginnerPracticeTask);
beginnerPracticeSingButton?.addEventListener('click', () => {
  if (typeof showTrainingView === 'function') {
    showTrainingView('curve');
  }
});

initBeginnerPracticeMode();

window.openBeginnerPracticeMode = openBeginnerPracticeMode;
window.renderBeginnerPracticePreview = renderBeginnerPracticePreview;
window.completeBeginnerPracticeTask = completeBeginnerPracticeTask;
