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
};

export type Country = { slug: string; code: string; name: string };
export type City = { slug: string; name: string; countrySlug: string };

export type Product = {
  slug: string;
  categorySlug: string;
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
};

export type Package = {
  name: string;
  records: number;
  priceUsdCents: number;
  highlighted?: boolean;
};

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

// Germany (owner data, 20 Nov 2026). No accuracy figure: no measurement method exists. Prices are the owner's reference packages.
const deFull: Product = {
  slug: "germany-business-email-database",
  categorySlug: "business", countrySlug: "germany", scope: "country",
  title: "Business contacts in Germany",
  name: "Germany Business Email Database",
  description: "Business contact details for companies across Germany: name, address, phone, email and website, with a masked sample you can inspect before you pay.",
  recordCount: 4_000_000, lastVerified: DE_VERIFIED, accuracyPct: null, packages: PLACEHOLDER_PACKAGES, placeholderData: false, status: "live", fields: FIELDS,
};
const deCityProducts: readonly Product[] = DE_CITIES.map(([slug, name, records]) => ({
  slug: `${slug}-business-email-list`,
  categorySlug: "business", countrySlug: "germany", scope: "city" as const, citySlug: slug,
  title: `Business contacts in ${name}, Germany`,
  name: `${name} Business Email List`,
  description: `Business contact details for companies in ${name}, Germany: name, address, phone, email and website, with a masked sample you can inspect before you pay.`,
  recordCount: records, lastVerified: DE_VERIFIED, accuracyPct: null, packages: PLACEHOLDER_PACKAGES, placeholderData: false, status: "live" as const, fields: FIELDS,
}));
const products: readonly Product[] = [...usProducts, deFull, ...deCityProducts];

/** Packages a buyer may be offered. A package larger than the list's real record count is never offered.
 *  While a list is still placeholder data the count is unknown, so every configured package is shown (the page says so). */
export const offeredPackages = (p: Product): readonly Package[] =>
  p.placeholderData || p.recordCount === null ? p.packages : p.packages.filter((k) => k.records <= (p.recordCount ?? 0));

export const formatUsd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

export const startingPriceCents = (p: Product) =>
  p.packages.length ? Math.min(...p.packages.map((x) => x.priceUsdCents)) : null;

/** Other products to recommend. Same category first (other countries), then the rest. */
export const getRelatedProducts = (p: Product, limit = 3) =>
  [...products.filter((x) => x.slug !== p.slug)]
    .sort((a, b) => Number(b.categorySlug === p.categorySlug) - Number(a.categorySlug === p.categorySlug))
    .slice(0, limit);

export type ProductFaq = readonly [question: string, answer: string];

/**
 * Product-specific FAQs. TEMPORARY: templates filled from product data. When the admin panel
 * exists, read the `product_faqs` table (rows per product) and fall back to these.
 */
export function getProductFaqs(p: Product, c: Category, k: Country): ProductFaq[] {
  const count = p.recordCount === null ? "not counted yet" : `${p.recordCount.toLocaleString("en-US")} records`;
  const verified = p.lastVerified ?? "not verified yet";
  return [
    [`What information is included in the ${p.name}?`, `Each record can include ${p.fields.map((f) => f.toLowerCase()).join(", ")}. The fields section on this page lists exactly what is in the file.`],
    [`How many ${c.singular.toLowerCase()} contacts are available?`, `The list holds ${count}. The count is shown on this page so you can compare it with the package you pick.`],
    ["Which countries are covered?", `This list covers ${k.name}. Other countries are added list by list, and you can request one on the custom list page.`],
    [`Can I see a sample of the ${p.name}?`, "Yes. This page shows masked sample rows, and you can request a free sample by email. Sample files only ever contain masked data."],
    ["Are email addresses verified?", "Our team runs SMTP checks on emails and re-verifies all data every 60 days. No check is perfect, because some mail servers accept every address, so a small share of contacts can still bounce. Above a 5% bounce rate, our Refund & Returns policy replaces the bounced emails until the list is back to 95%."],
    [`Is the ${p.name} a one-time purchase?`, "Yes. You pay once and keep the file. There is no subscription and no account. Payment is in crypto, and checkout shows the coins that are open."],
    ["What file formats are available?", "CSV, Excel or TXT. These open in Excel, Google Sheets and most email and CRM tools."],
    ["How do I download the database after purchasing?", "Once your crypto payment is confirmed, we email your download link. Delivery is mostly instant and in some cases takes up to 12 hours at most. You can download the file as many times as you like."],
    ["Can I use this database for B2B marketing?", "Yes, within the law of your country and the contact's country. Read the lawful use policy and the pages on GDPR, CAN-SPAM and CASL before you send. We are not a law firm and this is not legal advice."],
    [`How frequently is the ${p.name} updated?`, `All data is re-verified every 60 days. This list was last verified on ${verified}.`],
    [`Can I request a custom ${c.singular.toLowerCase()} database?`, "Yes. Use the custom list page to describe the places, fields and size you need, and we will tell you what is possible."],
  ];
}

export const getCategories = () => categories.filter((c) => c.kind !== "general");
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getCountries = () => countries;
export const getCountry = (slug: string) => countries.find((c) => c.slug === slug);
export const getCities = (countrySlug: string) => cities.filter((c) => c.countrySlug === countrySlug);
export const getCity = (countrySlug: string, slug: string) =>
  cities.find((c) => c.countrySlug === countrySlug && c.slug === slug);
export const getProducts = (categorySlug?: string) =>
  categorySlug ? products.filter((p) => p.categorySlug === categorySlug) : products;
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getProductFor = (categorySlug: string, countrySlug: string) =>
  products.find((p) => p.categorySlug === categorySlug && p.countrySlug === countrySlug);
