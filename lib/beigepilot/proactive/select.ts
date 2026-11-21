// Picks one approved template for a stage from REAL context. Pure.
import { BUDGET_RE, fill, varsIn, type Kind, type PageKind, type ProSettings, type Stage, type Template, type Var } from "./types";

export type ProContext = {
  page: PageKind;
  product?: string; // real product name on the current page
  otherProduct?: string; // another real product viewed earlier this session
  viewed: number; // distinct products viewed this session (including the current one)
  cart: string[]; // real product names in the cart
  search?: string;
  industry?: string;
  country?: string;
  countrySlug?: string;
};

const isHealth = (s: string) => /health|dental|dentist|doctor|medical|clinic|hospital|pharm|veterin|chiropract|nurs|mental|optic|eye care|physician/i.test(s);
const isRealEstate = (s: string) => /real estate|realtor|propert|mortgage|estate agent/i.test(s);

/** Kinds that apply, best first. Priority: product page, cart, search, industry, country, recently viewed, default. */
export function kindsFor(c: ProContext, stage: Stage, cartOn = true): Kind[] {
  const out: Kind[] = [];
  const text = [c.industry, c.product, c.search].filter(Boolean).join(" ");
  if (stage === 2 && c.product && c.otherProduct && c.viewed >= 2) out.push("multi");
  if (c.product) out.push("product");
  if (cartOn && c.cart.length) out.push("cart");
  if (c.search && BUDGET_RE.test(c.search)) out.push("budget");
  if (c.search) out.push("search");
  if (isHealth(text)) out.push("healthcare");
  if (isRealEstate(text)) out.push("realestate");
  if (c.industry) out.push("industry");
  if (c.countrySlug === "united-states") out.push("usa");
  if (c.country) out.push("country");
  if (c.otherProduct && c.viewed >= 2) out.push("multi");
  out.push("default");
  return out.filter((k, i) => out.indexOf(k) === i);
}

export function varsOf(c: ProContext): Partial<Record<Var, string>> {
  const items = c.cart.length === 1 ? "1 list" : `${c.cart.length} lists`;
  return { product_name: c.product, other_product: c.otherProduct, search_term: c.search, country: c.country, industry: c.industry, cart_items: c.cart.length ? items : undefined };
}

export type Picked = { template: Template; text: string; cta: string; ask: string };

/** null = nothing suitable (every fitting template was already shown, or the stage has no enabled template). */
export function selectTemplate(stage: Stage, c: ProContext, s: ProSettings, shown: string[]): Picked | null {
  const v = varsOf(c);
  const usable = (t: Template) => t.on && t.stage === stage && !shown.includes(t.id) && [t.text, t.cta, t.ask].every((x) => varsIn(x).every((k) => !!v[k]));
  for (const kind of kindsFor(c, stage, s.cartMessages)) {
    const t = s.templates.find((x) => x.kind === kind && usable(x));
    if (t) return { template: t, text: fill(t.text, v), cta: fill(t.cta, v), ask: fill(t.ask, v) };
  }
  return null;
}
