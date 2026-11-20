import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { Runner } from "./runner";

export const dynamic = "force-dynamic";

export default async function SeoRegenPage() {
  await guardAdmin();
  return (
    <>
      <PageHeader title="SEO regeneration" text="Rebuild product slugs, names (H1) and SEO titles / descriptions from each product's own data. Old addresses keep working through permanent redirects." actions={<Link href="/admin/products" className="text-sm underline">Back to products</Link>} />
      <Runner />
    </>
  );
}
