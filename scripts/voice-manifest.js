const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const defaultSamplesDir = path.join(projectRoot, 'samples', 'voice-benchmark');
const defaultManifestPath = path.join(defaultSamplesDir, 'manifest.json');
const defaultExpectations = {
  minDetectionRate: 0.7,
  maxAvgAbsCents: 55,
  maxFalsePositiveRate: 0.15,
};
const noteOffsets = {
  c: -9,
  'c#': -8,
  db: -8,
  d: -7,
  'd#': -6,
  eb: -6,
  e: -5,
  f: -4,
  'f#': -3,
  gb: -3,
  g: -2,
  'g#': -1,
  ab: -1,
  a: 0,
  'a#': 1,
  bb: 1,
  b: 2,
};

function parseArgs(argv) {
  const options = {
    command: null,
    samplesDir: defaultSamplesDir,
    manifestPath: defaultManifestPath,
    overwrite: false,
    quiet: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--generate' || arg === 'generate') {
      options.command = 'generate';
    } else if (arg === '--validate' || arg === 'validate') {
      options.command = 'validate';
    } else if (arg === '--samples-dir') {
      options.samplesDir = path.resolve(requireValue(argv, (i += 1), '--samples-dir'));
    } else if (arg.startsWith('--samples-dir=')) {
      options.samplesDir = path.resolve(arg.slice('--samples-dir='.length));
    } else if (arg === '--manifest') {
      options.manifestPath = path.resolve(requireValue(argv, (i += 1), '--manifest'));
    } else if (arg.startsWith('--manifest=')) {
      options.manifestPath = path.resolve(arg.slice('--manifest='.length));
    } else if (arg === '--overwrite') {
      options.overwrite = true;
    } else if (arg === '--quiet') {
      options.quiet = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.command && !options.help) {
    options.command = 'validate';
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

function printUsage() {
  console.log('Usage: voice-manifest.cmd --generate|--validate [--samples-dir path] [--manifest path] [--overwrite]');
  console.log('');
  console.log('Examples:');
  console.log('  .\\scripts\\voice-manifest.cmd --generate');
  console.log('  .\\scripts\\voice-manifest.cmd --validate');
  console.log('  .\\scripts\\voice-manifest.cmd --validate --manifest .\\samples\\voice-benchmark\\manifest.json');
}

function readAscii(buffer, offset, length) {
  return buffer.toString('ascii', offset, offset + length);
}

function readWavInfo(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 44 || readAscii(bytes, 0, 4) !== 'RIFF' || readAscii(bytes, 8, 4) !== 'WAVE') {
    throw new Error('not a RIFF/WAVE file');
  }

  let offset = 12;
  let fmt = null;
  let dataSize = null;
  while (offset + 8 <= bytes.length) {
    const chunkId = readAscii(bytes, offset, 4);
    const chunkSize = bytes.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    if (chunkStart + chunkSize > bytes.length) {
      throw new Error(`invalid WAV chunk ${chunkId}`);
    }

    if (chunkId === 'fmt ') {
      fmt = {
        audioFormat: bytes.readUInt16LE(chunkStart),
        channels: bytes.readUInt16LE(chunkStart + 2),
        sampleRate: bytes.readUInt32LE(chunkStart + 4),
        bitsPerSample: bytes.readUInt16LE(chunkStart + 14),
      };
    } else if (chunkId === 'data') {
      dataSize = chunkSize;
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (!fmt) {
    throw new Error('missing fmt chunk');
  }
  if (!dataSize) {
    throw new Error('missing data chunk');
  }
  if (![1, 3].includes(fmt.audioFormat)) {
    throw new Error(`unsupported WAV format ${fmt.audioFormat}`);
  }
  if (!fmt.channels || !fmt.sampleRate || !fmt.bitsPerSample) {
    throw new Error('invalid WAV format metadata');
  }

  const bytesPerSample = fmt.bitsPerSample / 8;
  const frameCount = dataSize / Math.max(1, fmt.channels * bytesPerSample);
  return {
    channels: fmt.channels,
    sampleRate: fmt.sampleRate,
    bitsPerSample: fmt.bitsPerSample,
    durationSeconds: frameCount / fmt.sampleRate,
  };
}

function slugFromFileName(fileName) {
  return path
    .basename(fileName, path.extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'voice-sample';
}

function noteToHz(noteText) {
  const match = /^([a-g])([#b]?)(-?\d)$/i.exec(noteText);
  if (!match) {
    return null;
  }
  const key = `${match[1].toLowerCase()}${match[2].toLowerCase()}`;
  const octave = Number(match[3]);
  const offset = noteOffsets[key];
  if (!Number.isFinite(offset) || !Number.isFinite(octave)) {
    return null;
  }
  const semitonesFromA4 = (octave - 4) * 12 + offset;
  return Math.round(440 * 2 ** (semitonesFromA4 / 12) * 1000) / 1000;
}

function inferExpectedHz(fileName) {
  const base = path.basename(fileName, path.extname(fileName)).toLowerCase();
  const notePattern = /(^|[^a-g0-9])([a-g][#b]?-?\d)(?=$|[^a-g0-9])/g;
  const notes = [];
  let match;
  while ((match = notePattern.exec(base)) !== null) {
    const hz = noteToHz(match[2]);
    if (Number.isFinite(hz)) {
      notes.push(hz);
    }
  }

  if (notes.length >= 2 && /(slide|siren|glide|滑|hua)/i.test(base)) {
    return [notes[0], notes[1]];
  }
  if (notes.length >= 1) {
    return notes[0];
  }
  return null;
}

function createSample(fileName, info) {
  const expectedHz = inferExpectedHz(fileName);
  const duration = Math.max(0, Math.round(info.durationSeconds * 1000) / 1000);
  const start = duration > 0.7 ? 0.2 : 0;
  const end = duration > 0.7 ? Math.max(start + 0.1, duration - 0.2) : duration;
  const segment = {
    start: Math.round(start * 1000) / 1000,
    end: Math.round(end * 1000) / 1000,
    expectedHz,
  };
  if (expectedHz === null) {
    segment.voiced = false;
  }

  return {
    id: slugFromFileName(fileName),
    description: expectedHz === null
      ? `Voice sample ${path.basename(fileName)}; fill expectedHz before benchmark use`
      : `Voice sample ${path.basename(fileName)}`,
    file: fileName,
    segments: [segment],
    expectations: { ...defaultExpectations },
  };
}

function listWavFiles(samplesDir) {
  if (!fs.existsSync(samplesDir)) {
    throw new Error(`Samples directory not found: ${samplesDir}`);
  }
  return fs
    .readdirSync(samplesDir)
    .filter((fileName) => fileName.toLowerCase().endsWith('.wav'))
    .sort((a, b) => a.localeCompare(b));
}

function generateManifest(options) {
  if (fs.existsSync(options.manifestPath) && !options.overwrite) {
    throw new Error(`Manifest already exists: ${options.manifestPath}. Use --overwrite to replace it.`);
  }

  const samples = [];
  const warnings = [];
  for (const fileName of listWavFiles(options.samplesDir)) {
    const filePath = path.join(options.samplesDir, fileName);
    try {
      const info = readWavInfo(filePath);
      samples.push(createSample(fileName, info));
    } catch (error) {
      warnings.push(`${fileName}: ${error.message}`);
    }
  }

  const manifest = {
    expectations: { ...defaultExpectations },
    samples,
  };
  fs.mkdirSync(path.dirname(options.manifestPath), { recursive: true });
  fs.writeFileSync(options.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${samples.length} sample(s) to ${options.manifestPath}`);
  if (warnings.length) {
    console.log('Warnings:');
    warnings.forEach((warning) => console.log(`  - ${warning}`));
  }
  if (!samples.length) {
    console.log(`No wav files found in ${options.samplesDir}`);
  }
}

function isNumberInRange(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function validateExpectations(expectations, label, issues) {
  if (!expectations) {
    return;
  }
  if (!isNumberInRange(Number(expectations.minDetectionRate), 0, 1)) {
    issues.push(`${label}.expectations.minDetectionRate must be between 0 and 1`);
  }
  if (!isNumberInRange(Number(expectations.maxFalsePositiveRate), 0, 1)) {
    issues.push(`${label}.expectations.maxFalsePositiveRate must be between 0 and 1`);
  }
  if (
    expectations.maxAvgAbsCents !== null &&
    (!Number.isFinite(Number(expectations.maxAvgAbsCents)) || Number(expectations.maxAvgAbsCents) < 0)
  ) {
    issues.push(`${label}.expectations.maxAvgAbsCents must be null or a non-negative number`);
  }
}

function validateExpectedHz(expectedHz, label, issues) {
  if (expectedHz === null) {
    return;
  }
  if (Array.isArray(expectedHz)) {
    if (
      expectedHz.length !== 2 ||
      !Number.isFinite(Number(expectedHz[0])) ||
      !Number.isFinite(Number(expectedHz[1])) ||
      Number(expectedHz[0]) <= 0 ||
      Number(expectedHz[1]) <= 0
    ) {
      issues.push(`${label}.expectedHz must be null, a positive number, or [startHz, endHz]`);
    }
    return;
  }
  if (!Number.isFinite(Number(expectedHz)) || Number(expectedHz) <= 0) {
    issues.push(`${label}.expectedHz must be null, a positive number, or [startHz, endHz]`);
  }
}

function validateManifest(options) {
  if (!fs.existsSync(options.manifestPath)) {
    throw new Error(`Manifest not found: ${options.manifestPath}`);
  }

  const manifestRoot = path.dirname(options.manifestPath);
  const manifest = JSON.parse(fs.readFileSync(options.manifestPath, 'utf8').replace(/^\uFEFF/, ''));
  const samples = Array.isArray(manifest.samples) ? manifest.samples : null;
  const issues = [];
  const warnings = [];
  const ids = new Set();

  if (!samples) {
    issues.push('manifest.samples must be an array');
  }
  validateExpectations(manifest.expectations || defaultExpectations, 'manifest', issues);

  (samples || []).forEach((sample, index) => {
    const label = `samples[${index}]`;
    if (!sample || typeof sample !== 'object') {
      issues.push(`${label} must be an object`);
      return;
    }
    if (!sample.id || typeof sample.id !== 'string') {
      issues.push(`${label}.id is required`);
    } else if (ids.has(sample.id)) {
      issues.push(`${label}.id duplicates '${sample.id}'`);
    } else {
      ids.add(sample.id);
    }
    if (!sample.file || typeof sample.file !== 'string') {
      issues.push(`${label}.file is required`);
    }
    if (!Array.isArray(sample.segments) || !sample.segments.length) {
      issues.push(`${label}.segments must be a non-empty array`);
    }
    validateExpectations(sample.expectations, label, issues);

    let wavInfo = null;
    if (sample.file) {
      const audioPath = path.resolve(manifestRoot, sample.file);
      if (!fs.existsSync(audioPath)) {
        issues.push(`${label}.file not found: ${sample.file}`);
      } else if (path.extname(audioPath).toLowerCase() !== '.wav') {
        warnings.push(`${label}.file is not wav; pitch-benchmark currently expects wav: ${sample.file}`);
      } else {
        try {
          wavInfo = readWavInfo(audioPath);
        } catch (error) {
          issues.push(`${label}.file is not readable WAV: ${error.message}`);
        }
      }
    }

    let voicedSegments = 0;
    (sample.segments || []).forEach((segment, segmentIndex) => {
      const segmentLabel = `${label}.segments[${segmentIndex}]`;
      const start = Number(segment.start);
      const end = Number(segment.end);
      if (!Number.isFinite(start) || start < 0) {
        issues.push(`${segmentLabel}.start must be a non-negative number`);
      }
      if (!Number.isFinite(end) || end <= start) {
        issues.push(`${segmentLabel}.end must be greater than start`);
      }
      if (wavInfo && Number.isFinite(end) && end > wavInfo.durationSeconds + 0.001) {
        issues.push(`${segmentLabel}.end exceeds audio duration ${wavInfo.durationSeconds.toFixed(3)}s`);
      }
      validateExpectedHz(segment.expectedHz, segmentLabel, issues);
      if (segment.expectedHz !== null && segment.voiced !== false) {
        voicedSegments += 1;
      }
    });
    if (!voicedSegments) {
      warnings.push(`${label} has no voiced expectedHz segments`);
    }
  });

  if (issues.length) {
    console.log('Voice manifest validation failed.');
    issues.forEach((issue) => console.log(`  - ${issue}`));
    if (warnings.length) {
      console.log('');
      console.log('Warnings:');
      warnings.forEach((warning) => console.log(`  - ${warning}`));
    }
    process.exit(1);
  }

  if (!options.quiet) {
    console.log(`Voice manifest validation passed: ${options.manifestPath}`);
    console.log(`Samples: ${(samples || []).length}`);
    if (warnings.length) {
      console.log('');
      console.log('Warnings:');
      warnings.forEach((warning) => console.log(`  - ${warning}`));
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }
  if (options.command === 'generate') {
    generateManifest(options);
  } else {
    validateManifest(options);
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
