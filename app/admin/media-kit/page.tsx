import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getAdminKit } from "@/lib/media-kit/store";
import { ContentForm } from "./content-form";
import { FilesManager } from "./files";

export const dynamic = "force-dynamic";

export default async function AdminMediaKit() {
  await guardAdmin();
  let kit;
  try { kit = await getAdminKit(getCloudflareContext().env); } catch {
    return (<><PageHeader title="Media Kit" /><p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">The Media Kit tables are not set up yet. Run drizzle/0018_media_kit.sql in D1 (two statements, one at a time), then reload this page.</p></>);
  }
  return (
    <>
      <PageHeader title="Media Kit" text="Edit the text on the public Media Kit page and add extra downloads. Changes to the text stay in a draft until you publish." actions={<div className="flex gap-2"><Link href="/admin/media-kit/preview" className="rounded-full border border-sand-300 px-4 py-2 text-sm font-semibold text-forest-900 hover:bg-sand-100">Preview draft</Link><Link href="/media-kit" target="_blank" className="rounded-full border border-sand-300 px-4 py-2 text-sm font-semibold text-forest-900 hover:bg-sand-100">Open public page</Link></div>} />
      <Panel title="Page text"><ContentForm draft={kit.draft} hasDraft={kit.hasDraft} /></Panel>
      <Panel title="Extra downloads" className="mt-6"><FilesManager files={kit.files} /></Panel>
      <Panel title="What cannot be edited here" className="mt-6">
        <ul className="list-disc space-y-1 px-9 py-4 text-sm">
          <li>The official logos, favicons, social images, colors and the four ZIP packs come from the website code, so the logo cannot be replaced by mistake. A logo change is a code change.</li>
          <li>The Media Kit page stays hidden from search engines like the rest of the site until launch.</li>
        </ul>
      </Panel>
    </>
  );
}
