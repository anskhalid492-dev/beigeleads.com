import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { findCountry } from "@/lib/catalog-extra";
import { getCategories } from "@/lib/catalog";
import { getChild, getGroup, type TaxChild, type TaxGroup } from "@/lib/taxonomy";

export type TaxRoute = { group: TaxGroup; child?: TaxChild; country?: { slug: string; name: string } };

/** Resolve /lists/<group>[/<child>[/<country>]]. Returns null when the path is not a taxonomy page. */
export async function resolveTax(groupSlug: string, childSlug?: string, countrySlug?: string): Promise<TaxRoute | null> {
  const group = getGroup(groupSlug);
  if (!group) return null;
  if (!childSlug) return { group };
  const child = getChild(group, childSlug);
  if (!child) return null;
  if (!countrySlug) return { group, child };
  const k = await findCountry(getDb(), countrySlug);
  return k ? { group, child, country: { slug: k.slug, name: k.name } } : null;
}

export const taxIndustries = () => getCategories().map((c) => ({ slug: c.slug, name: c.name }));

export function taxMetadata(r: TaxRoute): Metadata {
  const node = r.child ?? r.group;
  const where = r.country ? ` in ${r.country.name}` : "";
  const title = r.child ? `${node.name}${where}: ${r.group.name}` : `${node.name}: business contact lists`;
  const description = `${node.blurb} ${node.status === "available" ? "Masked sample on every list page. Pay once, own the list." : "Not on sale yet: request a custom list."}`.slice(0, 300);
  const path = `/lists/${r.group.slug}${r.child ? `/${r.child.slug}` : ""}${r.country ? `/${r.country.slug}` : ""}`;
  // Only nodes with real products are indexable; upcoming and country-scoped views are thin, so noindex (site-wide noindex still applies until launch).
  const indexable = node.status === "available" && !r.country;
  return { title, description, alternates: { canonical: path }, ...(indexable ? {} : { robots: { index: false, follow: true } }) };
}
