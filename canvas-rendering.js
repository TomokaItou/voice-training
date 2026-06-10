// Main canvas rendering helpers. Loaded before app.js so these functions share the app globals.

function drawAxes(minPitch = null, maxPitch = null, scaleMode = 'linear') {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#e5e9f3';
  ctx.lineWidth = 1;

  const horizontalLines = 5;
  const labelFont = '12px sans-serif';
  ctx.font = labelFont;
  ctx.fillStyle = '#94a3b8';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= horizontalLines; i += 1) {
    const y = (canvas.height / horizontalLines) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    if (minPitch !== null && maxPitch !== null) {
      const ratio = 1 - i / horizontalLines;
      const labelValue =
        scaleMode === 'log'
          ? Math.exp(Math.log(minPitch) + (Math.log(maxPitch) - Math.log(minPitch)) * ratio)
          : minPitch + (maxPitch - minPitch) * ratio;
      const label = `${Math.round(labelValue)} Hz`;
      ctx.fillText(label, 8, y);
    }
  }
}

function drawTargetPitchLine(targetPitch, minPitch, maxPitch, pitchRange, padding, logMin, logRange) {
  if (!Number.isFinite(targetPitch) || targetPitch <= 0) {
    return;
  }
  if (targetPitch < minPitch || targetPitch > maxPitch) {
    return;
  }

  const normalized =
    pitchScaleMode === 'log'
      ? (Math.log(targetPitch) - logMin) / logRange
      : (targetPitch - minPitch) / pitchRange;
  const y = canvas.height - padding - normalized * (canvas.height - padding * 2);

  ctx.save();
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(canvas.width, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#16a34a';
  ctx.font = '13px sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`目标 ${Math.round(targetPitch)} Hz`, 8, Math.max(y - 6, 14));
  ctx.restore();
}

function mapSongPitchTimeToCanvasTime(point, state) {
  if (state.useRecordingTimeline || offlineMode || sessionStartTime === 0) {
    return point.timeMs;
  }
  if (
    songPitchAudio &&
    Number.isFinite(songPitchAudio.currentTime) &&
    songPitchAudio.currentTime > 0
  ) {
    return performance.now() - (songPitchAudio.currentTime * 1000 - point.timeMs);
  }
  if (
    accompanimentAudio &&
    Number.isFinite(accompanimentAudio.currentTime) &&
    accompanimentAudio.currentTime > 0
  ) {
    return performance.now() - (accompanimentAudio.currentTime * 1000 - point.timeMs);
  }
  return sessionStartTime + point.timeMs;
}

function getSongPitchDisplayOctaveRatio() {
  if (
    typeof isPitchCurveSongPracticeActive !== 'function' ||
    !isPitchCurveSongPracticeActive() ||
    !currentPitch ||
    currentPitch <= 0 ||
    typeof getScoringTargetPitchForTime !== 'function' ||
    typeof getSongPracticeTimeMs !== 'function'
  ) {
    return 1;
  }
  const targetPitch = getScoringTargetPitchForTime(getSongPracticeTimeMs());
  const cents = frequencyToCentsError(currentPitch, targetPitch);
  if (!Number.isFinite(cents)) {
    return 1;
  }
  return 2 ** Math.round(cents / 1200);
}

function getVisibleSongPitchPoints(state) {
  if (!hasSongPitchTarget() || !state) {
    return [];
  }
  const maxTime = state.minTime + state.durationMs;
  const octaveRatio = getSongPitchDisplayOctaveRatio();
  return songPitchTrack
    .map((point) => ({
      ...point,
      time: mapSongPitchTimeToCanvasTime(point, state),
      pitch: point.pitch ? point.pitch * octaveRatio : point.pitch,
    }))
    .filter((point) => point.time >= state.minTime && point.time <= maxTime);
}

function drawSongPitchTrack(state) {
  const visibleTargets = getVisibleSongPitchPoints(state);
  if (visibleTargets.length < 2) {
    return;
  }

  const {
    minTime,
    durationMs,
    minPitch,
    maxPitch,
    pitchRange,
    padding,
    logMin,
    logRange,
  } = state;

  ctx.save();
  ctx.strokeStyle = songPitchRenderSoftColor;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  let hasSoftPath = false;

  visibleTargets.forEach((point) => {
    if (!point.pitch || point.pitch < minPitch || point.pitch > maxPitch) {
      if (hasSoftPath) {
        ctx.stroke();
        ctx.beginPath();
        hasSoftPath = false;
      }
      return;
    }
    const x = ((point.time - minTime) / durationMs) * canvas.width;
    const normalized =
      pitchScaleMode === 'log'
        ? (Math.log(point.pitch) - logMin) / logRange
        : (point.pitch - minPitch) / pitchRange;
    const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
    if (!hasSoftPath) {
      ctx.moveTo(x, y);
      hasSoftPath = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  if (hasSoftPath) {
    ctx.stroke();
  }

  ctx.strokeStyle = songPitchRenderColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  let hasPath = false;
  visibleTargets.forEach((point) => {
    if (!point.pitch || point.pitch < minPitch || point.pitch > maxPitch) {
      if (hasPath) {
        ctx.stroke();
        ctx.beginPath();
        hasPath = false;
      }
      return;
    }
    const x = ((point.time - minTime) / durationMs) * canvas.width;
    const normalized =
      pitchScaleMode === 'log'
        ? (Math.log(point.pitch) - logMin) / logRange
        : (point.pitch - minPitch) / pitchRange;
    const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
    if (!hasPath) {
      ctx.moveTo(x, y);
      hasPath = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  if (hasPath) {
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = songPitchRenderColor;
  ctx.font = '13px sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('歌曲目标', 8, 8);
  ctx.restore();
}

function getPitchY(pitch, state) {
  const { minPitch, maxPitch, pitchRange, padding, logMin, logRange } = state;
  if (!Number.isFinite(pitch) || pitch < minPitch || pitch > maxPitch) {
    return null;
  }
  const normalized =
    pitchScaleMode === 'log'
      ? (Math.log(pitch) - logMin) / logRange
      : (pitch - minPitch) / pitchRange;
  return canvas.height - padding - normalized * (canvas.height - padding * 2);
}

function getSegmentPitch(segment) {
  const startMs = segment.start * 1000;
  const endMs = Number.isFinite(segment.end) && segment.end > segment.start
    ? segment.end * 1000
    : startMs + Math.max(800, Array.from(segment.text || '').length * 180);
  const points = songPitchTrack
    .filter((point) => point.pitch && point.timeMs >= startMs && point.timeMs <= endMs)
    .map((point) => point.pitch);
  if (points.length) {
    return median(points);
  }
  return findNearestSongPitchPoint((startMs + endMs) / 2, 480)?.pitch || null;
}

function fitTextToWidth(text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  const chars = Array.from(text);
  let fitted = '';
  for (const char of chars) {
    const next = `${fitted}${char}`;
    if (ctx.measureText(`${next}…`).width > maxWidth) {
      break;
    }
    fitted = next;
  }
  return fitted ? `${fitted}…` : '';
}

function drawSongLyricsOnPitchTrack(state) {
  if (!songLyricsSegments.length || !songPitchTrack.length || !state) {
    return;
  }
  const normalizedSegments = normalizeWhisperSegments(songLyricsSegments);
  if (!normalizedSegments.length) {
    return;
  }

  const occupied = [];
  ctx.save();
  ctx.font = '13px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textBaseline = 'middle';

  normalizedSegments.forEach((segment, index) => {
    const startMs = segment.start * 1000;
    const nextStart = normalizedSegments[index + 1]?.start;
    const endMs = Number.isFinite(segment.end) && segment.end > segment.start
      ? segment.end * 1000
      : Number.isFinite(nextStart)
        ? nextStart * 1000
        : startMs + Math.max(800, Array.from(segment.text).length * 180);
    if (endMs < state.minTime || startMs > state.minTime + state.durationMs) {
      return;
    }

    const visibleStartMs = Math.max(startMs, state.minTime);
    const visibleEndMs = Math.min(endMs, state.minTime + state.durationMs);
    const centerMs = (visibleStartMs + visibleEndMs) / 2;
    const pitch = getSegmentPitch(segment);
    if (!pitch) {
      return;
    }
    const centerX = ((centerMs - state.minTime) / state.durationMs) * canvas.width;
    const startX = ((visibleStartMs - state.minTime) / state.durationMs) * canvas.width;
    const endX = ((visibleEndMs - state.minTime) / state.durationMs) * canvas.width;
    const maxWidth = Math.max(42, Math.min(220, endX - startX + 48));
    const label = fitTextToWidth(segment.text.replace(/\s+/g, ''), maxWidth - 16);
    if (!label) {
      return;
    }
    const textWidth = ctx.measureText(label).width;
    const boxWidth = textWidth + 16;
    const boxHeight = 24;
    const x = Math.max(4, Math.min(canvas.width - boxWidth - 4, centerX - boxWidth / 2));
    let y = getPitchY(pitch, state);
    if (y === null) {
      return;
    }
    y = Math.max(18, Math.min(canvas.height - 18, y - 22));

    for (let lane = 0; lane < 5; lane += 1) {
      const candidateY = Math.max(18, Math.min(canvas.height - 18, y + lane * 28));
      const overlaps = occupied.some((box) =>
        x < box.x + box.width &&
        x + boxWidth > box.x &&
        candidateY - boxHeight / 2 < box.y + box.height / 2 &&
        candidateY + boxHeight / 2 > box.y - box.height / 2
      );
      if (!overlaps || lane === 4) {
        y = candidateY;
        break;
      }
    }

    occupied.push({ x, y, width: boxWidth, height: boxHeight });
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.strokeStyle = 'rgba(15, 118, 110, 0.34)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y - boxHeight / 2, boxWidth, boxHeight, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0b5d56';
    ctx.fillText(label, x + 8, y + 1);
  });
  ctx.restore();
}

function getPitchPointCoordinates(point, state) {
  if (!point?.pitch || !state) {
    return null;
  }
  const { minTime, durationMs, minPitch, maxPitch, pitchRange, padding, logMin, logRange } = state;
  if (point.time < minTime || point.time > minTime + durationMs) {
    return null;
  }
  if (point.pitch < minPitch || point.pitch > maxPitch) {
    return null;
  }
  const x = ((point.time - minTime) / durationMs) * canvas.width;
  const normalized =
    pitchScaleMode === 'log'
      ? (Math.log(point.pitch) - logMin) / logRange
      : (point.pitch - minPitch) / pitchRange;
  const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
  return { x, y };
}

function drawSelectedPitchMarker(state) {
  if (!selectedPitchPoint?.pitch || !state) {
    return;
  }
  const coordinates = getPitchPointCoordinates(selectedPitchPoint, state);
  if (!coordinates) {
    return;
  }
  const { x, y } = coordinates;
  ctx.save();
  ctx.strokeStyle = '#7c3aed';
  ctx.fillStyle = '#7c3aed';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();

  const label = `${selectedPitchPoint.pitch.toFixed(1)} Hz`;
  ctx.font = '13px sans-serif';
  ctx.textBaseline = 'middle';
  const labelWidth = ctx.measureText(label).width + 16;
  const labelX = Math.min(Math.max(x + 8, 6), canvas.width - labelWidth - 6);
  const labelY = Math.min(Math.max(y - 18, 18), canvas.height - 18);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(labelX, labelY - 12, labelWidth, 24, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4c1d95';
  ctx.fillText(label, labelX + 8, labelY);
  ctx.restore();
}

function drawSongPlaybackMarker(state) {
  if (!songPitchAudio || songPitchAudio.paused || !state) {
    return;
  }
  const playbackTime = songPitchAudio.currentTime * 1000;
  const x = ((playbackTime - state.minTime) / state.durationMs) * canvas.width;
  if (x < 0 || x > canvas.width) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvas.height);
  ctx.stroke();
  ctx.fillStyle = '#f97316';
  ctx.font = '12px sans-serif';
  ctx.textBaseline = 'top';
  const label = formatTimeSeconds(playbackTime);
  const labelWidth = ctx.measureText(label).width + 12;
  const labelX = Math.min(Math.max(x + 6, 4), canvas.width - labelWidth - 4);
  ctx.fillRect(labelX, 6, labelWidth, 22);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, labelX + 6, 10);
  ctx.restore();
}

function findNearestPitchPointByCanvasX(canvasX) {
  if (!pitchRenderState?.visibleHistory?.length) {
    return null;
  }
  const { visibleHistory, minTime, durationMs } = pitchRenderState;
  const targetTime = minTime + (canvasX / canvas.width) * durationMs;
  return visibleHistory.reduce((nearest, point) => {
    if (!point.pitch) {
      return nearest;
    }
    if (!nearest) {
      return point;
    }
    return Math.abs(point.time - targetTime) < Math.abs(nearest.time - targetTime)
      ? point
      : nearest;
  }, null);
}

function getSongGameNotes() {
  if (vocalScoreNotes.length) {
    return vocalScoreNotes;
  }
  if (typeof buildVocalScoreSegments === 'function' && songPitchTrack.length) {
    return buildVocalScoreSegments(songPitchTrack);
  }
  return [];
}

function getSongGameBeatMs() {
  if (Number.isFinite(songRhythmBpm) && songRhythmBpm > 0) {
    return 60000 / songRhythmBpm;
  }
  if (typeof getRhythmBeatMs === 'function') {
    return getRhythmBeatMs();
  }
  return 60000 / 90;
}

function getSongGameJudgement(targetPitch) {
  if (!currentPitch || !targetPitch) {
    return { label: 'MISS', tone: 'miss', cents: null };
  }
  const cents = typeof getScoringCentsError === 'function'
    ? getScoringCentsError(currentPitch, targetPitch)
    : frequencyToCentsError(currentPitch, targetPitch);
  const absCents = Math.abs(cents);
  if (!Number.isFinite(absCents)) {
    return { label: 'MISS', tone: 'miss', cents: null };
  }
  if (absCents <= 25) {
    return { label: 'PERFECT', tone: 'perfect', cents };
  }
  if (absCents <= 55) {
    return { label: 'GOOD', tone: 'good', cents };
  }
  return { label: 'MISS', tone: 'miss', cents };
}

function getSongGameNoteFill(noteIndex, isCurrent, hasPassed) {
  if (hasPassed) {
    return {
      fill: 'rgba(185, 193, 182, 0.34)',
      stroke: 'rgba(140, 149, 137, 0.28)',
      shadow: 'rgba(28, 34, 28, 0.08)',
    };
  }
  if (isCurrent) {
    return {
      fill: '#ff8a3d',
      stroke: '#b85f25',
      shadow: 'rgba(255, 138, 61, 0.20)',
    };
  }
  const palette = [
    ['#55b8aa', '#25786f', 'rgba(15, 118, 110, 0.14)'],
    ['#6aa9d7', '#2f6f9f', 'rgba(47, 111, 159, 0.12)'],
    ['#a88ed6', '#7154a6', 'rgba(113, 84, 166, 0.13)'],
    ['#dc86ad', '#a84c73', 'rgba(168, 76, 115, 0.12)'],
    ['#d7b04c', '#956f11', 'rgba(149, 111, 17, 0.12)'],
    ['#71b783', '#3f7f4f', 'rgba(63, 127, 79, 0.12)'],
  ];
  const [fill, stroke, shadow] = palette[noteIndex % palette.length];
  return { fill, stroke, shadow };
}

function drawSongGameBackground(stageLeft, stageTop, stageWidth, stageHeight, hitX) {
  const stageBottom = stageTop + stageHeight;
  const gradient = ctx.createLinearGradient(0, stageTop, 0, stageBottom);
  gradient.addColorStop(0, '#f8fbf7');
  gradient.addColorStop(0.58, '#f1f6f2');
  gradient.addColorStop(1, '#eef3ef');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.74)';
  ctx.strokeStyle = 'rgba(15, 118, 110, 0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(stageLeft, stageTop, stageWidth, stageHeight, 12);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(105, 113, 103, 0.16)';
  for (let i = 1; i < 6; i += 1) {
    const y = stageTop + (stageHeight / 6) * i;
    ctx.beginPath();
    ctx.moveTo(stageLeft + 14, y);
    ctx.lineTo(stageLeft + stageWidth - 14, y);
    ctx.stroke();
  }

  const guide = ctx.createLinearGradient(hitX - 28, 0, hitX + 28, 0);
  guide.addColorStop(0, 'rgba(255, 138, 61, 0)');
  guide.addColorStop(0.5, 'rgba(255, 138, 61, 0.18)');
  guide.addColorStop(1, 'rgba(255, 138, 61, 0)');
  ctx.fillStyle = guide;
  ctx.fillRect(hitX - 28, stageTop + 2, 56, stageHeight - 4);

  ctx.shadowColor = 'rgba(255, 138, 61, 0.26)';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hitX, stageTop + 10);
  ctx.lineTo(hitX, stageBottom - 10);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#8a4b17';
  ctx.font = '700 11px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('SING', hitX, stageBottom - 22);
  ctx.restore();
}

function drawSongGameLane() {
  pitchRenderState = null;
  updateOfflineWindowControl(0);

  const notes = getSongGameNotes().filter((note) => note.pitch && note.endMs > note.startMs);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f8fbf7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!notes.length) {
    ctx.fillStyle = '#697167';
    ctx.font = '18px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('Upload a song to build the game lane', canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'start';
    return;
  }

  const now = typeof getSongPracticeTimeMs === 'function' ? getSongPracticeTimeMs() : 0;
  const stageLeft = 18;
  const stageTop = 22;
  const stageWidth = canvas.width - stageLeft * 2;
  const stageHeight = canvas.height - 44;
  const hitX = stageLeft + Math.max(92, Math.min(148, stageWidth * 0.2));
  const laneTop = stageTop + 18;
  const laneBottom = stageTop + stageHeight - 30;
  const laneHeight = Math.max(80, laneBottom - laneTop);
  const beatMs = Math.max(220, getSongGameBeatMs());
  const lookaheadMs = beatMs * 8;
  const pixelsPerMs = (stageLeft + stageWidth - hitX - 32) / lookaheadMs;
  const pastMs = beatMs * 1.6;
  const pitchValues = notes.map((note) => note.pitch).filter(Number.isFinite);
  const minPitch = Math.min(...pitchValues);
  const maxPitch = Math.max(...pitchValues);
  const logMin = Math.log(minPitch / 1.08);
  const logRange = Math.max(Math.log(maxPitch * 1.08) - logMin, 0.0001);
  const lyricAssignments = typeof getVocalScoreLyricAssignments === 'function'
    ? getVocalScoreLyricAssignments(notes)
    : new Map();

  ctx.save();
  drawSongGameBackground(stageLeft, stageTop, stageWidth, stageHeight, hitX);

  const visibleNotes = notes.filter(
    (note) => note.endMs >= now - pastMs && note.startMs <= now + lookaheadMs + beatMs
  );
  let activeNote = null;
  visibleNotes.forEach((note) => {
    const noteIndex = notes.indexOf(note);
    const startX = hitX + (note.startMs - now) * pixelsPerMs;
    const endX = hitX + (note.endMs - now) * pixelsPerMs;
    const width = Math.max(20, endX - startX);
    const normalized = (Math.log(note.pitch) - logMin) / logRange;
    const y = laneBottom - normalized * laneHeight;
    const height = Math.max(22, Math.min(34, 22 + note.durationMs * pixelsPerMs * 0.035));
    const isCurrent = now >= note.startMs - 90 && now <= note.endMs + 120;
    const hasPassed = note.endMs < now - 120;
    if (isCurrent && (!activeNote || note.startMs < activeNote.startMs)) {
      activeNote = note;
    }

    const colors = getSongGameNoteFill(noteIndex, isCurrent, hasPassed);
    ctx.shadowColor = colors.shadow;
    ctx.shadowBlur = isCurrent ? 16 : 8;
    ctx.fillStyle = colors.fill;
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = isCurrent ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(startX, y - height / 2, width, height, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    const shine = ctx.createLinearGradient(0, y - height / 2, 0, y + height / 2);
    shine.addColorStop(0, 'rgba(255, 255, 255, 0.26)');
    shine.addColorStop(0.48, 'rgba(255, 255, 255, 0.10)');
    shine.addColorStop(1, 'rgba(28, 34, 28, 0.06)');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.roundRect(startX + 1, y - height / 2 + 1, Math.max(0, width - 2), height - 2, 7);
    ctx.fill();

    const lyric = lyricAssignments.get(noteIndex) || '';
    const chars = Array.from(lyric.replace(/\s+/g, ''));
    if (chars.length) {
      ctx.fillStyle = '#17201d';
      ctx.font = '700 14px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.65)';
      ctx.shadowBlur = 3;
      chars.forEach((char, charIndex) => {
        const charX = startX + (width * (charIndex + 0.5)) / chars.length;
        if (charX >= startX + 8 && charX <= startX + width - 8) {
          ctx.fillText(char, charX, y + 0.5);
        }
      });
      ctx.shadowBlur = 0;
    }
  });

  const targetPitch = activeNote?.pitch || (
    typeof getScoringTargetPitchForTime === 'function' ? getScoringTargetPitchForTime(now) : null
  );
  if (currentPitch && Number.isFinite(currentPitch)) {
    const normalized = (Math.log(currentPitch) - logMin) / logRange;
    const y = laneBottom - normalized * laneHeight;
    if (y >= laneTop - 16 && y <= laneBottom + 16) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hitX, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  if (activeNote || currentPitch) {
    const judgement = getSongGameJudgement(targetPitch);
    const judgementX = hitX + 42;
    const judgementY = stageTop + 46;
    ctx.font = '900 28px "Arial", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle =
      judgement.tone === 'perfect' ? '#0f766e' : judgement.tone === 'good' ? '#b7791f' : '#b42318';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 0;
    ctx.fillText(judgement.label, judgementX, judgementY);
    ctx.shadowBlur = 0;
    if (Number.isFinite(judgement.cents)) {
      ctx.font = '13px "Arial", sans-serif';
      ctx.fillStyle = '#697167';
      ctx.fillText(formatSignedCents(judgement.cents), judgementX + 2, judgementY + 27);
    }
  }

  ctx.fillStyle = '#697167';
  ctx.font = '700 12px "Arial", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`BPM ${Math.round(60000 / beatMs)}  ${formatTimeSeconds(now)}`, stageLeft + stageWidth - 18, stageTop + 12);
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#697167';
  ctx.font = '700 11px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('低音', stageLeft + 18, stageTop + stageHeight - 12);
  ctx.textAlign = 'right';
  ctx.fillText('高音', stageLeft + stageWidth - 18, stageTop + stageHeight - 12);
  ctx.restore();
}

function drawPitchHistory() {
  if (typeof isSongGameLaneActive === 'function' && isSongGameLaneActive()) {
    drawSongGameLane();
    return;
  }

  const recordingSyncedHistory = getRecordingSyncedPitchHistory();
  const useRecordingTimeline = !offlineMode && recordingSyncedHistory.length >= 2;
  const sourceHistory = useRecordingTimeline ? recordingSyncedHistory : pitchHistory;

  if (sourceHistory.length < 2) {
    pitchRenderState = null;
    updateOfflineWindowControl(0);
    if (pitchScaleMode === 'fixed') {
      drawAxes(pitchScaleFixedMinHz, pitchScaleFixedMaxHz);
      if (targetPitchEnabled) {
        const pitchRange = Math.max(pitchScaleFixedMaxHz - pitchScaleFixedMinHz, 1);
        const logMin = Math.log(pitchScaleFixedMinHz);
        const logRange = Math.max(Math.log(pitchScaleFixedMaxHz) - logMin, 0.0001);
        drawTargetPitchLine(
          targetPitchHz,
          pitchScaleFixedMinHz,
          pitchScaleFixedMaxHz,
          pitchRange,
          20,
          logMin,
          logRange
        );
      }
    } else if (pitchScaleMode === 'log') {
      drawAxes(pitchScaleLogMinHz, pitchScaleLogMaxHz, 'log');
      if (targetPitchEnabled) {
        const pitchRange = Math.max(pitchScaleLogMaxHz - pitchScaleLogMinHz, 1);
        const logMin = Math.log(pitchScaleLogMinHz);
        const logRange = Math.max(Math.log(pitchScaleLogMaxHz) - logMin, 0.0001);
        drawTargetPitchLine(
          targetPitchHz,
          pitchScaleLogMinHz,
          pitchScaleLogMaxHz,
          pitchRange,
          20,
          logMin,
          logRange
        );
      }
    } else {
      drawAxes();
    }
    return;
  }

  let visibleHistory = sourceHistory;
  let minTime = 0;
  let durationMs = 0;

  if (useRecordingTimeline) {
    minTime = 0;
    durationMs = getRecordingDurationMs();
  } else if (offlineMode) {
    const maxTime = sourceHistory[sourceHistory.length - 1].time;
    const sourceStartTime = sourceHistory[0].time;
    const offlineDurationMs = Math.max(maxTime - sourceStartTime, 1);
    const useOfflineWindow = offlineDurationMs > offlineWindowDurationMs;
    if (useOfflineWindow) {
      offlineWindowStartMs = clampOfflineWindowStart(offlineWindowStartMs, offlineDurationMs);
      minTime = sourceStartTime + offlineWindowStartMs;
      durationMs = offlineWindowDurationMs;
      visibleHistory = sourceHistory.filter(
        (point) => point.time >= minTime && point.time <= minTime + durationMs
      );
    } else {
      minTime = sourceStartTime;
      durationMs = offlineDurationMs;
    }
    updateOfflineWindowControl(offlineDurationMs, offlineWindowStartMs);
  } else {
    const now = performance.now();
    minTime = now - maxHistorySeconds * 1000;
    visibleHistory = sourceHistory.filter((point) => point.time >= minTime);
    pitchHistory = visibleHistory;
    durationMs = maxHistorySeconds * 1000;
    updateOfflineWindowControl(0);
  }

  const previewState = { minTime, durationMs, useRecordingTimeline };
  const visibleSongTargets = getVisibleSongPitchPoints(previewState);
  const pitches = [
    ...visibleHistory.map((point) => point.pitch).filter(Boolean),
    ...visibleSongTargets.map((point) => point.pitch).filter(Boolean),
  ];
  let minPitch = null;
  let maxPitch = null;

  if (pitchScaleMode === 'fixed') {
    minPitch = pitchScaleFixedMinHz;
    maxPitch = pitchScaleFixedMaxHz;
  } else if (pitchScaleMode === 'log') {
    minPitch = pitchScaleLogMinHz;
    maxPitch = pitchScaleLogMaxHz;
  } else {
    if (pitches.length === 0) {
      pitchRenderState = null;
      drawAxes();
      return;
    }
    minPitch = Math.min(...pitches);
    maxPitch = Math.max(...pitches);
  }

  const pitchRange = Math.max(maxPitch - minPitch, 1);
  const padding = 20;

  drawAxes(minPitch, maxPitch, pitchScaleMode === 'log' ? 'log' : 'linear');

  const logMin = Math.log(minPitch);
  const logRange = Math.max(Math.log(maxPitch) - logMin, 0.0001);
  pitchRenderState = {
    visibleHistory,
    minTime,
    durationMs,
    minPitch,
    maxPitch,
    pitchRange,
    padding,
    logMin,
    logRange,
    useRecordingTimeline,
  };

  if (hasSongPitchTarget()) {
    drawSongPitchTrack(pitchRenderState);
    drawSongLyricsOnPitchTrack(pitchRenderState);
  } else if (targetPitchEnabled) {
    drawTargetPitchLine(targetPitchHz, minPitch, maxPitch, pitchRange, padding, logMin, logRange);
  }

  ctx.strokeStyle = '#0f766e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  let hasActivePath = false;

  visibleHistory.forEach((point) => {
    if (point.pitch === null) {
      if (hasActivePath) {
        ctx.stroke();
        ctx.beginPath();
        hasActivePath = false;
      }
      return;
    }
    if (!point.pitch) {
      return;
    }
    if (point.pitch < minPitch || point.pitch > maxPitch) {
      if (pitchScaleMode === 'fixed' || pitchScaleMode === 'log') {
        if (hasActivePath) {
          ctx.stroke();
          ctx.beginPath();
          hasActivePath = false;
        }
        return;
      }
    }
    const x = ((point.time - minTime) / durationMs) * canvas.width;
    const normalized =
      pitchScaleMode === 'log'
        ? (Math.log(point.pitch) - logMin) / logRange
        : (point.pitch - minPitch) / pitchRange;
    const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
    if (!hasActivePath) {
      ctx.moveTo(x, y);
      hasActivePath = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  if (hasActivePath) {
    ctx.stroke();
  }

  if (formantToggle.checked) {
    drawFormantHistory(minTime, durationMs, minPitch, maxPitch, pitchRange, padding);
  }

  drawSongPlaybackMarker(pitchRenderState);
  drawSelectedPitchMarker(pitchRenderState);

  if (!offlineMode && currentPitch) {
    if (currentPitch < minPitch || currentPitch > maxPitch) {
      return;
    }
    const normalized =
      pitchScaleMode === 'log'
        ? (Math.log(currentPitch) - logMin) / logRange
        : (currentPitch - minPitch) / pitchRange;
    const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
    ctx.strokeStyle = '#ff7a59';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    ctx.fillStyle = '#ff7a59';
    ctx.font = '14px sans-serif';
    ctx.textBaseline = 'middle';
    const label = `${Math.round(currentPitch)} Hz`;
    ctx.fillText(label, 8, y);
  }
}

function drawVolumeAxes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = 20;
  const ticks = [0, -20, -40, -60];
  ctx.strokeStyle = '#eef1ed';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#9aa7bd';
  ctx.font = '12px sans-serif';
  ctx.textBaseline = 'middle';

  ticks.forEach((tick) => {
    const ratio = (tick - volumeMeterMinDb) / (volumeMeterMaxDb - volumeMeterMinDb);
    const y = canvas.height - padding - ratio * (canvas.height - padding * 2);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    ctx.fillText(`${tick} dB`, 8, y - 8);
  });
}

function drawVolumeHistory() {
  const recordingSyncedHistory = getRecordingSyncedVolumeHistory();
  const useRecordingTimeline = !offlineMode && recordingSyncedHistory.length >= 2;
  let visibleHistory = useRecordingTimeline ? recordingSyncedHistory : volumeHistory;

  volumeRenderState = null;
  drawVolumeAxes();

  if (visibleHistory.length < 2) {
    return;
  }

  let minTime = 0;
  let durationMs = 0;
  if (useRecordingTimeline) {
    minTime = 0;
    durationMs = getRecordingDurationMs();
  } else {
    const now = performance.now();
    minTime = now - maxHistorySeconds * 1000;
    visibleHistory = visibleHistory.filter((point) => point.time >= minTime);
    volumeHistory = visibleHistory;
    durationMs = maxHistorySeconds * 1000;
  }

  const padding = 20;
  volumeRenderState = {
    visibleHistory,
    minTime,
    durationMs,
    useRecordingTimeline,
  };

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3;
  ctx.beginPath();
  visibleHistory.forEach((point, index) => {
    const clamped = Math.max(volumeMeterMinDb, Math.min(volumeMeterMaxDb, point.db));
    const ratio = (clamped - volumeMeterMinDb) / (volumeMeterMaxDb - volumeMeterMinDb);
    const x = ((point.time - minTime) / durationMs) * canvas.width;
    const y = canvas.height - padding - ratio * (canvas.height - padding * 2);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

function drawBreathHistory() {
  const padding = 28;
  const plotHeight = canvas.height - padding * 2;
  const minTime = performance.now() - breathHistoryWindowSeconds * 1000;
  const durationMs = breathHistoryWindowSeconds * 1000;
  const toX = (time) => ((time - minTime) / durationMs) * canvas.width;
  const toY = (value) => canvas.height - padding - value * plotHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f6fbf9';
  ctx.fillRect(0, padding, canvas.width, plotHeight);

  const targetTop = toY(breathTargetMax);
  const targetBottom = toY(breathTargetMin);
  ctx.fillStyle = 'rgba(15, 118, 110, 0.10)';
  ctx.fillRect(0, targetTop, canvas.width, targetBottom - targetTop);
  ctx.fillStyle = '#0b5d56';
  ctx.font = '12px sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.fillText('目标区间', 8, Math.max(targetTop - 6, 14));

  const activeY = toY(breathActiveThreshold);
  ctx.fillStyle = 'rgba(183, 121, 31, 0.08)';
  ctx.fillRect(0, activeY, canvas.width, canvas.height - padding - activeY);

  ctx.strokeStyle = '#d9ded6';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i += 1) {
    const y = padding + (i / 4) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    ctx.fillStyle = '#697167';
    ctx.font = '12px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${100 - i * 25}%`, 8, y);
  }

  const visibleHistory = breathHistory.filter((point) => point.time >= minTime);
  breathHistory = visibleHistory;

  ctx.save();
  ctx.strokeStyle = '#b7791f';
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, activeY);
  ctx.lineTo(canvas.width, activeY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#8a5a16';
  ctx.textBaseline = 'bottom';
  ctx.fillText('有效线', 8, Math.max(activeY - 6, 14));
  ctx.restore();

  if (visibleHistory.length < 2) {
    ctx.fillStyle = '#697167';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('开始检测后，对准麦克风平稳吹气', canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'left';
    return;
  }

  ctx.beginPath();
  visibleHistory.forEach((point, index) => {
    const x = toX(point.time);
    const y = toY(point.flow);
    if (index === 0) {
      ctx.moveTo(x, canvas.height - padding);
      ctx.lineTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  const lastPoint = visibleHistory[visibleHistory.length - 1];
  ctx.lineTo(toX(lastPoint.time), canvas.height - padding);
  ctx.closePath();
  ctx.fillStyle = 'rgba(15, 118, 110, 0.16)';
  ctx.fill();

  ctx.strokeStyle = '#0f766e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  visibleHistory.forEach((point, index) => {
    const x = toX(point.time);
    const y = toY(point.flow);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = '#b42318';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 5]);
  for (let i = 1; i < visibleHistory.length; i += 1) {
    const prev = visibleHistory[i - 1];
    const point = visibleHistory[i];
    if (prev.flow >= breathActiveThreshold && point.flow < breathActiveThreshold) {
      const x = toX(point.time);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
    }
  }
  ctx.restore();

  if (breathCurrentFlow !== null) {
    const y = toY(breathCurrentFlow);
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.arc(canvas.width - 10, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
