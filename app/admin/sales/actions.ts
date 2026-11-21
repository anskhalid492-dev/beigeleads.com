"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv, schema } from "@/lib/db";
import { saveSalesSetting } from "@/lib/sales/settings";
import { revokeReward, sendRewardEmail } from "@/lib/sales/reward";
import { eq } from "drizzle-orm";

type Res = { ok: true; message: string } | { ok: false; error: string };
const actor = async () => { try { return (await requireAdmin()).email; } catch { return null; } };
const list = (v: FormDataEntryValue | null) => String(v ?? "").split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
const bool = (f: FormData, k: string) => f.get(k) === "on";

export async function saveVolumeAction(_: unknown, f: FormData): Promise<Res> {
  const who = await actor(); if (!who) return { ok: false, error: "Your session ended. Sign in again." };
  const mins = f.getAll("min").map(Number), pcts = f.getAll("percent").map(Number);
  const tiers = mins.map((min, i) => ({ min, percent: pcts[i] })).filter((t) => Number.isFinite(t.min) && t.min > 0 && Number.isFinite(t.percent) && t.percent > 0);
  const r = await saveSalesSetting(getCloudflareContext().env, "volume", { enabled: bool(f, "enabled"), tiers, excludedProducts: list(f.get("excludedProducts")), excludedCategories: list(f.get("excludedCategories")), stackWithPromos: bool(f, "stackWithPromos") }, who);
  if (!r.ok) return { ok: false, error: r.message };
  revalidatePath("/admin/sales/volume"); return { ok: true, message: "Saved. The cart and checkout use it within a minute." };
}

export async function saveRewardAction(_: unknown, f: FormData): Promise<Res> {
  const who = await actor(); if (!who) return { ok: false, error: "Your session ended. Sign in again." };
  const cap = String(f.get("maxDiscount") ?? "").trim();
  const r = await saveSalesSetting(getCloudflareContext().env, "reward", {
    enabled: bool(f, "enabled"), percent: Number(f.get("percent")), expiryDays: Number(f.get("expiryDays")),
    maxDiscountCents: cap === "" ? null : Math.round(Number(cap) * 100), minOrderCents: Math.round(Number(f.get("minOrder") || 0) * 100),
    productSlugs: list(f.get("productSlugs")), categorySlugs: list(f.get("categorySlugs")), combineVolume: bool(f, "combineVolume"),
    reminders: bool(f, "reminders"), reminderDays: Number(f.get("reminderDays")), expiryReminderHours: Number(f.get("expiryReminderHours")),
  }, who);
  if (!r.ok) return { ok: false, error: r.message };
  revalidatePath("/admin/sales/reward"); return { ok: true, message: "Saved. New codes use these rules; codes already sent keep the terms they were sent with." };
}

export async function revokeRewardAction(_: unknown, f: FormData): Promise<Res> {
  const who = await actor(); if (!who) return { ok: false, error: "Your session ended. Sign in again." };
  const id = Number(f.get("id")); const env = getCloudflareContext().env;
  const ok = await revokeReward(getDbFromEnv(env), id);
  await getDbFromEnv(env).insert(schema.settingsAuditLog).values({ actor: who, category: "sales", settingKey: `reward:${id}`, newValue: "revoked" }).catch(() => {});
  revalidatePath("/admin/sales/reward"); return ok ? { ok: true, message: "Revoked. The code no longer works." } : { ok: false, error: "Nothing to revoke." };
}

export async function resendRewardAction(_: unknown, f: FormData): Promise<Res> {
  const who = await actor(); if (!who) return { ok: false, error: "Your session ended. Sign in again." };
  const id = Number(f.get("id")); const env = getCloudflareContext().env; const db = getDbFromEnv(env);
  const [r] = await db.select().from(schema.rewardCodes).where(eq(schema.rewardCodes.id, id));
  if (!r) return { ok: false, error: "Code not found." };
  if (r.emailStatus === "sent") return { ok: false, error: "The first email was already accepted by the email service. It is not sent twice." };
  const x = await sendRewardEmail(env, id, "reward_first");
  await db.insert(schema.settingsAuditLog).values({ actor: who, category: "sales", settingKey: `reward:${id}`, newValue: `resend ${x}` }).catch(() => {});
  revalidatePath("/admin/sales/reward");
  return x === "sent" || x === "already-sent" ? { ok: true, message: "Email accepted by the email service." } : { ok: false, error: x === "skipped" ? "Code is not active, or sending is not configured." : "The email service did not accept it. Try again." };
}
