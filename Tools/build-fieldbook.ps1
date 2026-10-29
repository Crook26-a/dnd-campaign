# Builds Field Book's survey.js: the Ordinate Survey code and SRD 5.2 data its "Someone to meet" roll uses, lifted
# out of index.html so the phone rolls people exactly as the survey does (class stat block by level, rolled hit
# points, a caster's class spells and slots, weapons, the filled-in sheet and its gear).
#
# It reads index.html's top-level declarations, starts from the roll's own functions, and follows every name they
# use to the declaration that makes it, so whatever they need comes along. Names the phone app supplies itself
# (its library, the party's level) and anything that draws the survey's screen are left out. All of it is wrapped
# in one scope, so nothing clashes with Field Book's own names: Field Book calls Survey.genPerson(…).
#
# Run it after changing how the survey rolls people:   powershell -NoProfile -ExecutionPolicy Bypass -File Tools\build-fieldbook.ps1
param([string]$OutDir)
$ErrorActionPreference = "Stop"
$Campaign = Split-Path $PSScriptRoot -Parent
if (-not $OutDir) { $OutDir = Join-Path (Split-Path (Split-Path $Campaign -Parent) -Parent) "Field Book" }
$utf8 = New-Object Text.UTF8Encoding $false
$lines = [IO.File]::ReadAllLines((Join-Path $Campaign "index.html"), [Text.Encoding]::UTF8)

# where the code is: the SRD data in its own file (const SRD = …; const SRD_CREDIT = …), then the app's big script
$srd = @([IO.File]::ReadAllLines((Join-Path $PSScriptRoot "srd\srd-data.js"), [Text.Encoding]::UTF8) | Where-Object { $_ -match '^const SRD(_CREDIT)? = ' }) -join "`n"
if (-not $srd.Contains("const SRD_CREDIT = ")) { throw "no 'const SRD = ' and 'const SRD_CREDIT = ' lines in Tools\srd\srd-data.js" }
$appStart = [Array]::FindIndex($lines, [Predicate[string]]{ param($l) $l -eq '"use strict";' })
$appEnd = [Array]::FindLastIndex($lines, [Predicate[string]]{ param($l) $l -eq '</script>' })

# the roll's own entry points: what Field Book calls
$roots = @("genPerson","lootByName","kindOptions","PEOPLE_KINDS","PEOPLE_KIND_GROUPS","SHOP_TEMPLATES","buildPerson","roleOptions","pickClass","CLASS_BLOCKS","CREATURE_TYPES","GEN_SPECIES","ALIGNMENTS","ALIGN_ABBR",
  "completeSheet","fillSheetFromBlock","foeKit","foeById","npcAsFoe","abMod","clampLv","spellOf","SRD_FOES","SRD_SPELLS","SRD_LOOT","crLabel","signed","slotSummary","CASTING","groupOfClass",
  "THEMES","themeTables","rollTheme","pickTheme","themeLabel","GEN_FIRST","GEN_FIRST_MAN","GEN_FIRST_WOMAN","GEN_FIRST_ANY","genderFirst","fitList","fitsGender","GENDER_WORD","GEN_FAMILY","GEN_NICK","GEN_LOOK","GEN_VOICE","GEN_WANTS","GEN_SECRET","genBackstory","rollAlignment","attacksFromStatBlock","weaponAttack","attackWeapons","sheetClasses","creatureOptions","genCreature","spellByName","allSpells","spellLine","spellHeals","spellTidy","SPELL_SCHOOLS","SPELL_TIMES","spellTime","compParts","compText","srdSpellBlock","blankLib","copyFromSrd","factionEffects","standingLines","sgn","STANDING_TIERS")
# the cards for the players: the phone draws the same ones (Field Book: Card on an entry)
$roots += @("cardOf","cardBlob","cardFileName")
# supplied by Field Book (see the shim below) or about the survey's own screen and storage: never brought along
$stop = @('SRD','SRD_CREDIT','$','$$','lib','root','doc','sel','flash','render','renderPane','renderLibrary','renderLibList','saveParty','touch','markDirty',
  'partyAvgLevel','partyLevels','partyRoster','partySize','companions','libNpcById','libLootById','gameLog','svg','battleOf','pane','openInv',
  'syncTabs','renderBattle','renderBattlePanel','selNode','dmMode','idbGet','idbPutRaw','save')

function Get-DeclNames([string]$line) {
  if ($line -match '^(?:async\s+)?function\*?\s+([A-Za-z_$][\w$]*)') { return @($matches[1]) }
  if ($line -notmatch '^(const|let|var)\s+') { return @() }
  # const a = …, b = …: names at bracket depth 0, each followed by "=" (not "==" or "=>")
  $names = New-Object System.Collections.Generic.List[string]
  $s = $line.Substring($matches[0].Length); $depth = 0; $i = 0; $expect = $true; $q = $null
  while ($i -lt $s.Length) {
    $c = $s[$i]
    if ($q) { if ($c -eq '\') { $i += 2; continue }; if ($c -eq $q) { $q = $null }; $i++; continue }
    if ($c -eq '"' -or $c -eq "'" -or $c -eq '`') { $q = $c; $i++; continue }
    if ('([{'.Contains($c)) { $depth++ } elseif (')]}'.Contains($c)) { $depth-- }
    elseif ($depth -eq 0 -and $c -eq ',') { $expect = $true; $i++; continue }
    elseif ($depth -eq 0 -and $c -eq ';') { break }
    if ($expect -and $depth -eq 0) {
      $m = [regex]::Match($s.Substring($i), '^\s*([A-Za-z_$][\w$]*)\s*=(?![=>])')
      if ($m.Success) { $names.Add($m.Groups[1].Value); $i += $m.Length; $expect = $false; continue }
      if ($c -ne ' ') { $expect = $false }
    }
    $i++
  }
  return $names.ToArray()
}

# cut the app script into top-level pieces: a declaration (with the comment just above it) or a statement
$chunks = New-Object System.Collections.Generic.List[object]
$pendingComment = New-Object System.Collections.Generic.List[string]
$cur = $null
function Close-Chunk { if ($script:cur) { $script:chunks.Add($script:cur); $script:cur = $null } }
for ($n = $appStart + 1; $n -lt $appEnd; $n++) {
  $l = $lines[$n]
  $top = $l.Length -gt 0 -and -not [char]::IsWhiteSpace($l[0]) -and -not ('})]`''".+|&?:,'.Contains($l[0]))
  if ($top) {
    Close-Chunk
    if ($l -match '^(/\*|//|\*)') {
      $pendingComment.Add($l)
      # a block comment runs on until its */
      if ($l -match '^/\*' -and $l -notmatch '\*/') { while ($n + 1 -lt $appEnd -and $lines[$n] -notmatch '\*/') { $n++; $pendingComment.Add($lines[$n]) } }
      continue
    }
    $names = Get-DeclNames $l
    $cur = [pscustomobject]@{ Names = $names; Lines = (New-Object System.Collections.Generic.List[string]); Order = $chunks.Count; Decl = ($names.Count -gt 0) }
    foreach ($c in $pendingComment) { $cur.Lines.Add($c) }; $pendingComment.Clear()
    $cur.Lines.Add($l)
  } elseif ($cur) { $cur.Lines.Add($l) }
  elseif ($l.Trim() -eq '') { } else { $pendingComment.Add($l) }
}
Close-Chunk

# which piece makes each name
$byName = @{}
foreach ($c in $chunks) { foreach ($nm in $c.Names) { if (-not $byName.ContainsKey($nm)) { $byName[$nm] = $c } } }
$idRe = [regex]'(?<![\w$.])[A-Za-z_$][\w$]*'
# the code in a piece without its comments or the words inside its strings (a template string keeps its ${…} parts)
function Get-Code([string]$t) {
  $sb = New-Object Text.StringBuilder; $i = 0; $n = $t.Length; $stack = New-Object System.Collections.Generic.Stack[int]
  while ($i -lt $n) {
    $c = $t[$i]
    if ($c -eq '/' -and $i + 1 -lt $n -and $t[$i+1] -eq '*') { $e = $t.IndexOf('*/', $i + 2); $i = if ($e -lt 0) { $n } else { $e + 2 }; [void]$sb.Append(' '); continue }
    if ($c -eq '/' -and $i + 1 -lt $n -and $t[$i+1] -eq '/' -and ($i -eq 0 -or $t[$i-1] -ne ':')) { $e = $t.IndexOf("`n", $i); $i = if ($e -lt 0) { $n } else { $e }; continue }
    if ($c -eq '"' -or $c -eq "'") { $i++; while ($i -lt $n -and $t[$i] -ne $c -and $t[$i] -ne "`n") { if ($t[$i] -eq '\') { $i++ }; $i++ }; $i++; [void]$sb.Append(' "" '); continue }
    if ($c -eq '`' -or ($c -eq '}' -and $stack.Count -and $stack.Peek() -eq 0)) {
      if ($c -eq '}') { [void]$stack.Pop() }
      $i++   # inside template text until its closing ` or the next ${
      while ($i -lt $n -and $t[$i] -ne '`' -and -not ($t[$i] -eq '$' -and $i + 1 -lt $n -and $t[$i+1] -eq '{')) { if ($t[$i] -eq '\') { $i++ }; $i++ }
      if ($i -lt $n -and $t[$i] -eq '$') { $stack.Push(0); $i += 2; [void]$sb.Append(' ') } else { $i++; [void]$sb.Append(' "" ') }
      continue
    }
    if ($c -eq '{' -and $stack.Count) { $stack.Push($stack.Pop() + 1) } elseif ($c -eq '}' -and $stack.Count) { $stack.Push($stack.Pop() - 1) }
    [void]$sb.Append($c); $i++
  }
  return $sb.ToString()
}
function Get-Uses($c) {
  $text = Get-Code ($c.Lines -join "`n")
  $set = New-Object 'System.Collections.Generic.HashSet[string]'
  foreach ($m in $idRe.Matches($text)) { [void]$set.Add($m.Value) }
  return $set
}

# follow the names
$keep = New-Object 'System.Collections.Generic.HashSet[object]'
$queue = New-Object System.Collections.Generic.Queue[string]
foreach ($r in $roots) { if (-not $byName.ContainsKey($r)) { throw "index.html has no top-level '$r'" }; $queue.Enqueue($r) }
$why = @{}
while ($queue.Count) {
  $nm = $queue.Dequeue(); if ($stop -contains $nm -or -not $byName.ContainsKey($nm)) { continue }
  $c = $byName[$nm]; if (-not $keep.Add($c)) { continue }
  foreach ($u in (Get-Uses $c)) { if ($byName.ContainsKey($u) -and $stop -notcontains $u -and -not $keep.Contains($byName[$u])) { if (-not $why.ContainsKey($u)) { $why[$u] = $nm }; $queue.Enqueue($u) } }
}
# statements that only prepare data the kept pieces use (SRD spells marked as healing, gear rarities…) come too
$keptNames = New-Object 'System.Collections.Generic.HashSet[string]'; foreach ($c in $keep) { foreach ($nm in $c.Names) { [void]$keptNames.Add($nm) } }
foreach ($c in $chunks) {
  if ($c.Decl -or $keep.Contains($c)) { continue }
  if (($c.Lines -join "`n") -match '\b(document|window|addEventListener|setInterval|setTimeout|svg|\$\()') { continue }
  $uses = @(Get-Uses $c | Where-Object { $byName.ContainsKey($_) })
  if ($uses.Count -and -not ($uses | Where-Object { -not $keptNames.Contains($_) })) { [void]$keep.Add($c) }
}

$kept = @($chunks | Where-Object { $keep.Contains($_) } | Sort-Object Order)
$exports = @($roots)
$shim = @'
  /* what the phone supplies: its own library (items and people, no foes of its own), and nothing to save or show */
  const FB = (typeof window!=="undefined" && window.FB_SURVEY) || {};
  const lib = () => (FB.lib ? FB.lib() : { foes:[], npcs:[], loot:[], tables:[] });
  const libNpcById = id => lib().npcs.find(p=>p.id===id) || null;
  const libLootById = id => SRD_LOOT.find(x=>x.id===id) || lib().loot.find(x=>x.id===id) || null;
  const partyLevels = () => []; const partyAvgLevel = () => (FB.level ? FB.level() : 1);
  const root = { get library(){ return lib(); } }, doc = { nodes:[] }; const flash = () => {}, saveParty = () => {}, touch = () => {}, gameLog = () => {};
'@
$body = ($kept | ForEach-Object { $_.Lines -join "`n" }) -join "`n"
$out = @"
/* survey.js: made by Ordinate Survey's Tools\build-fieldbook.ps1 from its index.html ($(Get-Date -Format 'yyyy-MM-dd HH:mm')). Don't edit by hand:
   change the survey and build again. $($kept.Count) pieces of the survey's code and the SRD 5.2 data. */
const Survey = (() => {
"use strict";
$srd
$shim
$body
  return { $(($exports + 'SRD_CREDIT') -join ', ') };
})();
"@
$dest = Join-Path $OutDir "survey.js"
[IO.File]::WriteAllText($dest, $out, $utf8)
"wrote $dest ($([math]::Round((Get-Item $dest).Length / 1KB)) KB, $($kept.Count) pieces): " + (($kept | ForEach-Object { $_.Names } | Where-Object { $_ }) -join ', ')
if ($env:FB_WHY) { foreach ($k in ($env:FB_WHY -split ",")) { $chain = @($k); $x = $k; while ($why.ContainsKey($x)) { $x = $why[$x]; $chain += $x }; "why ${k}: " + ($chain -join " <- ") } }
