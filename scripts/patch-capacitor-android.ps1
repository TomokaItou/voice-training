param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

$manifestPath = Join-Path $ProjectRoot 'android\app\src\main\AndroidManifest.xml'
if (-not (Test-Path $manifestPath)) {
  throw "AndroidManifest.xml not found. Run npm run android:add first."
}

[xml]$manifest = Get-Content -Encoding UTF8 $manifestPath
$androidNamespace = 'http://schemas.android.com/apk/res/android'
$manifestElement = $manifest.manifest

function Ensure-Permission {
  param([string]$Name)

  $existing = $manifestElement.'uses-permission' | Where-Object {
    $_.GetAttribute('name', $androidNamespace) -eq $Name
  }
  if ($existing) {
    return
  }

  $permission = $manifest.CreateElement('uses-permission')
  $permission.SetAttribute('name', $androidNamespace, $Name)
  [void]$manifestElement.InsertBefore($permission, $manifestElement.application)
}

Ensure-Permission 'android.permission.RECORD_AUDIO'
Ensure-Permission 'android.permission.MODIFY_AUDIO_SETTINGS'
Ensure-Permission 'android.permission.INTERNET'

$application = $manifestElement.application
if ($application) {
  $application.SetAttribute('usesCleartextTraffic', $androidNamespace, 'true')
}

$settings = [System.Xml.XmlWriterSettings]::new()
$settings.Encoding = [System.Text.UTF8Encoding]::new($false)
$settings.Indent = $true
$writer = [System.Xml.XmlWriter]::Create($manifestPath, $settings)
$manifest.Save($writer)
$writer.Close()

Write-Host "Android manifest patched for microphone access."
