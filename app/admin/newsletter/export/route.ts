import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { confirmedCsv } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export async function GET() {
  try { await requireAdmin(); } catch { return new Response("Not found", { status: 404 }); }
  return new Response(await confirmedCsv(getCloudflareContext().env), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="newsletter-confirmed.csv"', "cache-control": "no-store" } });
}
