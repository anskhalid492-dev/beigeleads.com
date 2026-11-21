"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv, schema } from "@/lib/db";
import { saveNeg } from "@/lib/beigepilot/v2/offers";
import { parseNeg } from "@/lib/beigepilot/v2/negotiate";

export type NegResult = { ok: boolean; message: string };

export async function saveNegAction(_: NegResult | null, form: FormData): Promise<NegResult> {
  let who: string; try { who = (await requireAdmin()).email; } catch { return { ok: false, message: "Not allowed." }; }
  let raw: Record<string, unknown>; try { raw = JSON.parse(String(form.get("payload"))) as Record<string, unknown>; } catch { return { ok: false, message: "Could not read the form." }; }
  const maxIn = Number(raw.maxPercent);
  if (!Number.isFinite(maxIn) || maxIn < 1) return { ok: false, message: "Enter a maximum discount of at least 1%." };
  if (maxIn > 20) return { ok: false, message: "The maximum discount can never be above 20%." };
  const lv = Array.isArray(raw.levels) ? raw.levels.map(Number) : [];
  if (lv.some((n) => n > maxIn)) return { ok: false, message: `An offer level is above your ${maxIn}% maximum.` };
  if (raw.enabled === true && lv.length === 0) return { ok: false, message: "Choose at least one offer level." };
  const policy = parseNeg(JSON.stringify(raw)); // clamps and cleans every field again on the server
  const env = getCloudflareContext().env;
  try { await saveNeg(env, policy); } catch { return { ok: false, message: "Could not save. Run migration 0037 in D1 first." }; }
  await getDbFromEnv(env).insert(schema.settingsAuditLog).values({ actor: who, category: "beigepilot", settingKey: "negotiation", newValue: `enabled=${policy.enabled} max=${policy.maxPercent} levels=${policy.levels.join("/")}` }).catch(() => undefined);
  revalidatePath("/admin/beigepilot", "layout");
  return { ok: true, message: "Saved. Visitors get the new rules within about a minute. Offers already issued keep the terms they were made with." };
}
