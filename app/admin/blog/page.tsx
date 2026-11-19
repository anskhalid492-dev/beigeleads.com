import { PostsAdmin } from "./posts-admin";

export const dynamic = "force-dynamic";

export default function BlogAdmin(props: { searchParams: Promise<{ q?: string; status?: string; category?: string; author?: string; sort?: string; page?: string }> }) {
  return <PostsAdmin kind="blog" searchParams={props.searchParams} />;
}
