// Recording timeline and playback helpers. This file is loaded before app.js and uses app-level state.

function setTimelineStatus(text) {
  if (recordingTimelineStatus) {
    recordingTimelineStatus.textContent = text;
  }
}

function formatTimeSeconds(ms) {
  return `${(Math.max(0, ms) / 1000).toFixed(2)}s`;
}

function downsampleWaveform(buffer, sampleCount = recordingWaveformSampleCount) {
  const samples = [];
  const bucketSize = Math.max(1, Math.floor(buffer.length / sampleCount));
  for (let i = 0; i < sampleCount; i += 1) {
    const startIndex = i * bucketSize;
    const endIndex = Math.min(buffer.length, startIndex + bucketSize);
    let peak = 0;
    for (let j = startIndex; j < endIndex; j += 1) {
      peak = Math.max(peak, Math.abs(buffer[j] || 0));
    }
    samples.push(Math.min(1, peak));
  }
  return samples;
}

function resetRecordingTimeline({ keepBlob = false } = {}) {
  recordingStartTime = 0;
  recordingTimelineFrames = [];
  recordingTimelineDurationMs = 0;
  recordingSelectedTimeMs = 0;
  if (!keepBlob) {
    lastRecordingBlob = null;
  }
  stopRecordingPlayback();
  if (recordingTimelinePanel) {
    recordingTimelinePanel.hidden = true;
  }
  if (timelinePlayPauseButton) {
    timelinePlayPauseButton.disabled = true;
    timelinePlayPauseButton.textContent = '播放';
  }
  if (waveformTimeValue) {
    waveformTimeValue.textContent = '--';
  }
  drawRecordingTimeline();
  drawWaveformPreview(null);
}

function captureRecordingFrame(now, rms, pitch) {
  if (!mediaRecorder || mediaRecorder.state !== 'recording' || !recordingStartTime || !dataArray) {
    return;
  }
  const timeMs = Math.max(0, now - recordingStartTime);
  recordingTimelineDurationMs = Math.max(recordingTimelineDurationMs, timeMs);
  recordingSelectedTimeMs = timeMs;
  const timbreFeatures = extractRecordingTimbreFeatures();
  recordingTimelineFrames.push({
    timeMs,
    rms,
    pitch: pitch || null,
    ...timbreFeatures,
    samples: downsampleWaveform(dataArray),
  });
  drawRecordingTimeline();
}

function extractRecordingTimbreFeatures() {
  const features = {
    zcr: null,
    waveformRoughness: null,
    spectralFlatness: null,
    highFrequencyRatio: null,
    spectralCentroid: null,
  };
  if (dataArray?.length) {
    let crossings = 0;
    let diff = 0;
    for (let i = 1; i < dataArray.length; i += 1) {
      if ((dataArray[i - 1] < 0 && dataArray[i] >= 0) || (dataArray[i - 1] >= 0 && dataArray[i] < 0)) {
        crossings += 1;
      }
      diff += Math.abs(dataArray[i] - dataArray[i - 1]);
    }
    features.zcr = crossings / Math.max(1, dataArray.length - 1);
    features.waveformRoughness = clamp01(normalizeRange(diff / Math.max(1, dataArray.length - 1), 0.002, 0.08));
  }
  if (analyser && frequencyData && audioContext) {
    analyser.getFloatFrequencyData(frequencyData);
    const sampleRate = audioContext.sampleRate;
    const binHz = (sampleRate / 2) / Math.max(1, frequencyData.length);
    let total = 0;
    let weighted = 0;
    let high = 0;
    const powers = [];
    for (let i = 0; i < frequencyData.length; i += 1) {
      const hz = i * binHz;
      const power = 10 ** (frequencyData[i] / 10);
      if (hz >= 80) {
        total += power;
        weighted += hz * power;
        powers.push(Math.max(power, 1e-12));
      }
      if (hz >= 3000) {
        high += power;
      }
    }
    const geo = powers.length ? Math.exp(mean(powers.map((value) => Math.log(value)))) : 0;
    const arith = powers.length ? mean(powers) : 0;
    features.spectralFlatness = arith ? clamp01(geo / arith) : 0;
    features.highFrequencyRatio = total ? clamp01(high / total) : 0;
    features.spectralCentroid = total ? weighted / total : 0;
  }
  return features;
}

function getRecordingDurationMs() {
  return Math.max(
    recordingTimelineDurationMs,
    recordingTimelineFrames[recordingTimelineFrames.length - 1]?.timeMs || 0,
    recordingTimelineMinDurationMs
  );
}

function getRecordingSyncedPitchHistory() {
  if (offlineMode || !recordingTimelineFrames.length) {
    return [];
  }
  return recordingTimelineFrames.map((frame) => ({
    time: frame.timeMs,
    recordingTimeMs: frame.timeMs,
    pitch: frame.pitch || null,
  }));
}

function rmsToDb(rms) {
  return 20 * Math.log10(Math.max(rms || 0, 1e-5));
}

function getRecordingSyncedVolumeHistory() {
  if (offlineMode || !recordingTimelineFrames.length) {
    return [];
  }
  return recordingTimelineFrames.map((frame) => ({
    time: frame.timeMs,
    recordingTimeMs: frame.timeMs,
    rms: frame.rms || 0,
    db: rmsToDb(frame.rms || 0),
  }));
}

function findNearestRecordingFrame(timeMs) {
  if (!recordingTimelineFrames.length) {
    return null;
  }
  return recordingTimelineFrames.reduce((nearest, frame) => {
    if (!nearest) {
      return frame;
    }
    return Math.abs(frame.timeMs - timeMs) < Math.abs(nearest.timeMs - timeMs)
      ? frame
      : nearest;
  }, null);
}

function findNearestRecordingPitchPoint(timeMs) {
  const pitchPoints = getRecordingSyncedPitchHistory().filter((point) => point.pitch);
  if (!pitchPoints.length) {
    return null;
  }
  return pitchPoints.reduce((nearest, point) => {
    if (!nearest) {
      return point;
    }
    return Math.abs(point.recordingTimeMs - timeMs) < Math.abs(nearest.recordingTimeMs - timeMs)
      ? point
      : nearest;
  }, null);
}

function drawRecordingTimeline() {
  if (!recordingTimelineCtx || !recordingTimelineCanvas) {
    return;
  }
  const width = recordingTimelineCanvas.width;
  const height = recordingTimelineCanvas.height;
  const paddingX = 12;
  const centerY = Math.round(height * 0.48);
  const durationMs = getRecordingDurationMs();
  const frames = recordingTimelineFrames;

  recordingTimelineCtx.clearRect(0, 0, width, height);
  recordingTimelineCtx.fillStyle = '#ffffff';
  recordingTimelineCtx.fillRect(0, 0, width, height);

  recordingTimelineCtx.strokeStyle = '#d9ded6';
  recordingTimelineCtx.lineWidth = 1;
  recordingTimelineCtx.beginPath();
  recordingTimelineCtx.moveTo(paddingX, centerY);
  recordingTimelineCtx.lineTo(width - paddingX, centerY);
  recordingTimelineCtx.stroke();

  if (frames.length) {
    recordingTimelineCtx.strokeStyle = '#0f766e';
    recordingTimelineCtx.lineWidth = 2;
    recordingTimelineCtx.beginPath();
    frames.forEach((frame) => {
      const x = paddingX + (frame.timeMs / durationMs) * (width - paddingX * 2);
      const amp = Math.max(2, Math.min(34, (frame.rms || 0) * 360));
      recordingTimelineCtx.moveTo(x, centerY - amp);
      recordingTimelineCtx.lineTo(x, centerY + amp);
    });
    recordingTimelineCtx.stroke();

    recordingTimelineCtx.strokeStyle = 'rgba(15, 118, 110, 0.45)';
    recordingTimelineCtx.lineWidth = 1.5;
    recordingTimelineCtx.beginPath();
    let hasPitchPath = false;
    frames.forEach((frame) => {
      if (!frame.pitch) {
        hasPitchPath = false;
        return;
      }
      const x = paddingX + (frame.timeMs / durationMs) * (width - paddingX * 2);
      const y = height - 16 - Math.min(34, frame.pitch / 24);
      if (!hasPitchPath) {
        recordingTimelineCtx.moveTo(x, y);
        hasPitchPath = true;
      } else {
        recordingTimelineCtx.lineTo(x, y);
      }
    });
    recordingTimelineCtx.stroke();

    recordingTimelineCtx.fillStyle = '#0b5d56';
    frames.forEach((frame) => {
      if (!frame.pitch) {
        return;
      }
      const x = paddingX + (frame.timeMs / durationMs) * (width - paddingX * 2);
      recordingTimelineCtx.beginPath();
      recordingTimelineCtx.arc(x, centerY, 2.4, 0, Math.PI * 2);
      recordingTimelineCtx.fill();
    });
  }

  const selectedX = paddingX + (recordingSelectedTimeMs / durationMs) * (width - paddingX * 2);
  recordingTimelineCtx.strokeStyle = '#ff7a59';
  recordingTimelineCtx.lineWidth = 2;
  recordingTimelineCtx.beginPath();
  recordingTimelineCtx.moveTo(selectedX, 8);
  recordingTimelineCtx.lineTo(selectedX, height - 8);
  recordingTimelineCtx.stroke();

  recordingTimelineCtx.fillStyle = '#697167';
  recordingTimelineCtx.font = '12px sans-serif';
  recordingTimelineCtx.textBaseline = 'top';
  recordingTimelineCtx.fillText('0.00s', paddingX, height - 16);
  recordingTimelineCtx.textAlign = 'right';
  recordingTimelineCtx.fillText(formatTimeSeconds(durationMs), width - paddingX, height - 16);
  recordingTimelineCtx.textAlign = 'left';
}

function drawWaveformPreview(frame) {
  if (!waveformPreviewCtx || !waveformPreviewCanvas) {
    return;
  }
  const width = waveformPreviewCanvas.width;
  const height = waveformPreviewCanvas.height;
  const centerY = height / 2;
  waveformPreviewCtx.clearRect(0, 0, width, height);
  waveformPreviewCtx.fillStyle = '#ffffff';
  waveformPreviewCtx.fillRect(0, 0, width, height);
  waveformPreviewCtx.strokeStyle = '#eef1ed';
  waveformPreviewCtx.lineWidth = 1;
  waveformPreviewCtx.beginPath();
  waveformPreviewCtx.moveTo(0, centerY);
  waveformPreviewCtx.lineTo(width, centerY);
  waveformPreviewCtx.stroke();

  if (!frame?.samples?.length) {
    waveformPreviewCtx.fillStyle = '#8c9589';
    waveformPreviewCtx.font = '13px sans-serif';
    waveformPreviewCtx.textAlign = 'center';
    waveformPreviewCtx.textBaseline = 'middle';
    waveformPreviewCtx.fillText('点击录音时间轴查看当时波形', width / 2, centerY);
    waveformPreviewCtx.textAlign = 'left';
    return;
  }

  const barWidth = width / frame.samples.length;
  waveformPreviewCtx.fillStyle = '#0f766e';
  frame.samples.forEach((value, index) => {
    const barHeight = Math.max(2, value * (height - 24));
    const x = index * barWidth;
    waveformPreviewCtx.fillRect(x, centerY - barHeight / 2, Math.max(1, barWidth - 1), barHeight);
  });
}

function selectRecordingTime(timeMs, shouldPlay = false) {
  const durationMs = getRecordingDurationMs();
  recordingSelectedTimeMs = Math.max(0, Math.min(durationMs, timeMs));
  const frame = findNearestRecordingFrame(recordingSelectedTimeMs);
  if (waveformTimeValue) {
    const pitchText = frame?.pitch ? ` · ${Math.round(frame.pitch)} Hz` : '';
    waveformTimeValue.textContent = `${formatTimeSeconds(recordingSelectedTimeMs)}${pitchText}`;
  }
  drawRecordingTimeline();
  drawWaveformPreview(frame);
  if (!offlineMode && recordingTimelineFrames.length && displayMode === 'pitch') {
    updatePitchInspector(findNearestRecordingPitchPoint(recordingSelectedTimeMs));
    drawPitchHistory();
  } else if (!offlineMode && recordingTimelineFrames.length && displayMode === 'volume') {
    drawVolumeHistory();
  }
  if (shouldPlay) {
    startRecordingPlayback(recordingSelectedTimeMs);
  }
}

function prepareRecordingPlayback(blob) {
  if (!blob) {
    return;
  }
  if (recordingPlaybackUrl) {
    URL.revokeObjectURL(recordingPlaybackUrl);
  }
  recordingPlaybackUrl = URL.createObjectURL(blob);
  recordingPlaybackAudio = new Audio(recordingPlaybackUrl);
  recordingPlaybackAudio.addEventListener('ended', () => {
    stopRecordingPlayback();
    selectRecordingTime(getRecordingDurationMs(), false);
  });
  if (timelinePlayPauseButton) {
    timelinePlayPauseButton.disabled = false;
  }
}

function startRecordingPlayback(timeMs = recordingSelectedTimeMs) {
  if (!recordingPlaybackAudio) {
    return;
  }
  recordingPlaybackAudio.currentTime = Math.max(0, timeMs / 1000);
  recordingPlaybackAudio.play().then(() => {
    if (timelinePlayPauseButton) {
      timelinePlayPauseButton.textContent = '暂停';
    }
    updateRecordingPlaybackProgress();
  }).catch((error) => {
    console.error(error);
    setTimelineStatus('无法播放录音，请重新录制后再试');
  });
}

function stopRecordingPlayback(resetButton = true) {
  if (recordingPlaybackRaf) {
    cancelAnimationFrame(recordingPlaybackRaf);
    recordingPlaybackRaf = null;
  }
  if (recordingPlaybackAudio && !recordingPlaybackAudio.paused) {
    recordingPlaybackAudio.pause();
  }
  if (resetButton && timelinePlayPauseButton) {
    timelinePlayPauseButton.textContent = '播放';
  }
}

function updateRecordingPlaybackProgress() {
  if (!recordingPlaybackAudio || recordingPlaybackAudio.paused) {
    return;
  }
  const timeMs = recordingPlaybackAudio.currentTime * 1000;
  selectRecordingTime(timeMs, false);
  recordingPlaybackRaf = requestAnimationFrame(updateRecordingPlaybackProgress);
}

function frequencyToCentsError(frequency, targetFrequency) {
  if (!frequency || !targetFrequency || frequency <= 0 || targetFrequency <= 0) {
    return null;
  }
  return 1200 * Math.log2(frequency / targetFrequency);
}

function formatSignedCents(cents) {
  if (!Number.isFinite(cents)) {
    return '-- cents';
  }
  const sign = cents > 0 ? '+' : '';
  return `${sign}${cents.toFixed(1)} cents`;
}

function hasSongPitchTarget() {
  return songPitchEnabled && songPitchTrack.length > 0;
}

function getSongPracticeTimeMs(now = performance.now()) {
  if (accompanimentAudio && !accompanimentAudio.paused && Number.isFinite(accompanimentAudio.currentTime)) {
    return accompanimentAudio.currentTime * 1000;
  }
  if (sessionStartTime > 0) {
    return Math.max(0, now - sessionStartTime);
  }
  return 0;
}

function findSongPitchAt(timeMs, maxDistanceMs = songPitchMatchWindowMs) {
  if (!songPitchTrack.length || !Number.isFinite(timeMs)) {
    return null;
  }

  let left = 0;
  let right = songPitchTrack.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (songPitchTrack[mid].timeMs < timeMs) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  const candidates = [songPitchTrack[left], songPitchTrack[left - 1]].filter(Boolean);
  const nearest = candidates.reduce((best, point) => {
    if (!best) {
      return point;
    }
    return Math.abs(point.timeMs - timeMs) < Math.abs(best.timeMs - timeMs) ? point : best;
  }, null);

  if (!nearest || Math.abs(nearest.timeMs - timeMs) > maxDistanceMs || !nearest.pitch) {
    return null;
  }
  return nearest;
}

function getTargetPitchForTime(timeMs) {
  const songPoint = hasSongPitchTarget() ? findSongPitchAt(timeMs) : null;
  return songPoint?.pitch || targetPitchHz;
}

function getTargetPitchForNow(now = performance.now()) {
  return getTargetPitchForTime(getSongPracticeTimeMs(now));
}

function getSongPracticeTimeForPoint(pointTime, now = performance.now()) {
  if (
    accompanimentAudio &&
    Number.isFinite(accompanimentAudio.currentTime) &&
    accompanimentAudio.currentTime > 0
  ) {
    const elapsedFromPointMs = Math.max(0, now - pointTime);
    return Math.max(0, accompanimentAudio.currentTime * 1000 - elapsedFromPointMs);
  }
  return Math.max(0, pointTime - sessionStartTime);
}

function getPitchScoreWindow(now = performance.now()) {
  const minTime = now - pitchScoreWindowSeconds * 1000;
  return pitchHistory
    .filter((point) => point.time >= minTime && point.pitch)
    .map((point) => {
      const targetPitch = getTargetPitchForTime(getSongPracticeTimeForPoint(point.time, now));
      return {
        ...point,
        targetPitch,
        cents: frequencyToCentsError(point.pitch, targetPitch),
      };
    })
    .filter((point) => Number.isFinite(point.cents));
}

function computePitchScoreStats(now = performance.now()) {
  const windowPoints = getPitchScoreWindow(now);
  if (!windowPoints.length) {
    return null;
  }

  const absErrors = windowPoints.map((point) => Math.abs(point.cents));
  const averageAbsError =
    absErrors.reduce((sum, value) => sum + value, 0) / absErrors.length;
  const meanCents =
    windowPoints.reduce((sum, point) => sum + point.cents, 0) / windowPoints.length;
  const variance =
    windowPoints.reduce((sum, point) => sum + (point.cents - meanCents) ** 2, 0) /
    windowPoints.length;
  const centsStdDev = Math.sqrt(variance);
  const score = Math.round(
    Math.max(0, 100 - (averageAbsError / pitchScoreMaxUsefulCents) * 100)
  );
  const stability = Math.round(
    Math.max(0, 100 - (centsStdDev / pitchScoreMaxUsefulCents) * 100)
  );
  const hitRate = Math.round(
    (windowPoints.filter((point) => Math.abs(point.cents) <= pitchScoreHitToleranceCents)
      .length /
      windowPoints.length) *
      100
  );

  return {
    score,
    stability,
    hitRate,
    currentCents: frequencyToCentsError(currentPitch, getTargetPitchForNow(now)),
    currentTargetPitch: getTargetPitchForNow(now),
    averageAbsError,
  };
}

function setPitchScoreTone(tone) {
  if (!pitchScoreDashboard || pitchScoreLastTone === tone) {
    return;
  }
  pitchScoreDashboard.dataset.tone = tone;
  pitchScoreLastTone = tone;
}
