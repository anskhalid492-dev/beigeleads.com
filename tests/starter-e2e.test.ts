// The starter article goes through the real CMS code against a local D1 + R2.
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanDoc, headingsOf, linksOf, plainText } from "@/lib/blog/doc";
import { createAuthor, getPublicAuthorById } from "@/lib/blog/authors";
import { mdToDoc } from "@/lib/blog/markdown";
import { getPostForEdit, getPublishedBySlug, listPublished, transition } from "@/lib/blog/posts";
import { createFromStarter } from "@/lib/blog/starter-create";
import { STARTERS } from "@/lib/blog/starters";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
const S = STARTERS[0];

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "starter-e2e-")) } });
  env = proxy.env;
  const files = readdirSync("drizzle").filter((f) => /^000[78]|^0010/.test(f) && f.endsWith(".sql")).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("markdown converter", () => {
  it("builds headings, lists, tables, callouts and marks", () => {
    const d = mdToDoc("## A\n\nHello **bold** and [x](/lists) and *it*.\n\n- one\n- two\n\n1. a\n2. b\n\n:::tip\nNote\n:::\n\n| H1 | H2 |\n|---|---|\n| a | b |");
    const types = d.content!.map((n) => n.type);
    expect(types).toEqual(["heading", "paragraph", "bulletList", "orderedList", "callout", "table"]);
    expect(d.content![5].content).toHaveLength(2); // header row + one body row
    expect(linksOf(d)).toEqual(["/lists"]);
  });
  it("survives the CMS allow-list cleaner unchanged in structure", () => {
    const d = mdToDoc(S.markdown);
    const c = cleanDoc(d);
    expect(headingsOf(c).length).toBe(headingsOf(d).length);
    expect(plainText(c).length).toBeGreaterThan(plainText(d).length * 0.99);
  });
});

describe("starter article content", () => {
  const doc = mdToDoc(S.markdown);
  it("is 1,800 to 2,500 words", () => {
    const words = plainText(doc).split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThanOrEqual(1800);
    expect(words).toBeLessThanOrEqual(2500);
  });
  it("has SEO fields within sensible limits", () => {
    expect(S.seoTitle.length).toBeLessThanOrEqual(60);
    expect(S.metaDescription.length).toBeGreaterThanOrEqual(120);
    expect(S.metaDescription.length).toBeLessThanOrEqual(160);
    expect(S.excerpt.length).toBeLessThanOrEqual(500);
    expect(S.slug).toBe("how-to-build-a-b2b-email-list");
  });
  it("has one logical heading outline (H2/H3 only, FAQ and conclusion present)", () => {
    const h = headingsOf(doc);
    expect(h.every((x) => x.level === 2 || x.level === 3)).toBe(true);
    const names = h.map((x) => x.text);
    expect(names).toContain("Frequently asked questions");
    expect(names).toContain("Conclusion");
  });
  it("every internal link points at a real route", () => {
    const legal = readFileSync("lib/legal/docs.ts", "utf8");
    for (const href of linksOf(doc).filter((l) => l.startsWith("/"))) {
      const [a, b] = href.slice(1).split("/");
      if (a === "legal") expect(legal).toContain(`slug: "${b}"`);
      else expect(existsSync(join("app", a, "page.tsx")), href).toBe(true);
    }
  });
  it("never says marketplace and uses no placeholder text", () => {
    const t = plainText(doc).toLowerCase();
    expect(t).not.toContain("marketplace");
    expect(t).not.toMatch(/lorem|todo|tbd|\[to confirm/);
  });
});

describe("starter article through the CMS", () => {
  let id = 0, authorId = 0;
  it("creates a draft with category, tags, SEO and author; drafts are not public", async () => {
    const a = await createAuthor(env, "a@t.dev", { fullName: "Pat Doe", displayName: "Pat Doe", slug: "pat-doe", title: "Editor", email: "", shortBio: "", fullBio: "", expertise: [], company: "", location: "", photo: null, links: { linkedin: "", twitter: "", website: "", github: "", other: "" }, seoTitle: "", metaDescription: "", ogImage: null, canonicalUrl: "", noindex: false, status: "published" });
    authorId = a.id;
    id = await createFromStarter(env, "a@t.dev", S.slug, authorId);
    const p = await getPostForEdit(env, id);
    expect(p?.row.status).toBe("draft");
    expect(p?.row.seoTitle).toBe(S.seoTitle);
    expect(p?.row.authorId).toBe(authorId);
    expect(p?.row.categoryId).not.toBeNull();
    expect(p?.tagIds.length).toBe(S.tags.length);
    expect(p?.row.readingMinutes).toBeGreaterThan(5);
    expect(await getPublishedBySlug(env, S.slug)).toBeNull();
  });
  it("refuses a second copy", async () => {
    await expect(createFromStarter(env, "a@t.dev", S.slug, null)).rejects.toThrow(/already exists/);
  });
  it("publishes and appears on the public route, listing and author page", async () => {
    await transition(env, "a@t.dev", id, "publish");
    const pub = await getPublishedBySlug(env, S.slug);
    expect(pub?.row.title).toBe(S.title);
    expect(headingsOf(pub!.doc).length).toBeGreaterThan(10);
    expect((await listPublished(env, {})).cards[0].slug).toBe(S.slug);
    expect((await listPublished(env, { authorId })).cards[0].author).toBe("Pat Doe");
    expect((await getPublicAuthorById(env, authorId))?.name).toBe("Pat Doe");
  });
});
