# miwale Dev-Zentrale: richtet den Agenten auf diesem Windows-Rechner ein.
#
# Aufruf von der Seite miwale.com/dev (Win+R, einfuegen, Enter):
#   powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:MIWALE_DEV='https://miwale.com/dev/'; irm https://miwale.com/dev/installieren.ps1 | iex"
# oder im Repo: pnpm zentrale:installieren (nimmt agent.mjs von nebenan).
#
# Was passiert:
#   - agent.mjs nach %LOCALAPPDATA%\miwale-dev
#   - Verknuepfung im Autostart: der Agent laeuft ab jeder Anmeldung
#   - Verknuepfung im Startmenue mit Strg+Alt+D: startet ihn falls noetig und
#     oeffnet die Seite
# Entfernen: die beiden Verknuepfungen "miwale Dev-Zentrale" und den Ordner
# %LOCALAPPDATA%\miwale-dev loeschen.
#
# Nur ASCII in dieser Datei: per irm | iex geladen, haengen Umlaute an der
# Zeichensatz-Erkennung.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$basis = if ($env:MIWALE_DEV) { $env:MIWALE_DEV } else { 'https://miwale.com/dev/' }
if (-not $basis.EndsWith('/')) { $basis += '/' }

Write-Host ''
Write-Host '  miwale Dev-Zentrale wird eingerichtet' -ForegroundColor Cyan
Write-Host ''

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  Write-Host '  Node.js fehlt auf diesem Rechner. Bitte zuerst installieren:' -ForegroundColor Yellow
  Write-Host '    winget install OpenJS.NodeJS.LTS'
  Write-Host '  und danach diesen Befehl noch einmal ausfuehren.'
  Read-Host '  Enter zum Schliessen' | Out-Null
  return
}

$ziel = Join-Path $env:LOCALAPPDATA 'miwale-dev'
New-Item -ItemType Directory -Force -Path $ziel | Out-Null
$agent = Join-Path $ziel 'agent.mjs'

# Laufenden Agenten beenden, damit der neue die Datei und den Port bekommt.
try { Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:5300/beenden' -TimeoutSec 3 | Out-Null; Start-Sleep -Milliseconds 800 } catch { }

$nebenan = if ($PSCommandPath) { Join-Path (Split-Path $PSCommandPath) 'agent.mjs' } else { '' }
if ($nebenan -and (Test-Path $nebenan)) {
  Copy-Item $nebenan $agent -Force
  Write-Host "  Agent kopiert aus $nebenan"
} else {
  Invoke-WebRequest -Uri ($basis + 'agent.mjs') -OutFile $agent -UseBasicParsing
  Write-Host "  Agent geladen von $basis"
}

$shell = New-Object -ComObject WScript.Shell

$autostart = Join-Path ([Environment]::GetFolderPath('Startup')) 'miwale Dev-Zentrale.lnk'
$l = $shell.CreateShortcut($autostart)
$l.TargetPath = $node
$l.Arguments = "`"$agent`""
$l.WorkingDirectory = $ziel
$l.WindowStyle = 7
$l.Description = 'miwale Dev-Zentrale: Agent im Hintergrund'
$l.Save()
Write-Host '  Autostart eingerichtet'

$menue = Join-Path ([Environment]::GetFolderPath('Programs')) 'miwale Dev-Zentrale.lnk'
$l = $shell.CreateShortcut($menue)
$l.TargetPath = $node
$l.Arguments = "`"$agent`" --oeffnen"
$l.WorkingDirectory = $ziel
$l.WindowStyle = 7
$l.Hotkey = 'CTRL+ALT+D'
$l.Description = 'miwale Dev-Zentrale oeffnen (Strg+Alt+D)'
$l.Save()
Write-Host '  Startmenue: "miwale Dev-Zentrale", Tastenkuerzel Strg+Alt+D'

& $node $agent --oeffnen "--seite=$basis"

Write-Host ''
Write-Host '  Fertig. Die Zentrale oeffnet sich im Browser.' -ForegroundColor Green
Write-Host '  Ab jetzt: Strg+Alt+D'
Write-Host ''
Start-Sleep -Seconds 3
