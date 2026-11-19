import { headingsOf, imagesOf, linksOf, plainText, wordCount, type DocNode } from "./doc";

export type Check = { level: "good" | "warn" | "info"; text: string };
export type InternalTarget = { url: string; title: string; keywords: string[] };

export const SEO_TITLE_RANGE = [30, 60] as const;
export const META_RANGE = [70, 160] as const;

/** Advisory checks only. They guide writing and never promise rankings. */
export function analyzeSeo(a: { title: string; slug: string; seoTitle: string; metaDescription: string; focusKeyword: string; excerpt: string; doc: DocNode; targets: InternalTarget[]; secondaryKeywords?: string; featuredImage?: string | null; featuredAlt?: string; canonicalUrl?: string }): Check[] {
  const out: Check[] = [];
  const title = (a.seoTitle || a.title).trim();
  const kw = a.focusKeyword.trim().toLowerCase();
  const text = plainText(a.doc);
  const words = wordCount(a.doc);

  const [tmin, tmax] = SEO_TITLE_RANGE;
  out.push(title.length === 0 ? { level: "warn", text: "Add an SEO title." } : title.length < tmin ? { level: "warn", text: `SEO title is short (${title.length} characters). Around ${tmin} to ${tmax} reads well in results.` } : title.length > tmax ? { level: "warn", text: `SEO title is long (${title.length}). It may be cut off after about ${tmax} characters.` } : { level: "good", text: `SEO title length is good (${title.length}).` });
  const [mmin, mmax] = META_RANGE;
  const meta = a.metaDescription.trim();
  out.push(!meta ? { level: "warn", text: "Add a meta description. Without one, search engines pick text from the page." } : meta.length < mmin ? { level: "info", text: `Meta description is short (${meta.length}). About ${mmin} to ${mmax} is typical.` } : meta.length > mmax ? { level: "warn", text: `Meta description is long (${meta.length}). It may be cut after about ${mmax}.` } : { level: "good", text: `Meta description length is good (${meta.length}).` });

  if (kw) {
    out.push(title.toLowerCase().includes(kw) ? { level: "good", text: "Focus keyword is in the title." } : { level: "info", text: "Focus keyword is not in the SEO title." });
    out.push(a.slug.includes(kw.replace(/\s+/g, "-")) ? { level: "good", text: "Focus keyword is in the URL." } : { level: "info", text: "Focus keyword is not in the URL slug." });
    out.push(text.split(/\s+/).slice(0, 120).join(" ").toLowerCase().includes(kw) ? { level: "good", text: "Focus keyword appears in the opening." } : { level: "info", text: "Focus keyword does not appear in the first 120 words." });
  } else out.push({ level: "info", text: "Optional: add a focus keyword to get keyword checks." });

  const heads = headingsOf(a.doc);
  if (heads.some((h) => h.level === 1)) out.push({ level: "warn", text: "The body has an H1. The article title is already the page's H1, so use H2 and below." });
  if (words > 300 && !heads.some((h) => h.level === 2)) out.push({ level: "warn", text: "Add H2 headings to break up a long article." });
  for (let i = 1; i < heads.length; i++) if (heads[i].level - heads[i - 1].level > 1) { out.push({ level: "warn", text: `Heading levels skip from H${heads[i - 1].level} to H${heads[i].level} ("${heads[i].text.slice(0, 40)}").` }); break; }
  if (words < 300) out.push({ level: "info", text: `Short article (${words} words). Cover the topic fully rather than aiming for a word count.` });

  const secondary = (a.secondaryKeywords ?? "").split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
  if (secondary.length) {
    const hit = secondary.filter((k) => text.toLowerCase().includes(k));
    out.push(hit.length === secondary.length ? { level: "good", text: "All secondary keywords appear in the text." } : { level: "info", text: `Not found in the text: ${secondary.filter((k) => !hit.includes(k)).join(", ")}.` });
  }

  const slugWords = a.slug.split("-").filter(Boolean);
  out.push(!a.slug ? { level: "warn", text: "Add a URL slug." } : a.slug.length > 75 ? { level: "warn", text: `The URL slug is long (${a.slug.length} characters). Shorter, descriptive slugs are easier to read.` } : slugWords.length < 2 ? { level: "info", text: "The URL slug is a single word. A short descriptive phrase is clearer." } : { level: "good", text: "The URL slug is short and descriptive." });

  if (a.canonicalUrl !== undefined && a.canonicalUrl.trim()) {
    let valid = false;
    try { const u = new URL(a.canonicalUrl); valid = u.protocol === "https:" || u.protocol === "http:"; } catch { /* invalid */ }
    out.push(valid ? { level: "info", text: "A custom canonical URL is set. Make sure it points to the page you want indexed." } : { level: "warn", text: "The canonical URL is not a valid web address." });
  }

  if (a.featuredImage !== undefined) {
    out.push(!a.featuredImage ? { level: "info", text: "No featured image. Cards use a brand placeholder and social shares have no picture." } : !(a.featuredAlt ?? "").trim() ? { level: "warn", text: "Add descriptive alt text to your featured image." } : { level: "good", text: "Featured image has alt text." });
  }

  const noAlt = imagesOf(a.doc).filter((i) => !i.alt.trim()).length;
  out.push(noAlt ? { level: "warn", text: `${noAlt} image(s) have no alt text.` } : { level: "good", text: "All images have alt text." });

  const internal = linksOf(a.doc).filter((h) => h.startsWith("/"));
  out.push(internal.length ? { level: "good", text: `${internal.length} internal link(s).` } : { level: "info", text: "No internal links yet. Link to a relevant BeigeLeads page." });
  return out;
}

/** Real BeigeLeads pages whose keywords appear in the text but are not linked yet. */
export function suggestLinks(doc: DocNode, targets: InternalTarget[], limit = 5): InternalTarget[] {
  const text = plainText(doc).toLowerCase();
  const linked = new Set(linksOf(doc));
  return targets.filter((t) => !linked.has(t.url) && t.keywords.some((k) => k.length > 3 && text.includes(k.toLowerCase()))).slice(0, limit);
}

/**
 * On-page optimization score, 0-100, from the checks above: good = full credit, info = half, warn = none.
 * It measures how many of these writing checks pass. It is NOT a ranking prediction.
 */
export function onPageScore(checks: Check[]): number {
  if (!checks.length) return 0;
  const pts = checks.reduce((n, c) => n + (c.level === "good" ? 1 : c.level === "info" ? 0.5 : 0), 0);
  return Math.round((pts / checks.length) * 100);
}

const cutAtWord = (s: string, max: number) => {
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  const i = cut.lastIndexOf(" ");
  return (i > max * 0.6 ? cut.slice(0, i) : cut.slice(0, max)).replace(/[\s,;:.-]+$/, "");
};

/** Editable suggestions built only from the article itself. No AI and no invented claims. */
export function suggestSeoTitle(title: string): string { return cutAtWord(title.trim(), SEO_TITLE_RANGE[1]); }

export function suggestMeta(excerpt: string, doc: DocNode): string {
  const base = (excerpt.trim() || plainText(doc).split(/\n+/).map((x) => x.trim()).find((x) => x.length > 60) || "").replace(/\s+/g, " ");
  if (!base) return "";
  if (base.length <= META_RANGE[1]) return base;
  const sentence = base.slice(0, META_RANGE[1] + 1).match(/^.*[.!?](?=\s|$)/);
  return sentence && sentence[0].length >= META_RANGE[0] ? sentence[0] : cutAtWord(base, META_RANGE[1] - 1) + "…";
}

const STOP = new Set(["a", "an", "the", "and", "or", "of", "for", "to", "in", "on", "with", "your", "how", "is", "are"]);
export function suggestSlug(title: string): string {
  const words = title.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, " ").split(/\s+/).filter(Boolean);
  const kept = words.filter((w) => !STOP.has(w));
  const slug = (kept.length >= 2 ? kept : words).join("-").replace(/[_-]+/g, "-").replace(/^-|-$/g, "");
  return slug.length > 60 ? slug.slice(0, 60).replace(/-[^-]*$/, "") : slug;
}
