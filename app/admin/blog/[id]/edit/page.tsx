import { EditView } from "./view";

export const dynamic = "force-dynamic";

export default function EditPage({ params }: PageProps<"/admin/blog/[id]/edit">) {
  return <EditView params={params} pathIsGuide={false} />;
}
