import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaBand({
  title = "See a sample before you spend a cent.",
  href = "/sample",
  label = "Request a free sample",
}: {
  title?: string;
  href?: string;
  label?: string;
}) {
  return (
    <section className="bg-forest-900 py-20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-4">
        <h2 className="display max-w-xl text-5xl text-sand-50 sm:text-6xl">{title}</h2>
        <Button asChild size="lg">
          <Link href={href}>{label}</Link>
        </Button>
      </div>
    </section>
  );
}
