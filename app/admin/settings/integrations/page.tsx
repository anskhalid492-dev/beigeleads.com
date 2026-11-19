import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { CheckButton } from "@/components/admin/check-button";
import { guardAdmin } from "@/lib/admin/guard";
import { cronHeartbeats, lastChecks } from "@/lib/settings/health";

export const dynamic = "force-dynamic";
const ago = (t: number | null) => (t ? `${Math.max(0, Math.round((Date.now() - t) / 60000))} min ago` : "no heartbeat recorded yet");

export default async function Integrations() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  const [last, beat] = await Promise.all([lastChecks(env), cronHeartbeats(env)]);
  const siteKey = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  type Row = { id: string; name: string; purpose: string; configured: boolean; note?: string; doc: string; testable: boolean };
  const rows: Row[] = [
    { id: "d1", name: "Cloudflare D1", purpose: "The database: orders, requests, blog, settings.", configured: !!env.DB, doc: "https://developers.cloudflare.com/d1/", testable: true },
    { id: "kv", name: "Cloudflare KV", purpose: "Caches, rate limits and short-lived flags.", configured: !!env.CACHE, doc: "https://developers.cloudflare.com/kv/", testable: true },
    { id: "r2", name: "Cloudflare R2", purpose: "Blog article bodies and uploaded images.", configured: !!env.LISTS, doc: "https://developers.cloudflare.com/r2/", testable: true },
    { id: "turnstile", name: "Cloudflare Turnstile", purpose: "Bot protection on public forms.", configured: !!env.TURNSTILE_SECRET_KEY, note: siteKey ? "Public site key is built into the site." : "No public site key at build time: forms use Cloudflare's test key.", doc: "https://developers.cloudflare.com/turnstile/", testable: true },
    { id: "access", name: "Cloudflare Access", purpose: "First sign-in layer for every admin page.", configured: !!env.ACCESS_TEAM_DOMAIN && !!env.ACCESS_AUD, doc: "https://developers.cloudflare.com/cloudflare-one/policies/access/", testable: true },
    { id: "resend", name: "Resend", purpose: "Transactional email (delivery, confirmations, alerts).", configured: !!env.RESEND_API_KEY, doc: "https://resend.com/docs", testable: true },
    { id: "payments", name: "Payment monitoring", purpose: "Checks the blockchain for payments every minute (mempool.space, TronGrid, Blockscout).", configured: true, note: `Scheduled job last heartbeat: ${ago(beat.minute)}. Heartbeats are written every 5 minutes.`, doc: "https://developers.cloudflare.com/workers/configuration/cron-triggers/", testable: false },
    { id: "gsc", name: "Google Search Console", purpose: "Search performance data from Google.", configured: false, note: "Not connected. Setup steps are in the SEO section.", doc: "https://search.google.com/search-console/about", testable: false },
  ];
  return (
    <>
      <PageHeader title="Integrations" text="Whether each connected service is set up, and whether a real test just worked. “Configured” only means a setting exists; run the test to verify." actions={<Link href="/admin/settings" className="text-sm underline">All settings</Link>} />
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((r) => (
          <Panel key={r.id}>
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-forest-900">{r.name}</h2><p className="text-sm">{r.purpose}</p></div><Badge tone={r.configured ? "good" : "warn"}>{r.configured ? "Configured" : "Not configured"}</Badge></div>
              {r.note && <p className="text-xs">{r.note}</p>}
              {r.testable && r.configured && <CheckButton id={r.id} initial={last[r.id as keyof typeof last] ?? null} />}
              {r.testable && !r.configured && <p className="text-xs">Set it up in Cloudflare (Settings, Variables and Secrets), then test.</p>}
              <a href={r.doc} target="_blank" rel="noopener noreferrer" className="text-xs underline">Documentation</a>
            </div>
          </Panel>
        ))}
      </div>
      <p className="mt-6 text-xs">Secrets are never shown here. They live in Cloudflare; this page only reports whether each one is set.</p>
    </>
  );
}
