import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { loadLlms } from "@/lib/site-links/store";
import { LlmsEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function Page() {
  await guardAdmin();
  const s = await loadLlms(getCloudflareContext().env);
  return (
    <>
      <PageHeader title="AI Information (llms.txt)" text="The plain-text summary served at /llms.txt for AI tools. It does not guarantee that any AI service uses it, cites it or recommends BeigeLeads." />
      <LlmsEditor draft={s.draft} published={s.published} publishedAt={s.publishedAt} publishedBy={s.publishedBy} revisions={s.revisions.map((r) => ({ at: r.at, by: r.by, size: r.text.length }))} />
    </>
  );
}
