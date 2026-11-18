"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor as TipTap } from "@tiptap/react";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Code, Eye, GripVertical, Heading2, Heading3, ImageIcon, Info, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, SquareCode, Strikethrough, Table2, Underline, Undo2, Video } from "lucide-react";
import { Badge } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { ArticleBody } from "@/components/blog/render";
import { editorExtensions } from "@/components/blog/extensions";
import { uploadImage } from "@/lib/blog/upload-client";
import { cleanDoc, embedUrl, readingMinutes, slugifyText, wordCount, type DocNode } from "@/lib/blog/doc";
import { analyzeSeo, META_RANGE, SEO_TITLE_RANGE, suggestLinks, type InternalTarget } from "@/lib/blog/seo";
import { saveAction, transitionAction } from "../../actions";
import { MediaPicker, type Picked } from "../../media-picker";

type Status = "draft" | "scheduled" | "published" | "archived";
export type Fields = {
  title: string; slug: string; excerpt: string; categoryId: number | null; author: string; featuredImage: string | null; featuredAlt: string;
  seoTitle: string; metaDescription: string; canonicalUrl: string; noindex: boolean; ogTitle: string; ogDescription: string; ogImage: string | null;
  focusKeyword: string; related: number[]; tagIds: number[]; scheduledAt: number | null;
};
export type EditorPost = { id: number; version: number; status: Status; updatedAt: number; publishedAt: number | null; doc: DocNode; fields: Fields };
type Save = "saved" | "dirty" | "saving" | "failed";

const input = "h-10 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm text-forest-900";
const label = "mb-1 block text-sm font-semibold text-forest-900";
const TONE = { draft: "mute", scheduled: "info", published: "good", archived: "warn" } as const;
const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (ms: number | null) => { if (!ms) return ""; const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const tzLabel = () => { try { const o = -new Date().getTimezoneOffset(); const sign = o >= 0 ? "+" : "-"; return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${sign}${pad(Math.floor(Math.abs(o) / 60))}:${pad(Math.abs(o) % 60)})`; } catch { return "your local time"; } };

export function Editor({ role, post, cats, tags, options, targets }: { role: "admin" | "editor"; post: EditorPost; cats: { id: number; name: string }[]; tags: { id: number; name: string }[]; options: { id: number; title: string }[]; targets: InternalTarget[] }) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState<Fields>(post.fields);
  const [status, setStatus] = useState<Status>(post.status);
  const [save, setSave] = useState<Save>("saved");
  const [savedAt, setSavedAt] = useState<number>(post.updatedAt);
  const [msg, setMsg] = useState("");
  const [conflict, setConflict] = useState(false);
  const [tab, setTab] = useState<"publish" | "details" | "seo">("publish");
  const [slugTouched, setSlugTouched] = useState(post.status !== "draft");
  const [dialog, setDialog] = useState<null | "link" | "video" | "image" | "feature" | "og" | "preview">(null);
  const [recover, setRecover] = useState<null | { at: number; fields: Fields; doc: DocNode }>(null);
  const [analysisDoc, setAnalysisDoc] = useState<DocNode>(post.doc);
  const [busy, setBusy] = useState(false);
  const [pendingImage, setPendingImage] = useState<(Picked & { title?: string; editing?: boolean }) | null>(null);
  const [confirm, setConfirm] = useState<null | { text: string; run: () => void }>(null);

  const fRef = useRef(f);
  useEffect(() => { fRef.current = f; });
  const version = useRef(post.version);
  const ticks = useRef(0);          // counts edits; a save only clears "dirty" if nothing changed meanwhile
  const saving = useRef(false);
  const again = useRef(false);
  const conflictRef = useRef(false);
  const key = `blog-draft-${post.id}`;

  const editorRef = useRef<TipTap | null>(null);
  const importing = useRef(new Set<string>());
  const editor = useEditor({
    extensions: editorExtensions,
    content: post.doc,
    immediatelyRender: false,
    editorProps: {
      attributes: { "aria-label": "Article body", role: "textbox", "aria-multiline": "true" },
      // Pasted or dropped image files are uploaded to the media library instead of being embedded.
      handlePaste: (_v, e) => { const fs = Array.from(e.clipboardData?.files ?? []).filter((x) => x.type.startsWith("image/")); if (!fs.length) return false; e.preventDefault(); void importFiles(fs); return true; },
      handleDrop: (_v, e) => { const fs = Array.from((e as DragEvent).dataTransfer?.files ?? []).filter((x) => x.type.startsWith("image/")); if (!fs.length) return false; e.preventDefault(); void importFiles(fs); return true; },
    },
    onUpdate: () => { touch(); void importDataImages(); },
  });

  // Images pasted from Word/Docs can arrive as data: URLs. Upload them to the library and swap the address.
  const importDataImages = async () => {
    const ed = editorRef.current;
    if (!ed) return;
    const found: string[] = [];
    ed.state.doc.descendants((n) => { const src = n.attrs?.src; if (n.type.name === "image" && typeof src === "string" && src.startsWith("data:") && !importing.current.has(src)) found.push(src); });
    for (const src of found) {
      importing.current.add(src);
      try {
        const blob = await (await fetch(src)).blob();
        const r = await uploadImage(new File([blob], "pasted-image", { type: blob.type }));
        if (!r.ok) { toast(false, `A pasted image could not be imported: ${r.error}`); continue; }
        const e2 = editorRef.current;
        if (!e2) return;
        let done = false;
        e2.state.doc.descendants((n, pos) => {
          if (done) return false;
          if (n.type.name === "image" && n.attrs.src === src) { e2.view.dispatch(e2.state.tr.setNodeMarkup(pos, undefined, { ...n.attrs, src: r.media.url, alt: n.attrs.alt || r.media.alt })); done = true; return false; }
        });
      } catch { toast(false, "A pasted image could not be imported. Upload it instead."); }
    }
  };

  const importFiles = async (files: File[]) => {
    for (const f of files) {
      const r = await uploadImage(f);
      if (!r.ok) { toast(false, `${f.name}: ${r.error}`); continue; }
      editorRef.current?.chain().focus().setImage({ src: r.media.url, alt: r.media.alt }).run();
      toast(true, "Image uploaded. Add alt text by selecting it and pressing the image button.");
    }
  };

  useEffect(() => { editorRef.current = editor; }, [editor]);

  const backup = useCallback(() => {
    try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), fields: fRef.current, doc: editor?.getJSON() ?? null, base: version.current })); } catch { /* storage may be unavailable */ }
  }, [editor, key]);

  const touch = () => { ticks.current++; setSave((s) => (s === "saving" ? s : "dirty")); };
  const update = <K extends keyof Fields>(k: K, v: Fields[K]) => { setF((p) => ({ ...p, [k]: v })); touch(); };

  const doSave = useCallback(async (kind: "autosave" | "manual"): Promise<boolean> => {
    if (!editor || conflictRef.current) return false;
    if (saving.current) { again.current = true; return false; }
    saving.current = true; setSave("saving"); setMsg("");
    const startTick = ticks.current;
    // Plain-JSON copy: editor attrs can be non-plain objects, which React cannot send to a server action ("temporary client reference").
    const input = { ...fRef.current, doc: JSON.parse(JSON.stringify(editor.getJSON())) as DocNode };
    const r = await saveAction(post.id, input, version.current, kind);
    saving.current = false;
    if (r.ok) {
      version.current = r.version; setSavedAt(r.updatedAt);
      if (ticks.current === startTick) { setSave("saved"); try { localStorage.removeItem(key); } catch { /* ignore */ } } else setSave("dirty");
      if (again.current) { again.current = false; setSave("dirty"); }
      return true;
    }
    setSave("failed"); setMsg(r.error);
    if (r.conflict) { conflictRef.current = true; setConflict(true); }
    backup();
    return false;
  }, [editor, post.id, key, backup]);

  // autosave 3s after the last change, and keep a local copy so a failed save never loses work
  useEffect(() => {
    if (save !== "dirty") return;
    backup();
    const t = setTimeout(() => void doSave("autosave"), 3000);
    return () => clearTimeout(t);
  }, [save, f, doSave, backup]);

  useEffect(() => {
    if (save !== "dirty" && save !== "failed") return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [save]);

  // offer to recover a newer local copy (for example after a failed save or a closed tab)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const b = JSON.parse(raw) as { at: number; fields: Fields; doc: DocNode | null };
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser storage once after mount; cannot be done during render without a hydration mismatch
      if (b.doc && b.at > post.updatedAt && JSON.stringify(b.fields) !== JSON.stringify(post.fields)) setRecover({ at: b.at, fields: b.fields, doc: b.doc });
       
      else if (b.doc && b.at > post.updatedAt && JSON.stringify(cleanDoc(b.doc)) !== JSON.stringify(post.doc)) setRecover({ at: b.at, fields: b.fields, doc: b.doc });
    } catch { /* ignore */ }
  }, [key, post.updatedAt, post.fields, post.doc]);

  // analysis runs shortly after typing stops
  useEffect(() => {
    if (!editor) return;
    const t = setTimeout(() => setAnalysisDoc(cleanDoc(editor.getJSON())), 700);
    return () => clearTimeout(t);
  }, [editor, f, save]);

  const words = wordCount(analysisDoc);
  const checks = useMemo(() => analyzeSeo({ title: f.title, slug: f.slug, seoTitle: f.seoTitle, metaDescription: f.metaDescription, focusKeyword: f.focusKeyword, excerpt: f.excerpt, doc: analysisDoc, targets }), [f.title, f.slug, f.seoTitle, f.metaDescription, f.focusKeyword, f.excerpt, analysisDoc, targets]);
  const suggestions = useMemo(() => suggestLinks(analysisDoc, targets, 6), [analysisDoc, targets]);

  const onTitle = (v: string) => { update("title", v); if (!slugTouched) setF((p) => ({ ...p, slug: slugifyText(v) })); };

  const act = async (action: "publish" | "schedule" | "unpublish" | "archive" | "restore") => {
    setBusy(true);
    try {
      if (action === "schedule" && !f.scheduledAt) { toast(false, "Pick a date and time first."); return; }
      if (save !== "saved") { const ok = await doSave("manual"); if (!ok) { toast(false, "Save failed, so nothing was published. Fix the problem shown at the top and try again."); return; } }
      const r = await transitionAction(post.id, action, f.scheduledAt);
      if (!r.ok) { toast(false, r.error); return; }
      const next: Status = action === "publish" ? "published" : action === "schedule" ? "scheduled" : action === "archive" ? "archived" : "draft";
      setStatus(next);
      toast(true, { publish: "Published.", schedule: "Scheduled.", unpublish: "Unpublished.", archive: "Archived.", restore: "Restored to draft." }[action]);
      router.refresh();
    } finally { setBusy(false); }
  };
  const ask = (text: string, run: () => void) => setConfirm({ text, run });

  const insertLinkSuggestion = (t: InternalTarget) => {
    if (!editor) return;
    const kws = t.keywords.filter((k) => k.length > 3).map((k) => k.toLowerCase());
    let range: { from: number; to: number } | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (range || !node.isText || node.marks.some((m) => m.type.name === "link")) return;
      const low = (node.text ?? "").toLowerCase();
      for (const k of kws) { const i = low.indexOf(k); if (i >= 0) { range = { from: pos + i, to: pos + i + k.length }; break; } }
    });
    if (!range) { toast(false, "Could not find that phrase to link."); return; }
    editor.chain().focus().setTextSelection(range).setLink({ href: t.url }).run();
    toast(true, `Linked to ${t.url}`);
  };

  if (!editor) return <p className="p-6 text-sm">Loading editor…</p>;
  const statusText = save === "saving" ? "Saving…" : save === "dirty" ? "Unsaved changes" : save === "failed" ? "Save failed. Your changes are kept in this browser." : `Saved ${new Date(savedAt).toLocaleTimeString()}`;
  const pageTitle = f.seoTitle || f.title;

  return (
    <div className="-mx-1">
      <div className="sticky top-0 z-30 -mx-1 mb-4 flex flex-wrap items-center gap-3 border-b border-sand-200 bg-sand-50/95 px-1 py-3 backdrop-blur">
        <Link href="/admin/blog" className="text-sm font-semibold underline">All articles</Link>
        <Badge tone={TONE[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>
        <span role="status" aria-live="polite" className={`text-sm ${save === "failed" ? "font-semibold text-red-700" : ""}`}>{statusText}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setDialog("preview")}><Eye className="mr-1.5 size-4" aria-hidden />Preview</Button>
          <Button variant="secondary" disabled={busy || save === "saving" || conflict} onClick={() => void doSave("manual").then((ok) => ok && toast(true, "Saved."))}>Save</Button>
          {role === "admin" && (status === "draft" || status === "archived") && <Button disabled={busy || conflict} onClick={() => ask("Publish this article now? It becomes visible on the public blog.", () => void act("publish"))}>Publish</Button>}
        </div>
      </div>

      {msg && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{msg}</p>}
      {conflict && <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-amber-100 p-3 text-sm text-amber-900"><span>Saving is paused: a newer version exists. Your text is still in this tab and a copy is kept in this browser.</span><Button size="sm" variant="secondary" onClick={() => { backup(); window.location.reload(); }}>Load latest version</Button></div>}
      {recover && (
        <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-purple-100 p-3 text-sm text-forest-900">
          <span>Unsaved changes from {new Date(recover.at).toLocaleString()} were found in this browser.</span>
          <Button size="sm" onClick={() => { setF(recover.fields); editor.commands.setContent(recover.doc); setRecover(null); touch(); }}>Restore them</Button>
          <Button size="sm" variant="secondary" onClick={() => { try { localStorage.removeItem(key); } catch { /* ignore */ } setRecover(null); }}>Discard</Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <label htmlFor="title" className="sr-only">Title</label>
          <textarea id="title" value={f.title} onChange={(e) => onTitle(e.target.value)} rows={2} placeholder="Article title" className="display w-full resize-none rounded-2xl border border-transparent bg-transparent px-1 text-4xl text-forest-900 focus:border-sand-300 focus:bg-white focus:outline-none sm:text-5xl" />
          <Toolbar editor={editor} open={setDialog} editImage={() => { const a = editor.getAttributes("image"); setPendingImage({ url: String(a.src), alt: String(a.alt ?? ""), title: String(a.title ?? ""), editing: true }); }} />
          <div className="relative rounded-b-2xl border border-t-0 border-sand-200 bg-white px-5 py-6 sm:px-8">
            <DragHandle editor={editor}><span className="grid size-6 cursor-grab place-items-center rounded-md text-forest-700 hover:bg-sand-100" aria-hidden title="Drag to move"><GripVertical className="size-4" /></span></DragHandle>
            <EditorContent editor={editor} />
          </div>
          <p className="mt-2 text-xs">{words} words · about {readingMinutes(analysisDoc)} min read</p>
        </div>

        <aside className="min-w-0 space-y-4">
          <div role="tablist" aria-label="Article settings" className="grid grid-cols-3 rounded-xl bg-sand-100 p-1 text-sm font-semibold">
            {([["publish", "Publish"], ["details", "Details"], ["seo", "SEO"]] as const).map(([k, l]) => (
              <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-lg px-2 py-1.5 ${tab === k ? "bg-white text-forest-900 shadow-sm" : ""}`}>{l}</button>
            ))}
          </div>

          {tab === "publish" && (
            <section className="space-y-4 rounded-2xl border border-sand-200 bg-white p-4">
              <p className="text-sm">Status: <strong>{status}</strong>{post.publishedAt ? ` · first published ${new Date(post.publishedAt).toLocaleDateString()}` : ""}</p>
              {role === "editor" ? <p className="text-sm">You can write and save this draft. An admin reviews and publishes it.</p> : <>
              <div>
                <label htmlFor="when" className={label}>Schedule for</label>
                <input id="when" type="datetime-local" value={toLocalInput(f.scheduledAt)} onChange={(e) => update("scheduledAt", e.target.value ? new Date(e.target.value).getTime() : null)} className={input} />
                <p className="mt-1 text-xs">Time zone: {tzLabel()}{f.scheduledAt ? ` · ${new Date(f.scheduledAt).toISOString().slice(0, 16).replace("T", " ")} UTC` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {status !== "published" && status !== "archived" && <Button variant="secondary" disabled={busy || conflict || !f.scheduledAt} onClick={() => ask(`Schedule this article for ${f.scheduledAt ? new Date(f.scheduledAt).toLocaleString() : ""}?`, () => void act("schedule"))}>{status === "scheduled" ? "Update schedule" : "Schedule"}</Button>}
                {(status === "published" || status === "scheduled") && <Button variant="secondary" disabled={busy} onClick={() => ask("Unpublish this article? It leaves the public blog and returns to draft.", () => void act("unpublish"))}>Unpublish</Button>}
                {status !== "archived" ? <Button variant="secondary" disabled={busy} onClick={() => ask("Archive this article? It is hidden from the public blog.", () => void act("archive"))}>Archive</Button> : <Button variant="secondary" disabled={busy} onClick={() => void act("restore")}>Restore to draft</Button>}
                {status === "published" && <Button asChild variant="secondary"><Link href={`/blog/${f.slug}`} target="_blank">View live</Link></Button>}
              </div>
              <p className="text-xs">Scheduled articles are published by a job that runs every minute. They are shown from the scheduled time even if the job is late.</p>
              </>}
              <Link href={`/admin/blog/${post.id}/revisions`} className="text-sm font-semibold underline">Revision history</Link>
            </section>
          )}

          {tab === "details" && (
            <section className="space-y-4 rounded-2xl border border-sand-200 bg-white p-4">
              <div><label htmlFor="slug" className={label}>URL slug</label><input id="slug" value={f.slug} onChange={(e) => { setSlugTouched(true); update("slug", slugifyText(e.target.value)); }} className={input} /><p className="mt-1 break-all text-xs">beigeleads.com/blog/{f.slug || "…"}</p></div>
              <div><label htmlFor="excerpt" className={label}>Excerpt</label><textarea id="excerpt" rows={3} maxLength={500} value={f.excerpt} onChange={(e) => update("excerpt", e.target.value)} className="w-full rounded-xl border border-sand-300 p-3 text-sm" /><p className="mt-1 text-xs">Shown on blog cards. {f.excerpt.length}/500</p></div>
              <div><label htmlFor="author" className={label}>Author</label><input id="author" value={f.author} onChange={(e) => update("author", e.target.value)} className={input} /></div>
              <div><label htmlFor="cat" className={label}>Category</label><select id="cat" value={f.categoryId ?? ""} onChange={(e) => update("categoryId", e.target.value ? Number(e.target.value) : null)} className={input}><option value="">No category</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{cats.length === 0 && <p className="mt-1 text-xs"><Link className="underline" href="/admin/blog/taxonomy">Create a category</Link> first.</p>}</div>
              <fieldset><legend className={label}>Tags</legend>
                {tags.length === 0 ? <p className="text-xs"><Link className="underline" href="/admin/blog/taxonomy">Create tags</Link> to use them here.</p> : (
                  <div className="flex flex-wrap gap-2">{tags.map((t) => { const on = f.tagIds.includes(t.id); return <button key={t.id} type="button" aria-pressed={on} onClick={() => update("tagIds", on ? f.tagIds.filter((x) => x !== t.id) : [...f.tagIds, t.id])} className={`rounded-full border px-3 py-1 text-xs font-semibold ${on ? "border-forest-700 bg-forest-100 text-forest-900" : "border-sand-300"}`}>{t.name}</button>; })}</div>
                )}
              </fieldset>
              <div>
                <p className={label}>Featured image</p>
                {f.featuredImage ? (
                  <div className="space-y-2">
                    { }
                    <img src={f.featuredImage} alt={f.featuredAlt} className="aspect-video w-full rounded-xl object-cover" />
                    <label htmlFor="falt" className="text-xs font-semibold">Alt text</label>
                    <input id="falt" value={f.featuredAlt} onChange={(e) => update("featuredAlt", e.target.value)} className={input} placeholder="Describe the image" />
                    <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => setDialog("feature")}>Change</Button><Button size="sm" variant="secondary" onClick={() => { update("featuredImage", null); update("featuredAlt", ""); }}>Remove</Button></div>
                  </div>
                ) : <Button variant="secondary" onClick={() => setDialog("feature")}>Choose image</Button>}
              </div>
              <fieldset><legend className={label}>Related articles (up to 6)</legend>
                {options.length === 0 ? <p className="text-xs">No other articles yet. If none are chosen, related articles are picked by category.</p> : (
                  <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">{options.map((o) => { const on = f.related.includes(o.id); return <li key={o.id}><label className="flex items-start gap-2"><input type="checkbox" checked={on} disabled={!on && f.related.length >= 6} onChange={() => update("related", on ? f.related.filter((x) => x !== o.id) : [...f.related, o.id])} className="mt-1" /><span>{o.title || "Untitled"}</span></label></li>; })}</ul>
                )}
              </fieldset>
            </section>
          )}

          {tab === "seo" && (
            <section className="space-y-4 rounded-2xl border border-sand-200 bg-white p-4">
              <div className="rounded-xl border border-sand-200 p-3" aria-label="Search result preview">
                <p className="truncate text-xs">beigeleads.com › blog › {f.slug}</p>
                <p className="mt-0.5 line-clamp-2 text-base font-semibold text-[#1a0dab]">{pageTitle || "Untitled"}</p>
                <p className="mt-0.5 line-clamp-2 text-sm">{f.metaDescription || f.excerpt || "No description yet."}</p>
              </div>
              <div><label htmlFor="st" className={label}>SEO title</label><input id="st" value={f.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} placeholder={f.title} className={input} /><Counter n={(f.seoTitle || f.title).length} range={SEO_TITLE_RANGE} /></div>
              <div><label htmlFor="md" className={label}>Meta description</label><textarea id="md" rows={3} value={f.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} className="w-full rounded-xl border border-sand-300 p-3 text-sm" /><Counter n={f.metaDescription.length} range={META_RANGE} /></div>
              <div><label htmlFor="kw" className={label}>Focus keyword</label><input id="kw" value={f.focusKeyword} onChange={(e) => update("focusKeyword", e.target.value)} className={input} /></div>
              <div><label htmlFor="cu" className={label}>Canonical URL</label><input id="cu" value={f.canonicalUrl} onChange={(e) => update("canonicalUrl", e.target.value)} placeholder="Leave empty to use this article's own URL" className={input} /></div>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={f.noindex} onChange={(e) => update("noindex", e.target.checked)} className="mt-1" /><span>Hide from search engines (noindex). Also removes it from the sitemap.</span></label>
              <details className="rounded-xl border border-sand-200 p-3"><summary className="cursor-pointer text-sm font-semibold">Social sharing (Open Graph)</summary>
                <div className="mt-3 space-y-3">
                  <div><label htmlFor="ogt" className={label}>OG title</label><input id="ogt" value={f.ogTitle} onChange={(e) => update("ogTitle", e.target.value)} placeholder={pageTitle} className={input} /></div>
                  <div><label htmlFor="ogd" className={label}>OG description</label><textarea id="ogd" rows={2} value={f.ogDescription} onChange={(e) => update("ogDescription", e.target.value)} className="w-full rounded-xl border border-sand-300 p-3 text-sm" /></div>
                  <div><p className={label}>OG image</p>{f.ogImage ? <div className="flex items-center gap-3">{ }<img src={f.ogImage} alt="" className="h-14 w-24 rounded-lg object-cover" /><Button size="sm" variant="secondary" onClick={() => update("ogImage", null)}>Remove</Button></div> : <Button size="sm" variant="secondary" onClick={() => setDialog("og")}>Choose image</Button>}<p className="mt-1 text-xs">Empty uses the featured image.</p></div>
                </div>
              </details>
              <div>
                <h3 className="mb-2 text-sm font-bold text-forest-900">Checks</h3>
                <ul className="space-y-1.5 text-sm">{checks.map((c, i) => <li key={i} className="flex gap-2"><span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${c.level === "good" ? "bg-forest-500" : c.level === "warn" ? "bg-amber-500" : "bg-sand-300"}`} /><span><span className="sr-only">{c.level}: </span>{c.text}</span></li>)}</ul>
                <p className="mt-2 text-xs">These are writing aids, not a ranking score.</p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold text-forest-900">Internal link suggestions</h3>
                {suggestions.length === 0 ? <p className="text-xs">No suggestions. They appear when your text mentions a BeigeLeads page that is not linked yet.</p> : (
                  <ul className="space-y-2">{suggestions.map((s) => <li key={s.url} className="flex items-center justify-between gap-2 text-sm"><span className="min-w-0"><span className="block truncate font-semibold">{s.title}</span><span className="block truncate text-xs">{s.url}</span></span><Button size="sm" variant="secondary" onClick={() => insertLinkSuggestion(s)}>Link it</Button></li>)}</ul>
                )}
              </div>
              <p className="text-xs">Article and breadcrumb structured data (JSON-LD) and the sitemap entry are generated automatically when the article is live.</p>
            </section>
          )}
        </aside>
      </div>

      {dialog === "link" && <LinkDialog editor={editor} onClose={() => setDialog(null)} />}
      {dialog === "video" && <VideoDialog editor={editor} onClose={() => setDialog(null)} />}
      {dialog === "image" && <MediaPicker onClose={() => setDialog(null)} onPick={(p) => { setDialog(null); setPendingImage(p); }} />}
      {dialog === "feature" && <MediaPicker onClose={() => setDialog(null)} onPick={(p) => { update("featuredImage", p.url); if (!f.featuredAlt) update("featuredAlt", p.alt); setDialog(null); }} />}
      {dialog === "og" && <MediaPicker onClose={() => setDialog(null)} onPick={(p) => { update("ogImage", p.url); setDialog(null); }} />}
      {dialog === "preview" && (
        <div role="dialog" aria-modal="true" aria-label="Preview" className="fixed inset-0 z-[80] overflow-y-auto bg-forest-900/60 p-4">
          <div className="mx-auto max-w-3xl rounded-2xl bg-sand-50 p-6 sm:p-10">
            <div className="mb-6 flex items-center justify-between"><Badge tone="info">Preview of the current text</Badge><Button variant="secondary" onClick={() => setDialog(null)}>Close</Button></div>
            <h1 className="display text-5xl text-forest-900">{f.title || "Untitled"}</h1>
            {f.excerpt && <p className="mt-3 text-lg">{f.excerpt}</p>}
            {f.featuredImage &&   <img src={f.featuredImage} alt={f.featuredAlt} className="mt-6 w-full rounded-2xl" />}
            <div className="mt-8"><ArticleBody doc={cleanDoc(editor.getJSON())} /></div>
          </div>
        </div>
      )}
      {pendingImage && <ImageDialog editor={editor} picked={pendingImage} onDone={() => { setPendingImage(null); touch(); }} />}
      {confirm && (
        <div role="dialog" aria-modal="true" aria-label="Confirm" className="fixed inset-0 z-[80] grid place-items-center bg-forest-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <p className="text-forest-900">{confirm.text}</p>
            <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button><Button onClick={() => { const r = confirm.run; setConfirm(null); r(); }}>Confirm</Button></div>
          </div>
        </div>
      )}
    </div>
  );

}

function Counter({ n, range }: { n: number; range: readonly [number, number] }) {
  const ok = n >= range[0] && n <= range[1];
  return <p className={`mt-1 text-xs ${ok ? "" : n === 0 ? "" : "font-semibold text-amber-800"}`}>{n} characters · aim for {range[0]} to {range[1]}</p>;
}

function Btn({ on, label, onClick, children, disabled }: { on?: boolean; label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return <button type="button" title={label} aria-label={label} aria-pressed={on} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className={`grid size-9 place-items-center rounded-lg text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600 disabled:opacity-40 ${on ? "bg-forest-100" : ""}`}>{children}</button>;
}
const Sep = () => <span aria-hidden className="mx-1 h-6 w-px bg-sand-200" />;

function Toolbar({ editor, open, editImage }: { editor: TipTap; open: (d: "link" | "video" | "image") => void; editImage: () => void }) {
  const c = () => editor.chain().focus();
  const z = "size-4";
  return (
    <div role="toolbar" aria-label="Formatting" className="sticky top-16 z-20 flex flex-wrap items-center gap-0.5 rounded-t-2xl border border-sand-200 bg-white px-2 py-1.5">
      <Btn label="Undo" onClick={() => c().undo().run()} disabled={!editor.can().undo()}><Undo2 className={z} /></Btn>
      <Btn label="Redo" onClick={() => c().redo().run()} disabled={!editor.can().redo()}><Redo2 className={z} /></Btn>
      <Sep />
      <Btn label="Heading 2" on={editor.isActive("heading", { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading2 className={z} /></Btn>
      <Btn label="Heading 3" on={editor.isActive("heading", { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()}><Heading3 className={z} /></Btn>
      <Sep />
      <Btn label="Bold" on={editor.isActive("bold")} onClick={() => c().toggleBold().run()}><Bold className={z} /></Btn>
      <Btn label="Italic" on={editor.isActive("italic")} onClick={() => c().toggleItalic().run()}><Italic className={z} /></Btn>
      <Btn label="Underline" on={editor.isActive("underline")} onClick={() => c().toggleUnderline().run()}><Underline className={z} /></Btn>
      <Btn label="Strikethrough" on={editor.isActive("strike")} onClick={() => c().toggleStrike().run()}><Strikethrough className={z} /></Btn>
      <Btn label="Inline code" on={editor.isActive("code")} onClick={() => c().toggleCode().run()}><Code className={z} /></Btn>
      <Sep />
      <Btn label="Align left" on={editor.isActive({ textAlign: "left" })} onClick={() => c().setTextAlign("left").run()}><AlignLeft className={z} /></Btn>
      <Btn label="Align center" on={editor.isActive({ textAlign: "center" })} onClick={() => c().setTextAlign("center").run()}><AlignCenter className={z} /></Btn>
      <Btn label="Align right" on={editor.isActive({ textAlign: "right" })} onClick={() => c().setTextAlign("right").run()}><AlignRight className={z} /></Btn>
      <Sep />
      <Btn label="Bulleted list" on={editor.isActive("bulletList")} onClick={() => c().toggleBulletList().run()}><List className={z} /></Btn>
      <Btn label="Numbered list" on={editor.isActive("orderedList")} onClick={() => c().toggleOrderedList().run()}><ListOrdered className={z} /></Btn>
      <Btn label="Quote" on={editor.isActive("blockquote")} onClick={() => c().toggleBlockquote().run()}><Quote className={z} /></Btn>
      <Btn label="Callout box" on={editor.isActive("callout")} onClick={() => c().toggleCallout("info").run()}><Info className={z} /></Btn>
      <Btn label="Code block" on={editor.isActive("codeBlock")} onClick={() => c().toggleCodeBlock().run()}><SquareCode className={z} /></Btn>
      <Btn label="Divider" onClick={() => c().setHorizontalRule().run()}><Minus className={z} /></Btn>
      <Sep />
      <Btn label="Link" on={editor.isActive("link")} onClick={() => open("link")}><Link2 className={z} /></Btn>
      <Btn label={editor.isActive("image") ? "Edit image details" : "Insert image"} on={editor.isActive("image")} onClick={() => (editor.isActive("image") ? editImage() : open("image"))}><ImageIcon className={z} /></Btn>
      <Btn label="Embed YouTube or Vimeo video" onClick={() => open("video")}><Video className={z} /></Btn>
      <Btn label="Insert table" onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 className={z} /></Btn>
      {editor.isActive("table") && (
        <>
          <Sep />
          <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-sand-100" onMouseDown={(e) => e.preventDefault()} onClick={() => c().addRowAfter().run()}>+ Row</button>
          <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-sand-100" onMouseDown={(e) => e.preventDefault()} onClick={() => c().addColumnAfter().run()}>+ Column</button>
          <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-sand-100" onMouseDown={(e) => e.preventDefault()} onClick={() => c().deleteRow().run()}>− Row</button>
          <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-sand-100" onMouseDown={(e) => e.preventDefault()} onClick={() => c().deleteColumn().run()}>− Column</button>
          <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-sand-100" onMouseDown={(e) => e.preventDefault()} onClick={() => c().deleteTable().run()}>Delete table</button>
        </>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[80] grid place-items-center bg-forest-900/50 p-4" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6"><h2 className="mb-4 text-base font-bold text-forest-900">{title}</h2>{children}</div>
    </div>
  );
}

function LinkDialog({ editor, onClose }: { editor: TipTap; onClose: () => void }) {
  const [url, setUrl] = useState<string>((editor.getAttributes("link").href as string) ?? "");
  const [err, setErr] = useState("");
  const apply = () => {
    const v = url.trim();
    if (!v) { editor.chain().focus().unsetLink().run(); return onClose(); }
    if (!/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(v)) { setErr("Use a full https:// address, a path such as /lists, mailto: or tel:."); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: v }).run();
    onClose();
  };
  return (
    <Modal title="Link" onClose={onClose}>
      <label htmlFor="lk" className={label}>Address</label>
      <input id="lk" autoFocus value={url} onChange={(e) => { setUrl(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && apply()} placeholder="https://… or /lists" className={input} />
      {err && <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>}
      <p className="mt-2 text-xs">Select text first. Leave empty and apply to remove a link.</p>
      <div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={apply}>Apply</Button></div>
    </Modal>
  );
}

function VideoDialog({ editor, onClose }: { editor: TipTap; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const apply = () => { if (!embedUrl(url)) { setErr("Paste a YouTube or Vimeo link (https)."); return; } editor.chain().focus().setVideo(url).run(); onClose(); };
  return (
    <Modal title="Embed a video" onClose={onClose}>
      <label htmlFor="vd" className={label}>YouTube or Vimeo link</label>
      <input id="vd" autoFocus value={url} onChange={(e) => { setUrl(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && apply()} placeholder="https://www.youtube.com/watch?v=…" className={input} />
      {err && <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>}
      <p className="mt-2 text-xs">YouTube plays from youtube-nocookie.com. Other sites are not allowed.</p>
      <div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={apply}>Embed</Button></div>
    </Modal>
  );
}

function ImageDialog({ editor, picked, onDone }: { editor: TipTap; picked: Picked & { title?: string; editing?: boolean }; onDone: () => void }) {
  const [alt, setAlt] = useState(picked.alt);
  const [title, setTitle] = useState(picked.title ?? "");
  const apply = () => {
    if (picked.editing) editor.chain().focus().updateAttributes("image", { alt: alt.trim(), title: title.trim() }).run();
    else editor.chain().focus().setImage({ src: picked.url, alt: alt.trim(), title: title.trim() }).run();
    onDone();
  };
  return (
    <Modal title="Image details" onClose={onDone}>
      { }
      <img src={picked.url} alt="" className="mb-4 max-h-40 w-full rounded-xl object-cover" />
      <label htmlFor="ia" className={label}>Alt text</label>
      <input id="ia" autoFocus value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe what the image shows" className={input} />
      {!alt.trim() && <p className="mt-1 text-xs text-amber-800">Alt text helps screen readers and search. Leave it empty only for decorative images.</p>}
      <label htmlFor="ic" className={`${label} mt-3`}>Caption (optional)</label>
      <input id="ic" value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
      <div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={onDone}>Cancel</Button><Button onClick={apply}>{picked.editing ? "Update image" : "Insert image"}</Button></div>
    </Modal>
  );
}
