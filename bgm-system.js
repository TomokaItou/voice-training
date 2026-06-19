const BGM_STORAGE_KEY = 'mira.bgm.settings.v1';
const BGM_TRACKS = ['assets/miras-practice-room.mp3'];
const BGM_TRACK_LABEL = "Mira's Practice Room";
const BGM_DEFAULT_VOLUME = 0.14;
const BGM_DUCK_VOLUME_RATIO = 0.25;
const BGM_FADE_SECONDS = 0.45;

function clampBgmVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return BGM_DEFAULT_VOLUME;
  }
  return Math.max(0, Math.min(0.35, number));
}

function loadBgmSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BGM_STORAGE_KEY) || '{}');
    bgmSettings = {
      enabled: parsed.enabled !== false,
      volume: clampBgmVolume(parsed.volume ?? BGM_DEFAULT_VOLUME),
    };
  } catch (error) {
    bgmSettings = { enabled: true, volume: BGM_DEFAULT_VOLUME };
  }
}

function saveBgmSettings() {
  try {
    localStorage.setItem(BGM_STORAGE_KEY, JSON.stringify(bgmSettings));
  } catch (error) {
    // BGM is ambience; storage failure should never block practice.
  }
}

function getBgmTargetGain() {
  if (!bgmSettings.enabled) {
    return 0;
  }
  if (bgmDuckingReasons.has('recording')) {
    return 0;
  }
  if (bgmDuckingReasons.size > 0) {
    return bgmSettings.volume * BGM_DUCK_VOLUME_RATIO;
  }
  return bgmSettings.volume;
}

function applyBgmGain(immediate = false) {
  const target = getBgmTargetGain();
  if (bgmAudioElement) {
    bgmAudioElement.volume = target;
  }
  if (!bgmMasterGain || !bgmAudioContext) {
    return;
  }
  const now = bgmAudioContext.currentTime;
  bgmMasterGain.gain.cancelScheduledValues(now);
  if (immediate) {
    bgmMasterGain.gain.setValueAtTime(target, now);
  } else {
    bgmMasterGain.gain.setTargetAtTime(target, now, BGM_FADE_SECONDS);
  }
}

function formatBgmStatus() {
  if (bgmUnavailable) {
    return 'BGM 不可用';
  }
  if (!bgmSettings.enabled) {
    return 'BGM 已暂停';
  }
  if (bgmDuckingReasons.has('recording')) {
    return '录音中静音';
  }
  if (bgmDuckingReasons.size > 0) {
    return 'BGM 轻一点';
  }
  if (!bgmStarted) {
    return bgmUserInteracted ? 'BGM 准备中' : '点一下开启';
  }
  return BGM_TRACK_LABEL;
}

function renderBgmControls() {
  if (bgmToggleButton) {
    bgmToggleButton.classList.toggle('is-playing', bgmSettings.enabled);
    bgmToggleButton.setAttribute('aria-pressed', String(bgmSettings.enabled));
    bgmToggleButton.textContent = bgmSettings.enabled ? '♪' : 'II';
  }
  if (bgmStatusText) {
    bgmStatusText.textContent = formatBgmStatus();
  }
  if (bgmVolumeRange) {
    const nextValue = String(Math.round(bgmSettings.volume * 100));
    if (bgmVolumeRange.value !== nextValue) {
      bgmVolumeRange.value = nextValue;
    }
  }
}

function createBgmOscillator(frequency, type, gainValue, destination, startTime, stopTime = null) {
  const oscillator = bgmAudioContext.createOscillator();
  const gain = bgmAudioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue), startTime + 1.2);
  if (stopTime) {
    gain.gain.setTargetAtTime(0.0001, stopTime - 0.8, 0.3);
    oscillator.stop(stopTime);
  }
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startTime);
  return oscillator;
}

function scheduleBgmStep() {
  if (!bgmAudioContext || !bgmPadGain || !bgmSparkleGain) {
    return;
  }
  const now = bgmAudioContext.currentTime;
  const progression = [
    [261.63, 329.63, 392.0, 523.25],
    [293.66, 349.23, 440.0, 587.33],
    [246.94, 329.63, 392.0, 493.88],
    [220.0, 277.18, 329.63, 440.0],
  ];
  const chord = progression[bgmCurrentStep % progression.length];
  const start = now + 0.08;
  const stop = start + 7.4;

  chord.forEach((frequency, index) => {
    createBgmOscillator(frequency, index % 2 ? 'sine' : 'triangle', index < 2 ? 0.035 : 0.018, bgmPadGain, start, stop);
  });

  const sparkleNotes = [chord[3], chord[2] * 2, chord[1] * 2];
  sparkleNotes.forEach((frequency, index) => {
    const noteStart = start + 1.3 + index * 1.15;
    createBgmOscillator(frequency, 'sine', 0.018, bgmSparkleGain, noteStart, noteStart + 1.1);
  });
  bgmCurrentStep += 1;
}

function startBgmScheduler() {
  if (bgmSchedulerTimer) {
    return;
  }
  scheduleBgmStep();
  bgmSchedulerTimer = setInterval(scheduleBgmStep, 7200);
}

function createBgmFallbackUrl() {
  const sampleRate = 22050;
  const durationSeconds = 16;
  const sampleCount = sampleRate * durationSeconds;
  const bytesPerSample = 2;
  const dataSize = sampleCount * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeString = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const chords = [
    [261.63, 329.63, 392.0],
    [293.66, 349.23, 440.0],
    [246.94, 329.63, 392.0],
    [220.0, 277.18, 329.63],
  ];
  for (let i = 0; i < sampleCount; i += 1) {
    const time = i / sampleRate;
    const chord = chords[Math.floor(time / 4) % chords.length];
    const envelope = 0.55 + 0.45 * Math.sin((Math.PI * 2 * time) / 8);
    const pad = chord.reduce((sum, frequency, index) => {
      return sum + Math.sin(Math.PI * 2 * frequency * time) * (index === 0 ? 0.12 : 0.07);
    }, 0);
    const bell = Math.sin(Math.PI * 2 * chord[2] * 2 * time) * Math.max(0, Math.sin(Math.PI * ((time % 4) / 4))) * 0.035;
    const sample = Math.max(-1, Math.min(1, (pad * envelope + bell) * 0.42));
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

async function ensureBgmElementStarted({ fallback = false } = {}) {
  if (!bgmAudioElement) {
    if (fallback && !bgmObjectUrl) {
      bgmObjectUrl = createBgmFallbackUrl();
    }
    bgmAudioElement = new Audio(fallback ? bgmObjectUrl : BGM_TRACKS[0]);
    bgmAudioElement.loop = true;
    bgmAudioElement.preload = 'auto';
  }
  bgmAudioElement.volume = getBgmTargetGain();
  await bgmAudioElement.play();
  bgmStarted = true;
  renderBgmControls();
  return true;
}

async function ensureBgmStarted() {
  if (!bgmSettings.enabled) {
    renderBgmControls();
    return false;
  }
  try {
    if (window.Audio) {
      try {
        return await ensureBgmElementStarted();
      } catch (audioError) {
        if (audioError?.name === 'NotAllowedError') {
          bgmStarted = false;
          renderBgmControls();
          return false;
        }
        bgmAudioElement = null;
      }
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      try {
        return await ensureBgmElementStarted({ fallback: true });
      } catch (audioError) {
        bgmUnavailable = audioError?.name !== 'NotAllowedError';
        bgmStarted = false;
        renderBgmControls();
        return false;
      }
    }
    if (!bgmAudioContext) {
      bgmAudioContext = new AudioContextClass();
      bgmMasterGain = bgmAudioContext.createGain();
      bgmPadGain = bgmAudioContext.createGain();
      bgmSparkleGain = bgmAudioContext.createGain();
      bgmPadGain.gain.value = 0.72;
      bgmSparkleGain.gain.value = 0.28;
      bgmPadGain.connect(bgmMasterGain);
      bgmSparkleGain.connect(bgmMasterGain);
      bgmMasterGain.connect(bgmAudioContext.destination);
      applyBgmGain(true);
    }
    if (bgmAudioContext.state === 'suspended') {
      await bgmAudioContext.resume();
    }
    bgmStarted = true;
    startBgmScheduler();
    applyBgmGain();
    renderBgmControls();
    return true;
  } catch (error) {
    if (!bgmAudioContext) {
      try {
        return await ensureBgmElementStarted();
      } catch (fallbackError) {
        try {
          bgmAudioElement = null;
          return await ensureBgmElementStarted({ fallback: true });
        } catch (generatedFallbackError) {
          bgmUnavailable = fallbackError?.name !== 'NotAllowedError' && generatedFallbackError?.name !== 'NotAllowedError';
        }
      }
    }
    bgmStarted = false;
    renderBgmControls();
    return false;
  }
}

function setBgmEnabled(enabled) {
  bgmSettings.enabled = Boolean(enabled);
  saveBgmSettings();
  if (!bgmSettings.enabled && bgmAudioElement) {
    bgmAudioElement.pause();
  }
  applyBgmGain();
  renderBgmControls();
  if (bgmSettings.enabled) {
    ensureBgmStarted();
  }
}

function toggleBgm() {
  bgmUserInteracted = true;
  setBgmEnabled(!bgmSettings.enabled);
}

function setBgmVolume(value) {
  bgmSettings.volume = clampBgmVolume(Number(value) / 100);
  saveBgmSettings();
  applyBgmGain();
  renderBgmControls();
  if (bgmSettings.enabled) {
    ensureBgmStarted();
  }
}

function setBgmDucking(reason, active) {
  if (!reason) {
    return;
  }
  if (active) {
    bgmDuckingReasons.add(reason);
  } else {
    bgmDuckingReasons.delete(reason);
  }
  applyBgmGain();
  renderBgmControls();
}

function handleFirstBgmGesture() {
  bgmUserInteracted = true;
  ensureBgmStarted();
  window.removeEventListener('pointerdown', handleFirstBgmGesture, true);
  window.removeEventListener('keydown', handleFirstBgmGesture, true);
}

function initBgmSystem() {
  loadBgmSettings();
  renderBgmControls();
  ensureBgmStarted();
  window.addEventListener('pointerdown', handleFirstBgmGesture, true);
  window.addEventListener('keydown', handleFirstBgmGesture, true);
}

window.setBgmDucking = setBgmDucking;
window.ensureBgmStarted = ensureBgmStarted;
