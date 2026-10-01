# -*- coding: utf-8 -*-
from pathlib import Path
import re, json, urllib.request

ua = {'User-Agent': 'Mozilla/5.0'}
raw_cdm = Path('_build/_pl_cdm.html').read_text(encoding='utf-8')
raw_da = Path('_build/_pl_da.html').read_text(encoding='utf-8')

def extract_vids(raw):
    out = []
    for m in re.finditer(r'data-vid="([A-Za-z0-9_-]{11})"', raw):
        start = max(0, m.start() - 1200)
        end = min(len(raw), m.end() + 1200)
        chunk = raw[start:end]
        # strip tags for nearby text
        text = re.sub(r'<[^>]+>', ' ', chunk)
        text = re.sub(r'\s+', ' ', text)
        out.append({'id': m.group(1), 'context': text[max(0,len(text)//2-200):len(text)//2+200]})
    return out

def all_uploads(raw):
    return sorted(set(re.findall(r'https://[^"\'\s]+/wp-content/uploads/[^"\'\s?]+', raw)))

print('=== CDM uploads ===')
for u in all_uploads(raw_cdm):
    print(u)
print('=== CDM vids ===')
for v in extract_vids(raw_cdm):
    print(v['id'], '::', v['context'][:180])
print('=== DA uploads ===')
for u in all_uploads(raw_da):
    print(u)
print('=== DA vids ===')
for v in extract_vids(raw_da):
    print(v['id'], '::', v['context'][:180])

# Try YouTube oEmbed titles
ids = ['lCyuCo56xBY','y6CQkvx5_vU','NwewkF24RIc','mQEIvZZ89H8','xiE4baaKpFk']
print('=== oEmbed ===')
for vid in ids:
    try:
        url = f'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={vid}&format=json'
        data = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=ua), timeout=20).read())
        print(vid, data.get('title'), '|', data.get('author_name'))
    except Exception as e:
        print(vid, 'ERR', e)

# Search media library for individual CDM models
print('=== media search hints ===')
for q in ['CDM8','CDM9','CDM10','CDM-8','i12','i16','taylor']:
    url = f'https://www.smoltech.pl/?s={q}'
    try:
        html = urllib.request.urlopen(urllib.request.Request(url, headers=ua), timeout=20).read().decode('utf-8','replace')
        imgs = re.findall(r'https://[^"\']+/wp-content/uploads/[^"\']+\.(?:jpg|png|webp)', html)
        uniq = []
        for i in imgs:
            if i not in uniq: uniq.append(i)
        print(q, 'imgs', len(uniq))
        for i in uniq[:8]:
            print(' ', i)
    except Exception as e:
        print(q, e)
