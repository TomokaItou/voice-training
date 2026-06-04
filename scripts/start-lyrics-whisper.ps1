param(
  [switch]$Gpu
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$VenvPython = Join-Path $ProjectRoot '.venv\Scripts\python.exe'
$Python = if (Test-Path $VenvPython) { $VenvPython } else { 'python' }

Set-Location $ProjectRoot

if ($Gpu) {
  $env:WHISPER_DEVICE = 'cuda'
  $env:WHISPER_COMPUTE_TYPE = 'float16'
}

& $Python (Join-Path $ProjectRoot 'scripts\lyrics_whisper_server.py') @args
