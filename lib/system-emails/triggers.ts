import { emailConfigured } from "@/lib/email/credentials";
import type { getDbFromEnv } from "@/lib/db";
import { sendEmail } from "@/lib/forms/email";
import { isTemplateOff } from "./enabled";
import { systemMail } from "./mail";
import type { Vars } from "./render";

type Db = ReturnType<typeof getDbFromEnv>;
const MAX_TRIES = 3;

/** How many times this template already went out (or was tried) for this reference. Never throws: before 0022 it says "never sent, tried 0". */
export async function sendHistory(env: CloudflareEnv, key: string, reference: string): Promise<{ sent: boolean; tries: number }> {
  try {
    const r = await env.DB.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS ok FROM email_delivery_logs WHERE template_key = ? AND reference = ? AND source = 'live'").bind(key, reference).first<{ n: number; ok: number | null }>();
    return { sent: (r?.ok ?? 0) > 0, tries: r?.n ?? 0 };
  } catch { return { sent: true, tries: MAX_TRIES }; } // no log table -> we cannot prove "once", so do not send
}

/**
 * Sends a template ONLY through the branded template (no plain-text twin: these emails are new, so a broken
 * template simply means no email). Once per (template, reference): checked against the delivery log, max 3 tries.
 */
export async function sendOnce(env: CloudflareEnv, db: Db, key: string, to: string, vars: Vars, reference: string): Promise<"sent" | "already-sent" | "skipped" | "failed"> {
  if (!(await emailConfigured(env))) return "skipped";
  if (await isTemplateOff(db, key)) return "skipped"; // an admin switched this email off
  const h = await sendHistory(env, key, reference);
  if (h.sent) return "already-sent";
  if (h.tries >= MAX_TRIES) return "skipped";
  const mail = await systemMail(db, key, to, vars, { to, subject: "", text: "" }, { reference });
  if (!mail.templateKey) return "skipped";
  return (await sendEmail(env, mail)) ? "sent" : "failed";
}

