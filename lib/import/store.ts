// Imported catalog: plan / apply / roll back an import batch, review and publish. Uses D1 only. Never throws before migration 0035 (callers check `ready`).
import { and, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getCategories, getCategory, getCountries, getCountry, getStaticProducts } from "@/lib/catalog";
import { cleanStored, type SampleRowData } from "@/lib/product-samples";
import { schema } from "@/lib/db";
import { reservedSlugs } from "./reserved";
import { categoryForSubject, seoText } from "./seo-text";
import { publishBlockers } from "./woo";
import { PROTECTED_CATS } from "./reorganize";

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
  try { await db.select({ n: count(), o: schema.catalogProducts.origin }).from(schema.catalogProducts).limit(1); return true; } catch { return false; }
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

const isoDate = z.string().refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`))), "Use the format YYYY-MM-DD");
export const productEditSchema = z.object({
  name: z.string().trim().min(1).max(200), title: z.string().trim().max(200), description: z.string().max(2000),
  seoTitle: z.string().trim().max(200), metaDescription: z.string().trim().max(400),
  categoryName: z.string().trim().min(1).max(120).optional(),
  recordCount: z.number().int().min(0).max(5_000_000_000).nullable(), dataFields: z.array(z.string().trim().min(1).max(60)).max(40),
  fileFormats: z.string().trim().max(80), coverage: z.string().trim().max(160), lastUpdated: isoDate, placeholder: z.boolean(), forSale: z.boolean(),
  packages: z.array(z.object({ name: z.enum(["Starter", "Professional", "Complete"]), records: z.number().int().min(0).max(5_000_000_000), priceUsdCents: z.number().int().min(0).max(100_000_00), highlighted: z.boolean().optional() })).min(1).max(3),
});
export type ProductEdit = z.infer<typeof productEditSchema>;

export async function getProductRow(db: Db, id: number) {
  return (await db.select().from(schema.catalogProducts).where(eq(schema.catalogProducts.id, id)).limit(1))[0] ?? null;
}
export const rowFields = (r: Pick<Row, "dataFieldsJson">) => parse<string[]>(r.dataFieldsJson, []);

/** Edit the sellable text, figures and packages. Slug, category, country and restricted flags are fixed here. A PUBLISHED product cannot be saved with a package price of 0. Source download links stay on their package. */
export async function updateProduct(db: Db, id: number, e: ProductEdit): Promise<{ ok: boolean; message: string }> {
  const row = await getProductRow(db, id);
  if (!row) return { ok: false, message: "That product no longer exists." };
  if (row.status === "published" && e.packages.some((k) => !k.priceUsdCents)) return { ok: false, message: "A published product needs a price on every package. Set it back to draft first, or enter a price." };
  if (new Set(e.packages.map((k) => k.name)).size !== e.packages.length) return { ok: false, message: "Each package name can be used once." };
  const old = rowPackages(row);
  const packages = e.packages.map((k) => ({ ...k, ...(old.find((o) => o.name === k.name)?.link ? { link: old.find((o) => o.name === k.name)!.link } : {}) }));
  // Category chosen by hand: reuse an existing category with the same name (so "Dentists" never splits in two), else create one. Kept even when the automatic audience grouping would pick another.
  let cat: { categorySlug: string; categoryName: string; sourceJson: string } | null = null;
  const wanted = e.categoryName?.trim();
  if (wanted && wanted.toLowerCase() !== row.categoryName.toLowerCase()) {
    const built = getCategories().find((c) => c.name.toLowerCase() === wanted.toLowerCase());
    const known = (await db.selectDistinct({ s: schema.catalogProducts.categorySlug, n: schema.catalogProducts.categoryName }).from(schema.catalogProducts)).find((c) => c.n.toLowerCase() === wanted.toLowerCase());
    const found = built ? { slug: built.slug, name: built.name } : known ? { slug: known.s, name: known.n } : null;
    const slug = found?.slug ?? slugify(wanted);
    if (!slug) return { ok: false, message: "That category name has no usable letters." };
    if (!found && reservedSlugs().has(slug)) return { ok: false, message: `"${wanted}" is already used by a page on the site. Pick an existing category from the list or a different name.` };
    let src: Record<string, unknown> = {}; try { src = JSON.parse(row.sourceJson || "{}") as Record<string, unknown>; } catch { /* keep empty */ }
    cat = { categorySlug: slug, categoryName: found?.name ?? wanted, sourceJson: j({ ...src, manualCategory: true }) };
  }
  await db.update(schema.catalogProducts).set({
    ...(cat ?? {}),
    name: e.name, title: e.title || e.name, description: e.description, seoTitle: e.seoTitle || null, metaDescription: e.metaDescription || null,
    recordCount: e.recordCount, dataFieldsJson: j([...new Set(e.dataFields)]), fileFormats: e.fileFormats || null, coverage: e.coverage || null, lastUpdated: e.lastUpdated || null,
    placeholder: e.placeholder ? 1 : 0, forSale: e.forSale ? 1 : 0,
    packagesJson: j(packages), updatedAt: Math.floor(Date.now() / 1000),
  }).where(eq(schema.catalogProducts.id, id));
  return { ok: true, message: "Saved." };
}

/** A free slug: base, base-2, base-3 ... (checks products AND old-slug aliases). */
export async function uniqueSlug(db: Db, base: string, except?: string): Promise<string> {
  const root = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140) || "product";
  const taken = new Set<string>();
  const like_ = `${root}%`;
  for (const r of await db.select({ s: schema.catalogProducts.slug }).from(schema.catalogProducts).where(like(schema.catalogProducts.slug, like_))) if (r.s !== except) taken.add(r.s);
  // An old slug of ANOTHER product stays reserved (it redirects there); the product's own old slugs may be reclaimed.
  try { for (const r of await db.select({ s: schema.slugAliases.oldSlug, n: schema.slugAliases.newSlug }).from(schema.slugAliases).where(like(schema.slugAliases.oldSlug, like_))) if (r.n !== except) taken.add(r.s); } catch { /* migration 0036 not applied */ }
  const reserved = reservedSlugs();
  const free = (x: string) => !taken.has(x) && !reserved.has(x);
  if (free(root)) return root;
  for (let i = 2; i < 1000; i++) if (free(`${root}-${i}`)) return `${root}-${i}`;
  return `${root}-${Date.now()}`;
}

export const newProductSchema = productEditSchema.extend({
  categoryName: z.string().trim().min(1).max(120), countryName: z.string().trim().min(1).max(80), countryCode: z.string().trim().min(2).max(8),
  region: z.string().trim().max(80), channel: z.enum(["business-email", "consumer-email", "phone", "email"]),
});
export type NewProduct = z.infer<typeof newProductSchema>;
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Create a DRAFT product by hand. Category and country reuse an existing slug when the name matches one. */
export async function createProduct(db: Db, e: NewProduct): Promise<{ ok: boolean; message: string; id?: number; slug?: string }> {
  if (new Set(e.packages.map((k) => k.name)).size !== e.packages.length) return { ok: false, message: "Each package name can be used once." };
  const cat = getCategories().find((c) => c.name.toLowerCase() === e.categoryName.toLowerCase());
  const known = await db.select({ s: schema.catalogProducts.categorySlug, n: schema.catalogProducts.categoryName }).from(schema.catalogProducts).where(eq(schema.catalogProducts.categoryName, e.categoryName)).limit(1);
  const categorySlug = cat?.slug ?? known[0]?.s ?? slugify(e.categoryName);
  const countrySlug = getCountries().find((c) => c.name.toLowerCase() === e.countryName.toLowerCase())?.slug ?? slugify(e.countryName);
  const slug = await uniqueSlug(db, slugify(e.name) || `${countrySlug}-${categorySlug}`);
  const [r] = await db.insert(schema.catalogProducts).values({
    slug, status: "draft", name: e.name, title: e.title || e.name, description: e.description, categorySlug, categoryName: e.categoryName, channel: e.channel, grp: "general",
    countrySlug, countryCode: e.countryCode.toUpperCase(), countryName: e.countryName, region: e.region || null, recordCount: e.recordCount, packagesJson: j(e.packages),
    seoTitle: e.seoTitle || null, metaDescription: e.metaDescription || null, dataFieldsJson: j(e.dataFields), fileFormats: e.fileFormats || null, coverage: e.coverage || null,
    lastUpdated: e.lastUpdated || null, origin: "manual", placeholder: e.placeholder ? 1 : 0, forSale: e.forSale ? 1 : 0, updatedAt: Math.floor(Date.now() / 1000),
  }).returning({ id: schema.catalogProducts.id });
  return { ok: true, message: "Created as a draft.", id: r.id, slug };
}

/** Copy a product into a new DRAFT (own slug, no delivery link, no source id, no restricted override). */
export async function duplicateProduct(db: Db, id: number): Promise<{ ok: boolean; message: string; id?: number; slug?: string }> {
  const row = await getProductRow(db, id);
  if (!row) return { ok: false, message: "That product no longer exists." };
  const slug = await uniqueSlug(db, `${row.slug}-copy`);
  const { id: _id, createdAt: _c, sourceId: _s, importId: _i, ...rest } = row; // eslint-disable-line @typescript-eslint/no-unused-vars
  const packages = rowPackages(row).map(({ link: _l, ...k }) => k); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [r] = await db.insert(schema.catalogProducts).values({ ...rest, slug, name: `${row.name} (copy)`, status: "draft", origin: "manual", packagesJson: j(packages), updatedAt: Math.floor(Date.now() / 1000) }).returning({ id: schema.catalogProducts.id });
  return { ok: true, message: "Copied as a draft.", id: r.id, slug };
}

/** Copy the products defined in code into the database so the admin can edit them. Idempotent: existing slugs are left alone. */
export async function importBuiltin(db: Db): Promise<{ added: number; existing: number }> {
  let added = 0, existing = 0;
  for (const p of getStaticProducts()) {
    if ((await db.select({ id: schema.catalogProducts.id }).from(schema.catalogProducts).where(eq(schema.catalogProducts.slug, p.slug)).limit(1)).length) { existing++; continue; }
    const c = getCategory(p.categorySlug), k = getCountry(p.countrySlug);
    await db.insert(schema.catalogProducts).values({
      slug: p.slug, status: "published", name: p.name, title: p.title, description: p.description, categorySlug: p.categorySlug, categoryName: c?.name ?? p.categorySlug, channel: "business-email",
      grp: c?.kind === "general" ? "geographic" : "industry", countrySlug: p.countrySlug, countryCode: k?.code ?? "", countryName: k?.name ?? p.countrySlug, recordCount: p.recordCount,
      packagesJson: j(p.packages), dataFieldsJson: j(p.fields), lastUpdated: p.lastVerified, origin: "builtin", placeholder: p.placeholderData ? 1 : 0, forSale: p.status === "live" ? 1 : 0,
      accuracyPct: p.accuracyPct, scope: p.scope ?? "country", city: p.citySlug ?? null, updatedAt: Math.floor(Date.now() / 1000),
    });
    added++;
  }
  return { added, existing };
}

/** Set "Last updated" on many products at once (ids). */
export async function setLastUpdated(db: Db, ids: number[], date: string): Promise<number> {
  if (date !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Use the format YYYY-MM-DD");
  for (let i = 0; i < ids.length; i += 40) await db.update(schema.catalogProducts).set({ lastUpdated: date || null, updatedAt: Math.floor(Date.now() / 1000) }).where(inArray(schema.catalogProducts.id, ids.slice(i, i + 40)));
  return ids.length;
}

export const rowSamples = (r: Pick<Row, "sampleJson">): SampleRowData[] => cleanStored(parse<unknown>(r.sampleJson, []));

/** Store ALREADY MASKED sample rows (empty array removes the sample). */
export async function saveSamples(db: Db, id: number, rows: SampleRowData[]): Promise<boolean> {
  const r = await db.update(schema.catalogProducts).set({ sampleJson: rows.length ? j(cleanStored(rows)) : null, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.catalogProducts.id, id)).returning({ id: schema.catalogProducts.id });
  return r.length > 0;
}

/** The ONE real (already masked) sample shown on every product that has none of its own. Empty array removes it. */
export async function saveDefaultSample(db: Db, rows: SampleRowData[], by: string): Promise<void> {
  const v = rows.length ? j(cleanStored(rows)) : "";
  await db.insert(schema.systemSettings).values({ key: "sample.default", value: v, updatedBy: by }).onConflictDoUpdate({ target: schema.systemSettings.key, set: { value: v, updatedBy: by, updatedAt: new Date() } });
}

/** Bulk: rows grouped by product slug. Unknown slugs are reported, never created. */
export async function saveSamplesBySlug(db: Db, groups: { slug: string; rows: SampleRowData[] }[]): Promise<{ saved: number; unknown: string[] }> {
  let saved = 0; const unknown: string[] = [];
  for (const g of groups) {
    const r = await db.update(schema.catalogProducts).set({ sampleJson: g.rows.length ? j(cleanStored(g.rows)) : null, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.catalogProducts.slug, g.slug)).returning({ id: schema.catalogProducts.id });
    if (r.length) saved++; else unknown.push(g.slug);
  }
  return { saved, unknown };
}

/** Give a product a new slug. The old address keeps working (301 through `slug_aliases`), delivery links, promotion scopes and page-SEO overrides move along. Orders keep the old slug they were bought with; delivery resolves it. */
export async function renameProduct(db: Db, id: number, base: string): Promise<{ changed: boolean; from: string; to: string }> {
  const row = await getProductRow(db, id);
  if (!row) return { changed: false, from: "", to: "" };
  const to = await uniqueSlug(db, base, row.slug), from = row.slug;
  if (to === from) return { changed: false, from, to };
  await db.update(schema.catalogProducts).set({ slug: to, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.catalogProducts.id, id));
  await db.delete(schema.slugAliases).where(eq(schema.slugAliases.oldSlug, to));
  await db.update(schema.slugAliases).set({ newSlug: to }).where(eq(schema.slugAliases.newSlug, from));
  await db.insert(schema.slugAliases).values({ oldSlug: from, newSlug: to }).onConflictDoUpdate({ target: schema.slugAliases.oldSlug, set: { newSlug: to } });
  await db.update(schema.deliveryLinks).set({ productSlug: to }).where(eq(schema.deliveryLinks.productSlug, from));
  try {
    for (const p of await db.select({ id: schema.promotions.id, s: schema.promotions.productSlugs }).from(schema.promotions).where(like(schema.promotions.productSlugs, `%"${from}"%`)))
      await db.update(schema.promotions).set({ productSlugs: p.s.split(`"${from}"`).join(`"${to}"`) }).where(eq(schema.promotions.id, p.id));
  } catch { /* promotions table not present */ }
  try {
    const ov = (await db.select().from(schema.seoPageOverrides).where(eq(schema.seoPageOverrides.path, `/lists/${from}`)))[0];
    if (ov) { await db.delete(schema.seoPageOverrides).where(eq(schema.seoPageOverrides.path, `/lists/${from}`)); await db.insert(schema.seoPageOverrides).values({ ...ov, path: `/lists/${to}` }).onConflictDoNothing(); }
  } catch { /* overrides table not present */ }
  return { changed: true, from, to };
}

export type SeoOptions = { slugs: boolean; names: boolean; titles: boolean; categories?: boolean };
const GENERIC_CATS = new Set(["general targeted lists", "job titles", "healthcare professionals", "targeted email lists"]);
const catKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(ies)$/, "y").replace(/s$/, "");
/** Regenerate slug / name+H1 / SEO title+meta for products (never touches restricted flags or packages). */
export async function applySeo(db: Db, ids: number[], o: SeoOptions, dry = false): Promise<{ changed: number; slugChanged: number; sample: { id: number; from: string; to: string; name: string; seoTitle: string }[] }> {
  let changed = 0, slugChanged = 0; const sample: { id: number; from: string; to: string; name: string; seoTitle: string }[] = [];
  // Existing categories (by normalised name) so "Dentist" and "Dentists" end up in ONE category, never two.
  const cats = new Map<string, { slug: string; name: string }>();
  if (o.categories) for (const c of await db.selectDistinct({ s: schema.catalogProducts.categorySlug, n: schema.catalogProducts.categoryName }).from(schema.catalogProducts)) if (!GENERIC_CATS.has(c.n.toLowerCase())) cats.set(catKey(c.n), { slug: c.s, name: c.n });
  const taken = o.categories ? reservedSlugs() : new Set<string>();
  for (let i = 0; i < ids.length; i += 40) {
    const rows = await db.select().from(schema.catalogProducts).where(inArray(schema.catalogProducts.id, ids.slice(i, i + 40)));
    for (const r of rows) {
      const t = seoText({ name: r.name, categoryName: r.categoryName, channel: r.channel, countryName: r.countryName, region: r.region, recordCount: r.recordCount, placeholder: !!r.placeholder });
      const set: Partial<typeof schema.catalogProducts.$inferInsert> = {};
      // The audience is read from the CURRENT name, so names are only rewritten once (idempotent: the new name reduces to the same subject).
      if (o.names) { set.name = t.name; set.title = t.title; }
      if (o.titles) { set.seoTitle = t.seoTitle; set.metaDescription = t.metaDescription; }
      // Products sitting in a catch-all category move into a real one named after what the list is about.
      const shared = o.categories && !PROTECTED_CATS.has(r.categorySlug) ? categoryForSubject(t.subject) : null; // never pull a product back out of Local Businesses
      if (shared) { set.categoryName = shared.name; set.categorySlug = shared.slug; }
      else if (o.categories && !PROTECTED_CATS.has(r.categorySlug) && GENERIC_CATS.has(r.categoryName.toLowerCase()) && t.subject && !/^business$/i.test(t.subject)) {
        const k = catKey(t.subject); let c = cats.get(k);
        if (!c) { let slug = slugify(t.subject); if (taken.has(slug)) slug = `${slug}-lists`; c = { slug, name: t.subject }; cats.set(k, c); taken.add(slug); }
        set.categoryName = c.name; set.categorySlug = c.slug;
      }
      let to = r.slug;
      if (o.slugs) to = dry ? r.slug : (await renameProduct(db, r.id, t.slugBase)).to;
      if (!dry && Object.keys(set).length) await db.update(schema.catalogProducts).set({ ...set, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.catalogProducts.id, r.id));
      if (o.slugs && to !== r.slug) slugChanged++;
      changed++;
      if (sample.length < 40) sample.push({ id: r.id, from: r.slug, to: dry ? t.slugBase : to, name: o.names ? t.name : r.name, seoTitle: o.titles ? t.seoTitle : r.seoTitle ?? "" });
    }
  }
  return { changed, slugChanged, sample };
}
