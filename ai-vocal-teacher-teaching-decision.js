function aiTeacherFocusFromEstimate(estimate) {
  const category = estimate?.category || getAiTeacherEstimateCategory(estimate);
  const dominantText = (estimate?.dominantFeatures || []).join(' ');
  if (category === 'register' || /register/.test(dominantText) || estimate?.taskId === 'short_glide') return 'register';
  if (/harmonicity|hnr/.test(dominantText)) return 'onset';
  if (category === 'breath') return 'breath';
  if (category === 'resonance') return 'resonance';
  if (category === 'closure') return 'closure';
  if (category === 'pitch') return 'pitch';
  return 'global';
}

function aiTeacherNormalizeConfidence(value) {
  if (!Number.isFinite(value)) return 0;
  return value > 1 ? value / 100 : value;
}

function aiTeacherRecentInstabilityRising(records, taskId) {
  const recent = records
    .filter((record) => !taskId || record.taskId === taskId)
    .filter((record) => Number.isFinite(record.instabilityScore))
    .sort((left, right) => new Date(left.date) - new Date(right.date))
    .slice(-3);
  if (recent.length < 3) return false;
  return recent[2].instabilityScore > recent[1].instabilityScore &&
    recent[1].instabilityScore > recent[0].instabilityScore;
}

function aiTeacherStableImprovement(records, focusArea) {
  const recent = records
    .filter((record) => record.category === focusArea || aiTeacherFocusFromEstimate(record) === focusArea)
    .filter((record) => Number.isFinite(record.instabilityScore))
    .sort((left, right) => new Date(left.date) - new Date(right.date))
    .slice(-4);
  if (recent.length < 3) return false;
  return recent.every((record, index) => index === 0 || record.instabilityScore <= recent[index - 1].instabilityScore);
}

function aiTeacherSameExerciseNoImprovement(teachingHistory, exerciseId) {
  const recent = teachingHistory
    .filter((session) => session.exerciseId === exerciseId)
    .sort((left, right) => new Date(left.date) - new Date(right.date))
    .slice(-2);
  return recent.length >= 2 && recent.every((session) => session.improved === false);
}

function buildAiTeacherDecisionPlan(actionType, focusArea, exercise, reason, hiddenDetails) {
  const titleByAction = {
    probe_more: '先补几条最简单的声音',
    practice: exercise.title,
    reprobe: '复测同一个声音',
    increase_difficulty: `稍微升级：${exercise.title}`,
    decrease_difficulty: `降低难度：${exercise.title}`,
    switch_exercise: `换一个版本：${exercise.title}`,
  };
  return {
    focusArea,
    actionType,
    exerciseId: exercise.id,
    reason,
    userFacingPlan: {
      title: titleByAction[actionType] || exercise.title,
      goal: exercise.goal,
      instruction: exercise.instruction,
      repetitions: exercise.repetitions,
      durationMinutes: exercise.durationMinutes,
      reProbeAfter: true,
    },
    hiddenDetails,
  };
}

function decideNextTeachingAction(input = {}) {
  const estimate = input.estimate || input.currentDiagnosis || {};
  const focusArea = input.focusArea || aiTeacherFocusFromEstimate(estimate);
  const confidence = aiTeacherNormalizeConfidence(input.confidence ?? estimate.confidence);
  const teachingHistory = input.teachingHistory || [];
  const previousSessions = input.previousSessions || input.memoryRecords || [];
  const beforeAfter = input.beforeAfterResult || input.comparison || null;
  const currentExerciseId =
    input.currentExerciseId ||
    teachingHistory.slice().reverse().find((session) => session.focusArea === focusArea)?.exerciseId ||
    getAiTeacherDefaultExercise(focusArea)?.id;
  const suppressedFindings = input.suppressedFindings || aiTeacherBuildHypotheses(estimate)
    .filter((hypothesis) => hypothesis.category !== focusArea)
    .map((hypothesis) => hypothesis.label);
  const hiddenDetails = {
    confidence,
    instabilityScore: estimate.instabilityScore || 0,
    trend: input.trend?.direction || input.trend || 'unknown',
    suppressedFindings,
  };

  if (confidence < 0.55) {
    return buildAiTeacherDecisionPlan(
      'probe_more',
      'global',
      getAiTeacherExerciseById('global_easy_a'),
      '我还不够确定，先再录几次最简单的声音。',
      hiddenDetails
    );
  }

  if (aiTeacherRecentInstabilityRising(previousSessions, estimate.taskId)) {
    return buildAiTeacherDecisionPlan(
      'decrease_difficulty',
      focusArea,
      getAiTeacherEasierExercise(focusArea, currentExerciseId),
      '最近这个动作不太稳定，我们先降低难度。',
      hiddenDetails
    );
  }

  if (aiTeacherSameExerciseNoImprovement(teachingHistory, currentExerciseId)) {
    return buildAiTeacherDecisionPlan(
      'switch_exercise',
      focusArea,
      getAiTeacherAlternateExercise(focusArea, currentExerciseId),
      '这个练习暂时不太有效，我们换一个更容易找到感觉的版本。',
      hiddenDetails
    );
  }

  if (beforeAfter?.improved) {
    return buildAiTeacherDecisionPlan(
      'practice',
      focusArea,
      getAiTeacherExerciseById(currentExerciseId) || getAiTeacherDefaultExercise(focusArea),
      '这个练习可能有效，今天继续巩固。',
      hiddenDetails
    );
  }

  if (aiTeacherStableImprovement(previousSessions, focusArea)) {
    return buildAiTeacherDecisionPlan(
      'increase_difficulty',
      focusArea,
      getAiTeacherHarderExercise(focusArea, currentExerciseId),
      '这个方向已经稳定一些了，我们稍微增加难度。',
      hiddenDetails
    );
  }

  return buildAiTeacherDecisionPlan(
    'practice',
    focusArea,
    getAiTeacherDefaultExercise(focusArea),
    '今天先练最值得改善的一件事。',
    hiddenDetails
  );
}

function summarizeTeachingDecision(decision) {
  if (!decision) return '我还需要更多录音，先不急着判断。';
  if (decision.actionType === 'probe_more') return '我还需要更多录音，先不急着判断。';
  if (decision.actionType === 'decrease_difficulty') return '最近不稳定性上升了，先不要加难度。';
  if (decision.actionType === 'switch_exercise') return '这次没有明显变化，可能练习还太难，下一次换一个更容易的版本。';
  if (decision.actionType === 'increase_difficulty') return '这个方向已经稳定一些了，我们稍微增加难度。';
  return '这个练习对你可能有效，我们先继续巩固。';
}

window.aiTeacherFocusFromEstimate = aiTeacherFocusFromEstimate;
window.decideNextTeachingAction = decideNextTeachingAction;
window.summarizeTeachingDecision = summarizeTeachingDecision;
