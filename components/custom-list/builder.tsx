"use client";

import Script from "next/script";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  categories: readonly { slug: string; name: string }[];
  fields: readonly string[];
  initial: { q: string; category: string; categoryText: string; quantity: string; country: string; region: string };
};

const TEST_SITE_KEY = "1x00000000000000000000AA";
const OTHER = "other";
const inputClass =
  "w-full rounded-lg border border-sand-300 bg-white px-4 py-3 text-base text-forest-900 placeholder:text-forest-500/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";
const labelClass = "mb-1.5 block text-sm font-semibold text-forest-900";

export function CustomListBuilder({ categories, fields, initial }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;
  const uid = useId();
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const knownCategory = categories.some((c) => c.slug === initial.category);
  const [category, setCategory] = useState(knownCategory ? initial.category : initial.categoryText ? OTHER : "");
  const [categoryText, setCategoryText] = useState(knownCategory ? "" : initial.categoryText);
  const [country, setCountry] = useState(initial.country === "us" ? "us" : initial.country ? OTHER : "us");
  const [countryText, setCountryText] = useState("");
  const [region, setRegion] = useState(initial.region);
  const [quantity, setQuantity] = useState(initial.quantity);
  const [titles, setTitles] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [more, setMore] = useState(false);

  function mountWidget() {
    if (!window.turnstile || !widgetRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      callback: (t: string) => setToken(t),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
  }

  const categoryName = category === OTHER ? categoryText.trim() : categories.find((c) => c.slug === category)?.name ?? "";
  const countryName = country === "us" ? "United States" : countryText.trim();
  const qtyNum = quantity.trim() ? Number(quantity.replace(/,/g, "")) : undefined;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!categoryName) return setError("Tell us which businesses you need.");
    if (!countryName) return setError("Choose a country.");
    if (qtyNum !== undefined && (!Number.isInteger(qtyNum) || qtyNum < 1)) return setError("Enter the quantity as a whole number, or leave it empty.");
    if (!email.trim()) return setError("Enter the email where we should reply.");
    if (!token) return setError("Please complete the spam check first.");
    const form = new FormData(e.currentTarget);
    setState("sending");
    try {
      const res = await fetch("/api/custom-list", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          turnstileToken: token,
          website: String(form.get("website") ?? ""),
          email,
          category: categoryName,
          country: countryName,
          region,
          quantity: qtyNum,
          jobTitles: titles,
          fields: picked,
          notes,
          originalQuery: initial.q,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
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
        <h2 className="display text-4xl text-forest-900">Request received</h2>
        <p className="mt-3 max-w-md">
          We saved your request and will reply to {email} once we have checked whether we can build this list. This is a request, not an order: nothing has been charged and no price has been promised.
        </p>
      </div>
    );
  }

  const summary: [string, string][] = [
    ["Businesses", categoryName || "Not chosen yet"],
    ["Where", [region.trim(), countryName].filter(Boolean).join(", ") || "Not chosen yet"],
    ["Quantity", qtyNum ? qtyNum.toLocaleString("en-US") : "Not stated"],
    ["Job titles", titles.trim() || "Not stated"],
    ["Fields", picked.length ? picked.join(", ") : "Not stated"],
  ];

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div>
          <label htmlFor={`${uid}-cat`} className={labelClass}>Which businesses do you need?</label>
          <select id={`${uid}-cat`} value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option value="">Choose one</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
            <option value={OTHER}>Something else</option>
          </select>
          {category === OTHER && (
            <input aria-label="Describe the businesses" value={categoryText} onChange={(e) => setCategoryText(e.target.value)} placeholder="For example: veterinarians" className={`${inputClass} mt-2`} />
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-country`} className={labelClass}>Country</label>
            <select id={`${uid}-country`} value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
              <option value="us">United States</option>
              <option value={OTHER}>Another country</option>
            </select>
            {country === OTHER && (
              <>
                <input aria-label="Country name" value={countryText} onChange={(e) => setCountryText(e.target.value)} placeholder="Country name" className={`${inputClass} mt-2`} />
                <p className="mt-1.5 text-sm">Our lists cover the United States today. We will tell you honestly whether we can source another country.</p>
              </>
            )}
          </div>
          <div>
            <label htmlFor={`${uid}-region`} className={labelClass}>State or city (optional)</label>
            <input id={`${uid}-region`} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="For example: California" className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor={`${uid}-qty`} className={labelClass}>How many contacts? (optional)</label>
          <input id={`${uid}-qty`} inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="For example: 10000" className={inputClass} />
        </div>

        <div>
          <button type="button" aria-expanded={more} aria-controls={`${uid}-more`} onClick={() => setMore((m) => !m)} className="text-sm font-semibold text-forest-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
            {more ? "Hide extra options" : "Add job titles, fields or notes"}
          </button>
          {more && (
            <div id={`${uid}-more`} className="mt-4 space-y-5">
              <div>
                <label htmlFor={`${uid}-titles`} className={labelClass}>Job titles or decision-makers (optional)</label>
                <input id={`${uid}-titles`} value={titles} onChange={(e) => setTitles(e.target.value)} placeholder="For example: owner, practice manager" className={inputClass} />
              </div>
              <fieldset>
                <legend className={labelClass}>Fields you need (optional)</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {fields.map((f) => (
                    <label key={f} className="flex items-center gap-2 text-base">
                      <input type="checkbox" checked={picked.includes(f)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, f] : p.filter((x) => x !== f)))} className="size-4 accent-purple-600" />
                      {f}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label htmlFor={`${uid}-notes`} className={labelClass}>Anything else we should know (optional)</label>
                <textarea id={`${uid}-notes`} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor={`${uid}-email`} className={labelClass}>Your email</label>
          <input id={`${uid}-email`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>

        <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label>Leave this empty<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>

        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mountWidget} />
        <div ref={(el) => { widgetRef.current = el; if (el) mountWidget(); }} />

        {error && (
          <p role="alert" className="rounded-lg border border-forest-900 bg-sand-100 px-4 py-3 text-sm font-medium text-forest-900">{error}</p>
        )}

        <Button type="submit" size="lg" disabled={state === "sending"}>
          {state === "sending" ? "Sending..." : "Request my custom list"}
        </Button>
      </div>

      <aside aria-label="Your request so far" className="h-fit rounded-2xl border border-sand-200 bg-sand-100 p-6 lg:sticky lg:top-24">
        <h2 className="display text-2xl text-forest-900">Your request</h2>
        <dl className="mt-4 space-y-3 text-sm">
          {summary.map(([k, v]) => (
            <div key={k}>
              <dt className="font-semibold text-forest-900">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-sm">We reply by email after checking whether we can source it. Sending this request does not charge you.</p>
      </aside>
    </form>
  );
}
