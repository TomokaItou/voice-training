const CACHE_VERSION = 'voice-training-pwa-v14';
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
  './styles/sidebar.css',
  './styles/theme-responsive.css',
  './styles/game.css',
  './styles/mira-purple.css',
  './app-config.js',
  './app-dom.js',
  './app-state.js',
  './game-state.js',
  './mira-feedback.js',
  './beginner-practice.js',
  './app-shell.js',
  './pitch-detection.js',
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
  './recording-timeline.js',
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
  './recording-flow.js',
  './fix-one-thing.js',
  './app.js',
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
