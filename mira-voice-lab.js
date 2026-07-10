(function () {
  function shouldShowVoiceLab() {
    const params = new URLSearchParams(window.location.search);
    const localHost = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
    const devRoute = window.location.pathname.replace(/\/+$/, '') === '/dev/mira-voice';
    return localHost && (params.get('voiceLab') === '1' || devRoute);
  }

  function getSpeechService() {
    if (!window.MiraSpeechService && typeof window.createBrowserMiraSpeechService === 'function') {
      window.MiraSpeechService = window.createBrowserMiraSpeechService();
    }
    return window.MiraSpeechService;
  }

  function createPanel() {
    if (document.getElementById('miraVoiceLab')) return;
    const panel = document.createElement('section');
    panel.className = 'mira-voice-lab';
    panel.id = 'miraVoiceLab';
    panel.innerHTML = `
      <div class="mira-voice-lab-header">
        <div>
          <span class="game-label">Mira Voice Lab</span>
          <h2>VOICEPEAK 素材试听</h2>
          <p>仅本地开发可见。正式界面不会显示这个面板。</p>
        </div>
        <div class="mira-voice-lab-status">
          <span id="miraVoiceLabCache">等待试听</span>
        </div>
      </div>
      <div class="mira-voice-lab-grid">
        <label>
          台词
          <select id="miraVoiceLabLineSelect"></select>
        </label>
        <label>
          情绪
          <select id="miraVoiceLabEmotionSelect">
            <option value="normal">normal</option>
            <option value="happy">happy</option>
            <option value="excited">excited</option>
            <option value="gentle">gentle</option>
            <option value="thinking">thinking</option>
          </select>
        </label>
        <label>
          音量
          <input id="miraVoiceLabVolume" type="range" min="0" max="1" step="0.01" value="0.92" />
        </label>
      </div>
      <div class="mira-voice-lab-actions">
        <button id="miraVoiceLabPlayButton" type="button">播放</button>
        <button id="miraVoiceLabStopButton" class="secondary" type="button">停止</button>
        <button id="miraVoiceLabPlayAllButton" class="secondary" type="button">连续试听核心台词</button>
      </div>
      <div class="mira-voice-lab-readout">
        <p id="miraVoiceLabText">选择台词后试听。</p>
      </div>
      <details class="mira-voice-lab-missing">
        <summary>开发诊断</summary>
        <pre id="miraVoiceLabMissingLines">[]</pre>
      </details>
    `;
    document.body.prepend(panel);
  }

  function getSelectedRequest() {
    const id = document.getElementById('miraVoiceLabLineSelect')?.value || 'mira.welcome';
    const core = window.CORE_MIRA_SPEECH_LINES?.[id] || {};
    return {
      cacheKey: id,
      text: core.text || id,
      emotion: document.getElementById('miraVoiceLabEmotionSelect')?.value || core.emotion || 'normal',
      volume: Number(document.getElementById('miraVoiceLabVolume')?.value || 0.92),
      interrupt: true,
    };
  }

  function renderLineOptions() {
    const select = document.getElementById('miraVoiceLabLineSelect');
    if (!select || select.options.length) return;
    Object.entries(window.CORE_MIRA_SPEECH_LINES || {}).forEach(([id, line]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `${id} · ${line.text}`;
      select.append(option);
    });
  }

  async function buildDiagnostic() {
    const service = getSpeechService();
    const manifest = await service?.adapter?.loadManifest?.().catch(() => ({})) || {};
    const calls = [
      ['enter_today_lesson', 'mira.welcome'],
      ['lesson_start', 'mira.lesson_start'],
      ['invite_recording', 'mira.listen'],
      ['analysis_waiting', 'mira.thinking'],
      ['retry_feedback', 'mira.retry'],
      ['softer_feedback', 'mira.softer'],
      ['less_air_feedback', 'mira.less_air'],
      ['success_feedback', 'mira.success'],
      ['save_success', 'mira.save_success'],
      ['finish_lesson', 'mira.finish'],
    ];
    const missing = service?.getMissingLines?.() || [];
    return {
      speechCalls: calls.map(([point, id]) => ({
        point,
        speechId: id,
        wav: manifest[id]?.file || null,
        hasManifestEntry: Boolean(manifest[id]?.file),
      })),
      missingLines: missing,
      unsupportedPagesToCheck: [],
    };
  }

  async function renderSelection() {
    const request = getSelectedRequest();
    const service = getSpeechService();
    const lineText = document.getElementById('miraVoiceLabText');
    const cacheText = document.getElementById('miraVoiceLabCache');
    if (lineText) lineText.textContent = request.text;
    try {
      const result = await service?.adapter?.find?.(request);
      if (cacheText) cacheText.textContent = result?.missing ? '素材缺失，试听时保持静音' : '素材已命中';
    } catch (error) {
      if (cacheText) cacheText.textContent = '素材检查失败';
    }
    const target = document.getElementById('miraVoiceLabMissingLines');
    if (target) target.textContent = JSON.stringify(await buildDiagnostic(), null, 2);
  }

  async function playSelected() {
    const service = getSpeechService();
    const request = getSelectedRequest();
    const result = await service?.speakById?.(request.cacheKey, { ...request, afterState: 'idle' });
    const cacheText = document.getElementById('miraVoiceLabCache');
    if (cacheText) cacheText.textContent = result?.audioPath ? '正在播放 VOICEPEAK WAV' : '素材缺失，保持静音';
    await renderSelection();
  }

  async function playAllCoreLines() {
    const service = getSpeechService();
    const entries = Object.entries(window.CORE_MIRA_SPEECH_LINES || {});
    for (const [id, line] of entries) {
      await service?.speakById?.(id, {
        text: line.text,
        emotion: line.emotion,
        volume: Number(document.getElementById('miraVoiceLabVolume')?.value || 0.92),
        interrupt: false,
        afterState: 'idle',
      });
    }
    await renderSelection();
  }

  function initMiraVoiceLab() {
    if (!shouldShowVoiceLab()) return;
    createPanel();
    renderLineOptions();
    renderSelection();
    document.getElementById('miraVoiceLabLineSelect')?.addEventListener('change', renderSelection);
    document.getElementById('miraVoiceLabEmotionSelect')?.addEventListener('change', renderSelection);
    document.getElementById('miraVoiceLabPlayButton')?.addEventListener('click', playSelected);
    document.getElementById('miraVoiceLabStopButton')?.addEventListener('click', () => getSpeechService()?.stop?.());
    document.getElementById('miraVoiceLabPlayAllButton')?.addEventListener('click', playAllCoreLines);
    document.getElementById('miraVoiceLabVolume')?.addEventListener('input', (event) => {
      getSpeechService()?.setVolume?.(Number(event.target.value));
    });
  }

  window.initMiraVoiceLab = initMiraVoiceLab;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMiraVoiceLab);
  } else {
    initMiraVoiceLab();
  }
})();
