# Local vocal/accompaniment separation

The browser UI now tries to use a local Demucs server for real vocal/accompaniment separation.

## Install

```powershell
python -m pip install -r requirements-separation.txt
```

The local server uses `static-ffmpeg` to provide `ffmpeg` and `ffprobe` inside
the virtual environment. This avoids depending on a system-wide FFmpeg install.

For GPU acceleration, install a CUDA-enabled PyTorch build that matches your machine before installing or running Demucs.

This machine has been tested with the CUDA 12.8 PyTorch build:

```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade --force-reinstall torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
```

## Start

Recommended app launcher:

```powershell
.\start-app-with-demucs.cmd
```

This starts the local Demucs server if it is not already running, waits for
`http://127.0.0.1:8766/health`, and opens `index.html`.

GPU launcher:

```powershell
.\start-app-with-demucs-gpu.cmd
```

CPU:

```powershell
.\scripts\start-separation-server.cmd
```

GPU:

```powershell
.\scripts\start-separation-server.cmd gpu
```

The default API address is:

```text
http://127.0.0.1:8766/api/separate
```

## Frontend behavior

When you upload a song and click separate, the page first calls the local Demucs server. If it succeeds, the app saves:

- `*-vocals.wav` into the recording/song library
- `*-no_vocals.wav` into the accompaniment library

If the local server is not running or Demucs fails, the page falls back to the old browser-side Mid/Side candidate split so the button still produces usable draft material.

On newer `torchaudio` builds, direct `torchaudio.save`/`load` can require
TorchCodec shared FFmpeg DLLs on Windows. The local server runs Demucs through
`scripts/run_demucs_compat.py`, which keeps Demucs model inference unchanged but
writes WAV outputs with Python's standard WAV writer.

## Options

Use environment variables to tune the backend:

```powershell
$env:SEPARATION_MODEL = "htdemucs_ft"
$env:SEPARATION_DEVICE = "cuda"
$env:SEPARATION_TIMEOUT_SECONDS = "1200"
.\scripts\start-separation-server.cmd
```

Common Demucs models include `htdemucs`, `htdemucs_ft`, and `mdx_extra`.
