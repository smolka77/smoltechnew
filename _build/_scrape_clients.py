# -*- coding: utf-8 -*-
import urllib.request, re
from pathlib import Path
ua = {'User-Agent': 'Mozilla/5.0'}
raw = urllib.request.urlopen(urllib.request.Request('https://www.smoltech.pl/o-firmie/', headers=ua), timeout=45).read().decode('utf-8', 'replace')
Path('_build/_pl_about.html').write_text(raw, encoding='utf-8')
idx = raw.lower().find('odbiorcy')
print('odbiorcy', idx)
chunk = raw[idx:idx+20000] if idx > 0 else raw
ups = re.findall(r'(?:data-src|src)="(https://[^"]+/wp-content/uploads/[^"]+\.(?:jpg|png|webp|jpeg)(?:\?[^"]*)?)"', chunk, re.I)
seen = []
for u in ups:
    u = u.split()[0]
    if u not in seen:
        seen.append(u)
print('imgs', len(seen))
for u in seen:
    print(u)
