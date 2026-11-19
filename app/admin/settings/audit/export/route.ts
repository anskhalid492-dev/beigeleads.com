import { getCloudflareContext } from "@opennextjs/cloudflare";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv, schema } from "@/lib/db";

const cell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };

/** Last 1000 settings changes as CSV. Settings hold no secrets, so values are included; spreadsheet formula prefixes are neutralised. */
export async function GET() {
  try { await requireAdmin(); } catch { return new Response("Not found", { status: 404 }); }
  const rows = await getDbFromEnv(getCloudflareContext().env).select().from(schema.settingsAuditLog).orderBy(desc(schema.settingsAuditLog.id)).limit(1000);
  const csv = ["time_utc,admin,section,setting,old_value,new_value,result", ...rows.map((r) => [r.createdAt.toISOString(), r.actor, r.category, r.settingKey, r.oldValue, r.newValue, r.result].map(cell).join(","))].join("\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="settings-audit.csv"', "cache-control": "no-store" } });
}
