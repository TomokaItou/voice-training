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
    renderRecordingLibrary();
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
    renderRecordingLibrary();
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
  renderRecordingLibrary();
}

function updateRecordingPlaybackProgress() {
  if (!recordingPlaybackAudio || recordingPlaybackAudio.paused) {
    return;
  }
  const timeMs = recordingPlaybackAudio.currentTime * 1000;
  selectRecordingTime(timeMs, false);
  recordingPlaybackRaf = requestAnimationFrame(updateRecordingPlaybackProgress);
}

