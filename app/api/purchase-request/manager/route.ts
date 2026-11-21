import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { sha256Hex } from "@/lib/forms/hash";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { OPTION_IDS } from "@/lib/payments/options";
import { managerApprove, managerDecline, managerView } from "@/lib/sales/team";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("verify"), token: z.string().max(100), email: z.string().trim().toLowerCase().max(254) }),
  z.object({ action: z.literal("approve"), token: z.string().max(100), email: z.string().trim().toLowerCase().max(254), coin: z.enum(OPTION_IDS), seenTotalCents: z.number().int().min(0).max(100_000_000) }),
  z.object({ action: z.literal("decline"), token: z.string().max(100), email: z.string().trim().toLowerCase().max(254), reason: z.string().trim().max(300).optional().default("") }),
]);
const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** The manager's side of a request. Every action needs the secure token AND the manager's own email address. Rate limited per IP and per token. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return json(403, { ok: false, error: "Not allowed." });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return json(400, { ok: false, error: "Check the form and try again." });
  const { env } = getCloudflareContext();
  const ip = await sha256Hex(`${env.HASH_SALT ?? ""}:ip:${req.headers.get("cf-connecting-ip") ?? "x"}`);
  if (await isRateLimited(env.CACHE, "pr-manager-ip", ip, 40, 3600) || await isRateLimited(env.CACHE, "pr-manager-token", await sha256Hex(p.data.token), 25, 3600)) return json(429, { ok: false, error: "Too many attempts. Try again in a little while." });
  const d = p.data;
  if (d.action === "verify") { const r = await managerView(env, d.token, d.email); return json(r.ok ? 200 : 400, r); }
  if (d.action === "approve") { const r = await managerApprove(env, d.token, d.email, d.coin, d.seenTotalCents); return json(r.ok ? 200 : 400, r); }
  const r = await managerDecline(env, d.token, d.email, d.reason); return json(r.ok ? 200 : 400, r);
}
