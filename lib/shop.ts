import { getCategory, startingPriceCents, type Product } from "@/lib/catalog";

export const SORTS = ["relevance", "availability", "price-low", "price-high"] as const;
export type Sort = (typeof SORTS)[number];
export const PAGE_SIZE = 12;

export type ShopQuery = { q: string; category: string; country: string; sort: Sort; page: number };

export function parseShopQuery(sp: Record<string, string | string[] | undefined>): ShopQuery {
  const one = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v) ?? ""; };
  const sort = one("sort") as Sort;
  return { q: one("q").trim().slice(0, 80), category: one("category").slice(0, 60), country: one("country").slice(0, 60), sort: SORTS.includes(sort) ? sort : "relevance", page: Math.max(1, Math.min(500, Number(one("page")) || 1)) };
}

/** Filters, sorts and pages the catalog. Pure. `featured` = admin-ordered industry slugs used for "relevance". */
export function shopProducts(all: readonly Product[], q: ShopQuery, featured: string[] = []) {
  const term = q.q.toLowerCase();
  let list = all.filter((p) => (!q.category || p.categorySlug === q.category) && (!q.country || p.countrySlug === q.country));
  if (term) list = list.filter((p) => [p.name, p.title, getCategory(p.categorySlug)?.name ?? "", p.description].some((t) => t.toLowerCase().includes(term)));
  const rank = (p: Product) => { const i = featured.indexOf(p.categorySlug); return i < 0 ? 999 : i; };
  const price = (p: Product) => startingPriceCents(p) ?? Number.MAX_SAFE_INTEGER;
  const live = (p: Product) => (p.status === "live" ? 0 : 1);
  list = [...list].sort((a, b) => {
    if (q.sort === "availability") return live(a) - live(b) || rank(a) - rank(b) || a.name.localeCompare(b.name);
    if (q.sort === "price-low") return price(a) - price(b) || a.name.localeCompare(b.name);
    if (q.sort === "price-high") return (price(b) === Number.MAX_SAFE_INTEGER ? -1 : price(b)) - (price(a) === Number.MAX_SAFE_INTEGER ? -1 : price(a)) || a.name.localeCompare(b.name);
    return rank(a) - rank(b) || live(a) - live(b) || a.name.localeCompare(b.name);
  });
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(q.page, pages);
  return { items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, pages, page };
}

/** Query string for a shop URL; defaults are left out so each view has one canonical form. */
export function shopHref(q: Partial<ShopQuery> & { type?: string }) {
  const u = new URLSearchParams();
  if (q.type && q.type !== "b2b") u.set("type", q.type);
  if (q.q) u.set("q", q.q);
  if (q.category) u.set("category", q.category);
  if (q.country) u.set("country", q.country);
  if (q.sort && q.sort !== "relevance") u.set("sort", q.sort);
  if (q.page && q.page > 1) u.set("page", String(q.page));
  const s = u.toString();
  return s ? `/shop?${s}` : "/shop";
}
