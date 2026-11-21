import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { loadAi } from "@/lib/site-links/store";
import { AiEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function Page() {
  await guardAdmin();
  const cfg = await loadAi(getCloudflareContext().env);
  return (
    <>
      <PageHeader title="AI Platforms" text="The Ask AI buttons in the bottom footer and the prompt they send." />
      <AiEditor initial={cfg} />
    </>
  );
}
