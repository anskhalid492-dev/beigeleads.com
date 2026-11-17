import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardBlog } from "@/lib/admin/guard";
import { createAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewArticle() {
  await guardBlog();
  return (
    <>
      <PageHeader title="New article" text="This creates an empty draft and opens the editor. Nothing is public until you publish it." />
      <form action={createAction}><Button type="submit">Create draft</Button></form>
    </>
  );
}
