import { reviewInput, submitReview } from "@/lib/followups/reviews";
import { handleForm } from "@/lib/forms/handle";

export async function POST(req: Request) {
  return handleForm(req, "review", reviewInput, async (d, { env }) => {
    const r = await submitReview(env, d);
    if (!r.ok) return { error: r.error };
    return { public: d.allowPublic };
  });
}
