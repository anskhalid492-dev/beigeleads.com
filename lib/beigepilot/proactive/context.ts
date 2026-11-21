// Turns a page path + session facts into REAL context (product names, industry, country, cart) from the catalog. Server only.
import { getCategory, getCountry, getProduct, offeredPackages, formatUsd } from "@/lib/catalog";
import { cleanSearch } from "./types";
import type { ProContext } from "./select";

export type CtxInput = { path: string; search?: string; recent: string[]; cart: string[] };
const slugOf = (p: string) => p.split("?")[0].split("/").filter(Boolean);

export function buildContext(i: CtxInput): ProContext {
  const seg = slugOf(i.path);
  const ctx: ProContext = { page: "other", viewed: 0, cart: [], search: cleanSearch(i.search) || undefined };
  if (seg.length === 0) ctx.page = "home";
  else if (seg[0] === "cart") ctx.page = "cart";
  else if (seg[0] === "lists") {
    if (seg.length === 1) ctx.page = ctx.search ? "search" : "other";
    else if (seg.length === 2) {
      const p = getProduct(seg[1]);
      if (p) { ctx.page = "product"; ctx.product = p.name; const c = getCategory(p.categorySlug); if (c && c.kind !== "general") ctx.industry = c.name; const k = getCountry(p.countrySlug); if (k) { ctx.country = k.name; ctx.countrySlug = k.slug; } }
      else { const c = getCategory(seg[1]); ctx.page = "category"; if (c && c.kind !== "general") ctx.industry = c.name; }
    } else {
      const c = getCategory(seg[1]); const k = getCountry(seg[2]);
      ctx.page = k ? "country" : "category";
      if (c && c.kind !== "general") ctx.industry = c.name;
      if (k) { ctx.country = k.name; ctx.countrySlug = k.slug; }
    }
  }
  // Products this visitor really opened earlier in the session (distinct, newest first).
  const seen: string[] = [];
  for (const r of [...i.recent].reverse()) { const s = slugOf(r); if (s[0] === "lists" && s.length === 2) { const p = getProduct(s[1]); if (p && !seen.includes(p.name)) seen.push(p.name); } }
  const others = seen.filter((n) => n !== ctx.product);
  ctx.otherProduct = others[0];
  ctx.viewed = new Set([...seen, ...(ctx.product ? [ctx.product] : [])]).size;
  const names: string[] = [];
  for (const s of i.cart) { const p = getProduct(s); if (p && !names.includes(p.name)) names.push(p.name); }
  ctx.cart = names;
  return ctx;
}

/** The assistant's first line in the chat after a CTA click: the template's opening question plus real facts only. */
export function openingFor(ask: string, kind: string, path: string, c: ProContext): string {
  const parts = [ask];
  if (kind === "product" || kind === "multi") {
    const seg = slugOf(path); const p = seg[0] === "lists" && seg.length === 2 ? getProduct(seg[1]) : undefined;
    const pk = p ? offeredPackages(p) : [];
    if (p && pk.length) parts.push(`Packages for the ${p.name}: ${pk.map((k) => (p.placeholderData ? k.name : `${k.name} (${formatUsd(k.priceUsdCents)}, ${k.records.toLocaleString("en-US")} records)`)).join(", ")}. Tell me who you want to reach and I'll say which one fits.`);
  } else if (kind === "cart" && c.cart.length) parts.push(`In your cart: ${c.cart.slice(0, 5).join(", ")}.`);
  return parts.join("\n\n");
}

