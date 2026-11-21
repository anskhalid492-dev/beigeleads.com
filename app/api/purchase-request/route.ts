import { z } from "zod";
import { handleForm } from "@/lib/forms/handle";
import { createRequest } from "@/lib/sales/team";

const schema = z.object({
  turnstileToken: z.string().min(1, "Please complete the check."),
  website: z.string().max(0).optional(),
  requesterName: z.string().trim().min(2, "Enter your name.").max(80),
  requesterEmail: z.string().trim().toLowerCase().pipe(z.email("Enter your work email address.").max(254)),
  managerName: z.string().trim().min(2, "Enter your manager's name.").max(80),
  managerEmail: z.string().trim().toLowerCase().pipe(z.email("Enter your manager's email address.").max(254)),
  note: z.string().trim().max(500, "Keep the note under 500 characters.").optional().default(""),
  // The browser sends products and packages only; names, sizes and prices come from the catalog on the server.
  items: z.array(z.object({ product: z.string().trim().min(1).max(80), package: z.string().trim().min(1).max(40) })).min(1, "Your cart is empty.").max(10),
});

/** Create a purchase request (honeypot, Turnstile, 5/hour/IP rate limit through handleForm). */
export async function POST(req: Request) {
  return handleForm(req, "purchase-request", schema, async (d, { env }) => {
    const out = await createRequest(env, { requesterName: d.requesterName, requesterEmail: d.requesterEmail, managerName: d.managerName, managerEmail: d.managerEmail, note: d.note ?? "", items: d.items.map((i) => ({ slug: i.product, pkg: i.package })) });
    if (!out.ok) return { error: out.error };
    return { reference: out.reference };
  });
}
