// WooCommerce product CSV -> BeigeLeads import records. PURE: no network, no database. Shared by the browser preview and the server.
// Rules (owner, 20 Nov 2026): never invent counts, prices or claims; everything imported is a DRAFT; marketing claims in the source text
// ("100% verified", "opt-in", "95%+ deliverability") are NOT copied; incomplete or doubtful items carry review flags.
import { parseCsv } from "@/lib/glossary/tabular";
import { COUNTRIES, countryIn, slugify, stateIn, type CountryInfo } from "./geo";

export type Column = "id" | "type" | "name" | "published" | "shortDescription" | "description" | "regularPrice" | "salePrice" | "categories" | "tags" | "images" | "parent" | "download1" | "attrName" | "attrValues" | "seoTitle" | "seoDescription" | "focusKeyword" | "sku";
export type Mapping = Partial<Record<Column, string>>;

export const COLUMN_LABELS: Record<Column, string> = {
  id: "WordPress product ID", type: "Product type", name: "Product name", published: "Published", shortDescription: "Short description", description: "Description",
  regularPrice: "Regular price", salePrice: "Sale price", categories: "Categories", tags: "Tags", images: "Images", parent: "Parent (variations)", download1: "Download 1 URL",
  attrName: "Attribute 1 name", attrValues: "Attribute 1 value(s)", seoTitle: "SEO title", seoDescription: "SEO description", focusKeyword: "Focus keyword", sku: "SKU",
};
const WANT: Record<Column, string[]> = {
  id: ["ID"], type: ["Type"], name: ["Name"], published: ["Published"], shortDescription: ["Short description"], description: ["Description"],
  regularPrice: ["Regular price"], salePrice: ["Sale price"], categories: ["Categories"], tags: ["Tags"], images: ["Images"], parent: ["Parent"],
  download1: ["Download 1 URL"], attrName: ["Attribute 1 name"], attrValues: ["Attribute 1 value(s)"],
  seoTitle: ["Meta: rank_math_title", "Meta: _yoast_wpseo_title"], seoDescription: ["Meta: rank_math_description", "Meta: _yoast_wpseo_metadesc"],
  focusKeyword: ["Meta: rank_math_focus_keyword", "Meta: _yoast_wpseo_focuskw"], sku: ["SKU"],
};
export const REQUIRED: Column[] = ["id", "type", "name"];

/** Automatic field mapping: exact WooCommerce header names first, then a case-insensitive match. The admin can correct any of them. */
export function detectMapping(headers: string[]): Mapping {
  const m: Mapping = {};
  const lower = new Map(headers.map((h) => [h.trim().toLowerCase(), h]));
  for (const [k, names] of Object.entries(WANT) as [Column, string[]][]) {
    for (const n of names) {
      const hit = headers.includes(n) ? n : lower.get(n.toLowerCase());
      if (hit) { m[k] = hit; break; }
    }
  }
  return m;
}

export type SourceVariation = { id: string; name: string; label: string; regular: number | null; sale: number | null; url: string };
export type SourceProduct = {
  wpId: string; kind: "simple" | "variable"; name: string; published: string; sku: string; categories: string[]; tags: string[];
  shortDescription: string; description: string; regular: number | null; sale: number | null; url: string; images: string[];
  seoTitle: string; seoDescription: string; focusKeyword: string; variations: SourceVariation[];
};

const num = (v: string): number | null => { const n = Number(String(v ?? "").replace(/[^0-9.]/g, "")); return String(v ?? "").trim() && Number.isFinite(n) && n > 0 ? n : null; };
export const stripHtml = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8211;|&#8212;/g, "-").replace(/&#8217;/g, "'").replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
const splitList = (v: string) => (v ?? "").split(/(?<!\\),\s*/).map((x) => x.replace(/\\,/g, ",").trim()).filter(Boolean);

/** Parse a WooCommerce product export and join each variation to its variable product. */
export function parseWoo(text: string, mapping?: Mapping): { products: SourceProduct[]; headers: string[]; mapping: Mapping; missingRequired: Column[]; rows: number } {
  const grid = parseCsv(text.replace(/^﻿/, ""));
  const headers = (grid[0] ?? []).map((h) => h.trim());
  const m = mapping && Object.keys(mapping).length ? mapping : detectMapping(headers);
  const missingRequired = REQUIRED.filter((c) => !m[c] || !headers.includes(m[c]!));
  if (missingRequired.length) return { products: [], headers, mapping: m, missingRequired, rows: Math.max(0, grid.length - 1) };
  const ix = new Map(headers.map((h, i) => [h, i]));
  const get = (r: string[], c: Column) => (m[c] && ix.has(m[c]!) ? (r[ix.get(m[c]!)!] ?? "") : "");
  const byId = new Map<string, SourceProduct>();
  const vars: { parent: string; v: SourceVariation }[] = [];
  const order: SourceProduct[] = [];
  for (const r of grid.slice(1)) {
    if (r.length < 3 || !get(r, "id").trim()) continue;
    const type = get(r, "type").toLowerCase();
    if (type.includes("variation")) {
      vars.push({ parent: get(r, "parent").replace(/^id:/, "").trim(), v: { id: get(r, "id").trim(), name: get(r, "name").trim(), label: get(r, "attrValues").trim(), regular: num(get(r, "regularPrice")), sale: num(get(r, "salePrice")), url: get(r, "download1").trim() } });
      continue;
    }
    const p: SourceProduct = {
      wpId: get(r, "id").trim(), kind: type.includes("variable") ? "variable" : "simple", name: stripHtml(get(r, "name")), published: get(r, "published").trim(), sku: get(r, "sku").trim(),
      categories: splitList(get(r, "categories")), tags: splitList(get(r, "tags")), shortDescription: stripHtml(get(r, "shortDescription")), description: stripHtml(get(r, "description")),
      regular: num(get(r, "regularPrice")), sale: num(get(r, "salePrice")), url: get(r, "download1").trim(), images: splitList(get(r, "images")),
      seoTitle: get(r, "seoTitle").trim(), seoDescription: get(r, "seoDescription").trim(), focusKeyword: get(r, "focusKeyword").trim(), variations: [],
    };
    byId.set(p.wpId, p); order.push(p);
  }
  for (const { parent, v } of vars) byId.get(parent)?.variations.push(v);
  return { products: order, headers, mapping: m, missingRequired: [], rows: grid.length - 1 };
}

// ---------- quantities ----------
/** A contact count written in a label: "- 5\,000 Contacts -", "2 Million Contacts", "9.3k+", "Hessen - 354 Records". null when none is clear. */
export function parseQty(label: string): number | null {
  const t = label.replace(/\\/g, "").replace(/(\d),(\d{3})/g, "$1$2");
  const unit = (n: number, u: string) => Math.round(n * (/^(m|million)$/i.test(u) ? 1_000_000 : /^(k|thousand)$/i.test(u) ? 1_000 : 1));
  let m = /(\d+(?:\.\d+)?)\s*(million|thousand|m|k)\b\s*\+?/i.exec(t.replace(/\d+%/g, ""));
  if (m) return unit(Number(m[1]), m[2]);
  m = /(\d{2,})\s*\+?\s*(?:[a-z0-9-]+\s+){0,3}?(contacts|leads|records|emails|numbers)\b/i.exec(t.replace(/\d+%/g, ""));
  if (m) { const n = Number(m[1]); return n >= 10 ? n : null; }
  return null;
}

// ---------- names, slugs, flags ----------
export const cleanName = (name: string) => {
  let b = stripHtml(name).replace(/^\[[^\]]+\]\s*/, "").replace(/\((?:qty|quantity)[^)]*\)/ig, "");
  b = b.split(/\s[-–—|]\s|:\s+|,\s*(?:sales?|sale)\s/i)[0] ?? b;
  return b.replace(/\s+/g, " ").replace(/[-–—,\s]+$/, "").trim();
};
export const slugFor = (name: string) => slugify(cleanName(name).replace(/\bmailing list\b/i, "email list").replace(/\bsales? leads?( database)?\b/i, "")).replace(/-database$/, "-database");

const SENSITIVE: [string, RegExp][] = [
  ["adult", /\b(porn|adult|escort|xxx|sex)\b/i], ["cannabis", /\b(weed|marijuana|cannabis|cbd)\b/i], ["gambling", /\b(gambl|betting|casino|lotter)/i],
  ["dating", /\bdating\b/i], ["mlm", /\bmlm\b|multi.?level|online money making/i], ["alcohol", /\b(alcohol|vape|vaping|tobacco)\b/i],
  ["finance-risk", /\b(forex|crypto|blockchain|trading|payday|loan|debt)\b/i],
];

const TOP_TARGETED = "Targeted Email Lists";
export type Channel = "business-email" | "consumer-email" | "phone" | "email";
export type ImportPackage = { name: string; records: number; priceUsdCents: number; link: string; highlighted?: boolean };
export type ImportProduct = {
  sourceId: string; slug: string; name: string; title: string; description: string; originalDescription: string; shortDescription: string;
  categorySlug: string; categoryName: string; channel: Channel; group: "industry" | "job-title" | "technology" | "geographic" | "general";
  jobTitle: string; countrySlug: string; countryCode: string; countryName: string; region: string; city: string;
  restricted: string[]; flags: string[]; recordCount: number | null; packages: ImportPackage[];
  seoTitle: string; metaDescription: string; imageUrl: string; tags: string[]; sourceCategories: string[]; sourceVariations: number; droppedVariations: number;
  sourceRegular: number | null; sourceSale: number | null; wpPublished: boolean; sku: string; titleKey: string;
};

const toCents = (n: number | null) => (n ? Math.round(n * 100) : 0);
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function categoryInfo(cats: string[]) {
  const paths = cats.map((c) => c.split(">").map((x) => x.trim()));
  const has = (top: string) => paths.some((p) => p[0].toLowerCase().startsWith(top));
  const consumer = has("consumer"), phone = has("phone"), job = has("job titles"), business = has("business email");
  const sub = paths.find((p) => p[0] === TOP_TARGETED && p[1]);
  const jobSub = paths.find((p) => p[0] === "Job Titles" && p[1]);
  const countryCat = paths.find((p) => /(business|consumers?) email database|email lists$/i.test(p[1] ?? "") && /business|consumer/i.test(p[0]));
  const countryCats = paths.filter((p) => /^(business|consumer)/i.test(p[0]) && p[1] && /database/i.test(p[1])).map((p) => p[1].replace(/\s*(business|consumers?)\s*email\s*(database|lists?)/i, "").replace(/\(uk\)/i, "").trim());
  const channel: Channel = consumer ? "consumer-email" : phone ? "phone" : business ? "business-email" : "email";
  let categoryName = "General Targeted Lists", group: ImportProduct["group"] = "general";
  if (sub && /compan(y|ies) using tech/i.test(sub[1])) { categoryName = "Technology Users"; group = "technology"; }
  else if (sub) { categoryName = sub[1]; group = "industry"; }
  else if (job) { categoryName = jobSub?.[1] ?? "Job Titles"; group = "job-title"; }
  else if (phone) { categoryName = "Phone Number Lists"; group = "geographic"; }
  else if (consumer) { categoryName = "Consumer Email Lists"; group = "geographic"; }
  else if (business) { categoryName = "Business Email Lists"; group = "geographic"; }
  return { channel, categoryName, group, countryCats, countryCat };
}

/** Everything the importer decides about one WordPress product. Deterministic; nothing is invented. */
export function buildProduct(src: SourceProduct, reserved: ReadonlySet<string> = new Set()): ImportProduct {
  const flags: string[] = [];
  const info = categoryInfo(src.categories);
  const name = cleanName(src.name) || src.name;
  const hay = `${src.name} ${src.categories.join(" ")} ${src.tags.join(" ")}`;
  const restricted = SENSITIVE.filter(([, re]) => re.test(hay)).map(([k]) => k);
  if (info.channel === "consumer-email") restricted.push("consumer data");
  if (info.channel === "phone") restricted.push("phone numbers");

  // geography: category label first, then the title
  let country: CountryInfo | null = null;
  for (const c of info.countryCats) { country = countryIn(c, true); if (country) break; }
  const multiCountry = info.countryCats.length > 1;
  if (multiCountry) { const g = countryIn(src.name); if (g && ["GCC", "EUR", "APAC", "MENA", "AFR", "LATAM", "WW"].includes(g.code)) country = g; }
  country = country && !(multiCountry && !["GCC", "EUR", "APAC", "MENA", "AFR", "LATAM", "WW"].includes(country.code)) ? country : countryIn(name) ?? countryIn(src.name, true) ?? (multiCountry ? countryIn("Middle East") : null);
  let region = stateIn(name) ?? stateIn(src.name) ?? "";
  if (!country && region) country = COUNTRIES.find((c) => c.code === "US") ?? null;
  if (country && country.code !== "US" && region) region = "";
  const world = COUNTRIES.find((c) => c.code === "WW")!;
  if (!country) { country = world; flags.push("country not detected (set to Worldwide)"); }

  // packages
  const price = (reg: number | null, sale: number | null) => toCents(sale && (!reg || sale <= reg) ? sale : reg);
  let packages: ImportPackage[] = [];
  let dropped = 0;
  if (src.kind === "variable" && src.variations.length) {
    const vs = src.variations.map((v) => ({ v, q: parseQty(v.label) ?? parseQty(v.name.replace(src.name, "")) })).sort((a, b) => (a.q ?? Infinity) - (b.q ?? Infinity));
    const pick = vs.length <= 3 ? vs : [vs[0], vs[Math.floor((vs.length - 1) / 2)], vs[vs.length - 1]];
    dropped = vs.length - pick.length;
    const names = pick.length === 1 ? ["Complete"] : pick.length === 2 ? ["Starter", "Complete"] : ["Starter", "Professional", "Complete"];
    packages = pick.map(({ v, q }, i) => ({ name: names[i], records: q ?? 0, priceUsdCents: price(v.regular, v.sale), link: /^https:\/\//i.test(v.url) ? v.url : "", highlighted: pick.length === 3 && i === 1 }));
    if (dropped) flags.push(`${dropped} of ${vs.length} variations not imported (limit 3 packages)`);
  } else {
    if (src.kind === "variable") flags.push("variable product without variations");
    packages = [{ name: "Complete", records: parseQty(src.name.split(/\s[-–—]\s/).slice(1).join(" ")) ?? parseQty(src.name) ?? 0, priceUsdCents: price(src.regular, src.sale), link: /^https:\/\//i.test(src.url) ? src.url : "" }];
  }
  if (packages.some((p) => !p.priceUsdCents)) flags.push("price missing");
  if (packages.some((p) => !p.records)) flags.push("contact count missing");
  else if (src.kind === "simple") flags.push("contact count read from the product title: check it");
  if (packages.some((p) => !p.link)) flags.push("download link missing");
  if (packages.some((p) => p.link && !/^https:\/\//i.test(p.link))) flags.push("download link is not https");
  if (src.published !== "1") flags.push("not published on WordPress");
  if (restricted.length) flags.push(`restricted: ${[...new Set(restricted)].join(", ")}`);
  if (src.description.length < 120) flags.push("source description has no facts (generated text used)");

  const recordCount = Math.max(0, ...packages.map((p) => p.records)) || null;
  let slug = slugFor(src.name) || `product-${src.wpId}`;
  if (reserved.has(slug)) slug = `${slug}-${src.wpId}`;
  const where = info.channel === "phone" ? "phone numbers" : info.channel === "consumer-email" ? "consumer email addresses" : info.channel === "business-email" ? "business email contacts" : "email contacts";
  const geo = region ? `${region}, United States` : country.code === "WW" ? "" : country.name;
  const description = sentence(`${name}: a ready-made list of ${where}${geo ? ` for ${geo}` : ""}.${recordCount ? ` The largest package holds ${recordCount.toLocaleString("en-US")} records.` : ""} You pay once and receive the file as CSV, Excel or TXT.`);
  return {
    sourceId: src.wpId, slug, name, title: name, description, originalDescription: src.description.slice(0, 19000), shortDescription: src.shortDescription,
    categorySlug: slugify(info.categoryName), categoryName: info.categoryName, channel: info.channel, group: info.group,
    jobTitle: info.group === "job-title" ? name.replace(/\b(email|mailing|database|list|leads)\b.*$/i, "").trim() : "",
    countrySlug: country.slug, countryCode: country.code, countryName: country.name, region, city: "",
    restricted: [...new Set(restricted)], flags, recordCount, packages, seoTitle: "", metaDescription: "", imageUrl: src.images[0] ?? "",
    tags: src.tags, sourceCategories: src.categories, sourceVariations: src.variations.length, droppedVariations: dropped,
    sourceRegular: src.regular, sourceSale: src.sale, wpPublished: src.published === "1", sku: src.sku, titleKey: name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
  };
}

/** Blocking reasons: the bulk "publish" action refuses these (the owner can still fix them and try again). */
export function publishBlockers(p: { restricted: string[]; packages: { priceUsdCents: number; link?: string }[]; flags?: string[] }, hasLink: boolean[] = []): string[] {
  const out: string[] = [];
  // Owner decision (20 Nov 2026): restricted-flagged products (consumer, phone, WhatsApp, EU/UK) can be published; the flag stays as information.
  if (!p.packages.length || p.packages.some((k) => !k.priceUsdCents)) out.push("price missing");
  if (hasLink.length ? hasLink.some((x) => !x) : p.packages.some((k) => !k.link)) out.push("download link missing");
  return out;
}
