import { eq } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { normalizePath } from "./redirect-rules";

type Env = { DB: D1Database };

/** Never throws: before migration 0015 nothing is excluded. */
export async function excludedSitemapPaths(env: Env): Promise<Set<string>> {
  try { return new Set((await getDbFromEnv(env).select().from(schema.seoSitemapExclusions)).map((r) => r.path)); } catch { return new Set(); }
}

export async function listExclusions(env: Env) { return getDbFromEnv(env).select().from(schema.seoSitemapExclusions).orderBy(schema.seoSitemapExclusions.path); }

export async function excludePath(env: Env, actor: string, raw: string) {
  const path = normalizePath(raw);
  if (!path.startsWith("/") || path.startsWith("//") || /[\s<>"\\]/.test(path) || path.length > 300) throw new Error("Enter a path like /compare/beigeleads-vs-apollo.");
  await getDbFromEnv(env).insert(schema.seoSitemapExclusions).values({ path, createdBy: actor }).onConflictDoNothing();
}

export async function includePath(env: Env, path: string) {
  await getDbFromEnv(env).delete(schema.seoSitemapExclusions).where(eq(schema.seoSitemapExclusions.path, path));
}
