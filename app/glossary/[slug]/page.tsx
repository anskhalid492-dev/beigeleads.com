import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { TermPage } from "@/components/glossary/term-page";
import { getDbFromEnv } from "@/lib/db";
import { buildView, isThin, seoOf } from "@/lib/glossary/public";
import { publishedBySlug } from "@/lib/glossary/store";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
const load = async (slug: string) => publishedBySlug(getDbFromEnv(getCloudflareContext().env), slug);

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = await load((await props.params).slug);
  if (!t) return { title: "Term not found", robots: { index: false } };
  const { title, description } = seoOf(t);
  return {
    title, description, alternates: { canonical: `/glossary/${t.slug}` },
    // Thin pages stay out of search results. The site-wide noindex still applies to everything until launch.
    ...(isThin(t) ? { robots: { index: false, follow: true } } : {}),
    openGraph: { type: "article", siteName: SITE_NAME, title, description, url: `${SITE_URL}/glossary/${t.slug}` },
  };
}

export default async function GlossaryTermPage(props: { params: Promise<{ slug: string }> }) {
  const t = await load((await props.params).slug);
  if (!t) notFound();
  return <TermPage v={await buildView(getDbFromEnv(getCloudflareContext().env), t)} />;
}
