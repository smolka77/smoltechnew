# -*- coding: utf-8 -*-
import json
from pathlib import Path
m = json.loads(Path('_build/_client_manifest.json').read_text(encoding='utf-8'))
lines = []
for it in m:
    lines.append(
        f'      <li><img src="/assets/img/{it["file"]}?v=5" alt="" width="{it["w"]}" height="{it["h"]}" loading="lazy" decoding="async"></li>'
    )
Path('_build/_client_wall_snippet.html').write_text('\n'.join(lines), encoding='utf-8')
print(len(lines))
