// SEO-friendly names, slugs, titles and descriptions for products (section 98). Pure and deterministic: built ONLY from the product's own
// fields (name, country, state, channel, record count). No ratings, accuracy claims or invented facts.
export type SeoInput = {
  name: string; categoryName: string; channel: string; countryName: string; region?: string | null; recordCount?: number | null; placeholder?: boolean;
};
export type SeoText = { subject: string; suffix: string; place: string; name: string; title: string; slugBase: string; seoTitle: string; metaDescription: string };

const SHORT: Record<string, string> = { "united states": "USA", "united states of america": "USA", usa: "USA", us: "USA", "united kingdom": "UK", uk: "UK", "united arab emirates": "UAE", uae: "UAE" };
const NOISE = /\b(emails?|e-mails?|phones?|numbers?|lists?|databases?|database|mailing|contacts?|leads?|data|directory|b2b|b2c|usa|us|united states|america|american|worldwide)\b/gi;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** The audience of the list, taken from the product's own name with country, state and channel words removed. */
export function subjectOf(i: SeoInput): string {
  let s = i.name;
  for (const w of [i.countryName, i.region ?? ""]) if (w.trim()) s = s.replace(new RegExp(`\\b${esc(w.trim())}\\b`, "gi"), " ");
  s = s.replace(/\([^)]*\)/g, " ").replace(/\bsales\s+leads?\b/gi, " ").replace(NOISE, " ").replace(/\s*[-–—|:,]+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  if (!s) s = i.categoryName.replace(NOISE, " ").replace(/\s{2,}/g, " ").trim();
  if (!s) s = "Business";
  return s.split(" ").map((w) => (w === w.toUpperCase() || w === "&" ? w : w[0].toUpperCase() + w.slice(1))).join(" ").slice(0, 70).trim();
}

export function seoText(i: SeoInput): SeoText {
  const subject = subjectOf(i);
  const phone = i.channel === "phone", consumer = i.channel === "consumer-email";
  const suffix = phone ? "Phone Number List" : consumer && !/consumer/i.test(subject) ? "Consumer Email List" : "Email List";
  const worldwide = /^(worldwide|global)$/i.test(i.countryName.trim()) || !i.countryName.trim();
  const country = worldwide ? "" : SHORT[i.countryName.trim().toLowerCase()] ?? i.countryName.trim();
  const region = (i.region ?? "").trim();
  const place = worldwide ? "Worldwide" : region ? `${region}, ${country}` : country;
  const name = (worldwide ? `${subject} ${suffix} Worldwide` : `${subject} ${suffix} in ${place}`).replace(/\s{2,}/g, " ").slice(0, 120);
  const title = `${subject} contacts ${worldwide ? "worldwide" : `in ${place}`}`.slice(0, 120);
  const slugBase = slugify(`${subject} ${suffix} ${worldwide ? "worldwide" : place}`).slice(0, 100).replace(/-+$/g, "");
  let seoTitle = `Buy ${name} | BeigeLeads`;
  if (seoTitle.length > 60) seoTitle = `Buy ${name}`;
  if (seoTitle.length > 62) seoTitle = name;
  const n = i.recordCount && i.recordCount > 0 && !i.placeholder ? `${i.recordCount.toLocaleString("en-US")} records. ` : "";
  let meta = `${name}. ${n}Preview a masked sample, pay once and get the file as CSV, Excel or TXT. No subscription.`;
  if (meta.length > 158) meta = `${name}. Preview a masked sample, pay once and get the file as CSV, Excel or TXT.`;
  if (meta.length > 158) meta = meta.slice(0, 155).replace(/\s+\S*$/, "") + "...";
  return { subject, suffix, place, name, title, slugBase, seoTitle, metaDescription: meta };
}

/** Subjects that belong in ONE shared category, whatever country the list is for (so every dentist list sits under Dentists). */
const CATEGORY_RULES: [RegExp, string, string][] = [
  [/dentist|dental|orthodont|endodont|periodont|prosthodont|oral surg/i, "dentists", "Dentists"],
  [/restaurant|pizza|catering|diner|bistro/i, "restaurants", "Restaurants"],
  [/\bski\b|snowboard/i, "ski-shops", "Ski Shops"],
  [/chiropract/i, "chiropractors", "Chiropractors"],
  [/veterinar|animal hospital|vet clinic|\bvets?\b/i, "veterinarians", "Veterinarians"],
  [/pharmac/i, "pharmacies", "Pharmacies"],
  [/optom|optician|ophthalm|eye care/i, "eye-care-providers", "Eye Care Providers"],
  [/psycholog|psychiatr|therapist|social worker|counsel|mental health/i, "mental-health-professionals", "Mental Health Professionals"],
  [/\bnurs|midwi|caregiver/i, "nurses", "Nurses"],
  [/hospital|clinic|surgery cent|ambulatory|urgent care|medical spa|medspa|med spa/i, "clinics-and-hospitals", "Clinics and Hospitals"],
  [/physician|doctor|general practi|family medicine|internal medicine|surgeon|urolog|dermat|cardiolog|endocrin|gynec|obstetric|oncolog|orthop|neurolog|pediatr|radiolog|anesthes|gastro|pulmon|rheumat|nephrolog|podiat/i, "doctors-and-specialists", "Doctors and Specialists"],
  [/physical therap|acupunct|massage|wellness|health and wellness|yoga/i, "wellness-providers", "Wellness Providers"],
];

/** The shared category a list belongs in, decided from its audience; null = keep the category it already has. */
export function categoryForSubject(subject: string): { slug: string; name: string } | null {
  for (const [re, slug, name] of CATEGORY_RULES) if (re.test(subject)) return { slug, name };
  return null;
}
