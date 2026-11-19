import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { getEditable } from "@/lib/system-emails/store";
import { SYSTEM_KEYS, VARIABLES } from "@/lib/system-emails/variables";
import { Designer } from "./designer";

export const dynamic = "force-dynamic";

export default async function DesignTemplate({ params }: { params: Promise<{ key: string }> }) {
  await guardAdmin();
  const { key } = await params;
  const env = getCloudflareContext().env;
  const t = await getEditable(getDbFromEnv(env), key);
  if (!t) notFound();
  let locked = false;
  try { await env.DB.prepare("SELECT 1 FROM email_templates LIMIT 1").first(); } catch { locked = true; }
  const allowed = [...t.def.vars, ...SYSTEM_KEYS];
  const vars = VARIABLES.filter((v) => allowed.includes(v.key)).map(({ key: k, label, example }) => ({ key: k, label, example }));
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/system-emails" className="underline">System Emails</Link> / <Link href={`/admin/system-emails/${key}`} className="underline">{t.def.name}</Link> / Visual designer</p>
      <PageHeader title={`Design: ${t.def.name}`} text="Drag blocks, edit text directly on the email, and style with brand colours only. Drafts never change what customers receive until you publish." />
      {locked && <p className="mb-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Saving and publishing need migrations 0022 and 0023 in D1. You can still design and preview.</p>}
      <Designer tkey={key} name={t.def.name} initial={t.draft ?? t.published} vars={vars} allowed={allowed} hasDraft={!!t.draft} publishedVersion={t.version} canPublish locked={locked} />
    </>
  );
}
