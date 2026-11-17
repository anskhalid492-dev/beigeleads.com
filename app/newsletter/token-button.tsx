"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function TokenButton({ token, action, label, done }: { token: string; action: (t: string) => Promise<boolean>; label: string; done: string }) {
  const [state, setState] = useState<"idle" | "ok" | "bad">("idle");
  const [pending, start] = useTransition();
  if (state === "ok") return <p role="status" className="rounded-xl bg-forest-100 p-4 font-semibold text-forest-900">{done}</p>;
  return (
    <div>
      <Button disabled={pending} onClick={() => start(async () => setState((await action(token)) ? "ok" : "bad"))}>{pending ? "Working…" : label}</Button>
      {state === "bad" && <p role="alert" className="mt-3 text-sm text-red-700">This link is not valid. Use the link from your latest email.</p>}
    </div>
  );
}
