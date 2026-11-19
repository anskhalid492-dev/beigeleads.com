import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv } from "@/lib/db";
import { cleanGeoContent, contentWarnings, getGeoContent, saveGeoContent } from "@/lib/geo/page-content";
import { geoPageList, importGeo } from "@/lib/geo/store";
import { buildBrief, classifyIntent, cleanKeyword, duplicateTargets, listKeywords, saveKeyword, suggestTarget, type KeywordRow } from "@/lib/seo/keywords";

describe("keywords (pure)", () => {
  it("classifies search intent", () => {
    expect(classifyIntent("how to find dentists in alabama")).toBe("informational");
    expect(classifyIntent("berlin b2b prospecting guide")).toBe("informational");
    expect(classifyIntent("buy dentist email list")).toBe("transactional");
    expect(classifyIntent("birmingham dentist email list")).toBe("commercial");
    expect(classifyIntent("beigeleads sample")).toBe("navigational");
    expect(suggestTarget("informational")).toBe("guide");
    expect(suggestTarget("commercial")).toBe("page");
  });
  it("builds a brief with real links only and no numbers", () => {
    const b = buildBrief({ keyword: "alabama dentist email list", intent: "commercial", category: "dentists", country: "united-states", place: "Alabama" });
    expect(b.links.map((l) => l.url)).toEqual(expect.arrayContaining(["/shop", "/lists/dentists", "/lists/dentists/united-states", "/product/dentists-us"]));
    expect(b.titleIdea.length).toBeLessThanOrEqual(60);
    expect(JSON.stringify(b)).not.toMatch(/\d+%/);
    expect(buildBrief({ keyword: "how to find dentists", intent: "informational" }).outline.length).toBeGreaterThan(4);
  });
  it("validates input", () => {
    expect(cleanKeyword({ keyword: "ab" }).error).toBeTruthy();
    expect(cleanKeyword({ keyword: "x yz", targetPath: "javascript:1" }).error).toMatch(/site path/);
    expect(cleanKeyword({ keyword: "x yz", category: "nope" }).error).toMatch(/industry/);
    expect(cleanKeyword({ keyword: "  Dentists   Email List " }).value?.keyword).toBe("dentists email list");
  });
  it("flags two keywords on one page", () => {
    const r = (id: number, keyword: string, targetPath: string) => ({ id, keyword, targetPath }) as KeywordRow;
    expect([...duplicateTargets([r(1, "a b c", "/x"), r(2, "d e f", "/x"), r(3, "g h i", "/y")]).keys()]).toEqual(["/x"]);
  });
  it("cleans and checks page copy", () => {
    expect(cleanGeoContent({ seoTitle: "short" }).error).toMatch(/too short/);
    expect(cleanGeoContent({ intro: "<b>Hi</b> there" }).value?.intro).toBe("bHi/b there");
    const w = contentWarnings({ seoTitle: "x".repeat(70), metaDescription: "", intro: "", primaryKeyword: "dentist email list", secondaryKeywords: "" }, "H1");
    expect(w.length).toBeGreaterThanOrEqual(2);
  });
});

describe("keywords and page copy (local D1)", () => {
  let proxy: PlatformProxy<CloudflareEnv>;
  let db: ReturnType<typeof getDbFromEnv>;
  beforeAll(async () => {
    proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "seo-wf-")) } });
    const env = proxy.env as CloudflareEnv;
    const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
    const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
    for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
    db = getDbFromEnv(env);
  }, 60_000);
  afterAll(async () => { await proxy?.dispose(); });

  it("saves, updates and refuses a duplicate keyword", async () => {
    const v = cleanKeyword({ keyword: "alabama dentist email list", targetType: "page", targetPath: "/lists/dentists/united-states/alabama", category: "dentists", country: "united-states" }).value!;
    await saveKeyword(db, null, v);
    await expect(saveKeyword(db, null, v)).rejects.toThrow();
    const { rows } = await listKeywords(db, { q: "alabama" });
    expect(rows).toHaveLength(1);
    await saveKeyword(db, rows[0].id, { ...v, status: "briefed" });
    expect((await listKeywords(db, { status: "briefed" })).rows).toHaveLength(1);
    expect((await listKeywords(db, { status: "published" })).rows).toHaveLength(0);
  });

  it("stores page copy, resets it when emptied, and lists pages with inventory", async () => {
    await importGeo(db, "united-states", [{ region: "Alabama", city: "Birmingham", category: "dentists", records: 50 }]);
    const pages = (await geoPageList(db)).map((p) => p.path);
    expect(pages).toContain("/lists/dentists/united-states");
    expect(pages).toContain("/lists/dentists/united-states/alabama/birmingham");
    expect(pages).not.toContain("/lists/restaurants/united-states/alabama/birmingham");
    const path = "/lists/dentists/united-states/alabama/birmingham";
    const v = cleanGeoContent({ seoTitle: "Birmingham Dentist Email List | BeigeLeads", metaDescription: "x".repeat(80), intro: "Recorded practices in Birmingham." }).value!;
    await saveGeoContent(db, path, v);
    expect((await getGeoContent(db, path)).seoTitle).toBe("Birmingham Dentist Email List | BeigeLeads");
    await saveGeoContent(db, path, cleanGeoContent({}).value!);
    expect((await getGeoContent(db, path)).seoTitle).toBe("");
  });
});
