import type { Metadata } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { OPTIONS } from "@/lib/payments/options";
import { requestExists } from "@/lib/sales/team";
import { ManagerReview } from "./review";

import { fitMeta } from "@/lib/seo/fit";
export const dynamic = "force-dynamic";
const metadataRaw: Metadata = { title: "Purchase request", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function PurchaseRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ok = await requestExists(getCloudflareContext().env, token);
  return (
    <section className="mx-auto max-w-2xl px-4 pb-24 pt-12">
      <h1 className="display text-5xl text-forest-900 sm:text-6xl">Purchase request</h1>
      {ok ? <ManagerReview token={token} options={Object.values(OPTIONS).map((o) => ({ value: o.id, label: o.label }))} />
        : <p role="alert" className="mt-6 rounded-2xl border border-sand-200 bg-white p-6">This request link is not valid, or a newer email replaced it. Check your inbox for the latest message about this request.</p>}
    </section>
  );
}

export const metadata: Metadata = fitMeta(metadataRaw);
