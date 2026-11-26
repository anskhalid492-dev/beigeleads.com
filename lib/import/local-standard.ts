// Bulk standard for Local Businesses Database products (section 171). Pure and deterministic: built ONLY from the product's own fields.
// No counts, accuracy or rating claims are written; the only figures are the owner's three package sizes and prices.
import { LOCAL_FIELD_NAMES } from "@/lib/product-fields";
import { slugify, subjectOf } from "@/lib/import/seo-text";

export const REMOVE_FIELDS = ["Year founded", "Employee count range", "Revenue range", "Ownership type", "Registration number", "Contact job title", "Owner name", "Fax", "Website technology", "Email verification status"] as const;
export const STANDARD_PACKAGES = [
  { name: "Starter", records: 5000, priceUsdCents: 3900, highlighted: false },
  { name: "Professional", records: 10000, priceUsdCents: 5900, highlighted: true },
  { name: "Complete", records: 15000, priceUsdCents: 9900, highlighted: false },
] as const;
export type MetaPrefix = "1M+" | "15k+";

export type StdInput = {
  slug: string; name: string; categoryName: string; channel: string; countryName: string; region?: string | null;
  seoTitle?: string | null; metaDescription?: string | null; dataFields: string[]; fieldsCustom: boolean;
};
export type Std = {
  skip: boolean; subject: string; name: string; title: string; description: string; coverage: string; dataFields: string[]; fieldsCustom: boolean;
  slugBase: string; seoTitle: string; metaDescription: string;
};

const THE = new Set(["united states", "united kingdom", "united arab emirates", "netherlands", "philippines", "czech republic", "bahamas", "gambia"]);
export const countryPhrase = (c: string) => { const n = c.trim(); return !n || /^(worldwide|global)$/i.test(n) ? "the world" : THE.has(n.toLowerCase()) ? `the ${n}` : n; };
const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h; };

/** "Dentists" -> "Dentist", "Beauty Salons" -> "Beauty Salon", "Boutiques" -> "Boutique". Only the last word changes. */
export function singular(subject: string): string {
  const w = subject.trim().split(/\s+/); const l = w.pop() ?? "";
  let s = l;
  if (/[^aeiou]ies$/i.test(l)) s = l.replace(/ies$/i, "y");
  else if (/(ss|sses|us)$/i.test(l)) s = /sses$/i.test(l) ? l.slice(0, -2) : l;
  else if (/(xes|ches|shes|zes)$/i.test(l)) s = l.slice(0, -2);
  else if (/s$/i.test(l)) s = l.slice(0, -1);
  return [...w, s].join(" ");
}

const cut = (t: string, max: number) => (t.length <= max ? t : t.slice(0, max - 1).replace(/\s+\S*$/, "").replace(/[ ,;:.-]+$/, "") + "…");

const DESC = [
  (s: string, c: string) => `Reach ${s} across ${c} with this ready-made email database. Records are built from business listings, company websites and public registries, checked by our team and refreshed every 90 days. Preview a masked sample, pick 5,000, 10,000 or 15,000 contacts, pay once and download as CSV, Excel or TXT.`,
  (s: string, c: string) => `A ready-made email database of ${s} in ${c}. We collect from business listings, company websites and public registries, check every email and refresh the data every 90 days. See a masked sample first, then choose 5,000, 10,000 or 15,000 contacts. One payment, no subscription, CSV, Excel or TXT.`,
  (s: string, c: string) => `Contact ${s} in ${c} directly. This database combines business listings, company websites and public registries, with emails checked by our team and a refresh every 90 days. Request a free masked sample, choose a package of 5,000, 10,000 or 15,000 contacts and pay once.`,
  (s: string, c: string) => `Build your outreach list of ${s} in ${c}. Each record comes from business listings, websites and public registries, is checked before delivery and refreshed every 90 days. Look at a masked sample, pick 5,000, 10,000 or 15,000 contacts, pay once and get CSV, Excel or TXT.`,
];
const META = [
  (s: string, c: string) => `Verified ${s} email database for ${c}. See a masked sample, pay once, download CSV, Excel or TXT. No subscription.`,
  (s: string, c: string) => `Get ${s} contacts in ${c} in 5,000, 10,000 or 15,000 packages. Free masked sample, one payment, refreshed every 90 days.`,
  (s: string, c: string) => `Email ${s} in ${c} with a ready-made list. Checked by our team, refreshed every 90 days. Pay once, no subscription.`,
  (s: string, c: string) => `${s} email list for ${c}: business emails, phones and locations. Preview a masked sample, then buy once and own the file.`,
  (s: string, c: string) => `Start outreach to ${s} in ${c}. Pick 5,000, 10,000 or 15,000 contacts, pay once, get CSV, Excel or TXT delivered.`,
  (s: string, c: string) => `Own a database of ${s} in ${c}. Built from business listings and public registries, refreshed every 90 days. Free sample.`,
  (s: string, c: string) => `Looking for ${s} in ${c}? Buy a ready-made email database, check a free masked sample first and pay one time.`,
  (s: string, c: string) => `${s} database for ${c} with emails checked by our team. Choose a size from 5,000 to 15,000 contacts. One-time price.`,
];

/** Everything the bulk tool sets for one product. `taken` = meta descriptions already used (kept unique). */
export function standardize(i: StdInput, prefix: MetaPrefix, taken: Set<string> = new Set()): Std {
  const skip = !!(i.seoTitle?.trim() && i.metaDescription?.trim());
  const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const cleaned = [i.countryName, i.region ?? ""].filter((w) => w.trim()).reduce((n, w) => n.replace(new RegExp(`\\b(in|for|across)?\\s*(the\\s+)?${esc(w.trim())}\\b`, "gi"), " "), i.name).replace(/\b(in|for|across)\s+(the\s+)?(usa|us|united states)\b/gi, " ").replace(/\s+(in|the|for)\s*$/i, "").trim();
  const subject = subjectOf({ name: cleaned, categoryName: i.categoryName, channel: i.channel, countryName: i.countryName, region: i.region });
  const country = i.countryName.trim() && !/^(worldwide|global)$/i.test(i.countryName.trim()) ? i.countryName.trim() : "";
  const cp = countryPhrase(country);
  const lower = (s: string) => s; // subject keeps its capitals (names such as "RV Parks")
  const name = `${subject} Email Database`.slice(0, 120);
  const title = `List of ${lower(subject)} in ${cp}`.slice(0, 120);
  let seoTitle = `${prefix} ${name} 2027 Updated Database`;
  if (seoTitle.length > 60) seoTitle = `${prefix} ${subject} Email 2027 Updated Database`;
  if (seoTitle.length > 60) seoTitle = `${prefix} ${subject} 2027 Updated Database`;
  seoTitle = cut(seoTitle, 60);
  const h = hash(i.slug + subject + country);
  const description = (() => { for (let k = 0; k < DESC.length; k++) { const d = DESC[(h + k) % DESC.length](subject, cp); if (d.length <= 300) return d; } return cut(DESC[0](subject, cp), 300); })();
  let metaDescription = "";
  for (let k = 0; k < META.length * 2 && !metaDescription; k++) {
    const m = META[(h + k) % META.length](subject, cp);
    if (m.length <= 155 && !taken.has(m.toLowerCase())) metaDescription = m;
  }
  if (!metaDescription) metaDescription = cut(`${META[h % META.length](subject, cp)} ${i.slug}`, 155);
  // Fields: the product's real current list (the local default when it has no own selection) minus the ten named fields.
  const base = i.fieldsCustom && i.dataFields.length ? i.dataFields : [...LOCAL_FIELD_NAMES];
  const drop = new Set(REMOVE_FIELDS.map((f) => f.toLowerCase()));
  const dataFields = base.filter((f) => !drop.has(f.toLowerCase()));
  const isDefault = dataFields.length === LOCAL_FIELD_NAMES.length && dataFields.every((f, n) => f === LOCAL_FIELD_NAMES[n]);
  return {
    skip, subject, name, title, description, coverage: country || "Worldwide", dataFields, fieldsCustom: !isDefault,
    slugBase: slugify(`${singular(subject)} business email database`), seoTitle, metaDescription,
  };
}
