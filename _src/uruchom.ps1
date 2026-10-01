param([int]$Port = 8099)

$root = (Get-Location).Path
$py = Get-Command python -ErrorAction SilentlyContinue
$server = Join-Path $root '_src\serwer.py'

if ($py -and (Test-Path $server)) {
  Write-Output "serving $root on http://localhost:$Port/ (panel + form)"
  & python $server --port $Port
  exit $LASTEXITCODE
}

$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "serving $root on http://localhost:$Port/ (static only — install Python for the admin panel)"

$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json'; '.xml' = 'application/xml; charset=utf-8'
  '.txt' = 'text/plain; charset=utf-8'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
  '.png' = 'image/png'; '.webp' = 'image/webp'; '.svg' = 'image/svg+xml'
  '.ico' = 'image/x-icon'; '.woff2' = 'font/woff2'
}

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    $blocked = $rel -match '^(?i)(_private|_src|_build)(/|\\|$)' -or $rel -match '(?i)(^|[/\\])(auth\.env|magazyn\.php|zapytania\.json|limity-logowan\.json|store\.php|inquiries\.json|login-rl\.json)$'
    if ($blocked) {
      $deny = [Text.Encoding]::UTF8.GetBytes('Forbidden')
      $ctx.Response.StatusCode = 403
      $ctx.Response.ContentType = 'text/plain; charset=utf-8'
      $ctx.Response.OutputStream.Write($deny, 0, $deny.Length)
      $ctx.Response.OutputStream.Close()
      continue
    }
    if ($rel -eq '' -or $rel.EndsWith('/')) { $rel = $rel + 'index.html' }
    $path = Join-Path $root ($rel -replace '/', '\')
    if (-not (Test-Path $path -PathType Leaf)) {
      $alt = Join-Path $path 'index.html'
      if (Test-Path $alt -PathType Leaf) { $path = $alt }
    }
    if (Test-Path $path -PathType Leaf) {
      $bytes = [IO.File]::ReadAllBytes($path)
      $ext = [IO.Path]::GetExtension($path).ToLower()
      $ctx.Response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $ctx.Response.StatusCode = 200
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $nf = Join-Path $root '404.html'
      $ctx.Response.StatusCode = 404
      $ctx.Response.ContentType = 'text/html; charset=utf-8'
      $bytes = if (Test-Path $nf) { [IO.File]::ReadAllBytes($nf) } else { [Text.Encoding]::UTF8.GetBytes('404') }
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Output "404 $rel"
    }
    $ctx.Response.OutputStream.Close()
  } catch {
    Write-Output "err: $($_.Exception.Message)"
  }
}
