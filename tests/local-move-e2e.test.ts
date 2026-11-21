// Local Businesses Database move against a LOCAL D1: preview, apply, nothing created/duplicated, guards, rollback.
import { eq } from "drizzle-orm";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv, schema } from "@/lib/db";
import { applySeo, importBuiltin } from "@/lib/import/store";
import { applyLocal, listBatches, rollbackLocal, scanLocal } from "@/lib/import/local-move";
import { LOCAL_SLUG } from "@/lib/import/local-business";

let proxy: PlatformProxy<CloudflareEnv>; let env: CloudflareEnv;
beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "local-move-")) } });
  env = proxy.env as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const s of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(s).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("local businesses move", () => {
  it("previews, moves only local lists, creates nothing, guards, and rolls back", async () => {
    const db = getDbFromEnv(env);
    await importBuiltin(db);
    const before = await db.select().from(schema.catalogProducts);
    const scan = await scanLocal(db);
    expect(scan.scanned).toBe(before.length);
    const movers = scan.items.filter((i) => i.decision === "move");
    expect(movers.length).toBeGreaterThan(0);
    expect(scan.items.filter((i) => i.slug.includes("germany") && i.decision === "move")).toHaveLength(0);

    const r = await applyLocal(db, movers.map((m) => m.slug), { batch: "t1", copyBuiltin: false, allowReview: false });
    expect(r.moved).toBe(movers.length);
    const after = await db.select().from(schema.catalogProducts);
    expect(after.length).toBe(before.length); // nothing created or duplicated
    for (const m of movers) {
      const a = after.find((x) => x.slug === m.slug)!, b = before.find((x) => x.slug === m.slug)!;
      expect(a.categorySlug).toBe(LOCAL_SLUG);
      expect({ ...a, categorySlug: "", categoryName: "", updatedAt: 0 }).toEqual({ ...b, categorySlug: "", categoryName: "", updatedAt: 0 }); // everything else untouched
    }
    // unrelated products untouched
    for (const m of scan.items.filter((i) => i.decision !== "move")) expect(after.find((x) => x.slug === m.slug)!.categorySlug).toBe(before.find((x) => x.slug === m.slug)!.categorySlug);

    // re-running moves nothing and the SEO category pass does not pull them back
    expect((await applyLocal(db, movers.map((m) => m.slug), { batch: "t2", copyBuiltin: false, allowReview: false })).moved).toBe(0);
    const ids = after.map((x) => x.id);
    await applySeo(db, ids, { slugs: false, names: false, titles: false, categories: true }, false);
    expect((await db.select().from(schema.catalogProducts).where(eq(schema.catalogProducts.categorySlug, LOCAL_SLUG))).length).toBe(movers.length);

    expect((await listBatches(db))[0].active).toBe(movers.length);
    expect(await rollbackLocal(db, "t1")).toBe(movers.length);
    const back = await db.select().from(schema.catalogProducts);
    for (const b of before) expect(back.find((x) => x.slug === b.slug)!.categorySlug).toBe(b.categorySlug);
  }, 60_000);
});
