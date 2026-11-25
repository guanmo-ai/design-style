// An act: an effect performed. The character winds up, lets go and recovers, a target takes the hit, and everything
// freezes for a moment on contact. Effects describe it as data (`export const act`), so a game with its own character
// can read the same timing. The freeze, the shake, the springy target and poses held on 12 fps steps are how Hollow Crown
// plays its skills (https://github.com/rehan-remade/hollow-crown), MIT License, Copyright (c) 2026 rehan-remade.

import { Rng, clamp } from "./math.js";
import { hex, mix } from "./color.js";
import { createFrame, clearFrame, createFx, painterFor } from "./fx.js";
import { stockActor, drawActor, actorAlphaOf, HERO2, DUMMY_PAL } from "./actor.js";
import { posed, STAND } from "./rig.js";

export { STAND, posed };

// ---- poses over time
const lerp = (a, b, u) => a + (b - a) * u;
/** Between two poses: numbers move, everything else changes at the later key. */
export function lerpPose(a, b, u) {
  const out = { ...STAND, ...a };
  const B = { ...STAND, ...b };
  for (const k of Object.keys(B)) {
    const v = B[k];
    if (typeof v === "number" && typeof out[k] === "number") out[k] = lerp(out[k], v, u);
    else if (out[k] === undefined && typeof v === "number") out[k] = v;
  }
  // what the later pose doesn't mention eases back to its default
  for (const k of ["hx", "hy", "lean", "crouch"]) if (B[k] === undefined && typeof out[k] === "number") out[k] = lerp(out[k], 0, u);
  if (B.wl === undefined && typeof out.wl === "number") out.wl = lerp(out.wl, 1, u);
  return out;
}
const eases = { out: (u) => 1 - (1 - u) * (1 - u), in: (u) => u * u, line: (u) => u };
/**
 * The pose at time t on a track of keys [t, pose, how]: `how` says how the pose arrives: smoothly by default, "out"
 * fast then settling, "in" slowly then fast, "snap" holding the last pose and jumping on the key. Limbs move in whole
 * 12 fps steps counted from each key, so they read as held drawings; the feet's position over the floor (x, y) stays smooth.
 */
export function poseAt(track, t) {
  if (t <= track[0][0]) return track[0][1];
  for (let i = 0; i < track.length - 1; i++) {
    const [t0, a] = track[i], [t1, b, how] = track[i + 1];
    if (t >= t1) continue;
    if (how === "snap") return a;
    const e = eases[how] ?? ((u) => u * u * (3 - 2 * u));
    const stepped = t0 + Math.floor((t - t0) * 12 + 1e-6) / 12;
    const out = lerpPose(a, b, e((stepped - t0) / (t1 - t0)));
    const u = e((t - t0) / (t1 - t0));
    out.x = lerp(a.x ?? 0, b.x ?? 0, u);
    out.y = lerp(a.y ?? 0, b.y ?? 0, u);
    return out;
  }
  return track[track.length - 1][1];
}

/** Is the body between keys that hardly differ, or past the last? */
function isHeld(track, t) {
  if (t >= track[track.length - 1][0] || t < track[0][0]) return true;
  for (let i = 0; i < track.length - 1; i++) {
    if (t >= track[i + 1][0]) continue;
    const a = { ...STAND, ...track[i][1] }, b = { ...STAND, ...track[i + 1][1] };
    return track[i + 1][0] - track[i][0] > 0.4 && ["fx", "fy", "bx", "by", "crouch", "lean", "x", "y"].every((k) => Math.abs((a[k] ?? 0) - (b[k] ?? 0)) < 1.5);
  }
  return true;
}

// ---- the target
const TW = 38, TH = 52;
const TP = Object.fromEntries(Object.entries({ ink: "#0b0a1a", wood: "#724c2e", woodL: "#a0703a", woodD: "#4e331f", straw: "#d2aa55", strawL: "#f0d98a", burlapD: "#86643a", burlap: "#b38b57", burlapL: "#c9a26c", red: "#9a2f3c", redL: "#c4434f", white: "#ffffff" }).map(([k, v]) => [k, hex(v)]));
const DUST = ["#efe7dc", "#c9bfb8", "#8f8693", "#5a5468"].map(hex);
const DUMMY = new Uint32Array(TW * TH);
(function buildDummy() {
  const px = (x, y, c) => { if (x >= 0 && y >= 0 && x < TW && y < TH) DUMMY[y * TW + x] = c; };
  const R = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };
  // the post and the crossbar
  R(15, 38, 8, 14, TP.ink); R(16, 34, 6, 18, TP.wood); R(16, 34, 2, 18, TP.woodL); R(20, 34, 2, 18, TP.woodD);
  R(1, 18, 36, 1, TP.ink); R(1, 23, 36, 1, TP.ink); R(1, 19, 36, 4, TP.wood); R(1, 19, 36, 1, TP.woodL); R(1, 22, 36, 1, TP.woodD);
  // straw bursting out of the ends of the arms
  for (const [bx, s] of [[0, -1], [33, 1]]) {
    R(bx, 17, 5, 8, TP.straw);
    for (const [dx, dy, c] of [[2, 16, TP.straw], [3, 15, TP.strawL], [1, 17, TP.strawL], [2, 25, TP.straw], [1, 26, TP.strawL], [3, 25, TP.burlapD], [2, 19, TP.strawL], [3, 21, TP.strawL], [1, 22, TP.burlapD], [2, 23, TP.strawL]]) px(bx + dx, dy, c);
    px(s < 0 ? bx - 1 : bx + 5, 19, TP.straw); px(s < 0 ? bx - 1 : bx + 5, 22, TP.strawL);
  }
  const sack = (x, y, w, h) => {
    R(x + 1, y, w - 2, 1, TP.ink); R(x + 1, y + h - 1, w - 2, 1, TP.ink);
    R(x, y + 1, 1, h - 2, TP.ink); R(x + w - 1, y + 1, 1, h - 2, TP.ink);
    R(x + 1, y + 1, w - 2, h - 2, TP.burlap);
    R(x + w - 4, y + 1, 3, h - 2, TP.burlapD);
    R(x + 1, y + h - 3, w - 2, 2, TP.burlapD);
    R(x + 1, y + 1, 1, h - 4, TP.burlapL); R(x + 1, y + 1, w - 6, 1, TP.burlapL);
    // the weave
    for (let j = y + 2; j < y + h - 2; j += 3) for (let i = x + 3 + (j % 2); i < x + w - 4; i += 4) px(i, j, TP.burlapD);
  };
  sack(9, 17, 20, 24);
  // the rings on its chest
  for (let y = 19; y < 36; y++) for (let x = 11; x < 27; x++) { const d = Math.hypot(x - 18.5, y - 27); if ((d > 4 && d < 5.4) || d < 1.9) px(x, y, x + y < 45 ? TP.redL : TP.red); }
  // the rope belt, and straw coming out under it
  for (let x = 10; x < 28; x++) { px(x, 36, x & 1 ? TP.woodL : TP.straw); px(x, 37, x & 1 ? TP.woodD : TP.wood); }
  for (const [x, y, c] of [[11, 41, TP.straw], [12, 42, TP.strawL], [14, 41, TP.strawL], [15, 42, TP.straw], [23, 41, TP.straw], [24, 42, TP.strawL], [26, 41, TP.straw], [13, 43, TP.straw], [25, 43, TP.straw]]) px(x, y, c);
  sack(10, 1, 18, 16);
  // X for eyes and a stitched mouth
  for (const ex of [14, 23]) for (let d = -2; d <= 2; d++) { px(ex + d, 7 + d, TP.ink); px(ex - d, 7 + d, TP.ink); }
  for (let x = 14; x < 24; x++) px(x, 12, x & 1 ? TP.ink : TP.burlapD);
  for (const x of [15, 18, 21]) { px(x, 11, TP.ink); px(x, 13, TP.ink); }
  // the rope at its neck, and straw for hair
  for (let x = 12; x < 26; x++) { px(x, 16, x & 1 ? TP.woodL : TP.straw); px(x, 17, x & 1 ? TP.wood : TP.woodD); }
  for (const [x, y, c] of [[13, 0, TP.straw], [15, 0, TP.strawL], [18, 0, TP.straw], [21, 0, TP.strawL], [24, 0, TP.straw], [9, 4, TP.straw], [28, 6, TP.straw], [8, 7, TP.strawL], [29, 3, TP.strawL]]) px(x, y, c);
})();
/** What a hit can leave on the target: [color, how much of it]. */
export const SKINS = { flash: [TP.white, 1], char: [hex("#1a0c0e"), 0.72], ice: [hex("#a8e8ff"), 0.72], shadow: [hex("#3a1a70"), 0.5], holy: [hex("#fff4c0"), 0.5], red: [hex("#ff2040"), 0.45], shock: [hex("#8fd6ff"), 0.6], poison: [hex("#58c43a"), 0.5] };
const STRAW = [TP.strawL, TP.straw, TP.straw, TP.burlapD, TP.burlapD];

/** A straw target on a spring: it sways, flashes, takes a skin, shivers and sheds straw. (x, y): the floor under it, local space. */
export class Target {
  constructor(x, seed = 5) {
    Object.assign(this, { x, theta: 0, omega: 0, flashT: 0, skin: null, skinFade: 0, shiver: 0, clock: 0, R: new Rng(seed), straw: [] });
  }
  hit({ push = 1.2, straw = 8, flash = 0.05, skin, shiver = 0, y = -26 } = {}) {
    this.omega += push;
    this.flashT = Math.max(this.flashT, flash);
    if (skin !== undefined) this.skin = skin;
    if (shiver) this.shiver = shiver;
    const R = this.R;
    for (let k = 0; k < straw; k++) {
      const back = R.next() < 0.3;
      this.straw.push({ x: this.x + R.range(-3, 3), y: y + R.range(-3, 3), vx: back ? R.range(-60, -5) : R.range(10, 130), vy: R.range(-120, -5), age: 0, life: R.range(1.2, 2.2), big: R.next() < 0.5 });
    }
  }
  step(dt) {
    this.clock += dt;
    this.omega += (-60 * this.theta - 3.4 * this.omega) * dt;
    this.theta = clamp(this.theta + this.omega * dt, -0.4, 0.42);
    if (this.flashT > 0) this.flashT -= dt;
    if (this.shiver > 0) this.shiver -= dt;
    for (const s of this.straw) {
      s.age += dt;
      s.vy += 210 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y >= 0) { s.y = 0; s.vx *= 0.2; s.vy = 0; }
    }
    this.straw = this.straw.filter((s) => s.age < s.life);
  }
  draw(C, W, H, X, Y, flip) {
    const tan = Math.tan(this.theta), sv = this.shiver > 0 ? (Math.floor(this.clock * 30) & 1 ? 1 : -1) : 0, name = this.flashT > 0 ? "flash" : this.skin, sk = name ? SKINS[name] : null;
    const base = X + (flip ? -this.x - 1 : this.x);
    for (let r = 0; r < TH; r++) {
      const o = Math.round((TH - 1 - r) * tan * 0.8) + sv;
      for (let x = 0; x < TW; x++) {
        const c = DUMMY[r * TW + x];
        if (!c) continue;
        const px = base + (flip ? -(x - 19 + o) - 1 : x - 19 + o), py = Y - TH + r;
        if (px >= 0 && py >= 0 && px < W && py < H) C[py * W + px] = sk ? mix(c, sk[0], sk[1]) : c;
      }
    }
  }
  drawStraw(C, W, H, X, Y, flip) {
    for (const s of this.straw) {
      const c = STRAW[Math.min(4, Math.floor((s.age / s.life) * 5))], lx = Math.round(s.x), ly = Math.round(s.y) - 1;
      for (let i = 0; i < (s.big ? 2 : 1); i++) {
        const px = X + (flip ? -(lx + i) - 1 : lx + i), py = Y + ly;
        if (px >= 0 && py >= 0 && px < W && py < H) C[py * W + px] = c;
      }
    }
  }
}

// ---- the act itself
const GHOST_LIFE = 0.16;
const REST_MASK = new Uint8Array(24 * 38), REST_PX = new Uint32Array(24 * 38);
HERO2.forEach((row, r) => [...row].forEach((ch, c) => {
  if (ch !== ".") {
    REST_MASK[r * 24 + c] = 1;
    REST_PX[r * 24 + c] = hex(DUMMY_PAL[ch]);
  }
}));

// every cell of the standing sprite, mapped to the nearest cell that's on the body
const NEAREST = new Int16Array(24 * 38).fill(-1);
for (let r = 0; r < 38; r++)
  for (let c = 0; c < 24; c++) {
    let best = -1, bd = 1e9;
    for (let y = Math.max(0, r - 7); y < Math.min(38, r + 8); y++)
      for (let x = Math.max(0, c - 7); x < Math.min(24, c + 8); x++) {
        const d = (x - c) * (x - c) + (y - r) * (y - r);
        if (REST_MASK[y * 24 + x] && d < bd) { bd = d; best = y * 24 + x; }
      }
    NEAREST[r * 24 + c] = best;
  }
const lum = (c) => (0.3 * (c & 255) + 0.59 * ((c >>> 8) & 255) + 0.11 * ((c >>> 16) & 255)) / 255;
// an effect's color over the standing body, moved onto a pixel of the pose: its color, at this pixel's own light and shade
function carry(v, rest, own) {
  const lv = lum(v);
  if (lv > 0.9 || v >>> 24 < 255) return v;
  const k = Math.max(0.45, Math.min(1.5, lum(own) / Math.max(0.08, lum(rest))));
  const ch = (n) => Math.min(255, Math.round(((v >>> n) & 255) * k));
  return (255 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** When an act's poses begin and end, in effect time (a loop ends when it's told to). */
export function actSpan(mod) {
  const a = mod.act, D = mod.meta?.duration ?? 1, k = a?.poses;
  return { from: Math.min(0, k?.[0]?.[0] ?? 0), to: mod.meta?.loop ? Infinity : Math.max(D, k?.[k.length - 1]?.[0] ?? 0) };
}

/**
 * An effect performed: { fx, t, update(dt), draw(frame, { body, target }), shake, done() }. t runs from the first pose
 * (before the effect's own t = 0) to the last. update() holds everything still during a freeze; draw() paints the effect, the
 * character and the target together. o: the effect's options, with x, y placing the feet. Without an act, it just plays.
 */
export function createAct(mod, o = {}) {
  const a = mod.act ?? {}, meta = mod.meta ?? {}, D = meta.duration ?? 1, flip = !!o.flip, seed = o.seed ?? meta.options?.seed ?? 1;
  const fx = createFx(mod, o), track = a.poses ?? [[0, { ...STAND }]], span = actSpan(mod);
  const X = o.x ?? 0, Y = o.y ?? 0;
  const targets = (a.targets ?? (a.target ? [a.target] : [])).map((g, i) => new Target(g.x ?? 66, seed + 4 + i));
  const hits = (a.hits ?? []).map((h) => ({ ...h })).sort((p, q) => p.t - q.t), dust = (a.dust ?? []).slice();
  const R = new Rng(seed + 9), specks = [];
  // after-images take the effect's own color unless the act names one
  const ramp = o.palette ?? meta.options?.palette, ghosts = [], gc = hex(a.ghost ?? ramp?.[Math.floor(ramp.length * 0.7)] ?? "#8fb4ff");
  let t = span.from, stop = 0, stopped = false, shakeT = 0, shake0 = 0, amp = 0, nh = 0, nd = 0, loopN = 0, gAcc = 0, last = null;
  const poseNow = () => {
    let tt = t;
    if (meta.loop && t >= D) tt = t % D;
    let q = poseAt(track, tt);
    // nothing is asked of him: he breathes
    if (!meta.loop && isHeld(track, tt)) {
      const up = Math.floor(tt * 3) & 1;
      q = { ...STAND, ...q, crouch: (q.crouch ?? 0) + up, fy: (q.fy ?? STAND.fy) + up, by: (q.by ?? STAND.by) + up };
    }
    last = q;
    return q;
  };
  let scratch = null;
  const scratchFor = (f) => {
    if (!scratch || scratch.a.w !== f.w || scratch.a.h !== f.h) scratch = { a: createFrame(f.w, f.h, f.ox, f.oy), b: createFrame(f.w, f.h, f.ox, f.oy) };
    return scratch;
  };
  const out = {
    fx, meta, act: a, targets,
    get t() { return t; },
    /** How far the whole picture is thrown right now, in px. */
    get shake() {
      if (shakeT <= 0) return [0, 0];
      const k = amp * (shakeT / shake0), f = Math.floor(shakeT * 60);
      return [Math.round(Math.sin(f * 2.4) * k), Math.round(Math.cos(f * 3.7) * k * 0.7)];
    },
    get frozen() { return stop > 0; },
    /** The pose he's in right now. */
    get pose() { return last; },
    update(dt) {
      if (shakeT > 0) shakeT -= dt;
      if (stop > 0) {
        stop -= dt;
        return;
      }
      const t0 = t;
      t += dt;
      if (t >= 0) fx.update(t0 < 0 ? t : dt);
      if (meta.loop && t >= D) {
        const n = Math.floor(t / D);
        if (n !== loopN) {
          loopN = n;
          nh = 0;
          nd = 0;
        }
      }
      const tt = meta.loop && t >= D ? t % D : t;
      for (; nh < hits.length && hits[nh].t <= tt; nh++) {
        const h = hits[nh];
        if (h.stop) stop = Math.max(stop, h.stop);
        if (h.shake) {
          shakeT = shake0 = h.shake;
          amp = h.amp ?? 2;
        }
        if (h.target !== false) targets.forEach((g, i) => (h.at === undefined || h.at === i) && g.hit(h));
        out.onHit?.(h);
      }
      for (; nd < dust.length && dust[nd].t <= tt; nd++) {
        const d = dust[nd], n = d.n ?? 6;
        for (let i = 0; i < n; i++) {
          const dir = d.dir ?? (R.next() < 0.5 ? -1 : 1);
          specks.push({ x: d.x + R.range(-3, 3), y: -1 - R.range(0, 2), vx: dir * R.range(22, 90), vy: R.range(-34, -6), age: 0, life: R.range(0.16, 0.4), big: R.next() < 0.45, c: d.c ? hex(d.c) : 0 });
        }
      }
      for (const k of specks) {
        k.age += dt;
        k.vx *= 1 - 5 * dt;
        k.vy += 110 * dt;
        k.x += k.vx * dt;
        k.y = Math.min(-1, k.y + k.vy * dt);
      }
      for (let i = specks.length - 1; i >= 0; i--) if (specks[i].age >= specks[i].life) specks.splice(i, 1);
      const q = poseNow();
      for (const g of targets) g.step(dt);
      // after-images while a key asks for them
      gAcc += dt;
      if (q.ghost && gAcc >= 1 / 30) {
        gAcc = 0;
        ghosts.push({ q, age: 0 });
        if (ghosts.length > 7) ghosts.shift();
      }
      for (const g of ghosts) g.age += dt;
      while (ghosts.length && ghosts[0].age > GHOST_LIFE) ghosts.shift();
    },
    /** Paint it. { body: false } leaves the character out, { target: false } the target. */
    draw(frame, { body = true, target: showTarget = true } = {}) {
      const W = frame.w, H = frame.h, q = last ?? poseNow(), active = t >= 0;
      const tgt = showTarget ? targets : [];
      const drawTargets = () => tgt.forEach((g) => g.draw(frame.color, W, H, FX, FY, flip));
      const drawStraw = () => tgt.forEach((g) => g.drawStraw(frame.color, W, H, FX, FY, flip));
      const drawDust = () => {
        for (const k of specks) {
          const c = k.c || DUST[Math.min(3, Math.floor((k.age / k.life) * 4))], lx = Math.round(k.x), py = FY + Math.round(k.y);
          for (let i = 0; i < (k.big ? 2 : 1); i++) {
            const px = flip ? FX - lx - i - 1 : FX + lx + i;
            if (px >= 0 && py >= 0 && px < W && py < H) frame.color[py * W + px] = c;
          }
        }
      };
      const FX = X - (frame.ox | 0), FY = Y - (frame.oy | 0);
      if (!body) {
        if (active) fx.draw(frame, "back");
        drawTargets();
        if (active) fx.draw(frame, "front");
        drawStraw();
        return;
      }
      const rx = Math.round(q.x ?? 0), ry = Math.round(q.y ?? 0), BX = FX + (flip ? -rx : rx), BY = FY + ry;
      const r = posed(q), mirror = flip;
      const paint = (i, color) => {
        const px = mirror ? BX - r.xs[i] - 1 : BX + r.xs[i], py = BY + r.ys[i];
        if (px < 0 || py < 0 || px >= W || py >= H) return;
        frame.color[py * W + px] = color;
        // he stays crisp in front of his own after-images
        if (ghosts.length) frame.light[py * W + px] = 0;
      };
      const drawGhosts = () => {
        for (const g of ghosts) {
          // after-images are light, not paint: they brighten what's behind them and leave nothing muddy
          const gr = posed(g.q), gx = FX + (flip ? -Math.round(g.q.x ?? 0) : Math.round(g.q.x ?? 0)), gy = FY + Math.round(g.q.y ?? 0), k = 0.5 * (1 - g.age / GHOST_LIFE);
          const gm = flip, r0 = (gc & 255) * k, g0 = ((gc >>> 8) & 255) * k, b0 = ((gc >>> 16) & 255) * k;
          for (let i = 0; i < gr.n; i++) {
            const px = gm ? gx - gr.xs[i] - 1 : gx + gr.xs[i], py = gy + gr.ys[i];
            if (px < 0 || py < 0 || px >= W || py >= H) continue;
            const j = py * W + px, d = frame.light[j];
            frame.light[j] = (255 << 24) | (Math.min(255, ((d >>> 16) & 255) + b0) << 16) | (Math.min(255, ((d >>> 8) & 255) + g0) << 8) | Math.min(255, (d & 255) + r0);
          }
        }
      };
      const shadow = () => {
        const sy = FY, cx = FX + (flip ? -rx : rx), hw = 10 + (Math.abs(q.ffx - q.fbx) >> 1) - Math.min(8, Math.abs(ry) >> 1);
        if (sy < 0 || sy >= H) return;
        for (let dy = 0; dy < 2; dy++)
          for (let x = -hw + dy * 2; x <= hw - dy * 2; x++) {
            const px = cx + x, i = (sy + dy) * W + px;
            if (px < 0 || px >= W || sy + dy >= H) continue;
            frame.color[i] = (frame.color[i] & 0xffffff) | (Math.max(frame.color[i] >>> 24, 110) << 24);
          }
      };
      if (!a.onBody) {
        // the effect doesn't care about the body: back, body, front
        if (active) fx.draw(frame, "back");
        drawTargets();
        shadow();
        drawGhosts();
        for (let i = 0; i < r.n; i++) paint(i, r.color[i]);
        if (active) fx.draw(frame, "front");
        drawStraw();
        drawDust();
        return;
      }
      // the effect paints the standing body: draw it there, then carry each body pixel to where the pose put it
      const { a: A, b: B } = scratchFor(frame);
      clearFrame(A);
      clearFrame(B);
      if (active) fx.draw(A, "back");
      B.color.set(A.color);
      B.light.set(A.light);
      const tt = meta.loop ? (t < 0 ? 0 : t % D) : clamp(t, 0, D), alpha = active ? actorAlphaOf(mod, tt, fx.options) : 1;
      drawActor(painterFor(B).place(FX, FY, flip), fx.options.actor ?? stockActor(2), alpha);
      if (active) fx.draw(B, "front");
      const follow = a.follow ?? 1, lean = (q.lean ?? 0) * follow, cr = (q.crouch ?? 0) * follow;
      // what's up on the body goes with it; what's on the floor stays on the floor
      const shiftOf = (ly) => {
        const k = clamp((-11 - ly) / 7, 0, 1), f = clamp((-1 - ly) / 6, 0, 1);
        return [Math.round(lean * k + rx * f), Math.round(cr * k + ry * f)];
      };
      const rest = (sx, sy) => {
        const c = (flip ? FX - sx - 1 : sx - FX) + 12, r0 = sy - FY + 38;
        return c >= 0 && r0 >= 0 && c < 24 && r0 < 38 && REST_MASK[r0 * 24 + c] === 1;
      };
      const C = frame.color, Ls = frame.light;
      const copy = (buf, sx, sy, s) => {
        const [dx, dy] = shiftOf(sy - FY), px = sx + (flip ? -dx : dx), py = sy + dy;
        if (px < 0 || py < 0 || px >= W || py >= H) return;
        const i = py * W + px;
        if (buf === Ls) {
          const d = Ls[i];
          Ls[i] = (255 << 24) | (Math.min(255, ((d >>> 16) & 255) + ((s >>> 16) & 255)) << 16) | (Math.min(255, ((d >>> 8) & 255) + ((s >>> 8) & 255)) << 8) | Math.min(255, (d & 255) + (s & 255));
        } else if (s >>> 24 === 255 || !C[i]) C[i] = s;
        else {
          const k = (s >>> 24) / 255, d = C[i];
          const ch = (n) => Math.round(((s >>> n) & 255) * k + ((d >>> n) & 255) * (1 - k));
          C[i] = (Math.max(s >>> 24, d >>> 24) << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0);
        }
      };
      drawTargets();
      shadow();
      for (let sy = 0; sy < H; sy++)
        for (let sx = 0; sx < W; sx++) {
          const c = A.color[sy * W + sx];
          if (c) copy(C, sx, sy, c);
        }
      drawGhosts();
      const restIndex = (s) => {
        const c = s % 24, r0 = (s / 24) | 0, sx = flip ? FX - (c - 12) - 1 : FX + c - 12, sy = FY + r0 - 38;
        return sx >= 0 && sy >= 0 && sx < W && sy < H ? sy * W + sx : -1;
      };
      for (let i = 0; i < r.n; i++) {
        const s = r.src[i] >= 0 ? NEAREST[r.src[i]] : -1;
        if (s < 0) {
          if (alpha > 0.5) paint(i, r.color[i]);
          continue;
        }
        const j = restIndex(s), v = j >= 0 ? B.color[j] : REST_PX[s];
        if (!v) continue;
        // the effect left this bit of body alone, or changed it: carry the change, on top of this pixel's own shading
        paint(i, v === REST_PX[s] ? r.color[i] : carry(v, REST_PX[s], r.color[i]));
      }
      for (let sy = 0; sy < H; sy++)
        for (let sx = 0; sx < W; sx++) {
          const j = sy * W + sx;
          if (B.color[j] && B.color[j] !== A.color[j] && !rest(sx, sy)) copy(C, sx, sy, B.color[j]);
          if (B.light[j] & 0xffffff) copy(Ls, sx, sy, B.light[j]);
        }
      drawStraw();
      drawDust();
    },
    /** Let a loop end: it fades out and done() goes true. */
    stop() {
      fx.stop();
      stopped = true;
    },
    /** One-shots end when the last pose is over. */
    done() {
      return stopped ? fx.done() : t >= span.to && stop <= 0;
    },
  };
  poseNow();
  return out;
}

/**
 * An act as plain data, for a game with its own character: how long the wind-up and recovery are, when to freeze and shake,
 * what a target should do, and the poses themselves. Times are in the effect's own seconds: start the effect at 0.
 */
export function actTiming(mod) {
  const a = mod.act;
  if (!a) return null;
  const { from, to } = actSpan(mod), D = mod.meta?.duration ?? 1;
  return {
    windup: -from,
    recovery: mod.meta?.loop ? 0 : Math.max(0, to - D),
    onBody: !!a.onBody,
    targets: (a.targets ?? (a.target ? [a.target] : [])).map((g) => g.x ?? 66),
    hits: (a.hits ?? []).map((h) => ({ t: h.t, freeze: h.stop ?? 0, shake: h.shake ?? 0, amp: h.amp ?? 0, push: h.target === false ? 0 : h.push ?? 1.2, skin: h.skin, at: h.at })),
    poses: (a.poses ?? []).map(([t, pose, how]) => ({ t, how: how ?? "smooth", pose })),
  };
}

/** The box an act needs in local space, so nothing gets cut off: { x0, y0, x1, y1 }, sampled over its poses. */
export function actBounds(mod) {
  const a = mod.act, [w, h] = mod.meta.size, [ox, oy] = mod.meta.origin;
  let x0 = -ox, y0 = -oy, x1 = w - ox, y1 = h - oy;
  const see = (p) => {
    const r = posed(p), X = Math.round(p.x ?? 0), Y = Math.round(p.y ?? 0), a = r.x0, b = r.x1;
    x0 = Math.min(x0, a + X - 1); x1 = Math.max(x1, b + X + 1); y0 = Math.min(y0, r.y0 + Y - 1); y1 = Math.max(y1, r.y1 + Y + 1);
  };
  const k = a?.poses;
  if (k) {
    for (let t = k[0][0]; t <= k[k.length - 1][0]; t += 1 / 12) see(poseAt(k, t));
    for (const key of k) see(key[1]);
  } else see(STAND);
  for (const g of a?.targets ?? (a?.target ? [a.target] : [])) {
    const tx = g.x ?? 66;
    x0 = Math.min(x0, tx - 30); x1 = Math.max(x1, tx + 36); y0 = Math.min(y0, -56);
  }
  return { x0, y0, x1, y1 };
}
