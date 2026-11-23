"""Builds one 1600x900 WebP featured image per published benchmark, each with the official BeigeLeads symbol
(path copied from public/brand/svg/beigeleads-symbol-light.svg) beside a text-free illustration of the topic.
No numbers, no data: the shapes are decorative. Palette tokens only.
Run: python3 scripts/benchmarks/build.py   (needs playwright + chromium and Pillow)   Output: public/benchmark-images/*.webp"""
import io, math, pathlib, random
from playwright.sync_api import sync_playwright
from PIL import Image

W, H = 1600, 900
F9, F7, F5, F3 = "#0F2A1D", "#1B4332", "#2D6A4F", "#6FA98A"
S50, S100, S200, S300 = "#FBF8F1", "#F4EEDF", "#E8DEC6", "#D8C9A3"
P6, P1, G1 = "#7C3AED", "#EDE4FD", "#D8EADF"
ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "benchmark-images"
SYMBOL_PATH = "M25 13H36A9.5 9.5 0 0 1 36 32H38A9.5 9.5 0 0 1 38 51H19V19ZM27.8 22.5A3.4 3.4 0 1 0 34.6 22.5A3.4 3.4 0 1 0 27.8 22.5ZM30.1 38.9H37.9A2.1 2.1 0 0 1 40 41.0V41.0A2.1 2.1 0 0 1 37.9 43.1H30.1A2.1 2.1 0 0 1 28 41.0V41.0A2.1 2.1 0 0 1 30.1 38.9Z"

def symbol(x, y, size):
    s = size / 64
    return (f'<g filter="url(#big)"><g transform="translate({x} {y}) scale({s})"><rect width="64" height="64" rx="15" fill="{F9}"/>'
            f'<path fill-rule="evenodd" d="{SYMBOL_PATH}" fill="{S50}"/></g></g>')

def frame(body):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{S100}"/><stop offset="1" stop-color="{S200}"/></linearGradient>
<pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="{S300}" stroke-opacity=".35"/></pattern>
<filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="{F9}" flood-opacity=".16"/></filter>
<filter id="big" filterUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900"><feDropShadow dx="0" dy="26" stdDeviation="26" flood-color="{F9}" flood-opacity=".38"/></filter></defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/><rect width="{W}" height="{H}" fill="url(#grid)"/>
<circle cx="360" cy="450" r="330" fill="{S50}" fill-opacity=".7"/><circle cx="360" cy="450" r="250" fill="none" stroke="{S300}" stroke-width="2" stroke-dasharray="3 12" stroke-linecap="round"/>
{symbol(190, 280, 340)}{body}</svg>'''

def envelope(x, y, w=150, fill=S50, flap=F5, shadow=True):
    h = w * .68
    f = ' filter="url(#sh)"' if shadow else ""
    return (f'<g{f}><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="{fill}" stroke="{S300}" stroke-width="2"/>'
            f'<path d="M{x+8} {y+12} L{x+w/2} {y+h*.58} L{x+w-8} {y+12}" fill="none" stroke="{flap}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>')

def bubble(x, y, w, h, fill=S50, tail="l", dots=F5):
    t = f'<path d="M{x+30} {y+h-4} l-14 26 l38 -22z" fill="{fill}"/>' if tail == "l" else f'<path d="M{x+w-30} {y+h-4} l14 26 l-38 -22z" fill="{fill}"/>'
    lines = f'<rect x="{x+28}" y="{y+h/2-14}" width="{w*.55}" height="11" rx="5.5" fill="{dots}" fill-opacity=".85"/><rect x="{x+28}" y="{y+h/2+6}" width="{w*.35}" height="9" rx="4.5" fill="{dots}" fill-opacity=".4"/>'
    return f'<g filter="url(#sh)"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="26" fill="{fill}"/>{t}</g>{lines}'

def check(cx, cy, r=24, bg=G1, fg=F7):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{bg}"/><path d="M{cx-r*.42} {cy+r*.02} l{r*.28} {r*.32} l{r*.6} {-r*.68}" fill="none" stroke="{fg}" stroke-width="{r*.17}" stroke-linecap="round" stroke-linejoin="round"/>'

def cross(cx, cy, r=24, bg="#F1DDD8", fg="#8A3B2B"):
    d = r * .34
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{bg}"/><path d="M{cx-d} {cy-d} L{cx+d} {cy+d} M{cx+d} {cy-d} L{cx-d} {cy+d}" stroke="{fg}" stroke-width="{r*.17}" stroke-linecap="round"/>'

def arrow(x1, y1, x2, y2, col=F5, w=4, dash="2 12"):
    a = math.atan2(y2 - y1, x2 - x1); L = 18
    p1 = (x2 - L * math.cos(a - .5), y2 - L * math.sin(a - .5)); p2 = (x2 - L * math.cos(a + .5), y2 - L * math.sin(a + .5))
    return (f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{col}" stroke-width="{w}" stroke-dasharray="{dash}" stroke-linecap="round"/>'
            f'<path d="M{p1[0]:.0f} {p1[1]:.0f} L{x2} {y2} L{p2[0]:.0f} {p2[1]:.0f}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>')

def response():
    b = envelope(700, 120, 170) + envelope(930, 90, 150) + envelope(1150, 140, 160)
    b += arrow(790, 250, 790, 320, F5) + arrow(1000, 215, 1000, 320, F5) + arrow(1230, 280, 1230, 330, F5)
    b += bubble(760, 380, 330, 120, S50, "l") + bubble(1130, 440, 330, 120, P1, "r", P6) + bubble(740, 600, 300, 112, S50, "l", F5) + bubble(1100, 650, 360, 124, S50, "r")
    return b

def followups():
    b = ""
    xs = [720, 960, 1200, 1440]; ys = [210, 330, 450, 570]
    for i, (x, y) in enumerate(zip(xs, ys)):
        w = [210, 180, 160, 140][i]
        b += envelope(x - w / 2, y, w, S50 if i else P1, F5 if i else P6)
        if i: b += arrow(xs[i-1] + 30, ys[i-1] + 110, x - 60, y + 30, S300, 4, "2 12")
    b += check(1440, 760, 32)
    b += bubble(720, 640, 300, 112, P1, "l", P6)
    return b

def deliverability():
    b = ""
    b += f'<g filter="url(#sh)"><path d="M700 500 h340 l50 90 h120 v150 a30 30 0 0 1 -30 30 h-450 a30 30 0 0 1 -30 -30 v-210 a30 30 0 0 1 30 -30z" fill="{S50}"/></g>'
    b += f'<rect x="745" y="560" width="290" height="14" rx="7" fill="{F5}" fill-opacity=".6"/><rect x="745" y="600" width="210" height="14" rx="7" fill="{F5}" fill-opacity=".35"/>'
    b += envelope(770, 330, 170, P1, P6) + arrow(855, 480, 855, 535, P6)
    b += f'<g filter="url(#sh)"><rect x="1190" y="500" width="270" height="270" rx="30" fill="{S50}"/></g><rect x="1190" y="500" width="270" height="270" rx="30" fill="none" stroke="{S300}" stroke-width="3" stroke-dasharray="8 12"/>'
    b += envelope(1235, 590, 150, S100, S300, False) + cross(1415, 560, 26)
    b += f'<rect x="1170" y="150" width="290" height="270" rx="30" fill="none" stroke="{S300}" stroke-width="3" stroke-dasharray="3 14" stroke-linecap="round"/>' + envelope(1250, 240, 130, S100, S300, False)
    b += check(1000, 440, 30)
    return b

def country():
    rnd = random.Random(7); b = ""
    gx = 34
    def blob(cx, cy, rx, ry, col, o, seed):
        r = random.Random(seed); s = ""
        for yy in range(int(cy - ry), int(cy + ry), gx):
            for xx in range(int(cx - rx), int(cx + rx), gx):
                off = gx / 2 if ((yy - int(cy - ry)) // gx) % 2 else 0
                px = xx + off
                if ((px - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 < 1 + r.uniform(-.18, .1):
                    s += f'<circle cx="{px:.0f}" cy="{yy}" r="{r.choice([6,7,8,9])}" fill="{col}" fill-opacity="{o}"/>'
        return s
    b += blob(820, 330, 150, 170, F5, .85, 1) + blob(1030, 250, 110, 120, P6, .95, 2) + blob(1230, 300, 190, 150, F3, .75, 3)
    b += blob(900, 640, 130, 170, F3, .55, 4) + blob(1180, 640, 110, 120, F5, .5, 5) + blob(1400, 640, 90, 90, S300, .9, 6)
    b += f'<g filter="url(#sh)"><path d="M1030 340 c-20 -32 -34 -42 -34 -64 a34 34 0 0 1 68 0 c0 22 -14 32 -34 64z" fill="{S50}"/><circle cx="1030" cy="276" r="12" fill="{P6}"/></g>'
    return b

def industry():
    b = ""
    labels = [(1, 10, 560), (2, 8, 430), (3, 6, 340), (4, 5, 250), (5, 3, 190)]
    y0 = 170
    for i, w in enumerate([660, 540, 470, 380, 290, 210]):
        y = y0 + i * 112
        b += f'<g filter="url(#sh)"><rect x="700" y="{y}" width="{w+130}" height="76" rx="38" fill="{S50}"/></g>'
        b += f'<circle cx="740" cy="{y+38}" r="26" fill="{P6 if i == 0 else F5}" fill-opacity="{1 if i == 0 else .9}"/>'
        b += f'<rect x="790" y="{y+28}" width="{w-60}" height="20" rx="10" fill="{P6 if i == 0 else F5}" fill-opacity="{.9 if i == 0 else .55}"/>'
        b += f'<circle cx="{700+w+90}" cy="{y+38}" r="16" fill="{P1 if i == 0 else G1}"/>'
    return b

def decay():
    b = ""; cols, rows = 14, 7; gx, gy = 62, 78
    r = random.Random(9)
    for rr in range(rows):
        for c in range(cols):
            x = 690 + c * gx; y = 190 + rr * gy
            p = c / (cols - 1)
            if r.random() < p * .95:
                b += f'<circle cx="{x}" cy="{y}" r="18" fill="none" stroke="{S300}" stroke-width="3" stroke-dasharray="4 7"/>'
            else:
                b += f'<circle cx="{x}" cy="{y}" r="{[19,20,21][c%3]}" fill="{F5 if c < 9 else F3}" fill-opacity="{1 - p * .55:.2f}"/>'
    b += arrow(700, 790, 1500, 790, F7, 4, "2 14")
    return b

def verification():
    b = ""
    rows = [(1, "ok"), (2, "ok"), (3, "bad"), (4, "ok"), (5, "ok"), (6, "bad")]
    for i, (_, kind) in enumerate(rows):
        y = 140 + i * 118
        ok = kind == "ok"
        b += f'<g filter="url(#sh)"><rect x="700" y="{y}" width="760" height="92" rx="26" fill="{S50}"/></g>'
        b += f'<circle cx="758" cy="{y+46}" r="26" fill="{F5}" fill-opacity=".85"/><rect x="810" y="{y+26}" width="{300 + (i*53) % 160}" height="16" rx="8" fill="{F9}" fill-opacity=".8"/><rect x="810" y="{y+54}" width="{190 + (i*37) % 120}" height="12" rx="6" fill="{S300}"/>'
        b += (check(1400, y + 46, 28) if ok else cross(1400, y + 46, 28))
    b += f'<rect x="680" y="{140+118*2-10}" width="800" height="112" rx="32" fill="none" stroke="{P6}" stroke-width="3" stroke-dasharray="3 10" stroke-linecap="round"/>'
    return b

def cycle():
    b = ""
    pts = [(730, 640), (900, 520), (1050, 590), (1190, 430), (1330, 330), (1460, 220)]
    d = "M" + " L".join(f"{x} {y}" for x, y in pts)
    b += f'<path d="{d}" fill="none" stroke="{S300}" stroke-width="5" stroke-dasharray="3 14" stroke-linecap="round" stroke-linejoin="round"/>'
    for i, (x, y) in enumerate(pts):
        last = i == len(pts) - 1
        b += f'<g filter="url(#sh)"><circle cx="{x}" cy="{y}" r="{[34,34,34,34,34,46][i]}" fill="{S50}"/></g><circle cx="{x}" cy="{y}" r="{[16,16,16,16,16,22][i]}" fill="{P6 if last else F5}"/>'
    for i, w in enumerate([210, 170, 250]):
        x = [720, 1010, 1290][i]; y = [740, 700, 560][i]
        b += f'<rect x="{x}" y="{y}" width="{w}" height="40" rx="20" fill="{P1 if i == 2 else S50}" stroke="{S300}" stroke-width="2"/><rect x="{x+22}" y="{y+14}" width="{w-44}" height="12" rx="6" fill="{P6 if i == 2 else F5}" fill-opacity=".6"/>'
    return b

JOBS = {"cold-email-response-rate": response, "cold-email-follow-ups": followups, "b2b-email-deliverability": deliverability,
        "b2b-email-by-country": country, "b2b-outreach-by-industry": industry, "b2b-data-decay": decay,
        "email-verification": verification, "b2b-sales-cycle": cycle}

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        br = p.chromium.launch(); pg = br.new_page(viewport={"width": W, "height": H})
        for name, fn in JOBS.items():
            pg.set_content(f'<body style="margin:0">{frame(fn())}</body>')
            im = Image.open(io.BytesIO(pg.screenshot(type="png"))).convert("RGB")
            im.save(OUT / f"{name}.webp", "WEBP", quality=84, method=6)
            print(name, (OUT / f"{name}.webp").stat().st_size)
        br.close()

if __name__ == "__main__": main()
