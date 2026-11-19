import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { AuditRunner } from "./runner";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await guardAdmin();
  return (
    <>
      <PageHeader title="Site audit" text="Fetches the pages listed in your sitemap, 15 at a time, and checks the HTML. It only visits beigeleads.com pages from the sitemap." />
      <AuditRunner />
    </>
  );
}
