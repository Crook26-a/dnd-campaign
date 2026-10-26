# The lighthouse on Lantern Rock as one building on three floors (Joseph, 2026-10-26: "make the lighthouse again with
# stairs and levels"). Lantern Rock's plan gets floors (Ground, Halfway up the tower, The top of the tower); the tower
# base (llight), a new landing (llanding) and the Lantern Room (llamp) stand on one spot, one above the other, joined by
# stair exits on their battle maps (bmap.exits, kind stairs): drag someone onto the stair and they go up or down.
# The wreckers on the stair are split between the base (2) and the landing (2 and the bruiser), as the notes' fight
# was. Writes the newest save; run it again to put the tower back as it is here.
$ErrorActionPreference = "Stop"
$utf8 = New-Object Text.UTF8Encoding $false
$C = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$sf = "$C\Saves\2026-10-15 kalatecha (roads joined, test island).json"
$d = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
$p = $d.plans.klantern
function L($x, $y, $t){ , @([double]$x, [double]$y, $t) }
function Pts([string]$s){ $a = New-Object System.Collections.ArrayList; foreach($q in ($s -split ' ')){ if(-not $q){ continue }; $xy = $q -split ','; [void]$a.Add(@([int]$xy[0], [int]$xy[1])) }; , $a }
function Ex($rows, $x, $y, $to, $ax, $ay, $label){ $ch = $rows[$y][$x]; if($ch -ne [char]'U'){ throw "exit at $x,$y is on '$ch', not stairs" }
  [pscustomobject][ordered]@{ x = $x; y = $y; to = $to; at = @($ax, $ay); label = $label; kind = "stairs" } }
function Check($name, $rows){ $w = $rows[0].Length; foreach($r in $rows){ if($r.Length -ne $w){ throw "$name has a row of $($r.Length), not $w`: $r" } } }

# ── the floors ──
$p | Add-Member -NotePropertyName floors -NotePropertyValue @(
  [pscustomobject][ordered]@{ id = "lg"; name = "Ground"; z = 0 },
  [pscustomobject][ordered]@{ id = "l1"; name = "Halfway up the tower"; z = 1 },
  [pscustomobject][ordered]@{ id = "l2"; name = "The top of the tower"; z = 2 }) -Force

$base = $p.nodes | Where-Object id -eq "llight"; $lamp = $p.nodes | Where-Object id -eq "llamp"
if(-not $base -or -not $lamp){ throw "the lighthouse isn't in Lantern Rock's plan" }

# ── the base: the stair winds up one side of the core now, its top step leading on up ──
$baseRows = @(
  "....mmmmm....",
  "..mm#####mm..",
  ".m##UUU::##m.",
  ".m#UU::::c#m.",
  "m#UU:OOO:::#m",
  "m#U::OOO:::#m",
  "m#U::OOO:::#m",
  "m#U::::::::#m",
  ".m#U::c:::#m.",
  ".m##:::::##m.",
  "..mm##D##mm..",
  "....m...m....",
  ".............")
Check "base" $baseRows
$base.bmap.rows = $baseRows
$base.bmap.labels = @((L 6.5 5.6 "the stone core"), (L 2.6 6.6 "the stair winds up"), (L 6 1.4 "up to the landing"), (L 6.5 12.6 "the door"))
$base.bmap.notes = "The base of the tower. The spiral stair (the U squares) starts by the door and winds up the west wall round the stone core; its top step (north) leads up to the landing. The stair is narrow: the wreckers come at the crew a few at a time."
$base.bmap | Add-Member -NotePropertyName exits -NotePropertyValue @((Ex $baseRows 6 2 "llanding" 5 3 "Up the stair to the landing"), (Ex $baseRows 5 2 "llanding" 5 3 "Up the stair to the landing")) -Force
$base.name = "The Lighthouse"
$base.notes = "A tall, salt-scoured tower on the island's high crag. Its light has shone every night for as long as anyone remembers, and no one lives here. Inside, a spiral stair climbs round a stone core: three floors, the base, a landing halfway up, and the Lantern Room at the top. Wreckers hold the stair: two at the base, two more and their bruiser on the landing (the first half of the big fight)."
$base | Add-Member -NotePropertyName floor -NotePropertyValue "lg" -Force
$base.site.foes = @([pscustomobject][ordered]@{ id = "lf_wrecker"; n = "2" })

# ── the landing, halfway up: slit windows over the sea, racks with nothing on them, the stair on up ──
$landRows = @(
  "~~~~~~~~~~~~~",
  "~~~~#####~~~~",
  "~~###:::###~~",
  "~~#UU:::SS#~~",
  "~#UU:OOO::S#~",
  "~w:::OOO:::w~",
  "~#:::OOO:::#~",
  "~#::c:::UU:#~",
  "~~#:::::UU#~~",
  "~~###:UU###~~",
  "~~~~#####~~~~",
  "~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~")
Check "landing" $landRows
$landMap = [pscustomobject][ordered]@{ name = "The Landing"; by = "builder"; rows = $landRows
  labels = @((L 6.5 5.6 "the stone core"), (L 9 2.6 "empty racks"), (L 1 4.4 "slit window"), (L 11.6 4.4 "slit window"), (L 3 2.4 "down to the base"), (L 6.5 10.4 "up to the Lantern Room"))
  start = [pscustomobject][ordered]@{ party = (Pts "4,3 5,3 3,3 4,4 2,4 3,4"); enemy = (Pts "8,4 9,5 4,6 9,6 3,5 5,8") }
  notes = "Halfway up the tower the stair pauses at a landing. Slit windows look out over the sea far below. Racks and a barrel stand where a keeper would keep oil and wicks, and they're empty: no oil store, no wick, no keeper's cot (the first clue the light isn't a lamp). The stair arrives from the base on the north-west side and climbs on from the south side to the Lantern Room."
  exits = @((Ex $landRows 3 3 "llight" 7 3 "Down the stair to the base"), (Ex $landRows 4 3 "llight" 7 3 "Down the stair to the base"),
            (Ex $landRows 6 9 "llamp" 9 8 "Up the stair to the Lantern Room"), (Ex $landRows 7 9 "llamp" 9 8 "Up the stair to the Lantern Room")) }
$landing = [pscustomobject][ordered]@{ id = "llanding"; name = "The Landing"; kind = "tower"; region = $base.region; level = $base.level; origin = $false; seat = $false; services = [pscustomobject]@{}
  notes = "Halfway up the lighthouse: the stair pauses at a landing with slit windows over the sea and racks with nothing on them. Two wreckers and their bruiser hold it."
  x = $base.x; y = $base.y; floor = "l1"; npcs = @(); bmap = $landMap
  site = [pscustomobject][ordered]@{ kind = "lighthouse landing"; level = 3; once = $true; waves = 1; foes = @([pscustomobject][ordered]@{ id = "lf_wrecker"; n = "2" }, [pscustomobject][ordered]@{ id = "lf_bruiser"; n = "1" })
    loot = [pscustomobject][ordered]@{ coin = 0; t1 = 0; t2 = 0; t3 = 0; t4 = 0 }; items = @()
    lights = @([pscustomobject][ordered]@{ id = "ltland1"; kind = "torch"; x = 5; y = 6; lit = $true; on = $null }, [pscustomobject][ordered]@{ id = "ltland2"; kind = "torch"; x = 7; y = 4; lit = $true; on = $null }) } }
foreach($k in "w","d","rot","hidden","nameHidden"){ if($base.PSObject.Properties.Name -contains $k){ $landing | Add-Member -NotePropertyName $k -NotePropertyValue $base.$k -Force } }
$p.nodes = @(@($p.nodes | Where-Object id -ne "llanding") + @($landing))

# ── the Lantern Room: on top of the tower, its stair leading back down ──
$lamp.x = $base.x; $lamp.y = $base.y
$lamp | Add-Member -NotePropertyName floor -NotePropertyValue "l2" -Force
$lamp.bmap | Add-Member -NotePropertyName exits -NotePropertyValue @((Ex $lamp.bmap.rows 9 9 "llanding" 7 8 "Down the stair to the landing")) -Force
$lamp.notes = "The top of the lighthouse, up the spiral stair from the landing. The firebird is locked in a cold-iron cage where the lamp should be, and a gallery with a low rail runs all round, high over the sea. Raven Heartgrove and Hargrove-Vance are haggling over the firebird when the crew arrives: the second half of the big fight. Swing from the great lamp's chains; knock pirates off the gallery into the sea. Hargrove-Vance slips away rather than fight."

[IO.File]::WriteAllText($sf, ($d | ConvertTo-Json -Depth 80), $utf8)
$back = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
$bp = $back.plans.klantern
"floors: " + (($bp.floors | ForEach-Object { "$($_.name) (z $($_.z))" }) -join ", ")
foreach($id in "llight","llanding","llamp"){ $n = $bp.nodes | Where-Object id -eq $id; "$id $($n.name) on $($n.floor) at $($n.x),$($n.y): exits " + (($n.bmap.exits | ForEach-Object { "($($_.x),$($_.y))->$($_.to)@$($_.at -join ',')" }) -join " ") + "; foes " + (($n.site.foes | ForEach-Object { "$($_.n) $($_.id)" }) -join ", ") + "; labels $(@($n.bmap.labels).Count), first " + ($n.bmap.labels[0] -join '|') }
