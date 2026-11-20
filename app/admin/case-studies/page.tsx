import { PostsAdmin } from "../blog/posts-admin";

export const dynamic = "force-dynamic";

export default function CaseStudiesAdmin(props: { searchParams: React.ComponentProps<typeof PostsAdmin>["searchParams"] }) {
  return <PostsAdmin kind="case" searchParams={props.searchParams} />;
}
