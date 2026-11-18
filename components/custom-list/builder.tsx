"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Summary, summaryLine } from "./summary";
import { StepAudience, StepData, StepLocation, StepReview } from "./steps";
import { EMPTY, STEPS, contactErrors, draftOf, hasContent, qtyNumber, validate, type WizardState } from "./state";
import { prefillFromSearch } from "./prefill";

type Props = {
  categories: readonly { slug: string; name: string }[];
  initial: { q: string; category: string; categoryText: string; quantity: string; country: string; countryText: string; region: string };
};

const TEST_SITE_KEY = "1x00000000000000000000AA";
const DRAFT_KEY = "bl-custom-list-draft-v1";
export function CustomListBuilder({ categories, initial }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const topRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [s, setS] = useState<WizardState>(EMPTY);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [showContactErrors, setShowContactErrors] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ reference: string; snapshot: WizardState; emailed: boolean } | null>(null);
  const [notice, setNotice] = useState("");
  const [panel, setPanel] = useState(false);
  const loaded = useRef(false);

  const set = useCallback((patch: Partial<WizardState>) => { setS((p) => ({ ...p, ...patch })); setError(""); }, []);
  const catalogNames = useMemo(() => categories.map((c) => c.name), [categories]);

  // Start: search prefill wins; otherwise offer the local draft (never contains name, email or message).
  // Reads the URL prefill and this device's storage after hydration (not available on the server), so setState here is intended.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const pre = prefillFromSearch(initial, categories);
    if (Object.keys(pre).length || initial.q) {
      setS((p) => ({ ...p, ...pre }));
      if (Object.keys(pre).length) setNotice("We've added what we understood from your search. Review the details and customize your request.");
    } else {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const d = { ...EMPTY, ...JSON.parse(raw) } as WizardState;
          if (hasContent(d)) { setS(d); setNotice("We restored your unfinished request from this device. Your name and email are never saved."); }
        }
      } catch { /* storage blocked: start empty */ }
    }
    loaded.current = true;
  }, [initial, categories]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!loaded.current || done) return;
    const t = setTimeout(() => {
      try { if (hasContent(s)) localStorage.setItem(DRAFT_KEY, JSON.stringify(draftOf(s))); else localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    }, 400);
    return () => clearTimeout(t);
  }, [s, done]);

  const mountWidget = useCallback(() => {
    if (!window.turnstile || !widgetRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, { sitekey: siteKey, callback: (t: string) => setToken(t), "expired-callback": () => setToken(""), "error-callback": () => setToken("") });
  }, [siteKey]);

  const go = (n: number) => { setStep(n); setError(""); requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })); };
  const next = () => { const e = validate(step, s); if (e) return setError(e); go(step + 1); };
  const jump = (n: number) => { if (n <= step) go(n); else { for (let i = step; i < n; i++) { const e = validate(i, s); if (e) { setStep(i); return setError(e); } } go(n); } };

  async function submit() {
    setError("");
    const miss = validate(0, s) || validate(1, s) || validate(2, s);
    if (miss) { setError(miss); setStep(validate(0, s) ? 0 : validate(1, s) ? 1 : 2); return; }
    const ce = contactErrors(s);
    if (Object.keys(ce).length) { setShowContactErrors(true); return; }
    if (!token) return setError("Please complete the spam check first.");
    setSending(true);
    try {
      const res = await fetch("/api/custom-list", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          turnstileToken: token, website: "",
          name: s.name.trim(), email: s.email.trim(), company: s.company.trim(), message: s.message.trim(),
          audience: s.audience, industries: s.industries, jobTitles: s.jobTitles, targeting: s.targeting,
          locations: s.locations, exclusions: s.exclusions, fields: s.fields, customFields: s.customFields,
          quantity: qtyNumber(s), quantityPlus: s.quantityPlus, instructions: s.instructions.trim(), originalQuery: initial.q,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; reference?: string; emailed?: boolean };
      if (res.ok && data.ok && data.reference) {
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
        setDone({ reference: data.reference, snapshot: s, emailed: !!data.emailed });
        requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
        return;
      }
      setError(data.error ?? "Something went wrong. Your answers are still here. Try again.");
    } catch {
      setError("Could not reach the server. Your answers are still here. Check your connection and try again.");
    }
    setSending(false);
    setToken("");
    window.turnstile?.reset(widgetId.current);
  }

  if (done) {
    return (
      <div ref={topRef} role="status" className="mx-auto max-w-3xl scroll-mt-28 rounded-[2rem] border-2 border-forest-900 bg-forest-100 p-6 sm:p-10">
        <h2 className="display text-5xl text-forest-900">Your custom list request is in.</h2>
        <p className="mt-3 max-w-xl text-lg">Our team will review your targeting requirements and contact you by email about availability and pricing.</p>
        <p className="mt-5 inline-block rounded-xl bg-white px-4 py-2 text-sm">Request reference: <span className="font-mono text-base font-bold text-forest-900">{done.reference}</span></p>
        <p className="mt-3 text-sm">This is a request, not an order. Nothing has been charged. {done.emailed ? `A confirmation was sent to ${done.snapshot.email}.` : "Keep this reference if you contact us."}</p>
        <div className="mt-6 rounded-2xl bg-white p-5"><Summary s={done.snapshot} compact /></div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link href="/lists">Browse available lists</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link href="/">Return home</Link></Button>
        </div>
      </div>
    );
  }

  const ce = showContactErrors ? contactErrors(s) : {};
  const last = step === STEPS.length - 1;
  return (
    <div ref={topRef} className="scroll-mt-28">
      <nav aria-label="Progress" className="mb-6">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold">
          {STEPS.map((n, i) => (
            <li key={n} className="flex items-center gap-2">
              <button type="button" onClick={() => jump(i)} aria-current={i === step ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${i === step ? "border-forest-900 bg-forest-900 text-sand-50" : i < step ? "border-forest-500 bg-forest-100 text-forest-900" : "border-sand-300 bg-white text-forest-700"}`}>
                <span aria-hidden className="grid size-5 place-items-center rounded-full bg-white/20 text-xs">{i < step ? "✓" : i + 1}</span>{n}
              </button>
              {i < STEPS.length - 1 && <span aria-hidden className="text-sand-300">→</span>}
            </li>
          ))}
        </ol>
      </nav>

      {notice && (
        <p role="status" className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-forest-500 bg-forest-100 px-4 py-3 text-sm font-medium text-forest-900">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="shrink-0 rounded font-semibold underline focus-visible:outline-2 focus-visible:outline-purple-600">Dismiss</button>
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)]">
        <form onSubmit={(e) => { e.preventDefault(); if (last) void submit(); else next(); }} noValidate className="min-w-0">
          <div className="rounded-[2rem] border border-sand-200 bg-white p-5 shadow-sm sm:p-8">
            <div key={step} className="cl-step-in">
              {step === 0 && <StepAudience s={s} set={set} catalog={catalogNames} />}
              {step === 1 && <StepLocation s={s} set={set} />}
              {step === 2 && <StepData s={s} set={set} />}
              {step === 3 && (
                <>
                  <StepReview s={s} set={set} errors={ce} onEdit={jump} />
                  <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden"><label>Leave this empty<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>
                  <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mountWidget} />
                  <div className="mt-5" ref={(el) => { widgetRef.current = el; if (el) mountWidget(); else widgetId.current = undefined; }} />
                </>
              )}
            </div>
            {error && <p role="alert" className="mt-5 rounded-xl border border-forest-900 bg-sand-100 px-4 py-3 text-sm font-medium text-forest-900">{error}</p>}
          </div>

          <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex items-center justify-between gap-3 border-t border-sand-200 bg-sand-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
            <Button type="button" variant="secondary" size="lg" className="px-5" disabled={step === 0 || sending} onClick={() => go(step - 1)}>Back</Button>
            <div className="min-w-0 flex-1 text-right">
              <Button type="submit" size="lg" className="w-full px-3 text-[0.95rem] sm:w-auto sm:px-6 sm:text-base" disabled={sending}>{last ? (sending ? "Sending..." : "Request My Custom Quote") : "Continue"}</Button>
              {last && <p className="mt-1 hidden text-xs sm:block">Submitting a request is free. We&apos;ll review your requirements and respond by email.</p>}
            </div>
          </div>
          {last && <p className="mt-2 text-xs sm:hidden">Submitting a request is free. We&apos;ll review your requirements and respond by email.</p>}
        </form>

        <aside aria-label="Your custom list" className="min-w-0">
          <div className="lg:hidden">
            <button type="button" aria-expanded={panel} onClick={() => setPanel(!panel)} className="flex w-full items-center justify-between rounded-2xl border border-sand-200 bg-sand-100 px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-purple-600">
              <span><span className="block text-sm font-bold text-forest-900">Your Custom List</span><span className="block text-xs">{summaryLine(s)}</span></span>
              <span aria-hidden>{panel ? "−" : "+"}</span>
            </button>
            {panel && <div className="mt-2 rounded-2xl border border-sand-200 bg-sand-100 p-4"><Summary s={s} onEdit={(n) => { setPanel(false); jump(n); }} /></div>}
          </div>
          <div className="hidden rounded-[2rem] border border-sand-200 bg-sand-100 p-6 lg:sticky lg:top-28 lg:block">
            <h2 className="display text-3xl text-forest-900">Your Custom List</h2>
            <div className="mt-3"><Summary s={s} onEdit={jump} /></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
