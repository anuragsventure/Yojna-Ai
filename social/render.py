#!/usr/bin/env python3
"""Srjan social slide renderer.

Draws each painting on a gallery wall inside a wooden or gilt frame, at 1080 x 1350 (Instagram 4:5).

  python3 social/render.py --calendar social/calendar/3-day.json --out social/out --sample
      Uses placeholder pictures, for checking the layout when there is no internet.

  python3 social/render.py --calendar social/calendar/3-day.json --out social/out
      Downloads each painting from Wikipedia / Wikimedia Commons and renders the real slides.

Nothing in this file posts to Instagram.
"""
import argparse, io, json, math, os, textwrap, urllib.parse, urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1080, 1350
WALL = (241, 237, 229)
INK = (28, 25, 21)
MUTED = (108, 101, 90)
BRASS = (125, 95, 32)
GOLD = (232, 200, 120)
DARK = (21, 18, 14)

FRAMES = {   # top, left, right, bottom (mitred sides catch the light differently)
    "oak":    [(220, 186, 130), (201, 160, 102), (163, 123, 70), (137, 101, 50)],
    "walnut": [(122, 85, 58), (102, 69, 48), (67, 42, 27), (50, 30, 18)],
    "black":  [(70, 65, 59), (55, 51, 46), (23, 21, 18), (12, 11, 9)],
    "gilt":   [(241, 217, 143), (220, 185, 100), (160, 122, 38), (128, 96, 27)],
}
MATS = {"gilt": (241, 232, 210)}
DEFAULT_MAT = (247, 243, 234)

# ---------- fonts ----------
HERE = os.path.dirname(os.path.abspath(__file__))
FONT_DIRS = [os.path.join(HERE, "fonts"), "/usr/share/fonts/truetype/liberation", "/usr/share/fonts/truetype/dejavu"]
CANDIDATES = {
    "serif": ["CormorantGaramond-SemiBold.ttf", "LiberationSerif-Regular.ttf", "DejaVuSerif.ttf"],
    "serif_bold": ["CormorantGaramond-Bold.ttf", "LiberationSerif-Bold.ttf", "DejaVuSerif-Bold.ttf"],
    "serif_italic": ["CormorantGaramond-MediumItalic.ttf", "LiberationSerif-Italic.ttf", "DejaVuSerif-Italic.ttf"],
    "sans": ["Jost-Medium.ttf", "LiberationSans-Regular.ttf", "DejaVuSans.ttf"],
}
def font(kind, size):
    for d in FONT_DIRS:
        for name in CANDIDATES[kind]:
            p = os.path.join(d, name)
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
    return ImageFont.load_default()

# ---------- text ----------
def text_w(draw, s, f, track=0):
    return sum(draw.textlength(c, font=f) + track for c in s) - track if track else draw.textlength(s, font=f)

def draw_text(draw, xy, s, f, fill, track=0, anchor="l"):
    x, y = xy
    w = text_w(draw, s, f, track)
    if anchor == "m": x -= w / 2
    if track:
        for c in s:
            draw.text((x, y), c, font=f, fill=fill); x += draw.textlength(c, font=f) + track
    else:
        draw.text((x, y), s, font=f, fill=fill)
    return w

def wrap(draw, s, f, max_w):
    out = []
    for para in s.split("\n"):
        if not para.strip(): out.append(""); continue
        line = ""
        for word in para.split():
            t = (line + " " + word).strip()
            if draw.textlength(t, font=f) <= max_w: line = t
            else: out.append(line); line = word
        out.append(line)
    return out

def paragraph(draw, cx, y, s, f, fill, max_w, lead=1.35, anchor="m"):
    for line in wrap(draw, s, f, max_w):
        if line: draw_text(draw, (cx, y), line, f, fill, anchor=anchor)
        y += int(f.size * lead)
    return y

# ---------- wall ----------
def wall(light=True):
    rng = np.random.default_rng(7)
    a = np.zeros((H, W, 3), np.float32) + np.array(WALL, np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - W / 2) / (W * .75)) ** 2 + ((yy - H * .45) / (H * .75)) ** 2)
    a *= (1 - .10 * np.clip(d, 0, 1.2) ** 2)[..., None]                       # vignette
    if light:
        cone = np.exp(-(((xx - W / 2) / (W * .38)) ** 2 + ((yy - 60) / (H * .55)) ** 2))
        a += 16 * cone[..., None]                                              # soft picture-light glow
    a += rng.normal(0, 2.4, (H, W, 1)).astype(np.float32)                      # plaster grain
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGB").convert("RGBA")

# ---------- the frame ----------
def build_frame(art, style, max_w, max_h):
    """Frame hugs the painting: opening is the painting's own size, then mat, then mitred moulding."""
    aw, ah = art.size
    k = min(max_w / aw, max_h / ah)
    for _ in range(40):                            # shrink until painting + mat + moulding fit the box
        w, h = max(1, int(aw * k)), max(1, int(ah * k)); longest = max(w, h)
        m = int(np.clip(longest * .055, 20, 50))   # mat
        f = int(np.clip(longest * .060, 26, 56))   # moulding
        if w + 2 * (m + f) <= max_w and h + 2 * (m + f) <= max_h: break
        k *= .97
    art = art.resize((w, h), Image.LANCZOS).convert("RGB")
    FW, FH = w + 2 * (m + f), h + 2 * (m + f)
    pad = 70
    canvas = Image.new("RGBA", (FW + pad * 2, FH + pad * 2), (0, 0, 0, 0))
    # soft contact and drop shadow
    sh = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(sh).rectangle((pad + 6, pad + 30, pad + FW - 6, pad + FH + 24), fill=150)
    sh = sh.filter(ImageFilter.GaussianBlur(26))
    canvas.paste(Image.new("RGBA", canvas.size, (40, 28, 12, 255)), (0, 0), sh)
    sh2 = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(sh2).rectangle((pad, pad + 6, pad + FW, pad + FH + 6), fill=110)
    canvas.paste(Image.new("RGBA", canvas.size, (30, 20, 8, 255)), (0, 0), sh2.filter(ImageFilter.GaussianBlur(5)))

    # moulding: colour by nearest side (mitred corners) and a rounded profile across its width
    pal = np.array(FRAMES[style], np.float32)
    yy, xx = np.mgrid[0:FH, 0:FW].astype(np.float32)
    dist = np.stack([yy, xx, FW - 1 - xx, FH - 1 - yy])        # top, left, right, bottom
    side = dist.argmin(0)
    t = np.clip(dist.min(0) / f, 0, 1)
    amp = .11 if style == "gilt" else .20
    shade = 1 + amp * np.sin(np.pi * t) - .16 * (t < .05) - .12 * (t > .94) + .06 * (t > .80) * (t <= .94)
    col = pal[side] * shade[..., None]
    rng = np.random.default_rng(3)
    col *= (1 + rng.normal(0, .022, (FH, FW, 1)))              # wood grain speckle
    streak = rng.normal(0, .03, (1, FW, 1)) if style != "gilt" else 0
    col[: , :, :] *= 1 + (streak if np.isscalar(streak) is False else 0)
    frame = Image.fromarray(np.clip(col, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    mat_col = MATS.get(style, DEFAULT_MAT)
    d = ImageDraw.Draw(frame)
    d.rectangle((f, f, FW - f - 1, FH - f - 1), fill=mat_col + (255,))
    # bevel of the mat opening and the shadow cast by the frame onto the mat
    inner = Image.new("L", (FW, FH), 0)
    ImageDraw.Draw(inner).rectangle((f, f, FW - f - 1, FH - f - 1), fill=255)
    ImageDraw.Draw(inner).rectangle((f + 10, f + 10, FW - f - 11, FH - f - 11), fill=0)
    frame.paste(Image.new("RGBA", (FW, FH), (60, 45, 25, 255)), (0, 0), inner.filter(ImageFilter.GaussianBlur(8)).point(lambda v: int(v * .35)))
    ox, oy = f + m, f + m
    d.rectangle((ox - 3, oy - 3, ox + w + 2, oy + h + 2), fill=(255, 255, 255, 255))   # white bevel edge
    d.rectangle((ox - 5, oy - 5, ox + w + 4, oy + h + 4), outline=(150, 140, 120, 255))
    frame.paste(art, (ox, oy))
    # a little shade falling across the top of the painting, as under a picture light
    g = Image.new("L", (w, h), 0)
    ImageDraw.Draw(g).rectangle((0, 0, w, min(36, h // 8)), fill=70)
    frame.paste(Image.new("RGBA", (w, h), (0, 0, 0, 255)), (ox, oy), g.filter(ImageFilter.GaussianBlur(16)))
    canvas.alpha_composite(frame, (pad, pad))
    return canvas, pad

def place_framed(base, art, style, box):
    """Centre a framed painting inside box = (x, y, w, h). Returns bottom y of the frame."""
    x, y, bw, bh = box
    img, pad = build_frame(art, style, bw - 150, bh - 30)
    fw, fh = img.size[0] - pad * 2, img.size[1] - pad * 2
    px, py = x + (bw - fw) // 2 - pad, y + (bh - fh) // 2 - pad
    base.alpha_composite(img, (px, py))
    return py + pad + fh, px + pad, fw

# ---------- placeholder art for layout checks ----------
def placeholder(aspect, label, seed):
    h = 1000; w = int(h * aspect)
    rng = np.random.default_rng(abs(hash(label)) % 10_000 + seed)
    c1 = rng.integers(60, 150, 3); c2 = rng.integers(20, 90, 3)
    t = np.linspace(0, 1, w)[None, :, None] * .6 + np.linspace(0, 1, h)[:, None, None] * .4
    arr = (c1 * (1 - t) + c2 * t).astype(np.uint8)
    im = Image.fromarray(arr, "RGB"); d = ImageDraw.Draw(im)
    r = min(w, h) // 4; cx, cy = w // 2, h // 2
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=tuple(int(v) for v in (c1 * .5 + 140)))
    f = font("sans", 26)
    d.text((w // 2, h - 60), "PLACEHOLDER: real painting loads at publish time", font=f, fill=(235, 225, 200), anchor="mm")
    return im

# ---------- real images ----------
def http(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Srjan/1.0 (art education project)"})
    return urllib.request.urlopen(req, timeout=30).read()

def fetch_art(art):
    """Wikipedia article image first, Commons search as a fallback."""
    try:
        d = json.loads(http("https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(art["wiki"])))
        src = (d.get("originalimage") or d.get("thumbnail"))["source"]
        thumb = d["thumbnail"]["source"]
        if "/thumb/" in thumb:
            import re
            src = re.sub(r"/\d+px-", "/1280px-", thumb)
        return Image.open(io.BytesIO(http(src))).convert("RGB")
    except Exception:
        q = urllib.parse.quote(art["search"] + " filetype:bitmap")
        d = json.loads(http("https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1280&gsrsearch=" + q))
        for pg in sorted(d["query"]["pages"].values(), key=lambda p: p["index"]):
            ii = pg["imageinfo"][0]
            if ii["mime"].startswith("image/") and ii["width"] >= 600:
                return Image.open(io.BytesIO(http(ii["thumburl"]))).convert("RGB")
    raise RuntimeError("no image for " + art["title"])

# ---------- slide types ----------
def brand(im, y=H - 100):
    m = Image.open(os.path.join(HERE, "assets", "mark-dark-ink.png")).convert("RGBA")
    k = 150 / m.width; m = m.resize((150, int(m.height * k)), Image.LANCZOS)
    im.alpha_composite(m, ((W - m.width) // 2, y))

def label(draw, cx, y, art, width=640):
    f1, f2 = font("serif_bold", 38), font("sans", 22)
    lines = wrap(draw, art["title"], f1, width - 60)
    hgt = 24 + len(lines) * 46 + 40
    draw.rectangle((cx - width // 2, y, cx + width // 2, y + hgt), fill=(251, 249, 244), outline=(214, 208, 196))
    yy = y + 18
    for ln in lines:
        draw_text(draw, (cx, yy), ln, f1, INK, anchor="m"); yy += 46
    draw_text(draw, (cx, yy + 4), f"{art['artist'].upper()}   {art['year']}", f2, MUTED, track=3, anchor="m")
    return y + hgt

def get_art(art, sample, i):
    return placeholder(art.get("aspect", .8), art["title"], i) if sample else fetch_art(art)

def slide_cover(s, sample, i):
    im = wall(); d = ImageDraw.Draw(im)
    draw_text(d, (W / 2, 78), s["eyebrow"].upper(), font("sans", 24), BRASS, track=8, anchor="m")
    y = paragraph(d, W / 2, 130, s["title"], font("serif_bold", 96), INK, W - 140, lead=1.05)
    draw_text(d, (W / 2, y + 6), s["subtitle"], font("serif_italic", 42), MUTED, anchor="m")
    top = y + 96
    bottom, _, _ = place_framed(im, get_art(s["art"], sample, i), s["art"]["frame"], (0, top, W, H - top - 120))
    d = ImageDraw.Draw(im); brand(im)
    return im

def slide_work(s, sample, i):
    im = wall(); d = ImageDraw.Draw(im)
    bottom, cx, fw = place_framed(im, get_art(s["art"], sample, i), s["art"]["frame"], (0, 40, W, 800))
    d = ImageDraw.Draw(im)
    y = label(d, W // 2, min(bottom + 26, 900), s["art"])
    paragraph(d, W / 2, y + 34, s["note"], font("serif_italic", 36), INK, 820, lead=1.3)
    brand(im)
    return im

def slide_single(s, sample, i):
    im = wall(); d = ImageDraw.Draw(im)
    draw_text(d, (W / 2, 70), s["eyebrow"].upper(), font("sans", 24), BRASS, track=8, anchor="m")
    bottom, _, _ = place_framed(im, get_art(s["art"], sample, i), s["art"]["frame"], (0, 110, W, 900))
    d = ImageDraw.Draw(im)
    y = label(d, W // 2, min(bottom + 22, 1040), s["art"], width=700)
    draw_text(d, (W / 2, y + 26), s["note"], font("serif_italic", 32), MUTED, anchor="m")
    brand(im)
    return im

def slide_text(s, sample, i):
    im = wall(); d = ImageDraw.Draw(im)
    d.rectangle((110, 250, W - 110, 1060), fill=(251, 249, 244), outline=(214, 208, 196), width=2)
    draw_text(d, (W / 2, 330), s["heading"].upper(), font("sans", 28), BRASS, track=9, anchor="m")
    d.line((W / 2 - 60, 392, W / 2 + 60, 392), fill=(184, 147, 63), width=2)
    paragraph(d, W / 2, 440, s["body"], font("serif", 46), INK, W - 330, lead=1.4)
    brand(im)
    return im

def slide_close(s, sample, i):
    im = Image.new("RGBA", (W, H), DARK); d = ImageDraw.Draw(im)
    d.rectangle((60, 60, W - 60, H - 60), outline=(138, 106, 37), width=2)
    d.rectangle((76, 76, W - 76, H - 76), outline=(138, 106, 37), width=1)
    lg = Image.open(os.path.join(HERE, "assets", "logo-light-ink.png")).convert("RGBA")
    k = 560 / lg.width; lg = lg.resize((560, int(lg.height * k)), Image.LANCZOS)
    im.alpha_composite(lg, ((W - lg.width) // 2, 330))
    draw_text(d, (W / 2, 820), "The act of creation", font("serif_italic", 52), (239, 230, 210), anchor="m")
    draw_text(d, (W / 2, 930), "SAVE THIS POST", font("sans", 28), GOLD, track=9, anchor="m")
    draw_text(d, (W / 2, 980), "FOLLOW @SRJAN.CO", font("sans", 28), GOLD, track=9, anchor="m")
    return im

KINDS = {"cover": slide_cover, "work": slide_work, "single": slide_single, "text": slide_text, "close": slide_close}

def contact_sheet(paths, out, thumb_w=360):
    ims = [Image.open(p).convert("RGB") for p in paths]
    th = int(thumb_w * H / W); gap = 18
    sheet = Image.new("RGB", (len(ims) * thumb_w + (len(ims) + 1) * gap, th + gap * 2), (214, 208, 196))
    for i, im in enumerate(ims):
        sheet.paste(im.resize((thumb_w, th), Image.LANCZOS), (gap + i * (thumb_w + gap), gap))
    sheet.save(out, quality=88)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--calendar", required=True); ap.add_argument("--out", required=True)
    ap.add_argument("--sample", action="store_true", help="use placeholder pictures (no internet needed)")
    a = ap.parse_args()
    cal = json.load(open(a.calendar, encoding="utf-8")); os.makedirs(a.out, exist_ok=True)
    for post in cal["posts"]:
        paths = []
        for i, s in enumerate(post["slides"], 1):
            im = KINDS[s["kind"]](s, a.sample, i).convert("RGB")
            p = os.path.join(a.out, f"day{post['day']:02d}-slide{i:02d}.jpg"); im.save(p, quality=93); paths.append(p)
            print("wrote", p)
        contact_sheet(paths, os.path.join(a.out, f"day{post['day']:02d}-overview.jpg"))

if __name__ == "__main__":
    main()
