const readinessDemucsCommand = '.\\scripts\\start-separation-server.cmd';
const readinessWhisperCommand = '.\\scripts\\start-lyrics-whisper.cmd';
let readinessHasRun = false;

function setReadinessItem(check, tone, detail) {
  const item = readinessCheckGrid?.querySelector(`[data-check="${check}"]`);
  if (!item) {
    return;
  }
  item.dataset.tone = tone;
  const detailEl = item.querySelector('span:last-child');
  if (detailEl) {
    detailEl.textContent = detail;
  }
}

function setReadinessStatus(text, tone = 'neutral') {
  if (!readinessStatus) {
    return;
  }
  readinessStatus.textContent = text;
  readinessStatus.dataset.tone = tone;
}

function fetchJsonWithTimeout(url, timeoutMs = 1200) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, {
    cache: 'no-store',
    signal: controller.signal,
  })
    .then(async (response) => ({
      ok: response.ok,
      status: response.status,
      data: await response.json().catch(() => ({})),
    }))
    .finally(() => clearTimeout(timeout));
}

async function copyReadinessCommand(command, label) {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(command);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = command;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    setReadinessStatus(`已复制 ${label} 启动命令，可以粘贴到项目目录里的终端运行。`, 'good');
  } catch (_error) {
    setReadinessStatus(`${label} 命令：${command}`, 'warn');
  }
}

async function runReadinessChecks() {
  if (!readinessCheckGrid) {
    return;
  }

  readinessHasRun = true;
  setReadinessStatus('正在检查本机能力...');
  if (runReadinessCheckButton) {
    runReadinessCheckButton.disabled = true;
  }
  ['microphone', 'secure', 'demucs', 'whisper'].forEach((check) => {
    setReadinessItem(check, 'checking', '检查中...');
  });

  const hasMediaDevices = Boolean(navigator.mediaDevices?.getUserMedia);
  setReadinessItem(
    'microphone',
    hasMediaDevices ? 'good' : 'bad',
    hasMediaDevices ? '浏览器支持录音' : '当前浏览器不支持录音'
  );

  const secureEnough = window.isSecureContext || ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  setReadinessItem(
    'secure',
    secureEnough ? 'good' : 'warn',
    secureEnough ? '可以请求麦克风权限' : '建议用 localhost 或 HTTPS 打开'
  );

  const serviceChecks = await Promise.allSettled([
    fetchJsonWithTimeout(LOCAL_SEPARATION_HEALTH_ENDPOINT),
    fetchJsonWithTimeout(songLyricsTranscriptionEndpoint.replace('/api/transcribe-lyrics', '/health')),
  ]);

  const demucs = serviceChecks[0];
  if (demucs.status === 'fulfilled' && demucs.value.ok && demucs.value.data?.ok) {
    setReadinessItem(
      'demucs',
      demucs.value.data.demucs_available ? 'good' : 'warn',
      demucs.value.data.demucs_available ? '服务已启动' : '服务开着，但 Demucs 未就绪'
    );
  } else {
    setReadinessItem('demucs', 'warn', '未启动，可用浏览器候选分离');
  }

  const whisper = serviceChecks[1];
  if (whisper.status === 'fulfilled' && whisper.value.ok) {
    setReadinessItem('whisper', 'good', '服务已启动');
  } else {
    setReadinessItem('whisper', 'warn', '未启动，仍可读内嵌歌词');
  }

  const warningCount = [...readinessCheckGrid.querySelectorAll('.readiness-item')].filter((item) =>
    ['warn', 'bad'].includes(item.dataset.tone)
  ).length;
  setReadinessStatus(
    warningCount
      ? '核心练习可以使用；需要人声分离或 Whisper 歌词时，先启动对应本地服务。'
      : '本机能力已就绪，可以直接开始练习。',
    warningCount ? 'warn' : 'good'
  );
  if (runReadinessCheckButton) {
    runReadinessCheckButton.disabled = false;
  }
}

runReadinessCheckButton?.addEventListener('click', runReadinessChecks);
readinessCard?.addEventListener('toggle', () => {
  if (readinessCard.open && !readinessHasRun) {
    runReadinessChecks();
  }
});
copyDemucsCommandButton?.addEventListener('click', () => {
  copyReadinessCommand(readinessDemucsCommand, 'Demucs');
});
copyWhisperCommandButton?.addEventListener('click', () => {
  copyReadinessCommand(readinessWhisperCommand, 'Whisper');
});
