// Song lyrics metadata extraction helpers. This reads lyrics already embedded in uploaded audio files.

const songLyricsTranscriptionEndpoint = 'http://127.0.0.1:8765/api/transcribe-lyrics';

const id3TextEncodings = {
  0: 'iso-8859-1',
  1: 'utf-16',
  2: 'utf-16be',
  3: 'utf-8',
};

function setSongLyricsStatus(text, tone = 'neutral') {
  if (!songLyricsStatus) {
    return;
  }
  songLyricsStatus.textContent = text;
  if (tone === 'good') {
    songLyricsStatus.style.color = '#16a34a';
  } else if (tone === 'bad') {
    songLyricsStatus.style.color = '#dc2626';
  } else if (tone === 'warn') {
    songLyricsStatus.style.color = '#b7791f';
  } else {
    songLyricsStatus.style.color = '#697167';
  }
}

function updateSongLyricsButtons() {
  const hasLyrics = Boolean(songLyrics.trim());
  const hasAlignment = Boolean(songLyricsCharAlignment.length);
  const canTranscribe = Boolean(songLyricsAudioFile) && !songLyricsTranscriptionInProgress;
  if (transcribeSongLyricsButton) {
    transcribeSongLyricsButton.disabled = !canTranscribe;
  }
  if (songLyricsLanguageSelect) {
    songLyricsLanguageSelect.disabled = songLyricsTranscriptionInProgress;
  }
  if (songLyricsModelSelect) {
    songLyricsModelSelect.disabled = songLyricsTranscriptionInProgress;
  }
  if (saveSongLyricsEditButton) {
    saveSongLyricsEditButton.disabled = songLyricsTranscriptionInProgress;
  }
  if (copySongLyricsButton) {
    copySongLyricsButton.disabled = !hasLyrics;
  }
  if (downloadSongLyricsButton) {
    downloadSongLyricsButton.disabled = !hasLyrics;
  }
  if (copySongLyricsAlignmentButton) {
    copySongLyricsAlignmentButton.disabled = !hasAlignment;
  }
}

function renderSongLyrics(text, source = '') {
  songLyrics = normalizeLyricsText(text);
  songLyricsSource = source;
  if (songLyricsText) {
    songLyricsText.value = songLyrics || '未识别到歌词。';
  }
  if (songLyricsText && 'value' in songLyricsText) {
    songLyricsText.value = songLyrics || '未识别到歌词。';
  }
  updateSongLyricsButtons();
}

function resetSongLyrics() {
  songLyricsRequestId += 1;
  songLyrics = '';
  songLyricsSource = '';
  songLyricsFileName = '';
  songLyricsAudioFile = null;
  songLyricsSegments = [];
  songLyricsCharAlignment = [];
  songLyricsInProgress = false;
  songLyricsTranscriptionInProgress = false;
  stopSongLyricsProgress();
  setSongLyricsStatus('未加载');
  if (songLyricsText) {
    songLyricsText.value = '上传歌曲后，可以读取内嵌歌词，也可以启动本地 Whisper 服务后点击“Whisper识别”。';
  }
  renderSongLyricsAlignment();
  updateSongLyricsButtons();
}

function setSongLyricsProgress(text, percent = null, indeterminate = false) {
  if (!songLyricsProgress || !songLyricsProgressFill || !songLyricsProgressText) {
    return;
  }
  songLyricsProgress.hidden = false;
  songLyricsProgress.classList.toggle('is-indeterminate', indeterminate);
  if (Number.isFinite(percent)) {
    songLyricsProgressFill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }
  songLyricsProgressText.textContent = text;
}

function hideSongLyricsProgress() {
  if (songLyricsProgress) {
    songLyricsProgress.hidden = true;
  }
  if (songLyricsProgressFill) {
    songLyricsProgressFill.style.width = '0%';
  }
}

function formatElapsedSeconds(startedAt) {
  const elapsed = Math.max(0, Math.floor((performance.now() - startedAt) / 1000));
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startSongLyricsTranscribeTimer(modelName) {
  stopSongLyricsProgress();
  songLyricsProgressStartedAt = performance.now();
  songLyricsProgressTimer = setInterval(() => {
    setSongLyricsProgress(
      `模型 ${modelName} 处理中 ${formatElapsedSeconds(songLyricsProgressStartedAt)}。首次使用会先下载模型，后续会快一些。`,
      null,
      true
    );
  }, 1000);
}

function stopSongLyricsProgress() {
  if (songLyricsProgressTimer) {
    clearInterval(songLyricsProgressTimer);
    songLyricsProgressTimer = null;
  }
}

function normalizeLyricsText(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

function readAscii(bytes, start, length) {
  let text = '';
  for (let i = start; i < start + length && i < bytes.length; i += 1) {
    text += String.fromCharCode(bytes[i]);
  }
  return text;
}

function decodeSynchsafeInteger(bytes, offset) {
  return (
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f)
  );
}

function decodeUint32(bytes, offset) {
  return (
    ((bytes[offset] << 24) >>> 0) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  );
}

function decodeTextBytes(bytes, encodingByte = 3) {
  const encoding = id3TextEncodings[encodingByte] || 'utf-8';
  const body = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  try {
    return new TextDecoder(encoding).decode(body);
  } catch (_error) {
    return new TextDecoder('utf-8').decode(body);
  }
}

function findTerminator(bytes, start, encodingByte) {
  if (encodingByte === 1 || encodingByte === 2) {
    for (let i = start; i < bytes.length - 1; i += 2) {
      if (bytes[i] === 0 && bytes[i + 1] === 0) {
        return i;
      }
    }
    return -1;
  }
  for (let i = start; i < bytes.length; i += 1) {
    if (bytes[i] === 0) {
      return i;
    }
  }
  return -1;
}

function parseId3LyricsFrame(id, payload) {
  if (!payload.length) {
    return null;
  }
  const encodingByte = payload[0];
  if (id === 'USLT') {
    const descriptionStart = 4;
    const textStart =
      findTerminator(payload, descriptionStart, encodingByte) + (encodingByte === 1 || encodingByte === 2 ? 2 : 1);
    if (textStart <= descriptionStart || textStart >= payload.length) {
      return null;
    }
    return decodeTextBytes(payload.subarray(textStart), encodingByte);
  }
  if (id === 'SYLT') {
    const descriptionStart = 6;
    const textStart =
      findTerminator(payload, descriptionStart, encodingByte) + (encodingByte === 1 || encodingByte === 2 ? 2 : 1);
    if (textStart <= descriptionStart || textStart >= payload.length) {
      return null;
    }
    return decodeTextBytes(payload.subarray(textStart), encodingByte).replace(/\u0000+/g, '\n');
  }
  if (id === 'TXXX') {
    const terminator = findTerminator(payload, 1, encodingByte);
    if (terminator < 0) {
      return null;
    }
    const description = decodeTextBytes(payload.subarray(1, terminator), encodingByte).toLowerCase();
    const textStart = terminator + (encodingByte === 1 || encodingByte === 2 ? 2 : 1);
    if (!/lyric|歌词|lrc/.test(description) || textStart >= payload.length) {
      return null;
    }
    return decodeTextBytes(payload.subarray(textStart), encodingByte);
  }
  return null;
}

function extractId3Lyrics(bytes) {
  if (readAscii(bytes, 0, 3) !== 'ID3' || bytes.length < 10) {
    return null;
  }
  const version = bytes[3];
  const tagSize = decodeSynchsafeInteger(bytes, 6);
  const tagEnd = Math.min(bytes.length, 10 + tagSize);
  let offset = 10;
  const lyrics = [];

  while (offset + 10 <= tagEnd) {
    const frameId = readAscii(bytes, offset, 4);
    if (!/^[A-Z0-9]{4}$/.test(frameId)) {
      break;
    }
    const frameSize = version === 4 ? decodeSynchsafeInteger(bytes, offset + 4) : decodeUint32(bytes, offset + 4);
    const payloadStart = offset + 10;
    const payloadEnd = Math.min(payloadStart + frameSize, tagEnd);
    if (frameSize <= 0 || payloadEnd <= payloadStart) {
      break;
    }
    if (frameId === 'USLT' || frameId === 'SYLT' || frameId === 'TXXX') {
      const text = parseId3LyricsFrame(frameId, bytes.subarray(payloadStart, payloadEnd));
      if (text) {
        lyrics.push(text);
      }
    }
    offset = payloadEnd;
  }

  return lyrics.length ? lyrics.join('\n\n') : null;
}

function extractMp4Lyrics(bytes) {
  const marker = Uint8Array.from([0xa9, 0x6c, 0x79, 0x72]);
  const dataMarker = Uint8Array.from([0x64, 0x61, 0x74, 0x61]);
  for (let i = 0; i < bytes.length - marker.length; i += 1) {
    if (!marker.every((value, index) => bytes[i + index] === value)) {
      continue;
    }
    const searchEnd = Math.min(bytes.length - dataMarker.length, i + 4096);
    for (let j = i + marker.length; j < searchEnd; j += 1) {
      if (!dataMarker.every((value, index) => bytes[j + index] === value)) {
        continue;
      }
      const sizeOffset = j - 4;
      const atomSize = sizeOffset >= 0 ? decodeUint32(bytes, sizeOffset) : 0;
      const textStart = j + 16;
      const textEnd = atomSize > 16 ? Math.min(bytes.length, sizeOffset + atomSize) : searchEnd;
      const text = new TextDecoder('utf-8').decode(bytes.subarray(textStart, textEnd));
      if (normalizeLyricsText(text)) {
        return text;
      }
    }
  }
  return null;
}

function extractCommentLyrics(bytes) {
  const sampleSize = Math.min(bytes.length, 1024 * 1024 * 4);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, sampleSize));
  const patterns = [
    /(?:^|\n)(?:UNSYNCED)?LYRICS=([\s\S]*?)(?=\n[A-Z0-9_ -]{2,40}=|$)/i,
    /(?:^|\n)LRC=([\s\S]*?)(?=\n[A-Z0-9_ -]{2,40}=|$)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

function looksLikeTimedLyrics(text) {
  return /\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]/.test(text);
}

function parseLyricTimestamp(timestamp) {
  const match = String(timestamp || '').match(/^(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?$/);
  if (!match) {
    return null;
  }
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const fractionText = match[3] || '';
  const fraction = fractionText ? Number(fractionText.padEnd(3, '0').slice(0, 3)) / 1000 : 0;
  return minutes * 60 + seconds + fraction;
}

function buildSegmentsFromTimedLyrics(text) {
  const rows = normalizeLyricsText(text)
    .split('\n')
    .map((line) => {
      const match = line.match(/^\s*\[(\d{1,2}:\d{2}(?:[.:]\d{1,3})?)\]\s*(.*)$/);
      if (!match) {
        return null;
      }
      const start = parseLyricTimestamp(match[1]);
      const lyricText = normalizeLyricsText(match[2]);
      if (!Number.isFinite(start) || !lyricText) {
        return null;
      }
      return { start, end: null, text: lyricText };
    })
    .filter(Boolean);

  return rows.map((row, index) => {
    const nextStart = rows[index + 1]?.start;
    return {
      ...row,
      end: Number.isFinite(nextStart) && nextStart > row.start ? nextStart : row.start + 2,
    };
  });
}

function formatLyricsSource(source, text) {
  const timed = looksLikeTimedLyrics(text) ? '，含时间轴' : '';
  return `${source}${timed}`;
}

function isAlignableLyricCharacter(character) {
  return /[\p{Letter}\p{Number}々〆ー]/u.test(character);
}

function findNearestSongPitchPoint(timeMs, maxDistanceMs = 180) {
  if (!songPitchTrack.length || !Number.isFinite(timeMs)) {
    return null;
  }
  let left = 0;
  let right = songPitchTrack.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (songPitchTrack[mid].timeMs < timeMs) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  const candidates = [songPitchTrack[left], songPitchTrack[left - 1]].filter(Boolean);
  const nearest = candidates.reduce((best, point) => {
    if (!best) {
      return point;
    }
    return Math.abs(point.timeMs - timeMs) < Math.abs(best.timeMs - timeMs) ? point : best;
  }, null);
  if (!nearest || !nearest.pitch || Math.abs(nearest.timeMs - timeMs) > maxDistanceMs) {
    return null;
  }
  return nearest;
}

function normalizeWhisperSegments(segments = []) {
  if (!Array.isArray(segments)) {
    return [];
  }
  return segments
    .map((segment) => ({
      start: Number(segment.start),
      end: Number(segment.end),
      text: normalizeLyricsText(segment.text || ''),
    }))
    .filter((segment) => Number.isFinite(segment.start) && segment.text);
}

function buildSongLyricsCharAlignment(segments = songLyricsSegments) {
  const normalizedSegments = normalizeWhisperSegments(segments);
  if (!normalizedSegments.length || !songPitchTrack.length) {
    songLyricsCharAlignment = [];
    renderSongLyricsAlignment();
    saveCurrentSongAssetsToLibrary();
    return [];
  }

  songLyricsCharAlignment = normalizedSegments.flatMap((segment, segmentIndex) => {
    const characters = Array.from(segment.text).filter(isAlignableLyricCharacter);
    if (!characters.length) {
      return [];
    }
    const nextStart = normalizedSegments[segmentIndex + 1]?.start;
    const fallbackEnd = Number.isFinite(nextStart) && nextStart > segment.start
      ? nextStart
      : segment.start + Math.max(0.2, characters.length * 0.18);
    const end = Number.isFinite(segment.end) && segment.end > segment.start ? segment.end : fallbackEnd;
    const durationMs = Math.max(120, (end - segment.start) * 1000);
    const stepMs = durationMs / characters.length;

    return characters.map((character, index) => {
      const startMs = segment.start * 1000 + stepMs * index;
      const endMs = startMs + stepMs;
      const centerMs = startMs + stepMs / 2;
      const pitchPoint = findNearestSongPitchPoint(centerMs);
      return {
        character,
        startMs,
        endMs,
        centerMs,
        pitch: pitchPoint?.pitch || null,
        pitchTimeMs: pitchPoint?.timeMs ?? null,
        note: pitchPoint?.pitch ? frequencyToNote(pitchPoint.pitch) : '--',
      };
    });
  });

  renderSongLyricsAlignment();
  return songLyricsCharAlignment;
}

function renderSongLyricsAlignment() {
  if (!songLyricsAlignmentPanel || !songLyricsAlignmentText || !songLyricsAlignmentStatus) {
    return;
  }
  const hasSegments = Boolean(songLyricsSegments.length);
  const hasPitch = Boolean(songPitchTrack.length);
  songLyricsAlignmentPanel.hidden = !(hasSegments || songLyricsCharAlignment.length);
  songLyricsAlignmentText.innerHTML = '';

  if (!songLyricsCharAlignment.length) {
    songLyricsAlignmentStatus.textContent = hasSegments && !hasPitch
      ? '已有歌词时间戳，等待歌曲音高曲线'
      : '等待 Whisper 歌词时间戳';
    updateSongLyricsButtons();
    return;
  }

  const pitchedCount = songLyricsCharAlignment.filter((item) => item.pitch).length;
  songLyricsAlignmentStatus.textContent = `曲线内显示 ${songLyricsSegments.length} 段歌词 / ${pitchedCount} 个字匹配到音高`;
  songLyricsAlignmentText.textContent = '歌词已贴到音高曲线内；点击曲线附近的歌词段可配合播放位置查看。';
  updateSongLyricsButtons();
  drawPitchHistory();
  if (vocalScoreNotes.length) {
    if (vocalScoreView === 'staff') {
      renderVocalScoreSheet();
    } else {
      renderJianpuScoreSheet();
    }
  }
  saveCurrentSongAssetsToLibrary();
}

async function analyzeSongLyricsFile(file) {
  if (!file) {
    return;
  }
  songLyricsAudioFile = file;
  updateSongLyricsButtons();
  const requestId = songLyricsRequestId + 1;
  songLyricsRequestId = requestId;
  songLyricsInProgress = true;
  songLyricsFileName = file.name || '';
  setSongLyricsStatus('识别中...');
  renderSongLyrics('', '');

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (requestId !== songLyricsRequestId) {
      return;
    }
    const candidates = [
      { source: 'ID3 歌词标签', text: extractId3Lyrics(bytes) },
      { source: 'MP4/M4A 歌词标签', text: extractMp4Lyrics(bytes) },
      { source: 'Ogg/FLAC 注释标签', text: extractCommentLyrics(bytes) },
    ];
    const match = candidates.find((candidate) => normalizeLyricsText(candidate.text));
    if (!match) {
      setSongLyricsStatus('未找到内嵌歌词', 'warn');
      if (songLyricsText) {
        songLyricsText.value = '这个音频文件里没有识别到内嵌歌词标签。可以启动本地 Whisper 服务后点击“Whisper识别”来听写歌词。';
      }
      updateSongLyricsButtons();
      return;
    }
    const normalized = normalizeLyricsText(match.text);
    songLyricsSegments = [];
    songLyricsCharAlignment = [];
    renderSongLyrics(normalized, match.source);
    renderSongLyricsAlignment();
    saveCurrentSongAssetsToLibrary();
    setSongLyricsStatus(formatLyricsSource(match.source, normalized), 'good');
  } catch (error) {
    console.error(error);
    setSongLyricsStatus('歌词识别失败', 'bad');
    if (songLyricsText) {
      songLyricsText.value = '读取歌词时出错，请尝试换一个音频文件。';
    }
  } finally {
    if (requestId === songLyricsRequestId) {
      songLyricsInProgress = false;
    }
  }
}

function formatWhisperSegments(segments = []) {
  if (!Array.isArray(segments) || !segments.length) {
    return '';
  }
  return segments
    .map((segment) => {
      const text = normalizeLyricsText(segment.text || '');
      if (!text) {
        return '';
      }
      const start = Number(segment.start);
      if (!Number.isFinite(start)) {
        return text;
      }
      const minutes = Math.floor(start / 60);
      const seconds = Math.floor(start % 60);
      const centiseconds = Math.floor((start - Math.floor(start)) * 100);
      const stamp = `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(
        centiseconds
      ).padStart(2, '0')}]`;
      return `${stamp}${text}`;
    })
    .filter(Boolean)
    .join('\n');
}

async function transcribeSongLyricsWithWhisper() {
  if (!songLyricsAudioFile || songLyricsTranscriptionInProgress) {
    return;
  }
  songLyricsTranscriptionInProgress = true;
  updateSongLyricsButtons();
  setSongLyricsStatus('Whisper识别中...');
  const modelName = songLyricsModelSelect?.value || 'small';
  setSongLyricsProgress('准备上传音频...', 3);
  if (songLyricsText) {
    songLyricsText.value = `正在把歌曲发送到本地 Whisper 服务。\n当前模型：${modelName}\n日语歌词建议先做人声分离，识别会更准。`;
  }

  const formData = new FormData();
  formData.append('file', songLyricsAudioFile, songLyricsAudioFile.name || 'song-audio');
  formData.append('language', songLyricsLanguageSelect?.value || 'auto');
  formData.append('model', modelName);
  formData.append('task', 'transcribe');

  try {
    const data = await postSongLyricsTranscription(formData, modelName);
    const text = normalizeLyricsText(formatWhisperSegments(data.segments) || data.text || '');
    if (!text) {
      setSongLyricsStatus('Whisper未识别到歌词', 'warn');
      if (songLyricsText) {
        songLyricsText.value = 'Whisper没有返回有效文本。可以尝试换 large-v3/medium 模型，或先分离人声再识别。';
      }
      return;
    }
    renderSongLyrics(text, 'Whisper');
    songLyricsSegments = normalizeWhisperSegments(data.segments);
    buildSongLyricsCharAlignment(songLyricsSegments);
    const language = data.language ? ` / ${data.language}` : '';
    setSongLyricsStatus(`Whisper识别完成${language}`, 'good');
    setSongLyricsProgress('识别完成', 100);
    setTimeout(hideSongLyricsProgress, 1200);
  } catch (error) {
    console.error(error);
    setSongLyricsStatus('Whisper服务不可用', 'bad');
    if (songLyricsText) {
      songLyricsText.value = `无法连接本地 Whisper 服务：${error.message}\n\n请先运行：python scripts/lyrics_whisper_server.py`;
    }
  } finally {
    stopSongLyricsProgress();
    songLyricsTranscriptionInProgress = false;
    updateSongLyricsButtons();
  }
}

function postSongLyricsTranscription(formData, modelName) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', songLyricsTranscriptionEndpoint);
    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) {
        setSongLyricsProgress('正在上传音频...', null, true);
        return;
      }
      const percent = Math.round((event.loaded / event.total) * 45);
      setSongLyricsProgress(`正在上传音频 ${Math.round((event.loaded / event.total) * 100)}%`, percent);
    });
    xhr.addEventListener('load', () => {
      stopSongLyricsProgress();
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch (_error) {
        reject(new Error('服务返回了无法解析的内容'));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(data.error || `HTTP ${xhr.status}`));
        return;
      }
      resolve(data);
    });
    xhr.addEventListener('error', () => {
      stopSongLyricsProgress();
      reject(new Error('无法连接本地 Whisper 服务'));
    });
    xhr.addEventListener('timeout', () => {
      stopSongLyricsProgress();
      reject(new Error('Whisper识别超时'));
    });
    xhr.addEventListener('loadstart', () => {
      setSongLyricsProgress('开始上传音频...', 6);
    });
    xhr.addEventListener('loadend', () => {
      if (xhr.status === 0) {
        return;
      }
    });
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
        setSongLyricsProgress('服务已接收，正在读取结果...', 96);
      }
    };
    xhr.upload.addEventListener('load', () => {
      setSongLyricsProgress(`上传完成，模型 ${modelName} 正在加载/转写...`, 55, true);
      startSongLyricsTranscribeTimer(modelName);
    });
    xhr.send(formData);
  });
}

async function copySongLyrics() {
  if (!songLyrics.trim() || !navigator.clipboard) {
    return;
  }
  await navigator.clipboard.writeText(songLyrics);
  setSongLyricsStatus('已复制歌词', 'good');
}

function saveSongLyricsEdit() {
  if (!songLyricsText) {
    return;
  }

  const editedLyrics = normalizeLyricsText(songLyricsText.value || songLyricsText.textContent || '');
  songLyrics = editedLyrics;
  songLyricsSource = songLyricsSource || '手动编辑';

  const editedSegments = buildSegmentsFromTimedLyrics(editedLyrics);
  if (editedSegments.length) {
    songLyricsSegments = editedSegments;
    buildSongLyricsCharAlignment(songLyricsSegments);
  } else {
    songLyricsSegments = [];
    songLyricsCharAlignment = [];
    renderSongLyricsAlignment();
    saveCurrentSongAssetsToLibrary();
  }

  updateSongLyricsButtons();
  setSongLyricsStatus('歌词编辑已保存', 'good');
}

async function copySongLyricsAlignment() {
  if (!songLyricsCharAlignment.length || !navigator.clipboard) {
    return;
  }
  const rows = [
    '字\t时间\t音高Hz\t音名',
    ...songLyricsCharAlignment.map((item) =>
      [
        item.character,
        formatTimeSeconds(item.centerMs),
        item.pitch ? Math.round(item.pitch) : '',
        item.pitch ? item.note : '',
      ].join('\t')
    ),
  ];
  await navigator.clipboard.writeText(rows.join('\n'));
  setSongLyricsStatus('已复制歌词音高映射', 'good');
}

function downloadSongLyrics() {
  if (!songLyrics.trim()) {
    return;
  }
  const baseName = (songLyricsFileName || 'song-lyrics').replace(/\.[^.]+$/, '');
  const extension = looksLikeTimedLyrics(songLyrics) ? 'lrc' : 'txt';
  downloadBlob(new Blob([songLyrics], { type: 'text/plain;charset=utf-8' }), `${baseName}.${extension}`);
}
