"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, null);
  const field = "mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2.5 text-forest-900";
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-sand-200 bg-white p-6">
      <label className="block text-sm font-semibold">Password
        <input name="password" type="password" required autoComplete="current-password" className={field} />
      </label>
      <label className="block text-sm font-semibold">Authenticator code
        <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoComplete="one-time-code" className={`${field} tracking-widest`} />
      </label>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
      {state && <p role="alert" className="text-sm font-semibold text-red-700">{state.message}</p>}
    </form>
  );
}
