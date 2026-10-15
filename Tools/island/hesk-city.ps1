# Port Hesk's town plan (laid out from "Pictures\Port Hesk city picture.jpg"), and that picture for the players' screen,
# into the newest save. Run it again to put the plan back as it is here (it replaces plans.thesk).
$ErrorActionPreference = "Stop"
$utf8 = New-Object Text.UTF8Encoding $false
$C = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$f = "$C\Saves\2026-10-15 kalatecha (roads joined, test island).json"
$d = [IO.File]::ReadAllText($f, [Text.Encoding]::UTF8) | ConvertFrom-Json
function Pts([string]$s){ @($s.Trim() -split '\s+' | ForEach-Object { $a = $_ -split ','; [pscustomobject][ordered]@{ x = [int]$a[0]; y = [int]$a[1] } }) }
function Shp($id, $kind, $name, $pts, [bool]$closed, [bool]$straight, $notes = "", $w = $null){
  $o = [ordered]@{ id = $id; kind = $kind; closed = $closed; straight = $straight; name = $name; side = 1; impassable = ($kind -in 'wall','impasse'); notes = $notes; pts = (Pts $pts) }
  if($w -ne $null){ $o.w = $w }; [pscustomobject]$o }
$SVC = @("inn","store","provision","smith","apothecary","market","temple","healer","reeve","stable","fence","office","archive")
function Bld($id, $name, $kind, $x, $y, $w, $dp, $rot, $region, $notes){
  $s = [ordered]@{}; if($SVC -contains $kind){ $s[$kind] = 1 }
  [pscustomobject][ordered]@{ id = $id; name = $name; kind = $kind; region = $region; level = 1; origin = $false; seat = $false; services = [pscustomobject]$s; notes = $notes; x = $x; y = $y; w = $w; d = $dp; rot = $rot } }

$regions = @(
  [pscustomobject][ordered]@{ id = "h1"; name = "The Harbour"; threat = 1; hex = "#3f6f78"; notes = "The quay, the piers and the market: ships, cargo, gulls and noise." }
  [pscustomobject][ordered]@{ id = "h2"; name = "Hesk Castle"; threat = 2; hex = "#8f4436"; notes = "The castle on the rocky headland, its guns trained on the harbour mouth." }
  [pscustomobject][ordered]@{ id = "h3"; name = "The Hill"; threat = 1; hex = "#a8752c"; notes = "Timber-framed houses climbing the slope to the cathedral." }
  [pscustomobject][ordered]@{ id = "h4"; name = "Outside the Walls"; threat = 2; hex = "#5e7a4e"; notes = "The wooded heights beyond the town wall." }
)
$shapes = @(
  (Shp "hheights" "green" "The Heights" "300,1000 500,500 1200,150 2200,0 3300,100 3600,700 3500,1500 3150,1600 3110,1000 3030,470 2400,410 1700,570 1090,860 830,1230" $true $true "Wooded slopes above the town wall.")
  (Shp "hsea" "water" "Hesk Harbour" "-600,500 120,560 230,900 260,1150 330,1400 450,1640 620,1790 800,1760 880,1560 1050,1480 1500,1455 2100,1500 2350,1640 2460,1900 2620,2120 3500,2250 3500,3000 -600,3000" $true $false "The harbour basin, sheltered by the castle headland and its breakwater, and the open sea beyond.")
  (Shp "hrock" "rock" "Castle Rock" "240,1120 330,1080 760,1180 830,1420 800,1700 640,1770 470,1640 340,1420" $true $false "The rocky headland the castle stands on; the sea breaks white on it.")
  (Shp "hcastlewall" "wall" "Castle Walls" "380,1250 720,1220 790,1460 720,1660 460,1620 370,1430 380,1250" $false $true "The castle's curtain wall, round towers at the corners, cannon on the seaward side.")
  (Shp "htownwall" "wall" "The Town Wall" "820,1260 1100,880 1700,600 2400,440 3000,500 3080,1100 2950,1900" $false $false "The town wall runs from the castle up along the ridge and back down to the eastern shore, with towers along it.")
  (Shp "hbreak" "pier" "The Breakwater" "780,1740 1150,1900 1550,1990 1750,2000" $false $false "A long stone breakwater from the castle rock, piled with crates and nets." 50)
  (Shp "hquay" "street" "The Quay" "900,1440 1300,1405 1700,1415 2100,1465 2380,1610 2440,1820" $false $false "The stone quay round the harbour: barrels, rope, cargo and crowds." 60)
  (Shp "hpier1" "pier" "Castle Pier" "1180,1410 1160,1640" $false $false "" 20)
  (Shp "hpier2" "pier" "Middle Pier" "1560,1420 1570,1700" $false $false "" 20)
  (Shp "hpier3" "pier" "Customs Pier" "1960,1470 2000,1720" $false $false "" 20)
  (Shp "hjetty" "pier" "Fishers' Jetty" "2320,1620 2230,1800" $false $false "Rowboats and fishing boats tie up here." 15)
  (Shp "hmktsq" "market" "Quay Market" "2180,1520 2400,1600 2430,1780 2240,1760" $true $true "Stalls and awnings at the east end of the quay.")
  (Shp "hcathsq" "square" "Cathedral Close" "1650,820 1980,800 2000,960 1680,980" $true $true "")
  (Shp "hclocksq" "square" "Clock Square" "1820,1150 2120,1140 2140,1340 1840,1350" $true $true "The square by the Customs House and the clock tower.")
  (Shp "hb1" "block" "" "960,1300 1150,1290 1160,1380 970,1390" $true $true "")
  (Shp "hb2" "block" "" "1230,1160 1450,1140 1470,1270 1240,1290" $true $true "")
  (Shp "hb3" "block" "" "1520,1120 1760,1100 1780,1260 1540,1280" $true $true "")
  (Shp "hb4" "block" "" "1150,950 1420,900 1450,1060 1180,1100" $true $true "")
  (Shp "hb5" "block" "" "1500,880 1620,860 1640,1040 1520,1060" $true $true "")
  (Shp "hb6" "block" "" "2060,820 2320,780 2350,980 2090,1010" $true $true "")
  (Shp "hb7" "block" "" "2240,1100 2520,1060 2560,1300 2280,1340" $true $true "")
  (Shp "hb8" "block" "" "2420,620 2720,580 2760,800 2460,840" $true $true "")
  (Shp "hb9" "block" "" "2600,1000 2900,960 2950,1400 2650,1440" $true $true "")
  (Shp "hb10" "block" "" "1350,700 1600,640 1620,780 1380,830" $true $true "")
  (Shp "scastle" "lane" "Castle Road" "830,1300 960,1420" $false $false "From the castle gate down to the quay." 25)
  (Shp "shigh" "street" "High Street" "1700,1410 1800,1100 1820,980 1900,700 2000,500" $false $false "Up from the quay past the clock tower and the cathedral to the North Gate." 40)
  (Shp "swall" "lane" "Wall Lane" "1000,1180 1300,1100 1500,1080 1800,1060 2200,1040 2600,950 3050,1000" $false $false "Across the hill below the wall, to the East Gate." 25)
  (Shp "sropes" "alley" "Ropewalk" "1200,1290 1480,1110" $false $false "A steep alley of rope-makers and sail lofts." 15)
  (Shp "ssteps" "lane" "Cathedral Steps" "1620,1400 1690,1100 1700,980" $false $false "" 20)
)
$nodes = @(
  (Bld "hkcastle" "Hesk Castle" "hall" 560 1430 48 34 -4 "h2" "The castle on the rocky headland: square keep, curtain wall with round corner towers, flags flying, and a row of cannon trained on the harbour mouth. The lord of Port Hesk keeps the town from here.")
  (Bld "hkctower1" "Sea Tower" "tower" 400 1300 9 9 0 "h2" "The castle's seaward corner tower, its conical roof a landmark from the sea.")
  (Bld "hkctower2" "Harbour Tower" "tower" 760 1640 9 9 0 "h2" "The castle tower that watches the breakwater and the harbour mouth.")
  (Bld "hkgate" "Castle Gate" "gate" 830 1290 10 7 -30 "h2" "The arched gatehouse joining the castle to the town.")
  (Bld "hkcustoms" "The Customs House" "reeve" 2000 1250 32 20 0 "h1" "A grand stone customs house with columns and a pediment, newer and finer than everything around it. Every cargo is weighed, taxed and written down here; the harbour watch and the cells are behind it.")
  (Bld "hkclock" "The Clock Tower" "tower" 1860 1150 7 7 0 "h1" "A tall stone clock tower beside the Customs House; the harbour sets its day by it.")
  (Bld "hkinn" "The Gull and Cannon" "inn" 1620 1310 16 11 3 "h1" "A crowded timber-framed tavern on the quay, smoke from every chimney.")
  (Bld "hkfish" "The Fish Steps" "provision" 1780 1340 11 8 3 "h1" "Fish, salt and ship's biscuit sold straight off the boats.")
  (Bld "hkchand" "Mallory's Chandlery" "store" 1420 1330 12 8 2 "h1" "Rope, tar, canvas, lanterns and everything else a ship needs.")
  (Bld "hkware1" "" "warehouse" 1010 1340 14 9 -3 "h1" "")
  (Bld "hkware2" "" "warehouse" 1260 1330 14 9 -2 "h1" "")
  (Bld "hkyard" "The Slipway" "shipwright" 940 1500 16 10 -20 "h1" "Hulls on the slip under the castle rock.")
  (Bld "hkmarket" "Quay Market" "market" 2300 1660 14 10 8 "h1" "Awnings, crates, barrels and coils of rope at the east end of the quay.")
  (Bld "hkstall1" "" "stall" 2230 1580 3 3 0 "h1" "")
  (Bld "hkstall2" "" "stall" 2380 1730 3 3 0 "h1" "")
  (Bld "hktent" "" "tent" 2240 1740 5 4 0 "h1" "")
  (Bld "hkship1" "" "ship" 1360 1620 8 3 80 "h1" "")
  (Bld "hkship2" "" "ship" 1760 1650 8 3 95 "h1" "")
  (Bld "hkship3" "" "ship" 2120 1680 8 3 70 "h1" "")
  (Bld "hkship4" "" "ship" 1100 1780 8 3 15 "h1" "")
  (Bld "hkboat1" "" "boat" 1450 1800 2 1 60 "h1" "")
  (Bld "hkboat2" "" "boat" 2240 1830 2 1 30 "h1" "")
  (Bld "hkcath" "Hesk Cathedral" "temple" 1820 880 44 22 0 "h3" "A great grey Gothic cathedral with a square tower and pinnacles, high on the hill above the harbour.")
  (Bld "hkhealer" "The Almonry" "healer" 2020 900 9 7 0 "h3" "The cathedral's almonry, where the sick are nursed.")
  (Bld "hksmith" "The Anchor Forge" "smith" 1300 1020 11 8 -6 "h3" "Anchors, chain and cannon shot.")
  (Bld "hkapoth" "Wenna's Remedies" "apothecary" 1560 960 7 6 0 "h3" "A narrow shop of jars and drying herbs.")
  (Bld "hkhall" "The Guildhall" "hall" 2380 900 18 12 -4 "h3" "The merchants' guildhall, timber-framed and three storeys high.")
  (Bld "hkfence" "The Cellar Door" "fence" 2420 1220 5 4 0 "h3" "A door below a pawnbroker's that only opens to the right knock.")
  (Bld "hkstable" "North Gate Stables" "stable" 2080 560 12 8 -8 "h3" "Horses and mules for the roads inland.")
  (Bld "hknorth" "North Gate" "gate" 2000 500 9 6 -12 "h4" "The landward gate; the roads to Emberfold and Reedmere leave from here.")
  (Bld "hkeast" "East Gate" "gate" 3060 1000 9 6 80 "h4" "The gate on the coast road to Gorse End and Cairnby.")
  (Bld "hkwt1" "" "tower" 1100 880 7 7 0 "h4" "A tower on the town wall.")
  (Bld "hkwt2" "" "tower" 1700 600 7 7 0 "h4" "A tower on the town wall.")
  (Bld "hkwt3" "" "tower" 2700 460 7 7 0 "h4" "A tower on the town wall.")
  (Bld "hkwell" "Clock Square Well" "well" 1980 1300 2 2 0 "h1" "")
)
$plan = [pscustomobject][ordered]@{ format = "ordinate-plan-v1"; of = "thesk"; title = "Port Hesk"; ppm = 5; unit = "yd"; compass = 8; regions = $regions; nodes = $nodes; roads = @(); shapes = $shapes
  sited = [pscustomobject][ordered]@{ inn = 1; store = 1; provision = 1; smith = 1; apothecary = 1; market = 1; temple = 1; healer = 1; reeve = 1; stable = 1; fence = 1 } }
$d.plans | Add-Member -NotePropertyName thesk -NotePropertyValue $plan -Force
$n = $d.nodes | Where-Object id -eq "thesk"
$n.services = [pscustomobject][ordered]@{ inn = 1; stable = 1; board = 1; store = 1; provision = 1; smith = 1; apothecary = 1; market = 1; temple = 1; healer = 1; reeve = 1; fence = 1 }
$n.notes = "Test island (2026-10-15). The island's harbour city, at the head of the southern bay (picture: Pictures\Port Hesk city picture.jpg). A castle on a rocky headland guards the harbour with cannon; a stone quay curves round the basin, busy with ships, cargo and a market; timber-framed houses climb the hill to a grey cathedral, and a town wall runs along the ridge. The Customs House by the clock tower taxes every cargo."
# the picture, shrunk to 1920 px wide, for the players' screen
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("$C\Pictures\Port Hesk city picture.jpg")
$w = [Math]::Min(1920, $img.Width); $h = [int][Math]::Round($img.Height * $w / $img.Width)
$bmp = New-Object System.Drawing.Bitmap $w, $h; $gr = [System.Drawing.Graphics]::FromImage($bmp); $gr.InterpolationMode = "HighQualityBicubic"; $gr.DrawImage($img, 0, 0, $w, $h); $gr.Dispose(); $img.Dispose()
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq "image/jpeg"
$ep = New-Object System.Drawing.Imaging.EncoderParameters 1; $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 85L
$ms = New-Object IO.MemoryStream; $bmp.Save($ms, $enc, $ep); $bmp.Dispose()
$d.files | Add-Member -NotePropertyName pic_hesk -NotePropertyValue ([pscustomobject][ordered]@{ type = "image/jpeg"; data = [Convert]::ToBase64String($ms.ToArray()) }) -Force
$d.pictures = @(@($d.pictures | Where-Object { $_.id -ne "pic_hesk" }) + @([pscustomobject][ordered]@{ id = "pic_hesk"; name = "Port Hesk (the city picture)" }))
[IO.File]::WriteAllText($f, ($d | ConvertTo-Json -Depth 80), $utf8)
$back = [IO.File]::ReadAllText($f, [Text.Encoding]::UTF8) | ConvertFrom-Json
"plan thesk: $(@($back.plans.thesk.nodes).Count) buildings, $(@($back.plans.thesk.shapes).Count) shapes; pictures: " + (($back.pictures | ForEach-Object name) -join ", ") + "; picture $([math]::Round($ms.Length/1024)) KB"
