"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { RewardSettings, VolumeSettings } from "@/lib/sales/settings";
import { resendRewardAction, revokeRewardAction, saveRewardAction, saveVolumeAction } from "./actions";

type Res = { ok: true; message: string } | { ok: false; error: string } | null;
const inp = "w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm";
const Msg = ({ r }: { r: Res }) => r ? <p role={r.ok ? "status" : "alert"} className={`text-sm font-medium ${r.ok ? "text-forest-700" : "text-red-800"}`}>{r.ok ? r.message : r.error}</p> : null;
const Check = ({ name, label, on, hint }: { name: string; label: string; on: boolean; hint?: string }) => (
  <label className="flex items-start gap-2 text-sm"><input type="checkbox" name={name} defaultChecked={on} className="mt-1" /><span><span className="font-semibold text-forest-900">{label}</span>{hint && <span className="block text-xs">{hint}</span>}</span></label>
);

export function VolumeForm({ v }: { v: VolumeSettings }) {
  const [r, run, pending] = useActionState(saveVolumeAction, null as Res);
  const rows = [...v.tiers, ...Array.from({ length: Math.max(0, 5 - v.tiers.length) }, () => ({ min: "" as unknown as number, percent: "" as unknown as number }))];
  return (
    <form action={run} className="space-y-5 p-5">
      <Check name="enabled" label="Buy More, Save More is on" on={v.enabled} />
      <div>
        <p className="text-sm font-semibold text-forest-900">Discount tiers (distinct databases in the cart)</p>
        <div className="mt-2 grid max-w-md grid-cols-2 gap-2">
          <span className="text-xs">From this many databases</span><span className="text-xs">Percent off</span>
          {rows.map((t, i) => (<div key={i} className="contents"><input className={inp} name="min" type="number" min={2} defaultValue={t.min} aria-label={`Tier ${i + 1} databases`} /><input className={inp} name="percent" type="number" min={1} max={90} defaultValue={t.percent} aria-label={`Tier ${i + 1} percent`} /></div>))}
        </div>
        <p className="mt-1 text-xs">Leave a row empty to remove it. The same database twice counts once.</p>
      </div>
      <label className="block text-sm"><span className="font-semibold text-forest-900">Excluded product slugs</span><textarea name="excludedProducts" defaultValue={v.excludedProducts.join(", ")} rows={2} className={inp} /></label>
      <label className="block text-sm"><span className="font-semibold text-forest-900">Excluded category slugs</span><textarea name="excludedCategories" defaultValue={v.excludedCategories.join(", ")} rows={2} className={inp} /></label>
      <Check name="stackWithPromos" label="Allow stacking with promo codes" on={v.stackWithPromos} hint="Off (default): a promo code or promotion replaces the volume discount. Partner codes always apply alone." />
      <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button><Msg r={r} /></div>
    </form>
  );
}

export function RewardForm({ s }: { s: RewardSettings }) {
  const [r, run, pending] = useActionState(saveRewardAction, null as Res);
  return (
    <form action={run} className="space-y-5 p-5">
      <Check name="enabled" label="Second Purchase Offer is on" on={s.enabled} hint="A personal code is created after a customer's first paid order." />
      <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
        <label className="text-sm"><span className="font-semibold text-forest-900">Percent off</span><input className={inp} name="percent" type="number" min={1} max={100} defaultValue={s.percent} /></label>
        <label className="text-sm"><span className="font-semibold text-forest-900">Valid for (days)</span><input className={inp} name="expiryDays" type="number" min={1} max={365} defaultValue={s.expiryDays} /></label>
        <label className="text-sm"><span className="font-semibold text-forest-900">Maximum discount (USD, empty = no cap)</span><input className={inp} name="maxDiscount" type="number" min={1} step="0.01" defaultValue={s.maxDiscountCents ? s.maxDiscountCents / 100 : ""} /></label>
        <label className="text-sm"><span className="font-semibold text-forest-900">Minimum first order (USD)</span><input className={inp} name="minOrder" type="number" min={0} step="0.01" defaultValue={s.minOrderCents / 100} /></label>
      </div>
      <label className="block text-sm"><span className="font-semibold text-forest-900">Eligible product slugs (empty = all)</span><textarea name="productSlugs" defaultValue={s.productSlugs.join(", ")} rows={2} className={inp} /></label>
      <label className="block text-sm"><span className="font-semibold text-forest-900">Eligible category slugs (empty = all)</span><textarea name="categorySlugs" defaultValue={s.categorySlugs.join(", ")} rows={2} className={inp} /></label>
      <Check name="combineVolume" label="Allow combining with Buy More, Save More" on={s.combineVolume} hint="Off (default): the larger single discount is not stacked." />
      <Check name="reminders" label="Send reminder emails" on={s.reminders} hint="One reminder after the days below, one before expiry. Stops once the code is used or revoked." />
      <div className="grid max-w-md gap-3 sm:grid-cols-2">
        <label className="text-sm"><span className="font-semibold text-forest-900">First reminder after (days)</span><input className={inp} name="reminderDays" type="number" min={1} max={60} defaultValue={s.reminderDays} /></label>
        <label className="text-sm"><span className="font-semibold text-forest-900">Expiry reminder (hours before)</span><input className={inp} name="expiryReminderHours" type="number" min={6} max={240} defaultValue={s.expiryReminderHours} /></label>
      </div>
      <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button><Msg r={r} /></div>
    </form>
  );
}

export function RewardRowActions({ id, status, emailStatus }: { id: number; status: string; emailStatus: string }) {
  const [a, runA, pa] = useActionState(revokeRewardAction, null as Res);
  const [b, runB, pb] = useActionState(resendRewardAction, null as Res);
  return (
    <div className="flex flex-wrap items-start gap-2">
      {status === "active" && <form action={runA} onSubmit={(e) => { if (!window.confirm("Revoke this code? It stops working immediately.")) e.preventDefault(); }}><input type="hidden" name="id" value={id} /><Button type="submit" size="sm" variant="secondary" disabled={pa}>Revoke</Button></form>}
      {status === "active" && emailStatus !== "sent" && <form action={runB}><input type="hidden" name="id" value={id} /><Button type="submit" size="sm" variant="secondary" disabled={pb}>Resend email</Button></form>}
      <Msg r={a} /><Msg r={b} />
    </div>
  );
}
