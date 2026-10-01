$ProgressPreference = 'SilentlyContinue'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
$root = (Get-Location).Path
$dst = Join-Path $root 'assets\img'
New-Item -ItemType Directory -Force -Path $dst | Out-Null

function Fetch([string]$u, [string]$accept) {
  for ($try = 1; $try -le 4; $try++) {
    try {
      return Invoke-WebRequest -Uri $u -UseBasicParsing -UserAgent $script:ua -Headers @{ 'Accept' = $accept }
    } catch {
      Start-Sleep -Milliseconds (600 * $try)
    }
  }
  return $null
}

$rows = Get-Content '_src\obrazy.txt' -Encoding UTF8 | Where-Object { $_.Trim() -ne '' }
$ok = 0; $fail = 0

foreach ($row in $rows) {
  $p = $row.Split('|')
  $src = $p[0]; $name = $p[1]; $w = $p[2]
  $base = [IO.Path]::GetFileNameWithoutExtension($name)
  $ext = [IO.Path]::GetExtension($name)
  $url = "https://exgic2b95c2.exactdn.com/wp-content/uploads/$src`?strip=all&quality=82&w=$w"

  # WebP variant
  $webpPath = Join-Path $dst "$base.webp"
  if (-not (Test-Path $webpPath)) {
    $r = Fetch $url 'image/webp,image/*'
    if ($r -and $r.Headers['Content-Type'] -match 'webp') { [IO.File]::WriteAllBytes($webpPath, $r.Content) }
  }

  # Fallback variant straight from origin (exactdn refuses non-webp on cache miss)
  $fbPath = Join-Path $dst "$base$ext"
  if (-not (Test-Path $fbPath)) {
    $r2 = Fetch "https://smoltech.pl/wp-content/uploads/$src" '*/*'
    if ($r2) { [IO.File]::WriteAllBytes($fbPath, $r2.Content) }
    else { $fail++; Write-Output "FAIL $name"; continue }
  }

  $wSize = if (Test-Path $webpPath) { (Get-Item $webpPath).Length } else { 0 }
  $fSize = if (Test-Path $fbPath) { (Get-Item $fbPath).Length } else { 0 }
  Write-Output ("OK  {0,-32} webp={1,8} fb={2,8}" -f $name, $wSize, $fSize)
  $ok++
  Start-Sleep -Milliseconds 250
}
Write-Output "--- ok=$ok fail=$fail ---"
