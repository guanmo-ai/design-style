// 像素风 · 动效小样 v2（4.5 秒，150 BPM：一拍正好 12 帧）
//
// 世界是 320 × 180 的整数像素网格。镜头只用整数倍率：开场 12 倍特写招牌，落雷后 12 → 10 → 8 → 6 倍
// 一级一级跳出去，最近邻放大到 1920 × 1080。
//
// 规矩：
//   1. 落格：所有东西落在整数格上。形（灯泡、云、窗、镜头倍率）按 15 fps 走阶梯，光、雨和火花按 30 fps 走满帧。
//   2. 卡帧：撞击时世界停住。落雷：反相英雄帧 1 帧 + 冻结 3 帧并按整像素震；第二道雷：冻结 1 帧。
//   3. 色阶：颜色只在色板里跳。灯泡白热 → 浅粉 → 粉 → 霓虹，一阶一阶冷下来；亮度交给叠加光层。
//
// 绘制层和粒子来自 pixelfx（MIT，见 vendor/pixelfx/LICENSE 与 NOTICE.md）：
// color 缓冲只放不透明像素，light 缓冲叠加发光，最后 composite 合成。
//
// 用法：node film.mjs <输出目录>
//   写出 video.mp4（1920 × 1080，无声）和 cues.json（给配乐用的时间点，单位秒，真实时间）。

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import {
  createFrame, clearFrame, composite, painterFor, Particles, Lights, P,
  hex, scale, red, green, blue, clamp, rand, fbm, Rng, bolt, forks,
} from "./vendor/pixelfx/core/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] ?? join(HERE, "out");
mkdirSync(OUT, { recursive: true });

const W = 320, H = 180, FPS = 30, N = 126, OW = 1920, OH = 1080;
const GLYPHS = JSON.parse(readFileSync(join(HERE, "glyphs.json"), "utf8"));

// ---------------------------------------------------------------- 色板（23 色）
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

// ---------------------------------------------------------------- 时间（帧号都是真实帧）
// 150 BPM：一拍 12 帧，十六分音符 3 帧。卡帧一松开（第 22 帧）是第一拍。
const BEAT = 12;
const F = {
  leader: 15, hero: 18, release: 22, // 先导 15–17，英雄帧 18，冻结 19–21
  flowEnd: 40, // 电流爬完两个字
  surge: 46, // 第 3 拍：浪涌
  sub: 46, // 副标题第一个字母（之后每 3 帧一个）
  strike2: 82, // 第 6 拍：第二道雷，第 83 帧冻结
  relight: 86, back: 94, // 断电，86 起从右往左重新点亮，94（第 7 拍）全亮
  drop: 106, // 第 8 拍：大雨滴落进积水
};
const FROZEN = new Set([19, 20, 21, 83]);
// 世界时间：冻结的帧不走
const TW = []; for (let f = 0, k = 0; f <= N; f++) { if (FROZEN.has(f)) k++; TW[f] = (f - k) / FPS; }
const tw = (f) => TW[f];
const step15 = (t) => Math.floor(t * 15 + 1e-6) / 15;
const HORIZON = 138;

// 镜头：整数倍率 + 中心。卡帧时按整像素震。
function viewAt(f) {
  let s = f < 25 ? 12 : f < 28 ? 10 : f < 31 ? 8 : 6;
  if (f === F.surge || f === F.surge + 1 || f === F.back || f === F.drop) s = 7; // 重拍上往前冲一下
  const cy = { 12: 58, 10: 66, 8: 76, 7: 86, 6: 90 }[s];
  return { s, cx: 160, cy };
}
function shakeAt(f) {
  const k = f - F.hero - 1;
  if (k >= 0 && k < 3) return { x: [3, -2, 1][k], y: [-1, 1, -1][k] };
  if (f === F.strike2 + 1) return { x: -1, y: 1 };
  if (f === F.surge) return { x: 0, y: 1 };
  return { x: 0, y: 0 };
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x, y) => BAYER[((y & 3) << 2) | (x & 3)];

// ---------------------------------------------------------------- 城市
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
const SIGN_BLD = { x: 104, w: 112, top: 104, seed: 99 };
function windowsOf(b, near) {
  const R = new Rng(b.seed), out = [], px = near ? 4 : 3, py = near ? 5 : 4;
  for (let y = b.top + 4; y < HORIZON - 3; y += py)
    for (let x = b.x + 2; x < b.x + b.w - 2; x += px) {
      if (!R.chance(near ? 0.22 : 0.12)) continue;
      out.push({ x, y, w: near ? 2 : 1, kind: near ? R.pick([0, 0, 1, 2, 2, 2]) : 2, blink: R.chance(0.08) ? R.int(1, 99) : 0 });
    }
  return out;
}
FAR.forEach((b) => (b.win = windowsOf(b, false)));
NEAR.forEach((b) => (b.win = windowsOf(b, true)));
SIGN_BLD.win = windowsOf(SIGN_BLD, true).filter((w) => w.y > 122);

// ---------------------------------------------------------------- 招牌：一个字的像素 = 一个灯泡
const PITCH = 4, BOARD = { x: 108, y: 46, w: 104, h: 52 }, ROD = { x: 111, top: 33 };
const bulbs = [];
{
  let ox = BOARD.x + 6;
  for (const [ci, ch] of [..."像素"].entries()) {
    GLYPHS[ch].rows.slice(1, 12).forEach((row, r) =>
      [...row].forEach((c, col) => c === "#" && bulbs.push({ ci, col: col + ci * 12, row: r, x: ox + col * PITCH, y: BOARD.y + 6 + r * PITCH })),
    );
    ox += 12 * PITCH;
  }
}
// 电流顺序：从避雷针下最近的灯泡出发，8 邻接按步数扩散；断开的笔画跳到最近的未亮灯泡。
{
  const at = new Map(bulbs.map((b) => [b.col + "," + b.row, b]));
  const start = bulbs.reduce((a, b) => (Math.hypot(b.x - ROD.x, b.y - BOARD.y) < Math.hypot(a.x - ROD.x, a.y - BOARD.y) ? b : a));
  start.lv = 0;
  let queue = [start];
  const done = new Set([start]);
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
    u.lv = v.lv + Math.ceil(bd * 0.6); u.from = v; u.jump = true;
    done.add(u); queue = [u];
  }
}
const MAXLV = Math.max(...bulbs.map((b) => b.lv));
const FLOW0 = tw(F.release), FLOW = tw(F.flowEnd) - FLOW0;
const RE0 = tw(F.relight), RE = tw(F.back) - RE0 - 1 / 15;
const MAXCOL = Math.max(...bulbs.map((b) => b.col));
for (const b of bulbs) {
  b.ta = FLOW0 + step15((b.lv / MAXLV) * FLOW);
  b.re = RE0 + step15(((MAXCOL - b.col) / MAXCOL) * RE); // 重新点亮：从右往左
}
const BUZZ = new Set(bulbs.filter((_, i) => rand(i, 404) < 0.03));
const T_SURGE = tw(F.surge), T_DIP = tw(F.strike2 + 1), T_BACK = tw(F.back), T_DROP = tw(F.drop);

// 副标题：PIXEL ART，青色霓虹管，12 px 原尺寸，字母从上方砸下来，每个十六分音符一个
const SUB = [];
{
  const text = "PIXEL ART";
  const wTot = [...text].reduce((s, ch) => s + (ch === " " ? 4 : GLYPHS[ch].w), 0);
  let x = Math.round(160 - wTot / 2), i = 0;
  for (const ch of text) {
    if (ch === " ") { x += 4; continue; }
    const g = GLYPHS[ch], fl = F.sub + i * 3;
    SUB.push({ ch, x, y: 104, g, fl, tl: tw(fl) });
    x += g.w; i++;
  }
}

// ---------------------------------------------------------------- 闪电
const BOLT = bolt(new Rng(5), 82, -52, ROD.x, ROD.top, { jag: 0.24, depth: 5 });
const FORKS = forks(new Rng(9), BOLT.slice(0, 22), { count: 4, len: 26, jag: 0.35 });
const B2T = FAR.find((b) => b.x <= 262 && b.x + b.w > 262);
const BOLT2 = bolt(new Rng(21), 236, -52, 262, B2T.top, { jag: 0.3, depth: 5 });
const FORKS2 = forks(new Rng(23), BOLT2.slice(0, 20), { count: 5, len: 34, jag: 0.4 });
const T_STRIKE = tw(F.hero), T_STRIKE2 = tw(F.strike2);
// 云里的闪。第一道在 0 帧之前，所以封面里的云是亮的。
const FLASHES = [
  { t: -0.03, x: 200, y: -10, k: 0.8, d: 0.14 },
  { t: tw(8), x: 70, y: -20, k: 0.5, d: 0.06 },
  { t: T_STRIKE, x: 90, y: -30, k: 1.6, d: 0.14 },
  { t: T_STRIKE + 0.13, x: 90, y: -30, k: 0.9, d: 0.08 },
  { t: T_STRIKE2, x: 240, y: -30, k: 1.4, d: 0.12 },
];
const flashK = (t, Fl) => (t < Fl.t ? 0 : Fl.k * Math.exp(-(t - Fl.t) / Fl.d));

// ---------------------------------------------------------------- 雨（纯函数：位置只取决于世界时间）
const DROPS = Array.from({ length: 210 }, (_, i) => {
  const near = rand(i, 1) < 0.35;
  return { i, near, v: near ? 420 + rand(i, 2) * 90 : 300 + rand(i, 2) * 60, len: near ? 7 : 4, ground: HORIZON + 2 + Math.floor(rand(i, 3) * 40), phase: rand(i, 4) * 400 };
});
const SLANT = 0.16;
function dropAt(d, t) {
  const fall = d.ground + 60, L = fall + d.v * 0.3, u = t * d.v + d.phase, s = u % L, k = Math.floor(u / L);
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
const mask = new Uint8Array(W * H);
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

/** 灯泡这一刻的样子：[中心, 十字, 四角, 光强] */
function bulbLook(b, i, t) {
  const OFF = [C.neon[4], C.neon[5], 0, 0], DEAD = [C.neon[5], 0, 0, 0];
  const cool = (a) =>
    a < 1 / 15 ? [C.neon[0], C.neon[0], C.neon[1], 0.6] :
    a < 2 / 15 ? [C.neon[0], C.neon[1], C.neon[2], 0.38] :
    a < 3 / 15 ? [C.neon[1], C.neon[2], C.neon[3], 0.22] : [C.neon[2], C.neon[3], C.neon[4], 0.12];
  if (t < b.ta) return OFF;
  if (t >= T_DIP && t < b.re) return t < T_DIP + 1 / 30 ? [C.neon[0], C.neon[1], 0, 0.5] : DEAD; // 断电前最后一闪
  if (t >= T_SURGE && t < T_SURGE + 2 / 15 && t < T_DIP) return t < T_SURGE + 1 / 15 ? [C.neon[0], C.neon[0], C.neon[0], 0.7] : [C.neon[0], C.neon[1], C.neon[2], 0.4];
  const a = t >= b.re ? t - b.re : t - b.ta;
  const chase = t - T_DROP - b.col * (1 / 60);
  if (chase >= 0 && chase < 1 / 15) return [C.neon[0], C.neon[1], C.neon[3], 0.45];
  if (a > 0.5 && BUZZ.has(b) && Math.floor(step15(t) * 15 + i) % 11 < 2) return DEAD;
  return cool(a);
}

function drawFrame(f) {
  const t = tw(f), sh = shakeAt(f), cam = { x: sh.x, y: sh.y };
  clearFrame(frame);
  mask.fill(0);
  const p = painterFor(frame);
  p.place(-cam.x, -cam.y);
  const Cc = frame.color, L = frame.light;
  const solid = (x, y, c) => {
    const sx = x - cam.x, sy = y - cam.y;
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) return;
    Cc[sy * W + sx] = c; mask[sy * W + sx] = 1;
  };
  const rectS = (x, y, w, h, c) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) solid(xx, yy, c); };

  // 天空与云
  const fl = FLASHES.map((Fl) => ({ Fl, k: flashK(t, Fl) })).filter((o) => o.k > 0.01);
  const cloudT = step15(t);
  for (let sy = 0; sy < H; sy++) {
    const wy = sy + cam.y;
    if (wy >= HORIZON) break;
    const u = clamp((wy + 56) / (HORIZON + 56)), fi = u * 4, band = Math.floor(fi), fr = fi - band;
    for (let sx = 0; sx < W; sx++) {
      const wx = sx + cam.x;
      let c = C.sky[Math.min(4, band + (fr > 0.6 && bayer(sx, sy) < (fr - 0.6) / 0.4 ? 1 : 0))];
      if (wy < 30) {
        const m = 1 - ((wy + 16) / 38) ** 2;
        if (m > 0) {
          const dens = (y) => fbm((wx + cloudT * 9) * 0.022, y * 0.075, 7, 4) * 0.5 + 0.5 - (0.78 - 0.32 * m);
          const d = dens(wy);
          if (d > 0) {
            c = dens(wy - 1) <= 0 ? C.cloud[3] : C.cloud[Math.min(2, Math.floor(d * 9))];
            for (const { Fl, k } of fl) {
              const r = Math.hypot(wx - Fl.x, (wy - Fl.y) * 1.6) / 110;
              if (r < 1) p.add(sx, sy, FLASH_LIGHT, k * (1 - r) ** 2 * (0.5 + d * 2));
            }
          }
        }
      }
      for (const { k } of fl) p.add(sx, sy, FLASH_LIGHT, k * 0.07 * (1 - u * 0.5));
      Cc[sy * W + sx] = c;
    }
  }

  // 楼
  for (const b of FAR) {
    rectS(b.x, b.top, b.w, HORIZON - b.top, C.sky[2]);
    rectS(b.x, b.top, b.w, 1, C.sky[3]);
    for (const w of b.win) solid(w.x, w.y, C.sky[4]);
  }
  for (const b of NEAR) {
    rectS(b.x, b.top, b.w, HORIZON - b.top, C.sky[1]);
    rectS(b.x, b.top, b.w, 1, C.sky[3]);
    if (b.ant) for (let y = b.top - b.ant; y < b.top; y++) solid(b.x + 3, y, C.sky[3]);
    if (b.ant && Math.floor(t * 2 + b.seed) % 2 === 0) { solid(b.x + 3, b.top - b.ant - 1, C.neon[3]); p.glow(b.x + 3.5, b.top - b.ant - 0.5, 4, PINK_LIGHT, 0.35); }
    for (const w of b.win) {
      if (w.blink && Math.floor(step15(t) * 15 + w.blink) % 17 < 3) continue;
      const c = w.kind === 0 ? C.warm[1] : w.kind === 1 ? C.cyan[3] : C.sky[2];
      for (let k = 0; k < w.w; k++) solid(w.x + k, w.y, c);
      if (w.kind === 0) p.glow(w.x + w.w / 2, w.y + 0.5, 3, C.warm[1], 0.12);
    }
  }
  const B = SIGN_BLD;
  rectS(B.x, B.top, B.w, HORIZON - B.top, C.ink);
  rectS(B.x, B.top, B.w, 1, C.sky[2]);
  for (const w of B.win) for (let k = 0; k < w.w; k++) solid(w.x + k, w.y, w.kind === 0 ? C.warm[2] : C.sky[1]);

  // 支架、板子、避雷针
  for (const lx of [126, 194]) for (let y = BOARD.y + BOARD.h; y < B.top; y++) solid(lx, y, C.sky[3]);
  for (let k = 0; k <= 68; k++) { const y = BOARD.y + BOARD.h + Math.round((k / 68) * (B.top - BOARD.y - BOARD.h - 1)); solid(126 + k, y, C.sky[2]); solid(194 - k, y, C.sky[2]); }
  rectS(BOARD.x, BOARD.y, BOARD.w, BOARD.h, C.sky[1]);
  const dark = t < FLOW0 || (t >= T_DIP + 1 / 30 && t < T_BACK);
  const surge = t >= T_SURGE && t < T_SURGE + 1 / 15;
  const rim = dark ? C.sky[3] : surge ? C.neon[0] : t < tw(F.flowEnd) ? C.neon[step15(t) * 15 % 2 ? 4 : 3] : C.neon[3];
  for (let x = BOARD.x; x < BOARD.x + BOARD.w; x++) { solid(x, BOARD.y, rim); solid(x, BOARD.y + BOARD.h - 1, rim); }
  for (let y = BOARD.y; y < BOARD.y + BOARD.h; y++) { solid(BOARD.x, y, rim); solid(BOARD.x + BOARD.w - 1, y, rim); }
  for (let x = BOARD.x + 2; x < BOARD.x + BOARD.w - 2; x++) { solid(x, BOARD.y + 2, C.sky[2]); solid(x, BOARD.y + BOARD.h - 3, C.sky[2]); }
  for (let y = ROD.top; y < BOARD.y; y++) solid(ROD.x, y, C.sky[4]);
  solid(ROD.x - 1, ROD.top + 1, C.sky[4]); solid(ROD.x + 1, ROD.top + 1, C.sky[4]);

  // 蓄电：落雷前避雷针尖上爬着越来越多的小电弧
  if (f < F.hero) {
    const charge = f / F.hero, st = Math.floor(step15(t) * 15);
    const n = 1 + Math.floor(charge * 5);
    for (let k = 0; k < n; k++) {
      const r = new Rng(st * 31 + k), a = r.range(-Math.PI, 0), l = 2 + r.range(0, 3 + charge * 6);
      p.polyline(bolt(r, ROD.x + 0.5, ROD.top + 0.5, ROD.x + 0.5 + Math.cos(a) * l, ROD.top + 0.5 + Math.sin(a) * l, { jag: 0.4, depth: 2 }), charge > 0.6 && k === 0 ? C.bolt[1] : C.bolt[2]);
    }
    p.glow(ROD.x + 0.5, ROD.top + 0.5, 6 + charge * 8, C.bolt[2], 0.25 + charge * 0.4);
  }

  // 灯泡
  let pink = 0;
  for (const [i, b] of bulbs.entries()) {
    const [core, arm, corner, gk] = bulbLook(b, i, t);
    solid(b.x, b.y, core);
    if (arm) { solid(b.x - 1, b.y, arm); solid(b.x + 1, b.y, arm); solid(b.x, b.y - 1, arm); solid(b.x, b.y + 1, arm); }
    if (corner) { solid(b.x - 1, b.y - 1, corner); solid(b.x + 1, b.y - 1, corner); solid(b.x - 1, b.y + 1, corner); solid(b.x + 1, b.y + 1, corner); }
    if (gk) { p.glow(b.x + 0.5, b.y + 0.5, gk > 0.3 ? 7 : 4.5, gk > 0.3 ? C.neon[1] : PINK_LIGHT, gk); pink += gk > 0.3 ? 2 : 1; }
    // 电流的头：刚点亮的灯泡和上一个之间拉一道电弧
    const a = t - b.ta;
    if (a >= 0 && a < 1 / 15 && b.from) {
      const r = new Rng(f * 131 + i);
      p.polyline(bolt(r, b.from.x + 0.5, b.from.y + 0.5, b.x + 0.5, b.y + 0.5, { jag: b.jump ? 0.35 : 0.25, depth: b.jump ? 3 : 2 }), C.bolt[1]);
      p.glowLine(b.from.x, b.from.y, b.x, b.y, 5, C.bolt[2], 0.3);
    }
  }
  if (pink) {
    const k = Math.min(1.6, pink / bulbs.length);
    p.glow(160, 74, 110, PINK_LIGHT, 0.16 * k);
    p.glow(160, 112, 70, PINK_LIGHT, 0.12 * k);
  }
  // 浪涌：一圈光从招牌推出去
  const ts = t - T_SURGE;
  if (ts >= 0 && ts < 0.35) {
    p.glowRing(160, 72, 20 + ts * 420, 10, PINK_LIGHT, 0.5 * (1 - ts / 0.35));
    p.glow(160, 72, 90, C.neon[1], 0.35 * (1 - ts / 0.35) ** 2);
  }

  // 副标题：从上方 8 px 砸下来，落地白一帧
  for (const s of SUB) {
    const a = t - s.tl;
    if (a < -2 / 30 - 1e-6) continue;
    let c, dy = 0;
    if (a < -1e-6) (c = C.cyan[1]), (dy = a < -1 / 30 - 1e-6 ? -9 : -4);
    else if (a < 1 / 30) c = C.cyan[0];
    else if (a < 3 / 30) c = C.cyan[1];
    else c = C.cyan[2];
    let on = true;
    if (t >= T_DIP + 1 / 30 && t < T_BACK) (c = C.cyan[3]), (on = false);
    if (t >= T_BACK && t < T_BACK + 1 / 30) c = C.cyan[0];
    s.g.rows.forEach((row, r) => [...row].forEach((ch, col) => ch === "#" && solid(s.x + col, s.y + r + dy, c)));
    if (a >= 0 && a < 1 / 30) for (const sg of [-1, 1]) { solid(s.x + (sg < 0 ? -1 : s.g.w), s.y + 9, C.cyan[1]); solid(s.x + (sg < 0 ? -2 : s.g.w + 1), s.y + 8, C.cyan[2]); }
    if (on && a >= 0) p.glow(s.x + s.g.w / 2, s.y + 6, 9, CYAN_LIGHT, a < 0.1 ? 0.4 : 0.12);
  }

  // 闪电一：先导三帧往下爬，英雄帧之后按色阶退，中间再劈一次
  if (f >= F.leader && f < F.hero) {
    const n = Math.floor(BOLT.length * [0.35, 0.6, 0.85][f - F.leader]);
    p.polyline(BOLT.slice(0, n), C.bolt[2]);
    p.glow(BOLT[n - 1][0], BOLT[n - 1][1], 8, C.bolt[2], 0.5);
  }
  const drawBolt = (path, fks, col, k) => {
    p.polyline(path.map(([x, y]) => [x + 1, y]), C.bolt[Math.min(3, col + 1)]);
    p.polyline(path, C.bolt[col]);
    if (col === 0) p.polyline(path.map(([x, y]) => [x - 1, y]), C.bolt[1]);
    if (col <= 1) for (const fk of fks) p.polyline(fk, C.bolt[col + 1]);
    for (let i = 1; i < path.length; i += 3) p.glowLine(path[i - 1][0], path[i - 1][1], path[i][0], path[i][1], 8, FLASH_LIGHT, k);
  };
  const t1 = t - T_STRIKE;
  const c1 = t1 < 0 ? null : t1 < 0.07 ? 0 : t1 < 0.1 ? 1 : t1 < 0.13 ? null : t1 < 0.18 ? 0 : t1 < 0.23 ? 2 : t1 < 0.28 ? 3 : null;
  if (c1 !== null) { drawBolt(BOLT, FORKS, c1, c1 === 0 ? 0.22 : 0.1); p.glow(ROD.x, ROD.top, 26, C.bolt[1], c1 === 0 ? 0.45 : 0.2); }
  const t2 = t - T_STRIKE2;
  const c2 = t2 < 0 ? null : t2 < 0.07 ? 0 : t2 < 0.12 ? 1 : t2 < 0.17 ? 2 : t2 < 0.22 ? 3 : null;
  if (c2 !== null) drawBolt(BOLT2, FORKS2, c2, c2 === 0 ? 0.2 : 0.08);

  // 大雨滴
  const td = t - T_DROP;
  if (td > -0.27 && td < 0) {
    const y = 160 + td * 700;
    p.line(160, y - 9, 160, y, C.rain[2]);
    p.line(161, y - 5, 161, y, C.cyan[1]);
  }

  // 倒影：地面以下每行取上方 2.2 行处的像素，按整像素左右摆；大雨滴的水纹把它推开
  for (let sy = 0; sy < H; sy++) {
    const wy = sy + cam.y;
    if (wy < HORIZON) continue;
    const d = wy - HORIZON, srcY = HORIZON - 1 - Math.floor(d * 2.2) - cam.y, gap = d > 6 && d % 5 === 4;
    for (let sx = 0; sx < W; sx++) {
      const wx = sx + cam.x;
      let dx = Math.round(Math.sin(d * 0.9 + t * 7 + Math.floor(wx / 40)) * (0.4 + d * 0.06));
      if (td > 0 && td < 1) {
        const e = Math.hypot(wx - 160, (wy - 160) / 0.32), ring = e - td * 110;
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
      } else if (gap) mask[sy * W + sx] = 1;
      Cc[sy * W + sx] = gap ? C.sky[0] : c;
      if (l) p.add(sx, sy, l, 0.5);
    }
  }
  { const sy = HORIZON - cam.y; if (sy >= 0 && sy < H) for (let x = 0; x < W; x++) Cc[sy * W + x] = C.sky[3]; }

  // 雨和水圈
  for (const d of DROPS) {
    const s = dropAt(d, t);
    if (s.land < 0) {
      const len = d.len, c0 = d.near ? C.rain[1] : C.rain[0], c1 = d.near ? C.rain[0] : C.sky[3];
      p.line(s.x - len * SLANT, s.y - len, s.x - len * SLANT * 0.5, s.y - len * 0.5, c1);
      p.line(s.x - len * SLANT * 0.5, s.y - len * 0.5, s.x, s.y, c0);
    } else if (s.y > HORIZON && d.near) {
      const a = s.land, rx = 1 + a * 15, ry = Math.max(1, rx * 0.3), n = Math.ceil(rx * 2.5);
      const c = a < 0.08 ? C.rain[2] : a < 0.18 ? C.rain[1] : C.rain[0];
      for (let k = 0; k < n; k++) { const g = (k / n) * Math.PI * 2; p.dot(s.x + Math.cos(g) * rx, s.y + Math.sin(g) * ry, c, 1 - a * 2.4); }
      if (a < 0.12) for (const sg of [-1, 1]) p.dot(s.x + sg * a * 22, s.y - (a * 60 - a * a * 320), C.rain[2]);
    }
  }
  if (td >= 0 && td < 1) {
    for (const [j, dl] of [0, 0.08, 0.16].entries()) {
      const a = td - dl;
      if (a < 0) continue;
      const rx = 3 + a * 100, ry = rx * 0.3, n = Math.ceil(rx * 3);
      const c = a < 0.1 ? C.cyan[0] : a < 0.25 ? C.cyan[1] : a < 0.45 ? C.neon[2] : C.rain[1];
      for (let k = 0; k < n; k++) { const g = (k / n) * Math.PI * 2; p.dot(160 + Math.cos(g) * rx, 160 + Math.sin(g) * ry, c, 1 - a * 1.4); }
      if (j === 0) p.glowRing(160, 160, rx * 0.6, 6, CYAN_LIGHT, 0.3 * (1 - a));
    }
    if (td < 0.3) for (let k = 0; k < 7; k++) p.dot(160 + (k - 3) * 22 * td, 160 - ((60 + (k % 2) * 25) * td - 260 * td * td), k % 2 ? C.cyan[1] : C.cyan[0]);
  }

  sparksBlue.draw(p, "front"); sparksPink.draw(p, "front");
  lights.draw(p);

  // 英雄帧：黑白反相，只留轮廓和灯泡的白点
  if (f === F.hero) {
    for (let i = 0; i < W * H; i++) { Cc[i] = mask[i] ? C.ink : C.bolt[1]; L[i] = 0; }
    const q = painterFor(frame); q.place(-cam.x, -cam.y);
    q.polyline(BOLT, C.ink); q.polyline(BOLT.map(([x, y]) => [x + 1, y]), C.ink);
    for (const fk of FORKS) q.polyline(fk, C.ink);
    for (const b of bulbs) { const x = b.x - cam.x, y = b.y - cam.y; if (x >= 0 && y >= 0 && x < W && y < H) Cc[y * W + x] = C.bolt[0]; }
  }
  // 第二道雷：天空整片变成闪电蓝一帧，楼和招牌不变
  if (f === F.strike2) for (let i = 0; i < W * H; i++) if (!mask[i]) Cc[i] = C.bolt[2];

  composite(frame, rgba, C.ink);
  return rgba;
}

// 放大：整数倍率最近邻，裁到 1920 × 1080
const big = new Uint32Array(OW * OH), src32 = new Uint32Array(rgba.buffer);
function upscale(v) {
  const vw = OW / v.s, vh = OH / v.s;
  const ox = Math.floor(clamp(Math.round(v.cx - vw / 2), 0, W - vw)), oy = Math.floor(clamp(Math.round(v.cy - vh / 2), 0, H - vh));
  const xs = new Int32Array(OW);
  for (let x = 0; x < OW; x++) xs[x] = Math.min(W - 1, ox + Math.floor(x / v.s));
  for (let y = 0; y < OH; y++) {
    const row = Math.min(H - 1, oy + Math.floor(y / v.s)) * W, o = y * OW;
    for (let x = 0; x < OW; x++) big[o + x] = src32[row + xs[x]];
  }
  return Buffer.from(big.buffer);
}

// ---------------------------------------------------------------- 模拟 + 出帧
const realOf = (w) => { for (let f = 0; f <= N; f++) if (tw(f) >= w - 1e-6) return f / FPS; return N / FPS; };
const cues = {
  fps: FPS, frames: N, bpm: 150, beat0: F.release / FPS,
  leader: F.leader / FPS, strike: F.hero / FPS, freeze: 3 / FPS, charge: [0, F.hero / FPS],
  bulbs: [...new Set(bulbs.map((b) => b.ta))].sort((a, b) => a - b).map(realOf),
  chars: [0, 1].map((ci) => realOf(Math.max(...bulbs.filter((b) => b.ci === ci).map((b) => b.ta)))),
  surge: F.surge / FPS, sub: SUB.map((s) => s.fl / FPS),
  strike2: F.strike2 / FPS, relight: [...new Set(bulbs.map((b) => b.re))].sort((a, b) => a - b).map(realOf), back: F.back / FPS,
  drop: F.drop / FPS, flashes: [tw(8)],
};

const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${OW}x${OH}`, "-framerate", String(FPS), "-i", "-",
  "-vf", "format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-tune", "animation",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", join(OUT, "video.mp4")], { stdio: ["pipe", "inherit", "inherit"] });
const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once("drain", res)));

let prevT = 0;
const spawned = new Set();
for (let f = 0; f < N; f++) {
  const t = tw(f), dt = t - prevT;
  prevT = t;
  if (f === F.hero + 1 && !spawned.has("s1")) {
    spawned.add("s1");
    for (let i = 0; i < 40; i++) { const a = SR.range(-Math.PI, 0.2), sp = SR.range(80, 300); sparksBlue.spawn(P.SPARK, ROD.x, ROD.top + 2, Math.cos(a) * sp, Math.sin(a) * sp, SR.range(0.35, 0.9)); }
    lights.add(ROD.x, ROD.top, 56, "#cfe8ff", 0.6, 0.45);
  }
  for (const [i, b] of bulbs.entries()) if (t >= b.ta && !spawned.has(i)) {
    spawned.add(i);
    if (rand(i, 808) < 0.22) for (let k = 0; k < 3; k++) { const a = SR.range(-Math.PI * 0.9, -Math.PI * 0.1), sp = SR.range(50, 160); sparksPink.spawn(P.SPARK, b.x, b.y, Math.cos(a) * sp, Math.sin(a) * sp, SR.range(0.3, 0.6)); }
  }
  if (f === F.surge && !spawned.has("surge")) {
    spawned.add("surge");
    for (let i = 0; i < 48; i++) {
      const u = SR.next() * 2 * (BOARD.w + BOARD.h);
      const [x, y] = u < BOARD.w ? [BOARD.x + u, BOARD.y] : u < BOARD.w + BOARD.h ? [BOARD.x + BOARD.w, BOARD.y + u - BOARD.w] : u < 2 * BOARD.w + BOARD.h ? [BOARD.x + u - BOARD.w - BOARD.h, BOARD.y + BOARD.h] : [BOARD.x, BOARD.y + u - 2 * BOARD.w - BOARD.h];
      const a = Math.atan2(y - 72, x - 160) + SR.range(-0.4, 0.4), sp = SR.range(90, 260);
      sparksPink.spawn(P.SPARK, x, y, Math.cos(a) * sp, Math.sin(a) * sp - 60, SR.range(0.4, 0.9));
    }
    lights.add(160, 72, 120, "#ff9cf0", 0.5, 0.4);
  }
  if (f === F.strike2 + 1 && !spawned.has("s2")) { spawned.add("s2"); lights.add(262, B2T.top, 60, "#cfe8ff", 0.5, 0.35); }
  if (f === F.back && !spawned.has("back")) { spawned.add("back"); lights.add(160, 72, 100, "#ff9cf0", 0.4, 0.3); }
  if (f === F.drop && !spawned.has("drop")) { spawned.add("drop"); lights.add(160, 158, 44, "#bff4ff", 0.6, 0.35); }
  for (const sys of [sparksBlue, sparksPink, lights]) {
    const n = Math.max(1, Math.ceil(dt * 120 - 1e-9));
    if (dt > 0) for (let k = 0; k < n; k++) sys.update(dt / n);
  }
  drawFrame(f);
  await write(upscale(viewAt(f)));
}
ff.stdin.end();
await new Promise((res) => ff.on("close", res));
writeFileSync(join(OUT, "cues.json"), JSON.stringify(cues, null, 1));
console.error(`bulbs ${bulbs.length}, levels ${MAXLV}, palette ${PALETTE.length}, frames ${N}`);
