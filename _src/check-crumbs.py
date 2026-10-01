# -*- coding: utf-8 -*-
from pathlib import Path
import re
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

t = Path(r"G:/smoltech.ua/tochkovo-relyefni-mashyny/index.html").read_text(encoding="utf-8")
m = re.search(r'<nav class="crumbs".*?</nav>', t)
print(m.group(0) if m else "NO CRUMBS")
print("---")
print("Головна OK:", "Головна" in (m.group(0) if m else ""))
print("Навігація OK:", "Навігація" in (m.group(0) if m else ""))
print("mojibake Đ:", "Đ" in (m.group(0) if m else ""))

idx = Path(r"G:/smoltech.ua/index.html").read_text(encoding="utf-8")
print("ldOrg Виробник:", "Виробник машин" in idx)
