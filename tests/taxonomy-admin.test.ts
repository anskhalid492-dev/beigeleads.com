import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv } from "@/lib/db";
import { TAXONOMY, taxonomyPaths } from "@/lib/taxonomy";
import { buildTree, catalogProductOptions, cleanNode, deleteNode, importBuiltIn, loadTaxonomy, loadTaxonomyAdmin, menuTree, moveNode, saveNode, setNodePublished, type NodeInput } from "@/lib/taxonomy-store";

const products = catalogProductOptions().map((p) => p.slug);
const ctx = { topSlugs: ["email-lists"], isNew: true, productSlugs: products, industrySlugs: ["dentists"] };
const base: NodeInput = { parent: "", slug: "", name: "Fax Lists", menuName: "", icon: "mail", short: "", blurb: "", status: "upcoming", compliance: "", featured: false, menuVisible: true, published: true, seoTitle: "", metaDescription: "", content: "", products: [] };

describe("taxonomy validation", () => {
  it("accepts an upcoming category and slugifies the name", () => {
    expect(cleanNode(base, ctx).value?.slug).toBe("fax-lists");
  });
  it("blocks collisions, bad parents and bad icons", () => {
    expect(cleanNode({ ...base, slug: "email-lists" }, ctx).error).toMatch(/already/);
    expect(cleanNode({ ...base, slug: "dentists" }, ctx).error).toMatch(/already/);
    expect(cleanNode({ ...base, parent: "nope" }, ctx).error).toMatch(/parent/);
    expect(cleanNode({ ...base, icon: "skull" }, ctx).error).toMatch(/icon/);
    expect(cleanNode({ ...base, name: "x" }, ctx).error).toBeTruthy();
  });
  it("Available needs a real product; consumer, WhatsApp and phone can never be Available", () => {
    expect(cleanNode({ ...base, status: "available" }, ctx).error).toMatch(/product/);
    expect(cleanNode({ ...base, status: "available", products: ["fake-product"] }, ctx).error).toMatch(/product/);
    expect(cleanNode({ ...base, status: "available", products: [products[0]] }, ctx).value?.status).toBe("available");
    for (const c of ["consumer", "whatsapp", "phone"]) expect(cleanNode({ ...base, status: "available", compliance: c, products: [products[0]] }, ctx).error).toMatch(/cannot be marked Available/);
  });
});

describe("taxonomy store (local D1)", () => {
  let proxy: PlatformProxy<CloudflareEnv>;
  let env: CloudflareEnv;
  let db: ReturnType<typeof getDbFromEnv>;
  beforeAll(async () => {
    proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "tax-x-")) } });
    env = proxy.env as CloudflareEnv;
    const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
    const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
    for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
    db = getDbFromEnv(env);
  }, 60_000);
  afterAll(async () => { await proxy?.dispose(); });

  it("uses the built-in tree while the table is empty", async () => {
    expect((await loadTaxonomy(env, db)).map((g) => g.slug)).toEqual(TAXONOMY.map((g) => g.slug));
  });
  it("imports the built-in tree once, without duplicates", async () => {
    expect(await importBuiltIn(db)).toBeGreaterThan(30);
    expect(await importBuiltIn(db)).toBe(0);
    const { rows } = await loadTaxonomyAdmin(db);
    const tree = buildTree(rows);
    expect(tree).toHaveLength(7);
    expect(tree[0].slug).toBe("email-lists");
    expect(tree[0].children.find((c) => c.slug === "b2c-email-lists")?.status).toBe("upcoming");
    expect(taxonomyPaths(tree)).toContain("/lists/email-lists/b2b-email-lists");
  });
  it("creates, hides from the menu, unpublishes and reorders", async () => {
    await env.CACHE.delete("taxonomy:v1");
    const v = cleanNode({ ...base, parent: "email-lists", name: "Fax Lists" }, { ...ctx, topSlugs: ["email-lists"] }).value!;
    const id = await saveNode(db, null, v);
    let tree = buildTree((await loadTaxonomyAdmin(db)).rows);
    const kids = () => tree.find((g) => g.slug === "email-lists")!.children.map((c) => c.slug);
    expect(kids().at(-1)).toBe("fax-lists");
    await moveNode(db, id, -1);
    tree = buildTree((await loadTaxonomyAdmin(db)).rows);
    expect(kids().at(-2)).toBe("fax-lists");
    // menu visibility
    await saveNode(db, id, { ...v, menuVisible: 0 });
    tree = buildTree((await loadTaxonomyAdmin(db)).rows);
    expect(menuTree(tree).find((g) => g.slug === "email-lists")!.children.some((c) => c.slug === "fax-lists")).toBe(false);
    // unpublish removes it from the public tree and sitemap
    await setNodePublished(db, id, false);
    await env.CACHE.delete("taxonomy:v1");
    const pub = await loadTaxonomy(env, db);
    expect(pub.find((g) => g.slug === "email-lists")!.children.some((c) => c.slug === "fax-lists")).toBe(false);
    expect(taxonomyPaths(pub).includes("/lists/email-lists/fax-lists")).toBe(false);
  });
  it("slug and parent stay fixed on edit; a category with children cannot be deleted", async () => {
    const { rows } = await loadTaxonomyAdmin(db);
    const child = rows.find((r) => r.slug === "fax-lists")!;
    await saveNode(db, child.id, { ...cleanNode({ ...base, parent: "email-lists", slug: "other", name: "Fax Lists 2" }, { ...ctx, isNew: false, topSlugs: ["email-lists"] }).value! });
    const after = (await loadTaxonomyAdmin(db)).rows.find((r) => r.id === child.id)!;
    expect(after.slug).toBe("fax-lists");
    expect(after.name).toBe("Fax Lists 2");
    const group = rows.find((r) => r.slug === "email-lists")!;
    expect(await deleteNode(db, group.id)).toBe(false);
    expect(await deleteNode(db, child.id)).toBe(true);
  });
});
