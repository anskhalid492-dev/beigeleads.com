import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { loadTaxonomyAdmin } from "@/lib/taxonomy-store";
import { deleteNodeAction, importBuiltInAction, moveAction, togglePublishedAction } from "./actions";

export const dynamic = "force-dynamic";
const link = "text-sm font-semibold underline";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await guardAdmin();
  const sp = await searchParams;
  const { ready, rows } = await loadTaxonomyAdmin(getDbFromEnv(getCloudflareContext().env));
  const sort = (a: { sortOrder: number; id: number }, b: { sortOrder: number; id: number }) => a.sortOrder - b.sortOrder || a.id - b.id;
  const tops = rows.filter((r) => r.parentSlug === "").sort(sort);
  const row = (r: (typeof rows)[number], child: boolean) => (
    <li key={r.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 text-sm ${child ? "pl-10" : "bg-sand-50"}`}>
      <span className="font-semibold text-forest-900">{r.name}</span>
      <span className="font-mono text-xs">/lists/{child ? `${r.parentSlug}/` : ""}{r.slug}</span>
      {r.status === "available" ? <Badge tone="good">Available</Badge> : <Badge tone="mute">Upcoming</Badge>}
      {!r.published && <Badge tone="warn">Unpublished</Badge>}
      {!r.menuVisible && <Badge tone="mute">Not in menu</Badge>}
      {r.featured === 1 && <Badge tone="good">Featured</Badge>}
      {r.compliance && <Badge tone="warn">{r.compliance} rules</Badge>}
      <span className="ml-auto flex flex-wrap items-center gap-4">
        <form action={moveAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="dir" value="up" /><button type="submit" className={link} aria-label={`Move ${r.name} up`}>Up</button></form>
        <form action={moveAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="dir" value="down" /><button type="submit" className={link} aria-label={`Move ${r.name} down`}>Down</button></form>
        <Link href={`/admin/categories/edit?id=${r.id}`} className={link}>Edit</Link>
        <form action={togglePublishedAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="on" value={r.published ? "0" : "1"} /><button type="submit" className={link}>{r.published ? "Unpublish" : "Publish"}</button></form>
        <form action={deleteNodeAction} className="flex items-center gap-1.5"><input type="hidden" name="id" value={r.id} /><label className="flex items-center gap-1 text-xs"><input type="checkbox" name="confirm" /> sure</label><button type="submit" className={`${link} text-red-800`}>Delete</button></form>
      </span>
    </li>
  );
  return (
    <>
      <PageHeader title="List categories" text="The categories behind the Lists menu and the /lists/<category> pages. Available needs a real product mapped to it; consumer, WhatsApp and phone categories stay Upcoming." actions={ready ? <Button asChild><Link href="/admin/categories/edit">New category</Link></Button> : undefined} />
      {!ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Migration 0031 is not applied yet. The site uses the built-in categories and nothing can be saved here until it is.</p>}
      {sp.error && <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">{sp.error}</p>}
      {sp.saved && <p role="status" className="mb-5 rounded-xl bg-forest-100 px-4 py-3 text-sm text-forest-900">{sp.saved}</p>}
      {ready && rows.length === 0 ? (
        <Panel title="Start from the built-in categories">
          <div className="p-5"><p className="max-w-2xl text-sm">The site currently shows the built-in tree. Import it once to edit, reorder, hide or add categories here. Importing never overwrites anything and changes nothing on the live site.</p>
            <form action={importBuiltInAction} className="mt-4"><Button type="submit">Import built-in categories</Button></form></div>
        </Panel>
      ) : ready ? (
        <Panel title="Categories">
          {tops.length === 0 ? <Empty title="No categories" /> : (
            <ul className="divide-y divide-sand-200">
              {tops.map((g) => (
                <li key={g.id} className="list-none"><ul>{row(g, false)}{rows.filter((r) => r.parentSlug === g.slug).sort(sort).map((c) => row(c, true))}
                  <li className="px-5 py-2 pl-10"><Link href={`/admin/categories/edit?parent=${g.slug}`} className={link}>Add a subcategory to {g.name}</Link></li></ul></li>
              ))}
            </ul>
          )}
          <p className="border-t border-sand-200 px-5 py-3 text-xs">Changes reach the public menu and pages within about a minute. URL names cannot be changed after a category is created, so public links never break. Industries with a real product keep their own pages under /lists/&lt;industry&gt;.</p>
        </Panel>
      ) : null}
    </>
  );
}
