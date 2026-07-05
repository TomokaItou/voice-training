const CACHE_VERSION = 'voice-training-pwa-v42';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './styles/base.css',
  './styles/layout.css',
  './styles/dashboards.css',
  './styles/song-practice.css',
  './styles/memory.css',
  './styles/chart.css',
  './styles/library.css',
  './styles/ai-experiment.css',
  './styles/ai-course.css',
  './styles/vocal-state-kit.css',
  './styles/song-analysis.css',
  './styles/sidebar.css',
  './styles/theme-responsive.css',
  './styles/game.css',
  './styles/mira-purple.css',
  './app-config.js',
  './core/storage.js',
  './app-dom.js',
  './app-state.js',
  './game-state.js',
  './mira-feedback.js',
  './beginner-practice.js',
  './app-shell.js',
  './assets/vendor/tf.min.js',
  './assets/models/crepe/model.json',
  './assets/models/crepe/group1-shard1of1',
  './assets/models/crepe/group2-shard1of1',
  './assets/models/crepe/group3-shard1of1',
  './assets/models/crepe/group4-shard1of1',
  './assets/models/crepe/group5-shard1of1',
  './assets/models/crepe/group6-shard1of1',
  './assets/models/crepe/group7-shard1of1',
  './assets/models/crepe/group8-shard1of1',
  './assets/models/crepe/group9-shard1of1',
  './assets/models/crepe/group10-shard1of1',
  './assets/models/crepe/group11-shard1of1',
  './assets/models/crepe/group12-shard1of1',
  './assets/models/crepe/group13-shard1of1',
  './app-markup-ai-experiment.js',
  './app-markup-ai-course.js',
  './app-markup-vocal-state-kit.js',
  './app-markup-song-analysis.js',
  './pitch-detection.js',
  './crepe-pitch.js',
  './crepe-tfjs-provider.js',
  './formant-analysis.js',
  './canvas-rendering.js',
  './offline-analysis.js',
  './breath-analysis.js',
  './memory-config.js',
  './memory-training.js',
  './s88-action-path.js',
  './range-training.js',
  './rhythm-training.js',
  './song-pitch.js',
  './vocal-score.js',
  './song-lyrics.js',
  './song-analysis.js',
  './features/recording/recording-library-storage.js',
  './features/recording/recording-timeline-rendering.js',
  './features/recording/recording-timeline.js',
  './features/recording/recording-playback.js',
  './voice-representation.js',
  './neural-voice-embedding.js',
  './voice-similarity.js',
  './voice-problem-map.js',
  './voice-teaching-actions.js',
  './voice-progress-evaluator.js',
  './voice-learning-memory.js',
  './success-library.js',
  './daily-challenge.js',
  './pitch-score-training.js',
  './accompaniment-controls.js',
  './vocal-separation.js',
  './readiness.js',
  './spectrogram.js',
  './audio-engine.js',
  './bgm-system.js',
  './song-practice-flow.js',
  './features/recording/recording-flow.js',
  './fix-one-thing.js',
  './app.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-probe-tasks.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-feature-extraction.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-immediate-feedback.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-memory-estimator.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-diagnosis.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-progress-tracker.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-exercise-library.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-closed-loop.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-teaching-decision.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-teaching-engine.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-before-after.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-storage.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-session.js',
  './features/ai-vocal-teacher/ai-vocal-teacher-recording.js',
  './features/ai-vocal-teacher/ai-vocal-teacher.js',
  './ai-experiment.js',
  './ai-course.js',
  './vocal-state-kit.js',
  './launcher-router.js',
  './app-install.js',
  './manifest.webmanifest',
  './assets/miras-practice-room.mp3',
  './icons/icon.svg',
  './icons/maskable-icon.svg',
  './icons/apple-touch-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});




