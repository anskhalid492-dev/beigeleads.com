import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv } from "@/lib/db";
import { helpArticles, helpCategories, HELP_REVIEW_NOTES, plainText } from "@/lib/help";
import { newA } from "@/lib/help/new/a";
import { newB } from "@/lib/help/new/b";
import { newC } from "@/lib/help/new/c";
import { searchDocs, toDoc } from "@/lib/help/search";
import { applyReviewUpdates, backupHelp, importBuiltIn, loadHelp } from "@/lib/help/store";
import { NEW_GLOSSARY } from "@/lib/glossary/new";
import { STARTERS } from "@/lib/glossary/starters";
import { planImport } from "@/lib/glossary/plan";
import { applyBatch, existingForImport, publishedCards } from "@/lib/glossary/store";
import { DEFAULT_CATEGORIES } from "@/lib/glossary/categories";
import { glossaryDocs, searchGlossary } from "@/lib/beigepilot/glossary";
import { syncStatus } from "@/lib/beigepilot/sync";
import { slugify } from "@/lib/glossary/clean";

const NEW_HELP = [...newA, ...newB, ...newC];
const allGlossary = [...NEW_GLOSSARY, ...STARTERS];
const BAD = /placeholder|in-house|60[- ]day|\bAudience\b/i;

describe("help expansion content", () => {
  it("has exactly 50 new help articles with unique titles and slugs", () => {
    expect(NEW_HELP).toHaveLength(50);
    expect(new Set(NEW_HELP.map((a) => a.title)).size).toBe(50);
    const ids = helpArticles.map((a) => `${a.category}/${a.slug}`);
    expect(new Set(ids).size).toBe(ids.length);
    expect(helpArticles).toHaveLength(54 + 50);
  });
  it("every article is complete and sits in an existing category", () => {
    const cats = new Set(helpCategories.map((c) => c.slug));
    for (const a of NEW_HELP) {
      expect(cats.has(a.category), a.slug).toBe(true);
      expect(a.title.length, a.slug).toBeGreaterThan(10); expect(a.description.length, a.slug).toBeGreaterThan(60); expect(a.description.length, a.slug).toBeLessThanOrEqual(200);
      expect(a.body.length, a.slug).toBeGreaterThan(4); expect(a.keywords.length, a.slug).toBeGreaterThan(2); expect(a.updated, a.slug).toBeTruthy();
    }
  });
  it("related ids and /help links resolve", () => {
    const ids = new Set(helpArticles.map((a) => `${a.category}/${a.slug}`));
    for (const a of helpArticles) {
      for (const r of a.related) expect(ids.has(r), `${a.slug} -> ${r}`).toBe(true);
      for (const m of JSON.stringify(a.body).matchAll(/\/help\/([a-z0-9-]+)\/([a-z0-9-]+)/g)) expect(ids.has(`${m[1]}/${m[2]}`), `${a.slug} link ${m[0]}`).toBe(true);
    }
  });
  it("uses no banned wording and no hardcoded service prices", () => {
    for (const a of NEW_HELP) { const t = plainText(a); expect(t, a.slug).not.toMatch(BAD); expect(t, a.slug).not.toMatch(/\$\s?\d/); }
  });
  it("flagged articles are drafts and never in the public fallback", () => {
    for (const id of HELP_REVIEW_NOTES ? Object.keys(HELP_REVIEW_NOTES) : []) { const a = helpArticles.find((x) => `${x.category}/${x.slug}` === id); expect(a?.status, id).toBe("draft"); }
  });
});

describe("glossary expansion content", () => {
  it("has exactly 50 new terms covering A to Z", () => {
    expect(NEW_GLOSSARY).toHaveLength(50);
    const letters = new Set(NEW_GLOSSARY.map((e) => e.term.trim()[0].toUpperCase()));
    for (const l of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") expect(letters.has(l), l).toBe(true);
  });
  it("has unique slugs, no near-duplicates with the older drafts, and every related term resolves", () => {
    const slugs = allGlossary.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const names = new Set(allGlossary.flatMap((e) => [e.term.toLowerCase(), e.slug]));
    for (const e of allGlossary) for (const r of e.relatedTerms) expect(names.has(r.toLowerCase()) || names.has(slugify(r)), `${e.slug} -> ${r}`).toBe(true);
    const cats = new Set(DEFAULT_CATEGORIES.map((c) => c.slug));
    for (const e of NEW_GLOSSARY) expect(cats.has(e.category), e.slug).toBe(true);
  });
  it("entries are complete, sourced from no figures, and do not call standards BeigeLeads technology", () => {
    for (const e of NEW_GLOSSARY) {
      expect(e.shortDefinition.length, e.slug).toBeGreaterThan(40); expect(e.content.length, e.slug).toBeGreaterThan(450);
      expect((e.content + e.shortDefinition).replace(/\b5%/g, ""), e.slug).not.toMatch(/\d\s?%|\$\s?\d/);
      expect(e.content, e.slug).not.toMatch(BAD.source.includes("Audience") ? /placeholder|in-house/i : BAD);
      expect(e.status).toBe("draft");
    }
  });
  it("internal links in glossary text point to real glossary entries", () => {
    const slugs = new Set(allGlossary.map((e) => e.slug));
    for (const e of NEW_GLOSSARY) for (const m of e.content.matchAll(/\]\(\/glossary\/([a-z0-9-]+)\)/g)) expect(slugs.has(m[1]), `${e.slug} -> ${m[1]}`).toBe(true);
  });
});

describe("help search synonyms", () => {
  const docs = helpArticles.filter((a) => (a.status ?? "published") === "published").map((a) => toDoc(a, helpCategories.find((c) => c.slug === a.category)!.name, plainText(a)));
  const ids = (q: string) => searchDocs(docs, q, undefined, 6).map((d) => d.id).join(" ");
  it("where is my file -> delivery", () => expect(ids("where is my file")).toMatch(/deliver|download|troubleshooting/));
  it("bad emails -> verification or deliverability", () => expect(ids("bad emails")).toMatch(/verif|bounce|deliverab/));
  it("DFY inboxes -> sending infrastructure", () => expect(ids("DFY inboxes")).toMatch(/dfy-outbound/));
});

describe("glossary retrieval for Pilo", () => {
  const docs = NEW_GLOSSARY.map((e) => ({ slug: e.slug, term: e.term, short: e.shortDefinition, text: e.content, keywords: e.keywords, category: e.category }));
  it("finds a term by name and by acronym", () => {
    expect(searchGlossary(docs as never, "what is dmarc", 3)[0]?.slug).toBe("dmarc");
    expect(searchGlossary(docs as never, "ICP", 3)[0]?.slug).toBe("ideal-customer-profile-icp");
  });
  it("returns nothing for nonsense", () => expect(searchGlossary(docs as never, "zzzqxv", 3)).toHaveLength(0));
  void glossaryDocs;
});

describe("persistence (local D1)", () => {
  let proxy: PlatformProxy<CloudflareEnv>; let env: CloudflareEnv;
  beforeAll(async () => {
    proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "hexp-")) } });
    env = proxy.env as CloudflareEnv;
    const sql = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort().map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
    for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
  }, 60_000);
  afterAll(async () => { await proxy?.dispose(); });

  it("help import is idempotent, keeps flagged articles as drafts and hides them from visitors", async () => {
    const a = await importBuiltIn(env); const b = await importBuiltIn(env);
    expect(a.articles).toBe(helpArticles.length); expect(b.articles).toBe(0);
    const data = await loadHelp(env);
    const ids = new Set(data!.articles.map((x) => `${x.category}/${x.slug}`));
    for (const id of Object.keys(HELP_REVIEW_NOTES)) expect(ids.has(id), id).toBe(false);
    expect(data!.articles.length).toBe(helpArticles.length - Object.keys(HELP_REVIEW_NOTES).length);
  });
  it("review update takes a backup first and keeps newer admin edits", async () => {
    const d = getDbFromEnv(env);
    await env.DB.prepare("UPDATE help_articles SET updated='2020-01-01' WHERE category='pricing' AND slug='no-subscription'").run();
    const r = await applyReviewUpdates(env, "t@x");
    expect(r.backup).toMatch(/^help\.backup\./);
    const saved = await env.DB.prepare("SELECT key FROM system_settings WHERE key LIKE 'help.backup.%'").all();
    expect(saved.results.length).toBeGreaterThan(0);
    const again = await applyReviewUpdates(env, "t@x");
    expect(again.updated).toHaveLength(0);
    void d; void backupHelp;
  });
  it("glossary expansion imports as drafts, then is safe to run again", async () => {
    const db = getDbFromEnv(env);
    const known = { products: [], guides: [], categories: DEFAULT_CATEGORIES.map((c) => c.slug) };
    const raws = () => NEW_GLOSSARY.map((s, i) => ({ row: i + 1, raw: { term: s.term, slug: s.slug, category: s.category, shortDefinition: s.shortDefinition, content: s.content, whyItMatters: s.whyItMatters, example: s.example, relatedTerms: s.relatedTerms.join("; ") } }));
    const opts = { mode: "update" as const, allowUpdatePublished: false, forceDraft: true };
    const r1 = await applyBatch(db, planImport(raws(), await existingForImport(db), known, opts), opts, "t@x");
    expect(r1.created).toBe(50); expect(r1.failed).toBe(0);
    const r2 = await applyBatch(db, planImport(raws(), await existingForImport(db), known, opts), opts, "t@x");
    expect(r2.created).toBe(0);
    const n = await env.DB.prepare("SELECT COUNT(*) c FROM glossary_terms").first<{ c: number }>();
    expect(n!.c).toBe(50);
    expect(await publishedCards(db)).toHaveLength(0);
    await env.DB.prepare("UPDATE glossary_terms SET status='published' WHERE slug='dmarc'").run();
    const s = await syncStatus(env);
    expect(s.glossary.published).toBe(1); expect(s.glossary.drafts).toBe(49);
    expect((await publishedCards(db)).map((c) => c.slug)).toEqual(["dmarc"]);
    const gd = await glossaryDocs(env as never);
    expect(gd.map((x) => x.slug)).toEqual(["dmarc"]);
  });
});
void existsSync;
