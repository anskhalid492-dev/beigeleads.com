// SEO settings + overview against a LOCAL D1 (wrangler emulator).
import { readFileSync, readdirSync } from "node:fs";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPost } from "@/lib/blog/posts";
import { SEO_DEFAULTS, getSeoSettings, saveSeoSettings } from "@/lib/seo/settings";
import { seoOverview, seoPostRows } from "@/lib/seo/overview";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ persist: false });
  env = proxy.env;
  const files = readdirSync("drizzle").filter((f) => /^000[78]|^0010|^0012|^0013|^0014/.test(f) && f.endsWith(".sql")).sort();
  const sql = files.map((f) => readFileSync(`drizzle/${f}`, "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const s of sql.split(";").map((x) => x.trim()).filter(Boolean)) { try { await env.DB.exec(s.replace(/\s+/g, " ") + ";"); } catch { /* table from another migration */ } }
});
afterAll(async () => { await proxy.dispose(); });

describe("seo settings", () => {
  it("falls back to defaults, saves, and rejects unsafe URLs", async () => {
    expect(await getSeoSettings(env)).toEqual(SEO_DEFAULTS);
    await saveSeoSettings(env, "a@t.dev", { siteName: "Acme", defaultDescription: "", defaultOgImage: "https://x.test/a.png", twitterSite: "acme" });
    const s = await getSeoSettings(env);
    expect(s.siteName).toBe("Acme");
    expect(s.twitterSite).toBe("@acme");
    expect(s.defaultDescription).toBe(SEO_DEFAULTS.defaultDescription); // empty = default
    await expect(saveSeoSettings(env, "a@t.dev", { ...s, defaultOgImage: "javascript:alert(1)" })).rejects.toThrow();
  });
});

describe("seo overview", () => {
  it("counts real gaps in published articles only", async () => {
    const a = await createPost(env, "a@t.dev", "One");
    expect(a).toBeTruthy();
    const rows = await seoPostRows(env);
    expect(rows.length).toBeGreaterThan(0);
    const o = await seoOverview(env);
    expect(o.total).toBe(rows.length);
    expect(o.published).toBe(0);
    expect(o.noMeta).toBe(0); // drafts are not counted
  });
});
