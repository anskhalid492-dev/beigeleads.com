import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Category, Product } from "@/lib/catalog";

export function ProductFinalCta({ product, category }: { product: Product; category: Category }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div
        className="relative overflow-hidden rounded-[2rem] bg-forest-900 px-8 py-16 text-center sm:px-16 lg:py-24"
        style={{ backgroundImage: "radial-gradient(60% 80% at 50% 0%, rgba(143,208,169,0.22), transparent 70%)" }}
      >
        <h2 className="display mx-auto max-w-3xl text-5xl text-sand-50 sm:text-7xl">Ready to reach {category.reachLabel}?</h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-sand-200">
          Explore the {product.name}, review the available data, and get the database that matches your business requirements.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={`/sample?product=${product.slug}`}>Request free sample</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href="#pricing">View pricing</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
