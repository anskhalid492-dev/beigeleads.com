"use client";
// Makes Pilo look at the pointer. Writes two CSS variables (--lx, --ly in -1..1) straight onto the SVG,
// so moving the mouse never re-renders React. Touch pointers and reduced motion are ignored.
import { useEffect, type RefObject } from "react";

export function setGaze(el: Element | null, x: number, y: number) {
  const s = (el as HTMLElement | SVGElement | null)?.style;
  if (!s) return;
  s.setProperty("--lx", String(Math.max(-1, Math.min(1, x))));
  s.setProperty("--ly", String(Math.max(-1, Math.min(1, y))));
}

export function useGaze(ref: RefObject<Element | null>, enabled: boolean, range = 380) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let px = 0, py = 0;
    const apply = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      const cx = r.left + r.width / 2, cy = r.top + r.height * 0.5;
      setGaze(el, (px - cx) / range, (py - cy) / range);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      px = e.clientX; py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const leave = () => setGaze(el, 0, 0);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, enabled, range]);
}
