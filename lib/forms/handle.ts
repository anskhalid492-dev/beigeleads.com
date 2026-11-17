import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { ZodType } from "zod";
import { sha256Hex } from "./hash";
import { isRateLimited } from "./rate-limit";
import { verifyTurnstile } from "./turnstile";

type Ctx = { env: CloudflareEnv; waitUntil: (p: Promise<unknown>) => void; ipHash: string };

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/**
 * Shared pipeline for every public form:
 * JSON body -> honeypot -> validation -> Turnstile -> rate limit -> handler.
 * Responses never reveal whether an email already exists.
 */
export async function handleForm<T extends { turnstileToken: string; website?: string }>(
  req: Request,
  route: string,
  schema: ZodType<T>,
  handler: (data: T, ctx: Ctx) => Promise<void | Record<string, unknown>>,
): Promise<Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { ok: false, error: "Invalid request." });
  }

  // Honeypot: bots fill hidden fields. Pretend success and do nothing.
  if (typeof raw === "object" && raw !== null && typeof (raw as { website?: unknown }).website === "string" && (raw as { website: string }).website.length > 0) {
    return json(200, { ok: true });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return json(400, { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." });
  }

  const { env, ctx } = getCloudflareContext();
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";

  if (!(await verifyTurnstile(parsed.data.turnstileToken, env.TURNSTILE_SECRET_KEY, ip, env.TURNSTILE_VERIFY_URL))) {
    return json(400, { ok: false, error: "The spam check failed. Reload the page and try again." });
  }

  const ipHash = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${ip}`);
  if (await isRateLimited(env.CACHE, route, ipHash)) {
    return json(429, { ok: false, error: "Too many requests. Try again later." });
  }

  let extra: Record<string, unknown> = {};
  try {
    extra = (await handler(parsed.data, { env, waitUntil: (p) => ctx.waitUntil(p), ipHash })) ?? {};
  } catch {
    return json(500, { ok: false, error: "Something went wrong. Try again in a minute." });
  }
  return json(200, { ...extra, ok: true });
}
