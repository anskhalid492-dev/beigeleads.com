import Link from "next/link";
import type { Block } from "@/lib/help";

/** Inline text: [label](/path) links and **bold**. Content comes from our own code, never from users. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
        if (link) return <Link key={i} href={link[2]} className="font-semibold text-forest-900 underline underline-offset-4 hover:text-forest-500">{link[1]}</Link>;
        const bold = /^\*\*([^*]+)\*\*$/.exec(p);
        if (bold) return <strong key={i} className="text-forest-900">{bold[1]}</strong>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function Body({ blocks }: { blocks: readonly Block[] }) {
  return (
    <div className="space-y-5 text-lg leading-relaxed">
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
        }
      })}
    </div>
  );
}
