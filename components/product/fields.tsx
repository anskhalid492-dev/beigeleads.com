import { Check } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { fieldMeta, groupOrder } from "./meta";

export function ProductFields({ product }: { product: Product }) {
  const groups = groupOrder
    .map((g) => ({ g, items: product.fields.filter((f) => fieldMeta[f]?.group === g) }))
    .filter((x) => x.items.length);
  const other = product.fields.filter((f) => !fieldMeta[f]);
  if (!product.fields.length) return null; // imported lists: the exact fields are unknown, so none are claimed
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <h2 className="display max-w-3xl text-5xl text-forest-900 sm:text-6xl">What data fields are in the {product.name}?</h2>
      <p className="mt-4 max-w-2xl text-lg">
        Every record can carry these {product.fields.length} fields. Some businesses do not publish every detail, so not every cell is filled.
      </p>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {groups.map(({ g, items }) => (
          <div key={g} className="rounded-3xl border border-sand-300 bg-sand-100 p-7">
            <h3 className="display text-3xl text-forest-900">{g}</h3>
            <ul className="mt-5 space-y-5">
              {items.map((f) => {
                const m = fieldMeta[f];
                return (
                  <li key={f} className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest-900">
                      <m.icon className="size-5 text-forest-300" aria-hidden />
                    </span>
                    <div>
                      <p className="font-semibold text-forest-900">{f}</p>
                      <p className="text-sm">{m.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {other.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {other.map((f) => (
            <li key={f} className="inline-flex items-center gap-1.5 rounded-full bg-forest-100 px-3 py-1 text-sm font-medium text-forest-900">
              <Check className="size-3.5" aria-hidden /> {f}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
