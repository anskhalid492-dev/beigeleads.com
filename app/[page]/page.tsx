import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/shared/coming-soon";

// Placeholder pages so navigation never 404s. Each is replaced by a real page in a later phase
// (pricing/compare/use-cases/blog/etc.: phase 5; verification waits for its own decision).
const pages: Record<string, { title: string; note: string }> = {
  pricing: { title: "Pricing", note: "Pricing is published when the first lists go on sale." },
  "how-it-works": { title: "How it works", note: "A full walkthrough is on the way." },
  compare: { title: "Compare", note: "Honest comparisons with other list providers are being written." },
  "custom-list": { title: "Custom list", note: "The custom list builder is on the way." },
  verification: { title: "Verification", note: "Our verification process will be published here before launch." },
  about: { title: "About", note: "This page is being written." },
  bundles: { title: "Bundles", note: "Bundles are on the way." },
  creators: { title: "Creators", note: "Creator and influencer lists are on the way." },
  "use-cases": { title: "Use cases", note: "Use-case guides are being written." },
  "case-studies": { title: "Case studies", note: "Case studies will appear here once we have real ones." },
  blog: { title: "Blog", note: "Guides are on the way." },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(pages).map((page) => ({ page }));
}

export async function generateMetadata(props: PageProps<"/[page]">): Promise<Metadata> {
  const { page } = await props.params;
  const p = pages[page];
  return p ? { title: p.title, robots: { index: false, follow: true } } : {};
}

export default async function StubPage(props: PageProps<"/[page]">) {
  const { page } = await props.params;
  const p = pages[page];
  if (!p) notFound();
  return <ComingSoon title={p.title} note={p.note} crumbs={[{ name: p.title, href: `/${page}` }]} />;
}
