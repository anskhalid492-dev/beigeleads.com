import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Badge } from "@/components/admin/ui";
import { Body } from "@/components/help/rich";
import { guardAdmin } from "@/lib/admin/guard";
import { loadAll } from "@/lib/help/store";

export const dynamic = "force-dynamic";

/** Shows the SAVED version of an article (draft or published) the way its body renders on the public page. */
export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  await guardAdmin();
  const { id } = await params;
  const all = await loadAll(getCloudflareContext().env);
  const a = all?.articles.find((x) => x.id === Number(id));
  if (!a) notFound();
  return (
    <>
      <PageHeader title="Preview" actions={<Badge tone={a.status === "published" ? "good" : "warn"}>{a.status === "published" ? "Published" : "Draft"}</Badge>} text="The saved version. The public page adds the topic menu, contents list and feedback box around this." />
      <article className="max-w-3xl rounded-2xl border border-sand-200 bg-sand-50 p-6 sm:p-8">
        <h1 className="display text-4xl text-forest-900 sm:text-5xl">{a.title}</h1>
        <p className="mt-3 text-lg text-forest-700">{a.description}</p>
        <div className="mt-6"><Body blocks={a.body} /></div>
      </article>
    </>
  );
}
