"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/blog/upload-client";
import type { Block } from "@/lib/help/types";
import { saveArticleAction } from "../../actions";

type Kind = "tip" | "info" | "warning";
type EB = { key: string; type: Block[0]; text: string; kind: Kind; head: string; rows: string; src: string; alt: string; caption: string; faq: { q: string; a: string }[] };
const blank = (type: Block[0]): EB => ({ key: Math.random().toString(36).slice(2), type, text: "", kind: "tip", head: "", rows: "", src: "", alt: "", caption: "", faq: [{ q: "", a: "" }] });

const cells = (line: string) => line.split("|").map((c) => c.trim());
function toEditor(b: Block): EB {
  const e = blank(b[0]);
  switch (b[0]) {
    case "h": case "p": case "note": e.text = b[1]; break;
    case "ul": case "ol": e.text = b[1].join("\n"); break;
    case "callout": e.kind = b[1]; e.text = b[2]; break;
    case "table": e.head = b[1].join(" | "); e.rows = b[2].map((r) => r.join(" | ")).join("\n"); break;
    case "img": e.src = b[1]; e.alt = b[2]; e.caption = b[3] ?? ""; break;
    case "faq": e.faq = b[1].map(([q, a]) => ({ q, a })); break;
  }
  return e;
}
function toBlock(e: EB): Block {
  switch (e.type) {
    case "h": case "p": case "note": return [e.type, e.text];
    case "ul": case "ol": return [e.type, e.text.split("\n").map((x) => x.trim()).filter(Boolean)];
    case "callout": return ["callout", e.kind, e.text];
    case "table": return ["table", cells(e.head).filter(Boolean), e.rows.split("\n").filter((l) => l.trim()).map(cells)];
    case "img": return ["img", e.src, e.alt, e.caption];
    case "faq": return ["faq", e.faq.map((f) => [f.q, f.a] as const)];
  }
}

const TYPES: { type: Block[0]; label: string }[] = [
  { type: "h", label: "Heading" }, { type: "p", label: "Paragraph" }, { type: "ul", label: "Bullet list" }, { type: "ol", label: "Numbered steps" },
  { type: "callout", label: "Callout" }, { type: "note", label: "Note" }, { type: "table", label: "Table" }, { type: "img", label: "Image" }, { type: "faq", label: "FAQ" },
];

export type EditorArticle = {
  id?: number; version?: number; category: string; slug: string; title: string; description: string; keywords: string[]; body: Block[]; related: string[];
  ctaLabel: string; ctaHref: string; group: string; featured: boolean; common: boolean; status: "draft" | "published"; seoTitle: string; metaDescription: string; noindex: boolean; updated: string;
};
type Props = { article: EditorArticle; topics: { slug: string; name: string }[]; groups: Record<string, string[]>; others: { id: string; title: string }[] };

const input = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600";
const label = "mb-1 block text-sm font-semibold text-forest-900";
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export function ArticleEditor({ article, topics, groups, others }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [a, setA] = useState(article);
  const [blocks, setBlocks] = useState<EB[]>(() => article.body.map(toEditor));
  const [slugTouched, setSlugTouched] = useState(!!article.id);
  const [kw, setKw] = useState(article.keywords.join(", "));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [relQ, setRelQ] = useState("");
  const published = article.status === "published" && !!article.id;
  const lockAddress = published; // a published article keeps its address

  useEffect(() => {
    if (!dirty) return;
    const f = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [dirty]);

  const patch = (p: Partial<EditorArticle>) => { setA((x) => ({ ...x, ...p })); setDirty(true); };
  const setBlock = (i: number, p: Partial<EB>) => { setBlocks((b) => b.map((x, j) => (j === i ? { ...x, ...p } : x))); setDirty(true); };
  const move = (i: number, d: -1 | 1) => setBlocks((b) => { const j = i + d; if (j < 0 || j >= b.length) return b; const c = [...b]; [c[i], c[j]] = [c[j], c[i]]; setDirty(true); return c; });
  const remove = (i: number) => { setBlocks((b) => b.filter((_, j) => j !== i)); setDirty(true); };
  const dup = (i: number) => { setBlocks((b) => [...b.slice(0, i + 1), { ...b[i], key: blank("p").key }, ...b.slice(i + 1)]); setDirty(true); };
  const add = (t: Block[0]) => { setBlocks((b) => [...b, blank(t)]); setDirty(true); };

  const relList = useMemo(() => others.filter((o) => o.id !== `${a.category}/${a.slug}` && (!relQ || o.title.toLowerCase().includes(relQ.toLowerCase()))).slice(0, 40), [others, relQ, a.category, a.slug]);

  async function save(status: "draft" | "published") {
    if (saving) return;
    setSaving(true);
    const res = await saveArticleAction({
      id: a.id, version: a.version, category: a.category, slug: a.slug, title: a.title, description: a.description,
      keywords: kw.split(",").map((k) => k.trim()).filter(Boolean), body: blocks.map(toBlock), related: a.related,
      ctaLabel: a.ctaLabel || undefined, ctaHref: a.ctaHref || undefined, group: a.group, featured: a.featured, common: a.common, status,
      seoTitle: a.seoTitle || undefined, metaDescription: a.metaDescription || undefined, noindex: a.noindex, updated: a.updated || undefined,
    });
    setSaving(false);
    if (!res.ok) { toast(false, res.error); return; }
    const r = res as unknown as { id: number; updatedAt: number };
    setDirty(false);
    setA((x) => ({ ...x, id: r.id, version: r.updatedAt, status }));
    toast(true, status === "published" ? "Saved and published. It can take up to a minute to appear on the site." : "Draft saved.");
    if (!a.id) router.replace(`/admin/help/articles/${r.id}`);
  }

  async function upload(i: number, f: File | undefined) {
    if (!f) return;
    const r = await uploadImage(f);
    if (!r.ok) { toast(false, r.error); return; }
    setBlock(i, { src: r.media.url, alt: blocks[i].alt || r.media.alt || "" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0 space-y-5">
        <div className="rounded-2xl border border-sand-200 bg-white p-5">
          <label className={label} htmlFor="t">Title</label>
          <input id="t" className={`${input} text-lg font-semibold`} maxLength={160} value={a.title} onChange={(e) => { patch({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) }); }} />
          <label className={`${label} mt-4`} htmlFor="d">Short description <span className="font-normal text-forest-500">({a.description.length}/320). Shown under the title and in search.</span></label>
          <textarea id="d" rows={2} className={input} maxLength={320} value={a.description} onChange={(e) => patch({ description: e.target.value })} />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold text-forest-900">Content</h2>
          {blocks.length === 0 && <p className="rounded-2xl border border-dashed border-sand-300 bg-white p-6 text-center text-sm">No content yet. Add a block below, for example a paragraph or a heading.</p>}
          <ol className="space-y-3">
            {blocks.map((b, i) => (
              <li key={b.key} className="rounded-2xl border border-sand-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-forest-500">{TYPES.find((t) => t.type === b.type)?.label}</span>
                  <span className="flex gap-1">
                    <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="size-4" /></IconBtn>
                    <IconBtn label="Move down" onClick={() => move(i, 1)} disabled={i === blocks.length - 1}><ArrowDown className="size-4" /></IconBtn>
                    <IconBtn label="Duplicate block" onClick={() => dup(i)}><Copy className="size-4" /></IconBtn>
                    <IconBtn label="Delete block" onClick={() => remove(i)}><Trash2 className="size-4" /></IconBtn>
                  </span>
                </div>
                {b.type === "h" && <input aria-label="Heading text" className={`${input} font-semibold`} maxLength={200} value={b.text} onChange={(e) => setBlock(i, { text: e.target.value })} />}
                {(b.type === "p" || b.type === "note") && <textarea aria-label="Text" rows={4} className={input} value={b.text} onChange={(e) => setBlock(i, { text: e.target.value })} />}
                {(b.type === "ul" || b.type === "ol") && <textarea aria-label="List items, one per line" rows={5} className={input} placeholder="One item per line" value={b.text} onChange={(e) => setBlock(i, { text: e.target.value })} />}
                {b.type === "callout" && (
                  <div className="space-y-2">
                    <select aria-label="Callout type" className={input} value={b.kind} onChange={(e) => setBlock(i, { kind: e.target.value as Kind })}><option value="tip">Tip</option><option value="info">Note</option><option value="warning">Important</option></select>
                    <textarea aria-label="Callout text" rows={3} className={input} value={b.text} onChange={(e) => setBlock(i, { text: e.target.value })} />
                  </div>
                )}
                {b.type === "table" && (
                  <div className="space-y-2">
                    <input aria-label="Table columns" className={input} placeholder="Column one | Column two" value={b.head} onChange={(e) => setBlock(i, { head: e.target.value })} />
                    <textarea aria-label="Table rows, one per line" rows={4} className={input} placeholder="Cell | Cell (one row per line)" value={b.rows} onChange={(e) => setBlock(i, { rows: e.target.value })} />
                    <p className="text-xs">Separate cells with a | sign. Up to 8 columns.</p>
                  </div>
                )}
                {b.type === "img" && (
                  <div className="space-y-2">
                    {b.src && <img src={b.src} alt="" className="max-h-48 rounded-xl border border-sand-200" />}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-sand-300 bg-sand-50 px-4 py-2 text-sm font-semibold text-forest-900 hover:bg-sand-100">
                      <ImagePlus className="size-4" aria-hidden />{b.src ? "Replace image" : "Upload image"}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(e) => { void upload(i, e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                    <input aria-label="Image description (alt text)" className={input} placeholder="Describe the image for people who cannot see it" maxLength={300} value={b.alt} onChange={(e) => setBlock(i, { alt: e.target.value })} />
                    <input aria-label="Caption (optional)" className={input} placeholder="Caption (optional)" maxLength={300} value={b.caption} onChange={(e) => setBlock(i, { caption: e.target.value })} />
                  </div>
                )}
                {b.type === "faq" && (
                  <div className="space-y-3">
                    {b.faq.map((f, k) => (
                      <div key={k} className="rounded-xl border border-sand-200 bg-sand-50 p-3">
                        <input aria-label={`Question ${k + 1}`} className={input} placeholder="Question" maxLength={300} value={f.q} onChange={(e) => setBlock(i, { faq: b.faq.map((x, j) => (j === k ? { ...x, q: e.target.value } : x)) })} />
                        <textarea aria-label={`Answer ${k + 1}`} rows={3} className={`${input} mt-2`} placeholder="Answer" value={f.a} onChange={(e) => setBlock(i, { faq: b.faq.map((x, j) => (j === k ? { ...x, a: e.target.value } : x)) })} />
                        <button type="button" onClick={() => setBlock(i, { faq: b.faq.filter((_, j) => j !== k) })} className="mt-2 text-xs font-semibold text-red-800 underline underline-offset-4">Remove this question</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setBlock(i, { faq: [...b.faq, { q: "", a: "" }] })} className="text-sm font-semibold text-forest-900 underline underline-offset-4">Add a question</button>
                  </div>
                )}
                {(b.type === "p" || b.type === "ul" || b.type === "ol" || b.type === "note" || b.type === "callout") && <p className="mt-1 text-xs">Links: [text](/page) or [text](https://…). Bold: **text**.</p>}
              </li>
            ))}
          </ol>
          <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Add a block">
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-forest-900"><Plus className="size-4" aria-hidden />Add</span>
            {TYPES.map((t) => <button key={t.type} type="button" onClick={() => add(t.type)} className="rounded-full border border-sand-300 bg-white px-3 py-1.5 text-sm font-semibold text-forest-900 hover:bg-sand-100">{t.label}</button>)}
          </div>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <section className="rounded-2xl border border-sand-200 bg-white p-4">
          <p className="text-sm font-bold text-forest-900">Status: {a.status === "published" ? "Published" : "Draft"}{dirty && <span className="ml-2 font-semibold text-amber-800">Unsaved changes</span>}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={saving} onClick={() => save("draft")}>{saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}{a.status === "published" ? "Save as draft (unpublish)" : "Save draft"}</Button>
            <Button size="sm" disabled={saving} onClick={() => save("published")}>{a.status === "published" ? "Save changes" : "Publish"}</Button>
          </div>
          {a.id && <p className="mt-3 flex gap-4 text-sm"><Link className="font-semibold underline underline-offset-4" href={`/admin/help/articles/${a.id}/preview`} target="_blank">Preview</Link>{a.status === "published" && <Link className="font-semibold underline underline-offset-4" href={`/help/${a.category}/${a.slug}`} target="_blank">View live</Link>}</p>}
          <p className="mt-3 text-xs">Preview shows the saved version. Save first to see recent changes.</p>
        </section>

        <section className="space-y-3 rounded-2xl border border-sand-200 bg-white p-4">
          <h2 className="text-sm font-bold text-forest-900">Placement</h2>
          <div><label className={label} htmlFor="cat">Topic</label>
            <select id="cat" className={input} disabled={lockAddress} value={a.category} onChange={(e) => patch({ category: e.target.value })}>{topics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select></div>
          <div><label className={label} htmlFor="slug">Slug (web address)</label>
            <input id="slug" className={input} disabled={lockAddress} value={a.slug} onChange={(e) => { setSlugTouched(true); patch({ slug: slugify(e.target.value) }); }} />
            <p className="mt-1 text-xs">{lockAddress ? "A published article keeps its address. Unpublish to change it." : `/help/${a.category}/${a.slug || "…"}`}</p></div>
          <div><label className={label} htmlFor="grp">Group in the topic</label>
            <input id="grp" list="grp-list" className={input} maxLength={80} value={a.group} onChange={(e) => patch({ group: e.target.value })} placeholder="e.g. The basics" />
            <datalist id="grp-list">{(groups[a.category] ?? []).map((g) => <option key={g} value={g} />)}</datalist></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={a.featured} onChange={(e) => patch({ featured: e.target.checked })} /> Show in &ldquo;Getting started&rdquo; on the home page</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={a.common} onChange={(e) => patch({ common: e.target.checked })} /> Show in &ldquo;Common questions&rdquo;</label>
          <p className="text-xs">Order inside a topic is set with the arrows on the Articles list.</p>
        </section>

        <section className="space-y-3 rounded-2xl border border-sand-200 bg-white p-4">
          <h2 className="text-sm font-bold text-forest-900">Search and links</h2>
          <div><label className={label} htmlFor="kw">Search keywords</label><input id="kw" className={input} value={kw} onChange={(e) => { setKw(e.target.value); setDirty(true); }} placeholder="comma, separated" /></div>
          <div><label className={label}>Related articles ({a.related.length} chosen)</label>
            <input aria-label="Filter related articles" className={input} placeholder="Filter by title" value={relQ} onChange={(e) => setRelQ(e.target.value)} />
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">{relList.map((o) => (
              <li key={o.id}><label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={a.related.includes(o.id)} onChange={(e) => patch({ related: e.target.checked ? [...a.related, o.id] : a.related.filter((x) => x !== o.id) })} />{o.title}</label></li>
            ))}</ul></div>
          <div className="grid gap-2"><label className={label} htmlFor="cl">Call-to-action button (optional)</label>
            <input id="cl" className={input} placeholder="Button text" maxLength={60} value={a.ctaLabel} onChange={(e) => patch({ ctaLabel: e.target.value })} />
            <input aria-label="Button link" className={input} placeholder="/custom-list or https://…" maxLength={300} value={a.ctaHref} onChange={(e) => patch({ ctaHref: e.target.value })} /></div>
        </section>

        <section className="space-y-3 rounded-2xl border border-sand-200 bg-white p-4">
          <h2 className="text-sm font-bold text-forest-900">SEO</h2>
          <div><label className={label} htmlFor="st">SEO title <span className="font-normal text-forest-500">({a.seoTitle.length}/120, empty = article title)</span></label><input id="st" className={input} maxLength={120} value={a.seoTitle} onChange={(e) => patch({ seoTitle: e.target.value })} /></div>
          <div><label className={label} htmlFor="sm">Meta description <span className="font-normal text-forest-500">({a.metaDescription.length}/320, empty = short description)</span></label><textarea id="sm" rows={3} className={input} maxLength={320} value={a.metaDescription} onChange={(e) => patch({ metaDescription: e.target.value })} /></div>
          <div><label className={label} htmlFor="up">Last updated date</label><input id="up" type="date" className={input} value={a.updated} onChange={(e) => patch({ updated: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={a.noindex} onChange={(e) => patch({ noindex: e.target.checked })} /> Ask search engines not to index this article</label>
          <p className="text-xs">The whole site stays hidden from search engines until launch. This setting can only add a restriction.</p>
        </section>
      </aside>
    </div>
  );
}

function IconBtn({ label: l, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <button type="button" aria-label={l} title={l} onClick={onClick} disabled={disabled} className="grid size-8 place-items-center rounded-lg border border-sand-300 bg-white text-forest-900 hover:bg-sand-100 disabled:opacity-40">{children}</button>;
}
