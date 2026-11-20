import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { PROVIDER_IDS, PROVIDER_LABEL } from "@/lib/beigepilot/providers";
import { getSettings, listProviders } from "@/lib/beigepilot/store";
import { BpNav } from "../nav";
import { ProviderCard, RoutingForm } from "./forms";

export const dynamic = "force-dynamic";
export default async function ProvidersPage() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  const [{ s }, provs] = await Promise.all([getSettings(env), listProviders(env)]);
  return (
    <>
      <PageHeader title="AI Providers" text="Keys are encrypted before they are stored and are never shown again. The chat is sent to the provider you choose." />
      <BpNav here="/admin/beigepilot/providers" />
      {!env.BEIGEPILOT_KEY_SECRET && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Set the secret <code>BEIGEPILOT_KEY_SECRET</code> (32+ random characters) in Cloudflare, then redeploy, before saving keys.</p>}
      <div className="grid gap-5 xl:grid-cols-2">{provs.map((p) => <ProviderCard key={p.id} p={p} label={PROVIDER_LABEL[p.id]} />)}</div>
      <h2 className="display mb-3 mt-8 text-2xl text-forest-900">Routing and limits</h2>
      <RoutingForm active={s.active} fallback={s.fallback} ids={PROVIDER_IDS.map((id) => ({ id, label: PROVIDER_LABEL[id] }))} daily={s.dailyRequestLimit} tokens={s.dailyTokenLimit} spend={s.monthlySpendUsd} />
    </>
  );
}
