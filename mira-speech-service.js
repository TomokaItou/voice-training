(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    Object.assign(root, factory());
  }
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const MANIFEST_URL = 'assets/mira-voice/manifest.json';
  const STORAGE_KEY = 'mira.speech.settings.v1';
  const MISSING_KEY = 'mira.speech.missingLines.v1';
  const DEDUPE_MS = 1800;
  const MAX_TEXT_LENGTH = 140;

  const CORE_LINES = {
    'mira.welcome': { text: '你回来啦！', emotion: 'happy' },
    'mira.lesson_start': { text: '今天我们只练一个小地方。', emotion: 'gentle' },
    'mira.listen': { text: '好，唱给我听吧。', emotion: 'happy' },
    'mira.thinking': { text: '嗯……让我听一下。', emotion: 'thinking' },
    'mira.retry': { text: '已经很接近了，我们再来一次。', emotion: 'gentle' },
    'mira.softer': { text: '这一次试着再轻一点。', emotion: 'gentle' },
    'mira.less_air': { text: '试着少送一点气。', emotion: 'gentle' },
    'mira.success': { text: '等等，就是刚才这一句！', emotion: 'excited' },
    'mira.save_success': { text: '我把它保存下来啦。', emotion: 'happy' },
    'mira.finish': { text: '今天练到这里就很好，下次我们从这一句继续。', emotion: 'gentle' },
  };

  const FALLBACK_DIALOGUE = {
    'coach.start_today': 'mira.lesson_start',
    'coach.arrived': 'mira.welcome',
    'coach.no_whole_song': { text: '今天不用想整首歌。', emotion: 'gentle' },
    'coach.just_one_segment': 'mira.lesson_start',
    'coach.sing_when_ready': 'mira.listen',
    'coach.ready': { text: '准备好了吗？', emotion: 'happy' },
    'coach.lets_start': 'mira.lesson_start',
    'coach.listen_once': { text: '先听一遍。', emotion: 'gentle' },
    'coach.notice_last_note': { text: '注意最后一个音。', emotion: 'gentle' },
    'coach.your_turn': 'mira.listen',
    'coach.one_line_only': { text: '不用急，唱一句就好。', emotion: 'gentle' },
    'coach.good': { text: '很好。', emotion: 'happy' },
    'coach.retry': 'mira.retry',
    'coach.retry_good': 'mira.retry',
    'coach.retry_lightly': 'mira.softer',
    'coach.dont_rush': { text: '不要着急。', emotion: 'gentle' },
    'coach.thats_it': 'mira.success',
    'coach.simpler': { text: '没关系，我们换个简单一点的。', emotion: 'gentle' },
    'coach.slow_down_tired': { text: '今天可能有点累，先慢一点。', emotion: 'gentle' },
    'coach.finish_today': 'mira.finish',
    'coach.good_work_today': 'mira.finish',
    'coach.progress_today': { text: '今天已经有进步了。', emotion: 'happy' },
    'coach.tomorrow': { text: '下次我们继续。', emotion: 'gentle' },
    'coach.stop': { text: '好，停。', emotion: 'normal' },
    'coach.ok': { text: '好。', emotion: 'normal' },
    'coach.sing_this_line': 'mira.listen',
    'coach.stop_after_line': { text: '唱完就停。', emotion: 'gentle' },
    'coach.more_stable': { text: '刚才已经比上一遍稳定。', emotion: 'happy' },
    'coach.first_word_lightly': 'mira.softer',
    'coach.continue': { text: '继续。', emotion: 'happy' },
    'coach.live_hmm': { text: '嗯。', emotion: 'thinking' },
    'coach.live_yes': { text: '对。', emotion: 'happy' },
    'coach.im_listening': 'mira.listen',
    'route.probe': { text: '连续唱五遍，让我找到今天的状态。', emotion: 'gentle' },
    'route.active_search': { text: '我们找出今天最好的一遍。', emotion: 'happy' },
    'route.fix': { text: '这次只改一个地方。', emotion: 'gentle' },
    'route.state_kit': { text: '录一组更完整的数据。', emotion: 'thinking' },
  };

  const DEFAULT_SETTINGS = {
    enabled: true,
    volume: 0.92,
    adapter: 'voicepeak-library',
  };

  function readJsonStorage(key, fallback) {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      return { ...fallback, ...(JSON.parse(localStorage.getItem(key) || '{}') || {}) };
    } catch (error) {
      return fallback;
    }
  }

  function writeJsonStorage(key, value) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Speech settings should never block training.
    }
  }

  function clampText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_LENGTH);
  }

  function resolveLine(input, options = {}) {
    const rawId = options.cacheKey || options.id || String(input || '').trim();
    const mapped = FALLBACK_DIALOGUE[rawId];
    if (typeof mapped === 'string') {
      const core = CORE_LINES[mapped];
      return { id: mapped, text: core.text, emotion: core.emotion };
    }
    if (mapped) return { id: rawId, text: mapped.text, emotion: mapped.emotion || options.emotion || 'normal' };
    if (CORE_LINES[rawId]) return { id: rawId, ...CORE_LINES[rawId] };
    return {
      id: options.cacheKey || null,
      text: clampText(options.text || input),
      emotion: options.emotion || 'normal',
    };
  }

  class VoicepeakLibraryAdapter {
    constructor(options = {}) {
      this.manifestUrl = options.manifestUrl || MANIFEST_URL;
      this.baseUrl = this.manifestUrl.replace(/[^/]+$/, '');
      this.loader = options.loader;
      this.exists = options.exists;
      this.manifest = null;
      this.source = 'voicepeak-library';
      this.supports = { rate: false, pitch: false, volume: true };
    }

    async loadManifest() {
      if (this.manifest) return this.manifest;
      if (this.loader) {
        this.manifest = await this.loader(this.manifestUrl);
        return this.manifest;
      }
      if (typeof fetch === 'function') {
        const response = await fetch(this.manifestUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Mira voice manifest failed: ${response.status}`);
        this.manifest = await response.json();
        return this.manifest;
      }
      throw new Error('No manifest loader available');
    }

    async find(request = {}) {
      const manifest = await this.loadManifest();
      const line = resolveLine(request.cacheKey || request.text, request);
      let entry = line.id ? manifest[line.id] : null;
      if (!entry && line.text) {
        entry = Object.values(manifest).find((item) => item.text === line.text && (!request.emotion || item.emotion === request.emotion));
      }
      if (!entry?.file) {
        return { source: this.source, text: line.text, emotion: line.emotion, missing: true };
      }
      const audioPath = `${this.baseUrl}${entry.file}`;
      if (this.exists) {
        const ok = await this.exists(audioPath);
        if (!ok) return { source: this.source, text: entry.text || line.text, emotion: entry.emotion || line.emotion, audioPath, missing: true };
      }
      return {
        source: this.source,
        text: entry.text || line.text,
        emotion: entry.emotion || line.emotion,
        audioPath,
        missing: false,
      };
    }
  }

  class FallbackAdapter {
    constructor() {
      this.source = 'fallback';
      this.supports = { rate: false, pitch: false, volume: false };
    }

    async find(request = {}) {
      const line = resolveLine(request.cacheKey || request.text, request);
      return { source: this.source, text: line.text, emotion: line.emotion, missing: true };
    }
  }

  class SpeechQueue {
    constructor(options = {}) {
      this.audioFactory = options.audioFactory || ((path) => new Audio(path));
      this.now = options.now || (() => Date.now());
      this.queue = [];
      this.current = null;
      this.recent = new Map();
      this.onState = options.onState || function () {};
      this.onResult = options.onResult || function () {};
    }

    enqueue(result, request = {}) {
      const key = request.cacheKey || result.audioPath || result.text || '';
      const hasRecent = key && this.recent.has(key);
      const lastAt = hasRecent ? this.recent.get(key) : 0;
      if (hasRecent && this.now() - lastAt < DEDUPE_MS) {
        return Promise.resolve({ ...result, deduped: true });
      }
      this.recent.set(key, this.now());
      if (request.interrupt) this.stop();
      return new Promise((resolve) => {
        this.queue.push({ result, request, resolve });
        this.pump();
      });
    }

    pump() {
      if (this.current || !this.queue.length) return;
      const item = this.queue.shift();
      this.current = item;
      this.play(item);
    }

    play(item) {
      const { result, request, resolve } = item;
      this.onResult(result);
      if (!result.audioPath) {
        this.finish(item, result);
        return;
      }
      let audio;
      try {
        audio = this.audioFactory(result.audioPath);
        item.audio = audio;
        audio.volume = Number.isFinite(Number(request.volume)) ? Number(request.volume) : 0.92;
        this.onState(result.emotion === 'excited' ? 'celebrating' : 'speaking', result.text);
        const done = () => this.finish(item, result);
        audio.addEventListener?.('ended', done, { once: true });
        audio.addEventListener?.('error', () => {
          console.warn('[Mira Speech] WAV failed to load:', {
            speechId: request.cacheKey || null,
            audioPath: result.audioPath,
          });
          this.finish(item, { ...result, error: 'audio-load-failed' });
        }, { once: true });
        const playResult = audio.play?.();
        if (playResult?.then) {
          playResult.then(() => {
            console.info('[Mira Speech] Playing VOICEPEAK WAV:', {
              speechId: request.cacheKey || null,
              audioPath: result.audioPath,
            });
          }).catch((error) => {
            console.warn('[Mira Speech] WAV playback blocked or failed:', {
              speechId: request.cacheKey || null,
              audioPath: result.audioPath,
              error: error?.message || String(error),
            });
            this.finish(item, { ...result, error: 'audio-play-failed' });
          });
        }
      } catch (error) {
        this.finish(item, { ...result, error: error.message });
      }
    }

    finish(item, result) {
      if (this.current !== item) return;
      try {
        item.audio?.pause?.();
      } catch (error) {
        // Ignore player cleanup failures.
      }
      this.current = null;
      this.onState(item.request.afterState || 'idle', result.text);
      item.resolve(result);
      this.pump();
    }

    stop() {
      if (this.current?.audio) {
        try {
          this.current.audio.pause?.();
          this.current.audio.currentTime = 0;
        } catch (error) {
          // Ignore player cleanup failures.
        }
      }
      const current = this.current;
      this.current = null;
      if (current) current.resolve({ ...current.result, stopped: true });
      while (this.queue.length) {
        const item = this.queue.shift();
        item.resolve({ ...item.result, stopped: true });
      }
      this.onState('idle');
      return Promise.resolve();
    }
  }

  class MiraSpeechServiceImpl {
    constructor(options = {}) {
      this.settings = options.settings || readJsonStorage(STORAGE_KEY, DEFAULT_SETTINGS);
      this.adapter = options.adapter || new VoicepeakLibraryAdapter(options.library || {});
      this.fallback = options.fallback || new FallbackAdapter();
      this.missingStore = options.missingStore || MISSING_KEY;
      this.queue = options.queue || new SpeechQueue({
        audioFactory: options.audioFactory,
        now: options.now,
        onState: (state, text) => this.emitState(state, text),
        onResult: (result) => this.lastResult = result,
      });
      this.lastResult = null;
      this.listeners = new Set();
    }

    onState(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }

    emitState(state, text) {
      this.listeners.forEach((listener) => listener({ state, text }));
      if (typeof window !== 'undefined' && typeof window.setMiraPresenceState === 'function') {
        const mapped = state === 'speaking' ? 'speaking' : state === 'celebrating' ? 'celebrating' : state;
        window.setMiraPresenceState(mapped, text);
      }
    }

    setEnabled(enabled) {
      this.settings.enabled = Boolean(enabled);
      writeJsonStorage(STORAGE_KEY, this.settings);
      if (!this.settings.enabled) this.stop();
    }

    setVolume(volume) {
      this.settings.volume = Math.max(0, Math.min(1, Number(volume) || 0));
      writeJsonStorage(STORAGE_KEY, this.settings);
    }

    getMissingLines() {
      try {
        if (typeof localStorage === 'undefined') return [];
        return JSON.parse(localStorage.getItem(this.missingStore) || '[]');
      } catch (error) {
        return [];
      }
    }

    rememberMissing(request, result) {
      const text = clampText(result.text || request.text);
      if (!text) return;
      const line = {
        cacheKey: request.cacheKey || null,
        text,
        emotion: result.emotion || request.emotion || 'normal',
        firstSeenAt: new Date().toISOString(),
      };
      const existing = this.getMissingLines();
      if (!existing.some((item) => item.text === line.text && item.cacheKey === line.cacheKey)) {
        const next = [...existing, line].slice(-80);
        writeJsonStorage(this.missingStore, next);
        console.info('[Mira Speech] Missing VOICEPEAK library audio:', line);
      }
    }

    async speak(request = {}) {
      const normalized = {
        ...request,
        text: clampText(request.text || resolveLine(request.cacheKey || '').text),
        emotion: request.emotion || resolveLine(request.cacheKey || request.text, request).emotion,
        volume: Number.isFinite(Number(request.volume)) ? Number(request.volume) : this.settings.volume,
      };
      if (!this.settings.enabled) {
        console.info('[Mira Speech] Speech disabled; subtitle only:', normalized.cacheKey || normalized.text);
        return { source: 'fallback', text: normalized.text, disabled: true };
      }
      let result;
      try {
        result = await this.adapter.find(normalized);
      } catch (error) {
        console.warn('[Mira Speech] Adapter failed, falling back.', error);
        result = await this.fallback.find(normalized);
      }
      if (result.missing || !result.audioPath) {
        this.rememberMissing(normalized, result);
        result = { ...result, source: 'silent-fallback', audioPath: null };
      }
      return this.queue.enqueue(result, normalized);
    }

    speakById(id, options = {}) {
      return this.speak({
        ...options,
        cacheKey: id,
        text: options.text || resolveLine(id).text,
        emotion: options.emotion || resolveLine(id).emotion,
      });
    }

    stop() {
      return this.queue.stop();
    }

    async preload(requests = []) {
      await Promise.all(requests.map((request) => this.adapter.find(request).catch(() => null)));
    }
  }

  function createBrowserMiraSpeechService(options = {}) {
    return new MiraSpeechServiceImpl(options);
  }

  return {
    CORE_MIRA_SPEECH_LINES: CORE_LINES,
    MIRA_SPEECH_DIALOGUE: FALLBACK_DIALOGUE,
    VoicepeakLibraryAdapter,
    FallbackAdapter,
    SpeechQueue,
    MiraSpeechServiceImpl,
    createBrowserMiraSpeechService,
    resolveMiraSpeechLine: resolveLine,
  };
});
