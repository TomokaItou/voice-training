@echo off
setlocal
set "NODE_TO_USE=%NODE_EXE%"
if not defined NODE_TO_USE set "NODE_TO_USE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%NODE_TO_USE%" (
  "%NODE_TO_USE%" "%~dp0build-ai-vocal-teacher-ts.js"
) else (
  node "%~dp0build-ai-vocal-teacher-ts.js"
)
exit /b %ERRORLEVEL%
