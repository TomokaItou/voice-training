const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const recordButton = document.getElementById('recordButton');
const stopRecordButton = document.getElementById('stopRecordButton');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const formantToggle = document.getElementById('formantToggle');
const formantF1El = document.getElementById('formantF1');
const formantF2El = document.getElementById('formantF2');
const formantStatusEl = document.getElementById('formantStatus');
const pitchAlgorithmSelect = document.getElementById('pitchAlgorithmSelect');
const pitchScaleModeSelect = document.getElementById('pitchScaleModeSelect');
const displayModeSelect = document.getElementById('displayModeSelect');
const spectrogramOverlaySelect = document.getElementById('spectrogramOverlaySelect');
const audioFileInput = document.getElementById('audioFileInput');
const clearFileButton = document.getElementById('clearFileButton');
const dataSourceValue = document.getElementById('dataSourceValue');
const analysisStatus = document.getElementById('analysisStatus');
const statusEl = document.getElementById('status');
const appTitle = document.getElementById('appTitle');
const appDescription = document.getElementById('appDescription');
const pitchValueEl = document.getElementById('pitchValue');
const noteValueEl = document.getElementById('noteValue');
const breathDashboard = document.getElementById('breathDashboard');
const breathScoreHeroValue = document.getElementById('breathScoreHeroValue');
const breathVoiceHeroValue = document.getElementById('breathVoiceHeroValue');
const breathStabilityHeroValue = document.getElementById('breathStabilityHeroValue');
const breathDurationHeroValue = document.getElementById('breathDurationHeroValue');
const breathEffortHeroValue = document.getElementById('breathEffortHeroValue');
const breathNoiseHeroValue = document.getElementById('breathNoiseHeroValue');
const breathLeakHeroValue = document.getElementById('breathLeakHeroValue');
const breathCalibrationHeroValue = document.getElementById('breathCalibrationHeroValue');
const breathFlowValueEl = document.getElementById('breathFlowValue');
const breathEffortValueEl = document.getElementById('breathEffortValue');
const breathNoiseValueEl = document.getElementById('breathNoiseValue');
const breathLeakValueEl = document.getElementById('breathLeakValue');
const breathVoiceTypeValueEl = document.getElementById('breathVoiceTypeValue');
const breathStabilityValueEl = document.getElementById('breathStabilityValue');
const breathCalibrationValueEl = document.getElementById('breathCalibrationValue');
const breathCalibrateButton = document.getElementById('breathCalibrateButton');
const breathReport = document.getElementById('breathReport');
const breathReportSummary = document.getElementById('breathReportSummary');
const breathReportAverage = document.getElementById('breathReportAverage');
const breathReportPeak = document.getElementById('breathReportPeak');
const breathReportEffort = document.getElementById('breathReportEffort');
const breathReportHighFrequency = document.getElementById('breathReportHighFrequency');
const breathReportLeakNoise = document.getElementById('breathReportLeakNoise');
const breathReportVoiceType = document.getElementById('breathReportVoiceType');
const breathReportBreaks = document.getElementById('breathReportBreaks');
const breathReportFeedback = document.getElementById('breathReportFeedback');
const pitchScoreDashboard = document.getElementById('pitchScoreDashboard');
const pitchScoreValue = document.getElementById('pitchScoreValue');
const pitchScoreCaption = document.getElementById('pitchScoreCaption');
const pitchScoreTargetValue = document.getElementById('pitchScoreTargetValue');
const pitchScoreCentsValue = document.getElementById('pitchScoreCentsValue');
const pitchScoreStabilityValue = document.getElementById('pitchScoreStabilityValue');
const pitchScoreHitRateValue = document.getElementById('pitchScoreHitRateValue');
const pitchScoreAverageValue = document.getElementById('pitchScoreAverageValue');
const pitchScoreCoverageValue = document.getElementById('pitchScoreCoverageValue');
const chartLegendLow = document.getElementById('chartLegendLow');
const chartLegendHigh = document.getElementById('chartLegendHigh');
const accompanimentInput = document.getElementById('accompanimentInput');
const playAccompanimentButton = document.getElementById('playAccompanimentButton');
const pauseAccompanimentButton = document.getElementById('pauseAccompanimentButton');
const stopAccompanimentButton = document.getElementById('stopAccompanimentButton');
const accompanimentVolume = document.getElementById('accompanimentVolume');
const accompanimentStatus = document.getElementById('accompanimentStatus');
const pitchAccuracyButton = document.getElementById('pitchAccuracyButton');
const pitchAccuracyResult = document.getElementById('pitchAccuracyResult');
const songTargetPanel = document.getElementById('songTargetPanel');
const songPitchInput = document.getElementById('songPitchInput');
const songPitchToggle = document.getElementById('songPitchToggle');
const clearSongPitchButton = document.getElementById('clearSongPitchButton');
const songPitchStatus = document.getElementById('songPitchStatus');
const playSongPitchButton = document.getElementById('playSongPitchButton');
const pauseSongPitchButton = document.getElementById('pauseSongPitchButton');
const stopSongPitchButton = document.getElementById('stopSongPitchButton');
const songPitchPlaybackStatus = document.getElementById('songPitchPlaybackStatus');
const songPitchStats = document.getElementById('songPitchStats');
const songTrainingResult = document.getElementById('songTrainingResult');
const volumeMeterToggle = document.getElementById('volumeMeterToggle');
const tiltMeterToggle = document.getElementById('tiltMeterToggle');
const volumeMeterColumn = document.getElementById('volumeMeterColumn');
const volumeMeter = document.getElementById('volumeMeter');
const volumeMeterBar = document.getElementById('volumeMeterBar');
const tiltMeterColumn = document.getElementById('tiltMeterColumn');
const tiltMeter = document.getElementById('tiltMeter');
const tiltMeterBar = document.getElementById('tiltMeterBar');
const canvas = document.getElementById('pitchCanvas');
const ctx = canvas.getContext('2d');
const pitchInspectorPanel = document.getElementById('pitchInspectorPanel');
const selectedPitchValue = document.getElementById('selectedPitchValue');
const selectedPitchHint = document.getElementById('selectedPitchHint');
const recordingTimelinePanel = document.getElementById('recordingTimelinePanel');
const recordingTimelineCanvas = document.getElementById('recordingTimelineCanvas');
const recordingTimelineCtx = recordingTimelineCanvas?.getContext('2d');
const recordingTimelineStatus = document.getElementById('recordingTimelineStatus');
const timelinePlayPauseButton = document.getElementById('timelinePlayPauseButton');
const waveformPreviewCanvas = document.getElementById('waveformPreviewCanvas');
const waveformPreviewCtx = waveformPreviewCanvas?.getContext('2d');
const waveformTimeValue = document.getElementById('waveformTimeValue');
const canvasScaleRange = document.getElementById('canvasScaleRange');
const canvasScaleValue = document.getElementById('canvasScaleValue');
const analyzeRecordingButton = document.getElementById('analyzeRecordingButton');
const downloadRecordingButton = document.getElementById('downloadRecordingButton');
const appWindow = document.getElementById('appWindow');
const modeLauncher = document.getElementById('modeLauncher');
const openCurveModeButton = document.getElementById('openCurveModeButton');
const openSpectrogramModeButton = document.getElementById('openSpectrogramModeButton');
const openBreathModeButton = document.getElementById('openBreathModeButton');
const openPitchScoreModeButton = document.getElementById('openPitchScoreModeButton');
const openMemoryModeButton = document.getElementById('openMemoryModeButton');
const backToHomeButton = document.getElementById('backToHomeButton');
const curveSwitcher = document.getElementById('curveSwitcher');
const curvePitchButton = document.getElementById('curvePitchButton');
const curveVolumeButton = document.getElementById('curveVolumeButton');
const curveFormantButton = document.getElementById('curveFormantButton');
const songSearchForm = document.getElementById('songSearchForm');
const songSearchInput = document.getElementById('songSearchInput');
const songSearchButton = document.getElementById('songSearchButton');
const songSearchStatus = document.getElementById('songSearchStatus');
const songSearchResults = document.getElementById('songSearchResults');
const targetPitchToggle = document.getElementById('targetPitchToggle');
const targetPitchInput = document.getElementById('targetPitchInput');
const offlineWindowControl = document.getElementById('offlineWindowControl');
const offlineWindowRange = document.getElementById('offlineWindowRange');
const offlineWindowStartValue = document.getElementById('offlineWindowStartValue');
const offlineWindowEndValue = document.getElementById('offlineWindowEndValue');
const offlineWindowDurationValue = document.getElementById('offlineWindowDurationValue');
const memoryDashboard = document.getElementById('memoryDashboard');
const memoryZoneCard = document.getElementById('memoryZoneCard');
const memoryZoneTitle = document.getElementById('memoryZoneTitle');
const memoryZoneCopy = document.getElementById('memoryZoneCopy');
const memoryZoneBadge = document.getElementById('memoryZoneBadge');
const memoryTargetSelect = document.getElementById('memoryTargetSelect');
const memoryPathSelect = document.getElementById('memoryPathSelect');
const memoryInstructionSelect = document.getElementById('memoryInstructionSelect');
const memoryAnalyzeButton = document.getElementById('memoryAnalyzeButton');
const memorySoundError = document.getElementById('memorySoundError');
const memoryHiddenLoad = document.getElementById('memoryHiddenLoad');
const memoryRank = document.getElementById('memoryRank');
const memoryRecovery = document.getElementById('memoryRecovery');
const memoryPhiSn = document.getElementById('memoryPhiSn');
const memoryPhiEtex = document.getElementById('memoryPhiEtex');
const memoryBreathiness = document.getElementById('memoryBreathiness');
const memoryClosure = document.getElementById('memoryClosure');
const memoryControlTitle = document.getElementById('memoryControlTitle');
const memoryControlCopy = document.getElementById('memoryControlCopy');
const memoryControlScore = document.getElementById('memoryControlScore');
const memoryRecommendation = document.getElementById('memoryRecommendation');

let audioContext;
let analyser;
let dataArray;
let frequencyData;
let sourceNode;
let animationId;
let pitchHistory = [];
let volumeHistory = [];
const maxHistorySeconds = 12;
const displayUpdateIntervalMs = 150;
const baseCanvasWidth = 720;
const baseCanvasHeight = 360;
const baseAppMaxWidth = 920;
const spectrogramCanvasWidth = 1040;
const spectrogramCanvasHeight = 520;
const spectrogramAppMaxWidth = 1280;
const minResizableWidth = 640;
const minResizableHeight = 520;
const pitchMinHz = 60;
const pitchMaxHz = 1000;
const pitchScaleFixedMinHz = 50;
const pitchScaleFixedMaxHz = 500;
const pitchScaleLogMinHz = 60;
const pitchScaleLogMaxHz = 1000;
const spectrogramMinDb = -94;
const spectrogramMaxDb = -32;
const spectrogramDisplayMinHz = 65;
const spectrogramDisplayMaxHz = 4200;
const spectrogramPianoWidth = 54;
const spectrogramAxisWidth = 58;
const spectrogramProfileWidth = 220;
const spectrogramWaveformHeight = 94;
const spectrogramTimeAxisHeight = 22;
const spectrogramOverlayLineWidth = 2;
const spectrogramOverlayColors = {
  pitch: '#0f766e',
  f1: '#22c55e',
  f2: '#f97316',
};
const volumeMeterMinDb = -60;
const volumeMeterMaxDb = 0;
const tiltMeterMinDb = -30;
const tiltMeterMaxDb = 30;
const tiltLowBandHz = { min: 200, max: 800 };
const tiltHighBandHz = { min: 2000, max: 5000 };
const breathFlowMinDb = -58;
const breathFlowMaxDb = -18;
const breathActiveThreshold = 0.08;
const breathTargetMin = 0.45;
const breathTargetMax = 0.75;
const breathHistoryWindowSeconds = 12;
const breathStabilityWindowSize = 18;
const breathCalibrationDurationMs = 2000;
const breathHighFrequencyMinHz = 3000;
const breathTotalEnergyMinHz = 200;
const hnrMinFrequencyHz = 70;
const hnrMaxFrequencyHz = 500;
const pitchMinEnergyThreshold = 0.0035;
const pitchAdaptiveEnergyMultiplier = 1.7;
const pitchNoiseFloorRiseAlpha = 0.06;
const pitchNoiseFloorFallAlpha = 0.22;
const pitchEnergyRef = 0.01;
const pitchOnsetConfidenceThreshold = 0.42;
const pitchSustainConfidenceThreshold = 0.18;
const pitchMedianWindowSize = 5;
const pitchMaxJumpHz = 30;
const pitchMaxJumpCents = 50;
const pitchEmaAlpha = 0.25;
const pitchFastTransitionCents = 250;
const pitchFastTransitionConfirmFrames = 2;
const pitchOctaveSpikeToleranceCents = 90;
const pitchTransitionConfirmFrames = 2;
const pitchHoldFrames = 6;
const pitchOnsetFrames = 1;
const pitchReleaseFrames = 10;
const pitchScoreWindowSeconds = 6;
const pitchScoreHitToleranceCents = 35;
const pitchScoreGoodToleranceCents = 20;
const pitchScoreMaxUsefulCents = 120;
const offlineWindowDurationMs = maxHistorySeconds * 1000;
const songPitchMinConfidence = 0.18;
const songPitchMaxGapMs = 180;
const songPitchMatchWindowMs = 120;
const songPitchOctaveFixToleranceCents = 420;
const songPitchSpikeThresholdCents = 520;
const songPitchNeighborToleranceCents = 160;
const songPitchShortRunMaxFrames = 4;
const songPitchMedianRadius = 3;
const songPitchRenderColor = '#2563eb';
const songPitchRenderSoftColor = 'rgba(37, 99, 235, 0.18)';
const recordingWaveformSampleCount = 96;
const recordingTimelineMinDurationMs = 1000;
const formantUpdateIntervalMs = 80;
const formantWindowSize = 3;
const formantTauMs = 260;
const formantSmoothingHz = 120;
const formantMaxJumpHz = { f1: 90, f2: 160 };
const formantVoiceConfidenceThreshold = 0.2;
const formantVoiceEnergyMultiplier = 1.6;
const formantVoiceMinRms = 0.012;
const formantVoiceRequiredFrames = 1;
const formantVoiceGraceFrames = 12;
const formantVoiceMaxPitchJumpCents = 180;
const formantValidRanges = {
  f1: { min: 200, max: 1000 },
  f2: { min: 700, max: 3000 },
  minSeparation: 150,
};
const offlineFrameDurationMs = 20;
const offlineHopDurationMs = 10;
const offlineMaxDurationSeconds = 300;
const offlineProgressUpdateMs = 200;
let lastDisplayUpdate = 0;
let currentPitch = null;
let lastStablePitch = null;
let smoothedPitch = null;
let recentPitchWindow = [];
let pendingPitch = null;
let pendingPitchFrames = 0;
let pitchHoldCounter = 0;
let voicedStable = false;
let voicedFrames = 0;
let voicedLostFrames = 0;
let selectedPitchPoint = null;
let pitchRenderState = null;
let volumeRenderState = null;
let adaptiveNoiseFloorRms = pitchMinEnergyThreshold;
let adaptiveEnergyThreshold = pitchMinEnergyThreshold;
let sessionStartTime = 0;
let pitchAlgorithm = pitchAlgorithmSelect?.value || 'amdf';
let pitchScaleMode = pitchScaleModeSelect?.value || 'log';
let displayMode = displayModeSelect?.value || 'pitch';
let spectrogramOverlayMode = spectrogramOverlaySelect?.value || 'none';
let trainingMode = 'pitch';
let canvasScale = Number(canvasScaleRange?.value || 1);
let spectrogramScrollX = 0;
let lastFormantUpdate = 0;
let lastFormantTimestamp = 0;
let smoothedFormants = { f1: null, f2: null };
let stableFormants = { f1: null, f2: null };
let formantHistory = { f1: [], f2: [] };
let formantCurveHistory = [];
let formantVoiceGate = { frames: 0, lastPitch: null, lostFrames: 0 };
let spectrogramOverlayState = { pitch: null, f1: null, f2: null };
let offlineMode = false;
let offlineAbort = false;
let offlineFormantHistory = [];
let offlineSourceSampleRate = null;
let offlineAnalysisInProgress = false;
let offlineWindowStartMs = 0;
let mediaRecorder = null;
let recordedChunks = [];
let lastRecordingBlob = null;
let recordingStartTime = 0;
let recordingTimelineFrames = [];
let recordingTimelineDurationMs = 0;
let recordingSelectedTimeMs = 0;
let recordingPlaybackAudio = null;
let recordingPlaybackUrl = null;
let recordingPlaybackRaf = null;
let accompanimentAudio = null;
let accompanimentUrl = null;
let accompanimentFile = null;
let targetPitchEnabled = targetPitchToggle?.checked ?? true;
let targetPitchHz = Number(targetPitchInput?.value || 300);
let songPitchTrack = [];
let songPitchFileName = '';
let songPitchEnabled = songPitchToggle?.checked ?? true;
let songPitchAnalysisInProgress = false;
let songPitchAudio = null;
let songPitchAudioUrl = null;
let songPitchPlaybackRaf = null;
let songSearchAbortController = null;
let breathHistory = [];
let breathSessionHistory = [];
let breathRecentScores = [];
let breathCurrentFlow = null;
let breathCurrentEffort = null;
let breathCurrentHighFrequency = null;
let breathCurrentLeakNoise = null;
let breathCurrentStability = null;
let breathStartTime = null;
let breathDurationSeconds = 0;
let breathCalibration = {
  calibrated: false,
  effort: 0,
  highFrequency: 0,
  leakNoise: 0,
  score: 0,
};
let breathCalibrationInProgress = false;
let pitchScoreLastTone = 'neutral';

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const memoryTargets = {
  brightStable: { pitch: 0.55, loudness: 0.58, brightness: 0.72, breathiness: 0.18, stability: 0.82, phiSn: 0.84, phiEtex: 0.5, closure: 0.58 },
  clearSoft: { pitch: 0.48, loudness: 0.42, brightness: 0.5, breathiness: 0.16, stability: 0.86, phiSn: 0.88, phiEtex: 0.43, closure: 0.54 },
  darkWarm: { pitch: 0.45, loudness: 0.52, brightness: 0.32, breathiness: 0.2, stability: 0.78, phiSn: 0.76, phiEtex: 0.36, closure: 0.48 },
  lightBreathy: { pitch: 0.5, loudness: 0.34, brightness: 0.46, breathiness: 0.55, stability: 0.62, phiSn: 0.52, phiEtex: 0.6, closure: 0.3 },
};
const memoryPathClasses = {
  neutralBright: { label: 'neutral → bright', soundBias: 0.96, hiddenBias: 0.96, advice: '保留这条路径，观察保持段是否能不增加压力地维持明亮度。' },
  breathyClear: { label: 'breathy → clear', soundBias: 1.02, hiddenBias: 1.02, advice: '从气声进入清晰闭合，适合寻找闭合平衡；如果负荷升高，放慢收束速度。' },
  darkBright: { label: 'dark → bright', soundBias: 1, hiddenBias: 1.06, advice: '暗到亮路径容易出现舌位或下颌补偿，优先降低响度并缩短保持段。' },
  pressedRelease: { label: 'pressed → release', soundBias: 0.98, hiddenBias: 1.24, advice: '避免从压紧感进入目标，改用释放或半闭合重置会更稳。' },
  softLoud: { label: 'soft → loud', soundBias: 0.94, hiddenBias: 1.18, advice: '弱到强可以接近目标，但要控制响度爬升；恢复拖尾明显时先降动态。' },
  sovtReset: { label: 'SOVT reset', soundBias: 1.08, hiddenBias: 0.72, advice: '半闭合重置可能牺牲一点目标相似度，但通常更能降低隐藏负荷。' },
  siren: { label: 'siren approach', soundBias: 1.04, hiddenBias: 0.84, advice: '滑音路径能约束音高变化，适合把目标接回更平滑的动作轨迹。' },
};
const memoryControlInstructions = {
  reduceBreathiness: {
    label: '减少气声 / 提高声源稳定',
    vector: { phiSn: 0.26, phiEtex: -0.03, breathiness: -0.28, closure: 0.08, loudness: 0.02 },
    advice: '优先做更清晰的起音和更连续的声源，注意不要靠提高响度硬顶。S84 中气声最稳定的控制方向是 ΦSN 下降/上升这一维，所以这里把声源稳定作为主反馈。',
  },
  healthyClosure: {
    label: '增加健康闭合',
    vector: { phiSn: 0.12, phiEtex: 0.16, breathiness: -0.08, closure: 0.22, loudness: 0.08 },
    advice: '尝试更连贯的闭合，但把它当作协调动作，不要当成“越紧越好”。论文提示闭合不是气声的反方向，过度闭合可能带来压紧或恢复拖尾。',
  },
  releasePressed: {
    label: '释放压紧闭合',
    vector: { phiSn: 0.08, phiEtex: -0.12, breathiness: 0.04, closure: -0.22, loudness: -0.22 },
    advice: '如果当前接近目标但响度、闭合或恢复成本偏高，先释放压力、降低响度，再重新接近目标。',
  },
  keepBreathy: {
    label: '保留气声色彩',
    vector: { phiSn: -0.18, phiEtex: 0.11, breathiness: 0.2, closure: -0.08, loudness: -0.04 },
    advice: '目标本身偏气声时，低 ΦSN 不一定是错误。重点是让气声保持可控、稳定，并避免音高和响度一起漂移。',
  },
};

function updateMeterVisibility(activeMode = displayMode) {
  const chart = canvas?.closest('.chart');
  const showVolume = activeMode !== 'spectrogram' && (volumeMeterToggle?.checked ?? true);
  const showTilt = activeMode !== 'spectrogram' && (tiltMeterToggle?.checked ?? true);

  if (volumeMeterColumn) {
    volumeMeterColumn.hidden = !showVolume;
  }
  if (tiltMeterColumn) {
    tiltMeterColumn.hidden = !showTilt;
  }

  chart?.classList.toggle('volume-meter-hidden', !showVolume);
  chart?.classList.toggle('tilt-meter-hidden', !showTilt);
}

updateCanvasScale(canvasScale);
initWindowResize();
showLauncherView();
updateMeterVisibility();
updateRecordingButtons();
updateAccompanimentButtons(false);
updateSongPitchPlaybackButtons();
updatePitchAccuracyButton();
setPitchAccuracyResult('--');
resetBreathCalibration();

function setStatus(text, tone = 'info') {
  statusEl.textContent = text;
  statusEl.style.background = tone === 'active' ? '#e4f3ef' : '#eef1ed';
  statusEl.style.color = tone === 'active' ? '#0b5d56' : '#697167';
}

function setDataSourceLabel(source) {
  dataSourceValue.textContent = source;
}

function setAnalysisStatus(text) {
  analysisStatus.textContent = text;
}

function getOfflineTrackDurationMs(history = pitchHistory) {
  if (!history.length) {
    return 0;
  }
  const firstTime = history[0]?.time || 0;
  const lastTime = history[history.length - 1]?.time || 0;
  return Math.max(0, lastTime - firstTime);
}

function clampOfflineWindowStart(startMs, durationMs = getOfflineTrackDurationMs()) {
  const maxStart = Math.max(0, durationMs - offlineWindowDurationMs);
  return Math.max(0, Math.min(Number(startMs) || 0, maxStart));
}

function resetOfflineWindow(startMs = 0) {
  offlineWindowStartMs = clampOfflineWindowStart(startMs);
}

function updateOfflineWindowControl(durationMs = getOfflineTrackDurationMs(), visibleStartMs = offlineWindowStartMs) {
  if (!offlineWindowControl || !offlineWindowRange) {
    return;
  }

  const shouldShow = offlineMode && durationMs > offlineWindowDurationMs;
  offlineWindowControl.hidden = !shouldShow;
  if (!shouldShow) {
    return;
  }

  const maxStart = Math.max(0, durationMs - offlineWindowDurationMs);
  const clampedStart = clampOfflineWindowStart(visibleStartMs, durationMs);
  if (clampedStart !== offlineWindowStartMs) {
    offlineWindowStartMs = clampedStart;
  }

  offlineWindowRange.max = String(maxStart / 1000);
  offlineWindowRange.step = '0.1';
  offlineWindowRange.value = String(clampedStart / 1000);
  if (offlineWindowStartValue) {
    offlineWindowStartValue.textContent = formatTimeSeconds(clampedStart);
  }
  if (offlineWindowEndValue) {
    offlineWindowEndValue.textContent = formatTimeSeconds(
      Math.min(durationMs, clampedStart + offlineWindowDurationMs)
    );
  }
  if (offlineWindowDurationValue) {
    offlineWindowDurationValue.textContent = `${formatTimeSeconds(durationMs)} 全长`;
  }
}

function setAccompanimentStatus(text) {
  accompanimentStatus.textContent = text;
}

function updateAccompanimentButtons(hasSource) {
  const canPlay = Boolean(hasSource);
  playAccompanimentButton.disabled = !canPlay;
  pauseAccompanimentButton.disabled = !canPlay;
  stopAccompanimentButton.disabled = !canPlay;
}

function updatePitchAccuracyButton() {
  const hasReference = Boolean(accompanimentFile || songPitchTrack.length);
  const hasVocal = Boolean(lastRecordingBlob);
  pitchAccuracyButton.disabled =
    !(hasReference && hasVocal) || offlineAnalysisInProgress || songPitchAnalysisInProgress;
}

function setPitchAccuracyResult(text, tone = 'neutral') {
  pitchAccuracyResult.textContent = text;
  if (tone === 'good') {
    pitchAccuracyResult.style.color = '#16a34a';
  } else if (tone === 'warn') {
    pitchAccuracyResult.style.color = '#b7791f';
  } else if (tone === 'bad') {
    pitchAccuracyResult.style.color = '#dc2626';
  } else {
    pitchAccuracyResult.style.color = '#1c1f2a';
  }
}

function setSongPitchStatus(text, tone = 'neutral') {
  if (!songPitchStatus) {
    return;
  }
  songPitchStatus.textContent = text;
  if (tone === 'good') {
    songPitchStatus.style.color = '#16a34a';
  } else if (tone === 'bad') {
    songPitchStatus.style.color = '#dc2626';
  } else {
    songPitchStatus.style.color = '#1c1f2a';
  }
}

function setSongPitchPlaybackStatus(text, tone = 'neutral') {
  if (!songPitchPlaybackStatus) {
    return;
  }
  songPitchPlaybackStatus.textContent = text;
  if (tone === 'good') {
    songPitchPlaybackStatus.style.color = '#16a34a';
  } else if (tone === 'bad') {
    songPitchPlaybackStatus.style.color = '#dc2626';
  } else {
    songPitchPlaybackStatus.style.color = '#1c1f2a';
  }
}

function updateSongPitchPlaybackButtons() {
  const hasAudio = Boolean(songPitchAudio);
  if (playSongPitchButton) {
    playSongPitchButton.disabled = !hasAudio || songPitchAnalysisInProgress;
  }
  if (pauseSongPitchButton) {
    pauseSongPitchButton.disabled = !hasAudio || songPitchAnalysisInProgress;
  }
  if (stopSongPitchButton) {
    stopSongPitchButton.disabled = !hasAudio || songPitchAnalysisInProgress;
  }
}

function stopSongPitchPlaybackProgress() {
  if (songPitchPlaybackRaf) {
    cancelAnimationFrame(songPitchPlaybackRaf);
    songPitchPlaybackRaf = null;
  }
}

function syncOfflineWindowToSongPlayback() {
  if (!songPitchAudio || !offlineMode) {
    return;
  }
  const playbackMs = songPitchAudio.currentTime * 1000;
  const durationMs = Number.isFinite(songPitchAudio.duration)
    ? songPitchAudio.duration * 1000
    : getOfflineTrackDurationMs();
  const desiredStart = playbackMs - offlineWindowDurationMs * 0.35;
  offlineWindowStartMs = clampOfflineWindowStart(desiredStart, durationMs);
  drawPitchHistory();
}

function updateSongPitchPlaybackProgress() {
  if (!songPitchAudio || songPitchAudio.paused) {
    stopSongPitchPlaybackProgress();
    return;
  }
  syncOfflineWindowToSongPlayback();
  setSongPitchPlaybackStatus(`播放中 ${formatTimeSeconds(songPitchAudio.currentTime * 1000)}`, 'good');
  songPitchPlaybackRaf = requestAnimationFrame(updateSongPitchPlaybackProgress);
}

function prepareSongPitchPlayback(file) {
  stopSongPitchPlaybackProgress();
  if (songPitchAudio) {
    songPitchAudio.pause();
  }
  if (songPitchAudioUrl) {
    URL.revokeObjectURL(songPitchAudioUrl);
  }
  songPitchAudioUrl = URL.createObjectURL(file);
  songPitchAudio = new Audio(songPitchAudioUrl);
  songPitchAudio.addEventListener('ended', () => {
    stopSongPitchPlaybackProgress();
    setSongPitchPlaybackStatus('已播放完');
    updateSongPitchPlaybackButtons();
  });
  songPitchAudio.addEventListener('loadedmetadata', () => {
    setSongPitchPlaybackStatus(`已加载 ${formatTimeSeconds(songPitchAudio.duration * 1000)}`);
  });
  setSongPitchPlaybackStatus('已加载');
  updateSongPitchPlaybackButtons();
}

function clearSongPitchPlayback() {
  stopSongPitchPlaybackProgress();
  if (songPitchAudio) {
    songPitchAudio.pause();
    songPitchAudio = null;
  }
  if (songPitchAudioUrl) {
    URL.revokeObjectURL(songPitchAudioUrl);
    songPitchAudioUrl = null;
  }
  setSongPitchPlaybackStatus('未加载');
  updateSongPitchPlaybackButtons();
}

function setSongTrainingResult(text, tone = 'neutral') {
  if (!songTrainingResult) {
    return;
  }
  songTrainingResult.textContent = text;
  if (tone === 'good') {
    songTrainingResult.style.color = '#16a34a';
  } else if (tone === 'warn') {
    songTrainingResult.style.color = '#b7791f';
  } else if (tone === 'bad') {
    songTrainingResult.style.color = '#dc2626';
  } else {
    songTrainingResult.style.color = '#1c1f2a';
  }
}

function resetPitchScoreDisplay() {
  if (pitchScoreValue) {
    pitchScoreValue.textContent = '--';
  }
  if (pitchScoreCaption) {
    pitchScoreCaption.textContent = '开始检测后，对准目标音持续发声。';
  }
  if (pitchScoreTargetValue) {
    pitchScoreTargetValue.textContent = hasSongPitchTarget()
      ? '歌曲曲线'
      : `${Math.round(targetPitchHz)} Hz`;
  }
  if (pitchScoreCentsValue) {
    pitchScoreCentsValue.textContent = '-- cents';
  }
  if (pitchScoreStabilityValue) {
    pitchScoreStabilityValue.textContent = '--%';
  }
  if (pitchScoreHitRateValue) {
    pitchScoreHitRateValue.textContent = '--%';
  }
  if (pitchScoreAverageValue) {
    pitchScoreAverageValue.textContent = '-- cents';
  }
  if (pitchScoreCoverageValue) {
    pitchScoreCoverageValue.textContent = '--%';
  }
  setPitchScoreTone('neutral');
}

function formatPitchPointTime(point) {
  if (!point) {
    return '--';
  }
  if (Number.isFinite(point.recordingTimeMs)) {
    return formatTimeSeconds(point.recordingTimeMs);
  }
  if (offlineMode || sessionStartTime === 0) {
    return formatTimeSeconds(point.time);
  }
  return formatTimeSeconds(Math.max(0, point.time - sessionStartTime));
}

function updatePitchInspector(point) {
  selectedPitchPoint = point;
  if (!pitchInspectorPanel || !selectedPitchValue || !selectedPitchHint) {
    return;
  }
  if (!point?.pitch) {
    pitchInspectorPanel.hidden = true;
    selectedPitchValue.textContent = '--';
    selectedPitchHint.textContent = '点击音高曲线查看对应时间点';
    return;
  }
  pitchInspectorPanel.hidden = false;
  selectedPitchValue.textContent = `${point.pitch.toFixed(1)} Hz · ${frequencyToNote(point.pitch)}`;
  selectedPitchHint.textContent = `时间 ${formatPitchPointTime(point)}`;
}

function clearSelectedPitchPoint() {
  updatePitchInspector(null);
  drawPitchHistory();
}

function updatePitchScoreDisplay(now = performance.now()) {
  if (trainingMode !== 'score') {
    return;
  }

  if (pitchScoreTargetValue) {
    pitchScoreTargetValue.textContent = hasSongPitchTarget()
      ? '歌曲曲线'
      : `${Math.round(targetPitchHz)} Hz`;
  }

  const stats = computePitchScoreStats(now);
  if (!stats || !Number.isFinite(stats.currentCents)) {
    resetPitchScoreDisplay();
    return;
  }

  const absCurrentCents = Math.abs(stats.currentCents);
  const isGood = absCurrentCents <= pitchScoreGoodToleranceCents;
  const isClose = absCurrentCents <= pitchScoreHitToleranceCents;
  const direction =
    absCurrentCents <= pitchScoreGoodToleranceCents
      ? '保持'
      : stats.currentCents > 0
        ? '略低一点'
        : '略高一点';
  const tone = isGood ? 'good' : isClose ? 'close' : 'warn';

  pitchScoreValue.textContent = `${stats.score}%`;
  pitchScoreCaption.textContent = `${direction}，最近 ${pitchScoreWindowSeconds} 秒 P90 偏差 ${stats.p90AbsError.toFixed(
    1
  )} cents，覆盖 ${stats.coverage}%。`;
  pitchScoreCentsValue.textContent = formatSignedCents(stats.currentCents);
  if (pitchScoreTargetValue && hasSongPitchTarget() && stats.currentTargetPitch) {
    pitchScoreTargetValue.textContent = `${Math.round(stats.currentTargetPitch)} Hz`;
  }
  pitchScoreStabilityValue.textContent = `${stats.stability}%`;
  pitchScoreHitRateValue.textContent = `${stats.hitRate}%`;
  if (pitchScoreAverageValue) {
    pitchScoreAverageValue.textContent = `${stats.averageAbsError.toFixed(1)} cents`;
  }
  if (pitchScoreCoverageValue) {
    pitchScoreCoverageValue.textContent = `${stats.coverage}%`;
  }
  if (hasSongPitchTarget()) {
    setSongTrainingResult(
      `${stats.score}% / 命中 ${stats.hitRate}% / 覆盖 ${stats.coverage}%`,
      tone === 'warn' ? 'bad' : 'good'
    );
  }
  setPitchScoreTone(tone);
}

function mean(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) {
    return 0;
  }
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function normalizeRange(value, min, max) {
  return (value - min) / Math.max(max - min, 1e-9);
}

function hideSidebarPanel() {
  sidebar.classList.remove('open');
  sidebarToggle.setAttribute('aria-expanded', 'false');
  sidebar.setAttribute('aria-hidden', 'true');
  sidebar.hidden = true;
}

function setReadoutMode(mode) {
  const pitchReadouts = [pitchValueEl?.closest('div'), noteValueEl?.closest('div')];
  const breathReadouts = document.querySelectorAll('.breath-readout');
  const breathControls = document.querySelectorAll('.breath-control');
  const readout = document.querySelector('.readout');
  const chart = canvas?.closest('.chart');
  const isBreath = mode === 'breath';
  const isScore = mode === 'score';
  const isVolume = mode === 'volume';
  const isFormants = mode === 'formants';
  const isMemory = mode === 'memory';
  chart?.classList.toggle('spectrogram-analyzer', mode === 'spectrogram');
  updateMeterVisibility(mode);
  if (stopButton) {
    stopButton.textContent = mode === 'spectrogram' ? '暂停' : '停止';
  }
  if (mode !== 'pitch' && mode !== 'score' && mode !== 'memory') {
    updatePitchInspector(null);
  }
  if (breathDashboard) {
    breathDashboard.hidden = !isBreath;
  }
  if (pitchScoreDashboard) {
    pitchScoreDashboard.hidden = !isScore;
  }
  if (songTargetPanel) {
    songTargetPanel.hidden = !(mode === 'pitch' || isScore);
  }
  if (memoryDashboard) {
    memoryDashboard.hidden = !isMemory;
  }
  if (readout) {
    readout.hidden = isVolume || isFormants || isMemory;
    readout.classList.toggle('readout-breath-compact', isBreath);
  }
  pitchReadouts.forEach((el) => {
    if (el) {
      el.hidden = isBreath || isVolume || isFormants;
    }
  });
  breathReadouts.forEach((el) => {
    el.hidden = true;
  });
  breathControls.forEach((el) => {
    el.hidden = !isBreath;
  });
  if (breathReport) {
    breathReport.hidden = !isBreath || !breathReport.dataset.hasReport;
  }
  if (chartLegendLow && chartLegendHigh) {
    chartLegendLow.textContent =
      isBreath ? '弱' : mode === 'volume' ? '安静' : mode === 'spectrogram' ? '65 Hz / C2' : '低音';
    chartLegendHigh.textContent =
      isBreath ? '强' : mode === 'volume' ? '响亮' : mode === 'spectrogram' ? '4.2 kHz / C8' : '高音';
  }
  if (chartLegendLow && chartLegendHigh && isFormants) {
    chartLegendLow.textContent = 'F1';
    chartLegendHigh.textContent = 'F2';
  }
}

function setTrainingCopy(mode) {
  if (mode === 'breath') {
    appTitle.textContent = '出气量测量';
    appDescription.textContent = '允许麦克风权限后，对准麦克风平稳吹气，软件会估算相对出气强度、稳定度和持续时间。';
  } else if (mode === 'score') {
    appTitle.textContent = '实时音准评分';
    appDescription.textContent = '设置目标音高后开始检测，持续发声即可看到偏差、稳定度和命中率。';
  } else if (mode === 'memory') {
    appTitle.textContent = '记忆感知音色训练';
    appDescription.textContent = '录制“接近目标 → 保持目标 → 回到中性/安静”的片段，分析目标匹配和隐藏路径成本。';
  } else if (mode === 'spectrogram') {
    appTitle.textContent = '泛音分析频谱图';
    appDescription.textContent = '像 Overtone Analyzer 一样同时观察钢琴键频率刻度、滚动声谱、当前强度剖面和底部能量轨迹。';
  } else if (mode === 'formants') {
    appTitle.textContent = '实时共振峰曲线';
    appDescription.textContent = '允许麦克风权限后，可以查看 F1/F2 共振峰随时间变化的曲线。';
  } else if (mode === 'volume') {
    appTitle.textContent = '实时音量曲线';
    appDescription.textContent = '允许麦克风权限后，可以看到声音音量随时间变化。';
  } else {
    appTitle.textContent = '实时音高曲线';
    appDescription.textContent = '允许麦克风权限后，对着手机唱歌即可看到音高变化。';
  }
}

function setCurveSwitcherMode(mode) {
  if (curveSwitcher) {
    curveSwitcher.hidden = trainingMode !== 'curve';
  }
  curvePitchButton?.classList.toggle('active', mode === 'pitch');
  curveVolumeButton?.classList.toggle('active', mode === 'volume');
  curveFormantButton?.classList.toggle('active', mode === 'formants');
}

function setCurveDisplayMode(mode) {
  displayMode = mode === 'volume' || mode === 'formants' ? mode : 'pitch';
  trainingMode = 'curve';
  if (displayModeSelect) {
    displayModeSelect.value = displayMode;
  }
  updateCanvasScale(canvasScale);
  setReadoutMode(displayMode);
  setTrainingCopy(displayMode);
  setCurveSwitcherMode(displayMode);
  if (displayMode === 'volume') {
    drawVolumeHistory();
  } else if (displayMode === 'formants') {
    drawFormantCurveHistory();
  } else {
    resetPitchScoreDisplay();
    drawPitchHistory();
  }
}

function showTrainingView(mode = 'pitch') {
  modeLauncher.hidden = true;
  appWindow.hidden = false;
  trainingMode = mode;
  setReadoutMode(mode);
  setTrainingCopy(mode);

  if (mode === 'curve') {
    setCurveDisplayMode('pitch');
  } else if (mode === 'spectrogram') {
    setCurveSwitcherMode(null);
    displayMode = 'spectrogram';
    displayModeSelect.value = 'spectrogram';
    updateCanvasScale(canvasScale);
  } else if (mode === 'breath') {
    setCurveSwitcherMode(null);
    displayMode = 'breath';
    displayModeSelect.value = 'breath';
    updateCanvasScale(canvasScale);
    resetBreathMeter();
    drawBreathHistory();
  } else if (mode === 'volume') {
    setCurveDisplayMode('volume');
  } else if (mode === 'pitch') {
    setCurveDisplayMode('pitch');
  } else if (mode === 'score') {
    setCurveSwitcherMode(null);
    trainingMode = mode;
    setReadoutMode(mode);
    setTrainingCopy(mode);
    displayMode = 'pitch';
    displayModeSelect.value = 'pitch';
    updateCanvasScale(canvasScale);
    targetPitchEnabled = true;
    if (targetPitchToggle) {
      targetPitchToggle.checked = true;
    }
    resetPitchScoreDisplay();
    drawPitchHistory();
  } else if (mode === 'memory') {
    setCurveSwitcherMode(null);
    trainingMode = mode;
    setReadoutMode(mode);
    setTrainingCopy(mode);
    displayMode = 'pitch';
    displayModeSelect.value = 'pitch';
    updateCanvasScale(canvasScale);
    setMemoryEmptyState(
      recordingTimelineFrames.length
        ? '可以分析最近录音，也可以重新录制一段“接近-保持-恢复”的片段。'
        : '请先录制一段“接近-保持-恢复”的片段。'
    );
    updateRecordingButtons();
    drawPitchHistory();
  } else {
    setCurveDisplayMode('pitch');
  }
}

function showLauncherView() {
  hideSidebarPanel();
  if (!startButton.disabled) {
    // already stopped
  } else {
    stop();
  }
  modeLauncher.hidden = false;
  appWindow.hidden = true;
}

function percentile(values, ratio) {
  const clean = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!clean.length) {
    return 0;
  }
  const index = Math.min(clean.length - 1, Math.max(0, Math.floor((clean.length - 1) * ratio)));
  return clean[index];
}

function formatFrameTime(frameIndex) {
  return formatTimeSeconds(frameIndex * offlineHopDurationMs);
}

function findWorstPitchSegment(samples) {
  const problemSamples = samples.filter(
    (sample) => sample.absCents > pitchScoreHitToleranceCents
  );
  if (!problemSamples.length) {
    return null;
  }

  const segments = [];
  let current = null;
  problemSamples.forEach((sample) => {
    if (!current || sample.index - current.endIndex > 1) {
      current = {
        startIndex: sample.index,
        endIndex: sample.index,
        errors: [sample.absCents],
      };
      segments.push(current);
      return;
    }
    current.endIndex = sample.index;
    current.errors.push(sample.absCents);
  });

  return segments
    .map((segment) => ({
      ...segment,
      meanError: mean(segment.errors),
      peakError: Math.max(...segment.errors),
      durationMs: (segment.endIndex - segment.startIndex + 1) * offlineHopDurationMs,
    }))
    .sort((a, b) => b.meanError * b.durationMs - a.meanError * a.durationMs)[0];
}

function evaluatePitchAccuracy(referenceTrack, vocalTrack) {
  const compareLength = Math.min(referenceTrack.length, vocalTrack.length);
  const samples = [];
  let referenceVoicedFrames = 0;
  let vocalVoicedFrames = 0;

  for (let i = 0; i < compareLength; i += 1) {
    const ref = referenceTrack[i];
    const vocal = vocalTrack[i];
    if (ref) {
      referenceVoicedFrames += 1;
    }
    if (vocal) {
      vocalVoicedFrames += 1;
    }
    if (!ref || !vocal) {
      continue;
    }
    const cents = frequencyToCentsError(vocal, ref);
    if (!Number.isFinite(cents)) {
      continue;
    }
    samples.push({
      index: i,
      cents,
      absCents: Math.abs(cents),
      ref,
      vocal,
    });
  }

  if (!samples.length) {
    return null;
  }

  const absErrors = samples.map((sample) => sample.absCents);
  const meanAbsError = mean(absErrors);
  const meanSignedError = mean(samples.map((sample) => sample.cents));
  const hitRate = Math.round(
    (samples.filter((sample) => sample.absCents <= pitchScoreHitToleranceCents).length /
      samples.length) *
      100
  );
  const goodRate = Math.round(
    (samples.filter((sample) => sample.absCents <= pitchScoreGoodToleranceCents).length /
      samples.length) *
      100
  );
  const coverage = Math.round((samples.length / Math.max(referenceVoicedFrames, 1)) * 100);
  const vocalCoverage = Math.round((vocalVoicedFrames / Math.max(compareLength, 1)) * 100);
  const p90AbsError = percentile(absErrors, 0.9);
  const worstSegment = findWorstPitchSegment(samples);
  const score = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        (100 - Math.min(100, (meanAbsError / pitchScoreMaxUsefulCents) * 100)) * 0.4 +
          hitRate * 0.35 +
          coverage * 0.15 +
          goodRate * 0.1
      )
    )
  );
  const label =
    score >= 78 && hitRate >= 70 && coverage >= 45
      ? '音准可信'
      : score >= 58 && coverage >= 30
        ? '接近目标'
        : '需要修正';
  const tone = label === '音准可信' ? 'good' : label === '接近目标' ? 'warn' : 'bad';

  return {
    score,
    label,
    tone,
    meanAbsError,
    meanSignedError,
    p90AbsError,
    hitRate,
    goodRate,
    coverage,
    vocalCoverage,
    sampleCount: samples.length,
    worstSegment,
  };
}

async function runPitchAccuracyAnalysis() {
  if (!(accompanimentFile || songPitchTrack.length) || !lastRecordingBlob || offlineAnalysisInProgress) {
    return;
  }

  pitchAccuracyButton.disabled = true;
  setPitchAccuracyResult('分析中...');
  let vocalBuffer;
  try {
    vocalBuffer = await decodeAudioBlob(lastRecordingBlob);
  } catch (error) {
    console.error(error);
    setPitchAccuracyResult('解码失败');
    updatePitchAccuracyButton();
    return;
  }

  let referenceTrack = null;
  if (songPitchTrack.length) {
    referenceTrack = songPitchTrack.map((point) => point.pitch);
  } else {
    try {
      const referenceBuffer = await decodeAudioFile(accompanimentFile);
      referenceTrack = extractPitchTrack(referenceBuffer);
    } catch (error) {
      console.error(error);
      setPitchAccuracyResult('解码失败');
      updatePitchAccuracyButton();
      return;
    }
  }
  const vocalTrack = extractPitchTrack(vocalBuffer);
  const result = evaluatePitchAccuracy(referenceTrack, vocalTrack);

  if (!result) {
    setPitchAccuracyResult('有效音高不足');
    updatePitchAccuracyButton();
    return;
  }

  const direction =
    Math.abs(result.meanSignedError) <= pitchScoreGoodToleranceCents
      ? '整体居中'
      : result.meanSignedError > 0
        ? '整体偏高'
        : '整体偏低';
  const worstSegmentText = result.worstSegment
    ? `，重点回听 ${formatFrameTime(result.worstSegment.startIndex)}-${formatFrameTime(
        result.worstSegment.endIndex + 1
      )}`
    : '';

  setPitchAccuracyResult(
    `${result.label} ${result.score}%｜命中 ${result.hitRate}%｜P90 ${result.p90AbsError.toFixed(
      1
    )} cents｜覆盖 ${result.coverage}%${worstSegmentText}`,
    result.tone
  );
  setSongTrainingResult(
    songPitchTrack.length
      ? `${direction}，平均 ${result.meanAbsError.toFixed(1)} cents，稳定命中 ${result.goodRate}%`
      : '--',
    result.tone
  );
  updatePitchAccuracyButton();
}

function updateVolumeMeter(rms) {
  if (!volumeMeterBar) {
    return;
  }
  if (rms === null || rms === undefined) {
    volumeMeterBar.style.height = '0%';
    return;
  }
  const db = 20 * Math.log10(Math.max(rms, 1e-5));
  const clamped = Math.max(volumeMeterMinDb, Math.min(volumeMeterMaxDb, db));
  const ratio = (clamped - volumeMeterMinDb) / (volumeMeterMaxDb - volumeMeterMinDb);
  volumeMeterBar.style.height = `${Math.round(ratio * 100)}%`;
}

function appendVolumePoint(time, rms) {
  volumeHistory.push({
    time,
    rms,
    db: rmsToDb(rms),
  });
  if (!offlineMode && volumeHistory.length > 2) {
    const minTime = time - maxHistorySeconds * 1000;
    volumeHistory = volumeHistory.filter((point) => point.time >= minTime);
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function updateSpectralTilt() {
  if (!tiltMeterBar || !analyser || !frequencyData) {
    return;
  }
  analyser.getFloatFrequencyData(frequencyData);
  const nyquist = audioContext ? audioContext.sampleRate / 2 : 0;
  if (!nyquist) {
    tiltMeterBar.style.height = '0%';
    return;
  }

  const binResolution = nyquist / frequencyData.length;
  const bandAverage = (minHz, maxHz) => {
    const start = Math.max(0, Math.floor(minHz / binResolution));
    const end = Math.min(frequencyData.length - 1, Math.ceil(maxHz / binResolution));
    let sum = 0;
    let count = 0;
    for (let i = start; i <= end; i += 1) {
      const value = frequencyData[i];
      if (Number.isFinite(value)) {
        sum += value;
        count += 1;
      }
    }
    return count > 0 ? sum / count : -120;
  };

  const lowDb = bandAverage(tiltLowBandHz.min, tiltLowBandHz.max);
  const highDb = bandAverage(tiltHighBandHz.min, tiltHighBandHz.max);
  const tiltDb = highDb - lowDb;
  const clamped = Math.max(tiltMeterMinDb, Math.min(tiltMeterMaxDb, tiltDb));
  const ratio = (clamped - tiltMeterMinDb) / (tiltMeterMaxDb - tiltMeterMinDb);
  tiltMeterBar.style.height = `${Math.round(ratio * 100)}%`;
}

function updateCanvasScale(value) {
  const scale = Number(value) || 1;
  canvasScale = scale;
  const isSpectrogram = displayMode === 'spectrogram';
  const appWidth = Math.round((isSpectrogram ? spectrogramAppMaxWidth : baseAppMaxWidth) * scale);
  document.documentElement.style.setProperty('--app-max-width', `${appWidth}px`);
  const width = Math.round((isSpectrogram ? spectrogramCanvasWidth : baseCanvasWidth) * scale);
  const height = Math.round((isSpectrogram ? spectrogramCanvasHeight : baseCanvasHeight) * scale);
  canvas.width = width;
  canvas.height = height;
  if (canvasScaleValue) {
    canvasScaleValue.textContent = `${Math.round(scale * 100)}%`;
  }
  if (displayMode === 'spectrogram') {
    resetSpectrogram();
  } else if (displayMode === 'breath') {
    resetBreathMeter();
    drawBreathHistory();
  } else {
    drawPitchHistory();
  }
}

function initWindowResize() {
  if (!appWindow || !window.PointerEvent) {
    return;
  }

  const handles = appWindow.querySelectorAll('[data-resize]');
  if (handles.length === 0) {
    return;
  }

  let activePointerId = null;
  let activeHandle = null;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  function onPointerMove(event) {
    if (event.pointerId !== activePointerId || !activeHandle) {
      return;
    }

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    let width = startWidth;
    let height = startHeight;

    if (activeHandle.includes('e')) {
      width = startWidth + dx;
    }
    if (activeHandle.includes('w')) {
      width = startWidth - dx;
    }
    if (activeHandle.includes('s')) {
      height = startHeight + dy;
    }
    if (activeHandle.includes('n')) {
      height = startHeight - dy;
    }

    const maxWidth = window.innerWidth - 32;
    const maxHeight = window.innerHeight - 32;
    width = Math.max(minResizableWidth, Math.min(maxWidth, Math.round(width)));
    height = Math.max(minResizableHeight, Math.min(maxHeight, Math.round(height)));

    appWindow.style.width = `${width}px`;
    appWindow.style.height = `${height}px`;
  }

  function endResize(event) {
    if (activePointerId === null || event.pointerId !== activePointerId) {
      return;
    }

    if (event.target?.releasePointerCapture) {
      try {
        event.target.releasePointerCapture(activePointerId);
      } catch (_error) {
        // no-op
      }
    }

    activePointerId = null;
    activeHandle = null;
    appWindow.classList.remove('is-resizing');
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endResize);
    window.removeEventListener('pointercancel', endResize);
  }

  handles.forEach((handle) => {
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      const direction = handle.dataset.resize;
      if (!direction) {
        return;
      }

      activePointerId = event.pointerId;
      activeHandle = direction;
      startX = event.clientX;
      startY = event.clientY;
      const rect = appWindow.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      appWindow.classList.add('is-resizing');

      if (handle.setPointerCapture) {
        handle.setPointerCapture(event.pointerId);
      }
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', endResize);
      window.addEventListener('pointercancel', endResize);
    });
  });
}

function median(values) {
  if (!values.length) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function pushPitchSample(buffer, value) {
  const nextBuffer = [...buffer, value].slice(-pitchMedianWindowSize);
  return nextBuffer;
}

function getMaxJumpThresholdHz(reference) {
  if (!reference) {
    return pitchMaxJumpHz;
  }
  const centsFactor = Math.pow(2, pitchMaxJumpCents / 1200) - 1;
  const centsJump = reference * centsFactor;
  return Math.min(pitchMaxJumpHz, centsJump);
}

function getPitchDistanceCents(a, b) {
  if (!a || !b) {
    return 0;
  }
  return Math.abs(1200 * Math.log2(a / b));
}

function isNearOctaveJump(a, b) {
  const distance = getPitchDistanceCents(a, b);
  return Math.abs(distance - 1200) <= pitchOctaveSpikeToleranceCents;
}

function selectPitchCandidate(pitch, reference) {
  if (!pitch) return null;
  if (!reference) return pitch;

  // 用“音程（cents）”判断是否真的是倍频错误（octave error）
  const cents = (a, b) => 1200 * Math.log2(a / b);
  const absCents = (a, b) => Math.abs(cents(a, b));

  // 如果当前pitch已经离reference很远（比如>300 cents=小三度以上），
  // 不要强行用 pitch/2 去贴reference（否则会把真正的转高/转低压回去）
  const farEnough = absCents(pitch, reference) > 300;
  if (farEnough) return pitch;

  // 只有在“看起来像倍频误判”时才纠错
  const c0 = absCents(pitch, reference);
  const cHalf = absCents(pitch / 2, reference);
  const cDouble = absCents(pitch * 2, reference);

  let best = pitch;
  let bestC = c0;

  if (cHalf < bestC) { bestC = cHalf; best = pitch / 2; }
  if (cDouble < bestC) { bestC = cDouble; best = pitch * 2; }

  // 再加一道门：纠错也必须“真的更接近”，并且接近到一个很小的范围（比如<=80 cents）
  if (best !== pitch && bestC <= 80) return best;

  return pitch;
}

function appendPitchBreak(time) {
  if (!pitchHistory.length || pitchHistory[pitchHistory.length - 1].pitch !== null) {
    pitchHistory.push({ time, pitch: null });
  }
}

function applyPitchEma(previous, next) {
  if (!next) {
    return previous;
  }
  if (!previous) {
    return next;
  }
  return previous + pitchEmaAlpha * (next - previous);
}

function limitJump(previous, next, maxJump) {
  if (previous === null || previous === undefined) {
    return next;
  }
  const delta = next - previous;
  if (Math.abs(delta) <= maxJump) {
    return next;
  }
  return previous + Math.sign(delta) * maxJump;
}

function hasRecentPitchData() {
  if (offlineMode) {
    return pitchHistory.some((point) => point.pitch);
  }
  const now = performance.now();
  const minTime = now - maxHistorySeconds * 1000;
  return pitchHistory.some((point) => point.time >= minTime && point.pitch);
}

function updateRecordingButtons() {
  const hasRecording = Boolean(lastRecordingBlob);
  analyzeRecordingButton.disabled = !hasRecording || offlineAnalysisInProgress;
  downloadRecordingButton.disabled = !hasRecording;
  if (memoryAnalyzeButton) {
    memoryAnalyzeButton.disabled = !hasRecording || !recordingTimelineFrames.length;
  }
}

function resetPitchStabilizer() {
  recentPitchWindow = [];
  lastStablePitch = null;
  smoothedPitch = null;
  pendingPitch = null;
  pendingPitchFrames = 0;
  pitchHoldCounter = 0;
  voicedStable = false;
  voicedFrames = 0;
  voicedLostFrames = 0;
  adaptiveNoiseFloorRms = pitchMinEnergyThreshold;
  adaptiveEnergyThreshold = pitchMinEnergyThreshold;
  currentPitch = null;
  lastDisplayUpdate = 0;
  pitchValueEl.textContent = '-- Hz';
  noteValueEl.textContent = '--';
  clearSelectedPitchPoint();
}

function update() {
  const now = performance.now();
  analyser.getFloatTimeDomainData(dataArray);
  const rms = computeRms(dataArray);
  updateVolumeMeter(rms);
  appendVolumePoint(now, rms);
  updateSpectralTilt();

  if (now - lastDisplayUpdate >= displayUpdateIntervalMs) {
    lastDisplayUpdate = now;
    if (displayMode === 'breath') {
      const pitchResult = estimatePitchWithConfidence(
        dataArray,
        audioContext.sampleRate,
        analyser,
        frequencyData
      );
      const metrics = breathCalibrationInProgress
        ? { score: 0, effort: 0, highFrequency: 0, leakNoise: 0 }
        : estimateBreathMetrics(
            dataArray,
            rms,
            analyser,
            frequencyData,
            audioContext.sampleRate
          );
      const voiceType = breathCalibrationInProgress
        ? '校准中'
        : classifyBreathVoice(metrics, pitchResult.pitch, pitchResult.confidence);
      const flow = metrics.score;
      breathRecentScores.push(flow);
      if (breathRecentScores.length > breathStabilityWindowSize) {
        breathRecentScores.shift();
      }
      const stability = computeBreathStability(breathRecentScores);
      updateBreathDisplay(metrics, stability, now, voiceType);
      const breathPoint = {
        time: now,
        flow,
        effort: metrics.effort,
        highFrequency: metrics.highFrequency,
        leakNoise: metrics.leakNoise,
        voiceType,
        stability,
        durationSeconds: breathDurationSeconds,
      };
      breathHistory.push(breathPoint);
      breathSessionHistory.push(breathPoint);
      drawBreathHistory();
      captureRecordingFrame(now, rms, pitchResult.pitch);
      animationId = requestAnimationFrame(update);
      return;
    }

    const { pitch, confidence } = estimatePitchWithConfidence(
      dataArray,
      audioContext.sampleRate,
      analyser,
      frequencyData
    );
    const isInRange = pitch && pitch >= pitchMinHz && pitch <= pitchMaxHz;
    const hasPitch = Boolean(pitch) && isInRange;
    const confidenceThreshold = voicedStable
      ? pitchSustainConfidenceThreshold
      : pitchOnsetConfidenceThreshold;
    const isReliable = hasPitch && confidence >= confidenceThreshold;

    if (!isReliable) {
      pendingPitch = null;
      pendingPitchFrames = 0;
      if (voicedStable) {
        voicedLostFrames += 1;
        pitchHoldCounter += 1;
        if (lastStablePitch && pitchHoldCounter <= pitchHoldFrames) {
          currentPitch = smoothedPitch ?? lastStablePitch;
          pitchHistory.push({ time: now, pitch: currentPitch });
        } else {
          currentPitch = null;
          appendPitchBreak(now);
        }
        if (voicedLostFrames >= pitchReleaseFrames) {
          voicedStable = false;
          voicedFrames = 0;
          pitchHoldCounter = 0;
        }
      } else {
        voicedFrames = 0;
        currentPitch = null;
        appendPitchBreak(now);
      }
    } else {
      pitchHoldCounter = 0;
      voicedLostFrames = 0;
      recentPitchWindow = pushPitchSample(recentPitchWindow, pitch);
      voicedFrames = Math.min(pitchOnsetFrames, voicedFrames + 1);

      if (!voicedStable && voicedFrames < pitchOnsetFrames) {
        currentPitch = null;
        appendPitchBreak(now);
      } else {
        voicedStable = true;
        const displayPitch = median(recentPitchWindow);
        const rawCandidate = selectPitchCandidate(pitch, lastStablePitch);
        const medianCandidate = selectPitchCandidate(displayPitch, lastStablePitch);
        const looksLikeOctaveSpike =
          lastStablePitch &&
          rawCandidate &&
          medianCandidate &&
          isNearOctaveJump(rawCandidate, lastStablePitch) &&
          getPitchDistanceCents(medianCandidate, lastStablePitch) < pitchFastTransitionCents;
        const isFastTransition =
          lastStablePitch &&
          rawCandidate &&
          !looksLikeOctaveSpike &&
          getPitchDistanceCents(rawCandidate, lastStablePitch) >= pitchFastTransitionCents;
        const candidate = isFastTransition ? rawCandidate : medianCandidate;
        const maxJump = getMaxJumpThresholdHz(lastStablePitch);

        if (!candidate) {
          pendingPitch = null;
          pendingPitchFrames = 0;
          pitchHoldCounter += 1;
          if (lastStablePitch && pitchHoldCounter <= pitchHoldFrames) {
            currentPitch = smoothedPitch ?? lastStablePitch;
            pitchHistory.push({ time: now, pitch: currentPitch });
          } else {
            currentPitch = null;
            appendPitchBreak(now);
          }
        } else if (lastStablePitch && Math.abs(candidate - lastStablePitch) > maxJump) {
          if (pendingPitch && Math.abs(candidate - pendingPitch) <= maxJump) {
            pendingPitchFrames += 1;
          } else {
            pendingPitch = candidate;
            pendingPitchFrames = 1;
          }

          const requiredTransitionFrames = isFastTransition
            ? pitchFastTransitionConfirmFrames
            : pitchTransitionConfirmFrames;

          if (pendingPitchFrames >= requiredTransitionFrames) {
            lastStablePitch = pendingPitch;
            pendingPitch = null;
            pendingPitchFrames = 0;
            smoothedPitch = isFastTransition
              ? lastStablePitch
              : applyPitchEma(smoothedPitch, lastStablePitch);
            currentPitch = smoothedPitch;
            pitchHistory.push({ time: now, pitch: smoothedPitch });
          } else {
            currentPitch = smoothedPitch ?? lastStablePitch;
            pitchHistory.push({ time: now, pitch: currentPitch });
          }
        } else {
          pendingPitch = null;
          pendingPitchFrames = 0;
          lastStablePitch = candidate;
          smoothedPitch = applyPitchEma(smoothedPitch, candidate);
          currentPitch = smoothedPitch;
          pitchHistory.push({ time: now, pitch: smoothedPitch });
        }
      }
    }

    if (displayMode === 'volume') {
      drawVolumeHistory();
    } else if (displayMode === 'formants') {
      drawFormantCurveHistory();
    } else if (displayMode !== 'spectrogram') {
      drawPitchHistory();
    }

    if (currentPitch) {
      pitchValueEl.textContent = `${currentPitch.toFixed(1)} Hz`;
      noteValueEl.textContent = frequencyToNote(currentPitch);
    } else {
      pitchValueEl.textContent = '-- Hz';
      noteValueEl.textContent = '--';
    }
    captureRecordingFrame(now, rms, currentPitch);
    updatePitchScoreDisplay(now);
  }

  if (formantToggle.checked || displayMode === 'formants') {
    if (now - lastFormantUpdate >= formantUpdateIntervalMs) {
      lastFormantUpdate = now;
      const formantPitchResult = estimatePitchWithConfidence(
        dataArray,
        audioContext.sampleRate,
        analyser,
        frequencyData
      );
      if (!isReliableFormantVoice(formantPitchResult, rms)) {
        appendFormantBreak(formantCurveHistory, now);
        setFormantDisplay(null, null);
        setFormantStatus('未检测到稳定人声');
        lastFormantTimestamp = now;
        if (displayMode === 'formants') {
          drawFormantCurveHistory();
        }
        animationId = requestAnimationFrame(update);
        return;
      }
      const { f1, f2 } = estimateFormants();
      const stabilized = stabilizeFormants(f1, f2, now);
      formantCurveHistory.push({ time: now, f1: stabilized.f1, f2: stabilized.f2 });
      setFormantDisplay(stabilized.f1, stabilized.f2);
      lastFormantTimestamp = now;
      if (displayMode === 'formants') {
        drawFormantCurveHistory();
      }
    }
  } else {
    setFormantStatus('');
  }

  if (displayMode === 'spectrogram') {
    drawSpectrogramFrame();
  }
  animationId = requestAnimationFrame(update);
}

async function start() {
  try {
    setOfflineMode(false);
    resetOfflineState();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 4096;
    dataArray = new Float32Array(analyser.fftSize);
    frequencyData = new Float32Array(analyser.frequencyBinCount);

    sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(analyser);

    pitchHistory = [];
    volumeHistory = [];
    resetPitchStabilizer();
    resetBreathMeter();
    clearBreathReport();
    sessionStartTime = performance.now();
    lastFormantUpdate = 0;
    lastFormantTimestamp = 0;
    resetFormants();
    setAnalysisStatus('未开始');
    setStatus(displayMode === 'breath' ? '正在测量出气' : '正在监听麦克风', 'active');
    if (displayMode === 'spectrogram') {
      resetSpectrogram();
    } else if (displayMode === 'breath') {
      drawBreathHistory();
    }
    updateVolumeMeter(0);
    if (tiltMeterBar) {
      tiltMeterBar.style.height = '0%';
    }

    startButton.disabled = true;
    stopButton.disabled = false;

    update();
  } catch (error) {
    setStatus('无法访问麦克风，请检查权限设置');
    console.error(error);
  }
}

function stop() {
  const wasSpectrogram = displayMode === 'spectrogram';
  const spectrogramSnapshot = captureSpectrogramSnapshot();
  const shouldRenderBreathReport = displayMode === 'breath' && breathSessionHistory.length > 0;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if (sourceNode?.mediaStream) {
    sourceNode.mediaStream.getTracks().forEach((track) => track.stop());
  }
  sourceNode = null;
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  resetPitchStabilizer();
  setStatus(wasSpectrogram ? '已暂停，频谱图已冻结' : '已停止');
  updateVolumeMeter(0);
  if (tiltMeterBar) {
    tiltMeterBar.style.height = '0%';
  }
  startButton.disabled = false;
  stopButton.disabled = true;
  resetFormants();
  if (shouldRenderBreathReport) {
    renderBreathReport();
  }
  if (wasSpectrogram) {
    restoreSpectrogramSnapshot(spectrogramSnapshot);
    requestAnimationFrame(() => restoreSpectrogramSnapshot(spectrogramSnapshot));
  }
}

startButton.addEventListener('click', start);
stopButton.addEventListener('click', stop);
pitchAlgorithmSelect.addEventListener('change', (event) => {
  pitchAlgorithm = event.target.value;
  resetPitchStabilizer();
  if (!offlineAnalysisInProgress) {
    pitchHistory = [];
    volumeHistory = [];
    drawPitchHistory();
  }
});
pitchScaleModeSelect.addEventListener('change', (event) => {
  pitchScaleMode = event.target.value;
  drawPitchHistory();
});
displayModeSelect.addEventListener('change', (event) => {
  displayMode = event.target.value;
  if (offlineMode && (displayMode === 'spectrogram' || displayMode === 'breath')) {
    displayMode = 'pitch';
    displayModeSelect.value = 'pitch';
  }
  trainingMode =
    displayMode === 'pitch' || displayMode === 'volume' || displayMode === 'formants'
      ? 'curve'
      : displayMode;
  setReadoutMode(displayMode);
  setTrainingCopy(displayMode);
  setCurveSwitcherMode(displayMode);
  updateCanvasScale(canvasScale);
  if (displayMode === 'spectrogram') {
    resetSpectrogram();
  } else if (displayMode === 'breath') {
    resetBreathMeter();
    drawBreathHistory();
  } else if (displayMode === 'volume') {
    drawVolumeHistory();
  } else if (displayMode === 'formants') {
    drawFormantCurveHistory();
  } else {
    resetPitchScoreDisplay();
    drawPitchHistory();
  }
});
spectrogramOverlaySelect.addEventListener('change', (event) => {
  spectrogramOverlayMode = event.target.value;
  if (displayMode === 'spectrogram') {
    resetSpectrogram();
  }
});
canvasScaleRange.addEventListener('input', (event) => {
  updateCanvasScale(event.target.value);
});
targetPitchToggle?.addEventListener('change', (event) => {
  targetPitchEnabled = event.target.checked;
  drawPitchHistory();
});
targetPitchInput?.addEventListener('input', (event) => {
  const value = Number(event.target.value);
  if (!Number.isFinite(value)) {
    return;
  }
  targetPitchHz = Math.max(50, Math.min(1000, value));
  drawPitchHistory();
  updatePitchScoreDisplay();
});
offlineWindowRange?.addEventListener('input', (event) => {
  offlineWindowStartMs = clampOfflineWindowStart(Number(event.target.value) * 1000);
  updatePitchInspector(null);
  drawPitchHistory();
});
canvas.addEventListener('click', (event) => {
  if (displayMode !== 'pitch' || !pitchRenderState) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const canvasX = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const point = findNearestPitchPointByCanvasX(canvasX);
  updatePitchInspector(point);
  if (point && pitchRenderState.useRecordingTimeline && Number.isFinite(point.recordingTimeMs)) {
    recordingSelectedTimeMs = Math.max(0, Math.min(getRecordingDurationMs(), point.recordingTimeMs));
    const frame = findNearestRecordingFrame(recordingSelectedTimeMs);
    if (waveformTimeValue) {
      const pitchText = frame?.pitch ? ` · ${Math.round(frame.pitch)} Hz` : '';
      waveformTimeValue.textContent = `${formatTimeSeconds(recordingSelectedTimeMs)}${pitchText}`;
    }
    drawRecordingTimeline();
    drawWaveformPreview(frame);
  }
  drawPitchHistory();
});
volumeMeterToggle?.addEventListener('change', updateMeterVisibility);
tiltMeterToggle?.addEventListener('change', updateMeterVisibility);
breathCalibrateButton?.addEventListener('click', () => {
  calibrateBreathEnvironment();
});
recordButton.addEventListener('click', async () => {
  if (offlineAnalysisInProgress) {
    return;
  }
  try {
    if (!audioContext || !sourceNode?.mediaStream) {
      await start();
    }
    if (!sourceNode?.mediaStream) {
      throw new Error('No microphone stream available');
    }
    const stream = sourceNode.mediaStream;
    const recorder = new MediaRecorder(stream);
    recordedChunks = [];
    resetRecordingTimeline();
    recordingStartTime = performance.now();
    if (recordingTimelinePanel) {
      recordingTimelinePanel.hidden = false;
    }
    setTimelineStatus('录音中，时间轴正在记录...');
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    });
    recorder.addEventListener('stop', () => {
      const blob = new Blob(recordedChunks, { type: recorder.mimeType });
      lastRecordingBlob = blob.size > 0 ? blob : null;
      recordedChunks = [];
      recordingTimelineDurationMs = Math.max(
        recordingTimelineDurationMs,
        performance.now() - recordingStartTime
      );
      if (lastRecordingBlob) {
        prepareRecordingPlayback(lastRecordingBlob);
        selectRecordingTime(0, false);
        setTimelineStatus('点击时间轴可从任意位置播放，并查看当时波形');
      } else {
        setTimelineStatus('录音为空，请重新录制');
      }
      updateRecordingButtons();
      updatePitchAccuracyButton();
    });
    mediaRecorder = recorder;
    recorder.start();
    recordButton.disabled = true;
    stopRecordButton.disabled = false;
    setStatus('录音中', 'active');
  } catch (error) {
    console.error(error);
    setStatus('无法开始录音，请检查权限设置');
  }
});
stopRecordButton.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  recordButton.disabled = false;
  stopRecordButton.disabled = true;
});
recordingTimelineCanvas?.addEventListener('click', (event) => {
  if (!recordingTimelineFrames.length) {
    return;
  }
  const rect = recordingTimelineCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, x / rect.width));
  selectRecordingTime(ratio * getRecordingDurationMs(), Boolean(lastRecordingBlob));
});
timelinePlayPauseButton?.addEventListener('click', () => {
  if (!recordingPlaybackAudio) {
    return;
  }
  if (recordingPlaybackAudio.paused) {
    startRecordingPlayback(recordingSelectedTimeMs);
  } else {
    stopRecordingPlayback();
  }
});
analyzeRecordingButton.addEventListener('click', () => {
  if (lastRecordingBlob) {
    analyzeRecordingBlob(lastRecordingBlob);
  }
});
downloadRecordingButton.addEventListener('click', () => {
  if (!lastRecordingBlob) {
    return;
  }
  const filename = `voice-training_recording_${formatTimestamp(new Date())}.webm`;
  downloadBlob(lastRecordingBlob, filename);
});
pitchAccuracyButton.addEventListener('click', () => {
  runPitchAccuracyAnalysis();
});
songPitchInput?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) {
    analyzeSongPitchFile(file);
  }
});
songPitchToggle?.addEventListener('change', (event) => {
  songPitchEnabled = event.target.checked;
  resetPitchScoreDisplay();
  drawPitchHistory();
});
clearSongPitchButton?.addEventListener('click', () => {
  clearSongPitchTrack();
});
playSongPitchButton?.addEventListener('click', async () => {
  if (!songPitchAudio) {
    return;
  }
  try {
    if (accompanimentAudio && !accompanimentAudio.paused) {
      accompanimentAudio.pause();
      setAccompanimentStatus('已暂停');
    }
    await songPitchAudio.play();
    syncOfflineWindowToSongPlayback();
    stopSongPitchPlaybackProgress();
    updateSongPitchPlaybackProgress();
  } catch (error) {
    console.error(error);
    setSongPitchPlaybackStatus('无法播放', 'bad');
  }
});
pauseSongPitchButton?.addEventListener('click', () => {
  if (!songPitchAudio) {
    return;
  }
  songPitchAudio.pause();
  stopSongPitchPlaybackProgress();
  setSongPitchPlaybackStatus(`已暂停 ${formatTimeSeconds(songPitchAudio.currentTime * 1000)}`);
});
stopSongPitchButton?.addEventListener('click', () => {
  if (!songPitchAudio) {
    return;
  }
  songPitchAudio.pause();
  songPitchAudio.currentTime = 0;
  stopSongPitchPlaybackProgress();
  resetOfflineWindow();
  drawPitchHistory();
  setSongPitchPlaybackStatus('已停止');
});
memoryAnalyzeButton?.addEventListener('click', () => {
  analyzeMemoryPath();
});
formantToggle.addEventListener('change', () => {
  if (!formantToggle.checked) {
    resetFormants();
    setFormantStatus('');
  }
});
sidebarToggle.addEventListener('click', () => {
  if (appWindow.hidden) {
    return;
  }
  sidebar.hidden = false;
  const isOpen = sidebar.classList.toggle('open');
  sidebarToggle.setAttribute('aria-expanded', String(isOpen));
  sidebar.setAttribute('aria-hidden', String(!isOpen));
  if (!isOpen) {
    sidebar.hidden = true;
  }
});
songSearchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  searchSongs(songSearchInput?.value || '');
});

openCurveModeButton?.addEventListener('click', () => {
  showTrainingView('curve');
});
curvePitchButton?.addEventListener('click', () => {
  setCurveDisplayMode('pitch');
});
curveVolumeButton?.addEventListener('click', () => {
  setCurveDisplayMode('volume');
});
curveFormantButton?.addEventListener('click', () => {
  setCurveDisplayMode('formants');
});
openSpectrogramModeButton?.addEventListener('click', () => {
  showTrainingView('spectrogram');
});
openBreathModeButton?.addEventListener('click', () => {
  showTrainingView('breath');
});
openPitchScoreModeButton?.addEventListener('click', () => {
  showTrainingView('score');
});
openMemoryModeButton?.addEventListener('click', () => {
  showTrainingView('memory');
});
backToHomeButton?.addEventListener('click', () => {
  showLauncherView();
});

audioFileInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) {
    analyzeAudioFile(file);
  }
});
clearFileButton.addEventListener('click', () => {
  if (offlineAnalysisInProgress) {
    offlineAbort = true;
    setAnalysisStatus('取消中...');
    return;
  }
  setOfflineMode(false);
  resetOfflineState();
  pitchHistory = [];
  volumeHistory = [];
  drawPitchHistory();
});

window.addEventListener('beforeunload', stop);

accompanimentInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  if (accompanimentUrl) {
    URL.revokeObjectURL(accompanimentUrl);
  }
  accompanimentUrl = URL.createObjectURL(file);
  if (!accompanimentAudio) {
    accompanimentAudio = new Audio();
    accompanimentAudio.addEventListener('ended', () => {
      setAccompanimentStatus('已停止');
    });
  }
  accompanimentAudio.src = accompanimentUrl;
  accompanimentAudio.volume = Number(accompanimentVolume.value || 0.7);
  accompanimentFile = file;
  setAccompanimentStatus('已加载');
  updateAccompanimentButtons(true);
  updatePitchAccuracyButton();
});

playAccompanimentButton.addEventListener('click', async () => {
  if (!accompanimentAudio) {
    return;
  }
  try {
    await accompanimentAudio.play();
    setAccompanimentStatus('播放中');
  } catch (error) {
    console.error(error);
    setAccompanimentStatus('无法播放');
  }
});

pauseAccompanimentButton.addEventListener('click', () => {
  if (!accompanimentAudio) {
    return;
  }
  accompanimentAudio.pause();
  setAccompanimentStatus('已暂停');
});

stopAccompanimentButton.addEventListener('click', () => {
  if (!accompanimentAudio) {
    return;
  }
  accompanimentAudio.pause();
  accompanimentAudio.currentTime = 0;
  setAccompanimentStatus('已停止');
});

accompanimentVolume.addEventListener('input', (event) => {
  if (!accompanimentAudio) {
    return;
  }
  accompanimentAudio.volume = Number(event.target.value);
});
