// Promotions admin: validation, time zones, create/duplicate/delete rules, stats (real numbers, test payments excluded).
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv } from "@/lib/db";
import { PromoError, createPromo, deletePromo, duplicatePromo, epochToZoned, loadStats, promoInput, setPromoStatus, toRow, updatePromo, zonedToEpoch } from "@/lib/promos/admin";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "promos-admin-")) } });
  env = proxy.env as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

const db = () => getDbFromEnv(env);
const base = { name: "Welcome", title: "Save 20%", kind: "percent", value: "20", mode: "code", code: "welcome20" };
const parse = (o: Record<string, unknown> = {}) => promoInput.parse({ ...base, ...o });

describe("validation", () => {
  it("normalises codes and converts dollars to cents", () => {
    const r = toRow(parse({ kind: "fixed", value: "25", minCart: "200", maxDiscount: "50" }));
    expect(r).toMatchObject({ code: "WELCOME20", kind: "fixed", value: 2500, minCartCents: 20000, maxDiscountCents: 5000 });
  });
  it.each([
    [{ value: "0" }, /above zero/],
    [{ value: "101" }, /1 to 100/],
    [{ value: "12.5" }, /whole number/],
    [{ code: "a" }, /3-30/],
    [{ code: "PARTNER-ABCD-EFGH" }, /reserved/],
    [{ productSlugs: ["nope"] }, /not a list/],
    [{ categorySlugs: ["nope"] }, /not an industry/],
    [{ packageNames: ["Gold"] }, /not a package/],
    [{ startsLocal: "2026-12-02T09:00", endsLocal: "2026-12-01T09:00" }, /after the start/],
    [{ mode: "automatic", eligibility: "partners" }, /needs a code/],
  ])("rejects %j", (o, msg) => { expect(() => toRow(parse(o as Record<string, unknown>))).toThrow(msg); });
  it("an automatic promotion stores no code", () => { expect(toRow(parse({ mode: "automatic", code: "IGNORED" })).code).toBeNull(); });
  it("time zones round-trip, including a DST date", () => {
    const t = zonedToEpoch("2026-07-01T09:00", "America/New_York"); // EDT = UTC-4
    expect(new Date(t * 1000).toISOString()).toBe("2026-07-01T13:00:00.000Z");
    expect(epochToZoned(t, "America/New_York")).toBe("2026-07-01T09:00");
    expect(new Date(zonedToEpoch("2026-12-01T09:00", "Asia/Karachi") * 1000).toISOString()).toBe("2026-12-01T04:00:00.000Z");
    expect(() => zonedToEpoch("nonsense", "UTC")).toThrow(PromoError);
  });
});

describe("lifecycle", () => {
  it("create, edit, duplicate (draft, no code), unique codes, delete guard, stats", async () => {
    const id = await createPromo(db(), parse());
    await expect(createPromo(db(), parse({ name: "Other" }))).rejects.toThrow(/already uses that code/);
    await updatePromo(db(), id, parse({ value: "30", status: "active" }));
    const [row] = (await env.DB.prepare("SELECT * FROM promotions WHERE id = ?").bind(id).all()).results as { value: number; status: string }[];
    expect(row).toMatchObject({ value: 30, status: "active" });
    // Editing the same promotion with its own code is allowed.
    await expect(updatePromo(db(), id, parse({ status: "active" }))).resolves.toBeUndefined();

    const copy = await duplicatePromo(db(), id);
    const c = (await env.DB.prepare("SELECT * FROM promotions WHERE id = ?").bind(copy).first()) as { code: string | null; status: string; name: string };
    expect(c).toMatchObject({ code: null, status: "draft", name: "Welcome (copy)" });

    await setPromoStatus(db(), id, "paused");
    // A used promotion cannot be deleted; an unused one can.
    await env.DB.prepare("INSERT INTO promotion_redemptions (promotion_id, order_id, email, code, discount_cents, order_total_cents, status, redeemed_at) VALUES (?,?,?,?,?,?,?,?)").bind(id, "o1", "a@b.co", "WELCOME20", 6000, 23920, "redeemed", Math.floor(Date.now() / 1000)).run();
    await expect(deletePromo(db(), id)).rejects.toThrow(/history is kept/);
    await deletePromo(db(), copy);
    expect(await env.DB.prepare("SELECT id FROM promotions WHERE id = ?").bind(copy).first()).toBeNull();
  });

  it("stats count only real-money paid redemptions and report test payments separately", async () => {
    const id = (await env.DB.prepare("SELECT id FROM promotions WHERE code = 'WELCOME20'").first<{ id: number }>())!.id;
    // o1 (above) has no paid attempt yet -> not counted. Give it a mainnet paid attempt; add a testnet one.
    const att = (o: string, net: string) => env.DB.prepare("INSERT INTO payment_attempts (order_id, coin, network, address, expected_amount, locked_rate, expires_at, status) VALUES (?,?,?,?,?,?,?, 'paid')").bind(o, "BTC", net, "addr", "0.001", "60000", Math.floor(Date.now() / 1000)).run();
    for (const o of ["o1", "o2"]) await env.DB.prepare("INSERT INTO orders (id, email, status, total_usd_cents) VALUES (?, 'x@y.co', 'paid', 100)").bind(o).run();
    await att("o1", "mainnet");
    await env.DB.prepare("INSERT INTO promotion_redemptions (promotion_id, order_id, email, code, discount_cents, order_total_cents, status, redeemed_at) VALUES (?,?,?,?,?,?,?,?)").bind(id, "o2", "c@d.co", "WELCOME20", 100, 900, "redeemed", Math.floor(Date.now() / 1000)).run();
    await att("o2", "testnet");
    const s = (await loadStats(db()))!;
    const mine = s.rows.find((r) => r.promo.id === id)!;
    expect(mine.uses).toBe(1);
    expect(mine.discountCents).toBe(6000);
    expect(mine.revenueCents).toBe(23920);
    expect(s.redemptions).toBe(1);
    expect(s.testExcluded).toBe(1);
    expect(s.top[0]).toMatchObject({ code: "WELCOME20", uses: 1 });
    // Date filter in the far future excludes everything.
    expect((await loadStats(db(), { from: Math.floor(Date.now() / 1000) + 86400 }))!.redemptions).toBe(0);
  });
});
