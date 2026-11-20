import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TaxIconSvg } from "@/components/lists/tax-icon";
import type { TaxGroup } from "@/lib/taxonomy";
import { productKind, type ShopProduct } from "@/lib/shop";

type Icon = React.ComponentProps<typeof TaxIconSvg>["name"];
type Cell = { key: string; name: string; note: string; href: string; icon: Icon; ready: boolean };

/** Database types as one ruled index (not ten cards). Only published categories; "ready" = a real product or page behind it. */
export function TypeRail({ tax, products }: { tax: TaxGroup[]; products: ShopProduct[] }) {
  const g = (slug: string) => tax.find((x) => x.slug === slug && x.published !== false && x.menuVisible !== false);
  const kinds = new Set(products.map(productKind));
  const cells: (Cell | undefined | false)[] = [
    g("email-lists") && { key: "email", name: "Email Lists", note: "Business email contacts", href: "/lists/email-lists", icon: "mail", ready: g("email-lists")!.status === "available" },
    g("phone-number-lists") && { key: "phone", name: "Phone Number Lists", note: "Business phone contacts", href: "/lists/phone-number-lists", icon: "phone", ready: g("phone-number-lists")!.status === "available" },
    g("whatsapp-number-lists") && { key: "wa", name: "WhatsApp Number Lists", note: "Opt-in rules apply", href: "/lists/whatsapp-number-lists", icon: "message", ready: g("whatsapp-number-lists")!.status === "available" },
    g("industry-databases") && { key: "ind", name: "Industry Databases", note: "One industry at a time", href: "/lists/industry-databases", icon: "building", ready: g("industry-databases")!.status === "available" },
    g("job-title-lists") && { key: "jt", name: "Job Title Lists", note: "CEOs, founders, CFOs", href: "/lists/job-title-lists", icon: "briefcase", ready: g("job-title-lists")!.status === "available" },
    g("job-function-lists") && { key: "jf", name: "Job Function Lists", note: "Sales, marketing, HR", href: "/lists/job-function-lists", icon: "users", ready: g("job-function-lists")!.status === "available" },
    g("management-levels") && { key: "ml", name: "Management Level Lists", note: "Executive to manager", href: "/lists/management-levels", icon: "users", ready: g("management-levels")!.status === "available" },
    g("geographic-databases") && { key: "country", name: "Country Databases", note: "A whole country in one file", href: "/lists?kind=country#databases", icon: "globe", ready: kinds.has("country") },
    g("geographic-databases") && { key: "city", name: "State and City Databases", note: "Local, city by city", href: "/lists?kind=city#databases", icon: "building", ready: kinds.has("city") },
    g("email-lists") && { key: "b2c", name: "Consumer Databases", note: "Not sold today", href: "/lists/email-lists/b2c-email-lists", icon: "users", ready: false },
  ];
  const list = cells.filter(Boolean) as Cell[];
  return (
    <section id="types" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-2"><h2 className="display text-[2rem] leading-none text-forest-900 sm:text-[2.6rem]">Browse by database type</h2><p className="text-sm">Pick a type, or scroll to shop every ready-made list.</p></div>
      <ul className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[1.6rem] border border-sand-300 bg-sand-300 sm:grid-cols-3 lg:grid-cols-5">
        {list.map((c, i) => (
          <li key={c.key} style={{ ["--i" as string]: i }} className="cat-in bg-sand-50">
            <Link href={c.href} className="group relative flex h-full min-h-[8.5rem] flex-col justify-between p-4 transition-colors duration-200 hover:bg-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-600 sm:p-5">
              <span className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-full bg-forest-900 text-forest-300 transition-transform duration-200 group-hover:-rotate-6 motion-reduce:transition-none"><TaxIconSvg name={c.icon} className="size-5" /></span>
                <ArrowUpRight className="size-4 text-forest-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
              </span>
              <span>
                <span className="display block text-[1.25rem] leading-tight text-forest-900">{c.name}</span>
                <span className="mt-1 flex items-center gap-1.5 text-xs"><span className={`size-1.5 rounded-full ${c.ready ? "bg-forest-500" : "bg-sand-300"}`} aria-hidden />{c.ready ? c.note : "Upcoming"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
