"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { restoreRevisionAction } from "../../actions";

export function RestoreButton({ postId, revisionId, version }: { postId: number; revisionId: number; version: number }) {
  const [ask, setAsk] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  if (!ask) return <Button variant="secondary" onClick={() => setAsk(true)}>Restore this version</Button>;
  return (
    <span className="flex items-center gap-2 text-sm">
      Replace the current text?
      <Button size="sm" disabled={pending} onClick={() => start(async () => { const r = await restoreRevisionAction(postId, revisionId, version); if (r.ok) { toast(true, "Restored as a new version."); router.push(`/admin/blog/${postId}/edit`); } else { toast(false, r.error); setAsk(false); } })}>Yes, restore</Button>
      <Button size="sm" variant="secondary" onClick={() => setAsk(false)}>No</Button>
    </span>
  );
}
