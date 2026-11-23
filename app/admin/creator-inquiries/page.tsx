import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { followerLabel, STATUSES, STATUS_LABEL } from "@/lib/creators/config";
import { deadlineState } from "@/lib/creators/deadline";
import { formatEstimate } from "@/lib/creators/pricing";
import { getDb, schema } from "@/lib/db";
import { recordCreatorResponseAction, retryCreatorEmailAction, updateCreatorInquiryAction } from "./actions";

export const dynamic = "force-dynamic";

const TONE = { new: "info", in_review: "warn", quoted: "info", contacted: "good", won: "good", lost: "mute" } as const;
const MAIL = { pending: "Pending", sent: "Handed to Resend", failed: "Failed", not_configured: "Not configured" } as const;
const MAIL_TONE = { pending: "mute", sent: "good", failed: "bad", not_configured: "warn" } as const;
const DL_TONE = { open: "mute", "due-soon": "warn", overdue: "bad", responded: "good", closed: "mute" } as const;
const PAGE = 25;
const when = (t: number) => new Date(t).toISOString().replace("T", " ").slice(0, 16) + " UTC";
const plat = (j: string) => { try { return (JSON.parse(j) as string[]).join(", "); } catch { return j; } };

export default async function CreatorInquiriesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; sort?: string; page?: string }> }) {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const sp = await searchParams;
  let rows: (typeof schema.creatorInquiries.$inferSelect)[] | null = null;
  try { rows = await getDb().select().from(schema.creatorInquiries).orderBy(desc(schema.creatorInquiries.id)).limit(2000); } catch { rows = null; }
  if (!rows) return (<><PageHeader title="Creator inquiries" text="Custom creator database requests from /creators." /><p role="alert" className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Run migration 0049_creator_inquiries.sql in D1 (one statement at a time) to turn this page on.</p></>);

  const now = new Date().getTime();
  const q = (sp.q ?? "").toLowerCase().trim();
  let shown = rows.filter((r) => (!sp.status || r.status === sp.status) && (!q || `${r.reference} ${r.name} ${r.email} ${r.company ?? ""} ${r.niche} ${r.country} ${plat(r.platforms)} ${r.assignedTo ?? ""}`.toLowerCase().includes(q)));
  if (sp.sort === "deadline") shown = [...shown].sort((a, b) => Number(deadlineState(a, now).state === "closed" || deadlineState(a, now).state === "responded") - Number(deadlineState(b, now).state === "closed" || deadlineState(b, now).state === "responded") || a.respondBy - b.respondBy);
  else if (sp.sort === "price") shown = [...shown].sort((a, b) => b.estimatedCents - a.estimatedCents);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const view = shown.slice((page - 1) * PAGE, page * PAGE);
  const overdue = rows.filter((r) => deadlineState(r, now).state === "overdue").length;
  const openN = rows.filter((r) => deadlineState(r, now).state === "open" || deadlineState(r, now).state === "due-soon").length;
  const pipeline = rows.filter((r) => r.status !== "lost" && r.status !== "won").reduce((n, r) => n + r.estimatedCents, 0);
  const qs = (n: number) => { const u = new URLSearchParams(); for (const k of ["q", "status", "sort"] as const) if (sp[k]) u.set(k, sp[k]!); u.set("page", String(n)); return `?${u}`; };

  return (
    <>
      <PageHeader title="Creator inquiries" text="Custom creator database requests from /creators. The price is an estimate (quantity x the per-contact price). Responded is set only when you record a real reply to the customer." />
      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <StatCard label="Total inquiries" value={rows.length} />
        <StatCard label="Waiting for a reply" value={openN} />
        <StatCard label="Overdue" value={overdue} hint="12-hour promise passed" />
        <StatCard label="Open estimate value" value={formatEstimate(pipeline)} hint="Not won or lost" />
      </div>
      <form className="mb-4 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={sp.q} placeholder="Search name, email, ID, niche, country" aria-label="Search" className="min-w-[14rem] rounded-xl border border-sand-300 bg-white px-3 py-2" />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className="rounded-xl border border-sand-300 bg-white px-3 py-2"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
        <select name="sort" defaultValue={sp.sort ?? ""} aria-label="Sort" className="rounded-xl border border-sand-300 bg-white px-3 py-2"><option value="">Newest first</option><option value="deadline">Reply deadline</option><option value="price">Highest estimate</option></select>
        <Button type="submit" size="sm" variant="secondary">Apply</Button>
      </form>
      <Panel>
        {view.length === 0 ? <Empty title="No inquiries" text="They appear here as soon as someone uses the form on /creators." /> : (
          <ul className="divide-y divide-sand-200">
            {view.map((r) => {
              const d = deadlineState(r, now);
              return (
                <li key={r.id}>
                  <details>
                    <summary className="grid cursor-pointer list-none grid-cols-2 items-center gap-3 px-5 py-4 text-sm marker:hidden sm:grid-cols-[1.2fr_1.5fr_auto_auto_auto] [&::-webkit-details-marker]:hidden">
                      <span className="truncate font-semibold text-forest-900">{r.name}<span className="block truncate text-xs font-normal">{r.email}</span></span>
                      <span className="truncate">{r.niche} · {r.country}<span className="block text-xs">{r.reference} · {r.quantity.toLocaleString("en-US")} contacts · {formatEstimate(r.estimatedCents)}</span></span>
                      <Badge tone={DL_TONE[d.state]}>{d.label}</Badge>
                      <Badge tone={TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      <Badge tone={MAIL_TONE[r.emailStatus]}>{MAIL[r.emailStatus]}</Badge>
                    </summary>
                    <div className="space-y-3 bg-sand-50 px-5 pb-5 pt-2 text-sm">
                      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                        <div><dt className="font-bold text-forest-900">Inquiry ID</dt><dd className="font-mono">{r.reference}</dd></div>
                        <div><dt className="font-bold text-forest-900">Submitted</dt><dd>{when(r.createdAt)}</dd></div>
                        <div><dt className="font-bold text-forest-900">Reply due</dt><dd>{when(r.respondBy)}{r.respondedAt ? ` · responded ${when(r.respondedAt)}` : ""}</dd></div>
                        <div><dt className="font-bold text-forest-900">Reply to</dt><dd><a className="underline underline-offset-4" href={`mailto:${r.email}?subject=${encodeURIComponent(`Your creator list inquiry (${r.reference})`)}`}>{r.email}</a>{r.company ? ` · ${r.company}` : ""}</dd></div>
                        <div><dt className="font-bold text-forest-900">Platforms</dt><dd>{plat(r.platforms)}</dd></div>
                        <div><dt className="font-bold text-forest-900">Followers</dt><dd>{followerLabel(r.followerRange)}</dd></div>
                        <div><dt className="font-bold text-forest-900">Contacts · estimate</dt><dd>{r.quantity.toLocaleString("en-US")} · {formatEstimate(r.estimatedCents)}</dd></div>
                        {r.language && <div><dt className="font-bold text-forest-900">Creator language</dt><dd>{r.language}</dd></div>}
                        {r.audienceGeo && <div><dt className="font-bold text-forest-900">Audience geography</dt><dd>{r.audienceGeo}</dd></div>}
                        {r.engagement && <div><dt className="font-bold text-forest-900">Engagement</dt><dd>{r.engagement}</dd></div>}
                        <div><dt className="font-bold text-forest-900">Sales alert</dt><dd>{r.ownerNotify}</dd></div>
                        <div><dt className="font-bold text-forest-900">Email attempts / error</dt><dd>{r.attempts} · {r.emailError ?? "none"}</dd></div>
                      </dl>
                      {r.notes && <div><p className="font-bold text-forest-900">Additional notes</p><p className="mt-1 whitespace-pre-wrap rounded-xl border border-sand-200 bg-white p-3">{r.notes}</p></div>}
                      <form action={updateCreatorInquiryAction} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <label className="font-semibold text-forest-900">Status<select name="status" defaultValue={r.status} className="ml-2 rounded-xl border border-sand-300 bg-white px-3 py-2 font-normal">{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></label>
                        <label className="font-semibold text-forest-900">Assigned to<input name="assignedTo" defaultValue={r.assignedTo ?? ""} maxLength={120} placeholder="Name" className="ml-2 w-40 rounded-xl border border-sand-300 bg-white px-3 py-2 font-normal" /></label>
                        <label className="min-w-[14rem] flex-1 font-semibold text-forest-900">Internal note<input name="note" defaultValue={r.internalNote ?? ""} maxLength={2000} className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 font-normal" /></label>
                        <Button type="submit" size="sm">Save</Button>
                      </form>
                      {r.respondedAt == null && (
                        <form action={recordCreatorResponseAction} className="flex flex-wrap items-center gap-3 rounded-xl border border-sand-200 bg-white p-3">
                          <input type="hidden" name="id" value={r.id} />
                          <label className="flex items-center gap-2"><input type="checkbox" name="confirm" required /> I sent a real reply to the customer</label>
                          <Button type="submit" size="sm" variant="secondary">Record response</Button>
                        </form>
                      )}
                      {r.emailStatus !== "sent" && (<form action={retryCreatorEmailAction}><input type="hidden" name="id" value={r.id} /><Button type="submit" size="sm" variant="secondary">Retry confirmation email</Button></form>)}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <a className="font-semibold underline underline-offset-4" href={qs(page - 1)}>Previous</a> : <span />}
          <span>Page {page} of {pages}</span>
          {page < pages ? <a className="font-semibold underline underline-offset-4" href={qs(page + 1)}>Next</a> : <span />}
        </nav>
      )}
    </>
  );
}
