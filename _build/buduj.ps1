<#
  Static site generator for smoltech.com.ua
  Składa _build/pages/*.html + _build/szablon.html w gotowy HTML,
  potem zapisuje sitemap.xml. Uruchom z katalogu głównego repo:
      powershell -NoProfile -ExecutionPolicy Bypass -File _build\buduj.ps1
#>

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root '_build\szablon.html'))) {
  $root = (Get-Location).Path
}
$layout = [IO.File]::ReadAllText((Join-Path $root '_build\szablon.html'), [Text.Encoding]::UTF8)
$site = 'https://smoltech.com.ua'
$utf8 = New-Object Text.UTF8Encoding $false

$navKeys = @('company', 'machines', 'studs', 'video', 'contact')

$ldOrg = @'
{"@context":"https://schema.org","@graph":[
{"@type":"Organization","@id":"https://smoltech.com.ua/#org","name":"SMOLTECH Technika Zgrzewalnicza Sp. z o. o.","alternateName":"SMOLTECH","url":"https://smoltech.com.ua/","logo":{"@type":"ImageObject","url":"https://smoltech.com.ua/assets/img/logo.png","width":1181,"height":780},"image":"https://smoltech.com.ua/assets/img/og-default.jpg","description":"Виробник машин контактного зварювання: точкові, рельєфні та багатоточкові машини, автоматизовані й роботизовані зварювальні комплекси, машини для зварювання сіток та обладнання для приварювання шпильок.","email":"biuro@smoltech.pl","telephone":"+48713215427","faxNumber":"","vatID":"PL8971804142","taxID":"8971804142","foundingDate":"2015","address":{"@type":"PostalAddress","streetAddress":"st. Przyjazna 2","addressLocality":"Mokronos Dolny","postalCode":"55-080","addressRegion":"Dolnośląskie","addressCountry":"PL"},"geo":{"@type":"GeoCoordinates","latitude":51.0720771,"longitude":16.9260533},"areaServed":[{"@type":"Country","name":"Україна"},{"@type":"Country","name":"Polska"}],"knowsLanguage":["uk","pl","en"],"sameAs":["https://www.smoltech.pl","https://www.youtube.com/user/SMOLTECH/videos","https://www.instagram.com/smoltech_resistance_welding"],"contactPoint":[{"@type":"ContactPoint","telephone":"+48713215427","email":"biuro@smoltech.pl","contactType":"sales","availableLanguage":["uk","pl","en"]}]},
{"@type":"WebSite","@id":"https://smoltech.com.ua/#website","url":"https://smoltech.com.ua/","name":"SMOLTECH — машини контактного зварювання","inLanguage":"uk-UA","publisher":{"@id":"https://smoltech.com.ua/#org"}}
]}
'@

function Get-FrontMatter([string]$text) {
  $m = [regex]::Match($text, "(?s)^\s*---\r?\n(?<fm>.*?)\r?\n---\r?\n(?<body>.*)$")
  if (-not $m.Success) { throw 'missing front matter' }
  $meta = @{}
  foreach ($line in ($m.Groups['fm'].Value -split "`r?`n")) {
    if ($line.Trim() -eq '') { continue }
    $i = $line.IndexOf(':')
    if ($i -lt 1) { continue }
    $meta[$line.Substring(0, $i).Trim()] = $line.Substring($i + 1).Trim()
  }
  return @($meta, $m.Groups['body'].Value)
}

function Esc([string]$s) {
  return $s.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;').Replace('"', '&quot;')
}

function UkFromB64([string]$b64) {
  # Avoid depending on .ps1 source encoding for Ukrainian literals (WinPS 5).
  return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64))
}

function Build-Crumbs([string]$spec, [string]$url) {
  if ([string]::IsNullOrWhiteSpace($spec)) { return @('', '') }
  $parts = $spec -split '\s*\|\s*'
  $homeName = UkFromB64 '0JPQvtC70L7QstC90LA='   # Головна
  $navLabel = UkFromB64 '0J3QsNCy0ZbQs9Cw0YbRltGP' # Навігація
  $items = @(@{ name = $homeName; url = '/' })
  foreach ($p in $parts) {
    if ($p -match '^(?<n>.*?)>>(?<u>.*)$') {
      $items += @{ name = $Matches['n'].Trim(); url = $Matches['u'].Trim() }
    } else {
      $items += @{ name = $p.Trim(); url = $null }
    }
  }
  $li = New-Object Collections.Generic.List[string]
  $ld = New-Object Collections.Generic.List[string]
  for ($i = 0; $i -lt $items.Count; $i++) {
    $it = $items[$i]
    $last = ($i -eq $items.Count - 1)
    $target = if ($last) { $url } else { $it.url }
    if ($last) {
      $li.Add("<li aria-current=""page"">$(Esc $it.name)</li>")
    } else {
      $li.Add("<li><a href=""$($it.url)"">$(Esc $it.name)</a></li>")
    }
    $ld.Add("{""@type"":""ListItem"",""position"":$($i + 1),""name"":""$(Esc $it.name)"",""item"":""$site$target""}")
  }
  $html = "<nav class=""crumbs"" aria-label=""$navLabel""><div class=""wrap""><ol>$([string]::Join('', $li))</ol></div></nav>"
  $json = "<script type=""application/ld+json"">{""@context"":""https://schema.org"",""@type"":""BreadcrumbList"",""itemListElement"":[$([string]::Join(',', $ld))]}</script>"
  return @($html, $json)
}

# Bloki wielokrotnego użytku: _build\partials\formularz.html -> {{FORMULARZ}}
$partials = @{}
$partialDir = Join-Path $root '_build\partials'
if (Test-Path $partialDir) {
  Get-ChildItem $partialDir -Filter *.html | ForEach-Object {
    $token = '{{' + ($_.BaseName.ToUpper() -replace '[^A-Z0-9]', '_') + '}}'
    $partials[$token] = [IO.File]::ReadAllText($_.FullName, [Text.Encoding]::UTF8).Trim()
  }
}

function Expand-Partials([string]$html) {
  foreach ($t in $partials.Keys) { $html = $html.Replace($t, $partials[$t]) }
  return $html
}

$pages = Get-ChildItem (Join-Path $root '_build\pages') -Filter *.html | Sort-Object Name
$sitemap = New-Object Collections.Generic.List[string]
$built = 0

foreach ($f in $pages) {
  $raw = [IO.File]::ReadAllText($f.FullName, [Text.Encoding]::UTF8)
  $parsed = Get-FrontMatter $raw
  $meta = $parsed[0]
  $body = $parsed[1]

  foreach ($req in @('out', 'url', 'title', 'desc')) {
    if (-not $meta.ContainsKey($req)) { throw "$($f.Name): front matter missing '$req'" }
  }

  $crumbs = Build-Crumbs $meta['crumbs'] $meta['url']

  $alt = "<link rel=""alternate"" hreflang=""uk"" href=""$site$($meta['url'])"">"
  if ($meta.ContainsKey('pl') -and $meta['pl']) {
    $alt += "`n<link rel=""alternate"" hreflang=""pl"" href=""$($meta['pl'])"">"
  }
  $alt += "`n<link rel=""alternate"" hreflang=""x-default"" href=""$site$($meta['url'])"">"

  $html = $layout
  $html = $html.Replace('{{TITLE}}', (Esc $meta['title']))
  $html = $html.Replace('{{DESC}}', (Esc $meta['desc']))
  $html = $html.Replace('{{URL}}', $meta['url'])
  $html = $html.Replace('{{ALT}}', $alt)
  $html = $html.Replace('{{OG}}', $(if ($meta.ContainsKey('og')) { $meta['og'] } else { 'og-default.jpg' }))
  $html = $html.Replace('{{OGTYPE}}', $(if ($meta.ContainsKey('ogtype')) { $meta['ogtype'] } else { 'website' }))
  $html = $html.Replace('{{OGTITLE}}', (Esc $(if ($meta.ContainsKey('ogtitle')) { $meta['ogtitle'] } else { $meta['title'] })))
  $html = $html.Replace('{{HEAD}}', $(if ($meta.ContainsKey('head')) { $meta['head'] } else { '' }))
  $html = $html.Replace('{{LD_ORG}}', ($ldOrg -replace "\r?\n", ''))
  $html = $html.Replace('{{LD_CRUMBS}}', $crumbs[1])
  $html = $html.Replace('{{CRUMBS}}', '')
  $html = $html.Replace('{{CONTENT}}', (Expand-Partials $body.Trim()))

  $active = if ($meta.ContainsKey('nav')) { $meta['nav'] } else { '' }
  $bodyClass = if ($active) { "page-$active" } else { 'page' }
  $html = $html.Replace('{{BODY_CLASS}}', $bodyClass)
  foreach ($k in $navKeys) {
    $html = $html.Replace("{{NAV_$k}}", $(if ($k -eq $active) { ' is-active' } else { '' }))
  }

  $left = [regex]::Matches($html, '\{\{[A-Z_]+\}\}')
  if ($left.Count -gt 0) {
    throw "$($f.Name): unresolved placeholders -> $(($left | ForEach-Object { $_.Value }) -join ', ')"
  }

  $outPath = Join-Path $root $meta['out']
  $outDir = Split-Path $outPath -Parent
  if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
  [IO.File]::WriteAllText($outPath, $html, $utf8)
  $built++

  if (-not ($meta.ContainsKey('noindex') -and $meta['noindex'] -eq 'true')) {
    $prio = if ($meta.ContainsKey('prio')) { $meta['prio'] } else { '0.7' }
    $sitemap.Add("  <url><loc>$site$($meta['url'])</loc><changefreq>monthly</changefreq><priority>$prio</priority></url>")
  }
  Write-Output ("  {0,-52} -> {1}" -f $f.Name, $meta['out'])
}

$sm = @('<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') + $sitemap + @('</urlset>')
[IO.File]::WriteAllLines((Join-Path $root 'sitemap.xml'), $sm, $utf8)

Write-Output "--- built $built pages, $($sitemap.Count) sitemap entries ---"
