import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { createCaseStudyAction } from "../../blog/actions";

export const dynamic = "force-dynamic";

export default async function NewCaseStudy() {
  await guardAdmin();
  return (
    <>
      <PageHeader title="New case study" text="This creates an empty draft and opens the editor. Nothing is public until you publish it. Real customer stories need the customer's permission; label any example that is not a real customer as illustrative." />
      <form action={createCaseStudyAction}><Button type="submit">Create draft</Button></form>
    </>
  );
}
