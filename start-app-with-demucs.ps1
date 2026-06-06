param(
  [switch]$Gpu
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = $PSScriptRoot
$HealthUri = 'http://127.0.0.1:8766/health'
$AppEntry = Join-Path $ProjectRoot 'index.html'
$VenvPython = Join-Path $ProjectRoot '.venv\Scripts\python.exe'
$ExpectedPython = if (Test-Path $VenvPython) { (Resolve-Path $VenvPython).Path } else { 'python' }

function Get-SeparationHealth {
  try {
    return Invoke-RestMethod -UseBasicParsing -Uri $HealthUri -TimeoutSec 1
  } catch {
    return $null
  }
}

function Test-SeparationHealth {
  param([object]$Health)

  if (-not $Health -or -not $Health.ok -or -not $Health.demucs_available) {
    return $false
  }

  if ($Health.demucs_python) {
    try {
      $actualPython = (Resolve-Path $Health.demucs_python).Path
      if ($actualPython -ne $ExpectedPython) {
        return $false
      }
    } catch {
      return $false
    }
  } else {
    return $false
  }

  if ($Gpu -and (-not $Health.cuda_available -or $Health.separation_device -ne 'cuda')) {
    return $false
  }

  return $true
}

function Get-SeparationListenerPid {
  try {
    $connection = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 8766 -State Listen -ErrorAction Stop |
      Select-Object -First 1
    return $connection.OwningProcess
  } catch {
    $line = netstat -ano | Select-String '127\.0\.0\.1:8766\s+0\.0\.0\.0:0\s+LISTENING' | Select-Object -First 1
    if ($line -and $line.Line -match '\s+(\d+)\s*$') {
      return [int]$Matches[1]
    }
  }
  return $null
}

function Stop-StaleSeparationServer {
  $listenerPid = Get-SeparationListenerPid
  if (-not $listenerPid) {
    return
  }

  Write-Host "Stopping incompatible service on Demucs port 8766 (PID $listenerPid)..."
  Stop-Process -Id $listenerPid -Force -ErrorAction SilentlyContinue
}

function Start-SeparationServer {
  Set-Location $ProjectRoot
  if ($Gpu) {
    $env:SEPARATION_DEVICE = 'cuda'
  }
  $env:PYTHON = $ExpectedPython
  Write-Host "Starting local Demucs separation server in this window..."
  Write-Host "Keep this window open while using vocal/accompaniment separation."
  & $ExpectedPython (Join-Path $ProjectRoot 'scripts\separation_server.py')
}

$health = Get-SeparationHealth
if (-not (Test-SeparationHealth $health)) {
  if ($health) {
    Write-Host "Existing Demucs health check is incompatible with this launcher."
  }
  Stop-StaleSeparationServer
  Start-Sleep -Milliseconds 300
  Start-Process -FilePath $AppEntry
  Start-SeparationServer
  exit $LASTEXITCODE
}

Write-Host "Compatible Demucs server is already running."
Start-Process -FilePath $AppEntry
