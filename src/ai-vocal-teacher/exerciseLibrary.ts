export type VocalFocusArea = 'pitch' | 'breath' | 'resonance' | 'closure' | 'onset' | 'global';

export type VocalExercise = {
  id: string;
  focusArea: VocalFocusArea;
  difficulty: 1 | 2 | 3;
  title: string;
  goal: string;
  instruction: string;
  repetitions: number;
  durationMinutes: number;
  reProbeTaskId: string;
};

export const vocalExercises: VocalExercise[] = [
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
