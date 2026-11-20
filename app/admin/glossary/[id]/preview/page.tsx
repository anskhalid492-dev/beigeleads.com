import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { TermPage } from "@/components/glossary/term-page";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { buildView } from "@/lib/glossary/public";
import { termById } from "@/lib/glossary/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Glossary preview", robots: { index: false, follow: false } };
export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  await guardAdmin();
  const db = getDbFromEnv(getCloudflareContext().env);
  const t = await termById(db, Number((await params).id)); if (!t) notFound();
  return (<><div className="bg-sand-100 px-5 py-2 text-sm"><Link href={`/admin/glossary/${t.id}`} className="font-semibold underline">Back to the editor</Link></div><TermPage v={await buildView(db, t)} preview /></>);
}
