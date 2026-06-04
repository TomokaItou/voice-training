const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');
const defaultOutputPath = path.join(
  projectRoot,
  'samples',
  'voice-benchmark',
  'manifest.vocalset.local.json'
);
const frameSize = 4096;
const hopSize = 2048;
const minReferenceConfidence = 0.45;
const minReferenceFrames = 5;
const maxSegmentGapSeconds = 0.18;
const maxSegmentJumpCents = 180;
const maxStableMadCents = 90;

function parseArgs(argv) {
  const options = {
    root: null,
    output: defaultOutputPath,
    singers: [],
    techniques: ['straight'],
    vowels: [],
    maxSamples: 24,
    startPaddingSeconds: 0.35,
    endPaddingSeconds: 0.35,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') {
      options.root = path.resolve(requireValue(argv, (i += 1), '--root'));
    } else if (arg.startsWith('--root=')) {
      options.root = path.resolve(arg.slice('--root='.length));
    } else if (arg === '--output') {
      options.output = path.resolve(requireValue(argv, (i += 1), '--output'));
    } else if (arg.startsWith('--output=')) {
      options.output = path.resolve(arg.slice('--output='.length));
    } else if (arg === '--singers') {
      options.singers = splitList(requireValue(argv, (i += 1), '--singers'));
    } else if (arg.startsWith('--singers=')) {
      options.singers = splitList(arg.slice('--singers='.length));
    } else if (arg === '--techniques') {
      options.techniques = splitList(requireValue(argv, (i += 1), '--techniques'));
    } else if (arg.startsWith('--techniques=')) {
      options.techniques = splitList(arg.slice('--techniques='.length));
    } else if (arg === '--vowels') {
      options.vowels = splitList(requireValue(argv, (i += 1), '--vowels'));
    } else if (arg.startsWith('--vowels=')) {
      options.vowels = splitList(arg.slice('--vowels='.length));
    } else if (arg === '--max-samples') {
      options.maxSamples = Number(requireValue(argv, (i += 1), '--max-samples'));
    } else if (arg.startsWith('--max-samples=')) {
      options.maxSamples = Number(arg.slice('--max-samples='.length));
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.root && !options.help) {
    throw new Error('--root is required');
  }
  if (!Number.isFinite(options.maxSamples) || options.maxSamples < 1) {
    throw new Error('--max-samples must be a positive number');
  }
  return options;
}

function requireValue(argv, index, name) {
  const value = argv[index];
  if (!value) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function splitList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function printUsage() {
  console.log(
    'Usage: build-vocalset-manifest.cmd --root path [--output path] [--singers female1,male1] [--techniques straight,forte] [--vowels a,e] [--max-samples 24]'
  );
}

function createContext() {
  const context = {
    console,
    Float32Array,
    Math,
    Number,
    pitchAlgorithm: 'yin',
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
    function referenceReset() {
      pitchAlgorithm = 'yin';
      adaptiveNoiseFloorRms = pitchMinEnergyThreshold;
      adaptiveEnergyThreshold = pitchMinEnergyThreshold;
      voicedStable = false;
    }
    function referenceDetect(buffer, sampleRate) {
      return detectPitchForAlgorithm(buffer, sampleRate);
    }
    `,
    context
  );
  return context;
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

  if (!format || dataStart < 0) {
    throw new Error('missing WAV fmt or data chunk');
  }
  if (![1, 3].includes(format.audioFormat)) {
    throw new Error(`unsupported WAV format ${format.audioFormat}`);
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
    buffer: mono,
    durationSeconds: mono.length / format.sampleRate,
  };
}

function readWavSample(bytes, offset, audioFormat, bitsPerSample) {
  if (audioFormat === 3 && bitsPerSample === 32) {
    return bytes.readFloatLE(offset);
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

function listWavFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.wav')) {
        files.push(fullPath);
      }
    }
  }
  return files.sort();
}

function parseVocalSetPath(filePath) {
  const parts = filePath.split(/[\\/]+/);
  const singer = parts.find((part) => /^(female|male)\d+$/i.test(part));
  const category = parts.includes('long_tones') ? 'long_tones' : '';
  const technique = parts[parts.length - 2];
  const basename = path.basename(filePath, '.wav');
  const vowel = basename.split('_').pop();
  return { singer, category, technique, vowel, basename };
}

function selectFiles(root, options) {
  return listWavFiles(path.join(root, 'FULL'))
    .map((filePath) => ({ filePath, meta: parseVocalSetPath(filePath) }))
    .filter(({ meta }) => meta.category === 'long_tones')
    .filter(({ meta }) => !options.singers.length || options.singers.includes(meta.singer))
    .filter(({ meta }) => !options.techniques.length || options.techniques.includes(meta.technique))
    .filter(({ meta }) => !options.vowels.length || options.vowels.includes(meta.vowel))
    .slice(0, options.maxSamples);
}

function centsBetween(a, b) {
  return 1200 * Math.log2(a / b);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function analyzeReferenceSegments(context, wav, options) {
  vm.runInContext('referenceReset()', context);
  const startSample = Math.floor(options.startPaddingSeconds * wav.sampleRate);
  const endSample = Math.max(
    startSample + frameSize,
    wav.buffer.length - Math.floor(options.endPaddingSeconds * wav.sampleRate)
  );
  const frames = [];

  for (let offset = startSample; offset + frameSize <= endSample; offset += hopSize) {
    context.__frame = wav.buffer.subarray(offset, offset + frameSize);
    context.__sampleRate = wav.sampleRate;
    const result = vm.runInContext('referenceDetect(__frame, __sampleRate)', context);
    if (result && Number.isFinite(result.pitch) && result.confidence >= minReferenceConfidence) {
      frames.push({
        time: (offset + frameSize / 2) / wav.sampleRate,
        pitch: result.pitch,
        confidence: result.confidence,
      });
      vm.runInContext('voicedStable = true', context);
    } else {
      vm.runInContext('voicedStable = false', context);
    }
  }

  return summarizeReferenceRuns(splitReferenceRuns(frames), wav.sampleRate);
}

function splitReferenceRuns(frames) {
  const runs = [];
  let current = [];
  for (const frame of frames) {
    const previous = current[current.length - 1];
    const shouldSplit =
      previous &&
      (frame.time - previous.time > maxSegmentGapSeconds ||
        Math.abs(centsBetween(frame.pitch, previous.pitch)) > maxSegmentJumpCents);
    if (shouldSplit && current.length) {
      runs.push(current);
      current = [];
    }
    current.push(frame);
  }
  if (current.length) {
    runs.push(current);
  }
  return runs;
}

function summarizeReferenceRuns(runs, sampleRate) {
  const segments = [];
  let totalFrames = 0;
  let weightedConfidence = 0;
  const segmentDeviations = [];

  for (const run of runs) {
    if (run.length < minReferenceFrames) {
      continue;
    }
    const pitches = run.map((frame) => frame.pitch);
    const referenceHz = median(pitches);
    const deviations = pitches.map((pitch) => Math.abs(centsBetween(pitch, referenceHz)));
    const mad = median(deviations);
    if (mad > maxStableMadCents) {
      continue;
    }
    const averageConfidence =
      run.reduce((sum, frame) => sum + frame.confidence, 0) / run.length;
    const halfHopSeconds = (hopSize / 2) / sampleRate;
    segments.push({
      start: Math.max(0, run[0].time - halfHopSeconds),
      end: run[run.length - 1].time + halfHopSeconds,
      expectedHz: referenceHz,
      frameCount: run.length,
      medianAbsDeviationCents: mad,
      averageConfidence,
    });
    totalFrames += run.length;
    weightedConfidence += averageConfidence * run.length;
    segmentDeviations.push(mad);
  }

  if (!segments.length) {
    return null;
  }

  return {
    segments,
    frameCount: totalFrames,
    medianAbsDeviationCents: median(segmentDeviations),
    averageConfidence: weightedConfidence / totalFrames,
  };
}

function buildManifest(options) {
  const context = createContext();
  const selected = selectFiles(options.root, options);
  const samples = [];
  const skipped = [];

  for (const item of selected) {
    try {
      const wav = readWavFile(item.filePath);
      const reference = analyzeReferenceSegments(context, wav, options);
      if (!reference) {
        skipped.push({ file: item.filePath, reason: 'not enough stable high-confidence reference segments' });
        continue;
      }
      samples.push({
        id: `vocalset-${item.meta.basename}`,
        description: `VocalSet ${item.meta.singer} ${item.meta.technique} /${item.meta.vowel}/ long tone, reference estimated from stable middle frames`,
        file: item.filePath,
        ignoreUnlabeled: true,
        segments: reference.segments.map((segment) => ({
          start: Number(segment.start.toFixed(3)),
          end: Number(segment.end.toFixed(3)),
          expectedHz: Number(segment.expectedHz.toFixed(3)),
        })),
        reference: {
          method: 'yin-stable-middle-segments',
          frameCount: reference.frameCount,
          segmentCount: reference.segments.length,
          medianAbsDeviationCents: Number(reference.medianAbsDeviationCents.toFixed(2)),
          averageConfidence: Number(reference.averageConfidence.toFixed(3)),
        },
        expectations: {
          minDetectionRate: 0.65,
          maxAvgAbsCents: 80,
          maxFalsePositiveRate: 0.2,
        },
      });
    } catch (error) {
      skipped.push({ file: item.filePath, reason: error.message });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    source: 'VocalSet11',
    root: options.root,
    notes:
      'References are estimated from stable middle frames with the current YIN detector. Use this as a regression benchmark, not as hand-labeled ground truth.',
    expectations: {
      minDetectionRate: 0.65,
      maxAvgAbsCents: 80,
      maxFalsePositiveRate: 0.2,
    },
    samples,
    skipped,
  };
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

  const manifest = buildManifest(options);
  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.writeFileSync(options.output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${manifest.samples.length} VocalSet sample(s) to ${options.output}`);
  if (manifest.skipped.length) {
    console.log(`Skipped ${manifest.skipped.length} file(s).`);
  }
  if (!manifest.samples.length) {
    process.exitCode = 1;
  }
}

main();
