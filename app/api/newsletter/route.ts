import { getCloudflareContext } from "@opennextjs/cloudflare";
import { handleForm } from "@/lib/forms/handle";
import { newsletterSchema } from "@/lib/forms/schemas";
import { newsletterOn, subscribe } from "@/lib/newsletter";

export async function POST(req: Request) {
  if (!newsletterOn(getCloudflareContext().env)) return Response.json({ ok: false, error: "Signup is not open." }, { status: 404 });
  return handleForm(req, "newsletter", newsletterSchema, async (data, { env, waitUntil }) => {
    waitUntil(subscribe(env, data.email));
  });
}
