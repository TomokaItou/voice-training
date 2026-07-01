function getAiTeacherCategoryForFeature(featureName) {
  if (/pitch_mean|pitch_std/.test(featureName)) return 'pitch';
  if (/loudness_mean|loudness_std/.test(featureName)) return 'breath';
  if (/spectral_centroid|spectral_tilt|formant/.test(featureName)) return 'resonance';
  if (/hnr|harmonicity/.test(featureName)) return 'closure';
  if (/hubert|embedding/.test(featureName)) return 'global';
  return 'unknown';
}

function getAiTeacherCategoryLabel(category) {
  const labels = {
    pitch: '音高控制',
    breath: '音量/气息稳定性',
    resonance: '共鸣或元音形状',
    closure: '闭合/漏气/声带振动稳定性',
    global: '整体音色/发声状态',
    unknown: '整体可复现性',
  };
  return labels[category] || labels.unknown;
}

function getAiTeacherEstimateCategory(estimate) {
  const dominant = estimate?.dominantFeatures?.[0];
  return getAiTeacherCategoryForFeature(dominant || '');
}

function diagnoseAiTeacherEstimate(estimate) {
  return `主要不稳定方向可能是${getAiTeacherCategoryLabel(getAiTeacherEstimateCategory(estimate))}。`;
}

function recommendAiTeacherExercise(estimate) {
  const category = getAiTeacherEstimateCategory(estimate);
  if (category === 'pitch') {
    return '练习：稳定音高保持 3 秒，然后做 very slow pitch glide。每次只追求更可复现，不追求更高。';
  }
  if (category === 'breath') {
    return '练习：在同一个元音上做 soft-to-normal crescendo，保持气流不断，音色不突然变亮或变紧。';
  }
  if (category === 'resonance') {
    return '练习：/a/ → /i/ → /u/ 慢速元音转换，保持同一音高和同一音量。';
  }
  if (category === 'closure') {
    return '练习：轻微 creaky onset → open vowel，或 gentle semi-occluded exercise，比如轻哼或吸管发声。';
  }
  if (category === 'global') {
    return '练习：重复最容易的 probe，保存最好和最差两次，先做整体状态对照。';
  }
  return '练习：选最容易的 sustained /a/，录 3 次，听出最稳定的一次并模仿。';
}

function getAiTeacherFeatureImportance(estimate) {
  const vector = estimate?.leadingEigenvector || {};
  const total = Object.values(vector).reduce((sum, value) => sum + Math.abs(value || 0), 0) || 1;
  return Object.entries(vector)
    .map(([feature, weight]) => ({
      feature,
      weight,
      importance: Math.abs(weight || 0) / total,
      category: getAiTeacherCategoryForFeature(feature),
    }))
    .sort((left, right) => right.importance - left.importance);
}

function getAiTeacherConfidence(estimate, sampleCount = 0, historyCount = 0) {
  const eigenvalues = estimate?.eigenvalues || [];
  const top = eigenvalues[0] || 0;
  const second = eigenvalues[1] || 0;
  const separation = top > 0 ? Math.max(0, Math.min(1, (top - second) / top)) : 0;
  const sampleScore = Math.min(1, sampleCount / 5);
  const historyScore = Math.min(1, historyCount / 3);
  const featureScore = Math.min(1, (estimate?.dominantFeatures?.length || 0) / 3);
  return Math.round((0.46 * sampleScore + 0.28 * separation + 0.16 * historyScore + 0.1 * featureScore) * 100);
}

function enrichAiTeacherEstimate(estimate, context = {}) {
  const sampleCount = context.sampleCount || context.vectors?.filter((vector) => vector.taskId === estimate.taskId).length || 0;
  const historyCount = context.historyCount || 0;
  const confidence = getAiTeacherConfidence(estimate, sampleCount, historyCount);
  return {
    ...estimate,
    category: getAiTeacherEstimateCategory(estimate),
    confidence,
    featureImportance: getAiTeacherFeatureImportance(estimate),
    diagnosis: diagnoseAiTeacherEstimate(estimate),
    recommendedExercise: recommendAiTeacherExercise(estimate),
  };
}

window.getAiTeacherCategoryForFeature = getAiTeacherCategoryForFeature;
window.getAiTeacherCategoryLabel = getAiTeacherCategoryLabel;
window.getAiTeacherEstimateCategory = getAiTeacherEstimateCategory;
window.getAiTeacherFeatureImportance = getAiTeacherFeatureImportance;
window.getAiTeacherConfidence = getAiTeacherConfidence;
window.diagnoseAiTeacherEstimate = diagnoseAiTeacherEstimate;
window.recommendAiTeacherExercise = recommendAiTeacherExercise;
window.enrichAiTeacherEstimate = enrichAiTeacherEstimate;
