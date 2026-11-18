import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getAuthor, parseExpertise, parseLinks } from "@/lib/blog/authors";
import { AuthorForm } from "../../author-form";

export const dynamic = "force-dynamic";

export default async function EditAuthor({ params }: { params: Promise<{ id: string }> }) {
  await guardAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  let r;
  try { r = await getAuthor(getCloudflareContext().env, id); } catch { notFound(); }
  if (!r) notFound();
  const l = parseLinks(r.linksJson);
  return (
    <>
      <PageHeader title={`Edit ${r.displayName}`} actions={r.status === "published" ? <Link href={`/blog/author/${r.slug}`} target="_blank" rel="noopener" className="text-sm font-semibold underline">View public profile</Link> : undefined} />
      <AuthorForm key={r.updatedAt.getTime()} id={r.id} siteUrl="https://beigeleads.com" initial={{
        fullName: r.fullName, displayName: r.displayName, slug: r.slug, title: r.title, email: r.email, shortBio: r.shortBio, fullBio: r.fullBio, expertise: parseExpertise(r.expertiseJson),
        company: r.company, location: r.location, photo: r.photo, links: { linkedin: l.linkedin ?? "", twitter: l.twitter ?? "", website: l.website ?? "", github: l.github ?? "", other: l.other ?? "" },
        seoTitle: r.seoTitle, metaDescription: r.metaDescription, ogImage: r.ogImage, canonicalUrl: r.canonicalUrl, noindex: r.noindex, status: r.status,
      }} />
    </>
  );
}
