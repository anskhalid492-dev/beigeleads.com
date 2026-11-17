import { getSchema } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { editorExtensions } from "@/components/blog/extensions";
import { cleanDoc } from "@/lib/blog/doc";

const p = (text: string, marks?: object[]) => ({ type: "paragraph", content: [{ type: "text", text, marks }] });

describe("editor schema accepts what the sanitizer stores", () => {
  const schema = getSchema(editorExtensions);
  const doc = cleanDoc({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2, textAlign: "center" }, content: [{ type: "text", text: "Title" }] },
      p("bold link", [{ type: "bold" }, { type: "link", attrs: { href: "/lists" } }, { type: "underline" }, { type: "strike" }, { type: "italic" }]),
      p("inline code", [{ type: "code" }]),
      { type: "bulletList", content: [{ type: "listItem", content: [p("one")] }] },
      { type: "orderedList", attrs: { start: 1 }, content: [{ type: "listItem", content: [p("one")] }] },
      { type: "blockquote", content: [p("quote")] },
      { type: "codeBlock", attrs: { language: "js" }, content: [{ type: "text", text: "x" }] },
      { type: "horizontalRule" },
      { type: "image", attrs: { src: "/media/2026/a.png", alt: "a", title: "cap" } },
      { type: "youtube", attrs: { src: "https://youtu.be/dQw4w9WgXcQ" } },
      { type: "callout", attrs: { tone: "tip" }, content: [p("tip")] },
      { type: "table", content: [{ type: "tableRow", content: [{ type: "tableHeader", attrs: { colspan: 1, rowspan: 1 }, content: [p("h")] }] }, { type: "tableRow", content: [{ type: "tableCell", attrs: { colspan: 1, rowspan: 1 }, content: [p("c")] }] }] },
    ],
  });

  it("keeps every node type through cleanDoc", () => {
    const types = JSON.stringify(doc);
    for (const t of ["heading", "bulletList", "orderedList", "blockquote", "codeBlock", "horizontalRule", "image", "youtube", "callout", "table", "tableHeader", "tableCell"]) expect(types).toContain(`"${t}"`);
  });

  it("is a valid ProseMirror document for the editor schema", () => {
    const node = schema.nodeFromJSON(doc);
    expect(() => node.check()).not.toThrow();
  });
});
