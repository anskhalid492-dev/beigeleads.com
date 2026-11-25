import { getCloudflareContext } from "@opennextjs/cloudflare";
import { resolveWebhookSecret } from "@/lib/email/credentials";
import { processResendEvent, verifySvix } from "@/lib/system-emails/webhook";

export const dynamic = "force-dynamic";

/** Resend (Svix) webhook. Only a correctly signed request is processed; anything else gets 401 and no detail. */
export async function POST(req: Request) {
  const { env } = getCloudflareContext();
  const secret = (await resolveWebhookSecret(env)).secret;
  if (!secret) return new Response("not configured", { status: 503 });
  const body = await req.text();
  if (body.length > 100_000) return new Response("too large", { status: 413 });
  const id = req.headers.get("svix-id");
  const ok = await verifySvix(secret, { id, timestamp: req.headers.get("svix-timestamp"), signature: req.headers.get("svix-signature") }, body);
  if (!ok || !id) return new Response("invalid signature", { status: 401 });
  try {
    const r = await processResendEvent(env, id, body);
    return new Response(r.note ?? "ok", { status: r.status });
  } catch {
    return new Response("error", { status: 500 }); // Resend retries on non-2xx
  }
}
