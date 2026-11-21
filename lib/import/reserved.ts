// Slugs that belong to code-defined pages. An imported product must never take one of them.
import { getCategories, getCountries, getProducts } from "@/lib/catalog";
import { TAXONOMY } from "@/lib/taxonomy";

export function reservedSlugs(): Set<string> {
  const s = new Set<string>(["cities", "bundles", "custom-list", "local-businesses-database", "healthcare-lists", "webmail-lists", "crypto-blockchain", "exhibitors-email-lists"]);
  for (const p of getProducts()) s.add(p.slug);
  for (const c of getCategories()) s.add(c.slug);
  for (const k of getCountries()) s.add(`${k.slug}-business-email-lists`);
  for (const g of TAXONOMY) { s.add(g.slug); for (const c of g.children) s.add(c.slug); }
  return s;
}
