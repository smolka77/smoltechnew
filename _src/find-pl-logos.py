# -*- coding: utf-8 -*-
from pathlib import Path
import re
import urllib.request

html = urllib.request.urlopen("https://www.smoltech.pl/", timeout=30).read().decode("utf-8", "ignore")
urls = sorted(set(re.findall(r"https?://[^\s\"']+[Ll]ogo[^\s\"']+\.(?:png|svg|webp|jpe?g)", html, flags=re.I)))
urls += sorted(set(re.findall(r"/wp-content/uploads/[^\s\"']+[Ll]ogo[^\s\"']+\.(?:png|svg|webp|jpe?g)", html, flags=re.I)))
Path(r"G:/smoltech.ua/_src/pl-logo-urls.txt").write_text("\n".join(urls), encoding="utf-8")
print("count", len(urls))
for u in urls[:40]:
    print(u)
