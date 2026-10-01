# -*- coding: utf-8 -*-
import json
import re
from pathlib import Path

ROOT = Path(r"G:\smoltech.ua")
manifest = json.loads((ROOT / "_build" / "_client_manifest.json").read_text(encoding="utf-8"))
v = "20260909l1"

items = []
for it in manifest:
    n = it["n"]
    items.append(
        f'      <li><img src="/assets/img/client-full-{n:02d}.webp?v={v}" alt="" '
        f'width="{it["w"]}" height="{it["h"]}" loading="lazy" decoding="async"></li>'
    )
wall = "    <ul class=\"client-wall rv rv-d1\">\n" + "\n".join(items) + "\n    </ul>"

# Homepage marquee: 12 sharper / well-known marks
home_ns = [2, 3, 7, 12, 15, 17, 19, 25, 29, 58, 60, 61]
by_n = {it["n"]: it for it in manifest}
home_bits = ['      <div class="logos__track">']
for n in home_ns:
    it = by_n[n]
    home_bits.append(
        f'        <div class="logos__item"><img src="/assets/img/client-full-{n:02d}.webp?v={v}" '
        f'alt="Логотип замовника SMOLTECH" width="{it["w"]}" height="{it["h"]}" '
        f'loading="lazy" decoding="async"></div>'
    )
home_bits.append("      </div>")
home_track = "\n".join(home_bits)

wall_re = re.compile(r'    <ul class="client-wall rv rv-d1">.*?</ul>', re.S)
home_re = re.compile(
    r'      <div class="logos__track">\n(?:        <div class="logos__item">.*?\n)+      </div>\n',
    re.S,
)

files_wall = [
    ROOT / "_build" / "pages" / "10-pro-kompaniyu.html",
    ROOT / "pro-kompaniyu" / "index.html",
]
files_home = [
    ROOT / "_build" / "pages" / "00-strona-glowna.html",
    ROOT / "index.html",
]

for p in files_wall:
    txt = p.read_text(encoding="utf-8")
    nxt, n = wall_re.subn(wall, txt, count=1)
    if n != 1:
        raise SystemExit(f"wall miss {p}")
    p.write_text(nxt, encoding="utf-8")
    print("wall", p.name)

for p in files_home:
    txt = p.read_text(encoding="utf-8")
    nxt, n = home_re.subn(home_track + "\n", txt, count=1)
    if n != 1:
        raise SystemExit(f"home miss {p}")
    p.write_text(nxt, encoding="utf-8")
    print("home", p.name)

print("ok")
