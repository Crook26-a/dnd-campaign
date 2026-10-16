# Dunmarrow's town plan (Joseph, 2026-10-16: no reference picture, so laid out from the campaign notes). Dunmarrow is the
# port of the inland country that holds Kalatecha Island's interior, on the north coast: the sea lies north, the river
# Marrow comes down from the south and is the harbour, the old hill fort (the Dun) holds the headland. Roads leave by the
# West Gate for Thornwick and by the South Gate for Tallow Cross and Halfway House.
# Writes "Town plans\Dunmarrow plan.json" in the campaign folder, for the app's Data → "Bring in a town plan…". It
# doesn't touch any save. Run it again to put the plan back as it is here.
$ErrorActionPreference = "Stop"
$utf8 = New-Object Text.UTF8Encoding $false
$C = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$out = "$C\Town plans"; if(-not (Test-Path $out)){ New-Item -ItemType Directory $out | Out-Null }
function Pts([string]$s){ @($s.Trim() -split '\s+' | ForEach-Object { $a = $_ -split ','; [pscustomobject][ordered]@{ x = [int]$a[0]; y = [int]$a[1] } }) }
function Shp($id, $kind, $name, $pts, [bool]$closed, [bool]$straight, $notes = "", $w = $null, $extra = @{}){
  $o = [ordered]@{ id = $id; kind = $kind; closed = $closed; straight = $straight; name = $name; side = 1; impassable = ($kind -in 'wall','impasse'); notes = $notes; pts = (Pts $pts) }
  if($w -ne $null){ $o.w = $w }; foreach($k in $extra.Keys){ $o[$k] = $extra[$k] }; [pscustomobject]$o }
$SVC = @("inn","store","provision","smith","apothecary","market","temple","healer","reeve","stable","fence","office","archive","trainer","coachhouse")
function Bld($id, $name, $kind, $x, $y, $w, $dp, $rot, $region, $notes, $extra = @{}){
  $s = [ordered]@{}; if($SVC -contains $kind){ if($kind -eq "coachhouse"){ $s.coach = 1; $s.stable = 1 } else { $s[$kind] = 1 } }
  $o = [ordered]@{ id = $id; name = $name; kind = $kind; region = $region; level = 1; origin = $false; seat = $false; services = [pscustomobject]$s; notes = $notes; x = $x; y = $y; w = $w; d = $dp; rot = $rot }
  foreach($k in $extra.Keys){ $o[$k] = $extra[$k] }; [pscustomobject]$o }

$regions = @(
  [pscustomobject][ordered]@{ id = "d1"; name = "The Dun"; threat = 2; hex = "#7a5a46"; notes = "The old hill fort on the headland: the Warden's keep, the garrison, the guns over the harbour." }
  [pscustomobject][ordered]@{ id = "d2"; name = "Old Town"; threat = 1; hex = "#8d7a52"; notes = "The walled town on the west bank: grey stone and slate, the market, the Customs House, the chapel." }
  [pscustomobject][ordered]@{ id = "d3"; name = "The Quays"; threat = 1; hex = "#3f6a78"; notes = "Both banks of the Marrow where it meets the sea, the mole and the beacon." }
  [pscustomobject][ordered]@{ id = "d4"; name = "Eastbank"; threat = 2; hex = "#6a6250"; notes = "Outside the walls across the river: warehouses, the navy yard, the ropewalk, rougher taverns." }
  [pscustomobject][ordered]@{ id = "d5"; name = "Outside the Walls"; threat = 2; hex = "#5e7a4e"; notes = "The South Gate's coach house and drovers, the Barrow Green, the roads inland and along the coast." }
)
$shapes = @(
  (Shp "dsea" "water" "The Northern Sea" "-900,-900 4300,-900 4300,380 3600,360 3100,380 2700,420 2350,470 2060,520 1950,470 1830,500 1650,470 1350,420 1220,300 1060,150 800,130 620,240 520,380 300,470 0,520 -900,560" $true $false "Grey water and a cold wind off it. Ships come in on the tide and anchor in the river mouth.")
  (Shp "drock" "rock" "Dun Head" "560,400 620,240 800,130 1060,150 1220,300 1190,470 900,530 650,510" $true $false "The rocky headland the Dun stands on.")
  (Shp "dshingle" "beach" "The Shingle" "2700,420 3100,380 3600,360 4300,380 4300,480 3600,460 3100,480 2700,510" $true $false "A long grey shingle beach running east; boats are drawn up on it.")
  (Shp "dbasin" "water" "The Wet Dock" "1560,620 1800,620 1800,900 1560,900" $true $true "A stone basin off the river, its gates kept shut at low tide so ships stay afloat.")
  (Shp "dmarrow" "river" "The Marrow" "2420,2900 2270,2400 2080,1900 2010,1400 1960,950 1940,620 1950,470" $false $false "The river Marrow, slow and brown, comes down from the inland hills. Its mouth is the harbour." $null @{ w0 = 70; w1 = 150 })
  (Shp "dmole" "pier" "The Mole" "2080,520 2300,330 2520,200" $false $false "A stone breakwater from the east bank, the beacon at its end." 40 @{ stone = $true })
  (Shp "dwquay" "street" "West Quay" "1830,560 1840,800 1860,1080 1890,1200" $false $false "The stone quay along the west bank: the Customs House, the fishing boats, the herring barrels." 50)
  (Shp "dequay" "street" "East Quay" "2090,580 2100,800 2120,1100" $false $false "The east bank's quay: the warehouses and the navy yard." 50)
  (Shp "dbridge" "street" "Marrow Bridge" "1760,1260 1990,1250 2210,1240" $false $true "A stone bridge of five arches; the only way across, and the watch keeps a post at its west end." 34)
  (Shp "dhigh" "street" "High Street" "1150,1790 1200,1500 1260,1250 1180,900 1000,620" $false $false "From the South Gate up past the market to the Dun." 40)
  (Shp "dwest" "street" "West Street" "420,1000 800,1060 1150,1130" $false $false "From the West Gate in to the market." 34)
  (Shp "dbridgest" "street" "Bridge Street" "1400,1160 1600,1220 1760,1260" $false $false "Down from the market to the bridge." 34)
  (Shp "dquayst" "lane" "Quay Street" "1400,1100 1600,900 1830,760" $false $false "Down to the quay." 22)
  (Shp "dchapel" "lane" "Chapel Lane" "800,1060 720,1300 760,1550" $false $false "" 20)
  (Shp "dkeep" "lane" "Wardens' Walk" "1000,620 1300,560 1600,560" $false $false "Along under the Dun's walls to the wet dock." 20)
  (Shp "dtan" "lane" "Tanners' Row" "2210,1240 2500,1180 2800,1050" $false $false "Out along the east bank: the tanneries, by the smell." 22)
  (Shp "drope" "lane" "Ropewalk Lane" "2120,800 2450,760 2800,700" $false $false "" 22)
  (Shp "deast" "lane" "Eastbank Road" "2210,1240 2250,1600 2300,2000" $false $false "" 22)
  (Shp "dsouth" "street" "The South Road" "1150,1790 1200,2200 1260,2600 1300,3100" $false $false "Inland to Tallow Cross, 87 miles, through the country's heart." 36)
  (Shp "dsw" "street" "Halfway Road" "1180,2050 800,2350 300,2750 -300,3100" $false $false "South-west to Halfway House." 30)
  (Shp "dcoast" "street" "Coast Road" "420,1000 0,960 -500,920 -900,900" $false $false "West along the coast to Thornwick." 30)
  (Shp "dmkt" "market" "Market Square" "1150,1040 1400,1050 1410,1260 1160,1250" $true $true "Fish, wool, timber and grain from inland; the country's tax on every stall.")
  (Shp "dmuster" "square" "Muster Yard" "860,560 1080,560 1080,680 860,680" $true $true "The paved yard before the Dun Gate, where the garrison drills.")
  (Shp "ddunwall" "wall" "The Dun Walls" "700,250 1050,200 1160,330 1110,470 780,500 680,380 700,250" $false $true "Old walls of dry stone and newer gun platforms.")
  (Shp "dwall1" "wall" "The Town Wall" "820,520 470,700 400,960" $false $true "Grey stone, twenty feet high.")
  (Shp "dwall2" "wall" "" "410,1050 380,1300 600,1650 1100,1780" $false $true "")
  (Shp "dwall3" "wall" "" "1210,1780 1700,1740 1980,1700" $false $true "")
  (Shp "dgrave" "graveyard" "The Chapel Yard" "560,1350 700,1350 700,1500 560,1500" $true $true "Slate headstones leaning in the wind.")
  (Shp "dgreen" "green" "The Barrow Green" "300,1900 700,1850 800,2150 400,2300 200,2150" $true $false "A common outside the walls, and on it the old barrow mound that gave the town its name. Nobody digs there.")
  (Shp "dyard" "yard" "The Timber Yard" "2500,1300 2800,1260 2830,1500 2520,1540" $true $true "Logs floated down the Marrow from the inland forests, stacked to season.")
  (Shp "zold" "zone" "Old Town" "820,520 1100,520 1700,560 1800,620 1820,1700 1200,1770 640,1640 420,1300 430,800" $true $false "" $null @{ density = "city" })
  (Shp "zeast" "zone" "Eastbank" "2100,560 2700,520 2900,700 2900,1250 2500,1650 2250,1900 2100,1300" $true $false "" $null @{ density = "town" })
  (Shp "zsouth" "zone" "South Gate" "950,1820 1450,1820 1500,2150 1000,2200" $true $false "" $null @{ density = "village" })
)
$nodes = @(
  (Bld "dndun" "The Dun" "hall" 900 340 46 34 -4 "d1" "The old hill fort: a square keep inside dry-stone walls, guns on new platforms facing the sea. The Warden of Dunmarrow governs the port from here for the inland country, and the garrison lives in its yard.")
  (Bld "dnt1" "" "tower" 720 280 9 9 0 "d1" "A tower of the Dun.")
  (Bld "dnt2" "" "tower" 1060 220 9 9 0 "d1" "A tower of the Dun, its gun platform over the harbour mouth.")
  (Bld "dnt3" "" "tower" 1110 450 9 9 0 "d1" "A tower of the Dun.")
  (Bld "dndungate" "The Dun Gate" "gate" 960 500 10 7 0 "d1" "The fort's one gate, onto the Muster Yard.")
  (Bld "dnwestgate" "West Gate" "gate" 405 1005 10 7 80 "d2" "The gate onto the coast road for Thornwick. Shut at dusk.")
  (Bld "dnsouthgate" "South Gate" "gate" 1155 1785 10 7 5 "d2" "The main gate: the South Road for Tallow Cross and the Halfway Road leave from here. Shut at dusk; the coach goes before dawn.")
  (Bld "dncustoms" "The Customs House" "reeve" 1700 720 26 16 3 "d3" "A grim stone house on the West Quay. Every ship pays the inland country's duty here, and ships from the free cities (Kalatecha and Saltmere) pay it in full; the watch and the cells are behind.")
  (Bld "dntally" "The Tally House" "archive" 1500 640 16 11 0 "d2" "Where the duties are counted and the ledgers kept, with the country's charts of the north coast. Its clerks know which captains cheat.")
  (Bld "dnhire" "The Hiring Hall" "office" 1320 940 20 13 -5 "d2" "Where the Warden's contracts are posted and paid: escorts inland, wreck-salvage, and the occasional bounty.")
  (Bld "dnchapel" "The Chapel of the Drowned" "temple" 650 1270 28 18 -6 "d2" "A low stone chapel with a slate spire, where sailors' widows light candles for the men the sea kept." @{ roof = "slate" })
  (Bld "dnalms" "The Almshouse" "healer" 900 1450 22 12 0 "d2" "The Warden's almshouse: beds for the sick, a herb garden, and two tired healers.")
  (Bld "dnherring" "The Tarred Herring" "inn" 1640 1000 18 12 2 "d3" "A low-beamed sailors' inn on the West Quay, smelling of tar, smoke and fish stew.")
  (Bld "dnsmith" "Iron Row Smithy" "smith" 1000 1330 13 9 4 "d2" "Anchors, chain and ship's ironwork, and the garrison's blades sharpened.")
  (Bld "dnapoth" "Mother Brack's" "apothecary" 1100 1560 8 7 0 "d2" "Remedies for chest, cough and cold, and less said about the rest.")
  (Bld "dnprov" "The Salt Barrel" "provision" 1450 1340 13 9 0 "d2" "Salt beef, hard biscuit and barrels of herring for the voyage.")
  (Bld "dngarrison" "The Garrison Yard" "trainer" 760 640 18 12 0 "d1" "The garrison's drill yard and armoury below the Dun; their sergeant will teach a blade for a fee.")
  (Bld "dncross" "The Market Cross" "statue" 1280 1150 3 3 0 "d2" "An old stone cross worn smooth. The country's proclamations are nailed to it.")
  (Bld "dnwell" "Market Well" "well" 1370 1235 3 3 0 "d2" "")
  (Bld "dnmarket" "The Wool Hall" "market" 1210 1080 16 10 0 "d2" "A timber market hall on stone pillars at the top of the square: wool, fish and grain from inland, weighed and taxed.")
  (Bld "dnchand" "Marrow Chandlery" "store" 2200 900 15 10 -3 "d4" "Rope from the ropewalk, canvas, pitch and lanterns.")
  (Bld "dnnavy" "The Navy Yard" "shipwright" 2300 640 34 18 -30 "d4" "Where the inland country builds and mends its few warships. Two are on the stocks; the Warden wants more.")
  (Bld "dnrope" "The Ropewalk" "warehouse" 2600 820 60 6 -8 "d4" "A long low shed where the rope for half the north coast is twisted.")
  (Bld "dnware1" "Grain Store" "warehouse" 2300 1050 22 12 0 "d4" "Grain from inland, waiting for ships.")
  (Bld "dnware2" "" "warehouse" 2450 1150 20 11 -10 "d4" "")
  (Bld "dnware3" "" "warehouse" 2250 760 18 10 0 "d4" "")
  (Bld "dnloft" "The Net Loft" "fence" 2650 1100 10 7 -12 "d4" "Nets mended downstairs; upstairs, goods that came off ships without paying at the Customs House.")
  (Bld "dnbeacon" "Mole Beacon" "light" 2530 195 11 11 0 "d3" "A fire tower at the end of the Mole, lit every night and in fog.")
  (Bld "dnwatch" "Shingle Watch" "tower" 3300 440 9 9 0 "d4" "A watchtower on the shingle, looking east along the coast.")
  (Bld "dnship1" "" "ship" 2010 760 24 7 85 "d3" "Moored in the river mouth.")
  (Bld "dnship2" "" "ship" 1990 1000 26 8 95 "d3" "")
  (Bld "dnship3" "" "ship" 1680 760 22 7 0 "d3" "In the Wet Dock.")
  (Bld "dnship4" "" "ship" 2700 -150 28 8 -20 "" "At anchor outside, waiting on the tide.")
  (Bld "dnboat1" "" "boat" 3000 430 5 2 10 "d4" "Drawn up on the shingle.")
  (Bld "dnboat2" "" "boat" 3150 420 5 2 -15 "d4" "")
  (Bld "dnboat3" "" "boat" 1900 1120 5 2 80 "d3" "")
  (Bld "dncoach" "The Coach House" "coachhouse" 1360 1880 22 13 0 "d5" "The coach for Tallow Cross, Halfway House and Thornwick leaves from here before dawn. Fresh horses, and a clerk who takes the fares.")
  (Bld "dndrovers" "The Drovers' Rest" "inn" 1000 2000 20 12 4 "d5" "Cattle drovers and carters from inland, a long room and a yard full of wagons.")
  (Bld "dnstable" "South Gate Stables" "stable" 1380 2100 16 9 0 "d5" "Horses and mules for the inland roads.")
  (Bld "dnbarrow" "The Barrow" "statue" 450 2080 6 6 0 "d5" "A grassy mound older than the town, ringed with standing stones. Some say a king is under it, some say worse.")
)
$plan = [ordered]@{ format = "ordinate-plan-v1"; of = "ns4g5g2"; title = "Dunmarrow"; ppm = 5; unit = "yd"; compass = 8; regions = $regions; nodes = $nodes; roads = @(); shapes = $shapes
  roofs = [pscustomobject][ordered]@{ slate = .6; thatch = .28; timber = .12 }
  sited = [pscustomobject][ordered]@{ inn = 1; store = 1; provision = 1; smith = 1; apothecary = 1; market = 1; temple = 1; healer = 1; reeve = 1; stable = 1; fence = 1; office = 1; archive = 1; trainer = 1; coach = 1 }
  place = [pscustomobject][ordered]@{ notes = "Laid out 2026-10-16 (no picture): the old hill fort (the Dun) on its headland, the river Marrow as the harbour, the walled Old Town on the west bank, Eastbank's warehouses and navy yard across the bridge, and the coach house and the old barrow outside the South Gate. Grey stone, slate and thatch." } }
$file = "$out\Dunmarrow plan.json"
[IO.File]::WriteAllText($file, ([pscustomobject]$plan | ConvertTo-Json -Depth 40), $utf8)
$back = [IO.File]::ReadAllText($file, [Text.Encoding]::UTF8) | ConvertFrom-Json
"$file : $(@($back.nodes).Count) buildings, $(@($back.shapes).Count) shapes"
