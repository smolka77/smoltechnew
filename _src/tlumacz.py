"""Translate CMS Ukrainian copy to EN (public) and PL (admin editor)."""
from __future__ import annotations

import hashlib
import html
import json
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import sens_tlumaczenia

ROOT = Path(__file__).resolve().parents[1]
CACHE_PATH = ROOT / "_build" / "cache-tlumaczen.json"
JSON_PATH = ROOT / "_build" / "nakladka-jezyk.json"
JS_PATH = ROOT / "assets" / "js" / "nakladka-jezyk.js"
LAYOUT = ROOT / "_build" / "szablon.html"

# Public site: uk (source) + en. The admin panel edits in English as well, so PL is no longer synced.
TARGETS = ("en",)
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)
CYR = re.compile(r"[А-Яа-яЁёІіЇїЄєҐґ]")
SKIP_KEYS = {
    "id", "video", "href", "image", "email", "url", "og", "pl", "prio", "nav",
    "out", "file", "kind", "phone", "phoneTel", "youtube", "instagram", "company",
    "key", "phones", "present", "src", "webp", "kind", "label", "added", "alt", "plain",
    "crop", "section",
}

_memory: dict[str, str] | None = None


def _cache_key(lang: str, text: str) -> str:
    digest = hashlib.sha1(text.encode("utf-8")).hexdigest()[:16]
    return f"{lang}:{digest}"


_memory_mtime: float | None = None


def _read_cache_file() -> dict[str, str]:
    if CACHE_PATH.is_file():
        try:
            data = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return {str(k): str(v) for k, v in data.items()}
        except Exception:
            pass
    return {}


def _load_cache() -> dict[str, str]:
    """Process-local cache that re-syncs with the file whenever another process wrote it."""
    global _memory, _memory_mtime
    try:
        mtime = CACHE_PATH.stat().st_mtime if CACHE_PATH.is_file() else None
    except OSError:
        mtime = None
    if _memory is None:
        _memory = _read_cache_file()
        _memory_mtime = mtime
    elif mtime != _memory_mtime:
        disk = _read_cache_file()
        disk.update(_memory)
        _memory = disk
        _memory_mtime = mtime
    return _memory


def _save_cache(cache: dict[str, str]) -> None:
    """Merge with what is on disk (long-running server vs. CLI/other workers) before writing."""
    global _memory, _memory_mtime
    disk = _read_cache_file()
    disk.update(cache)
    cache.update(disk)
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(disk, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    _memory = cache
    try:
        _memory_mtime = CACHE_PATH.stat().st_mtime
    except OSError:
        _memory_mtime = None


def _load_overlay() -> dict[str, dict[str, str]]:
    if JSON_PATH.is_file():
        try:
            data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                out: dict[str, dict[str, str]] = {}
                for k, v in data.items():
                    if isinstance(v, dict):
                        out[str(k)] = {str(lk): str(lv) for lk, lv in v.items() if lv}
                return out
        except Exception:
            pass
    return {}


def skip_translation(text: str, source: str = "uk") -> bool:
    t = (text or "").strip()
    if len(t) < 2:
        return True
    if source == "uk":
        if not CYR.search(t):
            return True
    elif not re.search(r"[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]", t):
        return True
    if re.search(r"https?://|www\.|@", t, re.I):
        return True
    if re.fullmatch(r"[\d\s+()./\-]+", t):
        return True
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", t):
        return True
    if re.search(r"\.(jpg|jpeg|png|webp|gif|svg|html|js|css)(\?|$)", t, re.I):
        return True
    if re.fullmatch(r"[\d\s.,×xX+\-/%°cmkg]+", t, re.I):
        return True
    return False


def is_usable(source: str, translated: str) -> bool:
    frm = (source or "").strip()
    to = (translated or "").strip()
    if not to or to == frm:
        return False
    if re.search(r"<\s*html|we're sorry|mymemory warning|quota finished|used all available", to, re.I):
        return False
    return True


def _http_get(url: str, timeout: float = 8.0) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Accept": "application/json,text/plain,*/*"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "replace")


def _parse_google(raw: str) -> str:
    if not raw or raw.lstrip().startswith("<"):
        return ""
    try:
        data = json.loads(raw)
    except Exception:
        return ""
    if isinstance(data, list) and data and isinstance(data[0], str):
        return "".join(x for x in data if isinstance(x, str)).strip()
    if not isinstance(data, list) or not data or not isinstance(data[0], list):
        return ""
    bits = []
    for chunk in data[0]:
        if isinstance(chunk, list) and chunk and isinstance(chunk[0], str):
            bits.append(chunk[0])
    return "".join(bits).strip()


def _google(text: str, target: str, endpoint: str, source: str = "uk") -> str:
    q = urllib.parse.quote(text)
    sl = source or "uk"
    if endpoint == "chrome":
        url = (
            "https://clients5.google.com/translate_a/t"
            f"?client=dict-chrome-ex&sl={sl}&tl={target}&q={q}"
        )
    else:
        url = (
            "https://translate.googleapis.com/translate_a/single"
            f"?client=gtx&sl={sl}&tl={target}&dt=t&q={q}"
        )
    return _parse_google(_http_get(url))


def _chunks(text: str, limit: int = 450) -> list[str]:
    t = text.strip()
    if len(t) <= limit:
        return [t]
    parts = [p.strip() for p in re.split(r"\n{2,}|(?<=[.!?])\s+", t) if p.strip()]
    return parts or [t[:limit]]


def _mymemory(text: str, target: str, source: str = "uk") -> str:
    out = []
    sl = source or "uk"
    for chunk in _chunks(text, 450):
        url = (
            "https://api.mymemory.translated.net/get"
            f"?q={urllib.parse.quote(chunk[:450])}&langpair={sl}|{target}"
        )
        raw = _http_get(url)
        try:
            data = json.loads(raw)
        except Exception:
            return ""
        translated = ((data.get("responseData") or {}).get("translatedText") or "").strip()
        if not translated or int(data.get("responseStatus") or 0) != 200:
            return ""
        out.append(translated)
    return " ".join(out).strip()


def _raw_mt(text: str, target: str, source: str = "uk") -> str:
    # Numbered EN→UK batches must stay intact — sentence-splitting would drop markers.
    if re.search(r"\[\d+\]", text) or len(text) <= 1500:
        payload = text[:4000]
    else:
        payload = " ".join(_chunks(text, 900))
    for endpoint in ("chrome", "gtx"):
        try:
            got = _google(payload, target, endpoint, source)
            if is_usable(text, got):
                return got.strip()
        except Exception:
            pass
    try:
        got = _mymemory(payload, target, source)
        if is_usable(text, got):
            return got.strip()
    except Exception:
        pass
    return text


def _sense_from_mt(original: str, mixed: str, tokens: list[str]) -> str:
    got = _raw_mt(mixed, "uk", "en")
    if not is_usable(original, got) and mixed != original:
        got = _raw_mt(original, "uk", "en")
    if not is_usable(original, got):
        return original
    return sens_tlumaczenia.finish(got, tokens, original)


def translate_once(text: str, target: str, source: str = "uk") -> str:
    if source == "en" and target == "uk":
        exact = sens_tlumaczenia.exact_en_uk(text)
        if exact:
            return exact
        mixed, tokens = sens_tlumaczenia.prepare(text)
        if not sens_tlumaczenia.still_english(mixed):
            return sens_tlumaczenia.finish(mixed, tokens, text)
        return _sense_from_mt(text, mixed, tokens)
    return _raw_mt(text, target, source)


def _pair_key(source: str, target: str, text: str) -> str:
    # uk→X shares the cache with the public overlay sync (same key shape).
    # EN→UK uses a bumped generation so old literal Google hits are not reused.
    if source == "en" and target == "uk":
        lang = f"en-uk-{sens_tlumaczenia.cache_gen()}"
    elif source == "uk":
        lang = target
    else:
        lang = f"{source}-{target}"
    return _cache_key(lang, text)


def _remember(cache: dict[str, str], source: str, target: str, src: str, got: str) -> None:
    cache[_pair_key(source, target, src)] = got
    cache[_pair_key(target, source, got)] = src
    if target == "uk" and source in TARGETS:
        cache["auth:" + _cache_key(source, got)] = src


def _translate_many_en_uk(texts: list[str]) -> dict[str, str]:
    unique: list[str] = []
    seen = set()
    out: dict[str, str] = {}
    cache = _load_cache()
    dirty = False
    for raw in texts:
        t = re.sub(r"\s+", " ", raw or "").strip()
        if not t or t in seen:
            continue
        seen.add(t)
        if skip_translation(t, "en"):
            out[t] = t
            continue
        hit = cache.get(_pair_key("en", "uk", t))
        if hit and is_usable(t, hit):
            out[t] = hit
            _remember(cache, "en", "uk", t, hit)
            dirty = True
            continue
        exact = sens_tlumaczenia.exact_en_uk(t)
        if exact:
            out[t] = exact
            _remember(cache, "en", "uk", t, exact)
            dirty = True
            continue
        unique.append(t)

    prepared: list[tuple[str, str, list[str]]] = []
    for src in unique:
        mixed, tokens = sens_tlumaczenia.prepare(src)
        if not sens_tlumaczenia.still_english(mixed):
            got = sens_tlumaczenia.finish(mixed, tokens, src)
            out[src] = got
            _remember(cache, "en", "uk", src, got)
            dirty = True
            continue
        prepared.append((src, mixed, tokens))

    if prepared:
        mixed_list = [m for _, m, _ in prepared]
        groups = sens_tlumaczenia.chunk_by_size(mixed_list)

        def job(idxs: list[int]) -> list[tuple[int, str]]:
            subset = [mixed_list[i] for i in idxs]
            packed = sens_tlumaczenia.pack_items(subset)
            got = _raw_mt(packed, "uk", "en")
            unpacked = sens_tlumaczenia.unpack_items(got, len(subset))
            rows: list[tuple[int, str]] = []
            if unpacked:
                for j, uk in zip(idxs, unpacked):
                    rows.append((j, uk))
                return rows
            for j in idxs:
                src, mixed, tokens = prepared[j]
                rows.append((j, _sense_from_mt(src, mixed, tokens)))
            return rows

        with ThreadPoolExecutor(max_workers=4) as pool:
            futs = [pool.submit(job, g) for g in groups]
            for fut in as_completed(futs):
                try:
                    rows = fut.result()
                except Exception:
                    continue
                for j, uk in rows:
                    src, mixed, tokens = prepared[j]
                    got = sens_tlumaczenia.finish(uk, tokens, src) if (uk and uk != src) else ""
                    if not got or not is_usable(src, got) or sens_tlumaczenia.still_english(got):
                        got = _sense_from_mt(src, mixed, tokens)
                    if is_usable(src, got):
                        out[src] = got
                        _remember(cache, "en", "uk", src, got)
                        dirty = True
                    else:
                        out[src] = src

        for src, mixed, tokens in prepared:
            if src in out:
                continue
            got = _sense_from_mt(src, mixed, tokens)
            if is_usable(src, got):
                out[src] = got
                _remember(cache, "en", "uk", src, got)
                dirty = True
            else:
                out[src] = src

    if dirty:
        try:
            _save_cache(cache)
        except Exception:
            pass
    return out


def translate_many(texts: list[str], source: str, target: str) -> dict[str, str]:
    if source == "en" and target == "uk":
        return _translate_many_en_uk(texts)
    unique: list[str] = []
    seen = set()
    out: dict[str, str] = {}
    cache = _load_cache()
    for raw in texts:
        t = re.sub(r"\s+", " ", raw or "").strip()
        if not t or t in seen:
            continue
        seen.add(t)
        if skip_translation(t, source):
            out[t] = t
            continue
        hit = cache.get(_pair_key(source, target, t))
        if hit and is_usable(t, hit):
            out[t] = hit
            continue
        unique.append(t)
    if not unique:
        return out

    def job(src: str) -> tuple[str, str]:
        return src, translate_once(src, target, source)

    dirty = False
    with ThreadPoolExecutor(max_workers=6) as pool:
        futs = [pool.submit(job, src) for src in unique]
        for fut in as_completed(futs):
            try:
                src, got = fut.result()
            except Exception:
                continue
            if is_usable(src, got):
                out[src] = got
                _remember(cache, source, target, src, got)
                dirty = True
            else:
                out[src] = src
    if dirty:
        try:
            _save_cache(cache)
        except Exception:
            pass
    return out


def explode_text(value: str) -> list[str]:
    s = value or ""
    pieces: list[str] = []
    if "<" in s:
        for m in re.finditer(
            r'(?:aria-label|alt|title|placeholder|data-title|data-ask-topic)="([^"]+)"',
            s,
        ):
            pieces.append(html.unescape(m.group(1)))
        for m in re.finditer(r">([^<]+)<", s):
            pieces.append(html.unescape(m.group(1)))
        t = re.sub(r"<[^>]+>", " ", s)
        t = html.unescape(re.sub(r"\s+", " ", t)).strip()
        if t:
            pieces.append(t)
    else:
        pieces.append(s)
        if "|" in s or ">>" in s:
            pieces.extend(re.split(r"\s*\|\s*|\s*>>\s*", s))
    out = []
    seen = set()
    for p in pieces:
        p = html.unescape(re.sub(r"\s+", " ", p or "")).strip()
        if p and p not in seen:
            seen.add(p)
            out.append(p)
    return out


def collect_values(node, acc: list[str], key: str | None = None) -> None:
    if key and key in SKIP_KEYS:
        return
    if isinstance(node, dict):
        for k, v in node.items():
            collect_values(v, acc, str(k))
        return
    if isinstance(node, list):
        for item in node:
            collect_values(item, acc, key)
        return
    if isinstance(node, str):
        acc.extend(explode_text(node))


def collect_from_page(page: dict) -> list[str]:
    acc: list[str] = []
    collect_values(page.get("meta") or {}, acc)
    collect_values(page.get("hero") or {}, acc)
    collect_values(page.get("stats") or [], acc)
    collect_values(page.get("proof") or [], acc)
    collect_values(page.get("areas") or [], acc)
    collect_values(page.get("tiles") or [], acc)
    collect_values(page.get("models") or {}, acc)
    collect_values(page.get("films") or [], acc)
    collect_values(page.get("copy") or [], acc)
    collect_values(page.get("mach") or [], acc)
    collect_values(page.get("faq") or [], acc)
    collect_values(page.get("people") or [], acc)
    return acc


def collect_from_videos(data: dict) -> list[str]:
    acc: list[str] = []
    collect_values(data.get("categories") or data.get("videos") or data, acc)
    return acc


def collect_from_settings(data: dict) -> list[str]:
    acc: list[str] = []
    for k in ("footer", "addressShort", "addressLine"):
        if data.get(k):
            acc.extend(explode_text(str(data[k])))
    return acc


_LATIN = re.compile(r"[A-Za-z]")


def _plain_phrase(s: str) -> str:
    t = html.unescape(s or "")
    t = re.sub(r"<[^>]+>", " ", t)
    t = t.replace("\u00a0", " ")
    t = re.sub(r"[\u2018\u2019\u02BC\u02B9\u201B]", "'", t)
    t = re.sub(r"[\u2010-\u2015\u2212]", "-", t)
    return re.sub(r"\s+", " ", t).strip()


def _author_ok(uk: str, en: str) -> bool:
    if not uk or not en or uk == en:
        return False
    if skip_translation(uk, "uk"):
        return False
    if not _LATIN.search(en) or CYR.search(en):
        return False
    return True


def author_pairs(pairs: list) -> int:
    """Store English written in the admin editor as the public overlay for Ukrainian source strings."""
    overlay = _load_overlay()
    cache = _load_cache()
    n = 0
    for row in pairs or []:
        if not isinstance(row, dict):
            continue
        uk_raw = str(row.get("uk") or "")
        en_raw = str(row.get("en") or "")
        items: list[tuple[str, str]] = []
        uk_plain = _plain_phrase(uk_raw)
        en_plain = _plain_phrase(en_raw)
        if uk_plain and en_plain:
            items.append((uk_plain, en_plain))
        uks = explode_text(uk_raw) if "<" in uk_raw else []
        ens = explode_text(en_raw) if "<" in en_raw else []
        if len(uks) == len(ens) and len(uks) > 1:
            items.extend((_plain_phrase(a), _plain_phrase(b)) for a, b in zip(uks, ens))
        seen: set[tuple[str, str]] = set()
        for uk, en in items:
            if (uk, en) in seen or not _author_ok(uk, en):
                continue
            seen.add((uk, en))
            slot = overlay.setdefault(uk, {})
            if slot.get("en") == en and slot.get("a") == "1":
                continue
            slot["en"] = en
            slot["a"] = "1"
            cache["auth:" + _cache_key("en", uk)] = en
            cache[_cache_key("en", uk)] = en
            cache[_pair_key("en", "uk", en)] = uk
            n += 1
    if n:
        _write_js(overlay)
        _save_cache(cache)
    return n


_SKIP_HTML_DIRS = {".git", "node_modules", "_src", "_private", "_backup"}


def _bump_overlay_query(stamp: str) -> None:
    pat = re.compile(r"(?:i18n-cms|nakladka-jezyk)\.js\?v=[^\"']+")
    repl = f"nakladka-jezyk.js?v={stamp}"
    for p in ROOT.rglob("*.html"):
        if any(part in _SKIP_HTML_DIRS for part in p.parts):
            continue
        try:
            txt = p.read_text(encoding="utf-8")
        except Exception:
            continue
        nxt = pat.sub(repl, txt)
        if nxt != txt:
            p.write_text(nxt, encoding="utf-8")


def _write_js(overlay: dict[str, dict[str, str]]) -> None:
    JS_PATH.parent.mkdir(parents=True, exist_ok=True)
    JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(overlay, ensure_ascii=False, separators=(",", ":"))
    JSON_PATH.write_text(json.dumps(overlay, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    JS_PATH.write_text("window.ST_I18N_CMS=" + payload + ";\n", encoding="utf-8")
    _bump_overlay_query(str(int(time.time())))


def sync_texts(texts: list[str]) -> dict:
    unique: list[str] = []
    seen = set()
    for raw in texts:
        for piece in explode_text(raw) if "<" in (raw or "") else [raw]:
            t = re.sub(r"\s+", " ", piece or "").strip()
            if not t or t in seen or skip_translation(t):
                continue
            seen.add(t)
            unique.append(t)

    overlay = _load_overlay()
    cache = _load_cache()
    pending: list[tuple[str, str]] = []
    for text in unique:
        slot = overlay.setdefault(text, {})
        for lang in TARGETS:
            if slot.get("a") == "1" and slot.get(lang):
                continue
            authored = cache.get("auth:" + _cache_key(lang, text))
            if authored and is_usable(text, authored):
                slot[lang] = authored
                slot["a"] = "1"
                continue
            dict_en = sens_tlumaczenia.house_uk_en(text) if lang == "en" else ""
            if dict_en:
                slot[lang] = dict_en
                continue
            # Cache first: it holds the latest wording (incl. reverse pairs from the editor).
            existing = cache.get(_cache_key(lang, text)) or slot.get(lang)
            if existing and is_usable(text, existing):
                slot[lang] = existing
                continue
            pending.append((text, lang))

    translated = 0
    wrote_cache = False
    if pending:
        def job(item: tuple[str, str]) -> tuple[str, str, str]:
            src, lang = item
            return src, lang, translate_once(src, lang)

        with ThreadPoolExecutor(max_workers=6) as pool:
            futs = [pool.submit(job, item) for item in pending]
            for fut in as_completed(futs):
                try:
                    src, lang, got = fut.result()
                except Exception:
                    continue
                if not is_usable(src, got):
                    continue
                overlay.setdefault(src, {})[lang] = got
                cache[_cache_key(lang, src)] = got
                translated += 1
                wrote_cache = True

    if unique or translated:
        _write_js(overlay)
    if wrote_cache:
        _save_cache(cache)
    return {"ok": True, "queued": len(unique), "translated": translated, "pending": len(pending)}


def safe_sync(texts: list[str]) -> dict:
    try:
        return sync_texts(texts)
    except Exception as e:
        return {"ok": False, "error": str(e), "translated": 0, "queued": 0}
