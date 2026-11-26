import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { submitFeedback } from "@/lib/founder/feedback";

const json = (s: number, b: Record<string, unknown>) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return json(403, { ok: false, error: "Not allowed." });
  const { env } = getCloudflareContext();
  let raw: unknown; try { raw = await req.json(); } catch { return json(400, { ok: false, error: "Invalid request." }); }
  const ip = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "unknown"}`);
  if (await isRateLimited(env.CACHE, "customer-feedback", ip)) return json(429, { ok: false, error: "Too many requests. Try again later." });
  const r = await submitFeedback(env, raw);
  return r.ok ? json(200, r) : json(400, r);
}
