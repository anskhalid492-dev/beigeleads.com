"use client";
// BeigePilot launcher: Pilo lives behind the bottom edge of the page and peeks out. Only this small shell ships with every page;
// the chat panel is fetched the first time it is opened.
// Poses: away (hidden) -> rest (peeking) -> up (hover) / duck (hides) -> leap (clicked, jumps into the panel) -> return (panel closed).
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pilo, type Mood } from "./pilo";
import { useGaze } from "./use-gaze";
import type { Cfg } from "./panel";

const Panel = dynamic(() => import("./panel").then((m) => m.BeigePilotPanel), { ssr: false });
type Pose = "away" | "rest" | "up" | "duck" | "leap" | "return";

// Occasional little moments, picked at random every 9-18 seconds while the visitor is not interacting.
const MOMENTS: { mood: Mood; ms: number; pose?: Pose }[] = [
  { mood: "wink", ms: 1500 }, { mood: "silly", ms: 1700 }, { mood: "curious", ms: 1700 }, { mood: "dance", ms: 2600, pose: "up" },
  { mood: "sleepy", ms: 3400 }, { mood: "surprised", ms: 1100, pose: "up" }, { mood: "giggle", ms: 1700 }, { mood: "idle", ms: 2600, pose: "duck" },
];

export function BeigePilot() {
  const path = usePathname();
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pose, setPose] = useState<Pose>("away");
  const [mood, setMood] = useState<Mood>("idle");
  const [hidden, setHidden] = useState(false);
  const hot = useRef(false); // hovering, focused or panel open: the idle scheduler stays quiet
  const rig = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const enabled = !!cfg?.enabled && !path.startsWith("/admin") && !path.startsWith("/checkout");

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      fetch("/api/beigepilot/config").then((r) => r.json() as Promise<Cfg>).then((c) => { if (live) setCfg(c); }).catch(() => {});
    }, 1800);
    return () => { live = false; clearTimeout(t); };
  }, []);

  // First appearance: slides up from behind the edge and waves once.
  useEffect(() => {
    if (!enabled) return;
    const a = setTimeout(() => { setPose("return"); setMood("wave"); }, 700);
    const b = setTimeout(() => { setPose((p) => (p === "return" ? "rest" : p)); setMood((m) => (m === "wave" ? "idle" : m)); }, 2300);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [enabled]);

  // Idle behaviours. No constant motion: long pauses, one small moment at a time.
  useEffect(() => {
    if (!enabled || open) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t: ReturnType<typeof setTimeout>;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const next = () => {
      t = setTimeout(() => {
        if (hot.current || document.hidden) return next();
        const m = MOMENTS[Math.floor(Math.random() * MOMENTS.length)];
        if (m.pose === "duck") {
          setPose("duck");
          timers.push(setTimeout(() => { if (!hot.current) { setPose("up"); setMood("curious"); } }, 1500));
          timers.push(setTimeout(() => { if (!hot.current) { setPose("rest"); setMood("idle"); } }, 3400));
        } else {
          if (m.pose) setPose(m.pose);
          setMood(m.mood);
          timers.push(setTimeout(() => { if (!hot.current) { setPose("rest"); setMood("idle"); } }, m.ms));
        }
        next();
      }, 9000 + Math.random() * 9000);
    };
    next();
    return () => { clearTimeout(t); timers.forEach(clearTimeout); };
  }, [enabled, open]);

  useGaze(rig, enabled && !open && !hidden, 420);

  const enter = useCallback((e: React.PointerEvent | React.FocusEvent) => {
    if ("pointerType" in e && e.pointerType !== "mouse") return;
    hot.current = true; setPose("up"); setMood("wave");
  }, []);
  const leave = useCallback(() => { hot.current = false; setPose("rest"); setMood("idle"); }, []);

  if (!enabled) return null;
  const name = cfg?.name || "Pilo";
  const onCart = path.startsWith("/cart");
  const side = cfg?.launcher === "left" ? "left-3" : "right-3";

  const openIt = () => {
    hot.current = true; setMounted(true); setOpen(true);
    setMood("excited"); setPose("leap");
    setTimeout(() => setHidden(true), 560);
  };
  const closed = () => {
    setOpen(false); setHidden(false); setPose("return"); setMood("wave");
    setTimeout(() => { hot.current = false; setPose("rest"); setMood("idle"); btn.current?.focus(); }, 950);
  };

  return (
    <>
      {mounted && cfg && <Panel cfg={cfg} path={path} open={open} onClosed={closed} />}
      {!hidden && (
        <button ref={btn} type="button" data-pose={pose} onClick={openIt} aria-label={`Open ${name}, the BeigeLeads assistant`}
          onPointerEnter={enter} onPointerLeave={leave} onFocus={enter} onBlur={leave}
          className={`pl-dock ${side} ${onCart ? "bottom-[4.75rem] lg:bottom-0" : "bottom-0"}`}>
          <div ref={rig} className="pl-rig">
            <Pilo peek mood={mood} size={104} intensity={cfg?.motion} />
          </div>
        </button>
      )}
    </>
  );
}
