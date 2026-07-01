// Pitch detection and pitch utility helpers. Loaded before app.js so these functions share the app globals.

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

function updateAdaptiveEnergyThreshold(rms) {
  if (!Number.isFinite(rms)) {
    return adaptiveEnergyThreshold;
  }

  const isRising = rms > adaptiveNoiseFloorRms;
  const looksLikeForegroundVoice =
    isRising && rms > adaptiveNoiseFloorRms * pitchNoiseFloorRiseGuardMultiplier;
  const allowRise = !voicedStable && !looksLikeForegroundVoice;
  const alphaRise = allowRise ? pitchNoiseFloorRiseAlpha : 0;

  const alpha = isRising ? alphaRise : pitchNoiseFloorFallAlpha;

  adaptiveNoiseFloorRms = (1 - alpha) * adaptiveNoiseFloorRms + alpha * rms;
  adaptiveEnergyThreshold = Math.max(
    pitchMinEnergyThreshold,
    adaptiveNoiseFloorRms * pitchAdaptiveEnergyMultiplier
  );
  return adaptiveEnergyThreshold;
}

function estimatePitchYinWithConfidence(buffer, sampleRate, rms) {
  const size = buffer.length;
  const minTau = Math.max(2, Math.floor(sampleRate / pitchMaxHz));
  const maxTau = Math.min(size - 2, Math.floor(sampleRate / pitchMinHz));
  if (maxTau <= minTau) {
    return { pitch: null, confidence: 0, rms };
  }

  const yinThreshold = 0.16;
  const difference = new Float32Array(maxTau + 1);
  const cmnd = new Float32Array(maxTau + 1);
  cmnd[0] = 1;

  for (let tau = 1; tau <= maxTau; tau += 1) {
    let sum = 0;
    for (let i = 0; i < size - tau; i += 1) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    difference[tau] = sum;
  }

  let runningSum = 0;
  for (let tau = 1; tau <= maxTau; tau += 1) {
    runningSum += difference[tau];
    cmnd[tau] = runningSum > 0 ? (difference[tau] * tau) / runningSum : 1;
  }

  let tauEstimate = -1;
  for (let tau = minTau; tau <= maxTau; tau += 1) {
    if (cmnd[tau] < yinThreshold) {
      while (tau + 1 <= maxTau && cmnd[tau + 1] < cmnd[tau]) {
        tau += 1;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) {
    let bestTau = minTau;
    let bestValue = cmnd[minTau];
    for (let tau = minTau + 1; tau <= maxTau; tau += 1) {
      if (cmnd[tau] < bestValue) {
        bestValue = cmnd[tau];
        bestTau = tau;
      }
    }
    if (bestValue >= 0.35) {
      return { pitch: null, confidence: 0, rms };
    }
    tauEstimate = bestTau;
  }

  const x0 = tauEstimate > 1 ? tauEstimate - 1 : tauEstimate;
  const x2 = tauEstimate + 1 <= maxTau ? tauEstimate + 1 : tauEstimate;
  const s0 = cmnd[x0];
  const s1 = cmnd[tauEstimate];
  const s2 = cmnd[x2];
  let betterTau = tauEstimate;
  const denom = 2 * (2 * s1 - s2 - s0);
  if (denom !== 0) {
    betterTau = tauEstimate + (s2 - s0) / denom;
  }

  const pitch = betterTau > 0 ? sampleRate / betterTau : null;
  const periodicity = Math.max(0, Math.min(1, 1 - cmnd[tauEstimate]));
  const energyScore = Math.min(1, rms / pitchEnergyRef);
  return { pitch, confidence: periodicity * energyScore, rms };
}

function detectPitchForAlgorithm(buffer, sampleRate, analyserNode = null, spectrumBuffer = null) {
  const rms = computeRms(buffer);
  const energyThreshold = updateAdaptiveEnergyThreshold(rms);
  if (rms < energyThreshold) {
    return { pitch: null, confidence: 0, rms, energyThreshold };
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

  if (pitchAlgorithm === 'yin') {
    return estimatePitchYinWithConfidence(buffer, sampleRate, rms);
  }

  return autoCorrelateWithConfidence(buffer, sampleRate, rms);
}

function autoCorrelateWithConfidence(buffer, sampleRate, rms = computeRms(buffer)) {
  const size = buffer.length;
  const minOffset = Math.max(2, Math.floor(sampleRate / pitchMaxHz));
  const maxOffset = Math.min(Math.floor(sampleRate / pitchMinHz), Math.floor(size / 2));

  let bestOffset = -1;
  let bestDifference = Infinity;
  let differenceSum = 0;
  let differenceCount = 0;
  const differences = new Float32Array(maxOffset + 1);

  for (let offset = minOffset; offset <= maxOffset; offset += 1) {
    let difference = 0;
    let compared = 0;
    for (let i = 0; i < size - offset; i += 1) {
      difference += Math.abs(buffer[i] - buffer[i + offset]);
      compared += 1;
    }
    const normalizedDifference = compared ? difference / compared : Infinity;
    differences[offset] = normalizedDifference;
    if (Number.isFinite(normalizedDifference)) {
      differenceSum += normalizedDifference;
      differenceCount += 1;
    }

    if (normalizedDifference < bestDifference) {
      bestDifference = normalizedDifference;
      bestOffset = offset;
    }
  }

  const strongDifference = Math.max(bestDifference * 1.25, bestDifference + 0.006);
  for (let offset = minOffset + 1; offset < maxOffset; offset += 1) {
    const difference = differences[offset];
    if (
      difference <= strongDifference &&
      difference <= differences[offset - 1] &&
      difference <= differences[offset + 1]
    ) {
      bestOffset = offset;
      bestDifference = difference;
      break;
    }
  }

  const pitch = bestOffset !== -1 ? sampleRate / bestOffset : null;
  const energyScore = Math.min(1, rms / pitchEnergyRef);
  const meanDifference = differenceCount ? differenceSum / differenceCount : 1;
  const periodicClarity =
    meanDifference > 0 ? Math.max(0, (meanDifference - bestDifference) / meanDifference) : 0;
  const confidence = Math.max(0, Math.min(1, periodicClarity * energyScore));

  return { pitch, confidence, rms };
}

function autoCorrelateStandardWithConfidence(buffer, sampleRate, rms) {
  const size = buffer.length;
  const minLag = Math.max(2, Math.floor(sampleRate / pitchMaxHz));
  const maxLag = Math.min(size - 2, Math.floor(sampleRate / pitchMinHz));
  let bestLag = -1;
  let bestCorrelation = 0;
  const correlations = new Float32Array(maxLag + 1);

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let sum = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < size - lag; i += 1) {
      const value = buffer[i];
      const shifted = buffer[i + lag];
      sum += value * shifted;
      normA += value * value;
      normB += shifted * shifted;
    }
    const correlation = normA > 0 && normB > 0 ? sum / Math.sqrt(normA * normB) : 0;
    correlations[lag] = correlation;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  const strongCorrelation = bestCorrelation * 0.92;
  for (let lag = minLag + 1; lag < maxLag; lag += 1) {
    const correlation = correlations[lag];
    if (
      correlation >= strongCorrelation &&
      correlation >= correlations[lag - 1] &&
      correlation >= correlations[lag + 1]
    ) {
      bestLag = lag;
      bestCorrelation = correlation;
      break;
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
  return detectPitchForAlgorithm(buffer, sampleRate, analyserNode, spectrumBuffer);
}

function autoCorrelate(buffer, sampleRate) {
  const size = buffer.length;
  const rms = computeRms(buffer);
  if (rms < Math.max(pitchMinEnergyThreshold, adaptiveEnergyThreshold)) {
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
