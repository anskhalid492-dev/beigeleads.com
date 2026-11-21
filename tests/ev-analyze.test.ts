// Email list file analysis: formats, counting rule, column choice, rejection of bad files.
import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { analyze, detectFormat, type Format } from "@/lib/ev/analyze";
import { writeXlsx } from "@/lib/glossary/xlsx";

const stream = (bytes: Uint8Array, step = 7919) => () => Promise.resolve(new ReadableStream<Uint8Array>({
  start(c) { for (let i = 0; i < bytes.length; i += step) c.enqueue(bytes.subarray(i, i + step)); c.close(); },
}));
const text = (s: string) => stream(strToU8(s));
const run = (s: string, f: Format, column?: number) => analyze(text(s), f, { column });
const emails = (n: number) => Array.from({ length: n }, (_, i) => `user${i}@example${i % 7}.com`);

describe("TXT and pasted lists", () => {
  it("counts one per line, comma and semicolon separated, duplicates included", async () => {
    const r = await run("a@x.com\nb@x.com, c@x.com;d@x.com\n\na@x.com\r\ne@x.com", "txt");
    expect(r).toMatchObject({ ok: true, count: 6 });
  });
  it("skips a header line and refuses text that is not emails", async () => {
    expect(await run("email\na@x.com\nb@x.com", "txt")).toMatchObject({ ok: true, count: 2 });
    expect(await run("hello world this is not a list at all", "txt")).toMatchObject({ ok: false });
    expect(await run("   \n  ", "txt")).toMatchObject({ ok: false });
  });
  it("handles chunk boundaries inside an address", async () => {
    const big = emails(5000).join("\n");
    const r = await analyze(stream(strToU8(big), 13), "txt");
    expect(r).toMatchObject({ ok: true, count: 5000 });
  });
});

describe("CSV", () => {
  it("finds the only email column and ignores the header", async () => {
    const csv = ["name,email,city", ...emails(50).map((e, i) => `Name ${i},${e},Town`)].join("\n");
    expect(await run(csv, "csv")).toMatchObject({ ok: true, count: 50, columnLabel: "email" });
  });
  it("handles quotes, line breaks inside quotes, semicolons and BOM", async () => {
    const csv = '﻿email;note\n"a@x.com";"line1\nline2"\n"b@x.com";"say ""hi"""\n';
    expect(await run(csv, "csv")).toMatchObject({ ok: true, count: 2 });
  });
  it("asks which column when several hold emails, then counts the chosen one", async () => {
    const csv = ["work,personal", ...emails(30).map((e, i) => `${e},p${i}@mail.com`)].join("\n");
    const ask = await run(csv, "csv");
    expect(ask).toMatchObject({ ok: false });
    expect("needColumn" in ask && ask.needColumn.map((c) => c.label)).toEqual(["work", "personal"]);
    expect("needColumn" in ask && ask.needColumn[0].example).toMatch(/\*\*\*/); // examples are masked
    expect(await run(csv, "csv", 1)).toMatchObject({ ok: true, count: 30, columnLabel: "personal" });
  });
  it("counts a large file by streaming (100,000 rows)", async () => {
    const csv = ["email", ...emails(100_000)].join("\n");
    expect(await analyze(stream(strToU8(csv), 65536), "csv")).toMatchObject({ ok: true, count: 100_000 });
  });
  it("refuses a file without any email column", async () => {
    expect(await run("a,b\n1,2\n3,4", "csv")).toMatchObject({ ok: false });
  });
});

describe("XLSX", () => {
  const sheet = (rows: string[][]) => writeXlsx(rows, "Emails");
  it("counts the email column of the first worksheet without the header", async () => {
    const grid = [["Name", "Email"], ...emails(120).map((e, i) => [`N${i}`, e])];
    expect(await analyze(stream(sheet(grid)), "xlsx")).toMatchObject({ ok: true, count: 120, columnLabel: "Email" });
  });
  it("asks for the column when two columns hold emails", async () => {
    const grid = [["A", "B"], ...emails(40).map((e, i) => [e, `x${i}@mail.com`])];
    const r = await analyze(stream(sheet(grid)), "xlsx");
    expect("needColumn" in r && r.needColumn).toHaveLength(2);
    expect(await analyze(stream(sheet(grid)), "xlsx", { column: 1 })).toMatchObject({ ok: true, count: 40 });
  });
  it("refuses macros, fake xlsx, old xls and encrypted-looking files", async () => {
    const macro = zipSync({ "[Content_Types].xml": strToU8("<x/>"), "xl/workbook.xml": strToU8("<x/>"), "xl/vbaProject.bin": strToU8("x") });
    expect(await analyze(stream(macro), "xlsx")).toMatchObject({ ok: false, error: expect.stringMatching(/macro/i) });
    expect(await analyze(text("not a zip"), "xlsx")).toMatchObject({ ok: false });
    expect(detectFormat("a.xls", new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]))).toMatchObject({ error: expect.stringMatching(/xls/) });
  });
});

describe("format detection", () => {
  it("accepts csv/txt/xlsx by real content and refuses disguised or binary files", () => {
    expect(detectFormat("list.CSV", strToU8("a@x.com"))).toEqual({ format: "csv" });
    expect(detectFormat("list.txt", strToU8("a@x.com"))).toEqual({ format: "txt" });
    expect(detectFormat("list.xlsx", new Uint8Array([0x50, 0x4b, 3, 4]))).toEqual({ format: "xlsx" });
    expect(detectFormat("list.xlsx", strToU8("plain text"))).toHaveProperty("error");
    expect(detectFormat("evil.csv", new Uint8Array([0x50, 0x4b, 3, 4]))).toHaveProperty("error");
    expect(detectFormat("list.txt", new Uint8Array([65, 0, 66]))).toHaveProperty("error");
    expect(detectFormat("run.exe", strToU8("MZ"))).toHaveProperty("error");
  });
});
