import { mergeAttributes, Node } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import { embedUrl } from "@/lib/blog/doc";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: { toggleCallout: (tone?: "info" | "tip" | "warning") => ReturnType };
    video: { setVideo: (url: string) => ReturnType };
  }
}

/** Highlighted box (info, tip, warning). Stored as a `callout` node, rendered by the public ArticleBody. */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() { return { tone: { default: "info", parseHTML: (el) => el.getAttribute("data-tone") ?? "info", renderHTML: (a) => ({ "data-tone": a.tone }) } }; },
  parseHTML() { return [{ tag: "aside.callout" }]; },
  renderHTML({ HTMLAttributes }) { return ["aside", mergeAttributes({ class: "callout" }, HTMLAttributes), 0]; },
  addCommands() {
    return { toggleCallout: (tone = "info") => ({ commands, editor }) => (editor.isActive("callout") ? commands.lift("callout") : commands.wrapIn("callout", { tone })) };
  },
});

/** YouTube or Vimeo embed. Only URLs accepted by `embedUrl` are ever inserted (privacy-friendly youtube-nocookie / player.vimeo.com). */
export const Video = Node.create({
  name: "youtube",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() { return { src: { default: null } }; },
  parseHTML() { return [{ tag: "div[data-youtube-video]", getAttrs: (el) => ({ src: embedUrl((el as HTMLElement).querySelector("iframe")?.getAttribute("src")) }) }]; },
  renderHTML({ HTMLAttributes }) { return ["div", { "data-youtube-video": "" }, ["iframe", { src: HTMLAttributes.src, allowfullscreen: "true", referrerpolicy: "strict-origin-when-cross-origin" }]]; },
  addCommands() {
    return { setVideo: (url) => ({ commands }) => { const src = embedUrl(url); return src ? commands.insertContent({ type: "youtube", attrs: { src } }) : false; } };
  },
});

export const editorExtensions = [
  StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } } }),
  Image.configure({ allowBase64: false }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Table.configure({ resizable: false }),
  TableRow, TableHeader, TableCell,
  Callout, Video,
  Placeholder.configure({ placeholder: "Start writing. Paste from Google Docs or Word to keep headings, lists and links." }),
];
