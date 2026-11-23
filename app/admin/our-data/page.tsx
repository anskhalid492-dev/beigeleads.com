import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { inp } from "@/components/admin/dfy-form";
import { CLAIM_INFO, CLAIM_KEYS, loadOurData } from "@/lib/our-data/settings";
import { loadOurDataFacts } from "@/lib/our-data/facts";
import { gate } from "../email-verification/gate";
import { OurDataForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Our Data page", robots: { index: false, follow: false } };
const lbl = "block text-sm font-semibold text-forest-900";

export default async function OurDataAdmin() {
  await gate();
  const s = await loadOurData(getCloudflareContext().env);
  const f = await loadOurDataFacts();
  return (
    <>
      <PageHeader title="Our Data page" text="Claims stay hidden until you approve them with written evidence. Coverage, industries and dates are read from the real catalog." />
      <OurDataForm>
        <div className="space-y-5">
          <Panel title="Page"><div className="grid gap-3 p-4 sm:grid-cols-2">
            <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={s.published} />Page is published</label>
            <p className="text-sm text-forest-700">Live from the catalog: {f.countries.length} countries, {f.industries.length} industries, newest list update {f.newestUpdate ?? "none"}.</p>
            <label className={lbl}>SEO title (max 59)<input name="seoTitle" defaultValue={s.seoTitle} maxLength={59} className={inp} /></label>
            <label className={lbl}>SEO description (max 149)<input name="seoDescription" defaultValue={s.seoDescription} maxLength={149} className={inp} /></label>
          </div></Panel>
          {CLAIM_KEYS.map((k) => { const c = s.claims[k]; const i = CLAIM_INFO[k]; return (
            <Panel key={k} title={`Claim: ${i.label}`}><div className="grid gap-3 p-4 sm:grid-cols-2">
              <p className="text-sm text-forest-700 sm:col-span-2">Proposed wording: “{i.proposed}”. Needed as evidence: {i.hint} Only an <strong>approved</strong> claim with evidence appears on the page. {c.reviewedAt && <>Last reviewed {c.reviewedAt} by {c.reviewedBy}.</>}</p>
              <label className={lbl}>Review status<select name={`${k}.status`} defaultValue={c.status} className={inp}><option value="pending">Pending (not shown)</option><option value="approved">Approved (shown)</option><option value="rejected">Rejected (not shown)</option></select></label>
              <label className={lbl}>Wording to publish<input name={`${k}.value`} defaultValue={c.value} maxLength={60} className={inp} /></label>
              <label className={`${lbl} sm:col-span-2`}>Evidence (min 40 characters to approve)<textarea name={`${k}.evidence`} rows={3} defaultValue={c.evidence} className={inp} /></label>
              <label className={`${lbl} sm:col-span-2`}>Evidence link (optional, https or site path)<input name={`${k}.url`} defaultValue={c.evidenceUrl} className={inp} /></label>
            </div></Panel>
          ); })}
          <Panel title="FAQs (at least 8, shown with FAQ structured data)"><div className="space-y-3 p-4">
            {[...s.faqs, ...Array.from({ length: Math.max(0, 14 - s.faqs.length) }, () => ({ q: "", a: "" }))].map((x, i) => (
              <div key={i} className="grid gap-2"><input name={`faq${i}.q`} defaultValue={x.q} placeholder="Question" className={inp} /><textarea name={`faq${i}.a`} rows={2} defaultValue={x.a} placeholder="Answer" className={inp} /></div>
            ))}
          </div></Panel>
        </div>
      </OurDataForm>
    </>
  );
}
