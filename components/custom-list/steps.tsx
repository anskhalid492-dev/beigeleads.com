"use client";
import { useMemo, useState } from "react";
import { ChipInput } from "./chip-input";
import { Summary } from "./summary";
import { qtyLabel, type WizardState } from "./state";
import { AUDIENCES, FIELD_GROUPS, QUANTITY_PRESETS, type LocationInput } from "@/lib/custom-list/schema";
import { COMPANY_SIZES, COUNTRIES, INDUSTRY_EXAMPLES, JOB_TITLE_EXAMPLES, REGIONS, REVENUE_RANGES } from "@/lib/custom-list/data";

type P = { s: WizardState; set: (patch: Partial<WizardState>) => void };

const input = "w-full rounded-xl border border-sand-300 bg-white px-4 py-3 text-base text-forest-900 placeholder:text-forest-500/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";
const label = "mb-1.5 block text-sm font-semibold text-forest-900";
const pill = (on: boolean) => `rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${on ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900 hover:border-forest-700"}`;

export function Heading({ title, text }: { title: string; text: string }) {
  return <div className="mb-6"><h2 className="display text-4xl text-forest-900 sm:text-5xl">{title}</h2><p className="mt-2">{text}</p></div>;
}

export function StepAudience({ s, set, catalog }: P & { catalog: readonly string[] }) {
  const toggle = (a: string) => set({ audience: s.audience.includes(a as never) ? s.audience.filter((x) => x !== a) : [...s.audience, a] });
  const suggestions = useMemo(() => [...new Set([...catalog, ...INDUSTRY_EXAMPLES])], [catalog]);
  const [more, setMore] = useState(Object.values(s.targeting).some(Boolean));
  const t = (k: keyof WizardState["targeting"], v: string) => set({ targeting: { ...s.targeting, [k]: v } });
  return (
    <div className="space-y-7">
      <Heading title="Who do you want to reach?" text="Tell us which businesses or professionals belong in your ideal list." />
      <ChipInput label="Industries" value={s.industries} onChange={(industries) => set({ industries })} suggestions={suggestions} marked={new Set(catalog)} max={15}
        placeholder="Search or type an industry" hint="Suggestions are ideas, not a promise that a list exists. Type any industry that is not shown." />
      <fieldset>
        <legend className={label}>Target prospects (optional)</legend>
        <div className="flex flex-wrap gap-2">{AUDIENCES.map((a) => <button key={a} type="button" aria-pressed={s.audience.includes(a)} onClick={() => toggle(a)} className={pill(s.audience.includes(a))}>{a}</button>)}</div>
      </fieldset>
      <ChipInput label="Job titles (optional)" value={s.jobTitles} onChange={(jobTitles) => set({ jobTitles })} suggestions={JOB_TITLE_EXAMPLES} max={20} placeholder="Search or type a job title" />
      <div>
        <button type="button" aria-expanded={more} onClick={() => setMore(!more)} className="text-sm font-semibold text-forest-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
          {more ? "Hide extra targeting" : "Add extra targeting (optional)"}
        </button>
        {more && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className={label} htmlFor="cl-size">Company size</label><select id="cl-size" className={input} value={s.targeting.companySize} onChange={(e) => t("companySize", e.target.value)}>{COMPANY_SIZES.map((x) => <option key={x} value={x}>{x || "Any"}</option>)}</select></div>
            <div><label className={label} htmlFor="cl-rev">Revenue range</label><select id="cl-rev" className={input} value={s.targeting.revenue} onChange={(e) => t("revenue", e.target.value)}>{REVENUE_RANGES.map((x) => <option key={x} value={x}>{x || "Any"}</option>)}</select></div>
            <div><label className={label} htmlFor="cl-spec">Specialization</label><input id="cl-spec" className={input} value={s.targeting.specialization} maxLength={200} onChange={(e) => t("specialization", e.target.value)} placeholder="For example: cosmetic dentistry" /></div>
            <div><label className={label} htmlFor="cl-bt">Business type</label><input id="cl-bt" className={input} value={s.targeting.businessType} maxLength={120} onChange={(e) => t("businessType", e.target.value)} placeholder="For example: independent, franchise" /></div>
            <div className="sm:col-span-2"><label className={label} htmlFor="cl-oth">Other criteria</label><textarea id="cl-oth" rows={2} className={input} value={s.targeting.other} maxLength={400} onChange={(e) => t("other", e.target.value)} /></div>
            <p className="text-sm sm:col-span-2">We check each criterion against what we can source. Not every filter will be available.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LocationCard({ l, onChange, onRemove }: { l: LocationInput; onChange: (l: LocationInput) => void; onRemove: () => void }) {
  const regions = REGIONS[l.country] ?? [];
  return (
    <li className="rounded-2xl border border-sand-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-bold text-forest-900">{l.country}</p>
        <button type="button" onClick={onRemove} aria-label={`Remove ${l.country}`} className="rounded-full border border-sand-300 px-3 py-1 text-xs font-semibold hover:border-forest-700 focus-visible:outline-2 focus-visible:outline-purple-600">Remove</button>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-forest-900">
        <input type="checkbox" className="size-4 accent-purple-600" checked={l.whole} onChange={(e) => onChange({ ...l, whole: e.target.checked })} /> Entire country
      </label>
      {!l.whole && (
        <div className="mt-4 space-y-4">
          <ChipInput label="States or provinces (optional)" value={l.regions} onChange={(regions) => onChange({ ...l, regions })} suggestions={regions} max={20} placeholder={regions.length ? "Search a state or province" : "Type a state, province or region"} />
          <ChipInput label="Cities (optional)" value={l.cities} onChange={(cities) => onChange({ ...l, cities })} max={30} placeholder="Type a city and press Enter" />
        </div>
      )}
    </li>
  );
}

export function StepLocation({ s, set }: P) {
  const update = (i: number, l: LocationInput) => set({ locations: s.locations.map((x, j) => (j === i ? l : x)) });
  const countries = s.locations.map((l) => l.country);
  return (
    <div className="space-y-7">
      <Heading title="Where should we find your contacts?" text="Add one or more countries, then narrow by state or city if you want. Example: United States, California, Los Angeles and San Diego." />
      <ChipInput label="Add a country" value={[]} onChange={(v) => { const c = v[0]; if (c && !countries.includes(c) && s.locations.length < 10) set({ locations: [...s.locations, { country: c, whole: false, regions: [], cities: [] }] }); }}
        suggestions={COUNTRIES.filter((c) => !countries.includes(c))} max={1} placeholder="Search countries" />
      {s.locations.length === 0 ? <p className="rounded-2xl border border-dashed border-sand-300 p-5 text-sm">No location yet. Pick at least one country above.</p> : (
        <ul className="space-y-4">{s.locations.map((l, i) => <LocationCard key={l.country} l={l} onChange={(x) => update(i, x)} onRemove={() => set({ locations: s.locations.filter((_, j) => j !== i) })} />)}</ul>
      )}
      <ChipInput label="Exclude places (optional)" value={s.exclusions} onChange={(exclusions) => set({ exclusions })} max={15} placeholder="For example: New York" hint="Places to leave out of the list." />
      <p className="text-sm">Our ready-made lists cover the United States today. For other countries we tell you honestly whether we can source them.</p>
    </div>
  );
}

export function StepData({ s, set }: P) {
  const toggle = (f: string) => set({ fields: s.fields.includes(f) ? s.fields.filter((x) => x !== f) : [...s.fields, f] });
  const n = Number(s.quantity.replace(/[^\d]/g, ""));
  return (
    <div className="space-y-7">
      <Heading title="What information should your list include?" text="Pick the fields you need. Availability of each field depends on whether we can source it for your prospects." />
      {FIELD_GROUPS.map((g) => (
        <fieldset key={g.title}>
          <legend className={label}>{g.title}</legend>
          <div className="flex flex-wrap gap-2">{g.fields.map((f) => <button key={f} type="button" aria-pressed={s.fields.includes(f)} onClick={() => toggle(f)} className={pill(s.fields.includes(f))}>{f}</button>)}</div>
        </fieldset>
      ))}
      <ChipInput label="Other fields (optional)" value={s.customFields} onChange={(customFields) => set({ customFields })} max={10} placeholder="Type a field name and press Enter" />
      <fieldset>
        <legend className={label}>How many contacts do you want? (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {QUANTITY_PRESETS.map((q) => {
            const plus = q === 100000;
            const on = n === q && s.quantityPlus === plus;
            return <button key={q} type="button" aria-pressed={on} onClick={() => set({ quantity: String(q), quantityPlus: plus })} className={pill(on)}>{q.toLocaleString("en-US")}{plus ? "+" : ""}</button>;
          })}
        </div>
        <div className="mt-3 max-w-xs">
          <label htmlFor="cl-qty" className="sr-only">Custom quantity</label>
          <input id="cl-qty" inputMode="numeric" className={input} value={s.quantity} placeholder="Or enter your own number" onChange={(e) => set({ quantity: e.target.value.replace(/[^\d,]/g, "").slice(0, 11), quantityPlus: false })} />
        </div>
        <p className="mt-2 text-sm">These are the volumes you ask for, not what is available.</p>
      </fieldset>
      <div>
        <label htmlFor="cl-ins" className={label}>Anything else we should know about your ideal list? (optional)</label>
        <textarea id="cl-ins" rows={4} maxLength={2000} className={input} value={s.instructions} onChange={(e) => set({ instructions: e.target.value })} />
      </div>
    </div>
  );
}

export function StepReview({ s, set, errors, onEdit }: P & { errors: Record<string, string>; onEdit: (n: number) => void }) {
  return (
    <div className="space-y-7">
      <Heading title="Your custom list is almost ready." text="Check your requirements. Use Edit on any row to change it. Nothing you entered is lost." />
      <div className="rounded-2xl border border-sand-200 bg-white p-5"><Summary s={s} onEdit={onEdit} compact /></div>
      {s.industries.length === 0 || s.locations.length === 0 ? <p role="alert" className="rounded-xl border border-forest-900 bg-sand-100 px-4 py-3 text-sm font-medium text-forest-900">Add at least one industry and one location before you send the request.</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="cl-name" className={label}>Full name</label><input id="cl-name" autoComplete="name" className={input} value={s.name} maxLength={120} onChange={(e) => set({ name: e.target.value })} aria-invalid={!!errors.name} aria-describedby={errors.name ? "cl-name-e" : undefined} />{errors.name && <p id="cl-name-e" className="mt-1 text-sm font-medium text-forest-900">{errors.name}</p>}</div>
        <div><label htmlFor="cl-email" className={label}>Work email</label><input id="cl-email" type="email" autoComplete="email" className={input} value={s.email} maxLength={254} onChange={(e) => set({ email: e.target.value })} aria-invalid={!!errors.email} aria-describedby={errors.email ? "cl-email-e" : undefined} />{errors.email && <p id="cl-email-e" className="mt-1 text-sm font-medium text-forest-900">{errors.email}</p>}</div>
        <div className="sm:col-span-2"><label htmlFor="cl-co" className={label}>Company name (optional)</label><input id="cl-co" autoComplete="organization" className={input} value={s.company} maxLength={120} onChange={(e) => set({ company: e.target.value })} /></div>
        <div className="sm:col-span-2"><label htmlFor="cl-msg" className={label}>Additional message (optional)</label><textarea id="cl-msg" rows={3} className={input} value={s.message} maxLength={1500} onChange={(e) => set({ message: e.target.value })} /></div>
      </div>
    </div>
  );
}

export const reviewQty = qtyLabel;
