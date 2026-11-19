import { getDb, schema } from "@/lib/db";
import { getDbFromEnv } from "@/lib/db";
import { sendOnce } from "@/lib/system-emails/triggers";
import { notifyOwner } from "@/lib/forms/email";
import { handleForm } from "@/lib/forms/handle";
import { categoryRequestSchema } from "@/lib/forms/schemas";

export async function POST(req: Request) {
  return handleForm(req, "category-request", categoryRequestSchema, async (data, { env, waitUntil }) => {
    await getDb()
      .insert(schema.categoryRequests)
      .values({ email: data.email, requestedCategory: data.requestedCategory, details: data.details ?? null });
    // Customer confirmation: once per (email + category), through the branded template only.
    const ref = `cat:${(await sha(`${data.email.toLowerCase()}|${data.requestedCategory.toLowerCase().trim()}`)).slice(0, 24)}`;
    waitUntil(sendOnce(env, getDbFromEnv(env), "category_request_received", data.email, { category_name: data.requestedCategory }, ref).catch(() => undefined));
    waitUntil(notifyOwner(env, "New category request", `Category: ${data.requestedCategory}`, "category"));
  });
}

async function sha(v: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
