import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, StatCard, usd } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { getDbFromEnv } from "@/lib/db";
import { LABEL, STATUSES, TONE, isStatus } from "@/lib/ev/state";
import { listOrders, statusCounts } from "@/lib/ev/store";
import { gate } from "./gate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email Verification Orders", robots: { index: false, follow: false } };
const PER = 25;
const d = (t: number | null) => (t ? new Date(t * 1000).toISOString().slice(0, 10) : "—");
const size = (b: number) => (b > 0 ? `${(b / 1024 / 1024).toFixed(1)} MB` : "—");

export default async function EvOrders({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await gate();
  const sp = await searchParams;
  const db = getDbFromEnv(getCloudflareContext().env);
  const page = Math.max(1, Number(sp.page) || 1);
  let data: Awaited<ReturnType<typeof listOrders>> | null = null; let counts: Record<string, number> = {};
  try { data = await listOrders(db, { status: sp.status, q: (sp.q ?? "").trim() || undefined, page, per: PER }); counts = await statusCounts(db); } catch { data = null; }
  if (!data) return (<><PageHeader title="Email Verification Orders" /><p role="alert" className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Run migration 0045_email_verification.sql in D1 (one statement at a time) to turn this page on.</p></>);
  const pages = Math.max(1, Math.ceil(data.total / PER));
  const href = (p: number) => `?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.status ? { status: sp.status } : {}), page: String(p) })}`;
  return (
    <>
      <PageHeader title="Email Verification Orders" text="Orders for the manual verification service. A job is never completed automatically: you upload the result and mark it Completed."
        actions={<div className="flex gap-2"><Button asChild variant="secondary"><Link href="/admin/email-verification/quotes">Custom quotes</Link></Button><Button asChild variant="secondary"><Link href="/admin/email-verification/settings">Settings</Link></Button></div>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Waiting for a list" value={counts.awaiting_file ?? 0} />
        <StatCard label="To process" value={(counts.file_submitted ?? 0) + (counts.in_queue ?? 0)} hint="File submitted or in queue" />
        <StatCard label="Processing" value={counts.processing ?? 0} />
        <StatCard label="Needs customer action" value={counts.needs_action ?? 0} />
      </div>
      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Order ID or customer email" aria-label="Search orders" className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm" />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]} ({counts[s] ?? 0})</option>)}</select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      <Panel>
        {data.rows.length === 0 ? <Empty title="No verification orders" text="Orders appear here as soon as a customer starts checkout with a verification package." /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-sand-200 text-xs text-forest-700"><tr>{["Order", "Customer", "Package", "Paid", "Max", "Submitted", "File", "Payment", "Status", "Submitted on", "Completed"].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-sand-200">{data.rows.map((r) => (
              <tr key={r.id} className="hover:bg-sand-50">
                <td className="px-3 py-2.5"><Link className="font-mono font-semibold text-forest-900 underline" href={`/admin/email-verification/${r.id}`}>{r.id}</Link></td>
                <td className="px-3 py-2.5">{r.email}</td><td className="px-3 py-2.5">{r.packageName}</td><td className="px-3 py-2.5">{usd(r.priceCents)}</td>
                <td className="px-3 py-2.5">{r.limitCount.toLocaleString("en-US")}</td><td className="px-3 py-2.5">{r.submittedCount > 0 ? r.submittedCount.toLocaleString("en-US") : "—"}</td>
                <td className="max-w-[14rem] truncate px-3 py-2.5" title={r.filename ?? ""}>{r.filename ?? "—"} <span className="text-xs">{size(r.sizeBytes)}</span></td>
                <td className="px-3 py-2.5"><Badge tone={r.payStatus === "paid" ? "good" : "mute"}>{r.payStatus ?? "unknown"}</Badge></td>
                <td className="px-3 py-2.5"><Badge tone={isStatus(r.status) ? TONE[r.status] : "mute"}>{isStatus(r.status) ? LABEL[r.status] : r.status}</Badge></td>
                <td className="px-3 py-2.5">{d(r.submittedAt)}</td><td className="px-3 py-2.5">{d(r.completedAt)}</td>
              </tr>))}</tbody></table></div>
        )}
      </Panel>
      {pages > 1 && <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm"><span>Page {page} of {pages}</span><span className="flex gap-3">{page > 1 && <Link className="font-semibold underline" href={href(page - 1)}>Previous</Link>}{page < pages && <Link className="font-semibold underline" href={href(page + 1)}>Next</Link>}</span></nav>}
    </>
  );
}
