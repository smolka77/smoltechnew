# -*- coding: utf-8 -*-
import urllib.request, re
from pathlib import Path
ua = {'User-Agent': 'Mozilla/5.0'}
raw = urllib.request.urlopen(urllib.request.Request('https://www.smoltech.pl/o-firmie/', headers=ua), timeout=45).read().decode('utf-8', 'replace')
Path('_build/_pl_about.html').write_text(raw, encoding='utf-8')
# find odbiorcy section content
idx = raw.lower().find('odbiorcy')
print('idx', idx)
chunk = raw[max(0,idx-200):idx+25000]
# strip scripts
chunk = re.sub(r'<script[\s\S]*?</script>', '', chunk, flags=re.I)
# find image alts and filenames
imgs = re.findall(r'(?:alt|title)="([^"]*)"[^>]*(?:data-src|src)="([^"]+uploads/[^"]+)"|(?:data-src|src)="([^"]+uploads/[^"]+)"[^>]*(?:alt|title)="([^"]*)"', chunk, re.I)
print('paired', len(imgs))
ups = re.findall(r'(?:data-src|src)="(https://[^"]+/wp-content/uploads/2020/04/[^"]+)"', chunk)
seen=[]
for u in ups:
    u=u.split('?')[0]
    if u not in seen: seen.append(u)
print('uploads', len(seen))
for u in seen: print(u)

# text near section headings
for m in re.finditer(r'<(h[1-6]|p|figcaption|span)[^>]*>([^<]{2,120})</', chunk):
    t=re.sub(r'\s+',' ',m.group(2)).strip()
    if t and 'http' not in t and len(t)>2:
        print('TXT', m.group(1), t[:100])
