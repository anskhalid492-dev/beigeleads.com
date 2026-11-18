"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Panel } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { PhotoField } from "./photo-field";
import { saveAuthorAction } from "./actions";

export type AuthorFormData = {
  fullName: string; displayName: string; slug: string; title: string; email: string; shortBio: string; fullBio: string; expertise: string[]; company: string; location: string;
  photo: string | null; links: { linkedin: string; twitter: string; website: string; github: string; other: string };
  seoTitle: string; metaDescription: string; ogImage: string | null; canonicalUrl: string; noindex: boolean; status: "draft" | "published";
};
export const EMPTY_AUTHOR: AuthorFormData = {
  fullName: "", displayName: "", slug: "", title: "", email: "", shortBio: "", fullBio: "", expertise: [], company: "", location: "", photo: null,
  links: { linkedin: "", twitter: "", website: "", github: "", other: "" }, seoTitle: "", metaDescription: "", ogImage: null, canonicalUrl: "", noindex: false, status: "draft",
};

const input = "h-10 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm text-forest-900";
const area = "w-full rounded-xl border border-sand-300 bg-white p-3 text-sm text-forest-900";
const suggest = (s: string) => s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return <div><label htmlFor={id} className="mb-1 block text-sm font-semibold text-forest-900">{label}</label>{children}{hint && <p className="mt-1 text-xs">{hint}</p>}</div>;
}

export function AuthorForm({ id, initial, siteUrl }: { id: number | null; initial: AuthorFormData; siteUrl: string }) {
  const [f, setF] = useState(initial);
  const [slugEdited, setSlugEdited] = useState(id !== null);
  const [chip, setChip] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const set = <K extends keyof AuthorFormData>(k: K, v: AuthorFormData[K]) => setF((p) => ({ ...p, [k]: v }));
  const setLink = (k: keyof AuthorFormData["links"], v: string) => setF((p) => ({ ...p, links: { ...p.links, [k]: v } }));

  const addChip = () => {
    const parts = chip.split(",").map((x) => x.trim()).filter(Boolean);
    if (parts.length) set("expertise", [...new Set([...f.expertise, ...parts])].slice(0, 12));
    setChip("");
  };

  const save = (status: "draft" | "published") => start(async () => {
    setErr("");
    const expertise = chip.trim() ? [...new Set([...f.expertise, ...chip.split(",").map((x) => x.trim()).filter(Boolean)])].slice(0, 12) : f.expertise;
    const r = await saveAuthorAction(id, { ...f, expertise, status, slug: f.slug || suggest(f.displayName) });
    if (!r.ok) { setErr(r.error); toast(false, r.error); return; }
    toast(true, status === "published" ? "Author saved and published." : "Author saved.");
    if (id === null) router.replace(`/admin/blog/authors/${r.id}/edit`); else { setF((p) => ({ ...p, status, expertise })); setChip(""); router.refresh(); }
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(f.status); }} className="space-y-6">
      <Panel title="Basic information">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field id="fn" label="Full name"><input id="fn" required value={f.fullName} onChange={(e) => { const v = e.target.value; setF((p) => ({ ...p, fullName: v, displayName: p.displayName && p.displayName !== p.fullName ? p.displayName : v, slug: slugEdited ? p.slug : suggest(p.displayName && p.displayName !== p.fullName ? p.displayName : v) })); }} className={input} /></Field>
          <Field id="dn" label="Display name" hint="Shown on articles, for example Sam Rivera."><input id="dn" required value={f.displayName} onChange={(e) => { const v = e.target.value; setF((p) => ({ ...p, displayName: v, slug: slugEdited ? p.slug : suggest(v) })); }} className={input} /></Field>
          <Field id="sl" label="Profile URL slug" hint={`${siteUrl}/blog/author/${f.slug || "…"}`}><input id="sl" required value={f.slug} onChange={(e) => { setSlugEdited(true); set("slug", suggest(e.target.value)); }} className={input} /></Field>
          <Field id="ti" label="Professional title" hint="For example Head of Data Quality. Only what is true."><input id="ti" value={f.title} onChange={(e) => set("title", e.target.value)} className={input} maxLength={120} /></Field>
          <Field id="em" label="Email" hint="Private. Only admins see it. It is never shown on the site."><input id="em" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={input} autoComplete="off" /></Field>
          <Field id="co" label="Company or organization"><input id="co" value={f.company} onChange={(e) => set("company", e.target.value)} className={input} maxLength={120} /></Field>
          <Field id="lo" label="Location (optional)"><input id="lo" value={f.location} onChange={(e) => set("location", e.target.value)} className={input} maxLength={120} /></Field>
          <div className="sm:col-span-2"><Field id="sb" label="Short biography" hint={`${f.shortBio.length}/300. Shown on article cards and the About the Author box.`}><textarea id="sb" rows={3} maxLength={300} value={f.shortBio} onChange={(e) => set("shortBio", e.target.value)} className={area} /></Field></div>
          <div className="sm:col-span-2"><Field id="fb" label="Full biography" hint="Plain text. Blank lines start a new paragraph. Links and HTML are not used."><textarea id="fb" rows={8} maxLength={4000} value={f.fullBio} onChange={(e) => set("fullBio", e.target.value)} className={area} /></Field></div>
          <div className="sm:col-span-2">
            <Field id="ex" label="Areas of expertise" hint="Press Enter or comma to add. Up to 12.">
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sand-300 bg-white p-2">
                {f.expertise.map((x) => (
                  <span key={x} className="flex items-center gap-1 rounded-full bg-forest-100 py-1 pl-3 pr-1 text-sm font-semibold text-forest-900">{x}
                    <button type="button" aria-label={`Remove ${x}`} className="grid size-6 place-items-center rounded-full hover:bg-white" onClick={() => set("expertise", f.expertise.filter((y) => y !== x))}>×</button></span>
                ))}
                <input id="ex" value={chip} maxLength={60} onChange={(e) => setChip(e.target.value)} onBlur={addChip} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addChip(); } }} className="h-8 min-w-40 flex-1 bg-transparent px-1 text-sm outline-none" />
              </div>
            </Field>
          </div>
        </div>
      </Panel>

      <Panel title="Profile photo">
        <div className="p-5"><PhotoField value={f.photo} name={f.displayName} onChange={(u) => set("photo", u)} /></div>
      </Panel>

      <Panel title="Social and professional links">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {([["linkedin", "LinkedIn"], ["twitter", "X / Twitter"], ["website", "Website"], ["github", "GitHub"], ["other", "Other profile"]] as const).map(([k, label]) => (
            <Field key={k} id={`l-${k}`} label={label}><input id={`l-${k}`} inputMode="url" placeholder="https://" value={f.links[k]} onChange={(e) => setLink(k, e.target.value)} className={input} maxLength={500} /></Field>
          ))}
          <p className="text-xs sm:col-span-2">Only links you fill in are shown publicly. They must be web addresses (https://).</p>
        </div>
      </Panel>

      <Panel title="SEO">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field id="st" label="SEO title" hint={`${f.seoTitle.length}/120. Empty uses “${f.displayName || "Name"}, author at BeigeLeads”.`}><input id="st" maxLength={120} value={f.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={input} /></Field>
          <Field id="cu" label="Canonical URL" hint="Leave empty to use the profile URL."><input id="cu" inputMode="url" placeholder="https://" value={f.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} className={input} /></Field>
          <div className="sm:col-span-2"><Field id="md" label="Meta description" hint={`${f.metaDescription.length}/300. Empty uses the short biography.`}><textarea id="md" rows={2} maxLength={300} value={f.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} className={area} /></Field></div>
          <div className="sm:col-span-2">
            <p className="mb-1 text-sm font-semibold text-forest-900">Open Graph image</p>
            <PhotoField value={f.ogImage} name={f.displayName} onChange={(u) => set("ogImage", u)} />
            <p className="mt-1 text-xs">Optional. Empty uses the profile photo.</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-forest-900 sm:col-span-2"><input type="checkbox" checked={f.noindex} onChange={(e) => set("noindex", e.target.checked)} className="size-4 accent-purple-600" /> Hide this profile from search engines (noindex)</label>
        </div>
      </Panel>

      {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{err}</p>}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-2 rounded-2xl border border-sand-200 bg-white/95 p-3 backdrop-blur">
        <span className="mr-auto text-sm">Status: <strong className="text-forest-900">{f.status === "published" ? "Published" : "Draft"}</strong>. A draft has no public page.</span>
        <Button asChild variant="secondary"><Link href="/admin/blog/authors">Back to authors</Link></Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => save("draft")}>{f.status === "published" ? "Unpublish and save" : "Save draft"}</Button>
        <Button type="button" disabled={pending} onClick={() => save("published")}>{pending ? "Saving…" : f.status === "published" ? "Save changes" : "Publish profile"}</Button>
      </div>
    </form>
  );
}
