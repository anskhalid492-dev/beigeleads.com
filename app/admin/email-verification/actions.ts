"use server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv, schema } from "@/lib/db";
import { evSettingsSchema, loadEvSettings, saveEvSettings } from "@/lib/ev/settings";
import { isStatus } from "@/lib/ev/state";
import { adminSetStatus, removeResult, resendEv, saveNote } from "@/lib/ev/store";

type Res = { ok: true; message: string } | { ok: false; error: string };
const actor = async () => { try { return (await requireAdmin()).email; } catch { return null; } };
const env = () => getCloudflareContext().env;
const refresh = () => { revalidatePath("/admin/email-verification", "layout"); };
const NO: Res = { ok: false, error: "Not allowed. Sign in again." };

export async function statusAction(_: unknown, f: FormData): Promise<Res> {
  const who = await actor(); if (!who) return NO;
  const to = String(f.get("to") ?? "");
  if (!isStatus(to)) return { ok: false, error: "Choose a status." };
  const r = await adminSetStatus(env(), String(f.get("id") ?? ""), to, who, { reason: String(f.get("reason") ?? "").trim() });
  refresh(); return r.ok ? { ok: true, message: r.message } : { ok: false, error: r.error };
}
export async function noteAction(_: unknown, f: FormData): Promise<Res> {
  const who = await actor(); if (!who) return NO;
  const r = await saveNote(env(), String(f.get("id") ?? ""), String(f.get("note") ?? ""), who);
  refresh(); return r;
}
export async function removeResultAction(_: unknown, f: FormData): Promise<Res> {
  const who = await actor(); if (!who) return NO;
  const r = await removeResult(env(), String(f.get("id") ?? ""), String(f.get("fileId") ?? ""), who);
  refresh(); return r;
}
export async function resendAction(_: unknown, f: FormData): Promise<Res> {
  const who = await actor(); if (!who) return NO;
  const kind = String(f.get("kind") ?? "") as "payment" | "received" | "processing" | "results" | "reminder";
  if (!["payment", "received", "processing", "results", "reminder"].includes(kind)) return { ok: false, error: "Unknown email." };
  const r = await resendEv(env(), String(f.get("id") ?? ""), kind, who);
  refresh(); return r;
}
export async function quoteStatusAction(_: unknown, f: FormData): Promise<Res> {
  const who = await actor(); if (!who) return NO;
  const status = String(f.get("status") ?? "");
  if (!["new", "replied", "closed"].includes(status)) return { ok: false, error: "Unknown status." };
  await getDbFromEnv(env()).update(schema.evQuotes).set({ status, note: String(f.get("note") ?? "").slice(0, 1000) }).where(eq(schema.evQuotes.id, Number(f.get("id"))));
  refresh(); return { ok: true, message: "Saved." };
}

export async function saveSettingsAction(_: unknown, f: FormData): Promise<Res> {
  const who = await actor(); if (!who) return NO;
  let packages: unknown = [];
  try { packages = JSON.parse(String(f.get("packages") ?? "[]")); } catch { return { ok: false, error: "The package list is not valid." }; }
  const cur = await loadEvSettings(env());
  const featured = String(f.get("featured") ?? "");
  const list = (packages as { name: string; limit: number | string; price: number | string }[]).map((p) => ({ name: String(p.name ?? "").trim(), limit: Math.round(Number(p.limit)), priceCents: Math.round(Number(p.price) * 100), featured: p.name === featured }));
  const g = (k: string) => String(f.get(k) ?? "");
  const parsed = evSettingsSchema.safeParse({
    enabled: f.get("enabled") === "on", packages: list, maxUploadMb: Number(g("maxUploadMb")), formats: ["csv", "xlsx", "txt"].filter((x) => f.get(`fmt_${x}`) === "on"),
    submitLinkDays: Number(g("submitLinkDays")), resultDownloadDays: Number(g("resultDownloadDays")), retainOriginalDays: Number(g("retainOriginalDays")), retainResultDays: Number(g("retainResultDays")),
    reminderHours: Number(g("reminderHours")), supportEmail: g("supportEmail"), quoteRecipient: g("quoteRecipient"),
    upsellEnabled: f.get("upsellEnabled") === "on", upsellHeadline: g("upsellHeadline") || cur.upsellHeadline, upsellDescription: g("upsellDescription") || cur.upsellDescription, upsellPlacement: g("upsellPlacement"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the values." };
  const r = await saveEvSettings(env(), parsed.data, who);
  if (!r.ok) return { ok: false, error: r.message };
  revalidatePath("/email-list-verification"); refresh();
  return { ok: true, message: "Saved. Existing paid orders keep the package, limit and price they bought. Changes show within about a minute." };
}
