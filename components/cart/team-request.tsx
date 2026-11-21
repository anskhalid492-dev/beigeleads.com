"use client";
import { useEffect, useRef, useState } from "react";
import { UsersRound, X } from "lucide-react";
import { ApiForm } from "@/components/forms/api-form";
import { Button } from "@/components/ui/button";

/** "Request manager approval": a team member asks a manager to approve and pay for the cart. Prices are never sent from the browser. */
export function TeamRequest({ items, className = "" }: { items: { product: string; package: string }[]; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  if (items.length === 0) return null;
  return (
    <div className={className}>
      <Button type="button" variant="secondary" className="w-full" onClick={() => setOpen(true)}><UsersRound className="size-4" aria-hidden /> Request manager approval</Button>
      <p className="mt-1.5 text-center text-xs">Need sign-off first? We email your manager a secure link to review and pay.</p>
      <dialog ref={ref} onClose={() => setOpen(false)} onClick={(e) => { if (e.target === ref.current) setOpen(false); }} aria-labelledby="team-title" className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl border border-sand-200 bg-white p-0 text-forest-700 shadow-2xl backdrop:bg-forest-900/50">
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="team-title" className="text-xl font-bold text-forest-900">Request manager approval</h2>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-sand-100"><X className="size-5" /></button>
          </div>
          <p className="mt-2 text-sm">Your manager gets a secure link with the databases and the price. You pay nothing, and nothing is charged until they approve and pay. The request is valid for 7 days.</p>
          {open && (
            <div className="mt-5">
              <ApiForm
                endpoint="/api/purchase-request"
                submitLabel="Send request"
                successTitle="Request sent"
                successText="We emailed your manager the approval link and sent you a confirmation. You will hear from us when they approve or decline."
                hidden={{ items }}
                fields={[
                  { name: "requesterName", label: "Your name", type: "text", required: true, autoComplete: "name" },
                  { name: "requesterEmail", label: "Your work email", type: "email", required: true, autoComplete: "email" },
                  { name: "managerName", label: "Manager's name", type: "text", required: true },
                  { name: "managerEmail", label: "Manager's email", type: "email", required: true },
                  { name: "note", label: "Note for your manager", type: "textarea", placeholder: "Why you need these databases (optional)" },
                ]}
              />
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
