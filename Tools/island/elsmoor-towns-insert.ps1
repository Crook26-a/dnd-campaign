# Puts Brackwater's and Haldeport's town plans (elsmoor-towns.html → generate.ps1 -Which elsmoor-towns.html →
# elsmoor-towns-out.json) into the newest save, as Saltmere's and Dunmarrow's went in. Run it again to put them back.
$ErrorActionPreference = "Stop"
$utf8 = New-Object Text.UTF8Encoding $false
$C = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$sf = "$C\Saves\2026-10-15 kalatecha (roads joined, test island).json"
$d = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
$o = [IO.File]::ReadAllText("$PSScriptRoot\elsmoor-towns-out.json", [Text.Encoding]::UTF8) | ConvertFrom-Json
if($o.err){ throw "generator: $($o.err)" }
foreach($p in $o.plans){
  $place = $p.place; $p.PSObject.Properties.Remove("place")
  $d.plans | Add-Member -NotePropertyName $p.of -NotePropertyValue $p -Force
  $n = $d.nodes | Where-Object id -eq $p.of
  if(-not ([string]$n.notes).Contains($place.notes)){ $n.notes = if($n.notes){ "$($n.notes)`n`n$($place.notes)" } else { $place.notes } }
}
[IO.File]::WriteAllText($sf, ($d | ConvertTo-Json -Depth 80), $utf8)
$back = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
"save: Brackwater $(@($back.plans.ebrack.nodes).Count) markers, Haldeport $(@($back.plans.ehald.nodes).Count); Dunmarrow $(@($back.plans.ns4g5g2.nodes).Count), Saltmere $(@($back.plans.ns4eb21.nodes).Count); $(@($back.nodes).Count) places, $(@($back.library.npcs).Count) people"
