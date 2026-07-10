const SONG_ANALYSIS_FRAME_SECONDS = 0.046;
const SONG_ANALYSIS_HOP_SECONDS = 0.023;
const SONG_ANALYSIS_MIN_SEGMENT_SECONDS = 1.4;
const SONG_ANALYSIS_MAX_SEGMENT_SECONDS = 10;

let songAnalysisState = {
  result: null,
  audioUrl: null,
  audioFile: null,
  selectedSegment: null,
  requirement: null,
  sourceRecordingId: null,
  segmentsExpanded: false,
  segmentSort: 'recommended',
  segmentFilter: 'all',
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

function songAnalysisHzToNoteName(frequency) {
  if (!Number.isFinite(frequency) || frequency <= 0) return '--';
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const octave = Math.floor(midi / 12) - 1;
  return `${noteNames[((midi % 12) + 12) % 12]}${octave}`;
}

function songAnalysisSkillLabel(skill) {
  const labels = {
    pitch_stability: '音准稳定',
    breath_control: '气息控制',
    mixed_voice: '混声与高音闭合',
    rhythm_accuracy: '节奏准确',
    diction: '咬字清晰',
    register_transition: '声区转换',
    tone_control: '音色控制',
  };
  return labels[skill] || skill;
}

function songAnalysisSkillDemandLabel(skill) {
  const labels = {
    pitch_stability: '音准落点',
    breath_control: '长句气息',
    mixed_voice: '高音区闭合',
    rhythm_accuracy: '节奏入口',
    diction: '快歌词咬字',
    register_transition: '声区转换',
    tone_control: '音色控制',
  };
  return labels[skill] || songAnalysisSkillLabel(skill);
}

function songAnalysisStars(score) {
  const filled = songAnalysisClamp(Math.round((score || 0) * 5), 1, 5);
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
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

function getSongAnalysisTaskSkills(segment, context) {
  const skills = [];
  const highThreshold = context.highPressureHz || 440;
  if (segment.jump_count >= 1 || segment.pitch_range >= 150) skills.push('pitch_stability');
  if (segment.duration >= 6 || segment.long_note_count >= 1) skills.push('breath_control');
  if (segment.max_pitch >= highThreshold || segment.pitch_range >= 220) skills.push('mixed_voice');
  if (segment.note_density >= 5.2 || (context.bpm || 0) >= 135) skills.push('rhythm_accuracy');
  if (segment.note_density >= 6.4) skills.push('diction');
  if (segment.pitch_range >= 190) skills.push('register_transition');
  if (segment.long_note_count >= 1 || segment.max_pitch >= highThreshold) skills.push('tone_control');
  if (!skills.length) skills.push('pitch_stability');
  return [...new Set(skills)].slice(0, 4);
}

function getSongAnalysisDiagnosticFocus(skills, segment) {
  if (skills.includes('mixed_voice')) return '高音区闭合、混声稳定和音准落点';
  if (skills.includes('breath_control')) return '长句气流、尾音稳定和换气位置';
  if (skills.includes('rhythm_accuracy')) return '快节奏入口、拍点稳定和拖拍风险';
  if (skills.includes('diction')) return '快歌词里的辅音清晰度和元音统一';
  if (skills.includes('register_transition')) return '跨声区时音色不断层';
  if (segment.jump_count >= 1) return '大跳后的音准落点';
  return '短句音准和声音可复现性';
}

function getSongAnalysisPracticeInstruction(skills) {
  if (skills.includes('mixed_voice')) return '先只练最高音前后两个音，保持音高稳定，不追求音量。';
  if (skills.includes('breath_control')) return '先用轻声连贯唱完整句，在句中标出一个最自然的换气点。';
  if (skills.includes('rhythm_accuracy')) return '先慢速念节奏，再用半速唱，确认每个入口都在拍子里。';
  if (skills.includes('diction')) return '先把歌词当绕口令轻声念清楚，再加旋律，不要急着加力量。';
  if (skills.includes('register_transition')) return '先用哼鸣滑过这个音区，再换成原歌词，保持音色不断开。';
  return '先缩小到两个音反复唱，确认每次起音和落点都一致。';
}

function getSongAnalysisTaskTitle(skills, segment, context) {
  const high = segment.max_pitch >= (context.highPressureHz || 440);
  if (high && segment.note_density >= 5.2) return '副歌高音入口';
  if (high && segment.long_note_count >= 1) return '连续高音保持';
  if (skills.includes('register_transition')) return '换声点过渡';
  if (skills.includes('breath_control')) return '长句尾音稳定';
  if (skills.includes('diction')) return '快歌词咬字';
  if (segment.jump_count >= 1) return '大跳音准落点';
  if (skills.includes('rhythm_accuracy')) return '节奏入口稳定';
  return '短句稳定复现';
}

function getSongAnalysisCoreProblem(skills, segment) {
  if (skills.includes('mixed_voice')) return '高音附近容易为了音量牺牲闭合和音准。';
  if (skills.includes('register_transition')) return '旋律跨过换声区，音色和位置容易断开。';
  if (skills.includes('breath_control')) return '句子偏长，尾音容易没气或拖拍。';
  if (skills.includes('diction')) return '音符密度高，歌词容易糊在一起。';
  if (skills.includes('rhythm_accuracy')) return '入口和拍点容易提前或滞后。';
  if (segment.jump_count >= 1) return '大跳后落点需要更明确的听觉参照。';
  return '这个片段适合用来建立稳定起音和落点。';
}

function getSongAnalysisPracticeGoal(skills) {
  if (skills.includes('mixed_voice')) return '只练最高音前后两个音，先稳闭合，再加音量。';
  if (skills.includes('register_transition')) return '用轻声滑过换声点，保持同一个元音位置。';
  if (skills.includes('breath_control')) return '一口气唱完短句，尾音不塌、不抖、不拖。';
  if (skills.includes('diction')) return '先半速念清辅音，再把旋律加回去。';
  if (skills.includes('rhythm_accuracy')) return '只练入口两拍，确认每次都踩在拍内。';
  return '缩小成两个音反复唱，做到每次都一致。';
}

function getSongAnalysisRouteStep(task, index) {
  const time = `${songAnalysisFormatTime(task.start_time)}-${songAnalysisFormatTime(task.end_time)}`;
  if (task.required_skill.includes('mixed_voice')) return `先练 ${time} 最高音前后两个音`;
  if (task.required_skill.includes('rhythm_accuracy')) return `再练 ${time} 入口和拍点`;
  if (task.required_skill.includes('register_transition')) return `再练 ${time} 换声点过渡`;
  if (task.required_skill.includes('breath_control')) return `最后练 ${time} 长句尾音稳定`;
  if (task.required_skill.includes('diction')) return `再练 ${time} 快歌词咬字`;
  return `${index === 0 ? '先' : '再'}练 ${time} 短句稳定`;
}

function buildSongAnalysisPrimitiveTask(segment, index, context) {
  const skills = getSongAnalysisTaskSkills(segment, context);
  const taskTitle = getSongAnalysisTaskTitle(skills, segment, context);
  return {
    task_id: `task_${String(index + 1).padStart(3, '0')}`,
    segment_id: segment.id,
    start_time: segment.start_time,
    end_time: segment.end_time,
    lyric: segment.lyric || '暂无歌词',
    title: taskTitle,
    required_skill: skills,
    difficulty: songAnalysisClamp(Math.round(segment.difficulty_score / 22) + 1, 1, 5),
    diagnostic_focus: getSongAnalysisDiagnosticFocus(skills, segment),
    core_problem: getSongAnalysisCoreProblem(skills, segment),
    practice_goal: getSongAnalysisPracticeGoal(skills),
    practice_instruction: getSongAnalysisPracticeInstruction(skills),
  };
}

function buildSongRequirementDifficultyReasons({ highSegments, longSegments, denseSegments, registerSegments, jumpSegments, highest }) {
  const reasons = [];
  if (highSegments.length >= 2 || highest >= 440) reasons.push('连续高音多');
  if (highSegments.length > 0) reasons.push('混声和闭合要求高');
  if (registerSegments.length > 0) reasons.push('换声点集中');
  if (longSegments.length > 0) reasons.push('长句需要稳定气息');
  if (denseSegments.length > 0) reasons.push('快字和入口节奏容易乱');
  if (jumpSegments.length > 0) reasons.push('大跳落点容易跑音');
  return reasons.slice(0, 4);
}

function buildSongRequirementSummary(topSkills, difficultyReasons) {
  const primary = topSkills[0]?.skill;
  if (primary === 'mixed_voice') return '这首歌最大的挑战不是音高本身，而是高音区闭合和混声稳定。';
  if (primary === 'breath_control') return '这首歌最容易卡在长句气息和尾音稳定，不建议一开始就唱整首。';
  if (primary === 'rhythm_accuracy') return '这首歌的核心难点是入口节奏和快字密度，先把拍点唱稳。';
  if (primary === 'register_transition') return '这首歌最需要处理换声点，目标是让音色不断层。';
  if (difficultyReasons.length) return `这首歌先抓 ${difficultyReasons[0]}，其它问题可以放到第二轮。`;
  return '这首歌适合从短句稳定开始，先确认音准和起音一致。';
}

function buildSongRequirementTrainingMap(result, requirement, challengeTaskIds) {
  const challengeSet = new Set(challengeTaskIds);
  const taskBySegment = new Map(requirement.primitive_vocal_tasks.map((task) => [task.segment_id, task]));
  return (result.segments || []).map((segment) => {
    const task = taskBySegment.get(segment.id);
    let level = 'easy';
    if (segment.difficulty_score >= 62 || task?.difficulty >= 4) level = 'hard';
    else if (segment.difficulty_score >= 34 || task?.difficulty >= 3) level = 'medium';
    return {
      segment_id: segment.id,
      task_id: task?.task_id || null,
      start_time: segment.start_time,
      end_time: segment.end_time,
      level,
      is_key_challenge: Boolean(task && challengeSet.has(task.task_id)),
      label: task?.title || `${songAnalysisFormatTime(segment.start_time)}-${songAnalysisFormatTime(segment.end_time)}`,
    };
  });
}

function buildSongRequirement(result) {
  const segments = result.segments || [];
  const pitches = (result.pitch_contour || [])
    .map((point) => point.pitch)
    .filter((pitch) => Number.isFinite(pitch) && pitch > 0);
  const lowest = pitches.length ? songAnalysisPercentile(pitches, 0.03) : 0;
  const highest = pitches.length ? songAnalysisPercentile(pitches, 0.97) : 0;
  const mainLow = pitches.length ? songAnalysisPercentile(pitches, 0.25) : 0;
  const mainHigh = pitches.length ? songAnalysisPercentile(pitches, 0.75) : 0;
  const avgDifficulty = songAnalysisMean(segments.map((segment) => segment.difficulty_score));
  const maxDifficulty = Math.max(...segments.map((segment) => segment.difficulty_score), 0);
  const highPressureHz = Math.max(420, mainHigh + 35);
  const highSegments = segments.filter((segment) => segment.max_pitch >= highPressureHz);
  const longSegments = segments.filter((segment) => segment.duration >= 6 || segment.long_note_count >= 1);
  const jumpSegments = segments.filter((segment) => segment.jump_count >= 1 || segment.pitch_range >= 150);
  const denseSegments = segments.filter((segment) => segment.note_density >= 5.2);
  const registerSegments = segments.filter((segment) => segment.pitch_range >= 190);
  const overallDifficulty = songAnalysisClamp(Math.round(1 + avgDifficulty / 26 + maxDifficulty / 55 + highSegments.length / 4), 1, 5);
  const requiredSkills = {
    pitch_stability: songAnalysisClamp((avgDifficulty / 100) + (jumpSegments.length / Math.max(segments.length, 1)) * 0.55, 0.15, 0.98),
    breath_control: songAnalysisClamp((longSegments.length / Math.max(segments.length, 1)) * 0.65 + Math.max(0, songAnalysisMean(segments.map((segment) => segment.duration)) - 4) / 8, 0.1, 0.96),
    mixed_voice: songAnalysisClamp((highSegments.length / Math.max(segments.length, 1)) * 0.75 + Math.max(0, highest - 380) / 260, 0.08, 0.98),
    rhythm_accuracy: songAnalysisClamp((denseSegments.length / Math.max(segments.length, 1)) * 0.65 + Math.max(0, (result.bpm || 100) - 105) / 130, 0.1, 0.94),
    diction: songAnalysisClamp(songAnalysisMean(segments.map((segment) => segment.note_density)) / 9, 0.1, 0.9),
    register_transition: songAnalysisClamp((registerSegments.length / Math.max(segments.length, 1)) * 0.7 + Math.max(0, highest - lowest - 220) / 360, 0.08, 0.94),
    tone_control: songAnalysisClamp((highSegments.length + longSegments.length) / Math.max(segments.length * 2, 1) * 0.7 + avgDifficulty / 220, 0.12, 0.92),
  };
  const topSkills = Object.entries(requiredSkills)
    .sort((left, right) => right[1] - left[1])
    .map(([skill, score]) => ({ skill, score }));
  const difficultyReasons = buildSongRequirementDifficultyReasons({
    highSegments,
    longSegments,
    denseSegments,
    registerSegments,
    jumpSegments,
    highest,
  });
  const challengeSegments = segments
    .slice()
    .sort((left, right) => {
      const leftScore = left.difficulty_score + left.jump_count * 7 + left.long_note_count * 8 + Math.max(0, left.max_pitch - highPressureHz) / 4;
      const rightScore = right.difficulty_score + right.jump_count * 7 + right.long_note_count * 8 + Math.max(0, right.max_pitch - highPressureHz) / 4;
      return rightScore - leftScore;
    })
    .slice(0, songAnalysisClamp(Math.max(3, Math.min(8, segments.length)), 0, 8));
  const primitiveTasks = challengeSegments.map((segment, index) => buildSongAnalysisPrimitiveTask(segment, index, {
    bpm: result.bpm,
    highPressureHz,
  }));
  const keyChallenges = primitiveTasks.map((task) => {
    const segment = segments.find((item) => item.id === task.segment_id) || {};
    return {
      id: `challenge_${task.task_id}`,
      segment_id: task.segment_id,
      start_time: task.start_time,
      end_time: task.end_time,
      title: task.title,
      core_problem: task.core_problem,
      practice_goal: task.practice_goal,
      reason: `${task.practice_goal} 难度 ${task.difficulty}/5。`,
      required_skill: task.required_skill,
      difficulty: task.difficulty,
      score: segment.difficulty_score || 0,
    };
  });
  const recommendedOrder = primitiveTasks
    .slice()
    .sort((left, right) => (left.difficulty - right.difficulty) || (left.end_time - left.start_time) - (right.end_time - right.start_time))
    .map((task, index) => ({
      order: index + 1,
      task_id: task.task_id,
      segment_id: task.segment_id,
      title: getSongAnalysisRouteStep(task, index),
      purpose: task.practice_goal,
      instruction: task.practice_instruction,
    }));
  const trainingMap = buildSongRequirementTrainingMap(result, { primitive_vocal_tasks: primitiveTasks }, primitiveTasks.map((task) => task.task_id));
  return {
    song_id: result.song_id,
    song_name: result.name,
    ai_summary: buildSongRequirementSummary(topSkills, difficultyReasons),
    overall_difficulty: overallDifficulty,
    difficulty_reasons: difficultyReasons,
    today_focus: topSkills.slice(0, 3).map((item) => songAnalysisSkillDemandLabel(item.skill)),
    required_skills: requiredSkills,
    range_requirement: {
      lowest_note: songAnalysisHzToNoteName(lowest),
      highest_note: songAnalysisHzToNoteName(highest),
      lowest_hz: Math.round(lowest || 0),
      highest_hz: Math.round(highest || 0),
      main_tessitura: `${songAnalysisHzToNoteName(mainLow)}-${songAnalysisHzToNoteName(mainHigh)}`,
      high_note_pressure: highSegments.length > 0 || highest >= 440,
    },
    pitch_requirement: {
      has_large_leaps: jumpSegments.length > 0,
      large_leap_segments: jumpSegments.slice(0, 5).map((segment) => segment.id),
      likely_pitch_risk: jumpSegments.slice(0, 4).map((segment) => `${songAnalysisFormatTime(segment.start_time)}-${songAnalysisFormatTime(segment.end_time)}`),
      summary: jumpSegments.length ? '有跳进或跨音区片段，落点容易飘。' : '旋律线相对平稳，重点是保持每句起音一致。',
    },
    rhythm_requirement: {
      bpm: result.bpm,
      has_fast_passages: denseSegments.length > 0,
      long_note_risk: longSegments.length > 0,
      summary: denseSegments.length ? '存在音符密度较高的片段，需要先慢速确认拍点。' : '节奏密度不算高，注意长音不要拖拍。',
    },
    breath_requirement: {
      long_phrase_segments: longSegments.map((segment) => segment.id),
      suggested_breath_points: (result.pauses || []).slice(0, 8).map((pause) => Number(pause.center.toFixed(2))),
      needs_stable_airflow: longSegments.length > 0 || highSegments.length > 0,
      summary: longSegments.length ? '长句和尾音需要稳定气流，先规划换气点。' : '句子长度中等，主要保持起音前吸气安静。',
    },
    diction_requirement: {
      fast_lyric_risk: denseSegments.length > 0,
      dense_consonant_risk: denseSegments.length > 1,
      hard_vowel_risk: highSegments.length > 0,
      summary: denseSegments.length ? '快歌词位置先念清楚，再加旋律。' : '咬字压力较低，保持元音统一即可。',
    },
    register_requirement: {
      chest_voice: lowest > 0,
      head_voice: highest >= 420,
      falsetto: highest >= 520,
      mixed_voice: highSegments.length > 0,
      passaggio_risk: registerSegments.length > 0,
      summary: registerSegments.length ? '跨区片段需要提前处理换声点。' : '声区跨度不大，先做稳定音准。',
    },
    tone_requirement: {
      bright: denseSegments.length > 0,
      soft_control: longSegments.length > 0,
      closure: highSegments.length > 0,
      breathy_control: longSegments.length > 0,
      power: highSegments.length > 1,
      summary: highSegments.length ? '高音位置需要闭合和力量感，但先不要追求大音量。' : '音色以稳定、柔和和清晰为主。',
    },
    key_challenges: keyChallenges,
    primitive_vocal_tasks: primitiveTasks,
    recommended_training_order: recommendedOrder,
    training_map: trainingMap,
    generated_by: 'rule_based_v1',
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
  const result = {
    song_id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    duration,
    bpm,
    pitch_contour: frames.map((frame) => ({ time: frame.time, pitch: frame.pitch })),
    energy_curve: frames.map((frame) => ({ time: frame.time, energy: frame.rms })),
    pauses: detectSongAnalysisPauses(frames),
    segments,
  };
  result.song_requirement = buildSongRequirement(result);
  return result;
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
  document.getElementById('songAnalysisRequirementPanel').hidden = false;
  document.getElementById('songAnalysisSegmentsPanel').hidden = false;
  document.getElementById('songAnalysisSongName').textContent = result.name;
  document.getElementById('songAnalysisSongMeta').textContent = `${songAnalysisFormatTime(result.duration)} · ${result.bpm || '--'} BPM`;
  document.getElementById('songAnalysisDuration').textContent = songAnalysisFormatTime(result.duration);
  document.getElementById('songAnalysisBpm').textContent = result.bpm || '--';
  document.getElementById('songAnalysisSegmentCount').textContent = result.segments.length;
  songAnalysisState.requirement = result.song_requirement || null;
  window.currentSongRequirement = songAnalysisState.requirement;
  renderSongRequirement(songAnalysisState.requirement, result);
  renderSongAnalysisSegments(result);
  drawSongAnalysisWaveform(result);
}

function getSongRequirementTopSkills(requirement, count = 3) {
  return Object.entries(requirement?.required_skills || {})
    .sort((left, right) => right[1] - left[1])
    .slice(0, count)
    .map(([skill, score]) => ({ skill, score }));
}

function setSongAnalysisText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function renderSongRequirementTeacherCard(task, requirement, result) {
  const card = document.getElementById('songRequirementTodayTaskCard');
  if (!card) return;
  if (!task) {
    card.innerHTML = `
      <span class="game-label">今日任务</span>
      <h2>先做短句稳定</h2>
      <p>这首歌暂时没有明显单点难题，今天先从最短、最容易复现的片段开始。</p>
    `;
    return;
  }
  card.innerHTML = `
    <span class="game-label">今日任务</span>
    <h2>${task.title || task.diagnostic_focus}</h2>
    <strong>${songAnalysisFormatTime(task.start_time)}-${songAnalysisFormatTime(task.end_time)}</strong>
    <div>
      <span>为什么练这里</span>
      <p>${task.core_problem || requirement.ai_summary || task.diagnostic_focus}</p>
    </div>
    <div>
      <span>今天目标</span>
      <p>${task.practice_goal || task.practice_instruction}</p>
    </div>
    <button type="button">开始练习</button>
  `;
  card.querySelector('button')?.addEventListener('click', () => setSongAnalysisPracticeTask(task, result));
}

function renderSongRequirementSummaryLine(requirement, topSkills) {
  const skills = (requirement.today_focus || topSkills.map((item) => songAnalysisSkillDemandLabel(item.skill)))
    .slice(0, 3)
    .join('、');
  setSongAnalysisText('songRequirementSummaryLine', `这首歌难度 ${requirement.overall_difficulty}/5，主要难在：${skills || '短句稳定'}。`);
}

function renderSongRequirementNextStep(currentTask, requirement, result) {
  const box = document.getElementById('songRequirementNextStep');
  if (!box) return;
  const next = (requirement.primitive_vocal_tasks || []).find((task) => task.task_id !== currentTask?.task_id);
  box.hidden = !next;
  if (!next) return;
  box.innerHTML = `
    <span>当前任务完成后，下一步</span>
    <button type="button">${songAnalysisFormatTime(next.start_time)}-${songAnalysisFormatTime(next.end_time)} ${next.title || next.diagnostic_focus}</button>
  `;
  box.querySelector('button')?.addEventListener('click', () => setSongAnalysisPracticeTask(next, result));
}

function renderSongRequirement(requirement, result) {
  if (!requirement) return;
  const topSkills = getSongRequirementTopSkills(requirement);
  const stuck = requirement.key_challenges?.[0];
  const todayTasks = getSongRequirementTodayTasks(requirement);
  renderSongRequirementTeacherCard(todayTasks[0], requirement, result);
  renderSongRequirementSummaryLine(requirement, topSkills);
  renderSongRequirementNextStep(todayTasks[0], requirement, result);
  setSongAnalysisText('songRequirementAiSummary', requirement.ai_summary || '这首歌先从最明显的难点开始，不需要一上来唱整首。');
  setSongAnalysisText('songRequirementDifficulty', `${requirement.overall_difficulty}/5`);

  const reasonList = document.getElementById('songRequirementDifficultyReasons');
  if (reasonList) {
    reasonList.innerHTML = (requirement.difficulty_reasons || [])
      .map((reason) => `<li>${reason}</li>`)
      .join('');
  }

  const todayFocus = document.getElementById('songRequirementTodayFocus');
  if (todayFocus) {
    todayFocus.innerHTML = (requirement.today_focus || topSkills.map((item) => songAnalysisSkillDemandLabel(item.skill)))
      .slice(0, 3)
      .map((focus) => `<li>${focus}</li>`)
      .join('');
  }

  const skillList = document.getElementById('songRequirementTopSkills');
  if (skillList) {
    skillList.innerHTML = topSkills
      .map((item) => `<span><b>${songAnalysisSkillDemandLabel(item.skill)}</b><small>歌曲需求强度 ${songAnalysisStars(item.score)}</small></span>`)
      .join('');
  }

  setSongAnalysisText('songRequirementStuckPoint', stuck
    ? `${songAnalysisFormatTime(stuck.start_time)}-${songAnalysisFormatTime(stuck.end_time)}：${stuck.title}。${stuck.core_problem || ''}`
    : '这首歌暂时没有明显高风险片段。');

  const range = requirement.range_requirement;
  setSongAnalysisText('songRequirementRange',
    `${range.lowest_note}-${range.highest_note}，主要音区 ${range.main_tessitura}。${range.high_note_pressure ? '有高音压力。' : '高音压力不明显。'}`);
  setSongAnalysisText('songRequirementPitch', requirement.pitch_requirement.summary);
  setSongAnalysisText('songRequirementRhythm', requirement.rhythm_requirement.summary);
  setSongAnalysisText('songRequirementBreath', requirement.breath_requirement.summary);
  setSongAnalysisText('songRequirementDiction', requirement.diction_requirement.summary);
  setSongAnalysisText('songRequirementRegister', requirement.register_requirement.summary);
  setSongAnalysisText('songRequirementTone', requirement.tone_requirement.summary);

  renderSongRequirementMiniTimeline(requirement, result);
  renderSongRequirementTimeline(requirement, result);
  renderSongRequirementRoute(requirement, result);
  renderSongRequirementTasks(requirement, result);
}

function getSongRequirementVisibleTasks(requirement) {
  return (requirement.primitive_vocal_tasks || [])
    .slice()
    .sort((left, right) => (right.difficulty - left.difficulty) || (left.start_time - right.start_time))
    .slice(0, 6)
    .sort((left, right) => left.start_time - right.start_time);
}

function renderSongRequirementMiniTimeline(requirement, result) {
  const timeline = document.getElementById('songRequirementMiniTimeline');
  if (!timeline) return;
  timeline.innerHTML = '';
  const duration = Math.max(result.duration || 1, 1);
  const start = document.createElement('span');
  start.className = 'song-requirement-mini-time start';
  start.textContent = '0:00';
  const line = document.createElement('div');
  line.className = 'song-requirement-mini-line';
  const end = document.createElement('span');
  end.className = 'song-requirement-mini-time end';
  end.textContent = songAnalysisFormatTime(duration).replace(/\.0$/, '');
  getSongRequirementVisibleTasks(requirement).forEach((task, index) => {
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = `song-requirement-mini-marker ${task.difficulty >= 4 ? 'hard' : 'medium'}`;
    marker.dataset.taskId = task.task_id;
    marker.style.left = `${songAnalysisClamp((task.start_time / duration) * 100, 1, 96)}%`;
    marker.title = `${songAnalysisFormatTime(task.start_time)}-${songAnalysisFormatTime(task.end_time)} ${task.title || task.diagnostic_focus}`;
    marker.textContent = String(index + 1);
    marker.addEventListener('click', () => showSongRequirementMiniTask(task, result));
    line.append(marker);
  });
  timeline.append(start, line, end);
  const firstTask = getSongRequirementVisibleTasks(requirement)[0];
  if (firstTask) showSongRequirementMiniTask(firstTask, result, { scroll: false });
}

function showSongRequirementMiniTask(task, result, options = {}) {
  if (!task) return;
  document.querySelectorAll('.song-requirement-mini-marker').forEach((marker) => {
    marker.classList.toggle('active', marker.dataset.taskId === task.task_id);
  });
  highlightSongRequirementTask(task.task_id, { scroll: Boolean(options.scroll) });
  const detail = document.getElementById('songRequirementMiniDetail');
  if (!detail) return;
  detail.hidden = false;
  detail.innerHTML = `
    <div>
      <span class="game-label">${songAnalysisFormatTime(task.start_time)}-${songAnalysisFormatTime(task.end_time)} · 难度 ${task.difficulty}/5</span>
      <h3>${task.title || task.diagnostic_focus}</h3>
      <p><strong>核心问题：</strong>${task.core_problem || task.diagnostic_focus}</p>
      <p><strong>练习目标：</strong>${task.practice_goal || task.practice_instruction}</p>
    </div>
    <button type="button" class="secondary">进入练习</button>
  `;
  detail.querySelector('button')?.addEventListener('click', () => setSongAnalysisPracticeTask(task, result));
}

function renderSongRequirementTimeline(requirement, result) {
  const timeline = document.getElementById('songRequirementTimeline');
  if (!timeline) return;
  timeline.innerHTML = '';
  const duration = Math.max(result.duration || 1, 1);
  (requirement.training_map || []).forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `song-requirement-time-slice ${item.level}${item.is_key_challenge ? ' key' : ''}`;
    button.style.flexGrow = Math.max(item.end_time - item.start_time, 0.5);
    button.title = `${songAnalysisFormatTime(item.start_time)}-${songAnalysisFormatTime(item.end_time)} ${item.label}`;
    button.innerHTML = `<span>${songAnalysisFormatTime(item.start_time)}</span>${item.is_key_challenge ? '<i></i>' : ''}`;
    button.addEventListener('click', () => {
      if (item.task_id) {
        const task = requirement.primitive_vocal_tasks.find((entry) => entry.task_id === item.task_id);
        if (task) showSongRequirementMiniTask(task, result, { scroll: true });
      } else {
        const segment = result.segments.find((entry) => entry.id === item.segment_id);
        if (segment) playSongAnalysisSegment(segment);
      }
    });
    timeline.append(button);
  });
  timeline.style.setProperty('--song-duration', String(duration));
}
function renderSongRequirementRoute(requirement, result) {
  const orderList = document.getElementById('songRequirementOrderList');
  if (!orderList) return;
  orderList.innerHTML = '';
  requirement.recommended_training_order.slice(0, 5).forEach((item) => {
    const task = requirement.primitive_vocal_tasks.find((entry) => entry.task_id === item.task_id);
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'song-requirement-route-step';
    row.innerHTML = `
      <strong>${item.order}</strong>
      <span>${item.title}</span>
      <small>${item.purpose || task?.practice_goal || ''}</small>
    `;
    row.addEventListener('click', () => highlightSongRequirementTask(item.task_id));
    orderList.append(row);
  });
}

function scoreSongRequirementTodayTask(task, index) {
  const skillText = (task.required_skill || []).join(' ');
  let score = 0;
  score += (task.difficulty || 1) * 14;
  score += Math.max(0, 6 - Math.abs((task.difficulty || 1) - 3)) * 6;
  if (/mixed_voice|register_transition/.test(skillText)) score += 16;
  if (/pitch_stability|breath_control/.test(skillText)) score += 10;
  if (/rhythm_accuracy|diction/.test(skillText)) score += 6;
  score += Math.max(0, 8 - index) * 3;
  return score;
}

function getSongRequirementTodayTasks(requirement) {
  const ranked = (requirement.primitive_vocal_tasks || [])
    .map((task, index) => ({ task, score: scoreSongRequirementTodayTask(task, index) }))
    .sort((left, right) => right.score - left.score);
  if (!ranked.length) return [];
  const today = [ranked[0].task];
  const second = ranked[1];
  if (second && second.score >= ranked[0].score * 0.92) {
    const firstSkills = new Set(ranked[0].task.required_skill || []);
    const hasDifferentFocus = (second.task.required_skill || []).some((skill) => !firstSkills.has(skill));
    if (hasDifferentFocus || second.task.difficulty === ranked[0].task.difficulty) today.push(second.task);
  }
  return today.slice(0, 2);
}

function createSongRequirementTaskCard(task, result, options = {}) {
  const item = document.createElement('article');
  item.className = `song-requirement-task-card${options.today ? ' today' : ''}`;
  item.dataset.taskId = task.task_id;
  item.innerHTML = `
    <div>
      <span class="game-label">${options.today ? '⭐ 今日推荐难点 · ' : ''}${songAnalysisFormatTime(task.start_time)}-${songAnalysisFormatTime(task.end_time)} · 难度 ${task.difficulty}/5</span>
      <h3>${task.title || task.diagnostic_focus}</h3>
      <p>${task.core_problem || task.diagnostic_focus}</p>
      <p><strong>今天目标：</strong>${task.practice_goal || task.practice_instruction}</p>
      ${options.today ? '' : `<div class="song-analysis-tags">${task.required_skill.map((skill) => `<span>${songAnalysisSkillLabel(skill)}</span>`).join('')}</div>`}
    </div>
    <button type="button" class="secondary">进入练习</button>
  `;
  item.querySelector('button').addEventListener('click', () => setSongAnalysisPracticeTask(task, result));
  return item;
}

function renderSongRequirementTasks(requirement, result) {
  const taskList = document.getElementById('songRequirementTaskList');
  if (!taskList) return;
  taskList.innerHTML = '';
  const tasks = requirement.primitive_vocal_tasks || [];
  const todayTasks = getSongRequirementTodayTasks(requirement);

  const intro = document.createElement('div');
  intro.className = 'song-requirement-one-thing';
  intro.innerHTML = '<strong>今天只做一件事</strong><span>先解决最可能带来进步的片段，完成后再看下一个。</span>';
  taskList.append(intro);

  todayTasks.forEach((task) => {
    taskList.append(createSongRequirementTaskCard(task, result, { today: true }));
  });

  if (tasks.length > todayTasks.length) {
    const details = document.createElement('details');
    details.className = 'song-requirement-all-tasks';
    details.innerHTML = `<summary>查看全部 ${tasks.length} 个难点</summary>`;
    const allList = document.createElement('div');
    allList.className = 'song-requirement-all-task-list';
    tasks.forEach((task) => allList.append(createSongRequirementTaskCard(task, result)));
    details.append(allList);
    taskList.append(details);
  }
}
function highlightSongRequirementTask(taskId, options = {}) {
  if (!taskId) return;
  document.querySelectorAll('.song-requirement-task-card').forEach((card) => {
    card.classList.toggle('active', card.dataset.taskId === taskId);
  });
  document.querySelectorAll('.song-requirement-time-slice').forEach((slice) => {
    slice.classList.remove('active');
  });
  const card = document.querySelector(`.song-requirement-task-card[data-task-id="${taskId}"]`);
  if (card && options.scroll) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function getSongAnalysisSegmentTitle(segment, result = songAnalysisState.result) {
  const task = result?.song_requirement?.primitive_vocal_tasks?.find((item) => item.segment_id === segment.id);
  if (task?.title) return task.title;
  const skills = getSongAnalysisTaskSkills(segment, {
    bpm: result?.bpm,
    highPressureHz: result?.song_requirement?.range_requirement?.high_note_pressure ? 420 : 440,
  });
  return getSongAnalysisTaskTitle(skills, segment, { highPressureHz: 420 });
}

function getSongAnalysisSegmentCoreTags(segment) {
  return (segment.difficulty_tags || [])
    .map((tag) => String(tag))
    .slice(0, 4);
}

function getSongAnalysisSegmentFilterKey(segment) {
  const tags = (segment.difficulty_tags || []).join(' ');
  if (/高音|楂橀煶/.test(tags) || segment.max_pitch >= 440) return 'high';
  if (/长音|闀块煶/.test(tags) || segment.long_note_count >= 1) return 'long';
  if (/大跳|澶ц烦/.test(tags) || segment.jump_count >= 1) return 'jump';
  if (/节奏|鑺傚/.test(tags) || segment.note_density >= 5.2) return 'dense';
  if (/跨度|璺ㄥ害/.test(tags) || segment.pitch_range >= 180) return 'range';
  return 'easy';
}

function sortSongAnalysisSegments(segments, sortKey) {
  const list = segments.slice();
  if (sortKey === 'difficulty') return list.sort((left, right) => right.difficulty_score - left.difficulty_score);
  if (sortKey === 'time') return list.sort((left, right) => left.start_time - right.start_time);
  if (sortKey === 'duration') return list.sort((left, right) => right.duration - left.duration);
  return list.sort((left, right) => left.recommended_order - right.recommended_order);
}

function getSongAnalysisTopSegments(result) {
  const taskSegmentIds = (result.song_requirement?.primitive_vocal_tasks || [])
    .slice(0, 3)
    .map((task) => task.segment_id);
  const byTask = taskSegmentIds
    .map((id) => result.segments.find((segment) => segment.id === id))
    .filter(Boolean);
  if (byTask.length >= 3) return byTask;
  return sortSongAnalysisSegments(result.segments, 'recommended').slice(0, 3);
}

function filterSongAnalysisSegments(segments, filterKey) {
  if (!filterKey || filterKey === 'all') return segments;
  return segments.filter((segment) => getSongAnalysisSegmentFilterKey(segment) === filterKey);
}

function groupSongAnalysisSimilarSegments(segments, result) {
  const groups = [];
  segments.forEach((segment) => {
    const title = getSongAnalysisSegmentTitle(segment, result);
    const last = groups[groups.length - 1];
    if (last && last.title === title && last.items.length < 5) {
      last.items.push(segment);
    } else {
      groups.push({ title, items: [segment] });
    }
  });
  return groups;
}

function createSongAnalysisSegmentCard(segment, result, indexLabel = '') {
  const card = document.createElement('article');
  card.className = 'song-analysis-segment-card';
  const title = getSongAnalysisSegmentTitle(segment, result);
  card.innerHTML = `
    <div class="song-analysis-segment-main">
      <span class="game-label">${indexLabel || `推荐 ${segment.recommended_order}`}</span>
      <h3>${songAnalysisFormatTime(segment.start_time)} - ${songAnalysisFormatTime(segment.end_time)} · ${title}</h3>
      <p>${segment.duration.toFixed(1)} 秒 · 平均音高 ${segment.average_pitch ? Math.round(segment.average_pitch) : '--'} Hz · 音域 ${Math.round(segment.pitch_range)} Hz</p>
      <div class="song-analysis-tags">${getSongAnalysisSegmentCoreTags(segment).map((tag) => `<span>${tag}</span>`).join('')}</div>
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
  return card;
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

  const topSegments = getSongAnalysisTopSegments(result);
  const intro = document.createElement('div');
  intro.className = 'song-analysis-segment-intro';
  intro.innerHTML = `<strong>优先练这 3 个</strong><span>AI 已从 ${result.segments.length} 个片段里挑出最值得先练的入口。</span>`;
  list.append(intro);
  topSegments.forEach((segment, index) => {
    list.append(createSongAnalysisSegmentCard(segment, result, `${index + 1}. AI 推荐`));
  });

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'song-analysis-expand-button secondary';
  toggle.textContent = songAnalysisState.segmentsExpanded
    ? '收起全部片段'
    : `展开全部 ${result.segments.length} 个片段`;
  toggle.addEventListener('click', () => {
    songAnalysisState.segmentsExpanded = !songAnalysisState.segmentsExpanded;
    renderSongAnalysisSegments(result);
  });
  list.append(toggle);

  if (!songAnalysisState.segmentsExpanded) return;

  const controls = document.createElement('div');
  controls.className = 'song-analysis-segment-controls';
  controls.innerHTML = `
    <label>排序
      <select id="songSegmentSortSelect">
        <option value="recommended">AI推荐</option>
        <option value="difficulty">按难度</option>
        <option value="time">按时间</option>
        <option value="duration">按时长</option>
      </select>
    </label>
    <div class="song-analysis-filter-tags" id="songSegmentFilterTags"></div>
  `;
  list.append(controls);
  const select = controls.querySelector('#songSegmentSortSelect');
  select.value = songAnalysisState.segmentSort;
  select.addEventListener('change', () => {
    songAnalysisState.segmentSort = select.value;
    renderSongAnalysisSegments(result);
  });
  const filters = [
    ['all', '全部'],
    ['high', '高音'],
    ['long', '长音'],
    ['jump', '大跳'],
    ['dense', '节奏密集'],
    ['easy', '入门'],
    ['range', '音域跨度大'],
  ];
  const filterBox = controls.querySelector('#songSegmentFilterTags');
  filters.forEach(([key, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = key === songAnalysisState.segmentFilter ? 'active' : '';
    button.textContent = label;
    button.addEventListener('click', () => {
      songAnalysisState.segmentFilter = key;
      renderSongAnalysisSegments(result);
    });
    filterBox.append(button);
  });

  const fullList = document.createElement('div');
  fullList.className = 'song-analysis-full-segment-list';
  const filtered = filterSongAnalysisSegments(sortSongAnalysisSegments(result.segments, songAnalysisState.segmentSort), songAnalysisState.segmentFilter);
  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'song-analysis-empty-segments';
    empty.textContent = '当前筛选下没有片段。';
    fullList.append(empty);
  }
  groupSongAnalysisSimilarSegments(filtered, result).forEach((group) => {
    if (group.items.length >= 3) {
      const details = document.createElement('details');
      details.className = 'song-analysis-segment-group';
      details.innerHTML = `<summary>${group.title}片段 × ${group.items.length}</summary>`;
      group.items.forEach((segment, index) => details.append(createSongAnalysisSegmentCard(segment, result, `${index + 1}. 组内片段`)));
      fullList.append(details);
    } else {
      group.items.forEach((segment) => fullList.append(createSongAnalysisSegmentCard(segment, result)));
    }
  });
  list.append(fullList);
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

function setSongAnalysisPracticeTask(task, result = songAnalysisState.result) {
  if (!task || !result) return;
  const segment = result.segments.find((item) => item.id === task.segment_id) || {
    id: task.segment_id,
    start_time: task.start_time,
    end_time: task.end_time,
    duration: task.end_time - task.start_time,
  };
  setSongAnalysisPracticeSegment({
    ...segment,
    primitiveTask: task,
    required_skill: task.required_skill,
    diagnostic_focus: task.diagnostic_focus,
    practice_instruction: task.practice_instruction,
  });
}

function getSongAnalysisFirstPracticeTask(result = songAnalysisState.result) {
  const requirement = result?.song_requirement || songAnalysisState.requirement;
  const todayTasks = requirement ? getSongRequirementTodayTasks(requirement) : [];
  if (todayTasks[0]) {
    return todayTasks[0];
  }
  const topSegment = result ? getSongAnalysisTopSegments(result)[0] : null;
  if (!topSegment) return null;
  return {
    task_id: `segment-${topSegment.id}`,
    segment_id: topSegment.id,
    start_time: topSegment.start_time,
    end_time: topSegment.end_time,
    required_skill: getSongAnalysisSegmentCoreTags(topSegment),
    diagnostic_focus: getSongAnalysisDiagnosticFocus(getSongAnalysisSegmentCoreTags(topSegment), topSegment),
    practice_instruction: '先听目标，再录一次这一句。',
  };
}

function setSongAnalysisPracticeSegmentState(segment) {
  songAnalysisState.selectedSegment = segment;
  window.currentSongPracticeSegment = {
    ...segment,
    source: 'song-analysis',
    songName: songAnalysisState.result?.name,
    songRequirement: songAnalysisState.requirement,
    primitiveTask: segment.primitiveTask || null,
    diagnosticFocus: segment.diagnostic_focus || segment.primitiveTask?.diagnostic_focus || '',
    practiceInstruction: segment.practice_instruction || segment.primitiveTask?.practice_instruction || '',
  };
  return window.currentSongPracticeSegment;
}

function setSongAnalysisPracticeSegment(segment) {
  const status = document.getElementById('songAnalysisStatus');
  if (status) {
    status.textContent = `已设为练习片段：${songAnalysisFormatTime(segment.start_time)}-${songAnalysisFormatTime(segment.end_time)}。可以进入 AI 声乐老师做 song-first 闭环。`;
  }
  setSongAnalysisPracticeSegmentState(segment);
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

function setSongAnalysisPracticeTaskState(task, result = songAnalysisState.result) {
  if (!task || !result) return null;
  const segment = result.segments.find((item) => item.id === task.segment_id) || {
    id: task.segment_id,
    start_time: task.start_time,
    end_time: task.end_time,
    duration: task.end_time - task.start_time,
  };
  return setSongAnalysisPracticeSegmentState({
    ...segment,
    primitiveTask: task,
    required_skill: task.required_skill,
    diagnostic_focus: task.diagnostic_focus,
    practice_instruction: task.practice_instruction,
  });
}

async function continueSongAnalysisToPractice(file, result) {
  const status = document.getElementById('songAnalysisStatus');
  const firstTask = getSongAnalysisFirstPracticeTask(result);
  const practiceSegment = firstTask
    ? setSongAnalysisPracticeTaskState(firstTask, result)
    : null;
  const segmentCount = result?.segments?.length || 0;

  if (status) {
    status.textContent = `歌曲已分析完成，共生成 ${segmentCount} 个练习片段。正在生成跟唱目标...`;
  }

  if (file && typeof window.analyzeSongPitchFile === 'function') {
    await window.analyzeSongPitchFile(file);
  }

  if (typeof songPitchTrack !== 'undefined' && !songPitchTrack.length) {
    if (status) {
      status.textContent = `歌曲分析完成，共生成 ${segmentCount} 个练习片段，但目标曲线生成失败。请换一个更清晰的音频再试。`;
    }
    return;
  }

  hideSongAnalysisPage();
  if (typeof window.showTrainingView === 'function') {
    window.showTrainingView('curve');
  }
  if (typeof updateSongPracticeFlow === 'function') {
    const label = practiceSegment
      ? `歌曲已分析完成，共生成 ${segmentCount} 个练习片段。现在开始第一句练习。`
      : `歌曲已分析完成，共生成 ${segmentCount} 个练习片段。现在开始跟唱练习。`;
    updateSongPracticeFlow(label);
  }
  if (typeof setSongTrainingResult === 'function') {
    setSongTrainingResult('先听目标，再录一次这一句。完成后 Mira 会自动复盘。');
  }
}

function getSongAnalysisLibraryItems() {
  if (typeof recordingLibrary === 'undefined' || !Array.isArray(recordingLibrary)) {
    return [];
  }
  return recordingLibrary.filter((item) => item?.blob && (item.type === 'song' || item.type === 'audio'));
}

function renderSongAnalysisLibraryOptions() {
  const select = document.getElementById('songAnalysisLibrarySelect');
  const button = document.getElementById('songAnalysisLoadLibraryButton');
  if (!select) return;
  const items = getSongAnalysisLibraryItems();
  select.innerHTML = '';
  if (!items.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '录音库里还没有歌曲或音频';
    select.append(option);
    if (button) button.disabled = true;
    return;
  }
  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    const typeLabel = item.type === 'song' ? '歌曲' : '音频';
    const duration = item.durationMs ? ` · ${songAnalysisFormatTime(item.durationMs / 1000)}` : '';
    option.textContent = `${typeLabel} · ${getRecordingLibraryName(item)}${duration}`;
    select.append(option);
  });
  if (button) button.disabled = false;
}

async function ensureSongAnalysisLibraryOptions() {
  if (typeof loadRecordingLibrary === 'function') {
    await loadRecordingLibrary();
  }
  renderSongAnalysisLibraryOptions();
}

function cacheSongRequirement(result) {
  const requirement = result?.song_requirement;
  if (!requirement) return;
  try {
    const raw = localStorage.getItem('songRequirements');
    const cache = raw ? JSON.parse(raw) : {};
    cache[requirement.song_id] = requirement;
    localStorage.setItem('songRequirements', JSON.stringify(cache));
  } catch (error) {
    console.warn('Song requirement cache failed', error);
  }
  if (songAnalysisState.sourceRecordingId && typeof updateRecordingLibraryItem === 'function') {
    updateRecordingLibraryItem(songAnalysisState.sourceRecordingId, {
      songRequirement: requirement,
      songRequirementGeneratedAt: new Date().toISOString(),
    });
  }
}

async function analyzeSongAnalysisFile(file, loadingText = '正在分析歌曲...') {
  if (!file) return;
  const status = document.getElementById('songAnalysisStatus');
  if (status) status.textContent = loadingText;
  if (songAnalysisState.audioUrl) URL.revokeObjectURL(songAnalysisState.audioUrl);
  songAnalysisState.audioFile = file;
  songAnalysisState.audioUrl = URL.createObjectURL(file);
  const audio = document.getElementById('songAnalysisAudio');
  if (audio) audio.src = songAnalysisState.audioUrl;
  try {
    const result = await analyzeSongAudioFile(file);
    songAnalysisState.result = result;
    songAnalysisState.segmentsExpanded = false;
    songAnalysisState.segmentSort = 'recommended';
    songAnalysisState.segmentFilter = 'all';
    cacheSongRequirement(result);
    renderSongAnalysisResult(result);
    if (status) status.textContent = `分析完成，${result.segments.length} 个可练片段。`;
    if (songAnalysisState.autoContinueToPractice !== false) {
      await continueSongAnalysisToPractice(file, result);
    }
  } catch (error) {
    console.error(error);
    if (status) status.textContent = '分析失败。可以换一个 mp3 / wav / m4a 再试。';
  }
}

async function handleSongAnalysisUpload(event) {
  const file = event.target.files?.[0];
  songAnalysisState.sourceRecordingId = null;
  await analyzeSongAnalysisFile(file, '正在分析上传歌曲...');
  renderSongAnalysisLibraryOptions();
}

async function handleSongAnalysisLibraryLoad() {
  const select = document.getElementById('songAnalysisLibrarySelect');
  const id = select?.value;
  const item = getSongAnalysisLibraryItems().find((entry) => entry.id === id);
  const status = document.getElementById('songAnalysisStatus');
  if (!item) {
    if (status) status.textContent = '请先从录音库选择一首歌曲。';
    return;
  }
  const file = typeof getRecordingLibraryFile === 'function'
    ? getRecordingLibraryFile(item)
    : new File([item.blob], item.name || 'library-audio', { type: item.mimeType || item.blob?.type || 'audio/*' });
  songAnalysisState.sourceRecordingId = item.id;
  await analyzeSongAnalysisFile(file, `正在分析录音库歌曲：${getRecordingLibraryName(item)}...`);
}
function showSongAnalysisPage(options = {}) {
  songAnalysisState.autoContinueToPractice = options.autoContinueToPractice !== false;
  document.getElementById('modeLauncher')?.setAttribute('hidden', '');
  document.getElementById('libraryPage')?.setAttribute('hidden', '');
  document.getElementById('appWindow')?.setAttribute('hidden', '');
  if (typeof hideVocalMoveLibrary === 'function') hideVocalMoveLibrary();
  if (typeof hideActiveVoiceSearch === 'function') hideActiveVoiceSearch();
  if (typeof hideAiVocalTeacher === 'function') hideAiVocalTeacher();
  if (typeof hideAiExperimentPage === 'function') hideAiExperimentPage();
  if (typeof hideAiCoursePage === 'function') hideAiCoursePage();
  if (typeof hideVocalStateKitPage === 'function') hideVocalStateKitPage();
  const page = document.getElementById('songAnalysisPage');
  if (page) page.hidden = false;
  ensureSongAnalysisLibraryOptions().catch((error) => console.error(error));
}

function hideSongAnalysisPage() {
  const page = document.getElementById('songAnalysisPage');
  if (page) page.hidden = true;
}

function bindSongAnalysisEvents() {
  document.getElementById('openSongAnalysisButton')?.addEventListener('click', () => showSongAnalysisPage());
  document.getElementById('songAnalysisBackButton')?.addEventListener('click', () => {
    hideSongAnalysisPage();
    if (typeof showLauncherView === 'function') showLauncherView();
  });
  document.getElementById('songAnalysisInput')?.addEventListener('change', handleSongAnalysisUpload);
  document.getElementById('songAnalysisLoadLibraryButton')?.addEventListener('click', handleSongAnalysisLibraryLoad);
  document.getElementById('songAnalysisLibrarySelect')?.addEventListener('change', () => {
    const status = document.getElementById('songAnalysisStatus');
    const item = getSongAnalysisLibraryItems().find((entry) => entry.id === document.getElementById('songAnalysisLibrarySelect')?.value);
    if (status && item) status.textContent = `已选择：${getRecordingLibraryName(item)}。`;
  });
}

bindSongAnalysisEvents();
window.showSongAnalysisPage = showSongAnalysisPage;
window.hideSongAnalysisPage = hideSongAnalysisPage;
window.analyzeSongAudioFile = analyzeSongAudioFile;
window.renderSongAnalysisResult = renderSongAnalysisResult;
window.songAnalysisFormatTime = songAnalysisFormatTime;
window.renderSongAnalysisLibraryOptions = renderSongAnalysisLibraryOptions;

