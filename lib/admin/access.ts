// Verifies the Cloudflare Access JWT inside the Worker (defence in depth: Access already blocks
// unauthenticated requests at the edge, but the app never trusts that alone).
// Needs two plain vars: ACCESS_TEAM_DOMAIN (e.g. "myteam.cloudflareaccess.com") and ACCESS_AUD (application AUD tag).
type Jwk = { kid: string; kty: string; n: string; e: string; alg?: string };
let jwksCache: { at: number; keys: Jwk[]; domain: string } | null = null;

const b64urlToBytes = (s: string) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "="));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const parseJson = (s: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s))) as Record<string, unknown>;

async function getKeys(domain: string, fetcher: typeof fetch): Promise<Jwk[]> {
  if (jwksCache && jwksCache.domain === domain && Date.now() - jwksCache.at < 3_600_000) return jwksCache.keys;
  const res = await fetcher(`https://${domain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error("could not load Access keys");
  const keys = ((await res.json()) as { keys: Jwk[] }).keys;
  jwksCache = { at: Date.now(), keys, domain };
  return keys;
}

export type AdminIdentity = { email: string };

/** Returns the verified admin email, or null. Never throws. */
export async function verifyAccessJwt(
  token: string | null | undefined,
  cfg: { domain?: string; aud?: string },
  opts: { now?: number; fetcher?: typeof fetch } = {},
): Promise<AdminIdentity | null> {
  try {
    if (!token || !cfg.domain || !cfg.aud) return null;
    const [h, p, sig] = token.split(".");
    if (!h || !p || !sig) return null;
    const header = parseJson(h);
    if (header.alg !== "RS256") return null;
    const jwk = (await getKeys(cfg.domain, opts.fetcher ?? fetch)).find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(sig), new TextEncoder().encode(`${h}.${p}`));
    if (!ok) return null;
    const c = parseJson(p) as { aud?: string[] | string; iss?: string; exp?: number; nbf?: number; email?: string };
    const now = Math.floor((opts.now ?? Date.now()) / 1000);
    const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
    if (!aud.includes(cfg.aud)) return null;
    if (c.iss !== `https://${cfg.domain}`) return null;
    if (typeof c.exp !== "number" || c.exp < now) return null;
    if (typeof c.nbf === "number" && c.nbf > now + 60) return null;
    if (!c.email) return null;
    return { email: c.email.toLowerCase() };
  } catch {
    return null;
  }
}
