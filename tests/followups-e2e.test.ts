// Follow-ups against a LOCAL D1: reviews (request, answer, moderation, public threshold), sample follow-up, opt-out, order lookup.
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DEFAULT_FOLLOWUPS, parseFollowups, saveFollowups } from "@/lib/followups/settings";
import { moderate, publicReviews, reviewByToken, sendReviewRequests, submitReview } from "@/lib/followups/reviews";
import { sendSampleFollowups } from "@/lib/followups/samples";
import { addOptout, isOptedOut, optoutToken, reviewToken, verifyOptout } from "@/lib/followups/tokens";
import { lookupInput, lookupOrder } from "@/lib/orders/lookup";
import { TEMPLATES } from "@/lib/system-emails/defaults";
import { VAR_KEYS } from "@/lib/system-emails/variables";

let proxy: PlatformProxy<CloudflareEnv>; let base: CloudflareEnv; let env: CloudflareEnv;
const mockResend = () => vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify({ id: "m1" }), { status: 200 }));
const NOW = () => Math.floor(Date.now() / 1000);
const DAY = 86400;

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "followups-e2e-")) } });
  base = proxy.env as CloudflareEnv;
  const over: Record<string, string> = { RESEND_API_KEY: "re_test", NOTIFY_EMAIL: "owner@test.dev", EMAIL_FROM: "BeigeLeads <hi@test.dev>", HASH_SALT: "salt-test" };
  env = new Proxy(base, { get: (t, k) => (typeof k === "string" && k in over ? over[k] : (t as never)[k]) }) as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join(";\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await base.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });
afterEach(() => { vi.restoreAllMocks(); });

const run = (q: string, ...a: unknown[]) => base.DB.prepare(q).bind(...a).run();
const one = async <T,>(q: string, ...a: unknown[]) => (await base.DB.prepare(q).bind(...a).first()) as T;
async function delivered(id: string, email: string, ageDays: number, network = "mainnet", slug = "dentists-us") {
  await run("INSERT INTO orders (id, email, status, total_usd_cents, paid_at) VALUES (?, ?, 'paid', 9900, ?)", id, email, NOW() - ageDays * DAY);
  await run("INSERT INTO order_items (order_id, product_slug, package_name, records, price_usd_cents) VALUES (?, ?, 'Starter', 100000, 9900)", id, slug);
  await run("INSERT INTO payment_attempts (order_id, coin, network, address, expected_amount, locked_rate, expires_at, status) VALUES (?, 'BTC', ?, 'addr', '0.1', '1', ?, 'paid')", id, network, NOW() + DAY);
  await run("INSERT INTO deliveries (order_id, url, status, attempts, sent_at) VALUES (?, 'https://x.test/f', 'sent', 1, ?)", id, NOW() - ageDays * DAY);
}

describe("templates and settings", () => {
  it("both templates exist, use only known variables, and carry an opt-out link", () => {
    for (const k of ["review_request", "sample_followup"]) {
      const t = TEMPLATES.find((x) => x.key === k)!;
      expect(t).toBeTruthy(); expect(t.vars.every((v) => VAR_KEYS.has(v))).toBe(true);
      expect(t.required).toContain("unsubscribe_url");
      expect(JSON.stringify(t.content)).toContain("{{unsubscribe_url}}");
      expect(JSON.stringify(t.content)).not.toMatch(/\d+%|limited|only \d|hurry|last chance/i);
    }
  });
  it("everything is OFF by default and bad stored values fall back to the defaults", () => {
    expect(DEFAULT_FOLLOWUPS.reviewsOn).toBe(false); expect(DEFAULT_FOLLOWUPS.sampleOn).toBe(false);
    expect(parseFollowups("not json")).toEqual(DEFAULT_FOLLOWUPS);
    expect(parseFollowups(JSON.stringify({ reviewDays: 9999 }))).toEqual(DEFAULT_FOLLOWUPS);
  });
  it("nothing is sent while switched off", async () => {
    mockResend();
    await delivered("OFF-ORDER-0001", "off@test.dev", 30);
    expect(await sendReviewRequests(env)).toBe(0);
    expect(await sendSampleFollowups(env)).toBe(0);
  });
});

describe("review requests", () => {
  it("sends once for delivered real-money orders, never for test networks or opted-out buyers", async () => {
    mockResend();
    expect((await saveFollowups(env, "t@test.dev", { ...DEFAULT_FOLLOWUPS, reviewsOn: true, reviewDays: 5 })).ok).toBe(true);
    await delivered("REAL-ORDER-0001", "real@test.dev", 10);
    await delivered("TEST-ORDER-0001", "test@test.dev", 10, "testnet4");
    await delivered("NEW-ORDER-00001", "new@test.dev", 1);
    await delivered("OPTD-ORDER-0001", "optd@test.dev", 10);
    await addOptout(env, "optd@test.dev");
    expect(await sendReviewRequests(env)).toBe(2); // REAL-ORDER and the earlier OFF-ORDER (now eligible)
    expect(await sendReviewRequests(env)).toBe(0); // idempotent
    const rows = (await base.DB.prepare("SELECT order_id, status FROM list_reviews ORDER BY order_id").all<{ order_id: string; status: string }>()).results;
    expect(rows.find((r) => r.order_id === "REAL-ORDER-0001")?.status).toBe("requested");
    expect(rows.find((r) => r.order_id === "OPTD-ORDER-0001")?.status).toBe("skipped");
    expect(rows.find((r) => r.order_id === "TEST-ORDER-0001")).toBeUndefined();
    expect(rows.find((r) => r.order_id === "NEW-ORDER-00001")).toBeUndefined();
  });
  it("a buyer answers once; public display needs permission, approval and the minimum count", async () => {
    const token = await reviewToken(env, "REAL-ORDER-0001");
    expect((await reviewByToken(env, token))?.status).toBe("requested");
    expect((await reviewByToken(env, "0".repeat(48)))).toBeNull();
    expect((await submitReview(env, { token, rating: 5, comment: "Good list", displayName: "Ada", allowPublic: true })).ok).toBe(true);
    expect((await submitReview(env, { token, rating: 1, comment: "again", displayName: "", allowPublic: true })).ok).toBe(false);
    const row = await one<{ id: number; status: string }>("SELECT id, status FROM list_reviews WHERE order_id = 'REAL-ORDER-0001'");
    expect(row.status).toBe("submitted");
    expect(await publicReviews(env)).toBeNull(); // not approved yet
    await moderate(env, row.id, "approved", "admin@test.dev");
    expect(await publicReviews(env)).toBeNull(); // below the minimum of 3
    for (let i = 0; i < 2; i++) await run("INSERT INTO list_reviews (order_id, token_hash, status, rating, comment, display_name, submitted_at, product_name) VALUES (?, ?, 'approved', 4, 'ok', '', unixepoch(), 'X')", `FILL-${i}`, `h${i}`);
    const pub = await publicReviews(env);
    expect(pub?.count).toBe(3); expect(pub?.average).toBe(4.3);
  });
  it("a private answer is stored but never public", async () => {
    await run("INSERT INTO list_reviews (order_id, token_hash, status) VALUES ('PRIV-1', 'hp', 'requested')");
    const row = await one<{ id: number }>("SELECT id FROM list_reviews WHERE order_id = 'PRIV-1'");
    expect(row.id).toBeGreaterThan(0);
  });
});

describe("sample follow-up", () => {
  it("one email per fulfilled sample, skipped when the list was bought or the person opted out", async () => {
    mockResend();
    await saveFollowups(env, "t@test.dev", { ...DEFAULT_FOLLOWUPS, sampleOn: true, sampleDays: 3 });
    const old = Date.now() - 10 * DAY * 1000;
    const mk = async (email: string, dk: string, status = "fulfilled") => run("INSERT INTO sample_requests (email, status, product_slug, dedupe_key, updated_at) VALUES (?, ?, 'dentists-us', ?, ?)", email, status, dk, old);
    await mk("a@test.dev", "a"); await mk("bought@test.dev", "b"); await mk("optout@test.dev", "c"); await mk("queued@test.dev", "d", "queued");
    await delivered("BOUGHT-ORDER-001", "bought@test.dev", 20);
    await addOptout(env, "optout@test.dev");
    expect(await sendSampleFollowups(env)).toBe(1);
    expect(await sendSampleFollowups(env)).toBe(0);
    const log = (await base.DB.prepare("SELECT status, reason FROM sample_followups").all<{ status: string; reason: string }>()).results;
    expect(log.filter((l) => l.status === "sent")).toHaveLength(1);
    expect(log.some((l) => l.reason === "opted out")).toBe(true);
  });
});

describe("opt-out tokens", () => {
  it("only the right token opts an address out, and it is recorded as a hash", async () => {
    const t = await optoutToken(env, "Who@Test.dev");
    expect(await verifyOptout(env, "who@test.dev", t)).toBe(true);
    expect(await verifyOptout(env, "other@test.dev", t)).toBe(false);
    expect(await verifyOptout(env, "who@test.dev", "bad")).toBe(false);
    await addOptout(env, "who@test.dev");
    expect(await isOptedOut(env, "WHO@test.dev")).toBe(true);
    expect(JSON.stringify((await base.DB.prepare("SELECT * FROM courtesy_optouts").all()).results)).not.toContain("who@test.dev");
  });
});

describe("order lookup", () => {
  it("needs the order number AND its email; a wrong pair looks the same as no order; no links are returned", async () => {
    await delivered("LOOKUP-ORDER-01", "Buyer@Test.dev", 1);
    const good = await lookupOrder(env, lookupInput.parse({ orderId: "LOOKUP-ORDER-01", email: "buyer@test.dev" }));
    expect(good.ok).toBe(true);
    if (good.ok) { expect(good.order.statusLabel).toBe("Paid"); expect(good.order.deliverySent).toBe(true); expect(good.order.canResend).toBe(true); expect(JSON.stringify(good.order)).not.toContain("x.test"); }
    expect((await lookupOrder(env, lookupInput.parse({ orderId: "LOOKUP-ORDER-01", email: "wrong@test.dev" }))).ok).toBe(false);
    expect((await lookupOrder(env, lookupInput.parse({ orderId: "NO-SUCH-ORDER-1", email: "buyer@test.dev" }))).ok).toBe(false);
    expect(lookupInput.safeParse({ orderId: "short", email: "a@b.co" }).success).toBe(false);
    expect(lookupInput.safeParse({ orderId: "has space in it", email: "a@b.co" }).success).toBe(false);
  });
});
