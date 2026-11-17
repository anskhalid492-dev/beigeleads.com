import { asc, eq, sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { slugifyText } from "./doc";

type Env = { DB: D1Database };

export class BlogError extends Error {}

const clean = (s: unknown, max: number) => String(s ?? "").trim().slice(0, max);

export async function listCategories(env: Env) {
  const db = getDbFromEnv(env);
  const rows = await db.select().from(schema.blogCategories).orderBy(asc(schema.blogCategories.name));
  const counts = await db.select({ id: schema.blogPosts.categoryId, n: sql<number>`count(*)` }).from(schema.blogPosts).groupBy(schema.blogPosts.categoryId);
  return rows.map((c) => ({ ...c, posts: counts.find((x) => x.id === c.id)?.n ?? 0 }));
}

export async function saveCategory(env: Env, input: { id?: number; name: string; slug?: string; description?: string; seoTitle?: string; metaDescription?: string }) {
  const db = getDbFromEnv(env);
  const name = clean(input.name, 80);
  if (!name) throw new BlogError("Give the category a name.");
  const slug = slugifyText(input.slug?.trim() || name);
  if (!slug) throw new BlogError("The slug is empty.");
  const dup = await db.select({ id: schema.blogCategories.id }).from(schema.blogCategories).where(eq(schema.blogCategories.slug, slug)).limit(1);
  if (dup[0] && dup[0].id !== input.id) throw new BlogError("Another category already uses that slug.");
  const values = { name, slug, description: clean(input.description, 500), seoTitle: clean(input.seoTitle, 120), metaDescription: clean(input.metaDescription, 320) };
  if (input.id) await db.update(schema.blogCategories).set(values).where(eq(schema.blogCategories.id, input.id));
  else await db.insert(schema.blogCategories).values(values);
}

export async function deleteCategory(env: Env, id: number) {
  const db = getDbFromEnv(env);
  const used = await db.select({ n: sql<number>`count(*)` }).from(schema.blogPosts).where(eq(schema.blogPosts.categoryId, id));
  if ((used[0]?.n ?? 0) > 0) throw new BlogError(`This category has ${used[0].n} article(s). Move them to another category first.`);
  await db.delete(schema.blogCategories).where(eq(schema.blogCategories.id, id));
}

export async function listTags(env: Env) {
  const db = getDbFromEnv(env);
  const rows = await db.select().from(schema.blogTags).orderBy(asc(schema.blogTags.name));
  const counts = await db.select({ id: schema.blogPostTags.tagId, n: sql<number>`count(*)` }).from(schema.blogPostTags).groupBy(schema.blogPostTags.tagId);
  return rows.map((t) => ({ ...t, posts: counts.find((x) => x.id === t.id)?.n ?? 0 }));
}

export async function saveTag(env: Env, input: { id?: number; name: string; slug?: string }) {
  const db = getDbFromEnv(env);
  const name = clean(input.name, 60);
  if (!name) throw new BlogError("Give the tag a name.");
  const slug = slugifyText(input.slug?.trim() || name);
  if (!slug) throw new BlogError("The slug is empty.");
  const dup = await db.select({ id: schema.blogTags.id }).from(schema.blogTags).where(eq(schema.blogTags.slug, slug)).limit(1);
  if (dup[0] && dup[0].id !== input.id) throw new BlogError("Another tag already uses that slug.");
  if (input.id) await db.update(schema.blogTags).set({ name, slug }).where(eq(schema.blogTags.id, input.id));
  else await db.insert(schema.blogTags).values({ name, slug });
}

export async function deleteTag(env: Env, id: number) {
  const db = getDbFromEnv(env);
  await db.delete(schema.blogPostTags).where(eq(schema.blogPostTags.tagId, id));
  await db.delete(schema.blogTags).where(eq(schema.blogTags.id, id));
}
