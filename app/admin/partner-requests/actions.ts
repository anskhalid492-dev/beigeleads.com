"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDb, schema } from "@/lib/db";
import { PartnerError, approve, decline, markUnderReview, resendDecisionEmail, setPartnerDiscount } from "@/lib/partners/decide";

type Res = { ok: true; message: string } | { ok: false; error: string };
const id = z.coerce.number().int().positive();
const emailMsg = (e: string | null) => (e === "sent" ? "The email was handed to the email service." : e === "already-sent" ? "That email was already sent earlier." : e === "skipped" ? "The email was NOT sent (email service not configured, or the template is switched off)." : e === "failed" ? "The email could not be sent. Use \"Resend decision email\"." : "");

async function run(form: FormData, fn: (env: CloudflareEnv, actor: string, appId: number) => Promise<string>): Promise<Res> {
  let admin;
  try { admin = await requireAdmin(); } catch { return { ok: false, error: "Your session ended. Sign in again." }; }
  const p = id.safeParse(form.get("id"));
  if (!p.success) return { ok: false, error: "Invalid request." };
  try {
    const message = await fn(getCloudflareContext().env, admin.email, p.data);
    revalidatePath("/admin/partner-requests", "layout");
    return { ok: true, message };
  } catch (e) {
    return { ok: false, error: e instanceof PartnerError ? e.message : "Something went wrong. Try again." };
  }
}
const audit = (actor: string, appId: number, what: string) =>
  getDb().insert(schema.settingsAuditLog).values({ actor, category: "partners", settingKey: `application:${appId}`, newValue: what }).catch(() => {});

/** Every action returns a message so the UI can show the real outcome (including whether the email went out). */
export async function underReviewAction(_: unknown, form: FormData): Promise<Res> {
  return run(form, async (_env, who, n) => { await markUnderReview(getDb(), n); await audit(who, n, "under review"); return "Marked under review."; });
}
export async function approveAction(_: unknown, form: FormData): Promise<Res> {
  return run(form, async (env, who, n) => { const r = await approve(env, getDb(), who, n); await audit(who, n, "approved"); return `Approved. The partner code was created. ${emailMsg(r.email)}`; });
}
export async function declineAction(_: unknown, form: FormData): Promise<Res> {
  return run(form, async (env, who, n) => { const r = await decline(env, getDb(), who, n); await audit(who, n, "declined"); return `Declined. ${emailMsg(r.email)}`; });
}
export async function resendAction(_: unknown, form: FormData): Promise<Res> {
  return run(form, async (env, _who, n) => { const r = await resendDecisionEmail(env, getDb(), n); return emailMsg(r.email) || "Done."; });
}
export async function discountAction(_: unknown, form: FormData): Promise<Res> {
  const active = form.get("active") === "1";
  return run(form, async (_env, who, n) => { await setPartnerDiscount(getDb(), n, active); await audit(who, n, active ? "code reactivated" : "code deactivated"); return active ? "The partner code is active again." : "The partner code is deactivated. It no longer works at checkout."; });
}
export async function noteAction(_: unknown, form: FormData): Promise<Res> {
  const note = z.string().trim().max(2000).safeParse(form.get("note") ?? "");
  if (!note.success) return { ok: false, error: "The note is too long." };
  return run(form, async (_env, _who, n) => { await getDb().update(schema.partnerApplications).set({ internalNote: note.data || null, updatedAt: Date.now() }).where(eq(schema.partnerApplications.id, n)); return "Note saved."; });
}
