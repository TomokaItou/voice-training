// Formant analysis helpers. Loaded before app.js so these functions share the app globals.

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

function drawFormantAxes(minFrequency = formantValidRanges.f1.min, maxFrequency = formantValidRanges.f2.max) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = 20;
  const ticks = [300, 700, 1200, 2000, 3000].filter(
    (tick) => tick >= minFrequency && tick <= maxFrequency
  );
  ctx.strokeStyle = '#eef1ed';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.textBaseline = 'middle';

  ticks.forEach((tick) => {
    const ratio =
      (Math.log(tick) - Math.log(minFrequency)) /
      Math.max(Math.log(maxFrequency) - Math.log(minFrequency), 0.0001);
    const y = canvas.height - padding - ratio * (canvas.height - padding * 2);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    ctx.fillText(`${tick} Hz`, 8, y);
  });
}

function drawFormantCurveHistory() {
  const sourceHistory = offlineMode ? offlineFormantHistory : formantCurveHistory;
  drawFormantAxes();

  if (sourceHistory.length < 2) {
    return;
  }

  let visibleHistory = sourceHistory;
  let minTime = 0;
  let durationMs = 0;

  if (offlineMode) {
    minTime = sourceHistory[0].time;
    const maxTime = sourceHistory[sourceHistory.length - 1].time;
    durationMs = Math.max(maxTime - minTime, 1);
  } else {
    const now = performance.now();
    minTime = now - maxHistorySeconds * 1000;
    visibleHistory = sourceHistory.filter((point) => point.time >= minTime);
    formantCurveHistory = visibleHistory;
    durationMs = maxHistorySeconds * 1000;
  }

  const padding = 20;
  const minFrequency = formantValidRanges.f1.min;
  const maxFrequency = formantValidRanges.f2.max;
  const logMin = Math.log(minFrequency);
  const logRange = Math.max(Math.log(maxFrequency) - logMin, 0.0001);

  const drawCurve = (key, color, label) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    let hasActivePath = false;
    visibleHistory.forEach((point) => {
      const value = point[key];
      if (!value || value < minFrequency || value > maxFrequency) {
        if (hasActivePath) {
          ctx.stroke();
          ctx.beginPath();
          hasActivePath = false;
        }
        return;
      }
      const x = ((point.time - minTime) / durationMs) * canvas.width;
      const normalized = (Math.log(value) - logMin) / logRange;
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
    ctx.fillStyle = color;
    ctx.font = '13px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(label, key === 'f1' ? 8 : 48, 8);
    ctx.restore();
  };

  drawCurve('f1', '#22c55e', 'F1');
  drawCurve('f2', '#f97316', 'F2');
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
  resetFormantVoiceGate();
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

function resetFormantVoiceGate(gate = formantVoiceGate) {
  gate.frames = 0;
  gate.lastPitch = null;
}

function isReliableFormantVoice(pitchResult, rms, gate = formantVoiceGate) {
  const pitch = pitchResult?.pitch;
  const hasEnoughEnergy =
    rms >=
    Math.max(
      formantVoiceMinRms,
      pitchMinEnergyThreshold * formantVoiceEnergyMultiplier,
      adaptiveEnergyThreshold * formantVoiceEnergyMultiplier
    );
  const hasReliablePitch =
    pitch &&
    pitch >= hnrMinFrequencyHz &&
    pitch <= hnrMaxFrequencyHz &&
    pitchResult.confidence >= formantVoiceConfidenceThreshold;
  const pitchIsStable =
    !gate.lastPitch ||
    getPitchDistanceCents(pitch, gate.lastPitch) <= formantVoiceMaxPitchJumpCents;

  if (!hasEnoughEnergy || !hasReliablePitch || !pitchIsStable) {
    resetFormantVoiceGate(gate);
    return false;
  }

  gate.frames += 1;
  gate.lastPitch = pitch;
  return gate.frames >= formantVoiceRequiredFrames;
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

function appendFormantBreak(history, time) {
  if (!history.length || history[history.length - 1].f1 !== null || history[history.length - 1].f2 !== null) {
    history.push({ time, f1: null, f2: null });
  }
}
