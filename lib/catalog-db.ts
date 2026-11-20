// Loads the PUBLISHED imported products (section 91) into the code catalog for the current isolate. One KV value (60 s), never a D1 read per visit.
// Download links are NEVER part of this payload. Any failure leaves the code catalog exactly as it was.
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDbFromEnv, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { registerImported, type Category, type Country, type Product } from "@/lib/catalog";

const KEY = "catalog:imp:v1";
const TTL_MS = 30_000;
let loadedAt = 0;

export type PubProduct = {
  slug: string; name: string; title: string; description: string; categorySlug: string; categoryName: string; channel: string;
  countrySlug: string; countryCode: string; countryName: string; region: string; recordCount: number | null;
  packages: { name: string; records: number; priceUsdCents: number; highlighted?: boolean }[];
  seoTitle?: string; metaDescription?: string;
};

export function toCatalog(list: PubProduct[]): { products: Product[]; categories: Category[]; countries: Country[] } {
  const cats = new Map<string, Category>(), ctry = new Map<string, Country>();
  const products = list.map((p): Product => {
    if (!cats.has(p.categorySlug)) cats.set(p.categorySlug, { slug: p.categorySlug, name: p.categoryName, blurb: p.categoryName, description: `${p.categoryName} contact lists.`, buyers: [], singular: p.categoryName, reachLabel: p.categoryName.toLowerCase(), useCases: [], imported: true });
    if (!ctry.has(p.countrySlug)) ctry.set(p.countrySlug, { slug: p.countrySlug, code: p.countryCode, name: p.countryName });
    return {
      slug: p.slug, categorySlug: p.categorySlug, countrySlug: p.countrySlug, title: p.title, name: p.name, description: p.description, recordCount: p.recordCount,
      lastVerified: null, accuracyPct: null, status: "live", fields: [], placeholderData: false, packages: p.packages, imported: true, channel: p.channel, region: p.region || undefined, seoTitle: p.seoTitle || undefined, metaDescription: p.metaDescription || undefined,
    };
  });
  return { products, categories: [...cats.values()], countries: [...ctry.values()] };
}

async function read(env: CloudflareEnv): Promise<PubProduct[] | null> {
  try { const raw = await env.CACHE.get(KEY); if (raw) return JSON.parse(raw) as PubProduct[]; } catch { /* fall through to D1 */ }
  try {
    const rows = await getDbFromEnv(env).select().from(schema.catalogProducts).where(eq(schema.catalogProducts.status, "published"));
    const list: PubProduct[] = rows.map((r) => ({
      slug: r.slug, name: r.name, title: r.title, description: r.description, categorySlug: r.categorySlug, categoryName: r.categoryName, channel: r.channel,
      countrySlug: r.countrySlug, countryCode: r.countryCode, countryName: r.countryName, region: r.region ?? "", recordCount: r.recordCount, seoTitle: r.seoTitle ?? "", metaDescription: r.metaDescription ?? "",
      packages: (JSON.parse(r.packagesJson || "[]") as { name: string; records: number; priceUsdCents: number; highlighted?: boolean }[]).map((k) => ({ name: k.name, records: k.records, priceUsdCents: k.priceUsdCents, ...(k.highlighted ? { highlighted: true } : {}) })),
    }));
    await env.CACHE.put(KEY, JSON.stringify(list), { expirationTtl: 60 }).catch(() => undefined);
    return list;
  } catch { return null; }
}

/** Call at the top of any request that needs imported products (product page, cart, checkout, delivery). Safe to call often. */
export async function hydrateCatalog(env?: CloudflareEnv, force = false): Promise<void> {
  if (!force && Date.now() - loadedAt < TTL_MS) return;
  try {
    const list = await read(env ?? getCloudflareContext().env);
    if (list) { registerImported(toCatalog(list)); loadedAt = Date.now(); }
  } catch { /* keep the code catalog */ }
}

export async function clearImportedCache(env: CloudflareEnv) {
  await env.CACHE.delete(KEY).catch(() => undefined);
  loadedAt = 0;
}
