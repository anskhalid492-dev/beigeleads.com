import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { Runner } from "./runner";

export const dynamic = "force-dynamic";

export default async function ReorganizePage() {
  await guardAdmin();
  return (
    <>
      <PageHeader title="Reorganize General Targeted Lists" text="Move local business, healthcare, webmail and crypto lists out of General Targeted Lists into their own categories. Only the category changes (ID, URL, price, packages, files and SEO stay). Unclear products are only flagged. Every batch can be rolled back." actions={<Link href="/admin/products" className="text-sm underline">Back to products</Link>} />
      <Runner />
    </>
  );
}
