"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { prepareImage } from "@/lib/blog/upload-client";
import { mediaAltAction, mediaDeleteAction, mediaUsageAction } from "../blog/actions";

type Item = { id: number; url: string; filename: string; alt: string; mime: string; size: number; width: number | null; height: number | null; used: number; at: string; by: string };
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export function MediaLibrary({ role, items, total, page, per, q }: { role: "admin" | "editor"; items: Item[]; total: number; page: number; per: number; q: string }) {
  const router = useRouter();
  const toast = useToast();
  const [sel, setSel] = useState<Item | null>(null);
  const [alt, setAlt] = useState("");
  const [uses, setUses] = useState<{ id: number; title: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const repl = useRef<HTMLInputElement>(null);
  const pages = Math.max(1, Math.ceil(total / per));

  const upload = async (files: FileList | File[]) => {
    setBusy(true);
    let ok = 0;
    for (const f of Array.from(files)) {
      const body = new FormData(); body.set("file", await prepareImage(f));
      try {
        const res = await fetch("/api/admin/media", { method: "POST", body });
        const j = (await res.json()) as { error?: string };
        if (res.ok) ok++; else toast(false, `${f.name}: ${j.error ?? "failed"}`);
      } catch { toast(false, `${f.name}: upload failed`); }
    }
    setBusy(false);
    if (ok) { toast(true, `${ok} image${ok === 1 ? "" : "s"} uploaded.`); router.refresh(); }
  };
  const open = async (m: Item) => { setSel(m); setAlt(m.alt); setUses(null); const r = await mediaUsageAction(m.id); if (r.ok) setUses(r.posts); };
  const replace = async (f: File) => {
    if (!sel) return;
    setBusy(true);
    const body = new FormData(); body.set("file", await prepareImage(f, { keepType: true }));
    const res = await fetch(`/api/admin/media?replace=${sel.id}`, { method: "POST", body });
    const j = (await res.json()) as { error?: string };
    setBusy(false);
    if (res.ok) { toast(true, "Image replaced. Articles that use it show the new file."); router.refresh(); } else toast(false, j.error ?? "Replace failed.");
  };

  return (
    <div>
      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); void upload(e.dataTransfer.files); }}
        className={`mb-4 rounded-2xl border-2 border-dashed p-6 text-center text-sm ${drag ? "border-purple-600 bg-purple-100" : "border-sand-300 bg-white"}`}>
        <p className="font-semibold text-forest-900">{busy ? "Working…" : "Drop images here to upload"}</p>
        <p className="mt-1">JPEG, PNG, WebP or GIF, up to 5 MB each. The file type is checked from its contents. Large photos are shrunk to 2000 px wide before upload.</p>
        <input ref={file} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" aria-label="Upload images" onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); e.target.value = ""; }} />
        <Button className="mt-3" variant="secondary" disabled={busy} onClick={() => file.current?.click()}>Choose files</Button>
      </div>
      <form method="get" className="mb-4 flex gap-2"><input name="q" defaultValue={q} placeholder="Search by file name or alt text" aria-label="Search media" className="h-10 flex-1 rounded-xl border border-sand-300 bg-white px-3 text-sm" /><Button type="submit" variant="secondary">Search</Button></form>

      {items.length === 0 ? <p className="rounded-2xl border border-sand-200 bg-white p-10 text-center text-sm">{q ? "No images match your search." : "No images yet. Upload your first one above."}</p> : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => void open(m)} className="block w-full overflow-hidden rounded-xl border border-sand-200 bg-white text-left hover:border-purple-600 focus-visible:outline-2 focus-visible:outline-purple-600">
                { }
                <img src={m.url} alt={m.alt} loading="lazy" className="aspect-square w-full object-cover" />
                <span className="block truncate px-2 pt-1.5 text-xs font-semibold text-forest-900">{m.filename}</span>
                <span className="block px-2 pb-1.5 text-xs">{m.used ? `Used in ${m.used}` : "Not used"}{m.alt ? "" : " · no alt"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span>{total} image{total === 1 ? "" : "s"} · page {page} of {pages}</span>
        <div className="flex gap-2">{page > 1 && <Button asChild size="sm" variant="secondary"><Link href={`?q=${encodeURIComponent(q)}&page=${page - 1}`}>Previous</Link></Button>}{page < pages && <Button asChild size="sm" variant="secondary"><Link href={`?q=${encodeURIComponent(q)}&page=${page + 1}`}>Next</Link></Button>}</div>
      </div>

      {sel && (
        <div role="dialog" aria-modal="true" aria-label="Image details" className="fixed inset-0 z-[80] grid place-items-center bg-forest-900/50 p-4" onKeyDown={(e) => e.key === "Escape" && setSel(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            { }
            <img src={sel.url} alt={sel.alt} className="max-h-60 w-full rounded-xl object-contain" />
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt>File</dt><dd className="truncate">{sel.filename}</dd><dt>Type</dt><dd>{sel.mime}</dd><dt>Size</dt><dd>{kb(sel.size)}</dd>
              <dt>Dimensions</dt><dd>{sel.width && sel.height ? `${sel.width} × ${sel.height}` : "unknown"}</dd><dt>Uploaded</dt><dd>{sel.at} by {sel.by}</dd>
              <dt>Public path</dt><dd className="break-all">{sel.url}</dd>
            </dl>
            <label htmlFor="ma" className="mb-1 mt-4 block text-sm font-semibold text-forest-900">Alt text</label>
            <div className="flex gap-2"><input id="ma" value={alt} onChange={(e) => setAlt(e.target.value)} className="h-10 flex-1 rounded-xl border border-sand-300 px-3 text-sm" /><Button disabled={busy || alt === sel.alt} onClick={async () => { const r = await mediaAltAction(sel.id, alt); if (r.ok) { toast(true, "Alt text saved. New insertions use it."); setSel({ ...sel, alt }); router.refresh(); } else toast(false, r.error); }}>Save</Button></div>
            <p className="mt-1 text-xs">Alt text already placed inside an article is edited in that article.</p>
            <div className="mt-4 text-sm">
              <p className="font-semibold text-forest-900">Used in</p>
              {uses === null ? <p>Checking…</p> : uses.length === 0 ? <p>No articles use this image.</p> : <ul className="list-disc pl-5">{uses.map((u) => <li key={u.id}><Link className="underline" href={`/admin/blog/${u.id}/edit`}>{u.title || "Untitled"}</Link></li>)}</ul>}
            </div>
            <input ref={repl} type="file" accept={sel.mime} className="sr-only" aria-label="Replace image file" onChange={(e) => { const f = e.target.files?.[0]; if (f) void replace(f); e.target.value = ""; }} />
            <div className="mt-5 flex flex-wrap justify-between gap-2">
              <div className="flex gap-2">
                {role === "admin" && <Button variant="secondary" disabled={busy} onClick={() => repl.current?.click()}>Replace file</Button>}
                {role === "admin" && <Button variant="secondary" disabled={busy || uses === null} onClick={async () => {
                  const inUse = (uses?.length ?? 0) > 0;
                  if (!confirm(inUse ? `This image is used in ${uses!.length} article(s). Deleting it leaves broken images there. Delete anyway?` : "Delete this image permanently?")) return;
                  const r = await mediaDeleteAction(sel.id, inUse);
                  if (r.ok) { toast(true, "Image deleted."); setSel(null); router.refresh(); } else toast(false, r.error);
                }}>Delete</Button>}
              </div>
              <Button variant="secondary" onClick={() => setSel(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
