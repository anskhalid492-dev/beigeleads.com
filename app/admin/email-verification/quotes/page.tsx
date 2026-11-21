import { getCloudflareContext } from "@opennextjs/cloudflare";
import { desc } from "drizzle-orm";
import { Badge, Empty, PageHeader, Panel } from "@/components/admin/ui";
import { getDbFromEnv, schema } from "@/lib/db";
import { gate } from "../gate";
import { QuoteRow } from "./row";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verification quotes", robots: { index: false, follow: false } };

export default async function QuotesPage() {
  await gate();
  let rows: (typeof schema.evQuotes.$inferSelect)[] | null = null;
  try { rows = await getDbFromEnv(getCloudflareContext().env).select().from(schema.evQuotes).orderBy(desc(schema.evQuotes.id)).limit(200); } catch { rows = null; }
  if (!rows) return (<><PageHeader title="Verification quotes" /><p role="alert" className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Run migration 0045_email_verification.sql in D1 (one statement at a time) to turn this page on.</p></>);
  return (
    <>
      <PageHeader title="Verification quotes" text="Custom quote requests for lists above the largest package." />
      <Panel>{rows.length === 0 ? <Empty title="No quote requests yet" /> : <ul className="divide-y divide-sand-200">{rows.map((q) => (
        <li key={q.id} className="px-5 py-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-forest-900">{q.name} · <a className="underline" href={`mailto:${q.email}`}>{q.email}</a></span><span><Badge tone={q.status === "new" ? "warn" : "mute"}>{q.status}</Badge> <span className="font-mono text-xs">{q.reference}</span></span></div>
          <p className="mt-1">Estimated: <strong>{q.estimatedCount}</strong> · {new Date(q.createdAt * 1000).toISOString().slice(0, 10)} · owner alert: {q.ownerNotify}</p>
          {q.requirements && <p className="mt-1 whitespace-pre-wrap">{q.requirements}</p>}
          <QuoteRow id={q.id} status={q.status} note={q.note} />
        </li>))}</ul>}</Panel>
    </>
  );
}
