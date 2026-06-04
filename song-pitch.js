// Song search and target pitch extraction helpers. This file is loaded before app.js and uses app-level state.

function renderSongSearchResults(results) {
  if (!songSearchResults) {
    return;
  }
  songSearchResults.innerHTML = '';

  results.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'song-search-item';

    const title = document.createElement('strong');
    title.textContent = `${item.trackName || '未知歌曲'} - ${item.artistName || '未知歌手'}`;
    li.appendChild(title);

    const album = document.createElement('span');
    album.textContent = item.collectionName ? `专辑：${item.collectionName}` : '专辑：未知';
    li.appendChild(album);

    const source = document.createElement('span');
    source.className = 'song-source';
    source.textContent = `来源：${item.source || '未知'}`;
    li.appendChild(source);

    if (item.trackViewUrl) {
      const link = document.createElement('a');
      link.href = item.trackViewUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '查看歌曲';
      li.appendChild(link);
    }

    songSearchResults.appendChild(li);
  });
}

async function fetchItunesSongs(query, signal) {
  const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=6&country=cn`;
  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error(`iTunes HTTP ${response.status}`);
  }
  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];
  return results.map((item) => ({
    trackName: item.trackName,
    artistName: item.artistName,
    collectionName: item.collectionName,
    trackViewUrl: item.trackViewUrl,
    source: 'iTunes Music',
  }));
}

function mapNeteaseItem(item) {
  const artist = Array.isArray(item.artists)
    ? item.artists.map((a) => a.name).filter(Boolean).join(' / ')
    : item.artist || item.author || item.singer;
  return {
    trackName: item.name || item.songname || item.title,
    artistName: artist,
    collectionName: item.album?.name || item.album || item.albumname,
    trackViewUrl: item.url || (item.id ? `https://music.163.com/#/song?id=${item.id}` : ''),
    source: '网易云音乐',
  };
}

async function fetchNeteaseSongs(query, signal) {
  const endpoint = `https://music-api.gdstudio.xyz/api.php?types=search&source=netease&name=${encodeURIComponent(query)}&count=6`;
  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error(`Netease HTTP ${response.status}`);
  }
  const data = await response.json();
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.result)
      ? data.result
      : Array.isArray(data?.songs)
        ? data.songs
        : Array.isArray(data?.data)
          ? data.data
          : [];
  return list.map(mapNeteaseItem).filter((item) => item.trackName || item.artistName);
}

async function searchSongs(keyword) {
  const query = keyword.trim();
  if (!query) {
    songSearchStatus.textContent = '请输入搜索关键词';
    return;
  }

  if (songSearchAbortController) {
    songSearchAbortController.abort();
  }
  songSearchAbortController = new AbortController();

  songSearchButton.disabled = true;
  songSearchStatus.textContent = '搜索中...';

  try {
    const settled = await Promise.allSettled([
      fetchItunesSongs(query, songSearchAbortController.signal),
      fetchNeteaseSongs(query, songSearchAbortController.signal),
    ]);

    const successfulResults = settled
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => result.value);

    if (successfulResults.length === 0) {
      songSearchResults.innerHTML = '';
      songSearchStatus.textContent = '未找到歌曲，或部分平台暂不可用，请稍后重试';
      return;
    }

    renderSongSearchResults(successfulResults);
    const sources = successfulResults.reduce((set, item) => set.add(item.source), new Set());
    songSearchStatus.textContent = `找到 ${successfulResults.length} 首歌曲（来源：${[...sources].join('、')}）`;
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }
    console.error(error);
    songSearchStatus.textContent = '搜索失败，请检查网络后重试';
  } finally {
    songSearchButton.disabled = false;
  }
}

function extractPitchTrack(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const data = audioBuffer.getChannelData(0);
  const frameLength = Math.round((sampleRate * offlineFrameDurationMs) / 1000);
  const hopLength = Math.round((sampleRate * offlineHopDurationMs) / 1000);
  const track = [];

  for (let offset = 0; offset + frameLength <= data.length; offset += hopLength) {
    const frame = data.subarray(offset, offset + frameLength);
    const pitch = autoCorrelate(frame, sampleRate);
    track.push(pitch);
  }

  return track;
}

function getMonoChannelData(audioBuffer) {
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer.getChannelData(0);
  }
  const mono = new Float32Array(audioBuffer.length);
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) {
      mono[i] += data[i] / audioBuffer.numberOfChannels;
    }
  }
  return mono;
}

function smoothSongPitchTrack(rawTrack) {
  const voiced = rawTrack.filter((point) => point.pitch);
  if (!voiced.length) {
    return [];
  }

  const octaveFixed = fixSongPitchOctaveErrors(rawTrack);
  const despiked = removeSongPitchSpikes(octaveFixed);

  return despiked.map((point, index) => {
    if (!point.pitch) {
      return point;
    }
    const nearby = [];
    for (
      let i = Math.max(0, index - songPitchMedianRadius);
      i <= Math.min(despiked.length - 1, index + songPitchMedianRadius);
      i += 1
    ) {
      if (despiked[i].pitch) {
        nearby.push(despiked[i].pitch);
      }
    }
    const smoothedPitch = median(nearby);
    return {
      ...point,
      pitch: selectPitchCandidate(smoothedPitch, point.pitch) || smoothedPitch,
    };
  });
}

function centsBetweenPitches(a, b) {
  if (!a || !b || a <= 0 || b <= 0) {
    return null;
  }
  return 1200 * Math.log2(a / b);
}

function absoluteCentsBetweenPitches(a, b) {
  const cents = centsBetweenPitches(a, b);
  return Number.isFinite(cents) ? Math.abs(cents) : Infinity;
}

function nearestSongPitchReference(track, index, cleanedPitches) {
  const references = [];
  for (let i = index - 1; i >= 0 && references.length < 8; i -= 1) {
    const pitch = cleanedPitches[i] || track[i].pitch;
    if (pitch) {
      references.push(pitch);
    }
  }
  for (let i = index + 1; i < track.length && references.length < 14; i += 1) {
    const pitch = track[i].pitch;
    if (pitch) {
      references.push(pitch);
    }
  }
  return references.length ? median(references) : null;
}

function correctSongPitchOctave(pitch, reference) {
  if (!pitch || !reference) {
    return pitch;
  }
  const candidates = [pitch / 4, pitch / 2, pitch, pitch * 2, pitch * 4].filter(
    (candidate) => candidate >= pitchMinHz && candidate <= pitchMaxHz
  );
  const best = candidates.reduce((closest, candidate) =>
    absoluteCentsBetweenPitches(candidate, reference) <
    absoluteCentsBetweenPitches(closest, reference)
      ? candidate
      : closest
  );
  const originalDistance = absoluteCentsBetweenPitches(pitch, reference);
  const bestDistance = absoluteCentsBetweenPitches(best, reference);
  if (
    best !== pitch &&
    bestDistance <= songPitchOctaveFixToleranceCents &&
    originalDistance - bestDistance >= songPitchNeighborToleranceCents
  ) {
    return best;
  }
  return pitch;
}

function fixSongPitchOctaveErrors(track) {
  const cleanedPitches = [];
  return track.map((point, index) => {
    if (!point.pitch) {
      cleanedPitches[index] = null;
      return point;
    }
    const reference = nearestSongPitchReference(track, index, cleanedPitches);
    const pitch = correctSongPitchOctave(point.pitch, reference);
    cleanedPitches[index] = pitch;
    return { ...point, pitch };
  });
}

function collectVoicedRuns(track) {
  const runs = [];
  let current = null;
  track.forEach((point, index) => {
    if (!point.pitch) {
      if (current) {
        runs.push(current);
        current = null;
      }
      return;
    }
    if (!current) {
      current = { start: index, end: index };
      return;
    }
    current.end = index;
  });
  if (current) {
    runs.push(current);
  }
  return runs;
}

function nearestPitchBefore(track, index) {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (track[i].pitch) {
      return track[i].pitch;
    }
  }
  return null;
}

function nearestPitchAfter(track, index) {
  for (let i = index + 1; i < track.length; i += 1) {
    if (track[i].pitch) {
      return track[i].pitch;
    }
  }
  return null;
}

function removeSongPitchSpikes(track) {
  const nextTrack = track.map((point) => ({ ...point }));

  for (let i = 1; i < nextTrack.length - 1; i += 1) {
    const current = nextTrack[i].pitch;
    const previous = nextTrack[i - 1].pitch;
    const next = nextTrack[i + 1].pitch;
    if (!current || !previous || !next) {
      continue;
    }
    const neighborsAgree =
      absoluteCentsBetweenPitches(previous, next) <= songPitchNeighborToleranceCents;
    const currentIsSpike =
      absoluteCentsBetweenPitches(current, previous) >= songPitchSpikeThresholdCents &&
      absoluteCentsBetweenPitches(current, next) >= songPitchSpikeThresholdCents;
    if (neighborsAgree && currentIsSpike) {
      nextTrack[i].pitch = median([previous, next]);
    }
  }

  collectVoicedRuns(nextTrack).forEach((run) => {
    const runLength = run.end - run.start + 1;
    if (runLength > songPitchShortRunMaxFrames) {
      return;
    }
    const before = nearestPitchBefore(nextTrack, run.start);
    const after = nearestPitchAfter(nextTrack, run.end);
    if (!before || !after) {
      return;
    }
    const runPitches = [];
    for (let i = run.start; i <= run.end; i += 1) {
      if (nextTrack[i].pitch) {
        runPitches.push(nextTrack[i].pitch);
      }
    }
    const runMedian = median(runPitches);
    const surroundingAgree =
      absoluteCentsBetweenPitches(before, after) <= songPitchNeighborToleranceCents;
    const runIsTransient =
      absoluteCentsBetweenPitches(runMedian, before) >= songPitchSpikeThresholdCents &&
      absoluteCentsBetweenPitches(runMedian, after) >= songPitchSpikeThresholdCents;
    if (surroundingAgree && runIsTransient) {
      for (let i = run.start; i <= run.end; i += 1) {
        nextTrack[i].pitch = median([before, after]);
      }
    }
  });

  return nextTrack;
}

function extractSongPitchTrack(audioBuffer, onProgress = () => {}) {
  const sampleRate = audioBuffer.sampleRate;
  const data = getMonoChannelData(audioBuffer);
  const frameLength = Math.round((sampleRate * offlineFrameDurationMs) / 1000);
  const hopLength = Math.round((sampleRate * offlineHopDurationMs) / 1000);
  const totalFrames = Math.max(1, Math.floor((data.length - frameLength) / hopLength));
  const rawTrack = [];
  let lastPitch = null;
  let lastProgress = -1;

  for (let offset = 0, frameIndex = 0; offset + frameLength <= data.length; offset += hopLength, frameIndex += 1) {
    const frame = data.subarray(offset, offset + frameLength);
    const rms = computeRms(frame);
    const { pitch, confidence } = autoCorrelateWithConfidence(frame, sampleRate, rms);
    const timeMs = (offset / sampleRate) * 1000;
    let stablePitch = null;

    if (
      pitch &&
      confidence >= songPitchMinConfidence &&
      pitch >= pitchMinHz &&
      pitch <= pitchMaxHz
    ) {
      stablePitch = selectPitchCandidate(pitch, lastPitch) || pitch;
      lastPitch = stablePitch;
    } else if (lastPitch && rawTrack.length) {
      const lastVoiced = rawTrack[rawTrack.length - 1];
      if (lastVoiced.pitch && timeMs - lastVoiced.timeMs <= songPitchMaxGapMs) {
        stablePitch = lastPitch;
      } else {
        lastPitch = null;
      }
    }

    rawTrack.push({
      time: timeMs,
      timeMs,
      pitch: stablePitch,
      confidence,
    });

    const progress = Math.round((frameIndex / totalFrames) * 100);
    if (progress !== lastProgress && progress % 5 === 0) {
      lastProgress = progress;
      onProgress(Math.min(99, progress));
    }
  }

  return smoothSongPitchTrack(rawTrack);
}

function summarizeSongPitchTrack(track, audioBuffer) {
  const voiced = track.filter((point) => point.pitch);
  if (!voiced.length) {
    return null;
  }
  const pitches = voiced.map((point) => point.pitch);
  return {
    durationSeconds: audioBuffer.duration,
    voicedCount: voiced.length,
    coverage: voiced.length / Math.max(track.length, 1),
    minPitch: Math.min(...pitches),
    maxPitch: Math.max(...pitches),
  };
}

async function analyzeSongPitchFile(file) {
  if (!file || songPitchAnalysisInProgress) {
    return;
  }

  songPitchAnalysisInProgress = true;
  clearSongPitchPlayback();
  analyzeSongLyricsFile(file);
  updatePitchAccuracyButton();
  setSongPitchStatus('解码中...');
  setSongTrainingResult('--');
  if (songPitchStats) {
    songPitchStats.textContent = '--';
  }

  let audioBuffer;
  try {
    audioBuffer = await decodeAudioFile(file);
  } catch (error) {
    console.error(error);
    setSongPitchStatus('解码失败', 'bad');
    songPitchAnalysisInProgress = false;
    updatePitchAccuracyButton();
    return;
  }

  try {
    setSongPitchStatus('提取中... 0%');
    const track = extractSongPitchTrack(audioBuffer, (progress) => {
      setSongPitchStatus(`提取中... ${progress}%`);
    });
    const summary = summarizeSongPitchTrack(track, audioBuffer);
    if (!summary || summary.coverage < 0.02) {
      songPitchTrack = [];
      songPitchFileName = '';
      setSongPitchStatus('有效音高不足', 'bad');
      if (songPitchStats) {
        songPitchStats.textContent = '--';
      }
      drawPitchHistory();
      return;
    }

    songPitchTrack = track;
    songPitchFileName = file.name;
    buildSongLyricsCharAlignment();
    prepareSongPitchPlayback(file);
    songPitchEnabled = true;
    if (songPitchToggle) {
      songPitchToggle.checked = true;
    }
    if (clearSongPitchButton) {
      clearSongPitchButton.disabled = false;
    }
    setSongPitchStatus('已生成目标曲线', 'good');
    if (songPitchStats) {
      songPitchStats.textContent = `${Math.round(summary.durationSeconds)}s / ${Math.round(
        summary.minPitch
      )}-${Math.round(summary.maxPitch)} Hz`;
    }
    setOfflineMode(true);
    setDataSourceLabel('歌曲目标曲线');
    setAnalysisStatus('歌曲目标已生成');
    resetOfflineWindow();
    pitchHistory = track.map((point) => ({ time: point.timeMs, pitch: point.pitch }));
    volumeHistory = [];
    resetPitchScoreDisplay();
    drawPitchHistory();
  } finally {
    songPitchAnalysisInProgress = false;
    updateSongPitchPlaybackButtons();
    updatePitchAccuracyButton();
  }
}

function clearSongPitchTrack() {
  clearSongPitchPlayback();
  resetSongLyrics();
  songPitchTrack = [];
  songPitchFileName = '';
  setSongPitchStatus('未加载');
  setSongTrainingResult('--');
  if (songPitchStats) {
    songPitchStats.textContent = '--';
  }
  if (songPitchInput) {
    songPitchInput.value = '';
  }
  if (clearSongPitchButton) {
    clearSongPitchButton.disabled = true;
  }
  if (offlineMode) {
    setOfflineMode(false);
    resetOfflineState();
    pitchHistory = [];
    volumeHistory = [];
  }
  resetPitchScoreDisplay();
  drawPitchHistory();
  updatePitchAccuracyButton();
}
