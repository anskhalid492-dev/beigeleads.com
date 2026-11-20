"""Generates the three case-study cover images (1600x900 WebP, no text, BeigeLeads palette). Run: python3 scripts/case-studies/build.py
Needs playwright (chromium) and Pillow. Output: public/case-studies/*.webp"""
import random, math, io, pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image

W, H = 1600, 900
F9, F7, F5, F3 = "#0F2A1D", "#1B4332", "#2D6A4F", "#6FA98A"
S50, S100, S200, S300 = "#FBF8F1", "#F4EEDF", "#E8DEC6", "#D8C9A3"
P6, P1 = "#7C3AED", "#EDE4FD"
OUT = pathlib.Path(__file__).resolve().parents[2] / "public" / "case-studies"

def frame(body, defs=""):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs><radialGradient id="g" cx="75%" cy="30%" r="80%"><stop offset="0" stop-color="{F7}"/><stop offset="1" stop-color="{F9}"/></radialGradient>
<pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="{F5}" stroke-opacity=".18"/></pattern>
<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".35"/></filter>{defs}</defs>
<rect width="{W}" height="{H}" fill="url(#g)"/><rect width="{W}" height="{H}" fill="url(#grid)"/>{body}</svg>'''

def card(x, y, w=330, h=84, hi=False):
    fill = S50
    s = f'<g filter="url(#sh)"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="20" fill="{fill}"/>'
    s += f'<circle cx="{x+44}" cy="{y+h/2}" r="22" fill="{P6 if hi else F5}" fill-opacity="{1 if hi else .85}"/>'
    s += f'<rect x="{x+82}" y="{y+h/2-17}" width="{w*0.5}" height="11" rx="5.5" fill="{F9}" fill-opacity=".85"/>'
    s += f'<rect x="{x+82}" y="{y+h/2+4}" width="{w*0.34}" height="9" rx="4.5" fill="{S300}"/>'
    s += f'<rect x="{x+w-74}" y="{y+h/2-11}" width="50" height="22" rx="11" fill="{P1 if hi else "#D8EADF"}"/></g>'
    return s

def img1():
    r = random.Random(11)
    b = ""
    # wide cloud of unsorted contacts on the left
    for _ in range(330):
        x = r.gauss(300, 170); y = r.gauss(H/2, 230)
        if 40 < x < 640 and 40 < y < H-40:
            b += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r.choice([4,5,6,7])}" fill="{r.choice([S300,S200,F3,F5])}" fill-opacity="{r.uniform(.35,.9):.2f}"/>'
    # funnel
    b += f'<path d="M560 150 C 760 190 820 330 900 390 L900 510 C 820 570 760 710 560 750" fill="none" stroke="{S200}" stroke-opacity=".55" stroke-width="3"/>'
    b += f'<path d="M560 150 C 760 190 820 330 900 390 L900 510 C 820 570 760 710 560 750 Z" fill="{F5}" fill-opacity=".16"/>'
    for i, yy in enumerate([300, 450, 600]):
        b += f'<line x1="{600+i*30}" y1="{yy-80+i*30}" x2="900" y2="450" stroke="{S300}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="6 10"/>'
    # filter chips
    for i, (x, y, w) in enumerate([(640, 100, 150), (700, 770, 120), (610, 40, 90)]):
        b += f'<rect x="{x}" y="{y}" width="{w}" height="38" rx="19" fill="{P1 if i==0 else S100}" fill-opacity=".95"/><circle cx="{x+22}" cy="{y+19}" r="7" fill="{P6 if i==0 else F5}"/><rect x="{x+38}" y="{y+14}" width="{w-62}" height="10" rx="5" fill="{F9}" fill-opacity=".6"/>'
    # outreach-ready list
    for i in range(5):
        b += card(980, 150 + i*118, 420, 92, hi=(i == 1))
    return frame(b)

def img2():
    r = random.Random(5)
    b = ""
    cols, rows, gx, gy = 46, 22, 30, 30
    ox, oy = 110, 120
    def inside_country(c, rr): return ((c-23)/21)**2 + ((rr-11)/10.2)**2 < 1 and not (c > 38 and rr < 6)
    def inside_state(c, rr): return 17 <= c <= 31 and 6 <= rr <= 17 and ((c-24)/8)**2 + ((rr-11.5)/6.2)**2 < 1.1
    cx, cy = 24, 11
    for rr in range(rows):
        for c in range(cols):
            if not inside_country(c, rr): continue
            x, y = ox + c*gx + (gx/2 if rr % 2 else 0), oy + rr*gy
            if (c-cx)**2 + (rr-cy)**2 < 7: col, o, rad = P6, 1, 7
            elif inside_state(c, rr): col, o, rad = S200, .95, 5.5
            else: col, o, rad = F3, .45, 4.5
            b += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rad}" fill="{col}" fill-opacity="{o}"/>'
    px, py = ox + cx*gx, oy + cy*gy
    for k, rad in enumerate([95, 175, 285]):
        b += f'<circle cx="{px}" cy="{py}" r="{rad}" fill="none" stroke="{[P6,S200,F3][k]}" stroke-opacity="{[.8,.55,.4][k]}" stroke-width="2.5" stroke-dasharray="{[0,10,4][k]} {[0,12,12][k]}" />'
    # pins
    for (dx, dy) in [(-70, -55), (60, -85), (95, 30), (-30, 80), (-110, 20)]:
        x, y = px+dx, py+dy
        b += f'<g filter="url(#sh)"><path d="M{x} {y} c-18 -26 -30 -34 -30 -52 a30 30 0 0 1 60 0 c0 18 -12 26 -30 52z" fill="{S50}"/><circle cx="{x}" cy="{y-52}" r="11" fill="{P6}"/></g>'
    b += card(1190, 120, 330, 84) + card(1190, 232, 330, 84, True) + card(1190, 344, 330, 84)
    return frame(b)

def img3():
    r = random.Random(3)
    b = ""
    # org tree on the left
    top = (470, 130)
    tiers = [[(470, 130)], [(250, 300), (470, 300), (690, 300)], [(150, 480), (300, 480), (400, 480), (540, 480), (640, 480), (770, 480)], [(100, 670), (200, 670), (290, 670), (370, 670), (450, 670), (540, 670), (620, 670), (710, 670), (800, 670)]]
    kids = {0: lambda i: [1, 0, 2][i] if False else None}
    def link(a, b_, hi=False):
        return f'<path d="M{a[0]} {a[1]+26} C {a[0]} {(a[1]+b_[1])/2}, {b_[0]} {(a[1]+b_[1])/2}, {b_[0]} {b_[1]-26}" fill="none" stroke="{P6 if hi else S300}" stroke-opacity="{1 if hi else .4}" stroke-width="{4 if hi else 2}"/>'
    for n in tiers[1]: b += link(top, n, n == tiers[1][1])
    for i, n in enumerate(tiers[2]): b += link(tiers[1][min(2, i//2)], n, i == 2)
    for i, n in enumerate(tiers[3]): b += link(tiers[2][min(5, i*6//9)], n)
    for ti, t in enumerate(tiers):
        for i, (x, y) in enumerate(t):
            hi = (ti == 0) or (ti == 1 and i == 1) or (ti == 2 and i == 2)
            rad = [30, 26, 22, 17][ti]
            b += f'<circle cx="{x}" cy="{y}" r="{rad}" fill="{P6 if hi else (S100 if ti<3 else F5)}" fill-opacity="{1 if hi else (.95 if ti<3 else .8)}"/>'
            if ti < 3: b += f'<circle cx="{x}" cy="{y-rad*.2}" r="{rad*.32}" fill="{S50 if hi else F5}"/><path d="M{x-rad*.55} {y+rad*.62} a{rad*.55} {rad*.5} 0 0 1 {rad*1.1} 0z" fill="{S50 if hi else F5}"/>'
    # arrow towards the prioritised list
    b += f'<path d="M870 450 H980" stroke="{S200}" stroke-width="4" stroke-dasharray="3 12" stroke-linecap="round"/><path d="M968 434 L992 450 L968 466" fill="none" stroke="{S200}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
    for i in range(4):
        b += card(1030, 230 + i*112, 400, 88, hi=(i == 0))
        if i == 0: b += f'<rect x="1002" y="{230}" width="10" height="88" rx="5" fill="{P6}"/>'
    # verified ticks
    for i in range(4):
        b += f'<circle cx="1450" cy="{274+i*112}" r="15" fill="#D8EADF"/><path d="M1443 {274+i*112} l5 6 l10 -12" fill="none" stroke="{F7}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'
    return frame(b)

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = {"targeted-agency-prospecting": img1(), "geographic-segmentation": img2(), "focused-sales-prospecting": img3()}
    with sync_playwright() as p:
        br = p.chromium.launch(); pg = br.new_page(viewport={"width": W, "height": H})
        for name, svg in jobs.items():
            pg.set_content(f'<body style="margin:0">{svg}</body>')
            png = pg.screenshot(type="png")
            im = Image.open(io.BytesIO(png)).convert("RGB")
            im.save(OUT / f"{name}.webp", "WEBP", quality=82, method=6)
            print(name, (OUT / f"{name}.webp").stat().st_size)
        br.close()

if __name__ == "__main__": main()
