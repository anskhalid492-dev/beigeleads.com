"use client";
import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; ok: boolean; text: string };
const Ctx = createContext<(ok: boolean, text: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

/** Small toast stack. Shown only after the server confirmed (or refused) a change. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((ok: boolean, text: string) => {
    const id = Date.now() + Math.random();
    setItems((t) => [...t, { id, ok, text }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} role="status" className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${t.ok ? "border-forest-500 bg-forest-100 text-forest-900" : "border-red-300 bg-red-50 text-red-800"}`}>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
