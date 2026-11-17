import { describe, expect, it } from "vitest";
import { can, isEditorEmail, parseEmails } from "@/lib/admin/roles";

describe("blog roles", () => {
  it("parses the editor list case-insensitively", () => {
    expect(parseEmails(" A@x.com, b@x.com ,,")).toEqual(["a@x.com", "b@x.com"]);
    expect(isEditorEmail("A@x.com", "a@X.com")).toBe(true);
    expect(isEditorEmail(undefined, "a@x.com")).toBe(false);
  });
  it("editors write drafts only; admins do everything", () => {
    expect(can.editPost("editor", "draft")).toBe(true);
    for (const s of ["scheduled", "published", "archived"]) expect(can.editPost("editor", s)).toBe(false);
    expect(can.editPost("admin", "published")).toBe(true);
    for (const k of ["publish", "delete", "manageTaxonomy", "replaceMedia", "deleteMedia"] as const) { expect(can[k]("editor")).toBe(false); expect(can[k]("admin")).toBe(true); }
  });
});
