// Reads CSV and JSON text into rows (header -> value). XLSX lives in xlsx.ts. Pure, no dependencies.
import { FIELDS, type FieldKey, type Mapping, type Raw } from "./clean";

export type Table = { headers: string[]; rows: Record<string, string>[] };

/** RFC 4180 style CSV: quoted fields, doubled quotes, line breaks inside quotes, BOM, comma / semicolon / tab. */
export function parseCsv(text: string): string[][] {
  let s = text.replace(/^﻿/, "");
  const first = s.split(/\r?\n/, 1)[0] ?? "";
  const count = (c: string) => (first.match(new RegExp(c === "\t" ? "\t" : `\\${c}`, "g")) ?? []).length;
  const delim = [",", ";", "\t"].sort((a, b) => count(b) - count(a))[0];
  const rows: string[][] = []; let row: string[] = []; let cur = ""; let q = false;
  s = s.replace(/\r\n?/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"' && cur === "") q = true;
    else if (c === delim) { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function tableFromGrid(grid: string[][]): Table {
  if (!grid.length) return { headers: [], rows: [] };
  const seen = new Map<string, number>();
  const headers = grid[0].map((h, i) => { const base = String(h ?? "").trim() || `Column ${i + 1}`; const n = (seen.get(base) ?? 0) + 1; seen.set(base, n); return n > 1 ? `${base} (${n})` : base; });
  const rows = grid.slice(1).filter((r) => r.some((c) => String(c ?? "").trim() !== "")).map((r) => Object.fromEntries(headers.map((h, i) => [h, String(r[i] ?? "")])));
  return { headers, rows };
}

const flat = (v: unknown): string => (Array.isArray(v) ? v.map(flat).filter(Boolean).join("; ") : v == null ? "" : typeof v === "object" ? "" : String(v));

export function parseJson(text: string): Table {
  const data: unknown = JSON.parse(text.replace(/^﻿/, ""));
  const list = Array.isArray(data) ? data : data && typeof data === "object" ? ((): unknown[] => { const o = data as Record<string, unknown>; const k = ["entries", "glossary", "terms", "items", "data"].find((x) => Array.isArray(o[x])); return k ? (o[k] as unknown[]) : []; })() : [];
  const objs = list.filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x));
  const headers: string[] = [];
  for (const o of objs) for (const k of Object.keys(o)) if (!headers.includes(k)) headers.push(k);
  return { headers, rows: objs.map((o) => Object.fromEntries(headers.map((h) => [h, flat(o[h])]))) };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
/** Guesses which file column feeds each field, from the header names. The admin can change every choice. */
export function guessMapping(headers: string[]): Mapping {
  const m: Mapping = {}; const used = new Set<string>();
  for (const [key, , aliases] of FIELDS) {
    const hit = headers.find((h) => !used.has(h) && (aliases as readonly string[]).includes(norm(h)));
    if (hit) { m[key] = hit; used.add(hit); }
  }
  return m;
}

export const applyMapping = (row: Record<string, string>, m: Mapping): Raw => {
  const out: Raw = {};
  for (const [key] of FIELDS) { const h = m[key as FieldKey]; if (h) out[key as FieldKey] = row[h] ?? ""; }
  return out;
};

const q = (v: string) => (/[",\n\r;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
export const toCsv = (grid: string[][]) => "﻿" + grid.map((r) => r.map((c) => q(String(c ?? ""))).join(",")).join("\r\n") + "\r\n";
