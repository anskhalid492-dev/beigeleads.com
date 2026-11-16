type Mail = { to: string; subject: string; text: string };

/** Sends a plain-text transactional email through Resend. Never throws; never logs addresses. */
export async function sendEmail(env: CloudflareEnv, mail: Mail): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false; // not configured yet: skip quietly
  const from = env.EMAIL_FROM ?? "BeigeLeads <noreply@mail.beigeleads.com>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: mail.to, subject: mail.subject, text: mail.text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Tells the owner something happened. Skips when NOTIFY_EMAIL is not set. */
export async function notifyOwner(env: CloudflareEnv, subject: string, text: string): Promise<void> {
  if (!env.NOTIFY_EMAIL) return;
  await sendEmail(env, { to: env.NOTIFY_EMAIL, subject: `[BeigeLeads] ${subject}`, text });
}
