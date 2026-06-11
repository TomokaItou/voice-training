// Song practice flow, target playback, and pitch accuracy review.

function updatePitchAccuracyButton() {
  const hasReference = Boolean(accompanimentFile || songPitchTrack.length);
  const hasVocal = Boolean(lastRecordingBlob);
  pitchAccuracyButton.disabled =
    !(hasReference && hasVocal) || offlineAnalysisInProgress || songPitchAnalysisInProgress;
  updateSongPracticeFlow();
}

function setPitchAccuracyResult(text, tone = 'neutral') {
  pitchAccuracyResult.textContent = text;
  if (tone === 'good') {
    pitchAccuracyResult.style.color = '#16a34a';
  } else if (tone === 'warn') {
    pitchAccuracyResult.style.color = '#b7791f';
  } else if (tone === 'bad') {
    pitchAccuracyResult.style.color = '#dc2626';
  } else {
    pitchAccuracyResult.style.color = '#1c1f2a';
  }
}

function setSongPitchStatus(text, tone = 'neutral') {
  if (!songPitchStatus) {
    return;
  }
  songPitchStatus.textContent = text;
  if (tone === 'good') {
    songPitchStatus.style.color = '#16a34a';
  } else if (tone === 'bad') {
    songPitchStatus.style.color = '#dc2626';
  } else {
    songPitchStatus.style.color = '#1c1f2a';
  }
}

function setSongPitchPlaybackStatus(text, tone = 'neutral') {
  if (!songPitchPlaybackStatus) {
    return;
  }
  songPitchPlaybackStatus.textContent = text;
  if (tone === 'good') {
    songPitchPlaybackStatus.style.color = '#16a34a';
  } else if (tone === 'bad') {
    songPitchPlaybackStatus.style.color = '#dc2626';
  } else {
    songPitchPlaybackStatus.style.color = '#1c1f2a';
  }
}

function updateSongPitchPlaybackButtons() {
  const hasAudio = Boolean(songPitchAudio);
  if (playSongPitchButton) {
    playSongPitchButton.disabled = !hasAudio || songPitchAnalysisInProgress;
  }
  if (pauseSongPitchButton) {
    pauseSongPitchButton.disabled = !hasAudio || songPitchAnalysisInProgress;
  }
  if (stopSongPitchButton) {
    stopSongPitchButton.disabled = !hasAudio || songPitchAnalysisInProgress;
  }
}

function stopSongPitchPlaybackProgress() {
  if (songPitchPlaybackRaf) {
    cancelAnimationFrame(songPitchPlaybackRaf);
    songPitchPlaybackRaf = null;
  }
}

function syncOfflineWindowToSongPlayback() {
  if (!songPitchAudio || !offlineMode) {
    return;
  }
  const playbackMs = songPitchAudio.currentTime * 1000;
  const durationMs = Number.isFinite(songPitchAudio.duration)
    ? songPitchAudio.duration * 1000
    : getOfflineTrackDurationMs();
  const desiredStart = playbackMs - offlineWindowDurationMs * 0.35;
  offlineWindowStartMs = clampOfflineWindowStart(desiredStart, durationMs);
  drawPitchHistory();
}

function updateSongPitchPlaybackProgress() {
  if (!songPitchAudio || songPitchAudio.paused) {
    stopSongPitchPlaybackProgress();
    return;
  }
  syncOfflineWindowToSongPlayback();
  setSongPitchPlaybackStatus(`播放中 ${formatTimeSeconds(songPitchAudio.currentTime * 1000)}`, 'good');
  songPitchPlaybackRaf = requestAnimationFrame(updateSongPitchPlaybackProgress);
}

function setSongTargetCollapsed(collapsed) {
  if (!songTargetContent || !songTargetCollapseButton) {
    return;
  }
  songTargetContent.hidden = collapsed;
  songTargetPanel?.classList.toggle('is-collapsed', collapsed);
  songTargetCollapseButton.setAttribute('aria-expanded', String(!collapsed));
  songTargetCollapseButton.textContent = collapsed ? '展开' : '收起';
  if (!collapsed && vocalScoreView === 'staff') {
    if (vocalScoreNotes.length) renderVocalScoreSheet();
    else drawVocalScorePlaceholder();
  } else if (!collapsed) {
    if (vocalScoreNotes.length) renderJianpuScoreSheet();
    else drawJianpuPlaceholder();
  }
}

function setPracticeStepState(step, state) {
  if (!step) {
    return;
  }
  step.classList.toggle('active', state === 'active');
  step.classList.toggle('done', state === 'done');
}

function getSongPracticeTitle() {
  const raw = songPitchFileName || songSeparationSourceFile?.name || accompanimentFile?.name || '';
  const clean = raw.replace(/\.[^.]+$/, '').trim();
  return clean || '还没有选择歌曲';
}

function getSongPracticeNextStep(review) {
  if (!review) {
    return '先完成一遍跟唱，系统会把结果收束成一个下一步动作。';
  }
  if (review.pitch.coverage < 35) {
    return '下一遍先唱满旋律：只练副歌或 20 秒片段，宁可小声，也要让有效音高连续出现。';
  }
  if (review.rhythm && review.rhythm.score < review.pitch.score - 8) {
    return '下一遍先贴拍点：开启节奏提取后只看起音是否进拍，不急着追音高细节。';
  }
  if (Math.abs(review.pitch.meanSignedError) > pitchScoreGoodToleranceCents) {
    return review.pitch.meanSignedError > 0
      ? '下一遍整体放低一点：开头先轻声找准目标，再逐句跟进。'
      : '下一遍整体抬高一点：先哼到目标线上方，再用歌词进入。';
  }
  if (review.pitch.p90AbsError > pitchScoreHitToleranceCents * 1.8) {
    return '下一遍练最飘的那一小段：从重点回听位置前 2 秒开始，连唱 3 次再整段来。';
  }
  if (review.combinedScore >= 78) {
    return '下一遍可以加难度：保留当前唱法，把音量或情绪推进一点，再看稳定度有没有掉。';
  }
  return '下一遍先稳住中间段：慢一点唱，优先让命中率超过 70%，再追综合分。';
}

function renderSongPracticeReview(review = songPracticeLastReview) {
  if (!songPracticeReviewPanel) {
    return;
  }
  const hasReview = Boolean(review);
  songPracticeReviewPanel.hidden = !hasReview;
  if (!hasReview) {
    if (songPracticeReviewTitle) songPracticeReviewTitle.textContent = '等待完成一遍跟唱';
    if (songPracticeReviewBadge) songPracticeReviewBadge.textContent = '等待';
    if (songPracticeReviewScore) songPracticeReviewScore.textContent = '--';
    if (songPracticeReviewPitch) songPracticeReviewPitch.textContent = '--';
    if (songPracticeReviewRhythm) songPracticeReviewRhythm.textContent = '--';
    if (songPracticeReviewCoverage) songPracticeReviewCoverage.textContent = '--';
    if (songPracticeReviewSummary) songPracticeReviewSummary.textContent = '跟唱结束后会在这里看到本轮结果。';
    if (songPracticeReviewNextStep) songPracticeReviewNextStep.textContent = '下一遍会给你一个明确动作。';
    if (songPracticeReplayButton) songPracticeReplayButton.disabled = !lastRecordingBlob;
    return;
  }

  const direction =
    Math.abs(review.pitch.meanSignedError) <= pitchScoreGoodToleranceCents
      ? '整体居中'
      : review.pitch.meanSignedError > 0
        ? '整体偏高'
        : '整体偏低';
  const worstSegmentText = review.pitch.worstSegment
    ? `重点回听 ${formatFrameTime(review.pitch.worstSegment.startIndex)}-${formatFrameTime(
        review.pitch.worstSegment.endIndex + 1
      )}`
    : '暂时没有明显问题段';
  const rhythmText = review.rhythm?.total
    ? `${review.rhythm.score}% / 命中 ${review.rhythm.hitRate}%`
    : '未记录';
  const tone = review.combinedScore >= 78 ? 'good' : review.combinedScore >= 58 ? 'warn' : 'bad';

  songPracticeReviewPanel.dataset.tone = tone;
  if (songPracticeReviewTitle) {
    songPracticeReviewTitle.textContent =
      review.combinedScore >= 78 ? '这一遍可以保留' : review.combinedScore >= 58 ? '接近了，修一个重点' : '先把基础贴回来';
  }
  if (songPracticeReviewBadge) {
    songPracticeReviewBadge.textContent = review.pitch.label;
  }
  if (songPracticeReviewScore) {
    songPracticeReviewScore.textContent = `${review.combinedScore}%`;
  }
  if (songPracticeReviewPitch) {
    songPracticeReviewPitch.textContent = `${review.pitch.score}%`;
  }
  if (songPracticeReviewRhythm) {
    songPracticeReviewRhythm.textContent = rhythmText;
  }
  if (songPracticeReviewCoverage) {
    songPracticeReviewCoverage.textContent = `${review.pitch.coverage}%`;
  }
  if (songPracticeReviewSummary) {
    songPracticeReviewSummary.textContent = `${direction}，平均偏差 ${review.pitch.meanAbsError.toFixed(
      1
    )} cents，命中 ${review.pitch.hitRate}%，${worstSegmentText}。`;
  }
  if (songPracticeReviewNextStep) {
    songPracticeReviewNextStep.textContent = getSongPracticeNextStep(review);
  }
  if (songPracticeReplayButton) {
    songPracticeReplayButton.disabled = !lastRecordingBlob;
  }
}

function updateSongPracticeFlow(status = null) {
  if (!songPracticeFlow) {
    return;
  }
  const hasSong = Boolean(songPitchAudio || songPitchTrack.length || songSeparationSourceFile);
  const hasTarget = Boolean(songPitchTrack.length);
  const isRecording = Boolean(mediaRecorder && mediaRecorder.state !== 'inactive');
  const hasRecording = Boolean(lastRecordingBlob);
  const hasReview = Boolean(songPracticeLastReview);
  const isBusy = offlineAnalysisInProgress || songPitchAnalysisInProgress;
  const canStart = hasTarget && !isBusy;
  const canReview = hasTarget && (hasRecording || isRecording) && !offlineAnalysisInProgress && !songPitchAnalysisInProgress;

  setPracticeStepState(songPracticeStepSong, hasSong ? 'done' : 'active');
  setPracticeStepState(songPracticeStepTarget, hasTarget ? 'done' : hasSong ? 'active' : null);
  setPracticeStepState(songPracticeStepRecord, isRecording ? 'active' : hasRecording ? 'done' : null);
  setPracticeStepState(songPracticeStepReview, hasReview ? 'done' : hasRecording && hasTarget ? 'active' : null);

  if (songPracticeSongTitle) {
    songPracticeSongTitle.textContent = getSongPracticeTitle();
  }
  if (songPracticeTargetStatus) {
    songPracticeTargetStatus.textContent = hasTarget
      ? '目标曲线：已生成'
      : songPitchAnalysisInProgress
        ? '目标曲线：生成中'
        : '目标曲线：未生成';
  }
  if (songPracticeAccompanimentStatus) {
    songPracticeAccompanimentStatus.textContent = songPitchAudio || accompanimentFile ? '伴奏：可用' : '伴奏：未选择';
  }
  if (songPracticeStartButton) {
    songPracticeStartButton.disabled = isRecording ? false : !canStart;
    songPracticeStartButton.textContent = isRecording
      ? '结束录音'
      : songPitchAnalysisInProgress
        ? '生成目标中...'
        : '开始跟唱';
  }
  if (songPracticeStopReviewButton) {
    songPracticeStopReviewButton.disabled = !canReview;
  }

  if (songPracticeFlowState) {
    if (status) {
      songPracticeFlowState.textContent = status;
    } else if (isRecording) {
      songPracticeFlowState.textContent = '跟唱录音中';
    } else if (hasReview) {
      songPracticeFlowState.textContent = '复盘完成';
    } else if (hasRecording && hasTarget) {
      songPracticeFlowState.textContent = '可评估';
    } else if (hasTarget) {
      songPracticeFlowState.textContent = '可以开始';
    } else if (hasSong || songPitchAnalysisInProgress) {
      songPracticeFlowState.textContent = '生成目标中';
    } else {
      songPracticeFlowState.textContent = '未选歌';
    }
  }

  if (songPracticeFlowHint) {
    if (isRecording) {
      songPracticeFlowHint.textContent = '正在录音。唱完后点击“结束录音”，系统会自动给出反馈。';
    } else if (hasReview) {
      songPracticeFlowHint.textContent = '这一遍已经完成，可以回放录音或再唱一遍。';
    } else if (hasRecording && hasTarget) {
      songPracticeFlowHint.textContent = '已经有一段录音，可以查看反馈，也可以重新唱。';
    } else if (hasTarget) {
      songPracticeFlowHint.textContent = '目标曲线已准备好，现在可以开始唱。';
    } else {
      songPracticeFlowHint.textContent = '选好歌曲后就可以开始唱。';
    }
  }
  if (trainingMode === 'curve') {
    setReadoutMode(displayMode);
    setCurveSwitcherMode(displayMode);
  }
  renderSongPracticeReview();
}

function prepareSongPitchPlayback(file) {
  stopSongPitchPlaybackProgress();
  if (songPitchAudio) {
    songPitchAudio.pause();
  }
  if (songPitchAudioUrl) {
    URL.revokeObjectURL(songPitchAudioUrl);
  }
  songPitchAudioUrl = URL.createObjectURL(file);
  songPitchAudio = new Audio(songPitchAudioUrl);
  songPitchAudio.addEventListener('ended', () => {
    stopSongPitchPlaybackProgress();
    setSongPitchPlaybackStatus('已播放完');
    updateSongPitchPlaybackButtons();
  });
  songPitchAudio.addEventListener('loadedmetadata', () => {
    setSongPitchPlaybackStatus(`已加载 ${formatTimeSeconds(songPitchAudio.duration * 1000)}`);
  });
  setSongPitchPlaybackStatus('已加载');
  updateSongPitchPlaybackButtons();
  updateSongPracticeFlow();
}

function clearSongPitchPlayback() {
  stopSongPitchPlaybackProgress();
  if (songPitchAudio) {
    songPitchAudio.pause();
    songPitchAudio = null;
  }
  if (songPitchAudioUrl) {
    URL.revokeObjectURL(songPitchAudioUrl);
    songPitchAudioUrl = null;
  }
  setSongPitchPlaybackStatus('未加载');
  updateSongPitchPlaybackButtons();
  updateSongPracticeFlow();
}

function setSongTrainingResult(text, tone = 'neutral') {
  if (!songTrainingResult) {
    return;
  }
  songTrainingResult.textContent = text;
  if (tone === 'good') {
    songTrainingResult.style.color = '#16a34a';
  } else if (tone === 'warn') {
    songTrainingResult.style.color = '#b7791f';
  } else if (tone === 'bad') {
    songTrainingResult.style.color = '#dc2626';
  } else {
    songTrainingResult.style.color = '#1c1f2a';
  }
}

function formatFrameTime(frameIndex) {
  return formatTimeSeconds(frameIndex * offlineHopDurationMs);
}

function findWorstPitchSegment(samples) {
  const problemSamples = samples.filter(
    (sample) => sample.absCents > pitchScoreHitToleranceCents
  );
  if (!problemSamples.length) {
    return null;
  }

  const segments = [];
  let current = null;
  problemSamples.forEach((sample) => {
    if (!current || sample.index - current.endIndex > 1) {
      current = {
        startIndex: sample.index,
        endIndex: sample.index,
        errors: [sample.absCents],
      };
      segments.push(current);
      return;
    }
    current.endIndex = sample.index;
    current.errors.push(sample.absCents);
  });

  return segments
    .map((segment) => ({
      ...segment,
      meanError: mean(segment.errors),
      peakError: Math.max(...segment.errors),
      durationMs: (segment.endIndex - segment.startIndex + 1) * offlineHopDurationMs,
    }))
    .sort((a, b) => b.meanError * b.durationMs - a.meanError * a.durationMs)[0];
}

function evaluatePitchAccuracy(referenceTrack, vocalTrack) {
  const compareLength = Math.min(referenceTrack.length, vocalTrack.length);
  const samples = [];
  let referenceVoicedFrames = 0;
  let vocalVoicedFrames = 0;

  for (let i = 0; i < compareLength; i += 1) {
    const ref = referenceTrack[i];
    const vocal = vocalTrack[i];
    if (ref) {
      referenceVoicedFrames += 1;
    }
    if (vocal) {
      vocalVoicedFrames += 1;
    }
    if (!ref || !vocal) {
      continue;
    }
    const cents = frequencyToCentsError(vocal, ref);
    if (!Number.isFinite(cents)) {
      continue;
    }
    samples.push({
      index: i,
      cents,
      absCents: Math.abs(cents),
      ref,
      vocal,
    });
  }

  if (!samples.length) {
    return null;
  }

  const absErrors = samples.map((sample) => sample.absCents);
  const meanAbsError = mean(absErrors);
  const meanSignedError = mean(samples.map((sample) => sample.cents));
  const hitRate = Math.round(
    (samples.filter((sample) => sample.absCents <= pitchScoreHitToleranceCents).length /
      samples.length) *
      100
  );
  const goodRate = Math.round(
    (samples.filter((sample) => sample.absCents <= pitchScoreGoodToleranceCents).length /
      samples.length) *
      100
  );
  const coverage = Math.round((samples.length / Math.max(referenceVoicedFrames, 1)) * 100);
  const vocalCoverage = Math.round((vocalVoicedFrames / Math.max(compareLength, 1)) * 100);
  const p90AbsError = percentile(absErrors, 0.9);
  const worstSegment = findWorstPitchSegment(samples);
  const score = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        (100 - Math.min(100, (meanAbsError / pitchScoreMaxUsefulCents) * 100)) * 0.4 +
          hitRate * 0.35 +
          coverage * 0.15 +
          goodRate * 0.1
      )
    )
  );
  const label =
    score >= 78 && hitRate >= 70 && coverage >= 45
      ? '音准可信'
      : score >= 58 && coverage >= 30
        ? '接近目标'
        : '需要修正';
  const tone = label === '音准可信' ? 'good' : label === '接近目标' ? 'warn' : 'bad';

  return {
    score,
    label,
    tone,
    meanAbsError,
    meanSignedError,
    p90AbsError,
    hitRate,
    goodRate,
    coverage,
    vocalCoverage,
    sampleCount: samples.length,
    worstSegment,
  };
}

async function runPitchAccuracyAnalysis() {
  if (!(accompanimentFile || songPitchTrack.length) || !lastRecordingBlob || offlineAnalysisInProgress) {
    return;
  }

  pitchAccuracyButton.disabled = true;
  setPitchAccuracyResult('分析中...');
  songPracticeLastReview = null;
  renderSongPracticeReview();
  let vocalBuffer;
  try {
    vocalBuffer = await decodeAudioBlob(lastRecordingBlob);
  } catch (error) {
    console.error(error);
    setPitchAccuracyResult('解码失败');
    updatePitchAccuracyButton();
    updateSongPracticeFlow();
    return;
  }

  let referenceTrack = null;
  if (songPitchTrack.length) {
    referenceTrack = songPitchTrack.map((point) => point.pitch);
  } else {
    try {
      const referenceBuffer = await decodeAudioFile(accompanimentFile);
      referenceTrack = extractPitchTrack(referenceBuffer);
    } catch (error) {
      console.error(error);
      setPitchAccuracyResult('解码失败');
      updatePitchAccuracyButton();
      updateSongPracticeFlow();
      return;
    }
  }
  const vocalTrack = extractPitchTrack(vocalBuffer);
  const result = evaluatePitchAccuracy(referenceTrack, vocalTrack);

  if (!result) {
    setPitchAccuracyResult('有效音高不足');
    songPracticeLastReview = null;
    updatePitchAccuracyButton();
    updateSongPracticeFlow();
    return;
  }

  const direction =
    Math.abs(result.meanSignedError) <= pitchScoreGoodToleranceCents
      ? '整体居中'
      : result.meanSignedError > 0
        ? '整体偏高'
        : '整体偏低';
  const worstSegmentText = result.worstSegment
    ? `，重点回听 ${formatFrameTime(result.worstSegment.startIndex)}-${formatFrameTime(
        result.worstSegment.endIndex + 1
      )}`
    : '';
  const rhythmStats = shouldUseSongRhythm() ? getRhythmStats() : null;
  const combinedScore = rhythmStats?.total
    ? Math.round(result.score * 0.62 + rhythmStats.score * 0.38)
    : result.score;
  const rhythmResultText = rhythmStats?.total
    ? ` · 节奏 ${rhythmStats.score}% · 节奏命中 ${rhythmStats.hitRate}%`
    : '';
  songPracticeLastReview = {
    combinedScore,
    pitch: result,
    rhythm: rhythmStats,
  };

  setPitchAccuracyResult(
    `${result.label} 综合 ${combinedScore}% · 音准 ${result.score}% · 命中 ${result.hitRate}%${rhythmResultText} · P90 ${result.p90AbsError.toFixed(
      1
    )} cents · 覆盖 ${result.coverage}%${worstSegmentText}`,
    result.tone
  );
  setSongTrainingResult(
    songPitchTrack.length
      ? `综合 ${combinedScore}% · 音准 ${result.score}% · ${
          rhythmStats?.total ? `节奏 ${rhythmStats.score}%` : '节奏未记录'
        }`
      : '--',
    combinedScore >= 78 ? 'good' : combinedScore >= 58 ? 'warn' : 'bad'
  );
  if (songPitchTrack.length) {
    setTrainingFeedback(
      combinedScore >= 78 ? '这一遍整体不错' : rhythmStats?.total && rhythmStats.score < result.score ? '节奏需要再贴拍点' : direction,
      `${direction}。音准 ${result.score}%，平均偏差 ${result.meanAbsError.toFixed(1)} cents${
        rhythmStats?.total ? `；节奏 ${rhythmStats.score}%，命中 ${rhythmStats.hitRate}%` : ''
      }。下一遍优先修正分数较低的一项。`,
      '评估',
      combinedScore >= 78 ? 'good' : 'warn'
    );
  }
  updatePitchAccuracyButton();
  renderSongPracticeReview(songPracticeLastReview);
  updateSongPracticeFlow('评估完成');
}

async function playSongPitchReference() {
  if (!songPitchAudio) {
    return false;
  }
  try {
    if (accompanimentAudio && !accompanimentAudio.paused) {
      accompanimentAudio.pause();
      setAccompanimentStatus('已暂停');
    }
    songPitchAudio.currentTime = 0;
    await songPitchAudio.play();
    syncOfflineWindowToSongPlayback();
    stopSongPitchPlaybackProgress();
    updateSongPitchPlaybackProgress();
    return true;
  } catch (error) {
    console.error(error);
    setSongPitchPlaybackStatus('无法播放', 'bad');
    return false;
  }
}

async function startSongPracticeFlow() {
  if (!songPitchTrack.length) {
    showLibraryPage('recordings');
    updateSongPracticeFlow('请先准备歌曲');
    return;
  }
  setSongTargetCollapsed(false);
  songPracticeLastReview = null;
  renderSongPracticeReview();
  const recordingStarted = await startVoiceRecording();
  if (recordingStarted) {
    const playbackStarted = await playSongPitchReference();
    if (shouldUseSongRhythm()) {
      syncRhythmToSongPractice(performance.now());
    }
    setSongTrainingResult('正在跟唱，结束后会自动评估。');
    updateSongPracticeFlow(playbackStarted ? '跟唱录音中' : '录音中');
  }
}

function stopSongPracticeAndReview() {
  if (songPitchAudio && !songPitchAudio.paused) {
    songPitchAudio.pause();
    stopSongPitchPlaybackProgress();
    setSongPitchPlaybackStatus(`已暂停 ${formatTimeSeconds(songPitchAudio.currentTime * 1000)}`);
  }
  stopVoiceRecording({ reviewAfterStop: true });
}

