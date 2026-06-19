const DAILY_CHALLENGE_STORAGE_KEY = 'voiceTrainingDailyChallenge.v1';
const DAILY_CHALLENGE_REWARD_XP = 10;

let dailyChallengeAudioContext = null;
let dailyChallengeOscillators = [];
let dailyChallengePair = null;
let dailyChallengeState = loadDailyChallengeState();

function createDefaultDailyChallengeState() {
  return {
    date: typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10),
    completed: false,
    streak: 0,
    hearingJudgement: 0,
    lastCompletedDate: '',
  };
}

function loadDailyChallengeState() {
  try {
    const raw = window.localStorage?.getItem(DAILY_CHALLENGE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object'
      ? { ...createDefaultDailyChallengeState(), ...parsed }
      : createDefaultDailyChallengeState();
  } catch (error) {
    console.warn('Failed to load daily challenge state', error);
    return createDefaultDailyChallengeState();
  }
}

function saveDailyChallengeState() {
  try {
    window.localStorage?.setItem(DAILY_CHALLENGE_STORAGE_KEY, JSON.stringify(dailyChallengeState));
  } catch (error) {
    console.warn('Failed to save daily challenge state', error);
  }
}

function ensureDailyChallengeToday() {
  const today = typeof getLocalDateKey === 'function' ? getLocalDateKey() : new Date().toISOString().slice(0, 10);
  if (dailyChallengeState.date !== today) {
    dailyChallengeState = {
      ...dailyChallengeState,
      date: today,
      completed: false,
    };
    saveDailyChallengeState();
  }
  return dailyChallengeState;
}

function stopDailyChallengeSyntheticAudio() {
  dailyChallengeOscillators.forEach((node) => {
    try {
      node.stop();
    } catch (error) {
      // Already stopped.
    }
  });
  dailyChallengeOscillators = [];
}

function createDailySyntheticPair() {
  return {
    source: 'synthetic',
    answer: 'A',
    explanation: 'A 更好。原因：A 的音高更稳，尾音没有明显晃动。',
    options: {
      A: {
        label: 'A',
        kind: 'stable',
      },
      B: {
        label: 'B',
        kind: 'wobbly',
      },
    },
  };
}

function getDailyRecordingPair() {
  if (!successLibrary?.length || !recordingLibrary?.length || typeof getSuccessRecordingById !== 'function') {
    return null;
  }
  const successSample = successLibrary.find((sample) => getSuccessRecordingById(sample.recordingId));
  if (!successSample) {
    return null;
  }
  const successRecording = getSuccessRecordingById(successSample.recordingId);
  const ordinaryRecording = recordingLibrary.find((recording) => (
    recording?.type === 'recording' &&
    recording.id !== successSample.recordingId &&
    Array.isArray(recording.frames) &&
    recording.frames.length
  ));
  if (!successRecording || !ordinaryRecording) {
    return null;
  }
  const successOnA = Number(successSample.scoreOverall || 0) % 2 === 0;
  const answer = successOnA ? 'A' : 'B';
  const report = typeof compareSamples === 'function'
    ? compareSamples(ordinaryRecording, successSample)
    : null;
  return {
    source: 'library',
    answer,
    explanation: `${answer} 更好。原因：${report?.mainReasons?.[0]?.label || '这一段更接近你的历史好状态'}。`,
    options: {
      A: {
        label: 'A',
        recording: successOnA ? successRecording : ordinaryRecording,
      },
      B: {
        label: 'B',
        recording: successOnA ? ordinaryRecording : successRecording,
      },
    },
  };
}

function buildDailyChallengePair() {
  return getDailyRecordingPair() || createDailySyntheticPair();
}

async function ensureDailyChallengeAudioContext() {
  dailyChallengeAudioContext = dailyChallengeAudioContext || new (window.AudioContext || window.webkitAudioContext)();
  if (dailyChallengeAudioContext.state === 'suspended') {
    await dailyChallengeAudioContext.resume();
  }
  return dailyChallengeAudioContext;
}

async function playDailySyntheticOption(kind) {
  stopDailyChallengeSyntheticAudio();
  const context = await ensureDailyChallengeAudioContext();
  if (typeof setBgmDucking === 'function') {
    setBgmDucking('daily-challenge', true);
  }
  const startTime = context.currentTime + 0.03;
  const duration = 1.15;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  gain.connect(context.destination);

  const oscillator = context.createOscillator();
  oscillator.type = kind === 'stable' ? 'sine' : 'triangle';
  oscillator.frequency.setValueAtTime(392, startTime);
  if (kind === 'wobbly') {
    oscillator.frequency.setValueAtTime(386, startTime);
    oscillator.frequency.linearRampToValueAtTime(410, startTime + 0.28);
    oscillator.frequency.linearRampToValueAtTime(376, startTime + 0.62);
    oscillator.frequency.linearRampToValueAtTime(404, startTime + duration);
  }
  oscillator.connect(gain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
  dailyChallengeOscillators.push(oscillator);
  window.setTimeout(() => {
    if (typeof setBgmDucking === 'function') {
      setBgmDucking('daily-challenge', false);
    }
  }, Math.round((duration + 0.12) * 1000));
}

function playDailyChallengeOption(label) {
  const option = dailyChallengePair?.options?.[label];
  if (!option) {
    return;
  }
  if (dailyChallengeStatus) {
    dailyChallengeStatus.textContent = `正在播放 ${label}。听完再选，不用紧张。`;
  }
  if (option.recording && typeof playRecordingLibraryItem === 'function') {
    playRecordingLibraryItem(option.recording);
    return;
  }
  playDailySyntheticOption(option.kind || 'stable').catch((error) => {
    console.warn('Daily challenge audio failed', error);
    if (dailyChallengeStatus) {
      dailyChallengeStatus.textContent = '播放失败了，但今天打开 Mira 也已经算开始。';
    }
  });
}

function updateDailyChallengeButtons(answered = false) {
  const completed = ensureDailyChallengeToday().completed;
  [dailyChallengeChooseAButton, dailyChallengeChooseBButton, dailyChallengeUnsureButton].forEach((button) => {
    if (button) {
      button.disabled = answered || completed;
    }
  });
}

function openDailyChallenge() {
  ensureDailyChallengeToday();
  dailyChallengePair = buildDailyChallengePair();
  if (dailyChallengePanel) {
    dailyChallengePanel.hidden = false;
    dailyChallengePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (dailyChallengeResult) {
    dailyChallengeResult.hidden = !dailyChallengeState.completed;
  }
  updateDailyChallengeButtons(dailyChallengeState.completed);
  if (dailyChallengeStatus) {
    dailyChallengeStatus.textContent = dailyChallengeState.completed
      ? '今日挑战已经完成。明天 Mira 再给你一题。'
      : 'Step 1 播放 A，Step 2 播放 B，然后选你觉得更好听的一段。';
  }
  if (typeof setMiraPresenceState === 'function') {
    setMiraPresenceState('thinking', '今天只听一下');
  }
}

function closeDailyChallenge() {
  stopDailyChallengeSyntheticAudio();
  if (dailyChallengePanel) {
    dailyChallengePanel.hidden = true;
  }
  if (typeof setMiraPresenceState === 'function') {
    setMiraPresenceState('idle');
  }
}

function completeDailyChallenge(choice) {
  ensureDailyChallengeToday();
  const answer = dailyChallengePair?.answer || 'A';
  const isUnsure = choice === 'unsure';
  const isCorrect = choice === answer;
  if (!dailyChallengeState.completed) {
    dailyChallengeState.completed = true;
    if (isCorrect) {
      dailyChallengeState.hearingJudgement += 1;
    }
    if (typeof markPracticeDay === 'function') {
      markPracticeDay();
    }
    if (typeof addGameXp === 'function') {
      addGameXp(DAILY_CHALLENGE_REWARD_XP);
    }
    if (typeof saveGameState === 'function') {
      saveGameState();
    }
    if (typeof renderGameState === 'function') {
      renderGameState();
    }
    dailyChallengeState.streak = Math.max(dailyChallengeState.streak || 0, gameState?.streak || 1);
    dailyChallengeState.lastCompletedDate = dailyChallengeState.date;
    saveDailyChallengeState();
  }
  if (dailyChallengeResult) {
    dailyChallengeResult.hidden = false;
  }
  if (dailyChallengeAnswer) {
    dailyChallengeAnswer.textContent = isUnsure
      ? `${answer} 更好。`
      : `${answer} 更好。${isCorrect ? '你听对了。' : '这题不用有压力。'}`;
  }
  if (dailyChallengeExplanation) {
    dailyChallengeExplanation.textContent = isUnsure
      ? '原因：没关系，听不出来也是训练的一部分。Mira 会慢慢带你分辨稳定和集中。'
      : `原因：${dailyChallengePair?.explanation?.replace(/^[AB] 更好。原因：/, '') || '这一段更稳定、更集中。'}`;
  }
  if (dailyChallengeReward) {
    const judgementText = isCorrect ? ' · 听力判断 +1' : '';
    dailyChallengeReward.textContent = `今日挑战完成 · +${DAILY_CHALLENGE_REWARD_XP} XP · 连续完成 ${gameState?.streak || dailyChallengeState.streak || 1} 天${judgementText}`;
  }
  if (gameRewardPanel) {
    gameRewardPanel.hidden = false;
  }
  if (gameRewardTitle) {
    gameRewardTitle.textContent = '今日挑战完成';
  }
  if (gameRewardText) {
    gameRewardText.textContent = isUnsure
      ? '听不出来也算完成。你今天已经打开 Mira，训练了耳朵。'
      : `听力判断${isCorrect ? ' +1。' : '不用扣分。'}今天不用唱歌也完成了练习。`;
  }
  if (gameRewardGrade) {
    gameRewardGrade.textContent = isCorrect ? '+1' : 'OK';
  }
  if (gameRewardXp) {
    gameRewardXp.textContent = `+${DAILY_CHALLENGE_REWARD_XP} XP`;
  }
  updateDailyChallengeButtons(true);
  if (dailyChallengeStatus) {
    dailyChallengeStatus.textContent = '完成了。今天不唱歌也可以到这里结束。';
  }
}

dailyChallengeStartButton?.addEventListener('click', openDailyChallenge);
dailyChallengeCloseButton?.addEventListener('click', closeDailyChallenge);
dailyChallengeDoneButton?.addEventListener('click', closeDailyChallenge);
dailyChallengePlayAButton?.addEventListener('click', () => playDailyChallengeOption('A'));
dailyChallengePlayBButton?.addEventListener('click', () => playDailyChallengeOption('B'));
dailyChallengeChooseAButton?.addEventListener('click', () => completeDailyChallenge('A'));
dailyChallengeChooseBButton?.addEventListener('click', () => completeDailyChallenge('B'));
dailyChallengeUnsureButton?.addEventListener('click', () => completeDailyChallenge('unsure'));
dailyChallengeFixButton?.addEventListener('click', () => {
  closeDailyChallenge();
  if (typeof showTrainingView === 'function') {
    showTrainingView('fix');
  }
});

window.openDailyChallenge = openDailyChallenge;
window.completeDailyChallenge = completeDailyChallenge;
