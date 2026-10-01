"""Isolate one catalog unit and pad it onto a white 4:3 canvas."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "assets" / "img"
WHITE = 246
MARGIN = 0.18

# Crop to the left unit when the file is a side-by-side lineup.
SPLITS = {
    "prod-stationary-inv-25": 250,
    "prod-stationary-16-25": 94,
    "prod-proj-dc-100": 80,
}

PAD_ONLY = [
    "prod-suspended-16-38",
    "prod-suspended-56-90",
    "prod-proj-inv-56",
    "prod-proj-inv-90-200",
    "prod-proj-ac-35-80",
    "prod-proj-ac-63-163",
    "prod-proj-ac-80-315",
    "cat-projection",
]


def raster_source(stem: str) -> Path | None:
    for ext in (".jpg", ".png", ".jpeg", ".webp"):
        p = ROOT / f"{stem}{ext}"
        if p.exists():
            return p
    return None


def content_bbox(im: Image.Image, thresh: int = WHITE):
    im = im.convert("RGB")
    w, h = im.size
    px = im.load()
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if r < thresh or g < thresh or b < thresh:
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
    if maxx < 0:
        return None
    return minx, miny, maxx + 1, maxy + 1


def pad43(obj: Image.Image, margin: float = MARGIN) -> Image.Image:
    obj = obj.convert("RGB")
    ow, oh = obj.size
    m = max(12, int(max(ow, oh) * margin))
    inner_w, inner_h = ow + 2 * m, oh + 2 * m
    if inner_w / inner_h > 4 / 3:
        cw, ch = inner_w, int(round(inner_w * 3 / 4))
    else:
        ch, cw = inner_h, int(round(inner_h * 4 / 3))
    if min(cw, ch) < 240:
        scale = 240 / min(cw, ch)
        cw, ch = max(1, int(cw * scale)), max(1, int(ch * scale))
        nw, nh = max(1, int(ow * scale)), max(1, int(oh * scale))
        obj = obj.resize((nw, nh), Image.Resampling.LANCZOS)
        ow, oh = nw, nh
    canvas = Image.new("RGB", (cw, ch), (255, 255, 255))
    canvas.paste(obj, ((cw - ow) // 2, (ch - oh) // 2))
    return canvas


def save_pair(stem: str, im: Image.Image, src: Path) -> None:
    rgb = im.convert("RGB")
    webp = ROOT / f"{stem}.webp"
    jpg = ROOT / f"{stem}.jpg"
    png = ROOT / f"{stem}.png"
    rgb.save(webp, "WEBP", quality=86, method=6)
    if src.suffix.lower() == ".png" or (png.exists() and not jpg.exists()):
        rgb.save(png, "PNG", optimize=True)
    else:
        rgb.save(jpg, "JPEG", quality=90, optimize=True, subsampling=1)
    print(f"OK  {stem:28} {src.name:32} -> {rgb.size[0]}x{rgb.size[1]}")


def process(stem: str, split_x: int | None) -> None:
    src = raster_source(stem)
    if src is None:
        print("MISSING", stem)
        return
    im = Image.open(src).convert("RGB")
    if split_x is not None:
        im = im.crop((0, 0, min(split_x, im.size[0]), im.size[1]))
    bb = content_bbox(im)
    if not bb:
        print("EMPTY", stem)
        return
    obj = im.crop(bb)
    out = pad43(obj)
    save_pair(stem, out, src)


def main() -> None:
    for stem, split_x in SPLITS.items():
        process(stem, split_x)
    for stem in PAD_ONLY:
        process(stem, None)


if __name__ == "__main__":
    main()
