"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { OPTIONS } from "@/lib/payments/options";
import { addWalletAction, type ActionState } from "./actions";

export function AddWalletForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(addWalletAction, null);
  const field = "mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-forest-900";
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-sand-200 bg-white p-6">
      <p className="rounded-xl bg-purple-100 p-3 text-sm text-forest-900">Public data only. Paste your receiving <b>address</b>. Customers pay straight into it. Never paste a seed phrase or a private key: they are rejected.</p>
      <label className="block text-sm font-semibold">Coin and network
        <select name="type" className={field} defaultValue="BTC:test">
          {Object.values(OPTIONS).flatMap((o) => [
            <option key={`${o.id}:test`} value={`${o.id}:test`}>{o.label}: TEST network</option>,
            <option key={`${o.id}:main`} value={`${o.id}:main`}>{o.label}: MAINNET (real money)</option>,
          ])}
        </select>
      </label>
      <label className="block text-sm font-semibold">Receiving address
        <input name="value" required autoComplete="off" spellCheck={false} className={`${field} font-mono text-sm`} />
      </label>
      <label className="block text-sm font-semibold">Minimum confirmations
        <input name="minConfirmations" type="number" min={1} max={100} defaultValue={2} className={field} />
      </label>
      <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add wallet"}</Button>
      {state && <p role="status" className={state.ok ? "text-forest-700" : "font-semibold text-red-700"}>{state.message}</p>}
    </form>
  );
}
