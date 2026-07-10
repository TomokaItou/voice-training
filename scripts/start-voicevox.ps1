$ErrorActionPreference = "Stop"

$engineRoot = "C:\Users\25110\Projects\code\tools\voicevox_engine_0.25.2\engine\windows-cpu"
$runExe = Join-Path $engineRoot "run.exe"
$endpoint = "http://127.0.0.1:50021"

if (-not (Test-Path $runExe)) {
  throw "VOICEVOX Engine not found: $runExe"
}

try {
  $version = (Invoke-WebRequest -UseBasicParsing -Uri "$endpoint/version" -TimeoutSec 2).Content
  Write-Host "VOICEVOX Engine already running at $endpoint (version $version)"
  exit 0
} catch {
  Write-Host "Starting VOICEVOX Engine..."
}

Start-Process -FilePath $runExe -ArgumentList "--host", "127.0.0.1", "--port", "50021" -WorkingDirectory $engineRoot -WindowStyle Hidden

for ($i = 0; $i -lt 60; $i++) {
  try {
    $version = (Invoke-WebRequest -UseBasicParsing -Uri "$endpoint/version" -TimeoutSec 2).Content
    Write-Host "VOICEVOX Engine started at $endpoint (version $version)"
    exit 0
  } catch {
    Start-Sleep -Seconds 2
  }
}

throw "VOICEVOX Engine did not respond at $endpoint"
