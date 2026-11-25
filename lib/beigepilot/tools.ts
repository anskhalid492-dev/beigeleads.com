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
import { glossaryDocs, searchGlossary } from "./glossary";
import { legalBySlug, LEGAL_UPDATED } from "@/lib/legal/docs";
import { publishedEntries, searchEntries } from "./knowledge";
import type { ToolDef } from "./providers";
import { DEFAULT_SALES, type SalesAssistant } from "./store";
import { affordableItems, cheapestOver, planBundle, validPick } from "./budget";
import { loadSalesSettings } from "@/lib/sales/settings";
import { issueOffer, type OfferResult } from "./v2/offers";
import { OFFER_REFUSAL } from "./v2/negotiate";

export type Card = {
  slug: string; name: string; url: string; sampleUrl: string; country: string; countryCode: string; category: string; region: string; forSale: boolean;
  records: number | null; startingPrice: string | null; lastUpdated: string | null; hasSample: boolean;
  packages: { name: string; records: number; price: string; priceCents: number; highlighted: boolean }[];
  /** package the assistant already settled on (budget plan or a named package); the visitor still presses Add to Cart */
  pick?: string;
};
export type Bundle = { lines: { slug: string; name: string; pkg: string; price: string }[]; subtotal: string; discount: string; total: string; volumeApplied: boolean };
export type Source = { title: string; url: string };
/** The offer Pilo made in this reply (shown as the "Special BeigePilot Offer" card). The code itself is never put in the chat. */
export type OfferCard = { offerId: number; percent: number; expiresAt: number; savingCents: number; capped: boolean; eligible: string[]; excluded: string[] };
/** Session facts for the discount tool. `lastUserText` is the visitor's REAL last message: the server (not the model) decides whether a discount was asked for. */
export type V2Ctx = { negEnabled: boolean; sid: string; ipHash: string; cart: { slug: string; pkg: string }[]; lastUserText: string; offer: OfferCard | null; keptVolume: boolean; asked: boolean };
/** A DFY package shown as a card in the chat. Built from the admin settings only; allocations are stated as ranges/estimates where they are estimates. */
export type DfyCardData = { name: string; monthlyCents: number; leads: number; initialSends: number; followups: number; domains: string; inboxes: string; reporting: string; ownershipCents: number; ownershipEnabled: boolean };
/** Small interactive blocks Pilo can show under an answer. "order" = the order lookup form (the visitor types the order number and email into the form itself, never into the chat). "custom" = a link to /custom-list with the details prefilled; the visitor reviews and submits it. */
export type Extra = { kind: "order" } | { kind: "custom"; href: string; summary: string };
export type ToolCtx = { env: CloudflareEnv; sa: SalesAssistant; v2?: V2Ctx; extras: Extra[]; cards: Card[]; dfy: DfyCardData[]; bundle: Bundle | null; sources: Source[]; handoff: string | null; miss: boolean; trace: { name: string; args: unknown; ok: boolean }[] };
export const newCtx = (env: CloudflareEnv, sa: SalesAssistant = DEFAULT_SALES): ToolCtx => ({ env, sa, extras: [], cards: [], dfy: [], bundle: null, sources: [], handoff: null, miss: false, trace: [] });

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
  { name: "searchProducts", description: "Search the real BeigeLeads catalog by plain words: audience/industry, country, state or city, channel (email, phone, WhatsApp, consumer). Returns matching lists with real availability, packages and prices.", parameters: { type: "object", properties: { query: { type: "string", description: "e.g. 'dentists california' or 'germany business email'. Words only: put the industry, country and place here, not the quantity." }, minRecords: { type: "integer", description: "the contact quantity the visitor asked for (e.g. 100000 for '100K', 1000000 for '1 million'). Only lists with a package of at least this size are returned." }, limit: { type: "integer", description: "max results, default 6" } }, required: ["query"] } },
  { name: "getProductDetails", description: "Full public details of one list by slug: coverage, fields, formats, availability, packages, dates.", parameters: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "getProductPackages", description: "The packages and one-time prices of one list by slug. Empty when the list is not for sale.", parameters: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "getProductVerificationInfo", description: "The recorded last-updated date and stated accuracy of one list, plus the policy pages that govern verification, replacement and refunds.", parameters: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } },
  { name: "getRelatedProducts", description: "Other real lists related to one list (same industry, country or channel).", parameters: { type: "object", properties: { slug: { type: "string" }, limit: { type: "integer" } }, required: ["slug"] } },
  { name: "showProductCards", description: "Show interactive product cards (View Details, Get This List, Request a Sample) to the visitor for up to 3 real lists. Call it after you recommend lists.", parameters: { type: "object", properties: { slugs: { type: "array", items: { type: "string" } } }, required: ["slugs"] } },
  { name: "findWithinBudget", description: "Budget shopping. Finds real lists whose packages fit a USD budget, optionally for an industry/country (query), and can plan several databases within one total budget using the real cart pricing. Cards are shown to the visitor automatically with the right package. Never calculate prices yourself.", parameters: { type: "object", properties: { budgetUsd: { type: "number", description: "the visitor's budget in US dollars" }, query: { type: "string", description: "industry, country or place words, if any" }, count: { type: "integer", description: "how many different databases the visitor wants (2-5) when they want several; omit for one" }, maximizeContacts: { type: "boolean", description: "true when the visitor wants the maximum contacts for the budget" } }, required: ["budgetUsd"] } },
  { name: "prepareAddToCart", description: "Use when the visitor asks to add a list to the cart. Shows the list with its real packages and an Add to Cart button. If the package is known and valid pass it, otherwise omit it and ask the visitor which package they want. You can NOT add to the cart yourself: the visitor presses the button.", parameters: { type: "object", properties: { slug: { type: "string" }, package: { type: "string", description: "package name exactly as returned by the catalog tools, only if the visitor chose one" } }, required: ["slug"] } },
  { name: "showDfyPackages", description: "Use for questions about DFY Outbound (done-for-you cold email outbound: domains, inboxes, verified leads, copy, managed sending; one-time packages). Returns the real packages and shows package cards to the visitor. Pass names to show only some (for example the smallest package that covers a lead volume). Package numbers are the only source of truth: never promise anything else, never promise replies, meetings or inbox placement. Domain and inbox numbers are estimates until onboarding.", parameters: { type: "object", properties: { names: { type: "array", items: { type: "string" } } } } },
  { name: "showOrderLookup", description: "Use when the visitor asks about the status of an order, a payment they made, or where their delivery email is. Shows a secure order lookup form in the chat. The visitor types their order number and email INTO THE FORM (they go straight to the order system, not through you). Never ask the visitor to type an order number or email in the chat, and never guess an order status.", parameters: { type: "object", properties: {}, required: [] } },
  { name: "prepareCustomList", description: "Use when no ready-made list fits, or the visitor wants a custom list. Pass their need in plain words (audience/industry, country or place, quantity). Shows a button that opens the custom list request with what you understood already filled in. The visitor checks it and sends it themselves: you cannot submit a request. No price or delivery time is promised.", parameters: { type: "object", properties: { query: { type: "string", description: "e.g. '5000 plumbers in Texas'" } }, required: ["query"] } },
  { name: "searchKnowledge", description: "Search answers written by the BeigeLeads team (custom FAQs). Use it for questions about policies, process or products that the catalog tools do not cover, before searchHelpArticles.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "searchHelpArticles", description: "Search published Help Center articles for how-to, delivery, payment, data and policy answers.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "getCreatorPricing", description: "Use for any question about influencer or creator contact lists, a creator database, or the price of influencer contacts. Returns the per-contact price, an estimate for a quantity (if given), the inquiry page and the reply promise. A creator list is built custom from an inquiry, never bought instantly; never promise availability or a finished list.", parameters: { type: "object", properties: { quantity: { type: "number" } } } },
  { name: "getOurDataFacts", description: "Facts from the public Our Data page (/our-data): countries and industries with ready-made databases, newest list update date, refresh cycle, and which headline claims are verified. Use it for questions about data coverage, sources, verification, accuracy, freshness or how big the data is. Never state a claim listed under unverifiedClaims.", parameters: { type: "object", properties: {} } },
  { name: "searchGlossary", description: "Look up a B2B data, email or outreach term (for example MX record, bounce rate, SPF, DMARC, ICP, GDPR) in the published BeigeLeads Glossary. This is general education, NOT BeigeLeads policy: when you answer, say so, and use searchHelpArticles or getPolicyDetails for what BeigeLeads actually does.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "getPolicyDetails", description: "Read a published policy page. topic is one of: " + POLICY_SLUGS.join(", "), parameters: { type: "object", properties: { topic: { type: "string" } }, required: ["topic"] } },
  { name: "requestDiscount", description: "ONLY when the visitor has explicitly asked for a discount, coupon or better price. Asks the server whether an offer is available for the cart. Never call it on your own. The server decides; you cannot set or change a percentage.", parameters: { type: "object", properties: {}, required: [] } },
  { name: "suggestContact", description: "Use when you cannot answer confidently from tools, or the visitor asks about a specific order or account. Shows a 'Contact Our Team' button.", parameters: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] } },
];

const FINDER = new Set(["searchProducts", "getRelatedProducts", "showProductCards"]);
/** Tools the model may use, after the admin's Sales Assistant switches. */
export const toolsFor = (sa: SalesAssistant, neg = false): ToolDef[] => TOOLS.filter((t) => !(t.name === "requestDiscount" && !neg) && !(FINDER.has(t.name) && !sa.finder) && !(t.name === "findWithinBudget" && !sa.budget) && !(t.name === "prepareAddToCart" && !sa.cart) && !(t.name === "suggestContact" && !sa.handoff));
const cap = (v: unknown, n = 7000) => { const s = JSON.stringify(v); return s.length > n ? s.slice(0, n) + '…[truncated]"' : s; };
const str = (v: unknown, n = 200) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/** Runs one tool. Always returns a JSON string; unknown tools and bad input return an error object, never throw. */
export async function runTool(ctx: ToolCtx, name: string, args: Record<string, unknown>): Promise<string> {
  let ok = true;
  if (!toolsFor(ctx.sa, !!ctx.v2?.negEnabled).some((t) => t.name === name)) { ctx.trace.push({ name, args, ok: false }); return JSON.stringify({ error: "This tool is switched off." }); }
  const out = await (async (): Promise<unknown> => {
    await hydrateCatalog(ctx.env);
    switch (name) {
      case "searchProducts": {
        const q = str(args.query, 160);
        if (!q) return { error: "empty query" };
        const lim = Math.min(8, Math.max(1, Number(args.limit) || 6));
        const names = { cat: (s: string) => getCategory(s)?.name ?? s, country: (s: string) => getCountry(s)?.name ?? s };
        const min = Math.max(0, Math.floor(Number(args.minRecords) || 0));
        const d = discover(getProducts(), q, names, lim);
        const pick = (l: { slug: string }) => getProduct(l.slug);
        // Quantity: the list must really offer a package (or total) of at least the requested size.
        const big = (p: Product) => !min || offeredPackages(p).some((k) => k.records >= min) || (p.recordCount ?? 0) >= min;
        const show = (p: Product) => ctx.sa.unavailable || forSale(p);
        const exact = d.exact.map(pick).filter((p): p is Product => !!p).filter(show);
        const matches = exact.filter(big).slice(0, ctx.sa.maxRecs);
        const closest = ctx.sa.alternatives ? [...exact.filter((p) => !big(p)), ...d.close.map(pick).filter((p): p is Product => !!p).filter(show)].slice(0, 4) : [];
        return { matches: matches.map(summary), closest: closest.map(summary), requestedMinimumContacts: min || undefined, note: matches.length ? (exact.length > matches.length ? "Some lists were left out because their biggest package is smaller than the requested quantity." : undefined) : "No exact match. Say so plainly (including when the quantity is too large); offer the closest lists if any, or the custom list builder (/custom-list) or contact page (/contact)." };
      }
      case "requestDiscount": {
        const v = ctx.v2; if (!v) return { status: "unavailable" };
        const r: OfferResult = await issueOffer(ctx.env, { sid: v.sid, ipHash: v.ipHash, cart: v.cart, lastUserText: v.lastUserText });
        if (r.ok) {
          v.offer = { offerId: r.offerId, percent: r.percent, expiresAt: r.expiresAt, savingCents: r.savingCents, capped: r.capped, eligible: r.eligible, excluded: r.excluded };
          return { status: "offered", percent: r.percent, savesApprox: formatUsd(r.savingCents), validMinutes: Math.max(1, Math.round((r.expiresAt - Date.now() / 1000) / 60)), excludedFromOffer: r.excluded, askedAboveCeiling: r.capped, rules: "The offer is shown to the visitor as a card with an Apply button. Do not repeat the discount code (you do not have it). The maximum Pilo can ever offer is 20%. Never say a manager approved it; it is an automatic AI assistant offer. It does not combine with Buy More, Save More." };
        }
        if (r.reason === "kept-volume") { v.keptVolume = true; return { status: "kept-volume", message: "Your current bundle or volume savings are already better than the AI offer, so I've kept the larger discount for you." }; }
        return { status: "no-offer", message: OFFER_REFUSAL[r.reason] ?? OFFER_REFUSAL.error };
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
      case "showDfyPackages": {
        const { loadDfySettings } = await import("@/lib/dfy/settings");
        const kb = await import("@/lib/dfy/content");
        const ds = await loadDfySettings(ctx.env);
        if (!ds.enabled) return { available: false, message: "DFY Outbound is not available right now." };
        const want = Array.isArray(args.names) ? args.names.map((x) => str(x, 40).toLowerCase()) : [];
        const pk = ds.packages.filter((p) => want.length === 0 || want.includes(p.name.toLowerCase()));
        const list = pk.length ? pk : ds.packages;
        for (const p of list) if (!ctx.dfy.some((c) => c.name === p.name)) ctx.dfy.push({ name: p.name, monthlyCents: p.monthlyCents, leads: p.leads, initialSends: p.initialSends, followups: p.followups, domains: p.domainsMin === p.domainsMax ? String(p.domainsMin) : `${p.domainsMin}-${p.domainsMax}`, inboxes: p.inboxesMin === p.inboxesMax ? String(p.inboxesMin) : `${p.inboxesMin}-${p.inboxesMax}`, reporting: p.reporting, ownershipCents: ds.ownershipCents, ownershipEnabled: ds.ownershipEnabled });
        return { page: "/dfy-outbound", knowledge: { includedInEveryPackage: kb.DFY_SERVICES.map((x) => `${x.label}: ${x.text}`), howItWorks: kb.DFY_STEPS.map(([t, d]) => `${t}: ${d}`), behindTheScenes: kb.DFY_BEHIND.map((b) => `${b.title}: ${b.points.join(" ")}`), ownershipDetails: kb.DFY_OWNERSHIP_POINTS, whoItIsFor: kb.DFY_WHO.map((w) => ({ audience: w.title, solutionPage: w.href })), faqs: kb.DFY_FAQS.map(([q, a]) => ({ q, a })) }, billing: ds.billingTerms, ownership: ds.ownershipEnabled ? { feeUsd: ds.ownershipCents / 100, note: "optional, one-time, never recurring; transfer subject to provider rules" } : null, adminNotes: ds.piloNotes, packages: list.map((p) => ({ name: p.name, oneTimeUsd: p.monthlyCents / 100, verifiedLeads: p.leads, initialSends: p.initialSends, followUps: p.followups, estimatedDomains: `${p.domainsMin}-${p.domainsMax}`, estimatedInboxes: `${p.inboxesMin}-${p.inboxesMax}`, reporting: p.reporting, support: p.support, theoreticalMaxMessages: p.leads * (1 + p.followups) })), rules: "Leads, initial sends and follow-ups are separate. theoreticalMaxMessages is a ceiling, not a promise. Domains/inboxes are estimates until the capacity plan is confirmed. No guaranteed replies, meetings or revenue. Databases bought from BeigeLeads are not used automatically. No discounts apply to DFY." };
      }
      case "getRelatedProducts": {
        const p = getProduct(str(args.slug, 100)); if (!p) return { error: "unknown product slug" };
        return { related: getRelatedProducts(p, Math.min(6, Math.max(1, Number(args.limit) || 4))).map(summary) };
      }
      case "showProductCards": {
        const slugs = Array.isArray(args.slugs) ? args.slugs.map((s) => str(s, 100)).filter(Boolean).slice(0, ctx.sa.maxRecs) : [];
        const found = slugs.map((s) => getProduct(s)).filter((p): p is Product => !!p).filter((p) => ctx.sa.unavailable || forSale(p));
        for (const p of found) if (!ctx.cards.some((c) => c.slug === p.slug)) ctx.cards.push(card(p));
        return { shown: found.map((p) => p.slug), unknown: slugs.length - found.length };
      }
      case "findWithinBudget": {
        const dollars = Number(args.budgetUsd);
        if (!Number.isFinite(dollars) || dollars < 1 || dollars > 1_000_000) return { error: "budgetUsd must be a number of dollars between 1 and 1,000,000" };
        const budget = Math.round(dollars * 100);
        const q = str(args.query, 160);
        const names = { cat: (s: string) => getCategory(s)?.name ?? s, country: (s: string) => getCountry(s)?.name ?? s };
        const pool = q ? (() => { const d = discover(getProducts(), q, names, 40); return [...d.exact, ...(ctx.sa.alternatives ? d.close : [])].map((l) => getProduct(l.slug)).filter((p): p is Product => !!p); })() : getProducts().filter(forSale);
        const sales = await loadSalesSettings(ctx.env);
        const volume = ctx.sa.volume && sales.volume.enabled ? sales.volume : undefined;
        let items = affordableItems(pool, budget);
        if (args.maximizeContacts === true) items = [...items].sort((a, b) => b.best.records - a.best.records);
        const want = Math.min(5, Math.max(0, Math.floor(Number(args.count) || 0)));
        const limit = Math.min(ctx.sa.maxRecs, want >= 2 ? want : ctx.sa.maxRecs);
        const shown = items.slice(0, limit);
        const usd = (c: number) => formatUsd(c);
        const out: Record<string, unknown> = { budgetUsd: usd(budget), results: shown.map((it) => { const p = getProduct(it.best.slug)!; return { slug: p.slug, name: p.name, url: url(p), country: getCountry(p.countrySlug)?.name ?? p.countrySlug, bestPackageWithinBudget: { name: it.best.pkg, records: it.best.records, priceUsd: usd(it.best.priceCents) }, allPackagesWithinBudget: it.affordable.map((k) => ({ name: k.pkg, records: k.records, priceUsd: usd(k.priceCents) })) }; }) };
        const picks: Record<string, string> = {};
        for (const it of shown) picks[it.best.slug] = it.best.pkg;
        if (want >= 2) {
          const plan = planBundle(items, budget, want, volume);
          if (plan) {
            const rows = plan.slugs.map((x) => ({ slug: x.slug, name: getProduct(x.slug)?.name ?? x.slug, pkg: x.pkg, price: usd(x.priceCents) }));
            ctx.bundle = { lines: rows, subtotal: usd(plan.subtotalCents), discount: usd(plan.discountCents), total: usd(plan.totalCents), volumeApplied: plan.volumeApplied };
            out.bundle = { lines: rows, subtotalUsd: ctx.bundle.subtotal, volumeDiscountUsd: ctx.bundle.discount, estimatedTotalUsd: ctx.bundle.total, volumeDiscountIncluded: plan.volumeApplied, note: "Estimate from the real cart pricing. The cart checks the total again. Promo codes are not included." };
            for (const x of plan.slugs) picks[x.slug] = x.pkg;
            shown.splice(0, shown.length, ...plan.slugs.map((x) => items.find((i) => i.best.slug === x.slug)!).filter(Boolean));
          } else { out.bundle = null; out.bundleNote = `Could not fit ${want} different databases within the budget. Say so and show the single options.`; }
        }
        for (const it of shown) { const p = getProduct(it.best.slug); if (p && !ctx.cards.some((c) => c.slug === p.slug)) ctx.cards.push({ ...card(p), pick: picks[p.slug] }); }
        if (!shown.length) {
          ctx.miss = true;
          const over = ctx.sa.alternatives ? cheapestOver(pool.length ? pool : getProducts(), budget) : null;
          out.nothingWithinBudget = true;
          if (over) { const p = getProduct(over.slug)!; out.cheapestAvailable = { slug: p.slug, name: p.name, package: over.pkg, priceUsd: usd(over.priceCents), overBudgetByUsd: usd(over.overCents) }; if (!ctx.cards.some((c) => c.slug === p.slug)) ctx.cards.push({ ...card(p), pick: over.pkg }); }
          out.note = "Nothing fits this budget. Say so plainly. If cheapestAvailable is present it is OVER the budget: say by how much, never present it as within budget. Suggest raising the budget or the custom list builder (/custom-list).";
        }
        return out;
      }
      case "prepareAddToCart": {
        const p = getProduct(str(args.slug, 100));
        if (!p) return { error: "unknown product slug" };
        if (!forSale(p)) return { error: "This list is not currently for sale, so it cannot be added to the cart. Offer View Details, a free sample or the custom list builder." };
        const pk = offeredPackages(p);
        if (!pk.length) return { error: "This list has no packages to buy right now." };
        const named = str(args.package, 40);
        const chosen = named ? validPick(p.slug, named) : pk.length === 1 ? validPick(p.slug, pk[0].name) : null;
        if (named && !chosen) return { error: `No package named "${named}". Valid packages: ${pk.map((k) => k.name).join(", ")}. Ask the visitor which one.` };
        const i = ctx.cards.findIndex((c) => c.slug === p.slug);
        const c = { ...card(p), pick: chosen?.pkg };
        if (i >= 0) ctx.cards[i] = c; else ctx.cards.push(c);
        return { shown: true, name: p.name, package: chosen?.pkg ?? null, packages: pk.map((k) => ({ name: k.name, records: k.records, priceUsd: formatUsd(k.priceUsdCents) })), note: chosen ? "The card shows this package selected with an Add to Cart button. Tell the visitor to press Add to Cart. You cannot add it yourself and must not say it was added." : "Ask which package they want (list them with prices). The card lets them pick and press Add to Cart. Never say it was added." };
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
      case "getCreatorPricing": {
        const { parseQuantity, estimateCents, formatEstimate } = await import("@/lib/creators/pricing");
        const { PRICE_PER_VERIFIED_CONTACT_USD, RESPONSE_HOURS } = await import("@/lib/creators/config");
        const n = parseQuantity(args.quantity);
        ctx.sources.push({ title: "Creator database", url: "/creators" });
        return {
          page: "/creators", inquiryForm: "/creators#inquiry", pricePerVerifiedContactUsd: PRICE_PER_VERIFIED_CONTACT_USD,
          ...(n ? { quantity: n, estimatedPrice: formatEstimate(estimateCents(n)) } : {}),
          replyPromise: `The team replies within ${RESPONSE_HOURS} hours of an inquiry`,
          note: "Lists are custom-built from the visitor's inquiry (platform, niche, country, follower range, quantity). The price is an estimate: quantity x $0.10, with no discounts or minimums added. Final availability and total are confirmed by the team. Not every creator in the database has an available verified contact. Do not promise a finished list, a sample, or a delivery time; do not ask unnecessary questions.",
        };
      }
      case "getOurDataFacts": {
        const { loadOurData, approvedValue, CLAIM_INFO, CLAIM_KEYS } = await import("@/lib/our-data/settings");
        const { loadOurDataFacts } = await import("./../our-data/facts");
        const st = await loadOurData(ctx.env);
        if (!st.published) return { error: "The Our Data page is not published." };
        const f = await loadOurDataFacts();
        ctx.sources.push({ title: "Our Data", url: "/our-data" });
        return {
          page: "/our-data", countries: f.countries.map((c) => c.name), industries: f.industries.map((i) => i.name), newestListUpdate: f.newestUpdate,
          refreshCycle: "BeigeLeads refreshes its databases every 90 days", coverage: "BeigeLeads states it offers business data in 200+ countries (owner statement); the countries array lists only those with a ready-made database on the site today",
          replacementPolicy: "If more than 5% of emails in a delivered list bounce, bounced emails are replaced (see /legal/refund-replacement)",
          verifiedClaims: CLAIM_KEYS.filter((k) => approvedValue(st, k)).map((k) => ({ claim: CLAIM_INFO[k].label, wording: st.claims[k].value, evidence: st.claims[k].evidence })),
          unverifiedClaims: CLAIM_KEYS.filter((k) => !approvedValue(st, k)).map((k) => CLAIM_INFO[k].label),
          note: "Only verifiedClaims may be stated as facts. Unverified claims must not be repeated, even if the visitor asks about them: say we do not publish that figure. Link /our-data.",
        };
      }
      case "searchGlossary": {
        const q = str(args.query, 120); if (!q) return { error: "empty query" };
        const hits = searchGlossary(await glossaryDocs(ctx.env), q, 3);
        if (!hits.length) ctx.miss = true;
        for (const h of hits) ctx.sources.push({ title: `Glossary: ${h.term}`, url: `/glossary/${h.slug}` });
        return { terms: hits.map((h) => ({ term: h.term, url: `/glossary/${h.slug}`, definition: h.short, excerpt: h.text.slice(0, 900) })), note: hits.length ? "General education about the term. It is not BeigeLeads policy and not legal advice. For what BeigeLeads does, use searchHelpArticles or getPolicyDetails. Link the glossary page." : "No glossary entry found. Do not guess a definition as BeigeLeads policy." };
      }
      case "getPolicyDetails": {
        const t = str(args.topic, 40).toLowerCase();
        const doc = (POLICY_SLUGS as readonly string[]).includes(t) ? legalBySlug[t] : undefined;
        if (!doc) return { error: "unknown policy topic", topics: POLICY_SLUGS };
        ctx.sources.push({ title: doc.title, url: `/legal/${doc.slug}` });
        return { title: doc.title, url: `/legal/${doc.slug}`, lastUpdated: LEGAL_UPDATED, text: doc.sections.map((s) => `${s.h}: ${s.p.join(" ")}`).join("\n").slice(0, 6000), note: "Quote only what this text says. Do not add guarantees." };
      }
      case "showOrderLookup": {
        if (!ctx.extras.some((x) => x.kind === "order")) ctx.extras.push({ kind: "order" });
        return { shownToVisitor: "an order lookup form", note: "Tell the visitor to enter the order number and the email used at checkout in the form below your message. You cannot see their order. If they cannot find the order number, point them to their confirmation email or /contact." };
      }
      case "prepareCustomList": {
        const q = str(args.query, 300); if (!q) return { error: "empty query" };
        const { customListHref, parseQuery } = await import("@/lib/search");
        const pq = parseQuery(q);
        const bits = [pq.category?.name ?? pq.categoryText, pq.region || pq.countryText, pq.quantity ? `${pq.quantity.toLocaleString("en-US")} contacts` : ""].filter(Boolean) as string[];
        ctx.extras.push({ kind: "custom", href: customListHref(q), summary: bits.length ? bits.join(" · ") : q.slice(0, 120) });
        return { shownToVisitor: "a 'Start my custom list request' button", understood: bits, note: "Say what you understood (the 'understood' list) and that the form opens prefilled for the visitor to check and send. No price is promised: the team replies with a quote. Do not say it was submitted." };
      }
      case "suggestContact": { ctx.handoff = str(args.reason, 200) || "needs a human"; return { ok: true, shownToVisitor: "Contact Our Team button" }; }
      default: ok = false; return { error: "unknown tool" };
    }
  })().catch(() => { ok = false; return { error: "tool failed" }; });
  if (typeof out === "object" && out && "error" in out) ok = false;
  ctx.trace.push({ name, args, ok });
  return cap(out);
}
