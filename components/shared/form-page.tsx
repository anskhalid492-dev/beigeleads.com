import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

export function FormPage({ title, intro, crumbs, children }: { title: string; intro: string; crumbs: Crumb[]; children: ReactNode }) {
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <h1 className="display text-6xl text-forest-900 sm:text-7xl">{title}</h1>
          <p className="mt-4 max-w-md text-lg">{intro}</p>
        </div>
        <div className="max-w-xl">{children}</div>
      </section>
    </>
  );
}
