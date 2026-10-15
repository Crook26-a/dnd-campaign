# Builds the Kalatecha survey + town plan for Ordinate Survey (ordinate-plan-v1).
# Plan geometry is laid out in yards and scaled by $PPM into world units.
# Lives in the campaign's Tools folder. With no arguments it writes "Kalatecha Map.json" in the
# campaign folder, attaches the sheets in Players, and takes documents from the docs folder here (docs.json lists them).
# Absorbs the DM's in-app work only from the save named in $Absorb (in Saves), so a build never depends on
# whichever autosave is newest: play now lives in the app, which merges each new build in itself (see
# "UPDATING FROM A NEW MAP" in index.html). Every build is stamped ($doc.builder) so the app can tell builds apart.
param([string]$Out, [string]$Players, [string]$Saves, [string]$Absorb = "2026-10-12 kalatecha (lighthouse, lantern fixed).json")
$Campaign = Split-Path $PSScriptRoot -Parent
if (-not $Out) { $Out = Join-Path $Campaign "Kalatecha Map.json" }
if (-not $Players) { $Players = Join-Path $Campaign "Players" }
if (-not $Saves) { $Saves = Join-Path $Campaign "Saves" }
$PPM = 5

function P([string]$s, [double]$k = $PPM) {
  @($s.Trim() -split '\s+' | ForEach-Object { $a = $_ -split ','; [ordered]@{ x = [math]::Round([double]$a[0] * $k); y = [math]::Round([double]$a[1] * $k) } })
}
function Bld($id, $name, $kind, $x, $y, $w, $d, $rot, $region, $notes, $svc = @{}) {
  [ordered]@{ id = $id; name = $name; kind = $kind; region = $region; level = 1
    origin = $false; seat = $false; services = $svc; notes = $notes
    x = [math]::Round($x * $PPM); y = [math]::Round($y * $PPM); w = $w; d = $d; rot = $rot }
}
function Shp($id, $kind, $name, $pts, [bool]$closed, [bool]$straight, $notes = "", $extra = @{}) {
  $o = [ordered]@{ id = $id; kind = $kind; closed = $closed; straight = $straight; name = $name; side = 1
    impassable = ($kind -in 'wall', 'impasse'); notes = $notes; pts = (P $pts) }
  foreach ($k in $extra.Keys) { $o[$k] = $extra[$k] }
  $o
}
function St($id, $kind, $name, $pts, $widthYd, $notes = "") { Shp $id $kind $name $pts $false $false $notes @{ w = $widthYd * $PPM } }

$hex = @{ g = "#5e7a4e"; p = "#6b5a86"; o = "#a8752c"; t = "#3f6f78"; r = "#8f4436" }

# ── the town plan ─────────────────────────────────────────────
$planNodes = @(
  (Bld "padm" "The Admiralty" "reeve" 190 72 44 26 -6 "d4" 'The stone sea fortress on the northern headland. Commodore Isadora Quell, the harbormaster: iron-gray braid, never sits. Her registry shows all three lost ships last logged a course past Lantern Rock. Her warning: "No ship has returned from the Ashen Isles." The city cells are here. Caught stealing: 5 gp fine or a night in the cells.' @{ reeve = 1 })
  (Bld "ptower" "Watchtower" "tower" 116 90 10 10 0 "d4" 'The round tower at the tip of the headland. Guards watch every ship that comes and goes.')
  (Bld "pbell" "The Drowned Bell" "inn" 262 100 18 13 4 "d1" 'Sailors'' tavern in the old warehouses, run by Marisol Ferro, who calls everyone "minnow." One wall lists ships that never came home; the newest are the Heron, the Marigold, and the Silver Tern, all lost near Lantern Rock this year. Fish stew 4 cp, cider 2 cp. Sea shanty contest, arm wrestling, liar''s dice.' @{ inn = 1 })
  (Bld "pfish" "Fish Market" "provision" 346 112 16 11 4 "d1" 'Loud, wet, and smelly. Gulls everywhere. A good place for random event 1 (Admiral steals something) or 5 (a sea shanty breaks out).' @{ provision = 1 })
  (Bld "pchand" "Benedetti's Chandlery" "store" 404 120 16 11 6 "d1" 'In the last warehouse at the head of the harbor. Rope, lanterns, tar, and weapons on the back wall. Dario Benedetti, fussy, tape measure around his neck. The Sallowmay has never once come in for repairs, "not in all my thirty years."' @{ store = 1 })
  (Bld "pcharter" "The Charter House" "office" 508 192 34 20 0 "d2" 'Grand arched building facing the head of the harbor across the plaza. Guild of Explorers headquarters: maps on every wall and a great half-blank globe. Michael Fontaine gives the Lantern Rock commission here (Scene 4). Buy old maps; sell new ones.' @{ office = 1; board = 1 })
  (Bld "pcath" "The Cathedral" "temple" 590 180 44 28 0 "d2" 'Great dome and tall bell tower, right behind the Charter House. Sister Amara Bellweather heals for a donation, sells Potions of Healing (50 gp), and blesses voyages (5 gp: reroll one d20 on the first voyage).' @{ temple = 1 })
  (Bld "pbelltower" "Bell Tower" "tower" 620 154 10 10 0 "d2" 'Pip Salazar, the half-deaf bell-ringer, swears the bells rang by themselves the morning the Sallowmay''s crew notice went up.')
  (Bld "pinfirm" "Sister Amara's Infirmary" "healer" 588 214 14 9 0 "d2" 'Healing for anyone who''s hurt, for whatever donation they can afford.' @{ healer = 1 })
  (Bld "pmarket" "Market Square" "market" 522 296 18 18 0 "d2" 'The market spills right along the east quay: fruit and spice stalls, crates, carts, and curio sellers (roll on the d10 curio table) beside the moored ships. Every merchant says the Sallowmay''s supplies are "already settled." Scenes 2 and 3 happen here.' @{ market = 1 })
  (Bld "ptobias" "Tobias's Stall" "fence" 566 262 9 7 0 "d2" 'At the edge of the square, in the cathedral''s shadow. Old Tobias Pell sells salvage, including the lantern that burns without oil (10 gp). Admiral, his one-eyed gull, steals anything shiny.' @{ fence = 1 })
  (Bld "pzisa" "Madame Zisa's Tent" "tent" 490 340 6 6 0 "d2" 'Fortunes read from tide shells, 1 silver each. "You will follow a light that lies. Trust the one that doesn''t."')
  (Bld "psallow" "The Sallowmay" "ship" 318 368 26 8 -3 "d1" 'Tied up at the end of the Long Pier. Every voyage begins and ends here. Captain Callomay never leaves her. Scrubbed deck, polished bronze fittings, not a scrap of iron. The crew-wanted notice is nailed to a post at the end of the pier.')
  (Bld "pundaunted" "The Undaunted" "ship" 362 290 28 8 2 "d1" 'Hargrove-Vance''s ship, moored at the Merchant Pier. Fast, flashy, and in need of fresh paint. His deckhands loiter here between jobs.')
  (Bld "pgreta" "Greta's Net Loft" "house" 474 392 10 8 0 "d1" 'Greta Vasquez, retired bosun with a wooden leg, mends nets here and tells stories: "Never trust a light you didn''t light yourself." Her grandmother called Lantern Rock''s light "a light no human hand ever lit." Scene 5''s dock fight happens along the quay out front.')
  (Bld "plookout" "Lookout Steps" "statue" 512 476 5 5 0 "d2" 'The hill on the south side of town. The city picture is the view from here: the harbor on the left, the fortress on the far headland, the cathedral dome, and the terraced hills on the right. Worn stone steps lead down to the quay, and armored guards often stand watch. A good spot to show the players the picture.')
  (Bld "pmoreau" "Moreau Villa" "hall" 738 132 26 16 -8 "d3" 'Lady Celestine Moreau collects rare and wondrous things. She''d pay a fortune for "anything that glows" and offers 50 gold for the lantern.')
  (Bld "pfountain" "Palm Terraces" "well" 796 236 4 4 0 "d3" 'Terraced palm gardens high on the hill, with fountains and a view over the whole harbor. A good place to spot the Sallowmay, or the Undaunted, from above.')
  (Bld "phargrove" "Hargrove House" "hall" 706 318 20 13 6 "d3" 'Rupert Hargrove-Vance''s villa. The paint is peeling and the garden is overgrown, so he''s broke, yet he still pays his crew. Snooping here can turn up a ledger of payments to "friends on the southern reefs."')
  (Bld "pcustoms" "Customs Post" "gate" 760 432 9 6 35 "d2" 'A toll booth where the Inland Road leaves town. Sergeant Bram Okoro of the City Guard often stands watch here.')
  (Bld "phideout" "Under the Bridge" "ruinlet" 852 600 8 6 30 "d1" 'Nico and Lina''s hideout under the Inland Road bridge over the Brightwater. The twins know every alley, and they saw Hargrove-Vance''s deckhands hiring toughs. They''ll trade information for coins and sweets.')
  (Bld "pfarm" "Olive Farm" "house" 940 690 14 10 -10 "d5" 'Farmland and olive groves inland. Not part of Session 1, but here if the players wander out the Inland Road.')
  (Bld "pware1" "" "warehouse" 304 106 24 12 3 "d1" 'Old stone warehouse on the north shore.')
  (Bld "pware2" "" "warehouse" 375 114 18 11 5 "d1" 'Old stone warehouse on the north shore.')
  (Bld "pyard" "Shipwright's Yard" "shipwright" 345 452 30 16 -12 "d1" 'Slipways and timber stacks on the south shore. They build and mend every ship in the harbor, except the Sallowmay, which has never needed them.')
  (Bld "pboat1" "" "boat" 308 184 5 2 75 "d1" 'Fishing boat.')
  (Bld "pboat2" "" "boat" 284 198 5 2 65 "d1" 'Fishing boat.')
  (Bld "pstall1" "" "stall" 500 268 4 3 0 "d2" 'Fruit and spice stall.')
  (Bld "pstall2" "" "stall" 508 322 4 3 0 "d2" 'Curio stall. Roll on the d10 curio table.')
  (Bld "pstall3" "" "stall" 545 318 4 3 0 "d2" 'Fish and bread stall.')
)

$planShapes = @(
  (Shp "psea" "water" "Kalatecha Harbor" "-500,-300 130,-300 100,-180 85,-60 90,40 110,95 150,115 200,125 260,135 320,142 380,148 425,160 438,200 442,250 445,300 440,345 415,385 370,410 320,425 260,432 210,430 175,450 150,500 135,580 140,680 160,800 -500,800" $true $false 'The harbor basin, sheltered by the fortress headland to the north. Open sea to the west.')
  (Shp "pwall" "wall" "Fortress Wall" "100,62 160,40 260,28 380,22 500,18 600,24 700,44 780,90 830,150" $false $false 'The Admiralty''s walls run from the round watchtower east along the northern ridge, up into the terraced hills.')
  (Shp "pterr" "garden" "The Terraces" "640,70 800,110 860,260 830,380 700,365 650,220" $true $false 'Terraced hills with palms and villas, climbing behind the red-tiled rooftops. The Upper Town sits here.')
  (Shp "plookhill" "green" "Lookout Hill" "445,445 560,440 610,490 585,545 480,550 430,505" $true $false 'The hill the city picture is drawn from.')
  (Shp "pgroves" "orchard" "Olive Groves" "870,630 990,620 1010,730 880,745" $true $false)
  (Shp "pplaza" "square" "The Plaza" "448,168 488,170 490,240 452,242" $true $true 'The paved plaza between the head of the harbor and the Charter House.')
  (Shp "pcathsq" "square" "" "556,150 640,148 646,232 560,236" $true $true)
  (Shp "pmktsq" "market" "" "468,250 560,246 572,342 474,352" $true $true)
  (Shp "pb4" "block" "" "580,248 640,244 652,300 588,306" $true $true)
  (Shp "pb5" "block" "" "590,330 660,322 672,376 600,384" $true $true)
  (Shp "pb6" "block" "" "480,370 540,366 546,412 486,418" $true $true)
  (Shp "pb7" "block" "" "660,200 700,196 708,262 668,266" $true $true)
  (Shp "pb8" "block" "" "520,62 600,58 604,86 524,90" $true $true)
  (Shp "pb9" "block" "" "420,30 500,28 504,58 424,62" $true $true)
  (Shp "pb10" "block" "" "690,400 740,394 748,440 700,446" $true $true)
  (Shp "priver" "river" "Brightwater" "1000,560 900,575 820,585 700,590 600,575 480,565 390,525 300,470 245,436" $false $false 'A small river that runs down from the inland hills, around the south side of Lookout Hill, and into the harbor.' @{ w0 = 15; w1 = 40 })
  (St "sware" "street" "Warehouse Row" "150,104 210,112 260,124 320,130 380,136 430,146" 8)
  (St "sfort" "lane" "Fortress Road" "150,104 175,90 200,86" 5)
  (St "squay" "street" "The Quay" "430,146 452,180 458,230 462,290 456,350 432,398 400,420" 10 'The east quay. The dock fight in Scene 5 happens along here.')
  (St "spier1" "pier" "Long Pier" "448,370 400,368 340,366" 4 'The longest pier in the harbor.')
  (St "spier2" "pier" "Merchant Pier" "455,295 410,292 380,290" 4)
  (St "spier3" "pier" "Cargo Pier" "452,225 400,222" 4)
  (St "sjetty" "pier" "Fishermen's Jetty" "300,128 296,170 292,196" 3)
  (St "ssteps" "alley" "The Steps" "432,398 470,430 505,468" 3 'Worn stone steps up to the lookout.')
  (St "scathst" "street" "Cathedral Street" "490,205 535,195 560,190" 7)
  (St "sspice" "lane" "Spice Row" "430,146 470,120 520,112 600,140" 5)
  (St "sswitch" "lane" "The Switchback" "630,186 650,205 672,172 700,192 722,150" 4 'A zigzag stair up the terraced hill.')
  (St "sterrace" "lane" "Terrace Walk" "752,140 790,190 796,236 760,290 720,312" 4)
  (St "sstair" "lane" "Hill Stair" "566,300 620,312 690,318" 4)
  (St "sinland" "street" "Inland Road" "540,345 600,380 660,400 760,432 820,500 860,580 900,650 935,685" 8 'The road out of town toward the farms. It crosses the Brightwater on a stone bridge.')
)

$plan = [ordered]@{
  format = "ordinate-plan-v1"; of = "kcity"; title = "Kalatecha"; ppm = $PPM; unit = "yd"; compass = 8
  regions = @(
    [ordered]@{ id = "d1"; name = "Harbor District"; threat = 2; hex = $hex.t; notes = 'Piers, the warehouses, the fish market, the Drowned Bell, and the chandlery. Rowdy after dark.' }
    [ordered]@{ id = "d2"; name = "Old Town"; threat = 1; hex = $hex.o; notes = 'The waterfront market, the Charter House, the cathedral, and the lookout hill. Busy by day.' }
    [ordered]@{ id = "d3"; name = "Upper Town"; threat = 1; hex = $hex.p; notes = 'Villas on the terraced hills. Rich sponsors, and Hargrove-Vance.' }
    [ordered]@{ id = "d4"; name = "The Admiralty"; threat = 1; hex = $hex.r; notes = 'The stone sea fortress on the northern headland. Armored guards, the harbormaster, and the city''s cells.' }
    [ordered]@{ id = "d5"; name = "Outside the City"; threat = 3; hex = $hex.g; notes = 'Farms and olive groves inland. The roads get lonely.' }
  )
  nodes = $planNodes; roads = @(); shapes = $planShapes
}

# -- the Sallowmay: her own place on the sea chart (she sails), with a plan you enter like a town.
# Inside: the main deck, the captain's quarters and below decks, each with its own battle map.
# Plan geometry in yards: about 34 yd (100 ft) from stern to bowsprit, 10 yd across.
$shipNodes = @(
  (Bld "squarters" "Captain's quarters" "house" (-13) 0 6 8 0 "s1" 'His cabin at the stern. Roomier inside than it looks from the deck. The ship''s log is on the desk; under the bunk, a sealed scallop shell. Searching it counts as prying if he finds out (he will).')
  (Bld "shold" "Below decks" "warehouse" (-5) 0 6 4 0 "s1" 'Down the ladder through the hatch: the crew''s hammocks, the galley (brick and bronze, no iron) and the hold. The masts run down through it to the keel.')
  (Bld "sdeck" "Main deck" "ship" 6 0 12 7 0 "s1" 'Scrubbed white, ropes coiled neat as sleeping snakes, every fitting bronze. The captain is usually at the rail, Thimble on his shoulder.')
)
($shipNodes | Where-Object id -eq 'sdeck').npcs = @("ln_callomay", "ln_thimble")
($shipNodes | Where-Object id -eq 'squarters').site = [ordered]@{ kind = ""; level = 3; once = $true; waves = 1; foes = @(); loot = [ordered]@{ coin = 0 }
  items = @("ll_shiplog", "ll_scallop"); hide = [ordered]@{ ll_shiplog = 15; ll_scallop = 20 } }
$shipPlan = [ordered]@{
  format = "ordinate-plan-v1"; of = "kship"; title = "The Sallowmay"; ppm = $PPM; unit = "yd"; compass = 8
  regions = @( [ordered]@{ id = "s1"; name = "The Sallowmay"; threat = 1; hex = $hex.t; notes = 'The captain''s ship, grown from a willow and a hawthorn. No innocent can be harmed aboard.' } )
  nodes = $shipNodes; roads = @()
  shapes = @(
    (Shp "swater" "water" "The sea" "-40,-22 40,-22 40,22 -40,22" $true $true)
    (Shp "shull" "dock" "The Sallowmay" "-17,-5 9,-5 15,-2 17,0 15,2 9,5 -17,5" $true $true)
  )
}

# ── the sea chart around it (miles, 10 px to the mile) ────────
function SNode($id, $name, $kind, $x, $y, $region, $notes, $extra = @{}) {
  $o = [ordered]@{ id = $id; name = $name; kind = $kind; region = $region; level = 1
    origin = $false; seat = $false; services = @{}; notes = $notes; x = $x; y = $y }
  foreach ($k in $extra.Keys) { $o[$k] = $extra[$k] }
  $o
}
# ── the campaign's library: its own foes, people and loot ─────
function LFoe($id, $name, $cr, $xp, $notes, $boss = $false, $talk = $true) {
  [ordered]@{ id = $id; name = $name; cr = $cr; xp = $xp; ac = ""; hp = ""; speed = "30 ft."; str = ""; dex = ""; con = ""; int = ""; wis = ""; cha = ""
    attacks = ""; traits = ""; boss = $boss; talk = $talk; notes = $notes }
}
function LNpc($id, $name, $role, $where, $look, $voice, $wants, $knows, $notes = "", $fightsAs = "") {
  [ordered]@{ id = $id; name = $name; role = $role; where = $where; look = $look; voice = $voice; wants = $wants; knows = $knows; fightsAs = $fightsAs; notes = $notes }
}
function LLoot($id, $name, $kind, $value, $desc, $notes = "") {
  [ordered]@{ id = $id; name = $name; kind = $kind; value = $value; desc = $desc; notes = $notes }
}
$library = [ordered]@{
  foes = @(
    (LFoe "lf_queen" "Raven Heartgrove" 2 450 'The pirate queen, leader of the wreckers on Lantern Rock (named by Joseph, 2026-10-10). Built on the SRD Bandit Captain stat block. She duels the master-at-arms on the lighthouse stairs, and haggles with Hargrove-Vance over the firebird.' $true $true)
    (LFoe "lf_wrecker" "Wrecker" 0.125 25 'One of the pirate queen''s wreckers. Built on the SRD Bandit stat block. They lure ships onto the reef with the firebird''s light and loot the wrecks.')
    (LFoe "lf_bruiser" "Wrecker Bruiser" 0.5 100 'A tougher wrecker. Built on the SRD Tough stat block.')
    (LFoe "lf_deckhand" "Hargrove-Vance's Deckhand" 0.5 100 'Broad-shouldered, paid five silver to grab the lantern in Scene 5. Built on the SRD Tough stat block (use the Bandit for an easier fight). They grab the lantern and run rather than finish anyone.')
  )
  npcs = @(
    (LNpc "ln_callomay" "Captain Callomay" "Captain of the Sallowmay" "Aboard the Sallowmay (never leaves her)" 'Eyes the green of deep water; a smile that doesn''t quite reach them; a bronze-hilted sword.' 'Courteous and unhurried. "Captain Callomay will do."' 'A crew that keeps its word.' 'Far more than he says.' 'DM only: he is the fae. True name Calandrous Callomaydare. Tracks each player''s favor from -3 to +3 (see the Party tab). Appears out of thin air if a character dies, once, as the reveal.')
    (LNpc "ln_thimble" "Thimble" "The captain's fairy (everyone thinks she's his familiar)" "Aboard the Sallowmay, or ashore as the captain's eyes" 'A sprite no bigger than a hand: dragonfly wings, a sewing needle for a sword, a thimble for a helmet. Silver markings wind around both her arms: spirals and triskelions, like old druidic knotwork.' 'Bossy and quick. Calls the captain "Callo" and the crew "the new ones."' 'The captain free, and nobody ever again calling her a familiar.' 'Everything that happens on the docks. Her Heart Sight tells her who is honest.' 'A real fey from the captain''s old court who followed him to sea. She is NOT a familiar. She goes ashore for him, since he can''t. Fights with the SRD Sprite stat block. See the Captain Callomay document. If she drops to 0 HP she isn''t gone: the crew brings her to the captain and he brings her back, with a new silver spiral (Joseph''s table rule). The crew only sees him heal her. Each spiral is a time he brought her back; they can guess at that only with Arcana (DC 15: fae mending that went further than mending; DC 20: maybe called back from death). See the Captain Callomay document. He tells the crew: "If you ever see Thimble fall, bring her to me anyway. She is a tough fairy, and I don''t expect anything will keep her down for long." She knew Vesperine of the Thorn (Rupert''s patron) at court and won''t say her name: "the Thorn Lady," then spits over the rail.')
    (LNpc "ln_fontaine" "Michael Fontaine" "The crew's contact at the Guild of Explorers" "The Charter House" 'Tall, blond, early 30s, ink on his fingers.' '"I used to do this, you know. Then I discovered chairs."' 'Lantern Rock solved, with no more lost ships on his record.' 'The commission details. Fifteen years ago he and Hargrove-Vance crewed the Sallowmay, until Rupert broke his word to the captain by selling a chart outside the Guild. Pushed, he says: "Rupert made a promise to the captain and broke it. I''ve never seen luck turn on a man so fast."')
    (LNpc "ln_tobias" "Old Tobias Pell" "Salvage dealer" "His stall in the cathedral's shadow" 'A jumpy little man. Admiral, his one-eyed gull, rides on his shoulder and steals anything shiny.' 'Nervous, apologetic (mostly for the gull).' 'To be rid of the lantern before trouble finds him.' 'The lantern came off a wreck on the southern reefs, sold by "people you don''t want to meet."')
    (LNpc "ln_hargrove" "Rupert Hargrove-Vance" "The rival explorer; captain of the Undaunted" "Aboard the Undaunted (Hargrove House when ashore)" 'Lean and silver-haired, monocle, a Guild coat with the badges picked off, a leather journal under his arm. A swirl of silver just peeks out above his collar, on the side of his neck.' 'Reads the crew''s mistakes aloud from his journal. "Day one. New crew of the Sallowmay. Already overpaying for junk."' 'The lantern back, the firebird, and the Guild''s respect.' 'Everything about the wreckers. He''ll never admit it.' 'Former Guild star; buys the wreckers'' loot to pay for the Undaunted.')
    (LNpc "ln_nib" "Nib" "Rupert's familiar (a spirit in a sprite's shape)" "With Rupert Hargrove-Vance, invisible on his collar" 'A sprite to look at: moth-grey wings, a needle sword it never draws on its own, and eyes with nothing behind them. Usually invisible, riding on Rupert''s collar or turning the pages of his journal.' 'Silent. It speaks only in Rupert''s head.' 'Nothing of its own. It does as it''s told.' 'Whatever Rupert sends it to see. He can look through its eyes.' 'DM only. Rupert''s Pact of the Chain familiar: a spirit from Find Familiar wearing a sprite''s shape, Fey by type. The journal pages that turn in a wind no one else feels are Nib (Session 1). Find Familiar (SRD 5.2): it obeys Rupert and talks with him telepathically within 100 feet, he can see through its eyes as a Bonus Action, it rolls its own Initiative, and it can''t attack. At 0 HP it disappears, dropping what it carried, until he casts the spell again; he can dismiss it to a pocket dimension as a Magic action. Pact of the Chain (2024 Player''s Handbook, not in the SRD; check the book): he can give up one attack of his Attack action so it makes one attack with its Reaction. Thimble spots it at a glance and is furious: one argues, one obeys. Uses the SRD Sprite stat block.')
    (LNpc "ln_marisol" "Marisol Ferro" "Keeper of the Drowned Bell" "The Drowned Bell" 'Big laugh, strong arms.' 'Calls everyone "minnow."' 'For her wall of lost ships to stop growing.' 'The names of the lost ships; the Heron''s captain was a friend of hers.')
    (LNpc "ln_quell" "Commodore Isadora Quell" "Harbormaster" "The Admiralty" 'Iron-gray braid; never sits down.' 'Clipped, exact.' 'Order in her harbor.' 'The ship registry. "No ship has returned from the Ashen Isles."')
    (LNpc "ln_okoro" "Sergeant Bram Okoro" "City Guard sergeant" "The Customs Post, or wherever there's trouble" 'A friendly giant.' 'By the book, but kind.' 'A quiet shift.' 'Hargrove-Vance''s deckhands have been starting fights on the docks all week.' '' 'srd:guard')
    (LNpc "ln_amara" "Sister Amara Bellweather" "Cathedral healer" "Sister Amara's Infirmary" 'Gentle, always humming, flour on her sleeves from baking bread for the poor.' 'Soft and warm.' 'To send the crew off safely.' 'Heals for a donation, sells Potions of Healing (50 gp), blesses voyages (5 gp: reroll one d20 on the first voyage).')
    (LNpc "ln_pip" "Pip Salazar" "Bell-ringer" "The Bell Tower" 'Ancient and half-deaf.' 'Shouts everything.' 'Someone to believe him.' 'The bells rang by themselves the morning the Sallowmay''s crew notice went up.')
    (LNpc "ln_greta" "Greta Vasquez" "Retired bosun" "Greta's Net Loft, on the quay" 'Wooden leg, mending nets.' 'Salty old sayings.' 'A good listener.' '"Never trust a light you didn''t light yourself." Her grandmother called Lantern Rock''s light "a light no human hand ever lit." Ask about the captain: "Green eyes? My gran used to talk about a captain with green eyes."')
    (LNpc "ln_dario" "Dario Benedetti" "Chandler" "Benedetti's Chandlery" 'Fussy, a tape measure always around his neck.' 'Precise; hates haggling.' 'Customers who don''t haggle.' 'The Sallowmay has never once come in for repairs, "not in all my thirty years." He keeps a jar of the old salt-crusted coins that turn up in his till whenever the Sallowmay buys anything.')
    (LNpc "ln_moreau" "Lady Celestine Moreau" "Collector and sponsor" "Moreau Villa" 'Glittering jewels; bored by everything.' 'Languid until something glows.' 'Rare and wondrous things for her collection.' 'Would pay a fortune for "anything that glows." Offers 50 gold for the lantern. Owns the Stargazer''s spectacles and thinks they''re broken: "Put them on and the room goes dark and fills with little lights. Ten minutes, then nothing until tomorrow. Charming. Useless." Bought at a salvage auction, off a wreck no one could name. They sit in a gallery case; she''d trade them for anything that glows. DM only: the key to the hidden island (see the Captain Callomay document).')
    (LNpc "ln_twins" "Nico and Lina" "Street kids" "Under the Bridge" 'Ten-year-old twins, barefoot and quick.' 'Finish each other''s sentences.' 'Coins and sweets.' 'Every alley in the city; they saw Hargrove-Vance''s deckhands hiring toughs.')
    (LNpc "ln_zisa" "Madame Zisa" "Fortune teller" "Her tent in the market" 'Wrapped in scarves; reads fortunes from tide shells.' 'Dramatic pauses.' 'A silver piece per fortune.' '"You will follow a light that lies. Trust the one that doesn''t."')
    (LNpc "ln_queen" "Raven Heartgrove" "The pirate queen, leader of the wreckers" "Wreckers' Cove and the lighthouse, Lantern Rock" 'Still to decide.' 'Still to decide.' 'Loot from every ship the false light wrecks, and a buyer for the firebird.' 'How to keep the firebird caged; who buys her loot.' '' 'lf_queen')
    (LNpc "ln_lucia" "Lucia Silvanus" "Dockworker" "The docks (the Dockworkers' Shed on the quay)" 'Human. Wears a cloak patched from old sails.' 'Calls the crew by made-up nicknames.' 'To keep his own secret safe.' 'The comings and goings on the quay: who loads what, and when.' 'Neutral. Secret: knows something about one of the crew''s past. Decide which character, and what. (Made with the Roll tab''s generator.)' 'srd:commoner')
    (LNpc "ln_stowaway" "The Young Stowaway" "Survivor of a wreck" "Hiding in the wreck of the Heron, in the Ship Graveyard on Lantern Rock" 'Thin, sunburned, wary.' 'Talks fast once they trust you.' 'To get off the island.' 'About the wreckers and their camp in the sea cave, and the hidden stair down to it from the lighthouse crag.')
    (LNpc "ln_heldsailors" "The Captured Sailors" "Crews of the Heron, the Marigold and the Silver Tern" "The pen in Wreckers' Cove, Lantern Rock" 'Hungry, sunburned and roped together, in the clothes they were wrecked in.' 'Hoarse. One of them sings under his breath to keep the others going.' 'To go home to Kalatecha.' 'How many wreckers there are, when the guard changes, and that the queen keeps the strongbox key on her.' 'Held for ransom. How many there are, and who among them is worth naming, is the DM''s call. Grateful sailors with friends back in Kalatecha are part of the prize.')
  )
  loot = @(
    (LLoot "ll_lantern" "The lantern that burns without oil" "story" "10 gp" 'A salt-crusted brass lantern with a small golden flame and no wick. The flame always leans south, toward Lantern Rock.' 'Old Tobias sells it for 10 gp; Lady Moreau offers 50.')
    (LLoot "ll_feather" "Firebird feather" "story" "" 'A flame-colored feather that never stops glowing. The firebird leaves it if the crew sets it free.')
    (LLoot "ll_strongbox" "The wreckers' strongbox" "treasure" "120 gp" 'Coin and trinkets looted from the wrecked ships.' 'Suggested amount; adjust to taste.')
    (LLoot "ll_salvage" "Salvage from the wrecks" "treasure" "40 gp" 'Brass fittings, a ship''s bell, a waterlogged chest of cloth.' 'Suggested amount.')
    (LLoot "ll_reefchart" "The first safe chart of the reef" "story" "" 'What the Guild is paying for: a safe channel through the reef around Lantern Rock.' 'Fontaine pays 50 gp each on delivery (60 if the quartermaster haggled).')
    (LLoot "ll_whisper" "A shell that whispers" "curio" "2 gp" 'Plays the sound of a different sea each day. Useless, and lovely.')
    (LLoot "ll_moss" "Glow-moss in a jar" "curio" "5 gp" 'Gives dim light for a week, then dies if it dries out.')
    (LLoot "ll_catcompass" "A compass that points to the nearest cat" "curio" "3 gp" 'Exactly what it says.')
    (LLoot "ll_biscuits" "Tin of never-soggy biscuits" "curio" "1 gp" 'Ten biscuits that stay crisp even soaked in seawater.')
    (LLoot "ll_stormpearl" "A pearl with a tiny storm inside" "curio" "25 gp" 'Shake it and you hear thunder.')
    (LLoot "ll_flute" "Fishbone flute" "curio" "2 gp" 'Fish swim toward the sound.')
    (LLoot "ll_comb" "A mermaid's comb" "curio" "10 gp" 'Dries wet hair instantly.')
    (LLoot "ll_bottle" "A message in a sealed bottle" "curio" "1 gp" 'Written in a language no one in the city can read. Save it for a future island.')
    (LLoot "ll_parrot" "A carved wooden parrot" "curio" "15 gp" 'Repeats the last thing said near it, once a day.')
    (LLoot "ll_mapfrag" "A map fragment" "curio" "5 gp" 'Part of a coastline no one recognizes. Let the navigator add it to the map as a future island.')
    (LLoot "ll_shiplog" "The Sallowmay's log" "story" "" 'Written in dozens of different hands, crew after crew, the oldest pages so faded the ink is nearly gone. The captain is always "Captain C."' 'In the captain''s quarters (DC 15). Reading it counts as prying if he finds out (he will).')
    (LLoot "ll_scallop" "A sealed scallop shell" "story" "" 'Inside, a strand of kelp tied in a knot that won''t come undone.' 'Under the captain''s bunk (DC 20). Arcana DC 20 recognizes it: a bargain, still binding. DM only.')
    (LLoot "ll_spectacles" "Stargazer's spectacles" "magic item" "40,000 gp" 'A pair of round spectacles with gold rims. While wearing them, you can see the stars in the sky for up to 10 minutes a day, from anywhere: by day, under cloud, below decks, even through solid rock.' 'Custom item (Joseph, 2026-10-09). Very rare; requires attunement. Price from the 2024 Magic Item Rarities and Values table (Very Rare, 40,000 GP). DM only: the key to the hidden island - they also show the stars Mother Brine drowned, which point the way (see the Captain Callomay document). Where the crew finds them: still to decide.')
  )
}
# rarity for the campaign's own loot (drives the rarity filter); curios are common trinkets
$rarityOf = @{ ll_spectacles = "Very Rare"; ll_lantern = "Uncommon"; ll_feather = "Rare"; ll_strongbox = "Mundane"; ll_salvage = "Mundane"; ll_reefchart = "Mundane" }
foreach ($x in $library.loot) { $x.rarity = $(if ($rarityOf.ContainsKey($x.id)) { $rarityOf[$x.id] } elseif ($x.kind -eq "curio") { "Common" } else { "" }) }
# magic items of the campaign's own that need Attunement (the app shows an Attune toggle in a character's inventory)
$attOf = @{ ll_spectacles = "requires attunement" }
foreach ($x in $library.loot) { if ($attOf.ContainsKey($x.id)) { $x.att = $attOf[$x.id] } }
# the campaign's villains carry real stat blocks, copied from the SRD 5.2 creature each is built on
$srdRaw = [IO.File]::ReadAllText("$PSScriptRoot\srd\srd-data.js", [Text.Encoding]::UTF8)
$srd = $srdRaw.Substring($srdRaw.IndexOf("{"), $srdRaw.LastIndexOf("}") - $srdRaw.IndexOf("{") + 1) | ConvertFrom-Json
function PairList($a) {
  $out = New-Object System.Collections.ArrayList
  if ($a -is [array]) {
    if ($a.Count -ge 2 -and $a[0] -is [string]) { [void]$out.Add(@($a[0], $a[1])) }
    else { foreach ($p in $a) { [void]$out.Add(@($p[0], $p[1])) } }
  }
  return , $out
}
$builtOn = @{ lf_queen = "srd:bandit-captain"; lf_wrecker = "srd:bandit"; lf_bruiser = "srd:tough"; lf_deckhand = "srd:tough" }
foreach ($f in $library.foes) {
  $b = $srd.foes | Where-Object id -eq $builtOn[$f.id]; if (-not $b) { throw "no SRD base for $($f.id)" }
  $f.ac = "$($b.ac)" + $(if ($b.acd) { " ($($b.acd))" } else { "" }); $f.hp = "$($b.hp) ($($b.hd))"; $f.speed = $b.spd
  $f.str = $b.ab[0]; $f.dex = $b.ab[1]; $f.con = $b.ab[2]; $f.int = $b.ab[3]; $f.wis = $b.ab[4]; $f.cha = $b.ab[5]
  $f.sav = $b.sav; $f.sen = $b.sen; $f.init = $b.init
  $lines = @()
  foreach ($p in (PairList $b.act)) { $lines += "$($p[0]). $($p[1])" }
  foreach ($p in (PairList $b.bon)) { $lines += "Bonus action: $($p[0]). $($p[1])" }
  foreach ($p in (PairList $b.rea)) { $lines += "Reaction: $($p[0]). $($p[1])" }
  $f.attacks = $lines -join "`n`n"
  $f.traits = (@(foreach ($p in (PairList $b.tr)) { "$($p[0]). $($p[1])" })) -join "`n`n"
}
# what each one has on them, for searching the fallen. The weapons in their actions come
# automatically, in plain sight; "DC 0" is plain sight too, anything else needs a Perception check.
$belongings = @{
  lf_deckhand = @{ purse = [ordered]@{ sp = 5 }; carries = "Bolts (20) DC 0"; hideDc = 10 }   # paid five silver for the lantern
  lf_wrecker  = @{ purse = [ordered]@{ cp = 12; sp = 3 }; carries = "Bolts (20) DC 0`na ring taken from a drowned sailor DC 15"; hideDc = 10 }
  lf_bruiser  = @{ purse = [ordered]@{ sp = 6 }; carries = "Bolts (20) DC 0"; hideDc = 10 }
  lf_queen    = @{ purse = [ordered]@{ sp = 20; gp = 12 }; carries = "Bullets, Firearm (10) DC 0`nthe key to the wreckers' strongbox DC 15"; hideDc = 10 }
}
foreach ($f in $library.foes) { $k = $belongings[$f.id]; if ($k) { $f.purse = $k.purse; $f.carries = $k.carries; $f.hideDc = $k.hideDc } }
# who you'll meet where, in the town plan
$npcAt = @{ psallow = @("ln_callomay", "ln_thimble"); pcharter = @("ln_fontaine"); ptobias = @("ln_tobias"); phargrove = @(); pundaunted = @()
  pbell = @("ln_marisol"); padm = @("ln_quell"); pcustoms = @("ln_okoro"); pinfirm = @("ln_amara"); pcath = @("ln_amara"); pbelltower = @("ln_pip")
  pgreta = @("ln_greta"); pchand = @("ln_dario"); pmoreau = @("ln_moreau"); phideout = @("ln_twins"); pzisa = @("ln_zisa"); pshed = @("ln_lucia") }
# the dockworkers' shed, on the south end of the quay by the Long Pier
$plan.nodes += (Bld "pshed" "Dockworkers' Shed" "house" 474 374 8 5 0 "d1" 'Where the dock hands rest between ships. Ask here for work loading cargo, a few coppers a crate.')
foreach ($n in $plan.nodes) { if ($npcAt.ContainsKey($n.id)) { $n.npcs = @($npcAt[$n.id]) } }
# Scene 5: the dock ambush, on the east quay
$plan.nodes += (Bld "pambush" "Dock Ambush (Scene 5)" "statue" 466 404 3 3 0 "d1" 'Where Hargrove-Vance''s deckhands jump the crew on the way back to the ship. Sample fight: six deckhands, a Low warm-up for a level-3 party of four.')
($plan.nodes | Where-Object id -eq 'pambush').site = [ordered]@{ kind = "ambush"; level = 3; once = $true; waves = 1; foes = @([ordered]@{ id = "lf_deckhand"; n = "6" }); loot = [ordered]@{ coin = 1; t1 = 0; t2 = 0; t3 = 0; t4 = 0 } }
# battle maps (the app's ready-made ones): the docks for the ambush, the deck for the Sallowmay
($plan.nodes | Where-Object id -eq 'pambush').bmap = [ordered]@{ preset = "docks"; by = "builder" }
($plan.nodes | Where-Object id -eq 'psallow').link = "kship"     # "Enter the Sallowmay" from her pier goes aboard
# berths (Joseph, 2026-10-10): the Sallowmay's pier is hers (its link, above); the Undaunted gets her own berth at the
# Merchant Pier (linked at the end, once her cargo has moved aboard her); and any other ship ties up at the Visitors' Berth
$plan.nodes += (Bld "pvisit" "Visitors' Berth" "ship" 424 236 22 7 0 "d1" 'Where visiting ships tie up on the Cargo Pier: the first ship in port without a berth of her own takes it, one at a time.')
($plan.nodes | Where-Object id -eq 'pvisit').berth = "open"

# --- interiors: the major buildings in town get layouts of their own (one letter per 5-ft square, the
# app's battle-map tiles). Every other building uses the app's default for its kind (a small house or
# shack, a small shop, a stall, a tent, a warehouse, a tower, a ship). by = "builder" marks them as mine,
# so a rebuild can update them; one painted in the app is the DM's and is kept.
function IMap($name, $rows, $labels, $party, $enemy, $notes) {
  $bad = @($rows | Where-Object { $_.Length -ne $rows[0].Length }); if ($bad.Count) { throw "${name}: rows of different widths: $($bad -join " | ")" }
  $L = New-Object System.Collections.ArrayList
  foreach ($lab in ($labels -split ';')) { $p = $lab -split ',', 3; [void]$L.Add(@([double]$p[0], [double]$p[1], $p[2])) }
  $pts = { param($s) $a = New-Object System.Collections.ArrayList; foreach ($q in ($s -split ' ')) { $xy = $q -split ','; [void]$a.Add(@([int]$xy[0], [int]$xy[1])) }; , $a }
  [ordered]@{ name = $name; by = "builder"; rows = $rows; labels = $L; start = [ordered]@{ party = (& $pts $party); enemy = (& $pts $enemy) }; notes = $notes }
}
$interiors = [ordered]@{
  pbell = (IMap "The Drowned Bell" @(
    "##w###w####w###w##",
    "#c=k===i=====i===#",
    "#c=k=nTn=nTn=====#",
    "#c=k=============#",
    "#S=k=nTn=nTn=nTnF#",
    "#S=k============F#",
    "#==k=nTn=nTn=nTn=#",
    "##D##============#",
    "#G=S#=nTn=nTn==UU#",
    "#G==#==========UU#",
    "#######DD#########",
    "..................") "9,0.2,the wall of lost ships;13.5,1.5,the stage;2,9.6,kitchen;15.5,7.6,stairs up" "7,11 8,11 9,11 10,11 6,11 11,11" "6,3 11,3 8,5 13,5 5,8 13,8" 'Marisol''s tavern. The bar runs down the west side with the casks behind it and the kitchen past it; the names of ships that never came home cover the north wall. Shanty contest on the little stage; stairs up to the rooms.')
  padm = (IMap "The Admiralty" @(
    "########################",
    "#T:T:::#::::::::#SSSSSS#",
    "#::::::#:::dd:::#::::::#",
    "#B:B:::#:::n::::#:TT:::#",
    "#X:::::#S::::::S#::::::#",
    "####D######D######D#####",
    "#:::::i::::::::::i:::::#",
    "#::O::::O::::::O::::O::#",
    "#::::::::::::::::::::::#",
    "#||||#||||#::::::::::::#",
    "#:::B#:::B#::::::::::::#",
    "#::::#::::#::::::::::::#",
    "##########w###DDDD###w##",
    "........................") "4,4.6,guard room;12,4.6,harbormaster's office;20,4.6,the registry;5,11.6,cells;16.5,10.6,entrance hall" "14,13 15,13 16,13 17,13 13,13 18,13" "14,10 17,10 12,7 19,7 4,3 10,2" 'Commodore Quell''s sea fortress: the guard room, her office, the registry of every ship (all three lost ships last logged a course past Lantern Rock), and the city cells. Caught stealing: 5 gp or a night in a cell.')
  pcharter = (IMap "The Charter House" @(
    "##w##w##w##w##w##w##",
    "#SSSS==========SSSS#",
    "#====i========i====#",
    "#=O=============O==#",
    "#========Q=========#",
    "#==================#",
    "#=O=============O==#",
    "#==================#",
    "#=nTn=nTn===###D####",
    "#=nTn=nTn===#=dd=SS#",
    "#===========#=nX===#",
    "######DD############",
    "....................") "9.5,5.4,the great globe;9.5,1.4,maps on every wall;15.5,11.75,Fontaine's office;4.5,10.4,reading tables" "6,12 7,12 5,12 8,12 4,12 9,12" "4,4 14,4 3,7 15,7 10,2 16,10" 'The Guild of Explorers: maps on every wall, half of each one empty, and the great half-blank globe in the middle. Michael Fontaine''s office is in the corner.')
  pcath = (IMap "The Cathedral" @(
    "###w###w###w###w###w####",
    "#::::::::::::::::::::::#",
    "#:::::::::AAAA:::::::::#",
    "#::O::::::::::::::::O::#",
    "#::::PPPP::::::PPPP::::#",
    "#::O:PPPP::::::PPPP:O::#",
    "#::::PPPP::::::PPPP::::#",
    "#::O:PPPP::::::PPPP:O::#",
    "#::::PPPP::::::PPPP::::#",
    "#::O:PPPP::::::PPPP:O::#",
    "#::::::::::::::::::::::#",
    "D::::::::::::::::::::::D",
    "##########DDDD##########",
    "........................") "11.5,1.25,the altar under the dome;11.5,10.4,the nave;1.5,12.75,side door;21.5,12.75,to the infirmary" "11,13 12,13 10,13 13,13 9,13 14,13" "11,3 12,3 10,1 13,1 11,10 12,10" 'The great domed cathedral: rows of pews, pillars down the nave, the altar under the dome. The bell tower stands beside it (its own place); Sister Amara''s infirmary is through the east door.')
  pinfirm = (IMap "Sister Amara's Infirmary" @(
    "###w###w###w##",
    "#B=B=B=B=====#",
    "#============#",
    "#====nTTn==SS#",
    "#====nTTn====#",
    "#B=B=B======G#",
    "#=========SSG#",
    "####DD########",
    "..............") "11,2.4,herbs and potions;3.5,2.4,cots;12,7.75,bread oven" "4,8 5,8 3,8 6,8 2,8 7,8" "3,2 8,2 9,4 2,4 8,6 4,6" 'Sister Amara''s infirmary: cots for the sick, shelves of herbs and potions (Potion of Healing 50 gp), and the oven where she bakes bread for the poor.')
  pmarket = (IMap "The Market Square" @(
    "....................",
    ".kkk..kkk..kkk..kkk.",
    ".ccc..ccc..ccc..ccc.",
    "....................",
    "....................",
    "........~~..........",
    "........~~..........",
    "....................",
    ".kkk..kkk.....kkk...",
    ".ccc..ccc.....ccc...",
    "....................",
    "....................",
    "..f..........kkk....",
    ".............SSS....",
    "....................",
    "....................") "9,7.4,the fountain;14,14.4,Tobias's salvage stall;10,0.25,the cathedral's shadow" "3,15 4,15 5,15 6,15 2,15 7,15" "9,4 10,4 11,4 8,3 12,3 10,10" 'The market square, loud and bright: stalls of fruit, spice and curios, the fountain in the middle. The cathedral''s shadow falls across half of it; Old Tobias Pell''s salvage stall is in the corner (Scenes 2 and 3).')
  pfish = (IMap "The Fish Market" @(
    "################",
    "#cTTc=cTTc=cTTc#",
    "#==============#",
    "#=kkkk====kkkk=#",
    "#=~~~~====~~~~=#",
    "#==============#",
    "#=kkkk====kkkk=#",
    "#==============#",
    "#==f========f==#",
    "##............##",
    "................") "7.5,4.6,tanks of live catch;7.5,10.6,the quay" "6,10 7,10 8,10 9,10 5,10 10,10" "3,2 12,2 7,5 8,5 4,7 11,7" 'Loud, wet and smelly: fish laid out on tables, tanks of live catch, and gulls everywhere. Open to the quay on the south side.')
  phargrove = (IMap "Hargrove House" @(
    "##################",
    "#SS=d==S#==nnnn==#",
    "#===n=X=#==TTTT==#",
    "#=======D==nnnn==#",
    "####D######D######",
    "#===i========i===#",
    "#=O============O=#",
    "#===============F#",
    "########DD########",
    "gggYgggg..ggggYggg",
    "ggggggYg..gYgggggg",
    "llllllll..llllllll") "3.5,3.6,his study;12.5,3.6,dining room;8.5,7.6,the hall;3.5,10.6,overgrown garden" "8,11 9,11 8,10 9,10 8,9 9,9" "5,5 12,5 3,2 10,1 14,7 6,7" 'Rupert Hargrove-Vance''s villa: peeling paint, an overgrown garden, and still somehow the money to pay his crew. In the study, his ledger of payments to "friends on the southern reefs" (DC 15 to find).')
  pmoreau = (IMap "Moreau Villa" @(
    "##w###w###w###w###w#",
    "#Z=Z=Z=Z=#=========#",
    "#========#==TT=B===#",
    "#Z=Z=Z=Z=D=========#",
    "#========#=====S=S=#",
    "####D#######D#######",
    "#==O==========O====#",
    "#==================#",
    "#==O==========O====#",
    "########DD##########",
    "ggYgg~~gg..gg~~ggYgg",
    "ggggggggg..ggggggggg") "4.5,4.4,the gallery;14,4.4,her salon;9,7.6,the grand hall" "9,11 10,11 9,10 10,10 8,11 11,11" "5,7 14,7 2,2 12,1 16,3 7,6" 'Lady Celestine Moreau''s villa: a gallery of rare and wondrous things in glass cases, her salon, and a grand hall for parties. She''d pay 50 gold for the lantern.')
  pcustoms = (IMap "The Customs Post" @(
    "############",
    "#SS=d=#::B:#",
    "#===n=#::::#",
    "#=====#||||#",
    "#kkkk==::::#",
    "#::::::::::#",
    "#::c:::::c:#",
    "####DDDD####",
    "............") "3,2.4,office;8.5,1.6,cell;6,8.75,the road out of town" "5,8 6,8 4,8 7,8 3,8 8,8" "3,5 8,5 2,2 5,6 7,6 6,5" 'Sergeant Okoro''s post on the road out of town: a counter for tolls and papers, a small office, and one cell.')
  phideout = (IMap "Under the Bridge" @(
    "gggg......gggg",
    "g....OO..OO..g",
    "..BB.....X....",
    "....T.........",
    ".....OO..OO...",
    "~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~",
    "~~~~~OO~~OO~~~",
    "..............",
    "gggggg..gggggg") "7,5.5,the Brightwater;2.5,1.6,the twins' nest;7.5,0.25,the Inland Road above" "5,0 6,0 7,0 8,0 4,0 9,0" "1,3 6,3 8,2 12,3 1,8 12,8" 'Nico and Lina''s hideout under the Inland Road bridge: bedrolls, a crate for a table, and their stash in a tin (they''ll trade what they know for coins and sweets).')
  pyard = (IMap "The Shipwright's Yard" @(
    "~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~=rrrr=~~~~~~~~",
    "........r====r........",
    "..CCC...r====r...CCC..",
    "..CCC...r====r...CCC..",
    "........r====r........",
    "...c....rr==rr....c...",
    "..........==..........",
    ".K....................",
    "######D#####..........",
    "#T=SS=G====#..........",
    "#==TT======#..........",
    "############..........") "11,4.5,a hull on the slipway;3.5,5.6,timber;19.5,5.6,timber;5.5,12.75,the workshop;2,7.6,crane" "17,8 18,8 19,8 17,9 18,9 19,9" "5,6 15,6 2,8 20,5 6,2 16,2" 'Where ships are built and mended: a new hull on the slipway, stacks of timber, a crane, and the workshop. The Sallowmay has never once been here.')
}
foreach ($n in $plan.nodes) { if ($interiors.Contains($n.id)) { $n.bmap = $interiors[$n.id] } }
# The Sallowmay, level by level, with lamps on every level (Xuna will want to put them out). Click a lamp in a
# fight to put it out or light it; below decks gets no daylight at all.
$shipInteriors = [ordered]@{
  sdeck = (IMap "The Sallowmay: main deck" @(
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~rrrrrrrrrrrrrrrrrrr~~~~~~",
    "~~~r#####i==c=====c==rr~~~~~",
    "~~~r#####=====i====i=c=rr~~~",
    "~~~r####D=W===M====M====irbb",
    "~~~r#####==HH==========c=rbb",
    "~~~r#####==HH======c===rr~~~",
    "~~~r#####i====c======rr~~~~~",
    "~~~rrrrrrrrrrrrrrrrrrr~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~") "6,10.6,captain's cabin;3,1.3,stern;25,1.3,bow;11.5,10.6,hatch below;14,1.3,mainmast;19,1.3,foremast;10.5,6.4,wheel" "12,4 13,4 16,6 17,6 13,7 16,4" "22,5 22,6 23,5 20,4 21,7 20,3" 'The Sallowmay''s main deck, scrubbed white, every fitting bronze. Lamps hang by the cabin door, at both masts, at the bow and by the hatch; the cabin door leads to the captain''s quarters, the hatch down below decks.')
  squarters = (IMap "The Sallowmay: captain's quarters" @(
    "###########",
    "wBBt==J=SS#",
    "w=i=======#",
    "w===dd====#",
    "w====n===iD",
    "w=========#",
    "w=X==nTnio#",
    "###########") "1,7.75,stern windows;9.5,7.75,door to the deck;1.5,0.25,his bed;4.5,2.4,his desk;6,7.75,table" "9,5 8,5 9,3 8,3 7,5 7,3" "2,3 2,4 3,2 3,5 2,5 1,2" 'His cabin, roomier inside than it looks from the deck: his bed under the stern windows, a side table and wardrobe, charts on the shelves, the desk with the ship''s log on it, a small table for two, a sea chest. Three lamps. The ship''s log is in the desk (DC 15); a sealed scallop shell is under the bed (DC 20).')
  shold = (IMap "The Sallowmay: below decks" @(
    "########################",
    "#hhh===CC==u==CC===cc###",
    "#hhh=i=====M====M==i==##",
    "#=======L=====i======c=#",
    "#G=nTn==L==============#",
    "#G=c=========c=====CC###",
    "#hhh=i==CC=======c====##",
    "########################") "2,7.75,crew's hammocks;8,7.75,ladder to the deck;1,3.25,galley;13.5,7.75,the hold" "9,3 9,4 10,3 10,4 7,3 7,4" "18,3 18,4 19,3 19,4 17,3 21,4" 'Below decks: the crew''s hammocks, the galley (brick and bronze, no iron) with its table, the hold with crates, barrels and sacks, and the masts running down to the keel. No daylight reaches here: four lamps swing from the beams.')
}
foreach ($n in $shipNodes) { if ($shipInteriors.Contains($n.id)) { $n.bmap = $shipInteriors[$n.id] } }
# where the captain keeps things, and no daylight below
$q = $shipNodes | Where-Object id -eq 'squarters'; $q.site.where = [ordered]@{ ll_shiplog = "4,3"; ll_scallop = "1,1" }
$h0 = $shipNodes | Where-Object id -eq 'shold'; $h0.site = [ordered]@{ kind = ""; level = 3; once = $true; waves = 1; foes = @(); loot = [ordered]@{ coin = 0 }; items = @() }   # no windows: dark below decks except for its lamps (the app works that out)
# Tobias trades from a stall, whatever his trade says on paper
foreach ($n in $plan.nodes) { if ($n.id -eq "ptobias") { $n.bmap = [ordered]@{ preset = "stall"; by = "builder" } } }

# ── Lantern Rock: the first island, a place to explore (Joseph, 2026-10-10) ──────────────────
# A jagged, barren, tiny island: about 240 yd by 200, all bare stone and shingle. A crescent of rock round a lagoon
# (the ship graveyard), the lighthouse on the high north-west crag, the wreckers' sea cave under the north cliffs,
# and a shingle landing on the east, the one safe place to come ashore. Plan geometry in yards, like Kalatecha's.
# The scenes and fights are the ones in the campaign notes ("First island: Lantern Rock"), spread over the places.
$rockNodes = @(
  (Bld "lland" "The Shingle Landing" "boat" 114 24 5 2 20 "l1" 'The only safe place to come ashore: a steep bank of shingle on the east side, reached by the channel through the reef. Rowboats from the Sallowmay beach here. From here a goat-narrow path climbs the bare rock to the lighthouse. If the ship followed the false light instead, this is where a scraped hull limps in.')
  (Bld "llight" "The Lighthouse" "light" (-70) (-52) 8 8 0 "l1" 'A tall, salt-scoured tower on the island''s high crag. Its light has shone every night for as long as anyone remembers, and no one lives here. There is no oil store, no wick, and no keeper''s cot: the first clue. Inside, a spiral stair climbs round a stone core. Wreckers hold the stair: the first half of the big fight. At the top is the Lantern Room.')
  (Bld "llamp" "The Lantern Room" "tower" (-70) (-63) 4 4 0 "l1" 'The top of the lighthouse, reached only by its spiral stair. The firebird is locked in a cold-iron cage where the lamp should be, and a gallery with a low rail runs all round, high over the sea. Raven Heartgrove and Hargrove-Vance are haggling over the firebird when the crew arrives: the second half of the big fight. Swing from the great lamp''s chains; knock pirates off the gallery into the sea. Hargrove-Vance slips away rather than fight.')
  (Bld "lmarigold" "Wreck of the Marigold" "wreck" 22 64 24 7 -20 "l2" 'Lost this year (her name is on the Drowned Bell''s wall). Stripped bare: her cargo crates turned up stenciled MARIGOLD in the Undaunted''s hold. Gouges in her hull show where the wreckers pried her open.')
  (Bld "lheron" "Wreck of the Heron" "wreck" (-24) 70 26 7 15 "l2" 'Lost this year, beached on her side at the head of the lagoon. The young stowaway hides in her hold, living on hardtack and rainwater, and has watched the wreckers come and go.')
  (Bld "ltern" "Wreck of the Silver Tern" "wreck" 4 100 30 8 -8 "l2" 'The newest and biggest wreck, broken on the reef at the lagoon''s mouth, her hold half-flooded. The giant octopus lives in it. Salvage worth taking is still aboard.')
  (Bld "lsentry" "Sentry's Perch" "tent" (-56) 96 4 4 0 "l1" 'A wrecker sentry under a scrap of sailcloth on the west arm, watching the reef for ships. A brass bell hangs from a spar: if the sentry rings it, the cove is warned. Sneaking past or silencing the sentry is its own small challenge.')
  (Bld "lcove" "Wreckers' Cove" "cave" 18 (-72) 12 9 0 "l3" 'A sea cave under the north cliffs, reachable by boat at low water or down a hidden stair from the lighthouse crag. The wreckers'' camp: beached longboats, plunder, bedrolls round a fire, a pen of captured sailors held for ransom, and the queen''s nook with the strongbox. The crew can sneak in, bluff, or fight.')
)
$rockShapes = @(
  (Shp "lsea" "water" "The Southern Reefs" "-260,-200 260,-200 260,220 -260,220" $true $true 'Open sea all round. The reefs make every approach but one deadly.')
  (Shp "lisle" "rock" "Lantern Rock" "-96,-58 -84,-80 -66,-78 -58,-96 -40,-90 -30,-104 -14,-92 -2,-98 8,-84 16,-76 26,-80 34,-92 48,-86 56,-70 74,-74 82,-58 78,-44 96,-36 92,-22 108,-14 104,-2 122,6 124,20 114,38 98,40 94,56 78,58 72,74 84,90 74,104 60,96 52,88 44,70 30,52 10,44 -14,46 -34,56 -46,72 -40,92 -52,108 -66,100 -62,84 -78,78 -74,60 -92,50 -88,34 -104,26 -100,10 -116,0 -110,-16 -124,-28 -112,-40 -104,-38" $true $true 'Bare, jagged stone, scoured by salt and wind. Hardly a blade of grass. The high crag in the north-west carries the lighthouse; the two arms in the south hold the lagoon.')
  (Shp "lgrave" "water" "The Ship Graveyard" "52,88 44,70 30,52 10,44 -14,46 -34,56 -46,72 -40,92" $true $true 'A sheltered lagoon full of wrecks: three lost this year and older hulks under them, green with weed. A giant octopus lives in the biggest.')
  (Shp "lshingle" "beach" "" "104,10 122,6 126,22 116,38 106,30" $true $true 'Steep grey shingle. The one safe landing.')
  (Shp "lstrand" "beach" "" "10,44 30,52 26,58 6,52 -14,54 -14,46" $true $true 'A strip of coarse sand at the head of the lagoon.')
  (Shp "lreef1" "reef" "Graveyard Reef" "-72,118 -30,108 10,116 50,106 86,116 72,130 20,128 -20,134 -62,132" $true $true 'Across the lagoon''s mouth. The Silver Tern broke her back on it.')
  (Shp "lreef2" "reef" "The Western Teeth" "-170,-60 -150,-20 -160,30 -140,70 -150,84 -174,40 -164,-20 -184,-52" $true $true 'The reef the false light leads ships onto.')
  (Shp "lreef3" "reef" "Northern Reef" "96,-122 140,-92 172,-40 160,-34 128,-84 88,-114" $true $true 'Shuts off the north-east. Longboats can slip through at low water; a ship can''t.')
  (Shp "lstack1" "rock" "" "-140,-70 -132,-80 -124,-70 -132,-62" $true $true 'A sea stack, white with gulls.')
  (Shp "lstack2" "rock" "" "138,-30 148,-38 152,-24 142,-18" $true $true 'A sea stack.')
  (St "lpath" "lane" "The Cliff Path" "112,22 84,10 54,-6 24,-20 -8,-34 -40,-46 -62,-50" 2 'A goat-narrow path over bare rock, from the landing up to the lighthouse door. Exposed the whole way: anyone on the gallery can see who''s coming.')
  (St "lgravepath" "lane" "" "6,-26 4,6 6,40" 2 'A scramble down from the cliff path to the lagoon''s sand.')
  (St "lstair" "alley" "The Wreckers' Stair" "-62,-56 -40,-64 -12,-70 12,-70" 2 'A hidden stair cut in the rock from the lighthouse crag down to Wreckers'' Cove. Easy to miss: Wisdom (Perception) DC 15, or the stowaway can show them.')
)
$rockShapes | ForEach-Object { if ($_.id -eq "lstair") { $_.hidden = $true } }

# what's inside each one (5-foot squares). The lighthouse fight is split in two (Joseph, 2026-10-10): the stair, and the
# Lantern Room at the top, each with its own map, so each half is its own Low fight.
$towerHalf = @(
  "....mmmmm....",
  "..mm#####mm..",
  ".m##UUUUU##m.",
  ".m#UU:::UU#m.",
  "m#UU:OOO:UU#m",
  "m#U::OOO::U#m",
  "m#U::OOO::U#m",
  "m#UU:::::UU#m",
  ".m#UU:c:UU#m.",
  ".m##:::::##m.",
  "..mm##D##mm..",
  "....m...m....",
  ".............",
  ".............",
  "............."
)
$lampHalf = @(
  "~~~~~~~~~~~~~~~~~",
  "~~~~lllllllll~~~~",
  "~~~ll.......ll~~~",
  "~~ll..#####..ll~~",
  "~~l..##:::##..l~~",
  "~~l.##:|||:##.l~~",
  "~~l.#::|i|::#.l~~",
  "~~l.#::|||::D.l~~",
  "~~l.#:::::::#.l~~",
  "~~l.##:::U:##.l~~",
  "~~l..##:::##..l~~",
  "~~ll..#####..ll~~",
  "~~~ll.......ll~~~",
  "~~~~lllllllll~~~~",
  "~~~~~~~~~~~~~~~~~"
)
$rockInteriors = [ordered]@{
  llight = (IMap "The Lighthouse" @($towerHalf[0..12]) "6.5,5.6,the stone core;6.5,1.6,the stair climbs round and round;6.5,12.6,the door" "5,11 6,11 7,11 5,12 6,12 7,12" "4,2 8,2 3,4 9,4 2,6 10,6" 'The base of the tower. The spiral stair (the U squares) climbs round the stone core to the Lantern Room. The stair is narrow: the wreckers come at the crew a few at a time.')
  llamp = (IMap "The Lantern Room" $lampHalf "8,6.6,the firebird's cage;9.5,9.6,top of the stair;8.5,1.6,the gallery;8.5,14.6,a long drop to the sea" "9,9 8,9 10,9 7,9 8,8 10,8" "6,5 10,5 3,4 13,4 7,2 9,12" 'The lantern room at the top of the tower. The firebird is in its cold-iron cage in the middle. The door on the east side opens onto the gallery and its low rail, high over the sea. The crew comes up the stair at the U.')
  lcove = (IMap "Wreckers' Cove" @(
    "mmmmmmmmm~~~~~~mmmmmmmmm",
    "mmmmmmmm~~~~~~~~mmmmmmmm",
    "mmmmmmm~~~~~~~~~~mmmmmmm",
    "mmmmmmaa~~~~~~~~aammmmmm",
    "mmmmmsaaa~~~~~~aaasmmmmm",
    "mmmmss==aa~~~~aa==ssmmmm",
    "mmm.ss==saa~~aas==ss.mmm",
    "mm....==ss.aa.ss==....mm",
    "mm.c.c.........p......mm",
    "m..x.C......E......B.B.m",
    "m.xx...............B...m",
    "m...................mmmm",
    "mm.mmmm....i....mmm.mmmm",
    "mm|||||m.......mm.....mm",
    "mm|...|m.......mm..X..mm",
    "mm|...D........mm..B..mm",
    "mm|||||mmmmmmmmmm.....mm",
    "mmmmmmmmmmmmmmmmmmmmmmmm"
  ) "12,1.6,the sea;6.5,6.6,longboats;17.5,6.6,longboats;14,8.6,the fire;4,15.6,the pen;19.5,13.4,the queen's nook" "6,3 7,3 16,3 17,3 6,4 17,4" "14,8 16,8 13,9 17,9 20,13 3,9" 'The wreckers'' camp in the sea cave: longboats drawn up on the sand, plunder stacked by the wall, bedrolls round the fire. The captured sailors are in the barred pen (south-west). The queen''s nook is in the south-east, with the strongbox. The party starts where a boat comes in at the cave mouth; the hidden stair from the crag comes down by the pen.')
  ltern = (IMap "Wreck of the Silver Tern" @(
    "~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~rrrrrrrrrrrrrr~~~~",
    "~~~r=========M====r~~~",
    "~~r===H===aaaaa====r~~",
    "~r====x==aa~~~~aa===rb",
    "~~r===c==a~~~~~~a==r~~",
    "~~~r=====aa~~~~aa=r~~~",
    "~~~~rrrrr==aaaa==rr~~~",
    "~~~~~~~~~rrrrrrrr~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~"
  ) "13,5.6,the flooded hold: the octopus;6,1.6,the tilted deck;13.5,1.6,the broken mainmast" "4,3 5,3 4,4 5,4 4,5 5,5" "13,5" 'The Silver Tern lies broken-backed on the reef, her middle stove in and flooded. The giant octopus waits in the flooded hold and grabs anyone at the edge. Salvage is still in the stern.')
  lheron = [ordered]@{ preset = "hold"; by = "builder" }
  lmarigold = [ordered]@{ preset = "ship"; by = "builder" }
  lland = [ordered]@{ preset = "camp-beach"; by = "builder" }
  lsentry = [ordered]@{ preset = "tent"; by = "builder" }
}
foreach ($n in $rockNodes) { if ($rockInteriors.Contains($n.id)) { $n.bmap = $rockInteriors[$n.id] } }
# who's where, and the fights (the numbers are the ones the campaign notes and the old sea-chart markers had)
function RockSite($kind, $foes, $items, $loot) { [ordered]@{ kind = $kind; level = 3; once = $true; waves = 1; foes = $foes; items = $items; loot = $loot } }
($rockNodes | Where-Object id -eq 'llight').site = (RockSite "lighthouse stair" @([ordered]@{ id = "lf_wrecker"; n = "4" }, [ordered]@{ id = "lf_bruiser"; n = "1" }) @() ([ordered]@{ coin = 0; t1 = 1; t2 = 0; t3 = 0; t4 = 0 }))
($rockNodes | Where-Object id -eq 'llamp').site = (RockSite "lantern room" @([ordered]@{ id = "lf_wrecker"; n = "2" }, [ordered]@{ id = "lf_bruiser"; n = "1" }, [ordered]@{ id = "lf_queen"; n = "1" }) @("ll_feather", "ll_reefchart") ([ordered]@{ coin = 1; t1 = 0; t2 = 1; t3 = 0; t4 = 0 }))
($rockNodes | Where-Object id -eq 'llamp').npcs = @("ln_queen")
($rockNodes | Where-Object id -eq 'ltern').site = (RockSite "wreck" @([ordered]@{ id = "srd:giant-octopus"; n = "1" }) @("ll_salvage") ([ordered]@{ coin = 2; t1 = 2; t2 = 0; t3 = 0; t4 = 0 }))
($rockNodes | Where-Object id -eq 'lheron').npcs = @("ln_stowaway")
($rockNodes | Where-Object id -eq 'lcove').site = (RockSite "cave" @([ordered]@{ id = "lf_wrecker"; n = "3" }, [ordered]@{ id = "lf_bruiser"; n = "1" }) @("ll_strongbox") ([ordered]@{ coin = 2; t1 = 2; t2 = 0; t3 = 0; t4 = 0 }))
($rockNodes | Where-Object id -eq 'lcove').npcs = @("ln_heldsailors")
($rockNodes | Where-Object id -eq 'lsentry').site = (RockSite "camp" @([ordered]@{ id = "lf_wrecker"; n = "1" }) @() ([ordered]@{ coin = 0; t1 = 0; t2 = 0; t3 = 0; t4 = 0 }))
# kept off the players' screen until found: the cove and the sentry (the stair is hidden above)
foreach ($n in $rockNodes) { if ($n.id -in @("lcove", "lsentry")) { $n.hidden = $true } }
$rockPlan = [ordered]@{
  format = "ordinate-plan-v1"; of = "klantern"; title = "Lantern Rock"; ppm = $PPM; unit = "yd"
  regions = @(
    [ordered]@{ id = "l1"; name = "The Rock"; threat = 3; hex = $hex.o; notes = 'Bare stone, the landing and the lighthouse crag. Wreckers watch from the gallery.' }
    [ordered]@{ id = "l2"; name = "The Ship Graveyard"; threat = 3; hex = $hex.t; notes = 'The lagoon of wrecks. The octopus hunts here.' }
    [ordered]@{ id = "l3"; name = "Wreckers' Cove"; threat = 4; hex = $hex.r; notes = 'The pirates'' camp in the sea cave under the north cliffs.' }
  )
  nodes = $rockNodes; roads = @(); shapes = $rockShapes
}

# ── what's in each place in town: shop stock and things to find ──
# a few new story items first
$library.loot += @(
  ([ordered]@{ id = "ll_ledger"; name = "Hargrove's ledger"; kind = "story"; rarity = "Mundane"; value = ""; desc = 'A leather ledger of payments to "friends on the southern reefs," each beside the name of a ship that never came home.'; notes = 'Proof that Hargrove-Vance buys the wreckers'' loot.' })
  ([ordered]@{ id = "ll_marigold"; name = "Crate of salvage marked MARIGOLD"; kind = "treasure"; rarity = "Mundane"; value = "60 gp"; desc = 'Brass fittings and bolts of cloth, the crate stenciled with the name of a ship lost near Lantern Rock.'; notes = 'Hidden in the Undaunted''s hold. Ties Hargrove-Vance to the wreckers.' })
  ([ordered]@{ id = "ll_hvnote"; name = "A note signed H.V."; kind = "story"; rarity = "Mundane"; value = ""; desc = '"Five silver each. Bring me the lantern and keep your mouths shut. - H.V."'; notes = 'In a deckhand''s pocket after the dock ambush (Scene 5).' })
  ([ordered]@{ id = "ll_fountain"; name = "Coins in the fountain"; kind = "treasure"; rarity = "Mundane"; value = "3 gp"; desc = 'Wishes, in copper and silver. Taking them is bad luck, or so the gardeners say.'; notes = 'Taking them could count against a character on the captain''s favor track.' })
)
$stock = [ordered]@{
  pchand    = @("Rope", "Lantern, Hooded", "Oil", "Tinderbox", "Grappling Hook", "Chain", "Block and Tackle", "Crowbar", "Spikes, Iron", "Navigator's Tools", "Spyglass", "Scimitar", "Light Crossbow", "Bolts (20)")
  pfish     = @("Rations", "Fishing Tackle", "Net", "Salt", "Barrel")
  pmarket   = @("Backpack", "Bedroll", "Waterskin", "Blanket", "Pouch", "Clothes, Traveler's", "Torch", "Rations", "Cotton Cloth", "Canvas")
  pstall1   = @("Pepper", "Cinnamon", "Cloves", "Ginger", "Saffron")
  pstall2   = @("ll_whisper", "ll_moss", "ll_catcompass", "ll_biscuits", "ll_stormpearl", "ll_parrot")
  pstall3   = @("Rations", "Flour", "Salt")
  ptobias   = @("ll_lantern", "ll_mapfrag", "ll_bottle", "Bell")
  pzisa     = @("ll_comb", "ll_flute", "Crystal", "Candle", "Perfume")
  pcath     = @("Holy Water (flask)", "Amulet", "Reliquary", "Candle")
  pinfirm   = @("Potion of Healing", "Potion of Healing", "Healer's Kit", "Antitoxin (Vial)", "Herbalism Kit")
  pbell     = @("Gaming Set, Dice", "Gaming Set, Playing Cards", "Musical Instrument, Viol")
  pcharter  = @("Map", "Cartographer's Tools", "Navigator's Tools", "Case, Map or Scroll", "Paper", "Ink", "Ink Pen", "Book")
  padm      = @("Manacles", "Chain", "Spear", "Light Crossbow", "Bolts (20)", "Shield", "Chain Shirt", "Signal Whistle")
  ptower    = @("Spyglass", "Signal Whistle", "Musical Instrument, Horn")
  pbelltower= @("Bell", "Candle", "Ladder")
  pmoreau   = @("ll_spectacles", "Decanter of Endless Water", "Necklace of Adaptation", "Perfume", "Signet Ring", "Silk", "Clothes, fine")
  phargrove = @("ll_ledger", "Spyglass", "Rapier", "Clothes, fine")
  pundaunted= @("ll_marigold", "Rope", "Rations")
  psallow   = @("Rations", "Waterskin", "Rope", "Navigator's Tools", "Healer's Kit", "Fishing Tackle")
  pware1    = @("Cotton Cloth", "Canvas", "Iron", "Barrel")
  pware2    = @("Linen", "Salt", "Wheat", "Chest")
  pyard     = @("Carpenter's Tools", "Woodcarver's tools", "Hammer", "Block and Tackle", "Rowboat")
  pgreta    = @("Net", "Fishing Tackle", "Weaver's tools", "Rope")
  pcustoms  = @("Manacles", "Scale, Merchant's", "Lock", "Signal Whistle")
  phideout  = @("Thieves' tools", "Caltrops", "Ball Bearings", "Chalk (1 piece)", "Sling")
  pfarm     = @("Flour", "Wheat", "Goat", "Chicken", "Basket")
  pfountain = @("ll_fountain")
  pambush   = @("ll_hvnote", "Mace", "Heavy Crossbow")
}
$libIds = @{}; foreach ($x in $library.loot) { $libIds[$x.id] = 1 }
foreach ($id in $stock.Keys) {
  $n = $plan.nodes | Where-Object id -eq $id; if (-not $n) { throw "no plan node $id" }
  $ids = foreach ($nm in $stock[$id]) {
    if ($libIds.ContainsKey($nm)) { $nm; continue }
    $hit = @($srd.loot | Where-Object name -eq $nm) | Select-Object -First 1
    if (-not $hit) { throw "no SRD item named '$nm' (for $id)" }
    $hit.id
  }
  if (-not $n.Contains("site")) { $n.site = [ordered]@{ kind = "stock"; level = 3; once = $true; waves = 1; foes = @(); loot = [ordered]@{}; items = @() } }
  $n.site.items = @(@($n.site.items) + @($ids) | Where-Object { $_ })
}

# forest over the main island wherever there's no road, town or hill (Joseph, 2026-10-10): drawn by working out the open
# ground between the coast, the roads and the places, so it follows them. Hidden from the players with the places
# themselves, since the gaps in it would show where the hidden roads run.
$woodNote = 'Forest. It fills the island where there are no roads, towns or hills. Hidden from the players for now, because its gaps would show where the hidden roads run. Show it once they know the roads.'

$doc = [ordered]@{
  format = "ordinate-survey-v1"; title = "The Age of Exploration"; ppm = 10; compass = 8; unit = "mi"; party = 4
  library = $library
  roster = @(1..4 | ForEach-Object { [ordered]@{ id = "pc$_"; name = ""; player = ""; species = ""; cls = ""; level = 3; xp = 900; ac = ""; hp = ""; hpMax = ""; speed = 30; init = ""; pp = ""; dc = ""; str = 10; dex = 10; con = 10; int = 10; wis = 10; cha = 10; favor = 0; notes = "" } })
  xpLog = @()
  regions = @(
    [ordered]@{ id = "r1"; name = "Home Waters"; threat = 1; hex = $hex.t; notes = 'The coast around Kalatecha. Charted and patrolled.' }
    [ordered]@{ id = "r2"; name = "The Southern Reefs"; threat = 3; hex = $hex.r; notes = 'Reefs, wrecks, and the false light of Lantern Rock.' }
    [ordered]@{ id = "r3"; name = "Uncharted"; threat = 5; hex = $hex.p; notes = 'Everything the crew hasn''t mapped yet.' }
  )
  nodes = @(
    (SNode "kcity" "Kalatecha" "city" 0 0 "r1" 'The free city-state where every voyage begins and ends. Open its plan for the streets.' @{ origin = $true; seat = $true; services = [ordered]@{ inn = 1; store = 1; provision = 1; market = 1; temple = 1; healer = 1; reeve = 1; office = 1; board = 1; fence = 1 } })
    (SNode "klantern" "Lantern Rock" "light" (-260) 990 "r2" 'A lonely island whose lighthouse has shone every night for as long as anyone remembers, though no one lives there. About two days'' sail south. Ships that follow its light don''t come back. The first island (2 to 3 sessions). Enter it to explore: the Shingle Landing, the Ship Graveyard and its wrecks, the Sentry''s Perch, Wreckers'' Cove, and the lighthouse. The fights, the queen, the stowaway and the captured sailors are in the places inside.')
    (SNode "kship" "The Sallowmay" "ship" (-30) 8 "r1" 'The captain''s ship. She sails with the crew: in Build mode, drag her along as they go. Enter her for the deck, the captain''s quarters and below decks.')
    (SNode "kundaunted" "The Undaunted" "ship" (-34) (-14) "r1" 'Rupert Hargrove-Vance''s ship: the rival explorer. She races the crew: give her a voyage in her panel and she sails by herself as the days pass. The players see her only within spotting distance of the Sallowmay.' @{ rival = $true; npcs = @("ln_hargrove", "ln_nib") })   # Rupert is aboard her (Joseph, 2026-10-09): he goes where she goes
  )
  roads = @()
  shapes = @(
    (Shp "csea" "water" "The Open Sea" "-8000,-4500 8000,-4500 8000,5500 -8000,5500" $true $false 'Open water on every side, about 1,600 miles across and 1,000 from north to south (Joseph, 2026-10-10: room for many sessions). Its edges are the edge of what the players'' screen shows. Uncharted beyond the home waters.' )
    (Shp "cisle" "island" "Kalatecha Island" "-12,12 -12,10 -12,7 -12,4 -11,2 -11,-1 -10,-3 -9,-5 -8,-8 -9,-11 -11,-13 -12,-16 -14,-18 -16,-20 -18,-22 -20,-24 -22,-26 -24,-28 -25,-30 -27,-31 -29,-33 -31,-34 -33,-36 -35,-38 -36,-40 -35,-44 -35,-48 -34,-52 -33,-55 -33,-59 -32,-63 -31,-67 -30,-70 -28,-75 -26,-80 -25,-85 -23,-90 -22,-95 -21,-100 -20,-105 -20,-110 -20,-114 -20,-119 -20,-123 -18,-127 -21,-130 -24,-133 -28,-136 -30,-140 -34,-146 -38,-152 -39,-159 -38,-166 -42,-172 -44,-178 -46,-184 -50,-190 -55,-197 -56,-206 -54,-215 -50,-223 -57,-228 -63,-234 -66,-242 -70,-250 -64,-255 -59,-260 -55,-266 -52,-273 -50,-280 -48,-287 -43,-293 -40,-300 -40,-309 -40,-319 -36,-328 -31,-336 -37,-343 -46,-347 -51,-355 -60,-360 -65,-365 -68,-372 -65,-379 -66,-386 -72,-389 -79,-391 -85,-394 -90,-400 -88,-407 -85,-414 -83,-421 -80,-428 -76,-434 -69,-438 -64,-443 -60,-450 -53,-454 -49,-460 -41,-460 -33,-461 -32,-468 -29,-475 -28,-483 -30,-490 -24,-490 -19,-492 -13,-493 -7,-494 -2,-496 4,-497 9,-499 15,-500 17,-503 18,-506 20,-509 22,-512 23,-515 25,-518 27,-521 28,-525 26,-529 24,-533 22,-537 20,-541 17,-544 15,-548 13,-552 10,-555 11,-561 11,-567 12,-573 13,-578 18,-583 21,-588 22,-594 20,-600 26,-601 32,-600 37,-604 42,-606 46,-610 49,-615 55,-616 60,-620 64,-624 68,-628 73,-630 79,-631 85,-632 90,-635 95,-638 100,-640 107,-640 113,-643 120,-644 126,-648 132,-651 137,-656 143,-659 150,-660 158,-659 165,-660 172,-661 180,-662 182,-669 185,-676 187,-683 190,-690 197,-688 204,-685 211,-682 219,-682 224,-675 226,-667 234,-665 240,-660 245,-656 249,-651 255,-649 261,-647 265,-642 271,-639 276,-635 280,-630 287,-626 295,-624 303,-626 311,-626 316,-632 318,-640 325,-644 330,-650 335,-642 342,-635 352,-635 362,-632 368,-625 373,-618 382,-616 390,-610 392,-606 395,-602 398,-598 401,-594 403,-590 406,-586 408,-582 410,-578 414,-578 418,-578 422,-578 425,-578 429,-577 433,-577 436,-576 440,-576 445,-579 451,-581 456,-584 461,-587 466,-590 471,-593 476,-596 480,-600 489,-603 497,-608 506,-610 515,-613 516,-623 522,-632 531,-636 540,-640 546,-646 553,-650 559,-656 564,-662 570,-668 574,-676 582,-679 590,-680 598,-688 603,-697 609,-707 609,-718 610,-729 611,-740 614,-751 620,-760 628,-764 635,-769 641,-774 647,-780 656,-780 664,-777 672,-777 680,-780 685,-769 689,-758 699,-751 709,-745 710,-733 708,-721 716,-711 720,-700 719,-686 713,-674 719,-662 721,-648 710,-639 702,-628 701,-614 700,-600 701,-587 702,-574 700,-561 693,-549 685,-538 680,-526 677,-513 680,-500 689,-493 698,-486 703,-475 707,-464 708,-452 714,-442 716,-431 720,-420 717,-407 716,-393 708,-382 700,-372 697,-358 690,-346 695,-333 700,-320 690,-317 680,-311 671,-305 662,-298 656,-288 654,-277 649,-267 640,-260 629,-265 617,-268 604,-270 593,-276 589,-264 580,-255 571,-247 560,-240 552,-235 542,-234 532,-233 523,-231 513,-227 506,-220 501,-211 500,-200 489,-194 479,-186 471,-176 461,-169 464,-157 468,-145 467,-132 470,-120 469,-107 464,-96 458,-85 449,-77 457,-68 467,-60 472,-49 480,-40 487,-33 492,-24 500,-18 504,-9 509,0 516,7 525,12 530,20 533,31 539,41 548,47 559,51 569,54 579,58 590,59 600,60 607,69 613,79 614,90 620,100 632,102 644,102 653,111 660,120 667,129 675,137 681,147 689,155 696,165 700,176 700,188 700,200 701,208 701,216 701,224 699,232 694,239 690,246 690,254 690,262 687,267 684,271 681,275 678,280 676,285 673,290 670,295 668,300 670,303 671,307 672,311 673,315 674,319 676,323 678,326 680,330 675,336 670,343 666,350 661,356 654,360 646,364 643,372 640,380 630,385 621,392 611,388 600,387 591,393 581,396 571,391 560,390 553,385 545,382 539,376 531,373 523,369 517,363 509,360 500,360 495,358 491,353 487,349 482,346 476,345 470,346 465,343 460,340 458,348 459,356 453,361 449,369 442,373 435,376 427,377 420,380 417,392 418,405 422,417 424,429 412,431 401,437 392,446 380,450 373,459 371,470 367,480 363,491 356,500 350,510 341,517 330,520 325,531 317,540 307,546 298,554 301,566 307,577 302,588 300,600 286,601 274,608 264,617 256,628 250,640 250,654 249,667 250,680 243,686 234,691 224,691 215,688 210,695 204,702 203,711 200,720 196,716 193,712 193,707 191,702 186,704 180,703 175,702 170,700 176,691 180,681 180,670 177,660 177,649 172,640 174,629 180,620 172,611 161,606 157,595 148,586 152,575 155,563 153,551 150,540 140,532 130,525 118,520 106,518 99,507 95,495 95,482 100,470 92,462 85,454 77,445 67,441 60,432 56,421 52,411 50,400 47,391 41,383 34,376 27,368 27,358 28,348 22,340 20,330 18,320 11,313 5,305 3,296 -2,287 -2,277 -7,269 -10,260 -10,247 -10,234 0,225 6,213 -4,205 -15,200 -21,189 -30,180 -25,171 -20,162 -17,152 -19,141 -28,136 -35,128 -42,120 -45,110 -44,105 -43,100 -44,95 -45,90 -44,85 -44,80 -42,75 -40,70 -40,67 -39,65 -38,63 -38,60 -38,58 -38,55 -38,53 -38,50 -35,48 -31,46 -28,44 -25,42 -22,40 -19,37 -17,34 -14,32 -14,30 -14,27 -13,25 -13,22 -12,20 -12,17 -12,15" $true $false 'Kalatecha''s island, about 80 miles across and 150 long: the city on its west coast, a long finger of land to the north-east, a deep bay on the east side, a peninsula reaching south toward the reefs, scattered hills (the Inland Hills the biggest), and room inland for two more cities.')
    (Shp "creef" "reef" "" "-310,940 -260,925 -210,950 -200,1000 -230,1040 -290,1045 -325,1000" $true $false 'The reef that wrecks ships following the false light. The crew''s job is to chart a safe channel through it.')
    (Shp "crock" "island" "" "-276,976 -268,972 -262,966 -254,972 -246,970 -242,980 -236,986 -242,994 -238,1004 -248,1006 -254,1012 -262,1004 -272,1006 -276,996 -282,988" $true $true 'The island itself: cliffs, a ship graveyard lagoon, sea caves, and the lighthouse.')
    (Shp "chills" "hills" "Inland Hills" "150,-110 158,-116 166,-123 171,-133 170,-144 180,-145 190,-142 200,-138 210,-140 216,-133 220,-124 223,-115 224,-106 234,-105 243,-109 251,-104 260,-100 260,-91 258,-82 263,-74 266,-65 268,-56 273,-48 274,-39 270,-30 265,-21 257,-15 252,-6 245,1 239,10 238,20 239,30 240,40 236,49 229,56 224,64 216,69 207,66 197,67 189,63 180,60 173,55 165,51 156,48 148,45 146,36 140,28 140,19 140,10 131,4 122,-3 114,-11 109,-21 114,-31 114,-43 124,-49 130,-60 129,-67 127,-74 130,-81 133,-88 140,-90 145,-96 149,-102" $true $false)
    (Shp "chills1" "hills" "" "290,-440 295,-444 301,-447 308,-446 315,-447 321,-447 327,-450 334,-450 340,-450 347,-449 354,-449 359,-444 364,-440 369,-435 371,-429 375,-424 380,-420 373,-413 364,-411 364,-402 360,-393 365,-386 366,-377 367,-368 370,-360 365,-355 360,-350 356,-344 349,-341 342,-346 335,-349 327,-349 320,-345 314,-347 309,-351 303,-352 297,-354 293,-359 289,-363 287,-369 285,-375 293,-381 301,-387 307,-396 308,-406 306,-416 305,-426 298,-434" $true $false)
    (Shp "chills2" "hills" "" "330,-250 336,-254 343,-255 348,-260 353,-265 360,-265 367,-267 373,-269 380,-270 380,-259 384,-248 380,-237 372,-228 376,-217 385,-209 395,-204 405,-200 399,-190 396,-178 389,-168 378,-163 383,-153 387,-142 388,-130 395,-120 388,-121 381,-121 374,-124 367,-123 366,-115 363,-108 356,-104 350,-100 345,-108 337,-112 337,-121 333,-129 333,-138 330,-146 325,-153 320,-160 326,-171 329,-183 327,-195 320,-206 324,-216 327,-227 327,-239" $true $false)
    (Shp "chills3" "hills" "" "638,-700 641,-701 644,-701 646,-698 649,-697 651,-695 653,-693 654,-691 655,-688 651,-677 645,-666 637,-656 626,-650 633,-640 637,-629 642,-618 652,-610 652,-605 651,-601 653,-597 654,-592 651,-589 647,-586 643,-584 641,-580 643,-585 644,-590 645,-595 645,-600 640,-603 634,-604 633,-610 630,-615 630,-623 631,-630 626,-636 624,-643 629,-649 630,-657 630,-665 627,-672 631,-674 634,-677 637,-680 638,-684 637,-688 637,-692 637,-696" $true $false)
    (Shp "chills4" "hills" "" "215,500 220,497 225,497 229,493 234,491 239,490 244,489 250,489 255,488 261,487 267,487 272,490 276,494 277,500 281,504 281,510 282,515 283,523 282,530 278,536 276,543 272,550 272,557 271,565 272,572 271,578 271,585 267,590 266,596 260,596 254,594 248,597 242,598 237,594 232,589 226,586 219,586 221,580 221,573 222,567 222,560 224,552 223,544 227,537 229,529 228,521 224,514 218,508" $true $false)
    (Shp "cislet0" "island" "" "760,-740 764,-744 766,-748 771,-750 776,-750 777,-745 779,-740 783,-736 786,-732 784,-727 780,-724 775,-724 770,-724 766,-727 765,-732 762,-736" $true $false 'A small islet off Kalatecha Island.')
    (Shp "cislet1" "island" "" "-120,-430 -116,-433 -111,-435 -106,-437 -102,-440 -102,-434 -101,-429 -98,-424 -94,-420 -99,-421 -104,-421 -109,-418 -112,-414 -115,-418 -117,-422 -119,-426" $true $false 'A small islet off Kalatecha Island.')
    (Shp "cislet2" "island" "" "-118,-330 -116,-332 -116,-335 -113,-335 -110,-336 -110,-333 -109,-330 -107,-327 -104,-326 -106,-324 -107,-322 -109,-320 -112,-320 -115,-321 -117,-324 -117,-327" $true $false 'A small islet off Kalatecha Island.')
    (Shp "cislet3" "island" "" "250,770 255,772 260,771 263,766 268,764 268,769 270,774 273,778 276,782 272,785 268,789 263,787 258,788 258,783 258,777 253,774" $true $false 'A small islet off Kalatecha Island.')
    (Shp "cislet4" "island" "" "560,-130 564,-133 568,-133 572,-135 574,-138 576,-134 580,-131 583,-127 584,-122 580,-121 576,-118 572,-116 568,-114 566,-118 563,-122 561,-126" $true $false 'A small islet off Kalatecha Island.')
    (Shp "cwood0" "wood" "Brackenmoor Wood" "-24,64 16,80 40,144 64,168 72,224 128,232 152,256 168,256 168,280 192,304 232,304 240,288 288,288 288,280 336,272 352,256 376,256 392,240 416,256 456,256 464,240 496,240 496,248 520,248 544,272 576,280 576,320 608,360 624,360 624,376 560,376 560,368 528,360 520,344 496,344 488,328 448,328 448,352 408,368 408,384 400,384 408,416 360,448 352,488 336,504 320,504 304,536 288,536 288,496 272,480 216,488 208,496 208,512 224,520 216,592 232,592 248,608 248,624 232,640 232,680 208,672 192,688 192,640 184,640 192,608 168,592 168,536 144,512 112,504 112,456 88,432 72,432 64,384 40,368 32,312 16,304 16,272 0,256 0,240 16,232 16,200 -8,192 0,144 -32,112" $true $false $woodNote @{ hidden = $true })
    (Shp "cwood1" "wood" "The Hollowheart" "368,-496 408,-488 408,-440 416,-440 416,-296 424,-296 416,-192 408,-192 408,-208 392,-208 376,-224 392,-240 384,-280 344,-272 320,-248 312,-152 328,-144 328,-112 344,-96 384,-112 384,-88 376,-88 320,40 304,48 288,96 272,104 248,160 232,168 224,200 208,216 176,216 152,192 152,168 128,144 104,144 88,128 88,112 72,104 72,88 48,56 72,16 64,-40 40,-56 56,-144 64,-144 96,-264 104,-264 120,-312 144,-328 152,-296 168,-288 168,-144 160,-144 168,-128 144,-120 144,-96 128,-96 120,-48 104,-40 104,-8 120,8 136,8 144,56 168,56 184,72 232,72 232,56 248,48 248,0 272,-16 280,-56 272,-56 256,-112 232,-112 216,-144 176,-152 176,-256 200,-232 192,-192 224,-160 272,-168 280,-232 264,-248 232,-256 232,-272 208,-296 200,-328 184,-336 176,-368 208,-400 224,-400 232,-416 248,-416 256,-432 272,-432 288,-448 304,-392 280,-384 280,-360 312,-336 320,-344 360,-336 376,-352 368,-408 384,-408 384,-424 360,-456 312,-456 312,-464" $true $false $woodNote @{ hidden = $true })
    (Shp "cwood2" "wood" "The Eastwold" "648,-768 696,-736 696,-704 704,-704 704,-680 696,-680 704,-648 688,-640 688,-560 664,-536 664,-496 688,-480 696,-440 704,-440 704,-392 688,-384 680,-328 640,-296 640,-280 584,-288 568,-256 504,-240 488,-224 488,-208 464,-192 472,-296 464,-296 456,-496 472,-496 496,-528 488,-592 528,-600 528,-624 560,-632 584,-664 600,-664 616,-680 624,-744 632,-744 632,-680 624,-680 616,-632 624,-632 624,-600 640,-600 632,-576 656,-584 656,-616 640,-624 640,-656 664,-680 664,-696 640,-704" $true $false $woodNote @{ hidden = $true })
    (Shp "cwood3" "wood" "" "424,-80 456,-56 456,-40 520,24 528,56 592,72 608,112 648,120 648,136 688,176 688,232 592,240 528,200 464,184 456,168 416,168 368,208 256,240 264,208 280,200 304,144 320,136 336,88 352,80 368,32 384,24" $true $false $woodNote @{ hidden = $true })
    (Shp "cwood4" "wood" "Thornwick Copse" "296,-552 352,-544 352,-536 336,-536 328,-520 240,-480 208,-448 192,-448 176,-424 160,-424 152,-408 128,-424 104,-480 88,-488 88,-504 120,-512 120,-520 152,-520 152,-528 200,-536 200,-544 280,-536" $true $false $woodNote @{ hidden = $true })
    (Shp "cwood5" "wood" "Kingsfell Wood" "8,-488 16,-488 16,-424 8,-424 8,-328 0,-328 0,-240 -8,-240 -8,-144 -16,-144 -24,-176 -40,-192 -40,-240 -48,-240 -40,-280 -24,-288 -16,-344 -40,-368 -56,-368 -48,-392 -72,-400 -72,-424 -56,-424 -40,-448 -24,-448 -16,-480 8,-480" $true $false $woodNote @{ hidden = $true })
    (Shp "cwood6" "wood" "Gullhaven Wood" "200,-672 224,-648 240,-648 248,-632 264,-632 264,-624 240,-624 224,-608 224,-592 112,-568 88,-552 24,-560 24,-576 48,-600 64,-600 72,-616 136,-632 144,-648 192,-648" $true $false $woodNote @{ hidden = $true })
    (Shp "cwood7" "wood" "" "64,-440 112,-368 80,-336 80,-320 48,-272" $true $false $woodNote @{ hidden = $true })
  )
  plans = [ordered]@{ kcity = $plan; kship = $shipPlan; klantern = $rockPlan }
}
# the Sallowmay is sailed by the captain, by magic: 24 hours a day with no crew needed (Joseph, 2026-10-09)
$ks =$doc.nodes | Where-Object { $_.id -eq 'kship' }; $ks.sailHours = 24; $ks.sailNote = 'Sailed by the captain, by magic: 24 hours a day, no crew needed.'
# hidden things: a Perception check to find them (st.hide {itemId: DC}); everything else is in plain sight
# the Guild's mission board hangs in the Charter House (Joseph, 2026-10-09). Lantern Rock is its first job, not up
# yet: Fontaine hands it over in Session 1, Scene 4, and setting it to Taken puts Lantern Rock on the sea chart.
($plan.nodes | Where-Object id -eq 'pcharter').board = [ordered]@{
  title = "The Guild of Explorers: Commissions"; skin = "parchment"
  missions = @(
    [ordered]@{ id = "ms_lantern"; title = "Chart a safe channel to Lantern Rock"; patron = "Michael Fontaine, for the Guild of Explorers"
      reward = "50 gold pieces each, a bonus for anything valuable brought back, and a copy of the Guild's chart"
      text = 'Lantern Rock lies about two days'' sail south. Its lighthouse has shone every night for as long as anyone remembers, though no one lives there, and ships that follow its light don''t come back. Three have been lost this year. Wanted: a crew to chart a safe channel through the reef, and to find out what became of the lost ships.'
      notes = 'Fontaine offers it in Session 1, Scene 4, with the sealed letter. A quartermaster''s DC 15 Persuasion raises the fee to 60 gp each. The truth: wreckers use a caged firebird as a false light (see Lantern Rock). Set this to Taken when the crew accepts: Lantern Rock becomes a known route. Un-hide the reef in its own panel.'
      to = "klantern"; status = "draft" }
  )
}
$hidden = [ordered]@{
  phargrove  = @{ ll_ledger = 15 }                     # tucked away in Hargrove-Vance's study
  pundaunted = @{ ll_marigold = 10 }                   # down in the Undaunted's hold
  pambush    = @{ ll_hvnote = 10 }                     # in a deckhand's pocket
  phideout   = @{ "srd:srd_thieves-tools" = 10; "srd:caltrops" = 10; "srd:ball-bearings" = 10; "srd:srd_chalk-1-piece" = 10; "srd:sling" = 10 }   # the twins' stash
  lcove      = @{ ll_strongbox = 15 }                  # the wreckers' strongbox, hidden in the queen's nook (she has the key)
  ltern      = @{ ll_salvage = 10 }
}
$coinDc = @{ lcove = 10; ltern = 10 }
$allNodes = @($doc.nodes) + @($plan.nodes) + @($rockPlan.nodes)
foreach ($id in $hidden.Keys) {
  $n = $allNodes | Where-Object id -eq $id; if (-not $n) { throw "no node $id" }
  foreach ($k in $hidden[$id].Keys) { if (@($n.site.items) -notcontains $k) { throw "$id has no item $k" } }
  $n.site.hide = $hidden[$id]
}
foreach ($id in $coinDc.Keys) { ($allNodes | Where-Object id -eq $id).site.coinDc = $coinDc[$id] }
# the deckhands now carry their own weapons and silver, so the ambush spot only holds the note
$amb = ($allNodes | Where-Object id -eq 'pambush').site
$amb.items = @("ll_hvnote"); $amb.loot.coin = 0
# --- the campaign's people get full character sheets ----------------------------------------
# Each is filled in from the SRD stat block that suits them (the same thing the app's "Fill in their
# sheet" button does): numbers, attacks, spells and a copy of the stat block, which they then fight
# with. Hargrove-Vance is built by hand as a 5th-level warlock; the captain's sheet is left blank.
function SheetAttacks($b) {
  $out = @()
  $pairs = New-Object System.Collections.ArrayList
  foreach ($p in (PairList $b.act)) { [void]$pairs.Add($p) }
  foreach ($p in (PairList $b.bon)) { [void]$pairs.Add($p) }
  foreach ($p in $pairs) {
    $t = [string]$p[1]
    $hit = [regex]::Match($t, 'Attack Roll:\s*([+-]\d+)').Groups[1].Value
    if (-not $hit) { $hit = [regex]::Match($t, '([+-]\d+) to hit').Groups[1].Value }
    $dc = [regex]::Match($t, '(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw:?\*?\s*DC (\d+)')
    if (-not $hit -and -not $dc.Success) { continue }
    $h = [regex]::Match($t, '\((\d+d\d+(?:\s*[+-]\s*\d+)?)\)\s*([A-Za-z]+) damage')
    $out += [ordered]@{ name = ($p[0] -replace '\s*\(.*\)\s*$', ''); hit = $(if ($hit) { $hit } else { "$($dc.Groups[1].Value.Substring(0,3).ToUpper()) $($dc.Groups[2].Value)" })
      dmg = ($h.Groups[1].Value -replace '\s', ''); dtype = $h.Groups[2].Value.ToLower() }
  }
  return , $out
}
function SheetFromSrd($n, $srdName) {
  $b = $srd.foes | Where-Object name -eq $srdName | Select-Object -First 1
  if (-not $b) { throw "no SRD stat block '$srdName'" }
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
$sheetOf = [ordered]@{
  ln_fontaine = "Scout"; ln_tobias = "Commoner"; ln_marisol = "Tough"; ln_quell = "Guard Captain"; ln_okoro = "Guard"; ln_amara = "Priest Acolyte"
  ln_pip = "Commoner"; ln_greta = "Commoner"; ln_dario = "Commoner"; ln_moreau = "Noble"; ln_twins = "Commoner"; ln_zisa = "Commoner"
  ln_queen = "Bandit Captain"; ln_lucia = "Commoner"; ln_stowaway = "Commoner"; ln_thimble = "Sprite"; ln_nib = "Sprite"
}
foreach ($id in $sheetOf.Keys) { $n = $library.npcs | Where-Object id -eq $id; if (-not $n) { throw "no person $id" }; SheetFromSrd $n $sheetOf[$id] }
# the pirate queen carries what her foe entry carries (the strongbox key, her coin)
$q = $library.npcs | Where-Object id -eq "ln_queen"; $qf = $library.foes | Where-Object id -eq "lf_queen"
$q.carries = $qf.carries; $q.purse = $qf.purse; $q.hideDc = $qf.hideDc

# suggested alignments (Joseph to approve or change in the app)
$alignOf = @{ ln_callomay = "Lawful Neutral"; ln_fontaine = "Lawful Good"; ln_tobias = "Neutral"; ln_hargrove = "Lawful Evil"; ln_marisol = "Chaotic Good"
  ln_quell = "Lawful Neutral"; ln_okoro = "Lawful Good"; ln_amara = "Neutral Good"; ln_pip = "Neutral Good"; ln_greta = "Chaotic Good"; ln_dario = "Lawful Neutral"
  ln_moreau = "Neutral"; ln_twins = "Chaotic Good"; ln_zisa = "Chaotic Neutral"; ln_queen = "Chaotic Evil"; ln_lucia = "Neutral"; ln_stowaway = "Neutral Good"; ln_thimble = "Neutral Good"; ln_nib = "Lawful Evil" }
foreach ($n in $library.npcs) { if ($alignOf.ContainsKey($n.id)) { $n.align = $alignOf[$n.id] } }
# key characters (the Where tab keeps them at the top): the captain and Thimble, the crew's Guild contact, and the main antagonist, Rupert Hargrove-Vance (Joseph, 2026-10-09)
foreach ($n in $library.npcs) { if ($n.id -in @('ln_callomay', 'ln_thimble', 'ln_fontaine', 'ln_hargrove')) { $n.key = $true } }

# the captain: his numbers from captain-callomay.md (Joseph's homebrew archfey, not a rules stat block).
# He never fights: no AC, no hit points, no stat block. Deception +12 and Insight +14 are tuned so his
# contested rolls average about 23 and 25, and elves roll those contests with advantage (Joseph, 2026-10-09).
$cap = $library.npcs | Where-Object id -eq "ln_callomay"
$cap.fightsAs = ""
$cap.species = "Archfey, glamoured as a human"; $cap.cls = "None (the crew thinks he's a warlock)"
$cap.str = "12"; $cap.dex = "18"; $cap.con = "16"; $cap.int = "18"; $cap.wis = "20"; $cap.cha = "24"
$cap.speed = "30 ft."; $cap.init = "+4"; $cap.pp = "21"
$cap.saves = "Str +1, Dex +10, Con +3, Int +4, Wis +11, Cha +13 (proficiency bonus +6)"
$cap.skills = "Deception +12, Insight +14 (both tuned for the table: see the notes), History +16, Performance +13, Persuasion +13, Perception +11, Survival +11, Arcana +10, Sleight of Hand +10, Stealth +10"
$cap.senses = "Passive Insight 24. Aboard the Sallowmay he knows everything that happens, as if the ship tells him."
$cap.langs = "Every language anyone has ever spoken at sea; he pretends not to understand some of them"
$cap.defenses = "Nothing at the crew's level can hurt him: blades pass through him like mist and spells unravel on his skin. He has no hit points and never fights back. Can't touch cold iron."
$cap.carries = "A bronze-hilted sword (bronze, never iron)"
$cap.persona = "Trait: unhurried and courteous; calls the crew by their roles until they earn their names, and answers questions with questions.`nIdeal: A bargain is a bargain, kept to the letter.`nBond: the Sallowmay, and every crew he's outlived.`nFlaw: he'll never tell an outright lie, but he hides a great deal.`nRules he can't break: never an outright lie; can't set foot on land; can't touch cold iron; can't draw a map of a mortal coast; keeps every bargain."
$cap.notes += "`n`nTable rules (Joseph): reading him or lying to him is a contest. Catch him out: their Insight vs his Deception +12; they win, he lets something slip (d8, His slips in his doc); they lose but total 15+ or tie, he's choosing his words carefully. Lie to him: their Deception vs his Insight +14; they win, he believes them and favor doesn't move; tie, not fooled but favor doesn't move; they lose, he knows and favor drops. Elves roll both contests with advantage. His true name never slips."
if ($cap.Contains('statBlock')) { $cap.Remove('statBlock') }
# Thimble: the fairy everyone takes for the captain's familiar. She isn't one (Joseph, 2026-10-08).
$t = $library.npcs | Where-Object id -eq "ln_thimble"
$t.species = "Sprite (fey)"
$t.persona = "Trait: bossy, nosy, and fiercely loyal; argues with the captain in front of anyone.`nIdeal: Loyalty - she followed him out of the garden and she isn't leaving now.`nBond: the captain, and the Sallowmay, which she helped plant.`nFlaw: can't stand being ordered about, and hates being called a familiar."

# Rupert Hargrove-Vance: Human warlock 5 (2024 rules), Criminal background, Archfey Patron, Pact of the Chain.
# His patron is Vesperine of the Thorn, an Unseelie archfey and the captain's old court rival, who wants Callomay to lose his wager with Mother Brine (Joseph, 2026-10-08; named 2026-10-09).
# Standard array 15,14,13,12,10,8; Criminal +2 Dex / +1 Con; level 4 ASI +1 Cha / +1 Int.
$h = $library.npcs | Where-Object id -eq "ln_hargrove"
$h.species = "Human"; $h.cls = "Warlock"; $h.level = "5"; $h.cr = 3
$h.str = "8"; $h.dex = "16"; $h.con = "14"; $h.int = "13"; $h.wis = "10"; $h.cha = "16"
$h.ac = "15"; $h.hpMax = "38"; $h.hp = "38"; $h.speed = "30 ft."; $h.init = "+6"; $h.pp = "10"; $h.dc = "14"; $h.satk = "+6"
$h.saves = "Str -1, Dex +3, Con +2, Int +1, Wis +3, Cha +6"
$h.skills = "Deception +6, Intimidation +6, Persuasion +6, Sleight of Hand +6, Stealth +6. Tools: Thieves' Tools"
$h.senses = ""
$h.langs = "Common, plus one of his choice"
$h.defenses = ""
$h.attacks = @(
  [ordered]@{ name = "Eldritch Blast"; hit = "+6"; dmg = "1d10+3"; dtype = "force" }
  [ordered]@{ name = "Dagger"; hit = "+6"; dmg = "1d4+3"; dtype = "piercing" }
)
# 3 cantrips, 6 prepared (2024 warlock 5), plus the Archfey spells (always prepared), two invocation spells, and Find Familiar from Pact of the Chain
$h.spells = @("Eldritch Blast", "Mage Hand", "Minor Illusion", "Find Familiar", "Charm Person", "Hex", "Hold Person", "Invisibility", "Counterspell", "Hypnotic Pattern",
  "Faerie Fire", "Sleep", "Calm Emotions", "Misty Step", "Phantasmal Force", "Blink", "Plant Growth", "Disguise Self", "Silent Image" | ForEach-Object { $nm = $_; $s = $srd.spells | Where-Object name -eq $nm | Select-Object -First 1; if (-not $s) { throw "no SRD spell $nm" }; $s.id })
$h.slots = @(0..9 | ForEach-Object { [ordered]@{ max = $(if ($_ -eq 3) { 2 } else { 0 }); used = 0 } })
$h.res = @(
  [ordered]@{ id = "rs_hvmc"; name = "Magical Cunning"; max = 1; used = 0; rest = "long" }
  [ordered]@{ id = "rs_hvsf"; name = "Steps of the Fey"; max = 3; used = 0; rest = "long" }
)
$h.carries = "Studded Leather Armor`n2 Daggers`nThieves' Tools`na leather journal of the crew's mistakes`na monocle"
$h.persona = "Trait: polite, precise, and always taking notes on other people's failures.`nIdeal: Reputation - the Guild will remember who was best.`nBond: a bargain with Vesperine of the Thorn, an Unseelie archfey who pays in luck and expects results.`nFlaw: can't resist gloating, even when keeping quiet would win."
# his own stat block, so a fight tracks his pact slots and Steps of the Fey
$h.statBlock = [ordered]@{
  name = "Rupert Hargrove-Vance"; cr = 3; xp = 700; size = "Medium"; type = "Humanoid"; align = "lawful evil"
  ac = 15; acd = "studded leather"; hp = 38; hd = "5d8 + 10"; init = "+6"; spd = "30 ft."; ab = @(8, 16, 14, 13, 10, 16)
  sav = "Wis +3, Cha +6"; sk = "Deception +6, Intimidation +6, Persuasion +6, Sleight of Hand +6, Stealth +6"
  sen = "Passive Perception 10"; lang = "Common"; vul = ""; res = ""; imm = ""; cimm = ""
  tr = @(
    , @("Alert", "He adds his Proficiency Bonus (+3) to Initiative rolls and, right after rolling Initiative, can swap it with one willing ally in the same fight.")
    , @("Magical Cunning (1/Day)", "With a 1-minute rite, he regains one expended pact slot (half his slots, rounded up). Once per Long Rest.")
  )
  act = @(
    , @("Eldritch Blast", "Ranged Attack Roll: +6, range 120 ft. Two beams, each its own attack roll at the same or different targets. 8 (1d10 + 3) Force damage per beam (Agonizing Blast), and Repelling Blast can push a Large or smaller target up to 10 feet straight away.")
    , @("Dagger", "Melee or Ranged Attack Roll: +6, reach 5 ft. or range 20/60 ft. 5 (1d4 + 3) Piercing damage.")
    , @("Spellcasting", "He casts spells as a level-5 Warlock, using Charisma as the spellcasting ability (spell save DC 14, +6 to hit with spell attacks). Pact slots come back on a Short or Long Rest, and any spell below is cast with one at the slot's level. The Archfey spells (Faerie Fire, Sleep, Calm Emotions, Misty Step, Phantasmal Force, Blink, Plant Growth) are always prepared.`n`n- **Cantrips (at will):** Eldritch Blast, Mage Hand, Minor Illusion`n- **At Will:** Disguise Self, Silent Image`n- **Pact slots:** 2 at 3rd level`n- **1st level (pact slots):** Charm Person, Faerie Fire, Hex, Sleep`n- **2nd level (pact slots):** Calm Emotions, Hold Person, Invisibility, Misty Step, Phantasmal Force`n- **3rd level (pact slots):** Blink, Counterspell, Hypnotic Pattern, Plant Growth")
  )
  bon = @(, @("Steps of the Fey (3/Day)", "He casts Misty Step without a spell slot (Charisma modifier times per Long Rest). Right after he teleports, he picks one: Refreshing Step - he or one creature he can see within 10 feet gains 1d10 temporary hit points; or Taunting Step - creatures within 5 feet of the space he left must succeed on a DC 14 Wisdom saving throw or have Disadvantage on attack rolls against creatures other than him until the start of his next turn."))
  rea = @(); leg = @(); talk = $true; boss = $false
}
$h.fightsAs = "self"
$h.notes = $h.notes + " WARLOCK 5 (2024): Human, Criminal background (Alert feat: + proficiency to initiative). Archfey Patron: his patron is Vesperine of the Thorn, an Unseelie archfey and the captain's rival at court for centuries, who wants Captain Callomay to lose his wager with Mother Brine - so the Sallowmay's crew must never finish a chart. She found him fifteen years ago, right after he broke his word to the captain (he and a teenage Fontaine crewed the Sallowmay; he sold a chart outside the Guild). Pact of the Chain: his familiar is a sprite, a spirit in a sprite's shape; Thimble can tell at a glance and it makes her furious. Invocations: Pact of the Chain, Agonizing Blast (+Cha to Eldritch Blast damage), Repelling Blast (push 10 ft.), Mask of Many Faces (Disguise Self at will), Misty Visions (Silent Image at will). Pact Magic: two 3rd-level slots, back on a short rest; Magical Cunning once per long rest. Steps of the Fey: Misty Step without a slot 3 times per long rest, with Refreshing Step (1d10 temp HP) or Taunting Step (DC 14 Wis save or Disadvantage against anyone but him). Archfey spells always prepared: Faerie Fire, Sleep, Calm Emotions, Misty Step, Phantasmal Force, Blink, Plant Growth. CR 3 is an estimate for the encounter budget, not a rule. Tactics: never fights fair - opens with Hypnotic Pattern or Sleep, blinks away with Steps of the Fey, and lets hired toughs take the hits."
# the silver swirl on his neck (Joseph, 2026-10-10): Captain Callomay saved his life when Rupert was one of his crew, aboard the
# Sallowmay, the same way he brings Thimble back; the mark is the price, like her spirals
$h.notes = $h.notes + " THE SILVER SWIRL (DM only): just peeking out above his collar. Captain Callomay saved his life when Rupert was one of his crew, fifteen years ago, and this is the mark it left, like Thimble's spirals. Rupert knows the captain saved him; he doesn't talk about it. Studying it is an Arcana check, read like Thimble's spirals (see the Captain Callomay document)."

# survey shapes are in miles x 10 px already, so undo the plan scale used by P
foreach ($s in $doc.shapes) { $s.pts = @($s.pts | ForEach-Object { [ordered]@{ x = [math]::Round($_.x / $PPM); y = [math]::Round($_.y / $PPM) } }) }

# the players' characters, from their sheets in Players\ (each sheet travels inside the file as base64)
$doc.files = [ordered]@{}
function SrdItem($nm) { $hit = @($srd.loot | Where-Object name -eq $nm) | Select-Object -First 1; if (-not $hit) { throw "no SRD item named '$nm'" }; $hit.id }
function SrdSpell($nm) { $hit = @($srd.spells | Where-Object name -eq $nm) | Select-Object -First 1; if (-not $hit) { throw "no SRD spell named '$nm'" }; $hit.id }
function Attach($pc, $id, $path) {
  $bytes = [IO.File]::ReadAllBytes($path)
  $doc.files[$id] = [ordered]@{ type = "application/pdf"; data = [Convert]::ToBase64String($bytes) }
  $pc.files = @([ordered]@{ id = $id; name = (Split-Path $path -Leaf); size = $bytes.Length; at = "2026-10-08" })
}
$x = $doc.roster[0]
$x.name = 'Xuna Kor''larym'; $x.player = "Rebekah";
$x.align = "Chaotic Neutral"; $x.role = "Navigator"; $x.species = "Elf (Drow)"; $x.cls = "Druid"; $x.subcls = "Circle of the Stars"; $x.bg = "Sage"
$x.level = 3; $x.xp = 900; $x.ac = "16"; $x.hp = "24"; $x.hpMax = "24"; $x.speed = 30; $x.init = "+2"; $x.pp = "15"; $x.dc = "13"; $x.satk = "+5"
$x.str = 13; $x.dex = 14; $x.con = 14; $x.int = 11; $x.wis = 16; $x.cha = 10
$x.saves = "Int +2, Wis +5 (proficient)"
$x.skills = 'Proficient: Arcana +2, History +2, Insight +5, Perception +5, Survival +5. Tools: Herbalism Kit, Navigator''s Tools'
$x.senses = "Darkvision 120 ft."
$x.langs = "Common, Druidic, Elvish, Gnomish, Undercommon"
$x.defenses = 'Magic can''t put her to sleep (Trance). Advantage on saves to avoid or end Charmed (Fey Ancestry)'
$x.attacks = @(
  [ordered]@{ name = "Rapier"; hit = "+4"; dmg = "1d8+2"; dtype = "piercing" }
  [ordered]@{ name = "Starry Wisp"; hit = "+5"; dmg = "1d8"; dtype = "radiant" }
  [ordered]@{ name = "Starry Form: Archer (bonus action)"; hit = "+5"; dmg = "1d8+3"; dtype = "radiant" }
  [ordered]@{ name = "Oil flask"; hit = "DEX 12"; dmg = "5"; dtype = "fire" }
  [ordered]@{ name = "Unarmed Strike"; hit = "+3"; dmg = "2"; dtype = "bludgeoning" }
)
$x.slots = @(0..9 | ForEach-Object { [ordered]@{ max = $(if ($_ -eq 1) { 4 } elseif ($_ -eq 2) { 2 } else { 0 }); used = 0 } })
$x.res = @(
  [ordered]@{ id = "rs_xws"; name = "Wild Shape"; max = 2; used = 0; rest = "one" }
  [ordered]@{ id = "rs_xgb"; name = "Guiding Bolt, free (Star Map)"; max = 3; used = 0; rest = "long" }
  [ordered]@{ id = "rs_xff"; name = "Faerie Fire, free (Drow)"; max = 1; used = 0; rest = "long" }
  [ordered]@{ id = "rs_xmi"; name = "Magic Initiate spell, free"; max = 1; used = 0; rest = "long" }
  [ordered]@{ id = "rs_xhd"; name = "Hit Point Dice (d8)"; max = 3; used = 0; rest = "long" }
)
$x.spells = @("Dancing Lights", "Mage Hand", "Druidcraft", "Mending", "Starry Wisp", "Guidance", "Speak with Animals", "Healing Word", "Cure Wounds", "Shield", "Thunderwave", "Ice Knife", "Faerie Fire", "Find Familiar", "Guiding Bolt", "Pass without Trace", "Moonbeam" | ForEach-Object { SrdSpell $_ })
$x.inv = @(
  [ordered]@{ text = "Star Map (a crystal on her necklace)"; qty = 1 }
  [ordered]@{ id = (SrdItem "Shield"); qty = 1 }; [ordered]@{ id = (SrdItem "Hide Armor"); qty = 1 }; [ordered]@{ id = (SrdItem "Rapier"); qty = 1 }
  [ordered]@{ id = (SrdItem "Backpack"); qty = 1 }; [ordered]@{ id = (SrdItem "Torch"); qty = 10 }; [ordered]@{ id = (SrdItem "Clothes, Traveler's"); qty = 1 }
  [ordered]@{ id = (SrdItem "Navigator's Tools"); qty = 1 }; [ordered]@{ id = (SrdItem "Rope"); qty = 1 }; [ordered]@{ id = (SrdItem "Tinderbox"); qty = 1 }
  [ordered]@{ id = (SrdItem "Waterskin"); qty = 2 }; [ordered]@{ id = (SrdItem "Signal Whistle"); qty = 1 }; [ordered]@{ id = (SrdItem "Oil"); qty = 2 }
  [ordered]@{ id = (SrdItem "Pouch"); qty = 1 }; [ordered]@{ id = (SrdItem "Fishing Tackle"); qty = 1 }; [ordered]@{ id = (SrdItem "Rations"); qty = 10 }
  [ordered]@{ text = "A trinket"; qty = 1 }
)
$x.purse = [ordered]@{ cp = 5; sp = 2; ep = 0; gp = 11; pp = 0 }
$x.persona = 'Traits: seeks out the best place to view the stars (the crow''s nest, the rigging). Collects small, beautiful things that catch her eye: shells, sea glass, anything glittery that reminds her of the stars.' + "`n" + 'Ideals: Wonder (the stars are beautiful and unreachable; she''d rather look up in awe than pretend to be world-wise). Perspective (the stars are proof there''s good and beauty in the world, shining brighter in the dark).' + "`n" + 'Bond: her mother Nezia, the family head. They love snacks and chess together.' + "`n" + 'Flaw: when the stars are out, they have her attention, whatever she was supposed to be doing (sometimes even while trancing).'
$x.looks = 'Drow, 100 years old, 5''8". Charcoal-gray skin, pale violet eyes, long white hair worn loose with small braids and shells braided in. Flowing layered clothes in shades of blue, hide armor over them, sturdy boots, a leather belt and pouch. Her star map hangs on a simple necklace: an oblong crystal engraved with stars.'
$x.notes = 'Grew up in the Underdark; mother Nezia (family head), father Aki (a wizard), two older sisters and a younger brother. Fell in love with the stars the first time she left the caves; the family moved nearer the surface when she was 40, and at 60 she began studying the stars in libraries of manors, castles and study halls. She''s seen the stars from peaks, trees and towers, and has come to the sea for an uninterrupted sky. Wild Shape forms, beast stat blocks and full text: see her sheet (Files).'
if ($Players) { Attach $x "fl_xuna" (Join-Path $Players 'Xuna Kor''larym sheet.pdf') }

# --- Rin Amakiir (Elisabeth), from her hand-written sheet (photos in Players, 2026-10-09) ----------
# Played as written (Joseph, 2026-10-09): her sheet uses the 2014 Ranger, Wood Elf and Outlander features.
function AttachPhotos($pc, $prefix, $paths) {
  $pc.files = @(); $k = 0
  foreach ($path in $paths) {
    if (-not (Test-Path $path)) { continue }
    $k++; $id = "$prefix$k"; $bytes = [IO.File]::ReadAllBytes($path)
    $doc.files[$id] = [ordered]@{ type = "image/jpeg"; data = [Convert]::ToBase64String($bytes) }
    $pc.files += [ordered]@{ id = $id; name = (Split-Path $path -Leaf); size = $bytes.Length; at = "2026-10-09" }
  }
}
$r = $doc.roster[1]
$r.name = "Rin Amakiir"; $r.player = "Elisabeth"; $r.role = "Medic"     # the crew's medic (Joseph, 2026-10-09)
$r.align = "Chaotic Good"; $r.species = "Elf (Wood)"; $r.cls = "Ranger"; $r.subcls = "Hunter"; $r.bg = "Outlander"
$r.level = 3; $r.xp = 900; $r.ac = "13"; $r.hp = "27"; $r.hpMax = "27"; $r.speed = 35; $r.init = "+2"; $r.pp = "14"; $r.dc = "12"; $r.satk = "+4"
$r.str = 13; $r.dex = 14; $r.con = 12; $r.int = 13; $r.wis = 15; $r.cha = 10
$r.saves = "Str +3, Dex +4 (proficient)"
$r.skills = "Proficient: Athletics +3, Insight +4, Nature +3, Perception +4, Stealth +4, Survival +4. Instrument: Lute. Weapons: simple and martial (longsword, shortsword, shortbow, longbow)"
$r.senses = "Darkvision 60 ft."
$r.langs = "Common, Elvish, Draconic"
$r.defenses = "Advantage on saving throws against being Charmed; magic can't put her to sleep (Fey Ancestry)"
$r.attacks = @(
  [ordered]@{ name = "Longbow"; hit = "+6"; dmg = "1d8+2"; dtype = "piercing" }
  [ordered]@{ name = "Dagger"; hit = "+4"; dmg = "1d4+2"; dtype = "piercing" }
  [ordered]@{ name = "Hail of Thorns (bonus action, after a ranged hit)"; hit = "DEX 12"; dmg = "1d10"; dtype = "piercing" }
)
$r.slots = @(0..9 | ForEach-Object { [ordered]@{ max = $(if ($_ -eq 1) { 3 } else { 0 }); used = 0 } })
$r.res = @(
  [ordered]@{ id = "rs_rhd"; name = "Hit Dice (d10)"; max = 3; used = 0; rest = "long" }
)
$r.spells = @("Cure Wounds", "Alarm" | ForEach-Object { SrdSpell $_ })
$r.inv = @(
  [ordered]@{ id = (SrdItem "Longbow"); qty = 1 }; [ordered]@{ id = (SrdItem "Arrows (20)"); qty = 1 }; [ordered]@{ id = (SrdItem "Dagger"); qty = 2 }
  [ordered]@{ id = (SrdItem "Dungeoneer's Pack"); qty = 1 }; [ordered]@{ text = "Pitons, hammer, crowbar and 50 ft of rope (from the pack)"; qty = 1 }
  [ordered]@{ id = (SrdItem "Leather Armor"); qty = 1 }; [ordered]@{ text = "Staff"; qty = 1 }; [ordered]@{ id = (SrdItem "Hunting Trap"); qty = 1 }
  [ordered]@{ id = (SrdItem "Clothes, Traveler's"); qty = 1 }; [ordered]@{ text = "Hunting trophy"; qty = 1 }
  [ordered]@{ text = "Black pirate flag with a dragon and bones"; qty = 1 }
)
$r.purse = [ordered]@{ cp = 0; sp = 0; ep = 0; gp = 10; pp = 0 }   # Joseph: 10 gp (her Outlander starting pouch); the 5 cp, 3 sp, 133 gp on her sheet were from another campaign
$r.persona = "Traits: unsmiling, no humor (like HoH). She can sit comfortably in silence for hours." + "`n" + "Ideal: nature over civilization." + "`n" + "Bond: I must keep my family safe and happy." + "`n" + "Flaw: I have to do things by myself before I'll accept help."
$r.looks = "Wood elf, 70 years old, 5'4"", 110 lb. Copper skin, blue eyes, white hair in a short, messy pixie cut."
$r.notes = @(
  "Close to her older brother, Adran (72)."
  ""
  "From her sheet. These are the 2014 versions, and she plays them as written (Joseph's call, 2026-10-09):"
  "- Favored Enemy: monstrosities. Advantage on Wisdom (Survival) checks to track them and on Intelligence checks to recall information about them; learned Draconic."
  "- Natural Explorer: forest. Proficiency doubled on Int or Wis checks about forest that use a proficient skill; an hour or more of forest travel: difficult terrain doesn't slow the group, the group can't get lost except by magic, alert to danger while foraging, navigating or tracking, stealthy at a normal pace alone, twice the food when foraging, and tracking tells exact number, sizes and how long ago."
  "- Archery fighting style: +2 to attack rolls with ranged weapons."
  "- Primeval Awareness: an action and a ranger spell slot: for 1 minute per slot level, senses whether aberrations, celestials, dragons, elementals, fey, fiends or undead are within 1 mile (6 miles in forest). Not where or how many."
  "- Colossus Slayer: once per turn, a weapon hit on a creature below its hit point maximum deals an extra 1d8."
  "- Mask of the Wild: can try to hide when only lightly obscured by foliage, heavy rain, falling snow, mist and other natural phenomena."
  "- Wanderer (Outlander): excellent memory for maps and geography; finds food and fresh water each day for herself and up to five others where the land offers it."
  "- Hail of Thorns (1st-level spell, not in the free rules): bonus action right after hitting with a ranged weapon; the target and each creature within 5 feet make a Dexterity save, 1d10 piercing on a fail or half on a success, +1d10 per slot level above 1."
  ""
  "Her sheet in full: Files (five photos)."
) -join "`n"
if ($Players) { AttachPhotos $r "fl_rin" @(1..5 | ForEach-Object { Join-Path $Players "Rin Amakiir sheet $_ of 5.jpg" }) }

# --- Ander (Benjamin), master-at-arms, from his hand-written sheet (screenshots in Players, 2026-10-09) ----------
# Played as written (Joseph, 2026-10-09): his sheet's sorcerer features are the 2014 Draconic Bloodline text.
$a = $doc.roster[2]
$a.name = "Ander"; $a.player = "Benjamin"; $a.role = "Master-at-arms"
$a.align = ""; $a.species = "Human"; $a.cls = "Sorcerer"; $a.subcls = "Draconic"; $a.bg = "Soldier"
$a.level = 3; $a.xp = 900; $a.ac = "14"; $a.hp = "23"; $a.hpMax = "23"; $a.speed = 30; $a.init = "+1"; $a.pp = "12"; $a.dc = "13"; $a.satk = "+5"
$a.str = 11; $a.dex = 13; $a.con = 13; $a.int = 13; $a.wis = 15; $a.cha = 16
$a.saves = "Con +3, Cha +5 (proficient)"
$a.skills = "Proficient: Arcana +3, Athletics +2, Deception +5, Intimidation +5. Tools: one gaming set (playing cards), land vehicles. Weapons: daggers, darts, slings, quarterstaffs, light crossbows"
$a.senses = ""
$a.langs = "Common, Elvish, Draconic"
$a.defenses = ""
$a.attacks = @(
  [ordered]@{ name = "Fire Bolt"; hit = "+5"; dmg = "1d10"; dtype = "fire" }
  [ordered]@{ name = "Light crossbow"; hit = "+3"; dmg = "1d8+1"; dtype = "piercing" }
  [ordered]@{ name = "Dagger"; hit = "+3"; dmg = "1d4+1"; dtype = "piercing" }
  [ordered]@{ name = "Burning Hands (15 ft cone)"; hit = "DEX 13"; dmg = "3d6"; dtype = "fire" }
  [ordered]@{ name = "Thunderwave (15 ft cube)"; hit = "CON 13"; dmg = "2d8"; dtype = "thunder" }
  [ordered]@{ name = "Acid Splash"; hit = "DEX 13"; dmg = "1d6"; dtype = "acid" }
)
$a.slots = @(0..9 | ForEach-Object { [ordered]@{ max = $(if ($_ -eq 1) { 4 } elseif ($_ -eq 2) { 2 } else { 0 }); used = 0 } })
$a.res = @(
  [ordered]@{ id = "rs_ahd"; name = "Hit Dice (d6)"; max = 3; used = 0; rest = "long" }
)
$a.spells = @("Fire Bolt", "Acid Splash", "Mage Hand", "Burning Hands", "Charm Person", "Detect Magic", "Thunderwave" | ForEach-Object { SrdSpell $_ })
$a.inv = @(
  [ordered]@{ id = (SrdItem "Dagger"); qty = 2 }; [ordered]@{ text = "Arcane focus (staff)"; qty = 1 }
  [ordered]@{ id = (SrdItem "Light Crossbow"); qty = 1 }; [ordered]@{ id = (SrdItem "Bolts (20)"); qty = 1 }
  [ordered]@{ id = (SrdItem "Dungeoneer's Pack"); qty = 1 }; [ordered]@{ text = "Crowbar, hammer, 10 pitons and 50 ft of rope (from the pack)"; qty = 1 }
  [ordered]@{ text = "Rank insignia"; qty = 1 }; [ordered]@{ id = (SrdItem "Gaming Set, Playing Cards"); qty = 1 }
  [ordered]@{ text = "Piece of a banner (an enemy trophy)"; qty = 1 }; [ordered]@{ id = (SrdItem "Clothes, Common"); qty = 1 }
)
$a.purse = [ordered]@{ cp = 0; sp = 0; ep = 0; gp = 10; pp = 0 }   # the 2014 Soldier starting pouch (his kit is the default one); the 151 gp on his sheet was from another campaign
$a.persona = "Traits: he's studied every battle from the last 100 years." + "`n" + "Ideals: independence; might." + "`n" + "Bond: my former commander is an enemy to be avoided at all costs." + "`n" + "Flaw: if someone disagrees with me, I'll prove them wrong at all costs."
$a.looks = "Human, 18 years old, 6'0"", 180 lb. White skin, black eyes, brown hair."
$a.notes = @(
  "Backstory, from his sheet: trained from age 12. A month ago he got in trouble and ran away; he never talks about what happened, but it has to do with his commander. From the Princedom, where he was a special teams captain (spying, scouting, secret guards, escorting officials, assassination). The Prince of War sent his team on a suicide mission; only Ander survived and succeeded, and he realized the Prince didn't care about the deaths: he's corrupt and power-hungry. Ander volunteered for a mission and left for Doredia so he couldn't be tracked down. Recently left and joined a traveling performing troupe (card tricks) to lay low and make money. Starting to think about revenge, justice and protecting people. Symbol of his old division: a black dagger (an eye)."
  ""
  "Allies and organizations: a traveling performing troupe (card tricks)."
  ""
  "From his sheet. These are the 2014 versions, and he plays them as written (Joseph's call, 2026-10-09):"
  "- Draconic Resilience: hit point maximum +1 per sorcerer level; parts of his skin are covered in a thin sheen of dragon-like scales; with no armor, AC = 13 + Dexterity modifier."
  "- Draconic Affinity (as his sheet words it): proficiency bonus doubled on Charisma checks when interacting with dragons, if it applies."
  "- Blade Ward (cantrip, not in the free rules): action; until the end of his next turn, resistance to bludgeoning, piercing and slashing damage from weapon attacks."
  "- His two 2nd-level slots are for upcasting his 1st-level spells (no 2nd-level spells of his own)."
  ""
  "His sheet in full: Files (four pages)."
) -join "`n"
if ($Players) { AttachPhotos $a "fl_ander" @(1..4 | ForEach-Object { Join-Path $Players "Ander sheet $_ of 4.jpg" }) }
# --- Ethal Vaelor (Hannah), from her filled-in sheet (Players\Ethal Vaelor sheet (Hannah).pdf, 2026-10-09) ------
# A 2014-rules sheet like Rin's and Ander's: her features are written as her sheet has them. Her crew role is
# the quartermaster. Her sheet was checked against the rules with Joseph and corrected (2026-10-09).
$e = $doc.roster[3]
$e.name = "Ethal Vaelor"; $e.player = "Hannah"; $e.role = "Quartermaster"     # the crew's quartermaster (Joseph, 2026-10-09)
$e.align = ""; $e.species = "Elf (High)"; $e.cls = "Rogue"; $e.subcls = "Assassin"; $e.bg = "Criminal"
$e.level = 3; $e.xp = 900; $e.ac = "14"; $e.hp = "27"; $e.hpMax = "27"; $e.speed = 30; $e.init = "+3"; $e.pp = "13"; $e.dc = "10"; $e.satk = "+2"
$e.str = 10; $e.dex = 16; $e.con = 14; $e.int = 11; $e.wis = 12; $e.cha = 10
$e.saves = "Dex +5, Int +2 (proficient)"
$e.skills = "Proficient: Acrobatics +5, Deception +2, Insight +3, Perception +3, Persuasion +2. Expertise: Sleight of Hand +7, Stealth +7. Tools: thieves' tools, disguise kit, poisoner's kit, one gaming set (dragonchess). Armor: light. Weapons: simple weapons, hand crossbows, rapiers, longswords, shortswords, shortbows, longbows"
$e.senses = "Darkvision 60 ft. (elf; not written on her sheet)"
$e.langs = "Common, Elvish, Sylvan, Thieves' Cant"
$e.defenses = "Advantage on saving throws against being Charmed; magic can't put her to sleep (Fey Ancestry)"
$e.attacks = @(
  [ordered]@{ name = "Shortsword"; hit = "+5"; dmg = "1d6+3"; dtype = "piercing" }
  [ordered]@{ name = "Shortbow (80/320)"; hit = "+5"; dmg = "1d6+3"; dtype = "piercing" }
  [ordered]@{ name = "Dagger (thrown 20/60)"; hit = "+5"; dmg = "1d4+3"; dtype = "piercing" }
  [ordered]@{ name = "Sneak Attack (once a turn, on top of a hit)"; hit = ""; dmg = "2d6"; dtype = "" }
)
$e.slots = @(0..9 | ForEach-Object { [ordered]@{ max = 0; used = 0 } })
$e.res = @(
  [ordered]@{ id = "rs_ehd"; name = "Hit Dice (d8)"; max = 3; used = 0; rest = "long" }
)
$e.spells = @("Minor Illusion" | ForEach-Object { SrdSpell $_ })
$e.inv = @(
  [ordered]@{ id = (SrdItem "Shortsword"); qty = 1 }; [ordered]@{ id = (SrdItem "Shortbow"); qty = 1 }; [ordered]@{ id = (SrdItem "Arrows (20)"); qty = 1 }
  [ordered]@{ id = (SrdItem "Dagger"); qty = 2 }; [ordered]@{ id = (SrdItem "Leather Armor"); qty = 1 }
  [ordered]@{ id = (SrdItem "Thieves' tools"); qty = 1 }; [ordered]@{ id = (SrdItem "Disguise Kit"); qty = 1 }; [ordered]@{ id = (SrdItem "Poisoner's Kit"); qty = 1 }
  [ordered]@{ id = (SrdItem "Burglar's Pack"); qty = 1 }
  [ordered]@{ text = "From the pack: 1,000 ball bearings, a bell, 10 ft of string, 5 candles, a crowbar, a hammer, 10 pitons, a hooded lantern, 2 flasks of oil, 5 days of rations, a tinderbox, a waterskin, 50 ft of rope"; qty = 1 }
  [ordered]@{ id = (SrdItem "Crowbar"); qty = 1 }; [ordered]@{ id = (SrdItem "Gaming Set, Dragonchess"); qty = 1 }
  [ordered]@{ id = (SrdItem "Clothes, Common"); qty = 1 }; [ordered]@{ text = "Dark common clothes with a hood"; qty = 1 }
  [ordered]@{ text = "A set of bone pipes (trinket)"; qty = 1 }
  [ordered]@{ text = "The ship's purse: 25 gp, 33 sp, 65 cp (the Sallowmay's money, handed over in Session 1; not hers). DM only: the coins come from three countries, only one of which still exists (Investigation or History DC 15)."; qty = 1 }
)
$e.purse = [ordered]@{ cp = 0; sp = 0; ep = 0; gp = 15; pp = 0 }   # 15 gp (Joseph, 2026-10-09); now on her sheet too
$e.persona = "Trait: I won't trust someone until I get to know them really well. She's learning to make weapons and really cares for her own." + "`n" + "Ideal: Integrity - always keeping her word." + "`n" + "Bond: Sunny, a fennec fox who was rummaging for garbage in town; she took care of him." + "`n" + "Flaw: When I see something, I can only think about planning how to take it."
$e.looks = "High elf, 80 years old, 5'2"". Blue eyes, white skin, black hair. Dark common clothes with a hood. Her name is said ""Eeth-le Vay-lore."""
$e.notes = @(
  "She steals to survive, and it's become a habit. She's joining the crew to run away from her past and all the people who are after her."
  "Sunny, her fennec fox, isn't in the SRD; if he comes along, pick a stand-in stat block or keep him as story only."
  ""
  "From her sheet. These are the 2014 versions, played as written:"
  "- Expertise: Stealth and Sleight of Hand (proficiency bonus doubled: +7 each)."
  "- Sneak Attack: 2d6, once per turn, to one creature hit with a finesse or ranged weapon, if she had advantage or another enemy of the target is within 5 feet of it (and she doesn't have disadvantage)."
  "- Cunning Action: a bonus action each turn to Dash, Disengage or Hide."
  "- Assassinate: advantage on attack rolls against any creature that hasn't taken a turn in the fight yet; any hit on a surprised creature is a critical hit."
  "- Assassin bonus proficiencies: disguise kit and poisoner's kit. Thieves' Cant."
  "- High elf: Keen Senses (Perception), Fey Ancestry, one extra language (Sylvan), one wizard cantrip (Minor Illusion, Int; spell save DC 10)."
  "- Criminal Contact (Criminal background): a reliable contact who acts as her liaison to a network of other criminals."
  ""
  "Settled with Hannah (Joseph, 2026-10-09): Sneak Attack is 2d6 at level 3; her rogue skills are Insight, Sleight of Hand, Acrobatics and Persuasion; Expertise in Stealth and Sleight of Hand; she rolled her hit points (27); 15 gp. Her sheet and quick reference were corrected to match."
  ""
  "Her sheet and her quick reference in full: Files."
) -join "`n"
if ($Players) {
  $sheet = Join-Path $Players "Ethal Vaelor sheet (Hannah).pdf"; $quick = Join-Path $Players "Ethal Vaelor quick reference (Hannah).pdf"
  if (Test-Path $sheet) { Attach $e "fl_ethal_b" $sheet }   # new ids for the corrected PDFs (2026-10-09), so the app takes the new files
  if (Test-Path $quick) { $bytes = [IO.File]::ReadAllBytes($quick); $doc.files["fl_ethal_qr_b"] = [ordered]@{ type = "application/pdf"; data = [Convert]::ToBase64String($bytes) }
    $e.files = @($e.files) + @([ordered]@{ id = "fl_ethal_qr_b"; name = (Split-Path $quick -Leaf); size = $bytes.Length; at = "2026-10-09" }) }
}

# --- the players' screen -------------------------------------------------------------------
# The pictures, each shrunk to 1920 px wide so the map file stays small, ready to show on the TV.
$doc.pictures = @()
foreach ($pic in @(
  ,@("pic_city", "Kalatecha (the city picture)", "Kalatecha city picture.jpg")
  ,@("pic_hire", "The Sallowmay: hiring the crew (Session 1, Scene 1)", "The Sallowmay - hiring the crew.jpg")   # Joseph, 2026-10-09
)) {
  $picPath = Join-Path $Campaign "Pictures\$($pic[2])"
  if (-not (Test-Path $picPath)) { continue }
  Add-Type -AssemblyName System.Drawing
  $img = [System.Drawing.Image]::FromFile($picPath)
  $w = [Math]::Min(1920, $img.Width); $h = [int][Math]::Round($img.Height * $w / $img.Width)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $gr = [System.Drawing.Graphics]::FromImage($bmp); $gr.InterpolationMode = "HighQualityBicubic"; $gr.DrawImage($img, 0, 0, $w, $h); $gr.Dispose(); $img.Dispose()
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq "image/jpeg"
  $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 85L
  $ms = New-Object IO.MemoryStream; $bmp.Save($ms, $enc, $ep); $bmp.Dispose()
  $doc.files[$pic[0]] = [ordered]@{ type = "image/jpeg"; data = [Convert]::ToBase64String($ms.ToArray()) }
  $doc.pictures += [ordered]@{ id = $pic[0]; name = $pic[1] }
}
# Kept off the players' screen until they find them (the DM un-hides each one in its DM panel):
# the island and its graveyard, the reef, and the ambush spot in town.
foreach ($n in $doc.nodes) { if ($n.id -eq "klantern") { $n.hidden = $true } }
foreach ($s in $doc.shapes) { if ($s.id -in @("creef", "crock")) { $s.hidden = $true } }
foreach ($n in $plan.nodes) { if ($n.id -eq "pambush") { $n.hidden = $true } }

# Xuna's beasts, exactly as her character sheet prints them (not the SRD versions). The six land
# animals are her Wild Shape forms; the owl, bat and octopus travel with her as companions.
function SheetBeast($id, $name, $size, $cr, $xp, $ac, $hp, $speed, $ab, $sav, $skills, $sen, $init, $traits, $attacks) {
  [ordered]@{ id = $id; name = $name; size = $size; type = "Beast"; cr = $cr; xp = $xp; ac = "$ac"; hp = $hp; speed = $speed
    str = $ab[0]; dex = $ab[1]; con = $ab[2]; int = $ab[3]; wis = $ab[4]; cha = $ab[5]; sav = $sav; sen = $sen; init = $init
    traits = $traits; attacks = $attacks; boss = $false; talk = $false
    notes = "From Xuna Kor'larym's character sheet." + $(if ($skills) { " Skills: $skills." } else { "" }) }
}
$beasts = @(
  (SheetBeast "lf_xconstrictor" "Constrictor Snake" "Large" 0.25 50 13 "13 (2d10 + 2)" "30 ft., swim 30 ft." @(15,14,12,1,10,3) "Str +2, Dex +2, Con +1, Int -5, Wis +0, Cha -4" "Perception +2, Stealth +4" "Blindsight 10 ft., Passive Perception 12" "" "" ("Bite. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: (1d8 + 2) Piercing damage.`n`nConstrict. Strength Saving Throw: DC 12, one Medium or smaller creature the snake can see within 5 feet. Failure: 7 (3d4) Bludgeoning damage, and the target has the Grappled condition (escape DC 12)."))
  (SheetBeast "lf_xvenom" "Giant Venomous Snake" "Medium" 0.25 50 14 "11 (2d8 + 2)" "40 ft., swim 40 ft." @(10,18,13,2,10,3) "Str +0, Dex +4, Con +1, Int -4, Wis +0, Cha -4" "Perception +2" "Blindsight 10 ft., Passive Perception 12" "+4" "" "Bite. Melee Weapon Attack: +6 to hit, reach 10 ft., one target. Hit: (1d4 + 4) Piercing damage plus (1d8) Poison damage.")
  (SheetBeast "lf_xpanther" "Panther" "Medium" 0.25 50 12 "13 (3d8)" "50 ft., climb 40 ft." @(14,15,10,3,14,7) "Str +2, Dex +2, Con +0, Int -4, Wis +2, Cha -2" "Perception +4, Stealth +6" "Darkvision 60 ft., Passive Perception 14" "" "" ("Multiattack. The panther makes one Pounce attack and uses Prowl.`n`nPounce (No Advantage). Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: (1d4 + 2) Slashing damage.`n`nPounce (Has Advantage). Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: (2d4 + 2) Slashing damage.`n`nProwl. The panther moves up to half its Speed without provoking Opportunity Attacks. At the end of this movement, the panther can take the Hide action."))
  (SheetBeast "lf_xhorse" "Riding Horse" "Large" 0.25 50 11 "13 (2d10 + 2)" "60 ft." @(16,13,12,2,11,7) "Str +3, Dex +1, Con +1, Int -4, Wis +0, Cha -2" "" "Passive Perception 10" "" "" "Hooves. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: (1d8 + 3) Bludgeoning damage.")
  (SheetBeast "lf_xwolf" "Wolf" "Medium" 0.25 50 12 "11 (2d8 + 2)" "40 ft." @(14,15,12,3,12,6) "Str +2, Dex +2, Con +1, Int -4, Wis +1, Cha -2" "Perception +5, Stealth +4" "Darkvision 60 ft., Passive Perception 15" "" "Pack Tactics. The wolf has Advantage on attack rolls against a creature if at least one of the wolf's allies is within 5 feet of the creature and the ally doesn't have the Incapacitated condition." "Bite. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: (1d6 + 2) Piercing damage. The target has the Prone condition if it is Medium or smaller.")
  (SheetBeast "lf_xspider" "Giant Wolf Spider" "Medium" 0.25 50 13 "11 (2d8 + 2)" "40 ft., climb 40 ft." @(12,16,13,3,12,4) "Str +1, Dex +3, Con +1, Int -4, Wis +1, Cha -3" "Perception +3, Stealth +7" "Blindsight 10 ft., Darkvision 60 ft., Passive Perception 13" "+3" "Spider Climb. The spider can climb difficult surfaces, including along ceilings, without needing to make an ability check." "Bite. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: (1d4 + 3) Piercing damage plus (2d4) Poison damage.")
  (SheetBeast "lf_xowl" "Owl" "Tiny" 0 10 11 "1 (1d4 - 1)" "5 ft., fly 60 ft." @(3,13,8,2,12,7) "Str -4, Dex +1, Con -1, Int -4, Wis +1, Cha -2" "Perception +5, Stealth +5" "Darkvision 120 ft., Passive Perception 15" "" "Flyby. The owl doesn't provoke Opportunity Attacks when it flies out of an enemy's reach." "")
  (SheetBeast "lf_xbat" "Bat" "Tiny" 0 10 12 "1 (1d4 - 1)" "5 ft., fly 30 ft." @(2,15,8,2,12,4) "Str -4, Dex +2, Con -1, Int -4, Wis +1, Cha -3" "" "Blindsight 60 ft., Passive Perception 11" "" "" "")
  (SheetBeast "lf_xoctopus" "Octopus" "Small" 0 10 12 "3 (1d6)" "5 ft., swim 30 ft." @(4,15,11,3,10,4) "Str -3, Dex +2, Con +0, Int -4, Wis +0, Cha -3" "Perception +2, Stealth +6" "Darkvision 30 ft., Passive Perception 12" "" ("Compression. The octopus can move through a space as narrow as 1 inch without spending extra movement to do so.`n`nWater Breathing. The octopus can breathe only underwater.") "Reaction: Ink Cloud (1/Day). Trigger: A creature ends its turn within 5 feet of the octopus while underwater. Response: The octopus releases ink that fills a 5-foot Cube centered on itself, and the octopus moves up to its Swim Speed. The Cube is Heavily Obscured for 1 minute or until a strong current or similar effect disperses the ink.")
)
$library.foes += $beasts
$x.forms = @("lf_xconstrictor", "lf_xvenom", "lf_xpanther", "lf_xhorse", "lf_xwolf", "lf_xspider")
# the companions: people in the library who fight with the beast's sheet, each bonded to Xuna as a familiar
$doc.companions = @()
foreach ($pair in @(@("ln_xowl", "lf_xowl"), @("ln_xbat", "lf_xbat"), @("ln_xoctopus", "lf_xoctopus"))) {
  $b = $beasts | Where-Object id -eq $pair[1]
  $pp = [regex]::Match($b.sen, 'Passive Perception (\d+)').Groups[1].Value
  $hpMax = [regex]::Match($b.hp, '^\d+').Value
  $library.npcs += [ordered]@{ id = $pair[0]; name = $b.name; role = "$($b.size) Beast"; align = "Unaligned"; where = "With Xuna Kor'larym"; look = ""; voice = ""; wants = ""; knows = ""
    fightsAs = $pair[1]; ac = $b.ac; hpMax = $hpMax; hp = $hpMax; speed = $b.speed; init = $b.init; pp = $pp; saves = $b.sav
    senses = ($b.sen -replace ',?\s*Passive Perception \d+', '').Trim(); skills = $(if ($b.notes -match 'Skills: (.+)\.$') { $Matches[1] } else { "" })
    str = "$($b.str)"; dex = "$($b.dex)"; con = "$($b.con)"; int = "$($b.int)"; wis = "$($b.wis)"; cha = "$($b.cha)"
    bond = [ordered]@{ to = "pc1"; kind = "Familiar"; turn = "own" }
    notes = "One of Xuna's companions, from her character sheet. Fights with the $($b.name) stat block in the Library." }
}
# Joseph, 2026-10-08: the animals stay in the Library, out of the party for now. To bring one
# along, use "Bring into the party as a companion" on their Library page (the bond to Xuna is kept).
$doc.companions = @()

# --- the campaign's documents, which live in the app (root.docs) -------------------------------
# Each starts as my version in Tools\docs (docs.json lists them). If a survey.json downloaded from
# the app is in Saves, the newest one is read: a document edited in the app after my version keeps
# the app's version, my newer version keeps the parts already ticked off, and any document made in
# the app comes along too.
$docDir = Join-Path $PSScriptRoot "docs"
$docs = New-Object System.Collections.ArrayList
foreach ($m in ([IO.File]::ReadAllText((Join-Path $docDir "docs.json"), [Text.Encoding]::UTF8) | ConvertFrom-Json)) {
  $md = [IO.File]::ReadAllText((Join-Path $docDir $m.file), [Text.Encoding]::UTF8) -replace "`r`n", "`n"
  [void]$docs.Add([ordered]@{ id = $m.id; kind = $m.kind; title = $m.title; date = $m.date; md = $md; done = [ordered]@{}; updated = $m.updated })
}
$latest = if ($Absorb -and (Test-Path (Join-Path $Saves $Absorb))) { Get-Item (Join-Path $Saves $Absorb) } else { $null }   # the one save whose in-app work is part of the map
if ($latest) {
  $saved = [IO.File]::ReadAllText($latest.FullName, [Text.Encoding]::UTF8) | ConvertFrom-Json
  $kept = 0
  foreach ($sd in @($saved.docs)) {
    if (-not $sd -or -not $sd.id) { continue }
    $mine = $null; foreach ($d in $docs) { if ($d.id -eq $sd.id) { $mine = $d } }
    if (-not $mine) { [void]$docs.Add($sd); $kept++; continue }
    if ([string]$sd.updated -gt [string]$mine.updated) { $docs[$docs.IndexOf($mine)] = $sd; $kept++ }
    elseif ($sd.done) { $mine.done = $sd.done }
  }
  "documents: $kept kept from $($latest.Name)"
  # ships sail: each keeps the spot it was last moved to in the app, on the sea chart and in town
  $script:moved = 0
  function KeepShips($mine, $theirs) {
    foreach ($n in @($mine)) {
      if ($n.kind -ne "ship" -and $n.kind -ne "boat") { continue }
      $s = @($theirs) | Where-Object { $_.id -eq $n.id } | Select-Object -First 1
      if ($s -and $null -ne $s.x -and ($s.x -ne $n.x -or $s.y -ne $n.y)) { $n.x = $s.x; $n.y = $s.y; $script:moved++ }
    }
  }
  # places, roads and shapes Joseph added in the app (any id the builder doesn't make) come along, so a rebuild keeps them.
  # Skipped: ids listed in $dropped (doubles from a stuck click), and empty plans (a plan started but with nothing in it).
  $dropped = @("ns6jntf", "ns7bt8k")   # 2026-10-10: a second waystation on the same spot, a second lighthouse a mile from the first
  $retired = @("kgrave")               # 2026-10-10: the Ship Graveyard moved inside Lantern Rock's plan, so the sea-chart marker is gone
  $movedInside = @("klantern")         # ...and Lantern Rock's fight, items and hiding moved to the places inside it
  $added = 0
  foreach ($n in @($saved.nodes)) { if ($n -and $n.id -and $n.id -notin $dropped -and $n.id -notin $retired -and -not ($doc.nodes | Where-Object id -eq $n.id)) { $doc.nodes += $n; $added++ } }
  foreach ($r in @($saved.roads)) { if ($r -and $r.id -and $r.from -notin $dropped -and $r.to -notin $dropped -and -not ($doc.roads | Where-Object id -eq $r.id)) { $doc.roads += $r; $added++ } }
  foreach ($s in @($saved.shapes)) { if ($s -and $s.id -and -not ($doc.shapes | Where-Object id -eq $s.id)) { $doc.shapes += $s; $added++ } }
  foreach ($k in @($doc.plans.Keys)) { if ($saved.plans.$k) {
    foreach ($n in @($saved.plans.$k.nodes)) { if ($n -and $n.id -and -not ($doc.plans[$k].nodes | Where-Object id -eq $n.id)) { $doc.plans[$k].nodes += $n; $added++ } }
    foreach ($s in @($saved.plans.$k.shapes)) { if ($s -and $s.id -and -not ($doc.plans[$k].shapes | Where-Object id -eq $s.id)) { $doc.plans[$k].shapes += $s; $added++ } } } }
  if ($saved.plans) { foreach ($k in @($saved.plans.PSObject.Properties.Name)) { if (-not $doc.plans.Contains($k) -and @($saved.plans.$k.nodes).Count -gt 0) { $doc.plans[$k] = $saved.plans.$k; $added++ } } }
  "places, roads and shapes added in the app: $added kept"
  # library entries made in the app (the Statuette of Healing, people rolled at the table): kept, so a fresh load still has them
  $libAdded = 0
  foreach ($cat in @("loot", "npcs", "foes")) { foreach ($x in @($saved.library.$cat)) { if ($x -and $x.id -and -not (@($doc.library[$cat]) | Where-Object id -eq $x.id)) { $doc.library[$cat] = @($doc.library[$cat]) + @($x); $libAdded++ } } }
  "library entries added in the app: $libAdded kept"
  KeepShips $doc.nodes $saved.nodes
  foreach ($k in @($doc.plans.Keys)) { if ($saved.plans -and $saved.plans.$k) { KeepShips $doc.plans[$k].nodes $saved.plans.$k.nodes } }
  "ships: $($script:moved) where they were left in $($latest.Name)"
  # what's hidden from the players, and the pictures added in the app, as the app last had them
  # (only from a save made since the players' screen existed, so an older save can't un-hide things)
  if ($saved.PSObject.Properties.Name -contains "pictures") {
    function KeepHidden($mine, $theirs) {
      foreach ($o in @($mine)) {
        $s = @($theirs) | Where-Object { $_.id -eq $o.id } | Select-Object -First 1
        if (-not $s) { continue }
        if ($o -is [System.Management.Automation.PSCustomObject]) {
          # places added in the app come in as the app saved them
          if ($s.hidden) { $o | Add-Member -NotePropertyName hidden -NotePropertyValue $true -Force } elseif ($o.PSObject.Properties["hidden"]) { $o.PSObject.Properties.Remove("hidden") }
        } elseif ($s.hidden) { $o.hidden = $true } elseif ($o.Contains("hidden")) { $o.Remove("hidden") }
      }
    }
    KeepHidden $doc.nodes $saved.nodes; KeepHidden $doc.shapes $saved.shapes
    foreach ($k in @($doc.plans.Keys)) { if ($saved.plans.$k) { KeepHidden $doc.plans[$k].nodes $saved.plans.$k.nodes; KeepHidden $doc.plans[$k].shapes $saved.plans.$k.shapes } }
    # battle maps the DM picked or painted in the app (anything not marked as mine) stay theirs
    $script:keptMaps = 0
    function KeepBmaps($mine, $theirs) {
      foreach ($o in @($mine)) {
        $s = @($theirs) | Where-Object { $_.id -eq $o.id } | Select-Object -First 1
        if ($s -and $s.bmap -and $s.bmap.by -ne "builder") { $o.bmap = $s.bmap; $script:keptMaps++ }
      }
    }
    KeepBmaps $doc.nodes $saved.nodes
    foreach ($k in @($doc.plans.Keys)) { if ($saved.plans.$k) { KeepBmaps $doc.plans[$k].nodes $saved.plans.$k.nodes } }
    "battle maps: $($script:keptMaps) of the DM's own kept"
    # the campaign clock, and each place's lighting as the DM left it
    if ($saved.day) { $doc.day = $saved.day }
    if ($saved.timeOfDay) { $doc.timeOfDay = $saved.timeOfDay }
    if ($saved.PSObject.Properties.Name -contains "gridNames") { $doc.gridNames = $saved.gridNames }
    # the inside as the DM left it in the app: lights, doors, locks, and what is in the containers (items, coins, how hidden, what was found)
    function KeepLight($mine, $theirs) {
      foreach ($o in @($mine)) {
        $s = @($theirs) | Where-Object { $_.id -eq $o.id } | Select-Object -First 1
        if (-not $s -or -not $s.site -or $o.id -in $movedInside) { continue }
        foreach ($k in @("lampsOut", "doorsShut", "lights", "light", "coinsAt", "items", "where", "hide", "found", "locks", "lock", "spotNames")) {
          if ($s.site.PSObject.Properties.Name -contains $k) { if (-not $o.site) { $o.site = [ordered]@{ kind = ""; level = 1; once = $true; waves = 1; foes = @(); loot = [ordered]@{}; items = @() } }; $o.site[$k] = $s.site.$k }
        }
      }
    }
    KeepLight $doc.nodes $saved.nodes
    foreach ($k in @($doc.plans.Keys)) { if ($saved.plans.$k) { KeepLight $doc.plans[$k].nodes $saved.plans.$k.nodes } }
    # added after that save, so the save's list doesn't have them yet: the spectacles sit in a gallery case at Moreau Villa (Joseph, 2026-10-09)
    $mv = $plan.nodes | Where-Object id -eq 'pmoreau'
    if (@($mv.site.items) -notcontains 'll_spectacles') { $mv.site.items = @(@('ll_spectacles') + @($mv.site.items)) }
    if (-not $mv.site.Contains('where') -or -not $mv.site.where) { $mv.site.where = [ordered]@{} }
    if ($mv.site.where -is [System.Management.Automation.PSCustomObject]) { $w = [ordered]@{}; foreach ($p in $mv.site.where.PSObject.Properties) { $w[$p.Name] = $p.Value }; $mv.site.where = $w }
    if (-not $mv.site.where.Contains('ll_spectacles')) { $mv.site.where['ll_spectacles'] = "3,1" }
    # "Always dark" now means dark whatever the lamps do; the hold had it only to stay dark by day, which it now is anyway (no windows)
    foreach ($k in @($doc.plans.Keys)) { foreach ($o in @($doc.plans[$k].nodes)) { if ($o.id -eq 'shold' -and $o.site -and $o.site.light -eq 'dark') { $o.site.Remove('light') } } }
    $added = 0
    foreach ($p in @($saved.pictures)) {
      if (-not $p -or ($doc.pictures | Where-Object { $_.id -eq $p.id })) { continue }
      if ($saved.files -and $saved.files.($p.id)) { $doc.files[$p.id] = $saved.files.($p.id); $doc.pictures += $p; $added++ }
    }
    "pictures: $added added in the app kept"
  }
}
$doc.docs = @($docs)

# what this campaign calls its own things, kept in the map rather than the app: the secret favor score is
# the captain's, and the map file the app updates from is this one (Joseph, 2026-10-10)
$doc.favorLabel = "Captain's favor"; $doc.mapFile = "Kalatecha Map.json" 
# retired on Update: the double-click doubles Joseph drew on the main island (the app takes them out too)
$doc.retire = @("ns6jntf", "ns7bt8k", "kgrave")
# the favor scale (Joseph's table rule, 2026-10-10): -15 to +15; on a roll outside battle, when the DM decides it applies,
# 1-5 is +1, 6-10 is +2, 11-15 is +3, and the same as a penalty below zero
$doc.favor = [ordered]@{ min = -15; max = 15; steps = @(, @(1, 5, 1)) + @(, @(6, 10, 2)) + @(, @(11, 15, 3)); note = "Secret. -15 to +15: on a roll outside battle, when you decide it applies, 1-5 is +1, 6-10 is +2, 11-15 is +3 (and the same as a penalty below zero)." }
$doc.builder = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")   # the build stamp the app merges by
# the main island's new towns, cities, waystations and lighthouse (Joseph drew them in the app, 2026-10-10): hidden from the
# players for now, except the first 5 miles of the southern road out of Kalatecha, which they can see leaving town
function SetProp($o, $k, $v) { if ($o -is [System.Management.Automation.PSCustomObject]) { $o | Add-Member -NotePropertyName $k -NotePropertyValue $v -Force } else { $o[$k] = $v } }
$island = @("ns4eb21", "ns4g5g2", "ns5e864", "ns5fh55", "ns5hk16", "ns66e69", "ns6744a", "ns67twb", "ns6pmpg", "ns79dej")
# their names (Joseph asked for names, 2026-10-10; nothing in them yet). A name changed in the app is kept on Update.
$islandNames = [ordered]@{
  ns4eb21 = "Saltmere"        # city, south-east coast, the end of the southern road
  ns4g5g2 = "Dunmarrow"       # city, north
  ns5e864 = "Briarford"       # town, just south of Kalatecha
  ns5fh55 = "Hollin's Rest"   # town on the southern road
  ns5hk16 = "Tallow Cross"    # town where the southern road meets the road north
  ns66e69 = "Greywater"       # town above the Inland Hills
  ns6744a = "Gullhaven"       # town, north-west coast
  ns67twb = "Thornwick"       # town, north coast
  ns6pmpg = "Halfway House"   # waystation where the north-west roads meet
  ns79dej = "Kalatecha Light" # lighthouse at the harbour mouth
}
if ($doc.nodes | Where-Object id -eq "ns4eb21") {        # the main island's places, wherever they came from (a save the app made after them)
  foreach ($n in $doc.nodes) { if ($n.id -in $island) { SetProp $n "hidden" $true }; if ($islandNames.Contains($n.id) -and -not $n.name) { SetProp $n "name" $islandNames[$n.id] } }
  # who holds the island (Joseph, 2026-10-10): the inland country, with Dunmarrow as its port; Kalatecha and Saltmere
  # are free city-states, and each keeps a toll booth on every road out of it, with a hefty toll
  $politics = @{
    ns4eb21 = 'A free city-state, like Kalatecha. The inland country surrounds it on the land side. It keeps a toll booth on the road out of the city (Saltmere Toll).'
    ns4g5g2 = 'The port of the inland country, which holds the island''s interior: every town and road between the free cities. Its country still needs a name. No tolls of its own on these roads.'
  }
  foreach ($n in $doc.nodes) { if ($politics.ContainsKey($n.id) -and -not $n.notes) { SetProp $n "notes" $politics[$n.id] } }
  $tollNote = 'Toll (Joseph''s table rule): 1 gp a head and 5 gp a cart or wagon, each way, plus more on trade goods, at the DM''s call. It''s the free city''s booth, where the road leaves its land for the inland country.'
  $doc.nodes = @($doc.nodes | Where-Object { $_.id -notin @("ktoll_s", "ktoll_n", "ktoll_nw", "stoll_w") })   # the builder's own toll booths, not copies from a save
  $doc.nodes += @(
    (SNode "ktoll_s"  "Southgate Toll"        "toll" 43 90   "r1" ('Kalatecha''s toll booth on the southern road to Saltmere, 10 miles out. ' + $tollNote) @{ hidden = $true })
    (SNode "ktoll_n"  "Northgate Toll"        "toll" 24 (-97) "r1" ('Kalatecha''s toll booth on the road north to Dunmarrow, 10 miles out. ' + $tollNote) @{ hidden = $true })
    (SNode "ktoll_nw" "Gullhaven Road Toll"   "toll" 8 (-100) "r1" ('Kalatecha''s toll booth on the road north-west to Gullhaven, 10 miles out. ' + $tollNote) @{ hidden = $true })
    (SNode "stoll_w"  "Saltmere Toll"         "toll" 576 257 "r1" ('Saltmere''s toll booth on the road west to Kalatecha, 8 miles out. ' + $tollNote) @{ hidden = $true })
  )
  $south = $doc.roads | Where-Object id -eq 'es4ull3'
  if ($south) { SetProp $south "reveal" ([ordered]@{ from = "kcity"; miles = 5 }) }
}
# the Undaunted's own berth at the Merchant Pier (Joseph, 2026-10-10): the pier marker links to her, and what was in the
# marker (her cargo, the Marigold's salvage hidden in the hold) moves aboard her, with the ready-made ship's deck inside
$pu = $plan.nodes | Where-Object id -eq 'pundaunted'; $ku = $doc.nodes | Where-Object id -eq 'kundaunted'
if ($pu.Contains('site') -and $pu.site) { $ku.site = $pu.site; $pu.Remove('site') }
if (-not $ku.Contains('bmap')) { $ku.bmap = [ordered]@{ preset = "ship"; by = "builder" } }
if ($pu.Contains('bmap')) { $pu.Remove('bmap') }
$pu.link = "kundaunted"; $pu.notes = 'The Undaunted''s own berth at the Merchant Pier. When she''s in port, Go aboard takes you onto her; her deckhands loiter here between jobs.'
# the Guild's notice board on the north wall of the Charter House's hall, between the two lamps (Joseph, 2026-10-09).
# Added to whichever version of the room is in the map (Joseph painted his own), only where that square is still floor.
$ch = $plan.nodes | Where-Object id -eq 'pcharter'
if ($ch -and $ch.bmap -and $ch.bmap.rows) {
  $rows = @($ch.bmap.rows)
  if (-not ($rows -join '').Contains('q') -and $rows.Count -gt 1 -and $rows[1].Length -gt 6 -and $rows[1][6] -eq '=') {
    $rows[1] = $rows[1].Substring(0, 6) + 'q' + $rows[1].Substring(7); $ch.bmap.rows = $rows
  }
}
# stone numbers were taken out of the app (2026-10-10): places drawn in the app before then still carry the empty fields
function NoStone($n) { foreach ($k in "stone", "stoneLocked") { if ($n -is [System.Management.Automation.PSCustomObject]) { $n.PSObject.Properties.Remove($k) } elseif ($n.Contains($k)) { $n.Remove($k) } } }
foreach ($n in $doc.nodes) { NoStone $n }
foreach ($k in @($doc.plans.Keys)) { foreach ($n in @($doc.plans[$k].nodes)) { if ($n) { NoStone $n } } }
$doc.Remove("compass")
$json = $doc | ConvertTo-Json -Depth 20
[IO.File]::WriteAllText($Out, $json, (New-Object Text.UTF8Encoding $false))
"wrote $Out"
