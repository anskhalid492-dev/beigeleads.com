"use client";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { AiButtons } from "@/components/site-links/ai-buttons";
import { AI_ICONS, DEFAULT_HEADING, DEFAULT_PROMPT, PROMPT_MAX, aiAction, type AiConfig, type AiIcon, type AiPlatform } from "@/lib/site-links/types";
import { saveAiAction } from "../actions";

const inp = "w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm";

export function AiEditor({ initial }: { initial: AiConfig }) {
  const [cfg, setCfg] = useState<AiConfig>(initial);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [tested, setTested] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const setP = (i: number, p: Partial<AiPlatform>) => setCfg((c) => ({ ...c, platforms: c.platforms.map((x, j) => (j === i ? { ...x, ...p } : x)) }));
  const move = (i: number, d: number) => setCfg((c) => { const n = [...c.platforms]; const j = i + d; if (j < 0 || j >= n.length) return c; [n[i], n[j]] = [n[j], n[i]]; return { ...c, platforms: n }; });
  const add = () => setCfg((c) => ({ ...c, platforms: [...c.platforms, { id: `new${Date.now().toString(36)}`, name: "", icon: "custom", homepage: "https://", promptUrl: "", enabled: true, order: c.platforms.length, override: "", fallback: "copy_open" }] }));
  const save = () => start(async () => { setNote(null); const r = await saveAiAction(cfg); setNote(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error }); });
  const test = (p: AiPlatform) => {
    const a = aiAction(p, cfg.prompt);
    setTested((t) => ({ ...t, [p.id]: a.kind === "prefill" ? `Opens: ${a.url.slice(0, 160)}${a.url.length > 160 ? "..." : ""}` : `No verified prefill: copies the prompt and opens ${a.url}` }));
    window.open(a.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-5">
      <Panel title="Heading and default prompt">
        <label className="block text-xs font-semibold">Heading above the buttons
          <input value={cfg.heading} maxLength={60} onChange={(e) => setCfg({ ...cfg, heading: e.target.value })} className={`${inp} mt-1 max-w-sm`} />
        </label>
        <label className="mt-4 block text-xs font-semibold">Default prompt <span className="font-normal text-forest-700">({cfg.prompt.length}/{PROMPT_MAX})</span>
          <textarea value={cfg.prompt} rows={7} onChange={(e) => setCfg({ ...cfg, prompt: e.target.value })} className={`${inp} mt-1`} />
        </label>
        <p className="mt-2 text-xs text-forest-700">It must not ask an AI to invent reviews, hide weaknesses, ignore evidence or always recommend BeigeLeads: such text is refused on save.</p>
        <button type="button" onClick={() => setCfg({ ...cfg, prompt: DEFAULT_PROMPT, heading: DEFAULT_HEADING })} className="mt-2 text-xs underline">Reset heading and prompt to the built-in text</button>
      </Panel>

      <Panel title="Platforms">
        <p className="mb-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">None of these services documents a web link that pre-fills a prompt (checked 21 Nov 2026). So by default a click copies the prompt and opens the platform; the visitor pastes it. Add a prompt link template only after you tested it yourself with Test link: the text must contain {"{prompt}"} once and stay on the platform&apos;s website. The prompt is never sent automatically.</p>
        <ul className="space-y-4">
          {cfg.platforms.map((p, i) => (
            <li key={p.id} className="rounded-xl border border-sand-200 bg-white p-3">
              <div className="grid gap-3 md:grid-cols-[1fr_9rem_1.5fr]">
                <label className="text-xs font-semibold">Name<input value={p.name} maxLength={40} onChange={(e) => setP(i, { name: e.target.value })} className={`${inp} mt-1`} /></label>
                <label className="text-xs font-semibold">Icon
                  <select value={p.icon} onChange={(e) => setP(i, { icon: e.target.value as AiIcon })} className={`${inp} mt-1`}>{AI_ICONS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
                </label>
                <label className="text-xs font-semibold">Homepage (https://)<input value={p.homepage} onChange={(e) => setP(i, { homepage: e.target.value })} inputMode="url" className={`${inp} mt-1`} /></label>
              </div>
              <label className="mt-3 block text-xs font-semibold">Verified prompt link template (optional)
                <input value={p.promptUrl} onChange={(e) => setP(i, { promptUrl: e.target.value })} placeholder="https://example.com/?q={prompt}" className={`${inp} mt-1 font-mono`} />
              </label>
              <label className="mt-3 block text-xs font-semibold">Prompt for this platform only (optional, empty = default prompt)
                <textarea value={p.override} rows={2} onChange={(e) => setP(i, { override: e.target.value })} className={`${inp} mt-1`} />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-1 font-semibold"><input type="checkbox" checked={p.enabled} onChange={(e) => setP(i, { enabled: e.target.checked })} />Show in footer</label>
                <label className="flex items-center gap-1 font-semibold">When there is no verified link
                  <select value={p.fallback} onChange={(e) => setP(i, { fallback: e.target.value as AiPlatform["fallback"] })} className="rounded-lg border border-sand-300 bg-white px-2 py-1">
                    <option value="copy_open">Copy prompt and open</option><option value="open_only">Only open the platform</option>
                  </select>
                </label>
                <button type="button" onClick={() => test(p)} className="rounded-lg border border-sand-300 px-3 py-1.5 font-semibold hover:bg-sand-100">Test link</button>
                <span className="ml-auto flex items-center gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="rounded-lg p-2 hover:bg-sand-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === cfg.platforms.length - 1} aria-label="Move down" className="rounded-lg p-2 hover:bg-sand-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => { if (confirm(`Remove ${p.name || "this platform"}?`)) setCfg((c) => ({ ...c, platforms: c.platforms.filter((_, j) => j !== i) })); }} aria-label="Remove" className="rounded-lg p-2 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </span>
              </div>
              {tested[p.id] && <p className="mt-2 break-all text-xs text-forest-700">{tested[p.id]}</p>}
            </li>
          ))}
        </ul>
        <button type="button" onClick={add} disabled={cfg.platforms.length >= 12} className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-sand-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-sand-100"><Plus className="h-4 w-4" />Add platform</button>
      </Panel>

      <Panel title="Footer preview">
        <div className="rounded-2xl bg-forest-900 p-5"><p className="mb-3 text-base font-semibold text-sand-50">{cfg.heading}</p>
        <div className="text-sand-300"><AiButtons platforms={cfg.platforms.filter((p) => p.enabled && p.name)} prompt={cfg.prompt} preview /></div></div>
        <p className="mt-2 text-xs text-forest-700">Preview only: clicks here do not open anything. Use Test link above.</p>
      </Panel>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60">{pending ? "Saving..." : "Save changes"}</button>
        {note && <p role={note.ok ? "status" : "alert"} className={`text-sm ${note.ok ? "text-forest-700" : "text-red-700"}`}>{note.text}</p>}
      </div>
    </div>
  );
}
