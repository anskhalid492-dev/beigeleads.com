import type { Metadata } from "next";
import { getCountry, getProducts } from "@/lib/catalog";

/** "/lists/germany-business-email-lists" -> the country, only when that country really has business databases in the catalog. */
export function countryFromFlat(slug: string) {
  const m = /^(.+)-business-email-lists$/.exec(slug);
  const k = m ? getCountry(m[1]) : undefined;
  return k && getProducts("business").some((p) => p.countrySlug === k.slug) ? k : undefined;
}

export function geoShopMetadata(k: { slug: string; name: string }, view: "main" | "cities"): Metadata {
  const real = getProducts("business").some((p) => p.countrySlug === k.slug && !p.placeholderData);
  const path = `/lists/${k.slug}-business-email-lists${view === "cities" ? "/cities" : ""}`;
  const title = view === "cities" ? `${k.name} Business Email Lists by City` : `${k.name} Business Email Lists: Full Country and City Databases`;
  const description = view === "cities"
    ? `Browse business email databases for cities across ${k.name}. Each city has its own page with a masked sample.`
    : `Business email databases for ${k.name}: one full-country file or a database for each city. Masked sample on every list page. Pay once, own the list.`;
  // Thin until real counts exist, so noindex (the site-wide noindex also still applies).
  return { title, description, alternates: { canonical: path }, ...(real ? {} : { robots: { index: false, follow: true } }) };
}
