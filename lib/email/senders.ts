import { z } from "zod";
import { TEMPLATES } from "@/lib/system-emails/defaults";
import { getEmailSettings } from "@/lib/settings/email";

type Env = Pick<CloudflareEnv, "DB" | "CACHE"> & Partial<Pick<CloudflareEnv, "EMAIL_FROM">>;
export const SENDERS_KEY = "email.senders";
const CACHE_KEY = "email:senders:v1";

/** Groups of emails that may use a different sender or reply-to. */
export const SENDER_CATEGORIES = [
  { id: "orders", label: "Orders and delivery", text: "Order, payment and delivery emails to buyers." },
  { id: "inquiries", label: "Inquiries and confirmations", text: "Sample, contact, custom list and creator confirmations." },
  { id: "services", label: "Services and sales features", text: "Email verification, DFY Outbound, team requests and rewards." },
  { id: "partners", label: "Data reseller partners", text: "Partner application emails." },
  { id: "alerts", label: "Alerts to the team", text: "Messages the site sends to you." },
] as const;
export type SenderCategory = (typeof SENDER_CATEGORIES)[number]["id"];

const addr = z.string().trim().toLowerCase().max(120).refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address.");
const name = z.string().trim().max(60).refine((v) => !/[<>"\r\n]/.test(v), "The name cannot contain < > or quotes.");
const override = z.object({ name: name.optional(), email: addr.optional(), replyTo: z.enum(["default", "support", "sales"]).optional() });
export const sendersSchema = z.object({
  defaultName: name, defaultEmail: addr, replyTo: addr, supportEmail: addr, salesEmail: addr,
  overrides: z.record(z.string(), override).default({}),
});
export type Senders = z.infer<typeof sendersSchema>;
export const EMPTY_SENDERS: Senders = { defaultName: "", defaultEmail: "", replyTo: "", supportEmail: "", salesEmail: "", overrides: {} };

export async function loadSenders(env: Env): Promise<Senders> {
  try { const h = await env.CACHE.get<Senders>(CACHE_KEY, "json"); if (h) return h; } catch { /* db */ }
  try {
    const r = await env.DB.prepare("SELECT value FROM system_settings WHERE key = ?").bind(SENDERS_KEY).first<{ value: string }>();
    const p = r?.value ? sendersSchema.safeParse(JSON.parse(r.value)) : null;
    const v = p?.success ? p.data : EMPTY_SENDERS;
    try { await env.CACHE.put(CACHE_KEY, JSON.stringify(v), { expirationTtl: 60 }); } catch { /* optional */ }
    return v;
  } catch { return EMPTY_SENDERS; }
}

export const domainOf = (a: string) => a.split("@")[1]?.toLowerCase() ?? "";
export const envFromAddress = (env: Pick<CloudflareEnv, "EMAIL_FROM">) => { const b = env.EMAIL_FROM ?? "BeigeLeads <noreply@mail.beigeleads.com>"; return (/<([^>]+)>/.exec(b)?.[1] ?? b).toLowerCase(); };

/**
 * A sender address is accepted only on a domain we can show is allowed: the domain of the configured EMAIL_FROM,
 * or a domain Resend reports as verified. If Resend's domain list cannot be read, only the EMAIL_FROM domain is accepted.
 */
export function checkSenderDomains(s: Senders, envFrom: string, verified: string[] | null): string[] {
  const ok = new Set([domainOf(envFrom), ...(verified ?? [])]);
  const problems: string[] = [];
  const check = (label: string, a: string | undefined) => {
    if (!a) return;
    if (!ok.has(domainOf(a))) problems.push(`${label}: ${domainOf(a)} is not a verified sending domain${verified === null ? " (Resend's domain list is not readable with this key, so only your configured sending domain is accepted)" : ""}.`);
  };
  check("Default sender email", s.defaultEmail);
  for (const [k, o] of Object.entries(s.overrides)) check(`${k} sender email`, o.email);
  return problems;
}

export async function saveSenders(env: Env, actor: string, input: unknown, verified: string[] | null): Promise<{ ok: true } | { ok: false; error: string }> {
  const p = sendersSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check the values." };
  const cats = new Set<string>(SENDER_CATEGORIES.map((c) => c.id));
  if (Object.keys(p.data.overrides).some((k) => !cats.has(k))) return { ok: false, error: "Unknown email group." };
  for (const [k, o] of Object.entries(p.data.overrides)) {
    if (o.replyTo === "support" && !p.data.supportEmail) return { ok: false, error: `${k}: set a support email before using it as the reply-to.` };
    if (o.replyTo === "sales" && !p.data.salesEmail) return { ok: false, error: `${k}: set a sales email before using it as the reply-to.` };
  }
  const probs = checkSenderDomains(p.data, envFromAddress(env), verified);
  if (probs.length) return { ok: false, error: probs[0]! };
  try {
    const old = (await env.DB.prepare("SELECT value FROM system_settings WHERE key = ?").bind(SENDERS_KEY).first<{ value: string }>())?.value ?? "";
    const nv = JSON.stringify(p.data);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO system_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, unixepoch()) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at").bind(SENDERS_KEY, nv, actor),
      env.DB.prepare("INSERT INTO settings_audit_log (actor, category, setting_key, old_value, new_value, result) VALUES (?, 'resend', 'senders', ?, ?, 'saved')").bind(actor, old.slice(0, 1000), nv.slice(0, 1000)),
    ]);
    await env.CACHE.delete(CACHE_KEY);
  } catch { return { ok: false, error: "Could not save the sender settings." }; }
  return { ok: true };
}

/** Which group a template belongs to. Unknown or plain (no template) mails count as alerts only when they have no key. */
export function categoryOf(templateKey?: string): SenderCategory {
  const t = TEMPLATES.find((x) => x.key === templateKey);
  if (!t) return "alerts";
  if (t.audience === "admin") return "alerts";
  if (t.category === "Data Reseller Partners") return "partners";
  if (t.category === "Sales Features" || t.category === "Customer Follow-up" || t.category === "Email List Verification" || t.category === "DFY Outbound") return "services";
  if (["sample_request_received", "custom_request_received", "contact_received", "category_request_received", "creator_inquiry_received", "sample_delivery", "custom_quote"].includes(t.key)) return "inquiries";
  return "orders";
}

/** The final From and Reply-To for one email. Falls back step by step to the old behaviour (EMAIL_FROM + display name). */
export async function senderFor(env: Env, templateKey?: string): Promise<{ from: string; replyTo?: string; category: SenderCategory }> {
  const [s, legacy] = await Promise.all([loadSenders(env), getEmailSettings(env)]);
  const cat = categoryOf(templateKey);
  const o = s.overrides[cat] ?? {};
  const email = o.email || s.defaultEmail || envFromAddress(env);
  const nm = o.name || s.defaultName || legacy.senderName;
  const reply = o.replyTo === "support" ? s.supportEmail : o.replyTo === "sales" ? s.salesEmail : s.replyTo || legacy.replyTo;
  return { from: `${nm} <${email}>`, replyTo: reply || undefined, category: cat };
}
