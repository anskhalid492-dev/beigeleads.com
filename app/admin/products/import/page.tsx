import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { Wizard } from "./wizard";

export const dynamic = "force-dynamic";

export default async function ImportProductsPage() {
  await guardAdmin();
  return (
    <>
      <PageHeader title="Import products" text="Upload a WooCommerce product export (CSV). You see a full preview first. Everything is imported as a draft; nothing goes live until you publish it." actions={<Link href="/admin/products" className="text-sm underline">All products</Link>} />
      <Wizard />
    </>
  );
}
