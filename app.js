const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const exportCsvButton = document.getElementById('exportCsvButton');
const exportPngButton = document.getElementById('exportPngButton');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const formantToggle = document.getElementById('formantToggle');
const formantF1El = document.getElementById('formantF1');
const formantF2El = document.getElementById('formantF2');
const formantStatusEl = document.getElementById('formantStatus');
const audioFileInput = document.getElementById('audioFileInput');
const clearFileButton = document.getElementById('clearFileButton');
const dataSourceValue = document.getElementById('dataSourceValue');
const analysisStatus = document.getElementById('analysisStatus');
const statusEl = document.getElementById('status');
const pitchValueEl = document.getElementById('pitchValue');
const noteValueEl = document.getElementById('noteValue');
const canvas = document.getElementById('pitchCanvas');
const ctx = canvas.getContext('2d');

let audioContext;
let analyser;
let dataArray;
let frequencyData;
let sourceNode;
let animationId;
let pitchHistory = [];
const maxHistorySeconds = 12;
const displayUpdateIntervalMs = 100;
const pitchMinHz = 60;
const pitchMaxHz = 1000;
const pitchEnergyThreshold = 0.015;
const pitchEnergyRef = 0.05;
const pitchConfidenceThreshold = 0.6;
const pitchMedianWindowSize = 5;
const pitchMaxJumpHz = 30;
const pitchMaxJumpCents = 50;
const formantUpdateIntervalMs = 150;
const formantWindowSize = 5;
const formantTauMs = 450;
const formantSmoothingHz = 120;
const formantMaxJumpHz = { f1: 90, f2: 160 };
const formantValidRanges = {
  f1: { min: 200, max: 1000 },
  f2: { min: 700, max: 3000 },
  minSeparation: 150,
};
const offlineFrameDurationMs = 20;
const offlineHopDurationMs = 10;
const offlineMaxDurationSeconds = 300;
const offlineProgressUpdateMs = 200;
let lastDisplayUpdate = 0;
let currentPitch = null;
let lastStablePitch = null;
let recentPitchWindow = [];
let sessionStartTime = 0;
let lastFormantUpdate = 0;
let lastFormantTimestamp = 0;
let smoothedFormants = { f1: null, f2: null };
let stableFormants = { f1: null, f2: null };
let formantHistory = { f1: [], f2: [] };
let offlineMode = false;
let offlineAbort = false;
let offlineFormantHistory = [];
let offlineSourceSampleRate = null;
let offlineAnalysisInProgress = false;

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function setStatus(text, tone = 'info') {
  statusEl.textContent = text;
  statusEl.style.background = tone === 'active' ? '#e8f0ff' : '#eef1f7';
  statusEl.style.color = tone === 'active' ? '#2f4fdd' : '#49506b';
}

function setDataSourceLabel(source) {
  dataSourceValue.textContent = source;
}

function setAnalysisStatus(text) {
  analysisStatus.textContent = text;
}

function frequencyToNote(freq) {
  if (!freq) {
    return '--';
  }
  const noteNumber = 12 * (Math.log2(freq / 440)) + 69;
  const rounded = Math.round(noteNumber);
  const noteIndex = ((rounded % 12) + 12) % 12;
  const octave = Math.floor(rounded / 12) - 1;
  return `${noteNames[noteIndex]}${octave}`;
}

function computeRms(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const value = buffer[i];
    sum += value * value;
  }
  return Math.sqrt(sum / buffer.length);
}

function autoCorrelateWithConfidence(buffer, sampleRate) {
  const size = buffer.length;
  const rms = computeRms(buffer);
  if (rms < pitchEnergyThreshold) {
    return { pitch: null, confidence: 0, rms };
  }

  let bestOffset = -1;
  let bestCorrelation = 0;
  const maxOffset = Math.floor(size / 2);

  for (let offset = 32; offset < maxOffset; offset += 1) {
    let correlation = 0;
    for (let i = 0; i < maxOffset; i += 1) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / maxOffset;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  const pitch = bestOffset !== -1 ? sampleRate / bestOffset : null;
  const energyScore = Math.min(1, rms / pitchEnergyRef);
  const confidence = Math.max(0, Math.min(1, bestCorrelation * energyScore));

  return { pitch, confidence, rms };
}

function autoCorrelate(buffer, sampleRate) {
  const size = buffer.length;
  const rms = computeRms(buffer);
  if (rms < pitchEnergyThreshold) {
    return null;
  }

  let bestOffset = -1;
  let bestCorrelation = 0;
  const maxOffset = Math.floor(size / 2);

  for (let offset = 32; offset < maxOffset; offset += 1) {
    let correlation = 0;
    for (let i = 0; i < maxOffset; i += 1) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / maxOffset;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestCorrelation > 0.9 && bestOffset !== -1) {
    return sampleRate / bestOffset;
  }

  return null;
}

function drawAxes(minPitch = null, maxPitch = null) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#e5e9f3';
  ctx.lineWidth = 1;

  const horizontalLines = 5;
  const labelFont = '12px sans-serif';
  ctx.font = labelFont;
  ctx.fillStyle = '#94a3b8';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= horizontalLines; i += 1) {
    const y = (canvas.height / horizontalLines) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    if (minPitch !== null && maxPitch !== null) {
      const ratio = 1 - i / horizontalLines;
      const labelValue = minPitch + (maxPitch - minPitch) * ratio;
      const label = `${Math.round(labelValue)} Hz`;
      ctx.fillText(label, 8, y);
    }
  }
}

function drawPitchHistory() {
  if (pitchHistory.length < 2) {
    drawAxes();
    return;
  }

  let visibleHistory = pitchHistory;
  let minTime = 0;
  let durationMs = 0;

  if (offlineMode) {
    minTime = pitchHistory[0].time;
    const maxTime = pitchHistory[pitchHistory.length - 1].time;
    durationMs = Math.max(maxTime - minTime, 1);
  } else {
    const now = performance.now();
    minTime = now - maxHistorySeconds * 1000;
    visibleHistory = pitchHistory.filter((point) => point.time >= minTime);
    pitchHistory = visibleHistory;
    durationMs = maxHistorySeconds * 1000;
  }

  const pitches = visibleHistory.map((point) => point.pitch).filter(Boolean);
  if (pitches.length === 0) {
    drawAxes();
    return;
  }
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);
  const pitchRange = Math.max(maxPitch - minPitch, 1);
  const padding = 20;

  drawAxes(minPitch, maxPitch);

  ctx.strokeStyle = '#3a6ff7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  let hasActivePath = false;

  visibleHistory.forEach((point) => {
    if (point.pitch === null) {
      if (hasActivePath) {
        ctx.stroke();
        ctx.beginPath();
        hasActivePath = false;
      }
      return;
    }
    if (!point.pitch) {
      return;
    }
    const x = ((point.time - minTime) / durationMs) * canvas.width;
    const normalized = (point.pitch - minPitch) / pitchRange;
    const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
    if (!hasActivePath) {
      ctx.moveTo(x, y);
      hasActivePath = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  if (hasActivePath) {
    ctx.stroke();
  }

  if (!offlineMode && currentPitch) {
    const normalized = (currentPitch - minPitch) / pitchRange;
    const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
    ctx.strokeStyle = '#ff7a59';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    ctx.fillStyle = '#ff7a59';
    ctx.font = '14px sans-serif';
    ctx.textBaseline = 'middle';
    const label = `${Math.round(currentPitch)} Hz`;
    ctx.fillText(label, 8, y);
  }
}

function setFormantDisplay(f1, f2) {
  formantF1El.textContent = f1 ? `${Math.round(f1)} Hz` : '— Hz';
  formantF2El.textContent = f2 ? `${Math.round(f2)} Hz` : '— Hz';
}

function setFormantStatus(message) {
  formantStatusEl.textContent = message || '';
}

function resetFormants() {
  smoothedFormants = { f1: null, f2: null };
  stableFormants = { f1: null, f2: null };
  formantHistory = { f1: [], f2: [] };
  setFormantDisplay(null, null);
  setFormantStatus('');
}

function smoothFormantValue(previous, next, alpha) {
  if (next === null || next === undefined) {
    return previous;
  }
  if (previous === null || previous === undefined) {
    return next;
  }
  return previous + alpha * (next - previous);
}

function pushFormantSample(buffer, value) {
  const nextBuffer = [...buffer, value].slice(-formantWindowSize);
  return nextBuffer;
}

function median(values) {
  if (!values.length) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function pushPitchSample(buffer, value) {
  const nextBuffer = [...buffer, value].slice(-pitchMedianWindowSize);
  return nextBuffer;
}

function getMaxJumpThresholdHz(reference) {
  if (!reference) {
    return pitchMaxJumpHz;
  }
  const centsFactor = Math.pow(2, pitchMaxJumpCents / 1200) - 1;
  const centsJump = reference * centsFactor;
  return Math.min(pitchMaxJumpHz, centsJump);
}

function selectPitchCandidate(pitch, reference) {
  if (!reference) {
    return pitch;
  }
  const candidates = [pitch / 2, pitch, pitch * 2].filter(
    (value) => value >= pitchMinHz && value <= pitchMaxHz
  );
  let best = null;
  let bestDiff = Infinity;
  candidates.forEach((value) => {
    const diff = Math.abs(value - reference);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = value;
    }
  });
  return best;
}

function appendPitchBreak(time) {
  if (!pitchHistory.length || pitchHistory[pitchHistory.length - 1].pitch !== null) {
    pitchHistory.push({ time, pitch: null });
  }
}

function limitJump(previous, next, maxJump) {
  if (previous === null || previous === undefined) {
    return next;
  }
  const delta = next - previous;
  if (Math.abs(delta) <= maxJump) {
    return next;
  }
  return previous + Math.sign(delta) * maxJump;
}

function estimateFormantsFromSpectrum(spectrum, sampleRate, fftSize) {
  const binCount = spectrum.length;
  const binResolution = sampleRate / fftSize;
  const windowBins = Math.max(1, Math.round(formantSmoothingHz / binResolution));
  const smoothed = new Float32Array(binCount);

  let windowSum = 0;
  for (let i = 0; i < binCount; i += 1) {
    windowSum += spectrum[i];
    if (i >= windowBins) {
      windowSum -= spectrum[i - windowBins];
    }
    const denom = Math.min(i + 1, windowBins);
    smoothed[i] = windowSum / denom;
  }

  const findPeak = (minHz, maxHz, minimumHz) => {
    const startBin = Math.max(0, Math.floor(minHz / binResolution));
    const endBin = Math.min(binCount - 1, Math.ceil(maxHz / binResolution));
    let bestBin = -1;
    let bestValue = -Infinity;
    for (let i = startBin; i <= endBin; i += 1) {
      const freq = i * binResolution;
      if (minimumHz && freq < minimumHz) {
        continue;
      }
      const value = smoothed[i];
      if (value > bestValue) {
        bestValue = value;
        bestBin = i;
      }
    }
    if (bestBin === -1) {
      return null;
    }
    return bestBin * binResolution;
  };

  const f1 = findPeak(formantValidRanges.f1.min, formantValidRanges.f1.max);
  const f2 = findPeak(
    formantValidRanges.f2.min,
    formantValidRanges.f2.max,
    f1 ? f1 + formantValidRanges.minSeparation : null
  );

  return { f1, f2 };
}

function estimateFormants() {
  if (!analyser || !frequencyData) {
    return { f1: null, f2: null };
  }

  analyser.getFloatFrequencyData(frequencyData);
  return estimateFormantsFromSpectrum(
    frequencyData,
    audioContext.sampleRate,
    analyser.fftSize
  );
}

function isValidFormantPair(f1, f2) {
  if (!f1 || !f2) {
    return false;
  }
  if (f1 < formantValidRanges.f1.min || f1 > formantValidRanges.f1.max) {
    return false;
  }
  if (f2 < formantValidRanges.f2.min || f2 > formantValidRanges.f2.max) {
    return false;
  }
  if (f2 <= f1 + formantValidRanges.minSeparation) {
    return false;
  }
  return true;
}

function stabilizeFormants(rawF1, rawF2, now) {
  if (!isValidFormantPair(rawF1, rawF2)) {
    setFormantStatus('信号不稳定/无声');
    return stableFormants;
  }

  setFormantStatus('');
  formantHistory = {
    f1: pushFormantSample(formantHistory.f1, rawF1),
    f2: pushFormantSample(formantHistory.f2, rawF2),
  };
  const medianF1 = median(formantHistory.f1);
  const medianF2 = median(formantHistory.f2);
  const limitedF1 = limitJump(smoothedFormants.f1, medianF1, formantMaxJumpHz.f1);
  const limitedF2 = limitJump(smoothedFormants.f2, medianF2, formantMaxJumpHz.f2);

  const dt = Math.max(now - lastFormantTimestamp, formantUpdateIntervalMs);
  const alpha = 1 - Math.exp(-dt / formantTauMs);
  smoothedFormants = {
    f1: smoothFormantValue(smoothedFormants.f1, limitedF1, alpha),
    f2: smoothFormantValue(smoothedFormants.f2, limitedF2, alpha),
  };
  stableFormants = { ...smoothedFormants };
  return stableFormants;
}

function hasRecentPitchData() {
  if (offlineMode) {
    return pitchHistory.some((point) => point.pitch);
  }
  const now = performance.now();
  const minTime = now - maxHistorySeconds * 1000;
  return pitchHistory.some((point) => point.time >= minTime && point.pitch);
}

function updateExportButtons() {
  const hasData = hasRecentPitchData();
  const hasSession = Boolean(audioContext) || offlineMode;
  exportCsvButton.disabled = !hasSession || !hasData;
  exportPngButton.disabled = !hasSession || !hasData;
}

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '_',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  if (!pitchHistory.length) {
    return;
  }
  const now = performance.now();
  const minTime = now - maxHistorySeconds * 1000;
  const rows = pitchHistory
    .filter((point) => point.time >= minTime && point.pitch)
    .map((point) => {
      const timestampMs = Math.max(0, Math.round(point.time - sessionStartTime));
      const frequencyHz = Number(point.pitch.toFixed(1));
      const note = frequencyToNote(point.pitch);
      return [timestampMs, frequencyHz, note].join(',');
    });

  if (!rows.length) {
    return;
  }

  const header = 'timestampMs,frequencyHz,note';
  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const filename = `voice-training_${formatTimestamp(new Date())}.csv`;
  downloadBlob(blob, filename);
}

function exportPng() {
  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }
    const filename = `voice-training_${formatTimestamp(new Date())}.png`;
    downloadBlob(blob, filename);
  });
}

function setOfflineMode(enabled) {
  offlineMode = enabled;
  clearFileButton.disabled = !offlineMode;
  audioFileInput.disabled = offlineMode && offlineAnalysisInProgress;
  startButton.disabled = offlineMode || offlineAnalysisInProgress;
  stopButton.disabled = offlineMode || offlineAnalysisInProgress;
  setDataSourceLabel(offlineMode ? '音频文件' : '实时麦克风');
  updateExportButtons();
}

function resetOfflineState() {
  offlineAbort = false;
  offlineAnalysisInProgress = false;
  offlineFormantHistory = [];
  offlineSourceSampleRate = null;
  audioFileInput.value = '';
  setAnalysisStatus('未开始');
}

async function decodeAudioFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const decodeContext = new (window.AudioContext || window.webkitAudioContext)();
  try {
    return await decodeContext.decodeAudioData(arrayBuffer);
  } finally {
    decodeContext.close();
  }
}

function formatPercent(value) {
  return `${Math.min(100, Math.max(0, value)).toFixed(0)}%`;
}

async function analyzeAudioFile(file) {
  if (!file) {
    return;
  }
  if (offlineAnalysisInProgress) {
    return;
  }

  stop();
  offlineAnalysisInProgress = true;
  setOfflineMode(true);
  offlineAbort = false;
  setAnalysisStatus('解码中...');

  let audioBuffer;
  try {
    audioBuffer = await decodeAudioFile(file);
  } catch (error) {
    console.error(error);
    setAnalysisStatus('解码失败，请尝试 wav/mp3');
    offlineAnalysisInProgress = false;
    setOfflineMode(true);
    return;
  }

  const durationSeconds = audioBuffer.duration;
  if (durationSeconds > offlineMaxDurationSeconds) {
    const proceed = window.confirm(
      `音频时长为 ${Math.round(durationSeconds)} 秒，超过默认限制 ${offlineMaxDurationSeconds} 秒，继续分析全片吗？`
    );
    if (!proceed) {
      setAnalysisStatus('已取消');
      offlineAnalysisInProgress = false;
      return;
    }
  }

  setAnalysisStatus('分析中... 0%');
  sessionStartTime = 0;
  pitchHistory = [];
  formantHistory = { f1: [], f2: [] };
  smoothedFormants = { f1: null, f2: null };
  stableFormants = { f1: null, f2: null };
  currentPitch = null;
  lastFormantTimestamp = 0;
  lastFormantUpdate = 0;
  offlineSourceSampleRate = audioBuffer.sampleRate;

  const offlineContext = new OfflineAudioContext(
    1,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  const offlineAnalyser = offlineContext.createAnalyser();
  offlineAnalyser.fftSize = 4096;
  const offlineFrequencyData = new Float32Array(offlineAnalyser.frequencyBinCount);
  const scriptNode = offlineContext.createScriptProcessor(2048, 1, 1);

  const frameLength = Math.round(
    (audioBuffer.sampleRate * offlineFrameDurationMs) / 1000
  );
  const hopLength = Math.round(
    (audioBuffer.sampleRate * offlineHopDurationMs) / 1000
  );
  let buffer = new Float32Array(frameLength * 2);
  let bufferLength = 0;
  let frameOffsetSamples = 0;
  let lastProgressUpdate = 0;

  const appendSamples = (input) => {
    if (bufferLength + input.length > buffer.length) {
      const next = new Float32Array(bufferLength + input.length);
      next.set(buffer.subarray(0, bufferLength));
      buffer = next;
    }
    buffer.set(input, bufferLength);
    bufferLength += input.length;
  };

  const readFrame = () => {
    if (bufferLength < frameLength) {
      return null;
    }
    const frame = new Float32Array(frameLength);
    frame.set(buffer.subarray(0, frameLength));
    buffer.copyWithin(0, hopLength, bufferLength);
    bufferLength -= hopLength;
    return frame;
  };

  scriptNode.onaudioprocess = (event) => {
    if (offlineAbort) {
      return;
    }
    const input = event.inputBuffer.getChannelData(0);
    appendSamples(input);

    let frame = readFrame();
    while (frame) {
      const pitch = autoCorrelate(frame, audioBuffer.sampleRate);
      const timeMs = (frameOffsetSamples / audioBuffer.sampleRate) * 1000;
      pitchHistory.push({ time: timeMs, pitch });
      frameOffsetSamples += hopLength;
      frame = readFrame();
    }

    const nowMs = event.playbackTime * 1000;
    const percent = (event.playbackTime / durationSeconds) * 100;
    if (nowMs - lastProgressUpdate >= offlineProgressUpdateMs) {
      lastProgressUpdate = nowMs;
      setAnalysisStatus(`分析中... ${formatPercent(percent)}`);
    }

    if (formantToggle.checked && nowMs - lastFormantUpdate >= formantUpdateIntervalMs) {
      lastFormantUpdate = nowMs;
      offlineAnalyser.getFloatFrequencyData(offlineFrequencyData);
      const { f1, f2 } = estimateFormantsFromSpectrum(
        offlineFrequencyData,
        audioBuffer.sampleRate,
        offlineAnalyser.fftSize
      );
      const stabilized = stabilizeFormants(f1, f2, nowMs);
      offlineFormantHistory.push({ time: nowMs, f1: stabilized.f1, f2: stabilized.f2 });
      setFormantDisplay(stabilized.f1, stabilized.f2);
      lastFormantTimestamp = nowMs;
    }
  };

  source.connect(offlineAnalyser);
  offlineAnalyser.connect(scriptNode);
  scriptNode.connect(offlineContext.destination);
  source.start();

  try {
    await offlineContext.startRendering();
  } catch (error) {
    console.error(error);
    setAnalysisStatus('分析失败，请重试');
    offlineAnalysisInProgress = false;
    return;
  }

  if (offlineAbort) {
    setAnalysisStatus('已取消');
    offlineAnalysisInProgress = false;
    setOfflineMode(false);
    resetOfflineState();
    return;
  }

  setAnalysisStatus('完成');
  offlineAnalysisInProgress = false;
  updateExportButtons();
  drawPitchHistory();
}

function update() {
  const now = performance.now();
  analyser.getFloatTimeDomainData(dataArray);

  if (now - lastDisplayUpdate >= displayUpdateIntervalMs) {
    lastDisplayUpdate = now;
    const { pitch, confidence } = autoCorrelateWithConfidence(
      dataArray,
      audioContext.sampleRate
    );
    const isInRange = pitch && pitch >= pitchMinHz && pitch <= pitchMaxHz;
    const isReliable = Boolean(pitch) && isInRange && confidence >= pitchConfidenceThreshold;

    if (!isReliable) {
      currentPitch = null;
      appendPitchBreak(now);
    } else {
      recentPitchWindow = pushPitchSample(recentPitchWindow, pitch);
      const displayPitch = median(recentPitchWindow);
      const candidate = selectPitchCandidate(displayPitch, lastStablePitch);
      const maxJump = getMaxJumpThresholdHz(lastStablePitch);

      if (!candidate || (lastStablePitch && Math.abs(candidate - lastStablePitch) > maxJump)) {
        currentPitch = null;
        appendPitchBreak(now);
      } else {
        lastStablePitch = candidate;
        currentPitch = candidate;
        pitchHistory.push({ time: now, pitch: candidate });
      }
    }

    drawPitchHistory();

    if (currentPitch) {
      pitchValueEl.textContent = `${currentPitch.toFixed(1)} Hz`;
      noteValueEl.textContent = frequencyToNote(currentPitch);
    } else {
      pitchValueEl.textContent = '-- Hz';
      noteValueEl.textContent = '--';
    }
    updateExportButtons();
  }

  if (formantToggle.checked) {
    if (now - lastFormantUpdate >= formantUpdateIntervalMs) {
      lastFormantUpdate = now;
      const { f1, f2 } = estimateFormants();
      const stabilized = stabilizeFormants(f1, f2, now);
      setFormantDisplay(stabilized.f1, stabilized.f2);
      lastFormantTimestamp = now;
    }
  } else {
    setFormantStatus('');
  }

  animationId = requestAnimationFrame(update);
}

async function start() {
  try {
    setOfflineMode(false);
    resetOfflineState();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 4096;
    dataArray = new Float32Array(analyser.fftSize);
    frequencyData = new Float32Array(analyser.frequencyBinCount);

    sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(analyser);

    pitchHistory = [];
    lastDisplayUpdate = 0;
    recentPitchWindow = [];
    lastStablePitch = null;
    currentPitch = null;
    sessionStartTime = performance.now();
    lastFormantUpdate = 0;
    lastFormantTimestamp = 0;
    resetFormants();
    setAnalysisStatus('未开始');
    setStatus('正在监听麦克风', 'active');

    startButton.disabled = true;
    stopButton.disabled = false;
    updateExportButtons();

    update();
  } catch (error) {
    setStatus('无法访问麦克风，请检查权限设置');
    console.error(error);
  }
}

function stop() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if (sourceNode?.mediaStream) {
    sourceNode.mediaStream.getTracks().forEach((track) => track.stop());
  }
  sourceNode = null;
  recentPitchWindow = [];
  lastStablePitch = null;
  currentPitch = null;
  lastDisplayUpdate = 0;
  setStatus('已停止');
  startButton.disabled = false;
  stopButton.disabled = true;
  updateExportButtons();
  resetFormants();
}

startButton.addEventListener('click', start);
stopButton.addEventListener('click', stop);
exportCsvButton.addEventListener('click', exportCsv);
exportPngButton.addEventListener('click', exportPng);
formantToggle.addEventListener('change', () => {
  if (!formantToggle.checked) {
    resetFormants();
    setFormantStatus('');
  }
});
sidebarToggle.addEventListener('click', () => {
  const isOpen = sidebar.classList.toggle('open');
  sidebarToggle.setAttribute('aria-expanded', isOpen);
  sidebar.setAttribute('aria-hidden', !isOpen);
});
audioFileInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) {
    analyzeAudioFile(file);
  }
});
clearFileButton.addEventListener('click', () => {
  if (offlineAnalysisInProgress) {
    offlineAbort = true;
    setAnalysisStatus('取消中...');
    return;
  }
  setOfflineMode(false);
  resetOfflineState();
  pitchHistory = [];
  drawPitchHistory();
  updateExportButtons();
});

window.addEventListener('beforeunload', stop);
