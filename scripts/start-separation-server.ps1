param(
  [switch]$Gpu
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$VenvPython = Join-Path $ProjectRoot '.venv\Scripts\python.exe'
$Python = if (Test-Path $VenvPython) { $VenvPython } else { 'python' }

Set-Location $ProjectRoot

if ($Gpu) {
  $env:SEPARATION_DEVICE = 'cuda'
}

$env:PYTHON = $Python
& $Python (Join-Path $ProjectRoot 'scripts\separation_server.py') @args
