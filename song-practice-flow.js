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

function getSongPracticeDirection(review) {
  const signedError = review?.pitch?.meanSignedError || 0;
  if (Math.abs(signedError) <= pitchScoreGoodToleranceCents) {
    return '整体居中';
  }
  return signedError > 0 ? '整体偏高' : '整体偏低';
}

function formatSongPracticeSegment(segment, leadSeconds = 0) {
  if (!segment) {
    return '这一遍没有明显问题段';
  }
  const startMs = Math.max(0, segment.startIndex * offlineHopDurationMs - leadSeconds * 1000);
  const endMs = (segment.endIndex + 1) * offlineHopDurationMs;
  return `${formatTimeSeconds(startMs)}-${formatTimeSeconds(endMs)}`;
}

function getSongPracticeRhythmDirection(rhythm) {
  if (!rhythm?.total || !Number.isFinite(rhythm.meanSignedOffset)) {
    return '拍点不够稳定';
  }
  if (rhythm.meanSignedOffset < -12) {
    return `平均抢拍 ${Math.round(Math.abs(rhythm.meanSignedOffset))} ms`;
  }
  if (rhythm.meanSignedOffset > 12) {
    return `平均拖拍 ${Math.round(rhythm.meanSignedOffset)} ms`;
  }
  return `平均偏离 ${Math.round(rhythm.meanOffset)} ms`;
}

function buildSongPracticeCoachAdvice(review) {
  if (!review) {
    return {
      title: '等待完成一遍跟唱',
      badge: '等待',
      summary: '跟唱结束后会在这里看到本轮结果。',
      nextStep: '先完成一遍跟唱，系统会把结果收束成一个下一步动作。',
      tone: 'neutral',
    };
  }

  const direction = getSongPracticeDirection(review);
  const segmentText = formatSongPracticeSegment(review.pitch.worstSegment);
  const drillSegmentText = formatSongPracticeSegment(review.pitch.worstSegment, 2);
  const rhythmText = review.rhythm?.total
    ? `节奏 ${review.rhythm.score}%，${getSongPracticeRhythmDirection(review.rhythm)}`
    : '节奏未记录';
  const evidence = `${direction}，平均偏差 ${review.pitch.meanAbsError.toFixed(1)} cents，命中 ${review.pitch.hitRate}%，覆盖 ${review.pitch.coverage}%。`;

  if (review.pitch.coverage < 35) {
    return {
      title: '先让旋律连起来',
      badge: '覆盖不足',
      summary: `这遍有效音高只覆盖 ${review.pitch.coverage}%，系统能比较的旋律太少。`,
      nextStep: '下一遍只唱 20 秒，宁可小声也要连续发声；先别追细节，目标是让曲线不断线。',
      tone: 'bad',
    };
  }

  if (review.rhythm?.total && (review.rhythm.score < review.pitch.score - 8 || review.rhythm.score < 62)) {
    return {
      title: '先把起音贴回拍点',
      badge: '节奏优先',
      summary: `${evidence}${rhythmText}，所以这一遍先别急着修音高细节。`,
      nextStep: '下一遍只盯第一拍和句头：用轻一点的 da 进声，每句开头先进拍，再看音准。',
      tone: review.combinedScore >= 58 ? 'warn' : 'bad',
    };
  }

  if (Math.abs(review.pitch.meanSignedError) > pitchScoreGoodToleranceCents) {
    const isHigh = review.pitch.meanSignedError > 0;
    return {
      title: isHigh ? '整段有点压高了' : '整段落在目标下方',
      badge: isHigh ? '整体偏高' : '整体偏低',
      summary: `${evidence}重点不是某一个音，而是整段重心${isHigh ? '偏高' : '偏低'}。`,
      nextStep: isHigh
        ? '下一遍开头先轻声找准目标线，再逐句唱；感觉音准够了以后再加音量。'
        : '下一遍先哼到目标线上方一点，再带歌词进入；别一开始就把声音压暗。',
      tone: review.combinedScore >= 58 ? 'warn' : 'bad',
    };
  }

  if (review.pitch.p90AbsError > pitchScoreHitToleranceCents * 1.8) {
    return {
      title: '问题集中在一小段',
      badge: '片段练习',
      summary: `${evidence}最需要回听的是 ${segmentText}，P90 偏差 ${review.pitch.p90AbsError.toFixed(1)} cents。`,
      nextStep: `下一遍只练 ${drillSegmentText}：连唱 3 次，第三次稳定后再回到整段。`,
      tone: review.combinedScore >= 58 ? 'warn' : 'bad',
    };
  }

  if (review.combinedScore >= 78) {
    return {
      title: '这一遍可以保留',
      badge: '可加难度',
      summary: `${evidence}${review.rhythm?.total ? rhythmText + '。' : ''}这一遍的唱法基本可信。`,
      nextStep: '下一遍保留当前唱法，把情绪或音量推进一点；如果分数明显掉，就退回这遍的力度。',
      tone: 'good',
    };
  }

  return {
    title: '先稳住中间段',
    badge: '稳定度',
    summary: `${evidence}${review.rhythm?.total ? rhythmText + '。' : ''}`,
    nextStep: '下一遍慢一点唱，优先让命中率超过 70%；先稳住中间段，再追综合分。',
    tone: 'warn',
  };
}

function getSongPracticeNextStep(review) {
  return buildSongPracticeCoachAdvice(review).nextStep;
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

  const coach = buildSongPracticeCoachAdvice(review);
  const rhythmText = review.rhythm?.total
    ? `${review.rhythm.score}% / 命中 ${review.rhythm.hitRate}%`
    : '未记录';
  const tone = coach.tone || (review.combinedScore >= 78 ? 'good' : review.combinedScore >= 58 ? 'warn' : 'bad');

  songPracticeReviewPanel.dataset.tone = tone;
  if (songPracticeReviewTitle) {
    songPracticeReviewTitle.textContent = coach.title;
  }
  if (songPracticeReviewBadge) {
    songPracticeReviewBadge.textContent = coach.badge || review.pitch.label;
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
    songPracticeReviewSummary.textContent = coach.summary;
  }
  if (songPracticeReviewNextStep) {
    songPracticeReviewNextStep.textContent = coach.nextStep;
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
      ? '结束并评估'
      : songPitchAnalysisInProgress
        ? '正在生成目标...'
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
      songPracticeFlowState.textContent = '先选歌';
    }
  }

  if (songPracticeFlowHint) {
    if (isRecording) {
      songPracticeFlowHint.textContent = '正在录音。唱完这一遍后点击“结束并评估”，系统会自动生成复盘。';
    } else if (hasReview) {
      songPracticeFlowHint.textContent = '这一遍已经完成，先回放重点片段，再按下一步动作重唱。';
    } else if (hasRecording && hasTarget) {
      songPracticeFlowHint.textContent = '已经有一段录音，可以评估这一遍，也可以重新唱。';
    } else if (hasTarget) {
      songPracticeFlowHint.textContent = '目标曲线已准备好。戴上耳机，点“开始跟唱”，唱完整一遍。';
    } else if (songPitchAnalysisInProgress) {
      songPracticeFlowHint.textContent = '正在从歌曲里提取目标曲线，完成后就能开始跟唱。';
    } else if (hasSong) {
      songPracticeFlowHint.textContent = '歌曲已载入，等待目标曲线生成完成。';
    } else {
      songPracticeFlowHint.textContent = '先点“选择歌曲”，上传本地音频或从录音库选择已有歌曲。';
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
  const coach = buildSongPracticeCoachAdvice(songPracticeLastReview);

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
      coach.title,
      `${coach.summary} ${coach.nextStep}`,
      coach.badge || '评估',
      coach.tone === 'bad' ? 'warn' : coach.tone
    );
  }
  updatePitchAccuracyButton();
  renderSongPracticeReview(songPracticeLastReview);
  if (typeof recordGameReward === 'function') {
    recordGameReward({
      mode: 'song',
      score: combinedScore,
      totalScore: combinedScore,
      pitchScore: result.score,
      rhythmScore: rhythmStats?.total ? rhythmStats.score : undefined,
      targetSong: getSongPracticeTitle(),
      summary: `音准 ${result.score}%，命中 ${result.hitRate}%`,
    });
  }
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
  if (typeof hideGameReward === 'function') {
    hideGameReward();
  }
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

