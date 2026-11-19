import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { createGuideAction } from "../../blog/actions";

export const dynamic = "force-dynamic";

export default async function NewGuide() {
  await guardAdmin();
  return (
    <>
      <PageHeader title="New guide" text="This creates an empty draft and opens the editor. Nothing is public until you publish it." />
      <form action={createGuideAction}><Button type="submit">Create draft</Button></form>
    </>
  );
}
