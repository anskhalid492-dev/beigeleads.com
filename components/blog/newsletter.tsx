import { ApiForm } from "@/components/forms/api-form";

/** Shown only when NEWSLETTER_ENABLED=true. Double opt-in: nothing is sent until the visitor confirms by email. */
export function NewsletterCta() {
  return (
    <section aria-labelledby="nl" className="mx-auto mt-14 max-w-3xl rounded-[2rem] border border-sand-200 bg-white p-8 sm:p-10">
      <h2 id="nl" className="display text-4xl text-forest-900">New articles by email</h2>
      <p className="mt-2 mb-6">We email you when we publish a new article. You confirm your address first, and every email has an unsubscribe link.</p>
      <ApiForm endpoint="/api/newsletter" fields={[{ name: "email", label: "Email address", type: "email", required: true, placeholder: "you@company.com" }]} submitLabel="Subscribe" successTitle="Check your inbox" successText="We sent you a link. Open it to confirm your subscription." />
    </section>
  );
}
