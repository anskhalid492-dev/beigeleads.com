// End to end test of the author system against a LOCAL D1 + R2 (wrangler emulator, temp folder).
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authorCategories, authorOptions, authorSitemap, authorUsage, cleanUrl, createAuthor, deleteAuthor, getAuthor, getPublicAuthorById, getPublicAuthorBySlug, listAuthors, publishedCount, slugify, updateAuthor } from "@/lib/blog/authors";
import { saveUpload } from "@/lib/blog/media";
import { createPost, listPublished, savePost, transition, type PostInput } from "@/lib/blog/posts";
import { getDbFromEnv, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
const ADMIN = "admin@test.dev";

const author = (over: Record<string, unknown> = {}) => ({
  fullName: "Sam Rivera", displayName: "Sam Rivera", slug: "sam-rivera", title: "Head of Data Quality", email: "sam@private.test", shortBio: "Runs verification.", fullBio: "Para one.\n\nPara <b>two</b>.",
  expertise: ["Email verification", "Email verification", "Local business data"], company: "BeigeLeads", location: "", photo: null as string | null,
  links: { linkedin: "linkedin.com/in/sam", twitter: "", website: "", github: "", other: "" }, seoTitle: "", metaDescription: "", ogImage: null, canonicalUrl: "", noindex: false, status: "published" as const, ...over,
});
const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Body" }] }] };
const post = (slug: string, authorId: number | null, name = ""): PostInput => ({
  title: slug, slug, excerpt: "x", categoryId: null, author: name, authorId, featuredImage: null, featuredAlt: "", seoTitle: "", metaDescription: "", canonicalUrl: "", noindex: false,
  ogTitle: "", ogDescription: "", ogImage: null, focusKeyword: "", related: [], tagIds: [], scheduledAt: null, doc,
});
async function publishedPost(slug: string, authorId: number | null) {
  const id = await createPost(env, ADMIN);
  const r = await savePost(env, ADMIN, id, post(slug, authorId), 1, "manual");
  await transition(env, ADMIN, id, "publish");
  void r;
  return id;
}

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "authors-e2e-")) } });
  env = proxy.env;
  const files = readdirSync("drizzle").filter((f) => /^000[78]|^001\d/.test(f) && f.endsWith(".sql")).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("url and slug helpers", () => {
  it("accepts only http(s) addresses", () => {
    expect(cleanUrl("linkedin.com/in/x")).toBe("https://linkedin.com/in/x");
    expect(cleanUrl("")).toBe("");
    expect(cleanUrl("javascript:alert(1)")).toBeNull();
    expect(cleanUrl("data:text/html,x")).toBeNull();
    expect(cleanUrl("https://user:pw@evil.com")).toBeNull();
    expect(cleanUrl("localhost")).toBeNull();
  });
  it("suggests a clean slug", () => expect(slugify("  Zoë O'Neil Jr.! ")).toBe("zoe-o-neil-jr"));
});

describe("authors end to end (local D1 + R2)", () => {
  let sam = 0, lee = 0;

  it("creates an author; email and duplicates are handled", async () => {
    const a = await createAuthor(env, ADMIN, author());
    sam = a.id;
    expect(a.email).toBe("sam@private.test");
    expect(JSON.parse(a.expertiseJson)).toEqual(["Email verification", "Local business data"]); // de-duplicated
    expect(JSON.parse(a.linksJson).linkedin).toBe("https://linkedin.com/in/sam");
    await expect(createAuthor(env, ADMIN, author({ fullName: "Other" }))).rejects.toThrow(/already uses/);
  });

  it("rejects bad input (links, photo path, slug)", async () => {
    await expect(createAuthor(env, ADMIN, author({ slug: "x1", links: { linkedin: "javascript:alert(1)", twitter: "", website: "", github: "", other: "" } }))).rejects.toThrow(/LinkedIn/);
    await expect(createAuthor(env, ADMIN, author({ slug: "x2", photo: "https://evil.com/a.png" }))).rejects.toThrow();
    await expect(createAuthor(env, ADMIN, author({ slug: "X Y" }))).rejects.toThrow();
    await expect(createAuthor(env, ADMIN, author({ slug: "x3", email: "nope" }))).rejects.toThrow();
  });

  it("photo upload is validated by file content", async () => {
    await expect(saveUpload(env, ADMIN, { name: "a.png", bytes: new TextEncoder().encode("<svg onload=alert(1)></svg>") })).rejects.toThrow(/Only JPEG/);
    const png = new Uint8Array(32); png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); new DataView(png.buffer).setUint32(16, 640); new DataView(png.buffer).setUint32(20, 640);
    const m = await saveUpload(env, ADMIN, { name: "me.png", bytes: png });
    expect(m.url).toMatch(/^\/media\/\d{4}\/[0-9a-f-]{36}\.png$/);
    await updateAuthor(env, ADMIN, sam, author({ photo: m.url }));
    expect((await getAuthor(env, sam))?.photo).toBe(m.url);
  });

  it("assigns the author to a post; byline data has no email; listing follows publish and reassign", async () => {
    const pid = await publishedPost("first-post", sam);
    const pub = await getPublicAuthorById(env, sam);
    expect(pub?.name).toBe("Sam Rivera");
    expect(JSON.stringify(pub)).not.toContain("private.test");
    expect(JSON.stringify(await getPublicAuthorBySlug(env, "sam-rivera"))).not.toContain("private.test");
    expect(await publishedCount(env, sam)).toBe(1);
    expect((await listPublished(env, { authorId: sam })).cards.map((c) => c.slug)).toEqual(["first-post"]);
    expect((await authorCategories(env, sam))).toEqual([]);
    expect((await authorSitemap(env)).map((x) => x.slug)).toContain("sam-rivera");
    // unpublished drafts never count
    const draft = await createPost(env, ADMIN);
    await savePost(env, ADMIN, draft, post("draft-post", sam), 1, "manual");
    expect(await publishedCount(env, sam)).toBe(1);
    expect((await listPublished(env, { authorId: sam })).total).toBe(1);
    void pid;
  });

  it("new posts never default the byline to an email", async () => {
    const id = await createPost(env, ADMIN);
    const [row] = await getDbFromEnv(env).select().from(schema.blogPosts).where(eq(schema.blogPosts.id, id));
    expect(row.author).toBe("");
  });

  it("renaming the display name updates the posts' byline text", async () => {
    await updateAuthor(env, ADMIN, sam, author({ displayName: "Samuel Rivera", photo: (await getAuthor(env, sam))?.photo ?? null }));
    const [row] = await getDbFromEnv(env).select().from(schema.blogPosts).where(eq(schema.blogPosts.slug, "first-post"));
    expect(row.author).toBe("Samuel Rivera");
  });

  it("a post can point to a missing author only by error", async () => {
    const id = await createPost(env, ADMIN);
    await expect(savePost(env, ADMIN, id, post("ghost", 9999), 1, "manual")).rejects.toThrow(/no longer exists/);
  });

  it("legacy posts keep their plain-text author", async () => {
    const id = await createPost(env, ADMIN);
    await savePost(env, ADMIN, id, post("legacy", null, "Old Name"), 1, "manual");
    const [row] = await getDbFromEnv(env).select().from(schema.blogPosts).where(eq(schema.blogPosts.id, id));
    expect(row.author).toBe("Old Name");
    expect(row.authorId).toBeNull();
  });

  it("a draft profile has no public page and cannot be hidden while it has published articles", async () => {
    await expect(updateAuthor(env, ADMIN, sam, author({ displayName: "Samuel Rivera", status: "draft", photo: (await getAuthor(env, sam))?.photo ?? null }))).rejects.toThrow(/published article/);
    const l = await createAuthor(env, ADMIN, author({ fullName: "Lee Park", displayName: "Lee Park", slug: "lee-park", email: "", status: "draft", links: { linkedin: "", twitter: "", website: "", github: "", other: "" } }));
    lee = l.id;
    expect(await getPublicAuthorBySlug(env, "lee-park")).toBeNull();
    expect(await getPublicAuthorById(env, lee)).toBeNull();
    expect((await authorOptions(env)).map((o) => o.name)).toContain("Lee Park"); // editors can still pick a draft profile
  });

  it("lists with search, sort and counts", async () => {
    const all = await listAuthors(env, { sort: "articles", dir: "desc" });
    expect(all.rows[0].displayName).toBe("Samuel Rivera");
    expect(all.rows[0].published).toBe(1);
    expect((await listAuthors(env, { q: "lee" })).rows.map((r) => r.displayName)).toEqual(["Lee Park"]);
    expect((await listAuthors(env, { q: "50%_" })).total).toBe(0);
  });

  it("deleting an author in use needs a replacement; then articles move over", async () => {
    expect((await authorUsage(env, sam)).published).toBe(1);
    await expect(deleteAuthor(env, sam, null)).rejects.toThrow(/Choose another author/);
    await expect(deleteAuthor(env, sam, sam)).rejects.toThrow(/different author/);
    await expect(deleteAuthor(env, sam, 4242)).rejects.toThrow(/does not exist/);
    expect(await getAuthor(env, sam)).not.toBeNull();
    await updateAuthor(env, ADMIN, lee, author({ fullName: "Lee Park", displayName: "Lee Park", slug: "lee-park", email: "", status: "published", links: { linkedin: "", twitter: "", website: "", github: "", other: "" } }));
    await deleteAuthor(env, sam, lee);
    expect(await getAuthor(env, sam)).toBeNull();
    expect(await publishedCount(env, lee)).toBe(1);
    const [row] = await getDbFromEnv(env).select().from(schema.blogPosts).where(eq(schema.blogPosts.slug, "first-post"));
    expect(row.authorId).toBe(lee);
    expect(row.author).toBe("Lee Park");
  });

  it("an author nobody uses is deleted directly", async () => {
    const x = await createAuthor(env, ADMIN, author({ slug: "temp-person", fullName: "Temp Person", displayName: "Temp Person", email: "" }));
    await deleteAuthor(env, x.id, null);
    expect(await getAuthor(env, x.id)).toBeNull();
  });
});
