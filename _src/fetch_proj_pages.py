"""Download Polish product pages, extract tables/copy/images."""
from __future__ import annotations

import json
import re
import urllib.request
from html import unescape
from pathlib import Path

ROOT = Path(r"G:\smoltech.ua")
OUT = ROOT / "_src" / "_extract"
OUT.mkdir(exist_ok=True)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

PAGES = [
    ("proj-35-80", "https://smoltech.pl/zgrzewarki-punktowo-garbowe-35-630kva/35-do-80-kva/"),
    ("proj-56", "https://smoltech.pl/zgrzewarki-punktowo-garbowe-35-630kva/inwertorowe-zgrzewarki-56-kva/"),
    ("proj-90-200", "https://smoltech.pl/zgrzewarki-punktowo-garbowe-35-630kva/moc-90-do-200-kva/"),
    ("proj-63-163", "https://smoltech.pl/zgrzewarki-punktowo-garbowe-35-630kva/moc-od-63-do-163-kva/"),
    ("proj-80-315", "https://smoltech.pl/zgrzewarki-punktowo-garbowe-35-630kva/moc-od-80-do-315-kva/"),
    ("proj-100", "https://smoltech.pl/zgrzewarki-punktowo-garbowe-35-630kva/moc-100-kva/"),
]


def strip_tags(s: str) -> str:
    s = re.sub(r"<br\s*/?>", " | ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", errors="replace")


def extract(name: str, url: str, html: str) -> dict:
    content = html
    m = re.search(r'gdlr-core-pbf-sidebar-content-inner(.*?)gdlr-core-pbf-sidebar-right', html, re.S)
    if m:
        content = m.group(1)
    hs = [strip_tags(h) for h in re.findall(r"<h[1-3][^>]*>(.*?)</h[1-3]>", content, re.I | re.S)]
    hs = [h for h in hs if h and len(h) < 220]
    paras = [strip_tags(p) for p in re.findall(r"<p[^>]*>(.*?)</p>", content, re.I | re.S)]
    paras = [p for p in paras if p and len(p) > 40 and "cookie" not in p.lower()]
    lis = [strip_tags(li) for li in re.findall(r"<li[^>]*>(.*?)</li>", content, re.I | re.S)]
    lis = [li for li in lis if li and 12 < len(li) < 240 and not li.startswith("Home")]
    tables = []
    for tb in re.findall(r"<table[\s\S]*?</table>", content, re.I):
        rows = []
        for r in re.findall(r"<tr[\s\S]*?</tr>", tb, re.I):
            cells = [strip_tags(c) for c in re.findall(r"<t[hd][^>]*>([\s\S]*?)</t[hd]>", r, re.I)]
            if any(cells):
                rows.append(cells)
        if rows:
            tables.append(rows)
    imgs = []
    for u in re.findall(r'(?:data-src|src)="(https://exgic[^"?]+)', content):
        if any(x in u.lower() for x in ("logo", "ico_", "pdf-1", "jquery", ".js")):
            continue
        if re.search(r"\.(jpe?g|png|webp)$", u, re.I) and u not in imgs:
            imgs.append(u)
    yts = sorted(set(re.findall(r"youtube\.com/(?:embed/|shorts/|watch\?v=)([A-Za-z0-9_-]{6,})", html)))
    yts += sorted(set(re.findall(r"youtu\.be/([A-Za-z0-9_-]{6,})", html)))
    data = {
        "name": name,
        "url": url,
        "headings": hs[:20],
        "paras": paras[:12],
        "lis": lis[:20],
        "tables": tables,
        "imgs": imgs[:8],
        "yt": yts,
    }
    (OUT / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = [f"{name} {url}", f"H {hs}", f"YT {yts}", f"IMGS {imgs}", f"TABLES {len(tables)}"]
    for i, tb in enumerate(tables):
        lines.append(f" TABLE {i} rows={len(tb)} cols={max(len(r) for r in tb)}")
        for r in tb[:6]:
            lines.append("  " + " || ".join(r)[:220])
    (OUT / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8")
    print(name, "tables", len(tables), "imgs", len(imgs), "h", hs[:2])
    return data


def main():
    for name, url in PAGES:
        html = fetch(url)
        (OUT / f"{name}.html").write_text(html, encoding="utf-8")
        extract(name, url, html)


if __name__ == "__main__":
    main()
