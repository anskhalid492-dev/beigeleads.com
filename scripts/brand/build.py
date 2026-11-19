"""Builds the BeigeLeads brand asset package (Concept A) into public/brand.
Run: python3 scripts/brand/build.py   (needs fonttools, uharfbuzz, rsvg-convert, ImageMagick, zip)
Colours are the site's own design tokens. Wordmark is outlined from Bricolage Grotesque (OFL)."""
import os, subprocess, shutil, sys
sys.path.insert(0, os.path.dirname(__file__))
from wordmark import wordmark

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "brand")
T = dict(f9="#0f2a1d", f5="#2d6a4f", f3="#8fd0a9", s50="#fbf8f1", s300="#d8c9a3")

def rrect(x, y, w, h, r):
    return f"M{x+r} {y}H{x+w-r}A{r} {r} 0 0 1 {x+w} {y+r}V{y+h-r}A{r} {r} 0 0 1 {x+w-r} {y+h}H{x+r}A{r} {r} 0 0 1 {x} {y+h-r}V{y+r}A{r} {r} 0 0 1 {x+r} {y}Z"

def circ(cx, cy, r): return f"M{cx-r} {cy}A{r} {r} 0 1 0 {cx+r} {cy}A{r} {r} 0 1 0 {cx-r} {cy}Z"
# v2 (custom B): chamfered top-left corner (a card/tag corner), flat-sided bowls, and counters that are
# a LEAD (dot) above a RECORD (pill): the letter itself reads as one row of a contact list.
B_OUT = "M25 13H36A9.5 9.5 0 0 1 36 32H38A9.5 9.5 0 0 1 38 51H19V19Z"
SLOTS = circ(31.2, 22.5, 3.4) + rrect(28, 38.9, 12, 4.2, 2.1)
B_PATH = f'<path fill-rule="evenodd" d="{B_OUT}{SLOTS}" fill="{{c}}"/>'

def sym(v):
    if v == "light": return f'<rect width="64" height="64" rx="15" fill="{T["f9"]}"/>' + B_PATH.format(c=T["s50"])
    if v == "dark":  return f'<rect width="64" height="64" rx="15" fill="{T["s50"]}"/>' + B_PATH.format(c=T["f9"])
    col = T["f9"] if v == "mono" else T["s50"]   # mono = one ink colour, B knocked out of the tile
    return f'<path fill-rule="evenodd" d="{rrect(0,0,64,64,15)}{B_OUT}{SLOTS}" fill="{col}"/>'

def favicon_inner(full_bleed=False, scale=1.2):
    slots = circ(31.2, 22.5, 4.4) + rrect(27.5, 38.2, 13, 5.6, 2.8)  # heavier counters for 16 px
    bg = f'<rect width="64" height="64" fill="{T["f9"]}"/>' if full_bleed else f'<rect width="64" height="64" rx="14" fill="{T["f9"]}"/>'
    return bg + f'<g transform="translate(32 32) scale({scale}) translate(-32.5 -32)"><path fill-rule="evenodd" d="{B_OUT}{slots}" fill="{T["s50"]}"/></g>'

WA, WB, WW, CAP, _ = wordmark()
S = 30 / CAP; GAP = 15; W = round(WW * S, 2)
COLORS = {"light": (T["f9"], T["f5"]), "dark": (T["s50"], T["f3"]), "mono": (T["f9"], T["f9"]), "mono-white": (T["s50"], T["s50"])}

def svg(inner, w, h, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}"><title>{title}</title>{inner}</svg>'

def text_group(x, base, v):
    a, b = COLORS[v]
    return f'<g transform="translate({x} {base}) scale({S:.5f})"><path d="{WA}" fill="{a}"/><path d="{WB}" fill="{b}"/></g>'

def sv(v): return "light" if v == "light" else "dark" if v == "dark" else v
def symbol(v): return svg(sym(v), 64, 64, "BeigeLeads symbol")
def horizontal(v): return svg(sym(v) + text_group(64 + GAP, 47, v), round(64 + GAP + W, 2), 64, "BeigeLeads")
def stacked(v):
    w = max(64, W); h = 64 + 14 + 30 + 9  # +9 = descender of the g
    return svg(f'<g transform="translate({(w-64)/2:.2f} 0)">{sym(v)}</g>' + text_group(round((w - W) / 2, 2), 64 + 14 + 30, v), round(w, 2), h, "BeigeLeads")

def w(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True); open(path, "w").write(text)
def png(src, dst, width=None, height=None):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    a = ["rsvg-convert", src, "-o", dst]
    if width: a += ["-w", str(width)]
    if height: a += ["-h", str(height)]
    subprocess.run(a, check=True)

if os.path.isdir(OUT): shutil.rmtree(OUT)
VARS = ["light", "dark", "mono", "mono-white"]
for v in VARS:
    for kind, fn, pw in (("horizontal", horizontal, 1600), ("stacked", stacked, 1000), ("symbol", symbol, 1024)):
        s = f"{OUT}/svg/beigeleads-{kind}-{v}.svg"; w(s, fn(v))
        png(s, f"{OUT}/png/beigeleads-{kind}-{v}.png", width=pw)   # PNG backgrounds are transparent

# compact navigation logo (same artwork, intended for 32 px header height)
w(f"{OUT}/svg/beigeleads-nav-compact.svg", horizontal("light"))
png(f"{OUT}/svg/beigeleads-nav-compact.svg", f"{OUT}/png/beigeleads-nav-compact.png", height=96)

# favicons
fav = svg(favicon_inner(), 64, 64, "BeigeLeads favicon"); w(f"{OUT}/favicon/favicon.svg", fav)
for n in (16, 32, 48): png(f"{OUT}/favicon/favicon.svg", f"{OUT}/favicon/favicon-{n}.png", width=n)
subprocess.run(["convert", *(f"{OUT}/favicon/favicon-{n}.png" for n in (16, 32, 48)), f"{OUT}/favicon/favicon.ico"], check=True)
w(f"{OUT}/favicon/_fb.svg", svg(favicon_inner(True, 1.0), 64, 64, "BeigeLeads"))  # full-bleed for OS icons
png(f"{OUT}/favicon/_fb.svg", f"{OUT}/favicon/apple-touch-icon.png", width=180)
png(f"{OUT}/favicon/_fb.svg", f"{OUT}/favicon/android-chrome-192x192.png", width=192)
png(f"{OUT}/favicon/_fb.svg", f"{OUT}/favicon/android-chrome-512x512.png", width=512)
os.remove(f"{OUT}/favicon/_fb.svg")

# social profile icon: full-bleed square, symbol sits inside the circular crop used by most networks
w(f"{OUT}/social/_p.svg", svg(favicon_inner(True, 0.95), 64, 64, "BeigeLeads"))
png(f"{OUT}/social/_p.svg", f"{OUT}/social/beigeleads-profile-400.png", width=400)
png(f"{OUT}/social/_p.svg", f"{OUT}/social/beigeleads-profile-1024.png", width=1024)
os.remove(f"{OUT}/social/_p.svg")

# email signature logo (2x of 200x~50 display size), transparent
png(f"{OUT}/svg/beigeleads-horizontal-light.svg", f"{OUT}/email/beigeleads-email-signature.png", width=480)
print("wordmark width", W)
