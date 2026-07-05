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

