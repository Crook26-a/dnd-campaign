# Open berths in the ports already in the newest save (Joseph, 2026-10-16: setting up for shipping): the ships moored
# inside Port Hesk's, Saltmere's and Dunmarrow's harbours become berths for any ship ("Harbour Berth N"), as their town
# scripts now make them; the ones riding at anchor outside stay as they are.
$ErrorActionPreference = "Stop"
$utf8 = New-Object Text.UTF8Encoding $false
$C = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$sf = "$C\Saves\2026-10-15 kalatecha (roads joined, test island).json"
$d = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
$note = "A berth for any ship that comes in: the first in port without a berth of her own here ties up."
$want = @{ thesk = @("hkship1","hkship2","hkship3","hkship4"); ns4eb21 = @("slship1","slship2","slship3"); ns4g5g2 = @("dnship1","dnship2","dnship3") }
foreach($k in $want.Keys){ foreach($id in $want[$k]){ $n = $d.plans.$k.nodes | Where-Object id -eq $id; if(-not $n){ continue }
  $n.name = "Harbour Berth " + $id.Substring($id.Length - 1)
  $n.notes = if($n.notes -and -not $n.notes.Contains($note)){ "$($n.notes) $note" } elseif($n.notes){ $n.notes } else { $note }
  $n | Add-Member -NotePropertyName berth -NotePropertyValue "open" -Force } }
[IO.File]::WriteAllText($sf, ($d | ConvertTo-Json -Depth 80), $utf8)
$back = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
foreach($k in "kcity","thesk","ns4eb21","ns4g5g2","ebrack","ehald"){ "$((($back.nodes | Where-Object id -eq $k).name)): $(@($back.plans.$k.nodes | Where-Object berth -eq 'open').Count) open berths" }
