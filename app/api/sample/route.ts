import { getDb } from "@/lib/db";
import { sendEmail } from "@/lib/forms/email";
import { handleForm } from "@/lib/forms/handle";
import { sampleSchema } from "@/lib/forms/schemas";
import { submitSample } from "@/lib/sample/requests";

export async function POST(req: Request) {
  return handleForm(req, "sample", sampleSchema, async (data, { env }) => {
    // The confirmation email is awaited so the response states the real handoff result.
    const out = await submitSample(getDb(), env, (m) => sendEmail(env, m), data);
    return { delivery: out.delivery, label: out.label };
  });
}
