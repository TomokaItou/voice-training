(function () {
  const PHRASES = {
    enter: ['mira.welcome', 'mira.lesson_start'],
    beforeTarget: ['mira.listen'],
    beforeRecord: ['mira.listen'],
    afterRecord: ['mira.retry', 'mira.softer', 'mira.success'],
    fail: ['mira.retry'],
    finish: ['mira.finish'],
    live: ['mira.thinking'],
  };

  const LEGACY_TO_SPEECH_ID = {
    'coach.start_today': 'mira.lesson_start',
    'coach.arrived': 'mira.welcome',
    'coach.no_whole_song': 'mira.lesson_start',
    'coach.just_one_segment': 'mira.lesson_start',
    'coach.sing_when_ready': 'mira.listen',
    'coach.ready': 'mira.listen',
    'coach.lets_start': 'mira.lesson_start',
    'coach.listen_once': 'mira.listen',
    'coach.notice_last_note': 'mira.listen',
    'coach.your_turn': 'mira.listen',
    'coach.one_line_only': 'mira.listen',
    'coach.good': 'mira.retry',
    'coach.retry': 'mira.retry',
    'coach.retry_good': 'mira.retry',
    'coach.retry_lightly': 'mira.softer',
    'coach.dont_rush': 'mira.retry',
    'coach.thats_it': 'mira.success',
    'coach.simpler': 'mira.retry',
    'coach.slow_down_tired': 'mira.retry',
    'coach.finish_today': 'mira.finish',
    'coach.good_work_today': 'mira.finish',
    'coach.progress_today': 'mira.success',
    'coach.tomorrow': 'mira.finish',
    'coach.stop': 'mira.finish',
    'coach.ok': 'mira.listen',
    'coach.sing_this_line': 'mira.listen',
    'coach.stop_after_line': 'mira.listen',
    'coach.more_stable': 'mira.success',
    'coach.first_word_lightly': 'mira.softer',
    'coach.continue': 'mira.listen',
    'coach.live_hmm': 'mira.thinking',
    'coach.live_yes': 'mira.success',
    'coach.im_listening': 'mira.listen',
    'route.probe': 'mira.lesson_start',
    'route.active_search': 'mira.success',
    'route.fix': 'mira.softer',
    'route.state_kit': 'mira.thinking',
  };

  let liveCueTimer = null;
  let service = null;
  let lastSubtitleText = '';

  function ensureService() {
    if (service) return service;
    if (typeof window.createBrowserMiraSpeechService === 'function') {
      service = window.MiraSpeechService || window.createBrowserMiraSpeechService();
      window.MiraSpeechService = service;
    }
    return service;
  }

  function resolveSpeechId(messageOrText, options = {}) {
    const raw = options.speechId || options.cacheKey || messageOrText;
    if (typeof raw === 'string' && raw.startsWith('mira.')) return raw;
    return LEGACY_TO_SPEECH_ID[raw] || null;
  }

  function resolveDialogue(messageOrText, options = {}) {
    const speechId = resolveSpeechId(messageOrText, options);
    const line = window.resolveMiraSpeechLine
      ? window.resolveMiraSpeechLine(speechId || messageOrText, { ...options, cacheKey: speechId || options.cacheKey })
      : { id: speechId, text: String(messageOrText || ''), emotion: options.emotion || 'normal' };
    return {
      id: speechId || line.id,
      subtitleText: options.subtitleText || line.text,
      emotion: options.emotion || line.emotion || 'normal',
    };
  }

  function getSubtitle() {
    return document.getElementById('miraVoiceSubtitle') || document.getElementById('miraStateBubble');
  }

  function getMood() {
    return document.getElementById('miraVoiceMood');
  }

  function getVoiceToggles() {
    return Array.from(document.querySelectorAll('[data-mira-voice-toggle], #miraVoiceMuteButton'));
  }

  function getVoiceStatusElements() {
    return Array.from(document.querySelectorAll('[data-mira-voice-status]'));
  }

  function setSubtitle(text, mood = 'Mira') {
    lastSubtitleText = text;
    const subtitle = getSubtitle();
    const moodElement = getMood();
    if (subtitle) subtitle.textContent = text;
    if (moodElement) moodElement.textContent = mood;
  }

  function updateControls() {
    const speech = ensureService();
    const enabled = speech?.settings?.enabled !== false;
    getVoiceToggles().forEach((button) => {
      button.textContent = enabled ? '语音开' : '语音关';
      button.setAttribute('aria-pressed', enabled ? 'false' : 'true');
    });
    getVoiceStatusElements().forEach((element) => {
      element.textContent = '';
      element.hidden = true;
    });
  }

  async function stopCurrentSpeech() {
    window.clearInterval(liveCueTimer);
    liveCueTimer = null;
    await ensureService()?.stop?.();
    updateControls();
  }

  async function speakById(id, options = {}) {
    const dialogue = resolveDialogue(id, { ...options, speechId: id });
    const subtitle = String(options.subtitleText || dialogue.subtitleText || '').trim();
    if (subtitle) setSubtitle(subtitle, options.mood || 'Mira');
    const result = await ensureService()?.speakById?.(id, {
      text: dialogue.subtitleText,
      emotion: dialogue.emotion,
      volume: options.volume,
      interrupt: options.interrupt ?? true,
      afterState: options.afterState,
    });
    updateControls();
    return result || { source: 'silent-fallback' };
  }

  async function say(messageOrText, options = {}) {
    const dialogue = resolveDialogue(messageOrText, options);
    if (!dialogue.id) {
      if (dialogue.subtitleText) setSubtitle(dialogue.subtitleText, options.mood || 'Mira');
      return { source: 'silent-fallback', missingId: true };
    }
    return speakById(dialogue.id, { ...options, subtitleText: dialogue.subtitleText });
  }

  async function sequence(lines, options = {}) {
    const ids = lines.map((line) => resolveSpeechId(line, options)).filter(Boolean);
    let lastResult = null;
    for (const id of ids) {
      lastResult = await speakById(id, { ...options, interrupt: false });
      if (options.pauseMs) {
        await new Promise((resolve) => window.setTimeout(resolve, options.pauseMs));
      }
    }
    if (typeof options.after === 'function') options.after();
    return lastResult;
  }

  function setMuted(nextMuted) {
    ensureService()?.setEnabled?.(!nextMuted);
    updateControls();
  }

  function setBackend() {
    updateControls();
  }

  function pickPhrase(key) {
    const list = PHRASES[key] || [];
    return list[Math.floor(Math.random() * list.length)] || '';
  }

  function cue(key, options = {}) {
    return say(options.messageId || options.text || pickPhrase(key), options);
  }

  function startLiveCues(options = {}) {
    stopLiveCues();
    if (options.subtitlesOnly || ensureService()?.settings?.enabled === false) return;
    liveCueTimer = window.setInterval(() => {
      speakById('mira.thinking', { volume: 0.52, interrupt: false, afterState: 'listening' });
    }, options.intervalMs || 5200);
  }

  function stopLiveCues(finalLine) {
    if (liveCueTimer) {
      window.clearInterval(liveCueTimer);
      liveCueTimer = null;
    }
    if (finalLine) {
      const dialogue = resolveDialogue(finalLine);
      if (dialogue.subtitleText) setSubtitle(dialogue.subtitleText, 'Mira');
    }
  }

  function init() {
    const speech = ensureService();
    speech?.preload?.(Object.keys(window.CORE_MIRA_SPEECH_LINES || {}).map((id) => ({ cacheKey: id })));
    document.documentElement.dataset.miraVoiceCoach = 'ready';
    updateControls();
    getVoiceToggles().forEach((button) => {
      if (button.dataset.miraVoiceBound === 'true') return;
      button.dataset.miraVoiceBound = 'true';
      button.addEventListener('click', () => setMuted(ensureService()?.settings?.enabled !== false));
    });
  }

  window.MiraVoiceCoach = {
    init,
    say,
    sequence,
    cue,
    speakById,
    dialogue: window.MIRA_SPEECH_DIALOGUE || {},
    resolveDialogue,
    phrases: PHRASES,
    setSubtitle,
    setMuted,
    setBackend,
    startLiveCues,
    stopLiveCues,
    testVoicevox: () => speakById('mira.welcome'),
    stop: stopCurrentSpeech,
    get settings() {
      const speech = ensureService();
      return {
        ...(speech?.settings || {}),
        lastSubtitleText,
        lastResult: speech?.lastResult || null,
      };
    },
    get muted() {
      return ensureService()?.settings?.enabled === false;
    },
  };
  window.miraSpeechSpeakById = speakById;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
