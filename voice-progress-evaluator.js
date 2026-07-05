// Compare before/after voice representations using problem-specific metrics.
(function () {
  const PASS_DELTA = 0.06;

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  }

  function getMetricValue(representation, problemId) {
    const frameStats = representation?.frameStats || {};
    const perceptual = representation?.perceptual || {};
    if (!representation) return 0;

    if (problemId === 'discontinuity') {
      return 1 - clamp01(perceptual.continuity ?? frameStats.stability?.continuity ?? 0);
    }
    if (problemId === 'tail_drop') {
      return clamp01(perceptual.tailDrop ?? frameStats.tail?.drop ?? 0);
    }
    if (problemId === 'pitch_instability') {
      const pitchStd = frameStats.pitch?.std || 0;
      const pitchRange = frameStats.pitch?.range || 0;
      return clamp01(Math.max(0, (pitchStd - 15) / 75) * 0.7 + Math.max(0, (pitchRange - 120) / 360) * 0.3);
    }
    if (problemId === 'pressedness' || problemId === 'closure') {
      return clamp01(perceptual.pressedness ?? 0);
    }
    if (problemId === 'breathiness') {
      return clamp01(perceptual.breathiness ?? 0);
    }
    if (problemId === 'pitch_high' || problemId === 'pitch_low') {
      return clamp01((frameStats.pitch?.std || 0) / 90);
    }
    return clamp01(Math.max(
      1 - clamp01(perceptual.continuity ?? 0),
      perceptual.tailDrop || 0,
      perceptual.pressedness || 0,
      perceptual.breathiness || 0,
      (frameStats.pitch?.std || 0) / 90
    ));
  }

  function getMetricLabel(problemId) {
    const problem = window.VoiceProblemMap?.get?.(problemId);
    if (problem?.shortLabel) return problem.shortLabel;
    if (problemId === 'closure') return '用力感';
    return '目标问题';
  }

  function getExplanation(problemId, beforeMetric, afterMetric, delta) {
    const label = getMetricLabel(problemId);
    const beforeText = beforeMetric.toFixed(2);
    const afterText = afterMetric.toFixed(2);
    if (delta >= PASS_DELTA) {
      return `${label}从 ${beforeText} 降到 ${afterText}，这个练习方向有效。`;
    }
    if (delta <= -0.05) {
      return `${label}从 ${beforeText} 升到 ${afterText}，这次可能用力方向不太对。`;
    }
    return `${label}从 ${beforeText} 到 ${afterText}，变化还不够明显，先继续用更小的动作验证。`;
  }

  function evaluate({ beforeRepresentation, afterRepresentation, problemId, fallbackBefore, fallbackAfter } = {}) {
    const beforeMetric = beforeRepresentation
      ? getMetricValue(beforeRepresentation, problemId)
      : 1 - clamp01(fallbackBefore || 0);
    const afterMetric = afterRepresentation
      ? getMetricValue(afterRepresentation, problemId)
      : 1 - clamp01(fallbackAfter || 0);
    const delta = beforeMetric - afterMetric;
    const beforeScore = 1 - clamp01(beforeMetric);
    const afterScore = 1 - clamp01(afterMetric);
    const status = delta >= PASS_DELTA ? 'improved' : delta <= -0.05 ? 'worse' : 'no_clear_change';

    return {
      problemId,
      metricLabel: getMetricLabel(problemId),
      beforeMetric: clamp01(beforeMetric),
      afterMetric: clamp01(afterMetric),
      beforeScore,
      afterScore,
      delta,
      improved: status === 'improved',
      status,
      passDelta: PASS_DELTA,
      explanation: getExplanation(problemId, clamp01(beforeMetric), clamp01(afterMetric), delta),
    };
  }

  window.VoiceProgressEvaluator = {
    PASS_DELTA,
    getMetricValue,
    evaluate,
  };
})();
