// Admin operations for the Help Center CMS. Every write validates its input, cleans the body with the allow-list,
// clears the public cache and leaves a line in the audit log.
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { getDbFromEnv, schema } from "@/lib/db";
import { cleanBlocks, safeHref } from "./blocks";
import { bustHelpCache } from "./store";

type Env = { DB: D1Database; CACHE: KVNamespace };
export class HelpError extends Error {}

const slug = z.string().trim().toLowerCase().min(2, "Slug is too short.").max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single dashes.");
const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => v || undefined);

export const ICONS = ["rocket", "database", "tag", "wallet", "download", "shield", "list", "scale", "life-buoy"] as const;

export const articleInput = z.object({
  id: z.number().int().positive().optional(),
  /** updatedAt of the version the editor loaded; a stale tab cannot overwrite newer edits. */
  version: z.number().int().min(0).optional(),
  category: slug,
  slug,
  title: z.string().trim().min(3, "Add a title.").max(160),
  description: z.string().trim().min(10, "Add a short description (shown in search and under the title).").max(320),
  keywords: z.array(z.string().trim().min(1).max(60)).max(30),
  body: z.unknown(),
  related: z.array(z.string().max(120)).max(20),
  ctaLabel: optText(60),
  ctaHref: optText(300),
  group: z.string().trim().max(80),
  featured: z.boolean(),
  common: z.boolean(),
  status: z.enum(["draft", "published"]),
  seoTitle: optText(120),
  metaDescription: optText(320),
  noindex: z.boolean(),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-11-19.").optional(),
});
export type ArticleInput = z.infer<typeof articleInput>;

const audit = (env: Env, actor: string, key: string, value: string) =>
  getDbFromEnv(env).insert(schema.settingsAuditLog).values({ actor, category: "help", settingKey: key, newValue: value, result: "saved" }).catch(() => {});

async function nextRank(env: Env, col: "featured" | "common"): Promise<number> {
  const c = schema.helpArticles[col];
  const [r] = await getDbFromEnv(env).select({ m: sql<number>`coalesce(max(${c}), 0)` }).from(schema.helpArticles);
  return Number(r?.m ?? 0) + 1;
}

export async function saveArticle(env: Env, actor: string, raw: unknown): Promise<{ id: number; updatedAt: number }> {
  const p = articleInput.safeParse(raw);
  if (!p.success) throw new HelpError(p.error.issues[0]?.message ?? "Check the form.");
  const v = p.data;
  if (v.ctaHref && !safeHref(v.ctaHref)) throw new HelpError("The button link must start with / or https://.");
  if (!!v.ctaHref !== !!v.ctaLabel) throw new HelpError("Fill both the button text and the button link, or neither.");
  const body = cleanBlocks(v.body);
  if (v.status === "published" && body.length === 0) throw new HelpError("Add some content before publishing.");
  const db = getDbFromEnv(env);
  const cat = await db.select({ id: schema.helpCategories.id }).from(schema.helpCategories).where(eq(schema.helpCategories.slug, v.category)).limit(1);
  if (!cat.length) throw new HelpError("That topic does not exist.");
  const now = Date.now();

  const fields = {
    title: v.title, description: v.description, keywords: JSON.stringify(v.keywords), body: JSON.stringify(body),
    related: JSON.stringify(v.related.filter((r) => r !== `${v.category}/${v.slug}`)),
    ctaLabel: v.ctaLabel ?? null, ctaHref: v.ctaHref ?? null, group: v.group, status: v.status,
    seoTitle: v.seoTitle ?? null, metaDescription: v.metaDescription ?? null, noindex: v.noindex ? 1 : 0, updated: v.updated ?? new Date(now).toISOString().slice(0, 10), updatedAt: now,
  };

  if (!v.id) {
    const dup = await db.select({ id: schema.helpArticles.id }).from(schema.helpArticles).where(and(eq(schema.helpArticles.category, v.category), eq(schema.helpArticles.slug, v.slug))).limit(1);
    if (dup.length) throw new HelpError("An article with this slug already exists in that topic.");
    const [mx] = await db.select({ m: sql<number>`coalesce(max(${schema.helpArticles.sort}), -1)` }).from(schema.helpArticles).where(eq(schema.helpArticles.category, v.category));
    const [row] = await db.insert(schema.helpArticles).values({
      ...fields, category: v.category, slug: v.slug, sort: Number(mx?.m ?? -1) + 1,
      featured: v.featured ? await nextRank(env, "featured") : 0, common: v.common ? await nextRank(env, "common") : 0,
    }).returning({ id: schema.helpArticles.id });
    await bustHelpCache(env);
    await audit(env, actor, `article:${v.category}/${v.slug}`, `created (${v.status})`);
    return { id: row.id, updatedAt: now };
  }

  const [cur] = await db.select().from(schema.helpArticles).where(eq(schema.helpArticles.id, v.id)).limit(1);
  if (!cur) throw new HelpError("This article no longer exists.");
  if (v.version !== undefined && cur.updatedAt !== v.version) throw new HelpError("This article was changed somewhere else. Reload the page to see the newest version before saving.");
  // Address of a published article never changes from here: links, votes and views point at it.
  if (cur.status === "published" && (cur.slug !== v.slug || cur.category !== v.category)) throw new HelpError("Unpublish the article before changing its topic or slug.");
  if (cur.slug !== v.slug || cur.category !== v.category) {
    const dup = await db.select({ id: schema.helpArticles.id }).from(schema.helpArticles).where(and(eq(schema.helpArticles.category, v.category), eq(schema.helpArticles.slug, v.slug), ne(schema.helpArticles.id, v.id))).limit(1);
    if (dup.length) throw new HelpError("An article with this slug already exists in that topic.");
  }
  await db.update(schema.helpArticles).set({
    ...fields, category: v.category, slug: v.slug,
    featured: v.featured ? cur.featured || (await nextRank(env, "featured")) : 0,
    common: v.common ? cur.common || (await nextRank(env, "common")) : 0,
  }).where(eq(schema.helpArticles.id, v.id));
  await bustHelpCache(env);
  await audit(env, actor, `article:${v.category}/${v.slug}`, `saved (${v.status})`);
  return { id: v.id, updatedAt: now };
}

export async function setArticleStatus(env: Env, actor: string, id: number, status: "draft" | "published") {
  const db = getDbFromEnv(env);
  const [cur] = await db.select().from(schema.helpArticles).where(eq(schema.helpArticles.id, id)).limit(1);
  if (!cur) throw new HelpError("This article no longer exists.");
  if (status === "published" && cleanBlocks(JSON.parse(cur.body || "[]")).length === 0) throw new HelpError("Add some content before publishing.");
  await db.update(schema.helpArticles).set({ status, updatedAt: Date.now() }).where(eq(schema.helpArticles.id, id));
  await bustHelpCache(env);
  await audit(env, actor, `article:${cur.category}/${cur.slug}`, status);
}

export async function deleteArticle(env: Env, actor: string, id: number) {
  const db = getDbFromEnv(env);
  const [cur] = await db.select().from(schema.helpArticles).where(eq(schema.helpArticles.id, id)).limit(1);
  if (!cur) return;
  await db.delete(schema.helpArticles).where(eq(schema.helpArticles.id, id));
  await bustHelpCache(env);
  await audit(env, actor, `article:${cur.category}/${cur.slug}`, "deleted");
}

/** Moves an article up or down inside its topic by swapping its position with the neighbour. */
export async function moveArticle(env: Env, actor: string, id: number, dir: "up" | "down") {
  const db = getDbFromEnv(env);
  const [cur] = await db.select().from(schema.helpArticles).where(eq(schema.helpArticles.id, id)).limit(1);
  if (!cur) return;
  const list = await db.select().from(schema.helpArticles).where(eq(schema.helpArticles.category, cur.category)).orderBy(asc(schema.helpArticles.sort), asc(schema.helpArticles.id));
  const i = list.findIndex((a) => a.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  // Re-number the whole topic so equal positions can never make a move do nothing.
  const order = list.map((a) => a.id);
  [order[i], order[j]] = [order[j], order[i]];
  for (let n = 0; n < order.length; n++) await db.update(schema.helpArticles).set({ sort: n }).where(eq(schema.helpArticles.id, order[n]));
  await bustHelpCache(env);
  await audit(env, actor, `article:${cur.category}/${cur.slug}`, `moved ${dir}`);
}

// ---- categories
export const categoryInput = z.object({
  id: z.number().int().positive().optional(),
  slug,
  name: z.string().trim().min(2, "Add a name.").max(80),
  description: z.string().trim().max(240),
  icon: z.enum(ICONS),
  status: z.enum(["published", "hidden"]),
});

export async function saveCategory(env: Env, actor: string, raw: unknown) {
  const p = categoryInput.safeParse(raw);
  if (!p.success) throw new HelpError(p.error.issues[0]?.message ?? "Check the form.");
  const v = p.data;
  const db = getDbFromEnv(env);
  const now = Date.now();
  if (!v.id) {
    const dup = await db.select({ id: schema.helpCategories.id }).from(schema.helpCategories).where(eq(schema.helpCategories.slug, v.slug)).limit(1);
    if (dup.length) throw new HelpError("A topic with this slug already exists.");
    const [mx] = await db.select({ m: sql<number>`coalesce(max(${schema.helpCategories.sort}), -1)` }).from(schema.helpCategories);
    await db.insert(schema.helpCategories).values({ slug: v.slug, name: v.name, description: v.description, icon: v.icon, status: v.status, sort: Number(mx?.m ?? -1) + 1, updatedAt: now });
  } else {
    const [cur] = await db.select().from(schema.helpCategories).where(eq(schema.helpCategories.id, v.id)).limit(1);
    if (!cur) throw new HelpError("This topic no longer exists.");
    if (cur.slug !== v.slug) {
      const n = await db.select({ id: schema.helpArticles.id }).from(schema.helpArticles).where(eq(schema.helpArticles.category, cur.slug)).limit(1);
      if (n.length) throw new HelpError("A topic that has articles keeps its slug (links and votes point at it).");
      const dup = await db.select({ id: schema.helpCategories.id }).from(schema.helpCategories).where(eq(schema.helpCategories.slug, v.slug)).limit(1);
      if (dup.length) throw new HelpError("A topic with this slug already exists.");
    }
    await db.update(schema.helpCategories).set({ slug: v.slug, name: v.name, description: v.description, icon: v.icon, status: v.status, updatedAt: now }).where(eq(schema.helpCategories.id, v.id));
  }
  await bustHelpCache(env);
  await audit(env, actor, `topic:${v.slug}`, `saved (${v.status})`);
}

export async function deleteCategory(env: Env, actor: string, id: number) {
  const db = getDbFromEnv(env);
  const [cur] = await db.select().from(schema.helpCategories).where(eq(schema.helpCategories.id, id)).limit(1);
  if (!cur) return;
  const n = await db.select({ id: schema.helpArticles.id }).from(schema.helpArticles).where(eq(schema.helpArticles.category, cur.slug)).limit(1);
  if (n.length) throw new HelpError("Move or delete this topic's articles first.");
  await db.delete(schema.helpCategories).where(eq(schema.helpCategories.id, id));
  await bustHelpCache(env);
  await audit(env, actor, `topic:${cur.slug}`, "deleted");
}

export async function moveCategory(env: Env, actor: string, id: number, dir: "up" | "down") {
  const db = getDbFromEnv(env);
  const list = await db.select().from(schema.helpCategories).orderBy(asc(schema.helpCategories.sort), asc(schema.helpCategories.id));
  const i = list.findIndex((c) => c.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  const order = list.map((c) => c.id);
  [order[i], order[j]] = [order[j], order[i]];
  for (let n = 0; n < order.length; n++) await db.update(schema.helpCategories).set({ sort: n }).where(eq(schema.helpCategories.id, order[n]));
  await bustHelpCache(env);
  await audit(env, actor, `topic:${list[i].slug}`, `moved ${dir}`);
}
