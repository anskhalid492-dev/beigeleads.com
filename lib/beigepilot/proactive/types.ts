// Proactive Pilo messages: shared types, default templates and validation. Pure (used by the browser, the server and the admin).
export type Stage = 1 | 2 | 3;
export type Kind = "default" | "product" | "multi" | "cart" | "search" | "budget" | "industry" | "healthcare" | "realestate" | "country" | "usa";
export type PageKind = "home" | "product" | "category" | "country" | "search" | "cart" | "other";
export const PAGE_KINDS: PageKind[] = ["home", "product", "category", "country", "search", "cart", "other"];
export const PAGE_LABELS: Record<PageKind, string> = { home: "Home page", product: "Product pages", category: "Category pages", country: "Country pages", search: "Search results (/lists?q=)", cart: "Cart page", other: "All other pages" };
export const VARS = ["product_name", "other_product", "search_term", "country", "industry", "cart_items"] as const;
export type Var = (typeof VARS)[number];

export type Template = { id: string; stage: Stage; kind: Kind; text: string; cta: string; ask: string; on: boolean };
export type ProSettings = {
  enabled: boolean;
  delays: [number, number, number]; // seconds of ACTIVE browsing (visible tab) when each message becomes due
  bubbleSeconds: number; // how long a bubble stays before it hides by itself (not a dismissal)
  pages: Record<PageKind, boolean>;
  cartMessages: boolean;
  mobile: boolean;
  templates: Template[];
};
export const MAX_MESSAGES = 3;
export const MIN_GAP_SECONDS = 30;

const T = (id: string, stage: Stage, kind: Kind, text: string, cta: string, ask: string): Template => ({ id, stage, kind, text, cta, ask, on: true });
export const DEFAULT_TEMPLATES: Template[] = [
  // Message 1: welcome
  T("s1-default", 1, "default", "👋 Hey there! Welcome to BeigeLeads! 💜 I'm Pilo, your personal data-finding buddy! 🚀 Looking for business emails, a specific industry, or leads from a particular country? Tell me what you're searching for, and I'll help you find the perfect match! 🎯", "Help Me Find Leads", "Which country and industry would you like to target?"),
  T("s1-usa", 1, "usa", "🇺🇸 Hey! Exploring US business contacts? Tell me the industry and the state or city you want to reach, and I'll look through the real catalog for you. 🎯", "Find USA Leads", "Which industry in the United States would you like to target?"),
  T("s1-healthcare", 1, "healthcare", "🩺 Looking for healthcare contacts? Tell me which kind of provider you want to reach, and I'll check what's in the catalog. ✨", "Explore Healthcare Lists", "Which type of healthcare provider and which country are you targeting?"),
  T("s1-realestate", 1, "realestate", "🏡 Reaching real estate professionals? Tell me the country or area, and I'll see which lists fit. 💜", "Find Real Estate Leads", "Which country or area do you want real estate contacts from?"),
  T("s1-industry", 1, "industry", "👋 Exploring {industry} lists? Tell me which country you want to reach and I'll find the best match. 🎯", "Find These Leads", "Which country are you targeting for {industry}?"),
  T("s1-country", 1, "country", "🌍 Looking for contacts in {country}? Tell me the industry you want to reach and I'll check the catalog for you. ✨", "Find Leads Here", "Which industry in {country} would you like to reach?"),
  T("s1-product", 1, "product", "👋 Looking at the {product_name}? I can walk you through what's included and help you pick the right package. 💜", "Help Me Choose", "Happy to help with the {product_name}."),
  T("s1-search", 1, "search", "🔎 Searching for \"{search_term}\"? I can narrow it down by country, industry, or list size. ✨", "Refine My Search", "Let's refine your search for \"{search_term}\". Which country or industry should I focus on?"),
  T("s1-cart", 1, "cart", "🛒 Your cart has {cart_items}. Want me to double-check you picked the right packages? 💜", "Review My Cart", "Happy to review your cart with you. What would you like to check?"),
  // Message 2: discovery
  T("s2-default", 2, "default", "👀 Still exploring? I've got you! Tell me who you want to reach, like doctors, CEOs, real estate agents, or another group, and I'll help you find lists that fit. ✨", "Find My Prospects", "Tell me about the people or businesses you want to reach."),
  T("s2-product", 2, "product", "🤔 Still comparing the {product_name}? Tell me who you want to reach and I'll tell you whether it fits, or suggest similar lists. ✨", "Help Me Choose", "Tell me who you want to reach, and I'll check whether the {product_name} fits."),
  T("s2-multi", 2, "multi", "🔍 Comparing the {other_product} and the {product_name}? I can lay out the differences side by side. 💜", "Compare My Options", "Which lists are you comparing, and what matters most to you?"),
  T("s2-search", 2, "search", "🧭 Not finding what you need for \"{search_term}\"? Tell me more about who you want to reach. ✨", "Refine My Search", "Tell me more about who you want to reach with \"{search_term}\"."),
  T("s2-industry", 2, "industry", "🎯 Interested in {industry}? I can narrow it down by country, state, or city. ✨", "Find My Prospects", "Which country, state, or city should I look at for {industry}?"),
  T("s2-country", 2, "country", "🌍 Browsing {country}? Tell me the industry and I'll see what's available there. ✨", "Find My Prospects", "Which industry in {country} are you interested in?"),
  T("s2-cart", 2, "cart", "🛒 Still thinking it over? I can compare your cart with similar lists. 💜", "Review My Cart", "Want me to compare the lists in your cart with similar ones?"),
  // Message 3: decision
  T("s3-default", 3, "default", "🤔 Still deciding? I'm right here! Tell me your budget and who you want to reach, and I'll suggest lists that fit. 💜", "Find My Perfect List", "What's your budget, and which prospects are you targeting?"),
  T("s3-product", 3, "product", "💜 Still deciding on the {product_name}? I can explain the packages so you can choose the size that fits.", "Help Me Choose", "Let me explain the packages for the {product_name}."),
  T("s3-cart", 3, "cart", "🛒 Questions about your cart? I can explain the packages, delivery, and how payment works.", "Review My Cart", "What questions do you have about your cart?"),
  T("s3-budget", 3, "budget", "💰 Working with a budget? Tell me what it is and who you want to reach, and I'll suggest lists that fit.", "Shop by Budget", "What's your budget, and which prospects are you targeting?"),
];

export const DEFAULT_PRO: ProSettings = {
  enabled: true, delays: [0, 120, 240], bubbleSeconds: 25,
  pages: { home: true, product: true, category: true, country: true, search: true, cart: true, other: true },
  cartMessages: true, mobile: true, templates: DEFAULT_TEMPLATES,
};

// Wording that would make a proactive message dishonest or pushy. Rejected when an admin saves.
const FORBIDDEN = /\d\s?%|\b(discount|coupon|limited[- ]time|last chance|hurry|act now|only \d+ left|expires?|countdown|before you go|don'?t miss)\b/i;
const VAR_RE = /\{([a-z_]+)\}/g;
export const varsIn = (s: string): Var[] => [...s.matchAll(VAR_RE)].map((m) => m[1] as Var);

export function checkTemplate(t: Pick<Template, "text" | "cta" | "ask">): string | null {
  if (!t.text.trim() || t.text.length > 400) return "Message text must be 1 to 400 characters.";
  if (!t.cta.trim() || t.cta.length > 32) return "Button label must be 1 to 32 characters.";
  if (!t.ask.trim() || t.ask.length > 240) return "Opening question must be 1 to 240 characters.";
  for (const s of [t.text, t.cta, t.ask]) {
    for (const v of varsIn(s)) if (!(VARS as readonly string[]).includes(v)) return `Unknown variable {${v}}. Allowed: ${VARS.map((x) => `{${x}}`).join(" ")}.`;
    if (FORBIDDEN.test(s)) return "Proactive messages must not use discounts, urgency, scarcity or exit-intent wording.";
  }
  return null;
}

/** Returns an error text, or null when the delays are safe: ascending, at least 30 s apart, at most 3 messages. */
export function checkDelays(d: number[]): string | null {
  if (d.length !== MAX_MESSAGES || d.some((x) => !Number.isInteger(x) || x < 0 || x > 3600)) return "Each delay must be a whole number of seconds from 0 to 3600.";
  if (d[1] - d[0] < MIN_GAP_SECONDS || d[2] - d[1] < MIN_GAP_SECONDS) return `Messages must be at least ${MIN_GAP_SECONDS} seconds apart.`;
  return null;
}

/** Read stored JSON defensively: anything invalid falls back to the built-in value for that field. Never throws. */
export function parsePro(raw: string | undefined | null): ProSettings {
  let j: Partial<ProSettings> = {};
  try { j = raw ? (JSON.parse(raw) as Partial<ProSettings>) : {}; } catch { j = {}; }
  const d = Array.isArray(j.delays) ? j.delays.map(Number) : [];
  const delays = (checkDelays(d) === null ? d : DEFAULT_PRO.delays) as [number, number, number];
  const bs = Number(j.bubbleSeconds);
  const ov = new Map((Array.isArray(j.templates) ? j.templates : []).map((t) => [t?.id, t]));
  const templates = DEFAULT_TEMPLATES.map((base) => {
    const o = ov.get(base.id);
    if (!o || typeof o.text !== "string" || typeof o.cta !== "string" || typeof o.ask !== "string") return base;
    const t = { ...base, text: o.text, cta: o.cta, ask: o.ask, on: o.on !== false };
    return checkTemplate(t) === null ? t : base;
  });
  const pages = { ...DEFAULT_PRO.pages };
  for (const k of PAGE_KINDS) if (typeof j.pages?.[k] === "boolean") pages[k] = j.pages[k];
  return {
    enabled: j.enabled !== false, delays, bubbleSeconds: Number.isFinite(bs) ? Math.min(60, Math.max(8, Math.round(bs))) : DEFAULT_PRO.bubbleSeconds,
    pages, cartMessages: j.cartMessages !== false, mobile: j.mobile !== false, templates,
  };
}

export function fill(s: string, v: Partial<Record<Var, string>>): string {
  return s.replace(VAR_RE, (_, k: string) => v[k as Var] ?? "").replace(/\s{2,}/g, " ").trim();
}
/** Strip anything that could carry personal data out of a search term before it is used or sent. "" = unusable. */
export function cleanSearch(s: string | undefined | null): string {
  const t = (s ?? "").replace(/[<>"{}]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!t || /@|\d{6,}|https?:|www\./i.test(t)) return "";
  return t;
}
export const BUDGET_RE = /\b(budget|cheap|cheapest|afford|under \$?\d|low cost|price)\b/i;
