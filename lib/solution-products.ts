import { getProduct, getProducts, type Product } from "@/lib/catalog";
import { isRealProduct } from "@/lib/cart/model";
import type { Solution } from "@/lib/solutions";

/** Solutions that are about one niche keep their own list; every other solution shows real catalog lists, rotated per solution so they are not all the same three. */
const NICHE = new Set(["healthcare-marketing"]);
const hash = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

export function solutionProducts(s: Solution, max = 3): Product[] {
  const own = s.productSlugs.flatMap((x) => { const p = getProduct(x); return p ? [p] : []; });
  if (NICHE.has(s.slug)) return own.slice(0, max);
  const real = getProducts().filter(isRealProduct);
  if (!real.length) return own.slice(0, max);
  // One list per category first, so the three cards cover different industries.
  const seen = new Set<string>(); const pool: Product[] = [];
  for (const p of real) if (!seen.has(p.categorySlug)) { seen.add(p.categorySlug); pool.push(p); }
  const start = hash(s.slug) % pool.length; const out: Product[] = [];
  for (let i = 0; i < Math.min(max, pool.length); i++) out.push(pool[(start + i) % pool.length]);
  return out;
}
