// US local pages + Local Businesses Database move against a LOCAL D1: preview, apply, nothing created/duplicated, guards, rollback.
import { eq } from "drizzle-orm";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv, schema } from "@/lib/db";
import { applySeo, createProduct, importBuiltin } from "@/lib/import/store";
import { applyLocal, createUsLocalPages, listBatches, rollbackLocal, scanLocal } from "@/lib/import/local-move";
import { LOCAL_SLUG } from "@/lib/import/local-business";

let proxy: PlatformProxy<CloudflareEnv>; let env: CloudflareEnv;
beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "local-move-")) } });
  env = proxy.env as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const s of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(s).run();
}, 240_000);
afterAll(async () => { await proxy?.dispose(); });

describe("US local landing pages", () => {
  it("creates drafts once, in the category, with 3 packages and no count", async () => {
    const db = getDbFromEnv(env);
    const a = await createUsLocalPages(db);
    expect(a.created).toBeGreaterThan(1000); expect(a.failed).toBe(0);
    const b = await createUsLocalPages(db);
    expect(b.created).toBe(0); expect(b.existing).toBe(a.created);
    const rows = await db.select().from(schema.catalogProducts).where(eq(schema.catalogProducts.categorySlug, LOCAL_SLUG));
    expect(rows.length).toBe(a.created);
    expect(rows.every((r) => r.status === "draft" && r.recordCount === null && r.countryCode === "US")).toBe(true);
    expect(new Set(rows.map((r) => r.slug)).size).toBe(rows.length);
    expect(JSON.parse(rows[0].packagesJson as string).length).toBe(3);
  }, 240_000);
});

import { applyStandard, localStandardIds } from "@/lib/import/local-standard-apply";
describe("Local standard bulk apply", () => {
  it("standardizes untouched products, skips edited ones, packages, slugs", async () => {
    const db = getDbFromEnv(env);
    const mk = async (n: string) => (await createProduct(db, { name: `${n} Email List in the United States`, title: "", description: "", seoTitle: "", metaDescription: "", recordCount: null, dataFields: [], fileFormats: "", coverage: "", lastUpdated: "", placeholder: true, forSale: false, packages: [{ name: "Starter", records: 100000, priceUsdCents: 9900 }], categoryName: "Local Businesses Database", countryName: "United States", countryCode: "US", region: "", channel: "business-email" })).id!;
    const edited = await mk("Zebra Keepers");
    for (const n of ["Plumbers", "Dentists", "Bakeries", "Florists", "Roofers", "Tailors"]) await mk(n);
    await db.update(schema.catalogProducts).set({ categorySlug: LOCAL_SLUG, categoryName: "Local Businesses Database" }).where(eq(schema.catalogProducts.categoryName, "Local Businesses Database"));
    await db.update(schema.catalogProducts).set({ seoTitle: "keep", metaDescription: "keep me" }).where(eq(schema.catalogProducts.id, edited));
    const ids = (await localStandardIds(db)).todo.filter((x) => x !== edited).slice(-6);
    const r = await applyStandard(db, [edited, ...ids], "1M+");
    expect(r.failed).toEqual([]); expect(r.changed).toBe(6); expect(r.skipped).toBe(1);
    const row = (await db.select().from(schema.catalogProducts).where(eq(schema.catalogProducts.id, ids[0])))[0];
    expect(row.slug).toMatch(/-business-email-database/); expect(row.coverage).toBe("United States");
    expect(row.name).toMatch(/ Email Database$/); expect(row.metaDescription!.length).toBeLessThanOrEqual(155); expect(row.description.length).toBeLessThanOrEqual(300);
    expect(JSON.parse(row.packagesJson).map((p: { records: number; priceUsdCents: number }) => [p.records, p.priceUsdCents])).toEqual([[5000, 3900], [10000, 5900], [15000, 9900]]);
    const kept = (await db.select().from(schema.catalogProducts).where(eq(schema.catalogProducts.id, edited)))[0];
    expect(kept.seoTitle).toBe("keep"); expect(kept.name).not.toMatch(/ Email Database$/);
    const again = await applyStandard(db, ids, "1M+"); expect(again.changed).toBe(0);
  }, 120_000);
});
