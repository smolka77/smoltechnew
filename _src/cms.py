"""CMS for SMOLTECH UA — edit _build/pages, videos, settings; public HTML updates only on publish."""
from __future__ import annotations

import base64
import html
import json
import re
import secrets
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "_build" / "pages"
LAYOUT = ROOT / "_build" / "szablon.html"
PARTIALS = ROOT / "_build" / "partials"
FILMY = ROOT / "_src" / "filmy-ua.txt"
SETTINGS = ROOT / "_build" / "ustawienia.json"
PENDING = ROOT / "_build" / "nieopublikowane.json"
MEDIA = ROOT / "assets" / "img" / "cms"
YT_DIR = ROOT / "assets" / "img" / "yt"
HOME_PAGE = PAGES / "00-strona-glowna.html"
VIDEO_PAGE = PAGES / "50-video.html"
HOME_SEED = [
    "epa5-Y0UspY",
    "JbYcwFOhJYE",
    "AFjrgjZMeXo",
    "3RnMyTRxjuI",
    "HuwTENXB1N8",
    "4NqB3878X-U",
]
COPY_LABELS = {
    "eyebrow": "Mały podpis nad tytułem",
    "h1": "Główny tytuł",
    "hero__sub": "Tekst pod tytułem",
    "h2": "Tytuł tej części strony",
    "lead": "Opis pod tytułem",
    "h3": "Tytuł kafelka",
    "p": "Tekst",
    "li": "Punkt listy",
    "tag": "Etykieta",
    "btn": "Przycisk",
    "link": "Link",
    "stats__l": "Opis liczby",
    "stats__n": "Liczba",
    "proof__l": "Opis liczby",
    "proof__n": "Liczba",
    "summary": "Pytanie FAQ",
    "rich": "Opis produktu",
    "label": "Podpis",
    "cell": "Pole w tabeli",
}
ASK_LABEL = "Запитати про цю конфігурацію"
PRODUCT_SECTION_ID = "produkty"
SITE = "https://smoltech.com.ua"
NAV_KEYS = ("company", "machines", "studs", "video", "contact")

KIND_LABEL = {
    "home": "Strona główna",
    "company": "O firmie",
    "machines": "Maszyny",
    "studs": "Szpilki",
    "video": "Wideo",
    "contact": "Kontakt",
    "legal": "Prawne",
    "other": "Strona",
}

PAGE_NAMES_PL = {
    "00-strona-glowna": "Strona główna",
    "10-pro-kompaniyu": "O firmie",
    "11-kompetentsiyi": "Kompetencje",
    "21-pidvisni": "Zgrzewarki kleszczowe podwieszane",
    "211-pidvisni-16-38": "16–38 kVA",
    "212-pidvisni-56-90": "56–90 kVA",
    "22-statsionarni": "Zgrzewarki punktowe stacjonarne",
    "221-statsionarni-16-25": "16–25 kVA",
    "222-statsionarni-inv": "Inwertorowe 25 kVA",
    "23-tochkovo-relyefni": "Zgrzewarki punktowo-garbowe",
    "231-relyefni-35-80": "AC 35–80 kVA",
    "232-relyefni-56": "MFDC 56 kVA",
    "233-relyefni-90-200": "MFDC 90–200 kVA",
    "234-relyefni-63-163": "AC 63–163 kVA",
    "235-relyefni-80-315": "AC 80–315 kVA",
    "236-relyefni-100": "DC 100 kVA",
    "24-bahatofunktsionalni": "Zgrzewarki inwertorowe do karoserii",
    "25-mashyny-z-osnastkoyu": "Zgrzewarki z oprzyrządowaniem",
    "30-avtomatyzovani-kompleksy": "Automaty i roboty",
    "31-sitky": "Zgrzewarki do siatek",
    "40-shpylky": "Zgrzewanie trzpieni",
    "41-cdm": "CDM — zgrzewanie kondensatorowe",
    "42-da": "DA — zgrzewanie inwertorowe",
    "43-cnc": "Kompleksy CNC",
    "50-video": "Wideo — automatyzacja zgrzewania",
    "60-kontakty": "Kontakt",
    "70-polityka": "Polityka prywatności",
    "90-404": "Nie znaleziono strony (404)",
}

DEFAULT_SETTINGS = {
    "phone": "+48 71 321 54 27",
    "phoneTel": "+48713215427",
    "email": "biuro@smoltech.pl",
    "addressShort": "Mokronos Dolny, Польща",
    "addressLine": "st. Przyjazna 2, 55-080 Mokronos Dolny, Польща",
    "company": "SMOLTECH Technika Zgrzewalnicza Sp. z o. o.",
    "youtube": "https://www.youtube.com/user/SMOLTECH/videos",
    "instagram": "https://www.instagram.com/smoltech_resistance_welding",
    "footer": "Проєктуємо та виробляємо машини контактного зварювання, автоматизовані й роботизовані зварювальні комплекси та технологічні лінії для металообробної й автомобільної промисловості.",
}

LD_ORG = (
    '{"@context":"https://schema.org","@graph":['
    '{"@type":["Organization","Manufacturer"],"@id":"https://smoltech.com.ua/#org",'
    '"name":"SMOLTECH Technika Zgrzewalnicza Sp. z o. o.","alternateName":"SMOLTECH",'
    '"url":"https://smoltech.com.ua/",'
    '"logo":{"@type":"ImageObject","url":"https://smoltech.com.ua/assets/img/logo.png","width":1181,"height":780},'
    '"image":"https://smoltech.com.ua/assets/img/og-default.jpg",'
    '"description":"Виробник машин контактного зварювання: точкові, рельєфні та багатоточкові машини, автоматизовані й роботизовані зварювальні комплекси, машини для зварювання сіток та обладнання для приварювання шпильок.",'
    '"email":"EMAIL_PH","telephone":"TEL_PH","faxNumber":"","vatID":"PL8971804142","taxID":"8971804142","foundingDate":"2015",'
    '"address":{"@type":"PostalAddress","streetAddress":"st. Przyjazna 2","addressLocality":"Mokronos Dolny","postalCode":"55-080","addressRegion":"Dolnośląskie","addressCountry":"PL"},'
    '"geo":{"@type":"GeoCoordinates","latitude":51.0720771,"longitude":16.9260533},'
    '"areaServed":[{"@type":"Country","name":"Україна"},{"@type":"Country","name":"Polska"}],'
    '"knowsLanguage":["uk","pl","en"],'
    '"sameAs":["https://www.smoltech.pl","YT_PH","IG_PH"],'
    '"contactPoint":[{"@type":"ContactPoint","telephone":"TEL_PH","email":"EMAIL_PH","contactType":"sales","availableLanguage":["uk","pl","en"]}]},'
    '{"@type":"WebSite","@id":"https://smoltech.com.ua/#website","url":"https://smoltech.com.ua/",'
    '"name":"SMOLTECH — машини контактного зварювання","inLanguage":"uk-UA","publisher":{"@id":"https://smoltech.com.ua/#org"}}'
    "]}".replace("\n", "")
)


def _esc(s: str) -> str:
    return (
        str(s or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _strip(s: str) -> str:
    t = re.sub(r"<[^>]+>", " ", s or "")
    t = html.unescape(re.sub(r"\s+", " ", t)).strip()
    return t


def parse_front_matter(text: str) -> tuple[dict[str, str], str]:
    text = text.lstrip("\ufeff").lstrip()
    m = re.match(r"(?s)^---\r?\n(.*?)\r?\n---\r?\n(.*)$", text)
    if not m:
        raise ValueError("Brak front matter.")
    meta: dict[str, str] = {}
    for line in m.group(1).splitlines():
        if not line.strip() or ":" not in line:
            continue
        k, v = line.split(":", 1)
        meta[k.strip()] = v.strip()
    return meta, m.group(2)


def dump_front_matter(meta: dict[str, str], body: str) -> str:
    order = ["out", "url", "nav", "title", "desc", "ogtitle", "og", "ogtype", "crumbs", "prio", "pl", "head", "noindex"]
    lines = ["---"]
    seen = set()
    for k in order:
        if k in meta and str(meta[k]).strip() != "":
            lines.append(f"{k}: {str(meta[k]).strip()}")
            seen.add(k)
    for k, v in meta.items():
        if k not in seen and str(v).strip() != "":
            lines.append(f"{k}: {str(v).strip()}")
    lines.append("---")
    lines.append("")
    body = body.lstrip("\n")
    if not body.endswith("\n"):
        body += "\n"
    return "\n".join(lines) + "\n" + body


def page_kind(name: str, nav: str) -> str:
    if name.startswith("00"):
        return "home"
    if name.startswith("10") or name.startswith("11"):
        return "company"
    if re.match(r"^4\d", name):
        return "studs"
    if name.startswith("50"):
        return "video"
    if name.startswith("60"):
        return "contact"
    if name.startswith("70") or name.startswith("90"):
        return "legal"
    if nav in ("machines", "studs", "company", "video", "contact"):
        return nav if nav != "machines" else "machines"
    return "machines" if name[:2] in {"20", "21", "22", "23", "24", "25", "30", "31"} else "other"


def extract_hero(body: str) -> dict:
    m = re.search(r'(<section class="hero\b.*?</section>)', body, re.S)
    block = m.group(1) if m else body[:4000]
    def grab(pat: str) -> str:
        mm = re.search(pat, block, re.S)
        return mm.group(1).strip() if mm else ""
    h1 = grab(r"<h1[^>]*>(.*?)</h1>")
    ctas = []
    btn = re.search(r'<div class="hero__btns">(.*?)</div>', block, re.S)
    if btn:
        for a in re.finditer(r'<a class="([^"]*)" href="([^"]+)">\s*([^<]+)', btn.group(1)):
            ctas.append({"href": a.group(2), "label": a.group(3).strip(), "ghost": "btn-ghost" in a.group(1)})
    img = ""
    im = re.search(r'<img src="(/assets/img/[^"?]+)', block)
    if im:
        img = im.group(1)
    return {
        "eyebrow": _strip(grab(r'<p class="eyebrow">(.*?)</p>')),
        "h1": h1,
        "sub": grab(r'<p class="hero__sub">(.*?)</p>'),
        "image": img,
        "ctas": ctas,
        "present": bool(m),
    }


def extract_stats(body: str) -> list[dict]:
    out = []
    for m in re.finditer(
        r'<div class="stats__i">\s*<dt class="stats__l">(.*?)</dt>\s*<dd class="stats__n[^"]*">(.*?)</dd>',
        body,
        re.S,
    ):
        out.append({"label": _strip(m.group(1)), "value": _strip(m.group(2))})
    return out


def extract_mach(body: str) -> list[dict]:
    items = []
    for m in re.finditer(r'<article class="mach\b[^"]*"([^>]*)>(.*?)</article>', body, re.S):
        attrs, inner = m.group(1), m.group(2)
        aid = re.search(r'\bid="([^"]+)"', attrs)
        topic = re.search(r'data-ask-topic="([^"]*)"', attrs)
        vid = re.search(r'data-vid="([^"]+)"', inner)
        title = re.search(r"<h3\b[^>]*>(.*?)</h3>", inner, re.S)
        vtitle = re.search(r'data-title="([^"]*)"', inner)
        desc = ""
        rich = re.search(r'<div class="mach__text"[^>]*>(.*?)</div>', inner, re.S)
        if rich:
            desc = rich.group(1).strip()
        else:
            after = re.search(r"</h3>\s*(<p(?! class=\"mach__links\")>.*?</p>)", inner, re.S)
            if after:
                desc = re.sub(r"^<p>|</p>$", "", after.group(1), flags=re.S).strip()
        pic = re.search(r'<img class="mach__pic"[^>]*\ssrc="([^"?]+)', inner)
        ask = re.search(r'<a class="arrow-link"[^>]*>([^<]+)', inner)
        items.append({
            "id": aid.group(1) if aid else "",
            "topic": html.unescape(topic.group(1)) if topic else "",
            "video": vid.group(1) if vid else "",
            "videoTitle": html.unescape(vtitle.group(1)) if vtitle else "",
            "title": _strip(title.group(1) if title else ""),
            "html": desc,
            "image": pic.group(1) if pic else "",
            "ask": _strip(ask.group(1)) if ask else "",
        })
    return items


def extract_faq(body: str) -> list[dict]:
    items = []
    for block in _faq_blocks(body):
        for m in re.finditer(
            r"<details>\s*<summary>(.*?)</summary>\s*<div class=\"faq__a\">(.*?)</div>\s*</details>",
            block,
            re.S,
        ):
            ans = m.group(2).strip()
            ans = re.sub(r"^<p>|</p>$", "", ans.strip(), flags=re.S).strip()
            items.append({"q": _strip(m.group(1)), "a": ans})
    return items


def extract_people(body: str) -> list[dict]:
    items = []
    for m in re.finditer(r'<article class="pcard pcard--contact[^"]*">(.*?)</article>', body, re.S):
        inner = m.group(1)
        role = re.search(r'<span class="pcard__role">(.*?)</span>', inner, re.S)
        name = re.search(r"<h3>(.*?)</h3>", inner, re.S)
        emails = re.findall(r'mailto:([^"]+)"', inner)
        phones = re.findall(r'<a href="tel:[^"]+">([^<]+)</a>', inner)
        items.append({
            "role": _strip(role.group(1) if role else ""),
            "name": _strip(name.group(1) if name else ""),
            "email": emails[0] if emails else "",
            "phones": phones,
        })
    return items


def extract_areas(body: str) -> list[dict]:
    items = []
    for m in re.finditer(r'<article class="area\b[^"]*">(.*?)</article>', body, re.S):
        inner = m.group(1)
        h3 = re.search(r"<h3>(.*?)</h3>", inner, re.S)
        paras = [_strip(p) for p in re.findall(r"<p>(.*?)</p>", inner, re.S)]
        img = re.search(r'<img src="(/assets/img/[^"?]+)', inner)
        href = re.search(r'<a class="arrow-link" href="([^"]+)"', inner)
        items.append({
            "title": _strip(h3.group(1) if h3 else ""),
            "text": "\n\n".join(paras),
            "image": img.group(1) if img else "",
            "href": href.group(1) if href else "",
        })
    return items


def patch_hero(body: str, hero: dict) -> str:
    if not hero:
        return body
    m = re.search(r'(<section class="hero\b.*?</section>)', body, re.S)
    if not m:
        return body
    block = m.group(1)

    if hero.get("eyebrow") is not None:
        block = re.sub(r'(<p class="eyebrow">)(.*?)(</p>)', r"\1" + _esc(hero.get("eyebrow") or "") + r"\3", block, count=1, flags=re.S)
    if hero.get("h1") is not None:
        block = re.sub(r"(<h1[^>]*>)(.*?)(</h1>)", r"\1" + str(hero.get("h1") or "") + r"\3", block, count=1, flags=re.S)
    if hero.get("sub") is not None:
        block = re.sub(r'(<p class="hero__sub">)(.*?)(</p>)', r"\1" + str(hero.get("sub") or "") + r"\3", block, count=1, flags=re.S)
    if hero.get("image"):
        new = str(hero["image"]).strip()
        im = re.search(r'<img src="([^"]+)"', block)
        if im and new:
            block = _replace_src(block, im.group(1), new)
            sm = re.search(r'<source[^>]*srcset="([^"]+)"', block)
            if sm:
                block = _replace_src(block, sm.group(1), new)
                mime = _ext_mime(new)
                block = re.sub(r'(<source\b[^>]*type=")[^"]+', r"\1" + mime, block, count=1)
    return body[: m.start()] + block + body[m.end() :]


_RICH_TAGS = {"p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "span", "a", "sub", "sup"}
_RICH_STYLE = ("font-size", "font-family", "font-weight", "font-style", "text-decoration", "color", "text-align")


def _clean_style(style: str) -> str:
    keep = []
    for part in (style or "").split(";"):
        if ":" not in part:
            continue
        k, v = part.split(":", 1)
        k = k.strip().lower()
        v = v.strip()
        if k not in _RICH_STYLE or not v or re.search(r"url\(|expression|javascript", v, re.I):
            continue
        keep.append(f"{k}:{v}")
    return ";".join(keep)


def _clean_rich(raw: str) -> str:
    """Sanitise WYSIWYG HTML: block/inline formatting only, no scripts, no layout tags."""
    s = str(raw or "")
    s = re.sub(r"(?is)<(script|style|iframe|object|embed)\b.*?</\1>", "", s)
    s = re.sub(r"(?s)<!--.*?-->", "", s)

    def tag(m: re.Match) -> str:
        close = m.group(1) or ""
        name = m.group(2).lower()
        attrs = m.group(3) or ""
        if name in ("div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre"):
            name = "p"
        if name in ("font",):
            name = "span"
        if name not in _RICH_TAGS:
            return ""
        if close:
            return f"</{name}>"
        if name == "br":
            return "<br>"
        out = ""
        sm = re.search(r'style="([^"]*)"', attrs, re.I)
        if sm:
            st = _clean_style(html.unescape(sm.group(1)))
            if st:
                out += f' style="{_esc(st)}"'
        tm = re.search(r'data-st-type="(head|sub|body|small)"', attrs, re.I)
        if tm and name in ("span", "p", "li"):
            out += f' data-st-type="{tm.group(1).lower()}"'
        if name == "a":
            hm = re.search(r'href="([^"]*)"', attrs, re.I)
            href = html.unescape(hm.group(1)).strip() if hm else ""
            if href and re.match(r"^(https?://|mailto:|tel:|/|#)", href, re.I):
                out += f' href="{_esc(href)}"'
            if href.startswith("http"):
                out += ' target="_blank" rel="noopener"'
        return f"<{name}{out}>"

    s = re.sub(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>", tag, s)
    s = re.sub(r"<(span|strong|em|b|i|u|s|sub|sup)>\s*</\1>", "", s)
    s = re.sub(r"<span>(.*?)</span>", r"\1", s, flags=re.S)
    s = re.sub(r"<p([^>]*)>\s*(?:<br>\s*)*</p>", "", s)
    s = re.sub(r"\s*\n\s*", " ", s).strip()
    if not s:
        return ""
    if not re.match(r"^<(p|ul|ol)\b", s):
        s = f"<p>{s}</p>"
    return s


def render_mach(items: list[dict]) -> str:
    chunks = []
    delays = ["", " rv-d1", " rv-d2"]
    for i, it in enumerate(items):
        idx = f"{i + 1:02d}"
        delay = delays[i % 3]
        vid = (it.get("video") or "").strip()
        img = (it.get("image") or "").strip()
        title = (it.get("title") or "").strip()
        vtitle = (it.get("videoTitle") or title).strip()
        desc = _clean_rich(it.get("html") or "")
        ask = (it.get("ask") or "").strip() or ASK_LABEL
        aid = re.sub(r"[^a-zA-Z0-9_-]+", "-", (it.get("id") or f"m{i + 1}").strip()).strip("-") or f"m{i + 1}"
        topic = _esc(it.get("topic") or title)
        if vid:
            media = f'''          <div class="mach__film">
            <button class="yt" type="button" data-vid="{_esc(vid)}" data-title="{_esc(vtitle)}" aria-label="Дивитись відео: {_esc(vtitle)}">
              <img src="/assets/img/yt/{_esc(vid)}.jpg" alt="{_esc(vtitle)}" width="640" height="360" loading="lazy" decoding="async">
              {{{{YT_PLAY}}}}
            </button>
          </div>'''
        elif img:
            media = f'''          <div class="mach__film mach__film--img">
            <img class="mach__pic" src="{_esc(img)}" alt="{_esc(title)}" width="640" height="360" loading="lazy" decoding="async">
          </div>'''
        else:
            media = '          <div class="mach__film mach__film--empty" aria-hidden="true"></div>'
        chunks.append(f'''
      <article class="mach mach--clip mach--prod rv{delay}" id="{_esc(aid)}" data-ask-topic="{topic}">
        <div class="mach__side">
          <p class="mach__idx">{idx}</p>
          <h3>{_esc(title)}</h3>
{media}
          <p class="mach__links">
            <a class="arrow-link" href="#zapyt">{_esc(ask)}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </p>
        </div>
        <div class="mach__text">{desc}</div>
      </article>''')
    return "\n".join(chunks) + "\n"


def _product_section(items_html: str) -> str:
    return (
        f'\n<section class="sec sec-paper" id="{PRODUCT_SECTION_ID}">\n'
        '  <div class="wrap">\n'
        '    <div class="sec-head sec-head-wide rv">\n'
        '      <p class="eyebrow">Продукти</p>\n'
        '      <h2 class="h-lg">Наші продукти</h2>\n'
        '      <p class="lead">Оберіть конфігурацію та запитайте про пропозицію — підберемо рішення під вашу деталь.</p>\n'
        "    </div>\n\n"
        '    <div class="mach-list">\n'
        f"{items_html}"
        "    </div>\n"
        "  </div>\n"
        "</section>\n"
    )


def patch_mach(body: str, items: list | None) -> str:
    if items is None:
        return body
    m = re.search(r'<div class="mach-list">', body)
    end = _div_end(body, m.end()) if m else None
    if not m or end is None:
        if not items:
            return body
        section = _product_section(render_mach(items))
        tok = body.find("{{FORMULARZ}}")
        if tok != -1:
            return body[:tok].rstrip("\n") + "\n" + section + "\n" + body[tok:]
        return body.rstrip("\n") + "\n" + section
    return body[: m.start()] + m.group(0) + "\n" + render_mach(items) + "    </div>" + body[end:]


def _div_end(body: str, inner_start: int) -> int | None:
    """Index after the </div> that closes the div whose inner HTML starts at inner_start."""
    i = inner_start
    depth = 1
    while i < len(body):
        nxt_open = re.search(r"<div\b", body[i:])
        nxt_close = body.find("</div>", i)
        if nxt_close == -1:
            return None
        open_at = i + nxt_open.start() if nxt_open else None
        if open_at is not None and open_at < nxt_close:
            depth += 1
            i = open_at + 4
            continue
        depth -= 1
        if depth == 0:
            return nxt_close + len("</div>")
        i = nxt_close + 6
    return None


def _faq_blocks(body: str) -> list[str]:
    out = []
    for m in re.finditer(r'<div class="faq\b[^"]*">', body):
        end = _div_end(body, m.end())
        if end:
            out.append(body[m.start() : end])
    return out


def render_faq(items: list[dict]) -> str:
    bits = []
    for it in items:
        q = _esc(it.get("q") or "")
        a = it.get("a") or ""
        if not a.strip().startswith("<"):
            a = f"<p>{a}</p>"
        bits.append(f"      <details>\n        <summary>{q}</summary>\n        <div class=\"faq__a\">{a}</div>\n      </details>")
    return "\n".join(bits)


def _orphan_details_after(tail: str) -> tuple[list[str], int]:
    """Collect leftover <details> that sit after a prematurely closed .faq div."""
    blocks: list[str] = []
    i = 0
    n = len(tail)
    while i < n:
        while i < n and tail[i].isspace():
            i += 1
        if tail.startswith("</details>", i):
            i += len("</details>")
            continue
        if tail.startswith("</div>", i):
            j = i + 6
            while j < n and tail[j].isspace():
                j += 1
            if tail.startswith("</details>", j) or tail.startswith("<details", j):
                i = j
                continue
            break
        if not tail.startswith("<details", i):
            break
        end = tail.find("</details>", i)
        if end == -1:
            break
        end += len("</details>")
        blocks.append(tail[i:end])
        i = end
    while i < n and tail[i].isspace():
        i += 1
    if tail.startswith("</div>", i):
        i += 6
    return blocks, i


def sanitize_faq(body: str) -> str:
    """Dedupe FAQ items and swallow orphan <details> left outside .faq."""
    out = []
    pos = 0
    for m in re.finditer(r'<div class="faq\b[^"]*">', body):
        out.append(body[pos:m.start()])
        end = _div_end(body, m.end())
        if end is None:
            out.append(body[m.start():])
            return "".join(out)
        inner = body[m.end():end]
        blocks = re.findall(r"<details\b[\s\S]*?</details>", inner)
        extra, skip = _orphan_details_after(body[end:])
        blocks.extend(extra)
        seen: set[str] = set()
        unique: list[str] = []
        for block in blocks:
            qm = re.search(r"<summary>(.*?)</summary>", block, re.S)
            q = _strip(qm.group(1) if qm else "")
            if not q or q in seen:
                continue
            seen.add(q)
            unique.append(block.strip())
        rebuilt = m.group(0) + "\n" + "\n".join(unique) + "\n    </div>"
        out.append(rebuilt)
        pos = end + skip
    out.append(body[pos:])
    return "".join(out)


IMG_ALTS = {
    "hero-suspended": "Підвісна кліщова машина точкового зварювання SMOLTECH",
    "hero-stationary": "Стаціонарна машина точкового зварювання SMOLTECH",
    "hero-projection-cell": "Точково-рельєфна машина з лінійним притиском SMOLTECH",
    "hero-automation": "Автоматизований комплекс контактного зварювання SMOLTECH",
    "hero-mesh": "Багатоточкова машина для зварювання сіток SMOLTECH",
    "area-fixture": "Машина зварювання з оснасткою під деталь SMOLTECH",
    "stud-cnc-1": "Комплекс ЧПК для приварювання шпильок SMOLTECH",
    "stud-cnc-2": "Комплекс ЧПК для автоматичного приварювання шпильок SMOLTECH",
    "stud-da-series": "Інверторні пристрої DA для приварювання шпильок",
    "stud-cdm-series": "Конденсаторні пристрої CDM для приварювання шпильок",
    "company-hall-1": "Виробничий цех SMOLTECH у Мокроносі-Дольному під Вроцлавом",
    "company-hall-2": "Виробничий цех SMOLTECH — машини контактного зварювання",
    "band-realizacje": "Відео реалізацій автоматизації зварювання SMOLTECH",
    "prod-etech": "Інверторна багатофункціональна машина E-tech SMOLTECH",
}


def _fill_named_img_alts(body: str) -> str:
    def img(m: re.Match) -> str:
        tag = m.group(0)
        am = re.search(r'\balt="([^"]*)"', tag)
        if am and am.group(1).strip():
            return tag
        sm = re.search(r'\bsrc="([^"]+)"', tag)
        if not sm:
            return tag
        stem = Path(sm.group(1).split("?")[0]).stem
        alt = IMG_ALTS.get(stem)
        if not alt:
            return tag
        if am:
            return tag[: am.start(1)] + _esc(alt) + tag[am.end(1) :]
        if tag.endswith("/>"):
            return f'{tag[:-2]} alt="{_esc(alt)}"/>'
        return f'{tag[:-1]} alt="{_esc(alt)}">'

    return re.sub(r"<img\b[^>]*>", img, body)


def _fill_yt_alts(body: str) -> str:
    def block(m: re.Match) -> str:
        title = html.unescape(m.group(1))
        inner = m.group(0)
        return re.sub(
            r'(<img\b[^>]*\balt=")[^"]*',
            lambda mm, t=_esc(title): mm.group(1) + t,
            inner,
            count=1,
        )

    return re.sub(
        r'<button class="yt"[^>]*data-title="([^"]*)"[^>]*>[\s\S]*?</button>',
        block,
        body,
    )


def seo_tune_body(body: str) -> str:
    return _fill_named_img_alts(_fill_yt_alts(sanitize_faq(body)))


def render_faq_ld(items: list[dict]) -> str:
    ents = []
    seen: set[str] = set()
    for it in items:
        q = _strip(it.get("q") or "")
        a = _strip(it.get("a") or "")
        if not q or not a or q in seen:
            continue
        seen.add(q)
        ents.append({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": {"@type": "Answer", "text": a},
        })
    if not ents:
        return ""
    return _ld_script({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": ents})


def patch_faq(body: str, items: list | None) -> str:
    if items is None:
        return body
    m = re.search(r'<div class="faq\b[^"]*">', body)
    if not m:
        return body
    end = _div_end(body, m.end())
    if end is None:
        return body
    extra, skip = _orphan_details_after(body[end:])
    return body[: m.start()] + m.group(0) + "\n" + render_faq(items) + "\n    </div>" + body[end + skip :]


def patch_people(body: str, items: list | None) -> str:
    if not items:
        return body
    articles = list(re.finditer(r'<article class="pcard pcard--contact[^"]*">.*?</article>', body, re.S))
    if len(articles) != len(items):
        # replace field-by-field for overlapping count
        pass
    out = body
    # replace from the end so offsets stay valid
    pairs = list(zip(articles, items))
    for art, it in reversed(pairs):
        inner_src = art.group(0)
        inner = inner_src
        if it.get("role") is not None:
            inner = re.sub(r'(<span class="pcard__role">)(.*?)(</span>)', r"\1" + _esc(it["role"]) + r"\3", inner, count=1, flags=re.S)
        if it.get("name") is not None:
            inner = re.sub(r"(<h3>)(.*?)(</h3>)", r"\1" + _esc(it["name"]) + r"\3", inner, count=1, flags=re.S)
        if it.get("email"):
            em = it["email"].strip()
            inner = re.sub(r'mailto:[^"]+', "mailto:" + em, inner, count=1)
            inner = re.sub(r'(mailto:[^"]+">)([^<]+)', r"\1" + _esc(em), inner, count=1)
        phones = it.get("phones") or []
        found = list(re.finditer(r'(<a href="tel:[^"]+">)([^<]+)(</a>)', inner))
        for j, ph in enumerate(phones):
            if j < len(found):
                fm = found[j]
                tel = re.sub(r"[^\d+]", "", ph)
                inner = inner[: fm.start()] + f'<a href="tel:{tel}">{_esc(ph)}</a>' + inner[fm.end() :]
                found = list(re.finditer(r'(<a href="tel:[^"]+">)([^<]+)(</a>)', inner))
        out = out[: art.start()] + inner + out[art.end() :]
    return out


def patch_areas(body: str, items: list | None) -> str:
    if not items:
        return body
    articles = list(re.finditer(r'<article class="area\b[^"]*">.*?</article>', body, re.S))
    out = body
    for art, it in reversed(list(zip(articles, items))):
        inner = art.group(0)
        if it.get("title") is not None:
            inner = re.sub(r"(<h3>)(.*?)(</h3>)", r"\1" + _esc(it["title"]) + r"\3", inner, count=1, flags=re.S)
        paras = [p.strip() for p in re.split(r"\n\s*\n", it.get("text") or "") if p.strip()]
        existing = list(re.finditer(r"<p>(.*?)</p>", inner, re.S))
        body_m = re.search(r'(<div class="area__body">)(.*?)(</div>)', inner, re.S)
        if body_m and paras:
            h3m = re.search(r"<h3>.*?</h3>", body_m.group(2), re.S)
            h3 = h3m.group(0) if h3m else f"<h3>{_esc(it.get('title') or '')}</h3>"
            extra = "".join(f"\n          <p>{_esc(p)}</p>" if "<" not in p else f"\n          <p>{p}</p>" for p in paras)
            link = ""
            lm = re.search(r'<a class="arrow-link".*?</a>', body_m.group(2), re.S)
            if lm:
                link = "\n          " + lm.group(0)
            new_body = h3 + extra + link + "\n        "
            inner = inner[: body_m.start()] + body_m.group(1) + "\n          " + new_body + body_m.group(3) + inner[body_m.end() :]
        if it.get("href") and 'arrow-link' in inner:
            inner = re.sub(r'(<a class="arrow-link" href=")[^"]+', r"\1" + it["href"], inner, count=1)
        if it.get("image"):
            img_m = re.search(r'<img src="([^"]+)"', inner)
            if img_m:
                inner = _replace_src(inner, img_m.group(1), it["image"])
            src_m = re.search(r'<source[^>]*srcset="([^"]+)"', inner)
            if src_m:
                inner = _replace_src(inner, src_m.group(1), it["image"])
        out = out[: art.start()] + inner + out[art.end() :]
    return out


def _classes(attrs: str) -> str:
    m = re.search(r'class="([^"]*)"', attrs or "")
    return m.group(1) if m else ""


def _copy_kind(tag: str, attrs: str, loose: bool = False) -> str | None:
    cls = _classes(attrs)
    bits = set(cls.split())
    tag = tag.lower()
    if "yt" in bits:
        return None
    if tag == "div" and "param-matrix__val" in bits:
        return "cell"
    if tag == "div" and "param-matrix__head" in bits and "param-matrix__label" not in bits:
        return "h3"
    if tag == "div" and "param-matrix__label" in bits and "param-matrix__head" not in bits:
        return "cell"
    if tag == "span" and "model-strip__name" in bits:
        return "h3"
    if "param-matrix" in cls or "model-strip" in cls:
        return None
    if tag == "div":
        return "rich" if "mach__text" in bits else None
    if loose and tag == "span" and not bits:
        return "label"
    if loose and tag == "span" and "cta__phone" in bits:
        return None
    if tag == "p" and "eyebrow" in bits:
        return "eyebrow"
    if tag == "h1":
        return "h1"
    if tag == "p" and "hero__sub" in bits:
        return "hero__sub"
    if tag == "h2":
        return "h2"
    if tag == "p" and "ftr__h" in bits:
        return "h2"
    if tag == "p" and "lead" in bits:
        return "lead"
    if tag == "h3":
        return "h3"
    if tag == "span" and "tag" in bits:
        return "tag"
    if tag == "dt" and "stats__l" in bits:
        return "stats__l"
    if tag == "dd" and "stats__n" in bits:
        return "stats__n"
    if tag == "span" and "proof__l" in bits:
        return "proof__l"
    if tag == "strong" and "proof__n" in bits:
        return "proof__n"
    if tag == "summary":
        return "summary"
    if tag == "a" and "btn" in bits:
        return "btn"
    if tag in ("a", "span") and "arrow-link" in bits:
        return "link"
    if tag == "button" and ("chip" in bits or "yt" in bits or "model-strip__btn" in bits):
        return None
    if tag == "button" and "btn" in bits:
        return "btn"
    if tag == "p" and not bits.intersection({"mach__idx", "mach__links", "hint", "vh"}):
        return "p"
    if tag == "li":
        return "li"
    return None


def _ctx_skip(body: str, pos: int) -> bool:
    gt = body.find(">", pos)
    open_tag = body[pos:gt] if gt != -1 else ""
    if "tile__no" in open_tag or "area__no" in open_tag:
        return True
    before = body[max(0, pos - 220): pos]
    # Product card: number/title on the left column, rich text on the right — all editable.
    if 'class="mach__side"' in before[-140:] or open_tag.startswith('<div class="mach__text"'):
        return False
    if 'class="mach__links"' in before[-60:]:
        return False
    if "param-matrix__cell" in open_tag or "model-strip__name" in open_tag:
        return False
    ctx = before + body[pos: pos + 80]
    skip = (
        "param-matrix",
        "model-strip",
        "vgrid",
        "vcard",
        "chips",
        'class="yt',
        "mach__body",
        "faq__",
        "area__menu",
        "pcard",
        "otp",
        "client-grid",
        "logo-grid",
    )
    return any(s in ctx for s in skip)


def extract_copy(body: str, loose: bool = False) -> list[dict]:
    items = []
    pats = (
        re.compile(
            r"<(p|h1|h2|h3|dt|dd|li|span|button|strong|summary)\b([^>]*)>(.*?)</\1>",
            re.S | re.I,
        ),
        re.compile(r"<(a)\b([^>]*\b(?:btn|arrow-link)\b[^>]*)>(.*?)</\1>", re.S | re.I),
        re.compile(r'<(div)\b([^>]*\bclass="mach__text"[^>]*)>(.*?)</\1>', re.S | re.I),
        re.compile(r'<(div)\b([^>]*\bclass="[^"]*param-matrix__cell[^"]*"[^>]*)>(.*?)</\1>', re.S | re.I),
    )
    hits = []
    for pat in pats:
        hits.extend(pat.finditer(body))
    hits.sort(key=lambda m: (m.start(), -(m.end() - m.start())))
    used: list[tuple[int, int]] = []
    for m in hits:
        if any(s <= m.start() < e for s, e in used):
            continue
        if _ctx_skip(body, m.start()):
            continue
        tag = m.group(1).lower()
        attrs = m.group(2) or ""
        inner = m.group(3)
        kind = _copy_kind(tag, attrs, loose)
        if not kind:
            continue
        if kind == "label" and ("<input" in inner or "<textarea" in inner or "<svg" in inner):
            continue
        if kind == "li":
            stripped = inner.strip()
            if stripped.startswith("<a ") or stripped.startswith("<button"):
                continue
            if "<ul" in inner or "<ol" in inner:
                continue
        text = _strip(inner)
        if not text:
            continue
        if kind != "cell" and len(text) < 2:
            continue
        if text in {"01", "02", "03", "04", "05"}:
            continue
        inner_start = m.start() + m.group(0).index(">") + 1
        inner_end = inner_start + len(inner)
        keep_html = kind in {"hero__sub", "h1", "p", "lead", "link", "stats__n", "proof__n", "rich", "label", "li", "h3", "cell"}
        section = text if kind == "h2" else _section_before(body, m.start())
        items.append({
            "i": len(items),
            "kind": kind,
            "label": COPY_LABELS.get(kind, "Tekst"),
            "section": section,
            "html": inner.strip() if keep_html else text,
            "plain": text,
            "_s": inner_start,
            "_e": inner_end,
        })
        used.append((m.start(), m.end()))
    return items


def patch_copy(body: str, items: list | None, loose: bool = False) -> str:
    if not items:
        return body
    found = extract_copy(body, loose)
    n = min(len(found), len(items))
    out = body
    for i in range(n - 1, -1, -1):
        if not isinstance(items[i], dict):
            continue
        new = items[i].get("html")
        if new is None:
            new = items[i].get("plain")
        if new is None:
            continue
        f = found[i]
        new = str(new)
        if f["kind"] == "rich":
            new = _clean_rich(new)
        else:
            new = _clean_inline(new)
        out = out[: f["_s"]] + new + out[f["_e"] :]
    return out


def _clean_inline(raw: str) -> str:
    """Heading/paragraph HTML from the editor: keep markup, drop scripts and inline handlers."""
    s = str(raw or "")
    s = re.sub(r"(?is)<(script|style|iframe|object|embed)\b.*?</\1>", "", s)
    s = re.sub(r"(?is)<(script|style|iframe|object|embed)\b[^>]*>", "", s)
    s = re.sub(r'(?i)\s+on[a-z]+\s*=\s*"[^"]*"', "", s)
    s = re.sub(r"(?i)\s+on[a-z]+\s*=\s*'[^']*'", "", s)
    s = re.sub(r'(?i)(href|src)\s*=\s*"\s*javascript:[^"]*"', r'\1="#"', s)
    s = re.sub(r"(?i)<(/?)div\b[^>]*>", lambda m: "<br>" if m.group(1) else "", s)
    s = re.sub(r'(?i)<(/?)font\b([^>]*)>', lambda m: f"<{m.group(1)}span{m.group(2)}>", s)
    s = re.sub(r"(?:\s*<br\s*/?>\s*)+$", "", s.strip())
    return s.strip()


def _img_kind(body: str, pos: int) -> str:
    ctx = body[max(0, pos - 900): pos]
    last_sec = ctx.rfind("<section")
    chunk = ctx[last_sec:] if last_sec != -1 else ctx
    if "hero" in chunk and (
        "hero__bg" in chunk or "hero__shot" in chunk or "hero__emerge" in chunk or "hero--" in chunk
    ):
        return "hero"
    if 'class="tile' in chunk or "class='tile" in chunk:
        return "tile"
    if 'class="area' in chunk:
        return "area"
    return "photo"


def extract_images(body: str) -> list[dict]:
    items = []
    for m in re.finditer(r"<img\s([^>]*?)>", body, re.I | re.S):
        attrs = m.group(1)
        sm = re.search(r'src="([^"]+)"', attrs)
        if not sm:
            continue
        raw = sm.group(1)
        src = raw.split("?")[0]
        if not src.startswith("/assets/img/"):
            continue
        low = src.lower()
        if any(x in low for x in ("/yt/", "favicon", "apple-touch", "icon-192", "icon-512")):
            continue
        kind = _img_kind(body, m.start())
        altm = re.search(r'alt="([^"]*)"', attrs)
        webp = ""
        look = body[max(0, m.start() - 420): m.start()]
        pm = re.search(r'<source[^>]*srcset="([^"]+)"[^>]*>\s*$', look, re.I | re.S)
        if pm:
            webp = pm.group(1).split("?")[0]
        cm = re.search(r'data-st-crop="([^"]*)"', attrs)
        items.append({
            "i": len(items),
            "kind": kind,
            "src": src,
            "webp": webp,
            "alt": altm.group(1) if altm else "",
            "crop": _norm_crop(cm.group(1) if cm else ""),
            "section": _section_before(body, m.start()),
            "caption": _caption_near(body, m.start()),
            "_src_raw": raw,
            "_webp_raw": pm.group(1) if pm else "",
            "_pos": m.start(),
            "_end": m.end(),
        })
    return items


def _ext_mime(url: str) -> str:
    ext = Path(str(url).split("?")[0]).suffix.lower()
    return {
        ".webp": "image/webp",
        ".png": "image/png",
        ".gif": "image/gif",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }.get(ext, "image/jpeg")


def _norm_crop(val) -> str:
    s = str(val or "").strip()
    m = re.fullmatch(r"(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)", s)
    if not m:
        return ""
    x = max(0.0, min(100.0, float(m.group(1))))
    y = max(0.0, min(100.0, float(m.group(2))))
    z = max(1.0, min(3.0, float(m.group(3))))
    return f"{x:.1f},{y:.1f},{z:.3f}"


def _apply_crop_to_tag(tag: str, crop: str) -> str:
    tag = re.sub(r'\sdata-st-crop="[^"]*"', "", tag)
    sm = re.search(r'\sstyle="([^"]*)"', tag)
    style = sm.group(1) if sm else ""
    if sm:
        tag = tag[: sm.start()] + tag[sm.end() :]
    style = re.sub(r"--st-(?:x|y|z)\s*:[^;]*;?", "", style)
    style = re.sub(r"\s*;+\s*", ";", style).strip(" ;")
    ins = ""
    if crop:
        x, y, z = crop.split(",")
        ins += f' data-st-crop="{crop}"'
        bits = [style] if style else []
        bits.append(f"--st-x:{x}%;--st-y:{y}%;--st-z:{z}")
        ins += f' style="{";".join(bits)}"'
    elif style:
        ins += f' style="{style}"'
    if tag.lower().startswith("<img"):
        return tag[:4] + ins + tag[4:]
    return tag


def _replace_src(body: str, old: str, new: str) -> str:
    if not old or not new or old == new:
        return body
    body = body.replace(f'src="{old}"', f'src="{new}"')
    body = body.replace(f'srcset="{old}"', f'srcset="{new}"')
    if "?" not in old:
        body = re.sub(
            r'(src|srcset)="' + re.escape(old) + r'(\?[^"]*)?"',
            rf'\1="{new}"',
            body,
        )
    return body


def patch_images(body: str, items: list | None) -> str:
    if not items:
        return body
    found = extract_images(body)
    n = min(len(found), len(items))
    out = body
    for i in range(n - 1, -1, -1):
        new = str(items[i].get("src") or "").strip()
        if not new:
            continue
        old = found[i]["src"]
        old_raw = found[i].get("_src_raw") or old
        webp_raw = found[i].get("_webp_raw") or ""
        if new.split("?")[0] == old and new.split("?")[0] == old_raw.split("?")[0]:
            alt = items[i].get("alt")
            if alt is not None and found[i].get("alt") != alt:
                out = re.sub(
                    r'(<img\b[^>]*src="' + re.escape(old_raw) + r'"[^>]*alt=")[^"]*',
                    r"\1" + _esc(alt),
                    out,
                    count=1,
                )
            continue
        out = _replace_src(out, old_raw, new)
        if old_raw != old:
            out = _replace_src(out, old, new)
        if webp_raw:
            out = _replace_src(out, webp_raw, new)
            mime = _ext_mime(new)
            out = re.sub(
                r'(<source\b[^>]*type=")[^"]+("[^>]*srcset="' + re.escape(new) + r'")',
                r"\1" + mime + r"\2",
                out,
                count=1,
            )
            out = re.sub(
                r'(<source\b[^>]*srcset="' + re.escape(new) + r'"[^>]*type=")[^"]+',
                r"\1" + mime,
                out,
                count=1,
            )
        alt = items[i].get("alt")
        if alt is not None:
            out = re.sub(
                r'(<img\b[^>]*src="' + re.escape(new) + r'"[^>]*alt=")[^"]*',
                r"\1" + _esc(alt),
                out,
                count=1,
            )
    found2 = extract_images(out)
    n2 = min(len(found2), len(items))
    for i in range(n2 - 1, -1, -1):
        if "crop" not in items[i]:
            continue
        crop = _norm_crop(items[i].get("crop"))
        if crop == (found2[i].get("crop") or ""):
            continue
        s = found2[i]["_pos"]
        e = found2[i]["_end"]
        out = out[:s] + _apply_crop_to_tag(out[s:e], crop) + out[e:]
    return out


def extract_tiles(body: str) -> list[dict]:
    items = []
    for m in re.finditer(r'<a class="tile\b[^"]*"([^>]*)>(.*?)</a>', body, re.S):
        inner = m.group(2)
        href_a = re.search(r'href="([^"]+)"', m.group(0))
        h3 = re.search(r"<h3>(.*?)</h3>", inner, re.S)
        tag = re.search(r'<span class="tag">(.*?)</span>', inner, re.S)
        para = re.search(r"<p>(.*?)</p>", inner, re.S)
        img = re.search(r'<img src="([^"]+)"', inner)
        link = re.search(r'<(?:span|a) class="arrow-link"[^>]*>([^<]+)', inner, re.S)
        items.append({
            "href": href_a.group(1) if href_a else "",
            "tag": _strip(tag.group(1) if tag else ""),
            "title": _strip(h3.group(1) if h3 else ""),
            "text": _strip(para.group(1) if para else ""),
            "link": _strip(link.group(1) if link else ""),
            "image": (img.group(1).split("?")[0] if img else ""),
        })
    return items


def patch_tiles(body: str, items: list | None) -> str:
    if not items:
        return body
    articles = list(re.finditer(r'<a class="tile\b[^"]*"[^>]*>.*?</a>', body, re.S))
    out = body
    for art, it in reversed(list(zip(articles, items))):
        inner = art.group(0)
        if it.get("title") is not None:
            inner = re.sub(r"(<h3>)(.*?)(</h3>)", r"\1" + _esc(it["title"]) + r"\3", inner, count=1, flags=re.S)
        if it.get("tag") is not None:
            inner = re.sub(
                r'(<span class="tag">)(.*?)(</span>)',
                r"\1" + _esc(it["tag"]) + r"\3",
                inner,
                count=1,
                flags=re.S,
            )
        if it.get("text") is not None:
            inner = re.sub(r"(<p>)(.*?)(</p>)", r"\1" + _esc(it["text"]) + r"\3", inner, count=1, flags=re.S)
        if it.get("href"):
            inner = re.sub(r'(href=")[^"]+', r"\1" + it["href"], inner, count=1)
        if it.get("image"):
            img_m = re.search(r'<img src="([^"]+)"', inner)
            if img_m:
                inner = _replace_src(inner, img_m.group(1), it["image"])
            src_m = re.search(r'<source[^>]*srcset="([^"]+)"', inner)
            if src_m:
                inner = _replace_src(inner, src_m.group(1), it["image"])
        if it.get("link") is not None:
            inner = re.sub(
                r'(<(?:span|a) class="arrow-link"[^>]*>)([^<]+)',
                r"\1" + _esc(it["link"]),
                inner,
                count=1,
            )
        out = out[: art.start()] + inner + out[art.end() :]
    return out


_ARROW_SVG = (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">'
    '<path d="M5 12h14M13 6l6 6-6 6"/></svg>'
)
_CELL_RE = re.compile(r'<div class="(param-matrix__cell[^"]*)"([^>]*)>(.*?)</div>', re.S)
_FILM_RE = re.compile(r'<article class="film-rail__i\b[^"]*">(.*?)</article>', re.S)
_TILE_RE = re.compile(r'<a class="tile\b[^"]*"[^>]*>.*?</a>', re.S)
_STRIP_RE = re.compile(r'(<ul class="model-strip\b[^"]*"[^>]*>)(.*?)(</ul>)', re.S)
_TABLE_INNER_RE = re.compile(
    r'(<div class="param-matrix__table"[^>]*>)(.*?)(</div>\s*</div>\s*</div>)',
    re.S,
)
_MATRIX_WRAP_RE = re.compile(r'<div class="(param-matrix\b[^"]*)"([^>]*)>', re.S)


def _with_count(cls: str, prefix: str, n: int, default: int = 3) -> str:
    cls = re.sub(rf"\b{re.escape(prefix)}--\d+\b", "", cls)
    cls = re.sub(r"\s+", " ", cls).strip()
    if n != default:
        cls += f" {prefix}--{n}"
    return cls


def _slugify(s: str) -> str:
    s = html.unescape(s or "").lower().replace("–", "-").replace("—", "-")
    s = s.replace("ø", "o").replace("×", "x")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:70] or "nowa-grupa"


def page_catalog(body: str) -> dict:
    tiles = extract_tiles(body)
    models = extract_models(body)
    films = extract_films(body)
    return {
        "canAddMach": bool(re.search(r'class="mach-list"', body)),
        "canAddModel": bool(
            models
            and (models.get("columns") or models.get("rows"))
            and re.search(r'class="model-strip\b', body)
        ),
        "canAddFilm": bool(re.search(r'class="film-rail\b', body)),
        "canAddTile": bool(tiles),
        "tileCount": len(tiles),
        "modelCount": len((models or {}).get("columns") or []),
        "filmCount": len(films),
    }


def extract_models(body: str) -> dict | None:
    if "param-matrix" not in body:
        return None
    strip_m = _STRIP_RE.search(body)
    open_t = re.search(r'<div class="param-matrix__table"[^>]*>', body)
    if not open_t:
        return None
    tend = _div_end(body, open_t.end())
    if tend is None:
        return None
    table_inner = body[open_t.end() : tend - len("</div>")]
    columns: list[dict] = []
    if strip_m:
        for btn in re.finditer(r'<button class="model-strip__btn\b[^>]*>(.*?)</button>', strip_m.group(2), re.S):
            inner = btn.group(1)
            nm = re.search(r'<span class="model-strip__name"[^>]*>(.*?)</span>', inner, re.S)
            img = re.search(r'<img src="([^"]+)"', inner)
            altm = re.search(r'<img [^>]*alt="([^"]*)"', inner)
            columns.append({
                "name": _strip(nm.group(1) if nm else ""),
                "image": (img.group(1).split("?")[0] if img else ""),
                "alt": _strip(altm.group(1) if altm else ""),
            })
    cells = list(_CELL_RE.finditer(table_inner))
    heads: list[str] = []
    rows: list[dict] = []
    for cell in cells:
        cls = cell.group(1)
        html_in = cell.group(3).strip()
        is_head = "param-matrix__head" in cls
        is_label = "param-matrix__label" in cls
        is_val = "param-matrix__val" in cls
        if is_head and is_label:
            continue
        if is_head:
            heads.append(_strip(html_in))
            continue
        if is_label:
            rows.append({"label": _strip(html_in), "values": []})
            continue
        if is_val:
            if not rows:
                continue
            rows[-1]["values"].append(html_in)
    if heads and not columns:
        columns = [{"name": h, "image": "", "alt": ""} for h in heads]
    elif heads:
        for i, h in enumerate(heads):
            if i < len(columns) and h:
                columns[i]["name"] = columns[i].get("name") or h
    for i, col in enumerate(columns):
        col["values"] = []
        for row in rows:
            vals = row.get("values") or []
            col["values"].append(vals[i] if i < len(vals) else "—")
    wrap = _MATRIX_WRAP_RE.search(body)
    wrap_cls = wrap.group(1) if wrap else "param-matrix"
    aria = ""
    if strip_m:
        am = re.search(r'aria-label="([^"]*)"', strip_m.group(1))
        if am:
            aria = am.group(1)
    has_shots = bool(strip_m and "model-strip--shots" in strip_m.group(1))
    return {
        "hasShots": has_shots,
        "wide": "param-matrix--wide" in wrap_cls,
        "aria": aria,
        "rows": [{"label": r["label"]} for r in rows],
        "columns": columns,
    }


def _shot_picture(img: str, alt: str) -> str:
    img = (img or "").strip()
    alt_e = _esc(alt)
    if not img:
        return '<span class="model-strip__shot model-strip__shot--empty" data-cms-model-media="1"></span>'
    source = ""
    webp = str(Path(img).with_suffix(".webp")).replace("\\", "/")
    if (ROOT / webp.lstrip("/")).is_file():
        source = f'<source srcset="{_esc(webp)}" type="image/webp">'
    return (
        f'<span class="model-strip__shot"><picture>{source}'
        f'<img src="{_esc(img)}" alt="{alt_e}" width="311" height="262" loading="lazy" decoding="async">'
        f"</picture></span>"
    )


def _render_strip_item(col: dict, idx: int, has_shots: bool) -> str:
    n = idx + 1
    name = _esc(col.get("name") or f"Model {n}")
    active = " is-active" if idx == 0 else ""
    pressed = "true" if idx == 0 else "false"
    if not has_shots:
        return (
            f'<li><button class="model-strip__btn{active}" type="button" data-model="{n}" '
            f'aria-pressed="{pressed}"><span class="model-strip__name">{name}</span></button></li>'
        )
    shot = _shot_picture(col.get("image") or "", col.get("alt") or col.get("name") or "")
    return (
        f'<li><button class="model-strip__btn{active}" type="button" data-model="{n}" aria-pressed="{pressed}">'
        f'{shot}<span class="model-strip__name">{name}</span></button></li>'
    )


def _render_matrix_table(data: dict) -> str:
    cols = data.get("columns") or []
    rows = data.get("rows") or []
    n = len(cols)
    bits = [
        '<div class="param-matrix__cell param-matrix__head param-matrix__label" role="columnheader">Параметр</div>'
    ]
    for i, col in enumerate(cols):
        bits.append(
            f'<div class="param-matrix__cell param-matrix__head" role="columnheader" data-col="{i + 1}">'
            f'{_esc(col.get("name") or "")}</div>'
        )
    for r, row in enumerate(rows):
        bits.append(
            f'<div class="param-matrix__cell param-matrix__label" role="rowheader">{_esc(row.get("label") or "")}</div>'
        )
        for i, col in enumerate(cols):
            vals = col.get("values") or []
            raw = vals[r] if i < len(cols) and r < len(vals) else "—"
            inner = _clean_inline(raw) or "—"
            bits.append(
                f'<div class="param-matrix__cell param-matrix__val" data-col="{i + 1}">{inner}</div>'
            )
    return "\n".join(bits)


def patch_models(body: str, data: dict | None) -> str:
    if not data or not isinstance(data, dict):
        return body
    cols = data.get("columns")
    if not isinstance(cols, list) or not cols:
        return body
    current = extract_models(body) or {}
    has_shots = bool(data.get("hasShots") if "hasShots" in data else current.get("hasShots"))
    wide = bool(data.get("wide") if "wide" in data else current.get("wide"))
    n = len(cols)
    strip_m = _STRIP_RE.search(body)
    if strip_m:
        open_full = strip_m.group(1)
        open_cls_m = re.search(r'class="([^"]*)"', open_full)
        cls = _with_count(open_cls_m.group(1) if open_cls_m else "model-strip", "model-strip", n, 3)
        items_html = "".join(_render_strip_item(col, i, has_shots) for i, col in enumerate(cols))
        new_open = re.sub(r'class="[^"]*"', f'class="{cls}"', open_full, count=1)
        if has_shots and "style=" not in new_open:
            new_open = new_open[:-1] + f' style="--ms-cols:{n}">'
        elif has_shots:
            new_open = re.sub(r'style="[^"]*"', f'style="--ms-cols:{n}"', new_open)
        body = body[: strip_m.start()] + new_open + items_html + "</ul>" + body[strip_m.end() :]
    table_html = _render_matrix_table({"rows": data.get("rows") or current.get("rows") or [], "columns": cols})
    open_t = re.search(r'<div class="param-matrix__table"[^>]*>', body)
    if open_t:
        tend = _div_end(body, open_t.end())
        if tend is not None:
            body = body[: open_t.end()] + table_html + body[tend - len("</div>") :]
    wrap = _MATRIX_WRAP_RE.search(body)
    if wrap:
        cls = _with_count(wrap.group(1), "param-matrix", n, 3)
        if wide and "param-matrix--wide" not in cls:
            cls += " param-matrix--wide"
        attrs = wrap.group(2) or ""
        attrs = re.sub(r'\sstyle="[^"]*"', "", attrs)
        new = f'<div class="{cls}"{attrs} style="--pm-cols:{n}">'
        body = body[: wrap.start()] + new + body[wrap.end() :]
    return body


def extract_films(body: str) -> list[dict]:
    items = []
    for m in _FILM_RE.finditer(body):
        inner = m.group(1)
        vid = re.search(r'data-vid="([^"]*)"', inner)
        h3 = re.search(r"<h3\b[^>]*>(.*?)</h3>", inner, re.S)
        items.append({
            "video": (vid.group(1) if vid else "").strip(),
            "title": _strip(h3.group(1) if h3 else ""),
        })
    return items


def _render_film(it: dict) -> str:
    vid = parse_youtube_id(str(it.get("video") or ""))
    title = (it.get("title") or "").strip() or "Нове інструктажне відео"
    if vid:
        fetch_yt_thumb(vid)
        media = (
            f'<button class="yt" type="button" data-vid="{_esc(vid)}" data-title="{_esc(title)}" '
            f'aria-label="Дивитись відео: {_esc(title)}">'
            f'<img src="/assets/img/yt/{_esc(vid)}.jpg" alt="{_esc(title)}" width="480" height="360" loading="lazy" decoding="async">'
            f"{{{{YT_PLAY}}}}"
            f"</button>"
        )
    else:
        media = '<div class="film-rail__empty" data-cms-film-media="1"></div>'
    return (
        f'<article class="film-rail__i">\n        {media}\n        <h3>{_esc(title)}</h3>\n      </article>'
    )


def patch_films(body: str, items: list | None) -> str:
    if items is None:
        return body
    m = re.search(r'<div class="film-rail\b[^"]*"[^>]*>', body)
    if not m:
        return body
    end = _div_end(body, m.end())
    if end is None:
        return body
    n = len(items)
    open_tag = m.group(0)
    cls_m = re.search(r'class="([^"]*)"', open_tag)
    cls = _with_count(cls_m.group(1) if cls_m else "film-rail", "film-rail", n, 3)
    inner = "\n      ".join(_render_film(it) for it in items)
    new = f'<div class="{cls}" style="--film-cols:{n}">\n      {inner}\n    </div>'
    return body[: m.start()] + new + body[end:]


def _renumber_tiles(body: str) -> str:
    n = 0

    def repl(_m: re.Match) -> str:
        nonlocal n
        n += 1
        return f'<span class="tile__no">{n:02d}</span>'

    return re.sub(r'<span class="tile__no">[^<]*</span>', repl, body)


def _set_tile_grid(body: str, n: int) -> str:
    m = re.search(r'(<div class="grid g-\d+[^"]*")', body)
    if not m:
        return body
    g = "g-3" if n >= 3 else ("g-2" if n == 2 else "g-2")
    open_tag = re.sub(r"g-\d+", g, m.group(1), count=1)
    return body[: m.start()] + open_tag + body[m.end() :]


def _fill_tile_html(tpl: str, it: dict, idx: int) -> str:
    inner = tpl
    inner = re.sub(r'(href=")[^"]*', r"\1" + (it.get("href") or "#"), inner, count=1)
    if it.get("title") is not None:
        inner = re.sub(r"(<h3>)(.*?)(</h3>)", r"\1" + _esc(it["title"]) + r"\3", inner, count=1, flags=re.S)
    if it.get("tag") is not None:
        inner = re.sub(r'(<span class="tag">)(.*?)(</span>)', r"\1" + _esc(it["tag"]) + r"\3", inner, count=1, flags=re.S)
    if it.get("text") is not None:
        inner = re.sub(r"(<p>)(.*?)(</p>)", r"\1" + _esc(it["text"]) + r"\3", inner, count=1, flags=re.S)
    if it.get("link") is not None:
        inner = re.sub(
            r'(<(?:span|a) class="arrow-link"[^>]*>)([^<]+)',
            r"\1" + _esc(it["link"]),
            inner,
            count=1,
        )
    if it.get("image"):
        img_m = re.search(r'<img src="([^"]+)"', inner)
        if img_m:
            inner = _replace_src(inner, img_m.group(1), it["image"])
        src_m = re.search(r'<source[^>]*srcset="([^"]+)"', inner)
        if src_m:
            inner = _replace_src(inner, src_m.group(1), it["image"])
    inner = re.sub(r'<span class="tile__no">[^<]*</span>', f'<span class="tile__no">{idx + 1:02d}</span>', inner, count=1)
    return inner


def append_tile(body: str, item: dict) -> str:
    found = list(_TILE_RE.finditer(body))
    if not found:
        return body
    last = found[-1]
    html_tile = _fill_tile_html(last.group(0), item, len(found))
    body = body[: last.end()] + "\n      " + html_tile + body[last.end() :]
    body = _renumber_tiles(body)
    return _set_tile_grid(body, len(found) + 1)


def _norm_href(href: str) -> str:
    h = (href or "").strip()
    if not h or h == "#":
        return h
    return h.rstrip("/") + "/"


def remove_tile_by_href(body: str, href: str) -> str:
    want = _norm_href(href)
    if not want:
        return body
    found = list(_TILE_RE.finditer(body))
    for m in reversed(found):
        href_a = re.search(r'href="([^"]+)"', m.group(0))
        got = _norm_href(href_a.group(1) if href_a else "")
        if got != want:
            continue
        end = m.end()
        while end < len(body) and body[end] in " \t":
            end += 1
        if end < len(body) and body[end] == "\n":
            end += 1
        body = body[: m.start()] + body[end:]
        left = len(list(_TILE_RE.finditer(body)))
        body = _renumber_tiles(body)
        return _set_tile_grid(body, left)
    return body


def unlink_tiles_to(url: str) -> None:
    if not url:
        return
    for f in sorted(PAGES.glob("*.html")):
        raw = f.read_text(encoding="utf-8")
        meta, body = parse_front_matter(raw)
        new_body = remove_tile_by_href(body, url)
        if new_body != body:
            f.write_text(dump_front_matter(meta, new_body), encoding="utf-8")


def _clone_source_page(parent: dict, pages: list[dict]) -> Path | None:
    children = [p for p in pages if (p.get("parentUrl") or "") == (parent.get("url") or "") and p["id"] != parent["id"]]
    if not children:
        return None
    strip_kids = []
    matrix_kids = []
    mach_kids = []
    for ch in children:
        path = PAGES / f"{ch['id']}.html"
        if not path.is_file():
            continue
        raw = path.read_text(encoding="utf-8")
        if "model-strip" in raw:
            strip_kids.append(path)
        elif "param-matrix" in raw:
            matrix_kids.append(path)
        elif 'class="mach-list"' in raw:
            mach_kids.append(path)
    if strip_kids:
        return strip_kids[-1]
    if matrix_kids:
        return matrix_kids[-1]
    if mach_kids:
        return mach_kids[-1]
    last = children[-1]
    path = PAGES / f"{last['id']}.html"
    return path if path.is_file() else None


def _next_child_id(parent_id: str, slug: str, child_ids: list[str], used: set[str]) -> str:
    nums = []
    for uid in child_ids:
        m = re.match(r"^(\d+)", uid)
        if m:
            nums.append(int(m.group(1)))
    pm = re.match(r"^(\d+)", parent_id)
    parent_n = int(pm.group(1)) if pm else 0
    nxt = (max(nums) + 1) if nums else (parent_n * 10 + 1)
    base_slug = slug
    extra = 0
    while True:
        cand = f"{nxt}-{slug}"
        if cand not in used:
            return cand
        extra += 1
        slug = f"{base_slug}-{extra + 1}"


def add_child_page(data: dict) -> dict:
    parent_id = str(data.get("parent") or "")
    if not re.fullmatch(r"[A-Za-z0-9_-]+", parent_id):
        raise ValueError("Nieprawidłowa strona nadrzędna.")
    parent_path = PAGES / f"{parent_id}.html"
    if not parent_path.is_file():
        raise FileNotFoundError("Nie znaleziono strony nadrzędnej.")
    pages = list_pages()
    parent = next((p for p in pages if p["id"] == parent_id), None)
    if not parent:
        raise FileNotFoundError("Nie znaleziono strony nadrzędnej.")
    src_path = _clone_source_page(parent, pages)
    if not src_path:
        raise ValueError("Ta grupa nie ma jeszcze strony-szablonu, z której można skopiować układ.")
    title_en = str(data.get("title") or "").strip() or "New product group"
    tag_en = str(data.get("tag") or "").strip() or title_en
    text_en = str(data.get("text") or "").strip() or "Describe this machine group — power, process and typical parts."
    link_en = str(data.get("link") or "").strip() or ("See " + title_en)
    image = str(data.get("image") or "").strip()
    uk = {title_en: title_en, tag_en: tag_en, text_en: text_en, link_en: link_en}
    try:
        import tlumacz
        uk = tlumacz.translate_many([title_en, tag_en, text_en, link_en], "en", "uk")
    except Exception:
        pass
    title_uk = uk.get(title_en) or title_en
    tag_uk = uk.get(tag_en) or tag_en
    text_uk = uk.get(text_en) or text_en
    link_uk = uk.get(link_en) or link_en
    slug = _slugify(title_en)
    children = [p for p in pages if (p.get("parentUrl") or "") == (parent.get("url") or "") and p["id"] != parent["id"]]
    used = {p["id"] for p in pages}
    new_id = _next_child_id(parent_id, slug, [c["id"] for c in children], used)
    src_meta, src_body = parse_front_matter(src_path.read_text(encoding="utf-8"))
    nested = bool(parent.get("url") and any(
        (p.get("url") or "").startswith(parent["url"]) and p["id"] != parent["id"] for p in pages
    ))
    if nested and parent.get("url"):
        url = parent["url"].rstrip("/") + "/" + slug + "/"
    else:
        url = "/" + slug + "/"
    existing_urls = {p.get("url") for p in pages}
    i = 2
    base_url = url
    while url in existing_urls:
        url = base_url.rstrip("/") + f"-{i}/"
        i += 1
    out = url.strip("/") + "/index.html"
    parent_crumb = (parent.get("name") or title_uk)
    crumbs = f"{parent_crumb}>>{parent.get('url') or '/'} | {title_uk}"
    meta = dict(src_meta)
    meta["out"] = out
    meta["url"] = url
    meta["nav"] = parent.get("nav") or src_meta.get("nav") or "machines"
    meta["title"] = f"{title_uk} | SMOLTECH"
    meta["desc"] = text_uk
    meta["ogtitle"] = title_uk
    meta["crumbs"] = crumbs
    meta["prio"] = meta.get("prio") or "0.75"
    body = src_body
    body = re.sub(r"(<h1\b[^>]*>)(.*?)(</h1>)", r"\1" + _esc(title_uk) + r"\3", body, count=1, flags=re.S)
    dest = PAGES / f"{new_id}.html"
    dest.write_text(dump_front_matter(meta, body), encoding="utf-8")
    parent_raw = parent_path.read_text(encoding="utf-8")
    pmeta, pbody = parse_front_matter(parent_raw)
    if not image:
        tiles = extract_tiles(pbody)
        if tiles and tiles[-1].get("image"):
            image = tiles[-1]["image"]
        else:
            image = extract_hero(src_body).get("image") or ""
    pbody = append_tile(pbody, {
        "href": url,
        "title": title_uk,
        "tag": tag_uk,
        "text": text_uk,
        "link": link_uk,
        "image": image,
    })
    parent_path.write_text(dump_front_matter(pmeta, pbody), encoding="utf-8")
    i18n = {"translated": 0}
    try:
        import tlumacz
        texts = [title_uk, tag_uk, text_uk, link_uk, title_en, tag_en, text_en, link_en]
        i18n = tlumacz.safe_sync(texts)
    except Exception:
        pass
    mark_pending(f"page.add-child:{new_id}")
    return {
        "ok": True,
        "id": new_id,
        "url": url,
        "parent": parent_id,
        "i18n": i18n,
        "page": get_page(new_id),
        **pending_payload(),
    }


def delete_page(pid: str) -> dict:
    pid = str(pid or "")
    if not re.fullmatch(r"[A-Za-z0-9_-]+", pid):
        raise ValueError("Nieprawidłowa strona.")
    path = PAGES / f"{pid}.html"
    if not path.is_file():
        raise FileNotFoundError("Nie znaleziono strony.")
    pages = list_pages()
    page = next((p for p in pages if p["id"] == pid), None)
    if not page:
        raise FileNotFoundError("Nie znaleziono strony.")
    kids = [p for p in pages if (p.get("parentUrl") or "") == (page.get("url") or "") and p["id"] != pid]
    if kids:
        raise ValueError("Najpierw usuń podstrony tej grupy.")
    if not page.get("canDelete"):
        raise ValueError("Tej strony nie można usunąć.")
    raw = path.read_text(encoding="utf-8")
    meta, _body = parse_front_matter(raw)
    out = str(meta.get("out") or "").strip()
    url = str(meta.get("url") or page.get("url") or "").strip()
    unlink_tiles_to(url)
    path.unlink()
    mark_pending(f"page.delete:{pid}", removed_out=out)
    return {"ok": True, "id": pid, **pending_payload()}


def patch_stats(body: str, items: list | None) -> str:
    if not items:
        return body
    found = list(re.finditer(
        r'(<div class="stats__i">\s*<dt class="stats__l">)(.*?)(</dt>\s*<dd class="stats__n[^"]*">)(.*?)(</dd>)',
        body,
        re.S,
    ))
    out = body
    for m, it in reversed(list(zip(found, items))):
        label = it.get("label")
        value = it.get("value")
        inner_label = _esc(label) if label is not None else m.group(2)
        inner_val = m.group(4)
        if value is not None:
            val = str(value).strip()
            num = re.sub(r"[^\d]", "", val)
            if val.endswith("+") and num:
                inner_val = f'<span class="stats__v" data-count="{num}">{num}</span><span>+</span>'
            elif val.endswith("%") and num:
                inner_val = f'<span class="stats__v" data-count="{num}">{num}</span><span>%</span>'
            else:
                inner_val = _esc(val)
        chunk = m.group(1) + inner_label + m.group(3) + inner_val + m.group(5)
        out = out[: m.start()] + chunk + out[m.end() :]
    return out


def extract_proof(body: str) -> list[dict]:
    items = []
    for m in re.finditer(
        r'<li class="proof__i[^"]*">.*?<strong class="proof__n">(.*?)</strong>\s*<span class="proof__l">(.*?)</span>',
        body,
        re.S,
    ):
        items.append({"value": _strip(m.group(1)), "label": _strip(m.group(2))})
    return items


def patch_proof(body: str, items: list | None) -> str:
    if not items:
        return body
    found = list(re.finditer(
        r'(<strong class="proof__n">)(.*?)(</strong>\s*<span class="proof__l">)(.*?)(</span>)',
        body,
        re.S,
    ))
    out = body
    for m, it in reversed(list(zip(found, items))):
        val = it.get("value")
        lab = it.get("label")
        inner_v = m.group(2) if val is None else _format_proof_value(str(val))
        inner_l = m.group(4) if lab is None else _esc(lab)
        chunk = m.group(1) + inner_v + m.group(3) + inner_l + m.group(5)
        out = out[: m.start()] + chunk + out[m.end() :]
    return out


def _format_proof_value(val: str) -> str:
    val = val.strip()
    if val == "∞":
        return "∞"
    if val.endswith("%"):
        num = re.sub(r"[^\d]", "", val)
        return f"{_esc(num)}<span>%</span>" if num else _esc(val)
    if val.endswith("+"):
        num = re.sub(r"[^\d]", "", val)
        return f"{_esc(num)}<span>+</span>" if num else _esc(val)
    return _esc(val)


def _section_before(body: str, pos: int) -> str:
    chunk = body[: max(0, pos)]
    found = list(re.finditer(r"<h2\b[^>]*>(.*?)</h2>", chunk, re.S | re.I))
    if not found:
        return "Góra strony"
    return _strip(found[-1].group(1)) or "Sekcja"


def _caption_near(body: str, pos: int) -> str:
    ahead = body[pos : pos + 900]
    h3 = re.search(r"<h3\b[^>]*>(.*?)</h3>", ahead, re.S | re.I)
    if h3:
        return _strip(h3.group(1))
    back = body[max(0, pos - 700) : pos]
    found = list(re.finditer(r"<h3\b[^>]*>(.*?)</h3>", back, re.S | re.I))
    if found:
        return _strip(found[-1].group(1))
    return ""


def page_role(kind: str, parent_url: str) -> str:
    if kind == "home":
        return "home"
    if kind in ("machines", "studs"):
        return "profile" if parent_url else "group"
    return "page"


ROLE_LABEL = {
    "home": "Strona główna",
    "group": "Grupa maszyn",
    "profile": "Profil maszyny",
    "page": "Strona",
}

ROLE_HINT = {
    "home": "To, co widać zaraz po wejściu na witrynę",
    "group": "Strona całej grupy. Profile tej grupy są niżej na liście.",
    "profile": "Konkretny typ maszyny, który klient otwiera z grupy",
    "page": "Treść tej podstrony",
}


def _enrich_pages(rows: list[dict]) -> list[dict]:
    by_url = {r.get("url"): r for r in rows if r.get("url")}
    for r in rows:
        parent = by_url.get(r.get("parentUrl") or "")
        r["parentName"] = (parent or {}).get("name") or ""
        role = page_role(r.get("kind") or "", r.get("parentUrl") or "")
        if r.get("kind") == "studs" and role == "group":
            r["role"] = role
            r["roleLabel"] = "Grupa oferty"
        elif r.get("kind") == "studs" and role == "profile":
            r["role"] = role
            r["roleLabel"] = "Profil oferty"
        else:
            r["role"] = role
            r["roleLabel"] = ROLE_LABEL.get(role, "Strona")
        r["roleHint"] = ROLE_HINT.get(role, "")
    child_urls = {r.get("parentUrl") for r in rows if r.get("parentUrl")}
    for r in rows:
        kind = r.get("kind") or ""
        url = r.get("url") or ""
        r["hasChildren"] = bool(url) and url in child_urls
        r["canDelete"] = kind in ("machines", "studs") and not r["hasChildren"]
    return rows


def _page_name(meta: dict, kind: str, stem: str = "") -> str:
    if stem and stem in PAGE_NAMES_PL:
        return PAGE_NAMES_PL[stem]
    if kind == "home":
        return "Strona główna"
    crumbs = (meta.get("crumbs") or "").strip()
    if crumbs:
        last = re.split(r"\s*\|\s*", crumbs)[-1].strip()
        if ">>" in last:
            last = last.split(">>", 1)[0].strip()
        if last:
            return last
    title = (meta.get("title") or "").strip()
    title = re.split(r"\s+[—|]\s+", title)[0].strip()
    return re.sub(r"\s*\|\s*SMOLTECH\s*$", "", title).strip() or title


def _parent_url(url: str, crumbs: str) -> str:
    m = re.search(r">>\s*(/[^\s|]+/)", crumbs or "")
    if m:
        return m.group(1).strip()
    parts = [p for p in (url or "").strip("/").split("/") if p]
    if len(parts) >= 2:
        return "/" + parts[0] + "/"
    return ""


def _page_thumb(meta: dict, body: str) -> str:
    """Representative picture of a page: its hero image, else the first real photo, else the OG image."""
    hero = extract_hero(body)
    if hero.get("image"):
        return hero["image"]
    for im in extract_images(body):
        if im.get("kind") in ("hero", "tile", "photo", "area"):
            return im["src"]
    m = re.search(r'<img[^>]*\ssrc="(/assets/img/(?!yt/)[^"?]+)', body)
    if m:
        return m.group(1)
    og = (meta.get("og") or "").strip()
    if og:
        return og if og.startswith("/") else f"/assets/img/{og}"
    return ""


def list_pages() -> list[dict]:
    rows = []
    for f in sorted(PAGES.glob("*.html")):
        try:
            meta, body = parse_front_matter(f.read_text(encoding="utf-8"))
        except Exception:
            continue
        kind = page_kind(f.name, meta.get("nav") or "")
        rows.append({
            "id": f.stem,
            "file": f.name,
            "kind": kind,
            "kindLabel": KIND_LABEL.get(kind, "Strona"),
            "name": _page_name(meta, kind, f.stem),
            "title": meta.get("title") or f.stem,
            "url": meta.get("url") or "",
            "parentUrl": _parent_url(meta.get("url") or "", meta.get("crumbs") or ""),
            "nav": meta.get("nav") or "",
            "og": meta.get("og") or "",
            "image": _page_thumb(meta, body),
            "mach": len(extract_mach(body)),
            "faq": len(extract_faq(body)),
        })
    return _enrich_pages(rows)


def get_page(pid: str) -> dict:
    if not re.fullmatch(r"[A-Za-z0-9_-]+", pid or ""):
        raise ValueError("Nieprawidłowa strona.")
    path = PAGES / f"{pid}.html"
    if not path.is_file():
        raise FileNotFoundError("Nie znaleziono strony.")
    raw = path.read_text(encoding="utf-8")
    meta, body = parse_front_matter(raw)
    kind = page_kind(path.name, meta.get("nav") or "")
    parent_url = _parent_url(meta.get("url") or "", meta.get("crumbs") or "")
    info = next((x for x in list_pages() if x["id"] == pid), None) or {}
    return {
        "id": pid,
        "file": path.name,
        "kind": kind,
        "kindLabel": KIND_LABEL.get(kind, "Strona"),
        "name": _page_name(meta, kind, pid),
        "parentName": info.get("parentName") or "",
        "role": info.get("role") or page_role(kind, parent_url),
        "roleLabel": info.get("roleLabel") or ROLE_LABEL.get(page_role(kind, parent_url), "Strona"),
        "roleHint": info.get("roleHint") or "",
        "meta": meta,
        "hero": extract_hero(body),
        "stats": extract_stats(body),
        "proof": extract_proof(body),
        "areas": extract_areas(body),
        "tiles": extract_tiles(body),
        "models": extract_models(body),
        "films": extract_films(body),
        "catalog": page_catalog(body),
        "images": [{k: v for k, v in im.items() if not str(k).startswith("_")} for im in extract_images(body)],
        "copy": [{k: v for k, v in c.items() if not str(k).startswith("_")} for c in extract_copy(body)],
        "mach": extract_mach(body),
        "faq": extract_faq(body),
        "people": extract_people(body),
        "shared": extract_shared(),
        "html": body.strip("\n") + "\n",
        "canDelete": bool(info.get("canDelete")),
        "hasChildren": bool(info.get("hasChildren")),
    }


def save_page(data: dict) -> dict:
    pid = str(data.get("id") or "")
    if not re.fullmatch(r"[A-Za-z0-9_-]+", pid):
        raise ValueError("Nieprawidłowa strona.")
    path = PAGES / f"{pid}.html"
    if not path.is_file():
        raise FileNotFoundError("Nie znaleziono strony.")
    raw = path.read_text(encoding="utf-8")
    meta, body = parse_front_matter(raw)
    incoming = data.get("meta") or {}
    if isinstance(incoming, dict):
        for k in ("title", "desc", "ogtitle", "og", "crumbs", "prio", "pl", "nav", "url", "out", "noindex"):
            if k in incoming:
                meta[k] = str(incoming[k] or "").strip()
    if data.get("html"):
        body = str(data["html"])
    body = patch_hero(body, data.get("hero") if isinstance(data.get("hero"), dict) else None)
    if "images" in data:
        body = patch_images(body, data.get("images") if isinstance(data.get("images"), list) else None)
    if "copy" in data:
        body = patch_copy(body, data.get("copy") if isinstance(data.get("copy"), list) else None)
    if "tiles" in data:
        body = patch_tiles(body, data.get("tiles") if isinstance(data.get("tiles"), list) else None)
    if "models" in data:
        body = patch_models(body, data.get("models") if isinstance(data.get("models"), dict) else None)
    if "films" in data:
        body = patch_films(body, data.get("films") if isinstance(data.get("films"), list) else None)
    if "stats" in data:
        body = patch_stats(body, data.get("stats") if isinstance(data.get("stats"), list) else None)
    if "proof" in data:
        body = patch_proof(body, data.get("proof") if isinstance(data.get("proof"), list) else None)
    if "mach" in data:
        body = patch_mach(body, data.get("mach") if isinstance(data.get("mach"), list) else None)
    if "faq" in data:
        body = patch_faq(body, data.get("faq") if isinstance(data.get("faq"), list) else None)
    if "people" in data:
        body = patch_people(body, data.get("people") if isinstance(data.get("people"), list) else None)
    if "areas" in data:
        body = patch_areas(body, data.get("areas") if isinstance(data.get("areas"), list) else None)
    body = seo_tune_body(body)
    path.write_text(dump_front_matter(meta, body), encoding="utf-8")
    shared_res = {"changed": []}
    if isinstance(data.get("shared"), dict):
        shared_res = patch_shared(data["shared"])
    page = get_page(pid)
    i18n = {"translated": 0}
    try:
        import tlumacz
        pairs = data.get("i18nPairs") if isinstance(data.get("i18nPairs"), list) else []
        authored = tlumacz.author_pairs(pairs) if pairs else 0
        texts = tlumacz.collect_from_page(page)
        if shared_res.get("changed"):
            for lst in (page.get("shared") or {}).values():
                tlumacz.collect_values(lst, texts)
        i18n = tlumacz.safe_sync(texts)
        if authored:
            i18n["translated"] = (i18n.get("translated") or 0) + authored
            i18n["authored"] = authored
    except Exception:
        pass
    mark_pending(f"page.save:{pid}")
    return {"ok": True, "page": page, "i18n": i18n, **pending_payload()}


def parse_youtube_id(value: str) -> str:
    s = (value or "").strip()
    if re.fullmatch(r"[\w-]{11}", s):
        return s
    m = re.search(r"(?:v=|/embed/|/shorts/|youtu\.be/)([\w-]{11})", s)
    return m.group(1) if m else ""


def fetch_yt_thumb(vid: str) -> bool:
    vid = parse_youtube_id(vid)
    if not vid:
        return False
    YT_DIR.mkdir(parents=True, exist_ok=True)
    dest = YT_DIR / f"{vid}.jpg"
    if dest.is_file() and dest.stat().st_size > 1000:
        return True
    url = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            blob = resp.read()
        if blob:
            dest.write_bytes(blob)
            return True
    except Exception:
        return False
    return dest.is_file()


def list_videos() -> dict:
    cats: list[dict] = []
    current = None
    if not FILMY.is_file():
        return {"categories": []}
    for line in FILMY.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        parts = line.split("\t")
        if parts[0] == "CAT" and len(parts) >= 4:
            current = {"key": parts[1], "label": parts[2], "desc": parts[3], "videos": []}
            cats.append(current)
        elif parts[0] == "VID" and len(parts) >= 4 and current is not None:
            current["videos"].append({
                "cat": parts[1],
                "id": parts[2],
                "title": parts[3],
                "added": parts[4].strip() if len(parts) >= 5 else "",
            })
    return {"categories": cats}


def _seed_added(vid: str, fallback_index: int) -> str:
    if vid in HOME_SEED:
        n = HOME_SEED.index(vid)
        return (datetime(2026, 9, 9, 18, 0, 0) - timedelta(minutes=n)).strftime("%Y-%m-%dT%H:%M:%S")
    return (datetime(2020, 1, 1) + timedelta(minutes=fallback_index)).strftime("%Y-%m-%dT%H:%M:%S")


def flatten_videos(cats: list[dict]) -> list[dict]:
    out = []
    i = 0
    for cat in cats:
        for v in cat.get("videos") or []:
            vid = parse_youtube_id(str(v.get("id") or ""))
            if not vid:
                continue
            added = str(v.get("added") or "").strip() or _seed_added(vid, i)
            out.append({
                "id": vid,
                "title": str(v.get("title") or "").strip(),
                "cat": str(cat.get("key") or v.get("cat") or ""),
                "catLabel": str(cat.get("label") or ""),
                "added": added,
            })
            i += 1
    out.sort(key=lambda x: x["added"], reverse=True)
    uniq: list[dict] = []
    seen: set[str] = set()
    for item in out:
        if item["id"] in seen:
            continue
        seen.add(item["id"])
        uniq.append(item)
    return uniq


def _yt_play() -> str:
    path = PARTIALS / "yt-play.html"
    if path.is_file():
        return path.read_text(encoding="utf-8").strip()
    return ""


def render_vcard(v: dict, i: int, home: bool = False) -> str:
    delays = ["", " rv-d1", " rv-d2", " rv-d3"]
    delay = delays[i % (4 if home else 3)]
    play = _yt_play()
    thumb = f"/assets/img/yt/{_esc(v['id'])}.jpg"
    title = _esc(v.get("title") or "")
    kind = _esc(v.get("catLabel") or "")
    cat_attr = f' data-cat="{_esc(v.get("cat") or "")}"' if not home else ""
    rv = " rv" if i < 3 or home else ""
    return f'''      <article class="vcard{rv}{delay}"{cat_attr}>
        <button class="yt" type="button" data-vid="{_esc(v["id"])}" data-title="{title}" aria-label="Відтворити відео: {title}">
          <img src="{thumb}" alt="{title}" width="480" height="360" loading="lazy" decoding="async">
          {play}
        </button>
        <div class="vcard__body">
          <span class="vcard__kind">{kind}</span>
          <h3>{title}</h3>
        </div>
      </article>'''


def render_video_grid(cats: list[dict]) -> str:
    chips = [
        '<button class="chip" type="button" role="tab" data-filter="all" aria-selected="true">Усі відео</button>'
    ]
    by_id: dict[str, dict] = {}
    order: list[str] = []
    labels_by_key: dict[str, str] = {}
    for cat in cats:
        key = cat.get("key") or ""
        label = cat.get("label") or key
        labels_by_key[str(key)] = str(label)
        chips.append(
            f'<button class="chip" type="button" role="tab" data-filter="{_esc(key)}" aria-selected="false">{_esc(label)}</button>'
        )
        for v in cat.get("videos") or []:
            vid = parse_youtube_id(str(v.get("id") or ""))
            if not vid:
                continue
            slot = by_id.get(vid)
            if not slot:
                slot = {"id": vid, "title": str(v.get("title") or ""), "cats": []}
                by_id[vid] = slot
                order.append(vid)
            if key and key not in slot["cats"]:
                slot["cats"].append(key)
            if v.get("title"):
                slot["title"] = str(v.get("title") or slot["title"])
    cards = []
    for i, vid in enumerate(order):
        slot = by_id[vid]
        labels = [labels_by_key.get(k, k) for k in slot["cats"]]
        cards.append(render_vcard({
            "id": vid,
            "title": slot["title"],
            "cat": " ".join(slot["cats"]),
            "catLabel": " · ".join(labels),
        }, i, home=False))
    return (
        '    <div class="chips rv rv-d1" role="tablist" aria-label="Категорії відео">\n      '
        + "\n      ".join(chips)
        + "\n    </div>\n    <p id=\"filter-status\" class=\"vh\" role=\"status\" aria-live=\"polite\"></p>\n\n"
        + '    <div class="grid g-3">\n'
        + "\n".join(cards)
        + "\n    </div>"
    )


def render_video_ld(cats: list[dict]) -> str:
    items = []
    n = 0
    seen: set[str] = set()
    for cat in cats:
        for v in cat.get("videos") or []:
            vid = parse_youtube_id(str(v.get("id") or ""))
            title = str(v.get("title") or "").strip()
            if not vid or not title or vid in seen:
                continue
            seen.add(vid)
            n += 1
            items.append(
                '{"@type":"ListItem","position":'
                + str(n)
                + ',"item":{"@type":"VideoObject","name":"'
                + _esc(title)
                + '","description":"'
                + _esc(title)
                + ' — реалізація SMOLTECH Technika Zgrzewalnicza.","thumbnailUrl":"https://smoltech.com.ua/assets/img/yt/'
                + _esc(vid)
                + '.jpg","embedUrl":"https://www.youtube-nocookie.com/embed/'
                + _esc(vid)
                + '","contentUrl":"https://www.youtube.com/watch?v='
                + _esc(vid)
                + '","publisher":{"@id":"https://smoltech.com.ua/#org"}}}'
            )
    return (
        '<script type="application/ld+json">{"@context":"https://schema.org","@type":"ItemList",'
        '"name":"Відео — автоматизація зварювання SMOLTECH","numberOfItems":'
        + str(n)
        + ',"itemListElement":['
        + ",".join(items)
        + "]}</script>"
    )


def _matching_div_end(html: str, open_pos: int) -> int:
    gt = html.find(">", open_pos)
    if gt == -1:
        return -1
    depth = 1
    pos = gt + 1
    for m in re.finditer(r"</?div\b[^>]*>", html[pos:], re.I):
        token = m.group(0).lower()
        if token.startswith("</"):
            depth -= 1
            if depth == 0:
                return pos + m.end()
        elif token.endswith("/>"):
            continue
        else:
            depth += 1
    return -1


def sync_home_watch(cats: list[dict]) -> None:
    if not HOME_PAGE.is_file():
        return
    raw = HOME_PAGE.read_text(encoding="utf-8")
    meta, body = parse_front_matter(raw)
    newest = flatten_videos(cats)[:4]
    if len(newest) < 1:
        return
    m = re.search(r'<div class="vgrid vgrid--home">', body)
    if not m:
        return
    end = _matching_div_end(body, m.start())
    if end < 0:
        return
    cards = "\n\n".join(render_vcard(v, i, home=True) for i, v in enumerate(newest))
    nxt = body[: m.start()] + '<div class="vgrid vgrid--home">\n' + cards + "\n    </div>" + body[end:]
    HOME_PAGE.write_text(dump_front_matter(meta, nxt), encoding="utf-8")


def sync_video_page(cats: list[dict]) -> None:
    if not VIDEO_PAGE.is_file():
        return
    raw = VIDEO_PAGE.read_text(encoding="utf-8")
    meta, body = parse_front_matter(raw)
    chips = re.search(r'<div class="chips\b', body)
    grid = re.search(r'<div class="grid g-3">', body)
    if chips and grid:
        end = _matching_div_end(body, grid.start())
        if end > 0:
            body = body[: chips.start()] + render_video_grid(cats) + body[end:]
    ld = render_video_ld(cats)
    body2, n2 = re.subn(
        r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"ItemList".*?</script>',
        ld,
        body,
        count=1,
        flags=re.S,
    )
    if n2:
        body = body2
    VIDEO_PAGE.write_text(dump_front_matter(meta, body), encoding="utf-8")


def save_videos(data: dict) -> dict:
    prev = list_videos()
    prev_added = {}
    i = 0
    for cat in prev.get("categories") or []:
        for v in cat.get("videos") or []:
            vid = parse_youtube_id(str(v.get("id") or ""))
            if not vid:
                continue
            prev_added[vid] = str(v.get("added") or "").strip() or _seed_added(vid, i)
            i += 1
    cats_in = data.get("categories") if isinstance(data.get("categories"), list) else []
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    lines = []
    cats = []
    for cat in cats_in:
        key = re.sub(r"[^a-z0-9_-]", "", str(cat.get("key") or ""))
        if not key:
            continue
        label = str(cat.get("label") or "").strip()
        desc = str(cat.get("desc") or "").strip()
        lines.append(f"CAT\t{key}\t{label}\t{desc}")
        videos = []
        seen_cat: set[str] = set()
        for v in cat.get("videos") or []:
            vid = parse_youtube_id(str(v.get("id") or ""))
            title = str(v.get("title") or "").strip()
            if not vid or not title or vid in seen_cat:
                continue
            seen_cat.add(vid)
            added = str(v.get("added") or "").strip() or prev_added.get(vid) or now
            fetch_yt_thumb(vid)
            lines.append(f"VID\t{key}\t{vid}\t{title}\t{added}")
            videos.append({"cat": key, "id": vid, "title": title, "added": added})
        cats.append({"key": key, "label": label, "desc": desc, "videos": videos})
    FILMY.write_text("\n".join(lines) + "\n", encoding="utf-8")
    sync_video_page(cats)
    sync_home_watch(cats)
    videos = list_videos()
    i18n = {"translated": 0}
    try:
        import tlumacz
        pairs = data.get("i18nPairs") if isinstance(data.get("i18nPairs"), list) else []
        authored = tlumacz.author_pairs(pairs) if pairs else 0
        i18n = tlumacz.safe_sync(tlumacz.collect_from_videos(videos))
        if authored:
            i18n["translated"] = (i18n.get("translated") or 0) + authored
            i18n["authored"] = authored
    except Exception:
        pass
    mark_pending("videos.save")
    return {"ok": True, "videos": videos, "i18n": i18n, **pending_payload()}


def load_settings() -> dict:
    if SETTINGS.is_file():
        try:
            data = json.loads(SETTINGS.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                out = dict(DEFAULT_SETTINGS)
                out.update({k: str(v) for k, v in data.items() if k in DEFAULT_SETTINGS})
                return out
        except Exception:
            pass
    return dict(DEFAULT_SETTINGS)


def _replace_in_files(old: str, new: str, files: list[Path]) -> None:
    if not old or old == new:
        return
    for path in files:
        if not path.is_file():
            continue
        txt = path.read_text(encoding="utf-8")
        if old in txt:
            path.write_text(txt.replace(old, new), encoding="utf-8")


def save_settings(data: dict, i18n_pairs: list | None = None) -> dict:
    old = load_settings()
    new = dict(old)
    for k in DEFAULT_SETTINGS:
        if k in data and data[k] is not None:
            new[k] = str(data[k]).strip()
    new["phoneTel"] = re.sub(r"[^\d+]", "", new.get("phoneTel") or new.get("phone") or "")
    SETTINGS.parent.mkdir(parents=True, exist_ok=True)
    SETTINGS.write_text(json.dumps(new, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    targets = [LAYOUT]
    targets += list(PAGES.glob("*.html"))
    pairs = [
        (old["phone"], new["phone"]),
        (old["phoneTel"], new["phoneTel"]),
        (old["email"], new["email"]),
        (old["youtube"], new["youtube"]),
        (old["instagram"], new["instagram"]),
        (old["footer"], new["footer"]),
        (old["addressShort"], new["addressShort"]),
        (old["addressLine"], new["addressLine"]),
        (old["company"], new["company"]),
    ]
    for a, b in pairs:
        _replace_in_files(a, b, targets)
    i18n = {"translated": 0}
    try:
        import tlumacz
        authored = tlumacz.author_pairs(i18n_pairs) if i18n_pairs else 0
        i18n = tlumacz.safe_sync(tlumacz.collect_from_settings(new))
        if authored:
            i18n["translated"] = (i18n.get("translated") or 0) + authored
            i18n["authored"] = authored
    except Exception:
        pass
    mark_pending("settings.save")
    return {"ok": True, "settings": new, "i18n": i18n, **pending_payload()}


def list_media() -> list[dict]:
    MEDIA.mkdir(parents=True, exist_ok=True)
    rows = []
    for p in sorted(MEDIA.glob("*")):
        if p.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}:
            continue
        rows.append({
            "name": p.name,
            "url": f"/assets/img/cms/{p.name}",
            "size": p.stat().st_size,
        })
    for p in sorted((ROOT / "assets" / "img").glob("og-*.jpg")):
        rows.append({"name": p.name, "url": f"/assets/img/{p.name}", "size": p.stat().st_size})
    return rows[:200]


def save_media(name: str, b64: str) -> dict:
    MEDIA.mkdir(parents=True, exist_ok=True)
    raw_name = Path(name or "upload").name
    ext = Path(raw_name).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise ValueError("Dozwolone: JPG, PNG, WebP, GIF.")
    blob = base64.b64decode(re.sub(r"^data:[^;]+;base64,", "", b64 or ""))
    if not blob or len(blob) > 8 * 1024 * 1024:
        raise ValueError("Plik pusty albo większy niż 8 MB.")
    fname = secrets.token_hex(8) + ext
    dest = MEDIA / fname
    dest.write_bytes(blob)
    return {"ok": True, "url": f"/assets/img/cms/{fname}", "name": fname}


def _partials() -> dict[str, str]:
    out = {}
    if PARTIALS.is_dir():
        for f in PARTIALS.glob("*.html"):
            token = "{{" + re.sub(r"[^A-Z0-9]", "_", f.stem.upper()) + "}}"
            out[token] = f.read_text(encoding="utf-8").strip()
    return out


def _ld_script(obj: dict) -> str:
    payload = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    return f'<script type="application/ld+json">{payload.replace("<", "\\u003c")}</script>'


FAQ_LD_RE = re.compile(
    r'\s*<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"FAQPage".*?</script>',
    re.S,
)


def _plain_h1(body: str) -> str:
    m = re.search(r"<h1[^>]*>(.*?)</h1>", body, re.S)
    return _strip(m.group(1) if m else "")


def _child_itemlist_ld(body: str) -> str:
    rows: list[tuple[str, str]] = []
    seen: set[str] = set()
    for m in re.finditer(
        r'<a class="(?:tile|choice__card)[^"]*"[^>]*href="([^"]+)"[\s\S]*?<h3>(.*?)</h3>',
        body,
    ):
        href, name = m.group(1).strip(), _strip(m.group(2))
        if not href or href.startswith("#") or href.startswith("mailto:") or not name:
            continue
        loc = href if href.startswith("http") else SITE + (href if href.startswith("/") else "/" + href)
        if loc in seen:
            continue
        seen.add(loc)
        rows.append((loc, name))
    if len(rows) < 2:
        return ""
    return _ld_script({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
            {"@type": "ListItem", "position": i, "url": loc, "name": name}
            for i, (loc, name) in enumerate(rows, 1)
        ],
    })


def _webpage_ld(meta: dict, body: str, modified: str = "") -> str:
    url = SITE + meta["url"]
    h1 = _plain_h1(body)
    collection = bool(re.search(r'class="(?:tile|choice__card)\b', body))
    obj: dict = {
        "@context": "https://schema.org",
        "@type": ["WebPage", "CollectionPage"] if collection else "WebPage",
        "@id": url + "#webpage",
        "url": url,
        "name": meta["title"],
        "description": meta["desc"],
        "inLanguage": "uk-UA",
        "isPartOf": {"@id": f"{SITE}/#website"},
        "about": {"@id": f"{SITE}/#org"},
        "publisher": {"@id": f"{SITE}/#org"},
    }
    if h1:
        obj["headline"] = h1
    if modified:
        obj["dateModified"] = modified
    if meta.get("crumbs"):
        obj["breadcrumb"] = {"@id": url + "#breadcrumb"}
    img = meta.get("og") or "og-default.jpg"
    obj["primaryImageOfPage"] = {
        "@type": "ImageObject",
        "url": f"{SITE}/assets/img/{img}",
    }
    return _ld_script(obj)


def _crumbs(spec: str, url: str) -> tuple[str, str]:
    if not (spec or "").strip():
        return "", ""
    home = "Головна"
    items = [{"name": home, "url": "/"}]
    for part in re.split(r"\s*\|\s*", spec.strip()):
        if ">>" in part:
            n, u = part.split(">>", 1)
            items.append({"name": n.strip(), "url": u.strip()})
        else:
            items.append({"name": part.strip(), "url": None})
    li = []
    ld = []
    for i, it in enumerate(items):
        last = i == len(items) - 1
        target = url if last else it["url"]
        if last:
            li.append(f'<li aria-current="page">{_esc(it["name"])}</li>')
        else:
            li.append(f'<li><a href="{it["url"]}">{_esc(it["name"])}</a></li>')
        ld.append(
            f'{{"@type":"ListItem","position":{i + 1},"name":"{_esc(it["name"])}","item":"{SITE}{target}"}}'
        )
    json_ld = _ld_script({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "@id": SITE + url + "#breadcrumb",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": it["name"], "item": SITE + (url if i == len(items) - 1 else (it["url"] or url))}
            for i, it in enumerate(items)
        ],
    })
    return "", json_ld


def _render_ctx() -> tuple[str, dict, str]:
    layout = LAYOUT.read_text(encoding="utf-8")
    partials = _partials()
    st = load_settings()
    ld = (
        LD_ORG.replace("EMAIL_PH", st["email"])
        .replace("TEL_PH", st["phoneTel"])
        .replace("YT_PH", st["youtube"])
        .replace("IG_PH", st["instagram"])
    )
    return layout, partials, ld


def render_page_html(
    meta: dict, body: str, layout: str, partials: dict, ld: str, name: str = "", modified: str = ""
) -> str:
    for req in ("out", "url", "title", "desc"):
        if req not in meta:
            raise ValueError(f"{name}: brak pola '{req}'.")
    crumbs = _crumbs(meta.get("crumbs") or "", meta["url"])
    alt = f'<link rel="alternate" hreflang="uk" href="{SITE}{meta["url"]}">'
    if meta.get("pl"):
        alt += f'\n<link rel="alternate" hreflang="pl" href="{meta["pl"]}">'
    alt += f'\n<link rel="alternate" hreflang="x-default" href="{SITE}{meta["url"]}">'
    content = body.strip()
    for tok, val in partials.items():
        content = content.replace(tok, val)
    content = seo_tune_body(content)
    content = FAQ_LD_RE.sub("", content)
    head = meta.get("head") or ""
    if meta.get("noindex") == "true":
        robots = "noindex, follow"
    else:
        robots = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    if 'rel="canonical"' in head:
        canon = ""
    else:
        canon = f'<link rel="canonical" href="{SITE}{meta["url"]}">'
    html_out = layout
    html_out = html_out.replace("{{TITLE}}", _esc(meta["title"]))
    html_out = html_out.replace("{{DESC}}", _esc(meta["desc"]))
    html_out = html_out.replace("{{URL}}", meta["url"])
    html_out = html_out.replace("{{ALT}}", alt)
    html_out = html_out.replace("{{ROBOTS}}", robots)
    html_out = html_out.replace("{{CANON}}", canon)
    html_out = html_out.replace(
        "{{OG_LOCALE_ALT}}",
        '<meta property="og:locale:alternate" content="pl_PL">\n' if meta.get("pl") else "",
    )
    html_out = html_out.replace("{{OG}}", meta.get("og") or "og-default.jpg")
    html_out = html_out.replace("{{OGTYPE}}", meta.get("ogtype") or "website")
    html_out = html_out.replace("{{OGTITLE}}", _esc(meta.get("ogtitle") or meta["title"]))
    html_out = html_out.replace("{{HEAD}}", head)
    html_out = html_out.replace("{{LD_ORG}}", ld)
    extra_ld = crumbs[1] + _webpage_ld(meta, content, modified) + _child_itemlist_ld(content)
    extra_ld += render_faq_ld(extract_faq(content))
    html_out = html_out.replace("{{LD_CRUMBS}}", extra_ld)
    html_out = html_out.replace("{{CRUMBS}}", "")
    html_out = html_out.replace("{{CONTENT}}", content)
    active = meta.get("nav") or ""
    html_out = html_out.replace("{{BODY_CLASS}}", f"page-{active}" if active else "page")
    for k in NAV_KEYS:
        html_out = html_out.replace("{{NAV_" + k + "}}", " is-active" if k == active else "")
    left = re.findall(r"\{\{[A-Z_]+\}\}", html_out)
    if left:
        raise ValueError(f"{name}: niepodmienione {', '.join(left)}")
    return html_out


FORM_PARTIAL = PARTIALS / "formularz.html"
FOOTER_RE = re.compile(r'(<footer class="ftr">)(.*?)(</footer>)', re.S)
SHARED_LABEL = {"form": "Formularz zapytania", "ftr": "Stopka — informacje o firmie"}


def _shared_source(which: str) -> tuple[str, str]:
    """(full file text, editable fragment) for the shared block."""
    if which == "form":
        txt = FORM_PARTIAL.read_text(encoding="utf-8") if FORM_PARTIAL.is_file() else ""
        return txt, txt
    if which == "ftr":
        layout = LAYOUT.read_text(encoding="utf-8")
        m = FOOTER_RE.search(layout)
        return layout, (m.group(2) if m else "")
    raise ValueError("Nieznany blok wspólny.")


def extract_shared() -> dict:
    out = {}
    for which in ("form", "ftr"):
        try:
            _, frag = _shared_source(which)
        except Exception:
            frag = ""
        out[which] = [
            {k: v for k, v in c.items() if not str(k).startswith("_")}
            for c in extract_copy(frag, loose=True)
        ]
    return out


def mark_shared(frag: str, which: str) -> str:
    ins = []
    for c in extract_copy(frag, loose=True):
        ins.append((c["_s"] - 1, f' data-cms-shared="{which}:{c["i"]}"'))
    out = frag
    for pos, text in sorted(ins, key=lambda x: x[0], reverse=True):
        out = out[:pos] + text + out[pos:]
    return out


def patch_shared(data: dict) -> dict:
    """Write edited form / footer texts back to the partial and the layout."""
    changed = []
    if not isinstance(data, dict):
        return {"changed": changed}
    if isinstance(data.get("form"), list) and data["form"] and FORM_PARTIAL.is_file():
        txt, _ = _shared_source("form")
        new = patch_copy(txt, data["form"], loose=True)
        if new != txt:
            FORM_PARTIAL.write_text(new, encoding="utf-8")
            changed.append("form")
    if isinstance(data.get("ftr"), list) and data["ftr"]:
        layout, frag = _shared_source("ftr")
        if frag:
            new_frag = patch_copy(frag, data["ftr"], loose=True)
            if new_frag != frag:
                m = FOOTER_RE.search(layout)
                layout = layout[: m.start(2)] + new_frag + layout[m.end(2):]
                LAYOUT.write_text(layout, encoding="utf-8")
                changed.append("ftr")
                # keep settings.footer in step with the brand paragraph so later settings saves replace the right text
                bm = re.search(r'<div class="ftr__brand">.*?<p>(.*?)</p>', new_frag, re.S)
                if bm:
                    st = load_settings()
                    txt = _strip(bm.group(1))
                    if txt and txt != st.get("footer"):
                        st["footer"] = txt
                        SETTINGS.parent.mkdir(parents=True, exist_ok=True)
                        SETTINGS.write_text(json.dumps(st, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"changed": changed}


def mark_body(body: str) -> str:
    """Inject data-cms-* markers so the visual editor can map DOM nodes to CMS items."""
    ins: list[tuple[int, str]] = []
    for c in extract_copy(body):
        ins.append((c["_s"] - 1, f' data-cms-copy="{c["i"]}"'))
    for im in extract_images(body):
        ins.append((im["_pos"] + len("<img"), f' data-cms-img="{im["i"]}"'))
    for i, m in enumerate(re.finditer(r'<article class="mach\b[^"]*"', body)):
        ins.append((m.start() + len("<article"), f' data-cms-mach="{i}"'))
    for i, m in enumerate(re.finditer(r'<a class="tile\b', body)):
        ins.append((m.start() + len("<a"), f' data-cms-tile="{i}"'))
    for i, m in enumerate(re.finditer(r'<article class="film-rail__i\b', body)):
        ins.append((m.start() + len("<article"), f' data-cms-film="{i}"'))
    for i, m in enumerate(
        re.finditer(r"<details>\s*<summary>(.*?)</summary>\s*<div class=\"faq__a\">(.*?)</div>\s*</details>", body, re.S)
    ):
        ins.append((m.start() + len("<details"), f' data-cms-faq="{i}"'))
    for i, m in enumerate(re.finditer(r'<article class="pcard pcard--contact[^"]*"', body)):
        ins.append((m.start() + len("<article"), f' data-cms-person="{i}"'))
    out = body
    for pos, text in sorted(ins, key=lambda x: x[0], reverse=True):
        out = out[:pos] + text + out[pos:]
    return out


def preview_page(pid: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9_-]+", pid or ""):
        raise ValueError("Nieprawidłowa strona.")
    path = PAGES / f"{pid}.html"
    if not path.is_file():
        raise FileNotFoundError("Nie znaleziono strony.")
    meta, body = parse_front_matter(path.read_text(encoding="utf-8"))
    layout, partials, ld = _render_ctx()
    # Shared blocks (inquiry form, dark footer) are editable too — marked with their own index space.
    if "{{FORMULARZ}}" in partials:
        partials = dict(partials)
        partials["{{FORMULARZ}}"] = mark_shared(partials["{{FORMULARZ}}"], "form")
    fm = FOOTER_RE.search(layout)
    if fm:
        layout = layout[: fm.start(2)] + mark_shared(fm.group(2), "ftr") + layout[fm.end(2):]
    html_out = render_page_html(meta, mark_body(body), layout, partials, ld, path.name)
    html_out = re.sub(r'<script\b[^>]*\bsrc="[^"]*"[^>]*>\s*</script>\s*', "", html_out)
    # No background video downloads in the editor: poster only.
    html_out = re.sub(
        r"<video\b([^>]*)>",
        lambda m: "<video" + re.sub(r'\s+(?:autoplay|preload="[^"]*")', "", m.group(1)) + ' preload="none">',
        html_out,
    )
    html_out = html_out.replace("<html", '<html data-st-i18n="off" data-cms-edit="1"', 1)
    return html_out


def _empty_pending() -> dict:
    return {"pending": False, "since": "", "notes": [], "removedOuts": []}


def load_pending() -> dict:
    state = _empty_pending()
    if not PENDING.is_file():
        return state
    try:
        data = json.loads(PENDING.read_text(encoding="utf-8"))
    except Exception:
        return state
    if not isinstance(data, dict):
        return state
    state["pending"] = bool(data.get("pending"))
    state["since"] = str(data.get("since") or "")
    notes = data.get("notes")
    state["notes"] = [str(x) for x in notes] if isinstance(notes, list) else []
    outs = data.get("removedOuts")
    state["removedOuts"] = [str(x) for x in outs] if isinstance(outs, list) else []
    return state


def pending_payload() -> dict:
    st = load_pending()
    return {"pending": bool(st.get("pending")), "since": st.get("since") or ""}


def _write_pending(st: dict) -> None:
    PENDING.parent.mkdir(parents=True, exist_ok=True)
    PENDING.write_text(json.dumps(st, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def mark_pending(note: str = "", removed_out: str | None = None) -> dict:
    st = load_pending()
    if not st.get("pending"):
        st["pending"] = True
        st["since"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if note:
        notes = st.setdefault("notes", [])
        notes.append(str(note))
        st["notes"] = notes[-40:]
    if removed_out:
        rel = str(removed_out).replace("\\", "/").lstrip("/")
        outs = st.setdefault("removedOuts", [])
        if rel and rel not in outs:
            outs.append(rel)
    _write_pending(st)
    return st


def _clear_pending() -> None:
    _write_pending(_empty_pending())


def _safe_public_out(rel: str) -> Path | None:
    rel = str(rel or "").replace("\\", "/").lstrip("/")
    if not rel or rel in {"index.html", "sitemap.xml", "robots.txt"}:
        return None
    parts = [p for p in rel.split("/") if p]
    if not parts or any(p in (".", "..") for p in parts):
        return None
    if parts[0] in {"assets", "_src", "_private", "_build", "panel", "_backup"}:
        return None
    path = (ROOT / rel).resolve()
    try:
        path.relative_to(ROOT.resolve())
    except ValueError:
        return None
    return path


def _remove_published_out(rel: str) -> bool:
    path = _safe_public_out(rel)
    if not path or not path.is_file():
        return False
    path.unlink()
    parent = path.parent
    root = ROOT.resolve()
    while parent != root and parent.is_dir():
        try:
            next(parent.iterdir())
            break
        except StopIteration:
            parent.rmdir()
            parent = parent.parent
    return True


def publish() -> dict:
    st = load_pending()
    removed = list(st.get("removedOuts") or [])
    built = rebuild_site()
    gone = [rel for rel in removed if _remove_published_out(rel)]
    _clear_pending()
    return {"ok": True, "built": built, "removed": gone, **pending_payload()}


def rebuild_site() -> dict:
    layout, partials, ld = _render_ctx()
    built = 0
    sitemap = []
    for f in sorted(PAGES.glob("*.html")):
        meta, body = parse_front_matter(f.read_text(encoding="utf-8"))
        html_out = render_page_html(
            meta,
            body,
            layout,
            partials,
            ld,
            f.name,
            datetime.fromtimestamp(f.stat().st_mtime, timezone.utc).strftime("%Y-%m-%d"),
        )
        out_path = ROOT / meta["out"]
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(html_out, encoding="utf-8")
        built += 1
        if meta.get("noindex") != "true":
            loc = SITE + meta["url"]
            lastmod = datetime.fromtimestamp(f.stat().st_mtime, timezone.utc).strftime("%Y-%m-%d")
            prio = meta.get("prio") or "0.7"
            row = [
                "  <url>",
                f"    <loc>{loc}</loc>",
                f"    <lastmod>{lastmod}</lastmod>",
                "    <changefreq>monthly</changefreq>",
                f"    <priority>{prio}</priority>",
                f'    <xhtml:link rel="alternate" hreflang="uk" href="{loc}"/>',
            ]
            if meta.get("pl"):
                row.append(f'    <xhtml:link rel="alternate" hreflang="pl" href="{_esc(meta["pl"])}"/>')
            row.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{loc}"/>')
            row.append("  </url>")
            sitemap.append("\n".join(row))
    sm = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]
    sm += sitemap
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n", encoding="utf-8")
    _write_gone_redirects()
    return {"pages": built, "sitemap": len(sitemap)}


def _write_gone_redirects() -> None:
    """Old URLs that must not keep a landing page after a rebuild."""
    dest = "/#spot-machines"
    html_out = (
        "<!DOCTYPE html>\n"
        '<html lang="uk-UA">\n<head>\n'
        '<meta charset="utf-8">\n'
        "<title>SMOLTECH</title>\n"
        f'<meta http-equiv="refresh" content="0;url={dest}">\n'
        f'<link rel="canonical" href="{SITE}/">\n'
        '<meta name="robots" content="noindex, follow">\n'
        f"<script>location.replace({dest!r});</script>\n"
        "</head>\n<body></body>\n</html>\n"
    )
    path = ROOT / "tochkovi-ta-relyefni-mashyny" / "index.html"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html_out, encoding="utf-8")


def overview() -> dict:
    pages = list_pages()
    vids = list_videos()
    nvid = sum(len(c.get("videos") or []) for c in vids.get("categories") or [])
    return {
        "pages": len(pages),
        "machines": sum(1 for p in pages if p["kind"] in ("machines", "studs")),
        "machItems": sum(p["mach"] for p in pages),
        "videos": nvid,
        "settings": load_settings(),
        **pending_payload(),
    }


def handle(action: str, data: dict) -> dict:
    try:
        if action == "cms.overview":
            return {"ok": True, **overview()}
        if action == "cms.pages":
            return {"ok": True, "pages": list_pages(), **pending_payload()}
        if action == "cms.page.get":
            return {"ok": True, "page": get_page(str(data.get("id") or ""))}
        if action == "cms.page.save":
            return save_page(data)
        if action == "cms.page.add-child":
            return add_child_page(data)
        if action == "cms.page.delete":
            return delete_page(str(data.get("id") or ""))
        if action == "cms.page.preview":
            return {"ok": True, "html": preview_page(str(data.get("id") or ""))}
        if action == "cms.translate":
            sl = str(data.get("sl") or "en")
            tl = str(data.get("tl") or "uk")
            if sl not in ("uk", "en", "pl") or tl not in ("uk", "en", "pl"):
                return {"ok": False, "error": "Nieprawidłowy język."}
            texts = data.get("texts") if isinstance(data.get("texts"), list) else []
            import tlumacz
            mapped = tlumacz.translate_many([str(x) for x in texts], sl, tl)
            return {"ok": True, "map": mapped}
        if action == "cms.videos.get":
            return {"ok": True, **list_videos()}
        if action == "cms.videos.save":
            return save_videos(data)
        if action == "cms.settings.get":
            return {"ok": True, "settings": load_settings()}
        if action == "cms.settings.save":
            return save_settings(data.get("settings") or data, data.get("i18nPairs") if isinstance(data.get("i18nPairs"), list) else [])
        if action == "cms.media.list":
            return {"ok": True, "media": list_media()}
        if action == "cms.media.upload":
            return save_media(str(data.get("name") or ""), str(data.get("data") or ""))
        if action == "cms.publish":
            return publish()
        return {"ok": False, "error": "Nieznane żądanie CMS."}
    except FileNotFoundError as e:
        return {"ok": False, "error": str(e)}
    except ValueError as e:
        return {"ok": False, "error": str(e)}
    except Exception as e:
        return {"ok": False, "error": "Błąd CMS: " + str(e)}
