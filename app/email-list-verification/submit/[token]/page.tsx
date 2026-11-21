import type { Metadata } from "next";
import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDbFromEnv } from "@/lib/db";
import { loadEvSettings } from "@/lib/ev/settings";
import { LABEL, canUpload, isStatus } from "@/lib/ev/state";
import { acceptedTotal, filesOf, getEvByToken, linkExpired, statusUrl } from "@/lib/ev/store";
import { evToken } from "@/lib/ev/token";
import { SubmitForm } from "@/components/email-verification/submit-form";

import { fitMeta } from "@/lib/seo/fit";
export const dynamic = "force-dynamic";
const metadataRaw: Metadata = { title: "Submit your email list", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function SubmitPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { env } = getCloudflareContext();
  const ev = /^[0-9a-f]{48}$/.test(token) ? await getEvByToken(env, token).catch(() => null) : null;
  if (!ev) return <Shell><p role="alert" className="rounded-2xl border border-sand-200 bg-white p-6">This submission link is not valid. Check your confirmation email for the correct link.</p></Shell>;
  const s = await loadEvSettings(env);
  const files = (await filesOf(getDbFromEnv(env), ev.id)).filter((f) => f.kind === "original" && f.state === "accepted");
  const used = acceptedTotal(files);
  const paid = !!ev.paidAt && ev.status !== "awaiting_payment";
  const expired = linkExpired(ev, s);
  const open = paid && !expired && isStatus(ev.status) && canUpload(ev.status);
  const label = isStatus(ev.status) ? LABEL[ev.status] : ev.status;
  const dl = (await evToken(env, ev.id)) === token ? statusUrl(token).replace("https://beigeleads.com", "") : "";
  return (
    <Shell>
      <dl className="mt-6 grid gap-3 rounded-2xl border border-sand-200 bg-white p-5 text-sm sm:grid-cols-2">
        <div><dt className="text-forest-500">Order</dt><dd className="font-mono font-semibold text-forest-900">{ev.id}</dd></div>
        <div><dt className="text-forest-500">Status</dt><dd className="font-semibold text-forest-900">{label}</dd></div>
        <div><dt className="text-forest-500">Package</dt><dd className="font-semibold text-forest-900">{ev.packageName}</dd></div>
        <div><dt className="text-forest-500">Maximum emails</dt><dd className="font-semibold text-forest-900">{ev.limitCount.toLocaleString("en-US")}</dd></div>
        <div><dt className="text-forest-500">Accepted formats</dt><dd className="font-semibold text-forest-900">{s.formats.map((f) => f.toUpperCase()).join(", ")}</dd></div>
        <div><dt className="text-forest-500">Maximum file size</dt><dd className="font-semibold text-forest-900">{s.maxUploadMb} MB (spreadsheets up to 50 MB)</dd></div>
      </dl>
      {!paid && <p role="status" className="mt-6 rounded-2xl border border-sand-300 bg-sand-100 p-5">Your payment is not confirmed yet. This page unlocks as soon as it is, and we email you. You can close this page and come back to this link.</p>}
      {paid && expired && <p role="alert" className="mt-6 rounded-2xl border border-sand-300 bg-white p-5">This submission link has expired. Contact support and quote order {ev.id}.</p>}
      {paid && !expired && !open && <p role="status" className="mt-6 rounded-2xl border border-sand-200 bg-white p-5">{ev.status === "cancelled" || ev.status === "refunded" ? "This order is closed." : "Your list is with our team. You can follow progress on your order status page."}</p>}
      {open && <SubmitForm token={token} limit={ev.limitCount} used={used} accepted={files.map((f) => ({ name: f.filename, count: f.entryCount }))} formats={s.formats} maxMb={s.maxUploadMb} replace={ev.status === "needs_action"} reason={ev.status === "needs_action" ? ev.actionReason : ""} support={s.supportEmail} />}
      {dl && <p className="mt-6 text-sm"><Link href={dl} className="font-semibold text-forest-700 underline">Open your order status page</Link></p>}
      <p className="mt-8 text-xs">Your list is stored privately and only used for this verification. Original files are deleted {s.retainOriginalDays} days after the job is completed; result files {s.retainResultDays} days after delivery.</p>
    </Shell>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6"><h1 className="display text-5xl text-forest-900 sm:text-6xl">Submit your email list</h1><p className="mt-3 max-w-2xl text-lg">Upload a file or paste your emails. Our team verifies the list by hand, so results are not instant.</p>{children}</section>;
}

export const metadata: Metadata = fitMeta(metadataRaw);
