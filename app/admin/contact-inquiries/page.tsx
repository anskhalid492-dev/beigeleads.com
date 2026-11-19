import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel, StatCard, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { INQUIRY_TYPES, STATUSES, STATUS_LABEL, inquiryLabel } from "@/lib/contact/types";
import { getDb, schema } from "@/lib/db";
import { retryInquiryEmailAction, updateInquiryAction } from "./actions";

export const dynamic = "force-dynamic";

const TONE = { new: "info", in_progress: "warn", resolved: "good", closed: "mute" } as const;
const MAIL = { pending: "Pending", sent: "Handed to Resend", failed: "Failed", not_configured: "Not configured" } as const;
const MAIL_TONE = { pending: "mute", sent: "good", failed: "bad", not_configured: "warn" } as const;
const OWNER = { pending: "Pending", sent: "Alert sent", failed: "Alert failed", skipped: "Alert off" } as const;
const OWNER_TONE = { pending: "mute", sent: "good", failed: "bad", skipped: "warn" } as const;
const PAGE = 25;

export default async function ContactInquiriesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; type?: string; mail?: string; page?: string }> }) {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const sp = await searchParams;
  let rows: (typeof schema.contactInquiries.$inferSelect)[] | null = null;
  try { rows = await getDb().select().from(schema.contactInquiries).orderBy(desc(schema.contactInquiries.id)).limit(1000); } catch { rows = null; }
  if (!rows) {
    return (
      <>
        <PageHeader title="Contact inquiries" text="Messages sent from /contact." />
        <p role="alert" className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Run migration 0020_contact_inquiries.sql in D1 to turn this page on.</p>
      </>
    );
  }
  let legacy: (typeof schema.contactMessages.$inferSelect)[] = [];
  try { legacy = await getDb().select().from(schema.contactMessages).orderBy(desc(schema.contactMessages.id)).limit(100); } catch { legacy = []; }

  const q = (sp.q ?? "").toLowerCase().trim();
  const shown = rows.filter((r) =>
    (!sp.status || r.status === sp.status) && (!sp.type || r.inquiryType === sp.type) && (!sp.mail || r.emailStatus === sp.mail) &&
    (!q || `${r.reference} ${r.name} ${r.email} ${r.subject} ${r.orderNumber ?? ""} ${r.message}`.toLowerCase().includes(q)),
  );
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const view = shown.slice((page - 1) * PAGE, page * PAGE);
  const open = rows.filter((r) => r.status === "new" || r.status === "in_progress").length;
  const mailBad = rows.filter((r) => r.emailStatus === "failed" || r.emailStatus === "not_configured").length;
  const qs = (n: number) => { const u = new URLSearchParams(); for (const k of ["q", "status", "type", "mail"] as const) if (sp[k]) u.set(k, sp[k]!); u.set("page", String(n)); return `?${u}`; };

  return (
    <>
      <PageHeader title="Contact inquiries" text="Messages sent from /contact. The email status is the real result of handing the confirmation email to Resend. Notes are internal and never shown to the sender." />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total inquiries" value={rows.length} />
        <StatCard label="Open (new or in progress)" value={open} />
        <StatCard label="Email needs attention" value={mailBad} hint="Failed or not configured" />
      </div>
      <form className="mb-4 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={sp.q} placeholder="Search name, email, reference, order" aria-label="Search" className="min-w-[14rem] rounded-xl border border-sand-300 bg-white px-3 py-2" />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className="rounded-xl border border-sand-300 bg-white px-3 py-2">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select name="type" defaultValue={sp.type ?? ""} aria-label="Inquiry type" className="rounded-xl border border-sand-300 bg-white px-3 py-2">
          <option value="">All types</option>
          {INQUIRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select name="mail" defaultValue={sp.mail ?? ""} aria-label="Email status" className="rounded-xl border border-sand-300 bg-white px-3 py-2">
          <option value="">All email results</option>
          {(Object.keys(MAIL) as (keyof typeof MAIL)[]).map((s) => <option key={s} value={s}>{MAIL[s]}</option>)}
        </select>
        <Button type="submit" size="sm" variant="secondary">Filter</Button>
      </form>
      <Panel>
        {view.length === 0 ? <Empty title="No inquiries" text="They appear here as soon as someone uses the form on /contact." /> : (
          <ul className="divide-y divide-sand-200">
            {view.map((r) => (
              <li key={r.id}>
                <details>
                  <summary className="grid cursor-pointer list-none grid-cols-2 items-center gap-3 px-5 py-4 text-sm marker:hidden sm:grid-cols-[1.2fr_1.6fr_auto_auto_auto] [&::-webkit-details-marker]:hidden">
                    <span className="truncate font-semibold text-forest-900">{r.name}<span className="block truncate text-xs font-normal">{r.email}</span></span>
                    <span className="truncate">{r.subject}<span className="block text-xs">{inquiryLabel(r.inquiryType)} · {r.reference}</span></span>
                    <span className="text-xs">{fmtDate(r.createdAt)}</span>
                    <Badge tone={TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    <Badge tone={MAIL_TONE[r.emailStatus]}>{MAIL[r.emailStatus]}</Badge>
                  </summary>
                  <div className="space-y-3 bg-sand-50 px-5 pb-5 pt-2 text-sm">
                    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      <div><dt className="font-bold text-forest-900">Reference</dt><dd className="font-mono">{r.reference}</dd></div>
                      <div><dt className="font-bold text-forest-900">Reply to</dt><dd><a className="underline underline-offset-4" href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: ${r.subject} (${r.reference})`)}`}>{r.email}</a></dd></div>
                      {r.orderNumber && <div><dt className="font-bold text-forest-900">Order number</dt><dd>{r.orderNumber}</dd></div>}
                      <div><dt className="font-bold text-forest-900">Admin alert</dt><dd><Badge tone={OWNER_TONE[r.ownerNotify]}>{OWNER[r.ownerNotify]}</Badge></dd></div>
                      <div><dt className="font-bold text-forest-900">Confirmation attempts</dt><dd>{r.attempts}</dd></div>
                      <div><dt className="font-bold text-forest-900">Email error</dt><dd>{r.emailError ?? "—"}</dd></div>
                    </dl>
                    <div><p className="font-bold text-forest-900">Message</p><p className="mt-1 whitespace-pre-wrap rounded-xl border border-sand-200 bg-white p-3">{r.message}</p></div>
                    <form action={updateInquiryAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <label className="font-semibold text-forest-900">Status
                        <select name="status" defaultValue={r.status} className="ml-2 rounded-xl border border-sand-300 bg-white px-3 py-2 font-normal">
                          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </label>
                      <label className="min-w-[14rem] flex-1 font-semibold text-forest-900">Internal note
                        <input name="note" defaultValue={r.internalNote ?? ""} maxLength={2000} className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 font-normal" />
                      </label>
                      <Button type="submit" size="sm">Save</Button>
                    </form>
                    {r.emailStatus !== "sent" && (
                      <form action={retryInquiryEmailAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" size="sm" variant="secondary">Retry confirmation email</Button>
                      </form>
                    )}
                  </div>
                </details>
              </li>
            ))}
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
      {legacy.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-semibold text-forest-900">Earlier messages from before the redesign ({legacy.length}, read-only)</summary>
          <Panel className="mt-3">
            <ul className="divide-y divide-sand-200 text-sm">
              {legacy.map((m) => (
                <li key={m.id} className="px-5 py-3">
                  <p className="font-semibold text-forest-900">{m.name ?? "No name"} · {m.email} <span className="font-normal text-xs">{fmtDate(m.createdAt)}</span></p>
                  <p className="mt-1 whitespace-pre-wrap">{m.message}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </details>
      )}
    </>
  );
}
