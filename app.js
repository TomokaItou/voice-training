const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const recordButton = document.getElementById('recordButton');
const stopRecordButton = document.getElementById('stopRecordButton');
const exportCsvButton = document.getElementById('exportCsvButton');
const exportPngButton = document.getElementById('exportPngButton');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const formantToggle = document.getElementById('formantToggle');
const formantF1El = document.getElementById('formantF1');
const formantF2El = document.getElementById('formantF2');
const formantStatusEl = document.getElementById('formantStatus');
const pitchAlgorithmSelect = document.getElementById('pitchAlgorithmSelect');
const pitchScaleModeSelect = document.getElementById('pitchScaleModeSelect');
const displayModeSelect = document.getElementById('displayModeSelect');
const spectrogramOverlaySelect = document.getElementById('spectrogramOverlaySelect');
const audioFileInput = document.getElementById('audioFileInput');
const clearFileButton = document.getElementById('clearFileButton');
const dataSourceValue = document.getElementById('dataSourceValue');
const analysisStatus = document.getElementById('analysisStatus');
const statusEl = document.getElementById('status');
const pitchValueEl = document.getElementById('pitchValue');
const noteValueEl = document.getElementById('noteValue');
const accompanimentInput = document.getElementById('accompanimentInput');
const playAccompanimentButton = document.getElementById('playAccompanimentButton');
const pauseAccompanimentButton = document.getElementById('pauseAccompanimentButton');
const stopAccompanimentButton = document.getElementById('stopAccompanimentButton');
const accompanimentVolume = document.getElementById('accompanimentVolume');
const accompanimentStatus = document.getElementById('accompanimentStatus');
const meterToggle = document.getElementById('meterToggle');
const volumeMeter = document.getElementById('volumeMeter');
const volumeMeterBar = document.getElementById('volumeMeterBar');
const tiltMeter = document.getElementById('tiltMeter');
const tiltMeterBar = document.getElementById('tiltMeterBar');
const canvas = document.getElementById('pitchCanvas');
const ctx = canvas.getContext('2d');
const canvasScaleRange = document.getElementById('canvasScaleRange');
const canvasScaleValue = document.getElementById('canvasScaleValue');
const analyzeRecordingButton = document.getElementById('analyzeRecordingButton');
const downloadRecordingButton = document.getElementById('downloadRecordingButton');

let audioContext;
let analyser;
let dataArray;
let frequencyData;
let sourceNode;
let animationId;
let pitchHistory = [];
const maxHistorySeconds = 12;
const displayUpdateIntervalMs = 150;
const baseCanvasWidth = 720;
const baseCanvasHeight = 360;
const baseAppMaxWidth = 920;
const pitchMinHz = 60;
const pitchMaxHz = 1000;
const pitchScaleFixedMinHz = 50;
const pitchScaleFixedMaxHz = 500;
const pitchScaleLogMinHz = 60;
const pitchScaleLogMaxHz = 1000;
const spectrogramMinDb = -100;
const spectrogramMaxDb = -30;
const spectrogramOverlayLineWidth = 2;
const spectrogramOverlayColors = {
  pitch: '#3a6ff7',
  f1: '#22c55e',
  f2: '#f97316',
};
const volumeMeterMinDb = -60;
const volumeMeterMaxDb = 0;
const tiltMeterMinDb = -30;
const tiltMeterMaxDb = 30;
const tiltLowBandHz = { min: 200, max: 800 };
const tiltHighBandHz = { min: 2000, max: 5000 };
const pitchEnergyThreshold = 0.015;
const pitchEnergyRef = 0.05;
const pitchOnsetConfidenceThreshold = 0.7;
const pitchSustainConfidenceThreshold = 0.45;
const pitchMedianWindowSize = 5;
const pitchMaxJumpHz = 30;
const pitchMaxJumpCents = 50;
const pitchEmaAlpha = 0.25;
const pitchTransitionConfirmFrames = 2;
const pitchHoldFrames = 2;
const pitchOnsetFrames = 4;
const pitchReleaseFrames = 3;
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
let smoothedPitch = null;
let recentPitchWindow = [];
let pendingPitch = null;
let pendingPitchFrames = 0;
let pitchHoldCounter = 0;
let voicedStable = false;
let voicedFrames = 0;
let voicedLostFrames = 0;
let sessionStartTime = 0;
let pitchAlgorithm = pitchAlgorithmSelect?.value || 'amdf';
let pitchScaleMode = pitchScaleModeSelect?.value || 'dynamic';
let displayMode = displayModeSelect?.value || 'pitch';
let spectrogramOverlayMode = spectrogramOverlaySelect?.value || 'none';
let canvasScale = Number(canvasScaleRange?.value || 1);
let lastFormantUpdate = 0;
let lastFormantTimestamp = 0;
let smoothedFormants = { f1: null, f2: null };
let stableFormants = { f1: null, f2: null };
let formantHistory = { f1: [], f2: [] };
let formantCurveHistory = [];
let spectrogramOverlayState = { pitch: null, f1: null, f2: null };
let offlineMode = false;
let offlineAbort = false;
let offlineFormantHistory = [];
let offlineSourceSampleRate = null;
let offlineAnalysisInProgress = false;
let mediaRecorder = null;
let recordedChunks = [];
let lastRecordingBlob = null;
let accompanimentAudio = null;
let accompanimentUrl = null;

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

updateCanvasScale(canvasScale);
volumeMeter?.closest('.chart')?.classList.toggle('meter-hidden', !meterToggle?.checked);
updateRecordingButtons();
updateAccompanimentButtons(false);

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

function setAccompanimentStatus(text) {
  accompanimentStatus.textContent = text;
}

function updateAccompanimentButtons(hasSource) {
  const canPlay = Boolean(hasSource);
  playAccompanimentButton.disabled = !canPlay;
  pauseAccompanimentButton.disabled = !canPlay;
  stopAccompanimentButton.disabled = !canPlay;
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

function updateVolumeMeter(rms) {
  if (!volumeMeterBar) {
    return;
  }
  if (rms === null || rms === undefined) {
    volumeMeterBar.style.height = '0%';
    return;
  }
  const db = 20 * Math.log10(Math.max(rms, 1e-5));
  const clamped = Math.max(volumeMeterMinDb, Math.min(volumeMeterMaxDb, db));
  const ratio = (clamped - volumeMeterMinDb) / (volumeMeterMaxDb - volumeMeterMinDb);
  volumeMeterBar.style.height = `${Math.round(ratio * 100)}%`;
}

function updateSpectralTilt() {
  if (!tiltMeterBar || !analyser || !frequencyData) {
    return;
  }
  analyser.getFloatFrequencyData(frequencyData);
  const nyquist = audioContext ? audioContext.sampleRate / 2 : 0;
  if (!nyquist) {
    tiltMeterBar.style.height = '0%';
    return;
  }

  const binResolution = nyquist / frequencyData.length;
  const bandAverage = (minHz, maxHz) => {
    const start = Math.max(0, Math.floor(minHz / binResolution));
    const end = Math.min(frequencyData.length - 1, Math.ceil(maxHz / binResolution));
    let sum = 0;
    let count = 0;
    for (let i = start; i <= end; i += 1) {
      const value = frequencyData[i];
      if (Number.isFinite(value)) {
        sum += value;
        count += 1;
      }
    }
    return count > 0 ? sum / count : -120;
  };

  const lowDb = bandAverage(tiltLowBandHz.min, tiltLowBandHz.max);
  const highDb = bandAverage(tiltHighBandHz.min, tiltHighBandHz.max);
  const tiltDb = highDb - lowDb;
  const clamped = Math.max(tiltMeterMinDb, Math.min(tiltMeterMaxDb, tiltDb));
  const ratio = (clamped - tiltMeterMinDb) / (tiltMeterMaxDb - tiltMeterMinDb);
  tiltMeterBar.style.height = `${Math.round(ratio * 100)}%`;
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

function autoCorrelateStandardWithConfidence(buffer, sampleRate, rms) {
  const size = buffer.length;
  const minLag = Math.floor(sampleRate / pitchMaxHz);
  const maxLag = Math.floor(sampleRate / pitchMinHz);
  let bestLag = -1;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < size - lag; i += 1) {
      const value = buffer[i];
      sum += value * buffer[i + lag];
      norm += value * value;
    }
    const correlation = norm > 0 ? sum / norm : 0;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  const pitch = bestLag !== -1 ? sampleRate / bestLag : null;
  const energyScore = Math.min(1, rms / pitchEnergyRef);
  const confidence = Math.max(0, Math.min(1, bestCorrelation * energyScore));

  return { pitch, confidence, rms };
}

function estimatePitchFromSpectrum(spectrum, sampleRate, fftSize) {
  const binResolution = sampleRate / fftSize;
  const minBin = Math.max(1, Math.floor(pitchMinHz / binResolution));
  const maxBin = Math.min(spectrum.length - 1, Math.ceil(pitchMaxHz / binResolution));
  const amplitudes = new Float32Array(spectrum.length);
  for (let i = minBin; i <= maxBin * 3 && i < spectrum.length; i += 1) {
    amplitudes[i] = Math.pow(10, spectrum[i] / 20);
  }

  let bestBin = -1;
  let bestValue = 0;
  let sum = 0;
  let count = 0;

  for (let bin = minBin; bin <= maxBin; bin += 1) {
    const amp1 = amplitudes[bin] || 0;
    const amp2 = amplitudes[bin * 2] || 0;
    const amp3 = amplitudes[bin * 3] || 0;
    const hpsValue = amp1 * amp2 * amp3;
    sum += hpsValue;
    count += 1;
    if (hpsValue > bestValue) {
      bestValue = hpsValue;
      bestBin = bin;
    }
  }

  if (bestBin === -1) {
    return { pitch: null, confidence: 0 };
  }

  const pitch = bestBin * binResolution;
  const mean = count > 0 ? sum / count : 0;
  const ratio = mean > 0 ? bestValue / mean : 0;
  const confidence = Math.max(0, Math.min(1, (ratio - 1) / 4));

  return { pitch, confidence };
}

function estimatePitchWithConfidence(buffer, sampleRate, analyserNode, spectrumBuffer) {
  const rms = computeRms(buffer);
  if (rms < pitchEnergyThreshold) {
    return { pitch: null, confidence: 0, rms };
  }

  if (pitchAlgorithm === 'autocorr') {
    return autoCorrelateStandardWithConfidence(buffer, sampleRate, rms);
  }

  if (pitchAlgorithm === 'fft' && analyserNode && spectrumBuffer) {
    analyserNode.getFloatFrequencyData(spectrumBuffer);
    const { pitch, confidence } = estimatePitchFromSpectrum(
      spectrumBuffer,
      sampleRate,
      analyserNode.fftSize
    );
    const energyScore = Math.min(1, rms / pitchEnergyRef);
    return { pitch, confidence: confidence * energyScore, rms };
  }

  return autoCorrelateWithConfidence(buffer, sampleRate);
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

function drawAxes(minPitch = null, maxPitch = null, scaleMode = 'linear') {
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
      const labelValue =
        scaleMode === 'log'
          ? Math.exp(Math.log(minPitch) + (Math.log(maxPitch) - Math.log(minPitch)) * ratio)
          : minPitch + (maxPitch - minPitch) * ratio;
      const label = `${Math.round(labelValue)} Hz`;
      ctx.fillText(label, 8, y);
    }
  }
}

function drawPitchHistory() {
  if (pitchHistory.length < 2) {
    if (pitchScaleMode === 'fixed') {
      drawAxes(pitchScaleFixedMinHz, pitchScaleFixedMaxHz);
    } else if (pitchScaleMode === 'log') {
      drawAxes(pitchScaleLogMinHz, pitchScaleLogMaxHz, 'log');
    } else {
      drawAxes();
    }
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
  let minPitch = null;
  let maxPitch = null;

  if (pitchScaleMode === 'fixed') {
    minPitch = pitchScaleFixedMinHz;
    maxPitch = pitchScaleFixedMaxHz;
  } else if (pitchScaleMode === 'log') {
    minPitch = pitchScaleLogMinHz;
    maxPitch = pitchScaleLogMaxHz;
  } else {
    if (pitches.length === 0) {
      drawAxes();
      return;
    }
    minPitch = Math.min(...pitches);
    maxPitch = Math.max(...pitches);
  }

  const pitchRange = Math.max(maxPitch - minPitch, 1);
  const padding = 20;

  drawAxes(minPitch, maxPitch, pitchScaleMode === 'log' ? 'log' : 'linear');

  const logMin = Math.log(minPitch);
  const logRange = Math.max(Math.log(maxPitch) - logMin, 0.0001);

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
    if (point.pitch < minPitch || point.pitch > maxPitch) {
      if (pitchScaleMode === 'fixed' || pitchScaleMode === 'log') {
        if (hasActivePath) {
          ctx.stroke();
          ctx.beginPath();
          hasActivePath = false;
        }
        return;
      }
    }
    const x = ((point.time - minTime) / durationMs) * canvas.width;
    const normalized =
      pitchScaleMode === 'log'
        ? (Math.log(point.pitch) - logMin) / logRange
        : (point.pitch - minPitch) / pitchRange;
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

  if (formantToggle.checked) {
    drawFormantHistory(minTime, durationMs, minPitch, maxPitch, pitchRange, padding);
  }

  if (!offlineMode && currentPitch) {
    if (currentPitch < minPitch || currentPitch > maxPitch) {
      return;
    }
    const normalized =
      pitchScaleMode === 'log'
        ? (Math.log(currentPitch) - logMin) / logRange
        : (currentPitch - minPitch) / pitchRange;
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

function updateCanvasScale(value) {
  const scale = Number(value) || 1;
  canvasScale = scale;
  const appWidth = Math.round(baseAppMaxWidth * scale);
  document.documentElement.style.setProperty('--app-max-width', `${appWidth}px`);
  const width = Math.round(baseCanvasWidth * scale);
  const height = Math.round(baseCanvasHeight * scale);
  canvas.width = width;
  canvas.height = height;
  if (canvasScaleValue) {
    canvasScaleValue.textContent = `${Math.round(scale * 100)}%`;
  }
  if (displayMode === 'spectrogram') {
    resetSpectrogram();
  } else {
    drawPitchHistory();
  }
}

function resetSpectrogram() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  spectrogramOverlayState = { pitch: null, f1: null, f2: null };
}

function drawSpectrogramFrame() {
  if (!analyser || !frequencyData) {
    return;
  }
  analyser.getFloatFrequencyData(frequencyData);
  const width = canvas.width;
  const height = canvas.height;
  ctx.drawImage(canvas, -1, 0);

  for (let i = 0; i < frequencyData.length; i += 1) {
    const value = frequencyData[i];
    const normalized = (value - spectrogramMinDb) / (spectrogramMaxDb - spectrogramMinDb);
    const intensity = Math.max(0, Math.min(1, normalized));
    const y = height - Math.round((i / frequencyData.length) * height);
    const brightness = Math.round(intensity * 255);
    ctx.fillStyle = `rgb(${brightness}, ${Math.max(0, brightness - 40)}, ${Math.max(
      0,
      brightness - 80
    )})`;
    ctx.fillRect(width - 1, y, 1, 1);
  }

  drawSpectrogramOverlay();
}

function drawSpectrogramOverlay() {
  if (spectrogramOverlayMode === 'none') {
    spectrogramOverlayState = { pitch: null, f1: null, f2: null };
    return;
  }
  if (!audioContext) {
    return;
  }
  const nyquist = audioContext.sampleRate / 2;
  const width = canvas.width;
  const height = canvas.height;

  const drawOverlayPoint = (key, freq, color) => {
    if (!freq || freq <= 0 || freq > nyquist) {
      spectrogramOverlayState[key] = null;
      return;
    }
    const y = height - Math.round((freq / nyquist) * height);
    const prevY = spectrogramOverlayState[key];
    ctx.strokeStyle = color;
    ctx.lineWidth = spectrogramOverlayLineWidth;
    ctx.beginPath();
    if (prevY === null || prevY === undefined) {
      ctx.moveTo(width - 1, y);
      ctx.lineTo(width - 1, y);
    } else {
      ctx.moveTo(width - 2, prevY);
      ctx.lineTo(width - 1, y);
    }
    ctx.stroke();
    spectrogramOverlayState[key] = y;
  };

  if (spectrogramOverlayMode === 'pitch' || spectrogramOverlayMode === 'both') {
    drawOverlayPoint('pitch', currentPitch, spectrogramOverlayColors.pitch);
  }

  if (spectrogramOverlayMode === 'formants' || spectrogramOverlayMode === 'both') {
    if (formantToggle.checked) {
      drawOverlayPoint('f1', stableFormants.f1, spectrogramOverlayColors.f1);
      drawOverlayPoint('f2', stableFormants.f2, spectrogramOverlayColors.f2);
    } else {
      spectrogramOverlayState.f1 = null;
      spectrogramOverlayState.f2 = null;
    }
  }
}

function drawFormantHistory(minTime, durationMs, minPitch, maxPitch, pitchRange, padding) {
  const sourceHistory = offlineMode ? offlineFormantHistory : formantCurveHistory;
  const now = performance.now();
  const minVisibleTime = offlineMode ? minTime : now - maxHistorySeconds * 1000;
  const visibleHistory = sourceHistory.filter((point) => point.time >= minVisibleTime);
  const logMin = Math.log(minPitch);
  const logRange = Math.max(Math.log(maxPitch) - logMin, 0.0001);

  const drawCurve = (key, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let hasActivePath = false;
    visibleHistory.forEach((point) => {
      const value = point[key];
      if (!value) {
        if (hasActivePath) {
          ctx.stroke();
          ctx.beginPath();
          hasActivePath = false;
        }
        return;
      }
      if (value < minPitch || value > maxPitch) {
        if (pitchScaleMode === 'fixed' || pitchScaleMode === 'log') {
          if (hasActivePath) {
            ctx.stroke();
            ctx.beginPath();
            hasActivePath = false;
          }
          return;
        }
      }
      const x = ((point.time - minTime) / durationMs) * canvas.width;
      const normalized =
        pitchScaleMode === 'log'
          ? (Math.log(value) - logMin) / logRange
          : (value - minPitch) / pitchRange;
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
  };

  drawCurve('f1', '#22c55e');
  drawCurve('f2', '#f97316');
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
  formantCurveHistory = [];
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
  if (!pitch) return null;
  if (!reference) return pitch;

  // 用“音程（cents）”判断是否真的是倍频错误（octave error）
  const cents = (a, b) => 1200 * Math.log2(a / b);
  const absCents = (a, b) => Math.abs(cents(a, b));

  // 如果当前pitch已经离reference很远（比如>300 cents=小三度以上），
  // 不要强行用 pitch/2 去贴reference（否则会把真正的转高/转低压回去）
  const farEnough = absCents(pitch, reference) > 300;
  if (farEnough) return pitch;

  // 只有在“看起来像倍频误判”时才纠错
  const c0 = absCents(pitch, reference);
  const cHalf = absCents(pitch / 2, reference);
  const cDouble = absCents(pitch * 2, reference);

  let best = pitch;
  let bestC = c0;

  if (cHalf < bestC) { bestC = cHalf; best = pitch / 2; }
  if (cDouble < bestC) { bestC = cDouble; best = pitch * 2; }

  // 再加一道门：纠错也必须“真的更接近”，并且接近到一个很小的范围（比如<=80 cents）
  if (best !== pitch && bestC <= 80) return best;

  return pitch;
}


function appendPitchBreak(time) {
  if (!pitchHistory.length || pitchHistory[pitchHistory.length - 1].pitch !== null) {
    pitchHistory.push({ time, pitch: null });
  }
}

function applyPitchEma(previous, next) {
  if (!next) {
    return previous;
  }
  if (!previous) {
    return next;
  }
  return previous + pitchEmaAlpha * (next - previous);
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

function updateRecordingButtons() {
  const hasRecording = Boolean(lastRecordingBlob);
  analyzeRecordingButton.disabled = !hasRecording || offlineAnalysisInProgress;
  downloadRecordingButton.disabled = !hasRecording;
}

function resetPitchStabilizer() {
  recentPitchWindow = [];
  lastStablePitch = null;
  smoothedPitch = null;
  pendingPitch = null;
  pendingPitchFrames = 0;
  pitchHoldCounter = 0;
  voicedStable = false;
  voicedFrames = 0;
  voicedLostFrames = 0;
  currentPitch = null;
  lastDisplayUpdate = 0;
  pitchValueEl.textContent = '-- Hz';
  noteValueEl.textContent = '--';
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
  recordButton.disabled = offlineMode || offlineAnalysisInProgress;
  stopRecordButton.disabled = offlineMode || offlineAnalysisInProgress;
  pitchAlgorithmSelect.disabled = offlineAnalysisInProgress;
  displayModeSelect.disabled = offlineMode || offlineAnalysisInProgress;
  canvasScaleRange.disabled = offlineAnalysisInProgress;
  if (offlineMode && displayMode === 'spectrogram') {
    displayMode = 'pitch';
    displayModeSelect.value = 'pitch';
    drawPitchHistory();
  }
  setDataSourceLabel(offlineMode ? '音频文件' : '实时麦克风');
  updateExportButtons();
  updateRecordingButtons();
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

async function decodeAudioBlob(blob) {
  const arrayBuffer = await blob.arrayBuffer();
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
      let pitch;
      if (pitchAlgorithm === 'fft') {
        offlineAnalyser.getFloatFrequencyData(offlineFrequencyData);
        const result = estimatePitchFromSpectrum(
          offlineFrequencyData,
          audioBuffer.sampleRate,
          offlineAnalyser.fftSize
        );
        pitch = result.pitch;
      } else if (pitchAlgorithm === 'autocorr') {
        pitch = autoCorrelateStandardWithConfidence(frame, audioBuffer.sampleRate, computeRms(frame))
          .pitch;
      } else {
        pitch = autoCorrelate(frame, audioBuffer.sampleRate);
      }
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

async function analyzeRecordingBlob(blob) {
  if (!blob) {
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
    audioBuffer = await decodeAudioBlob(blob);
  } catch (error) {
    console.error(error);
    setAnalysisStatus('解码失败，请重试');
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
      let pitch;
      if (pitchAlgorithm === 'fft') {
        offlineAnalyser.getFloatFrequencyData(offlineFrequencyData);
        const result = estimatePitchFromSpectrum(
          offlineFrequencyData,
          audioBuffer.sampleRate,
          offlineAnalyser.fftSize
        );
        pitch = result.pitch;
      } else if (pitchAlgorithm === 'autocorr') {
        pitch = autoCorrelateStandardWithConfidence(frame, audioBuffer.sampleRate, computeRms(frame))
          .pitch;
      } else {
        pitch = autoCorrelate(frame, audioBuffer.sampleRate);
      }
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
  updateVolumeMeter(computeRms(dataArray));
  updateSpectralTilt();

  if (now - lastDisplayUpdate >= displayUpdateIntervalMs) {
    lastDisplayUpdate = now;
    const { pitch, confidence } = estimatePitchWithConfidence(
      dataArray,
      audioContext.sampleRate,
      analyser,
      frequencyData
    );
    const isInRange = pitch && pitch >= pitchMinHz && pitch <= pitchMaxHz;
    const hasPitch = Boolean(pitch) && isInRange;
    const confidenceThreshold = voicedStable
      ? pitchSustainConfidenceThreshold
      : pitchOnsetConfidenceThreshold;
    const isReliable = hasPitch && confidence >= confidenceThreshold;

    if (!isReliable) {
      pendingPitch = null;
      pendingPitchFrames = 0;
      if (voicedStable) {
        voicedLostFrames += 1;
        pitchHoldCounter += 1;
        if (lastStablePitch && pitchHoldCounter <= pitchHoldFrames) {
          currentPitch = smoothedPitch ?? lastStablePitch;
          pitchHistory.push({ time: now, pitch: currentPitch });
        } else {
          currentPitch = null;
          appendPitchBreak(now);
        }
        if (voicedLostFrames >= pitchReleaseFrames) {
          voicedStable = false;
          voicedFrames = 0;
          pitchHoldCounter = 0;
        }
      } else {
        voicedFrames = 0;
        currentPitch = null;
        appendPitchBreak(now);
      }
    } else {
      pitchHoldCounter = 0;
      voicedLostFrames = 0;
      recentPitchWindow = pushPitchSample(recentPitchWindow, pitch);
      voicedFrames = Math.min(pitchOnsetFrames, voicedFrames + 1);

      if (!voicedStable && voicedFrames < pitchOnsetFrames) {
        currentPitch = null;
        appendPitchBreak(now);
      } else {
        voicedStable = true;
        const displayPitch = median(recentPitchWindow);
        const candidate = selectPitchCandidate(displayPitch, lastStablePitch);
        const maxJump = getMaxJumpThresholdHz(lastStablePitch);

        if (!candidate) {
          pendingPitch = null;
          pendingPitchFrames = 0;
          pitchHoldCounter += 1;
          if (lastStablePitch && pitchHoldCounter <= pitchHoldFrames) {
            currentPitch = smoothedPitch ?? lastStablePitch;
            pitchHistory.push({ time: now, pitch: currentPitch });
          } else {
            currentPitch = null;
            appendPitchBreak(now);
          }
        } else if (lastStablePitch && Math.abs(candidate - lastStablePitch) > maxJump) {
          if (pendingPitch && Math.abs(candidate - pendingPitch) <= maxJump) {
            pendingPitchFrames += 1;
          } else {
            pendingPitch = candidate;
            pendingPitchFrames = 1;
          }

          if (pendingPitchFrames >= pitchTransitionConfirmFrames) {
            lastStablePitch = pendingPitch;
            pendingPitch = null;
            pendingPitchFrames = 0;
            smoothedPitch = applyPitchEma(smoothedPitch, lastStablePitch);
            currentPitch = smoothedPitch;
            pitchHistory.push({ time: now, pitch: smoothedPitch });
          } else {
            currentPitch = smoothedPitch ?? lastStablePitch;
            pitchHistory.push({ time: now, pitch: currentPitch });
          }
        } else {
          pendingPitch = null;
          pendingPitchFrames = 0;
          lastStablePitch = candidate;
          smoothedPitch = applyPitchEma(smoothedPitch, candidate);
          currentPitch = smoothedPitch;
          pitchHistory.push({ time: now, pitch: smoothedPitch });
        }
      }
    }

    if (displayMode !== 'spectrogram') {
      drawPitchHistory();
    }

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
      formantCurveHistory.push({ time: now, f1: stabilized.f1, f2: stabilized.f2 });
      setFormantDisplay(stabilized.f1, stabilized.f2);
      lastFormantTimestamp = now;
    }
  } else {
    setFormantStatus('');
  }

  if (displayMode === 'spectrogram') {
    drawSpectrogramFrame();
  }
  animationId = requestAnimationFrame(update);
}

async function start() {
  try {
    setOfflineMode(false);
    resetOfflineState();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
      },
    });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 4096;
    dataArray = new Float32Array(analyser.fftSize);
    frequencyData = new Float32Array(analyser.frequencyBinCount);

    sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(analyser);

    pitchHistory = [];
    resetPitchStabilizer();
    sessionStartTime = performance.now();
    lastFormantUpdate = 0;
    lastFormantTimestamp = 0;
    resetFormants();
    setAnalysisStatus('未开始');
    setStatus('正在监听麦克风', 'active');
    if (displayMode === 'spectrogram') {
      resetSpectrogram();
    }
    updateVolumeMeter(0);
    if (tiltMeterBar) {
      tiltMeterBar.style.height = '0%';
    }

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
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  resetPitchStabilizer();
  setStatus('已停止');
  updateVolumeMeter(0);
  if (tiltMeterBar) {
    tiltMeterBar.style.height = '0%';
  }
  startButton.disabled = false;
  stopButton.disabled = true;
  updateExportButtons();
  resetFormants();
}

startButton.addEventListener('click', start);
stopButton.addEventListener('click', stop);
exportCsvButton.addEventListener('click', exportCsv);
exportPngButton.addEventListener('click', exportPng);
pitchAlgorithmSelect.addEventListener('change', (event) => {
  pitchAlgorithm = event.target.value;
  resetPitchStabilizer();
  if (!offlineAnalysisInProgress) {
    pitchHistory = [];
    drawPitchHistory();
    updateExportButtons();
  }
});
pitchScaleModeSelect.addEventListener('change', (event) => {
  pitchScaleMode = event.target.value;
  drawPitchHistory();
});
displayModeSelect.addEventListener('change', (event) => {
  displayMode = event.target.value;
  if (displayMode === 'spectrogram') {
    resetSpectrogram();
  } else {
    drawPitchHistory();
  }
});
spectrogramOverlaySelect.addEventListener('change', (event) => {
  spectrogramOverlayMode = event.target.value;
  if (displayMode === 'spectrogram') {
    resetSpectrogram();
  }
});
canvasScaleRange.addEventListener('input', (event) => {
  updateCanvasScale(event.target.value);
});
meterToggle.addEventListener('change', (event) => {
  const isVisible = event.target.checked;
  volumeMeter?.classList.toggle('meter-hidden', !isVisible);
  volumeMeter?.closest('.chart')?.classList.toggle('meter-hidden', !isVisible);
});
recordButton.addEventListener('click', async () => {
  if (offlineAnalysisInProgress) {
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recordedChunks = [];
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    });
    recorder.addEventListener('stop', () => {
      const blob = new Blob(recordedChunks, { type: recorder.mimeType });
      lastRecordingBlob = blob.size > 0 ? blob : null;
      recordedChunks = [];
      stream.getTracks().forEach((track) => track.stop());
      updateRecordingButtons();
    });
    mediaRecorder = recorder;
    recorder.start();
    recordButton.disabled = true;
    stopRecordButton.disabled = false;
    setStatus('录音中', 'active');
  } catch (error) {
    console.error(error);
    setStatus('无法开始录音，请检查权限设置');
  }
});
stopRecordButton.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  recordButton.disabled = false;
  stopRecordButton.disabled = true;
});
analyzeRecordingButton.addEventListener('click', () => {
  if (lastRecordingBlob) {
    analyzeRecordingBlob(lastRecordingBlob);
  }
});
downloadRecordingButton.addEventListener('click', () => {
  if (!lastRecordingBlob) {
    return;
  }
  const filename = `voice-training_recording_${formatTimestamp(new Date())}.webm`;
  downloadBlob(lastRecordingBlob, filename);
});
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

accompanimentInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  if (accompanimentUrl) {
    URL.revokeObjectURL(accompanimentUrl);
  }
  accompanimentUrl = URL.createObjectURL(file);
  if (!accompanimentAudio) {
    accompanimentAudio = new Audio();
    accompanimentAudio.addEventListener('ended', () => {
      setAccompanimentStatus('已停止');
    });
  }
  accompanimentAudio.src = accompanimentUrl;
  accompanimentAudio.volume = Number(accompanimentVolume.value || 0.7);
  setAccompanimentStatus('已加载');
  updateAccompanimentButtons(true);
});

playAccompanimentButton.addEventListener('click', async () => {
  if (!accompanimentAudio) {
    return;
  }
  try {
    await accompanimentAudio.play();
    setAccompanimentStatus('播放中');
  } catch (error) {
    console.error(error);
    setAccompanimentStatus('无法播放');
  }
});

pauseAccompanimentButton.addEventListener('click', () => {
  if (!accompanimentAudio) {
    return;
  }
  accompanimentAudio.pause();
  setAccompanimentStatus('已暂停');
});

stopAccompanimentButton.addEventListener('click', () => {
  if (!accompanimentAudio) {
    return;
  }
  accompanimentAudio.pause();
  accompanimentAudio.currentTime = 0;
  setAccompanimentStatus('已停止');
});

accompanimentVolume.addEventListener('input', (event) => {
  if (!accompanimentAudio) {
    return;
  }
  accompanimentAudio.volume = Number(event.target.value);
});
