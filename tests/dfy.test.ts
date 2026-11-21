// DFY Outbound: pure rules (packages, ceilings, pricing, capacity, state machine, tokens, onboarding) and the real flow on a local D1.
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getProducts } from "@/lib/catalog";
import { priceCart, type CartContext } from "@/lib/cart/model";
import { createOrder } from "@/lib/checkout/create";
import { deliverOrder } from "@/lib/delivery/deliver";
import { getDbFromEnv } from "@/lib/db";
import { checkCapacity } from "@/lib/dfy/capacity";
import { onboardingSchema } from "@/lib/dfy/onboarding";
import { DEFAULT_DFY, dfySettingsSchema, messageCeiling, saveDfySettings } from "@/lib/dfy/settings";
import { ADMIN_STAGES, STAGES, canMove } from "@/lib/dfy/state";
import * as S from "@/lib/dfy/store";
import { dfyToken, dfyTokenHash, signDfyFile, verifyDfyFile } from "@/lib/dfy/token";
import { DEFAULT_VOLUME } from "@/lib/sales/settings";

const dfyCtx = (pkg: string | null, ownership = false, enabled = true): CartContext["dfy"] => ({ pkg, ownership, enabled, ownershipEnabled: true, ownershipCents: 10_000, packages: DEFAULT_DFY.packages });
const ctx = (d?: CartContext["dfy"]): CartContext => ({ checkoutOpen: true, allowPlaceholder: true, volume: { ...DEFAULT_VOLUME, enabled: true } as never, dfy: d });
const dbs = getProducts().slice(0, 3).map((p) => ({ slug: p.slug, pkg: p.packages[0].name }));

describe("packages and ceilings", () => {
  it("default packages match the brief and validate", () => {
    expect(dfySettingsSchema.safeParse(DEFAULT_DFY).success).toBe(true);
    expect(DEFAULT_DFY.packages.map((p) => [p.name, p.monthlyCents, p.leads, p.initialSends, p.followups])).toEqual([["Starter", 29_900, 10_000, 10_000, 3], ["Growth", 59_900, 50_000, 50_000, 5], ["Scale", 99_900, 100_000, 100_000, 7]]);
  });
  it("theoretical ceilings are leads x (1 + follow-ups)", () => {
    expect(DEFAULT_DFY.packages.map((p) => messageCeiling(p.leads, p.followups))).toEqual([40_000, 300_000, 800_000]);
  });
  it("leads, sends and follow-ups are separate fields (a package with more sends than leads still validates but is flagged by the capacity check)", () => {
    const r = checkCapacity({ leads: 100, initialSends: 200, followups: 1, inboxes: 10, domains: 3, perInboxDaily: 30, sendingDays: 22, inboxesMin: 5, inboxesMax: 20, domainsMin: 1, domainsMax: 5, plannedMessages: 0 });
    expect(r.issues.join(" ")).toMatch(/Initial sends are higher/);
  });
});

describe("cart pricing", () => {
  it("initial totals with and without ownership", () => {
    const want: Record<string, [number, number]> = { Starter: [29_900, 39_900], Growth: [59_900, 69_900], Scale: [99_900, 109_900] };
    for (const [n, [a, b]] of Object.entries(want)) {
      expect(priceCart([], ctx(dfyCtx(n))).totalCents).toBe(a);
      const w = priceCart([], ctx(dfyCtx(n, true)));
      expect(w.totalCents).toBe(b); expect(w.dfy).toMatchObject({ ownership: true, ownershipCents: 10_000, monthlyCents: a });
    }
  });
  it("ownership is off unless chosen and is never added when the option is disabled", () => {
    expect(priceCart([], ctx(dfyCtx("Growth"))).dfy?.ownership).toBe(false);
    expect(priceCart([], ctx({ ...dfyCtx("Growth", true)!, ownershipEnabled: false })).totalCents).toBe(59_900);
  });
  it("is outside Buy More Save More and database discounts, and does not count toward tiers", () => {
    const without = priceCart(dbs, ctx());
    const withDfy = priceCart(dbs, ctx(dfyCtx("Scale", true)));
    expect(withDfy.totalCents).toBe(without.totalCents + 109_900);
    expect(withDfy.discountCents).toBe(without.discountCents);
    expect(withDfy.volume?.count ?? 0).toBe(without.volume?.count ?? 0);
  });
  it("unknown or disabled package gives no line; DFY-only cart can check out when enabled", () => {
    expect(priceCart(dbs, ctx(dfyCtx("Nope"))).dfy).toBeUndefined();
    expect(priceCart([], ctx(dfyCtx("Starter", false, false))).canCheckout).toBe(false);
    expect(priceCart([], ctx(dfyCtx("Starter"))).canCheckout).toBe(true);
  });
});

describe("capacity validation", () => {
  const base = { leads: 50_000, initialSends: 50_000, followups: 5, inboxesMin: 35, inboxesMax: 40, domainsMin: 10, domainsMax: 15, perInboxDaily: 30, sendingDays: 22, plannedMessages: 0 };
  it("flags a mismatch instead of reducing anything silently", () => {
    const r = checkCapacity({ ...base, inboxes: 35, domains: 10 });
    expect(r.ceiling).toBe(300_000); expect(r.monthlyCapacity).toBe(23_100); expect(r.ok).toBe(false);
    expect(r.issues.join(" ")).toMatch(/theoretical ceiling/i);
  });
  it("flags missing infrastructure, below-range inboxes and over-capacity plans", () => {
    expect(checkCapacity({ ...base, inboxes: 0, domains: 0 }).issues.join(" ")).toMatch(/No inboxes[\s\S]*No domains/);
    expect(checkCapacity({ ...base, inboxes: 20, domains: 10 }).issues.join(" ")).toMatch(/below the sold range/);
    expect(checkCapacity({ ...base, inboxes: 35, domains: 10, plannedMessages: 30_000 }).issues.join(" ")).toMatch(/exceed one month/);
  });
});

describe("stages, tokens, onboarding", () => {
  it("has the 19 stages and payment/onboarding/paused are not manual targets", () => {
    expect(STAGES).toHaveLength(19);
    for (const s of ["awaiting_payment", "awaiting_onboarding", "onboarding_submitted", "paused"] as const) expect(ADMIN_STAGES).not.toContain(s);
    expect(canMove("awaiting_payment", "campaign_active")).toBe(false);
    expect(canMove("awaiting_onboarding", "campaign_active")).toBe(false);
    expect(canMove("cancelled", "campaign_active")).toBe(false);
    expect(canMove("paused", "campaign_active")).toBe(false);
  });
  it("tokens are derived, hashed and signed links expire", async () => {
    const t = await dfyToken({ HASH_SALT: "x" }, "DFY-AAAA"); expect(t).toMatch(/^[0-9a-f]{48}$/);
    expect(await dfyToken({ HASH_SALT: "y" }, "DFY-AAAA")).not.toBe(t);
    expect(await dfyTokenHash(t)).toMatch(/^[0-9a-f]{64}$/);
    const { exp, sig } = await signDfyFile({ HASH_SALT: "x" }, "k", 60, 1_000_000);
    expect(await verifyDfyFile({ HASH_SALT: "x" }, "k", exp, sig, 1_000_000)).toBe(true);
    expect(await verifyDfyFile({ HASH_SALT: "x" }, "k", exp, sig, 1_000_000 + 120_000)).toBe(false);
  });
  it("onboarding refuses pasted passwords and needs both confirmations", () => {
    const ok = { contactName: "Ann Lee", businessName: "Acme", website: "acme.com", offer: "We sell widgets to shops", icp: "Dentists in Texas with 5-20 staff", countries: "US", exclusions: "", goals: "", infrastructure: "", senderNames: "", jurisdictions: "US", lawfulBasis: "B2B legitimate interest", suppression: "", authorized: true, lawful: true };
    expect(onboardingSchema.safeParse(ok).success).toBe(true);
    expect(onboardingSchema.safeParse({ ...ok, infrastructure: "registrar password: hunter2" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...ok, authorized: false }).success).toBe(false);
  });
});

// ---- real flow on a local D1 -------------------------------------------------------------------------------
let proxy: PlatformProxy<CloudflareEnv>; let base: CloudflareEnv; let env: CloudflareEnv;
const sent: { to: string[]; subject: string; html?: string; text?: string }[] = [];
const q = async (sql: string, ...b: unknown[]) => (await base.DB.prepare(sql).bind(...b).first()) as Record<string, number | string | null> | null;
beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "dfy-e2e-")) } });
  base = proxy.env as CloudflareEnv;
  const over: Record<string, string> = { CHECKOUT_ENABLED: "true", CHECKOUT_ALLOW_PLACEHOLDER: "true", RESEND_API_KEY: "re_test", NOTIFY_EMAIL: "owner@test.dev", EMAIL_FROM: "BeigeLeads <hi@test.dev>", HASH_SALT: "test-salt" };
  env = new Proxy(base, { get: (t, k) => (typeof k === "string" && k in over ? over[k] : (t as never)[k]) }) as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await base.DB.prepare(stmt).run();
  await base.CACHE.put("rate:BTC", "60000.00000000", { expirationTtl: 3600 });
  await base.DB.prepare("INSERT INTO wallets (coin, network, address_or_xpub, next_index, enabled, activates_at, min_confirmations) VALUES ('BTC','testnet','tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',0,1,0,1)").run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });
afterEach(() => { vi.restoreAllMocks(); });
const mockMail = () => vi.spyOn(globalThis, "fetch").mockImplementation(async (_u, init) => { sent.push(JSON.parse(String((init as RequestInit).body))); return new Response(JSON.stringify({ id: `m${sent.length}` }), { status: 200 }); });
const pay = (orderId: string) => base.DB.prepare("UPDATE orders SET status = 'paid', paid_at = unixepoch() WHERE id = ?").bind(orderId).run();
const db = () => getDbFromEnv(base);
const newOrder = async (pkg: string, ownership: boolean, email = `d-${Math.random()}@test.dev`) => ({ email, orderId: await createOrder(env, { email, items: [], dfy: { pkg, ownership }, option: "BTC" }) });

describe("checkout and payment", () => {
  it("creates one order with a monthly line, a separate one-time ownership line and a snapshot row", async () => {
    const { orderId } = await newOrder("Growth", true);
    expect((await q("SELECT total_usd_cents AS t FROM orders WHERE id = ?", orderId))?.t).toBe(69_900);
    const rows = (await base.DB.prepare("SELECT product_slug AS s, price_usd_cents AS c FROM order_items WHERE order_id = ? ORDER BY id").bind(orderId).all()).results as { s: string; c: number }[];
    expect(rows).toEqual([{ s: "dfy-outbound", c: 59_900 }, { s: "dfy-ownership", c: 10_000 }]);
    const d = await q("SELECT * FROM dfy_orders WHERE order_id = ?", orderId);
    expect(d).toMatchObject({ package_name: "Growth", monthly_cents: 59_900, ownership: 1, ownership_cents: 10_000, leads: 50_000, initial_sends: 50_000, followups: 5, ceiling: 300_000, status: "awaiting_payment" });
    expect(await q("SELECT kind, amount_cents AS a FROM dfy_cycles WHERE order_id = ?", orderId)).toEqual({ kind: "initial", a: 69_900 });
  });
  it("ownership unchecked = no ownership line; unknown package refused; same cart returns the open order", async () => {
    const { orderId, email } = await newOrder("Starter", false);
    expect((await q("SELECT COUNT(*) AS n FROM order_items WHERE order_id = ?", orderId))?.n).toBe(1);
    expect((await q("SELECT total_usd_cents AS t FROM orders WHERE id = ?", orderId))?.t).toBe(29_900);
    await expect(createOrder(env, { email: "x@test.dev", items: [], dfy: { pkg: "Nope", ownership: false }, option: "BTC" })).rejects.toThrow(/does not exist/);
    expect(await createOrder(env, { email, items: [], dfy: { pkg: "Starter", ownership: false }, option: "BTC" })).toBe(orderId);
  });
  it("nothing starts before payment; a paid order moves to onboarding once, emails once, and never goes through database delivery", async () => {
    mockMail(); sent.length = 0;
    const { orderId } = await newOrder("Starter", false);
    expect(await S.fulfillOnPaid(env, orderId)).toBe(false);
    expect((await q("SELECT status FROM dfy_orders WHERE order_id = ?", orderId))?.status).toBe("awaiting_payment");
    await pay(orderId);
    expect(await deliverOrder(env, orderId)).toBe("no-lists");
    expect(await deliverOrder(env, orderId)).toBe("no-lists");
    const d = await q("SELECT status, paid_at AS p, renews_at AS r FROM dfy_orders WHERE order_id = ?", orderId);
    expect(d?.status).toBe("awaiting_onboarding"); expect(d?.r).toBeNull();
    expect(sent.filter((m) => /Payment Is Confirmed/.test(m.subject))).toHaveLength(1);
    expect(sent.filter((m) => /Next Step: Tell Us/.test(m.subject))).toHaveLength(1);
    expect((await q("SELECT COUNT(*) AS n FROM deliveries WHERE order_id = ?", orderId))?.n).toBe(0);
  });
});

describe("onboarding, gates, copy approval, reports", () => {
  const form = { contactName: "Ann Lee", businessName: "Acme", website: "acme.com", offer: "We sell widgets to shops", icp: "Dentists in Texas with 5-20 staff", countries: "US", exclusions: "", goals: "", infrastructure: "", senderNames: "", jurisdictions: "US", lawfulBasis: "B2B legitimate interest", suppression: "", authorized: true, lawful: true };
  it("full lifecycle: onboarding -> gates block launch -> capacity/assets/copy -> launch", async () => {
    mockMail(); sent.length = 0;
    const { orderId, email } = await newOrder("Growth", true);
    await pay(orderId); await S.fulfillOnPaid(env, orderId);
    const id = (await q("SELECT id FROM dfy_orders WHERE order_id = ?", orderId))!.id as string;
    const token = await dfyToken(env, id);
    // wrong token / bad form
    expect((await S.submitOnboarding(env, "0".repeat(48), form)).ok).toBe(false);
    expect((await S.submitOnboarding(env, token, { ...form, infrastructure: "password: abc" })).ok).toBe(false);
    expect((await S.submitOnboarding(env, token, form)).ok).toBe(true);
    expect((await S.submitOnboarding(env, token, form)).ok).toBe(false); // only once
    expect((await q("SELECT status FROM dfy_orders WHERE id = ?", id))?.status).toBe("onboarding_submitted");
    // launch gates
    expect((await S.moveStage(env, id, "infrastructure_planning", "admin@x")).ok).toBe(true);
    const blocked = await S.moveStage(env, id, "campaign_active", "admin@x");
    expect(blocked.ok).toBe(false); expect(!blocked.ok && blocked.error).toMatch(/capacity plan[\s\S]*No domain[\s\S]*No inbox[\s\S]*copy/);
    // capacity: mismatch needs explicit acceptance; approval needs real numbers
    const cap = { domains: 10, inboxes: 35, perInboxDaily: 30, sendingDays: 22, plannedMessages: 0, note: "" };
    const noAccept = await S.saveCapacity(env, id, cap, true, false, "admin@x"); expect(noAccept.ok).toBe(false);
    expect((await S.saveCapacity(env, id, { ...cap, inboxes: 0 }, true, true, "admin@x")).ok).toBe(false);
    expect((await S.saveCapacity(env, id, cap, true, true, "admin@x")).ok).toBe(true);
    expect((await q("SELECT capacity_approved AS a FROM dfy_orders WHERE id = ?", id))?.a).toBe(1);
    // assets: verified needs a note; announcing needs every item verified
    const dbc = db();
    await S.addAsset(dbc, id, "domain", "acme-mail.com", "admin@x"); await S.addAsset(dbc, id, "inbox", "ann@acme-mail.com", "admin@x");
    const [dom, inb] = await S.assetsOf(dbc, id);
    expect((await S.setAssetStatus(dbc, id, dom.id, "verified", "", "admin@x")).ok).toBe(false);
    expect((await S.announceInfra(env, id, "domain", "", "admin@x")).ok).toBe(false);
    expect((await S.setAssetStatus(dbc, id, dom.id, "verified", "SPF, DKIM, DMARC checked", "admin@x")).ok).toBe(true);
    expect((await S.setAssetStatus(dbc, id, inb.id, "verified", "Sent and received a test message", "admin@x")).ok).toBe(true);
    expect((await S.announceInfra(env, id, "domain", "", "admin@x")).ok).toBe(true);
    // copy: customer cannot approve before submission; approve; follow-ups rules
    expect((await S.reviewCopy(env, token, "approve", "")).ok).toBe(false);
    expect((await S.saveCopy(dbc, id, { step: 1, kind: "initial", variant: "A", subject: "Hi", body: "Hello there, quick question for you." }, "admin@x")).ok).toBe(true);
    expect((await S.saveCopy(dbc, id, { step: 2, kind: "followup", variant: "A", subject: "", body: "Following up on my note." }, "admin@x")).ok).toBe(true);
    expect((await S.saveCopy(dbc, id, { step: 1, kind: "followup", variant: "A", subject: "", body: "Wrong step number." }, "admin@x")).ok).toBe(false);
    expect((await S.moveStage(env, id, "campaign_active", "admin@x")).ok).toBe(false); // copy not approved
    expect((await S.submitCopy(env, id, "admin@x")).ok).toBe(true);
    expect((await S.reviewCopy(env, token, "changes", "")).ok).toBe(false); // changes need a note
    expect((await S.reviewCopy(env, token, "approve", "")).ok).toBe(true);
    const launched = await S.moveStage(env, id, "campaign_active", "admin@x");
    expect(launched.ok).toBe(true);
    expect(sent.some((m) => /Campaign Has Launched/.test(m.subject))).toBe(true);
    // metrics: validation, private until published
    const m = { period: "2026-11", sourced: 100, verified: 90, approved: 80, contacted: 70, initialSends: 70, followupSends: 10, failures: 2, replies: 5, interested: 2, optouts: 1, meetings: 1, note: "" };
    expect((await S.addMetrics(dbc, id, { ...m, verified: 200 }, "a")).ok).toBe(false);
    expect((await S.addMetrics(dbc, id, { ...m, interested: 9 }, "a")).ok).toBe(false);
    expect((await S.addMetrics(dbc, id, m, "a")).ok).toBe(true);
    const mid = (await q("SELECT id, published FROM dfy_metrics WHERE dfy_id = ?", id))!;
    expect(mid.published).toBe(0);
    expect((await S.publishReport(env, id, Number(mid.id), "a")).ok).toBe(true);
    expect(sent.some((x) => /Report Is Available/.test(x.subject))).toBe(true);
    // ownership needs date + assets before "transferred"
    expect((await S.saveOwnership(env, id, { status: "transferred", assets: "", agreement: "", restrictions: "", acknowledged: false, date: "", feePaid: true }, "a")).ok).toBe(false);
    expect((await S.saveOwnership(env, id, { status: "ready", assets: "", agreement: "", restrictions: "", acknowledged: false, date: "", feePaid: true }, "a")).ok).toBe(true);
    expect(sent.some((x) => /Transfer Is Ready/.test(x.subject))).toBe(true);
    // email is the order's own address and carries no secret
    const mailed = sent.filter((x) => x.to.includes(email));
    expect(mailed.length).toBeGreaterThan(3);
  });
  it("copy: step rules", async () => {
    const { orderId } = await newOrder("Starter", false); await pay(orderId); await S.fulfillOnPaid(env, orderId);
    const id = (await q("SELECT id FROM dfy_orders WHERE order_id = ?", orderId))!.id as string;
    expect((await S.saveCopy(db(), id, { step: 2, kind: "initial", variant: "A", subject: "", body: "Initial must be step 1." }, "a")).ok).toBe(false);
    expect((await S.saveCopy(db(), id, { step: 1, kind: "followup", variant: "A", subject: "", body: "Follow-up must be 2+." }, "a")).ok).toBe(false);
  });
});

describe("one-time service: no renewals, reminders or automatic pauses", () => {
  it("renewal checkout is gone; the cron never pauses or emails; pause/resume stay manual", async () => {
    mockMail(); sent.length = 0;
    const { orderId, email } = await newOrder("Starter", true);
    await pay(orderId); await S.fulfillOnPaid(env, orderId);
    const id = (await q("SELECT id FROM dfy_orders WHERE order_id = ?", orderId))!.id as string;
    expect((await q("SELECT renews_at AS r FROM dfy_orders WHERE id = ?", id))?.r).toBeNull();
    // a renewal order can no longer be created, whatever the input
    await expect(createOrder(env, { email, items: [], option: "BTC", dfyRenewal: id } as never)).rejects.toThrow();
    // old rows with a past renewal date are NOT paused and no reminder or payment-problem email goes out
    await base.DB.prepare("UPDATE dfy_orders SET renews_at = unixepoch() - 10, status = 'campaign_active' WHERE id = ?").bind(id).run();
    await S.sweepDfy(env); await S.sweepDfy(env);
    expect((await q("SELECT status FROM dfy_orders WHERE id = ?", id))?.status).toBe("campaign_active");
    expect(sent.filter((m) => /Renewal|Problem With Your DFY Payment/.test(m.subject))).toHaveLength(0);
    expect((await S.pause(env, id, "a", "customer request")).ok).toBe(true);
    expect((await S.resume(env, id, "a")).ok).toBe(true);
  });
  it("paying twice does not extend or restart anything (idempotent)", async () => {
    const { orderId } = await newOrder("Growth", false); await pay(orderId);
    expect(await S.fulfillOnPaid(env, orderId)).toBe(true);
    expect(await S.fulfillOnPaid(env, orderId)).toBe(false);
  });
  it("stored settings that still describe monthly billing are replaced by the one-time wording", async () => {
    await saveDfySettings(env, { ...DEFAULT_DFY, billingTerms: "Each month is paid in advance in crypto." }, "t");
    await base.CACHE.delete("dfy:settings:v1");
    const { loadDfySettings } = await import("@/lib/dfy/settings");
    expect((await loadDfySettings(env)).billingTerms).toMatch(/one-time/i);
  });
});
