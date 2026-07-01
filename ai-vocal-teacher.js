const AI_TEACHER_DB_NAME = 'voice-training-ai-vocal-teacher';
const AI_TEACHER_DB_VERSION = 5;
const AI_TEACHER_RECORD_MS = 3600;

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

let aiTeacherState = {
  phase: 'idle',
  activeTaskIndex: 0,
  activeAttempt: 1,
  targetTaskId: null,
  vectorsBefore: [],
  vectorsAfter: [],
  recordings: {},
  estimatesBefore: [],
  estimatesAfter: [],
  selectedEstimate: null,
  comparison: null,
  memoryRecords: [],
  currentMemoryRecords: [],
  latestTrend: null,
  latestHypotheses: [],
  latestDiary: '',
  latestResearchSnapshot: null,
  teacherAction: null,
  currentTeachingDecision: null,
  teachingHistory: [],
  closedLoopMode: true,
  lessonMode: true,
  lessonStep: 'probe',
  lessonState: null,
  transferLevel: 'humming',
  latestLessonDecision: null,
  successMemories: [],
  latestSuccessMemory: null,
  songFirstMode: false,
  songSegmentName: '',
  shortProbeTaskId: 'sustained_a',
  bestByTask: {},
  worstByTask: {},
  lastFeedback: null,
  recorder: null,
  stream: null,
  chunks: [],
  timer: null,
  playbackAudio: null,
};

function aiTeacherOpenDb() {
  if (!window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(AI_TEACHER_DB_NAME, AI_TEACHER_DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('recordings')) {
        request.result.createObjectStore('recordings', { keyPath: 'id' });
      }
      if (!request.result.objectStoreNames.contains('vectors')) {
        request.result.createObjectStore('vectors', { keyPath: 'id' });
      }
      if (!request.result.objectStoreNames.contains('estimates')) {
        request.result.createObjectStore('estimates', { keyPath: 'id' });
      }
      if (!request.result.objectStoreNames.contains('comparisons')) {
        request.result.createObjectStore('comparisons', { keyPath: 'id' });
      }
      if (!request.result.objectStoreNames.contains('memoryRecords')) {
        request.result.createObjectStore('memoryRecords', { keyPath: 'id' });
      }
      if (!request.result.objectStoreNames.contains('teachingSessions')) {
        request.result.createObjectStore('teachingSessions', { keyPath: 'id' });
      }
      if (!request.result.objectStoreNames.contains('successMemories')) {
        request.result.createObjectStore('successMemories', { keyPath: 'id' });
      }
      if (!request.result.objectStoreNames.contains('lessonStates')) {
        request.result.createObjectStore('lessonStates', { keyPath: 'lesson_id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function aiTeacherLoadAll(storeName) {
  const db = await aiTeacherOpenDb();
  if (!db || !db.objectStoreNames.contains(storeName)) return [];
  const values = await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return values;
}

async function aiTeacherSaveMany(storeName, values) {
  const db = await aiTeacherOpenDb();
  if (!db || !db.objectStoreNames.contains(storeName)) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    values.forEach((value) => tx.objectStore(storeName).put(value));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function aiTeacherSave(storeName, value) {
  const db = await aiTeacherOpenDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

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

function aiTeacherFormatScore(value) {
  if (!Number.isFinite(value)) return '--';
  return value >= 100 ? value.toFixed(0) : value.toFixed(3);
}

function aiTeacherFeatureLabel(name) {
  const labels = {
    pitch_mean: '平均音高',
    pitch_std: '音高稳定度',
    loudness_mean: '平均音量',
    loudness_std: '音量稳定度',
    spectral_centroid_mean: '声音明亮度',
    spectral_tilt_mean: '声谱倾斜',
    harmonicity_mean: '声带振动稳定度',
  };
  return labels[name] || name;
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

function renderAiTeacherTaskList() {
  const list = document.getElementById('aiTeacherTaskList');
  if (!list) return;
  list.innerHTML = '';
  const tasks = aiTeacherVisibleTasks();
  tasks.forEach((task, index) => {
    const completed = aiTeacherCurrentTaskCompleted(task);
    const isDone = completed >= task.repetitions;
    const isActive = index === aiTeacherState.activeTaskIndex && !isDone;
    const item = document.createElement('article');
    item.className = 'ai-teacher-task-item';
    item.classList.toggle('active', isActive);
    item.classList.toggle('done', isDone);
    item.classList.toggle('muted', !isActive && !isDone);
    item.innerHTML = `
      <div>
        <strong>${isDone ? '✅ ' : ''}${aiTeacherTaskCopy(task.id).short}</strong>
        <p>${isActive ? aiTeacherTaskCopy(task.id).sing : '短录音练习'}</p>
      </div>
      <span>${completed}/${task.repetitions}</span>
    `;
    list.append(item);
  });
}

function renderAiTeacherFeedback() {
  const panel = document.getElementById('aiTeacherInstantFeedback');
  if (!panel) return;
  const feedback = aiTeacherState.lastFeedback;
  panel.hidden = !feedback;
  if (!feedback) return;
  panel.innerHTML = `
    <strong>已保存</strong>
    <span>这条录音时长：${(feedback.durationMs / 1000).toFixed(1)} 秒</span>
    <span>${feedback.loudnessText}</span>
    <span>${feedback.pitchText}</span>
  `;
}

function renderAiTeacher() {
  const task = aiTeacherActiveTask();
  const total = aiTeacherExpectedAttempts();
  const completed = aiTeacherCompletedAttempts();
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const remaining = task ? aiTeacherRemainingForTask(task) : 0;
  const copy = task ? aiTeacherTaskCopy(task.id) : null;
  const isRecording = Boolean(aiTeacherState.recorder);
  const phaseStarted = aiTeacherState.phase !== 'idle' && aiTeacherState.phase !== 'complete';
  const phaseComplete = total > 0 && completed >= total;

  document.getElementById('aiTeacherPhaseLabel').textContent = aiTeacherPhaseName();
  const stepText = document.getElementById('aiTeacherStepText');
  if (stepText && aiTeacherState.lessonMode) {
    stepText.textContent = '我先听一条很短的声音。今天先别管别的，我们只做一个小练习，练完马上复测。';
  }
  document.getElementById('aiTeacherTaskName').textContent = task ? copy.title : '扫描完成';
  document.getElementById('aiTeacherTaskInstruction').textContent = task
    ? copy.sing
    : '已经录完，可以查看诊断。';
  document.getElementById('aiTeacherDurationHint').textContent = task
    ? (aiTeacherState.phase === 'after'
      ? '现在我们再录同一个任务 5 次，看看练习有没有让这个方向更稳定。'
      : '持续 2 到 4 秒')
    : '准备生成结果';
  document.getElementById('aiTeacherProgressPercent').textContent = `${progress}%`;
  document.getElementById('aiTeacherProgressFill').style.width = `${progress}%`;
  document.getElementById('aiTeacherAttemptCounter').textContent = aiTeacherState.lessonMode
    ? `本轮小课：${completed} / ${total} 条短声音`
    : `已完成 ${completed} / ${total} 条录音`;
  document.getElementById('aiTeacherRecordingIndicator').hidden = !isRecording;

  const startButton = document.getElementById('aiTeacherStartButton');
  const recordButton = document.getElementById('aiTeacherRecordButton');
  const stopButton = document.getElementById('aiTeacherStopButton');
  const analyzeButton = document.getElementById('aiTeacherAnalyzeButton');

  startButton.hidden = phaseStarted || phaseComplete;
  startButton.disabled = phaseStarted || phaseComplete;
  startButton.textContent = '开始录音';

  recordButton.hidden = !phaseStarted || phaseComplete || isRecording || Boolean(aiTeacherState.lastFeedback);
  recordButton.disabled = !phaseStarted || phaseComplete || isRecording || !task || Boolean(aiTeacherState.lastFeedback);
  recordButton.textContent = completed === 0 && aiTeacherState.phase !== 'after' ? '开始录音' : '继续录下一次';

  stopButton.hidden = !isRecording;
  stopButton.disabled = !isRecording;

  analyzeButton.hidden = !phaseComplete || isRecording || Boolean(aiTeacherState.lastFeedback);
  analyzeButton.disabled = !phaseComplete || isRecording || Boolean(aiTeacherState.lastFeedback);
  analyzeButton.textContent = aiTeacherState.phase === 'after' ? '听老师怎么说' : '听老师建议';

  if (task && !isRecording) {
    const text = remaining === task.repetitions
      ? `还需要录 ${remaining} 次`
      : remaining > 0
        ? `很好，还需要 ${remaining} 次`
        : '这个声音已经录完';
    aiTeacherSetStatus(aiTeacherState.lessonMode && completed === 0
      ? '先唱一条短声音，我听完马上给你一个练习。'
      : text);
  } else if (!task && phaseComplete) {
    aiTeacherSetStatus(aiTeacherState.phase === 'after'
      ? '我听到了。我们看这次练习有没有帮上忙。'
      : '我听到了。今天先别管别的，我们只选一个练习。');
  }

  renderAiTeacherFeedback();
  renderAiTeacherTaskList();
}

async function aiTeacherEnsureStream() {
  if (aiTeacherState.stream?.active) return aiTeacherState.stream;
  aiTeacherState.stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
  return aiTeacherState.stream;
}

function aiTeacherSetStatus(text) {
  const status = document.getElementById('aiTeacherStatus');
  if (status) status.textContent = text;
}

function startAiTeacherPhase(phase = 'before') {
  aiTeacherState.phase = phase;
  aiTeacherState.lessonStep = phase === 'after' ? 'retest' : 'probe';
  aiTeacherState.activeTaskIndex = 0;
  aiTeacherState.activeAttempt = 1;
  aiTeacherState.lastFeedback = null;
  if (aiTeacherState.closedLoopMode && phase === 'before') {
    aiTeacherState.targetTaskId = aiTeacherState.shortProbeTaskId || 'sustained_a';
  }
  aiTeacherSetStatus(
    phase === 'after'
      ? '现在录同一个声音一次。不要加新技巧，只带着刚才练习的感觉。'
      : '第一步：唱一条 2 到 4 秒的短声音，我先听。'
  );
  renderAiTeacher();
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

async function recordAiTeacherAttempt() {
  if (aiTeacherState.recorder) {
    stopAiTeacherRecording();
    return;
  }
  if (aiTeacherState.phase === 'idle' || aiTeacherState.phase === 'complete') {
    startAiTeacherPhase('before');
  }
  const task = aiTeacherActiveTask();
  if (!task) return;
  try {
    const stream = await aiTeacherEnsureStream();
    aiTeacherState.chunks = [];
    const recorder = new MediaRecorder(stream);
    aiTeacherState.recorder = recorder;
    aiTeacherState.lastFeedback = null;
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data?.size) aiTeacherState.chunks.push(event.data);
    });
    recorder.addEventListener('stop', () => finalizeAiTeacherAttempt(task, aiTeacherState.activeAttempt, recorder.mimeType), { once: true });
    recorder.start();
    aiTeacherSetStatus('正在听你唱……保持 2 到 4 秒。');
    aiTeacherState.timer = window.setTimeout(stopAiTeacherRecording, AI_TEACHER_RECORD_MS);
    renderAiTeacher();
  } catch (error) {
    console.error(error);
    aiTeacherSetStatus('无法打开麦克风。请确认浏览器录音权限后再试。');
  }
}

function stopAiTeacherRecording() {
  if (aiTeacherState.timer) {
    window.clearTimeout(aiTeacherState.timer);
    aiTeacherState.timer = null;
  }
  if (aiTeacherState.recorder && aiTeacherState.recorder.state !== 'inactive') {
    aiTeacherState.recorder.stop();
  }
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

async function finalizeAiTeacherAttempt(task, attemptId, mimeType) {
  const sourceBlob = new Blob(aiTeacherState.chunks, { type: mimeType || 'audio/webm' });
  aiTeacherState.chunks = [];
  aiTeacherState.recorder = null;
  if (!sourceBlob.size) {
    aiTeacherSetStatus('这条录音为空，请重录。');
    renderAiTeacher();
    return;
  }

  try {
    const timestamp = new Date().toISOString();
    const decoded = await decodeAudioBlob(sourceBlob);
    const wavBlob = aiTeacherEncodeWav(decoded);
    const phase = aiTeacherState.phase === 'after' ? 'after' : 'before';
    const id = `ai-teacher-${phase}-${task.id}-${attemptId}-${Date.now()}`;
    const audioPath = `indexeddb://ai-vocal-teacher/${aiTeacherCurrentSessionId}/${phase}/${task.id}/${attemptId}.wav`;
    const recording = { id, phase, taskId: task.id, attemptId, timestamp, audioPath, blob: wavBlob, mimeType: 'audio/wav' };
    await aiTeacherSave('recordings', recording);
    aiTeacherState.recordings[id] = recording;

    const vector = await aiTeacherExtractFeatureVector({ blob: wavBlob, taskId: task.id, attemptId, timestamp, audioPath });
    const storedVector = { id, phase, ...vector };
    await aiTeacherSave('vectors', storedVector);
    if (phase === 'after') aiTeacherState.vectorsAfter.push(storedVector);
    else aiTeacherState.vectorsBefore.push(storedVector);
    const taskAttempts = (phase === 'after' ? aiTeacherState.vectorsAfter : aiTeacherState.vectorsBefore)
      .filter((item) => item.taskId === task.id);
    const previousAttempts = taskAttempts.filter((item) => item.id !== storedVector.id);
    aiTeacherState.lastFeedback = getAiTeacherInstantFeedback(storedVector, previousAttempts, task, taskAttempts);
    advanceAiTeacherProbe();
  } catch (error) {
    console.error(error);
    aiTeacherSetStatus('录音已收到，但分析失败。请重录这一条。');
  }
  renderAiTeacher();
}

function scoreAiTeacherAttempt(vector) {
  const features = vector.features || {};
  const pitchStd = Number.isFinite(features.pitch_std) ? features.pitch_std : 999;
  const loudnessStd = Number.isFinite(features.loudness_std) ? features.loudness_std : 20;
  const duration = (vector.durationMs || 0) / 1000;
  const durationPenalty = duration >= 2 && duration <= 4 ? 0 : Math.abs(duration - 3) * 20;
  const loudnessPenalty = loudnessStd >= 0.5 && loudnessStd <= 8 ? loudnessStd * 0.5 : loudnessStd * 1.6;
  return pitchStd * 2 + loudnessPenalty + durationPenalty;
}

function computeAiTeacherBestWorst(vectors) {
  const bestByTask = {};
  const worstByTask = {};
  AI_VOCAL_TEACHER_TASKS.forEach((task) => {
    const taskVectors = vectors.filter((vector) => vector.taskId === task.id);
    if (!taskVectors.length) return;
    const ranked = taskVectors
      .map((vector) => ({ vector, score: scoreAiTeacherAttempt(vector) }))
      .sort((left, right) => left.score - right.score);
    bestByTask[task.id] = ranked[0].vector;
    worstByTask[task.id] = ranked[ranked.length - 1].vector;
  });
  return { bestByTask, worstByTask };
}

async function analyzeAiTeacherPhase() {
  if (aiTeacherState.closedLoopMode) {
    await analyzeAiTeacherClosedLoopPhase();
    return;
  }
  const phase = aiTeacherState.phase === 'after' ? 'after' : 'before';
  const vectors = phase === 'after' ? aiTeacherState.vectorsAfter : aiTeacherState.vectorsBefore;
  const rawEstimates = estimateAiTeacherMemoryByTask(vectors);
  const estimates = rawEstimates.map((estimate) => enrichAiTeacherEstimate(estimate, {
    vectors,
    sampleCount: vectors.filter((vector) => vector.taskId === estimate.taskId).length,
    historyCount: aiTeacherState.memoryRecords.filter((record) => record.taskId === estimate.taskId).length,
  }));
  const stored = {
    id: `estimate-${phase}-${Date.now()}`,
    phase,
    createdAt: new Date().toISOString(),
    estimates,
  };
  await aiTeacherSave('estimates', stored);
  const memoryRecords = aiTeacherCreateMemoryRecords({
    phase,
    estimates,
    vectors,
    sessionId: aiTeacherCurrentSessionId,
  });
  aiTeacherState.memoryRecords = aiTeacherAppendMemoryRecords(aiTeacherState.memoryRecords, memoryRecords);
  aiTeacherState.currentMemoryRecords = memoryRecords;
  await aiTeacherSaveMany('memoryRecords', memoryRecords);

  if (phase === 'after') {
    aiTeacherState.estimatesAfter = estimates;
    aiTeacherState.comparison = compareAiTeacherBeforeAfter(
      aiTeacherState.targetTaskId,
      aiTeacherState.estimatesBefore,
      aiTeacherState.estimatesAfter
    );
    await aiTeacherSave('comparisons', {
      id: `comparison-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...aiTeacherState.comparison,
    });
    await saveAiTeacherTeachingSession(aiTeacherState.comparison);
    aiTeacherState.latestTrend = aiTeacherTrendForEstimate(
      aiTeacherState.estimatesBefore.find((estimate) => estimate.taskId === aiTeacherState.targetTaskId) || estimates[0],
      aiTeacherState.memoryRecords
    );
    aiTeacherState.latestDiary = aiTeacherBuildTeacherDiary({
      selectedEstimate: aiTeacherState.selectedEstimate,
      trend: aiTeacherState.latestTrend,
      comparison: aiTeacherState.comparison,
      bestTeaching: aiTeacherBuildBestAttemptTeaching(aiTeacherState.bestByTask[aiTeacherState.targetTaskId]),
      memoryRecords: aiTeacherState.memoryRecords,
    });
    aiTeacherState.phase = 'complete';
    renderAiTeacherResults();
    renderAiTeacherComparison();
  } else {
    aiTeacherState.estimatesBefore = estimates;
    aiTeacherState.selectedEstimate = estimates
      .slice()
      .sort((left, right) => right.instabilityScore - left.instabilityScore)[0] || null;
    aiTeacherState.targetTaskId = aiTeacherState.selectedEstimate?.taskId || null;
    const bestWorst = computeAiTeacherBestWorst(aiTeacherState.vectorsBefore);
    aiTeacherState.bestByTask = bestWorst.bestByTask;
    aiTeacherState.worstByTask = bestWorst.worstByTask;
    aiTeacherState.latestTrend = aiTeacherTrendForEstimate(aiTeacherState.selectedEstimate, aiTeacherState.memoryRecords);
    aiTeacherState.latestHypotheses = aiTeacherBuildHypotheses(aiTeacherState.selectedEstimate);
    aiTeacherState.teacherAction = generateTeacherAction(aiTeacherState.selectedEstimate, {
      memoryRecords: aiTeacherState.memoryRecords,
      teachingHistory: aiTeacherState.teachingHistory,
      trend: aiTeacherState.latestTrend,
    });
    aiTeacherState.currentTeachingDecision = aiTeacherState.teacherAction.teachingDecision;
    aiTeacherState.latestDiary = aiTeacherBuildTeacherDiary({
      selectedEstimate: aiTeacherState.selectedEstimate,
      trend: aiTeacherState.latestTrend,
      comparison: null,
      bestTeaching: aiTeacherBuildBestAttemptTeaching(aiTeacherState.bestByTask[aiTeacherState.targetTaskId]),
      memoryRecords: aiTeacherState.memoryRecords,
    });
    aiTeacherState.latestResearchSnapshot = aiTeacherBuildResearchSnapshot(aiTeacherState.selectedEstimate);
    renderAiTeacherResults();
  }
  renderAiTeacher();
}

function getAiTeacherTaskLabel(taskId) {
  return aiTeacherTaskCopy(taskId).short || AI_VOCAL_TEACHER_TASKS.find((task) => task.id === taskId)?.name || taskId;
}

function personalizeAiTeacherDiagnosis(estimate) {
  const features = estimate?.dominantFeatures || [];
  const text = features.join(' ');
  if (/pitch_mean|pitch_std/.test(text)) {
    return '我发现这组声音里，最不稳定的是音高方向。';
  }
  if (/loudness_mean|loudness_std/.test(text)) {
    return '我发现这组声音里，最不稳定的是音量和气息稳定性。';
  }
  if (/spectral_centroid|spectral_tilt|formant/.test(text)) {
    return '我发现这组声音里，最容易变化的是共鸣或元音形状。';
  }
  if (/hnr|harmonicity/.test(text)) {
    return '我发现这组声音里，声带闭合和振动稳定性变化比较明显。';
  }
  return '我发现这组声音的整体状态还不够可复现，我们先做一个更小的练习。';
}

function personalizeAiTeacherRecommendation(estimate) {
  const features = estimate?.dominantFeatures || [];
  const text = features.join(' ');
  if (/pitch_mean|pitch_std/.test(text)) {
    return '我们先不用唱整首歌。接下来试试：稳定音高保持 3 秒，轻轻开始，轻轻结束。';
  }
  if (/loudness_mean|loudness_std/.test(text)) {
    return '我们先做一个更小的练习：同一个元音，从轻声慢慢到正常音量，保持气流不断。';
  }
  if (/spectral_centroid|spectral_tilt|formant/.test(text)) {
    return '接下来试试：/a/ → /i/ → /u/ 慢慢转换，音高和音量都不要变。';
  }
  if (/hnr|harmonicity/.test(text)) {
    return '接下来试试：轻微 creaky onset，然后打开到自然元音；如果累，就改成轻哼。';
  }
  return '接下来重复最容易的一条，听最好和最不稳定的差别，再模仿最好的一次。';
}

function aiTeacherMemoryBar(score) {
  const filled = Math.round(Math.max(0, Math.min(100, score)) / 12.5);
  return `${'█'.repeat(filled)}${'░'.repeat(8 - filled)}`;
}

function renderAiTeacherMemoryDashboard() {
  const bars = document.getElementById('aiTeacherMemoryBars');
  const timeline = document.getElementById('aiTeacherMemoryTimeline');
  if (bars) {
    bars.innerHTML = '';
    aiTeacherBuildMemoryDashboard(aiTeacherState.memoryRecords).forEach((item) => {
      const row = document.createElement('div');
      row.className = 'ai-teacher-memory-row';
      row.innerHTML = `
        <span>${item.label}</span>
        <strong>${aiTeacherMemoryBar(item.score)}</strong>
        <small>${item.score}%</small>
      `;
      bars.append(row);
    });
  }
  if (timeline) {
    const days = aiTeacherBuildTimeline(aiTeacherState.memoryRecords).slice(-6);
    timeline.innerHTML = days.length
      ? days.map((day) => `<span>${day.day}<small>${aiTeacherFormatScore(day.averageInstability)}</small></span>`).join('<b>↓</b>')
      : '<span>还没有长期记录</span>';
  }
}

function renderAiTeacherHypotheses() {
  const list = document.getElementById('aiTeacherHypothesisList');
  if (!list) return;
  const hypotheses = aiTeacherState.latestHypotheses.length
    ? aiTeacherState.latestHypotheses
    : aiTeacherBuildHypotheses(aiTeacherState.selectedEstimate);
  list.innerHTML = '';
  hypotheses.forEach((hypothesis, index) => {
    const item = document.createElement('div');
    item.className = 'ai-teacher-hypothesis-item';
    item.innerHTML = `
      <span>${index + 1}. ${hypothesis.label}</span>
      <strong>${hypothesis.probability}%</strong>
    `;
    list.append(item);
  });
}

function renderAiTeacherExplainability(estimate) {
  const body = document.getElementById('aiTeacherExplainabilityBody');
  if (!body || !estimate) return;
  const explain = aiTeacherBuildExplainability(estimate);
  body.innerHTML = `
    <div>
      <strong>使用的 features</strong>
      <p>${explain.usedFeatures.map(aiTeacherFeatureLabel).join(', ')}</p>
    </div>
    <div>
      <strong>波动最大的 features</strong>
      <p>${explain.largestMovers.map(aiTeacherFeatureLabel).join(', ')}</p>
    </div>
    <div>
      <strong>最支持当前诊断的证据</strong>
      <ul>
        ${explain.support.map((item) => `
          <li>${aiTeacherFeatureLabel(item.feature)} · ${(item.importance * 100).toFixed(1)}% · ${getAiTeacherCategoryLabel(item.category)}</li>
        `).join('')}
      </ul>
    </div>
  `;
}

function renderAiTeacherResearch(estimate) {
  const json = document.getElementById('aiTeacherResearchJson');
  if (!json || !estimate) return;
  aiTeacherState.latestResearchSnapshot = aiTeacherBuildResearchSnapshot(estimate);
  json.textContent = JSON.stringify(aiTeacherState.latestResearchSnapshot, null, 2);
}

function renderAiTeacherResults() {
  const panel = document.getElementById('aiTeacherResults');
  const estimate = aiTeacherState.selectedEstimate;
  if (panel) panel.hidden = !estimate;
  if (!estimate) return;

  const best = aiTeacherState.bestByTask[estimate.taskId];
  const worst = aiTeacherState.worstByTask[estimate.taskId];
  document.getElementById('aiTeacherDominantTask').textContent = getAiTeacherTaskLabel(estimate.taskId);
  document.getElementById('aiTeacherDiagnosis').textContent = personalizeAiTeacherDiagnosis(estimate);
  document.getElementById('aiTeacherDominantScore').textContent = aiTeacherFormatScore(estimate.instabilityScore);
  document.getElementById('aiTeacherDominantFeatures').textContent = estimate.dominantFeatures.map(aiTeacherFeatureLabel).join(', ');
  document.getElementById('aiTeacherRecommendation').textContent = personalizeAiTeacherRecommendation(estimate);
  document.getElementById('aiTeacherStartReprobeButton').disabled = false;

  const bestPanel = document.getElementById('aiTeacherBestAttemptPanel');
  if (bestPanel) bestPanel.hidden = !best;
  if (best) {
    document.getElementById('aiTeacherBestAttemptText').textContent = `本轮最稳定的一次：第 ${best.attemptId} 次`;
  }
  document.getElementById('aiTeacherPlayBestButton').disabled = !best;
  document.getElementById('aiTeacherPlayWorstButton').disabled = !worst;

  const list = document.getElementById('aiTeacherEstimateList');
  if (!list) return;
  list.innerHTML = '';
  aiTeacherState.estimatesBefore.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'ai-teacher-estimate-row';
    row.innerHTML = `
      <strong>${getAiTeacherTaskLabel(item.taskId)}</strong>
      <span>${aiTeacherFormatScore(item.instabilityScore)}</span>
      <small>${item.dominantFeatures.map(aiTeacherFeatureLabel).join(', ')}</small>
    `;
    list.append(row);
  });
}

function renderAiTeacherComparison() {
  const result = aiTeacherState.comparison;
  const panel = document.getElementById('aiTeacherComparison');
  if (panel) panel.hidden = !result;
  if (!result) return;
  document.getElementById('aiTeacherComparisonTitle').textContent = result.improved
    ? '这个练习可能有效'
    : '这次还没有明显改善';
  document.getElementById('aiTeacherBeforeScore').textContent = aiTeacherFormatScore(result.beforeInstability);
  document.getElementById('aiTeacherAfterScore').textContent = aiTeacherFormatScore(result.afterInstability);
  document.getElementById('aiTeacherChangeScore').textContent = aiTeacherFormatScore(result.delta);
  document.getElementById('aiTeacherComparisonText').textContent = result.improved
    ? '这个练习可能有效，你的声音在这个方向更可复现了。'
    : '这次还没有明显改善，可能需要换一个更简单的练习。';
}

function aiTeacherPlayVector(vector) {
  if (!vector) return;
  const recording = aiTeacherState.recordings[vector.id];
  if (!recording?.blob) return;
  if (aiTeacherState.playbackAudio) {
    aiTeacherState.playbackAudio.pause();
    URL.revokeObjectURL(aiTeacherState.playbackAudio.src);
  }
  const audio = new Audio(URL.createObjectURL(recording.blob));
  aiTeacherState.playbackAudio = audio;
  audio.addEventListener('ended', () => {
    URL.revokeObjectURL(audio.src);
    if (aiTeacherState.playbackAudio === audio) {
      aiTeacherState.playbackAudio = null;
    }
  });
  audio.play().catch((error) => console.error(error));
}

function renderAiTeacherResults() {
  const panel = document.getElementById('aiTeacherResults');
  const estimate = aiTeacherState.selectedEstimate;
  if (panel) panel.hidden = !estimate;
  if (!estimate) return;

  const best = aiTeacherState.bestByTask[estimate.taskId];
  const worst = aiTeacherState.worstByTask[estimate.taskId];
  const bestTeaching = aiTeacherBuildBestAttemptTeaching(best);
  renderAiTeacherMemoryDashboard();
  renderAiTeacherHypotheses();
  renderAiTeacherExplainability(estimate);
  renderAiTeacherResearch(estimate);

  document.getElementById('aiTeacherDiaryText').textContent =
    aiTeacherState.latestDiary || '这次训练已经记录到 Learner Memory。';
  document.getElementById('aiTeacherDominantTask').textContent = getAiTeacherTaskLabel(estimate.taskId);
  document.getElementById('aiTeacherDiagnosis').textContent = personalizeAiTeacherDiagnosis(estimate);
  document.getElementById('aiTeacherTrendText').textContent =
    aiTeacherState.latestTrend?.text || '趋势会在多次训练后出现。';
  document.getElementById('aiTeacherConfidenceScore').textContent = `${estimate.confidence || 0}%`;
  document.getElementById('aiTeacherConfidenceHint').textContent = (estimate.confidence || 0) < 50
    ? '建议继续录几次，我才能更确定。'
    : '这个判断已经有足够参考价值。';
  document.getElementById('aiTeacherDominantScore').textContent = aiTeacherFormatScore(estimate.instabilityScore);
  document.getElementById('aiTeacherDominantFeatures').textContent =
    estimate.dominantFeatures.map(aiTeacherFeatureLabel).join(', ');
  document.getElementById('aiTeacherRecommendation').textContent = personalizeAiTeacherRecommendation(estimate);
  document.getElementById('aiTeacherStartReprobeButton').disabled = false;

  const bestPanel = document.getElementById('aiTeacherBestAttemptPanel');
  if (bestPanel) bestPanel.hidden = !best;
  if (best) {
    document.getElementById('aiTeacherBestAttemptText').textContent = `本轮最稳定的一次：第 ${best.attemptId} 次`;
    document.getElementById('aiTeacherBestAttemptWhy').textContent = bestTeaching.text;
  }
  document.getElementById('aiTeacherPlayBestButton').disabled = !best;
  document.getElementById('aiTeacherPlayWorstButton').disabled = !worst;

  const list = document.getElementById('aiTeacherEstimateList');
  if (!list) return;
  list.innerHTML = '';
  aiTeacherState.estimatesBefore.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'ai-teacher-estimate-row';
    row.innerHTML = `
      <strong>${getAiTeacherTaskLabel(item.taskId)}</strong>
      <span>${aiTeacherFormatScore(item.instabilityScore)}</span>
      <small>${item.dominantFeatures.map(aiTeacherFeatureLabel).join(', ')}</small>
    `;
    list.append(row);
  });
}

function renderAiTeacherComparison() {
  const result = aiTeacherState.comparison;
  const panel = document.getElementById('aiTeacherComparison');
  if (panel) panel.hidden = !result;
  if (!result) return;
  document.getElementById('aiTeacherComparisonTitle').textContent = result.improved
    ? '这个练习可能有效'
    : '这次还没有明显改善';
  document.getElementById('aiTeacherBeforeScore').textContent = aiTeacherFormatScore(result.beforeInstability);
  document.getElementById('aiTeacherAfterScore').textContent = aiTeacherFormatScore(result.afterInstability);
  document.getElementById('aiTeacherChangeScore').textContent = aiTeacherFormatScore(result.delta);
  document.getElementById('aiTeacherComparisonText').textContent = result.improved
    ? '这个练习可能有效，你的声音在这个方向更可复现了。'
    : '这次还没有明显改善，可能需要换一个更简单的练习。';
}

async function loadAiTeacherMemory() {
  try {
    aiTeacherState.memoryRecords = (await aiTeacherLoadAll('memoryRecords'))
      .sort((left, right) => new Date(left.date) - new Date(right.date));
    aiTeacherState.teachingHistory = (await aiTeacherLoadAll('teachingSessions'))
      .sort((left, right) => new Date(left.date) - new Date(right.date));
    aiTeacherState.successMemories = (await aiTeacherLoadAll('successMemories'))
      .sort((left, right) => new Date(left.date) - new Date(right.date));
    aiTeacherState.latestSuccessMemory = aiTeacherState.successMemories[aiTeacherState.successMemories.length - 1] || null;
  } catch (error) {
    console.error(error);
    aiTeacherState.memoryRecords = [];
    aiTeacherState.teachingHistory = [];
    aiTeacherState.successMemories = [];
    aiTeacherState.latestSuccessMemory = null;
  }
}

async function saveAiTeacherTeachingSession(comparison) {
  const decision = aiTeacherState.currentTeachingDecision || aiTeacherState.teacherAction?.teachingDecision;
  if (!decision) return null;
  const lessonDecision = aiTeacherState.lessonState?.next_action;
  const nextAction = lessonDecision || (comparison?.saturated
    ? 'increase_difficulty'
    : comparison?.worsened
      ? 'decrease_difficulty'
      : comparison?.improved
        ? 'practice'
        : 'switch_exercise');
  const session = {
    id: `teaching-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    focusArea: decision.focusArea,
    exerciseId: decision.exerciseId,
    actionType: nextAction,
    transferLevel: aiTeacherState.transferLevel,
    beforeInstability: comparison?.beforeInstability,
    afterInstability: comparison?.afterInstability,
    improved: comparison?.improved,
    saturated: comparison?.saturated,
    worsened: comparison?.worsened,
    bestSoFar: comparison?.best_so_far,
    unchanged: comparison?.unchanged,
    noImprovementCount: aiTeacherState.lessonState?.no_improvement_count || comparison?.noImprovementCount || 0,
    saturationCount: aiTeacherState.lessonState?.saturation_count || comparison?.saturationCount || 0,
    confidence: decision.hiddenDetails?.confidence || 0,
    notes: aiTeacherState.lessonState?.teaching_reason || aiTeacherChooseNextLessonStep(comparison, aiTeacherState.transferLevel).message,
  };
  aiTeacherState.teachingHistory = [...aiTeacherState.teachingHistory, session].slice(-120);
  await aiTeacherSave('teachingSessions', session);
  return session;
}

async function saveAiTeacherSuccessMemory(comparison) {
  const decision = aiTeacherState.currentTeachingDecision || aiTeacherState.teacherAction?.teachingDecision;
  const exercise = getAiTeacherExerciseById(decision?.exerciseId);
  const memory = aiTeacherSuccessMemoryFromComparison(
    comparison,
    exercise,
    aiTeacherGetTransferLevel(aiTeacherState.transferLevel)
  );
  if (!memory) return null;
  aiTeacherState.latestSuccessMemory = memory;
  aiTeacherState.successMemories = [...aiTeacherState.successMemories, memory].slice(-80);
  await aiTeacherSave('successMemories', memory);
  return memory;
}

async function saveAiTeacherLessonState() {
  if (!aiTeacherState.lessonState) return;
  await aiTeacherSave('lessonStates', aiTeacherState.lessonState);
}

async function showAiVocalTeacher() {
  document.getElementById('modeLauncher')?.setAttribute('hidden', '');
  document.getElementById('libraryPage')?.setAttribute('hidden', '');
  document.getElementById('appWindow')?.setAttribute('hidden', '');
  if (typeof hideVocalMoveLibrary === 'function') hideVocalMoveLibrary();
  if (typeof hideActiveVoiceSearch === 'function') hideActiveVoiceSearch();
  await loadAiTeacherMemory();
  const page = document.getElementById('aiVocalTeacherPage');
  if (page) page.hidden = false;
  renderAiTeacherMemoryDashboard();
  renderAiTeacher();
}

function hideAiVocalTeacher() {
  stopAiTeacherRecording();
  if (aiTeacherState.playbackAudio) {
    aiTeacherState.playbackAudio.pause();
    URL.revokeObjectURL(aiTeacherState.playbackAudio.src);
    aiTeacherState.playbackAudio = null;
  }
  const page = document.getElementById('aiVocalTeacherPage');
  if (page) page.hidden = true;
}

function resetAiTeacherShortRound(taskId = null) {
  aiTeacherState.vectorsBefore = [];
  aiTeacherState.vectorsAfter = [];
  aiTeacherState.estimatesBefore = [];
  aiTeacherState.estimatesAfter = [];
  aiTeacherState.selectedEstimate = null;
  aiTeacherState.comparison = null;
  aiTeacherState.lastFeedback = null;
  aiTeacherState.latestLessonDecision = null;
  aiTeacherState.teacherAction = null;
  aiTeacherState.currentTeachingDecision = null;
  aiTeacherState.targetTaskId = taskId || aiTeacherState.targetTaskId || aiTeacherState.shortProbeTaskId || 'sustained_a';
  aiTeacherState.shortProbeTaskId = aiTeacherState.targetTaskId;
}

function startAiTeacherNextLessonRound(mode = 'continue') {
  const currentDecision = aiTeacherState.currentTeachingDecision || aiTeacherState.teacherAction?.teachingDecision;
  const currentFocus = currentDecision?.focusArea || aiTeacherState.selectedEstimate?.category || 'global';
  let exercise = getAiTeacherExerciseById(currentDecision?.exerciseId) || getAiTeacherDefaultExercise(currentFocus);
  if (mode === 'simpler') {
    exercise = getAiTeacherAlternateExercise(currentFocus, exercise?.id) || getAiTeacherEasierExercise(currentFocus, exercise?.id) || getAiTeacherDefaultExercise('global');
    aiTeacherState.transferLevel = aiTeacherPreviousTransferLevel(aiTeacherState.transferLevel).id;
  } else if (mode === 'next') {
    aiTeacherState.transferLevel = aiTeacherNextTransferLevel(aiTeacherState.transferLevel).id;
  }
  if (aiTeacherState.lessonState && exercise) {
    aiTeacherState.lessonState = {
      ...aiTeacherState.lessonState,
      current_exercise: exercise,
      transfer_level: aiTeacherState.transferLevel,
      exercise_history: [...(aiTeacherState.lessonState.exercise_history || []), {
        exerciseId: exercise.id,
        at: new Date().toISOString(),
        transferLevel: aiTeacherState.transferLevel,
        reason: mode === 'simpler'
          ? '这个练习暂时帮不上忙，我们换一个方向。'
          : mode === 'next'
            ? '这个练习开始饱和了，进入下一层。'
            : '继续固定刚才有效的感觉。',
      }],
    };
    saveAiTeacherLessonState();
  }
  const nextDecision = exercise ? {
    ...(aiTeacherState.currentTeachingDecision || {}),
    focusArea: currentFocus,
    exerciseId: exercise.id,
    userFacingPlan: {
      title: exercise.title,
      goal: exercise.goal,
      instruction: exercise.instruction,
      repetitions: exercise.repetitions,
      durationMinutes: exercise.durationMinutes,
      reProbeAfter: true,
    },
  } : null;
  resetAiTeacherShortRound(exercise?.reProbeTaskId || aiTeacherState.shortProbeTaskId || 'sustained_a');
  if (exercise) {
    aiTeacherState.currentTeachingDecision = nextDecision;
    aiTeacherState.teacherAction = {
      mainFinding: aiTeacherState.lessonState?.current_goal || aiTeacherState.lessonState?.currentGoal || '',
      oneThingToPractice: exercise.title,
      practiceInstruction: exercise.instruction,
      practiceRepetitions: exercise.repetitions,
      teachingDecision: nextDecision,
    };
  }
  document.getElementById('aiTeacherResults')?.setAttribute('hidden', '');
  document.getElementById('aiTeacherComparison')?.setAttribute('hidden', '');
  startAiTeacherPhase('before');
}

function startAiTeacherSongFirstFromSegment(segment) {
  const formatSegmentTime = typeof songAnalysisFormatTime === 'function'
    ? songAnalysisFormatTime
    : (value) => String(value);
  aiTeacherState.songFirstMode = true;
  aiTeacherState.songSegmentName = segment
    ? `${segment.songName || '歌曲片段'} ${formatSegmentTime(segment.start_time)}-${formatSegmentTime(segment.end_time)}`
    : '歌曲短句';
  aiTeacherState.transferLevel = 'song_phrase';
  aiTeacherState.shortProbeTaskId = 'song_phrase_probe';
  aiTeacherState.targetTaskId = 'song_phrase_probe';
  aiTeacherState.lessonState = null;
  aiTeacherState.latestLessonDecision = null;
  aiTeacherState.lastFeedback = null;
  document.getElementById('aiTeacherResults')?.setAttribute('hidden', '');
  document.getElementById('aiTeacherComparison')?.setAttribute('hidden', '');
  const page = document.getElementById('aiVocalTeacherPage');
  if (page) page.hidden = false;
  startAiTeacherPhase('before');
  aiTeacherSetStatus(`先唱这个片段：${aiTeacherState.songSegmentName}。我会听最明显的失败点。`);
}

async function analyzeAiTeacherClosedLoopPhase() {
  const phase = aiTeacherState.phase === 'after' ? 'after' : 'before';
  const vectors = phase === 'after' ? aiTeacherState.vectorsAfter : aiTeacherState.vectorsBefore;
  const vector = vectors[vectors.length - 1];
  if (!vector) return;

  const estimate = aiTeacherBuildShortProbeEstimate(vector);
  const enriched = enrichAiTeacherEstimate({
    ...estimate,
    category: estimate.category,
    confidence: estimate.confidence,
  }, {
    vectors: [vector],
    sampleCount: 1,
    historyCount: aiTeacherState.memoryRecords.filter((record) => record.taskId === estimate.taskId).length,
  });
  enriched.category = estimate.category;
  enriched.confidence = estimate.confidence;
  enriched.diagnosis = estimate.diagnosis;
  enriched.recommendedExercise = estimate.recommendedExercise;
  enriched.shortProbeMetric = estimate.shortProbeMetric;

  const stored = {
    id: `closed-loop-estimate-${phase}-${Date.now()}`,
    phase,
    createdAt: new Date().toISOString(),
    estimates: [enriched],
  };
  await aiTeacherSave('estimates', stored);

  const memoryRecords = aiTeacherCreateMemoryRecords({
    phase,
    estimates: [enriched],
    vectors: [vector],
    sessionId: aiTeacherCurrentSessionId,
  });
  aiTeacherState.memoryRecords = aiTeacherAppendMemoryRecords(aiTeacherState.memoryRecords, memoryRecords);
  aiTeacherState.currentMemoryRecords = memoryRecords;
  await aiTeacherSaveMany('memoryRecords', memoryRecords);

  if (phase === 'after') {
    aiTeacherState.estimatesAfter = [enriched];
    const beforeVector = aiTeacherState.vectorsBefore[aiTeacherState.vectorsBefore.length - 1];
    const focusArea = aiTeacherState.currentTeachingDecision?.focusArea || aiTeacherState.selectedEstimate?.category || enriched.category;
    const exerciseId = aiTeacherState.currentTeachingDecision?.exerciseId || aiTeacherState.teacherAction?.teachingDecision?.exerciseId;
    const exercise = getAiTeacherExerciseById(exerciseId);
    aiTeacherState.comparison = aiTeacherCompareShortProbe(
      beforeVector,
      vector,
      focusArea,
      exerciseId,
      aiTeacherState.teachingHistory
    );
    if (aiTeacherState.lessonState) {
      aiTeacherState.lessonState = aiTeacherUpdateLessonStateAfterAttempt({
        lessonState: aiTeacherState.lessonState,
        currentVector: vector,
        focusArea,
        exercise,
      });
      await saveAiTeacherLessonState();
      const lessonChange = aiTeacherState.lessonState.last_change;
      if (lessonChange) {
        aiTeacherState.comparison = {
          ...aiTeacherState.comparison,
          improved: lessonChange.improved,
          retainedImprovement: lessonChange.improved,
          worsened: lessonChange.worse,
          best_so_far: lessonChange.best_so_far,
          unchanged: lessonChange.unchanged,
          lessonChange,
          noImprovementCount: aiTeacherState.lessonState.no_improvement_count,
          saturationCount: aiTeacherState.lessonState.saturation_count,
        };
      }
    }
    await aiTeacherSave('comparisons', {
      id: `closed-loop-comparison-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...aiTeacherState.comparison,
    });
    await saveAiTeacherTeachingSession(aiTeacherState.comparison);
    await saveAiTeacherSuccessMemory(aiTeacherState.comparison);
    const lessonNext = aiTeacherState.lessonState
      ? {
        action: aiTeacherState.lessonState.next_action,
        transferLevel: aiTeacherState.lessonState.transfer_level,
        message: aiTeacherState.lessonState.teaching_reason,
      }
      : aiTeacherChooseNextLessonStep(aiTeacherState.comparison, aiTeacherState.transferLevel);
    aiTeacherState.latestLessonDecision = lessonNext;
    aiTeacherState.lessonStep = lessonNext.action;
    aiTeacherState.transferLevel = lessonNext.transferLevel;
    aiTeacherState.phase = 'complete';
    renderAiTeacherResults();
    renderAiTeacherComparison();
  } else {
    aiTeacherState.estimatesBefore = [enriched];
    aiTeacherState.selectedEstimate = enriched;
    aiTeacherState.targetTaskId = enriched.taskId;
    const exerciseDecision = aiTeacherClosedLoopDecision(enriched, aiTeacherState.teachingHistory);
    aiTeacherState.currentTeachingDecision = exerciseDecision;
    const baselineExercise = getAiTeacherExerciseById(exerciseDecision.exerciseId);
    if (!aiTeacherState.lessonState) {
      aiTeacherState.lessonState = aiTeacherCreateLessonState({
        goal: exerciseDecision.reason,
        baselineVector: vector,
        estimate: enriched,
        exercise: baselineExercise,
        transferLevel: aiTeacherState.songFirstMode ? 'song_phrase' : aiTeacherState.transferLevel,
      });
      aiTeacherState.lessonState.song_first_mode = aiTeacherState.songFirstMode;
      aiTeacherState.lessonState.songFirstMode = aiTeacherState.songFirstMode;
      aiTeacherState.lessonState.bottleneck_type = aiTeacherState.songFirstMode ? aiTeacherSongBottleneckType(vector) : null;
    } else {
      aiTeacherState.lessonState = {
        ...aiTeacherState.lessonState,
        current_goal: aiTeacherState.lessonState.current_goal || exerciseDecision.reason,
        current_exercise: baselineExercise || aiTeacherState.lessonState.current_exercise,
        transfer_level: aiTeacherState.transferLevel,
        transferLevel: aiTeacherState.transferLevel,
        attempts: [...(aiTeacherState.lessonState.attempts || []), {
          id: vector.id || `probe-${Date.now()}`,
          role: 'probe',
          attempt_index: (aiTeacherState.lessonState.attempts || []).length + 1,
          timestamp: vector.timestamp || new Date().toISOString(),
          vector,
          metric: aiTeacherShortProbeMetric(vector),
          cueId: aiTeacherState.lessonState.active_cue?.id || aiTeacherState.lessonState.activeCue?.id,
          exerciseId: baselineExercise?.id || aiTeacherState.lessonState.current_exercise?.id,
          task: aiTeacherState.lessonState.current_task || aiTeacherState.lessonState.currentTask,
        }],
      };
    }
    await saveAiTeacherLessonState();
    aiTeacherState.teacherAction = {
      mainFinding: exerciseDecision.reason,
      oneThingToPractice: exerciseDecision.userFacingPlan.title,
      practiceInstruction: exerciseDecision.userFacingPlan.instruction,
      practiceRepetitions: exerciseDecision.userFacingPlan.repetitions,
      reProbeInstruction: '练完后立刻重新录同一个声音，我会比较有没有变稳定。',
      suppressedFindings: [],
      reasonForChoosing: exerciseDecision.reason,
      teachingDecision: exerciseDecision,
    };
    aiTeacherState.bestByTask = { [enriched.taskId]: vector };
    aiTeacherState.worstByTask = { [enriched.taskId]: vector };
    aiTeacherState.latestTrend = null;
    aiTeacherState.latestHypotheses = [];
    aiTeacherState.latestDiary = '这轮我只追踪一件事：练习之后，同一个短 probe 是否更容易稳定复现。';
    aiTeacherState.latestResearchSnapshot = aiTeacherBuildResearchSnapshot(enriched);
    renderAiTeacherResults();
  }

  renderAiTeacher();
}

function getAiTeacherInstantFeedback(vector, previousAttempts = [], task = null, taskAttempts = []) {
  const feedback = typeof generateImmediateFeedback === 'function'
    ? generateImmediateFeedback(vector, previousAttempts, task || {})
    : {
      quickComment: '这次可以用。',
      nextCue: '我们再录下一次，尽量让它和刚才一样。',
      isUsable: true,
      severity: 'good',
    };

  const attempts = Array.isArray(taskAttempts) ? taskAttempts : [];
  if (task && attempts.length >= (task.repetitions || 5) && typeof generateTaskSummary === 'function') {
    const visibleTasks = aiTeacherVisibleTasks();
    const taskIndex = visibleTasks.findIndex((item) => item.id === task.id);
    feedback.taskSummary = generateTaskSummary(task.id, attempts, visibleTasks[taskIndex + 1] || null);
  }

  feedback.durationMs = vector?.durationMs || 0;
  return feedback;
}

function renderAiTeacherFeedback() {
  const panel = document.getElementById('aiTeacherInstantFeedback');
  if (!panel) return;
  const feedback = aiTeacherState.lastFeedback;
  panel.hidden = !feedback;
  panel.innerHTML = '';
  if (!feedback) return;

  const severity = feedback.severity || 'good';
  panel.classList.toggle('minor', severity === 'minor');
  panel.classList.toggle('needs-retry', severity === 'needs_retry');

  const body = document.createElement('div');
  body.className = 'ai-teacher-feedback-body';
  body.innerHTML = `
    <div>
      <span>AI刚刚听到：</span>
      <strong>${feedback.quickComment || '这次可以用。'}</strong>
    </div>
    <div>
      <span>下一次注意：</span>
      <p>${feedback.nextCue || '我们再录下一次。'}</p>
    </div>
  `;
  panel.append(body);

  if (feedback.taskSummary) {
    const summary = document.createElement('div');
    summary.className = 'ai-teacher-task-summary';
    summary.innerHTML = `
      <strong>${feedback.taskSummary.mainObservation}</strong>
      <p>${feedback.taskSummary.nextTaskCue}</p>
    `;
    panel.append(summary);
  }

  const total = aiTeacherExpectedAttempts();
  const completed = aiTeacherCompletedAttempts();
  const phaseComplete = total > 0 && completed >= total;
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = phaseComplete
    ? (aiTeacherState.phase === 'after' ? '查看复测结果' : '查看练习')
    : '继续录下一次';
  button.addEventListener('click', () => {
    if (phaseComplete) {
      analyzeAiTeacherPhase();
    } else {
      recordAiTeacherAttempt();
    }
  });
  panel.append(button);
}

function bindAiTeacherEvents() {
  document.getElementById('openAiVocalTeacherButton')?.addEventListener('click', showAiVocalTeacher);
  document.getElementById('aiTeacherBackHomeButton')?.addEventListener('click', () => {
    hideAiVocalTeacher();
    if (typeof showLauncherView === 'function') showLauncherView();
  });
  document.getElementById('aiTeacherStartButton')?.addEventListener('click', () => {
    aiTeacherState.songFirstMode = false;
    aiTeacherState.shortProbeTaskId = aiTeacherState.shortProbeTaskId === 'song_phrase_probe' ? 'sustained_a' : aiTeacherState.shortProbeTaskId;
    startAiTeacherPhase('before');
    recordAiTeacherAttempt();
  });
  document.getElementById('aiTeacherSongFirstButton')?.addEventListener('click', () => {
    aiTeacherState.songFirstMode = true;
    aiTeacherState.transferLevel = 'song_phrase';
    aiTeacherState.shortProbeTaskId = 'song_phrase_probe';
    aiTeacherState.targetTaskId = 'song_phrase_probe';
    aiTeacherState.lessonState = null;
    document.getElementById('aiTeacherResults')?.setAttribute('hidden', '');
    document.getElementById('aiTeacherComparison')?.setAttribute('hidden', '');
    startAiTeacherPhase('before');
    recordAiTeacherAttempt();
  });
  document.getElementById('aiTeacherRecordButton')?.addEventListener('click', recordAiTeacherAttempt);
  document.getElementById('aiTeacherStopButton')?.addEventListener('click', stopAiTeacherRecording);
  document.getElementById('aiTeacherAnalyzeButton')?.addEventListener('click', analyzeAiTeacherPhase);
  document.getElementById('aiTeacherStartPracticeButton')?.addEventListener('click', () => {
    const exercise = getAiTeacherExerciseById(aiTeacherState.currentTeachingDecision?.exerciseId);
    if (exercise?.reProbeTaskId) {
      aiTeacherState.targetTaskId = exercise.reProbeTaskId;
    }
    aiTeacherState.lessonStep = 'practice';
    aiTeacherState.vectorsAfter = [];
    aiTeacherState.comparison = null;
    aiTeacherState.lastFeedback = null;
    startAiTeacherPhase('after');
    document.getElementById('aiTeacherResults')?.setAttribute('hidden', '');
    document.getElementById('aiTeacherComparison')?.setAttribute('hidden', '');
  });
  document.getElementById('aiTeacherStartReprobeButton')?.addEventListener('click', () => {
    const exercise = getAiTeacherExerciseById(aiTeacherState.currentTeachingDecision?.exerciseId);
    if (exercise?.reProbeTaskId) {
      aiTeacherState.targetTaskId = exercise.reProbeTaskId;
    }
    startAiTeacherPhase('after');
    document.getElementById('aiTeacherResults')?.setAttribute('hidden', '');
    document.getElementById('aiTeacherComparison')?.setAttribute('hidden', '');
  });
  document.getElementById('aiTeacherPlayBestButton')?.addEventListener('click', () => {
    const taskId = aiTeacherState.selectedEstimate?.taskId;
    aiTeacherPlayVector(taskId ? aiTeacherState.bestByTask[taskId] : null);
  });
  document.getElementById('aiTeacherPlayWorstButton')?.addEventListener('click', () => {
    const taskId = aiTeacherState.selectedEstimate?.taskId;
    aiTeacherPlayVector(taskId ? aiTeacherState.worstByTask[taskId] : null);
  });
  document.getElementById('aiTeacherResearchToggleButton')?.addEventListener('click', () => {
    const panel = document.getElementById('aiTeacherResearchPanel');
    if (panel) panel.hidden = !panel.hidden;
  });
  document.getElementById('aiTeacherContinuePracticeButton')?.addEventListener('click', () => {
    const action = aiTeacherState.latestLessonDecision?.action || aiTeacherState.lessonState?.next_action;
    startAiTeacherNextLessonRound(
      action === 'increase_difficulty'
        ? 'next'
        : action === 'switch_exercise' || action === 'decrease_difficulty'
          ? 'simpler'
          : 'continue'
    );
  });
  document.getElementById('aiTeacherSimplerPracticeButton')?.addEventListener('click', () => {
    startAiTeacherNextLessonRound('simpler');
  });
}

function renderTeacherAction(estimate) {
  const action = aiTeacherState.teacherAction || generateTeacherAction(estimate);
  aiTeacherState.teacherAction = action;
  aiTeacherState.currentTeachingDecision = action.teachingDecision || aiTeacherState.currentTeachingDecision;
  const plan = action.teachingDecision?.userFacingPlan;
  document.getElementById('aiTeacherMainFinding').textContent = plan?.goal || action.mainFinding;
  document.getElementById('aiTeacherOneThing').textContent = plan?.title || action.oneThingToPractice;
  document.getElementById('aiTeacherPracticeInstruction').textContent =
    `${plan?.instruction || action.practiceInstruction} 做 ${plan?.repetitions || action.practiceRepetitions} 次，约 ${plan?.durationMinutes || 3} 分钟。完成后复测同一个任务。`;
  const button = document.getElementById('aiTeacherStartPracticeButton');
  if (button) {
    button.textContent = '开始今日练习';
    button.disabled = false;
  }
  document.getElementById('aiTeacherContinuePracticeButton')?.setAttribute('hidden', '');
  document.getElementById('aiTeacherSimplerPracticeButton')?.setAttribute('hidden', '');
}

function moveAiTeacherDetailsIntoPanel() {
  const content = document.getElementById('aiTeacherDetailsContent');
  if (!content || content.dataset.ready === 'true') return;
  [
    'aiTeacherMemoryDashboard',
    'aiTeacherDiaryPanel',
    'aiTeacherHypothesisPanel',
    'aiTeacherBestAttemptPanel',
    'aiTeacherExplainabilityPanel',
    'aiTeacherResearchPanel',
    'aiTeacherEstimateList',
  ].forEach((id) => {
    const node = document.getElementById(id);
    if (node) content.append(node);
  });
  content.dataset.ready = 'true';
}

function renderAiTeacherResults() {
  const panel = document.getElementById('aiTeacherResults');
  const estimate = aiTeacherState.selectedEstimate;
  if (panel) panel.hidden = !estimate;
  if (!estimate) return;

  moveAiTeacherDetailsIntoPanel();
  renderTeacherAction(estimate);

  const best = aiTeacherState.bestByTask[estimate.taskId];
  const worst = aiTeacherState.worstByTask[estimate.taskId];
  const bestTeaching = aiTeacherBuildBestAttemptTeaching(best);
  renderAiTeacherMemoryDashboard();
  renderAiTeacherHypotheses();
  renderAiTeacherExplainability(estimate);
  renderAiTeacherResearch(estimate);

  const diary = document.getElementById('aiTeacherDiaryText');
  if (diary) diary.textContent = aiTeacherState.latestDiary || '这次训练已经记录到 Learner Memory。';
  const task = document.getElementById('aiTeacherDominantTask');
  if (task) task.textContent = getAiTeacherTaskLabel(estimate.taskId);
  const diagnosis = document.getElementById('aiTeacherDiagnosis');
  if (diagnosis) diagnosis.textContent = personalizeAiTeacherDiagnosis(estimate);
  const trend = document.getElementById('aiTeacherTrendText');
  if (trend) trend.textContent = aiTeacherState.latestTrend?.text || '趋势会在多次训练后出现。';
  const confidence = document.getElementById('aiTeacherConfidenceScore');
  if (confidence) confidence.textContent = `${estimate.confidence || 0}%`;
  const confidenceHint = document.getElementById('aiTeacherConfidenceHint');
  if (confidenceHint) {
    confidenceHint.textContent = (estimate.confidence || 0) < 50
      ? '建议继续录几次，我才能更确定。'
      : '这个判断已经有足够参考价值。';
  }
  const score = document.getElementById('aiTeacherDominantScore');
  if (score) score.textContent = aiTeacherFormatScore(estimate.instabilityScore);
  const features = document.getElementById('aiTeacherDominantFeatures');
  if (features) features.textContent = estimate.dominantFeatures.map(aiTeacherFeatureLabel).join(', ');
  const recommendation = document.getElementById('aiTeacherRecommendation');
  if (recommendation) recommendation.textContent = aiTeacherState.teacherAction.oneThingToPractice;
  const reprobe = document.getElementById('aiTeacherStartReprobeButton');
  if (reprobe) reprobe.disabled = false;

  const bestPanel = document.getElementById('aiTeacherBestAttemptPanel');
  if (bestPanel) bestPanel.hidden = !best;
  if (best) {
    document.getElementById('aiTeacherBestAttemptText').textContent = `本轮最稳定的一次：第 ${best.attemptId} 次`;
    document.getElementById('aiTeacherBestAttemptWhy').textContent = bestTeaching.text;
  }
  document.getElementById('aiTeacherPlayBestButton').disabled = !best;
  document.getElementById('aiTeacherPlayWorstButton').disabled = !worst;

  const list = document.getElementById('aiTeacherEstimateList');
  if (!list) return;
  list.innerHTML = '';
  aiTeacherState.estimatesBefore.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'ai-teacher-estimate-row';
    row.innerHTML = `
      <strong>${getAiTeacherTaskLabel(item.taskId)}</strong>
      <span>${aiTeacherFormatScore(item.instabilityScore)}</span>
      <small>${item.dominantFeatures.map(aiTeacherFeatureLabel).join(', ')}</small>
    `;
    list.append(row);
  });
}

function ensureAiTeacherComparisonActions() {
  const panel = document.getElementById('aiTeacherComparison');
  if (!panel || document.getElementById('aiTeacherContinuePracticeButton')) return;
  const actions = document.createElement('div');
  actions.className = 'ai-teacher-comparison-actions';
  actions.innerHTML = `
    <button id="aiTeacherContinuePracticeButton" type="button">继续这个练习</button>
    <button id="aiTeacherSimplerPracticeButton" class="secondary" type="button">换一个更简单的练习</button>
  `;
  panel.append(actions);
  document.getElementById('aiTeacherContinuePracticeButton')?.addEventListener('click', () => {
    startAiTeacherPhase('after');
    document.getElementById('aiTeacherComparison')?.setAttribute('hidden', '');
  });
  document.getElementById('aiTeacherSimplerPracticeButton')?.addEventListener('click', () => {
    aiTeacherState.teacherAction = {
      mainFinding: '我们先把练习再变简单一点。',
      oneThingToPractice: '只唱一个很轻的 “a——”。',
      practiceInstruction: '保持 2 秒就好，不追求音量，不追求高音。',
      practiceRepetitions: 5,
      reProbeInstruction: '做完后再测一次。',
      suppressedFindings: [],
      reasonForChoosing: '复测没有明显下降，所以先降低难度。',
    };
    renderTeacherAction(aiTeacherState.selectedEstimate);
    document.getElementById('aiTeacherResults')?.removeAttribute('hidden');
  });
}

function renderAiTeacherComparison() {
  const result = aiTeacherState.comparison;
  const panel = document.getElementById('aiTeacherComparison');
  if (panel) panel.hidden = !result;
  if (!result) return;
  ensureAiTeacherComparisonActions();
  const action = aiTeacherState.teacherAction;
  document.getElementById('aiTeacherComparisonTitle').textContent = result.improved
    ? '练习后变化：更稳定了'
    : '练习后变化：暂时没有明显变化';
  document.getElementById('aiTeacherComparisonText').textContent = result.improved
    ? `这次复测里，${action?.reasonForChoosing || '主要方向'}相关的不稳定性下降了，所以这个练习可能有效。`
    : '这次还没有明显下降，我们下次应该换一个更简单的练习。';
  document.getElementById('aiTeacherBeforeScore').textContent = aiTeacherFormatScore(result.beforeInstability);
  document.getElementById('aiTeacherAfterScore').textContent = aiTeacherFormatScore(result.afterInstability);
  document.getElementById('aiTeacherChangeScore').textContent = aiTeacherFormatScore(result.delta);
  const grid = document.querySelector('.ai-teacher-comparison-grid');
  if (grid) grid.hidden = true;
  document.getElementById('aiTeacherContinuePracticeButton')?.removeAttribute('hidden');
  document.getElementById('aiTeacherSimplerPracticeButton')?.removeAttribute('hidden');
}

function renderAiTeacherResults() {
  const panel = document.getElementById('aiTeacherResults');
  const estimate = aiTeacherState.selectedEstimate;
  if (panel) panel.hidden = !estimate;
  if (!estimate) return;

  moveAiTeacherDetailsIntoPanel();
  renderTeacherAction(estimate);
  renderAiTeacherMemoryDashboard();
  renderAiTeacherHypotheses();
  renderAiTeacherExplainability(estimate);
  renderAiTeacherResearch(estimate);

  const summary = document.querySelector('.ai-teacher-result-summary');
  if (summary) summary.hidden = Boolean(aiTeacherState.closedLoopMode);
  const details = document.getElementById('aiTeacherDetailsPanel');
  if (details && aiTeacherState.closedLoopMode) {
    details.open = false;
    const summaryNode = details.querySelector('summary');
    if (summaryNode) summaryNode.textContent = '专业模式';
  }

  const diary = document.getElementById('aiTeacherDiaryText');
  if (diary) diary.textContent = aiTeacherState.latestDiary || '这轮只看一件事：练习后同一个短 probe 有没有更稳定。';
  const task = document.getElementById('aiTeacherDominantTask');
  if (task) task.textContent = getAiTeacherTaskLabel(estimate.taskId);
  const diagnosis = document.getElementById('aiTeacherDiagnosis');
  if (diagnosis) diagnosis.textContent = estimate.diagnosis || aiTeacherClosedLoopFinding(estimate.category);
  const trend = document.getElementById('aiTeacherTrendText');
  if (trend) trend.textContent = '闭环模式：先做一个动作，再立刻复测。';
  const confidence = document.getElementById('aiTeacherConfidenceScore');
  if (confidence) confidence.textContent = `${estimate.confidence || 0}%`;
  const score = document.getElementById('aiTeacherDominantScore');
  if (score) score.textContent = aiTeacherFormatScore(estimate.instabilityScore);

  const list = document.getElementById('aiTeacherEstimateList');
  if (list) {
    list.innerHTML = '';
    const row = document.createElement('article');
    row.className = 'ai-teacher-estimate-row';
    row.innerHTML = `
      <strong>${getAiTeacherTaskLabel(estimate.taskId)}</strong>
      <span>${aiTeacherFormatScore(estimate.instabilityScore)}</span>
      <small>${(estimate.dominantFeatures || []).map(aiTeacherFeatureLabel).join(', ')}</small>
    `;
    list.append(row);
  }
}

function renderTeacherAction(estimate) {
  const action = aiTeacherState.teacherAction || generateTeacherAction(estimate);
  aiTeacherState.teacherAction = action;
  aiTeacherState.currentTeachingDecision = action.teachingDecision || aiTeacherState.currentTeachingDecision;
  const decision = action.teachingDecision || aiTeacherState.currentTeachingDecision;
  const plan = decision?.userFacingPlan;
  const focus = decision?.focusArea || estimate?.category || 'global';
  const repetitions = plan?.repetitions || action.practiceRepetitions || 5;
  const transfer = aiTeacherGetTransferLevel(aiTeacherState.transferLevel);
  const lesson = aiTeacherState.lessonState;
  const attemptNumber = Math.max(1, (lesson?.attempts || []).length);
  const lastChange = lesson?.last_change;
  const bestIndex = lesson?.best_attempt?.attempt_index || 1;
  const currentExercise = lesson?.current_exercise || (decision?.exerciseId ? getAiTeacherExerciseById(decision.exerciseId) : null);
  const activeCue = lesson?.active_cue || lesson?.activeCue;
  const successCue = aiTeacherState.latestSuccessMemory
    ? `上次成功的感觉：${aiTeacherState.latestSuccessMemory.exerciseTitle}。等会儿可以回到刚才那个感觉。`
    : '我听到了。今天先别管别的。';
  const changeText = lastChange
    ? aiTeacherDescribeLessonChange(lastChange, lesson)
    : '我先把这条声音当作今天的 baseline。';
  const nextReason = lesson?.teaching_reason || lesson?.lastDecision?.reason || decision?.reason || aiTeacherClosedLoopFinding(focus);
  const nextInstruction = lesson?.next_instruction || lesson?.lastDecision?.nextInstruction;
  const compared = lastChange
    ? (lastChange.best_so_far ? '更好，今天最佳' : lastChange.improved ? '更好' : lastChange.worse ? '更差' : '差不多')
    : '等待复测';
  const songReason = lesson?.song_first_mode || lesson?.songFirstMode
    ? (lesson?.bottleneck_type === 'node_failure'
      ? '我先拆单音，因为这更像某个音点没有站稳。'
      : '我先拆两个音之间的过渡，因为这更像连接处不稳。')
    : '';

  document.getElementById('aiTeacherMainFinding').textContent =
    `现在第 ${attemptNumber} 次。当前目标：${lesson?.currentGoal || lesson?.current_goal || action.mainFinding || aiTeacherClosedLoopFinding(focus)}`;
  document.getElementById('aiTeacherOneThing').textContent =
    `本次一句话：${changeText} 与上次相比：${compared}。当前最好尝试：第 ${bestIndex} 次。`;
  document.getElementById('aiTeacherPracticeInstruction').textContent =
    `下一步动作：${nextInstruction || `${activeCue?.text || nextReason} 做 ${repetitions} 次。`} ${songReason} ${successCue} 回到第 ${bestIndex} 次那个感觉。当前练习：${currentExercise?.title || plan?.title || action.oneThingToPractice || '一个很小的练习'}。迁移层级：${transfer.label}，${transfer.instruction} 然后立刻复测。`;

  const button = document.getElementById('aiTeacherStartPracticeButton');
  if (button) {
    button.textContent = '开始这个练习';
    button.disabled = false;
  }
  document.getElementById('aiTeacherContinuePracticeButton')?.setAttribute('hidden', '');
  document.getElementById('aiTeacherSimplerPracticeButton')?.setAttribute('hidden', '');
}

function renderAiTeacherComparison() {
  const result = aiTeacherState.comparison;
  const panel = document.getElementById('aiTeacherComparison');
  if (panel) panel.hidden = !result;
  if (!result) return;
  ensureAiTeacherComparisonActions();

  const improved = Boolean(result.retainedImprovement || result.improved);
  const lessonNext = aiTeacherState.latestLessonDecision || aiTeacherChooseNextLessonStep(result, aiTeacherState.transferLevel);
  const successText = aiTeacherState.latestSuccessMemory ? ` ${aiTeacherState.latestSuccessMemory.text}` : '';
  const lesson = aiTeacherState.lessonState;
  const change = result.lessonChange || lesson?.last_change;
  const bestIndex = lesson?.best_attempt?.attempt_index || 1;
  const noImprove = lesson?.no_improvement_count || result.noImprovementCount || 0;
  const activeCue = lesson?.active_cue || lesson?.activeCue;
  const songFailure = lesson?.song_first_mode || lesson?.songFirstMode
    ? (lesson?.bottleneck_type === 'node_failure' ? '这次更像单个音点没站稳。' : '这次更像两个音之间的过渡没连住。')
    : '';
  const changeLine = change
    ? aiTeacherDescribeLessonChange(change, lesson)
    : lessonNext.message;
  document.getElementById('aiTeacherComparisonTitle').textContent = result.saturated
    ? '复测后：收益开始变小'
    : result.worsened
      ? '复测后：难度有点高'
      : result.best_so_far
        ? '复测后：今天最好的一次'
    : improved
      ? '复测后：有变好'
      : '复测后：暂时没有变好';
  document.getElementById('aiTeacherComparisonText').textContent = result.saturated
    ? '这个练习的收益开始变小了，我们换到下一个阶段。'
    : result.worsened
      ? '这个难度有点高，我们退回上一层。'
      : result.best_so_far
      ? `刚才那个感觉最接近目标。今天最好的一次：第 ${bestIndex} 次。${successText}`
    : improved
      ? `${changeLine} ${activeCue?.text ? `这个 cue 有用：${activeCue.text}` : ''} ${successText}`
      : noImprove >= 2
        ? `已经连续两次没有明显改善。这个练习暂时帮不上忙，我们换一个方向。${songFailure}`
        : `${changeLine} 变化不大，我们换一句提示再试一次。${songFailure}`;
  document.getElementById('aiTeacherBeforeScore').textContent = aiTeacherFormatScore(result.beforeInstability);
  document.getElementById('aiTeacherAfterScore').textContent = aiTeacherFormatScore(result.afterInstability);
  document.getElementById('aiTeacherChangeScore').textContent = aiTeacherFormatScore(result.delta);

  const grid = document.querySelector('.ai-teacher-comparison-grid');
  if (grid) grid.hidden = true;
  document.getElementById('aiTeacherContinuePracticeButton')?.removeAttribute('hidden');
  document.getElementById('aiTeacherSimplerPracticeButton')?.removeAttribute('hidden');
  const continueButton = document.getElementById('aiTeacherContinuePracticeButton');
  if (continueButton) {
    continueButton.textContent = lessonNext.action === 'increase_difficulty'
      ? '进入下一层'
      : lessonNext.action === 'switch_exercise'
        ? '换练习'
        : '继续这个练习';
  }
  const simplerButton = document.getElementById('aiTeacherSimplerPracticeButton');
  if (simplerButton) {
    simplerButton.textContent = result.worsened || !improved ? '换一个更简单的' : '退回简单一点';
  }
}

bindAiTeacherEvents();
window.showAiVocalTeacher = showAiVocalTeacher;
window.hideAiVocalTeacher = hideAiVocalTeacher;
window.startAiTeacherSongFirstFromSegment = startAiTeacherSongFirstFromSegment;
