# -*- coding: utf-8 -*-
"""Find untranslated Cyrillic text nodes in built HTML (simulates tlumaczenia.js walker)."""
import re
from html.parser import HTMLParser
from pathlib import Path

root = Path(r"G:/smoltech.ua")
js = (root / "assets/js/tlumaczenia.js").read_text(encoding="utf-8")
keys = set(re.findall(r"(?m)^[ \t]+'((?:\\'|[^'])*)'\s*:", js))
keys = {k.replace("\\'", "'") for k in keys}

SKIP = {"SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "KBD"}
ATTRS = ["aria-label", "alt", "title", "placeholder", "data-title"]
CYR = re.compile(r"[А-Яа-яЁёІіЇїЄєҐґ]")
PREFIXES = [
    "Відтворити відео: ",
    "Дивитись відео: ",
    "Дивитися відео: ",
]


class Walker(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.texts = set()
        self.attrs = set()
        self.skip_depth = 0
        self.in_lang = 0

    def handle_starttag(self, tag, attrs):
        ad = dict(attrs)
        classes = (ad.get("class") or "").split()
        self.stack.append((tag.upper(), classes))
        if tag.upper() in SKIP:
            self.skip_depth += 1
        if "lang" in classes:
            self.in_lang += 1
        if self.skip_depth or self.in_lang:
            return
        for a in ATTRS:
            if a in ad and CYR.search(ad[a] or ""):
                self.attrs.add((ad[a] or "").strip())

    def handle_endtag(self, tag):
        if not self.stack:
            return
        t, classes = self.stack.pop()
        if t in SKIP and self.skip_depth:
            self.skip_depth -= 1
        if "lang" in classes and self.in_lang:
            self.in_lang -= 1

    def handle_data(self, data):
        if self.skip_depth or self.in_lang:
            return
        trim = data.strip()
        if trim and CYR.search(trim):
            self.texts.add(trim)


def covered(s: str) -> bool:
    if s in keys:
        return True
    for p in PREFIXES:
        if s.startswith(p):
            rest = s[len(p) :]
            return rest in keys or covered(rest)
    return False


files = [root / "index.html", root / "404.html"] + list(root.glob("*/index.html"))
missing_text = set()
missing_attr = set()
for p in files:
    w = Walker()
    w.feed(p.read_text(encoding="utf-8", errors="ignore"))
    for t in w.texts:
        if not covered(t):
            missing_text.add(t)
    for a in w.attrs:
        if not covered(a):
            missing_attr.add(a)

all_missing = sorted(missing_text | missing_attr, key=lambda s: (-len(s), s))
out = root / "_src" / "missing-en.txt"
out.write_text("\n".join(all_missing), encoding="utf-8")
print(f"keys={len(keys)} missing={len(all_missing)} files={len(files)}")
print(f"wrote {out}")
