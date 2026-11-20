import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel, StatCard, fmtDate, usd } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDb } from "@/lib/db";
import { loadStats, type Row } from "@/lib/promos/admin";
import { PromoRowActions } from "./row-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promotions", robots: { index: false, follow: false } };
const TONE = { draft: "mute", paused: "warn", scheduled: "info", active: "good", expired: "bad" } as const;
const LABEL = { draft: "Draft", paused: "Paused", scheduled: "Scheduled", active: "Active", expired: "Expired" } as const;
const PAGE = 20;
const day = (s: string | undefined, end = false) => { const t = s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? Date.parse(`${s}T00:00:00Z`) / 1000 : undefined; return t === undefined ? undefined : end ? t + 86400 : t; };

function scopeText(r: Row) {
  const p = r.promo;
  const bits = [p.productSlugs.length ? `${p.productSlugs.length} list${p.productSlugs.length === 1 ? "" : "s"}` : "", p.categorySlugs.length ? `${p.categorySlugs.length} industr${p.categorySlugs.length === 1 ? "y" : "ies"}` : "", p.packageNames.length ? p.packageNames.join(", ") : ""].filter(Boolean);
  return bits.length ? bits.join(" · ") : "Whole cart";
}

export default async function PromotionsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string; from?: string; to?: string; promo?: string; created?: string }> }) {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const sp = await searchParams;
  const stats = await loadStats(getDb(), { from: day(sp.from), to: day(sp.to, true) });
  if (!stats) {
    return (
      <>
        <PageHeader title="Promotions" text="Discounts and promo codes." />
        <p role="alert" className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Run migration 0034_promotions.sql in D1 (one statement at a time) to turn this page on.</p>
      </>
    );
  }
  const q = (sp.q ?? "").toLowerCase().trim();
  const shown = stats.rows
    .filter((r) => (!sp.status || r.shown === sp.status) && (!sp.promo || String(r.promo.id) === sp.promo) && (!q || `${r.promo.name} ${r.promo.code ?? ""} ${r.promo.title}`.toLowerCase().includes(q)))
    .sort((a, b) => b.promo.id - a.promo.id);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const view = shown.slice((page - 1) * PAGE, page * PAGE);
  const qs = (n: number) => { const u = new URLSearchParams(); for (const k of ["q", "status", "from", "to", "promo"] as const) if (sp[k]) u.set(k, sp[k]!); u.set("page", String(n)); return `?${u}`; };

  return (
    <>
      <PageHeader title="Promotions" text="Create, schedule and pause discounts. Everything is checked and calculated on the server at checkout, so the amount a customer pays always matches the promotion." actions={<Button asChild><Link href="/admin/promotions/new">Create promotion</Link></Button>} />
      {sp.created && <p role="status" className="mb-4 rounded-xl bg-forest-100 px-4 py-2.5 text-sm font-medium text-forest-900">Promotion created. It is a draft or scheduled until you activate it.</p>}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active now" value={stats.active} hint={`${stats.scheduled} scheduled · ${stats.expired} expired`} />
        <StatCard label="Redemptions (paid)" value={stats.redemptions} hint="Orders that paid with a promotion" />
        <StatCard label="Discount given" value={usd(stats.discountCents)} />
        <StatCard label="Revenue from promo orders" value={usd(stats.revenueCents)} hint={stats.testExcluded > 0 ? `${stats.testExcluded} test-network payment${stats.testExcluded === 1 ? "" : "s"} not counted` : "Real payments only"} />
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Panel title="Most-used codes">
          {stats.top.length === 0 ? <Empty title="No redemptions yet" text="Codes appear here after real orders pay with them." /> : (
            <ul className="divide-y divide-sand-200 text-sm">{stats.top.map((t) => <li key={`${t.code}-${t.name}`} className="flex items-center justify-between px-5 py-2.5"><span><strong className="font-mono text-forest-900">{t.code}</strong> <span className="text-forest-500">· {t.name}</span></span><span className="font-semibold">{t.uses}</span></li>)}</ul>
          )}
        </Panel>
        <Panel title="Partner codes (tracked separately)">
          <dl className="grid grid-cols-2 gap-3 p-5 text-sm">
            <div><dt className="font-bold text-forest-900">Paid partner orders</dt><dd>{stats.partner.orders}</dd></div>
            <div><dt className="font-bold text-forest-900">Codes used at checkout</dt><dd>{stats.partner.uses}</dd></div>
            <div><dt className="font-bold text-forest-900">Discount given</dt><dd>{usd(stats.partner.discountCents)}</dd></div>
            <div><dt className="font-bold text-forest-900">Revenue</dt><dd>{usd(stats.partner.revenueCents)}</dd></div>
          </dl>
          <p className="px-5 pb-4 text-xs">Personal partner codes are managed in Partner Requests. Conversion rates are not shown: the site does not record who saw a promotion, so a rate cannot be measured honestly.</p>
        </Panel>
      </div>

      <form className="mb-4 flex flex-wrap items-end gap-2 text-sm">
        <input name="q" defaultValue={sp.q} placeholder="Search name or code" aria-label="Search" className="min-w-[14rem] rounded-xl border border-sand-300 bg-white px-3 py-2" />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className="rounded-xl border border-sand-300 bg-white px-3 py-2"><option value="">All statuses</option>{Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select name="promo" defaultValue={sp.promo ?? ""} aria-label="Promotion" className="max-w-[14rem] rounded-xl border border-sand-300 bg-white px-3 py-2"><option value="">All promotions</option>{stats.rows.map((r) => <option key={r.promo.id} value={r.promo.id}>{r.promo.name}</option>)}</select>
        <label className="text-xs font-semibold">Paid from<input type="date" name="from" defaultValue={sp.from} className="ml-1 rounded-xl border border-sand-300 bg-white px-2 py-1.5 text-sm font-normal" /></label>
        <label className="text-xs font-semibold">to<input type="date" name="to" defaultValue={sp.to} className="ml-1 rounded-xl border border-sand-300 bg-white px-2 py-1.5 text-sm font-normal" /></label>
        <Button type="submit" size="sm" variant="secondary">Filter</Button>
      </form>

      <Panel>
        {view.length === 0 ? <Empty title="No promotions" text="Create your first promotion. Start from a template and set it live when you are ready." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] text-left text-sm">
              <thead className="text-xs text-forest-700"><tr><th className="px-5 py-2">Promotion</th><th>Code</th><th>Discount</th><th>Applies to</th><th>Dates</th><th>Redemptions</th><th>Revenue</th><th>Status</th><th className="pr-5">Actions</th></tr></thead>
              <tbody className="divide-y divide-sand-200">
                {view.map((r) => (
                  <tr key={r.promo.id} className="align-top">
                    <td className="px-5 py-3"><p className="font-semibold text-forest-900">{r.promo.name}</p><p className="text-xs">{r.promo.title}</p></td>
                    <td className="font-mono">{r.promo.code ?? <span className="font-sans text-xs">Automatic</span>}</td>
                    <td className="whitespace-nowrap">{r.promo.kind === "percent" ? `${r.promo.value}%` : usd(r.promo.value)}{r.promo.combinable && <span className="ml-1 text-xs">· combinable</span>}</td>
                    <td className="max-w-[12rem] text-xs">{scopeText(r)}{r.promo.partnerOnly && <span className="block">Partners only</span>}{r.promo.firstPurchaseOnly && <span className="block">First purchase only</span>}</td>
                    <td className="whitespace-nowrap text-xs">{r.promo.startsAt ? fmtDate(new Date(r.promo.startsAt * 1000)).slice(0, 16) : "—"}<br />{r.promo.endsAt ? fmtDate(new Date(r.promo.endsAt * 1000)).slice(0, 16) : "No end"}</td>
                    <td>{r.uses}{r.promo.usageLimit ? ` / ${r.promo.usageLimit}` : ""}{r.reserved > 0 && <span className="block text-xs">{r.reserved} awaiting payment</span>}</td>
                    <td>{usd(r.revenueCents)}</td>
                    <td><Badge tone={TONE[r.shown]}>{LABEL[r.shown]}</Badge></td>
                    <td className="pr-5"><PromoRowActions id={r.promo.id} status={r.promo.status} /></td>
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
