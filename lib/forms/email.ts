import { getEmailSettings, type EmailEvent } from "@/lib/settings/email";

type Mail = { to: string; subject: string; text: string };
export type SendDetail = { ok: boolean; status: number; error?: string };

const DEFAULT_FROM = "BeigeLeads <noreply@mail.beigeleads.com>";
/** The address comes from the EMAIL_FROM variable (a verified domain); only the display name is editable in settings. */
function fromAddress(env: CloudflareEnv, name: string): string {
  const base = env.EMAIL_FROM ?? DEFAULT_FROM;
  const addr = /<([^>]+)>/.exec(base)?.[1] ?? base;
  return `${name} <${addr}>`;
}

/** Like sendEmail but says what Resend answered. Never includes the API key. Used by the admin test email. */
export async function sendEmailDetailed(env: CloudflareEnv, mail: Mail): Promise<SendDetail> {
  if (!env.RESEND_API_KEY) return { ok: false, status: 0, error: "RESEND_API_KEY is not set in Cloudflare." };
  const s = await getEmailSettings(env);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromAddress(env, s.senderName), to: mail.to.split(",").map((x) => x.trim()).filter(Boolean), subject: mail.subject, text: mail.text, ...(s.replyTo ? { reply_to: s.replyTo } : {}) }),
    });
    if (res.ok) return { ok: true, status: res.status };
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
