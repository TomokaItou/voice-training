@echo off
setlocal
cd /d "%~dp0.."
if /I "%~1"=="gpu" (
  set "WHISPER_DEVICE=cuda"
  set "WHISPER_COMPUTE_TYPE=float16"
  shift /1
)
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" "scripts\lyrics_whisper_server.py" %*
) else (
  python "scripts\lyrics_whisper_server.py" %*
)
