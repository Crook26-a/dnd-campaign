# Step-test runner (Joseph, 2026-11-01: "long time outs, continuously broken tests, and testing the whole system when
# something fails, rather than restarting the test where it failed"). The same file is in Character Book\tests and
# Ordinate Survey's Tools\tests\steps, set up for each by steps.json beside it: keep the two in step.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tests\run.ps1                       every test
#   ... -Only level-up                                                                       one test (or a,b)
#   ... -Only level-up -From 4                                                               start again at step 4
#   ... -Accept                                                                              what it saw becomes what's expected
#   ... -Keep                                                                                keep the built pages (to look at one that broke)
#
# A test is a .js file of named steps (see kit.js). Its first line can name the data it needs, from fixtures.json:
#   // uses: party, homebrew
# Each test runs in a headless Edge of its own, a few at a time, and stops at its first failing step. After each step
# the app's state is kept in out\<test>\state-<n>.json, so -From starts at the step that failed instead of the start.
# What a test downloads is kept in out\<test>\downloads (another test can use it as a fixture).
param([string[]]$Only, [int]$From = 1, [switch]$Accept, [int]$Timeout = 30, [int]$Jobs = 4, [switch]$Keep)
$ErrorActionPreference = "Stop"
$Here = $PSScriptRoot
$cfg = Get-Content (Join-Path $Here "steps.json") -Raw | ConvertFrom-Json
$utf8 = New-Object Text.UTF8Encoding $false
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw "Microsoft Edge not found" }
$full = { param($p) [IO.Path]::GetFullPath((Join-Path $Here ([Environment]::ExpandEnvironmentVariables($p)))) }

# the app, with the scripts it loads from files put inside it (the test page lives elsewhere)
$appPath = & $full $cfg.app
$app = [IO.File]::ReadAllText($appPath, [Text.Encoding]::UTF8)
foreach ($p in $cfg.inline.PSObject.Properties) {
  $src = [IO.File]::ReadAllText((& $full $p.Value), [Text.Encoding]::UTF8)
  $rx = '<script src="' + [regex]::Escape($p.Name) + '"[^>]*></script>'
  if ($app -notmatch $rx) { throw "the app has no <script src=`"$($p.Name)`">" }
  # (a Regex object's Replace takes a count; the static [regex]::Replace's fourth argument is options, and replaces every one)
  $app = (New-Object Text.RegularExpressions.Regex $rx).Replace($app, [Text.RegularExpressions.MatchEvaluator]{ param($m) "<script>`n" + $src.TrimEnd() + "`n</script>" }, 1)
}
$kit = [IO.File]::ReadAllText((Join-Path $Here "kit.js"), [Text.Encoding]::UTF8)
$fixtures = @{}; $fxFile = Join-Path $Here "fixtures.json"
if (Test-Path $fxFile) { (Get-Content $fxFile -Raw | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $fixtures[$_.Name] = & $full $_.Value } }

# the tests: each folder in steps.json's cases, with its expected and out folders beside it
$cases = foreach ($d in $cfg.cases) { $dir = & $full $d; if (Test-Path $dir) { Get-ChildItem $dir -Filter *.js } }
if ($Only) { $want = $Only | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() }; $cases = @($cases | Where-Object { $want -contains $_.BaseName }) }
if (-not $cases) { throw "no tests matched" }
if ($From -gt 1 -and @($cases).Count -ne 1) { throw "-From needs one test: -Only <test> -From $From" }
$home2 = { param($case) Split-Path $case.DirectoryName -Parent }
$expOf = { param($case) Join-Path (& $home2 $case) "expected\$($case.BaseName).txt" }
$outOf = { param($case) Join-Path (& $home2 $case) "out\$($case.BaseName)" }

$work = Join-Path $env:TEMP ("steps-" + $cfg.kind + "-" + (Get-Date -Format "MMddHHmmss"))
New-Item -ItemType Directory -Force $work | Out-Null

function Build-Page($case) {
  $text = [IO.File]::ReadAllText($case.FullName, [Text.Encoding]::UTF8)
  $fix = ""
  if ($text -match '^// uses:\s*(.+)') {
    $parts = foreach ($n in ($matches[1] -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
      if (-not $fixtures.ContainsKey($n)) { throw "$($case.Name): no fixture '$n' in fixtures.json" }
      if (-not (Test-Path -LiteralPath $fixtures[$n])) { throw "$($case.Name): fixture '$n' isn't there: $($fixtures[$n])" }
      "`"$n`": " + [IO.File]::ReadAllText($fixtures[$n], [Text.Encoding]::UTF8).Trim()
    }
    $fix = "<script>const FIX = {" + ($parts -join ",`n") + "};</script>`n"
  }
  $state = "null"
  if ($From -gt 1) { $sf = Join-Path (& $outOf $case) "state-$($From - 1).json"; if (-not (Test-Path $sf)) { throw "no saved state for step $($From - 1): run the test from the start once ($sf)" }; $state = [IO.File]::ReadAllText($sf, [Text.Encoding]::UTF8) }
  $confirm = if ($cfg.confirm -eq $false) { "false" } else { "true" }
  $keys = if ($cfg.keys) { "[" + ((@($cfg.keys) | ForEach-Object { '"' + $_ + '"' }) -join ",") + "]" } else { "null" }
  $pre = "<script>window.__KIT_KIND=`"$($cfg.kind)`";window.__KIT_KEYS=$keys;window.__CONFIRM=$confirm;window.__FROM=$From;window.__STATE=$state;</script>`n<script>`n$kit`n</script>`n"
  # the kit goes in after the page says it's UTF-8: that line must stay in the first 1024 bytes, or the page is read
  # in the wrong encoding and long scripts break
  $anchor = if ($app -match '(?i)<meta charset[^>]*>') { '(?i)<meta charset[^>]*>' } else { '(?i)<head(\s[^>]*)?>' }
  $page = (New-Object Text.RegularExpressions.Regex $anchor).Replace($app, [Text.RegularExpressions.MatchEvaluator]{ param($m) $m.Value + "`n" + $pre }, 1)
  $at = $page.LastIndexOf("</body>"); if ($at -lt 0) { $at = $page.Length }
  $page = $page.Substring(0, $at) + $fix + "<script>`n" + $text + "`n</script>`n<script>__KIT.run();</script>`n" + $page.Substring($at)
  $path = Join-Path $work ($case.BaseName + ".html"); [IO.File]::WriteAllText($path, $page, $utf8); return $path
}
# the browser's output, read while Windows may still have it open from the redirect (shared, a few tries)
function Read-Shared($path) {
  for ($i = 0; $i -lt 30; $i++) {
    try { $fs = [IO.File]::Open($path, 'Open', 'Read', 'ReadWrite'); try { return (New-Object IO.StreamReader($fs, [Text.Encoding]::UTF8)).ReadToEnd() } finally { $fs.Dispose() } }
    catch { Start-Sleep -Milliseconds 100 }
  }
  return ""
}
function Stop-Mine($prof) { Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like "*$prof*" } | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} } }

# Edge on a desktop of its own (Joseph, 2026-11-02: the test pages, hidden as they were, filled his window list while a
# run went on). A second Windows desktop that nothing on the screen shows; Edge runs there as usual. Start-OffScreen
# starts a program there and returns its process; -Out sends what it prints to a file (cmd, started there too, does it).
if (-not ("OffDesk" -as [type])) { Add-Type @"
using System; using System.Runtime.InteropServices;
public static class OffDesk {
  [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Unicode)] static extern IntPtr CreateDesktop(string name, IntPtr dev, IntPtr mode, int flags, uint access, IntPtr sa);
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] struct SI { public int cb; public string lpReserved, lpDesktop, lpTitle; public int dwX, dwY, dwXSize, dwYSize, dwXCountChars, dwYCountChars, dwFillAttribute, dwFlags; public short wShowWindow, cbReserved2; public IntPtr lpReserved2, hStdInput, hStdOutput, hStdError; }
  [StructLayout(LayoutKind.Sequential)] struct PI { public IntPtr hProcess, hThread; public int dwProcessId, dwThreadId; }
  [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)] static extern bool CreateProcess(string app, string cmd, IntPtr pa, IntPtr ta, bool inherit, uint flags, IntPtr env, string dir, ref SI si, out PI pi);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
  static IntPtr desk = IntPtr.Zero;
  public static int Start(string name, string cmd){
    if (desk == IntPtr.Zero) { desk = CreateDesktop(name, IntPtr.Zero, IntPtr.Zero, 0, 0x10000000, IntPtr.Zero); if (desk == IntPtr.Zero) throw new System.ComponentModel.Win32Exception(); }
    var si = new SI(); si.cb = Marshal.SizeOf(typeof(SI)); si.lpDesktop = name; PI pi;
    if (!CreateProcess(null, cmd, IntPtr.Zero, IntPtr.Zero, false, 0x08000000, IntPtr.Zero, null, ref si, out pi)) throw new System.ComponentModel.Win32Exception();
    CloseHandle(pi.hThread); CloseHandle(pi.hProcess); return pi.dwProcessId; } }
"@ }
function Start-OffScreen([string]$Exe, [string[]]$Argv, [string]$Out) {
  $cmd = '"' + $Exe + '" ' + ($Argv -join ' ')
  if ($Out) { $cmd = 'cmd.exe /d /s /c "' + $cmd + ' > "' + $Out + '" 2> "' + $Out + '.err""' }
  return Get-Process -Id ([OffDesk]::Start("ordinate-tests", $cmd))
}

# run them, a few at a time; a test that's still going after -Timeout seconds is stopped (only its own browser)
$results = @{}; $queue = New-Object System.Collections.Queue; $cases | ForEach-Object { $queue.Enqueue($_) }; $running = @{}
$started = Get-Date
while ($queue.Count -or $running.Count) {
  while ($queue.Count -and $running.Count -lt $Jobs) {
    $case = $queue.Dequeue(); $page = Build-Page $case; $prof = Join-Path $work "prof-$($case.BaseName)"; $outFile = Join-Path $work "$($case.BaseName).dom"
    $p = Start-OffScreen $edge -Out $outFile -Argv @("--headless=new", "--disable-gpu", "--no-first-run", "--disable-extensions",
      "--allow-file-access-from-files", "--user-data-dir=`"$prof`"", "--virtual-time-budget=60000", "--dump-dom", ([Uri]$page).AbsoluteUri)
    $running[$case.BaseName] = @{ case = $case; proc = $p; prof = $prof; out = $outFile; at = Get-Date }
  }
  Start-Sleep -Milliseconds 300
  foreach ($name in @($running.Keys)) {
    $r = $running[$name]; $late = ((Get-Date) - $r.at).TotalSeconds -gt $Timeout
    if (-not $r.proc.HasExited -and -not $late) { continue }
    if ($late) { Stop-Mine $r.prof; Start-Sleep -Milliseconds 300 }
    $dom = if (Test-Path $r.out) { Read-Shared $r.out } else { "" }
    $m = [regex]::Match($dom, '<pre id="__KIT"[^>]*>([\s\S]*?)</pre>')
    $res = if ($m.Success) { [Net.WebUtility]::HtmlDecode($m.Groups[1].Value) | ConvertFrom-Json } else { $null }
    $results[$name] = @{ case = $r.case; res = $res; late = $late; secs = [math]::Round(((Get-Date) - $r.at).TotalSeconds, 1) }
    $running.Remove($name)
  }
}

# what each saw, against what's expected
$counts = @{ passed = 0; changed = 0; failed = 0; new = 0 }
foreach ($name in ($cases | ForEach-Object BaseName)) {
  $x = $results[$name]; $case = $x.case; $res = $x.res; $od = & $outOf $case; New-Item -ItemType Directory -Force $od | Out-Null
  if (-not $res) { $counts.failed++; Write-Host ("FAILED   {0}: {1}" -f $name, $(if ($x.late) { "timed out after $Timeout s before its first step (the page never got going)" } else { "no result (the page never ran its steps)" })) -ForegroundColor Red; continue }
  $lines = @($res.lines)
  # no steps at all: the test file itself didn't load (a syntax error), never "0 steps, read out" (Joseph, 2026-11-04)
  if (-not $lines.Count) { $counts.failed++; Write-Host ("FAILED   {0}: no steps ran, so the test file didn't load{1}" -f $name, $(if (@($res.errors).Count) { ": " + ($res.errors -join ' ; ') } else { " (a script error in it, or no step(...) in it)" })) -ForegroundColor Red; continue }
  [IO.File]::WriteAllText("$od.txt", ($lines -join "`n") + "`n", $utf8)
  foreach ($p in $res.states.PSObject.Properties) { [IO.File]::WriteAllText((Join-Path $od "state-$($p.Name).json"), ($p.Value | ConvertTo-Json -Depth 60 -Compress), $utf8) }
  if (@($res.files).Count) { $dd = Join-Path $od "downloads"; New-Item -ItemType Directory -Force $dd | Out-Null; $k = 0
    # each under its own name, and as download-<n>.json: a name that stays the same, for a fixture to point at
    foreach ($f in $res.files) { $k++; [IO.File]::WriteAllText((Join-Path $dd ($f.name -replace '[\\/:*?"<>|]', '_')), $f.text, $utf8); [IO.File]::WriteAllText((Join-Path $dd "download-$k.json"), $f.text, $utf8) } }
  if ($res.failedAt -gt 0 -or -not $res.done) {
    $counts.failed++
    $n = if ($res.failedAt -gt 0) { $res.failedAt } else { $res.at }
    $why = if ($res.failedAt -gt 0) { ($lines | Where-Object { $_ -like "$n. *" } | Select-Object -Last 1) }
      elseif ($x.late) { "timed out after $Timeout s during step $n" } else { "step $n never finished: it was waiting on something that didn't happen" }
    if ($res.failedAt -eq 0 -and @($res.errors).Count) { $why += " (page errors: $($res.errors -join ' ; '))" }
    Write-Host "FAILED   $name at step $n" -ForegroundColor Red; Write-Host "  $why"
    Write-Host "  start again there:  -Only $name -From $n" -ForegroundColor DarkGray; continue
  }
  $exp = & $expOf $case; $mine = $lines | Where-Object { [int](($_ -split '\.')[0]) -ge $From }
  if ($Accept) {
    New-Item -ItemType Directory -Force (Split-Path $exp) | Out-Null
    $kept = if ($From -gt 1 -and (Test-Path $exp)) { @([IO.File]::ReadAllLines($exp, [Text.Encoding]::UTF8) | Where-Object { $_ -and [int](($_ -split '\.')[0]) -lt $From }) } else { @() }
    [IO.File]::WriteAllText($exp, (($kept + $mine) -join "`n") + "`n", $utf8)
  }
  if (-not (Test-Path $exp)) { $counts.new++; Write-Host "NEW      $name ($($lines.Count) steps): read out, then -Accept" -ForegroundColor Cyan; continue }
  $want = @([IO.File]::ReadAllLines($exp, [Text.Encoding]::UTF8) | Where-Object { $_ -and [int](($_ -split '\.')[0]) -ge $From })
  $diff = Compare-Object @($want) @($mine)
  if (-not $diff) { $counts.passed++; Write-Host "passed   $name ($($lines.Count) steps, $($x.secs) s)"; continue }
  $counts.changed++; Write-Host "CHANGED  $name" -ForegroundColor Yellow
  $diff | ForEach-Object { Write-Host ((@{ '<=' = '  was: '; '=>' = '  now: ' })[$_.SideIndicator] + $_.InputObject) }
}
if ($Keep) { Write-Host "the pages are kept in $work" } else { Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue }
Write-Host ("`n{0} passed, {1} changed, {2} failed, {3} new  ({4} s)" -f $counts.passed, $counts.changed, $counts.failed, $counts.new, [int]((Get-Date) - $started).TotalSeconds)
if ($Accept) { Write-Host "Saved what they saw as the expected answers." }
if ($counts.changed -or $counts.failed) { exit 1 }
