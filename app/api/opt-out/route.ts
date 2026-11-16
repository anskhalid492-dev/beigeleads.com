import { getDb, schema } from "@/lib/db";
import { suppressionHash } from "@/lib/forms/hash";
import { notifyOwner, sendEmail } from "@/lib/forms/email";
import { handleForm } from "@/lib/forms/handle";
import { optOutSchema } from "@/lib/forms/schemas";

export async function POST(req: Request) {
  return handleForm(req, "opt-out", optOutSchema, async (data, { env, waitUntil }) => {
    const emailHash = await suppressionHash(data.email, env.HASH_SALT);
    const db = getDb();

    // Store only the hash. Repeat requests are fine: skip if already suppressed.
    const existing = await db.query.suppressions.findFirst({
      where: (s, { eq }) => eq(s.emailHash, emailHash),
    });
    if (!existing) {
      await db.insert(schema.suppressions).values({ emailHash, reason: "opt-out form" });
    }

    waitUntil(
      Promise.all([
        sendEmail(env, {
          to: data.email,
          subject: "Your opt-out request was recorded",
          text: "We recorded your request. This address will be left out of future BeigeLeads files.\n\nBeigeLeads",
        }),
        notifyOwner(env, "New opt-out", "A new address was added to the suppressions table."),
      ]),
    );
  });
}
