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
