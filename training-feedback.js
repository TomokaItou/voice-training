function setTrainingFeedback(title, text, badge = '建议', tone = 'neutral') {
  if (!trainingFeedbackPanel) {
    return;
  }
  trainingFeedbackTitle.textContent = title;
  trainingFeedbackText.textContent = text;
  trainingFeedbackBadge.textContent = badge;
  trainingFeedbackPanel.dataset.tone = tone;
}

window.setTrainingFeedback = setTrainingFeedback;
window.setDefaultTrainingFeedback = setDefaultTrainingFeedback;

function setDefaultTrainingFeedback(mode = trainingMode) {
  if (mode === 'score') {
    setTrainingFeedback('先唱一个稳定长音', '开始检测后，对准目标音持续 3-6 秒。系统会告诉你该往高一点、低一点，还是继续稳住。', '音准');
  } else if (mode === 'curve' || mode === 'pitch') {
    setTrainingFeedback('先选歌或直接开麦', '跟唱时优先看“开始跟唱”和“停止并评估”；自由练声时看曲线是否连续、稳定。', '跟唱');
  } else if (mode === 'breath') {
    setTrainingFeedback('先校准环境噪声', '保持安静点“校准环境”，再平稳出气。目标是持续、不断气，而不是一开始就用最大气流。', '气息');
  } else if (mode === 'range') {
    setTrainingFeedback('从舒服的音开始滑动', '先从低音慢慢滑到高音，再回到中声区。采样足够后再保存结果。', '音域');
  } else if (mode === 'memory') {
    setTrainingFeedback('先录一段完整路径', '录“接近目标、保持目标、回到自然”的片段，再看系统判断哪一步最不稳定。', '音色');
  } else if (mode === 'action') {
    setTrainingFeedback(
      '先做一个可听见的动作变化',
      '先用中性 /a/ 开始，再逐步加 Twang 或改变 da/ta 起音。S88 会看动作路径，而不是只看单个高频指标。',
      'S88'
    );
  } else if (mode === 'rhythm') {
    setTrainingFeedback('跟着拍点做短促起音', '用 da、ta 或拍手跟节拍器进声。先追求每一下都进窗口，再缩小偏早/偏晚。', '节奏');
  } else {
    setTrainingFeedback('先开始一次练习', '系统会把音高、稳定度和录音结果翻译成下一步练习建议。', '等待');
  }
}
