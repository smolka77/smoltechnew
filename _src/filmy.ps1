$c = [IO.File]::ReadAllText("_src\html\zgrzewarki-do-metalu-realizacje.html", [Text.Encoding]::UTF8)
$c = [regex]::Replace($c, '(?s)<script.*?</script>', ' ')
$c = [regex]::Replace($c, '(?s)<style.*?</style>', ' ')

$rx = 'data-vid="(?<vid>[A-Za-z0-9_-]{6,20})"|<h(?<hl>[1-6])[^>]*>(?<htxt>.*?)</h\k<hl>>'
$out = New-Object Collections.Generic.List[string]
foreach ($m in [regex]::Matches($c, $rx, 'Singleline')) {
  if ($m.Groups['vid'].Success) {
    $out.Add("VID`t" + $m.Groups['vid'].Value)
  } else {
    $t = [regex]::Replace($m.Groups['htxt'].Value, '<[^>]+>', ' ')
    $t = [System.Net.WebUtility]::HtmlDecode($t)
    $t = [regex]::Replace($t, '\s+', ' ').Trim()
    if ($t -ne '') { $out.Add("H$($m.Groups['hl'].Value)`t$t") }
  }
}
[IO.File]::WriteAllLines("_src\filmy.txt", $out, [Text.Encoding]::UTF8)
Write-Output "rows=$($out.Count)"
