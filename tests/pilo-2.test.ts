import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { exitCopy, exitDue, exitVariant, flickedToTop, leftThroughTop } from "@/lib/beigepilot/v2/exit";
import { nextSlot, quickReplies } from "@/lib/beigepilot/v2/followup";
import { detectLang, isRtl, LANGS, t, UI } from "@/lib/beigepilot/v2/lang";
import { EMPTY_MEMORY, parseBudgetCents, parseMemory, parseQuantity, remember, rememberAll } from "@/lib/beigepilot/v2/memory";
import { decide, detectDiscountAsk, DEFAULT_NEG, parseNeg } from "@/lib/beigepilot/v2/negotiate";
import { applyOffer, issueOffer, makeOfferCode, saveNeg } from "@/lib/beigepilot/v2/offers";
import { revealCut } from "@/lib/beigepilot/v2/reveal";
import { applyPromotions, NEGOTIATION_KEPT_VOLUME, type Promo } from "@/lib/promos/engine";
import { freshState } from "@/lib/beigepilot/proactive/schedule";

describe("language", () => {
  it("detects languages and RTL", () => {
    expect(detectLang("Hola, busco bases de datos de empresas")).toBe("es");
    expect(detectLang("Bonjour, je cherche une base de données")).toBe("fr");
    expect(detectLang("Ich suche eine Datenbank für Unternehmen")).toBe("de");
    expect(detectLang("مرحبا أريد قاعدة بيانات")).toBe("ar");
    expect(isRtl("ar")).toBe(true); expect(isRtl("ur")).toBe(true); expect(isRtl("en")).toBe(false);
  });
  it("every language has every label", () => { for (const l of LANGS) for (const k of Object.keys(UI.en)) expect(t(l.code, k as never), `${l.code}.${k}`).toBeTruthy(); });
});

describe("memory + follow-up", () => {
  it("extracts quantity and budget, and a new value replaces the old", () => {
    expect(parseQuantity("I need 100,000 contacts")).toBe(100000);
    expect(parseBudgetCents("my budget is $300")).toBe(30000);
    const m = rememberAll(["dentists in Germany", "actually under $200"]);
    expect(m.budgetCents).toBe(20000);
    expect(remember(m, "budget $100").budgetCents).toBe(10000);
  });
  it("parseMemory is defensive", () => { expect(parseMemory({ picked: "x", quantity: "abc" })).toEqual(EMPTY_MEMORY); expect(parseMemory(null)).toEqual(EMPTY_MEMORY); });
  it("asks one slot at a time and offers quick replies", () => {
    const s = nextSlot(EMPTY_MEMORY); expect(s).toBeTruthy();
    expect(quickReplies(s, "en").length).toBeGreaterThan(0);
    expect(nextSlot({ ...EMPTY_MEMORY, industry: "dentists", country: "germany", budgetCents: 100 }, { hasCards: false })).not.toBe(s);
  });
});

describe("negotiation policy", () => {
  it("never exceeds 20 percent whatever is stored or asked", () => {
    const p = parseNeg(JSON.stringify({ enabled: true, maxPercent: 90, levels: [5, 10, 15, 20, 50] }));
    expect(p.maxPercent).toBe(20); expect(Math.max(...p.levels)).toBe(20);
    expect(decide(p, 0, 90).percent).toBe(20); expect(decide(p, 20, 90).percent).toBe(20);
    for (let last = 0; last <= 20; last += 5) for (const req of [0, 7, 15, 20, 99]) expect(decide(p, last, req).percent).toBeLessThanOrEqual(20);
  });
  it("climbs the ladder and honours a direct request", () => {
    const p = { ...DEFAULT_NEG, enabled: true };
    expect(decide(p, 0, 0).percent).toBe(5); expect(decide(p, 5, 0).percent).toBe(10); expect(decide(p, 0, 15).percent).toBe(15);
  });
  it("only an explicit ask counts", () => {
    expect(detectDiscountAsk("Can I get a better price?").ask).toBe(true);
    expect(detectDiscountAsk("¿Hay algún descuento?").ask).toBe(true);
    expect(detectDiscountAsk("Show me dentists in Germany").ask).toBe(false);
    expect(detectDiscountAsk("can I get 30% off").requested).toBe(30);
  });
  it("offer codes are non-guessable", () => { const a = new Set(Array.from({ length: 200 }, makeOfferCode)); expect(a.size).toBe(200); expect([...a][0]).toMatch(/^PILO-[A-Z0-9]{10}$/); });
});

describe("engine: negotiation vs Buy More, Save More", () => {
  const promo = (value: number): Promo => ({ id: 1, name: "n", title: "", code: "PILO-AAAAAAAAAA", description: "", kind: "percent", value, productSlugs: [], categorySlugs: [], packageNames: [], minCartCents: 0, maxDiscountCents: null, startsAt: null, endsAt: null, usageLimit: 1, perCustomerLimit: 1, firstPurchaseOnly: false, partnerOnly: false, automatic: false, combinable: false, status: "active", bannerPlaces: [], boundEmail: null, origin: "negotiation" } as unknown as Promo);
  const facts = { totalUses: 0, customerUses: 0, firstPurchase: null, partner: null, bound: true } as never;
  const vol = (percent: number) => ({ enabled: true, tiers: [{ min: 5, percent }], excludedProducts: [], excludedCategories: [], stackWithPromos: false }) as never;
  const lines = (n: number) => Array.from({ length: n }, (_, i) => ({ slug: `s${i}`, categorySlug: "c", packageName: "p", priceCents: 10000 }));
  it("clamps a tampered 90% row to 20%", () => {
    const r = applyPromotions(lines(1), { candidates: [{ promo: promo(90), facts }], enteredCode: "PILO-AAAAAAAAAA", nowSec: 1, emailKnown: false });
    expect(r.discountCents).toBeLessThanOrEqual(2000); expect(r.discountCents).toBeGreaterThan(0);
  });
  it("keeps the larger volume saving and says so", () => {
    const r = applyPromotions(lines(5), { candidates: [{ promo: promo(10), facts }], enteredCode: "PILO-AAAAAAAAAA", nowSec: 1, emailKnown: false, volume: vol(45) });
    expect(r.codeError).toBe(NEGOTIATION_KEPT_VOLUME);
    expect(r.discountCents).toBe(Math.round(50000 * 0.45));
  });
});

describe("reveal + exit intent", () => {
  it("reveals on word boundaries", () => { expect(revealCut("one two three four", 2)).toBe("one two"); expect(revealCut("a b", 99)).toBe("a b"); });
  const s = { ...freshState("x"), activeMs: 20000 };
  const g = { chatOpen: false, bubbleVisible: false, path: "/lists/x", enabled: true };
  it("rules", () => {
    expect(exitDue(s, g)).toBe(true);
    expect(exitDue({ ...s, activeMs: 3000 }, g)).toBe(false); // not on arrival
    expect(exitDue({ ...s, exit: true }, g)).toBe(false); // once
    expect(exitDue({ ...s, stop: true }, g)).toBe(false); // after a dismissal
    expect(exitDue({ ...s, stage: 3 }, g)).toBe(false); // 3-message cap
    expect(exitDue(s, { ...g, path: "/checkout/cart" })).toBe(false);
    expect(exitDue(s, { ...g, chatOpen: true })).toBe(false);
    expect(exitDue(s, { ...g, enabled: false })).toBe(false);
  });
  it("desktop top-edge only; touch needs a deliberate flick", () => {
    expect(leftThroughTop(60, 2, null)).toBe(true); expect(leftThroughTop(60, 300, null)).toBe(false); expect(leftThroughTop(60, 2, {})).toBe(false);
    expect(flickedToTop([{ y: 0, at: 0 }], 3000, 800)).toBe(false);
  });
  it("copy has the default text and variants", () => {
    expect(exitCopy("en", "general").text).toContain("Still deciding?");
    expect(exitVariant("/cart")).toBe("cart");
  });
});

describe("offers on local D1", () => {
  let proxy: PlatformProxy<CloudflareEnv>; let env: CloudflareEnv;
  const cart = [{ slug: "dentists-us", pkg: "Complete" }];
  beforeAll(async () => {
    proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "pilo2-")) } });
    const base = proxy.env as CloudflareEnv;
    const over: Record<string, string> = { CHECKOUT_ENABLED: "true", CHECKOUT_ALLOW_PLACEHOLDER: "true" };
    env = new Proxy(base, { get: (t0, k) => (typeof k === "string" && k in over ? over[k] : (t0 as never)[k]) }) as CloudflareEnv;
    const sql = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort().map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
    for (const st of sql.split(";").map((x) => x.trim()).filter(Boolean)) await base.DB.prepare(st).run();
    await saveNeg(env, { ...DEFAULT_NEG, enabled: true });
  }, 60_000);
  afterAll(async () => { vi.restoreAllMocks(); await proxy?.dispose(); });

  it("refuses without an explicit ask, with an empty cart, and when disabled", async () => {
    expect((await issueOffer(env, { sid: "s1", ipHash: "h", cart, lastUserText: "show me dentists" })).ok).toBe(false);
    expect((await issueOffer(env, { sid: "s1", ipHash: "h", cart: [], lastUserText: "any discount?" })).ok).toBe(false);
  });
  it("issues a capped offer, binds it to the session, applies once priced, and limits repeats", async () => {
    const r = await issueOffer(env, { sid: "s2", ipHash: "h2", cart, lastUserText: "can I get 50% off?" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.percent).toBeLessThanOrEqual(20);
    const other = await applyOffer(env, { sid: "someone-else", offerId: r.offerId, cart });
    expect(other.ok).toBe(false);
    const mine = await applyOffer(env, { sid: "s2", offerId: r.offerId, cart });
    expect(mine.ok).toBe(true);
    if (mine.ok) { expect(mine.code).toMatch(/^PILO-/); expect(mine.discountCents).toBeGreaterThan(0); expect(mine.totalCents + mine.discountCents).toBe(mine.subtotalCents); }
    for (let i = 0; i < 5; i++) await issueOffer(env, { sid: "s2", ipHash: "h2", cart, lastUserText: "any discount?" });
    const n = await env.DB.prepare("SELECT count(*) AS n FROM pilo_offers WHERE session_id='s2'").first<{ n: number }>();
    expect(n!.n).toBeLessThanOrEqual(3);
  });
  it("the email verification service is never part of an offer", async () => {
    const r = await issueOffer(env, { sid: "s3", ipHash: "h3", cart: [{ slug: "email-verification", pkg: "Starter" }], lastUserText: "any discount?" });
    expect(r.ok).toBe(false);
  });
  it("an expired offer cannot be applied", async () => {
    const r = await issueOffer(env, { sid: "s4", ipHash: "h4", cart, lastUserText: "discount please" });
    if (!r.ok) throw new Error("setup");
    await env.DB.prepare("UPDATE pilo_offers SET expires_at = unixepoch() - 5 WHERE id = ?").bind(r.offerId).run();
    expect((await applyOffer(env, { sid: "s4", offerId: r.offerId, cart })).ok).toBe(false);
  });
});
