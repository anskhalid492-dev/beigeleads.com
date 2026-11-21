import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { getDbFromEnv } from "@/lib/db";
import { loadCategories } from "@/lib/bundles/store";
import { gate } from "../gate";
import { BundleForm, EMPTY_BUNDLE } from "../form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New bundle", robots: { index: false, follow: false } };
export default async function NewBundle() {
  await gate();
  const cats = await loadCategories(getDbFromEnv(getCloudflareContext().env));
  return (<><PageHeader title="Create bundle" text="Save as a draft first, preview it, then publish." /><BundleForm initial={EMPTY_BUNDLE} categories={cats} /></>);
}
