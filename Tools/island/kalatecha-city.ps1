# Kalatecha's town plan relaid (Joseph, 2026-10-15) so the town fill builds it up the way the city picture shows it
# ("Pictures\Kalatecha city picture.jpg"): every place stays where it is, with its people, loot and battle map; the
# drawn blocks go (the fill builds the houses now), a network of lanes is added, the Terraces become bands stepping
# up the eastern hill, and the roofs are all terracotta. Port Hesk gets its own mix (mostly slate, like its picture).
# Run it again safely: it puts the same shapes back.
$ErrorActionPreference = "Stop"
$utf8 = New-Object Text.UTF8Encoding $false
$C = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$f = "$C\Saves\2026-10-15 kalatecha (roads joined, test island).json"
$d = [IO.File]::ReadAllText($f, [Text.Encoding]::UTF8) | ConvertFrom-Json
function Pts([string]$s){ @($s.Trim() -split '\s+' | ForEach-Object { $a = $_ -split ','; [pscustomobject][ordered]@{ x = [int]$a[0]; y = [int]$a[1] } }) }
function Shp($id, $kind, $name, $pts, [bool]$closed, [bool]$straight, $notes = "", $w = $null){
  $o = [ordered]@{ id = $id; kind = $kind; closed = $closed; straight = $straight; name = $name; side = 1; impassable = ($kind -in 'wall','impasse'); notes = $notes; pts = (Pts $pts) }
  if($w -ne $null){ $o.w = $w }; [pscustomobject]$o }
$k = $d.plans.kcity
$drop = @("pb4","pb5","pb6","pb7","pb8","pb9","pb10","pterr") + @("kl1","kl2","kl3","kl4","kl5","kl6","kl7","kl8","pterr1","pterr2","pterr3","pterr4","pterr5")
$keep = @($k.shapes | Where-Object { $drop -notcontains $_.id })
$new = @(
  # the terraces: bands stepping up the eastern hill, white houses between them
  (Shp "pterr1" "garden" "The Terraces" "3400,420 3900,520 4100,640 4080,705 3880,595 3380,490" $true $false "Terraced gardens and vineyards climbing the hill above the town, with palms along their edges.")
  (Shp "pterr2" "garden" "" "3350,800 3800,860 4200,1000 4180,1070 3780,935 3330,870" $true $false "")
  (Shp "pterr3" "garden" "" "3420,1190 3850,1255 4250,1385 4230,1455 3830,1325 3400,1260" $true $false "")
  (Shp "pterr4" "garden" "" "3650,1485 4000,1565 4220,1685 4200,1755 3980,1635 3630,1555" $true $false "")
  (Shp "pterr5" "garden" "" "3700,1725 4100,1805 4180,1875 4150,1925 4080,1875 3680,1795" $true $false "")
  # lanes: the strip between Warehouse Row and the Fortress Wall
  (Shp "kl1" "lane" "Upper Row" "1000,430 1400,380 1800,330 2200,330 2400,430" $false $false "Behind the warehouses, under the fortress wall." 22)
  (Shp "kl2" "alley" "Rope Walk" "1650,640 1690,400 1720,190" $false $false "" 15)
  (Shp "kl3" "alley" "Gull Lane" "2000,700 2050,450 2120,180" $false $false "" 15)
  # through the Old Town
  (Shp "kl4" "lane" "Lantern Lane" "2650,575 2690,780 2700,965" $false $false "Past the Charter House to Cathedral Street." 22)
  (Shp "kl5" "lane" "Bell Lane" "3000,700 3260,730 3290,1000" $false $false "Round the back of the cathedral to the Switchback." 22)
  (Shp "kl6" "lane" "Tanners' Lane" "3010,1170 3060,1450 3080,1700 3060,1915" $false $false "Down from the cathedral, across Hill Stair, to the Inland Road." 22)
  (Shp "kl7" "lane" "Net Lane" "2280,1770 2480,1820 2690,1760" $false $false "From the south end of the Quay to the Inland Road." 20)
  (Shp "kl8" "alley" "Salt Steps" "2860,1240 2900,1100 2960,1000" $false $false "" 15)
)
$k.shapes = @($keep + $new)
# the picture: a packed waterfront, scattered houses up the terraced hill
foreach($r in $k.regions){ if($r.id -eq "d1"){ $r | Add-Member -NotePropertyName density -NotePropertyValue "city" -Force }; if($r.id -eq "d3"){ $r | Add-Member -NotePropertyName density -NotePropertyValue "village" -Force } }
$k | Add-Member -NotePropertyName roofs -NotePropertyValue ([pscustomobject][ordered]@{ tile = 1 }) -Force
if($d.plans.thesk){ $d.plans.thesk | Add-Member -NotePropertyName roofs -NotePropertyValue ([pscustomobject][ordered]@{ slate = .65; tile = .3; thatch = .05 }) -Force }
[IO.File]::WriteAllText($f, ($d | ConvertTo-Json -Depth 80), $utf8)
$back = [IO.File]::ReadAllText($f, [Text.Encoding]::UTF8) | ConvertFrom-Json
"kcity: $(@($back.plans.kcity.shapes).Count) shapes, $(@($back.plans.kcity.nodes).Count) places; roofs " + ($back.plans.kcity.roofs | ConvertTo-Json -Compress) + "; Port Hesk roofs " + ($back.plans.thesk.roofs | ConvertTo-Json -Compress)
