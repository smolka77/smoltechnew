"""Local static + panel + form server for SMOLTECH UA (Python stdlib)."""
from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import json
import os
import posixpath
import re
import secrets
import struct
import sys
import time
from datetime import datetime, timezone
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import importlib
import cms as cms_engine

_CMS_MTIME = 0.0
_CMS_AUX: dict[str, float] = {}


def _cms():
    """Reload cms + translation stack when files on disk change."""
    global cms_engine, _CMS_MTIME
    here = Path(__file__).resolve().parent
    for name, filename in (("sens_tlumaczenia", "sens_tlumaczenia.py"), ("tlumacz", "tlumacz.py")):
        path = here / filename
        try:
            mtime = path.stat().st_mtime
        except OSError:
            continue
        if name in sys.modules and _CMS_AUX.get(name) == mtime:
            continue
        try:
            if name in sys.modules:
                importlib.reload(sys.modules[name])
            else:
                importlib.import_module(name)
            _CMS_AUX[name] = mtime
        except Exception:
            pass
    path = here / "cms.py"
    try:
        mtime = path.stat().st_mtime
    except OSError:
        return cms_engine
    if mtime != _CMS_MTIME:
        cms_engine = importlib.reload(cms_engine)
        _CMS_MTIME = mtime
    return cms_engine

ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT / "_private"
DATA = PRIVATE / "data"
SESSIONS = PRIVATE / "sessions"
INBOX = DATA / "magazyn.php"
INBOX_LEGACY = DATA / "zapytania.json"
RATE = DATA / "limity-logowan.json"
AUTH = PRIVATE / "auth.env"
PANEL_HTML = ROOT / "panel" / "panel.html"
SESSION_IDLE = 28800
BLOCKED_NAMES = {
    "auth.env",
    "magazyn.php",
    "store.php",
    "zapytania.json",
    "inquiries.json",
    "limity-logowan.json",
    "login-rl.json",
    "start.php",
    "bootstrap.php",
    "skrzynka.php",
    "inbox.php",
}

PATH_ALIASES = {
    "/assets/css/site.css": "/assets/css/strona.css",
    "/assets/js/site.js": "/assets/js/strona.js",
    "/assets/js/i18n.js": "/assets/js/tlumaczenia.js",
    "/assets/js/i18n-cms.js": "/assets/js/nakladka-jezyk.js",
    "/panel/i18n.js": "/panel/jezyk.js",
    "/assets/fonts/faces.css": "/assets/fonts/czcionki.css",
    "/panel/app.js": "/panel/panel.js",
    "/panel/app.css": "/panel/panel.css",
}


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if not AUTH.is_file():
        return env
    for line in AUTH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()
    return env


def b32_decode(data: str) -> bytes:
    data = re.sub(r"[^A-Z2-7]", "", data.upper())
    pad = "=" * ((8 - len(data) % 8) % 8)
    return base64.b32decode(data + pad, casefold=True)


def totp_at(secret: str, counter: int) -> str:
    key = b32_decode(secret)
    msg = struct.pack(">Q", counter)
    h = hmac.new(key, msg, hashlib.sha1).digest()
    o = h[19] & 0x0F
    code = struct.unpack(">I", h[o : o + 4])[0] & 0x7FFFFFFF
    return f"{code % 1_000_000:06d}"


def totp_verify(secret: str, code: str) -> bool:
    code = re.sub(r"\s+", "", code or "")
    if not re.fullmatch(r"\d{6}", code) or not secret:
        return False
    t = int(time.time()) // 30
    ok = False
    for i in (-1, 0, 1):
        if hmac.compare_digest(totp_at(secret, t + i), code):
            ok = True
    return ok


def verify_password(password: str, env: dict[str, str]) -> bool:
    try:
        iters = max(100000, min(int(env.get("ADMIN_PASS_ITERS") or 310000), 600000))
        salt = base64.b64decode(env.get("ADMIN_PASS_SALT") or "")
        stored = base64.b64decode(env.get("ADMIN_PASS_HASH") or "")
    except Exception:
        salt, stored, iters = secrets.token_bytes(16), b"", 310000
    if not salt:
        salt = secrets.token_bytes(16)
    calc = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iters, dklen=32)
    if len(stored) != 32:
        hmac.compare_digest(b"\0" * 32, calc)
        return False
    return hmac.compare_digest(stored, calc)


def verify_user(user: str, env: dict[str, str]) -> bool:
    expected = env.get("ADMIN_USER") or ""
    if not expected or not user:
        return False
    if len(expected) != len(user):
        hmac.compare_digest(expected.encode("utf-8"), expected.encode("utf-8"))
        return False
    return hmac.compare_digest(expected, user)


MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".php": "text/html; charset=utf-8",
}


def encode_store(items) -> str:
    raw = json.dumps(items, ensure_ascii=False)
    return (
        "<?php\ndeclare(strict_types=1);\n"
        "if (!defined('ST_BOOT')) { http_response_code(403); exit; }\n"
        "return json_decode(<<<'ST_INBOX_JSON_V1'\n"
        f"{raw}\n"
        "ST_INBOX_JSON_V1, true) ?: [];\n"
    )


def parse_store(text: str):
    text = text.lstrip()
    if text.startswith("<?php"):
        m = re.search(r"<<<'ST_INBOX_JSON_V1'\r?\n(.*)\r?\nST_INBOX_JSON_V1", text, re.S)
        if not m:
            return []
        try:
            data = json.loads(m.group(1))
            return data if isinstance(data, list) else []
        except Exception:
            return []
    try:
        data = json.loads(text)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def load_inbox() -> list:
    if INBOX.is_file() and INBOX.stat().st_size > 0:
        try:
            return parse_store(INBOX.read_text(encoding="utf-8"))
        except Exception:
            return []
    if INBOX_LEGACY.is_file():
        try:
            return parse_store(INBOX_LEGACY.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []


def save_inbox(items) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    tmp = INBOX.with_suffix(".php.tmp")
    tmp.write_text(encode_store(items), encoding="utf-8")
    tmp.replace(INBOX)


def load_json(path: Path, default):
    if not path.is_file():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def inbox_list() -> list[dict]:
    rows = load_inbox()
    out = []
    for row in rows:
        if not isinstance(row, dict) or not row.get("id"):
            continue
        msg = re.sub(r"\s+", " ", str(row.get("message") or ""))
        out.append({
            "id": str(row["id"]),
            "created": str(row.get("created") or ""),
            "name": str(row.get("name") or ""),
            "company": str(row.get("company") or ""),
            "email": str(row.get("email") or ""),
            "phone": str(row.get("phone") or ""),
            "topic": str(row.get("topic") or ""),
            "preview": msg[:140],
            "read": bool(row.get("read")),
        })
    return out


def inbox_append(row: dict) -> bool:
    items = load_inbox()
    items.insert(0, row)
    save_inbox(items[:4000])
    return True


def inbox_find(iid: str) -> dict | None:
    if not re.fullmatch(r"[a-f0-9]{32}", iid or ""):
        return None
    for row in load_inbox():
        if isinstance(row, dict) and row.get("id") == iid:
            return row
    return None


def inbox_patch(iid: str, mut) -> bool:
    items = load_inbox()
    found = False
    for i, row in enumerate(items):
        if isinstance(row, dict) and row.get("id") == iid:
            items[i] = mut(row)
            found = True
            break
    if found:
        save_inbox(items)
    return found


def csrf_ok(sess: dict, token) -> bool:
    have = str(sess.get("csrf") or "")
    got = str(token or "")
    if not have or not got or len(have) != len(got):
        return False
    return hmac.compare_digest(have, got)


def rate_hit(bucket: str, max_n: int, window: int) -> bool:
    all_hits = load_json(RATE, {})
    now = int(time.time())
    hits = [int(t) for t in all_hits.get(bucket, []) if int(t) > now - window]
    blocked = len(hits) >= max_n
    if not blocked:
        hits.append(now)
    all_hits[bucket] = hits
    save_json(RATE, all_hits)
    return blocked


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        mapped = super().translate_path(path)
        resolved = Path(mapped).resolve()
        try:
            resolved.relative_to(ROOT)
        except ValueError:
            return str(ROOT / "404.html")
        if resolved == PRIVATE or PRIVATE in resolved.parents:
            return str(ROOT / "404.html")
        if resolved.name in BLOCKED_NAMES or resolved.suffix == ".env":
            return str(ROOT / "404.html")
        return mapped

    def _blocked_path(self, path: str) -> bool:
        norm = posixpath.normpath(unquote(path))
        parts = [p for p in norm.split("/") if p and p != "."]
        if any(p in ("_private", "_src", "_build") for p in parts):
            return True
        if parts and parts[-1] in BLOCKED_NAMES:
            return True
        return False


    def log_message(self, fmt, *args):
        sys_stdout = __import__("sys").stdout
        sys_stdout.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _sec_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        self.send_header("Cache-Control", "no-store")

    def _send_bytes(self, code: int, body: bytes, ctype: str, extra_headers=None):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        if "/panel" in self.path or self.path.startswith("/_private"):
            self._sec_headers()
        if extra_headers:
            for k, v in extra_headers:
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _json(self, payload: dict, code: int = 200, headers=None):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self._send_bytes(code, raw, "application/json; charset=utf-8", headers)

    def _session_id(self) -> str | None:
        raw = self.headers.get("Cookie", "")
        cookie = SimpleCookie()
        try:
            cookie.load(raw)
        except Exception:
            return None
        morsel = cookie.get("STSESSID")
        return morsel.value if morsel else None

    def _load_session(self) -> tuple[str, dict]:
        SESSIONS.mkdir(parents=True, exist_ok=True)
        sid = self._session_id()
        if sid and re.fullmatch(r"[a-f0-9]{64}", sid):
            path = SESSIONS / sid
            if path.is_file():
                data = load_json(path, {})
                if isinstance(data, dict):
                    return sid, data
        sid = secrets.token_hex(32)
        data = {"csrf": secrets.token_hex(32)}
        save_json(SESSIONS / sid, data)
        return sid, data

    def _save_session(self, sid: str, data: dict) -> None:
        save_json(SESSIONS / sid, data)

    def _cookie(self, sid: str) -> str:
        secure = ""
        return f"STSESSID={sid}; Path=/panel/; HttpOnly; SameSite=Strict; Max-Age=43200{secure}"

    def _bind_key(self) -> str:
        return hashlib.sha256(self.client_address[0].encode()).hexdigest()

    def _origin_ok(self) -> bool:
        host = (self.headers.get("Host") or "").split(":")[0].lower()
        if not host:
            return False
        origin = self.headers.get("Origin") or ""
        if origin:
            return (urlparse(origin).hostname or "").lower() == host
        ref = self.headers.get("Referer") or ""
        if ref:
            return (urlparse(ref).hostname or "").lower() == host
        return False

    def _step(self, sess: dict) -> str:
        bind_ok = sess.get("bind") == self._bind_key()
        if sess.get("auth") is True:
            if not bind_ok:
                sess.clear()
                sess["csrf"] = secrets.token_hex(32)
                return "login"
            seen = int(sess.get("seen") or 0)
            if seen and (time.time() - seen) > SESSION_IDLE:
                sess.clear()
                sess["csrf"] = secrets.token_hex(32)
                return "login"
            sess["seen"] = int(time.time())
            return "app"
        if sess.get("pending") and int(sess.get("pending_exp") or 0) >= time.time():
            if not bind_ok:
                sess.clear()
                sess["csrf"] = secrets.token_hex(32)
                return "login"
            return "totp"
        sess.pop("pending", None)
        sess.pop("pending_exp", None)
        return "login"

    def _read_json_body(self) -> dict:
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n) if n else b""
        ctype = self.headers.get("Content-Type", "")
        if "application/json" in ctype:
            try:
                data = json.loads(raw.decode("utf-8") or "{}")
                return data if isinstance(data, dict) else {}
            except Exception:
                return {}
        if "application/x-www-form-urlencoded" in ctype:
            qs = parse_qs(raw.decode("utf-8", "replace"), keep_blank_values=True)
            return {k: v[0] if v else "" for k, v in qs.items()}
        if "multipart/form-data" in ctype:
            return self._parse_multipart(raw, ctype)
        return {}

    def _parse_multipart(self, raw: bytes, ctype: str) -> dict:
        m = re.search(r"boundary=(.+)", ctype)
        if not m:
            return {}
        boundary = m.group(1).strip().encode()
        out: dict[str, str] = {}
        for part in raw.split(b"--" + boundary):
            if b"\r\n\r\n" not in part:
                continue
            head, body = part.split(b"\r\n\r\n", 1)
            hm = re.search(br'name="([^"]+)"', head)
            if not hm:
                continue
            name = hm.group(1).decode("utf-8", "replace")
            out[name] = body.rstrip(b"\r\n-").decode("utf-8", "replace").strip()
        return out

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path in PATH_ALIASES:
            path = PATH_ALIASES[path]
            self.path = path + (("?" + parsed.query) if parsed.query else "")
        if self._blocked_path(path):
            self._send_bytes(403, b"Forbidden", "text/plain; charset=utf-8")
            return
        if path in ("/panel", "/panel/", "/panel/index.php", "/panel/index.html", "/panel/app.html", "/panel/panel.html"):
            html = PANEL_HTML.read_bytes()
            sid, sess = self._load_session()
            if "csrf" not in sess:
                sess["csrf"] = secrets.token_hex(32)
                self._save_session(sid, sess)
            self._send_bytes(200, html, "text/html; charset=utf-8", [("Set-Cookie", self._cookie(sid))])
            return
        if path in ("/panel/obsluga.php", "/panel/api.php", "/panel/api"):
            self._json({"ok": False, "error": "Method not allowed."}, 405)
            return
        if path in ("/send.php", "/wyslij.php"):
            self._send_bytes(405, b"Method not allowed", "text/plain; charset=utf-8")
            return
        super().do_GET()

    def do_HEAD(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path in PATH_ALIASES:
            path = PATH_ALIASES[path]
            self.path = path + (("?" + parsed.query) if parsed.query else "")
        if self._blocked_path(path):
            self.send_response(403)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            return
        if path in ("/panel/obsluga.php", "/panel/api.php", "/panel/api"):
            self.send_response(405)
            self.end_headers()
            return
        super().do_HEAD()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if self._blocked_path(path):
            self._send_bytes(403, b"Forbidden", "text/plain; charset=utf-8")
            return
        if path in ("/panel/obsluga.php", "/panel/api.php", "/panel/api"):
            if not self._origin_ok():
                self._json({"ok": False, "error": "Nieprawidłowe pochodzenie żądania."}, 403)
                return
            self._handle_api(self._read_json_body())
            return
        if path == "/send.php" or path == "/wyslij.php":
            self._handle_send(self._read_json_body())
            return
        self._send_bytes(405, b"Method not allowed", "text/plain")

    def _handle_send(self, data: dict):
        wants_json = "application/json" in (self.headers.get("Accept") or "")
        if (data.get("website") or "").strip():
            payload = {"ok": True, "error": ""}
        else:
            name = (data.get("name") or "").strip()
            email = (data.get("email") or "").strip()
            message = (data.get("message") or "").strip()
            if len(name) < 2 or "@" not in email or len(message) < 10 or not data.get("consent"):
                payload = {"ok": False, "error": "Перевірте, будь ласка, форму."}
            else:
                inbox_append({
                    "id": secrets.token_hex(16),
                    "created": datetime.now(timezone.utc).astimezone().isoformat(),
                    "name": name[:120],
                    "company": (data.get("company") or "")[:160],
                    "email": email[:160],
                    "phone": (data.get("phone") or "")[:40],
                    "topic": (data.get("topic") or "")[:120],
                    "message": message[:4000],
                    "page": (data.get("page") or "")[:300],
                    "src": (data.get("src") or "")[:80],
                    "read": False,
                })
                payload = {"ok": True, "error": ""}
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        if wants_json:
            self._send_bytes(200 if payload["ok"] else 400, raw, "application/json; charset=utf-8")
        else:
            self._send_bytes(200, raw, "application/json; charset=utf-8")

    def _handle_api(self, data: dict):
        env = load_env()
        sid, sess = self._load_session()
        headers = [("Set-Cookie", self._cookie(sid))]
        action = data.get("action") or "status"
        step = self._step(sess)

        def out(payload: dict, code: int = 200):
            payload.setdefault("csrf", sess.get("csrf"))
            self._save_session(sid, sess)
            self._json(payload, code, headers)

        if not env.get("ADMIN_USER") or not env.get("ADMIN_PASS_HASH") or not env.get("ADMIN_TOTP_SECRET"):
            out({"ok": False, "error": "Panel nie jest skonfigurowany."}, 503)
            return

        ip = self.client_address[0]
        key = hashlib.sha256((ip + "|" + (self.headers.get("User-Agent") or "")[:180]).encode()).hexdigest()

        if action == "status":
            lst = inbox_list() if step == "app" else []
            unread = sum(1 for r in lst if not r["read"])
            extra = {}
            if step == "app":
                extra = _cms().overview()
            out({"ok": True, "step": step, "items": lst, "unread": unread, "total": len(lst), **extra})
            return

        if action == "login":
            if not csrf_ok(sess, data.get("csrf")):
                out({"ok": False, "error": "Sesja wygasła. Odśwież stronę."}, 400)
                return
            if rate_hit("login:" + key, 8, 900):
                out({"ok": False, "error": "Zbyt wiele prób. Spróbuj za kilka minut."}, 429)
                return
            user_ok = verify_user(str(data.get("user") or "").strip(), env)
            pass_ok = verify_password(str(data.get("pass") or ""), env)
            if not user_ok or not pass_ok:
                time.sleep(0.15)
                out({"ok": False, "error": "Nieprawidłowe dane logowania."})
                return
            sess["pending"] = True
            sess["pending_exp"] = int(time.time()) + 180
            sess["bind"] = self._bind_key()
            sess.pop("auth", None)
            sess.pop("totp_used", None)
            sess.pop("seen", None)
            sess["csrf"] = secrets.token_hex(32)
            out({"ok": True, "step": "totp"})
            return

        if action == "totp":
            if step != "totp":
                out({"ok": False, "error": "Najpierw zaloguj się hasłem.", "step": step}, 400)
                return
            if not csrf_ok(sess, data.get("csrf")):
                out({"ok": False, "error": "Sesja wygasła. Odśwież stronę."}, 400)
                return
            if rate_hit("totp:" + key, 8, 900):
                out({"ok": False, "error": "Zbyt wiele prób. Spróbuj za kilka minut."}, 429)
                return
            code = str(data.get("code") or "")
            secret = env.get("ADMIN_TOTP_SECRET") or ""
            ok = totp_verify(secret, code)
            slot = int(time.time()) // 30
            if ok and sess.get("totp_used") == slot:
                ok = False
            if not ok:
                time.sleep(0.15)
                out({"ok": False, "error": "Nieprawidłowy kod uwierzytelniający."})
                return
            sess["auth"] = True
            sess["totp_used"] = slot
            sess["bind"] = self._bind_key()
            sess["seen"] = int(time.time())
            sess.pop("pending", None)
            sess.pop("pending_exp", None)
            sess["csrf"] = secrets.token_hex(32)
            lst = inbox_list()
            unread = sum(1 for r in lst if not r["read"])
            out({"ok": True, "step": "app", "items": lst, "unread": unread, "total": len(lst)})
            return

        if action == "logout":
            if not csrf_ok(sess, data.get("csrf")):
                out({"ok": False, "error": "Sesja wygasła. Odśwież stronę."}, 400)
                return
            sess.clear()
            sess["csrf"] = secrets.token_hex(32)
            out({"ok": True, "step": "login"})
            return

        if step != "app":
            out({"ok": False, "error": "Wymagane logowanie.", "step": step}, 401)
            return
        if not csrf_ok(sess, data.get("csrf")):
            out({"ok": False, "error": "Sesja wygasła. Odśwież stronę."}, 400)
            return

        iid = str(data.get("id") or "")
        if action == "get":
            row = inbox_find(iid)
            if not row:
                out({"ok": False, "error": "Nie znaleziono wiadomości."}, 404)
                return
            inbox_patch(iid, lambda r: {**r, "read": True})
            row = dict(row)
            row["read"] = True
            row.pop("ip", None)
            out({"ok": True, "item": row})
            return
        if action == "unread":
            out({"ok": inbox_patch(iid, lambda r: {**r, "read": False})})
            return
        if action == "delete":
            items = [r for r in load_inbox() if not (isinstance(r, dict) and r.get("id") == iid)]
            save_inbox(items)
            out({"ok": True})
            return
        if isinstance(action, str) and action.startswith("cms."):
            result = _cms().handle(action, data)
            out(result, 200 if result.get("ok") else 400)
            return
        out({"ok": False, "error": "Nieznane żądanie."}, 400)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8099)
    args = parser.parse_args()
    DATA.mkdir(parents=True, exist_ok=True)
    SESSIONS.mkdir(parents=True, exist_ok=True)
    if (not INBOX.is_file() or INBOX.stat().st_size == 0) and INBOX_LEGACY.is_file():
        save_inbox(load_inbox())
    httpd = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"serving {ROOT} on http://localhost:{args.port}/")
    print(f"panel  http://localhost:{args.port}/panel/")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
