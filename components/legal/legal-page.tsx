import Link from "next/link";
import { Fragment } from "react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { LEGAL_UPDATED, formatLegalDate, legalDocs, type LegalDoc } from "@/lib/legal/docs";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Turns "[TO CONFIRM: x]" into a visible marker so drafts can never pass for final text. */
function Text({ children }: { children: string }) {
  const parts = children.split(/(\[TO CONFIRM:[^\]]*\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("[TO CONFIRM:") ? (
          <mark key={i} className="rounded bg-purple-100 px-1.5 py-0.5 text-sm font-semibold text-forest-900">
            {part.slice(1, -1)}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <Breadcrumbs items={[{ name: "Legal", href: "/legal/privacy" }, { name: doc.title, href: `/legal/${doc.slug}` }]} />
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8">
        <h1 className="display text-5xl text-forest-900 sm:text-6xl">{doc.title}</h1>
        <p className="mt-3 max-w-2xl text-lg">{doc.summary}</p>
        <p className="mt-4 text-sm font-semibold text-forest-500">
          Last updated <time dateTime={LEGAL_UPDATED}>{formatLegalDate(LEGAL_UPDATED)}</time>
        </p>

        <p className="mt-6 rounded-2xl border border-sand-300 bg-sand-100 p-4 text-sm" role="note">
          <strong className="text-forest-900">Draft, under legal review.</strong> This page is not final and not yet in force. Highlighted
          notes mark details we still have to confirm.
        </p>

        <div className="mt-12 grid gap-12 lg:grid-cols-[14rem_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="On this page">
              <p className="text-sm font-semibold text-forest-900">On this page</p>
              <ul className="mt-3 space-y-2 border-l border-sand-300 pl-4 text-sm">
                {doc.sections.map((s) => (
                  <li key={s.h}>
                    <a href={`#${slugify(s.h)}`} className="hover:text-forest-900 hover:underline">
                      {s.h}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Other policies" className="mt-8">
              <p className="text-sm font-semibold text-forest-900">All policies</p>
              <ul className="mt-3 space-y-2 text-sm">
                {legalDocs.map((d) => (
                  <li key={d.slug}>
                    {d.slug === doc.slug ? (
                      <span aria-current="page" className="font-semibold text-forest-900">
                        {d.title}
                      </span>
                    ) : (
                      <Link href={`/legal/${d.slug}`} className="hover:text-forest-900 hover:underline">
                        {d.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="max-w-prose">
            {doc.sections.map((s) => (
              <section key={s.h} id={slugify(s.h)} className="scroll-mt-24 border-t border-sand-200 py-8 first:border-t-0 first:pt-0">
                <h2 className="text-2xl font-bold">{s.h}</h2>
                {s.p.map((para) => (
                  <p key={para} className="mt-3">
                    <Text>{para}</Text>
                  </p>
                ))}
              </section>
            ))}
            <p className="mt-6 border-t border-sand-200 pt-6 text-sm">
              Questions about this page? <Link href="/contact" className="underline underline-offset-4">Contact us</Link>. This page is general
              information and not legal advice.
            </p>
          </article>
        </div>
      </div>
    </>
  );
}
