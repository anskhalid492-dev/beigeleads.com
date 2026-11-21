// Email List Verification service against a local D1 + KV + R2: checkout (standalone and mixed), payment hook, upload limits, admin workflow, emails.
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getProducts } from "@/lib/catalog";
import { createOrder } from "@/lib/checkout/create";
import { deliverOrder, deliverPendingOrders } from "@/lib/delivery/deliver";
import { getDbFromEnv } from "@/lib/db";
import { DEFAULT_EV, EV_SLUG, loadEvSettings, saveEvSettings } from "@/lib/ev/settings";
import { adminSetStatus, addResult, authorizeUpload, discardPending, finalizeFile, getEvByOrder, getEvByToken, purgeExpired, resultKey, startUpload, sweepEv } from "@/lib/ev/store";
import { evToken } from "@/lib/ev/token";
import { customerDownload, publicOrder } from "@/lib/ev/customer";
import { submitQuote } from "@/lib/ev/quote";

let proxy: PlatformProxy<CloudflareEnv>;
let base: CloudflareEnv;
let env: CloudflareEnv;
const [a] = getProducts();
const sent: { to: string[]; subject: string; text?: string }[] = [];
const q = async (sql: string, ...b: unknown[]) => (await base.DB.prepare(sql).bind(...b).first()) as Record<string, number | string | null> | null;

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "ev-e2e-")) } });
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
const mockMail = () => vi.spyOn(globalThis, "fetch").mockImplementation(async (_u, init) => { const b = JSON.parse(String((init as RequestInit).body)); sent.push(b); return new Response(JSON.stringify({ id: `m${sent.length}` }), { status: 200 }); });
const pay = (orderId: string) => base.DB.prepare("UPDATE orders SET status = 'paid', paid_at = unixepoch() WHERE id = ?").bind(orderId).run();
const emails = (n: number, offset = 0) => Array.from({ length: n }, (_, i) => `u${i + offset}@ex.com`).join("\n");
const put = async (evId: string, ev: Awaited<ReturnType<typeof getEvByOrder>>, text: string, name = "list.txt") => {
  const bytes = new TextEncoder().encode(text);
  const s = await startUpload(env, ev!, { filename: name, source: "upload", size: bytes.length, head: bytes.subarray(0, 8192) });
  if (!s.ok) return s;
  await base.LISTS.put(s.key, bytes);
  return { ...s, final: await finalizeFile(env, ev!, s.fileId) };
};
const newVerificationOrder = async (pkg: string, email = `v-${pkg}-${Math.random()}@test.dev`) => {
  const orderId = await createOrder(env, { email, items: [], verification: pkg, option: "BTC" });
  return { orderId, email };
};

describe("checkout", () => {
  it("each of the six packages is a standalone order at its exact price and limit", async () => {
    const want: Record<string, [number, number]> = { Starter: [1000, 10_000], Growth: [3000, 50_000], Business: [6000, 100_000], Professional: [12_000, 250_000], Scale: [25_000, 500_000], Enterprise: [49_900, 1_000_000] };
    for (const [name, [cents, limit]] of Object.entries(want)) {
      const { orderId } = await newVerificationOrder(name);
      expect((await q("SELECT total_usd_cents AS t FROM orders WHERE id = ?", orderId))?.t).toBe(cents);
      const it = await q("SELECT product_slug AS s, package_name AS p, records AS r, price_usd_cents AS c FROM order_items WHERE order_id = ?", orderId);
      expect(it).toEqual({ s: EV_SLUG, p: name, r: limit, c: cents });
      const ev = await getEvByOrder(getDbFromEnv(base), orderId);
      expect(ev).toMatchObject({ status: "awaiting_payment", limitCount: limit, priceCents: cents, packageName: name });
      expect(ev!.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });
  it("an unknown package is refused and creates nothing", async () => {
    const before = (await q("SELECT COUNT(*) AS n FROM orders"))!.n;
    await expect(createOrder(env, { email: "x@test.dev", items: [], verification: "Nope", option: "BTC" })).rejects.toThrow(/does not exist/);
    expect((await q("SELECT COUNT(*) AS n FROM orders"))!.n).toBe(before);
  });
  it("a repeat of the same cart returns the same open order (no second verification row)", async () => {
    const o1 = await createOrder(env, { email: "dup@test.dev", items: [], verification: "Growth", option: "BTC" });
    const o2 = await createOrder(env, { email: "dup@test.dev", items: [], verification: "Growth", option: "BTC" });
    expect(o2).toBe(o1);
    expect((await q("SELECT COUNT(*) AS n FROM ev_orders WHERE order_id = ?", o1))!.n).toBe(1);
  });
  it("a different package is a different order", async () => {
    const o1 = await createOrder(env, { email: "chg@test.dev", items: [], verification: "Starter", option: "BTC" });
    const o2 = await createOrder(env, { email: "chg@test.dev", items: [], verification: "Business", option: "BTC" });
    expect(o2).not.toBe(o1);
  });
  it("database + verification: total is the sum, verification is never discounted", async () => {
    const orderId = await createOrder(env, { email: "mix@test.dev", items: [{ productSlug: a.slug, packageName: a.packages[0].name }], verification: "Starter", option: "BTC" });
    expect((await q("SELECT total_usd_cents AS t FROM orders WHERE id = ?", orderId))?.t).toBe(a.packages[0].priceUsdCents + 1000);
    expect((await q("SELECT price_usd_cents AS c FROM order_items WHERE order_id = ? AND product_slug = ?", orderId, EV_SLUG))?.c).toBe(1000);
  });
  it("a disabled service cannot be bought", async () => {
    await saveEvSettings(env, { ...DEFAULT_EV, enabled: false }, "test");
    await base.CACHE.delete("ev:settings:v1");
    await expect(createOrder(env, { email: "off@test.dev", items: [], verification: "Starter", option: "BTC" })).rejects.toThrow(/not available/);
    await saveEvSettings(env, DEFAULT_EV, "test");
  });
  it("changing prices later does not touch a paid order's snapshot", async () => {
    const { orderId } = await newVerificationOrder("Starter", "snap@test.dev");
    await saveEvSettings(env, { ...DEFAULT_EV, packages: DEFAULT_EV.packages.map((p) => (p.name === "Starter" ? { ...p, priceCents: 2000, limit: 20_000 } : p)) }, "test");
    const ev = await getEvByOrder(getDbFromEnv(base), orderId);
    expect(ev).toMatchObject({ priceCents: 1000, limitCount: 10_000 });
    await saveEvSettings(env, DEFAULT_EV, "test");
  });
});

describe("payment and fulfilment", () => {
  it("verification-only: payment moves it to Awaiting File, emails once, and the delivery cron does not loop on it", async () => {
    mockMail(); sent.length = 0;
    const { orderId, email } = await newVerificationOrder("Starter");
    await pay(orderId);
    expect(await deliverOrder(env, orderId)).toBe("no-lists");
    expect(await deliverOrder(env, orderId)).toBe("no-lists");
    const ev = await getEvByOrder(getDbFromEnv(base), orderId);
    expect(ev?.status).toBe("awaiting_file");
    const confirms = sent.filter((m) => m.to.includes(email) && /Email List Verification Order Is Confirmed/.test(m.subject));
    expect(confirms).toHaveLength(1);
    expect(confirms[0].text).toContain(`/email-list-verification/submit/${await evToken(env, ev!.id)}`);
    expect(await deliverPendingOrders(env)).toBeGreaterThanOrEqual(0);
    expect((await q("SELECT COUNT(*) AS n FROM deliveries WHERE order_id = ?", orderId))!.n).toBe(0); // no database delivery row
  });
  it("mixed order: database links go out normally and verification stays Awaiting File", async () => {
    mockMail(); sent.length = 0;
    const email = "mixdeliver@test.dev";
    const orderId = await createOrder(env, { email, items: [{ productSlug: a.slug, packageName: a.packages[0].name }], verification: "Growth", option: "BTC" });
    await pay(orderId);
    await base.DB.prepare("INSERT OR REPLACE INTO delivery_links (product_slug, package_name, url, updated_by, updated_at) VALUES (?, '', ?, 'test', unixepoch())").bind(a.slug, "https://files.example/mix").run();
    expect(await deliverOrder(env, orderId)).toBe("sent");
    expect(sent.some((m) => m.text?.includes("https://files.example/mix"))).toBe(true);
    expect((await getEvByOrder(getDbFromEnv(base), orderId))?.status).toBe("awaiting_file");
    expect(sent.filter((m) => /Email List Verification Order Is Confirmed/.test(m.subject))).toHaveLength(1);
  });
  it("the cron safety net fulfils a paid order the hook missed", async () => {
    mockMail();
    const { orderId } = await newVerificationOrder("Business");
    await pay(orderId);
    const r = await sweepEv(env);
    expect(r.fulfilled).toBeGreaterThanOrEqual(1);
    expect((await getEvByOrder(getDbFromEnv(base), orderId))?.status).toBe("awaiting_file");
  });
});

describe("upload access and limits", () => {
  it("upload is refused before payment and for an unknown token, allowed after payment", async () => {
    const { orderId } = await newVerificationOrder("Starter");
    const ev = (await getEvByOrder(getDbFromEnv(base), orderId))!;
    const token = await evToken(env, ev.id);
    const pre = await authorizeUpload(env, token);
    expect(pre).toMatchObject({ ok: false, status: 402 });
    expect(await authorizeUpload(env, "0".repeat(48))).toMatchObject({ ok: false, status: 404 });
    mockMail(); await pay(orderId); await deliverOrder(env, orderId);
    expect((await authorizeUpload(env, token)).ok).toBe(true);
    expect(await getEvByToken(env, token)).toMatchObject({ id: ev.id });
  });

  const limits: [string, number][] = [["Starter", 10_000], ["Growth", 50_000], ["Business", 100_000], ["Professional", 250_000], ["Scale", 500_000], ["Enterprise", 1_000_000]];
  for (const [pkg, limit] of limits) {
    it(`${pkg}: exactly ${limit.toLocaleString("en-US")} emails are accepted${limit <= 50_000 || limit === 1_000_000 ? ", one more is rejected without truncation" : ""}`, async () => {
      mockMail();
      const { orderId } = await newVerificationOrder(pkg);
      await pay(orderId); await deliverOrder(env, orderId);
      const ev = (await getEvByOrder(getDbFromEnv(base), orderId))!;
      if (limit <= 50_000 || limit === 1_000_000) {
        const over = await put(ev.id, ev, emails(limit + 1));
        expect(over).toMatchObject({ final: { ok: false, over: { allowed: limit, submitted: limit + 1, remaining: limit } } });
        expect(await base.LISTS.head((over as { key: string }).key)).toBeNull(); // rejected file is deleted, not kept
      }
      const ok = await put(ev.id, ev, emails(limit));
      expect(ok).toMatchObject({ final: { ok: true, count: limit, total: limit } });
      expect((await getEvByOrder(getDbFromEnv(base), orderId))).toMatchObject({ status: "file_submitted", submittedCount: limit });
    }, 120_000);
  }

  it("5,000 emails fit the Starter package; duplicates count; files together cannot exceed the limit (no splitting)", async () => {
    mockMail();
    const { orderId } = await newVerificationOrder("Starter");
    await pay(orderId); await deliverOrder(env, orderId);
    const ev = (await getEvByOrder(getDbFromEnv(base), orderId))!;
    expect(await put(ev.id, ev, emails(5000))).toMatchObject({ final: { ok: true, count: 5000 } });
    const dup = await put(ev.id, (await getEvByOrder(getDbFromEnv(base), orderId))!, emails(2000)); // the same 2000 addresses again: duplicates count
    expect(dup).toMatchObject({ final: { ok: true, total: 7000 } });
    const split = await put(ev.id, (await getEvByOrder(getDbFromEnv(base), orderId))!, emails(3001, 9000));
    expect(split).toMatchObject({ final: { ok: false } });
    expect((await getEvByOrder(getDbFromEnv(base), orderId))?.submittedCount).toBe(7000);
  });
  it("CSV with one email column, header and extra columns; ambiguous columns ask the customer", async () => {
    mockMail();
    const { orderId } = await newVerificationOrder("Starter");
    await pay(orderId); await deliverOrder(env, orderId);
    const ev = (await getEvByOrder(getDbFromEnv(base), orderId))!;
    const csv = "name,email,company\n" + Array.from({ length: 50 }, (_, i) => `N${i},p${i}@ex.com,C`).join("\n");
    expect(await put(ev.id, ev, csv, "people.csv")).toMatchObject({ final: { ok: true, count: 50 } });
    const two = "work,personal\n" + Array.from({ length: 30 }, (_, i) => `w${i}@ex.com,p${i}@ex.org`).join("\n");
    const r = await put(ev.id, (await getEvByOrder(getDbFromEnv(base), orderId))!, two, "two.csv") as { fileId: string; final: { needColumn?: unknown[] } };
    expect(r.final.needColumn).toHaveLength(2);
    const fin = await finalizeFile(env, (await getEvByOrder(getDbFromEnv(base), orderId))!, r.fileId, 1);
    expect(fin).toMatchObject({ ok: true, count: 30 });
  });
  it("malformed and unsupported files are rejected: wrong type, empty, no emails, binary, disguised", async () => {
    mockMail();
    const { orderId } = await newVerificationOrder("Starter");
    await pay(orderId); await deliverOrder(env, orderId);
    const ev = (await getEvByOrder(getDbFromEnv(base), orderId))!;
    const start = (name: string, bytes: Uint8Array) => startUpload(env, ev, { filename: name, source: "upload", size: bytes.length, head: bytes.subarray(0, 8192) });
    expect(await start("a.exe", new TextEncoder().encode("MZ"))).toMatchObject({ ok: false, status: 415 });
    expect(await start("a.xls", new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 1, 2]))).toMatchObject({ ok: false });
    expect(await start("a.zip", new Uint8Array([0x50, 0x4b, 3, 4]))).toMatchObject({ ok: false });
    expect(await start("fake.xlsx", new TextEncoder().encode("just text"))).toMatchObject({ ok: false });
    expect(await start("empty.txt", new Uint8Array())).toMatchObject({ ok: false });
    expect(await start("bin.csv", new Uint8Array([0, 1, 2, 3, 0, 255, 0, 0]))).toMatchObject({ ok: false });
    expect(await put(ev.id, ev, "hello world this is not a list\nnothing here")).toMatchObject({ final: { ok: false } });
  });
  it("an oversized file is refused before anything is stored; an interrupted upload is cleaned up", async () => {
    mockMail();
    const { orderId } = await newVerificationOrder("Starter");
    await pay(orderId); await deliverOrder(env, orderId);
    const ev = (await getEvByOrder(getDbFromEnv(base), orderId))!;
    expect(await startUpload(env, ev, { filename: "big.csv", source: "upload", size: 101 * 1024 * 1024, head: new TextEncoder().encode("a@b.co\n") })).toMatchObject({ ok: false, status: 413 });
    expect(await startUpload(env, ev, { filename: "big.xlsx", source: "upload", size: 60 * 1024 * 1024, head: new Uint8Array([0x50, 0x4b, 3, 4]) })).toMatchObject({ ok: false, status: 413 });
    const s = await startUpload(env, ev, { filename: "half.txt", source: "upload", size: 100, head: new TextEncoder().encode("a@b.co\n") });
    if (!s.ok) throw new Error("start failed");
    expect(await finalizeFile(env, ev, s.fileId)).toMatchObject({ ok: false, error: expect.stringMatching(/did not finish/) }); // nothing was stored
    await discardPending(env, ev.id, s.fileId);
    expect((await q("SELECT state FROM ev_files WHERE id = ?", s.fileId))?.state).toBe("rejected");
  });
});

describe("admin workflow, results and customer access", () => {
  let orderId = ""; let email = ""; let evId = ""; let token = "";
  it("setup: paid order with an accepted list", async () => {
    mockMail(); sent.length = 0;
    ({ orderId, email } = await newVerificationOrder("Starter", "flow@test.dev"));
    await pay(orderId); await deliverOrder(env, orderId);
    const ev = (await getEvByOrder(getDbFromEnv(base), orderId))!;
    evId = ev.id; token = await evToken(env, evId);
    expect(await put(evId, ev, emails(100))).toMatchObject({ final: { ok: true } });
    expect(sent.some((m) => /We've Received Your Email List/.test(m.subject) && m.to.includes(email))).toBe(true);
    expect(sent.some((m) => /New Verification Order/.test(m.subject))).toBe(true);
    expect(sent.every((m) => !/u1@ex\.com/.test(m.text ?? ""))).toBe(true); // no list contents in any email
  });
  it("the state machine: cannot complete without a result file, cannot skip steps", async () => {
    mockMail();
    expect(await adminSetStatus(env, evId, "completed", "admin")).toMatchObject({ ok: false });
    expect(await adminSetStatus(env, evId, "needs_action", "admin")).toMatchObject({ ok: false }); // reason required
    expect(await adminSetStatus(env, evId, "processing", "admin")).toMatchObject({ ok: true });
    expect(sent.some((m) => /Verification Is in Progress/.test(m.subject))).toBe(true);
    expect(await adminSetStatus(env, evId, "awaiting_file" as never, "admin")).toMatchObject({ ok: false });
  });
  it("completion needs a real result; the results email goes out only then, once", async () => {
    mockMail();
    expect(await adminSetStatus(env, evId, "completed", "admin")).toMatchObject({ ok: false });
    expect(sent.some((m) => /Verified Email List Is Ready/.test(m.subject))).toBe(false);
    const fileId = crypto.randomUUID();
    await base.LISTS.put(resultKey(evId, fileId), new TextEncoder().encode("email,status\nu1@ex.com,valid\n"));
    await addResult(env, evId, { fileId, filename: "results.csv", size: 30 });
    expect(await adminSetStatus(env, evId, "completed", "admin")).toMatchObject({ ok: true });
    expect(sent.filter((m) => /Verified Email List Is Ready/.test(m.subject))).toHaveLength(1);
    expect(await adminSetStatus(env, evId, "completed", "admin")).toMatchObject({ ok: false }); // not twice
    expect(sent.filter((m) => /Verified Email List Is Ready/.test(m.subject))).toHaveLength(1);
  });
  it("customers need the secure token AND the order email; downloads are short-lived and flip Completed to Delivered", async () => {
    expect(await customerDownload(env, token, "someone@else.dev")).toMatchObject({ ok: false });
    expect(await customerDownload(env, "0".repeat(48), email)).toMatchObject({ ok: false });
    const r = await customerDownload(env, token, email.toUpperCase());
    expect(r).toMatchObject({ ok: true });
    if (!r.ok) return;
    expect(r.files[0].url).toMatch(/^\/api\/ev\/file\/[0-9a-f-]+\?exp=\d+&sig=[0-9a-f]{40}$/);
    const view = await publicOrder(env, token);
    expect(view?.view).toMatchObject({ status: "completed", resultsReady: true, submitted: 100 });
  });
  it("needs_action asks for a replacement; a new accepted file replaces the old one", async () => {
    mockMail(); sent.length = 0;
    const { orderId: o2, email: e2 } = await newVerificationOrder("Starter", "replace@test.dev");
    await pay(o2); await deliverOrder(env, o2);
    let ev = (await getEvByOrder(getDbFromEnv(base), o2))!;
    await put(ev.id, ev, emails(500));
    expect(await adminSetStatus(env, ev.id, "needs_action", "admin", { reason: "The file has no header row." })).toMatchObject({ ok: true });
    const mail = sent.find((m) => /Action Required/.test(m.subject) && m.to.includes(e2));
    expect(mail?.text).toContain("The file has no header row.");
    ev = (await getEvByOrder(getDbFromEnv(base), o2))!;
    expect(await put(ev.id, ev, emails(800))).toMatchObject({ final: { ok: true, total: 800 } }); // replaces, not 1300
    expect((await getEvByOrder(getDbFromEnv(base), o2))).toMatchObject({ status: "file_submitted", submittedCount: 800 });
  });
});

describe("reminders and retention", () => {
  it("a reminder is sent once after the configured time and stops once a file is accepted", async () => {
    mockMail(); sent.length = 0;
    const { orderId, email } = await newVerificationOrder("Starter", "remind@test.dev");
    await pay(orderId); await deliverOrder(env, orderId);
    await base.DB.prepare("UPDATE ev_orders SET paid_at = unixepoch() - 3 * 86400 WHERE order_id = ?").bind(orderId).run();
    await sweepEv(env); await sweepEv(env);
    expect(sent.filter((m) => /Waiting for Your List/.test(m.subject) && m.to.includes(email))).toHaveLength(1);
    const { orderId: o2, email: e2 } = await newVerificationOrder("Starter", "noremind@test.dev");
    await pay(o2); await deliverOrder(env, o2);
    const ev = (await getEvByOrder(getDbFromEnv(base), o2))!;
    await put(ev.id, ev, emails(10));
    await base.DB.prepare("UPDATE ev_orders SET paid_at = unixepoch() - 3 * 86400 WHERE order_id = ?").bind(o2).run();
    await sweepEv(env);
    expect(sent.filter((m) => /Waiting for Your List/.test(m.subject) && m.to.includes(e2))).toHaveLength(0);
  });
  it("files are deleted after the retention period, the order record stays", async () => {
    mockMail();
    const { orderId } = await newVerificationOrder("Starter", "purge@test.dev");
    await pay(orderId); await deliverOrder(env, orderId);
    const ev = (await getEvByOrder(getDbFromEnv(base), orderId))!;
    const r = await put(ev.id, ev, emails(20)) as { key: string };
    await base.DB.prepare("UPDATE ev_orders SET status = 'completed', completed_at = unixepoch() - 40 * 86400 WHERE id = ?").bind(ev.id).run();
    expect(await base.LISTS.head(r.key)).not.toBeNull();
    expect(await purgeExpired(env)).toBeGreaterThanOrEqual(1);
    expect(await base.LISTS.head(r.key)).toBeNull();
    expect((await q("SELECT COUNT(*) AS n FROM ev_orders WHERE id = ?", ev.id))!.n).toBe(1);
  });
});

describe("custom quotes", () => {
  it("saves first, deduplicates, and a failed email does not lose the request", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response("no", { status: 500 }));
    const r1 = await submitQuote(env, { turnstileToken: "x", name: "Pat Lee", email: "pat@test.dev", estimatedCount: "2,500,000", requirements: "CSV" });
    const r2 = await submitQuote(env, { turnstileToken: "x", name: "Pat Lee", email: "pat@test.dev", estimatedCount: "2,500,000", requirements: "CSV" });
    expect(r2).toMatchObject({ reference: r1.reference, duplicate: true });
    expect((await q("SELECT COUNT(*) AS n FROM ev_quotes WHERE email = 'pat@test.dev'"))!.n).toBe(1);
  });
});

describe("settings", () => {
  it("validates on save and loads defaults when nothing is stored", async () => {
    expect((await loadEvSettings(env)).packages).toHaveLength(6);
    expect(await saveEvSettings(env, { ...DEFAULT_EV, packages: [{ ...DEFAULT_EV.packages[0] }, { ...DEFAULT_EV.packages[0] }] }, "t")).toMatchObject({ ok: false });
    expect(await saveEvSettings(env, { ...DEFAULT_EV, maxUploadMb: 500 }, "t")).toMatchObject({ ok: false });
  });
});
