Add-Type -AssemblyName System.Drawing
$dst = Join-Path (Get-Location).Path 'assets\img'

function Save-Jpeg([System.Drawing.Bitmap]$bmp, [string]$path, [int]$quality) {
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $prm = New-Object System.Drawing.Imaging.EncoderParameters 1
  $prm.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $quality
  $bmp.Save($path, $codec, $prm)
  $prm.Dispose()
}

function New-Canvas([int]$w, [int]$h) {
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  return @($bmp, $g)
}

# --- square icons from the brand mark (transparency preserved) ---
$logoPath = Join-Path $dst 'logo-square.png'
$icons = @{ 'favicon-32.png' = 32; 'favicon-48.png' = 48; 'apple-touch-icon.png' = 180; 'icon-192.png' = 192; 'icon-512.png' = 512 }
$src = [System.Drawing.Image]::FromFile($logoPath)
foreach ($k in $icons.Keys) {
  $size = $icons[$k]
  $c = New-Canvas $size $size
  $bmp = $c[0]; $g = $c[1]
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.DrawImage($src, 0, 0, $size, $size)
  $out = Join-Path $dst $k
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Output "ICON $k $((Get-Item $out).Length)"
}
$src.Dispose()

# --- favicon.ico wrapping the 32px PNG ---
$png = [IO.File]::ReadAllBytes((Join-Path $dst 'favicon-32.png'))
$ms = New-Object IO.MemoryStream
$bw = New-Object IO.BinaryWriter $ms
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]1)
$bw.Write([Byte]32); $bw.Write([Byte]32); $bw.Write([Byte]0); $bw.Write([Byte]0)
$bw.Write([UInt16]1); $bw.Write([UInt16]32)
$bw.Write([UInt32]$png.Length); $bw.Write([UInt32]22)
$bw.Write($png); $bw.Flush()
[IO.File]::WriteAllBytes((Join-Path (Get-Location).Path 'favicon.ico'), $ms.ToArray())
$bw.Dispose(); $ms.Dispose()
Write-Output "ICO  favicon.ico $((Get-Item 'favicon.ico').Length)"

# --- Open Graph cards: 1200x630 centre crop ---
$og = @(
  @{ src = 'hero-automation.png';   out = 'og-default.jpg' },
  @{ src = 'area-automation.jpg';   out = 'og-automation.jpg' },
  @{ src = 'area-mesh.jpg';         out = 'og-mesh.jpg' },
  @{ src = 'area-basic.jpg';        out = 'og-basic.jpg' },
  @{ src = 'stud-cdm-series.png';   out = 'og-studs.jpg' },
  @{ src = 'company-hall-2.png';    out = 'og-company.jpg' },
  @{ src = 'auto-1.jpg';            out = 'og-video.jpg' },
  @{ src = 'company-office.jpg';    out = 'og-contact.jpg' },
  @{ src = 'comp-robotics.png';     out = 'og-competence.jpg' }
)
foreach ($j in $og) {
  $inPath = Join-Path $dst $j.src
  if (-not (Test-Path $inPath)) { Write-Output "SKIP $($j.src) missing"; continue }
  $img = [System.Drawing.Image]::FromFile($inPath)
  $tw = 1200; $th = 630
  $scale = [Math]::Max($tw / $img.Width, $th / $img.Height)
  $sw = [int][Math]::Ceiling($img.Width * $scale)
  $sh = [int][Math]::Ceiling($img.Height * $scale)
  $c = New-Canvas $tw $th
  $bmp = $c[0]; $g = $c[1]
  $g.Clear([System.Drawing.Color]::FromArgb(255, 12, 14, 18))
  $g.DrawImage($img, [int](($tw - $sw) / 2), [int](($th - $sh) / 2), $sw, $sh)
  $out = Join-Path $dst $j.out
  Save-Jpeg $bmp $out 84
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  Write-Output "OG   $($j.out) $((Get-Item $out).Length)"
}

# --- shrink oversized PNG fallbacks to JPEG ---
$heavy = Get-ChildItem $dst -File | Where-Object { $_.Extension -in '.png', '.jpg' -and $_.Length -gt 250000 -and $_.BaseName -notlike 'logo*' -and $_.BaseName -notlike 'icon-*' }
foreach ($f in $heavy) {
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  $maxW = 1600
  $w = [Math]::Min($img.Width, $maxW)
  $h = [int][Math]::Round($img.Height * ($w / $img.Width))
  $c = New-Canvas $w $h
  $bmp = $c[0]; $g = $c[1]
  $g.Clear([System.Drawing.Color]::White)
  $g.DrawImage($img, 0, 0, $w, $h)
  $target = Join-Path $dst ($f.BaseName + '.jpg')
  $old = $f.Length
  $img.Dispose()
  Save-Jpeg $bmp $target 82
  $g.Dispose(); $bmp.Dispose()
  if ($f.Extension -eq '.png' -and (Test-Path $target)) { Remove-Item $f.FullName -Force }
  Write-Output ("SHRK {0,-26} {1,9} -> {2,9}" -f $f.Name, $old, (Get-Item $target).Length)
}

Write-Output "--- totals ---"
Get-ChildItem $dst -File | Group-Object Extension | ForEach-Object { Write-Output "$($_.Name): $($_.Count)" }
Write-Output "bytes: $((Get-ChildItem $dst -File | Measure-Object Length -Sum).Sum)"
