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

function updateRecordingLibraryStatus() {
  const text = recordingLibrary.length ? `${recordingLibrary.length} 条录音` : '暂无录音';
  if (recordingLibraryStatus) {
    recordingLibraryStatus.textContent = text;
  }
  if (recordingLibraryEntryStatus) {
    recordingLibraryEntryStatus.textContent = text;
  }
}

function updateAccompanimentLibraryStatus() {
  const text = accompanimentLibrary.length ? `${accompanimentLibrary.length} 条伴奏` : '暂无伴奏';
  if (accompanimentLibraryStatus) {
    accompanimentLibraryStatus.textContent = text;
  }
  if (accompanimentLibraryEntryStatus) {
    accompanimentLibraryEntryStatus.textContent = text;
  }
}
function openRecordingLibraryDb() {
  if (!window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('voice-training-recordings', 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('recordings')) {
        request.result.createObjectStore('recordings', { keyPath: 'id' });
      }
      if (!request.result.objectStoreNames.contains('accompaniments')) {
        request.result.createObjectStore('accompaniments', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveRecordingLibraryItem(recording) {
  const db = await openRecordingLibraryDb();
  if (!db) {
    return;
  }
  await new Promise((resolve, reject) => {
    const transaction = db.transaction('recordings', 'readwrite');
    transaction.objectStore('recordings').put(recording);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function deleteRecordingLibraryItem(id) {
  const db = await openRecordingLibraryDb();
  if (!db) {
    return;
  }
  await new Promise((resolve, reject) => {
    const transaction = db.transaction('recordings', 'readwrite');
    transaction.objectStore('recordings').delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function saveAccompanimentLibraryItem(item) {
  const db = await openRecordingLibraryDb();
  if (!db) {
    return;
  }
  await new Promise((resolve, reject) => {
    const transaction = db.transaction('accompaniments', 'readwrite');
    transaction.objectStore('accompaniments').put(item);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function deleteAccompanimentLibraryItem(id) {
  const db = await openRecordingLibraryDb();
  if (!db) {
    return;
  }
  await new Promise((resolve, reject) => {
    const transaction = db.transaction('accompaniments', 'readwrite');
    transaction.objectStore('accompaniments').delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function loadRecordingLibrary() {
  try {
    const db = await openRecordingLibraryDb();
    if (!db) {
      renderRecordingLibrary();
      return;
    }
    recordingLibrary = await new Promise((resolve, reject) => {
      const request = db.transaction('recordings', 'readonly').objectStore('recordings').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    recordingLibrary = recordingLibrary
      .map((recording) => ({
        ...recording,
        type: recording.type || 'recording',
        createdAt: new Date(recording.createdAt),
        frames: Array.isArray(recording.frames) ? recording.frames : [],
      }))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 24);
  } catch (error) {
    console.error(error);
  }
  renderRecordingLibrary();
}

async function loadAccompanimentLibrary() {
  try {
    const db = await openRecordingLibraryDb();
    if (!db) {
      renderAccompanimentLibrary();
      return;
    }
    accompanimentLibrary = await new Promise((resolve, reject) => {
      const request = db.transaction('accompaniments', 'readonly').objectStore('accompaniments').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    accompanimentLibrary = accompanimentLibrary
      .map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      }))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 24);
  } catch (error) {
    console.error(error);
  }
  renderAccompanimentLibrary();
}

function getRecordingLibraryName(recording) {
  const index = recordingLibrary.findIndex((item) => item.id === recording.id);
  const fallbackIndex = index >= 0 ? index + 1 : recordingLibrary.length + 1;
  return recording.name || `录音 ${fallbackIndex}`;
}

function getRecordingLibraryTypeLabel(recording) {
  if (recording.type === 'song') return '歌曲';
  if (recording.type === 'audio') return '音频';
  return '录音';
}

function isRecordingLibraryRecording(recording) {
  return !recording.type || recording.type === 'recording';
}

function getRecordingLibraryFile(recording) {
  return new File([recording.blob], getRecordingLibraryName(recording), {
    type: recording.blob?.type || recording.mimeType || 'audio/webm',
    lastModified: recording.createdAt?.getTime?.() || Date.now(),
  });
}

function analyzeRecordingLibraryItem(recording) {
  const file = getRecordingLibraryFile(recording);
  if (recording.type === 'song') {
    if (recording.songPitchTrack?.length || recording.vocalScoreSummary || recording.songLyrics) {
      restoreSongAssetsFromLibrary(recording);
      return;
    }
    analyzeSongPitchFile(file);
    return;
  }
  if (recording.type === 'audio') {
    analyzeAudioFile(file);
    return;
  }
  analyzeRecordingBlob(recording.blob);
}

function getSelectedRecordingLibraryItem() {
  return recordingLibrary.find((item) => item.id === selectedRecordingLibraryId) || null;
}

function updateRecordingLibraryItem(id, patch) {
  const recording = recordingLibrary.find((item) => item.id === id);
  if (!recording) {
    return null;
  }
  Object.assign(recording, patch);
  saveRecordingLibraryItem(recording).catch((error) => console.error(error));
  renderRecordingLibrary();
  return recording;
}

function saveCurrentSongAssetsToLibrary() {
  const recording = getSelectedRecordingLibraryItem();
  if (!recording || recording.type !== 'song') {
    return;
  }
  updateRecordingLibraryItem(recording.id, {
    songPitchTrack: songPitchTrack.map((point) => ({ ...point })),
    songPitchFileName,
    vocalScoreNotes: vocalScoreNotes.map((note) => ({ ...note })),
    vocalScoreRests: vocalScoreRests.map((rest) => ({ ...rest })),
    vocalScoreSummary: vocalScoreSummary ? { ...vocalScoreSummary } : null,
    vocalScoreSourceName,
    songLyrics,
    songLyricsSource,
    songLyricsFileName,
    songLyricsSegments: songLyricsSegments.map((segment) => ({ ...segment })),
    songLyricsCharAlignment: songLyricsCharAlignment.map((item) => ({ ...item })),
    savedAssetsAt: new Date(),
  });
}

function restoreSongAssetsFromLibrary(recording) {
  selectedRecordingLibraryId = recording.id;
  const file = getRecordingLibraryFile(recording);
  songPitchTrack = (recording.songPitchTrack || []).map((point) => ({ ...point }));
  songPitchFileName = recording.songPitchFileName || recording.name || '';
  vocalScoreNotes = (recording.vocalScoreNotes || []).map((note) => ({ ...note }));
  vocalScoreRests = (recording.vocalScoreRests || []).map((rest) => ({ ...rest }));
  vocalScoreSummary = recording.vocalScoreSummary ? { ...recording.vocalScoreSummary } : null;
  vocalScoreSourceName = recording.vocalScoreSourceName || songPitchFileName;
  songLyricsSegments = (recording.songLyricsSegments || []).map((segment) => ({ ...segment }));
  songLyricsCharAlignment = (recording.songLyricsCharAlignment || []).map((item) => ({ ...item }));
  songLyricsFileName = recording.songLyricsFileName || recording.name || '';
  songLyricsAudioFile = file;

  if (recording.songLyrics) {
    renderSongLyrics(recording.songLyrics, recording.songLyricsSource || '录音库');
  } else {
    renderSongLyrics('', '');
  }
  renderSongLyricsAlignment();

  if (vocalScoreText) {
    vocalScoreText.textContent = vocalScoreNotes.length && vocalScoreSummary
      ? renderVocalScoreText(vocalScoreNotes, vocalScoreSummary)
      : '上传歌曲后，会把主旋律音高整理成可读简谱，并可导出 MusicXML 到打谱软件继续编辑。';
  }
  if (vocalScoreNotes.length && vocalScoreSummary) {
    setVocalScoreStatus(`已载入 ${vocalScoreSummary.noteCount} 个音符`, 'good');
    updateVocalScoreButtons(true);
  } else {
    resetVocalScore();
  }
  setVocalScoreView(vocalScoreView);

  prepareSongPitchPlayback(file);
  songPitchEnabled = Boolean(songPitchTrack.length);
  if (songPitchToggle) {
    songPitchToggle.checked = songPitchEnabled;
  }
  if (clearSongPitchButton) {
    clearSongPitchButton.disabled = !songPitchTrack.length;
  }
  if (songPitchTrack.length) {
    const pitches = songPitchTrack.map((point) => point.pitch).filter(Boolean);
    setSongPitchStatus('已从录音库载入', 'good');
    if (songPitchStats) {
      songPitchStats.textContent = pitches.length
        ? `${formatTimeSeconds(songPitchTrack[songPitchTrack.length - 1]?.timeMs || 0)} / ${Math.round(Math.min(...pitches))}-${Math.round(Math.max(...pitches))} Hz`
        : `${formatTimeSeconds(songPitchTrack[songPitchTrack.length - 1]?.timeMs || 0)}`;
    }
    setOfflineMode(true);
    setDataSourceLabel('录音库歌曲');
    setAnalysisStatus('已载入保存的歌曲曲线、乐谱和歌词');
    resetOfflineWindow();
    pitchHistory = songPitchTrack.map((point) => ({ time: point.timeMs, pitch: point.pitch }));
    volumeHistory = [];
    resetPitchScoreDisplay();
    setReadoutMode(displayMode);
    setSongTrainingResult('点击“开始检测”后，会按歌曲目标曲线实时判断有没有跑调。');
    drawPitchHistory();
  }
  renderRecordingLibrary();
}

function selectRecordingFromLibrary(id, { analyze = false } = {}) {
  const recording = recordingLibrary.find((item) => item.id === id);
  if (!recording) {
    return;
  }
  selectedRecordingLibraryId = id;
  if (isRecordingLibraryRecording(recording)) {
    lastRecordingBlob = recording.blob;
    recordingTimelineFrames = recording.frames.map((frame) => ({
      ...frame,
      samples: Array.isArray(frame.samples) ? [...frame.samples] : [],
    }));
    recordingTimelineDurationMs = recording.durationMs;
    recordingSelectedTimeMs = 0;
    if (recordingTimelinePanel) {
      recordingTimelinePanel.hidden = false;
    }
    prepareRecordingPlayback(lastRecordingBlob);
    selectRecordingTime(0, false);
    setTimelineStatus(`已载入${getRecordingLibraryName(recording)}，可回放或分析`);
    updateRecordingButtons();
  } else if (recording.type === 'song' && (recording.songPitchTrack?.length || recording.vocalScoreSummary || recording.songLyrics)) {
    restoreSongAssetsFromLibrary(recording);
    if (analyze) {
      return;
    }
  } else {
    setAnalysisStatus(`已选择${getRecordingLibraryTypeLabel(recording)}：${getRecordingLibraryName(recording)}`);
  }
  renderRecordingLibrary();
  if (analyze) {
    analyzeRecordingLibraryItem(recording);
  }
}

function removeRecordingFromLibrary(id) {
  const index = recordingLibrary.findIndex((item) => item.id === id);
  if (index < 0) {
    return;
  }
  recordingLibrary.splice(index, 1);
  deleteRecordingLibraryItem(id).catch((error) => console.error(error));
  if (selectedRecordingLibraryId === id) {
    selectedRecordingLibraryId = null;
    resetRecordingTimeline();
    updateRecordingButtons();
  }
  renderRecordingLibrary();
}

function renderRecordingLibrary() {
  if (!recordingLibraryList) {
    return;
  }
  recordingLibraryList.innerHTML = '';
  updateRecordingLibraryStatus();
  if (!recordingLibrary.length) {
    const empty = document.createElement('div');
    empty.className = 'recording-library-empty';
    empty.textContent = '录音结束后会自动保存到这里';
    recordingLibraryList.append(empty);
    return;
  }

  recordingLibrary.forEach((recording) => {
    const item = document.createElement('div');
    item.className = 'recording-library-item';
    item.classList.toggle('active', recording.id === selectedRecordingLibraryId);

    const main = document.createElement('button');
    main.className = 'recording-library-select';
    main.type = 'button';
    const title = document.createElement('strong');
    title.textContent = getRecordingLibraryName(recording);
    const meta = document.createElement('span');
    const durationText = recording.durationMs ? `${formatTimeSeconds(recording.durationMs)} · ` : '';
    const savedParts = [];
    if (recording.isPreview) savedParts.push('试听');
    if (recording.source) savedParts.push(recording.source);
    if (recording.vocalScoreSummary) savedParts.push('已存乐谱');
    if (recording.songLyrics) savedParts.push('已存歌词');
    const savedText = savedParts.length ? ` · ${savedParts.join(' / ')}` : '';
    meta.textContent = `${getRecordingLibraryTypeLabel(recording)} · ${durationText}${recording.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${savedText}`;
    main.append(title, meta);
    main.addEventListener('click', () => selectRecordingFromLibrary(recording.id));

    const analyzeButton = document.createElement('button');
    analyzeButton.className = 'recording-library-action';
    analyzeButton.type = 'button';
    analyzeButton.textContent = '分析';
    analyzeButton.addEventListener('click', () => selectRecordingFromLibrary(recording.id, { analyze: true }));

    const downloadButton = document.createElement('button');
    downloadButton.className = 'recording-library-action';
    downloadButton.type = 'button';
    downloadButton.textContent = '下载';
    downloadButton.addEventListener('click', () => {
      const cleanName = getRecordingLibraryName(recording).replace(/[\\/:*?"<>|]+/g, '-');
      const filename = /\.[a-z0-9]{2,6}$/i.test(cleanName) ? cleanName : `${cleanName}.webm`;
      downloadBlob(recording.blob, filename);
    });

    const removeButton = document.createElement('button');
    removeButton.className = 'recording-library-action danger';
    removeButton.type = 'button';
    removeButton.textContent = '删除';
    removeButton.addEventListener('click', () => removeRecordingFromLibrary(recording.id));

    item.append(main, analyzeButton, downloadButton, removeButton);
    recordingLibraryList.append(item);
  });
}

function addRecordingToLibrary(blob) {
  if (!blob) {
    return null;
  }
  const id = `recording-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const recording = {
    id,
    name: `录音 ${recordingLibrary.length + 1}`,
    type: 'recording',
    blob,
    mimeType: blob.type || 'audio/webm',
    durationMs: getRecordingDurationMs(),
    frames: recordingTimelineFrames.map((frame) => ({
      ...frame,
      samples: Array.isArray(frame.samples) ? [...frame.samples] : [],
    })),
    createdAt: new Date(),
  };
  recordingLibrary.unshift(recording);
  if (recordingLibrary.length > 24) {
    recordingLibrary = recordingLibrary.slice(0, 24);
  }
  selectedRecordingLibraryId = id;
  renderRecordingLibrary();
  saveRecordingLibraryItem(recording).catch((error) => console.error(error));
  return recording;
}

function addAudioFileToLibrary(file, type = 'audio', metadata = {}) {
  if (!file) {
    return null;
  }
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const recording = {
    id,
    name: file.name || (type === 'song' ? `歌曲 ${recordingLibrary.length + 1}` : `音频 ${recordingLibrary.length + 1}`),
    type,
    blob: file,
    mimeType: file.type || 'audio/*',
    durationMs: 0,
    frames: [],
    createdAt: new Date(),
    source: metadata.source || '',
    sourceUrl: metadata.sourceUrl || '',
    isPreview: Boolean(metadata.isPreview),
  };
  recordingLibrary.unshift(recording);
  if (recordingLibrary.length > 24) {
    recordingLibrary = recordingLibrary.slice(0, 24);
  }
  selectedRecordingLibraryId = id;
  renderRecordingLibrary();
  saveRecordingLibraryItem(recording).catch((error) => console.error(error));
  return recording;
}

function getAccompanimentLibraryName(item) {
  const index = accompanimentLibrary.findIndex((entry) => entry.id === item.id);
  const fallbackIndex = index >= 0 ? index + 1 : accompanimentLibrary.length + 1;
  return item.name || `伴奏 ${fallbackIndex}`;
}

function getAccompanimentLibraryFile(item) {
  return new File([item.blob], getAccompanimentLibraryName(item), {
    type: item.blob?.type || item.mimeType || 'audio/wav',
    lastModified: item.createdAt?.getTime?.() || Date.now(),
  });
}

function renderAccompanimentLibrary() {
  if (!accompanimentLibraryList) {
    return;
  }
  accompanimentLibraryList.innerHTML = '';
  updateAccompanimentLibraryStatus();
  if (!accompanimentLibrary.length) {
    const empty = document.createElement('div');
    empty.className = 'recording-library-empty';
    empty.textContent = '上传歌曲并分离后，伴奏会保存到这里';
    accompanimentLibraryList.append(empty);
    return;
  }

  accompanimentLibrary.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'recording-library-item';
    row.classList.toggle('active', item.id === selectedAccompanimentLibraryId);

    const main = document.createElement('button');
    main.className = 'recording-library-select';
    main.type = 'button';
    const title = document.createElement('strong');
    title.textContent = getAccompanimentLibraryName(item);
    const meta = document.createElement('span');
    const sourceText = item.source ? ` · ${item.source}` : '';
    meta.textContent = `伴奏 · ${item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${sourceText}`;
    main.append(title, meta);
    main.addEventListener('click', () => selectAccompanimentFromLibrary(item.id));

    const loadButton = document.createElement('button');
    loadButton.className = 'recording-library-action';
    loadButton.type = 'button';
    loadButton.textContent = '加载';
    loadButton.addEventListener('click', () => selectAccompanimentFromLibrary(item.id));

    const downloadButton = document.createElement('button');
    downloadButton.className = 'recording-library-action';
    downloadButton.type = 'button';
    downloadButton.textContent = '下载';
    downloadButton.addEventListener('click', () => {
      const cleanName = getAccompanimentLibraryName(item).replace(/[\\/:*?"<>|]+/g, '-');
      const filename = /\.[a-z0-9]{2,6}$/i.test(cleanName) ? cleanName : `${cleanName}.wav`;
      downloadBlob(item.blob, filename);
    });

    const removeButton = document.createElement('button');
    removeButton.className = 'recording-library-action danger';
    removeButton.type = 'button';
    removeButton.textContent = '删除';
    removeButton.addEventListener('click', () => removeAccompanimentFromLibrary(item.id));

    row.append(main, loadButton, downloadButton, removeButton);
    accompanimentLibraryList.append(row);
  });
}

function addAccompanimentToLibrary(file, metadata = {}) {
  if (!file) {
    return null;
  }
  const id = `accompaniment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const item = {
    id,
    name: file.name || `伴奏 ${accompanimentLibrary.length + 1}`,
    blob: file,
    mimeType: file.type || 'audio/wav',
    createdAt: new Date(),
    source: metadata.source || '',
    sourceUrl: metadata.sourceUrl || '',
  };
  accompanimentLibrary.unshift(item);
  if (accompanimentLibrary.length > 24) {
    accompanimentLibrary = accompanimentLibrary.slice(0, 24);
  }
  selectedAccompanimentLibraryId = id;
  renderAccompanimentLibrary();
  saveAccompanimentLibraryItem(item).catch((error) => console.error(error));
  return item;
}

function selectAccompanimentFromLibrary(id) {
  const item = accompanimentLibrary.find((entry) => entry.id === id);
  if (!item) {
    return;
  }
  selectedAccompanimentLibraryId = id;
  const file = getAccompanimentLibraryFile(item);
  if (typeof loadAccompanimentFile === 'function') {
    loadAccompanimentFile(file, `已从伴奏库加载：${getAccompanimentLibraryName(item)}`);
  }
  renderAccompanimentLibrary();
}

function removeAccompanimentFromLibrary(id) {
  const index = accompanimentLibrary.findIndex((item) => item.id === id);
  if (index < 0) {
    return;
  }
  accompanimentLibrary.splice(index, 1);
  deleteAccompanimentLibraryItem(id).catch((error) => console.error(error));
  if (selectedAccompanimentLibraryId === id) {
    selectedAccompanimentLibraryId = null;
  }
  renderAccompanimentLibrary();
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

function normalizeSongPracticeCents(cents) {
  if (!Number.isFinite(cents)) {
    return cents;
  }
  return cents - 1200 * Math.round(cents / 1200);
}

function getScoringCentsError(frequency, targetFrequency) {
  const cents = frequencyToCentsError(frequency, targetFrequency);
  return hasSongPitchTarget() ? normalizeSongPracticeCents(cents) : cents;
}

function hasSongPitchTarget() {
  return songPitchEnabled && songPitchTrack.length > 0;
}

function getSongPracticeTimeMs(now = performance.now()) {
  if (songPitchAudio && !songPitchAudio.paused && Number.isFinite(songPitchAudio.currentTime)) {
    return songPitchAudio.currentTime * 1000;
  }
  if (accompanimentAudio && !accompanimentAudio.paused && Number.isFinite(accompanimentAudio.currentTime)) {
    return accompanimentAudio.currentTime * 1000;
  }
  if (hasSongPitchTarget() && songPracticeStartTime > 0) {
    return Math.max(0, now - songPracticeStartTime);
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

function getScoringTargetPitchForTime(timeMs) {
  if (!hasSongPitchTarget()) {
    return targetPitchHz;
  }
  return findSongPitchAt(timeMs)?.pitch || null;
}

function getSongPracticeTimeForPoint(pointTime, now = performance.now()) {
  if (
    songPitchAudio &&
    Number.isFinite(songPitchAudio.currentTime) &&
    songPitchAudio.currentTime > 0
  ) {
    const elapsedFromPointMs = Math.max(0, now - pointTime);
    return Math.max(0, songPitchAudio.currentTime * 1000 - elapsedFromPointMs);
  }
  if (
    accompanimentAudio &&
    Number.isFinite(accompanimentAudio.currentTime) &&
    accompanimentAudio.currentTime > 0
  ) {
    const elapsedFromPointMs = Math.max(0, now - pointTime);
    return Math.max(0, accompanimentAudio.currentTime * 1000 - elapsedFromPointMs);
  }
  if (hasSongPitchTarget() && songPracticeStartTime > 0) {
    return Math.max(0, pointTime - songPracticeStartTime);
  }
  return Math.max(0, pointTime - sessionStartTime);
}

function getPitchScoreWindow(now = performance.now()) {
  const minTime = now - pitchScoreWindowSeconds * 1000;
  return pitchHistory
    .filter((point) => point.time >= minTime && point.pitch)
    .map((point) => {
      const targetPitch = getScoringTargetPitchForTime(getSongPracticeTimeForPoint(point.time, now));
      return {
        ...point,
        targetPitch,
        cents: getScoringCentsError(point.pitch, targetPitch),
      };
    })
    .filter((point) => Number.isFinite(point.cents));
}

function computePitchScoreStats(now = performance.now()) {
  const minTime = now - pitchScoreWindowSeconds * 1000;
  const rawWindowPoints = pitchHistory.filter((point) => point.time >= minTime);
  const windowPoints = getPitchScoreWindow(now);
  if (!windowPoints.length) {
    return null;
  }
  const currentTargetPitch = getScoringTargetPitchForTime(getSongPracticeTimeMs(now));
  const lastWindowPoint = windowPoints[windowPoints.length - 1];
  const currentCents = currentTargetPitch
    ? getScoringCentsError(currentPitch, currentTargetPitch)
    : lastWindowPoint.cents;

  const absErrors = windowPoints.map((point) => Math.abs(point.cents));
  const sortedAbsErrors = [...absErrors].sort((a, b) => a - b);
  const p90AbsError = sortedAbsErrors[Math.min(sortedAbsErrors.length - 1, Math.floor(sortedAbsErrors.length * 0.9))];
  const averageAbsError =
    absErrors.reduce((sum, value) => sum + value, 0) / absErrors.length;
  const meanCents =
    windowPoints.reduce((sum, point) => sum + point.cents, 0) / windowPoints.length;
  const variance =
    windowPoints.reduce((sum, point) => sum + (point.cents - meanCents) ** 2, 0) /
    windowPoints.length;
  const centsStdDev = Math.sqrt(variance);
  const pitchAccuracyScore = Math.max(0, 100 - (averageAbsError / pitchScoreMaxUsefulCents) * 100);
  const stability = Math.round(
    Math.max(0, 100 - (centsStdDev / pitchScoreMaxUsefulCents) * 100)
  );
  const hitRate = Math.round(
    (windowPoints.filter((point) => Math.abs(point.cents) <= pitchScoreHitToleranceCents)
      .length /
      windowPoints.length) *
      100
  );
  const coverage = Math.round(
    (windowPoints.length / Math.max(rawWindowPoints.length, windowPoints.length, 1)) * 100
  );
  const score = Math.round(
    Math.max(
      0,
      pitchAccuracyScore * 0.45 +
        hitRate * 0.25 +
        stability * 0.2 +
        coverage * 0.1
    )
  );

  return {
    score,
    stability,
    hitRate,
    coverage,
    currentCents,
    currentTargetPitch: currentTargetPitch || lastWindowPoint.targetPitch,
    averageAbsError,
    p90AbsError,
    sampleCount: windowPoints.length,
  };
}

function setPitchScoreTone(tone) {
  if (!pitchScoreDashboard || pitchScoreLastTone === tone) {
    return;
  }
  pitchScoreDashboard.dataset.tone = tone;
  pitchScoreLastTone = tone;
}
