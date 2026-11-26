import type { Metadata } from "next";
import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyOptout } from "@/lib/followups/tokens";
import { loadPrefs } from "@/lib/founder/data";
import { fitMeta } from "@/lib/seo/fit";
import { PrefsForm } from "./prefs-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = fitMeta({ title: "Email preferences", robots: { index: false, follow: false }, referrer: "no-referrer" });

export default async function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const e = typeof sp.e === "string" ? sp.e.toLowerCase() : "";
  const t = typeof sp.t === "string" ? sp.t : "";
  const env = getCloudflareContext().env;
  const ok = !!e && (await verifyOptout(env, e, t));
  const prefs = ok ? await loadPrefs(env, e) : null;
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <h1 className="display text-5xl text-forest-900">Email preferences</h1>
      <p className="mt-3 mb-6">Choose which emails BeigeLeads sends to <strong>{ok ? e : "this address"}</strong>. You will always get emails about orders you place, such as receipts and delivery, and replies to requests you make. To be removed from our data, use <Link className="underline" href="/opt-out">the opt-out page</Link>.</p>
      {ok && prefs ? <PrefsForm email={e} token={t} initial={prefs} unsubscribeIntent={sp.u === "1"} /> : <p role="alert">This link is not valid. Use the link from your email.</p>}
    </main>
  );
}
