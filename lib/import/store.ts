// Imported catalog: plan / apply / roll back an import batch, review and publish. Uses D1 only. Never throws before migration 0035 (callers check `ready`).
import { and, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@/lib/db";
import { publishBlockers } from "./woo";

type Db = ReturnType<typeof import("@/lib/db").getDbFromEnv>;

export const importPackageSchema = z.object({
  name: z.enum(["Starter", "Professional", "Complete"]), records: z.number().int().min(0).max(5_000_000_000), priceUsdCents: z.number().int().min(0).max(100_000_00),
  link: z.string().max(600).refine((v) => v === "" || /^https:\/\/[^\s]+$/i.test(v), "Download links must be https"), highlighted: z.boolean().optional(),
});
const str = (n: number) => z.string().max(n);
export const importProductSchema = z.object({
  sourceId: str(40).min(1), slug: str(160).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), name: str(200).min(1), title: str(200), description: str(2000), originalDescription: str(20000), shortDescription: str(2000),
  categorySlug: str(120).min(1), categoryName: str(120).min(1), channel: z.enum(["business-email", "consumer-email", "phone", "email"]), group: z.enum(["industry", "job-title", "technology", "geographic", "general"]),
  jobTitle: str(160), countrySlug: str(80).min(1), countryCode: str(8).min(1), countryName: str(80).min(1), region: str(80), city: str(80),
  restricted: z.array(str(40)).max(12), flags: z.array(str(200)).max(24), recordCount: z.number().int().min(0).nullable(), packages: z.array(importPackageSchema).min(1).max(3),
  seoTitle: str(200), metaDescription: str(400), imageUrl: str(600), tags: z.array(str(80)).max(40), sourceCategories: z.array(str(200)).max(60), sourceVariations: z.number().int().min(0),
  droppedVariations: z.number().int().min(0), sourceRegular: z.number().nullable(), sourceSale: z.number().nullable(), wpPublished: z.boolean(), sku: str(80), titleKey: str(200),
});
export type ImportRow = z.infer<typeof importProductSchema>;
export type DupPolicy = "skip" | "update" | "separate";

const j = (v: unknown) => JSON.stringify(v);
const parse = <T,>(s: string | null | undefined, d: T): T => { try { return s ? (JSON.parse(s) as T) : d; } catch { return d; } };

/** Is the import schema applied? */
export async function importReady(db: Db): Promise<boolean> {
  try { await db.select({ n: count() }).from(schema.catalogProducts); return true; } catch { return false; }
}

export type Existing = { id: number; sourceId: string | null; slug: string; name: string; status: string };

export async function existingFor(db: Db, rows: { sourceId: string; slug: string; name: string }[]): Promise<{ bySource: Map<string, Existing>; bySlug: Map<string, Existing>; byName: Map<string, Existing> }> {
  const out = { bySource: new Map<string, Existing>(), bySlug: new Map<string, Existing>(), byName: new Map<string, Existing>() };
  const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
  const pick = { id: schema.catalogProducts.id, sourceId: schema.catalogProducts.sourceId, slug: schema.catalogProducts.slug, name: schema.catalogProducts.name, status: schema.catalogProducts.status };
  for (const c of chunk(rows, 40)) {
    const found = await db.select(pick).from(schema.catalogProducts).where(or(inArray(schema.catalogProducts.sourceId, c.map((r) => r.sourceId)), inArray(schema.catalogProducts.slug, c.map((r) => r.slug)), inArray(schema.catalogProducts.name, c.map((r) => r.name))));
    for (const e of found) { if (e.sourceId) out.bySource.set(e.sourceId, e); out.bySlug.set(e.slug, e); out.byName.set(e.name.toLowerCase(), e); }
  }
  return out;
}

export type PlanItem = { sourceId: string; slug: string; action: "create" | "update" | "skip" | "error"; reason?: string; duplicateOf?: string };

/** Decide what a batch would do, without writing. `reserved` = slugs that belong to code-defined pages (static products, categories, taxonomy). */
export async function planBatch(db: Db, rows: ImportRow[], policy: DupPolicy, reserved: ReadonlySet<string>): Promise<{ items: PlanItem[]; slugs: Map<string, string> }> {
  const ex = await existingFor(db, rows);
  const used = new Set<string>();
  const slugs = new Map<string, string>();
  const items: PlanItem[] = [];
  for (const r of rows) {
    const dup = ex.bySource.get(r.sourceId) ?? ex.byName.get(r.name.toLowerCase());
    // the same WordPress product can only exist once, whatever the policy (unique index on source_id)
    if (policy === "separate" && ex.bySource.has(r.sourceId)) { const d = ex.bySource.get(r.sourceId)!; items.push({ sourceId: r.sourceId, slug: d.slug, action: "skip", reason: "already imported", duplicateOf: d.slug }); continue; }
    if (dup && policy !== "separate") {
      if (policy === "skip") { items.push({ sourceId: r.sourceId, slug: dup.slug, action: "skip", reason: ex.bySource.has(r.sourceId) ? "already imported" : `same name as ${dup.slug}`, duplicateOf: dup.slug }); continue; }
      if (dup.status !== "draft") { items.push({ sourceId: r.sourceId, slug: dup.slug, action: "skip", reason: "existing product is published: not overwritten", duplicateOf: dup.slug }); continue; }
      items.push({ sourceId: r.sourceId, slug: dup.slug, action: "update", duplicateOf: dup.slug }); slugs.set(r.sourceId, dup.slug); used.add(dup.slug); continue;
    }
    let slug = r.slug;
    if (reserved.has(slug) || ex.bySlug.has(slug) || used.has(slug)) slug = `${r.slug}-${r.sourceId}`;
    if (reserved.has(slug) || ex.bySlug.has(slug) || used.has(slug)) { items.push({ sourceId: r.sourceId, slug, action: "error", reason: "slug already in use" }); continue; }
    used.add(slug); slugs.set(r.sourceId, slug);
    items.push({ sourceId: r.sourceId, slug, action: "create", ...(dup ? { duplicateOf: dup.slug } : {}) });
  }
  return { items, slugs };
}

const toRow = (r: ImportRow, slug: string, importId: number) => ({
  importId, sourceId: r.sourceId, slug, status: "draft" as const, name: r.name, title: r.title || r.name, description: r.description, originalDescription: r.originalDescription,
  categorySlug: r.categorySlug, categoryName: r.categoryName, channel: r.channel, grp: r.group, jobTitle: r.jobTitle || null, countrySlug: r.countrySlug, countryCode: r.countryCode, countryName: r.countryName,
  region: r.region || null, city: r.city || null, restrictedJson: j(r.restricted), flagsJson: j(r.flags), recordCount: r.recordCount, packagesJson: j(r.packages),
  seoTitle: r.seoTitle || null, metaDescription: r.metaDescription || null, imageUrl: r.imageUrl || null, tagsJson: j(r.tags),
  sourceJson: j({ categories: r.sourceCategories, variations: r.sourceVariations, dropped: r.droppedVariations, regular: r.sourceRegular, sale: r.sourceSale, wpPublished: r.wpPublished, sku: r.sku, shortDescription: r.shortDescription }),
});

export async function startImport(db: Db, filename: string, total: number): Promise<number> {
  const [row] = await db.insert(schema.catalogImports).values({ filename: filename.slice(0, 200), total }).returning({ id: schema.catalogImports.id });
  return row.id;
}

/** Apply one batch. Each product is written on its own, so one bad row never loses the rest. Delivery links are added only where none exists yet. */
export async function applyBatch(db: Db, importId: number, rows: ImportRow[], policy: DupPolicy, reserved: ReadonlySet<string>, actor: string) {
  const { items, slugs } = await planBatch(db, rows, policy, reserved);
  const res = { created: 0, updated: 0, skipped: 0, failed: 0, errors: [] as { sourceId: string; message: string }[] };
  const byId = new Map(rows.map((r) => [r.sourceId, r]));
  for (const it of items) {
    const r = byId.get(it.sourceId)!;
    try {
      if (it.action === "skip") { res.skipped++; continue; }
      if (it.action === "error") { res.failed++; res.errors.push({ sourceId: it.sourceId, message: it.reason ?? "error" }); continue; }
      const slug = slugs.get(it.sourceId) ?? it.slug;
      if (it.action === "create") await db.insert(schema.catalogProducts).values(toRow(r, slug, importId));
      else await db.update(schema.catalogProducts).set({ ...toRow(r, slug, importId), slug: undefined, status: undefined, updatedAt: Math.floor(Date.now() / 1000) }).where(and(eq(schema.catalogProducts.slug, slug), eq(schema.catalogProducts.status, "draft")));
      for (const k of r.packages) {
        if (!k.link) continue;
        await db.insert(schema.deliveryLinks).values({ productSlug: slug, packageName: k.name, url: k.link, updatedBy: `import:${importId}:${actor}`.slice(0, 120) }).onConflictDoNothing();
      }
      if (it.action === "create") res.created++; else res.updated++;
    } catch (e) {
      res.failed++; res.errors.push({ sourceId: it.sourceId, message: e instanceof Error ? e.message.slice(0, 300) : "write failed" });
    }
  }
  for (const e of res.errors) await db.insert(schema.catalogImportErrors).values({ importId, sourceId: e.sourceId, message: e.message }).catch(() => undefined);
  await db.update(schema.catalogImports).set({ created: sql`${schema.catalogImports.created} + ${res.created}`, updated: sql`${schema.catalogImports.updated} + ${res.updated}`, skipped: sql`${schema.catalogImports.skipped} + ${res.skipped}`, failed: sql`${schema.catalogImports.failed} + ${res.failed}` }).where(eq(schema.catalogImports.id, importId));
  return { ...res, items };
}

export async function finishImport(db: Db, importId: number) {
  await db.update(schema.catalogImports).set({ status: "done", finishedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.catalogImports.id, importId));
}

/** Remove everything an import created that is still a DRAFT and has no orders. Published or ordered products stay (and are reported). */
export async function rollbackImport(db: Db, importId: number): Promise<{ removed: number; kept: number }> {
  const rows = await db.select({ id: schema.catalogProducts.id, slug: schema.catalogProducts.slug, status: schema.catalogProducts.status }).from(schema.catalogProducts).where(eq(schema.catalogProducts.importId, importId));
  const ordered = rows.length ? new Set((await db.select({ s: schema.orderItems.productSlug }).from(schema.orderItems).where(inArray(schema.orderItems.productSlug, rows.map((r) => r.slug)))).map((x) => x.s)) : new Set<string>();
  const del = rows.filter((r) => r.status === "draft" && !ordered.has(r.slug));
  for (let i = 0; i < del.length; i += 40) {
    const c = del.slice(i, i + 40);
    await db.delete(schema.deliveryLinks).where(and(inArray(schema.deliveryLinks.productSlug, c.map((x) => x.slug)), like(schema.deliveryLinks.updatedBy, `import:${importId}:%`)));
    await db.delete(schema.catalogProducts).where(inArray(schema.catalogProducts.id, c.map((x) => x.id)));
  }
  await db.update(schema.catalogImports).set({ status: "rolled_back", rolledBackAt: Math.floor(Date.now() / 1000) }).where(eq(schema.catalogImports.id, importId));
  return { removed: del.length, kept: rows.length - del.length };
}

export type Row = typeof schema.catalogProducts.$inferSelect;
export type Pkg = { name: string; records: number; priceUsdCents: number; link?: string; highlighted?: boolean };
export const rowPackages = (r: Pick<Row, "packagesJson">) => parse<Pkg[]>(r.packagesJson, []);
export const rowRestricted = (r: Pick<Row, "restrictedJson">) => parse<string[]>(r.restrictedJson, []);
export const rowFlags = (r: Pick<Row, "flagsJson">) => parse<string[]>(r.flagsJson, []);

export type Filters = { q?: string; status?: string; channel?: string; country?: string; restricted?: "yes" | "no"; flag?: string; importId?: number };
const PAGE = 50;
function whereOf(f: Filters) {
  return and(
    f.q ? or(like(schema.catalogProducts.name, `%${f.q}%`), like(schema.catalogProducts.slug, `%${f.q}%`)) : undefined,
    f.status ? eq(schema.catalogProducts.status, f.status as "draft") : undefined,
    f.channel ? eq(schema.catalogProducts.channel, f.channel) : undefined,
    f.country ? eq(schema.catalogProducts.countrySlug, f.country) : undefined,
    f.restricted === "yes" ? sql`${schema.catalogProducts.restrictedJson} != '[]'` : f.restricted === "no" ? sql`${schema.catalogProducts.restrictedJson} = '[]'` : undefined,
    f.flag ? like(schema.catalogProducts.flagsJson, `%${f.flag}%`) : undefined,
    f.importId ? eq(schema.catalogProducts.importId, f.importId) : undefined,
  );
}

/** Every product id matching the filters (capped), for "select all N" across pages. */
export async function listIds(db: Db, f: Filters, cap = 2000): Promise<number[]> {
  return (await db.select({ id: schema.catalogProducts.id }).from(schema.catalogProducts).where(whereOf(f)).orderBy(desc(schema.catalogProducts.id)).limit(cap)).map((r) => r.id);
}

export async function listProducts(db: Db, f: Filters, page: number) {
  const w = whereOf(f);
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(schema.catalogProducts).where(w),
    db.select().from(schema.catalogProducts).where(w).orderBy(desc(schema.catalogProducts.id)).limit(PAGE).offset((Math.max(1, page) - 1) * PAGE),
  ]);
  return { total, rows, pages: Math.max(1, Math.ceil(total / PAGE)), page: Math.max(1, page) };
}

export async function stats(db: Db) {
  const rows = await db.select({ status: schema.catalogProducts.status, n: count() }).from(schema.catalogProducts).groupBy(schema.catalogProducts.status);
  const [{ restricted }] = await db.select({ restricted: count() }).from(schema.catalogProducts).where(sql`${schema.catalogProducts.restrictedJson} != '[]'`);
  return { byStatus: Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<string, number>, restricted };
}

export const listImports = (db: Db) => db.select().from(schema.catalogImports).orderBy(desc(schema.catalogImports.id)).limit(30);

/** Publish / unpublish / archive. Publishing is refused for restricted products, products without a price and (a missing delivery link does not block, but is reported). */
export async function setStatus(db: Db, ids: number[], status: "draft" | "published" | "archived", opts: { allowRestricted?: boolean } = {}): Promise<{ changed: number; refused: { slug: string; reasons: string[] }[]; noLink: string[] }> {
  const noLink: string[] = [];
  const refused: { slug: string; reasons: string[] }[] = [];
  let ok = ids;
  if (status === "published" && ids.length) {
    const rows = await db.select().from(schema.catalogProducts).where(inArray(schema.catalogProducts.id, ids));
    const links = await db.select({ s: schema.deliveryLinks.productSlug, p: schema.deliveryLinks.packageName, u: schema.deliveryLinks.url }).from(schema.deliveryLinks).where(inArray(schema.deliveryLinks.productSlug, rows.map((r) => r.slug)));
    ok = [];
    for (const r of rows) {
      const pk = rowPackages(r);
      const has = pk.map((k) => links.some((l) => l.s === r.slug && (l.p === k.name || l.p === "") && l.u));
      // Owner decision (20 Nov 2026): a missing delivery link no longer blocks publishing; it is reported so the link can be added later.
      const why = publishBlockers({ restricted: rowRestricted(r), packages: pk }, has).filter((x) => x !== "download link missing" && !(opts.allowRestricted && x.startsWith("restricted category")));
      if (why.length) refused.push({ slug: r.slug, reasons: why }); else { ok.push(r.id); if (has.some((x) => !x)) noLink.push(r.slug); }
    }
  }
  for (let i = 0; i < ok.length; i += 40) await db.update(schema.catalogProducts).set({ status, updatedAt: Math.floor(Date.now() / 1000) }).where(inArray(schema.catalogProducts.id, ok.slice(i, i + 40)));
  return { changed: ok.length, refused, noLink };
}
