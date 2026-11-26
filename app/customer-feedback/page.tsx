import type { Metadata } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyOptout } from "@/lib/followups/tokens";
import { fitMeta } from "@/lib/seo/fit";
import { FOUNDER_PHOTO } from "@/lib/system-emails/brand";
import { FeedbackForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = fitMeta({ title: "Customer feedback", description: "Tell BeigeLeads how your experience was.", robots: { index: false, follow: false }, referrer: "no-referrer" });

export default async function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const e = s("e").toLowerCase(); const t = s("t");
  const ok = !!e && (await verifyOptout(getCloudflareContext().env, e, t));
  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-28">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={FOUNDER_PHOTO} alt="Anus, founder of BeigeLeads" width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
        <div><p className="font-semibold text-forest-900">Anus</p><p className="text-sm text-forest-500">Founder, BeigeLeads</p></div>
      </div>
      <h1 className="display mt-6 text-5xl text-forest-900">Your experience matters to me.</h1>
      <p className="mt-3 text-forest-700">Tell us what worked and what did not. I read every response. There is no reward for answering and nothing you write is published.</p>
      {ok ? <FeedbackForm email={e} token={t} orderId={s("o")} /> : <p role="alert" className="mt-8 rounded-xl bg-sand-100 p-4">This link is not valid. Use the feedback link from our email, or write to <a className="underline" href="mailto:hello@beigeleads.com">hello@beigeleads.com</a>.</p>}
    </main>
  );
}
