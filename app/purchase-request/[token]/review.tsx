"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ManagerView } from "@/lib/sales/team";

const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (s: number) => new Date(s * 1000).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
const inp = "w-full rounded-lg border border-sand-300 bg-white px-4 py-3 text-base text-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

export function ManagerReview({ token, options }: { token: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [view, setView] = useState<ManagerView | null>(null);
  const [coin, setCoin] = useState("");
  const [reason, setReason] = useState("");
  const [seen, setSeen] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [declined, setDeclined] = useState(false);

  async function call(body: Record<string, unknown>) {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/purchase-request/manager", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, email, ...body }) });
      return (await r.json()) as Record<string, unknown> & { ok?: boolean; error?: string };
    } catch { return { ok: false, error: "Could not reach the server. Check your connection and try again." }; } finally { setBusy(false); }
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const d = await call({ action: "verify" });
    if (d.ok) { const v = d.view as ManagerView; setView(v); setSeen(v.currentCents); } else setMsg(d.error ?? "Could not verify.");
  }
  async function approve() {
    if (!coin) { setMsg("Choose how you want to pay."); return; }
    const d = await call({ action: "approve", coin, seenTotalCents: seen });
    if (d.ok) { router.push(`/checkout/${d.orderId as string}`); return; }
    if (typeof d.changedTotalCents === "number") { setSeen(d.changedTotalCents); setView((v) => (v ? { ...v, currentCents: d.changedTotalCents as number } : v)); }
    setMsg(d.error ?? "Could not approve.");
  }
  async function decline() {
    const d = await call({ action: "decline", reason });
    if (d.ok) setDeclined(true); else setMsg(d.error ?? "Could not decline.");
  }

  if (!view) {
    return (
      <form onSubmit={verify} className="mt-6 space-y-4 rounded-2xl border border-sand-200 bg-white p-6">
        <p>Confirm your email address to review this request. It must be the address the request was sent to.</p>
        <label className="block text-sm font-semibold text-forest-900">Your email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inp} mt-1.5 font-normal`} /></label>
        <Button type="submit" disabled={busy}>{busy ? "Checking…" : "Review request"}</Button>
        {msg && <p role="alert" className="text-sm font-medium text-red-800">{msg}</p>}
      </form>
    );
  }
  if (declined) return <p role="status" className="mt-6 rounded-2xl border-2 border-forest-900 bg-forest-100 p-6">You declined this request. {view.requesterName} will be told.</p>;
  const open = view.status === "viewed" || view.status === "pending";
  const closed: Record<string, string> = { approved: "This request was approved and the payment is open.", paid: "This request is paid. Thank you.", declined: "This request was declined.", expired: "This request expired. Ask the team member to send a new one.", cancelled: "This request was cancelled." };
  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-2xl border border-sand-200 bg-white p-6">
        <p><strong className="text-forest-900">{view.requesterName}</strong> asks you to approve and pay for these databases.</p>
        <ul className="mt-4 divide-y divide-sand-200 text-sm">
          {view.items.map((i) => <li key={i.slug} className="flex justify-between gap-3 py-2"><span>{i.name} <span className="text-forest-500">· {i.pkg}</span></span><span className="font-semibold text-forest-900">{usd(i.cents)}</span></li>)}
        </ul>
        <p className="mt-3 flex justify-between border-t border-sand-200 pt-3 font-bold text-forest-900"><span>Total today</span><span>{usd(view.currentCents)}</span></p>
        {view.currentCents !== view.snapshotCents && <p className="mt-2 text-sm">The price changed since the request was made ({usd(view.snapshotCents)}). You pay the current total shown above.</p>}
        {view.note && <p className="mt-4 rounded-xl bg-sand-100 p-3 text-sm"><span className="font-semibold text-forest-900">Note:</span> {view.note}</p>}
        <p className="mt-4 text-xs">Valid until {day(view.expiresAt)}. One-time purchase, no subscription. You pay in crypto and receive the download links by email.</p>
      </div>
      {open ? (
        <div className="space-y-4 rounded-2xl border border-sand-200 bg-white p-6">
          <label className="block text-sm font-semibold text-forest-900">Pay with
            <select value={coin} onChange={(e) => setCoin(e.target.value)} className={`${inp} mt-1.5 font-normal`}><option value="">Choose one</option>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          </label>
          <Button type="button" size="lg" className="w-full" onClick={approve} disabled={busy}>{busy ? "Working…" : "Approve & Pay"}</Button>
          <p className="text-xs">You are taken to the normal checkout. The request counts as paid only after the network confirms your payment.</p>
          <details className="border-t border-sand-200 pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-forest-900">Decline this request</summary>
            <label className="mt-3 block text-sm">Reason (optional, shared with {view.requesterName})<textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} className={`${inp} mt-1.5`} /></label>
            <Button type="button" variant="secondary" className="mt-3" onClick={decline} disabled={busy}>Decline request</Button>
          </details>
        </div>
      ) : <p role="status" className="rounded-2xl border border-sand-200 bg-white p-6">{closed[view.status] ?? "This request is closed."}{view.declineReason ? ` Reason: ${view.declineReason}` : ""}</p>}
      {msg && <p role="alert" className="text-sm font-medium text-red-800">{msg}</p>}
    </div>
  );
}
