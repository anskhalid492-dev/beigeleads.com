// Reorganize General Targeted Lists against a LOCAL D1: nothing created, only category changes, protected from remap, rollback.
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv, schema } from "@/lib/db";
import { applySeo, createProduct } from "@/lib/import/store";
import { applyGeneral, scanGeneral } from "@/lib/import/reorganize";
import { rollbackLocal } from "@/lib/import/local-move";

let proxy: PlatformProxy<CloudflareEnv>; let env: CloudflareEnv;
beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "reorg-")) } });
  env = proxy.env as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const s of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(s).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

const mk = (db: ReturnType<typeof getDbFromEnv>, name: string) => createProduct(db, { name, title: name, description: "d", recordCount: 100, packages: [{ name: "Starter", records: 100, priceUsd: 99, recommended: false }], dataFields: [], fileFormats: "", coverage: "", lastUpdated: "", seoTitle: "", metaDescription: "", placeholder: false, forSale: false, categoryName: "General Targeted Lists", countryName: "United States", countryCode: "US", region: "", channel: "business-email" } as never);

describe("reorganize general targeted lists", () => {
  it("moves clear cases, flags the rest, protects from remap, rolls back", async () => {
    const db = getDbFromEnv(env);
    for (const n of ["Gmail Users Email List", "Bitcoin Investors Email List", "Plumbers Email List", "Rehab Centers Email List", "Software Companies Email List", "Yahoo Business Owners Email List"]) expect((await mk(db, n)).ok).toBe(true);
    const before = await db.select().from(schema.catalogProducts);
    const scan = await scanGeneral(db);
    expect(scan.inGeneral).toBe(6);
    expect(scan.keep).toBe(1); expect(scan.review).toBe(1);
    const res = await applyGeneral(db, scan.rows.map((r) => ({ slug: r.slug })), { batch: "g1", includeReview: false });
    expect(res.moved).toBe(5); // 4 destinations + 1 "stay" product into its own category
    const after = await db.select().from(schema.catalogProducts);
    expect(after.length).toBe(before.length);
    const by = (n: string) => after.find((x) => x.name === n)!;
    expect(by("Gmail Users Email List").categorySlug).toBe("webmail-lists");
    expect(by("Bitcoin Investors Email List").categorySlug).toBe("crypto-blockchain");
    expect(by("Plumbers Email List").categorySlug).toBe("local-businesses-database");
    expect(by("Rehab Centers Email List").categorySlug).toBe("healthcare-lists");
    expect(by("Software Companies Email List").categoryName).toBe("Software Companies");
    expect(by("Yahoo Business Owners Email List").categoryName).toBe("General Targeted Lists");
    for (const b of before) { const a = after.find((x) => x.id === b.id)!; expect(a.slug).toBe(b.slug); expect(a.packagesJson).toBe(b.packagesJson); expect(a.name).toBe(b.name); }
    await applySeo(db, after.map((x) => x.id), { slugs: false, names: false, titles: false, categories: true }, false);
    expect((await db.select().from(schema.catalogProducts)).find((x) => x.name === "Gmail Users Email List")!.categorySlug).toBe("webmail-lists");
    expect(await rollbackLocal(db, "g1")).toBe(5);
    expect((await scanGeneral(db)).inGeneral).toBeGreaterThanOrEqual(5); // all are back in General Targeted Lists
  }, 60_000);
});
