import { getProduct } from "@/lib/catalog";
import type { SampleRow } from "@/lib/sample-data";

/** The first real (masked) sample among these products, or null. Category pages show a sample table ONLY when one really exists. */
export function realSamples(slugs: string[]): { slug: string; rows: NonNullable<ReturnType<typeof getProduct>>["samples"] } | null {
  for (const s of slugs) { const p = getProduct(s); if (p?.samples?.length) return { slug: s, rows: p.samples }; }
  return null;
}
export function sheetRows(slugs: string[]): readonly SampleRow[] | null {
  const r = realSamples(slugs);
  return r?.rows ? r.rows.map((x): SampleRow => [x.business, x.city || x.address, x.email, x.phone]) : null;
}
