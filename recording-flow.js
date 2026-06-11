// Shared recording controls and post-recording dispatch.

function updateRecordingButtons() {
  const hasRecording = Boolean(lastRecordingBlob);
  analyzeRecordingButton.disabled = !hasRecording || offlineAnalysisInProgress;
  downloadRecordingButton.disabled = !hasRecording;
  updateRecordingLibraryStatus();
  if (memoryAnalyzeButton) {
    memoryAnalyzeButton.disabled = !hasRecording || !recordingTimelineFrames.length;
  }
  if (typeof s88UpdateCompareButton === 'function') {
    s88UpdateCompareButton();
  }
  updateSongPracticeFlow();
}

function shouldRecordWithMainSession() {
  return trainingMode === 'curve' || trainingMode === 'memory';
}

async function startVoiceRecording() {
  if (offlineAnalysisInProgress) {
    return false;
  }
  try {
    if (!audioContext || !sourceNode?.mediaStream) {
      await start();
    }
    if (!sourceNode?.mediaStream) {
      throw new Error('No microphone stream available');
    }
    const stream = sourceNode.mediaStream;
    const recorder = new MediaRecorder(stream);
    recordedChunks = [];
    resetRecordingTimeline();
    recordingStartTime = performance.now();
    if (recordingTimelinePanel) {
      recordingTimelinePanel.hidden = false;
    }
    setTimelineStatus('录音中，时间轴正在记录...');
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    });
    recorder.addEventListener('stop', () => {
      const blob = new Blob(recordedChunks, { type: recorder.mimeType });
      lastRecordingBlob = blob.size > 0 ? blob : null;
      recordedChunks = [];
      recordingTimelineDurationMs = Math.max(
        recordingTimelineDurationMs,
        performance.now() - recordingStartTime
      );
      if (lastRecordingBlob) {
        addRecordingToLibrary(lastRecordingBlob);
        prepareRecordingPlayback(lastRecordingBlob);
        selectRecordingTime(0, false);
        setTimelineStatus('点击时间轴可以从任意位置播放，并查看当时波形');
      } else {
        setTimelineStatus('录音为空，请重新录制');
      }
      updateRecordingButtons();
      updatePitchAccuracyButton();
      if (trainingMode === 'memory') {
        if (
          lastRecordingBlob &&
          recordingTimelineFrames.length &&
          typeof analyzeMemoryPath === 'function'
        ) {
          setMemoryTrainingPhase('analyzing');
          analyzeMemoryPath();
        } else {
          setMemoryEmptyState('录音太短或没有有效音频。请重新录一段完整路径。');
          setMemoryTrainingPhase('ready');
        }
      }
      if (trainingMode === 'action') {
        if (
          lastRecordingBlob &&
          recordingTimelineFrames.length &&
          s88TargetProfile &&
          typeof s88CompareLatestRecording === 'function'
        ) {
          setS88TrainingPhase('analyzing');
          s88CompareLatestRecording();
        } else {
          setS88TrainingPhase(s88TargetProfile ? 'needs-recording' : 'needs-target');
        }
      }
      if (songPracticeAutoReviewPending) {
        songPracticeAutoReviewPending = false;
        if (lastRecordingBlob && songPitchTrack.length) {
          updateSongPracticeFlow('评估中');
          runPitchAccuracyAnalysis();
        } else {
          updateSongPracticeFlow();
        }
      }
    });
    mediaRecorder = recorder;
    recorder.start();
    if (isRhythmSongPracticeActive()) {
      syncRhythmToSongPractice(performance.now());
    }
    recordButton.disabled = true;
    stopRecordButton.disabled = false;
    setStatus('录音中', 'active');
    updateSongPracticeFlow();
    return true;
  } catch (error) {
    console.error(error);
    setStatus('无法开始录音，请检查权限设置');
    updateSongPracticeFlow();
    return false;
  }
}

function stopVoiceRecording({ reviewAfterStop = false } = {}) {
  songPracticeAutoReviewPending = Boolean(reviewAfterStop);
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  } else if (reviewAfterStop && lastRecordingBlob && songPitchTrack.length) {
    songPracticeAutoReviewPending = false;
    runPitchAccuracyAnalysis();
  } else {
    songPracticeAutoReviewPending = false;
  }
  recordButton.disabled = false;
  stopRecordButton.disabled = true;
  updateSongPracticeFlow(reviewAfterStop ? '准备评估' : null);
}
