import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { isActive, listAudit, listWallets } from "@/lib/wallets/service";
import { mask } from "@/lib/wallets/validate";
import { AddWalletForm } from "./add-form";
import { toggleWalletAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function WalletsPage() {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const [wallets, audit] = await Promise.all([listWallets(), listAudit()]);
  return (
    <>
      <PageHeader title="Payments & wallets" text="Customers pay straight into these public receiving addresses. New or re-enabled wallets go live 24 hours later. Every change is logged and emailed to the owner." />
      <Panel title="Receiving wallets">
        {wallets.length === 0 ? <Empty title="No wallets yet" text="Add a receiving address below." /> : (
          <ul className="divide-y divide-sand-200">
            {wallets.map((w) => {
              const live = isActive(w);
              return (
                <li key={w.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-bold text-forest-900">{w.coin} · {w.network} <Badge tone={live ? "good" : w.enabled ? "warn" : "mute"}>{live ? "Live" : w.enabled ? `Starts ${fmtDate(w.activatesAt)}` : "Disabled"}</Badge></p>
                    <p className="mt-1 font-mono text-sm">{mask(w.addressOrXpub)} · {w.minConfirmations} confirmations</p>
                  </div>
                  <form action={toggleWalletAction}>
                    <input type="hidden" name="id" value={w.id} />
                    <input type="hidden" name="enabled" value={w.enabled ? "0" : "1"} />
                    <Button type="submit" variant="secondary" size="sm">{w.enabled ? "Disable now" : "Enable (24h delay)"}</Button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <h2 className="mb-3 mt-8 text-lg font-bold text-forest-900">Add a wallet</h2>
      <AddWalletForm />
      <Panel title="Audit log" className="mt-8">
        {audit.length === 0 ? <Empty title="Nothing yet" /> : (
          <ul className="divide-y divide-sand-200 text-sm">
            {audit.map((a) => <li key={a.id} className="px-5 py-3">{fmtDate(a.createdAt)} · {a.actor} · <b>{a.action}</b> {a.newValue}</li>)}
          </ul>
        )}
      </Panel>
    </>
  );
}
