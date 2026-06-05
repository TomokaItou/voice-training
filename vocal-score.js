// Vocal score generation from the extracted song pitch track.

const vocalScoreStepMap = [
  { step: 'C', alter: 0, jianpu: '1' },
  { step: 'C', alter: 1, jianpu: '#1' },
  { step: 'D', alter: 0, jianpu: '2' },
  { step: 'E', alter: -1, jianpu: 'b3' },
  { step: 'E', alter: 0, jianpu: '3' },
  { step: 'F', alter: 0, jianpu: '4' },
  { step: 'F', alter: 1, jianpu: '#4' },
  { step: 'G', alter: 0, jianpu: '5' },
  { step: 'G', alter: 1, jianpu: '#5' },
  { step: 'A', alter: 0, jianpu: '6' },
  { step: 'B', alter: -1, jianpu: 'b7' },
  { step: 'B', alter: 0, jianpu: '7' },
];

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function midiFromFrequency(frequency) {
  return Math.round(12 * Math.log2(frequency / 440) + 69);
}

function frequencyFromMidi(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function centsBetweenMidiAndFrequency(midi, frequency) {
  return 1200 * Math.log2(frequency / frequencyFromMidi(midi));
}

function getMidiInfo(midi) {
  const chroma = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return { ...vocalScoreStepMap[chroma], octave };
}

function quantizeMs(value, step = vocalScoreQuantizeStepMs) {
  return Math.max(step, Math.round(value / step) * step);
}

function formatVocalScoreDuration(durationMs) {
  const quarterMs = 60000 / vocalScoreDefaultTempo;
  const beats = durationMs / quarterMs;
  if (beats >= 3.75) {
    return '全';
  }
  if (beats >= 1.75) {
    return '二分';
  }
  if (beats >= 0.85) {
    return '四分';
  }
  if (beats >= 0.42) {
    return '八分';
  }
  return '十六分';
}

function getJianpuOctaveMarks(octave) {
  if (octave > 4) {
    return "'".repeat(Math.min(3, octave - 4));
  }
  if (octave < 4) {
    return ','.repeat(Math.min(3, 4 - octave));
  }
  return '';
}

function formatJianpuNote(note) {
  const info = getMidiInfo(note.midi);
  const detune = Math.round(note.detuneCents);
  const detuneText = Math.abs(detune) >= 12 ? `(${detune > 0 ? '+' : ''}${detune}c)` : '';
  return `${info.jianpu}${getJianpuOctaveMarks(info.octave)}${detuneText}`;
}

function getJianpuVisualInfo(note) {
  const info = getMidiInfo(note.midi);
  return {
    number: info.jianpu.replace(/[b#]/g, ''),
    accidental: info.jianpu.includes('#') ? '#' : info.jianpu.includes('b') ? 'b' : '',
    octaveDots: Math.min(3, Math.abs(info.octave - 4)),
    octaveDirection: info.octave > 4 ? 'above' : info.octave < 4 ? 'below' : '',
  };
}

function getVocalScoreLyricAssignments(notes = vocalScoreNotes) {
  if (!notes.length || !songLyricsCharAlignment.length) {
    return new Map();
  }
  const assignments = new Map();
  songLyricsCharAlignment.forEach((item) => {
    if (!item.character || !Number.isFinite(item.centerMs)) {
      return;
    }
    let noteIndex = notes.findIndex((note) => item.centerMs >= note.startMs && item.centerMs <= note.endMs);
    if (noteIndex < 0) {
      let bestDistance = Infinity;
      notes.forEach((note, index) => {
        const noteCenter = (note.startMs + note.endMs) / 2;
        const distance = Math.abs(noteCenter - item.centerMs);
        if (distance < bestDistance) {
          bestDistance = distance;
          noteIndex = index;
        }
      });
      if (bestDistance > 450) {
        return;
      }
    }
    const current = assignments.get(noteIndex) || '';
    assignments.set(noteIndex, `${current}${item.character}`);
  });
  return assignments;
}

function buildVocalScoreSegments(track) {
  const notes = [];
  let current = null;
  let lastVoicedPoint = null;

  const closeCurrent = (endMs) => {
    if (!current) {
      return;
    }
    const durationMs = endMs - current.startMs;
    if (durationMs >= vocalScoreMinNoteDurationMs && current.pitches.length) {
      const pitch = median(current.pitches);
      const midi = midiFromFrequency(pitch);
      notes.push({
        startMs: quantizeMs(current.startMs),
        endMs: quantizeMs(endMs),
        durationMs: quantizeMs(durationMs),
        pitch,
        midi,
        detuneCents: centsBetweenMidiAndFrequency(midi, pitch),
        confidence: median(current.confidences),
      });
    }
    current = null;
  };

  track.forEach((point) => {
    if (!point.pitch) {
      if (current && lastVoicedPoint && point.timeMs - lastVoicedPoint.timeMs > vocalScoreMaxMergeGapMs) {
        closeCurrent(lastVoicedPoint.timeMs + offlineHopDurationMs);
      }
      return;
    }

    const midi = midiFromFrequency(point.pitch);
    if (!current) {
      current = {
        startMs: point.timeMs,
        midi,
        pitches: [point.pitch],
        confidences: [point.confidence || 0],
      };
      lastVoicedPoint = point;
      return;
    }

    const currentPitch = median(current.pitches);
    const cents = Math.abs(centsBetweenPitches(point.pitch, currentPitch));
    const midiChanged = Math.abs(midi - current.midi) >= 1;
    const shouldStartNewNote =
      midiChanged && cents >= vocalScoreNewNoteThresholdCents &&
      point.timeMs - current.startMs >= vocalScoreMinNoteDurationMs;

    if (shouldStartNewNote) {
      closeCurrent(lastVoicedPoint ? lastVoicedPoint.timeMs + offlineHopDurationMs : point.timeMs);
      current = {
        startMs: point.timeMs,
        midi,
        pitches: [point.pitch],
        confidences: [point.confidence || 0],
      };
    } else {
      current.pitches.push(point.pitch);
      current.confidences.push(point.confidence || 0);
      if (cents <= vocalScoreSameNoteToleranceCents) {
        current.midi = midiFromFrequency(median(current.pitches));
      }
    }

    lastVoicedPoint = point;
  });

  if (current && lastVoicedPoint) {
    closeCurrent(lastVoicedPoint.timeMs + offlineHopDurationMs);
  }

  return mergeVocalScoreNotes(notes);
}

function mergeVocalScoreNotes(notes) {
  const merged = [];
  notes.forEach((note) => {
    const previous = merged[merged.length - 1];
    if (
      previous &&
      previous.midi === note.midi &&
      note.startMs - previous.endMs <= vocalScoreMaxMergeGapMs
    ) {
      previous.endMs = note.endMs;
      previous.durationMs = quantizeMs(previous.endMs - previous.startMs);
      previous.pitch = (previous.pitch + note.pitch) / 2;
      previous.detuneCents = centsBetweenMidiAndFrequency(previous.midi, previous.pitch);
      previous.confidence = Math.max(previous.confidence, note.confidence);
      return;
    }
    merged.push({ ...note });
  });
  return merged.filter((note) => note.durationMs >= vocalScoreMinNoteDurationMs);
}

function buildVocalScoreRests(notes) {
  const rests = [];
  for (let i = 1; i < notes.length; i += 1) {
    const gap = notes[i].startMs - notes[i - 1].endMs;
    if (gap >= vocalScoreMinRestDurationMs) {
      rests.push({
        startMs: notes[i - 1].endMs,
        endMs: notes[i].startMs,
        durationMs: quantizeMs(gap),
      });
    }
  }
  return rests;
}

function summarizeVocalScore(notes, sourceName = '') {
  if (!notes.length) {
    return null;
  }
  const midiValues = notes.map((note) => note.midi);
  const durationMs = Math.max(...notes.map((note) => note.endMs)) - Math.min(...notes.map((note) => note.startMs));
  return {
    sourceName,
    noteCount: notes.length,
    durationSeconds: durationMs / 1000,
    lowest: Math.min(...midiValues),
    highest: Math.max(...midiValues),
    tempo: vocalScoreDefaultTempo,
  };
}

function renderVocalScoreText(notes, summary) {
  if (!notes.length || !summary) {
    return '还没有可用的人声乐谱。';
  }

  const lines = [
    `人声候选旋律谱 · ${summary.sourceName || '未命名歌曲'}`,
    `速度 ${summary.tempo} BPM · 4/4 · ${summary.noteCount} 个音符 · 音域 ${frequencyToNote(frequencyFromMidi(summary.lowest))}-${frequencyToNote(frequencyFromMidi(summary.highest))}`,
    '',
    '简谱预览：',
  ];

  const tokens = notes.map((note) => `${formatJianpuNote(note)} ${formatVocalScoreDuration(note.durationMs)}`);
  for (let i = 0; i < tokens.length; i += 8) {
    lines.push(tokens.slice(i, i + 8).join(' | '));
  }

  lines.push('');
  lines.push('提示：这是根据主音高提取出的“人声候选旋律”，伴奏较重时建议导出 MusicXML 后手工微调。');
  return lines.join('\n');
}

function buildVocalScoreCsv(notes) {
  const rows = [
    ['start_seconds', 'duration_seconds', 'note', 'midi', 'frequency_hz', 'detune_cents', 'jianpu'],
    ...notes.map((note) => [
      (note.startMs / 1000).toFixed(3),
      (note.durationMs / 1000).toFixed(3),
      frequencyToNote(frequencyFromMidi(note.midi)),
      String(note.midi),
      note.pitch.toFixed(2),
      note.detuneCents.toFixed(1),
      formatJianpuNote(note),
    ]),
  ];
  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
}

function musicXmlDuration(durationMs) {
  const quarterMs = 60000 / vocalScoreDefaultTempo;
  return Math.max(1, Math.round((durationMs / quarterMs) * 480));
}

function musicXmlType(durationMs) {
  const quarterMs = 60000 / vocalScoreDefaultTempo;
  const beats = durationMs / quarterMs;
  if (beats >= 3.75) return 'whole';
  if (beats >= 1.75) return 'half';
  if (beats >= 0.85) return 'quarter';
  if (beats >= 0.42) return 'eighth';
  return '16th';
}

function buildMusicXmlNoteEvent(event) {
  const duration = musicXmlDuration(event.durationMs);
  const type = musicXmlType(event.durationMs);
  if (event.kind === 'rest') {
    return `      <note>
        <rest/>
        <duration>${duration}</duration>
        <type>${type}</type>
      </note>`;
  }

  const info = getMidiInfo(event.midi);
  const alter = info.alter ? `\n          <alter>${info.alter}</alter>` : '';
  return `      <note>
        <pitch>
          <step>${info.step}</step>${alter}
          <octave>${info.octave}</octave>
        </pitch>
        <duration>${duration}</duration>
        <type>${type}</type>
        <lyric>
          <text>${escapeXml(event.lyricText || formatJianpuNote(event))}</text>
        </lyric>
      </note>`;
}

function buildMusicXmlMeasures(notes, rests) {
  const lyricAssignments = getVocalScoreLyricAssignments(notes);
  const events = [
    ...notes.map((note, index) => ({ kind: 'note', lyricText: lyricAssignments.get(index) || '', ...note })),
    ...rests.map((rest) => ({ kind: 'rest', ...rest })),
  ].sort((a, b) => a.startMs - b.startMs);

  const measureDuration = 480 * 4;
  const measures = [];
  let currentMeasure = [];
  let currentDuration = 0;

  events.forEach((event) => {
    const duration = musicXmlDuration(event.durationMs);
    if (currentDuration > 0 && currentDuration + duration > measureDuration) {
      measures.push(currentMeasure);
      currentMeasure = [];
      currentDuration = 0;
    }
    currentMeasure.push(event);
    currentDuration += duration;
  });

  if (currentMeasure.length) {
    measures.push(currentMeasure);
  }

  return measures.map((measure, index) => {
    const attributes = index === 0
      ? `      <attributes>
        <divisions>480</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome>
            <beat-unit>quarter</beat-unit>
            <per-minute>${vocalScoreDefaultTempo}</per-minute>
          </metronome>
        </direction-type>
        <sound tempo="${vocalScoreDefaultTempo}"/>
      </direction>
`
      : '';
    return `    <measure number="${index + 1}">
${attributes}${measure.map(buildMusicXmlNoteEvent).join('\n')}
    </measure>`;
  }).join('\n');
}

function buildVocalScoreMusicXml(notes, rests, summary) {
  const title = summary?.sourceName || 'Vocal Melody';
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>${escapeXml(title)}</work-title>
  </work>
  <part-list>
    <score-part id="P1">
      <part-name>Vocal</part-name>
    </score-part>
  </part-list>
  <part id="P1">
${buildMusicXmlMeasures(notes, rests)}
  </part>
</score-partwise>`;
}

function getStaffStepIndex(midi) {
  const info = getMidiInfo(midi);
  const stepOffsets = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  return (info.octave - 4) * 7 + stepOffsets[info.step];
}

function renderTrebleClef(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = '#263129';
  ctx.font = '56px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('𝄞', x, y + 16);
  ctx.restore();
}

function drawStaffLines(ctx, left, right, top, gap) {
  ctx.save();
  ctx.strokeStyle = '#d8d5c9';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = top + i * gap;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLedgerLines(ctx, x, y, staffTop, gap) {
  ctx.save();
  ctx.strokeStyle = '#9b9689';
  ctx.lineWidth = 1.2;
  const halfGap = gap / 2;
  const topLine = staffTop;
  const bottomLine = staffTop + gap * 4;
  if (y < topLine - halfGap) {
    for (let lineY = topLine - gap; lineY >= y - 1; lineY -= gap) {
      ctx.beginPath();
      ctx.moveTo(x - 13, lineY);
      ctx.lineTo(x + 13, lineY);
      ctx.stroke();
    }
  }
  if (y > bottomLine + halfGap) {
    for (let lineY = bottomLine + gap; lineY <= y + 1; lineY += gap) {
      ctx.beginPath();
      ctx.moveTo(x - 13, lineY);
      ctx.lineTo(x + 13, lineY);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawDurationBeam(ctx, x, y, durationMs, stemUp) {
  const type = musicXmlType(durationMs);
  if (type !== 'eighth' && type !== '16th') {
    return;
  }
  const stemX = x + (stemUp ? 9 : -9);
  const stemEnd = y + (stemUp ? -42 : 42);
  const flagDirection = stemUp ? 1 : -1;
  ctx.save();
  ctx.strokeStyle = '#263129';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(stemX, stemEnd);
  ctx.quadraticCurveTo(stemX + 18 * flagDirection, stemEnd + 8, stemX + 8 * flagDirection, stemEnd + 20);
  ctx.stroke();
  if (type === '16th') {
    ctx.beginPath();
    ctx.moveTo(stemX, stemEnd + 10 * (stemUp ? 1 : -1));
    ctx.quadraticCurveTo(stemX + 16 * flagDirection, stemEnd + 18, stemX + 7 * flagDirection, stemEnd + 28);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStaffNote(ctx, note, x, staffTop, gap) {
  const stepIndex = getStaffStepIndex(note.midi);
  const bottomLineStep = getStaffStepIndex(64); // E4, treble staff bottom line.
  const y = staffTop + gap * 4 - (stepIndex - bottomLineStep) * (gap / 2);
  const stemUp = stepIndex < getStaffStepIndex(71); // B4 center-ish.
  const info = getMidiInfo(note.midi);

  drawLedgerLines(ctx, x, y, staffTop, gap);

  ctx.save();
  ctx.fillStyle = '#192023';
  ctx.strokeStyle = '#192023';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(x, y, 9.5, 6.2, -0.28, 0, Math.PI * 2);
  ctx.fill();

  const stemX = x + (stemUp ? 8 : -8);
  ctx.beginPath();
  ctx.moveTo(stemX, y);
  ctx.lineTo(stemX, y + (stemUp ? -42 : 42));
  ctx.stroke();
  drawDurationBeam(ctx, x, y, note.durationMs, stemUp);

  if (info.alter) {
    ctx.font = '18px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(info.alter > 0 ? '♯' : '♭', x - 14, y);
  }

  ctx.fillStyle = '#5c655f';
  ctx.font = '11px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(formatJianpuNote(note), x, staffTop + gap * 5 + 18);
  ctx.restore();
  drawVocalScoreLyric(ctx, note.lyricText, x, staffTop + gap * 5 + 34, {
    font: '700 12px "Microsoft YaHei", "PingFang SC", sans-serif',
    lineHeight: 16,
    letterSpacing: 12,
    maxCharsPerLine: 3,
  });
}

function drawStaffRest(ctx, rest, x, staffTop, gap) {
  ctx.save();
  ctx.fillStyle = '#5c655f';
  ctx.font = '26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('𝄽', x, staffTop + gap * 2);
  ctx.font = '11px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(formatVocalScoreDuration(rest.durationMs), x, staffTop + gap * 5 + 18);
  ctx.restore();
}

function drawVocalScorePlaceholder() {
  if (!vocalScoreCanvas || !vocalScoreCtx) {
    return;
  }
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(760, Math.floor(vocalScoreSheet?.clientWidth || 760));
  const height = 220;
  vocalScoreCanvas.width = width * ratio;
  vocalScoreCanvas.height = height * ratio;
  vocalScoreCanvas.style.width = `${width}px`;
  vocalScoreCanvas.style.height = `${height}px`;
  vocalScoreCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  vocalScoreCtx.clearRect(0, 0, width, height);
  vocalScoreCtx.fillStyle = '#fcfbf7';
  vocalScoreCtx.fillRect(0, 0, width, height);
  drawStaffLines(vocalScoreCtx, 74, width - 26, 76, 12);
  renderTrebleClef(vocalScoreCtx, 42, 76);
  vocalScoreCtx.fillStyle = '#8a918a';
  vocalScoreCtx.font = '14px "Microsoft YaHei", "PingFang SC", sans-serif';
  vocalScoreCtx.textAlign = 'center';
  vocalScoreCtx.textBaseline = 'middle';
  vocalScoreCtx.fillText('上传歌曲后，这里会显示五线谱预览', width / 2, 154);
}

function getVocalScoreEvents() {
  const lyricAssignments = getVocalScoreLyricAssignments();
  return [
    ...vocalScoreNotes.map((note, index) => ({ kind: 'note', lyricText: lyricAssignments.get(index) || '', ...note })),
    ...vocalScoreRests.map((rest) => ({ kind: 'rest', ...rest })),
  ].sort((a, b) => a.startMs - b.startMs);
}

function getJianpuDurationStyle(durationMs) {
  const quarterMs = 60000 / vocalScoreDefaultTempo;
  const beats = durationMs / quarterMs;
  if (beats >= 3.75) return { underline: 0, extension: 3 };
  if (beats >= 1.75) return { underline: 0, extension: 1 };
  if (beats >= 0.85) return { underline: 0, extension: 0 };
  if (beats >= 0.42) return { underline: 1, extension: 0 };
  return { underline: 2, extension: 0 };
}

function drawJianpuOctaveDots(ctx, x, y, info) {
  if (!info.octaveDirection || !info.octaveDots) {
    return;
  }
  const dotY = info.octaveDirection === 'above' ? y - 28 : y + 21;
  const centerOffset = (info.octaveDots - 1) * 4;
  for (let i = 0; i < info.octaveDots; i += 1) {
    ctx.beginPath();
    ctx.arc(x - centerOffset + i * 8, dotY, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawJianpuUnderlines(ctx, x, y, width, count) {
  for (let i = 0; i < count; i += 1) {
    const lineY = y + 17 + i * 6;
    ctx.beginPath();
    ctx.moveTo(x - width / 2, lineY);
    ctx.lineTo(x + width / 2, lineY);
    ctx.stroke();
  }
}

function drawVocalScoreLyric(ctx, text, x, y, options = {}) {
  const clean = String(text || '').trim();
  if (!clean) {
    return;
  }
  const maxCharsPerLine = options.maxCharsPerLine || 4;
  const chars = Array.from(clean);
  const lines = [];
  for (let i = 0; i < chars.length; i += maxCharsPerLine) {
    lines.push(chars.slice(i, i + maxCharsPerLine).join(''));
  }

  ctx.save();
  ctx.fillStyle = options.color || '#ff7043';
  ctx.font = options.font || '700 14px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.slice(0, options.maxLines || 2).forEach((line, lineIndex) => {
    const lineY = y + lineIndex * (options.lineHeight || 20);
    if (Array.from(line).length <= 1) {
      ctx.fillText(line, x, lineY);
      return;
    }
    const lineChars = Array.from(line);
    const spacing = options.letterSpacing ?? 14;
    const startX = x - ((lineChars.length - 1) * spacing) / 2;
    lineChars.forEach((char, index) => {
      ctx.fillText(char, startX + index * spacing, lineY);
    });
  });
  ctx.restore();
}

function drawJianpuEvent(ctx, event, x, y) {
  const duration = getJianpuDurationStyle(event.durationMs);
  ctx.save();
  ctx.fillStyle = '#101417';
  ctx.strokeStyle = '#101417';
  ctx.lineWidth = 1.8;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 24px "Times New Roman", "Noto Serif SC", SimSun, serif';

  if (event.kind === 'rest') {
    ctx.fillText('0', x, y);
  } else {
    const info = getJianpuVisualInfo(event);
    if (info.accidental) {
      ctx.font = '600 13px "Times New Roman", serif';
      ctx.fillText(info.accidental, x - 14, y - 3);
      ctx.font = '700 24px "Times New Roman", "Noto Serif SC", SimSun, serif';
    }
    ctx.fillText(info.number, x, y);
    drawJianpuOctaveDots(ctx, x, y, info);
  }

  if (duration.underline) {
    drawJianpuUnderlines(ctx, x, y, 18, duration.underline);
  }
  for (let i = 0; i < duration.extension; i += 1) {
    ctx.fillText('-', x + 28 + i * 24, y);
  }
  ctx.restore();
  drawVocalScoreLyric(ctx, event.lyricText, x, y + 34, {
    font: '700 15px "Microsoft YaHei", "PingFang SC", sans-serif',
    lineHeight: 21,
    letterSpacing: 16,
  });
}

function drawJianpuPlaceholder() {
  if (!vocalScoreJianpuCanvas || !vocalScoreJianpuCtx) {
    return;
  }
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(760, Math.floor(vocalScoreJianpuSheet?.clientWidth || 760));
  const height = 260;
  vocalScoreJianpuCanvas.width = width * ratio;
  vocalScoreJianpuCanvas.height = height * ratio;
  vocalScoreJianpuCanvas.style.width = `${width}px`;
  vocalScoreJianpuCanvas.style.height = `${height}px`;
  vocalScoreJianpuCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  vocalScoreJianpuCtx.clearRect(0, 0, width, height);
  vocalScoreJianpuCtx.fillStyle = '#fffefa';
  vocalScoreJianpuCtx.fillRect(0, 0, width, height);
  vocalScoreJianpuCtx.fillStyle = '#8a918a';
  vocalScoreJianpuCtx.font = '15px "Microsoft YaHei", "PingFang SC", sans-serif';
  vocalScoreJianpuCtx.textAlign = 'center';
  vocalScoreJianpuCtx.textBaseline = 'middle';
  vocalScoreJianpuCtx.fillText('上传歌曲后，这里会显示简谱预览', width / 2, height / 2);
}

function renderJianpuScoreSheet() {
  if (!vocalScoreJianpuCanvas || !vocalScoreJianpuCtx) {
    return;
  }
  if (!vocalScoreNotes.length) {
    drawJianpuPlaceholder();
    return;
  }

  const ratio = window.devicePixelRatio || 1;
  const viewportWidth = Math.max(760, Math.floor(vocalScoreJianpuSheet?.clientWidth || 760));
  const width = viewportWidth;
  const left = 54;
  const right = width - 34;
  const beatWidth = 18;
  const minEventWidth = 30;
  const measureGap = 18;
  const rowHeight = songLyricsCharAlignment.length ? 122 : 92;
  const headerHeight = 112;
  const measureDuration = musicXmlDuration(60000 / vocalScoreDefaultTempo * 4);
  const events = getVocalScoreEvents();
  const rows = [];
  let row = [];
  let x = left;
  let currentMeasureDuration = 0;

  events.forEach((event) => {
    const duration = musicXmlDuration(event.durationMs);
    const style = getJianpuDurationStyle(event.durationMs);
    const lyricWidth = Array.from(event.lyricText || '').length * 16;
    const eventWidth = Math.max(minEventWidth, lyricWidth, duration / 480 * beatWidth + style.extension * 22);
    if (row.length && x + eventWidth + measureGap > right) {
      rows.push(row);
      row = [];
      x = left;
      currentMeasureDuration = 0;
    }
    row.push({ event, x: x + eventWidth / 2, width: eventWidth, barAfter: false });
    x += eventWidth;
    currentMeasureDuration += duration;
    if (currentMeasureDuration >= measureDuration - 1) {
      row[row.length - 1].barAfter = true;
      x += measureGap;
      currentMeasureDuration = 0;
    }
  });
  if (row.length) {
    row[row.length - 1].barAfter = true;
    rows.push(row);
  }

  const height = Math.max(300, headerHeight + rows.length * rowHeight + 42);
  vocalScoreJianpuCanvas.width = width * ratio;
  vocalScoreJianpuCanvas.height = height * ratio;
  vocalScoreJianpuCanvas.style.width = `${width}px`;
  vocalScoreJianpuCanvas.style.height = `${height}px`;
  vocalScoreJianpuCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  vocalScoreJianpuCtx.clearRect(0, 0, width, height);
  vocalScoreJianpuCtx.fillStyle = '#fffefa';
  vocalScoreJianpuCtx.fillRect(0, 0, width, height);

  vocalScoreJianpuCtx.save();
  vocalScoreJianpuCtx.fillStyle = '#101417';
  vocalScoreJianpuCtx.textAlign = 'center';
  vocalScoreJianpuCtx.textBaseline = 'middle';
  vocalScoreJianpuCtx.font = '700 24px "Noto Serif SC", SimSun, serif';
  vocalScoreJianpuCtx.fillText(vocalScoreSummary?.sourceName?.replace(/\.[^.]+$/, '') || '人声候选旋律谱', width / 2, 34);
  vocalScoreJianpuCtx.font = '14px "Times New Roman", "Microsoft YaHei", sans-serif';
  vocalScoreJianpuCtx.fillStyle = '#4f5652';
  vocalScoreJianpuCtx.textAlign = 'left';
  vocalScoreJianpuCtx.fillText('1=C    4/4    ♩=120', left, 72);
  vocalScoreJianpuCtx.textAlign = 'right';
  vocalScoreJianpuCtx.fillText(`${vocalScoreSummary.noteCount} 个音符 · 音域 ${frequencyToNote(frequencyFromMidi(vocalScoreSummary.lowest))}-${frequencyToNote(frequencyFromMidi(vocalScoreSummary.highest))}`, right, 72);
  vocalScoreJianpuCtx.restore();

  rows.forEach((items, rowIndex) => {
    const y = headerHeight + rowIndex * rowHeight;
    vocalScoreJianpuCtx.save();
    vocalScoreJianpuCtx.fillStyle = '#101417';
    vocalScoreJianpuCtx.font = '13px "Times New Roman", serif';
    vocalScoreJianpuCtx.textAlign = 'left';
    vocalScoreJianpuCtx.textBaseline = 'middle';
    vocalScoreJianpuCtx.fillText(`(${rowIndex * 4 + 1})`, 18, y);
    vocalScoreJianpuCtx.restore();

    items.forEach((item) => {
      drawJianpuEvent(vocalScoreJianpuCtx, item.event, item.x, y);
      if (item.barAfter) {
        const barX = Math.min(right, item.x + item.width / 2 + 9);
        vocalScoreJianpuCtx.save();
        vocalScoreJianpuCtx.strokeStyle = '#101417';
        vocalScoreJianpuCtx.lineWidth = 1.8;
        vocalScoreJianpuCtx.beginPath();
        vocalScoreJianpuCtx.moveTo(barX, y - 34);
        vocalScoreJianpuCtx.lineTo(barX, y + 34);
        vocalScoreJianpuCtx.stroke();
        vocalScoreJianpuCtx.restore();
      }
    });
  });

  if (vocalScoreJianpuSheet) {
    vocalScoreJianpuSheet.scrollTop = 0;
  }
}

function updateVocalScoreViewControls() {
  const isStaff = vocalScoreView === 'staff';
  if (vocalScoreSheet) {
    vocalScoreSheet.hidden = !isStaff;
  }
  if (vocalScoreJianpuSheet) {
    vocalScoreJianpuSheet.hidden = isStaff;
  }
  if (vocalScoreText) {
    vocalScoreText.hidden = true;
  }
  if (vocalScoreStaffViewButton) {
    vocalScoreStaffViewButton.classList.toggle('active', isStaff);
    vocalScoreStaffViewButton.setAttribute('aria-pressed', String(isStaff));
  }
  if (vocalScoreJianpuViewButton) {
    vocalScoreJianpuViewButton.classList.toggle('active', !isStaff);
    vocalScoreJianpuViewButton.setAttribute('aria-pressed', String(!isStaff));
  }
}

function setVocalScoreView(view) {
  vocalScoreView = view === 'jianpu' ? 'jianpu' : 'staff';
  updateVocalScoreViewControls();
  if (vocalScoreView === 'staff') {
    if (vocalScoreNotes.length) {
      renderVocalScoreSheet();
    } else {
      drawVocalScorePlaceholder();
    }
  } else if (vocalScoreNotes.length) {
    renderJianpuScoreSheet();
  } else {
    drawJianpuPlaceholder();
  }
}

function renderVocalScoreSheet() {
  if (!vocalScoreCanvas || !vocalScoreCtx) {
    return;
  }
  if (!vocalScoreNotes.length) {
    drawVocalScorePlaceholder();
    return;
  }

  const ratio = window.devicePixelRatio || 1;
  const events = getVocalScoreEvents();
  const contentWidth = Math.max(920, 140 + events.length * 42);
  const viewportWidth = Math.max(760, Math.floor(vocalScoreSheet?.clientWidth || 760));
  const width = Math.max(contentWidth, viewportWidth);
  const height = 260;
  const staffTop = 78;
  const gap = 12;
  const left = 88;
  const right = width - 32;
  const measureDuration = musicXmlDuration(60000 / vocalScoreDefaultTempo * 4);
  let currentMeasureDuration = 0;

  vocalScoreCanvas.width = width * ratio;
  vocalScoreCanvas.height = height * ratio;
  vocalScoreCanvas.style.width = `${width}px`;
  vocalScoreCanvas.style.height = `${height}px`;
  vocalScoreCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  vocalScoreCtx.clearRect(0, 0, width, height);
  vocalScoreCtx.fillStyle = '#fcfbf7';
  vocalScoreCtx.fillRect(0, 0, width, height);

  drawStaffLines(vocalScoreCtx, left, right, staffTop, gap);
  renderTrebleClef(vocalScoreCtx, 48, staffTop);

  vocalScoreCtx.save();
  vocalScoreCtx.fillStyle = '#5c655f';
  vocalScoreCtx.font = '12px "Microsoft YaHei", "PingFang SC", sans-serif';
  vocalScoreCtx.textAlign = 'left';
  vocalScoreCtx.fillText(`♩ = ${vocalScoreSummary?.tempo || vocalScoreDefaultTempo}`, left, 36);
  vocalScoreCtx.fillText(vocalScoreSummary?.sourceName || 'Vocal melody', left + 86, 36);
  vocalScoreCtx.restore();

  events.forEach((event, index) => {
    const x = left + 44 + index * 42;
    if (event.kind === 'note') {
      drawStaffNote(vocalScoreCtx, event, x, staffTop, gap);
    } else {
      drawStaffRest(vocalScoreCtx, event, x, staffTop, gap);
    }

    currentMeasureDuration += musicXmlDuration(event.durationMs);
    if (currentMeasureDuration >= measureDuration - 1 || index === events.length - 1) {
      const barX = Math.min(right, x + 24);
      vocalScoreCtx.save();
      vocalScoreCtx.strokeStyle = '#aaa496';
      vocalScoreCtx.lineWidth = 1.4;
      vocalScoreCtx.beginPath();
      vocalScoreCtx.moveTo(barX, staffTop);
      vocalScoreCtx.lineTo(barX, staffTop + gap * 4);
      vocalScoreCtx.stroke();
      vocalScoreCtx.restore();
      currentMeasureDuration = 0;
    }
  });

  if (vocalScoreSheet) {
    vocalScoreSheet.scrollLeft = 0;
  }
}

function setVocalScoreStatus(text, tone = 'neutral') {
  if (!vocalScoreStatus) {
    return;
  }
  vocalScoreStatus.textContent = text;
  vocalScoreStatus.style.color =
    tone === 'good' ? '#15803d' : tone === 'bad' ? '#b42318' : 'var(--muted)';
}

function updateVocalScoreButtons(enabled) {
  if (copyVocalScoreButton) copyVocalScoreButton.disabled = !enabled;
  if (downloadVocalScoreXmlButton) downloadVocalScoreXmlButton.disabled = !enabled;
  if (downloadVocalScoreCsvButton) downloadVocalScoreCsvButton.disabled = !enabled;
}

function resetVocalScore() {
  vocalScoreNotes = [];
  vocalScoreRests = [];
  vocalScoreSummary = null;
  vocalScoreSourceName = '';
  setVocalScoreStatus('上传歌曲后自动生成');
  if (vocalScoreText) {
    vocalScoreText.textContent = '上传歌曲后，会把主旋律音高整理成可读简谱，并可导出 MusicXML 到打谱软件继续编辑。';
  }
  updateVocalScoreViewControls();
  if (vocalScoreView === 'staff') {
    drawVocalScorePlaceholder();
  } else {
    drawJianpuPlaceholder();
  }
  updateVocalScoreButtons(false);
}

function buildVocalScoreFromSongPitchTrack(sourceName = '') {
  if (!songPitchTrack.length) {
    resetVocalScore();
    return;
  }

  const notes = buildVocalScoreSegments(songPitchTrack);
  const summary = summarizeVocalScore(notes, sourceName);
  if (!summary || notes.length < 3) {
    vocalScoreNotes = [];
    vocalScoreRests = [];
    vocalScoreSummary = null;
    setVocalScoreStatus('可用音符不足', 'bad');
    if (vocalScoreText) {
      vocalScoreText.textContent = '这首歌里可稳定识别的主旋律音符太少，建议换一段人声更清晰的音频再试。';
    }
    updateVocalScoreViewControls();
    if (vocalScoreView === 'staff') {
      drawVocalScorePlaceholder();
    } else {
      drawJianpuPlaceholder();
    }
    updateVocalScoreButtons(false);
    return;
  }

  vocalScoreNotes = notes;
  vocalScoreRests = buildVocalScoreRests(notes);
  vocalScoreSummary = summary;
  vocalScoreSourceName = sourceName;
  if (vocalScoreText) {
    vocalScoreText.textContent = renderVocalScoreText(notes, summary);
  }
  setVocalScoreStatus(`已生成 ${summary.noteCount} 个音符`, 'good');
  updateVocalScoreViewControls();
  if (vocalScoreView === 'staff') {
    renderVocalScoreSheet();
  } else {
    renderJianpuScoreSheet();
  }
  updateVocalScoreButtons(true);
}

async function copyVocalScoreText() {
  if (!vocalScoreNotes.length || !vocalScoreText) {
    return;
  }
  await navigator.clipboard.writeText(vocalScoreText.textContent);
  setVocalScoreStatus('简谱已复制', 'good');
}

function getVocalScoreDownloadBaseName() {
  const clean = (vocalScoreSourceName || 'vocal-melody')
    .replace(/\.[^.]+$/, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .trim();
  return clean || `vocal-melody-${formatTimestamp(new Date())}`;
}

function downloadVocalScoreMusicXml() {
  if (!vocalScoreNotes.length || !vocalScoreSummary) {
    return;
  }
  const xml = buildVocalScoreMusicXml(vocalScoreNotes, vocalScoreRests, vocalScoreSummary);
  downloadBlob(new Blob([xml], { type: 'application/vnd.recordare.musicxml+xml;charset=utf-8' }), `${getVocalScoreDownloadBaseName()}.musicxml`);
}

function downloadVocalScoreCsv() {
  if (!vocalScoreNotes.length) {
    return;
  }
  const csv = buildVocalScoreCsv(vocalScoreNotes);
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${getVocalScoreDownloadBaseName()}-notes.csv`);
}
