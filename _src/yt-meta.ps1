# Pobiera tytuły YouTube dla ID z filmy.txt -> yt-tytuly.txt
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $dir 'filmy.txt'
$out = Join-Path $dir 'yt-tytuly.txt'
$lines = New-Object Collections.Generic.List[string]

foreach ($l in [IO.File]::ReadAllLines($src, [Text.Encoding]::UTF8)) {
  $p = $l -split "`t", 2
  if ($p.Count -lt 2) { continue }
  if ($p[0] -ne 'VID') { $lines.Add($l); continue }
  $id = $p[1].Trim()
  $title = ''
  for ($try = 1; $try -le 3; $try++) {
    try {
      $u = "https://www.youtube.com/oembed?url=https%3A//www.youtube.com/watch%3Fv%3D$id&format=json"
      $r = Invoke-RestMethod -Uri $u -Headers @{ 'Accept-Language' = 'pl-PL,pl;q=0.9' } -TimeoutSec 25
      $title = $r.title
      break
    } catch {
      Start-Sleep -Milliseconds (500 * $try)
    }
  }
  if (-not $title) { $title = '!! FAILED' }
  $lines.Add("VID`t$id`t$title")
  Write-Output "$id  $title"
}

[IO.File]::WriteAllLines($out, $lines, (New-Object Text.UTF8Encoding $false))
Write-Output "--- wrote $out ---"
