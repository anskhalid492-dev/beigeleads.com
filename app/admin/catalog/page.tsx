import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { getCategories } from "@/lib/catalog";
import { allCountryRows, loadConsumerCategories, loadSubindustries } from "@/lib/catalog-extra";
import { getDbFromEnv } from "@/lib/db";
import { addConsumerAction, addCountryAction, addSubindustryAction, deleteConsumerAction, deleteCountryAction, deleteSubindustryAction, toggleCountryAction, updateConsumerAction, updateSubindustryAction } from "./actions";

export const dynamic = "force-dynamic";
const f = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
const l = "mb-1 block text-xs font-bold text-forest-900";
const link = "text-sm font-semibold underline";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await guardAdmin();
  const sp = await searchParams;
  const db = getDbFromEnv(getCloudflareContext().env);
  const [countries, subs, consumers] = await Promise.all([allCountryRows(db), loadSubindustries(db, false), loadConsumerCategories(db)]);
  const cats = getCategories();
  const catName = new Map(cats.map((c) => [c.slug, c.name]));
  return (
    <>
      <PageHeader title="Catalog: countries, sub-industries, consumer categories" text="Add the building blocks of the catalog. Industries and ready-made products still live in code. Nothing here creates a product, a price or a record count." />
      {!countries.ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Migration 0030 is not applied yet. Nothing can be saved until it is.</p>}
      {sp.error && <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">{sp.error}</p>}
      {sp.saved && <p role="status" className="mb-5 rounded-xl bg-forest-100 px-4 py-3 text-sm text-forest-900">{sp.saved}</p>}

      <div className="space-y-6">
        <Panel title="Countries">
          <form action={addCountryAction} className="grid gap-3 p-5 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
            <div><label className={l} htmlFor="c-name">Country name</label><input id="c-name" name="name" required className={f} placeholder="Germany" /></div>
            <div><label className={l} htmlFor="c-code">2-letter code</label><input id="c-code" name="code" required maxLength={2} className={f} placeholder="DE" /></div>
            <Button type="submit">Add country</Button>
          </form>
          <p className="px-5 pb-3 text-xs">Adding a country makes its place pages, the Geography import and the shop country list work. It does not create a product. The data must be lawfully sourced for that country: this site currently sells US data only.</p>
          <ul className="divide-y divide-sand-200 border-t border-sand-200">
            {countries.rows.map((c) => (
              <li key={c.slug} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <span className="font-semibold text-forest-900">{c.name}</span><span className="font-mono text-xs">{c.code} · /{c.slug}</span>
                {c.builtIn ? <Badge tone="mute">Built in</Badge> : c.enabled ? <Badge tone="good">Visible</Badge> : <Badge tone="warn">Hidden</Badge>}
                {!c.builtIn && (
                  <span className="ml-auto flex gap-4">
                    <form action={toggleCountryAction}><input type="hidden" name="slug" value={c.slug} /><input type="hidden" name="enable" value={c.enabled ? "0" : "1"} /><button type="submit" className={link}>{c.enabled ? "Hide" : "Show"}</button></form>
                    <form action={deleteCountryAction}><input type="hidden" name="slug" value={c.slug} /><button type="submit" className={`${link} text-red-800`}>Delete</button></form>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Sub-industries">
          <form action={addSubindustryAction} className="grid gap-3 p-5 sm:grid-cols-[1fr_1.5fr_2fr_auto] sm:items-end">
            <div><label className={l} htmlFor="s-cat">Industry</label><select id="s-cat" name="category" required className={f}>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
            <div><label className={l} htmlFor="s-name">Name</label><input id="s-name" name="name" required className={f} placeholder="Orthodontists" /></div>
            <div><label className={l} htmlFor="s-d">Short description (optional)</label><input id="s-d" name="description" className={f} /></div>
            <Button type="submit">Add</Button>
          </form>
          <p className="px-5 pb-3 text-xs">On the public shop, a sub-industry is a niche people can request through the custom list builder. It is never shown as a ready-made list.</p>
          {subs.rows.length === 0 ? <div className="border-t border-sand-200"><Empty title="No sub-industries yet" /></div> : (
            <ul className="divide-y divide-sand-200 border-t border-sand-200">
              {subs.rows.map((s) => (
                <li key={s.id} className="px-5 py-3">
                  <form action={updateSubindustryAction} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="id" value={s.id} />
                    <span className="w-28 text-xs font-bold text-forest-900">{catName.get(s.categorySlug)}</span>
                    <input name="name" defaultValue={s.name} aria-label="Name" className={`${f} max-w-48`} />
                    <input name="description" defaultValue={s.description} aria-label="Description" className={`${f} max-w-xs`} />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={s.enabled} />Visible</label>
                    <Button type="submit" size="sm" variant="secondary">Save</Button>
                  </form>
                  <form action={deleteSubindustryAction} className="mt-1"><input type="hidden" name="id" value={s.id} /><button type="submit" className={`${link} text-red-800`}>Delete</button></form>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Consumer (B2C) categories">
          <form action={addConsumerAction} className="grid gap-3 p-5 sm:grid-cols-[1.5fr_2fr_auto] sm:items-end">
            <div><label className={l} htmlFor="b-name">Name</label><input id="b-name" name="name" required className={f} /></div>
            <div><label className={l} htmlFor="b-d">Short description (optional)</label><input id="b-d" name="description" className={f} /></div>
            <Button type="submit">Add</Button>
          </form>
          <p className="mx-5 mb-4 rounded-xl bg-amber-100 px-4 py-3 text-xs text-amber-900">Consumer categories are for planning only. The public shop keeps showing &ldquo;Consumer databases are not available yet&rdquo; until you decide the privacy and consent rules for selling consumer data. &ldquo;Visible&rdquo; is stored, but nothing public reads it yet.</p>
          {consumers.rows.length === 0 ? <div className="border-t border-sand-200"><Empty title="No consumer categories yet" /></div> : (
            <ul className="divide-y divide-sand-200 border-t border-sand-200">
              {consumers.rows.map((s) => (
                <li key={s.id} className="px-5 py-3">
                  <form action={updateConsumerAction} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="id" value={s.id} />
                    <input name="name" defaultValue={s.name} aria-label="Name" className={`${f} max-w-48`} />
                    <input name="description" defaultValue={s.description} aria-label="Description" className={`${f} max-w-xs`} />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={s.enabled} />Ready to show</label>
                    <Button type="submit" size="sm" variant="secondary">Save</Button>
                  </form>
                  <form action={deleteConsumerAction} className="mt-1"><input type="hidden" name="id" value={s.id} /><button type="submit" className={`${link} text-red-800`}>Delete</button></form>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
