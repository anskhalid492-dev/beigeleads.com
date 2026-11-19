"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadWithProgress } from "@/lib/blog/upload-client";
import { mediaInfoAction, mediaMetaAction, type MediaInfo } from "../../actions";
import { Cropper, type RatioKey } from "./cropper";

export type FeaturedFields = { featuredImage: string | null; featuredAlt: string; featuredCaption: string; featuredFocalX: number; featuredFocalY: number; ogImage: string | null };

const input = "h-10 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm text-forest-900";
const label = "mb-1 block text-sm font-semibold text-forest-900";
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
const FORMATS = "image/jpeg,image/png,image/webp,image/avif,image/gif";

/** Featured image panel: upload or choose, crop, set the focal point, and edit alt text, caption and credit. */
export function FeaturedImage({ f, update, onPickLibrary }: { f: FeaturedFields; update: <K extends keyof FeaturedFields>(k: K, v: FeaturedFields[K]) => void; onPickLibrary: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loaded, setInfo] = useState<MediaInfo | null>(null);
  const [meta, setMeta] = useState({ title: "", description: "", attribution: "" });
  const [metaSaved, setMetaSaved] = useState<"" | "saving" | "saved" | "error">("");
  const [progress, setProgress] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const [crop, setCrop] = useState<null | RatioKey>(null);
  const url = f.featuredImage;
  const info = url && loaded?.url === url ? loaded : null; // ignore a stale record while a new image loads

  useEffect(() => {
    let live = true;
    if (!url) return;
    void mediaInfoAction(url).then((r) => {
      if (!live || !r.ok) return;
      setInfo(r.info);
      setMeta({ title: r.info?.title ?? "", description: r.info?.description ?? "", attribution: r.info?.attribution ?? "" });
    });
    return () => { live = false; };
  }, [url]);

  const take = useCallback(async (file: File) => {
    setErr(""); setProgress(0);
    if (!/^image\/(jpeg|png|webp|avif|gif)$/.test(file.type)) { setProgress(null); return setErr("Use a JPG, PNG, WebP, AVIF or GIF image."); }
    const r = await uploadWithProgress(file, { onProgress: setProgress });
    setProgress(null);
    if (!r.ok) return setErr(r.error);
    update("featuredImage", r.media.url);
    if (!f.featuredAlt) update("featuredAlt", r.media.alt);
    update("featuredFocalX", 50); update("featuredFocalY", 50);
  }, [f.featuredAlt, update]);

  const saveMeta = async () => {
    if (!info) return;
    setMetaSaved("saving");
    const r = await mediaMetaAction(info.id, meta);
    setMetaSaved(r.ok ? "saved" : "error");
  };

  const onCropped = async (file: File, ratio: RatioKey) => {
    const sourceId = info?.originalId ?? info?.id;
    setCrop(null); setErr(""); setProgress(0);
    const r = await uploadWithProgress(file, { onProgress: setProgress, originalId: sourceId, raw: true });
    setProgress(null);
    if (!r.ok) return setErr(r.error);
    if (ratio === "social") update("ogImage", r.media.url);
    else { update("featuredImage", r.media.url); update("featuredFocalX", 50); update("featuredFocalY", 50); }
  };

  const pos = `${f.featuredFocalX}% ${f.featuredFocalY}%`;
  const noAlt = !!url && !f.featuredAlt.trim();
  const cropSource = info?.originalUrl ?? url ?? "";

  return (
    <div className="space-y-4">
      {!url ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const file = e.dataTransfer.files[0]; if (file) void take(file); }}
          className={`rounded-2xl border-2 border-dashed p-6 text-center ${drag ? "border-purple-600 bg-purple-100" : "border-sand-300 bg-sand-50"}`}
        >
          <p className="text-sm font-semibold text-forest-900">Drag an image here</p>
          <p className="mt-1 text-xs">JPG, PNG, WebP, AVIF or GIF. Up to 5 MB, at least 400 px wide. Landscape 16:9 works best.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button type="button" size="sm" onClick={() => fileRef.current?.click()}>Upload from computer</Button>
            <Button type="button" size="sm" variant="secondary" onClick={onPickLibrary}>Choose from library</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-xl bg-sand-100">
            { }
            <img src={url} alt={f.featuredAlt} className="aspect-video w-full object-cover" style={{ objectPosition: pos }} />
            <button
              type="button" aria-label="Set focal point: click the image where the subject is"
              className="absolute inset-0 cursor-crosshair focus-visible:outline-2 focus-visible:outline-purple-600"
              onClick={(e) => { const b = e.currentTarget.getBoundingClientRect(); update("featuredFocalX", Math.round(((e.clientX - b.left) / b.width) * 100)); update("featuredFocalY", Math.round(((e.clientY - b.top) / b.height) * 100)); }}
            >
              <span aria-hidden className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-purple-600/70 shadow" style={{ left: `${f.featuredFocalX}%`, top: `${f.featuredFocalY}%` }} />
            </button>
          </div>
          <p className="text-xs">Click the image to set the focal point. Cards and social previews keep that area in view when they crop.{info ? ` ${info.width ?? "?"} x ${info.height ?? "?"} px, ${kb(info.size)}, ${info.mime.replace("image/", "").toUpperCase()}.` : ""}{info?.originalUrl ? " Cropped from an original that is kept in the library." : ""}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" disabled={info?.mime === "image/gif"} onClick={() => setCrop("blog")}>Crop</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>Upload new</Button>
            <Button type="button" size="sm" variant="secondary" onClick={onPickLibrary}>Library</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => { update("featuredImage", null); update("featuredAlt", ""); update("featuredCaption", ""); setErr(""); }}>Remove</Button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            {[["Blog 16:9", "aspect-video"], ["Social 1.91:1", "aspect-[1.91/1]"], ["Square", "aspect-square"]].map(([n, c]) => (
              <figure key={n}>
                { }
                <img src={n === "Social 1.91:1" && f.ogImage ? f.ogImage : url} alt="" className={`${c} w-full rounded-lg object-cover`} style={{ objectPosition: n === "Social 1.91:1" && f.ogImage ? "50% 50%" : pos }} />
                <figcaption className="mt-1">{n}</figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
      <input ref={fileRef} type="file" accept={FORMATS} className="sr-only" aria-label="Upload featured image" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void take(file); }} />
      {progress !== null && (
        <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress" className="h-2 overflow-hidden rounded-full bg-sand-200"><div className="h-full bg-forest-500 transition-[width]" style={{ width: `${progress}%` }} /></div>
      )}
      {err && <p role="alert" className="rounded-xl border border-forest-900 bg-sand-100 px-3 py-2 text-sm font-medium text-forest-900">{err}</p>}

      {url && (
        <div className="space-y-3">
          <div>
            <label htmlFor="falt" className={label}>Alt text</label>
            <input id="falt" value={f.featuredAlt} onChange={(e) => update("featuredAlt", e.target.value)} className={input} placeholder="Describe what the image shows" maxLength={300} />
            {noAlt && <p role="status" className="mt-1 text-xs font-semibold text-amber-900">SEO warning: add descriptive alt text to your featured image. Describe the image plainly; do not repeat keywords.</p>}
          </div>
          <div>
            <label htmlFor="fcap" className={label}>Caption (shown under the image)</label>
            <input id="fcap" value={f.featuredCaption} onChange={(e) => update("featuredCaption", e.target.value)} className={input} maxLength={300} />
          </div>
          {info && (
            <fieldset className="space-y-3 rounded-xl border border-sand-200 p-3">
              <legend className="px-1 text-xs font-bold text-forest-900">Image details (saved in the media library)</legend>
              <div><label htmlFor="mt" className={label}>Title</label><input id="mt" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} className={input} maxLength={200} /></div>
              <div><label htmlFor="md" className={label}>Description</label><textarea id="md" rows={2} value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} className="w-full rounded-xl border border-sand-300 p-3 text-sm" maxLength={1000} /></div>
              <div><label htmlFor="ma" className={label}>Attribution or source</label><input id="ma" value={meta.attribution} onChange={(e) => setMeta({ ...meta, attribution: e.target.value })} className={input} maxLength={300} placeholder="For example: Created by BeigeLeads" /></div>
              <div className="flex items-center gap-3"><Button type="button" size="sm" variant="secondary" onClick={saveMeta} disabled={metaSaved === "saving"}>Save image details</Button><span role="status" className="text-xs">{metaSaved === "saved" ? "Saved." : metaSaved === "error" ? "Could not save. Try again." : ""}</span></div>
              <p className="text-xs">Filename: {info.filename}. File names are generated when an image is uploaded and cannot be renamed afterwards.</p>
            </fieldset>
          )}
        </div>
      )}
      {crop && cropSource && <Cropper src={cropSource} initial={crop} onCancel={() => setCrop(null)} onDone={onCropped} />}
    </div>
  );
}
