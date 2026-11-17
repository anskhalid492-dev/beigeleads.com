import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { isActive, listAudit, listWallets } from "@/lib/wallets/service";
import { mask } from "@/lib/wallets/validate";
import { AddWalletForm } from "./add-form";
import { toggleWalletAction } from "./actions";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function WalletsPage() {
  let admin;
  try { admin = await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const [wallets, audit] = await Promise.all([listWallets(), listAudit()]);
  return (
    <>
      <h1 className="display text-4xl text-forest-900">Payment wallets</h1>
      <p className="mt-2">Signed in as {admin.email}. New or re-enabled wallets go live 24 hours later. Every change is logged and emailed to the owner.</p>
      <form action={logoutAction} className="mt-3"><Button type="submit" variant="secondary" size="sm">Sign out</Button></form>
      <h2 className="mt-10 text-xl font-bold text-forest-900">Wallets</h2>
      <ul className="mt-3 space-y-3">
        {wallets.length === 0 && <li className="rounded-2xl border border-sand-200 bg-white p-5">No wallets yet.</li>}
        {wallets.map((w) => {
          const live = isActive(w);
          return (
            <li key={w.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sand-200 bg-white p-5">
              <div>
                <p className="font-bold text-forest-900">{w.coin} · {w.network} <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${live ? "bg-forest-100" : "bg-sand-200"}`}>{live ? "Live" : w.enabled ? `Starts ${w.activatesAt.toISOString().slice(0, 16).replace("T", " ")} UTC` : "Disabled"}</span></p>
                <p className="mt-1 font-mono text-sm">{mask(w.addressOrXpub)} · {w.minConfirmations} conf</p>
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
      <h2 className="mt-10 text-xl font-bold text-forest-900">Add a wallet</h2>
      <div className="mt-3"><AddWalletForm /></div>
      <h2 className="mt-10 text-xl font-bold text-forest-900">Audit log</h2>
      <ul className="mt-3 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white text-sm">
        {audit.map((a) => <li key={a.id} className="p-3">{a.createdAt.toISOString().slice(0, 16).replace("T", " ")} · {a.actor} · <b>{a.action}</b> {a.newValue}</li>)}
        {audit.length === 0 && <li className="p-3">Nothing yet.</li>}
      </ul>
    </>
  );
}
