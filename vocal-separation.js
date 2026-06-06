// Vocal/accompaniment separation helpers. Prefer the local Demucs service,
// then fall back to a lightweight browser-side Mid/Side candidate split.

const LOCAL_SEPARATION_ENDPOINT = 'http://127.0.0.1:8766/api/separate';

function setSongSeparationStatus(text, tone = 'neutral') {
  if (!songSeparationStatus) {
    return;
  }
  songSeparationStatus.textContent = text;
  songSeparationStatus.dataset.tone = tone;
}

function clampAudioSample(value) {
  return Math.max(-1, Math.min(1, value || 0));
}

function writeStringToDataView(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function encodeWavBlob(channelData, sampleRate) {
  const channels = channelData.filter((channel) => channel?.length);
  const channelCount = Math.max(1, channels.length);
  const frameCount = channels[0]?.length || 0;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeStringToDataView(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStringToDataView(view, 8, 'WAVE');
  writeStringToDataView(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStringToDataView(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < frameCount; i += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = clampAudioSample(channels[channel]?.[i] || 0);
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function getBaseAudioName(file) {
  return (file?.name || 'song').replace(/\.[a-z0-9]{2,6}$/i, '').replace(/[\\/:*?"<>|]+/g, '-');
}

function createSeparatedTracks(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const frameCount = audioBuffer.length;
  const left = audioBuffer.getChannelData(0);
  const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;
  const vocal = new Float32Array(frameCount);
  const accompanimentLeft = new Float32Array(frameCount);
  const accompanimentRight = new Float32Array(frameCount);

  for (let i = 0; i < frameCount; i += 1) {
    const l = left[i] || 0;
    const r = right[i] || 0;
    const center = (l + r) * 0.5;
    const side = (l - r) * 0.5;
    vocal[i] = clampAudioSample(center);
    accompanimentLeft[i] = clampAudioSample(side);
    accompanimentRight[i] = clampAudioSample(-side);
  }

  return {
    sampleRate,
    vocalBlob: encodeWavBlob([vocal], sampleRate),
    accompanimentBlob: encodeWavBlob([accompanimentLeft, accompanimentRight], sampleRate),
    isStereo: audioBuffer.numberOfChannels > 1,
  };
}

function base64ToBlob(contentBase64, mime = 'audio/wav') {
  const binary = atob(contentBase64 || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function storeSeparatedFiles(vocalFile, accompanimentFileForLibrary, source, statusText, tone = 'good') {
  const vocalRecord = addAudioFileToLibrary(vocalFile, 'song', {
    source,
    sourceUrl: '',
  });
  const accompanimentRecord = addAccompanimentToLibrary(accompanimentFileForLibrary, {
    source,
    sourceUrl: '',
  });
  if (typeof loadAccompanimentFile === 'function') {
    loadAccompanimentFile(accompanimentFileForLibrary, `已加载分离伴奏：${accompanimentFileForLibrary.name}`);
  }
  setSongSeparationStatus(statusText, tone);
  return { vocalRecord, accompanimentRecord };
}

async function separateSongWithLocalService(file) {
  const formData = new FormData();
  formData.append('file', file, file.name || 'song.audio');

  const response = await fetch(LOCAL_SEPARATION_ENDPOINT, {
    method: 'POST',
    body: formData,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `本地分离服务返回 ${response.status}`);
  }
  if (!result.vocals?.content_base64 || !result.accompaniment?.content_base64) {
    throw new Error('本地分离服务没有返回人声和伴奏音频');
  }

  const baseName = getBaseAudioName(file);
  const vocalBlob = base64ToBlob(result.vocals.content_base64, result.vocals.mime);
  const accompanimentBlob = base64ToBlob(result.accompaniment.content_base64, result.accompaniment.mime);
  const vocalFile = new File([vocalBlob], result.vocals.filename || `${baseName}-vocals.wav`, {
    type: result.vocals.mime || 'audio/wav',
    lastModified: Date.now(),
  });
  const accompanimentFileForLibrary = new File(
    [accompanimentBlob],
    result.accompaniment.filename || `${baseName}-no_vocals.wav`,
    {
      type: result.accompaniment.mime || 'audio/wav',
      lastModified: Date.now(),
    }
  );
  const seconds = Number(result.duration_seconds || 0);
  const elapsed = seconds > 0 ? `，耗时 ${seconds.toFixed(1)} 秒` : '';
  return storeSeparatedFiles(
    vocalFile,
    accompanimentFileForLibrary,
    `Demucs ${result.model || ''}`.trim(),
    `已用 Demucs 真分离：人声已存录音库，伴奏已存伴奏库${elapsed}。`
  );
}

async function separateSongInBrowser(file) {
  const audioBuffer = await decodeAudioFile(file);
  const { sampleRate, vocalBlob, accompanimentBlob, isStereo } = createSeparatedTracks(audioBuffer);
  const baseName = getBaseAudioName(file);
  const vocalFile = new File([vocalBlob], `${baseName}-人声候选.wav`, {
    type: 'audio/wav',
    lastModified: Date.now(),
  });
  const accompanimentFileForLibrary = new File([accompanimentBlob], `${baseName}-伴奏候选.wav`, {
    type: 'audio/wav',
    lastModified: Date.now(),
  });

  return storeSeparatedFiles(
    vocalFile,
    accompanimentFileForLibrary,
    '浏览器候选分离',
    isStereo
      ? `本地 Demucs 不可用，已回退候选分离：人声候选已存录音库，伴奏候选已存伴奏库（${Math.round(sampleRate / 1000)} kHz）。`
      : '本地 Demucs 不可用；原音频是单声道，浏览器只能生成弱人声候选和弱伴奏候选。',
    isStereo ? 'warn' : 'bad'
  );
}

async function separateSongToLibraries(file, { auto = false } = {}) {
  if (!file || songSeparationInProgress) {
    return null;
  }
  songSeparationSourceFile = file;
  songSeparationInProgress = true;
  if (separateSongButton) {
    separateSongButton.disabled = true;
  }
  setSongSeparationStatus(
    auto
      ? '正在自动分离人声和伴奏；如已启动本地 Demucs 服务，会优先使用真分离。'
      : '正在分离人声和伴奏；优先尝试本地 Demucs 服务。'
  );

  try {
    try {
      return await separateSongWithLocalService(file);
    } catch (serviceError) {
      console.warn('Local Demucs separation unavailable; falling back to browser split.', serviceError);
      setSongSeparationStatus('本地 Demucs 服务不可用，正在回退到浏览器候选分离...', 'warn');
      return await separateSongInBrowser(file);
    }
  } catch (error) {
    console.error(error);
    setSongSeparationStatus('分离失败：请尝试 wav/mp3/m4a 等浏览器可解码格式，或检查本地 Demucs 服务。', 'bad');
    return null;
  } finally {
    songSeparationInProgress = false;
    if (separateSongButton) {
      separateSongButton.disabled = !songSeparationSourceFile;
    }
  }
}
