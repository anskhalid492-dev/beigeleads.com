import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Inline } from "@/components/help/rich";
import { articleHref } from "@/lib/help/data";
import type { HelpArticle } from "@/lib/help/types";

export function CommonQuestions({ items }: { items: readonly HelpArticle[] }) {
  return (
    <div className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
      {items.map((a) => (
        <details key={a.slug} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-forest-900">{a.title}<span aria-hidden className="text-xl transition-transform group-open:rotate-45">+</span></summary>
          <p className="mt-3"><Inline text={a.description} /></p>
          <Link href={articleHref(a)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-forest-900 underline underline-offset-4">Read the full answer <ArrowRight className="size-4" aria-hidden /></Link>
        </details>
      ))}
    </div>
  );
}
