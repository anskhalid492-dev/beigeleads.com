/**
 * Article bodies are stored as TipTap/ProseMirror JSON (never as raw HTML).
 * `cleanDoc` rebuilds a document from an allow-list, so whatever the browser sends can only contain
 * known node types, known attributes and safe URLs. The public page renders this JSON as React elements
 * (no dangerouslySetInnerHTML), which makes stored XSS impossible by construction.
 */
export type Mark = { type: "bold" | "italic" | "underline" | "strike" | "code" | "link"; attrs?: { href?: string; target?: string } };
export type DocNode = {
  type: string;
  attrs?: Record<string, string | number | null>;
  content?: DocNode[];
  text?: string;
  marks?: Mark[];
};

const MAX_NODES = 20000;
const MAX_TEXT = 200000;

const BLOCKS = new Set(["paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote", "codeBlock", "horizontalRule", "image", "table", "tableRow", "tableHeader", "tableCell", "youtube", "callout"]);
const TEXT_ALIGN = new Set(["left", "center", "right", "justify"]);
const CALLOUT_TONES = new Set(["info", "tip", "warning"]);

/** Allowed link targets: web, mail, phone, site-relative paths and in-page anchors. */
export function safeHref(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  if (!v || v.length > 2000 || /[\u0000-\u001f\s]/.test(v)) return null;
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  if (v.startsWith("#")) return v;
  try {
    const u = new URL(v);
    return ["http:", "https:", "mailto:", "tel:"].includes(u.protocol) ? v : null;
  } catch { return null; }
}

/** Images may come from our own media library or from https URLs. */
export function safeImageSrc(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  if (v.startsWith("/media/") && !v.includes("..") && v.length < 500) return v;
  try { const u = new URL(v); return u.protocol === "https:" && v.length < 2000 ? v : null; } catch { return null; }
}

/** Only YouTube and Vimeo, turned into their embed URLs. */
export function embedUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.slice(1);
  else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") id = u.pathname.startsWith("/embed/") ? u.pathname.slice(7) : u.searchParams.get("v");
  if (id && /^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = /(\d{5,12})/.exec(u.pathname);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
  }
  return null;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const int = (v: unknown, min: number, max: number, d: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : d; };

function cleanMarks(marks: unknown): Mark[] | undefined {
  if (!Array.isArray(marks)) return undefined;
  const out: Mark[] = [];
  for (const m of marks as { type?: string; attrs?: { href?: string; target?: string } }[]) {
    if (!m || typeof m.type !== "string") continue;
    if (["bold", "italic", "underline", "strike", "code"].includes(m.type)) out.push({ type: m.type as Mark["type"] });
    else if (m.type === "link") {
      const href = safeHref(m.attrs?.href);
      if (href) out.push({ type: "link", attrs: { href, target: m.attrs?.target === "_blank" ? "_blank" : undefined } });
    }
  }
  return out.length ? out : undefined;
}

export function cleanDoc(input: unknown): DocNode {
  let count = 0, textLen = 0;
  const walk = (n: unknown): DocNode | null => {
    if (!n || typeof n !== "object" || ++count > MAX_NODES) return null;
    const node = n as DocNode;
    if (node.type === "text") {
      const text = str(node.text, 20000);
      if (!text) return null;
      textLen += text.length;
      return textLen > MAX_TEXT ? null : { type: "text", text, marks: cleanMarks(node.marks) };
    }
    if (node.type === "hardBreak") return { type: "hardBreak" };
    if (!BLOCKS.has(node.type)) return null;
    const a = node.attrs ?? {};
    const out: DocNode = { type: node.type };
    switch (node.type) {
      case "paragraph": out.attrs = TEXT_ALIGN.has(String(a.textAlign)) ? { textAlign: String(a.textAlign) } : {}; break;
      case "heading": out.attrs = { level: int(a.level, 1, 6, 2), ...(TEXT_ALIGN.has(String(a.textAlign)) ? { textAlign: String(a.textAlign) } : {}) }; break;
      case "orderedList": out.attrs = { start: int(a.start, 1, 100000, 1) }; break;
      case "codeBlock": out.attrs = { language: str(a.language, 30).replace(/[^\w+#.-]/g, "") || null }; break;
      case "image": {
        const src = safeImageSrc(a.src);
        if (!src) return null;
        return { type: "image", attrs: { src, alt: str(a.alt, 300), title: str(a.title, 300) } };
      }
      case "youtube": {
        const src = embedUrl(a.src);
        return src ? { type: "youtube", attrs: { src } } : null;
      }
      case "callout": out.attrs = { tone: CALLOUT_TONES.has(String(a.tone)) ? String(a.tone) : "info" }; break;
      case "tableHeader": case "tableCell": out.attrs = { colspan: int(a.colspan, 1, 20, 1), rowspan: int(a.rowspan, 1, 200, 1) }; break;
    }
    if (node.type === "horizontalRule") return out;
    const kids = (Array.isArray(node.content) ? node.content : []).map(walk).filter((x): x is DocNode => !!x);
    if (kids.length) out.content = kids;
    return out;
  };
  const top = (Array.isArray((input as DocNode)?.content) ? (input as DocNode).content! : []).map(walk).filter((x): x is DocNode => !!x);
  return { type: "doc", content: top.length ? top : [{ type: "paragraph" }] };
}

export const emptyDoc = (): DocNode => ({ type: "doc", content: [{ type: "paragraph" }] });

export function plainText(node: DocNode): string {
  if (node.type === "text") return node.text ?? "";
  const inner = (node.content ?? []).map(plainText);
  const block = ["paragraph", "heading", "listItem", "blockquote", "codeBlock", "tableRow", "callout"].includes(node.type);
  return inner.join(node.type === "tableRow" ? " | " : "") + (block ? "\n" : "");
}

export const slugifyText = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export type Heading = { level: number; text: string; id: string };
export function headingsOf(doc: DocNode): Heading[] {
  const out: Heading[] = [];
  const seen = new Map<string, number>();
  const walk = (n: DocNode) => {
    if (n.type === "heading") {
      const text = plainText(n).trim();
      if (text) {
        const base = slugifyText(text) || "section";
        const k = seen.get(base) ?? 0;
        seen.set(base, k + 1);
        out.push({ level: Number(n.attrs?.level ?? 2), text, id: k ? `${base}-${k + 1}` : base });
      }
    }
    n.content?.forEach(walk);
  };
  walk(doc);
  return out;
}

export function imagesOf(doc: DocNode): { src: string; alt: string }[] {
  const out: { src: string; alt: string }[] = [];
  const walk = (n: DocNode) => { if (n.type === "image") out.push({ src: String(n.attrs?.src ?? ""), alt: String(n.attrs?.alt ?? "") }); n.content?.forEach(walk); };
  walk(doc);
  return out;
}

export function linksOf(doc: DocNode): string[] {
  const out: string[] = [];
  const walk = (n: DocNode) => { n.marks?.forEach((m) => { if (m.type === "link" && m.attrs?.href) out.push(m.attrs.href); }); n.content?.forEach(walk); };
  walk(doc);
  return out;
}

export const wordCount = (doc: DocNode) => (plainText(doc).match(/\S+/g) ?? []).length;
/** About 220 words a minute, never less than 1. */
export const readingMinutes = (doc: DocNode) => Math.max(1, Math.round(wordCount(doc) / 220));
