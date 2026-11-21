// Keeps search-result metadata inside the limits the owner set: page titles up to 59 characters (the
// " | BeigeLeads" suffix counts) and descriptions up to 149. Pure; used by page metadata generators.
import type { Metadata } from "next";

export const TITLE_MAX = 59;
export const DESC_MAX = 149;
const SUFFIX = " | BeigeLeads";
const TRAIL = /[\s,;:|&\-–—(]+$|\b(?:and|or|of|for|the|a|to|in|with)$/i;

function cutWords(s: string, max: number): string {
  if (s.length <= max) return s;
  let t = s.slice(0, max + 1);
  const sp = t.lastIndexOf(" ");
  t = sp > max * 0.5 ? t.slice(0, sp) : s.slice(0, max);
  let prev = "";
  while (prev !== t) { prev = t; t = t.replace(TRAIL, "").trimEnd(); }
  return t;
}

/** The bare title (suffix removed) fitted to the limit. Returns a plain string when the layout's
 *  " | BeigeLeads" template still fits, otherwise an absolute title without the suffix. */
export function fitTitle(raw: string): string | { absolute: string } {
  const bare = raw.endsWith(SUFFIX) ? raw.slice(0, -SUFFIX.length) : raw;
  if (bare.length + SUFFIX.length <= TITLE_MAX) return bare;
  return { absolute: cutWords(bare, TITLE_MAX) };
}

export function fitDescription(raw: string): string {
  const d = raw.replace(/\s+/g, " ").trim();
  if (d.length <= DESC_MAX) return d;
  const head = d.slice(0, DESC_MAX + 1);
  const end = Math.max(head.lastIndexOf(". "), head.lastIndexOf("? "), head.lastIndexOf("! "));
  if (end >= 70) return d.slice(0, end + 1);
  return cutWords(d, DESC_MAX - 1).replace(/[.]$/, "") + "…";
}

type TitleVal = NonNullable<Metadata["title"]>;
const titleText = (t: TitleVal | null | undefined): string | null =>
  typeof t === "string" ? t : t && typeof t === "object" && "absolute" in t && typeof t.absolute === "string" ? t.absolute : t && typeof t === "object" && "default" in t && typeof t.default === "string" ? t.default : null;

/** Apply the limits to title, description and the matching Open Graph / Twitter fields. */
export function fitMeta(m: Metadata): Metadata {
  const out: Metadata = { ...m };
  const raw = titleText(m.title);
  if (raw) out.title = fitTitle(raw);
  if (typeof m.description === "string") out.description = fitDescription(m.description);
  const og = m.openGraph as (Record<string, unknown> & { title?: unknown; description?: unknown }) | null | undefined;
  if (og) {
    const o = { ...og };
    if (typeof o.title === "string") { const f = fitTitle(o.title); o.title = typeof f === "string" ? f : f.absolute; }
    if (typeof o.description === "string") o.description = fitDescription(o.description);
    out.openGraph = o as Metadata["openGraph"];
  }
  const tw = m.twitter as (Record<string, unknown> & { title?: unknown; description?: unknown }) | null | undefined;
  if (tw) {
    const o = { ...tw };
    if (typeof o.title === "string") { const f = fitTitle(o.title); o.title = typeof f === "string" ? f : f.absolute; }
    if (typeof o.description === "string") o.description = fitDescription(o.description);
    out.twitter = o as Metadata["twitter"];
  }
  return out;
}
