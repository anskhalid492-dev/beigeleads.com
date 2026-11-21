// DFY Outbound settings (CLAUDE.md section 123). One JSON value in `system_settings` (key dfy.settings), validated on read AND write, KV-cached 60 s.
// A paid order keeps the package, price and allocation it bought (snapshot in dfy_orders). Nothing here is a promise of results.
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";

const email = z.string().trim().max(254).refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email or leave it empty.");
export const dfyPackage = z.object({
  name: z.string().trim().min(1).max(30),
  monthlyCents: z.number().int().min(100).max(100_000_000),
  leads: z.number().int().min(1).max(10_000_000),
  initialSends: z.number().int().min(0).max(10_000_000),
  followups: z.number().int().min(0).max(20),
  domainsMin: z.number().int().min(0).max(500), domainsMax: z.number().int().min(0).max(500),
  inboxesMin: z.number().int().min(0).max(2000), inboxesMax: z.number().int().min(0).max(2000),
  reporting: z.enum(["weekly", "monthly"]),
  support: z.string().trim().max(80),
  cta: z.string().trim().min(1).max(60),
  featured: z.boolean(),
  features: z.array(z.string().trim().min(1).max(120)).max(20),
});
export type DfyPackage = z.infer<typeof dfyPackage>;

export const dfySettingsSchema = z.object({
  enabled: z.boolean(),
  packages: z.array(dfyPackage).min(1).max(6),
  ownershipEnabled: z.boolean(),
  ownershipCents: z.number().int().min(0).max(10_000_000),
  ownershipLabel: z.string().trim().min(1).max(100),
  ownershipDescription: z.string().trim().min(1).max(400),
  ownershipAgreement: z.string().trim().max(4000),
  /** capacity assumptions used ONLY by the admin capacity check (not shown as promises) */
  perInboxDaily: z.number().int().min(1).max(500),
  sendingDaysPerMonth: z.number().int().min(1).max(31),
  renewalReminderDays: z.number().int().min(1).max(30),
  billingTerms: z.string().trim().max(1500),
  supportEmail: email,
  upsellEnabled: z.boolean(),
  upsellHeadline: z.string().trim().min(1).max(100),
  upsellDescription: z.string().trim().min(1).max(400),
  /** extra knowledge for Pilo (admin text, never overrides the package numbers above) */
  piloNotes: z.string().trim().max(1500),
}).superRefine((v, c) => {
  const n = v.packages.map((p) => p.name.toLowerCase());
  if (new Set(n).size !== n.length) c.addIssue({ code: "custom", message: "Package names must be different.", path: ["packages"] });
  if (v.packages.filter((p) => p.featured).length > 1) c.addIssue({ code: "custom", message: "Only one package can be featured.", path: ["packages"] });
  v.packages.forEach((p) => {
    if (p.domainsMax < p.domainsMin || p.inboxesMax < p.inboxesMin) c.addIssue({ code: "custom", message: `${p.name}: a maximum is below its minimum.`, path: ["packages"] });
  });
});
export type DfySettings = z.infer<typeof dfySettingsSchema>;

const COMMON = ["Domain purchasing and configuration", "Inbox setup and warm-up", "ICP targeting", "Lead verification and de-duplication", "Copywriting", "Managed sending", "A/B testing", "Campaign optimization"];
export const DEFAULT_DFY: DfySettings = {
  enabled: true,
  packages: [
    { name: "Starter", monthlyCents: 29_900, leads: 10_000, initialSends: 10_000, followups: 3, domainsMin: 3, domainsMax: 5, inboxesMin: 15, inboxesMax: 20, reporting: "monthly", support: "Email support", cta: "Start Outbound", featured: false, features: [...COMMON, "Monthly reporting", "Email support"] },
    { name: "Growth", monthlyCents: 59_900, leads: 50_000, initialSends: 50_000, followups: 5, domainsMin: 10, domainsMax: 15, inboxesMin: 35, inboxesMax: 40, reporting: "weekly", support: "Priority support", cta: "Grow My Outbound", featured: true, features: [...COMMON, "Weekly reporting", "Priority support"] },
    { name: "Scale", monthlyCents: 99_900, leads: 100_000, initialSends: 100_000, followups: 7, domainsMin: 20, domainsMax: 30, inboxesMin: 50, inboxesMax: 60, reporting: "weekly", support: "Dedicated account manager", cta: "Scale My Outbound", featured: false, features: [...COMMON, "Weekly reporting", "Priority support", "Dedicated account manager"] },
  ],
  ownershipEnabled: true, ownershipCents: 10_000,
  ownershipLabel: "I want to own my outbound infrastructure — +$100 one-time",
  ownershipDescription: "Choose this option if you want the agreed sending domains, inboxes, and associated infrastructure accounts to be transferred to or registered under your ownership, subject to provider transfer rules.",
  ownershipAgreement: "",
  perInboxDaily: 30, sendingDaysPerMonth: 22, renewalReminderDays: 7,
  billingTerms: "DFY Outbound is a one-time purchase paid in crypto. There is no subscription and nothing renews. The optional ownership fee is charged once, together with your package.",
  supportEmail: "",
  upsellEnabled: true,
  upsellHeadline: "Got the Leads? Let Us Handle the Outreach. 🚀",
  upsellDescription: "Our team buys and configures your sending domains, sets up and warms your inboxes, writes your sequences, and manages the sending for you.",
  piloNotes: "",
};

export const DFY_SLUG = "dfy-outbound";
export const DFY_OWN_SLUG = "dfy-ownership";
export const isDfySlug = (s: string) => s === DFY_SLUG || s === DFY_OWN_SLUG;
const KEY = "dfy:settings:v1";
const DB_KEY = "dfy.settings";

/** DFY is one-time since 21 Nov 2026: stored texts that still describe monthly billing are replaced by the current wording. */
function oneTime(s: DfySettings): DfySettings {
  const old = (t: string) => /each month|per month|monthly|renew|\/mo\b/i.test(t);
  return { ...s, billingTerms: old(s.billingTerms) ? DEFAULT_DFY.billingTerms : s.billingTerms, upsellDescription: old(s.upsellDescription) ? DEFAULT_DFY.upsellDescription : s.upsellDescription, upsellHeadline: old(s.upsellHeadline) ? DEFAULT_DFY.upsellHeadline : s.upsellHeadline };
}

export async function loadDfySettings(env: CloudflareEnv): Promise<DfySettings> {
  try {
    const hit = await env.CACHE.get(KEY);
    if (hit) { const p = dfySettingsSchema.safeParse(JSON.parse(hit)); if (p.success) return p.data; }
  } catch { /* database next */ }
  try {
    const [r] = await getDbFromEnv(env).select().from(schema.systemSettings).where(eq(schema.systemSettings.key, DB_KEY));
    const p = r ? dfySettingsSchema.safeParse({ ...DEFAULT_DFY, ...(JSON.parse(r.value) as object) }) : null;
    const out = oneTime(p?.success ? p.data : DEFAULT_DFY);
    await env.CACHE.put(KEY, JSON.stringify(out), { expirationTtl: 60 }).catch(() => undefined);
    return out;
  } catch { return DEFAULT_DFY; }
}

export async function saveDfySettings(env: CloudflareEnv, value: unknown, actor: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const p = dfySettingsSchema.safeParse(value);
  if (!p.success) return { ok: false, message: p.error.issues[0]?.message ?? "Check the values." };
  try {
    const db = getDbFromEnv(env);
    const [old] = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.key, DB_KEY));
    const text = JSON.stringify(p.data);
    await db.insert(schema.systemSettings).values({ key: DB_KEY, value: text, updatedBy: actor }).onConflictDoUpdate({ target: schema.systemSettings.key, set: { value: text, updatedBy: actor, updatedAt: new Date() } });
    await db.insert(schema.settingsAuditLog).values({ actor, category: "dfy", settingKey: DB_KEY, oldValue: (old?.value ?? "").slice(0, 900), newValue: text.slice(0, 900) });
    await env.CACHE.delete(KEY).catch(() => undefined);
    return { ok: true };
  } catch { return { ok: false, message: "Could not save. Check that the database is reachable." }; }
}

export const findDfyPackage = (s: DfySettings, name: string) => s.packages.find((p) => p.name === name);
/** Theoretical ceiling of messages: every lead gets one initial send and every follow-up step. NOT a promise. */
export const messageCeiling = (leads: number, followups: number) => leads * (1 + followups);
export const range = (a: number, b: number) => (a === b ? String(a) : `${a}–${b}`);
