const AI_VOCAL_TEACHER_REPETITIONS = 5;

const AI_VOCAL_TEACHER_TASKS = [
  {
    id: 'sustained_a',
    name: 'Sustained /a/',
    instruction: '用舒服音高唱一个稳定的 /a/，保持 2 到 4 秒。',
    repetitions: AI_VOCAL_TEACHER_REPETITIONS,
  },
  {
    id: 'sustained_i',
    name: 'Sustained /i/',
    instruction: '用同一个舒服音高唱 /i/，尽量保持和 /a/ 一样稳定。',
    repetitions: AI_VOCAL_TEACHER_REPETITIONS,
  },
  {
    id: 'soft_to_normal',
    name: 'Soft-to-normal transition',
    instruction: '同一个元音，从轻声慢慢过渡到正常音量。',
    repetitions: AI_VOCAL_TEACHER_REPETITIONS,
  },
  {
    id: 'short_glide',
    name: 'Short pitch glide',
    instruction: '做一个短滑音，不要冲，用舒服范围轻轻滑动。',
    repetitions: AI_VOCAL_TEACHER_REPETITIONS,
  },
  {
    id: 'creaky_open',
    name: 'Creaky onset → open vowel',
    instruction: '用很轻的 creaky onset 开始，然后打开到自然元音。',
    repetitions: AI_VOCAL_TEACHER_REPETITIONS,
  },
];

window.AI_VOCAL_TEACHER_TASKS = AI_VOCAL_TEACHER_TASKS;
window.AI_VOCAL_TEACHER_REPETITIONS = AI_VOCAL_TEACHER_REPETITIONS;
