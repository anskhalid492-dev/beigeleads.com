import { getCloudflareContext } from "@opennextjs/cloudflare";
import { LLMS_DEFAULT } from "@/lib/site-links/llms-default";
import { getPublishedLlms } from "@/lib/site-links/store";

export const dynamic = "force-dynamic";

/** Public, no auth, no redirect, UTF-8 plain text. Always the published version (built-in text until an admin publishes). */
export async function GET() {
  let body = LLMS_DEFAULT;
  try { body = await getPublishedLlms(getCloudflareContext().env); } catch { /* built-in text */ }
  return new Response(body, { status: 200, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=60", "x-content-type-options": "nosniff" } });
}
