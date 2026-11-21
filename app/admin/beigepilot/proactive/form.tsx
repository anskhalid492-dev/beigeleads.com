"use client";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProBubble } from "@/components/beigepilot/proactive-bubble";
import { PAGE_KINDS, PAGE_LABELS, VARS, checkDelays, checkTemplate, fill, type ProSettings, type Template } from "@/lib/beigepilot/proactive/types";
import { saveProAction } from "./actions";

const inp = "mt-1 w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-forest-900";
const SAMPLE = { product_name: "Dentist Email List", other_product: "Restaurant Email List", search_term: "dentists in Texas", country: "United States", industry: "Dentists", cart_items: "2 lists" };
const KIND_LABEL: Record<string, string> = { default: "Any page (fallback)", product: "Product page", multi: "Several products viewed", cart: "Cart has items", search: "Search term", budget: "Budget talk", industry: "Industry / category", healthcare: "Healthcare", realestate: "Real estate", country: "Country", usa: "United States" };

export function ProactiveForm({ initial, name }: { initial: ProSettings; name: string }) {
  const [r, act, pending] = useActionState(saveProAction, null);
  const [s, setS] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const setT = (id: string, p: Partial<Template>) => setS((x) => ({ ...x, templates: x.templates.map((t) => (t.id === id ? { ...t, ...p } : t)) }));
  const delayErr = checkDelays(s.delays);
  const errs = useMemo(() => Object.fromEntries(s.templates.map((t) => [t.id, checkTemplate(t)])), [s.templates]);
  const anyErr = !!delayErr || Object.values(errs).some(Boolean);
  const prev = s.templates.find((t) => t.id === open);
  const sw = "mt-0.5 size-4 accent-purple-600";
  return (
    <form action={act} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(s)} />
      <section className="rounded-2xl border border-sand-200 bg-white p-5">
        <h2 className="text-lg font-bold text-forest-900">Timing and visibility</h2>
        <p className="mt-1 text-sm text-forest-700">At most 3 messages per visit. Delays count only the time the tab is visible. A visitor who dismisses, clicks, or starts chatting gets no further messages.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <label key={i} className="text-sm font-semibold text-forest-900">Message {i + 1} appears after (seconds)<input type="number" min={0} max={3600} value={s.delays[i]} onChange={(e) => setS((x) => { const d = [...x.delays] as ProSettings["delays"]; d[i] = Number(e.target.value); return { ...x, delays: d }; })} className={inp} /></label>)}
        </div>
        {delayErr && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{delayErr}</p>}
        <label className="mt-4 block max-w-xs text-sm font-semibold text-forest-900">A bubble hides by itself after (seconds)<input type="number" min={8} max={60} value={s.bubbleSeconds} onChange={(e) => setS({ ...s, bubbleSeconds: Number(e.target.value) })} className={inp} /></label>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <label className="flex items-start gap-2 text-sm font-semibold text-forest-900"><input type="checkbox" className={sw} checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} />Proactive messages on</label>
          <label className="flex items-start gap-2 text-sm font-semibold text-forest-900"><input type="checkbox" className={sw} checked={s.cartMessages} onChange={(e) => setS({ ...s, cartMessages: e.target.checked })} />Cart messages (and bubbles on the cart page)</label>
          <label className="flex items-start gap-2 text-sm font-semibold text-forest-900"><input type="checkbox" className={sw} checked={s.mobile} onChange={(e) => setS({ ...s, mobile: e.target.checked })} />Show on phones</label>
        </div>
        <fieldset className="mt-4"><legend className="text-sm font-semibold text-forest-900">Pages that may show a message</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">{PAGE_KINDS.map((k) => <label key={k} className="flex items-center gap-2 text-sm text-forest-900"><input type="checkbox" className="size-4 accent-purple-600" checked={s.pages[k]} onChange={(e) => setS({ ...s, pages: { ...s.pages, [k]: e.target.checked } })} />{PAGE_LABELS[k]}</label>)}</div>
          <p className="mt-2 text-xs text-forest-700">Checkout and the admin never show messages.</p></fieldset>
      </section>

      <section className="rounded-2xl border border-sand-200 bg-white p-5">
        <h2 className="text-lg font-bold text-forest-900">Message templates</h2>
        <p className="mt-1 text-sm text-forest-700">For each message, the first template that fits the visitor&apos;s real context is used (product page, then cart, search, industry, country, products viewed, fallback). A template is skipped when a variable it uses is not known. Variables: {VARS.map((v) => <code key={v} className="mr-1 rounded bg-sand-100 px-1">{`{${v}}`}</code>)}. No discounts, urgency or exit-intent wording is accepted.</p>
        <div className="mt-4 space-y-5">
          {[1, 2, 3].map((st) => (
            <div key={st}><h3 className="font-bold text-forest-900">Message {st}</h3>
              <div className="mt-2 space-y-3">
                {s.templates.filter((t) => t.stage === st).map((t) => (
                  <div key={t.id} className="rounded-xl border border-sand-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-forest-900">{KIND_LABEL[t.kind]} <span className="font-normal text-forest-700">({t.id})</span></p>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-forest-900"><input type="checkbox" className="size-4 accent-purple-600" checked={t.on} onChange={(e) => setT(t.id, { on: e.target.checked })} />On</label></div>
                    <label className="mt-2 block text-xs font-semibold text-forest-900">Message<textarea rows={3} value={t.text} onChange={(e) => setT(t.id, { text: e.target.value })} className={inp} /></label>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-forest-900">Button label<input value={t.cta} onChange={(e) => setT(t.id, { cta: e.target.value })} className={inp} /></label>
                      <label className="text-xs font-semibold text-forest-900">Opening question in the chat<input value={t.ask} onChange={(e) => setT(t.id, { ask: e.target.value })} className={inp} /></label>
                    </div>
                    {errs[t.id] && <p role="alert" className="mt-1 text-xs font-semibold text-red-700">{errs[t.id]}</p>}
                    <button type="button" onClick={() => setOpen(open === t.id ? null : t.id)} className="mt-2 text-xs font-semibold text-purple-700 underline">{open === t.id ? "Hide preview" : "Preview"}</button>
                  </div>
                ))}
              </div></div>
          ))}
        </div>
        {prev && (
          <div className="mt-5 rounded-xl bg-sand-100 p-4"><p className="mb-2 text-xs font-semibold text-forest-900">Preview with sample values (the real bubble, not clickable here)</p>
            <ProBubble inline name={name} text={fill(prev.text, SAMPLE)} cta={fill(prev.cta, SAMPLE)} onCta={() => {}} onClose={() => setOpen(null)} />
            <p className="mt-2 text-xs text-forest-900"><b>Chat opens with:</b> {fill(prev.ask, SAMPLE)}</p></div>
        )}
      </section>
      <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={pending || anyErr}>{pending ? "Saving..." : "Save proactive messages"}</Button>
        {r && <p role="status" className={`text-sm font-semibold ${r.ok ? "text-forest-700" : "text-red-700"}`}>{r.message}</p>}</div>
    </form>
  );
}
