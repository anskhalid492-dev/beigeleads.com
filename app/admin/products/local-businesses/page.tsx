import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { Runner } from "./runner";
import { StandardRunner } from "./standard-runner";

export const dynamic = "force-dynamic";

export default async function LocalBusinessesMovePage() {
  await guardAdmin();
  return (
    <>
      <PageHeader title="Local Businesses Database" text="Move existing local-business lists into the Local Businesses Database category. Nothing is created, copied or deleted; only the category changes, and every batch can be rolled back." actions={<Link href="/admin/products" className="text-sm underline">Back to products</Link>} />
      <Runner />
      <StandardRunner />
    </>
  );
}
