import { describe, expect, it } from "vitest";
import { basketSegs, makeBody, step, STEP, type Basket } from "@/lib/basket-physics";

const K: Basket = { x: 98, top: 184, w: 262, h: 200, wBottom: 218, wall: 6, base: 10 };
const widths = [90, 100, 118, 104, 108, 80, 112, 84, 82, 146];

function run(seed: number) {
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const { segs } = basketSegs(K);
  const bodies = widths.map((w) => makeBody(w / 2, 13.5));
  let t = 0, n = 0, maxImpact = 0;
  for (let i = 0; i < 12 / STEP; i++) {
    t += STEP;
    while (n < bodies.length && t >= n * 0.65) {
      const b = bodies[n++];
      Object.assign(b, { ready: true, x: K.x + K.w * (0.25 + rnd() * 0.7), y: -30, a: (rnd() - 0.5) * 1, vx: -120 + rnd() * 180, vy: rnd() * 40, w: (rnd() - 0.5) * 4 });
    }
    step(bodies, segs, (v) => { maxImpact = Math.max(maxImpact, v); });
  }
  return { bodies, maxImpact };
}

describe("basket physics", () => {
  it("collects every card inside the basket and keeps them there", () => {
    for (const seed of [1, 2, 3, 4]) {
      const { bodies, maxImpact } = run(seed);
      expect(maxImpact).toBeGreaterThan(100); // cards really hit the basket
      for (const b of bodies) {
        expect(Number.isFinite(b.x + b.y + b.a)).toBe(true);
        expect(Math.cos(b.a)).toBeGreaterThan(0.3); // no card stands on its end or lies upside down
        expect(b.x).toBeGreaterThan(K.x);
        expect(b.x).toBeLessThan(K.x + K.w);
        expect(b.y).toBeLessThan(K.top + K.h);
        expect(b.y).toBeGreaterThan(K.top - 60); // may rest slightly above the rim, never fall out
        expect(Math.hypot(b.vx, b.vy)).toBeLessThan(60); // settled
      }
    }
  }, 30_000);
});
