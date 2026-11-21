import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { getDbFromEnv } from "@/lib/db";
import { loadCategories } from "@/lib/bundles/store";
import { gate } from "../gate";
import { CategoryForms } from "./forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bundle categories", robots: { index: false, follow: false } };
export default async function CategoriesPage() {
  await gate();
  const cats = await loadCategories(getDbFromEnv(getCloudflareContext().env));
  return (<><PageHeader title="Bundle categories" text="The filters on /bundles. A category shows to visitors only while it has a published bundle." /><Panel className="p-5"><CategoryForms cats={cats} /></Panel></>);
}
