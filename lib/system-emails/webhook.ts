import { notifyOwner } from "@/lib/forms/email";

/** Delivery states in order of "how far the email got". A later event never moves the status backwards. */
export const STATUS_RANK: Record<string, number> = { sent: 1, delivery_delayed: 2, delivered: 3, opened: 3, clicked: 3, failed: 4, bounced: 5, complained: 6 };
const EVENT_TO_STATUS: Record<string, string> = {
  "email.sent": "sent", "email.delivered": "delivered", "email.delivery_delayed": "delivery_delayed",
  "email.bounced": "bounced", "email.complained": "complained", "email.failed": "failed",
};
export const PROBLEM_STATUSES = ["bounced", "complained", "failed"];
const TOLERANCE_SECONDS = 5 * 60;

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64(buf: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/**
 * Verifies a Svix signature (the scheme Resend uses): HMAC-SHA256 of `${id}.${timestamp}.${body}` with the
 * base64 part of the `whsec_...` secret, compared with every `v1,<sig>` in the header. Rejects stale timestamps.
 */
export async function verifySvix(secret: string, headers: { id: string | null; timestamp: string | null; signature: string | null }, body: string, nowSeconds = Math.floor(Date.now() / 1000)): Promise<boolean> {
  const { id, timestamp, signature } = headers;
  if (!secret || !id || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > TOLERANCE_SECONDS) return false;
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey("raw", b64ToBytes(secret.replace(/^whsec_/, "")) as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  } catch { return false; }
  const expected = bytesToB64(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${body}`)));
  return signature.split(" ").some((part) => {
    const [ver, sig] = part.split(",");
    return ver === "v1" && !!sig && safeEqual(sig, expected);
  });
}

export type WebhookResult = { ok: boolean; status: number; note?: string };

/** Reads the event, records it once (svix-id), and moves the matching log row forward. */
export async function processResendEvent(env: CloudflareEnv, svixId: string, body: string): Promise<WebhookResult> {
  let evt: { type?: string; data?: { email_id?: string; bounce?: { message?: string; type?: string; subType?: string }; failed?: { reason?: string }; reason?: string } };
  try { evt = JSON.parse(body); } catch { return { ok: false, status: 400, note: "bad json" }; }
  const status = EVENT_TO_STATUS[evt.type ?? ""];
  const providerId = String(evt.data?.email_id ?? "").slice(0, 100);
  if (!status || !providerId) return { ok: true, status: 200, note: "ignored" };

  // Same event delivered twice (Resend retries) -> the second insert is ignored.
  const ins = await env.DB.prepare("INSERT OR IGNORE INTO email_webhook_events (id, type, provider_id) VALUES (?, ?, ?)").bind(svixId.slice(0, 100), evt.type!, providerId).run();
  if (!ins.meta.changes) return { ok: true, status: 200, note: "duplicate" };

  const row = await env.DB.prepare("SELECT id, template_key, reference, delivery_status FROM email_delivery_logs WHERE provider_id = ? ORDER BY id DESC LIMIT 1").bind(providerId).first<{ id: number; template_key: string; reference: string; delivery_status: string }>();
  if (!row) return { ok: true, status: 200, note: "no matching log" };
  await env.DB.prepare("UPDATE email_webhook_events SET matched = 1 WHERE id = ?").bind(svixId.slice(0, 100)).run();

  if ((STATUS_RANK[status] ?? 0) <= (STATUS_RANK[row.delivery_status] ?? 0)) return { ok: true, status: 200, note: "older event" };
  const detail = String(evt.data?.bounce?.message ?? evt.data?.failed?.reason ?? evt.data?.reason ?? (evt.data?.bounce?.type ? `${evt.data.bounce.type}${evt.data.bounce.subType ? ` / ${evt.data.bounce.subType}` : ""}` : "")).slice(0, 300);
  const up = await env.DB.prepare("UPDATE email_delivery_logs SET delivery_status = ?, delivery_detail = ?, status_at = unixepoch() WHERE id = ? AND delivery_status = ?").bind(status, detail, row.id, row.delivery_status).run();
  if (up.meta.changes && PROBLEM_STATUSES.includes(status)) {
    await notifyOwner(env, `Email ${status}: ${row.template_key}`, `A system email was not delivered.\n\nTemplate: ${row.template_key}\nReference: ${row.reference || "-"}\nResult: ${status}${detail ? `\nDetail: ${detail}` : ""}\n\nOpen Admin > System Emails > Email activity to see it. The customer's address is not shown in logs; use the order or request reference to find them.`).catch(() => undefined);
  }
  return { ok: true, status: 200, note: status };
}

/** Webhook event rows and finished log rows older than this are removed by the 15-minute cron. */
export const WEBHOOK_EVENT_DAYS = 30;
export const LOG_RETENTION_DAYS = 180;
export async function purgeEmailLogs(env: CloudflareEnv): Promise<void> {
  await env.DB.prepare(`DELETE FROM email_webhook_events WHERE created_at < unixepoch() - ${WEBHOOK_EVENT_DAYS * 86400}`).run();
  await env.DB.prepare(`DELETE FROM email_delivery_logs WHERE created_at < unixepoch() - ${LOG_RETENTION_DAYS * 86400}`).run();
}
