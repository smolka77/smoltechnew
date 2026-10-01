# -*- coding: utf-8 -*-
from pathlib import Path

root = Path(r"G:/smoltech.ua")
js_path = root / "assets/js/tlumaczenia.js"
js = js_path.read_text(encoding="utf-8")

if "/* === EN PATCH 20260903 === */" in js:
    raise SystemExit("already patched")

snip = (root / "_src/en-patch-20260903.js").read_text(encoding="utf-8")
lines = [l for l in snip.splitlines() if not l.strip().startswith("//")]
body = "\n".join(lines).rstrip()
if not body.endswith(","):
    body += ","

needle = "  'Окремі машини або повні технологічні комплекси.': 'Stand-alone machines or complete process cells.',"
pos = js.find(needle)
if pos < 0:
    raise SystemExit("needle not found")

end = js.find("\n  };", pos)
if end < 0:
    raise SystemExit("close not found")

close_end = end + len("\n  };")
new_js = (
    js[:pos]
    + needle
    + "\n    /* === EN PATCH 20260903 === */\n"
    + body
    + "\n  };"
    + js[close_end:]
)

# Also refresh FAQ language note translation if present
old_faq = (
    "  'Так. Ми виготовляємо обладнання для промислових підприємств Польщі, України та інших країн. "
    "Спілкуємося польською та англійською. Напишіть нам — обговоримо технологію, підбір обладнання та умови постачання.': "
    "'Yes. We build equipment for industrial plants in Poland, Ukraine and other countries. "
    "We communicate in Polish and English. Write to us — we will discuss the process, equipment selection and supply terms.',"
)
new_faq = (
    "  'Так. Ми виготовляємо обладнання для промислових підприємств Польщі, України та інших країн. "
    "Спілкуємося українською, польською та англійською. Напишіть нам — обговоримо технологію, підбір обладнання та умови постачання.': "
    "'Yes. We build equipment for industrial plants in Poland, Ukraine and other countries. "
    "We communicate in Ukrainian, Polish and English. Write to us — we will discuss the process, equipment selection and supply terms.',"
)
if old_faq in new_js:
    new_js = new_js.replace(old_faq, new_faq)
    print("updated FAQ lang note")

js_path.write_text(new_js, encoding="utf-8")
print("OK injected", body.count("\n") + 1, "lines, size", len(new_js))
