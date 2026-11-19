import type { Metadata } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { MediaKitView } from "@/components/media-kit/media-kit-view";
import { getPublishedKit } from "@/lib/media-kit/store";

export const dynamic = "force-dynamic"; // reads one cached value (published text and extra files)

export const metadata: Metadata = {
  title: { absolute: "BeigeLeads Media Kit | Official Logos & Brand Assets" },
  description: "Download official BeigeLeads logos (SVG and PNG), favicons, social images, brand colors and guidelines.",
  alternates: { canonical: "/media-kit" },
  // Site-wide noindex stays until launch (see CLAUDE.md); the page-level setting must not override it.
  robots: { index: false, follow: false },
  openGraph: { title: "BeigeLeads Media Kit", description: "Official logos, colors and brand assets.", url: "/media-kit", images: ["/brand/social/beigeleads-og-1200x630.png"] },
};


export default async function MediaKitPage() {
  const kit = await getPublishedKit(getCloudflareContext().env);
  return <MediaKitView content={kit.content} files={kit.files} />;
}
