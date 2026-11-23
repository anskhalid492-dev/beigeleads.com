// Facts for /our-data computed from the REAL catalog. Nothing here is typed in by hand except the region grouping.
import { getCategories, getCountry, getProducts, inCategory, type Product } from "@/lib/catalog";
import { FLAG_FILES } from "@/lib/flag-codes";
import { hydrateCatalog } from "@/lib/catalog-db";

export type Region = "North America" | "Europe" | "Asia-Pacific" | "Middle East" | "Other regions";
export const REGIONS: readonly Region[] = ["North America", "Europe", "Asia-Pacific", "Middle East", "Other regions"];
const R: Record<Region, string[]> = {
  "North America": ["US", "CA", "MX"],
  Europe: ["GB", "UK", "DE", "FR", "ES", "IT", "NL", "BE", "CH", "AT", "SE", "NO", "DK", "FI", "IE", "PT", "PL", "CZ", "GR", "HU", "RO", "BG", "HR", "SK", "SI", "LT", "LV", "EE", "LU", "MT", "CY", "IS", "UA", "RS", "TR"],
  "Asia-Pacific": ["AU", "NZ", "JP", "KR", "CN", "HK", "TW", "SG", "MY", "TH", "VN", "PH", "ID", "IN", "PK", "BD", "LK", "NP"],
  "Middle East": ["AE", "SA", "QA", "KW", "BH", "OM", "IL", "JO", "LB", "IQ", "IR", "EG"],
  "Other regions": [],
};
export const regionOf = (code: string): Region => (REGIONS.find((r) => R[r].includes(code.toUpperCase())) ?? "Other regions");

/** A product counts when it is on the public site: built-in live products and published imported ones. */
const shown = (p: Product) => p.status === "live" || !!p.imported;

export type OurDataFacts = {
  countries: { slug: string; name: string; code: string; region: Region; lists: number }[];
  byRegion: { region: Region; countries: OurDataFacts["countries"] }[];
  industries: { slug: string; name: string; lists: number }[];
  /** newest "last updated" date recorded on a shown list (ISO), or null */
  newestUpdate: string | null;
  /** true when at least one shown list stores job-title style fields (always the catalog field list, owner-declared) */
  fieldCount: number;
};

export async function loadOurDataFacts(): Promise<OurDataFacts> {
  await hydrateCatalog().catch(() => undefined);
  const products = getProducts().filter(shown);
  const cmap = new Map<string, OurDataFacts["countries"][number]>();
  for (const p of products) {
    const k = getCountry(p.countrySlug);
    // Regional groupings (Worldwide, GCC, APAC...) are not countries: only real 2-letter ISO codes count.
    if (!k || !/^[A-Za-z]{2}$/.test(k.code) || !FLAG_FILES.has((k.code === "UK" ? "gb" : k.code).toLowerCase())) continue;
    const e = cmap.get(k.slug) ?? { slug: k.slug, name: k.name, code: k.code, region: regionOf(k.code), lists: 0 };
    e.lists += 1; cmap.set(k.slug, e);
  }
  const countries = [...cmap.values()].sort((a, b) => a.name.localeCompare(b.name));
  const byRegion = REGIONS.map((region) => ({ region, countries: countries.filter((c) => c.region === region) })).filter((g) => g.countries.length);
  const industries = getCategories()
    .map((c) => ({ slug: c.slug, name: c.name, lists: products.filter((p) => inCategory(p, c.slug)).length }))
    .filter((c) => c.lists > 0).sort((a, b) => a.name.localeCompare(b.name));
  const dates = products.map((p) => p.lastVerified).filter((d): d is string => !!d).sort();
  const { FIELD_NAMES } = await import("@/lib/product-fields");
  return { countries, byRegion, industries, newestUpdate: dates.at(-1) ?? null, fieldCount: FIELD_NAMES.length };
}
