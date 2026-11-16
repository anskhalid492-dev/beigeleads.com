import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { legalBySlug, legalDocs } from "@/lib/legal/docs";

// NEEDS LAWYER REVIEW: every document is a draft (lib/legal/docs.ts). Remove noindex only after review.
export const dynamicParams = false;

export function generateStaticParams() {
  return legalDocs.map((d) => ({ doc: d.slug }));
}

export async function generateMetadata(props: PageProps<"/legal/[doc]">): Promise<Metadata> {
  const { doc } = await props.params;
  const d = legalBySlug[doc];
  return d
    ? { title: d.title, description: d.summary, alternates: { canonical: `/legal/${doc}` }, robots: { index: false, follow: true } }
    : {};
}

export default async function LegalDocPage(props: PageProps<"/legal/[doc]">) {
  const { doc } = await props.params;
  const d = legalBySlug[doc];
  if (!d) notFound();
  return <LegalPage doc={d} />;
}
