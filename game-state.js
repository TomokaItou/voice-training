const gameStorageKey = 'voiceTrainingGameState.v1';
const gameQuestIds = ['complete-practice', 'pitch-70', 'specialty-70'];

let gameState = loadGameState();

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return getLocalDateKey(date);
}

function getXpNeededForLevel(level = gameState.level) {
  return 100 + Math.max(1, level) * 35;
}

function getSingerTitle(level = gameState.level) {
  if (level >= 20) return '舞台歌手';
  if (level >= 12) return '稳定歌手';
  if (level >= 6) return '进阶歌手';
  return '见习歌手';
}

function createDefaultGameState() {
  return {
    level: 1,
    xp: 0,
    totalXp: 0,
    streak: 0,
    lastPracticeDate: '',
    daily: {
      date: getLocalDateKey(),
      completed: {},
    },
    rewards: [],
  };
}

function normalizeGameState(raw) {
  const fallback = createDefaultGameState();
  const state = raw && typeof raw === 'object' ? { ...fallback, ...raw } : fallback;
  state.level = Math.max(1, Number(state.level) || 1);
  state.xp = Math.max(0, Number(state.xp) || 0);
  state.totalXp = Math.max(0, Number(state.totalXp) || 0);
  state.streak = Math.max(0, Number(state.streak) || 0);
  state.daily = state.daily && typeof state.daily === 'object' ? state.daily : fallback.daily;
  state.daily.completed = state.daily.completed && typeof state.daily.completed === 'object'
    ? state.daily.completed
    : {};
  state.rewards = Array.isArray(state.rewards) ? state.rewards.slice(0, 12) : [];
  return ensureTodayGameState(state);
}

function ensureTodayGameState(state = gameState) {
  const today = getLocalDateKey();
  if (!state.daily || state.daily.date !== today) {
    state.daily = {
      date: today,
      completed: {},
    };
  }
  return state;
}

function loadGameState() {
  try {
    const raw = window.localStorage?.getItem(gameStorageKey);
    return normalizeGameState(raw ? JSON.parse(raw) : null);
  } catch (error) {
    console.warn('Failed to load game state', error);
    return createDefaultGameState();
  }
}

function saveGameState() {
  try {
    window.localStorage?.setItem(gameStorageKey, JSON.stringify(gameState));
  } catch (error) {
    console.warn('Failed to save game state', error);
  }
}

function getGameQuestDefinitions() {
  return [
    {
      id: 'complete-practice',
      type: '今日导航',
      title: '完成一次完整跟唱',
      detail: '建立今日声音坐标',
      reward: 18,
      done: Boolean(gameState.daily.completed['complete-practice']),
    },
    {
      id: 'pitch-70',
      type: '可重复动作',
      title: '完成一次 70 分挑战',
      detail: '确认一个可重复动作',
      reward: 18,
      done: Boolean(gameState.daily.completed['pitch-70']),
    },
    {
      id: 'specialty-70',
      type: '修正方向',
      title: '气息/节奏/起音任选一项达标',
      detail: '修正一个方向',
      reward: 18,
      done: Boolean(gameState.daily.completed['specialty-70']),
    },
  ];
}

function renderGameState() {
  ensureTodayGameState();
  if (gameLevelValue) {
    gameLevelValue.textContent = `Lv.${gameState.level}`;
  }
  const singerTitle = getSingerTitle();
  if (gameSingerTitle) {
    gameSingerTitle.textContent = singerTitle;
  }
  if (gameLevelDisplay) {
    gameLevelDisplay.textContent = `Lv.${gameState.level} ${singerTitle}`;
  }
  if (gameStreakValue) {
    gameStreakValue.textContent = gameState.streak > 0 ? `连续 ${gameState.streak} 天` : '今天开练';
  }
  const xpNeeded = getXpNeededForLevel();
  const xpRemaining = Math.max(0, xpNeeded - gameState.xp);
  if (gameXpValue) {
    gameXpValue.textContent = `${gameState.xp} / ${xpNeeded} XP`;
  }
  if (gameNextLevelHint) {
    gameNextLevelHint.textContent = `距离下一级还差 ${xpRemaining} XP`;
  }
  if (gameXpFill) {
    gameXpFill.style.width = `${Math.max(0, Math.min(100, Math.round((gameState.xp / xpNeeded) * 100)))}%`;
  }

  const quests = getGameQuestDefinitions();
  const completedCount = quests.filter((quest) => quest.done).length;
  if (gameQuestProgress) {
    gameQuestProgress.textContent = `${completedCount} / ${quests.length}`;
  }
  if (gameQuestList) {
    gameQuestList.innerHTML = '';
    quests.forEach((quest) => {
      const item = document.createElement('li');
      item.className = quest.done ? 'done' : '';
      const meta = document.createElement('span');
      meta.className = 'quest-type';
      meta.textContent = quest.type;
      const title = document.createElement('strong');
      title.textContent = quest.title;
      const detail = document.createElement('small');
      detail.textContent = quest.detail;
      const reward = document.createElement('span');
      reward.className = 'quest-reward';
      reward.textContent = quest.done ? '已定位' : `导航 +${quest.reward}`;
      item.append(meta, title, detail, reward);
      gameQuestList.append(item);
    });
  }
}

function markPracticeDay() {
  const today = getLocalDateKey();
  if (gameState.lastPracticeDate === today) {
    return;
  }
  gameState.streak = gameState.lastPracticeDate === getYesterdayKey() ? gameState.streak + 1 : 1;
  gameState.lastPracticeDate = today;
}

function addGameXp(amount) {
  let gained = Math.max(0, Math.round(amount) || 0);
  gameState.totalXp += gained;
  while (gained > 0) {
    const xpNeeded = getXpNeededForLevel();
    const room = xpNeeded - gameState.xp;
    if (gained < room) {
      gameState.xp += gained;
      gained = 0;
    } else {
      gained -= room;
      gameState.level += 1;
      gameState.xp = 0;
    }
  }
}

function getGrade(score) {
  if (score >= 90) return 'S';
  if (score >= 78) return 'A';
  if (score >= 62) return 'B';
  if (score >= 45) return 'C';
  return 'D';
}

function getModeLabel(mode) {
  const labels = {
    song: '跟唱关',
    score: '音准关',
    rhythm: '节奏关',
    breath: '气息关',
    range: '音域关',
    curve: '自由练声',
  };
  return labels[mode] || '训练关';
}

function getCompletedQuestIds(reward) {
  const completed = [];
  if (reward.mode === 'song') {
    completed.push('complete-practice');
  }
  if ((reward.mode === 'score' || reward.mode === 'song' || reward.mode === 'curve') && reward.score >= 70) {
    completed.push('pitch-70');
  }
  if (['rhythm', 'breath', 'range'].includes(reward.mode) && reward.score >= 70) {
    completed.push('specialty-70');
  }
  return completed.filter((id) => gameQuestIds.includes(id));
}

function showGameReward(reward, questBonus) {
  if (!gameRewardPanel) {
    return;
  }
  const grade = getGrade(reward.score);
  gameRewardPanel.hidden = false;
  gameRewardPanel.dataset.grade = grade;
  if (gameRewardTitle) {
    gameRewardTitle.textContent = `${getModeLabel(reward.mode)}完成`;
  }
  if (gameRewardText) {
    const bonusText = questBonus > 0 ? `，今日任务奖励 +${questBonus} XP` : '';
    gameRewardText.textContent = `${reward.summary || '本轮已记录'}。评级 ${grade}${bonusText}`;
  }
  if (gameRewardGrade) {
    gameRewardGrade.textContent = grade;
  }
  if (gameRewardXp) {
    gameRewardXp.textContent = `+${reward.xp} XP`;
  }
}

function recordGameReward(input) {
  ensureTodayGameState();
  if (!input || !Number.isFinite(input.score)) {
    return null;
  }

  const baseXp = Math.round(22 + Math.max(0, Math.min(100, input.score)) * 0.55);
  const newlyCompleted = getCompletedQuestIds(input).filter((id) => !gameState.daily.completed[id]);
  newlyCompleted.forEach((id) => {
    gameState.daily.completed[id] = true;
  });
  const questBonus = newlyCompleted.length * 18;
  const reward = {
    id: `${Date.now()}-${input.mode || 'practice'}`,
    createdAt: new Date().toISOString(),
    mode: input.mode || 'practice',
    score: Math.round(Math.max(0, Math.min(100, input.score))),
    totalScore: Math.round(Math.max(0, Math.min(100, input.totalScore ?? input.score))),
    pitchScore: Number.isFinite(input.pitchScore) ? Math.round(input.pitchScore) : undefined,
    rhythmScore: Number.isFinite(input.rhythmScore) ? Math.round(input.rhythmScore) : undefined,
    breathScore: Number.isFinite(input.breathScore) ? Math.round(input.breathScore) : undefined,
    resonanceScore: Number.isFinite(input.resonanceScore) ? Math.round(input.resonanceScore) : undefined,
    targetSong: input.targetSong || input.songTitle || '',
    xp: baseXp + questBonus,
    summary: input.summary || '',
  };

  markPracticeDay();
  addGameXp(reward.xp);
  gameState.rewards = [reward, ...gameState.rewards].slice(0, 12);
  saveGameState();
  renderGameState();
  showGameReward(reward, questBonus);
  if (typeof requestMiraFeedbackForReward === 'function') {
    requestMiraFeedbackForReward(reward);
  }
  return reward;
}

function centsBetween(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
    return null;
  }
  return 1200 * Math.log2(a / b);
}

function summarizePitchPractice() {
  const points = pitchHistory.filter((point) => Number.isFinite(point.pitch) && point.time >= sessionStartTime);
  if (points.length < 6 || !Number.isFinite(targetPitchHz)) {
    return null;
  }
  const errors = points
    .map((point) => Math.abs(centsBetween(point.pitch, targetPitchHz)))
    .filter(Number.isFinite);
  if (!errors.length) {
    return null;
  }
  const meanError = mean(errors);
  const hitRate = Math.round((errors.filter((error) => error <= pitchScoreHitToleranceCents).length / errors.length) * 100);
  const stability = Math.max(0, Math.round(100 - Math.min(100, meanError)));
  const score = Math.round(Math.max(0, Math.min(100, hitRate * 0.62 + stability * 0.38)));
  return {
    mode: trainingMode === 'score' ? 'score' : 'curve',
    score,
    totalScore: score,
    pitchScore: score,
    summary: `命中 ${hitRate}%，平均偏差 ${meanError.toFixed(1)} cents`,
  };
}

function summarizeRhythmPractice() {
  if (typeof getRhythmStats !== 'function') {
    return null;
  }
  const stats = getRhythmStats();
  if (!stats?.total) {
    return null;
  }
  return {
    mode: 'rhythm',
    score: stats.score,
    totalScore: stats.score,
    rhythmScore: stats.score,
    summary: `命中 ${stats.hitRate}%，平均偏移 ${Math.round(stats.meanOffset)} ms`,
  };
}

function summarizeBreathPractice() {
  const sessionPoints = breathSessionHistory.filter((point) => point.time >= sessionStartTime);
  const activePoints = sessionPoints.filter((point) => point.flow >= breathActiveThreshold);
  if (activePoints.length < 4) {
    return null;
  }
  const score = Math.round(averageMetric(activePoints, 'flow') * 100);
  const stability = computeBreathStability(activePoints.map((point) => point.flow));
  const durationSeconds = Math.max(0, (activePoints[activePoints.length - 1].time - activePoints[0].time) / 1000);
  const finalScore = Math.round(Math.max(0, Math.min(100, score * 0.58 + (stability || 45) * 0.3 + Math.min(100, durationSeconds * 12) * 0.12)));
  return {
    mode: 'breath',
    score: finalScore,
    totalScore: finalScore,
    breathScore: finalScore,
    summary: `持续 ${durationSeconds.toFixed(1)} 秒，稳定度 ${stability ?? '--'}%`,
  };
}

function summarizeRangePractice() {
  if (typeof computeRangeStats !== 'function') {
    return null;
  }
  const stats = computeRangeStats();
  if (!stats || stats.sampleCount < 6) {
    return null;
  }
  const spanScore = Math.max(0, Math.min(100, Math.round((stats.spanSemitones / 18) * 100)));
  const score = Math.round(spanScore * 0.45 + stats.stability * 0.55);
  return {
    mode: 'range',
    score,
    totalScore: score,
    summary: `跨度 ${formatRangeSpan(stats.spanSemitones)}，稳定度 ${stats.stability}%`,
  };
}

function recordCurrentPracticeReward(mode = trainingMode) {
  let reward = null;
  if (mode === 'rhythm') {
    reward = summarizeRhythmPractice();
  } else if (mode === 'breath' || displayMode === 'breath') {
    reward = summarizeBreathPractice();
  } else if (mode === 'range') {
    reward = summarizeRangePractice();
  } else if (mode === 'score' || mode === 'curve') {
    reward = summarizePitchPractice();
  }
  if (reward) {
    recordGameReward(reward);
  }
}

function hideGameReward() {
  if (gameRewardPanel) {
    gameRewardPanel.hidden = true;
  }
  if (typeof hideMiraFeedback === 'function') {
    hideMiraFeedback();
  }
}

renderGameState();

window.recordGameReward = recordGameReward;
window.recordCurrentPracticeReward = recordCurrentPracticeReward;
window.renderGameState = renderGameState;
window.hideGameReward = hideGameReward;
