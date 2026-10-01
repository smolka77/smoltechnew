# -*- coding: utf-8 -*-
"""Crop series product shots into per-model images + download YouTube thumbs."""
from pathlib import Path
import urllib.request
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / 'assets' / 'img'
YT = IMG / 'yt'
YT.mkdir(parents=True, exist_ok=True)
ua = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

def save_webp_jpg(im: Image.Image, stem: Path, quality=88):
    rgb = im.convert('RGB')
    jpg = stem.with_suffix('.jpg')
    webp = stem.with_suffix('.webp')
    rgb.save(jpg, 'JPEG', quality=quality, optimize=True)
    rgb.save(webp, 'WEBP', quality=quality, method=6)
    print('wrote', jpg.name, jpg.stat().st_size, webp.name, webp.stat().st_size)

def crop_equal(src: Path, names: list[str], pad_ratio=0.01):
    im = Image.open(src).convert('RGB')
    w, h = im.size
    n = len(names)
    pad = int(w * pad_ratio)
    slice_w = w // n
    for i, name in enumerate(names):
        left = i * slice_w + (pad if i else 0)
        right = (i + 1) * slice_w - (pad if i < n - 1 else 0)
        if i == n - 1:
            right = w
        box = (left, 0, right, h)
        crop = im.crop(box)
        # trim excess white margins lightly
        save_webp_jpg(crop, IMG / name)

# CDM series: 3 equal machines
crop_equal(IMG / 'stud-cdm-series.jpg', ['stud-cdm8', 'stud-cdm9', 'stud-cdm10'], pad_ratio=0.008)
# DA series: 2 machines with white gap — use visual mid
da = Image.open(IMG / 'stud-da-series.jpg').convert('RGB')
dw, dh = da.size
# find vertical white strip near center
mid = dw // 2
# search for widest white column near mid
best = mid
best_score = -1
for x in range(mid - 80, mid + 80):
    col = [da.getpixel((x, y)) for y in range(0, dh, 4)]
    score = sum(1 for r, g, b in col if r > 245 and g > 245 and b > 245)
    if score > best_score:
        best_score = score
        best = x
print('DA split at', best, 'of', dw)
save_webp_jpg(da.crop((0, 0, best, dh)), IMG / 'stud-i12')
save_webp_jpg(da.crop((best, 0, dw, dh)), IMG / 'stud-i16')

vids = ['lCyuCo56xBY', 'y6CQkvx5_vU', 'NwewkF24RIc', 'mQEIvZZ89H8', 'xiE4baaKpFk']
for vid in vids:
    out = YT / f'{vid}.jpg'
    if out.exists() and out.stat().st_size > 2000:
        print('skip', out.name)
        continue
    url = f'https://i.ytimg.com/vi/{vid}/hqdefault.jpg'
    req = urllib.request.Request(url, headers=ua)
    data = urllib.request.urlopen(req, timeout=30).read()
    out.write_bytes(data)
    print('yt', out.name, len(data))

print('done')
