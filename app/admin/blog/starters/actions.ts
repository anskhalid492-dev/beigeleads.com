"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { can } from "@/lib/admin/roles";
import { requireBlogUser } from "@/lib/admin/require-admin";
import { createFromStarter } from "@/lib/blog/starter-create";
import { BlogError } from "@/lib/blog/taxonomy";

export async function createStarterAction(slug: string, authorId: number | null): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  try {
    const u = await requireBlogUser();
    if (!can.publish(u.role)) throw new BlogError("Only an admin can do this.");
    const id = await createFromStarter(getCloudflareContext().env, u.email, z.string().max(200).parse(slug), z.number().int().nullable().parse(authorId));
    revalidatePath("/admin/blog");
    return { ok: true, id };
  } catch (e) {
    if (e instanceof BlogError) return { ok: false, error: e.message };
    console.error("starter failed:", e instanceof Error ? e.message : "unknown");
    return { ok: false, error: "Something went wrong. Try again." };
  }
}
