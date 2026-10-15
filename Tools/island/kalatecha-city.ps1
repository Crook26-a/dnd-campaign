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
$drop = @("pb4","pb5","pb6","pb7","pb8","pb9","pb10","pterr") + @("kl1","kl2","kl3","kl4","kl5","kl6","kl7","kl8","pterr1","pterr2","pterr3","pterr4","pterr5","kzu","kzo","kzh")
$keep = @($k.shapes | Where-Object { $drop -notcontains $_.id })
$new = @(
  # zoned to be built up (Joseph, 2026-10-15, SimCity style): the hill a village of villas among gardens, the old town a
  # town, the waterfront packed like a city. The road out past the Customs Post to the olive farm stays country.
  (Shp "kzu" "zone" "Upper Town" "3150,330 3800,380 4250,700 4350,1300 4250,1900 3850,2080 3560,1700 3360,1100 3250,560" $true $false "The hill above the cathedral: villas, gardens and palms.")
  (Shp "kzo" "zone" "Old Town" "2380,170 3150,150 3330,520 3360,1120 3540,1520 3650,1880 3780,2120 3640,2300 3000,2280 2480,2280 2180,2220 2330,1820 2390,700" $true $false "")
  (Shp "kzh" "zone" "The Waterfront" "460,500 820,260 1500,190 2150,150 2460,180 2440,720 2360,780 2380,1950 2180,2180 1950,2330 1620,2440 1480,2260 1950,2060 2190,1880 2250,1450 2200,950 2080,790 1300,720 760,640" $true $false "")
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
$zn = @($back.plans.kcity.shapes | Where-Object { $_.kind -eq "zone" }).Count
"kcity: $(@($back.plans.kcity.shapes).Count) shapes ($zn zones), $(@($back.plans.kcity.nodes).Count) places; roofs " + ($back.plans.kcity.roofs | ConvertTo-Json -Compress) + "; Port Hesk roofs " + ($back.plans.thesk.roofs | ConvertTo-Json -Compress)
