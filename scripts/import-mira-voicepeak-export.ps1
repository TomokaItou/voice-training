param(
  [Parameter(Mandatory = $true)]
  [string]$SourceDir,
  [string]$ProjectRoot
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $ProjectRoot = (Resolve-Path (Join-Path $scriptDir '..')).Path
}

$source = Resolve-Path $SourceDir
$root = Resolve-Path $ProjectRoot
$voiceRoot = Join-Path $root 'assets\mira-voice'
$manifestPath = Join-Path $voiceRoot 'manifest.json'

if (-not (Test-Path $manifestPath)) {
  throw "Missing Mira voice manifest: $manifestPath"
}

$manifest = Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$copied = New-Object System.Collections.Generic.List[string]
$missing = New-Object System.Collections.Generic.List[string]

foreach ($property in $manifest.PSObject.Properties) {
  $speechId = $property.Name
  $entry = $property.Value
  $targetRelative = [string]$entry.file
  if ([string]::IsNullOrWhiteSpace($targetRelative)) {
    continue
  }

  $targetPath = Join-Path $voiceRoot $targetRelative
  $targetDir = Split-Path $targetPath -Parent
  New-Item -ItemType Directory -Force $targetDir | Out-Null

  $leafName = Split-Path $targetRelative -Leaf
  $candidateNames = @(
    $leafName,
    "$speechId.wav",
    "$($speechId.Replace('.', '_')).wav"
  )

  $sourcePath = $null
  foreach ($candidateName in $candidateNames) {
    $candidate = Join-Path $source $candidateName
    if (Test-Path $candidate) {
      $sourcePath = Resolve-Path $candidate
      break
    }
  }

  if (-not $sourcePath) {
    $missing.Add("$speechId -> $targetRelative") | Out-Null
    continue
  }

  Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
  $copied.Add("$speechId <- $sourcePath") | Out-Null
}

Write-Host "[mira-voice] Copied $($copied.Count) file(s)."
foreach ($item in $copied) {
  Write-Host "  + $item"
}

if ($missing.Count -gt 0) {
  Write-Host ""
  Write-Host "[mira-voice] Missing $($missing.Count) file(s):"
  foreach ($item in $missing) {
    Write-Host "  - $item"
  }
  exit 2
}

Write-Host "[mira-voice] All manifest WAV files are present."
