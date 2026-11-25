// 像素风 · 5 秒动效小样
//
// 320 × 180 的整数像素网格，最近邻放大 6 倍到 1920 × 1080。
// 夜里下雨，闪电劈中屋顶的灯泡招牌，电流沿着字一格一格把灯泡点亮，积水里倒映出来。
//
// 三条规矩，全片都围着它们转：
//   1. 落格：所有东西落在整数格上。形（招牌点亮、云、窗）按 12 fps 走阶梯，光和粒子按 30 fps 走满帧。
//   2. 卡帧：撞击时整个世界停 4 帧（0.13 秒），第一帧是黑白反相的英雄帧，然后按整像素震。
//   3. 色阶：颜色只在色板里跳，不做渐变。灯泡白热 → 粉 → 霓虹，一阶一阶冷下来；亮度交给叠加光层。
//
// 绘制层和粒子来自 pixelfx（MIT，见 vendor/pixelfx/LICENSE 与 NOTICE.md）：
// color 缓冲只放不透明像素，light 缓冲叠加发光，最后 composite 合成。
//
// 用法：node film.mjs <输出目录>
//   写出 frames.rgba（150 帧 × 320 × 180 × 4 字节）和 cues.json（给配乐用的时间点）。
//   STILL=帧号 只渲到那一帧为止（模拟需要从头跑）。

import { writeFileSync, readFileSync, mkdirSync, openSync, writeSync, closeSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createFrame, clearFrame, composite, painterFor, Particles, Lights, P,
  hex, mix, scale, rgb, red, green, blue, clamp, ease, rand, fbm, Rng, bolt, forks,
} from "./vendor/pixelfx/core/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] ?? join(HERE, "out");
mkdirSync(OUT, { recursive: true });

const W = 320, H = 180, FPS = 30, N = 150;
const GLYPHS = JSON.parse(readFileSync(join(HERE, "glyphs.json"), "utf8"));

// ---------------------------------------------------------------- 色板（24 色）
const C = {
  ink: hex("#07060f"),
  sky: ["#07060f", "#0e0c1e", "#171431", "#221d47", "#2f285e"].map(hex),
  cloud: ["#171431", "#221d47", "#2f285e", "#3b3470"].map(hex),
  rain: ["#3b3470", "#4a4f8a", "#7b86c8"].map(hex),
  neon: ["#ffffff", "#ffe6fb", "#ff9cf0", "#ff4fd8", "#c0249e", "#5e1050"].map(hex),
  cyan: ["#ffffff", "#bff4ff", "#5fd3ff", "#1f7fa8"].map(hex),
  warm: ["#ffd98a", "#ffb04a", "#8a5a2a"].map(hex),
  bolt: ["#ffffff", "#cfe8ff", "#7fb0ff", "#3b5fb0"].map(hex),
};
const PALETTE = [...new Set([C.ink, ...C.sky, ...C.cloud, ...C.rain, ...C.neon, ...C.cyan, ...C.warm, ...C.bolt])];
const FLASH_LIGHT = hex("#a8b8ff"), PINK_LIGHT = hex("#ff4fd8"), CYAN_LIGHT = hex("#5fd3ff");

// ---------------------------------------------------------------- 时间
// 真实时间 t = f / 30。世界时间 tw 在卡帧时停住：第 45 帧是英雄帧，46–49 帧停在同一刻。
const STRIKE_F = 45, FREEZE = 4;
const T_STRIKE = STRIKE_F / FPS;
const tw = (f) => (f <= STRIKE_F ? f / FPS : f <= STRIKE_F + FREEZE ? T_STRIKE : (f - FREEZE) / FPS);
const step12 = (t) => Math.floor(t * 12 + 1e-6) / 12; // 形按 12 fps 走
const HORIZON = 138; // 地面（积水）从这一行开始
const T_SUB = 3.0, T_DROP = 4.5;

// 镜头：开场从云里往下摇到招牌，1.3 秒落定。卡帧时按整像素震。
const camAt = (f) => {
  const t = f / FPS;
  let x = 0, y = Math.round(-40 * (1 - ease.inOutCubic(clamp(t / 1.3))));
  const k = f - STRIKE_F - 1;
  if (k >= 0 && k < FREEZE) (x += [3, -2, 2, -1][k]), (y += [-1, 1, -1, 0][k]);
  return { x, y };
};

// 4×4 有序抖动
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x, y) => BAYER[((y & 3) << 2) | (x & 3)];

// ---------------------------------------------------------------- 城市
const R0 = new Rng(7);
function skyline(seed, x0, x1, wMin, wMax, topMin, topMax, avoid) {
  const R = new Rng(seed), out = [];
  for (let x = x0; x < x1; ) {
    const w = R.int(wMin, wMax);
    let top = R.int(topMin, topMax);
    if (avoid && x + w > avoid[0] && x < avoid[1]) top = Math.max(top, avoid[2]);
    out.push({ x, w, top, ant: R.chance(0.3) ? R.int(4, 10) : 0, seed: R.int(1, 1e6) });
    x += w;
  }
  return out;
}
const FAR = skyline(11, -12, 340, 10, 24, 66, 108);
const NEAR = skyline(23, -12, 340, 16, 34, 84, 124, [96, 224, 126]);
const SIGN_BLD = { x: 104, w: 112, top: 104 };

// 窗：每栋楼按网格撒，一部分按 12 fps 闪
function windowsOf(b, near) {
  const R = new Rng(b.seed), out = [], px = near ? 4 : 3, py = near ? 5 : 4;
  for (let y = b.top + 4; y < HORIZON - 3; y += py)
    for (let x = b.x + 2; x < b.x + b.w - 2; x += px) {
      if (!R.chance(near ? 0.22 : 0.12)) continue;
      const kind = near ? R.pick([0, 0, 1, 2, 2, 2]) : 2;
      out.push({ x, y, w: near ? 2 : 1, kind, blink: R.chance(0.08) ? R.int(1, 99) : 0 });
    }
  return out;
}
FAR.forEach((b) => (b.win = windowsOf(b, false)));
NEAR.forEach((b) => (b.win = windowsOf(b, true)));
SIGN_BLD.seed = 99;
SIGN_BLD.win = windowsOf(SIGN_BLD, true).filter((w) => w.y > 122);

// ---------------------------------------------------------------- 招牌：一个字的像素 = 一个灯泡
const PITCH = 4, BOARD = { x: 108, y: 46, w: 104, h: 52 }, ROD = { x: 111, top: 33 };
const bulbs = [];
{
  let ox = BOARD.x + 4 + 2;
  for (const [ci, ch] of [..."像素"].entries()) {
    const g = GLYPHS[ch];
    g.rows.slice(1, 12).forEach((row, r) =>
      [...row].forEach((c, col) => c === "#" && bulbs.push({ ci, col: col + ci * 12, row: r, x: ox + col * PITCH, y: BOARD.y + 4 + 2 + r * PITCH })),
    );
    ox += 12 * PITCH;
  }
}
// 电流顺序：从避雷针下最近的灯泡出发，8 邻接按步数扩散；断开的笔画跳到最近的未亮灯泡。
{
  const key = (b) => b.col + "," + b.row, at = new Map(bulbs.map((b) => [key(b), b]));
  const start = bulbs.reduce((a, b) => (Math.hypot(b.x - ROD.x, b.y - BOARD.y) < Math.hypot(a.x - ROD.x, a.y - BOARD.y) ? b : a));
  start.lv = 0;
  let queue = [start], done = new Set([start]);
  while (done.size < bulbs.length) {
    while (queue.length) {
      const next = [];
      for (const b of queue)
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const n = at.get(b.col + dx + "," + (b.row + dy));
            if (n && !done.has(n)) (n.lv = b.lv + 1), (n.from = b), done.add(n), next.push(n);
          }
      queue = next;
    }
    if (done.size === bulbs.length) break;
    let best = null, bd = Infinity;
    for (const u of bulbs) if (!done.has(u)) for (const v of done) {
      const d = Math.hypot(u.col - v.col, u.row - v.row);
      if (d < bd) (bd = d), (best = [u, v]);
    }
    const [u, v] = best;
    u.lv = v.lv + Math.ceil(bd * 0.6);
    u.from = v; u.jump = true;
    done.add(u); queue = [u];
  }
}
const MAXLV = Math.max(...bulbs.map((b) => b.lv));
const FLOW0 = T_STRIKE + 0.04, FLOW = 1.15;
for (const b of bulbs) b.ta = FLOW0 + step12((b.lv / MAXLV) * FLOW);
const T_LIT = Math.max(...bulbs.map((b) => b.ta)) + 0.25;
const BUZZ = new Set(bulbs.filter((_, i) => rand(i, 404) < 0.03));

// 副标题：PIXEL ART，青色霓虹管，12 px 原尺寸，每个字母落在十六分音符上
const SUB = [];
{
  const text = "PIXEL ART";
  const wTot = [...text].reduce((s, ch) => s + (ch === " " ? 4 : GLYPHS[ch].w), 0);
  let x = Math.round(160 - wTot / 2), i = 0;
  for (const ch of text) {
    if (ch === " ") { x += 4; continue; }
    const g = GLYPHS[ch];
    SUB.push({ ch, x, y: 104, g, ta: T_SUB + i * 0.125 });
    x += g.w; i++;
  }
}

// ---------------------------------------------------------------- 闪电
const BOLT = bolt(new Rng(5), 82, -52, ROD.x, ROD.top, { jag: 0.24, depth: 5 });
const FORKS = forks(new Rng(9), BOLT.slice(0, 22), { count: 4, len: 26, jag: 0.35 });
// 云里的闪（预兆）。第一道在 0 帧之前，所以封面就是被照亮的云。
const FLASHES = [
  { t: -0.04, x: 236, y: -24, k: 1.0, d: 0.16 },
  { t: 0.55, x: 60, y: -30, k: 0.55, d: 0.08 },
  { t: 0.95, x: 250, y: -14, k: 0.7, d: 0.09 },
  { t: 1.22, x: 120, y: -34, k: 0.85, d: 0.07 },
  { t: T_STRIKE, x: 90, y: -30, k: 1.6, d: 0.16 },
  { t: T_STRIKE + 0.16, x: 90, y: -30, k: 1.0, d: 0.1 },
];
const flashK = (t, F) => (t < F.t ? 0 : F.k * Math.exp(-(t - F.t) / F.d) * (step12(t - F.t) * 12 % 2 === 1 ? 0.6 : 1));

// ---------------------------------------------------------------- 雨（纯函数：位置只取决于世界时间）
const DROPS = Array.from({ length: 210 }, (_, i) => {
  const near = rand(i, 1) < 0.35;
  return {
    i, near, v: near ? 330 + rand(i, 2) * 80 : 230 + rand(i, 2) * 60, len: near ? 6 : 4,
    ground: HORIZON + 2 + Math.floor(rand(i, 3) * 40), phase: rand(i, 4) * 400,
  };
});
const SLANT = 0.16;
function dropAt(d, t) {
  const fall = d.ground + 60, L = fall + d.v * 0.32, s = (t * d.v + d.phase) % L, k = Math.floor((t * d.v + d.phase) / L);
  const x = Math.floor(rand(d.i, k, 5) * 352) - 16;
  if (s < fall) { const y = -60 + s; return { x: x + (y - d.ground) * SLANT, y, land: -1 }; }
  return { x, y: d.ground, land: (s - fall) / d.v };
}

// ---------------------------------------------------------------- 粒子（按世界时间步进）
const groundY = (x) => (x >= SIGN_BLD.x && x < SIGN_BLD.x + SIGN_BLD.w ? SIGN_BLD.top - 0.5 : HORIZON + 6);
const sparksBlue = new Particles({ seed: 3, ground: groundY, sparks: ["#ffffff", "#cfe8ff", "#7fb0ff"] });
const sparksPink = new Particles({ seed: 4, ground: groundY, sparks: ["#ffffff", "#ff9cf0", "#c0249e"] });
const lights = new Lights();
const SR = new Rng(77);

// ---------------------------------------------------------------- 画
const frame = createFrame(W, H);
const mask = new Uint8Array(W * H); // 实体（楼、招牌）——英雄帧用
const rgba = new Uint8ClampedArray(W * H * 4);
const nearestCache = new Map();
function nearest(c) {
  let v = nearestCache.get(c);
  if (v !== undefined) return v;
  let bd = Infinity;
  for (const q of PALETTE) {
    const d = (red(c) - red(q)) ** 2 * 0.3 + (green(c) - green(q)) ** 2 * 0.59 + (blue(c) - blue(q)) ** 2 * 0.11;
    if (d < bd) (bd = d), (v = q);
  }
  nearestCache.set(c, v);
  return v;
}

function drawFrame(f, cues) {
  const t = tw(f), cam = camAt(f), hero = f === STRIKE_F;
  clearFrame(frame);
  mask.fill(0);
  const p = painterFor(frame);
  p.place(-cam.x, -cam.y);
  const Cc = frame.color, L = frame.light;
  const solid = (x, y, c) => {
    const sx = x - cam.x, sy = y - cam.y;
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) return;
    Cc[sy * W + sx] = c;
    mask[sy * W + sx] = 1;
  };
  const rectS = (x, y, w, h, c) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) solid(xx, yy, c); };

  // 天空：竖向色阶，只在每段的末尾 40% 抖动过渡
  const flashSum = FLASHES.map((F) => ({ F, k: flashK(t, F) })).filter((o) => o.k > 0.01);
  const cloudT = step12(t);
  for (let sy = 0; sy < H; sy++) {
    const wy = sy + cam.y;
    if (wy >= HORIZON) break;
    const u = clamp((wy + 56) / (HORIZON + 56)), fi = u * 4, band = Math.floor(fi), fr = fi - band;
    for (let sx = 0; sx < W; sx++) {
      const wx = sx + cam.x;
      let c = C.sky[Math.min(4, band + (fr > 0.6 && bayer(sx, sy) < (fr - 0.6) / 0.4 ? 1 : 0))];
      // 云：两层噪声，按 12 fps 漂；上沿亮一格
      if (wy < 30) {
        const m = 1 - ((wy + 16) / 38) ** 2;
        if (m > 0) {
          const dens = (y) => fbm((wx + cloudT * 5) * 0.022, y * 0.075, 7, 4) * 0.5 + 0.5 - (0.78 - 0.32 * m);
          const d = dens(wy);
          if (d > 0) {
            const top = dens(wy - 1) <= 0;
            c = top ? C.cloud[3] : C.cloud[Math.min(2, Math.floor(d * 9))];
            for (const { F, k } of flashSum) {
              const r = Math.hypot(wx - F.x, (wy - F.y) * 1.6) / 110;
              if (r < 1) p.add(sx, sy, FLASH_LIGHT, k * (1 - r) ** 2 * (0.5 + d * 2));
            }
          }
        }
      }
      for (const { F, k } of flashSum) p.add(sx, sy, FLASH_LIGHT, k * 0.07 * (1 - u * 0.5));
      Cc[sy * W + sx] = c;
    }
  }

  // 远楼、近楼、招牌楼
  for (const b of FAR) {
    rectS(b.x, b.top, b.w, HORIZON - b.top, C.sky[2]);
    rectS(b.x, b.top, b.w, 1, C.sky[3]);
    for (const w of b.win) solid(w.x, w.y, C.sky[4]);
  }
  for (const b of NEAR) {
    rectS(b.x, b.top, b.w, HORIZON - b.top, C.sky[1]);
    rectS(b.x, b.top, b.w, 1, C.sky[3]);
    if (b.ant) for (let y = b.top - b.ant; y < b.top; y++) solid(b.x + 3, y, C.sky[3]);
    if (b.ant && Math.floor(t * 1.5 + b.seed) % 2 === 0) { solid(b.x + 3, b.top - b.ant - 1, C.neon[3]); p.glow(b.x + 3.5, b.top - b.ant - 0.5, 4, PINK_LIGHT, 0.35); }
    for (const w of b.win) {
      if (w.blink && Math.floor(step12(t) * 12 + w.blink) % 17 < 3) continue;
      const c = w.kind === 0 ? C.warm[1] : w.kind === 1 ? C.cyan[3] : C.sky[2];
      for (let k = 0; k < w.w; k++) solid(w.x + k, w.y, c);
      if (w.kind === 0) p.glow(w.x + w.w / 2, w.y + 0.5, 3, C.warm[1], 0.12);
    }
  }
  const B = SIGN_BLD;
  rectS(B.x, B.top, B.w, HORIZON - B.top, C.ink);
  rectS(B.x, B.top, B.w, 1, C.sky[2]);
  for (const w of B.win) { for (let k = 0; k < w.w; k++) solid(w.x + k, w.y, w.kind === 0 ? C.warm[2] : C.sky[1]); }

  // 招牌支架：两根腿 + 交叉
  for (const lx of [126, 194]) for (let y = BOARD.y + BOARD.h; y < B.top; y++) solid(lx, y, C.sky[3]);
  for (let k = 0; k <= 68; k++) { const y = BOARD.y + BOARD.h + Math.round((k / 68) * (B.top - BOARD.y - BOARD.h - 1)); solid(126 + k, y, C.sky[2]); solid(194 - k, y, C.sky[2]); }
  // 板子
  rectS(BOARD.x, BOARD.y, BOARD.w, BOARD.h, C.sky[1]);
  const lit = clamp((t - FLOW0) / (T_LIT - FLOW0));
  const rim = t < FLOW0 ? C.sky[3] : lit < 1 ? C.neon[step12(t) * 12 % 2 ? 4 : 3] : C.neon[4];
  for (let x = BOARD.x; x < BOARD.x + BOARD.w; x++) { solid(x, BOARD.y, rim); solid(x, BOARD.y + BOARD.h - 1, rim); }
  for (let y = BOARD.y; y < BOARD.y + BOARD.h; y++) { solid(BOARD.x, y, rim); solid(BOARD.x + BOARD.w - 1, y, rim); }
  for (let x = BOARD.x + 2; x < BOARD.x + BOARD.w - 2; x++) { solid(x, BOARD.y + 2, C.sky[2]); solid(x, BOARD.y + BOARD.h - 3, C.sky[2]); }
  // 避雷针
  for (let y = ROD.top; y < BOARD.y; y++) solid(ROD.x, y, C.sky[4]);
  solid(ROD.x - 1, ROD.top + 1, C.sky[4]); solid(ROD.x + 1, ROD.top + 1, C.sky[4]);

  // 灯泡
  let pinkPool = 0;
  for (const [i, b] of bulbs.entries()) {
    const a = t - b.ta;
    let core, arm, corner = 0, glowK = 0;
    if (a < 0) { core = C.neon[4]; arm = C.neon[5]; }
    else if (a < 1 / 12) { core = C.neon[0]; arm = C.neon[0]; corner = C.neon[1]; glowK = 0.55; }
    else if (a < 2 / 12) { core = C.neon[0]; arm = C.neon[1]; corner = C.neon[2]; glowK = 0.35; }
    else if (a < 3 / 12) { core = C.neon[1]; arm = C.neon[2]; corner = C.neon[3]; glowK = 0.22; }
    else { core = C.neon[2]; arm = C.neon[3]; corner = C.neon[4]; glowK = 0.12; }
    // 跑马：落水那一下，亮度从左往右扫过去
    const chase = t - T_DROP - 0.02 - b.col * 0.006;
    if (a >= 0 && chase > 0 && chase < 1 / 12) { core = C.neon[0]; arm = C.neon[1]; glowK = 0.4; }
    // 个别灯泡接触不良
    if (a > 0.5 && BUZZ.has(b) && Math.floor(step12(t) * 12 + i) % 9 < 2) { core = C.neon[5]; arm = corner = 0; glowK = 0; }
    solid(b.x, b.y, core);
    if (arm) { solid(b.x - 1, b.y, arm); solid(b.x + 1, b.y, arm); solid(b.x, b.y - 1, arm); solid(b.x, b.y + 1, arm); }
    if (corner) { solid(b.x - 1, b.y - 1, corner); solid(b.x + 1, b.y - 1, corner); solid(b.x - 1, b.y + 1, corner); solid(b.x + 1, b.y + 1, corner); }
    if (glowK) { p.glow(b.x + 0.5, b.y + 0.5, glowK > 0.3 ? 7 : 4.5, glowK > 0.3 ? C.neon[1] : PINK_LIGHT, glowK); pinkPool++; }
    // 电流的头：刚点亮的灯泡和上一个之间拉一道电弧
    if (a >= 0 && a < 1 / 12 && b.from) {
      const r = new Rng(f * 131 + i), pts = bolt(r, b.from.x + 0.5, b.from.y + 0.5, b.x + 0.5, b.y + 0.5, { jag: b.jump ? 0.35 : 0.2, depth: b.jump ? 3 : 1 });
      p.polyline(pts, C.bolt[1]);
      p.glowLine(b.from.x, b.from.y, b.x, b.y, 4, C.bolt[2], 0.25);
    }
  }
  if (pinkPool) {
    const k = pinkPool / bulbs.length;
    p.glow(160, 74, 110, PINK_LIGHT, 0.16 * k);
    p.glow(160, 112, 70, PINK_LIGHT, 0.12 * k);
  }

  // 副标题
  for (const s of SUB) {
    const a = t - s.ta;
    const c = a < 0 ? C.cyan[3] : a < 1 / 30 ? C.cyan[0] : a < 3 / 30 ? C.cyan[1] : C.cyan[2];
    if (a < 0 && t < T_SUB - 0.2) continue; // 之前是暗的灯管，看不见
    s.g.rows.forEach((row, r) => [...row].forEach((ch, col) => ch === "#" && solid(s.x + col, s.y + r, c)));
    if (a >= 0) p.glow(s.x + s.g.w / 2, s.y + 6, 9, CYAN_LIGHT, a < 0.1 ? 0.35 : 0.12);
  }

  // 闪电
  const ts = t - T_STRIKE;
  const boltCol = ts < 0 ? null : ts < 0.07 ? 0 : ts < 0.12 ? 1 : ts < 0.16 ? null : ts < 0.22 ? 0 : ts < 0.28 ? 2 : ts < 0.34 ? 3 : null;
  if (f >= STRIKE_F - 3 && f < STRIKE_F) {
    const n = Math.floor(BOLT.length * [0.35, 0.6, 0.85][f - STRIKE_F + 3]);
    p.polyline(BOLT.slice(0, n), C.bolt[2]);
    p.glow(BOLT[n - 1][0], BOLT[n - 1][1], 8, C.bolt[2], 0.4);
  }
  if (boltCol !== null) {
    const c = C.bolt[boltCol];
    for (const [x, y] of BOLT.map(([x, y]) => [x + 1, y])) p.dot(x, y, C.bolt[Math.min(3, boltCol + 1)], 0.7);
    p.polyline(BOLT, c);
    if (boltCol === 0) p.polyline(BOLT.map(([x, y]) => [x - 1, y]), C.bolt[1]);
    if (boltCol <= 1) for (const fk of FORKS) p.polyline(fk, C.bolt[boltCol + 1]);
    for (let i = 1; i < BOLT.length; i += 3) p.glowLine(BOLT[i - 1][0], BOLT[i - 1][1], BOLT[i][0], BOLT[i][1], 8, FLASH_LIGHT, boltCol === 0 ? 0.22 : 0.1);
    p.glow(ROD.x, ROD.top, 26, C.bolt[1], boltCol === 0 ? 0.45 : 0.2);
  }

  // 落水的大雨滴
  const td = t - T_DROP;
  if (td > -0.28 && td < 0) {
    const y = 160 + td * 700;
    p.line(160, y - 9, 160, y, C.rain[2]);
    p.line(161, y - 5, 161, y, C.cyan[1]);
  }

  // ---------- 倒影：地面以下的每一行，从地平线上方对称的那一行取，按整像素左右摆
  for (let sy = 0; sy < H; sy++) {
    const wy = sy + cam.y;
    if (wy < HORIZON) continue;
    const d = wy - HORIZON;
    const srcY = HORIZON - 1 - Math.floor(d * 2.2) - cam.y;
    const gap = d > 6 && d % 5 === 4;
    for (let sx = 0; sx < W; sx++) {
      const wx = sx + cam.x;
      let dx = Math.round(Math.sin(d * 0.9 + t * 6 + Math.floor(wx / 40)) * (0.4 + d * 0.06));
      if (td > 0 && td < 1.0) {
        const e = Math.hypot(wx - 160, (wy - 160) / 0.32), ring = e - td * 90;
        if (ring < 0 && ring > -60) dx += Math.round(Math.sin(ring * 0.5) * 3 * (1 - td) * Math.exp(ring / 40));
      }
      const sxx = clamp(sx + dx, 0, W - 1);
      let c = C.sky[1], l = 0;
      if (srcY >= 0 && srcY < H && !gap) {
        const j = srcY * W + sxx;
        c = nearest(scale(Cc[j], 0.62));
        if (c === C.ink) c = C.sky[0];
        l = L[j];
        mask[sy * W + sx] = mask[j];
      } else if (gap) {
        mask[sy * W + sx] = 1;
      }
      Cc[sy * W + sx] = gap ? C.sky[0] : c;
      if (l) p.add(sx, sy, l, 0.5);
    }
  }
  for (let x = 0; x < W; x++) { const sy = HORIZON - cam.y; if (sy >= 0 && sy < H) Cc[sy * W + x] = C.sky[3]; }

  // 雨和水圈
  for (const d of DROPS) {
    const s = dropAt(d, t);
    if (s.land < 0) {
      const len = d.len, c0 = d.near ? C.rain[1] : C.rain[0], c1 = d.near ? C.rain[0] : C.sky[3];
      p.line(s.x - len * SLANT, s.y - len, s.x - len * SLANT * 0.5, s.y - len * 0.5, c1);
      p.line(s.x - len * SLANT * 0.5, s.y - len * 0.5, s.x, s.y, c0);
    } else if (s.y > HORIZON && d.near) {
      const a = s.land, rx = 1 + a * 15, ry = Math.max(1, rx * 0.3);
      const c = a < 0.08 ? C.rain[2] : a < 0.18 ? C.rain[1] : C.rain[0];
      const n = Math.ceil(rx * 2.5);
      for (let k = 0; k < n; k++) {
        const g = (k / n) * Math.PI * 2;
        p.dot(s.x + Math.cos(g) * rx, s.y + Math.sin(g) * ry, c, 1 - a * 2.4);
      }
      if (a < 0.12) for (const sgn of [-1, 1]) p.dot(s.x + sgn * a * 22, s.y - (a * 60 - a * a * 320), C.rain[2]);
    }
  }
  // 大雨滴落下：三圈大水纹 + 水花冠
  if (td >= 0 && td < 1) {
    for (const [j, dl] of [0, 0.09, 0.18].entries()) {
      const a = td - dl;
      if (a < 0) continue;
      const rx = 3 + a * 80, ry = rx * 0.3, n = Math.ceil(rx * 3);
      const c = a < 0.1 ? C.cyan[0] : a < 0.25 ? C.cyan[1] : a < 0.45 ? C.neon[2] : C.rain[1];
      for (let k = 0; k < n; k++) { const g = (k / n) * Math.PI * 2; p.dot(160 + Math.cos(g) * rx, 160 + Math.sin(g) * ry, c, 1 - a * 1.4); }
      if (j === 0) p.glowRing(160, 160, rx * 0.6, 6, CYAN_LIGHT, 0.25 * (1 - a));
    }
    if (td < 0.3) for (let k = 0; k < 7; k++) {
      const vx = (k - 3) * 22, h = 60 + (k % 2) * 25;
      p.dot(160 + vx * td, 160 - (h * td - 260 * td * td), k % 2 ? C.cyan[1] : C.cyan[0]);
    }
  }

  // 粒子与闪光
  sparksBlue.draw(p, "front"); sparksPink.draw(p, "front");
  lights.draw(p);

  // ---------- 英雄帧：黑白反相，只留轮廓
  if (hero) {
    for (let i = 0; i < W * H; i++) { Cc[i] = mask[i] ? C.ink : C.bolt[1]; L[i] = 0; }
    const q = painterFor(frame); q.place(-cam.x, -cam.y);
    q.polyline(BOLT, C.ink); q.polyline(BOLT.map(([x, y]) => [x + 1, y]), C.ink);
    for (const fk of FORKS) q.polyline(fk, C.ink);
    for (const b of bulbs) { const x = b.x - cam.x, y = b.y - cam.y; if (x >= 0 && y >= 0 && x < W && y < H) Cc[y * W + x] = C.bolt[0]; }
  }

  composite(frame, rgba, C.ink);
  return rgba;
}

// ---------------------------------------------------------------- 模拟 + 出帧
const cues = { fps: FPS, frames: N, strike: T_STRIKE, freeze: FREEZE / FPS, flashes: FLASHES.map((F) => F.t), bulbs: [], chars: [], sub: SUB.map((s) => s.ta), drop: T_DROP, leader: (STRIKE_F - 3) / FPS };
// 把世界时间的事件换回真实时间（卡帧之后整体往后推 4 帧）
const real = (w) => (w <= T_STRIKE ? w : w + FREEZE / FPS);
cues.bulbs = [...new Set(bulbs.map((b) => b.ta))].sort((a, b) => a - b).map(real);
for (const ci of [0, 1]) cues.chars.push(real(Math.max(...bulbs.filter((b) => b.ci === ci).map((b) => b.ta)) + 0.02));
cues.sub = cues.sub.map(real); cues.drop = real(T_DROP); cues.flashes = cues.flashes.filter((x) => x >= 0).map(real);

const fd = openSync(join(OUT, "frames.rgba"), "w");
const last = process.env.STILL ? +process.env.STILL : N - 1;
let prevT = 0;
const spawned = new Set();
for (let f = 0; f <= last; f++) {
  const t = tw(f), dt = t - prevT;
  prevT = t;
  // 事件：落雷的火花和闪光；灯泡点亮时偶尔崩出粉色火花
  if (t >= T_STRIKE && !spawned.has("strike")) {
    spawned.add("strike");
    for (let i = 0; i < 34; i++) {
      const a = SR.range(-Math.PI, 0.2), sp = SR.range(60, 260);
      sparksBlue.spawn(P.SPARK, ROD.x, ROD.top + 2, Math.cos(a) * sp, Math.sin(a) * sp, SR.range(0.35, 0.9));
    }
    lights.add(ROD.x, ROD.top, 56, "#cfe8ff", 0.55, 0.45);
  }
  for (const [i, b] of bulbs.entries()) {
    if (t >= b.ta && !spawned.has(i)) {
      spawned.add(i);
      if (rand(i, 808) < 0.18) for (let k = 0; k < 3; k++) {
        const a = SR.range(-Math.PI * 0.9, -Math.PI * 0.1), sp = SR.range(40, 140);
        sparksPink.spawn(P.SPARK, b.x, b.y, Math.cos(a) * sp, Math.sin(a) * sp, SR.range(0.3, 0.6));
      }
    }
  }
  if (t >= T_DROP && !spawned.has("drop")) { spawned.add("drop"); lights.add(160, 158, 40, "#bff4ff", 0.6, 0.35); }
  for (const sys of [sparksBlue, sparksPink, lights]) {
    const n = Math.max(1, Math.ceil(dt * 120 - 1e-9));
    if (dt > 0) for (let k = 0; k < n; k++) sys.update(dt / n);
  }
  const buf = drawFrame(f, cues);
  if (!process.env.STILL || f === last) writeSync(fd, buf);
}
closeSync(fd);
writeFileSync(join(OUT, "cues.json"), JSON.stringify(cues, null, 1));
console.error(`bulbs ${bulbs.length}, levels ${MAXLV}, palette ${PALETTE.length}, lit by ${T_LIT.toFixed(2)}s (world)`);
