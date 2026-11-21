import type { Metadata } from "next";
import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { publicOrder } from "@/lib/ev/customer";
import { loadEvSettings } from "@/lib/ev/settings";
import { evToken } from "@/lib/ev/token";
import { submitUrl } from "@/lib/ev/store";
import { ResultsAccess } from "@/components/email-verification/results-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Verification order status", robots: { index: false, follow: false }, referrer: "no-referrer" };

const date = (t: number | null) => (t ? new Date(t * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) : "Not yet");
export default async function OrderStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { env } = getCloudflareContext();
  const o = /^[0-9a-f]{48}$/.test(token) ? await publicOrder(env, token).catch(() => null) : null;
  const s = await loadEvSettings(env);
  return (
    <section className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6">
      <h1 className="display text-5xl text-forest-900 sm:text-6xl">Verification order status</h1>
      {!o ? <p role="alert" className="mt-6 rounded-2xl border border-sand-200 bg-white p-6">This order link is not valid. Use the link from your confirmation email.</p> : (
        <>
          <dl className="mt-6 grid gap-3 rounded-2xl border border-sand-200 bg-white p-5 text-sm sm:grid-cols-2">
            <div><dt className="text-forest-500">Order</dt><dd className="font-mono font-semibold text-forest-900">{o.view.id}</dd></div>
            <div><dt className="text-forest-500">Status</dt><dd className="font-semibold text-forest-900">{o.view.statusLabel}</dd></div>
            <div><dt className="text-forest-500">Package</dt><dd className="font-semibold text-forest-900">{o.view.packageName} · up to {o.view.limit.toLocaleString("en-US")} emails</dd></div>
            <div><dt className="text-forest-500">Emails submitted</dt><dd className="font-semibold text-forest-900">{o.view.submitted > 0 ? o.view.submitted.toLocaleString("en-US") : "None yet"}</dd></div>
            <div><dt className="text-forest-500">Ordered</dt><dd className="font-semibold text-forest-900">{date(o.view.createdAt)}</dd></div>
            <div><dt className="text-forest-500">List submitted</dt><dd className="font-semibold text-forest-900">{date(o.view.submittedAt)}</dd></div>
            <div><dt className="text-forest-500">Completed</dt><dd className="font-semibold text-forest-900">{date(o.view.completedAt)}</dd></div>
          </dl>
          {(o.view.status === "awaiting_file" || o.view.status === "needs_action") && (
            <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-5">
              {o.view.actionReason && <p className="mb-3 text-sm"><strong>Action required:</strong> {o.view.actionReason}</p>}
              <p className="text-sm">{o.view.status === "awaiting_file" ? "We are waiting for your list." : "Please submit a replacement list."}</p>
              <Link href={submitUrl((await evToken(env, o.ev.id))).replace("https://beigeleads.com", "")} className="mt-3 inline-flex rounded-full bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-700">Submit your list</Link>
            </div>
          )}
          {(o.view.status === "file_submitted" || o.view.status === "in_queue") && <p className="mt-6 rounded-2xl bg-sand-100 p-5 text-sm">Your list is queued for manual processing. We email you when work starts and when your results are ready. Verification is not instant.</p>}
          {o.view.status === "processing" && <p className="mt-6 rounded-2xl bg-sand-100 p-5 text-sm">Our team is verifying your list. We email you when your results are ready.</p>}
          {o.view.resultsReady && <ResultsAccess token={token} days={s.resultDownloadDays} />}
          {o.view.resultsExpired && <p className="mt-6 rounded-2xl border border-sand-200 bg-white p-5 text-sm">The download period for these results has ended. Contact support and quote {o.view.id}.</p>}
          {s.supportEmail && <p className="mt-6 text-sm">Questions? Email <a className="font-semibold underline" href={`mailto:${s.supportEmail}`}>{s.supportEmail}</a> and quote {o.view.id}.</p>}
        </>
      )}
    </section>
  );
}
