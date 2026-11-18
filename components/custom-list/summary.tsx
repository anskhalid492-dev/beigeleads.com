import { completion, locationText, qtyLabel, targetingFilled, targetingLabel, type WizardState } from "./state";

type Props = { s: WizardState; onEdit?: (step: number) => void; compact?: boolean };

function Row({ title, step, onEdit, children, empty }: { title: string; step: number; onEdit?: (n: number) => void; children: React.ReactNode; empty: boolean }) {
  return (
    <div className="border-t border-sand-200 py-3 first:border-t-0">
      <div className="flex items-center justify-between gap-2">
        <dt className="text-sm font-bold text-forest-900">{title}</dt>
        {onEdit && <button type="button" onClick={() => onEdit(step)} className="rounded text-xs font-semibold text-forest-700 underline underline-offset-2 hover:text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600">{empty ? "Add" : "Edit"}</button>}
      </div>
      <dd className="cl-fade mt-1 text-sm">{empty ? <span className="text-forest-500">Not added yet</span> : children}</dd>
    </div>
  );
}

const chips = (a: string[]) => <ul className="flex flex-wrap gap-1.5">{a.map((x) => <li key={x} className="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-semibold text-forest-900">{x}</li>)}</ul>;

/** The request as typed so far. Used for the sticky sidebar, the mobile panel, the review step and the success screen. */
export function Summary({ s, onEdit, compact = false }: Props) {
  const pct = completion(s);
  const extra = targetingFilled(s);
  const fields = [...s.fields, ...s.customFields];
  return (
    <div>
      {!compact && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs font-semibold text-forest-900"><span>Request progress</span><span>{pct}%</span></div>
          <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Request completion" className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand-200">
            <div className="h-full rounded-full bg-forest-500 transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <dl>
        <Row title="Target audience" step={0} onEdit={onEdit} empty={s.audience.length === 0}>{chips(s.audience)}</Row>
        <Row title="Industries" step={0} onEdit={onEdit} empty={s.industries.length === 0}>{chips(s.industries)}</Row>
        <Row title="Job titles" step={0} onEdit={onEdit} empty={s.jobTitles.length === 0}>{chips(s.jobTitles)}</Row>
        <Row title="Additional filters" step={0} onEdit={onEdit} empty={extra.length === 0}>
          <ul className="space-y-0.5">{extra.map(([k, v]) => <li key={k}><span className="font-semibold text-forest-900">{targetingLabel(k)}:</span> {v}</li>)}</ul>
        </Row>
        <Row title="Locations" step={1} onEdit={onEdit} empty={s.locations.length === 0}>
          <ul className="space-y-1">{s.locations.map((l) => <li key={l.country}>{locationText(l)}</li>)}</ul>
          {s.exclusions.length > 0 && <p className="mt-1 text-xs">Exclude: {s.exclusions.join(", ")}</p>}
        </Row>
        <Row title="Contact quantity" step={2} onEdit={onEdit} empty={!qtyLabel(s)}>{qtyLabel(s)} contacts requested</Row>
        <Row title="Data fields" step={2} onEdit={onEdit} empty={fields.length === 0}>{chips(fields)}</Row>
        {s.instructions.trim() && <Row title="Special instructions" step={2} onEdit={onEdit} empty={false}><span className="whitespace-pre-wrap">{s.instructions}</span></Row>}
      </dl>
      <p className="mt-3 text-xs">Final availability and pricing are confirmed after review.</p>
    </div>
  );
}

/** One line for the collapsed mobile bar. */
export function summaryLine(s: WizardState): string {
  const parts = [s.industries.length ? `${s.industries.length} industr${s.industries.length === 1 ? "y" : "ies"}` : "", s.locations.length ? `${s.locations.length} location${s.locations.length === 1 ? "" : "s"}` : "", qtyLabel(s) ? `${qtyLabel(s)} contacts` : ""].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Nothing added yet";
}
