from PIL import Image
from pathlib import Path

dst = Path(r"G:\smoltech.ua\assets\img")

# Prefer two-machine stationary; e-tech from downloaded product shot
jobs = [
    (dst / "hero-stationary.jpg", "hero-stationary", 1200),
    (dst / "prod-etech.png", "hero-etech", 1400),
    (dst / "hero-projection.jpg", "hero-projection", 1400),
    (dst / "hero-automation-full.jpg", "hero-automation", 1600),
    (dst / "hero-mesh.jpg", "hero-mesh", 1400),
    (dst / "company-hall-2.jpg", "hero-metal-hub", 1600),
    (dst / "hero-auto-cell.jpg", "hero-auto-cell", 1400),
    (dst / "hero-projection-b.jpg", "hero-projection-cell", 1200),
]

# Prefer larger e-tech download if valid RGB product shot
etech_dl = dst / "hero-etech.jpg"
if etech_dl.exists() and etech_dl.stat().st_size > 50000:
    jobs[1] = (etech_dl, "hero-etech", 1400)

for src, base, max_w in jobs:
    if not src.exists():
        print("missing", src)
        continue
    im = Image.open(src).convert("RGB")
    w, h = im.size
    if w > max_w:
        nh = int(h * max_w / w)
        im = im.resize((max_w, nh), Image.Resampling.LANCZOS)
    jpg = dst / f"{base}.jpg"
    webp = dst / f"{base}.webp"
    im.save(jpg, "JPEG", quality=86, optimize=True)
    im.save(webp, "WEBP", quality=82, method=6)
    print(f"{base}: {im.size[0]}x{im.size[1]} jpg={jpg.stat().st_size} webp={webp.stat().st_size}")
