param([switch]$Installer, [Parameter(ValueFromRemainingArguments=$true)][string[]]$Remaining)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectRoot
$silent = ($Remaining -contains '/s') -or ($Remaining -contains '--silent') -or ($env:SILENT -eq '1')
try {
  Write-Host 'Using a per-user toolchain; this route does not require administrator rights.'
  $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
  $nodeOkay = $false
  if ($nodeCommand) {
    $reportedVersion = (& $nodeCommand.Source --version | Select-Object -First 1)
    if ($LASTEXITCODE -eq 0 -and $reportedVersion -match '^v(\d+)\.') { $nodeOkay = [int]$Matches[1] -ge 22 }
  }
  if (-not $nodeOkay) {
    $version = 'v24.9.0'
    $toolsRoot = Join-Path $env:LOCALAPPDATA 'JacksonChung\toolchain'
    New-Item -ItemType Directory -Force -Path $toolsRoot | Out-Null
    $archiveName = "node-$version-win-x64.zip"
    $archivePath = Join-Path $toolsRoot $archiveName
    $nodeRoot = Join-Path $toolsRoot "node-$version-win-x64"
    if (-not (Test-Path -LiteralPath (Join-Path $nodeRoot 'node.exe'))) {
      $baseUrl = "https://nodejs.org/dist/$version"
      Write-Host "Obtaining Node.js $version from its official distribution."
      Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/SHASUMS256.txt" -OutFile (Join-Path $toolsRoot 'SHASUMS256.txt')
      $checksumLine = Get-Content (Join-Path $toolsRoot 'SHASUMS256.txt') | Where-Object { $_ -match ([regex]::Escape($archiveName) + '$') } | Select-Object -First 1
      if (-not $checksumLine) { throw 'Official Node.js checksum entry is missing.' }
      if (-not (Test-Path -LiteralPath $archivePath)) { Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/$archiveName" -OutFile $archivePath }
      $expected = ($checksumLine -split '\s+')[0]
      $hashStream = [IO.File]::OpenRead($archivePath)
      try { $actualHash = [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($hashStream)).Replace('-', '').ToLowerInvariant() } finally { $hashStream.Dispose() }
      if ($actualHash -ne $expected) { throw 'Node.js distribution checksum does not match.' }
      Expand-Archive -LiteralPath $archivePath -DestinationPath $toolsRoot -Force
    }
    $env:PATH = "$nodeRoot;$env:PATH"
  }
  & node --version
  if ($LASTEXITCODE -ne 0) { throw 'Node.js readback failed.' }
  if (-not (Test-Path -LiteralPath 'node_modules/vite/bin/vite.js')) {
    & npm.cmd ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "Dependency bootstrap exited $LASTEXITCODE." }
  }
  & node scripts/build.mjs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  if ($Installer) {
    if (-not (Test-Path -LiteralPath 'node_modules/electron/path.txt')) {
      & node node_modules/electron/install.js
      if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    if ($Remaining -contains '--verification') { & node scripts/package-installer.mjs --verification } else { & node scripts/package-installer.mjs }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
  if (-not $silent -and -not $Installer) {
    $answer = Read-Host 'Build complete. Start the local desktop companion? [y/N]'
    if ($answer -eq 'y') { & npm.cmd run desktop; exit $LASTEXITCODE }
  }
  exit 0
} catch {
  Write-Error $_
  exit 1
}
