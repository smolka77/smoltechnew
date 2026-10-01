from pathlib import Path
import re
from html import unescape

html_dir = Path(r"G:\smoltech.ua\_src\html")
out_dir = Path(r"G:\smoltech.ua\_src\_extract")
out_dir.mkdir(exist_ok=True)

files = [
    "zgrzewarki-podwieszane-25-90-kva__zgrzewarki-punktowe-kleszczowe-16-38kva.html",
    "zgrzewarki-podwieszane-25-90-kva__zgrzewarki-podwieszane-56-90-kva.html",
    "zgrzewarki-punktowe-16-150kva__zgrzewarki-punktowe-stacjonarne.html",
    "zgrzewarki-punktowe-16-150kva__zgrzewarki-inwertorowe-punktowe.html",
    "zgrzewarka-punktowa__zgrzewarki-wielofunkcyjne-e-tech.html",
    "zgrzewarki-punktowo-garbowe-35-630kva.html",
    "zgrzewarki-punktowe-16-150kva.html",
]


def strip_tags(s: str) -> str:
    s = re.sub(r"<br\s*/?>", " | ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = unescape(s)
    return re.sub(r"\s+", " ", s).strip()


for name in files:
    p = html_dir / name
    lines = []
    if not p.exists():
        print("MISSING", name)
        continue
    t = p.read_text(encoding="utf-8", errors="replace")
    lines.append(f"FILE {name} len={len(t)}")
    hs = re.findall(r"<h[1-3][^>]*>(.*?)</h[1-3]>", t, re.I | re.S)
    for h in hs:
        s = strip_tags(h)
        if s and len(s) < 200 and "menu" not in s.lower():
            lines.append(f"H: {s}")
    tables = re.findall(r"<table[\s\S]*?</table>", t, re.I)
    lines.append(f"TABLES {len(tables)}")
    for i, tb in enumerate(tables):
        rows = re.findall(r"<tr[\s\S]*?</tr>", tb, re.I)
        lines.append(f" TABLE {i} rows={len(rows)}")
        for r in rows:
            cells = re.findall(r"<t[hd][^>]*>([\s\S]*?)</t[hd]>", r, re.I)
            cleaned = [strip_tags(c) for c in cells]
            if any(cleaned):
                lines.append("  | " + " || ".join(cleaned))
    yts = set(re.findall(r"youtube\.com/(?:embed/|shorts/|watch\?v=)([A-Za-z0-9_-]{6,})", t))
    yts |= set(re.findall(r"youtu\.be/([A-Za-z0-9_-]{6,})", t))
    lines.append("YT " + ", ".join(sorted(yts)))
    imgs = re.findall(r'data-src="(https://exgic[^"?]+)', t)
    uniq = []
    seen = set()
    for u in imgs:
        if any(x in u.lower() for x in ("logo", "ico_", "header", "cookie", "placeholder")):
            continue
        if u in seen:
            continue
        seen.add(u)
        uniq.append(u)
    lines.append(f"IMGS {len(uniq)}")
    for u in uniq:
        lines.append("  " + u)
    links = re.findall(r'href="(https://smoltech\.pl/[^"]+/)"', t)
    child = []
    for u in links:
        if u not in child and ("zgrzewarki-punktowo-garbowe" in u or "zgrzewarki-punktowe-16" in u or "e-tech" in u or "podwieszane" in u):
            child.append(u)
    if child:
        lines.append("LINKS")
        for u in child:
            lines.append("  " + u)
    (out_dir / (name.replace(".html", ".txt"))).write_text("\n".join(lines), encoding="utf-8")
    print("wrote", name, "tables", len(tables), "imgs", len(uniq))
