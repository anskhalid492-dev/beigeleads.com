"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv, schema } from "@/lib/db";
import { savePro } from "@/lib/beigepilot/proactive/store";
import { checkDelays, checkTemplate, DEFAULT_TEMPLATES, PAGE_KINDS, type ProSettings } from "@/lib/beigepilot/proactive/types";

export type ProResult = { ok: boolean; message: string };
type Payload = { enabled: boolean; delays: number[]; bubbleSeconds: number; pages: Record<string, boolean>; cartMessages: boolean; mobile: boolean; exitIntent?: boolean; templates: { id: string; text: string; cta: string; ask: string; on: boolean }[] };

export async function saveProAction(_: ProResult | null, form: FormData): Promise<ProResult> {
  let who: string; try { who = (await requireAdmin()).email; } catch { return { ok: false, message: "Not allowed." }; }
  let p: Payload; try { p = JSON.parse(String(form.get("payload"))) as Payload; } catch { return { ok: false, message: "Could not read the form." }; }
  const delays = (p.delays ?? []).map(Number);
  const bad = checkDelays(delays); if (bad) return { ok: false, message: bad };
  const bs = Number(p.bubbleSeconds); if (!Number.isFinite(bs) || bs < 8 || bs > 60) return { ok: false, message: "A bubble must stay between 8 and 60 seconds." };
  const templates = [];
  for (const base of DEFAULT_TEMPLATES) {
    const t = p.templates?.find((x) => x.id === base.id);
    const next = { ...base, text: String(t?.text ?? base.text).trim(), cta: String(t?.cta ?? base.cta).trim(), ask: String(t?.ask ?? base.ask).trim(), on: t ? !!t.on : true };
    const err = checkTemplate(next); if (err) return { ok: false, message: `${base.id}: ${err}` };
    templates.push(next);
  }
  for (const stage of [1, 2, 3]) if (!templates.some((t) => t.stage === stage && t.kind === "default" && t.on)) return { ok: false, message: `Message ${stage} needs its default template switched on, so every page has something to show.` };
  const pages = Object.fromEntries(PAGE_KINDS.map((k) => [k, !!p.pages?.[k]])) as ProSettings["pages"];
  const env = getCloudflareContext().env;
  const s: ProSettings = { enabled: !!p.enabled, delays: delays as [number, number, number], bubbleSeconds: Math.round(bs), pages, cartMessages: !!p.cartMessages, mobile: !!p.mobile, exitIntent: p.exitIntent !== false, templates };
  try { await savePro(env, s); } catch { return { ok: false, message: "Could not save. Run migration 0037 in D1 first." }; }
  await getDbFromEnv(env).insert(schema.settingsAuditLog).values({ actor: who, category: "beigepilot", settingKey: "proactive", newValue: `enabled=${s.enabled} delays=${delays.join("/")}` }).catch(() => {});
  revalidatePath("/admin/beigepilot", "layout");
  return { ok: true, message: "Saved. Visitors get the new settings within about a minute; sessions already running keep their place in the sequence." };
}
