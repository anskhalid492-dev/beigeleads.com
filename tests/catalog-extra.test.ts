import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv } from "@/lib/db";
import { addConsumer, addCountry, addSubindustry, allCountryRows, cleanConsumer, cleanCountry, cleanSubindustry, deleteCountry, findCountry, loadConsumerCategories, loadCountries, loadSubindustries, setCountryEnabled } from "@/lib/catalog-extra";
import { importGeo } from "@/lib/geo/store";
import { geoPageList } from "@/lib/geo/store";

describe("catalog extras (pure)", () => {
  it("validates country, sub-industry and consumer input", () => {
    expect(cleanCountry({ name: "Germany", code: "de" }).value).toEqual({ slug: "germany", code: "DE", name: "Germany" });
    expect(cleanCountry({ name: "Germany", code: "DEU" }).error).toMatch(/2 letters/);
    expect(cleanCountry({ name: "United States", code: "US" }, ["united-states"]).error).toMatch(/already/);
    expect(cleanSubindustry({ category: "nope", name: "x y" }).error).toMatch(/industry/);
    expect(cleanSubindustry({ category: "dentists", name: " Orthodontists <b>" }).value?.slug).toBe("orthodontists-b");
    expect(cleanConsumer({ name: "a" }).error).toBeTruthy();
  });
});

describe("catalog extras (local D1)", () => {
  let proxy: PlatformProxy<CloudflareEnv>;
  let db: ReturnType<typeof getDbFromEnv>;
  beforeAll(async () => {
    proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "cat-x-")) } });
    const env = proxy.env as CloudflareEnv;
    const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
    const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
    for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
    db = getDbFromEnv(env);
  }, 60_000);
  afterAll(async () => { await proxy?.dispose(); });

  it("adds, hides and protects countries that already have places", async () => {
    expect((await loadCountries(db)).map((c) => c.slug)).toEqual(["united-states"]);
    await addCountry(db, { slug: "germany", code: "DE", name: "Germany" });
    expect((await findCountry(db, "germany"))?.code).toBe("DE");
    await setCountryEnabled(db, "germany", false);
    expect(await findCountry(db, "germany")).toBeUndefined();
    expect((await allCountryRows(db)).rows.find((r) => r.slug === "germany")?.enabled).toBe(false);
    await setCountryEnabled(db, "germany", true);
    await importGeo(db, "germany", [{ region: "", city: "Berlin", category: "dentists", records: 10 }]);
    expect((await geoPageList(db)).map((p) => p.path)).toContain("/lists/dentists/germany");
    expect(await deleteCountry(db, "germany")).toBe(false);
    await addCountry(db, { slug: "france", code: "FR", name: "France" });
    expect(await deleteCountry(db, "france")).toBe(true);
  });
  it("stores sub-industries and consumer categories (consumer hidden by default)", async () => {
    await addSubindustry(db, { categorySlug: "dentists", slug: "orthodontists", name: "Orthodontists", description: "" });
    await expect(addSubindustry(db, { categorySlug: "dentists", slug: "orthodontists", name: "Orthodontists", description: "" })).rejects.toThrow();
    expect((await loadSubindustries(db)).rows).toHaveLength(1);
    await addConsumer(db, { slug: "homeowners", name: "Homeowners", description: "" });
    expect((await loadConsumerCategories(db)).rows[0].enabled).toBe(false);
    expect((await loadConsumerCategories(db, true)).rows).toHaveLength(0);
  });
});
