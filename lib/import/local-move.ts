// Local Businesses Database: category reorganisation of EXISTING products (section 111). Creates no product, copies none, deletes none.
// Moving = changing a product's category in D1 (its id, slug, URL, price, packages, delivery link, SEO text and orders are untouched).
// Every move is logged in `catalog_category_moves` so a whole batch can be undone.
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getStaticProducts, getCategory } from "@/lib/catalog";
import { schema } from "@/lib/db";
import { classifyLocal, LOCAL_NAME, LOCAL_SLUG, type LocalVerdict } from "./local-business";
import { importBuiltin } from "./store";

type Db = ReturnType<typeof import("@/lib/db").getDbFromEnv>;

export type ScanItem = LocalVerdict & { id: number | null; slug: string; name: string; status: string; categorySlug: string; categoryName: string; inDatabase: boolean; alreadyMoved: boolean; countryName: string };
export type Scan = { items: ScanItem[]; scanned: number; moves: number; review: number; keep: number; already: number; builtinNotInDb: number };

export async function movesReady(db: Db): Promise<boolean> {
  try { await db.select({ n: sql<number>`count(*)` }).from(schema.catalogCategoryMoves); return true; } catch { return false; }
}

/** Scan the WHOLE catalog (every database row, plus built-in code products that are not in the database yet). Writes nothing. */
export async function scanLocal(db: Db): Promise<Scan> {
  const rows = await db.select().from(schema.catalogProducts);
  const items: ScanItem[] = rows.map((r) => ({
    ...classifyLocal({ name: r.name, categoryName: r.categoryName, channel: r.channel, grp: r.grp, countryName: r.countryName, region: r.region }),
    id: r.id, slug: r.slug, name: r.name, status: r.status, categorySlug: r.categorySlug, categoryName: r.categoryName, inDatabase: true, alreadyMoved: r.categorySlug === LOCAL_SLUG, countryName: r.countryName,
  }));
  const inDb = new Set(rows.map((r) => r.slug));
  for (const p of getStaticProducts()) {
    if (inDb.has(p.slug)) continue;
    const cat = getCategory(p.categorySlug);
    items.push({
      ...classifyLocal({ name: p.name, categoryName: cat?.name ?? p.categorySlug, channel: "business-email", grp: cat?.kind === "general" ? "geographic" : "industry", countryName: "United States", region: "" }),
      id: null, slug: p.slug, name: p.name, status: p.status === "live" ? "published" : "draft", categorySlug: p.categorySlug, categoryName: cat?.name ?? p.categorySlug, inDatabase: false, alreadyMoved: false, countryName: p.countrySlug,
    });
  }
  const already = items.filter((i) => i.alreadyMoved).length;
  const open = items.filter((i) => !i.alreadyMoved);
  return {
    items, scanned: items.length, already,
    moves: open.filter((i) => i.decision === "move").length, review: open.filter((i) => i.decision === "review").length, keep: open.filter((i) => i.decision === "keep").length,
    builtinNotInDb: items.filter((i) => !i.inDatabase && i.decision === "move").length,
  };
}

/** Move the given products (by slug). Each slug is classified again on the server: a product the classifier says to KEEP is never moved. */
export async function applyLocal(db: Db, slugs: string[], opts: { batch: string; copyBuiltin: boolean; allowReview: boolean }): Promise<{ moved: number; skipped: number; copied: number; notes: string[] }> {
  const notes: string[] = []; let copied = 0;
  const wanted = new Set(slugs);
  const scan = await scanLocal(db);
  const pickable = (i: ScanItem) => wanted.has(i.slug) && !i.alreadyMoved && (i.decision === "move" || (opts.allowReview && i.decision === "review"));
  if (opts.copyBuiltin && scan.items.some((i) => !i.inDatabase && pickable(i))) { const r = await importBuiltin(db); copied = r.added; if (r.added) notes.push(`${r.added} built-in product(s) copied into the database with their original slug (no duplicates: the database row replaces the code product).`); }
  const fresh = opts.copyBuiltin ? await scanLocal(db) : scan;
  const targets = fresh.items.filter((i) => pickable(i) && i.id !== null);
  const left = fresh.items.filter((i) => pickable(i) && i.id === null).length;
  if (left) notes.push(`${left} built-in product(s) were skipped because they are not in the database yet (tick "copy built-in products").`);
  const now = Math.floor(Date.now() / 1000); let moved = 0;
  for (const t of targets) {
    await db.batch([
      db.insert(schema.catalogCategoryMoves).values({ batch: opts.batch, productId: t.id!, productSlug: t.slug, fromCategorySlug: t.categorySlug, fromCategoryName: t.categoryName, toCategorySlug: LOCAL_SLUG, reason: t.reason.slice(0, 200), movedAt: now }),
      db.update(schema.catalogProducts).set({ categorySlug: LOCAL_SLUG, categoryName: LOCAL_NAME, updatedAt: now }).where(eq(schema.catalogProducts.id, t.id!)),
    ]);
    moved++;
  }
  return { moved, skipped: slugs.length - moved, copied, notes };
}

/** Undo one batch: every product goes back to the category it had. */
export async function rollbackLocal(db: Db, batch: string): Promise<number> {
  const rows = await db.select().from(schema.catalogCategoryMoves).where(and(eq(schema.catalogCategoryMoves.batch, batch), isNull(schema.catalogCategoryMoves.rolledBackAt)));
  const now = Math.floor(Date.now() / 1000);
  for (const r of rows) {
    await db.batch([
      db.update(schema.catalogProducts).set({ categorySlug: r.fromCategorySlug, categoryName: r.fromCategoryName, updatedAt: now }).where(eq(schema.catalogProducts.id, r.productId)),
      db.update(schema.catalogCategoryMoves).set({ rolledBackAt: now }).where(eq(schema.catalogCategoryMoves.id, r.id)),
    ]);
  }
  return rows.length;
}

export async function listBatches(db: Db): Promise<{ batch: string; movedAt: number; total: number; active: number }[]> {
  const rows = await db.select().from(schema.catalogCategoryMoves).orderBy(desc(schema.catalogCategoryMoves.movedAt)).limit(2000);
  const m = new Map<string, { batch: string; movedAt: number; total: number; active: number }>();
  for (const r of rows) { const b = m.get(r.batch) ?? { batch: r.batch, movedAt: r.movedAt, total: 0, active: 0 }; b.total++; if (!r.rolledBackAt) b.active++; m.set(r.batch, b); }
  return [...m.values()];
}

/** Product ids that were moved into the category (used by tests and the verification report). */
export async function movedIds(db: Db): Promise<number[]> {
  return (await db.select({ id: schema.catalogProducts.id }).from(schema.catalogProducts).where(eq(schema.catalogProducts.categorySlug, LOCAL_SLUG))).map((r) => r.id);
}

/** Create the US local-business landing pages as DRAFT products (section 137). Idempotent: a type whose list name already exists is skipped. */
export async function createUsLocalPages(db: Db): Promise<{ created: number; existing: number; failed: number; slugs: string[] }> {
  const { allUsTypes, usLocalProduct } = await import("./us-local-types");
  const { createProduct } = await import("./store");
  let created = 0, existing = 0, failed = 0; const slugs: string[] = [];
  for (const t of allUsTypes()) {
    const p = usLocalProduct(t.type);
    const dup = await db.select({ id: schema.catalogProducts.id }).from(schema.catalogProducts).where(eq(schema.catalogProducts.name, p.name)).limit(1);
    if (dup.length) { existing++; continue; }
    try { const r = await createProduct(db, p); if (r.ok && r.slug) { created++; slugs.push(r.slug); } else failed++; } catch { failed++; }
  }
  return { created, existing, failed, slugs };
}
