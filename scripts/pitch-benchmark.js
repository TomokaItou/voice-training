const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');
const sampleRate = 44100;
const frameSize = 4096;
const hopSize = 2048;
const minConfidence = 0.18;
const algorithms = ['amdf', 'autocorr', 'yin'];

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
    adaptiveNoiseFloorRms: 0.0035,
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
      adaptiveNoiseFloorRms = pitchMinEnergyThreshold;
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
  const sampleCount = Math.floor(fixture.durationSeconds * sampleRate);
  const buffer = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i += 1) {
    const time = i / sampleRate;
    buffer[i] = fixture.signal(time, fixture.durationSeconds, i);
  }
  return buffer;
}

function frameSignal(signal) {
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

function runFixture(context, algorithm, fixture) {
  vm.runInContext(`benchmarkReset(${JSON.stringify(algorithm)})`, context);
  const signal = makeSignal(fixture);
  const frames = frameSignal(signal);
  const errors = [];
  let expectedFrames = 0;
  let detectedExpectedFrames = 0;
  let falsePositiveFrames = 0;
  let octaveErrorFrames = 0;

  for (const frame of frames) {
    context.__frame = frame.buffer;
    const result = vm.runInContext('benchmarkDetect(__frame, 44100)', context);
    const detectedPitch =
      result && Number.isFinite(result.pitch) && result.confidence >= minConfidence
        ? result.pitch
        : null;
    vm.runInContext(`voicedStable = ${detectedPitch ? 'true' : 'false'}`, context);
    const expected = fixture.expectedFrequencyAt(frame.time, fixture.durationSeconds);

    if (expected) {
      expectedFrames += 1;
      if (detectedPitch) {
        detectedExpectedFrames += 1;
        const error = centsError(detectedPitch, expected);
        errors.push(error);
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
  const pass = evaluatePass({
    fixture,
    detectionRate,
    falsePositiveRate,
    avgAbsCents: errorSummary.average,
  });

  return {
    algorithm,
    fixture: fixture.id,
    description: fixture.description,
    frames: frames.length,
    detectionRate,
    falsePositiveRate,
    avgAbsCents: errorSummary.average,
    maxAbsCents: errorSummary.max,
    octaveErrorRate,
    pass,
  };
}

function evaluatePass({ fixture, detectionRate, falsePositiveRate, avgAbsCents }) {
  const { expectations } = fixture;
  if (detectionRate < expectations.minDetectionRate) {
    return false;
  }
  if (falsePositiveRate > expectations.maxFalsePositiveRate) {
    return false;
  }
  if (
    expectations.maxAvgAbsCents !== null &&
    (avgAbsCents === null || avgAbsCents > expectations.maxAvgAbsCents)
  ) {
    return false;
  }
  return true;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCents(value) {
  return value === null ? '--' : value.toFixed(1);
}

function printResults(results) {
  console.log('Pitch detection benchmark');
  console.log(`Sample rate: ${sampleRate} Hz, frame: ${frameSize}, hop: ${hopSize}`);
  console.log(`Algorithms: ${algorithms.join(', ')}`);
  console.log('');

  for (const result of results) {
    const status = result.pass ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${result.algorithm} / ${result.fixture}`);
    console.log(`  ${result.description}`);
    console.log(`  detection: ${formatPercent(result.detectionRate)}`);
    console.log(`  false positives: ${formatPercent(result.falsePositiveRate)}`);
    console.log(`  avg abs cents: ${formatCents(result.avgAbsCents)}`);
    console.log(`  max abs cents: ${formatCents(result.maxAbsCents)}`);
    console.log(`  octave errors: ${formatPercent(result.octaveErrorRate)}`);
  }
}

function main() {
  const context = createContext();
  const results = [];
  for (const algorithm of algorithms) {
    for (const fixture of fixtures) {
      results.push(runFixture(context, algorithm, fixture));
    }
  }
  printResults(results);

  const failures = results.filter((result) => !result.pass);
  if (failures.length) {
    console.error('');
    console.error(`Benchmark failed: ${failures.length} case(s) did not meet expectations.`);
    process.exitCode = 1;
  }
}

main();
