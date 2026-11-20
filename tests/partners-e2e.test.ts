// Data Reseller Partners end to end against a LOCAL D1 + KV: application -> duplicate detection -> approval (code + email)
// -> discounted cart pricing -> discounted order -> deactivation -> decline. Resend is mocked; nothing leaves the machine.
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getProducts } from "@/lib/catalog";
import { priceCart, discounted } from "@/lib/cart/model";
import { CheckoutError, createOrder } from "@/lib/checkout/create";
import { getDbFromEnv } from "@/lib/db";
import { DISCOUNT_REFUSED, newPartnerCode, normalizeCode, resolveDiscount } from "@/lib/partners/discount";
import { PartnerError, approve, decline, markUnderReview, pendingCount, resendDecisionEmail, setPartnerDiscount } from "@/lib/partners/decide";
import { submitPartnerApplication } from "@/lib/partners/submit";
import { cleanWebsite, partnerApplicationSchema } from "@/lib/partners/types";
import { setTemplateOff } from "@/lib/system-emails/enabled";
import { getTemplate } from "@/lib/system-emails/defaults";
import { renderEmail } from "@/lib/system-emails/render";
import { checkContent, exampleVars } from "@/lib/system-emails/store";

let proxy: PlatformProxy<CloudflareEnv>;
let base: CloudflareEnv;
let env: CloudflareEnv;
const P = getProducts();
const a = P[0], b = P[1];
const it0 = (p: (typeof P)[number], n = 0) => ({ productSlug: p.slug, packageName: p.packages[n].name });
const sent: { to: string[]; subject: string; text: string; html?: string }[] = [];
const mockResend = () => vi.spyOn(globalThis, "fetch").mockImplementation(async (_u, init) => { sent.push(JSON.parse(String((init as RequestInit).body))); return new Response(JSON.stringify({ id: `m${sent.length}` }), { status: 200 }); });
const notify = async () => "sent" as const;

const valid = { turnstileToken: "t", fullName: "Ada Lovelace", businessName: "Analytical Engines Ltd", email: "Ada@Partner.Test", websiteUrl: "partner.test", country: "United Kingdom", businessType: "agency", resalePlan: "We build prospect lists for agency clients and resell them as part of campaigns.", terms: true as const };

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "partners-e2e-")) } });
  base = proxy.env as CloudflareEnv;
  const over: Record<string, string> = { CHECKOUT_ENABLED: "true", CHECKOUT_ALLOW_PLACEHOLDER: "true", RESEND_API_KEY: "re_test", NOTIFY_EMAIL: "owner@test.dev", EMAIL_FROM: "BeigeLeads <hi@test.dev>" };
  env = new Proxy(base, { get: (t, k) => (typeof k === "string" && k in over ? over[k] : (t as never)[k]) }) as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await base.DB.prepare(stmt).run();
  await base.CACHE.put("rate:BTC", "60000.00000000", { expirationTtl: 3600 });
  await base.DB.prepare("INSERT INTO wallets (coin, network, address_or_xpub, next_index, enabled, activates_at, min_confirmations) VALUES ('BTC','testnet','tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',0,1,0,1)").run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });
afterEach(() => { vi.restoreAllMocks(); });

const db = () => getDbFromEnv(env);
const one = async <T,>(sql: string, ...args: unknown[]) => (await base.DB.prepare(sql).bind(...args).first()) as T;
const idOf = async (email: string) => (await one<{ id: number }>("SELECT id FROM partner_applications WHERE email = ?", email)).id;

describe("application form rules", () => {
  it("validates every field", () => {
    expect(partnerApplicationSchema.safeParse(valid).success).toBe(true);
    for (const bad of [{ fullName: "A" }, { businessName: "" }, { email: "nope" }, { websiteUrl: "not a site" }, { country: "" }, { businessType: "pirate" }, { resalePlan: "short" }, { terms: false }]) {
      expect(partnerApplicationSchema.safeParse({ ...valid, ...bad }).success, JSON.stringify(bad)).toBe(false);
    }
    expect(partnerApplicationSchema.safeParse({ ...valid, monthlyVolume: "2 lists", notes: "hello" }).success).toBe(true);
  });
  it("cleans websites and refuses non-web addresses", () => {
    expect(cleanWebsite("partner.test")).toBe("https://partner.test");
    expect(cleanWebsite("http://x.co/a")).toBe("http://x.co/a");
    expect(cleanWebsite("javascript:alert(1)")).toBeNull();
    expect(cleanWebsite("nodots")).toBeNull();
  });
});

describe("submission", () => {
  it("saves first, sends the branded confirmation once, and alerts the owner", async () => {
    mockResend();
    const d = partnerApplicationSchema.parse(valid);
    const out = await submitPartnerApplication(db(), env, notify, d);
    expect(out.duplicate).toBe(false);
    expect(out.reference).toMatch(/^PT-[2-9A-HJKMNP-Z]{8}$/);
    expect(out.email).toBe("sent");
    const row = await one<{ status: string; email: string; website: string; owner_notify: string; email_status: string }>("SELECT * FROM partner_applications WHERE reference = ?", out.reference);
    expect(row).toMatchObject({ status: "pending", email: "ada@partner.test", website: "https://partner.test", owner_notify: "sent", email_status: "sent" });
    const mail = sent.find((m) => m.subject === "We've Received Your BeigeLeads Partner Application");
    expect(mail?.to).toEqual(["ada@partner.test"]);
    expect(mail?.text).toContain("Hi Ada,");
    expect(mail?.text).toContain("respond within 7 days");
    expect(mail?.text).toContain("50% discount");
    expect(await pendingCount(db())).toBe(1);
  });
  it("detects duplicates: no second row, no second email, same reference", async () => {
    mockResend();
    const before = sent.length;
    const first = await one<{ reference: string }>("SELECT reference FROM partner_applications LIMIT 1");
    const again = await submitPartnerApplication(db(), env, notify, partnerApplicationSchema.parse(valid));
    expect(again).toMatchObject({ duplicate: true, reference: first.reference });
    // same email, different business: still the same open application
    const other = await submitPartnerApplication(db(), env, notify, partnerApplicationSchema.parse({ ...valid, businessName: "Another Co" }));
    expect(other.duplicate).toBe(true);
    expect((await one<{ n: number }>("SELECT COUNT(*) AS n FROM partner_applications")).n).toBe(1);
    expect(sent.length).toBe(before);
  });
  it("keeps the application when the email fails, and says so", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 500 }));
    const out = await submitPartnerApplication(db(), env, notify, partnerApplicationSchema.parse({ ...valid, email: "grace@partner.test", businessName: "Compilers Inc" }));
    expect(out.email).toBe("failed");
    expect((await one<{ email_status: string }>("SELECT email_status FROM partner_applications WHERE email = 'grace@partner.test'")).email_status).toBe("failed");
  });
});

describe("a discount is not granted by applying", () => {
  it("no code exists for a pending application, and made-up codes are refused with one generic message", async () => {
    expect((await one<{ n: number }>("SELECT COUNT(*) AS n FROM partner_discounts")).n).toBe(0);
    const r = await resolveDiscount(db(), "PARTNER-AAAA-BBBB", "ada@partner.test");
    expect(r).toEqual({ ok: false, reason: DISCOUNT_REFUSED });
    await expect(createOrder(env, { email: "ada@partner.test", items: [it0(a)], option: "BTC", discountCode: "PARTNER-AAAA-BBBB" })).rejects.toBeInstanceOf(CheckoutError);
  });
});

describe("approval", () => {
  let code = "";
  it("marks under review, then approves: code created, approval email carries it, sent once", async () => {
    const id = await idOf("ada@partner.test");
    await markUnderReview(db(), id);
    await expect(markUnderReview(db(), id)).rejects.toBeInstanceOf(PartnerError);
    mockResend();
    const r = await approve(env, db(), "admin@test.dev", id);
    expect(r).toEqual({ status: "approved", email: "sent" });
    const d = await one<{ code: string; email: string; percent: number; active: number }>("SELECT * FROM partner_discounts WHERE application_id = ?", id);
    code = d.code;
    expect(code).toMatch(/^PARTNER-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
    expect(d).toMatchObject({ email: "ada@partner.test", percent: 50, active: 1 });
    const mail = sent.find((m) => m.subject === "Welcome to the BeigeLeads Data Reseller Partner Program!");
    expect(mail?.to).toEqual(["ada@partner.test"]);
    expect(mail?.text).toContain(code);
    expect(mail?.text).toContain("50% off every BeigeLeads database product");
    expect(mail?.text).toContain("email address you applied with");
    await expect(approve(env, db(), "admin@test.dev", id)).rejects.toThrow(/already approved/);
    expect((await resendDecisionEmail(env, db(), id)).email).toBe("already-sent");
    expect(sent.filter((m) => m.subject.startsWith("Welcome to the BeigeLeads")).length).toBe(1);
    expect(await pendingCount(db())).toBe(1); // grace is still pending
  });

  it("the code works only with the partner's own email, in any letter case", async () => {
    expect(await resolveDiscount(db(), code.toLowerCase(), "ADA@partner.test")).toMatchObject({ ok: true, discount: { code, percent: 50 } });
    expect(await resolveDiscount(db(), `  ${code} `, "ada@partner.test")).toMatchObject({ ok: true });
    expect(await resolveDiscount(db(), code, "someone.else@test.dev")).toEqual({ ok: false, reason: DISCOUNT_REFUSED });
    expect(normalizeCode(" partner-abcd-efgh ")).toBe("PARTNER-ABCD-EFGH");
    expect(newPartnerCode()).toMatch(/^PARTNER-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
  });

  it("prices the cart at exactly half, line by line, never above list price", () => {
    const items = [{ slug: a.slug, pkg: a.packages[0].name }, { slug: b.slug, pkg: b.packages[1].name }];
    const ctx = { checkoutOpen: true, allowPlaceholder: true };
    const full = priceCart(items, ctx);
    const half = priceCart(items, { ...ctx, discount: { code, percent: 50 } });
    expect(full.discountPercent).toBe(0);
    expect(full.totalCents).toBe(full.subtotalCents);
    expect(half.subtotalCents).toBe(full.totalCents);
    expect(half.totalCents).toBe(half.lines.reduce((s, l) => s + discounted(l.priceCents, 50), 0));
    expect(half.totalCents).toBeLessThanOrEqual(Math.ceil(full.totalCents / 2) + half.lines.length);
    expect(half.discountCents).toBe(half.subtotalCents - half.totalCents);
    expect(half.discountCode).toBe(code);
    for (const l of half.lines) expect(l.payCents).toBe(Math.round(l.priceCents / 2));
  });

  it("creates a discounted order: total is half, items add up to the total, discount is recorded and counted", async () => {
    const id = await createOrder(env, { email: "ADA@partner.test", items: [it0(a, 0), it0(b, 1)], option: "BTC", discountCode: code.toLowerCase() });
    const list = a.packages[0].priceUsdCents + b.packages[1].priceUsdCents;
    const o = await one<{ t: number; code: string; pct: number; sub: number }>("SELECT total_usd_cents AS t, discount_code AS code, discount_percent AS pct, subtotal_cents AS sub FROM orders WHERE id = ?", id);
    expect(o).toMatchObject({ code, pct: 50, sub: list });
    expect(o.t).toBe(discounted(a.packages[0].priceUsdCents, 50) + discounted(b.packages[1].priceUsdCents, 50));
    expect(o.t).toBeLessThan(list);
    const items = (await base.DB.prepare("SELECT price_usd_cents AS p FROM order_items WHERE order_id = ?").bind(id).all<{ p: number }>()).results;
    expect(items.reduce((s, x) => s + x.p, 0)).toBe(o.t);
    expect((await one<{ uses: number }>("SELECT uses FROM partner_discounts WHERE code = ?", code)).uses).toBe(1);
    // the payment amount follows the discounted total (60,000 USD per BTC in this test)
    const att = await one<{ amount: string }>("SELECT expected_amount AS amount FROM payment_attempts WHERE order_id = ?", id);
    expect(Number(att.amount)).toBeCloseTo(o.t / 100 / 60000, 4);
  });

  it("refuses the code with someone else's email, and an order without a code is full price", async () => {
    await expect(createOrder(env, { email: "thief@test.dev", items: [it0(a)], option: "BTC", discountCode: code })).rejects.toThrow(/cannot be used with this email/);
    const id = await createOrder(env, { email: "retail@test.dev", items: [it0(a)], option: "BTC" });
    const o = await one<{ t: number; code: string | null }>("SELECT total_usd_cents AS t, discount_code AS code FROM orders WHERE id = ?", id);
    expect(o).toEqual({ t: a.packages[0].priceUsdCents, code: null });
  });

  it("a deactivated code stops working at once; reactivating restores it", async () => {
    const id = await idOf("ada@partner.test");
    await setPartnerDiscount(db(), id, false);
    expect(await resolveDiscount(db(), code, "ada@partner.test")).toEqual({ ok: false, reason: DISCOUNT_REFUSED });
    await expect(createOrder(env, { email: "ada@partner.test", items: [it0(b, 0)], option: "BTC", discountCode: code })).rejects.toBeInstanceOf(CheckoutError);
    await setPartnerDiscount(db(), id, true);
    expect(await resolveDiscount(db(), code, "ada@partner.test")).toMatchObject({ ok: true });
  });
});

describe("decline", () => {
  it("declines with the respectful email, never creates a code, and a decided application can be re-applied for", async () => {
    mockResend();
    const id = await idOf("grace@partner.test");
    const r = await decline(env, db(), "admin@test.dev", id);
    expect(r).toEqual({ status: "declined", email: "sent" });
    const mail = sent.find((m) => m.subject === "Update on Your BeigeLeads Partner Application");
    expect(mail?.to).toEqual(["grace@partner.test"]);
    expect(mail?.text).toContain("not able to approve");
    expect((await one<{ n: number }>("SELECT COUNT(*) AS n FROM partner_discounts WHERE application_id = ?", id)).n).toBe(0);
    await expect(decline(env, db(), "admin@test.dev", id)).rejects.toThrow(/already declined/);
    await expect(setPartnerDiscount(db(), id, true)).rejects.toBeInstanceOf(PartnerError);
    const again = await submitPartnerApplication(db(), env, notify, partnerApplicationSchema.parse({ ...valid, email: "grace@partner.test", businessName: "Compilers Inc" }));
    expect(again.duplicate).toBe(true); // same email + business: identical application is not duplicated
    const fresh = await submitPartnerApplication(db(), env, notify, partnerApplicationSchema.parse({ ...valid, email: "grace@partner.test", businessName: "Compilers Two" }));
    expect(fresh.duplicate).toBe(false); // declined earlier, different business: a new application is allowed
  });
  it("a failed decision email can be retried and then goes out once", async () => {
    const id = await idOf("grace@partner.test");
    const decided = await one<{ id: number }>("SELECT id FROM partner_applications WHERE email = 'grace@partner.test' AND status = 'pending'");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 500 }));
    expect((await decline(env, db(), "admin@test.dev", decided.id)).email).toBe("failed");
    vi.restoreAllMocks();
    mockResend();
    expect((await resendDecisionEmail(env, db(), decided.id)).email).toBe("sent");
    expect((await resendDecisionEmail(env, db(), decided.id)).email).toBe("already-sent");
    void id;
  });
});

describe("system emails integration", () => {
  it("the three templates are editable, valid, and belong to the Data Reseller Partners category", () => {
    for (const key of ["partner_application_received", "partner_application_approved", "partner_application_declined"]) {
      const def = getTemplate(key)!;
      expect(def.category).toBe("Data Reseller Partners");
      expect(def.canDisable).toBe(true);
      const c = checkContent(def, def.content);
      expect(c.errors, key).toEqual([]);
      const r = renderEmail(c.content!, { company_name: "BeigeLeads", website_url: "https://beigeleads.com", lists_url: "https://beigeleads.com/lists", ...exampleVars(def) }, {});
      expect(r.html.length).toBeGreaterThan(500);
      expect(r.issues.unknown).toEqual([]);
    }
    expect(getTemplate("partner_application_approved")!.required).toContain("partner_code");
  });
  it("a switched-off template sends nothing and can be switched back on", async () => {
    mockResend();
    await setTemplateOff(db(), "admin@test.dev", "partner_application_received", true);
    const before = sent.length;
    const out = await submitPartnerApplication(db(), env, notify, partnerApplicationSchema.parse({ ...valid, email: "linus@partner.test", businessName: "Kernel Co" }));
    expect(out.email).toBe("skipped");
    expect(sent.length).toBe(before);
    await setTemplateOff(db(), "admin@test.dev", "partner_application_received", false);
  });
});
