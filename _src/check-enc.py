# -*- coding: utf-8 -*-
from pathlib import Path
import base64
import re

root = Path(r"G:/smoltech.ua")
c = (root / "tochkovo-relyefni-mashyny/index.html").read_text(encoding="utf-8")
m2 = re.search(r'class="crumbs"[^>]*>.*?</nav>', c)
print("crumbs:", ascii(m2.group(0)[:220]) if m2 else None)

ps1 = (root / "_build/buduj.ps1").read_bytes()
print("ps1 starts:", ps1[:4])
gol = "Головна".encode("utf-8")
print("Головна in ps1 as utf8?", gol in ps1)
print("base64 Головна", base64.b64encode("Головна".encode()).decode())
print("base64 Навігація", base64.b64encode("Навігація".encode()).decode())

idx = (root / "index.html").read_text(encoding="utf-8")
if "Виробник машин" in idx:
    print("ldOrg UK OK")
elif "Đ" in idx or "Ð" in idx:
    print("ldOrg looks mojibake")
else:
    print("ldOrg: no Виробник — checking snippet")
    m = re.search(r'"description":"([^"]{30,90})"', idx)
    print(ascii(m.group(1)) if m else "none")
