const FIX_ONE_THING_STORAGE_KEY = 'mira.fixOneThing.successSamples.v1';
const FIX_ONE_THING_COMBO_KEY = 'mira.fixOneThing.combo.v1';
const FIX_ONE_THING_TODAY_KEY = 'mira.fixOneThing.todayPlan.v1';
const FIX_ONE_THING_DURATION_SECONDS = 300;
const FIX_ONE_THING_REPEAT_TARGET = 10;
const FIX_ONE_THING_PASS_DELTA = 0.06;

const FIX_TASKS = {
  breathiness: [
    {
      title: '短促轻闭合发“啊”',
      durationSec: 30,
      instruction: '每次只发很短的一声“啊”，不要用大气流，重点感受声音更集中。',
      focus: '减少漏气感',
    },
    {
      title: '轻声 hum 到元音',
      durationSec: 30,
      instruction: '先轻轻 hum，再打开到“啊”，保持声音不断裂。',
      focus: '让气息和闭合更稳定',
    },
  ],
  closure: [
    {
      title: '轻柔 onset 练习',
      durationSec: 30,
      instruction: '用很轻的方式开始发声，避免一下子挤紧或冲出来。',
      focus: '改善起音和闭合',
    },
    {
      title: 'Gee Gee Gee',
      durationSec: 30,
      instruction: '轻声重复 Gee Gee Gee，保持声音清楚但不要用力压喉。',
      focus: '找到更稳定的声带接触',
    },
  ],
  unknown: [
    {
      title: '稳定发一条轻声长音',
      durationSec: 30,
      instruction: '保持轻声、稳定、舒服，不追求响，只追求连续。',
      focus: '建立稳定基线',
    },
  ],
};

const FIX_ISSUE_COPY = {
  breathiness: {
    label: '漏气感',
    metricLabel: '漏气感',
    reason: '这一句里气声和高频噪声更明显，声音有点散。',
    advice: '今天先不管别的，只练 30 秒，让声音更集中一点。',
    doneLabel: '漏气感',
  },
  closure: {
    label: '闭合方式',
    metricLabel: '闭合压力',
    reason: '这一句的闭合不够稳定，可能偏松，也可能有一点挤。',
    advice: '今天先放轻起音，找清楚但不硬挤的接触感。',
    doneLabel: '闭合',
  },
  unknown: {
    label: '稳定基线',
    metricLabel: '稳定度',
    reason: '这一句没有明显单一问题，Mira 不强行诊断。',
    advice: '先做最简单的稳定练习，给下一轮建立更清楚的声音基线。',
    doneLabel: '稳定基线',
  },
};

let fixOneThingTimer = null;
let fixOneThingPracticeStartedAt = 0;
let fixOneThingSession = createFixSession();
let fixOneThingState = {
  phase: 'idle',
  combo: loadFixOneThingCombo(),
  remainingSeconds: FIX_ONE_THING_DURATION_SECONDS,
};

function createFixSession() {
  return {
    id: `fix-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    targetAudioId: null,
    baselineRecording: null,
    afterRecording: null,
    issueType: null,
    diagnosisLevel: null,
    severity: null,
    confidence: 0,
    beforeScores: null,
    afterScores: null,
    selectedTask: null,
    attempts: [],
    bestAttempt: null,
    completed: false,
    miraSummary: '',
    result: null,
    createdAt: new Date().toISOString(),
  };
}

function getFixTodayId() {
  return new Date().toISOString().slice(0, 10);
}

function loadFixTodayCompleted() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FIX_ONE_THING_TODAY_KEY) || '{}');
    return parsed.date === getFixTodayId() && Array.isArray(parsed.completed) ? parsed.completed : [];
  } catch (error) {
    return [];
  }
}

function saveFixTodayCompleted(completed) {
  try {
    localStorage.setItem(
      FIX_ONE_THING_TODAY_KEY,
      JSON.stringify({ date: getFixTodayId(), completed: [...new Set(completed)] })
    );
  } catch (error) {
    // Motivational UI only; practice should continue if storage is unavailable.
  }
}

function loadFixOneThingCombo() {
  try {
    const value = Number(localStorage.getItem(FIX_ONE_THING_COMBO_KEY));
    return Number.isFinite(value) ? Math.max(0, Math.min(4, value)) : 0;
  } catch (error) {
    return 0;
  }
}

function saveFixOneThingCombo(combo) {
  try {
    localStorage.setItem(FIX_ONE_THING_COMBO_KEY, String(Math.max(0, Math.min(4, combo))));
  } catch (error) {
    // Local storage is optional.
  }
}

function loadFixOneThingSamples() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FIX_ONE_THING_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveFixOneThingSample(sample) {
  try {
    const samples = [sample, ...loadFixOneThingSamples()].slice(0, 80);
    localStorage.setItem(FIX_ONE_THING_STORAGE_KEY, JSON.stringify(samples));
  } catch (error) {
    // Future training asset; not a blocker.
  }
}

function clampFixScore(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function formatFixScore(value) {
  return Number.isFinite(value) ? value.toFixed(2) : '--';
}

function averageFixMetric(frames, key) {
  const values = frames.map((frame) => frame?.[key]).filter(Number.isFinite);
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getFixStd(values) {
  const source = values.filter(Number.isFinite);
  if (source.length < 2) {
    return 0;
  }
  const mean = source.reduce((sum, value) => sum + value, 0) / source.length;
  return Math.sqrt(source.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / source.length);
}

function getFixActiveFrames(frames) {
  const source = Array.isArray(frames) ? frames : [];
  const voiced = source.filter((frame) => Number.isFinite(frame?.rms) && frame.rms > 0.01);
  return voiced.length >= 4 ? voiced : source;
}

function getFixRecordingSnapshot(frames) {
  return {
    id: selectedRecordingLibraryId || `recording-${Date.now()}`,
    frameCount: frames.length,
    durationMs: frames.length ? Math.max(0, frames[frames.length - 1].timeMs - frames[0].timeMs) : 0,
    createdAt: new Date().toISOString(),
  };
}

function getFixSeverity(score) {
  if (score >= 0.72) return 'strong';
  if (score >= 0.46) return 'medium';
  return 'mild';
}

function getFixSeverityCopy(severity) {
  if (severity === 'strong') return '比较明显';
  if (severity === 'medium') return '中等';
  return '轻微';
}

function getFixDiagnosisLevel(confidence, issueType) {
  if (issueType === 'unknown' || confidence < 0.25) {
    return 'unknown';
  }
  if (confidence < 0.55) {
    return 'tentative';
  }
  return 'confirmed';
}

function getFixDiagnosisLabel(level) {
  if (level === 'confirmed') return '明确问题';
  if (level === 'tentative') return '试探性判断';
  return '线索不足';
}

function chooseFixTask(issueType, scores, diagnosisLevel = 'confirmed') {
  const tasks = FIX_TASKS[issueType] || FIX_TASKS.unknown;
  if (tasks.length <= 1) {
    return tasks[0];
  }
  if (diagnosisLevel === 'tentative') {
    return tasks[0];
  }
  const seed = Math.round(((scores?.breathiness || 0) + (scores?.closure || 0)) * 100);
  return tasks[seed % tasks.length];
}

function extractFixFeatures(frames = recordingTimelineFrames) {
  const activeFrames = getFixActiveFrames(frames);
  const rmsValues = activeFrames.map((frame) => frame.rms).filter(Number.isFinite);
  const highFrequencyRatio = averageFixMetric(activeFrames, 'highFrequencyRatio');
  const zcr = averageFixMetric(activeFrames, 'zcr');
  const spectralFlatness = averageFixMetric(activeFrames, 'spectralFlatness');
  const waveformRoughness = averageFixMetric(activeFrames, 'waveformRoughness');
  const rmsMean = rmsValues.length ? rmsValues.reduce((sum, value) => sum + value, 0) / rmsValues.length : 0;
  const rmsStability = clampFixScore(1 - (getFixStd(rmsValues) / Math.max(0.001, rmsMean * 1.8)));

  return {
    frames: activeFrames,
    highFrequencyRatio,
    zcr,
    spectralFlatness,
    waveformRoughness,
    rmsMean,
    rmsStability,
  };
}

function scoreFixIssue(features) {
  const breathiness = clampFixScore(
    features.highFrequencyRatio * 2.8 +
      features.zcr * 1.7 +
      features.spectralFlatness * 0.62 +
      (1 - features.rmsStability) * 0.22
  );
  const pressedClosure = clampFixScore(
    features.waveformRoughness * 0.92 +
      Math.max(0, features.rmsMean - 0.055) * 5.2 +
      Math.max(0, 0.18 - features.zcr) * 1.45
  );
  const looseClosure = clampFixScore(
    Math.max(0, 0.04 - features.rmsMean) * 7.5 +
      Math.max(0, features.waveformRoughness - 0.42) * 0.35 +
      (1 - features.rmsStability) * 0.18
  );
  const closure = clampFixScore(Math.max(pressedClosure, looseClosure));

  return {
    breathiness,
    closure,
  };
}

function chooseFixIssue(scores, frameCount) {
  if (frameCount < 4) {
    return { issueType: 'unknown', confidence: 0.08, diagnosisLevel: 'unknown' };
  }

  const { breathiness, closure } = scores;
  const topScore = Math.max(breathiness, closure);
  const gap = Math.abs(breathiness - closure);
  const issueType = breathiness >= closure ? 'breathiness' : 'closure';

  if (topScore < 0.1) {
    return {
      issueType: 'unknown',
      confidence: clampFixScore(topScore),
      diagnosisLevel: 'unknown',
    };
  }

  const confidence = clampFixScore(0.18 + topScore * 0.45 + gap * 0.55);
  const diagnosisLevel = topScore < 0.55 || gap < 0.15 ? 'tentative' : 'confirmed';
  return {
    issueType,
    confidence,
    diagnosisLevel,
  };
}

function analyzeFixOneThingRecording(frames = recordingTimelineFrames) {
  const features = extractFixFeatures(frames);
  const scores = scoreFixIssue(features);
  const choice = chooseFixIssue(scores, features.frames.length);
  const targetScore = choice.issueType === 'unknown'
    ? Math.max(scores.breathiness, scores.closure)
    : scores[choice.issueType];
  const severity = choice.issueType === 'unknown' ? 'mild' : getFixSeverity(targetScore);
  const selectedTask = chooseFixTask(choice.issueType, scores, choice.diagnosisLevel);

  return {
    issueType: choice.issueType,
    diagnosisLevel: choice.diagnosisLevel,
    severity,
    confidence: choice.confidence,
    scores,
    selectedTask,
    features: {
      highFrequencyRatio: features.highFrequencyRatio,
      zcr: features.zcr,
      spectralFlatness: features.spectralFlatness,
      waveformRoughness: features.waveformRoughness,
      rmsMean: features.rmsMean,
      rmsStability: features.rmsStability,
    },
    frameCount: features.frames.length,
    durationMs: features.frames.length
      ? features.frames[features.frames.length - 1].timeMs - features.frames[0].timeMs
      : 0,
  };
}

function setFixText(element, text) {
  if (element) {
    element.textContent = text;
  }
}

function renderFixEvidence(analysis) {
  const scores = analysis?.scores || {};
  setFixText(fixEvidenceBreathiness, formatFixScore(scores.breathiness));
  setFixText(fixEvidencePitch, formatFixScore(scores.closure));
  setFixText(fixEvidenceFocus, formatFixScore(analysis?.features?.rmsStability));
}

function updateFixTrainingPlan() {
  const items = fixOneThingTrainingPlan?.querySelectorAll('li') || [];
  items.forEach((item) => {
    const key = item.dataset.fixPlan;
    const done = key === fixOneThingSession.issueType && fixOneThingSession.result?.status === 'improved';
    if (key === 'breathiness') {
      item.textContent = `${done ? '✓' : '□'} 漏气感`;
    } else if (key === 'closure') {
      item.textContent = `${done ? '✓' : '□'} 闭合方式`;
    } else {
      item.textContent = `${done ? '✓' : '□'} 稳定基线`;
    }
  });
}

function renderFixResult() {
  const result = fixOneThingSession.result;
  if (fixOneThingResultCard) {
    fixOneThingResultCard.hidden = !result;
  }
  if (!result) {
    setFixText(fixOneThingMetricName, '--');
    setFixText(fixOneThingMetricBefore, '--');
    setFixText(fixOneThingMetricAfter, '--');
    setFixText(fixOneThingImprovement, '再录一次后，Mira 会判断是否进步。');
    setFixText(fixOneThingXp, 'XP +0');
    return;
  }

  setFixText(fixOneThingMetricName, result.metricLabel);
  setFixText(fixOneThingMetricBefore, formatFixScore(result.beforeScore));
  setFixText(fixOneThingMetricAfter, formatFixScore(result.afterScore));
  const isTentative = fixOneThingSession.diagnosisLevel === 'tentative';
  const hypothesisLabel = FIX_ISSUE_COPY[fixOneThingSession.issueType || 'unknown']?.label || '稳定基线';
  const resultPrefix = isTentative
    ? `本轮假设：${hypothesisLabel}。复测变化：${formatFixScore(result.beforeScore)} → ${formatFixScore(result.afterScore)}。`
    : '';

  if (result.status === 'improved') {
    const comboText = result.combo > 1 ? ` Combo x${result.combo}` : '';
    setFixText(
      fixOneThingImprovement,
      `${resultPrefix}有进步，下降 ${Math.round(result.delta * 100)}%。这次声音更集中了一点，我们可以继续这个方向。${comboText}`
    );
  } else if (result.status === 'worse') {
    setFixText(fixOneThingImprovement, `${resultPrefix}这次可能用力方式不太对。先放轻一点，不要硬挤。`);
  } else {
    setFixText(fixOneThingImprovement, `${resultPrefix}这次变化不明显，Mira 建议换一个更简单的验证练习。`);
  }
  setFixText(fixOneThingXp, `XP +${result.xp}`);
}

function renderFixOneThingFlow() {
  if (!fixOneThingPanel) {
    return;
  }

  const phase = fixOneThingState.phase;
  const issueType = fixOneThingSession.issueType || 'unknown';
  const diagnosisLevel = fixOneThingSession.diagnosisLevel || 'unknown';
  const issueCopy = FIX_ISSUE_COPY[issueType] || FIX_ISSUE_COPY.unknown;
  const task = fixOneThingSession.selectedTask || FIX_TASKS.unknown[0];
  const hasTask = Boolean(fixOneThingSession.selectedTask);
  const isRecording = Boolean(mediaRecorder && mediaRecorder.state !== 'inactive');

  let stageTitle = '等待第一句录音';
  let stageCopy = '录一句 5-15 秒的声音，Mira 会只选一个最值得修正的问题。';
  let primaryText = '录制第一句';
  let problemText = '等待录音';
  let reasonText = '先完成第一句录音。';
  let whyLines = [
    'Mira 只会在漏气感和闭合方式里选一个。',
    '只要有一点倾向，就会先给可验证假设。',
    '这一轮不看音准、节奏和共鸣。',
  ];

  if (phase === 'recording-before') {
    stageTitle = '正在听第一句';
    stageCopy = '唱完后点停止。Mira 会听这一句里最值得修的地方。';
    primaryText = '停止并分析';
  } else if (phase === 'analyzing') {
    stageTitle = '分析中';
    stageCopy = 'Mira 正在听这一句里最值得修的地方。';
    primaryText = '分析中...';
  } else if (phase === 'task-ready') {
    stageTitle = '今天只修一件事';
    stageCopy = `任务：${issueCopy.label}。预计 5 分钟，重复 10 次，Mira 会保存最好的一次。`;
    primaryText = fixOneThingSession.attempts.length ? `录第 ${fixOneThingSession.attempts.length + 1}/10 次` : '开始5分钟训练';
  } else if (phase === 'recording-after') {
    stageTitle = '5分钟带练中';
    stageCopy = `第 ${Math.min(FIX_ONE_THING_REPEAT_TARGET, fixOneThingSession.attempts.length + 1)}/10 次：${task.focus}`;
    primaryText = '停止并复测';
  } else if (phase === 'complete') {
    stageTitle = '5分钟训练完成';
    stageCopy = fixOneThingSession.miraSummary || 'Mira 已保存本次训练结果。';
    primaryText = '再练一轮';
  }

  if (hasTask) {
    const successReferenceCopy = typeof getSuccessReferenceCopy === 'function'
      ? getSuccessReferenceCopy(issueType)
      : '';
    if (diagnosisLevel === 'unknown') {
      problemText = 'Mira 还没有抓到足够清楚的线索。';
      reasonText = '先做一个稳定基线练习，让下一轮录音更容易判断。';
    } else if (diagnosisLevel === 'tentative') {
      problemText = issueType === 'breathiness'
        ? 'Mira 暂时最怀疑：这一句有一点漏气感。'
        : 'Mira 暂时最怀疑：这一句的闭合稳定性不够。';
      reasonText = '这个判断还不确定，我们先用 30 秒练习验证一下。';
    } else {
      problemText = `Mira 发现：这一句最值得先修的是${issueCopy.label}。`;
      reasonText = `今天先不管别的，只修这一件事。严重程度：${getFixSeverityCopy(fixOneThingSession.severity)}。`;
    }
    whyLines = [
      diagnosisLevel === 'tentative'
        ? '先试 30 秒，看看下一轮录音是否改善。'
        : issueCopy.advice,
      successReferenceCopy || `置信度：${Math.round((fixOneThingSession.confidence || 0) * 100)}%。`,
      '这一轮只追踪这一个问题。',
    ];
  }

  if (isRecording && (phase === 'recording-before' || phase === 'recording-after')) {
    primaryText = '停止录音';
  }

  setFixText(fixOneThingPanel.querySelector('.fix-stage-card .label'), '现在要做什么');
  setFixText(fixOneThingPanel.querySelector('.fix-focus-card .label'), getFixDiagnosisLabel(diagnosisLevel));
  setFixText(fixOneThingPanel.querySelector('.fix-exercise-card .label'), '带练步骤');
  setFixText(fixOneThingPanel.querySelector('.fix-evidence-panel summary span'), '高级分析');
  setFixText(fixOneThingPanel.querySelector('.fix-evidence-panel summary small'), '默认不用看');
  setFixText(fixOneThingStageTitle, stageTitle);
  setFixText(fixOneThingStageCopy, stageCopy);
  setFixText(fixOneThingEstimatedTime, '预计时间：5分钟');
  setFixText(fixOneThingRepeatProgress, `第 ${Math.min(FIX_ONE_THING_REPEAT_TARGET, fixOneThingSession.attempts.length)}/${FIX_ONE_THING_REPEAT_TARGET} 次`);
  setFixText(fixOneThingProblem, problemText);
  setFixText(document.getElementById('fixOneThingTaskReason'), reasonText);
  const impactLabel = fixOneThingPanel.querySelector('.fix-impact-row span');
  setFixText(impactLabel, '判断层级');
  setFixText(fixOneThingImpact, hasTask ? getFixDiagnosisLabel(diagnosisLevel) : '--');
  if (fixOneThingImpact) {
    fixOneThingImpact.dataset.level = hasTask ? diagnosisLevel : 'idle';
  }
  setFixText(document.getElementById('fixOneThingWhyLine1'), whyLines[0]);
  setFixText(document.getElementById('fixOneThingWhyLine2'), whyLines[1]);
  setFixText(document.getElementById('fixOneThingWhyLine3'), whyLines[2]);
  setFixText(fixOneThingExerciseTitle, hasTask ? task.title : '先完成第一句录音');
  setFixText(fixOneThingExerciseCopy, hasTask ? `练习方式：${task.instruction}` : 'Mira 会根据这一句生成 5 分钟带练任务。');
  if (fixOneThingCoachSteps) {
    fixOneThingCoachSteps.innerHTML = `
      <li>Step 1：听目标片段</li>
      <li>Step 2：轻声模仿一次</li>
      <li>Step 3：正常音量唱一次</li>
      <li>Step 4：重复到第 ${FIX_ONE_THING_REPEAT_TARGET} 次，并保存最好的一次</li>
      <li>Step 5：和历史最佳对比</li>
    `;
  }
  setFixText(
    fixOneThingDuration,
    phase === 'recording-after' ? `第 ${fixOneThingSession.attempts.length + 1}/10 次` : '预计时间：5分钟'
  );
  setFixText(document.getElementById('fixOneThingFocusPoint'), hasTask ? `完成标准：连续 3 次明显改善，或完成 10 次后本次最佳高于第一句。` : '重点：只追求一个动作变好。');
  setFixText(fixOneThingPrimaryButton, primaryText);
  if (fixOneThingPrimaryButton) {
    fixOneThingPrimaryButton.disabled = phase === 'analyzing';
  }
  setFixText(document.getElementById('fixOneThingActiveTarget'), `当前目标：${hasTask ? task.focus : '--'}`);
  setFixText(document.getElementById('fixOneThingCountdown'), `第 ${fixOneThingSession.attempts.length + 1}/10 次`);
  setFixText(fixOneThingBestAttempt, `本次最佳：${getFixAttemptLabel(fixOneThingSession.bestAttempt)}`);
  const activeCard = document.getElementById('fixOneThingActiveCard');
  if (activeCard) {
    activeCard.hidden = phase !== 'recording-after';
  }
  renderFixEvidence(fixOneThingSession.afterAnalysis || fixOneThingSession.beforeAnalysis);
  renderFixResult();
  updateFixTrainingPlan();
}

function stopFixOneThingTimer() {
  if (fixOneThingTimer) {
    clearInterval(fixOneThingTimer);
    fixOneThingTimer = null;
  }
}

function startFixOneThingTimer() {
  stopFixOneThingTimer();
  fixOneThingPracticeStartedAt = Date.now();
  fixOneThingState.remainingSeconds = FIX_ONE_THING_DURATION_SECONDS;
  renderFixOneThingFlow();
  fixOneThingTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - fixOneThingPracticeStartedAt) / 1000);
    fixOneThingState.remainingSeconds = Math.max(0, FIX_ONE_THING_DURATION_SECONDS - elapsed);
    renderFixOneThingFlow();
    if (fixOneThingState.remainingSeconds <= 0 && mediaRecorder && mediaRecorder.state !== 'inactive') {
      stopVoiceRecording();
    }
  }, 250);
}

async function startFixOneThingRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    stopVoiceRecording();
    return;
  }

  const nextPhase = fixOneThingSession.baselineRecording && fixOneThingSession.selectedTask
    ? 'recording-after'
    : 'recording-before';
  if (nextPhase === 'recording-before') {
    fixOneThingSession.afterRecording = null;
    fixOneThingSession.afterScores = null;
    fixOneThingSession.result = null;
  }
  fixOneThingState.phase = nextPhase;
  renderFixOneThingFlow();

  const started = await startVoiceRecording();
  if (!started) {
    stopFixOneThingTimer();
    fixOneThingState.phase = fixOneThingSession.selectedTask ? 'task-ready' : 'idle';
    renderFixOneThingFlow();
    return;
  }
  if (nextPhase === 'recording-after') {
    startFixOneThingTimer();
  }
}

function resetFixOneThingFlow() {
  stopFixOneThingTimer();
  fixOneThingSession = createFixSession();
  fixOneThingState = {
    phase: 'idle',
    combo: loadFixOneThingCombo(),
    remainingSeconds: FIX_ONE_THING_DURATION_SECONDS,
  };
  renderFixOneThingFlow();
}

function getFixTargetScore(scores, issueType) {
  if (issueType === 'unknown') {
    return 1 - clampFixScore((scores?.breathiness || 0) * 0.5 + (scores?.closure || 0) * 0.5);
  }
  return scores?.[issueType] || 0;
}

function getFixPerformanceScore(scores, issueType) {
  if (issueType === 'unknown') {
    return getFixTargetScore(scores, issueType);
  }
  return 1 - clampFixScore(scores?.[issueType] || 0);
}

function getFixAttemptLabel(attempt) {
  if (!attempt) {
    return '--';
  }
  const delta = Math.round((attempt.performanceScore - attempt.baselinePerformance) * 100);
  return `${attempt.index}/10 · ${Math.round(attempt.performanceScore * 100)}分 · ${delta >= 0 ? '+' : ''}${delta}%`;
}

function getFixCompletionSummary(session = fixOneThingSession) {
  const issueCopy = FIX_ISSUE_COPY[session.issueType || 'unknown'] || FIX_ISSUE_COPY.unknown;
  const best = session.bestAttempt;
  if (!best) {
    return 'Mira 会在 10 次练习里保存最好的一次。';
  }
  const delta = Math.round((best.performanceScore - best.baselinePerformance) * 100);
  const direction = delta >= 0 ? `比起第一句接近 +${delta}%` : `比起第一句低 ${Math.abs(delta)}%`;
  return `本次最佳：${direction}。Mira 觉得这次${issueCopy.doneLabel || issueCopy.label}更稳定了一点。`;
}

function getFixConsecutivePassCount(attempts = fixOneThingSession.attempts) {
  let count = 0;
  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    if (attempts[index].passed) {
      count += 1;
    } else {
      break;
    }
  }
  return count;
}

function addFixTrainingAttempt(analysis) {
  const issueType = fixOneThingSession.issueType || 'unknown';
  const baselinePerformance = getFixPerformanceScore(fixOneThingSession.beforeScores, issueType);
  const performanceScore = getFixPerformanceScore(analysis.scores, issueType);
  const attempt = {
    index: fixOneThingSession.attempts.length + 1,
    recording: getFixRecordingSnapshot(recordingTimelineFrames),
    scores: analysis.scores,
    performanceScore,
    baselinePerformance,
    delta: performanceScore - baselinePerformance,
    passed: performanceScore - baselinePerformance >= FIX_ONE_THING_PASS_DELTA,
    createdAt: new Date().toISOString(),
  };
  fixOneThingSession.attempts.push(attempt);
  if (!fixOneThingSession.bestAttempt || performanceScore > fixOneThingSession.bestAttempt.performanceScore) {
    fixOneThingSession.bestAttempt = attempt;
    fixOneThingSession.afterRecording = attempt.recording;
    fixOneThingSession.afterScores = analysis.scores;
  }
  return attempt;
}

function finishFixOneThingRound(afterAnalysis) {
  const issueType = fixOneThingSession.issueType || 'unknown';
  const bestAttempt = fixOneThingSession.bestAttempt || addFixTrainingAttempt(afterAnalysis);
  const beforeScore = getFixPerformanceScore(fixOneThingSession.beforeScores, issueType);
  const afterScore = bestAttempt.performanceScore;
  const rawDelta = afterScore - beforeScore;
  const delta = Number.isFinite(rawDelta) ? rawDelta : 0;
  const passedCount = getFixConsecutivePassCount();
  const completed = fixOneThingSession.attempts.length >= FIX_ONE_THING_REPEAT_TARGET || passedCount >= 3;
  let status = 'no_clear_change';
  if (completed && delta >= FIX_ONE_THING_PASS_DELTA) {
    status = 'improved';
  } else if (delta <= -0.05) {
    status = 'worse';
  }

  const nextCombo = status === 'improved' ? Math.min(4, fixOneThingState.combo + 1 || 1) : 0;
  const xp = completed ? Math.max(20, Math.min(50, Math.round((20 + Math.max(0, delta) * 120) * Math.max(1, nextCombo || 1)))) : 0;
  fixOneThingState.combo = nextCombo;
  saveFixOneThingCombo(nextCombo);
  fixOneThingSession.completed = completed;
  fixOneThingSession.miraSummary = getFixCompletionSummary();

  fixOneThingSession.result = {
    status,
    metricLabel: FIX_ISSUE_COPY[issueType]?.metricLabel || '目标问题',
    beforeScore,
    afterScore,
    delta: Math.abs(delta),
    combo: nextCombo,
    xp,
    completed,
    repeatCount: fixOneThingSession.attempts.length,
    bestAttempt,
    miraSummary: fixOneThingSession.miraSummary,
  };

  if (completed) {
    saveFixTodayCompleted([...loadFixTodayCompleted(), issueType]);
    saveFixOneThingSample({
      id: `${Date.now()}-${issueType}`,
      sessionId: fixOneThingSession.id,
      createdAt: new Date().toISOString(),
      issueType,
      diagnosisLevel: fixOneThingSession.diagnosisLevel,
      severity: fixOneThingSession.severity,
      confidence: Number((fixOneThingSession.confidence || 0).toFixed(4)),
      taskTitle: fixOneThingSession.selectedTask?.title,
      beforeScore: Number(beforeScore.toFixed(4)),
      afterScore: Number(afterScore.toFixed(4)),
      delta: Number(delta.toFixed(4)),
      repeatCount: fixOneThingSession.attempts.length,
      completed,
      bestRecording: bestAttempt.recording,
      miraSummary: fixOneThingSession.miraSummary,
      xp,
    });
    if (typeof recordFixOneThingReward === 'function') {
      recordFixOneThingReward({
        xp,
        score: Math.round(Math.min(100, Math.max(30, afterScore * 100))),
        summary: fixOneThingSession.miraSummary,
      });
    }
    if (typeof addFixSuccessSampleFromCurrentSession === 'function') {
      addFixSuccessSampleFromCurrentSession({
        issueType,
        summary: `成功训练样本 · ${fixOneThingSession.miraSummary}`,
      });
    }
  }
}

function onFixOneThingRecordingStopped() {
  stopFixOneThingTimer();
  if (fixOneThingState.phase === 'recording-before') {
    fixOneThingState.phase = 'analyzing';
    renderFixOneThingFlow();
    const analysis = analyzeFixOneThingRecording(recordingTimelineFrames);
    fixOneThingSession.baselineRecording = getFixRecordingSnapshot(recordingTimelineFrames);
    fixOneThingSession.beforeAnalysis = analysis;
    fixOneThingSession.issueType = analysis.issueType;
    fixOneThingSession.diagnosisLevel = analysis.diagnosisLevel;
    fixOneThingSession.severity = analysis.severity;
    fixOneThingSession.confidence = analysis.confidence;
    fixOneThingSession.beforeScores = analysis.scores;
    fixOneThingSession.selectedTask = analysis.selectedTask;
    fixOneThingState.phase = 'task-ready';
  } else if (fixOneThingState.phase === 'recording-after') {
    const analysis = analyzeFixOneThingRecording(recordingTimelineFrames);
    fixOneThingSession.afterAnalysis = analysis;
    const attempt = addFixTrainingAttempt(analysis);
    const passedCount = getFixConsecutivePassCount();
    if (fixOneThingSession.attempts.length >= FIX_ONE_THING_REPEAT_TARGET || passedCount >= 3) {
      finishFixOneThingRound(analysis);
      fixOneThingState.phase = 'complete';
    } else {
      fixOneThingState.phase = 'task-ready';
      fixOneThingSession.result = {
        status: attempt.passed ? 'improved' : 'no_clear_change',
        metricLabel: FIX_ISSUE_COPY[fixOneThingSession.issueType || 'unknown']?.metricLabel || '目标问题',
        beforeScore: attempt.baselinePerformance,
        afterScore: attempt.performanceScore,
        delta: Math.abs(attempt.delta),
        combo: fixOneThingState.combo,
        xp: 0,
        completed: false,
        repeatCount: fixOneThingSession.attempts.length,
        bestAttempt: fixOneThingSession.bestAttempt,
        miraSummary: getFixCompletionSummary(),
      };
    }
  }
  renderFixOneThingFlow();
}

fixOneThingPrimaryButton?.addEventListener('click', () => {
  if (fixOneThingState.phase === 'complete') {
    resetFixOneThingFlow();
  } else {
    startFixOneThingRecording().catch((error) => console.error(error));
  }
});

fixOneThingResetButton?.addEventListener('click', resetFixOneThingFlow);

window.analyzeFixOneThingRecording = analyzeFixOneThingRecording;
window.onFixOneThingRecordingStopped = onFixOneThingRecordingStopped;
window.renderFixOneThingFlow = renderFixOneThingFlow;
window.resetFixOneThingFlow = resetFixOneThingFlow;
