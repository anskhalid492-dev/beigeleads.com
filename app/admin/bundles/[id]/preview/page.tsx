import { getCloudflareContext } from "@opennextjs/cloudflare";
import { notFound } from "next/navigation";
import { BundleDetail } from "@/components/bundles/bundle-detail";
import { hydrateCatalog } from "@/lib/catalog-db";
import { getDbFromEnv } from "@/lib/db";
import { ctxOf } from "@/lib/bundles/public";
import { getBundleById, priceBundle } from "@/lib/bundles/store";
import { gate } from "../../gate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bundle preview", robots: { index: false, follow: false } };
export default async function PreviewBundle({ params }: { params: Promise<{ id: string }> }) {
  await gate();
  const env = getCloudflareContext().env;
  await hydrateCatalog(env);
  const b = await getBundleById(getDbFromEnv(env), Number((await params).id));
  if (!b) notFound();
  return <BundleDetail bundle={priceBundle(b, ctxOf(env))} related={[]} preview status={b.status} />;
}
