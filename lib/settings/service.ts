import { desc, like, or, sql, and, gte, lte, eq } from "drizzle-orm";
import { ZodError } from "zod";
import { getDbFromEnv, schema } from "@/lib/db";
import { CATEGORIES, defOf, parseValue, settingsIn, type CategoryId } from "./registry";

type Env = { DB: D1Database; CACHE: KVNamespace };
export const PUBLIC_CACHE_KEY = "settings:public:v1";
export class SettingsError extends Error { constructor(m: string, readonly conflict = false) { super(m); } }

export type Loaded = { values: Record<string, string>; /** Latest change time in this category; sent back on save to detect another admin's edit. */ stamp: number };

/** Code defaults overlaid with saved values. Never throws: before migration 0016 the defaults apply. */
export async function loadCategory(env: Env, category: CategoryId): Promise<Loaded & { ready: boolean }> {
  const defs = settingsIn(category);
  const values = Object.fromEntries(defs.map((d) => [d.key, d.default]));
  try {
    const rows = await getDbFromEnv(env).select().from(schema.systemSettings);
    let stamp = 0;
    for (const r of rows) if (r.key in values) { values[r.key] = r.value; stamp = Math.max(stamp, r.updatedAt.getTime()); }
    return { values, stamp, ready: true };
  } catch { return { values, stamp: 0, ready: false }; }
}

export async function getSetting(env: Env, key: string): Promise<string> {
  const def = defOf(key);
  if (!def) throw new Error(`Unknown setting ${key}`);
  try {
    const r = await getDbFromEnv(env).select().from(schema.systemSettings).where(eq(schema.systemSettings.key, key)).limit(1);
    return r[0] ? r[0].value : def.default;
  } catch { return def.default; }
}

/**
 * Saves the changed values of one category. Every value is validated first (all or nothing), a stale `stamp` is refused,
 * each real change is written to the audit log, and the public cache is cleared.
 */
export async function saveCategory(env: Env, actor: string, category: CategoryId, input: Record<string, unknown>, stamp: number) {
  const defs = settingsIn(category);
  if (!defs.length) throw new SettingsError("This section has no editable settings.");
  const clean: Record<string, string> = {};
  try { for (const d of defs) if (d.key in input) clean[d.key] = parseValue(d, input[d.key]); } catch (e) {
    if (e instanceof ZodError) throw new SettingsError(e.issues[0]?.message ?? "A value is not valid.");
    throw e;
  }
  if (clean.bannerEnabled === "true" && !(clean.bannerText ?? "").trim() && category === "general") throw new SettingsError("Add banner text before turning the banner on.");
  const db = getDbFromEnv(env);
  const current = await loadCategory(env, category);
  if (!current.ready) throw new SettingsError("The settings table is not set up yet. Run drizzle/0016_system_settings.sql in D1.");
  if (current.stamp !== stamp) throw new SettingsError("These settings were changed by someone else. Reload to see the latest values before saving.", true);
  const changes = Object.entries(clean).filter(([k, v]) => current.values[k] !== v);
  if (!changes.length) return { changed: 0 };
  const now = new Date();
  await db.batch([
    ...changes.map(([k, v]) => db.insert(schema.systemSettings).values({ key: k, value: v, updatedBy: actor, updatedAt: now })
      .onConflictDoUpdate({ target: schema.systemSettings.key, set: { value: v, updatedBy: actor, updatedAt: now } })),
    ...changes.map(([k, v]) => db.insert(schema.settingsAuditLog).values({ actor, category, settingKey: k, oldValue: current.values[k] ?? "", newValue: v, result: "saved" })),
  ] as unknown as Parameters<typeof db.batch>[0]);
  try { await Promise.all([env.CACHE.delete(PUBLIC_CACHE_KEY), env.CACHE.delete("settings:email:v1")]); } catch { /* cache entry expires on its own within a minute */ }
  return { changed: changes.length };
}

export type PublicSettings = { siteName: string; banner: { text: string; href: string } | null };

/** What the public site may know. Read from KV for 60 s, so public pages never wait on D1. */
export async function getPublicSettings(env: Env): Promise<PublicSettings> {
  try { const hit = await env.CACHE.get<PublicSettings>(PUBLIC_CACHE_KEY, "json"); if (hit) return hit; } catch { /* fall through to D1 */ }
  const g = await loadCategory(env, "general");
  const out: PublicSettings = {
    siteName: g.values.siteName || "BeigeLeads",
    banner: g.values.bannerEnabled === "true" && g.values.bannerText ? { text: g.values.bannerText, href: g.values.bannerLink } : null,
  };
  try { await env.CACHE.put(PUBLIC_CACHE_KEY, JSON.stringify(out), { expirationTtl: 60 }); } catch { /* optional */ }
  return out;
}

export type AuditFilter = { q?: string; category?: string; from?: Date; to?: Date; page?: number };
const PER = 25;
export async function listAudit(env: Env, f: AuditFilter) {
  const db = getDbFromEnv(env);
  const t = schema.settingsAuditLog;
  const conds = [
    f.q ? or(like(t.settingKey, `%${f.q}%`), like(t.actor, `%${f.q}%`)) : undefined,
    f.category ? eq(t.category, f.category) : undefined,
    f.from ? gte(t.createdAt, f.from) : undefined,
    f.to ? lte(t.createdAt, f.to) : undefined,
  ].filter(Boolean);
  const where = conds.length ? and(...conds) : undefined;
  const page = Math.max(1, f.page ?? 1);
  const [rows, [c]] = await Promise.all([
    db.select().from(t).where(where).orderBy(desc(t.id)).limit(PER).offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)` }).from(t).where(where),
  ]);
  return { rows, total: Number(c?.n ?? 0), page, per: PER };
}

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
