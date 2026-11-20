// Decides, row by row, what an import will do. Pure: the browser shows it as the preview, the server runs the same code again before saving.
import { toEntry, validate, type Entry, type Raw } from "./clean";

export type Existing = { id: number; slug: string; term: string; status: "draft" | "published" };
export type Opts = { mode: "skip" | "update"; allowUpdatePublished: boolean; forceDraft: boolean };
export type Known = { products: string[]; guides: string[]; categories: string[] };
export type PlanRow = { row: number; entry: Entry; action: "create" | "update" | "skip" | "error"; existingId?: number; existingStatus?: "draft" | "published"; errors: string[]; warnings: string[]; note?: string };

export const DEFAULT_OPTS: Opts = { mode: "skip", allowUpdatePublished: false, forceDraft: false };
const lc = (s: string) => s.trim().toLowerCase();

export function planImport(rows: { raw: Raw; row: number }[], existing: Existing[], known: Known, opts: Opts = DEFAULT_OPTS): PlanRow[] {
  const bySlug = new Map(existing.map((e) => [e.slug, e])); const byTerm = new Map(existing.map((e) => [lc(e.term), e]));
  const fileSlugs = new Map<string, number>(); const fileTerms = new Map<string, number>(); const fileSeoTitles = new Map<string, number>();
  const parsed = rows.map(({ raw, row }) => ({ row, ...toEntry(raw) }));
  const termKnown = new Set<string>([...existing.map((e) => lc(e.term)), ...existing.map((e) => e.slug), ...parsed.map((p) => lc(p.entry.term)), ...parsed.map((p) => p.entry.slug)]);
  const products = new Set(known.products.map(lc)); const guides = new Set(known.guides.map(lc));
  const cats = new Set(known.categories.map(lc));
  return parsed.map(({ row, entry, badStatus }): PlanRow => {
    if (opts.forceDraft) entry.status = "draft";
    const v = validate(entry, { badStatus });
    const errors = [...v.errors]; const warnings = [...v.warnings];
    const hit = bySlug.get(entry.slug) ?? byTerm.get(lc(entry.term));
    // duplicates inside the file: the first row wins
    const ds = fileSlugs.get(entry.slug); const dt = fileTerms.get(lc(entry.term));
    if (entry.slug && ds !== undefined) errors.push(`Same slug as row ${ds} in this file.`);
    else if (entry.term && dt !== undefined) errors.push(`Same term as row ${dt} in this file.`);
    if (!errors.length) { fileSlugs.set(entry.slug, row); fileTerms.set(lc(entry.term), row); }
    if (entry.seoTitle) { const o = fileSeoTitles.get(lc(entry.seoTitle)); if (o !== undefined) warnings.push(`Same SEO title as row ${o}.`); else fileSeoTitles.set(lc(entry.seoTitle), row); }
    for (const t of entry.relatedTerms) if (!termKnown.has(lc(t)) && !termKnown.has(t)) warnings.push(`Related term “${t}” is not in the glossary yet.`);
    for (const p of entry.relatedProducts) if (!products.has(lc(p))) warnings.push(`Related product “${p}” was not found in the catalog and will not be shown.`);
    if (known.guides.length) for (const g of entry.relatedGuides) { const k = lc(g).replace(/^\/(guides|blog)\//, ""); if (!guides.has(k)) warnings.push(`Related guide “${g}” was not found and will not be shown.`); }
    if (entry.category && !cats.has(lc(entry.category)) && !cats.has(lc(entry.category.replace(/\s+/g, "-")))) warnings.push(`Category “${entry.category}” does not exist yet. It will be created.`);

    const base = { row, entry, errors, warnings };
    if (errors.length && !hit) return { ...base, action: "error" };
    if (hit) {
      const sameTermOtherSlug = hit.slug !== entry.slug;
      if (sameTermOtherSlug) warnings.push(`This term already exists as “${hit.slug}”.`);
      if (errors.some((e) => /Same (slug|term) as row/.test(e))) return { ...base, action: "error", existingId: hit.id, existingStatus: hit.status };
      const hard = errors.filter((e) => /^(Term is missing|A slug could not|Slug may only|Status ")/.test(e));
      if (hard.length) return { ...base, errors: hard, action: "error", existingId: hit.id, existingStatus: hit.status };
      if (opts.mode === "skip") return { ...base, errors: [], action: "skip", existingId: hit.id, existingStatus: hit.status, note: "Already exists. Skipped." };
      if (hit.status === "published" && !opts.allowUpdatePublished) return { ...base, errors: [], action: "skip", existingId: hit.id, existingStatus: hit.status, note: "Published entry protected. Tick “allow updating published entries” to change it." };
      return { ...base, errors: [], action: "update", existingId: hit.id, existingStatus: hit.status, note: hit.status === "published" ? "Updates a published entry." : "Updates an existing draft." };
    }
    return { ...base, action: "create" };
  });
}

export const summarize = (p: PlanRow[]) => ({ create: p.filter((x) => x.action === "create").length, update: p.filter((x) => x.action === "update").length, skip: p.filter((x) => x.action === "skip").length, error: p.filter((x) => x.action === "error").length, warn: p.filter((x) => x.action !== "error" && x.warnings.length).length });
