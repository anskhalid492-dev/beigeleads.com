"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export const RATIOS = [
  { key: "blog", label: "16:9 blog", w: 1600, h: 900, use: "featured" },
  { key: "social", label: "1.91:1 social", w: 1200, h: 628, use: "social" },
  { key: "square", label: "Square", w: 1080, h: 1080, use: "featured" },
] as const;
export type RatioKey = (typeof RATIOS)[number]["key"];

const VIEW_W = 520;

/** Crop, zoom and reposition. Draws the chosen area into a canvas at a fixed output size and hands back a WebP/JPEG file. The original is never touched. */
export function Cropper({ src, initial = "blog", onCancel, onDone }: { src: string; initial?: RatioKey; onCancel: () => void; onDone: (file: File, ratio: RatioKey) => void }) {
  const [ratio, setRatio] = useState<RatioKey>(initial);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // image centre offset from the frame centre, in frame pixels
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const r = RATIOS.find((x) => x.key === ratio)!;
  const vw = VIEW_W, vh = Math.round((VIEW_W * r.h) / r.w);

  useEffect(() => {
    const i = new Image();
    i.onload = () => setImg(i);
    i.onerror = () => setErr("The image could not be opened.");
    i.src = src;
  }, [src]);

  const base = img ? Math.max(vw / img.naturalWidth, vh / img.naturalHeight) : 1;
  const scale = base * zoom;
  const clamp = (p: { x: number; y: number }) => {
    if (!img) return p;
    const mx = Math.max(0, (img.naturalWidth * scale - vw) / 2), my = Math.max(0, (img.naturalHeight * scale - vh) / 2);
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  };
  const p = clamp(pos);

  const apply = async () => {
    if (!img) return;
    setBusy(true); setErr("");
    try {
      const sw = vw / scale, sh = vh / scale;
      const sx = img.naturalWidth / 2 - p.x / scale - sw / 2, sy = img.naturalHeight / 2 - p.y / scale - sh / 2;
      const c = document.createElement("canvas");
      c.width = r.w; c.height = r.h;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("no canvas");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, Math.max(0, sx), Math.max(0, sy), Math.min(sw, img.naturalWidth), Math.min(sh, img.naturalHeight), 0, 0, r.w, r.h);
      let blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/webp", 0.88));
      let ext = "webp";
      if (!blob || blob.type !== "image/webp") { blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.88)); ext = "jpg"; }
      if (!blob) throw new Error("encode");
      onDone(new File([blob], `featured-${ratio}.${ext}`, { type: blob.type }), ratio);
    } catch { setErr("Could not create the cropped image. Try a different image."); setBusy(false); }
  };

  const move = (dx: number, dy: number) => setPos(clamp({ x: p.x + dx, y: p.y + dy }));

  return (
    <div role="dialog" aria-modal="true" aria-label="Crop image" className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-forest-900/60 p-4">
      <div className="w-full max-w-[34rem] rounded-2xl bg-white p-5">
        <h2 className="text-base font-bold text-forest-900">Crop image</h2>
        <div role="group" aria-label="Aspect ratio" className="mt-3 flex flex-wrap gap-2">
          {RATIOS.map((x) => <button key={x.key} type="button" aria-pressed={ratio === x.key} onClick={() => { setRatio(x.key); setPos({ x: 0, y: 0 }); }} className={`rounded-full border px-3 py-1 text-sm font-semibold ${ratio === x.key ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300"}`}>{x.label}</button>)}
        </div>
        <div className="mt-4 flex justify-center">
          <div
            tabIndex={0} role="application" aria-label="Crop area. Drag, or use the arrow keys, to reposition."
            className="relative touch-none select-none overflow-hidden rounded-xl bg-sand-200 outline-offset-2 focus-visible:outline-2 focus-visible:outline-purple-600"
            style={{ width: vw, height: vh, maxWidth: "100%" }}
            onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: p.x, py: p.y }; }}
            onPointerMove={(e) => { if (drag.current) setPos(clamp({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y })); }}
            onPointerUp={() => { drag.current = null; }}
            onKeyDown={(e) => { const s = e.shiftKey ? 30 : 10; if (e.key === "ArrowLeft") { e.preventDefault(); move(-s, 0); } else if (e.key === "ArrowRight") { e.preventDefault(); move(s, 0); } else if (e.key === "ArrowUp") { e.preventDefault(); move(0, -s); } else if (e.key === "ArrowDown") { e.preventDefault(); move(0, s); } }}
          >
            {img && (
               
              <img src={src} alt="" draggable={false} style={{ position: "absolute", left: "50%", top: "50%", width: img.naturalWidth * scale, height: img.naturalHeight * scale, maxWidth: "none", transform: `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))` }} />
            )}
            {!img && !err && <p className="grid h-full place-items-center text-sm">Loading...</p>}
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="crop-zoom" className="text-sm font-semibold text-forest-900">Zoom</label>
          <input id="crop-zoom" type="range" min={1} max={4} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-purple-600" />
        </div>
        <p className="mt-2 text-xs">Output {r.w} x {r.h}. Your original image stays in the media library. {r.use === "social" ? "This crop becomes the social sharing image." : "This crop becomes the featured image."}</p>
        {err && <p role="alert" className="mt-2 text-sm font-medium text-forest-900">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button type="button" onClick={apply} disabled={!img || busy}>{busy ? "Cropping..." : r.use === "social" ? "Use as social image" : "Use as featured image"}</Button>
        </div>
      </div>
    </div>
  );
}
