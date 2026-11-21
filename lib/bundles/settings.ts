// Build Your Own Bundle settings: on/off and products kept out of the builder. One JSON value in `system_settings` (key bundles.builder),
// cached in KV for 60 s. Never throws: any failure returns the defaults, so the builder keeps working.
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDbFromEnv, schema } from "@/lib/db";

export const builderSchema = z.object({ enabled: z.boolean(), excluded: z.array(z.string().max(80)).max(300) });
export type BuilderSettings = z.infer<typeof builderSchema>;
export const DEFAULT_BUILDER: BuilderSettings = { enabled: true, excluded: [] };
const KEY = "bundles:builder:v1";

export async function loadBuilderSettings(env: CloudflareEnv): Promise<BuilderSettings> {
  try {
    const hit = await env.CACHE.get(KEY);
    if (hit) { const p = builderSchema.safeParse(JSON.parse(hit)); if (p.success) return p.data; }
  } catch { /* fall through */ }
  try {
    const [r] = await getDbFromEnv(env).select().from(schema.systemSettings).where(eq(schema.systemSettings.key, "bundles.builder"));
    const p = r ? builderSchema.safeParse({ ...DEFAULT_BUILDER, ...(JSON.parse(r.value) as object) }) : null;
    const out = p?.success ? p.data : DEFAULT_BUILDER;
    await env.CACHE.put(KEY, JSON.stringify(out), { expirationTtl: 60 }).catch(() => undefined);
    return out;
  } catch { return DEFAULT_BUILDER; }
}

export async function saveBuilderSettings(env: CloudflareEnv, value: unknown, actor: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const p = builderSchema.safeParse(value);
  if (!p.success) return { ok: false, message: "Check the values." };
  try {
    const db = getDbFromEnv(env);
    const [old] = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.key, "bundles.builder"));
    const text = JSON.stringify({ enabled: p.data.enabled, excluded: [...new Set(p.data.excluded)] });
    await db.insert(schema.systemSettings).values({ key: "bundles.builder", value: text, updatedBy: actor }).onConflictDoUpdate({ target: schema.systemSettings.key, set: { value: text, updatedBy: actor, updatedAt: new Date() } });
    await db.insert(schema.settingsAuditLog).values({ actor, category: "bundles", settingKey: "bundles.builder", oldValue: (old?.value ?? "").slice(0, 900), newValue: text.slice(0, 900) });
    await env.CACHE.delete(KEY).catch(() => undefined);
    return { ok: true };
  } catch { return { ok: false, message: "Could not save. Check that the database is reachable." }; }
}
