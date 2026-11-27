"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv, schema } from "@/lib/db";
import { REPLY_TO, fromHeader } from "@/lib/founder/config";
import { senderOf } from "@/lib/founder/engine";
import { loadCs } from "@/lib/founder/settings";
import { FOUNDER_TEMPLATES } from "@/lib/founder/templates";
import { sendEmailDetailed } from "@/lib/forms/email";
import { getBranding } from "@/lib/system-emails/branding";
import { manualSchema, renderManual } from "@/lib/system-emails/manual";
import { systemVars } from "@/lib/system-emails/mail";
import { getEditable } from "@/lib/system-emails/store";

const founderKey = (k: string) => FOUNDER_TEMPLATES.some((t) => t.key === k);
type Res<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const NO = "Your session ended. Sign in again.";

async function prepare(raw: unknown) {
  const env = getCloudflareContext().env;
  const p = manualSchema.safeParse(raw);
  if (!p.success) return { error: p.error.issues[0]?.message ?? "Check the form." } as const;
  const db = getDbFromEnv(env);
  const t = await getEditable(db, p.data.templateKey);
  if (!t || t.def.audience !== "customer") return { error: "Pick a customer email template." } as const;
  const br = await getBranding(db);
  const out = renderManual(t.published, p.data, br, { ...systemVars(), ...(br.supportEmail ? { support_email: br.supportEmail } : {}) });
  if (!out.r) return { error: out.error ?? "Could not build the email." } as const;
  return { env, db, input: p.data, r: out.r } as const;
}

export async function previewManualAction(raw: unknown): Promise<Res<{ html: string; text: string; subject: string }>> {
  try { await requireAdmin(); } catch { return { ok: false, error: NO }; }
  const x = await prepare(raw);
  if ("error" in x) return { ok: false, error: x.error ?? "Error" };
  return { ok: true, html: x.r.html, text: x.r.text, subject: x.r.subject };
}

export async function sendManualAction(raw: unknown, opts: { markDelivered: boolean; confirmed: boolean }): Promise<Res<{ to: string; marked: boolean }>> {
  let admin;
  try { admin = await requireAdmin(); } catch { return { ok: false, error: NO }; }
  if (!opts.confirmed) return { ok: false, error: "Tick the box to confirm you checked the preview." };
  const x = await prepare(raw);
  if ("error" in x) return { ok: false, error: x.error ?? "Error" };
  const { env, db, input, r } = x;
  const rk = `sysmailmanual:${admin.email}:${Math.floor(Date.now() / 3_600_000)}`;
  const n = Number((await env.CACHE.get(rk)) ?? 0);
  if (n >= 30) return { ok: false, error: "Limit reached (30 manual emails per hour). Try again later." };
  await env.CACHE.put(rk, String(n + 1), { expirationTtl: 3700 });

  const ref = input.orderId || `manual-${crypto.randomUUID().slice(0, 8)}`;
  const res = await sendEmailDetailed(env, { to: input.to, subject: r.subject, text: r.text, html: r.html, templateKey: input.templateKey, reference: ref, source: "live", ...(founderKey(input.templateKey) ? { from: fromHeader(senderOf(input.templateKey, await loadCs(env))), replyTo: REPLY_TO } : {}) });
  if (!res.ok) return { ok: false, error: res.error ?? "The email was not accepted by the email service." };

  let marked = false;
  try {
    await db.insert(schema.settingsAuditLog).values({ actor: admin.email, category: "system-emails", settingKey: input.templateKey, newValue: `manual send (${ref})` });
    if (opts.markDelivered && input.orderId) {
      const [o] = await db.select().from(schema.orders).where(and(eq(schema.orders.id, input.orderId), eq(schema.orders.status, "paid")));
      if (o) {
        const urls = input.buttons.map((b) => b.url).join("\n");
        await db.insert(schema.deliveries).values({ orderId: o.id, url: urls, status: "sent", attempts: 1, sentAt: new Date() })
          .onConflictDoUpdate({ target: schema.deliveries.orderId, set: { url: urls, status: "sent", sentAt: new Date() } });
        await db.insert(schema.orderAuditLog).values({ orderId: o.id, actor: admin.email, action: "manual-delivery", detail: `Sent by hand to ${input.to.replace(/^(.).*(@.*)$/, "$1***$2")}` });
        marked = true;
      }
    }
  } catch { /* the email is already sent; bookkeeping failures must not hide that */ }
  revalidatePath("/admin/delivery");
  revalidatePath("/admin/system-emails", "layout");
  return { ok: true, to: input.to, marked };
}
