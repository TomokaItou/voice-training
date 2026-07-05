// Shared teaching actions for voice problem IDs.
(function () {
  const ACTIONS = {
    discontinuity: {
      exercise: '下一遍先不追求音准细节，只唱这一句并保持不断线。',
      experiment: '唱两次：第一次正常唱，第二次降低音量但保持不断线，比较哪次更接近目标。',
      listen: '先回放这个片段，只听哪里断线或没有稳定发声。',
      returnStep: '声音连起来后，再回到整段跟唱，检查覆盖率有没有上来。',
      passMetric: '有效旋律覆盖率提高，断线减少。',
    },
    pitch_high: {
      exercise: '下一遍先把音量放轻一点，找到目标线后再带歌词。',
      experiment: '唱两次：一次正常音量，一次轻 20%，如果轻声更准，就先用轻声建立音高中心。',
      listen: '先回放这个片段，只听音高重心是不是压在目标线上方。',
      returnStep: '轻声能对准后，再把音量慢慢加回去。',
      passMetric: '平均偏高减少，命中率提高。',
    },
    pitch_low: {
      exercise: '下一遍先哼到目标音上方一点，再带歌词进入。',
      experiment: '唱两次：一次直接唱歌词，一次先 hum 目标音再进歌词，比较哪次更贴目标。',
      listen: '先回放这个片段，只听音高重心是不是落在目标线下方。',
      returnStep: '哼鸣能托住音高后，再回到原歌词和原速度。',
      passMetric: '平均偏低减少，命中率提高。',
    },
    tail_drop: {
      exercise: '下一遍只练句尾，多撑 0.5 秒，音量不要突然收掉。',
      experiment: '唱两次：一次正常收尾，一次句尾多保持半秒，比较哪次更接近目标。',
      listen: '先回放句尾，注意最后一个音有没有往下掉或突然变小。',
      returnStep: '句尾稳住后，再唱完整一句，不要为了尾音把前面唱僵。',
      passMetric: '尾音下坠减少，句尾有效发声更连续。',
    },
    pitch_instability: {
      exercise: '下一遍只练这个片段 3 次，前两次用 hum，第三次再带歌词。',
      experiment: '唱两次：一次带歌词，一次只 hum 旋律；如果 hum 更稳，先练旋律再带字。',
      listen: '先回放这个片段，只听是哪一个转折或长音开始晃。',
      returnStep: '第三次稳定后，再回到整段跟唱，检查局部偏差有没有缩小。',
      passMetric: 'P90 偏差下降，局部音高摆动减少。',
    },
    pressedness: {
      exercise: '下一遍把音量降一点，用 mum 轻声唱同一句，再回到歌词。',
      experiment: '唱两次：一次正常唱，一次用 mum 轻声唱；如果轻声更稳，说明先要减压。',
      listen: '先回放起音和高点，注意有没有突然顶、挤或变硬。',
      returnStep: '轻声不挤后，再带歌词，音量一次只加一点。',
      passMetric: '起音硬度下降，粗糙感减少，音高不被音量顶高。',
    },
    breathiness: {
      exercise: '下一遍先 hum 一次，再打开到元音，保持声音不断。',
      experiment: '唱两次：一次直接唱，一次 hum 后打开；如果后者更集中，就保留这个入口。',
      listen: '先回放这个片段，只听声音是不是散、虚、气声偏多。',
      returnStep: '声音集中后，再带回歌词，不要为了集中而压喉。',
      passMetric: '气声和高频散度下降，连续性提高。',
    },
    general_difference: {
      exercise: '下一遍只练这个片段 3 次，先慢一点，再回到原速。',
      experiment: '唱两次：一次慢速，一次原速，比较哪次更接近目标。',
      listen: '先回放这个片段，只听你和目标最不像的地方。',
      returnStep: '片段稳定后，再回到整段跟唱，检查差异有没有缩小。',
      passMetric: '表征距离缩小，相似度提高。',
    },
  };

  function getAction(problemId) {
    return ACTIONS[problemId] || ACTIONS.general_difference;
  }

  function buildTeachingAction(problemId, context = {}) {
    const problem = window.VoiceProblemMap?.get(problemId) || { id: problemId, userLabel: '声音差异' };
    const action = getAction(problem.id);
    const segmentText = context.segmentText || '这个片段';
    const similarity = Number.isFinite(context.similarity)
      ? `表征相似度 ${Math.round(context.similarity * 100)}%，`
      : '';
    const reason = context.reason || `${similarity}最大差异在 ${segmentText}。${problem.evidence || ''}`;

    return {
      problemId: problem.id,
      badge: problem.userLabel,
      shortLabel: problem.shortLabel,
      issue: problem.issue,
      reason,
      segmentText,
      summary: `${problem.issue} ${reason}`,
      nextStep: action.exercise,
      experiment: action.experiment,
      listenStep: `${action.listen} 位置：${segmentText}。`,
      practiceStep: action.exercise,
      returnStep: action.returnStep,
      passMetric: action.passMetric,
    };
  }

  window.VoiceTeachingActions = {
    ACTIONS,
    get: getAction,
    build: buildTeachingAction,
  };
})();
