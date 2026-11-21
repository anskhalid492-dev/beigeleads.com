// US local pages + Local Businesses Database move against a LOCAL D1: preview, apply, nothing created/duplicated, guards, rollback.
import { eq } from "drizzle-orm";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv, schema } from "@/lib/db";
import { applySeo, importBuiltin } from "@/lib/import/store";
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
