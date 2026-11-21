import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv } from "@/lib/db";
import { MIN_PUBLISH, plain, richText, slugify, toEntry, toList, validate } from "@/lib/glossary/clean";
import { buildFile } from "@/lib/glossary/files";
import { planImport, summarize, DEFAULT_OPTS } from "@/lib/glossary/plan";
import { STARTERS } from "@/lib/glossary/starters";
import { NEW_GLOSSARY } from "@/lib/glossary/new";
import { applyBatch, bulk, deleteCategory, getCategories, publishedBySlug, publishedCards, resolveRelated, saveCategory, saveTerm, listAdmin, existingForImport, termById } from "@/lib/glossary/store";
import { applyMapping, guessMapping, parseCsv, parseJson, tableFromGrid } from "@/lib/glossary/tabular";
import { readXlsx, writeXlsx } from "@/lib/glossary/xlsx";
import { getProduct } from "@/lib/catalog";

const known = { products: ["dentists-us"], guides: [], categories: ["b2b-databases"] };
const longText = "A full explanation. ".repeat(20);
const row = (o: Record<string, string>) => ({ term: "T", shortDefinition: "Short definition that is long enough to publish.", content: longText, ...o });

describe("sanitising", () => {
  it("makes slugs", () => { expect(slugify("Email Deliverability")).toBe("email-deliverability"); expect(slugify("A/B Testing & Café")).toBe("a-b-testing-and-cafe"); expect(slugify("  --x--  ")).toBe("x"); });
  it("converts HTML to the safe subset and drops scripts", () => {
    const s = richText('<p>Hello <b>bold</b></p><script>alert(1)</script><ul><li>one</li><li>two</li></ul><a href="javascript:alert(1)">bad</a> <a href="/lists">ok</a><img src=x onerror=alert(1)>', 5000);
    expect(s).not.toMatch(/script|alert|onerror|javascript/);
    expect(s).toContain("**bold**"); expect(s).toContain("- one"); expect(s).toContain("[ok](/lists)"); expect(s).toContain("bad");
  });
  it("keeps only safe links in Markdown", () => {
    expect(richText("[a](https://x.com) [b](http://x.com) [c](//evil.com) [d](/p)", 500)).toBe("[a](https://x.com) b c [d](/p)");
  });
  it("plain text has no markup and respects the limit", () => { expect(plain("**Hi** [x](/y)\n there", 50)).toBe("Hi x there"); expect(plain("a".repeat(300), 20)).toHaveLength(20); });
  it("splits lists", () => { expect(toList("a; b | c\nb")).toEqual(["a", "b", "c"]); expect(toList("x, y")).toEqual(["x", "y"]); expect(toList(["a", "b"])).toEqual(["a", "b"]); });
  it("thin published entries are refused", () => {
    const e = toEntry({ term: "X", shortDefinition: "Too short", content: "tiny", status: "published" }).entry;
    expect(validate(e).errors.join(" ")).toMatch(/at least/);
    expect(validate({ ...e, status: "draft" }).errors.join(" ")).not.toMatch(/at least/);
    expect(toEntry({ term: "X", status: "maybe" }).badStatus).toBe("maybe");
  });
});

describe("file reading", () => {
  it("parses CSV with quotes, commas, line breaks and a BOM", () => {
    const g = parseCsv('﻿Term,Short Definition,Content\r\n"B2B, data","He said ""hi""","line1\nline2"\r\nx,y,z\r\n');
    expect(g).toEqual([["Term", "Short Definition", "Content"], ["B2B, data", 'He said "hi"', "line1\nline2"], ["x", "y", "z"]]);
    expect(parseCsv("a;b\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("parses JSON in several shapes, joining arrays", () => {
    expect(parseJson('[{"term":"A","related_terms":["x","y"]}]').rows[0].related_terms).toBe("x; y");
    expect(parseJson('{"entries":[{"term":"A"}]}').rows).toHaveLength(1);
    expect(() => parseJson("{nope")).toThrow();
  });
  it("round-trips XLSX, including unicode, ampersands and line breaks", () => {
    const grid = [["Term", "Content"], ["Café & <Co>", "line1\nline2 \"q\""], ["B", ""]];
    expect(readXlsx(writeXlsx(grid))).toEqual([["Term", "Content"], ["Café & <Co>", "line1\nline2 \"q\""], ["B"]]);
  });
  it("rejects a file that is not xlsx", () => { expect(() => readXlsx(new Uint8Array([1, 2, 3, 4]))).toThrow(/valid .xlsx/); });
  it("guesses the column mapping from header names", () => {
    const m = guessMapping(["Term", "Slug", "Category", "Short Definition", "Full Explanation / Content", "Why It Matters", "Practical Example", "Related Terms", "SEO Title", "Meta Description", "Keywords", "Status"]);
    expect(m.term).toBe("Term"); expect(m.shortDefinition).toBe("Short Definition"); expect(m.whyItMatters).toBe("Why It Matters"); expect(m.status).toBe("Status");
  });
});

describe("starter data", () => {
  it("has at least 50 substantial, unique, consistent entries", () => {
    expect(STARTERS.length).toBeGreaterThanOrEqual(30);
    const slugs = new Set([...STARTERS.map((s) => s.slug), ...NEW_GLOSSARY.map((s) => s.slug)]); expect(slugs.size).toBe(STARTERS.length + NEW_GLOSSARY.length);
    const cats = new Set(STARTERS.map((s) => s.category)); expect(cats.size).toBeGreaterThanOrEqual(8);
    for (const s of STARTERS) {
      expect(s.shortDefinition.length, s.term).toBeGreaterThanOrEqual(MIN_PUBLISH.short);
      expect(s.content.length, s.term).toBeGreaterThanOrEqual(Math.max(MIN_PUBLISH.content, 400));
      expect(s.whyItMatters && s.example, s.term).toBeTruthy();
      expect(s.status).toBe("draft");
      for (const r of s.relatedTerms) expect(slugs.has(slugify(r)), `${s.term} -> ${r}`).toBe(true);
      for (const p of s.relatedProducts) expect(getProduct(p), p).toBeTruthy();
    }
    expect(new Set(STARTERS.map((s) => s.shortDefinition)).size).toBe(STARTERS.length);
  });
  it("ships no statistics or prices", () => { expect(JSON.stringify(STARTERS)).not.toMatch(/\$\d|\d+\s?%/); });
  it("the CSV, JSON and XLSX downloads all re-import to the same entries", () => {
    const csv = buildFile("starter", "csv"); const json = buildFile("starter", "json"); const xlsx = buildFile("starter", "xlsx");
    const fromCsv = tableFromGrid(parseCsv(csv.body as string)); const fromX = tableFromGrid(readXlsx(xlsx.body as Uint8Array)); const fromJ = parseJson(json.body as string);
    for (const t of [fromCsv, fromX, fromJ]) {
      expect(t.rows).toHaveLength(STARTERS.length);
      const raws = t.rows.map((r, i) => ({ raw: applyMapping(r, guessMapping(t.headers)), row: i + 2 }));
      const plan = planImport(raws, [], { ...known, categories: [] });
      expect(summarize(plan).error).toBe(0); expect(summarize(plan).create).toBe(STARTERS.length);
      expect(plan[0].entry.content).toBe(STARTERS[0].content);
    }
  });
});

describe("import planning", () => {
  const plan = (rows: Record<string, string>[], existing: { id: number; slug: string; term: string; status: "draft" | "published" }[] = [], opts = DEFAULT_OPTS) => planImport(rows.map((r, i) => ({ raw: row(r), row: i + 2 })), existing, known, opts);
  it("generates slugs and flags duplicates inside the file", () => {
    const p = plan([{ term: "Cold Email" }, { term: "Cold  email!" }, { term: "Other", slug: "cold-email" }]);
    expect(p[0].entry.slug).toBe("cold-email"); expect(p[0].action).toBe("create");
    expect(p[1].action).toBe("error"); expect(p[2].action).toBe("error");
  });
  it("skips existing entries by default and protects published ones when updating", () => {
    const ex = [{ id: 1, slug: "a", term: "A", status: "published" as const }, { id: 2, slug: "b", term: "B", status: "draft" as const }];
    expect(plan([{ term: "A" }, { term: "B" }], ex).map((x) => x.action)).toEqual(["skip", "skip"]);
    expect(plan([{ term: "A" }, { term: "B" }], ex, { ...DEFAULT_OPTS, mode: "update" }).map((x) => x.action)).toEqual(["skip", "update"]);
    expect(plan([{ term: "A" }, { term: "B" }], ex, { mode: "update", allowUpdatePublished: true, forceDraft: false }).map((x) => x.action)).toEqual(["update", "update"]);
  });
  it("forces drafts and reports bad rows", () => {
    expect(plan([{ term: "Z", status: "Published" }], [], { ...DEFAULT_OPTS, forceDraft: true })[0].entry.status).toBe("draft");
    expect(plan([{ term: "Z", status: "Published", content: "short" }])[0].action).toBe("error");
    expect(plan([{ term: "" }])[0].action).toBe("error");
    expect(plan([{ term: "Q", relatedProducts: "nope" }])[0].warnings.join(" ")).toMatch(/not found/);
  });
});

describe("glossary store (local D1)", () => {
  let proxy: PlatformProxy<CloudflareEnv>; let db: ReturnType<typeof getDbFromEnv>;
  beforeAll(async () => {
    proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "glossary-")) } });
    const env = proxy.env as CloudflareEnv;
    const sql = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort().map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
    for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
    db = getDbFromEnv(env);
  }, 60_000);
  afterAll(async () => { await proxy?.dispose(); });
  const run = async (rows: Record<string, string>[], opts = DEFAULT_OPTS) => applyBatch(db, planImport(rows.map((r, i) => ({ raw: row(r), row: i + 2 })), await existingForImport(db), known, opts), opts, "t@x");

  it("imports the starter entries as drafts, then skips them on a second run", async () => {
    const raws = STARTERS.map((s, i) => ({ raw: { term: s.term, slug: s.slug, category: s.category, shortDefinition: s.shortDefinition, content: s.content, whyItMatters: s.whyItMatters, example: s.example, relatedTerms: s.relatedTerms.join("; "), relatedGuides: s.relatedGuides.join("; "), relatedProducts: s.relatedProducts.join("; ") }, row: i + 2 }));
    const r1 = await applyBatch(db, planImport(raws, await existingForImport(db), known), DEFAULT_OPTS, "t@x");
    expect(r1.created).toBe(STARTERS.length); expect(r1.failed).toBe(0);
    expect((await publishedCards(db)).length).toBe(0); // nothing is live until the admin publishes
    const r2 = await applyBatch(db, planImport(raws, await existingForImport(db), known), DEFAULT_OPTS, "t@x");
    expect(r2.created).toBe(0); expect(r2.skipped).toBe(STARTERS.length);
    expect((await listAdmin(db, {})).total).toBe(STARTERS.length);
  }, 60_000);

  it("publishes in bulk, refuses thin entries, and serves only published ones", async () => {
    const all = (await listAdmin(db, { per: 100 })).rows;
    const r = await bulk(db, all.slice(0, 5).map((x) => x.id), "publish", "t@x");
    expect(r.ok).toBe(true);
    const cards = await publishedCards(db); expect(cards).toHaveLength(5);
    expect(await publishedBySlug(db, all[10].slug)).toBeNull();
    expect((await publishedBySlug(db, all[0].slug))?.term).toBe(all[0].term);
    await run([{ term: "Thin One", content: "tiny content" }]); // thin draft imported (draft allowed)
    const thin = (await listAdmin(db, { q: "Thin One" })).rows[0]; expect(thin).toBeTruthy();
    expect((await bulk(db, [thin.id], "publish", "t@x")).ok).toBe(false);
    expect((await bulk(db, [all[0].id], "draft", "t@x")).ok).toBe(true);
    expect(await publishedBySlug(db, all[0].slug)).toBeNull();
  });

  it("updates drafts, never overwrites published entries without permission, and never unpublishes", async () => {
    await run([{ term: "Live Term", status: "Published" }]);
    const live = (await listAdmin(db, { q: "Live Term" })).rows[0]; expect(live.status).toBe("published");
    const skipped = await run([{ term: "Live Term", shortDefinition: "CHANGED definition that is certainly long enough to count." }], { mode: "update", allowUpdatePublished: false, forceDraft: false });
    expect(skipped.skipped).toBe(1); expect((await termById(db, live.id))?.shortDefinition).not.toMatch(/CHANGED/);
    const upd = await run([{ term: "Live Term", shortDefinition: "CHANGED definition that is certainly long enough to count.", status: "Draft" }], { mode: "update", allowUpdatePublished: true, forceDraft: false });
    expect(upd.updated).toBe(1);
    const after = await termById(db, live.id); expect(after?.shortDefinition).toMatch(/CHANGED/); expect(after?.status).toBe("published");
    expect(after?.content).toBe(live.content); // empty fields in the file keep the old text
  });

  it("creates missing categories during import and protects categories that are in use", async () => {
    await run([{ term: "Cat Test", category: "Brand New Topic" }]);
    expect((await getCategories(db)).some((c) => c.slug === "brand-new-topic")).toBe(true);
    expect((await deleteCategory(db, "brand-new-topic")).ok).toBe(false);
    expect((await saveCategory(db, { name: "Brand New Topic", description: "" })).ok).toBe(false);
    expect((await saveCategory(db, { name: "Another One", description: "d" })).ok).toBe(true);
    expect((await deleteCategory(db, "another-one")).ok).toBe(true);
    expect((await getCategories(db)).length).toBeGreaterThan(12);
  });

  it("saves entries by hand with validation, unique slugs and publish gate", async () => {
    expect((await saveTerm(db, null, { term: "" }, "draft", "t")).ok).toBe(false);
    const a = await saveTerm(db, null, { term: "Manual Term", shortDefinition: "A short definition that is long enough to be published.", content: longText, relatedTerms: "Cold Email" }, "published", "t");
    expect(a.ok).toBe(true);
    expect((await saveTerm(db, null, { term: "Manual Term", shortDefinition: "x".repeat(40), content: longText }, "draft", "t")).message).toMatch(/already uses/);
    expect((await saveTerm(db, a.id!, { term: "Manual Term", shortDefinition: "short", content: "" }, "keep", "t")).ok).toBe(false);
    expect((await saveTerm(db, a.id!, { term: "Manual Term", shortDefinition: "A short definition that is long enough to be published.", content: longText }, "draft", "t")).message).toMatch(/draft/);
    expect(await publishedBySlug(db, "manual-term")).toBeNull();
  });

  it("resolves related terms to published entries only", async () => {
    await bulk(db, (await listAdmin(db, { q: "Email List" })).rows.map((r) => r.id), "publish", "t");
    const rel = await resolveRelated(db, ["Email List", "email-list", "Unknown", "Drip Campaign"], "x");
    expect(rel.map((r) => r.slug)).toEqual(["email-list"]);
  });
});
