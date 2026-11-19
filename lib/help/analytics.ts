// Anonymous Help Center analytics: search words, article views, helpful votes. Nothing here identifies a person.
import { desc, gte, sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";

type Env = { DB: D1Database };
const day = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10);

/** Search text we refuse to store: anything that looks like an email address or a long number. */
export function cleanSearch(q: string): string | null {
  const t = q.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 100);
  if (t.length < 3) return null;
  if (t.includes("@") || /\d{6,}/.test(t.replace(/[\s\-.]/g, "")) || /https?:\/\//.test(t)) return null;
  return t;
}

export async function recordSearch(env: Env, q: string, results: number): Promise<boolean> {
  const t = cleanSearch(q);
  if (!t) return false;
  await getDbFromEnv(env).insert(schema.helpSearchLog).values({ q: t, results: Math.max(0, Math.min(results, 99)) });
  return true;
}

export async function recordView(env: Env, articleId: string): Promise<void> {
  const d = day();
  await getDbFromEnv(env).insert(schema.helpViews).values({ articleId, day: d, views: 1 })
    .onConflictDoUpdate({ target: [schema.helpViews.articleId, schema.helpViews.day], set: { views: sql`${schema.helpViews.views} + 1` } });
}

/** Deletes search rows older than 90 days (called by the cron sweep). */
export async function purgeOldSearches(env: Env, now = Date.now()): Promise<void> {
  await getDbFromEnv(env).delete(schema.helpSearchLog).where(sql`${schema.helpSearchLog.createdAt} < ${Math.floor((now - 90 * 86400_000) / 1000)}`);
}

export type Summary = {
  topSearches: { q: string; n: number; avgResults: number }[];
  noResults: { q: string; n: number }[];
  topViewed: { articleId: string; views: number }[];
  feedback: { articleId: string; yes: number; no: number }[];
  searches30: number;
  views30: number;
};

export async function summary(env: Env, now = Date.now()): Promise<Summary> {
  const db = getDbFromEnv(env);
  const since = Math.floor((now - 30 * 86400_000) / 1000);
  const sinceDay = day(now - 30 * 86400_000);
  const q = schema.helpSearchLog;
  const topSearches = await db.select({ q: q.q, n: sql<number>`count(*)`, avgResults: sql<number>`avg(${q.results})` }).from(q).where(sql`${q.createdAt} >= ${since}`).groupBy(q.q).orderBy(desc(sql`count(*)`)).limit(15);
  const noResults = await db.select({ q: q.q, n: sql<number>`count(*)` }).from(q).where(sql`${q.createdAt} >= ${since} AND ${q.results} = 0`).groupBy(q.q).orderBy(desc(sql`count(*)`)).limit(15);
  const v = schema.helpViews;
  const topViewed = await db.select({ articleId: v.articleId, views: sql<number>`sum(${v.views})` }).from(v).where(gte(v.day, sinceDay)).groupBy(v.articleId).orderBy(desc(sql`sum(${v.views})`)).limit(15);
  const f = schema.helpFeedback;
  const feedback = await db.select({ articleId: f.articleId, yes: sql<number>`sum(${f.helpful})`, no: sql<number>`sum(1 - ${f.helpful})` }).from(f).groupBy(f.articleId).orderBy(desc(sql`count(*)`)).limit(60);
  const [s30] = await db.select({ n: sql<number>`count(*)` }).from(q).where(sql`${q.createdAt} >= ${since}`);
  const [v30] = await db.select({ n: sql<number>`coalesce(sum(${v.views}), 0)` }).from(v).where(gte(v.day, sinceDay));
  return { topSearches: topSearches.map((r) => ({ ...r, n: Number(r.n), avgResults: Math.round(Number(r.avgResults) * 10) / 10 })), noResults: noResults.map((r) => ({ ...r, n: Number(r.n) })), topViewed: topViewed.map((r) => ({ ...r, views: Number(r.views) })), feedback: feedback.map((r) => ({ ...r, yes: Number(r.yes), no: Number(r.no) })), searches30: Number(s30?.n ?? 0), views30: Number(v30?.n ?? 0) };
}
