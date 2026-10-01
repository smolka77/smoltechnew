# -*- coding: utf-8 -*-
from pathlib import Path
import re
out = []
m = Path(r"G:/smoltech.ua/_src/missing-en.txt").read_text(encoding="utf-8").strip()
out.append("missing " + repr(m) + " " + str([hex(ord(c)) for c in m]))
js = Path(r"G:/smoltech.ua/assets/js/tlumaczenia.js").read_text(encoding="utf-8")
for line in js.splitlines():
    if "1400" in line:
        out.append("js " + repr(line[:120]))
keys = set(re.findall(r"(?m)^[ \t]+'((?:\\'|[^'])*)'\s*:", js))
keys = {k.replace("\\'", "'") for k in keys}
out.append("in dict " + str(m in keys))
for k in keys:
    if "1400" in k:
        out.append("key " + repr(k) + " " + str([hex(ord(c)) for c in k]))
# also check how HTML has it
html = Path(r"G:/smoltech.ua/invertorne-pryvaryuvannya-da/index.html").read_text(encoding="utf-8")
for line in html.splitlines():
    if "1400" in line:
        out.append("html " + repr(line.strip()[:120]))
Path(r"G:/smoltech.ua/_src/check1400-out.txt").write_text("\n".join(out), encoding="utf-8")
print("wrote")
