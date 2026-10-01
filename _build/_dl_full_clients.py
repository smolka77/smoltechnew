# -*- coding: utf-8 -*-
"""Download full ODBIORCY set (66 logos) from smoltech.pl/o-firmie/."""
import urllib.request, json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / 'assets' / 'img'
ua = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

urls = []
# 2020/04 batch: 1-1..4-1 then 5..42
for n in range(1, 5):
    urls.append(f'https://www.smoltech.pl/wp-content/uploads/2020/04/{n}-1.jpg')
for n in range(5, 43):
    urls.append(f'https://www.smoltech.pl/wp-content/uploads/2020/04/{n}.jpg')
# 2021
for name in ['1a-1', '2a-1', '3a-1', '4a-1', '5a-1', '6a-2']:
    urls.append(f'https://www.smoltech.pl/wp-content/uploads/2021/01/{name}.jpg')
# 2022
for name in ['1', '5', '2-1', '3-1', '6', '4-1']:
    urls.append(f'https://www.smoltech.pl/wp-content/uploads/2022/04/{name}.jpg')
# 2025
for name in ['PaksD-2-1.png', 'schurholz-2-1.png', '3-M-2-1.png', 'DB-Cargo-2-1.png', 'GSS-2-1.png', 'MAN-2-1-e1760016408201.png']:
    urls.append(f'https://www.smoltech.pl/wp-content/uploads/2025/09/{name}')
# 2026
for name in ['adient-1.jpg', 'gewiss-1.jpg', 'pitra-1.jpg', 'pzl-1.jpg', 'rawplug-1.jpg', 'toroidy.jpg']:
    urls.append(f'https://www.smoltech.pl/wp-content/uploads/2026/08/{name}')

print('total urls', len(urls))
manifest = []
for i, url in enumerate(urls, 1):
    ext = Path(url).suffix.lower() or '.jpg'
    stem = f'client-full-{i:02d}'
    out = IMG / f'{stem}{ext}'
    webp = IMG / f'{stem}.webp'
    if not out.exists() or out.stat().st_size < 400:
        ok = False
        for try_url in (url, url.replace('https://www.smoltech.pl', 'https://exgic2b95c2.exactdn.com') + '?strip=all'):
            try:
                data = urllib.request.urlopen(urllib.request.Request(try_url, headers=ua), timeout=40).read()
                out.write_bytes(data)
                print('dl', out.name, len(data))
                ok = True
                break
            except Exception as e:
                last = e
        if not ok:
            print('FAIL', i, url, last)
            continue
    else:
        print('skip', out.name)
    try:
        im = Image.open(out)
        if im.mode in ('P', 'RGBA', 'LA'):
            bg = Image.new('RGB', im.size, (255, 255, 255))
            im2 = im.convert('RGBA')
            bg.paste(im2, mask=im2.split()[-1])
            im = bg
        else:
            im = im.convert('RGB')
        im.save(webp, 'WEBP', quality=86, method=6)
        w, h = im.size
        manifest.append({'n': i, 'file': f'{stem}.webp', 'w': w, 'h': h})
    except Exception as e:
        print('webp fail', stem, e)

(Path('_build/_client_manifest.json')).write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print('manifest', len(manifest))
