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
  const files = readdirSync("drizzle").filter((f) => /^000[78]|^0010|^0012|^0013|^0014|^0015|^0017/.test(f) && f.endsWith(".sql")).sort();
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

describe("redirects + sitemap exclusions", () => {
  it("saves, blocks loops and duplicates, syncs KV, toggles and deletes", async () => {
    const { saveRedirect, listRedirects, setRedirectEnabled, deleteRedirect, REDIRECT_KV_KEY } = await import("@/lib/seo/redirects");
    await saveRedirect(env, "a@t.dev", { from: "/blog/old", to: "/blog/new", status: 301 });
    const kv = await env.CACHE.get(REDIRECT_KV_KEY, "json") as Record<string, [string, number]>;
    expect(kv["/blog/old"]).toEqual(["/blog/new", 301]);
    await expect(saveRedirect(env, "a@t.dev", { from: "/blog/new", to: "/blog/old", status: 301 })).rejects.toThrow(/loop/);
    await expect(saveRedirect(env, "a@t.dev", { from: "/blog/old", to: "/x", status: 301 })).rejects.toThrow(/already exists/);
    const [r] = await listRedirects(env);
    await setRedirectEnabled(env, "a@t.dev", r.id, false);
    expect(((await env.CACHE.get(REDIRECT_KV_KEY, "json")) as Record<string, unknown>)["/blog/old"]).toBeUndefined();
    await deleteRedirect(env, r.id);
    expect(await listRedirects(env)).toHaveLength(0);
  });
  it("excludes and re-includes sitemap paths", async () => {
    const { excludePath, includePath, excludedSitemapPaths } = await import("@/lib/seo/sitemap");
    await excludePath(env, "a@t.dev", "/compare/x/");
    expect((await excludedSitemapPaths(env)).has("/compare/x")).toBe(true);
    await expect(excludePath(env, "a@t.dev", "nope")).rejects.toThrow();
    await includePath(env, "/compare/x");
    expect((await excludedSitemapPaths(env)).size).toBe(0);
  });
});

describe("page SEO overrides", () => {
  it("validates, saves, syncs KV, rejects unknown pages, resets", async () => {
    const { savePageOverride, resetPageOverride, PAGE_SEO_KV_KEY, PageSeoError } = await import("@/lib/seo/page-overrides");
    const v = { seoTitle: "A new home title", metaDescription: "Desc", ogTitle: "", ogDescription: "", ogImage: "", canonicalUrl: "" };
    await savePageOverride(env, "a@t.dev", "/", v);
    const kv = await env.CACHE.get(PAGE_SEO_KV_KEY, "json") as Record<string, { t: string; d: string }>;
    expect(kv["/"]).toMatchObject({ t: "A new home title", d: "Desc" });
    await expect(savePageOverride(env, "a@t.dev", "/not-a-page", v)).rejects.toThrow(PageSeoError);
    await expect(savePageOverride(env, "a@t.dev", "/", { ...v, ogImage: "javascript:x" })).rejects.toThrow(PageSeoError);
    await expect(savePageOverride(env, "a@t.dev", "/", { ...v, seoTitle: "x".repeat(71) })).rejects.toThrow(/70/);
    await resetPageOverride(env, "a@t.dev", "/");
    expect(((await env.CACHE.get(PAGE_SEO_KV_KEY, "json")) as Record<string, unknown>)["/"]).toBeUndefined();
  });
});
