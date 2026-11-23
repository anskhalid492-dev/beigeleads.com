"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { FOLLOWER_RANGES, MAX_QUANTITY, PLATFORMS, PRICE_LABEL_NOTE } from "@/lib/creators/config";
import { estimateCents, formatEstimate, parseQuantity } from "@/lib/creators/pricing";
import { RESPONSE_HOURS } from "@/lib/creators/config";

type Delivery = "sent" | "failed" | "not_configured" | "received";
type Field = "platforms" | "niche" | "country" | "followerRange" | "quantity" | "name" | "email";
const TEST_SITE_KEY = "1x00000000000000000000AA";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const input = "w-full rounded-xl border border-sand-300 bg-white px-4 py-3 text-base text-forest-900 placeholder:text-forest-500/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 aria-[invalid=true]:border-red-700";
const PRESETS = [1000, 5000, 10000, 50000];

declare global { interface Window { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void } } }

export function CreatorInquiryForm() {
  const uid = useId();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const sending = useRef(false);
  const [token, setToken] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [v, setV] = useState({ niche: "", country: "", followerRange: "", quantity: "5000", name: "", email: "", company: "", language: "", audienceGeo: "", engagement: "", notes: "" });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [formError, setFormError] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [result, setResult] = useState<{ reference: string; delivery: Delivery; email: string; estimate: string } | null>(null);

  const qty = parseQuantity(v.quantity);
  const estimate = useMemo(() => (qty === null ? null : formatEstimate(estimateCents(qty))), [qty]);
  const errors = useMemo(() => {
    const e: Partial<Record<Field, string>> = {};
    if (!platforms.length) e.platforms = "Choose at least one platform.";
    if (v.niche.trim().length < 2) e.niche = "Tell us the creator niche.";
    if (v.country.trim().length < 2) e.country = "Enter a country or region.";
    if (!v.followerRange) e.followerRange = "Choose a follower range.";
    if (qty === null) e.quantity = `Enter a whole number from 1 to ${MAX_QUANTITY.toLocaleString("en-US")}.`;
    if (v.name.trim().length < 2) e.name = "Enter your full name.";
    if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address, like name@company.com.";
    return e;
  }, [platforms, v, qty]);
  const show = (f: Field) => (touched[f] ? errors[f] : undefined);
  const set = (f: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV((x) => ({ ...x, [f]: e.target.value }));
  const blur = (f: Field) => () => setTouched((t) => ({ ...t, [f]: true }));
  const toggle = (p: string) => { setPlatforms((a) => (a.includes(p) ? a.filter((x) => x !== p) : [...a, p])); setTouched((t) => ({ ...t, platforms: true })); };

  function mountWidget() {
    if (!window.turnstile || !widgetRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, { sitekey: siteKey, callback: (t: string) => setToken(t), "expired-callback": () => setToken(""), "error-callback": () => setToken("") });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { mountWidget(); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending.current) return; // double-click guard (the server also de-duplicates)
    setTouched({ platforms: true, niche: true, country: true, followerRange: true, quantity: true, name: true, email: true });
    const order: Field[] = ["platforms", "niche", "country", "followerRange", "quantity", "name", "email"];
    const first = order.find((f) => errors[f]);
    if (first) { document.getElementById(`${uid}-${first}`)?.focus(); return; }
    if (!token) { setFormError("Please complete the spam check first."); return; }
    setFormError(""); sending.current = true; setState("sending");
    try {
      const res = await fetch("/api/creators", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ platforms, niche: v.niche.trim(), country: v.country.trim(), followerRange: v.followerRange, quantity: qty, name: v.name.trim(), email: v.email.trim(), company: v.company.trim() || undefined, language: v.language.trim() || undefined, audienceGeo: v.audienceGeo.trim() || undefined, engagement: v.engagement.trim() || undefined, notes: v.notes.trim() || undefined, turnstileToken: token }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; reference?: string; delivery?: Delivery; estimate?: string };
      if (res.ok && data.ok && data.reference) { setResult({ reference: data.reference, delivery: data.delivery ?? "received", email: v.email.trim(), estimate: data.estimate ?? estimate ?? "" }); setState("done"); return; }
      setFormError(data.error ?? "We could not save your request. Please try again.");
    } catch { setFormError("We could not reach the server. Check your connection and try again."); }
    sending.current = false; setState("idle"); setToken(""); if (window.turnstile) window.turnstile.reset(widgetId.current);
  }

  if (state === "done" && result) {
    return (
      <div role="status" className="rounded-3xl border border-forest-500/30 bg-white p-8 sm:p-10">
        <CheckCircle2 className="size-10 text-forest-500" aria-hidden />
        <h3 className="display mt-4 text-4xl text-forest-900">We received your inquiry.</h3>
        <p className="mt-3 text-lg">Your inquiry ID is <strong className="font-mono text-forest-900">{result.reference}</strong>. Estimated price: <strong className="text-forest-900">{result.estimate}</strong>.</p>
        <p className="mt-3">
          {result.delivery === "sent" ? <>We emailed a confirmation to <strong>{result.email}</strong>. </> : <>We saved your request, but we could not confirm that the confirmation email went out. Keep your inquiry ID. </>}
          Our team will review your requirements and reply within {RESPONSE_HOURS} hours. Nothing has been charged.
        </p>
        <p className="mt-4 text-sm">Final quantity and pricing are subject to data availability and confirmation. <Link href="/help-center" className="font-semibold text-forest-900 underline underline-offset-4">Help Center</Link></p>
      </div>
    );
  }

  const label = "mb-1.5 block text-sm font-semibold text-forest-900";
  const err = (f: Field) => show(f) && <p id={`${uid}-${f}-err`} className="mt-1 text-sm text-red-800">{show(f)}</p>;
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={mountWidget} />
      <div className="space-y-6">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <fieldset aria-describedby={show("platforms") ? `${uid}-platforms-err` : undefined}>
          <legend className={label}>Creator platforms <span className="font-normal">(choose one or more)</span></legend>
          <div id={`${uid}-platforms`} tabIndex={-1} className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = platforms.includes(p);
              return (
                <label key={p} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-purple-600 ${on ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900 hover:border-forest-900"}`}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(p)} />{p}
                </label>
              );
            })}
          </div>
          {err("platforms")}
        </fieldset>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor={`${uid}-niche`} className={label}>Creator niche</label><input id={`${uid}-niche`} className={input} value={v.niche} onChange={set("niche")} onBlur={blur("niche")} aria-invalid={!!show("niche")} placeholder="Fitness, beauty, gaming..." maxLength={120} />{err("niche")}</div>
          <div><label htmlFor={`${uid}-country`} className={label}>Country or region</label><input id={`${uid}-country`} className={input} value={v.country} onChange={set("country")} onBlur={blur("country")} aria-invalid={!!show("country")} placeholder="United States, Europe..." maxLength={120} />{err("country")}</div>
          <div><label htmlFor={`${uid}-followerRange`} className={label}>Follower range</label>
            <select id={`${uid}-followerRange`} className={input} value={v.followerRange} onChange={set("followerRange")} onBlur={blur("followerRange")} aria-invalid={!!show("followerRange")}>
              <option value="">Choose a range</option>{FOLLOWER_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>{err("followerRange")}</div>
          <div><label htmlFor={`${uid}-quantity`} className={label}>Number of contacts</label>
            <input id={`${uid}-quantity`} inputMode="numeric" className={input} value={v.quantity} onChange={set("quantity")} onBlur={blur("quantity")} aria-invalid={!!show("quantity")} aria-describedby={`${uid}-q-help`} />
            <div id={`${uid}-q-help`} className="mt-2 flex flex-wrap gap-1.5">{PRESETS.map((n) => <button key={n} type="button" onClick={() => { setV((x) => ({ ...x, quantity: String(n) })); setTouched((t) => ({ ...t, quantity: true })); }} className="rounded-full border border-sand-300 px-3 py-1 text-xs font-semibold text-forest-900 hover:border-forest-900">{n.toLocaleString("en-US")}</button>)}</div>
            {err("quantity")}</div>
          <div><label htmlFor={`${uid}-name`} className={label}>Full name</label><input id={`${uid}-name`} autoComplete="name" className={input} value={v.name} onChange={set("name")} onBlur={blur("name")} aria-invalid={!!show("name")} maxLength={120} />{err("name")}</div>
          <div><label htmlFor={`${uid}-email`} className={label}>Business email</label><input id={`${uid}-email`} type="email" autoComplete="email" className={input} value={v.email} onChange={set("email")} onBlur={blur("email")} aria-invalid={!!show("email")} maxLength={254} />{err("email")}</div>
        </div>
        <details className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-forest-900">Add more detail (optional)</summary>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div><label htmlFor={`${uid}-company`} className={label}>Company name</label><input id={`${uid}-company`} autoComplete="organization" className={input} value={v.company} onChange={set("company")} maxLength={120} /></div>
            <div><label htmlFor={`${uid}-language`} className={label}>Creator language</label><input id={`${uid}-language`} className={input} value={v.language} onChange={set("language")} maxLength={80} /></div>
            <div><label htmlFor={`${uid}-geo`} className={label}>Audience geography</label><input id={`${uid}-geo`} className={input} value={v.audienceGeo} onChange={set("audienceGeo")} maxLength={200} /></div>
            <div><label htmlFor={`${uid}-eng`} className={label}>Engagement requirements</label><input id={`${uid}-eng`} className={input} value={v.engagement} onChange={set("engagement")} maxLength={300} /></div>
            <div className="sm:col-span-2"><label htmlFor={`${uid}-notes`} className={label}>Additional segmentation notes</label><textarea id={`${uid}-notes`} rows={4} className={input} value={v.notes} onChange={set("notes")} maxLength={2000} placeholder="Anything else that helps, including whether you would like a sample." /></div>
          </div>
        </details>
      </div>

      <aside className="rounded-3xl bg-forest-900 p-7 text-sand-100 lg:sticky lg:top-28" aria-live="polite">
        <p className="text-sm font-semibold text-forest-300">Estimated price</p>
        <p className="display mt-2 text-6xl text-sand-50" data-testid="creator-estimate">{estimate ?? "—"}</p>
        <p className="mt-2 text-sm">{qty === null ? "Enter a valid number of contacts." : `${qty.toLocaleString("en-US")} contacts × $0.10`}</p>
        <p className="mt-4 text-xs leading-relaxed text-sand-200">{PRICE_LABEL_NOTE}</p>
        <div ref={widgetRef} className="mt-5" />
        {formError && <p role="alert" className="mt-3 rounded-lg bg-red-100 p-3 text-sm text-red-900">{formError}</p>}
        <button type="submit" disabled={state === "sending"} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-purple-600 font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand-50">
          {state === "sending" ? <><Loader2 className="size-4 animate-spin" aria-hidden />Sending...</> : "Send my inquiry"}
        </button>
        <p className="mt-3 text-xs text-sand-200">No account. No payment now. We reply within {RESPONSE_HOURS} hours.</p>
      </aside>
    </form>
  );
}
