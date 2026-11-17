import { redirect } from "next/navigation";
import { requireAdmin, requireBlogUser } from "./require-admin";

const loginReasons = ["no-cookie", "bad-session", "email-mismatch"];
const toLogin = (e: unknown): never => {
  const m = e instanceof Error ? e.message : "";
  redirect(`/admin/login?reason=${loginReasons.includes(m) ? m : "forbidden"}`);
};

/** Full-admin pages. Blog editors are sent to the blog instead of the login page. */
export async function guardAdmin() {
  try { return await requireAdmin(); } catch (e) {
    if (e instanceof Error && e.message === "editor") redirect("/admin/blog");
    return toLogin(e);
  }
}

/** Blog pages: admins and editors. */
export async function guardBlog() {
  try { return await requireBlogUser(); } catch (e) { return toLogin(e); }
}
