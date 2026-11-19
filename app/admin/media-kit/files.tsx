"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/media-kit/format";
import type { KitFile } from "@/lib/media-kit/store";
import { deleteFileAction, setFilePublishedAction, updateFileAction } from "./actions";

const input = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";

async function upload(url: string, form: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const r = await fetch(url, { method: "POST", body: form });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    return r.ok ? { ok: true } : { ok: false, error: j.error ?? "Upload failed." };
  } catch { return { ok: false, error: "Upload failed. Check your connection and try again." }; }
}

function Row({ f }: { f: KitFile }) {
  const [label, setLabel] = useState(f.label);
  const [desc, setDesc] = useState(f.description);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const replace = useRef<HTMLInputElement>(null);
  const act = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string) => start(async () => { const r = await fn(); toast(r.ok, r.ok ? done : r.error); if (r.ok) router.refresh(); });
  return (
    <li className="space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span><b className="text-forest-900">{f.filename}</b> · {f.contentType} · {fmt(f.bytes)}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${f.published ? "bg-forest-100 text-forest-900" : "bg-amber-100 text-amber-900"}`}>{f.published ? "Published" : "Hidden"}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor={`l${f.id}`} className="mb-1 block text-xs font-semibold text-forest-900">Name shown to visitors</label><input id={`l${f.id}`} value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} className={input} /></div>
        <div><label htmlFor={`d${f.id}`} className="mb-1 block text-xs font-semibold text-forest-900">Short description</label><input id={`d${f.id}`} value={desc} maxLength={200} onChange={(e) => setDesc(e.target.value)} className={input} /></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => act(() => updateFileAction(f.id, { label, description: desc }), "Details saved")}>Save details</Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => act(() => setFilePublishedAction(f.id, !f.published), f.published ? "File hidden" : "File published")}>{f.published ? "Hide from page" : "Publish on page"}</Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => replace.current?.click()}>Replace file</Button>
        <input ref={replace} type="file" hidden accept=".pdf,.zip,.png,.jpg,.jpeg,.webp,.svg" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const fd = new FormData(); fd.append("file", file); act(() => upload(`/api/admin/media-kit?replace=${f.id}`, fd), "File replaced"); e.target.value = ""; }} />
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => { if (confirm(`Delete “${f.label}”? The file is removed for good.`)) act(() => deleteFileAction(f.id), "File deleted"); }}>Delete</Button>
      </div>
    </li>
  );
}

export function FilesManager({ files }: { files: KitFile[] }) {
  const [label, setLabel] = useState("");
  const [desc, setDesc] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const add = () => start(async () => {
    const f = file.current?.files?.[0];
    if (!f) { toast(false, "Choose a file first."); return; }
    const fd = new FormData(); fd.append("file", f); fd.append("label", label); fd.append("description", desc);
    const r = await upload("/api/admin/media-kit", fd);
    toast(r.ok, r.ok ? "Uploaded. It stays hidden until you publish it." : r.error);
    if (r.ok) { setLabel(""); setDesc(""); if (file.current) file.current.value = ""; router.refresh(); }
  });
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); add(); }} className="space-y-3 border-b border-sand-200 p-5">
        <p className="text-sm">PDF, ZIP, PNG, JPEG, WebP or SVG, up to 10 MB. The file type is checked from the file itself. New files are hidden until you publish them.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="nl" className="mb-1 block text-xs font-semibold text-forest-900">Name shown to visitors</label><input id="nl" value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} className={input} /></div>
          <div><label htmlFor="nd" className="mb-1 block text-xs font-semibold text-forest-900">Short description (optional)</label><input id="nd" value={desc} maxLength={200} onChange={(e) => setDesc(e.target.value)} className={input} /></div>
        </div>
        <input ref={file} type="file" accept=".pdf,.zip,.png,.jpg,.jpeg,.webp,.svg" aria-label="File to upload" className="block text-sm" />
        <Button type="submit" disabled={pending}>{pending ? "Uploading…" : "Upload file"}</Button>
      </form>
      {files.length === 0 ? <p className="p-5 text-sm">No extra downloads yet.</p> : <ul className="divide-y divide-sand-200">{files.map((f) => <Row key={f.id} f={f} />)}</ul>}
    </div>
  );
}
