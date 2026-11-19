import { sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";

type Env = { DB: D1Database };
const live = sql`${schema.blogPosts.status} = 'published'`;

export type SeoPostRow = {
  id: number; slug: string; title: string; status: string; noindex: boolean;
  seoTitle: string; metaDescription: string; focusKeyword: string; featuredImage: string | null; featuredAlt: string; canonicalUrl: string; updatedAt: Date;
};

/** Real counts over blog articles only. Nothing is estimated and no search-engine data is implied. */
export async function seoOverview(env: Env) {
  const db = getDbFromEnv(env);
  const [r] = await db.select({
    total: sql<number>`count(*)`,
    published: sql<number>`sum(case when ${live} then 1 else 0 end)`,
    noMeta: sql<number>`sum(case when ${live} and trim(${schema.blogPosts.metaDescription}) = '' then 1 else 0 end)`,
    noTitle: sql<number>`sum(case when ${live} and trim(${schema.blogPosts.seoTitle}) = '' then 1 else 0 end)`,
    noFocus: sql<number>`sum(case when ${live} and trim(${schema.blogPosts.focusKeyword}) = '' then 1 else 0 end)`,
    noImage: sql<number>`sum(case when ${live} and ${schema.blogPosts.featuredImage} is null then 1 else 0 end)`,
    noAlt: sql<number>`sum(case when ${live} and ${schema.blogPosts.featuredImage} is not null and trim(${schema.blogPosts.featuredAlt}) = '' then 1 else 0 end)`,
    noindex: sql<number>`sum(case when ${live} and ${schema.blogPosts.noindex} = 1 then 1 else 0 end)`,
    badTitleLen: sql<number>`sum(case when ${live} and trim(${schema.blogPosts.seoTitle}) <> '' and (length(trim(${schema.blogPosts.seoTitle})) < 30 or length(trim(${schema.blogPosts.seoTitle})) > 60) then 1 else 0 end)`,
    badMetaLen: sql<number>`sum(case when ${live} and trim(${schema.blogPosts.metaDescription}) <> '' and (length(trim(${schema.blogPosts.metaDescription})) < 70 or length(trim(${schema.blogPosts.metaDescription})) > 160) then 1 else 0 end)`,
  }).from(schema.blogPosts);
  const n = (v: number | null | undefined) => Number(v ?? 0);
  return {
    total: n(r?.total), published: n(r?.published), noMeta: n(r?.noMeta), noTitle: n(r?.noTitle), noFocus: n(r?.noFocus),
    noImage: n(r?.noImage), noAlt: n(r?.noAlt), noindex: n(r?.noindex), badTitleLen: n(r?.badTitleLen), badMetaLen: n(r?.badMetaLen),
  };
}

export async function seoPostRows(env: Env): Promise<SeoPostRow[]> {
  const db = getDbFromEnv(env);
  return db.select({
    id: schema.blogPosts.id, slug: schema.blogPosts.slug, title: schema.blogPosts.title, status: schema.blogPosts.status, noindex: schema.blogPosts.noindex,
    seoTitle: schema.blogPosts.seoTitle, metaDescription: schema.blogPosts.metaDescription, focusKeyword: schema.blogPosts.focusKeyword,
    featuredImage: schema.blogPosts.featuredImage, featuredAlt: schema.blogPosts.featuredAlt, canonicalUrl: schema.blogPosts.canonicalUrl, updatedAt: schema.blogPosts.updatedAt,
  }).from(schema.blogPosts).orderBy(sql`${schema.blogPosts.updatedAt} desc`).limit(500);
}
