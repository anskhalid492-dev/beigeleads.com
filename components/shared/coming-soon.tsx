import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

export function ComingSoon({ title, note, crumbs }: { title: string; note: string; crumbs: Crumb[] }) {
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <section className="mx-auto max-w-6xl px-4 pb-32 pt-8">
        <h1 className="display text-6xl text-forest-900 sm:text-7xl">{title}</h1>
        <p className="mt-4 max-w-xl text-lg">{note}</p>
        <div className="mt-8">
          <Button asChild variant="secondary" size="lg">
            <Link href="/lists">Browse lists</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
