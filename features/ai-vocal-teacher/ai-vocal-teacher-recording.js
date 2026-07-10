const AI_TEACHER_RECORD_MS = 3600;

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
    window.MiraSpeechService?.stop?.();
    window.MiraVoiceCoach?.stopLiveCues?.();
    if (typeof setMiraPresenceState === 'function') {
      setMiraPresenceState('listening', '好，唱给我听吧。');
    }
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
    window.MiraVoiceCoach?.speakById?.('mira.thinking', { interrupt: true, afterState: 'thinking' });
    aiTeacherState.recorder.stop();
  }
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

