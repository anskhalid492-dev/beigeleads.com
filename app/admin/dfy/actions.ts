"use server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv, schema } from "@/lib/db";
import { DFY_SLUG } from "@/lib/dfy/settings";
import { loadDfySettings, saveDfySettings, type DfySettings } from "@/lib/dfy/settings";
import * as S from "@/lib/dfy/store";

type Res = { ok: true; message: string } | { ok: false; error: string };
const NO: Res = { ok: false, error: "Not allowed. Sign in again." };
const num = (f: FormData, k: string) => Number(String(f.get(k) ?? "").replace(/[, ]/g, "")) || 0;
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** One admin action entry for the order page. Admins only (blog editors are rejected by requireAdmin). Every change is logged by the store. */
export async function dfyAction(_: unknown, f: FormData): Promise<Res> {
  let who: string; try { who = (await requireAdmin()).email; } catch { return NO; }
  const { env } = getCloudflareContext(); const db = getDbFromEnv(env);
  const id = str(f, "id"); const op = str(f, "op");
  let r: Res;
  switch (op) {
    case "stage": r = await S.moveStage(env, id, str(f, "to"), who, str(f, "detail")); break;
    case "pause": r = await S.pause(env, id, who, str(f, "detail")); break;
    case "resume": r = await S.resume(env, id, who); break;
    case "capacity": r = await S.saveCapacity(env, id, { domains: num(f, "domains"), inboxes: num(f, "inboxes"), perInboxDaily: num(f, "perInboxDaily"), sendingDays: num(f, "sendingDays"), plannedMessages: num(f, "plannedMessages"), note: str(f, "note") }, f.get("approve") === "1", f.get("accept") === "on", who); break;
    case "assetAdd": r = await S.addAsset(db, id, str(f, "kind") === "inbox" ? "inbox" : "domain", str(f, "name"), who); break;
    case "assetStatus": r = await S.setAssetStatus(db, id, num(f, "assetId"), str(f, "status"), str(f, "note"), who); break;
    case "announce": r = await S.announceInfra(env, id, str(f, "kind") === "inbox" ? "inbox" : "domain", str(f, "detail"), who); break;
    case "copySave": r = await S.saveCopy(db, id, { step: num(f, "step"), kind: num(f, "step") === 1 ? "initial" : "followup", variant: str(f, "variant"), subject: str(f, "subject"), body: str(f, "body") }, who); break;
    case "copySubmit": r = await S.submitCopy(env, id, who); break;
    case "metrics": r = await S.addMetrics(db, id, { period: str(f, "period"), sourced: num(f, "sourced"), verified: num(f, "verified"), approved: num(f, "approved"), contacted: num(f, "contacted"), initialSends: num(f, "initialSends"), followupSends: num(f, "followupSends"), failures: num(f, "failures"), replies: num(f, "replies"), interested: num(f, "interested"), optouts: num(f, "optouts"), meetings: num(f, "meetings"), note: str(f, "note") }, who); break;
    case "publishReport": r = await S.publishReport(env, id, num(f, "metricId"), who); break;
    case "ownership": r = await S.saveOwnership(env, id, { status: str(f, "status"), assets: str(f, "assets"), agreement: str(f, "agreement"), restrictions: str(f, "restrictions"), acknowledged: f.get("acknowledged") === "on", date: str(f, "date"), feePaid: true }, who); break;
    case "note": { await db.update(schema.dfyOrders).set({ note: str(f, "note").slice(0, 2000), updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.dfyOrders.id, id)); await S.log(db, id, who, "note"); r = { ok: true, message: "Note saved." }; break; }
    default: r = { ok: false, error: "Unknown action." };
  }
  revalidatePath("/admin/dfy", "layout");
  return r;
}

export async function dfySettingsAction(_: unknown, f: FormData): Promise<Res> {
  let who: string; try { who = (await requireAdmin()).email; } catch { return NO; }
  const { env } = getCloudflareContext();
  const cur = await loadDfySettings(env);
  const packages = cur.packages.map((p, i) => ({ ...p, name: str(f, `p${i}.name`) || p.name, monthlyCents: Math.round(num(f, `p${i}.price`) * 100), leads: num(f, `p${i}.leads`), initialSends: num(f, `p${i}.sends`), followups: num(f, `p${i}.followups`), domainsMin: num(f, `p${i}.dmin`), domainsMax: num(f, `p${i}.dmax`), inboxesMin: num(f, `p${i}.imin`), inboxesMax: num(f, `p${i}.imax`), reporting: str(f, `p${i}.reporting`) === "weekly" ? ("weekly" as const) : ("monthly" as const), support: str(f, `p${i}.support`), cta: str(f, `p${i}.cta`) || p.cta }));
  const next: DfySettings = { ...cur, packages, enabled: f.get("enabled") === "on", upsellEnabled: f.get("upsellEnabled") === "on", ownershipEnabled: f.get("ownershipEnabled") === "on", ownershipCents: Math.round(num(f, "ownershipFee") * 100), ownershipAgreement: str(f, "ownershipAgreement"), perInboxDaily: num(f, "perInboxDaily"), sendingDaysPerMonth: num(f, "sendingDays"), renewalReminderDays: num(f, "reminderDays"), billingTerms: str(f, "billingTerms"), supportEmail: str(f, "supportEmail"), piloNotes: str(f, "piloNotes"), upsellHeadline: str(f, "upsellHeadline") || cur.upsellHeadline, upsellDescription: str(f, "upsellDescription") || cur.upsellDescription };
  const r = await saveDfySettings(env, next, who);
  revalidatePath("/admin/dfy", "layout");
  return r.ok ? { ok: true, message: "Saved. Existing orders keep what they bought." } : { ok: false, error: r.message };
}
void DFY_SLUG;
