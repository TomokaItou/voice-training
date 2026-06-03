@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0validate-local.ps1" %*
exit /b %ERRORLEVEL%
