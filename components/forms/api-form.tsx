"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type Field =
  | { name: string; label: string; type: "text" | "email"; required?: boolean; placeholder?: string; autoComplete?: string }
  | { name: string; label: string; type: "textarea"; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: "select"; options: readonly { value: string; label: string }[]; required?: boolean };

type Props = {
  endpoint: string;
  fields: readonly Field[];
  submitLabel: string;
  successTitle: string;
  successText: string;
  defaults?: Record<string, string>;
  /** Extra values sent with the form (not shown). */
  hidden?: Record<string, unknown>;
  /** Called when a valid submit starts (for example to count a checkout start). */
  onSubmitStart?: () => void;
};

// Cloudflare's published always-passes test key; used only if no real key is configured (local dev).
const TEST_SITE_KEY = "1x00000000000000000000AA";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

const inputClass =
  "w-full rounded-lg border border-sand-300 bg-white px-4 py-3 text-base text-forest-900 placeholder:text-forest-500/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

export function ApiForm({ endpoint, fields, submitLabel, successTitle, successText, defaults = {}, hidden = {}, onSubmitStart }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;
  const formId = useId();
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  function mountWidget() {
    if (!window.turnstile || !widgetRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      callback: (t: string) => setToken(t),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
  }

  useEffect(() => {
    mountWidget(); // script may already be loaded from another form on a previous page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Please complete the spam check first.");
      return;
    }
    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { ...hidden, turnstileToken: token };
    for (const [k, v] of form.entries()) if (typeof v === "string") body[k] = v;

    setState("sending");
    onSubmitStart?.();
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; redirect?: string };
      if (res.ok && data.ok) {
        if (typeof data.redirect === "string" && data.redirect.startsWith("/")) {
          window.location.assign(data.redirect);
          return;
        }
        setState("done");
        return;
      }
      setError(data.error ?? "Something went wrong. Try again.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setState("idle");
    setToken("");
    window.turnstile?.reset(widgetId.current);
  }

  if (state === "done") {
    return (
      <div role="status" className="rounded-2xl border-2 border-forest-900 bg-forest-100 p-8">
        <h2 className="display text-4xl text-forest-900">{successTitle}</h2>
        <p className="mt-3 max-w-md">{successText}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {fields.map((f) => {
        const id = `${formId}-${f.name}`;
        return (
          <div key={f.name}>
            <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-forest-900">
              {f.label}
              {f.required ? "" : " (optional)"}
            </label>
            {f.type === "textarea" ? (
              <textarea id={id} name={f.name} rows={5} required={f.required} placeholder={f.placeholder} defaultValue={defaults[f.name]} className={inputClass} />
            ) : f.type === "select" ? (
              <select id={id} name={f.name} required={f.required} defaultValue={defaults[f.name] ?? ""} className={inputClass}>
                <option value="">Choose one</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input id={id} name={f.name} type={f.type} required={f.required} placeholder={f.placeholder} autoComplete={f.type === "email" ? "email" : f.autoComplete} defaultValue={defaults[f.name]} className={inputClass} />
            )}
          </div>
        );
      })}

      {/* Honeypot: hidden from people, bots fill it. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mountWidget} />
      <div ref={widgetRef} />

      {error && (
        <p role="alert" className="rounded-lg border border-forest-900 bg-sand-100 px-4 py-3 text-sm font-medium text-forest-900">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={state === "sending"}>
        {state === "sending" ? "Sending..." : submitLabel}
      </Button>
    </form>
  );
}
