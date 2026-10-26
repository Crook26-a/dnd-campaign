# Runs the Ordinate Survey's tests. Each test in cases\ is the end of a page: a script that drives the app the way a
# person would and writes what it saw into the page's title ("RES …"). For each one this builds the page (the stub
# below, index.html, the map or save the test's first line names, the test), opens it in headless Edge, several at a
# time, and compares what it saw with expected\<test>.txt.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File Tools\tests\run-tests.ps1                every test
#   powershell -NoProfile -ExecutionPolicy Bypass -File Tools\tests\run-tests.ps1 -Only 236,250  just those
#   ... -Accept                                    after reading the changes: what they saw becomes what's expected
#
# Passed = saw exactly what it saw last time. Changed = look at the difference (a fix, or a break). Broke = it threw,
# the page had an error, or it never finished. New = no expected answer yet. What each saw is left in out\.
#
# A test's first line says what it loads, from the campaign folder:  // uses: save Saves\….json  |  map …  |  nothing
# Writing a new test: copy a recent one, change the steps, run it with -Only, read out\<test>.txt, then -Accept it.
param([string[]]$Only, [switch]$Accept, [int]$Jobs = 6, [int]$Timeout = 150)
$ErrorActionPreference = "Stop"
$Here = $PSScriptRoot
$Campaign = Split-Path (Split-Path $Here -Parent) -Parent
$utf8 = New-Object Text.UTF8Encoding $false
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") |
  Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw "Microsoft Edge not found" }

$outDir = Join-Path $Here "out"; $expDir = Join-Path $Here "expected"
$work = Join-Path $env:TEMP "ordinate-tests"
New-Item -ItemType Directory -Force $outDir, $expDir, $work | Out-Null
$runKey = Get-Date -Format "MMddHHmmss"; $pageNo = 0

# The stub: catches page errors, stands in for the artifact storage API, and makes Math.random repeatable so rolls
# come out the same every run. All the tests share one browser, so each page also gets storage of its own, starting
# empty (localStorage in memory, IndexedDB names tagged with the page's key), and pop-up questions answer "no".
# A test that ends by writing <h1 id="RES"> instead of the title has it copied into the title.
$stub = '<script>window.__ERR=[];window.addEventListener("error",e=>{__ERR.push(e.message+" @"+e.lineno);});' +
  'const __MEM={};window.storage={get:async k=>{if(!(k in __MEM))throw new Error("none");return {key:k,value:__MEM[k]}},' +
  'set:async(k,v)=>{__MEM[k]=v;return {key:k,value:v}},delete:async k=>{delete __MEM[k];return {key:k,deleted:true}},' +
  'list:async()=>({keys:Object.keys(__MEM)})};' +
  '(()=>{let s=20261013;Math.random=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};})();' +
  '(()=>{const K="~PAGEKEY",F=IDBFactory.prototype,o=F.open,d=F.deleteDatabase;' +
  'F.open=function(n,v){return v===undefined?o.call(this,n+K):o.call(this,n+K,v)};F.deleteDatabase=function(n){return d.call(this,n+K)};' +
  'const mk=()=>{const m=new Map();return {getItem:k=>m.has(String(k))?m.get(String(k)):null,setItem:(k,v)=>{m.set(String(k),String(v))},' +
  'removeItem:k=>{m.delete(String(k))},clear:()=>m.clear(),key:i=>[...m.keys()][i]??null,get length(){return m.size}}};' +
  'Object.defineProperty(window,"localStorage",{value:mk(),configurable:true});Object.defineProperty(window,"sessionStorage",{value:mk(),configurable:true});' +
  'window.alert=()=>{};window.confirm=()=>false;window.prompt=()=>null;' +
  'setInterval(()=>{const h=document.getElementById("RES");if(h&&!/^RES /.test(document.title))document.title="RES "+h.textContent;},250);})();</script>' + "`n"

# the app without its closing </body></html>, so the test's script lands inside the page
$appLines = [IO.File]::ReadAllLines((Join-Path $Campaign "index.html"), [Text.Encoding]::UTF8)
$app = ($appLines[0..($appLines.Length - 3)] -join "`n") + "`n"
# the app loads the SRD data from its own file; the test page lives elsewhere, so the data goes inside it
$srdTag = '<script src="Tools/srd/srd-data.js" charset="utf-8"></script>'
if ($app.Contains($srdTag)) {
  $srdData = [IO.File]::ReadAllText((Join-Path $Campaign "Tools\srd\srd-data.js"), [Text.Encoding]::UTF8)
  $app = $app.Replace($srdTag, "<script>`n" + $srdData.TrimEnd() + "`n</script>")
}

$cases = Get-ChildItem (Join-Path $Here "cases") -Filter *.html | Sort-Object { [int]($_.BaseName -replace '\D.*$','' -replace '^$','0') }, BaseName
if ($Only) { $want = $Only | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() }; $cases = $cases | Where-Object { $want -contains $_.BaseName } }
if (-not $cases) { throw "no tests matched" }

$fixtures = @{}
function Get-Fixture([string]$rel) {
  if (-not $fixtures.ContainsKey($rel)) {
    $p = Join-Path $Campaign $rel
    if (-not (Test-Path -LiteralPath $p)) { throw "fixture missing: $rel" }
    $fixtures[$rel] = [IO.File]::ReadAllText($p, [Text.Encoding]::UTF8)
  }
  return $fixtures[$rel]
}

function Build-Page($case) {
  $text = [IO.File]::ReadAllText($case.FullName, [Text.Encoding]::UTF8)
  $nl = $text.IndexOf("`n"); $first = $text.Substring(0, $nl).Trim(); $body = $text.Substring($nl + 1)
  if ($first -notmatch '^// uses: (save|map|nothing) ?(.*)$') { throw "$($case.Name): first line must be // uses: …" }
  $kind = $matches[1]; $rel = $matches[2].Trim()
  $page = New-Object Text.StringBuilder
  $script:pageNo++
  [void]$page.Append($stub.Replace("PAGEKEY", "$runKey-$($case.BaseName)-$($script:pageNo)")).Append($app)
  if ($kind -ne "nothing") {
    $json = Get-Fixture $rel
    if ($kind -eq "map") { [void]$page.Append('<script>const __MAP=').Append($json).Append(';const __SAVE=null;' + "`n") }
    else { [void]$page.Append('<script>const __MAP=null;const __SAVE=').Append($json).Append(';' + "`n") }
  }
  [void]$page.Append($body)
  if ($kind -ne "nothing" -and $body -notmatch "</script>\s*$") { [void]$page.Append("`n</script>`n") }   # a map or save case is plain JS inside the open <script>: close it, or Edge never runs it
  $path = Join-Path $work ($case.BaseName + ".html")
  [IO.File]::WriteAllText($path, $page.ToString(), $utf8)
  return $path
}

# One headless Edge for the whole run, driven through its debugging port: each test opens in a tab of its own, and the
# tab closes as soon as the page's title says RES (or the test runs out of time).
$port = 9300 + (Get-Random -Maximum 600)
$cdp = "http://127.0.0.1:$port"
$profDir = Join-Path $work "browser-$runKey"
Get-ChildItem $work -Directory -Filter "browser*" -ErrorAction SilentlyContinue | ForEach-Object { Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }      # old runs, unless still in use
$browser = Start-Process -FilePath $edge -PassThru -WindowStyle Hidden -ArgumentList ("--headless --disable-gpu --no-first-run --disable-extensions " +
  "--remote-debugging-port=$port --user-data-dir=`"$profDir`" --window-size=1920,1000 --disable-background-timer-throttling " +
  "--disable-renderer-backgrounding --disable-backgrounding-occluded-windows about:blank")
$ready = $false
foreach ($i in 1..40) { try { Invoke-RestMethod "$cdp/json/version" -TimeoutSec 2 | Out-Null; $ready = $true; break } catch { Start-Sleep -Milliseconds 250 } }
if (-not $ready) { throw "headless Edge didn't start" }

function Stop-Browser {
  try { Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like "*$profDir*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } } catch {}
}

# run a list of tests, $n tabs at a time
$results = @{}
function Invoke-Batch($list, [int]$n) {
  $queue = New-Object System.Collections.Queue; $list | ForEach-Object { $queue.Enqueue($_) }
  $running = @{}; $total = $queue.Count; $done = 0
  while ($queue.Count -or $running.Count) {
    while ($queue.Count -and $running.Count -lt $n) {
      $case = $queue.Dequeue()
      $page = Build-Page $case
      $tab = Invoke-RestMethod -Method Put ("$cdp/json/new?" + ([Uri]$page).AbsoluteUri)
      $running[$case.BaseName] = @{ id = $tab.id; page = $page; at = Get-Date }
    }
    Start-Sleep -Milliseconds 400
    $tabs = @{}; foreach ($t in (Invoke-RestMethod "$cdp/json/list")) { $tabs[$t.id] = $t }
    foreach ($name in @($running.Keys)) {
      $r = $running[$name]; $t = $tabs[$r.id]
      $title = if ($t) { [string]$t.title } else { "" }
      $late = ((Get-Date) - $r.at).TotalSeconds -gt $Timeout
      if (-not $title.StartsWith("RES ") -and -not $late -and $t) { continue }
      $script:results[$name] = if ($title.StartsWith("RES ")) { (([Net.WebUtility]::HtmlDecode($title.Substring(4))) -split ' \|\| ') -join "`n" }
        elseif (-not $t) { "NO RESULT (the tab closed: the page crashed)" } else { "TIMED OUT after $Timeout s" }
      try { Invoke-RestMethod "$cdp/json/close/$($r.id)" | Out-Null } catch {}
      Remove-Item $r.page -ErrorAction SilentlyContinue
      $running.Remove($name); $done++
      Write-Host -NoNewline "`r  $done / $total"
    }
  }
  Write-Host ""
}

function Get-Verdict([string]$name) {
  $got = $results[$name]
  if ($got -eq $null) { return "broke" }
  if ($got -match '^(ERR |WINERR )|THREW |\bFAILED\b|^TIMED OUT|· WINERR ') { return "broke" }
  $expFile = Join-Path $expDir "$name.txt"
  if (-not (Test-Path $expFile)) { return "new" }
  if (([IO.File]::ReadAllText($expFile, [Text.Encoding]::UTF8)).TrimEnd("`n") -eq $got) { return "same" }
  return "changed"
}

$started = Get-Date
$shaky = @()
try {
  Invoke-Batch $cases $Jobs
  # some tests lean on timing and stumble when the machine is busy: anything that broke or changed gets one more go
  # on its own, and only what still fails is reported
  $again = @($cases | Where-Object { (Get-Verdict $_.BaseName) -in "broke","changed" })
  if ($again.Count -and $Jobs -gt 1) {
    $before = @{}; $again | ForEach-Object { $before[$_.BaseName] = Get-Verdict $_.BaseName }
    Write-Host "  again, one at a time: $($again.BaseName -join ', ')"
    Invoke-Batch $again 1
    $shaky = @($again | Where-Object { (Get-Verdict $_.BaseName) -ne $before[$_.BaseName] } | ForEach-Object BaseName)
  }
} finally { Stop-Browser }

# compare with what's expected
$passed = @(); $changed = @(); $broke = @(); $new = @()
foreach ($name in ($cases | ForEach-Object BaseName)) {
  $got = $results[$name]; if ($got -eq $null) { $got = "NO RESULT (the page never wrote RES)"; $results[$name] = $got }
  [IO.File]::WriteAllText((Join-Path $outDir "$name.txt"), $got + "`n", $utf8)
  $expFile = Join-Path $expDir "$name.txt"
  $isBroke = (Get-Verdict $name) -eq "broke" -or $got -like "NO RESULT*"
  if ($isBroke) { $broke += $name; continue }
  if ($Accept) { [IO.File]::WriteAllText($expFile, $got + "`n", $utf8) }
  if (-not (Test-Path $expFile)) { $new += $name; continue }
  $exp = ([IO.File]::ReadAllText($expFile, [Text.Encoding]::UTF8)).TrimEnd("`n")
  if ($exp -eq $got -or $Accept) { $passed += $name } else { $changed += $name }
}

foreach ($name in $changed) {
  Write-Host "`nCHANGED  $name" -ForegroundColor Yellow
  $exp = ([IO.File]::ReadAllText((Join-Path $expDir "$name.txt"), [Text.Encoding]::UTF8)).TrimEnd("`n") -split "`n"
  $got = $results[$name] -split "`n"
  Compare-Object $exp $got | ForEach-Object { $mark = if ($_.SideIndicator -eq '<=') { '  was: ' } else { '  now: ' }; Write-Host ($mark + $_.InputObject) }
}
foreach ($name in $broke) { Write-Host "`nBROKE    $name" -ForegroundColor Red; Write-Host ("  " + (($results[$name] + "") -replace "`n", "`n  ")) }
if ($new) { Write-Host "`nNEW (no expected answer yet; read out\<test>.txt, then -Accept): $($new -join ', ')" -ForegroundColor Cyan }
if ($shaky) { Write-Host "`nShaky (failed alongside others, fine on their own): $($shaky -join ', ')" -ForegroundColor DarkYellow }
$secs = [int]((Get-Date) - $started).TotalSeconds
Write-Host ("`n{0} passed, {1} changed, {2} broke, {3} new  ({4} tests, {5}s)" -f $passed.Count, $changed.Count, $broke.Count, $new.Count, $cases.Count, $secs)
if ($Accept) { Write-Host "Saved what they saw as the expected answers." }
if ($changed.Count -or $broke.Count) { exit 1 }
