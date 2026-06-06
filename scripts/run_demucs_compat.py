"""Run Demucs while avoiding torchaudio's TorchCodec WAV writer on Windows."""

from __future__ import annotations

import sys
import wave
from pathlib import Path

import numpy as np

from demucs import separate
from demucs.audio import prevent_clip


def save_wav_compat(
    wav,
    path,
    samplerate,
    bitrate=320,
    clip="rescale",
    bits_per_sample=16,
    as_float=False,
    preset=2,
):
    del bitrate, bits_per_sample, as_float, preset

    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    wav = prevent_clip(wav, mode=clip).detach().cpu()
    if wav.ndim == 1:
        wav = wav.unsqueeze(0)
    if wav.ndim != 2:
        raise ValueError(f"Expected audio tensor with shape [channels, samples], got {tuple(wav.shape)}")

    samples = wav.clamp(-1, 1).transpose(0, 1).numpy()
    pcm = np.where(samples < 0, samples * 32768, samples * 32767).astype("<i2")

    with wave.open(str(output_path), "wb") as file:
        file.setnchannels(wav.shape[0])
        file.setsampwidth(2)
        file.setframerate(int(samplerate))
        file.writeframes(pcm.tobytes())


def main() -> int:
    separate.save_audio = save_wav_compat
    result = separate.main(sys.argv[1:])
    return int(result or 0)


if __name__ == "__main__":
    raise SystemExit(main())
