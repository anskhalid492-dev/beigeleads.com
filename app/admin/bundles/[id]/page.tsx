import { getCloudflareContext } from "@opennextjs/cloudflare";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { hydrateCatalog } from "@/lib/catalog-db";
import { getProduct, offeredPackages } from "@/lib/catalog";
import { getDbFromEnv } from "@/lib/db";
import { getBundleById, loadCategories } from "@/lib/bundles/store";
import { gate } from "../gate";
import { BundleForm } from "../form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit bundle", robots: { index: false, follow: false } };
export default async function EditBundle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await gate();
  const env = getCloudflareContext().env;
  await hydrateCatalog(env);
  const db = getDbFromEnv(env);
  const b = await getBundleById(db, Number((await params).id));
  if (!b) notFound();
  const cats = await loadCategories(db);
  const items = b.items.map((i) => { const p = getProduct(i.slug); const k = p ? offeredPackages(p).find((x) => x.name === i.pkg) : undefined; return { slug: i.slug, pkg: i.pkg, name: p?.name ?? `${i.slug} (not in catalog)`, priceCents: k?.priceUsdCents ?? 0 }; });
  return (
    <>
      <PageHeader title={b.name} text="Changes to a published bundle go live within a minute." />
      {(await searchParams).created && <p role="status" className="mb-4 rounded-xl bg-forest-100 px-4 py-2.5 text-sm font-medium text-forest-900">Bundle created.</p>}
      <BundleForm categories={cats} initial={{ id: b.id, name: b.name, slug: b.slug, shortDescription: b.shortDescription, description: b.description, categorySlug: b.categorySlug, label: b.label, image: b.image, items, priceMode: b.priceMode, discountPercent: String(b.discountPercent), fixedPrice: b.fixedPriceCents ? String(b.fixedPriceCents / 100) : "", featured: b.featured, status: b.status, excluded: b.excluded, seoTitle: b.seoTitle, metaDescription: b.metaDescription, sortOrder: String(b.sortOrder) }} />
    </>
  );
}
