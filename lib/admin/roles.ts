export type BlogRole = "admin" | "editor";
export type BlogUser = { email: string; role: BlogRole };

export const parseEmails = (s: string | undefined) => (s ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
/** Editors are listed in the var BLOG_EDITOR_EMAILS. A listed editor is never an admin, even if also in ADMIN_EMAILS (least privilege). */
export const isEditorEmail = (list: string | undefined, email: string) => parseEmails(list).includes(email.toLowerCase());

/** What each role may do with the blog. Editors write drafts; only admins publish, delete or change settings that go live. */
export const can = {
  publish: (r: BlogRole) => r === "admin",
  delete: (r: BlogRole) => r === "admin",
  manageTaxonomy: (r: BlogRole) => r === "admin",
  replaceMedia: (r: BlogRole) => r === "admin",
  deleteMedia: (r: BlogRole) => r === "admin",
  editPost: (r: BlogRole, status: string) => r === "admin" || status === "draft",
};
