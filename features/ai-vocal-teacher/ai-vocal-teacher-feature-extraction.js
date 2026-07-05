function aiTeacherMean(values) {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) return 0;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function aiTeacherStd(values) {
  const clean = values.filter(Number.isFinite);
  if (clean.length < 2) return 0;
  const mean = aiTeacherMean(clean);
  return Math.sqrt(aiTeacherMean(clean.map((value) => (value - mean) ** 2)));
}

function aiTeacherSpectralCentroid(samples, sampleRate) {
  let weighted = 0;
  let total = 0;
  const maxLag = Math.min(samples.length, 512);
  for (let i = 1; i < maxLag; i += 1) {
    const diff = Math.abs(samples[i] - samples[i - 1]);
    const proxyHz = (i / maxLag) * (sampleRate / 2);
    weighted += proxyHz * diff;
    total += diff;
  }
  return total > 0 ? weighted / total : 0;
}

function aiTeacherSpectralTilt(samples, sampleRate) {
  let low = 0;
  let high = 0;
  const maxLag = Math.min(samples.length, 1024);
  for (let i = 1; i < maxLag; i += 1) {
    const energy = Math.abs(samples[i] - samples[i - 1]);
    const proxyHz = (i / maxLag) * (sampleRate / 2);
    if (proxyHz >= 200 && proxyHz <= 900) low += energy;
    if (proxyHz >= 2200 && proxyHz <= 5000) high += energy;
  }
  return 20 * Math.log10((low + 1e-6) / (high + 1e-6));
}

function aiTeacherEncodeWav(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const channelCount = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * channelCount * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  function writeString(offset, value) {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channelCount * 2, true);
  view.setUint16(32, channelCount * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);

  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i] || 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

async function aiTeacherExtractFeatureVector({ blob, taskId, attemptId, timestamp, audioPath }) {
  const audioBuffer = await decodeAudioBlob(blob);
  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const frameSize = Math.max(1024, Math.floor(sampleRate * 0.046));
  const hopSize = Math.max(512, Math.floor(frameSize / 2));
  const pitches = [];
  const loudness = [];
  const centroids = [];
  const tilts = [];
  const harmonicity = [];

  for (let start = 0; start + frameSize <= data.length; start += hopSize) {
    const frame = data.subarray(start, start + frameSize);
    const rms = typeof computeRms === 'function' ? computeRms(frame) : Math.sqrt(aiTeacherMean([...frame].map((v) => v * v)));
    if (rms < 0.002) continue;
    const pitchResult = typeof estimatePitchYinWithConfidence === 'function'
      ? estimatePitchYinWithConfidence(frame, sampleRate, rms)
      : { pitch: null, confidence: 0 };
    if (Number.isFinite(pitchResult.pitch) && pitchResult.pitch > 0) {
      pitches.push(pitchResult.pitch);
    }
    loudness.push(20 * Math.log10(rms + 1e-6));
    centroids.push(aiTeacherSpectralCentroid(frame, sampleRate));
    tilts.push(aiTeacherSpectralTilt(frame, sampleRate));
    harmonicity.push(pitchResult.confidence || 0);
  }

  const features = {
    pitch_mean: aiTeacherMean(pitches),
    pitch_std: aiTeacherStd(pitches),
    loudness_mean: aiTeacherMean(loudness),
    loudness_std: aiTeacherStd(loudness),
    spectral_centroid_mean: aiTeacherMean(centroids),
    spectral_tilt_mean: aiTeacherMean(tilts),
    harmonicity_mean: aiTeacherMean(harmonicity),
  };

  Object.keys(features).forEach((key) => {
    if (!Number.isFinite(features[key])) {
      delete features[key];
    }
  });

  return {
    taskId,
    attemptId,
    audioPath,
    timestamp,
    features,
    durationMs: audioBuffer.duration * 1000,
    sampleRate,
  };
}

window.aiTeacherEncodeWav = aiTeacherEncodeWav;
window.aiTeacherExtractFeatureVector = aiTeacherExtractFeatureVector;
window.aiTeacherMean = aiTeacherMean;
window.aiTeacherStd = aiTeacherStd;
