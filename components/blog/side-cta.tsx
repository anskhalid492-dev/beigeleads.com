import Link from "next/link";
import type { Cta } from "./inline-cta";

/** Quiet card under the table of contents: one relevant next step, no urgency, no numbers. */
export function SideCta({ cta }: { cta: Cta }) {
  return (
    <aside aria-label="Related offer" className="rounded-2xl bg-forest-900 p-5 text-sand-100">
      <p className="font-bold text-sand-50">{cta.title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-sand-200">{cta.text}</p>
      <Link href={cta.href} className="mt-4 inline-flex h-9 items-center rounded-full bg-purple-600 px-4 text-sm font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-100">{cta.label}</Link>
      <p className="mt-3 text-xs text-sand-300">Or <Link href="/sample" className="underline underline-offset-2">request a free masked sample</Link>.</p>
    </aside>
  );
}
