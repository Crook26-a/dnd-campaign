# Puts the sea's coast and the mainland round it (mainland.html → generate.ps1 -Which mainland.html → mainland-out.json)
# into the newest save: the open sea (csea) becomes the sea inside the coast (sea:true); the mainland (cmain, an island
# shape marked mainland, its outline the land's inland edge ten miles in) goes under it; the port city sites go on it.
# Everything on the mainland is hidden until the crew sights it, in its own region. Run it again to put it back.
$ErrorActionPreference = "Stop"
$utf8 = New-Object Text.UTF8Encoding $false
$C = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$sf = "$C\Saves\2026-10-15 kalatecha (roads joined, test island).json"
$d = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
$o = [IO.File]::ReadAllText("$PSScriptRoot\mainland-out.json", [Text.Encoding]::UTF8) | ConvertFrom-Json
if($o.err){ throw "generator: $($o.err)" }
function Pts([string]$s){ @($s.Trim() -split '\s+' | ForEach-Object { $a = $_ -split ','; [pscustomobject][ordered]@{ x = [int]$a[0]; y = [int]$a[1] } }) }
$sea = $d.shapes | Where-Object id -eq "csea"
$sea.pts = Pts $o.sea
$sea | Add-Member -NotePropertyName sea -NotePropertyValue $true -Force
$sea.straight = $true                                 # thousands of points: straight segments draw it just as well, far lighter
# the three basins' names (Joseph, 2026-10-16), set once: renames made in the app are kept
# each with its climate (the app's CLIMATES, your table rule) and the box of water it covers ([x0, y0, x1, y1]; the first box
# that holds a spot gives its weather), 2026-10-20: the Hidden Sea an Irish spring all year, kept so by the fey
if(-not $sea.labels -or -not $sea.labels[0].climate -or $null -eq $sea.labels[0].cy){ $sea | Add-Member -NotePropertyName labels -NotePropertyValue @(
  [pscustomobject][ordered]@{ name = "The Kalatecha Sea"; x = 3600; y = 2700; cy = 0; w = 9000; climate = "med_west"; box = @(-7700, -12000, 11000, 12000) },
  [pscustomobject][ordered]@{ name = "The Middle Sea"; x = 19500; y = 3000; w = 10000; hidden = $true; reveal = 400; climate = "med_east"; box = @(11000, -5200, 40000, 12000) },
  [pscustomobject][ordered]@{ name = "The Hidden Sea"; x = 16500; y = -7800; w = 5200; hidden = $true; reveal = 200; climate = "fey_spring"; box = @(12000, -12000, 25000, -5200) },
  [pscustomobject][ordered]@{ name = "The Western Ocean"; x = -10200; y = -3600; w = 5000; hidden = $true; reveal = 150; climate = "open_ocean"; box = @(-20000, -12000, -7700, 12000) }) -Force }
$oldMain = $d.shapes | Where-Object id -eq "cmain"
$main = [pscustomobject][ordered]@{ id = "cmain"; kind = "island"; closed = $true; straight = $true; name = "The Mainland"; side = 1; impassable = $false; terrain = "grassland"; mainland = $true
  notes = "The continent round the sea (2026-10-16), charted ten miles in from the coast; beyond that it's unmapped. Placeholder name. Set up for a campaign on land one day."; hidden = $true; pts = (Pts $o.edge) }
if($oldMain -and $oldMain.seen){ $main | Add-Member -NotePropertyName seen -NotePropertyValue $oldMain.seen -Force }   # stretches already charted stay charted
$d.shapes = @(@($main) + @($d.shapes | Where-Object id -ne "cmain"))
if(-not ($d.regions | Where-Object id -eq "r4")){ $d.regions += [pscustomobject][ordered]@{ id = "r4"; name = "The Mainland Coast"; threat = 2; hex = "#7a6a52"; notes = "The continent's coast round the sea: port cities, unexplored inland." } }
$svc = ($d.nodes | Where-Object id -eq "thesk").services; $s = [ordered]@{}; foreach($p in $svc.PSObject.Properties){ $s[$p.Name] = $p.Value }; $s.coach = 1
$d.nodes = @($d.nodes | Where-Object { $_.id -notmatch '^mp\d+$' })
foreach($p in $o.ports){ $d.nodes += [pscustomobject][ordered]@{ id = $p.id; name = $p.name; kind = "city"; region = "r4"; level = 1; origin = $false; seat = $false; services = [pscustomobject]$s; notes = $p.notes; x = [int]$p.x; y = [int]$p.y; port = $true; hidden = $true } }
[IO.File]::WriteAllText($sf, ($d | ConvertTo-Json -Depth 80), $utf8)
$back = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
"save: sea $(@($back.shapes | Where-Object id -eq 'csea').pts.Count) points, mainland $(@($back.shapes | Where-Object id -eq 'cmain').pts.Count) points, $(@($back.nodes | Where-Object { $_.id -match '^mp\d+$' }).Count) port sites; $(@($back.nodes).Count) places, $(@($back.shapes).Count) shapes; plans $(@($back.plans.PSObject.Properties).Count)"
