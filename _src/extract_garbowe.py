from pathlib import Path
import re
from html import unescape

p = Path(r"G:\smoltech.ua\_src\html\zgrzewarki-punktowo-garbowe-35-630kva.html")
t = p.read_text(encoding="utf-8", errors="replace")
hrefs = re.findall(r'href="(/zgrzewarki-punktowo-garbowe-35-630kva/[^"]+/)"', t)
titles = re.findall(r'<a href="(/zgrzewarki-punktowo-garbowe-35-630kva/[^"]+/)"[^>]*>(.*?)</a>', t, re.S)
print("HREFS")
seen = []
for h in hrefs:
    if h not in seen:
        seen.append(h)
        print(h)
print("TITLES")
seen2 = []
for h, title in titles:
    s = re.sub(r"<[^>]+>", " ", title)
    s = unescape(re.sub(r"\s+", " ", s)).strip()
    key = h + s
    if key in seen2:
        continue
    seen2.append(key)
    if s and len(s) > 8:
        print(h, "|", s[:140])
