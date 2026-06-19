const SUCCESS_LIBRARY_LIMIT = 80;
const SUCCESS_LIBRARY_IMPROVEMENT_MARGIN = 2;

function clampSuccessScore(value) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function averageSuccessMetric(frames, key) {
  const values = (frames || []).map((frame) => frame?.[key]).filter(Number.isFinite);
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getSuccessStd(values) {
  const source = values.filter(Number.isFinite);
  if (source.length < 2) {
    return 0;
  }
  const mean = source.reduce((sum, value) => sum + value, 0) / source.length;
  return Math.sqrt(source.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / source.length);
}

function getSuccessRecordingFrames(recording) {
  return Array.isArray(recording?.frames) ? recording.frames : [];
}

function computeSuccessMetricsFromFrames(frames = []) {
  const activeFrames = frames.filter((frame) => Number.isFinite(frame?.rms) && frame.rms > 0.01);
  const source = activeFrames.length >= 4 ? activeFrames : frames;
  const pitches = source.map((frame) => frame.pitch).filter((pitch) => Number.isFinite(pitch) && pitch > 0);
  const rmsValues = source.map((frame) => frame.rms).filter(Number.isFinite);
  const highFrequencyRatio = averageSuccessMetric(source, 'highFrequencyRatio');
  const zcr = averageSuccessMetric(source, 'zcr');
  const spectralFlatness = averageSuccessMetric(source, 'spectralFlatness');
  const waveformRoughness = averageSuccessMetric(source, 'waveformRoughness');
  const rmsMean = rmsValues.length ? rmsValues.reduce((sum, value) => sum + value, 0) / rmsValues.length : 0;
  const rmsStability = 1 - Math.min(1, getSuccessStd(rmsValues) / Math.max(0.001, rmsMean * 1.8));
  const pitchStability = pitches.length >= 4
    ? 1 - Math.min(1, getSuccessStd(pitches) / Math.max(1, (pitches.reduce((sum, value) => sum + value, 0) / pitches.length) * 0.06))
    : rmsStability * 0.75;
  const breathinessRaw = Math.min(1, highFrequencyRatio * 2.8 + zcr * 1.7 + spectralFlatness * 0.62 + (1 - rmsStability) * 0.22);
  const closureRaw = Math.min(
    1,
    Math.max(
      waveformRoughness * 0.92 + Math.max(0, rmsMean - 0.055) * 5.2 + Math.max(0, 0.18 - zcr) * 1.45,
      Math.max(0, 0.04 - rmsMean) * 7.5 + Math.max(0, waveformRoughness - 0.42) * 0.35 + (1 - rmsStability) * 0.18
    )
  );
  const stability = clampSuccessScore((rmsStability * 0.54 + pitchStability * 0.46) * 100);
  const pitch = clampSuccessScore(pitchStability * 100);
  const rhythm = clampSuccessScore(rmsStability * 100);
  const breathiness = clampSuccessScore((1 - breathinessRaw) * 100);
  const closure = clampSuccessScore((1 - closureRaw) * 100);
  const scoreOverall = clampSuccessScore(
    pitch * 0.24 +
      rhythm * 0.16 +
      breathiness * 0.22 +
      closure * 0.2 +
      stability * 0.18
  );

  return {
    scoreOverall,
    metrics: {
      pitch,
      rhythm,
      breathiness,
      closure,
      stability,
    },
    raw: {
      breathiness: breathinessRaw,
      closure: closureRaw,
    },
  };
}

function getSuccessStats(samples = successLibrary) {
  const stats = {
    bestOverall: 0,
    bestStability: 0,
    bestPitch: 0,
    bestBreathiness: 0,
    bestClosure: 0,
  };
  samples.forEach((sample) => {
    stats.bestOverall = Math.max(stats.bestOverall, sample.scoreOverall || 0);
    stats.bestStability = Math.max(stats.bestStability, sample.metrics?.stability || 0);
    stats.bestPitch = Math.max(stats.bestPitch, sample.metrics?.pitch || 0);
    stats.bestBreathiness = Math.max(stats.bestBreathiness, sample.metrics?.breathiness || 0);
    stats.bestClosure = Math.max(stats.bestClosure, sample.metrics?.closure || 0);
  });
  return stats;
}

function getSuccessTagLabel(tag) {
  const labels = {
    best_overall: '历史最佳',
    best_stability: '最稳定',
    best_pitch: '音准好状态',
    best_breathiness: '低漏气',
    best_closure: '闭合稳定',
    fix_success: 'Fix 成功样本',
    manual: '手动收藏',
    auto: '自动收藏',
  };
  return labels[tag] || tag;
}

function getSuccessRecordingById(recordingId) {
  return recordingLibrary.find((recording) => recording.id === recordingId) || null;
}

function buildSuccessSample(recording, options = {}) {
  if (!recording) {
    return null;
  }
  const frames = getSuccessRecordingFrames(recording);
  const analysis = computeSuccessMetricsFromFrames(frames);
  const createdAt = new Date();
  const tags = [...new Set([...(options.tags || []), options.source || 'auto'])];
  return {
    id: options.id || `success-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    songId: recording.songId || recording.songPitchFileName || '',
    segmentId: options.segmentId || '',
    recordingId: recording.id,
    audioUrl: recording.id,
    scoreOverall: Math.round(analysis.scoreOverall),
    tags,
    metrics: {
      pitch: Math.round(analysis.metrics.pitch),
      rhythm: Math.round(analysis.metrics.rhythm),
      breathiness: Math.round(analysis.metrics.breathiness),
      closure: Math.round(analysis.metrics.closure),
      stability: Math.round(analysis.metrics.stability),
    },
    source: options.source || 'auto',
    note: options.note || '',
  };
}

function isDuplicateSuccessSample(recordingId, tag) {
  return successLibrary.some((sample) => sample.recordingId === recordingId && (!tag || sample.tags?.includes(tag)));
}

async function saveSuccessLibraryItem(sample) {
  const db = await openRecordingLibraryDb();
  if (!db || !db.objectStoreNames.contains('successSamples')) {
    return;
  }
  await new Promise((resolve, reject) => {
    const transaction = db.transaction('successSamples', 'readwrite');
    transaction.objectStore('successSamples').put({
      ...sample,
      createdAt: sample.createdAt instanceof Date ? sample.createdAt.toISOString() : sample.createdAt,
    });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function loadSuccessLibrary() {
  try {
    const db = await openRecordingLibraryDb();
    if (!db || !db.objectStoreNames.contains('successSamples')) {
      renderSuccessLibrary();
      return;
    }
    successLibrary = await new Promise((resolve, reject) => {
      const request = db.transaction('successSamples', 'readonly').objectStore('successSamples').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    successLibrary = successLibrary
      .map((sample) => ({
        ...sample,
        createdAt: new Date(sample.createdAt),
        tags: Array.isArray(sample.tags) ? sample.tags : [],
      }))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, SUCCESS_LIBRARY_LIMIT);
  } catch (error) {
    console.error(error);
  }
  successLibraryStats = getSuccessStats();
  renderSuccessLibrary();
}

function addSuccessSample(sample) {
  if (!sample) {
    return null;
  }
  const normalized = {
    ...sample,
    createdAt: sample.createdAt instanceof Date ? sample.createdAt : new Date(sample.createdAt),
  };
  successLibrary = [normalized, ...successLibrary.filter((item) => item.id !== normalized.id)]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, SUCCESS_LIBRARY_LIMIT);
  successLibraryStats = getSuccessStats();
  saveSuccessLibraryItem(normalized).catch((error) => console.error(error));
  renderSuccessLibrary();
  return normalized;
}

function maybeAutoSaveSuccessSample(recording, options = {}) {
  if (!recording || recording.type !== 'recording') {
    return null;
  }
  const sample = buildSuccessSample(recording, options);
  if (!sample) {
    return null;
  }
  const previousBest = successLibraryStats.bestOverall || 0;
  const tags = new Set(sample.tags || []);
  if (sample.scoreOverall > previousBest + SUCCESS_LIBRARY_IMPROVEMENT_MARGIN) {
    tags.add('best_overall');
  }
  if ((sample.metrics?.stability || 0) > (successLibraryStats.bestStability || 0) + SUCCESS_LIBRARY_IMPROVEMENT_MARGIN) {
    tags.add('best_stability');
  }
  if ((sample.metrics?.breathiness || 0) > (successLibraryStats.bestBreathiness || 0) + SUCCESS_LIBRARY_IMPROVEMENT_MARGIN) {
    tags.add('best_breathiness');
  }
  if ((sample.metrics?.closure || 0) > (successLibraryStats.bestClosure || 0) + SUCCESS_LIBRARY_IMPROVEMENT_MARGIN) {
    tags.add('best_closure');
  }
  if (!tags.has('best_overall') && !tags.has('best_stability') && !tags.has('best_breathiness') && !tags.has('best_closure') && !tags.has('fix_success')) {
    return null;
  }
  if ([...tags].some((tag) => isDuplicateSuccessSample(recording.id, tag))) {
    return null;
  }
  sample.tags = [...tags];
  return addSuccessSample(sample);
}

function addManualSuccessSample(recordingId = selectedRecordingLibraryId) {
  const recording = getSuccessRecordingById(recordingId);
  if (!recording) {
    return null;
  }
  const sample = buildSuccessSample(recording, {
    source: 'manual',
    tags: ['manual'],
    note: '用户收藏的好状态',
  });
  const saved = addSuccessSample(sample);
  setTimelineStatus('已收藏到“我的最佳时刻”');
  return saved;
}

function addFixSuccessSampleFromCurrentSession(details = {}) {
  const recording = getSuccessRecordingById(selectedRecordingLibraryId);
  if (!recording) {
    return null;
  }
  return maybeAutoSaveSuccessSample(recording, {
    source: 'auto',
    tags: ['fix_success', details.issueType].filter(Boolean),
    note: details.summary || 'Fix One Thing 成功样本',
  });
}

function getBestSuccessSampleForIssue(issueType) {
  const tagByIssue = {
    breathiness: 'best_breathiness',
    closure: 'best_closure',
    unknown: 'best_stability',
  };
  const tag = tagByIssue[issueType] || 'best_overall';
  const candidates = successLibrary.filter((sample) => sample.tags?.includes(tag));
  const source = candidates.length ? candidates : successLibrary;
  return [...source].sort((a, b) => (b.scoreOverall || 0) - (a.scoreOverall || 0))[0] || null;
}

function getSuccessReferenceCopy(issueType) {
  const sample = getBestSuccessSampleForIssue(issueType);
  if (!sample) {
    return '';
  }
  if (issueType === 'breathiness') {
    return `你的个人最佳里，漏气控制是 ${sample.metrics?.breathiness ?? '--'} 分。今天先靠近那个状态。`;
  }
  if (issueType === 'closure') {
    return `你的个人最佳里，闭合稳定是 ${sample.metrics?.closure ?? '--'} 分。今天先靠近那个状态。`;
  }
  return `你的历史最佳总分是 ${sample.scoreOverall ?? '--'}。这一轮先靠近自己的好状态。`;
}

function clampSuccessCompareDelta(value) {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function getComparableMetricsFromRecording(recording) {
  const analysis = computeSuccessMetricsFromFrames(getSuccessRecordingFrames(recording));
  return {
    scoreOverall: Math.round(analysis.scoreOverall),
    metrics: {
      pitch: Math.round(analysis.metrics.pitch),
      rhythm: Math.round(analysis.metrics.rhythm),
      breathiness: Math.round(analysis.metrics.breathiness),
      closure: Math.round(analysis.metrics.closure),
      stability: Math.round(analysis.metrics.stability),
    },
    raw: analysis.raw,
  };
}

function getSuccessSampleTitle(sample) {
  if (!sample) {
    return '成功样本';
  }
  const recording = getSuccessRecordingById(sample.recordingId);
  const sourceName = recording ? getRecordingLibraryName(recording) : sample.note;
  const time = sample.createdAt instanceof Date
    ? sample.createdAt.toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';
  return `${sourceName || '成功样本'} · ${sample.scoreOverall ?? '--'}${time ? ` · ${time}` : ''}`;
}

function getRecordingCompareTitle(recording) {
  if (!recording) {
    return '对比样本';
  }
  return `${getRecordingLibraryName(recording)} · ${new Date(recording.createdAt || Date.now()).toLocaleString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function normalizeComparableSample(sample, fallbackLabel = '样本') {
  if (!sample) {
    return null;
  }
  if (sample.metrics && Number.isFinite(sample.scoreOverall)) {
    return {
      id: sample.id,
      recordingId: sample.recordingId || sample.id,
      label: sample.label || getSuccessSampleTitle(sample) || fallbackLabel,
      scoreOverall: Math.round(sample.scoreOverall),
      metrics: sample.metrics,
      raw: sample.raw || {},
    };
  }
  if (Array.isArray(sample.frames)) {
    const analysis = getComparableMetricsFromRecording(sample);
    return {
      id: sample.id,
      recordingId: sample.id,
      label: sample.label || getRecordingCompareTitle(sample) || fallbackLabel,
      ...analysis,
    };
  }
  return null;
}

function getBetterReasonConfig(key) {
  const configs = {
    pitch: {
      label: '音高更稳定',
      evidenceLabel: '音高稳定',
      practiceHint: '先小声复现成功样本的稳定线条，不急着加大音量。',
      nextAction: '请用更小的音量唱同一句，优先复现成功样本那种稳稳落住的感觉。',
    },
    rhythm: {
      label: '音量/气息更稳',
      evidenceLabel: '音量稳定',
      practiceHint: '把一句话唱得更连贯，先让气息流速别忽大忽小。',
      nextAction: '请用 70% 音量慢唱一次，只盯住气息和音量不要突然飘走。',
    },
    breathiness: {
      label: '气声/漏气更少',
      evidenceLabel: '漏气控制',
      practiceHint: '不要追求更大声，先让声音更集中、更省气。',
      nextAction: '请不要追求更大声，先尝试用更小的音量复现这次成功样本的集中感。',
    },
    closure: {
      label: '起音和闭合更干净',
      evidenceLabel: '闭合稳定',
      practiceHint: '用轻柔起音进入，不要一下子冲出来或压紧。',
      nextAction: '请先用轻柔 onset 唱同一句，开头放轻，声音出来后再保持清楚。',
    },
    stability: {
      label: '整体稳定度更好',
      evidenceLabel: '整体稳定',
      practiceHint: '先把音量和音高都放小一点，复现那个舒服的稳定区间。',
      nextAction: '请用舒服的小音量复唱同一句，只追求稳定，不追求更亮或更响。',
    },
  };
  return configs[key];
}

function compareSamples(sampleA, sampleB) {
  const baseline = normalizeComparableSample(sampleA, '对比样本 A');
  const success = normalizeComparableSample(sampleB, '成功样本 B');
  if (!baseline || !success) {
    return {
      summary: 'Mira 还缺少可比较的录音。先选一条普通样本，再看这次为什么更好。',
      mainReasons: [],
      nextAction: '先保存一条普通录音和一条成功样本。',
    };
  }

  const metricKeys = ['pitch', 'breathiness', 'closure', 'rhythm', 'stability'];
  const reasons = metricKeys.map((key) => {
    const config = getBetterReasonConfig(key);
    const before = Number(baseline.metrics?.[key]);
    const after = Number(success.metrics?.[key]);
    const delta = after - before;
    let direction = 'neutral';
    if (delta >= 3) {
      direction = 'better';
    } else if (delta <= -3) {
      direction = 'worse';
    }
    return {
      key,
      label: config.label,
      direction,
      delta,
      evidence: `${config.evidenceLabel} ${Number.isFinite(before) ? Math.round(before) : '--'} → ${Number.isFinite(after) ? Math.round(after) : '--'}`,
      practiceHint: config.practiceHint,
      nextAction: config.nextAction,
    };
  });

  const sortedReasons = reasons
    .sort((a, b) => {
      const directionRank = (reason) => (reason.direction === 'better' ? 2 : reason.direction === 'neutral' ? 1 : 0);
      return directionRank(b) - directionRank(a) || Math.abs(b.delta) - Math.abs(a.delta);
    })
    .slice(0, 4);
  const betterReasons = sortedReasons.filter((reason) => reason.direction === 'better');
  const strongest = betterReasons[0] || sortedReasons[0];
  const second = betterReasons[1];
  const summary = betterReasons.length
    ? `这次更好的原因可能是：${strongest.label}${second ? `，并且${second.label}` : ''}。`
    : '这次更像是整体状态更接近你的好声音，但单项差异还不够明显。';

  return {
    summary,
    mainReasons: sortedReasons.map(({ nextAction, ...reason }) => ({
      ...reason,
      delta: clampSuccessCompareDelta(reason.delta),
    })),
    nextAction: strongest?.nextAction || '请用舒服的小音量复唱同一句，只追求稳定，不追求更响。',
  };
}

function getComparisonRecordingCandidates(successSample) {
  const recordings = recordingLibrary.filter((recording) => (
    recording?.type === 'recording' &&
    recording.id !== successSample?.recordingId &&
    getSuccessRecordingFrames(recording).length
  ));
  if (!successSample?.songId) {
    return recordings;
  }
  const sameSong = recordings.filter((recording) => (
    recording.songId === successSample.songId ||
    recording.songPitchFileName === successSample.songId
  ));
  return sameSong.length ? sameSong : recordings;
}

function findDefaultComparisonRecording(successSample) {
  const candidates = getComparisonRecordingCandidates(successSample);
  if (!candidates.length) {
    return null;
  }
  return [...candidates]
    .map((recording) => ({
      recording,
      score: getComparableMetricsFromRecording(recording).scoreOverall,
      createdAt: new Date(recording.createdAt || 0).getTime(),
    }))
    .sort((a, b) => a.score - b.score || b.createdAt - a.createdAt)[0].recording;
}

function fillSuccessCompareSelects(selectedSample, selectedRecording) {
  if (successCompareSampleSelect) {
    successCompareSampleSelect.innerHTML = '';
    successLibrary.forEach((sample) => {
      const option = document.createElement('option');
      option.value = sample.id;
      option.textContent = getSuccessSampleTitle(sample);
      successCompareSampleSelect.append(option);
    });
    successCompareSampleSelect.value = selectedSample?.id || '';
  }
  if (successCompareBaselineSelect) {
    successCompareBaselineSelect.innerHTML = '';
    const candidates = getComparisonRecordingCandidates(selectedSample);
    if (!candidates.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '还没有可对比的普通录音';
      successCompareBaselineSelect.append(option);
      successCompareBaselineSelect.disabled = true;
      return;
    }
    successCompareBaselineSelect.disabled = false;
    candidates.forEach((recording) => {
      const option = document.createElement('option');
      option.value = recording.id;
      option.textContent = getRecordingCompareTitle(recording);
      successCompareBaselineSelect.append(option);
    });
    successCompareBaselineSelect.value = selectedRecording?.id || candidates[0].id;
  }
}

function renderSuccessComparisonPanel() {
  if (!successComparePanel || !successCompareBody) {
    return;
  }
  const selectedSample = successLibrary.find((sample) => sample.id === successComparison.successSampleId) || successLibrary[0] || null;
  if (!selectedSample) {
    successComparePanel.hidden = true;
    return;
  }
  let selectedRecording = getSuccessRecordingById(successComparison.comparisonRecordingId);
  if (!selectedRecording || selectedRecording.id === selectedSample.recordingId) {
    selectedRecording = findDefaultComparisonRecording(selectedSample);
    successComparison.comparisonRecordingId = selectedRecording?.id || null;
  }
  successComparison.successSampleId = selectedSample.id;
  fillSuccessCompareSelects(selectedSample, selectedRecording);
  successComparePanel.hidden = false;

  if (successCompareSubtitle) {
    successCompareSubtitle.textContent = `成功样本：${getSuccessSampleTitle(selectedSample)}；对比样本：${selectedRecording ? getRecordingCompareTitle(selectedRecording) : '暂无'}`;
  }
  if (!selectedRecording) {
    successCompareBody.innerHTML = '<div class="recording-library-empty">还需要至少一条普通录音，Mira 才能解释这次为什么更好。</div>';
    return;
  }

  const report = compareSamples(selectedRecording, selectedSample);
  successComparison.report = report;
  successCompareBody.innerHTML = '';

  const summary = document.createElement('div');
  summary.className = 'success-compare-judgement';
  summary.innerHTML = `
    <span class="label">Mira 的判断</span>
    <p>${report.summary}</p>
  `;

  const reasons = document.createElement('div');
  reasons.className = 'success-reason-list';
  report.mainReasons.forEach((reason, index) => {
    const card = document.createElement('article');
    card.className = `success-reason-card ${reason.direction}`;
    card.innerHTML = `
      <span>${index + 1}</span>
      <div>
        <strong>${reason.label}</strong>
        <p>${reason.evidence}${reason.delta ? ` · ${reason.delta > 0 ? '+' : ''}${reason.delta}` : ''}</p>
        <small>${reason.practiceHint}</small>
      </div>
    `;
    reasons.append(card);
  });

  const nextAction = document.createElement('div');
  nextAction.className = 'success-next-action';
  nextAction.innerHTML = `
    <span class="label">下一步练习</span>
    <strong>${report.nextAction}</strong>
  `;

  successCompareBody.append(summary, reasons, nextAction);
}

function openSuccessComparison(sampleId) {
  const sample = successLibrary.find((item) => item.id === sampleId) || successLibrary[0] || null;
  if (!sample) {
    return;
  }
  successComparison.successSampleId = sample.id;
  const currentRecording = getSuccessRecordingById(successComparison.comparisonRecordingId);
  if (!currentRecording || currentRecording.id === sample.recordingId) {
    successComparison.comparisonRecordingId = findDefaultComparisonRecording(sample)?.id || null;
  }
  renderSuccessComparisonPanel();
  successComparePanel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function getSuccessSummaryCounts() {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = dayStart - ((now.getDay() + 6) % 7) * 86400000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return {
    today: successLibrary.filter((sample) => sample.createdAt.getTime() >= dayStart).length,
    week: successLibrary.filter((sample) => sample.createdAt.getTime() >= weekStart).length,
    month: successLibrary.filter((sample) => sample.createdAt.getTime() >= monthStart).length,
    best: Math.round(successLibraryStats.bestOverall || 0),
  };
}

function renderSuccessLibrary() {
  if (!successLibraryList) {
    return;
  }
  const counts = getSuccessSummaryCounts();
  if (successLibraryStatus) {
    successLibraryStatus.textContent = successLibrary.length
      ? `${successLibrary.length} 个成功样本 · 历史最佳 ${counts.best}`
      : 'Mira 会自动收藏你的好状态';
  }
  if (successLibrarySummary) {
    successLibrarySummary.innerHTML = `
      <span>今天 ${counts.today}</span>
      <span>本周 ${counts.week}</span>
      <span>本月 ${counts.month}</span>
      <span>历史最佳 ${counts.best || '--'}</span>
    `;
  }
  successLibraryList.innerHTML = '';
  if (!successLibrary.length) {
    const empty = document.createElement('div');
    empty.className = 'recording-library-empty';
    empty.textContent = '完成一次好录音或 Fix 成功后，Mira 会把它放到这里。';
    successLibraryList.append(empty);
    if (successComparePanel) {
      successComparePanel.hidden = true;
    }
    return;
  }
  successLibrary.forEach((sample) => {
    const recording = getSuccessRecordingById(sample.recordingId);
    const recordingName = recording ? getRecordingLibraryName(recording) : '原录音不可用';
    const item = document.createElement('div');
    item.className = 'recording-library-item success-library-item';
    const main = document.createElement('button');
    main.className = 'recording-library-select';
    main.type = 'button';
    const title = document.createElement('strong');
    title.textContent = `${sample.tags?.includes('fix_success') ? 'Fix 成功样本' : '个人最佳'} · ${sample.scoreOverall}`;
    const meta = document.createElement('span');
    const tagText = (sample.tags || []).slice(0, 3).map(getSuccessTagLabel).join(' / ');
    meta.textContent = `${sample.createdAt.toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${tagText || '好状态'} · ${sample.note || recordingName || '录音'}`;
    main.append(title, meta);
    main.addEventListener('click', () => {
      if (recording) {
        selectRecordingFromLibrary(recording.id);
      }
    });
    const playButton = document.createElement('button');
    playButton.className = 'recording-library-action primary';
    playButton.type = 'button';
    playButton.textContent = recording && isRecordingLibraryItemPlaying(recording) ? '暂停' : '播放';
    playButton.disabled = !recording;
    playButton.addEventListener('click', () => {
      if (recording) {
        playRecordingLibraryItem(recording);
      }
    });
    const compareButton = document.createElement('button');
    compareButton.className = 'recording-library-action secondary-action';
    compareButton.type = 'button';
    compareButton.textContent = '为什么这次更好？';
    compareButton.addEventListener('click', () => openSuccessComparison(sample.id));
    const metrics = document.createElement('div');
    metrics.className = 'success-sample-metrics';
    metrics.innerHTML = `
      <span>稳定 ${sample.metrics?.stability ?? '--'}</span>
      <span>漏气 ${sample.metrics?.breathiness ?? '--'}</span>
      <span>闭合 ${sample.metrics?.closure ?? '--'}</span>
    `;
    const actions = document.createElement('div');
    actions.className = 'recording-library-actions success-library-actions';
    actions.append(metrics, compareButton, playButton);
    item.append(main, actions);
    successLibraryList.append(item);
  });
  if (successComparison.successSampleId && !successComparePanel?.hidden) {
    renderSuccessComparisonPanel();
  }
}

successCompareSampleSelect?.addEventListener('change', () => {
  successComparison.successSampleId = successCompareSampleSelect.value;
  successComparison.comparisonRecordingId = null;
  renderSuccessComparisonPanel();
});

successCompareBaselineSelect?.addEventListener('change', () => {
  successComparison.comparisonRecordingId = successCompareBaselineSelect.value;
  renderSuccessComparisonPanel();
});

successCompareCloseButton?.addEventListener('click', () => {
  if (successComparePanel) {
    successComparePanel.hidden = true;
  }
});

window.compareSamples = compareSamples;
