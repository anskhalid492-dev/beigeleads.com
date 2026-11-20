"use client";
// BeigePilot launcher. Only this small shell ships with every page; the chat panel is fetched the first time it is opened.
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Pilo } from "./pilo";
import type { Cfg } from "./panel";

const Panel = dynamic(() => import("./panel").then((m) => m.BeigePilotPanel), { ssr: false });
const TIP = "bp-tip-v1";

export function BeigePilot() {
  const path = usePathname();
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tip, setTip] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      fetch("/api/beigepilot/config").then((r) => r.json() as Promise<Cfg>).then((c) => { if (live) setCfg(c); }).catch(() => {});
    }, 1800);
    return () => { live = false; clearTimeout(t); };
  }, []);

  // A short welcome tooltip, once per browser session.
  useEffect(() => {
    if (!cfg?.enabled) return;
    let seen = false; try { seen = !!sessionStorage.getItem(TIP); } catch { /* ignore */ }
    if (seen) return;
    const a = setTimeout(() => { setTip(true); try { sessionStorage.setItem(TIP, "1"); } catch { /* ignore */ } }, 4500);
    const b = setTimeout(() => setTip(false), 12500);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [cfg?.enabled]);

  if (!cfg?.enabled || path.startsWith("/admin") || path.startsWith("/checkout")) return null;
  const name = cfg.name || "Pilo";
  const onCart = path.startsWith("/cart");
  const side = cfg.launcher === "left" ? "left-4" : "right-4";
  const openIt = () => { setMounted(true); setOpen(true); setTip(false); };

  return (
    <>
      {mounted && <Panel cfg={cfg} path={path} open={open} onClosed={() => { setOpen(false); setTimeout(() => launcher.current?.focus(), 0); }} />}
      {!open && (
        <div className={`fixed z-40 ${side} ${onCart ? "bottom-24 lg:bottom-5" : "bottom-5"}`}>
          {tip && (
            <div role="status" className={`bp-tip pointer-events-none absolute bottom-[4.1rem] w-52 rounded-2xl border border-sand-300 bg-white px-3 py-2 text-xs font-semibold leading-snug text-forest-900 shadow-lg ${cfg.launcher === "left" ? "left-0 rounded-bl-md" : "right-0 rounded-br-md"}`}>
              Hiii! I&apos;m {name}. Who are we finding today?
            </div>
          )}
          <button ref={launcher} type="button" onClick={openIt} aria-label={`Open ${name}, the BeigeLeads assistant`}
            className="pilo-host group relative grid size-[3.6rem] place-items-center rounded-full border border-sand-300 bg-sand-50 shadow-[0_8px_22px_-10px_rgba(15,42,29,.5)] transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            <Pilo mood="idle" size={46} intensity={cfg.motion} />
          </button>
        </div>
      )}
    </>
  );
}
