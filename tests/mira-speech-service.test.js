const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  VoicepeakLibraryAdapter,
  SpeechQueue,
  MiraSpeechServiceImpl,
  CORE_MIRA_SPEECH_LINES,
} = require('../mira-speech-service.js');

const manifest = {
  'mira.welcome': {
    text: 'welcome',
    emotion: 'happy',
    file: 'happy/welcome_back.wav',
  },
  'mira.thinking': {
    text: 'thinking',
    emotion: 'thinking',
    file: 'thinking/thinking.wav',
  },
  'mira.retry': {
    text: 'retry',
    emotion: 'gentle',
    file: 'gentle/retry.wav',
  },
  'mira.success': {
    text: 'success',
    emotion: 'excited',
    file: 'excited/success.wav',
  },
};

function createAdapter(options = {}) {
  return new VoicepeakLibraryAdapter({
    manifestUrl: 'assets/mira-voice/manifest.json',
    loader: async () => manifest,
    exists: options.exists || (async () => true),
  });
}

class FakeAudio {
  constructor(path, log) {
    this.path = path;
    this.log = log;
    this.listeners = {};
    this.paused = false;
    this.currentTime = 0;
    this.volume = 1;
  }

  addEventListener(name, callback) {
    this.listeners[name] = callback;
  }

  play() {
    this.log.push(`play:${this.path}`);
    this.timer = setTimeout(() => this.listeners.ended?.(), 5);
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.log.push(`pause:${this.path}`);
    clearTimeout(this.timer);
  }
}

test('manifest loads normally', async () => {
  const adapter = createAdapter();
  const loaded = await adapter.loadManifest();
  assert.equal(loaded['mira.welcome'].text, 'welcome');
});

test('finds specified speech id', async () => {
  const adapter = createAdapter();
  const result = await adapter.find({ cacheKey: 'mira.welcome' });
  assert.equal(result.source, 'voicepeak-library');
  assert.equal(result.audioPath, 'assets/mira-voice/happy/welcome_back.wav');
});

test('missing wav falls back to silence, not browser voice', async () => {
  const log = [];
  const service = new MiraSpeechServiceImpl({
    adapter: createAdapter({ exists: async () => false }),
    audioFactory: (audioPath) => new FakeAudio(audioPath, log),
  });
  const result = await service.speakById('mira.welcome');
  assert.equal(result.source, 'silent-fallback');
  assert.deepEqual(log, []);
});

test('speech queue plays in order', async () => {
  const log = [];
  const queue = new SpeechQueue({ audioFactory: (audioPath) => new FakeAudio(audioPath, log) });
  await Promise.all([
    queue.enqueue({ audioPath: 'path with spaces/one.wav', text: 'one' }, { cacheKey: 'one' }),
    queue.enqueue({ audioPath: 'two.wav', text: 'two' }, { cacheKey: 'two' }),
  ]);
  assert.deepEqual(log.filter((item) => item.startsWith('play:')), ['play:path with spaces/one.wav', 'play:two.wav']);
});

test('interrupt stops current playback', async () => {
  const log = [];
  const queue = new SpeechQueue({ audioFactory: (audioPath) => new FakeAudio(audioPath, log) });
  queue.enqueue({ audioPath: 'long.wav', text: 'long' }, { cacheKey: 'long' });
  await queue.enqueue({ audioPath: 'next.wav', text: 'next' }, { cacheKey: 'next', interrupt: true });
  assert.ok(log.includes('pause:long.wav'));
  assert.ok(log.includes('play:next.wav'));
});

test('recording start can stop speech immediately', async () => {
  const log = [];
  const queue = new SpeechQueue({ audioFactory: (audioPath) => new FakeAudio(audioPath, log) });
  queue.enqueue({ audioPath: 'talking.wav', text: 'talking' }, { cacheKey: 'talking' });
  await queue.stop();
  assert.ok(log.includes('pause:talking.wav'));
});

test('duplicate speech is deduped briefly', async () => {
  let now = 1000;
  const log = [];
  const queue = new SpeechQueue({ audioFactory: (audioPath) => new FakeAudio(audioPath, log), now: () => now });
  await queue.enqueue({ audioPath: 'same.wav', text: 'same' }, { cacheKey: 'same' });
  now += 400;
  const result = await queue.enqueue({ audioPath: 'same.wav', text: 'same' }, { cacheKey: 'same' });
  assert.equal(result.deduped, true);
  assert.equal(log.filter((item) => item === 'play:same.wav').length, 1);
});

test('service selects library adapter when no verified cli is configured', () => {
  const service = new MiraSpeechServiceImpl({ adapter: createAdapter() });
  assert.equal(service.adapter.source, 'voicepeak-library');
});

test('paths with spaces and non-ascii characters are passed through to the player', async () => {
  const log = [];
  const queue = new SpeechQueue({ audioFactory: (audioPath) => new FakeAudio(audioPath, log) });
  await queue.enqueue({ audioPath: 'assets/mira-voice/温柔 声音/retry.wav', text: 'retry' }, { cacheKey: 'cn-path' });
  assert.ok(log.includes('play:assets/mira-voice/温柔 声音/retry.wav'));
});

test('disabled speech does not generate or play audio', async () => {
  const log = [];
  const service = new MiraSpeechServiceImpl({
    adapter: createAdapter(),
    audioFactory: (audioPath) => new FakeAudio(audioPath, log),
    settings: { enabled: false, volume: 0.92, adapter: 'voicepeak-library' },
  });
  const result = await service.speak({ cacheKey: 'mira.welcome', text: CORE_MIRA_SPEECH_LINES['mira.welcome'].text });
  assert.equal(result.disabled, true);
  assert.deepEqual(log, []);
});

test('analysis waiting uses the fixed thinking speech id', async () => {
  const service = new MiraSpeechServiceImpl({ adapter: createAdapter() });
  const result = await service.adapter.find({ cacheKey: 'mira.thinking' });
  assert.equal(result.audioPath, 'assets/mira-voice/thinking/thinking.wav');
});

test('global browser tts api is not used by app code', () => {
  const forbidden = ['speech' + 'Synthesis', 'Speech' + 'Synthesis' + 'Utterance'];
  const root = path.resolve(__dirname, '..');
  const files = [
    'mira-speech-service.js',
    'mira-voice-coach.js',
    'mira-voice-lab.js',
    'app.js',
    'launcher-router.js',
    'song-practice-flow.js',
    'features/recording/recording-flow.js',
    'features/ai-vocal-teacher/ai-vocal-teacher-recording.js',
  ];
  for (const file of files) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    forbidden.forEach((token) => {
      assert.equal(content.includes(token), false, `${file} still contains ${token}`);
    });
  }
});

test('voice lab is not embedded in the production home markup', () => {
  const markup = fs.readFileSync(path.resolve(__dirname, '../app-markup-launcher.js'), 'utf8');
  assert.equal(markup.includes('id="miraVoiceLab"'), false);
  assert.equal(markup.includes('data-home-section="mine" data-dev-only'), false);
});

test('real lesson flow is wired to core speech ids', () => {
  const root = path.resolve(__dirname, '..');
  const flowFiles = ['launcher-router.js', 'app.js', 'song-practice-flow.js', 'features/recording/recording-flow.js', 'success-library.js'];
  const content = flowFiles.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  [
    'mira.welcome',
    'mira.lesson_start',
    'mira.listen',
    'mira.thinking',
    'mira.retry',
    'mira.softer',
    'mira.success',
    'mira.save_success',
    'mira.finish',
  ].forEach((id) => assert.ok(content.includes(id), `missing lesson speech id: ${id}`));
});

test('legacy global text speech shortcut is not exposed', () => {
  const root = path.resolve(__dirname, '..');
  const files = ['mira-voice-coach.js', 'app.js', 'launcher-router.js', 'song-practice-flow.js'];
  const legacyShortcut = 'speak' + 'Mira';
  files.forEach((file) => {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.equal(content.includes(legacyShortcut), false, `${file} still references legacy text speech shortcut`);
  });
});
