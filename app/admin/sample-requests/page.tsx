import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel, StatCard, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getProduct } from "@/lib/catalog";
import { getDb, schema } from "@/lib/db";
import { retrySampleEmailAction, sendSampleAction, updateSampleAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS = { queued: "New", in_progress: "In progress", fulfilled: "Fulfilled", closed: "Closed", sent: "New (legacy)", failed: "New (legacy)" } as const;
const STATUS_TONE = { queued: "info", in_progress: "warn", fulfilled: "good", closed: "mute", sent: "info", failed: "info" } as const;
const MAIL = { pending: "Pending", sent: "Handed to Resend", failed: "Failed", not_configured: "Not configured" } as const;
const MAIL_TONE = { pending: "mute", sent: "good", failed: "bad", not_configured: "warn" } as const;

export default async function SampleRequestsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; mail?: string }> }) {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const sp = await searchParams;
  let rows: (typeof schema.sampleRequests.$inferSelect)[] | null = null;
  try { rows = await getDb().select().from(schema.sampleRequests).orderBy(desc(schema.sampleRequests.id)).limit(500); } catch { rows = null; }
  if (!rows) {
    return (
      <>
        <PageHeader title="Sample requests" text="Free sample requests from /sample." />
        <p role="alert" className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Run migration 0009_sample_requests.sql in D1 to turn this page on.</p>
      </>
    );
  }
  const q = (sp.q ?? "").toLowerCase().trim();
  const shown = rows.filter((r) =>
    (!sp.status || r.status === sp.status) && (!sp.mail || r.emailStatus === sp.mail) &&
    (!q || `${r.email} ${r.productSlug ?? ""} ${r.customRequest ?? ""}`.toLowerCase().includes(q)),
  );
  const open = rows.filter((r) => r.status === "queued" || r.status === "in_progress" || r.status === "sent" || r.status === "failed").length;
  const mailFailed = rows.filter((r) => r.emailStatus === "failed" || r.emailStatus === "not_configured").length;

  return (
    <>
      <PageHeader title="Sample requests" text="Free sample requests from /sample. The email status is the real result of handing the confirmation email to Resend; the sample itself is sent by you." />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total requests" value={rows.length} />
        <StatCard label="Open (not fulfilled)" value={open} />
        <StatCard label="Email needs attention" value={mailFailed} hint="Failed or not configured" />
      </div>
      <form className="mb-4 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={sp.q} placeholder="Search email or list" aria-label="Search" className="rounded-xl border border-sand-300 bg-white px-3 py-2" />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className="rounded-xl border border-sand-300 bg-white px-3 py-2">
          <option value="">All statuses</option>
          {(["queued", "in_progress", "fulfilled", "closed"] as const).map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}
        </select>
        <select name="mail" defaultValue={sp.mail ?? ""} aria-label="Email status" className="rounded-xl border border-sand-300 bg-white px-3 py-2">
          <option value="">All email results</option>
          {(Object.keys(MAIL) as (keyof typeof MAIL)[]).map((s) => <option key={s} value={s}>{MAIL[s]}</option>)}
        </select>
        <Button type="submit" size="sm" variant="secondary">Filter</Button>
      </form>
      <Panel>
        {shown.length === 0 ? <Empty title="No sample requests" text="They appear here as soon as someone uses the form on /sample." /> : (
          <ul className="divide-y divide-sand-200">
            {shown.map((r) => {
              const what = (r.productSlug && getProduct(r.productSlug)?.title) || r.customRequest || "General sample";
              return (
                <li key={r.id}>
                  <details>
                    <summary className="grid cursor-pointer list-none grid-cols-2 items-center gap-3 px-5 py-4 text-sm marker:hidden sm:grid-cols-[1.3fr_1.3fr_auto_auto_auto] [&::-webkit-details-marker]:hidden">
                      <span className="col-span-2 truncate font-semibold text-forest-900 sm:col-span-1">{r.email}</span>
                      <span className="truncate">{what}</span>
                      <span className="text-xs">{fmtDate(r.createdAt)}</span>
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS[r.status]}</Badge>
                      <Badge tone={MAIL_TONE[r.emailStatus]}>{MAIL[r.emailStatus]}</Badge>
                    </summary>
                    <div className="space-y-3 bg-sand-50 px-5 pb-5 pt-2 text-sm">
                      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                        <div><dt className="font-bold text-forest-900">Requested list</dt><dd>{r.productSlug ?? "—"}</dd></div>
                        <div><dt className="font-bold text-forest-900">Custom requirement</dt><dd>{r.customRequest ?? "—"}</dd></div>
                        <div><dt className="font-bold text-forest-900">Email attempts</dt><dd>{r.attempts}</dd></div>
                        <div><dt className="font-bold text-forest-900">Email error</dt><dd>{r.emailError ?? "—"}</dd></div>
                      </dl>
                      <form action={updateSampleAction} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <label className="font-semibold text-forest-900">Status
                          <select name="status" defaultValue={["sent", "failed"].includes(r.status) ? "queued" : r.status} className="ml-2 rounded-xl border border-sand-300 bg-white px-3 py-2 font-normal">
                            {(["queued", "in_progress", "fulfilled", "closed"] as const).map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}
                          </select>
                        </label>
                        <label className="min-w-[14rem] flex-1 font-semibold text-forest-900">Note
                          <input name="note" defaultValue={r.adminNote ?? ""} maxLength={1000} className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 font-normal" />
                        </label>
                        <Button type="submit" size="sm">Save</Button>
                      </form>
                      <form action={sendSampleAction} className="flex flex-wrap items-end gap-2 rounded-xl border border-sand-200 bg-white p-3">
                        <input type="hidden" name="id" value={r.id} />
                        <label className="min-w-[16rem] flex-1 font-semibold text-forest-900">Sample link (https)
                          <input name="url" type="url" required placeholder="https://…" maxLength={500} className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 font-normal" />
                        </label>
                        <label className="flex items-center gap-2 text-forest-700"><input type="checkbox" name="again" value="1" /> Send again if already sent</label>
                        <Button type="submit" size="sm">Email sample to buyer</Button>
                      </form>
                      {r.emailStatus !== "sent" && (
                        <form action={retrySampleEmailAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <Button type="submit" size="sm" variant="secondary">Retry confirmation email</Button>
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
