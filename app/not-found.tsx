import { redirect } from "next/navigation";

// Owner decision (20 Nov 2026): every page that does not exist sends the visitor to the catalog instead of a dead end.
// Route handlers (images, API) still return real 404 responses.
export default function NotFound() {
  redirect("/lists");
}
