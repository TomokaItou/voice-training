const AI_COURSE_SKILLS = ['pitch', 'breath', 'onset', 'closure', 'resonance', 'legato', 'range'];
const AI_COURSE_SKILL_LABELS = {
  pitch: '音准',
  breath: '气息',
  onset: '起音',
  closure: '闭合',
  resonance: '亮度',
  legato: '连音',
  range: '音域',
};

const AI_COURSE_LESSONS = [
  {
    id: 'lesson_onset_1',
    order: 1,
    title: '轻声起音',
    skill: 'onset',
    estimatedMinutes: 5,
    goal: '起音轻一点，音一出来就稳住。',
    instructions: ['听自己第一个音有没有冲出来。', '用舒服音高唱 ma，录 5–8 秒。', '不要追求大声，只追求起音干净。'],
    exercise: {
      title: '轻 ma 起音',
      goal: '让第一个音更轻、更稳。',
      steps: ['吸一小口气。', '轻轻唱 ma 5 次，每次 2 秒。', '每次都从小音量开始。'],
    },
  },
  {
    id: 'lesson_breath_1',
    order: 2,
    title: '稳定气息',
    skill: 'breath',
    estimatedMinutes: 6,
    goal: '让音量更平，不忽大忽小。',
    instructions: ['用 wu 唱一条平稳的线。', '录 5–8 秒。', '声音小一点也可以，先稳定。'],
    exercise: {
      title: '轻声 wu 连线',
      goal: '让音量波动变小。',
      steps: ['用很轻的 wu 唱 4 次。', '每次保持 3 秒。', '尾音不要突然塌下去。'],
    },
  },
  {
    id: 'lesson_closure_1',
    order: 3,
    title: '闭合控制',
    skill: 'closure',
    estimatedMinutes: 6,
    goal: '减少漏气感，让声音核心更稳。',
    instructions: ['用 gee 唱短音。', '录 5–8 秒。', '不要压嗓，声音集中一点就好。'],
    exercise: {
      title: '轻 gee 集中练习',
      goal: '让声音更集中，少一点气声。',
      steps: ['轻轻唱 gee 5 次。', '每次 2 秒。', '不要加大音量，只听声音是否更稳。'],
    },
  },
  {
    id: 'lesson_legato_1',
    order: 4,
    title: '连音',
    skill: 'legato',
    estimatedMinutes: 6,
    goal: '把两个音连起来，不断气、不磕碰。',
    instructions: ['用 ma-ma 连两个舒服的音。', '录 5–8 秒。', '重点听中间有没有断。'],
    exercise: {
      title: 'ma-ma 连音',
      goal: '让两个音之间更顺。',
      steps: ['选两个相邻的舒服音。', '唱 ma-ma 5 次。', '中间不要重新用力。'],
    },
  },
  {
    id: 'lesson_pitch_1',
    order: 5,
    title: '音准落点',
    skill: 'pitch',
    estimatedMinutes: 6,
    goal: '每次落到更接近同一个音高。',
    instructions: ['选一个舒服音，用 ma 唱。', '录 5–8 秒。', '每次都轻轻落到同一个位置。'],
    exercise: {
      title: '单音落点',
      goal: '让音高摆动变小。',
      steps: ['唱 ma 5 次。', '每次保持 2 秒。', '先稳住再结束。'],
    },
  },
  {
    id: 'lesson_resonance_1',
    order: 6,
    title: '亮度稳定',
    skill: 'resonance',
    estimatedMinutes: 6,
    goal: '让声音亮暗变化更小。',
    instructions: ['先哼 ng，再接 ma。', '录 5–8 秒。', '不要变大声，只观察声音是否更集中。'],
    exercise: {
      title: 'ng 到 ma',
      goal: '让声音亮度更稳定。',
      steps: ['轻轻哼 ng 2 秒。', '接到 ma 2 秒。', '做 5 次，保持轻松。'],
    },
  },
  {
    id: 'lesson_song_1',
    order: 7,
    title: '简单歌曲片段',
    skill: 'range',
    estimatedMinutes: 8,
    goal: '只唱一句，不唱整首。',
    instructions: ['选一句最舒服的歌词。', '录 5–10 秒。', '今天只看这一句有没有稳定。'],
    exercise: {
      title: '一句歌词微练习',
      goal: '把一句歌唱稳。',
      steps: ['只唱这句的前两个音。', '再唱完整一句。', '不追求音量，先保持稳定。'],
    },
  },
];

const aiCourseState = {
  phase: 'home',
  progress: null,
  profile: null,
  currentLesson: null,
  attempt: null,
  recorder: null,
  stream: null,
  chunks: [],
};

function aiCourseId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function aiCourseSetText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function aiCourseClampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function aiCourseDefaultProfile() {
  return {
    id: 'default',
    updatedAt: new Date().toISOString(),
    skills: Object.fromEntries(AI_COURSE_SKILLS.map((skill) => [skill, 45])),
  };
}

function aiCourseDefaultProgress() {
  return {
    id: 'default',
    currentLessonId: 'lesson_onset_1',
    completedLessonIds: [],
    completedCount: 0,
    streak: 0,
    lastPracticeDate: null,
    updatedAt: new Date().toISOString(),
  };
}

async function aiCourseLoadStore(storeName) {
  if (typeof aiTeacherLoadAll !== 'function') return [];
  try {
    return await aiTeacherLoadAll(storeName);
  } catch (error) {
    console.warn(`AI course load failed: ${storeName}`, error);
    return [];
  }
}

async function aiCourseSaveStore(storeName, value) {
  if (typeof aiTeacherSave === 'function') {
    try {
      await aiTeacherSave(storeName, value);
      return;
    } catch (error) {
      console.warn(`AI course save failed: ${storeName}`, error);
    }
  }
  localStorage.setItem(`aiCourse:${storeName}:${value.id}`, JSON.stringify(value));
}

async function aiCourseLoadState() {
  const [profiles, progresses] = await Promise.all([
    aiCourseLoadStore('skillProfiles'),
    aiCourseLoadStore('courseProgress'),
  ]);
  const profile = profiles.find((item) => item.id === 'default') || aiCourseDefaultProfile();
  const progress = progresses.find((item) => item.id === 'default') || aiCourseDefaultProgress();
  aiCourseState.profile = {
    ...aiCourseDefaultProfile(),
    ...profile,
    skills: { ...aiCourseDefaultProfile().skills, ...(profile.skills || {}) },
  };
  aiCourseState.progress = { ...aiCourseDefaultProgress(), ...progress };
  aiCourseState.currentLesson = aiCourseLessonById(aiCourseState.progress.currentLessonId) || AI_COURSE_LESSONS[0];
}

function aiCourseLessonById(id) {
  return AI_COURSE_LESSONS.find((lesson) => lesson.id === id);
}

function aiCourseLowestSkill() {
  const skills = aiCourseState.profile?.skills || {};
  return AI_COURSE_SKILLS
    .map((skill) => ({ skill, value: Number.isFinite(skills[skill]) ? skills[skill] : 45 }))
    .sort((left, right) => left.value - right.value)[0];
}

function aiCoursePickLessonForSkill(skill) {
  return AI_COURSE_LESSONS.find((lesson) => lesson.skill === skill) || AI_COURSE_LESSONS[0];
}

function aiCourseRecommendNextLesson(passed) {
  const current = aiCourseState.currentLesson || AI_COURSE_LESSONS[0];
  if (!passed) return current;
  const weakest = aiCourseLowestSkill();
  if (weakest && weakest.value < 58) {
    return aiCoursePickLessonForSkill(weakest.skill);
  }
  const next = AI_COURSE_LESSONS.find((lesson) => lesson.order > current.order);
  return next || aiCoursePickLessonForSkill(weakest?.skill || 'pitch');
}

function aiCourseFeature(features, key, fallback = 0) {
  const value = features?.[key];
  return Number.isFinite(value) ? value : fallback;
}

function aiCourseBuildFeedback(lesson, features) {
  const pitchStd = aiCourseFeature(features, 'pitch_std');
  const loudnessStd = aiCourseFeature(features, 'loudness_std');
  const harmonicity = aiCourseFeature(features, 'harmonicity_mean', 0.7);
  if (lesson.skill === 'breath' || lesson.skill === 'legato') {
    return loudnessStd > 5
      ? '我先只看一件事：音量起伏有点大，今天先把声音唱成一条更平的线。'
      : '这一段音量已经比较平，今天继续把尾音稳住。';
  }
  if (lesson.skill === 'pitch' || lesson.skill === 'range') {
    return pitchStd > 18
      ? '我先只看一件事：音高落点还会晃，今天先让每次落到更接近同一个音。'
      : '音高落点不错，今天把这个稳定感带进一句歌词里。';
  }
  if (lesson.skill === 'closure' || lesson.skill === 'onset') {
    return harmonicity < 0.62
      ? '我先只看一件事：声音核心还不够稳，今天先让起音更轻、更集中。'
      : '声音核心已经比较清楚，今天继续保持轻起音。';
  }
  return '我先只看一件事：声音亮暗变化还可以更小，今天用 ng 到 ma 稳住它。';
}

function aiCourseCompareAttempt(lesson, before = {}, after = {}) {
  const diff = {
    pitch_std: aiCourseFeature(after, 'pitch_std') - aiCourseFeature(before, 'pitch_std'),
    loudness_std: aiCourseFeature(after, 'loudness_std') - aiCourseFeature(before, 'loudness_std'),
    harmonicity_mean: aiCourseFeature(after, 'harmonicity_mean') - aiCourseFeature(before, 'harmonicity_mean'),
    spectral_centroid_mean: aiCourseFeature(after, 'spectral_centroid_mean') - aiCourseFeature(before, 'spectral_centroid_mean'),
  };
  let score = 0;
  const changes = [];
  if (diff.pitch_std < -1.2) {
    score += lesson.skill === 'pitch' || lesson.skill === 'range' ? 2 : 1;
    changes.push('音高更稳');
  }
  if (diff.loudness_std < -0.8) {
    score += lesson.skill === 'breath' || lesson.skill === 'legato' ? 2 : 1;
    changes.push('音量更平');
  }
  if (diff.harmonicity_mean > 0.035) {
    score += lesson.skill === 'closure' || lesson.skill === 'onset' ? 2 : 1;
    changes.push('声音核心更稳');
  }
  if (Math.abs(diff.spectral_centroid_mean) < 180 && lesson.skill === 'resonance') {
    score += 1;
    changes.push('亮暗变化更小');
  }
  const passed = score >= 2;
  return {
    passed,
    score,
    featureDiff: diff,
    result: passed ? '通过' : '建议再练一轮',
    change: changes.length ? changes.join('，') : '这次变化还不明显',
  };
}

function aiCourseTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function aiCourseUpdateStreak(progress) {
  const today = aiCourseTodayKey();
  if (progress.lastPracticeDate === today) return progress.streak || 1;
  if (!progress.lastPracticeDate) return 1;
  const previous = new Date(progress.lastPracticeDate);
  const current = new Date(today);
  const days = Math.round((current - previous) / 86400000);
  return days === 1 ? (progress.streak || 0) + 1 : 1;
}

function aiCourseUpdateProfile(lesson, comparison) {
  const profile = aiCourseState.profile || aiCourseDefaultProfile();
  const skills = { ...profile.skills };
  const gain = comparison.passed ? 6 : 2;
  skills[lesson.skill] = aiCourseClampScore((skills[lesson.skill] || 45) + gain);
  if (comparison.passed && lesson.skill === 'closure') {
    skills.onset = aiCourseClampScore((skills.onset || 45) + 2);
  }
  if (comparison.passed && lesson.skill === 'legato') {
    skills.breath = aiCourseClampScore((skills.breath || 45) + 2);
  }
  aiCourseState.profile = {
    ...profile,
    skills,
    updatedAt: new Date().toISOString(),
  };
}

async function aiCourseCompleteAttempt() {
  const lesson = aiCourseState.currentLesson;
  const attempt = aiCourseState.attempt;
  const comparison = aiCourseCompareAttempt(lesson, attempt.beforeFeatures, attempt.afterFeatures);
  const nextLesson = aiCourseRecommendNextLesson(comparison.passed);
  const completed = new Set(aiCourseState.progress.completedLessonIds || []);
  if (comparison.passed) completed.add(lesson.id);
  aiCourseUpdateProfile(lesson, comparison);
  aiCourseState.progress = {
    ...aiCourseState.progress,
    currentLessonId: nextLesson.id,
    completedLessonIds: [...completed],
    completedCount: completed.size,
    streak: aiCourseUpdateStreak(aiCourseState.progress),
    lastPracticeDate: aiCourseTodayKey(),
    updatedAt: new Date().toISOString(),
  };
  aiCourseState.attempt = {
    ...attempt,
    completedAt: new Date().toISOString(),
    result: comparison.result,
    passed: comparison.passed,
    improvementScore: comparison.score,
    featureDiff: comparison.featureDiff,
    nextLessonId: nextLesson.id,
  };
  await Promise.all([
    aiCourseSaveStore('skillProfiles', aiCourseState.profile),
    aiCourseSaveStore('courseProgress', aiCourseState.progress),
    aiCourseSaveStore('lessonAttempts', {
      ...aiCourseState.attempt,
      beforeAudio: undefined,
      afterAudio: undefined,
    }),
  ]);
  aiCourseState.phase = 'complete';
  renderAiCourse();
}

function aiCoursePrimaryCopy() {
  return {
    home: '开始课程',
    instruction: '开始录音',
    before_recording: '录音中',
    before_recorded: '听 AI 反馈',
    feedback: '开始小练习',
    exercise: '重新录一次',
    after_recording: '录音中',
    after_recorded: '查看结果',
    complete: '完成，推荐下一课',
  }[aiCourseState.phase] || '继续';
}

function renderAiCourse() {
  const lesson = aiCourseState.currentLesson || AI_COURSE_LESSONS[0];
  const progress = aiCourseState.progress || aiCourseDefaultProgress();
  const profile = aiCourseState.profile || aiCourseDefaultProfile();
  const primary = document.getElementById('aiCoursePrimaryButton');
  const stop = document.getElementById('aiCourseStopButton');
  const isRecording = Boolean(aiCourseState.recorder);
  if (primary) {
    primary.textContent = aiCoursePrimaryCopy();
    primary.disabled = isRecording;
  }
  if (stop) stop.hidden = !isRecording;

  aiCourseSetText('aiCourseLevel', `基础阶段 Lv.${Math.max(1, Math.ceil((progress.completedCount + 1) / 2))}`);
  aiCourseSetText('aiCourseEstimatedTime', `预计 ${lesson.estimatedMinutes} 分钟`);
  aiCourseSetText('aiCourseLessonName', lesson.title);
  aiCourseSetText('aiCourseLessonGoal', lesson.goal);
  aiCourseSetText('aiCourseCompletedCount', String(progress.completedCount || 0));
  aiCourseSetText('aiCourseStreak', String(progress.streak || 0));
  const weakest = aiCourseLowestSkill();
  aiCourseSetText(
    'aiCourseSkillSummary',
    weakest
      ? `当前最需要照顾：${AI_COURSE_SKILL_LABELS[weakest.skill]} ${weakest.value}/100。`
      : '能力档案正在初始化。'
  );
  const bar = document.getElementById('aiCourseProgressBar');
  if (bar) bar.style.width = `${Math.min(100, Math.round(((progress.completedCount || 0) / AI_COURSE_LESSONS.length) * 100))}%`;

  const instructionList = document.getElementById('aiCourseInstructionList');
  if (instructionList) instructionList.innerHTML = lesson.instructions.map((item) => `<li>${item}</li>`).join('');
  const phaseText = {
    home: ['听示范 / 看说明', '点击开始后，我会让你先录一小段。'],
    instruction: ['听示范 / 看说明', '先看今天的目标，再录一小段声音。'],
    before_recording: ['正在录第一次', '录 5–8 秒就够了，唱舒服一点。'],
    before_recorded: ['第一次录好了', 'AI 会只选一个最重要的问题。'],
    feedback: ['小练习', '只做这一个短练习，不加其它任务。'],
    exercise: ['复测准备', '做完练习后，再录同样长度的一段。'],
    after_recording: ['正在复测', '保持和刚才差不多的音量和长度。'],
    after_recorded: ['复测完成', '现在看这个练习有没有帮上忙。'],
    complete: ['课程完成', '系统已经更新能力档案，并推荐下一课。'],
  }[aiCourseState.phase] || [];
  aiCourseSetText('aiCourseStepTitle', phaseText[0]);
  aiCourseSetText('aiCourseStepMessage', phaseText[1]);
  aiCourseSetText('aiCourseStatus', isRecording ? '正在录音。' : '准备好了。');

  document.getElementById('aiCourseFeedbackPanel').hidden = !aiCourseState.attempt?.feedback;
  document.getElementById('aiCourseExercisePanel').hidden = !aiCourseState.attempt?.feedback;
  document.getElementById('aiCourseResultPanel').hidden = !aiCourseState.attempt?.result;
  aiCourseSetText('aiCourseFeedbackText', aiCourseState.attempt?.feedback || '--');
  aiCourseSetText('aiCourseExerciseTitle', lesson.exercise.title);
  aiCourseSetText('aiCourseExerciseGoal', lesson.exercise.goal);
  const exerciseSteps = document.getElementById('aiCourseExerciseSteps');
  if (exerciseSteps) exerciseSteps.innerHTML = lesson.exercise.steps.map((step) => `<li>${step}</li>`).join('');
  if (aiCourseState.attempt?.result) {
    const nextLesson = aiCourseLessonById(aiCourseState.attempt.nextLessonId) || lesson;
    aiCourseSetText('aiCourseResultTitle', aiCourseState.attempt.passed ? '这节课通过了' : '这节课再练一轮');
    aiCourseSetText('aiCourseResultText', aiCourseState.attempt.result);
    aiCourseSetText('aiCourseChangeText', aiCourseState.attempt.featureDiff ? aiCourseCompareAttempt(lesson, aiCourseState.attempt.beforeFeatures, aiCourseState.attempt.afterFeatures).change : '--');
    aiCourseSetText('aiCourseNextLessonText', nextLesson.title);
  }
  const debug = document.getElementById('aiCourseDebugJson');
  if (debug) {
    debug.textContent = JSON.stringify({
      phase: aiCourseState.phase,
      currentLesson: lesson,
      progress,
      profile,
      attempt: aiCourseState.attempt,
    }, null, 2);
  }
}

async function startAiCourseRecording(kind) {
  aiCourseState.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  aiCourseState.chunks = [];
  const recorder = new MediaRecorder(aiCourseState.stream);
  aiCourseState.recorder = recorder;
  aiCourseState.phase = kind === 'after' ? 'after_recording' : 'before_recording';
  recorder.addEventListener('dataavailable', (event) => {
    if (event.data?.size) aiCourseState.chunks.push(event.data);
  });
  recorder.addEventListener('stop', () => finalizeAiCourseRecording(kind, recorder.mimeType), { once: true });
  recorder.start();
  renderAiCourse();
}

function stopAiCourseRecording() {
  if (aiCourseState.recorder && aiCourseState.recorder.state !== 'inactive') {
    aiCourseState.recorder.stop();
  }
}

async function finalizeAiCourseRecording(kind, mimeType) {
  const blob = new Blob(aiCourseState.chunks, { type: mimeType || 'audio/webm' });
  aiCourseState.stream?.getTracks().forEach((track) => track.stop());
  aiCourseState.stream = null;
  aiCourseState.recorder = null;
  const lesson = aiCourseState.currentLesson || AI_COURSE_LESSONS[0];
  if (!aiCourseState.attempt) {
    aiCourseState.attempt = {
      id: aiCourseId('lesson-attempt'),
      lessonId: lesson.id,
      createdAt: new Date().toISOString(),
    };
  }
  const vector = await aiTeacherExtractFeatureVector({
    blob,
    taskId: `${lesson.id}_${kind}`,
    attemptId: kind === 'after' ? 2 : 1,
    timestamp: Date.now(),
  });
  if (kind === 'after') {
    aiCourseState.attempt.afterAudio = blob;
    aiCourseState.attempt.afterFeatures = vector.features;
    aiCourseState.phase = 'after_recorded';
  } else {
    aiCourseState.attempt.beforeAudio = blob;
    aiCourseState.attempt.beforeFeatures = vector.features;
    aiCourseState.phase = 'before_recorded';
  }
  renderAiCourse();
}

async function handleAiCoursePrimary() {
  if (aiCourseState.phase === 'home') {
    aiCourseState.phase = 'instruction';
    aiCourseState.attempt = null;
    renderAiCourse();
    return;
  }
  if (aiCourseState.phase === 'instruction') {
    await startAiCourseRecording('before');
    return;
  }
  if (aiCourseState.phase === 'before_recorded') {
    aiCourseState.attempt.feedback = aiCourseBuildFeedback(aiCourseState.currentLesson, aiCourseState.attempt.beforeFeatures);
    aiCourseState.phase = 'feedback';
    renderAiCourse();
    return;
  }
  if (aiCourseState.phase === 'feedback') {
    aiCourseState.phase = 'exercise';
    renderAiCourse();
    return;
  }
  if (aiCourseState.phase === 'exercise') {
    await startAiCourseRecording('after');
    return;
  }
  if (aiCourseState.phase === 'after_recorded') {
    await aiCourseCompleteAttempt();
    return;
  }
  if (aiCourseState.phase === 'complete') {
    aiCourseState.currentLesson = aiCourseLessonById(aiCourseState.progress.currentLessonId) || AI_COURSE_LESSONS[0];
    aiCourseState.attempt = null;
    aiCourseState.phase = 'home';
    renderAiCourse();
  }
}

async function showAiCoursePage() {
  document.getElementById('modeLauncher')?.setAttribute('hidden', '');
  document.getElementById('libraryPage')?.setAttribute('hidden', '');
  document.getElementById('appWindow')?.setAttribute('hidden', '');
  if (typeof hideVocalMoveLibrary === 'function') hideVocalMoveLibrary();
  if (typeof hideActiveVoiceSearch === 'function') hideActiveVoiceSearch();
  if (typeof hideAiVocalTeacher === 'function') hideAiVocalTeacher();
  if (typeof hideAiExperimentPage === 'function') hideAiExperimentPage();
  if (typeof hideVocalStateKitPage === 'function') hideVocalStateKitPage();
  if (typeof hideSongAnalysisPage === 'function') hideSongAnalysisPage();
  const page = document.getElementById('aiCoursePage');
  if (page) page.hidden = false;
  await aiCourseLoadState();
  renderAiCourse();
}

function hideAiCoursePage() {
  stopAiCourseRecording();
  const page = document.getElementById('aiCoursePage');
  if (page) page.hidden = true;
}

function bindAiCourseEvents() {
  document.getElementById('openAiCourseButton')?.addEventListener('click', () => {
    showAiCoursePage().catch(console.error);
  });
  document.getElementById('aiCourseBackButton')?.addEventListener('click', () => {
    hideAiCoursePage();
    if (typeof showLauncherView === 'function') showLauncherView();
  });
  document.getElementById('aiCoursePrimaryButton')?.addEventListener('click', () => {
    handleAiCoursePrimary().catch((error) => {
      console.error(error);
      aiCourseSetText('aiCourseStatus', '录音或分析失败，请再试一次。');
      aiCourseState.recorder = null;
      renderAiCourse();
    });
  });
  document.getElementById('aiCourseStopButton')?.addEventListener('click', stopAiCourseRecording);
}

bindAiCourseEvents();
window.showAiCoursePage = showAiCoursePage;
window.hideAiCoursePage = hideAiCoursePage;
