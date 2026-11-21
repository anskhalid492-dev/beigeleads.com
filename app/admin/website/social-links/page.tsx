import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { loadSocial } from "@/lib/site-links/store";
import { SocialEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function Page() {
  await guardAdmin();
  const rows = await loadSocial(getCloudflareContext().env);
  return (
    <>
      <PageHeader title="Social Links" text="Icons in the bottom footer. Only enabled links with a full https address are shown. With no links, no icons appear." />
      <Panel title="Social profiles"><SocialEditor initial={rows} /></Panel>
    </>
  );
}
