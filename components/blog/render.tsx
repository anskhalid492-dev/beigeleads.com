import Link from "next/link";
import type { ReactNode } from "react";
import { headingsOf, type DocNode, type Mark } from "@/lib/blog/doc";

/** Renders a cleaned article document as React elements. Text is escaped by React, URLs were validated by `cleanDoc`. */
export function ArticleBody({ doc }: { doc: DocNode }) {
  const heads = headingsOf(doc);
  let h = 0;
  const align = (n: DocNode) => { const a = n.attrs?.textAlign; return a && a !== "left" ? { textAlign: a as "center" | "right" | "justify" } : undefined; };

  const wrap = (m: Mark, el: ReactNode): ReactNode => {
    switch (m.type) {
      case "bold": return <strong>{el}</strong>;
      case "italic": return <em>{el}</em>;
      case "underline": return <u>{el}</u>;
      case "strike": return <s>{el}</s>;
      case "code": return <code>{el}</code>;
      case "link": {
        const href = String(m.attrs?.href ?? "#");
        const external = /^https?:\/\//.test(href);
        if (!external && href.startsWith("/")) return <Link href={href}>{el}</Link>;
        return <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{el}</a>;
      }
      default: return el;
    }
  };
  const inline = (n: DocNode, key: number): ReactNode => {
    if (n.type === "hardBreak") return <br key={key} />;
    let el: ReactNode = n.text ?? "";
    for (const m of n.marks ?? []) el = wrap(m, el);
    return <span key={key} style={{ display: "contents" }}>{el}</span>;
  };
  const kids = (n: DocNode): ReactNode[] => (n.content ?? []).map((c, i) => node(c, i));
  const node = (n: DocNode, key: number): ReactNode => {
    switch (n.type) {
      case "text": case "hardBreak": return inline(n, key);
      case "paragraph": return <p key={key} style={align(n)}>{kids(n)}</p>;
      case "heading": {
        const level = Math.min(6, Math.max(2, Number(n.attrs?.level ?? 2)));
        const id = heads[h++]?.id;
        const Tag = `h${level}` as "h2";
        return <Tag key={key} id={id} style={align(n)}>{kids(n)}</Tag>;
      }
      case "bulletList": return <ul key={key}>{kids(n)}</ul>;
      case "orderedList": return <ol key={key} start={Number(n.attrs?.start ?? 1)}>{kids(n)}</ol>;
      case "listItem": return <li key={key}>{kids(n)}</li>;
      case "blockquote": return <blockquote key={key}>{kids(n)}</blockquote>;
      case "codeBlock": return <pre key={key}><code>{(n.content ?? []).map((c) => c.text ?? "").join("")}</code></pre>;
      case "horizontalRule": return <hr key={key} />;
      case "callout": return <aside key={key} data-tone={String(n.attrs?.tone ?? "info")} className="callout">{kids(n)}</aside>;
      case "image": {
        const title = String(n.attrs?.title ?? "");
         
        const img = <img src={String(n.attrs?.src)} alt={String(n.attrs?.alt ?? "")} loading="lazy" decoding="async" />;
        return <figure key={key}>{img}{title ? <figcaption>{title}</figcaption> : null}</figure>;
      }
      case "youtube": return <div key={key} className="video"><iframe src={String(n.attrs?.src)} title="Embedded video" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>;
      case "table": return <div key={key} className="table-wrap"><table><tbody>{kids(n)}</tbody></table></div>;
      case "tableRow": return <tr key={key}>{kids(n)}</tr>;
      case "tableHeader": return <th key={key} colSpan={Number(n.attrs?.colspan ?? 1)} rowSpan={Number(n.attrs?.rowspan ?? 1)}>{kids(n)}</th>;
      case "tableCell": return <td key={key} colSpan={Number(n.attrs?.colspan ?? 1)} rowSpan={Number(n.attrs?.rowspan ?? 1)}>{kids(n)}</td>;
      default: return null;
    }
  };
  return <div className="prose-bl">{kids(doc)}</div>;
}
