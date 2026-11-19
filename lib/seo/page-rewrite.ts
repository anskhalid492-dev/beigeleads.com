/** Pure HTML head rewriting for admin page-SEO overrides. No database, safe to import in the Worker entry. */
export type PageOverride = { t: string; d: string; ot: string; od: string; oi: string; c: string };
export type PageOverrideMap = Record<string, PageOverride>;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const metaRe = (attr: "name" | "property", key: string) => new RegExp(`<meta\\b[^>]*\\b${attr}=("|')${key}\\1[^>]*>`, "gi");

/** Replaces matching tags, or inserts the tag before </head> when the page had none. Only non-empty fields are touched. */
export function applyPageSeo(html: string, o: PageOverride, origin: string): string {
  if (!/<\/head>/i.test(html)) return html;
  let out = html;
  const insert: string[] = [];
  const setTag = (re: RegExp, tag: string) => { if (re.test(out)) { re.lastIndex = 0; out = out.replace(re, tag); } else insert.push(tag); re.lastIndex = 0; };
  const ogT = o.ot || o.t, ogD = o.od || o.d;
  if (o.t) {
    const re = /<title[^>]*>[\s\S]*?<\/title>/gi;
    setTag(re, `<title>${esc(o.t)}</title>`);
  }
  if (o.d) setTag(metaRe("name", "description"), `<meta name="description" content="${esc(o.d)}"/>`);
  if (ogT) { setTag(metaRe("property", "og:title"), `<meta property="og:title" content="${esc(ogT)}"/>`); setTag(metaRe("name", "twitter:title"), `<meta name="twitter:title" content="${esc(ogT)}"/>`); }
  if (ogD) { setTag(metaRe("property", "og:description"), `<meta property="og:description" content="${esc(ogD)}"/>`); setTag(metaRe("name", "twitter:description"), `<meta name="twitter:description" content="${esc(ogD)}"/>`); }
  if (o.oi) {
    const img = o.oi.startsWith("/") ? origin + o.oi : o.oi;
    setTag(metaRe("property", "og:image"), `<meta property="og:image" content="${esc(img)}"/>`);
    setTag(metaRe("name", "twitter:image"), `<meta name="twitter:image" content="${esc(img)}"/>`);
  }
  if (o.c) {
    const href = o.c.startsWith("/") ? origin + o.c : o.c;
    setTag(/<link\b[^>]*\brel=("|')canonical\1[^>]*>/gi, `<link rel="canonical" href="${esc(href)}"/>`);
  }
  if (insert.length) out = out.replace(/<\/head>/i, `${insert.join("")}</head>`);
  return out;
}
