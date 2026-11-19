import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { contentWarnings, getGeoContent } from "@/lib/geo/page-content";
import { geoPageList } from "@/lib/geo/store";
import { saveGeoContentAction } from "../actions";

export const dynamic = "force-dynamic";
const f = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
const l = "mb-1 block text-xs font-bold text-forest-900";

export default async function EditGeoPage({ searchParams }: { searchParams: Promise<{ path?: string; error?: string; saved?: string }> }) {
  await guardAdmin();
  const sp = await searchParams;
  const db = getDbFromEnv(getCloudflareContext().env);
  const page = (await geoPageList(db)).find((p) => p.path === sp.path);
  if (!page) notFound();
  const c = await getGeoContent(db, page.path);
  const warn = contentWarnings(c, page.label);
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/geography/pages" className="underline">Geography pages</Link> / {page.label}</p>
      <PageHeader title={page.label} text="Changes appear on the public page within about a minute. The page stays noindex until the place has real recorded inventory." actions={<Link className="text-sm underline" href={page.path} target="_blank">Open page</Link>} />
      {sp.error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">{sp.error}</p>}
      {sp.saved && <p role="status" className="mb-4 rounded-xl bg-forest-100 px-4 py-3 text-sm text-forest-900">Saved.</p>}
      <Panel>
        <form action={saveGeoContentAction} className="space-y-4 p-5">
          <input type="hidden" name="path" value={page.path} />
          <div><label className={l} htmlFor="t">SEO title</label><input id="t" name="seoTitle" defaultValue={c.seoTitle} maxLength={90} className={f} /><p className="mt-1 text-xs">About 60 characters. Leave empty for the generated title.</p></div>
          <div><label className={l} htmlFor="m">Meta description</label><textarea id="m" name="metaDescription" rows={2} defaultValue={c.metaDescription} maxLength={200} className={f} /><p className="mt-1 text-xs">About 150 to 160 characters.</p></div>
          <div><label className={l} htmlFor="i">Intro paragraph</label><textarea id="i" name="intro" rows={5} defaultValue={c.intro} maxLength={900} className={f} /><p className="mt-1 text-xs">Plain text. Only state facts you can back with recorded data. No invented numbers.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={l} htmlFor="p">Primary keyword</label><input id="p" name="primaryKeyword" defaultValue={c.primaryKeyword} className={f} /></div>
            <div><label className={l} htmlFor="s">Secondary keywords (comma separated)</label><input id="s" name="secondaryKeywords" defaultValue={c.secondaryKeywords} className={f} /></div>
          </div>
          {warn.length > 0 && <ul className="list-disc rounded-xl bg-amber-100 py-3 pl-8 pr-4 text-sm text-amber-900">{warn.map((w) => <li key={w}>{w}</li>)}</ul>}
          <Button type="submit">Save</Button>
          <p className="text-xs">Saving with every field empty resets this page to the generated text.</p>
        </form>
      </Panel>
    </>
  );
}
