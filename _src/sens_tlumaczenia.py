"""Sense-aware EN→UK for SMOLTECH: house terms, not word-for-word MT."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GLOSSARY_PATH = ROOT / "_private" / "slownik-jezyk.json"
DICT_JS = ROOT / "assets" / "js" / "tlumaczenia.js"

CACHE_GEN = "s2"
_PAIR_RE = re.compile(r"""(?s)(['"])((?:\\.|(?!\1).)*)\1\s*:\s*(['"])((?:\\.|(?!\3).)*)\3""")
_HAS_EN = re.compile(r"[A-Za-z]{3,}")
_CYR = re.compile(r"[А-Яа-яЁёІіЇїЄєҐґ]")

_g: dict | None = None
_g_mtime: float | None = None
_house: dict[str, str] | None = None
_house_mtime: float | None = None
_uk_en: dict[str, str] | None = None
_uk_pl: dict[str, str] | None = None


def _parse_js_pairs(block: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for m in _PAIR_RE.finditer(block or ""):
        uk = _unescape_js(m.group(2)).strip()
        val = _unescape_js(m.group(4)).strip()
        if not uk or not val or not _CYR.search(uk):
            continue
        if _CYR.search(val) or len(val) < 2:
            continue
        if uk not in out:
            out[uk] = val
        n = _norm(uk)
        if n and n not in out:
            out[n] = val
    return out


def _load_uk_tables() -> tuple[dict[str, str], dict[str, str]]:
    global _uk_en, _uk_pl, _house_mtime, _house
    try:
        mtime = DICT_JS.stat().st_mtime if DICT_JS.is_file() else None
    except OSError:
        mtime = None
    if _uk_en is not None and mtime == _house_mtime:
        return _uk_en, _uk_pl or {}
    uk_en: dict[str, str] = {}
    uk_pl: dict[str, str] = {}
    if DICT_JS.is_file():
        js = DICT_JS.read_text(encoding="utf-8")
        d0 = js.find("var D = {")
        p0 = js.find("var P = {", d0 + 1 if d0 >= 0 else 0)
        uk_en = _parse_js_pairs(js[d0:p0] if d0 >= 0 and p0 > d0 else "")
        p1 = js.find("function lookup", p0 + 1 if p0 >= 0 else 0)
        uk_pl = _parse_js_pairs(js[p0:p1] if p0 >= 0 and p1 > p0 else "")
    _uk_en, _uk_pl = uk_en, uk_pl
    _house_mtime = mtime
    _house = None
    return uk_en, uk_pl


def house_uk_en(text: str = "") -> str | dict[str, str]:
    table, _pl = _load_uk_tables()
    if text == "":
        return table
    t = _norm(text)
    return table.get(text) or table.get(t) or ""


def _load_house() -> dict[str, str]:
    """Invert the public UK→EN dictionary so known English copy maps to site Ukrainian."""
    global _house, _house_mtime
    try:
        mtime = DICT_JS.stat().st_mtime if DICT_JS.is_file() else None
    except OSError:
        mtime = None
    if _house is not None and mtime == _house_mtime:
        return _house
    uk_en, _pl = _load_uk_tables()
    out: dict[str, str] = {}
    for uk, en in uk_en.items():
        key = _norm(en)
        if key not in out:
            out[key] = uk
        low = key.lower()
        if low not in out:
            out[low] = uk
    _house = out
    _house_mtime = mtime
    return out


def _unescape_js(s: str) -> str:
    return (
        s.replace("\\'", "'")
        .replace('\\"', '"')
        .replace("\\n", "\n")
        .replace("\\\\", "\\")
    )


def _norm(text: str) -> str:
    t = (text or "").replace("\u00a0", " ").replace("\u2019", "'").replace("\u2018", "'")
    t = t.replace("\u2013", "-").replace("\u2014", "—")
    return re.sub(r"\s+", " ", t).strip()


def load_glossary() -> dict:
    global _g, _g_mtime
    try:
        mtime = GLOSSARY_PATH.stat().st_mtime if GLOSSARY_PATH.is_file() else None
    except OSError:
        mtime = None
    if _g is not None and mtime == _g_mtime:
        return _g
    data: dict = {"brands": [], "units": [], "phrases": [], "polish": [], "cacheGen": CACHE_GEN}
    if GLOSSARY_PATH.is_file():
        try:
            raw = json.loads(GLOSSARY_PATH.read_text(encoding="utf-8"))
            if isinstance(raw, dict):
                data.update(raw)
        except Exception:
            pass
    phrases = [(str(a), str(b)) for a, b in (data.get("phrases") or []) if a and b]
    phrases.sort(key=lambda p: (-len(p[0]), -len(p[1])))
    polish = [(str(a), str(b)) for a, b in (data.get("polish") or []) if a and b]
    polish.sort(key=lambda p: (-len(p[0]), -len(p[1])))
    brands = sorted({str(x) for x in (data.get("brands") or []) if x}, key=len, reverse=True)
    units = [(str(a), str(b)) for a, b in (data.get("units") or []) if a and b]
    gen = str(data.get("cacheGen") or CACHE_GEN)
    _g = {"brands": brands, "units": units, "phrases": phrases, "polish": polish, "cacheGen": gen}
    _g_mtime = mtime
    return _g


def cache_gen() -> str:
    return str(load_glossary().get("cacheGen") or CACHE_GEN)


def _cap(src: str, uk: str) -> str:
    if not src or not uk:
        return uk
    if src[0].isupper() and uk[0].islower():
        return uk[0].upper() + uk[1:]
    return uk


def exact_en_uk(text: str) -> str:
    t = _norm(text)
    if not t:
        return ""
    house = _load_house()
    hit = house.get(t) or house.get(t.lower())
    if hit:
        return hit
    for en, uk in load_glossary()["phrases"]:
        if t.lower() == en.lower():
            return _cap(t, uk)
    return ""


def _protect(text: str) -> tuple[str, list[str]]:
    g = load_glossary()
    tokens: list[str] = []
    out = text

    def stash(chunk: str) -> str:
        tokens.append(chunk)
        return f" ZBR{len(tokens) - 1}Z "

    for brand in g["brands"]:
        pat = re.compile(r"(?<![A-Za-z0-9])" + re.escape(brand) + r"(?![A-Za-z0-9])")
        out = pat.sub(lambda m: stash(m.group(0)), out)
    return out, tokens


def _restore(text: str, tokens: list[str]) -> str:
    out = text
    for i, chunk in enumerate(tokens):
        out = re.sub(rf"\s*ZBR{i}Z\s*", chunk, out, flags=re.I)
        out = re.sub(rf"\s*ZBR\s*{i}\s*Z\s*", chunk, out, flags=re.I)
    return re.sub(r" {2,}", " ", out).strip()


def _apply_phrases(text: str) -> str:
    out = text
    for en, uk in load_glossary()["phrases"]:
        pat = re.compile(r"(?<![A-Za-z])" + re.escape(en) + r"(?![A-Za-z])", re.I)
        out = pat.sub(uk, out)
    return out


def _apply_units(text: str) -> str:
    out = text
    for en, uk in load_glossary()["units"]:
        out = re.sub(r"(?<![A-Za-z])" + re.escape(en) + r"(?![A-Za-z])", uk, out)
    return out


def polish_uk(uk: str, en: str = "") -> str:
    out = (uk or "").strip()
    if not out:
        return out
    for src, dst in load_glossary()["polish"]:
        out = re.sub(re.escape(src), dst, out, flags=re.I)
    if en and re.search(r"\bCDM\b", en, re.I):
        out = re.sub(r"апарати\s+CDM", "пристрої CDM", out, flags=re.I)
        out = re.sub(r"апарат\s+CDM", "пристрій CDM", out, flags=re.I)
    if en and re.search(r"\bwelder", en, re.I) and not re.search(r"\boperator", en, re.I):
        out = re.sub(r"зварювальників", "машин", out)
        out = re.sub(r"зварювальники", "машини", out)
        out = re.sub(r"зварювальника", "машини", out)
        out = re.sub(r"зварювальник", "машина", out)
    out = _apply_units(out)
    out = out.replace("'", "ʼ")
    return re.sub(r" {2,}", " ", out).strip()


def still_english(text: str) -> bool:
    t = text or ""
    t = re.sub(r"ZBR\d+Z", " ", t, flags=re.I)
    g = load_glossary()
    for brand in g["brands"]:
        t = re.sub(r"(?<![A-Za-z0-9])" + re.escape(brand) + r"(?![A-Za-z0-9])", " ", t)
    for en, _uk in g["units"]:
        t = re.sub(r"(?<![A-Za-z])" + re.escape(en) + r"(?![A-Za-z])", " ", t)
    t = re.sub(r"[\d.,\-–—×xX/%°]+", " ", t)
    return bool(_HAS_EN.search(t))


def prepare(text: str) -> tuple[str, list[str]]:
    protected, tokens = _protect(text)
    mixed = _apply_phrases(protected)
    return mixed, tokens


def finish(uk: str, tokens: list[str], en: str) -> str:
    return _cap(en, polish_uk(_restore(uk, tokens), en))


def pack_items(items: list[str]) -> str:
    return "\n".join(f"[{i + 1}] {t}" for i, t in enumerate(items))


def unpack_items(raw: str, n: int) -> list[str] | None:
    parts = re.split(r"\[\s*(\d+)\s*\]\s*", raw or "")
    found: dict[int, str] = {}
    i = 1
    while i + 1 < len(parts):
        num, txt = parts[i], parts[i + 1]
        if num.isdigit():
            found[int(num)] = txt.strip()
        i += 2
    if len(found) != n:
        return None
    return [found[i] for i in range(1, n + 1)]


def chunk_by_size(items: list[str], limit: int = 1400, max_n: int = 8) -> list[list[int]]:
    groups: list[list[int]] = []
    cur: list[int] = []
    size = 0
    for i, t in enumerate(items):
        extra = len(t) + 8
        if cur and (len(cur) >= max_n or size + extra > limit):
            groups.append(cur)
            cur, size = [], 0
        cur.append(i)
        size += extra
    if cur:
        groups.append(cur)
    return groups
