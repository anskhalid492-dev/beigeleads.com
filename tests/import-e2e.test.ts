// Import end to end against a LOCAL D1 + KV: plan, apply (idempotent), duplicates, publish gate, hydrate, pricing, rollback.
import { eq } from "drizzle-orm";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FIXTURE } from "./import-fixture";
import { getProduct, sampleRowsOf, getDefaultSample } from "@/lib/catalog";
import { hydrateCatalog } from "@/lib/catalog-db";
import { priceCart } from "@/lib/cart/model";
import { getDbFromEnv, schema } from "@/lib/db";
import { applyLinks } from "@/lib/delivery/bulk";
import { saveDefaultSample, applySeo, renameProduct, createProduct, duplicateProduct, getProductRow, setProductSlug, importBuiltin, setLastUpdated, updateProduct } from "@/lib/import/store";
import { maskRows } from "@/lib/product-samples";
import { saveSamples, saveSamplesBySlug } from "@/lib/import/store";
import { getStaticProducts } from "@/lib/catalog";
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
  it("publish gate: restricted-flagged products can be published (owner decision), complete one is buyable", async () => {
    const db = getDbFromEnv(env);
    const list = (await listProducts(db, {}, 1)).rows;
    const clean = list.find((r) => r.sourceId === "20")!, consumer = list.find((r) => r.sourceId === "30")!;
    const r = await setStatus(db, [clean.id, consumer.id], "published");
    expect(r.changed).toBe(2); expect(r.refused).toEqual([]); expect(Array.isArray(r.noLink)).toBe(true);
    await env.CACHE.delete("catalog:imp:v2");
    await hydrateCatalog(env, true);
    const p = getProduct(clean.slug)!;
    expect(p).toBeTruthy(); expect(p.imported).toBe(true);
    expect(getProduct(consumer.slug)).toBeTruthy();
    const priced = priceCart([{ slug: clean.slug, pkg: "Complete" }], { checkoutOpen: true, allowPlaceholder: false });
    expect(priced.lines[0].purchasable).toBe(true);
    expect(priced.lines[0].priceCents).toBe(9900);
    const link = await env.DB.prepare("SELECT url FROM delivery_links WHERE product_slug = ?").bind(clean.slug).first<{ url: string }>();
    expect(link?.url).toMatch(/^https:\/\//);
  });
  it("bulk delivery links work for draft imported products, skip existing unless replace is ticked", async () => {
    const db = getDbFromEnv(env);
    const draft = (await listProducts(db, { status: "draft" }, 1)).rows[0];
    const r1 = await applyLinks(db, "t@test", [{ slug: draft.slug, pkg: "", url: "https://files.example.com/one" }, { slug: "nope", pkg: "", url: "https://x.com/a" }, { slug: draft.slug, pkg: "", url: "http://insecure.com" }], false);
    expect(r1.map((o) => o.result)).toEqual(["added", "failed", "failed"]);
    const r2 = await applyLinks(db, "t@test", [{ slug: draft.slug, pkg: "", url: "https://files.example.com/two" }], false);
    expect(r2[0].result).toBe("skipped");
    const r3 = await applyLinks(db, "t@test", [{ slug: draft.slug, pkg: "", url: "https://files.example.com/two" }], true);
    expect(r3[0].result).toBe("replaced");
    const r4 = await applyLinks(db, "t@test", [{ slug: draft.slug, pkg: "", url: "https://files.example.com/two" }], true);
    expect(r4[0].result).toBe("same");
  });
  it("edits name, packages and SEO text, keeps the source download link, and guards published prices", async () => {
    const db = getDbFromEnv(env);
    const pub = (await listProducts(db, { status: "published" }, 1)).rows.find((r) => r.sourceId === "20")!;
    const before = (await getProductRow(db, pub.id))!;
    const pk = JSON.parse(before.packagesJson) as { name: "Starter" | "Professional" | "Complete"; records: number; priceUsdCents: number; link?: string }[];
    const edit = { name: "Renamed list", title: "", description: "Edited.", seoTitle: "Custom SEO title", metaDescription: "", recordCount: 4321, dataFields: ["Email", "Phone"], fileFormats: "CSV", coverage: "Everywhere", lastUpdated: "2026-11-01", placeholder: false, forSale: true, packages: pk.map((k) => ({ name: k.name, records: k.records, priceUsdCents: 1234 })) };
    expect((await updateProduct(db, pub.id, edit)).ok).toBe(true);
    const after = (await getProductRow(db, pub.id))!;
    expect(after.recordCount).toBe(4321); expect(after.lastUpdated).toBe("2026-11-01"); expect(JSON.parse(after.dataFieldsJson)).toEqual(["Email", "Phone"]); expect(after.name).toBe("Renamed list"); expect(after.title).toBe("Renamed list"); expect(after.seoTitle).toBe("Custom SEO title"); expect(after.metaDescription).toBeNull();
    const links = (JSON.parse(after.packagesJson) as { link?: string }[]).map((k) => k.link);
    expect(links).toEqual(pk.map((k) => k.link));
    // Real figures saved while the old placeholder flag is still ticked: the flag clears so visitors see the count and price.
    await db.update(schema.catalogProducts).set({ placeholder: 1, recordCount: 7 }).where(eq(schema.catalogProducts.id, pub.id));
    expect((await updateProduct(db, pub.id, { ...edit, placeholder: true, recordCount: 5555 })).ok).toBe(true);
    expect((await getProductRow(db, pub.id))!.placeholder).toBe(0);
    const zero = await updateProduct(db, pub.id, { ...edit, packages: edit.packages.map((k) => ({ ...k, priceUsdCents: 0 })) });
    expect(zero.ok).toBe(false);
    expect((await updateProduct(db, pub.id, { ...edit, packages: [edit.packages[0], edit.packages[0]] })).ok).toBe(false);
    // Category editor: a new name creates a category, the choice is remembered, a name used by a site page is refused.
    expect((await updateProduct(db, pub.id, { ...edit, categoryName: "Zoo Keepers" })).ok).toBe(true);
    const moved = (await getProductRow(db, pub.id))!;
    expect(moved.categoryName).toBe("Zoo Keepers"); expect(moved.categorySlug).toBe("zoo-keepers"); expect(JSON.parse(moved.sourceJson).manualCategory).toBe(true);
    expect((await updateProduct(db, pub.id, { ...edit, categoryName: "Cities" })).ok).toBe(false);
    // Extra categories: stored beside the main one, never duplicated, removable.
    expect((await updateProduct(db, pub.id, { ...edit, categoryName: "Zoo Keepers", extraCategories: ["Farm Shops", "zoo keepers", "Farm Shops"] })).ok).toBe(true);
    const withExtra = (await getProductRow(db, pub.id))!;
    expect(withExtra.categorySlug).toBe("zoo-keepers"); expect(JSON.parse(withExtra.sourceJson).extraCategories).toEqual([{ slug: "farm-shops", name: "Farm Shops" }]);
    expect((await updateProduct(db, pub.id, { ...edit, extraCategories: [] })).ok).toBe(true);
    expect(JSON.parse((await getProductRow(db, pub.id))!.sourceJson).extraCategories).toBeUndefined();
    expect((await getProductRow(db, pub.id))!.categoryName).toBe("Zoo Keepers");
  });
  it("built-in products become editable rows that replace the code version, and unpublishing hides them", async () => {
    const db = getDbFromEnv(env);
    const a = await importBuiltin(db);
    expect(a.added).toBe(getStaticProducts().length);
    expect((await importBuiltin(db)).added).toBe(0);
    const row = (await db.select().from(schema.catalogProducts).where(eq(schema.catalogProducts.slug, "dentists-us")))[0];
    expect(row.origin).toBe("builtin"); expect(row.forSale).toBe(0); expect(row.placeholder).toBe(1);
    const pk = JSON.parse(row.packagesJson) as { name: "Starter" | "Professional" | "Complete"; records: number; priceUsdCents: number }[];
    await setStatus(db, [row.id], "published");
    expect((await updateProduct(db, row.id, { name: "Dentist Email List", title: "", description: "Real.", seoTitle: "", metaDescription: "", recordCount: 777, dataFields: ["Email"], fileFormats: "CSV", coverage: "", lastUpdated: "2026-11-19", placeholder: false, forSale: true, packages: pk })).ok).toBe(true);
    await env.CACHE.delete("catalog:imp:v2"); await hydrateCatalog(env, true);
    const live = getProduct("dentists-us")!;
    expect(live.recordCount).toBe(777); expect(live.status).toBe("live"); expect(live.placeholderData).toBe(false); expect(live.lastVerified).toBe("2026-11-19"); expect(live.fileFormats).toBe("CSV");
    await setStatus(db, [row.id], "draft");
    await env.CACHE.delete("catalog:imp:v2"); await hydrateCatalog(env, true);
    expect(getProduct("dentists-us")).toBeUndefined(); // unpublished built-in is hidden, not shown from code
    await setStatus(db, [row.id], "published");
  });
  it("creates a draft by hand, duplicates it with a free slug and no link, and bulk-sets last updated", async () => {
    const db = getDbFromEnv(env);
    const c = await createProduct(db, { name: "Hand Made List", title: "", description: "", seoTitle: "", metaDescription: "", recordCount: 10, dataFields: [], fileFormats: "", coverage: "", lastUpdated: "", placeholder: false, forSale: true, packages: [{ name: "Starter", records: 10, priceUsdCents: 500 }], categoryName: "Lawyers", countryName: "Canada", countryCode: "ca", region: "", channel: "business-email" });
    expect(c.ok).toBe(true); expect(c.slug).toBe("hand-made-list");
    const row = (await getProductRow(db, c.id!))!;
    expect(row.status).toBe("draft"); expect(row.origin).toBe("manual"); expect(row.countryCode).toBe("CA");
    const d1 = await duplicateProduct(db, c.id!), d2 = await duplicateProduct(db, c.id!);
    expect(d1.slug).toBe("hand-made-list-copy"); expect(d2.slug).toBe("hand-made-list-copy-2");
    const n = await setLastUpdated(db, [c.id!, d1.id!, d2.id!], "2026-11-20");
    expect(n).toBe(3); expect((await getProductRow(db, d2.id!))!.lastUpdated).toBe("2026-11-20");
    await expect(setLastUpdated(db, [c.id!], "yesterday")).rejects.toThrow();
  });
  it("stores only MASKED sample rows and shows them on the hydrated product; unknown slugs are reported", async () => {
    const db = getDbFromEnv(env);
    const pub = (await listProducts(db, { status: "published" }, 1)).rows.find((r) => r.origin !== "builtin")!;
    const rows = maskRows([{ business: "Acme Dental", email: "owner@acme.com", phone: "(205) 555-0142", address: "12 Main St", city: "Mobile", website: "https://acme.com/x" }]);
    expect(await saveSamples(db, pub.id, rows)).toBe(true);
    const stored = (await getProductRow(db, pub.id))!.sampleJson!;
    expect(stored).not.toContain("owner@"); expect(stored).not.toContain("0142"); expect(stored).toContain("o***@acme.com");
    await env.CACHE.delete("catalog:imp:v2"); await hydrateCatalog(env, true);
    expect(getProduct(pub.slug)!.samples?.[0]).toMatchObject({ business: "Acme Dental", phone: "(205) 555-****", website: "acme.com" });
    const r = await saveSamplesBySlug(db, [{ slug: pub.slug, rows: [] }, { slug: "no-such-product", rows }]);
    expect(r).toEqual({ saved: 1, unknown: ["no-such-product"] });
    await env.CACHE.delete("catalog:imp:v2"); await hydrateCatalog(env, true);
    expect(getProduct(pub.slug)!.samples).toBeUndefined();
  });
  it("SEO regeneration renames slugs with redirects, moves delivery links and rewrites name/title", async () => {
    const db = getDbFromEnv(env);
    const c = await createProduct(db, { name: "Best Plumbers Email Database USA", title: "", description: "", seoTitle: "", metaDescription: "", recordCount: 10, dataFields: [], fileFormats: "", coverage: "", lastUpdated: "", placeholder: false, forSale: true, packages: [{ name: "Starter", records: 10, priceUsdCents: 500 }], categoryName: "Plumbers", countryName: "United States", countryCode: "US", region: "", channel: "business-email" });
    const old = c.slug!;
    await db.insert(schema.deliveryLinks).values({ productSlug: old, packageName: "", url: "https://example.com/x", updatedBy: "t" });
    const r = await applySeo(db, [c.id!], { slugs: true, names: true, titles: true });
    expect(r.slugChanged).toBe(1);
    const row = (await getProductRow(db, c.id!))!;
    expect(row.slug).not.toBe(old); expect(row.name).toContain("Plumbers Email List"); expect(row.seoTitle!.length).toBeLessThanOrEqual(62);
    expect((await db.select().from(schema.slugAliases).where(eq(schema.slugAliases.oldSlug, old)))[0].newSlug).toBe(row.slug);
    expect((await db.select().from(schema.deliveryLinks).where(eq(schema.deliveryLinks.productSlug, row.slug))).length).toBe(1);
    const again = await renameProduct(db, c.id!, row.slug);
    expect(again.changed).toBe(false);
    const second = await renameProduct(db, c.id!, "plumbers-list");
    expect(second.changed).toBe(true);
    expect((await db.select().from(schema.slugAliases).where(eq(schema.slugAliases.oldSlug, old)))[0].newSlug).toBe("plumbers-list");
  });
  it("admin slug edit: redirects old URL, refuses taken, reserved and empty slugs", async () => {
    const db = getDbFromEnv(env);
    const mk = (name: string) => createProduct(db, { name, title: "", description: "", seoTitle: "", metaDescription: "", recordCount: 10, dataFields: [], fileFormats: "", coverage: "", lastUpdated: "", placeholder: false, forSale: true, packages: [{ name: "Starter", records: 10, priceUsdCents: 500 }], categoryName: "Roofers", countryName: "United States", countryCode: "US", region: "", channel: "business-email" });
    const a = await mk("Roofers One"), b = await mk("Roofers Two");
    const ok = await setProductSlug(db, a.id!, "My Custom Roofers URL");
    expect(ok.ok).toBe(true); expect(ok.slug).toBe("my-custom-roofers-url");
    expect((await db.select().from(schema.slugAliases).where(eq(schema.slugAliases.oldSlug, a.slug!)))[0].newSlug).toBe("my-custom-roofers-url");
    expect((await setProductSlug(db, b.id!, "my-custom-roofers-url")).ok).toBe(false);
    expect((await setProductSlug(db, b.id!, a.slug!)).ok).toBe(false);
    expect((await setProductSlug(db, b.id!, "bundles")).ok).toBe(false);
    expect((await setProductSlug(db, b.id!, "  !!  ")).ok).toBe(false);
  });
  it("one real default sample is shown on every product without its own, and recategorizes catch-all products", async () => {
    const db = getDbFromEnv(env);
    await hydrateCatalog(env, true);
    expect(getDefaultSample().length).toBe(0);
    await saveDefaultSample(db, maskRows([{ business: "Real Dental", city: "Austin", email: "jane@realdental.com", phone: "+1 512 555 0142" }]), "t");
    await env.CACHE.delete("catalog:imp:v2"); await hydrateCatalog(env, true);
    expect(getDefaultSample().length).toBe(1);
    expect(getDefaultSample()[0].email.startsWith("j***@")).toBe(true);
    expect(JSON.stringify(getDefaultSample())).not.toContain("jane@");
    expect(sampleRowsOf("dentists-us").length).toBe(1);
    const c = await createProduct(db, { name: "Roofers Sales Leads USA", title: "", description: "", seoTitle: "", metaDescription: "", recordCount: 10, dataFields: [], fileFormats: "", coverage: "", lastUpdated: "", placeholder: false, forSale: true, packages: [{ name: "Starter", records: 10, priceUsdCents: 500 }], categoryName: "General Targeted Lists", countryName: "United States", countryCode: "US", region: "", channel: "business-email" });
    await applySeo(db, [c.id!], { slugs: false, names: false, titles: false, categories: true });
    const row = (await getProductRow(db, c.id!))!;
    expect(row.categoryName).toBe("Roofers"); expect(row.categorySlug).toBe("roofers");
  });
  it("rollback removes only unpublished, never-ordered imports", async () => {
    const db = getDbFromEnv(env);
    const [imp] = await db.select().from(schema.catalogImports);
    const r = await rollbackImport(db, imp.id);
    expect(r.kept).toBe(2); expect(r.removed).toBe(2);
  });
});
