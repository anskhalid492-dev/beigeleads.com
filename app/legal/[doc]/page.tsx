import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/shared/coming-soon";

// NEEDS LAWYER REVIEW: these are placeholders only. No legal text is written yet.
// Real documents must describe how we actually operate (CLAUDE.md section 10).
const docs: Record<string, string> = {
  privacy: "Privacy policy",
  terms: "Terms of service",
  "refund-replacement": "Refund and replacement policy",
  delivery: "Delivery policy",
  cookies: "Cookie policy",
  gdpr: "GDPR",
  ccpa: "CCPA",
  "can-spam": "CAN-SPAM",
  casl: "CASL",
  "lawful-use": "Lawful use policy",
  dpa: "Data processing agreement",
  "crypto-payments": "Crypto payment policy",
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(docs).map((doc) => ({ doc }));
}

export async function generateMetadata(props: PageProps<"/legal/[doc]">): Promise<Metadata> {
  const { doc } = await props.params;
  return docs[doc] ? { title: docs[doc], robots: { index: false, follow: true } } : {};
}

export default async function LegalStub(props: PageProps<"/legal/[doc]">) {
  const { doc } = await props.params;
  const title = docs[doc];
  if (!title) notFound();
  return (
    <ComingSoon
      title={title}
      note="This document is being drafted and will be reviewed before launch."
      crumbs={[{ name: "Legal", href: "/legal/privacy" }, { name: title, href: `/legal/${doc}` }]}
    />
  );
}
