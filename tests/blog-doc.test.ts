import { describe, expect, it } from "vitest";
import { cleanDoc, embedUrl, headingsOf, readingMinutes, safeHref, safeImageSrc, plainText } from "@/lib/blog/doc";

describe("blog document sanitising", () => {
  it("drops unknown nodes and scripts", () => {
    const d = cleanDoc({ type: "doc", content: [{ type: "script", content: [{ type: "text", text: "x" }] }, { type: "paragraph", content: [{ type: "text", text: "Hi" }] }] });
    expect(JSON.stringify(d)).not.toContain("script");
    expect(plainText(d)).toContain("Hi");
  });
  it("rejects javascript: and data: links but keeps safe ones", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("data:text/html;base64,AAA")).toBeNull();
    expect(safeHref("//evil.com")).toBeNull();
    expect(safeHref("/lists")).toBe("/lists");
    expect(safeHref("https://example.com/a")).toBe("https://example.com/a");
    expect(safeHref("mailto:a@b.co")).toBe("mailto:a@b.co");
  });
  it("strips unsafe link marks from text", () => {
    const d = cleanDoc({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }, { type: "bold" }] }] }] });
    const m = d.content![0].content![0].marks!;
    expect(m).toEqual([{ type: "bold" }]);
  });
  it("only accepts media-library or https images", () => {
    expect(safeImageSrc("/media/a.webp")).toBe("/media/a.webp");
    expect(safeImageSrc("/media/../x")).toBeNull();
    expect(safeImageSrc("http://x.com/a.png")).toBeNull();
    expect(safeImageSrc("javascript:1")).toBeNull();
    expect(cleanDoc({ type: "doc", content: [{ type: "image", attrs: { src: "javascript:1" } }] }).content![0].type).toBe("paragraph");
  });
  it("only embeds YouTube and Vimeo", () => {
    expect(embedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(embedUrl("https://youtu.be/dQw4w9WgXcQ")).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(embedUrl("https://vimeo.com/123456789")).toBe("https://player.vimeo.com/video/123456789");
    expect(embedUrl("https://evil.com/embed/abc")).toBeNull();
    expect(embedUrl("http://youtu.be/dQw4w9WgXcQ")).toBeNull();
  });
  it("builds unique heading ids and reading time", () => {
    const d = cleanDoc({ type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Intro" }] }, { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Intro" }] }] });
    expect(headingsOf(d).map((h) => h.id)).toEqual(["intro", "intro-2"]);
    expect(readingMinutes(d)).toBe(1);
  });
  it("never returns an empty document", () => expect(cleanDoc(null).content!.length).toBe(1));
});

import { dimensions, safeFilename, sniff } from "@/lib/blog/media";
describe("media validation", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 1, 0, 0, 0, 0, 200, 8, 6, 0, 0, 0]);
  it("detects types from bytes, not names", () => {
    expect(sniff(png)).toBe("image/png");
    expect(sniff(new TextEncoder().encode("<svg onload=alert(1)></svg>"))).toBeNull();
    expect(sniff(new TextEncoder().encode("<?php echo 1; ?>......"))).toBeNull();
  });
  it("reads PNG size", () => expect(dimensions(png, "image/png")).toEqual({ width: 256, height: 200 }));
  it("sanitises file names", () => {
    expect(safeFilename("../../Étoile Photo!!.png")).toBe("etoile-photo");
    expect(safeFilename("???.png")).toBe("image");
  });
});
