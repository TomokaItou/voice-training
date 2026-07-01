const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');
const defaultSampleRate = 44100;
const frameSize = 4096;
const minConfidence = 0.18;
const allAlgorithms = ['amdf', 'autocorr', 'yin'];
const defaultVoiceManifestPath = path.join(projectRoot, 'samples', 'voice-benchmark', 'manifest.json');

function parseArgs(argv) {
  const options = {
    mode: 'quick',
    algorithms: [...allAlgorithms],
    fixturePattern: null,
    includeVoice: false,
    voiceManifestPath: defaultVoiceManifestPath,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--full') {
      options.mode = 'full';
    } else if (arg === '--quick') {
      options.mode = 'quick';
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--algorithm' || arg === '-a') {
      const value = argv[i + 1];
      i += 1;
      if (!value) {
        throw new Error('--algorithm requires a comma-separated value');
      }
      options.algorithms = value.split(',').map((item) => item.trim()).filter(Boolean);
    } else if (arg.startsWith('--algorithm=')) {
      options.algorithms = arg
        .slice('--algorithm='.length)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (arg === '--fixture' || arg === '-f') {
      const value = argv[i + 1];
      i += 1;
      if (!value) {
        throw new Error('--fixture requires a value');
      }
      options.fixturePattern = value;
    } else if (arg.startsWith('--fixture=')) {
      options.fixturePattern = arg.slice('--fixture='.length);
    } else if (arg === '--voice') {
      options.includeVoice = true;
    } else if (arg === '--voice-manifest') {
      const value = argv[i + 1];
      i += 1;
      if (!value) {
        throw new Error('--voice-manifest requires a path');
      }
      options.includeVoice = true;
      options.voiceManifestPath = path.resolve(value);
    } else if (arg.startsWith('--voice-manifest=')) {
      options.includeVoice = true;
      options.voiceManifestPath = path.resolve(arg.slice('--voice-manifest='.length));
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  const unknownAlgorithms = options.algorithms.filter(
    (algorithm) => !allAlgorithms.includes(algorithm)
  );
  if (unknownAlgorithms.length) {
    throw new Error(`Unknown algorithm(s): ${unknownAlgorithms.join(', ')}`);
  }

  return options;
}

function printUsage() {
  console.log(
    'Usage: pitch-benchmark.cmd [--quick|--full] [--algorithm amdf,yin] [--fixture text] [--voice] [--voice-manifest path] [--json]'
  );
  console.log('');
  console.log('Defaults to --quick so local validation stays fast. Use --full before changing pitch logic.');
}

const fixtures = [
  {
    id: 'sine-a4-440',
    description: 'Clean A4 sine wave',
    durationSeconds: 1.2,
    expectedFrequencyAt: () => 440,
    signal: (time) => Math.sin(2 * Math.PI * 440 * time) * 0.12,
    expectations: { minDetectionRate: 0.9, maxAvgAbsCents: 20, maxFalsePositiveRate: 0 },
  },
  {
    id: 'sine-c4-261',
    description: 'Clean C4 sine wave',
    durationSeconds: 1.2,
    expectedFrequencyAt: () => 261.625565,
    signal: (time) => Math.sin(2 * Math.PI * 261.625565 * time) * 0.12,
    expectations: { minDetectionRate: 0.9, maxAvgAbsCents: 25, maxFalsePositiveRate: 0 },
  },
  {
    id: 'sweep-220-440',
    description: 'Linear sweep from A3 to A4',
    durationSeconds: 1.6,
    expectedFrequencyAt: (time, durationSeconds) => 220 + (220 * time) / durationSeconds,
    signal: (time, durationSeconds) => {
      const startHz = 220;
      const endHz = 440;
      const sweepRate = (endHz - startHz) / durationSeconds;
      const phase = 2 * Math.PI * (startHz * time + 0.5 * sweepRate * time * time);
      return Math.sin(phase) * 0.12;
    },
    expectations: { minDetectionRate: 0.85, maxAvgAbsCents: 40, maxFalsePositiveRate: 0 },
  },
  {
    id: 'noisy-a4-440',
    description: 'A4 sine wave with deterministic broadband noise',
    durationSeconds: 1.2,
    expectedFrequencyAt: () => 440,
    signal: (time, durationSeconds, index) => {
      const noise = deterministicNoise(index) * 0.02;
      return Math.sin(2 * Math.PI * 440 * time) * 0.1 + noise;
    },
    expectations: { minDetectionRate: 0.75, maxAvgAbsCents: 45, maxFalsePositiveRate: 0 },
  },
  {
    id: 'silence',
    description: 'Silence should not produce pitches',
    durationSeconds: 1.0,
    expectedFrequencyAt: () => null,
    signal: () => 0,
    expectations: { minDetectionRate: 0, maxAvgAbsCents: null, maxFalsePositiveRate: 0 },
  },
  {
    id: 'quiet-onset-a4-440',
    description: 'Quiet A4 onset ramp, useful for checking sensitivity without noise-floor pumping',
    durationSeconds: 1.2,
    expectedFrequencyAt: (time) => (time < 0.18 ? null : 440),
    signal: (time) => {
      const ramp = Math.min(1, Math.max(0, (time - 0.06) / 0.35));
      return Math.sin(2 * Math.PI * 440 * time) * 0.035 * ramp;
    },
    expectations: { minDetectionRate: 0.55, maxAvgAbsCents: 50, maxFalsePositiveRate: 0.08 },
    fullOnly: true,
  },
  {
    id: 'harmonic-rich-e3-165',
    description: 'Harmonic-rich E3 tone, useful for catching octave and harmonic-lock errors',
    durationSeconds: 1.2,
    expectedFrequencyAt: () => 164.813778,
    signal: (time) => {
      const fundamental = Math.sin(2 * Math.PI * 164.813778 * time) * 0.055;
      const second = Math.sin(2 * Math.PI * 329.627556 * time) * 0.045;
      const third = Math.sin(2 * Math.PI * 494.441334 * time) * 0.025;
      return fundamental + second + third;
    },
    expectations: { minDetectionRate: 0.8, maxAvgAbsCents: 55, maxFalsePositiveRate: 0 },
    fullOnly: true,
  },
  {
    id: 'low-voice-100-strong-700',
    description: '100 Hz low voice with a dominant 7th harmonic, useful for catching harmonic lock',
    durationSeconds: 1.2,
    expectedFrequencyAt: () => 100,
    signal: (time) => {
      const fundamental = Math.sin(2 * Math.PI * 100 * time) * 0.035;
      const second = Math.sin(2 * Math.PI * 200 * time) * 0.025;
      const third = Math.sin(2 * Math.PI * 300 * time) * 0.02;
      const seventh = Math.sin(2 * Math.PI * 700 * time) * 0.09;
      return fundamental + second + third + seventh;
    },
    expectations: { minDetectionRate: 0.8, maxAvgAbsCents: 60, maxFalsePositiveRate: 0 },
    fullOnly: true,
  },
  {
    id: 'vibrato-a4-440',
    description: 'A4 with controlled vibrato, useful for checking tracking smoothness',
    durationSeconds: 1.4,
    expectedFrequencyAt: (time) => 440 + 7 * Math.sin(2 * Math.PI * 5.5 * time),
    signal: (time) => {
      const vibratoRate = 5.5;
      const vibratoDepthHz = 7;
      const phase =
        2 *
        Math.PI *
        (440 * time -
          (vibratoDepthHz / (2 * Math.PI * vibratoRate)) *
            Math.cos(2 * Math.PI * vibratoRate * time) +
          vibratoDepthHz / (2 * Math.PI * vibratoRate));
      return Math.sin(phase) * 0.11;
    },
    expectations: { minDetectionRate: 0.8, maxAvgAbsCents: 45, maxFalsePositiveRate: 0 },
    fullOnly: true,
  },
  {
    id: 'noise-only',
    description: 'Broadband noise should not produce stable pitches',
    durationSeconds: 1.0,
    expectedFrequencyAt: () => null,
    signal: (time, durationSeconds, index) => deterministicNoise(index) * 0.018,
    expectations: { minDetectionRate: 0, maxAvgAbsCents: null, maxFalsePositiveRate: 0.12 },
    fullOnly: true,
  },
];

function deterministicNoise(index) {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function createContext() {
  const context = {
    console,
    Float32Array,
    Math,
    Number,
    pitchAlgorithm: 'amdf',
    adaptiveNoiseFloorRms: 0.0035 / 1.7,
    adaptiveEnergyThreshold: 0.0035,
    voicedStable: false,
  };
  vm.createContext(context);
  for (const file of ['app-config.js', 'pitch-detection.js']) {
    const source = fs.readFileSync(path.join(projectRoot, file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  vm.runInContext(
    `
    function benchmarkReset(algorithm) {
      pitchAlgorithm = algorithm;
      adaptiveNoiseFloorRms = pitchInitialNoiseFloorRms;
      adaptiveEnergyThreshold = pitchMinEnergyThreshold;
      voicedStable = false;
    }
    function benchmarkDetect(buffer, sampleRate) {
      return detectPitchForAlgorithm(buffer, sampleRate);
    }
    `,
    context
  );
  return context;
}

function makeSignal(fixture) {
  const sampleRate = fixture.sampleRate || defaultSampleRate;
  const sampleCount = Math.floor(fixture.durationSeconds * sampleRate);
  const buffer = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i += 1) {
    const time = i / sampleRate;
    buffer[i] = fixture.signal(time, fixture.durationSeconds, i);
  }
  return buffer;
}

function frameSignal(signal, hopSize, sampleRate) {
  const frames = [];
  for (let start = 0; start + frameSize <= signal.length; start += hopSize) {
    frames.push({
      start,
      time: (start + frameSize / 2) / sampleRate,
      buffer: signal.subarray(start, start + frameSize),
    });
  }
  return frames;
}

function centsError(detected, expected) {
  return 1200 * Math.log2(detected / expected);
}

function summarize(values) {
  if (!values.length) {
    return { average: null, max: null };
  }
  const absValues = values.map((value) => Math.abs(value));
  return {
    average: absValues.reduce((sum, value) => sum + value, 0) / absValues.length,
    max: Math.max(...absValues),
  };
}

function runFixture(context, algorithm, fixture, mode) {
  const hopSize = mode === 'full' ? 2048 : 4096;
  const sampleRate = fixture.sampleRate || defaultSampleRate;
  vm.runInContext(`benchmarkReset(${JSON.stringify(algorithm)})`, context);
  const signal = fixture.buffer || makeSignal(fixture);
  const frames = frameSignal(signal, hopSize, sampleRate);
  const errors = [];
  const confidences = [];
  let expectedFrames = 0;
  let detectedExpectedFrames = 0;
  let falsePositiveFrames = 0;
  let octaveErrorFrames = 0;

  for (const frame of frames) {
    context.__frame = frame.buffer;
    context.__sampleRate = sampleRate;
    const result = vm.runInContext('benchmarkDetect(__frame, __sampleRate)', context);
    const detectedPitch =
      result && Number.isFinite(result.pitch) && result.confidence >= minConfidence
        ? result.pitch
        : null;
    vm.runInContext(`voicedStable = ${detectedPitch ? 'true' : 'false'}`, context);
    const expected = fixture.expectedFrequencyAt(frame.time, fixture.durationSeconds);

    if (expected === undefined) {
      continue;
    }

    if (expected) {
      expectedFrames += 1;
      if (detectedPitch) {
        detectedExpectedFrames += 1;
        const error = centsError(detectedPitch, expected);
        errors.push(error);
        confidences.push(result.confidence);
        if (Math.abs(error) >= 600) {
          octaveErrorFrames += 1;
        }
      }
    } else if (detectedPitch) {
      falsePositiveFrames += 1;
    }
  }

  const errorSummary = summarize(errors);
  const detectionRate = expectedFrames ? detectedExpectedFrames / expectedFrames : 0;
  const falsePositiveRate = frames.length ? falsePositiveFrames / frames.length : 0;
  const octaveErrorRate = detectedExpectedFrames ? octaveErrorFrames / detectedExpectedFrames : 0;
  const passReasons = evaluatePass({
    fixture,
    detectionRate,
    falsePositiveRate,
    avgAbsCents: errorSummary.average,
  });
  const confidenceSummary = summarize(confidences);

  return {
    algorithm,
    fixture: fixture.id,
    description: fixture.description,
    source: fixture.source || 'synthetic',
    sampleRate,
    frames: frames.length,
    detectionRate,
    falsePositiveRate,
    avgAbsCents: errorSummary.average,
    maxAbsCents: errorSummary.max,
    avgConfidence: confidenceSummary.average,
    octaveErrorRate,
    pass: passReasons.length === 0,
    reasons: passReasons,
  };
}

function readAscii(buffer, offset, length) {
  return buffer.toString('ascii', offset, offset + length);
}

function readWavFile(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (readAscii(bytes, 0, 4) !== 'RIFF' || readAscii(bytes, 8, 4) !== 'WAVE') {
    throw new Error('not a RIFF/WAVE file');
  }

  let offset = 12;
  let format = null;
  let dataStart = -1;
  let dataSize = 0;

  while (offset + 8 <= bytes.length) {
    const chunkId = readAscii(bytes, offset, 4);
    const chunkSize = bytes.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkId === 'fmt ') {
      format = {
        audioFormat: bytes.readUInt16LE(chunkStart),
        channelCount: bytes.readUInt16LE(chunkStart + 2),
        sampleRate: bytes.readUInt32LE(chunkStart + 4),
        bitsPerSample: bytes.readUInt16LE(chunkStart + 14),
      };
    } else if (chunkId === 'data') {
      dataStart = chunkStart;
      dataSize = chunkSize;
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (!format) {
    throw new Error('missing fmt chunk');
  }
  if (dataStart < 0) {
    throw new Error('missing data chunk');
  }
  if (![1, 3].includes(format.audioFormat)) {
    throw new Error(`unsupported WAV format ${format.audioFormat}; use PCM or float WAV`);
  }

  const bytesPerSample = format.bitsPerSample / 8;
  const frameCount = Math.floor(dataSize / (bytesPerSample * format.channelCount));
  const mono = new Float32Array(frameCount);

  for (let frame = 0; frame < frameCount; frame += 1) {
    let sum = 0;
    for (let channel = 0; channel < format.channelCount; channel += 1) {
      const sampleOffset =
        dataStart + (frame * format.channelCount + channel) * bytesPerSample;
      sum += readWavSample(bytes, sampleOffset, format.audioFormat, format.bitsPerSample);
    }
    mono[frame] = sum / format.channelCount;
  }

  return {
    sampleRate: format.sampleRate,
    channelCount: format.channelCount,
    buffer: mono,
    durationSeconds: mono.length / format.sampleRate,
  };
}

function readWavSample(bytes, offset, audioFormat, bitsPerSample) {
  if (audioFormat === 3 && bitsPerSample === 32) {
    return bytes.readFloatLE(offset);
  }
  if (audioFormat !== 1) {
    throw new Error(`unsupported WAV format ${audioFormat}`);
  }
  if (bitsPerSample === 8) {
    return (bytes.readUInt8(offset) - 128) / 128;
  }
  if (bitsPerSample === 16) {
    return bytes.readInt16LE(offset) / 32768;
  }
  if (bitsPerSample === 24) {
    const unsigned = bytes.readUIntLE(offset, 3);
    const signed = unsigned & 0x800000 ? unsigned | 0xff000000 : unsigned;
    return signed / 8388608;
  }
  if (bitsPerSample === 32) {
    return bytes.readInt32LE(offset) / 2147483648;
  }
  throw new Error(`unsupported WAV bit depth ${bitsPerSample}`);
}

function expectedFrequencyFromSegments(segments, time, ignoreUnlabeled = false) {
  for (const segment of segments) {
    if (time >= segment.start && time <= segment.end) {
      if (segment.expectedHz === null || segment.voiced === false) {
        return null;
      }
      if (Array.isArray(segment.expectedHz)) {
        const [startHz, endHz] = segment.expectedHz;
        const ratio = (time - segment.start) / Math.max(0.001, segment.end - segment.start);
        return startHz + (endHz - startHz) * Math.max(0, Math.min(1, ratio));
      }
      return segment.expectedHz;
    }
  }
  return ignoreUnlabeled ? undefined : null;
}

function normalizeExpectations(expectations = {}) {
  return {
    minDetectionRate: expectations.minDetectionRate ?? 0.7,
    maxAvgAbsCents: expectations.maxAvgAbsCents ?? 55,
    maxFalsePositiveRate: expectations.maxFalsePositiveRate ?? 0.15,
  };
}

function loadVoiceFixtures(manifestPath) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Voice manifest not found: ${manifestPath}`);
  }

  const manifestRoot = path.dirname(manifestPath);
  const manifestText = fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, '');
  const manifest = JSON.parse(manifestText);
  const samples = Array.isArray(manifest.samples) ? manifest.samples : [];
  const voiceFixtures = [];

  for (const sample of samples) {
    if (!sample.id || !sample.file || !Array.isArray(sample.segments)) {
      throw new Error('Each voice sample needs id, file, and segments fields');
    }
    const audioPath = path.resolve(manifestRoot, sample.file);
    const wav = readWavFile(audioPath);
    const segments = sample.segments.map((segment) => ({
      start: Number(segment.start),
      end: Number(segment.end),
      expectedHz:
        Array.isArray(segment.expectedHz) || segment.expectedHz === null
          ? segment.expectedHz
          : Number(segment.expectedHz),
      voiced: segment.voiced,
    }));

    voiceFixtures.push({
      id: sample.id,
      description: sample.description || `Voice sample ${sample.id}`,
      source: 'voice',
      buffer: wav.buffer,
      sampleRate: wav.sampleRate,
      durationSeconds: wav.durationSeconds,
      expectedFrequencyAt: (time) =>
        expectedFrequencyFromSegments(segments, time, Boolean(sample.ignoreUnlabeled)),
      expectations: normalizeExpectations(sample.expectations || manifest.expectations),
    });
  }

  return voiceFixtures;
}

function evaluatePass({ fixture, detectionRate, falsePositiveRate, avgAbsCents }) {
  const { expectations } = fixture;
  const reasons = [];
  if (detectionRate < expectations.minDetectionRate) {
    reasons.push(
      `detection ${formatPercent(detectionRate)} < ${formatPercent(expectations.minDetectionRate)}`
    );
  }
  if (falsePositiveRate > expectations.maxFalsePositiveRate) {
    reasons.push(
      `false positives ${formatPercent(falsePositiveRate)} > ${formatPercent(
        expectations.maxFalsePositiveRate
      )}`
    );
  }
  if (
    expectations.maxAvgAbsCents !== null &&
    (avgAbsCents === null || avgAbsCents > expectations.maxAvgAbsCents)
  ) {
    reasons.push(
      `avg abs cents ${formatCents(avgAbsCents)} > ${formatCents(expectations.maxAvgAbsCents)}`
    );
  }
  return reasons;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCents(value) {
  return value === null ? '--' : value.toFixed(1);
}

function printResults(results, options, selectedFixtures, elapsedMs) {
  console.log('Pitch detection benchmark');
  console.log(`Mode: ${options.mode}`);
  console.log(`Synthetic sample rate: ${defaultSampleRate} Hz, frame: ${frameSize}`);
  console.log(`Algorithms: ${options.algorithms.join(', ')}`);
  console.log(`Fixtures: ${selectedFixtures.map((fixture) => fixture.id).join(', ')}`);
  console.log(`Elapsed: ${(elapsedMs / 1000).toFixed(2)}s`);
  console.log('');

  for (const result of results) {
    const status = result.pass ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${result.algorithm} / ${result.fixture}`);
    console.log(`  ${result.description}`);
    console.log(`  source: ${result.source}, sample rate: ${result.sampleRate} Hz`);
    console.log(`  detection: ${formatPercent(result.detectionRate)}`);
    console.log(`  false positives: ${formatPercent(result.falsePositiveRate)}`);
    console.log(`  avg abs cents: ${formatCents(result.avgAbsCents)}`);
    console.log(`  max abs cents: ${formatCents(result.maxAbsCents)}`);
    console.log(`  avg confidence: ${result.avgConfidence === null ? '--' : result.avgConfidence.toFixed(2)}`);
    console.log(`  octave errors: ${formatPercent(result.octaveErrorRate)}`);
    if (result.reasons.length) {
      console.log(`  reason: ${result.reasons.join('; ')}`);
    }
  }
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error('');
    printUsage();
    process.exitCode = 2;
    return;
  }

  if (options.help) {
    printUsage();
    return;
  }

  let availableFixtures = [...fixtures];
  if (options.includeVoice) {
    try {
      availableFixtures = availableFixtures.concat(loadVoiceFixtures(options.voiceManifestPath));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 2;
      return;
    }
  }

  const selectedFixtures = availableFixtures.filter((fixture) => {
    if (options.mode !== 'full' && fixture.fullOnly) {
      return false;
    }
    return !options.fixturePattern || fixture.id.includes(options.fixturePattern);
  });

  if (!selectedFixtures.length) {
    console.error('No fixtures matched the selected options.');
    process.exitCode = 2;
    return;
  }

  const startedAt = Date.now();
  const context = createContext();
  const results = [];
  for (const algorithm of options.algorithms) {
    for (const fixture of selectedFixtures) {
      results.push(runFixture(context, algorithm, fixture, options.mode));
    }
  }

  const elapsedMs = Date.now() - startedAt;
  if (options.json) {
    console.log(JSON.stringify({ options, elapsedMs, results }, null, 2));
  } else {
    printResults(results, options, selectedFixtures, elapsedMs);
  }

  const failures = results.filter((result) => !result.pass);
  if (failures.length) {
    console.error('');
    console.error(`Benchmark failed: ${failures.length} case(s) did not meet expectations.`);
    process.exitCode = 1;
  }
}

main();
