const AI_EXPERIMENT_PROMPT = `
你是一个 AI 声乐老师。你的任务不是使用抽象声乐术语，而是把声音问题翻译成用户能理解、能执行、能验证的语言。

规则：
- 不要直接说“声音位置散”“气息托住”“共鸣挂上去”等抽象表达。
- 先说你观察到了什么。
- 再说你猜测可能是什么原因。
- 最后只选择一个要验证的练习目标。
- 每次只验证一件事。
- 不要列很多问题。
- 不要输出长篇解释。
- 用户应该看完后立刻知道下一步要做什么。

输出格式固定为：
观察到：
...

AI猜测：
...

现在只验证一件事：
...

为什么这么说：
...
`;
const aiExperimentState = {
  phase: 'idle',
  session: null,
  recorder: null,
  stream: null,
  chunks: [],
};

function aiExperimentId() {
  return `experiment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function aiExperimentSetText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function aiExperimentFeatures() {
  return aiExperimentState.phase === 'after_recorded'
    ? aiExperimentState.session?.afterFeatures
    : aiExperimentState.session?.beforeFeatures;
}

function aiExperimentFeatureValue(features, key, fallback = 0) {
  const value = features?.[key];
  return Number.isFinite(value) ? value : fallback;
}

function aiExperimentConfidenceLabel(score) {
  if (score >= 0.72) return '高';
  if (score >= 0.42) return '中';
  return '低';
}

function buildAiExperimentHypothesis(features) {
  const pitchStd = aiExperimentFeatureValue(features, 'pitch_std', 0);
  const loudnessStd = aiExperimentFeatureValue(features, 'loudness_std', 0);
  const harmonicity = aiExperimentFeatureValue(features, 'harmonicity_mean', 0.7);
  const centroid = aiExperimentFeatureValue(features, 'spectral_centroid_mean', 0);
  const tilt = aiExperimentFeatureValue(features, 'spectral_tilt_mean', 0);
  const candidates = [
    {
      key: 'closure',
      score: (1 - harmonicity) * 1.25 + Math.max(0, pitchStd - 18) / 70,
      observations: [
        '声音里的稳定核心偏少。',
        '有些音的音高会被气声带得不太稳。',
      ],
      guess: '可能不是你唱不准，而是声音一开始还没有稳定合上。',
      validation: '做一个轻轻的 gee，看声音能不能更稳、更少漏气。',
      why: [
        'harmonicity 偏低 → 听起来核心不够稳定，可能有漏气感',
        'pitch stability 下降 → 音高容易被不稳定的发声状态带动',
      ],
      exercise: {
        title: '轻轻的 gee 稳定练习',
        goal: '验证声音能不能更稳、更少漏气。',
        steps: ['用很轻的 gee 唱 5 次。', '每次保持 2 秒。', '不要加大音量，只听声音有没有更稳。'],
      },
    },
    {
      key: 'pitch',
      score: Math.max(0, pitchStd - 12) / 45,
      observations: [
        '音高上下摆动比较明显。',
        '同一个短音每次落点不太一致。',
      ],
      guess: '可能是起音和落点还没有固定住。',
      validation: '只唱一个舒服的 ma，看每次能不能落在同一个音高。',
      why: [
        'pitch stability 偏低 → 听起来音高会晃',
        'pitch_std 偏高 → 同一个音的落点不够一致',
      ],
      exercise: {
        title: '单音落点练习',
        goal: '验证每次能不能落在同一个音高。',
        steps: ['选一个舒服的音唱 ma。', '唱 5 次，每次 2 秒。', '起音轻一点，稳住后再结束。'],
      },
    },
    {
      key: 'breath',
      score: Math.max(0, loudnessStd - 5) / 18,
      observations: [
        '音量起伏比较大。',
        '声音有时会突然变轻或变重。',
      ],
      guess: '可能是气流输出还不够均匀。',
      validation: '用轻声 wu 连成一条线，看音量能不能更平。',
      why: [
        'energy stability 偏低 → 听起来忽大忽小',
        'loudness_std 偏高 → 音量控制不够均匀',
      ],
      exercise: {
        title: '轻声连线练习',
        goal: '验证音量能不能更平稳。',
        steps: ['用 wu 轻声唱 4 次。', '每次 3 秒。', '音量保持小而平，不要顶。'],
      },
    },
    {
      key: 'brightness',
      score: Math.max(0, centroid - 1800) / 2600 + Math.max(0, -tilt) / 30,
      observations: [
        '声音亮度变化比较大。',
        '高频能量不够稳定。',
        '有些音听起来一会儿清楚、一会儿发散。',
      ],
      guess: '可能是发声状态还不够稳定，而不是单纯音准问题。',
      validation: '做一个 ng 到 ma 的短练习，看亮暗变化能不能变小。',
      why: [
        'spectral centroid 变化偏大 → 听起来亮暗变化较大',
        'brightness 不稳定 → 有些音会忽然变散或变尖',
        'harmonicity 作为参考 → 判断声音核心是否稳定',
      ],
      exercise: {
        title: 'ng 到 ma 稳定练习',
        goal: '验证声音亮暗变化能不能变小。',
        steps: ['先轻轻哼 ng 2 秒。', '接到 ma 2 秒。', '做 5 次，保持轻松，不要变大声。'],
      },
    },
  ];
  const best = candidates.sort((left, right) => right.score - left.score)[0];
  return {
    ...best,
    confidence: aiExperimentConfidenceLabel(best.score),
    confidenceScore: Number(best.score.toFixed(3)),
  };
}
function buildAiExperimentDiff(before = {}, after = {}) {
  return {
    pitch_std: aiExperimentFeatureValue(after, 'pitch_std') - aiExperimentFeatureValue(before, 'pitch_std'),
    loudness_std: aiExperimentFeatureValue(after, 'loudness_std') - aiExperimentFeatureValue(before, 'loudness_std'),
    harmonicity_mean: aiExperimentFeatureValue(after, 'harmonicity_mean') - aiExperimentFeatureValue(before, 'harmonicity_mean'),
    spectral_centroid_mean: aiExperimentFeatureValue(after, 'spectral_centroid_mean') - aiExperimentFeatureValue(before, 'spectral_centroid_mean'),
  };
}

function buildAiExperimentResult(session) {
  const diff = buildAiExperimentDiff(session.beforeFeatures, session.afterFeatures);
  const focus = session.hypothesis?.key;
  let score = 0;
  const changes = [];
  if (diff.pitch_std < -1.5) {
    score += focus === 'pitch' ? 2 : 1;
    changes.push('音高更稳定');
  }
  if (diff.loudness_std < -0.8) {
    score += focus === 'breath' ? 2 : 1;
    changes.push('音量更平稳');
  }
  if (diff.harmonicity_mean > 0.04) {
    score += focus === 'closure' ? 2 : 1;
    changes.push('气声减少');
  }
  if (Math.abs(diff.spectral_centroid_mean) < 180) {
    score += focus === 'brightness' ? 1 : 0;
    changes.push('亮暗变化更小');
  }
  const result = score >= 3
    ? '有效'
    : score >= 2
      ? '可能有效'
      : score <= 0
        ? '可能方向不对'
        : '无明显改善';
  return {
    result,
    change: changes.length ? changes.join('，') : '这次数据变化不明显',
    nextAction: /有效/.test(result)
      ? '继续用这个练习做 3 轮。'
      : result === '无明显改善'
        ? '再做一轮，但把音量放轻。'
        : '换一个更简单的练习方向。',
    featureDiff: diff,
  };
}

function renderAiExperiment() {
  const session = aiExperimentState.session;
  const primary = document.getElementById('aiExperimentPrimaryButton');
  const stop = document.getElementById('aiExperimentStopButton');
  const isRecording = Boolean(aiExperimentState.recorder);
  stop.hidden = !isRecording;
  if (primary) primary.disabled = isRecording;

  const phaseCopy = {
    idle: ['Probe', '先听一下你现在的状态', '我先听一下你现在的状态。请录一段 5–10 秒的短声音。', '开始实验'],
    before_recording: ['Probe', '正在录第一段', '保持 5–10 秒就好，不需要唱完整句。', '录音中'],
    before_recorded: ['Hypothesis', '我只给一个假设', '我会先判断一个最值得验证的方向。', '生成假设'],
    exercise: ['Exercise', '做一个很短的练习', '只做这个练习，不加其它技巧。', '开始练习'],
    after_ready: ['Probe', '重新录一次', '录同样长度的声音，看看练习有没有帮上忙。', '重新录一次'],
    after_recording: ['Probe', '正在录复测', '和刚才一样短就好。', '录音中'],
    after_recorded: ['Result', '看实验结果', '我会只判断这个练习有没有帮助。', '查看实验结果'],
    complete: ['Result', '实验完成', '今天先固定一个方向。', '再做一次实验'],
  }[aiExperimentState.phase] || [];

  aiExperimentSetText('aiExperimentStepLabel', phaseCopy[0]);
  aiExperimentSetText('aiExperimentTitle', phaseCopy[1]);
  aiExperimentSetText('aiExperimentMessage', phaseCopy[2]);
  if (primary) primary.textContent = phaseCopy[3] || '继续';
  aiExperimentSetText('aiExperimentStatus', isRecording ? '正在录音。' : '准备好了。');

  document.getElementById('aiExperimentHypothesisPanel').hidden = !session?.hypothesis;
  document.getElementById('aiExperimentExercisePanel').hidden = !session?.exercise;
  document.getElementById('aiExperimentResultPanel').hidden = !session?.result;
  if (session?.hypothesis) {
    const observations = document.getElementById('aiExperimentObservationList');
    if (observations) {
      observations.innerHTML = (session.hypothesis.observations || [])
        .map((item) => `<li>${item}</li>`)
        .join('');
    }
    aiExperimentSetText('aiExperimentGuessText', session.hypothesis.guess || '--');
    aiExperimentSetText('aiExperimentVerifyText', session.hypothesis.validation || '--');
    const why = document.getElementById('aiExperimentWhyList');
    if (why) {
      why.innerHTML = (session.hypothesis.why || [])
        .map((item) => `<li>${item}</li>`)
        .join('');
    }
  }
  if (session?.exercise) {
    aiExperimentSetText('aiExperimentExerciseTitle', session.exercise.title);
    aiExperimentSetText('aiExperimentExerciseGoal', session.exercise.goal);
    const steps = document.getElementById('aiExperimentExerciseSteps');
    if (steps) steps.innerHTML = session.exercise.steps.map((step) => `<li>${step}</li>`).join('');
  }
  if (session?.result) {
    aiExperimentSetText('aiExperimentResultText', session.result.result);
    aiExperimentSetText('aiExperimentChangeText', session.result.change);
    aiExperimentSetText('aiExperimentNextText', session.result.nextAction);
  }
  const debug = document.getElementById('aiExperimentDebugJson');
  if (debug) debug.textContent = JSON.stringify({
    prompt: AI_EXPERIMENT_PROMPT.trim(),
    phase: aiExperimentState.phase,
    session,
  }, null, 2);
}

async function startAiExperimentRecording(kind) {
  aiExperimentState.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  aiExperimentState.chunks = [];
  const recorder = new MediaRecorder(aiExperimentState.stream);
  aiExperimentState.recorder = recorder;
  aiExperimentState.phase = kind === 'after' ? 'after_recording' : 'before_recording';
  recorder.addEventListener('dataavailable', (event) => {
    if (event.data?.size) aiExperimentState.chunks.push(event.data);
  });
  recorder.addEventListener('stop', () => finalizeAiExperimentRecording(kind, recorder.mimeType), { once: true });
  recorder.start();
  renderAiExperiment();
}

function stopAiExperimentRecording() {
  if (aiExperimentState.recorder && aiExperimentState.recorder.state !== 'inactive') {
    aiExperimentState.recorder.stop();
  }
}

async function finalizeAiExperimentRecording(kind, mimeType) {
  const blob = new Blob(aiExperimentState.chunks, { type: mimeType || 'audio/webm' });
  aiExperimentState.stream?.getTracks().forEach((track) => track.stop());
  aiExperimentState.stream = null;
  aiExperimentState.recorder = null;
  const vector = await aiTeacherExtractFeatureVector({
    blob,
    taskId: kind === 'after' ? 'experiment_after_probe' : 'experiment_before_probe',
    attemptId: 1,
    timestamp: Date.now(),
  });
  if (!aiExperimentState.session) {
    aiExperimentState.session = {
      id: aiExperimentId(),
      createdAt: new Date().toISOString(),
    };
  }
  if (kind === 'after') {
    aiExperimentState.session.probeAfterAudio = blob;
    aiExperimentState.session.afterFeatures = vector.features;
    aiExperimentState.phase = 'after_recorded';
  } else {
    aiExperimentState.session.probeBeforeAudio = blob;
    aiExperimentState.session.beforeFeatures = vector.features;
    aiExperimentState.phase = 'before_recorded';
  }
  renderAiExperiment();
}

async function saveAiExperimentSession(session) {
  if (typeof aiTeacherSave === 'function') {
    try {
      await aiTeacherSave('experimentSessions', {
        ...session,
        probeBeforeAudio: undefined,
        probeAfterAudio: undefined,
      });
    } catch (error) {
      console.warn('Experiment session save failed', error);
    }
  }
}

async function handleAiExperimentPrimary() {
  if (aiExperimentState.phase === 'idle' || aiExperimentState.phase === 'complete') {
    aiExperimentState.session = {
      id: aiExperimentId(),
      createdAt: new Date().toISOString(),
    };
    await startAiExperimentRecording('before');
    return;
  }
  if (aiExperimentState.phase === 'before_recorded') {
    const hypothesis = buildAiExperimentHypothesis(aiExperimentState.session.beforeFeatures);
    aiExperimentState.session.hypothesis = hypothesis;
    aiExperimentState.session.confidence = hypothesis.confidence;
    aiExperimentState.session.exercise = hypothesis.exercise;
    aiExperimentState.phase = 'exercise';
    renderAiExperiment();
    return;
  }
  if (aiExperimentState.phase === 'exercise') {
    aiExperimentState.phase = 'after_ready';
    renderAiExperiment();
    return;
  }
  if (aiExperimentState.phase === 'after_ready') {
    await startAiExperimentRecording('after');
    return;
  }
  if (aiExperimentState.phase === 'after_recorded') {
    const result = buildAiExperimentResult(aiExperimentState.session);
    aiExperimentState.session.result = result;
    aiExperimentState.session.featureDiff = result.featureDiff;
    aiExperimentState.session.nextAction = result.nextAction;
    aiExperimentState.phase = 'complete';
    await saveAiExperimentSession(aiExperimentState.session);
    renderAiExperiment();
  }
}

function showAiExperimentPage() {
  document.getElementById('modeLauncher')?.setAttribute('hidden', '');
  document.getElementById('libraryPage')?.setAttribute('hidden', '');
  document.getElementById('appWindow')?.setAttribute('hidden', '');
  if (typeof hideVocalMoveLibrary === 'function') hideVocalMoveLibrary();
  if (typeof hideActiveVoiceSearch === 'function') hideActiveVoiceSearch();
  if (typeof hideAiVocalTeacher === 'function') hideAiVocalTeacher();
  if (typeof hideAiCoursePage === 'function') hideAiCoursePage();
  if (typeof hideVocalStateKitPage === 'function') hideVocalStateKitPage();
  if (typeof hideSongAnalysisPage === 'function') hideSongAnalysisPage();
  const page = document.getElementById('aiExperimentPage');
  if (page) page.hidden = false;
  renderAiExperiment();
}

function hideAiExperimentPage() {
  stopAiExperimentRecording();
  const page = document.getElementById('aiExperimentPage');
  if (page) page.hidden = true;
}

function bindAiExperimentEvents() {
  document.querySelector('[data-open-ai-experiment]')?.addEventListener('click', showAiExperimentPage);
  document.getElementById('aiExperimentBackButton')?.addEventListener('click', () => {
    hideAiExperimentPage();
    if (typeof showLauncherView === 'function') showLauncherView();
  });
  document.getElementById('aiExperimentPrimaryButton')?.addEventListener('click', () => {
    handleAiExperimentPrimary().catch((error) => {
      console.error(error);
      aiExperimentSetText('aiExperimentStatus', '录音或分析失败，请再试一次。');
      aiExperimentState.recorder = null;
      renderAiExperiment();
    });
  });
  document.getElementById('aiExperimentStopButton')?.addEventListener('click', stopAiExperimentRecording);
}

bindAiExperimentEvents();
window.showAiExperimentPage = showAiExperimentPage;
window.hideAiExperimentPage = hideAiExperimentPage;
