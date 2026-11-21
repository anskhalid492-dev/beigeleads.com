// Email list files: counts the entries of an uploaded list WITHOUT loading it into memory (CSV/TXT are streamed; XLSX is read through its
// zip directory and the first worksheet is inflated in a stream). Pure over web streams, so it runs in the Worker and in tests.
// Counting rule (same for every format, shown to customers): an ENTRY is a non-empty value in the email column (spreadsheet), or a
// non-empty item separated by a line break, comma or semicolon (TXT). A header cell is not counted. Duplicates ARE counted.
// Nothing here evaluates formulas or macros: cells are only read as text. Hard caps protect the Worker.
import { Inflate, inflateSync } from "fflate";

export type Format = "csv" | "txt" | "xlsx";
export const FORMATS: Format[] = ["csv", "xlsx", "txt"];
export const XLSX_MAX_BYTES = 50 * 1024 * 1024; // the zip is read into memory (Workers have 128 MB), so XLSX has its own, lower cap
const SAMPLE_ROWS = 200;
const MAX_XML_BYTES = 700 * 1024 * 1024; // zip-bomb guard: stop inflating after this much text
const MAX_COLUMNS = 200;

export type Candidate = { index: number; label: string; example: string };
export type Analysis =
  | { ok: true; count: number; columnLabel: string; notes: string[] }
  | { ok: false; needColumn: Candidate[] }
  | { ok: false; error: string };
type Open = () => Promise<ReadableStream<Uint8Array>>;

const EMAIL_LIKE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
export const looksLikeEmail = (s: string) => EMAIL_LIKE.test(s.trim());
const fail = (error: string): Analysis => ({ ok: false, error });

/** Format from the file name and the first bytes. Wrong extension or a binary file is refused. */
export function detectFormat(name: string, head: Uint8Array): { format: Format } | { error: string } {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const zip = head.length > 3 && head[0] === 0x50 && head[1] === 0x4b && head[2] === 3 && head[3] === 4;
  const ole = head.length > 3 && head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0;
  if (ole) return { error: "Older Excel files (.xls) are not supported. Save the file as .xlsx or .csv and upload it again." };
  if (ext === "xlsx") return zip ? { format: "xlsx" } : { error: "This file is not a real .xlsx spreadsheet." };
  if (zip) return { error: "Zip and other archive files are not accepted. Upload a .csv, .xlsx or .txt file." };
  if (ext !== "csv" && ext !== "txt") return { error: "Only .csv, .xlsx and .txt files are accepted." };
  const n = Math.min(head.length, 8192);
  for (let i = 0; i < n; i++) if (head[i] === 0) return { error: "This file is not a plain-text list (it contains binary data)." };
  return { format: ext as Format };
}

async function* texts(stream: ReadableStream<Uint8Array>, onBytes?: (n: number) => void): AsyncGenerator<string> {
  const reader = stream.getReader();
  const dec = new TextDecoder("utf-8");
  let first = true;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      onBytes?.(value.byteLength);
      let s = dec.decode(value, { stream: true });
      if (first) { first = false; if (s.charCodeAt(0) === 0xfeff) s = s.slice(1); }
      if (s) yield s;
    }
    const tail = dec.decode();
    if (tail) yield tail;
  } finally { reader.cancel().catch(() => undefined); }
}

// ------------------------------------------------------------------------------------------------ TXT

async function analyzeTxt(open: Open): Promise<Analysis> {
  let carry = ""; let total = 0; let withAt = 0; let headerSkipped = false; let seenFirst = false;
  const take = (tok: string) => {
    if (!tok) return;
    if (!seenFirst) { seenFirst = true; if (!tok.includes("@")) { headerSkipped = true; return; } }
    total++; if (tok.includes("@")) withAt++;
  };
  for await (const s of texts(await open())) {
    const parts = (carry + s).split(/[\s,;]+/);
    carry = parts.pop() ?? "";
    for (const p of parts) take(p);
  }
  take(carry.trim());
  if (total === 0) return fail("We could not find any email addresses in this file.");
  if (withAt < total * 0.5) return fail("Most entries in this file do not look like email addresses. Check the file and try again.");
  return { ok: true, count: total, columnLabel: "", notes: headerSkipped ? ["The first line looked like a header and was not counted."] : [] };
}

// ------------------------------------------------------------------------------------------------ CSV

/** Streaming CSV reader (RFC 4180 quotes, line breaks inside quotes). Calls onRow for every complete row; return false to stop. */
class Csv {
  private row: string[] = []; private f = ""; private q = false; private pendingQuote = false; private any = false; stopped = false;
  constructor(private d: string, private onRow: (r: string[]) => boolean | void) {}
  push(t: string) {
    for (let i = 0; i < t.length && !this.stopped; i++) {
      const c = t[i];
      if (this.pendingQuote) {
        this.pendingQuote = false;
        if (c === '"') { this.f += '"'; continue; }
        this.q = false;
      }
      if (this.q) { if (c === '"') this.pendingQuote = true; else this.f += c; continue; }
      if (c === '"' && this.f === "") { this.q = true; this.any = true; }
      else if (c === this.d) { this.row.push(this.f); this.f = ""; this.any = true; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && t[i + 1] === "\n") i++;
        else if (c === "\r" && i === t.length - 1) { /* a following \n in the next chunk becomes an empty row, skipped below */ }
        this.end();
      } else { this.f += c; this.any = true; }
    }
  }
  private end() {
    if (this.row.length === 0 && this.f === "" && !this.any) return; // blank line
    this.row.push(this.f);
    const r = this.row; this.row = []; this.f = ""; this.any = false;
    if (this.onRow(r) === false) this.stopped = true;
  }
  finish() { if (!this.stopped && (this.f !== "" || this.row.length || this.any)) this.end(); }
}

function pickDelimiter(head: string): string {
  const line = head.split(/\r?\n/)[0] ?? "";
  let best = ","; let bestN = -1;
  for (const d of [",", ";", "\t"]) {
    let n = 0; let q = false;
    for (const c of line) { if (c === '"') q = !q; else if (!q && c === d) n++; }
    if (n > bestN) { best = d; bestN = n; }
  }
  return best;
}

/** From sampled rows: which columns hold emails. */
function candidatesOf(rows: string[][]): { cands: Candidate[]; header: boolean[] } {
  const width = Math.min(MAX_COLUMNS, rows.reduce((m, r) => Math.max(m, r.length), 0));
  const cands: Candidate[] = [];
  for (let c = 0; c < width; c++) {
    let nonEmpty = 0; let emails = 0; let example = "";
    for (const r of rows) { const v = (r[c] ?? "").trim(); if (!v) continue; nonEmpty++; if (looksLikeEmail(v)) { emails++; if (!example) example = v; } }
    if (emails >= 1 && emails >= nonEmpty * 0.4) cands.push({ index: c, label: "", example });
  }
  for (const k of cands) { const h = (rows[0]?.[k.index] ?? "").trim(); k.label = h && !looksLikeEmail(h) ? h.slice(0, 40) : `Column ${k.index + 1}`; }
  return { cands, header: cands.map((k) => !!(rows[0]?.[k.index] ?? "").trim() && !looksLikeEmail(rows[0][k.index])) };
}
export const maskExample = (e: string) => e.replace(/^(.).*?(@.*)$/, "$1***$2");

async function analyzeCsv(open: Open, column?: number): Promise<Analysis> {
  // pass 1: sample the first rows
  const sample: string[][] = [];
  let delim = ",";
  {
    let probe = ""; let p: Csv | null = null;
    for await (const s of texts(await open())) {
      if (!p) { probe += s; if (probe.length < 4096 && !/\n/.test(probe)) { continue; } delim = pickDelimiter(probe); p = new Csv(delim, (r) => { sample.push(r); return sample.length < SAMPLE_ROWS; }); p.push(probe); }
      else p.push(s);
      if (p.stopped) break;
    }
    if (!p) { delim = pickDelimiter(probe); p = new Csv(delim, (r) => { sample.push(r); return sample.length < SAMPLE_ROWS; }); p.push(probe); }
    p.finish();
  }
  if (sample.length === 0) return fail("This file is empty.");
  const { cands, header } = candidatesOf(sample);
  let chosen = column;
  if (chosen === undefined) {
    if (cands.length === 0) return fail("We could not find a column with email addresses. Check that the file has a column of emails.");
    if (cands.length > 1) return { ok: false, needColumn: cands.map((k) => ({ ...k, example: maskExample(k.example) })) };
    chosen = cands[0].index;
  }
  if (chosen < 0 || chosen >= MAX_COLUMNS) return fail("Choose a valid column.");
  const cand = cands.find((k) => k.index === chosen);
  const hasHeader = cand ? header[cands.indexOf(cand)] : !!(sample[0]?.[chosen] ?? "").trim() && !looksLikeEmail(sample[0][chosen]);
  // pass 2: count
  let count = 0; let rowNo = 0;
  const p = new Csv(delim, (r) => { rowNo++; if (rowNo === 1 && hasHeader) return; if ((r[chosen] ?? "").trim() !== "") count++; });
  for await (const s of texts(await open())) p.push(s);
  p.finish();
  if (count === 0) return fail("The chosen column has no entries.");
  return { ok: true, count, columnLabel: cand?.label ?? `Column ${chosen + 1}`, notes: hasHeader ? ["The first row looked like a header and was not counted."] : [] };
}

// ------------------------------------------------------------------------------------------------ XLSX

type ZEntry = { name: string; method: number; comp: number; local: number; flags: number };
function zipEntries(b: Uint8Array): ZEntry[] | null {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let e = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65535); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) return null;
  const count = dv.getUint16(e + 10, true); let off = dv.getUint32(e + 16, true);
  if (count === 0xffff || off === 0xffffffff || count > 5000) return null;
  const out: ZEntry[] = []; const dec = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (off + 46 > b.length || dv.getUint32(off, true) !== 0x02014b50) return null;
    const n = dv.getUint16(off + 28, true), x = dv.getUint16(off + 30, true), c = dv.getUint16(off + 32, true);
    out.push({ flags: dv.getUint16(off + 8, true), method: dv.getUint16(off + 10, true), comp: dv.getUint32(off + 20, true), local: dv.getUint32(off + 42, true), name: dec.decode(b.subarray(off + 46, off + 46 + n)) });
    off += 46 + n + x + c;
  }
  return out;
}
function entryData(b: Uint8Array, z: ZEntry): Uint8Array {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const start = z.local + 30 + dv.getUint16(z.local + 26, true) + dv.getUint16(z.local + 28, true);
  return b.subarray(start, start + z.comp);
}
function entryText(b: Uint8Array, z: ZEntry, cap = 2_000_000): string | null {
  const raw = entryData(b, z);
  if (z.method === 0) return raw.length > cap ? null : new TextDecoder().decode(raw);
  if (z.method !== 8) return null;
  try { const out = inflateSync(raw); return out.length > cap ? null : new TextDecoder().decode(out); } catch { return null; }
}
/** Inflates one entry in 64 KB steps and hands text chunks to `on` (return false to stop). Total output is capped. */
function streamEntry(b: Uint8Array, z: ZEntry, on: (t: string) => boolean | void): "done" | "stopped" | "too-big" | "bad" {
  const raw = entryData(b, z); const dec = new TextDecoder("utf-8"); let total = 0; let state: "done" | "stopped" | "too-big" | "bad" = "done";
  const feed = (chunk: Uint8Array) => {
    if (state !== "done") return;
    total += chunk.length;
    if (total > MAX_XML_BYTES) { state = "too-big"; return; }
    if (on(dec.decode(chunk, { stream: true })) === false) state = "stopped";
  };
  try {
    if (z.method === 0) { for (let i = 0; i < raw.length && state === "done"; i += 65536) feed(raw.subarray(i, i + 65536)); return state; }
    if (z.method !== 8) return "bad";
    const inf = new Inflate((chunk) => feed(chunk));
    for (let i = 0; i < raw.length && state === "done"; i += 65536) inf.push(raw.subarray(i, Math.min(raw.length, i + 65536)), i + 65536 >= raw.length);
    return state;
  } catch { return "bad"; }
}

const ent = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&");
const colIndex = (L: string) => { let n = 0; for (const c of L) n = n * 26 + (c.charCodeAt(0) - 64); return n - 1; };
const colLetter = (i: number) => { let s = ""; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
const cellText = (attrs: string, inner: string, shared: string[]): string => {
  const t = /\bt="(\w+)"/.exec(attrs)?.[1];
  if (t === "inlineStr") return ent([...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(""));
  const v = /<v[^>]*>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? "";
  if (t === "s") { const s = shared[Number(v)]; return s === undefined ? "\u0000" : s; } // \0 = a string we did not load (treated as non-empty)
  return ent(v);
};

async function analyzeXlsx(open: Open, column?: number): Promise<Analysis> {
  const chunks: Uint8Array[] = []; let size = 0;
  const reader = (await open()).getReader();
  for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > XLSX_MAX_BYTES) { reader.cancel().catch(() => undefined); return fail("Spreadsheets over 50 MB cannot be read here. Save the list as .csv or .txt (any size up to the limit) and upload it again."); } chunks.push(value); }
  const buf = new Uint8Array(size); { let o = 0; for (const c of chunks) { buf.set(c, o); o += c.length; } } chunks.length = 0;
  const zs = zipEntries(buf);
  if (!zs) return fail("This file is not a valid .xlsx spreadsheet.");
  const by = new Map(zs.map((z) => [z.name, z]));
  if (!by.has("[Content_Types].xml") || !by.has("xl/workbook.xml")) return fail("This file is not a valid .xlsx spreadsheet.");
  if (zs.some((z) => /vbaProject\.bin$/i.test(z.name))) return fail("Spreadsheets with macros are not accepted. Save a copy without macros as .xlsx or .csv.");
  if (zs.some((z) => z.flags & 1)) return fail("Password-protected spreadsheets cannot be read. Remove the password and upload it again.");
  // first worksheet: workbook.xml -> rels -> path
  const wb = entryText(buf, by.get("xl/workbook.xml")!) ?? "";
  const sheets = [...wb.matchAll(/<sheet\b[^>]*?r:id="([^"]+)"/g)].map((m) => m[1]);
  const relsZ = by.get("xl/_rels/workbook.xml.rels"); const rels = relsZ ? entryText(buf, relsZ) ?? "" : "";
  let path = "";
  if (sheets[0]) {
    for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
      if (new RegExp(`Id="${sheets[0]}"`).test(m[0])) { const t = /Target="([^"]+)"/.exec(m[0])?.[1] ?? ""; path = t.startsWith("/") ? t.slice(1) : `xl/${t}`; }
    }
  }
  if (!by.has(path)) path = by.has("xl/worksheets/sheet1.xml") ? "xl/worksheets/sheet1.xml" : "";
  const sheetZ = by.get(path);
  if (!sheetZ) return fail("We could not find a worksheet in this file.");
  const notes: string[] = [];
  if (sheets.length > 1) notes.push(`This workbook has ${sheets.length} worksheets. Only the first worksheet is counted and verified.`);
  // shared strings: the first few thousand are enough to read the first rows
  const shared: string[] = [];
  const ssZ = by.get("xl/sharedStrings.xml");
  if (ssZ) {
    let carry = "";
    streamEntry(buf, ssZ, (t) => {
      carry += t; let last = 0;
      for (const m of carry.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) { shared.push(ent([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join(""))); last = (m.index ?? 0) + m[0].length; if (shared.length >= 4000) return false; }
      carry = carry.slice(last);
    });
  }
  // sample the first rows
  const rows: string[][] = []; let carry = "";
  streamEntry(buf, sheetZ, (t) => {
    carry += t; let last = 0;
    for (const m of carry.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      last = (m.index ?? 0) + m[0].length;
      const r: string[] = [];
      for (const c of (m[1] ?? "").matchAll(/<c\b[^>]*?\br="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) { const i = colIndex(c[1]); if (i < MAX_COLUMNS) r[i] = cellText(c[2], c[3] ?? "", shared); }
      rows.push(Array.from(r, (v) => v ?? ""));
      if (rows.length >= SAMPLE_ROWS) return false;
    }
    carry = carry.slice(last);
  });
  if (rows.length === 0) return fail("The first worksheet is empty.");
  const sampleRows = rows.map((r) => r.map((v) => (v === "\u0000" ? "" : v)));
  const { cands, header } = candidatesOf(sampleRows);
  let chosen = column;
  if (chosen === undefined) {
    if (cands.length === 0) return fail("We could not find a column with email addresses. Check that the first worksheet has a column of emails.");
    if (cands.length > 1) return { ok: false, needColumn: cands.map((k) => ({ ...k, example: maskExample(k.example) })) };
    chosen = cands[0].index;
  }
  if (chosen < 0 || chosen >= MAX_COLUMNS) return fail("Choose a valid column.");
  const cand = cands.find((k) => k.index === chosen);
  const first = rows[0]?.[chosen] ?? "";
  const hasHeader = cand ? header[cands.indexOf(cand)] : !!first.trim() && first !== "\u0000" && !looksLikeEmail(first);
  // count non-empty cells of the chosen column in the whole sheet
  const L = colLetter(chosen);
  const re = new RegExp(`<c\\b[^>]*?\\br="${L}\\d+"[^>]*?(?:/>|>([\\s\\S]*?)</c>)`, "g");
  let count = 0; carry = "";
  const res = streamEntry(buf, sheetZ, (t) => {
    carry += t; let last = 0;
    for (const m of carry.matchAll(re)) { last = (m.index ?? 0) + m[0].length; const inner = m[1] ?? ""; if (/<v>[^<]+<\/v>|<is>|<t[ >]/.test(inner)) count++; }
    // keep from the last possible cell start so a cell split across chunks is matched next time
    const cut = Math.max(last, carry.length - 400);
    carry = carry.slice(cut);
  });
  if (res === "too-big") return fail("This spreadsheet is too large to process. Save the list as .csv or .txt and upload it again.");
  if (res === "bad") return fail("We could not read this spreadsheet. Save it again as .xlsx or .csv.");
  if (hasHeader) count = Math.max(0, count - 1);
  if (count === 0) return fail("The chosen column has no entries.");
  return { ok: true, count, columnLabel: cand?.label ?? `Column ${chosen + 1}`, notes: [...notes, ...(hasHeader ? ["The first row looked like a header and was not counted."] : [])] };
}

export async function analyze(open: Open, format: Format, opts: { column?: number } = {}): Promise<Analysis> {
  try {
    if (format === "txt") return await analyzeTxt(open);
    if (format === "csv") return await analyzeCsv(open, opts.column);
    return await analyzeXlsx(open, opts.column);
  } catch { return fail("We could not read this file. Check that it is a valid list and try again."); }
}
