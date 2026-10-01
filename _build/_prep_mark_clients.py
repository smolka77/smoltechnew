# -*- coding: utf-8 -*-
from pathlib import Path
import urllib.request
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / 'assets' / 'img'
ua = {'User-Agent': 'Mozilla/5.0'}

# Make logo mark usable on light backgrounds (black -> transparent)
for src_name, out_stem in [('mark.png', 'mark-nav'), ('mark-bullet.png', 'mark-nav-sm')]:
    im = Image.open(IMG / src_name).convert('RGBA')
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r < 28 and g < 28 and b < 28:
                px[x, y] = (0, 0, 0, 0)
    out = IMG / f'{out_stem}.png'
    im.save(out, 'PNG')
    im.save(IMG / f'{out_stem}.webp', 'WEBP', quality=92, method=6)
    print('wrote', out.name, out.stat().st_size)

# Download missing client logos 25-27 (+ refill any missing)
for n in range(1, 28):
    jpg = IMG / f'client-{n:02d}.jpg'
    png = IMG / f'client-{n:02d}.png'
    if jpg.exists() or png.exists():
        continue
    url = f'https://exgic2b95c2.exactdn.com/wp-content/uploads/2020/04/{n}.jpg?strip=all'
    if n <= 4:
        url = f'https://exgic2b95c2.exactdn.com/wp-content/uploads/2020/04/{n}-1.jpg?strip=all'
    try:
        data = urllib.request.urlopen(urllib.request.Request(url, headers=ua), timeout=30).read()
        jpg.write_bytes(data)
        im = Image.open(jpg).convert('RGB')
        im.save(IMG / f'client-{n:02d}.webp', 'WEBP', quality=85, method=6)
        print('dl', jpg.name, len(data))
    except Exception as e:
        print('fail', n, e)

print('done')
