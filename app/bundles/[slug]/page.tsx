import type { Metadata } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { notFound } from "next/navigation";
import { BundleDetail } from "@/components/bundles/bundle-detail";
import { loadBundleView } from "@/lib/bundles/public";

import { fitMeta } from "@/lib/seo/fit";
export const dynamic = "force-dynamic";

async function generateMetadataRaw({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const v = await loadBundleView(getCloudflareContext().env, (await params).slug);
  if (!v) return { title: "Bundle not found", robots: { index: false, follow: false } };
  const { def, bundle } = v;
  const title = def.seoTitle || `${def.name}: Database Bundle`;
  const description = def.metaDescription || def.shortDescription || `${def.name}: ${bundle.components.length} BeigeLeads databases in one purchase.`;
  const image = def.image || undefined;
  return {
    title: { absolute: title }, description, alternates: { canonical: `/bundles/${def.slug}` },
    ...(bundle.components.some((c) => !c.available) ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: `/bundles/${def.slug}`, type: "website", ...(image ? { images: [image] } : {}) },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const v = await loadBundleView(getCloudflareContext().env, (await params).slug);
  if (!v) notFound();
  return <BundleDetail bundle={v.bundle} related={v.related} />;
}

export async function generateMetadata(...args: Parameters<typeof generateMetadataRaw>) { return fitMeta(await generateMetadataRaw(...args)); }
