"use client";
import { useActionState, useState } from "react";
import { Badge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { removeKeyAction, saveProviderAction, saveSettingsAction, testProviderAction, type Result } from "../actions";
import type { ProviderRow } from "@/lib/beigepilot/store";

const inp = "mt-1 w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-forest-900";
const Msg = ({ r }: { r: Result | null }) => r && <p role="status" className={`text-sm font-semibold ${r.ok ? "text-forest-700" : "text-red-700"}`}>{r.message}</p>;

export function ProviderCard({ p, label }: { p: ProviderRow; label: string }) {
  const [saved, save, saving] = useActionState(saveProviderAction, null);
  const [tested, test, testing] = useActionState(testProviderAction, null);
  const [removed, remove, removing] = useActionState(removeKeyAction, null);
  const [key, setKey] = useState("");
  const [model, setModel] = useState(p.model);
  const models = tested?.models ?? (p.model ? [p.model] : []);
  return (
    <section className="rounded-2xl border border-sand-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-forest-900">{label}</h2><Badge tone={p.hasKey ? "good" : "mute"}>{p.hasKey ? `Key saved ${p.hint}` : "No key"}</Badge></div>
      <form action={save} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={p.id} />
        <label className="sm:col-span-2 text-sm font-semibold text-forest-900">API key (write-only)
          <input name="apiKey" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder={p.hasKey ? "Leave empty to keep the saved key" : "Paste the key"} className={inp} /></label>
        <label className="sm:col-span-2 text-sm font-semibold text-forest-900">Model
          <input name="model" list={`m-${p.id}`} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Press “Test & load models”, then choose" className={inp} />
          <datalist id={`m-${p.id}`}>{models.map((m) => <option key={m} value={m} />)}</datalist></label>
        <label className="text-sm font-semibold text-forest-900">Temperature (0 to 1)<input name="temperature" type="number" step="0.1" min="0" max="1" defaultValue={p.temperature} className={inp} /></label>
        <label className="text-sm font-semibold text-forest-900">Max answer tokens<input name="maxTokens" type="number" min="100" max="4000" defaultValue={p.maxTokens} className={inp} /></label>
        <label className="text-sm font-semibold text-forest-900">Input price, USD per 1M tokens (optional)<input name="priceIn" type="number" step="0.01" min="0" defaultValue={p.priceIn ?? ""} className={inp} /></label>
        <label className="text-sm font-semibold text-forest-900">Output price, USD per 1M tokens (optional)<input name="priceOut" type="number" step="0.01" min="0" defaultValue={p.priceOut ?? ""} className={inp} /></label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          <Button type="submit" variant="secondary" formAction={test} disabled={testing}>{testing ? "Testing..." : "Test & load models"}</Button>
          {p.hasKey && <Button type="submit" variant="secondary" formAction={remove} disabled={removing} onClick={(e) => { if (!confirm("Remove the saved key?")) e.preventDefault(); }}>Remove key</Button>}
        </div>
        <div className="sm:col-span-2 space-y-1"><Msg r={saved} /><Msg r={tested} /><Msg r={removed} /></div>
      </form>
    </section>
  );
}

export function RoutingForm({ active, fallback, ids, daily, tokens, spend }: { active: string; fallback: string; ids: { id: string; label: string }[]; daily: number; tokens: number; spend: number | null }) {
  const [r, act, pending] = useActionState(saveSettingsAction, null);
  // Controlled values: React resets uncontrolled fields after a form action, which looked like "nothing happens".
  const [a, setA] = useState(active);
  const [f, setF] = useState(fallback);
  const [d, setD] = useState(String(daily));
  const [t, setT] = useState(String(tokens));
  const [m, setM] = useState(spend === null ? "" : String(spend));
  const label = (id: string) => ids.find((i) => i.id === id)?.label ?? "None";
  return (
    <form action={act} className="grid gap-3 rounded-2xl border border-sand-200 bg-white p-5 sm:grid-cols-2">
      <p className="sm:col-span-2 text-sm">Saved active provider: <b className="text-forest-900">{label(active)}</b>{a !== active && <span className="ml-2 font-semibold text-purple-700">Selected: {label(a)}. Press Save to apply.</span>}</p>
      <label className="text-sm font-semibold text-forest-900">Active provider
        <select name="active" value={a} onChange={(e) => { setA(e.target.value); if (e.target.value === f) setF(""); }} className={inp}><option value="">None</option>{ids.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}</select></label>
      <label className="text-sm font-semibold text-forest-900">Fallback provider (used if the active one fails)
        <select name="fallback" value={f} onChange={(e) => setF(e.target.value)} className={inp}><option value="">None</option>{ids.filter((i) => i.id !== a).map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}</select></label>
      <label className="text-sm font-semibold text-forest-900">Daily request limit<input name="dailyRequestLimit" type="number" min="1" value={d} onChange={(e) => setD(e.target.value)} className={inp} /></label>
      <label className="text-sm font-semibold text-forest-900">Daily token limit<input name="dailyTokenLimit" type="number" min="1000" value={t} onChange={(e) => setT(e.target.value)} className={inp} /></label>
      <label className="sm:col-span-2 text-sm font-semibold text-forest-900">Monthly spend limit, USD (optional; needs token prices above)<input name="monthlySpendUsd" type="number" step="0.01" min="0" value={m} onChange={(e) => setM(e.target.value)} className={inp} /></label>
      <div className="sm:col-span-2 flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save routing and limits"}</Button><Msg r={r} /></div>
    </form>
  );
}

export function BehaviorForm({ enabled, name, humor, motion, launcher, suggestions, greeting, instructions, saveChats, retentionDays }: { enabled: boolean; name: string; humor: string; motion: string; launcher: string; suggestions: string; greeting: string; instructions: string; saveChats: boolean; retentionDays: number }) {
  const [r, act, pending] = useActionState(saveSettingsAction, null);
  const [on, setOn] = useState(enabled);
  const [g, setG] = useState(greeting);
  const [nm, setNm] = useState(name);
  const [hu, setHu] = useState(humor);
  const [mo, setMo] = useState(motion);
  const [la, setLa] = useState(launcher);
  const [sg, setSg] = useState(suggestions);
  const [ins, setIns] = useState(instructions);
  const [save, setSave] = useState(saveChats);
  const [ret, setRet] = useState(String(retentionDays));
  return (
    <form action={act} className="grid gap-4 rounded-2xl border border-sand-200 bg-white p-5">
      <label className="flex items-center gap-3 text-sm font-semibold text-forest-900"><input type="hidden" name="enabled" value="0" /><input type="checkbox" name="enabled" value="1" checked={on} onChange={(e) => setOn(e.target.checked)} className="size-4" />Show BeigePilot to visitors</label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-forest-900">Assistant display name (max 24)<input name="name" maxLength={24} value={nm} onChange={(e) => setNm(e.target.value)} className={inp} /></label>
        <label className="text-sm font-semibold text-forest-900">Launcher position
          <select name="launcher" value={la} onChange={(e) => setLa(e.target.value)} className={inp}><option value="right">Bottom right</option><option value="left">Bottom left</option></select></label>
        <label className="text-sm font-semibold text-forest-900">Humor level
          <select name="humor" value={hu} onChange={(e) => setHu(e.target.value)} className={inp}><option value="professional">Professional (no jokes)</option><option value="friendly">Friendly (rare light remark)</option><option value="playful">Playful (occasional short joke)</option></select>
          <span className="mt-1 block text-xs font-normal">Never applies to payments, privacy, security or data accuracy.</span></label>
        <label className="text-sm font-semibold text-forest-900">Mascot animation intensity
          <select name="motion" value={mo} onChange={(e) => setMo(e.target.value)} className={inp}><option value="calm">Calm</option><option value="balanced">Balanced</option><option value="lively">Lively</option></select>
          <span className="mt-1 block text-xs font-normal">Visitors who prefer reduced motion always see a still mascot.</span></label>
      </div>
      <label className="text-sm font-semibold text-forest-900">Welcome message (max 300)<textarea name="greeting" rows={2} maxLength={300} value={g} onChange={(e) => setG(e.target.value)} className={inp} /></label>
      <label className="text-sm font-semibold text-forest-900">Suggested questions (one per line, up to 4, max 60 characters each)
        <textarea name="suggestions" rows={4} value={sg} onChange={(e) => setSg(e.target.value)} className={inp} placeholder={"Find my ideal database\nExplore countries\nBrowse industries\nHow does BeigeLeads work?"} />
        <span className="mt-1 block text-xs font-normal">Shown on pages without their own questions (product and cart pages keep theirs). Each one is sent as a normal message, so keep them answerable. Empty = built-in questions.</span></label>
      <label className="text-sm font-semibold text-forest-900">Style notes for the assistant (max 1,500)
        <textarea name="instructions" rows={5} maxLength={1500} value={ins} onChange={(e) => setIns(e.target.value)} className={inp} />
        <span className="mt-1 block text-xs font-normal">Tone and wording only. These notes can never override the safety rules (no invented prices, counts or claims) and are lower priority than them.</span></label>
      <fieldset className="rounded-xl border border-sand-200 p-4">
        <legend className="px-1 text-sm font-bold text-forest-900">Conversation history</legend>
        <label className="flex items-center gap-3 text-sm font-semibold text-forest-900"><input type="hidden" name="saveChats" value="0" /><input type="checkbox" name="saveChats" value="1" checked={save} onChange={(e) => setSave(e.target.checked)} className="size-4" />Save conversations so I can review them</label>
        <p className="mt-1 text-xs">Off by default. When on, the chat tells visitors that conversations may be stored. Emails, phone-like numbers and key-like text are replaced before saving. Not saved: anything from the admin playground.</p>
        <label className="mt-3 block text-sm font-semibold text-forest-900">Delete saved conversations after
          <select name="retentionDays" value={ret} onChange={(e) => setRet(e.target.value)} className={inp}>{[30, 90, 180, 365].map((d) => <option key={d} value={d}>{d} days</option>)}</select></label>
      </fieldset>
      <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button><Msg r={r} /></div>
    </form>
  );
}
