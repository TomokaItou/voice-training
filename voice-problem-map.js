// Shared singing problem vocabulary.
// Keep user-facing labels, evidence language, and teaching intent in one place.
(function () {
  const PROBLEMS = {
    discontinuity: {
      id: 'discontinuity',
      userLabel: '先连起来',
      shortLabel: '断线',
      issue: '你的有效旋律有点断，系统听到的连续歌声不够。',
      evidence: '目标句更连续，你这一遍有些位置没有稳定发声。',
      priority: 90,
    },
    pitch_high: {
      id: 'pitch_high',
      userLabel: '整体偏高',
      shortLabel: '偏高',
      issue: '这一遍的音高重心比目标高。',
      evidence: '平均音高位置在目标上方，不只是某一个音偏高。',
      priority: 82,
    },
    pitch_low: {
      id: 'pitch_low',
      userLabel: '整体偏低',
      shortLabel: '偏低',
      issue: '这一遍的音高重心比目标低。',
      evidence: '平均音高位置在目标下方，不只是某一个音偏低。',
      priority: 82,
    },
    tail_drop: {
      id: 'tail_drop',
      userLabel: '尾音保持',
      shortLabel: '尾音掉',
      issue: '这句最明显的差异是尾音容易掉或收得太快。',
      evidence: '句尾音高或音量下降比目标更明显。',
      priority: 74,
    },
    pitch_instability: {
      id: 'pitch_instability',
      userLabel: '片段音准',
      shortLabel: '音高晃',
      issue: '整段不是完全跑偏，主要是这一小段音高摆动更大。',
      evidence: '这一段的音高方差或局部偏差比目标更明显。',
      priority: 70,
    },
    pressedness: {
      id: 'pressedness',
      userLabel: '放轻一点',
      shortLabel: '有点挤',
      issue: '你的录音里有一点用力或起音偏硬的迹象。',
      evidence: '起音硬度、粗糙度或响度压力比目标更明显。',
      priority: 64,
    },
    breathiness: {
      id: 'breathiness',
      userLabel: '声音集中',
      shortLabel: '声音散',
      issue: '你的录音里有一点声音变散或气声偏多的迹象。',
      evidence: '高频气声、谱平坦度或连续性指标提示声音比较散。',
      priority: 60,
    },
    general_difference: {
      id: 'general_difference',
      userLabel: '声音差异',
      shortLabel: '差异',
      issue: '这一遍和目标的差异主要集中在这一句。',
      evidence: '表征向量显示这个片段和目标差距最大。',
      priority: 10,
    },
  };

  function getProblem(id) {
    return PROBLEMS[id] || PROBLEMS.general_difference;
  }

  function inferProblemId(context = {}) {
    const pitchReview = context.pitchReview || {};
    const signedError = pitchReview.meanSignedError || 0;
    const primaryProblem = context.primaryProblem;
    const largestFields = context.largestFields || [];

    if (pitchReview.coverage < 35 || primaryProblem === 'discontinuity') {
      return 'discontinuity';
    }
    if (Math.abs(signedError) > (context.goodToleranceCents || 20)) {
      return signedError > 0 ? 'pitch_high' : 'pitch_low';
    }
    if (primaryProblem === 'tail_drop' || largestFields.includes('tailDrop')) {
      return 'tail_drop';
    }
    if (
      context.localizedPitchProblem ||
      largestFields.includes('pitchStd') ||
      largestFields.includes('pitchRange')
    ) {
      return 'pitch_instability';
    }
    if (primaryProblem === 'pressedness') {
      return 'pressedness';
    }
    if (primaryProblem === 'breathiness') {
      return 'breathiness';
    }
    return 'general_difference';
  }

  window.VoiceProblemMap = {
    PROBLEMS,
    get: getProblem,
    inferProblemId,
  };
})();
