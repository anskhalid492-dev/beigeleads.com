import { handleForm } from "@/lib/forms/handle";
import { quoteSchema, submitQuote } from "@/lib/ev/quote";

export async function POST(req: Request) {
  return handleForm(req, "ev-quote", quoteSchema, async (d, { env }) => {
    const r = await submitQuote(env, d);
    return { reference: r.reference };
  });
}
