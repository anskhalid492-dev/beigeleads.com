"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthorAvatar } from "@/components/blog/avatar";
import { Button } from "@/components/ui/button";

const OUT = 640; // saved size in pixels (square)
const BOX = 288; // crop area on screen
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_IN = 12 * 1024 * 1024;

type Props = { value: string | null; name: string; onChange: (url: string | null) => void };

export function PhotoField({ value, name, onChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined | null) => {
    setErr("");
    if (!f) return;
    if (!ACCEPT.includes(f.type)) return setErr("Use a JPG, PNG or WebP photo.");
    if (f.size > MAX_IN) return setErr("That photo is over 12 MB. Choose a smaller one.");
    setFile(f);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex items-end gap-3" aria-label="Photo previews">
          <figure className="text-center">
            {value ? (
              <img src={value} alt={`Square preview of ${name || "the author"}`} width={112} height={112} className="size-28 rounded-2xl border border-sand-200 object-cover" />
            ) : <div className="grid size-28 place-items-center rounded-2xl border border-dashed border-sand-300 bg-sand-50 text-xs">No photo</div>}
            <figcaption className="mt-1 text-xs">Square</figcaption>
          </figure>
          <figure className="text-center">
            <AuthorAvatar photo={value} name={name} size={72} />
            <figcaption className="mt-1 text-xs">{value ? "Circle" : "Default avatar"}</figcaption>
          </figure>
        </div>
        <div className="min-w-0 flex-1 basis-60">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
            className={`rounded-2xl border-2 border-dashed p-4 text-sm transition-colors ${drag ? "border-purple-600 bg-purple-100" : "border-sand-300 bg-sand-50"}`}
          >
            <p className="font-semibold text-forest-900">Drag a photo here, or</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => input.current?.click()}>{value ? "Replace photo" : "Choose photo"}</Button>
              {value && <Button type="button" size="sm" variant="secondary" onClick={() => onChange(null)}>Remove photo</Button>}
            </div>
            <p className="mt-2 text-xs">JPG, PNG or WebP, up to 12 MB. You crop it next and it is saved as a 640 px square. Use a photo of the author that you have their permission to publish.</p>
            <input ref={input} type="file" accept={ACCEPT.join(",")} className="sr-only" aria-label="Choose a profile photo" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          {err && <p role="alert" className="mt-2 text-sm font-semibold text-red-800">{err}</p>}
        </div>
      </div>
      {file && <Cropper file={file} onClose={() => setFile(null)} onDone={(url) => { onChange(url); setFile(null); }} />}
    </div>
  );
}

function Cropper({ file, onClose, onDone }: { file: File; onClose: () => void; onDone: (url: string) => void }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const circle = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 }); // which part of the image is at the centre (0..1)
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    dlg.current?.showModal();
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => setImg(i);
    i.onerror = () => setErr("This file could not be read as an image.");
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /** Draws the crop into a canvas of `size` px. Same maths for the screen preview and the saved file. */
  const draw = useCallback((c: HTMLCanvasElement, size: number) => {
    if (!img) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const cover = Math.max(size / img.naturalWidth, size / img.naturalHeight);
    const s = cover * zoom;
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    const x = Math.min(0, Math.max(size - w, size / 2 - pos.x * w));
    const y = Math.min(0, Math.max(size - h, size / 2 - pos.y * h));
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, x, y, w, h);
  }, [img, zoom, pos]);

  useEffect(() => { if (canvas.current) draw(canvas.current, BOX); if (circle.current) draw(circle.current, 72); }, [draw]);

  const move = (dx: number, dy: number) => {
    if (!img) return;
    const cover = Math.max(BOX / img.naturalWidth, BOX / img.naturalHeight) * zoom;
    setPos((p) => ({ x: Math.min(1, Math.max(0, p.x - dx / (img.naturalWidth * cover))), y: Math.min(1, Math.max(0, p.y - dy / (img.naturalHeight * cover))) }));
  };

  const save = async () => {
    if (!img) return;
    setBusy(true); setErr("");
    try {
      const c = document.createElement("canvas");
      c.width = c.height = OUT;
      draw(c, OUT);
      const blob: Blob | null = await new Promise((r) => c.toBlob((b) => (b && b.type === "image/webp" ? r(b) : c.toBlob(r, "image/jpeg", 0.9)), "image/webp", 0.88));
      if (!blob) throw new Error("encode");
      const fd = new FormData();
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      fd.set("file", new File([blob], `author-photo.${ext}`, { type: blob.type }));
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; media?: { url: string } };
      if (!res.ok || !j.ok || !j.media) throw new Error(j.error ?? "Upload failed. Try again.");
      onDone(j.media.url);
    } catch (e) {
      setErr(e instanceof Error && e.message !== "encode" ? e.message : "Could not save the photo. Try again.");
    } finally { setBusy(false); }
  };

  return (
    <dialog ref={dlg} onClose={onClose} aria-labelledby="crop-title" className="m-auto w-[min(26rem,calc(100vw-1.5rem))] rounded-2xl border border-sand-200 bg-white p-0 text-forest-700 shadow-xl backdrop:bg-forest-900/50">
      <div className="space-y-4 p-5">
        <h2 id="crop-title" className="text-lg font-bold text-forest-900">Crop the photo</h2>
        {err && !img ? <p role="alert" className="text-sm font-semibold text-red-800">{err}</p> : (
          <>
            <div
              className="mx-auto touch-none overflow-hidden rounded-2xl border border-sand-200 outline-offset-2 focus-visible:outline-2 focus-visible:outline-purple-600"
              style={{ width: BOX, height: BOX, cursor: "grab" }}
              tabIndex={0}
              role="group"
              aria-label="Crop area. Drag the photo, or use the arrow keys to move it."
              onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }; }}
              onPointerMove={(e) => { const d = drag.current; if (!d) return; move(e.clientX - d.x, e.clientY - d.y); drag.current = { ...d, x: e.clientX, y: e.clientY }; }}
              onPointerUp={() => { drag.current = null; }}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 24 : 8;
                const m: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
                if (m[e.key]) { e.preventDefault(); move(...m[e.key]); }
              }}
            >
              <canvas ref={canvas} width={BOX} height={BOX} aria-hidden className="block" style={{ width: BOX, height: BOX }} />
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="zoom" className="text-sm font-semibold text-forest-900">Zoom</label>
              <input id="zoom" type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-purple-600" />
              <canvas ref={circle} width={72} height={72} aria-label="Circle preview" role="img" className="size-[72px] rounded-full border border-sand-200" />
            </div>
            <p className="text-xs">Drag to reposition. Arrow keys move it too. The circle shows how it looks on articles.</p>
          </>
        )}
        {err && img && <p role="alert" className="text-sm font-semibold text-red-800">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => dlg.current?.close()}>Cancel</Button>
          <Button type="button" disabled={!img || busy} onClick={save}>{busy ? "Saving…" : "Use this photo"}</Button>
        </div>
      </div>
    </dialog>
  );
}
