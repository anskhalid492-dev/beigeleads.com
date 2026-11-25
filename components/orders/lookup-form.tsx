"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { LookupView } from "@/lib/orders/lookup";

type Res = { ok: boolean; error?: string; order?: LookupView; resent?: "sent" | "limit" | "failed" };
const input = "w-full rounded-lg border border-sand-300 bg-white px-4 py-3 text-base text-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

/** Shared by /order-lookup and the Pilo chat. The order number and email go straight from this form to our API: they are never part of the chat. */
export function OrderLookupForm({ compact = false, initialId = "" }: { compact?: boolean; initialId?: string }) {
  const [id, setId] = useState(initialId);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Res | null>(null);
  async function go(resend = false) {
    setBusy(true);
    try {
      const r = await fetch("/api/order-lookup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: id, email, resend }) });
      setRes((await r.json()) as Res);
    } catch { setRes({ ok: false, error: "Could not reach the server. Check your connection and try again." }); }
    setBusy(false);
  }
  const o = res?.ok ? res.order : undefined;
  return (
    <div className={compact ? "space-y-2.5" : "space-y-4"}>
      <form onSubmit={(e) => { e.preventDefault(); void go(false); }} className={compact ? "space-y-2.5" : "space-y-4"} autoComplete="off">
        <div>
          <label htmlFor="ol-id" className="mb-1 block text-sm font-semibold text-forest-900">Order number</label>
          <input id="ol-id" value={id} onChange={(e) => setId(e.target.value)} required className={input} placeholder="From your confirmation email" />
        </div>
        <div>
          <label htmlFor="ol-email" className="mb-1 block text-sm font-semibold text-forest-900">Email used at checkout</label>
          <input id="ol-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={input} autoComplete="email" />
        </div>
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Checking..." : "Check my order"}</Button>
      </form>
      {res && !res.ok && <p role="alert" className="rounded-lg border border-forest-900 bg-sand-100 px-4 py-3 text-sm font-medium text-forest-900">{res.error}</p>}
      {o && (
        <div role="status" className="rounded-2xl border border-sand-200 bg-white p-4 text-sm text-forest-900">
          <p className="text-base font-semibold">{o.statusLabel}</p>
          <p className="mt-1">{o.detail}</p>
          <ul className="mt-3 list-disc space-y-0.5 pl-5">{o.items.map((x) => <li key={x}>{x}</li>)}</ul>
          <p className="mt-3 font-mono text-xs text-forest-500">Order {o.id}</p>
          {o.payUrl && <p className="mt-3"><Link className="font-semibold underline" href={o.payUrl}>Open the payment page</Link></p>}
          {o.canResend && (
            <div className="mt-3 border-t border-sand-200 pt-3">
              <p>Cannot find the delivery email?</p>
              <Button type="button" variant="secondary" size="sm" disabled={busy} className="mt-2" onClick={() => void go(true)}>Send it again to the order email</Button>
              {res?.resent === "sent" && <p className="mt-2 font-semibold">Sent to the address on the order. Check your spam folder too.</p>}
              {res?.resent === "limit" && <p className="mt-2">You already asked for this twice today. Please <Link className="underline" href="/contact">contact us</Link>.</p>}
              {res?.resent === "failed" && <p className="mt-2">We could not send it just now. Please <Link className="underline" href="/contact">contact us</Link> with your order number.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
