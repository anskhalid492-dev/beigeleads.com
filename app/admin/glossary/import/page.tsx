import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { STARTERS } from "@/lib/glossary/starters";
import { loadStartersAction } from "../actions";
import { ImportWizard } from "./import-wizard";

export const dynamic = "force-dynamic";
const dl = "inline-flex items-center rounded-full border border-forest-900 px-4 py-1.5 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50";

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await guardAdmin();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Bulk upload glossary entries" text="Upload a CSV, XLSX or JSON file with ready-written entries. You see a preview, errors and warnings before anything is saved." actions={<Link href="/admin/glossary" className="text-sm underline">Back to the list</Link>} />
      {sp.saved && <p role="status" className="mb-5 rounded-xl bg-forest-100 px-4 py-3 text-sm text-forest-900">{sp.saved}</p>}
      {sp.error && <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">{sp.error}</p>}
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Starter entries (ready to review)">
          <div className="space-y-4 p-5 text-sm">
            <p>{STARTERS.length} original entries across 12 topics: B2B databases, B2C data, lead generation, email marketing, cold emailing, email verification, data enrichment, sales prospecting, CRM, data segmentation, marketing automation, and privacy and compliance. Each has a definition, explanation, “why it matters” and an example. They are always added as <strong>drafts</strong>. You review and publish them yourself.</p>
            <form action={loadStartersAction}><Button type="submit">Add the {STARTERS.length} entries as drafts</Button></form>
            <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-forest-900">Or download the file:</span><a className={dl} href="/admin/glossary/download?file=starter&format=csv" download>CSV</a><a className={dl} href="/admin/glossary/download?file=starter&format=xlsx" download>XLSX</a><a className={dl} href="/admin/glossary/download?file=starter&format=json" download>JSON</a></div>
          </div>
        </Panel>
        <Panel title="Import template">
          <div className="space-y-3 p-5 text-sm">
            <p>A blank file with the right columns and one example row.</p>
            <div className="flex flex-wrap gap-2"><a className={dl} href="/admin/glossary/download?file=template&format=csv" download>CSV template</a><a className={dl} href="/admin/glossary/download?file=template&format=xlsx" download>XLSX template</a><a className={dl} href="/admin/glossary/download?file=template&format=json" download>JSON template</a></div>
            <ul className="list-disc space-y-1 pl-5 text-xs">
              <li>Required: Term and Short definition. A slug is made from the term when empty.</li>
              <li>Related terms, guides and products: separate items with “;”.</li>
              <li>Status: Draft or Published. A published entry needs a full explanation of at least 200 characters.</li>
              <li>Formatting: paragraphs, **bold**, “- ” bullets, “## ” headings and [links](/path). HTML is converted; scripts and unsafe links are removed.</li>
            </ul>
          </div>
        </Panel>
      </div>
      <ImportWizard />
    </>
  );
}
