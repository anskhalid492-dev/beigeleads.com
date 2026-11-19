import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv } from "@/lib/db";
import { getCategory, getCountry, getProductFor } from "@/lib/catalog";
import { geoCopy } from "@/lib/geo/content";
import { isIndexable, parseImport, slugify } from "@/lib/geo/rules";
import { coverageFor, geoSitemapPaths, importGeo, listAllCities, regionTotals, resolveArea } from "@/lib/geo/store";

describe("geo rules (pure)", () => {
  it("slugifies unambiguously", () => {
    expect(slugify("São Paulo")).toBe("sao-paulo");
    expect(slugify("  Winston-Salem, NC ")).toBe("winston-salem-nc");
    expect(slugify("Bayern & Co")).toBe("bayern-and-co");
  });
  it("indexes only places with real inventory", () => {
    expect(isIndexable({ coverageCount: 120, areaIndexable: true })).toBe(true);
    expect(isIndexable({ coverageCount: 0, areaIndexable: true })).toBe(false);
    expect(isIndexable({ coverageCount: null, areaIndexable: true })).toBe(false);
    expect(isIndexable({ coverageCount: 50, areaIndexable: false })).toBe(false);
  });
  it("validates the import file", () => {
    const ok = parseImport("region,city,category,records\nAlabama,Birmingham,dentists,1200\nAlabama,,Dentists,5,400".replace("5,400", "5400"), ["dentists"]);
    expect(ok.errors).toEqual([]);
    expect(ok.rows).toHaveLength(2);
    expect(parseImport("region,city,category,records\nX,Y,nope,1", ["dentists"]).errors[0]).toMatch(/unknown category/);
    expect(parseImport("region,city,category,records\nX,Y,dentists,-3", ["dentists"]).errors[0]).toMatch(/whole number/);
    expect(parseImport("a,b\n1,2", ["dentists"]).errors[0]).toMatch(/first line/);
  });
  it("writes copy from real data only", () => {
    const c = getCategory("dentists")!, k = getCountry("united-states")!, product = getProductFor("dentists", "united-states");
    const none = geoCopy({ category: c, country: k, place: { name: "Birmingham", level: "city", parentName: "Alabama" }, product, records: null, children: [] });
    expect(none.h1).toBe("Birmingham Dentist Email List");
    expect(none.intro).toMatch(/not recorded any/);
    expect(none.description).not.toMatch(/\d{2,}/);
    const some = geoCopy({ category: c, country: k, place: { name: "Alabama", level: "region" }, product, records: 5400, children: [{ name: "Birmingham", records: 1200 }] });
    expect(some.intro).toContain("5,400");
    expect(some.faqs.some(([q]) => q.includes("Which places inside Alabama"))).toBe(true);
    expect(some.description.length).toBeLessThanOrEqual(160);
  });
});

describe("geo store (local D1)", () => {
  let proxy: PlatformProxy<CloudflareEnv>;
  let db: ReturnType<typeof getDbFromEnv>;
  beforeAll(async () => {
    proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "geo-e2e-")) } });
    const env = proxy.env as CloudflareEnv;
    const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
    const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
    for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
    db = getDbFromEnv(env);
  }, 60_000);
  afterAll(async () => { await proxy?.dispose(); });

  it("imports, is repeatable, and resolves industry > country > state > city", async () => {
    const rows = [
      { region: "Alabama", city: "Birmingham", category: "dentists", records: 1200 },
      { region: "Alabama", city: "Mobile", category: "dentists", records: 300 },
      { region: "", city: "Denver", category: "dentists", records: 900 },
    ];
    const r1 = await importGeo(db, "united-states", rows);
    expect(r1).toEqual({ regions: 1, cities: 3, coverage: 3 });
    const r2 = await importGeo(db, "united-states", rows.map((x) => ({ ...x, records: x.records + 1 })));
    expect(r2.regions + r2.cities).toBe(0);

    const state = await resolveArea(db, "united-states", ["alabama"]);
    expect(state?.area.level).toBe("region");
    expect(state?.children.map((c) => c.slug)).toEqual(["birmingham", "mobile"]);
    const city = await resolveArea(db, "united-states", ["alabama", "birmingham"]);
    expect(city?.parent?.slug).toBe("alabama");
    expect(city?.siblings.map((c) => c.slug)).toEqual(["mobile"]);
    expect((await resolveArea(db, "united-states", ["birmingham"]))).toBeNull(); // a city under a state is not reachable without it
    expect((await resolveArea(db, "united-states", ["denver"]))?.area.level).toBe("city"); // region-less city
    expect(await resolveArea(db, "united-states", ["alabama", "nowhere"])).toBeNull();
    expect(await resolveArea(db, "united-states", ["a", "b", "c"])).toBeNull();
  });

  it("counts real inventory per place and totals a state from its cities", async () => {
    const st = (await resolveArea(db, "united-states", ["alabama"]))!;
    const cov = await coverageFor(db, "dentists", st.children.map((c) => c.id));
    expect([...cov.values()].sort((a, b) => a - b)).toEqual([301, 1201]);
    expect((await regionTotals(db, "dentists", [st.area])).get(st.area.id)).toBe(1502);
    expect((await coverageFor(db, "restaurants", [st.area.id])).size).toBe(0);
    expect((await listAllCities(db, "united-states")).map((c) => `${c.name}:${c.regionSlug}`)).toEqual(["Birmingham:alabama", "Denver:null", "Mobile:alabama"]);
  });

  it("falls back to the built-in static cities (old URLs keep working, noindex)", async () => {
    const v = await resolveArea(db, "united-states", ["chicago"]);
    expect(v?.area.indexable).toBe(false);
    expect(v?.area.id).toBeLessThan(0);
  });

  it("lists only places with real inventory in the sitemap", async () => {
    const p = await geoSitemapPaths(db);
    expect(p).toContain("/lists/dentists/united-states/alabama/birmingham");
    expect(p).toContain("/lists/dentists/united-states/denver");
    expect(p).not.toContain("/lists/dentists/united-states/chicago");
  });
});
