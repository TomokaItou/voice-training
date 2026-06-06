function update() {
  const now = performance.now();
  analyser.getFloatTimeDomainData(dataArray);
  const rms = computeRms(dataArray);
  updateVolumeMeter(rms);
  appendVolumePoint(now, rms);
  updateSpectralTilt();

  if (now - lastDisplayUpdate >= displayUpdateIntervalMs) {
    lastDisplayUpdate = now;
    if (displayMode === 'breath') {
      const pitchResult = estimatePitchWithConfidence(
        dataArray,
        audioContext.sampleRate,
        analyser,
        frequencyData
      );
      const metrics = breathCalibrationInProgress
        ? { score: 0, effort: 0, highFrequency: 0, leakNoise: 0 }
        : estimateBreathMetrics(
            dataArray,
            rms,
            analyser,
            frequencyData,
            audioContext.sampleRate
          );
      const voiceType = breathCalibrationInProgress
        ? '校准中'
        : classifyBreathVoice(metrics, pitchResult.pitch, pitchResult.confidence);
      const flow = metrics.score;
      breathRecentScores.push(flow);
      if (breathRecentScores.length > breathStabilityWindowSize) {
        breathRecentScores.shift();
      }
      const stability = computeBreathStability(breathRecentScores);
      updateBreathDisplay(metrics, stability, now, voiceType);
      const breathPoint = {
        time: now,
        flow,
        effort: metrics.effort,
        highFrequency: metrics.highFrequency,
        leakNoise: metrics.leakNoise,
        voiceType,
        stability,
        durationSeconds: breathDurationSeconds,
      };
      breathHistory.push(breathPoint);
      breathSessionHistory.push(breathPoint);
      drawBreathHistory();
      captureRecordingFrame(now, rms, pitchResult.pitch);
      animationId = requestAnimationFrame(update);
      return;
    }

    const { pitch, confidence } = estimatePitchWithConfidence(
      dataArray,
      audioContext.sampleRate,
      analyser,
      frequencyData
    );
    const isInRange = pitch && pitch >= pitchMinHz && pitch <= pitchMaxHz;
    const hasPitch = Boolean(pitch) && isInRange;
    const confidenceThreshold = voicedStable
      ? pitchSustainConfidenceThreshold
      : pitchOnsetConfidenceThreshold;
    const isReliable = hasPitch && confidence >= confidenceThreshold;

    if (!isReliable) {
      pendingPitch = null;
      pendingPitchFrames = 0;
      if (voicedStable) {
        voicedLostFrames += 1;
        pitchHoldCounter += 1;
        if (lastStablePitch && pitchHoldCounter <= pitchHoldFrames) {
          currentPitch = smoothedPitch ?? lastStablePitch;
          pitchHistory.push({ time: now, pitch: currentPitch });
        } else {
          currentPitch = null;
          appendPitchBreak(now);
        }
        if (voicedLostFrames >= pitchReleaseFrames) {
          voicedStable = false;
          voicedFrames = 0;
          pitchHoldCounter = 0;
        }
      } else {
        voicedFrames = 0;
        currentPitch = null;
        appendPitchBreak(now);
      }
    } else {
      pitchHoldCounter = 0;
      voicedLostFrames = 0;
      recentPitchWindow = pushPitchSample(recentPitchWindow, pitch);
      voicedFrames = Math.min(pitchOnsetFrames, voicedFrames + 1);

      if (!voicedStable && voicedFrames < pitchOnsetFrames) {
        currentPitch = null;
        appendPitchBreak(now);
      } else {
        voicedStable = true;
        const displayPitch = median(recentPitchWindow);
        const rawCandidate = selectPitchCandidate(pitch, lastStablePitch);
        const medianCandidate = selectPitchCandidate(displayPitch, lastStablePitch);
        const looksLikeOctaveSpike =
          lastStablePitch &&
          rawCandidate &&
          medianCandidate &&
          isNearOctaveJump(rawCandidate, lastStablePitch) &&
          getPitchDistanceCents(medianCandidate, lastStablePitch) < pitchFastTransitionCents;
        const isFastTransition =
          lastStablePitch &&
          rawCandidate &&
          !looksLikeOctaveSpike &&
          getPitchDistanceCents(rawCandidate, lastStablePitch) >= pitchFastTransitionCents;
        const candidate = isFastTransition ? rawCandidate : medianCandidate;
        const maxJump = getMaxJumpThresholdHz(lastStablePitch);

        if (!candidate) {
          pendingPitch = null;
          pendingPitchFrames = 0;
          pitchHoldCounter += 1;
          if (lastStablePitch && pitchHoldCounter <= pitchHoldFrames) {
            currentPitch = smoothedPitch ?? lastStablePitch;
            pitchHistory.push({ time: now, pitch: currentPitch });
          } else {
            currentPitch = null;
            appendPitchBreak(now);
          }
        } else if (lastStablePitch && Math.abs(candidate - lastStablePitch) > maxJump) {
          if (pendingPitch && Math.abs(candidate - pendingPitch) <= maxJump) {
            pendingPitchFrames += 1;
          } else {
            pendingPitch = candidate;
            pendingPitchFrames = 1;
          }

          const requiredTransitionFrames = isFastTransition
            ? pitchFastTransitionConfirmFrames
            : pitchTransitionConfirmFrames;

          if (pendingPitchFrames >= requiredTransitionFrames) {
            lastStablePitch = pendingPitch;
            pendingPitch = null;
            pendingPitchFrames = 0;
            smoothedPitch = isFastTransition
              ? lastStablePitch
              : applyPitchEma(smoothedPitch, lastStablePitch);
            currentPitch = smoothedPitch;
            pitchHistory.push({ time: now, pitch: smoothedPitch });
          } else {
            currentPitch = smoothedPitch ?? lastStablePitch;
            pitchHistory.push({ time: now, pitch: currentPitch });
          }
        } else {
          pendingPitch = null;
          pendingPitchFrames = 0;
          lastStablePitch = candidate;
          smoothedPitch = applyPitchEma(smoothedPitch, candidate);
          currentPitch = smoothedPitch;
          pitchHistory.push({ time: now, pitch: smoothedPitch });
        }
      }
    }

    if (displayMode === 'volume') {
      drawVolumeHistory();
    } else if (displayMode === 'formants') {
      drawFormantCurveHistory();
    } else if (displayMode !== 'spectrogram') {
      drawPitchHistory();
    }

    if (currentPitch) {
      pitchValueEl.textContent = `${currentPitch.toFixed(1)} Hz`;
      noteValueEl.textContent = frequencyToNote(currentPitch);
    } else {
      pitchValueEl.textContent = '-- Hz';
      noteValueEl.textContent = '--';
    }
    captureRecordingFrame(now, rms, currentPitch);
    updatePitchScoreDisplay(now);
    updateRangeTraining(now, currentPitch);
  }

  if (formantToggle.checked || displayMode === 'formants') {
    if (now - lastFormantUpdate >= formantUpdateIntervalMs) {
      lastFormantUpdate = now;
      const formantPitchResult = estimatePitchWithConfidence(
        dataArray,
        audioContext.sampleRate,
        analyser,
        frequencyData
      );
      if (!isReliableFormantVoice(formantPitchResult, rms)) {
        appendFormantBreak(formantCurveHistory, now);
        setFormantDisplay(null, null);
        setFormantStatus('未检测到稳定人声');
        lastFormantTimestamp = now;
        if (displayMode === 'formants') {
          drawFormantCurveHistory();
        }
        animationId = requestAnimationFrame(update);
        return;
      }
      const { f1, f2 } = estimateFormants();
      const stabilized = stabilizeFormants(f1, f2, now);
      formantCurveHistory.push({ time: now, f1: stabilized.f1, f2: stabilized.f2 });
      setFormantDisplay(stabilized.f1, stabilized.f2);
      lastFormantTimestamp = now;
      if (displayMode === 'formants') {
        drawFormantCurveHistory();
      }
    }
  } else {
    setFormantStatus('');
  }

  if (displayMode === 'spectrogram') {
    drawSpectrogramFrame();
  }
  animationId = requestAnimationFrame(update);
}

async function start() {
  try {
    setOfflineMode(false);
    resetOfflineState();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 4096;
    dataArray = new Float32Array(analyser.fftSize);
    frequencyData = new Float32Array(analyser.frequencyBinCount);

    sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(analyser);

    pitchHistory = [];
    volumeHistory = [];
    resetPitchStabilizer();
    resetBreathMeter();
    if (trainingMode === 'range') {
      resetRangeTraining();
    }
    clearBreathReport();
    sessionStartTime = performance.now();
    songPracticeStartTime = 0;
    lastFormantUpdate = 0;
    lastFormantTimestamp = 0;
    resetFormants();
    setAnalysisStatus('未开始');
    setStatus(displayMode === 'breath' ? '正在测量出气' : '正在监听麦克风', 'active');
    if (displayMode === 'spectrogram') {
      resetSpectrogram();
    } else if (displayMode === 'breath') {
      drawBreathHistory();
    }
    updateVolumeMeter(0);
    if (tiltMeterBar) {
      tiltMeterBar.style.height = '0%';
    }

    startButton.disabled = true;
    stopButton.disabled = false;

    update();
  } catch (error) {
    setStatus('无法访问麦克风，请检查权限设置');
    console.error(error);
  }
}

function stop() {
  const wasSpectrogram = displayMode === 'spectrogram';
  const spectrogramSnapshot = captureSpectrogramSnapshot();
  const shouldRenderBreathReport = displayMode === 'breath' && breathSessionHistory.length > 0;
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
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  resetPitchStabilizer();
  setStatus(wasSpectrogram ? '已暂停，频谱图已冻结' : '已停止');
  updateVolumeMeter(0);
  if (tiltMeterBar) {
    tiltMeterBar.style.height = '0%';
  }
  startButton.disabled = false;
  stopButton.disabled = true;
  resetFormants();
  if (shouldRenderBreathReport) {
    renderBreathReport();
  }
  if (wasSpectrogram) {
    restoreSpectrogramSnapshot(spectrogramSnapshot);
    requestAnimationFrame(() => restoreSpectrogramSnapshot(spectrogramSnapshot));
  }
}
