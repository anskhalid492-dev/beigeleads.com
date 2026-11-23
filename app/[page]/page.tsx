import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/shared/coming-soon";

import { fitMeta } from "@/lib/seo/fit";
// Placeholder pages so navigation never 404s. Each is replaced by a real page in a later phase
// (pricing/compare/use-cases/blog/etc.: phase 5).
const pages: Record<string, { title: string; note: string }> = {
  compare: { title: "Compare", note: "Honest comparisons with other list providers are being written." },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(pages).map((page) => ({ page }));
}

async function generateMetadataRaw(props: PageProps<"/[page]">): Promise<Metadata> {
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

export async function generateMetadata(...args: Parameters<typeof generateMetadataRaw>) { return fitMeta(await generateMetadataRaw(...args)); }
