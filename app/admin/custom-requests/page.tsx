import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDb, schema } from "@/lib/db";
import { setRequestStatusAction } from "./actions";

export const dynamic = "force-dynamic";

const LABEL = { new: "New", in_progress: "Reviewing", quoted: "Quoted", done: "Completed", declined: "Declined" } as const;
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
  const notes: Record<number, string> = {};
  try { for (const r of await db.select().from(schema.customRequestStatus)) { statuses[r.requestId] = r.status; notes[r.requestId] = r.note ?? ""; } } catch { statuses = null; }

  return (
    <>
      <PageHeader title="Custom list requests" text="Requests sent from the custom list form and the search co-pilot. Each one is a request, not an order: no price is promised." />
      {statuses === null && <p role="alert" className="mb-4 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Status tracking is not active yet. Run migrations 0006 and 0011 in D1 to turn it on.</p>}
      <Panel>
        {reqs.length === 0 ? <Empty title="No requests yet" text="They appear here as soon as someone submits the custom list form." /> : (
          <ul className="divide-y divide-sand-200">
            {reqs.map((r) => {
              const st = statuses?.[r.id] ?? "new";
              let fields: string[] = [];
              try { fields = JSON.parse(r.fieldsJson); } catch { /* keep empty */ }
              // Requests from the 2.0 builder carry a structured payload; older rows only have the flat columns.
              type Detail = { industries?: string[]; audience?: string[]; targeting?: Record<string, string>; locations?: { country: string; whole: boolean; regions: string[]; cities: string[] }[]; exclusions?: string[]; quantityPlus?: boolean; instructions?: string; message?: string };
              let d: Detail = {};
              try { if (r.detailJson) d = JSON.parse(r.detailJson) as Detail; } catch { /* legacy row */ }
              const place = d.locations?.length ? d.locations.map((l) => [l.country, l.whole ? "entire country" : "", ...l.regions, ...l.cities].filter(Boolean).join(" > ")).join("; ") : [r.region, r.country].filter(Boolean).join(", ");
              const extra = Object.entries(d.targeting ?? {}).filter(([, v]) => v);
              return (
                <li key={r.id}>
                  <details className="group">
                    <summary className="grid cursor-pointer list-none grid-cols-2 items-center gap-3 px-5 py-4 text-sm marker:hidden sm:grid-cols-[1.4fr_1fr_1fr_auto_auto] [&::-webkit-details-marker]:hidden">
                      <span className="col-span-2 truncate font-semibold text-forest-900 sm:col-span-1">{r.reference ? `${r.reference} · ` : ""}{r.name ?? r.email}</span>
                      <span>{r.category}</span>
                      <span>{[r.region, r.country].filter(Boolean).join(", ")}{r.quantity ? ` · ${r.quantity.toLocaleString("en-US")}` : ""}</span>
                      <span className="text-xs">{fmtDate(r.createdAt)}</span>
                      <Badge tone={TONE[st]}>{LABEL[st]}</Badge>
                    </summary>
                    <div className="space-y-3 bg-sand-50 px-5 pb-5 pt-2 text-sm">
                      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                        <div><dt className="font-bold text-forest-900">Customer</dt><dd>{r.name ?? "—"} · <a className="underline" href={`mailto:${r.email}`}>{r.email}</a>{r.company ? ` · ${r.company}` : ""}</dd></div>
                        <div><dt className="font-bold text-forest-900">Reference / received</dt><dd>{r.reference ?? "legacy request"} · {fmtDate(r.createdAt)}</dd></div>
                        <div><dt className="font-bold text-forest-900">Industries</dt><dd>{d.industries?.join(", ") ?? r.category}</dd></div>
                        <div><dt className="font-bold text-forest-900">Prospect type</dt><dd>{d.audience?.length ? d.audience.join(", ") : "—"}</dd></div>
                        <div><dt className="font-bold text-forest-900">Locations</dt><dd>{place || "—"}{d.exclusions?.length ? ` (exclude: ${d.exclusions.join(", ")})` : ""}</dd></div>
                        <div><dt className="font-bold text-forest-900">Quantity</dt><dd>{r.quantity ? `${r.quantity.toLocaleString("en-US")}${d.quantityPlus ? "+" : ""}` : "Not given"}</dd></div>
                        {extra.length > 0 && <div className="sm:col-span-2"><dt className="font-bold text-forest-900">Additional filters</dt><dd>{extra.map(([k, v]) => `${k}: ${v}`).join(" · ")}</dd></div>}
                        {r.reference && <div className="sm:col-span-2"><dt className="font-bold text-forest-900">Emails</dt><dd>Admin notification: {r.ownerNotify}{r.ownerNotify === "failed" ? " (saved, but the email did not go out: follow up from here)" : ""} · Customer confirmation: {r.customerEmailStatus}</dd></div>}
                        <div><dt className="font-bold text-forest-900">Job titles</dt><dd>{r.jobTitles || "—"}</dd></div>
                        <div className="sm:col-span-2"><dt className="font-bold text-forest-900">Data fields</dt><dd>{fields.length ? fields.join(", ") : "—"}</dd></div>
                        <div className="sm:col-span-2"><dt className="font-bold text-forest-900">Special instructions and message</dt><dd className="whitespace-pre-wrap">{r.notes || "—"}</dd></div>
                        {r.originalQuery && <div className="sm:col-span-2"><dt className="font-bold text-forest-900">Original search</dt><dd>{r.originalQuery}</dd></div>}
                      </dl>
                      {statuses && (
                        <form action={setRequestStatusAction} className="flex flex-wrap items-start gap-2">
                          <input type="hidden" name="id" value={r.id} />
                          <label className="font-semibold text-forest-900" htmlFor={`st-${r.id}`}>Status</label>
                          <select id={`st-${r.id}`} name="status" defaultValue={st} className="rounded-xl border border-sand-300 bg-white px-3 py-2">
                            {Object.entries(LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                          <label className="sr-only" htmlFor={`nt-${r.id}`}>Internal note</label>
                          <textarea id={`nt-${r.id}`} name="note" rows={2} maxLength={4000} defaultValue={notes[r.id] ?? ""} placeholder="Internal note (never shown to the customer)" className="min-w-[16rem] flex-1 rounded-xl border border-sand-300 bg-white px-3 py-2" />
                          <Button type="submit" size="sm">Save</Button>
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
