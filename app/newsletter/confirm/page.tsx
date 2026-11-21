import type { Metadata } from "next";
import { validToken } from "@/lib/newsletter";
import { confirmAction } from "../actions";
import { TokenButton } from "../token-button";

import { fitMeta } from "@/lib/seo/fit";
const metadataRaw: Metadata = { title: "Confirm your subscription", robots: { index: false, follow: false } };

export default async function Page(props: PageProps<"/newsletter/confirm">) {
  const { token } = await props.searchParams;
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <h1 className="display text-5xl text-forest-900">Confirm your subscription</h1>
      <p className="mt-3 mb-6">Confirm that you want new BeigeLeads articles by email.</p>
      {validToken(token) ? <TokenButton token={token} action={confirmAction} label="Confirm subscription" done="Subscribed. Thank you." /> : <p role="alert">This link is not valid. Use the link from your email.</p>}
    </main>
  );
}

export const metadata: Metadata = fitMeta(metadataRaw);
