// Help Center content store. Articles and categories live in D1 (migration 0021); the 54 built-in articles in code
// are the fallback until the tables exist and have been filled ("Import" in /admin/help/articles).
// Public pages read ONE cached value (KV, 60 s) so a visit does not cost a database read.
import { asc } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { cleanBlocks, parseJson } from "./blocks";
import type { HelpData } from "./data";
import { HELP_GROUPS } from "./groups";
import { HELP_UPDATED, commonQuestions, helpArticles, helpCategories, startingPoints } from "./index";
import type { HelpArticle, HelpCategory } from "./types";

type Env = { DB: D1Database; CACHE: KVNamespace };
export const HELP_KV = "help:data:v1";

type ArtRow = typeof schema.helpArticles.$inferSelect;
type CatRow = typeof schema.helpCategories.$inferSelect;

export function rowToArticle(r: ArtRow): HelpArticle {
  return {
    id: r.id, category: r.category, slug: r.slug, title: r.title, description: r.description,
    keywords: parseJson<string[]>(r.keywords, []).filter((k) => typeof k === "string").slice(0, 30),
    body: cleanBlocks(parseJson<unknown>(r.body, [])),
    related: parseJson<string[]>(r.related, []).filter((k) => typeof k === "string").slice(0, 20),
    cta: r.ctaLabel && r.ctaHref ? { label: r.ctaLabel, href: r.ctaHref } : undefined,
    updated: r.updated ?? undefined, status: r.status, group: r.group, sort: r.sort, featured: r.featured, common: r.common,
    seoTitle: r.seoTitle ?? undefined, metaDescription: r.metaDescription ?? undefined, noindex: !!r.noindex, updatedAtMs: r.updatedAt,
  };
}
export const rowToCategory = (r: CatRow): HelpCategory => ({ slug: r.slug, name: r.name, icon: r.icon, description: r.description, sort: r.sort, status: r.status });

/** The built-in content in CMS shape: sub-groups, order, "Getting started" and "Common questions" positions. */
export function codeData(): HelpData {
  const categories = helpCategories.map((c, i) => ({ ...c, sort: i, status: "published" as const }));
  const articles: HelpArticle[] = [];
  for (const c of helpCategories) {
    const list = helpArticles.filter((a) => a.category === c.slug);
    let n = 0;
    const seen = new Set<string>();
    for (const g of HELP_GROUPS[c.slug] ?? []) {
      for (const slug of g.slugs) {
        const a = list.find((x) => x.slug === slug);
        if (!a) continue;
        seen.add(slug);
        articles.push({ ...a, status: "published", group: g.title, sort: n++ });
      }
    }
    for (const a of list) if (!seen.has(a.slug)) articles.push({ ...a, status: "published", group: "", sort: n++ });
  }
  const rank = (ids: readonly string[], a: HelpArticle) => ids.indexOf(`${a.category}/${a.slug}`) + 1;
  for (const a of articles) { a.featured = rank(startingPoints, a); a.common = rank(commonQuestions, a); }
  return { categories, articles, source: "code" };
}

/** Everything in the database (all statuses), or null when the tables are missing or still empty. */
export async function loadAll(env: Env): Promise<{ categories: (HelpCategory & { id: number })[]; articles: HelpArticle[] } | null> {
  try {
    const db = getDbFromEnv(env);
    const cats = await db.select().from(schema.helpCategories).orderBy(asc(schema.helpCategories.sort), asc(schema.helpCategories.id));
    if (cats.length === 0) return null;
    const arts = await db.select().from(schema.helpArticles).orderBy(asc(schema.helpArticles.sort), asc(schema.helpArticles.id));
    return { categories: cats.map((c) => ({ ...rowToCategory(c), id: c.id })), articles: arts.map(rowToArticle) };
  } catch { return null; }
}

/** Published content for public pages. Never throws: any failure falls back to the built-in content. */
export async function loadHelp(env: Env): Promise<HelpData> {
  try { const hit = await env.CACHE.get<HelpData>(HELP_KV, "json"); if (hit) return hit; } catch { /* read the database */ }
  const all = await loadAll(env);
  if (!all) return codeData();
  const categories = all.categories.filter((c) => c.status !== "hidden").map(({ id: _id, ...c }) => { void _id; return c; });
  const open = new Set(categories.map((c) => c.slug));
  const data: HelpData = { categories, articles: all.articles.filter((a) => a.status === "published" && open.has(a.category)), source: "database" };
  try { await env.CACHE.put(HELP_KV, JSON.stringify(data), { expirationTtl: 60 }); } catch { /* optional */ }
  return data;
}

export async function bustHelpCache(env: Env) { try { await env.CACHE.delete(HELP_KV); } catch { /* ignore */ } }

/** Copies the built-in categories and articles into the database. Safe to repeat: existing rows are never touched. */
export async function importBuiltIn(env: Env): Promise<{ categories: number; articles: number; skipped: number }> {
  const db = getDbFromEnv(env);
  const code = codeData();
  const now = Date.now();
  let categories = 0, articles = 0, skipped = 0;
  for (const c of code.categories) {
    const r = await db.insert(schema.helpCategories).values({ slug: c.slug, name: c.name, icon: c.icon, description: c.description, sort: c.sort ?? 0, status: "published", updatedAt: now }).onConflictDoNothing().returning({ id: schema.helpCategories.id });
    categories += r.length;
  }
  for (const a of code.articles) {
    const r = await db.insert(schema.helpArticles).values({
      category: a.category, slug: a.slug, title: a.title, description: a.description, keywords: JSON.stringify(a.keywords), body: JSON.stringify(a.body),
      related: JSON.stringify(a.related), ctaLabel: a.cta?.label ?? null, ctaHref: a.cta?.href ?? null, group: a.group ?? "", sort: a.sort ?? 0,
      featured: a.featured ?? 0, common: a.common ?? 0, status: "published", updated: a.updated ?? HELP_UPDATED, updatedAt: now,
    }).onConflictDoNothing().returning({ id: schema.helpArticles.id });
    if (r.length) articles++; else skipped++;
  }
  await bustHelpCache(env);
  return { categories, articles, skipped };
}
