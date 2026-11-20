import Link from "next/link";

/** Shown above the product page when a state/city URL has no list of its own: says plainly that the page shows the national list. */
export function PlaceNote({ placeName, productName, href }: { placeName: string; productName: string; href: string }) {
  return (
    <div className="mx-auto mt-4 max-w-[1200px] px-5">
      <p className="rounded-xl border border-sand-200 bg-sand-100 px-4 py-3 text-sm text-forest-700">
        There is no separate list for {placeName}. This is the national <Link href={href} className="font-semibold underline">{productName}</Link>; contacts in {placeName} are part of it.
      </p>
    </div>
  );
}
