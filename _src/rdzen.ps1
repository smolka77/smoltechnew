Get-ChildItem "_src\text" -Filter *.txt | ForEach-Object {
  $lines = [IO.File]::ReadAllLines($_.FullName, [Text.Encoding]::UTF8)
  $out = New-Object Collections.Generic.List[string]
  $started = $false
  foreach ($l in $lines) {
    if (-not $started) {
      if ($l -match '^### H[12]:') { $started = $true } else {
        if ($l -match '^(FILE|TITLE|DESC):') { $out.Add($l) }
        continue
      }
    }
    if ($l -match 'Zarz.dzanie zgod.' -or $l -match '^### H3: \[\[/aktualnosci/\]\]') { break }
    $out.Add($l)
  }
  $target = "_src\core\" + $_.BaseName + ".txt"
  [IO.File]::WriteAllLines($target, $out, [Text.Encoding]::UTF8)
  Write-Output "$($_.BaseName): $($out.Count)"
}
