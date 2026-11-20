// Bulk delivery links (owner request, 20 Nov 2026): works on EVERY product the owner can sell, including imported drafts that are not
// in the public catalog yet, so links can be added before publishing.
import { getProducts } from "@/lib/catalog";
import { getDbFromEnv, schema } from "@/lib/db";
import { checkRow, type LinkOutcome, type LinkRow, type LinkTarget } from "@/lib/delivery/bulk-check";

type Db = ReturnType<typeof getDbFromEnv>;
export type { LinkOutcome, LinkRow, LinkTarget };

/** Every sellable product: the code catalog plus ALL imported rows (draft, published, archived). */
export async function linkTargets(db: Db): Promise<LinkTarget[]> {
  const out = new Map<string, LinkTarget>();
  for (const p of getProducts().filter((x) => !x.imported)) out.set(p.slug, { slug: p.slug, name: p.name, status: p.status, packages: p.packages.map((k) => k.name) });
  try {
    const rows = await db.select({ slug: schema.catalogProducts.slug, name: schema.catalogProducts.name, status: schema.catalogProducts.status, pk: schema.catalogProducts.packagesJson }).from(schema.catalogProducts);
    for (const r of rows) {
      let names: string[] = [];
      try { names = (JSON.parse(r.pk || "[]") as { name: string }[]).map((k) => k.name); } catch { /* keep empty */ }
      out.set(r.slug, { slug: r.slug, name: r.name, status: r.status, packages: names });
    }
  } catch { /* import tables not applied */ }
  return [...out.values()];
}

export async function existingLinks(db: Db): Promise<Map<string, string>> {
  const rows = await db.select({ s: schema.deliveryLinks.productSlug, p: schema.deliveryLinks.packageName, u: schema.deliveryLinks.url }).from(schema.deliveryLinks);
  return new Map(rows.map((r) => [`${r.s}\u0000${r.p}`, r.u]));
}

export async function applyLinks(db: Db, actor: string, rows: LinkRow[], replace: boolean): Promise<LinkOutcome[]> {
  const targets = new Map((await linkTargets(db)).map((t) => [t.slug, t]));
  const have = await existingLinks(db);
  const out: LinkOutcome[] = [];
  for (const r of rows) {
    const c = checkRow(r, targets);
    if (!c.ok) { out.push({ slug: r.slug, pkg: r.pkg, result: "failed", reason: c.reason }); continue; }
    const key = `${r.slug}\u0000${r.pkg}`, old = have.get(key);
    if (old === c.url) { out.push({ slug: r.slug, pkg: r.pkg, result: "same" }); continue; }
    if (old && !replace) { out.push({ slug: r.slug, pkg: r.pkg, result: "skipped", reason: "already has a different link" }); continue; }
    try {
      await db.insert(schema.deliveryLinks).values({ productSlug: r.slug, packageName: r.pkg, url: c.url, updatedBy: `bulk:${actor}` })
        .onConflictDoUpdate({ target: [schema.deliveryLinks.productSlug, schema.deliveryLinks.packageName], set: { url: c.url, updatedBy: `bulk:${actor}`, updatedAt: new Date() } });
      have.set(key, c.url);
      out.push({ slug: r.slug, pkg: r.pkg, result: old ? "replaced" : "added" });
    } catch { out.push({ slug: r.slug, pkg: r.pkg, result: "failed", reason: "database error" }); }
  }
  return out;
}

