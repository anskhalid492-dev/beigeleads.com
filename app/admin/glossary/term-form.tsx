"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { autoMeta, autoTitle } from "@/lib/glossary/clean";
import { saveTermAction, type FormState } from "./actions";

type Init = { id?: number; status?: "draft" | "published"; term: string; slug: string; category: string; shortDefinition: string; content: string; whyItMatters: string; example: string; relatedTerms: string; relatedGuides: string; relatedProducts: string; seoTitle: string; metaDescription: string; keywords: string; featured: boolean };
const f = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600";
const l = "mb-1 block text-xs font-bold text-forest-900";
const hint = "mt-1 text-xs";

export function TermForm({ init, categories }: { init: Init; categories: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTermAction, null);
  const [v, setV] = useState(init);
  const set = (k: keyof Init) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  const title = v.seoTitle || autoTitle(v.term || "Term"); const meta = v.metaDescription || autoMeta(v.shortDefinition || "");
  const published = init.status === "published";
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {init.id && <input type="hidden" name="id" value={init.id} />}
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="term" className={l}>Term *</label><input id="term" name="term" required maxLength={120} value={v.term} onChange={set("term")} className={f} /></div>
          <div><label htmlFor="slug" className={l}>Slug (URL)</label><input id="slug" name="slug" maxLength={90} value={v.slug} onChange={set("slug")} placeholder="made from the term when empty" className={f} />{published && <p className={hint}>Changing the slug of a published entry breaks its old link. Add a redirect in SEO &gt; Redirects.</p>}</div>
        </div>
        <div><label htmlFor="shortDefinition" className={l}>Short definition * <span className="font-normal">({v.shortDefinition.length}/400)</span></label><textarea id="shortDefinition" name="shortDefinition" rows={2} maxLength={400} value={v.shortDefinition} onChange={set("shortDefinition")} className={f} /><p className={hint}>One or two sentences in plain words. Shown under the title and in search results.</p></div>
        <div><label htmlFor="content" className={l}>Full explanation <span className="font-normal">({v.content.length} characters)</span></label><textarea id="content" name="content" rows={12} value={v.content} onChange={set("content")} className={`${f} font-mono`} /><p className={hint}>Separate paragraphs with a blank line. You can use **bold**, lines starting with “- ” for bullets, “## Heading” and [links](/path). HTML is converted or removed.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="whyItMatters" className={l}>Why it matters</label><textarea id="whyItMatters" name="whyItMatters" rows={4} value={v.whyItMatters} onChange={set("whyItMatters")} className={f} /></div>
          <div><label htmlFor="example" className={l}>Practical example</label><textarea id="example" name="example" rows={4} value={v.example} onChange={set("example")} className={f} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label htmlFor="relatedTerms" className={l}>Related terms</label><textarea id="relatedTerms" name="relatedTerms" rows={3} value={v.relatedTerms} onChange={set("relatedTerms")} className={f} /><p className={hint}>Separate with “;”. Only published terms are shown.</p></div>
          <div><label htmlFor="relatedGuides" className={l}>Related guides</label><textarea id="relatedGuides" name="relatedGuides" rows={3} value={v.relatedGuides} onChange={set("relatedGuides")} className={f} /><p className={hint}>Guide or article slugs. Only published ones are shown.</p></div>
          <div><label htmlFor="relatedProducts" className={l}>Related products</label><textarea id="relatedProducts" name="relatedProducts" rows={3} value={v.relatedProducts} onChange={set("relatedProducts")} className={f} /><p className={hint}>List slugs, for example dentists-us.</p></div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-sand-200 bg-white p-5">
          <div><label htmlFor="category" className={l}>Category</label><select id="category" name="category" value={v.category} onChange={set("category")} className={f}><option value="">No category</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
          <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" name="featured" value="1" defaultChecked={init.featured} className="size-4" /> Show under “Start here” on the glossary home</label>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5">
          <p className="text-sm font-bold text-forest-900">Search result preview</p>
          <div className="mt-3 rounded-xl bg-sand-50 p-3 text-sm"><p className="font-semibold text-purple-700">{title}</p><p className="text-xs text-forest-500">beigeleads.com/glossary/{v.slug || "…"}</p><p className="mt-1 text-xs">{meta}</p></div>
          <div className="mt-4"><label htmlFor="seoTitle" className={l}>SEO title <span className={`font-normal ${v.seoTitle.length > 60 ? "text-red-700" : ""}`}>({v.seoTitle.length}/60)</span></label><input id="seoTitle" name="seoTitle" maxLength={120} value={v.seoTitle} onChange={set("seoTitle")} placeholder="made automatically when empty" className={f} /></div>
          <div className="mt-3"><label htmlFor="metaDescription" className={l}>Meta description <span className={`font-normal ${v.metaDescription.length > 160 ? "text-red-700" : ""}`}>({v.metaDescription.length}/160)</span></label><textarea id="metaDescription" name="metaDescription" rows={3} maxLength={320} value={v.metaDescription} onChange={set("metaDescription")} placeholder="the short definition is used when empty" className={f} /></div>
          <div className="mt-3"><label htmlFor="keywords" className={l}>Keywords</label><input id="keywords" name="keywords" maxLength={300} value={v.keywords} onChange={set("keywords")} className={f} /></div>
          <p className={hint}>The canonical address is set automatically. Pages with very little text stay out of search results.</p>
        </div>
        <div className="space-y-3 rounded-2xl border border-sand-200 bg-white p-5">
          <p className="text-sm">Status: <strong>{published ? "Published" : "Draft"}</strong></p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" name="intent" value={published ? "keep" : "draft"} variant="secondary" disabled={pending}>{published ? "Save changes" : "Save as draft"}</Button>
            {!published && <Button type="submit" name="intent" value="publish" disabled={pending}>Save and publish</Button>}
          </div>
          {state && <div role={state.ok ? "status" : "alert"} className={`rounded-xl px-3 py-2 text-sm ${state.ok ? "bg-forest-100 text-forest-900" : "bg-red-50 text-red-900"}`}><p className="font-semibold">{state.message}</p>{state.errors && <ul className="mt-1 list-disc pl-5">{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>}</div>}
        </div>
      </aside>
    </form>
  );
}
