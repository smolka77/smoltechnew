from pathlib import Path
import re
from html import unescape

html_dir = Path(r"G:\smoltech.ua\_src\html")
out = Path(r"G:\smoltech.ua\_src\_extract")

files = {
    "susp-16-38": "zgrzewarki-podwieszane-25-90-kva__zgrzewarki-punktowe-kleszczowe-16-38kva.html",
    "susp-56-90": "zgrzewarki-podwieszane-25-90-kva__zgrzewarki-podwieszane-56-90-kva.html",
    "stat-16-25": "zgrzewarki-punktowe-16-150kva__zgrzewarki-punktowe-stacjonarne.html",
    "stat-inv-25": "zgrzewarki-punktowe-16-150kva__zgrzewarki-inwertorowe-punktowe.html",
    "etech": "zgrzewarka-punktowa__zgrzewarki-wielofunkcyjne-e-tech.html",
}

def strip_tags(s):
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = unescape(s)
    return re.sub(r"[ \t]+", " ", s).strip()

for name, fn in files.items():
    t = (html_dir / fn).read_text(encoding="utf-8", errors="replace")
    m = re.search(r"gdlr-core-pbf-sidebar-content-inner(.*?)gdlr-core-pbf-sidebar-right", t, re.S)
    content = m.group(1) if m else t
    paras = [strip_tags(p) for p in re.findall(r"<p[^>]*>(.*?)</p>", content, re.I | re.S)]
    paras = [p for p in paras if p and len(p) > 50]
    lis = [strip_tags(li) for li in re.findall(r"<li[^>]*>(.*?)</li>", content, re.I | re.S)]
    lis = [li for li in lis if li and 15 < len(li) < 280]
    imgs = []
    for u in re.findall(r'(?:data-src|src)="(https://exgic[^"?]+)', content):
        if re.search(r"\.(jpe?g|png|webp)$", u, re.I) and "logo" not in u.lower() and "pdf-1" not in u:
            if u not in imgs:
                imgs.append(u)
    lines = ["PARAS"] + paras[:15] + ["LIS"] + lis[:25] + ["IMGS"] + imgs
    (out / f"{name}-copy.txt").write_text("\n\n".join(lines), encoding="utf-8")
    print(name, "paras", len(paras), "lis", len(lis), "imgs", imgs[:4])
