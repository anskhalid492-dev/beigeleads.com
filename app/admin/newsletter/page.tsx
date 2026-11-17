import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, StatCard, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { newsletterOn, newsletterStats } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export default async function NewsletterAdmin() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  let s;
  try { s = await newsletterStats(env); } catch {
    return <><PageHeader title="Newsletter" /><p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">Run drizzle/0008_newsletter.sql in D1 first.</p></>;
  }
  const on = newsletterOn(env);
  return (
    <>
      <PageHeader title="Newsletter" text="Double opt-in signups from the blog. This site only collects and confirms addresses. It does not send newsletters: export the confirmed list and send from your own email tool."
        actions={<Button asChild><Link href="/admin/newsletter/export" prefetch={false}>Export confirmed (CSV)</Link></Button>} />
      <p className={`mb-4 rounded-xl p-3 text-sm ${on ? "bg-forest-100 text-forest-900" : "bg-amber-100 text-amber-900"}`}>{on ? "The signup form is visible on the blog." : "The signup form is hidden. Set the variable NEWSLETTER_ENABLED to true in Cloudflare to show it, only once you will really send emails."}</p>
      <div className="mb-6 grid grid-cols-3 gap-4"><StatCard label="Confirmed" value={s.confirmed} /><StatCard label="Waiting for confirmation" value={s.pending} /><StatCard label="Unsubscribed" value={s.unsubscribed} /></div>
      <Panel title="Latest signups">
        {s.recent.length === 0 ? <Empty title="No signups yet" /> : (
          <ul className="divide-y divide-sand-200 text-sm">{s.recent.map((r) => <li key={r.email} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"><span>{r.email}</span><span className="flex items-center gap-3 text-xs"><span>{fmtDate(r.confirmedAt ?? r.createdAt)}</span><Badge tone={r.status === "confirmed" ? "good" : r.status === "pending" ? "warn" : "mute"}>{r.status}</Badge></span></li>)}</ul>
        )}
      </Panel>
    </>
  );
}
