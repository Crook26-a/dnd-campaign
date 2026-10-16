# Saltmere's town plan (laid out from "Pictures\Saltmere city picture.jpg", Joseph 2026-10-15), and that picture for the
# players' screen, into the newest save. Saltmere is the free city-state on Kalatecha Island's south-east coast: the sea
# lies east, the one road leaves west for the Saltmere Toll and Kalatecha. Run it again to put the plan back as it is here.
$ErrorActionPreference = "Stop"
$utf8 = New-Object Text.UTF8Encoding $false
$C = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$f = "$C\Saves\2026-10-15 kalatecha (roads joined, test island).json"
$d = [IO.File]::ReadAllText($f, [Text.Encoding]::UTF8) | ConvertFrom-Json
function Pts([string]$s){ @($s.Trim() -split '\s+' | ForEach-Object { $a = $_ -split ','; [pscustomobject][ordered]@{ x = [int]$a[0]; y = [int]$a[1] } }) }
function Shp($id, $kind, $name, $pts, [bool]$closed, [bool]$straight, $notes = "", $w = $null, $extra = @{}){
  $o = [ordered]@{ id = $id; kind = $kind; closed = $closed; straight = $straight; name = $name; side = 1; impassable = ($kind -in 'wall','impasse'); notes = $notes; pts = (Pts $pts) }
  if($w -ne $null){ $o.w = $w }; foreach($k in $extra.Keys){ $o[$k] = $extra[$k] }; [pscustomobject]$o }
$SVC = @("inn","store","provision","smith","apothecary","market","temple","healer","reeve","stable","fence","office","archive","trainer")
function Bld($id, $name, $kind, $x, $y, $w, $dp, $rot, $region, $notes, $extra = @{}){
  $s = [ordered]@{}; if($SVC -contains $kind){ $s[$kind] = 1 }
  $o = [ordered]@{ id = $id; name = $name; kind = $kind; region = $region; level = 1; origin = $false; seat = $false; services = [pscustomobject]$s; notes = $notes; x = $x; y = $y; w = $w; d = $dp; rot = $rot }
  foreach($k in $extra.Keys){ $o[$k] = $extra[$k] }; [pscustomobject]$o }

$regions = @(
  [pscustomobject][ordered]@{ id = "s1"; name = "The Harbour"; threat = 1; hex = "#3f6f78"; notes = "The walled basin, its quay and market, the two lighthouses." }
  [pscustomobject][ordered]@{ id = "s2"; name = "The Hill"; threat = 1; hex = "#a8752c"; notes = "White houses, domes and cypresses climbing from the harbour." }
  [pscustomobject][ordered]@{ id = "s3"; name = "Saltmere Castle"; threat = 2; hex = "#8f4436"; notes = "The castle on the headland, banners on every tower." }
  [pscustomobject][ordered]@{ id = "s4"; name = "Outside the City"; threat = 2; hex = "#5e7a4e"; notes = "The salt pans, the beach and the road west." }
)
$shapes = @(
  (Shp "ssea" "water" "Saltmere Harbour" "2000,-700 2100,0 2300,250 2700,300 2850,420 2800,560 2550,620 2350,700 2050,800 1850,950 1800,1150 1850,1350 2050,1450 2350,1500 2600,1650 2800,1900 3000,2300 3100,2800 3150,3200 4600,3200 4600,-700" $true $false "The walled harbour basin, sheltered by the castle headland and two stone moles, and the open sea beyond.")
  (Shp "srock" "rock" "Castle Head" "2150,250 2300,250 2700,300 2850,420 2800,560 2550,620 2350,640 2180,520" $true $false "The rocky headland the castle stands on.")
  (Shp "sbeach" "beach" "The Long Strand" "2350,1500 2600,1650 2800,1900 3000,2300 3100,2800 3150,3200 2950,3200 2880,2800 2780,2330 2600,1960 2420,1720 2250,1580" $true $false "Sand running away south along the coast.")
  (Shp "scastlewall" "wall" "Castle Walls" "2200,330 2640,330 2780,440 2730,560 2500,600 2240,560 2200,330" $false $true "Curtain walls with square towers, banners on every one.")
  (Shp "snmole" "pier" "North Mole" "2700,560 2780,690 2880,800" $false $false "A stone mole from the castle rock, its lighthouse at the end." 45 @{ stone = $true })
  (Shp "ssmole" "pier" "South Mole" "2350,1490 2600,1330 2860,1160" $false $false "The long stone mole closing the harbour from the south, its lighthouse at the end." 45 @{ stone = $true })
  (Shp "squay" "street" "The Quay" "2300,700 2000,820 1840,1000 1820,1180 1880,1360 2100,1450 2340,1480" $false $false "The stone quay round the basin: crates, barrels, nets and crowds." 60)
  (Shp "sjetty1" "pier" "Spice Jetty" "1880,960 2140,1010" $false $false "A stone jetty into the basin." 30 @{ stone = $true })
  (Shp "sjetty2" "pier" "Salt Jetty" "1930,1310 2200,1250" $false $false "A stone jetty into the basin." 30 @{ stone = $true })
  (Shp "spier1" "pier" "Fishers' Pier" "2120,1440 2260,1370" $false $false "Rowboats and fishing boats tie up here." 15)
  (Shp "smkt" "market" "The Awning Market" "1580,960 1790,975 1785,1310 1585,1295" $true $true "Striped awnings along the quay: spices, cloth, pottery, fish.")
  (Shp "stemplesq" "square" "Temple Court" "1000,150 1350,140 1360,360 1010,370" $true $true "The paved court before the domed temple.")
  (Shp "scypress1" "green" "The Cypress Walk" "700,120 1000,80 1000,380 820,520 620,420" $true $false "Cypresses and old olives on the hilltop.")
  (Shp "scypress2" "green" "" "1450,350 1700,300 1780,520 1560,620" $true $false "")
  (Shp "solives" "orchard" "Old Olive Terraces" "250,300 600,250 650,700 300,780" $true $false "")
  (Shp "spans1" "water" "The Salt Pans" "2150,1900 2450,1900 2450,2050 2150,2050" $true $true "Shallow pans where the sea is left to dry into salt; the city's fortune and its name.")
  (Shp "spans2" "water" "" "2150,2100 2450,2100 2450,2250 2150,2250" $true $true "")
  (Shp "spans3" "water" "" "2150,2300 2450,2300 2450,2450 2150,2450" $true $true "")
  (Shp "spans4" "water" "" "2500,2150 2700,2150 2700,2300 2500,2300" $true $true "")
  (Shp "spans5" "water" "" "2500,2350 2720,2350 2720,2500 2500,2500" $true $true "")
  (Shp "zharbour" "zone" "Harbour Town" "1300,650 1850,600 2250,640 1880,900 1760,1050 1780,1330 2000,1480 1700,1620 1300,1560" $true $false "" $null @{ density = "city" })
  (Shp "zhill" "zone" "The Hill" "350,130 2150,100 2200,560 1850,660 1300,700 1300,1560 1700,1650 1650,1800 600,1800 350,1300" $true $false "" $null @{ density = "town" })
  (Shp "ssea_gate" "street" "Sea Gate Street" "1820,1150 1400,1150 950,1120 500,1080 0,1050" $false $false "From the quay up through the town and out west on the road to the Saltmere Toll and Kalatecha." 40)
  (Shp "stair" "lane" "Temple Stair" "1700,960 1520,720 1340,470 1250,360" $false $false "Steps climbing from the market to the domed temple." 22)
  (Shp "scastler" "lane" "Castle Road" "1860,880 2060,640 2220,460" $false $false "Up from the quay to the castle gate." 25)
  (Shp "sdome" "lane" "Dome Street" "1120,1120 1060,760 960,400" $false $false "" 22)
  (Shp "scypressl" "lane" "Cypress Lane" "1340,470 1000,420 640,560 420,800 450,1080" $false $false "" 20)
  (Shp "srope" "lane" "Rope Lane" "1880,1360 1620,1520 1200,1600 700,1560 480,1300" $false $false "" 22)
  (Shp "sbath" "alley" "Bath Steps" "1400,1150 1430,920 1520,720" $false $false "" 15)
  (Shp "spans_rd" "lane" "Salt Road" "2050,1460 2100,1700 2150,1880" $false $false "Down to the salt pans." 20)
)
$nodes = @(
  (Bld "slcastle" "Saltmere Castle" "hall" 2470 440 52 34 -3 "s3" "A stone castle on the headland, square towers hung with banners in the city's colours. The city's council meets in its great hall; its guns cover the harbour mouth.")
  (Bld "slct1" "" "tower" 2230 350 10 10 0 "s3" "A castle tower.")
  (Bld "slct2" "" "tower" 2640 350 10 10 0 "s3" "A castle tower.")
  (Bld "slct3" "" "tower" 2740 540 10 10 0 "s3" "A castle tower.")
  (Bld "slcgate" "Castle Gate" "gate" 2230 520 10 7 -40 "s3" "The castle gate, at the top of Castle Road.")
  (Bld "sllightn" "North Light" "light" 2890 815 11 11 0 "s1" "The lighthouse at the end of the North Mole. With its twin on the South Mole it marks the harbour mouth.")
  (Bld "sllights" "South Light" "light" 2880 1150 11 11 0 "s1" "The lighthouse at the end of the South Mole.")
  (Bld "slharbour" "The Harbourmaster's House" "reeve" 1700 1420 24 15 4 "s1" "An arcaded stone house on the quay. Every ship that comes in pays its dues here; the watch and the cells are behind it.")
  (Bld "slmarket" "The Awning Market" "market" 1690 1130 14 12 0 "s1" "Spices, cloth, pottery and the day's fish under striped awnings.")
  (Bld "slstall1" "" "stall" 1640 1010 4 3 0 "s1" "")
  (Bld "slstall2" "" "stall" 1740 1230 4 3 0 "s1" "")
  (Bld "slinn" "The Salt Lantern" "inn" 1510 1390 18 12 3 "s1" "A tavern of whitewashed arches on the quay, lanterns in every window.")
  (Bld "slchand" "Quayside Chandlery" "store" 1520 860 14 9 -5 "s1" "Rope, canvas, pitch and lanterns.")
  (Bld "slspice" "The Spice Arcade" "provision" 1450 1050 14 9 0 "s1" "Food and spices for the voyage, sold under a long arcade.")
  (Bld "slware1" "The Salt Store" "warehouse" 2000 1580 24 12 18 "s4" "Where the salt from the pans is stacked and sold.")
  (Bld "slware2" "" "warehouse" 1990 690 18 11 -20 "s1" "")
  (Bld "slship1" "Harbour Berth 1" "ship" 2050 1100 26 8 10 "s1" "A berth for any ship that comes in: the first in port without a berth of her own here ties up." @{ berth = "open" })
  (Bld "slship2" "Harbour Berth 2" "ship" 2350 1050 28 8 -20 "s1" "A berth for any ship that comes in: the first in port without a berth of her own here ties up." @{ berth = "open" })
  (Bld "slship3" "Harbour Berth 3" "ship" 2250 870 24 7 25 "s1" "A berth for any ship that comes in: the first in port without a berth of her own here ties up." @{ berth = "open" })
  (Bld "slship4" "" "ship" 3300 900 28 8 -35 "s1" "Riding at anchor outside the harbour mouth.")
  (Bld "slboat1" "" "boat" 2180 1330 5 2 30 "s1" "")
  (Bld "slboat2" "" "boat" 1990 1220 5 2 -10 "s1" "")
  (Bld "sltemple" "The Temple of the Tides" "temple" 1180 250 40 40 0 "s2" "A great domed temple on the hilltop, its dome blue-grey against the sky." @{ dome = $true; roof = "lead" })
  (Bld "slbell" "The Bell Tower" "tower" 1330 180 9 9 0 "s2" "A slender bell tower beside the temple.")
  (Bld "slbath" "The Domed Baths" "healer" 1460 900 18 18 0 "s2" "Public baths under a terracotta dome; the healers of Saltmere work here." @{ dome = $true; roof = "tile" })
  (Bld "slcouncil" "The Council House" "office" 1330 1310 24 16 0 "s2" "Where the free city's merchant council keeps its records and hires its captains.")
  (Bld "slapoth" "The Glass Jar" "apothecary" 1240 960 8 7 0 "s2" "Remedies, oils and dyes.")
  (Bld "slsmith" "The Anvil Yard" "smith" 900 1250 12 9 -4 "s2" "Ironwork and ship's fittings.")
  (Bld "slarch" "The Chart Library" "archive" 1100 470 16 11 0 "s2" "Saltmere's charts and ship's logs, some older than Kalatecha.")
  (Bld "slfence" "The Back Room" "fence" 1150 1500 6 5 0 "s2" "Behind a rug seller's shop, for those who know to ask.")
  (Bld "slstable" "West Road Stables" "stable" 560 1150 14 9 -3 "s2" "Horses and mules for the road west.")
  (Bld "slwell" "Temple Court Well" "well" 1060 200 3 3 0 "s2" "")
)
$plan = [pscustomobject][ordered]@{ format = "ordinate-plan-v1"; of = "ns4eb21"; title = "Saltmere"; ppm = 5; unit = "yd"; compass = 8; regions = $regions; nodes = $nodes; roads = @(); shapes = $shapes
  roofs = [pscustomobject][ordered]@{ tile = .85; slate = .15 }
  sited = [pscustomobject][ordered]@{ inn = 1; store = 1; provision = 1; smith = 1; apothecary = 1; market = 1; temple = 1; healer = 1; reeve = 1; stable = 1; fence = 1; office = 1; archive = 1 } }
$d.plans | Add-Member -NotePropertyName ns4eb21 -NotePropertyValue $plan -Force
$n = $d.nodes | Where-Object id -eq "ns4eb21"
$n.services = [pscustomobject][ordered]@{ inn = 1; stable = 1; board = 1; store = 1; provision = 1; smith = 1; apothecary = 1; market = 1; temple = 1; healer = 1; reeve = 1; fence = 1; office = 1; archive = 1 }
$n | Add-Member -NotePropertyName notes -NotePropertyValue "A free city-state on the island's south-east coast, Kalatecha's rival and trading partner (picture: Pictures\Saltmere city picture.jpg). A walled harbour between two lighthouses, a castle on the headland, white houses and domes climbing a hill of cypresses, a market of striped awnings on the quay, and the salt pans along the strand that give the city its name and its fortune." -Force
# the picture, shrunk to 1920 px wide, for the players' screen
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("$C\Pictures\Saltmere city picture.jpg")
$w = [Math]::Min(1920, $img.Width); $h = [int][Math]::Round($img.Height * $w / $img.Width)
$bmp = New-Object System.Drawing.Bitmap $w, $h; $gr = [System.Drawing.Graphics]::FromImage($bmp); $gr.InterpolationMode = "HighQualityBicubic"; $gr.DrawImage($img, 0, 0, $w, $h); $gr.Dispose(); $img.Dispose()
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq "image/jpeg"
$ep = New-Object System.Drawing.Imaging.EncoderParameters 1; $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 85L
$ms = New-Object IO.MemoryStream; $bmp.Save($ms, $enc, $ep); $bmp.Dispose()
$d.files | Add-Member -NotePropertyName pic_saltmere -NotePropertyValue ([pscustomobject][ordered]@{ type = "image/jpeg"; data = [Convert]::ToBase64String($ms.ToArray()) }) -Force
$d.pictures = @(@($d.pictures | Where-Object { $_.id -ne "pic_saltmere" }) + @([pscustomobject][ordered]@{ id = "pic_saltmere"; name = "Saltmere (the city picture)" }))
[IO.File]::WriteAllText($f, ($d | ConvertTo-Json -Depth 80), $utf8)
$back = [IO.File]::ReadAllText($f, [Text.Encoding]::UTF8) | ConvertFrom-Json
"plan ns4eb21: $(@($back.plans.ns4eb21.nodes).Count) buildings, $(@($back.plans.ns4eb21.shapes).Count) shapes; pictures: " + (($back.pictures | ForEach-Object name) -join ", ")
