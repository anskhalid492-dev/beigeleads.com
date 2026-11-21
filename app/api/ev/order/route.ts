import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { customerDownload } from "@/lib/ev/customer";

const schema = z.object({ token: z.string().regex(/^[0-9a-f]{48}$/), email: z.string().trim().toLowerCase().max(254), fileId: z.string().uuid().optional() });
const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** Customer result download: the secure token AND the order email must match, then a short-lived signed link is returned. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false, error: "Not allowed." });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return json(400, { ok: false, error: "Enter the email address used for this order." });
  const { env } = getCloudflareContext();
  const ip = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, "ev-order-ip", ip, 40, 3600) || await isRateLimited(env.CACHE, "ev-order-token", await sha256Hex(p.data.token), 15, 3600)) return json(429, { ok: false, error: "Too many attempts. Try again in a little while." });
  const r = await customerDownload(env, p.data.token, p.data.email, p.data.fileId);
  return json(r.ok ? 200 : 400, r);
}
