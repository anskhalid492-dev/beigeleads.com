// Database Bundles: database access, validation, cache and real analytics. Every read used by the cart/checkout/public pages NEVER throws:
// before migration 0044 the result is "no bundles", so the rest of the site is unaffected.
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getProduct, offeredPackages } from "@/lib/catalog";
import { getDbFromEnv, schema } from "@/lib/db";

import { slugify } from "@/lib/geo/rules";
import { isTestNetwork, optionForWallet } from "@/lib/payments/options";
import { MAX_BUNDLE_ITEMS, priceBundle, publishProblems, type BundleContext, type BundleDef, type BundleItem } from "./pricing";

type Db = ReturnType<typeof getDbFromEnv>;
export class BundleError extends Error {}
const KEY = "bundles:pub:v1";

const arr = <T,>(raw: string, ok: (x: unknown) => x is T): T[] => { try { const j = JSON.parse(raw) as unknown; return Array.isArray(j) ? j.filter(ok) : []; } catch { return []; } };
const isItem = (x: unknown): x is BundleItem => !!x && typeof x === "object" && typeof (x as BundleItem).slug === "string" && typeof (x as BundleItem).pkg === "string";
const isStr = (x: unknown): x is string => typeof x === "string";

export function rowToDef(r: typeof schema.bundles.$inferSelect): BundleDef {
  return {
    id: r.id, slug: r.slug, name: r.name, shortDescription: r.shortDescription, description: r.description, categorySlug: r.categorySlug, label: r.label, image: r.image,
    items: arr(r.itemsJson, isItem), priceMode: r.priceMode, discountPercent: r.discountPercent, fixedPriceCents: r.fixedPriceCents, featured: !!r.featured,
    status: r.status, excluded: arr(r.excludedJson, isStr), seoTitle: r.seoTitle, metaDescription: r.metaDescription, sortOrder: r.sortOrder,
  };
}

/** Published bundles. `fresh` skips the 60 s cache (createOrder always reads fresh). Never throws. */
export async function loadPublished(env: CloudflareEnv, fresh = false): Promise<BundleDef[]> {
  try {
    if (!fresh) { const c = await env.CACHE.get(KEY); if (c) return JSON.parse(c) as BundleDef[]; }
    const rows = await getDbFromEnv(env).select().from(schema.bundles).where(eq(schema.bundles.status, "published")).orderBy(desc(schema.bundles.featured), asc(schema.bundles.sortOrder), asc(schema.bundles.id));
    const defs = rows.map(rowToDef);
    await env.CACHE.put(KEY, JSON.stringify(defs), { expirationTtl: 60 }).catch(() => undefined);
    return defs;
  } catch { return []; }
}
export const clearBundleCache = (env: CloudflareEnv) => env.CACHE.delete(KEY).catch(() => undefined);

export type BundleCategory = { id: number; slug: string; name: string; sortOrder: number };
export async function loadCategories(db: Db): Promise<BundleCategory[]> {
  try { return await db.select().from(schema.bundleCategories).orderBy(asc(schema.bundleCategories.sortOrder), asc(schema.bundleCategories.name)); } catch { return []; }
}

// ---------------------------------------------------------------- admin input

const cents = (label: string) => z.preprocess((v) => (v === "" || v == null ? 0 : Math.round(Number(v) * 100)), z.number({ error: `${label} must be a number.` }).int().min(0).max(100_000_00));
export const bundleInput = z.object({
  name: z.string().trim().min(2, "Give the bundle a name.").max(80),
  slug: z.string().trim().toLowerCase().max(80).default(""),
  shortDescription: z.string().trim().max(200, "The short description can be up to 200 characters.").default(""),
  description: z.string().trim().max(4000).default(""),
  categorySlug: z.string().trim().max(60).default(""),
  label: z.string().trim().max(24, "The label can be up to 24 characters.").default(""),
  image: z.string().trim().max(300).default("").refine((v) => v === "" || /^\/media\/[\w./-]+$/.test(v) || /^https:\/\/[^\s]+$/.test(v), "The image must be a /media/ address or an https link."),
  items: z.array(z.object({ slug: z.string().trim().min(1).max(80), pkg: z.string().trim().min(1).max(40) })).max(MAX_BUNDLE_ITEMS, `A bundle can hold up to ${MAX_BUNDLE_ITEMS} databases.`).default([]),
  priceMode: z.enum(["percent", "fixed"]),
  discountPercent: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0).max(90, "The discount can be up to 90%.")),
  fixedPrice: cents("Bundle price"),
  featured: z.coerce.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
  excluded: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  seoTitle: z.string().trim().max(70, "The SEO title can be up to 70 characters.").default(""),
  metaDescription: z.string().trim().max(170, "The meta description can be up to 170 characters.").default(""),
  sortOrder: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0).max(9999)),
});
export type BundleInput = z.infer<typeof bundleInput>;

function toRow(i: BundleInput, slug: string) {
  return {
    slug, name: i.name, shortDescription: i.shortDescription, description: i.description, categorySlug: i.categorySlug, label: i.label, image: i.image,
    itemsJson: JSON.stringify(i.items), priceMode: i.priceMode, discountPercent: i.priceMode === "percent" ? i.discountPercent : 0, fixedPriceCents: i.priceMode === "fixed" ? i.fixedPrice : 0,
    featured: i.featured ? 1 : 0, status: i.status, excludedJson: JSON.stringify(i.excluded), seoTitle: i.seoTitle, metaDescription: i.metaDescription, sortOrder: i.sortOrder, updatedAt: Math.floor(Date.now() / 1000),
  };
}
export const defOf = (i: BundleInput, slug: string, id = 0): BundleDef => ({
  id, slug, name: i.name, shortDescription: i.shortDescription, description: i.description, categorySlug: i.categorySlug, label: i.label, image: i.image, items: i.items,
  priceMode: i.priceMode, discountPercent: i.priceMode === "percent" ? i.discountPercent : 0, fixedPriceCents: i.priceMode === "fixed" ? i.fixedPrice : 0,
  featured: i.featured, status: i.status, excluded: i.excluded, seoTitle: i.seoTitle, metaDescription: i.metaDescription, sortOrder: i.sortOrder,
});

async function check(db: Db, i: BundleInput, id: number | null, ctx: BundleContext): Promise<string> {
  const slug = slugify(i.slug || i.name);
  if (!slug) throw new BundleError("Enter a URL name made of letters or numbers.");
  const [same] = await db.select({ id: schema.bundles.id }).from(schema.bundles).where(eq(schema.bundles.slug, slug));
  if (same && same.id !== id) throw new BundleError("Another bundle already uses this URL name.");
  if (i.categorySlug) {
    const cats = await loadCategories(db);
    if (!cats.some((c) => c.slug === i.categorySlug)) throw new BundleError("Choose one of the bundle categories.");
  }
  for (const it of i.items) {
    const p = getProduct(it.slug);
    if (!p) throw new BundleError(`"${it.slug}" is not a product in the catalog.`);
    if (!offeredPackages(p).some((k) => k.name === it.pkg)) throw new BundleError(`${p.name} has no ${it.pkg} package.`);
  }
  if (i.priceMode === "percent" && i.status === "published" && i.discountPercent < 1) throw new BundleError("Set a discount of at least 1%, or choose a fixed price.");
  if (i.status === "published") {
    const problems = publishProblems(defOf(i, slug, id ?? 0), ctx);
    if (problems.length) throw new BundleError(`It cannot be published yet. ${problems[0]}`);
  }
  return slug;
}

export async function createBundle(db: Db, i: BundleInput, ctx: BundleContext): Promise<number> {
  const slug = await check(db, i, null, ctx);
  const [r] = await db.insert(schema.bundles).values(toRow(i, slug)).returning({ id: schema.bundles.id });
  return r.id;
}
export async function updateBundle(db: Db, id: number, i: BundleInput, ctx: BundleContext): Promise<void> {
  const slug = await check(db, i, id, ctx);
  await db.update(schema.bundles).set(toRow(i, slug)).where(eq(schema.bundles.id, id));
}
export async function getBundleById(db: Db, id: number): Promise<BundleDef | null> {
  try { const [r] = await db.select().from(schema.bundles).where(eq(schema.bundles.id, id)); return r ? rowToDef(r) : null; } catch { return null; }
}
export async function getPublishedBySlug(env: CloudflareEnv, slug: string): Promise<BundleDef | null> {
  return (await loadPublished(env)).find((b) => b.slug === slug) ?? null;
}
export async function listAll(db: Db): Promise<BundleDef[] | null> {
  try { return (await db.select().from(schema.bundles).orderBy(desc(schema.bundles.id))).map(rowToDef); } catch { return null; }
}
/** Publish / unpublish. Publishing re-checks everything against the live catalog. */
export async function setBundleStatus(db: Db, id: number, status: "draft" | "published", ctx: BundleContext): Promise<void> {
  const d = await getBundleById(db, id);
  if (!d) throw new BundleError("Bundle not found.");
  if (status === "published") { const p = publishProblems(d, ctx); if (p.length) throw new BundleError(`It cannot be published yet. ${p[0]}`); }
  await db.update(schema.bundles).set({ status, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.bundles.id, id));
}
export async function duplicateBundle(db: Db, id: number): Promise<number> {
  const d = await getBundleById(db, id);
  if (!d) throw new BundleError("Bundle not found.");
  let slug = `${d.slug}-copy`; let n = 2;
  while ((await db.select({ id: schema.bundles.id }).from(schema.bundles).where(eq(schema.bundles.slug, slug))).length) slug = `${d.slug}-copy-${n++}`;
  const [r] = await db.insert(schema.bundles).values({ ...toRowFromDef(d, slug), status: "draft", featured: 0, name: `${d.name} (copy)` }).returning({ id: schema.bundles.id });
  return r.id;
}
const toRowFromDef = (d: BundleDef, slug: string) => ({
  slug, name: d.name, shortDescription: d.shortDescription, description: d.description, categorySlug: d.categorySlug, label: d.label, image: d.image, itemsJson: JSON.stringify(d.items),
  priceMode: d.priceMode, discountPercent: d.discountPercent, fixedPriceCents: d.fixedPriceCents, featured: d.featured ? 1 : 0, status: d.status, excludedJson: JSON.stringify(d.excluded),
  seoTitle: d.seoTitle, metaDescription: d.metaDescription, sortOrder: d.sortOrder,
});
/** A bundle that was ever bought cannot be deleted (the order history keeps its name); unpublish it instead. */
export async function deleteBundle(db: Db, id: number): Promise<void> {
  const d = await getBundleById(db, id);
  if (!d) return;
  const sold = await db.select({ id: schema.orderBundles.id }).from(schema.orderBundles).where(eq(schema.orderBundles.bundleSlug, d.slug)).limit(1).catch(() => []);
  if (sold.length) throw new BundleError("This bundle has orders. Unpublish it instead of deleting it.");
  await db.delete(schema.bundles).where(eq(schema.bundles.id, id));
}

// ---------------------------------------------------------------- categories

const catInput = z.object({ name: z.string().trim().min(2, "Enter a category name.").max(40), sortOrder: z.coerce.number().int().min(0).max(999).default(0) });
export async function saveCategory(db: Db, raw: unknown, id?: number): Promise<void> {
  const p = catInput.safeParse(raw);
  if (!p.success) throw new BundleError(p.error.issues[0]?.message ?? "Check the category.");
  const slug = slugify(p.data.name);
  if (!slug) throw new BundleError("Enter a category name made of letters or numbers.");
  const [dupe] = await db.select({ id: schema.bundleCategories.id }).from(schema.bundleCategories).where(eq(schema.bundleCategories.slug, slug));
  if (dupe && dupe.id !== id) throw new BundleError("This category already exists.");
  if (id) {
    const [old] = await db.select().from(schema.bundleCategories).where(eq(schema.bundleCategories.id, id));
    if (!old) throw new BundleError("Category not found.");
    await db.update(schema.bundleCategories).set({ slug, name: p.data.name, sortOrder: p.data.sortOrder }).where(eq(schema.bundleCategories.id, id));
    if (old.slug !== slug) await db.update(schema.bundles).set({ categorySlug: slug }).where(eq(schema.bundles.categorySlug, old.slug));
  } else await db.insert(schema.bundleCategories).values({ slug, name: p.data.name, sortOrder: p.data.sortOrder });
}
export async function deleteCategory(db: Db, id: number): Promise<void> {
  const [c] = await db.select().from(schema.bundleCategories).where(eq(schema.bundleCategories.id, id));
  if (!c) return;
  const used = await db.select({ id: schema.bundles.id }).from(schema.bundles).where(eq(schema.bundles.categorySlug, c.slug)).limit(1);
  if (used.length) throw new BundleError("Bundles use this category. Move them to another category first.");
  await db.delete(schema.bundleCategories).where(eq(schema.bundleCategories.id, id));
}

// ---------------------------------------------------------------- analytics (real orders only)

export type BundleStats = {
  published: number; drafts: number; purchases: number; revenueCents: number; ordersWithBundle: number; avgOrderCents: number;
  top: { slug: string; name: string; purchases: number; revenueCents: number }[]; testExcluded: number;
};
/** Paid orders only. Test-network payments are left out and counted separately; nothing is estimated. */
export async function loadStats(db: Db): Promise<BundleStats | null> {
  try {
    const all = await db.select({ status: schema.bundles.status }).from(schema.bundles);
    const rows = await db.select().from(schema.orderBundles);
    const ids = [...new Set(rows.map((r) => r.orderId))];
    const paid = new Map<string, number>();
    const real = new Set<string>();
    let testExcluded = 0;
    for (let i = 0; i < ids.length; i += 90) {
      const slice = ids.slice(i, i + 90);
      for (const o of await db.select({ id: schema.orders.id, total: schema.orders.totalUsdCents }).from(schema.orders).where(and(inArray(schema.orders.id, slice), eq(schema.orders.status, "paid")))) paid.set(o.id, o.total);
      const att = await db.select({ orderId: schema.paymentAttempts.orderId, coin: schema.paymentAttempts.coin, network: schema.paymentAttempts.network }).from(schema.paymentAttempts).where(and(inArray(schema.paymentAttempts.orderId, slice), eq(schema.paymentAttempts.status, "paid")));
      for (const a of att) { const o = optionForWallet(a.coin, a.network); if (o && isTestNetwork(o, a.network)) testExcluded++; else real.add(a.orderId); }
    }
    const done = rows.filter((r) => paid.has(r.orderId) && real.has(r.orderId));
    const orders = [...new Set(done.map((r) => r.orderId))];
    const by = new Map<string, { slug: string; name: string; purchases: number; revenueCents: number }>();
    for (const r of done) { const t = by.get(r.bundleSlug) ?? { slug: r.bundleSlug, name: r.bundleName, purchases: 0, revenueCents: 0 }; t.purchases++; t.revenueCents += r.priceCents; by.set(r.bundleSlug, t); }
    const orderTotal = orders.reduce((s, id) => s + (paid.get(id) ?? 0), 0);
    return {
      published: all.filter((b) => b.status === "published").length, drafts: all.filter((b) => b.status !== "published").length,
      purchases: done.length, revenueCents: done.reduce((s, r) => s + r.priceCents, 0), ordersWithBundle: orders.length, avgOrderCents: orders.length ? Math.round(orderTotal / orders.length) : 0,
      top: [...by.values()].sort((a, b) => b.purchases - a.purchases || b.revenueCents - a.revenueCents).slice(0, 5), testExcluded,
    };
  } catch { return null; }
}

export { priceBundle };
