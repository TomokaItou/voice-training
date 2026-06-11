// Vocal range training state, results, and history.

function formatRangePitch(pitch) {
  if (!Number.isFinite(pitch)) {
    return '--';
  }
  return `${frequencyToNote(pitch)} · ${Math.round(pitch)} Hz`;
}

function getSemitoneSpan(lowPitch, highPitch) {
  if (!Number.isFinite(lowPitch) || !Number.isFinite(highPitch) || lowPitch <= 0 || highPitch <= lowPitch) {
    return 0;
  }
  return 12 * Math.log2(highPitch / lowPitch);
}

function formatRangeSpan(semitones) {
  if (!Number.isFinite(semitones) || semitones <= 0) {
    return '--';
  }
  const octaves = Math.floor(semitones / 12);
  const remainder = Math.round(semitones - octaves * 12);
  if (octaves <= 0) {
    return `${remainder} 半音`;
  }
  if (remainder === 0) {
    return `${octaves} 八度`;
  }
  return `${octaves} 八度 ${remainder} 半音`;
}

function resetRangeTraining() {
  rangeSamples = [];
  rangeLastPitch = null;
  rangeTrainingPhase = 'ready';
  rangeHistoryExpanded = false;
  updateRangeDisplay();
  drawPitchHistory();
}

function computeRangeStats() {
  const pitches = rangeSamples.map((sample) => sample.pitch).filter(Number.isFinite);
  if (!pitches.length) {
    return null;
  }

  const sorted = [...pitches].sort((a, b) => a - b);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const comfortLow = percentile(sorted, 0.15);
  const comfortHigh = percentile(sorted, 0.85);
  const recent = rangeSamples.slice(-Math.min(rangeSamples.length, 18));
  const recentPitches = recent.map((sample) => sample.pitch).filter(Number.isFinite);
  const recentMedian = percentile(recentPitches, 0.5);
  const recentErrors = recentPitches.map((pitch) => Math.abs(getPitchDistanceCents(pitch, recentMedian)));
  const p90Jitter = percentile(recentErrors, 0.9);
  const stability = Math.max(0, Math.min(100, Math.round(100 - normalizeRange(p90Jitter, 12, 90) * 100)));

  return {
    lowest,
    highest,
    comfortLow,
    comfortHigh,
    spanSemitones: getSemitoneSpan(lowest, highest),
    comfortSpanSemitones: getSemitoneSpan(comfortLow, comfortHigh),
    stability,
    sampleCount: pitches.length,
  };
}

function createRangeRecord(stats = computeRangeStats()) {
  if (!stats || stats.sampleCount < 6) {
    return null;
  }

  return {
    id: `${Date.now()}-${Math.round(stats.lowest)}-${Math.round(stats.highest)}`,
    createdAt: new Date().toISOString(),
    lowest: Math.round(stats.lowest * 10) / 10,
    highest: Math.round(stats.highest * 10) / 10,
    comfortLow: Math.round(stats.comfortLow * 10) / 10,
    comfortHigh: Math.round(stats.comfortHigh * 10) / 10,
    spanSemitones: Math.round(stats.spanSemitones * 10) / 10,
    comfortSpanSemitones: Math.round(stats.comfortSpanSemitones * 10) / 10,
    stability: stats.stability,
    sampleCount: stats.sampleCount,
  };
}

function getRangeResultFeedback(stats = computeRangeStats()) {
  if (!stats || stats.sampleCount < 6) {
    return '这次有效采样还不够。下次先用轻松的声音慢慢滑音，让系统听到完整的低音到高音路径。';
  }
  const comfortText = `${formatRangePitch(stats.comfortLow)} - ${formatRangePitch(stats.comfortHigh)}`;
  if (stats.stability < 55) {
    return `你的音域已经展开到 ${formatRangeSpan(stats.spanSemitones)}，但稳定度偏低。下次先放慢滑音速度，在舒适区 ${comfortText} 附近保持轻声。`;
  }
  return `你的最高音可以到 ${formatRangePitch(stats.highest)}，稳定区主要集中在 ${comfortText}。下次可以在高音边缘轻声滑音，不要直接用力顶上去。`;
}

function updateRangeTrack(stats = computeRangeStats()) {
  if (!rangeTrackPanel) {
    return;
  }
  const current = Number.isFinite(rangeLastPitch) ? rangeLastPitch : null;
  const low = stats?.lowest ?? current;
  const high = stats?.highest ?? current;
  const span = Number.isFinite(low) && Number.isFinite(high) && high > low ? high - low : 1;
  const currentPercent =
    current && Number.isFinite(low) && Number.isFinite(high)
      ? Math.max(0, Math.min(100, ((current - low) / span) * 100))
      : 50;
  const fillStart = stats ? 0 : currentPercent;
  const fillEnd = stats ? 100 : currentPercent;

  if (rangeTrackLowValue) rangeTrackLowValue.textContent = `最低音 ${formatRangePitch(stats?.lowest)}`;
  if (rangeTrackCurrentValue) rangeTrackCurrentValue.textContent = `当前音 ${formatRangePitch(current)}`;
  if (rangeTrackHighValue) rangeTrackHighValue.textContent = `最高音 ${formatRangePitch(stats?.highest)}`;
  if (rangeTrackFill) {
    rangeTrackFill.style.left = `${fillStart}%`;
    rangeTrackFill.style.width = `${Math.max(0, fillEnd - fillStart)}%`;
  }
  if (rangeTrackCurrent) {
    rangeTrackCurrent.style.left = `${currentPercent}%`;
  }
}

function setRangeTrainingPhase(phase) {
  rangeTrainingPhase = phase;
  const isRange = trainingMode === 'range';
  const isReady = phase === 'ready';
  const isTesting = phase === 'testing';
  const isComplete = phase === 'complete';
  const stats = computeRangeStats();

  if (rangeDashboard) {
    rangeDashboard.hidden = !isRange;
    rangeDashboard.dataset.phase = phase;
  }
  if (rangeStageLabel) {
    rangeStageLabel.textContent = isTesting ? '正在测试音域' : isComplete ? '本次音域结果' : '音域训练模式';
  }
  if (rangeSpanValue) {
    rangeSpanValue.textContent = isTesting
      ? formatRangePitch(rangeLastPitch)
      : isComplete && stats
        ? formatRangeSpan(stats.spanSemitones)
        : '从舒服的音开始';
  }
  if (rangeCaption) {
    rangeCaption.textContent = isTesting
      ? '请从舒适音区慢慢向上滑，再回到中间音区。'
      : isComplete
        ? getRangeCaption(stats)
        : '从舒服的音开始，慢慢滑到最高音，再回到舒适音区。';
  }
  if (rangeTrackPanel) {
    rangeTrackPanel.hidden = isReady;
  }
  if (rangeFeedback) {
    rangeFeedback.hidden = !isComplete;
    rangeFeedback.textContent = getRangeResultFeedback(stats);
  }
  if (rangeSaveButton) {
    rangeSaveButton.hidden = !isComplete;
    rangeSaveButton.disabled = !stats || stats.sampleCount < 6;
  }
  if (rangeResetButton) {
    rangeResetButton.hidden = !isComplete;
  }
  if (rangeHistoryToggleButton) {
    rangeHistoryToggleButton.hidden = !isComplete;
    rangeHistoryToggleButton.textContent = rangeHistoryExpanded ? '收起历史' : '查看历史';
  }
  if (rangeHistoryPanel) {
    rangeHistoryPanel.hidden = !isRange || !isComplete || !rangeHistoryExpanded;
  }
  const practiceControls = document.getElementById('practiceControls');
  if (practiceControls && isRange) {
    practiceControls.hidden = false;
    practiceControls.classList.add('range-controls');
    practiceControls.classList.remove('score-controls', 'breath-controls');
  }
  if (startButton && isRange) {
    startButton.hidden = false;
    startButton.disabled = false;
    startButton.textContent = isTesting ? '结束测试' : isComplete ? '重新测试' : '开始测试';
  }
  if (pauseButton && isRange) {
    pauseButton.hidden = true;
  }
  if (stopButton && isRange) {
    stopButton.hidden = true;
  }
  if (statusEl && isRange) {
    statusEl.hidden = true;
  }
  updateRangeTrack(stats);
}

function loadRangeHistory() {
  try {
    const raw = window.localStorage?.getItem(rangeHistoryStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    rangeHistoryRecords = Array.isArray(parsed)
      ? parsed.filter((record) => record && Number.isFinite(record.spanSemitones))
      : [];
  } catch (error) {
    console.warn('Failed to load range history', error);
    rangeHistoryRecords = [];
  }
}

function persistRangeHistory() {
  try {
    window.localStorage?.setItem(
      rangeHistoryStorageKey,
      JSON.stringify(rangeHistoryRecords.slice(0, rangeHistoryMaxRecords))
    );
  } catch (error) {
    console.warn('Failed to save range history', error);
  }
}

function formatRangeDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '未知时间';
  }
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRangeTrendText(record, previousRecord) {
  if (!previousRecord) {
    return '首次记录';
  }
  const delta = record.spanSemitones - previousRecord.spanSemitones;
  if (Math.abs(delta) < 0.5) {
    return '跨度持平';
  }
  return delta > 0 ? `+${delta.toFixed(1)} 半音` : `${delta.toFixed(1)} 半音`;
}

function renderRangeHistory() {
  if (!rangeHistoryPanel || !rangeHistorySummary || !rangeHistoryList) {
    return;
  }

  rangeHistoryList.innerHTML = '';
  if (rangeClearHistoryButton) {
    rangeClearHistoryButton.disabled = rangeHistoryRecords.length === 0;
  }

  if (!rangeHistoryRecords.length) {
    rangeHistorySummary.textContent = '还没有保存记录';
    const item = document.createElement('li');
    item.className = 'range-history-empty';
    item.textContent = '保存一次测量后，这里会显示最近的音域趋势。';
    rangeHistoryList.appendChild(item);
    return;
  }

  const latest = rangeHistoryRecords[0];
  const previous = rangeHistoryRecords[1] || null;
  rangeHistorySummary.textContent = `最近 ${rangeHistoryRecords.length} 次，最新跨度 ${formatRangeSpan(
    latest.spanSemitones
  )}，${getRangeTrendText(latest, previous)}`;

  rangeHistoryRecords.slice(0, 8).forEach((record, index) => {
    const previousRecord = rangeHistoryRecords[index + 1] || null;
    const item = document.createElement('li');
    item.className = 'range-history-item';

    const title = document.createElement('div');
    title.className = 'range-history-title';
    title.textContent = `${formatRangeDate(record.createdAt)} · ${formatRangeSpan(record.spanSemitones)}`;

    const meta = document.createElement('div');
    meta.className = 'range-history-meta';
    meta.textContent = `${formatRangePitch(record.lowest)} 到 ${formatRangePitch(
      record.highest
    )} · 舒适区 ${formatRangePitch(record.comfortLow)} - ${formatRangePitch(
      record.comfortHigh
    )} · 稳定度 ${record.stability}%`;

    const trend = document.createElement('span');
    trend.className = 'range-history-trend';
    trend.textContent = getRangeTrendText(record, previousRecord);

    item.append(title, meta, trend);
    rangeHistoryList.appendChild(item);
  });
}

function saveRangeTrainingResult() {
  const record = createRangeRecord();
  if (!record) {
    if (rangeCaption) {
      rangeCaption.textContent = '有效采样还不够，先完成一段低到高的稳定滑音。';
    }
    return;
  }

  rangeHistoryRecords = [record, ...rangeHistoryRecords].slice(0, rangeHistoryMaxRecords);
  persistRangeHistory();
  renderRangeHistory();
  if (rangeCaption) {
    rangeCaption.textContent = `已保存 ${formatRangeDate(record.createdAt)} 的音域结果。`;
  }
}

function clearRangeHistory() {
  rangeHistoryRecords = [];
  persistRangeHistory();
  renderRangeHistory();
}

function getRangeCaption(stats) {
  if (!stats || stats.sampleCount < 6) {
    return '从舒适低音慢慢滑到高音，保持每个位置 1-2 秒。';
  }
  if (stats.spanSemitones < 7) {
    return '目前跨度偏窄，可以继续向低音和高音两端探索。';
  }
  if (stats.stability < 55) {
    return '音域已开始展开，但稳定度偏低，先放慢滑音速度。';
  }
  if (stats.comfortSpanSemitones >= 12) {
    return '已经形成可用舒适区，可以记录这段作为今天的练习范围。';
  }
  return '两端已记录，继续在中声区和换声附近做稳定保持。';
}

function updateRangeDisplay() {
  if (!rangeDashboard) {
    return;
  }

  const stats = computeRangeStats();
  if (rangeCurrentValue) {
    rangeCurrentValue.textContent = formatRangePitch(rangeLastPitch);
  }

  if (!stats) {
    rangeSpanValue.textContent = '--';
    rangeCaption.textContent = '点击开始检测后，从舒适低音滑到高音，再回到中声区。';
    rangeLowestValue.textContent = '--';
    rangeHighestValue.textContent = '--';
    rangeComfortValue.textContent = '--';
    rangeStabilityValue.textContent = '--%';
    rangeSampleValue.textContent = '0';
    rangeDashboard.dataset.tone = 'neutral';
    if (rangeSaveButton) {
      rangeSaveButton.disabled = true;
    }
    if (trainingMode === 'range') {
      setDefaultTrainingFeedback('range');
      setRangeTrainingPhase(rangeTrainingPhase);
    }
    return;
  }

  rangeSpanValue.textContent = formatRangeSpan(stats.spanSemitones);
  rangeCaption.textContent = getRangeCaption(stats);
  rangeLowestValue.textContent = formatRangePitch(stats.lowest);
  rangeHighestValue.textContent = formatRangePitch(stats.highest);
  rangeComfortValue.textContent =
    stats.sampleCount >= 6
      ? `${formatRangePitch(stats.comfortLow)} - ${formatRangePitch(stats.comfortHigh)}`
      : '--';
  rangeStabilityValue.textContent = `${stats.stability}%`;
  rangeSampleValue.textContent = String(stats.sampleCount);
  if (rangeSaveButton) {
    rangeSaveButton.disabled = stats.sampleCount < 6;
  }
  rangeDashboard.dataset.tone =
    stats.sampleCount >= 10 && stats.stability >= 70
      ? 'good'
      : stats.sampleCount >= 6
        ? 'active'
        : 'neutral';
  if (trainingMode === 'range') {
    if (stats.sampleCount < 6) {
      setTrainingFeedback('再多唱几秒', `已经采到 ${stats.sampleCount} 个有效点。继续从低到高慢慢滑，让系统先看清你的范围。`, '音域');
    } else if (stats.stability < 55) {
      setTrainingFeedback('跨度有了，先放慢', `目前跨度 ${formatRangeSpan(stats.spanSemitones)}，但稳定度 ${stats.stability}%。下一遍慢一点滑，少冲高音。`, '音域', 'warn');
    } else {
      setTrainingFeedback('可以保存这次音域', `稳定度 ${stats.stability}%，舒适区约 ${formatRangePitch(stats.comfortLow)} 到 ${formatRangePitch(stats.comfortHigh)}。`, '音域', 'good');
    }
  }
  if (trainingMode === 'range') {
    setRangeTrainingPhase(rangeTrainingPhase);
  }
  if (trainingMode === 'memory') {
    setMemoryTrainingPhase(memoryTrainingPhase);
  }
  if (trainingMode === 'action') {
    setS88TrainingPhase();
  }
}

function updateRangeTraining(now = performance.now(), pitch = currentPitch) {
  if (trainingMode !== 'range') {
    return;
  }

  if (!Number.isFinite(pitch)) {
    rangeLastPitch = null;
    updateRangeDisplay();
    return;
  }

  rangeLastPitch = pitch;
  const lastSample = rangeSamples[rangeSamples.length - 1];
  if (!lastSample || now - lastSample.time >= displayUpdateIntervalMs) {
    rangeSamples.push({ time: now, pitch });
    if (rangeSamples.length > 600) {
      rangeSamples.shift();
    }
  }
  updateRangeDisplay();
}
