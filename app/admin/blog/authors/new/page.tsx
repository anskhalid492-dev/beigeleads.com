import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { AuthorForm, EMPTY_AUTHOR } from "../author-form";

export const dynamic = "force-dynamic";

export default async function NewAuthor() {
  await guardAdmin();
  return (
    <>
      <PageHeader title="Add new author" text="Add a real person who writes for BeigeLeads. Use only true details and a photo you have permission to publish." />
      <AuthorForm id={null} initial={EMPTY_AUTHOR} siteUrl="https://beigeleads.com" />
    </>
  );
}
