param(
  [string]$ToolsRoot = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path 'tools'),
  [string]$NodeVersion = '24.16.0',
  [string]$AndroidCommandLineToolsVersion = '14742923'
)

$ErrorActionPreference = 'Stop'

function Download-File {
  param(
    [string]$Url,
    [string]$Destination
  )

  if (Test-Path $Destination) {
    Write-Host "[toolchain] Reusing $Destination"
    return
  }

  Write-Host "[toolchain] Downloading $Url"
  Invoke-WebRequest -Uri $Url -OutFile $Destination
}

$tools = Join-Path (Resolve-Path (Split-Path $ToolsRoot -Parent)) (Split-Path $ToolsRoot -Leaf)
$downloads = Join-Path $tools 'downloads'
$nodeRoot = Join-Path $tools "node-v$NodeVersion-win-x64"
$androidHome = Join-Path $tools 'android-sdk'
$cmdlineLatest = Join-Path $androidHome 'cmdline-tools\latest'

New-Item -ItemType Directory -Force -Path $tools, $downloads, $androidHome | Out-Null

$nodeZip = Join-Path $downloads "node-v$NodeVersion-win-x64.zip"
$nodeUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip"
Download-File -Url $nodeUrl -Destination $nodeZip

if (-not (Test-Path (Join-Path $nodeRoot 'npm.cmd'))) {
  Write-Host "[toolchain] Extracting Node.js"
  Expand-Archive -LiteralPath $nodeZip -DestinationPath $tools -Force
}

$cmdlineZip = Join-Path $downloads "commandlinetools-win-$AndroidCommandLineToolsVersion`_latest.zip"
$cmdlineUrl = "https://dl.google.com/android/repository/commandlinetools-win-$AndroidCommandLineToolsVersion`_latest.zip"
Download-File -Url $cmdlineUrl -Destination $cmdlineZip

if (-not (Test-Path (Join-Path $cmdlineLatest 'bin\sdkmanager.bat'))) {
  $tmpCmdline = Join-Path $tools 'cmdline-tools-extract'
  if (Test-Path $tmpCmdline) {
    Remove-Item -LiteralPath $tmpCmdline -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $tmpCmdline | Out-Null
  Write-Host "[toolchain] Extracting Android command-line tools"
  Expand-Archive -LiteralPath $cmdlineZip -DestinationPath $tmpCmdline -Force
  New-Item -ItemType Directory -Force -Path (Split-Path $cmdlineLatest -Parent) | Out-Null
  if (Test-Path $cmdlineLatest) {
    Remove-Item -LiteralPath $cmdlineLatest -Recurse -Force
  }
  Move-Item -LiteralPath (Join-Path $tmpCmdline 'cmdline-tools') -Destination $cmdlineLatest
  Remove-Item -LiteralPath $tmpCmdline -Recurse -Force
}

$env:ANDROID_HOME = $androidHome
$env:ANDROID_SDK_ROOT = $androidHome
$env:PATH = "$nodeRoot;$cmdlineLatest\bin;$androidHome\platform-tools;$env:PATH"

Write-Host "[toolchain] Accepting Android SDK licenses"
$yes = New-Object string[] 80
for ($i = 0; $i -lt $yes.Length; $i++) {
  $yes[$i] = 'y'
}
$yes | & (Join-Path $cmdlineLatest 'bin\sdkmanager.bat') --licenses

Write-Host "[toolchain] Installing Android SDK packages"
& (Join-Path $cmdlineLatest 'bin\sdkmanager.bat') `
  'platform-tools' `
  'platforms;android-36' `
  'build-tools;36.0.0'

Write-Host ""
Write-Host "Toolchain ready."
Write-Host "Node: $nodeRoot"
Write-Host "Android SDK: $androidHome"
