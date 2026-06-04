param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$NodePath = $env:NODE_EXE,
  [switch]$SkipBenchmark
)

$ErrorActionPreference = 'Stop'

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Command
  )

  Write-Host ""
  Write-Host "[quality] $Name"
  & $Command
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

$scriptRoot = $PSScriptRoot

Invoke-Step "Local validation" {
  & (Join-Path $scriptRoot 'validate-local.ps1') -ProjectRoot $ProjectRoot -NodePath $NodePath
}

if (-not $SkipBenchmark) {
  Invoke-Step "Quick pitch benchmark" {
    & (Join-Path $scriptRoot 'pitch-benchmark.cmd') --quick
  }
} else {
  Write-Host ""
  Write-Host "[quality] Skipped quick pitch benchmark because -SkipBenchmark was supplied."
}

Write-Host ""
Write-Host "Quality gate passed."
exit 0
