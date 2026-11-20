import { sampleRowsOf } from "@/lib/catalog";
import type { SampleRow } from "@/lib/sample-data";

/** The first real (masked) sample among these products (their own, else the site-wide one), or null. */
export function realSamples(slugs: string[]): { slug: string; rows: ReturnType<typeof sampleRowsOf> } | null {
  for (const s of slugs) { const r = sampleRowsOf(s); if (r.length) return { slug: s, rows: r }; }
  return null;
}
export function sheetRows(slugs: string[]): readonly SampleRow[] | null {
  const r = realSamples(slugs);
  return r ? r.rows.map((x): SampleRow => [x.business, x.city || x.address, x.email, x.phone]) : null;
}
