import { JsonLd } from "./json-ld";

export type FaqItem = readonly [question: string, answer: string];

export function Faq({ items, heading = "Questions" }: { items: readonly FaqItem[]; heading?: string }) {
  return (
    <section className="border-t border-sand-200 bg-sand-100 py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="display text-5xl text-forest-900 sm:text-6xl">{heading}</h2>
        <div className="mt-8 divide-y divide-sand-300 border-y border-sand-300">
          {items.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-semibold text-forest-900">
                {q}
                <span
                  aria-hidden
                  className="text-2xl leading-none text-forest-500 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-xl">{a}</p>
            </details>
          ))}
        </div>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map(([q, a]) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }}
      />
    </section>
  );
}
