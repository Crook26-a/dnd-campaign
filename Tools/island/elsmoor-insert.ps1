# Puts Elsmoor (elsmoor.html → generate.ps1 -Which elsmoor.html → elsmoor-out.json) into the newest save, the way Hesk
# went in: everything hidden until the crew sights it, in the Uncharted region, services and road fields as Hesk's.
# Run it again to put the island back as it is in elsmoor-out.json (anything else named e* by this script is replaced).
$ErrorActionPreference = "Stop"
$utf8 = New-Object Text.UTF8Encoding $false
$C = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$sf = "$C\Saves\2026-10-15 kalatecha (roads joined, test island).json"
$d = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
$o = [IO.File]::ReadAllText("$PSScriptRoot\elsmoor-out.json", [Text.Encoding]::UTF8) | ConvertFrom-Json
if($o.err){ throw "generator: $($o.err)" }
function Pts([string]$s){ @($s.Trim() -split '\s+' | ForEach-Object { $a = $_ -split ','; [pscustomobject][ordered]@{ x = [int]$a[0]; y = [int]$a[1] } }) }
$note = "Elsmoor (2026-10-16). Placeholder: its story, people and buildings are still to be worked out."
# Hesk's places show what each kind offers
$svcOf = @{}; foreach($k in "city","town","village","post","ruin","cave"){ $h = $d.nodes | Where-Object { $_.region -eq "r3" -and $_.kind -eq $k } | Select-Object -First 1; $svcOf[$k] = if($h){ $h.services } else { [pscustomobject]@{} } }
$ids = @("eisle") + @($o.areas | ForEach-Object -Begin { $i = 0 } -Process { "earea$i"; $i++ }) + @($o.rivers | ForEach-Object -Begin { $i = 0 } -Process { "eriv$i"; $i++ })
$d.shapes = @($d.shapes | Where-Object { $_.id -notlike "eisle" -and $_.id -notlike "earea*" -and $_.id -notlike "eriv*" })
$d.nodes = @($d.nodes | Where-Object { $o.nodes.id -notcontains $_.id })
$d.roads = @($d.roads | Where-Object { $_.id -notlike "er*" -or $_.id -notmatch '^er\d+$' })
$sh = New-Object System.Collections.ArrayList
[void]$sh.Add([pscustomobject][ordered]@{ id = "eisle"; kind = "island"; closed = $true; straight = $false; name = "Elsmoor"; side = 1; impassable = $false; terrain = "grassland"
  notes = "$note About 65 miles across and 44 north to south, some 145 miles north-west of Kalatecha: open moorland, the Spine's hills across the north, Haldwood and Fennick Woods, the Sedge by Brackwater, and the Ox, navigable from Brackwater up to Oxley Ford. Hidden until the crew sights it."; hidden = $true; pts = (Pts $o.isle) })
$i = 0; foreach($a in $o.areas){ [void]$sh.Add([pscustomobject][ordered]@{ id = "earea$i"; kind = $a.kind; closed = $true; straight = $false; name = $a.name; side = 1; impassable = $false; notes = ""; hidden = $true; pts = (Pts $a.pts) }); $i++ }
$i = 0; foreach($v in $o.rivers){ $r = [ordered]@{ id = "eriv$i"; kind = "river"; closed = $false; straight = $false; name = $v.name; side = 1; impassable = $false; notes = ""; hidden = $true; w0 = $v.w0; w1 = $v.w1 }
  if($v.navigable){ $r.navigable = $true; $r.notes = "Navigable: river boats (rowboats, keelboats, longships) can come up from the sea to Oxley Ford." }
  $r.pts = (Pts $v.pts); [void]$sh.Add([pscustomobject]$r); $i++ }
# the island's land goes in before Kalatecha's shapes' woods and hills are drawn over it: after the open sea, like Hesk
$sea = @($d.shapes | Where-Object id -eq "csea"); $rest = @($d.shapes | Where-Object id -ne "csea")
$d.shapes = @($sea + $sh.ToArray() + $rest)
foreach($n in $o.nodes){ $x = [ordered]@{ id = $n.id; name = $n.name; kind = $n.kind; region = "r3"; level = 1; origin = $false; seat = $false; services = $svcOf[$n.kind]; notes = $n.notes; x = [int]$n.x; y = [int]$n.y }
  if($n.kind -in "city","town"){ $s = [ordered]@{}; foreach($p in $x.services.PSObject.Properties){ $s[$p.Name] = $p.Value }; $s.coach = 1; $x.services = [pscustomobject]$s }   # a coach stop
  if($n.port){ $x.port = $true }; $x.hidden = $true; $d.nodes += [pscustomobject]$x }
$hr = $d.roads | Where-Object id -eq "thr6"
foreach($r in $o.roads){ $x = [ordered]@{ id = $r.id; from = $r.from; to = $r.to; miles = $r.miles; milesLocked = $false; name = ""; density = "normal"; coach = (-not $r.danger -and $r.quality -ge 3); region = "r3"; notes = $note; quality = $r.quality }
  if($r.danger -and $hr -and $hr.PSObject.Properties.Name -contains "danger"){ $x.danger = $hr.danger }
  $x.pts = @($r.pts | ForEach-Object { [pscustomobject][ordered]@{ x = [int]$_.x; y = [int]$_.y } }); $d.roads += [pscustomobject]$x }
[IO.File]::WriteAllText($sf, ($d | ConvertTo-Json -Depth 80), $utf8)
$back = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
"save: $(@($back.nodes).Count) places ($(@($back.nodes | Where-Object { $_.id -like 'e*' -and $o.nodes.id -contains $_.id }).Count) on Elsmoor), $(@($back.shapes).Count) shapes, $(@($back.roads).Count) roads; Dunmarrow plan $(@($back.plans.ns4g5g2.nodes).Count) buildings; people $(@($back.library.npcs).Count)"
