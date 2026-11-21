"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import type { EvSettings } from "@/lib/ev/settings";
import { saveSettingsAction } from "../actions";

type Res = { ok: true; message: string } | { ok: false; error: string } | null;
const box = "mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
const lab = "block text-sm font-semibold text-forest-900";

export function SettingsForm({ s }: { s: EvSettings }) {
  const [r, run, pending] = useActionState(saveSettingsAction, null as Res);
  const [pk, setPk] = useState(s.packages.map((p) => ({ name: p.name, limit: String(p.limit), price: String(p.priceCents / 100) })));
  const [featured, setFeatured] = useState(s.packages.find((p) => p.featured)?.name ?? "");
  return (
    <form action={run} className="space-y-8">
      <input type="hidden" name="packages" value={JSON.stringify(pk)} />
      <input type="hidden" name="featured" value={featured} />
      <section className="space-y-3">
        <label className="flex items-center gap-2 font-semibold text-forest-900"><input type="checkbox" name="enabled" defaultChecked={s.enabled} className="size-4 accent-forest-900" /> Service enabled (when off, nobody can buy it)</label>
      </section>
      <section>
        <h2 className="text-lg font-bold text-forest-900">Packages</h2>
        <p className="text-sm">Existing paid orders keep the name, limit and price they bought. At most 8 packages, sorted by size when saved.</p>
        <div className="mt-3 space-y-2">
          {pk.map((p, i) => (
            <div key={i} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto_auto]">
              <label className={lab}>Name<input value={p.name} onChange={(e) => setPk(pk.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={box} /></label>
              <label className={lab}>Email limit<input inputMode="numeric" value={p.limit} onChange={(e) => setPk(pk.map((x, j) => (j === i ? { ...x, limit: e.target.value } : x)))} className={box} /></label>
              <label className={lab}>Price (USD)<input inputMode="decimal" value={p.price} onChange={(e) => setPk(pk.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} className={box} /></label>
              <label className="flex items-center gap-1.5 pb-2 text-sm"><input type="radio" name="feat" checked={featured === p.name && p.name !== ""} onChange={() => setFeatured(p.name)} className="accent-purple-600" /> Featured</label>
              <button type="button" onClick={() => setPk(pk.filter((_, j) => j !== i))} disabled={pk.length <= 1} className="pb-2 text-sm font-semibold text-red-800 underline disabled:opacity-40">Remove</button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-3"><Button type="button" size="sm" variant="secondary" disabled={pk.length >= 8} onClick={() => setPk([...pk, { name: "", limit: "", price: "" }])}>Add package</Button>{featured && <button type="button" onClick={() => setFeatured("")} className="text-sm underline">Clear featured</button>}</div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <label className={lab}>Maximum upload size (MB, up to 100)<input name="maxUploadMb" defaultValue={s.maxUploadMb} className={box} /></label>
        <fieldset><legend className={lab}>Allowed formats</legend><div className="mt-2 flex gap-4 text-sm">{(["csv", "xlsx", "txt"] as const).map((f) => <label key={f} className="flex items-center gap-1.5"><input type="checkbox" name={`fmt_${f}`} defaultChecked={s.formats.includes(f)} className="accent-forest-900" />{f.toUpperCase()}</label>)}</div></fieldset>
        <label className={lab}>Submission link valid (days after payment)<input name="submitLinkDays" defaultValue={s.submitLinkDays} className={box} /></label>
        <label className={lab}>Result download valid (days after completion)<input name="resultDownloadDays" defaultValue={s.resultDownloadDays} className={box} /></label>
        <label className={lab}>Delete original files (days after completion)<input name="retainOriginalDays" defaultValue={s.retainOriginalDays} className={box} /></label>
        <label className={lab}>Delete results (days after delivery)<input name="retainResultDays" defaultValue={s.retainResultDays} className={box} /></label>
        <label className={lab}>Reminder after (hours, 0 = off)<input name="reminderHours" defaultValue={s.reminderHours} className={box} /></label>
        <label className={lab}>Support email shown to customers<input name="supportEmail" type="email" defaultValue={s.supportEmail} className={box} /></label>
        <label className={lab}>Custom quote recipient (empty = the usual owner alert address)<input name="quoteRecipient" type="email" defaultValue={s.quoteRecipient} className={box} /></label>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-forest-900">Cart offer</h2>
        <label className="flex items-center gap-2 font-semibold text-forest-900"><input type="checkbox" name="upsellEnabled" defaultChecked={s.upsellEnabled} className="size-4 accent-forest-900" /> Show the optional offer in the cart</label>
        <label className={lab}>Headline<input name="upsellHeadline" defaultValue={s.upsellHeadline} maxLength={80} className={box} /></label>
        <label className={lab}>Description<textarea name="upsellDescription" defaultValue={s.upsellDescription} maxLength={300} rows={3} className={box} /></label>
        <label className={lab}>Placement<select name="upsellPlacement" defaultValue={s.upsellPlacement} className={box}><option value="after_items">Below the selected databases (recommended)</option><option value="in_summary">Above the order summary</option></select></label>
      </section>
      <div><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>{r && <p role={r.ok ? "status" : "alert"} className={`mt-3 text-sm font-medium ${r.ok ? "text-forest-700" : "text-red-800"}`}>{r.ok ? r.message : r.error}</p>}</div>
    </form>
  );
}
