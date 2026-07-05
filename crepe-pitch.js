// CREPE pitch tracker adapter.
// This file defines the app-level neural pitch API. It can use a registered
// CREPE provider when a local model runtime is available, and otherwise reports
// unavailable so the existing YIN/AMDF detectors remain the safe fallback.
(function () {
  const VERSION = 'crepe-pitch-adapter-v1';
  const MODEL_SAMPLE_RATE = 16000;
  const MODEL_FRAME_SIZE = 1024;
  const DEFAULT_CONFIDENCE_THRESHOLD = 0.55;
  const providers = new Map();
  let activeProviderId = null;
  let lastUnavailableReason = '未加载 CREPE 模型';

  function resampleLinear(samples, sourceSampleRate, targetSampleRate = MODEL_SAMPLE_RATE) {
    if (!samples?.length || sourceSampleRate === targetSampleRate) {
      return new Float32Array(samples || []);
    }
    const ratio = sourceSampleRate / targetSampleRate;
    const targetLength = Math.max(1, Math.round(samples.length / ratio));
    const output = new Float32Array(targetLength);
    for (let index = 0; index < targetLength; index += 1) {
      const sourceIndex = index * ratio;
      const leftIndex = Math.floor(sourceIndex);
      const rightIndex = Math.min(samples.length - 1, leftIndex + 1);
      const alpha = sourceIndex - leftIndex;
      output[index] = (samples[leftIndex] || 0) * (1 - alpha) + (samples[rightIndex] || 0) * alpha;
    }
    return output;
  }

  function centerCropOrPad(samples, size = MODEL_FRAME_SIZE) {
    const output = new Float32Array(size);
    if (!samples?.length) return output;
    if (samples.length >= size) {
      const start = Math.floor((samples.length - size) / 2);
      output.set(samples.subarray(start, start + size));
      return output;
    }
    const start = Math.floor((size - samples.length) / 2);
    output.set(samples, start);
    return output;
  }

  function normalizeFrame(samples) {
    let mean = 0;
    for (let index = 0; index < samples.length; index += 1) {
      mean += samples[index];
    }
    mean /= Math.max(1, samples.length);

    let variance = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const centered = samples[index] - mean;
      variance += centered * centered;
    }
    const std = Math.sqrt(variance / Math.max(1, samples.length)) || 1;
    const output = new Float32Array(samples.length);
    for (let index = 0; index < samples.length; index += 1) {
      output[index] = Math.max(-3, Math.min(3, (samples[index] - mean) / std)) / 3;
    }
    return output;
  }

  function prepareCrepeInput(samples, sampleRate) {
    const resampled = resampleLinear(samples, sampleRate, MODEL_SAMPLE_RATE);
    return normalizeFrame(centerCropOrPad(resampled, MODEL_FRAME_SIZE));
  }

  function registerProvider(provider) {
    if (!provider?.id || typeof provider.predictPitch !== 'function') {
      throw new Error('CREPE provider needs id and predictPitch(frame, options).');
    }
    providers.set(provider.id, provider);
    if (!activeProviderId) activeProviderId = provider.id;
    lastUnavailableReason = '';
    return provider;
  }

  function setActiveProvider(providerId) {
    if (providerId !== null && !providers.has(providerId)) {
      throw new Error(`Unknown CREPE provider: ${providerId}`);
    }
    activeProviderId = providerId;
  }

  function getActiveProvider() {
    return activeProviderId ? providers.get(activeProviderId) : null;
  }

  function getStatus() {
    const provider = getActiveProvider();
    return {
      version: VERSION,
      available: Boolean(provider),
      providerId: provider?.id || null,
      model: provider?.model || 'crepe',
      reason: provider ? '' : lastUnavailableReason,
    };
  }

  function setUnavailableReason(reason) {
    lastUnavailableReason = reason || lastUnavailableReason;
  }

  async function estimatePitch(samples, sampleRate, options = {}) {
    const provider = options.providerId ? providers.get(options.providerId) : getActiveProvider();
    if (!provider) {
      return {
        pitch: null,
        confidence: 0,
        unavailable: true,
        reason: lastUnavailableReason,
        model: 'crepe-unavailable',
      };
    }

    const frame = prepareCrepeInput(samples, sampleRate);
    const result = await provider.predictPitch(frame, {
      sampleRate: MODEL_SAMPLE_RATE,
      frameSize: MODEL_FRAME_SIZE,
      ...options,
    });
    const confidence = Number(result?.confidence) || 0;
    const pitch = confidence >= (options.confidenceThreshold || DEFAULT_CONFIDENCE_THRESHOLD)
      ? Number(result?.pitch) || null
      : null;
    return {
      pitch,
      confidence,
      rms: typeof computeRms === 'function' ? computeRms(samples) : 0,
      model: result?.model || provider.model || provider.id,
      rawPitch: Number(result?.pitch) || null,
    };
  }

  function estimatePitchCrepeWithConfidence(samples, sampleRate, options = {}) {
    const provider = options.providerId ? providers.get(options.providerId) : getActiveProvider();
    if (!provider) {
      return {
        pitch: null,
        confidence: 0,
        rms: typeof computeRms === 'function' ? computeRms(samples) : 0,
        unavailable: true,
        reason: lastUnavailableReason,
      };
    }
    if (typeof provider.predictPitchSync !== 'function') {
      return {
        pitch: null,
        confidence: 0,
        rms: typeof computeRms === 'function' ? computeRms(samples) : 0,
        unavailable: true,
        reason: '当前 CREPE provider 只支持异步预测，实时检测会使用 fallback。',
      };
    }
    const frame = prepareCrepeInput(samples, sampleRate);
    const result = provider.predictPitchSync(frame, {
      sampleRate: MODEL_SAMPLE_RATE,
      frameSize: MODEL_FRAME_SIZE,
      ...options,
    });
    const confidence = Number(result?.confidence) || 0;
    return {
      pitch: confidence >= (options.confidenceThreshold || DEFAULT_CONFIDENCE_THRESHOLD)
        ? Number(result?.pitch) || null
        : null,
      confidence,
      rms: typeof computeRms === 'function' ? computeRms(samples) : 0,
      model: result?.model || provider.model || provider.id,
      rawPitch: Number(result?.pitch) || null,
    };
  }

  window.CrepePitch = {
    VERSION,
    MODEL_SAMPLE_RATE,
    MODEL_FRAME_SIZE,
    DEFAULT_CONFIDENCE_THRESHOLD,
    registerProvider,
    setActiveProvider,
    getActiveProvider,
    getStatus,
    setUnavailableReason,
    prepareCrepeInput,
    estimatePitch,
    estimatePitchCrepeWithConfidence,
  };

  window.estimatePitchCrepeWithConfidence = estimatePitchCrepeWithConfidence;
})();
