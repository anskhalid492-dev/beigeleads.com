import { Download, Package, PackageSearch, Wallet } from "lucide-react";

const steps = [
  { icon: PackageSearch, t: "Choose your database", d: "Check the sample and the fields on this page." },
  { icon: Package, t: "Select your package", d: "Pick the number of records that fits your campaign." },
  { icon: Wallet, t: "Complete your payment", d: "Pay once in crypto. No account, no card, no subscription." },
  { icon: Download, t: "Download your database", d: "A secure link arrives by email as soon as the payment is confirmed." },
] as const;

export function ProductHowItWorks({ name }: { name: string }) {
  return (
    <section className="border-y border-sand-200 bg-forest-100/60 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="display max-w-3xl text-5xl text-forest-900 sm:text-6xl">How to buy the {name}</h2>
        <p className="mt-4 max-w-2xl text-lg">A one-time purchase. You pay once and there is no recurring subscription.</p>
        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          <span aria-hidden className="absolute left-6 top-6 hidden h-px w-[calc(100%-3rem)] bg-forest-500/40 md:block" />
          {steps.map((s, i) => (
            <li key={s.t} className="relative">
              <span className="relative grid size-12 place-items-center rounded-full bg-forest-900 text-forest-300">
                <s.icon className="size-5" aria-hidden />
              </span>
              <p className="display mt-5 text-3xl text-forest-900">
                <span className="mr-2 text-forest-500">{i + 1}.</span>
                {s.t}
              </p>
              <p className="mt-2">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
