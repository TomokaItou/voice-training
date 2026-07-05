let aiTeacherState = {
  phase: 'idle',
  activeTaskIndex: 0,
  activeAttempt: 1,
  targetTaskId: null,
  vectorsBefore: [],
  vectorsAfter: [],
  recordings: {},
  estimatesBefore: [],
  estimatesAfter: [],
  selectedEstimate: null,
  comparison: null,
  memoryRecords: [],
  currentMemoryRecords: [],
  latestTrend: null,
  latestHypotheses: [],
  latestDiary: '',
  latestResearchSnapshot: null,
  teacherAction: null,
  currentTeachingDecision: null,
  teachingHistory: [],
  closedLoopMode: true,
  lessonMode: true,
  lessonStep: 'probe',
  lessonState: null,
  transferLevel: 'humming',
  latestLessonDecision: null,
  successMemories: [],
  latestSuccessMemory: null,
  songFirstMode: false,
  songSegmentName: '',
  songRequirement: null,
  songPrimitiveTask: null,
  shortProbeTaskId: 'sustained_a',
  bestByTask: {},
  worstByTask: {},
  lastFeedback: null,
  recorder: null,
  stream: null,
  chunks: [],
  timer: null,
  playbackAudio: null,
};

function aiTeacherFormatScore(value) {
  if (!Number.isFinite(value)) return '--';
  return value >= 100 ? value.toFixed(0) : value.toFixed(3);
}

function aiTeacherFeatureLabel(name) {
  const labels = {
    pitch_mean: '平均音高',
    pitch_std: '音高稳定度',
    loudness_mean: '平均音量',
    loudness_std: '音量稳定度',
    spectral_centroid_mean: '声音明亮度',
    spectral_tilt_mean: '声谱倾斜',
    harmonicity_mean: '声带振动稳定度',
  };
  return labels[name] || name;
}

function aiTeacherFeatureValue(vectorOrFeatures, key, fallback = 0) {
  const features = vectorOrFeatures?.features || vectorOrFeatures || {};
  const value = features[key];
  return Number.isFinite(value) ? value : fallback;
}

function aiTeacherConfidenceLevel(value, historyCount = 0) {
  const numeric = Number.isFinite(value) ? value : 0;
  if (numeric >= 72 || historyCount >= 3) return '高';
  if (numeric >= 45 || historyCount >= 1) return '中';
  return '低';
}

function aiTeacherExperimentMetricForFocus(focusArea) {
  if (focusArea === 'pitch') return 'pitch_std';
  if (focusArea === 'breath') return 'loudness_std';
  if (focusArea === 'closure') return 'harmonicity_mean';
  if (focusArea === 'resonance') return 'spectral_centroid_mean';
  return 'pitch_std';
}

function aiTeacherMetricDirection(metric) {
  return metric === 'harmonicity_mean' ? 'increase' : 'decrease';
}

function aiTeacherMetricImproved(metric, beforeValue, afterValue) {
  if (!Number.isFinite(beforeValue) || !Number.isFinite(afterValue)) return false;
  if (aiTeacherMetricDirection(metric) === 'increase') {
    return afterValue > beforeValue + Math.max(0.03, Math.abs(beforeValue) * 0.04);
  }
  return afterValue < beforeValue - Math.max(0.8, Math.abs(beforeValue) * 0.05);
}

function aiTeacherMetricChangeText(metric, beforeValue, afterValue) {
  const label = aiTeacherFeatureLabel(metric);
  if (!Number.isFinite(beforeValue) || !Number.isFinite(afterValue)) {
    return `${label} 暂时没有足够数据。`;
  }
  const delta = afterValue - beforeValue;
  const direction = delta > 0 ? '上升' : delta < 0 ? '下降' : '几乎不变';
  return `${label}${direction} ${Math.abs(delta).toFixed(2)}。`;
}

function aiTeacherBuildExperimentEvidence(focusArea, vectorOrEstimate, history = []) {
  const pitchStd = aiTeacherFeatureValue(vectorOrEstimate, 'pitch_std');
  const loudnessStd = aiTeacherFeatureValue(vectorOrEstimate, 'loudness_std');
  const harmonicity = aiTeacherFeatureValue(vectorOrEstimate, 'harmonicity_mean', 0.7);
  const centroid = aiTeacherFeatureValue(vectorOrEstimate, 'spectral_centroid_mean');
  const dominant = vectorOrEstimate?.dominantFeatures || [];
  const observations = [];
  if (focusArea === 'pitch') {
    observations.push(pitchStd > 18 ? '本次录音里音高抖动偏大。' : '音高抖动是当前最值得验证的变化方向。');
    if (dominant.some((name) => /pitch/.test(name))) observations.push('主导变化特征集中在音高相关指标。');
  } else if (focusArea === 'breath') {
    observations.push(loudnessStd > 5 ? '本次录音里能量起伏偏大，听起来容易忽强忽弱。' : '能量稳定性是当前最值得验证的变化方向。');
    if (dominant.some((name) => /loudness/.test(name))) observations.push('主导变化特征集中在音量/气流相关指标。');
  } else if (focusArea === 'closure') {
    observations.push(harmonicity < 0.62 ? '本次录音里声带振动稳定度偏低，可能有一点漏气或声音核心不稳。' : '声带振动稳定度是当前最值得验证的变化方向。');
    if (pitchStd > 16) observations.push('音高稳定度也被带着变差，像是发声状态先不稳。');
  } else if (focusArea === 'resonance') {
    observations.push(centroid > 0 ? '本次录音里声音明亮度变化明显，亮暗不够一致。' : '声音明亮度/音色稳定性是当前最值得验证的方向。');
    if (dominant.some((name) => /spectral|formant/.test(name))) observations.push('主导变化特征集中在声谱或元音形状相关指标。');
  } else {
    observations.push('本次录音的整体稳定性还不够集中，先用最简单的任务验证。');
  }
  const samePattern = history.filter((record) => record?.focusArea === focusArea || record?.focus_area === focusArea).length;
  if (samePattern > 0) observations.push(`历史里也出现过 ${samePattern} 次相近模式。`);
  return observations.slice(0, 3);
}

function aiTeacherBuildExperimentFeedback({ estimate, action, decision, lesson, lastChange, currentExercise }) {
  const focusArea = decision?.focusArea || estimate?.category || lesson?.last_change?.focusArea || 'global';
  const metric = aiTeacherExperimentMetricForFocus(focusArea);
  const confidenceLevel = aiTeacherConfidenceLevel(decision?.hiddenDetails?.confidence || estimate?.confidence || 0, (lesson?.attempts || []).length - 1);
  const exercise = currentExercise || lesson?.current_exercise || lesson?.currentExercise || (decision?.exerciseId ? getAiTeacherExerciseById(decision.exerciseId) : null);
  const cue = lesson?.active_cue || lesson?.activeCue;
  const evidence = aiTeacherBuildExperimentEvidence(focusArea, lesson?.baseline_vector || estimate, aiTeacherState.teachingHistory || []);
  const hypothesisByFocus = {
    pitch: '你这次最可能不是“不会唱这个音”，而是音高落点还不够稳定。',
    breath: '你这次最可能是气流/音量输出不够均匀，而不是单纯音准问题。',
    closure: '你这次最可能是声音核心还没有稳定合上，所以高音或长音会被气声带走。',
    resonance: '你这次最可能是元音形状或音色亮度变化太大，导致声音听起来不够集中。',
    global: '我还不能完全确定主因，先验证最基础的稳定性。',
  };
  const predictionByMetric = {
    pitch_std: '如果这个方向对，下一次同样任务的音高抖动应该下降。',
    loudness_std: '如果这个方向对，下一次同样任务的能量起伏应该下降。',
    harmonicity_mean: '如果这个方向对，下一次同样任务的声带振动稳定度应该上升。',
    spectral_centroid_mean: '如果这个方向对，下一次同样任务的亮暗变化应该更小。',
  };
  const taskByFocus = {
    pitch: '只重唱同一个短音，音量不变，先让落点更接近同一个音高。',
    breath: '只重唱同一个短音，音量不要变大，把声音唱成更平的一条线。',
    closure: '只做一次轻 gee 或当前练习，声音小一点，听它能不能更集中。',
    resonance: '只做一次 ng 到 ma 或当前练习，不变大声，看亮暗能不能更一致。',
    global: '只重复当前最简单任务一次，不加其它技巧。',
  };
  const previousVerification = lastChange
    ? (lastChange.improved || lastChange.best_so_far
      ? `上一轮预测基本成立：${aiTeacherMetricChangeText(metric, lastChange.previousScore, lastChange.currentScore)}`
      : `上一轮还没验证成功：${aiTeacherMetricChangeText(metric, lastChange.previousScore, lastChange.currentScore)} 我会换更小的任务验证。`)
    : '';
  return {
    id: `vocal-experiment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    recordingId: lesson?.attempts?.slice(-1)[0]?.recordingId || lesson?.lesson_id || null,
    focusArea,
    metric,
    hypothesis: hypothesisByFocus[focusArea] || hypothesisByFocus.global,
    evidence,
    prediction: predictionByMetric[metric] || predictionByMetric.pitch_std,
    verificationTask: cue?.text
      ? `这一次只验证一个问题：${cue.text} 做 ${exercise?.repetitions || action?.practiceRepetitions || 3} 次，然后复测同一个短任务。`
      : taskByFocus[focusArea] || taskByFocus.global,
    confidenceLevel,
    previousVerification,
    measuredBefore: lesson?.baseline_vector?.features || estimate?.mean || {},
    measuredAfter: null,
    verificationResult: lastChange
      ? (lastChange.improved || lastChange.best_so_far ? '验证成功' : lastChange.worse ? '验证失败' : '暂未验证')
      : '等待验证',
    nextHypothesis: null,
  };
}

function aiTeacherRenderExperimentCard(experiment) {
  if (!experiment) return '';
  const evidenceItems = (experiment.evidence || []).map((item) => `<li>${item}</li>`).join('');
  return `
    <div class="ai-teacher-experiment-card">
      <div class="ai-teacher-experiment-row">
        <span>假设</span>
        <p>${experiment.hypothesis}</p>
      </div>
      <div class="ai-teacher-experiment-row">
        <span>证据</span>
        <p>${(experiment.evidence || [])[0] || '这次证据还不够集中，所以只做一次小验证。'}</p>
      </div>
      <div class="ai-teacher-experiment-row">
        <span>预测</span>
        <p>${experiment.prediction}</p>
      </div>
      <div class="ai-teacher-experiment-row">
        <span>验证任务</span>
        <p>${experiment.verificationTask}</p>
      </div>
      <details class="ai-teacher-credibility">
        <summary>这条建议为什么可信？</summary>
        <ul>
          ${evidenceItems}
          <li>AI 当前可信度：${experiment.confidenceLevel}</li>
          <li>下一次录音要验证：${aiTeacherFeatureLabel(experiment.metric)} 是否按预测改善。</li>
          ${experiment.previousVerification ? `<li>${experiment.previousVerification}</li>` : ''}
        </ul>
      </details>
    </div>
  `;
}

function aiTeacherBuildVerificationSummary(experiment, result, lesson) {
  if (!experiment) return null;
  const change = result?.lessonChange || lesson?.last_change;
  const beforeValue = Number.isFinite(change?.previousScore)
    ? change.previousScore
    : Number.isFinite(result?.beforeInstability)
      ? result.beforeInstability
      : null;
  const afterValue = Number.isFinite(change?.currentScore)
    ? change.currentScore
    : Number.isFinite(result?.afterInstability)
      ? result.afterInstability
      : null;
  const metricPassed = aiTeacherMetricImproved(experiment.metric, beforeValue, afterValue);
  const passed = Boolean(result?.retainedImprovement || result?.improved || change?.improved || change?.best_so_far || metricPassed);
  const failed = Boolean(result?.worsened || change?.worse);
  const status = passed ? '验证成功' : failed ? '验证失败' : '暂未验证';
  const nextHypothesis = passed
    ? '这个方向暂时有效。下一轮继续沿着同一方向，把任务再缩小一点。'
    : failed
      ? '上一条假设可能不对。下一轮我会换一个更容易验证的假设。'
      : '变化还不够明显。下一轮先降低难度，再确认这个假设。';
  return {
    ...experiment,
    measuredAfter: {
      metric: experiment.metric,
      beforeValue,
      afterValue,
    },
    verificationResult: status,
    nextHypothesis,
    confidenceLevel: passed
      ? (experiment.confidenceLevel === '低' ? '中' : '高')
      : failed
        ? '低'
        : experiment.confidenceLevel,
    verificationText: `${status}：${aiTeacherMetricChangeText(experiment.metric, beforeValue, afterValue)} ${nextHypothesis}`,
  };
}

async function aiTeacherSaveVocalExperiment(experiment) {
  if (!experiment || typeof aiTeacherSave !== 'function') return;
  try {
    await aiTeacherSave('vocalExperiments', experiment);
  } catch (error) {
    console.warn('Vocal experiment save failed', error);
  }
}

function renderAiTeacherTaskList() {
  const list = document.getElementById('aiTeacherTaskList');
  if (!list) return;
  list.innerHTML = '';
  const tasks = aiTeacherVisibleTasks();
  tasks.forEach((task, index) => {
    const completed = aiTeacherCurrentTaskCompleted(task);
    const isDone = completed >= task.repetitions;
    const isActive = index === aiTeacherState.activeTaskIndex && !isDone;
    const item = document.createElement('article');
    item.className = 'ai-teacher-task-item';
    item.classList.toggle('active', isActive);
    item.classList.toggle('done', isDone);
    item.classList.toggle('muted', !isActive && !isDone);
    item.innerHTML = `
      <div>
        <strong>${isDone ? '✅ ' : ''}${aiTeacherTaskCopy(task.id).short}</strong>
        <p>${isActive ? aiTeacherTaskCopy(task.id).sing : '短录音练习'}</p>
      </div>
      <span>${completed}/${task.repetitions}</span>
    `;
    list.append(item);
  });
}

function renderAiTeacherFeedback() {
  const panel = document.getElementById('aiTeacherInstantFeedback');
  if (!panel) return;
  const feedback = aiTeacherState.lastFeedback;
  panel.hidden = !feedback;
  if (!feedback) return;
  panel.innerHTML = `
    <strong>已保存</strong>
    <span>这条录音时长：${(feedback.durationMs / 1000).toFixed(1)} 秒</span>
    <span>${feedback.loudnessText}</span>
    <span>${feedback.pitchText}</span>
  `;
}

function renderAiTeacher() {
  const task = aiTeacherActiveTask();
  const total = aiTeacherExpectedAttempts();
  const completed = aiTeacherCompletedAttempts();
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const remaining = task ? aiTeacherRemainingForTask(task) : 0;
  const copy = task ? aiTeacherTaskCopy(task.id) : null;
  const isRecording = Boolean(aiTeacherState.recorder);
  const phaseStarted = aiTeacherState.phase !== 'idle' && aiTeacherState.phase !== 'complete';
  const phaseComplete = total > 0 && completed >= total;

  document.getElementById('aiTeacherPhaseLabel').textContent = aiTeacherPhaseName();
  const stepText = document.getElementById('aiTeacherStepText');
  if (stepText && aiTeacherState.lessonMode) {
    stepText.textContent = '我先听一条很短的声音。今天先别管别的，我们只做一个小练习，练完马上复测。';
  }
  document.getElementById('aiTeacherTaskName').textContent = task ? copy.title : '扫描完成';
  document.getElementById('aiTeacherTaskInstruction').textContent = task
    ? copy.sing
    : '已经录完，可以查看诊断。';
  document.getElementById('aiTeacherDurationHint').textContent = task
    ? (aiTeacherState.phase === 'after'
      ? '现在我们再录同一个任务 5 次，看看练习有没有让这个方向更稳定。'
      : '持续 2 到 4 秒')
    : '准备生成结果';
  document.getElementById('aiTeacherProgressPercent').textContent = `${progress}%`;
  document.getElementById('aiTeacherProgressFill').style.width = `${progress}%`;
  document.getElementById('aiTeacherAttemptCounter').textContent = aiTeacherState.lessonMode
    ? `本轮小课：${completed} / ${total} 条短声音`
    : `已完成 ${completed} / ${total} 条录音`;
  document.getElementById('aiTeacherRecordingIndicator').hidden = !isRecording;

  const startButton = document.getElementById('aiTeacherStartButton');
  const recordButton = document.getElementById('aiTeacherRecordButton');
  const stopButton = document.getElementById('aiTeacherStopButton');
  const analyzeButton = document.getElementById('aiTeacherAnalyzeButton');

  startButton.hidden = phaseStarted || phaseComplete;
  startButton.disabled = phaseStarted || phaseComplete;
  startButton.textContent = '开始录音';

  recordButton.hidden = !phaseStarted || phaseComplete || isRecording || Boolean(aiTeacherState.lastFeedback);
  recordButton.disabled = !phaseStarted || phaseComplete || isRecording || !task || Boolean(aiTeacherState.lastFeedback);
  recordButton.textContent = completed === 0 && aiTeacherState.phase !== 'after' ? '开始录音' : '继续录下一次';

  stopButton.hidden = !isRecording;
  stopButton.disabled = !isRecording;

  analyzeButton.hidden = !phaseComplete || isRecording || Boolean(aiTeacherState.lastFeedback);
  analyzeButton.disabled = !phaseComplete || isRecording || Boolean(aiTeacherState.lastFeedback);
  analyzeButton.textContent = aiTeacherState.phase === 'after' ? '听老师怎么说' : '听老师建议';

  if (task && !isRecording) {
    const text = remaining === task.repetitions
      ? `还需要录 ${remaining} 次`
      : remaining > 0
        ? `很好，还需要 ${remaining} 次`
        : '这个声音已经录完';
    aiTeacherSetStatus(aiTeacherState.lessonMode && completed === 0
      ? '先唱一条短声音，我听完马上给你一个练习。'
      : text);
  } else if (!task && phaseComplete) {
    aiTeacherSetStatus(aiTeacherState.phase === 'after'
      ? '我听到了。我们看这次练习有没有帮上忙。'
      : '我听到了。今天先别管别的，我们只选一个练习。');
  }

  renderAiTeacherFeedback();
  renderAiTeacherTaskList();
}

function aiTeacherSetStatus(text) {
  const status = document.getElementById('aiTeacherStatus');
  if (status) status.textContent = text;
}

function startAiTeacherPhase(phase = 'before') {
  aiTeacherState.phase = phase;
  aiTeacherState.lessonStep = phase === 'after' ? 'retest' : 'probe';
  aiTeacherState.activeTaskIndex = 0;
  aiTeacherState.activeAttempt = 1;
  aiTeacherState.lastFeedback = null;
  if (aiTeacherState.closedLoopMode && phase === 'before') {
    aiTeacherState.targetTaskId = aiTeacherState.shortProbeTaskId || 'sustained_a';
  }
  aiTeacherSetStatus(
    phase === 'after'
      ? '现在录同一个声音一次。不要加新技巧，只带着刚才练习的感觉。'
      : '第一步：唱一条 2 到 4 秒的短声音，我先听。'
  );
  renderAiTeacher();
}

function scoreAiTeacherAttempt(vector) {
  const features = vector.features || {};
  const pitchStd = Number.isFinite(features.pitch_std) ? features.pitch_std : 999;
  const loudnessStd = Number.isFinite(features.loudness_std) ? features.loudness_std : 20;
  const duration = (vector.durationMs || 0) / 1000;
  const durationPenalty = duration >= 2 && duration <= 4 ? 0 : Math.abs(duration - 3) * 20;
  const loudnessPenalty = loudnessStd >= 0.5 && loudnessStd <= 8 ? loudnessStd * 0.5 : loudnessStd * 1.6;
  return pitchStd * 2 + loudnessPenalty + durationPenalty;
}

function computeAiTeacherBestWorst(vectors) {
  const bestByTask = {};
  const worstByTask = {};
  AI_VOCAL_TEACHER_TASKS.forEach((task) => {
    const taskVectors = vectors.filter((vector) => vector.taskId === task.id);
    if (!taskVectors.length) return;
    const ranked = taskVectors
      .map((vector) => ({ vector, score: scoreAiTeacherAttempt(vector) }))
      .sort((left, right) => left.score - right.score);
    bestByTask[task.id] = ranked[0].vector;
    worstByTask[task.id] = ranked[ranked.length - 1].vector;
  });
  return { bestByTask, worstByTask };
}

async function analyzeAiTeacherPhase() {
  if (aiTeacherState.closedLoopMode) {
    await analyzeAiTeacherClosedLoopPhase();
    return;
  }
  const phase = aiTeacherState.phase === 'after' ? 'after' : 'before';
  const vectors = phase === 'after' ? aiTeacherState.vectorsAfter : aiTeacherState.vectorsBefore;
  const rawEstimates = estimateAiTeacherMemoryByTask(vectors);
  const estimates = rawEstimates.map((estimate) => enrichAiTeacherEstimate(estimate, {
    vectors,
    sampleCount: vectors.filter((vector) => vector.taskId === estimate.taskId).length,
    historyCount: aiTeacherState.memoryRecords.filter((record) => record.taskId === estimate.taskId).length,
  }));
  const stored = {
    id: `estimate-${phase}-${Date.now()}`,
    phase,
    createdAt: new Date().toISOString(),
    estimates,
  };
  await aiTeacherSave('estimates', stored);
  const memoryRecords = aiTeacherCreateMemoryRecords({
    phase,
    estimates,
    vectors,
    sessionId: aiTeacherCurrentSessionId,
  });
  aiTeacherState.memoryRecords = aiTeacherAppendMemoryRecords(aiTeacherState.memoryRecords, memoryRecords);
  aiTeacherState.currentMemoryRecords = memoryRecords;
  await aiTeacherSaveMany('memoryRecords', memoryRecords);

  if (phase === 'after') {
    aiTeacherState.estimatesAfter = estimates;
    aiTeacherState.comparison = compareAiTeacherBeforeAfter(
      aiTeacherState.targetTaskId,
      aiTeacherState.estimatesBefore,
      aiTeacherState.estimatesAfter
    );
    await aiTeacherSave('comparisons', {
      id: `comparison-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...aiTeacherState.comparison,
    });
    await saveAiTeacherTeachingSession(aiTeacherState.comparison);
    aiTeacherState.latestTrend = aiTeacherTrendForEstimate(
      aiTeacherState.estimatesBefore.find((estimate) => estimate.taskId === aiTeacherState.targetTaskId) || estimates[0],
      aiTeacherState.memoryRecords
    );
    aiTeacherState.latestDiary = aiTeacherBuildTeacherDiary({
      selectedEstimate: aiTeacherState.selectedEstimate,
      trend: aiTeacherState.latestTrend,
      comparison: aiTeacherState.comparison,
      bestTeaching: aiTeacherBuildBestAttemptTeaching(aiTeacherState.bestByTask[aiTeacherState.targetTaskId]),
      memoryRecords: aiTeacherState.memoryRecords,
    });
    aiTeacherState.phase = 'complete';
    renderAiTeacherResults();
    renderAiTeacherComparison();
  } else {
    aiTeacherState.estimatesBefore = estimates;
    aiTeacherState.selectedEstimate = estimates
      .slice()
      .sort((left, right) => right.instabilityScore - left.instabilityScore)[0] || null;
    aiTeacherState.targetTaskId = aiTeacherState.selectedEstimate?.taskId || null;
    const bestWorst = computeAiTeacherBestWorst(aiTeacherState.vectorsBefore);
    aiTeacherState.bestByTask = bestWorst.bestByTask;
    aiTeacherState.worstByTask = bestWorst.worstByTask;
    aiTeacherState.latestTrend = aiTeacherTrendForEstimate(aiTeacherState.selectedEstimate, aiTeacherState.memoryRecords);
    aiTeacherState.latestHypotheses = aiTeacherBuildHypotheses(aiTeacherState.selectedEstimate);
    aiTeacherState.teacherAction = generateTeacherAction(aiTeacherState.selectedEstimate, {
      memoryRecords: aiTeacherState.memoryRecords,
      teachingHistory: aiTeacherState.teachingHistory,
      trend: aiTeacherState.latestTrend,
    });
    aiTeacherState.currentTeachingDecision = aiTeacherState.teacherAction.teachingDecision;
    aiTeacherState.latestDiary = aiTeacherBuildTeacherDiary({
      selectedEstimate: aiTeacherState.selectedEstimate,
      trend: aiTeacherState.latestTrend,
      comparison: null,
      bestTeaching: aiTeacherBuildBestAttemptTeaching(aiTeacherState.bestByTask[aiTeacherState.targetTaskId]),
      memoryRecords: aiTeacherState.memoryRecords,
    });
    aiTeacherState.latestResearchSnapshot = aiTeacherBuildResearchSnapshot(aiTeacherState.selectedEstimate);
    renderAiTeacherResults();
  }
  renderAiTeacher();
}

function getAiTeacherTaskLabel(taskId) {
  return aiTeacherTaskCopy(taskId).short || AI_VOCAL_TEACHER_TASKS.find((task) => task.id === taskId)?.name || taskId;
}

function personalizeAiTeacherDiagnosis(estimate) {
  const features = estimate?.dominantFeatures || [];
  const text = features.join(' ');
  if (/pitch_mean|pitch_std/.test(text)) {
    return '我发现这组声音里，最不稳定的是音高方向。';
  }
  if (/loudness_mean|loudness_std/.test(text)) {
    return '我发现这组声音里，最不稳定的是音量和气息稳定性。';
  }
  if (/spectral_centroid|spectral_tilt|formant/.test(text)) {
    return '我发现这组声音里，最容易变化的是共鸣或元音形状。';
  }
  if (/hnr|harmonicity/.test(text)) {
    return '我发现这组声音里，声带闭合和振动稳定性变化比较明显。';
  }
  return '我发现这组声音的整体状态还不够可复现，我们先做一个更小的练习。';
}

function personalizeAiTeacherRecommendation(estimate) {
  const features = estimate?.dominantFeatures || [];
  const text = features.join(' ');
  if (/pitch_mean|pitch_std/.test(text)) {
    return '我们先不用唱整首歌。接下来试试：稳定音高保持 3 秒，轻轻开始，轻轻结束。';
  }
  if (/loudness_mean|loudness_std/.test(text)) {
    return '我们先做一个更小的练习：同一个元音，从轻声慢慢到正常音量，保持气流不断。';
  }
  if (/spectral_centroid|spectral_tilt|formant/.test(text)) {
    return '接下来试试：/a/ → /i/ → /u/ 慢慢转换，音高和音量都不要变。';
  }
  if (/hnr|harmonicity/.test(text)) {
    return '接下来试试：轻微 creaky onset，然后打开到自然元音；如果累，就改成轻哼。';
  }
  return '接下来重复最容易的一条，听最好和最不稳定的差别，再模仿最好的一次。';
}

function aiTeacherMemoryBar(score) {
  const filled = Math.round(Math.max(0, Math.min(100, score)) / 12.5);
  return `${'█'.repeat(filled)}${'░'.repeat(8 - filled)}`;
}

function renderAiTeacherMemoryDashboard() {
  const bars = document.getElementById('aiTeacherMemoryBars');
  const timeline = document.getElementById('aiTeacherMemoryTimeline');
  if (bars) {
    bars.innerHTML = '';
    aiTeacherBuildMemoryDashboard(aiTeacherState.memoryRecords).forEach((item) => {
      const row = document.createElement('div');
      row.className = 'ai-teacher-memory-row';
      row.innerHTML = `
        <span>${item.label}</span>
        <strong>${aiTeacherMemoryBar(item.score)}</strong>
        <small>${item.score}%</small>
      `;
      bars.append(row);
    });
  }
  if (timeline) {
    const days = aiTeacherBuildTimeline(aiTeacherState.memoryRecords).slice(-6);
    timeline.innerHTML = days.length
      ? days.map((day) => `<span>${day.day}<small>${aiTeacherFormatScore(day.averageInstability)}</small></span>`).join('<b>↓</b>')
      : '<span>还没有长期记录</span>';
  }
}

function renderAiTeacherHypotheses() {
  const list = document.getElementById('aiTeacherHypothesisList');
  if (!list) return;
  const hypotheses = aiTeacherState.latestHypotheses.length
    ? aiTeacherState.latestHypotheses
    : aiTeacherBuildHypotheses(aiTeacherState.selectedEstimate);
  list.innerHTML = '';
  hypotheses.forEach((hypothesis, index) => {
    const item = document.createElement('div');
    item.className = 'ai-teacher-hypothesis-item';
    item.innerHTML = `
      <span>${index + 1}. ${hypothesis.label}</span>
      <strong>${hypothesis.probability}%</strong>
    `;
    list.append(item);
  });
}

function renderAiTeacherExplainability(estimate) {
  const body = document.getElementById('aiTeacherExplainabilityBody');
  if (!body || !estimate) return;
  const explain = aiTeacherBuildExplainability(estimate);
  body.innerHTML = `
    <div>
      <strong>使用的 features</strong>
      <p>${explain.usedFeatures.map(aiTeacherFeatureLabel).join(', ')}</p>
    </div>
    <div>
      <strong>波动最大的 features</strong>
      <p>${explain.largestMovers.map(aiTeacherFeatureLabel).join(', ')}</p>
    </div>
    <div>
      <strong>最支持当前诊断的证据</strong>
      <ul>
        ${explain.support.map((item) => `
          <li>${aiTeacherFeatureLabel(item.feature)} · ${(item.importance * 100).toFixed(1)}% · ${getAiTeacherCategoryLabel(item.category)}</li>
        `).join('')}
      </ul>
    </div>
  `;
}

function renderAiTeacherResearch(estimate) {
  const json = document.getElementById('aiTeacherResearchJson');
  if (!json || !estimate) return;
  aiTeacherState.latestResearchSnapshot = aiTeacherBuildResearchSnapshot(estimate);
  json.textContent = JSON.stringify(aiTeacherState.latestResearchSnapshot, null, 2);
}

function renderAiTeacherResults() {
  const panel = document.getElementById('aiTeacherResults');
  const estimate = aiTeacherState.selectedEstimate;
  if (panel) panel.hidden = !estimate;
  if (!estimate) return;

  const best = aiTeacherState.bestByTask[estimate.taskId];
  const worst = aiTeacherState.worstByTask[estimate.taskId];
  document.getElementById('aiTeacherDominantTask').textContent = getAiTeacherTaskLabel(estimate.taskId);
  document.getElementById('aiTeacherDiagnosis').textContent = personalizeAiTeacherDiagnosis(estimate);
  document.getElementById('aiTeacherDominantScore').textContent = aiTeacherFormatScore(estimate.instabilityScore);
  document.getElementById('aiTeacherDominantFeatures').textContent = estimate.dominantFeatures.map(aiTeacherFeatureLabel).join(', ');
  document.getElementById('aiTeacherRecommendation').textContent = personalizeAiTeacherRecommendation(estimate);
  document.getElementById('aiTeacherStartReprobeButton').disabled = false;

  const bestPanel = document.getElementById('aiTeacherBestAttemptPanel');
  if (bestPanel) bestPanel.hidden = !best;
  if (best) {
    document.getElementById('aiTeacherBestAttemptText').textContent = `本轮最稳定的一次：第 ${best.attemptId} 次`;
  }
  document.getElementById('aiTeacherPlayBestButton').disabled = !best;
  document.getElementById('aiTeacherPlayWorstButton').disabled = !worst;

  const list = document.getElementById('aiTeacherEstimateList');
  if (!list) return;
  list.innerHTML = '';
  aiTeacherState.estimatesBefore.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'ai-teacher-estimate-row';
    row.innerHTML = `
      <strong>${getAiTeacherTaskLabel(item.taskId)}</strong>
      <span>${aiTeacherFormatScore(item.instabilityScore)}</span>
      <small>${item.dominantFeatures.map(aiTeacherFeatureLabel).join(', ')}</small>
    `;
    list.append(row);
  });
}

function renderAiTeacherComparison() {
  const result = aiTeacherState.comparison;
  const panel = document.getElementById('aiTeacherComparison');
  if (panel) panel.hidden = !result;
  if (!result) return;
  document.getElementById('aiTeacherComparisonTitle').textContent = result.improved
    ? '这个练习可能有效'
    : '这次还没有明显改善';
  document.getElementById('aiTeacherBeforeScore').textContent = aiTeacherFormatScore(result.beforeInstability);
  document.getElementById('aiTeacherAfterScore').textContent = aiTeacherFormatScore(result.afterInstability);
  document.getElementById('aiTeacherChangeScore').textContent = aiTeacherFormatScore(result.delta);
  document.getElementById('aiTeacherComparisonText').textContent = result.improved
    ? '这个练习可能有效，你的声音在这个方向更可复现了。'
    : '这次还没有明显改善，可能需要换一个更简单的练习。';
}

function renderAiTeacherResults() {
  const panel = document.getElementById('aiTeacherResults');
  const estimate = aiTeacherState.selectedEstimate;
  if (panel) panel.hidden = !estimate;
  if (!estimate) return;

  const best = aiTeacherState.bestByTask[estimate.taskId];
  const worst = aiTeacherState.worstByTask[estimate.taskId];
  const bestTeaching = aiTeacherBuildBestAttemptTeaching(best);
  renderAiTeacherMemoryDashboard();
  renderAiTeacherHypotheses();
  renderAiTeacherExplainability(estimate);
  renderAiTeacherResearch(estimate);

  document.getElementById('aiTeacherDiaryText').textContent =
    aiTeacherState.latestDiary || '这次训练已经记录到 Learner Memory。';
  document.getElementById('aiTeacherDominantTask').textContent = getAiTeacherTaskLabel(estimate.taskId);
  document.getElementById('aiTeacherDiagnosis').textContent = personalizeAiTeacherDiagnosis(estimate);
  document.getElementById('aiTeacherTrendText').textContent =
    aiTeacherState.latestTrend?.text || '趋势会在多次训练后出现。';
  document.getElementById('aiTeacherConfidenceScore').textContent = `${estimate.confidence || 0}%`;
  document.getElementById('aiTeacherConfidenceHint').textContent = (estimate.confidence || 0) < 50
    ? '建议继续录几次，我才能更确定。'
    : '这个判断已经有足够参考价值。';
  document.getElementById('aiTeacherDominantScore').textContent = aiTeacherFormatScore(estimate.instabilityScore);
  document.getElementById('aiTeacherDominantFeatures').textContent =
    estimate.dominantFeatures.map(aiTeacherFeatureLabel).join(', ');
  document.getElementById('aiTeacherRecommendation').textContent = personalizeAiTeacherRecommendation(estimate);
  document.getElementById('aiTeacherStartReprobeButton').disabled = false;

  const bestPanel = document.getElementById('aiTeacherBestAttemptPanel');
  if (bestPanel) bestPanel.hidden = !best;
  if (best) {
    document.getElementById('aiTeacherBestAttemptText').textContent = `本轮最稳定的一次：第 ${best.attemptId} 次`;
    document.getElementById('aiTeacherBestAttemptWhy').textContent = bestTeaching.text;
  }
  document.getElementById('aiTeacherPlayBestButton').disabled = !best;
  document.getElementById('aiTeacherPlayWorstButton').disabled = !worst;

  const list = document.getElementById('aiTeacherEstimateList');
  if (!list) return;
  list.innerHTML = '';
  aiTeacherState.estimatesBefore.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'ai-teacher-estimate-row';
    row.innerHTML = `
      <strong>${getAiTeacherTaskLabel(item.taskId)}</strong>
      <span>${aiTeacherFormatScore(item.instabilityScore)}</span>
      <small>${item.dominantFeatures.map(aiTeacherFeatureLabel).join(', ')}</small>
    `;
    list.append(row);
  });
}

function renderAiTeacherComparison() {
  const result = aiTeacherState.comparison;
  const panel = document.getElementById('aiTeacherComparison');
  if (panel) panel.hidden = !result;
  if (!result) return;
  document.getElementById('aiTeacherComparisonTitle').textContent = result.improved
    ? '这个练习可能有效'
    : '这次还没有明显改善';
  document.getElementById('aiTeacherBeforeScore').textContent = aiTeacherFormatScore(result.beforeInstability);
  document.getElementById('aiTeacherAfterScore').textContent = aiTeacherFormatScore(result.afterInstability);
  document.getElementById('aiTeacherChangeScore').textContent = aiTeacherFormatScore(result.delta);
  document.getElementById('aiTeacherComparisonText').textContent = result.improved
    ? '这个练习可能有效，你的声音在这个方向更可复现了。'
    : '这次还没有明显改善，可能需要换一个更简单的练习。';
}

async function loadAiTeacherMemory() {
  try {
    aiTeacherState.memoryRecords = (await aiTeacherLoadAll('memoryRecords'))
      .sort((left, right) => new Date(left.date) - new Date(right.date));
    aiTeacherState.teachingHistory = (await aiTeacherLoadAll('teachingSessions'))
      .sort((left, right) => new Date(left.date) - new Date(right.date));
    aiTeacherState.successMemories = (await aiTeacherLoadAll('successMemories'))
      .sort((left, right) => new Date(left.date) - new Date(right.date));
    aiTeacherState.latestSuccessMemory = aiTeacherState.successMemories[aiTeacherState.successMemories.length - 1] || null;
  } catch (error) {
    console.error(error);
    aiTeacherState.memoryRecords = [];
    aiTeacherState.teachingHistory = [];
    aiTeacherState.successMemories = [];
    aiTeacherState.latestSuccessMemory = null;
  }
}

async function saveAiTeacherTeachingSession(comparison) {
  const decision = aiTeacherState.currentTeachingDecision || aiTeacherState.teacherAction?.teachingDecision;
  if (!decision) return null;
  const lessonDecision = aiTeacherState.lessonState?.next_action;
  const nextAction = lessonDecision || (comparison?.saturated
    ? 'increase_difficulty'
    : comparison?.worsened
      ? 'decrease_difficulty'
      : comparison?.improved
        ? 'practice'
        : 'switch_exercise');
  const session = {
    id: `teaching-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    focusArea: decision.focusArea,
    exerciseId: decision.exerciseId,
    actionType: nextAction,
    transferLevel: aiTeacherState.transferLevel,
    beforeInstability: comparison?.beforeInstability,
    afterInstability: comparison?.afterInstability,
    improved: comparison?.improved,
    saturated: comparison?.saturated,
    worsened: comparison?.worsened,
    bestSoFar: comparison?.best_so_far,
    unchanged: comparison?.unchanged,
    noImprovementCount: aiTeacherState.lessonState?.no_improvement_count || comparison?.noImprovementCount || 0,
    saturationCount: aiTeacherState.lessonState?.saturation_count || comparison?.saturationCount || 0,
    confidence: decision.hiddenDetails?.confidence || 0,
    notes: aiTeacherState.lessonState?.teaching_reason || aiTeacherChooseNextLessonStep(comparison, aiTeacherState.transferLevel).message,
  };
  aiTeacherState.teachingHistory = [...aiTeacherState.teachingHistory, session].slice(-120);
  await aiTeacherSave('teachingSessions', session);
  return session;
}

async function saveAiTeacherSuccessMemory(comparison) {
  const decision = aiTeacherState.currentTeachingDecision || aiTeacherState.teacherAction?.teachingDecision;
  const exercise = getAiTeacherExerciseById(decision?.exerciseId);
  const memory = aiTeacherSuccessMemoryFromComparison(
    comparison,
    exercise,
    aiTeacherGetTransferLevel(aiTeacherState.transferLevel)
  );
  if (!memory) return null;
  aiTeacherState.latestSuccessMemory = memory;
  aiTeacherState.successMemories = [...aiTeacherState.successMemories, memory].slice(-80);
  await aiTeacherSave('successMemories', memory);
  return memory;
}

async function saveAiTeacherLessonState() {
  if (!aiTeacherState.lessonState) return;
  await aiTeacherSave('lessonStates', aiTeacherState.lessonState);
}

async function showAiVocalTeacher() {
  document.getElementById('modeLauncher')?.setAttribute('hidden', '');
  document.getElementById('libraryPage')?.setAttribute('hidden', '');
  document.getElementById('appWindow')?.setAttribute('hidden', '');
  if (typeof hideVocalMoveLibrary === 'function') hideVocalMoveLibrary();
  if (typeof hideActiveVoiceSearch === 'function') hideActiveVoiceSearch();
  if (typeof hideAiExperimentPage === 'function') hideAiExperimentPage();
  if (typeof hideAiCoursePage === 'function') hideAiCoursePage();
  if (typeof hideVocalStateKitPage === 'function') hideVocalStateKitPage();
  await loadAiTeacherMemory();
  const page = document.getElementById('aiVocalTeacherPage');
  if (page) page.hidden = false;
  renderAiTeacherMemoryDashboard();
  renderAiTeacher();
}

function hideAiVocalTeacher() {
  stopAiTeacherRecording();
  if (aiTeacherState.playbackAudio) {
    aiTeacherState.playbackAudio.pause();
    URL.revokeObjectURL(aiTeacherState.playbackAudio.src);
    aiTeacherState.playbackAudio = null;
  }
  const page = document.getElementById('aiVocalTeacherPage');
  if (page) page.hidden = true;
}

function resetAiTeacherShortRound(taskId = null) {
  aiTeacherState.vectorsBefore = [];
  aiTeacherState.vectorsAfter = [];
  aiTeacherState.estimatesBefore = [];
  aiTeacherState.estimatesAfter = [];
  aiTeacherState.selectedEstimate = null;
  aiTeacherState.comparison = null;
  aiTeacherState.lastFeedback = null;
  aiTeacherState.latestLessonDecision = null;
  aiTeacherState.teacherAction = null;
  aiTeacherState.currentTeachingDecision = null;
  aiTeacherState.targetTaskId = taskId || aiTeacherState.targetTaskId || aiTeacherState.shortProbeTaskId || 'sustained_a';
  aiTeacherState.shortProbeTaskId = aiTeacherState.targetTaskId;
}

function startAiTeacherNextLessonRound(mode = 'continue') {
  const currentDecision = aiTeacherState.currentTeachingDecision || aiTeacherState.teacherAction?.teachingDecision;
  const currentFocus = currentDecision?.focusArea || aiTeacherState.selectedEstimate?.category || 'global';
  let exercise = getAiTeacherExerciseById(currentDecision?.exerciseId) || getAiTeacherDefaultExercise(currentFocus);
  if (mode === 'simpler') {
    exercise = getAiTeacherAlternateExercise(currentFocus, exercise?.id) || getAiTeacherEasierExercise(currentFocus, exercise?.id) || getAiTeacherDefaultExercise('global');
    aiTeacherState.transferLevel = aiTeacherPreviousTransferLevel(aiTeacherState.transferLevel).id;
  } else if (mode === 'next') {
    aiTeacherState.transferLevel = aiTeacherNextTransferLevel(aiTeacherState.transferLevel).id;
  }
  if (aiTeacherState.lessonState && exercise) {
    aiTeacherState.lessonState = {
      ...aiTeacherState.lessonState,
      current_exercise: exercise,
      transfer_level: aiTeacherState.transferLevel,
      exercise_history: [...(aiTeacherState.lessonState.exercise_history || []), {
        exerciseId: exercise.id,
        at: new Date().toISOString(),
        transferLevel: aiTeacherState.transferLevel,
        reason: mode === 'simpler'
          ? '这个练习暂时帮不上忙，我们换一个方向。'
          : mode === 'next'
            ? '这个练习开始饱和了，进入下一层。'
            : '继续固定刚才有效的感觉。',
      }],
    };
    saveAiTeacherLessonState();
  }
  const nextDecision = exercise ? {
    ...(aiTeacherState.currentTeachingDecision || {}),
    focusArea: currentFocus,
    exerciseId: exercise.id,
    userFacingPlan: {
      title: exercise.title,
      goal: exercise.goal,
      instruction: exercise.instruction,
      repetitions: exercise.repetitions,
      durationMinutes: exercise.durationMinutes,
      reProbeAfter: true,
    },
  } : null;
  resetAiTeacherShortRound(exercise?.reProbeTaskId || aiTeacherState.shortProbeTaskId || 'sustained_a');
  if (exercise) {
    aiTeacherState.currentTeachingDecision = nextDecision;
    aiTeacherState.teacherAction = {
      mainFinding: aiTeacherState.lessonState?.current_goal || aiTeacherState.lessonState?.currentGoal || '',
      oneThingToPractice: exercise.title,
      practiceInstruction: exercise.instruction,
      practiceRepetitions: exercise.repetitions,
      teachingDecision: nextDecision,
    };
  }
  document.getElementById('aiTeacherResults')?.setAttribute('hidden', '');
  document.getElementById('aiTeacherComparison')?.setAttribute('hidden', '');
  startAiTeacherPhase('before');
}

function startAiTeacherSongFirstFromSegment(segment) {
  const formatSegmentTime = typeof songAnalysisFormatTime === 'function'
    ? songAnalysisFormatTime
    : (value) => String(value);
  const primitiveTask = segment?.primitiveTask || null;
  const songRequirement = segment?.songRequirement || window.currentSongRequirement || null;
  aiTeacherState.songFirstMode = true;
  aiTeacherState.songSegmentName = segment
    ? `${segment.songName || '歌曲片段'} ${formatSegmentTime(segment.start_time)}-${formatSegmentTime(segment.end_time)}`
    : '歌曲短句';
  aiTeacherState.songRequirement = songRequirement;
  aiTeacherState.songPrimitiveTask = primitiveTask;
  aiTeacherState.transferLevel = 'song_phrase';
  aiTeacherState.shortProbeTaskId = 'song_phrase_probe';
  aiTeacherState.targetTaskId = 'song_phrase_probe';
  aiTeacherState.lessonState = primitiveTask ? {
    id: `song-requirement-${primitiveTask.task_id}`,
    song_requirement_id: songRequirement?.song_id || null,
    primitive_task_id: primitiveTask.task_id,
    current_goal: primitiveTask.diagnostic_focus,
    current_exercise: {
      id: primitiveTask.task_id,
      title: primitiveTask.diagnostic_focus,
      goal: primitiveTask.required_skill?.join(', ') || 'song_phrase',
      instruction: primitiveTask.practice_instruction,
      repetitions: 3,
      durationMinutes: 4,
    },
    next_action: 'practice_song_requirement_task',
    transfer_level: 'song_phrase',
    exercise_history: [],
  } : null;
  aiTeacherState.latestLessonDecision = null;
  aiTeacherState.lastFeedback = null;
  document.getElementById('aiTeacherResults')?.setAttribute('hidden', '');
  document.getElementById('aiTeacherComparison')?.setAttribute('hidden', '');
  const page = document.getElementById('aiVocalTeacherPage');
  if (page) page.hidden = false;
  startAiTeacherPhase('before');
  if (primitiveTask) {
    aiTeacherSetStatus(`我们只练 ${formatSegmentTime(primitiveTask.start_time)}-${formatSegmentTime(primitiveTask.end_time)}：${primitiveTask.title || primitiveTask.diagnostic_focus}。${primitiveTask.practice_goal || primitiveTask.practice_instruction}`);
  } else {
    aiTeacherSetStatus(`先唱这个片段：${aiTeacherState.songSegmentName}。我会听最明显的失败点。`);
  }
}

async function analyzeAiTeacherClosedLoopPhase() {
  const phase = aiTeacherState.phase === 'after' ? 'after' : 'before';
  const vectors = phase === 'after' ? aiTeacherState.vectorsAfter : aiTeacherState.vectorsBefore;
  const vector = vectors[vectors.length - 1];
  if (!vector) return;

  const estimate = aiTeacherBuildShortProbeEstimate(vector);
  const enriched = enrichAiTeacherEstimate({
    ...estimate,
    category: estimate.category,
    confidence: estimate.confidence,
  }, {
    vectors: [vector],
    sampleCount: 1,
    historyCount: aiTeacherState.memoryRecords.filter((record) => record.taskId === estimate.taskId).length,
  });
  enriched.category = estimate.category;
  enriched.confidence = estimate.confidence;
  enriched.diagnosis = estimate.diagnosis;
  enriched.recommendedExercise = estimate.recommendedExercise;
  enriched.shortProbeMetric = estimate.shortProbeMetric;

  const stored = {
    id: `closed-loop-estimate-${phase}-${Date.now()}`,
    phase,
    createdAt: new Date().toISOString(),
    estimates: [enriched],
  };
  await aiTeacherSave('estimates', stored);

  const memoryRecords = aiTeacherCreateMemoryRecords({
    phase,
    estimates: [enriched],
    vectors: [vector],
    sessionId: aiTeacherCurrentSessionId,
  });
  aiTeacherState.memoryRecords = aiTeacherAppendMemoryRecords(aiTeacherState.memoryRecords, memoryRecords);
  aiTeacherState.currentMemoryRecords = memoryRecords;
  await aiTeacherSaveMany('memoryRecords', memoryRecords);

  if (phase === 'after') {
    aiTeacherState.estimatesAfter = [enriched];
    const beforeVector = aiTeacherState.vectorsBefore[aiTeacherState.vectorsBefore.length - 1];
    const focusArea = aiTeacherState.currentTeachingDecision?.focusArea || aiTeacherState.selectedEstimate?.category || enriched.category;
    const exerciseId = aiTeacherState.currentTeachingDecision?.exerciseId || aiTeacherState.teacherAction?.teachingDecision?.exerciseId;
    const exercise = getAiTeacherExerciseById(exerciseId);
    aiTeacherState.comparison = aiTeacherCompareShortProbe(
      beforeVector,
      vector,
      focusArea,
      exerciseId,
      aiTeacherState.teachingHistory
    );
    if (aiTeacherState.lessonState) {
      aiTeacherState.lessonState = aiTeacherUpdateLessonStateAfterAttempt({
        lessonState: aiTeacherState.lessonState,
        currentVector: vector,
        focusArea,
        exercise,
      });
      await saveAiTeacherLessonState();
      const lessonChange = aiTeacherState.lessonState.last_change;
      if (lessonChange) {
        aiTeacherState.comparison = {
          ...aiTeacherState.comparison,
          improved: lessonChange.improved,
          retainedImprovement: lessonChange.improved,
          worsened: lessonChange.worse,
          best_so_far: lessonChange.best_so_far,
          unchanged: lessonChange.unchanged,
          lessonChange,
          noImprovementCount: aiTeacherState.lessonState.no_improvement_count,
          saturationCount: aiTeacherState.lessonState.saturation_count,
        };
      }
    }
    await aiTeacherSave('comparisons', {
      id: `closed-loop-comparison-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...aiTeacherState.comparison,
    });
    await saveAiTeacherTeachingSession(aiTeacherState.comparison);
    await saveAiTeacherSuccessMemory(aiTeacherState.comparison);
    const lessonNext = aiTeacherState.lessonState
      ? {
        action: aiTeacherState.lessonState.next_action,
        transferLevel: aiTeacherState.lessonState.transfer_level,
        message: aiTeacherState.lessonState.teaching_reason,
      }
      : aiTeacherChooseNextLessonStep(aiTeacherState.comparison, aiTeacherState.transferLevel);
    aiTeacherState.latestLessonDecision = lessonNext;
    aiTeacherState.lessonStep = lessonNext.action;
    aiTeacherState.transferLevel = lessonNext.transferLevel;
    aiTeacherState.phase = 'complete';
    renderAiTeacherResults();
    renderAiTeacherComparison();
  } else {
    aiTeacherState.estimatesBefore = [enriched];
    aiTeacherState.selectedEstimate = enriched;
    aiTeacherState.targetTaskId = enriched.taskId;
    const exerciseDecision = aiTeacherClosedLoopDecision(enriched, aiTeacherState.teachingHistory);
    aiTeacherState.currentTeachingDecision = exerciseDecision;
    const baselineExercise = getAiTeacherExerciseById(exerciseDecision.exerciseId);
    if (!aiTeacherState.lessonState) {
      aiTeacherState.lessonState = aiTeacherCreateLessonState({
        goal: exerciseDecision.reason,
        baselineVector: vector,
        estimate: enriched,
        exercise: baselineExercise,
        transferLevel: aiTeacherState.songFirstMode ? 'song_phrase' : aiTeacherState.transferLevel,
      });
      aiTeacherState.lessonState.song_first_mode = aiTeacherState.songFirstMode;
      aiTeacherState.lessonState.songFirstMode = aiTeacherState.songFirstMode;
      aiTeacherState.lessonState.bottleneck_type = aiTeacherState.songFirstMode ? aiTeacherSongBottleneckType(vector) : null;
    } else {
      aiTeacherState.lessonState = {
        ...aiTeacherState.lessonState,
        current_goal: aiTeacherState.lessonState.current_goal || exerciseDecision.reason,
        current_exercise: baselineExercise || aiTeacherState.lessonState.current_exercise,
        transfer_level: aiTeacherState.transferLevel,
        transferLevel: aiTeacherState.transferLevel,
        attempts: [...(aiTeacherState.lessonState.attempts || []), {
          id: vector.id || `probe-${Date.now()}`,
          role: 'probe',
          attempt_index: (aiTeacherState.lessonState.attempts || []).length + 1,
          timestamp: vector.timestamp || new Date().toISOString(),
          vector,
          metric: aiTeacherShortProbeMetric(vector),
          cueId: aiTeacherState.lessonState.active_cue?.id || aiTeacherState.lessonState.activeCue?.id,
          exerciseId: baselineExercise?.id || aiTeacherState.lessonState.current_exercise?.id,
          task: aiTeacherState.lessonState.current_task || aiTeacherState.lessonState.currentTask,
        }],
      };
    }
    await saveAiTeacherLessonState();
    aiTeacherState.teacherAction = {
      mainFinding: exerciseDecision.reason,
      oneThingToPractice: exerciseDecision.userFacingPlan.title,
      practiceInstruction: exerciseDecision.userFacingPlan.instruction,
      practiceRepetitions: exerciseDecision.userFacingPlan.repetitions,
      reProbeInstruction: '练完后立刻重新录同一个声音，我会比较有没有变稳定。',
      suppressedFindings: [],
      reasonForChoosing: exerciseDecision.reason,
      teachingDecision: exerciseDecision,
    };
    aiTeacherState.bestByTask = { [enriched.taskId]: vector };
    aiTeacherState.worstByTask = { [enriched.taskId]: vector };
    aiTeacherState.latestTrend = null;
    aiTeacherState.latestHypotheses = [];
    aiTeacherState.latestDiary = '这轮我只追踪一件事：练习之后，同一个短 probe 是否更容易稳定复现。';
    aiTeacherState.latestResearchSnapshot = aiTeacherBuildResearchSnapshot(enriched);
    renderAiTeacherResults();
  }

  renderAiTeacher();
}

function getAiTeacherInstantFeedback(vector, previousAttempts = [], task = null, taskAttempts = []) {
  const feedback = typeof generateImmediateFeedback === 'function'
    ? generateImmediateFeedback(vector, previousAttempts, task || {})
    : {
      quickComment: '这次可以用。',
      nextCue: '我们再录下一次，尽量让它和刚才一样。',
      isUsable: true,
      severity: 'good',
    };

  const attempts = Array.isArray(taskAttempts) ? taskAttempts : [];
  if (task && attempts.length >= (task.repetitions || 5) && typeof generateTaskSummary === 'function') {
    const visibleTasks = aiTeacherVisibleTasks();
    const taskIndex = visibleTasks.findIndex((item) => item.id === task.id);
    feedback.taskSummary = generateTaskSummary(task.id, attempts, visibleTasks[taskIndex + 1] || null);
  }

  feedback.durationMs = vector?.durationMs || 0;
  return feedback;
}

function renderAiTeacherFeedback() {
  const panel = document.getElementById('aiTeacherInstantFeedback');
  if (!panel) return;
  const feedback = aiTeacherState.lastFeedback;
  panel.hidden = !feedback;
  panel.innerHTML = '';
  if (!feedback) return;

  const severity = feedback.severity || 'good';
  panel.classList.toggle('minor', severity === 'minor');
  panel.classList.toggle('needs-retry', severity === 'needs_retry');

  const body = document.createElement('div');
  body.className = 'ai-teacher-feedback-body';
  body.innerHTML = `
    <div>
      <span>AI刚刚听到：</span>
      <strong>${feedback.quickComment || '这次可以用。'}</strong>
    </div>
    <div>
      <span>下一次注意：</span>
      <p>${feedback.nextCue || '我们再录下一次。'}</p>
    </div>
  `;
  panel.append(body);

  if (feedback.taskSummary) {
    const summary = document.createElement('div');
    summary.className = 'ai-teacher-task-summary';
    summary.innerHTML = `
      <strong>${feedback.taskSummary.mainObservation}</strong>
      <p>${feedback.taskSummary.nextTaskCue}</p>
    `;
    panel.append(summary);
  }

  const total = aiTeacherExpectedAttempts();
  const completed = aiTeacherCompletedAttempts();
  const phaseComplete = total > 0 && completed >= total;
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = phaseComplete
    ? (aiTeacherState.phase === 'after' ? '查看复测结果' : '查看练习')
    : '继续录下一次';
  button.addEventListener('click', () => {
    if (phaseComplete) {
      analyzeAiTeacherPhase();
    } else {
      recordAiTeacherAttempt();
    }
  });
  panel.append(button);
}

function bindAiTeacherEvents() {
  document.getElementById('openAiVocalTeacherButton')?.addEventListener('click', showAiVocalTeacher);
  document.getElementById('aiTeacherBackHomeButton')?.addEventListener('click', () => {
    hideAiVocalTeacher();
    if (typeof showLauncherView === 'function') showLauncherView();
  });
  document.getElementById('aiTeacherStartButton')?.addEventListener('click', () => {
    aiTeacherState.songFirstMode = false;
    aiTeacherState.shortProbeTaskId = aiTeacherState.shortProbeTaskId === 'song_phrase_probe' ? 'sustained_a' : aiTeacherState.shortProbeTaskId;
    startAiTeacherPhase('before');
    recordAiTeacherAttempt();
  });
  document.getElementById('aiTeacherSongFirstButton')?.addEventListener('click', () => {
    aiTeacherState.songFirstMode = true;
    aiTeacherState.transferLevel = 'song_phrase';
    aiTeacherState.shortProbeTaskId = 'song_phrase_probe';
    aiTeacherState.targetTaskId = 'song_phrase_probe';
    aiTeacherState.lessonState = null;
    document.getElementById('aiTeacherResults')?.setAttribute('hidden', '');
    document.getElementById('aiTeacherComparison')?.setAttribute('hidden', '');
    startAiTeacherPhase('before');
    recordAiTeacherAttempt();
  });
  document.getElementById('aiTeacherRecordButton')?.addEventListener('click', recordAiTeacherAttempt);
  document.getElementById('aiTeacherStopButton')?.addEventListener('click', stopAiTeacherRecording);
  document.getElementById('aiTeacherAnalyzeButton')?.addEventListener('click', analyzeAiTeacherPhase);
  document.getElementById('aiTeacherStartPracticeButton')?.addEventListener('click', () => {
    const exercise = getAiTeacherExerciseById(aiTeacherState.currentTeachingDecision?.exerciseId);
    if (exercise?.reProbeTaskId) {
      aiTeacherState.targetTaskId = exercise.reProbeTaskId;
    }
    aiTeacherState.lessonStep = 'practice';
    aiTeacherState.vectorsAfter = [];
    aiTeacherState.comparison = null;
    aiTeacherState.lastFeedback = null;
    startAiTeacherPhase('after');
    document.getElementById('aiTeacherResults')?.setAttribute('hidden', '');
    document.getElementById('aiTeacherComparison')?.setAttribute('hidden', '');
  });
  document.getElementById('aiTeacherStartReprobeButton')?.addEventListener('click', () => {
    const exercise = getAiTeacherExerciseById(aiTeacherState.currentTeachingDecision?.exerciseId);
    if (exercise?.reProbeTaskId) {
      aiTeacherState.targetTaskId = exercise.reProbeTaskId;
    }
    startAiTeacherPhase('after');
    document.getElementById('aiTeacherResults')?.setAttribute('hidden', '');
    document.getElementById('aiTeacherComparison')?.setAttribute('hidden', '');
  });
  document.getElementById('aiTeacherPlayBestButton')?.addEventListener('click', () => {
    const taskId = aiTeacherState.selectedEstimate?.taskId;
    aiTeacherPlayVector(taskId ? aiTeacherState.bestByTask[taskId] : null);
  });
  document.getElementById('aiTeacherPlayWorstButton')?.addEventListener('click', () => {
    const taskId = aiTeacherState.selectedEstimate?.taskId;
    aiTeacherPlayVector(taskId ? aiTeacherState.worstByTask[taskId] : null);
  });
  document.getElementById('aiTeacherResearchToggleButton')?.addEventListener('click', () => {
    const panel = document.getElementById('aiTeacherResearchPanel');
    if (panel) panel.hidden = !panel.hidden;
  });
  document.getElementById('aiTeacherContinuePracticeButton')?.addEventListener('click', () => {
    const action = aiTeacherState.latestLessonDecision?.action || aiTeacherState.lessonState?.next_action;
    startAiTeacherNextLessonRound(
      action === 'increase_difficulty'
        ? 'next'
        : action === 'switch_exercise' || action === 'decrease_difficulty'
          ? 'simpler'
          : 'continue'
    );
  });
  document.getElementById('aiTeacherSimplerPracticeButton')?.addEventListener('click', () => {
    startAiTeacherNextLessonRound('simpler');
  });
}

function renderTeacherAction(estimate) {
  const action = aiTeacherState.teacherAction || generateTeacherAction(estimate);
  aiTeacherState.teacherAction = action;
  aiTeacherState.currentTeachingDecision = action.teachingDecision || aiTeacherState.currentTeachingDecision;
  const plan = action.teachingDecision?.userFacingPlan;
  document.getElementById('aiTeacherMainFinding').textContent = plan?.goal || action.mainFinding;
  document.getElementById('aiTeacherOneThing').textContent = plan?.title || action.oneThingToPractice;
  document.getElementById('aiTeacherPracticeInstruction').textContent =
    `${plan?.instruction || action.practiceInstruction} 做 ${plan?.repetitions || action.practiceRepetitions} 次，约 ${plan?.durationMinutes || 3} 分钟。完成后复测同一个任务。`;
  const button = document.getElementById('aiTeacherStartPracticeButton');
  if (button) {
    button.textContent = '开始今日练习';
    button.disabled = false;
  }
  document.getElementById('aiTeacherContinuePracticeButton')?.setAttribute('hidden', '');
  document.getElementById('aiTeacherSimplerPracticeButton')?.setAttribute('hidden', '');
}

function moveAiTeacherDetailsIntoPanel() {
  const content = document.getElementById('aiTeacherDetailsContent');
  if (!content || content.dataset.ready === 'true') return;
  [
    'aiTeacherMemoryDashboard',
    'aiTeacherDiaryPanel',
    'aiTeacherHypothesisPanel',
    'aiTeacherBestAttemptPanel',
    'aiTeacherExplainabilityPanel',
    'aiTeacherResearchPanel',
    'aiTeacherEstimateList',
  ].forEach((id) => {
    const node = document.getElementById(id);
    if (node) content.append(node);
  });
  content.dataset.ready = 'true';
}

function renderAiTeacherResults() {
  const panel = document.getElementById('aiTeacherResults');
  const estimate = aiTeacherState.selectedEstimate;
  if (panel) panel.hidden = !estimate;
  if (!estimate) return;

  moveAiTeacherDetailsIntoPanel();
  renderTeacherAction(estimate);

  const best = aiTeacherState.bestByTask[estimate.taskId];
  const worst = aiTeacherState.worstByTask[estimate.taskId];
  const bestTeaching = aiTeacherBuildBestAttemptTeaching(best);
  renderAiTeacherMemoryDashboard();
  renderAiTeacherHypotheses();
  renderAiTeacherExplainability(estimate);
  renderAiTeacherResearch(estimate);

  const diary = document.getElementById('aiTeacherDiaryText');
  if (diary) diary.textContent = aiTeacherState.latestDiary || '这次训练已经记录到 Learner Memory。';
  const task = document.getElementById('aiTeacherDominantTask');
  if (task) task.textContent = getAiTeacherTaskLabel(estimate.taskId);
  const diagnosis = document.getElementById('aiTeacherDiagnosis');
  if (diagnosis) diagnosis.textContent = personalizeAiTeacherDiagnosis(estimate);
  const trend = document.getElementById('aiTeacherTrendText');
  if (trend) trend.textContent = aiTeacherState.latestTrend?.text || '趋势会在多次训练后出现。';
  const confidence = document.getElementById('aiTeacherConfidenceScore');
  if (confidence) confidence.textContent = `${estimate.confidence || 0}%`;
  const confidenceHint = document.getElementById('aiTeacherConfidenceHint');
  if (confidenceHint) {
    confidenceHint.textContent = (estimate.confidence || 0) < 50
      ? '建议继续录几次，我才能更确定。'
      : '这个判断已经有足够参考价值。';
  }
  const score = document.getElementById('aiTeacherDominantScore');
  if (score) score.textContent = aiTeacherFormatScore(estimate.instabilityScore);
  const features = document.getElementById('aiTeacherDominantFeatures');
  if (features) features.textContent = estimate.dominantFeatures.map(aiTeacherFeatureLabel).join(', ');
  const recommendation = document.getElementById('aiTeacherRecommendation');
  if (recommendation) recommendation.textContent = aiTeacherState.teacherAction.oneThingToPractice;
  const reprobe = document.getElementById('aiTeacherStartReprobeButton');
  if (reprobe) reprobe.disabled = false;

  const bestPanel = document.getElementById('aiTeacherBestAttemptPanel');
  if (bestPanel) bestPanel.hidden = !best;
  if (best) {
    document.getElementById('aiTeacherBestAttemptText').textContent = `本轮最稳定的一次：第 ${best.attemptId} 次`;
    document.getElementById('aiTeacherBestAttemptWhy').textContent = bestTeaching.text;
  }
  document.getElementById('aiTeacherPlayBestButton').disabled = !best;
  document.getElementById('aiTeacherPlayWorstButton').disabled = !worst;

  const list = document.getElementById('aiTeacherEstimateList');
  if (!list) return;
  list.innerHTML = '';
  aiTeacherState.estimatesBefore.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'ai-teacher-estimate-row';
    row.innerHTML = `
      <strong>${getAiTeacherTaskLabel(item.taskId)}</strong>
      <span>${aiTeacherFormatScore(item.instabilityScore)}</span>
      <small>${item.dominantFeatures.map(aiTeacherFeatureLabel).join(', ')}</small>
    `;
    list.append(row);
  });
}

function ensureAiTeacherComparisonActions() {
  const panel = document.getElementById('aiTeacherComparison');
  if (!panel || document.getElementById('aiTeacherContinuePracticeButton')) return;
  const actions = document.createElement('div');
  actions.className = 'ai-teacher-comparison-actions';
  actions.innerHTML = `
    <button id="aiTeacherContinuePracticeButton" type="button">继续这个练习</button>
    <button id="aiTeacherSimplerPracticeButton" class="secondary" type="button">换一个更简单的练习</button>
  `;
  panel.append(actions);
  document.getElementById('aiTeacherContinuePracticeButton')?.addEventListener('click', () => {
    startAiTeacherPhase('after');
    document.getElementById('aiTeacherComparison')?.setAttribute('hidden', '');
  });
  document.getElementById('aiTeacherSimplerPracticeButton')?.addEventListener('click', () => {
    aiTeacherState.teacherAction = {
      mainFinding: '我们先把练习再变简单一点。',
      oneThingToPractice: '只唱一个很轻的 “a——”。',
      practiceInstruction: '保持 2 秒就好，不追求音量，不追求高音。',
      practiceRepetitions: 5,
      reProbeInstruction: '做完后再测一次。',
      suppressedFindings: [],
      reasonForChoosing: '复测没有明显下降，所以先降低难度。',
    };
    renderTeacherAction(aiTeacherState.selectedEstimate);
    document.getElementById('aiTeacherResults')?.removeAttribute('hidden');
  });
}

function renderAiTeacherComparison() {
  const result = aiTeacherState.comparison;
  const panel = document.getElementById('aiTeacherComparison');
  if (panel) panel.hidden = !result;
  if (!result) return;
  ensureAiTeacherComparisonActions();
  const action = aiTeacherState.teacherAction;
  document.getElementById('aiTeacherComparisonTitle').textContent = result.improved
    ? '练习后变化：更稳定了'
    : '练习后变化：暂时没有明显变化';
  document.getElementById('aiTeacherComparisonText').textContent = result.improved
    ? `这次复测里，${action?.reasonForChoosing || '主要方向'}相关的不稳定性下降了，所以这个练习可能有效。`
    : '这次还没有明显下降，我们下次应该换一个更简单的练习。';
  document.getElementById('aiTeacherBeforeScore').textContent = aiTeacherFormatScore(result.beforeInstability);
  document.getElementById('aiTeacherAfterScore').textContent = aiTeacherFormatScore(result.afterInstability);
  document.getElementById('aiTeacherChangeScore').textContent = aiTeacherFormatScore(result.delta);
  const grid = document.querySelector('.ai-teacher-comparison-grid');
  if (grid) grid.hidden = true;
  document.getElementById('aiTeacherContinuePracticeButton')?.removeAttribute('hidden');
  document.getElementById('aiTeacherSimplerPracticeButton')?.removeAttribute('hidden');
}

function renderAiTeacherResults() {
  const panel = document.getElementById('aiTeacherResults');
  const estimate = aiTeacherState.selectedEstimate;
  if (panel) panel.hidden = !estimate;
  if (!estimate) return;

  moveAiTeacherDetailsIntoPanel();
  renderTeacherAction(estimate);
  renderAiTeacherMemoryDashboard();
  renderAiTeacherHypotheses();
  renderAiTeacherExplainability(estimate);
  renderAiTeacherResearch(estimate);

  const summary = document.querySelector('.ai-teacher-result-summary');
  if (summary) summary.hidden = Boolean(aiTeacherState.closedLoopMode);
  const details = document.getElementById('aiTeacherDetailsPanel');
  if (details && aiTeacherState.closedLoopMode) {
    details.open = false;
    const summaryNode = details.querySelector('summary');
    if (summaryNode) summaryNode.textContent = '专业模式';
  }

  const diary = document.getElementById('aiTeacherDiaryText');
  if (diary) diary.textContent = aiTeacherState.latestDiary || '这轮只看一件事：练习后同一个短 probe 有没有更稳定。';
  const task = document.getElementById('aiTeacherDominantTask');
  if (task) task.textContent = getAiTeacherTaskLabel(estimate.taskId);
  const diagnosis = document.getElementById('aiTeacherDiagnosis');
  if (diagnosis) diagnosis.textContent = estimate.diagnosis || aiTeacherClosedLoopFinding(estimate.category);
  const trend = document.getElementById('aiTeacherTrendText');
  if (trend) trend.textContent = '闭环模式：先做一个动作，再立刻复测。';
  const confidence = document.getElementById('aiTeacherConfidenceScore');
  if (confidence) confidence.textContent = `${estimate.confidence || 0}%`;
  const score = document.getElementById('aiTeacherDominantScore');
  if (score) score.textContent = aiTeacherFormatScore(estimate.instabilityScore);

  const list = document.getElementById('aiTeacherEstimateList');
  if (list) {
    list.innerHTML = '';
    const row = document.createElement('article');
    row.className = 'ai-teacher-estimate-row';
    row.innerHTML = `
      <strong>${getAiTeacherTaskLabel(estimate.taskId)}</strong>
      <span>${aiTeacherFormatScore(estimate.instabilityScore)}</span>
      <small>${(estimate.dominantFeatures || []).map(aiTeacherFeatureLabel).join(', ')}</small>
    `;
    list.append(row);
  }
}

function renderTeacherAction(estimate) {
  const action = aiTeacherState.teacherAction || generateTeacherAction(estimate);
  aiTeacherState.teacherAction = action;
  aiTeacherState.currentTeachingDecision = action.teachingDecision || aiTeacherState.currentTeachingDecision;
  const decision = action.teachingDecision || aiTeacherState.currentTeachingDecision;
  const plan = decision?.userFacingPlan;
  const focus = decision?.focusArea || estimate?.category || 'global';
  const repetitions = plan?.repetitions || action.practiceRepetitions || 5;
  const transfer = aiTeacherGetTransferLevel(aiTeacherState.transferLevel);
  const lesson = aiTeacherState.lessonState;
  const attemptNumber = Math.max(1, (lesson?.attempts || []).length);
  const lastChange = lesson?.last_change;
  const bestIndex = lesson?.best_attempt?.attempt_index || 1;
  const currentExercise = lesson?.current_exercise || (decision?.exerciseId ? getAiTeacherExerciseById(decision.exerciseId) : null);
  const activeCue = lesson?.active_cue || lesson?.activeCue;
  const successCue = aiTeacherState.latestSuccessMemory
    ? `上次成功的感觉：${aiTeacherState.latestSuccessMemory.exerciseTitle}。等会儿可以回到刚才那个感觉。`
    : '我听到了。今天先别管别的。';
  const changeText = lastChange
    ? aiTeacherDescribeLessonChange(lastChange, lesson)
    : '我先把这条声音当作今天的 baseline。';
  const nextReason = lesson?.teaching_reason || lesson?.lastDecision?.reason || decision?.reason || aiTeacherClosedLoopFinding(focus);
  const nextInstruction = lesson?.next_instruction || lesson?.lastDecision?.nextInstruction;
  const compared = lastChange
    ? (lastChange.best_so_far ? '更好，今天最佳' : lastChange.improved ? '更好' : lastChange.worse ? '更差' : '差不多')
    : '等待复测';
  const songReason = lesson?.song_first_mode || lesson?.songFirstMode
    ? (lesson?.bottleneck_type === 'node_failure'
      ? '我先拆单音，因为这更像某个音点没有站稳。'
      : '我先拆两个音之间的过渡，因为这更像连接处不稳。')
    : '';
  const experiment = aiTeacherBuildExperimentFeedback({
    estimate,
    action,
    decision,
    lesson,
    lastChange,
    currentExercise,
  });
  aiTeacherState.currentVocalExperiment = experiment;
  if (lesson) {
    lesson.current_experiment = experiment;
    lesson.currentExperiment = experiment;
  }

  document.getElementById('aiTeacherMainFinding').textContent =
    `假设：${experiment.hypothesis} 可信度：${experiment.confidenceLevel}。`;
  document.getElementById('aiTeacherOneThing').textContent =
    experiment.previousVerification || `当前状态：${changeText} 与上次相比：${compared}。当前最好尝试：第 ${bestIndex} 次。`;
  document.getElementById('aiTeacherPracticeInstruction').textContent =
    `验证任务：${experiment.verificationTask} ${songReason} ${successCue} 当前练习：${currentExercise?.title || plan?.title || action.oneThingToPractice || '一个很小的练习'}。${transfer.label}：${transfer.instruction}`;
  const experimentPanel = document.getElementById('aiTeacherExperimentFeedback');
  if (experimentPanel) {
    experimentPanel.innerHTML = aiTeacherRenderExperimentCard(experiment);
  }
  aiTeacherSaveVocalExperiment(experiment);

  const button = document.getElementById('aiTeacherStartPracticeButton');
  if (button) {
    button.textContent = '开始这个练习';
    button.disabled = false;
  }
  document.getElementById('aiTeacherContinuePracticeButton')?.setAttribute('hidden', '');
  document.getElementById('aiTeacherSimplerPracticeButton')?.setAttribute('hidden', '');
}

function renderAiTeacherComparison() {
  const result = aiTeacherState.comparison;
  const panel = document.getElementById('aiTeacherComparison');
  if (panel) panel.hidden = !result;
  if (!result) return;
  ensureAiTeacherComparisonActions();

  const improved = Boolean(result.retainedImprovement || result.improved);
  const lessonNext = aiTeacherState.latestLessonDecision || aiTeacherChooseNextLessonStep(result, aiTeacherState.transferLevel);
  const successText = aiTeacherState.latestSuccessMemory ? ` ${aiTeacherState.latestSuccessMemory.text}` : '';
  const lesson = aiTeacherState.lessonState;
  const change = result.lessonChange || lesson?.last_change;
  const bestIndex = lesson?.best_attempt?.attempt_index || 1;
  const noImprove = lesson?.no_improvement_count || result.noImprovementCount || 0;
  const activeCue = lesson?.active_cue || lesson?.activeCue;
  const songFailure = lesson?.song_first_mode || lesson?.songFirstMode
    ? (lesson?.bottleneck_type === 'node_failure' ? '这次更像单个音点没站稳。' : '这次更像两个音之间的过渡没连住。')
    : '';
  const changeLine = change
    ? aiTeacherDescribeLessonChange(change, lesson)
    : lessonNext.message;
  const verifiedExperiment = aiTeacherBuildVerificationSummary(
    aiTeacherState.currentVocalExperiment || lesson?.current_experiment || lesson?.currentExperiment,
    result,
    lesson
  );
  if (verifiedExperiment) {
    aiTeacherState.currentVocalExperiment = verifiedExperiment;
    if (lesson) {
      lesson.current_experiment = verifiedExperiment;
      lesson.currentExperiment = verifiedExperiment;
    }
    aiTeacherSaveVocalExperiment(verifiedExperiment);
  }
  document.getElementById('aiTeacherComparisonTitle').textContent = verifiedExperiment
    ? `复测后：${verifiedExperiment.verificationResult}`
    : result.saturated
      ? '复测后：收益开始变小'
      : result.worsened
        ? '复测后：难度有点高'
        : result.best_so_far
          ? '复测后：今天最好的一次'
      : improved
        ? '复测后：有变好'
        : '复测后：暂时没有变好';
  document.getElementById('aiTeacherComparisonText').textContent = verifiedExperiment?.verificationText || (result.saturated
    ? '这个练习的收益开始变小了，我们换到下一个阶段。'
    : result.worsened
      ? '这个难度有点高，我们退回上一层。'
      : result.best_so_far
      ? `刚才那个感觉最接近目标。今天最好的一次：第 ${bestIndex} 次。${successText}`
    : improved
      ? `${changeLine} ${activeCue?.text ? `这个 cue 有用：${activeCue.text}` : ''} ${successText}`
      : noImprove >= 2
        ? `已经连续两次没有明显改善。这个练习暂时帮不上忙，我们换一个方向。${songFailure}`
        : `${changeLine} 变化不大，我们换一句提示再试一次。${songFailure}`);
  const experimentPanel = document.getElementById('aiTeacherExperimentFeedback');
  if (experimentPanel && verifiedExperiment) {
    experimentPanel.innerHTML = aiTeacherRenderExperimentCard(verifiedExperiment);
  }
  document.getElementById('aiTeacherBeforeScore').textContent = aiTeacherFormatScore(result.beforeInstability);
  document.getElementById('aiTeacherAfterScore').textContent = aiTeacherFormatScore(result.afterInstability);
  document.getElementById('aiTeacherChangeScore').textContent = aiTeacherFormatScore(result.delta);

  const grid = document.querySelector('.ai-teacher-comparison-grid');
  if (grid) grid.hidden = true;
  document.getElementById('aiTeacherContinuePracticeButton')?.removeAttribute('hidden');
  document.getElementById('aiTeacherSimplerPracticeButton')?.removeAttribute('hidden');
  const continueButton = document.getElementById('aiTeacherContinuePracticeButton');
  if (continueButton) {
    continueButton.textContent = lessonNext.action === 'increase_difficulty'
      ? '进入下一层'
      : lessonNext.action === 'switch_exercise'
        ? '换练习'
        : '继续这个练习';
  }
  const simplerButton = document.getElementById('aiTeacherSimplerPracticeButton');
  if (simplerButton) {
    simplerButton.textContent = result.worsened || !improved ? '换一个更简单的' : '退回简单一点';
  }
}

bindAiTeacherEvents();
window.showAiVocalTeacher = showAiVocalTeacher;
window.hideAiVocalTeacher = hideAiVocalTeacher;
window.startAiTeacherSongFirstFromSegment = startAiTeacherSongFirstFromSegment;


