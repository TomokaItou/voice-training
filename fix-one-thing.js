const FIX_ONE_THING_STORAGE_KEY = 'mira.fixOneThing.successSamples.v1';
const FIX_ONE_THING_COMBO_KEY = 'mira.fixOneThing.combo.v1';
const FIX_ONE_THING_TODAY_KEY = 'mira.fixOneThing.todayPlan.v1';
const FIX_ONE_THING_DURATION_SECONDS = 30;

let fixOneThingTimer = null;
let fixOneThingPracticeStartedAt = 0;
let fixOneThingState = {
  phase: 'idle',
  focus: null,
  before: null,
  after: null,
  result: null,
  combo: loadFixOneThingCombo(),
  remainingSeconds: FIX_ONE_THING_DURATION_SECONDS,
};

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
    // The checklist is motivational UI; losing persistence should not block practice.
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
    // Local storage is optional; training should still work without persistence.
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
    // Success samples are a future training asset, not a blocker for this session.
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

function getFixPitchWobble(frames) {
  const pitches = frames.map((frame) => frame.pitch).filter((pitch) => Number.isFinite(pitch) && pitch > 0);
  if (pitches.length < 4) {
    return 0.35;
  }
  const sorted = [...pitches].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const cents = pitches.map((pitch) => 1200 * Math.log2(pitch / median)).filter(Number.isFinite);
  const mean = cents.reduce((sum, value) => sum + value, 0) / cents.length;
  const variance = cents.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / cents.length;
  return clampFixScore(Math.sqrt(variance) / 120);
}

function getFixActiveFrames(frames) {
  const source = Array.isArray(frames) ? frames : [];
  const voiced = source.filter((frame) => Number.isFinite(frame?.rms) && frame.rms > 0.01);
  return voiced.length >= 4 ? voiced : source;
}

function getFixProblemCatalog() {
  return {
    breathiness: {
      key: 'breathiness',
      label: '控制气息',
      issueCopy: '你的声音现在会有一点漏气。',
      metricLabel: '漏气指标',
      exerciseTitle: '用 “ma”',
      exerciseCopy: '重复 30 秒',
      taskLine: '唱这一句时，让气息像一条线，不要散出去。',
      focusPoint: '重点：不要唱更大声，只让声音更集中。',
      explanation: [
        '这句里，声音有一点散，像气漏出来了。',
        '所以先不追求更大声，只练让声音集中。',
        '用 “ma” 更容易听出气息有没有散掉。',
      ],
      doneLabel: '气息控制',
    },
    pitch: {
      key: 'pitch',
      label: '稳住音高',
      issueCopy: '你的声音现在会轻微漂移。',
      metricLabel: '音高波动',
      exerciseTitle: '用 “ng-ma”',
      exerciseCopy: '重复 30 秒',
      taskLine: '唱这一句时，让音高保持像一条直线。',
      focusPoint: '重点：不要追求更高，只追求稳定。',
      explanation: [
        '这句里，音会轻微上下漂。',
        '所以先不追求音色，只练把音保持稳定。',
        '用 “ng-ma” 可以帮助你找到更稳定的位置。',
      ],
      doneLabel: '音高稳定',
    },
    focus: {
      key: 'focus',
      label: '找到共鸣位置',
      issueCopy: '你的声音现在有一点分散。',
      metricLabel: '分散指标',
      exerciseTitle: '用 “mi”',
      exerciseCopy: '重复 30 秒',
      taskLine: '唱这一句时，把声音收在一个更靠前的位置。',
      focusPoint: '重点：不要挤嗓子，只让声音更靠前。',
      explanation: [
        '这句里，声音听起来有点闷。',
        '所以先练让声音更亮、更靠前。',
        '用 “mi” 可以帮助你找到更清晰的位置。',
      ],
      doneLabel: '共鸣位置',
    },
  };
}

function analyzeFixOneThingRecording(frames = recordingTimelineFrames) {
  const activeFrames = getFixActiveFrames(frames);
  const highFrequencyRatio = averageFixMetric(activeFrames, 'highFrequencyRatio');
  const zcr = averageFixMetric(activeFrames, 'zcr');
  const spectralFlatness = averageFixMetric(activeFrames, 'spectralFlatness');
  const waveformRoughness = averageFixMetric(activeFrames, 'waveformRoughness');
  const pitchWobble = getFixPitchWobble(activeFrames);
  const breathiness = clampFixScore((highFrequencyRatio * 3.2) + (zcr * 2.2) + (spectralFlatness * 0.55));
  const focus = clampFixScore((spectralFlatness * 0.72) + (waveformRoughness * 0.62));
  const catalog = getFixProblemCatalog();
  const metrics = {
    breathiness,
    pitch: pitchWobble,
    focus,
  };
  const candidates = Object.keys(metrics)
    .map((key) => ({
      ...catalog[key],
      score: metrics[key],
    }))
    .sort((a, b) => b.score - a.score);
  return {
    focus: candidates[0] || { ...catalog.pitch, score: 0 },
    metrics,
    frameCount: activeFrames.length,
    durationMs: activeFrames.length ? activeFrames[activeFrames.length - 1].timeMs - activeFrames[0].timeMs : 0,
  };
}

function setFixText(element, text) {
  if (element) {
    element.textContent = text;
  }
}

function ensureFixTrainingUi() {
  if (!fixOneThingPanel) {
    return {};
  }

  const focusCard = fixOneThingPanel.querySelector('.fix-focus-card');
  const exerciseCard = fixOneThingPanel.querySelector('.fix-exercise-card');
  const oldImpactRow = fixOneThingPanel.querySelector('.fix-impact-row');
  if (oldImpactRow) {
    oldImpactRow.className = 'fix-task-directive';
    const label = oldImpactRow.querySelector('span');
    setFixText(label, '完成这个任务');
  }

  let taskReason = document.getElementById('fixOneThingTaskReason');
  if (!taskReason && focusCard && fixOneThingProblem) {
    taskReason = document.createElement('p');
    taskReason.id = 'fixOneThingTaskReason';
    fixOneThingProblem.insertAdjacentElement('afterend', taskReason);
  }

  let focusPoint = document.getElementById('fixOneThingFocusPoint');
  if (!focusPoint && exerciseCard) {
    focusPoint = document.createElement('strong');
    focusPoint.id = 'fixOneThingFocusPoint';
    focusPoint.className = 'fix-focus-point';
    exerciseCard.appendChild(focusPoint);
  }

  let whyCard = document.getElementById('fixOneThingWhyCard');
  if (!whyCard && focusCard && exerciseCard) {
    whyCard = document.createElement('section');
    whyCard.id = 'fixOneThingWhyCard';
    whyCard.className = 'why-this-task-card';
    whyCard.innerHTML = `
      <span class="label">为什么先练这个？</span>
      <p id="fixOneThingWhyLine1">先录一句，Mira 会解释为什么选这个任务。</p>
      <p id="fixOneThingWhyLine2">解释只会围绕当前任务。</p>
      <p id="fixOneThingWhyLine3">不会推荐第二个练习。</p>
    `;
    focusCard.insertAdjacentElement('afterend', whyCard);
  }

  let activeCard = document.getElementById('fixOneThingActiveCard');
  if (!activeCard && exerciseCard) {
    activeCard = document.createElement('div');
    activeCard.id = 'fixOneThingActiveCard';
    activeCard.className = 'fix-active-card';
    activeCard.hidden = true;
    activeCard.innerHTML = `
      <span class="label">训练中</span>
      <strong id="fixOneThingActiveTarget">当前目标：--</strong>
      <span id="fixOneThingCountdown" class="fix-countdown">剩余：30秒</span>
    `;
    exerciseCard.insertAdjacentElement('afterend', activeCard);
  }

  return {
    taskReason,
    taskLine: fixOneThingImpact,
    whyCard,
    whyLines: [
      document.getElementById('fixOneThingWhyLine1'),
      document.getElementById('fixOneThingWhyLine2'),
      document.getElementById('fixOneThingWhyLine3'),
    ],
    focusPoint,
    activeCard,
    activeTarget: document.getElementById('fixOneThingActiveTarget'),
    countdown: document.getElementById('fixOneThingCountdown'),
  };
}

function renderFixEvidence(analysis) {
  const metrics = analysis?.metrics || {};
  setFixText(fixEvidenceBreathiness, formatFixScore(metrics.breathiness));
  setFixText(fixEvidencePitch, formatFixScore(1 - (metrics.pitch ?? 0)));
  setFixText(fixEvidenceFocus, formatFixScore(1 - (metrics.focus ?? 0)));
}

function renderFixResult() {
  const result = fixOneThingState.result;
  if (fixOneThingResultCard) {
    fixOneThingResultCard.hidden = !result;
  }
  if (!result) {
    setFixText(fixOneThingMetricName, '--');
    setFixText(fixOneThingMetricBefore, '--');
    setFixText(fixOneThingMetricAfter, '--');
    setFixText(fixOneThingImprovement, '练习后会自动比较这一项有没有进步。');
    setFixText(fixOneThingXp, 'XP +0');
    return;
  }
  setFixText(fixOneThingMetricName, result.metricLabel);
  setFixText(fixOneThingMetricBefore, formatFixScore(result.beforeScore));
  setFixText(fixOneThingMetricAfter, formatFixScore(result.afterScore));
  if (result.success) {
    const comboText = result.combo > 1 ? ` Combo x${result.combo}` : '';
    setFixText(fixOneThingImprovement, `改善：↑ ${Math.round(result.improvement * 100)}%。任务完成！${comboText}`);
  } else {
    setFixText(fixOneThingImprovement, '这次还没有明显改善。再试一次。');
  }
  setFixText(fixOneThingXp, `XP +${result.xp}`);
}

function renderFixOneThingFlow() {
  const ui = ensureFixTrainingUi();
  const phase = fixOneThingState.phase;
  const focus = fixOneThingState.focus;
  const isRecording = Boolean(mediaRecorder && mediaRecorder.state !== 'inactive');
  const hasTask = Boolean(focus);
  const problemText = focus?.label || '等待生成任务';
  const reasonText = focus?.issueCopy || '先完成第一句录音。';
  const taskLine = focus?.taskLine || '唱这一句时，只盯一个动作。';
  const exerciseTitle = focus?.exerciseTitle || '先完成第一句录音';
  const exerciseCopy = focus?.exerciseCopy || 'Mira 会根据这一句生成 30 秒练习任务。';
  const focusPoint = focus?.focusPoint || '重点：只追求一个动作变好。';
  const explanation = focus?.explanation || [
    '先唱一句，Mira 会判断哪个动作最值得先练。',
    '解释只会围绕当前任务。',
    '不会推荐第二个练习。',
  ];

  let stageTitle = '先唱一句';
  let stageCopy = '录一句 5-15 秒的声音，Mira 会把它变成一个清楚的训练任务。';
  let primaryText = '录制第一句';

  if (phase === 'recording-before') {
    stageTitle = '正在听第一句';
    stageCopy = '唱完后点停止，Mira 会把分析结果收敛成一个任务。';
    primaryText = '停止并生成任务';
  } else if (phase === 'analysis-ready') {
    stageTitle = '本轮只做这一件事';
    stageCopy = '先不要管其它问题，照着任务唱 30 秒。';
    primaryText = '开始练习录音';
  } else if (phase === 'recording-after') {
    stageTitle = '训练中';
    stageCopy = `当前目标：${focus?.label || '--'}。剩余 ${fixOneThingState.remainingSeconds} 秒。`;
    primaryText = '停止并比较';
  } else if (phase === 'complete') {
    stageTitle = fixOneThingState.result?.success ? '任务完成' : '再试一次';
    stageCopy = fixOneThingState.result?.success
      ? '这一轮已经闭环。'
      : '没有惩罚，保持同一个任务再唱一次。';
    primaryText = fixOneThingState.result?.success ? '再练一轮' : '再试一次';
  }

  if (isRecording && (phase === 'recording-before' || phase === 'recording-after')) {
    primaryText = '停止录音';
  }

  setFixText(fixOneThingPanel.querySelector('.fix-stage-card .label'), '现在要做什么');
  setFixText(fixOneThingPanel.querySelector('.fix-focus-card .label'), '本轮任务');
  setFixText(fixOneThingPanel.querySelector('.fix-exercise-card .label'), '练习');
  setFixText(fixOneThingPanel.querySelector('.fix-evidence-panel summary span'), '高级分析');
  setFixText(fixOneThingPanel.querySelector('.fix-evidence-panel summary small'), '频率、波形、时间轴保留在这里');
  setFixText(fixOneThingStageTitle, stageTitle);
  setFixText(fixOneThingStageCopy, stageCopy);
  setFixText(fixOneThingProblem, problemText);
  setFixText(ui.taskReason, reasonText);
  setFixText(ui.taskLine, taskLine);
  ui.whyLines?.forEach((line, index) => {
    const text = explanation[index] || '';
    setFixText(line, text);
    if (line) {
      line.hidden = !text;
    }
  });
  setFixText(fixOneThingExerciseTitle, phase === 'recording-after' ? `当前动作：${exerciseTitle}` : exerciseTitle);
  setFixText(
    fixOneThingExerciseCopy,
    phase === 'recording-after'
      ? `${exerciseCopy}。只做这一件事，听到停止后等待比较。`
      : exerciseCopy
  );
  setFixText(fixOneThingDuration, phase === 'recording-after' ? `剩余：${fixOneThingState.remainingSeconds}秒` : (hasTask ? '重复 30 秒' : '30 秒任务'));
  setFixText(ui.focusPoint, focusPoint);
  setFixText(fixOneThingPrimaryButton, primaryText);
  if (ui.activeCard) {
    ui.activeCard.hidden = true;
  }
  setFixText(ui.activeTarget, `当前目标：${focus?.label || '--'}`);
  setFixText(ui.countdown, `剩余：${fixOneThingState.remainingSeconds}秒`);
  renderFixEvidence(fixOneThingState.after || fixOneThingState.before);
  renderFixResult();
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
  const nextPhase = fixOneThingState.before && fixOneThingState.focus ? 'recording-after' : 'recording-before';
  fixOneThingState.phase = nextPhase;
  fixOneThingState.after = null;
  fixOneThingState.result = null;
  if (nextPhase === 'recording-after') {
    fixOneThingState.remainingSeconds = FIX_ONE_THING_DURATION_SECONDS;
  } else {
    stopFixOneThingTimer();
  }
  renderFixOneThingFlow();
  try {
    await startVoiceRecording();
    if (nextPhase === 'recording-after') {
      startFixOneThingTimer();
    }
  } catch (error) {
    stopFixOneThingTimer();
    fixOneThingState.phase = fixOneThingState.before ? 'analysis-ready' : 'idle';
    renderFixOneThingFlow();
    throw error;
  }
}

function resetFixOneThingFlow() {
  stopFixOneThingTimer();
  fixOneThingState = {
    phase: 'idle',
    focus: null,
    before: null,
    after: null,
    result: null,
    combo: loadFixOneThingCombo(),
    remainingSeconds: FIX_ONE_THING_DURATION_SECONDS,
  };
  renderFixOneThingFlow();
}

function finishFixOneThingRound(afterAnalysis) {
  const beforeScore = fixOneThingState.before?.metrics?.[fixOneThingState.focus.key] ?? 0;
  const afterScore = afterAnalysis.metrics?.[fixOneThingState.focus.key] ?? 0;
  const improvement = beforeScore > 0 ? Math.max(0, (beforeScore - afterScore) / beforeScore) : 0;
  const success = improvement >= 0.08;
  const nextCombo = success ? Math.min(4, fixOneThingState.combo + 1 || 1) : 0;
  const baseXp = success ? Math.round(10 + Math.min(0.8, improvement) * 50) : 0;
  const xp = success ? Math.min(50, Math.round(baseXp * Math.max(1, nextCombo))) : 0;
  const result = {
    problem: fixOneThingState.focus.key,
    metricLabel: fixOneThingState.focus.metricLabel,
    beforeScore,
    afterScore,
    improvement,
    success,
    combo: nextCombo,
    xp,
  };
  fixOneThingState.combo = nextCombo;
  fixOneThingState.result = result;
  saveFixOneThingCombo(nextCombo);

  if (success) {
    saveFixTodayCompleted([...loadFixTodayCompleted(), fixOneThingState.focus.key]);
    saveFixOneThingSample({
      id: `${Date.now()}-${fixOneThingState.focus.key}`,
      createdAt: new Date().toISOString(),
      problem: fixOneThingState.focus.key,
      problem_label: fixOneThingState.focus.label,
      exercise: fixOneThingState.focus.exerciseTitle,
      suggestion: fixOneThingState.focus.taskLine,
      before_score: Number(beforeScore.toFixed(4)),
      after_score: Number(afterScore.toFixed(4)),
      improvement: Number(improvement.toFixed(4)),
      xp,
      before_recording_saved: true,
      after_recording_saved: true,
    });
    if (typeof recordFixOneThingReward === 'function') {
      recordFixOneThingReward({
        xp,
        score: Math.round(Math.min(100, improvement * 125)),
        summary: `${fixOneThingState.focus.doneLabel} 改善 ${Math.round(improvement * 100)}%`,
      });
    }
  }
}

function onFixOneThingRecordingStopped() {
  stopFixOneThingTimer();
  const analysis = analyzeFixOneThingRecording(recordingTimelineFrames);
  if (fixOneThingState.phase === 'recording-before') {
    fixOneThingState.before = analysis;
    fixOneThingState.focus = analysis.focus;
    fixOneThingState.phase = 'analysis-ready';
  } else if (fixOneThingState.phase === 'recording-after') {
    fixOneThingState.after = analysis;
    finishFixOneThingRound(analysis);
    fixOneThingState.phase = 'complete';
  }
  renderFixOneThingFlow();
}

fixOneThingPrimaryButton?.addEventListener('click', () => {
  if (fixOneThingState.phase === 'complete' && fixOneThingState.result?.success) {
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
