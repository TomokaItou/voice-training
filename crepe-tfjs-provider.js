// TensorFlow.js provider for CREPE pitch tracking.
// Put a converted CREPE GraphModel at assets/models/crepe/model.json to enable it.
(function () {
  const DEFAULT_MODEL_URL = 'assets/models/crepe/model.json';
  const CENTS_BASE = 1997.3794084376191;
  const CENTS_PER_BIN = 20;
  const LOCAL_AVERAGE_RADIUS = 4;
  let loadPromise = null;

  function centsToFrequency(cents) {
    return 10 * (2 ** (cents / 1200));
  }

  function softmax(values) {
    const max = Math.max(...values);
    const exps = values.map((value) => Math.exp(value - max));
    const sum = exps.reduce((total, value) => total + value, 0) || 1;
    return exps.map((value) => value / sum);
  }

  function normalizeActivations(rawValues) {
    const values = Array.from(rawValues || []);
    if (!values.length) return values;
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min < 0 || max > 1.0001) {
      return softmax(values);
    }
    return values;
  }

  function pitchFromActivations(rawValues) {
    const values = normalizeActivations(rawValues);
    if (!values.length) return { pitch: null, confidence: 0 };

    let maxIndex = 0;
    let confidence = values[0] || 0;
    values.forEach((value, index) => {
      if (value > confidence) {
        confidence = value;
        maxIndex = index;
      }
    });

    const start = Math.max(0, maxIndex - LOCAL_AVERAGE_RADIUS);
    const end = Math.min(values.length - 1, maxIndex + LOCAL_AVERAGE_RADIUS);
    let weightedBins = 0;
    let weightSum = 0;
    for (let index = start; index <= end; index += 1) {
      const weight = values[index] || 0;
      weightedBins += index * weight;
      weightSum += weight;
    }
    const bin = weightSum > 0 ? weightedBins / weightSum : maxIndex;
    const cents = CENTS_BASE + CENTS_PER_BIN * bin;
    return {
      pitch: centsToFrequency(cents),
      confidence,
      bin,
      cents,
    };
  }

  function predictWithModel(model, frame, options = {}) {
    const tf = window.tf;
    const input = tf.tensor(frame, [1, options.frameSize || 1024]);
    const output = typeof model.predict === 'function'
      ? model.predict(input)
      : model.execute(input);
    const tensor = Array.isArray(output) ? output[0] : output;
    const raw = tensor.dataSync();
    const result = pitchFromActivations(raw);
    input.dispose();
    if (Array.isArray(output)) {
      output.forEach((item) => item?.dispose?.());
    } else {
      output?.dispose?.();
    }
    return {
      ...result,
      model: 'crepe-tfjs',
    };
  }

  async function loadCrepeTfjsProvider(options = {}) {
    if (loadPromise) return loadPromise;
    const modelUrl = options.modelUrl || DEFAULT_MODEL_URL;
    loadPromise = (async () => {
      if (!window.tf) {
        window.CrepePitch?.setUnavailableReason?.('TensorFlow.js 未加载');
        return null;
      }
      if (!window.CrepePitch) {
        return null;
      }
      try {
        let model;
        try {
          model = await window.tf.loadGraphModel(modelUrl);
        } catch (graphError) {
          model = await window.tf.loadLayersModel(modelUrl);
        }
        const provider = {
          id: 'crepe-tfjs',
          model: modelUrl,
          predictPitch(frame, predictOptions) {
            return predictWithModel(model, frame, predictOptions);
          },
          predictPitchSync(frame, predictOptions) {
            return predictWithModel(model, frame, predictOptions);
          },
        };
        window.CrepePitch.registerProvider(provider);
        window.CrepePitch.setActiveProvider(provider.id);
        return provider;
      } catch (error) {
        window.CrepePitch.setUnavailableReason(`未找到本地 CREPE 模型：${modelUrl}`);
        console.info('CREPE TFJS model not loaded; using fallback pitch detector.', error);
        return null;
      }
    })();
    return loadPromise;
  }

  window.CrepeTfjsProvider = {
    DEFAULT_MODEL_URL,
    load: loadCrepeTfjsProvider,
    pitchFromActivations,
  };

  loadCrepeTfjsProvider();
})();
