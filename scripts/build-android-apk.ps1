param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

function Require-Command {
  param(
    [string]$Name,
    [string]$InstallHint
  )

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  throw "$Name was not found. $InstallHint"
}

$root = Resolve-Path $ProjectRoot
Set-Location $root

$workspaceTools = Join-Path (Resolve-Path (Join-Path $root '..\..')).Path 'tools'
$portableNode = Get-ChildItem -LiteralPath $workspaceTools -Directory -Filter 'node-v*-win-x64' -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending |
  Select-Object -First 1
$portableAndroidSdk = Join-Path $workspaceTools 'android-sdk'

if ($portableNode -and (Test-Path (Join-Path $portableNode.FullName 'npm.cmd'))) {
  $env:PATH = "$($portableNode.FullName);$env:PATH"
}

if ((Test-Path $portableAndroidSdk) -and [string]::IsNullOrWhiteSpace($env:ANDROID_HOME)) {
  $env:ANDROID_HOME = $portableAndroidSdk
  $env:ANDROID_SDK_ROOT = $portableAndroidSdk
}

if (-not [string]::IsNullOrWhiteSpace($env:ANDROID_HOME)) {
  $env:PATH = "$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
}

Write-Host "[android] Checking tools..."
$npmPath = Require-Command 'npm' 'Install Node.js LTS from https://nodejs.org/ and reopen PowerShell.'
[void](Require-Command 'java' 'Install JDK 17 or newer.')

if ([string]::IsNullOrWhiteSpace($env:ANDROID_HOME) -and [string]::IsNullOrWhiteSpace($env:ANDROID_SDK_ROOT)) {
  throw 'Android SDK was not found. Install Android Studio, then set ANDROID_HOME or ANDROID_SDK_ROOT to the SDK path.'
}

Write-Host "[android] Installing JavaScript dependencies when needed..."
if (-not (Test-Path (Join-Path $root 'node_modules'))) {
  & $npmPath install
}

Write-Host "[android] Preparing mobile web assets..."
& $npmPath run mobile:prepare

if (-not (Test-Path (Join-Path $root 'android'))) {
  Write-Host "[android] Creating Android project..."
  & $npmPath run android:add
} else {
  Write-Host "[android] Syncing Android project..."
  & $npmPath run android:sync
}

Write-Host "[android] Building debug APK..."
Set-Location (Join-Path $root 'android')
& .\gradlew.bat assembleDebug

$apkPath = Join-Path $root 'android\app\build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $apkPath)) {
  throw "Build finished but APK was not found at $apkPath"
}

Write-Host ""
Write-Host "APK ready:"
Write-Host $apkPath
