"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/blog/upload-client";
import { listMediaAction } from "./actions";

export type Picked = { url: string; alt: string };
type Item = { id: number; url: string; alt: string; filename: string; width: number | null; height: number | null };

/** Upload a new image or reuse one from the library. Calls `onPick` with the public path and its saved alt text. */
export function MediaPicker({ onPick, onClose }: { onPick: (p: Picked) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (query: string, pg: number) => {
    const r = await listMediaAction(query, pg);
    if (r.ok) { setItems(r.items); setTotal(r.total); setErr(""); } else setErr(r.error);
  }, []);
  useEffect(() => { const t = setTimeout(() => void load(q, page), q ? 250 : 0); return () => clearTimeout(t); }, [q, page, load]);

  const upload = async (file: File) => {
    setBusy(true); setErr("");
    const r = await uploadImage(file);
    setBusy(false);
    if (r.ok) onPick(r.media); else setErr(r.error);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Choose an image" className="fixed inset-0 z-[80] grid place-items-center bg-forest-900/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-sand-200 px-5 py-3">
          <h2 className="text-base font-bold text-forest-900">Choose an image</h2>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm font-semibold hover:bg-sand-100">Close</button>
        </div>
        <div className="overflow-y-auto p-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) void upload(f); }}
            className={`rounded-2xl border-2 border-dashed p-6 text-center text-sm ${drag ? "border-purple-600 bg-purple-100" : "border-sand-300"}`}>
            <p className="font-semibold text-forest-900">{busy ? "Uploading…" : "Drop an image here"}</p>
            <p className="mt-1">JPEG, PNG, WebP or GIF, up to 5 MB. Large photos are shrunk to 2000 px wide before upload.</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="sr-only" aria-label="Upload an image" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
            <Button className="mt-3" variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>Choose file</Button>
          </div>
          {err && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{err}</p>}
          <div className="mt-5 flex items-center gap-3">
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search your library" aria-label="Search library" className="h-10 flex-1 rounded-xl border border-sand-300 px-3 text-sm" />
            <span className="text-sm">{total} image{total === 1 ? "" : "s"}</span>
          </div>
          {items.length === 0 ? <p className="py-8 text-center text-sm">No images yet. Upload one above.</p> : (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => onPick({ url: m.url, alt: m.alt })} className="block w-full overflow-hidden rounded-xl border border-sand-200 text-left hover:border-purple-600 focus-visible:outline-2 focus-visible:outline-purple-600">
                    { }
                    <img src={m.url} alt={m.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    <span className="block truncate px-2 py-1.5 text-xs">{m.filename}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {total > 18 && (
            <div className="mt-4 flex justify-center gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={page * 18 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
