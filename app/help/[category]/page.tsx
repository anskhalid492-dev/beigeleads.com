import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CategoryIcon } from "@/components/help/icons";
import { articleHref, articlesIn, getCategory, helpCategories } from "@/lib/help";

export const dynamicParams = false;
export const generateStaticParams = () => helpCategories.map((c) => ({ category: c.slug }));

export async function generateMetadata(props: PageProps<"/help/[category]">): Promise<Metadata> {
  const c = getCategory((await props.params).category);
  if (!c) return {};
  return { title: `${c.name} | Help Center`, description: c.description, alternates: { canonical: `/help/${c.slug}` } };
}

export default async function HelpCategoryPage(props: PageProps<"/help/[category]">) {
  const c = getCategory((await props.params).category);
  if (!c) notFound();
  const list = articlesIn(c.slug);
  return (
    <>
      <Breadcrumbs items={[{ name: "Help Center", href: "/help-center" }, { name: c.name, href: `/help/${c.slug}` }]} />
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_16rem]">
          <div>
            <span className="grid size-12 place-items-center rounded-xl bg-forest-100 text-forest-700"><CategoryIcon name={c.icon} className="size-6" /></span>
            <h1 className="display mt-4 text-5xl text-forest-900 sm:text-6xl">{c.name}</h1>
            <p className="mt-3 max-w-2xl text-lg">{c.description}</p>
            <ul className="mt-8 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
              {list.map((a) => (
                <li key={a.slug}>
                  <Link href={articleHref(a)} className="block px-6 py-5 hover:bg-sand-50 focus-visible:outline-2 focus-visible:outline-purple-600">
                    <span className="block text-lg font-bold text-forest-900">{a.title}</span>
                    <span className="mt-1 block text-base">{a.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <aside aria-label="Other topics" className="lg:pt-24">
            <p className="text-sm font-bold text-forest-900">Other topics</p>
            <ul className="mt-3 space-y-1 text-sm">
              {helpCategories.filter((x) => x.slug !== c.slug).map((x) => <li key={x.slug}><Link href={`/help/${x.slug}`} className="block rounded-lg px-3 py-1.5 hover:bg-sand-100">{x.name}</Link></li>)}
            </ul>
          </aside>
        </div>
      </div>
    </>
  );
}
