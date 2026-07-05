const AI_TEACHER_TASK_COPY = {
  sustained_a: {
    title: '第一步：录一个稳定的 /a/',
    sing: '请舒服地唱 “aaaaaa”',
    short: '稳定 /a/',
  },
  sustained_i: {
    title: '第二步：换成稳定的 /i/',
    sing: '请用同样舒服的音高唱 “iiiiii”',
    short: '稳定 /i/',
  },
  soft_to_normal: {
    title: '第三步：从轻声到正常音量',
    sing: '从很轻的元音慢慢变到正常音量',
    short: '轻到正常',
  },
  short_glide: {
    title: '第四步：做一个短滑音',
    sing: '轻轻滑动音高，不要冲高',
    short: '短滑音',
  },
  creaky_open: {
    title: '第五步：从 creaky onset 打开',
    sing: '轻轻起一个 creaky 声，再打开到自然元音',
    short: '起音打开',
  },
};

function aiTeacherSessionId() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

const aiTeacherCurrentSessionId = aiTeacherSessionId();

function aiTeacherGetPhaseVectors() {
  return aiTeacherState.phase === 'after' ? aiTeacherState.vectorsAfter : aiTeacherState.vectorsBefore;
}

function aiTeacherVisibleTasks() {
  if (aiTeacherState.closedLoopMode) {
    const taskId = aiTeacherState.targetTaskId || aiTeacherState.shortProbeTaskId || 'sustained_a';
    const songTask = {
      id: 'song_phrase_probe',
      name: 'Short song phrase',
      instruction: '唱一句很短的歌曲片段，不要整首，只要最想练的那一句。',
      repetitions: 1,
    };
    const task = aiTeacherState.songFirstMode || taskId === 'song_phrase_probe'
      ? songTask
      : AI_VOCAL_TEACHER_TASKS.find((item) => item.id === taskId) || AI_VOCAL_TEACHER_TASKS[0];
    return [{ ...task, repetitions: 1 }];
  }
  return aiTeacherState.phase === 'after'
    ? AI_VOCAL_TEACHER_TASKS.filter((task) => task.id === aiTeacherState.targetTaskId)
    : AI_VOCAL_TEACHER_TASKS;
}

function aiTeacherExpectedAttempts() {
  return aiTeacherVisibleTasks().reduce((sum, task) => sum + task.repetitions, 0);
}

function aiTeacherCompletedAttempts() {
  return aiTeacherGetPhaseVectors().length;
}

function aiTeacherActiveTask() {
  return aiTeacherVisibleTasks()[aiTeacherState.activeTaskIndex] || null;
}

function aiTeacherTaskCopy(taskId) {
  if (taskId === 'song_phrase_probe') {
    return {
      title: '先唱一句歌曲短句',
      sing: '只唱一句最想练的地方，2 到 4 秒就好。',
      short: '歌曲短句',
    };
  }
  return AI_TEACHER_TASK_COPY[taskId] || { title: '录一条短声音', sing: '请舒服地唱 2 到 4 秒', short: taskId };
}

function aiTeacherPhaseName() {
  if (aiTeacherState.lessonMode) {
    if (aiTeacherState.phase === 'after') return 'Lesson Mode · 复测';
    if (aiTeacherState.phase === 'complete') return 'Lesson Mode · 下一步';
    return 'Lesson Mode · 听你一条声音';
  }
  if (aiTeacherState.phase === 'after') return '复测';
  if (aiTeacherState.phase === 'complete') return '复测完成';
  return '声音扫描';
}

function aiTeacherCurrentTaskCompleted(task) {
  return aiTeacherGetPhaseVectors().filter((vector) => vector.taskId === task.id).length;
}

function aiTeacherRemainingForTask(task) {
  return Math.max(0, task.repetitions - aiTeacherCurrentTaskCompleted(task));
}

function advanceAiTeacherProbe() {
  const task = aiTeacherActiveTask();
  if (!task) return;
  if (aiTeacherState.activeAttempt < task.repetitions) {
    aiTeacherState.activeAttempt += 1;
    return;
  }
  aiTeacherState.activeTaskIndex += 1;
  aiTeacherState.activeAttempt = 1;
}

function getAiTeacherInstantFeedback(vector) {
  const features = vector.features || {};
  const durationMs = vector.durationMs || 0;
  const loudness = features.loudness_mean;
  const pitchStd = features.pitch_std;
  let loudnessText = '音量看起来合适';
  if (Number.isFinite(loudness) && loudness < -42) {
    loudnessText = '音量偏小，下次可以靠近一点或稍微唱清楚';
  } else if (Number.isFinite(loudness) && loudness > -12) {
    loudnessText = '音量偏大，下次可以轻一点';
  }

  let pitchText = '音高稳定性暂时无法判断';
  if (Number.isFinite(pitchStd) && pitchStd > 0) {
    pitchText = pitchStd <= 8
      ? '音高比较稳定'
      : pitchStd <= 22
        ? '音高有一点晃动'
        : '音高波动比较明显';
  }

  return { durationMs, loudnessText, pitchText };
}

