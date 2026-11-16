import type { Category, Product } from "@/lib/catalog";

export function ProductAudience({ product, category }: { product: Product; category: Category }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <h2 className="display text-5xl text-forest-900 sm:text-6xl lg:sticky lg:top-24 lg:self-start lg:text-7xl">Who uses this database?</h2>
        <ul className="divide-y divide-sand-300 border-y border-sand-300">
          {category.useCases.map((u) => (
            <li key={u.name} className="group grid gap-2 py-6 transition-colors hover:bg-sand-100 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-8 sm:px-4">
              <h3 className="display text-3xl text-forest-900 transition-transform group-hover:translate-x-1">{u.name}</h3>
              <p className="self-center">{u.text}</p>
            </li>
          ))}
        </ul>
      </div>
      <p className="sr-only">Typical buyers of the {product.name}.</p>
    </section>
  );
}
