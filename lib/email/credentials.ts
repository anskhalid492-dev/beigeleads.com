import { decryptSecret, encryptSecret, hint, secretOk } from "./crypto";
import { checkKey, type KeyCheck } from "./resend-api";

type Env = Partial<Pick<CloudflareEnv, "RESEND_API_KEY" | "RESEND_WEBHOOK_SECRET" | "EMAIL_KEY_SECRET" | "DB">>;
export type Source = "admin" | "env" | "none";
export type Resolved = { key: string; source: Source; adminBroken: boolean };

let memo: { at: number; v: Resolved } | null = null;
let memoHook: { at: number; v: { secret: string; source: Source } } | null = null;
const TTL = 15_000;
/** Test helper: forget the in-isolate memo. Saving credentials also calls it. */
export const resetCredentialMemo = () => { memo = null; memoHook = null; };

type Row = { api_key_enc: string; webhook_secret_enc: string };
async function row(env: Env): Promise<Row | null> {
  if (!env.DB) return null;
  try { return await env.DB.prepare("SELECT api_key_enc, webhook_secret_enc FROM email_integration WHERE id='main'").first<Row>(); } catch { return null; }
}

/** Priority: valid encrypted admin key, then the RESEND_API_KEY variable, then nothing. Never throws. */
export async function resolveResend(env: Env): Promise<Resolved> {
  if (memo && Date.now() - memo.at < TTL) return memo.v;
  let v: Resolved = { key: env.RESEND_API_KEY ?? "", source: env.RESEND_API_KEY ? "env" : "none", adminBroken: false };
  const r = await row(env);
  if (r?.api_key_enc) {
    const k = await decryptSecret(r.api_key_enc, env.EMAIL_KEY_SECRET);
    if (k) v = { key: k, source: "admin", adminBroken: false }; else v.adminBroken = true;
  }
  memo = { at: Date.now(), v };
  return v;
}
/** True when an email can be attempted at all (admin key or variable). */
export async function emailConfigured(env: Env): Promise<boolean> {
  if (env.RESEND_API_KEY) return true;
  return (await resolveResend(env)).source !== "none";
}
export async function resolveWebhookSecret(env: Env): Promise<{ secret: string; source: Source }> {
  if (memoHook && Date.now() - memoHook.at < TTL) return memoHook.v;
  let v = { secret: env.RESEND_WEBHOOK_SECRET ?? "", source: (env.RESEND_WEBHOOK_SECRET ? "env" : "none") as Source };
  const r = await row(env);
  if (r?.webhook_secret_enc) { const s = await decryptSecret(r.webhook_secret_enc, env.EMAIL_KEY_SECRET); if (s) v = { secret: s, source: "admin" }; }
  memoHook = { at: Date.now(), v };
  return v;
}

export type Status = {
  encryptionReady: boolean; tableReady: boolean; source: Source; adminBroken: boolean;
  apiKeyHint: string; apiKeyUpdatedAt: number | null; apiKeyUpdatedBy: string; envKeySet: boolean;
  webhookSource: Source; webhookHint: string; webhookUpdatedAt: number | null; lastCheck: (KeyCheck & { at: number }) | null;
};
/** What the admin screens may see. Contains hints only, never a key. */
export async function credentialStatus(env: Env): Promise<Status> {
  const out: Status = { encryptionReady: secretOk(env.EMAIL_KEY_SECRET), tableReady: false, source: "none", adminBroken: false, apiKeyHint: "", apiKeyUpdatedAt: null, apiKeyUpdatedBy: "", envKeySet: !!env.RESEND_API_KEY, webhookSource: env.RESEND_WEBHOOK_SECRET ? "env" : "none", webhookHint: "", webhookUpdatedAt: null, lastCheck: null };
  try {
    const r = env.DB ? await env.DB.prepare("SELECT api_key_hint, api_key_updated_at, api_key_updated_by, webhook_hint, webhook_updated_at, last_check_json FROM email_integration WHERE id='main'").first<{ api_key_hint: string; api_key_updated_at: number | null; api_key_updated_by: string; webhook_hint: string; webhook_updated_at: number | null; last_check_json: string }>() : null;
    out.tableReady = true;
    if (r) { out.apiKeyHint = r.api_key_hint; out.apiKeyUpdatedAt = r.api_key_updated_at; out.apiKeyUpdatedBy = r.api_key_updated_by; out.webhookHint = r.webhook_hint; out.webhookUpdatedAt = r.webhook_updated_at; try { out.lastCheck = r.last_check_json ? JSON.parse(r.last_check_json) : null; } catch { /* none */ } }
  } catch { out.tableReady = false; }
  const res = await resolveResend(env);
  out.source = res.source; out.adminBroken = res.adminBroken;
  out.webhookSource = (await resolveWebhookSecret(env)).source;
  return out;
}

export async function rememberCheck(env: Env, c: KeyCheck): Promise<void> {
  try { await env.DB?.prepare("INSERT INTO email_integration (id, last_check_json) VALUES ('main', ?) ON CONFLICT(id) DO UPDATE SET last_check_json = excluded.last_check_json").bind(JSON.stringify({ state: c.state, detail: c.detail, ms: c.ms, at: Date.now() })).run(); } catch { /* optional */ }
}

export type SaveResult = { ok: true; check: KeyCheck; hint: string } | { ok: false; error: string; check?: KeyCheck };
const KEY_RE = /^re_[A-Za-z0-9_\-]{16,200}$/;

/** Validates the NEW key with Resend first; the stored key changes only when the check says it works. */
export async function saveApiKey(env: Env, actor: string, raw: string, check: (k: string) => Promise<KeyCheck> = checkKey): Promise<SaveResult> {
  const k = raw.trim();
  if (!KEY_RE.test(k)) return { ok: false, error: "That does not look like a Resend API key (it starts with re_)." };
  if (!secretOk(env.EMAIL_KEY_SECRET)) return { ok: false, error: "Set the secret EMAIL_KEY_SECRET (32+ characters) in Cloudflare first. It encrypts the saved key." };
  const c = await check(k);
  if (c.state !== "valid_full" && c.state !== "valid_sending_only") return { ok: false, error: c.state === "invalid" ? "Resend did not accept this key. The saved key was not changed." : `${c.detail} The saved key was not changed.`, check: c };
  const enc = await encryptSecret(k, env.EMAIL_KEY_SECRET);
  try {
    await env.DB!.prepare("INSERT INTO email_integration (id, api_key_enc, api_key_hint, api_key_updated_at, api_key_updated_by) VALUES ('main', ?, ?, unixepoch(), ?) ON CONFLICT(id) DO UPDATE SET api_key_enc = excluded.api_key_enc, api_key_hint = excluded.api_key_hint, api_key_updated_at = excluded.api_key_updated_at, api_key_updated_by = excluded.api_key_updated_by").bind(enc, hint(k), actor).run();
  } catch { return { ok: false, error: "Could not save. Run migration 0050_resend_integration.sql in D1 first." }; }
  resetCredentialMemo();
  await rememberCheck(env, c);
  return { ok: true, check: c, hint: hint(k) };
}
export async function removeApiKey(env: Env): Promise<void> {
  await env.DB?.prepare("UPDATE email_integration SET api_key_enc = '', api_key_hint = '', api_key_updated_at = unixepoch() WHERE id = 'main'").run();
  resetCredentialMemo();
}

const HOOK_RE = /^whsec_[A-Za-z0-9+/=]{16,200}$/;
export async function saveWebhookSecret(env: Env, actor: string, raw: string): Promise<{ ok: true; hint: string } | { ok: false; error: string }> {
  const s = raw.trim();
  if (!HOOK_RE.test(s)) return { ok: false, error: "That does not look like a Resend signing secret (it starts with whsec_)." };
  if (!secretOk(env.EMAIL_KEY_SECRET)) return { ok: false, error: "Set the secret EMAIL_KEY_SECRET (32+ characters) in Cloudflare first." };
  try {
    await env.DB!.prepare("INSERT INTO email_integration (id, webhook_secret_enc, webhook_hint, webhook_updated_at, webhook_updated_by) VALUES ('main', ?, ?, unixepoch(), ?) ON CONFLICT(id) DO UPDATE SET webhook_secret_enc = excluded.webhook_secret_enc, webhook_hint = excluded.webhook_hint, webhook_updated_at = excluded.webhook_updated_at, webhook_updated_by = excluded.webhook_updated_by").bind(await encryptSecret(s, env.EMAIL_KEY_SECRET), `whsec_${hint(s)}`, actor).run();
  } catch { return { ok: false, error: "Could not save. Run migration 0050_resend_integration.sql in D1 first." }; }
  resetCredentialMemo();
  return { ok: true, hint: `whsec_${hint(s)}` };
}
