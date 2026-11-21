import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { CHECKED_LABEL } from "@/lib/compare-data";

/**
 * Home: BeigeLeads next to four named data providers. Every provider cell restates a fact from that vendor's OWN
 * pages, as recorded in lib/compare-data.ts (sources + CHECKED date). No accuracy, quality or "better than" claims;
 * where a vendor's page said nothing the cell is left out of the text (never guessed).
 */
// Slugs that have an official logo file at public/compare-logos/<slug>.svg. Add a slug here after adding its file;
// the name is shown for any provider without one.
const LOGOS = new Set<string>([]);
const hasLogo = (slug: string) => LOGOS.has(slug);

type Vendor = { slug: string; name: string; kind: string; cells: [string, string, string, string, string] };

const ROWS = ["How you pay", "Try it first", "Credits and limits", "Plan detail", "Built for"] as const;

const US_CELLS: Vendor["cells"] = [
  "One list, once. Nothing renews and there is nothing to cancel.",
  "Free sample on every list page, no payment details.",
  "No seats and no credits. You get the whole file.",
  "Ready-made US lists; a custom list request if you do not see yours.",
  "A list for one campaign, paid once in crypto with no account.",
];

const VENDORS: Vendor[] = [
  { slug: "apollo", name: "Apollo", kind: "Sales platform", cells: [
    "Subscription, billed monthly or annually (12-month commitment).",
    "A free plan exists.",
    "Credits are pooled across the team, granted each billing cycle and do not roll over.",
    "Exports up to 10,000 leads in one click when no record limit applies.",
    "Searching, enriching and sending sequences in one place.",
  ] },
  { slug: "zoominfo", name: "ZoomInfo", kind: "Go-to-market platform", cells: [
    "Consumption credits based on usage; no fixed seat tiers.",
    "A permanent free plan (ZoomInfo Lite) and a free trial.",
    "Usage-based credits.",
    "Developer access to data through their API.",
    "A full platform with a large database, workflows and API access.",
  ] },
  { slug: "lusha", name: "Lusha", kind: "Contact lookup", cells: [
    "Subscription that renews automatically; cancel any time.",
    "A permanent free plan with up to 40 credits a month.",
    "A verified email costs 1 credit and a phone number costs 5.",
    "Teams of more than 5 users are asked to contact sales.",
    "Looking up individual contacts as you work.",
  ] },
  { slug: "uplead", name: "UpLead", kind: "Credit plans", cells: [
    "Subscription; monthly plans have no long-term commitment.",
    "A 7-day trial with 5 credits.",
    "Essentials: 170 credits a month. Plus: 400 credits a month.",
    "Essentials $99 a month; Plus $199 a month (monthly billing).",
    "A few hundred contacts a month at a published price.",
  ] },
];

export function CompareMatrix() {
  return (
    <section aria-labelledby="vs" className="border-y border-sand-200 bg-sand-100 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <h2 id="vs" className="display text-4xl text-forest-900 sm:text-6xl">One purchase, or a plan you keep paying for?</h2>
          <p className="text-lg">Four well-known data providers next to BeigeLeads. Different tools suit different work: pick by how you prospect, not by the headline price.</p>
        </div>

        {/* The table scrolls inside its own frame on small screens, so the page never scrolls sideways. */}
        <div className="mt-10 overflow-x-auto rounded-[1.6rem] border border-sand-300 bg-white" tabIndex={0} role="region" aria-label="Comparison table, scrolls sideways on small screens">
          <table className="w-full min-w-[56rem] border-separate border-spacing-0 text-left text-[0.93rem] leading-6">
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 w-36 bg-white px-5 py-5" />
                <th scope="col" className="bg-forest-900 px-5 py-5 align-bottom text-sand-50 first:rounded-tl-none">
                  <span className="display block text-2xl leading-none">BeigeLeads</span>
                  <span className="mt-1 block text-sm font-normal text-sand-200">Ready-made lists, bought once</span>
                </th>
                {VENDORS.map((v) => (
                  <th key={v.slug} scope="col" className="px-5 py-5 align-bottom">
                    {hasLogo(v.slug) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/compare-logos/${v.slug}.svg`} alt={v.name} className="h-7 w-auto max-w-[8rem] object-contain object-left" />
                    ) : (
                      <span className="display block text-2xl leading-none text-forest-900">{v.name}</span>
                    )}
                    <span className="mt-1 block text-sm font-normal text-forest-700">{v.kind}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((label, r) => (
                <tr key={label}>
                  <th scope="row" className="sticky left-0 z-10 border-t border-sand-200 bg-white px-5 py-4 align-top font-bold text-forest-900">{label}</th>
                  <td className="border-t border-forest-700 bg-forest-900 px-5 py-4 align-top text-sand-100">
                    <span className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-forest-300" aria-hidden /><span>{US_CELLS[r]}</span></span>
                  </td>
                  {VENDORS.map((v) => (
                    <td key={v.slug} className="border-t border-sand-200 px-5 py-4 align-top">{v.cells[r]}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row" className="sticky left-0 z-10 rounded-bl-[1.6rem] border-t border-sand-200 bg-white px-5 py-4 align-top font-bold text-forest-900">Full comparison</th>
                <td className="border-t border-forest-700 bg-forest-900 px-5 py-4" />
                {VENDORS.map((v) => (
                  <td key={v.slug} className="border-t border-sand-200 px-5 py-4">
                    <Link href={`/compare/beigeleads-vs-${v.slug}`} className="inline-flex items-center gap-1.5 font-semibold text-forest-900 underline underline-offset-4 hover:text-purple-700">BeigeLeads vs {v.name} <ArrowRight className="size-4" aria-hidden /></Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.4rem] border border-sand-300 bg-white p-6">
            <h3 className="text-lg font-bold text-forest-900">A platform may fit better if</h3>
            <p className="mt-2">You prospect every week, want search, enrichment and sequences in one tool, or need ongoing updates inside your CRM.</p>
          </div>
          <div className="rounded-[1.4rem] bg-forest-900 p-6 text-sand-100">
            <h3 className="text-lg font-bold text-sand-50">BeigeLeads fits better if</h3>
            <p className="mt-2">You need a list for one campaign, want to inspect a sample first, and prefer to pay once instead of renewing.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p>Provider details come from each provider&apos;s own public pages, checked {CHECKED_LABEL}. Plans and prices change, and BeigeLeads is a competitor of these providers.</p>
          <Link href="/compare" className="inline-flex items-center gap-2 font-semibold text-forest-900 underline underline-offset-4 hover:text-purple-700">See all comparisons <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      </div>
    </section>
  );
}
