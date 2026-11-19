// Featured image system against a LOCAL D1 + R2: file checks, AVIF, dimensions, metadata, crop link, post fields.
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkDimensions, dimensions, deleteMedia, mediaByUrl, originalUrlOf, saveUpload, setMediaMeta, sniff } from "@/lib/blog/media";
import { createPost, getPost, savePost, type PostInput } from "@/lib/blog/posts";
import { BlogError } from "@/lib/blog/taxonomy";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
const A = "admin@test.dev";

/** Minimal valid PNG header with the given size (enough for sniffing and dimensions). */
function png(w: number, h: number) {
  const b = new Uint8Array(33);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  new DataView(b.buffer).setUint32(16, w); new DataView(b.buffer).setUint32(20, h);
  return b;
}
function avif(w: number, h: number) {
  const b = new Uint8Array(64);
  b.set([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]); // ftyp avif
  b.set([0, 0, 0, 20, 0x69, 0x73, 0x70, 0x65, 0, 0, 0, 0], 28); // ispe box header
  new DataView(b.buffer).setUint32(40, w); new DataView(b.buffer).setUint32(44, h);
  return b;
}
const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Body" }] }] };
const input = (over: Partial<PostInput> = {}): PostInput => ({
  title: "t", slug: "t", excerpt: "x", categoryId: null, author: "", authorId: null, featuredImage: null, featuredAlt: "", seoTitle: "", metaDescription: "", canonicalUrl: "", noindex: false,
  ogTitle: "", ogDescription: "", ogImage: null, focusKeyword: "", related: [], tagIds: [], scheduledAt: null, doc, ...over,
});

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "fi-e2e-")) } });
  env = proxy.env;
  const files = readdirSync("drizzle").filter((f) => /^000[78]|^0010|^0012|^0013|^0026/.test(f) && f.endsWith(".sql")).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("file checks", () => {
  it("decides the type from bytes, including AVIF; refuses text and SVG", () => {
    expect(sniff(png(800, 450))).toBe("image/png");
    expect(sniff(avif(800, 450))).toBe("image/avif");
    expect(sniff(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(dimensions(avif(1600, 900), "image/avif")).toEqual({ width: 1600, height: 900 });
  });
  it("rejects tiny and huge images", () => {
    expect(() => checkDimensions({ width: 100, height: 100 })).toThrow(BlogError);
    expect(() => checkDimensions({ width: 9000, height: 100 })).toThrow(BlogError);
    expect(() => checkDimensions({ width: 1600, height: 900 })).not.toThrow();
    expect(() => checkDimensions(null)).not.toThrow();
  });
  it("upload refuses a wrong type and a tiny image", async () => {
    await expect(saveUpload(env, A, { name: "x.svg", bytes: new TextEncoder().encode("<svg/>") })).rejects.toThrow(BlogError);
    await expect(saveUpload(env, A, { name: "tiny.png", bytes: png(100, 100) })).rejects.toThrow(/too small/);
  });
});

describe("library, crops, metadata and post fields", () => {
  it("keeps the original, links the crop to it, and stores details", async () => {
    const orig = await saveUpload(env, A, { name: "Original Photo.png", bytes: png(2400, 1600) });
    const crop = await saveUpload(env, A, { name: "featured-blog.png", bytes: png(1600, 900) }, { originalId: orig.id });
    expect(crop.originalId).toBe(orig.id);
    expect(await originalUrlOf(env, orig.id)).toBe(orig.url);
    await setMediaMeta(env, crop.id, { title: "Hero", description: "A hero", attribution: "BeigeLeads", alt: "Filter funnel" });
    const m = await mediaByUrl(env, crop.url);
    expect(m).toMatchObject({ title: "Hero", attribution: "BeigeLeads", alt: "Filter funnel", originalId: orig.id });
    expect(await mediaByUrl(env, "https://evil.test/x.png")).toBeNull();
  });

  it("saves caption and focal point (clamped) with the article, and the image stays linked", async () => {
    const m = await saveUpload(env, A, { name: "f.png", bytes: png(1600, 900) });
    const id = await createPost(env, A);
    await savePost(env, A, id, input({ slug: "fi-post", featuredImage: m.url, featuredAlt: "alt", featuredCaption: "Cap", featuredFocalX: 120, featuredFocalY: 25 }), 1, "manual");
    const p = await getPost(env, id);
    expect(p).toMatchObject({ featuredImage: m.url, featuredAlt: "alt", featuredCaption: "Cap", featuredFocalX: 100, featuredFocalY: 25 });
    await expect(deleteMedia(env, m.id, false)).rejects.toThrow(/used in 1 article/);
  });

  it("an article saved without the new fields keeps safe defaults", async () => {
    const id = await createPost(env, A);
    await savePost(env, A, id, input({ slug: "plain" }), 1, "manual");
    expect((await getPost(env, id))).toMatchObject({ featuredCaption: "", featuredFocalX: 50, featuredFocalY: 50 });
  });
});
