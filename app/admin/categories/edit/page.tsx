import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { ICONS, catalogProductOptions, loadTaxonomyAdmin } from "@/lib/taxonomy-store";
import { saveNodeAction } from "../actions";

export const dynamic = "force-dynamic";
const f = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
const l = "mb-1 block text-xs font-bold text-forest-900";

export default async function EditCategory({ searchParams }: { searchParams: Promise<{ id?: string; parent?: string; error?: string }> }) {
  await guardAdmin();
  const sp = await searchParams;
  const { ready, rows } = await loadTaxonomyAdmin(getDbFromEnv(getCloudflareContext().env));
  if (!ready) notFound();
  const row = sp.id ? rows.find((r) => r.id === Number(sp.id)) : undefined;
  if (sp.id && !row) notFound();
  const parent = row ? row.parentSlug : sp.parent ?? "";
  const tops = rows.filter((r) => r.parentSlug === "");
  const mapped = new Set<string>(row ? (JSON.parse(row.productSlugs || "[]") as string[]) : []);
  const products = catalogProductOptions();
  const v = row ?? { name: "", slug: "", menuName: "", icon: "mail", short: "", blurb: "", status: "upcoming", compliance: "", featured: 0, menuVisible: 1, published: 1, seoTitle: "", metaDescription: "", content: "" };
  return (
    <>
      <PageHeader title={row ? `Edit ${row.name}` : parent ? "New subcategory" : "New category"} text={parent ? `Inside ${tops.find((t) => t.slug === parent)?.name ?? parent}.` : "A top-level category in the Lists menu."} actions={<Link href="/admin/categories" className="text-sm font-semibold underline">Back to categories</Link>} />
      {sp.error && <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">{sp.error}</p>}
      <form action={saveNodeAction} className="max-w-3xl space-y-6">
        {row && <input type="hidden" name="id" value={row.id} />}
        <input type="hidden" name="parent" value={parent} />
        <Panel title="Basics"><div className="grid gap-4 p-5 sm:grid-cols-2">
          <div><label className={l} htmlFor="name">Name</label><input id="name" name="name" required maxLength={80} defaultValue={v.name} className={f} /></div>
          <div><label className={l} htmlFor="slug">URL name</label><input id="slug" name="slug" maxLength={60} defaultValue={v.slug} readOnly={!!row} className={`${f} ${row ? "bg-sand-100" : ""}`} placeholder="auto from the name" /><p className="mt-1 text-xs">{row ? "Fixed after creation so links never break." : "Letters, numbers and dashes. Cannot be changed later."}</p></div>
          {!parent && <div><label className={l} htmlFor="menuName">Menu name (optional)</label><input id="menuName" name="menuName" maxLength={40} defaultValue={v.menuName} className={f} /></div>}
          <div><label className={l} htmlFor="icon">Icon</label><select id="icon" name="icon" className={f} defaultValue={v.icon}>{ICONS.map((i) => <option key={i} value={i}>{({ mail: "Envelope", phone: "Phone", message: "WhatsApp", briefcase: "Briefcase", users: "Hierarchy", building: "Buildings", globe: "Globe" } as Record<string, string>)[i] ?? i}</option>)}</select></div>
          <div className="sm:col-span-2"><label className={l} htmlFor="short">Short description (menu)</label><input id="short" name="short" maxLength={120} defaultValue={v.short} className={f} /></div>
          <div className="sm:col-span-2"><label className={l} htmlFor="blurb">Intro (top of the page)</label><textarea id="blurb" name="blurb" rows={3} maxLength={500} defaultValue={v.blurb} className={f} /></div>
        </div></Panel>

        <Panel title="Availability and compliance"><div className="grid gap-4 p-5 sm:grid-cols-2">
          <div><label className={l} htmlFor="status">Status</label><select id="status" name="status" className={f} defaultValue={v.status}><option value="upcoming">Upcoming (not on sale)</option><option value="available">Available (real product mapped)</option></select><p className="mt-1 text-xs">Available needs at least one product below. Never mark empty categories Available.</p></div>
          <div><label className={l} htmlFor="compliance">Special rules</label><select id="compliance" name="compliance" className={f} defaultValue={v.compliance}><option value="">None</option><option value="consumer">Consumer data</option><option value="whatsapp">WhatsApp</option><option value="phone">Phone</option></select><p className="mt-1 text-xs">Shows a consent and privacy note on the page. These categories cannot be Available yet.</p></div>
          <fieldset className="sm:col-span-2"><legend className={l}>Products mapped to this category</legend>
            <ul className="grid gap-1 sm:grid-cols-2">{products.map((p) => <li key={p.slug}><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="products" value={p.slug} defaultChecked={mapped.has(p.slug)} />{p.name}</label></li>)}</ul>
          </fieldset>
        </div></Panel>

        <Panel title="Publishing"><div className="grid gap-3 p-5">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={!!v.published} /> Published (unpublished pages return not found and leave the menu and sitemap)</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="menuVisible" defaultChecked={!!v.menuVisible} /> Show in the Lists menu</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={!!v.featured} /> Featured (shown first in the menu and on its page)</label>
        </div></Panel>

        <Panel title="Page content and SEO"><div className="grid gap-4 p-5">
          <div><label className={l} htmlFor="content">Landing page text (optional)</label><textarea id="content" name="content" rows={8} maxLength={4000} defaultValue={v.content} className={f} /><p className="mt-1 text-xs">Plain text. Separate paragraphs with a blank line. Write only what is true: no counts, prices or accuracy claims you cannot back.</p></div>
          <div><label className={l} htmlFor="seoTitle">SEO title (optional)</label><input id="seoTitle" name="seoTitle" maxLength={120} defaultValue={v.seoTitle} className={f} /></div>
          <div><label className={l} htmlFor="metaDescription">Meta description (optional)</label><textarea id="metaDescription" name="metaDescription" rows={2} maxLength={300} defaultValue={v.metaDescription} className={f} /></div>
          <p className="text-xs">Only Available categories are indexable, and the site-wide noindex stays until launch.</p>
        </div></Panel>
        <div className="flex gap-3"><Button type="submit">Save</Button><Button asChild variant="secondary"><Link href="/admin/categories">Cancel</Link></Button></div>
      </form>
    </>
  );
}
