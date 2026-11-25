import type { Metadata } from "next";
import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ApiForm } from "@/components/forms/api-form";
import { reviewByToken } from "@/lib/followups/reviews";
import { fitMeta } from "@/lib/seo/fit";

export const dynamic = "force-dynamic";
const metadataRaw: Metadata = { title: "How was your list?", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const metadata: Metadata = fitMeta(metadataRaw);

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await reviewByToken(getCloudflareContext().env, token);
  const usable = row && row.status === "requested";
  return (
    <main className="mx-auto max-w-xl px-4 pb-24 pt-12 sm:px-6">
      <h1 className="display text-5xl text-forest-900 sm:text-6xl">How was your list?</h1>
      {!row || row.status === "skipped" || row.status === "not_sent" ? (
        <p role="alert" className="mt-6 rounded-2xl border border-sand-200 bg-white p-6">This link is not valid. Use the link from your latest email.</p>
      ) : !usable ? (
        <p role="status" className="mt-6 rounded-2xl border border-sand-200 bg-white p-6">You already sent your answer for this order. Thank you.</p>
      ) : (
        <>
          <p className="mt-4 text-forest-700">{row.product_name ? <>You bought <strong>{row.product_name}</strong>. </> : null}Rate it from 1 (poor) to 5 (excellent) and add a comment if you like. Your answer is private unless you tick the box below.</p>
          <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-6">
            <ApiForm
              endpoint="/api/review"
              hidden={{ token }}
              submitLabel="Send my review"
              successTitle="Thank you"
              successText="We received your answer. It helps us and the buyers who come after you."
              fields={[
                { name: "rating", label: "Your rating", type: "select", required: true, options: [{ value: "5", label: "5 - Excellent" }, { value: "4", label: "4 - Good" }, { value: "3", label: "3 - Okay" }, { value: "2", label: "2 - Poor" }, { value: "1", label: "1 - Very poor" }] },
                { name: "comment", label: "Your comment", type: "textarea", placeholder: "What worked, and what did not?" },
                { name: "allowPublic", label: "You may show my rating and comment on the BeigeLeads website. It is shown only after our team approves it, and your words are not edited.", type: "checkbox" },
                { name: "displayName", label: "Name to show (first name or company; leave empty to show \"Verified buyer\")", type: "text" },
              ]}
            />
          </div>
          <p className="mt-4 text-sm text-forest-500">Problem with your list, such as bounced emails? Do not use this form: see <Link className="underline" href="/legal/refund-replacement">the replacement policy</Link> or <Link className="underline" href="/contact">contact us</Link>.</p>
        </>
      )}
    </main>
  );
}
