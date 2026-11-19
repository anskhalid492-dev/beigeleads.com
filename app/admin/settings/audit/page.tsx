import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Empty, PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { CATEGORIES } from "@/lib/settings/registry";
import { listAudit } from "@/lib/settings/service";

export const dynamic = "force-dynamic";
type SP = Promise<{ q?: string; category?: string; from?: string; to?: string; page?: string }>;
const date = (s?: string, end = false) => { const d = s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T${end ? "23:59:59" : "00:00:00"}Z`) : undefined; return d && !isNaN(+d) ? d : undefined; };

export default async function AuditPage({ searchParams }: { searchParams: SP }) {
  await guardAdmin();
  const sp = await searchParams;
  let data;
  try { data = await listAudit(getCloudflareContext().env, { q: sp.q?.slice(0, 80), category: sp.category, from: date(sp.from), to: date(sp.to, true), page: Number(sp.page) || 1 }); } catch {
    return (<><PageHeader title="System Logs & Audit History" /><p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">The audit table is not set up yet. Run drizzle/0016_system_settings.sql in D1, then reload.</p></>);
  }
  const pages = Math.max(1, Math.ceil(data.total / data.per));
  const qs = (p: number) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries({ ...sp, page: String(p) })) if (v) u.set(k, v); return `?${u}`; };
  const input = "rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
  return (
    <>
      <PageHeader title="System Logs & Audit History" text="Every settings change: who, what, old and new value. Records are append-only; no screen can edit or delete them. Wallet, order and blog history keep their own logs." actions={<span className="flex gap-4 text-sm"><Link href="/admin/settings/audit/export" prefetch={false} className="underline">Export CSV</Link><Link href="/admin/settings" className="underline">All settings</Link></span>} />
      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div><label htmlFor="aq" className="mb-1 block text-xs font-semibold">Search</label><input id="aq" name="q" defaultValue={sp.q ?? ""} placeholder="Setting or admin email" className={input} /></div>
        <div><label htmlFor="ac" className="mb-1 block text-xs font-semibold">Section</label><select id="ac" name="category" defaultValue={sp.category ?? ""} className={input}><option value="">All</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
        <div><label htmlFor="af" className="mb-1 block text-xs font-semibold">From</label><input id="af" type="date" name="from" defaultValue={sp.from ?? ""} className={input} /></div>
        <div><label htmlFor="at" className="mb-1 block text-xs font-semibold">To</label><input id="at" type="date" name="to" defaultValue={sp.to ?? ""} className={input} /></div>
        <button className="rounded-xl bg-forest-900 px-4 py-2 text-sm font-semibold text-sand-50">Filter</button>
      </form>
      <Panel>
        {data.rows.length === 0 ? <Empty title="No changes recorded" text="Settings changes will appear here." /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b border-sand-200 text-xs"><th className="px-4 py-3">When</th><th className="px-4 py-3">Admin</th><th className="px-4 py-3">Setting</th><th className="px-4 py-3">Old</th><th className="px-4 py-3">New</th><th className="px-4 py-3">Result</th></tr></thead>
            <tbody className="divide-y divide-sand-200">{data.rows.map((r) => (
              <tr key={r.id}><td className="whitespace-nowrap px-4 py-3 text-xs">{fmtDate(r.createdAt)}</td><td className="px-4 py-3">{r.actor}</td><td className="px-4 py-3 font-mono text-xs">{r.category}.{r.settingKey}</td><td className="max-w-48 break-words px-4 py-3">{r.oldValue || "—"}</td><td className="max-w-48 break-words px-4 py-3">{r.newValue || "—"}</td><td className="px-4 py-3">{r.result}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Panel>
      <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
        <span>{data.total} record{data.total === 1 ? "" : "s"} · page {data.page} of {pages}</span>
        <span className="flex gap-3">{data.page > 1 && <Link href={qs(data.page - 1)} className="underline">Previous</Link>}{data.page < pages && <Link href={qs(data.page + 1)} className="underline">Next</Link>}</span>
      </nav>
    </>
  );
}
