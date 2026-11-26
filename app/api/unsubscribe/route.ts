import { getCloudflareContext } from "@opennextjs/cloudflare";
import { unsubscribeAll } from "@/lib/founder/prefs";

/** RFC 8058 one-click unsubscribe. POST (mail provider or button) unsubscribes; GET only shows the confirmation page, so link scanners cannot unsubscribe anyone. */
export async function POST(req: Request) {
  const u = new URL(req.url);
  const ok = await unsubscribeAll(getCloudflareContext().env, u.searchParams.get("e") ?? "", u.searchParams.get("t") ?? "");
  return new Response(ok ? "Unsubscribed." : "Invalid link.", { status: ok ? 200 : 400, headers: { "cache-control": "no-store" } });
}
export async function GET(req: Request) {
  const u = new URL(req.url);
  return Response.redirect(`${u.origin}/email-preferences?e=${encodeURIComponent(u.searchParams.get("e") ?? "")}&t=${encodeURIComponent(u.searchParams.get("t") ?? "")}&u=1`, 302);
}
