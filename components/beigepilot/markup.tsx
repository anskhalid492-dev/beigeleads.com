import Link from "next/link";
import type { ReactNode } from "react";

/** Tiny safe renderer for assistant text: paragraphs, - lists, 1. lists, **bold** and relative / beigeleads.com links. No HTML is ever injected. */
const inline = (s: string): ReactNode[] =>
  s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean).map((part, i) => {
    const b = /^\*\*([^*]+)\*\*$/.exec(part);
    if (b) return <strong key={i}>{b[1]}</strong>;
    const l = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (l) {
      const href = l[2].replace(/^https:\/\/(www\.)?beigeleads\.com/, "");
      return href.startsWith("/") ? <Link key={i} href={href} className="font-semibold text-purple-700 underline underline-offset-2">{l[1]}</Link> : <span key={i}>{l[1]}</span>;
    }
    return <span key={i}>{part}</span>;
  });

export function Markup({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split(/\n{2,}/).map((blk, i) => {
        const lines = blk.split("\n").filter(Boolean);
        if (lines.length && lines.every((x) => /^\s*[-*•]\s+/.test(x))) return <ul key={i} className="list-disc space-y-1 pl-5">{lines.map((x, j) => <li key={j}>{inline(x.replace(/^\s*[-*•]\s+/, ""))}</li>)}</ul>;
        if (lines.length && lines.every((x) => /^\s*\d+[.)]\s+/.test(x))) return <ol key={i} className="list-decimal space-y-1 pl-5">{lines.map((x, j) => <li key={j}>{inline(x.replace(/^\s*\d+[.)]\s+/, ""))}</li>)}</ol>;
        return <p key={i}>{lines.map((x, j) => <span key={j}>{j > 0 && <br />}{inline(x)}</span>)}</p>;
      })}
    </div>
  );
}
