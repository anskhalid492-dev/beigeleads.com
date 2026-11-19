// Admin-managed taxonomy (migration 0031). The built-in tree in lib/taxonomy.ts is the default:
// while the table is missing or EMPTY the code tree is used. Once any row exists the database is the single source of truth.
import { and, asc, eq } from "drizzle-orm";
import { getCategories, getProducts } from "@/lib/catalog";
import { slugify } from "@/lib/geo/rules";
import { schema, type getDbFromEnv } from "@/lib/db";
import { TAXONOMY, type Compliance, type TaxGroup, type TaxIcon, type TaxStatus } from "@/lib/taxonomy";

type Db = ReturnType<typeof getDbFromEnv>;
type Row = typeof schema.taxonomyNodes.$inferSelect;
export const TAX_CACHE_KEY = "taxonomy:v1";
export const ICONS: TaxIcon[] = ["mail", "phone", "message", "briefcase", "users", "building", "globe"];
const RESERVED = new Set(["admin", "api", "_next", "media", "checkout", "download", "opt-out", "us"]);

const parseSlugs = (s: string): string[] => { try { const v = JSON.parse(s); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []; } catch { return []; } };
const toNode = (r: Row) => ({
  id: r.id, slug: r.slug, name: r.name, short: r.short, blurb: r.blurb,
  status: (r.status === "available" ? "available" : "upcoming") as TaxStatus,
  ...(r.compliance ? { compliance: r.compliance as Compliance } : {}),
  seoTitle: r.seoTitle, metaDescription: r.metaDescription, content: r.content, productSlugs: parseSlugs(r.productSlugs),
  featured: !!r.featured, menuVisible: !!r.menuVisible, published: !!r.published,
});
const order = (a: Row, b: Row) => b.featured - a.featured || a.sortOrder - b.sortOrder || a.id - b.id;

/** Rows -> tree. Children of an unknown parent are dropped. */
export function buildTree(rows: Row[]): TaxGroup[] {
  const tops = rows.filter((r) => r.parentSlug === "").sort(order);
  return tops.map((g) => ({ ...toNode(g), menuName: g.menuName || g.name, icon: (ICONS.includes(g.icon as TaxIcon) ? g.icon : "mail") as TaxIcon, children: rows.filter((r) => r.parentSlug === g.slug).sort(order).map(toNode) }));
}

/** Public tree: published only (menu visibility is applied by the menu, pages still render). Never throws. */
export async function loadTaxonomy(env: { DB: D1Database; CACHE: KVNamespace }, db: Db): Promise<TaxGroup[]> {
  try {
    const hit = await env.CACHE.get(TAX_CACHE_KEY, "json");
    if (hit) return hit as TaxGroup[];
  } catch { /* cache is optional */ }
  let out: TaxGroup[] = TAXONOMY;
  try {
    const rows = await db.select().from(schema.taxonomyNodes).limit(500);
    if (rows.length > 0) out = buildTree(rows).filter((g) => g.published).map((g) => ({ ...g, children: g.children.filter((c) => c.published) }));
  } catch { /* migration 0031 not applied: built-in tree */ }
  try { await env.CACHE.put(TAX_CACHE_KEY, JSON.stringify(out), { expirationTtl: 60 }); } catch { /* ignore */ }
  return out;
}

export const menuTree = (tax: TaxGroup[]): TaxGroup[] => tax.filter((g) => g.menuVisible !== false).map((g) => ({ ...g, children: g.children.filter((c) => c.menuVisible !== false) }));

export async function loadTaxonomyAdmin(db: Db): Promise<{ ready: boolean; rows: Row[] }> {
  try { return { ready: true, rows: await db.select().from(schema.taxonomyNodes).orderBy(asc(schema.taxonomyNodes.id)).limit(500) }; } catch { return { ready: false, rows: [] }; }
}
export const clearTaxCache = async (env: { CACHE: KVNamespace }) => { try { await env.CACHE.delete(TAX_CACHE_KEY); } catch { /* expires within a minute */ } };

export const catalogProductOptions = () => getCategories().flatMap((c) => getProducts(c.slug).map((p) => ({ slug: p.slug, name: p.name })));

/** Copy the built-in tree into D1. Idempotent: existing rows are never overwritten. Available nodes map to every current product. */
export async function importBuiltIn(db: Db): Promise<number> {
  const all = JSON.stringify(catalogProductOptions().map((p) => p.slug));
  let n = 0;
  for (const [gi, g] of TAXONOMY.entries()) {
    const base = { updatedAt: Math.floor(Date.now() / 1000) };
    const top = await db.insert(schema.taxonomyNodes).values({ ...base, parentSlug: "", slug: g.slug, name: g.name, menuName: g.menuName, icon: g.icon, short: g.short, blurb: g.blurb, status: g.status, compliance: g.compliance ?? "", sortOrder: gi * 10, productSlugs: g.status === "available" ? all : "[]" }).onConflictDoNothing().returning({ id: schema.taxonomyNodes.id });
    n += top.length;
    for (const [ci, c] of g.children.entries()) {
      const r = await db.insert(schema.taxonomyNodes).values({ ...base, parentSlug: g.slug, slug: c.slug, name: c.name, short: c.short, blurb: c.blurb, status: c.status, compliance: c.compliance ?? "", sortOrder: ci * 10, productSlugs: c.status === "available" ? all : "[]" }).onConflictDoNothing().returning({ id: schema.taxonomyNodes.id });
      n += r.length;
    }
  }
  return n;
}

export type NodeInput = { id?: number; parent: string; slug: string; name: string; menuName: string; icon: string; short: string; blurb: string; status: string; compliance: string; featured: boolean; menuVisible: boolean; published: boolean; seoTitle: string; metaDescription: string; content: string; products: string[] };
export type CleanNode = Omit<typeof schema.taxonomyNodes.$inferInsert, "id" | "updatedAt">;

/** Pure validation. `topSlugs` = existing top-level slugs (for collisions and parent checks). */
export function cleanNode(i: NodeInput, ctx: { topSlugs: string[]; isNew: boolean; productSlugs: string[]; industrySlugs: string[] }): { value?: CleanNode; error?: string } {
  const t = (s: unknown, max: number) => String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
  const name = t(i.name, 80);
  if (name.length < 2) return { error: "Give the category a name (at least 2 characters)." };
  const slug = slugify(t(i.slug || i.name, 60));
  if (!slug) return { error: "The URL name is empty." };
  if (RESERVED.has(slug)) return { error: "That URL name is reserved." };
  const parent = t(i.parent, 60);
  if (parent && !ctx.topSlugs.includes(parent)) return { error: "Choose an existing top-level category as the parent." };
  if (ctx.isNew && !parent && (ctx.topSlugs.includes(slug) || ctx.industrySlugs.includes(slug))) return { error: "A category or industry already uses that URL name." };
  if (!ICONS.includes(i.icon as TaxIcon)) return { error: "Choose one of the listed icons." };
  const compliance = ["consumer", "whatsapp", "phone"].includes(i.compliance) ? i.compliance : "";
  let status: TaxStatus = i.status === "available" ? "available" : "upcoming";
  const products = [...new Set(i.products.filter((p) => ctx.productSlugs.includes(p)))];
  if (compliance && status === "available") return { error: "Consumer, WhatsApp and phone categories cannot be marked Available until a lawful way to sell them is decided. Keep them Upcoming." };
  if (status === "available" && products.length === 0) return { error: "Available needs at least one real product mapped to it. Map a product, or keep the category Upcoming." };
  if (status === "upcoming" && products.length) status = "upcoming";
  const content = t(i.content, 4000);
  const value: CleanNode = {
    parentSlug: parent, slug, name, menuName: t(i.menuName, 40), icon: i.icon, short: t(i.short, 120), blurb: t(i.blurb, 500), status, compliance,
    featured: i.featured ? 1 : 0, menuVisible: i.menuVisible ? 1 : 0, published: i.published ? 1 : 0, seoTitle: t(i.seoTitle, 120), metaDescription: t(i.metaDescription, 300), content, productSlugs: JSON.stringify(products),
  };
  return { value };
}

export async function saveNode(db: Db, id: number | null, v: CleanNode): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  if (id) {
    // slug and parent are fixed after creation, so public URLs never change silently
    const { slug: _s, parentSlug: _p, ...rest } = v; void _s; void _p;
    await db.update(schema.taxonomyNodes).set({ ...rest, updatedAt: now }).where(eq(schema.taxonomyNodes.id, id));
    return id;
  }
  const sibs = await db.select({ s: schema.taxonomyNodes.sortOrder }).from(schema.taxonomyNodes).where(eq(schema.taxonomyNodes.parentSlug, v.parentSlug ?? ""));
  const next = sibs.reduce((m, r) => Math.max(m, r.s), -10) + 10;
  const r = await db.insert(schema.taxonomyNodes).values({ ...v, sortOrder: next, updatedAt: now }).returning({ id: schema.taxonomyNodes.id });
  return r[0].id;
}
export async function setNodePublished(db: Db, id: number, on: boolean) { await db.update(schema.taxonomyNodes).set({ published: on ? 1 : 0, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.taxonomyNodes.id, id)); }
/** Deleting a top-level category needs it to be empty. Returns false when it still has children. */
export async function deleteNode(db: Db, id: number): Promise<boolean> {
  const [row] = await db.select().from(schema.taxonomyNodes).where(eq(schema.taxonomyNodes.id, id)).limit(1);
  if (!row) return true;
  if (row.parentSlug === "") {
    const kids = await db.select({ id: schema.taxonomyNodes.id }).from(schema.taxonomyNodes).where(eq(schema.taxonomyNodes.parentSlug, row.slug)).limit(1);
    if (kids.length) return false;
  }
  await db.delete(schema.taxonomyNodes).where(eq(schema.taxonomyNodes.id, id));
  return true;
}
/** Swap display order with the neighbour above (-1) or below (+1) among siblings. */
export async function moveNode(db: Db, id: number, dir: -1 | 1) {
  const [row] = await db.select().from(schema.taxonomyNodes).where(eq(schema.taxonomyNodes.id, id)).limit(1);
  if (!row) return;
  const sibs = (await db.select().from(schema.taxonomyNodes).where(and(eq(schema.taxonomyNodes.parentSlug, row.parentSlug)))).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const i = sibs.findIndex((s) => s.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= sibs.length) return;
  // renumber so ties never block a swap
  const ids = sibs.map((s) => s.id); [ids[i], ids[j]] = [ids[j], ids[i]];
  for (const [k, sid] of ids.entries()) await db.update(schema.taxonomyNodes).set({ sortOrder: k * 10 }).where(eq(schema.taxonomyNodes.id, sid));
}
