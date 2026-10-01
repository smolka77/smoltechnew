# Sanity check of the generated site: internal links, local assets, duplicate
# titles/descriptions, and missing SEO tags. Run from the repository root.
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$skip = @('_src', '_build', '.git', 'panel')

$files = Get-ChildItem $root -Recurse -Filter *.html |
  Where-Object { $p = $_.FullName.Substring($root.Length + 1); -not ($skip | Where-Object { $p -like "$_\*" }) }

$problems = New-Object Collections.Generic.List[string]
$titles = @{}
$descs = @{}

function Resolve-Target([string]$href) {
  if ($href -match '^(https?:|mailto:|tel:|#|javascript:|data:)') { return $null }
  $u = ($href -split '[?#]')[0]
  if ($u -eq '') { return $null }
  if (-not $u.StartsWith('/')) { return "RELATIVE" }
  $local = Join-Path $root ($u.TrimStart('/') -replace '/', '\')
  if ($u.EndsWith('/')) { $local = Join-Path $local 'index.html' }
  return $local
}

foreach ($f in $files) {
  $rel = $f.FullName.Substring($root.Length + 1)
  $html = [IO.File]::ReadAllText($f.FullName, [Text.Encoding]::UTF8)

  foreach ($tag in @('title', 'description', 'canonical', 'og:image', 'og:title')) {
    $has = switch ($tag) {
      'title' { $html -match '<title>[^<]{10,}</title>' }
      'description' { $html -match 'name="description"\s+content="[^"]{40,}"' }
      'canonical' { $html -match 'rel="canonical"' }
      default { $html -match [regex]::Escape($tag) }
    }
    if (-not $has) { $problems.Add("$rel : missing/short $tag") }
  }

  if ($html -notmatch '<html[^>]*lang="uk-UA"') { $problems.Add("$rel : lang is not uk-UA") }
  if ($html -notmatch 'application/ld\+json') { $problems.Add("$rel : no JSON-LD") }

  $t = [regex]::Match($html, '<title>(.*?)</title>').Groups[1].Value
  $d = [regex]::Match($html, 'name="description"\s+content="(.*?)"').Groups[1].Value
  if ($t) { if ($titles.ContainsKey($t)) { $problems.Add("$rel : duplicate <title> (also $($titles[$t]))") } else { $titles[$t] = $rel } }
  if ($d) {
    if ($descs.ContainsKey($d)) { $problems.Add("$rel : duplicate description (also $($descs[$d]))") } else { $descs[$d] = $rel }
    if ($d.Length -gt 165) { $problems.Add("$rel : description $($d.Length) chars (>165)") }
  }
  if ($t.Length -gt 65) { $problems.Add("$rel : title $($t.Length) chars (>65)") }

  foreach ($m in [regex]::Matches($html, '(?:href|src|content)="(/[^"]*)"')) {
    $href = $m.Groups[1].Value
    if ($href -match '^/(assets|)$') { continue }
    $target = Resolve-Target $href
    if (-not $target -or $target -eq 'RELATIVE') { continue }
    if (-not (Test-Path $target)) { $problems.Add("$rel : broken -> $href") }
  }

  foreach ($m in [regex]::Matches($html, '<img\b[^>]*>')) {
    $img = $m.Value
    if ($img -notmatch '\balt=') { $problems.Add("$rel : <img> without alt") }
    if ($img -notmatch '\bwidth=' -or $img -notmatch '\bheight=') { $problems.Add("$rel : <img> without width/height (CLS)") }
  }
}

$problems = $problems | Select-Object -Unique
if ($problems.Count) {
  Write-Output "--- $($problems.Count) issue(s) ---"
  $problems | ForEach-Object { Write-Output "  $_" }
} else {
  Write-Output "--- clean: $($files.Count) pages, no issues ---"
}
