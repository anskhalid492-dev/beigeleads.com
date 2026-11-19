import { getTax } from "@/lib/taxonomy-route";
import { menuTree } from "@/lib/taxonomy-store";
import { TAXONOMY } from "@/lib/taxonomy";

/** Lists menu tree (published + menu-visible). CDN-cacheable; the browser falls back to the built-in tree on any error. */
export async function GET() {
  try {
    return Response.json({ tax: menuTree(await getTax()) }, { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
  } catch {
    return Response.json({ tax: TAXONOMY }, { headers: { "cache-control": "public, max-age=30" } });
  }
}
