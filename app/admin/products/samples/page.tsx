import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { Bulk } from "./bulk";

export const dynamic = "force-dynamic";

export default async function SamplesPage() {
  await guardAdmin();
  return (
    <>
      <PageHeader title="Bulk samples" text="Upload real rows for many products at once. Emails, phone numbers and house numbers are masked before anything is saved." actions={<Link href="/admin/products" className="text-sm underline">Back to products</Link>} />
      <Bulk />
    </>
  );
}
