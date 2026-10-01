# -*- coding: utf-8 -*-
"""Convert WeTransfer client logos into 66 retina webp tiles."""
from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

from PIL import Image, ImageFilter

ZIP = Path(r"g:\wetransfer_loga-klientow_2026-09-09_0731.zip")
OUT = Path(r"G:\smoltech.ua\assets\img")
SKIP = "bew2ztuxrvc3zels.png"  # unnamed WeTransfer dump
MAX_W, MAX_H = 480, 240


def basename(path: str) -> str:
    return path.replace("\\", "/").rsplit("/", 1)[-1]


def is_empty(px: tuple, mode: str) -> bool:
    if mode == "RGBA":
        r, g, b, a = px
        if a < 10:
            return True
        if a > 200 and r > 248 and g > 248 and b > 248:
            return True
        return False
    r, g, b = px[:3]
    return r > 248 and g > 248 and b > 248


def trim(im: Image.Image, pad: int = 4) -> Image.Image:
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if not is_empty(px[x, y], "RGBA"):
                xs.append(x)
                ys.append(y)
    if not xs:
        return im
    l, r = max(0, min(xs) - pad), min(w, max(xs) + 1 + pad)
    t, b = max(0, min(ys) - pad), min(h, max(ys) + 1 + pad)
    return im.crop((l, t, r, b))


def fit(im: Image.Image) -> Image.Image:
    w, h = im.size
    if w <= MAX_W and h <= MAX_H:
        return im
    scale = min(MAX_W / w, MAX_H / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    return im.resize((nw, nh), Image.Resampling.LANCZOS)


def save_webp(im: Image.Image, dest: Path) -> tuple[int, int]:
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA")
    # Flatten near-white logos onto white so jpeg-ish marks stay crisp in grid.
    if im.mode == "RGBA":
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        rgb = bg
    else:
        rgb = im.convert("RGB")
    rgb.save(dest, "WEBP", quality=92, method=6)
    return rgb.size


def main() -> None:
    z = zipfile.ZipFile(ZIP)
    files = []
    for info in z.infolist():
        name = basename(info.filename)
        if info.is_dir() or not name:
            continue
        if not name.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            continue
        if name.lower() == SKIP:
            print("skip", name)
            continue
        files.append(info)

    files.sort(key=lambda i: basename(i.filename).lower())
    if len(files) < 66:
        raise SystemExit(f"need 66 logos, got {len(files)}")
    files = files[:66]
    print("using", len(files))

    manifest = []
    for i, info in enumerate(files, 1):
        raw = z.read(info.filename)
        im = Image.open(io.BytesIO(raw))
        im = ImageOps_exif(im)
        im = trim(im)
        im = fit(im)
        stem = f"client-full-{i:02d}"
        dest = OUT / f"{stem}.webp"
        w, h = save_webp(im, dest)
        # drop leftover jpg/png variants of the same stem
        for extra in (OUT / f"{stem}.jpg", OUT / f"{stem}.png"):
            if extra.exists():
                extra.unlink()
        print(f"{stem:16} {basename(info.filename):32} {w}x{h} {dest.stat().st_size}")
        manifest.append({"n": i, "src": basename(info.filename), "w": w, "h": h})

    (Path(r"G:\smoltech.ua\_build\_client_manifest.json")).write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print("done", len(manifest))


def ImageOps_exif(im: Image.Image) -> Image.Image:
    try:
        from PIL import ImageOps
        return ImageOps.exif_transpose(im)
    except Exception:
        return im


if __name__ == "__main__":
    main()
