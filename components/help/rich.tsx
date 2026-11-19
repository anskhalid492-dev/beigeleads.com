import Link from "next/link";
import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { Block } from "@/lib/help";

/** Inline text: [label](/path) links and **bold**. Content comes from our own code or the admin, never from visitors. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
        if (link) {
          const href = link[2];
          const safe = href.startsWith("/") || /^https:\/\//i.test(href);
          return safe ? <Link key={i} href={href} className="font-semibold text-forest-900 underline underline-offset-4 hover:text-forest-500">{link[1]}</Link> : <span key={i}>{link[1]}</span>;
        }
        const bold = /^\*\*([^*]+)\*\*$/.exec(p);
        if (bold) return <strong key={i} className="text-forest-900">{bold[1]}</strong>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const callout = {
  tip: { Icon: Lightbulb, cls: "border-forest-300 bg-forest-100", label: "Tip" },
  info: { Icon: Info, cls: "border-sand-300 bg-sand-100", label: "Note" },
  warning: { Icon: AlertTriangle, cls: "border-amber-300 bg-amber-50", label: "Important" },
} as const;

export function Body({ blocks }: { blocks: readonly Block[] }) {
  return (
    <div className="space-y-5 text-[1.0625rem] leading-[1.75] text-forest-700">
      {blocks.map((b, i) => {
        switch (b[0]) {
          case "h": return <h2 key={i} id={slugify(b[1])} className="display scroll-mt-28 pt-4 text-3xl text-forest-900">{b[1]}</h2>;
          case "p": return <p key={i}><Inline text={b[1]} /></p>;
          case "ul": return <ul key={i} className="list-disc space-y-2 pl-6 marker:text-forest-500">{b[1].map((x, j) => <li key={j}><Inline text={x} /></li>)}</ul>;
          case "ol": return (
            <ol key={i} className="space-y-3">
              {b[1].map((x, j) => (
                <li key={j} className="flex gap-4">
                  <span aria-hidden className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-forest-900 text-sm font-bold text-sand-50">{j + 1}</span>
                  <span><Inline text={x} /></span>
                </li>
              ))}
            </ol>
          );
          case "note": return <p key={i} className="rounded-2xl border border-sand-300 bg-sand-100 p-4 text-base"><Inline text={b[1]} /></p>;
          case "callout": {
            const c = callout[b[1]];
            return (
              <aside key={i} className={`flex gap-3 rounded-2xl border p-4 text-base ${c.cls}`}>
                <c.Icon className="mt-0.5 size-5 shrink-0 text-forest-700" aria-hidden />
                <p><b className="text-forest-900">{c.label}. </b><Inline text={b[2]} /></p>
              </aside>
            );
          }
          case "table": return (
            <div key={i} className="overflow-x-auto rounded-2xl border border-sand-200 bg-white">
              <table className="w-full min-w-[28rem] text-left text-base">
                <thead className="bg-sand-100 text-forest-900"><tr>{b[1].map((h) => <th key={h} scope="col" className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-sand-200">{b[2].map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k} className="px-4 py-3"><Inline text={c} /></td>)}</tr>)}</tbody>
              </table>
            </div>
          );
          case "img": {
            const ok = b[1].startsWith("/") || /^https:\/\//i.test(b[1]);
            return ok ? (
              <figure key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b[1]} alt={b[2]} loading="lazy" className="w-full rounded-2xl border border-sand-200" />
                {b[3] && <figcaption className="mt-2 text-sm">{b[3]}</figcaption>}
              </figure>
            ) : null;
          }
          case "faq": return (
            <div key={i} className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
              {b[1].map(([q, a]) => (
                <details key={q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-forest-900">{q}<span aria-hidden className="text-xl transition-transform group-open:rotate-45">+</span></summary>
                  <p className="mt-3"><Inline text={a} /></p>
                </details>
              ))}
            </div>
          );
        }
      })}
    </div>
  );
}
