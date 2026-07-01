const AI_TEACHER_MEMORY_AREAS = [
  { id: 'pitch', label: 'Pitch Memory' },
  { id: 'breath', label: 'Breath Stability' },
  { id: 'resonance', label: 'Resonance Stability' },
  { id: 'closure', label: 'Closure Stability' },
];

function aiTeacherCategoryFromEstimate(estimate) {
  return estimate?.category || getAiTeacherEstimateCategory(estimate);
}

function aiTeacherCreateMemoryRecords({ phase, estimates, vectors, sessionId }) {
  const now = new Date().toISOString();
  return estimates.map((estimate) => ({
    id: `memory-${phase}-${estimate.taskId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: now,
    sessionId,
    phase,
    taskId: estimate.taskId,
    featureMean: estimate.mean,
    covariance: estimate.covariance,
    eigenvalues: estimate.eigenvalues,
    leadingEigenvector: estimate.leadingEigenvector,
    dominantDirection: estimate.dominantFeatures,
    dominantFeatures: estimate.dominantFeatures,
    featureImportance: estimate.featureImportance || getAiTeacherFeatureImportance(estimate),
    instabilityScore: estimate.instabilityScore,
    diagnosis: estimate.diagnosis,
    confidence: estimate.confidence || getAiTeacherConfidence(
      estimate,
      vectors.filter((vector) => vector.taskId === estimate.taskId).length,
      0
    ),
    category: aiTeacherCategoryFromEstimate(estimate),
  }));
}

function aiTeacherAppendMemoryRecords(existingRecords, records) {
  return [...existingRecords, ...records]
    .sort((left, right) => new Date(left.date) - new Date(right.date))
    .slice(-160);
}

function aiTeacherRecordsForCategory(records, category) {
  return records.filter((record) => record.category === category);
}

function aiTeacherLatestByTask(records, taskId) {
  return records
    .filter((record) => record.taskId === taskId)
    .sort((left, right) => new Date(right.date) - new Date(left.date))[0] || null;
}

function aiTeacherTrendForRecords(records) {
  const source = records
    .filter((record) => Number.isFinite(record.instabilityScore))
    .sort((left, right) => new Date(left.date) - new Date(right.date))
    .slice(-3);
  if (source.length < 2) {
    return {
      direction: 'unknown',
      text: '我还需要更多训练记录，才能判断长期趋势。',
      change: 0,
      count: source.length,
    };
  }
  const first = source[0].instabilityScore;
  const last = source[source.length - 1].instabilityScore;
  const change = last - first;
  const relative = Math.abs(change) / Math.max(Math.abs(first), 1e-6);
  if (change < 0 && relative > 0.05) {
    return {
      direction: 'improving',
      text: `过去 ${source.length} 次训练里，${getAiTeacherCategoryLabel(source[source.length - 1].category)}持续提高。`,
      change,
      count: source.length,
    };
  }
  if (relative <= 0.05) {
    return {
      direction: 'flat',
      text: `最近 ${source.length} 次变化不大，还没有明显改善。`,
      change,
      count: source.length,
    };
  }
  return {
    direction: 'worse',
    text: `最近 ${source.length} 次里不稳定性上升了，建议先降低练习难度。`,
    change,
    count: source.length,
  };
}

function aiTeacherTrendForEstimate(estimate, memoryRecords) {
  const records = memoryRecords.filter((record) => record.taskId === estimate.taskId);
  return aiTeacherTrendForRecords(records);
}

function aiTeacherMemoryScoreForCategory(records, category) {
  const categoryRecords = aiTeacherRecordsForCategory(records, category).slice(-5);
  if (!categoryRecords.length) return 0;
  const avgInstability = aiTeacherMean(categoryRecords.map((record) => record.instabilityScore));
  const confidence = aiTeacherMean(categoryRecords.map((record) => record.confidence || 40)) / 100;
  const normalized = 1 / (1 + Math.max(0, avgInstability) / 1000);
  return Math.round(Math.max(0, Math.min(100, normalized * 82 * confidence + 12)));
}

function aiTeacherBuildMemoryDashboard(records) {
  return AI_TEACHER_MEMORY_AREAS.map((area) => ({
    ...area,
    score: aiTeacherMemoryScoreForCategory(records, area.id),
    trend: aiTeacherTrendForRecords(aiTeacherRecordsForCategory(records, area.id)),
  }));
}

function aiTeacherBuildHypotheses(estimate) {
  const importance = estimate?.featureImportance || getAiTeacherFeatureImportance(estimate);
  const categoryScores = {};
  importance.forEach((item) => {
    categoryScores[item.category] = (categoryScores[item.category] || 0) + item.importance;
  });
  const total = Object.values(categoryScores).reduce((sum, value) => sum + value, 0) || 1;
  return Object.entries(categoryScores)
    .filter(([category]) => category !== 'unknown')
    .map(([category, score]) => ({
      category,
      label: getAiTeacherCategoryLabel(category),
      probability: Math.round((score / total) * 100),
    }))
    .sort((left, right) => right.probability - left.probability)
    .slice(0, 4);
}

function aiTeacherBuildTimeline(records) {
  const byDay = new Map();
  records.forEach((record) => {
    const day = (record.date || '').slice(0, 10) || 'Unknown day';
    const dayRecords = byDay.get(day) || [];
    dayRecords.push(record);
    byDay.set(day, dayRecords);
  });
  return [...byDay.entries()].map(([day, dayRecords]) => ({
    day,
    records: dayRecords,
    averageInstability: aiTeacherMean(dayRecords.map((record) => record.instabilityScore)),
  }));
}

window.AI_TEACHER_MEMORY_AREAS = AI_TEACHER_MEMORY_AREAS;
window.aiTeacherCreateMemoryRecords = aiTeacherCreateMemoryRecords;
window.aiTeacherAppendMemoryRecords = aiTeacherAppendMemoryRecords;
window.aiTeacherLatestByTask = aiTeacherLatestByTask;
window.aiTeacherTrendForEstimate = aiTeacherTrendForEstimate;
window.aiTeacherBuildMemoryDashboard = aiTeacherBuildMemoryDashboard;
window.aiTeacherBuildHypotheses = aiTeacherBuildHypotheses;
window.aiTeacherBuildTimeline = aiTeacherBuildTimeline;
