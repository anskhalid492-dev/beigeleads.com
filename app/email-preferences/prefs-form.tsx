"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PREF_LABEL } from "@/lib/founder/config";
import type { PrefRow } from "@/lib/founder/data";
import { resubscribeAction, savePrefsAction, unsubscribeAction } from "./prefs-actions";

const KEYS = ["recs", "products", "founder", "education", "offers"] as const;
export function PrefsForm({ email, token, initial, unsubscribeIntent }: { email: string; token: string; initial: PrefRow; unsubscribeIntent: boolean }) {
  const [p, setP] = useState(initial);
  const [msg, setMsg] = useState(""); const [pending, start] = useTransition();
  const run = (fn: () => Promise<boolean>, ok: string) => start(async () => setMsg((await fn()) ? ok : "This link is not valid. Use the link from your latest email."));
  const input = "mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2";
  if (p.unsubAll) return (
    <div><p role="status" className="rounded-xl bg-forest-100 p-4 font-semibold text-forest-900">You are unsubscribed from optional BeigeLeads emails.</p>
      <p className="mt-4 text-sm">Changed your mind?</p><Button className="mt-2" variant="secondary" disabled={pending} onClick={() => run(async () => { const ok = await resubscribeAction(email, token); if (ok) setP({ ...p, unsubAll: false }); return ok; }, "Welcome back. Your choices are saved.")}>Start these emails again</Button>{msg && <p role="status" className="mt-3 text-sm">{msg}</p>}</div>
  );
  return (
    <div className="space-y-6">
      {unsubscribeIntent && <div className="rounded-xl bg-sand-100 p-4"><p className="font-semibold text-forest-900">Stop all optional emails?</p><Button className="mt-3" disabled={pending} onClick={() => run(async () => { const ok = await unsubscribeAction(email, token); if (ok) setP({ ...p, unsubAll: true }); return ok; }, "Done.")}>Unsubscribe me</Button></div>}
      <fieldset className="space-y-3"><legend className="font-semibold text-forest-900">I would like to receive</legend>
        {KEYS.map((k) => <label key={k} className="flex items-center gap-3"><input type="checkbox" checked={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.checked })} />{PREF_LABEL[k]}</label>)}</fieldset>
      <label className="block">How often<select className={input} value={p.frequency} onChange={(e) => setP({ ...p, frequency: e.target.value as "normal" | "less" })}><option value="normal">Normal</option><option value="less">Less often</option></select></label>
      <label className="block">Countries I care about (comma separated, optional)<input className={input} value={p.countries.join(", ")} onChange={(e) => setP({ ...p, countries: e.target.value.split(",") })} /></label>
      <label className="block">Industries I care about (comma separated, optional)<input className={input} value={p.industries.join(", ")} onChange={(e) => setP({ ...p, industries: e.target.value.split(",") })} /></label>
      <div className="flex flex-wrap gap-3"><Button disabled={pending} onClick={() => run(() => savePrefsAction(email, token, p), "Saved.")}>{pending ? "Working…" : "Save my choices"}</Button>
        <Button variant="secondary" disabled={pending} onClick={() => run(async () => { const ok = await unsubscribeAction(email, token); if (ok) setP({ ...p, unsubAll: true }); return ok; }, "Done.")}>Unsubscribe from all optional emails</Button></div>
      {msg && <p role="status" className="text-sm">{msg}</p>}
    </div>
  );
}
