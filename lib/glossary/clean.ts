// Pure helpers for glossary entries: field list, sanitising, slugs, validation. Used in the browser (import preview) and on the server (authoritative).

export const FIELDS = [
  ["term", "Term", ["term", "title", "name", "glossaryterm", "keyword"]],
  ["slug", "Slug", ["slug", "url", "path", "permalink"]],
  ["category", "Category", ["category", "categoryname", "topic", "group", "categoryslug"]],
  ["shortDefinition", "Short definition", ["shortdefinition", "definition", "short", "summary", "shortdescription"]],
  ["content", "Full explanation", ["fullexplanation", "explanation", "content", "body", "description", "details", "fullcontent", "detailedexplanation"]],
  ["whyItMatters", "Why it matters", ["whyitmatters", "why", "importance", "whyimportant"]],
  ["example", "Practical example", ["practicalexample", "example", "examples", "usecase"]],
  ["relatedTerms", "Related terms", ["relatedterms", "related", "seealso", "relatedglossary"]],
  ["relatedGuides", "Related guides", ["relatedguides", "guides", "relatedarticles", "articles"]],
  ["relatedProducts", "Related products", ["relatedproducts", "products", "relatedlists", "databases"]],
  ["seoTitle", "SEO title", ["seotitle", "metatitle", "pagetitle"]],
  ["metaDescription", "Meta description", ["metadescription", "seodescription", "metadesc"]],
  ["keywords", "Keywords", ["keywords", "seokeywords", "metakeywords", "tags"]],
  ["status", "Status", ["status", "state", "publishstatus"]],
] as const;
export type FieldKey = (typeof FIELDS)[number][0];
export type Raw = Partial<Record<FieldKey, string>>;
export type Mapping = Partial<Record<FieldKey, string>>; // field -> source column header

export type Entry = {
  slug: string; term: string; category: string; shortDefinition: string; content: string; whyItMatters: string; example: string;
  relatedTerms: string[]; relatedGuides: string[]; relatedProducts: string[]; seoTitle: string; metaDescription: string; keywords: string; status: "draft" | "published";
};

export const LIMITS = { term: 120, slug: 90, short: 400, content: 20000, why: 5000, example: 5000, seoTitle: 120, meta: 320, keywords: 300, listItem: 120, listMax: 20 } as const;
/** A published entry must be substantial: thin pages are what search engines penalise. */
export const MIN_PUBLISH = { short: 30, content: 200 } as const;

export const slugify = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, LIMITS.slug).replace(/-+$/, "");
export const validSlug = (s: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length <= LIMITS.slug;

const ENT: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " " };

/** Safe link: a site path or https. Anything else loses the link and keeps the words. */
const safeHref = (u: string) => { const x = u.trim(); return (x.startsWith("/") && !x.startsWith("//") && !/\s/.test(x)) || (/^https:\/\/[^\s]+$/i.test(x)) ? x : null; };

/**
 * Turns pasted text or HTML into the small Markdown subset the site renders:
 * paragraphs, "## subheading", "- bullets", "1. steps", **bold**, [text](path-or-https).
 * Everything else (scripts, styles, other tags, unsafe links, control characters) is removed.
 */
export function richText(input: unknown, max: number): string {
  let s = typeof input === "string" ? input : input == null ? "" : String(input);
  s = s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  if (/<\/?[a-z][^>]*>/i.test(s)) {
    s = s.replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1\s*>/gi, "")
      .replace(/<a\s[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a\s*>/gi, (_m, h: string, t: string) => `[${t.replace(/<[^>]*>/g, "")}](${h})`)
      .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|ul|ol|blockquote|tr)\s*>/gi, "\n\n")
      .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]\s*>/gi, (_m, t: string) => `\n\n## ${t.replace(/<[^>]*>/g, "")}\n\n`)
      .replace(/<li[^>]*>/gi, "\n- ").replace(/<\/li\s*>/gi, "")
      .replace(/<(strong|b)(\s[^>]*)?>([\s\S]*?)<\/\1\s*>/gi, "**$3**")
      .replace(/<\/?[a-z][^>]*>/gi, "");
    s = s.replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENT[m] ?? m);
  }
  // links: keep only safe ones
  s = s.replace(/\[([^\]\n]{1,200})\]\(([^)\s]{1,400})\)/g, (_m, t: string, u: string) => (safeHref(u) ? `[${t}](${u.trim()})` : t));
  s = s.split("\n").map((l) => l.replace(/[ \t]+$/g, "")).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return s.length > max ? s.slice(0, max).trim() : s;
}

/** Plain one-line text (titles, definitions): no markup at all. */
export function plain(input: unknown, max: number): string {
  return richText(input, max * 2).replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\*\*/g, "").replace(/^#+\s*/gm, "").replace(/^[-*]\s+/gm, "").replace(/\s+/g, " ").trim().slice(0, max).trim();
}

/** Related lists accept ";" "|" or new lines (a comma only when nothing else is used). */
export function toList(input: unknown): string[] {
  const raw = Array.isArray(input) ? input.join(";") : typeof input === "string" ? input : input == null ? "" : String(input);
  const sep = /[;|\n]/.test(raw) ? /[;|\n]/ : /,/;
  const seen = new Set<string>(); const out: string[] = [];
  for (const p of raw.split(sep)) { const v = plain(p, LIMITS.listItem); const k = v.toLowerCase(); if (v && !seen.has(k)) { seen.add(k); out.push(v); } }
  return out.slice(0, LIMITS.listMax);
}

export function toStatus(v: unknown): "draft" | "published" | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return null;
  if (["published", "publish", "live", "public", "1", "true", "yes"].includes(s)) return "published";
  if (["draft", "unpublished", "hidden", "0", "false", "no", "private"].includes(s)) return "draft";
  return null;
}

/** Builds a clean Entry from a raw row. Unknown status values are reported by validate(). */
export function toEntry(raw: Raw): { entry: Entry; badStatus: string | null } {
  const term = plain(raw.term, LIMITS.term);
  const slugIn = plain(raw.slug, LIMITS.slug + 20).toLowerCase();
  const st = toStatus(raw.status);
  const entry: Entry = {
    term, slug: slugIn ? (validSlug(slugIn) ? slugIn : slugify(slugIn)) : slugify(term),
    category: plain(raw.category, 80),
    shortDefinition: plain(raw.shortDefinition, LIMITS.short),
    content: richText(raw.content, LIMITS.content), whyItMatters: richText(raw.whyItMatters, LIMITS.why), example: richText(raw.example, LIMITS.example),
    relatedTerms: toList(raw.relatedTerms), relatedGuides: toList(raw.relatedGuides), relatedProducts: toList(raw.relatedProducts),
    seoTitle: plain(raw.seoTitle, LIMITS.seoTitle), metaDescription: plain(raw.metaDescription, LIMITS.meta),
    keywords: toList(raw.keywords).join(", ").slice(0, LIMITS.keywords), status: st ?? "draft",
  };
  const given = String(raw.status ?? "").trim();
  return { entry, badStatus: given && !st ? given : null };
}

export type Issues = { errors: string[]; warnings: string[] };
export function validate(e: Entry, o: { badStatus?: string | null; slugWasGiven?: boolean } = {}): Issues {
  const errors: string[] = []; const warnings: string[] = [];
  if (!e.term) errors.push("Term is missing.");
  if (e.term && !e.slug) errors.push("A slug could not be made from this term.");
  if (e.slug && !validSlug(e.slug)) errors.push("Slug may only use lowercase letters, numbers and hyphens.");
  if (!e.shortDefinition) errors.push("Short definition is missing.");
  if (o.badStatus) errors.push(`Status "${o.badStatus}" is not Draft or Published.`);
  if (e.status === "published") {
    if (e.shortDefinition.length < MIN_PUBLISH.short) errors.push(`A published entry needs a short definition of at least ${MIN_PUBLISH.short} characters.`);
    if (e.content.length < MIN_PUBLISH.content) errors.push(`A published entry needs a full explanation of at least ${MIN_PUBLISH.content} characters. Import it as a draft instead.`);
  }
  if (e.content && e.content.length < 400 && e.status === "draft") warnings.push("The explanation is short. It will need more before it is published.");
  if (!e.whyItMatters) warnings.push("No “why it matters” text.");
  if (!e.example) warnings.push("No practical example.");
  if (!e.category) warnings.push("No category.");
  if (e.seoTitle && e.seoTitle.length > 60) warnings.push("SEO title is over 60 characters and may be cut in search results.");
  if (e.metaDescription && (e.metaDescription.length > 160 || e.metaDescription.length < 70)) warnings.push("Meta description is best between 70 and 160 characters.");
  return { errors, warnings };
}

/** Search-result text used when the editor leaves the SEO fields empty. */
const WHO = /\b(maker|representative|broker|reseller|owner|founder|manager|executive|officer|recruiter|sdr|bdr|champion|buyer|prospect|influencer|stakeholder|user)$/i;
const HOW = /\b(verification|enrichment|deduplication|segmentation|scoring|prospecting|outreach|warm-?up|validation|scraping|cleansing|hygiene|targeting|personalization|personalisation|generation|nurturing|qualification|appending|profiling|matching)$/i;
const art = (t: string) => (/^(an?|the)\s/i.test(t) ? "" : /^[aeiou]/i.test(t) ? "an " : "a ");
const plural = (t: string) => { const w = t.split(/\s+/).pop() ?? ""; return w.length > 3 && /s$/i.test(w) && !/(ss|us|is)$/i.test(w); };
/** Every glossary page opens with a question: Who (roles), How (processes) or What (everything else). */
export function questionHeading(term: string): string {
  const t = term.trim();
  if (WHO.test(t)) return `Who Is ${art(t)}${t}?`;
  if (HOW.test(t)) return `How Does ${t} Work?`;
  return plural(t) ? `What Are ${t}?` : `What Is ${t}?`;
}
export const startsWithQuestion = (s: string) => /^(what|how|who|why|when)\b/i.test(s.trim());
export const autoTitle = (term: string) => { const t = `${questionHeading(term).replace(/\?$/, "")}? Definition and Examples`; return t.length <= 60 ? t : questionHeading(term).slice(0, 60); };
export const autoMeta = (short: string) => (short.length <= 158 ? short : short.slice(0, 157).replace(/\s+\S*$/, "") + "…");
