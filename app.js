const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const statusEl = document.getElementById('status');
const pitchValueEl = document.getElementById('pitchValue');
const noteValueEl = document.getElementById('noteValue');
const canvas = document.getElementById('pitchCanvas');
const ctx = canvas.getContext('2d');

let audioContext;
let analyser;
let dataArray;
let sourceNode;
let animationId;
let pitchHistory = [];
const maxHistorySeconds = 12;

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
  const padding = 20;

  ctx.strokeStyle = '#3a6ff7';
  ctx.lineWidth = 3;
  ctx.beginPath();

  visibleHistory.forEach((point, index) => {
    if (!point.pitch) {
      return;
    }
    const x = ((point.time - minTime) / (maxHistorySeconds * 1000)) * canvas.width;
    const normalized = (point.pitch - minPitch) / Math.max(maxPitch - minPitch, 1);
    const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

function update() {
  analyser.getFloatTimeDomainData(dataArray);
  const pitch = autoCorrelate(dataArray, audioContext.sampleRate);

  pitchHistory.push({ time: performance.now(), pitch });
  drawPitchHistory();

  if (pitch) {
    pitchValueEl.textContent = `${pitch.toFixed(1)} Hz`;
    noteValueEl.textContent = frequencyToNote(pitch);
  } else {
    pitchValueEl.textContent = '-- Hz';
    noteValueEl.textContent = '--';
  }

  animationId = requestAnimationFrame(update);
}

async function start() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    dataArray = new Float32Array(analyser.fftSize);

    sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(analyser);

    pitchHistory = [];
    setStatus('正在监听麦克风', 'active');

    startButton.disabled = true;
    stopButton.disabled = false;

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
}

startButton.addEventListener('click', start);
stopButton.addEventListener('click', stop);

window.addEventListener('beforeunload', stop);
