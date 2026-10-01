param([string]$Dir = "_src\html", [string]$Out = "_src\text")
New-Item -ItemType Directory -Force -Path $Out | Out-Null

function Decode([string]$s) {
  $s = $s -replace '&nbsp;', ' '
  $s = [System.Net.WebUtility]::HtmlDecode($s)
  return $s
}

Get-ChildItem $Dir -Filter *.html | ForEach-Object {
  $raw = [IO.File]::ReadAllText($_.FullName, [Text.Encoding]::UTF8)

  # title / meta
  $title = ([regex]::Match($raw, '(?s)<title>(.*?)</title>')).Groups[1].Value
  $desc = ([regex]::Match($raw, '(?is)<meta name="description" content="(.*?)"')).Groups[1].Value

  # images (exclude tiny/ui)
  $imgs = [regex]::Matches($raw, '(?i)(?:src|data-src)="(https://[^"]+?\.(?:jpe?g|png|webp|svg))') |
          ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique

  # main content region
  $body = $raw
  $m = [regex]::Match($raw, '(?s)<main[^>]*>(.*)</main>')
  if ($m.Success) { $body = $m.Groups[1].Value }

  # strip noise
  $body = [regex]::Replace($body, '(?s)<script.*?</script>', ' ')
  $body = [regex]::Replace($body, '(?s)<style.*?</style>', ' ')
  $body = [regex]::Replace($body, '(?s)<noscript.*?</noscript>', ' ')
  $body = [regex]::Replace($body, '(?s)<svg.*?</svg>', ' ')
  $body = [regex]::Replace($body, '(?s)<!--.*?-->', ' ')

  # keep semantics as markers
  $body = [regex]::Replace($body, '(?i)<h([1-6])[^>]*>', "`n`n### H`$1: ")
  $body = [regex]::Replace($body, '(?i)</h[1-6]>', "`n")
  $body = [regex]::Replace($body, '(?i)<li[^>]*>', "`n- ")
  $body = [regex]::Replace($body, '(?i)<(p|div|br|tr|section)[^>]*>', "`n")
  $body = [regex]::Replace($body, '(?i)<td[^>]*>', " | ")
  $body = [regex]::Replace($body, '(?i)<a[^>]+href="([^"]+)"[^>]*>', ' [[$1]] ')
  $body = [regex]::Replace($body, '<[^>]+>', ' ')
  $body = Decode $body
  $body = [regex]::Replace($body, '[ \t]{2,}', ' ')
  $body = [regex]::Replace($body, '(\r?\n[ \t]*){3,}', "`n`n")
  $lines = $body -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

  $sb = New-Object Text.StringBuilder
  [void]$sb.AppendLine("FILE: $($_.Name)")
  [void]$sb.AppendLine("TITLE: $(Decode $title)")
  [void]$sb.AppendLine("DESC: $(Decode $desc)")
  [void]$sb.AppendLine("IMAGES:")
  foreach ($i in $imgs) { [void]$sb.AppendLine("  $i") }
  [void]$sb.AppendLine("CONTENT:")
  foreach ($l in $lines) { [void]$sb.AppendLine($l) }

  $target = Join-Path $Out ($_.BaseName + ".txt")
  [IO.File]::WriteAllText($target, $sb.ToString(), [Text.Encoding]::UTF8)
  Write-Output "$($_.BaseName): $($lines.Count) lines, $($imgs.Count) imgs"
}
