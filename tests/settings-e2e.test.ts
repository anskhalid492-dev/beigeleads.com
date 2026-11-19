// System settings service against a LOCAL D1 + KV (wrangler emulator).
import { readFileSync, readdirSync } from "node:fs";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getPublicSettings, listAudit, loadCategory, saveCategory, SettingsError } from "@/lib/settings/service";
import { parseValue, defOf } from "@/lib/settings/registry";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
const A = "admin@t.dev";

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ persist: false });
  env = proxy.env;
  const files = readdirSync("drizzle").filter((f) => /^0016/.test(f) && f.endsWith(".sql"));
  const sql = files.map((f) => readFileSync(`drizzle/${f}`, "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const s of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.exec(s.replace(/\s+/g, " ") + ";");
});
afterAll(async () => { await proxy.dispose(); });

describe("setting validation", () => {
  it("rejects bad links, long text, bad booleans", () => {
    const link = defOf("bannerLink")!;
    expect(parseValue(link, "/sample")).toBe("/sample");
    expect(parseValue(link, "https://x.test/a")).toBe("https://x.test/a");
    for (const bad of ["javascript:alert(1)", "//evil.com", "http://x.test", "/a b"]) expect(() => parseValue(link, bad)).toThrow();
    expect(() => parseValue(defOf("siteName")!, "x".repeat(61))).toThrow();
    expect(() => parseValue(defOf("bannerEnabled")!, "yes")).toThrow();
  });
});

describe("settings service", () => {
  it("loads defaults, saves, audits, detects conflicts, clears the public cache", async () => {
    const first = await loadCategory(env, "general");
    expect(first.ready).toBe(true);
    expect(first.values.siteName).toBe("BeigeLeads");
    expect((await getPublicSettings(env)).banner).toBeNull();

    await expect(saveCategory(env, A, "general", { bannerEnabled: "true", bannerText: "" }, first.stamp)).rejects.toThrow(/banner text/);
    await expect(saveCategory(env, A, "general", { bannerLink: "javascript:x" }, first.stamp)).rejects.toThrow(SettingsError);

    const r = await saveCategory(env, A, "general", { siteName: "Acme", bannerEnabled: "true", bannerText: "Hello", bannerLink: "/sample" }, first.stamp);
    expect(r.changed).toBe(4);
    const after = await loadCategory(env, "general");
    expect(after.values.siteName).toBe("Acme");
    expect(await getPublicSettings(env)).toEqual({ siteName: "Acme", banner: { text: "Hello", href: "/sample" } });

    // A second admin still holding the old stamp must not overwrite.
    await new Promise((r) => setTimeout(r, 1100));
    await saveCategory(env, A, "general", { bannerText: "Second" }, after.stamp);
    await expect(saveCategory(env, "b@t.dev", "general", { bannerText: "Third" }, after.stamp)).rejects.toMatchObject({ conflict: true });

    // No change = no audit rows. Failed saves are not logged as saved.
    const cur = await loadCategory(env, "general");
    expect((await saveCategory(env, A, "general", { bannerText: "Second" }, cur.stamp)).changed).toBe(0);
    const log = await listAudit(env, { category: "general" });
    expect(log.total).toBe(5);
    expect(log.rows.some((x) => x.settingKey === "bannerText" && x.oldValue === "Hello" && x.newValue === "Second")).toBe(true);
    expect((await listAudit(env, { q: "b@t.dev" })).total).toBe(0);
  });
});

describe("email settings", () => {
  it("validates sender name and recipient lists", () => {
    expect(() => parseValue(defOf("senderName")!, 'Evil <x@y.z>')).toThrow();
    expect(() => parseValue(defOf("replyTo")!, "not-an-email")).toThrow();
    expect(parseValue(defOf("replyTo")!, " Help@Test.dev ")).toBe("help@test.dev");
    expect(parseValue(defOf("extraRecipients")!, "a@t.dev, A@t.dev, b@t.dev")).toBe("a@t.dev, b@t.dev");
    expect(() => parseValue(defOf("extraRecipients")!, "a@t.dev,b@t.dev,c@t.dev,d@t.dev,e@t.dev,f@t.dev")).toThrow(/at most 5/);
    expect(() => parseValue(defOf("extraRecipients")!, "bad")).toThrow(/not a valid/);
  });
  it("applies toggles and extra recipients, never to payment alerts", async () => {
    const { ownerRecipients, sendEmailDetailed } = await import("@/lib/forms/email");
    const e = { DB: env.DB, CACHE: env.CACHE, NOTIFY_EMAIL: "owner@t.dev" } as unknown as CloudflareEnv;
    expect(await ownerRecipients(e)).toBe("owner@t.dev");
    expect(await ownerRecipients(e, "sample")).toBe("owner@t.dev");
    const cur = await loadCategory(env, "email");
    await saveCategory(env, A, "email", { extraRecipients: "team@t.dev", notifyContact: "false", senderName: "Acme Data" }, cur.stamp);
    expect(await ownerRecipients(e, "sample")).toBe("owner@t.dev,team@t.dev");
    expect(await ownerRecipients(e, "custom_list")).toBe("owner@t.dev,team@t.dev");
    expect(await ownerRecipients(e, "contact")).toBeUndefined(); // switched off
    expect(await ownerRecipients(e, "delivered")).toBe("owner@t.dev"); // extras never get delivery alerts
    expect(await ownerRecipients(e)).toBe("owner@t.dev"); // payment-type alerts: owner only, no toggle
    expect(await sendEmailDetailed(e, { to: "x@t.dev", subject: "s", text: "t" })).toMatchObject({ ok: false, status: 0 });
    expect(await ownerRecipients({ DB: env.DB, CACHE: env.CACHE } as unknown as CloudflareEnv, "sample")).toBeUndefined();
  });
});

describe("health checks", () => {
  it("really talk to D1 and KV, and report missing tables", async () => {
    const { runCheck, rememberCheck, lastChecks } = await import("@/lib/settings/health");
    const d = await runCheck(env, "d1");
    expect(d.ok).toBe(false); // this test DB only has the 0016 tables
    expect(d.detail).toMatch(/missing/);
    const k = await runCheck(env, "kv");
    expect(k.ok).toBe(true);
    await rememberCheck(env, k);
    expect((await lastChecks(env)).kv?.ok).toBe(true);
    expect((await runCheck({ ...env, RESEND_API_KEY: undefined } as unknown as CloudflareEnv, "resend")).ok).toBe(false);
  });
});
