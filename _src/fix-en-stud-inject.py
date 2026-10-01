# -*- coding: utf-8 -*-
"""Fix broken stud EN patch that was injected into window.ST."""
from pathlib import Path
import re

path = Path(r"G:/smoltech.ua/assets/js/tlumaczenia.js")
js = path.read_text(encoding="utf-8")

marker = "/* === EN PATCH STUD 20260903 === */"
start = js.find(marker)
if start < 0:
    raise SystemExit("marker not found")

# Find the orphaned }; that wrongly closed the patch (before function wanted)
wanted = js.find("\n  function wanted()", start)
if wanted < 0:
    raise SystemExit("wanted not found")

# Back up to the }; just before function wanted
block = js[start:wanted]
# strip trailing }; and whitespace from block — keep only the key lines
m = re.search(r"\n  \};\s*$", block)
if not m:
    raise SystemExit("trailing }; not found in patch block")
entries = block[: m.start()].rstrip()  # includes marker + lines

# Rebuild window.ST properly — everything from window.ST = { until marker
st_start = js.rfind("  window.ST = {", 0, start)
if st_start < 0:
    raise SystemExit("window.ST not found")

fixed_st = """  window.ST = {
    lang: function () {
      return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'uk';
    },
    t: function (uk, en) {
      if (ST.lang() !== 'en') return uk;
      return en != null ? en : lookup(uk);
    }
  };
"""

# Insert entries into extra object (before its closing }; that precedes for-loop merge)
extra_merge = "  for (vk in extra) { if (Object.prototype.hasOwnProperty.call(extra, vk)) D[vk] = extra[vk]; }"
em_pos = js.find(extra_merge)
if em_pos < 0:
    raise SystemExit("extra merge not found")

# Find }; just before the merge loop
extra_close = js.rfind("\n  };", 0, em_pos)
if extra_close < 0:
    raise SystemExit("extra close not found")

# Avoid double-insert if somehow already in extra
if marker in js[:extra_close]:
    raise SystemExit("marker already in extra — abort")

# Indent entries with 2 more spaces to match extra (4 spaces)? Looking at extra entries they use 2 spaces like D.
# extra uses: `  'key': 'val',` — same as our entries after marker.

new_js = (
    js[:extra_close]
    + "\n\n  "
    + entries
    + "\n"
    + js[extra_close:st_start]
    + fixed_st
    + js[wanted:]
)

# syntax check via node if available
path.write_text(new_js, encoding="utf-8")
print("rewrote", len(js), "->", len(new_js))

# verify structure
js2 = path.read_text(encoding="utf-8")
assert marker in js2
assert "function wanted()" in js2
assert js2.count("window.ST = {") == 1
# marker should appear before lookup
assert js2.find(marker) < js2.find("function lookup")
assert js2.find("window.ST") < js2.find("function wanted()")
print("structure OK")
