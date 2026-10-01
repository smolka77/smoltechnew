$ProgressPreference = 'SilentlyContinue'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
$dst = Join-Path (Get-Location).Path 'assets\fonts'
New-Item -ItemType Directory -Force -Path $dst | Out-Null

$css = [IO.File]::ReadAllText('_src\czcionki.css', [Text.Encoding]::UTF8)
$blocks = [regex]::Matches($css, "(?s)/\* (?<sub>[a-z\-]+) \*/\s*@font-face \{(?<body>.*?)\}")
$keep = @('latin', 'latin-ext', 'cyrillic', 'cyrillic-ext')
$faces = New-Object Collections.Generic.List[string]

foreach ($b in $blocks) {
  $sub = $b.Groups['sub'].Value
  if ($keep -notcontains $sub) { continue }
  $body = $b.Groups['body'].Value
  $fam = ([regex]::Match($body, "font-family: '([^']+)'")).Groups[1].Value
  $wght = ([regex]::Match($body, 'font-weight: ([^;]+);')).Groups[1].Value.Trim()
  $url = ([regex]::Match($body, 'url\((https://[^\)]+)\)')).Groups[1].Value
  $range = ([regex]::Match($body, 'unicode-range: ([^;]+);')).Groups[1].Value.Trim()

  $file = "$($fam.ToLower())-$sub.woff2"
  $path = Join-Path $dst $file
  if (-not (Test-Path $path)) {
    try {
      $r = Invoke-WebRequest -Uri $url -UseBasicParsing -UserAgent $ua
      [IO.File]::WriteAllBytes($path, $r.Content)
    } catch { Write-Output "FAIL $file :: $($_.Exception.Message)"; continue }
  }
  Write-Output ("OK  {0,-30} {1,7}" -f $file, (Get-Item $path).Length)

  $faces.Add("@font-face{font-family:'$fam';font-style:normal;font-weight:$wght;font-display:swap;src:url(../fonts/$file) format('woff2');unicode-range:$range}")
}

[IO.File]::WriteAllLines((Join-Path $dst 'czcionki.css'), $faces, (New-Object Text.UTF8Encoding $false))
Write-Output "faces: $($faces.Count)"
Write-Output "bytes: $((Get-ChildItem $dst -Filter *.woff2 | Measure-Object Length -Sum).Sum)"
