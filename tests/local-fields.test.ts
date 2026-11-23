import { describe, it, expect } from "vitest";
import { LOCAL_FIELD_NAMES, LOCAL_FIELD_COUNT } from "@/lib/product-fields";
import { fieldMeta } from "@/components/product/meta";
describe("local business fields", () => {
  it("has unique names, each with meta, and the declared count", () => {
    expect(new Set(LOCAL_FIELD_NAMES).size).toBe(LOCAL_FIELD_NAMES.length);
    expect(LOCAL_FIELD_NAMES.length).toBe(64);
    expect(LOCAL_FIELD_COUNT).toBe(74);
    for (const n of LOCAL_FIELD_NAMES) expect(fieldMeta[n]).toBeTruthy();
  });
});
