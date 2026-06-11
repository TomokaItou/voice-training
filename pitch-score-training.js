// Real-time pitch score panel and pitch-point inspector.

function isPitchCurveSongPracticeActive() {
  return trainingMode === 'curve' && displayMode === 'pitch' && hasSongPitchTarget();
}

function isSongGameLaneActive() {
  return isPitchCurveSongPracticeActive() && songGameViewEnabled;
}

function shouldShowPitchScorePanel(readoutMode = trainingMode) {
  return trainingMode === 'score' || readoutMode === 'score' || (readoutMode === 'pitch' && hasSongPitchTarget());
}

function canUpdatePitchScoreNow() {
  return trainingMode === 'score' || isPitchCurveSongPracticeActive();
}

function isSongReferencePlaying() {
  return Boolean(
    (songPitchAudio && !songPitchAudio.paused) ||
      (accompanimentAudio && !accompanimentAudio.paused)
  );
}

function getPitchScoreDirectionText(cents) {
  const absCents = Math.abs(cents);
  if (absCents <= pitchScoreGoodToleranceCents) {
    return '稳住';
  }
  if (absCents <= pitchScoreHitToleranceCents) {
    return cents > 0 ? '略高' : '略低';
  }
  if (absCents <= 80) {
    return cents > 0 ? '偏高' : '偏低';
  }
  return cents > 0 ? '太高' : '太低';
}

function resetPitchScoreDisplay() {
  const isSongPractice = isPitchCurveSongPracticeActive();
  pitchScoreDashboard?.classList.toggle('song-practice', isSongPractice);
  pitchScoreDashboard?.classList.toggle('score-training', trainingMode === 'score');
  if (pitchScoreValue) {
    pitchScoreValue.textContent = '--';
  }
  if (pitchScoreCaption) {
    pitchScoreCaption.textContent = trainingMode === 'score'
      ? '对准目标音高持续发声，观察偏差和稳定度。'
      : hasSongPitchTarget()
      ? '开始检测后，跟着歌曲曲线唱；低八度或高八度也会按旋律判断。'
      : '开始检测后，对准目标音持续发声。';
  }
  if (pitchScoreTargetValue) {
    pitchScoreTargetValue.textContent = trainingMode === 'score'
      ? '--'
      : hasSongPitchTarget()
      ? '歌曲旋律'
      : `${Math.round(targetPitchHz)} Hz`;
  }
  if (pitchScoreCentsValue) {
    pitchScoreCentsValue.textContent = '-- cents';
  }
  if (pitchScoreStabilityValue) {
    pitchScoreStabilityValue.textContent = '--%';
  }
  if (pitchScoreHitRateValue) {
    pitchScoreHitRateValue.textContent = '--%';
  }
  if (pitchScoreAverageValue) {
    pitchScoreAverageValue.textContent = '-- cents';
  }
  if (pitchScoreCoverageValue) {
    pitchScoreCoverageValue.textContent = '--%';
  }
  setPitchScoreTone('neutral');
}

function formatPitchPointTime(point) {
  if (!point) {
    return '--';
  }
  if (Number.isFinite(point.recordingTimeMs)) {
    return formatTimeSeconds(point.recordingTimeMs);
  }
  if (offlineMode || sessionStartTime === 0) {
    return formatTimeSeconds(point.time);
  }
  return formatTimeSeconds(Math.max(0, point.time - sessionStartTime));
}

function updatePitchInspector(point) {
  selectedPitchPoint = point;
  if (!pitchInspectorPanel || !selectedPitchValue || !selectedPitchHint) {
    return;
  }
  if (!point?.pitch) {
    pitchInspectorPanel.hidden = true;
    selectedPitchValue.textContent = '--';
    selectedPitchHint.textContent = '点击音高曲线查看对应时间点';
    return;
  }
  pitchInspectorPanel.hidden = false;
  selectedPitchValue.textContent = `${point.pitch.toFixed(1)} Hz · ${frequencyToNote(point.pitch)}`;
  selectedPitchHint.textContent = `时间 ${formatPitchPointTime(point)}`;
}

function clearSelectedPitchPoint() {
  updatePitchInspector(null);
  drawPitchHistory();
}

function updatePitchScoreDisplay(now = performance.now()) {
  if (!canUpdatePitchScoreNow()) {
    return;
  }

  const isSongPractice = isPitchCurveSongPracticeActive();
  pitchScoreDashboard?.classList.toggle('song-practice', isSongPractice);
  if (isSongPractice && currentPitch && songPracticeStartTime === 0 && !isSongReferencePlaying()) {
    songPracticeStartTime = now;
  }
  if (pitchScoreTargetValue) {
    pitchScoreTargetValue.textContent = hasSongPitchTarget()
      ? '歌曲旋律'
      : `${Math.round(targetPitchHz)} Hz`;
  }

  const stats = computePitchScoreStats(now);
  if (!stats || !Number.isFinite(stats.currentCents)) {
    resetPitchScoreDisplay();
    return;
  }

  const absCurrentCents = Math.abs(stats.currentCents);
  const isGood = absCurrentCents <= pitchScoreGoodToleranceCents;
  const isClose = absCurrentCents <= pitchScoreHitToleranceCents;
  const direction = getPitchScoreDirectionText(stats.currentCents);
  const directionHint =
    direction === '稳住'
      ? '保持现在的音高'
      : stats.currentCents > 0
        ? '往低一点唱'
        : '往高一点唱';
  const tone = isGood ? 'good' : isClose ? 'close' : 'warn';

  pitchScoreValue.textContent = isSongPractice
    ? direction
    : currentPitch
      ? `${Math.round(currentPitch)} Hz`
      : '--';
  pitchScoreCaption.textContent = isSongPractice
    ? `${directionHint}。旋律准度 ${stats.score}% / 命中 ${stats.hitRate}%（自动兼容高低八度）。`
    : `${directionHint}，最近 ${pitchScoreWindowSeconds} 秒 P90 偏差 ${stats.p90AbsError.toFixed(
        1
      )} cents，覆盖 ${stats.coverage}%。`;
  pitchScoreCentsValue.textContent = formatSignedCents(stats.currentCents);
  if (pitchScoreTargetValue && trainingMode === 'score') {
    pitchScoreTargetValue.textContent = currentPitch ? frequencyToNote(currentPitch) : '--';
  }
  if (pitchScoreTargetValue && hasSongPitchTarget() && stats.currentTargetPitch) {
    pitchScoreTargetValue.textContent = `${Math.round(stats.currentTargetPitch)} Hz 旋律`;
  }
  pitchScoreStabilityValue.textContent = `${stats.stability}%`;
  pitchScoreHitRateValue.textContent = `${stats.hitRate}%`;
  if (pitchScoreAverageValue) {
    pitchScoreAverageValue.textContent = `${stats.averageAbsError.toFixed(1)} cents`;
  }
  if (pitchScoreCoverageValue) {
    pitchScoreCoverageValue.textContent = `${stats.coverage}%`;
  }
  if (hasSongPitchTarget()) {
    setSongTrainingResult(
      `${stats.score}% / 命中 ${stats.hitRate}% / 覆盖 ${stats.coverage}%`,
      tone === 'warn' ? 'bad' : 'good'
    );
    setTrainingFeedback(
      direction === '稳住' ? '这段旋律贴得住' : direction,
      `${directionHint}。这一小段旋律准度 ${stats.score}%，命中 ${stats.hitRate}%，覆盖 ${stats.coverage}%。先把覆盖唱满，再追求更高分。`,
      '跟唱',
      tone
    );
    if (typeof updateCombinedSongPracticeFeedback === 'function') {
      updateCombinedSongPracticeFeedback();
    }
  } else {
    setTrainingFeedback(
      direction === '稳住' ? '音高稳定，继续保持' : direction,
      `${directionHint}。最近 ${pitchScoreWindowSeconds} 秒稳定度 ${stats.stability}%，命中 ${stats.hitRate}%。先唱稳 3 秒，再拉长到 6 秒。`,
      '音准',
      tone
    );
  }
  setPitchScoreTone(tone);
}
