import { TAXONOMY } from "@/lib/taxonomy";
import { getCategories, getCountries, getProducts } from "@/lib/catalog";
import { comparisons } from "@/lib/compare-data";
import { articleHref, helpArticles, helpCategories } from "@/lib/help";
import { legalDocs } from "@/lib/legal/docs";
import { solutions } from "@/lib/solutions";

export type SitePage = { path: string; label: string; group: string };

/** Every public page that is built in code. Blog articles have their own editor; country/city pages are not built yet. */
export function sitePages(): SitePage[] {
  const main: [string, string][] = [["/", "Home"], ["/lists", "All lists"], ["/solutions", "Solutions"], ["/compare", "Compare"], ["/how-it-works", "How it works"], ["/sample", "Free sample"], ["/custom-list", "Custom list"], ["/contact", "Contact"], ["/partners", "Data Reseller Partners"], ["/team-purchase-requests", "Team Purchase Requests"], ["/email-verification", "Email Verification"], ["/ai-assistant", "AI Assistant"], ["/request-category", "Request a category"], ["/verification", "Verification"], ["/data-sources", "Data sources"], ["/help-center", "Help Center"], ["/opt-out", "Opt-out"], ["/blog", "Blog home"], ["/guides", "Guides home"], ["/case-studies", "Case studies"], ["/glossary", "Glossary home"], ["/pricing", "Pricing"], ["/about", "About"], ["/bundles", "Bundles"], ["/creators", "Creators"], ["/case-studies", "Case studies"], ["/media-kit", "Media Kit"]];
  return [
    ...main.map(([path, label]) => ({ path, label, group: "Main pages" })),
    ...getCategories().map((c) => ({ path: `/lists/${c.slug}`, label: c.name, group: "List categories" })),
    { path: "/lists/local-businesses-database", label: "Local Businesses Database", group: "List categories" },
    ...TAXONOMY.flatMap((g) => [{ path: `/lists/${g.slug}`, label: g.name, group: "List types" }, ...g.children.map((c) => ({ path: `/lists/${g.slug}/${c.slug}`, label: c.name, group: "List types" }))]),
    ...getCategories().flatMap((c) => getCountries().map((k) => ({ path: `/lists/${c.slug}/${k.slug}`, label: `${c.name} in ${k.name}`, group: "Country pages" }))),
    ...getProducts().map((p) => ({ path: `/lists/${p.slug}`, label: p.name ?? p.slug, group: "Products" })),
    ...solutions.map((s) => ({ path: `/solutions/${s.slug}`, label: s.slug, group: "Solutions" })),
    ...comparisons.map((c) => ({ path: `/compare/beigeleads-vs-${c.slug}`, label: `BeigeLeads vs ${c.slug}`, group: "Comparisons" })),
    ...helpCategories.map((c) => ({ path: `/help/${c.slug}`, label: `Help: ${c.slug}`, group: "Help Center" })),
    ...helpArticles.map((a) => ({ path: articleHref(a), label: a.title, group: "Help Center" })),
    ...legalDocs.map((d) => ({ path: `/legal/${d.slug}`, label: d.title, group: "Legal" })),
  ];
}
export const isSitePage = (path: string) => sitePages().some((p) => p.path === path);
