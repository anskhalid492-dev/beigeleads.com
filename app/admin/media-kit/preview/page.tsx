import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { MediaKitView } from "@/components/media-kit/media-kit-view";
import { guardAdmin } from "@/lib/admin/guard";
import { getAdminKit } from "@/lib/media-kit/store";

export const dynamic = "force-dynamic";

export default async function Preview() {
  await guardAdmin();
  const kit = await getAdminKit(getCloudflareContext().env);
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-purple-100 p-3 text-sm text-forest-900">
        <span><b>Draft preview.</b> Visitors see this only after you publish. Hidden files are shown here too.</span>
        <Link href="/admin/media-kit" className="font-semibold underline">Back to editing</Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-sand-200"><MediaKitView preview content={kit.draft} files={kit.files} /></div>
    </>
  );
}
