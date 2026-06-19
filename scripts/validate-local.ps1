param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$NodePath = $env:NODE_EXE,
  [switch]$SkipNode
)

$ErrorActionPreference = 'Stop'

$failures = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Add-Failure {
  param([string]$Message)
  $script:failures.Add($Message) | Out-Null
}

function Add-Warning {
  param([string]$Message)
  $script:warnings.Add($Message) | Out-Null
}

function Write-Step {
  param([string]$Message)
  Write-Host "[validate] $Message"
}

function Read-Utf8 {
  param([string]$Path)
  return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Resolve-NodeExecutable {
  param([string]$PreferredPath)

  $candidates = New-Object System.Collections.Generic.List[string]
  if (-not [string]::IsNullOrWhiteSpace($PreferredPath)) {
    $candidates.Add($PreferredPath) | Out-Null
  }

  $bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
  $candidates.Add($bundledNode) | Out-Null

  $pathNode = Get-Command node -ErrorAction SilentlyContinue
  if ($pathNode) {
    $candidates.Add($pathNode.Source) | Out-Null
  }

  $seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
  foreach ($candidate in $candidates) {
    if ([string]::IsNullOrWhiteSpace($candidate) -or -not $seen.Add($candidate)) {
      continue
    }
    if (-not (Test-Path $candidate) -and $candidate -ne 'node') {
      continue
    }

    try {
      $versionOutput = & $candidate --version 2>&1
      if ($LASTEXITCODE -eq 0) {
        return [pscustomobject]@{
          Path = $candidate
          Version = ($versionOutput -join ' ').Trim()
        }
      }
      Add-Warning "Node candidate failed version check: $candidate ($($versionOutput -join ' '))"
    } catch {
      Add-Warning "Node candidate could not run: $candidate ($($_.Exception.Message))"
    }
  }

  return $null
}

function Get-RegexMatches {
  param(
    [string]$Text,
    [string]$Pattern
  )
  return [regex]::Matches($Text, $Pattern)
}

$root = Resolve-Path $ProjectRoot
$indexPath = Join-Path $root 'index.html'

Write-Step "Project root: $root"

if (-not (Test-Path $indexPath)) {
  Add-Failure "Missing index.html"
} else {
  Write-Step "Checking index.html"
}

if ($failures.Count -eq 0) {
  $html = Read-Utf8 $indexPath

  $stylesheetMatches = Get-RegexMatches $html '<link\s+[^>]*rel=["'']stylesheet["''][^>]*href=["'']([^"'']+)["'']'
  $scriptMatches = Get-RegexMatches $html '<script\s+[^>]*src=["'']([^"'']+)["''][^>]*></script>'
  $idMatches = Get-RegexMatches $html '\sid=["'']([^"'']+)["'']'

  $ids = @()
  foreach ($match in $idMatches) {
    $ids += $match.Groups[1].Value
  }

  Write-Step "Checking linked assets"
  foreach ($match in $stylesheetMatches) {
    $href = $match.Groups[1].Value
    if ($href -match '^(https?:)?//') {
      Add-Warning "Skipping remote stylesheet: $href"
      continue
    }
    $assetPath = Join-Path $root $href
    if (-not (Test-Path $assetPath)) {
      Add-Failure "Stylesheet referenced by index.html is missing: $href"
    }
  }

  $scriptSources = @()
  foreach ($match in $scriptMatches) {
    $src = $match.Groups[1].Value
    $scriptSources += $src
    if ($src -match '^(https?:)?//') {
      Add-Warning "Skipping remote script: $src"
      continue
    }
    $scriptPath = Join-Path $root $src
    if (-not (Test-Path $scriptPath)) {
      Add-Failure "Script referenced by index.html is missing: $src"
    }
  }

  $localJsFiles = Get-ChildItem -Path $root -Filter '*.js' -File | ForEach-Object { $_.Name }
  foreach ($jsFile in $localJsFiles) {
    if ($scriptSources -notcontains $jsFile) {
      Add-Warning "JavaScript file is not loaded by index.html: $jsFile"
    }
  }

  Write-Step "Checking duplicate element ids"
  $duplicateIds = $ids | Group-Object | Where-Object { $_.Count -gt 1 }
  foreach ($duplicate in $duplicateIds) {
    Add-Failure "Duplicate id in index.html: $($duplicate.Name)"
  }

  Write-Step "Checking document.getElementById references"
  $htmlIdSet = [System.Collections.Generic.HashSet[string]]::new()
  foreach ($id in $ids) {
    [void]$htmlIdSet.Add($id)
  }

  foreach ($jsFile in $localJsFiles) {
    $jsPath = Join-Path $root $jsFile
    $js = Read-Utf8 $jsPath
    $elementMatches = Get-RegexMatches $js 'getElementById\(["'']([^"'']+)["'']\)'
    foreach ($match in $elementMatches) {
      $id = $match.Groups[1].Value
      if (-not $htmlIdSet.Contains($id)) {
        Add-Failure "$jsFile references missing element id: $id"
      }
    }
  }

  Write-Step "Checking expected application entry order"
  $expectedScripts = @(
    'app-config.js',
    'app-dom.js',
    'app-state.js',
    'game-state.js',
    'mira-feedback.js',
    'beginner-practice.js',
    'app-shell.js',
    'pitch-detection.js',
    'formant-analysis.js',
    'canvas-rendering.js',
    'offline-analysis.js',
    'breath-analysis.js',
    'memory-config.js',
    'memory-training.js',
    's88-action-path.js',
    'song-pitch.js',
    'vocal-score.js',
    'song-lyrics.js',
    'recording-timeline.js',
    'success-library.js',
    'daily-challenge.js',
    'pitch-score-training.js',
    'accompaniment-controls.js',
    'vocal-separation.js',
    'readiness.js',
    'spectrogram.js',
    'audio-engine.js',
    'bgm-system.js',
    'song-practice-flow.js',
    'recording-flow.js',
    'fix-one-thing.js',
    'app.js',
    'launcher-router.js',
    'app-install.js'
  )
  $loadedExpected = $scriptSources | Where-Object { $expectedScripts -contains $_ }
  if (($loadedExpected -join '|') -ne ($expectedScripts -join '|')) {
    Add-Failure "index.html script order differs from expected app dependency order."
  }

  if (-not $SkipNode) {
    Write-Step "Checking JavaScript syntax with node --check when available"
    $node = Resolve-NodeExecutable $NodePath
    if ($node) {
      Write-Step "Using Node $($node.Version): $($node.Path)"
      foreach ($jsFile in $localJsFiles) {
        $jsPath = Join-Path $root $jsFile
        try {
          $output = & $node.Path --check $jsPath 2>&1
          if ($LASTEXITCODE -ne 0) {
            Add-Failure "node --check failed for ${jsFile}: $($output -join ' ')"
          }
        } catch {
          Add-Failure "Node failed while checking '${jsFile}': $($_.Exception.Message)"
          break
        }
      }
    } else {
      Add-Failure "No runnable Node executable was found. Install Node, set NODE_EXE/NodePath, or run with -SkipNode for a structural-only check."
    }
  } else {
    Add-Warning "Skipped node --check because -SkipNode was supplied."
  }
}

if ($warnings.Count -gt 0) {
  Write-Host ''
  Write-Host 'Warnings:'
  foreach ($warning in $warnings) {
    Write-Host "  - $warning"
  }
}

if ($failures.Count -gt 0) {
  Write-Host ''
  Write-Host 'Failures:'
  foreach ($failure in $failures) {
    Write-Host "  - $failure"
  }
  exit 1
}

Write-Host ''
Write-Host 'Local validation passed.'
exit 0
