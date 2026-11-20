import { handleForm } from "@/lib/forms/handle";
import { handoffSchema, submitHandoff } from "@/lib/beigepilot/handoff";

/** Visitor asks for a human. Turnstile, honeypot and rate limit come from handleForm. Consent is required. */
export async function POST(req: Request) {
  return handleForm(req, "bp-handoff", handoffSchema, async (d, { env }) => {
    const r = await submitHandoff(env, d);
    if (!r) throw new Error("not saved");
    return { reference: r.reference };
  });
}
