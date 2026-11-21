"use client";
import { useEffect, useState } from "react";
import { cartActions } from "@/lib/cart/client";

type Status = { status: string; reward?: boolean; submitUrl?: string | null; attempt: string | null; expiresAt: number | null };

const label: Record<string, { title: string; text: string }> = {
  pending: { title: "Waiting for payment", text: "We check the network every minute. You can close this page: we email you when the payment is confirmed." },
  paid: { title: "Payment confirmed", text: "Thank you. Your download link is being prepared and will be emailed to you (one link per list)." },
  expired: { title: "This quote has expired", text: "Do not send funds to this address. Start a new order to get a fresh price." },
  partial: { title: "Partial payment received", text: "We received less than the full amount. Contact us with your order number." },
  late_payment: { title: "Payment arrived after the quote expired", text: "We will review it manually and email you. Please contact us with your order number." },
  refunded: { title: "Refunded", text: "This order has been refunded." },
};

/** Countdown + status poll (every 12s). Only reads; never trusts the browser for payment state. */
export function CheckoutLive({ orderId, expiresAt, initial, slugs = [], bundles = [], verification = false, lists = true }: { orderId: string; expiresAt: number; initial: string; slugs?: string[]; bundles?: string[]; verification?: boolean; lists?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>({ status: initial, attempt: null, expiresAt });

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const load = async () => {
      try {
        const r = await fetch(`/api/checkout/${orderId}/status`, { cache: "no-store" });
        if (r.ok) setStatus((await r.json()) as Status);
      } catch { /* keep the last known state */ }
    };
    const poll = setInterval(load, 12_000);
    if (initial === "paid") void load(); // an already-paid order shows its submission link right away

    return () => { clearInterval(tick); clearInterval(poll); };
  }, [orderId, initial]);

  const left = now === null ? null : Math.max(0, Math.floor((expiresAt - now) / 1000));
  const effective = status.status === "pending" && left === 0 ? "expired" : status.status;
  // Real event for the popup system: the server says the order is paid (never the browser's guess).
  useEffect(() => {
    if (status.status !== "paid") return;
    window.dispatchEvent(new CustomEvent("bl:purchased"));
    for (const slug of slugs) cartActions.remove(slug); // the cart keeps its lists until payment is really confirmed
    for (const b of bundles) cartActions.removeBundle(b);
    if (verification) cartActions.setVerification(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.status]);
  const base = label[effective] ?? label.pending;
  const l = effective === "paid" && !lists ? { title: base.title, text: "Thank you. Submit your email list with the secure link below. We also emailed it to you." } : base;
  const mm = left === null ? "--" : String(Math.floor(left / 60)).padStart(2, "0");
  const ss = left === null ? "--" : String(left % 60).padStart(2, "0");
  return (
    <div role="status" aria-live="polite" className={`rounded-2xl border-2 p-5 ${effective === "paid" ? "border-forest-900 bg-forest-100" : "border-sand-300 bg-sand-50"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-bold text-forest-900">{l.title}</p>
        {effective === "pending" && <p className="font-mono text-2xl font-bold text-forest-900" aria-label="Time left on this price">{mm}:{ss}</p>}
      </div>
      <p className="mt-2 text-sm">{l.text}</p>
      {effective === "paid" && verification && (
        <div className="mt-3 rounded-xl border border-sand-200 bg-white p-4 text-sm">
          <p className="font-semibold text-forest-900">Email verification: submit your list</p>
          <p className="mt-1">{lists ? "Your database links are emailed separately. " : ""}Verification starts after you paste or upload your emails. It is done by our team and is not instant.</p>
          {status.submitUrl ? <a href={status.submitUrl} className="mt-3 inline-flex rounded-full bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-700">Submit Your List</a> : <p className="mt-2">Your secure submission link is being prepared. It will be emailed to you.</p>}
        </div>
      )}
      {effective === "paid" && status.reward && <p className="mt-2 text-sm font-semibold text-forest-900">Your next order is waiting: we emailed you a personal 50% OFF code for your next purchase.</p>}
    </div>
  );
}
