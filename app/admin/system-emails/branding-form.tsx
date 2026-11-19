"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import type { Branding } from "@/lib/system-emails/branding";
import { previewBrandingAction, saveBrandingAction } from "./actions";

const input = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";

export function BrandingForm({ initial, colors, ready }: { initial: Branding; colors: readonly (readonly [string, string])[]; ready: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [b, setB] = useState<Branding>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [html, setHtml] = useState("");
  const [dark, setDark] = useState(false);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(b) !== saved;
  useEffect(() => { const t = setTimeout(async () => { const r = await previewBrandingAction(b, dark); if (r.ok) setHtml(r.html); }, 250); return () => clearTimeout(t); }, [b, dark]);
  const seg = <T extends string | number>(label: string, value: T, opts: { v: T; l: string }[], on: (v: T) => void) => (
    <div className="mb-4"><p className="mb-1 text-sm font-semibold text-forest-900">{label}</p><div className="flex flex-wrap gap-1.5">{opts.map((o) => <button key={String(o.v)} type="button" aria-pressed={value === o.v} onClick={() => on(o.v)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${value === o.v ? "border-forest-900 bg-forest-900 text-white" : "border-sand-300 bg-white text-forest-900 hover:bg-sand-100"}`}>{o.l}</button>)}</div></div>
  );
  return (
    <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div>
        {!ready && <p className="mb-4 rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber-900">Saving needs migration 0023 in D1.</p>}
        <p className="mb-2 text-sm font-semibold text-forest-900">Official logo</p>
        <div className="mb-1 flex gap-3">
          <div className="rounded-xl border border-sand-200 bg-sand-50 p-3">{/* approved files, not editable here */}<img src="/brand/png/beigeleads-horizontal-light.png" alt="BeigeLeads logo for light backgrounds" className="h-8 w-auto" /></div>
          <div className="rounded-xl border border-sand-200 bg-forest-900 p-3"><img src="/brand/png/beigeleads-horizontal-dark.png" alt="BeigeLeads logo for dark backgrounds" className="h-8 w-auto" /></div>
        </div>
        <p className="mb-4 text-xs">Emails load these approved files from beigeleads.com/brand, so a logo update in the brand folder reaches every email at once.</p>
        {seg("Logo height", b.logoHeight, [{ v: 28, l: "Small" }, { v: 34, l: "Medium" }, { v: 42, l: "Large" }], (v) => setB({ ...b, logoHeight: v }))}
        {seg("Email card corners", b.cardRadius, [{ v: 8, l: "8" }, { v: 12, l: "12" }, { v: 20, l: "20" }], (v) => setB({ ...b, cardRadius: v }))}
        {seg("Main button colour", b.buttonColor, [{ v: "primary", l: "Electric purple" }, { v: "dark", l: "Dark forest" }], (v) => setB({ ...b, buttonColor: v }))}
        {seg("Button corners", b.buttonRadius, [{ v: 0, l: "Square" }, { v: 8, l: "8" }, { v: 12, l: "12" }, { v: 20, l: "Round" }], (v) => setB({ ...b, buttonRadius: v }))}
        <label className="mb-4 block text-sm font-semibold text-forest-900">Support email shown in emails (optional)<input className={`${input} mt-1`} value={b.supportEmail} onChange={(e) => setB({ ...b, supportEmail: e.target.value })} placeholder="Leave empty to show only the contact page" /></label>
        <label className="mb-4 block text-sm font-semibold text-forest-900">Extra footer line (optional)<input className={`${input} mt-1`} maxLength={300} value={b.footerNote} onChange={(e) => setB({ ...b, footerNote: e.target.value })} /></label>
        <div className="mb-4"><p className="mb-1 text-sm font-semibold text-forest-900">Footer social links (only real accounts, https)</p>
          {b.social.map((l, k) => <div key={k} className="mb-1.5 flex gap-1.5"><input aria-label="Name" className={`${input} w-1/3`} value={l.label} onChange={(e) => setB({ ...b, social: b.social.map((x, j) => (j === k ? { ...x, label: e.target.value } : x)) })} /><input aria-label="Address" className={input} value={l.url} onChange={(e) => setB({ ...b, social: b.social.map((x, j) => (j === k ? { ...x, url: e.target.value } : x)) })} /><button type="button" className="rounded-full border border-sand-300 px-3 text-xs font-semibold" onClick={() => setB({ ...b, social: b.social.filter((_, j) => j !== k) })}>Remove</button></div>)}
          {b.social.length < 6 && <button type="button" className="rounded-full border border-sand-300 bg-white px-3 py-1 text-xs font-semibold" onClick={() => setB({ ...b, social: [...b.social, { label: "", url: "https://" }] })}>Add link</button>}</div>
        <p className="mb-2 text-sm font-semibold text-forest-900">Colours (fixed brand palette)</p>
        <ul className="mb-4 grid grid-cols-2 gap-2 text-xs">{colors.map(([n, c]) => <li key={n} className="flex items-center gap-2"><span className="size-6 rounded-md border border-sand-300" style={{ background: c }} /><span>{n}<br /><code>{c}</code></span></li>)}</ul>
        <p className="mb-4 text-xs">Colours cannot be changed here on purpose: every email uses the approved palette. Typography is Bricolage Grotesque where the email app supports it, otherwise Segoe UI, Helvetica or Arial.</p>
        <div className="flex gap-2">
          <Button disabled={pending || !dirty || !ready} onClick={() => start(async () => { const r = await saveBrandingAction(b); toast(r.ok, r.ok ? "Branding saved. New emails use it." : r.error); if (r.ok) { setSaved(JSON.stringify(b)); router.refresh(); } })}>Save branding</Button>
          <Button variant="secondary" disabled={!dirty} onClick={() => setB(JSON.parse(saved) as Branding)}>Cancel</Button>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-forest-900">Preview (example email)</p><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark appearance</label></div>
        <iframe title="Branding preview" sandbox="" srcDoc={html} className="h-[40rem] w-full rounded-xl border border-sand-200 bg-white" />
      </div>
    </div>
  );
}
