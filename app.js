const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const exportCsvButton = document.getElementById('exportCsvButton');
const exportPngButton = document.getElementById('exportPngButton');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const formantToggle = document.getElementById('formantToggle');
const formantF1El = document.getElementById('formantF1');
const formantF2El = document.getElementById('formantF2');
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
const displayUpdateIntervalMs = 150;
let lastDisplayUpdate = 0;
let currentPitch = null;
let sessionStartTime = 0;
const formantUpdateIntervalMs = 120;
let lastFormantUpdate = 0;
let smoothedFormants = { f1: null, f2: null };

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function setStatus(text, tone = 'info') {
  statusEl.textContent = text;
  statusEl.style.background = tone === 'active' ? '#e8f0ff' : '#eef1f7';
  statusEl.style.color = tone === 'active' ? '#2f4fdd' : '#49506b';
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

function autoCorrelate(buffer, sampleRate) {
  const size = buffer.length;
  let rms = 0;
  for (let i = 0; i < size; i += 1) {
    const value = buffer[i];
    rms += value * value;
  }
  rms = Math.sqrt(rms / size);
  if (rms < 0.015) {
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

function drawAxes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#e5e9f3';
  ctx.lineWidth = 1;

  const horizontalLines = 5;
  for (let i = 0; i <= horizontalLines; i += 1) {
    const y = (canvas.height / horizontalLines) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawPitchHistory() {
  drawAxes();
  if (pitchHistory.length < 2) {
    return;
  }

  const now = performance.now();
  const minTime = now - maxHistorySeconds * 1000;
  const visibleHistory = pitchHistory.filter((point) => point.time >= minTime);
  pitchHistory = visibleHistory;

  const pitches = visibleHistory.map((point) => point.pitch).filter(Boolean);
  if (pitches.length === 0) {
    return;
  }
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);
  const pitchRange = Math.max(maxPitch - minPitch, 1);
  const padding = 20;

  ctx.strokeStyle = '#3a6ff7';
  ctx.lineWidth = 3;
  ctx.beginPath();

  visibleHistory.forEach((point, index) => {
    if (!point.pitch) {
      return;
    }
    const x = ((point.time - minTime) / (maxHistorySeconds * 1000)) * canvas.width;
    const normalized = (point.pitch - minPitch) / pitchRange;
    const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  if (currentPitch) {
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

function resetFormants() {
  smoothedFormants = { f1: null, f2: null };
  setFormantDisplay(null, null);
}

function smoothFormantValue(previous, next, alpha = 0.3) {
  if (!next) {
    return previous;
  }
  if (!previous) {
    return next;
  }
  return previous + alpha * (next - previous);
}

function estimateFormants() {
  if (!analyser || !frequencyData) {
    return { f1: null, f2: null };
  }

  analyser.getFloatFrequencyData(frequencyData);
  const binCount = frequencyData.length;
  const sampleRate = audioContext.sampleRate;
  const binResolution = sampleRate / analyser.fftSize;
  const smoothingHz = 120;
  const windowBins = Math.max(1, Math.round(smoothingHz / binResolution));
  const smoothed = new Float32Array(binCount);

  let windowSum = 0;
  for (let i = 0; i < binCount; i += 1) {
    windowSum += frequencyData[i];
    if (i >= windowBins) {
      windowSum -= frequencyData[i - windowBins];
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

  const f1 = findPeak(200, 1000);
  const f2 = findPeak(700, 3000, f1 ? f1 + 150 : null);

  return { f1, f2 };
}

function hasRecentPitchData() {
  const now = performance.now();
  const minTime = now - maxHistorySeconds * 1000;
  return pitchHistory.some((point) => point.time >= minTime && point.pitch);
}

function updateExportButtons() {
  const hasData = hasRecentPitchData();
  exportCsvButton.disabled = !audioContext || !hasData;
  exportPngButton.disabled = !audioContext || !hasData;
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

function update() {
  analyser.getFloatTimeDomainData(dataArray);
  const pitch = autoCorrelate(dataArray, audioContext.sampleRate);
  currentPitch = pitch;

  pitchHistory.push({ time: performance.now(), pitch });
  drawPitchHistory();

  const now = performance.now();
  if (now - lastDisplayUpdate >= displayUpdateIntervalMs) {
    lastDisplayUpdate = now;
    if (pitch) {
      pitchValueEl.textContent = `${pitch.toFixed(1)} Hz`;
      noteValueEl.textContent = frequencyToNote(pitch);
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
      smoothedFormants = {
        f1: smoothFormantValue(smoothedFormants.f1, f1, 0.2),
        f2: smoothFormantValue(smoothedFormants.f2, f2, 0.2),
      };
      setFormantDisplay(smoothedFormants.f1, smoothedFormants.f2);
    }
  }

  animationId = requestAnimationFrame(update);
}

async function start() {
  try {
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
    sessionStartTime = performance.now();
    lastFormantUpdate = 0;
    resetFormants();
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
  }
});
sidebarToggle.addEventListener('click', () => {
  const isOpen = sidebar.classList.toggle('open');
  sidebarToggle.setAttribute('aria-expanded', isOpen);
  sidebar.setAttribute('aria-hidden', !isOpen);
});

window.addEventListener('beforeunload', stop);
