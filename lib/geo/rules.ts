/** Pure geography rules (no database): slugs, indexing, parsing the import file. */

export const slugify = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

/** A place page may be indexed only with REAL inventory and an allowed flag. Everything else is noindex. */
export function isIndexable(a: { coverageCount: number | null; areaIndexable: boolean }): boolean {
  return a.areaIndexable && (a.coverageCount ?? 0) > 0;
}

export type ImportRow = { region: string; city: string; category: string; records: number };
export type ImportResult = { rows: ImportRow[]; errors: string[] };

/** Parses CSV text with the header: region,city,category,records (region or city may be empty, not both). */
export function parseImport(text: string, knownCategories: readonly string[]): ImportResult {
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  const errors: string[] = [];
  const rows: ImportRow[] = [];
  if (!lines.length) return { rows, errors: ["The file is empty."] };
  const head = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const idx = (n: string) => head.indexOf(n);
  const [ri, ci, ki, ni] = [idx("region"), idx("city"), idx("category"), idx("records")];
  if (ki < 0 || ni < 0 || (ri < 0 && ci < 0)) return { rows, errors: ["The first line must be: region,city,category,records"] };
  if (lines.length > 2001) return { rows, errors: ["At most 2000 rows per import."] };
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(",").map((x) => x.trim());
    const region = ri >= 0 ? c[ri] ?? "" : "";
    const city = ci >= 0 ? c[ci] ?? "" : "";
    const category = slugify(c[ki] ?? "");
    const records = Number((c[ni] ?? "").replace(/[ _]/g, ""));
    const bad = (m: string) => errors.push(`Line ${i + 1}: ${m}`);
    if (!region && !city) bad("region or city is needed.");
    else if (!knownCategories.includes(category)) bad(`unknown category "${c[ki] ?? ""}".`);
    else if (!Number.isInteger(records) || records < 0 || records > 100_000_000) bad("records must be a whole number (0 or more).");
    else if ((region && !slugify(region)) || (city && !slugify(city))) bad("a place name has no letters or digits.");
    else rows.push({ region, city, category, records });
    if (errors.length >= 20) { errors.push("Too many errors, fix these first."); break; }
  }
  return { rows, errors };
}
