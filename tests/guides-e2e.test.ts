// Guides share the blog CMS (kind = "guide"). Runs the real code against a local D1 + R2.
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { headingsOf, linksOf, plainText } from "@/lib/blog/doc";
import { faqOf } from "@/lib/blog/faq";
import { mdToDoc } from "@/lib/blog/markdown";
import { createPost, getPublishedBySlug, listPublished, publishedCategories, publishedSitemap, transition } from "@/lib/blog/posts";
import { createFromStarter } from "@/lib/blog/starter-create";
import { GUIDE_STARTERS } from "@/lib/blog/guide-starters";
import { listCategories } from "@/lib/blog/taxonomy";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
const G = GUIDE_STARTERS[0];
const doc = mdToDoc(G.markdown);

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "guides-e2e-")) } });
  env = proxy.env;
  const files = readdirSync("drizzle").filter((f) => /^000[78]|^0010|^0012|^0013|^0026/.test(f) && f.endsWith(".sql")).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("first guide content", () => {
  it("has the 14 requested sections in order", () => {
    const h2 = headingsOf(doc).filter((h) => h.level === 2).map((h) => h.text);
    expect(h2).toHaveLength(14);
    expect(h2[0]).toMatch(/What is B2B lead generation/i);
    expect(h2[13]).toMatch(/Frequently Asked Questions/i);
  });
  it("is 2,500 to 3,500 words and has 7-8 FAQs", () => {
    const words = plainText(doc).split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThanOrEqual(2500);
    expect(words).toBeLessThanOrEqual(3500);
    const faq = faqOf(doc);
    expect(faq.length).toBeGreaterThanOrEqual(7);
    expect(faq.length).toBeLessThanOrEqual(8);
    expect(faq.every((f) => f.a.length > 40)).toBe(true);
  });
  it("links to products, the Help Center and the custom list builder, and never says marketplace", () => {
    const links = linksOf(doc);
    expect(links).toContain("/custom-list");
    expect(links.some((l) => l.startsWith("/help/"))).toBe(true);
    expect(links).toContain("/lists");
    expect(plainText(doc)).not.toMatch(/marketplace/i);
  });
  it("has SEO fields in range", () => {
    expect(G.slug).toBe("b2b-lead-generation-guide");
    expect(G.seoTitle.length).toBeLessThanOrEqual(60);
    expect(G.metaDescription.length).toBeGreaterThanOrEqual(120);
    expect(G.metaDescription.length).toBeLessThanOrEqual(160);
  });
});

describe("guide kind separation", () => {
  it("creates a guide draft with its own category and an uploaded brand image, then publishes it", async () => {
    const id = await createFromStarter(env, "t@x.com", G.slug, null);
    expect(id).toBeGreaterThan(0);
    expect((await listCategories(env, "guide")).some((c) => c.slug === "lead-generation")).toBe(true);
    expect((await listCategories(env, "blog")).some((c) => c.slug === "lead-generation")).toBe(false);
  });
  it("shows the guide only under kind=guide", async () => {
    const row = (await env.DB.prepare("SELECT id FROM blog_posts WHERE slug = ?").bind(G.slug).first()) as { id: number };
    await transition(env, "t@x.com", row.id, "publish");
    expect(await getPublishedBySlug(env, G.slug, "guide")).not.toBeNull();
    expect(await getPublishedBySlug(env, G.slug)).toBeNull();
    expect((await listPublished(env, { kind: "guide", page: 1, per: 10 })).total).toBe(1);
    expect((await listPublished(env, { kind: "blog", page: 1, per: 10 })).total).toBe(0);
    expect((await publishedCategories(env, "guide")).length).toBe(1);
    expect((await publishedSitemap(env)).find((p) => p.slug === G.slug)?.kind).toBe("guide");
  });
  it("a blog post created normally stays a blog post", async () => {
    const id = await createPost(env, "t@x.com", "Plain article");
    const r = (await env.DB.prepare("SELECT kind FROM blog_posts WHERE id = ?").bind(id).first()) as { kind: string };
    expect(r.kind).toBe("blog");
  });
});
