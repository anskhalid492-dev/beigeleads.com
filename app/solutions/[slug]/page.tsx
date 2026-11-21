import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hydrateCatalog } from "@/lib/catalog-db";
import { SolutionHero } from "@/components/solutions/sections";
import {
  ChallengesPanel, CtaPanel, FaqPanel, FieldsPanel, ListsPanel, OthersPanel, PreviewPanel, ResourcesPanel, StepsPanel, UsePanel, WhyPanel,
} from "@/components/solutions/blocks";
import { getSolution, solutions } from "@/lib/solutions";

import { fitMeta } from "@/lib/seo/fit";
// One reusable template for every solution. All copy lives in lib/solutions.ts.
// Indexability follows the site-wide setting in app/layout.tsx (noindex until launch).
export const dynamic = "force-dynamic"; // reads the real sample (D1/KV)

async function generateMetadataRaw(props: PageProps<"/solutions/[slug]">): Promise<Metadata> {
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
  await hydrateCatalog();
  const s = getSolution(slug);
  if (!s) notFound();
  return (
    <>
      <SolutionHero s={s} />
      <div className="space-y-6 bg-sand-100 py-6 sm:py-8">
        <PreviewPanel s={s} />
        <FieldsPanel s={s} />
        <WhyPanel s={s} />
        <StepsPanel s={s} />
        <ListsPanel s={s} />
        <UsePanel s={s} />
        <ChallengesPanel s={s} />
        <OthersPanel s={s} />
        <ResourcesPanel />
        <FaqPanel name={s.name} items={s.faqs} />
        <CtaPanel heading={s.finalHeading} text={s.finalText} />
      </div>
    </>
  );
}

export async function generateMetadata(...args: Parameters<typeof generateMetadataRaw>) { return fitMeta(await generateMetadataRaw(...args)); }
