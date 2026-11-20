import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { getCategories } from "@/lib/glossary/store";
import { TermForm } from "../term-form";

export const dynamic = "force-dynamic";
export default async function NewTerm() {
  await guardAdmin();
  const cats = await getCategories(getDbFromEnv(getCloudflareContext().env));
  return (
    <>
      <PageHeader title="New glossary entry" text="Write one entry by hand. Save it as a draft first, preview it, then publish." actions={<Link href="/admin/glossary" className="text-sm underline">Back to the list</Link>} />
      <TermForm categories={cats} init={{ term: "", slug: "", category: "", shortDefinition: "", content: "", whyItMatters: "", example: "", relatedTerms: "", relatedGuides: "", relatedProducts: "", seoTitle: "", metaDescription: "", keywords: "", featured: false }} />
    </>
  );
}
