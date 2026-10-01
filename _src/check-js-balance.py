# -*- coding: utf-8 -*-
"""Minimal JS syntax check for tlumaczenia.js (brace/paren/string balance)."""
from pathlib import Path

src = Path(r"G:/smoltech.ua/assets/js/tlumaczenia.js").read_text(encoding="utf-8")
i = 0
n = len(src)
stack = []
in_s = None  # ', ", or `
esc = False
line = 1
col = 0
while i < n:
    c = src[i]
    if c == "\n":
        line += 1
        col = 0
    else:
        col += 1
    if in_s:
        if esc:
            esc = False
        elif c == "\\":
            esc = True
        elif c == in_s:
            in_s = None
        i += 1
        continue
    if c in "'\"`":
        in_s = c
        i += 1
        continue
    if c == "/" and i + 1 < n:
        nxt = src[i + 1]
        if nxt == "/":
            while i < n and src[i] != "\n":
                i += 1
            continue
        if nxt == "*":
            i += 2
            while i + 1 < n and not (src[i] == "*" and src[i + 1] == "/"):
                if src[i] == "\n":
                    line += 1
                i += 1
            i += 2
            continue
    if c in "([{":
        stack.append((c, line, col))
    elif c in ")]}":
        if not stack:
            raise SystemExit(f"extra {c} at {line}:{col}")
        open_c, ol, oc = stack.pop()
        pairs = {"(": ")", "[": "]", "{": "}"}
        if pairs[open_c] != c:
            raise SystemExit(f"mismatch {open_c}@{ol}:{oc} vs {c}@{line}:{col}")
    i += 1
if in_s:
    raise SystemExit(f"unclosed string {in_s}")
if stack:
    raise SystemExit(f"unclosed {stack[-1]}")
print("balance OK")
