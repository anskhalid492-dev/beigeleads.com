import type { BatchItem } from "drizzle-orm/batch";
import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import type { getDbFromEnv } from "@/lib/db";
import { schema } from "@/lib/db";
import { LIMITS, MIN_PUBLISH, slugify, toEntry, validate, type Entry, type Raw } from "./clean";
import { DEFAULT_CATEGORIES, type GCategory } from "./categories";
import type { Existing, Opts, PlanRow } from "./plan";

type Db = ReturnType<typeof getDbFromEnv>;
const t = schema.glossaryTerms;
export type Term = typeof t.$inferSelect;
const split = (s: string) => s.split(";").map((x) => x.trim()).filter(Boolean);
const join = (a: string[]) => a.join("; ");
const now = () => Math.floor(Date.now() / 1000);

/** True when migration 0032 has been applied. */
export async function glossaryReady(db: Db): Promise<boolean> {
  try { await db.select({ n: sql<number>`1` }).from(t).limit(1); return true; } catch { return false; }
}

// ---------- categories ----------
export async function getCategories(db: Db): Promise<GCategory[]> {
  try {
    const rows = await db.select().from(schema.glossaryCategories).orderBy(asc(schema.glossaryCategories.sortOrder), asc(schema.glossaryCategories.name));
    return rows.length ? rows.map((r) => ({ slug: r.slug, name: r.name, description: r.description, sortOrder: r.sortOrder })) : DEFAULT_CATEGORIES;
  } catch { return DEFAULT_CATEGORIES; }
}
/** The built-in categories are copied into the table the first time anything is saved, so they never disappear. */
async function seedCategories(db: Db) {
  const n = await db.select({ c: sql<number>`count(*)` }).from(schema.glossaryCategories);
  if (!n[0]?.c) await db.insert(schema.glossaryCategories).values(DEFAULT_CATEGORIES).onConflictDoNothing();
}
export async function saveCategory(db: Db, c: { slug?: string; name: string; description: string }): Promise<{ ok: boolean; message: string }> {
  const name = c.name.trim().slice(0, 80); const description = c.description.trim().slice(0, 300);
  if (name.length < 2) return { ok: false, message: "Give the category a name." };
  try {
    await seedCategories(db);
    if (c.slug) { await db.update(schema.glossaryCategories).set({ name, description }).where(eq(schema.glossaryCategories.slug, c.slug)); return { ok: true, message: "Category saved." }; }
    const slug = slugify(name); if (!slug) return { ok: false, message: "That name cannot be used." };
    const have = await db.select().from(schema.glossaryCategories).where(eq(schema.glossaryCategories.slug, slug));
    if (have.length) return { ok: false, message: "A category with this name already exists." };
    const max = await db.select({ m: sql<number>`coalesce(max(sort_order),0)` }).from(schema.glossaryCategories);
    await db.insert(schema.glossaryCategories).values({ slug, name, description, sortOrder: (max[0]?.m ?? 0) + 1 });
    return { ok: true, message: "Category added." };
  } catch { return { ok: false, message: "Could not save. Migration 0032 may not be applied yet." }; }
}
export async function deleteCategory(db: Db, slug: string): Promise<{ ok: boolean; message: string }> {
  const used = await db.select({ c: sql<number>`count(*)` }).from(t).where(eq(t.categorySlug, slug));
  if ((used[0]?.c ?? 0) > 0) return { ok: false, message: "This category still has entries. Move them to another category first." };
  await seedCategories(db);
  await db.delete(schema.glossaryCategories).where(eq(schema.glossaryCategories.slug, slug));
  return { ok: true, message: "Category deleted." };
}

// ---------- reading ----------
export async function existingForImport(db: Db): Promise<Existing[]> {
  try { return (await db.select({ id: t.id, slug: t.slug, term: t.term, status: t.status }).from(t)); } catch { return []; }
}
export const rowEntry = (r: Term): Entry => ({ slug: r.slug, term: r.term, category: r.categorySlug, shortDefinition: r.shortDefinition, content: r.content, whyItMatters: r.whyItMatters, example: r.example, relatedTerms: split(r.relatedTerms), relatedGuides: split(r.relatedGuides), relatedProducts: split(r.relatedProducts), seoTitle: r.seoTitle, metaDescription: r.metaDescription, keywords: r.keywords, status: r.status });

export type Card = { slug: string; term: string; category: string; short: string; featured: boolean };
/** Published entries for the directory. Empty when the table is missing. */
export async function publishedCards(db: Db): Promise<Card[]> {
  try {
    const rows = await db.select({ slug: t.slug, term: t.term, category: t.categorySlug, short: t.shortDefinition, featured: t.featured }).from(t).where(eq(t.status, "published")).orderBy(asc(sql`lower(${t.term})`));
    return rows.map((r) => ({ ...r, featured: r.featured === 1 }));
  } catch { return []; }
}
export async function publishedBySlug(db: Db, slug: string): Promise<Term | null> {
  try { return (await db.select().from(t).where(and(eq(t.slug, slug), eq(t.status, "published"))).limit(1))[0] ?? null; } catch { return null; }
}
export async function termById(db: Db, id: number): Promise<Term | null> {
  try { return (await db.select().from(t).where(eq(t.id, id)).limit(1))[0] ?? null; } catch { return null; }
}
/** Published entries matching a list of related-term names or slugs, in the order given. */
export async function resolveRelated(db: Db, names: string[], exceptSlug: string): Promise<Card[]> {
  if (!names.length) return [];
  const all = await publishedCards(db);
  const out: Card[] = []; const seen = new Set<string>();
  for (const n of names) {
    const k = n.trim().toLowerCase();
    const hit = all.find((c) => c.slug === k || c.slug === slugify(n) || c.term.toLowerCase() === k);
    if (hit && hit.slug !== exceptSlug && !seen.has(hit.slug)) { seen.add(hit.slug); out.push(hit); }
  }
  return out;
}
export async function sitemapPaths(db: Db): Promise<{ slug: string; updatedAt: Date; thin: boolean }[]> {
  try {
    const rows = await db.select({ slug: t.slug, u: t.updatedAt, c: t.content, s: t.shortDefinition }).from(t).where(eq(t.status, "published"));
    return rows.map((r) => ({ slug: r.slug, updatedAt: new Date(r.u * 1000), thin: r.c.length < MIN_PUBLISH.content || r.s.length < MIN_PUBLISH.short }));
  } catch { return []; }
}

export type AdminFilter = { q?: string; status?: string; category?: string; page?: number; per?: number };
export async function listAdmin(db: Db, f: AdminFilter) {
  const per = f.per ?? 25; const page = Math.max(1, f.page ?? 1);
  const conds = [];
  if (f.q) { const q = `%${f.q.replace(/[%_]/g, "")}%`; conds.push(or(like(t.term, q), like(t.slug, q), like(t.shortDefinition, q))); }
  if (f.status === "draft" || f.status === "published") conds.push(eq(t.status, f.status));
  if (f.category) conds.push(eq(t.categorySlug, f.category));
  const where = conds.length ? and(...conds) : undefined;
  try {
    const [rows, total, stats] = await Promise.all([
      db.select().from(t).where(where).orderBy(desc(t.updatedAt)).limit(per).offset((page - 1) * per),
      db.select({ c: sql<number>`count(*)` }).from(t).where(where),
      db.select({ status: t.status, c: sql<number>`count(*)` }).from(t).groupBy(t.status),
    ]);
    return { ready: true, rows, total: total[0]?.c ?? 0, published: stats.find((s) => s.status === "published")?.c ?? 0, drafts: stats.find((s) => s.status === "draft")?.c ?? 0 };
  } catch { return { ready: false, rows: [] as Term[], total: 0, published: 0, drafts: 0 }; }
}

// ---------- writing ----------
const audit = (db: Db, actor: string, key: string, value: string) => db.insert(schema.settingsAuditLog).values({ actor, category: "glossary", settingKey: key, newValue: value.slice(0, 500) }).catch(() => {});

async function resolveCategory(db: Db, name: string, cache: Map<string, string>, create: boolean): Promise<string> {
  const n = name.trim(); if (!n) return "";
  const k = n.toLowerCase(); if (cache.has(k)) return cache.get(k)!;
  const cats = await getCategories(db);
  const hit = cats.find((c) => c.slug === k || c.slug === slugify(n) || c.name.toLowerCase() === k);
  if (hit) { cache.set(k, hit.slug); return hit.slug; }
  if (!create) return "";
  const r = await saveCategory(db, { name: n, description: "" });
  const slug = slugify(n);
  if (r.ok || /already exists/.test(r.message)) { cache.set(k, slug); return slug; }
  return "";
}

const values = (e: Entry, categorySlug: string) => ({ slug: e.slug, term: e.term, categorySlug, shortDefinition: e.shortDefinition, content: e.content, whyItMatters: e.whyItMatters, example: e.example, relatedTerms: join(e.relatedTerms), relatedGuides: join(e.relatedGuides), relatedProducts: join(e.relatedProducts), seoTitle: e.seoTitle, metaDescription: e.metaDescription, keywords: e.keywords, status: e.status });

export type BatchResult = { created: number; updated: number; skipped: number; failed: number; rows: { row: number; term: string; action: string; message: string }[] };

/** Saves planned rows. Re-checks everything against the live table first, so a stale preview can never overwrite published content. */
export async function applyBatch(db: Db, plans: PlanRow[], opts: Opts, actor: string): Promise<BatchResult> {
  const res: BatchResult = { created: 0, updated: 0, skipped: 0, failed: 0, rows: [] };
  const log = (p: PlanRow, action: string, message: string) => res.rows.push({ row: p.row, term: p.entry.term, action, message });
  const live = await db.select().from(t);
  const bySlug = new Map(live.map((r) => [r.slug, r])); const byTerm = new Map(live.map((r) => [r.term.toLowerCase(), r]));
  const cache = new Map<string, string>();
  const stmts: { p: PlanRow; run: () => BatchItem<"sqlite"> }[] = [];
  for (const p of plans) {
    if (p.action === "error") { res.failed++; log(p, "failed", p.errors.join(" ")); continue; }
    if (p.action === "skip") { res.skipped++; log(p, "skipped", p.note ?? ""); continue; }
    const hit = bySlug.get(p.entry.slug) ?? byTerm.get(p.entry.term.toLowerCase());
    const cat = await resolveCategory(db, p.entry.category, cache, true);
    if (!hit) {
      const e = p.entry;
      const v = validate(e); if (v.errors.length) { res.failed++; log(p, "failed", v.errors.join(" ")); continue; }
      bySlug.set(e.slug, { ...({} as Term), slug: e.slug, term: e.term, status: e.status }); byTerm.set(e.term.toLowerCase(), bySlug.get(e.slug)!);
      stmts.push({ p, run: () => db.insert(t).values({ ...values(e, cat), publishedAt: e.status === "published" ? now() : null }) });
      continue;
    }
    // the row exists now
    if (opts.mode === "skip" || p.action === "create") { res.skipped++; log(p, "skipped", "Already exists. Skipped."); continue; }
    if (hit.status === "published" && !opts.allowUpdatePublished) { res.skipped++; log(p, "skipped", "Published entry protected."); continue; }
    const old = rowEntry(hit); const e = p.entry;
    const merged: Entry = {
      ...old,
      term: e.term || old.term, category: e.category || old.category,
      shortDefinition: e.shortDefinition || old.shortDefinition, content: e.content || old.content, whyItMatters: e.whyItMatters || old.whyItMatters, example: e.example || old.example,
      relatedTerms: e.relatedTerms.length ? e.relatedTerms : old.relatedTerms, relatedGuides: e.relatedGuides.length ? e.relatedGuides : old.relatedGuides, relatedProducts: e.relatedProducts.length ? e.relatedProducts : old.relatedProducts,
      seoTitle: e.seoTitle || old.seoTitle, metaDescription: e.metaDescription || old.metaDescription, keywords: e.keywords || old.keywords,
      status: hit.status === "published" ? "published" : e.status, // an import never unpublishes
      slug: hit.slug,
    };
    const v = validate(merged); if (v.errors.length) { res.failed++; log(p, "failed", v.errors.join(" ")); continue; }
    const catSlug = e.category ? cat : hit.categorySlug;
    stmts.push({ p, run: () => db.update(t).set({ ...values(merged, catSlug), updatedAt: now(), publishedAt: merged.status === "published" ? (hit.publishedAt ?? now()) : hit.publishedAt }).where(eq(t.id, hit.id)) });
  }
  const done = (p: PlanRow) => { if (p.action === "update") { res.updated++; log(p, "updated", p.note ?? "Updated."); } else { res.created++; log(p, "created", "Created."); } };
  if (stmts.length) {
    try { await db.batch(stmts.map((s) => s.run()) as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]); for (const s of stmts) done(s.p); }
    catch {
      for (const s of stmts) { try { await s.run(); done(s.p); } catch { res.failed++; log(s.p, "failed", "Could not be saved (the slug may already be in use)."); } }
    }
  }
  if (res.created || res.updated) await audit(db, actor, "import", `created ${res.created}, updated ${res.updated}, skipped ${res.skipped}, failed ${res.failed}`);
  return res;
}

/** One entry from the editor form. */
export async function saveTerm(db: Db, id: number | null, raw: Raw & { featured?: string }, wantStatus: "draft" | "published" | "keep", actor: string): Promise<{ ok: boolean; message: string; id?: number; errors?: string[] }> {
  const { entry, badStatus } = toEntry({ ...raw, status: wantStatus === "keep" ? undefined : wantStatus });
  let current: Term | null = null;
  if (id) { current = await termById(db, id); if (!current) return { ok: false, message: "This entry no longer exists." }; }
  if (wantStatus === "keep") entry.status = current?.status ?? "draft";
  const v = validate(entry, { badStatus });
  if (v.errors.length) return { ok: false, message: "Fix these first:", errors: v.errors };
  try {
    const clash = await db.select({ id: t.id, term: t.term }).from(t).where(or(eq(t.slug, entry.slug), sql`lower(${t.term}) = ${entry.term.toLowerCase()}`));
    const other = clash.find((c) => c.id !== id);
    if (other) return { ok: false, message: `Another entry already uses this ${other.term.toLowerCase() === entry.term.toLowerCase() ? "term" : "slug"} (“${other.term}”).` };
    const cache = new Map<string, string>();
    const cat = await resolveCategory(db, entry.category, cache, false);
    const featured = raw.featured === "1" ? 1 : 0;
    if (current) {
      await db.update(t).set({ ...values(entry, cat), featured, updatedAt: now(), publishedAt: entry.status === "published" ? (current.publishedAt ?? now()) : current.publishedAt }).where(eq(t.id, current.id));
      await audit(db, actor, `term:${current.id}`, `${current.status === entry.status ? "edited" : entry.status === "published" ? "published" : "unpublished"} ${entry.slug}`);
      return { ok: true, message: entry.status === "published" ? "Saved and published." : "Saved as draft.", id: current.id };
    }
    const r = await db.insert(t).values({ ...values(entry, cat), featured, publishedAt: entry.status === "published" ? now() : null }).returning({ id: t.id });
    await audit(db, actor, `term:${r[0].id}`, `created ${entry.slug} (${entry.status})`);
    return { ok: true, message: entry.status === "published" ? "Created and published." : "Created as draft.", id: r[0].id };
  } catch { return { ok: false, message: "Could not save. Migration 0032 may not be applied yet." }; }
}

export type BulkAction = "publish" | "draft" | "delete" | "category" | "feature" | "unfeature";
export async function bulk(db: Db, ids: number[], action: BulkAction, actor: string, category = ""): Promise<{ ok: boolean; message: string }> {
  ids = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))].slice(0, 200);
  if (!ids.length) return { ok: false, message: "Select at least one entry." };
  try {
    if (action === "delete") { await db.delete(t).where(inArray(t.id, ids)); await audit(db, actor, "bulk", `deleted ${ids.length}`); return { ok: true, message: `${ids.length} deleted.` }; }
    if (action === "draft") { await db.update(t).set({ status: "draft", updatedAt: now() }).where(inArray(t.id, ids)); await audit(db, actor, "bulk", `unpublished ${ids.length}`); return { ok: true, message: `${ids.length} moved to draft.` }; }
    if (action === "feature" || action === "unfeature") { await db.update(t).set({ featured: action === "feature" ? 1 : 0 }).where(inArray(t.id, ids)); return { ok: true, message: "Updated." }; }
    if (action === "category") {
      const cats = await getCategories(db); if (!cats.some((c) => c.slug === category)) return { ok: false, message: "Pick a category." };
      await db.update(t).set({ categorySlug: category, updatedAt: now() }).where(inArray(t.id, ids)); return { ok: true, message: "Category changed." };
    }
    // publish: only entries that are substantial enough
    const rows = await db.select().from(t).where(inArray(t.id, ids));
    const ok = rows.filter((r) => r.shortDefinition.length >= MIN_PUBLISH.short && r.content.length >= MIN_PUBLISH.content);
    const bad = rows.length - ok.length;
    if (ok.length) await db.update(t).set({ status: "published", updatedAt: now(), publishedAt: sql`coalesce(published_at, unixepoch())` }).where(inArray(t.id, ok.map((r) => r.id)));
    await audit(db, actor, "bulk", `published ${ok.length}${bad ? `, ${bad} too thin` : ""}`);
    return { ok: ok.length > 0, message: `${ok.length} published.${bad ? ` ${bad} not published: the explanation is too short.` : ""}` };
  } catch { return { ok: false, message: "Could not change the entries." }; }
}
export const COLS = LIMITS;
