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
const songPitchInput = document.getElementById('songPitchInput');
const songPitchToggle = document.getElementById('songPitchToggle');
const clearSongPitchButton = document.getElementById('clearSongPitchButton');
const songPitchStatus = document.getElementById('songPitchStatus');
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
const songPitchMinConfidence = 0.18;
const songPitchMaxGapMs = 180;
const songPitchMatchWindowMs = 120;
const songPitchRenderColor = '#2563eb';
const songPitchRenderSoftColor = 'rgba(37, 99, 235, 0.18)';
const recordingWaveformSampleCount = 96;
const recordingTimelineMinDurationMs = 1000;
const formantUpdateIntervalMs = 150;
const formantWindowSize = 5;
const formantTauMs = 450;
const formantSmoothingHz = 120;
const formantMaxJumpHz = { f1: 90, f2: 160 };
const formantVoiceConfidenceThreshold = 0.5;
const formantVoiceEnergyMultiplier = 3;
const formantVoiceMinRms = 0.012;
const formantVoiceRequiredFrames = 3;
const formantVoiceMaxPitchJumpCents = 90;
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
let formantVoiceGate = { frames: 0, lastPitch: null };
let spectrogramOverlayState = { pitch: null, f1: null, f2: null };
let offlineMode = false;
let offlineAbort = false;
let offlineFormantHistory = [];
let offlineSourceSampleRate = null;
let offlineAnalysisInProgress = false;
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

function setSongTrainingResult(text, tone = 'neutral') {
  if (!songTrainingResult) {
    return;
  }
  songTrainingResult.textContent = text;
  if (tone === 'good') {
    songTrainingResult.style.color = '#16a34a';
  } else if (tone === 'bad') {
    songTrainingResult.style.color = '#dc2626';
  } else {
    songTrainingResult.style.color = '#1c1f2a';
  }
}

function setTimelineStatus(text) {
  if (recordingTimelineStatus) {
    recordingTimelineStatus.textContent = text;
  }
}

function formatTimeSeconds(ms) {
  return `${(Math.max(0, ms) / 1000).toFixed(2)}s`;
}

function downsampleWaveform(buffer, sampleCount = recordingWaveformSampleCount) {
  const samples = [];
  const bucketSize = Math.max(1, Math.floor(buffer.length / sampleCount));
  for (let i = 0; i < sampleCount; i += 1) {
    const startIndex = i * bucketSize;
    const endIndex = Math.min(buffer.length, startIndex + bucketSize);
    let peak = 0;
    for (let j = startIndex; j < endIndex; j += 1) {
      peak = Math.max(peak, Math.abs(buffer[j] || 0));
    }
    samples.push(Math.min(1, peak));
  }
  return samples;
}

function resetRecordingTimeline({ keepBlob = false } = {}) {
  recordingStartTime = 0;
  recordingTimelineFrames = [];
  recordingTimelineDurationMs = 0;
  recordingSelectedTimeMs = 0;
  if (!keepBlob) {
    lastRecordingBlob = null;
  }
  stopRecordingPlayback();
  if (recordingTimelinePanel) {
    recordingTimelinePanel.hidden = true;
  }
  if (timelinePlayPauseButton) {
    timelinePlayPauseButton.disabled = true;
    timelinePlayPauseButton.textContent = '播放';
  }
  if (waveformTimeValue) {
    waveformTimeValue.textContent = '--';
  }
  drawRecordingTimeline();
  drawWaveformPreview(null);
}

function captureRecordingFrame(now, rms, pitch) {
  if (!mediaRecorder || mediaRecorder.state !== 'recording' || !recordingStartTime || !dataArray) {
    return;
  }
  const timeMs = Math.max(0, now - recordingStartTime);
  recordingTimelineDurationMs = Math.max(recordingTimelineDurationMs, timeMs);
  recordingSelectedTimeMs = timeMs;
  const timbreFeatures = extractRecordingTimbreFeatures();
  recordingTimelineFrames.push({
    timeMs,
    rms,
    pitch: pitch || null,
    ...timbreFeatures,
    samples: downsampleWaveform(dataArray),
  });
  drawRecordingTimeline();
}

function extractRecordingTimbreFeatures() {
  const features = {
    zcr: null,
    waveformRoughness: null,
    spectralFlatness: null,
    highFrequencyRatio: null,
    spectralCentroid: null,
  };
  if (dataArray?.length) {
    let crossings = 0;
    let diff = 0;
    for (let i = 1; i < dataArray.length; i += 1) {
      if ((dataArray[i - 1] < 0 && dataArray[i] >= 0) || (dataArray[i - 1] >= 0 && dataArray[i] < 0)) {
        crossings += 1;
      }
      diff += Math.abs(dataArray[i] - dataArray[i - 1]);
    }
    features.zcr = crossings / Math.max(1, dataArray.length - 1);
    features.waveformRoughness = clamp01(normalizeRange(diff / Math.max(1, dataArray.length - 1), 0.002, 0.08));
  }
  if (analyser && frequencyData && audioContext) {
    analyser.getFloatFrequencyData(frequencyData);
    const sampleRate = audioContext.sampleRate;
    const binHz = (sampleRate / 2) / Math.max(1, frequencyData.length);
    let total = 0;
    let weighted = 0;
    let high = 0;
    const powers = [];
    for (let i = 0; i < frequencyData.length; i += 1) {
      const hz = i * binHz;
      const power = 10 ** (frequencyData[i] / 10);
      if (hz >= 80) {
        total += power;
        weighted += hz * power;
        powers.push(Math.max(power, 1e-12));
      }
      if (hz >= 3000) {
        high += power;
      }
    }
    const geo = powers.length ? Math.exp(mean(powers.map((value) => Math.log(value)))) : 0;
    const arith = powers.length ? mean(powers) : 0;
    features.spectralFlatness = arith ? clamp01(geo / arith) : 0;
    features.highFrequencyRatio = total ? clamp01(high / total) : 0;
    features.spectralCentroid = total ? weighted / total : 0;
  }
  return features;
}

function getRecordingDurationMs() {
  return Math.max(
    recordingTimelineDurationMs,
    recordingTimelineFrames[recordingTimelineFrames.length - 1]?.timeMs || 0,
    recordingTimelineMinDurationMs
  );
}

function getRecordingSyncedPitchHistory() {
  if (offlineMode || !recordingTimelineFrames.length) {
    return [];
  }
  return recordingTimelineFrames.map((frame) => ({
    time: frame.timeMs,
    recordingTimeMs: frame.timeMs,
    pitch: frame.pitch || null,
  }));
}

function rmsToDb(rms) {
  return 20 * Math.log10(Math.max(rms || 0, 1e-5));
}

function getRecordingSyncedVolumeHistory() {
  if (offlineMode || !recordingTimelineFrames.length) {
    return [];
  }
  return recordingTimelineFrames.map((frame) => ({
    time: frame.timeMs,
    recordingTimeMs: frame.timeMs,
    rms: frame.rms || 0,
    db: rmsToDb(frame.rms || 0),
  }));
}

function findNearestRecordingFrame(timeMs) {
  if (!recordingTimelineFrames.length) {
    return null;
  }
  return recordingTimelineFrames.reduce((nearest, frame) => {
    if (!nearest) {
      return frame;
    }
    return Math.abs(frame.timeMs - timeMs) < Math.abs(nearest.timeMs - timeMs)
      ? frame
      : nearest;
  }, null);
}

function findNearestRecordingPitchPoint(timeMs) {
  const pitchPoints = getRecordingSyncedPitchHistory().filter((point) => point.pitch);
  if (!pitchPoints.length) {
    return null;
  }
  return pitchPoints.reduce((nearest, point) => {
    if (!nearest) {
      return point;
    }
    return Math.abs(point.recordingTimeMs - timeMs) < Math.abs(nearest.recordingTimeMs - timeMs)
      ? point
      : nearest;
  }, null);
}

function drawRecordingTimeline() {
  if (!recordingTimelineCtx || !recordingTimelineCanvas) {
    return;
  }
  const width = recordingTimelineCanvas.width;
  const height = recordingTimelineCanvas.height;
  const paddingX = 12;
  const centerY = Math.round(height * 0.48);
  const durationMs = getRecordingDurationMs();
  const frames = recordingTimelineFrames;

  recordingTimelineCtx.clearRect(0, 0, width, height);
  recordingTimelineCtx.fillStyle = '#ffffff';
  recordingTimelineCtx.fillRect(0, 0, width, height);

  recordingTimelineCtx.strokeStyle = '#d9ded6';
  recordingTimelineCtx.lineWidth = 1;
  recordingTimelineCtx.beginPath();
  recordingTimelineCtx.moveTo(paddingX, centerY);
  recordingTimelineCtx.lineTo(width - paddingX, centerY);
  recordingTimelineCtx.stroke();

  if (frames.length) {
    recordingTimelineCtx.strokeStyle = '#0f766e';
    recordingTimelineCtx.lineWidth = 2;
    recordingTimelineCtx.beginPath();
    frames.forEach((frame) => {
      const x = paddingX + (frame.timeMs / durationMs) * (width - paddingX * 2);
      const amp = Math.max(2, Math.min(34, (frame.rms || 0) * 360));
      recordingTimelineCtx.moveTo(x, centerY - amp);
      recordingTimelineCtx.lineTo(x, centerY + amp);
    });
    recordingTimelineCtx.stroke();

    recordingTimelineCtx.strokeStyle = 'rgba(15, 118, 110, 0.45)';
    recordingTimelineCtx.lineWidth = 1.5;
    recordingTimelineCtx.beginPath();
    let hasPitchPath = false;
    frames.forEach((frame) => {
      if (!frame.pitch) {
        hasPitchPath = false;
        return;
      }
      const x = paddingX + (frame.timeMs / durationMs) * (width - paddingX * 2);
      const y = height - 16 - Math.min(34, frame.pitch / 24);
      if (!hasPitchPath) {
        recordingTimelineCtx.moveTo(x, y);
        hasPitchPath = true;
      } else {
        recordingTimelineCtx.lineTo(x, y);
      }
    });
    recordingTimelineCtx.stroke();

    recordingTimelineCtx.fillStyle = '#0b5d56';
    frames.forEach((frame) => {
      if (!frame.pitch) {
        return;
      }
      const x = paddingX + (frame.timeMs / durationMs) * (width - paddingX * 2);
      recordingTimelineCtx.beginPath();
      recordingTimelineCtx.arc(x, centerY, 2.4, 0, Math.PI * 2);
      recordingTimelineCtx.fill();
    });
  }

  const selectedX = paddingX + (recordingSelectedTimeMs / durationMs) * (width - paddingX * 2);
  recordingTimelineCtx.strokeStyle = '#ff7a59';
  recordingTimelineCtx.lineWidth = 2;
  recordingTimelineCtx.beginPath();
  recordingTimelineCtx.moveTo(selectedX, 8);
  recordingTimelineCtx.lineTo(selectedX, height - 8);
  recordingTimelineCtx.stroke();

  recordingTimelineCtx.fillStyle = '#697167';
  recordingTimelineCtx.font = '12px sans-serif';
  recordingTimelineCtx.textBaseline = 'top';
  recordingTimelineCtx.fillText('0.00s', paddingX, height - 16);
  recordingTimelineCtx.textAlign = 'right';
  recordingTimelineCtx.fillText(formatTimeSeconds(durationMs), width - paddingX, height - 16);
  recordingTimelineCtx.textAlign = 'left';
}

function drawWaveformPreview(frame) {
  if (!waveformPreviewCtx || !waveformPreviewCanvas) {
    return;
  }
  const width = waveformPreviewCanvas.width;
  const height = waveformPreviewCanvas.height;
  const centerY = height / 2;
  waveformPreviewCtx.clearRect(0, 0, width, height);
  waveformPreviewCtx.fillStyle = '#ffffff';
  waveformPreviewCtx.fillRect(0, 0, width, height);
  waveformPreviewCtx.strokeStyle = '#eef1ed';
  waveformPreviewCtx.lineWidth = 1;
  waveformPreviewCtx.beginPath();
  waveformPreviewCtx.moveTo(0, centerY);
  waveformPreviewCtx.lineTo(width, centerY);
  waveformPreviewCtx.stroke();

  if (!frame?.samples?.length) {
    waveformPreviewCtx.fillStyle = '#8c9589';
    waveformPreviewCtx.font = '13px sans-serif';
    waveformPreviewCtx.textAlign = 'center';
    waveformPreviewCtx.textBaseline = 'middle';
    waveformPreviewCtx.fillText('点击录音时间轴查看当时波形', width / 2, centerY);
    waveformPreviewCtx.textAlign = 'left';
    return;
  }

  const barWidth = width / frame.samples.length;
  waveformPreviewCtx.fillStyle = '#0f766e';
  frame.samples.forEach((value, index) => {
    const barHeight = Math.max(2, value * (height - 24));
    const x = index * barWidth;
    waveformPreviewCtx.fillRect(x, centerY - barHeight / 2, Math.max(1, barWidth - 1), barHeight);
  });
}

function selectRecordingTime(timeMs, shouldPlay = false) {
  const durationMs = getRecordingDurationMs();
  recordingSelectedTimeMs = Math.max(0, Math.min(durationMs, timeMs));
  const frame = findNearestRecordingFrame(recordingSelectedTimeMs);
  if (waveformTimeValue) {
    const pitchText = frame?.pitch ? ` · ${Math.round(frame.pitch)} Hz` : '';
    waveformTimeValue.textContent = `${formatTimeSeconds(recordingSelectedTimeMs)}${pitchText}`;
  }
  drawRecordingTimeline();
  drawWaveformPreview(frame);
  if (!offlineMode && recordingTimelineFrames.length && displayMode === 'pitch') {
    updatePitchInspector(findNearestRecordingPitchPoint(recordingSelectedTimeMs));
    drawPitchHistory();
  } else if (!offlineMode && recordingTimelineFrames.length && displayMode === 'volume') {
    drawVolumeHistory();
  }
  if (shouldPlay) {
    startRecordingPlayback(recordingSelectedTimeMs);
  }
}

function prepareRecordingPlayback(blob) {
  if (!blob) {
    return;
  }
  if (recordingPlaybackUrl) {
    URL.revokeObjectURL(recordingPlaybackUrl);
  }
  recordingPlaybackUrl = URL.createObjectURL(blob);
  recordingPlaybackAudio = new Audio(recordingPlaybackUrl);
  recordingPlaybackAudio.addEventListener('ended', () => {
    stopRecordingPlayback();
    selectRecordingTime(getRecordingDurationMs(), false);
  });
  if (timelinePlayPauseButton) {
    timelinePlayPauseButton.disabled = false;
  }
}

function startRecordingPlayback(timeMs = recordingSelectedTimeMs) {
  if (!recordingPlaybackAudio) {
    return;
  }
  recordingPlaybackAudio.currentTime = Math.max(0, timeMs / 1000);
  recordingPlaybackAudio.play().then(() => {
    if (timelinePlayPauseButton) {
      timelinePlayPauseButton.textContent = '暂停';
    }
    updateRecordingPlaybackProgress();
  }).catch((error) => {
    console.error(error);
    setTimelineStatus('无法播放录音，请重新录制后再试');
  });
}

function stopRecordingPlayback(resetButton = true) {
  if (recordingPlaybackRaf) {
    cancelAnimationFrame(recordingPlaybackRaf);
    recordingPlaybackRaf = null;
  }
  if (recordingPlaybackAudio && !recordingPlaybackAudio.paused) {
    recordingPlaybackAudio.pause();
  }
  if (resetButton && timelinePlayPauseButton) {
    timelinePlayPauseButton.textContent = '播放';
  }
}

function updateRecordingPlaybackProgress() {
  if (!recordingPlaybackAudio || recordingPlaybackAudio.paused) {
    return;
  }
  const timeMs = recordingPlaybackAudio.currentTime * 1000;
  selectRecordingTime(timeMs, false);
  recordingPlaybackRaf = requestAnimationFrame(updateRecordingPlaybackProgress);
}

function frequencyToCentsError(frequency, targetFrequency) {
  if (!frequency || !targetFrequency || frequency <= 0 || targetFrequency <= 0) {
    return null;
  }
  return 1200 * Math.log2(frequency / targetFrequency);
}

function formatSignedCents(cents) {
  if (!Number.isFinite(cents)) {
    return '-- cents';
  }
  const sign = cents > 0 ? '+' : '';
  return `${sign}${cents.toFixed(1)} cents`;
}

function hasSongPitchTarget() {
  return songPitchEnabled && songPitchTrack.length > 0;
}

function getSongPracticeTimeMs(now = performance.now()) {
  if (accompanimentAudio && !accompanimentAudio.paused && Number.isFinite(accompanimentAudio.currentTime)) {
    return accompanimentAudio.currentTime * 1000;
  }
  if (sessionStartTime > 0) {
    return Math.max(0, now - sessionStartTime);
  }
  return 0;
}

function findSongPitchAt(timeMs, maxDistanceMs = songPitchMatchWindowMs) {
  if (!songPitchTrack.length || !Number.isFinite(timeMs)) {
    return null;
  }

  let left = 0;
  let right = songPitchTrack.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (songPitchTrack[mid].timeMs < timeMs) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  const candidates = [songPitchTrack[left], songPitchTrack[left - 1]].filter(Boolean);
  const nearest = candidates.reduce((best, point) => {
    if (!best) {
      return point;
    }
    return Math.abs(point.timeMs - timeMs) < Math.abs(best.timeMs - timeMs) ? point : best;
  }, null);

  if (!nearest || Math.abs(nearest.timeMs - timeMs) > maxDistanceMs || !nearest.pitch) {
    return null;
  }
  return nearest;
}

function getTargetPitchForTime(timeMs) {
  const songPoint = hasSongPitchTarget() ? findSongPitchAt(timeMs) : null;
  return songPoint?.pitch || targetPitchHz;
}

function getTargetPitchForNow(now = performance.now()) {
  return getTargetPitchForTime(getSongPracticeTimeMs(now));
}

function getSongPracticeTimeForPoint(pointTime, now = performance.now()) {
  if (
    accompanimentAudio &&
    Number.isFinite(accompanimentAudio.currentTime) &&
    accompanimentAudio.currentTime > 0
  ) {
    const elapsedFromPointMs = Math.max(0, now - pointTime);
    return Math.max(0, accompanimentAudio.currentTime * 1000 - elapsedFromPointMs);
  }
  return Math.max(0, pointTime - sessionStartTime);
}

function getPitchScoreWindow(now = performance.now()) {
  const minTime = now - pitchScoreWindowSeconds * 1000;
  return pitchHistory
    .filter((point) => point.time >= minTime && point.pitch)
    .map((point) => {
      const targetPitch = getTargetPitchForTime(getSongPracticeTimeForPoint(point.time, now));
      return {
        ...point,
        targetPitch,
        cents: frequencyToCentsError(point.pitch, targetPitch),
      };
    })
    .filter((point) => Number.isFinite(point.cents));
}

function computePitchScoreStats(now = performance.now()) {
  const windowPoints = getPitchScoreWindow(now);
  if (!windowPoints.length) {
    return null;
  }

  const absErrors = windowPoints.map((point) => Math.abs(point.cents));
  const averageAbsError =
    absErrors.reduce((sum, value) => sum + value, 0) / absErrors.length;
  const meanCents =
    windowPoints.reduce((sum, point) => sum + point.cents, 0) / windowPoints.length;
  const variance =
    windowPoints.reduce((sum, point) => sum + (point.cents - meanCents) ** 2, 0) /
    windowPoints.length;
  const centsStdDev = Math.sqrt(variance);
  const score = Math.round(
    Math.max(0, 100 - (averageAbsError / pitchScoreMaxUsefulCents) * 100)
  );
  const stability = Math.round(
    Math.max(0, 100 - (centsStdDev / pitchScoreMaxUsefulCents) * 100)
  );
  const hitRate = Math.round(
    (windowPoints.filter((point) => Math.abs(point.cents) <= pitchScoreHitToleranceCents)
      .length /
      windowPoints.length) *
      100
  );

  return {
    score,
    stability,
    hitRate,
    currentCents: frequencyToCentsError(currentPitch, getTargetPitchForNow(now)),
    currentTargetPitch: getTargetPitchForNow(now),
    averageAbsError,
  };
}

function setPitchScoreTone(tone) {
  if (!pitchScoreDashboard || pitchScoreLastTone === tone) {
    return;
  }
  pitchScoreDashboard.dataset.tone = tone;
  pitchScoreLastTone = tone;
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
  pitchScoreCaption.textContent = `${direction}，最近 ${pitchScoreWindowSeconds} 秒平均偏差 ${stats.averageAbsError.toFixed(
    1
  )} cents。`;
  pitchScoreCentsValue.textContent = formatSignedCents(stats.currentCents);
  if (pitchScoreTargetValue && hasSongPitchTarget() && stats.currentTargetPitch) {
    pitchScoreTargetValue.textContent = `${Math.round(stats.currentTargetPitch)} Hz`;
  }
  pitchScoreStabilityValue.textContent = `${stats.stability}%`;
  pitchScoreHitRateValue.textContent = `${stats.hitRate}%`;
  if (hasSongPitchTarget()) {
    setSongTrainingResult(
      `${stats.score}% / 平均偏差 ${stats.averageAbsError.toFixed(1)} cents`,
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

function memoryNeutralVector() {
  return { pitch: 0.45, loudness: 0.22, brightness: 0.42, breathiness: 0.24, stability: 0.62, phiSn: 0.62, phiEtex: 0.44, closure: 0.42 };
}

function memoryDistance(a, b) {
  const keys = Object.keys(b);
  const sum = keys.reduce((acc, key) => acc + (a[key] - b[key]) ** 2, 0);
  return Math.sqrt(sum / keys.length);
}

function memoryFrameVector(frame, index, frames) {
  const pitch = frame.pitch
    ? clamp01(normalizeRange(Math.log2(frame.pitch), Math.log2(90), Math.log2(700)))
    : 0.35;
  const loudness = clamp01(normalizeRange(rmsToDb(frame.rms || 0), -58, -16));
  const previous = frames[Math.max(0, index - 1)];
  const pitchDelta = frame.pitch && previous?.pitch ? Math.abs(getPitchDistanceCents(frame.pitch, previous.pitch)) : 0;
  const stability = clamp01(1 - normalizeRange(pitchDelta, 20, 180));
  const zcr = Number.isFinite(frame.zcr) ? clamp01(normalizeRange(frame.zcr, 0.015, 0.16)) : 0.28;
  const flatness = Number.isFinite(frame.spectralFlatness) ? clamp01(normalizeRange(frame.spectralFlatness, 0.02, 0.42)) : 0.32;
  const highFrequency = Number.isFinite(frame.highFrequencyRatio) ? clamp01(normalizeRange(frame.highFrequencyRatio, 0.02, 0.42)) : 0.25;
  const roughness = Number.isFinite(frame.waveformRoughness)
    ? frame.waveformRoughness
    : clamp01(normalizeRange(pitchDelta, 25, 220));
  const centroidBrightness = Number.isFinite(frame.spectralCentroid)
    ? clamp01(normalizeRange(frame.spectralCentroid, 700, 4200))
    : 0.35 + pitch * 0.35 + loudness * 0.2;
  const brightness = clamp01(0.62 * centroidBrightness + 0.24 * pitch + 0.14 * loudness);
  const continuity = frame.pitch ? 1 : 0.15;
  const harmonicityProxy = clamp01(0.55 * stability + 0.25 * continuity + 0.2 * (1 - roughness));
  const phiSn = clamp01(
    0.32 * harmonicityProxy +
      0.26 * stability +
      0.18 * continuity +
      0.12 * (1 - flatness) +
      0.12 * (1 - zcr)
  );
  const phiEtex = clamp01(0.38 * brightness + 0.22 * flatness + 0.2 * highFrequency + 0.2 * roughness);
  const breathiness = clamp01(0.56 * (1 - phiSn) + 0.24 * flatness + 0.2 * highFrequency);
  const closureRaw = 0.58 * phiSn + 0.18 * loudness + 0.16 * (1 - breathiness) + 0.08 * phiEtex;
  const pressedPenalty = Math.max(0, loudness - 0.72) * 0.22 + Math.max(0, roughness - 0.62) * 0.16;
  const closure = clamp01(closureRaw - pressedPenalty);
  return { pitch, loudness, brightness, breathiness, stability, phiSn, phiEtex, closure };
}

function memoryEffectiveRank(rows) {
  if (!rows.length) {
    return 1;
  }
  const dims = rows[0].length;
  const means = Array.from({ length: dims }, (_, dim) => mean(rows.map((row) => row[dim])));
  const variances = means.map((m, dim) => mean(rows.map((row) => (row[dim] - m) ** 2)));
  const total = variances.reduce((sum, value) => sum + value, 0);
  if (total <= 1e-9) {
    return 1;
  }
  const sorted = [...variances].sort((a, b) => b - a);
  let acc = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    acc += sorted[i];
    if (acc / total >= 0.9) {
      return i + 1;
    }
  }
  return dims;
}

function meanMemoryVector(frames) {
  const keys = ['pitch', 'loudness', 'brightness', 'breathiness', 'stability', 'phiSn', 'phiEtex', 'closure'];
  return Object.fromEntries(keys.map((key) => [key, mean(frames.map((frame) => frame.vector[key]))]));
}

function memoryVectorNeed(current, target) {
  return {
    phiSn: target.phiSn - current.phiSn,
    phiEtex: target.phiEtex - current.phiEtex,
    breathiness: target.breathiness - current.breathiness,
    closure: target.closure - current.closure,
    loudness: target.loudness - current.loudness,
  };
}

function memoryInstructionScore(need, instruction, current, hiddenLoad, recovery) {
  const next = {
    phiSn: current.phiSn + instruction.vector.phiSn,
    phiEtex: current.phiEtex + instruction.vector.phiEtex,
    breathiness: current.breathiness + instruction.vector.breathiness,
    closure: current.closure + instruction.vector.closure,
    loudness: current.loudness + instruction.vector.loudness,
  };
  const afterDistance = Math.sqrt(
    ['phiSn', 'phiEtex', 'breathiness', 'closure', 'loudness'].reduce(
      (sum, key) => sum + (need[key] - instruction.vector[key]) ** 2,
      0
    ) / 5
  );
  const pressedRisk = clamp01(
    Math.max(0, current.closure - 0.72) * 1.6 +
      Math.max(0, current.loudness - 0.72) * 1.2 +
      Math.max(0, recovery - 0.34) * 0.8
  );
  const closureOvershoot = Math.max(0, next.closure - 0.76);
  const instabilityPenalty = Math.max(0, 0.38 - next.phiSn) * 0.6;
  return clamp01(1 - afterDistance - closureOvershoot * 0.45 - instabilityPenalty - hiddenLoad * 0.14 - pressedRisk * 0.18);
}

function recommendMemoryInstruction(current, target, hiddenLoad, recovery) {
  const need = memoryVectorNeed(current, target);
  const selectedId = memoryInstructionSelect?.value || 'auto';
  const ranked = Object.entries(memoryControlInstructions)
    .map(([id, instruction]) => ({
      id,
      ...instruction,
      score: memoryInstructionScore(need, instruction, current, hiddenLoad, recovery),
    }))
    .sort((a, b) => b.score - a.score);
  if (selectedId !== 'auto' && memoryControlInstructions[selectedId]) {
    const selected = ranked.find((item) => item.id === selectedId);
    return { selected, best: ranked[0], need };
  }
  return { selected: ranked[0], best: ranked[0], need };
}

function analyzeMemoryPath() {
  if (!recordingTimelineFrames.length) {
    setMemoryEmptyState('请先录制一段音频，再分析最近录音。');
    return;
  }
  const durationMs = getRecordingDurationMs();
  const target = memoryTargets[memoryTargetSelect?.value || 'brightStable'] || memoryTargets.brightStable;
  const path = memoryPathClasses[memoryPathSelect?.value || 'neutralBright'] || memoryPathClasses.neutralBright;
  const frames = recordingTimelineFrames.map((frame, index) => ({
    time: frame.timeMs / 1000,
    vector: memoryFrameVector(frame, index, recordingTimelineFrames),
  }));
  const duration = Math.max(durationMs / 1000, frames[frames.length - 1]?.time || 0.1);
  const holdStart = duration * 0.4;
  const holdEnd = duration * 0.75;
  const holdFrames = frames.filter((frame) => frame.time >= holdStart && frame.time <= holdEnd);
  const recoveryFrames = frames.filter((frame) => frame.time > holdEnd);
  const activeFrames = holdFrames.length ? holdFrames : frames;
  const residualRows = frames.map((frame, index) => {
    const localTarget = frame.time > holdEnd ? memoryNeutralVector() : target;
    const residual = memoryDistance(frame.vector, localTarget);
    const lag2 = frames[Math.max(0, index - 2)];
    const lag5 = frames[Math.max(0, index - 5)];
    const velocity = index > 0 ? memoryDistance(frame.vector, frames[index - 1].vector) : 0;
    const components = [
      residual,
      memoryDistance(lag2.vector, localTarget),
      memoryDistance(lag5.vector, localTarget),
      velocity,
      Math.abs(frame.vector.breathiness - target.breathiness),
    ];
    return { residual, components, energy: clamp01(0.5 * components.reduce((sum, value) => sum + value * value, 0)) };
  });
  const soundError = mean(activeFrames.map((frame) => memoryDistance(frame.vector, target))) * path.soundBias;
  const hiddenLoad = mean(residualRows.map((row) => row.energy)) * path.hiddenBias;
  const rank = memoryEffectiveRank(residualRows.map((row) => row.components));
  const recoveryValues = recoveryFrames.map((frame) => memoryDistance(frame.vector, memoryNeutralVector()));
  const recovery = recoveryValues.length
    ? clamp01(0.65 * mean(recoveryValues.map((value, index) => value * ((index + 1) / recoveryValues.length))) + 0.35 * mean(recoveryValues.slice(-4)))
    : 0.5;
  const total = clamp01(0.45 * soundError + 0.3 * hiddenLoad + 0.15 * normalizeRange(rank, 1, 5) + 0.1 * recovery);
  const zone = classifyMemoryZone(soundError, hiddenLoad, recovery);
  const controlState = meanMemoryVector(activeFrames);
  const instruction = recommendMemoryInstruction(controlState, target, hiddenLoad, recovery);
  renderMemoryResult({ zone, soundError, hiddenLoad, rank, recovery, total, path, controlState, instruction });
}

function classifyMemoryZone(soundError, hiddenLoad, recovery) {
  if (soundError > 0.34) {
    return {
      id: 1,
      title: '目标未匹配',
      badge: '1',
      copy: '当前声音和目标音色还有明显距离。先调整音高、响度、明暗、气声比例或元音形状。',
    };
  }
  if (hiddenLoad > 0.2 || recovery > 0.36) {
    return {
      id: 2,
      title: '补偿性匹配',
      badge: '2',
      copy: '声音已经接近目标，但路径成本偏高。建议降低响度、放慢过渡、加入恢复段或换用重置练习。',
    };
  }
  return {
    id: 3,
    title: '稳定匹配',
    badge: '3',
    copy: '目标接近且隐藏负荷较低。可以逐步增加保持时长、音高范围或转换速度。',
  };
}

function renderMemoryResult(result) {
  memoryZoneCard.className = `memory-zone-card zone-${result.zone.id}`;
  memoryZoneTitle.textContent = result.zone.title;
  memoryZoneCopy.textContent = result.zone.copy;
  memoryZoneBadge.textContent = result.zone.badge;
  memorySoundError.textContent = result.soundError.toFixed(3);
  memoryHiddenLoad.textContent = result.hiddenLoad.toFixed(3);
  memoryRank.textContent = result.rank.toFixed(1);
  memoryRecovery.textContent = result.recovery.toFixed(3);
  memoryPhiSn.textContent = result.controlState.phiSn.toFixed(3);
  memoryPhiEtex.textContent = result.controlState.phiEtex.toFixed(3);
  memoryBreathiness.textContent = `${Math.round(result.controlState.breathiness * 100)}%`;
  memoryClosure.textContent = `${Math.round(result.controlState.closure * 100)}%`;
  const selected = result.instruction.selected;
  const best = result.instruction.best;
  const isManual = memoryInstructionSelect?.value && memoryInstructionSelect.value !== 'auto';
  memoryControlTitle.textContent = isManual
    ? `当前指令：${selected.label}`
    : `推荐指令：${selected.label}`;
  memoryControlCopy.textContent =
    selected.id === best.id
      ? selected.advice
      : `${selected.advice} 当前自动评分最高的是“${best.label}”，可作为下一轮对照。`;
  memoryControlScore.textContent = `${Math.round(selected.score * 100)}%`;
  memoryRecommendation.textContent = `${result.path.label}：${result.path.advice}  控制场总分 Ĵ = ${result.total.toFixed(
    3
  )}。目标差距：ΦSN ${formatSignedUnit(result.instruction.need.phiSn)}，ΦEtex ${formatSignedUnit(
    result.instruction.need.phiEtex
  )}，气声 ${formatSignedUnit(result.instruction.need.breathiness)}，闭合 ${formatSignedUnit(
    result.instruction.need.closure
  )}。`;
}

function setMemoryEmptyState(message) {
  if (!memoryZoneCard) {
    return;
  }
  memoryZoneCard.className = 'memory-zone-card';
  memoryZoneTitle.textContent = '等待分析';
  memoryZoneCopy.textContent = message;
  memoryZoneBadge.textContent = '--';
  memorySoundError.textContent = '--';
  memoryHiddenLoad.textContent = '--';
  memoryRank.textContent = '--';
  memoryRecovery.textContent = '--';
  memoryPhiSn.textContent = '--';
  memoryPhiEtex.textContent = '--';
  memoryBreathiness.textContent = '--';
  memoryClosure.textContent = '--';
  memoryControlTitle.textContent = '等待控制场分析';
  memoryControlCopy.textContent = 'S84 思路：比较目标差距和教学指令的预计移动方向，而不只判断当前声音像不像目标。';
  memoryControlScore.textContent = '--';
  memoryRecommendation.textContent = '暂无路径推荐。';
}

function formatSignedUnit(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
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

function renderSongSearchResults(results) {
  if (!songSearchResults) {
    return;
  }
  songSearchResults.innerHTML = '';

  results.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'song-search-item';

    const title = document.createElement('strong');
    title.textContent = `${item.trackName || '未知歌曲'} - ${item.artistName || '未知歌手'}`;
    li.appendChild(title);

    const album = document.createElement('span');
    album.textContent = item.collectionName ? `专辑：${item.collectionName}` : '专辑：未知';
    li.appendChild(album);

    const source = document.createElement('span');
    source.className = 'song-source';
    source.textContent = `来源：${item.source || '未知'}`;
    li.appendChild(source);

    if (item.trackViewUrl) {
      const link = document.createElement('a');
      link.href = item.trackViewUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '查看歌曲';
      li.appendChild(link);
    }

    songSearchResults.appendChild(li);
  });
}

async function fetchItunesSongs(query, signal) {
  const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=6&country=cn`;
  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error(`iTunes HTTP ${response.status}`);
  }
  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];
  return results.map((item) => ({
    trackName: item.trackName,
    artistName: item.artistName,
    collectionName: item.collectionName,
    trackViewUrl: item.trackViewUrl,
    source: 'iTunes Music',
  }));
}

function mapNeteaseItem(item) {
  const artist = Array.isArray(item.artists)
    ? item.artists.map((a) => a.name).filter(Boolean).join(' / ')
    : item.artist || item.author || item.singer;
  return {
    trackName: item.name || item.songname || item.title,
    artistName: artist,
    collectionName: item.album?.name || item.album || item.albumname,
    trackViewUrl: item.url || (item.id ? `https://music.163.com/#/song?id=${item.id}` : ''),
    source: '网易云音乐',
  };
}

async function fetchNeteaseSongs(query, signal) {
  const endpoint = `https://music-api.gdstudio.xyz/api.php?types=search&source=netease&name=${encodeURIComponent(query)}&count=6`;
  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error(`Netease HTTP ${response.status}`);
  }
  const data = await response.json();
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.result)
      ? data.result
      : Array.isArray(data?.songs)
        ? data.songs
        : Array.isArray(data?.data)
          ? data.data
          : [];
  return list.map(mapNeteaseItem).filter((item) => item.trackName || item.artistName);
}

async function searchSongs(keyword) {
  const query = keyword.trim();
  if (!query) {
    songSearchStatus.textContent = '请输入搜索关键词';
    return;
  }

  if (songSearchAbortController) {
    songSearchAbortController.abort();
  }
  songSearchAbortController = new AbortController();

  songSearchButton.disabled = true;
  songSearchStatus.textContent = '搜索中...';

  try {
    const settled = await Promise.allSettled([
      fetchItunesSongs(query, songSearchAbortController.signal),
      fetchNeteaseSongs(query, songSearchAbortController.signal),
    ]);

    const successfulResults = settled
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => result.value);

    if (successfulResults.length === 0) {
      songSearchResults.innerHTML = '';
      songSearchStatus.textContent = '未找到歌曲，或部分平台暂不可用，请稍后重试';
      return;
    }

    renderSongSearchResults(successfulResults);
    const sources = successfulResults.reduce((set, item) => set.add(item.source), new Set());
    songSearchStatus.textContent = `找到 ${successfulResults.length} 首歌曲（来源：${[...sources].join('、')}）`;
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }
    console.error(error);
    songSearchStatus.textContent = '搜索失败，请检查网络后重试';
  } finally {
    songSearchButton.disabled = false;
  }
}

function extractPitchTrack(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const data = audioBuffer.getChannelData(0);
  const frameLength = Math.round((sampleRate * offlineFrameDurationMs) / 1000);
  const hopLength = Math.round((sampleRate * offlineHopDurationMs) / 1000);
  const track = [];

  for (let offset = 0; offset + frameLength <= data.length; offset += hopLength) {
    const frame = data.subarray(offset, offset + frameLength);
    const pitch = autoCorrelate(frame, sampleRate);
    track.push(pitch);
  }

  return track;
}

function getMonoChannelData(audioBuffer) {
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer.getChannelData(0);
  }
  const mono = new Float32Array(audioBuffer.length);
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) {
      mono[i] += data[i] / audioBuffer.numberOfChannels;
    }
  }
  return mono;
}

function smoothSongPitchTrack(rawTrack) {
  const voiced = rawTrack.filter((point) => point.pitch);
  if (!voiced.length) {
    return [];
  }

  return rawTrack.map((point, index) => {
    if (!point.pitch) {
      return point;
    }
    const nearby = [];
    for (let i = Math.max(0, index - 2); i <= Math.min(rawTrack.length - 1, index + 2); i += 1) {
      if (rawTrack[i].pitch) {
        nearby.push(rawTrack[i].pitch);
      }
    }
    const smoothedPitch = median(nearby);
    return {
      ...point,
      pitch: selectPitchCandidate(smoothedPitch, point.pitch) || smoothedPitch,
    };
  });
}

function extractSongPitchTrack(audioBuffer, onProgress = () => {}) {
  const sampleRate = audioBuffer.sampleRate;
  const data = getMonoChannelData(audioBuffer);
  const frameLength = Math.round((sampleRate * offlineFrameDurationMs) / 1000);
  const hopLength = Math.round((sampleRate * offlineHopDurationMs) / 1000);
  const totalFrames = Math.max(1, Math.floor((data.length - frameLength) / hopLength));
  const rawTrack = [];
  let lastPitch = null;
  let lastProgress = -1;

  for (let offset = 0, frameIndex = 0; offset + frameLength <= data.length; offset += hopLength, frameIndex += 1) {
    const frame = data.subarray(offset, offset + frameLength);
    const rms = computeRms(frame);
    const { pitch, confidence } = autoCorrelateWithConfidence(frame, sampleRate, rms);
    const timeMs = (offset / sampleRate) * 1000;
    let stablePitch = null;

    if (
      pitch &&
      confidence >= songPitchMinConfidence &&
      pitch >= pitchMinHz &&
      pitch <= pitchMaxHz
    ) {
      stablePitch = selectPitchCandidate(pitch, lastPitch) || pitch;
      lastPitch = stablePitch;
    } else if (lastPitch && rawTrack.length) {
      const lastVoiced = rawTrack[rawTrack.length - 1];
      if (lastVoiced.pitch && timeMs - lastVoiced.timeMs <= songPitchMaxGapMs) {
        stablePitch = lastPitch;
      } else {
        lastPitch = null;
      }
    }

    rawTrack.push({
      time: timeMs,
      timeMs,
      pitch: stablePitch,
      confidence,
    });

    const progress = Math.round((frameIndex / totalFrames) * 100);
    if (progress !== lastProgress && progress % 5 === 0) {
      lastProgress = progress;
      onProgress(Math.min(99, progress));
    }
  }

  return smoothSongPitchTrack(rawTrack);
}

function summarizeSongPitchTrack(track, audioBuffer) {
  const voiced = track.filter((point) => point.pitch);
  if (!voiced.length) {
    return null;
  }
  const pitches = voiced.map((point) => point.pitch);
  return {
    durationSeconds: audioBuffer.duration,
    voicedCount: voiced.length,
    coverage: voiced.length / Math.max(track.length, 1),
    minPitch: Math.min(...pitches),
    maxPitch: Math.max(...pitches),
  };
}

async function analyzeSongPitchFile(file) {
  if (!file || songPitchAnalysisInProgress) {
    return;
  }

  songPitchAnalysisInProgress = true;
  updatePitchAccuracyButton();
  setSongPitchStatus('解码中...');
  setSongTrainingResult('--');
  if (songPitchStats) {
    songPitchStats.textContent = '--';
  }

  let audioBuffer;
  try {
    audioBuffer = await decodeAudioFile(file);
  } catch (error) {
    console.error(error);
    setSongPitchStatus('解码失败', 'bad');
    songPitchAnalysisInProgress = false;
    updatePitchAccuracyButton();
    return;
  }

  try {
    setSongPitchStatus('提取中... 0%');
    const track = extractSongPitchTrack(audioBuffer, (progress) => {
      setSongPitchStatus(`提取中... ${progress}%`);
    });
    const summary = summarizeSongPitchTrack(track, audioBuffer);
    if (!summary || summary.coverage < 0.02) {
      songPitchTrack = [];
      songPitchFileName = '';
      setSongPitchStatus('有效音高不足', 'bad');
      if (songPitchStats) {
        songPitchStats.textContent = '--';
      }
      drawPitchHistory();
      return;
    }

    songPitchTrack = track;
    songPitchFileName = file.name;
    songPitchEnabled = true;
    if (songPitchToggle) {
      songPitchToggle.checked = true;
    }
    if (clearSongPitchButton) {
      clearSongPitchButton.disabled = false;
    }
    setSongPitchStatus('已生成目标曲线', 'good');
    if (songPitchStats) {
      songPitchStats.textContent = `${Math.round(summary.durationSeconds)}s / ${Math.round(
        summary.minPitch
      )}-${Math.round(summary.maxPitch)} Hz`;
    }
    setOfflineMode(true);
    setDataSourceLabel('歌曲目标曲线');
    setAnalysisStatus('歌曲目标已生成');
    pitchHistory = track.map((point) => ({ time: point.timeMs, pitch: point.pitch }));
    volumeHistory = [];
    resetPitchScoreDisplay();
    drawPitchHistory();
  } finally {
    songPitchAnalysisInProgress = false;
    updatePitchAccuracyButton();
  }
}

function clearSongPitchTrack() {
  songPitchTrack = [];
  songPitchFileName = '';
  setSongPitchStatus('未加载');
  setSongTrainingResult('--');
  if (songPitchStats) {
    songPitchStats.textContent = '--';
  }
  if (songPitchInput) {
    songPitchInput.value = '';
  }
  if (clearSongPitchButton) {
    clearSongPitchButton.disabled = true;
  }
  if (offlineMode) {
    setOfflineMode(false);
    resetOfflineState();
    pitchHistory = [];
    volumeHistory = [];
  }
  resetPitchScoreDisplay();
  drawPitchHistory();
  updatePitchAccuracyButton();
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
  const compareLength = Math.min(referenceTrack.length, vocalTrack.length);
  const centsErrors = [];

  for (let i = 0; i < compareLength; i += 1) {
    const ref = referenceTrack[i];
    const vocal = vocalTrack[i];
    if (!ref || !vocal) {
      continue;
    }
    const cents = Math.abs(1200 * Math.log2(vocal / ref));
    if (Number.isFinite(cents)) {
      centsErrors.push(cents);
    }
  }

  if (!centsErrors.length) {
    setPitchAccuracyResult('有效音高不足');
    updatePitchAccuracyButton();
    return;
  }

  const meanError = centsErrors.reduce((sum, value) => sum + value, 0) / centsErrors.length;
  const label = meanError <= 35 ? '音高准确' : '跑调';
  const tone = meanError <= 35 ? 'good' : 'bad';
  setPitchAccuracyResult(`${label}（偏差 ${meanError.toFixed(1)} cents）`, tone);
  setSongTrainingResult(
    songPitchTrack.length
      ? `${meanError <= 35 ? '命中' : '需修正'}，平均偏差 ${meanError.toFixed(1)} cents`
      : '--',
    tone
  );
  updatePitchAccuracyButton();
}

function frequencyToNote(freq) {
  if (!freq) {
    return '--';
  }
  const noteNumber = 12 * (Math.log2(freq / 440)) + 69;
  const rounded = Math.round(noteNumber);
  const noteIndex = ((rounded % 12) + 12) % 12;
  const octave = Math.floor(rounded / 12) - 1;
  return `${noteNames[noteIndex]}${octave}`;
}

function computeRms(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const value = buffer[i];
    sum += value * value;
  }
  return Math.sqrt(sum / buffer.length);
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

function resetBreathMeter() {
  breathHistory = [];
  breathSessionHistory = [];
  breathRecentScores = [];
  breathCurrentFlow = null;
  breathCurrentEffort = null;
  breathCurrentHighFrequency = null;
  breathCurrentLeakNoise = null;
  breathCurrentStability = null;
  breathStartTime = null;
  breathDurationSeconds = 0;
  if (breathFlowValueEl) {
    breathFlowValueEl.textContent = '--%';
  }
  if (breathScoreHeroValue) {
    breathScoreHeroValue.textContent = '--%';
  }
  if (breathEffortValueEl) {
    breathEffortValueEl.textContent = '--%';
  }
  if (breathEffortHeroValue) {
    breathEffortHeroValue.textContent = '--%';
  }
  if (breathNoiseValueEl) {
    breathNoiseValueEl.textContent = '--%';
  }
  if (breathNoiseHeroValue) {
    breathNoiseHeroValue.textContent = '--%';
  }
  if (breathLeakValueEl) {
    breathLeakValueEl.textContent = '--%';
  }
  if (breathLeakHeroValue) {
    breathLeakHeroValue.textContent = '--%';
  }
  if (breathVoiceTypeValueEl) {
    breathVoiceTypeValueEl.textContent = '--';
  }
  if (breathVoiceHeroValue) {
    breathVoiceHeroValue.textContent = '--';
  }
  if (breathStabilityValueEl) {
    breathStabilityValueEl.textContent = '-- / 0.0s';
  }
  if (breathStabilityHeroValue) {
    breathStabilityHeroValue.textContent = '--%';
  }
  if (breathDurationHeroValue) {
    breathDurationHeroValue.textContent = '0.0s';
  }
}

function clearBreathReport() {
  if (!breathReport) {
    return;
  }
  breathReport.hidden = true;
  delete breathReport.dataset.hasReport;
  if (breathReportSummary) {
    breathReportSummary.textContent = '--';
  }
  [
    breathReportAverage,
    breathReportPeak,
    breathReportEffort,
    breathReportHighFrequency,
    breathReportLeakNoise,
    breathReportVoiceType,
    breathReportBreaks,
  ].forEach((el) => {
    if (el) {
      el.textContent = '--';
    }
  });
  if (breathReportFeedback) {
    breathReportFeedback.textContent = '--';
  }
}

function setBreathCalibrationStatus(text) {
  if (breathCalibrationValueEl) {
    breathCalibrationValueEl.textContent = text;
  }
  if (breathCalibrationHeroValue) {
    breathCalibrationHeroValue.textContent = text;
  }
}

function resetBreathCalibration() {
  breathCalibration = {
    calibrated: false,
    effort: 0,
    highFrequency: 0,
    leakNoise: 0,
    score: 0,
  };
  breathCalibrationInProgress = false;
  if (breathCalibrateButton) {
    breathCalibrateButton.disabled = false;
  }
  setBreathCalibrationStatus('未校准');
}

function estimateBreathFlow(rms) {
  if (!Number.isFinite(rms) || rms <= 0) {
    return 0;
  }
  const db = 20 * Math.log10(Math.max(rms, 1e-6));
  return clamp01((db - breathFlowMinDb) / (breathFlowMaxDb - breathFlowMinDb));
}

function dbToLinear(db) {
  return Math.pow(10, db / 10);
}

function averageBandPower(spectrum, sampleRate, fftSize, minHz, maxHz) {
  const binResolution = sampleRate / fftSize;
  const start = Math.max(0, Math.floor(minHz / binResolution));
  const end = Math.min(spectrum.length - 1, Math.ceil(maxHz / binResolution));
  let sum = 0;
  let count = 0;

  for (let i = start; i <= end; i += 1) {
    const db = spectrum[i];
    if (Number.isFinite(db)) {
      sum += dbToLinear(db);
      count += 1;
    }
  }

  return count > 0 ? sum / count : 0;
}

function sumBandPower(spectrum, sampleRate, fftSize, minHz, maxHz) {
  const binResolution = sampleRate / fftSize;
  const start = Math.max(0, Math.floor(minHz / binResolution));
  const end = Math.min(spectrum.length - 1, Math.ceil(maxHz / binResolution));
  let sum = 0;

  for (let i = start; i <= end; i += 1) {
    const db = spectrum[i];
    if (Number.isFinite(db)) {
      sum += dbToLinear(db);
    }
  }

  return sum;
}

function estimateHighFrequencyBreathFromSpectrum(analyserNode, spectrumBuffer, sampleRate) {
  if (!analyserNode || !spectrumBuffer || !sampleRate) {
    return 0;
  }

  analyserNode.getFloatFrequencyData(spectrumBuffer);

  const nyquist = sampleRate / 2;
  const lowPower = averageBandPower(
    spectrumBuffer,
    sampleRate,
    analyserNode.fftSize,
    200,
    1000
  );
  const totalPower = sumBandPower(
    spectrumBuffer,
    sampleRate,
    analyserNode.fftSize,
    breathTotalEnergyMinHz,
    nyquist
  );
  const highPower = sumBandPower(
    spectrumBuffer,
    sampleRate,
    analyserNode.fftSize,
    breathHighFrequencyMinHz,
    nyquist
  );

  const highRatio = highPower / (totalPower + 1e-12);
  const lowRatio = lowPower / (totalPower + 1e-12);
  const highNoiseScore = clamp01((highRatio - 0.12) / 0.58);
  const lowVoicePenalty = clamp01((lowRatio - 0.35) / 0.45);

  return clamp01(highNoiseScore * (1 - lowVoicePenalty));
}

function estimateLeakNoiseFromAutocorrelation(buffer, sampleRate, rms) {
  if (!buffer || !sampleRate || !Number.isFinite(rms) || rms < 1e-5) {
    return 0;
  }

  const size = buffer.length;
  const minLag = Math.max(1, Math.floor(sampleRate / hnrMaxFrequencyHz));
  const maxLag = Math.min(size - 2, Math.floor(sampleRate / hnrMinFrequencyHz));
  if (maxLag <= minLag) {
    return 0;
  }

  let energy = 0;
  for (let i = 0; i < size; i += 1) {
    energy += buffer[i] * buffer[i];
  }
  if (energy <= 1e-12) {
    return 0;
  }

  let bestCorrelation = 0;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    let lagEnergy = 0;
    for (let i = 0; i < size - lag; i += 1) {
      correlation += buffer[i] * buffer[i + lag];
      lagEnergy += buffer[i + lag] * buffer[i + lag];
    }
    const normalized = correlation / Math.sqrt(energy * Math.max(lagEnergy, 1e-12));
    if (normalized > bestCorrelation) {
      bestCorrelation = normalized;
    }
  }

  const periodicity = clamp01((bestCorrelation - 0.18) / 0.62);
  return clamp01(1 - periodicity);
}

function estimateBreathMetrics(buffer, rms, analyserNode, spectrumBuffer, sampleRate) {
  const effort = estimateBreathFlow(rms);
  const highFrequency = estimateHighFrequencyBreathFromSpectrum(
    analyserNode,
    spectrumBuffer,
    sampleRate
  );
  const leakNoise = estimateLeakNoiseFromAutocorrelation(buffer, sampleRate, rms);
  const adjustedEffort = breathCalibration.calibrated
    ? clamp01((effort - breathCalibration.effort) / Math.max(1 - breathCalibration.effort, 0.05))
    : effort;
  const adjustedHighFrequency = breathCalibration.calibrated
    ? clamp01(
        (highFrequency - breathCalibration.highFrequency) /
          Math.max(1 - breathCalibration.highFrequency, 0.05)
      )
    : highFrequency;
  const adjustedLeakNoise = breathCalibration.calibrated
    ? clamp01(
        (leakNoise - breathCalibration.leakNoise) /
          Math.max(1 - breathCalibration.leakNoise, 0.05)
      )
    : leakNoise;
  return {
    score: clamp01(
      0.12 * adjustedEffort + 0.48 * adjustedHighFrequency + 0.4 * adjustedLeakNoise
    ),
    effort: adjustedEffort,
    highFrequency: adjustedHighFrequency,
    leakNoise: adjustedLeakNoise,
  };
}

function classifyBreathVoice(metrics, pitch, confidence) {
  const { effort, highFrequency, leakNoise, score } = metrics;
  const voiced = Boolean(pitch) && confidence > 0.25;

  if (!voiced && score > 0.35) {
    return '吹气/气声';
  }
  if (voiced && leakNoise > 0.6 && highFrequency > 0.45) {
    return '漏气型发声';
  }
  if (voiced && effort > 0.65 && leakNoise < 0.35) {
    return '用力型发声';
  }
  if (voiced && leakNoise < 0.35 && highFrequency < 0.35) {
    return '闭合较好';
  }
  if (voiced) {
    return '混合型';
  }
  return '无有效发声';
}

async function calibrateBreathEnvironment() {
  if (breathCalibrationInProgress) {
    return;
  }

  if (displayMode !== 'breath') {
    showTrainingView('breath');
  }

  if (!audioContext || !analyser || !frequencyData) {
    await start();
  }

  if (!audioContext || !analyser || !frequencyData) {
    setBreathCalibrationStatus('校准失败');
    return;
  }

  breathCalibrationInProgress = true;
  breathCalibrateButton.disabled = true;
  setBreathCalibrationStatus('校准中...');
  setStatus('请保持安静，正在校准环境', 'active');

  const samples = [];
  const startedAt = performance.now();

  await new Promise((resolve) => {
    const collect = () => {
      analyser.getFloatTimeDomainData(dataArray);
      const rms = computeRms(dataArray);
      const effort = estimateBreathFlow(rms);
      const highFrequency = estimateHighFrequencyBreathFromSpectrum(
        analyser,
        frequencyData,
        audioContext.sampleRate
      );
      const leakNoise = estimateLeakNoiseFromAutocorrelation(
        dataArray,
        audioContext.sampleRate,
        rms
      );
      samples.push({ effort, highFrequency, leakNoise });

      if (performance.now() - startedAt >= breathCalibrationDurationMs) {
        resolve();
        return;
      }
      requestAnimationFrame(collect);
    };
    collect();
  });

  if (!samples.length) {
    breathCalibrationInProgress = false;
    breathCalibrateButton.disabled = false;
    setBreathCalibrationStatus('校准失败');
    return;
  }

  const meanEffort = samples.reduce((sum, sample) => sum + sample.effort, 0) / samples.length;
  const meanHighFrequency =
    samples.reduce((sum, sample) => sum + sample.highFrequency, 0) / samples.length;
  const meanLeakNoise =
    samples.reduce((sum, sample) => sum + sample.leakNoise, 0) / samples.length;
  const score = clamp01(0.12 * meanEffort + 0.48 * meanHighFrequency + 0.4 * meanLeakNoise);

  breathCalibration = {
    calibrated: true,
    effort: meanEffort,
    highFrequency: meanHighFrequency,
    leakNoise: meanLeakNoise,
    score,
  };
  breathCalibrationInProgress = false;
  breathCalibrateButton.disabled = false;
  setBreathCalibrationStatus(`已校准 ${Math.round(score * 100)}%`);
  setStatus('环境校准完成', 'active');
}

function computeBreathStability(scores) {
  const activeScores = scores.filter((score) => score >= breathActiveThreshold);
  if (activeScores.length < 4) {
    return null;
  }
  const mean = activeScores.reduce((sum, value) => sum + value, 0) / activeScores.length;
  const variance =
    activeScores.reduce((sum, value) => sum + (value - mean) ** 2, 0) / activeScores.length;
  const stdDev = Math.sqrt(variance);
  return Math.round(clamp01(1 - stdDev * 4) * 100);
}

function updateBreathDisplay(metrics, stability, now, voiceType) {
  const flowScore = metrics.score;
  breathCurrentFlow = flowScore;
  breathCurrentEffort = metrics.effort;
  breathCurrentHighFrequency = metrics.highFrequency;
  breathCurrentLeakNoise = metrics.leakNoise;
  breathCurrentStability = stability;

  if (flowScore >= breathActiveThreshold) {
    if (breathStartTime === null) {
      breathStartTime = now;
    }
    breathDurationSeconds = (now - breathStartTime) / 1000;
  } else {
    breathStartTime = null;
    breathDurationSeconds = 0;
  }

  if (breathFlowValueEl) {
    breathFlowValueEl.textContent = `${Math.round(flowScore * 100)}%`;
  }
  if (breathScoreHeroValue) {
    breathScoreHeroValue.textContent = `${Math.round(flowScore * 100)}%`;
  }
  if (breathEffortValueEl) {
    breathEffortValueEl.textContent = `${Math.round(metrics.effort * 100)}%`;
  }
  if (breathEffortHeroValue) {
    breathEffortHeroValue.textContent = `${Math.round(metrics.effort * 100)}%`;
  }
  if (breathNoiseValueEl) {
    breathNoiseValueEl.textContent = `${Math.round(metrics.highFrequency * 100)}%`;
  }
  if (breathNoiseHeroValue) {
    breathNoiseHeroValue.textContent = `${Math.round(metrics.highFrequency * 100)}%`;
  }
  if (breathLeakValueEl) {
    breathLeakValueEl.textContent = `${Math.round(metrics.leakNoise * 100)}%`;
  }
  if (breathLeakHeroValue) {
    breathLeakHeroValue.textContent = `${Math.round(metrics.leakNoise * 100)}%`;
  }
  if (breathVoiceTypeValueEl) {
    breathVoiceTypeValueEl.textContent = voiceType;
  }
  if (breathVoiceHeroValue) {
    breathVoiceHeroValue.textContent = voiceType;
  }
  if (breathStabilityValueEl) {
    const stabilityText = stability === null ? '--' : `${stability}%`;
    breathStabilityValueEl.textContent = `${stabilityText} / ${breathDurationSeconds.toFixed(1)}s`;
  }
  if (breathStabilityHeroValue) {
    breathStabilityHeroValue.textContent = stability === null ? '--%' : `${stability}%`;
  }
  if (breathDurationHeroValue) {
    breathDurationHeroValue.textContent = `${breathDurationSeconds.toFixed(1)}s`;
  }
}

function hasRecentBreathData() {
  const now = performance.now();
  const minTime = now - breathHistoryWindowSeconds * 1000;
  return breathHistory.some((point) => point.time >= minTime && point.flow >= breathActiveThreshold);
}

function averageMetric(points, key) {
  if (!points.length) {
    return 0;
  }
  return points.reduce((sum, point) => sum + (point[key] ?? 0), 0) / points.length;
}

function countBreathBreaks(points) {
  let breaks = 0;
  let wasActive = false;

  points.forEach((point) => {
    const isActive = point.flow >= breathActiveThreshold;
    if (!isActive && wasActive) {
      breaks += 1;
    }
    wasActive = isActive;
  });

  return breaks;
}

function getDominantVoiceType(points) {
  const counts = points.reduce((map, point) => {
    if (point.voiceType && point.voiceType !== '无有效发声') {
      map.set(point.voiceType, (map.get(point.voiceType) || 0) + 1);
    }
    return map;
  }, new Map());

  if (!counts.size) {
    return '无有效发声';
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function getBreathFeedback(summary) {
  if (summary.voiceType === '漏气型发声') {
    return '本次以漏气型发声为主，声带有振动但气声和噪声偏多。';
  }
  if (summary.voiceType === '用力型发声') {
    return '本次更像用力型发声，气流强但漏气噪声低，可以试着减少喉部用力。';
  }
  if (summary.voiceType === '闭合较好') {
    return '本次声带闭合相对集中，如果目标是练气声，可以再增加柔和的气流感。';
  }
  if (summary.durationSeconds < 2) {
    return '有效出气时间偏短，先尝试保持 5 秒以上的连续气流。';
  }
  if (summary.breaks >= 3) {
    return '中途断气较多，先降低强度，练习更连续的平稳出气。';
  }
  if (summary.stability !== null && summary.stability < 55) {
    return '气息波动较明显，可以用更小的气流做慢而均匀的练习。';
  }
  if (summary.highFrequency > 0.65 && summary.effort < 0.35) {
    return '高频气声明显但气流强度偏低，说明气息漏出感强，支撑还可以再增加。';
  }
  if (summary.effort > 0.7 && summary.highFrequency < 0.35) {
    return '气流强度高但高频气声低，可能更接近用力发声，试着减少声带参与。';
  }
  if (summary.leakNoise > 0.65 && summary.highFrequency > 0.5) {
    return '漏气噪声和高频气声都较高，本次更接近吹气/气声练习。';
  }
  return '本次出气比较平稳，可以继续延长持续时间或尝试渐强渐弱练习。';
}

function renderBreathReport() {
  if (!breathReport || !breathSessionHistory.length) {
    return;
  }

  const sessionPoints = breathSessionHistory.filter((point) => point.time >= sessionStartTime);
  const activePoints = sessionPoints.filter((point) => point.flow >= breathActiveThreshold);

  if (activePoints.length < 4) {
    clearBreathReport();
    setStatus('已停止，出气数据不足');
    return;
  }

  const activeStart = activePoints[0].time;
  const activeEnd = activePoints[activePoints.length - 1].time;
  const durationSeconds = Math.max(0, (activeEnd - activeStart) / 1000);
  const summary = {
    durationSeconds,
    score: averageMetric(activePoints, 'flow'),
    peak: Math.max(...activePoints.map((point) => point.flow)),
    effort: averageMetric(activePoints, 'effort'),
    highFrequency: averageMetric(activePoints, 'highFrequency'),
    leakNoise: averageMetric(activePoints, 'leakNoise'),
    stability: computeBreathStability(activePoints.map((point) => point.flow)),
    breaks: countBreathBreaks(sessionPoints),
    voiceType: getDominantVoiceType(activePoints),
  };

  breathReport.dataset.hasReport = 'true';
  breathReport.hidden = displayMode !== 'breath';
  breathReportSummary.textContent = `持续 ${summary.durationSeconds.toFixed(1)}s`;
  breathReportAverage.textContent = `${Math.round(summary.score * 100)}%`;
  breathReportPeak.textContent = `${Math.round(summary.peak * 100)}%`;
  breathReportEffort.textContent = `${Math.round(summary.effort * 100)}%`;
  breathReportHighFrequency.textContent = `${Math.round(summary.highFrequency * 100)}%`;
  breathReportLeakNoise.textContent = `${Math.round(summary.leakNoise * 100)}%`;
  breathReportVoiceType.textContent = summary.voiceType;
  breathReportBreaks.textContent = String(summary.breaks);
  breathReportFeedback.textContent = getBreathFeedback(summary);
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


function updateAdaptiveEnergyThreshold(rms) {
  if (!Number.isFinite(rms)) {
    return adaptiveEnergyThreshold;
  }

  // 关键修复：已经判定“有声稳定”时，不要让噪声底跟着人声往上抬
  const allowRise = !voicedStable; // voicedStable 是你全局状态变量
  const alphaRise = allowRise ? pitchNoiseFloorRiseAlpha : 0;

  const alpha = rms < adaptiveNoiseFloorRms ? pitchNoiseFloorFallAlpha : alphaRise;

  adaptiveNoiseFloorRms = (1 - alpha) * adaptiveNoiseFloorRms + alpha * rms;
  adaptiveEnergyThreshold = Math.max(
    pitchMinEnergyThreshold,
    adaptiveNoiseFloorRms * pitchAdaptiveEnergyMultiplier
  );
  return adaptiveEnergyThreshold;
}

function estimatePitchYinWithConfidence(buffer, sampleRate, rms) {
  const size = buffer.length;
  const minTau = Math.max(2, Math.floor(sampleRate / pitchMaxHz));
  const maxTau = Math.min(size - 2, Math.floor(sampleRate / pitchMinHz));
  if (maxTau <= minTau) {
    return { pitch: null, confidence: 0, rms };
  }

  const yinThreshold = 0.16;
  const difference = new Float32Array(maxTau + 1);
  const cmnd = new Float32Array(maxTau + 1);
  cmnd[0] = 1;

  for (let tau = 1; tau <= maxTau; tau += 1) {
    let sum = 0;
    for (let i = 0; i < size - tau; i += 1) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    difference[tau] = sum;
  }

  let runningSum = 0;
  for (let tau = 1; tau <= maxTau; tau += 1) {
    runningSum += difference[tau];
    cmnd[tau] = runningSum > 0 ? (difference[tau] * tau) / runningSum : 1;
  }

  let tauEstimate = -1;
  for (let tau = minTau; tau <= maxTau; tau += 1) {
    if (cmnd[tau] < yinThreshold) {
      while (tau + 1 <= maxTau && cmnd[tau + 1] < cmnd[tau]) {
        tau += 1;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) {
    let bestTau = minTau;
    let bestValue = cmnd[minTau];
    for (let tau = minTau + 1; tau <= maxTau; tau += 1) {
      if (cmnd[tau] < bestValue) {
        bestValue = cmnd[tau];
        bestTau = tau;
      }
    }
    if (bestValue >= 0.35) {
      return { pitch: null, confidence: 0, rms };
    }
    tauEstimate = bestTau;
  }

  const x0 = tauEstimate > 1 ? tauEstimate - 1 : tauEstimate;
  const x2 = tauEstimate + 1 <= maxTau ? tauEstimate + 1 : tauEstimate;
  const s0 = cmnd[x0];
  const s1 = cmnd[tauEstimate];
  const s2 = cmnd[x2];
  let betterTau = tauEstimate;
  const denom = 2 * (2 * s1 - s2 - s0);
  if (denom !== 0) {
    betterTau = tauEstimate + (s2 - s0) / denom;
  }

  const pitch = betterTau > 0 ? sampleRate / betterTau : null;
  const periodicity = Math.max(0, Math.min(1, 1 - cmnd[tauEstimate]));
  const energyScore = Math.min(1, rms / pitchEnergyRef);
  return { pitch, confidence: periodicity * energyScore, rms };
}

function detectPitchForAlgorithm(buffer, sampleRate, analyserNode = null, spectrumBuffer = null) {
  const rms = computeRms(buffer);
  const energyThreshold = updateAdaptiveEnergyThreshold(rms);
  if (rms < energyThreshold) {
    return { pitch: null, confidence: 0, rms, energyThreshold };
  }

  if (pitchAlgorithm === 'autocorr') {
    return autoCorrelateStandardWithConfidence(buffer, sampleRate, rms);
  }

  if (pitchAlgorithm === 'fft' && analyserNode && spectrumBuffer) {
    analyserNode.getFloatFrequencyData(spectrumBuffer);
    const { pitch, confidence } = estimatePitchFromSpectrum(
      spectrumBuffer,
      sampleRate,
      analyserNode.fftSize
    );
    const energyScore = Math.min(1, rms / pitchEnergyRef);
    return { pitch, confidence: confidence * energyScore, rms };
  }

  if (pitchAlgorithm === 'yin') {
    return estimatePitchYinWithConfidence(buffer, sampleRate, rms);
  }

  return autoCorrelateWithConfidence(buffer, sampleRate, rms);
}

function autoCorrelateWithConfidence(buffer, sampleRate, rms = computeRms(buffer)) {
  const size = buffer.length;

  let bestOffset = -1;
  let bestCorrelation = 0;
  const maxOffset = Math.floor(size / 2);

  for (let offset = 32; offset < maxOffset; offset += 1) {
    let correlation = 0;
    for (let i = 0; i < maxOffset; i += 1) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / maxOffset;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  const pitch = bestOffset !== -1 ? sampleRate / bestOffset : null;
  const energyScore = Math.min(1, rms / pitchEnergyRef);
  const confidence = Math.max(0, Math.min(1, bestCorrelation * energyScore));

  return { pitch, confidence, rms };
}

function autoCorrelateStandardWithConfidence(buffer, sampleRate, rms) {
  const size = buffer.length;
  const minLag = Math.floor(sampleRate / pitchMaxHz);
  const maxLag = Math.floor(sampleRate / pitchMinHz);
  let bestLag = -1;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < size - lag; i += 1) {
      const value = buffer[i];
      sum += value * buffer[i + lag];
      norm += value * value;
    }
    const correlation = norm > 0 ? sum / norm : 0;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  const pitch = bestLag !== -1 ? sampleRate / bestLag : null;
  const energyScore = Math.min(1, rms / pitchEnergyRef);
  const confidence = Math.max(0, Math.min(1, bestCorrelation * energyScore));

  return { pitch, confidence, rms };
}

function estimatePitchFromSpectrum(spectrum, sampleRate, fftSize) {
  const binResolution = sampleRate / fftSize;
  const minBin = Math.max(1, Math.floor(pitchMinHz / binResolution));
  const maxBin = Math.min(spectrum.length - 1, Math.ceil(pitchMaxHz / binResolution));
  const amplitudes = new Float32Array(spectrum.length);
  for (let i = minBin; i <= maxBin * 3 && i < spectrum.length; i += 1) {
    amplitudes[i] = Math.pow(10, spectrum[i] / 20);
  }

  let bestBin = -1;
  let bestValue = 0;
  let sum = 0;
  let count = 0;

  for (let bin = minBin; bin <= maxBin; bin += 1) {
    const amp1 = amplitudes[bin] || 0;
    const amp2 = amplitudes[bin * 2] || 0;
    const amp3 = amplitudes[bin * 3] || 0;
    const hpsValue = amp1 * amp2 * amp3;
    sum += hpsValue;
    count += 1;
    if (hpsValue > bestValue) {
      bestValue = hpsValue;
      bestBin = bin;
    }
  }

  if (bestBin === -1) {
    return { pitch: null, confidence: 0 };
  }

  const pitch = bestBin * binResolution;
  const mean = count > 0 ? sum / count : 0;
  const ratio = mean > 0 ? bestValue / mean : 0;
  const confidence = Math.max(0, Math.min(1, (ratio - 1) / 4));

  return { pitch, confidence };
}

function estimatePitchWithConfidence(buffer, sampleRate, analyserNode, spectrumBuffer) {
  return detectPitchForAlgorithm(buffer, sampleRate, analyserNode, spectrumBuffer);
}

function autoCorrelate(buffer, sampleRate) {
  const size = buffer.length;
  const rms = computeRms(buffer);
  if (rms < Math.max(pitchMinEnergyThreshold, adaptiveEnergyThreshold)) {
    return null;
  }

  let bestOffset = -1;
  let bestCorrelation = 0;
  const maxOffset = Math.floor(size / 2);

  for (let offset = 32; offset < maxOffset; offset += 1) {
    let correlation = 0;
    for (let i = 0; i < maxOffset; i += 1) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / maxOffset;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestCorrelation > 0.9 && bestOffset !== -1) {
    return sampleRate / bestOffset;
  }

  return null;
}

function drawAxes(minPitch = null, maxPitch = null, scaleMode = 'linear') {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#e5e9f3';
  ctx.lineWidth = 1;

  const horizontalLines = 5;
  const labelFont = '12px sans-serif';
  ctx.font = labelFont;
  ctx.fillStyle = '#94a3b8';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= horizontalLines; i += 1) {
    const y = (canvas.height / horizontalLines) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    if (minPitch !== null && maxPitch !== null) {
      const ratio = 1 - i / horizontalLines;
      const labelValue =
        scaleMode === 'log'
          ? Math.exp(Math.log(minPitch) + (Math.log(maxPitch) - Math.log(minPitch)) * ratio)
          : minPitch + (maxPitch - minPitch) * ratio;
      const label = `${Math.round(labelValue)} Hz`;
      ctx.fillText(label, 8, y);
    }
  }
}

function drawTargetPitchLine(targetPitch, minPitch, maxPitch, pitchRange, padding, logMin, logRange) {
  if (!Number.isFinite(targetPitch) || targetPitch <= 0) {
    return;
  }
  if (targetPitch < minPitch || targetPitch > maxPitch) {
    return;
  }

  const normalized =
    pitchScaleMode === 'log'
      ? (Math.log(targetPitch) - logMin) / logRange
      : (targetPitch - minPitch) / pitchRange;
  const y = canvas.height - padding - normalized * (canvas.height - padding * 2);

  ctx.save();
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(canvas.width, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#16a34a';
  ctx.font = '13px sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`目标 ${Math.round(targetPitch)} Hz`, 8, Math.max(y - 6, 14));
  ctx.restore();
}

function mapSongPitchTimeToCanvasTime(point, state) {
  if (state.useRecordingTimeline || offlineMode || sessionStartTime === 0) {
    return point.timeMs;
  }
  if (
    accompanimentAudio &&
    Number.isFinite(accompanimentAudio.currentTime) &&
    accompanimentAudio.currentTime > 0
  ) {
    return performance.now() - (accompanimentAudio.currentTime * 1000 - point.timeMs);
  }
  return sessionStartTime + point.timeMs;
}

function getVisibleSongPitchPoints(state) {
  if (!hasSongPitchTarget() || !state) {
    return [];
  }
  const maxTime = state.minTime + state.durationMs;
  return songPitchTrack
    .map((point) => ({
      ...point,
      time: mapSongPitchTimeToCanvasTime(point, state),
    }))
    .filter((point) => point.time >= state.minTime && point.time <= maxTime);
}

function drawSongPitchTrack(state) {
  const visibleTargets = getVisibleSongPitchPoints(state);
  if (visibleTargets.length < 2) {
    return;
  }

  const {
    minTime,
    durationMs,
    minPitch,
    maxPitch,
    pitchRange,
    padding,
    logMin,
    logRange,
  } = state;

  ctx.save();
  ctx.strokeStyle = songPitchRenderSoftColor;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  let hasSoftPath = false;

  visibleTargets.forEach((point) => {
    if (!point.pitch || point.pitch < minPitch || point.pitch > maxPitch) {
      if (hasSoftPath) {
        ctx.stroke();
        ctx.beginPath();
        hasSoftPath = false;
      }
      return;
    }
    const x = ((point.time - minTime) / durationMs) * canvas.width;
    const normalized =
      pitchScaleMode === 'log'
        ? (Math.log(point.pitch) - logMin) / logRange
        : (point.pitch - minPitch) / pitchRange;
    const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
    if (!hasSoftPath) {
      ctx.moveTo(x, y);
      hasSoftPath = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  if (hasSoftPath) {
    ctx.stroke();
  }

  ctx.strokeStyle = songPitchRenderColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  let hasPath = false;
  visibleTargets.forEach((point) => {
    if (!point.pitch || point.pitch < minPitch || point.pitch > maxPitch) {
      if (hasPath) {
        ctx.stroke();
        ctx.beginPath();
        hasPath = false;
      }
      return;
    }
    const x = ((point.time - minTime) / durationMs) * canvas.width;
    const normalized =
      pitchScaleMode === 'log'
        ? (Math.log(point.pitch) - logMin) / logRange
        : (point.pitch - minPitch) / pitchRange;
    const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
    if (!hasPath) {
      ctx.moveTo(x, y);
      hasPath = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  if (hasPath) {
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = songPitchRenderColor;
  ctx.font = '13px sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('歌曲目标', 8, 8);
  ctx.restore();
}

function getPitchPointCoordinates(point, state) {
  if (!point?.pitch || !state) {
    return null;
  }
  const { minTime, durationMs, minPitch, maxPitch, pitchRange, padding, logMin, logRange } = state;
  if (point.time < minTime || point.time > minTime + durationMs) {
    return null;
  }
  if (point.pitch < minPitch || point.pitch > maxPitch) {
    return null;
  }
  const x = ((point.time - minTime) / durationMs) * canvas.width;
  const normalized =
    pitchScaleMode === 'log'
      ? (Math.log(point.pitch) - logMin) / logRange
      : (point.pitch - minPitch) / pitchRange;
  const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
  return { x, y };
}

function drawSelectedPitchMarker(state) {
  if (!selectedPitchPoint?.pitch || !state) {
    return;
  }
  const coordinates = getPitchPointCoordinates(selectedPitchPoint, state);
  if (!coordinates) {
    return;
  }
  const { x, y } = coordinates;
  ctx.save();
  ctx.strokeStyle = '#7c3aed';
  ctx.fillStyle = '#7c3aed';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();

  const label = `${selectedPitchPoint.pitch.toFixed(1)} Hz`;
  ctx.font = '13px sans-serif';
  ctx.textBaseline = 'middle';
  const labelWidth = ctx.measureText(label).width + 16;
  const labelX = Math.min(Math.max(x + 8, 6), canvas.width - labelWidth - 6);
  const labelY = Math.min(Math.max(y - 18, 18), canvas.height - 18);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(labelX, labelY - 12, labelWidth, 24, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4c1d95';
  ctx.fillText(label, labelX + 8, labelY);
  ctx.restore();
}

function findNearestPitchPointByCanvasX(canvasX) {
  if (!pitchRenderState?.visibleHistory?.length) {
    return null;
  }
  const { visibleHistory, minTime, durationMs } = pitchRenderState;
  const targetTime = minTime + (canvasX / canvas.width) * durationMs;
  return visibleHistory.reduce((nearest, point) => {
    if (!point.pitch) {
      return nearest;
    }
    if (!nearest) {
      return point;
    }
    return Math.abs(point.time - targetTime) < Math.abs(nearest.time - targetTime)
      ? point
      : nearest;
  }, null);
}

function drawPitchHistory() {
  const recordingSyncedHistory = getRecordingSyncedPitchHistory();
  const useRecordingTimeline = !offlineMode && recordingSyncedHistory.length >= 2;
  const sourceHistory = useRecordingTimeline ? recordingSyncedHistory : pitchHistory;

  if (sourceHistory.length < 2) {
    pitchRenderState = null;
    if (pitchScaleMode === 'fixed') {
      drawAxes(pitchScaleFixedMinHz, pitchScaleFixedMaxHz);
      if (targetPitchEnabled) {
        const pitchRange = Math.max(pitchScaleFixedMaxHz - pitchScaleFixedMinHz, 1);
        const logMin = Math.log(pitchScaleFixedMinHz);
        const logRange = Math.max(Math.log(pitchScaleFixedMaxHz) - logMin, 0.0001);
        drawTargetPitchLine(
          targetPitchHz,
          pitchScaleFixedMinHz,
          pitchScaleFixedMaxHz,
          pitchRange,
          20,
          logMin,
          logRange
        );
      }
    } else if (pitchScaleMode === 'log') {
      drawAxes(pitchScaleLogMinHz, pitchScaleLogMaxHz, 'log');
      if (targetPitchEnabled) {
        const pitchRange = Math.max(pitchScaleLogMaxHz - pitchScaleLogMinHz, 1);
        const logMin = Math.log(pitchScaleLogMinHz);
        const logRange = Math.max(Math.log(pitchScaleLogMaxHz) - logMin, 0.0001);
        drawTargetPitchLine(
          targetPitchHz,
          pitchScaleLogMinHz,
          pitchScaleLogMaxHz,
          pitchRange,
          20,
          logMin,
          logRange
        );
      }
    } else {
      drawAxes();
    }
    return;
  }

  let visibleHistory = sourceHistory;
  let minTime = 0;
  let durationMs = 0;

  if (useRecordingTimeline) {
    minTime = 0;
    durationMs = getRecordingDurationMs();
  } else if (offlineMode) {
    minTime = sourceHistory[0].time;
    const maxTime = sourceHistory[sourceHistory.length - 1].time;
    durationMs = Math.max(maxTime - minTime, 1);
  } else {
    const now = performance.now();
    minTime = now - maxHistorySeconds * 1000;
    visibleHistory = sourceHistory.filter((point) => point.time >= minTime);
    pitchHistory = visibleHistory;
    durationMs = maxHistorySeconds * 1000;
  }

  const previewState = { minTime, durationMs, useRecordingTimeline };
  const visibleSongTargets = getVisibleSongPitchPoints(previewState);
  const pitches = [
    ...visibleHistory.map((point) => point.pitch).filter(Boolean),
    ...visibleSongTargets.map((point) => point.pitch).filter(Boolean),
  ];
  let minPitch = null;
  let maxPitch = null;

  if (pitchScaleMode === 'fixed') {
    minPitch = pitchScaleFixedMinHz;
    maxPitch = pitchScaleFixedMaxHz;
  } else if (pitchScaleMode === 'log') {
    minPitch = pitchScaleLogMinHz;
    maxPitch = pitchScaleLogMaxHz;
  } else {
    if (pitches.length === 0) {
      pitchRenderState = null;
      drawAxes();
      return;
    }
    minPitch = Math.min(...pitches);
    maxPitch = Math.max(...pitches);
  }

  const pitchRange = Math.max(maxPitch - minPitch, 1);
  const padding = 20;

  drawAxes(minPitch, maxPitch, pitchScaleMode === 'log' ? 'log' : 'linear');

  const logMin = Math.log(minPitch);
  const logRange = Math.max(Math.log(maxPitch) - logMin, 0.0001);
  pitchRenderState = {
    visibleHistory,
    minTime,
    durationMs,
    minPitch,
    maxPitch,
    pitchRange,
    padding,
    logMin,
    logRange,
    useRecordingTimeline,
  };

  if (hasSongPitchTarget()) {
    drawSongPitchTrack(pitchRenderState);
  } else if (targetPitchEnabled) {
    drawTargetPitchLine(targetPitchHz, minPitch, maxPitch, pitchRange, padding, logMin, logRange);
  }

  ctx.strokeStyle = '#0f766e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  let hasActivePath = false;

  visibleHistory.forEach((point) => {
    if (point.pitch === null) {
      if (hasActivePath) {
        ctx.stroke();
        ctx.beginPath();
        hasActivePath = false;
      }
      return;
    }
    if (!point.pitch) {
      return;
    }
    if (point.pitch < minPitch || point.pitch > maxPitch) {
      if (pitchScaleMode === 'fixed' || pitchScaleMode === 'log') {
        if (hasActivePath) {
          ctx.stroke();
          ctx.beginPath();
          hasActivePath = false;
        }
        return;
      }
    }
    const x = ((point.time - minTime) / durationMs) * canvas.width;
    const normalized =
      pitchScaleMode === 'log'
        ? (Math.log(point.pitch) - logMin) / logRange
        : (point.pitch - minPitch) / pitchRange;
    const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
    if (!hasActivePath) {
      ctx.moveTo(x, y);
      hasActivePath = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  if (hasActivePath) {
    ctx.stroke();
  }

  if (formantToggle.checked) {
    drawFormantHistory(minTime, durationMs, minPitch, maxPitch, pitchRange, padding);
  }

  drawSelectedPitchMarker(pitchRenderState);

  if (!offlineMode && currentPitch) {
    if (currentPitch < minPitch || currentPitch > maxPitch) {
      return;
    }
    const normalized =
      pitchScaleMode === 'log'
        ? (Math.log(currentPitch) - logMin) / logRange
        : (currentPitch - minPitch) / pitchRange;
    const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
    ctx.strokeStyle = '#ff7a59';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    ctx.fillStyle = '#ff7a59';
    ctx.font = '14px sans-serif';
    ctx.textBaseline = 'middle';
    const label = `${Math.round(currentPitch)} Hz`;
    ctx.fillText(label, 8, y);
  }
}

function drawVolumeAxes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = 20;
  const ticks = [0, -20, -40, -60];
  ctx.strokeStyle = '#eef1ed';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#9aa7bd';
  ctx.font = '12px sans-serif';
  ctx.textBaseline = 'middle';

  ticks.forEach((tick) => {
    const ratio = (tick - volumeMeterMinDb) / (volumeMeterMaxDb - volumeMeterMinDb);
    const y = canvas.height - padding - ratio * (canvas.height - padding * 2);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    ctx.fillText(`${tick} dB`, 8, y - 8);
  });
}

function drawVolumeHistory() {
  const recordingSyncedHistory = getRecordingSyncedVolumeHistory();
  const useRecordingTimeline = !offlineMode && recordingSyncedHistory.length >= 2;
  let visibleHistory = useRecordingTimeline ? recordingSyncedHistory : volumeHistory;

  volumeRenderState = null;
  drawVolumeAxes();

  if (visibleHistory.length < 2) {
    return;
  }

  let minTime = 0;
  let durationMs = 0;
  if (useRecordingTimeline) {
    minTime = 0;
    durationMs = getRecordingDurationMs();
  } else {
    const now = performance.now();
    minTime = now - maxHistorySeconds * 1000;
    visibleHistory = visibleHistory.filter((point) => point.time >= minTime);
    volumeHistory = visibleHistory;
    durationMs = maxHistorySeconds * 1000;
  }

  const padding = 20;
  volumeRenderState = {
    visibleHistory,
    minTime,
    durationMs,
    useRecordingTimeline,
  };

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3;
  ctx.beginPath();
  visibleHistory.forEach((point, index) => {
    const clamped = Math.max(volumeMeterMinDb, Math.min(volumeMeterMaxDb, point.db));
    const ratio = (clamped - volumeMeterMinDb) / (volumeMeterMaxDb - volumeMeterMinDb);
    const x = ((point.time - minTime) / durationMs) * canvas.width;
    const y = canvas.height - padding - ratio * (canvas.height - padding * 2);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

function drawBreathHistory() {
  const padding = 28;
  const plotHeight = canvas.height - padding * 2;
  const minTime = performance.now() - breathHistoryWindowSeconds * 1000;
  const durationMs = breathHistoryWindowSeconds * 1000;
  const toX = (time) => ((time - minTime) / durationMs) * canvas.width;
  const toY = (value) => canvas.height - padding - value * plotHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f6fbf9';
  ctx.fillRect(0, padding, canvas.width, plotHeight);

  const targetTop = toY(breathTargetMax);
  const targetBottom = toY(breathTargetMin);
  ctx.fillStyle = 'rgba(15, 118, 110, 0.10)';
  ctx.fillRect(0, targetTop, canvas.width, targetBottom - targetTop);
  ctx.fillStyle = '#0b5d56';
  ctx.font = '12px sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.fillText('目标区间', 8, Math.max(targetTop - 6, 14));

  const activeY = toY(breathActiveThreshold);
  ctx.fillStyle = 'rgba(183, 121, 31, 0.08)';
  ctx.fillRect(0, activeY, canvas.width, canvas.height - padding - activeY);

  ctx.strokeStyle = '#d9ded6';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i += 1) {
    const y = padding + (i / 4) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    ctx.fillStyle = '#697167';
    ctx.font = '12px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${100 - i * 25}%`, 8, y);
  }

  const visibleHistory = breathHistory.filter((point) => point.time >= minTime);
  breathHistory = visibleHistory;

  ctx.save();
  ctx.strokeStyle = '#b7791f';
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, activeY);
  ctx.lineTo(canvas.width, activeY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#8a5a16';
  ctx.textBaseline = 'bottom';
  ctx.fillText('有效线', 8, Math.max(activeY - 6, 14));
  ctx.restore();

  if (visibleHistory.length < 2) {
    ctx.fillStyle = '#697167';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('开始检测后，对准麦克风平稳吹气', canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'left';
    return;
  }

  ctx.beginPath();
  visibleHistory.forEach((point, index) => {
    const x = toX(point.time);
    const y = toY(point.flow);
    if (index === 0) {
      ctx.moveTo(x, canvas.height - padding);
      ctx.lineTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  const lastPoint = visibleHistory[visibleHistory.length - 1];
  ctx.lineTo(toX(lastPoint.time), canvas.height - padding);
  ctx.closePath();
  ctx.fillStyle = 'rgba(15, 118, 110, 0.16)';
  ctx.fill();

  ctx.strokeStyle = '#0f766e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  visibleHistory.forEach((point, index) => {
    const x = toX(point.time);
    const y = toY(point.flow);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = '#b42318';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 5]);
  for (let i = 1; i < visibleHistory.length; i += 1) {
    const prev = visibleHistory[i - 1];
    const point = visibleHistory[i];
    if (prev.flow >= breathActiveThreshold && point.flow < breathActiveThreshold) {
      const x = toX(point.time);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
    }
  }
  ctx.restore();

  if (breathCurrentFlow !== null) {
    const y = toY(breathCurrentFlow);
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.arc(canvas.width - 10, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
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

function resetSpectrogram() {
  ctx.fillStyle = '#070909';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  spectrogramScrollX = 0;
  drawSpectrogramStaticFrame();
  spectrogramOverlayState = { pitch: null, f1: null, f2: null };
}

function captureSpectrogramSnapshot() {
  if (displayMode !== 'spectrogram' || !canvas.width || !canvas.height) {
    return null;
  }
  try {
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (_error) {
    return null;
  }
}

function restoreSpectrogramSnapshot(snapshot) {
  if (!snapshot || displayMode !== 'spectrogram') {
    return;
  }
  ctx.putImageData(snapshot, 0, 0);
}

function getSpectrogramLayout() {
  const scale = Math.max(0.7, canvas.width / spectrogramCanvasWidth);
  const pianoWidth = Math.round(spectrogramPianoWidth * scale);
  const axisWidth = Math.round(spectrogramAxisWidth * scale);
  const profileWidth = Math.round(spectrogramProfileWidth * scale);
  const waveformHeight = Math.round(spectrogramWaveformHeight * scale);
  const timeAxisHeight = Math.round(spectrogramTimeAxisHeight * scale);
  const top = Math.round(8 * scale);
  const bottom = canvas.height - waveformHeight - timeAxisHeight;
  const specLeft = pianoWidth + axisWidth;
  const specRight = canvas.width - profileWidth;
  const specWidth = Math.max(120, specRight - specLeft);
  const specHeight = Math.max(120, bottom - top);
  return {
    scale,
    pianoWidth,
    axisWidth,
    profileWidth,
    waveformHeight,
    timeAxisHeight,
    top,
    specLeft,
    specRight,
    specWidth,
    specHeight,
    bottom,
    waveTop: bottom + timeAxisHeight,
    waveBottom: canvas.height - Math.round(8 * scale),
    profileLeft: specRight,
    profileRight: canvas.width,
  };
}

function spectrogramFreqToY(freq, layout = getSpectrogramLayout()) {
  const minLog = Math.log2(spectrogramDisplayMinHz);
  const maxLog = Math.log2(spectrogramDisplayMaxHz);
  const ratio = (Math.log2(Math.max(spectrogramDisplayMinHz, freq)) - minLog) / (maxLog - minLog);
  return layout.bottom - Math.max(0, Math.min(1, ratio)) * layout.specHeight;
}

function drawSpectrogramStaticFrame() {
  const layout = getSpectrogramLayout();
  ctx.save();
  ctx.fillStyle = '#080a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111312';
  ctx.fillRect(layout.specLeft, layout.top, layout.specWidth, layout.specHeight);
  ctx.fillStyle = '#0a0b0b';
  ctx.fillRect(layout.profileLeft, layout.top, layout.profileWidth, layout.specHeight);
  ctx.fillStyle = '#101111';
  ctx.fillRect(layout.specLeft, layout.waveTop, layout.specWidth, layout.waveBottom - layout.waveTop);
  drawSpectrogramPiano(layout);
  drawSpectrogramFrequencyLabels(layout);
  drawSpectrogramTimeAxis(layout);
  drawSpectrogramProfileGrid(layout);
  ctx.restore();
}

function drawSpectrogramPiano(layout) {
  const whiteNotes = new Set([0, 2, 4, 5, 7, 9, 11]);
  for (let midi = 36; midi <= 107; midi += 1) {
    const freq = 440 * 2 ** ((midi - 69) / 12);
    const nextFreq = 440 * 2 ** ((midi + 1 - 69) / 12);
    const y1 = spectrogramFreqToY(nextFreq, layout);
    const y2 = spectrogramFreqToY(freq, layout);
    const h = Math.max(1, y2 - y1);
    const note = midi % 12;
    if (whiteNotes.has(note)) {
      ctx.fillStyle = '#f5f3ea';
      ctx.fillRect(0, y1, layout.pianoWidth, h);
      ctx.strokeStyle = '#9a9b94';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, y1, layout.pianoWidth, h);
    } else {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, y1, layout.pianoWidth * 0.68, h);
    }
    if (note === 0 && h > 3) {
      ctx.fillStyle = '#1b1f22';
      ctx.font = `${Math.max(9, Math.round(10 * layout.scale))}px Segoe UI, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(frequencyToNote(freq), layout.pianoWidth - 4, (y1 + y2) / 2);
    }
  }
}

function drawSpectrogramFrequencyLabels(layout) {
  const labeled = [70, 90, 100, 200, 300, 400, 500, 600, 800, 1000, 2000, 3000, 4000];
  ctx.font = `${Math.max(10, Math.round(11 * layout.scale))}px Segoe UI, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  labeled.forEach((freq) => {
    const y = spectrogramFreqToY(freq, layout);
    const major = freq === 100 || freq === 200 || freq === 500 || freq === 1000 || freq === 2000 || freq === 3000;
    ctx.strokeStyle = major ? 'rgba(202, 218, 200, 0.28)' : 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(layout.specLeft - 4, y);
    ctx.lineTo(layout.specLeft, y);
    ctx.stroke();
    ctx.fillStyle = '#cbd5d1';
    ctx.fillText(String(freq), layout.specLeft - 6, y);
  });

  ctx.fillStyle = '#cbd5d1';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('频率 (Hz)', layout.pianoWidth + 4, layout.top + 3);
}

function drawSpectrogramGuideLines(layout) {
  ctx.save();
  ctx.strokeStyle = 'rgba(210, 224, 218, 0.12)';
  ctx.lineWidth = 1;
  const labeled = [100, 200, 500, 800, 1000, 2000, 3000, 4000];
  labeled.forEach((freq) => {
    const y = spectrogramFreqToY(freq, layout);
    ctx.beginPath();
    ctx.moveTo(layout.specLeft, y);
    ctx.lineTo(layout.specRight, y);
    ctx.stroke();
  });
  ctx.strokeStyle = 'rgba(210, 224, 218, 0.06)';
  for (let x = layout.specLeft; x <= layout.specRight; x += Math.max(72, 84 * layout.scale)) {
    ctx.beginPath();
    ctx.moveTo(x, layout.top);
    ctx.lineTo(x, layout.bottom);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpectrogramTimeAxis(layout) {
  const y = layout.bottom + 1;
  ctx.fillStyle = '#1e2020';
  ctx.fillRect(layout.specLeft, y, layout.specWidth, layout.timeAxisHeight - 1);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(layout.specLeft, y);
  ctx.lineTo(layout.specRight, y);
  ctx.stroke();
  ctx.fillStyle = '#bfc8c3';
  ctx.font = `${Math.max(10, Math.round(11 * layout.scale))}px Segoe UI, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const secondsPerScreen = maxHistorySeconds;
  for (let i = 0; i <= 6; i += 1) {
    const x = layout.specLeft + (i / 6) * layout.specWidth;
    const label = `${Math.max(0, secondsPerScreen - (6 - i) * (secondsPerScreen / 6)).toFixed(0)}s`;
    ctx.fillText(label, x + 10, y + layout.timeAxisHeight / 2);
  }
  ctx.textAlign = 'right';
  ctx.fillText('时间', layout.specRight - 4, y + layout.timeAxisHeight / 2);
}

function drawSpectrogramProfileGrid(layout) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  for (let i = 0; i <= 4; i += 1) {
    const x = layout.profileLeft + (i / 4) * layout.profileWidth;
    ctx.beginPath();
    ctx.moveTo(x, layout.top);
    ctx.lineTo(x, layout.bottom);
    ctx.stroke();
  }
  ctx.fillStyle = '#cbd5d1';
  ctx.font = `${Math.max(10, Math.round(11 * layout.scale))}px Segoe UI, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('强度 (dB)', layout.profileRight - 6, layout.bottom - 4);
}

function drawSpectrogramFrame() {
  if (!analyser || !frequencyData) {
    return;
  }
  analyser.getFloatFrequencyData(frequencyData);
  const layout = getSpectrogramLayout();
  ctx.drawImage(
    canvas,
    layout.specLeft + 1,
    layout.top,
    layout.specWidth - 1,
    layout.specHeight,
    layout.specLeft,
    layout.top,
    layout.specWidth - 1,
    layout.specHeight
  );
  ctx.fillStyle = '#080b0d';
  ctx.fillRect(layout.specRight - 1, layout.top, 1, layout.specHeight);

  const binHz = (audioContext.sampleRate / 2) / frequencyData.length;
  const rowDb = new Float32Array(Math.ceil(layout.specHeight) + 2);
  rowDb.fill(-140);
  const visibleDbValues = [];
  for (let i = 1; i < frequencyData.length; i += 1) {
    const freq = i * binHz;
    if (freq >= spectrogramDisplayMinHz && freq <= spectrogramDisplayMaxHz && Number.isFinite(frequencyData[i])) {
      visibleDbValues.push(frequencyData[i]);
    }
  }
  const sortedDbValues = visibleDbValues.sort((a, b) => a - b);
  const noiseFloorDb = sortedDbValues.length
    ? sortedDbValues[Math.floor(sortedDbValues.length * 0.42)]
    : spectrogramMinDb;
  const framePeakDb = sortedDbValues.length ? sortedDbValues[sortedDbValues.length - 1] : spectrogramMinDb;
  const frameRangeDb = Math.max(framePeakDb - noiseFloorDb, 1);
  const adaptiveFloorDb = Math.max(
    spectrogramMinDb + 10,
    noiseFloorDb + Math.min(12, frameRangeDb * 0.34)
  );
  for (let i = 1; i < frequencyData.length; i += 1) {
    const freq = i * binHz;
    if (freq < spectrogramDisplayMinHz || freq > spectrogramDisplayMaxHz) {
      continue;
    }
    const value = frequencyData[i];
    const row = Math.round(spectrogramFreqToY(freq, layout) - layout.top);
    if (row >= 0 && row < rowDb.length) {
      rowDb[row] = Math.max(rowDb[row], value);
    }
  }
  for (let row = 0; row < rowDb.length; row += 1) {
    const value = rowDb[row];
    if (value <= adaptiveFloorDb) {
      continue;
    }
    const localValues = [];
    const localRadius = 10;
    for (let offset = -localRadius; offset <= localRadius; offset += 1) {
      if (Math.abs(offset) <= 2) {
        continue;
      }
      const neighbor = rowDb[row + offset];
      if (Number.isFinite(neighbor) && neighbor > -130) {
        localValues.push(neighbor);
      }
    }
    localValues.sort((a, b) => a - b);
    const localFloorDb = localValues.length
      ? localValues[Math.floor(localValues.length * 0.35)]
      : noiseFloorDb;
    const localLift = value - localFloorDb;
    const floorLift = value - adaptiveFloorDb;
    if (localLift < 3.5 || floorLift < 1.5) {
      continue;
    }
    const peakContrast = Math.max(0, Math.min(1, (localLift - 3.5) / 20));
    const floorContrast = Math.max(0, Math.min(1, floorLift / Math.max(framePeakDb - adaptiveFloorDb, 1)));
    const intensity = Math.max(0, Math.min(1, peakContrast * 0.72 + floorContrast * 0.28));
    if (intensity <= 0.045) {
      continue;
    }
    ctx.fillStyle = spectrogramColor(intensity);
    ctx.fillRect(layout.specRight - 1, layout.top + row, 1, 1);
  }

  drawSpectrogramStaticOverlays(layout);
  drawSpectrogramProfile(layout);
  drawSpectrogramEnergyHistory(layout);
  drawSpectrogramOverlay();
}

function spectrogramColor(intensity) {
  const shaped = Math.max(0, Math.min(1, intensity)) ** 1.35;
  const stops = [
    [0, 2, 4, 10],
    [0.14, 0, 22, 85],
    [0.36, 0, 125, 190],
    [0.62, 92, 205, 142],
    [0.84, 242, 184, 58],
    [1, 205, 38, 48],
  ];
  for (let i = 1; i < stops.length; i += 1) {
    if (shaped <= stops[i][0]) {
      const prev = stops[i - 1];
      const next = stops[i];
      const ratio = (shaped - prev[0]) / Math.max(next[0] - prev[0], 1e-9);
      const r = Math.round(prev[1] + (next[1] - prev[1]) * ratio);
      const g = Math.round(prev[2] + (next[2] - prev[2]) * ratio);
      const b = Math.round(prev[3] + (next[3] - prev[3]) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return 'rgb(185, 24, 42)';
}

function drawSpectrogramStaticOverlays(layout) {
  ctx.save();
  ctx.clearRect(0, 0, layout.specLeft, canvas.height);
  ctx.clearRect(layout.profileLeft, 0, layout.profileWidth, layout.waveTop);
  ctx.clearRect(layout.specLeft, layout.bottom, layout.specWidth, layout.timeAxisHeight);
  drawSpectrogramPiano(layout);
  drawSpectrogramFrequencyLabels(layout);
  drawSpectrogramTimeAxis(layout);
  ctx.restore();
}

function drawSpectrogramProfile(layout) {
  ctx.save();
  ctx.fillStyle = '#080909';
  ctx.fillRect(layout.profileLeft, layout.top, layout.profileWidth, layout.specHeight);
  drawSpectrogramProfileGrid(layout);
  ctx.beginPath();
  ctx.moveTo(layout.profileLeft, layout.bottom);
  const binHz = (audioContext.sampleRate / 2) / frequencyData.length;
  for (let i = 1; i < frequencyData.length; i += 1) {
    const freq = i * binHz;
    if (freq < spectrogramDisplayMinHz || freq > spectrogramDisplayMaxHz) {
      continue;
    }
    const db = Math.max(spectrogramMinDb, Math.min(spectrogramMaxDb, frequencyData[i]));
    const ratio = (db - spectrogramMinDb) / (spectrogramMaxDb - spectrogramMinDb);
    const x = layout.profileLeft + ratio * (layout.profileWidth - 14);
    const y = spectrogramFreqToY(freq, layout);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(layout.profileLeft, layout.top);
  ctx.closePath();
  ctx.fillStyle = '#0b64f4';
  ctx.fill();
  ctx.strokeStyle = '#8ea2ff';
  ctx.lineWidth = 1;
  ctx.stroke();
  const peakDb = Math.max(...Array.from(frequencyData).filter(Number.isFinite));
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.max(12, Math.round(15 * layout.scale))}px Segoe UI, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${peakDb.toFixed(1)} dB`, layout.profileLeft + 8, layout.bottom - 8);
  ctx.restore();
}

function drawSpectrogramEnergyHistory(layout) {
  ctx.save();
  ctx.fillStyle = '#151717';
  ctx.fillRect(layout.specLeft, layout.waveTop, layout.specWidth, layout.waveBottom - layout.waveTop);
  const now = performance.now();
  const minTime = now - maxHistorySeconds * 1000;
  const visible = volumeHistory.filter((point) => point.time >= minTime);
  if (visible.length) {
    ctx.beginPath();
    ctx.moveTo(layout.specLeft, layout.waveBottom);
    visible.forEach((point) => {
      const x = layout.specLeft + ((point.time - minTime) / (maxHistorySeconds * 1000)) * layout.specWidth;
      const ratio = Math.max(0, Math.min(1, (point.db - volumeMeterMinDb) / (volumeMeterMaxDb - volumeMeterMinDb)));
      const y = layout.waveBottom - ratio * (layout.waveBottom - layout.waveTop - 8);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(layout.specRight, layout.waveBottom);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, layout.waveTop, 0, layout.waveBottom);
    gradient.addColorStop(0, '#ffd15a');
    gradient.addColorStop(0.45, '#ff8837');
    gradient.addColorStop(1, '#ff3b2d');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#ffd36d';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.beginPath();
  const midY = layout.waveTop + (layout.waveBottom - layout.waveTop) * 0.55;
  ctx.moveTo(layout.specLeft, midY);
  ctx.lineTo(layout.specRight, midY);
  ctx.stroke();
  ctx.restore();
}

function drawSpectrogramOverlay() {
  if (spectrogramOverlayMode === 'none') {
    spectrogramOverlayState = { pitch: null, f1: null, f2: null };
    return;
  }
  if (!audioContext) {
    return;
  }
  const nyquist = audioContext.sampleRate / 2;
  const layout = getSpectrogramLayout();

  const drawOverlayPoint = (key, freq, color) => {
    if (!freq || freq <= 0 || freq > nyquist) {
      spectrogramOverlayState[key] = null;
      return;
    }
    const y = spectrogramFreqToY(freq, layout);
    const prevY = spectrogramOverlayState[key];
    ctx.strokeStyle = color;
    ctx.lineWidth = spectrogramOverlayLineWidth;
    ctx.beginPath();
    if (prevY === null || prevY === undefined) {
      ctx.moveTo(layout.specRight - 1, y);
      ctx.lineTo(layout.specRight - 1, y);
    } else {
      ctx.moveTo(layout.specRight - 2, prevY);
      ctx.lineTo(layout.specRight - 1, y);
    }
    ctx.stroke();
    spectrogramOverlayState[key] = y;
  };

  if (spectrogramOverlayMode === 'pitch' || spectrogramOverlayMode === 'both') {
    drawOverlayPoint('pitch', currentPitch, spectrogramOverlayColors.pitch);
  }

  if (spectrogramOverlayMode === 'formants' || spectrogramOverlayMode === 'both') {
    if (formantToggle.checked) {
      drawOverlayPoint('f1', stableFormants.f1, spectrogramOverlayColors.f1);
      drawOverlayPoint('f2', stableFormants.f2, spectrogramOverlayColors.f2);
    } else {
      spectrogramOverlayState.f1 = null;
      spectrogramOverlayState.f2 = null;
    }
  }
}

function drawFormantHistory(minTime, durationMs, minPitch, maxPitch, pitchRange, padding) {
  const sourceHistory = offlineMode ? offlineFormantHistory : formantCurveHistory;
  const now = performance.now();
  const minVisibleTime = offlineMode ? minTime : now - maxHistorySeconds * 1000;
  const visibleHistory = sourceHistory.filter((point) => point.time >= minVisibleTime);
  const logMin = Math.log(minPitch);
  const logRange = Math.max(Math.log(maxPitch) - logMin, 0.0001);

  const drawCurve = (key, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let hasActivePath = false;
    visibleHistory.forEach((point) => {
      const value = point[key];
      if (!value) {
        if (hasActivePath) {
          ctx.stroke();
          ctx.beginPath();
          hasActivePath = false;
        }
        return;
      }
      if (value < minPitch || value > maxPitch) {
        if (pitchScaleMode === 'fixed' || pitchScaleMode === 'log') {
          if (hasActivePath) {
            ctx.stroke();
            ctx.beginPath();
            hasActivePath = false;
          }
          return;
        }
      }
      const x = ((point.time - minTime) / durationMs) * canvas.width;
      const normalized =
        pitchScaleMode === 'log'
          ? (Math.log(value) - logMin) / logRange
          : (value - minPitch) / pitchRange;
      const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
      if (!hasActivePath) {
        ctx.moveTo(x, y);
        hasActivePath = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    if (hasActivePath) {
      ctx.stroke();
    }
  };

  drawCurve('f1', '#22c55e');
  drawCurve('f2', '#f97316');
}

function drawFormantAxes(minFrequency = formantValidRanges.f1.min, maxFrequency = formantValidRanges.f2.max) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = 20;
  const ticks = [300, 700, 1200, 2000, 3000].filter(
    (tick) => tick >= minFrequency && tick <= maxFrequency
  );
  ctx.strokeStyle = '#eef1ed';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.textBaseline = 'middle';

  ticks.forEach((tick) => {
    const ratio =
      (Math.log(tick) - Math.log(minFrequency)) /
      Math.max(Math.log(maxFrequency) - Math.log(minFrequency), 0.0001);
    const y = canvas.height - padding - ratio * (canvas.height - padding * 2);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    ctx.fillText(`${tick} Hz`, 8, y);
  });
}

function drawFormantCurveHistory() {
  const sourceHistory = offlineMode ? offlineFormantHistory : formantCurveHistory;
  drawFormantAxes();

  if (sourceHistory.length < 2) {
    return;
  }

  let visibleHistory = sourceHistory;
  let minTime = 0;
  let durationMs = 0;

  if (offlineMode) {
    minTime = sourceHistory[0].time;
    const maxTime = sourceHistory[sourceHistory.length - 1].time;
    durationMs = Math.max(maxTime - minTime, 1);
  } else {
    const now = performance.now();
    minTime = now - maxHistorySeconds * 1000;
    visibleHistory = sourceHistory.filter((point) => point.time >= minTime);
    formantCurveHistory = visibleHistory;
    durationMs = maxHistorySeconds * 1000;
  }

  const padding = 20;
  const minFrequency = formantValidRanges.f1.min;
  const maxFrequency = formantValidRanges.f2.max;
  const logMin = Math.log(minFrequency);
  const logRange = Math.max(Math.log(maxFrequency) - logMin, 0.0001);

  const drawCurve = (key, color, label) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    let hasActivePath = false;
    visibleHistory.forEach((point) => {
      const value = point[key];
      if (!value || value < minFrequency || value > maxFrequency) {
        if (hasActivePath) {
          ctx.stroke();
          ctx.beginPath();
          hasActivePath = false;
        }
        return;
      }
      const x = ((point.time - minTime) / durationMs) * canvas.width;
      const normalized = (Math.log(value) - logMin) / logRange;
      const y = canvas.height - padding - normalized * (canvas.height - padding * 2);
      if (!hasActivePath) {
        ctx.moveTo(x, y);
        hasActivePath = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    if (hasActivePath) {
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.font = '13px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(label, key === 'f1' ? 8 : 48, 8);
    ctx.restore();
  };

  drawCurve('f1', '#22c55e', 'F1');
  drawCurve('f2', '#f97316', 'F2');
}

function setFormantDisplay(f1, f2) {
  formantF1El.textContent = f1 ? `${Math.round(f1)} Hz` : '— Hz';
  formantF2El.textContent = f2 ? `${Math.round(f2)} Hz` : '— Hz';
}

function setFormantStatus(message) {
  formantStatusEl.textContent = message || '';
}

function resetFormants() {
  smoothedFormants = { f1: null, f2: null };
  stableFormants = { f1: null, f2: null };
  formantHistory = { f1: [], f2: [] };
  formantCurveHistory = [];
  resetFormantVoiceGate();
  setFormantDisplay(null, null);
  setFormantStatus('');
}

function smoothFormantValue(previous, next, alpha) {
  if (next === null || next === undefined) {
    return previous;
  }
  if (previous === null || previous === undefined) {
    return next;
  }
  return previous + alpha * (next - previous);
}

function pushFormantSample(buffer, value) {
  const nextBuffer = [...buffer, value].slice(-formantWindowSize);
  return nextBuffer;
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

function estimateFormantsFromSpectrum(spectrum, sampleRate, fftSize) {
  const binCount = spectrum.length;
  const binResolution = sampleRate / fftSize;
  const windowBins = Math.max(1, Math.round(formantSmoothingHz / binResolution));
  const smoothed = new Float32Array(binCount);

  let windowSum = 0;
  for (let i = 0; i < binCount; i += 1) {
    windowSum += spectrum[i];
    if (i >= windowBins) {
      windowSum -= spectrum[i - windowBins];
    }
    const denom = Math.min(i + 1, windowBins);
    smoothed[i] = windowSum / denom;
  }

  const findPeak = (minHz, maxHz, minimumHz) => {
    const startBin = Math.max(0, Math.floor(minHz / binResolution));
    const endBin = Math.min(binCount - 1, Math.ceil(maxHz / binResolution));
    let bestBin = -1;
    let bestValue = -Infinity;
    for (let i = startBin; i <= endBin; i += 1) {
      const freq = i * binResolution;
      if (minimumHz && freq < minimumHz) {
        continue;
      }
      const value = smoothed[i];
      if (value > bestValue) {
        bestValue = value;
        bestBin = i;
      }
    }
    if (bestBin === -1) {
      return null;
    }
    return bestBin * binResolution;
  };

  const f1 = findPeak(formantValidRanges.f1.min, formantValidRanges.f1.max);
  const f2 = findPeak(
    formantValidRanges.f2.min,
    formantValidRanges.f2.max,
    f1 ? f1 + formantValidRanges.minSeparation : null
  );

  return { f1, f2 };
}

function estimateFormants() {
  if (!analyser || !frequencyData) {
    return { f1: null, f2: null };
  }

  analyser.getFloatFrequencyData(frequencyData);
  return estimateFormantsFromSpectrum(
    frequencyData,
    audioContext.sampleRate,
    analyser.fftSize
  );
}

function isValidFormantPair(f1, f2) {
  if (!f1 || !f2) {
    return false;
  }
  if (f1 < formantValidRanges.f1.min || f1 > formantValidRanges.f1.max) {
    return false;
  }
  if (f2 < formantValidRanges.f2.min || f2 > formantValidRanges.f2.max) {
    return false;
  }
  if (f2 <= f1 + formantValidRanges.minSeparation) {
    return false;
  }
  return true;
}

function resetFormantVoiceGate(gate = formantVoiceGate) {
  gate.frames = 0;
  gate.lastPitch = null;
}

function isReliableFormantVoice(pitchResult, rms, gate = formantVoiceGate) {
  const pitch = pitchResult?.pitch;
  const hasEnoughEnergy =
    rms >=
    Math.max(
      formantVoiceMinRms,
      pitchMinEnergyThreshold * formantVoiceEnergyMultiplier,
      adaptiveEnergyThreshold * formantVoiceEnergyMultiplier
    );
  const hasReliablePitch =
    pitch &&
    pitch >= hnrMinFrequencyHz &&
    pitch <= hnrMaxFrequencyHz &&
    pitchResult.confidence >= formantVoiceConfidenceThreshold;
  const pitchIsStable =
    !gate.lastPitch ||
    getPitchDistanceCents(pitch, gate.lastPitch) <= formantVoiceMaxPitchJumpCents;

  if (!hasEnoughEnergy || !hasReliablePitch || !pitchIsStable) {
    resetFormantVoiceGate(gate);
    return false;
  }

  gate.frames += 1;
  gate.lastPitch = pitch;
  return gate.frames >= formantVoiceRequiredFrames;
}

function stabilizeFormants(rawF1, rawF2, now) {
  if (!isValidFormantPair(rawF1, rawF2)) {
    setFormantStatus('信号不稳定/无声');
    return stableFormants;
  }

  setFormantStatus('');
  formantHistory = {
    f1: pushFormantSample(formantHistory.f1, rawF1),
    f2: pushFormantSample(formantHistory.f2, rawF2),
  };
  const medianF1 = median(formantHistory.f1);
  const medianF2 = median(formantHistory.f2);
  const limitedF1 = limitJump(smoothedFormants.f1, medianF1, formantMaxJumpHz.f1);
  const limitedF2 = limitJump(smoothedFormants.f2, medianF2, formantMaxJumpHz.f2);

  const dt = Math.max(now - lastFormantTimestamp, formantUpdateIntervalMs);
  const alpha = 1 - Math.exp(-dt / formantTauMs);
  smoothedFormants = {
    f1: smoothFormantValue(smoothedFormants.f1, limitedF1, alpha),
    f2: smoothFormantValue(smoothedFormants.f2, limitedF2, alpha),
  };
  stableFormants = { ...smoothedFormants };
  return stableFormants;
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

function appendFormantBreak(history, time) {
  if (!history.length || history[history.length - 1].f1 !== null || history[history.length - 1].f2 !== null) {
    history.push({ time, f1: null, f2: null });
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

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '_',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setOfflineMode(enabled) {
  offlineMode = enabled;
  clearFileButton.disabled = !offlineMode;
  audioFileInput.disabled = offlineMode && offlineAnalysisInProgress;
  startButton.disabled = offlineMode || offlineAnalysisInProgress;
  stopButton.disabled = offlineMode || offlineAnalysisInProgress;
  recordButton.disabled = offlineMode || offlineAnalysisInProgress;
  stopRecordButton.disabled = offlineMode || offlineAnalysisInProgress;
  pitchAlgorithmSelect.disabled = offlineAnalysisInProgress;
  displayModeSelect.disabled = offlineAnalysisInProgress;
  canvasScaleRange.disabled = offlineAnalysisInProgress;
  if (offlineMode && (displayMode === 'spectrogram' || displayMode === 'breath')) {
    displayMode = 'pitch';
    displayModeSelect.value = 'pitch';
    setReadoutMode('pitch');
    setTrainingCopy('pitch');
    drawPitchHistory();
  }
  setDataSourceLabel(offlineMode ? '音频文件' : '实时麦克风');
  updateRecordingButtons();
  updatePitchAccuracyButton();
}

function resetOfflineState() {
  offlineAbort = false;
  offlineAnalysisInProgress = false;
  offlineFormantHistory = [];
  offlineSourceSampleRate = null;
  audioFileInput.value = '';
  setAnalysisStatus('未开始');
}

async function decodeAudioFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const decodeContext = new (window.AudioContext || window.webkitAudioContext)();
  try {
    return await decodeContext.decodeAudioData(arrayBuffer);
  } finally {
    decodeContext.close();
  }
}

async function decodeAudioBlob(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const decodeContext = new (window.AudioContext || window.webkitAudioContext)();
  try {
    return await decodeContext.decodeAudioData(arrayBuffer);
  } finally {
    decodeContext.close();
  }
}

function formatPercent(value) {
  return `${Math.min(100, Math.max(0, value)).toFixed(0)}%`;
}

async function analyzeAudioFile(file) {
  if (!file) {
    return;
  }
  if (offlineAnalysisInProgress) {
    return;
  }

  stop();
  offlineAnalysisInProgress = true;
  setOfflineMode(true);
  offlineAbort = false;
  setAnalysisStatus('解码中...');

  let audioBuffer;
  try {
    audioBuffer = await decodeAudioFile(file);
  } catch (error) {
    console.error(error);
    setAnalysisStatus('解码失败，请尝试 wav/mp3');
    offlineAnalysisInProgress = false;
    setOfflineMode(true);
    return;
  }

  const durationSeconds = audioBuffer.duration;
  if (durationSeconds > offlineMaxDurationSeconds) {
    const proceed = window.confirm(
      `音频时长为 ${Math.round(durationSeconds)} 秒，超过默认限制 ${offlineMaxDurationSeconds} 秒，继续分析全片吗？`
    );
    if (!proceed) {
      setAnalysisStatus('已取消');
      offlineAnalysisInProgress = false;
      return;
    }
  }

  setAnalysisStatus('分析中... 0%');
  sessionStartTime = 0;
  pitchHistory = [];
  volumeHistory = [];
  formantHistory = { f1: [], f2: [] };
  smoothedFormants = { f1: null, f2: null };
  stableFormants = { f1: null, f2: null };
  currentPitch = null;
  lastFormantTimestamp = 0;
  lastFormantUpdate = 0;
  offlineSourceSampleRate = audioBuffer.sampleRate;

  const offlineContext = new OfflineAudioContext(
    1,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  const offlineAnalyser = offlineContext.createAnalyser();
  offlineAnalyser.fftSize = 4096;
  const offlineFrequencyData = new Float32Array(offlineAnalyser.frequencyBinCount);
  const scriptNode = offlineContext.createScriptProcessor(2048, 1, 1);

  const frameLength = Math.round(
    (audioBuffer.sampleRate * offlineFrameDurationMs) / 1000
  );
  const hopLength = Math.round(
    (audioBuffer.sampleRate * offlineHopDurationMs) / 1000
  );
  let buffer = new Float32Array(frameLength * 2);
  let bufferLength = 0;
  let frameOffsetSamples = 0;
  let lastProgressUpdate = 0;
  const offlineFormantVoiceGate = { frames: 0, lastPitch: null };

  const appendSamples = (input) => {
    if (bufferLength + input.length > buffer.length) {
      const next = new Float32Array(bufferLength + input.length);
      next.set(buffer.subarray(0, bufferLength));
      buffer = next;
    }
    buffer.set(input, bufferLength);
    bufferLength += input.length;
  };

  const readFrame = () => {
    if (bufferLength < frameLength) {
      return null;
    }
    const frame = new Float32Array(frameLength);
    frame.set(buffer.subarray(0, frameLength));
    buffer.copyWithin(0, hopLength, bufferLength);
    bufferLength -= hopLength;
    return frame;
  };

  scriptNode.onaudioprocess = (event) => {
    if (offlineAbort) {
      return;
    }
    const input = event.inputBuffer.getChannelData(0);
    appendSamples(input);

    let frame = readFrame();
    let lastFramePitchResult = null;
    let lastFrameRms = 0;
    while (frame) {
      const pitchResult = detectPitchForAlgorithm(
        frame,
        audioBuffer.sampleRate,
        offlineAnalyser,
        offlineFrequencyData
      );
      const { pitch } = pitchResult;
      const timeMs = (frameOffsetSamples / audioBuffer.sampleRate) * 1000;
      pitchHistory.push({ time: timeMs, pitch });
      lastFrameRms = computeRms(frame);
      lastFramePitchResult = pitchResult;
      appendVolumePoint(timeMs, lastFrameRms);
      frameOffsetSamples += hopLength;
      frame = readFrame();
    }

    const nowMs = event.playbackTime * 1000;
    const percent = (event.playbackTime / durationSeconds) * 100;
    if (nowMs - lastProgressUpdate >= offlineProgressUpdateMs) {
      lastProgressUpdate = nowMs;
      setAnalysisStatus(`分析中... ${formatPercent(percent)}`);
    }

    if (
      (formantToggle.checked || displayMode === 'formants') &&
      nowMs - lastFormantUpdate >= formantUpdateIntervalMs
    ) {
      lastFormantUpdate = nowMs;
      if (!isReliableFormantVoice(lastFramePitchResult, lastFrameRms, offlineFormantVoiceGate)) {
        appendFormantBreak(offlineFormantHistory, nowMs);
        setFormantDisplay(null, null);
        setFormantStatus('未检测到稳定人声');
        lastFormantTimestamp = nowMs;
        return;
      }
      offlineAnalyser.getFloatFrequencyData(offlineFrequencyData);
      const { f1, f2 } = estimateFormantsFromSpectrum(
        offlineFrequencyData,
        audioBuffer.sampleRate,
        offlineAnalyser.fftSize
      );
      const stabilized = stabilizeFormants(f1, f2, nowMs);
      offlineFormantHistory.push({ time: nowMs, f1: stabilized.f1, f2: stabilized.f2 });
      setFormantDisplay(stabilized.f1, stabilized.f2);
      lastFormantTimestamp = nowMs;
    }
  };

  source.connect(offlineAnalyser);
  offlineAnalyser.connect(scriptNode);
  scriptNode.connect(offlineContext.destination);
  source.start();

  try {
    await offlineContext.startRendering();
  } catch (error) {
    console.error(error);
    setAnalysisStatus('分析失败，请重试');
    offlineAnalysisInProgress = false;
    return;
  }

  if (offlineAbort) {
    setAnalysisStatus('已取消');
    offlineAnalysisInProgress = false;
    setOfflineMode(false);
    resetOfflineState();
    return;
  }

  setAnalysisStatus('完成');
  offlineAnalysisInProgress = false;
  if (displayMode === 'volume') {
    drawVolumeHistory();
  } else if (displayMode === 'formants') {
    drawFormantCurveHistory();
  } else {
    drawPitchHistory();
  }
}

async function analyzeRecordingBlob(blob) {
  if (!blob) {
    return;
  }
  if (offlineAnalysisInProgress) {
    return;
  }

  stop();
  offlineAnalysisInProgress = true;
  setOfflineMode(true);
  offlineAbort = false;
  setAnalysisStatus('解码中...');

  let audioBuffer;
  try {
    audioBuffer = await decodeAudioBlob(blob);
  } catch (error) {
    console.error(error);
    setAnalysisStatus('解码失败，请重试');
    offlineAnalysisInProgress = false;
    setOfflineMode(true);
    return;
  }

  const durationSeconds = audioBuffer.duration;
  if (durationSeconds > offlineMaxDurationSeconds) {
    const proceed = window.confirm(
      `音频时长为 ${Math.round(durationSeconds)} 秒，超过默认限制 ${offlineMaxDurationSeconds} 秒，继续分析全片吗？`
    );
    if (!proceed) {
      setAnalysisStatus('已取消');
      offlineAnalysisInProgress = false;
      return;
    }
  }

  setAnalysisStatus('分析中... 0%');
  sessionStartTime = 0;
  pitchHistory = [];
  volumeHistory = [];
  formantHistory = { f1: [], f2: [] };
  smoothedFormants = { f1: null, f2: null };
  stableFormants = { f1: null, f2: null };
  currentPitch = null;
  lastFormantTimestamp = 0;
  lastFormantUpdate = 0;
  offlineSourceSampleRate = audioBuffer.sampleRate;

  const offlineContext = new OfflineAudioContext(
    1,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  const offlineAnalyser = offlineContext.createAnalyser();
  offlineAnalyser.fftSize = 4096;
  const offlineFrequencyData = new Float32Array(offlineAnalyser.frequencyBinCount);
  const scriptNode = offlineContext.createScriptProcessor(2048, 1, 1);

  const frameLength = Math.round(
    (audioBuffer.sampleRate * offlineFrameDurationMs) / 1000
  );
  const hopLength = Math.round(
    (audioBuffer.sampleRate * offlineHopDurationMs) / 1000
  );
  let buffer = new Float32Array(frameLength * 2);
  let bufferLength = 0;
  let frameOffsetSamples = 0;
  let lastProgressUpdate = 0;
  const offlineFormantVoiceGate = { frames: 0, lastPitch: null };

  const appendSamples = (input) => {
    if (bufferLength + input.length > buffer.length) {
      const next = new Float32Array(bufferLength + input.length);
      next.set(buffer.subarray(0, bufferLength));
      buffer = next;
    }
    buffer.set(input, bufferLength);
    bufferLength += input.length;
  };

  const readFrame = () => {
    if (bufferLength < frameLength) {
      return null;
    }
    const frame = new Float32Array(frameLength);
    frame.set(buffer.subarray(0, frameLength));
    buffer.copyWithin(0, hopLength, bufferLength);
    bufferLength -= hopLength;
    return frame;
  };

  scriptNode.onaudioprocess = (event) => {
    if (offlineAbort) {
      return;
    }
    const input = event.inputBuffer.getChannelData(0);
    appendSamples(input);

    let frame = readFrame();
    let lastFramePitchResult = null;
    let lastFrameRms = 0;
    while (frame) {
      const pitchResult = detectPitchForAlgorithm(
        frame,
        audioBuffer.sampleRate,
        offlineAnalyser,
        offlineFrequencyData
      );
      const { pitch } = pitchResult;
      const timeMs = (frameOffsetSamples / audioBuffer.sampleRate) * 1000;
      pitchHistory.push({ time: timeMs, pitch });
      lastFrameRms = computeRms(frame);
      lastFramePitchResult = pitchResult;
      appendVolumePoint(timeMs, lastFrameRms);
      frameOffsetSamples += hopLength;
      frame = readFrame();
    }

    const nowMs = event.playbackTime * 1000;
    const percent = (event.playbackTime / durationSeconds) * 100;
    if (nowMs - lastProgressUpdate >= offlineProgressUpdateMs) {
      lastProgressUpdate = nowMs;
      setAnalysisStatus(`分析中... ${formatPercent(percent)}`);
    }

    if (
      (formantToggle.checked || displayMode === 'formants') &&
      nowMs - lastFormantUpdate >= formantUpdateIntervalMs
    ) {
      lastFormantUpdate = nowMs;
      if (!isReliableFormantVoice(lastFramePitchResult, lastFrameRms, offlineFormantVoiceGate)) {
        appendFormantBreak(offlineFormantHistory, nowMs);
        setFormantDisplay(null, null);
        setFormantStatus('未检测到稳定人声');
        lastFormantTimestamp = nowMs;
        return;
      }
      offlineAnalyser.getFloatFrequencyData(offlineFrequencyData);
      const { f1, f2 } = estimateFormantsFromSpectrum(
        offlineFrequencyData,
        audioBuffer.sampleRate,
        offlineAnalyser.fftSize
      );
      const stabilized = stabilizeFormants(f1, f2, nowMs);
      offlineFormantHistory.push({ time: nowMs, f1: stabilized.f1, f2: stabilized.f2 });
      setFormantDisplay(stabilized.f1, stabilized.f2);
      lastFormantTimestamp = nowMs;
    }
  };

  source.connect(offlineAnalyser);
  offlineAnalyser.connect(scriptNode);
  scriptNode.connect(offlineContext.destination);
  source.start();

  try {
    await offlineContext.startRendering();
  } catch (error) {
    console.error(error);
    setAnalysisStatus('分析失败，请重试');
    offlineAnalysisInProgress = false;
    return;
  }

  if (offlineAbort) {
    setAnalysisStatus('已取消');
    offlineAnalysisInProgress = false;
    setOfflineMode(false);
    resetOfflineState();
    return;
  }

  setAnalysisStatus('完成');
  offlineAnalysisInProgress = false;
  if (displayMode === 'volume') {
    drawVolumeHistory();
  } else if (displayMode === 'formants') {
    drawFormantCurveHistory();
  } else {
    drawPitchHistory();
  }
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
