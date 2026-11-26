// Applies the Local Businesses standard (section 171) to existing products. Skips products that already have BOTH an SEO title and a meta description.
import { eq } from "drizzle-orm";
import { schema } from "@/lib/db";
type Db = ReturnType<typeof import("@/lib/db").getDbFromEnv>;
import { getProductRow, rowFields, rowPackages, setProductSlug, uniqueSlug, updateProduct } from "@/lib/import/store";
import { LOCAL_SLUG } from "@/lib/import/local-business";
import { STANDARD_PACKAGES, standardize, type MetaPrefix, type Std } from "@/lib/import/local-standard";

const fieldsCustomOf = (sourceJson: string | null) => { try { return !!(JSON.parse(sourceJson || "{}") as { fieldsCustom?: boolean }).fieldsCustom; } catch { return false; } };

export async function localStandardIds(db: Db): Promise<{ total: number; todo: number[]; skipped: number }> {
  const rows = await db.select({ id: schema.catalogProducts.id, s: schema.catalogProducts.seoTitle, m: schema.catalogProducts.metaDescription }).from(schema.catalogProducts).where(eq(schema.catalogProducts.categorySlug, LOCAL_SLUG));
  const todo = rows.filter((r) => !(r.s?.trim() && r.m?.trim())).map((r) => r.id);
  return { total: rows.length, todo, skipped: rows.length - todo.length };
}

async function plan(db: Db, id: number, prefix: MetaPrefix, taken: Set<string>) {
  const row = await getProductRow(db, id);
  if (!row || row.categorySlug !== LOCAL_SLUG) return null;
  const std = standardize({ slug: row.slug, name: row.name, categoryName: row.categoryName, channel: row.channel, countryName: row.countryName, region: row.region, seoTitle: row.seoTitle, metaDescription: row.metaDescription, dataFields: rowFields(row), fieldsCustom: fieldsCustomOf(row.sourceJson) }, prefix, taken);
  return { row, std };
}

export type StdPreview = { id: number; slug: string; newSlug: string; name: string; title: string; seoTitle: string; metaDescription: string };
export async function previewStandard(db: Db, ids: number[], prefix: MetaPrefix): Promise<StdPreview[]> {
  const taken = new Set<string>(); const out: StdPreview[] = [];
  for (const id of ids) { const p = await plan(db, id, prefix, taken); if (!p || p.std.skip) continue; taken.add(p.std.metaDescription.toLowerCase()); out.push({ id, slug: p.row.slug, newSlug: p.std.slugBase, name: p.std.name, title: p.std.title, seoTitle: p.std.seoTitle, metaDescription: p.std.metaDescription }); }
  return out;
}

export async function applyStandard(db: Db, ids: number[], prefix: MetaPrefix): Promise<{ changed: number; skipped: number; slugKept: number; failed: string[] }> {
  // Meta descriptions already used by other products in the category stay unique.
  const taken = new Set<string>((await db.select({ m: schema.catalogProducts.metaDescription }).from(schema.catalogProducts).where(eq(schema.catalogProducts.categorySlug, LOCAL_SLUG))).map((r) => (r.m ?? "").toLowerCase()).filter(Boolean));
  let changed = 0, skipped = 0, slugKept = 0; const failed: string[] = [];
  for (const id of ids) {
    const p = await plan(db, id, prefix, taken);
    if (!p || p.std.skip) { skipped++; continue; }
    const { row, std } = p; const old = rowPackages(row);
    const r = await updateProduct(db, id, {
      name: std.name, title: std.title, description: std.description, seoTitle: std.seoTitle, metaDescription: std.metaDescription,
      recordCount: row.recordCount, dataFields: std.dataFields, fieldsCustom: std.fieldsCustom, fileFormats: row.fileFormats ?? "", coverage: std.coverage, lastUpdated: row.lastUpdated ?? "",
      placeholder: !!row.placeholder, forSale: !!row.forSale,
      packages: STANDARD_PACKAGES.map((k, n) => ({ ...k, name: old[n]?.name ?? k.name })),
    });
    if (!r.ok) { failed.push(`${row.slug}: ${r.message}`); continue; }
    taken.add(std.metaDescription.toLowerCase()); changed++;
    await renameTo(db, id, std, row.countrySlug).then((ok) => { if (!ok) slugKept++; });
  }
  return { changed, skipped, slugKept, failed };
}

async function renameTo(db: Db, id: number, std: Std, countrySlug: string): Promise<boolean> {
  for (const cand of [std.slugBase, `${std.slugBase}-${countrySlug}`, await uniqueSlug(db, std.slugBase)]) {
    const r = await setProductSlug(db, id, cand);
    if (r.ok) return true;
  }
  return false;
}
