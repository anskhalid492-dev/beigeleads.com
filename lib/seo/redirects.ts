import { eq } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { checkRule, type RedirectMap } from "./redirect-rules";

type Env = { DB: D1Database; CACHE: KVNamespace };
export const REDIRECT_KV_KEY = "seo:redirects:v1";
export class RedirectError extends Error {}

export async function listRedirects(env: Env) {
  return getDbFromEnv(env).select().from(schema.seoRedirects).orderBy(schema.seoRedirects.fromPath);
}

/** Rebuilds the KV copy the Worker reads. Called after every change. */
export async function syncRedirectCache(env: Env) {
  const rows = (await listRedirects(env)).filter((r) => r.enabled).slice(0, 1000);
  const map: RedirectMap = {};
  for (const r of rows) map[r.fromPath] = [r.toPath, r.status];
  await env.CACHE.put(REDIRECT_KV_KEY, JSON.stringify(map));
}

export async function saveRedirect(env: Env, actor: string, input: { id?: number; from: string; to: string; status: number; enabled?: boolean; note?: string }) {
  const db = getDbFromEnv(env);
  const all = await listRedirects(env);
  const others = all.filter((r) => r.enabled && r.id !== input.id).map((r) => ({ from: r.fromPath, to: r.toPath }));
  const c = checkRule(input.from, input.to, input.status, others);
  if (!c.ok) throw new RedirectError(c.error);
  const dup = all.find((r) => r.fromPath === c.from && r.id !== input.id);
  if (dup) throw new RedirectError("A redirect from that address already exists. Edit it instead.");
  const values = { fromPath: c.from, toPath: c.to, status: input.status, enabled: input.enabled ?? true, note: (input.note ?? "").trim().slice(0, 200), updatedBy: actor, updatedAt: new Date() };
  if (input.id) await db.update(schema.seoRedirects).set(values).where(eq(schema.seoRedirects.id, input.id));
  else await db.insert(schema.seoRedirects).values(values);
  await syncRedirectCache(env);
}

export async function setRedirectEnabled(env: Env, actor: string, id: number, enabled: boolean) {
  const db = getDbFromEnv(env);
  if (enabled) {
    const all = await listRedirects(env);
    const r = all.find((x) => x.id === id);
    if (!r) throw new RedirectError("Redirect not found.");
    const c = checkRule(r.fromPath, r.toPath, r.status, all.filter((x) => x.enabled && x.id !== id).map((x) => ({ from: x.fromPath, to: x.toPath })));
    if (!c.ok) throw new RedirectError(c.error);
  }
  await db.update(schema.seoRedirects).set({ enabled, updatedBy: actor, updatedAt: new Date() }).where(eq(schema.seoRedirects.id, id));
  await syncRedirectCache(env);
}

export async function deleteRedirect(env: Env, id: number) {
  await getDbFromEnv(env).delete(schema.seoRedirects).where(eq(schema.seoRedirects.id, id));
  await syncRedirectCache(env);
}
