/** Browser-side helpers: shrink big photos before upload and send images to the media API. */
export const MAX_DIMENSION = 2000;
const SKIP_BYTES = 400 * 1024;

/**
 * Downscales large JPEG/PNG/WebP images to at most MAX_DIMENSION px wide and re-encodes them (quality 0.85).
 * GIFs are left alone (animation). Falls back to the original file whenever anything fails or the result is not smaller.
 * `keepType` is used when replacing an image, because a replacement must keep the original file type.
 */
export async function prepareImage(file: File, opts: { keepType?: boolean } = {}): Promise<File> {
  try {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== "function") return file;
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / bmp.width);
    if (scale === 1 && file.size <= SKIP_BYTES) { bmp.close(); return file; }
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bmp.close(); return file; }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    // PNG stays PNG when replacing; otherwise large PNGs become WebP (keeps transparency, much smaller)
    const type = opts.keepType ? file.type : file.type === "image/png" ? "image/webp" : file.type;
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, type, 0.85));
    if (!blob || blob.type !== type || blob.size >= file.size) return file;
    const ext = type === "image/jpeg" ? "jpg" : type === "image/webp" ? "webp" : "png";
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type });
  } catch { return file; }
}

export type Uploaded = { url: string; alt: string };

export async function uploadImage(file: File): Promise<{ ok: true; media: Uploaded } | { ok: false; error: string }> {
  try {
    const body = new FormData();
    body.set("file", await prepareImage(file));
    const res = await fetch("/api/admin/media", { method: "POST", body });
    const j = (await res.json()) as { error?: string; media?: { url: string; alt: string } };
    if (!res.ok || !j.media) return { ok: false, error: j.error ?? "Upload failed." };
    return { ok: true, media: { url: j.media.url, alt: j.media.alt } };
  } catch { return { ok: false, error: "Upload failed. Check your connection and try again." }; }
}
