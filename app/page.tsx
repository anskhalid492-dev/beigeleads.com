import Link from "next/link";
import { Button } from "@/components/ui/button";

// Phase 1 home: structure only. No invented stats, reviews or counts (CLAUDE.md section 2).
// Every block marked PLACEHOLDER must be replaced with real data before launch.
const steps = [
  ["Find your list", "Browse by category, country and city."],
  ["Check the sample", "Preview masked rows before you pay."],
  ["Pay once in crypto", "No account, no subscription."],
  ["Download", "Get a secure link by email."],
] as const;

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="mx-auto w-fit rounded-full bg-forest-100 px-4 py-1 text-xs font-semibold text-forest-700">
          One-time purchase. No subscription.
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-semibold leading-tight md:text-6xl">
          Pay once. Own the list.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg">
          Business contact lists by category, country and city. See a sample first, pay once, download
          your file.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/lists">Browse lists</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/sample">Request a free sample</Link>
          </Button>
        </div>
      </section>

      <section className="bg-sand-100 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-semibold">What a sample looks like</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm">
            PLACEHOLDER: layout preview only. Real masked samples arrive with real data.
          </p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-sand-200 bg-white shadow-sm">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-sand-100 text-xs uppercase tracking-wide text-forest-500">
                <tr>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Website</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((n) => (
                  <tr key={n} className="border-t border-sand-200">
                    <td className="px-4 py-3">Placeholder Business {n}</td>
                    <td className="px-4 py-3">j***@example.com</td>
                    <td className="px-4 py-3">+1 ***-***-010{n}</td>
                    <td className="px-4 py-3">example.com</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-semibold">How it works</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {steps.map(([title, text], i) => (
            <li key={title} className="rounded-2xl border border-sand-200 bg-white p-6">
              <span className="flex size-9 items-center justify-center rounded-full bg-forest-700 text-sm font-semibold text-sand-50">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-forest-900 py-16 text-center">
        <h2 className="text-3xl font-semibold text-sand-50">Start with a free sample</h2>
        <p className="mt-2 text-sand-200">No payment details needed.</p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/sample">Request a sample</Link>
        </Button>
      </section>
    </>
  );
}
