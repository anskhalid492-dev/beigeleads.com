import { PostsAdmin } from "../blog/posts-admin";

export const dynamic = "force-dynamic";

export default function GuidesAdmin(props: { searchParams: Promise<{ q?: string; status?: string; category?: string; author?: string; sort?: string; page?: string }> }) {
  return <PostsAdmin kind="guide" searchParams={props.searchParams} />;
}
