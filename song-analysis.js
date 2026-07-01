const SONG_ANALYSIS_FRAME_SECONDS = 0.046;
const SONG_ANALYSIS_HOP_SECONDS = 0.023;
const SONG_ANALYSIS_MIN_SEGMENT_SECONDS = 1.4;
const SONG_ANALYSIS_MAX_SEGMENT_SECONDS = 10;

let songAnalysisState = {
  result: null,
  audioUrl: null,
  audioFile: null,
  selectedSegment: null,
};

function songAnalysisFormatTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const rest = Math.floor(safe % 60);
  const tenths = Math.floor((safe - Math.floor(safe)) * 10);
  return `${minutes}:${String(rest).padStart(2, '0')}.${tenths}`;
}

function songAnalysisMean(values) {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) return 0;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function songAnalysisPercentile(values, percentile) {
  const clean = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (!clean.length) return 0;
  const index = Math.max(0, Math.min(clean.length - 1, Math.floor((clean.length - 1) * percentile)));
  return clean[index];
}

function songAnalysisMedian(values) {
  return songAnalysisPercentile(values, 0.5);
}

function songAnalysisClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function songAnalysisFrameFeatures(audioBuffer) {
  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const frameSize = Math.max(1024, Math.floor(sampleRate * SONG_ANALYSIS_FRAME_SECONDS));
  const hopSize = Math.max(512, Math.floor(sampleRate * SONG_ANALYSIS_HOP_SECONDS));
  const frames = [];

  for (let start = 0; start + frameSize <= data.length; start += hopSize) {
    const frame = data.subarray(start, start + frameSize);
    const rms = typeof computeRms === 'function'
      ? computeRms(frame)
      : Math.sqrt([...frame].reduce((sum, value) => sum + value * value, 0) / frame.length);
    const time = (start + frameSize / 2) / sampleRate;
    let pitch = null;
    let confidence = 0;
    if (rms > 0.002 && typeof estimatePitchYinWithConfidence === 'function') {
      const result = estimatePitchYinWithConfidence(frame, sampleRate, rms);
      pitch = Number.isFinite(result.pitch) && result.pitch > 0 ? result.pitch : null;
      confidence = result.confidence || 0;
    }
    frames.push({
      time,
      rms,
      energyDb: 20 * Math.log10(rms + 1e-6),
      pitch,
      pitchConfidence: confidence,
    });
  }
  return frames;
}

function estimateSongAnalysisBpm(frames) {
  const energies = frames.map((frame) => frame.rms);
  const median = songAnalysisMedian(energies);
  const threshold = Math.max(median * 1.6, songAnalysisPercentile(energies, 0.75));
  const peaks = [];
  for (let i = 1; i < frames.length - 1; i += 1) {
    const prev = frames[i - 1].rms;
    const current = frames[i].rms;
    const next = frames[i + 1].rms;
    if (current > threshold && current > prev * 1.08 && current >= next && (!peaks.length || frames[i].time - peaks[peaks.length - 1] > 0.22)) {
      peaks.push(frames[i].time);
    }
  }
  const intervals = [];
  for (let i = 1; i < peaks.length; i += 1) {
    const interval = peaks[i] - peaks[i - 1];
    if (interval >= 0.25 && interval <= 1.5) intervals.push(interval);
  }
  if (!intervals.length) return null;
  let bpm = 60 / songAnalysisMedian(intervals);
  while (bpm < 70) bpm *= 2;
  while (bpm > 180) bpm /= 2;
  return Math.round(bpm);
}

function detectSongAnalysisPauses(frames) {
  const energyValues = frames.map((frame) => frame.rms);
  const quietThreshold = Math.max(songAnalysisPercentile(energyValues, 0.18), songAnalysisMedian(energyValues) * 0.35);
  const pauses = [];
  let pauseStart = null;
  frames.forEach((frame) => {
    const quiet = frame.rms <= quietThreshold || !frame.pitch;
    if (quiet && pauseStart === null) pauseStart = frame.time;
    if (!quiet && pauseStart !== null) {
      if (frame.time - pauseStart >= 0.25) {
        pauses.push({ start: pauseStart, end: frame.time, center: (pauseStart + frame.time) / 2 });
      }
      pauseStart = null;
    }
  });
  if (pauseStart !== null && frames.length) {
    const end = frames[frames.length - 1].time;
    if (end - pauseStart >= 0.25) pauses.push({ start: pauseStart, end, center: (pauseStart + end) / 2 });
  }
  return pauses;
}

function buildSongAnalysisBoundaries(frames, duration) {
  const pauses = detectSongAnalysisPauses(frames);
  const boundaries = [0];
  pauses.forEach((pause) => {
    const last = boundaries[boundaries.length - 1];
    if (pause.center - last >= SONG_ANALYSIS_MIN_SEGMENT_SECONDS) {
      boundaries.push(pause.center);
    }
  });
  for (let t = SONG_ANALYSIS_MAX_SEGMENT_SECONDS; t < duration; t += SONG_ANALYSIS_MAX_SEGMENT_SECONDS) {
    if (t - boundaries[boundaries.length - 1] >= SONG_ANALYSIS_MIN_SEGMENT_SECONDS) boundaries.push(t);
  }
  boundaries.push(duration);
  return [...new Set(boundaries.map((value) => Number(value.toFixed(2))))]
    .sort((left, right) => left - right)
    .filter((value, index, list) => index === 0 || value - list[index - 1] >= 0.75 || index === list.length - 1);
}

function countSongAnalysisLongNotes(segmentFrames) {
  let count = 0;
  let runStart = null;
  let lastPitch = null;
  segmentFrames.forEach((frame) => {
    if (!Number.isFinite(frame.pitch)) {
      if (runStart !== null && frame.time - runStart >= 0.9) count += 1;
      runStart = null;
      lastPitch = null;
      return;
    }
    if (lastPitch && Math.abs(1200 * Math.log2(frame.pitch / lastPitch)) <= 80) {
      if (runStart === null) runStart = frame.time;
    } else {
      if (runStart !== null && frame.time - runStart >= 0.9) count += 1;
      runStart = frame.time;
    }
    lastPitch = frame.pitch;
  });
  if (runStart !== null && segmentFrames.length && segmentFrames[segmentFrames.length - 1].time - runStart >= 0.9) count += 1;
  return count;
}

function countSongAnalysisJumps(pitches) {
  let count = 0;
  for (let i = 1; i < pitches.length; i += 1) {
    const prev = pitches[i - 1];
    const current = pitches[i];
    if (prev > 0 && current > 0) {
      const cents = Math.abs(1200 * Math.log2(current / prev));
      if (cents >= 500) count += 1;
    }
  }
  return count;
}

function countSongAnalysisNoteEvents(pitches) {
  if (!pitches.length) return 0;
  let count = 1;
  let last = pitches[0];
  for (let i = 1; i < pitches.length; i += 1) {
    const current = pitches[i];
    if (last > 0 && current > 0) {
      const cents = Math.abs(1200 * Math.log2(current / last));
      if (cents >= 90) {
        count += 1;
        last = current;
      }
    }
  }
  return count;
}

function buildSongAnalysisSegment(id, start, end, frames) {
  const segmentFrames = frames.filter((frame) => frame.time >= start && frame.time <= end);
  const pitches = segmentFrames.map((frame) => frame.pitch).filter((pitch) => Number.isFinite(pitch) && pitch > 0);
  const duration = Math.max(0, end - start);
  const minPitch = pitches.length ? Math.min(...pitches) : 0;
  const maxPitch = pitches.length ? Math.max(...pitches) : 0;
  const averagePitch = songAnalysisMean(pitches);
  const pitchRange = maxPitch && minPitch ? maxPitch - minPitch : 0;
  const noteEventCount = countSongAnalysisNoteEvents(pitches);
  const noteDensity = noteEventCount / Math.max(duration, 0.5);
  const longNoteCount = countSongAnalysisLongNotes(segmentFrames);
  const jumpCount = countSongAnalysisJumps(pitches);
  const score = songAnalysisClamp(
    pitchRange / 5 +
      Math.max(0, maxPitch - 360) / 5 +
      noteDensity * 12 +
      jumpCount * 8 +
      longNoteCount * 7 +
      Math.max(0, duration - 5) * 5,
    0,
    100
  );
  const tags = [];
  if (maxPitch >= 440) tags.push('高音');
  if (jumpCount >= 2) tags.push('大跳');
  if (longNoteCount >= 1) tags.push('长音');
  if (noteDensity >= 7) tags.push('节奏密集');
  if (pitchRange >= 180) tags.push('音域跨度大');
  if (duration >= 7) tags.push('片段较长');

  return {
    id: `segment_${id}`,
    start_time: start,
    end_time: end,
    duration,
    min_pitch: minPitch,
    max_pitch: maxPitch,
    pitch_range: pitchRange,
    average_pitch: averagePitch,
    note_density: noteDensity,
    long_note_count: longNoteCount,
    jump_count: jumpCount,
    difficulty_score: Math.round(score),
    difficulty_tags: tags.length ? tags : ['入门'],
    recommended_order: id,
  };
}

async function analyzeSongAudioFile(file) {
  const audioBuffer = typeof decodeAudioBlob === 'function'
    ? await decodeAudioBlob(file)
    : await decodeAudioFile(file);
  const frames = songAnalysisFrameFeatures(audioBuffer);
  const duration = audioBuffer.duration;
  const bpm = estimateSongAnalysisBpm(frames);
  const boundaries = buildSongAnalysisBoundaries(frames, duration);
  const segments = [];
  for (let i = 0; i < boundaries.length - 1; i += 1) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    if (end - start >= 0.75) {
      segments.push(buildSongAnalysisSegment(segments.length + 1, start, end, frames));
    }
  }
  const ordered = segments
    .slice()
    .sort((left, right) => {
      const shortBias = left.duration - right.duration;
      const difficultyBias = left.difficulty_score - right.difficulty_score;
      return difficultyBias * 1.4 + shortBias * 2;
    });
  ordered.forEach((segment, index) => {
    segment.recommended_order = index + 1;
  });
  segments.sort((left, right) => left.start_time - right.start_time);
  return {
    song_id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    duration,
    bpm,
    pitch_contour: frames.map((frame) => ({ time: frame.time, pitch: frame.pitch })),
    energy_curve: frames.map((frame) => ({ time: frame.time, energy: frame.rms })),
    pauses: detectSongAnalysisPauses(frames),
    segments,
  };
}

function drawSongAnalysisWaveform(result) {
  const canvas = document.getElementById('songAnalysisWaveformCanvas');
  if (!canvas || !result) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f7f9fc';
  ctx.fillRect(0, 0, width, height);
  const energies = result.energy_curve || [];
  const maxEnergy = Math.max(...energies.map((point) => point.energy), 1e-6);
  ctx.strokeStyle = '#4f7cff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  energies.forEach((point, index) => {
    const x = (point.time / Math.max(result.duration, 1)) * width;
    const y = height - (point.energy / maxEnergy) * (height - 24) - 12;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 153, 102, 0.28)';
  result.segments.forEach((segment) => {
    const x = (segment.start_time / result.duration) * width;
    const w = Math.max(1, ((segment.end_time - segment.start_time) / result.duration) * width);
    ctx.fillRect(x, height - 16, w, 8);
  });
}

function renderSongAnalysisResult(result) {
  document.getElementById('songAnalysisSongCard').hidden = false;
  document.getElementById('songAnalysisOverview').hidden = false;
  document.getElementById('songAnalysisRecommendation').hidden = false;
  document.getElementById('songAnalysisSegmentsPanel').hidden = false;
  document.getElementById('songAnalysisSongName').textContent = result.name;
  document.getElementById('songAnalysisSongMeta').textContent = `${songAnalysisFormatTime(result.duration)} · ${result.bpm || '--'} BPM`;
  document.getElementById('songAnalysisDuration').textContent = songAnalysisFormatTime(result.duration);
  document.getElementById('songAnalysisBpm').textContent = result.bpm || '--';
  document.getElementById('songAnalysisSegmentCount').textContent = result.segments.length;
  renderSongAnalysisSegments(result);
  drawSongAnalysisWaveform(result);
}

function renderSongAnalysisSegments(result) {
  const list = document.getElementById('songAnalysisSegmentList');
  const orderList = document.getElementById('songAnalysisOrderList');
  if (!list || !orderList) return;
  list.innerHTML = '';
  orderList.innerHTML = '';
  const recommended = result.segments.slice().sort((left, right) => left.recommended_order - right.recommended_order);
  recommended.slice(0, 5).forEach((segment) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'song-analysis-order-chip';
    chip.textContent = `${segment.recommended_order}. ${songAnalysisFormatTime(segment.start_time)}-${songAnalysisFormatTime(segment.end_time)} · ${segment.difficulty_score}`;
    chip.addEventListener('click', () => playSongAnalysisSegment(segment));
    orderList.append(chip);
  });

  result.segments.forEach((segment, index) => {
    const card = document.createElement('article');
    card.className = 'song-analysis-segment-card';
    card.innerHTML = `
      <div class="song-analysis-segment-main">
        <span class="game-label">片段 ${index + 1} · 推荐 ${segment.recommended_order}</span>
        <h3>${songAnalysisFormatTime(segment.start_time)} - ${songAnalysisFormatTime(segment.end_time)}</h3>
        <p>${segment.duration.toFixed(1)} 秒 · 平均音高 ${segment.average_pitch ? Math.round(segment.average_pitch) : '--'} Hz · 音域 ${Math.round(segment.pitch_range)} Hz</p>
        <div class="song-analysis-tags">${segment.difficulty_tags.map((tag) => `<span>${tag}</span>`).join('')}</div>
      </div>
      <div class="song-analysis-score">
        <span>难度</span>
        <strong>${segment.difficulty_score}</strong>
      </div>
      <div class="song-analysis-segment-actions">
        <button type="button" data-action="play">播放片段</button>
        <button type="button" data-action="practice" class="secondary">设为练习片段</button>
      </div>
    `;
    card.querySelector('[data-action="play"]').addEventListener('click', () => playSongAnalysisSegment(segment));
    card.querySelector('[data-action="practice"]').addEventListener('click', () => setSongAnalysisPracticeSegment(segment));
    list.append(card);
  });
}

function playSongAnalysisSegment(segment) {
  const audio = document.getElementById('songAnalysisAudio');
  if (!audio || !segment) return;
  audio.currentTime = segment.start_time;
  audio.play();
  const stopAt = segment.end_time;
  const onTime = () => {
    if (audio.currentTime >= stopAt) {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
    }
  };
  audio.addEventListener('timeupdate', onTime);
}

function setSongAnalysisPracticeSegment(segment) {
  songAnalysisState.selectedSegment = segment;
  const status = document.getElementById('songAnalysisStatus');
  if (status) {
    status.textContent = `已设为练习片段：${songAnalysisFormatTime(segment.start_time)}-${songAnalysisFormatTime(segment.end_time)}。可以进入 AI 声乐老师做 song-first 闭环。`;
  }
  window.currentSongPracticeSegment = {
    ...segment,
    source: 'song-analysis',
    songName: songAnalysisState.result?.name,
  };
  if (typeof showAiVocalTeacher === 'function') {
    hideSongAnalysisPage();
    showAiVocalTeacher().then(() => {
      window.aiTeacherState = window.aiTeacherState || null;
      if (typeof startAiTeacherSongFirstFromSegment === 'function') {
        startAiTeacherSongFirstFromSegment(window.currentSongPracticeSegment);
      }
    });
  }
}

async function handleSongAnalysisUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const status = document.getElementById('songAnalysisStatus');
  if (status) status.textContent = '正在分析歌曲...';
  if (songAnalysisState.audioUrl) URL.revokeObjectURL(songAnalysisState.audioUrl);
  songAnalysisState.audioFile = file;
  songAnalysisState.audioUrl = URL.createObjectURL(file);
  const audio = document.getElementById('songAnalysisAudio');
  if (audio) audio.src = songAnalysisState.audioUrl;
  try {
    const result = await analyzeSongAudioFile(file);
    songAnalysisState.result = result;
    renderSongAnalysisResult(result);
    if (status) status.textContent = `分析完成：${result.segments.length} 个可练片段。`;
  } catch (error) {
    console.error(error);
    if (status) status.textContent = '分析失败。可以换一个 mp3 / wav / m4a 再试。';
  }
}

function showSongAnalysisPage() {
  document.getElementById('modeLauncher')?.setAttribute('hidden', '');
  document.getElementById('libraryPage')?.setAttribute('hidden', '');
  document.getElementById('appWindow')?.setAttribute('hidden', '');
  if (typeof hideVocalMoveLibrary === 'function') hideVocalMoveLibrary();
  if (typeof hideActiveVoiceSearch === 'function') hideActiveVoiceSearch();
  if (typeof hideAiVocalTeacher === 'function') hideAiVocalTeacher();
  const page = document.getElementById('songAnalysisPage');
  if (page) page.hidden = false;
}

function hideSongAnalysisPage() {
  const page = document.getElementById('songAnalysisPage');
  if (page) page.hidden = true;
}

function bindSongAnalysisEvents() {
  document.getElementById('openSongAnalysisButton')?.addEventListener('click', showSongAnalysisPage);
  document.getElementById('songAnalysisBackButton')?.addEventListener('click', () => {
    hideSongAnalysisPage();
    if (typeof showLauncherView === 'function') showLauncherView();
  });
  document.getElementById('songAnalysisInput')?.addEventListener('change', handleSongAnalysisUpload);
}

bindSongAnalysisEvents();
window.showSongAnalysisPage = showSongAnalysisPage;
window.hideSongAnalysisPage = hideSongAnalysisPage;
window.analyzeSongAudioFile = analyzeSongAudioFile;
window.renderSongAnalysisResult = renderSongAnalysisResult;
window.songAnalysisFormatTime = songAnalysisFormatTime;
