import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GeoPage } from "@/components/geo/geo-page";
import { loadGeoPage } from "@/lib/geo/page-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ category: string; country: string; geo: string[] }> }): Promise<Metadata> {
  const { category, country, geo } = await props.params;
  const d = await loadGeoPage(category, country, geo);
  if (!d) return {};
  return { title: d.copy.title, description: d.copy.description, alternates: { canonical: d.path }, ...(d.indexable ? {} : { robots: { index: false, follow: true } }) };
}

export default async function GeoRoute(props: { params: Promise<{ category: string; country: string; geo: string[] }> }) {
  const { category, country, geo } = await props.params;
  const d = await loadGeoPage(category, country, geo);
  if (!d) notFound();
  return <GeoPage d={d} />;
}
