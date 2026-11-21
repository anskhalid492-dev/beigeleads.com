import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { SettingsForm, inp } from "@/components/admin/dfy-form";
import { loadDfySettings } from "@/lib/dfy/settings";
import { gate } from "../../email-verification/gate";

export const dynamic = "force-dynamic";
export const metadata = { title: "DFY Outbound Settings", robots: { index: false, follow: false } };
const lbl = "block text-sm font-semibold text-forest-900";
const F = ({ n, l, v, t = "text" }: { n: string; l: string; v: string | number; t?: string }) => <label className={lbl}>{l}<input name={n} type={t} step="any" defaultValue={v} className={inp} /></label>;

export default async function DfySettingsPage() {
  await gate();
  const s = await loadDfySettings(getCloudflareContext().env);
  return (
    <>
      <PageHeader title="DFY Outbound Settings" text="Prices and allocations. Paid orders keep what they bought. Domain/inbox numbers are estimates until an order's capacity plan is approved." />
      <SettingsForm>
        <div className="space-y-5">
          <Panel title="General"><div className="grid gap-3 p-4 sm:grid-cols-3">
            <label className="flex gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={s.enabled} />Service available</label>
            <label className="flex gap-2 text-sm"><input type="checkbox" name="upsellEnabled" defaultChecked={s.upsellEnabled} />Show cart offer</label>
            <F n="supportEmail" l="Support email" v={s.supportEmail} /><F n="upsellHeadline" l="Cart offer headline" v={s.upsellHeadline} /><F n="upsellDescription" l="Cart offer text" v={s.upsellDescription} />
            <F n="reminderDays" l="Renewal reminder (days before)" v={s.renewalReminderDays} t="number" /><F n="perInboxDaily" l="Capacity check: sends per inbox per day" v={s.perInboxDaily} t="number" /><F n="sendingDays" l="Capacity check: sending days per month" v={s.sendingDaysPerMonth} t="number" />
            <label className={`${lbl} sm:col-span-3`}>Billing terms (shown on the page)<textarea name="billingTerms" rows={3} defaultValue={s.billingTerms} className={inp} /></label>
            <label className={`${lbl} sm:col-span-3`}>Notes for Pilo (extra knowledge; never overrides the numbers)<textarea name="piloNotes" rows={3} defaultValue={s.piloNotes} className={inp} /></label>
          </div></Panel>
          {s.packages.map((p, i) => (
            <Panel key={i} title={`Package: ${p.name}`}><div className="grid gap-3 p-4 sm:grid-cols-4">
              <F n={`p${i}.name`} l="Name" v={p.name} /><F n={`p${i}.price`} l="Monthly price (USD)" v={p.monthlyCents / 100} t="number" /><F n={`p${i}.leads`} l="Verified leads" v={p.leads} t="number" /><F n={`p${i}.sends`} l="Initial sends" v={p.initialSends} t="number" />
              <F n={`p${i}.followups`} l="Follow-ups" v={p.followups} t="number" /><F n={`p${i}.dmin`} l="Domains min (est.)" v={p.domainsMin} t="number" /><F n={`p${i}.dmax`} l="Domains max (est.)" v={p.domainsMax} t="number" /><F n={`p${i}.imin`} l="Inboxes min (est.)" v={p.inboxesMin} t="number" />
              <F n={`p${i}.imax`} l="Inboxes max (est.)" v={p.inboxesMax} t="number" /><label className={lbl}>Reporting<select name={`p${i}.reporting`} defaultValue={p.reporting} className={inp}><option>weekly</option><option>monthly</option></select></label><F n={`p${i}.support`} l="Support level" v={p.support} /><F n={`p${i}.cta`} l="Button text" v={p.cta} />
            </div></Panel>
          ))}
          <Panel title="Ownership option"><div className="grid gap-3 p-4 sm:grid-cols-2">
            <label className="flex gap-2 text-sm"><input type="checkbox" name="ownershipEnabled" defaultChecked={s.ownershipEnabled} />Offer ownership</label><F n="ownershipFee" l="One-time fee (USD)" v={s.ownershipCents / 100} t="number" />
            <label className={`${lbl} sm:col-span-2`}>Ownership agreement text (needs owner/lawyer content)<textarea name="ownershipAgreement" rows={4} defaultValue={s.ownershipAgreement} className={inp} /></label>
          </div></Panel>
        </div>
      </SettingsForm>
    </>
  );
}
