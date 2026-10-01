from pathlib import Path
import re
from html import unescape

out = Path(r"G:\smoltech.ua\_src\_extract")

def strip_tags(s):
    s = re.sub(r"<br\s*/?>", " | ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = unescape(s)
    return re.sub(r"\s+", " ", s).strip()

for p in sorted(out.glob("proj-*.html")):
    t = p.read_text(encoding="utf-8", errors="replace")
    # skip head: start at page wrapper
    i = t.find("realfactory-page-wrapper")
    body = t[i:] if i >= 0 else t
    print("\n====", p.name, "body", len(body))
    print(" tables", len(re.findall(r"<table", body, re.I)))
    print(" tablepress", "tablepress" in body.lower(), "data-table" in body)
    hs = [strip_tags(h) for h in re.findall(r"<h[1-3][^>]*>(.*?)</h[1-3]>", body, re.I | re.S)]
    for h in hs[:8]:
        if h:
            print(" H", h[:120])
    imgs = re.findall(r'data-src="(https://exgic[^"?]+\.(?:jpe?g|png|webp))', body, re.I)
    imgs = [u for u in imgs if "logo" not in u.lower() and "pdf" not in u.lower()]
    print(" imgs", imgs[:6])
    # sample text around kVA / model numbers
    for pat in ["kVA", "4660", "6073", "6121", "TE700", "siłownik"]:
        if pat.lower() in body.lower() or pat in body:
            print(" has", pat)
