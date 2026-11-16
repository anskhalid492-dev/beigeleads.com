/**
 * Simple per-IP counter in KV. Not atomic, so it is a speed bump, not a hard guarantee.
 * Real enforcement also needs a Cloudflare WAF rate-limit rule (phase 6).
 */
export async function isRateLimited(
  kv: KVNamespace,
  route: string,
  ipHash: string,
  limit = 5,
  windowSeconds = 3600,
): Promise<boolean> {
  const key = `rl:${route}:${ipHash}`;
  const current = Number((await kv.get(key)) ?? 0);
  if (current >= limit) return true;
  // KV needs a TTL of at least 60 seconds.
  await kv.put(key, String(current + 1), { expirationTtl: Math.max(60, windowSeconds) });
  return false;
}
