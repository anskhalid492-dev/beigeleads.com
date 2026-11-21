"use client";
// "Special BeigePilot Offer" card. The percentage comes from the server; "Apply My Discount" asks the server again and shows success only
// after it confirms. There is no countdown and no scarcity: only the real validity time.
import Link from "next/link";
import { useState } from "react";
import { Check, Sparkles, TriangleAlert } from "lucide-react";
import { useCart } from "@/lib/cart/client";
import { writePartner } from "@/lib/cart/partner";
import type { OfferCard as Offer } from "@/lib/beigepilot/tools";
import { t, type Lang } from "@/lib/beigepilot/v2/lang";
import { trackPilo } from "@/lib/beigepilot/v2/track";

const formatUsdCents = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
type Done = { discountCents: number; totalCents: number; percent: number };
export function OfferCardView({ o, cid, lang, onApplied }: { o: Offer; cid: string; lang: Lang; onApplied?: () => void }) {
  const cart = useCart();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const until = new Date(o.expiresAt * 1000).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  async function apply() {
    if (state === "busy") return;
    setState("busy"); setMsg("");
    try {
      const r = await fetch("/api/beigepilot/offer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cid, offerId: o.offerId, cart }) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; code?: string; percent?: number; discountCents?: number; totalCents?: number; message?: string };
      if (r.ok && j.ok && j.code) {
        writePartner({ code: j.code, email: "" });
        window.dispatchEvent(new Event("bl:partner-changed"));
        setDone({ discountCents: j.discountCents ?? 0, totalCents: j.totalCents ?? 0, percent: j.percent ?? o.percent });
        setState("done"); onApplied?.();
        trackPilo(cid, "offer_accepted", String(j.percent ?? o.percent));
      } else { setState("error"); setMsg(j.message ?? "We couldn't apply the offer."); }
    } catch { setState("error"); setMsg("We couldn't reach the server. Please try again."); }
  }

  return (
    <div className="bp-msg overflow-hidden rounded-2xl border border-purple-600/30 bg-white shadow-[0_10px_26px_-18px_rgba(124,58,237,.7)]" role="group" aria-label={t(lang, "offerTitle")}>
      <div className="flex items-center gap-3 bg-purple-100 px-3.5 py-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-purple-600 text-white"><Sparkles className="size-4" aria-hidden /></span>
        <p className="text-[0.85rem] font-bold text-forest-900">{t(lang, "offerTitle")}</p>
      </div>
      <div className="px-3.5 py-3">
        <p className="display text-[2.2rem] leading-none text-forest-900">{o.percent}% OFF</p>
        <p className="mt-1.5 text-xs text-forest-700">{o.eligible.length ? `${o.eligible.join(", ")}` : ""}</p>
        {o.excluded.length > 0 && <p className="mt-1 text-xs text-forest-700">Not included: {o.excluded.join(", ")}</p>}
        <p className="mt-1 text-xs text-forest-700">Single use, valid until {until}. {t(lang, "offerNote")}</p>
        {state === "done" && done ? (
          <div className="mt-3 rounded-xl bg-forest-100 p-2.5 text-[0.82rem] text-forest-900" role="status">
            <p className="flex items-center gap-1.5 font-bold"><Check className="size-4" aria-hidden />{done.percent}% applied. You save {formatUsdCents(done.discountCents)}.</p>
            <p className="mt-0.5">New total: <strong>{formatUsdCents(done.totalCents)}</strong>. <Link href="/cart" className="font-semibold text-purple-700 underline">View cart</Link></p>
          </div>
        ) : (
          <button type="button" onClick={apply} disabled={state === "busy"} className="mt-3 w-full rounded-full bg-purple-600 px-4 py-2.5 text-[0.88rem] font-bold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-70">
            {state === "busy" ? "…" : t(lang, "applyOffer")}
          </button>
        )}
        {state === "error" && <p className="mt-2 flex items-start gap-1.5 text-xs text-forest-900" role="alert"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />{msg}</p>}
      </div>
    </div>
  );
}
