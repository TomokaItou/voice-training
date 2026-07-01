const ACTIVE_SEARCH_BASE_PROMPTS = [
  '比刚才更轻一点',
  '更慢地开始',
  '像叹气一样发出来',
  '下巴更放松',
  '嘴角微微笑',
  '气息少一点',
  '音量小一点',
  '保持同样感觉，再短一点',
  '模仿刚才最好的一次',
  '重复最佳样本，但再柔和 10%',
];

const ACTIVE_SEARCH_MUTATION_PROMPTS = [
  '重复这个，但更轻一点',
  '重复这个，但起音再慢一点',
  '重复这个，但气息少一点',
  '重复这个，但更像说话',
  '重复这个，但保持同样音色更长一点',
  '保留刚才的舒服感，音量再小一点',
  '保留刚才的入口，句尾更轻一点',
  '再找一次同样的透明感',
];

const ACTIVE_SEARCH_RECORD_MS = 3200;
const ACTIVE_SEARCH_LIBRARY_LIMIT = 24;

let activeSearchState = {
  unit: 'vowel',
  exerciseText: '啊',
  prompts: [...ACTIVE_SEARCH_BASE_PROMPTS],
  promptIndex: 0,
  attempts: [],
  recorder: null,
  stream: null,
  chunks: [],
  isRecording: false,
  savedBestId: null,
  recordTimer: null,
};

function clampActiveScore(value) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function activeMean(values) {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) return 0;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function activeStd(values) {
  const clean = values.filter(Number.isFinite);
  if (clean.length < 2) return 0;
  const mean = activeMean(clean);
  return Math.sqrt(activeMean(clean.map((value) => (value - mean) ** 2)));
}

function getActiveRms(samples) {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

function getActiveZcr(samples) {
  if (samples.length < 2) return 0;
  let crossings = 0;
  for (let i = 1; i < samples.length; i += 1) {
    if ((samples[i - 1] < 0 && samples[i] >= 0) || (samples[i - 1] >= 0 && samples[i] < 0)) {
      crossings += 1;
    }
  }
  return crossings / samples.length;
}

function estimateActivePitchAndPeriodicity(samples, sampleRate) {
  const rms = getActiveRms(samples);
  if (rms < 0.003) {
    return { pitch: null, periodicity: 0, rms };
  }
  const minLag = Math.max(2, Math.floor(sampleRate / 700));
  const maxLag = Math.min(samples.length - 2, Math.floor(sampleRate / 70));
  let bestLag = -1;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let sum = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < samples.length - lag; i += 1) {
      const a = samples[i];
      const b = samples[i + lag];
      sum += a * b;
      normA += a * a;
      normB += b * b;
    }
    const correlation = normA > 0 && normB > 0 ? sum / Math.sqrt(normA * normB) : 0;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  return {
    pitch: bestLag > 0 && bestCorrelation > 0.32 ? sampleRate / bestLag : null,
    periodicity: Math.max(0, Math.min(1, bestCorrelation)),
    rms,
  };
}

function extractActiveSearchFeatures(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const data = audioBuffer.getChannelData(0);
  const frameSize = Math.max(512, Math.floor(sampleRate * 0.046));
  const hopSize = Math.max(256, Math.floor(frameSize / 2));
  const frames = [];

  for (let start = 0; start + frameSize <= data.length; start += hopSize) {
    const frame = data.subarray(start, start + frameSize);
    const pitchResult = estimateActivePitchAndPeriodicity(frame, sampleRate);
    if (pitchResult.rms < 0.0025) {
      continue;
    }
    frames.push({
      timeMs: (start / sampleRate) * 1000,
      rms: pitchResult.rms,
      pitch: pitchResult.pitch,
      periodicity: pitchResult.periodicity,
      zcr: getActiveZcr(frame),
    });
  }

  return scoreActiveSearchFrames(frames, audioBuffer.duration * 1000);
}

function scoreActiveSearchFrames(frames, durationMs) {
  const rmsValues = frames.map((frame) => frame.rms);
  const pitches = frames.map((frame) => frame.pitch).filter((pitch) => Number.isFinite(pitch) && pitch > 0);
  const zcrValues = frames.map((frame) => frame.zcr);
  const periodicityValues = frames.map((frame) => frame.periodicity);
  const rmsMean = activeMean(rmsValues);
  const rmsStabilityRaw = 1 - Math.min(1, activeStd(rmsValues) / Math.max(0.001, rmsMean * 1.5));
  const pitchMean = activeMean(pitches);
  const pitchStabilityRaw = pitches.length >= 3
    ? 1 - Math.min(1, activeStd(pitches) / Math.max(1, pitchMean * 0.055))
    : rmsStabilityRaw * 0.72;
  const onsetFrames = frames.slice(0, Math.min(5, frames.length));
  const onsetRms = onsetFrames.map((frame) => frame.rms);
  const onsetSmoothRaw = onsetRms.length >= 3
    ? 1 - Math.min(1, activeStd(onsetRms) / Math.max(0.001, activeMean(onsetRms) * 1.2))
    : rmsStabilityRaw;
  const centroidProxyRaw = Math.min(1, activeMean(zcrValues) * 22);
  const hnrRaw = Math.min(1, activeMean(periodicityValues));
  const noiseRaw = 1 - hnrRaw;
  const pitchStability = clampActiveScore(pitchStabilityRaw * 100);
  const energyStability = clampActiveScore(rmsStabilityRaw * 100);
  const onsetSmoothness = clampActiveScore(onsetSmoothRaw * 100);
  const harmonicNoise = clampActiveScore(hnrRaw * 100);
  const spectralCentroid = clampActiveScore((1 - Math.abs(centroidProxyRaw - 0.42)) * 100);
  const score = clampActiveScore(
    pitchStability * 0.24 +
      onsetSmoothness * 0.22 +
      energyStability * 0.22 +
      harmonicNoise * 0.2 +
      spectralCentroid * 0.12
  );

  return {
    score,
    explanation: getActiveSearchExplanation({ pitchStability, onsetSmoothness, energyStability, harmonicNoise }),
    breakdown: {
      pitchStability: Math.round(pitchStability),
      onsetSmoothness: Math.round(onsetSmoothness),
      energyStability: Math.round(energyStability),
      spectralCentroid: Math.round(spectralCentroid),
      harmonicNoise: Math.round(harmonicNoise),
      simplifiedNoise: Math.round(noiseRaw * 100),
    },
    frames: frames.map((frame) => ({
      time: frame.timeMs,
      pitch: frame.pitch,
      rms: frame.rms,
      zcr: frame.zcr,
      periodicity: frame.periodicity,
    })),
    durationMs,
  };
}

function getActiveSearchExplanation(metrics) {
  const entries = [
    ['这一条起音更顺', metrics.onsetSmoothness],
    ['这一条更稳定', metrics.energyStability],
    ['这一条音高更稳', metrics.pitchStability],
    ['这一条噪声更少', metrics.harmonicNoise],
  ].sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || '这一条更接近今天的好状态';
}

function getActiveSearchTopAttempts() {
  return [...activeSearchState.attempts].sort((a, b) => b.score - a.score).slice(0, 3);
}

function setActiveSearchPanel(panelName) {
  const setup = document.getElementById('activeSearchSetupPanel');
  const run = document.getElementById('activeSearchRunPanel');
  const results = document.getElementById('activeSearchResultsPanel');
  if (setup) setup.hidden = panelName !== 'setup';
  if (run) run.hidden = panelName !== 'run';
  if (results) results.hidden = panelName !== 'results';
}

function showActiveVoiceSearch() {
  const page = document.getElementById('activeSearchPage');
  if (!page) return;
  if (typeof hideVocalMoveLibrary === 'function') {
    hideVocalMoveLibrary();
  }
  if (modeLauncher) modeLauncher.hidden = true;
  if (libraryPage) libraryPage.hidden = true;
  if (appWindow) appWindow.hidden = true;
  page.hidden = false;
  setActiveSearchPanel('setup');
}

function hideActiveVoiceSearch() {
  const page = document.getElementById('activeSearchPage');
  if (page) page.hidden = true;
  stopActiveSearchRecording();
}

function resetActiveSearchRound({ mutate = false } = {}) {
  activeSearchState.prompts = mutate ? [...ACTIVE_SEARCH_MUTATION_PROMPTS] : [...ACTIVE_SEARCH_BASE_PROMPTS];
  activeSearchState.promptIndex = 0;
  activeSearchState.attempts = [];
  activeSearchState.savedBestId = null;
  renderActiveSearchAttemptStrip();
  updateActiveSearchPrompt();
}

function beginActiveSearchRound({ mutate = false } = {}) {
  const selected = document.querySelector('.active-search-unit.active');
  activeSearchState.unit = selected?.dataset.activeUnit || activeSearchState.unit;
  activeSearchState.exerciseText = document.getElementById('activeSearchExerciseInput')?.value.trim() || '啊';
  resetActiveSearchRound({ mutate });
  setActiveSearchPanel('run');
}

function updateActiveSearchPrompt() {
  const total = activeSearchState.prompts.length;
  const index = Math.min(activeSearchState.promptIndex, total - 1);
  const prompt = activeSearchState.prompts[index] || ACTIVE_SEARCH_BASE_PROMPTS[0];
  const progressText = document.getElementById('activeSearchProgressText');
  const progressFill = document.getElementById('activeSearchProgressFill');
  const promptText = document.getElementById('activeSearchPromptText');
  const exerciseText = document.getElementById('activeSearchExerciseText');
  const status = document.getElementById('activeSearchRecordStatus');
  if (progressText) progressText.textContent = `${Math.min(index + 1, total)} / ${total}`;
  if (progressFill) progressFill.style.width = `${Math.round((activeSearchState.attempts.length / total) * 100)}%`;
  if (promptText) promptText.textContent = prompt;
  if (exerciseText) exerciseText.textContent = `练习内容：${activeSearchState.exerciseText}`;
  if (status) status.textContent = '准备录 3 秒。不追求满分，只找一个更好的线索。';
}

function renderActiveSearchAttemptStrip() {
  const strip = document.getElementById('activeSearchAttemptStrip');
  if (!strip) return;
  strip.innerHTML = '';
  activeSearchState.attempts.forEach((attempt) => {
    const item = document.createElement('span');
    item.textContent = `第 ${attempt.index} 次已保存`;
    strip.append(item);
  });
}

async function ensureActiveSearchStream() {
  if (activeSearchState.stream?.active) {
    return activeSearchState.stream;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia is not available.');
  }
  activeSearchState.stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
  return activeSearchState.stream;
}

async function recordActiveSearchAttempt() {
  if (activeSearchState.isRecording) {
    stopActiveSearchRecording();
    return;
  }
  const status = document.getElementById('activeSearchRecordStatus');
  const button = document.getElementById('activeSearchRecordButton');
  try {
    const stream = await ensureActiveSearchStream();
    activeSearchState.chunks = [];
    const recorder = new MediaRecorder(stream);
    activeSearchState.recorder = recorder;
    activeSearchState.isRecording = true;
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data?.size) {
        activeSearchState.chunks.push(event.data);
      }
    });
    recorder.addEventListener('stop', () => finalizeActiveSearchAttempt(recorder.mimeType), { once: true });
    recorder.start();
    if (status) status.textContent = '正在录。只要 3 秒，轻轻试一个版本。';
    if (button) button.textContent = '提前结束';
    activeSearchState.recordTimer = window.setTimeout(() => stopActiveSearchRecording(), ACTIVE_SEARCH_RECORD_MS);
  } catch (error) {
    console.error(error);
    if (status) status.textContent = '麦克风还没打开。先确认浏览器权限，再轻轻试一次。';
    activeSearchState.isRecording = false;
    if (button) button.textContent = '录这一条';
  }
}

function stopActiveSearchRecording() {
  if (activeSearchState.recordTimer) {
    window.clearTimeout(activeSearchState.recordTimer);
    activeSearchState.recordTimer = null;
  }
  if (activeSearchState.recorder && activeSearchState.recorder.state !== 'inactive') {
    activeSearchState.recorder.stop();
  }
}

async function finalizeActiveSearchAttempt(mimeType) {
  const button = document.getElementById('activeSearchRecordButton');
  const status = document.getElementById('activeSearchRecordStatus');
  const blob = new Blob(activeSearchState.chunks, { type: mimeType || 'audio/webm' });
  activeSearchState.chunks = [];
  activeSearchState.isRecording = false;
  if (button) button.textContent = '录这一条';
  if (!blob.size) {
    if (status) status.textContent = '这一条太轻了，没有保存。再找一次线索。';
    return;
  }
  if (status) status.textContent = '已保存这一条，Mira 正在轻轻比较。';

  try {
    const audioBuffer = await decodeAudioBlob(blob);
    const features = extractActiveSearchFeatures(audioBuffer);
    const prompt = activeSearchState.prompts[activeSearchState.promptIndex] || '自由尝试';
    activeSearchState.attempts.push({
      id: `avs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      index: activeSearchState.attempts.length + 1,
      prompt,
      exerciseType: activeSearchState.unit,
      exerciseText: activeSearchState.exerciseText,
      blob,
      score: Math.round(features.score),
      explanation: features.explanation,
      breakdown: features.breakdown,
      frames: features.frames,
      durationMs: features.durationMs,
      createdAt: new Date(),
    });
    activeSearchState.promptIndex += 1;
    renderActiveSearchAttemptStrip();
    if (activeSearchState.promptIndex >= activeSearchState.prompts.length) {
      showActiveSearchResults();
    } else {
      updateActiveSearchPrompt();
    }
  } catch (error) {
    console.error(error);
    if (status) status.textContent = '这一条保存了，但分析没跑通。再录一条就好。';
  }
}

function playActiveSearchAttempt(attemptId) {
  const attempt = activeSearchState.attempts.find((item) => item.id === attemptId);
  if (!attempt?.blob) return;
  const audio = new Audio(URL.createObjectURL(attempt.blob));
  audio.addEventListener('ended', () => URL.revokeObjectURL(audio.src));
  audio.play().catch((error) => console.error(error));
}

function compareActiveSearchAttempt(attemptId) {
  const top = getActiveSearchTopAttempts();
  const baseline = top[0];
  const target = activeSearchState.attempts.find((item) => item.id === attemptId);
  if (!baseline || !target) return;
  playActiveSearchAttempt(baseline.id);
  window.setTimeout(() => playActiveSearchAttempt(target.id), Math.min(4200, Math.max(1600, baseline.durationMs + 500)));
}

function showActiveSearchResults() {
  stopActiveSearchRecording();
  setActiveSearchPanel('results');
  const top = getActiveSearchTopAttempts();
  const best = top[0];
  const title = document.getElementById('activeSearchResultTitle');
  const summary = document.getElementById('activeSearchResultSummary');
  if (title) {
    title.textContent = best
      ? `找到了。今天最值得保存的是第 ${best.index} 次。`
      : '今天先存下搜索线索。';
  }
  if (summary) {
    summary.textContent = best
      ? `${best.explanation}。明天练习前先听它 3 遍。`
      : '录几条 2–5 秒的小声音，Mira 会帮你排出 Top 3。';
  }
  renderActiveSearchTopList();
}

function renderActiveSearchTopList() {
  const list = document.getElementById('activeSearchTopList');
  if (!list) return;
  list.innerHTML = '';
  const top = getActiveSearchTopAttempts();
  if (!top.length) {
    const empty = document.createElement('div');
    empty.className = 'recording-library-empty';
    empty.textContent = '还没有样本。先录 3 秒，找到一个线索。';
    list.append(empty);
    return;
  }
  top.forEach((attempt, index) => {
    const item = document.createElement('article');
    item.className = 'active-search-top-item';
    item.innerHTML = `
      <div class="active-search-top-rank">Best Sample ${index + 1}</div>
      <div class="active-search-top-body">
        <strong>第 ${attempt.index} 次 · ${attempt.prompt}</strong>
        <p>${attempt.explanation}</p>
        <div class="active-search-metrics">
          <span>稳定 ${attempt.breakdown.energyStability}</span>
          <span>起音 ${attempt.breakdown.onsetSmoothness}</span>
          <span>噪声 ${100 - attempt.breakdown.simplifiedNoise}</span>
        </div>
      </div>
      <div class="active-search-top-actions">
        <button type="button" data-active-play="${attempt.id}">播放</button>
        <button class="secondary" type="button" data-active-compare="${attempt.id}">A/B 对比</button>
        <button class="secondary" type="button" data-active-mutate="${attempt.id}">再试一次这个感觉</button>
      </div>
    `;
    list.append(item);
  });
}

function createActiveSearchRecording(attempt) {
  return {
    id: `recording-active-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `Active Voice Search 第 ${attempt.index} 次`,
    type: 'recording',
    blob: attempt.blob,
    mimeType: attempt.blob.type || 'audio/webm',
    durationMs: attempt.durationMs,
    frames: attempt.frames.map((frame) => ({
      time: frame.time,
      pitch: frame.pitch,
      rms: frame.rms,
      zcr: frame.zcr,
      spectralFlatness: 1 - frame.periodicity,
      waveformRoughness: 1 - frame.periodicity,
      highFrequencyRatio: Math.min(1, frame.zcr * 8),
      samples: [],
    })),
    createdAt: new Date(),
    source: 'active_voice_search',
    promptText: attempt.prompt,
    exerciseType: attempt.exerciseType,
    scoreBreakdown: attempt.breakdown,
  };
}

function saveActiveSearchBestSample() {
  const best = getActiveSearchTopAttempts()[0];
  if (!best || activeSearchState.savedBestId === best.id) {
    return;
  }
  const recording = createActiveSearchRecording(best);
  recordingLibrary = [recording, ...recordingLibrary].slice(0, ACTIVE_SEARCH_LIBRARY_LIMIT);
  selectedRecordingLibraryId = recording.id;
  saveRecordingLibraryItem(recording).catch((error) => console.error(error));
  renderRecordingLibrary();
  updateRecordingLibraryStatus();

  const sample = buildSuccessSample(recording, {
    source: 'active_voice_search',
    tags: ['active_voice_search', 'best_overall'],
    note: `${best.prompt} · ${best.explanation}`,
  });
  if (sample) {
    sample.exerciseType = best.exerciseType;
    sample.promptText = best.prompt;
    sample.scoreBreakdown = best.breakdown;
    sample.targetReference = '';
    addSuccessSample(sample);
  }

  activeSearchState.savedBestId = best.id;
  const summary = document.getElementById('activeSearchResultSummary');
  if (summary) {
    summary.textContent = `已保存第 ${best.index} 次。明天练习前先听它 3 遍。`;
  }
}

function bindActiveSearchEvents() {
  document.getElementById('openActiveSearchButton')?.addEventListener('click', showActiveVoiceSearch);
  document.getElementById('activeSearchBackHomeButton')?.addEventListener('click', () => {
    hideActiveVoiceSearch();
    if (typeof showLauncherView === 'function') showLauncherView();
  });
  document.getElementById('activeSearchBeginButton')?.addEventListener('click', () => beginActiveSearchRound());
  document.getElementById('activeSearchRecordButton')?.addEventListener('click', recordActiveSearchAttempt);
  document.getElementById('activeSearchSkipButton')?.addEventListener('click', () => {
    activeSearchState.promptIndex = Math.min(activeSearchState.promptIndex + 1, activeSearchState.prompts.length);
    if (activeSearchState.promptIndex >= activeSearchState.prompts.length) showActiveSearchResults();
    else updateActiveSearchPrompt();
  });
  document.getElementById('activeSearchFinishButton')?.addEventListener('click', showActiveSearchResults);
  document.getElementById('activeSearchSaveBestButton')?.addEventListener('click', saveActiveSearchBestSample);
  document.getElementById('activeSearchNewRoundButton')?.addEventListener('click', () => beginActiveSearchRound({ mutate: true }));
  document.getElementById('activeSearchRestartButton')?.addEventListener('click', () => setActiveSearchPanel('setup'));
  document.querySelectorAll('.active-search-unit').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.active-search-unit').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      activeSearchState.unit = button.dataset.activeUnit || 'vowel';
    });
  });
  document.getElementById('activeSearchTopList')?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const play = target?.closest('[data-active-play]');
    const compare = target?.closest('[data-active-compare]');
    const mutate = target?.closest('[data-active-mutate]');
    if (play) playActiveSearchAttempt(play.dataset.activePlay);
    if (compare) compareActiveSearchAttempt(compare.dataset.activeCompare);
    if (mutate) beginActiveSearchRound({ mutate: true });
  });
}

bindActiveSearchEvents();

window.showActiveVoiceSearch = showActiveVoiceSearch;
window.hideActiveVoiceSearch = hideActiveVoiceSearch;
window.extractActiveSearchFeatures = extractActiveSearchFeatures;
window.scoreActiveSearchFrames = scoreActiveSearchFrames;
