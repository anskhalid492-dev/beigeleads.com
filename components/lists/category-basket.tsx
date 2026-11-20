"use client";
import Link from "next/link";
import { BedDouble, Cpu, HardHat, HeartPulse, House, Landmark, Megaphone, ShoppingBag, Smile, UtensilsCrossed } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { basketSegs, makeBody, settle, step, STEP, type Basket, type Body } from "@/lib/basket-physics";
import type { BasketLabel } from "@/lib/hero-basket";

const ICONS = { smile: Smile, utensils: UtensilsCrossed, house: House, heart: HeartPulse, cpu: Cpu, bag: ShoppingBag, hardhat: HardHat, landmark: Landmark, bed: BedDouble, megaphone: Megaphone } as const;

type Layout = { W: number; H: number; compact: boolean; count: number; ch: number; basket: Basket; boardX: number; boardTop: number; segs: ReturnType<typeof basketSegs>["segs"] };

function layoutFor(W: number, H: number): Layout {
  const compact = H < 300;
  const k = compact ? { w: 206, h: 116, wb: 150, ch: 22, count: 6, mr: 26, mb: 12 } : { w: 262, h: 200, wb: 218, ch: 27, count: 10, mr: 34, mb: 18 };
  const x = compact && W < 460 ? Math.round((W - k.w) / 2) - 8 : W - k.mr - k.w;
  const basket: Basket = { x, top: H - k.mb - k.h, w: k.w, h: k.h, wBottom: k.wb, wall: 6, base: 10 };
  const { segs, boardX, boardTop } = basketSegs(basket);
  return { W, H, compact, count: k.count, ch: k.ch, basket, boardX, boardTop, segs };
}

/** Physics category basket for the /lists hero: labels drop, bounce off the rim and backboard, collide and settle. Only labels with a real page are links. */
export function CategoryBasket({ labels }: { labels: BasketLabel[] }) {
  const root = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLElement | null)[]>([]);
  const [lay, setLay] = useState<Layout | null>(null);

  useLayoutEffect(() => {
    const el = root.current; if (!el) return;
    const read = () => { const r = el.getBoundingClientRect(); if (r.width > 40 && r.height > 40) setLay((p) => (p && Math.abs(p.W - r.width) < 2 && Math.abs(p.H - r.height) < 2 ? p : layoutFor(Math.round(r.width), Math.round(r.height)))); };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || !lay) return;
    const items = labels.slice(0, lay.count);
    labels.forEach((_, i) => { const n = els.current[i]; if (n) n.style.display = i < lay.count ? "" : "none"; });
    const bodies: Body[] = items.map((_, i) => { const w = els.current[i]?.offsetWidth ?? 100; return makeBody(w / 2, lay.ch / 2); });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { basket } = lay;
    const draw = (i: number) => {
      const n = els.current[i], b = bodies[i]; if (!n) return;
      n.style.transform = `translate3d(${(b.x - b.hw).toFixed(1)}px,${(b.y - b.hh).toFixed(1)}px,0) rotate(${b.a.toFixed(3)}rad)`;
    };
    const show = (i: number, on: boolean) => { const n = els.current[i]; if (n) { n.style.visibility = on ? "visible" : "hidden"; n.style.opacity = on ? "1" : "0"; } };
    const place = (b: Body, rnd: () => number) => Object.assign(b, { ready: true, x: basket.x + basket.w * (0.28 + rnd() * 0.62), y: -b.hh - 6, a: (rnd() - 0.5) * 1, vx: -120 + rnd() * 170, vy: rnd() * 40, w: (rnd() - 0.5) * 4 });

    if (reduced) {
      // No motion: the same physics runs once, off screen, and the settled pile is shown still.
      let s = 7; const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
      const done: Body[] = [];
      bodies.forEach((b, i) => { place(b, rnd); done.push(b); if (i % 3 === 2) settle(done, lay.segs, 1.2); });
      settle(done, lay.segs, 5);
      bodies.forEach((_, i) => { draw(i); show(i, true); });
      return;
    }

    let raf = 0, last = 0, acc = 0, t = 0, spawned = 0, phase: "run" | "fade" | "gap" = "run", phaseT = 0, kick = 0, hovering = 0, inView = true;
    let s = Math.floor(Math.random() * 1e9) + 1; const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
    const interval = 0.62, hold = 3.4;
    const reset = () => { bodies.forEach((b, i) => { Object.assign(b, { ready: false, vx: 0, vy: 0, w: 0 }); show(i, false); }); spawned = 0; t = 0; };
    reset();
    const onImpact = (v: number) => { kick = Math.min(1, Math.max(kick, v / 520)); };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!inView || document.hidden || hovering > 0) return; // paused: off screen, hidden tab, or a card is being pointed at
      acc += dt; phaseT += dt;
      if (phase === "run") {
        t += dt;
        while (spawned < bodies.length && t >= spawned * interval) { const i = spawned++; place(bodies[i], rnd); const n = els.current[i]; if (n) n.style.transition = "none"; show(i, true); }
        if (spawned === bodies.length && t > (bodies.length - 1) * interval + hold) { phase = "fade"; phaseT = 0; bodies.forEach((_, i) => { const n = els.current[i]; if (n) { n.style.transition = "opacity .5s ease"; n.style.opacity = "0"; } }); }
      } else if (phase === "fade") {
        if (phaseT > 0.6) { reset(); phase = "gap"; phaseT = 0; }
      } else if (phaseT > 0.4) { phase = "run"; phaseT = 0; }
      while (acc >= STEP) { step(bodies, lay.segs, onImpact); acc -= STEP; }
      for (const [i, b] of bodies.entries()) {
        if (!b.ready) continue;
        if (b.y > lay.H + 40 || b.x < -40 || b.x > lay.W + 40) Object.assign(b, { x: basket.x + basket.w * 0.5, y: -20, vx: 0, vy: 0 }); // safety: never lose a card
        draw(i);
      }
      kick *= 0.9;
      el.style.setProperty("--kick", kick.toFixed(3));
    };
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; last = performance.now(); }, { threshold: 0.05 });
    io.observe(el);
    const enter = () => { hovering++; }, leave = () => { hovering = Math.max(0, hovering - 1); last = performance.now(); };
    const nodes = els.current.slice(0, items.length);
    nodes.forEach((n) => { n?.addEventListener("pointerenter", enter); n?.addEventListener("pointerleave", leave); n?.addEventListener("focusin", enter); n?.addEventListener("focusout", leave); });
    last = performance.now(); raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); nodes.forEach((n) => { n?.removeEventListener("pointerenter", enter); n?.removeEventListener("pointerleave", leave); n?.removeEventListener("focusin", enter); n?.removeEventListener("focusout", leave); }); };
  }, [lay, labels]);

  const b = lay?.basket;
  const inset = b ? (b.w - b.wBottom) / 2 : 0;
  const trap = b ? `M${b.x},${b.top} L${b.x + b.w},${b.top} L${b.x + b.w - inset},${b.top + b.h} L${b.x + inset},${b.top + b.h} Z` : "";
  const layerCls = "pointer-events-none absolute inset-0 h-full w-full origin-bottom [transform:translateY(calc(var(--kick,0)*3px))_scaleY(calc(1-var(--kick,0)*0.012))]";

  return (
    <div ref={root} role="group" aria-label="Browse industries" style={{ "--kick": 0 } as React.CSSProperties} className="relative h-52 w-full overflow-hidden xl:absolute xl:inset-y-0 xl:right-0 xl:h-auto xl:w-[24rem]">
      {lay && b && (
        <>
          <svg className={`${layerCls} z-0`} viewBox={`0 0 ${lay.W} ${lay.H}`} aria-hidden>
            <defs><linearGradient id="bk-in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0F2A1D" /><stop offset="1" stopColor="#1B4332" /></linearGradient></defs>
            <ellipse cx={b.x + b.w / 2} cy={b.top + b.h + 2} rx={b.w * 0.42} ry="6" fill="#0F2A1D" opacity=".14" />
            {/* backboard and arm */}
            <rect x={lay.boardX} y={lay.boardTop} width="10" height={b.top + 8 - lay.boardTop} rx="3" fill="#F4EEDF" stroke="#D8C9A3" />
            <rect x={lay.boardX + 2.5} y={lay.boardTop + 8} width="5" height="26" rx="2" fill="#EDE4FD" />
            <path d={`M${b.x + b.w - 8},${b.top + 2} H${lay.boardX + 4}`} stroke="#1B4332" strokeWidth="4" strokeLinecap="round" />
            <path d={trap} fill="url(#bk-in)" stroke="#0F2A1D" strokeWidth="6" strokeLinejoin="round" />
          </svg>
          {labels.map((l, i) => {
            const Icon = ICONS[l.icon];
            const cls = `absolute left-0 top-0 z-10 flex w-max items-center rounded-lg bg-transparent p-0 [visibility:hidden] ${l.href ? "" : "cursor-default"}`;
            const inner = (
              <span className={`group/c flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-sand-300 bg-white font-bold text-forest-900 shadow-[0_6px_14px_-8px_rgba(15,42,29,.6)] transition duration-150 hover:-translate-y-px hover:border-purple-600 hover:bg-purple-100 hover:shadow-[0_10px_18px_-8px_rgba(124,58,237,.55)] group-focus-visible:border-purple-600 group-focus-visible:ring-2 group-focus-visible:ring-purple-600 ${lay.compact ? "h-[22px] px-2 text-[10.5px]" : "h-[27px] px-2.5 text-[11.5px]"}`}>
                <Icon className={`shrink-0 text-forest-500 ${lay.compact ? "size-3" : "size-3.5"}`} aria-hidden />{l.name}
              </span>
            );
            return l.href
              ? <Link key={l.name} href={l.href} ref={(n) => { els.current[i] = n; }} className={`${cls} group outline-none`}>{inner}</Link>
              : <span key={l.name} ref={(n) => { els.current[i] = n; }} className={cls}>{inner}</span>;
          })}
          <svg className={`${layerCls} z-20`} viewBox={`0 0 ${lay.W} ${lay.H}`} aria-hidden>
            <defs><pattern id="bk-mesh" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H14M0 0V14" stroke="#D8C9A3" strokeWidth="1" opacity=".28" /></pattern></defs>
            <path d={trap} fill="url(#bk-mesh)" />
            <path d={`M${b.x + inset * 0.15},${b.top + b.h - b.base} L${b.x + b.w - inset * 0.15},${b.top + b.h - b.base} L${b.x + b.w - inset},${b.top + b.h} L${b.x + inset},${b.top + b.h} Z`} fill="#0F2A1D" />
            <path d={trap} fill="none" stroke="#0F2A1D" strokeWidth="6" strokeLinejoin="round" />
            <rect x={b.x - 4} y={b.top - 4} width={b.w + 8} height="8" rx="4" fill="#FBF8F1" stroke="#0F2A1D" strokeWidth="2" />
            <rect x={b.x + 6} y={b.top - 1} width={b.w - 12} height="2" rx="1" fill="#7C3AED" />
          </svg>
        </>
      )}
    </div>
  );
}
