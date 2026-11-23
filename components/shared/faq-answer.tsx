import Link from "next/link";
import { linkFaqAnswer } from "@/lib/faq-links";

/** FAQ answer text with internal links added by `lib/faq-links.ts`. Plain text in, links out. */
export function FaqAnswer({ text, skip }: { text: string; skip?: readonly string[] }) {
  return (
    <>
      {linkFaqAnswer(text, skip).map((s, i) =>
        s.href ? <Link key={i} href={s.href} className="font-semibold text-forest-900 underline decoration-purple-600/40 underline-offset-4 hover:text-purple-700">{s.text}</Link> : <span key={i}>{s.text}</span>,
      )}
    </>
  );
}
