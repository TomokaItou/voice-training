@echo off
setlocal
set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%BUNDLED_NODE%" (
  set "NODE_EXE=%BUNDLED_NODE%"
) else (
  set "NODE_EXE=node"
)

"%NODE_EXE%" "%~dp0voice-manifest.js" %*
exit /b %ERRORLEVEL%
