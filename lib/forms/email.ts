import { getEmailSettings, type EmailEvent } from "@/lib/settings/email";
import { resolveResend } from "@/lib/email/credentials";
import { senderFor } from "@/lib/email/senders";

/** `html` + `templateKey` come from System Emails; plain callers keep sending text only. */
export type Mail = { to: string; subject: string; text: string; html?: string; templateKey?: string; reference?: string; source?: "live" | "test"; /** Founder emails only: exact From, Reply-To and extra headers (List-Unsubscribe). */ from?: string; replyTo?: string; headers?: Record<string, string> };
export type SendDetail = { ok: boolean; status: number; error?: string; id?: string };

/** "alex@example.com" -> "a***@example.com". Logs never keep a full address. */
export function maskEmail(a: string): string {
  const [u = "", d = ""] = a.split("@");
  return `${u.slice(0, 1)}***@${d}`;
}

async function logSend(env: CloudflareEnv, mail: Mail, r: SendDetail): Promise<void> {
  if (!mail.templateKey) return;
  try {
    await env.DB.prepare("INSERT INTO email_delivery_logs (template_key, source, recipient, subject, reference, status, provider_id, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(mail.templateKey, mail.source ?? "live", mail.to.split(",").map((x) => maskEmail(x.trim())).join(", ").slice(0, 300), mail.subject.slice(0, 200), (mail.reference ?? "").slice(0, 60), r.ok ? "sent" : "failed", r.id ?? "", (r.error ?? "").slice(0, 300)).run();
  } catch { /* the log table may not exist yet; sending must never depend on it */ }
}

/** Like sendEmail but says what Resend answered. Never includes the API key. Used by the admin test email. */
export async function sendEmailDetailed(env: CloudflareEnv, mail: Mail): Promise<SendDetail> {
  const r = await sendRaw(env, mail);
  await logSend(env, mail, r);
  return r;
}

async function sendRaw(env: CloudflareEnv, mail: Mail): Promise<SendDetail> {
  // Key: encrypted admin key first, then the RESEND_API_KEY variable. Never logged or returned.
  const cred = await resolveResend(env);
  if (!cred.key) return { ok: false, status: 0, error: "Email is not configured: add a Resend API key in Admin > Settings > Integrations > Resend." };
  const snd = await senderFor(env, mail.templateKey);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cred.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mail.from ?? snd.from, to: mail.to.split(",").map((x) => x.trim()).filter(Boolean), subject: mail.subject, text: mail.text, ...(mail.html ? { html: mail.html } : {}), ...((mail.replyTo ?? snd.replyTo) ? { reply_to: mail.replyTo ?? snd.replyTo } : {}), ...(mail.headers ? { headers: mail.headers } : {}) }),
    });
    if (res.ok) {
      let id: string | undefined;
      try { id = ((await res.json()) as { id?: string }).id; } catch { /* id is optional */ }
      return { ok: true, status: res.status, id };
    }
    let error = `Resend answered HTTP ${res.status}.`;
    try { const j = (await res.json()) as { message?: string }; if (j.message) error = `Resend: ${String(j.message).slice(0, 200)}`; } catch { /* keep generic text */ }
    return { ok: false, status: res.status, error };
  } catch { return { ok: false, status: 0, error: "Could not reach Resend (network error)." }; }
}

/** Sends a plain-text transactional email through Resend. Never throws; never logs addresses. */
export async function sendEmail(env: CloudflareEnv, mail: Mail): Promise<boolean> {
  return (await sendEmailDetailed(env, mail)).ok;
}

/**
 * Who gets an owner alert. NOTIFY_EMAIL (infrastructure) is always first. Request-type alerts (`event` given) can be
 * switched off or copied to extra recipients in Settings; everything else (payments, wallets, delivery failures) goes to
 * NOTIFY_EMAIL only and cannot be switched off.
 */
export async function ownerRecipients(env: CloudflareEnv, event?: EmailEvent | "custom_list"): Promise<string | undefined> {
  if (!env.NOTIFY_EMAIL) return undefined;
  if (!event) return env.NOTIFY_EMAIL;
  const s = await getEmailSettings(env);
  if (event !== "custom_list" && s.toggles[event] === false) return undefined;
  if (event === "delivered") return env.NOTIFY_EMAIL;
  return [env.NOTIFY_EMAIL, ...s.extra.filter((a) => a.toLowerCase() !== env.NOTIFY_EMAIL?.toLowerCase())].join(",");
}

/** Tells the owner something happened. Skips when NOTIFY_EMAIL is not set or the alert was switched off. */
export async function notifyOwner(env: CloudflareEnv, subject: string, text: string, event?: EmailEvent): Promise<void> {
  const to = await ownerRecipients(env, event);
  if (!to) return;
  await sendEmail(env, { to, subject: `[BeigeLeads] ${subject}`, text });
}
