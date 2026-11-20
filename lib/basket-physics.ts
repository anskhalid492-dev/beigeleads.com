// Tiny 2D rigid-body physics for the /lists hero basket (no dependency, pure and testable).
// Each card is a capsule (two circles joined by a bar). Static walls are segments with a radius.
// Fixed time step, impulse-based contacts with restitution and friction, light positional correction.

export type Seg = { ax: number; ay: number; bx: number; by: number; r: number };
export type Body = { x: number; y: number; a: number; vx: number; vy: number; w: number; hw: number; hh: number; invM: number; invI: number; ready: boolean };

export const GRAVITY = 1500; // px/s^2
export const STEP = 1 / 120;
const RESTITUTION = 0.36;
const FRICTION = 0.35;
const BOUNCE_MIN = 90; // slower impacts do not bounce, so a pile settles instead of jittering

export function makeBody(hw: number, hh: number): Body {
  const m = 1;
  const I = (m * ((2 * hw) ** 2 + (2 * hh) ** 2)) / 12;
  return { x: 0, y: 0, a: 0, vx: 0, vy: 0, w: 0, hw, hh, invM: 1 / m, invI: 1 / I, ready: false };
}

/** Collision discs along the card's bar, close enough together that two cards can never pass through each other. */
const circles = (b: Body): [number, number][] => {
  const d = Math.max(0, b.hw - b.hh);
  const n = Math.max(2, Math.ceil((2 * d) / (b.hh * 1.1)) + 1);
  const c = Math.cos(b.a), s = Math.sin(b.a);
  return Array.from({ length: n }, (_, i) => { const o = -d + (2 * d * i) / (n - 1); return [b.x + c * o, b.y + s * o] as [number, number]; });
};

function closest(px: number, py: number, s: Seg): [number, number] {
  const dx = s.bx - s.ax, dy = s.by - s.ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - s.ax) * dx + (py - s.ay) * dy) / len2));
  return [s.ax + dx * t, s.ay + dy * t];
}

/** Applies one contact impulse. `other` is null for static geometry. Returns the closing speed (0 when separating). */
function resolve(b: Body, o: Body | null, cx: number, cy: number, nx: number, ny: number, pen: number): number {
  const rax = cx - b.x, ray = cy - b.y;
  const rbx = o ? cx - o.x : 0, rby = o ? cy - o.y : 0;
  const vax = b.vx - b.w * ray, vay = b.vy + b.w * rax;
  const vbx = o ? o.vx - o.w * rby : 0, vby = o ? o.vy + o.w * rbx : 0;
  const rvx = vax - vbx, rvy = vay - vby;
  const vn = rvx * nx + rvy * ny;
  // positional correction first, so overlaps never persist
  const slop = 0.4;
  const corr = Math.max(pen - slop, 0) * 0.8;
  if (o) { b.x += nx * corr * 0.5; b.y += ny * corr * 0.5; o.x -= nx * corr * 0.5; o.y -= ny * corr * 0.5; } else { b.x += nx * corr; b.y += ny * corr; }
  if (vn >= 0) return 0;
  const e = -vn > BOUNCE_MIN ? RESTITUTION : 0;
  const raN = rax * ny - ray * nx, rbN = rbx * ny - rby * nx;
  const denom = b.invM + (o ? o.invM : 0) + raN * raN * b.invI + (o ? rbN * rbN * o.invI : 0);
  const j = (-(1 + e) * vn) / denom;
  b.vx += j * nx * b.invM; b.vy += j * ny * b.invM; b.w += (rax * ny - ray * nx) * j * b.invI;
  if (o) { o.vx -= j * nx * o.invM; o.vy -= j * ny * o.invM; o.w -= (rbx * ny - rby * nx) * j * o.invI; }
  // friction along the tangent
  const tx = -ny, ty = nx;
  const rtx = (b.vx - b.w * ray) - (o ? o.vx - o.w * rby : 0), rty = (b.vy + b.w * rax) - (o ? o.vy + o.w * rbx : 0);
  const vt = rtx * tx + rty * ty;
  const raT = rax * ty - ray * tx, rbT = rbx * ty - rby * tx;
  const denT = b.invM + (o ? o.invM : 0) + raT * raT * b.invI + (o ? rbT * rbT * o.invI : 0);
  let jt = -vt / denT;
  const max = FRICTION * j;
  jt = Math.max(-max, Math.min(max, jt));
  b.vx += jt * tx * b.invM; b.vy += jt * ty * b.invM; b.w += (rax * ty - ray * tx) * jt * b.invI;
  if (o) { o.vx -= jt * tx * o.invM; o.vy -= jt * ty * o.invM; o.w -= (rbx * ty - rby * tx) * jt * o.invI; }
  return -vn;
}

/** Advance the world by one fixed step. `onImpact` gets the closing speed of hits against static geometry. */
export function step(bodies: Body[], segs: Seg[], onImpact?: (speed: number) => void) {
  const dt = STEP;
  for (const b of bodies) {
    if (!b.ready) continue;
    b.vy += GRAVITY * dt;
    b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.w * dt;
    b.w -= (b.a - 2 * Math.PI * Math.round(b.a / (2 * Math.PI))) * 70 * dt; // a soft spring toward lying flat, so labels stay readable in the pile
    b.vx *= 0.9996; b.vy *= 0.9996; b.w *= 0.999;
    if (Math.hypot(b.vx, b.vy) < 25 && Math.abs(b.w) < 0.8) b.w *= 0.93; // let a resting card lie still
  }
  for (let pass = 0; pass < 4; pass++) {
    for (const b of bodies) {
      if (!b.ready) continue;
      for (const [px, py] of circles(b)) {
        for (const s of segs) {
          const [qx, qy] = closest(px, py, s);
          let dx = px - qx, dy = py - qy;
          const dist = Math.hypot(dx, dy);
          const reach = b.hh + s.r;
          if (dist >= reach) continue;
          if (dist < 1e-6) { dx = 0; dy = -1; } else { dx /= dist; dy /= dist; }
          const speed = resolve(b, null, qx + dx * s.r, qy + dy * s.r, dx, dy, reach - dist);
          if (speed > 0 && pass === 0 && onImpact) onImpact(speed);
        }
      }
    }
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      if (!a.ready) continue;
      for (let k = i + 1; k < bodies.length; k++) {
        const b = bodies[k];
        if (!b.ready) continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) > a.hw + b.hw + 4) continue;
        for (const [ax, ay] of circles(a)) for (const [bx, by] of circles(b)) {
          let dx = ax - bx, dy = ay - by;
          const dist = Math.hypot(dx, dy);
          const reach = a.hh + b.hh;
          if (dist >= reach) continue;
          if (dist < 1e-6) { dx = 0; dy = -1; } else { dx /= dist; dy /= dist; }
          resolve(a, b, bx + dx * b.hh, by + dy * b.hh, dx, dy, reach - dist);
        }
      }
    }
  }
}

export type Basket = { x: number; top: number; w: number; h: number; wBottom: number; wall: number; base: number };

/** Static collision geometry of the basket: two inner walls, a floor, two rim caps and a backboard on the right. */
export function basketSegs(k: Basket): { segs: Seg[]; boardX: number; boardTop: number } {
  const inset = (k.w - k.wBottom) / 2;
  const lt = { x: k.x + k.wall, y: k.top }, rt = { x: k.x + k.w - k.wall, y: k.top };
  const lb = { x: k.x + inset + k.wall, y: k.top + k.h - k.base }, rb = { x: k.x + k.w - inset - k.wall, y: k.top + k.h - k.base };
  const boardX = k.x + k.w + 9, boardTop = k.top - 96;
  return {
    boardX, boardTop,
    segs: [
      { ax: lt.x, ay: lt.y, bx: lb.x, by: lb.y, r: 3 },
      { ax: rt.x, ay: rt.y, bx: rb.x, by: rb.y, r: 3 },
      { ax: lb.x, ay: lb.y, bx: rb.x, by: rb.y, r: 3 },
      { ax: lt.x - 2, ay: lt.y, bx: lt.x - 2, by: lt.y, r: 6 },
      { ax: rt.x + 2, ay: rt.y, bx: rt.x + 2, by: rt.y, r: 6 },
      { ax: boardX + 5, ay: boardTop, bx: boardX + 5, by: k.top + 6, r: 5 },
    ],
  };
}

/** Run the world without rendering to get a settled pile (used for reduced motion and tests). */
export function settle(bodies: Body[], segs: Seg[], seconds = 6) {
  for (let i = 0; i < Math.round(seconds / STEP); i++) step(bodies, segs);
}
