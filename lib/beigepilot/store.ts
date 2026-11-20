// BeigePilot settings, provider rows and usage. Never throws before migration 0037 (returns defaults / empty).
import { decryptKey, encryptKey, keyHint } from "./secret";
import { isProviderId, PROVIDER_IDS, type ProviderId } from "./providers";

export type Humor = "professional" | "friendly" | "playful";
export type Motion = "calm" | "balanced" | "lively";
export const HUMORS: Humor[] = ["professional", "friendly", "playful"];
export const MOTIONS: Motion[] = ["calm", "balanced", "lively"];
const OLD_GREETINGS = ["Hi, I'm BeigePilot. Tell me who you want to reach and I'll find the right database.", "Tell me who you'd like to reach, and I'll help you find the right database."];
/** One suggested question per line, at most 3, each at most 60 characters. */
export const parseSuggestions = (raw: string | undefined): string[] => (raw ?? "").split("\n").map((x) => x.trim().slice(0, 60)).filter(Boolean).slice(0, 3);

export type Settings = {
  enabled: boolean; active: ProviderId | ""; fallback: ProviderId | "";
  greeting: string; instructions: string; saveChats: boolean; retentionDays: number;
  name: string; humor: Humor; motion: Motion; launcher: "right" | "left"; suggestions: string[];
  dailyRequestLimit: number; dailyTokenLimit: number; monthlySpendUsd: number | null;
};
export const DEFAULT_SETTINGS: Settings = {
  enabled: false, active: "", fallback: "",
  greeting: "Who are we finding today?",
  name: "Pilo", humor: "friendly", motion: "balanced", launcher: "right", suggestions: [],
  instructions: "", saveChats: false, retentionDays: 90, dailyRequestLimit: 500, dailyTokenLimit: 500_000, monthlySpendUsd: null,
};

type Env = CloudflareEnv;
const num = (v: string | undefined, d: number, min: number, max: number) => { const n = Number(v); return Number.isFinite(n) && v !== undefined && v !== "" ? Math.min(max, Math.max(min, Math.round(n))) : d; };

export async function getSettings(env: Env): Promise<{ ready: boolean; s: Settings }> {
  try {
    const rows = (await env.DB.prepare("SELECT key, value FROM beigepilot_settings").all<{ key: string; value: string }>()).results;
    const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const spend = m.monthlySpendUsd ? Number(m.monthlySpendUsd) : NaN;
    return { ready: true, s: {
      enabled: m.enabled === "1", active: isProviderId(m.active) ? m.active : "", fallback: isProviderId(m.fallback) ? m.fallback : "",
      greeting: (m.greeting && !OLD_GREETINGS.includes(m.greeting) ? m.greeting : "").slice(0, 300) || DEFAULT_SETTINGS.greeting,
      name: (m.name ?? "").trim().slice(0, 24) || DEFAULT_SETTINGS.name, humor: HUMORS.includes(m.humor as Humor) ? (m.humor as Humor) : DEFAULT_SETTINGS.humor,
      motion: MOTIONS.includes(m.motion as Motion) ? (m.motion as Motion) : DEFAULT_SETTINGS.motion, launcher: m.launcher === "left" ? "left" : "right", suggestions: parseSuggestions(m.suggestions), instructions: (m.instructions ?? "").slice(0, 1500), saveChats: m.saveChats === "1", retentionDays: [30, 90, 180, 365].includes(Number(m.retentionDays)) ? Number(m.retentionDays) : 90,
      dailyRequestLimit: num(m.dailyRequestLimit, DEFAULT_SETTINGS.dailyRequestLimit, 1, 1_000_000), dailyTokenLimit: num(m.dailyTokenLimit, DEFAULT_SETTINGS.dailyTokenLimit, 1000, 1_000_000_000),
      monthlySpendUsd: Number.isFinite(spend) && spend > 0 ? spend : null,
    } };
  } catch { return { ready: false, s: DEFAULT_SETTINGS }; }
}

export async function saveSettings(env: Env, patch: Partial<Record<keyof Settings, string>>): Promise<void> {
  const st = env.DB.prepare("INSERT INTO beigepilot_settings (key, value, updated_at) VALUES (?1, ?2, unixepoch()) ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = unixepoch()");
  await env.DB.batch(Object.entries(patch).map(([k, v]) => st.bind(k, v ?? "")));
  try { await env.CACHE.delete("beigepilot:config:v2"); } catch { /* optional */ }
}

export type ProviderRow = { id: ProviderId; hasKey: boolean; hint: string; model: string; temperature: number; maxTokens: number; priceIn: number | null; priceOut: number | null };
type Raw = { id: string; enc_key: string; key_hint: string; model: string; temperature: number; max_tokens: number; price_in: number | null; price_out: number | null };
const toRow = (r: Raw): ProviderRow => ({ id: r.id as ProviderId, hasKey: !!r.enc_key, hint: r.key_hint, model: r.model, temperature: r.temperature, maxTokens: r.max_tokens, priceIn: r.price_in, priceOut: r.price_out });

export async function listProviders(env: Env): Promise<ProviderRow[]> {
  let rows: Raw[] = [];
  try { rows = (await env.DB.prepare("SELECT * FROM beigepilot_providers").all<Raw>()).results; } catch { /* before migration */ }
  return PROVIDER_IDS.map((id) => { const r = rows.find((x) => x.id === id); return r ? toRow(r) : { id, hasKey: false, hint: "", model: "", temperature: 0.3, maxTokens: 700, priceIn: null, priceOut: null }; });
}

export async function saveProvider(env: Env, id: ProviderId, v: { apiKey?: string; model: string; temperature: number; maxTokens: number; priceIn: number | null; priceOut: number | null }): Promise<void> {
  const cur = (await listProviders(env)).find((p) => p.id === id)!;
  let enc: string | null = null, hint = cur.hint;
  if (v.apiKey) { enc = await encryptKey(v.apiKey, env.BEIGEPILOT_KEY_SECRET); hint = keyHint(v.apiKey); }
  await env.DB.prepare(`INSERT INTO beigepilot_providers (id, enc_key, key_hint, model, temperature, max_tokens, price_in, price_out, updated_at) VALUES (?1, COALESCE(?2, ''), ?3, ?4, ?5, ?6, ?7, ?8, unixepoch())
    ON CONFLICT(id) DO UPDATE SET enc_key = COALESCE(?2, enc_key), key_hint = ?3, model = ?4, temperature = ?5, max_tokens = ?6, price_in = ?7, price_out = ?8, updated_at = unixepoch()`)
    .bind(id, enc, hint, v.model, v.temperature, v.maxTokens, v.priceIn, v.priceOut).run();
  try { await env.CACHE.delete("beigepilot:config:v2"); } catch { /* optional */ }
}

export async function removeProviderKey(env: Env, id: ProviderId): Promise<void> {
  await env.DB.prepare("UPDATE beigepilot_providers SET enc_key = '', key_hint = '', updated_at = unixepoch() WHERE id = ?1").bind(id).run();
  try { await env.CACHE.delete("beigepilot:config:v2"); } catch { /* optional */ }
}

/** The decrypted key, server-side only. null = no key saved, or the secret changed so it cannot be read. */
export async function getProviderKey(env: Env, id: ProviderId): Promise<string | null> {
  try {
    const r = await env.DB.prepare("SELECT enc_key FROM beigepilot_providers WHERE id = ?1").bind(id).first<{ enc_key: string }>();
    return r?.enc_key ? await decryptKey(r.enc_key, env.BEIGEPILOT_KEY_SECRET) : null;
  } catch { return null; }
}

/* ---------------- usage and limits ---------------- */

const day = (d = new Date()) => d.toISOString().slice(0, 10);

export async function logUsage(env: Env, provider: ProviderId, model: string, tin: number, tout: number, failed: boolean): Promise<void> {
  try {
    await env.DB.prepare(`INSERT INTO beigepilot_usage (day, provider, model, requests, tokens_in, tokens_out, errors) VALUES (?1, ?2, ?3, 1, ?4, ?5, ?6)
      ON CONFLICT(day, provider, model) DO UPDATE SET requests = requests + 1, tokens_in = tokens_in + ?4, tokens_out = tokens_out + ?5, errors = errors + ?6`).bind(day(), provider, model, tin, tout, failed ? 1 : 0).run();
  } catch { /* usage is best effort */ }
}

export type UsageTotals = { requests: number; tokensIn: number; tokensOut: number; errors: number; costUsd: number | null };

export async function usageSince(env: Env, fromDay: string): Promise<UsageTotals> {
  const out: UsageTotals = { requests: 0, tokensIn: 0, tokensOut: 0, errors: 0, costUsd: 0 };
  try {
    const rows = (await env.DB.prepare("SELECT provider, requests, tokens_in, tokens_out, errors FROM beigepilot_usage WHERE day >= ?1").bind(fromDay).all<{ provider: string; requests: number; tokens_in: number; tokens_out: number; errors: number }>()).results;
    const prices = new Map((await listProviders(env)).map((p) => [p.id, p]));
    for (const r of rows) {
      out.requests += r.requests; out.tokensIn += r.tokens_in; out.tokensOut += r.tokens_out; out.errors += r.errors;
      const p = prices.get(r.provider as ProviderId);
      if (out.costUsd !== null) { if (p?.priceIn != null && p?.priceOut != null) out.costUsd += (r.tokens_in * p.priceIn + r.tokens_out * p.priceOut) / 1e6; else if (r.tokens_in + r.tokens_out > 0) out.costUsd = null; }
    }
  } catch { /* before migration */ }
  return out;
}
export const usageToday = (env: Env) => usageSince(env, day());
export const usageMonth = (env: Env) => usageSince(env, `${day().slice(0, 7)}-01`);

/** null = allowed. Otherwise the reason (the visitor only sees a neutral "unavailable"). */
export async function limitReached(env: Env, s: Settings): Promise<string | null> {
  const t = await usageToday(env);
  if (t.requests >= s.dailyRequestLimit) return "daily request limit";
  if (t.tokensIn + t.tokensOut >= s.dailyTokenLimit) return "daily token limit";
  if (s.monthlySpendUsd !== null) { const m = await usageMonth(env); if (m.costUsd !== null && m.costUsd >= s.monthlySpendUsd) return "monthly spend limit"; }
  return null;
}
