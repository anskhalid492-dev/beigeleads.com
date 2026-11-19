import { loadCategory } from "./service";

type Env = { DB: D1Database; CACHE: KVNamespace };
export const EMAIL_CACHE_KEY = "settings:email:v1";

export type EmailSettings = { senderName: string; replyTo: string; extra: string[]; toggles: Record<EmailEvent, boolean> };
/** Owner alerts an admin may switch off. Payment, delivery-failure, wallet and order-decision alerts are NOT here on purpose. */
export type EmailEvent = "sample" | "contact" | "category" | "delivered";
const FALLBACK: EmailSettings = { senderName: "BeigeLeads", replyTo: "", extra: [], toggles: { sample: true, contact: true, category: true, delivered: true } };

/** Saved email settings, kept in KV for 60 s. Never throws: any failure means the safe defaults. */
export async function getEmailSettings(env: Env): Promise<EmailSettings> {
  try { const hit = await env.CACHE.get<EmailSettings>(EMAIL_CACHE_KEY, "json"); if (hit) return hit; } catch { /* read from D1 */ }
  try {
    const { values: v } = await loadCategory(env, "email");
    const out: EmailSettings = {
      senderName: v.senderName || FALLBACK.senderName, replyTo: v.replyTo,
      extra: v.extraRecipients ? v.extraRecipients.split(",").map((x) => x.trim()).filter(Boolean) : [],
      toggles: { sample: v.notifySample !== "false", contact: v.notifyContact !== "false", category: v.notifyCategory !== "false", delivered: v.notifyDelivered !== "false" },
    };
    try { await env.CACHE.put(EMAIL_CACHE_KEY, JSON.stringify(out), { expirationTtl: 60 }); } catch { /* optional */ }
    return out;
  } catch { return FALLBACK; }
}
