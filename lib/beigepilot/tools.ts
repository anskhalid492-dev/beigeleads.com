// Read-only tools BeigePilot can call. Every fact the assistant states about products comes from here (the real catalog,
// published Help Center content and the published legal pages), never from the model's memory. No tool writes anything,
// opens an order, or returns download links, full contact records or admin data.
import { formatUsd, getCategory, getCountry, getProduct, getProducts, getRelatedProducts, offeredPackages, sampleRowsOf, startingPriceCents, type Product } from "@/lib/catalog";
import { hydrateCatalog } from "@/lib/catalog-db";
import { discover } from "@/lib/discover";
import { fieldSummary } from "@/lib/product-fields";
import { helpArticles, helpCategories, plainText } from "@/lib/help";
import { searchDocs, toDoc, type SearchDoc } from "@/lib/help/search";
import { loadHelp } from "@/lib/help/store";
import { legalBySlug, LEGAL_UPDATED } from "@/lib/legal/docs";
import { publishedEntries, searchEntries } from "./knowledge";
import type { ToolDef } from "./providers";

export type Card = {
  slug: string; name: string; url: string; sampleUrl: string; country: string; countryCode: string; category: string; region: string; forSale: boolean;
  records: number | null; startingPrice: string | null; lastUpdated: string | null; hasSample: boolean;
  packages: { name: string; records: number; price: string; priceCents: number; highlighted: boolean }[];
};
export type Source = { title: string; url: string };
export type ToolCtx = { env: CloudflareEnv; cards: Card[]; sources: Source[]; handoff: string | null; miss: boolean; trace: { name: string; args: unknown; ok: boolean }[] };
export const newCtx = (env: CloudflareEnv): ToolCtx => ({ env, cards: [], sources: [], handoff: null, miss: false, trace: [] });

const forSale = (p: Product) => p.status === "live" && !p.placeholderData;
const url = (p: Product) => `/lists/${p.slug}`;

/** Public facts about a list. Counts, prices and dates appear ONLY when the product record has real values. */
function summary(p: Product) {
  const real = forSale(p);
  const pk = real ? offeredPackages(p) : [];
  const start = real ? startingPriceCents(p) : null;
  return {
    slug: p.slug, name: p.name, url: url(p), category: getCategory(p.categorySlug)?.name ?? p.categorySlug, country: getCountry(p.countrySlug)?.name ?? p.countrySlug,
    region: p.region ?? null, scope: p.scope ?? "country", channel: p.channel ?? "business-email",
    availability: real ? "available to buy" : "listed but not currently for sale",
    recordCount: real ? p.recordCount : null,
    packages: pk.map((k) => ({ name: k.name, records: k.records, priceUsd: formatUsd(k.priceUsdCents) })),
    startingPriceUsd: start === null ? null : formatUsd(start),
    lastUpdatedRecorded: p.lastVerified ?? null,
    maskedSampleOnPage: sampleRowsOf(p.slug).length > 0, sampleRequestUrl: `/sample?product=${p.slug}`,
  };
}

function card(p: Product): Card {
  const s = summary(p);
  return {
    slug: p.slug, name: p.name, url: url(p), sampleUrl: s.sampleRequestUrl, country: s.country, countryCode: getCountry(p.countrySlug)?.code ?? "", category: p.categorySlug, region: s.region ?? "", forSale: forSale(p),
    records: s.recordCount, startingPrice: s.startingPriceUsd, lastUpdated: p.lastVerified ?? null, hasSample: s.maskedSampleOnPage,
    packages: forSale(p) ? offeredPackages(p).map((k) => ({ name: k.name, records: k.records, price: formatUsd(k.priceUsdCents), priceCents: k.priceUsdCents, highlighted: !!k.highlighted })) : [],
  };
}

/* ---------------- help + policy search ---------------- */

async function helpDocs(env: CloudflareEnv): Promise<{ docs: SearchDoc[]; text: Map<string, string> }> {
  const data = await loadHelp(env).catch(() => null);
  const articles = data?.articles ?? helpArticles;
  const cats = data?.categories ?? helpCategories;
  const text = new Map<string, string>();
  const docs = articles.filter((a) => (a.status ?? "published") === "published").map((a) => {
    const t = plainText(a); const id = `${a.category}/${a.slug}`; text.set(id, t);
    return toDoc(a, cats.find((c) => c.slug === a.category)?.name ?? a.category, t);
  });
  return { docs, text };
}

const POLICY_SLUGS = ["privacy", "terms", "refund-replacement", "delivery", "cookies", "gdpr", "ccpa", "can-spam", "casl", "lawful-use", "dpa"] as const;

/* ---------------- tool definitions ---------------- */

export const TOOLS: ToolDef[] = [
  { name: "searchProducts", description: "Search the real BeigeLeads catalog by plain words: audience/industry, country, state or city, channel (email, phone, WhatsApp, consumer). Returns matching lists with real availability, packages and prices.", parameters: { type: "object", properties: { query: { type: "string", description: "e.g. 'dentists california' or 'germany business email'" }, limit: { type: "integer", description: "max results, default 6" } }, required: ["query"] } },
  { name: "getProductDetails", description: "Full public details of one list by slug: coverage, fields, formats, availability, packages, dates.", parameters: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "getProductPackages", description: "The packages and one-time prices of one list by slug. Empty when the list is not for sale.", parameters: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "getProductVerificationInfo", description: "The recorded last-updated date and stated accuracy of one list, plus the policy pages that govern verification, replacement and refunds.", parameters: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "getRelatedProducts", description: "Other real lists related to one list (same industry, country or channel).", parameters: { type: "object", properties: { slug: { type: "string" }, limit: { type: "integer" } }, required: ["slug"] } },
  { name: "showProductCards", description: "Show interactive product cards (View Details, Get This List, Request a Sample) to the visitor for up to 3 real lists. Call it after you recommend lists.", parameters: { type: "object", properties: { slugs: { type: "array", items: { type: "string" } } }, required: ["slugs"] } },
  { name: "searchKnowledge", description: "Search answers written by the BeigeLeads team (custom FAQs). Use it for questions about policies, process or products that the catalog tools do not cover, before searchHelpArticles.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "searchHelpArticles", description: "Search published Help Center articles for how-to, delivery, payment, data and policy answers.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "getPolicyDetails", description: "Read a published policy page. topic is one of: " + POLICY_SLUGS.join(", "), parameters: { type: "object", properties: { topic: { type: "string" } }, required: ["topic"] } },
  { name: "suggestContact", description: "Use when you cannot answer confidently from tools, or the visitor asks about a specific order or account. Shows a 'Contact Our Team' button.", parameters: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] } },
];

const cap = (v: unknown, n = 7000) => { const s = JSON.stringify(v); return s.length > n ? s.slice(0, n) + '…[truncated]"' : s; };
const str = (v: unknown, n = 200) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/** Runs one tool. Always returns a JSON string; unknown tools and bad input return an error object, never throw. */
export async function runTool(ctx: ToolCtx, name: string, args: Record<string, unknown>): Promise<string> {
  let ok = true;
  const out = await (async (): Promise<unknown> => {
    await hydrateCatalog(ctx.env);
    switch (name) {
      case "searchProducts": {
        const q = str(args.query, 160);
        if (!q) return { error: "empty query" };
        const lim = Math.min(8, Math.max(1, Number(args.limit) || 6));
        const names = { cat: (s: string) => getCategory(s)?.name ?? s, country: (s: string) => getCountry(s)?.name ?? s };
        const d = discover(getProducts(), q, names, lim);
        const pick = (l: { slug: string }) => getProduct(l.slug);
        return { matches: d.exact.map(pick).filter((p): p is Product => !!p).map(summary), closest: d.close.map(pick).filter((p): p is Product => !!p).slice(0, 4).map(summary), note: d.exact.length ? undefined : "No exact match. Say so plainly; offer the closest lists if any, or the custom list builder (/custom-list) or contact page (/contact)." };
      }
      case "getProductDetails": {
        const p = getProduct(str(args.slug, 100)); if (!p) return { error: "unknown product slug" };
        return { ...summary(p), description: p.description, dataFields: fieldSummary(p.fields, 12), fieldCount: p.fields.length, fileFormats: p.fileFormats || "CSV, Excel or TXT", coverage: p.coverage || null, deliveryNote: "Delivered by email as a download link, mostly instantly and in some cases up to 12 hours." };
      }
      case "getProductPackages": {
        const p = getProduct(str(args.slug, 100)); if (!p) return { error: "unknown product slug" };
        return { slug: p.slug, name: p.name, forSale: forSale(p), packages: summary(p).packages, note: forSale(p) ? "One-time prices in USD, paid once in crypto." : "This list is not currently for sale, so no packages are offered." };
      }
      case "getProductVerificationInfo": {
        const p = getProduct(str(args.slug, 100)); if (!p) return { error: "unknown product slug" };
        ctx.sources.push({ title: "Verification and data quality", url: "/verification" }, { title: "Refund & replacement policy", url: "/legal/refund-replacement" });
        return { slug: p.slug, name: p.name, lastUpdatedRecorded: p.lastVerified ?? null, statedAccuracyPercentOnProductPage: forSale(p) ? p.accuracyPct : null, note: p.lastVerified ? "State this date exactly as recorded." : "No date is recorded. Say it is not currently available and offer /contact.", policyPages: ["/verification", "/legal/refund-replacement"] };
      }
      case "getRelatedProducts": {
        const p = getProduct(str(args.slug, 100)); if (!p) return { error: "unknown product slug" };
        return { related: getRelatedProducts(p, Math.min(6, Math.max(1, Number(args.limit) || 4))).map(summary) };
      }
      case "showProductCards": {
        const slugs = Array.isArray(args.slugs) ? args.slugs.map((s) => str(s, 100)).filter(Boolean).slice(0, 3) : [];
        const found = slugs.map((s) => getProduct(s)).filter((p): p is Product => !!p);
        for (const p of found) if (!ctx.cards.some((c) => c.slug === p.slug)) ctx.cards.push(card(p));
        return { shown: found.map((p) => p.slug), unknown: slugs.length - found.length };
      }
      case "searchKnowledge": {
        const q = str(args.query, 160); if (!q) return { error: "empty query" };
        const hits = searchEntries(await publishedEntries(ctx.env), q, 3);
        if (!hits.length) ctx.miss = true;
        return { answers: hits.map((h) => ({ question: h.title, answer: h.answer })), note: hits.length ? "These are the team's own answers. Use them, do not add to them." : "No team answer found. Try searchHelpArticles next." };
      }
      case "searchHelpArticles": {
        const q = str(args.query, 160); if (!q) return { error: "empty query" };
        const { docs, text } = await helpDocs(ctx.env);
        const hits = searchDocs(docs, q, undefined, 4);
        if (!hits.length) ctx.miss = true;
        for (const h of hits) ctx.sources.push({ title: h.title, url: h.href });
        return { articles: hits.map((h) => ({ title: h.title, url: h.href, excerpt: (text.get(h.id) ?? "").slice(0, 900) })), note: hits.length ? undefined : "No matching article. Do not guess; offer /contact." };
      }
      case "getPolicyDetails": {
        const t = str(args.topic, 40).toLowerCase();
        const doc = (POLICY_SLUGS as readonly string[]).includes(t) ? legalBySlug[t] : undefined;
        if (!doc) return { error: "unknown policy topic", topics: POLICY_SLUGS };
        ctx.sources.push({ title: doc.title, url: `/legal/${doc.slug}` });
        return { title: doc.title, url: `/legal/${doc.slug}`, lastUpdated: LEGAL_UPDATED, text: doc.sections.map((s) => `${s.h}: ${s.p.join(" ")}`).join("\n").slice(0, 6000), note: "Quote only what this text says. Do not add guarantees." };
      }
      case "suggestContact": { ctx.handoff = str(args.reason, 200) || "needs a human"; return { ok: true, shownToVisitor: "Contact Our Team button" }; }
      default: ok = false; return { error: "unknown tool" };
    }
  })().catch(() => { ok = false; return { error: "tool failed" }; });
  if (typeof out === "object" && out && "error" in out) ok = false;
  ctx.trace.push({ name, args, ok });
  return cap(out);
}
