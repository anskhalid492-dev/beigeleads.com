import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { loadAll } from "@/lib/help/store";
import { ImportButton } from "../controls";
import { TopicManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function HelpTopics() {
  await guardAdmin();
  const all = await loadAll(getCloudflareContext().env);
  if (!all) return <><PageHeader title="Help topics" /><p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">Run migration 0021_help_cms.sql in D1, then import the built-in content.</p><div className="mt-4"><ImportButton /></div></>;
  return (
    <>
      <PageHeader title="Help topics" text="Topics are the cards on the Help Center home page. The order here is the order on the site." />
      <TopicManager topics={all.categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name, description: c.description, icon: c.icon, status: c.status ?? "published", articles: all.articles.filter((a) => a.category === c.slug).length }))} />
    </>
  );
}
