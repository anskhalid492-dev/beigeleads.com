import { and, asc, eq, like, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDbFromEnv, schema } from "@/lib/db";
import { live } from "./posts";
import { BlogError } from "./taxonomy";

type Env = CloudflareEnv;
const a = schema.blogAuthors;
const p = schema.blogPosts;

export type AuthorRow = typeof a.$inferSelect;

export const LINK_KEYS = ["linkedin", "twitter", "website", "github", "other"] as const;
export type LinkKey = (typeof LINK_KEYS)[number];
export type AuthorLinks = Partial<Record<LinkKey, string>>;
export const LINK_LABELS: Record<LinkKey, string> = { linkedin: "LinkedIn", twitter: "X / Twitter", website: "Website", github: "GitHub", other: "Other profile" };

/** Only http(s) URLs without credentials. Anything else (javascript:, data:, mailto:) is refused. */
export function cleanUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (!["http:", "https:"].includes(u.protocol) || u.username || u.password || !u.hostname.includes(".")) return null;
    return u.toString().slice(0, 500);
  } catch { return null; }
}

export const slugify = (s: string) => s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

/** Photos and OG images must be images we stored ourselves (/media/...). */
const mediaPath = z.string().max(300).regex(/^\/media\/[\w./-]+$/, "Use a photo uploaded here.").refine((v) => !v.includes(".."), "Invalid path.");

const text = (max: number) => z.string().trim().max(max);
export const authorSchema = z.object({
  fullName: text(120).min(2, "Enter the full name."),
  displayName: text(80).min(2, "Enter the display name."),
  slug: text(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens."),
  title: text(120),
  email: text(200).refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email."),
  shortBio: text(300),
  fullBio: text(4000),
  expertise: z.array(text(60).min(1)).max(12),
  company: text(120),
  location: text(120),
  photo: mediaPath.nullable(),
  links: z.object({ linkedin: text(500), twitter: text(500), website: text(500), github: text(500), other: text(500) }),
  seoTitle: text(120),
  metaDescription: text(300),
  ogImage: mediaPath.nullable(),
  canonicalUrl: text(500),
  noindex: z.boolean(),
  status: z.enum(["draft", "published"]),
});
export type AuthorInput = z.infer<typeof authorSchema>;

function normaliseLinks(links: AuthorInput["links"]): AuthorLinks {
  const out: AuthorLinks = {};
  for (const k of LINK_KEYS) {
    const c = cleanUrl(links[k] ?? "");
    if (c === null) throw new BlogError(`${LINK_LABELS[k]}: enter a valid web address starting with https://.`);
    if (c) out[k] = c;
  }
  return out;
}

export const parseLinks = (json: string): AuthorLinks => {
  try {
    const o = JSON.parse(json) as Record<string, unknown>;
    const out: AuthorLinks = {};
    for (const k of LINK_KEYS) { const c = typeof o[k] === "string" ? cleanUrl(o[k] as string) : null; if (c) out[k] = c; }
    return out;
  } catch { return {}; }
};
export const parseExpertise = (json: string): string[] => {
  try { const v = JSON.parse(json); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 12) : []; } catch { return []; }
};

const mapInput = (i: AuthorInput) => {
  const canonical = i.canonicalUrl ? cleanUrl(i.canonicalUrl) : "";
  if (canonical === null) throw new BlogError("Canonical URL: enter a valid web address starting with https://.");
  return {
    slug: i.slug, fullName: i.fullName, displayName: i.displayName, title: i.title, email: i.email.toLowerCase(), shortBio: i.shortBio, fullBio: i.fullBio,
    expertiseJson: JSON.stringify([...new Set(i.expertise)]), company: i.company, location: i.location, photo: i.photo, linksJson: JSON.stringify(normaliseLinks(i.links)),
    seoTitle: i.seoTitle, metaDescription: i.metaDescription, ogImage: i.ogImage, canonicalUrl: canonical, noindex: i.noindex, status: i.status,
  };
};

async function slugTaken(env: Env, slug: string, exceptId?: number) {
  const rows = await getDbFromEnv(env).select({ id: a.id }).from(a).where(exceptId ? and(eq(a.slug, slug), ne(a.id, exceptId)) : eq(a.slug, slug)).limit(1);
  return rows.length > 0;
}

export async function createAuthor(env: Env, actor: string, raw: unknown) {
  const input = authorSchema.parse(raw);
  if (await slugTaken(env, input.slug)) throw new BlogError("Another author already uses this profile URL.");
  const [row] = await getDbFromEnv(env).insert(a).values({ ...mapInput(input), updatedBy: actor }).returning();
  return row;
}

export async function updateAuthor(env: Env, actor: string, id: number, raw: unknown) {
  const input = authorSchema.parse(raw);
  const db = getDbFromEnv(env);
  const cur = await getAuthor(env, id);
  if (!cur) throw new BlogError("Author not found.");
  if (await slugTaken(env, input.slug, id)) throw new BlogError("Another author already uses this profile URL.");
  if (input.status === "draft" && cur.status === "published") {
    const n = await publishedCount(env, id);
    if (n > 0) throw new BlogError(`This author has ${n} published article(s). Reassign them before hiding the profile.`);
  }
  await db.update(a).set({ ...mapInput(input), updatedAt: new Date(), updatedBy: actor }).where(eq(a.id, id));
  // Cards and old listings show the text name, so keep it in step with the profile.
  if (cur.displayName !== input.displayName) await db.update(p).set({ author: input.displayName }).where(eq(p.authorId, id));
}

export const getAuthor = async (env: Env, id: number) => (await getDbFromEnv(env).select().from(a).where(eq(a.id, id)).limit(1))[0] ?? null;

export async function publishedCount(env: Env, id: number) {
  const r = await getDbFromEnv(env).select({ n: sql<number>`count(*)` }).from(p).where(and(eq(p.authorId, id), live()));
  return r[0]?.n ?? 0;
}

export type AuthorSort = "name" | "role" | "status" | "updated" | "articles";

export async function listAuthors(env: Env, o: { q?: string; sort?: AuthorSort; dir?: "asc" | "desc"; page?: number; per?: number }) {
  const db = getDbFromEnv(env);
  const per = o.per ?? 15, page = Math.max(1, o.page ?? 1);
  const q = o.q ? `%${o.q.replace(/[%_]/g, "").slice(0, 60)}%` : null;
  const where = q ? or(like(a.fullName, q), like(a.displayName, q), like(a.title, q), like(a.email, q)) : undefined;
  const [all, counts] = await Promise.all([
    db.select().from(a).where(where),
    db.select({ id: p.authorId, n: sql<number>`count(*)` }).from(p).where(live()).groupBy(p.authorId),
  ]);
  const rows = all.map((r) => ({ ...r, published: counts.find((c) => c.id === r.id)?.n ?? 0 }));
  const dir = o.dir === "asc" ? 1 : -1;
  const sort = o.sort ?? "updated";
  rows.sort((x, y) => {
    const str = (r: typeof x) => (sort === "name" ? r.displayName : sort === "role" ? r.title : r.status);
    const v = sort === "articles" ? x.published - y.published : sort === "updated" ? x.updatedAt.getTime() - y.updatedAt.getTime() : str(x).localeCompare(str(y));
    return v * dir || x.id - y.id;
  });
  return { rows: rows.slice((page - 1) * per, page * per), total: rows.length, per, page };
}

/** For the article editor picker. No email. */
export async function authorOptions(env: Env) {
  return getDbFromEnv(env).select({ id: a.id, name: a.displayName, title: a.title, photo: a.photo, status: a.status }).from(a).orderBy(asc(a.displayName));
}

/** Deleting an author: refused while articles (published or not) still point at them, unless a replacement is given. Draft-only authors can be deleted directly. */
export async function authorUsage(env: Env, id: number) {
  const rows = await getDbFromEnv(env).select({ id: p.id, title: p.title, status: p.status }).from(p).where(eq(p.authorId, id));
  return { posts: rows, published: rows.filter((r) => r.status === "published" || r.status === "scheduled").length };
}

export async function reassignPosts(env: Env, fromId: number, toId: number) {
  if (fromId === toId) throw new BlogError("Choose a different author.");
  const to = await getAuthor(env, toId);
  if (!to) throw new BlogError("The new author does not exist.");
  await getDbFromEnv(env).update(p).set({ authorId: toId, author: to.displayName }).where(eq(p.authorId, fromId));
}

export async function deleteAuthor(env: Env, id: number, reassignTo?: number | null) {
  const db = getDbFromEnv(env);
  const cur = await getAuthor(env, id);
  if (!cur) return;
  const use = await authorUsage(env, id);
  if (use.posts.length > 0) {
    if (!reassignTo) throw new BlogError(`${use.posts.length} article(s) use this author. Choose another author to take them over.`);
    await reassignPosts(env, id, reassignTo);
  }
  await db.delete(a).where(eq(a.id, id));
}

// ---------- public ----------

export type PublicAuthor = {
  id: number; slug: string; name: string; fullName: string; title: string; company: string; location: string; shortBio: string; fullBio: string;
  expertise: string[]; photo: string | null; links: AuthorLinks; seoTitle: string; metaDescription: string; ogImage: string | null; canonicalUrl: string; noindex: boolean; updatedAt: Date;
};
// Deliberately has no email field.
const toPublic = (r: AuthorRow): PublicAuthor => ({
  id: r.id, slug: r.slug, name: r.displayName, fullName: r.fullName, title: r.title, company: r.company, location: r.location, shortBio: r.shortBio, fullBio: r.fullBio,
  expertise: parseExpertise(r.expertiseJson), photo: r.photo, links: parseLinks(r.linksJson), seoTitle: r.seoTitle, metaDescription: r.metaDescription, ogImage: r.ogImage,
  canonicalUrl: r.canonicalUrl, noindex: r.noindex, updatedAt: r.updatedAt,
});

export async function getPublicAuthorBySlug(env: Env, slug: string) {
  const r = (await getDbFromEnv(env).select().from(a).where(and(eq(a.slug, slug), eq(a.status, "published"))).limit(1))[0];
  return r ? toPublic(r) : null;
}

/** Author shown on an article. Null when the post has no linked, published profile (the byline then falls back to the plain name). */
export async function getPublicAuthorById(env: Env, id: number | null) {
  if (!id) return null;
  const r = (await getDbFromEnv(env).select().from(a).where(and(eq(a.id, id), eq(a.status, "published"))).limit(1))[0];
  return r ? toPublic(r) : null;
}

export async function authorCategories(env: Env, authorId: number) {
  const rows = await getDbFromEnv(env)
    .select({ id: schema.blogCategories.id, name: schema.blogCategories.name, slug: schema.blogCategories.slug, n: sql<number>`count(*)` })
    .from(p).innerJoin(schema.blogCategories, eq(schema.blogCategories.id, p.categoryId)).where(and(eq(p.authorId, authorId), live())).groupBy(schema.blogCategories.id);
  return rows.sort((x, y) => x.name.localeCompare(y.name));
}

export async function authorSitemap(env: Env) {
  const rows = await getDbFromEnv(env).select({ id: a.id, slug: a.slug, updatedAt: a.updatedAt, noindex: a.noindex }).from(a).where(eq(a.status, "published"));
  const counts = await getDbFromEnv(env).select({ id: p.authorId, n: sql<number>`count(*)` }).from(p).where(live()).groupBy(p.authorId);
  // A profile with no published article is thin: leave it out of the sitemap.
  return rows.filter((r) => !r.noindex && (counts.find((c) => c.id === r.id)?.n ?? 0) > 0);
}

/** Admin preview: shows the chosen author even while their profile is still a draft. */
export async function getAuthorForPreview(env: Env, id: number | null) {
  if (!id) return null;
  const r = await getAuthor(env, id);
  return r ? toPublic(r) : null;
}
