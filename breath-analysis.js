// Breath analysis and report helpers. This file is loaded before app.js and uses app-level state.

function resetBreathMeter() {
  breathHistory = [];
  breathSessionHistory = [];
  breathRecentScores = [];
  breathCurrentFlow = null;
  breathCurrentEffort = null;
  breathCurrentHighFrequency = null;
  breathCurrentLeakNoise = null;
  breathCurrentStability = null;
  breathStartTime = null;
  breathDurationSeconds = 0;
  if (breathFlowValueEl) {
    breathFlowValueEl.textContent = '--%';
  }
  if (breathScoreHeroValue) {
    breathScoreHeroValue.textContent = '--%';
  }
  if (breathEffortValueEl) {
    breathEffortValueEl.textContent = '--%';
  }
  if (breathEffortHeroValue) {
    breathEffortHeroValue.textContent = '--%';
  }
  if (breathNoiseValueEl) {
    breathNoiseValueEl.textContent = '--%';
  }
  if (breathNoiseHeroValue) {
    breathNoiseHeroValue.textContent = '--%';
  }
  if (breathLeakValueEl) {
    breathLeakValueEl.textContent = '--%';
  }
  if (breathLeakHeroValue) {
    breathLeakHeroValue.textContent = '--%';
  }
  if (breathVoiceTypeValueEl) {
    breathVoiceTypeValueEl.textContent = '--';
  }
  if (breathVoiceHeroValue) {
    breathVoiceHeroValue.textContent = '--';
  }
  if (breathStabilityValueEl) {
    breathStabilityValueEl.textContent = '-- / 0.0s';
  }
  if (breathStabilityHeroValue) {
    breathStabilityHeroValue.textContent = '--%';
  }
  if (breathDurationHeroValue) {
    breathDurationHeroValue.textContent = '0.0s';
  }
}

function clearBreathReport() {
  if (!breathReport) {
    return;
  }
  breathReport.hidden = true;
  delete breathReport.dataset.hasReport;
  if (breathReportSummary) {
    breathReportSummary.textContent = '--';
  }
  [
    breathReportAverage,
    breathReportPeak,
    breathReportEffort,
    breathReportHighFrequency,
    breathReportLeakNoise,
    breathReportVoiceType,
    breathReportBreaks,
  ].forEach((el) => {
    if (el) {
      el.textContent = '--';
    }
  });
  if (breathReportFeedback) {
    breathReportFeedback.textContent = '--';
  }
}

function setBreathCalibrationStatus(text) {
  if (breathCalibrationValueEl) {
    breathCalibrationValueEl.textContent = text;
  }
  if (breathCalibrationHeroValue) {
    breathCalibrationHeroValue.textContent = text;
  }
}

function resetBreathCalibration() {
  breathCalibration = {
    calibrated: false,
    effort: 0,
    highFrequency: 0,
    leakNoise: 0,
    score: 0,
  };
  breathCalibrationInProgress = false;
  if (breathCalibrateButton) {
    breathCalibrateButton.disabled = false;
  }
  setBreathCalibrationStatus('未校准');
}

function estimateBreathFlow(rms) {
  if (!Number.isFinite(rms) || rms <= 0) {
    return 0;
  }
  const db = 20 * Math.log10(Math.max(rms, 1e-6));
  return clamp01((db - breathFlowMinDb) / (breathFlowMaxDb - breathFlowMinDb));
}

function dbToLinear(db) {
  return Math.pow(10, db / 10);
}

function averageBandPower(spectrum, sampleRate, fftSize, minHz, maxHz) {
  const binResolution = sampleRate / fftSize;
  const start = Math.max(0, Math.floor(minHz / binResolution));
  const end = Math.min(spectrum.length - 1, Math.ceil(maxHz / binResolution));
  let sum = 0;
  let count = 0;

  for (let i = start; i <= end; i += 1) {
    const db = spectrum[i];
    if (Number.isFinite(db)) {
      sum += dbToLinear(db);
      count += 1;
    }
  }

  return count > 0 ? sum / count : 0;
}

function sumBandPower(spectrum, sampleRate, fftSize, minHz, maxHz) {
  const binResolution = sampleRate / fftSize;
  const start = Math.max(0, Math.floor(minHz / binResolution));
  const end = Math.min(spectrum.length - 1, Math.ceil(maxHz / binResolution));
  let sum = 0;

  for (let i = start; i <= end; i += 1) {
    const db = spectrum[i];
    if (Number.isFinite(db)) {
      sum += dbToLinear(db);
    }
  }

  return sum;
}

function estimateHighFrequencyBreathFromSpectrum(analyserNode, spectrumBuffer, sampleRate) {
  if (!analyserNode || !spectrumBuffer || !sampleRate) {
    return 0;
  }

  analyserNode.getFloatFrequencyData(spectrumBuffer);

  const nyquist = sampleRate / 2;
  const lowPower = averageBandPower(
    spectrumBuffer,
    sampleRate,
    analyserNode.fftSize,
    200,
    1000
  );
  const totalPower = sumBandPower(
    spectrumBuffer,
    sampleRate,
    analyserNode.fftSize,
    breathTotalEnergyMinHz,
    nyquist
  );
  const highPower = sumBandPower(
    spectrumBuffer,
    sampleRate,
    analyserNode.fftSize,
    breathHighFrequencyMinHz,
    nyquist
  );

  const highRatio = highPower / (totalPower + 1e-12);
  const lowRatio = lowPower / (totalPower + 1e-12);
  const highNoiseScore = clamp01((highRatio - 0.12) / 0.58);
  const lowVoicePenalty = clamp01((lowRatio - 0.35) / 0.45);

  return clamp01(highNoiseScore * (1 - lowVoicePenalty));
}

function estimateLeakNoiseFromAutocorrelation(buffer, sampleRate, rms) {
  if (!buffer || !sampleRate || !Number.isFinite(rms) || rms < 1e-5) {
    return 0;
  }

  const size = buffer.length;
  const minLag = Math.max(1, Math.floor(sampleRate / hnrMaxFrequencyHz));
  const maxLag = Math.min(size - 2, Math.floor(sampleRate / hnrMinFrequencyHz));
  if (maxLag <= minLag) {
    return 0;
  }

  let energy = 0;
  for (let i = 0; i < size; i += 1) {
    energy += buffer[i] * buffer[i];
  }
  if (energy <= 1e-12) {
    return 0;
  }

  let bestCorrelation = 0;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    let lagEnergy = 0;
    for (let i = 0; i < size - lag; i += 1) {
      correlation += buffer[i] * buffer[i + lag];
      lagEnergy += buffer[i + lag] * buffer[i + lag];
    }
    const normalized = correlation / Math.sqrt(energy * Math.max(lagEnergy, 1e-12));
    if (normalized > bestCorrelation) {
      bestCorrelation = normalized;
    }
  }

  const periodicity = clamp01((bestCorrelation - 0.18) / 0.62);
  return clamp01(1 - periodicity);
}

function estimateBreathMetrics(buffer, rms, analyserNode, spectrumBuffer, sampleRate) {
  const effort = estimateBreathFlow(rms);
  const highFrequency = estimateHighFrequencyBreathFromSpectrum(
    analyserNode,
    spectrumBuffer,
    sampleRate
  );
  const leakNoise = estimateLeakNoiseFromAutocorrelation(buffer, sampleRate, rms);
  const adjustedEffort = breathCalibration.calibrated
    ? clamp01((effort - breathCalibration.effort) / Math.max(1 - breathCalibration.effort, 0.05))
    : effort;
  const adjustedHighFrequency = breathCalibration.calibrated
    ? clamp01(
        (highFrequency - breathCalibration.highFrequency) /
          Math.max(1 - breathCalibration.highFrequency, 0.05)
      )
    : highFrequency;
  const adjustedLeakNoise = breathCalibration.calibrated
    ? clamp01(
        (leakNoise - breathCalibration.leakNoise) /
          Math.max(1 - breathCalibration.leakNoise, 0.05)
      )
    : leakNoise;
  return {
    score: clamp01(
      0.12 * adjustedEffort + 0.48 * adjustedHighFrequency + 0.4 * adjustedLeakNoise
    ),
    effort: adjustedEffort,
    highFrequency: adjustedHighFrequency,
    leakNoise: adjustedLeakNoise,
  };
}

function classifyBreathVoice(metrics, pitch, confidence) {
  const { effort, highFrequency, leakNoise, score } = metrics;
  const voiced = Boolean(pitch) && confidence > 0.25;

  if (!voiced && score > 0.35) {
    return '吹气/气声';
  }
  if (voiced && leakNoise > 0.6 && highFrequency > 0.45) {
    return '漏气型发声';
  }
  if (voiced && effort > 0.65 && leakNoise < 0.35) {
    return '用力型发声';
  }
  if (voiced && leakNoise < 0.35 && highFrequency < 0.35) {
    return '闭合较好';
  }
  if (voiced) {
    return '混合型';
  }
  return '无有效发声';
}

async function calibrateBreathEnvironment() {
  if (breathCalibrationInProgress) {
    return;
  }

  if (displayMode !== 'breath') {
    showTrainingView('breath');
  }

  if (!audioContext || !analyser || !frequencyData) {
    await start();
  }

  if (!audioContext || !analyser || !frequencyData) {
    setBreathCalibrationStatus('校准失败');
    return;
  }

  breathCalibrationInProgress = true;
  breathCalibrateButton.disabled = true;
  setBreathCalibrationStatus('校准中...');
  setStatus('请保持安静，正在校准环境', 'active');

  const samples = [];
  const startedAt = performance.now();

  await new Promise((resolve) => {
    const collect = () => {
      analyser.getFloatTimeDomainData(dataArray);
      const rms = computeRms(dataArray);
      const effort = estimateBreathFlow(rms);
      const highFrequency = estimateHighFrequencyBreathFromSpectrum(
        analyser,
        frequencyData,
        audioContext.sampleRate
      );
      const leakNoise = estimateLeakNoiseFromAutocorrelation(
        dataArray,
        audioContext.sampleRate,
        rms
      );
      samples.push({ effort, highFrequency, leakNoise });

      if (performance.now() - startedAt >= breathCalibrationDurationMs) {
        resolve();
        return;
      }
      requestAnimationFrame(collect);
    };
    collect();
  });

  if (!samples.length) {
    breathCalibrationInProgress = false;
    breathCalibrateButton.disabled = false;
    setBreathCalibrationStatus('校准失败');
    return;
  }

  const meanEffort = samples.reduce((sum, sample) => sum + sample.effort, 0) / samples.length;
  const meanHighFrequency =
    samples.reduce((sum, sample) => sum + sample.highFrequency, 0) / samples.length;
  const meanLeakNoise =
    samples.reduce((sum, sample) => sum + sample.leakNoise, 0) / samples.length;
  const score = clamp01(0.12 * meanEffort + 0.48 * meanHighFrequency + 0.4 * meanLeakNoise);

  breathCalibration = {
    calibrated: true,
    effort: meanEffort,
    highFrequency: meanHighFrequency,
    leakNoise: meanLeakNoise,
    score,
  };
  breathCalibrationInProgress = false;
  breathCalibrateButton.disabled = false;
  setBreathCalibrationStatus(`已校准 ${Math.round(score * 100)}%`);
  setStatus('环境校准完成', 'active');
}

function computeBreathStability(scores) {
  const activeScores = scores.filter((score) => score >= breathActiveThreshold);
  if (activeScores.length < 4) {
    return null;
  }
  const mean = activeScores.reduce((sum, value) => sum + value, 0) / activeScores.length;
  const variance =
    activeScores.reduce((sum, value) => sum + (value - mean) ** 2, 0) / activeScores.length;
  const stdDev = Math.sqrt(variance);
  return Math.round(clamp01(1 - stdDev * 4) * 100);
}

function updateBreathDisplay(metrics, stability, now, voiceType) {
  const flowScore = metrics.score;
  breathCurrentFlow = flowScore;
  breathCurrentEffort = metrics.effort;
  breathCurrentHighFrequency = metrics.highFrequency;
  breathCurrentLeakNoise = metrics.leakNoise;
  breathCurrentStability = stability;

  if (flowScore >= breathActiveThreshold) {
    if (breathStartTime === null) {
      breathStartTime = now;
    }
    breathDurationSeconds = (now - breathStartTime) / 1000;
  } else {
    breathStartTime = null;
    breathDurationSeconds = 0;
  }

  if (breathFlowValueEl) {
    breathFlowValueEl.textContent = `${Math.round(flowScore * 100)}%`;
  }
  if (breathScoreHeroValue) {
    breathScoreHeroValue.textContent = `${Math.round(flowScore * 100)}%`;
  }
  if (breathEffortValueEl) {
    breathEffortValueEl.textContent = `${Math.round(metrics.effort * 100)}%`;
  }
  if (breathEffortHeroValue) {
    breathEffortHeroValue.textContent = `${Math.round(metrics.effort * 100)}%`;
  }
  if (breathNoiseValueEl) {
    breathNoiseValueEl.textContent = `${Math.round(metrics.highFrequency * 100)}%`;
  }
  if (breathNoiseHeroValue) {
    breathNoiseHeroValue.textContent = `${Math.round(metrics.highFrequency * 100)}%`;
  }
  if (breathLeakValueEl) {
    breathLeakValueEl.textContent = `${Math.round(metrics.leakNoise * 100)}%`;
  }
  if (breathLeakHeroValue) {
    breathLeakHeroValue.textContent = `${Math.round(metrics.leakNoise * 100)}%`;
  }
  if (breathVoiceTypeValueEl) {
    breathVoiceTypeValueEl.textContent = voiceType;
  }
  if (breathVoiceHeroValue) {
    breathVoiceHeroValue.textContent = voiceType;
  }
  if (breathStabilityValueEl) {
    const stabilityText = stability === null ? '--' : `${stability}%`;
    breathStabilityValueEl.textContent = `${stabilityText} / ${breathDurationSeconds.toFixed(1)}s`;
  }
  if (breathStabilityHeroValue) {
    breathStabilityHeroValue.textContent = stability === null ? '--%' : `${stability}%`;
  }
  if (breathDurationHeroValue) {
    breathDurationHeroValue.textContent = `${breathDurationSeconds.toFixed(1)}s`;
  }
  if (typeof setTrainingFeedback === 'function' && trainingMode === 'breath') {
    if (!breathCalibration.calibrated) {
      setTrainingFeedback('先校准环境', '点“校准环境”并保持安静 2 秒，之后评分会更稳定。', '气息');
    } else if (flowScore < breathActiveThreshold) {
      setTrainingFeedback('轻轻开始吹气', '现在还没有稳定气流。对准麦克风，用小而连续的气流开始。', '气息');
    } else if (stability !== null && stability < 55) {
      setTrainingFeedback('气流有断续', `已经持续 ${breathDurationSeconds.toFixed(1)} 秒。下一步把气流放慢，目标是不中断。`, '气息', 'warn');
    } else if (metrics.leakNoise > 0.62) {
      setTrainingFeedback('漏气偏多', '声音里气声比较重。下一遍少推气，像细线一样匀速送出。', '气息', 'warn');
    } else {
      setTrainingFeedback('气息保持得住', `持续 ${breathDurationSeconds.toFixed(1)} 秒，稳定度 ${stability ?? '--'}%。继续延长但不要加猛气。`, '气息', 'good');
    }
  }
}

function hasRecentBreathData() {
  const now = performance.now();
  const minTime = now - breathHistoryWindowSeconds * 1000;
  return breathHistory.some((point) => point.time >= minTime && point.flow >= breathActiveThreshold);
}

function averageMetric(points, key) {
  if (!points.length) {
    return 0;
  }
  return points.reduce((sum, point) => sum + (point[key] ?? 0), 0) / points.length;
}

function countBreathBreaks(points) {
  let breaks = 0;
  let wasActive = false;

  points.forEach((point) => {
    const isActive = point.flow >= breathActiveThreshold;
    if (!isActive && wasActive) {
      breaks += 1;
    }
    wasActive = isActive;
  });

  return breaks;
}

function getDominantVoiceType(points) {
  const counts = points.reduce((map, point) => {
    if (point.voiceType && point.voiceType !== '无有效发声') {
      map.set(point.voiceType, (map.get(point.voiceType) || 0) + 1);
    }
    return map;
  }, new Map());

  if (!counts.size) {
    return '无有效发声';
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function getBreathFeedback(summary) {
  if (summary.voiceType === '漏气型发声') {
    return '本次以漏气型发声为主，声带有振动但气声和噪声偏多。';
  }
  if (summary.voiceType === '用力型发声') {
    return '本次更像用力型发声，气流强但漏气噪声低，可以试着减少喉部用力。';
  }
  if (summary.voiceType === '闭合较好') {
    return '本次声带闭合相对集中，如果目标是练气声，可以再增加柔和的气流感。';
  }
  if (summary.durationSeconds < 2) {
    return '有效出气时间偏短，先尝试保持 5 秒以上的连续气流。';
  }
  if (summary.breaks >= 3) {
    return '中途断气较多，先降低强度，练习更连续的平稳出气。';
  }
  if (summary.stability !== null && summary.stability < 55) {
    return '气息波动较明显，可以用更小的气流做慢而均匀的练习。';
  }
  if (summary.highFrequency > 0.65 && summary.effort < 0.35) {
    return '高频气声明显但气流强度偏低，说明气息漏出感强，支撑还可以再增加。';
  }
  if (summary.effort > 0.7 && summary.highFrequency < 0.35) {
    return '气流强度高但高频气声低，可能更接近用力发声，试着减少声带参与。';
  }
  if (summary.leakNoise > 0.65 && summary.highFrequency > 0.5) {
    return '漏气噪声和高频气声都较高，本次更接近吹气/气声练习。';
  }
  return '本次出气比较平稳，可以继续延长持续时间或尝试渐强渐弱练习。';
}

function renderBreathReport() {
  if (!breathReport || !breathSessionHistory.length) {
    return;
  }

  const sessionPoints = breathSessionHistory.filter((point) => point.time >= sessionStartTime);
  const activePoints = sessionPoints.filter((point) => point.flow >= breathActiveThreshold);

  if (activePoints.length < 4) {
    clearBreathReport();
    setStatus('已停止，出气数据不足');
    return;
  }

  const activeStart = activePoints[0].time;
  const activeEnd = activePoints[activePoints.length - 1].time;
  const durationSeconds = Math.max(0, (activeEnd - activeStart) / 1000);
  const summary = {
    durationSeconds,
    score: averageMetric(activePoints, 'flow'),
    peak: Math.max(...activePoints.map((point) => point.flow)),
    effort: averageMetric(activePoints, 'effort'),
    highFrequency: averageMetric(activePoints, 'highFrequency'),
    leakNoise: averageMetric(activePoints, 'leakNoise'),
    stability: computeBreathStability(activePoints.map((point) => point.flow)),
    breaks: countBreathBreaks(sessionPoints),
    voiceType: getDominantVoiceType(activePoints),
  };

  breathReport.dataset.hasReport = 'true';
  breathReport.hidden = displayMode !== 'breath';
  breathReportSummary.textContent = `持续 ${summary.durationSeconds.toFixed(1)}s`;
  breathReportAverage.textContent = `${Math.round(summary.score * 100)}%`;
  breathReportPeak.textContent = `${Math.round(summary.peak * 100)}%`;
  breathReportEffort.textContent = `${Math.round(summary.effort * 100)}%`;
  breathReportHighFrequency.textContent = `${Math.round(summary.highFrequency * 100)}%`;
  breathReportLeakNoise.textContent = `${Math.round(summary.leakNoise * 100)}%`;
  breathReportVoiceType.textContent = summary.voiceType;
  breathReportBreaks.textContent = String(summary.breaks);
  breathReportFeedback.textContent = getBreathFeedback(summary);
}
