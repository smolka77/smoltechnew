# -*- coding: utf-8 -*-
"""Rebuild all SMOLTECH brand assets from official trademark files (smoltech.pl)."""
from pathlib import Path
from PIL import Image, ImageDraw
import shutil

DIR = Path(r"G:/smoltech.ua/assets/img")
LOCKUP = DIR / "_pl-lockup.png"  # Logo-Smoltech_New-01
SQ = DIR / "_pl-512.png"         # Logo-Smoltech-512


def solid_bbox(im: Image.Image, a_min=40, lim=None):
    """Bounding box of non-near-transparent, non-near-white pixels."""
    px = im.load()
    w, h = im.size
    y1 = lim if lim is not None else h
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(y1):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < a_min:
                continue
            # skip near-white (512 bg)
            if r > 248 and g > 248 and b > 248:
                continue
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
    return (minx, miny, maxx + 1, maxy + 1)


def key_white(im: Image.Image, thr=248) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= thr and g >= thr and b >= thr:
                px[x, y] = (255, 255, 255, 0)
    return im


def fit_square(im: Image.Image, side: int, pad_ratio=0.06) -> Image.Image:
    bb = im.getbbox()
    if not bb:
        return Image.new("RGBA", (side, side), (0, 0, 0, 0))
    crop = im.crop(bb)
    pad = int(side * pad_ratio)
    inner = side - 2 * pad
    cw, ch = crop.size
    scale = min(inner / cw, inner / ch)
    nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
    resized = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    out.paste(resized, ((side - nw) // 2, (side - nh) // 2), resized)
    return out


def compose_nav(mark: Image.Image, word: Image.Image, out_h=104, gap=14, left_pad=4, right_pad=8) -> Image.Image:
    # mark square ~ out_h
    m = mark.copy()
    m.thumbnail((out_h, out_h), Image.Resampling.LANCZOS)
    # word scaled to ~0.78 of height
    target_wh = int(out_h * 0.78)
    w = word.copy()
    ww, wh = w.size
    scale = target_wh / wh
    nw, nh = max(1, int(ww * scale)), max(1, int(wh * scale))
    w = w.resize((nw, nh), Image.Resampling.LANCZOS)
    total_w = left_pad + m.size[0] + gap + nw + right_pad
    canvas = Image.new("RGBA", (total_w, out_h), (0, 0, 0, 0))
    canvas.paste(m, (left_pad, (out_h - m.size[1]) // 2), m)
    canvas.paste(w, (left_pad + m.size[0] + gap, (out_h - nh) // 2), w)
    return canvas


def main():
    assert LOCKUP.exists() and SQ.exists()

    # Master lockup (transparent) — official New-01
    lock = Image.open(LOCKUP).convert("RGBA")
    shutil.copy2(LOCKUP, DIR / "logo.png")
    lock.save(DIR / "logo.webp", "WEBP", quality=90, method=6)

    # Official square for PWA / schema
    sq = Image.open(SQ).convert("RGBA")
    sq.save(DIR / "icon-512.png")
    sq.save(DIR / "logo-square.png")

    # Extract trademark mark (circle only) from lockup — no reflection.
    # A y-limit through the lower half of the ring used to clip the circle
    # (flat chord at the bottom). Take the ring's full width from a scan that
    # includes the equator, then crop a square of that diameter from the top.
    limit = int(lock.size[1] * 0.40)
    bb = solid_bbox(lock, lim=limit)
    if not bb:
        raise SystemExit("mark bbox not found")
    minx, miny, maxx, _maxy = bb
    side = maxx - minx
    mark_raw = lock.crop((minx, miny, minx + side, miny + side))
    # Further: find circular content — crop to content bbox again after removing near-black empty
    mark = fit_square(mark_raw, 403, pad_ratio=0.04)
    mark.save(DIR / "mark.png")
    mark.copy().save(DIR / "mark-light.png")
    fit_square(mark_raw, 128, pad_ratio=0.04).save(DIR / "mark-128.png")
    fit_square(mark_raw, 64, pad_ratio=0.06).save(DIR / "mark-bullet.png")

    # Wordmark: lower portion of lockup (SMOLTECH + Technika Zgrzewalnicza)
    wbb = solid_bbox(lock)
    # start below the full mark square (not the 40% scan cutoff)
    word = lock.crop((wbb[0], miny + side + 8, wbb[2], wbb[3]))
    word_bb = word.getbbox()
    if word_bb:
        word = word.crop(word_bb)

    # Horizontal nav lockups — same display height as now (layout-safe)
    nav = compose_nav(mark_raw, word, out_h=104)
    nav.save(DIR / "logo-nav.png")
    # Footer slightly narrower: same art, smaller height canvas target via resize width
    nav_ftr = compose_nav(mark_raw, word, out_h=104, gap=12, left_pad=2, right_pad=4)
    # scale to ~328 wide like before
    target_w = 328
    scale = target_w / nav_ftr.size[0]
    nav_ftr = nav_ftr.resize((target_w, max(1, int(nav_ftr.size[1] * scale))), Image.Resampling.LANCZOS)
    nav_ftr.save(DIR / "logo-nav-dark.png")

    # Header tall crop (optional stacked, transparent) from lockup
    full_bb = solid_bbox(lock)
    stacked = lock.crop(full_bb)
    # fit into ~490x330-ish box without changing proportions
    stacked_fit = Image.new("RGBA", (490, 330), (0, 0, 0, 0))
    sw, sh = stacked.size
    sc = min(490 / sw, 330 / sh) * 0.92
    nw, nh = int(sw * sc), int(sh * sc)
    stacked_r = stacked.resize((nw, nh), Image.Resampling.LANCZOS)
    stacked_fit.paste(stacked_r, ((490 - nw) // 2, (330 - nh) // 2), stacked_r)
    stacked_fit.save(DIR / "logo-header.png")

    # Icons / favicons from trademark mark only
    for size, name in [
        (32, "favicon-32.png"),
        (48, "favicon-48.png"),
        (180, "apple-touch-icon.png"),
        (192, "icon-192.png"),
    ]:
        # light bg for apple-touch; transparent for favicon pngs that allow it
        if name == "apple-touch-icon.png":
            base = Image.new("RGBA", (size, size), (255, 255, 255, 255))
            m = fit_square(mark_raw, size, pad_ratio=0.12)
            base.alpha_composite(m)
            base.convert("RGB").save(DIR / name)
        else:
            fit_square(mark_raw, size, pad_ratio=0.1).save(DIR / name)

    # Root favicon.ico (multi-size)
    ico_sizes = []
    for s in (16, 32, 48):
        ico_sizes.append(fit_square(mark_raw, s, pad_ratio=0.1))
    ico_sizes[0].save(
        Path(r"G:/smoltech.ua/favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=ico_sizes[1:],
    )

    # Replace obsolete footer jpg (old logo) with official dark stacked preview
    # Keep file for any legacy refs but make it NEW trademark on black
    dark = Image.new("RGB", (296, 186), (10, 12, 16))
    st = stacked.copy()
    sw, sh = st.size
    sc = min(280 / sw, 170 / sh)
    nw, nh = int(sw * sc), int(sh * sc)
    st = st.resize((nw, nh), Image.Resampling.LANCZOS)
    # composite onto dark
    layer = Image.new("RGBA", dark.size, (0, 0, 0, 0))
    layer.paste(st, ((296 - nw) // 2, (186 - nh) // 2), st)
    Image.alpha_composite(dark.convert("RGBA"), layer).convert("RGB").save(DIR / "logo-footer.jpg", quality=92)

    print("logo-nav", Image.open(DIR / "logo-nav.png").size)
    print("logo-nav-dark", Image.open(DIR / "logo-nav-dark.png").size)
    print("mark", Image.open(DIR / "mark.png").size)
    print("done")


if __name__ == "__main__":
    main()
