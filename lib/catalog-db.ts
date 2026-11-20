// Loads the PUBLISHED imported products (section 91) into the code catalog for the current isolate. One KV value (60 s), never a D1 read per visit.
// Download links are NEVER part of this payload. Any failure leaves the code catalog exactly as it was.
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDbFromEnv, schema } from "@/lib/db";
import { and, eq, ne } from "drizzle-orm";
import { cleanStored, type SampleRowData } from "@/lib/product-samples";
import { registerImported, type Category, type Country, type Product } from "@/lib/catalog";

const KEY = "catalog:imp:v2";
const OLD_KEY = "catalog:imp:v1";
const TTL_MS = 30_000;
let loadedAt = 0;

export type PubProduct = {
  slug: string; name: string; title: string; description: string; categorySlug: string; categoryName: string; channel: string;
  countrySlug: string; countryCode: string; countryName: string; region: string; recordCount: number | null;
  packages: { name: string; records: number; priceUsdCents: number; highlighted?: boolean }[];
  seoTitle?: string; metaDescription?: string;
  // Section 96 (migration 0036). Missing on payloads read before the migration.
  dataFields?: string[]; fileFormats?: string; coverage?: string; lastUpdated?: string; placeholder?: boolean; forSale?: boolean; accuracyPct?: number | null;
  scope?: "country" | "city" | null; citySlug?: string; samples?: SampleRowData[];
};
type Payload = { products: PubProduct[]; hidden: string[]; aliases?: Record<string, string>; defaultSample?: SampleRowData[] };
export const DEFAULT_SAMPLE_KEY = "sample.default";

export function toCatalog(list: PubProduct[], hidden: string[] = [], aliases: Record<string, string> = {}, defaultSample: SampleRowData[] = []): { products: Product[]; categories: Category[]; countries: Country[]; hidden: string[]; aliases: Record<string, string>; defaultSample: SampleRowData[] } {
  const cats = new Map<string, Category>(), ctry = new Map<string, Country>();
  const products = list.map((p): Product => {
    if (!cats.has(p.categorySlug)) cats.set(p.categorySlug, { slug: p.categorySlug, name: p.categoryName, blurb: p.categoryName, description: `${p.categoryName} contact lists.`, buyers: [], singular: p.categoryName, reachLabel: p.categoryName.toLowerCase(), useCases: [], imported: true });
    if (!ctry.has(p.countrySlug)) ctry.set(p.countrySlug, { slug: p.countrySlug, code: p.countryCode, name: p.countryName });
    return {
      slug: p.slug, categorySlug: p.categorySlug, countrySlug: p.countrySlug, title: p.title, name: p.name, description: p.description, recordCount: p.recordCount,
      lastVerified: p.lastUpdated || null, accuracyPct: p.accuracyPct ?? null, status: p.forSale === false ? "draft" : "live", fields: p.dataFields ?? [], placeholderData: !!p.placeholder, packages: p.packages,
      ...(p.scope ? { scope: p.scope } : {}), ...(p.citySlug ? { citySlug: p.citySlug } : {}), ...(p.fileFormats ? { fileFormats: p.fileFormats } : {}), ...(p.coverage ? { coverage: p.coverage } : {}), ...(p.samples?.length ? { samples: p.samples } : {}), imported: true, channel: p.channel, region: p.region || undefined, seoTitle: p.seoTitle || undefined, metaDescription: p.metaDescription || undefined,
    };
  });
  return { products, categories: [...cats.values()], countries: [...ctry.values()], hidden, aliases, defaultSample };
}

const clean = (r: { slug: string; name: string; title: string; description: string; categorySlug: string; categoryName: string; channel: string; countrySlug: string; countryCode: string; countryName: string; region: string | null; recordCount: number | null; packagesJson: string; seoTitle: string | null; metaDescription: string | null }): PubProduct => ({
  slug: r.slug, name: r.name, title: r.title, description: r.description, categorySlug: r.categorySlug, categoryName: r.categoryName, channel: r.channel,
  countrySlug: r.countrySlug, countryCode: r.countryCode, countryName: r.countryName, region: r.region ?? "", recordCount: r.recordCount, seoTitle: r.seoTitle ?? "", metaDescription: r.metaDescription ?? "",
  packages: (JSON.parse(r.packagesJson || "[]") as { name: string; records: number; priceUsdCents: number; highlighted?: boolean }[]).map((k) => ({ name: k.name, records: k.records, priceUsdCents: k.priceUsdCents, ...(k.highlighted ? { highlighted: true } : {}) })),
});

async function read(env: CloudflareEnv): Promise<Payload | null> {
  try { const raw = await env.CACHE.get(KEY); if (raw) return JSON.parse(raw) as Payload; } catch { /* fall through to D1 */ }
  const db = getDbFromEnv(env);
  let payload: Payload | null = null;
  try {
    const rows = await db.select().from(schema.catalogProducts).where(eq(schema.catalogProducts.status, "published"));
    const pub = rows.map((r): PubProduct => {
      const parse = <T,>(v: string | null, d: T): T => { try { return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
      return {
        ...clean(r), dataFields: parse<string[]>(r.dataFieldsJson, []), fileFormats: r.fileFormats ?? "", coverage: r.coverage ?? "", lastUpdated: r.lastUpdated ?? "", placeholder: !!r.placeholder, forSale: !!r.forSale,
        accuracyPct: r.accuracyPct, scope: r.scope === "city" || r.scope === "country" ? r.scope : null, citySlug: r.scope === "city" ? r.city ?? "" : "", samples: cleanStored(parse<unknown>(r.sampleJson, [])),
      };
    });
    const hidden = (await db.select({ slug: schema.catalogProducts.slug }).from(schema.catalogProducts).where(and(eq(schema.catalogProducts.origin, "builtin"), ne(schema.catalogProducts.status, "published")))).map((r) => r.slug);
    let aliases: Record<string, string> = {};
    try { aliases = Object.fromEntries((await db.select().from(schema.slugAliases)).map((a) => [a.oldSlug, a.newSlug])); } catch { /* alias table not created yet */ }
    let defaultSample: SampleRowData[] = [];
    try { const r = (await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.key, DEFAULT_SAMPLE_KEY)))[0]; if (r?.value) defaultSample = cleanStored(JSON.parse(r.value)); } catch { /* no default sample yet */ }
    payload = { products: pub, hidden, aliases, defaultSample };
  } catch {
    // Migration 0036 not applied yet: the old columns still work, so imported products never disappear from the site.
    try {
      const rows = await db.select({ slug: schema.catalogProducts.slug, name: schema.catalogProducts.name, title: schema.catalogProducts.title, description: schema.catalogProducts.description, categorySlug: schema.catalogProducts.categorySlug, categoryName: schema.catalogProducts.categoryName, channel: schema.catalogProducts.channel, countrySlug: schema.catalogProducts.countrySlug, countryCode: schema.catalogProducts.countryCode, countryName: schema.catalogProducts.countryName, region: schema.catalogProducts.region, recordCount: schema.catalogProducts.recordCount, packagesJson: schema.catalogProducts.packagesJson, seoTitle: schema.catalogProducts.seoTitle, metaDescription: schema.catalogProducts.metaDescription }).from(schema.catalogProducts).where(eq(schema.catalogProducts.status, "published"));
      payload = { products: rows.map(clean), hidden: [] };
    } catch { return null; }
  }
  await env.CACHE.put(KEY, JSON.stringify(payload), { expirationTtl: 60 }).catch(() => undefined);
  return payload;
}

/** Call at the top of any request that needs imported products (product page, cart, checkout, delivery). Safe to call often. */
export async function hydrateCatalog(env?: CloudflareEnv, force = false): Promise<void> {
  if (!force && Date.now() - loadedAt < TTL_MS) return;
  try {
    const list = await read(env ?? getCloudflareContext().env);
    if (list) { registerImported(toCatalog(list.products, list.hidden, list.aliases ?? {}, list.defaultSample ?? [])); loadedAt = Date.now(); }
  } catch { /* keep the code catalog */ }
}

export async function clearImportedCache(env: CloudflareEnv) {
  await env.CACHE.delete(KEY).catch(() => undefined);
  await env.CACHE.delete(OLD_KEY).catch(() => undefined);
  loadedAt = 0;
}
