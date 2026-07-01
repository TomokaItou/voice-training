const AI_TEACHER_EXERCISES = [
  {
    id: 'pitch_steady_3s',
    focusArea: 'pitch',
    difficulty: 1,
    title: '稳定音高 3 秒',
    goal: '音高稳定',
    instruction: '选一个舒服的音，轻轻唱 “a——”，保持 3 秒，不要追求大声。',
    repetitions: 5,
    durationMinutes: 3,
    reProbeTaskId: 'sustained_a',
  },
  {
    id: 'closure_fry_to_vowel',
    focusArea: 'closure',
    difficulty: 1,
    title: 'fry 到元音',
    goal: '让闭合和起音更稳定',
    instruction: '先用很轻的 fry 开始 1 秒，然后慢慢打开到舒服的 “a——”，不要推，也不要追求大声。',
    repetitions: 5,
    durationMinutes: 3,
    reProbeTaskId: 'creaky_open',
  },
  {
    id: 'breath_sovt',
    focusArea: 'breath',
    difficulty: 1,
    title: 'SOVT 轻声连住',
    goal: '让气息和音量更平稳',
    instruction: '用唇颤、轻哼或吸管感的半闭合声音做 3 秒，保持气流连续，不要突然加力。',
    repetitions: 5,
    durationMinutes: 3,
    reProbeTaskId: 'soft_to_normal',
  },
  {
    id: 'resonance_hum_to_vowel',
    focusArea: 'resonance',
    difficulty: 1,
    title: '哼鸣到元音',
    goal: '让共鸣位置更稳定',
    instruction: '先轻轻 “mmm” 1 秒，再慢慢打开到 “a——”。打开时音高和音量尽量不变。',
    repetitions: 5,
    durationMinutes: 3,
    reProbeTaskId: 'sustained_a',
  },
  {
    id: 'register_short_glide',
    focusArea: 'register',
    difficulty: 1,
    title: '短滑音过渡',
    goal: '让换声区更连续',
    instruction: '从舒服的低一点点音滑到稍高一点点，只滑很短，不冲高，声音保持连住。',
    repetitions: 5,
    durationMinutes: 3,
    reProbeTaskId: 'short_glide',
  },
  {
    id: 'pitch_slow_glide',
    focusArea: 'pitch',
    difficulty: 2,
    title: '慢速滑音',
    goal: '让音高变化连续、不过冲',
    instruction: '从舒服的低音慢慢滑到稍高一点，不要冲，声音保持连续。',
    repetitions: 5,
    durationMinutes: 4,
    reProbeTaskId: 'short_glide',
  },
  {
    id: 'breath_soft_to_normal',
    focusArea: 'breath',
    difficulty: 1,
    title: '小声到正常音量',
    goal: '气息和音量稳定',
    instruction: '用同一个元音，从小声慢慢变到正常音量，过程中不要突然用力。',
    repetitions: 5,
    durationMinutes: 3,
    reProbeTaskId: 'soft_to_normal',
  },
  {
    id: 'resonance_ai_transition',
    focusArea: 'resonance',
    difficulty: 1,
    title: 'a 到 i 慢速过渡',
    goal: '元音转换稳定',
    instruction: '慢慢从 “a——” 过渡到 “i——”，音高和音量都尽量不变，只让嘴型慢慢移动。',
    repetitions: 5,
    durationMinutes: 3,
    reProbeTaskId: 'sustained_i',
  },
  {
    id: 'closure_creaky_open',
    focusArea: 'closure',
    difficulty: 1,
    title: '起音打开',
    goal: '闭合更稳定，减少漏气和推挤',
    instruction: '用很轻的 creaky onset 开始，然后慢慢打开到自然元音，不要推。',
    repetitions: 5,
    durationMinutes: 3,
    reProbeTaskId: 'creaky_open',
  },
  {
    id: 'onset_light_attack',
    focusArea: 'onset',
    difficulty: 1,
    title: '轻轻起音',
    goal: '起音稳定',
    instruction: '用很小的声音开始 “a——”，像把声音轻轻放出来，不要一下子冲出来。',
    repetitions: 5,
    durationMinutes: 3,
    reProbeTaskId: 'creaky_open',
  },
  {
    id: 'global_easy_a',
    focusArea: 'global',
    difficulty: 1,
    title: '最简单的稳定 /a/',
    goal: '整体发声状态更可复现',
    instruction: '只唱一个舒服的 “a——”，持续 3 秒，目标是每次都尽量一样。',
    repetitions: 5,
    durationMinutes: 3,
    reProbeTaskId: 'sustained_a',
  },
];

function getAiTeacherExerciseById(id) {
  return AI_TEACHER_EXERCISES.find((exercise) => exercise.id === id) || null;
}

function getAiTeacherExercisesForFocus(focusArea) {
  return AI_TEACHER_EXERCISES.filter((exercise) => exercise.focusArea === focusArea);
}

function getAiTeacherDefaultExercise(focusArea, difficulty = 1) {
  const exercises = getAiTeacherExercisesForFocus(focusArea);
  return (
    exercises.find((exercise) => exercise.difficulty === difficulty) ||
    exercises.sort((left, right) => left.difficulty - right.difficulty)[0] ||
    getAiTeacherExerciseById('global_easy_a')
  );
}

function getAiTeacherEasierExercise(focusArea, currentExerciseId) {
  const current = getAiTeacherExerciseById(currentExerciseId);
  const targetDifficulty = Math.max(1, (current?.difficulty || 2) - 1);
  return getAiTeacherDefaultExercise(focusArea, targetDifficulty);
}

function getAiTeacherHarderExercise(focusArea, currentExerciseId) {
  const current = getAiTeacherExerciseById(currentExerciseId);
  const targetDifficulty = Math.min(3, (current?.difficulty || 1) + 1);
  return getAiTeacherDefaultExercise(focusArea, targetDifficulty);
}

function getAiTeacherAlternateExercise(focusArea, currentExerciseId) {
  return (
    getAiTeacherExercisesForFocus(focusArea).find((exercise) => exercise.id !== currentExerciseId) ||
    getAiTeacherDefaultExercise('global')
  );
}

window.AI_TEACHER_EXERCISES = AI_TEACHER_EXERCISES;
window.getAiTeacherExerciseById = getAiTeacherExerciseById;
window.getAiTeacherExercisesForFocus = getAiTeacherExercisesForFocus;
window.getAiTeacherDefaultExercise = getAiTeacherDefaultExercise;
window.getAiTeacherEasierExercise = getAiTeacherEasierExercise;
window.getAiTeacherHarderExercise = getAiTeacherHarderExercise;
window.getAiTeacherAlternateExercise = getAiTeacherAlternateExercise;
