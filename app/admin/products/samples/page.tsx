import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { hydrateCatalog } from "@/lib/catalog-db";
import { getDefaultSample } from "@/lib/catalog";
import { Bulk } from "./bulk";
import { DefaultSample } from "./default-sample";

export const dynamic = "force-dynamic";

export default async function SamplesPage() {
  await guardAdmin();
  await hydrateCatalog(undefined, true);
  return (
    <>
      <PageHeader title="Bulk samples" text="Upload real rows for many products at once. Emails, phone numbers and house numbers are masked before anything is saved." actions={<Link href="/admin/products" className="text-sm underline">Back to products</Link>} />
      <div className="space-y-6"><DefaultSample current={getDefaultSample().length} /><Bulk /></div>
    </>
  );
}
