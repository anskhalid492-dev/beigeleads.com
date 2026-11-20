import { requireAdmin } from "@/lib/admin/require-admin";
import { buildFile, type FileKind, type Format } from "@/lib/glossary/files";

export const dynamic = "force-dynamic";

/** Admin-only downloads: the starter entries and a blank template, as CSV, JSON or XLSX. */
export async function GET(req: Request) {
  try { await requireAdmin(); } catch { return new Response("Not found", { status: 404 }); }
  const u = new URL(req.url);
  const kind = u.searchParams.get("file") === "template" ? "template" : u.searchParams.get("file") === "starter" ? "starter" : null;
  const format = ["csv", "json", "xlsx"].includes(u.searchParams.get("format") ?? "") ? (u.searchParams.get("format") as Format) : null;
  if (!kind || !format) return new Response("Bad request", { status: 400 });
  const f = buildFile(kind as FileKind, format);
  return new Response(f.body as BodyInit, { headers: { "content-type": f.type, "content-disposition": `attachment; filename="${f.name}"`, "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}
