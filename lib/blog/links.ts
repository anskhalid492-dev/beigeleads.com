import { getCategories, getProducts } from "@/lib/catalog";
import { comparisons } from "@/lib/compare-data";
import { helpArticles, articleHref } from "@/lib/help";
import { solutions } from "@/lib/solutions";
import type { InternalTarget } from "./seo";

/** Real internal pages, for link suggestions in the editor. Built from site data, never invented. */
export function internalTargets(): InternalTarget[] {
  return [
    { url: "/lists", title: "Browse all lists", keywords: ["business contact lists", "contact list", "email list", "email database"] },
    { url: "/custom-list", title: "Custom list builder", keywords: ["custom list", "custom database"] },
    { url: "/sample", title: "Request a free sample", keywords: ["free sample", "masked sample"] },
    { url: "/verification", title: "How we verify data", keywords: ["email verification", "smtp", "verified emails"] },
    { url: "/data-sources", title: "Where the data comes from", keywords: ["data sources", "data source"] },
    ...getCategories().map((c) => ({ url: `/lists/${c.slug}`, title: `${c.name} lists`, keywords: [c.name, c.singular] })),
    ...getProducts().map((p) => ({ url: `/product/${p.slug}`, title: p.name, keywords: [p.name] })),
    ...solutions.map((s) => ({ url: `/solutions/${s.slug}`, title: s.name, keywords: [s.name] })),
    ...comparisons.map((c) => ({ url: `/compare/beigeleads-vs-${c.slug}`, title: `BeigeLeads vs ${c.name}`, keywords: [c.name] })),
    ...helpArticles.slice(0, 60).map((a) => ({ url: articleHref(a), title: a.title, keywords: [] })),
  ];
}
