// Case studies share the blog CMS (kind = "case"). Content checks + the real code against a local D1 + R2.
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { headingsOf, linksOf, plainText } from "@/lib/blog/doc";
import { KINDS, adminOnly, asKind, catHref } from "@/lib/blog/kind";
import { mdToDoc } from "@/lib/blog/markdown";
import { getPublishedBySlug, listPublished, publishedCategories, publishedSitemap, transition } from "@/lib/blog/posts";
import { createFromStarter } from "@/lib/blog/starter-create";
import { CASE_STUDY_STARTERS } from "@/lib/blog/case-study-starters";
import { listCategories } from "@/lib/blog/taxonomy";
import { getCategories, getProducts } from "@/lib/catalog";
import { isIllustrative } from "@/lib/case-studies";
import { legalDocs } from "@/lib/legal/docs";
import { solutions } from "@/lib/solutions";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
const C = CASE_STUDY_STARTERS;

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "cases-e2e-")) } });
  env = proxy.env;
  const files = readdirSync("drizzle").filter((f) => /^000[78]|^0010|^0012|^0013|^0026/.test(f) && f.endsWith(".sql")).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("kind helpers", () => {
  it("knows the three kinds and keeps case studies admin-only", () => {
    expect(asKind("case")).toBe("case");
    expect(asKind("guide")).toBe("guide");
    expect(asKind("nonsense")).toBe("blog");
    expect(KINDS.case.pub).toBe("/case-studies");
    expect(KINDS.case.admin).toBe("/admin/case-studies");
    expect(adminOnly("case")).toBe(true);
    expect(adminOnly("blog")).toBe(false);
    expect(catHref("case", "x")).toBe("/case-studies?category=x");
    expect(catHref("blog", "x")).toBe("/blog/category/x");
  });
});

describe("the three case studies", () => {
  it("are the three requested titles with unique slugs and SEO fields in range", () => {
    expect(C.map((c) => c.title)).toEqual([
      "How Targeted Business Data Can Improve Agency Prospecting",
      "Using Geographic Segmentation to Build More Relevant B2B Campaigns",
      "From Broad Contact Lists to Focused Sales Prospecting",
    ]);
    expect(new Set(C.map((c) => c.slug)).size).toBe(3);
    for (const c of C) {
      expect(c.kind).toBe("case");
      expect(c.seoTitle.length).toBeLessThanOrEqual(60);
      expect(c.metaDescription.length).toBeGreaterThanOrEqual(120);
      expect(c.metaDescription.length).toBeLessThanOrEqual(160);
      expect(c.featuredAlt.length).toBeGreaterThan(30);
    }
    expect(new Set(C.map((c) => c.seoTitle)).size).toBe(3);
    expect(new Set(C.map((c) => c.metaDescription)).size).toBe(3);
  });
  it("are labelled illustrative at the top and invent no results, customers or money", () => {
    for (const c of C) {
      const d = mdToDoc(c.markdown);
      expect(c.markdown.trimStart().startsWith(":::info")).toBe(true);
      expect(c.markdown).toMatch(/Illustrative use case/);
      const t = plainText(d);
      expect(t).not.toMatch(/marketplace/i);
      expect(t).not.toMatch(/\d+\s?%/);
      expect(t).not.toMatch(/\$\s?\d/);
      expect(t).not.toMatch(/\b(roi|testimonial says|increased (revenue|sales)|case study with)\b/i);
      expect(isIllustrative(c.slug)).toBe(true);
    }
  });
  it("have the required sections, enough substance and only working internal links", () => {
    const cats = getCategories().map((x) => `/lists/${x.slug}`);
    const prods = getProducts().map((p) => `/lists/${p.slug}`);
    const known = new Set(["/lists", "/sample", "/verification", "/data-sources", "/guides/b2b-lead-generation-guide", "/guides/build-b2b-email-list-by-country-state-city", "/lists/dentists/united-states", "/lists/germany-business-email-lists", ...cats, ...prods, ...solutions.map((s) => `/solutions/${s.slug}`), ...legalDocs.map((d) => `/legal/${d.slug}`)]);
    for (const c of C) {
      const d = mdToDoc(c.markdown);
      const h2 = headingsOf(d).filter((h) => h.level === 2).map((h) => h.text);
      for (const need of [/Background/i, /challenge/i, /data strategy/i, /Implementation/i, /Results and lessons/i, /Key takeaways/i, /Related BeigeLeads/i]) expect(h2.some((x) => need.test(x)), `${c.slug} ${need}`).toBe(true);
      const words = plainText(d).split(/\s+/).filter(Boolean).length;
      expect(words).toBeGreaterThanOrEqual(1300);
      expect(words).toBeLessThanOrEqual(2600);
      const links = linksOf(d).filter((l) => l.startsWith("/"));
      for (const l of links) expect(known.has(l), `${c.slug} -> ${l}`).toBe(true);
      expect(links).toContain("/lists");
      expect(links.some((l) => l.startsWith("/lists/"))).toBe(true);
    }
  });
  it("have a real 16:9 cover image file each", () => {
    for (const c of C) {
      const f = join("public", c.brandImage!);
      expect(existsSync(f), f).toBe(true);
      expect(statSync(f).size).toBeGreaterThan(5_000);
      expect(statSync(f).size).toBeLessThan(250_000);
    }
    expect(new Set(C.map((c) => c.brandImage)).size).toBe(3);
  });
});

describe("case study kind separation (local D1)", () => {
  it("creates drafts with their own categories, publishes them, and keeps them out of blog and guides", async () => {
    for (const c of C) {
      const id = await createFromStarter(env, "t@x.com", c.slug, null);
      expect(id).toBeGreaterThan(0);
    }
    expect((await listCategories(env, "case")).map((x) => x.name).sort()).toEqual(["Geographic Segmentation", "Marketing Agencies", "Sales Prospecting"]);
    expect((await listCategories(env, "blog")).length).toBe(0);
    for (const c of C) {
      const row = (await env.DB.prepare("SELECT id FROM blog_posts WHERE slug = ?").bind(c.slug).first()) as { id: number };
      await transition(env, "t@x.com", row.id, "publish");
    }
    expect((await listPublished(env, { kind: "case", page: 1, per: 10 })).total).toBe(3);
    expect((await listPublished(env, { kind: "blog", page: 1, per: 10 })).total).toBe(0);
    expect((await listPublished(env, { kind: "guide", page: 1, per: 10 })).total).toBe(0);
    expect(await getPublishedBySlug(env, C[0].slug, "case")).not.toBeNull();
    expect(await getPublishedBySlug(env, C[0].slug, "blog")).toBeNull();
    expect((await publishedCategories(env, "case")).length).toBe(3);
    const sm = await publishedSitemap(env);
    expect(sm.filter((p) => p.kind === "case")).toHaveLength(3);
  });
  it("search finds a case study by title words", async () => {
    const r = await listPublished(env, { kind: "case", q: "Geographic", page: 1, per: 10 });
    expect(r.cards.map((c) => c.slug)).toContain("geographic-segmentation-for-b2b-campaigns");
  });
});
