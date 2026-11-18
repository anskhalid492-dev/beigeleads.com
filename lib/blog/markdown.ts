import type { DocNode, Mark } from "./doc";

/** Tiny Markdown to article-document converter for starter articles. Supports what those articles use; `cleanDoc` still re-validates the result on save. */
const text = (t: string, marks: Mark[] = []): DocNode => (marks.length ? { type: "text", text: t, marks } : { type: "text", text: t });

export function inline(src: string, marks: Mark[] = []): DocNode[] {
  const out: DocNode[] = [];
  let rest = src;
  const re = /(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*\s][^*]*)\*)|(\[([^\]]+)\]\(([^)\s]+)\))/;
  while (rest) {
    const m = re.exec(rest);
    if (!m) { out.push(text(rest, marks)); break; }
    if (m.index > 0) out.push(text(rest.slice(0, m.index), marks));
    if (m[1]) out.push(text(m[2], [...marks, { type: "code" }]));
    else if (m[3]) out.push(...inline(m[4], [...marks, { type: "bold" }]));
    else if (m[5]) out.push(...inline(m[6], [...marks, { type: "italic" }]));
    else out.push(...inline(m[8], [...marks, { type: "link", attrs: { href: m[9], target: /^https?:\/\//.test(m[9]) ? "_blank" : undefined } }]));
    rest = rest.slice(m.index + m[0].length);
  }
  return out.filter((n) => n.text !== "");
}

const para = (t: string): DocNode => ({ type: "paragraph", content: inline(t) });
const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export function mdToDoc(md: string): DocNode {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const content: DocNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = /^(#{2,4})\s+(.*)$/.exec(line);
    if (h) { content.push({ type: "heading", attrs: { level: h[1].length }, content: inline(h[2]) }); i++; continue; }
    const call = /^:::(info|tip|warning)\s*$/.exec(line);
    if (call) {
      const body: string[] = []; i++;
      while (i < lines.length && lines[i].trim() !== ":::") body.push(lines[i++]);
      i++;
      content.push({ type: "callout", attrs: { tone: call[1] }, content: [para(body.join(" ").trim())] });
      continue;
    }
    if (line.trim().startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { if (!/^\|?\s*:?-{3,}/.test(lines[i].trim().replace(/\|\s*:?-{3,}:?\s*/g, "|---"))) rows.push(cells(lines[i])); i++; }
      content.push({
        type: "table",
        content: rows.map((r, ri) => ({ type: "tableRow", content: r.map((c) => ({ type: ri === 0 ? "tableHeader" : "tableCell", content: [para(c)] })) })),
      });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: DocNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) items.push({ type: "listItem", content: [para(lines[i++].replace(/^[-*]\s+/, ""))] });
      content.push({ type: "bulletList", content: items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: DocNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) items.push({ type: "listItem", content: [para(lines[i++].replace(/^\d+\.\s+/, ""))] });
      content.push({ type: "orderedList", content: items });
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|:::|\||[-*]\s|\d+\.\s)/.test(lines[i])) buf.push(lines[i++].trim());
    content.push(para(buf.join(" ")));
  }
  return { type: "doc", content };
}
