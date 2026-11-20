import Link from "next/link";
import type { ReactNode } from "react";
import { slugify } from "@/lib/glossary/clean";

/** Renders the small Markdown subset used by the glossary (see lib/glossary/clean.ts richText) as React elements. Never raw HTML. */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = []; let i = 0; let n = 0;
  const re = /\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > i) out.push(text.slice(i, m.index));
    if (m[1]) out.push(<strong key={`${key}b${n++}`} className="font-bold text-forest-900">{m[1]}</strong>);
    else if (m[3].startsWith("/")) out.push(<Link key={`${key}l${n++}`} href={m[3]} className="font-semibold text-forest-900 underline underline-offset-4 hover:text-purple-700">{m[2]}</Link>);
    else out.push(<a key={`${key}l${n++}`} href={m[3]} rel="noopener noreferrer nofollow" className="font-semibold text-forest-900 underline underline-offset-4 hover:text-purple-700">{m[2]}</a>);
    i = m.index + m[0].length;
  }
  if (i < text.length) out.push(text.slice(i));
  return out;
}

export function headingsOf(md: string): { id: string; text: string }[] {
  return md.split("\n").filter((l) => l.startsWith("## ")).map((l) => ({ id: slugify(l.slice(3)), text: l.slice(3).trim() }));
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={`space-y-4 text-[1.05rem] leading-[1.75] ${className}`}>
      {blocks.map((b, i) => {
        // a heading line may be followed directly by a list
        const lines = b.split("\n");
        const nodes: ReactNode[] = []; let k = 0;
        let j = 0;
        while (j < lines.length) {
          const l = lines[j];
          if (l.startsWith("## ")) { const t = l.slice(3).trim(); nodes.push(<h3 key={`${i}h${k++}`} id={slugify(t)} className="display mt-2 scroll-mt-28 text-[1.6rem] leading-tight text-forest-900">{t}</h3>); j++; }
          else if (/^[-*] /.test(l)) { const items: string[] = []; while (j < lines.length && /^[-*] /.test(lines[j])) items.push(lines[j++].slice(2)); nodes.push(<ul key={`${i}u${k++}`} className="space-y-2">{items.map((x, n) => <li key={n} className="flex gap-3"><span className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-forest-500" aria-hidden /><span>{inline(x, `${i}-${n}`)}</span></li>)}</ul>); }
          else if (/^\d+\. /.test(l)) { const items: string[] = []; while (j < lines.length && /^\d+\. /.test(lines[j])) items.push(lines[j++].replace(/^\d+\. /, "")); nodes.push(<ol key={`${i}o${k++}`} className="list-decimal space-y-2 pl-6 marker:font-bold marker:text-forest-500">{items.map((x, n) => <li key={n}>{inline(x, `${i}-${n}`)}</li>)}</ol>); }
          else { const buf: string[] = []; while (j < lines.length && !lines[j].startsWith("## ") && !/^[-*] /.test(lines[j]) && !/^\d+\. /.test(lines[j])) buf.push(lines[j++]); nodes.push(<p key={`${i}p${k++}`}>{inline(buf.join(" "), `${i}`)}</p>); }
        }
        return <div key={i} className="space-y-4">{nodes}</div>;
      })}
    </div>
  );
}
