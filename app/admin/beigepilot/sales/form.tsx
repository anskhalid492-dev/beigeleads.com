"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SalesAssistant } from "@/lib/beigepilot/store";
import { saveSettingsAction, type Result } from "../actions";

const inp = "mt-1 w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-forest-900";

function Switch({ name, label, hint, on, set }: { name: string; label: string; hint?: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 text-sm font-semibold text-forest-900">
      <input type="hidden" name={name} value="0" /><input type="checkbox" name={name} value="1" checked={on} onChange={(e) => set(e.target.checked)} className="mt-0.5 size-4 accent-purple-600" />
      <span>{label}{hint && <span className="block text-xs font-normal">{hint}</span>}</span>
    </label>
  );
}

export function SalesForm({ s }: { s: SalesAssistant }) {
  const [r, act, pending] = useActionState(saveSettingsAction, null as Result | null);
  const [v, setV] = useState(s);
  const up = <K extends keyof SalesAssistant>(k: K) => (x: SalesAssistant[K]) => setV((o) => ({ ...o, [k]: x }));
  return (
    <form action={act} className="grid gap-5 rounded-2xl border border-sand-200 bg-white p-5">
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-bold text-forest-900">Features</legend>
        <Switch name="saFinder" label="AI Database Finder" hint="Describe a database in words; the assistant searches the real catalog and shows product cards." on={v.finder} set={up("finder")} />
        <Switch name="saCart" label="Direct Add to Cart" hint="Cards have package buttons and Add to Cart. The visitor always presses the button; the server re-checks the package and price." on={v.cart} set={up("cart")} />
        <Switch name="saBudget" label="Budget-Based Suggestions" hint="Finds packages that fit a budget and can plan several databases within one total." on={v.budget} set={up("budget")} />
        <Switch name="saHandoff" label="Human Support Handoff" hint="Adds the Contact Support option and the support form with a ticket number. When off, the assistant points to the contact page instead." on={v.handoff} set={up("handoff")} />
      </fieldset>
      <fieldset className="grid gap-3 border-t border-sand-200 pt-4">
        <legend className="mb-1 text-sm font-bold text-forest-900">Catalog search behavior</legend>
        <label className="text-sm font-semibold text-forest-900">Maximum recommendations per answer (1 to 5)<input name="saMaxRecs" type="number" min="1" max="5" value={v.maxRecs} onChange={(e) => setV((o) => ({ ...o, maxRecs: Number(e.target.value) || 1 }))} className={`${inp} max-w-28`} /></label>
        <Switch name="saAlternatives" label="Show related alternatives" hint="When nothing matches exactly, show the closest real lists (and, for a budget, the cheapest list with how far over budget it is)." on={v.alternatives} set={up("alternatives")} />
        <Switch name="saVolume" label="Include Buy More, Save More in budget plans" hint="Only when that discount is switched on under Sales and the cart qualifies. The real cart still decides the final total." on={v.volume} set={up("volume")} />
        <Switch name="saUnavailable" label="Show products that are not for sale" hint="Off by default. They never get an Add to Cart button, only View Details and a free sample." on={v.unavailable} set={up("unavailable")} />
      </fieldset>
      <fieldset className="grid gap-3 border-t border-sand-200 pt-4">
        <legend className="mb-1 text-sm font-bold text-forest-900">Support requests</legend>
        <label className="text-sm font-semibold text-forest-900">Support notification email (optional)<input name="saSupportEmail" type="email" value={v.supportEmail} onChange={(e) => setV((o) => ({ ...o, supportEmail: e.target.value }))} className={inp} placeholder="Empty = the contact notification address from Email settings" /></label>
        <label className="text-sm font-semibold text-forest-900">Extra line in the customer confirmation (optional, max 400)<textarea name="saAckNote" rows={3} maxLength={400} value={v.ackNote} onChange={(e) => setV((o) => ({ ...o, ackNote: e.target.value }))} className={inp} placeholder="For example: You can also browse answers in our Help Center." />
          <span className="mt-1 block text-xs font-normal">The confirmation email says we received the request and shows the ticket number. Do not promise a response time here unless your team really keeps it.</span></label>
      </fieldset>
      <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Sales Assistant settings"}</Button>{r && <p role="status" className={`text-sm font-semibold ${r.ok ? "text-forest-700" : "text-red-700"}`}>{r.message}</p>}</div>
    </form>
  );
}
