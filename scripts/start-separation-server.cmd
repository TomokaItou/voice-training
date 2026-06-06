@echo off
setlocal
cd /d "%~dp0.."
if /I "%~1"=="gpu" (
  set "SEPARATION_DEVICE=cuda"
  shift /1
)

set "SERVER_ARGS="
:collect_args
if "%~1"=="" goto run_server
set SERVER_ARGS=%SERVER_ARGS% "%~1"
shift /1
goto collect_args

:run_server
if exist ".venv\Scripts\python.exe" (
  set "PYTHON=%CD%\.venv\Scripts\python.exe"
  ".venv\Scripts\python.exe" "scripts\separation_server.py" %SERVER_ARGS%
) else (
  set "PYTHON=python"
  python "scripts\separation_server.py" %SERVER_ARGS%
)
