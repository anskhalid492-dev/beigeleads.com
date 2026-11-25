import { resolveResend } from "@/lib/email/credentials";
import { checkKey } from "@/lib/email/resend-api";
/**
 * Real connectivity checks for the admin status pages. Each check actually talks to the service; nothing is assumed.
 * Results are remembered in KV (`health:last:<id>`) so the page can show "last verified" honestly.
 */
export type CheckId = "d1" | "kv" | "r2" | "resend" | "turnstile" | "access";
export type CheckResult = { id: CheckId; ok: boolean; detail: string; at: number; ms?: number };

type Env = CloudflareEnv;
const REQUIRED_TABLES = ["blog_posts", "blog_authors", "blog_media", "seo_settings", "seo_redirects", "seo_sitemap_exclusions", "system_settings", "settings_audit_log", "sample_requests", "custom_list_requests", "orders", "payment_attempts", "deliveries", "wallets", "suppressions"];

const timed = async <T,>(f: () => Promise<T>): Promise<[T, number]> => { const t = Date.now(); const r = await f(); return [r, Date.now() - t]; };

export async function runCheck(env: Env, id: CheckId): Promise<CheckResult> {
  const at = Date.now();
  const done = (ok: boolean, detail: string, ms?: number): CheckResult => ({ id, ok, detail, at, ms });
  try {
    switch (id) {
      case "d1": {
        const [, ms] = await timed(() => env.DB.prepare("SELECT 1").first());
        const rows = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all<{ name: string }>();
        const have = new Set(rows.results.map((r) => r.name));
        const missing = REQUIRED_TABLES.filter((t) => !have.has(t));
        return missing.length ? done(false, `Connected, but these tables are missing (a migration has not been run): ${missing.join(", ")}.`, ms) : done(true, `Connected. All ${REQUIRED_TABLES.length} checked tables exist.`, ms);
      }
      case "kv": {
        const key = "health:ping"; const v = String(at);
        const [, ms] = await timed(async () => { await env.CACHE.put(key, v, { expirationTtl: 60 }); });
        const back = await env.CACHE.get(key);
        await env.CACHE.delete(key);
        return back === v ? done(true, "Wrote, read and deleted a test value.", ms) : done(false, "A written value could not be read back right away (KV is eventually consistent; try again).", ms);
      }
      case "r2": {
        const [res, ms] = await timed(() => env.LISTS.list({ limit: 1 }));
        return done(true, `Bucket reachable (${res.objects.length ? "contains files" : "empty"}).`, ms);
      }
      case "resend": {
        const c = await resolveResend(env);
        if (!c.key) return done(false, "No Resend key: add one in Integrations > Resend, or set RESEND_API_KEY.");
        const k = await checkKey(c.key);
        return done(k.state === "valid_full" || k.state === "valid_sending_only", k.detail, k.ms);
      }
      case "turnstile": {
        if (!env.TURNSTILE_SECRET_KEY) return done(false, "TURNSTILE_SECRET_KEY is not set.");
        const url = env.TURNSTILE_VERIFY_URL ?? "https://challenges.cloudflare.com/turnstile/v0/siteverify";
        const [res, ms] = await timed(() => fetch(url, { method: "POST", body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY!, response: "health-check" }) }));
        const j = (await res.json()) as { "error-codes"?: string[] };
        const codes = j["error-codes"] ?? [];
        if (codes.includes("invalid-input-secret")) return done(false, "Turnstile rejected the secret key.", ms);
        return done(true, "Turnstile accepted the secret key (a dummy token is expected to fail).", ms);
      }
      case "access": {
        if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return done(false, "ACCESS_TEAM_DOMAIN or ACCESS_AUD is not set.");
        const [res, ms] = await timed(() => fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`));
        return res.ok ? done(true, "Access signing keys are reachable. You are signed in through Access.", ms) : done(false, `Access keys returned HTTP ${res.status}.`, ms);
      }
    }
  } catch (e) {
    return done(false, `Check failed: ${e instanceof Error ? e.message.slice(0, 120) : "unknown error"}.`);
  }
}

export async function rememberCheck(env: Env, r: CheckResult) { try { await env.CACHE.put(`health:last:${r.id}`, JSON.stringify(r), { expirationTtl: 60 * 60 * 24 * 30 }); } catch { /* optional */ } }
export async function lastChecks(env: Env): Promise<Partial<Record<CheckId, CheckResult>>> {
  const ids: CheckId[] = ["d1", "kv", "r2", "resend", "turnstile", "access"];
  const out: Partial<Record<CheckId, CheckResult>> = {};
  await Promise.all(ids.map(async (id) => { try { const v = await env.CACHE.get<CheckResult>(`health:last:${id}`, "json"); if (v) out[id] = v; } catch { /* none */ } }));
  return out;
}

export const CRON_KEYS = { minute: "health:cron:minute", sweep: "health:cron:sweep" } as const;
export async function cronHeartbeats(env: Env) {
  const get = async (k: string) => { try { const v = await env.CACHE.get(k); return v ? Number(v) : null; } catch { return null; } };
  return { minute: await get(CRON_KEYS.minute), sweep: await get(CRON_KEYS.sweep) };
}
