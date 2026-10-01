# -*- coding: utf-8 -*-
import urllib.request, re, json
from pathlib import Path

ua = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
urls = {
    'cdm': 'https://www.smoltech.pl/zgrzewarki-do-trzpieni/urzadzenia-typu-cdm/',
    'da': 'https://www.smoltech.pl/zgrzewarki-do-trzpieni/urzadzenia-typu-da/',
}
out = Path('_build/_stud_media.json')
data = {}
for key, url in urls.items():
    raw = urllib.request.urlopen(urllib.request.Request(url, headers=ua), timeout=45).read().decode('utf-8', 'replace')
    Path(f'_build/_pl_{key}.html').write_text(raw, encoding='utf-8')
    imgs = []
    for m in re.finditer(r'(?:data-src|src|srcset)=["\']([^"\']+\.(?:jpg|jpeg|png|webp)(?:\?[^"\']*)?)', raw, re.I):
        u = m.group(1).split()[0]
        if 'wp-content' in u or 'exactdn' in u:
            if u.startswith('//'): u = 'https:' + u
            imgs.append(u)
    # unique preserve
    seen = []
    for u in imgs:
        if u not in seen:
            seen.append(u)
    yts = []
    for m in re.finditer(r'(?:youtube(?:-nocookie)?\.com/(?:embed/|watch\?v=)|youtu\.be/)([A-Za-z0-9_-]{11})', raw):
        if m.group(1) not in yts:
            yts.append(m.group(1))
    # also data-vid style
    for m in re.finditer(r'data-vid=["\']([A-Za-z0-9_-]{11})["\']', raw):
        if m.group(1) not in yts:
            yts.append(m.group(1))
    data[key] = {'imgs': seen[:40], 'yts': yts, 'len': len(raw)}
out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
print('wrote', out)
for k,v in data.items():
    print(k, 'imgs', len(v['imgs']), 'yts', v['yts'])
    for u in v['imgs'][:15]:
        print(' ', u[:120])
