// Recommendations over the REAL catalog (CLAUDE.md section 173): at most three, on sale, never already owned, real counts and prices only.
import { getProducts, formatUsd, startingPriceCents, getCountry, getCategory, type Product } from "@/lib/catalog";
import { isRealProduct } from "@/lib/cart/model";
import { SITE } from "@/lib/system-emails/brand";
import type { Card } from "./render";

export type RecKind = "general" | "country" | "industry";
const sellable = (p: Product) => isRealProduct(p) && p.packages.length > 0;

/** Most related first. `kind` narrows: country = other markets for the same audience; industry = other industries in the same market. */
export function recommend(ownedSlugs: string[], opts: { kind?: RecKind; override?: string[]; prefCountries?: string[]; prefIndustries?: string[]; limit?: number } = {}): Product[] {
  const limit = Math.min(3, opts.limit ?? 3);
  const owned = new Set(ownedSlugs);
  const all = getProducts().filter((p) => sellable(p) && !owned.has(p.slug));
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  const forced = (opts.override ?? []).map((s) => bySlug.get(s)).filter((p): p is Product => !!p);
  const base = getProducts().filter((p) => owned.has(p.slug));
  const cats = new Set(base.map((p) => p.categorySlug)); const ctys = new Set(base.map((p) => p.countrySlug));
  const pc = new Set((opts.prefCountries ?? []).map((x) => x.toLowerCase())); const pi = new Set((opts.prefIndustries ?? []).map((x) => x.toLowerCase()));
  const score = (p: Product) => {
    const sameCat = cats.has(p.categorySlug), sameCty = ctys.has(p.countrySlug);
    if (opts.kind === "country" && !(sameCat && !sameCty)) return -1;
    if (opts.kind === "industry" && !(sameCty && !sameCat)) return -1;
    return Number(sameCat) * 8 + Number(sameCty) * 4 + Number(pc.has(p.countrySlug)) * 3 + Number(pi.has(p.categorySlug)) * 3;
  };
  const rank = all.map((p) => [score(p), p.slug, p] as const).filter((r) => r[0] >= 0 && (opts.kind || r[0] > 0)).sort((a, b) => b[0] - a[0] || a[1].localeCompare(b[1])).map((r) => r[2]);
  const out: Product[] = [];
  for (const p of [...forced, ...rank]) if (!out.some((o) => o.slug === p.slug)) out.push(p);
  return out.slice(0, limit);
}

export const productUrl = (p: Product) => `${SITE}/lists/${p.slug}`;
export function toCard(p: Product): Card {
  const c = getCategory(p.categorySlug)?.name ?? ""; const k = getCountry(p.countrySlug)?.name ?? "";
  const cents = startingPriceCents(p);
  return { name: p.name, meta: [c, k].filter(Boolean).join(" | "), url: productUrl(p), records: p.recordCount ? p.recordCount.toLocaleString("en-US") : undefined, price: cents ? formatUsd(cents) : undefined };
}
