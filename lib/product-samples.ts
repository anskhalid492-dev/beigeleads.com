// Real sample rows (section 97): the owner pastes rows from the real file, the site MASKS them before anything is stored or shown.
// Pure (browser preview and server use the same code). Unmasked emails, phone numbers and house numbers are never stored.
export type SampleRowData = { business: string; address: string; city: string; phone: string; email: string; website: string };
export const MAX_SAMPLE_ROWS = 10;

export function maskEmail(raw: string): string {
  const v = raw.trim().toLowerCase();
  const at = v.lastIndexOf("@");
  if (at < 1 || at === v.length - 1 || /\s/.test(v)) return "";
  return `${v[0]}***@${v.slice(at + 1)}`;
}
/** Keeps the shape and the first digits, hides the last four digits (or all but two when the number is short). */
export function maskPhone(raw: string): string {
  const v = raw.trim().slice(0, 40);
  const digits = v.replace(/\D/g, "");
  if (digits.length < 5) return "";
  const hide = digits.length >= 8 ? 4 : digits.length - 2;
  let seen = 0;
  const total = digits.length;
  return v.replace(/\d/g, (d) => (++seen > total - hide ? "*" : d));
}
/** Hides the house number, keeps the street. */
export function maskAddress(raw: string): string {
  return raw.trim().slice(0, 120).replace(/^\s*(?:#?\d+[a-z]?(?:[-/]\d+)?)(?=[\s,])/i, "***").replace(/^(\d)/, "***");
}
export function siteDomain(raw: string): string {
  const v = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  const host = v.split(/[/?#]/)[0];
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) ? host : "";
}
const clip = (s: string, n: number) => s.trim().replace(/\s+/g, " ").slice(0, n);

const ALIASES: Record<keyof SampleRowData | "slug", string[]> = {
  slug: ["slug", "product", "product slug"],
  business: ["business", "business name", "name", "company", "company name"],
  address: ["address", "street", "street address"],
  city: ["city", "town"],
  phone: ["phone", "telephone", "phone number", "mobile"],
  email: ["email", "e-mail", "email address"],
  website: ["website", "url", "domain", "web"],
};
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export function pickField(row: Record<string, string>, key: keyof typeof ALIASES): string {
  for (const h of Object.keys(row)) if (ALIASES[key].includes(norm(h))) return row[h] ?? "";
  return "";
}

/** One raw row (header -> value) to a masked row, or null when there is no business name. */
export function maskRow(row: Record<string, string>): SampleRowData | null {
  const business = clip(pickField(row, "business"), 120);
  if (!business) return null;
  return { business, address: maskAddress(pickField(row, "address")), city: clip(pickField(row, "city"), 80), phone: maskPhone(pickField(row, "phone")), email: maskEmail(pickField(row, "email")), website: siteDomain(pickField(row, "website")) };
}
export function maskRows(rows: Record<string, string>[]): SampleRowData[] {
  const seen = new Set<string>(); const out: SampleRowData[] = [];
  for (const r of rows) { const m = maskRow(r); if (m && !seen.has(m.business.toLowerCase())) { seen.add(m.business.toLowerCase()); out.push(m); } if (out.length >= MAX_SAMPLE_ROWS) break; }
  return out;
}
/** Safe re-validation of rows read back from the database (shape only). */
export function cleanStored(v: unknown): SampleRowData[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, MAX_SAMPLE_ROWS).flatMap((r) => (r && typeof r === "object" && typeof (r as SampleRowData).business === "string"
    ? [{ business: clip((r as SampleRowData).business, 120), address: clip(String((r as SampleRowData).address ?? ""), 120), city: clip(String((r as SampleRowData).city ?? ""), 80), phone: clip(String((r as SampleRowData).phone ?? ""), 40), email: clip(String((r as SampleRowData).email ?? ""), 120), website: clip(String((r as SampleRowData).website ?? ""), 120) }] : []));
}
