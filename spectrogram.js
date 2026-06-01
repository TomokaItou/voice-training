// Spectrogram view rendering helpers. This file is loaded before app.js and uses app-level state.

function resetSpectrogram() {
  ctx.fillStyle = '#070909';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  spectrogramScrollX = 0;
  drawSpectrogramStaticFrame();
  spectrogramOverlayState = { pitch: null, f1: null, f2: null };
}

function captureSpectrogramSnapshot() {
  if (displayMode !== 'spectrogram' || !canvas.width || !canvas.height) {
    return null;
  }
  try {
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (_error) {
    return null;
  }
}

function restoreSpectrogramSnapshot(snapshot) {
  if (!snapshot || displayMode !== 'spectrogram') {
    return;
  }
  ctx.putImageData(snapshot, 0, 0);
}

function getSpectrogramLayout() {
  const scale = Math.max(0.7, canvas.width / spectrogramCanvasWidth);
  const pianoWidth = Math.round(spectrogramPianoWidth * scale);
  const axisWidth = Math.round(spectrogramAxisWidth * scale);
  const profileWidth = Math.round(spectrogramProfileWidth * scale);
  const waveformHeight = Math.round(spectrogramWaveformHeight * scale);
  const timeAxisHeight = Math.round(spectrogramTimeAxisHeight * scale);
  const top = Math.round(8 * scale);
  const bottom = canvas.height - waveformHeight - timeAxisHeight;
  const specLeft = pianoWidth + axisWidth;
  const specRight = canvas.width - profileWidth;
  const specWidth = Math.max(120, specRight - specLeft);
  const specHeight = Math.max(120, bottom - top);
  return {
    scale,
    pianoWidth,
    axisWidth,
    profileWidth,
    waveformHeight,
    timeAxisHeight,
    top,
    specLeft,
    specRight,
    specWidth,
    specHeight,
    bottom,
    waveTop: bottom + timeAxisHeight,
    waveBottom: canvas.height - Math.round(8 * scale),
    profileLeft: specRight,
    profileRight: canvas.width,
  };
}

function spectrogramFreqToY(freq, layout = getSpectrogramLayout()) {
  const minLog = Math.log2(spectrogramDisplayMinHz);
  const maxLog = Math.log2(spectrogramDisplayMaxHz);
  const ratio = (Math.log2(Math.max(spectrogramDisplayMinHz, freq)) - minLog) / (maxLog - minLog);
  return layout.bottom - Math.max(0, Math.min(1, ratio)) * layout.specHeight;
}

function drawSpectrogramStaticFrame() {
  const layout = getSpectrogramLayout();
  ctx.save();
  ctx.fillStyle = '#080a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111312';
  ctx.fillRect(layout.specLeft, layout.top, layout.specWidth, layout.specHeight);
  ctx.fillStyle = '#0a0b0b';
  ctx.fillRect(layout.profileLeft, layout.top, layout.profileWidth, layout.specHeight);
  ctx.fillStyle = '#101111';
  ctx.fillRect(layout.specLeft, layout.waveTop, layout.specWidth, layout.waveBottom - layout.waveTop);
  drawSpectrogramPiano(layout);
  drawSpectrogramFrequencyLabels(layout);
  drawSpectrogramTimeAxis(layout);
  drawSpectrogramProfileGrid(layout);
  ctx.restore();
}

function drawSpectrogramPiano(layout) {
  const whiteNotes = new Set([0, 2, 4, 5, 7, 9, 11]);
  for (let midi = 36; midi <= 107; midi += 1) {
    const freq = 440 * 2 ** ((midi - 69) / 12);
    const nextFreq = 440 * 2 ** ((midi + 1 - 69) / 12);
    const y1 = spectrogramFreqToY(nextFreq, layout);
    const y2 = spectrogramFreqToY(freq, layout);
    const h = Math.max(1, y2 - y1);
    const note = midi % 12;
    if (whiteNotes.has(note)) {
      ctx.fillStyle = '#f5f3ea';
      ctx.fillRect(0, y1, layout.pianoWidth, h);
      ctx.strokeStyle = '#9a9b94';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, y1, layout.pianoWidth, h);
    } else {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, y1, layout.pianoWidth * 0.68, h);
    }
    if (note === 0 && h > 3) {
      ctx.fillStyle = '#1b1f22';
      ctx.font = `${Math.max(9, Math.round(10 * layout.scale))}px Segoe UI, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(frequencyToNote(freq), layout.pianoWidth - 4, (y1 + y2) / 2);
    }
  }
}

function drawSpectrogramFrequencyLabels(layout) {
  const labeled = [70, 90, 100, 200, 300, 400, 500, 600, 800, 1000, 2000, 3000, 4000];
  ctx.font = `${Math.max(10, Math.round(11 * layout.scale))}px Segoe UI, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  labeled.forEach((freq) => {
    const y = spectrogramFreqToY(freq, layout);
    const major = freq === 100 || freq === 200 || freq === 500 || freq === 1000 || freq === 2000 || freq === 3000;
    ctx.strokeStyle = major ? 'rgba(202, 218, 200, 0.28)' : 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(layout.specLeft - 4, y);
    ctx.lineTo(layout.specLeft, y);
    ctx.stroke();
    ctx.fillStyle = '#cbd5d1';
    ctx.fillText(String(freq), layout.specLeft - 6, y);
  });

  ctx.fillStyle = '#cbd5d1';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('频率 (Hz)', layout.pianoWidth + 4, layout.top + 3);
}

function drawSpectrogramGuideLines(layout) {
  ctx.save();
  ctx.strokeStyle = 'rgba(210, 224, 218, 0.12)';
  ctx.lineWidth = 1;
  const labeled = [100, 200, 500, 800, 1000, 2000, 3000, 4000];
  labeled.forEach((freq) => {
    const y = spectrogramFreqToY(freq, layout);
    ctx.beginPath();
    ctx.moveTo(layout.specLeft, y);
    ctx.lineTo(layout.specRight, y);
    ctx.stroke();
  });
  ctx.strokeStyle = 'rgba(210, 224, 218, 0.06)';
  for (let x = layout.specLeft; x <= layout.specRight; x += Math.max(72, 84 * layout.scale)) {
    ctx.beginPath();
    ctx.moveTo(x, layout.top);
    ctx.lineTo(x, layout.bottom);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpectrogramTimeAxis(layout) {
  const y = layout.bottom + 1;
  ctx.fillStyle = '#1e2020';
  ctx.fillRect(layout.specLeft, y, layout.specWidth, layout.timeAxisHeight - 1);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(layout.specLeft, y);
  ctx.lineTo(layout.specRight, y);
  ctx.stroke();
  ctx.fillStyle = '#bfc8c3';
  ctx.font = `${Math.max(10, Math.round(11 * layout.scale))}px Segoe UI, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const secondsPerScreen = maxHistorySeconds;
  for (let i = 0; i <= 6; i += 1) {
    const x = layout.specLeft + (i / 6) * layout.specWidth;
    const label = `${Math.max(0, secondsPerScreen - (6 - i) * (secondsPerScreen / 6)).toFixed(0)}s`;
    ctx.fillText(label, x + 10, y + layout.timeAxisHeight / 2);
  }
  ctx.textAlign = 'right';
  ctx.fillText('时间', layout.specRight - 4, y + layout.timeAxisHeight / 2);
}

function drawSpectrogramProfileGrid(layout) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  for (let i = 0; i <= 4; i += 1) {
    const x = layout.profileLeft + (i / 4) * layout.profileWidth;
    ctx.beginPath();
    ctx.moveTo(x, layout.top);
    ctx.lineTo(x, layout.bottom);
    ctx.stroke();
  }
  ctx.fillStyle = '#cbd5d1';
  ctx.font = `${Math.max(10, Math.round(11 * layout.scale))}px Segoe UI, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('强度 (dB)', layout.profileRight - 6, layout.bottom - 4);
}

function drawSpectrogramFrame() {
  if (!analyser || !frequencyData) {
    return;
  }
  analyser.getFloatFrequencyData(frequencyData);
  const layout = getSpectrogramLayout();
  ctx.drawImage(
    canvas,
    layout.specLeft + 1,
    layout.top,
    layout.specWidth - 1,
    layout.specHeight,
    layout.specLeft,
    layout.top,
    layout.specWidth - 1,
    layout.specHeight
  );
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.0018)';
  ctx.fillRect(layout.specLeft, layout.top, layout.specWidth - 1, layout.specHeight);
  ctx.restore();
  ctx.fillStyle = '#080b0d';
  ctx.fillRect(layout.specRight - 1, layout.top, 1, layout.specHeight);

  const binHz = (audioContext.sampleRate / 2) / frequencyData.length;
  const rowDb = new Float32Array(Math.ceil(layout.specHeight) + 2);
  rowDb.fill(-140);
  const visibleDbValues = [];
  for (let i = 1; i < frequencyData.length; i += 1) {
    const freq = i * binHz;
    if (freq >= spectrogramDisplayMinHz && freq <= spectrogramDisplayMaxHz && Number.isFinite(frequencyData[i])) {
      visibleDbValues.push(frequencyData[i]);
    }
  }
  const sortedDbValues = visibleDbValues.sort((a, b) => a - b);
  const noiseFloorDb = sortedDbValues.length
    ? sortedDbValues[Math.floor(sortedDbValues.length * 0.42)]
    : spectrogramMinDb;
  const framePeakDb = sortedDbValues.length ? sortedDbValues[sortedDbValues.length - 1] : spectrogramMinDb;
  const frameRangeDb = Math.max(framePeakDb - noiseFloorDb, 1);
  const adaptiveFloorDb = Math.max(
    spectrogramMinDb + 7,
    noiseFloorDb + Math.min(7, frameRangeDb * 0.2)
  );
  const textureFloorDb = Math.max(
    spectrogramMinDb + 4,
    noiseFloorDb + Math.min(3, frameRangeDb * 0.08)
  );
  for (let i = 1; i < frequencyData.length; i += 1) {
    const freq = i * binHz;
    if (freq < spectrogramDisplayMinHz || freq > spectrogramDisplayMaxHz) {
      continue;
    }
    const value = frequencyData[i];
    const row = Math.round(spectrogramFreqToY(freq, layout) - layout.top);
    if (row >= 0 && row < rowDb.length) {
      rowDb[row] = Math.max(rowDb[row], value);
    }
  }
  const candidates = [];
  for (let row = 0; row < rowDb.length; row += 1) {
    const value = rowDb[row];
    if (value <= adaptiveFloorDb) {
      continue;
    }
    const localValues = [];
    const localRadius = 10;
    for (let offset = -localRadius; offset <= localRadius; offset += 1) {
      if (Math.abs(offset) <= 2) {
        continue;
      }
      const neighbor = rowDb[row + offset];
      if (Number.isFinite(neighbor) && neighbor > -130) {
        localValues.push(neighbor);
      }
    }
    localValues.sort((a, b) => a - b);
    const localFloorDb = localValues.length
      ? localValues[Math.floor(localValues.length * 0.4)]
      : noiseFloorDb;
    const localLift = value - localFloorDb;
    const floorLift = value - adaptiveFloorDb;
    if (localLift < 1.8 || floorLift < 0.8) {
      continue;
    }
    const peakContrast = Math.max(0, Math.min(1, (localLift - 1.8) / 16));
    const floorContrast = Math.max(0, Math.min(1, (floorLift - 0.8) / Math.max(framePeakDb - adaptiveFloorDb - 0.8, 1)));
    const intensity = Math.max(0, Math.min(1, Math.sqrt(peakContrast * floorContrast)));
    if (intensity <= 0.035) {
      continue;
    }
    candidates.push({ row, intensity });
  }

  const intensityValues = candidates.map((candidate) => candidate.intensity).sort((a, b) => a - b);
  const adaptiveIntensityFloor = intensityValues.length
    ? Math.max(0.04, intensityValues[Math.floor(intensityValues.length * 0.18)])
    : 1;
  ctx.save();
  for (let i = 1; i < frequencyData.length; i += 1) {
    const freq = i * binHz;
    if (freq < spectrogramDisplayMinHz || freq > spectrogramDisplayMaxHz) {
      continue;
    }
    const value = frequencyData[i];
    if (!Number.isFinite(value) || value <= textureFloorDb) {
      continue;
    }
    const textureLift = value - textureFloorDb;
    const textureIntensity = Math.max(
      0,
      Math.min(0.32, 0.06 + (textureLift / Math.max(framePeakDb - textureFloorDb, 1)) * 0.34)
    );
    if (textureIntensity <= 0.06) {
      continue;
    }
    const y = spectrogramFreqToY(freq, layout);
    const nextY = spectrogramFreqToY(freq + binHz, layout);
    const h = Math.max(1, Math.abs(nextY - y));
    ctx.globalAlpha = Math.min(0.68, 0.22 + textureIntensity * 1.35);
    ctx.fillStyle = spectrogramColor(textureIntensity);
    ctx.fillRect(layout.specRight - 1, Math.min(y, nextY), 1, h);
  }
  ctx.restore();
  candidates.forEach(({ row, intensity }) => {
    if (intensity < adaptiveIntensityFloor && intensity < 0.28) {
      return;
    }
    ctx.fillStyle = spectrogramColor(intensity);
    ctx.fillRect(layout.specRight - 1, layout.top + row, 1, 1);
  });

  drawSpectrogramStaticOverlays(layout);
  drawSpectrogramProfile(layout);
  drawSpectrogramEnergyHistory(layout);
  drawSpectrogramOverlay();
}

function spectrogramColor(intensity) {
  const visible = Math.max(0, Math.min(1, intensity));
  if (visible < 0.055) {
    return 'rgb(2, 4, 8)';
  }
  const shaped = ((visible - 0.055) / 0.945) ** 1.08;
  const stops = [
    [0, 2, 4, 8],
    [0.24, 0, 34, 112],
    [0.5, 0, 139, 210],
    [0.72, 100, 215, 148],
    [0.84, 242, 184, 58],
    [1, 205, 38, 48],
  ];
  for (let i = 1; i < stops.length; i += 1) {
    if (shaped <= stops[i][0]) {
      const prev = stops[i - 1];
      const next = stops[i];
      const ratio = (shaped - prev[0]) / Math.max(next[0] - prev[0], 1e-9);
      const r = Math.round(prev[1] + (next[1] - prev[1]) * ratio);
      const g = Math.round(prev[2] + (next[2] - prev[2]) * ratio);
      const b = Math.round(prev[3] + (next[3] - prev[3]) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return 'rgb(185, 24, 42)';
}

function drawSpectrogramStaticOverlays(layout) {
  ctx.save();
  ctx.clearRect(0, 0, layout.specLeft, canvas.height);
  ctx.clearRect(layout.profileLeft, 0, layout.profileWidth, layout.waveTop);
  ctx.clearRect(layout.specLeft, layout.bottom, layout.specWidth, layout.timeAxisHeight);
  drawSpectrogramPiano(layout);
  drawSpectrogramFrequencyLabels(layout);
  drawSpectrogramTimeAxis(layout);
  ctx.restore();
}

function drawSpectrogramProfile(layout) {
  ctx.save();
  ctx.fillStyle = '#080909';
  ctx.fillRect(layout.profileLeft, layout.top, layout.profileWidth, layout.specHeight);
  drawSpectrogramProfileGrid(layout);
  ctx.beginPath();
  ctx.moveTo(layout.profileLeft, layout.bottom);
  const binHz = (audioContext.sampleRate / 2) / frequencyData.length;
  for (let i = 1; i < frequencyData.length; i += 1) {
    const freq = i * binHz;
    if (freq < spectrogramDisplayMinHz || freq > spectrogramDisplayMaxHz) {
      continue;
    }
    const db = Math.max(spectrogramMinDb, Math.min(spectrogramMaxDb, frequencyData[i]));
    const ratio = (db - spectrogramMinDb) / (spectrogramMaxDb - spectrogramMinDb);
    const x = layout.profileLeft + ratio * (layout.profileWidth - 14);
    const y = spectrogramFreqToY(freq, layout);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(layout.profileLeft, layout.top);
  ctx.closePath();
  ctx.fillStyle = '#0b64f4';
  ctx.fill();
  ctx.strokeStyle = '#8ea2ff';
  ctx.lineWidth = 1;
  ctx.stroke();
  const peakDb = Math.max(...Array.from(frequencyData).filter(Number.isFinite));
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.max(12, Math.round(15 * layout.scale))}px Segoe UI, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${peakDb.toFixed(1)} dB`, layout.profileLeft + 8, layout.bottom - 8);
  ctx.restore();
}

function drawSpectrogramEnergyHistory(layout) {
  ctx.save();
  ctx.fillStyle = '#151717';
  ctx.fillRect(layout.specLeft, layout.waveTop, layout.specWidth, layout.waveBottom - layout.waveTop);
  const now = performance.now();
  const minTime = now - maxHistorySeconds * 1000;
  const visible = volumeHistory.filter((point) => point.time >= minTime);
  if (visible.length) {
    ctx.beginPath();
    ctx.moveTo(layout.specLeft, layout.waveBottom);
    visible.forEach((point) => {
      const x = layout.specLeft + ((point.time - minTime) / (maxHistorySeconds * 1000)) * layout.specWidth;
      const ratio = Math.max(0, Math.min(1, (point.db - volumeMeterMinDb) / (volumeMeterMaxDb - volumeMeterMinDb)));
      const y = layout.waveBottom - ratio * (layout.waveBottom - layout.waveTop - 8);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(layout.specRight, layout.waveBottom);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, layout.waveTop, 0, layout.waveBottom);
    gradient.addColorStop(0, '#ffd15a');
    gradient.addColorStop(0.45, '#ff8837');
    gradient.addColorStop(1, '#ff3b2d');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#ffd36d';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.beginPath();
  const midY = layout.waveTop + (layout.waveBottom - layout.waveTop) * 0.55;
  ctx.moveTo(layout.specLeft, midY);
  ctx.lineTo(layout.specRight, midY);
  ctx.stroke();
  ctx.restore();
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
  const layout = getSpectrogramLayout();

  const drawOverlayPoint = (key, freq, color) => {
    if (!freq || freq <= 0 || freq > nyquist) {
      spectrogramOverlayState[key] = null;
      return;
    }
    const y = spectrogramFreqToY(freq, layout);
    const prevY = spectrogramOverlayState[key];
    ctx.strokeStyle = color;
    ctx.lineWidth = spectrogramOverlayLineWidth;
    ctx.beginPath();
    if (prevY === null || prevY === undefined) {
      ctx.moveTo(layout.specRight - 1, y);
      ctx.lineTo(layout.specRight - 1, y);
    } else {
      ctx.moveTo(layout.specRight - 2, prevY);
      ctx.lineTo(layout.specRight - 1, y);
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
