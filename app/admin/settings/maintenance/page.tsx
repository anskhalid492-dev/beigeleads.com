import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { CheckButton, RefreshCachesButton } from "@/components/admin/check-button";
import { guardAdmin } from "@/lib/admin/guard";
import { cronHeartbeats, lastChecks } from "@/lib/settings/health";
import pkg from "@/package.json";

export const dynamic = "force-dynamic";
const ago = (t: number | null, max: number) => (t === null ? ["No heartbeat recorded yet", "warn"] as const : (Date.now() - t) / 60000 <= max ? [`${Math.round((Date.now() - t) / 60000)} min ago`, "good"] as const : [`${Math.round((Date.now() - t) / 60000)} min ago (late)`, "bad"] as const);

export default async function Maintenance() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  const [last, beat, h] = await Promise.all([lastChecks(env), cronHeartbeats(env), headers()]);
  const [m, ms] = ago(beat.minute, 12); const [sw, sws] = ago(beat.sweep, 35);
  const flags: [string, boolean][] = [["Checkout open (CHECKOUT_ENABLED)", env.CHECKOUT_ENABLED === "true"], ["Mainnet payments (MAINNET_ENABLED)", env.MAINNET_ENABLED === "true"]];
  return (
    <>
      <PageHeader title="Maintenance & Performance" text="Real checks and safe actions. No uptime or speed figures are shown because the site does not measure them." actions={<Link href="/admin/settings" className="text-sm underline">All settings</Link>} />
      <Panel title="This deployment">
        <dl className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-forest-900">Application version</dt><dd>{pkg.version} (package version)</dd></div>
          <div><dt className="font-semibold text-forest-900">Host</dt><dd>{h.get("host") ?? "unknown"}</dd></div>
          {flags.map(([l, on]) => <div key={l}><dt className="font-semibold text-forest-900">{l}</dt><dd><Badge tone={on ? "warn" : "mute"}>{on ? "On" : "Off"}</Badge></dd></div>)}
        </dl>
        <p className="border-t border-sand-200 px-5 py-3 text-xs">Deployment history and build logs are in Cloudflare (Workers & Pages, this Worker, Deployments). The site does not record the last deploy time itself.</p>
      </Panel>
      <Panel title="Scheduled jobs" className="mt-6">
        <ul className="divide-y divide-sand-200 text-sm">
          <li className="flex items-center justify-between px-5 py-3"><div><p className="font-semibold text-forest-900">Every minute: payments, delivery, scheduled articles</p><p className="text-xs">Last heartbeat: {m}</p></div><Badge tone={ms === "good" ? "good" : ms === "warn" ? "warn" : "bad"}>{ms === "good" ? "Running" : ms === "warn" ? "Unknown" : "Late"}</Badge></li>
          <li className="flex items-center justify-between px-5 py-3"><div><p className="font-semibold text-forest-900">Every 15 minutes: expire old payment quotes</p><p className="text-xs">Last heartbeat: {sw}</p></div><Badge tone={sws === "good" ? "good" : sws === "warn" ? "warn" : "bad"}>{sws === "good" ? "Running" : sws === "warn" ? "Unknown" : "Late"}</Badge></li>
        </ul>
        <p className="border-t border-sand-200 px-5 py-3 text-xs">Heartbeats are written every 5 minutes (KV free-plan write limit), so allow a few minutes of delay.</p>
      </Panel>
      <Panel title="Health checks" className="mt-6">
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          {([["d1", "Database"], ["kv", "Cache (KV)"], ["r2", "File storage (R2)"], ["resend", "Email service"]] as const).map(([id, l]) => <div key={id}><p className="mb-2 text-sm font-semibold text-forest-900">{l}</p><CheckButton id={id} initial={last[id] ?? null} label="Run check" /></div>)}
        </div>
        <p className="border-t border-sand-200 px-5 py-3 text-xs">The database check also lists any table whose migration has not been run. Recent application errors are not stored by the site; see Workers Observability logs in Cloudflare.</p>
      </Panel>
      <Panel title="Safe actions" className="mt-6">
        <div className="space-y-3 p-5"><RefreshCachesButton /><p className="text-xs">Clears the cached public and email settings and revalidates the sitemap and blog pages. Nothing is deleted. Blog pages also keep a 60-second edge cache.</p></div>
      </Panel>
    </>
  );
}
