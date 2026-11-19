"""Renders the OG image and the brand guidelines PDF from the logo SVGs (run after build.py)."""
import os, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]
B = ROOT / "public" / "brand"
FONT = ROOT / "node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wdth-normal.woff2"
css = f"""@font-face{{font-family:BG;src:url('file://{FONT}');font-weight:200 800;font-stretch:75% 100%}}
*{{box-sizing:border-box;margin:0}}body{{font-family:BG,sans-serif;color:#1b4332;background:#fbf8f1}}
.d{{font-stretch:75%;font-weight:800;letter-spacing:-.02em;color:#0f2a1d}}"""
def img(n): return f"file://{B}/svg/beigeleads-{n}.svg"

og = f"""<html><style>{css}body{{width:1200px;height:630px;padding:80px;display:flex;flex-direction:column;justify-content:space-between}}
h1{{font-size:112px;line-height:.95}}p{{font-size:34px;font-weight:500}}</style><body>
<img src="{img('horizontal-light')}" height="84" style="align-self:flex-start">
<div><h1 class="d">Pay once.<br>Own the list.</h1></div><p>B2B data provider &middot; beigeleads.com</p></body></html>"""

sw = [("Forest 900","#0f2a1d","Headings, nav, footer, logo tile"),("Forest 700","#1b4332","Body text"),("Forest 500","#2d6a4f","Secondary accents and icons"),
 ("Forest 300","#8fd0a9","Highlights on dark backgrounds"),("Sand 50","#fbf8f1","Page background"),("Sand 200","#e8dec6","Borders, dividers"),
 ("Purple 600","#7c3aed","Primary action buttons only")]
chips = "".join(f'<div class="sw"><i style="background:{h}"></i><b>{n}</b><span>{h}</span><em>{u}</em></div>' for n,h,u in sw)
bad = [("Do not stretch or squash","transform:scaleX(1.5)"),("Do not rotate","transform:rotate(-12deg)"),("Do not recolor","filter:hue-rotate(200deg) saturate(3)"),("Do not add shadows","filter:drop-shadow(6px 6px 4px rgba(0,0,0,.5))")]
bads = "".join(f'<div class="c"><div class="box"><img src="{img("horizontal-light")}" style="{s};height:44px"></div><p>{t}</p></div>' for t,s in bad)
pdf = f"""<html><style>{css}@page{{size:A4;margin:0}}.p{{width:210mm;height:297mm;padding:18mm;page-break-after:always;position:relative}}
h2{{font-size:40px;margin-bottom:10px}}h3{{font-size:18px;margin:22px 0 8px;color:#0f2a1d}}p,li{{font-size:14px;line-height:1.5}}
.box{{border:1px solid #e8dec6;border-radius:16px;padding:28px;display:flex;align-items:center;justify-content:center;background:#fff}}
.sw{{display:grid;grid-template-columns:60px 120px 90px 1fr;gap:14px;align-items:center;padding:8px 0;border-bottom:1px solid #e8dec6;font-size:13px}}.sw i{{height:36px;border-radius:8px;border:1px solid #e8dec6}}
.g{{display:grid;grid-template-columns:1fr 1fr;gap:14px}}.c p{{margin-top:6px;font-size:12px}}</style><body>
<div class="p" style="background:#0f2a1d;display:flex;flex-direction:column;justify-content:center"><img src="{img('horizontal-dark')}" height="90" style="align-self:flex-start"><h2 style="color:#fbf8f1;margin-top:40px;font-size:30px;font-weight:500;font-stretch:100%">Brand guidelines</h2><p style="color:#d8eadf">Version 1.0 &middot; November 2026</p></div>
<div class="p"><h2 class="d">Logo</h2><p>The BeigeLeads logo is a custom-drawn B in a rounded tile, next to the wordmark. The top-left corner is cut like a card tag, and the counters are a dot above a bar (a lead above its record). Use the supplied files; do not redraw them.</p>
<h3>Primary horizontal logo</h3><div class="box"><img src="{img('horizontal-light')}" height="70"></div>
<div class="g" style="margin-top:14px"><div><h3>Dark background</h3><div class="box" style="background:#0f2a1d"><img src="{img('horizontal-dark')}" height="46"></div></div><div><h3>One colour</h3><div class="box"><img src="{img('horizontal-mono')}" height="46"></div></div>
<div><h3>Stacked</h3><div class="box"><img src="{img('stacked-light')}" height="110"></div></div><div><h3>Symbol</h3><div class="box"><img src="{img('symbol-light')}" height="90"></div></div></div>
<h3>Clear space and minimum size</h3><ul><li>Keep clear space around the logo equal to half the height of the symbol tile.</li><li>Minimum size: horizontal logo 100 px wide on screen; symbol 16 px. Below 32 px use the favicon version of the symbol.</li><li>On photos or busy backgrounds, place the logo on a solid sand or forest area.</li></ul></div>
<div class="p"><h2 class="d">Colour</h2><p>Only the colours of the website are used. Purple is reserved for primary action buttons and is not part of the logo.</p><div style="margin-top:16px">{chips}</div>
<h3>Typography</h3><p>Bricolage Grotesque (variable, SIL Open Font License, free to use). Headlines use the condensed heavy style, body text uses normal width. The wordmark is outlined artwork, so no font is needed to use the logo.</p>
<div class="box" style="margin-top:12px;display:block"><div class="d" style="font-size:44px">Pay once. Own the list.</div><p style="font-size:16px;margin-top:6px">B2B contact lists, delivered as CSV, Excel or TXT.</p></div></div>
<div class="p"><h2 class="d">Using the logo correctly</h2><div class="g" style="margin-top:14px">{bads}</div>
<ul style="margin-top:22px"><li>Do not change the colours, spacing or proportions of the logo, and do not add outlines or effects.</li><li>Do not place the light logo on a dark background; use the dark version.</li><li>Do not imply endorsement or partnership by BeigeLeads without written permission.</li></ul>
<h3>Questions or other formats</h3><p>Need something not in the media kit? Use the contact form at beigeleads.com/contact.</p></div></body></html>"""

with sync_playwright() as p:
    br = p.chromium.launch(); 
    for name, html, kw in (("og", og, None), ("g", pdf, 1)):
        f = pathlib.Path(f"/tmp/_brand_{name}.html"); f.write_text(html)
        pg = br.new_page(viewport={"width": 1200, "height": 630}); pg.goto(f"file://{f}"); pg.wait_for_timeout(600)
        if name == "og":
            (B/"social").mkdir(exist_ok=True); pg.screenshot(path=str(B/"social/beigeleads-og-1200x630.png"))
        else:
            (B/"guidelines").mkdir(exist_ok=True); pg.pdf(path=str(B/"guidelines/beigeleads-brand-guidelines.pdf"), prefer_css_page_size=True, print_background=True)
    br.close()
print("ok")
