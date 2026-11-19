import { and, desc, eq, like, or } from "drizzle-orm";
import { getCategory, getCountry, getProductFor } from "@/lib/catalog";
import type { getDbFromEnv } from "@/lib/db";
import { schema } from "@/lib/db";

type Db = ReturnType<typeof getDbFromEnv>;
export type Intent = "informational" | "commercial" | "transactional" | "navigational";
export type TargetType = "none" | "page" | "guide" | "article";
export type Status = "idea" | "briefed" | "writing" | "published";
export const INTENTS: Intent[] = ["informational", "commercial", "transactional", "navigational"];
export const TARGETS: TargetType[] = ["none", "page", "guide", "article"];
export const STATUSES: Status[] = ["idea", "briefed", "writing", "published"];

/** Rule-based intent guess. A suggestion the editor can change: no model, no search-volume data. */
export function classifyIntent(keyword: string): Intent {
  const k = keyword.toLowerCase();
  if (/\bbeigeleads\b/.test(k)) return "navigational";
  if (/\b(buy|price|pricing|cost|purchase|order|download|cheap|discount)\b/.test(k)) return "transactional";
  if (/^(how|what|why|when|which|can|do|does|is|are)\b|\b(guide|tutorial|tips|checklist|examples?|explained|meaning)\b/.test(k)) return "informational";
  return "commercial";
}

export const suggestTarget = (i: Intent): TargetType => (i === "informational" ? "guide" : i === "navigational" ? "none" : "page");

export type Brief = { h1: string; titleIdea: string; outline: string[]; questions: string[]; links: { url: string; title: string }[]; rules: string[] };

/** Deterministic content brief from the keyword and the real catalog. No statistics, no invented counts. */
export function buildBrief(i: { keyword: string; intent: Intent; category?: string; country?: string; place?: string }): Brief {
  const c = i.category ? getCategory(i.category) : undefined;
  const k = i.country ? getCountry(i.country) ?? { slug: i.country, name: i.country.replace(/-/g, " ").replace(/\b\p{L}/gu, (m) => m.toUpperCase()), code: "" } : undefined;
  const kw = i.keyword.trim();
  const title = kw.replace(/\b\p{L}/gu, (m) => m.toUpperCase());
  const where = i.place || k?.name || "";
  const links: Brief["links"] = [{ url: "/lists", title: "Browse all lists" }, { url: "/custom-list", title: "Custom list builder" }, { url: "/sample", title: "Free sample" }];
  if (c) links.push({ url: `/lists/${c.slug}`, title: `${c.name} lists` });
  if (c && k) { links.push({ url: `/lists/${c.slug}/${k.slug}`, title: `${c.name} in ${k.name}` }); const p = getProductFor(c.slug, k.slug); if (p) links.push({ url: `/product/${p.slug}`, title: p.name }); }
  links.push({ url: "/verification", title: "How data is verified" }, { url: "/legal/lawful-use", title: "Lawful use policy" });
  const common = ["Say plainly what exists today and what does not. Never state a count or price that is not real.", "One primary keyword, used naturally. No keyword stuffing.", "End with one clear next step: sample, list page or custom list."];
  if (i.intent === "informational") return {
    h1: title, titleIdea: `${title}: A Practical Guide`.slice(0, 60),
    outline: ["What the problem is and who it affects", "Step-by-step approach with a worked example", "Data quality checks", "Rules to respect (general overview, not legal advice)", "Checklist", "FAQ (answer each question directly)"],
    questions: [`What is ${kw}?`, `How do I get started with ${kw}?`, "What mistakes should I avoid?", "How do I check the quality of a list?"],
    links, rules: common,
  };
  return {
    h1: title, titleIdea: `${title} | BeigeLeads`.slice(0, 60),
    outline: [`What the ${kw} page offers and for whom`, "Real inventory (only recorded counts) and the fields included", where ? `Places inside ${where} with recorded data` : "Related places and industries", "Practical use cases", "How to buy or request a sample", "FAQ"],
    questions: [`What does the ${kw} include?`, `How many contacts are recorded${where ? ` for ${where}` : ""}?`, "Can I buy only this place?", "How are emails verified?"],
    links, rules: [...common, "Do not publish a page for a place with no inventory: it stays noindex."],
  };
}

export type KeywordRow = typeof schema.seoKeywords.$inferSelect;

export async function listKeywords(db: Db, o: { q?: string; status?: string } = {}): Promise<{ ready: boolean; rows: KeywordRow[] }> {
  try {
    const where = and(o.status && STATUSES.includes(o.status as Status) ? eq(schema.seoKeywords.status, o.status as Status) : undefined, o.q ? or(like(schema.seoKeywords.keyword, `%${o.q}%`), like(schema.seoKeywords.targetPath, `%${o.q}%`)) : undefined);
    return { ready: true, rows: await db.select().from(schema.seoKeywords).where(where).orderBy(desc(schema.seoKeywords.updatedAt)).limit(300) };
  } catch { return { ready: false, rows: [] }; }
}

export type KeywordInput = { keyword: string; intent: Intent; targetType: TargetType; targetPath: string; category: string; country: string; place: string; status: Status; notes: string };

/** `extraCountries` = admin-added country slugs (catalog_countries). */
export function cleanKeyword(raw: Partial<Record<keyof KeywordInput, unknown>>, extraCountries: readonly string[] = []): { value?: KeywordInput; error?: string } {
  const s = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
  const keyword = s(raw.keyword, 120).toLowerCase().replace(/\s+/g, " ");
  if (keyword.length < 3) return { error: "Enter a keyword (at least 3 characters)." };
  const intent = INTENTS.includes(raw.intent as Intent) ? (raw.intent as Intent) : classifyIntent(keyword);
  const targetType = TARGETS.includes(raw.targetType as TargetType) ? (raw.targetType as TargetType) : "none";
  const targetPath = s(raw.targetPath, 200);
  if (targetPath && !/^\/[A-Za-z0-9\-_/]*$/.test(targetPath)) return { error: "The target must be a site path like /lists/dentists." };
  const category = s(raw.category, 60);
  if (category && !getCategory(category)) return { error: "Unknown industry." };
  const country = s(raw.country, 60);
  if (country && !getCountry(country) && !extraCountries.includes(country)) return { error: "Unknown country." };
  const status = STATUSES.includes(raw.status as Status) ? (raw.status as Status) : "idea";
  return { value: { keyword, intent, targetType, targetPath, category, country, place: s(raw.place, 80), status, notes: s(raw.notes, 1000) } };
}

export async function saveKeyword(db: Db, id: number | null, v: KeywordInput): Promise<void> {
  const row = { keyword: v.keyword, intent: v.intent, targetType: v.targetType, targetPath: v.targetPath, categorySlug: v.category, countrySlug: v.country, place: v.place, status: v.status, notes: v.notes };
  if (id) await db.update(schema.seoKeywords).set({ ...row, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.seoKeywords.id, id));
  else await db.insert(schema.seoKeywords).values(row);
}
export async function deleteKeyword(db: Db, id: number): Promise<void> { await db.delete(schema.seoKeywords).where(eq(schema.seoKeywords.id, id)); }

/** Keywords already mapped to a path, for conflict warnings (two keywords fighting for one page). */
export const duplicateTargets = (rows: KeywordRow[]) => {
  const m = new Map<string, string[]>();
  for (const r of rows) if (r.targetPath) m.set(r.targetPath, [...(m.get(r.targetPath) ?? []), r.keyword]);
  return new Map([...m].filter(([, v]) => v.length > 1));
};
