# Works out Kalatecha Island's coast, hills, islets and forest (generate.html) against the newest save, in headless Edge,
# and writes what it found to gen-out.json here: the shapes, and a check that every town and road is on land.
param([string]$Which = "generate.html")
$ErrorActionPreference = "Stop"
$utf8 = New-Object Text.UTF8Encoding $false
$C = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$app = [IO.File]::ReadAllText("$C\index.html", [Text.Encoding]::UTF8)
$tag = '<script src="Tools/srd/srd-data.js" charset="utf-8"></script>'
$app = $app.Replace($tag, "<script>`n" + [IO.File]::ReadAllText("$C\Tools\srd\srd-data.js", [Text.Encoding]::UTF8).TrimEnd() + "`n</script>")
$stub = '<script>const __MEM={};window.storage={get:async k=>{if(!(k in __MEM))throw new Error("none");return {key:k,value:__MEM[k]}},set:async(k,v)=>{__MEM[k]=v;return {key:k,value:v}},delete:async k=>{delete __MEM[k];return {key:k,deleted:true}},list:async()=>({keys:Object.keys(__MEM)})};window.confirm=()=>false;</script>'
$case = [IO.File]::ReadAllText((Join-Path $PSScriptRoot $Which), [Text.Encoding]::UTF8)
$first = $case.Substring(0, $case.IndexOf("`n")).Trim()
$rel = ($first -replace '^// uses: save ', '').Trim()
$body = $case.Substring($case.IndexOf("`n") + 1)
$save = [IO.File]::ReadAllText((Join-Path $C $rel), [Text.Encoding]::UTF8)
$page = $stub + $app + '<script>const __MAP=null;const __SAVE=' + $save + ";`n" + $body
$p = Join-Path $env:TEMP "island-gen-page.html"
[IO.File]::WriteAllText($p, $page, $utf8)
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
$prof = Join-Path $env:TEMP "island-gen-edge"
$ErrorActionPreference = "Continue"
$dom = & $edge --headless --disable-gpu --no-first-run --disable-extensions "--user-data-dir=$prof" --virtual-time-budget=60000 --dump-dom ("file:///" + $p.Replace('\','/')) 2>$null | Out-String
$m = [regex]::Match($dom, '<pre id="OUT">(.*?)</pre>', 'Singleline')
$res = if ($m.Success) { [Net.WebUtility]::HtmlDecode($m.Groups[1].Value) } else { "NO OUT: " + $dom.Substring(0, [Math]::Min(500, $dom.Length)) }
$outName = $Which -replace '\.html$', '-out.json'
[IO.File]::WriteAllText((Join-Path $PSScriptRoot $outName), $res, $utf8)
"${outName}: $($res.Length) characters"
