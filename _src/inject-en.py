# -*- coding: utf-8 -*-
from pathlib import Path

root = Path(r"G:/smoltech.ua")
js_path = root / "assets/js/tlumaczenia.js"
snip = (root / "_src/en-extra-snippet.js").read_text(encoding="utf-8").rstrip() + "\n"
js = js_path.read_text(encoding="utf-8")

needle = "    'Точково-рельєфні машини з лінійним притиском — SMOLTECH': 'Spot-projection machines with linear squeeze — SMOLTECH',\n  };"
if needle not in js:
    raise SystemExit("marker not found")

# idempotent: remove previous patch block if re-run (between this key and }; of extra)
if "/* === EN PATCH 20260901 === */" in js:
    raise SystemExit("already patched")

replacement = (
    "    'Точково-рельєфні машини з лінійним притиском — SMOLTECH': 'Spot-projection machines with linear squeeze — SMOLTECH',\n"
    "    /* === EN PATCH 20260901 === */\n"
    + snip
    + "  };"
)
js2 = js.replace(needle, replacement, 1)
js_path.write_text(js2, encoding="utf-8")
print("OK injected", snip.count("\n"), "entries")
