import Link from "next/link";
import { Check, MapPin } from "lucide-react";
import { DbBadge, Flag } from "@/components/shared/db-icon";
import { formatUsd } from "@/lib/catalog";
import { productKind, type ShopProduct } from "@/lib/shop";

const KIND = { country: "Country database", city: "City database", industry: "Industry database" } as const;

/** One purchasable database as a card (grid) or a row (list view). Real catalog data only: counts and prices appear only when they are real. */
export function ListCard({ p, view = "grid" }: { p: ShopProduct; view?: "grid" | "list" }) {
  const buyable = p.status === "live";
  const row = view === "list";
  const kind = productKind(p);
  const place = p.scope === "city" ? `${p.title.replace(/^Business contacts in /, "")}` : p.scope === "country" && p.categorySlug === "business" ? `All of ${p.countryName}` : p.countryName;
  const fields = p.fields.slice(0, row ? 7 : 4);
  return (
    <li className={`group relative rounded-[1.4rem] border border-sand-300 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-forest-500 hover:shadow-[0_18px_34px_-24px_rgba(15,42,29,.55)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${row ? "flex flex-col gap-5 md:flex-row md:items-center" : "flex flex-col"}`}>
      <div className={`flex items-start gap-4 ${row ? "md:w-[23rem] md:shrink-0" : ""}`}>
        <DbBadge category={p.categorySlug} hint={p.name} country={p.countryCode} region={p.region} size="lg" />
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-forest-900">{kind === "city" && p.region && p.scope !== "city" ? "State database" : KIND[kind]}</span>
          <h3 className="display mt-1.5 text-[1.55rem] leading-[1.05] text-forest-900"><Link href={`/lists/${p.slug}`} className="after:absolute after:inset-0 after:rounded-[1.4rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">{p.name}</Link></h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm"><Flag code={p.countryCode} className="h-3 w-[18px]" /><MapPin className="size-3.5 text-forest-500" aria-hidden />{place}</p>
        </div>
      </div>
      <div className={row ? "md:flex-1" : "mt-4"}>
        <ul className="flex flex-wrap gap-1.5" aria-label="Data fields">
          {fields.map((f) => <li key={f} className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-forest-900"><Check className="size-3 text-forest-500" aria-hidden />{f}</li>)}
          {p.fields.length > fields.length && <li className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-forest-900">+{p.fields.length - fields.length} more</li>}
        </ul>
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-sand-200 pt-3 text-sm">
          <div><dt className="text-xs text-forest-500">Contacts</dt><dd className="font-bold text-forest-900">{p.recordCount ? p.recordCount.toLocaleString("en-US") : "Count to be confirmed"}</dd></div>
          <div><dt className="text-xs text-forest-500">Status</dt><dd className="inline-flex items-center gap-1.5 font-semibold text-forest-900"><span className={`size-2 rounded-full ${buyable ? "bg-forest-500" : "bg-sand-300"}`} aria-hidden />{buyable ? "Available" : "Preview only"}</dd></div>
          <div><dt className="text-xs text-forest-500">One-time</dt><dd className="font-bold text-forest-900">{p.fromCents ? `From ${formatUsd(p.fromCents)}` : "On the list page"}</dd></div>
        </dl>
      </div>
      <div className={`relative z-10 grid grid-cols-2 gap-2 ${row ? "md:w-[19rem] md:shrink-0" : "mt-5"}`}>
        <Link href={`/lists/${p.slug}`} className="inline-flex h-10 items-center justify-center rounded-full bg-purple-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">View Database</Link>
        <Link href={`/lists/${p.slug}#sample`} className="inline-flex h-10 items-center justify-center rounded-full border border-sand-300 px-3 text-sm font-semibold text-forest-900 hover:border-forest-900">Preview Sample</Link>
      </div>
    </li>
  );
}
