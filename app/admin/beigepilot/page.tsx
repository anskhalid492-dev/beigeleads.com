import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { PROVIDER_LABEL } from "@/lib/beigepilot/providers";
import { getSettings, listProviders, usageMonth, usageToday } from "@/lib/beigepilot/store";
import { BpNav } from "./nav";

export const dynamic = "force-dynamic";
const cost = (c: number | null, n: number) => (n === 0 ? "$0.00" : c === null ? "Set token prices" : `$${c.toFixed(2)}`);

export default async function BeigePilotOverview() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  const [{ ready, s }, provs, today, month] = await Promise.all([getSettings(env), listProviders(env), usageToday(env), usageMonth(env)]);
  let lastErr: { at: number; reason: string } | null = null;
  try { lastErr = await env.CACHE.get("beigepilot:lasterr", "json"); } catch { /* optional */ }
  const active = provs.find((p) => p.id === s.active);
  const live = ready && s.enabled && !!active?.hasKey && !!active.model;
  return (
    <>
      <PageHeader title="BeigePilot AI" text="Your AI data and audience specialist. It answers from your real catalog, help articles and policies, and never invents prices, counts or claims." />
      <BpNav here="/admin/beigepilot" />
      {!ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Run migration 0037 in D1 (3 statements, one at a time). Until then BeigePilot is off.</p>}
      {!env.BEIGEPILOT_KEY_SECRET && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">The secret <code>BEIGEPILOT_KEY_SECRET</code> is not set in Cloudflare. Provider keys cannot be saved without it.</p>}
      {lastErr && <p className="mb-5 max-w-3xl rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900"><strong>Last visitor chat failure</strong> ({new Date(lastErr.at).toLocaleString("en-US")}): {lastErr.reason}</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Status" value={live ? "Live" : "Off"} hint={live ? "Visitors see the chat widget." : "Not shown to visitors."} />
        <StatCard label="Active provider" value={active ? PROVIDER_LABEL[active.id] : "None"} hint={active?.model || "Choose one in AI Providers."} />
        <StatCard label="Requests today" value={today.requests} hint={`${today.errors} failed`} />
        <StatCard label="Estimated cost this month" value={cost(month.costUsd, month.tokensIn + month.tokensOut)} hint="From token counts and the prices you enter." />
      </div>
      <Panel title="Set-up checklist">
        <ol className="space-y-2 px-5 py-4 text-sm">
          {[
            ["Secret BEIGEPILOT_KEY_SECRET set", !!env.BEIGEPILOT_KEY_SECRET],
            ["Migration 0037 applied", ready],
            ["Provider key and model saved", provs.some((p) => p.hasKey && !!p.model)],
            ["Active provider chosen", !!active],
            ["BeigePilot switched on", ready && s.enabled],
          ].map(([t, ok]) => <li key={String(t)} className="flex items-center gap-3"><Badge tone={ok ? "good" : "warn"}>{ok ? "Done" : "To do"}</Badge>{t}</li>)}
        </ol>
        <p className="border-t border-sand-200 px-5 py-3 text-xs">Chat text is sent to the AI provider you choose. Conversations are not stored yet. Knowledge base, conversations, leads and analytics are coming in the next phases.</p>
      </Panel>
    </>
  );
}
