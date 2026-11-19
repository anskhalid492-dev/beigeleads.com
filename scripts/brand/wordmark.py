"""Outlines 'BeigeLeads' from the site's own font (Bricolage Grotesque, OFL) so logo SVGs need no font file."""
import io
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

SRC = '/home/claude/beigeleads.com/node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wdth-normal.woff2'

def wordmark(text="BeigeLeads", wght=760, wdth=84, split=5, track=-6):
    """Returns (path_a, path_b, width, ascent, descent, capheight) in font units; split = index where 2nd tone begins."""
    f = TTFont(SRC)
    f = instancer.instantiateVariableFont(f, {"wght": wght, "wdth": wdth})
    f.flavor = None; buf = io.BytesIO(); f.save(buf); data = buf.getvalue()
    face = hb.Face(data); font = hb.Font(face)
    b = hb.Buffer(); b.add_str(text); b.guess_segment_properties()
    hb.shape(font, b, {"kern": True, "liga": False})
    gs = f.getGlyphSet(); order = f.getGlyphOrder()
    x = 0; pa = SVGPathPen(gs); pb = SVGPathPen(gs)
    for i, (info, pos) in enumerate(zip(b.glyph_infos, b.glyph_positions)):
        name = order[info.codepoint]
        pen = pa if info.cluster < split else pb
        gs[name].draw(TransformPen(pen, (1, 0, 0, -1, x + pos.x_offset, 0)))
        x += pos.x_advance + track
    os2 = f['OS/2']
    return pa.getCommands(), pb.getCommands(), x - track, getattr(os2, 'sCapHeight', 700), getattr(os2, 'sxHeight', 500)

if __name__ == "__main__":
    a, b, w, cap, xh = wordmark()
    print(w, cap, xh, len(a), len(b))
