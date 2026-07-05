function aiTeacherBestAttemptReasons(vector) {
  if (!vector) return [];
  const features = vector.features || {};
  const reasons = [];
  if (Number.isFinite(features.pitch_std)) {
    reasons.push(`Pitch variance ${features.pitch_std <= 8 ? '↓' : 'still visible'} (${features.pitch_std.toFixed(1)})`);
  }
  if (Number.isFinite(features.loudness_std)) {
    reasons.push(features.loudness_std <= 6 ? 'Loudness stable' : `Loudness varied (${features.loudness_std.toFixed(1)})`);
  }
  if (Number.isFinite(vector.durationMs)) {
    reasons.push(`Duration ${(vector.durationMs / 1000).toFixed(1)} s`);
  }
  if (Number.isFinite(features.harmonicity_mean)) {
    reasons.push(`Harmonicity ${Math.round(features.harmonicity_mean * 100)}%`);
  }
  return reasons;
}

function aiTeacherBuildBestAttemptTeaching(bestVector) {
  const reasons = aiTeacherBestAttemptReasons(bestVector);
  return {
    attemptId: bestVector?.attemptId || null,
    reasons,
    text: bestVector
      ? `这条最接近你目前真正能做到的状态。${reasons.join('，')}。`
      : '完成一组录音后，我会找出最接近你当前能力上限的一次。',
  };
}

function aiTeacherBuildTeacherDiary({ selectedEstimate, trend, comparison, bestTeaching, memoryRecords }) {
  const category = getAiTeacherCategoryLabel(selectedEstimate?.category || 'unknown');
  const confidence = selectedEstimate?.confidence || 0;
  const hasHistory = memoryRecords.length >= 2;
  const lines = [];

  if (comparison) {
    lines.push(comparison.improved
      ? `今天我看到一个重要变化：${category}的主要不稳定性下降了。`
      : `今天的复测还没有明显下降，${category}可能需要更小、更慢的练习。`);
  } else if (trend?.direction === 'improving') {
    lines.push(`今天最大的线索不是单次分数，而是趋势：${trend.text}`);
  } else if (hasHistory) {
    lines.push(`今天我更关注可复现性。${trend?.text || '最近的记录还在形成中。'}`);
  } else {
    lines.push(`今天是我建立你声音记忆的起点，我先记录哪些状态最容易重复，哪些状态最容易散。`);
  }

  if (bestTeaching?.attemptId) {
    lines.push(`第 ${bestTeaching.attemptId} 次最值得回听，因为它更接近你现在真正能稳定做到的状态。`);
  }

  if (confidence < 50) {
    lines.push('我现在还不够确定，建议继续录几次，让判断更稳。');
  } else if (confidence >= 80) {
    lines.push('这次判断的把握比较高，下一次可以继续沿着同一个方向复查。');
  } else {
    lines.push('这个判断已经有参考价值，但我还会继续根据后面的 probe 更新。');
  }

  return lines.join('\n\n');
}

function aiTeacherBuildExplainability(estimate) {
  const importance = estimate?.featureImportance || getAiTeacherFeatureImportance(estimate);
  const top = importance.slice(0, 4);
  return {
    usedFeatures: Object.keys(estimate?.mean || {}),
    largestMovers: top.map((item) => item.feature),
    support: top.map((item) => ({
      feature: item.feature,
      category: item.category,
      weight: item.weight,
      importance: item.importance,
    })),
  };
}

function aiTeacherBuildResearchSnapshot(estimate) {
  return {
    mu: estimate?.mean || {},
    covariance: estimate?.covariance || [],
    eigenvalues: estimate?.eigenvalues || [],
    eigenvectors: estimate?.leadingEigenvector || {},
    dominantDirection: estimate?.dominantFeatures || [],
    featureImportance: estimate?.featureImportance || [],
  };
}

function generateTeacherAction(estimate, context = {}) {
  const decision = decideNextTeachingAction({
    estimate,
    confidence: estimate?.confidence,
    dominantFeatures: estimate?.dominantFeatures,
    instabilityScore: estimate?.instabilityScore,
    previousSessions: context.memoryRecords || [],
    teachingHistory: context.teachingHistory || [],
    beforeAfterResult: context.beforeAfterResult || null,
    trend: context.trend || null,
    currentExerciseId: context.currentExerciseId || null,
  });
  const plan = decision.userFacingPlan;
  if (decision) {
    return {
      mainFinding: decision.reason,
      oneThingToPractice: plan.title,
      practiceInstruction: plan.instruction,
      practiceRepetitions: plan.repetitions,
      reProbeInstruction: plan.reProbeAfter
        ? `做完 ${plan.repetitions} 次后，复测同一个声音。`
        : '做完后先休息，不急着复测。',
      suppressedFindings: decision.hiddenDetails.suppressedFindings || [],
      reasonForChoosing: decision.reason,
      teachingDecision: decision,
    };
  }

  const category = estimate?.category || getAiTeacherEstimateCategory(estimate);
  const hypotheses = aiTeacherBuildHypotheses(estimate);
  const suppressedFindings = hypotheses
    .filter((hypothesis) => hypothesis.category !== category)
    .map((hypothesis) => hypothesis.label);

  const actions = {
    closure: {
      mainFinding: '我发现最影响稳定性的地方，是声音刚开始的瞬间。',
      oneThingToPractice: '轻轻开始一个 “a——”，不要一下子推出来。',
      practiceInstruction: '每次从很小的声音开始，保持 3 秒，结束也轻一点。',
      practiceRepetitions: 5,
      reProbeInstruction: '练 5 次后，我们再录同一个声音，看看起音有没有更稳。',
      reasonForChoosing: '起音和声带振动相关的波动最支持这个判断。',
    },
    pitch: {
      mainFinding: '你的声音最需要先稳定的是音高。',
      oneThingToPractice: '唱一个舒服的 “a——”，只保持同一个音高 3 秒。',
      practiceInstruction: '不要追求高音，不要加大音量。每次只让音高更稳一点。',
      practiceRepetitions: 5,
      reProbeInstruction: '练 5 次后，我们再测一次同样的声音。',
      reasonForChoosing: '音高相关特征是这轮最主要的变化方向。',
    },
    breath: {
      mainFinding: '你的声音现在最容易变动的是音量和气息。',
      oneThingToPractice: '从小声开始，慢慢变到正常音量。',
      practiceInstruction: '同一个元音，气流不断，音量慢慢变大，不要突然推。',
      practiceRepetitions: 5,
      reProbeInstruction: '练 5 次后，我们再测一次音量是否更可控。',
      reasonForChoosing: '音量稳定度和响度变化最支持这个判断。',
    },
    resonance: {
      mainFinding: '你的元音形状和共鸣位置还不够稳定。',
      oneThingToPractice: '慢慢从 “a——” 过渡到 “i——”。',
      practiceInstruction: '音高和音量都别变，只让嘴型慢慢移动。',
      practiceRepetitions: 5,
      reProbeInstruction: '练 5 次后，我们再测一次元音变化是否更稳。',
      reasonForChoosing: '声音明亮度和声谱倾斜的波动最支持这个判断。',
    },
    global: {
      mainFinding: '你的整体发声状态还不够可复现。',
      oneThingToPractice: '重复最简单的 “a——”，找出最好的一次感觉。',
      practiceInstruction: '每次都尽量像最佳录音一样轻、稳、短。',
      practiceRepetitions: 5,
      reProbeInstruction: '练 5 次后，我们再测一次整体状态是否更接近最佳状态。',
      reasonForChoosing: '目前整体状态变化比单一方向更明显。',
    },
    unknown: {
      mainFinding: '我还不能完全确定最主要的问题。',
      oneThingToPractice: '先重复最简单的 “a——”。',
      practiceInstruction: '唱 3 秒，轻一点，稳一点，录 5 次。',
      practiceRepetitions: 5,
      reProbeInstruction: '练 5 次后，我们再收集一次数据，让判断更可靠。',
      reasonForChoosing: '现在证据还不够集中，先用最简单任务增加确定性。',
    },
  };

  return {
    ...(actions[category] || actions.unknown),
    suppressedFindings,
  };
}

window.aiTeacherBestAttemptReasons = aiTeacherBestAttemptReasons;
window.aiTeacherBuildBestAttemptTeaching = aiTeacherBuildBestAttemptTeaching;
window.aiTeacherBuildTeacherDiary = aiTeacherBuildTeacherDiary;
window.aiTeacherBuildExplainability = aiTeacherBuildExplainability;
window.aiTeacherBuildResearchSnapshot = aiTeacherBuildResearchSnapshot;
window.generateTeacherAction = generateTeacherAction;
