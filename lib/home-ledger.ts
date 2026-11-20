import { getDefaultSample, getProducts } from "@/lib/catalog";
import type { LedgerSheet } from "@/components/home/sample-ledger";

/** Home preview sheets: products with a sample of their own (max 4), else the site-wide sample. Real rows only. */
export function ledgerSheets(): LedgerSheet[] {
  const fmt = (rows: readonly { business: string; city: string; address: string; email: string; phone: string }[]): LedgerSheet["rows"] => rows.slice(0, 5).map((r) => [r.business, r.city || r.address, r.email, r.phone]);
  const own = getProducts().filter((p) => p.samples?.length && p.status === "live").slice(0, 4).map((p): LedgerSheet => ({ key: p.slug, label: p.title, rows: fmt(p.samples!) }));
  if (own.length) return own;
  const d = getDefaultSample();
  return d.length ? [{ key: "default", label: "Sample", rows: fmt(d) }] : [];
}
