# Download YouTube thumbnails locally, normalised to 640x360 JPEG.
# Keeps the video page free of third-party requests until the user clicks play.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root = (Get-Location).Path
$dst = Join-Path $root 'assets\img\yt'
if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Force -Path $dst | Out-Null }

$ids = @()
foreach ($l in [IO.File]::ReadAllLines((Join-Path $root '_src\yt-tytuly.txt'), [Text.Encoding]::UTF8)) {
  $p = $l -split "`t"
  if ($p[0] -eq 'VID') { $ids += $p[1].Trim() }
}

# JPEG encoder at quality 78 - plenty for a 640px card thumbnail
$enc = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$prm = New-Object Drawing.Imaging.EncoderParameters 1
$prm.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), 78

$ok = 0; $fail = @()
foreach ($id in $ids) {
  $out = Join-Path $dst "$id.jpg"
  if (Test-Path $out) { $ok++; continue }

  $bytes = $null
  foreach ($name in @('maxresdefault', 'sddefault', 'hqdefault', 'mqdefault')) {
    try {
      $bytes = (Invoke-WebRequest -Uri "https://i.ytimg.com/vi/$id/$name.jpg" -TimeoutSec 25).Content
      if ($bytes.Length -gt 3000) { break }
      $bytes = $null
    } catch { $bytes = $null }
  }
  if (-not $bytes) { $fail += $id; continue }

  $ms = New-Object IO.MemoryStream (, $bytes)
  $src = [Drawing.Image]::FromStream($ms)

  # sddefault/hqdefault are 4:3 with letterbox bars - crop back to 16:9
  $sw = $src.Width; $sh = $src.Height
  $want = 16 / 9
  if ([Math]::Abs(($sw / $sh) - $want) -gt 0.02) {
    $ch = [int][Math]::Round($sw / $want)
    if ($ch -le $sh) { $cy = [int](($sh - $ch) / 2); $crop = New-Object Drawing.Rectangle 0, $cy, $sw, $ch }
    else { $cw = [int][Math]::Round($sh * $want); $cx = [int](($sw - $cw) / 2); $crop = New-Object Drawing.Rectangle $cx, 0, $cw, $sh }
  } else {
    $crop = New-Object Drawing.Rectangle 0, 0, $sw, $sh
  }

  $bmp = New-Object Drawing.Bitmap 640, 360
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($src, (New-Object Drawing.Rectangle 0, 0, 640, 360), $crop, [Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $bmp.Save($out, $enc, $prm)
  $bmp.Dispose(); $src.Dispose(); $ms.Dispose()
  $ok++
  Write-Output ("  {0}  {1} KB" -f $id, [int]((Get-Item $out).Length / 1024))
}

Write-Output "--- $ok thumbnails ready in assets\img\yt ---"
if ($fail.Count) { Write-Output "FAILED: $($fail -join ', ')" }
