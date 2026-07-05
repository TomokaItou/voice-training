const AI_TEACHER_SHORT_PROBE_DEFAULT = 'sustained_a';

function aiTeacherNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function aiTeacherShortProbeMetric(vector) {
  const features = vector?.features || {};
  const pitchStd = aiTeacherNumber(features.pitch_std, 0);
  const loudnessStd = aiTeacherNumber(features.loudness_std, 0);
  const harmonicity = aiTeacherNumber(features.harmonicity_mean, 0.65);
  const centroid = aiTeacherNumber(features.spectral_centroid_mean, 0);
  const tilt = aiTeacherNumber(features.spectral_tilt_mean, 0);
  const duration = Math.max(0, (vector?.durationMs || 0) / 1000);
  const durationPenalty = duration >= 2 && duration <= 4 ? 0 : Math.abs(duration - 3) * 8;

  const scores = {
    pitch: pitchStd,
    breath: loudnessStd * 2 + durationPenalty,
    closure: Math.max(0, (1 - harmonicity) * 42),
    resonance: Math.min(42, Math.abs(tilt) * 0.7 + Math.max(0, centroid - 2200) / 180),
    register: vector?.taskId === 'short_glide' ? pitchStd * 1.15 + loudnessStd : 0,
    global: pitchStd * 0.35 + loudnessStd * 0.8 + Math.max(0, (1 - harmonicity) * 18) + durationPenalty,
  };

  const featureByFocus = {
    pitch: 'pitch_std',
    breath: 'loudness_std',
    closure: 'harmonicity_mean',
    resonance: 'spectral_centroid_mean',
    register: 'register_transition',
    global: 'global_consistency',
  };
  const focusRanking = Object.entries(scores)
    .filter(([, score]) => Number.isFinite(score))
    .sort((left, right) => right[1] - left[1]);
  const focusArea = focusRanking[0]?.[0] || 'global';
  const dominantFeatures = focusRanking.slice(0, 3).map(([focus]) => featureByFocus[focus]);
  const instabilityScore = Math.max(0, focusRanking[0]?.[1] || 0);

  return {
    scores,
    focusArea,
    dominantFeatures,
    instabilityScore,
  };
}

function aiTeacherBuildShortProbeEstimate(vector) {
  const metric = aiTeacherShortProbeMetric(vector);
  const features = vector?.features || {};
  const leadingEigenvector = {};
  metric.dominantFeatures.forEach((feature, index) => {
    leadingEigenvector[feature] = index === 0 ? 1 : 0.5 / (index + 1);
  });
  return {
    taskId: vector?.taskId || AI_TEACHER_SHORT_PROBE_DEFAULT,
    mean: { ...features },
    covariance: [],
    eigenvalues: [metric.instabilityScore],
    leadingEigenvector,
    instabilityScore: metric.instabilityScore,
    dominantFeatures: metric.dominantFeatures,
    category: metric.focusArea,
    confidence: 68,
    featureImportance: metric.dominantFeatures.map((feature, index) => ({
      feature,
      weight: index === 0 ? 1 : 0.5 / (index + 1),
      importance: index === 0 ? 0.65 : 0.2 / (index + 1),
      category: metric.focusArea,
    })),
    diagnosis: aiTeacherClosedLoopFinding(metric.focusArea),
    recommendedExercise: aiTeacherClosedLoopExerciseCue(metric.focusArea),
    shortProbeMetric: metric,
  };
}

function aiTeacherClosedLoopFinding(focusArea) {
  const findings = {
    closure: '我听到的主要问题：声音闭合和起音不够稳定。',
    breath: '我听到的主要问题：气息和音量波动比较明显。',
    resonance: '我听到的主要问题：共鸣位置或元音形状还不够稳定。',
    pitch: '我听到的主要问题：音高还不够稳。',
    register: '我听到的主要问题：滑音经过换声区时不够连续。',
    global: '我听到的主要问题：这条声音整体还不够可复现。',
  };
  return findings[focusArea] || findings.global;
}

function aiTeacherClosedLoopExerciseCue(focusArea) {
  const cues = {
    closure: '现在只做：fry 到元音。',
    breath: '现在只做：SOVT 或轻起音。',
    resonance: '现在只做：哼鸣到元音。',
    pitch: '现在只做：短音高保持。',
    register: '现在只做：短滑音。',
    global: '现在只做：最简单的稳定 /a/。',
  };
  return cues[focusArea] || cues.global;
}

const AI_TEACHER_CUE_LIBRARY = {
  closure: [
    { id: 'dont_push', text: '不要推，像把声音轻轻放出来。' },
    { id: 'fry_then_open', text: '先轻轻 fry，再慢慢打开。' },
  ],
  breath: [
    { id: 'sigh_like', text: '像叹气一样开始，气不要断。' },
    { id: 'soft_start', text: '先小声开始，再慢慢清楚一点。' },
  ],
  resonance: [
    { id: 'hum_first', text: '先哼再打开，打开嘴以后位置别掉。' },
    { id: 'keep_best_feeling', text: '保持刚才最好那次的感觉。' },
  ],
  pitch: [
    { id: 'one_note_only', text: '只想一个稳定的音，不要急着修正。' },
    { id: 'light_onset_pitch', text: '轻一点起音，音高自然放住。' },
  ],
  register: [
    { id: 'shorter_bridge', text: '片段再短一点，只过最难的两个音。' },
    { id: 'no_jump', text: '不要跳过去，让声音连着滑。' },
  ],
  global: [
    { id: 'repeat_best', text: '回到最好那次的感觉，再复制一次。' },
    { id: 'make_it_smaller', text: '把动作变小，先让它稳定。' },
  ],
};

function aiTeacherCueStats(lessonState, cueId) {
  const history = lessonState?.cueHistory || lessonState?.cue_history || [];
  const used = history.filter((item) => item.cueId === cueId);
  return {
    used,
    effective: used.filter((item) => item.effective).length,
    ineffectiveStreak: used.slice(-2).filter((item) => item.effective === false).length,
  };
}

function aiTeacherSelectCue(focusArea, lessonState) {
  const cues = AI_TEACHER_CUE_LIBRARY[focusArea] || AI_TEACHER_CUE_LIBRARY.global;
  const effective = cues
    .map((cue) => ({ cue, stats: aiTeacherCueStats(lessonState, cue.id) }))
    .filter((item) => item.stats.effective > 0)
    .sort((left, right) => right.stats.effective - left.stats.effective)[0];
  if (effective) return effective.cue;
  return cues.find((cue) => aiTeacherCueStats(lessonState, cue.id).ineffectiveStreak < 2) || cues[0];
}

function aiTeacherTaskFromTransferLevel(levelId, focusArea = 'global') {
  const taskByLevel = {
    humming: 'humming',
    humming_to_vowel: 'humming-to-vowel',
    vowel: focusArea === 'pitch' ? 'sustained note' : 'vowel',
    syllable: 'syllable',
    word: 'word',
    short_lyric_phrase: 'short lyric phrase',
    song_phrase: 'song phrase',
  };
  return taskByLevel[levelId] || 'short probe';
}

function aiTeacherSongBottleneckType(vector) {
  const metric = aiTeacherShortProbeMetric(vector);
  if (vector?.taskId === 'short_glide' || metric.focusArea === 'register') return 'transition_failure';
  if (metric.focusArea === 'pitch' || metric.focusArea === 'closure') return 'node_failure';
  return 'transition_failure';
}

function aiTeacherSelectClosedLoopExercise(estimate, history = []) {
  const focusArea = estimate?.category || estimate?.shortProbeMetric?.focusArea || 'global';
  const currentId = history.slice().reverse().find((session) => session.focusArea === focusArea)?.exerciseId;
  const exerciseByFocus = {
    closure: 'closure_fry_to_vowel',
    breath: 'breath_sovt',
    resonance: 'resonance_hum_to_vowel',
    pitch: 'pitch_steady_3s',
    register: 'register_short_glide',
    global: 'global_easy_a',
  };
  const repeatedNoHelp = typeof aiTeacherSameExerciseNoImprovement === 'function' &&
    aiTeacherSameExerciseNoImprovement(history, currentId || exerciseByFocus[focusArea]);
  if (repeatedNoHelp) {
    return getAiTeacherAlternateExercise(focusArea, currentId) || getAiTeacherExerciseById('global_easy_a');
  }
  return getAiTeacherExerciseById(exerciseByFocus[focusArea]) || getAiTeacherDefaultExercise(focusArea);
}

function aiTeacherCompareShortProbe(beforeVector, afterVector, focusArea, exerciseId, history = []) {
  const beforeMetric = aiTeacherShortProbeMetric(beforeVector);
  const afterMetric = aiTeacherShortProbeMetric(afterVector);
  const beforeInstability = beforeMetric.scores[focusArea] ?? beforeMetric.instabilityScore;
  const afterInstability = afterMetric.scores[focusArea] ?? afterMetric.instabilityScore;
  const delta = afterInstability - beforeInstability;
  const improvementRatio = beforeInstability > 0 ? (beforeInstability - afterInstability) / beforeInstability : 0;
  const improved = improvementRatio >= 0.08 || delta < -1.5;
  const recentSame = history
    .filter((session) => session.exerciseId === exerciseId)
    .sort((left, right) => new Date(left.date) - new Date(right.date))
    .slice(-2);
  const recentTiny = recentSame.length >= 2 && recentSame.every((session) => {
    if (!Number.isFinite(session.beforeInstability) || !Number.isFinite(session.afterInstability)) return false;
    const base = Math.max(1, session.beforeInstability);
    return (session.beforeInstability - session.afterInstability) / base < 0.06;
  });
  const saturated = improvementRatio > 0 && improvementRatio < 0.1 && recentTiny;

  return {
    taskId: beforeVector?.taskId || afterVector?.taskId,
    beforeInstability,
    afterInstability,
    delta,
    improvementRatio,
    improved,
    retainedImprovement: improved,
    saturated,
    focusArea,
    exerciseId,
    beforeMetric,
    afterMetric,
  };
}

function aiTeacherClosedLoopDecision(estimate, history = []) {
  const exercise = aiTeacherSelectClosedLoopExercise(estimate, history);
  const focusArea = estimate?.category || 'global';
  return {
    focusArea,
    actionType: 'practice',
    exerciseId: exercise.id,
    reason: aiTeacherClosedLoopFinding(focusArea),
    userFacingPlan: {
      title: exercise.title,
      goal: exercise.goal,
      instruction: exercise.instruction,
      repetitions: exercise.repetitions,
      durationMinutes: exercise.durationMinutes,
      reProbeAfter: true,
    },
    hiddenDetails: {
      confidence: estimate?.confidence || 68,
      instabilityScore: estimate?.instabilityScore || 0,
      trend: 'short_loop',
      suppressedFindings: [],
    },
  };
}

window.AI_TEACHER_SHORT_PROBE_DEFAULT = AI_TEACHER_SHORT_PROBE_DEFAULT;
window.aiTeacherShortProbeMetric = aiTeacherShortProbeMetric;
window.aiTeacherBuildShortProbeEstimate = aiTeacherBuildShortProbeEstimate;
window.aiTeacherSelectClosedLoopExercise = aiTeacherSelectClosedLoopExercise;
window.aiTeacherCompareShortProbe = aiTeacherCompareShortProbe;
window.aiTeacherClosedLoopDecision = aiTeacherClosedLoopDecision;
window.aiTeacherClosedLoopFinding = aiTeacherClosedLoopFinding;
window.aiTeacherClosedLoopExerciseCue = aiTeacherClosedLoopExerciseCue;

const AI_TEACHER_TRANSFER_CHAIN = [
  { id: 'humming', label: 'humming', instruction: '先只做轻轻的 “mmm”，让声音放在舒服的位置。' },
  { id: 'humming_to_vowel', label: 'humming-to-vowel', instruction: '从 “mmm” 慢慢打开到一个舒服的元音。' },
  { id: 'vowel', label: 'vowel', instruction: '只唱一个元音，保持短、轻、稳。' },
  { id: 'syllable', label: 'syllable', instruction: '把元音放进一个简单音节，比如 “ma”。' },
  { id: 'word', label: 'word', instruction: '选一个短词，保持刚才同样的轻松感。' },
  { id: 'short_lyric_phrase', label: 'short lyric phrase', instruction: '唱一句很短的歌词，不追求表现，只追求稳定。' },
  { id: 'song_phrase', label: 'song phrase', instruction: '回到歌曲中的一句，带着刚才的稳定感唱。' },
];

function aiTeacherTransferIndex(levelId) {
  const index = AI_TEACHER_TRANSFER_CHAIN.findIndex((level) => level.id === levelId);
  return index >= 0 ? index : 0;
}

function aiTeacherGetTransferLevel(levelId = 'humming') {
  return AI_TEACHER_TRANSFER_CHAIN[aiTeacherTransferIndex(levelId)] || AI_TEACHER_TRANSFER_CHAIN[0];
}

function aiTeacherNextTransferLevel(levelId) {
  return AI_TEACHER_TRANSFER_CHAIN[Math.min(AI_TEACHER_TRANSFER_CHAIN.length - 1, aiTeacherTransferIndex(levelId) + 1)];
}

function aiTeacherPreviousTransferLevel(levelId) {
  return AI_TEACHER_TRANSFER_CHAIN[Math.max(0, aiTeacherTransferIndex(levelId) - 1)];
}

function aiTeacherChooseNextLessonStep(comparison, currentTransferLevel = 'humming') {
  if (comparison?.saturated) {
    return {
      action: 'increase_difficulty',
      transferLevel: aiTeacherNextTransferLevel(currentTransferLevel).id,
      message: '这个练习的收益开始变小了，我们换到下一个阶段。',
    };
  }
  if (comparison?.worsened) {
    return {
      action: 'decrease_difficulty',
      transferLevel: aiTeacherPreviousTransferLevel(currentTransferLevel).id,
      message: '这个难度有点高，我们退回上一层。',
    };
  }
  if (comparison?.retainedImprovement || comparison?.improved) {
    return {
      action: 'continue',
      transferLevel: currentTransferLevel,
      message: '这个练习对你有用，我们继续。',
    };
  }
  return {
    action: 'switch_exercise',
    transferLevel: aiTeacherPreviousTransferLevel(currentTransferLevel).id,
    message: '这个练习暂时没帮上忙，我们换一个更简单的。',
  };
}

function aiTeacherSuccessMemoryFromComparison(comparison, exercise, transferLevel) {
  if (!comparison?.retainedImprovement && !comparison?.improved) return null;
  const ratio = Math.max(0, comparison.improvementRatio || 0);
  return {
    id: `success-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    exerciseId: exercise?.id || comparison.exerciseId,
    exerciseTitle: exercise?.title || comparison.exerciseId,
    focusArea: comparison.focusArea,
    transferLevel: transferLevel?.id || transferLevel || 'humming',
    improvementPercent: Math.round(ratio * 100),
    text: `今天第一次成功：${exercise?.title || '这个练习'}，稳定度提升 ${Math.round(ratio * 100)}%。`,
  };
}

const previousCompareShortProbe = window.aiTeacherCompareShortProbe || aiTeacherCompareShortProbe;
function aiTeacherCompareShortProbeWithLesson(beforeVector, afterVector, focusArea, exerciseId, history = []) {
  const result = previousCompareShortProbe(beforeVector, afterVector, focusArea, exerciseId, history);
  const base = Math.max(1, result.beforeInstability || 0);
  const worsenRatio = (result.afterInstability - result.beforeInstability) / base;
  return {
    ...result,
    worsened: !result.improved && worsenRatio >= 0.08,
  };
}

window.AI_TEACHER_TRANSFER_CHAIN = AI_TEACHER_TRANSFER_CHAIN;
window.aiTeacherGetTransferLevel = aiTeacherGetTransferLevel;
window.aiTeacherNextTransferLevel = aiTeacherNextTransferLevel;
window.aiTeacherPreviousTransferLevel = aiTeacherPreviousTransferLevel;
window.aiTeacherChooseNextLessonStep = aiTeacherChooseNextLessonStep;
window.aiTeacherSuccessMemoryFromComparison = aiTeacherSuccessMemoryFromComparison;
window.aiTeacherCompareShortProbe = aiTeacherCompareShortProbeWithLesson;
window.aiTeacherSongBottleneckType = aiTeacherSongBottleneckType;
window.aiTeacherSelectCue = aiTeacherSelectCue;
window.aiTeacherTaskFromTransferLevel = aiTeacherTaskFromTransferLevel;

function aiTeacherCreateLessonState({ lessonId, goal, baselineVector, estimate, exercise, transferLevel = 'humming' }) {
  const focusArea = estimate?.category || 'global';
  const cue = aiTeacherSelectCue(focusArea, null);
  const currentTask = aiTeacherTaskFromTransferLevel(transferLevel, focusArea);
  const baselineAttempt = {
    id: baselineVector?.id || `baseline-${Date.now()}`,
    role: 'baseline',
    attempt_index: 1,
    timestamp: baselineVector?.timestamp || new Date().toISOString(),
    vector: baselineVector,
    metric: aiTeacherShortProbeMetric(baselineVector),
    cueId: cue.id,
    exerciseId: exercise?.id,
    task: currentTask,
  };
  return {
    lesson_id: lessonId || `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    current_goal: goal || aiTeacherClosedLoopFinding(estimate?.category || 'global'),
    currentGoal: goal || aiTeacherClosedLoopFinding(estimate?.category || 'global'),
    current_task: currentTask,
    currentTask,
    baseline_recording_features: baselineVector?.features || {},
    baselineRecordingFeatures: baselineVector?.features || {},
    baseline_vector: baselineVector || null,
    baselineAttempt,
    attempts: [baselineAttempt],
    attemptHistory: [baselineAttempt],
    best_attempt: {
      attempt_index: 1,
      vector: baselineVector,
      metric: aiTeacherShortProbeMetric(baselineVector),
      cueId: cue.id,
      exerciseId: exercise?.id,
      task: currentTask,
    },
    bestAttempt: {
      attempt_index: 1,
      vector: baselineVector,
      metric: aiTeacherShortProbeMetric(baselineVector),
      cueId: cue.id,
      exerciseId: exercise?.id,
      task: currentTask,
    },
    current_exercise: exercise || null,
    current_exercise_id: exercise?.id || null,
    currentExercise: exercise || null,
    active_cue: cue,
    activeCue: cue,
    cue_history: [],
    cueHistory: [],
    exercise_history: exercise ? [{
      exerciseId: exercise.id,
      startedAt: new Date().toISOString(),
      transferLevel,
      reason: 'baseline_probe',
    }] : [],
    exerciseHistory: exercise ? [{
      exerciseId: exercise.id,
      startedAt: new Date().toISOString(),
      transferLevel,
      reason: 'baseline_probe',
    }] : [],
    no_improvement_count: 0,
    noImprovementCount: 0,
    saturation_count: 0,
    saturationCount: 0,
    transfer_level: transferLevel,
    transferLevel,
    last_change: null,
    lastChange: null,
    next_action: 'practice',
    lastDecision: null,
    song_first_mode: transferLevel === 'song_phrase',
    songFirstMode: transferLevel === 'song_phrase',
    bottleneck_type: transferLevel === 'song_phrase' ? aiTeacherSongBottleneckType(baselineVector) : null,
  };
}

function aiTeacherMetricForFocus(vector, focusArea) {
  const metric = aiTeacherShortProbeMetric(vector);
  return metric.scores[focusArea] ?? metric.instabilityScore;
}

function aiTeacherCompareLessonAttempt({ lessonState, currentVector, focusArea, exerciseId }) {
  const baselineVector = lessonState?.baseline_vector;
  const previousAttempt = (lessonState?.attempts || []).filter((attempt) => attempt.role !== 'baseline').slice(-1)[0];
  const previousVector = previousAttempt?.vector || baselineVector;
  const bestVector = lessonState?.best_attempt?.vector || baselineVector;
  const baselineScore = aiTeacherMetricForFocus(baselineVector, focusArea);
  const previousScore = aiTeacherMetricForFocus(previousVector, focusArea);
  const bestScore = aiTeacherMetricForFocus(bestVector, focusArea);
  const currentScore = aiTeacherMetricForFocus(currentVector, focusArea);
  const baselineDelta = currentScore - baselineScore;
  const previousDelta = currentScore - previousScore;
  const bestDelta = currentScore - bestScore;
  const baselineImprovement = baselineScore > 0 ? (baselineScore - currentScore) / baselineScore : 0;
  const previousImprovement = previousScore > 0 ? (previousScore - currentScore) / previousScore : 0;
  const bestSoFar = currentScore < bestScore - Math.max(0.8, bestScore * 0.05);
  const improved = baselineImprovement >= 0.08 || previousImprovement >= 0.08 || bestSoFar;
  const worse = previousDelta > Math.max(1.2, previousScore * 0.08);
  const unchanged = !improved && !worse;
  const result = improved ? 'improved' : worse ? 'worse' : 'unchanged';

  return {
    result,
    improved,
    unchanged,
    worse,
    best_so_far: bestSoFar,
    currentScore,
    baselineScore,
    previousScore,
    bestScore,
    baselineDelta,
    previousDelta,
    bestDelta,
    baselineImprovement,
    previousImprovement,
    focusArea,
    exerciseId,
  };
}

function aiTeacherDescribeLessonChange(change, lessonState) {
  const attemptNumber = lessonState?.best_attempt?.attempt_index || (lessonState?.attempts || []).length;
  if (change.best_so_far) return `刚才那个感觉出来了。今天最好的一次：第 ${attemptNumber} 次。`;
  if (change.improved) return '比刚才稳定一点。我们先固定这个感觉。';
  if (change.worse) return '这次没有刚才好，难度可能有点高。';
  return '变化不大，我们再判断一下要不要换练习。';
}

function aiTeacherDecideFromLessonState(lessonState, change) {
  const noImprovementCount = change.improved ? 0 : (lessonState.no_improvement_count || 0) + 1;
  const saturationCount = change.improved && Math.abs(change.previousImprovement || 0) < 0.06
    ? (lessonState.saturation_count || 0) + 1
    : 0;
  if (change.best_so_far) {
    return {
      action: 'continue',
      noImprovementCount,
      saturationCount,
      transferLevel: lessonState.transfer_level,
      reason: '刚才那个感觉最接近目标，我们固定一下。',
    };
  }
  if (noImprovementCount >= 2) {
    return {
      action: 'switch_exercise',
      noImprovementCount,
      saturationCount,
      transferLevel: aiTeacherPreviousTransferLevel(lessonState.transfer_level).id,
      reason: '我们不继续这个练习了，因为连续两次没有变化。',
    };
  }
  if (change.worse) {
    return {
      action: 'decrease_difficulty',
      noImprovementCount,
      saturationCount,
      transferLevel: aiTeacherPreviousTransferLevel(lessonState.transfer_level).id,
      reason: '现在进入歌词前还太早，先退回上一层把声音稳定住。',
    };
  }
  if (saturationCount >= 2) {
    return {
      action: 'increase_difficulty',
      noImprovementCount,
      saturationCount,
      transferLevel: aiTeacherNextTransferLevel(lessonState.transfer_level).id,
      reason: '这个练习开始饱和了，进入下一层。',
    };
  }
  if (change.improved) {
    return {
      action: 'continue',
      noImprovementCount,
      saturationCount,
      transferLevel: lessonState.transfer_level,
      reason: '今天先练这个，因为它刚刚让声音更稳定了一点。',
    };
  }
  return {
    action: 'practice',
    noImprovementCount,
    saturationCount,
    transferLevel: lessonState.transfer_level,
    reason: '变化还不大，我们再试一次确认。',
  };
}

function aiTeacherBuildNextInstruction(lessonState, change, decision) {
  const exercise = lessonState.current_exercise || lessonState.currentExercise;
  const cue = lessonState.active_cue || lessonState.activeCue || aiTeacherSelectCue(change.focusArea, lessonState);
  if (change.best_so_far) {
    return `第 ${lessonState.best_attempt?.attempt_index || '刚才'} 次是目前最好的一次。先不要换练习，请用刚才同样的感觉再唱一次。`;
  }
  if (decision.action === 'switch_exercise') {
    return '这个练习暂时帮不上忙，我们换一个方向。';
  }
  if (decision.action === 'decrease_difficulty') {
    return '这次难度有点高。缩短片段，只唱最小的那一下。';
  }
  if (decision.action === 'increase_difficulty') {
    return '这个层级开始稳定了，我们回到更接近歌曲的片段试一下。';
  }
  return `${cue.text} 做 ${exercise?.repetitions || 3} 次，然后立刻复测同一个声音。`;
}

function aiTeacherUpdateLessonStateAfterAttempt({ lessonState, currentVector, focusArea, exercise }) {
  const activeCue = lessonState.active_cue || lessonState.activeCue || aiTeacherSelectCue(focusArea, lessonState);
  const change = aiTeacherCompareLessonAttempt({
    lessonState,
    currentVector,
    focusArea,
    exerciseId: exercise?.id || lessonState?.current_exercise?.id,
  });
  const decision = aiTeacherDecideFromLessonState(lessonState, change);
  const attemptIndex = (lessonState.attempts || []).length + 1;
  const currentTask = aiTeacherTaskFromTransferLevel(lessonState.transfer_level, focusArea);
  const attempt = {
    id: currentVector?.id || `attempt-${Date.now()}`,
    role: 'retest',
    attempt_index: attemptIndex,
    timestamp: currentVector?.timestamp || new Date().toISOString(),
    vector: currentVector,
    metric: aiTeacherShortProbeMetric(currentVector),
    change,
    decision,
    exerciseId: exercise?.id || lessonState?.current_exercise?.id,
    transferLevel: lessonState.transfer_level,
    cueId: activeCue.id,
    cueText: activeCue.text,
    task: currentTask,
  };
  const cueRecord = {
    cueId: activeCue.id,
    cueText: activeCue.text,
    effective: change.improved || change.best_so_far,
    result: change.result,
    attempt_index: attemptIndex,
    at: new Date().toISOString(),
  };
  const exerciseRecord = {
    exerciseId: exercise?.id || lessonState?.current_exercise?.id,
    at: new Date().toISOString(),
    transferLevel: lessonState.transfer_level,
    result: change.result,
    improved: change.improved || change.best_so_far,
    decision: decision.action,
  };
  const bestAttempt = change.best_so_far
    ? {
      attempt_index: attemptIndex,
      vector: currentVector,
      metric: attempt.metric,
      cueId: activeCue.id,
      exerciseId: exercise?.id || lessonState?.current_exercise?.id,
      task: currentTask,
    }
    : lessonState.best_attempt;
  const nextCue = change.improved || change.best_so_far
    ? activeCue
    : aiTeacherSelectCue(focusArea, {
      ...lessonState,
      cueHistory: [...(lessonState.cueHistory || lessonState.cue_history || []), cueRecord],
    });
  const nextInstruction = aiTeacherBuildNextInstruction(
    { ...lessonState, current_exercise: exercise || lessonState.current_exercise, active_cue: nextCue, best_attempt: bestAttempt },
    change,
    decision
  );
  return {
    ...lessonState,
    attempts: [...(lessonState.attempts || []), attempt],
    attemptHistory: [...(lessonState.attemptHistory || lessonState.attempts || []), attempt],
    best_attempt: bestAttempt,
    bestAttempt,
    current_exercise: exercise || lessonState.current_exercise,
    currentExercise: exercise || lessonState.currentExercise,
    current_task: currentTask,
    currentTask,
    active_cue: nextCue,
    activeCue: nextCue,
    cue_history: [...(lessonState.cue_history || lessonState.cueHistory || []), cueRecord],
    cueHistory: [...(lessonState.cueHistory || lessonState.cue_history || []), cueRecord],
    exercise_history: [...(lessonState.exercise_history || []), exerciseRecord],
    exerciseHistory: [...(lessonState.exerciseHistory || lessonState.exercise_history || []), exerciseRecord],
    no_improvement_count: decision.noImprovementCount,
    noImprovementCount: decision.noImprovementCount,
    saturation_count: decision.saturationCount,
    saturationCount: decision.saturationCount,
    transfer_level: decision.transferLevel,
    transferLevel: decision.transferLevel,
    last_change: change,
    lastChange: change,
    next_action: decision.action,
    lastDecision: {
      action: decision.action,
      reason: decision.reason,
      nextInstruction,
      at: new Date().toISOString(),
      change: change.result,
    },
    teaching_reason: decision.reason,
    next_instruction: nextInstruction,
    song_first_mode: lessonState.song_first_mode || lessonState.songFirstMode || false,
    songFirstMode: lessonState.songFirstMode || lessonState.song_first_mode || false,
    bottleneck_type: (lessonState.song_first_mode || lessonState.songFirstMode)
      ? (lessonState.bottleneck_type || aiTeacherSongBottleneckType(currentVector))
      : null,
  };
}

function aiTeacherLessonStateSummary(lessonState) {
  if (!lessonState) return '先听一条短声音，然后我决定今天只练什么。';
  const attemptCount = Math.max(0, (lessonState.attempts || []).length - 1);
  const bestIndex = lessonState.best_attempt?.attempt_index || 1;
  const change = lessonState.last_change;
  const changeText = change ? aiTeacherDescribeLessonChange(change, lessonState) : '我已经记住 baseline，接下来只做一个练习。';
  return `现在第 ${attemptCount + 1} 次。${changeText}${changeText.includes('今天最好的一次') ? '' : ` 今天最好的一次：第 ${bestIndex} 次。`}`;
}

window.aiTeacherCreateLessonState = aiTeacherCreateLessonState;
window.aiTeacherCompareLessonAttempt = aiTeacherCompareLessonAttempt;
window.aiTeacherUpdateLessonStateAfterAttempt = aiTeacherUpdateLessonStateAfterAttempt;
window.aiTeacherDescribeLessonChange = aiTeacherDescribeLessonChange;
window.aiTeacherDecideFromLessonState = aiTeacherDecideFromLessonState;
window.aiTeacherLessonStateSummary = aiTeacherLessonStateSummary;
