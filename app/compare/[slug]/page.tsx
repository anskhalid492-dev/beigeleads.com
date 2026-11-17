import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComparePage } from "@/components/compare/compare-page";
import { compareHref, compareTitle } from "@/lib/compare";
import { comparisonBySlug, comparisons } from "@/lib/compare-data";

// Slug format: beigeleads-vs-<competitor>. Content and sources live in lib/compare-data.ts.
export const dynamicParams = false;

const find = (slug: string) => comparisonBySlug[slug.replace(/^beigeleads-vs-/, "")];

export function generateStaticParams() {
  return comparisons.map((c) => ({ slug: `beigeleads-vs-${c.slug}` }));
}

export async function generateMetadata(props: PageProps<"/compare/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = find(slug);
  if (!c) return {};
  return {
    title: `${compareTitle(c.name)}: ${c.name} alternative for one-time contact lists`,
    description: `${compareTitle(c.name)}. See how buying a ready-made B2B contact list once, with a free masked sample and no subscription, compares with ${c.name}.`,
    alternates: { canonical: compareHref(c.slug) },
  };
}

export default async function CompareRoute(props: PageProps<"/compare/[slug]">) {
  const { slug } = await props.params;
  const c = find(slug);
  if (!c) notFound();
  return <ComparePage c={c} />;
}
