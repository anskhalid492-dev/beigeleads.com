import { and, asc, desc, eq, inArray, like, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { cleanDoc, imagesOf, plainText, readingMinutes, slugifyText, type DocNode } from "./doc";
import { deletePrefix, readBody, readRevision, writeBody, writeRevision } from "./store";
import { BlogError } from "./taxonomy";

type Env = CloudflareEnv;
export type PostStatus = "draft" | "scheduled" | "published" | "archived";
export type Post = typeof schema.blogPosts.$inferSelect;

export type PostInput = {
  title: string; slug: string; excerpt: string; categoryId: number | null; author: string;
  featuredImage: string | null; featuredAlt: string; seoTitle: string; metaDescription: string; canonicalUrl: string; noindex: boolean;
  ogTitle: string; ogDescription: string; ogImage: string | null; focusKeyword: string;
  related: number[]; tagIds: number[]; scheduledAt: number | null; doc: unknown;
};

const AUTOSAVE_REVISION_GAP_MS = 10 * 60 * 1000;
const MAX_REVISIONS = 50;
const t = schema.blogPosts;

const s = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const url = (v: unknown) => { const x = s(v, 2000); if (!x) return ""; try { const u = new URL(x); return u.protocol === "https:" || u.protocol === "http:" ? x : ""; } catch { return ""; } };
const mediaPath = (v: unknown) => { const x = s(v, 600); return x.startsWith("/media/") && !x.includes("..") ? x : null; };

export async function audit(env: Env, postId: number | null, actor: string, action: string, detail = "") {
  await getDbFromEnv(env).insert(schema.blogAudit).values({ postId, actor, action, detail: detail.slice(0, 500) });
}

/** Suggests a slug that is not taken yet (adds -2, -3 ...). */
export async function uniqueSlug(env: Env, wanted: string, exceptId?: number): Promise<string> {
  const db = getDbFromEnv(env);
  const base = slugifyText(wanted).slice(0, 80) || "untitled";
  for (let i = 1; i < 200; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const hit = await db.select({ id: t.id }).from(t).where(eq(t.slug, slug)).limit(1);
    if (!hit[0] || hit[0].id === exceptId) return slug;
  }
  return `${base}-${Date.now()}`;
}

export async function createPost(env: Env, actor: string, title = "Untitled article") {
  const db = getDbFromEnv(env);
  const slug = await uniqueSlug(env, title);
  const [row] = await db.insert(t).values({ title: s(title, 200) || "Untitled article", slug, updatedBy: actor, author: actor }).returning({ id: t.id });
  await writeBody(env, row.id, cleanDoc(null));
  await audit(env, row.id, actor, "created");
  return row.id;
}

export async function getPost(env: Env, id: number) {
  const rows = await getDbFromEnv(env).select().from(t).where(eq(t.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getPostForEdit(env: Env, id: number) {
  const row = await getPost(env, id);
  if (!row) return null;
  const db = getDbFromEnv(env);
  const [doc, tags] = await Promise.all([readBody(env, id), db.select({ id: schema.blogPostTags.tagId }).from(schema.blogPostTags).where(eq(schema.blogPostTags.postId, id))]);
  return { row, doc, tagIds: tags.map((x) => x.id) };
}

/**
 * Saves a post. `expectedVersion` stops a stale tab from overwriting newer edits: the D1 update only
 * matches when the version is unchanged. Autosaves add a revision at most every 10 minutes.
 */
export async function savePost(env: Env, actor: string, id: number, input: PostInput, expectedVersion: number, kind: "autosave" | "manual" | "restore" = "manual") {
  const db = getDbFromEnv(env);
  const doc = cleanDoc(input.doc);
  const title = s(input.title, 200);
  if (!title) throw new BlogError("The article needs a title.");
  const slug = slugifyText(input.slug).slice(0, 100);
  if (!slug) throw new BlogError("The URL slug is empty.");
  const taken = await db.select({ id: t.id }).from(t).where(and(eq(t.slug, slug), ne(t.id, id))).limit(1);
  if (taken[0]) throw new BlogError("Another article already uses that slug.");

  const text = plainText(doc);
  const scheduledAt = input.scheduledAt && Number.isFinite(input.scheduledAt) ? new Date(input.scheduledAt) : null;
  const updated = await db.update(t).set({
    title, slug, excerpt: s(input.excerpt, 500), categoryId: input.categoryId, author: s(input.author, 120),
    featuredImage: mediaPath(input.featuredImage), featuredAlt: s(input.featuredAlt, 300), readingMinutes: readingMinutes(doc),
    searchText: text.replace(/\s+/g, " ").slice(0, 3000),
    seoTitle: s(input.seoTitle, 200), metaDescription: s(input.metaDescription, 400), canonicalUrl: url(input.canonicalUrl), noindex: !!input.noindex,
    ogTitle: s(input.ogTitle, 200), ogDescription: s(input.ogDescription, 400), ogImage: mediaPath(input.ogImage), focusKeyword: s(input.focusKeyword, 100),
    relatedJson: JSON.stringify(input.related.filter((n) => Number.isInteger(n) && n !== id).slice(0, 6)),
    scheduledAt, version: sql`${t.version} + 1`, updatedAt: new Date(), updatedBy: actor,
  }).where(and(eq(t.id, id), eq(t.version, expectedVersion))).returning({ version: t.version, updatedAt: t.updatedAt, status: t.status });
  if (!updated[0]) throw new BlogError("conflict");
  const v = updated[0];

  try {
    await writeBody(env, id, doc);
  } catch {
    await db.update(t).set({ version: expectedVersion }).where(and(eq(t.id, id), eq(t.version, v.version)));
    throw new BlogError("The article could not be stored. Nothing was changed. Try again.");
  }

  await db.delete(schema.blogPostTags).where(eq(schema.blogPostTags.postId, id));
  const tagIds = [...new Set(input.tagIds.filter(Number.isInteger))].slice(0, 20);
  if (tagIds.length) await db.insert(schema.blogPostTags).values(tagIds.map((tagId) => ({ postId: id, tagId }))).onConflictDoNothing();
  await syncMediaUsage(env, id, doc, mediaPath(input.featuredImage), mediaPath(input.ogImage));

  const last = await db.select({ at: schema.blogRevisions.createdAt }).from(schema.blogRevisions).where(eq(schema.blogRevisions.postId, id)).orderBy(desc(schema.blogRevisions.id)).limit(1);
  const due = kind !== "autosave" || !last[0] || Date.now() - last[0].at.getTime() > AUTOSAVE_REVISION_GAP_MS;
  if (due) await addRevision(env, id, actor, v.version, title, s(input.excerpt, 500), doc, kind);
  return { version: v.version, updatedAt: v.updatedAt.getTime(), status: v.status as PostStatus };
}

async function addRevision(env: Env, id: number, actor: string, version: number, title: string, excerpt: string, doc: DocNode, kind: string) {
  const db = getDbFromEnv(env);
  const key = await writeRevision(env, id, { title, excerpt, doc });
  await db.insert(schema.blogRevisions).values({ postId: id, version, title, r2Key: key, editor: actor, kind });
  const old = await db.select({ id: schema.blogRevisions.id, key: schema.blogRevisions.r2Key }).from(schema.blogRevisions).where(eq(schema.blogRevisions.postId, id)).orderBy(desc(schema.blogRevisions.id)).limit(1000).offset(MAX_REVISIONS); // SQLite needs a LIMIT before OFFSET
  if (old.length) {
    await env.LISTS.delete(old.map((o) => o.key));
    await db.delete(schema.blogRevisions).where(inArray(schema.blogRevisions.id, old.map((o) => o.id)));
  }
}

async function syncMediaUsage(env: Env, postId: number, doc: DocNode, featured: string | null, og: string | null) {
  const db = getDbFromEnv(env);
  const paths = new Set(imagesOf(doc).map((i) => i.src).filter((x) => x.startsWith("/media/")));
  if (featured) paths.add(featured);
  if (og) paths.add(og);
  await db.delete(schema.blogPostMedia).where(eq(schema.blogPostMedia.postId, postId));
  if (!paths.size) return;
  const keys = [...paths].map((p) => `blog${p}`);
  const rows = await db.select({ id: schema.blogMedia.id }).from(schema.blogMedia).where(inArray(schema.blogMedia.key, keys));
  if (rows.length) await db.insert(schema.blogPostMedia).values(rows.map((r) => ({ postId, mediaId: r.id }))).onConflictDoNothing();
}

export async function listRevisions(env: Env, id: number) {
  return getDbFromEnv(env).select().from(schema.blogRevisions).where(eq(schema.blogRevisions.postId, id)).orderBy(desc(schema.blogRevisions.id)).limit(MAX_REVISIONS);
}

export async function getRevision(env: Env, postId: number, revisionId: number) {
  const rows = await getDbFromEnv(env).select().from(schema.blogRevisions).where(and(eq(schema.blogRevisions.id, revisionId), eq(schema.blogRevisions.postId, postId))).limit(1);
  if (!rows[0]) return null;
  const snap = await readRevision(env, rows[0].r2Key);
  return snap ? { meta: rows[0], snap } : null;
}

/** Restores an old revision as a NEW version, so nothing is lost and the restore itself is in the history. */
export async function restoreRevision(env: Env, actor: string, postId: number, revisionId: number, expectedVersion: number) {
  const post = await getPostForEdit(env, postId);
  const rev = await getRevision(env, postId, revisionId);
  if (!post || !rev) throw new BlogError("That revision no longer exists.");
  const r = post.row;
  const input: PostInput = {
    title: rev.snap.title || r.title, slug: r.slug, excerpt: rev.snap.excerpt, categoryId: r.categoryId, author: r.author, featuredImage: r.featuredImage, featuredAlt: r.featuredAlt,
    seoTitle: r.seoTitle, metaDescription: r.metaDescription, canonicalUrl: r.canonicalUrl, noindex: r.noindex, ogTitle: r.ogTitle, ogDescription: r.ogDescription, ogImage: r.ogImage,
    focusKeyword: r.focusKeyword, related: JSON.parse(r.relatedJson || "[]"), tagIds: post.tagIds, scheduledAt: r.scheduledAt?.getTime() ?? null, doc: rev.snap.doc,
  };
  const out = await savePost(env, actor, postId, input, expectedVersion, "restore");
  await audit(env, postId, actor, "restored revision", `revision ${revisionId}`);
  return out;
}

// ---------- publishing workflow: draft -> scheduled -> published -> archived ----------

export type Action = "publish" | "schedule" | "unpublish" | "archive" | "restore";

export async function transition(env: Env, actor: string, id: number, action: Action, at?: number | null) {
  const db = getDbFromEnv(env);
  const post = await getPost(env, id);
  if (!post) throw new BlogError("Article not found.");
  const body = await readBody(env, id);
  const now = new Date();
  if (action === "publish" || action === "schedule") {
    if (!post.title.trim() || !post.slug) throw new BlogError("Add a title and a slug before publishing.");
    if (!plainText(body).trim()) throw new BlogError("The article is empty. Write something before publishing.");
  }
  if (action === "publish") {
    await db.update(t).set({ status: "published", publishedAt: post.publishedAt ?? now, scheduledAt: null, updatedAt: now, updatedBy: actor }).where(eq(t.id, id));
  } else if (action === "schedule") {
    if (!at || at <= Date.now() + 30_000) throw new BlogError("Pick a publication time in the future.");
    await db.update(t).set({ status: "scheduled", scheduledAt: new Date(at), updatedAt: now, updatedBy: actor }).where(eq(t.id, id));
  } else if (action === "unpublish") {
    await db.update(t).set({ status: "draft", scheduledAt: null, updatedAt: now, updatedBy: actor }).where(eq(t.id, id));
  } else if (action === "archive") {
    await db.update(t).set({ status: "archived", updatedAt: now, updatedBy: actor }).where(eq(t.id, id));
  } else {
    await db.update(t).set({ status: "draft", updatedAt: now, updatedBy: actor }).where(eq(t.id, id));
  }
  await audit(env, id, actor, action, action === "schedule" && at ? new Date(at).toISOString() : "");
}

/** Cron: flips due scheduled posts to published. Public queries also treat due posts as live, so a late cron never hides a post. */
export async function publishDue(env: { DB: D1Database } & Partial<CloudflareEnv>) {
  const db = getDbFromEnv(env);
  const due = await db.select({ id: t.id, at: t.scheduledAt }).from(t).where(and(eq(t.status, "scheduled"), lte(t.scheduledAt, new Date())));
  for (const p of due) {
    const r = await db.update(t).set({ status: "published", publishedAt: p.at, scheduledAt: null, updatedAt: new Date() }).where(and(eq(t.id, p.id), eq(t.status, "scheduled"))).returning({ id: t.id });
    if (r[0]) await db.insert(schema.blogAudit).values({ postId: p.id, actor: "scheduler", action: "published (scheduled)", detail: p.at?.toISOString() ?? "" });
  }
  return due.length;
}

export async function duplicatePost(env: Env, actor: string, id: number) {
  const src = await getPostForEdit(env, id);
  if (!src) throw new BlogError("Article not found.");
  const db = getDbFromEnv(env);
  const slug = await uniqueSlug(env, `${src.row.slug}-copy`);
  const r = src.row;
  const [row] = await db.insert(t).values({
    slug, title: `${r.title} (copy)`, excerpt: r.excerpt, status: "draft", categoryId: r.categoryId, author: r.author, featuredImage: r.featuredImage, featuredAlt: r.featuredAlt,
    readingMinutes: r.readingMinutes, searchText: r.searchText, seoTitle: r.seoTitle, metaDescription: r.metaDescription, noindex: r.noindex, ogTitle: r.ogTitle, ogDescription: r.ogDescription,
    ogImage: r.ogImage, focusKeyword: r.focusKeyword, relatedJson: r.relatedJson, updatedBy: actor,
  }).returning({ id: t.id });
  await writeBody(env, row.id, src.doc);
  if (src.tagIds.length) await db.insert(schema.blogPostTags).values(src.tagIds.map((tagId) => ({ postId: row.id, tagId })));
  await syncMediaUsage(env, row.id, src.doc, r.featuredImage, r.ogImage);
  await audit(env, row.id, actor, "duplicated", `from ${id}`);
  return row.id;
}

export async function deletePost(env: Env, actor: string, id: number) {
  const db = getDbFromEnv(env);
  await db.delete(schema.blogPostTags).where(eq(schema.blogPostTags.postId, id));
  await db.delete(schema.blogPostMedia).where(eq(schema.blogPostMedia.postId, id));
  await db.delete(schema.blogRevisions).where(eq(schema.blogRevisions.postId, id));
  await db.delete(t).where(eq(t.id, id));
  await deletePrefix(env, `blog/posts/${id}/`);
  await audit(env, id, actor, "deleted");
}

// ---------- admin list ----------

export type ListFilter = { q?: string; status?: PostStatus | ""; categoryId?: number; author?: string; sort?: "updated" | "title" | "published"; page?: number; perPage?: number };

export async function listPosts(env: Env, f: ListFilter) {
  const db = getDbFromEnv(env);
  const per = f.perPage ?? 15;
  const page = Math.max(1, f.page ?? 1);
  const where: SQL[] = [];
  if (f.status) where.push(eq(t.status, f.status));
  if (f.categoryId) where.push(eq(t.categoryId, f.categoryId));
  if (f.author) where.push(eq(t.author, f.author));
  if (f.q) { const q = `%${f.q.replace(/[%_]/g, "")}%`; where.push(or(like(t.title, q), like(t.slug, q), like(t.excerpt, q))!); }
  const w = where.length ? and(...where) : undefined;
  const order = f.sort === "title" ? asc(t.title) : f.sort === "published" ? desc(t.publishedAt) : desc(t.updatedAt);
  const [rows, total] = await Promise.all([
    db.select({ id: t.id, title: t.title, slug: t.slug, status: t.status, author: t.author, featuredImage: t.featuredImage, publishedAt: t.publishedAt, scheduledAt: t.scheduledAt, updatedAt: t.updatedAt, categoryName: schema.blogCategories.name })
      .from(t).leftJoin(schema.blogCategories, eq(schema.blogCategories.id, t.categoryId)).where(w).orderBy(order).limit(per).offset((page - 1) * per),
    db.select({ n: sql<number>`count(*)` }).from(t).where(w),
  ]);
  return { rows, total: total[0]?.n ?? 0, per, page };
}

export async function blogStats(env: Env) {
  const db = getDbFromEnv(env);
  const [byStatus, recent, authors] = await Promise.all([
    db.select({ status: t.status, n: sql<number>`count(*)` }).from(t).groupBy(t.status),
    db.select({ id: t.id, title: t.title, status: t.status, updatedAt: t.updatedAt, updatedBy: t.updatedBy }).from(t).orderBy(desc(t.updatedAt)).limit(5),
    db.select({ author: t.author }).from(t).groupBy(t.author),
  ]);
  const n = (s: string) => byStatus.find((x) => x.status === s)?.n ?? 0;
  return { total: byStatus.reduce((a, b) => a + b.n, 0), published: n("published"), draft: n("draft"), scheduled: n("scheduled"), archived: n("archived"), recent, authors: authors.map((a) => a.author).filter(Boolean) };
}

export async function postOptions(env: Env, exceptId?: number) {
  const rows = await getDbFromEnv(env).select({ id: t.id, title: t.title, slug: t.slug }).from(t).orderBy(desc(t.updatedAt)).limit(200);
  return rows.filter((r) => r.id !== exceptId);
}

// ---------- public queries ----------

const live = () => {
  const now = new Date();
  return or(and(eq(t.status, "published"), lte(t.publishedAt, now)), and(eq(t.status, "scheduled"), lte(t.scheduledAt, now)))!;
};

export type PublicCard = { id: number; slug: string; title: string; excerpt: string; featuredImage: string | null; featuredAlt: string; readingMinutes: number; author: string; at: Date; categoryName: string | null; categorySlug: string | null };

const cardCols = { id: t.id, slug: t.slug, title: t.title, excerpt: t.excerpt, featuredImage: t.featuredImage, featuredAlt: t.featuredAlt, readingMinutes: t.readingMinutes, author: t.author, publishedAt: t.publishedAt, scheduledAt: t.scheduledAt, categoryName: schema.blogCategories.name, categorySlug: schema.blogCategories.slug };
const toCard = (r: { publishedAt: Date | null; scheduledAt: Date | null } & Omit<PublicCard, "at">): PublicCard => ({ ...r, at: (r.publishedAt ?? r.scheduledAt ?? new Date(0)) });

export async function listPublished(env: Env, o: { q?: string; categoryId?: number; tagId?: number; page?: number; per?: number }) {
  const db = getDbFromEnv(env);
  const per = o.per ?? 9;
  const page = Math.max(1, o.page ?? 1);
  const where: SQL[] = [live()];
  if (o.categoryId) where.push(eq(t.categoryId, o.categoryId));
  if (o.tagId) where.push(sql`${t.id} in (select post_id from blog_post_tags where tag_id = ${o.tagId})`);
  if (o.q) { const q = `%${o.q.replace(/[%_]/g, "").slice(0, 80)}%`; where.push(or(like(t.title, q), like(t.excerpt, q), like(t.searchText, q))!); }
  const [rows, total] = await Promise.all([
    db.select(cardCols).from(t).leftJoin(schema.blogCategories, eq(schema.blogCategories.id, t.categoryId)).where(and(...where)).orderBy(desc(sql`coalesce(${t.publishedAt}, ${t.scheduledAt})`)).limit(per).offset((page - 1) * per),
    db.select({ n: sql<number>`count(*)` }).from(t).where(and(...where)),
  ]);
  return { cards: rows.map((r) => toCard(r as never)), total: total[0]?.n ?? 0, per, page };
}

export async function getPublishedBySlug(env: Env, slug: string) {
  const db = getDbFromEnv(env);
  const rows = await db.select().from(t).where(and(eq(t.slug, slug), live())).limit(1);
  const row = rows[0];
  if (!row) return null;
  const [doc, cat, tags] = await Promise.all([
    readBody(env, row.id),
    row.categoryId ? db.select().from(schema.blogCategories).where(eq(schema.blogCategories.id, row.categoryId)).limit(1) : Promise.resolve([]),
    db.select({ id: schema.blogTags.id, name: schema.blogTags.name, slug: schema.blogTags.slug }).from(schema.blogPostTags).innerJoin(schema.blogTags, eq(schema.blogTags.id, schema.blogPostTags.tagId)).where(eq(schema.blogPostTags.postId, row.id)),
  ]);
  return { row, doc, category: cat[0] ?? null, tags };
}

export async function relatedPublished(env: Env, row: Post, limit = 3): Promise<PublicCard[]> {
  const db = getDbFromEnv(env);
  const picked: number[] = (() => { try { return JSON.parse(row.relatedJson); } catch { return []; } })();
  const sel = db.select(cardCols).from(t).leftJoin(schema.blogCategories, eq(schema.blogCategories.id, t.categoryId));
  const manual = picked.length ? await sel.where(and(live(), inArray(t.id, picked))).limit(limit) : [];
  if (manual.length >= limit) return manual.map((r) => toCard(r as never));
  const more = await db.select(cardCols).from(t).leftJoin(schema.blogCategories, eq(schema.blogCategories.id, t.categoryId))
    .where(and(live(), ne(t.id, row.id), row.categoryId ? eq(t.categoryId, row.categoryId) : undefined)).orderBy(desc(sql`coalesce(${t.publishedAt}, ${t.scheduledAt})`)).limit(limit);
  const seen = new Set(manual.map((m) => m.id));
  return [...manual, ...more.filter((m) => !seen.has(m.id))].slice(0, limit).map((r) => toCard(r as never));
}

export async function publishedCategories(env: Env) {
  const db = getDbFromEnv(env);
  const cats = await db.select().from(schema.blogCategories).orderBy(asc(schema.blogCategories.name));
  const counts = await db.select({ id: t.categoryId, n: sql<number>`count(*)` }).from(t).where(live()).groupBy(t.categoryId);
  return cats.map((c) => ({ ...c, posts: counts.find((x) => x.id === c.id)?.n ?? 0 })).filter((c) => c.posts > 0);
}

export async function publishedSitemap(env: { DB: D1Database }) {
  const db = getDbFromEnv(env);
  return db.select({ slug: t.slug, updatedAt: t.updatedAt, noindex: t.noindex, canonicalUrl: t.canonicalUrl }).from(t).where(live());
}
