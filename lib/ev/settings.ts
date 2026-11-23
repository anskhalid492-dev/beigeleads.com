// Email Verification settings (CLAUDE.md section 120). One JSON value in `system_settings` (key ev.settings), validated on read AND write,
// cached in KV for 60 s. Never throws: any failure returns the defaults. Paid orders keep the package, limit and price they bought
// (snapshot in ev_orders), so editing packages here never changes an existing order.
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";

export const evPackage = z.object({
  name: z.string().trim().min(1, "Give every package a name.").max(30),
  limit: z.number().int().min(1).max(5_000_000),
  priceCents: z.number().int().min(100).max(10_000_000),
  featured: z.boolean(),
});
export type EvPackage = z.infer<typeof evPackage>;

export const evSettingsSchema = z.object({
  enabled: z.boolean(),
  packages: z.array(evPackage).min(1).max(8),
  maxUploadMb: z.number().int().min(1).max(100),
  formats: z.array(z.enum(["csv", "xlsx", "txt"])).min(1),
  submitLinkDays: z.number().int().min(1).max(365),
  resultDownloadDays: z.number().int().min(1).max(365),
  retainOriginalDays: z.number().int().min(1).max(365),
  retainResultDays: z.number().int().min(1).max(365),
  reminderHours: z.number().int().min(0).max(720),
  supportEmail: z.string().trim().max(254).refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid support email or leave it empty."),
  quoteRecipient: z.string().trim().max(254).refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email or leave it empty."),
  upsellEnabled: z.boolean(),
  upsellHeadline: z.string().trim().min(1).max(80),
  upsellDescription: z.string().trim().min(1).max(300),
  upsellPlacement: z.enum(["after_items", "in_summary"]),
}).superRefine((v, ctx) => {
  const names = v.packages.map((p) => p.name.toLowerCase());
  if (new Set(names).size !== names.length) ctx.addIssue({ code: "custom", message: "Package names must be different.", path: ["packages"] });
  if (v.packages.filter((p) => p.featured).length > 1) ctx.addIssue({ code: "custom", message: "Only one package can be featured.", path: ["packages"] });
});
export type EvSettings = z.infer<typeof evSettingsSchema>;

export const DEFAULT_EV: EvSettings = {
  enabled: true,
  packages: [
    { name: "Starter", limit: 10_000, priceCents: 1_000, featured: false },
    { name: "Growth", limit: 50_000, priceCents: 3_000, featured: false },
    { name: "Business", limit: 100_000, priceCents: 6_000, featured: false },
    { name: "Professional", limit: 250_000, priceCents: 12_000, featured: true },
    { name: "Scale", limit: 500_000, priceCents: 25_000, featured: false },
    { name: "Enterprise", limit: 1_000_000, priceCents: 49_900, featured: false },
  ],
  maxUploadMb: 100, formats: ["csv", "xlsx", "txt"], submitLinkDays: 90, resultDownloadDays: 30, retainOriginalDays: 30, retainResultDays: 30, reminderHours: 48,
  supportEmail: "hello@beigeleads.com", quoteRecipient: "", upsellEnabled: true,
  upsellHeadline: "Need Your Email List Verified?",
  upsellDescription: "Identify invalid, duplicate, and risky addresses before your next campaign. Add professional email list verification to your order.",
  upsellPlacement: "after_items",
};

/** The id of the service line in an order (order_items.product_slug). Never a catalog product. */
export const EV_SLUG = "email-verification";
export const MB = 1024 * 1024;
const KEY = "ev:settings:v1";
const DB_KEY = "ev.settings";

export async function loadEvSettings(env: CloudflareEnv): Promise<EvSettings> {
  try {
    const hit = await env.CACHE.get(KEY);
    if (hit) { const p = evSettingsSchema.safeParse(JSON.parse(hit)); if (p.success) return p.data; }
  } catch { /* database next */ }
  try {
    const [r] = await getDbFromEnv(env).select().from(schema.systemSettings).where(eq(schema.systemSettings.key, DB_KEY));
    const p = r ? evSettingsSchema.safeParse({ ...DEFAULT_EV, ...(JSON.parse(r.value) as object) }) : null;
    const out = p?.success ? p.data : DEFAULT_EV;
    await env.CACHE.put(KEY, JSON.stringify(out), { expirationTtl: 60 }).catch(() => undefined);
    return out;
  } catch { return DEFAULT_EV; }
}

export async function saveEvSettings(env: CloudflareEnv, value: unknown, actor: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const p = evSettingsSchema.safeParse(value);
  if (!p.success) return { ok: false, message: p.error.issues[0]?.message ?? "Check the values." };
  try {
    const db = getDbFromEnv(env);
    const [old] = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.key, DB_KEY));
    const text = JSON.stringify({ ...p.data, packages: [...p.data.packages].sort((a, b) => a.limit - b.limit) });
    await db.insert(schema.systemSettings).values({ key: DB_KEY, value: text, updatedBy: actor }).onConflictDoUpdate({ target: schema.systemSettings.key, set: { value: text, updatedBy: actor, updatedAt: new Date() } });
    await db.insert(schema.settingsAuditLog).values({ actor, category: "email-verification", settingKey: DB_KEY, oldValue: (old?.value ?? "").slice(0, 900), newValue: text.slice(0, 900) });
    await env.CACHE.delete(KEY).catch(() => undefined);
    return { ok: true };
  } catch { return { ok: false, message: "Could not save. Check that the database is reachable." }; }
}

export const findPackage = (s: EvSettings, name: string) => s.packages.find((p) => p.name === name);
export const fmtLimit = (n: number) => (n >= 1_000_000 && n % 1_000_000 === 0 ? `${n / 1_000_000}M` : n >= 1000 && n % 1000 === 0 ? `${n / 1000}K` : n.toLocaleString("en-US"));
