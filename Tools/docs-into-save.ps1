# Puts the campaign documents from Tools\docs (docs.json lists them) into the newest save, keeping the ticks made in the
# app (each doc's "done"); docs made in the app are left alone. Joseph loads the save and resaves when he wants it kept,
# so this is the way doc fixes reach the app without a full rebuild (2026-10-22). Run with -Ids to do only some.
param([string[]]$Ids = @())
$ErrorActionPreference = "Stop"
$Ids = @($Ids | ForEach-Object { $_ -split "," } | Where-Object { $_ })
$utf8 = New-Object Text.UTF8Encoding $false
$C = Split-Path $PSScriptRoot -Parent
$sf = "$C\Saves\2026-10-15 kalatecha (roads joined, test island).json"
$d = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
$list = [IO.File]::ReadAllText("$PSScriptRoot\docs\docs.json", [Text.Encoding]::UTF8) | ConvertFrom-Json
$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.000Z")
$done = @()
foreach($m in $list){
  if($Ids.Count -and -not ($Ids -contains $m.id)){ continue }
  $md = [IO.File]::ReadAllText((Join-Path "$PSScriptRoot\docs" $m.file), [Text.Encoding]::UTF8)
  $doc = $d.docs | Where-Object id -eq $m.id
  if($doc){ $doc.md = $md; $doc.title = $m.title; $doc.updated = $now }
  else { $d.docs += [pscustomobject][ordered]@{ id = $m.id; kind = $m.kind; title = $m.title; date = $m.date; md = $md; done = [pscustomobject]@{}; updated = $now } }
  $done += $m.id
}
[IO.File]::WriteAllText($sf, ($d | ConvertTo-Json -Depth 80), $utf8)
$back = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
"docs updated in the save: $($done -join ', ') ($(@($back.docs).Count) docs in all)"
