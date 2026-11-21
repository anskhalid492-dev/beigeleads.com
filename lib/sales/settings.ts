// Sales features settings (CLAUDE.md section 113): Volume Discounts + Second Purchase Offer. Stored as two JSON values in
// `system_settings` (keys sales.volume, sales.reward), validated on every read AND write, cached in KV for 60 s.
// Never throws: any failure returns the defaults, so the cart and checkout keep working.
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";

export const volumeSchema = z.object({
  enabled: z.boolean(),
  tiers: z.array(z.object({ min: z.number().int().min(2).max(50), percent: z.number().min(1).max(90) })).min(1).max(8),
  excludedProducts: z.array(z.string().max(80)).max(200),
  excludedCategories: z.array(z.string().max(80)).max(100),
  /** default false: a code or promotion replaces the volume discount instead of stacking */
  stackWithPromos: z.boolean(),
});
export type VolumeSettings = z.infer<typeof volumeSchema>;

export const rewardSchema = z.object({
  enabled: z.boolean(),
  percent: z.number().int().min(1).max(100),
  expiryDays: z.number().int().min(1).max(365),
  /** null = no cap */
  maxDiscountCents: z.number().int().min(100).max(10_000_000).nullable(),
  minOrderCents: z.number().int().min(0).max(10_000_000),
  productSlugs: z.array(z.string().max(80)).max(200),
  categorySlugs: z.array(z.string().max(80)).max(100),
  /** default false: the personal code is never combined with the volume discount */
  combineVolume: z.boolean(),
  reminders: z.boolean(),
  reminderDays: z.number().int().min(1).max(60),
  expiryReminderHours: z.number().int().min(6).max(240),
});
export type RewardSettings = z.infer<typeof rewardSchema>;

export const DEFAULT_VOLUME: VolumeSettings = {
  enabled: true,
  tiers: [{ min: 2, percent: 15 }, { min: 3, percent: 35 }, { min: 5, percent: 45 }],
  excludedProducts: [], excludedCategories: [], stackWithPromos: false,
};
export const DEFAULT_REWARD: RewardSettings = {
  enabled: true, percent: 50, expiryDays: 14, maxDiscountCents: 10_000, minOrderCents: 0,
  productSlugs: [], categorySlugs: [], combineVolume: false, reminders: true, reminderDays: 5, expiryReminderHours: 48,
};
export type SalesSettings = { volume: VolumeSettings; reward: RewardSettings };

const KV_KEY = "sales:settings:v1";

/** Tiers sorted by threshold, duplicates by threshold removed (the last one wins). */
export function cleanTiers(t: VolumeSettings["tiers"]): VolumeSettings["tiers"] {
  const m = new Map<number, number>(); for (const x of t) m.set(x.min, x.percent);
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([min, percent]) => ({ min, percent }));
}

const parse = <T,>(s: z.ZodType<T>, raw: string | undefined, fallback: T): T => {
  if (!raw) return fallback;
  try { const r = s.safeParse({ ...(fallback as object), ...(JSON.parse(raw) as object) }); return r.success ? r.data : fallback; } catch { return fallback; }
};

export async function loadSalesSettings(env: CloudflareEnv): Promise<SalesSettings> {
  try {
    const hit = await env.CACHE.get(KV_KEY);
    if (hit) { const j = JSON.parse(hit) as SalesSettings; if (j?.volume && j?.reward) return j; }
  } catch { /* fall through to the database */ }
  let out: SalesSettings = { volume: DEFAULT_VOLUME, reward: DEFAULT_REWARD };
  try {
    const db = getDbFromEnv(env);
    const rows = await db.select().from(schema.systemSettings);
    const by = new Map(rows.map((r) => [r.key, r.value]));
    const v = parse(volumeSchema, by.get("sales.volume"), DEFAULT_VOLUME);
    out = { volume: { ...v, tiers: cleanTiers(v.tiers) }, reward: parse(rewardSchema, by.get("sales.reward"), DEFAULT_REWARD) };
    await env.CACHE.put(KV_KEY, JSON.stringify(out), { expirationTtl: 60 }).catch(() => undefined);
  } catch { /* before the table exists: defaults */ }
  return out;
}

export async function saveSalesSetting(env: CloudflareEnv, which: "volume" | "reward", value: unknown, actor: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = which === "volume" ? volumeSchema.safeParse(value) : rewardSchema.safeParse(value);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ? `Check the values: ${parsed.error.issues[0].path.join(".") || "form"} ${parsed.error.issues[0].message}` : "Check the values." };
  let data = parsed.data as VolumeSettings | RewardSettings;
  if (which === "volume") { const v = data as VolumeSettings; data = { ...v, tiers: cleanTiers(v.tiers) }; }
  const key = `sales.${which}`;
  try {
    const db = getDbFromEnv(env);
    const [old] = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.key, key));
    const text = JSON.stringify(data);
    await db.insert(schema.systemSettings).values({ key, value: text, updatedBy: actor }).onConflictDoUpdate({ target: schema.systemSettings.key, set: { value: text, updatedBy: actor, updatedAt: new Date() } });
    await db.insert(schema.settingsAuditLog).values({ actor, category: "sales", settingKey: key, oldValue: (old?.value ?? "").slice(0, 900), newValue: text.slice(0, 900) });
    await env.CACHE.delete(KV_KEY).catch(() => undefined);
    return { ok: true };
  } catch { return { ok: false, message: "Could not save. Check that the database is reachable." }; }
}
