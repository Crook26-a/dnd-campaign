# The Sallowmay's decks joined up (Joseph, 2026-10-26: "my first thought is the Sallowmay"). Her plan (kship) gets two
# floors, Main deck and Below decks: the main deck and the captain's quarters are on the main deck, the hold is under
# it. Ways out on the battle maps (bmap.exits): the cabin door between the deck and the quarters, the hatch down the
# ladder below decks and the ladder back up. The hull is drawn on both floors. Writes the newest save; run it again
# to put the decks back as they are here.
$ErrorActionPreference = "Stop"
$utf8 = New-Object Text.UTF8Encoding $false
$C = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$sf = "$C\Saves\2026-10-15 kalatecha (roads joined, test island).json"
$d = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
$p = $d.plans.kship
function Ex($rows, $x, $y, $want, $to, $ax, $ay, $label, $kind){ $ch = [string]$rows[$y][$x]; if($ch -cne $want){ throw "exit at $x,$y is on '$ch', not '$want'" }
  [pscustomobject][ordered]@{ x = $x; y = $y; to = $to; at = @($ax, $ay); label = $label; kind = $kind } }

$deck = $p.nodes | Where-Object id -eq "sdeck"; $cabin = $p.nodes | Where-Object id -eq "squarters"; $hold = $p.nodes | Where-Object id -eq "shold"
if(-not $deck -or -not $cabin -or -not $hold){ throw "the Sallowmay's plan doesn't have her three rooms" }

# ── the floors ──
$p | Add-Member -NotePropertyName floors -NotePropertyValue @(
  [pscustomobject][ordered]@{ id = "md"; name = "Main deck"; z = 0 },
  [pscustomobject][ordered]@{ id = "bd"; name = "Below decks"; z = -1 }) -Force
$deck | Add-Member -NotePropertyName floor -NotePropertyValue "md" -Force
$cabin | Add-Member -NotePropertyName floor -NotePropertyValue "md" -Force
$hold | Add-Member -NotePropertyName floor -NotePropertyValue "bd" -Force
$hold.x = 0; $hold.y = 0                                         # under the middle of the deck, where the hatch is

# the hull on the main deck, and a copy of it below (the sea isn't drawn down there)
$hull = $p.shapes | Where-Object { $_.kind -eq "dock" -and $_.name -eq "The Sallowmay" } | Select-Object -First 1
if(-not $hull){ throw "the Sallowmay's hull isn't in her plan" }
$hull | Add-Member -NotePropertyName floor -NotePropertyValue "md" -Force
$below = $hull | ConvertTo-Json -Depth 20 | ConvertFrom-Json
$below.id = "sbelowhull"; $below.name = "The Sallowmay: below decks"; $below.floor = "bd"
$p.shapes = @(@($p.shapes | Where-Object { $_.id -ne "sbelowhull" }) + @($below))

# ── the ways through ──
$dr = $deck.bmap.rows; $cr = $cabin.bmap.rows; $hr = $hold.bmap.rows
$deck.bmap | Add-Member -NotePropertyName exits -NotePropertyValue @(
  (Ex $dr 8 5 "D" "squarters" 8 4 "Into the captain's quarters" "door"),
  (Ex $dr 11 6 "H" "shold" 9 3 "Down the ladder, below decks" "ladder"), (Ex $dr 12 6 "H" "shold" 9 3 "Down the ladder, below decks" "ladder"),
  (Ex $dr 11 7 "H" "shold" 9 4 "Down the ladder, below decks" "ladder"), (Ex $dr 12 7 "H" "shold" 9 4 "Down the ladder, below decks" "ladder")) -Force
$cabin.bmap | Add-Member -NotePropertyName exits -NotePropertyValue @((Ex $cr 10 4 "D" "sdeck" 9 5 "Out onto the deck" "door")) -Force
$hold.bmap | Add-Member -NotePropertyName exits -NotePropertyValue @(
  (Ex $hr 8 3 "L" "sdeck" 10 6 "Up the ladder to the deck" "ladder"), (Ex $hr 8 4 "L" "sdeck" 10 7 "Up the ladder to the deck" "ladder")) -Force

[IO.File]::WriteAllText($sf, ($d | ConvertTo-Json -Depth 80), $utf8)
$back = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) | ConvertFrom-Json
$bp = $back.plans.kship
"floors: " + (($bp.floors | ForEach-Object { "$($_.name) (z $($_.z))" }) -join ", ")
"shapes: " + (($bp.shapes | ForEach-Object { "$($_.name) on $($_.floor)" }) -join ", ")
foreach($id in "sdeck","squarters","shold"){ $n = $bp.nodes | Where-Object id -eq $id; "$id $($n.name) on $($n.floor) at $($n.x),$($n.y): " + (($n.bmap.exits | ForEach-Object { "($($_.x),$($_.y)) $($_.kind)->$($_.to)@$($_.at -join ',')" }) -join " ") }
