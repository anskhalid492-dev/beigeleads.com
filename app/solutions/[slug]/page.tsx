import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Applications, AvailableData, Beneficiaries, Challenge, PainPoints, RecommendedDatabases, RelatedSolutions, SolutionCta, SolutionFaq, SolutionHero, SolutionSteps,
} from "@/components/solutions/sections";
import { getSolution, solutions } from "@/lib/solutions";

// One reusable template for every solution. All copy lives in lib/solutions.ts.
// Indexability follows the site-wide setting in app/layout.tsx (noindex until launch).
export const dynamicParams = false;

export function generateStaticParams() {
  return solutions.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: PageProps<"/solutions/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const s = getSolution(slug);
  if (!s) return {};
  return {
    title: s.seoTitle,
    description: s.seoDescription,
    alternates: { canonical: `/solutions/${s.slug}` },
    openGraph: { title: s.seoTitle, description: s.seoDescription, url: `/solutions/${s.slug}` },
  };
}

export default async function SolutionPage(props: PageProps<"/solutions/[slug]">) {
  const { slug } = await props.params;
  const s = getSolution(slug);
  if (!s) notFound();
  return (
    <>
      <SolutionHero s={s} />
      <Challenge s={s} />
      <PainPoints s={s} />
      <RecommendedDatabases s={s} heading={`Recommended databases for ${s.name}`} />
      <Applications s={s} />
      <Beneficiaries s={s} />
      <AvailableData s={s} />
      <SolutionSteps s={s} />
      <RelatedSolutions s={s} />
      <SolutionFaq name={s.name} items={s.faqs} />
      <SolutionCta heading={s.finalHeading} text={s.finalText} />
    </>
  );
}
