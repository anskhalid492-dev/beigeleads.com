// Thin, honest Resend API client for the admin: classifies answers, never returns or logs a key.
export type KeyState = "valid_full" | "valid_sending_only" | "invalid" | "insufficient_permissions" | "rate_limited" | "provider_error" | "network_error" | "not_configured";
export type KeyCheck = { state: KeyState; detail: string; ms?: number; domains?: Domain[] };
export type Domain = { id: string; name: string; status: string; region?: string; created_at?: string };
export type DomainRecord = { record: string; name: string; type: string; value: string; ttl?: string; status?: string; priority?: number };
export type DomainDetail = Domain & { records: DomainRecord[] };

const API = "https://api.resend.com";
type Body = { name?: string; message?: string; data?: unknown };
async function call(key: string, path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  let body: Body = {};
  try { body = (await res.json()) as Body; } catch { /* no json */ }
  return { res, body };
}

/** Pure: turns a Resend answer to GET /domains into a key state. A sending-only key is VALID: Resend itself says so. */
export function classifyDomainsAnswer(status: number, body: Body): { state: KeyState; detail: string } {
  const name = String(body.name ?? ""), msg = String(body.message ?? "").slice(0, 160);
  if (status >= 200 && status < 300) return { state: "valid_full", detail: "Resend accepted the key and listed your domains." };
  if (name === "restricted_api_key" || /restricted to only send/i.test(msg)) return { state: "valid_sending_only", detail: "Resend recognised the key. It is restricted to sending, so it cannot read domains. That is the safest setup." };
  if (status === 429) return { state: "rate_limited", detail: "Resend is rate limiting requests. Try again in a minute." };
  if (status >= 500) return { state: "provider_error", detail: `Resend had a problem (HTTP ${status}). Try again shortly.` };
  if (name === "missing_api_key" || name === "invalid_api_key" || /api key is invalid|invalid api key/i.test(msg) || status === 400 || status === 401) return { state: "invalid", detail: "Resend did not accept this key." };
  if (status === 403) return { state: "insufficient_permissions", detail: `Resend refused the request${msg ? `: ${msg}` : ""}.` };
  return { state: "provider_error", detail: `Resend answered HTTP ${status}${msg ? `: ${msg}` : ""}.` };
}

export async function checkKey(key: string): Promise<KeyCheck> {
  if (!key) return { state: "not_configured", detail: "No API key is set." };
  const t = Date.now();
  try {
    const { res, body } = await call(key, "/domains");
    const c = classifyDomainsAnswer(res.status, body);
    return { ...c, ms: Date.now() - t, domains: c.state === "valid_full" ? ((body.data as Domain[] | undefined) ?? []).map((d) => ({ id: d.id, name: d.name, status: d.status, region: d.region, created_at: d.created_at })) : undefined };
  } catch { return { state: "network_error", detail: "Could not reach Resend (network error).", ms: Date.now() - t }; }
}

export async function getDomain(key: string, id: string): Promise<{ ok: true; domain: DomainDetail } | { ok: false; error: string }> {
  try {
    if (!/^[a-zA-Z0-9-]{8,64}$/.test(id)) return { ok: false, error: "Unknown domain." };
    const { res, body } = await call(key, `/domains/${id}`);
    if (!res.ok) return { ok: false, error: classifyDomainsAnswer(res.status, body).detail };
    const d = body as unknown as DomainDetail & { records?: DomainRecord[] };
    return { ok: true, domain: { id: d.id, name: d.name, status: d.status, region: d.region, created_at: d.created_at, records: Array.isArray(d.records) ? d.records : [] } };
  } catch { return { ok: false, error: "Could not reach Resend (network error)." }; }
}
