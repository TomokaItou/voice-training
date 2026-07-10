@echo off
setlocal

cd /d "%~dp0"

set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%BUNDLED_NODE%" (
  set "NODE_EXE=%BUNDLED_NODE%"
) else (
  set "NODE_EXE=node"
)

echo Starting Mira local dev server...
echo.
echo Project: %CD%
echo URL:     http://127.0.0.1:4173/
echo.
echo Keep this window open while using the app.
echo Press Ctrl+C here to stop the server.
echo.

start "Open Mira App" cmd /c "timeout /t 2 /nobreak >nul & start "" "http://127.0.0.1:4173/""
"%NODE_EXE%" scripts\local-static-server.js

echo.
echo Server stopped. Press any key to close this window.
pause >nul
