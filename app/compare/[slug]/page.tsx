import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/shared/coming-soon";
import { competitors, compareHref, compareTitle } from "@/lib/compare";

// Stub until the real comparison is written. Slug format: beigeleads-vs-<competitor>.
export const dynamicParams = false;

const find = (slug: string) => competitors.find((c) => `beigeleads-vs-${c.slug}` === slug);

export function generateStaticParams() {
  return competitors.map((c) => ({ slug: `beigeleads-vs-${c.slug}` }));
}

export async function generateMetadata(props: PageProps<"/compare/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = find(slug);
  return c ? { title: compareTitle(c.name), robots: { index: false, follow: true } } : {};
}

export default async function ComparePage(props: PageProps<"/compare/[slug]">) {
  const { slug } = await props.params;
  const c = find(slug);
  if (!c) notFound();
  return (
    <ComingSoon
      title={compareTitle(c.name)}
      note="An honest side-by-side comparison is being written."
      crumbs={[{ name: "Compare", href: "/compare" }, { name: compareTitle(c.name), href: compareHref(c.slug) }]}
    />
  );
}
