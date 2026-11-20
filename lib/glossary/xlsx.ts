// Minimal XLSX reader/writer on top of fflate (pure JS, works in the browser and the Worker). Reads the first sheet as text.
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

const dec = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_m, n: string) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const colIndex = (ref: string) => { let n = 0; for (const c of ref.replace(/[^A-Z]/gi, "").toUpperCase()) n = n * 26 + (c.charCodeAt(0) - 64); return n - 1; };
const colName = (i: number) => { let s = ""; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
const texts = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => dec(m[1])).join("");

export function readXlsx(bytes: Uint8Array): string[][] {
  let files: Record<string, Uint8Array>;
  try { files = unzipSync(bytes, { filter: (f) => /^xl\/(worksheets\/[^/]+\.xml|sharedStrings\.xml|workbook\.xml|_rels\/workbook\.xml\.rels)$/.test(f.name) }); } catch { throw new Error("This is not a valid .xlsx file."); }
  const get = (n: string) => (files[n] ? strFromU8(files[n]) : "");
  const shared = [...get("xl/sharedStrings.xml").matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1]));
  // first sheet in workbook order
  let path = "";
  const wb = get("xl/workbook.xml"); const rels = get("xl/_rels/workbook.xml.rels");
  const rid = wb.match(/<sheet\s[^>]*r:id="([^"]+)"/)?.[1];
  if (rid) { const rel = [...rels.matchAll(/<Relationship\s[^>]*>/g)].map((m) => m[0]).find((r) => new RegExp(`Id="${rid}"`).test(r)); const t = rel?.match(/Target="([^"]+)"/)?.[1]; if (t) path = t.startsWith("/") ? t.slice(1) : `xl/${t.replace(/^\.\//, "")}`; }
  if (!files[path]) path = Object.keys(files).filter((f) => f.startsWith("xl/worksheets/")).sort()[0] ?? "";
  if (!path) throw new Error("No worksheet found in this file.");
  const xml = get(path);
  const grid: string[][] = [];
  for (const rm of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    for (const cm of rm[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1]; const inner = cm[2] ?? "";
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1]; const type = attrs.match(/\bt="([^"]+)"/)?.[1];
      const idx = ref ? colIndex(ref) : row.length;
      let v = "";
      if (type === "s") v = shared[Number(inner.match(/<v>([\s\S]*?)<\/v>/)?.[1])] ?? "";
      else if (type === "inlineStr") v = texts(inner);
      else { const x = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1]; v = x == null ? "" : dec(x); }
      row[idx] = v;
    }
    grid.push(Array.from(row, (c) => c ?? ""));
  }
  return grid.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Writes one sheet of text cells with a bold header row. */
export function writeXlsx(grid: string[][], sheet = "Glossary"): Uint8Array {
  const rows = grid.map((r, ri) => `<row r="${ri + 1}">${r.map((c, ci) => (c === "" ? "" : `<c r="${colName(ci)}${ri + 1}" t="inlineStr"${ri === 0 ? ' s="1"' : ' s="2"'}><is><t xml:space="preserve">${esc(String(c).slice(0, 32000))}</t></is></c>`)).join("")}</row>`).join("");
  const widths = (grid[0] ?? []).map((h, i) => `<col min="${i + 1}" max="${i + 1}" width="${/definition|content|explanation|example|why|description/i.test(h) ? 60 : /related|keywords|title/i.test(h) ? 34 : 20}" customWidth="1"/>`).join("");
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`${X}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    "_rels/.rels": strToU8(`${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`${X}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(sheet)}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    "xl/styles.xml": strToU8(`${X}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs></styleSheet>`),
    "xl/worksheets/sheet1.xml": strToU8(`${X}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths}</cols><sheetData>${rows}</sheetData></worksheet>`),
  };
  return zipSync(files, { level: 6 });
}
