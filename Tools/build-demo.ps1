# Builds the demonstration map, the Gull Isles, and packs it with the app into one file anyone can open:
# "Ordinate Demo.html" in DnD\Ordinate Demo. It keeps its own save in the browser (<meta name="ordinate-store">),
# so it never touches a real campaign on the same computer, and it opens straight into the demo.
# Everything in it is made up for the demo, and its rules content is the free SRD 5.2 only (2024 rules):
# no Kalatecha, no story from the Age of Exploration campaign.
param([string]$OutDir)
$Campaign = Split-Path $PSScriptRoot -Parent
if (-not $OutDir) { $OutDir = Join-Path (Split-Path $Campaign -Parent) "Ordinate Demo" }
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }
$PPM = 5
$hex = @{ g = "#5e7a4e"; p = "#6b5a86"; o = "#a8752c"; t = "#3f6f78"; r = "#8f4436" }

function P([string]$s, [double]$k = $PPM) {
  @($s.Trim() -split '\s+' | ForEach-Object { $a = $_ -split ','; [ordered]@{ x = [math]::Round([double]$a[0] * $k); y = [math]::Round([double]$a[1] * $k) } })
}
function Bld($id, $name, $kind, $x, $y, $w, $d, $rot, $region, $notes, $svc = @{}) {
  [ordered]@{ id = $id; name = $name; kind = $kind; region = $region; level = 1
    origin = $false; seat = $false; services = $svc; notes = $notes
    x = [math]::Round($x * $PPM); y = [math]::Round($y * $PPM); w = $w; d = $d; rot = $rot }
}
function Shp($id, $kind, $name, $pts, [bool]$closed, [bool]$straight, $notes = "", $extra = @{}, [double]$k = $PPM) {
  $o = [ordered]@{ id = $id; kind = $kind; closed = $closed; straight = $straight; name = $name; side = 1
    impassable = ($kind -in 'wall', 'impasse'); notes = $notes; pts = (P $pts $k) }
  foreach ($key in $extra.Keys) { $o[$key] = $extra[$key] }
  $o
}
function St($id, $kind, $name, $pts, $widthYd, $notes = "") { Shp $id $kind $name $pts $false $false $notes @{ w = $widthYd * $PPM } }
function SNode($id, $name, $kind, $x, $y, $region, $notes, $extra = @{}) {
  $o = [ordered]@{ id = $id; name = $name; kind = $kind; region = $region; level = 1
    origin = $false; seat = $false; services = @{}; notes = $notes; x = $x; y = $y }
  foreach ($key in $extra.Keys) { $o[$key] = $extra[$key] }
  $o
}
function LNpc($id, $name, $role, $where, $look, $voice, $wants, $knows, $notes = "") {
  [ordered]@{ id = $id; name = $name; role = $role; where = $where; look = $look; voice = $voice; wants = $wants; knows = $knows; fightsAs = ""; notes = $notes }
}
function LLoot($id, $name, $kind, $value, $desc, $notes = "") {
  [ordered]@{ id = $id; name = $name; kind = $kind; value = $value; desc = $desc; notes = $notes; rarity = "Common" }
}
function IMap($name, $rows, $labels, $party, $enemy, $notes) {
  $w = $rows[0].Length; foreach ($r in $rows) { if ($r.Length -ne $w) { throw "$name has a row of $($r.Length) squares, not $w`: $r" } }
  $L = New-Object System.Collections.ArrayList
  foreach ($lab in ($labels -split ';')) { if (-not $lab) { continue }; $p = $lab -split ',', 3; [void]$L.Add(@([double]$p[0], [double]$p[1], $p[2])) }
  $pts = { param($s) $a = New-Object System.Collections.ArrayList; foreach ($q in ($s -split ' ')) { if (-not $q) { continue }; $xy = $q -split ','; [void]$a.Add(@([int]$xy[0], [int]$xy[1])) }; , $a }
  [ordered]@{ name = $name; by = "builder"; rows = $rows; labels = $L; start = [ordered]@{ party = (& $pts $party); enemy = (& $pts $enemy) }; notes = $notes }
}

# --- the free rules (SRD 5.2), for stat blocks, spells and items -----------------------------------
$srdRaw = [IO.File]::ReadAllText("$PSScriptRoot\srd\srd-data.js", [Text.Encoding]::UTF8)
$srd = $srdRaw.Substring($srdRaw.IndexOf("{"), $srdRaw.LastIndexOf("}") - $srdRaw.IndexOf("{") + 1) | ConvertFrom-Json
function SrdItem($nm) { $hit = @($srd.loot | Where-Object name -eq $nm) | Select-Object -First 1; if (-not $hit) { throw "no SRD item named '$nm'" }; $hit.id }
function SrdSpell($nm) { $hit = @($srd.spells | Where-Object name -eq $nm) | Select-Object -First 1; if (-not $hit) { throw "no SRD spell named '$nm'" }; $hit.id }
function SrdFoe($nm) { $hit = @($srd.foes | Where-Object name -eq $nm) | Select-Object -First 1; if (-not $hit) { throw "no SRD creature named '$nm'" }; $hit }
function PairList($a) {
  $out = New-Object System.Collections.ArrayList
  if ($a -is [array]) { if ($a.Count -ge 2 -and $a[0] -is [string]) { [void]$out.Add(@($a[0], $a[1])) } else { foreach ($p in $a) { [void]$out.Add(@($p[0], $p[1])) } } }
  return , $out
}
function SheetAttacks($b) {
  $out = @()
  foreach ($p in @((PairList $b.act) + (PairList $b.bon))) {
    $t = [string]$p[1]
    $hit = [regex]::Match($t, 'Attack Roll:\s*([+-]\d+)').Groups[1].Value
    $dc = [regex]::Match($t, '(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw:?\*?\s*DC (\d+)')
    if (-not $hit -and -not $dc.Success) { continue }
    $h = [regex]::Match($t, '\((\d+d\d+(?:\s*[+-]\s*\d+)?)\)\s*([A-Za-z]+) damage')
    $out += [ordered]@{ name = ($p[0] -replace '\s*\(.*\)\s*$', ''); hit = $(if ($hit) { $hit } else { "$($dc.Groups[1].Value.Substring(0,3).ToUpper()) $($dc.Groups[2].Value)" })
      dmg = ($h.Groups[1].Value -replace '\s', ''); dtype = $h.Groups[2].Value.ToLower() }
  }
  return , $out
}
function SheetFromSrd($n, $srdName) {
  $b = SrdFoe $srdName
  $pp = [regex]::Match([string]$b.sen, 'Passive Perception (\d+)').Groups[1].Value
  $n.ac = "$($b.ac)"; $n.hpMax = "$($b.hp)"; $n.hp = "$($b.hp)"; $n.speed = $b.spd; $n.init = $b.init; $n.pp = $pp; $n.cr = $b.cr
  $n.str = "$($b.ab[0])"; $n.dex = "$($b.ab[1])"; $n.con = "$($b.ab[2])"; $n.int = "$($b.ab[3])"; $n.wis = "$($b.ab[4])"; $n.cha = "$($b.ab[5])"
  $n.saves = $b.sav; $n.skills = $b.sk; $n.langs = $b.lang
  $n.senses = (([string]$b.sen) -replace ',?\s*Passive Perception \d+', '').Trim()
  $n.attacks = SheetAttacks $b
  $spells = @()
  foreach ($p in (PairList $b.act)) { if ($p[0] -match '^Spellcasting') {
    foreach ($m in [regex]::Matches([string]$p[1], '\*\*[^*]+:\*\*\s*([^\n]+)')) { foreach ($nm in ($m.Groups[1].Value -split ',\s*')) {
      $s = $srd.spells | Where-Object { $_.name -eq $nm.Trim().TrimEnd('.') } | Select-Object -First 1; if ($s) { $spells += $s.id } } } } }
  if ($spells.Count) { $n.spells = @($spells | Select-Object -Unique) }
  $n.statBlock = ($b | ConvertTo-Json -Depth 8 -Compress | ConvertFrom-Json)
  $n.fightsAs = "self"
}

# --- the town: Brindleport, a little fishing harbor (yards) -----------------------------------------
$planNodes = @(
  (Bld "pgull" "The Gilded Gull" "inn" 180 120 16 12 0 "d1" 'The harbor tavern: low beams, a long bar, a hearth that never goes out. Bess Copperpot runs it and hears everything.' @{ inn = 1 })
  (Bld "pharbor" "Harbormaster's Office" "office" 252 168 14 10 0 "d1" 'Charts, ledgers and a notice board for anyone looking for work. Harbormaster Odo Venn posts the jobs.')
  (Bld "pshop" "Wick & Wax" "store" 302 112 11 9 0 "d2" 'Lamps, rope, rations and odds and ends. Tamsin Wick haggles for the fun of it.' @{ store = 1 })
  (Bld "pshrine" "Shrine of the Tide" "temple" 360 150 16 11 0 "d2" 'A small shrine to the sea, with candles, pews and a cracked old bell. Sister Mira heals for whatever folk can give.' @{ temple = 1; healer = 1 })
  (Bld "pmarket" "Fish Market" "market" 236 92 14 12 0 "d2" 'Gulls, nets and the morning catch.' @{ market = 1 })
  (Bld "pberth" "The Merry Gannet" "ship" 214 240 22 7 -4 "d1" 'The party''s ship, tied up at the end of the pier.')
  (Bld "plight" "Harbor Light" "tower" 120 236 8 8 0 "d1" 'A squat stone lighthouse on the breakwater.')
  (Bld "pstall1" "" "stall" 222 88 4 3 0 "d2" 'Fish stall.')
  (Bld "pstall2" "" "stall" 250 98 4 3 0 "d2" 'Net mender''s stall.')
)
$planShapes = @(
  (Shp "pwater" "water" "Brindle Harbor" "0,212 480,212 480,360 0,360" $true $true 'The harbor, sheltered by the breakwater.')
  (St "sfront" "street" "Harbor Street" "60,200 200,196 330,192 440,196" 8 'Along the waterfront.')
  (St "smain" "street" "Gull Lane" "200,196 205,150 210,100 215,60" 6)
  (St "shill" "lane" "Shrine Steps" "330,192 345,160 355,140" 4)
  (St "spier" "pier" "The Long Pier" "212,200 212,238 214,262" 4)
  (St "sbreak" "pier" "The Breakwater" "40,212 90,228 120,236 150,246" 5)
)
$plan = [ordered]@{
  format = "ordinate-plan-v1"; of = "kbrind"; title = "Brindleport"; ppm = $PPM; unit = "yd"; compass = 8
  regions = @(
    [ordered]@{ id = "d1"; name = "The Harbor"; threat = 1; hex = $hex.t; notes = 'Piers, the tavern and the harbormaster.' }
    [ordered]@{ id = "d2"; name = "Up the Hill"; threat = 1; hex = $hex.o; notes = 'The market, the shop and the shrine.' }
  )
  nodes = $planNodes; roads = @(); shapes = $planShapes
}

# inside the buildings: one letter per 5-ft square (the app's battle-map pieces)
$interiors = [ordered]@{
  pgull = (IMap "The Gilded Gull" @(
    "##w###w####w###w##",
    "#c=k===i=====i===#",
    "#c=k=nTn=nTn=====#",
    "#X=k=============#",
    "#==k=nTn=nTn=nTnF#",
    "#S=k============F#",
    "#==k=nTn===i==UU=#",
    "#================#",
    "#######DD#########",
    "..................") "8.5,0.2,the common room;1.5,7.6,behind the bar;14.5,7.6,stairs up" "7,9 8,9 6,9 9,9" "5,3 12,5" 'The common room: the bar down the west side, tables, the hearth in the east wall, stairs up to the rooms. Lamps on the posts.')
  pharbor = (IMap "Harbormaster's Office" @(
    "##w####w####w#",
    "#S=S=====q==S#",
    "#===========i#",
    "#=n=TT====d==#",
    "#===TT====n==#",
    "#X==========S#",
    "#====i=======#",
    "######DD######",
    "..............") "4.5,2.6,the chart table;9,0.2,the notice board" "6,8 7,8 5,8 8,8" "10,4" 'Charts on the walls, the harbor ledgers, and the notice board where the jobs go up. The strongbox in the corner is locked.')
  pshrine = (IMap "Shrine of the Tide" @(
    "####w####w######",
    "#i====AA=====i=#",
    "#==============#",
    "#=PPPP===PPPP==#",
    "#==============#",
    "#=PPPP===PPPP==#",
    "#==============#",
    "#=PPPP===PPPP==#",
    "#==============#",
    "#######DD#######",
    "................") "7.5,0.2,the altar" "7,10 8,10 6,10 9,10" "7,2" 'Candlelit pews facing a plain stone altar, and the old bell hanging above it.')
}
foreach ($n in $plan.nodes) { if ($interiors.Contains($n.id)) { $n.bmap = $interiors[$n.id] } }

# --- the sea chart: the Gull Isles (miles, 10 px to the mile) ----------------------------------------
$caveRows = @(
  "##########################",
  "###.......######.......###",
  "##.........####.........##",
  "#.....p.....##.....X....##",
  "#............D..........##",
  "#.....m......##.........##",
  "##..........####...m....##",
  "###..~~~~...#######....###",
  "####~~~~~...##############",
  "#####~~~....##############",
  "######.....###############",
  "########D#################",
  "ssssssss.sssssssssssssssss",
  "aaaaaaaaaaaaaaaaaaaaaaaaaa")
$doc = [ordered]@{
  format = "ordinate-survey-v1"; title = "The Gull Isles (demo)"; ppm = 10; compass = 8; unit = "mi"; party = 4
  scaleRooms = [ordered]@{ on = $true; builtFor = 4 }     # rooms scale to who walks in (Thornback Cave shows it)
  xpLog = @()
  regions = @(
    [ordered]@{ id = "r1"; name = "The Gull Isles"; threat = 1; hex = $hex.t; notes = 'Home waters: fishing grounds and small islands.' }
    [ordered]@{ id = "r2"; name = "The Outer Waters"; threat = 3; hex = $hex.r; notes = 'Farther out, where the charts run thin.' }
  )
  nodes = @(
    (SNode "kbrind" "Brindleport" "town" 0 0 "r1" 'A fishing harbor on Brindle Isle, where the demo begins. Open its plan for the streets.' @{ origin = $true; seat = $true; charted = $true; services = [ordered]@{ inn = 1; store = 1; market = 1; temple = 1; healer = 1 } })
    (SNode "kgannet" "The Merry Gannet" "ship" (-8) 12 "r1" 'The party''s ship: a stout little two-master. Click her to plan a voyage.')
    (SNode "kthorn" "Thornback Cave" "cave" 440 362 "r1" 'A sea cave on Thornback Isle, about a day and a half''s sail southeast. Goblins have moved in, and a fisher named Finch hasn''t come home. This room scales to who walks in: built for four, so send fewer in and there are fewer goblins (the boss stays, with fewer hit points: an estimate). Its panel shows it before the fight, and Start the battle applies it.' @{ charted = $true })
    (SNode "kchapel" "The Sunken Chapel" "ruin" (-380) 430 "r2" 'An old chapel that slid into the sea a hundred years ago. Its bell tower shows at low tide. Hidden on the sea chart until the ship sails within sight of it.' @{ hidden = $true })
  )
  roads = @()
  shapes = @(
    (Shp "csea" "water" "The Gull Sea" "-2000,-1600 2000,-1600 2000,2000 -2000,2000" $true $false 'Open water on every side.' @{} 1)
    (Shp "cbrindle" "island" "Brindle Isle" "-260,-380 -60,-430 120,-340 170,-150 90,-30 20,8 -120,10 -250,-110" $true $false 'Hills, sheep and a single good harbor.' @{} 1)
    (Shp "cthorn" "island" "Thornback Isle" "380,320 470,305 505,370 455,425 385,405" $true $false 'A spine of black rock. The cave mouth faces the sea on the south side.' @{} 1)
    (Shp "cshoal" "reef" "The Teeth" "-430,380 -330,370 -300,460 -400,500 -450,450" $true $false 'Rocks just under the surface, around the Sunken Chapel.' @{ hidden = $true } 1)
  )
  plans = [ordered]@{ kbrind = $plan }
  chart = [ordered]@{ on = $true; sight = 5; seen = @(, @(0, 0, 25)) }
  day = 1; timeOfDay = "day"; hour = 9
}

# Thornback Cave: the fight, the captive, the locked chest and what's hidden
$cave = $doc.nodes | Where-Object id -eq 'kthorn'
$cave.bmap = IMap "Thornback Cave" $caveRows "6,2.4,the goblins' fire;19,1.6,the hoard;6,8.4,a pool" "8,12 7,12 9,12 6,12" "5,3 7,3 6,4 4,2 9,2 17,3 18,4" 'A sea cave: a door of driftwood across the mouth, a campfire in the main cavern, a pool, and a back chamber with the goblins'' hoard. No daylight gets past the door.'
$cave.site = [ordered]@{
  kind = ""; level = 3; once = $true; waves = 1
  foes = @([ordered]@{ id = "npc:ln_skrag"; n = "1" }, [ordered]@{ id = "srd:goblin-warrior"; n = "6"; scale = "scales" })   # Skrag, a person: always himself, his hit points follow
  loot = [ordered]@{ coin = 0 }
  items = @((SrdItem "Cloak of Protection"), (SrdItem "Potion of Healing"), (SrdItem "Potion of Healing"), "scroll:spell:misty-step")
  where = [ordered]@{ (SrdItem "Cloak of Protection") = "19,3"; (SrdItem "Potion of Healing") = "19,3" }
  hide = [ordered]@{ "scroll:spell:misty-step" = 15 }
  locks = [ordered]@{ "19,3" = [ordered]@{ dc = 12 } }
  coinsAt = [ordered]@{ "19,3" = [ordered]@{ gp = 40; sp = 120; dc = 0 } }
}
$cave.npcs = @("ln_finch")

# --- the people: townsfolk with full sheets from the SRD stat blocks that suit them ------------------
$library = [ordered]@{
  foes = @()
  npcs = @(
    (LNpc "ln_bess" "Bess Copperpot" "Keeper of the Gilded Gull" "The Gilded Gull" 'Round, red-cheeked, flour on her apron, a ladle she points like a sword.' 'Calls everyone "pet." Laughs at her own jokes first.' 'A full room and no fights in it.' 'Every rumor in Brindleport, usually wrong in one small detail.')
    (LNpc "ln_odo" "Harbormaster Odo Venn" "Harbormaster" "Harbormaster's Office" 'Tall, gray-bearded, a captain''s coat gone shiny at the elbows.' 'Short sentences. Taps the ledger when he wants an answer.' 'Safe waters and paid harbor dues.' 'Which ships are overdue, and that the goblins on Thornback are new this season.')
    (LNpc "ln_mira" "Sister Mira" "Keeper of the Shrine of the Tide" "Shrine of the Tide" 'Young, barefoot, salt-white robes, a shell on a cord around her neck.' 'Quiet, then suddenly very direct.' 'To find the Sunken Chapel and ring its bell again.' 'The old story of the chapel, and roughly where it went down.')
    (LNpc "ln_tamsin" "Tamsin Wick" "Shopkeeper, Wick & Wax" "Wick & Wax" 'Ink-stained fingers, three pencils in her hair.' 'Haggles out loud with herself before you can.' 'Customers who argue the price; it''s the best part.' 'What everyone in town has bought this month.')
    (LNpc "ln_finch" "Finch" "A fisher, held by the goblins" "Thornback Cave" 'Wiry, sunburned, tied up by the pool and very glad to see anyone.' 'Talks fast when scared; swears by "the Gulls."' 'To go home.' 'How many goblins there are, and that their boss keeps the key to the chest on his belt.')
    (LNpc "ln_skrag" "Skrag" "The goblin boss of Thornback Cave" "Thornback Cave" 'Scarred and twitchy, a gull-skull helmet, the chest key on a thong at his belt.' 'Shrill; counts his warriors out loud.' 'More boats to raid, and nobody to tell him no.' 'That the townsfolk will pay to get Finch back.')
  )
  loot = @(
    (LLoot "ll_shell" "A whistling seashell" "curio" "2 gp" 'Hums a different note for every wind. Made up for the demo.')
    (LLoot "ll_ledger" "The harbor ledger" "gear" "" 'Every ship in and out of Brindleport this year, and who paid their dues. Made up for the demo.')
  )
}
SheetFromSrd ($library.npcs | Where-Object id -eq 'ln_bess') "Commoner"
SheetFromSrd ($library.npcs | Where-Object id -eq 'ln_odo') "Guard Captain"
SheetFromSrd ($library.npcs | Where-Object id -eq 'ln_mira') "Priest Acolyte"
SheetFromSrd ($library.npcs | Where-Object id -eq 'ln_tamsin') "Commoner"
SheetFromSrd ($library.npcs | Where-Object id -eq 'ln_finch') "Commoner"
($library.npcs | Where-Object id -eq 'ln_finch').fightsAs = ""      # he's tied up: not in the fight
($library.npcs | Where-Object id -eq 'ln_finch').Remove('statBlock')
# Skrag: the cave's boss as a person (a demo villain with Tactics filled in; Size them up reads the party from his card)
$skrag = $library.npcs | Where-Object id -eq 'ln_skrag'; SheetFromSrd $skrag "Goblin Boss"
$skrag.tactics = 'Hangs back by the fire and sends his warriors at whoever looks weakest; once two have fallen he slips away (Nimble Escape) toward the hoard.'
foreach ($n in $library.npcs) { if ($n.id -in @('ln_bess', 'ln_odo')) { $n.key = $true } }
$alignOf = @{ ln_bess = "Neutral Good"; ln_odo = "Lawful Neutral"; ln_mira = "Neutral Good"; ln_tamsin = "Chaotic Good"; ln_finch = "Neutral"; ln_skrag = "Chaotic Evil" }
foreach ($n in $library.npcs) { $n.align = $alignOf[$n.id] }
$doc.library = $library
$npcAt = @{ pgull = @("ln_bess"); pharbor = @("ln_odo"); pshrine = @("ln_mira"); pshop = @("ln_tamsin") }
foreach ($n in $plan.nodes) { if ($npcAt.ContainsKey($n.id)) { $n.npcs = @($npcAt[$n.id]) } }

# what's for sale, and what's in the chests in town
function Site($items) { [ordered]@{ kind = "stock"; level = 3; once = $true; waves = 1; foes = @(); loot = [ordered]@{}; items = @($items) } }
($plan.nodes | Where-Object id -eq 'pshop').site = Site @((SrdItem "Lantern, Hooded"), (SrdItem "Candle"), (SrdItem "Torch"), (SrdItem "Rope"), (SrdItem "Rations"), (SrdItem "Potion of Healing"), (SrdItem "Healer's Kit"), (SrdItem "Spyglass"), "ll_shell")
$gull = $plan.nodes | Where-Object id -eq 'pgull'
$gull.site = Site @((SrdItem "Gaming Set, Dice")); $gull.site.where = [ordered]@{ (SrdItem "Gaming Set, Dice") = "1,3" }; $gull.site.coinsAt = [ordered]@{ "1,3" = [ordered]@{ sp = 34; cp = 80; dc = 0 } }
$hb = $plan.nodes | Where-Object id -eq 'pharbor'
$hb.site = Site @("ll_ledger", (SrdItem "Map")); $hb.site.where = [ordered]@{ ll_ledger = "1,5"; (SrdItem "Map") = "1,5" }; $hb.site.locks = [ordered]@{ "1,5" = [ordered]@{ dc = 15 } }
$hb.site.spotNames = [ordered]@{ "1,5" = "The harbor strongbox" }

# the harbor's mission board, on the notice board in the office
$hb.board = [ordered]@{ title = "Brindleport Harbor: Notices"; skin = "parchment"; missions = @(
  [ordered]@{ id = "ms_goblins"; title = "Goblins in Thornback Cave"; patron = "Harbormaster Odo Venn"; reward = "60 gold pieces for the crew"; status = "posted"; to = "kthorn"
    text = 'Goblins have taken the sea cave on Thornback Isle and are raiding the fishing boats. Finch, a fisher, hasn''t come home. Clear them out, and bring Finch back if you can.'
    notes = 'A goblin boss and six goblin warriors (SRD 5.2). Finch is tied up by the pool, alive. The hoard chest is locked (DC 12); the boss has the key.' }
  [ordered]@{ id = "ms_chapel"; title = "Find the Sunken Chapel"; patron = "Sister Mira, Shrine of the Tide"; reward = "25 gold pieces and the shrine's blessing"; status = "posted"; to = "kchapel"
    text = 'A hundred years ago a chapel slid into the sea, somewhere southwest of Brindleport. At the lowest tides, fishers swear they''ve seen its bell tower. Chart it, and tell the shrine where it lies.'
    notes = 'Hidden on the sea chart until the ship sails within sight of it. Setting this to Taken makes it a known route.' }
  [ordered]@{ id = "ms_spyglass"; title = "Lost: one brass spyglass"; patron = "Tamsin Wick, Wick & Wax"; reward = "5 gold pieces"; status = "done"; to = ""
    text = 'Left on the pier, Tuesday last. Engraved with a gull. No questions asked.'; notes = 'Already found: an example of a finished job.' }
) }

# --- the party: four ready-made adventurers, level 3, built to the 2024 rules from the SRD 5.2 ---------
function PC($id) { [ordered]@{ id = $id; name = ""; player = ""; species = ""; cls = ""; level = 3; xp = 900; ac = ""; hp = ""; hpMax = ""; speed = 30; init = ""; pp = ""; dc = ""; str = 10; dex = 10; con = 10; int = 10; wis = 10; cha = 10; favor = 0; notes = "" } }
function Slots($l1, $l2) { @(0..9 | ForEach-Object { [ordered]@{ max = $(if ($_ -eq 1) { $l1 } elseif ($_ -eq 2) { $l2 } else { 0 }); used = 0 } }) }
function Inv($names) { @(foreach ($x in $names) { if ($x -is [string]) { [ordered]@{ id = (SrdItem $x); qty = 1 } } else { if ($x.text) { [ordered]@{ text = $x.text; qty = 1 } } else { [ordered]@{ id = (SrdItem $x.n); qty = $x.q } } } }) }

$f = PC "pc1"   # Fighter 3 (Champion), Human, Soldier. Standard array; Soldier +2 Str +1 Con. Human: Skillful (Insight), Versatile (Tough).
$f.name = "Tomas Breck"; $f.species = "Human"; $f.cls = "Fighter"; $f.subcls = "Champion"; $f.bg = "Soldier"; $f.align = "Lawful Good"
$f.str = 17; $f.dex = 13; $f.con = 15; $f.int = 8; $f.wis = 12; $f.cha = 10
$f.ac = "17"; $f.hpMax = "34"; $f.hp = "34"; $f.init = "+1"; $f.pp = "13"
$f.saves = "Str +5, Con +4 (proficient)"
$f.skills = "Proficient: Athletics +5, Insight +3, Intimidation +2, Perception +3, Survival +3. Tools: one gaming set (dice). Armor: all, and shields. Weapons: simple and martial"
$f.langs = "Common, Elvish, Orc"
$f.attacks = @(
  [ordered]@{ name = "Greatsword"; hit = "+5"; dmg = "2d6+3"; dtype = "slashing" }
  [ordered]@{ name = "Javelin (thrown 30/120)"; hit = "+5"; dmg = "1d6+3"; dtype = "piercing" }
  [ordered]@{ name = "Flail"; hit = "+5"; dmg = "1d8+3"; dtype = "bludgeoning" })
$f.res = @(
  [ordered]@{ id = "rs_f1"; name = "Second Wind"; max = 2; used = 0; rest = "one" }
  [ordered]@{ id = "rs_f2"; name = "Action Surge"; max = 1; used = 0; rest = "short" }
  [ordered]@{ id = "rs_f3"; name = "Hit Dice (d10)"; max = 3; used = 0; rest = "long" })
$f.inv = Inv @("Chain Mail", "Greatsword", "Flail", @{ n = "Javelin"; q = 8 }, "Dungeoneer's Pack", "Spear", "Shortbow", "Arrows (20)", "Quiver", "Gaming Set, Dice", "Healer's Kit", "Clothes, Traveler's")
$f.purse = [ordered]@{ cp = 0; sp = 0; ep = 0; gp = 18; pp = 0 }
$f.persona = "Trait: steady, says little, always first up in the morning.`nIdeal: Duty - the crew comes home.`nBond: an old unit badge he still polishes.`nFlaw: can't walk away from a fight he thinks is unfair."
$f.looks = "Broad, brown-skinned, a short black beard and a nose that's been broken twice."
$f.notes = "A sample character (2024 rules, SRD 5.2). Features: Fighting Style (Defense: +1 AC in armor), Second Wind, Weapon Mastery (Greatsword, Javelin, Flail), Action Surge, Tactical Mind; Champion: Improved Critical (19-20), Remarkable Athlete. Origin feats: Savage Attacker (Soldier), Tough (Human). Human: Resourceful (Heroic Inspiration after a Long Rest)."

$r = PC "pc2"   # Rogue 3 (Thief), Halfling, Criminal. Criminal +2 Dex +1 Con, Alert. Expertise: Stealth, Perception.
$r.name = "Wren Applebrook"; $r.species = "Halfling"; $r.cls = "Rogue"; $r.subcls = "Thief"; $r.bg = "Criminal"; $r.align = "Chaotic Good"
$r.str = 8; $r.dex = 17; $r.con = 15; $r.int = 12; $r.wis = 13; $r.cha = 10
$r.ac = "14"; $r.hpMax = "24"; $r.hp = "24"; $r.init = "+5"; $r.pp = "15"
$r.saves = "Dex +5, Int +3 (proficient)"
$r.skills = "Proficient: Acrobatics +5, Deception +2, Investigation +3, Sleight of Hand +5. Expertise: Perception +5, Stealth +7. Tools: thieves' tools. Armor: light. Weapons: simple, and martial with the Finesse or Light property"
$r.langs = "Common, Halfling, Goblin, Dwarvish, Thieves' Cant"
$r.defenses = "Advantage on saving throws to avoid or end the Frightened condition (Brave)"
$r.attacks = @(
  [ordered]@{ name = "Shortsword"; hit = "+5"; dmg = "1d6+3"; dtype = "piercing" }
  [ordered]@{ name = "Shortbow (80/320)"; hit = "+5"; dmg = "1d6+3"; dtype = "piercing" }
  [ordered]@{ name = "Dagger (thrown 20/60)"; hit = "+5"; dmg = "1d4+3"; dtype = "piercing" }
  [ordered]@{ name = "Sneak Attack (once a turn, on top of a hit)"; hit = ""; dmg = "2d6"; dtype = "" })
$r.res = @([ordered]@{ id = "rs_r1"; name = "Hit Dice (d8)"; max = 3; used = 0; rest = "long" })
$r.inv = Inv @("Leather Armor", "Shortsword", "Shortbow", "Arrows (20)", "Quiver", @{ n = "Dagger"; q = 4 }, "Thieves' tools", "Burglar's Pack", "Crowbar", "Clothes, Traveler's")
$r.purse = [ordered]@{ cp = 0; sp = 0; ep = 0; gp = 24; pp = 0 }
$r.persona = "Trait: hums when nervous, and is nervous a lot.`nIdeal: Freedom - nobody should be locked in anything.`nBond: owes her life to a smuggler who taught her to read.`nFlaw: can't leave a lock alone."
$r.looks = "Small even for a halfling, freckled, a mop of red curls under a fisher's cap."
$r.notes = "A sample character (2024 rules, SRD 5.2). Features: Expertise (Stealth, Perception), Sneak Attack 2d6, Thieves' Cant, Weapon Mastery (Shortsword, Shortbow), Cunning Action, Steady Aim; Thief: Fast Hands, Second-Story Work. Origin feat: Alert (Criminal). Halfling: Brave, Halfling Nimbleness, Luck, Naturally Stealthy."

$c = PC "pc3"   # Cleric 3 (Life), Dwarf, Acolyte. Acolyte +2 Wis +1 Cha, Magic Initiate (Cleric). Divine Order: Protector.
$c.name = "Hilde Copperbraid"; $c.species = "Dwarf"; $c.cls = "Cleric"; $c.subcls = "Life Domain"; $c.bg = "Acolyte"; $c.align = "Neutral Good"
$c.str = 13; $c.dex = 12; $c.con = 14; $c.int = 8; $c.wis = 17; $c.cha = 11
$c.ac = "16"; $c.hpMax = "27"; $c.hp = "27"; $c.init = "+1"; $c.pp = "13"; $c.dc = "13"; $c.satk = "+5"
$c.saves = "Wis +5, Cha +2 (proficient)"
$c.skills = "Proficient: Insight +5, Medicine +5, Persuasion +2, Religion +1. Tools: calligrapher's supplies. Armor: all (Protector), and shields. Weapons: simple and martial (Protector)"
$c.senses = "Darkvision 120 ft."
$c.langs = "Common, Dwarvish, Giant"
$c.defenses = "Resistance to Poison damage; Advantage on saving throws to avoid or end the Poisoned condition (Dwarven Resilience)"
$c.attacks = @(
  [ordered]@{ name = "Mace"; hit = "+3"; dmg = "1d6+1"; dtype = "bludgeoning" }
  [ordered]@{ name = "Sacred Flame"; hit = "DEX 13"; dmg = "1d8"; dtype = "radiant" }
  [ordered]@{ name = "Guiding Bolt"; hit = "+5"; dmg = "4d6"; dtype = "radiant" })
$c.slots = Slots 4 2
$c.spells = @("Guidance", "Sacred Flame", "Spare the Dying", "Light", "Thaumaturgy", "Bless", "Aid", "Cure Wounds", "Lesser Restoration", "Guiding Bolt", "Healing Word", "Shield of Faith", "Command", "Spiritual Weapon", "Prayer of Healing", "Detect Magic" | ForEach-Object { SrdSpell $_ })
$c.res = @(
  [ordered]@{ id = "rs_c1"; name = "Channel Divinity"; max = 2; used = 0; rest = "one" }
  [ordered]@{ id = "rs_c2"; name = "Magic Initiate: Detect Magic, free"; max = 1; used = 0; rest = "long" }
  [ordered]@{ id = "rs_c3"; name = "Hit Dice (d8)"; max = 3; used = 0; rest = "long" })
$c.inv = Inv @("Chain Shirt", "Shield", "Mace", @{ text = "Holy symbol (an amulet)" }, "Priest's Pack", @{ text = "Calligrapher's supplies, a book of prayers, 10 sheets of parchment, a robe" })
$c.purse = [ordered]@{ cp = 0; sp = 0; ep = 0; gp = 15; pp = 0 }
$c.persona = "Trait: hums hymns off-key and doesn't care who hears.`nIdeal: Mercy - everyone gets patched up, even the goblins.`nBond: the little shrine in the mountains where she grew up.`nFlaw: takes any insult to her beard very personally."
$c.looks = "Stocky, copper beard in three thick braids, a mace with a sun on its head."
$c.notes = "A sample character (2024 rules, SRD 5.2). Features: Spellcasting (Wisdom; 6 prepared, plus the Life Domain spells always prepared), Divine Order (Protector), Channel Divinity (Divine Spark, Turn Undead); Life Domain: Disciple of Life, Preserve Life, Life Domain Spells (Aid, Bless, Cure Wounds, Lesser Restoration). Origin feat: Magic Initiate (Cleric): Light, Thaumaturgy and Detect Magic. Dwarf: Darkvision, Dwarven Resilience, Dwarven Toughness, Stonecunning."

$w = PC "pc4"   # Wizard 3 (Evoker), Elf (High Elf), Sage. Sage +2 Int +1 Con, Magic Initiate (Wizard). Scholar: Arcana.
$w.name = "Ilyra Voss"; $w.species = "Elf (High Elf)"; $w.cls = "Wizard"; $w.subcls = "Evoker"; $w.bg = "Sage"; $w.align = "Neutral"
$w.str = 8; $w.dex = 14; $w.con = 14; $w.int = 17; $w.wis = 12; $w.cha = 10
$w.ac = "12"; $w.hpMax = "20"; $w.hp = "20"; $w.init = "+2"; $w.pp = "13"; $w.dc = "13"; $w.satk = "+5"
$w.saves = "Int +5, Wis +3 (proficient)"
$w.skills = "Proficient: History +5, Insight +3, Investigation +5, Perception +3. Expertise: Arcana +7 (Scholar). Tools: calligrapher's supplies. Weapons: simple"
$w.senses = "Darkvision 60 ft."
$w.langs = "Common, Elvish, Draconic"
$w.defenses = "Advantage on saving throws to avoid or end the Charmed condition; magic can't put her to sleep (Fey Ancestry)"
$w.attacks = @(
  [ordered]@{ name = "Fire Bolt"; hit = "+5"; dmg = "1d10"; dtype = "fire" }
  [ordered]@{ name = "Ray of Frost"; hit = "+5"; dmg = "1d8"; dtype = "cold" }
  [ordered]@{ name = "Dagger"; hit = "+4"; dmg = "1d4+2"; dtype = "piercing" })
$w.slots = Slots 4 2
$w.spells = @("Fire Bolt", "Mage Hand", "Ray of Frost", "Prestidigitation", "Minor Illusion", "Light", "Detect Magic", "Find Familiar", "Magic Missile", "Shield", "Mage Armor", "Sleep", "Thunderwave", "Scorching Ray", "Burning Hands", "Misty Step" | ForEach-Object { SrdSpell $_ })
$w.res = @(
  [ordered]@{ id = "rs_w1"; name = "Arcane Recovery"; max = 1; used = 0; rest = "long" }
  [ordered]@{ id = "rs_w2"; name = "Detect Magic, free (High Elf)"; max = 1; used = 0; rest = "long" }
  [ordered]@{ id = "rs_w3"; name = "Magic Initiate: Find Familiar, free"; max = 1; used = 0; rest = "long" }
  [ordered]@{ id = "rs_w4"; name = "Hit Dice (d6)"; max = 3; used = 0; rest = "long" })
$w.inv = Inv @(@{ n = "Dagger"; q = 2 }, "Quarterstaff", "Spellbook", "Scholar's Pack", @{ text = "Calligrapher's supplies, a history book, 8 sheets of parchment, a robe" })
$w.purse = [ordered]@{ cp = 0; sp = 0; ep = 0; gp = 13; pp = 0 }
$w.persona = "Trait: takes notes on everything, including people, to their faces.`nIdeal: Knowledge - every map has a blank worth filling.`nBond: her late teacher's spellbook, which she's still deciphering.`nFlaw: forgets to eat when there's something to read."
$w.looks = "Tall and pale, silver hair cut short, ink on every finger, spectacles she doesn't need."
$w.notes = "A sample character (2024 rules, SRD 5.2). Features: Spellcasting (Intelligence; 6 prepared: Magic Missile, Shield, Mage Armor, Sleep, Thunderwave, Scorching Ray; also in her spellbook: Burning Hands, Misty Step), Ritual Adept, Arcane Recovery, Scholar (Arcana); Evoker: Evocation Savant, Potent Cantrip. Origin feat: Magic Initiate (Wizard): Minor Illusion, Light and Find Familiar. Elf (High Elf): Darkvision, Elven Lineage (Prestidigitation; Detect Magic at 3rd level), Fey Ancestry, Keen Senses (Perception), Trance."
$doc.roster = @($f, $r, $c, $w)

# --- the tour, as a session document the app runs -----------------------------------------------
$tour = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "demo\tour.md"), [Text.Encoding]::UTF8) -replace "`r`n", "`n"
$doc.docs = @([ordered]@{ id = "doc_tour"; kind = "session"; title = "Take the tour"; date = ""; md = $tour; done = [ordered]@{}; updated = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.000Z") })
$doc.pictures = @(); $doc.files = [ordered]@{}
$doc.builder = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# --- write the map, and pack it into one file with the app -------------------------------------------
$json = $doc | ConvertTo-Json -Depth 20 -Compress
$mapOut = Join-Path $OutDir "Gull Isles demo map.json"
[IO.File]::WriteAllText($mapOut, ($doc | ConvertTo-Json -Depth 20), (New-Object Text.UTF8Encoding $false))
$app = [IO.File]::ReadAllText((Join-Path $Campaign "index.html"), [Text.Encoding]::UTF8)
# the app loads the SRD from Tools\srd; the demo is one file, so the data goes inside it
$srdTag = '<script src="Tools/srd/srd-data.js" charset="utf-8"></script>'
if (-not $app.Contains($srdTag)) { throw "can't find the SRD script line in index.html" }
$app = $app.Replace($srdTag, "<script>`n" + $srdRaw.TrimEnd() + "`n</script>")
$marker = '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
if (-not $app.Contains($marker)) { throw "can't find the viewport line in index.html" }
$inject = $marker + "`n<meta name=""ordinate-store"" content=""demo"">`n<script>window.__DEMO_MAP = " + ($json -replace '</', '<\/') + ";</script>"
$app = $app.Replace($marker, $inject).Replace('<title>Ordinate Survey — plotting table</title>', '<title>Ordinate Survey — demo: the Gull Isles</title>')
# a player at the table may open the demo, so nothing from the campaign may ride along (not even in a code comment)
$campaignWords = @("Kalatecha", "Sallowmay", "Xuna", "Amakiir", "Ethal Vaelor", "Callomay", "Heartgrove", "Lantern Rock", "Age of Exploration")
$leaks = @($campaignWords | Where-Object { $app.IndexOf($_, [StringComparison]::OrdinalIgnoreCase) -ge 0 })
if ($leaks.Count) { throw "the demo would carry campaign words: $($leaks -join ', ') (find them in index.html and make them generic)" }
$htmlOut = Join-Path $OutDir "Ordinate Demo.html"
[IO.File]::WriteAllText($htmlOut, $app, (New-Object Text.UTF8Encoding $false))
"wrote $htmlOut ($([math]::Round((Get-Item $htmlOut).Length / 1MB, 1)) MB) and $mapOut"
