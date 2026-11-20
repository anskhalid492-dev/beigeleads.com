import { EditView } from "../../../blog/[id]/edit/view";

export const dynamic = "force-dynamic";

export default function CaseStudyEditPage({ params }: { params: Promise<{ id: string }> }) {
  return <EditView params={params} pathKind="case" />;
}
