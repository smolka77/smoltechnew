# -*- coding: utf-8 -*-
from pathlib import Path

ps1 = Path(r"G:/smoltech.ua/_build/buduj.ps1")
raw = ps1.read_bytes()
# strip existing BOM if any
if raw.startswith(b"\xef\xbb\xbf"):
    raw = raw[3:]
text = raw.decode("utf-8")
# ensure crumb literals are correct Ukrainian
if "name = 'Головна'" not in text and "name = \"Головна\"" not in text:
    # try to fix if already mojibake in source (unlikely if file is utf-8 on disk)
    print("WARNING: Головна literal not found as expected")
else:
    print("OK: Головна present in source UTF-8")
if "Навігація" not in text:
    print("WARNING: Навігація missing")
else:
    print("OK: Навігація present")

# Write UTF-8 with BOM so Windows PowerShell 5 parses Cyrillic literals correctly
ps1.write_bytes(b"\xef\xbb\xbf" + text.encode("utf-8"))
print("Wrote UTF-8 BOM to buduj.ps1")
