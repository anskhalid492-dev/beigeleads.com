import Link from "next/link";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel, StatCard, fmtDate } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDb, schema } from "@/lib/db";
import { PARTNER_STATUSES, PARTNER_STATUS_LABEL, businessTypeLabel, type PartnerStatus } from "@/lib/partners/types";
import { Button } from "@/components/ui/button";
import { NoteForm, PartnerActions } from "./action-buttons";

export const dynamic = "force-dynamic";
const TONE = { pending: "warn", under_review: "info", approved: "good", declined: "mute" } as const;
const MAIL_TONE = { pending: "mute", sent: "good", failed: "bad", skipped: "warn" } as const;
const PAGE = 25;

export default async function PartnerRequestsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string; id?: string }> }) {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const sp = await searchParams;
  const db = getDb();
  let rows: (typeof schema.partnerApplications.$inferSelect)[] | null = null;
  let codes: (typeof schema.partnerDiscounts.$inferSelect)[] = [];
  try {
    rows = await db.select().from(schema.partnerApplications).orderBy(desc(schema.partnerApplications.id)).limit(1000);
    codes = await db.select().from(schema.partnerDiscounts);
  } catch { rows = null; }
  if (!rows) {
    return (
      <>
        <PageHeader title="Partner Requests" text="Applications from /partners." />
        <p role="alert" className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Run migration 0033_partners.sql in D1 (one statement at a time) to turn this page on.</p>
      </>
    );
  }
  const codeOf = new Map(codes.map((c) => [c.applicationId, c]));
  const q = (sp.q ?? "").toLowerCase().trim();
  const shown = rows.filter((r) => (!sp.status || r.status === sp.status) && (!q || `${r.reference} ${r.fullName} ${r.businessName} ${r.email} ${r.country} ${r.website}`.toLowerCase().includes(q)));
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const view = shown.slice((page - 1) * PAGE, page * PAGE);
  const count = (s: PartnerStatus) => rows!.filter((r) => r.status === s).length;
  const selected = sp.id ? rows.find((r) => r.id === Number(sp.id)) : undefined;
  const qs = (n: number) => { const u = new URLSearchParams(); for (const k of ["q", "status"] as const) if (sp[k]) u.set(k, sp[k]!); u.set("page", String(n)); return `?${u}`; };
  const sel = selected ? codeOf.get(selected.id) : undefined;

  return (
    <>
      <PageHeader title="Partner Requests" text="Applications to the Data Reseller Partner Program. Approving creates the partner's personal 50% code and emails it; declining emails the decision. The code works only with the applicant's own email." />
      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <StatCard label="Pending" value={count("pending")} />
        <StatCard label="Under review" value={count("under_review")} />
        <StatCard label="Approved" value={count("approved")} />
        <StatCard label="Declined" value={count("declined")} />
      </div>

      {selected && (
        <Panel className="mb-6">
          <div className="space-y-4 p-5 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-forest-900">{selected.businessName}</p>
                <p>{selected.fullName} · <a className="underline underline-offset-4" href={`mailto:${selected.email}`}>{selected.email}</a></p>
              </div>
              <div className="flex items-center gap-2"><Badge tone={TONE[selected.status]}>{PARTNER_STATUS_LABEL[selected.status]}</Badge><Link href="?" className="text-xs underline">Close</Link></div>
            </div>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div><dt className="font-bold text-forest-900">Reference</dt><dd className="font-mono">{selected.reference}</dd></div>
              <div><dt className="font-bold text-forest-900">Submitted</dt><dd>{fmtDate(selected.createdAt)}</dd></div>
              <div><dt className="font-bold text-forest-900">Website</dt><dd><a className="break-all underline underline-offset-4" href={selected.website} target="_blank" rel="noopener noreferrer nofollow">{selected.website}</a></dd></div>
              <div><dt className="font-bold text-forest-900">Country</dt><dd>{selected.country}</dd></div>
              <div><dt className="font-bold text-forest-900">Business type</dt><dd>{businessTypeLabel(selected.businessType)}</dd></div>
              <div><dt className="font-bold text-forest-900">Estimated monthly volume</dt><dd>{selected.monthlyVolume || "Not given"}</dd></div>
              <div><dt className="font-bold text-forest-900">Terms accepted</dt><dd>{fmtDate(new Date(selected.termsAcceptedAt * 1000))}</dd></div>
              <div><dt className="font-bold text-forest-900">Emails</dt><dd className="flex flex-wrap gap-1.5"><Badge tone={MAIL_TONE[selected.emailStatus]}>Received: {selected.emailStatus}</Badge>{selected.decisionEmail && <Badge tone={MAIL_TONE[selected.decisionEmail]}>Decision: {selected.decisionEmail}</Badge>}</dd></div>
            </dl>
            <div><p className="font-bold text-forest-900">How they plan to resell</p><p className="mt-1 whitespace-pre-wrap rounded-xl border border-sand-200 bg-sand-50 p-3">{selected.resalePlan}</p></div>
            {selected.notes && <div><p className="font-bold text-forest-900">Additional information</p><p className="mt-1 whitespace-pre-wrap rounded-xl border border-sand-200 bg-sand-50 p-3">{selected.notes}</p></div>}
            {sel && (
              <p className="rounded-xl bg-sand-100 px-4 py-3">Partner code <strong className="font-mono text-forest-900">{sel.code}</strong> · {sel.percent}% · <Badge tone={sel.active ? "good" : "bad"}>{sel.active ? "Active" : "Deactivated"}</Badge> · used on {sel.uses} order{sel.uses === 1 ? "" : "s"} · only for {sel.email}</p>
            )}
            <PartnerActions id={selected.id} status={selected.status} hasCode={!!sel} codeActive={!!sel?.active} decisionEmail={selected.decisionEmail} />
            <NoteForm id={selected.id} note={selected.internalNote ?? ""} />
          </div>
        </Panel>
      )}

      <form className="mb-4 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={sp.q} placeholder="Search name, business, email, country" aria-label="Search" className="min-w-[14rem] rounded-xl border border-sand-300 bg-white px-3 py-2" />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className="rounded-xl border border-sand-300 bg-white px-3 py-2">
          <option value="">All statuses</option>
          {PARTNER_STATUSES.map((s) => <option key={s} value={s}>{PARTNER_STATUS_LABEL[s]}</option>)}
        </select>
        <Button type="submit" size="sm" variant="secondary">Filter</Button>
      </form>
      <Panel>
        {view.length === 0 ? <Empty title="No applications" text="They appear here as soon as someone applies on /partners." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="text-xs text-forest-700"><tr><th className="px-5 py-2">Applicant</th><th>Business</th><th>Email</th><th>Country</th><th>Business type</th><th>Submitted</th><th>Status</th><th className="pr-5">Actions</th></tr></thead>
              <tbody className="divide-y divide-sand-200">
                {view.map((r) => (
                  <tr key={r.id} className={r.id === selected?.id ? "bg-sand-50" : ""}>
                    <td className="px-5 py-3 font-semibold text-forest-900">{r.fullName}</td>
                    <td>{r.businessName}</td>
                    <td className="max-w-[14rem] truncate">{r.email}</td>
                    <td>{r.country}</td>
                    <td>{businessTypeLabel(r.businessType)}</td>
                    <td className="whitespace-nowrap">{fmtDate(r.createdAt).slice(0, 10)}</td>
                    <td><Badge tone={TONE[r.status]}>{PARTNER_STATUS_LABEL[r.status]}</Badge></td>
                    <td className="pr-5"><Link className="font-semibold underline underline-offset-4" href={`?id=${r.id}${sp.status ? `&status=${sp.status}` : ""}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${sp.page ? `&page=${sp.page}` : ""}`}>View and decide</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link className="font-semibold underline underline-offset-4" href={qs(page - 1)}>Previous</Link> : <span />}
          <span>Page {page} of {pages}</span>
          {page < pages ? <Link className="font-semibold underline underline-offset-4" href={qs(page + 1)}>Next</Link> : <span />}
        </nav>
      )}
    </>
  );
}
