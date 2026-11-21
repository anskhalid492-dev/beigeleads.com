import type { Metadata } from "next";
import { validToken } from "@/lib/newsletter";
import { unsubscribeAction } from "../actions";
import { TokenButton } from "../token-button";

import { fitMeta } from "@/lib/seo/fit";
const metadataRaw: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

export default async function Page(props: PageProps<"/newsletter/unsubscribe">) {
  const { token } = await props.searchParams;
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <h1 className="display text-5xl text-forest-900">Unsubscribe</h1>
      <p className="mt-3 mb-6">Press the button to stop receiving BeigeLeads article emails.</p>
      {validToken(token) ? <TokenButton token={token} action={unsubscribeAction} label="Unsubscribe" done="You are unsubscribed." /> : <p role="alert">This link is not valid. Use the link from your email.</p>}
    </main>
  );
}

export const metadata: Metadata = fitMeta(metadataRaw);
