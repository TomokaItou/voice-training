@echo off
setlocal
cd /d "%~dp0.."
if /I "%~1"=="gpu" (
  set "SEPARATION_DEVICE=cuda"
  shift /1
)
if exist ".venv\Scripts\python.exe" (
  set "PYTHON=%CD%\.venv\Scripts\python.exe"
  ".venv\Scripts\python.exe" "scripts\separation_server.py" %*
) else (
  set "PYTHON=python"
  python "scripts\separation_server.py" %*
)
