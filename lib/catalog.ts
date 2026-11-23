// Catalog access layer. TEMPORARY: reads static placeholder data.
// When D1 has real data, re-implement these functions with getDb() and keep the signatures,
// so pages do not change. Tracked in TODO-BEFORE-LAUNCH.md.

export type Category = {
  slug: string;
  name: string;
  blurb: string;
  description: string;
  buyers: readonly string[];
  /** "Dentist" -> "Dentist Email List" */
  singular: string;
  /** "dental businesses" -> "Ready to reach dental businesses?" */
  reachLabel: string;
  /** Who uses this database: shown as the "Who uses this database" section. */
  useCases: readonly { name: string; text: string }[];
  /** "general" = all businesses (not one industry). Kept out of industry pickers and menus. */
  kind?: "industry" | "general";
  /** Created by the WooCommerce import (section 91). It has no category page of its own yet. */
  imported?: boolean;
};

export type Country = { slug: string; code: string; name: string };
export type City = { slug: string; name: string; countrySlug: string };

export type Product = {
  slug: string;
  categorySlug: string;
  /** Further categories this product is also listed under (admin choice). The primary category above stays its main one. */
  extraCategories?: readonly string[];
  countrySlug: string;
  title: string;
  // null means "not known yet". Never show an invented number.
  recordCount: number | null;
  lastVerified: string | null;
  status: "draft" | "live";
  fields: readonly string[];
  /** Display name used in headings, e.g. "Dentist Email List". */
  name: string;
  description: string;
  /** PLACEHOLDER: no measurement method exists yet. Never show as a promise. */
  accuracyPct: number | null;
  packages: readonly Package[];
  /** true while record count, dates, accuracy and prices are placeholders. Blocks launch. */
  placeholderData: boolean;
  /** Geographic scope. Default: the whole country. */
  scope?: "country" | "city";
  citySlug?: string;
  /** Imported from WooCommerce (section 91). Fields, verification date and accuracy are unknown for these lists. */
  imported?: boolean;
  /** "business-email" | "consumer-email" | "phone" | "email" (imported lists only). */
  channel?: string;
  /** US state for imported state lists. */
  region?: string;
  /** Admin-edited SEO text for imported lists (section 95). */
  seoTitle?: string;
  metaDescription?: string;
  /** Admin-edited display texts (section 96). Empty = automatic. */
  fileFormats?: string;
  coverage?: string;
  /** Real masked sample rows entered by the owner (section 97). */
  samples?: readonly { business: string; address: string; city: string; phone: string; email: string; website: string }[];
};

export type Package = {
  name: string;
  records: number;
  priceUsdCents: number;
  highlighted?: boolean;
};

import { FIELD_NAMES, PRODUCT_ACCURACY, PRODUCT_VERIFIED, fieldSummary } from "@/lib/product-fields";
export const FIELDS = [
  "Business name",
  "Address",
  "City",
  "Country",
  "Phone",
  "Email",
  "Website",
] as const;

const categories: readonly Category[] = [
  {
    slug: "dentists",
    name: "Dentists",
    blurb: "Practices and clinics",
    description: "Contact details for dental practices and clinics.",
    buyers: ["Dental equipment suppliers", "Practice-software vendors", "Marketing agencies", "Recruiters"],
    singular: "Dentist",
    reachLabel: "dental businesses",
    useCases: [
      { name: "Dental equipment suppliers", text: "Introduce chairs, scanners and instruments to the practices that buy them." },
      { name: "Dental software companies", text: "Reach practice owners who choose scheduling, imaging and billing software." },
      { name: "Dental marketing agencies", text: "Build prospect lists of practices that want more new patients." },
      { name: "Healthcare technology providers", text: "Find clinics that could use patient communication and records tools." },
      { name: "Dental product manufacturers", text: "Get supplies and consumables in front of the people who order them." },
      { name: "Healthcare recruiters", text: "Contact practices that may be hiring hygienists, assistants and dentists." },
    ],
  },
  {
    slug: "restaurants",
    name: "Restaurants",
    blurb: "Restaurants, cafés and bars",
    description: "Contact details for restaurants, cafés, bars and bakeries.",
    buyers: ["Food and drink suppliers", "POS and delivery software", "Local marketing agencies", "Equipment sellers"],
    singular: "Restaurant",
    reachLabel: "restaurants",
    useCases: [
      { name: "Food and drink suppliers", text: "Offer ingredients, beverages and packaging directly to the kitchens that use them." },
      { name: "POS and ordering software", text: "Reach owners who choose point-of-sale, booking and delivery tools." },
      { name: "Local marketing agencies", text: "Pitch reviews, social media and local advertising to venues in one city." },
      { name: "Kitchen equipment sellers", text: "Sell ovens, refrigeration and smallwares to new and growing venues." },
      { name: "Payment and payroll providers", text: "Approach restaurants that run on thin margins and busy shifts." },
      { name: "Hospitality recruiters", text: "Contact venues that may be hiring chefs, servers and managers." },
    ],
  },
  {
    slug: "ski-shops",
    name: "Ski shops",
    blurb: "Retail, rental and repair",
    description: "Contact details for ski and snowboard retailers, rental shops and repair services.",
    buyers: ["Outdoor-gear brands", "Wholesalers", "Seasonal marketing agencies", "Rental-software vendors"],
    singular: "Ski Shop",
    reachLabel: "ski shops",
    useCases: [
      { name: "Outdoor-gear brands", text: "Find stockists for skis, boards, boots and outerwear." },
      { name: "Wholesalers and distributors", text: "Open new retail accounts before the season starts." },
      { name: "Seasonal marketing agencies", text: "Pitch campaigns timed to the winter rush." },
      { name: "Rental-software vendors", text: "Reach shops that run equipment rental and booking." },
      { name: "Repair and tuning suppliers", text: "Sell workshop tools and wax to shops with repair benches." },
      { name: "Resort and travel partners", text: "Build partnerships with shops near the slopes." },
    ],
  },
  {
    slug: "business",
    kind: "general",
    name: "Business",
    blurb: "Businesses of every kind",
    description: "Contact details for businesses across industries.",
    buyers: ["B2B sales teams", "Marketing agencies", "Recruitment firms", "Market research teams", "Business development teams"],
    singular: "Business",
    reachLabel: "businesses",
    useCases: [
      { name: "B2B sales teams", text: "Build prospect lists by city and reach local businesses with one message." },
      { name: "Marketing agencies", text: "Plan campaigns for clients who sell to businesses in a specific market." },
      { name: "Recruitment firms", text: "Find employers in the regions where you place candidates." },
      { name: "Market research teams", text: "Reach businesses for surveys, interviews and panels." },
      { name: "Business development teams", text: "Map potential partners, resellers and distributors." },
    ],
  },
];

const countries: readonly Country[] = [
  { slug: "united-states", code: "US", name: "United States" },
  { slug: "germany", code: "DE", name: "Germany" },
];

// Owner data (20 Nov 2026): full Germany 4,000,000 records, Berlin 200,000+ (entered as 200,000), last updated 2026-10-31.
// Other German cities are added only when the owner supplies their data. [slug, name, records]
const DE_CITIES: readonly [string, string, number][] = [["berlin", "Berlin", 200_000]];
const DE_VERIFIED = "2026-10-31";

const cities: readonly City[] = [
  { slug: "denver", name: "Denver", countrySlug: "united-states" },
  { slug: "chicago", name: "Chicago", countrySlug: "united-states" },
  ...DE_CITIES.map(([slug, name, records]) => ({ slug, name, countrySlug: "germany" })),
];

// PLACEHOLDER DATA (owner-approved for development, Nov 2026): 100,000 records, accuracy 95%,
// verified 59 days before 2026-11-16, $99 starter price. Tier sizes and the two higher prices are
// extrapolated placeholders. All of it must be replaced by real pipeline output before launch
// (TODO-BEFORE-LAUNCH.md). `placeholderData` makes the page say so out loud.
// Owner reference prices (20 Nov 2026): Starter $99 / 100,000, Professional $199 / 1,000,000+, Complete $299 / 5,000,000.
// A package is offered only when the list really holds at least that many records (see `offeredPackages`).
const PLACEHOLDER_PACKAGES: readonly Package[] = [
  { name: "Starter", records: 100_000, priceUsdCents: 9_900 },
  { name: "Professional", records: 1_000_000, priceUsdCents: 19_900, highlighted: true },
  { name: "Complete", records: 5_000_000, priceUsdCents: 29_900 },
];

const usProducts: readonly Product[] = categories.filter((c) => c.kind !== "general").map((c) => ({
  slug: `${c.slug}-us`,
  categorySlug: c.slug,
  countrySlug: "united-states",
  title: `${c.name} in the United States`,
  name: `${c.singular} Email List`,
  description: `Business contact details for ${c.reachLabel} in the United States: name, address, phone, email and website, with a masked sample you can inspect before you pay.`,
  recordCount: 100_000,
  lastVerified: "2026-09-18",
  accuracyPct: 95,
  packages: PLACEHOLDER_PACKAGES,
  placeholderData: true,
  status: "draft" as const,
  fields: FIELDS,
}));

// Germany (owner data, 20 Nov 2026). Accuracy 95% = the refund-policy target (owner request), not a measured result. Prices are the owner's reference packages.
const deFull: Product = {
  slug: "germany-business-email-database",
  categorySlug: "business", countrySlug: "germany", scope: "country",
  title: "Business contacts in Germany",
  name: "Germany Business Email Database",
  description: "Business contact details for companies across Germany: name, address, phone, email and website, with a masked sample you can inspect before you pay.",
  recordCount: 4_000_000, lastVerified: DE_VERIFIED, accuracyPct: 95, packages: PLACEHOLDER_PACKAGES, placeholderData: false, status: "live", fields: FIELDS,
};
const deCityProducts: readonly Product[] = DE_CITIES.map(([slug, name, records]) => ({
  slug: `${slug}-business-email-list`,
  categorySlug: "business", countrySlug: "germany", scope: "city" as const, citySlug: slug,
  title: `Business contacts in ${name}, Germany`,
  name: `${name} Business Email List`,
  description: `Business contact details for companies in ${name}, Germany: name, address, phone, email and website, with a masked sample you can inspect before you pay.`,
  recordCount: records, lastVerified: DE_VERIFIED, accuracyPct: 95, packages: PLACEHOLDER_PACKAGES, placeholderData: false, status: "live" as const, fields: FIELDS,
}));
const staticProducts: readonly Product[] = [...usProducts, deFull, ...deCityProducts];
const products = staticProducts;

// Imported catalog (section 91). The sync getters below include it once `registerImported` has run for this request/isolate
// (see lib/catalog-db.ts `hydrateCatalog`). Before that, or when the import tables do not exist, nothing changes.
let importedProducts: readonly Product[] = [];
const importedCategories = new Map<string, Category>();
const importedCountries = new Map<string, Country>();
let hiddenStatic: ReadonlySet<string> = new Set();
let slugAliases: ReadonlyMap<string, string> = new Map(); // old slug -> current slug (renamed products)
type SampleRowT = NonNullable<Product["samples"]>[number];
let defaultSample: readonly SampleRowT[] = []; // the owner's one real masked sample, used by every product without its own (section 99)
/** The rows to show for a product: its own real sample, else the site-wide real sample, else none. Never invented rows. */
export function sampleRowsOf(slug: string): readonly SampleRowT[] {
  const p = getProduct(slug);
  return p?.samples?.length ? p.samples : defaultSample;
}
export const getDefaultSample = (): readonly SampleRowT[] => defaultSample;
export function registerImported(x: { products: readonly Product[]; categories: readonly Category[]; countries: readonly Country[]; hidden?: readonly string[]; aliases?: Readonly<Record<string, string>>; defaultSample?: readonly SampleRowT[] }) {
  importedProducts = x.products;
  defaultSample = x.defaultSample ?? [];
  hiddenStatic = new Set([...(x.hidden ?? []), ...Object.keys(x.aliases ?? {})]);
  slugAliases = new Map(Object.entries(x.aliases ?? {}));
  importedCategories.clear(); importedCountries.clear();
  for (const c of x.categories) importedCategories.set(c.slug, c);
  for (const c of x.countries) importedCountries.set(c.slug, c);
}
// A database row with the same slug REPLACES the built-in product (built-ins edited in the admin); an unpublished built-in is hidden.
let rawKey: [readonly Product[], ReadonlySet<string>] | null = null;
let rawVal: readonly Product[] = [];
const rawProducts = (): readonly Product[] => {
  if (!importedProducts.length && !hiddenStatic.size) return staticProducts;
  if (rawKey && rawKey[0] === importedProducts && rawKey[1] === hiddenStatic) return rawVal;
  const over = new Set(importedProducts.map((p) => p.slug));
  rawKey = [importedProducts, hiddenStatic];
  rawVal = [...staticProducts.filter((p) => !over.has(p.slug) && !hiddenStatic.has(p.slug)), ...importedProducts];
  return rawVal;
};

// Every product page states the same field catalog, verification date and accuracy (owner decision, 20 Nov 2026).
let normFrom: readonly Product[] | null = null;
let normTo: readonly Product[] = [];
const allProducts = (): readonly Product[] => {
  const raw = rawProducts();
  if (raw !== normFrom) { normFrom = raw; normTo = raw.map((p) => ({ ...p, fields: FIELD_NAMES, lastVerified: p.lastVerified && p.lastVerified > PRODUCT_VERIFIED ? p.lastVerified : PRODUCT_VERIFIED, accuracyPct: PRODUCT_ACCURACY })); }
  return normTo;
};
/** The products defined in code (used to copy them into the database). */
export const getStaticProducts = () => staticProducts;

/** Packages a buyer may be offered. A package larger than the list's real record count is never offered.
 *  While a list is still placeholder data the count is unknown, so every configured package is shown (the page says so). */
export const offeredPackages = (p: Product): readonly Package[] =>
  p.placeholderData || p.recordCount === null ? p.packages : p.packages.filter((k) => k.records <= (p.recordCount ?? 0));

export const formatUsd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

export const startingPriceCents = (p: Product) =>
  p.packages.length ? Math.min(...p.packages.map((x) => x.priceUsdCents)) : null;

/** Other products to link to and recommend, most related first: same industry (other markets), then same market and channel, then same state. */
export const getRelatedProducts = (p: Product, limit = 3) => {
  const score = (x: Product) =>
    Number(x.categorySlug === p.categorySlug) * 8 + Number(x.countrySlug === p.countrySlug) * 4 + Number(!!x.channel && x.channel === p.channel) * 2 + Number(!!p.region && x.region === p.region);
  // Ties are broken by a stable hash of the pair, so links spread over many products instead of always pointing at the same few.
  const h = (x: Product) => { let n = 2166136261; for (const ch of `${p.slug}|${x.slug}`) n = Math.imul(n ^ ch.charCodeAt(0), 16777619); return n >>> 0; };
  return allProducts().filter((x) => x.slug !== p.slug).map((x) => [score(x), h(x), x] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]).slice(0, limit).map((r) => r[2]);
};

export type ProductFaq = readonly [question: string, answer: string];

/**
 * Product-specific FAQs. TEMPORARY: templates filled from product data. When the admin panel
 * exists, read the `product_faqs` table (rows per product) and fall back to these.
 */
export function getProductFaqs(p: Product, c: Category, k: Country): ProductFaq[] {
  const count = p.recordCount === null ? "not counted yet" : `${p.recordCount.toLocaleString("en-US")} records`;
  const verified = p.lastVerified ?? "not verified yet";
  return [
    [`What information is included in the ${p.name}?`, p.fields.length
      ? `Each record can include ${fieldSummary(p.fields).toLowerCase()}. The fields section on this page lists exactly what is in the file.`
      : "The exact columns depend on the list. Request the free sample to see the fields and a masked set of rows before you buy."],
    [`How many ${c.singular.toLowerCase()} contacts are available?`, `The list holds ${count}. The count is shown on this page so you can compare it with the package you pick.`],
    ["Which countries are covered?", `This list covers ${k.name}. Other countries are added list by list, and you can request one on the custom list page.`],
    [`Can I see a sample of the ${p.name}?`, "Yes. This page shows masked sample rows, and you can request a free sample by email. Sample files only ever contain masked data."],
    ["Are email addresses verified?", "BeigeLeads refreshes its databases every 90 days. No check is perfect, because some mail servers accept every address, so a small share of contacts can still bounce. Above a 5% bounce rate, our Refund & Returns policy replaces the bounced emails until the list is back to 95%."],
    [`Is the ${p.name} a one-time purchase?`, "Yes. You pay once and keep the file. There is no subscription and no account. Payment is in crypto, and checkout shows the coins that are open."],
    ["What file formats are available?", "CSV, Excel or TXT. These open in Excel, Google Sheets and most email and CRM tools."],
    ["How do I download the database after purchasing?", "Once your payment is confirmed, we email your download link. Delivery is mostly instant and in some cases takes up to 12 hours at most. You can download the file as many times as you like."],
    ["Can I use this database for B2B marketing?", "Yes, within the law of your country and the contact's country. Read the lawful use policy and the pages on GDPR, CAN-SPAM and CASL before you send. We are not a law firm and this is not legal advice."],
    [`How frequently is the ${p.name} updated?`, `All data is re-verified every 90 days. This list was last verified on ${verified}.`],
    [`Can I request a custom ${c.singular.toLowerCase()} database?`, "Yes. Use the custom list page to describe the places, fields and size you need, and we will tell you what is possible."],
  ];
}

export const getCategories = () => categories.filter((c) => c.kind !== "general");
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug) ?? importedCategories.get(slug);
export const getCountries = () => countries;
export const getCountry = (slug: string) => countries.find((c) => c.slug === slug) ?? importedCountries.get(slug);
export const getCities = (countrySlug: string) => cities.filter((c) => c.countrySlug === countrySlug);
export const getCity = (countrySlug: string, slug: string) =>
  cities.find((c) => c.countrySlug === countrySlug && c.slug === slug);
/** True when the product is filed under this category as its main one or as an extra one. */
export const inCategory = (p: Pick<Product, "categorySlug" | "extraCategories">, slug: string) => p.categorySlug === slug || !!p.extraCategories?.includes(slug);
export const getProducts = (categorySlug?: string) =>
  categorySlug ? allProducts().filter((p) => inCategory(p, categorySlug)) : allProducts();
export const getProduct = (slug: string) => {
  const all = allProducts();
  return all.find((p) => p.slug === slug) ?? (slugAliases.has(slug) ? all.find((p) => p.slug === slugAliases.get(slug)) : undefined);
};
/** The current slug for a possibly old (renamed) one; unknown slugs come back unchanged. */
export const resolveSlug = (slug: string) => getProduct(slug)?.slug ?? slug;
export const getProductFor = (categorySlug: string, countrySlug: string) =>
  staticProducts.find((p) => p.categorySlug === categorySlug && p.countrySlug === countrySlug);
