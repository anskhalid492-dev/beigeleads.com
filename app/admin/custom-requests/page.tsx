import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDb, schema } from "@/lib/db";
import { setRequestStatusAction } from "./actions";

export const dynamic = "force-dynamic";

const LABEL = { new: "New", in_progress: "In progress", quoted: "Quoted", done: "Done", declined: "Declined" } as const;
const TONE = { new: "info", in_progress: "warn", quoted: "warn", done: "good", declined: "mute" } as const;

export default async function CustomRequestsPage() {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const db = getDb();
  const reqs = await db.select().from(schema.customListRequests).orderBy(desc(schema.customListRequests.id)).limit(200);
  // Status table comes from migration 0006. Until it is applied, everything shows as New and saving is off.
  let statuses: Record<number, keyof typeof LABEL> | null = {};
  try { for (const r of await db.select().from(schema.customRequestStatus)) statuses[r.requestId] = r.status; } catch { statuses = null; }

  return (
    <>
      <PageHeader title="Custom list requests" text="Requests sent from the custom list form and the search co-pilot. Each one is a request, not an order: no price is promised." />
      {statuses === null && <p role="alert" className="mb-4 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Status tracking is not active yet. Run migration 0006_custom_request_status.sql in D1 to turn it on.</p>}
      <Panel>
        {reqs.length === 0 ? <Empty title="No requests yet" text="They appear here as soon as someone submits the custom list form." /> : (
          <ul className="divide-y divide-sand-200">
            {reqs.map((r) => {
              const st = statuses?.[r.id] ?? "new";
              let fields: string[] = [];
              try { fields = JSON.parse(r.fieldsJson); } catch { /* keep empty */ }
              return (
                <li key={r.id}>
                  <details className="group">
                    <summary className="grid cursor-pointer list-none grid-cols-2 items-center gap-3 px-5 py-4 text-sm marker:hidden sm:grid-cols-[1.4fr_1fr_1fr_auto_auto] [&::-webkit-details-marker]:hidden">
                      <span className="col-span-2 truncate font-semibold text-forest-900 sm:col-span-1">{r.email}</span>
                      <span>{r.category}</span>
                      <span>{[r.region, r.country].filter(Boolean).join(", ")}{r.quantity ? ` · ${r.quantity.toLocaleString("en-US")}` : ""}</span>
                      <span className="text-xs">{fmtDate(r.createdAt)}</span>
                      <Badge tone={TONE[st]}>{LABEL[st]}</Badge>
                    </summary>
                    <div className="space-y-3 bg-sand-50 px-5 pb-5 pt-2 text-sm">
                      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                        <div><dt className="font-bold text-forest-900">Industry</dt><dd>{r.category}</dd></div>
                        <div><dt className="font-bold text-forest-900">Location</dt><dd>{[r.region, r.country].filter(Boolean).join(", ") || "—"}</dd></div>
                        <div><dt className="font-bold text-forest-900">Quantity</dt><dd>{r.quantity?.toLocaleString("en-US") ?? "Not given"}</dd></div>
                        <div><dt className="font-bold text-forest-900">Job titles</dt><dd>{r.jobTitles || "—"}</dd></div>
                        <div className="sm:col-span-2"><dt className="font-bold text-forest-900">Data fields</dt><dd>{fields.length ? fields.join(", ") : "—"}</dd></div>
                        <div className="sm:col-span-2"><dt className="font-bold text-forest-900">Notes</dt><dd className="whitespace-pre-wrap">{r.notes || "—"}</dd></div>
                        {r.originalQuery && <div className="sm:col-span-2"><dt className="font-bold text-forest-900">Original search</dt><dd>{r.originalQuery}</dd></div>}
                      </dl>
                      {statuses && (
                        <form action={setRequestStatusAction} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={r.id} />
                          <label className="font-semibold text-forest-900" htmlFor={`st-${r.id}`}>Status</label>
                          <select id={`st-${r.id}`} name="status" defaultValue={st} className="rounded-xl border border-sand-300 bg-white px-3 py-2">
                            {Object.entries(LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                          <Button type="submit" size="sm">Save status</Button>
                        </form>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
