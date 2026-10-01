$dst = Join-Path (Get-Location).Path 'assets\img'
$ProgressPreference = 'SilentlyContinue'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'

function Sniff([string]$path) {
  $b = [IO.File]::ReadAllBytes($path)
  if ($b.Length -lt 12) { return 'unknown' }
  if ($b[0] -eq 0x89 -and $b[1] -eq 0x50) { return 'png' }
  if ($b[0] -eq 0xFF -and $b[1] -eq 0xD8) { return 'jpg' }
  if ($b[0] -eq 0x52 -and $b[8] -eq 0x57) { return 'webp' }
  if ($b[0] -eq 0x3C) { return 'html' }
  return 'unknown'
}

# 1. Correct extensions on fallbacks
Get-ChildItem $dst -File | Where-Object { $_.Extension -in '.jpg', '.png' } | ForEach-Object {
  $real = Sniff $_.FullName
  $cur = $_.Extension.TrimStart('.').ToLower()
  if ($real -eq 'html' -or $real -eq 'unknown') { Write-Output "BAD  $($_.Name) -> $real"; return }
  if ($real -ne $cur) {
    $target = Join-Path $dst ($_.BaseName + '.' + $real)
    Move-Item $_.FullName $target -Force
    Write-Output "REN  $($_.Name) -> $($_.BaseName).$real"
  }
}

# 2. Favicons + OG image derived from brand assets
$jobs = @(
  @{ src = '2025/03/Logo-Smoltech-512.png'; q = 'w=32';  out = 'favicon-32.png' },
  @{ src = '2025/03/Logo-Smoltech-512.png'; q = 'w=180'; out = 'apple-touch-icon.png' },
  @{ src = '2025/03/Logo-Smoltech-512.png'; q = 'w=192'; out = 'icon-192.png' },
  @{ src = '2025/03/Logo-Smoltech-512.png'; q = 'w=512'; out = 'icon-512.png' },
  @{ src = '2025/07/Smoltech-automatyzacja-zgrzewania-3.png'; q = 'resize=1200,630'; out = 'og-default.jpg' },
  @{ src = '2020/03/zgrzewarki_specializowane.jpg'; q = 'resize=1200,630'; out = 'og-automation.jpg' },
  @{ src = '2022/09/zgrzewarki.jpg'; q = 'resize=1200,630'; out = 'og-mesh.jpg' },
  @{ src = '2020/03/zgrzewarki_podstawowe.jpg'; q = 'resize=1200,630'; out = 'og-basic.jpg' },
  @{ src = '2024/02/seria-CDM-1.png'; q = 'resize=1200,630'; out = 'og-studs.jpg' }
)
foreach ($j in $jobs) {
  $p = Join-Path $dst $j.out
  if (Test-Path $p) { continue }
  $accept = if ($j.out -like '*.png') { 'image/png' } else { 'image/jpeg' }
  $u = "https://exgic2b95c2.exactdn.com/wp-content/uploads/$($j.src)?strip=all&$($j.q)"
  # Warm the CDN transform with a webp request first; exactdn 400s on a
  # non-webp Accept until the derivative exists.
  try { Invoke-WebRequest -Uri $u -UseBasicParsing -UserAgent $ua -Headers @{ 'Accept' = 'image/webp,image/*' } | Out-Null } catch { }
  Start-Sleep -Milliseconds 1200
  for ($t = 1; $t -le 5; $t++) {
    try {
      $r = Invoke-WebRequest -Uri $u -UseBasicParsing -UserAgent $ua -Headers @{ 'Accept' = $accept }
      [IO.File]::WriteAllBytes($p, $r.Content)
      Write-Output "GEN  $($j.out) $((Get-Item $p).Length) ct=$($r.Headers['Content-Type'])"
      break
    } catch { Start-Sleep -Milliseconds (1500 * $t) }
  }
  if (-not (Test-Path $p)) { Write-Output "FAIL $($j.out)" }
}

Write-Output "--- inventory ---"
Get-ChildItem $dst -File | Group-Object Extension | ForEach-Object { Write-Output "$($_.Name): $($_.Count)" }
$tot = (Get-ChildItem $dst -File | Measure-Object Length -Sum).Sum
Write-Output "total bytes: $tot"
