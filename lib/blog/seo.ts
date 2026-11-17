import { headingsOf, imagesOf, linksOf, plainText, wordCount, type DocNode } from "./doc";

export type Check = { level: "good" | "warn" | "info"; text: string };
export type InternalTarget = { url: string; title: string; keywords: string[] };

export const SEO_TITLE_RANGE = [30, 60] as const;
export const META_RANGE = [70, 160] as const;

/** Advisory checks only. They guide writing and never promise rankings. */
export function analyzeSeo(a: { title: string; slug: string; seoTitle: string; metaDescription: string; focusKeyword: string; excerpt: string; doc: DocNode; targets: InternalTarget[] }): Check[] {
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
