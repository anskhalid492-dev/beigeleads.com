import type { Metadata } from "next";
import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { TokenButton } from "@/app/newsletter/token-button";
import { verifyOptout } from "@/lib/followups/tokens";
import { fitMeta } from "@/lib/seo/fit";
import { optOutAction } from "./actions";

export const dynamic = "force-dynamic";
const metadataRaw: Metadata = { title: "Email preferences", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const metadata: Metadata = fitMeta(metadataRaw);

export default async function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const e = typeof sp.e === "string" ? sp.e : "";
  const t = typeof sp.t === "string" ? sp.t : "";
  const ok = !!e && (await verifyOptout(getCloudflareContext().env, e.toLowerCase(), t));
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <h1 className="display text-5xl text-forest-900">Email preferences</h1>
      <p className="mt-3 mb-6">Press the button to stop BeigeLeads review requests and sample follow-ups to <strong>{ok ? e : "this address"}</strong>. You will still get emails about orders you place, such as receipts and delivery. To be removed from our data, use <Link className="underline" href="/opt-out">the opt-out page</Link>.</p>
      {ok ? <TokenButton token={t} action={(tok) => optOutAction(e, tok)} label="Stop these emails" done="Done. We will not send review requests or sample follow-ups to this address." /> : <p role="alert">This link is not valid. Use the link from your email.</p>}
    </main>
  );
}
