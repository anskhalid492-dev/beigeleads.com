// End-to-end test of the blog data layer against a LOCAL D1 + R2 (wrangler's local emulator, in a temp folder).
// It runs the real lib code: create, save, conflict, revisions, scheduling, the cron job (publishDue) and public queries.
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv } from "@/lib/db";
import { confirm, confirmedCsv, csvCell, newsletterStats, subscribe, unsubscribe } from "@/lib/newsletter";
import { createPost, getPostForEdit, getPublishedBySlug, listPublished, listRevisions, publishDue, restoreRevision, savePost, transition, type PostInput } from "@/lib/blog/posts";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
const A = "admin@test.dev";

const doc = (text: string) => ({ type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Intro" }] }, { type: "paragraph", content: [{ type: "text", text }] }] });
const input = (title: string, slug: string, text: string): PostInput => ({
  title, slug, excerpt: "x", categoryId: null, author: "A", featuredImage: null, featuredAlt: "", seoTitle: "", metaDescription: "", canonicalUrl: "", noindex: false,
  ogTitle: "", ogDescription: "", ogImage: null, focusKeyword: "", related: [], tagIds: [], scheduledAt: null, doc: doc(text),
});

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "blog-e2e-")) } });
  env = proxy.env;
  const sql = ["drizzle/0007_blog_cms.sql", "drizzle/0008_newsletter.sql"].map((f) => readFileSync(f, "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("blog end to end (local D1 + R2)", () => {
  let id = 0, version = 1;

  it("creates and saves a draft; the body lives in R2", async () => {
    id = await createPost(env, A);
    const r = await savePost(env, A, id, input("Hello world", "hello-world", "First text."), 1, "manual");
    version = r.version;
    expect(version).toBe(2);
    const p = await getPostForEdit(env, id);
    expect(p?.row.slug).toBe("hello-world");
    expect(JSON.stringify(p?.doc)).toContain("First text.");
    expect(await getPublishedBySlug(env, "hello-world")).toBeNull(); // drafts are not public
  });

  it("refuses a save from a stale tab (no overwrite)", async () => {
    await expect(savePost(env, A, id, input("Hello world", "hello-world", "STALE"), 1, "manual")).rejects.toThrow("conflict");
    expect(JSON.stringify((await getPostForEdit(env, id))?.doc)).toContain("First text.");
  });

  it("records revisions and restores one as a new version", async () => {
    const r2 = await savePost(env, A, id, input("Hello world", "hello-world", "Second text."), version, "manual");
    version = r2.version;
    const revs = await listRevisions(env, id);
    expect(revs.length).toBeGreaterThanOrEqual(2);
    const first = revs[revs.length - 1];
    const restored = await restoreRevision(env, A, id, first.id, version);
    version = restored.version;
    expect(version).toBeGreaterThan(r2.version);
    expect(JSON.stringify((await getPostForEdit(env, id))?.doc)).toContain("First text.");
  });

  it("schedules a post: not live before its time, live and published by the cron after it", async () => {
    await transition(env, A, id, "schedule", Date.now() + 60_000);
    expect(await getPublishedBySlug(env, "hello-world")).toBeNull();
    expect((await listPublished(env, {})).total).toBe(0);
    expect(await publishDue(env)).toBe(0); // nothing due yet

    // time passes: move the schedule into the past (what waiting would do)
    await env.DB.prepare("UPDATE blog_posts SET scheduled_at = ? WHERE id = ?").bind(Math.floor(Date.now() / 1000) - 5, id).run(); // timestamps are stored in seconds
    const live = await getPublishedBySlug(env, "hello-world"); // visible even before the cron runs
    expect(live?.row.id).toBe(id);

    expect(await publishDue(env)).toBe(1);   // the cron job flips it
    expect(await publishDue(env)).toBe(0);   // and is idempotent
    const row = (await getPostForEdit(env, id))!.row;
    expect(row.status).toBe("published");
    expect(row.publishedAt).toBeTruthy();
    expect(row.scheduledAt).toBeNull();
    const audit = await getDbFromEnv(env).$client.prepare("SELECT actor, action FROM blog_audit WHERE post_id = ? AND actor = 'scheduler'").bind(id).all();
    expect(audit.results.length).toBe(1);
    expect((await listPublished(env, {})).total).toBe(1);
  });

  it("unpublish returns it to draft and hides it", async () => {
    await transition(env, A, id, "unpublish");
    expect(await getPublishedBySlug(env, "hello-world")).toBeNull();
  });
});

describe("newsletter double opt-in (local D1)", () => {
  it("is pending until confirmed, exports only confirmed, and unsubscribe removes it", async () => {
    await subscribe(env, "reader@example.com");
    expect((await newsletterStats(env)).pending).toBe(1);
    expect(await confirmedCsv(env)).not.toContain("reader@example.com");

    const token = ((await env.DB.prepare("SELECT token FROM newsletter_subscribers WHERE email = ?").bind("reader@example.com").first()) as { token: string }).token;
    expect(await confirm(env, "not-a-token")).toBe(false);
    expect(await confirm(env, token)).toBe(true);
    expect(await confirmedCsv(env)).toContain(`reader@example.com,`);
    expect(await confirmedCsv(env)).toContain(`unsubscribe?token=${token}`);

    await subscribe(env, "reader@example.com"); // signing up again must not reset a confirmed address
    expect((await newsletterStats(env)).confirmed).toBe(1);

    expect(await unsubscribe(env, token)).toBe(true);
    expect(await confirmedCsv(env)).not.toContain("reader@example.com");
    expect((await newsletterStats(env)).unsubscribed).toBe(1);
  });
  it("neutralises spreadsheet formulas in CSV cells", () => {
    expect(csvCell("=cmd@x.com")).toBe("'=cmd@x.com");
    expect(csvCell("a,b@x.com")).toBe('"a,b@x.com"');
  });
});
