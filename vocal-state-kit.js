const vocalStateKitState = {
  phase: 'idle',
  stream: null,
  audioRecorder: null,
  videoRecorder: null,
  audioChunks: [],
  videoChunks: [],
  videoFeatures: [],
  frameTimer: null,
  startedAt: 0,
  session: null,
};

function vocalStateId() {
  return `vocal-state-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function vocalStateSetText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function vocalStateMean(values) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
}

function vocalStateStd(values) {
  const clean = values.filter(Number.isFinite);
  if (clean.length < 2) return 0;
  const mean = vocalStateMean(clean);
  return Math.sqrt(vocalStateMean(clean.map((value) => (value - mean) ** 2)));
}

function vocalStateFeatureValue(features, key, fallback = 0) {
  const value = features?.[key];
  return Number.isFinite(value) ? value : fallback;
}

function vocalStateRender() {
  const isRecording = Boolean(vocalStateKitState.audioRecorder || vocalStateKitState.videoRecorder);
  const primary = document.getElementById('vocalStatePrimaryButton');
  const stop = document.getElementById('vocalStateStopButton');
  if (primary) {
    primary.disabled = isRecording;
    primary.textContent = vocalStateKitState.phase === 'complete' ? '再录一次' : '开始多模态录制';
  }
  if (stop) stop.hidden = !isRecording;
  vocalStateSetText('vocalStatePhaseLabel', isRecording ? 'Recording' : vocalStateKitState.phase === 'complete' ? 'Result' : 'Ready');
  vocalStateSetText('vocalStateTitle', isRecording ? '正在同步采集声音和画面' : '录 5–10 秒稳定音或短句');
  vocalStateSetText('vocalStateStatus', isRecording
    ? '请正对摄像头，唱一个稳定音或短句，保持头部不要大幅移动。'
    : vocalStateKitState.phase === 'complete'
      ? '已生成多模态 session。'
      : '准备好后开始。第一版只做采集和基础证据。');
  document.getElementById('vocalStateResults').hidden = !vocalStateKitState.session;
}

function vocalStateFrameBrightness(data, width, height, region) {
  const x0 = Math.max(0, Math.floor(region.x * width));
  const y0 = Math.max(0, Math.floor(region.y * height));
  const x1 = Math.min(width, Math.floor((region.x + region.w) * width));
  const y1 = Math.min(height, Math.floor((region.y + region.h) * height));
  const values = [];
  for (let y = y0; y < y1; y += 3) {
    for (let x = x0; x < x1; x += 3) {
      const offset = (y * width + x) * 4;
      values.push((data[offset] + data[offset + 1] + data[offset + 2]) / 3);
    }
  }
  return vocalStateMean(values);
}

function vocalStateLandmarkDistance(a, b) {
  if (!a || !b) return 0;
  return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0), (a.z || 0) - (b.z || 0));
}

function vocalStateExtractMediaPipeFeature(video, previousFeature) {
  const landmarker = window.vocalStateFaceLandmarker || window.faceLandmarker || window.FaceMeshLandmarker;
  if (!landmarker) return null;
  let result = null;
  try {
    if (typeof landmarker.detectForVideo === 'function') {
      result = landmarker.detectForVideo(video, performance.now());
    } else if (typeof landmarker.detect === 'function') {
      result = landmarker.detect(video);
    }
  } catch (error) {
    console.warn('MediaPipe face landmark extraction failed', error);
    return null;
  }
  const landmarks = result?.faceLandmarks?.[0] || result?.multiFaceLandmarks?.[0] || result?.landmarks?.[0];
  if (!landmarks) return null;
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const chin = landmarks[152];
  const nose = landmarks[1];
  const forehead = landmarks[10];
  const mouthOpen = vocalStateLandmarkDistance(upperLip, lowerLip) / Math.max(0.001, vocalStateLandmarkDistance(leftMouth, rightMouth));
  const lipRoundness = vocalStateLandmarkDistance(upperLip, lowerLip) / Math.max(0.001, vocalStateLandmarkDistance(leftMouth, rightMouth));
  const jawPosition = vocalStateLandmarkDistance(chin, nose);
  const jawMovement = previousFeature?._jawPosition ? Math.abs(jawPosition - previousFeature._jawPosition) : 0;
  const yawProxy = (nose?.x || 0.5) - ((leftMouth?.x || 0) + (rightMouth?.x || 1)) / 2;
  const pitchProxy = (forehead?.y || 0) - (chin?.y || 0);
  const headMotion = previousFeature
    ? Math.abs(yawProxy - previousFeature.headPose.yawProxy) + Math.abs(pitchProxy - previousFeature.headPose.pitchProxy)
    : 0;
  return {
    timestamp: performance.now() - vocalStateKitState.startedAt,
    mouthOpen,
    lipRoundness,
    jawMovement,
    headPose: { yawProxy, pitchProxy, rollProxy: 0, headMotion },
    tensionProxy: Math.max(0, Math.min(1, jawMovement * 8 + headMotion * 2)),
    detector: 'mediapipe_face_landmarker',
    _jawPosition: jawPosition,
  };
}

function vocalStateExtractVideoProxy(video, previousFeature) {
  const canvas = document.getElementById('vocalStateCanvas');
  const context = canvas?.getContext('2d', { willReadFrequently: true });
  if (!canvas || !context || !video.videoWidth || !video.videoHeight) return null;
  canvas.width = 320;
  canvas.height = Math.max(180, Math.round((video.videoHeight / video.videoWidth) * 320));
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const frame = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = frame.data;
  const lowerFace = vocalStateFrameBrightness(data, canvas.width, canvas.height, { x: 0.36, y: 0.52, w: 0.28, h: 0.25 });
  const mouthCenter = vocalStateFrameBrightness(data, canvas.width, canvas.height, { x: 0.42, y: 0.60, w: 0.16, h: 0.10 });
  const mouthWide = vocalStateFrameBrightness(data, canvas.width, canvas.height, { x: 0.34, y: 0.60, w: 0.32, h: 0.08 });
  const chin = vocalStateFrameBrightness(data, canvas.width, canvas.height, { x: 0.40, y: 0.72, w: 0.20, h: 0.10 });
  const left = vocalStateFrameBrightness(data, canvas.width, canvas.height, { x: 0.18, y: 0.28, w: 0.18, h: 0.35 });
  const right = vocalStateFrameBrightness(data, canvas.width, canvas.height, { x: 0.64, y: 0.28, w: 0.18, h: 0.35 });
  const top = vocalStateFrameBrightness(data, canvas.width, canvas.height, { x: 0.35, y: 0.18, w: 0.30, h: 0.16 });
  const bottom = vocalStateFrameBrightness(data, canvas.width, canvas.height, { x: 0.35, y: 0.68, w: 0.30, h: 0.16 });
  const mouthOpen = Math.max(0, Math.min(1, (lowerFace - mouthCenter + 32) / 96));
  const lipRoundness = Math.max(0, Math.min(1, (mouthWide - mouthCenter + 24) / 80));
  const jawMovement = previousFeature ? Math.abs(chin - previousFeature._chinBrightness) / 80 : 0;
  const yawProxy = Math.max(-1, Math.min(1, (left - right) / 80));
  const pitchProxy = Math.max(-1, Math.min(1, (top - bottom) / 80));
  const headMotion = previousFeature
    ? Math.abs(yawProxy - previousFeature.headPose.yawProxy) + Math.abs(pitchProxy - previousFeature.headPose.pitchProxy)
    : 0;
  return {
    timestamp: performance.now() - vocalStateKitState.startedAt,
    mouthOpen,
    lipRoundness,
    jawMovement,
    headPose: { yawProxy, pitchProxy, rollProxy: 0, headMotion },
    tensionProxy: Math.max(0, Math.min(1, jawMovement + headMotion * 0.5)),
    detector: 'video_proxy',
    _chinBrightness: chin,
  };
}

function vocalStateStartVideoSampling() {
  const video = document.getElementById('vocalStatePreview');
  vocalStateKitState.videoFeatures = [];
  vocalStateKitState.frameTimer = window.setInterval(() => {
    const previous = vocalStateKitState.videoFeatures[vocalStateKitState.videoFeatures.length - 1];
    const feature = vocalStateExtractMediaPipeFeature(video, previous) || vocalStateExtractVideoProxy(video, previous);
    if (feature) vocalStateKitState.videoFeatures.push(feature);
  }, 180);
}

function vocalStateStopVideoSampling() {
  if (vocalStateKitState.frameTimer) {
    clearInterval(vocalStateKitState.frameTimer);
    vocalStateKitState.frameTimer = null;
  }
}

async function vocalStateBuildAudioSeries(blob) {
  const audioBuffer = await decodeAudioBlob(blob);
  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const frameSize = Math.max(1024, Math.floor(sampleRate * 0.046));
  const hopSize = Math.max(512, Math.floor(frameSize / 2));
  const series = [];
  for (let start = 0; start + frameSize <= data.length; start += hopSize) {
    const frame = data.subarray(start, start + frameSize);
    const rms = typeof computeRms === 'function'
      ? computeRms(frame)
      : Math.sqrt(vocalStateMean([...frame].map((value) => value * value)));
    const pitchResult = typeof estimatePitchYinWithConfidence === 'function'
      ? estimatePitchYinWithConfidence(frame, sampleRate, rms)
      : { pitch: null, confidence: 0 };
    const centroid = typeof aiTeacherSpectralCentroid === 'function'
      ? aiTeacherSpectralCentroid(frame, sampleRate)
      : 0;
    series.push({
      timestamp: (start / sampleRate) * 1000,
      pitch: Number.isFinite(pitchResult.pitch) ? pitchResult.pitch : null,
      volume: 20 * Math.log10(rms + 1e-6),
      spectralCentroid: centroid,
      brightness: centroid,
      breathiness: 1 - Math.max(0, Math.min(1, pitchResult.confidence || 0)),
      harmonicity: pitchResult.confidence || 0,
    });
  }
  return series;
}

function vocalStateSummarizeSession(session) {
  const audio = session.audioFeatures || [];
  const video = session.videoFeatures || [];
  const pitches = audio.map((item) => item.pitch).filter(Number.isFinite);
  const volumes = audio.map((item) => item.volume).filter(Number.isFinite);
  const breathiness = audio.map((item) => item.breathiness).filter(Number.isFinite);
  const mouthOpen = video.map((item) => item.mouthOpen).filter(Number.isFinite);
  const jaw = video.map((item) => item.jawMovement).filter(Number.isFinite);
  const headMotion = video.map((item) => item.headPose?.headMotion).filter(Number.isFinite);
  return {
    audio: {
      pitchMean: vocalStateMean(pitches),
      pitchStability: vocalStateStd(pitches),
      volumeMean: vocalStateMean(volumes),
      volumeStability: vocalStateStd(volumes),
      breathinessMean: vocalStateMean(breathiness),
      stabilityScore: Math.max(0, 100 - vocalStateStd(pitches) - vocalStateStd(volumes) * 4),
    },
    video: {
      mouthOpenMean: vocalStateMean(mouthOpen),
      mouthOpenStability: vocalStateStd(mouthOpen),
      jawMovementMean: vocalStateMean(jaw),
      headMotionMean: vocalStateMean(headMotion),
      frameCount: video.length,
      detector: video[0]?.detector || 'unavailable',
    },
    egg: {
      status: 'not_connected',
      closureStability: null,
    },
  };
}

function vocalStateBuildFeedback(summary) {
  const facts = [];
  const external = [];
  if (summary.audio.breathinessMean > 0.38) facts.push('气声/噪声相关指标偏高。');
  if (summary.audio.volumeStability > 5) facts.push('音量起伏比较明显。');
  if (summary.audio.pitchStability > 18) facts.push('音高稳定性偏低。');
  if (!facts.length) facts.push('声音整体比较稳定，暂时没有特别突出的单一问题。');
  if (summary.video.mouthOpenStability < 0.08) external.push('嘴巴开合变化不大。');
  else external.push('嘴巴开合变化比较明显。');
  if (summary.video.jawMovementMean < 0.08) external.push('下巴比较稳定。');
  else external.push('下巴运动幅度偏大。');
  if (summary.video.headMotionMean < 0.08) external.push('头部姿态比较稳定。');
  else external.push('头部有可见移动。');
  const likelyClosure = summary.audio.breathinessMean > 0.38 && summary.video.mouthOpenStability < 0.12;
  return {
    observedFact: facts.join(' '),
    externalAction: external.join(' '),
    interpretation: likelyClosure
      ? '更可能是声门闭合不足，而不是嘴形变化导致。'
      : '目前只能说声音变化和外部动作同时存在，还需要下一轮复测确认主因。',
    practice: likelyClosure
      ? '尝试更轻的起音，保持同样嘴形，再比较气声是否下降。'
      : '下一轮保持嘴形和头部更稳定，只改变一个发声动作，再看声音指标是否改善。',
  };
}

function vocalStateRenderResults(session) {
  const summary = session.summary;
  const feedback = session.feedback;
  vocalStateSetText(
    'vocalStateAudioTitle',
    `稳定性 ${Math.round(summary.audio.stabilityScore)}/100`
  );
  vocalStateSetText(
    'vocalStateAudioSummary',
    `平均音高 ${summary.audio.pitchMean ? Math.round(summary.audio.pitchMean) : '--'} Hz；音量波动 ${summary.audio.volumeStability.toFixed(1)}；气声指标 ${summary.audio.breathinessMean.toFixed(2)}。`
  );
  vocalStateSetText(
    'vocalStateVideoTitle',
    summary.video.detector === 'video_proxy' ? '画面代理指标' : 'Face landmarks'
  );
  vocalStateSetText(
    'vocalStateVideoSummary',
    `嘴巴开合 ${summary.video.mouthOpenMean.toFixed(2)}；下巴运动 ${summary.video.jawMovementMean.toFixed(2)}；头部移动 ${summary.video.headMotionMean.toFixed(2)}。`
  );
  const feedbackBody = document.getElementById('vocalStateFeedbackBody');
  if (feedbackBody) {
    feedbackBody.innerHTML = `
      <p><strong>观测事实：</strong>${feedback.observedFact}</p>
      <p><strong>外部动作：</strong>${feedback.externalAction}</p>
      <p><strong>推测解释：</strong>${feedback.interpretation}</p>
      <p><strong>建议练习：</strong>${feedback.practice}</p>
    `;
  }
  const debug = document.getElementById('vocalStateDebugJson');
  if (debug) debug.textContent = JSON.stringify(session, null, 2);
}

async function vocalStateSaveSession(session) {
  if (typeof aiTeacherSave === 'function') {
    try {
      await aiTeacherSave('vocalStateSessions', {
        ...session,
        audioBlob: undefined,
        videoBlob: undefined,
      });
    } catch (error) {
      console.warn('Vocal State session save failed', error);
    }
  }
}

async function vocalStateStartRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
  });
  vocalStateKitState.stream = stream;
  vocalStateKitState.audioChunks = [];
  vocalStateKitState.videoChunks = [];
  vocalStateKitState.session = null;
  vocalStateKitState.startedAt = performance.now();
  const preview = document.getElementById('vocalStatePreview');
  if (preview) {
    preview.srcObject = stream;
    await preview.play().catch(() => {});
  }
  const audioStream = new MediaStream(stream.getAudioTracks());
  const videoStream = new MediaStream(stream.getTracks());
  vocalStateKitState.audioRecorder = new MediaRecorder(audioStream);
  vocalStateKitState.videoRecorder = new MediaRecorder(videoStream);
  vocalStateKitState.audioRecorder.addEventListener('dataavailable', (event) => {
    if (event.data?.size) vocalStateKitState.audioChunks.push(event.data);
  });
  vocalStateKitState.videoRecorder.addEventListener('dataavailable', (event) => {
    if (event.data?.size) vocalStateKitState.videoChunks.push(event.data);
  });
  vocalStateKitState.audioRecorder.addEventListener('stop', vocalStateFinalizeRecording, { once: true });
  vocalStateKitState.audioRecorder.start();
  vocalStateKitState.videoRecorder.start();
  vocalStateStartVideoSampling();
  vocalStateKitState.phase = 'recording';
  vocalStateSetText('vocalStateMicStatus', '麦克风：录制中');
  vocalStateSetText('vocalStateCameraStatus', '摄像头：录制中');
  vocalStateRender();
  window.setTimeout(() => {
    if (vocalStateKitState.phase === 'recording') vocalStateStopRecording();
  }, 8000);
}

function vocalStateStopRecording() {
  vocalStateStopVideoSampling();
  if (vocalStateKitState.videoRecorder && vocalStateKitState.videoRecorder.state !== 'inactive') {
    vocalStateKitState.videoRecorder.stop();
  }
  if (vocalStateKitState.audioRecorder && vocalStateKitState.audioRecorder.state !== 'inactive') {
    vocalStateKitState.audioRecorder.stop();
  }
  vocalStateKitState.stream?.getTracks().forEach((track) => track.stop());
  vocalStateSetText('vocalStateMicStatus', '麦克风：已停止');
  vocalStateSetText('vocalStateCameraStatus', '摄像头：已停止');
  vocalStateRender();
}

async function vocalStateFinalizeRecording() {
  const audioBlob = new Blob(vocalStateKitState.audioChunks, { type: vocalStateKitState.audioRecorder?.mimeType || 'audio/webm' });
  const videoBlob = new Blob(vocalStateKitState.videoChunks, { type: vocalStateKitState.videoRecorder?.mimeType || 'video/webm' });
  vocalStateKitState.audioRecorder = null;
  vocalStateKitState.videoRecorder = null;
  const audioFeatures = await vocalStateBuildAudioSeries(audioBlob);
  const audioSummaryVector = typeof aiTeacherExtractFeatureVector === 'function'
    ? await aiTeacherExtractFeatureVector({ blob: audioBlob, taskId: 'vocal_state_multimodal', attemptId: 1, timestamp: Date.now() })
    : null;
  const session = {
    sessionId: vocalStateId(),
    createdAt: new Date().toISOString(),
    audioFeatures,
    audioSummary: audioSummaryVector?.features || {},
    videoFeatures: vocalStateKitState.videoFeatures.map(({ _chinBrightness, ...feature }) => feature),
    eggFeatures: {
      eggSignal: [],
      contactQuotient: [],
      closureStability: null,
      status: 'not_connected',
    },
    alignmentInfo: {
      clock: 'performance.now',
      audioStartMs: 0,
      videoStartMs: 0,
      eggStartMs: null,
      note: 'All features use milliseconds from the same recording start.',
    },
    mediaPipeStatus: window.FaceLandmarker || window.FaceMesh || window.TasksVision
      ? 'available_not_initialized'
      : 'not_loaded_using_video_proxy',
    audioBlob,
    videoBlob,
  };
  session.summary = vocalStateSummarizeSession(session);
  session.feedback = vocalStateBuildFeedback(session.summary);
  vocalStateKitState.session = session;
  vocalStateKitState.phase = 'complete';
  await vocalStateSaveSession(session);
  vocalStateRender();
  vocalStateRenderResults(session);
}

function showVocalStateKitPage() {
  document.getElementById('modeLauncher')?.setAttribute('hidden', '');
  document.getElementById('libraryPage')?.setAttribute('hidden', '');
  document.getElementById('appWindow')?.setAttribute('hidden', '');
  if (typeof hideVocalMoveLibrary === 'function') hideVocalMoveLibrary();
  if (typeof hideActiveVoiceSearch === 'function') hideActiveVoiceSearch();
  if (typeof hideAiVocalTeacher === 'function') hideAiVocalTeacher();
  if (typeof hideAiExperimentPage === 'function') hideAiExperimentPage();
  if (typeof hideAiCoursePage === 'function') hideAiCoursePage();
  if (typeof hideSongAnalysisPage === 'function') hideSongAnalysisPage();
  const page = document.getElementById('vocalStateKitPage');
  if (page) page.hidden = false;
  vocalStateRender();
}

function hideVocalStateKitPage() {
  vocalStateStopRecording();
  const preview = document.getElementById('vocalStatePreview');
  if (preview) preview.srcObject = null;
  const page = document.getElementById('vocalStateKitPage');
  if (page) page.hidden = true;
}

function bindVocalStateKitEvents() {
  document.getElementById('openVocalStateKitButton')?.addEventListener('click', showVocalStateKitPage);
  document.getElementById('vocalStateBackButton')?.addEventListener('click', () => {
    hideVocalStateKitPage();
    if (typeof showLauncherView === 'function') showLauncherView();
  });
  document.getElementById('vocalStatePrimaryButton')?.addEventListener('click', () => {
    vocalStateStartRecording().catch((error) => {
      console.error(error);
      vocalStateSetText('vocalStateStatus', '无法同时打开麦克风和摄像头，请检查权限。');
      vocalStateKitState.phase = 'idle';
      vocalStateRender();
    });
  });
  document.getElementById('vocalStateStopButton')?.addEventListener('click', vocalStateStopRecording);
}

bindVocalStateKitEvents();
window.showVocalStateKitPage = showVocalStateKitPage;
window.hideVocalStateKitPage = hideVocalStateKitPage;
