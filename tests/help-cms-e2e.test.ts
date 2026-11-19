// Help Center CMS against a LOCAL D1 + KV: fallback, import, publish rules, ordering, cache, analytics.
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv, schema } from "@/lib/db";
import { HelpError, deleteArticle, deleteCategory, moveArticle, saveArticle, saveCategory, setArticleStatus } from "@/lib/help/admin";
import { cleanSearch, purgeOldSearches, recordSearch, recordView, summary } from "@/lib/help/analytics";
import { cleanBlocks } from "@/lib/help/blocks";
import { recordFeedback } from "@/lib/help/feedback";
import { importBuiltIn, loadAll, loadHelp } from "@/lib/help/store";
import { articlesIn, groupedArticles } from "@/lib/help/data";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
const A = "tester@beigeleads.com";
const base = { category: "getting-started", slug: "my-new-article", title: "My new article", description: "A description that is long enough.", keywords: ["new"], body: [["p", "Hello **world**"]], related: [], group: "The basics", featured: false, common: false, status: "draft" as const, noindex: false };

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "help-e2e-")) } });
  env = proxy.env as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00(0[0-9]|1[0-9]|2[01])_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("body cleaning", () => {
  it("keeps valid blocks, drops unsafe images and junk", () => {
    const out = cleanBlocks([["h", " Title "], ["p", ""], ["img", "javascript:alert(1)", "x"], ["img", "/media/2026/a.webp", "alt", "cap"], ["img", "http://insecure.test/a.png", "x"], ["callout", "weird", "text"], ["table", ["A", "B"], [["1"], ["2", "3", "4"]]], ["faq", [["Q?", "A."], ["", "x"]]], ["nope", "x"], "bad"]);
    expect(out).toEqual([["h", "Title"], ["img", "/media/2026/a.webp", "alt", "cap"], ["callout", "tip", "text"], ["table", ["A", "B"], [["1", ""], ["2", "3"]]], ["faq", [["Q?", "A."]]]]);
  });
});

describe("help CMS", () => {
  it("falls back to the built-in content until imported", async () => {
    const d = await loadHelp(env);
    expect(d.source).toBe("code");
    expect(d.articles.length).toBeGreaterThan(40);
    expect(await loadAll(env)).toBeNull();
  });

  it("imports the built-in content once and keeps order, groups and picks", async () => {
    const first = await importBuiltIn(env);
    expect(first.categories).toBe(9);
    expect(first.articles).toBeGreaterThan(40);
    const again = await importBuiltIn(env);
    expect(again.articles).toBe(0);
    expect(again.skipped).toBe(first.articles);
    const d = await loadHelp(env);
    expect(d.source).toBe("database");
    expect(d.articles.length).toBe(first.articles);
    expect(d.articles.filter((a) => (a.featured ?? 0) > 0).length).toBe(6);
    expect(d.articles.filter((a) => (a.common ?? 0) > 0).length).toBe(8);
    const g = groupedArticles(articlesIn(d, "getting-started"));
    expect(g[0].title).toBe("The basics");
    expect(g[0].items[0].slug).toBe("what-is-beigeleads");
  });

  it("drafts stay private; publishing makes them public; empty bodies cannot be published", async () => {
    const { id, updatedAt } = await saveArticle(env, A, base);
    expect((await loadHelp(env)).articles.some((a) => a.slug === "my-new-article")).toBe(false);
    await expect(setArticleStatus(env, A, id, "published")).resolves.toBeUndefined();
    expect((await loadHelp(env)).articles.some((a) => a.slug === "my-new-article")).toBe(true);
    await setArticleStatus(env, A, id, "draft");
    expect((await loadHelp(env)).articles.some((a) => a.slug === "my-new-article")).toBe(false);
    await expect(saveArticle(env, A, { ...base, slug: "empty-one", body: [], status: "published" })).rejects.toThrow(HelpError);
    expect(updatedAt).toBeGreaterThan(0);
  });

  it("validation: duplicate slug, bad slug, button link, stale version, locked address", async () => {
    await expect(saveArticle(env, A, base)).rejects.toThrow(/already exists/);
    await expect(saveArticle(env, A, { ...base, slug: "Bad Slug" })).rejects.toThrow(HelpError);
    await expect(saveArticle(env, A, { ...base, slug: "btn", ctaLabel: "Go", ctaHref: "javascript:alert(1)" })).rejects.toThrow(/link/);
    await expect(saveArticle(env, A, { ...base, slug: "btn2", ctaLabel: "Go" })).rejects.toThrow(/both/);
    await expect(saveArticle(env, A, { ...base, category: "nope", slug: "x1" })).rejects.toThrow(/topic/);

    const all = (await loadAll(env))!;
    const mine = all.articles.find((a) => a.slug === "my-new-article")!;
    await expect(saveArticle(env, A, { ...base, id: mine.id, version: (mine.updatedAtMs ?? 0) - 5 })).rejects.toThrow(/changed somewhere else/);
    const ok = await saveArticle(env, A, { ...base, id: mine.id, version: mine.updatedAtMs, title: "Renamed", status: "published", featured: true });
    expect(ok.id).toBe(mine.id);
    const live = (await loadHelp(env)).articles.find((a) => a.id === mine.id)!;
    expect(live.title).toBe("Renamed");
    expect(live.featured).toBeGreaterThan(6); // appended after the existing picks
    await expect(saveArticle(env, A, { ...base, id: mine.id, slug: "other-slug", status: "published" })).rejects.toThrow(/Unpublish/);
  });

  it("ordering: move swaps neighbours; delete is permanent (the built-in copy does not return)", async () => {
    const before = articlesIn((await loadHelp(env)), "getting-started").map((a) => a.slug);
    const second = (await loadAll(env))!.articles.find((a) => a.slug === before[1])!;
    await moveArticle(env, A, second.id!, "up");
    const after = articlesIn((await loadHelp(env)), "getting-started").map((a) => a.slug);
    expect(after[0]).toBe(before[1]);
    expect(after[1]).toBe(before[0]);
    const victim = (await loadAll(env))!.articles.find((a) => a.slug === "what-is-beigeleads")!;
    await deleteArticle(env, A, victim.id!);
    const d = await loadHelp(env);
    expect(d.source).toBe("database");
    expect(d.articles.some((a) => a.slug === "what-is-beigeleads")).toBe(false);
    await importBuiltIn(env); // re-import adds the missing built-in article back only when asked
    expect((await loadHelp(env)).articles.some((a) => a.slug === "what-is-beigeleads")).toBe(true);
  });

  it("topics: hidden topic hides its articles; topics with articles cannot be deleted; new topic works", async () => {
    const cats = (await loadAll(env))!.categories;
    const c = cats.find((x) => x.slug === "pricing")!;
    await saveCategory(env, A, { id: c.id, slug: "pricing", name: c.name, description: c.description, icon: c.icon, status: "hidden" });
    const d = await loadHelp(env);
    expect(d.categories.some((x) => x.slug === "pricing")).toBe(false);
    expect(d.articles.some((a) => a.category === "pricing")).toBe(false);
    await expect(deleteCategory(env, A, c.id)).rejects.toThrow(/articles first/);
    await saveCategory(env, A, { id: c.id, slug: "pricing", name: c.name, description: c.description, icon: c.icon, status: "published" });
    await saveCategory(env, A, { slug: "extras", name: "Extras", description: "More", icon: "tag", status: "published" });
    await expect(saveCategory(env, A, { slug: "extras", name: "Extras again", description: "", icon: "tag", status: "published" })).rejects.toThrow(/already exists/);
    const extra = (await loadAll(env))!.categories.find((x) => x.slug === "extras")!;
    await deleteCategory(env, A, extra.id);
  });

  it("feedback only for published articles", async () => {
    await recordFeedback(env, "getting-started/how-beigeleads-works", true);
    await expect(recordFeedback(env, "getting-started/not-real", true)).rejects.toThrow();
  });
});

describe("help analytics", () => {
  it("refuses personal-looking searches and stores the rest", async () => {
    expect(cleanSearch("me@example.com")).toBeNull();
    expect(cleanSearch("call 415-555-1234 now")).toBeNull();
    expect(cleanSearch("https://x.test")).toBeNull();
    expect(cleanSearch("ab")).toBeNull();
    expect(cleanSearch("  Refund   Policy ")).toBe("refund policy");
    expect(await recordSearch(env, "refund policy", 3)).toBe(true);
    expect(await recordSearch(env, "refund policy", 3)).toBe(true);
    expect(await recordSearch(env, "unicorn leads", 0)).toBe(true);
    expect(await recordSearch(env, "a@b.co", 0)).toBe(false);
  });

  it("counts views per day and summarises", async () => {
    await recordView(env, "getting-started/how-beigeleads-works");
    await recordView(env, "getting-started/how-beigeleads-works");
    const s = await summary(env);
    expect(s.views30).toBe(2);
    expect(s.topViewed[0]).toEqual({ articleId: "getting-started/how-beigeleads-works", views: 2 });
    expect(s.searches30).toBe(3);
    expect(s.topSearches[0]).toMatchObject({ q: "refund policy", n: 2 });
    expect(s.noResults).toEqual([{ q: "unicorn leads", n: 1 }]);
    expect(s.feedback[0]).toMatchObject({ articleId: "getting-started/how-beigeleads-works", yes: 1, no: 0 });
  });

  it("deletes search rows older than 90 days", async () => {
    const db = getDbFromEnv(env);
    await db.insert(schema.helpSearchLog).values({ q: "ancient", results: 1, createdAt: new Date(Date.now() - 100 * 86400_000) });
    await purgeOldSearches(env);
    const rows = await db.select().from(schema.helpSearchLog);
    expect(rows.some((r) => r.q === "ancient")).toBe(false);
    expect(rows.length).toBe(3);
  });
});
