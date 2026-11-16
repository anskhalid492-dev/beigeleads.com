import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { JsonLd } from "./json-ld";

export type Crumb = { name: string; href: string };

export function Breadcrumbs({ items, wide = false }: { items: Crumb[]; wide?: boolean | "xl" }) {
  const all: Crumb[] = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={`mx-auto px-4 pt-6 text-sm ${wide === "xl" ? "max-w-[1400px] sm:px-8 lg:px-12" : wide ? "max-w-7xl sm:px-6 lg:px-8" : "max-w-6xl"}`}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {all.map((c, i) => (
            <li key={c.href} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-sand-300">/</span>}
              {i === all.length - 1 ? (
                <span aria-current="page" className="font-semibold text-forest-900">
                  {c.name}
                </span>
              ) : (
                <Link href={c.href} className="underline underline-offset-4 hover:text-forest-900">
                  {c.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: `${SITE_URL}${c.href}`,
          })),
        }}
      />
    </>
  );
}
