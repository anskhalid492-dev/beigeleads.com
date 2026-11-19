import { PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

/** Inventory of what the code actually emits. Update when a page's JSON-LD changes. */
const ROWS: [string, string, string][] = [
  ["Every page", "Organization (name, URL)", "app/layout.tsx"],
  ["Blog articles", "BlogPosting (author linked by @id), BreadcrumbList", "components/blog/article-view.tsx"],
  ["Author pages", "ProfilePage + Person", "app/blog/author/[slug]"],
  ["Home, How it works, Sample, Custom list", "WebSite / WebPage, HowTo (How it works)", "page files"],
  ["Pages with FAQs", "FAQPage (questions and answers shown on the page)", "components/shared/faq.tsx"],
  ["Breadcrumb trails", "BreadcrumbList", "components/shared/breadcrumbs.tsx"],
];

export default async function StructuredData() {
  await guardAdmin();
  return (
    <>
      <PageHeader title="Structured data" text="The schema.org JSON-LD the site publishes today. This list is read from the code, not from search engines." />
      <Panel title="What each page publishes">
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
          <thead><tr className="border-b border-sand-200 text-xs"><th className="px-4 py-3">Where</th><th className="px-4 py-3">Types</th><th className="px-4 py-3">Source</th></tr></thead>
          <tbody className="divide-y divide-sand-200">{ROWS.map(([a, b, c]) => <tr key={a}><td className="px-4 py-3 font-semibold text-forest-900">{a}</td><td className="px-4 py-3">{b}</td><td className="px-4 py-3 font-mono text-xs">{c}</td></tr>)}</tbody>
        </table></div>
      </Panel>
      <Panel title="Rules in place" className="mt-6">
        <ul className="list-disc space-y-1 px-9 py-4 text-sm">
          <li>No star ratings, review counts or prices are published, because none exist.</li>
          <li>Each type is generated once per page by one component, so there are no duplicate blocks.</li>
          <li>Editing these types from the admin is not built: the Organization block sits in the shared layout, and making it editable would add a database read to every page.</li>
          <li>Check a live page with Google&apos;s Rich Results Test once the site is open to search engines.</li>
        </ul>
      </Panel>
    </>
  );
}
