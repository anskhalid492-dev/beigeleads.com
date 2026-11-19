import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDbFromEnv, schema } from "@/lib/db";
import type { PageOverrideMap } from "./page-rewrite";
import { isSitePage } from "./page-registry";

type Env = { DB: D1Database; CACHE: KVNamespace };
export const PAGE_SEO_KV_KEY = "seo:pages:v1";
export class PageSeoError extends Error {}

const url = z.string().trim().max(500).refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//") && !/[\s<>"\\]/.test(v)) || /^https:\/\/[^\s<>"\\]+$/i.test(v), "Use an https:// address or a path starting with /.");
export const overrideSchema = z.object({
  seoTitle: z.string().trim().max(70, "SEO title: 70 characters at most."),
  metaDescription: z.string().trim().max(200, "Meta description: 200 characters at most."),
  ogTitle: z.string().trim().max(90, "Social title: 90 characters at most."),
  ogDescription: z.string().trim().max(200, "Social description: 200 characters at most."),
  ogImage: url, canonicalUrl: url,
}).refine((v) => !/[\u0000-\u001f]/.test(Object.values(v).join("")), "Text contains invalid characters.");
export type OverrideInput = z.infer<typeof overrideSchema>;

export async function listOverrides(env: Env) { return getDbFromEnv(env).select().from(schema.seoPageOverrides); }

export async function syncPageSeoCache(env: Env) {
  const rows = await listOverrides(env);
  const map: PageOverrideMap = {};
  for (const r of rows) if (r.seoTitle || r.metaDescription || r.ogTitle || r.ogDescription || r.ogImage || r.canonicalUrl)
    map[r.path] = { t: r.seoTitle, d: r.metaDescription, ot: r.ogTitle, od: r.ogDescription, oi: r.ogImage, c: r.canonicalUrl };
  await env.CACHE.put(PAGE_SEO_KV_KEY, JSON.stringify(map));
}

export async function savePageOverride(env: Env, actor: string, path: string, input: unknown) {
  if (!isSitePage(path)) throw new PageSeoError("That page is not in the site page list.");
  let v: OverrideInput;
  try { v = overrideSchema.parse(input); } catch (e) { throw new PageSeoError(e instanceof z.ZodError ? (e.issues[0]?.message ?? "A value is not valid.") : "A value is not valid."); }
  const row = { path, ...v, updatedBy: actor, updatedAt: new Date() };
  await getDbFromEnv(env).insert(schema.seoPageOverrides).values(row).onConflictDoUpdate({ target: schema.seoPageOverrides.path, set: { ...v, updatedBy: actor, updatedAt: row.updatedAt } });
  await syncPageSeoCache(env);
  await getDbFromEnv(env).insert(schema.settingsAuditLog).values({ actor, category: "seo", settingKey: `page:${path}`, oldValue: "", newValue: [v.seoTitle && "title", v.metaDescription && "description", v.ogTitle && "social title", v.ogDescription && "social description", v.ogImage && "social image", v.canonicalUrl && "canonical"].filter(Boolean).join(", ") || "(all cleared)", result: "saved" }).catch(() => {});
}

export async function resetPageOverride(env: Env, actor: string, path: string) {
  await getDbFromEnv(env).delete(schema.seoPageOverrides).where(eq(schema.seoPageOverrides.path, path));
  await syncPageSeoCache(env);
  await getDbFromEnv(env).insert(schema.settingsAuditLog).values({ actor, category: "seo", settingKey: `page:${path}`, newValue: "override removed", result: "saved" }).catch(() => {});
}
