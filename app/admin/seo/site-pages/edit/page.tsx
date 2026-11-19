import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { listOverrides } from "@/lib/seo/page-overrides";
import { sitePages } from "@/lib/seo/page-registry";
import { PageSeoForm } from "./form";

export const dynamic = "force-dynamic";

export default async function EditPageSeo({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  await guardAdmin();
  const { path } = await searchParams;
  const page = sitePages().find((p) => p.path === path);
  if (!page) notFound();
  let o;
  try { o = (await listOverrides(getCloudflareContext().env)).find((x) => x.path === page.path); } catch { /* table missing: form shows empty */ }
  return (
    <>
      <PageHeader title={page.label} text={`${page.group} · ${page.path}`} actions={<Link href="/admin/seo/site-pages" className="text-sm underline">All pages</Link>} />
      <Panel title="Search and social tags">
        <PageSeoForm path={page.path} initial={{ seoTitle: o?.seoTitle ?? "", metaDescription: o?.metaDescription ?? "", ogTitle: o?.ogTitle ?? "", ogDescription: o?.ogDescription ?? "", ogImage: o?.ogImage ?? "", canonicalUrl: o?.canonicalUrl ?? "" }} />
      </Panel>
    </>
  );
}
