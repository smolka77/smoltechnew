Add-Type -AssemblyName System.Drawing
$dst = Join-Path (Get-Location).Path 'assets\img'
$src = [System.Drawing.Bitmap]::new((Join-Path $dst 'logo.png'))

# The stacked logo is mark-on-top + wordmark below, separated by a soft reflection.
# Find the tight bounding box of the mark by scanning only the upper region.
$limit = 384
$minX = $src.Width; $maxX = 0; $minY = $src.Height; $maxY = 0
for ($y = 0; $y -lt $limit; $y++) {
  for ($x = 0; $x -lt $src.Width; $x++) {
    $c = $src.GetPixel($x, $y)
    $solid = ($c.A -gt 40) -and (($c.R -lt 225) -or ($c.G -lt 225) -or ($c.B -lt 225))
    if ($solid) {
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
Write-Output "mark bbox: x $minX..$maxX  y $minY..$maxY"

$w = $maxX - $minX + 1
$h = $maxY - $minY + 1
$side = [Math]::Max($w, $h)
$pad = [int]($side * 0.04)
$out = $side + 2 * $pad

$bmp = New-Object System.Drawing.Bitmap $out, $out
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)
$dx = $pad + [int](($side - $w) / 2)
$dy = $pad + [int](($side - $h) / 2)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle $dx, $dy, $w, $h), (New-Object System.Drawing.Rectangle $minX, $minY, $w, $h), [System.Drawing.GraphicsUnit]::Pixel)

$full = Join-Path $dst 'mark.png'
$bmp.Save($full, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "mark.png ${out}x${out} $((Get-Item $full).Length) bytes"

# 128px working copy for the header/footer lockup
$small = New-Object System.Drawing.Bitmap 128, 128
$g2 = [System.Drawing.Graphics]::FromImage($small)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g2.Clear([System.Drawing.Color]::Transparent)
$g2.DrawImage($bmp, 0, 0, 128, 128)
$p128 = Join-Path $dst 'mark-128.png'
$small.Save($p128, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "mark-128.png $((Get-Item $p128).Length) bytes"

$g2.Dispose(); $small.Dispose(); $g.Dispose(); $bmp.Dispose(); $src.Dispose()
