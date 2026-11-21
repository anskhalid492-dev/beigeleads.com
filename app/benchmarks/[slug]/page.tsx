import { notFound } from "next/navigation";
import { BENCHMARKS } from "@/lib/benchmarks";

// Drafts are never rendered: a benchmark page exists publicly only when its record is published with verified data (CLAUDE.md section 138).
// No published reports exist yet, so every slug 404s. Rendering published reports is built together with the first sourced dataset.
export default async function BenchmarkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = BENCHMARKS.find((x) => x.slug === slug && x.status === "published");
  if (!b) notFound();
  notFound();
}
