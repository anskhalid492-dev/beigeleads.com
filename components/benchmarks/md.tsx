import Link from "next/link";
import type { ReactNode } from "react";

// Tiny renderer for benchmark long-form text. Builds React elements only (no raw HTML). Links: site paths or https.
const safe = (h: string) => h.startsWith("/") || h.startsWith("https://");
function inline(t: string, k: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0, i = 0, m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    if (m.index > last) out.push(t.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${k}b${i}`}>{m[1]}</strong>);
    else if (safe(m[3])) out.push(m[3].startsWith("/") ? <Link key={`${k}l${i}`} href={m[3]}>{m[2]}</Link> : <a key={`${k}l${i}`} href={m[3]} rel="noopener noreferrer" target="_blank">{m[2]}</a>);
    else out.push(m[2]);
    last = m.index + m[0].length; i++;
  }
  if (last < t.length) out.push(t.slice(last));
  return out;
}
export function Md({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, n) => {
        const k = `b${n}`;
        if (b.startsWith("### ")) return <h3 key={k}>{inline(b.slice(4), k)}</h3>;
        const lines = b.split("\n");
        if (lines.length > 2 && lines.every((l) => l.startsWith("|")) && /^\|[\s:|-]+\|$/.test(lines[1])) {
          const cells = (l: string) => l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
          const head = cells(lines[0]);
          return (
            <div key={k} className="table-wrap"><table>
              <thead><tr>{head.map((h, j) => <th key={j} scope="col">{inline(h, `${k}h${j}`)}</th>)}</tr></thead>
              <tbody>{lines.slice(2).map((l, r) => <tr key={r}>{cells(l).map((c, j) => j === 0 ? <th key={j} scope="row">{inline(c, `${k}${r}${j}`)}</th> : <td key={j}>{inline(c, `${k}${r}${j}`)}</td>)}</tr>)}</tbody>
            </table></div>
          );
        }
        if (lines.every((l) => l.startsWith("- "))) return <ul key={k}>{lines.map((l, j) => <li key={j}>{inline(l.slice(2), `${k}${j}`)}</li>)}</ul>;
        if (lines.every((l) => /^\d+\. /.test(l))) return <ol key={k}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\d+\. /, ""), `${k}${j}`)}</li>)}</ol>;
        return <p key={k}>{inline(b.replace(/\n/g, " "), k)}</p>;
      })}
    </>
  );
}
