from pathlib import Path
import re
from html import unescape

OUT = Path(r"G:\smoltech.ua\_src\_extract")


def strip_tags(s):
    s = re.sub(r"<br\s*/?>", " | ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def body_of(html: str) -> str:
    i = html.find("realfactory-page-wrapper")
    return html[i:] if i >= 0 else html


def dump_file(path: Path, dest: Path):
    t = body_of(path.read_text(encoding="utf-8", errors="replace"))
    lines = [path.name]
    hs = [strip_tags(h) for h in re.findall(r"<h[1-3][^>]*>(.*?)</h[1-3]>", t, re.I | re.S)]
    lines.append("HEADINGS")
    lines.extend("  " + h for h in hs if h and "Aktualn" not in h and h != "Blog")
    paras = [strip_tags(p) for p in re.findall(r"<p[^>]*>(.*?)</p>", t, re.I | re.S)]
    lines.append("PARAS")
    for p in paras:
        if p and len(p) > 60 and "cookie" not in p.lower() and "Zarządzanie" not in p:
            lines.append(p)
            lines.append("")
    lis = [strip_tags(li) for li in re.findall(r"<li[^>]*>(.*?)</li>", t, re.I | re.S)]
    lines.append("LIS")
    for li in lis:
        if li and 20 < len(li) < 320 and not li.startswith(("Home", "Firma", "Zgrzewarki do metalu")):
            lines.append("- " + li)
    tables = re.findall(r"<table[\s\S]*?</table>", t, re.I)
    lines.append(f"TABLES {len(tables)}")
    for i, tb in enumerate(tables):
        rows = re.findall(r"<tr[\s\S]*?</tr>", tb, re.I)
        lines.append(f" TABLE {i} rows={len(rows)}")
        for r in rows:
            cells = [strip_tags(c) for c in re.findall(r"<t[hd][^>]*>([\s\S]*?)</t[hd]>", r, re.I)]
            if any(cells):
                lines.append("  | " + " || ".join(cells))
    dest.write_text("\n".join(lines), encoding="utf-8")
    print("wrote", dest.name, "tables", len(tables))


for p in sorted((OUT).glob("proj-*.html")):
    dump_file(p, OUT / (p.stem + "-full.txt"))

html_dir = Path(r"G:\smoltech.ua\_src\html")
for name, fn in {
    "susp-16-38": "zgrzewarki-podwieszane-25-90-kva__zgrzewarki-punktowe-kleszczowe-16-38kva.html",
    "susp-56-90": "zgrzewarki-podwieszane-25-90-kva__zgrzewarki-podwieszane-56-90-kva.html",
    "stat-16-25": "zgrzewarki-punktowe-16-150kva__zgrzewarki-punktowe-stacjonarne.html",
    "stat-inv-25": "zgrzewarki-punktowe-16-150kva__zgrzewarki-inwertorowe-punktowe.html",
    "etech": "zgrzewarka-punktowa__zgrzewarki-wielofunkcyjne-e-tech.html",
}.items():
    dump_file(html_dir / fn, OUT / f"{name}-full.txt")
