param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$OutputDir = (Join-Path $ProjectRoot 'dist-mobile')
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path $ProjectRoot
$output = Join-Path $root 'dist-mobile'
if (-not [string]::IsNullOrWhiteSpace($OutputDir)) {
  $output = $OutputDir
}

$excludeDirectories = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
@(
  '.git',
  '.venv',
  'android',
  'dist-mobile',
  'node_modules',
  'samples',
  'scripts'
) | ForEach-Object { [void]$excludeDirectories.Add($_) }

$excludeFiles = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
@(
  '.gitignore',
  'capacitor.config.json',
  'MOBILE_APP.md',
  'MOBILE_NATIVE.md',
  'package-lock.json',
  'package.json',
  'README.md',
  'requirements-separation.txt',
  'requirements-whisper.txt',
  'SEPARATION.md',
  'start-app-with-demucs-gpu.cmd',
  'start-app-with-demucs.cmd',
  'start-app-with-demucs.ps1'
) | ForEach-Object { [void]$excludeFiles.Add($_) }

if (Test-Path $output) {
  Remove-Item -LiteralPath $output -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $output | Out-Null

Get-ChildItem -LiteralPath $root -Force | ForEach-Object {
  if ($_.PSIsContainer) {
    if ($excludeDirectories.Contains($_.Name)) {
      return
    }
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $output $_.Name) -Recurse -Force
    return
  }

  if ($excludeFiles.Contains($_.Name)) {
    return
  }
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $output $_.Name) -Force
}

Write-Host "Mobile web assets written to $output"
