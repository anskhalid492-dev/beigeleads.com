import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, StatCard, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { loadFollowups } from "@/lib/followups/settings";
import { counts, listReviews } from "@/lib/followups/reviews";
import { FollowupForm } from "./form";
import { moderateReviewAction } from "./actions";

export const dynamic = "force-dynamic";
const TONE = { submitted: "warn", approved: "good", hidden: "mute", private: "info" } as const;
const LABEL = { submitted: "Waiting for approval", approved: "Approved (public)", hidden: "Hidden", private: "Private (buyer kept it private)" } as const;

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const { env } = getCloudflareContext();
  const sp = await searchParams;
  const f = (["submitted", "approved", "hidden", "private"] as const).find((x) => x === sp.f) ?? "all";
  const [settings, c, list] = await Promise.all([loadFollowups(env), counts(env), listReviews(env, f)]);
  return (
    <>
      <PageHeader title="Reviews & follow-ups" text="Real answers from buyers after delivery, and one follow-up email after a free sample. Nothing is public until you approve it and the buyer allowed it." />
      {!list.ready && <p role="alert" className="mb-5 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Run migration 0051_followups.sql in D1 (one statement at a time) to turn reviews and follow-ups on.</p>}
      {c && (
        <div className="mb-5 grid gap-4 sm:grid-cols-4">
          <StatCard label="Requests sent" value={c.requested + c.submitted + c.approved + c.hidden + c.private} />
          <StatCard label="Answered" value={c.submitted + c.approved + c.hidden + c.private} hint="Includes private answers" />
          <StatCard label="Waiting for approval" value={c.submitted} />
          <StatCard label="Public" value={c.approved} />
        </div>
      )}
      <Panel title="Settings"><FollowupForm s={settings} /></Panel>
      <div className="mt-6" />
      <form className="mb-3 flex gap-2 text-sm">
        <select name="f" defaultValue={f} aria-label="Filter" className="rounded-xl border border-sand-300 bg-white px-3 py-2">
          <option value="all">All answers</option>
          {(Object.keys(LABEL) as (keyof typeof LABEL)[]).map((k) => <option key={k} value={k}>{LABEL[k]}</option>)}
        </select>
        <Button type="submit" size="sm" variant="secondary">Filter</Button>
      </form>
      <Panel title="Answers">
        {list.rows.length === 0 ? <Empty title="No answers yet" text="They appear here after buyers answer the request email. Nothing is made up." /> : (
          <ul className="divide-y divide-sand-200">
            {list.rows.map((r) => (
              <li key={r.id} className="space-y-2 px-5 py-4 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-forest-900">{"★".repeat(r.rating ?? 0)}{"☆".repeat(5 - (r.rating ?? 0))}</span>
                  <Badge tone={TONE[r.status as keyof typeof TONE] ?? "mute"}>{LABEL[r.status as keyof typeof LABEL] ?? r.status}</Badge>
                  <span>{r.product_name || "Several lists"}</span>
                  <span className="text-xs">{r.submitted_at ? fmtDate(new Date(r.submitted_at * 1000)) : ""}</span>
                  <span className="font-mono text-xs">{r.order_id}</span>
                </div>
                {r.comment && <p className="whitespace-pre-wrap rounded-xl bg-sand-50 p-3">{r.comment}</p>}
                <p className="text-xs">Name to show: {r.display_name || "Verified buyer"}</p>
                {r.status !== "private" && (
                  <form action={moderateReviewAction} className="flex gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    {r.status !== "approved" && <Button name="to" value="approved" size="sm">Approve</Button>}
                    {r.status !== "hidden" && <Button name="to" value="hidden" size="sm" variant="secondary">Hide</Button>}
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
