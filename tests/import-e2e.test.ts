// Import end to end against a LOCAL D1 + KV: plan, apply (idempotent), duplicates, publish gate, hydrate, pricing, rollback.
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FIXTURE } from "./import-fixture";
import { getProduct } from "@/lib/catalog";
import { hydrateCatalog } from "@/lib/catalog-db";
import { priceCart } from "@/lib/cart/model";
import { getDbFromEnv, schema } from "@/lib/db";
import { applyBatch, finishImport, listProducts, planBatch, rollbackImport, setStatus, startImport, type ImportRow } from "@/lib/import/store";
import { reservedSlugs } from "@/lib/import/reserved";
import { buildProduct, parseWoo } from "@/lib/import/woo";

let proxy: PlatformProxy<CloudflareEnv>; let env: CloudflareEnv;
const rows = () => parseWoo(FIXTURE).products.map((p) => buildProduct(p) as unknown as ImportRow);
const none = reservedSlugs(); // includes the static catalog, e.g. the Germany product slug

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "import-e2e-")) } });
  env = proxy.env as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const s of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(s).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("catalog import", () => {
  it("imports as drafts, is idempotent, and handles duplicates by policy", async () => {
    const db = getDbFromEnv(env);
    const id = await startImport(db, "t.csv", 4);
    const a = await applyBatch(db, id, rows(), "skip", none, "t@test");
    expect(a.failed).toBe(0);
    expect(a.created).toBe(4);
    const all = await listProducts(db, {}, 1);
    expect(all.rows.every((r) => r.status === "draft")).toBe(true);
    // same file again: nothing new
    const b = await applyBatch(db, id, rows(), "skip", none, "t@test");
    expect(b.created).toBe(0); expect(b.skipped).toBe(4);
    // item 40 has the same name as item 10's cousin? it has the same slug base as 10: it must have a distinct slug
    const slugs = all.rows.map((r) => r.slug); expect(new Set(slugs).size).toBe(slugs.length);
    const sep = await planBatch(db, rows(), "separate", none);
    expect(sep.items.every((i) => i.action === "skip")).toBe(true); // same WordPress id is never imported twice
    await finishImport(db, id);
  });
  it("publish gate: restricted and link-less products are refused, complete one goes live and is buyable", async () => {
    const db = getDbFromEnv(env);
    const list = (await listProducts(db, {}, 1)).rows;
    const clean = list.find((r) => r.sourceId === "20")!, consumer = list.find((r) => r.sourceId === "30")!;
    const r = await setStatus(db, [clean.id, consumer.id], "published");
    expect(r.changed).toBe(1); expect(r.refused.map((x) => x.slug)).toEqual([consumer.slug]); expect(Array.isArray(r.noLink)).toBe(true);
    await env.CACHE.delete("catalog:imp:v1");
    await hydrateCatalog(env, true);
    const p = getProduct(clean.slug)!;
    expect(p).toBeTruthy(); expect(p.imported).toBe(true);
    expect(getProduct(consumer.slug)).toBeUndefined();
    const priced = priceCart([{ slug: clean.slug, pkg: "Complete" }], { checkoutOpen: true, allowPlaceholder: false });
    expect(priced.lines[0].purchasable).toBe(true);
    expect(priced.lines[0].priceCents).toBe(9900);
    const link = await env.DB.prepare("SELECT url FROM delivery_links WHERE product_slug = ?").bind(clean.slug).first<{ url: string }>();
    expect(link?.url).toMatch(/^https:\/\//);
  });
  it("rollback removes only unpublished, never-ordered imports", async () => {
    const db = getDbFromEnv(env);
    const [imp] = await db.select().from(schema.catalogImports);
    const r = await rollbackImport(db, imp.id);
    expect(r.kept).toBe(1); expect(r.removed).toBe(3);
  });
});
