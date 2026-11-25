// 像素风 · 全片（18.7 秒，150 BPM：一拍正好 12 帧）
//
// 世界是 320 × 180 的整数像素网格。镜头只用整数倍率：开场 12 倍特写招牌，落雷后 12 → 10 → 8 → 6 倍
// 一级一级跳出去，最近邻放大到 1920 × 1080。
// 换章是“钻进一格”：镜头 24 → 96 → 384 倍钻进某个像素，再从下一块板的一个像素里退出来。
// 中间四块板（色阶、整数倍率、卡帧、像素气象台）见 boards.mjs；最后回到招牌，第三道雷，落水，署名。
//
// 规矩：
//   1. 落格：所有东西落在整数格上。形（灯泡、云、窗、镜头倍率）按 15 fps 走阶梯，光、雨和火花按 30 fps 走满帧。
//   2. 卡帧：撞击时世界停住。落雷：反相英雄帧 1 帧 + 冻结 3 帧并按整像素震；第二道雷：冻结 1 帧。
//   3. 色阶：颜色只在色板里跳。灯泡白热 → 浅粉 → 粉 → 霓虹，一阶一阶冷下来；亮度交给叠加光层。
//
// 绘制层和粒子来自 pixelfx（MIT，见 vendor/pixelfx/LICENSE 与 NOTICE.md）：
// color 缓冲只放不透明像素，light 缓冲叠加发光，最后 composite 合成。
//
// 用法：node film.mjs <输出目录> [--preview 步长] [--frames 起-止]
//   写出 video.mp4（1920 × 1080，无声）和 cues.json（给配乐用的时间点，单位秒，真实时间）。
//   --preview n：不出视频，每 n 帧存一张 960 × 540 的 PNG 到 <输出目录>/preview/（审片用）。
//   --frames a-b：只存这一段的 PNG（全尺寸）。模拟照样从第 0 帧走，所以粒子和出片时一模一样。

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { makeBoards } from "./boards.mjs";
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
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const PREVIEW = arg("--preview") ? Number(arg("--preview")) : 0;
const RANGE = arg("--frames") ? arg("--frames").split("-").map(Number) : null;

const W = 320, H = 180, FPS = 30, N = 562, OW = 1920, OH = 1080;
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
  die: 6, // 开场霓虹亮着，接触不良闪两下，第 6 帧断电
  leader: 15, hero: 18, release: 22, // 先导 15–17，英雄帧 18，冻结 19–21
  flowEnd: 40, // 电流爬完两个字
  surge: 46, // 第 3 拍：浪涌
  sub: 46, // 副标题第一个字母（之后每 3 帧一个）
  strike2: 82, // 第 6 拍：第二道雷，第 83 帧冻结
  relight: 86, back: 94, // 断电，86 起从右往左重新点亮，94（第 7 拍）全亮
  drop: 106, // 第 8 拍：大雨滴落进积水，灯跑一遍；第 9 拍镜头钻进一个灯泡
  // 板 4（卡帧）：落雷 322，冻结 323–325；次要撞击 346，冻结 347
  hero4: 322, hero4b: 346,
  // 收尾：回到招牌特写，第三道雷（先导 499–501，英雄帧 502，冻结 503–505），松开 506 浪涌，
  // 526 署名，538 最后一滴雨落进积水
  leader3: 499, hero3: 502, release3: 506, sig: 526, drop2: 538,
};
const FROZEN = new Set([19, 20, 21, 83, 323, 324, 325, 347, 503, 504, 505]);
// 世界时间：冻结的帧不走
const TW = []; for (let f = 0, k = 0; f <= N; f++) { if (FROZEN.has(f)) k++; TW[f] = (f - k) / FPS; }
const tw = (f) => TW[f];
const step15 = (t) => Math.floor(t * 15 + 1e-6) / 15;
const HORIZON = 138;

// 段落（真实帧号）。每段都从拍上开始：第 b 拍 = 22 + 12b。
const SEG = {
  zoom1: 118, // 第 8 拍：钻进一个灯泡（24 → 96 → 384 → 1536 倍，每级 3 帧）
  fill: 130, // 第 9 拍：那一格占满全屏，按霓虹色阶一阶一阶冷下来（每 2 帧一阶）
  b2: 142, t2: 214, b3: 226, t3: 298, b4: 310, t4: 382, b5: 394, t5: 478, end: 490,
};

// 镜头：整数倍率 + 中心。卡帧时按整像素震。
function viewAt(f) {
  let s = f < 25 ? 12 : f < 28 ? 10 : f < 31 ? 8 : 6;
  if (f >= SEG.end) s = f < F.release3 ? 12 : f < F.release3 + 3 ? 10 : f < F.release3 + 6 ? 8 : 6; // 收尾：和开场一样从 12 倍跳出去
  if (f === F.surge || f === F.surge + 1 || f === F.back || f === F.drop || f === F.drop2) s = 7; // 重拍上往前冲一下
  const cy = { 12: 58, 10: 66, 8: 76, 7: 86, 6: 90 }[s];
  return { s, cx: 160, cy };
}
function shakeAt(f) {
  for (const h of [F.hero, F.hero3, F.hero4]) {
    const k = f - h - 1;
    if (k >= 0 && k < 3) return { x: [3, -2, 1][k], y: [-1, 1, -1][k] };
  }
  if (f === F.hero4b + 1) return { x: -1, y: 1 };
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
const T_DIE = tw(F.die), T_SURGE = tw(F.surge), T_DIP = tw(F.strike2 + 1), T_BACK = tw(F.back), T_DROP = tw(F.drop);
const T_SURGE3 = tw(F.release3), DROPS_T = [T_DROP, tw(F.drop2)];
// 镜头钻进去的那个灯泡（“素”字中间），和收尾时镜头退出来的那个（“像”字中间）
const nearestBulb = (x, y) => bulbs.reduce((a, b) => (Math.hypot(b.x - x, b.y - y) < Math.hypot(a.x - x, a.y - y) ? b : a));
const ZOOM_BULB = nearestBulb(184, 70), END_BULB = nearestBulb(136, 70);
BUZZ.delete(ZOOM_BULB); BUZZ.delete(END_BULB);

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
// 开场那道闪电：第 0 帧一道云间闪电横穿招牌上方的天空（不落地，不碰招牌）
const BOLT0 = bolt(new Rng(1), 64, 22, 256, 14, { jag: 0.14, depth: 6 });
const FORKS0 = forks(new Rng(46), BOLT0, { count: 9, len: 16, jag: 0.45, spread: 1.1 });
// 云里的闪。第一道在 0 帧之前，所以封面里的云是亮的。
const FLASHES = [
  { t: -0.02, x: 160, y: 10, k: 1.7, d: 0.12 },
  { t: tw(10), x: 100, y: -10, k: 0.5, d: 0.06 },
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
  const OFF = [C.neon[5], 0, 0, 0], DEAD = [C.neon[5], 0, 0, 0];
  const cool = (a) =>
    a < 1 / 15 ? [C.neon[0], C.neon[0], C.neon[1], 0.6] :
    a < 2 / 15 ? [C.neon[0], C.neon[1], C.neon[2], 0.38] :
    a < 3 / 15 ? [C.neon[1], C.neon[2], C.neon[3], 0.22] : [C.neon[2], C.neon[3], C.neon[4], 0.12];
  // 开场：霓虹本来亮着，暴雨里接触不良，第 6 帧断电，按色阶一阶阶暗下去
  if (t < T_DIE) {
    const fr = Math.round(t * FPS);
    if (fr <= 1) return [C.neon[1], C.neon[2], C.neon[3], 0.3]; // 闪电照着的那两帧最亮
    if (fr === 2) return [C.neon[3], C.neon[4], 0, 0.06];
    if (fr === 4 && rand(i, 55) < 0.45) return DEAD;
    if (fr === 5) return [C.neon[0], C.neon[1], C.neon[3], 0.45];
    return [C.neon[2], C.neon[3], C.neon[4], 0.2];
  }
  if (t < T_DIE + 1 / 30) return [C.neon[3], C.neon[4], C.neon[5], 0.07];
  if (t < T_DIE + 2 / 30) return [C.neon[4], C.neon[5], 0, 0.02];
  if (t < b.ta) return OFF;
  if (t >= T_DIP && t < b.re) return t < T_DIP + 1 / 30 ? [C.neon[0], C.neon[1], 0, 0.5] : DEAD; // 断电前最后一闪
  for (const ts of [T_SURGE, T_SURGE3])
    if (t >= ts && t < ts + 2 / 15 && (ts !== T_SURGE || t < T_DIP)) return t < ts + 1 / 15 ? [C.neon[0], C.neon[0], C.neon[0], 0.7] : [C.neon[0], C.neon[1], C.neon[2], 0.4];
  const a = t >= b.re ? t - b.re : t - b.ta;
  for (const td of DROPS_T) {
    const chase = t - td - b.col * (1 / 60);
    if (chase >= 0 && chase < 1 / 15) return [C.neon[0], C.neon[1], C.neon[3], 0.45];
  }
  if (a > 0.5 && BUZZ.has(b) && Math.floor(step15(t) * 15 + i) % 11 < 2) return DEAD;
  return cool(a);
}

function drawSign(f) {
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

  // 开场那道远处的闪电：白两帧，然后按色阶退
  if (f < 5) {
    const col = [0, 0, 1, 2, 3][f];
    p.polyline(BOLT0.map(([x, y]) => [x + 1, y]), C.bolt[Math.min(3, col + 1)]);
    p.polyline(BOLT0, C.bolt[col]);
    if (col <= 1) for (const fk of FORKS0) p.polyline(fk, C.bolt[col + 1]);
    for (let i = 1; i < BOLT0.length; i += 3) p.glowLine(BOLT0[i - 1][0], BOLT0[i - 1][1], BOLT0[i][0], BOLT0[i][1], 10, FLASH_LIGHT, col === 0 ? 0.25 : 0.1);
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
  const dark = (t >= T_DIE + 1 / 30 && t < FLOW0) || (t >= T_DIP + 1 / 30 && t < T_BACK);
  const surge = t >= T_SURGE && t < T_SURGE + 1 / 15;
  const rim = dark ? C.sky[3] : surge ? C.neon[0] : t < tw(F.flowEnd) ? C.neon[step15(t) * 15 % 2 ? 4 : 3] : C.neon[3];
  for (let x = BOARD.x; x < BOARD.x + BOARD.w; x++) { solid(x, BOARD.y, rim); solid(x, BOARD.y + BOARD.h - 1, rim); }
  for (let y = BOARD.y; y < BOARD.y + BOARD.h; y++) { solid(BOARD.x, y, rim); solid(BOARD.x + BOARD.w - 1, y, rim); }
  for (let x = BOARD.x + 2; x < BOARD.x + BOARD.w - 2; x++) { solid(x, BOARD.y + 2, C.sky[2]); solid(x, BOARD.y + BOARD.h - 3, C.sky[2]); }
  for (let y = ROD.top; y < BOARD.y; y++) solid(ROD.x, y, C.sky[4]);
  solid(ROD.x - 1, ROD.top + 1, C.sky[4]); solid(ROD.x + 1, ROD.top + 1, C.sky[4]);

  // 蓄电：落雷前避雷针尖上爬着越来越多的小电弧
  if (f >= F.die && f < F.hero) {
    const charge = (f - F.die) / (F.hero - F.die), st = Math.floor(step15(t) * 15);
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
    let [core, arm, corner, gk] = bulbLook(b, i, t);
    if (b === ZOOM_BULB && f >= SEG.zoom1 - 3 && f < SEG.fill) [core, arm, corner, gk] = [C.neon[0], C.neon[1], C.neon[2], 0.6]; // 镜头钻进去时它正烧白
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
  for (const T0 of [T_SURGE, T_SURGE3]) {
    const ts = t - T0;
    if (ts >= 0 && ts < 0.35) {
      p.glowRing(160, 72, 20 + ts * 420, 10, PINK_LIGHT, 0.5 * (1 - ts / 0.35));
      p.glow(160, 72, 90, C.neon[1], 0.35 * (1 - ts / 0.35) ** 2);
    }
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
  for (const [L0, H0] of [[F.leader, F.hero], [F.leader3, F.hero3]]) if (f >= L0 && f < H0) {
    const n = Math.floor(BOLT.length * [0.35, 0.6, 0.85][f - L0]);
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
  for (const T1 of [T_STRIKE, tw(F.hero3)]) {
    const t1 = t - T1;
    const c1 = t1 < 0 ? null : t1 < 0.07 ? 0 : t1 < 0.1 ? 1 : t1 < 0.13 ? null : t1 < 0.18 ? 0 : t1 < 0.23 ? 2 : t1 < 0.28 ? 3 : null;
    if (c1 !== null) { drawBolt(BOLT, FORKS, c1, c1 === 0 ? 0.22 : 0.1); p.glow(ROD.x, ROD.top, 26, C.bolt[1], c1 === 0 ? 0.45 : 0.2); }
  }
  const t2 = t - T_STRIKE2;
  const c2 = t2 < 0 ? null : t2 < 0.07 ? 0 : t2 < 0.12 ? 1 : t2 < 0.17 ? 2 : t2 < 0.22 ? 3 : null;
  if (c2 !== null) drawBolt(BOLT2, FORKS2, c2, c2 === 0 ? 0.2 : 0.08);

  // 大雨滴：两次（第 8 拍、收尾）。水纹取最近落下的那一滴
  const td = DROPS_T.map((T0) => t - T0).filter((x) => x > -0.27).sort((a, b) => a - b)[0] ?? -1;
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
  if (f === F.hero || f === F.hero3) {
    for (let i = 0; i < W * H; i++) { Cc[i] = mask[i] ? C.ink : C.bolt[1]; L[i] = 0; }
    const q = painterFor(frame); q.place(-cam.x, -cam.y);
    q.polyline(BOLT, C.ink); q.polyline(BOLT.map(([x, y]) => [x + 1, y]), C.ink);
    for (const fk of FORKS) q.polyline(fk, C.ink);
    for (const b of bulbs) { const x = b.x - cam.x, y = b.y - cam.y; if (x >= 0 && y >= 0 && x < W && y < H) Cc[y * W + x] = C.bolt[0]; }
  }
  // 第二道雷：天空整片变成闪电蓝一帧，楼和招牌不变
  if (f === F.strike2) for (let i = 0; i < W * H; i++) if (!mask[i]) Cc[i] = C.bolt[2];

  // 署名：落在右下角的积水上，和副标题一样砸下来
  if (f >= F.sig - 2) {
    const s = BD.slam(f, F.sig), x = 300 - BD.textW("观默"), y = 162 - cam.y;
    BD.text({ rect: (xx, yy, w, h, c) => { for (let j = yy; j < yy + h; j++) for (let i = xx; i < xx + w; i++) if (i >= 0 && j >= 0 && i < W && j < H) Cc[j * W + i] = c; } }, "观默", x - cam.x, y + s.dy, s.flash ? C.neon[0] : C.cyan[1]);
    p.glow(x + 12, y + 6, s.flash ? 22 : 12, CYAN_LIGHT, s.flash ? 0.4 : 0.12);
  }

  composite(frame, rgba, C.ink);
  return rgba;
}

// ---------------------------------------------------------------- 中段的四块板
const BD = makeBoards({ C, GLYPHS, CYAN_LIGHT, PINK_LIGHT, FLASH_LIGHT });
const BOARDS = [
  { from: SEG.b2, to: SEG.t2, draw: BD.draw2 },
  { from: SEG.b3, to: SEG.t3, draw: BD.draw3 },
  { from: SEG.b4, to: SEG.t4, draw: BD.draw4 },
  { from: SEG.b5, to: SEG.t5, draw: BD.draw5 },
];
// 板上也一直下雨：同一批雨点，只画还在空中的，颜色压到暗的两阶。clip = [x, y, w, h] 时只画在框里（色更亮一阶）
function rainOn(Cc, t, clip) {
  const [cx, cy, cw, ch] = clip ?? [0, 0, W, H];
  for (const d of DROPS) {
    const s = dropAt(d, t);
    if (s.land >= 0) continue;
    const c = clip ? (d.near ? C.rain[0] : C.sky[3]) : d.near ? C.sky[3] : C.sky[2];
    for (let k = 0; k <= d.len; k++) {
      const x = Math.floor(s.x - k * SLANT), y = Math.floor(s.y - k);
      if (x >= cx && y >= cy && x < cx + cw && y < cy + ch) Cc[y * W + x] = c;
    }
  }
}
function drawBoard(bi, f) {
  const B = BOARDS[bi], t = tw(f), k = f - B.from;
  clearFrame(frame);
  mask.fill(0);
  const p = painterFor(frame), Cc = frame.color, L = frame.light;
  const solid = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; Cc[y * W + x] = c; mask[y * W + x] = 1; };
  const rect = (x, y, w, h, c) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) solid(xx, yy, c); };
  const d = { p, solid, rect, Cc, rain: (clip) => rainOn(Cc, t, clip) };
  B.draw(d, k, t);
  // 板 4 的英雄帧：整屏反相，只留轮廓
  if (bi === 2 && f === F.hero4) {
    for (let i = 0; i < W * H; i++) { Cc[i] = mask[i] ? C.ink : C.bolt[1]; L[i] = 0; }
    p.polyline(BD.BOLT4, C.ink); p.polyline(BD.BOLT4.map(([x, y]) => [x + 1, y]), C.ink);
  }
  if (bi === 2 && f === F.hero4b) for (let i = 0; i < W * H; i++) if (!mask[i]) Cc[i] = C.bolt[2];
  composite(frame, rgba, C.ink);
  return rgba;
}
// 第 9 拍：那一格占满全屏，按霓虹色阶冷下来；色值大字跟着跳
function drawFill(f) {
  const i = Math.floor((f - SEG.fill) / 2), c = C.neon[Math.min(5, i)];
  clearFrame(frame);
  frame.color.fill(c);
  const hx = BD.hexOf(c), w = BD.textW(hx, 3);
  BD.text({ rect: (x, y, ww, hh, cc) => { for (let yy = y; yy < y + hh; yy++) for (let xx = x; xx < x + ww; xx++) if (xx >= 0 && yy >= 0 && xx < W && yy < H) frame.color[yy * W + xx] = cc; } },
    hx, Math.round(160 - w / 2), 72, i < 3 ? C.neon[5] : C.neon[0], 3);
  composite(frame, rgba, C.ink);
  return rgba;
}

// 放大：整数倍率最近邻，裁到 1920 × 1080。
// 普通镜头把左上角取整并夹在画布里；钻进某一格时（v.free）让那一格正好在画面中心，超出画布的地方取边上的像素。
const big = new Uint32Array(OW * OH), src32 = new Uint32Array(rgba.buffer);
function upscale(v) {
  const vw = OW / v.s, vh = OH / v.s;
  const ox = v.free ? v.cx - vw / 2 : Math.floor(clamp(Math.round(v.cx - vw / 2), 0, W - vw));
  const oy = v.free ? v.cy - vh / 2 : Math.floor(clamp(Math.round(v.cy - vh / 2), 0, H - vh));
  const xs = new Int32Array(OW);
  for (let x = 0; x < OW; x++) xs[x] = clamp(Math.floor(ox + (x + 0.5) / v.s), 0, W - 1);
  for (let y = 0; y < OH; y++) {
    const row = clamp(Math.floor(oy + (y + 0.5) / v.s), 0, H - 1) * W, o = y * OW;
    for (let x = 0; x < OW; x++) big[o + x] = src32[row + xs[x]];
  }
  return Buffer.from(big.buffer);
}
const zoomOn = ([x, y], s) => ({ s, cx: x + 0.5, cy: y + 0.5, free: true });
const BOARD_VIEW = { s: 6, cx: 160, cy: 90 };
const STEPS_IN = [24, 96, 384], STEPS_OUT = [384, 96, 24]; // 每级 2 帧（15 fps，和“形”同一个帧率）

// 每一帧画什么、镜头在哪
function plan(f) {
  if (f < SEG.zoom1) return { kind: "sign", view: viewAt(f) };
  if (f < SEG.fill) return { kind: "sign", view: zoomOn([ZOOM_BULB.x, ZOOM_BULB.y], [24, 96, 384, 1536][Math.floor((f - SEG.zoom1) / 3)]) };
  if (f < SEG.b2) return { kind: "fill", view: BOARD_VIEW };
  const trans = [
    [SEG.t2, 0, BD.target.b2In, 1, BD.target.b3Out],
    [SEG.t3, 1, BD.target.b3In, 2, BD.target.b4Out],
    [SEG.t4, 2, BD.target.b4In, 3, BD.target.b5Out],
    [SEG.t5, 3, BD.target.b5In, -1, [END_BULB.x, END_BULB.y]],
  ];
  for (const [T, a, inPx, b, outPx] of trans) {
    if (f >= T && f < T + 6) return { kind: "board", bi: a, view: zoomOn(inPx, STEPS_IN[Math.floor((f - T) / 2)]) };
    if (f >= T + 6 && f < T + 12) {
      const view = zoomOn(outPx, STEPS_OUT[Math.floor((f - T - 6) / 2)]);
      return b < 0 ? { kind: "sign", view } : { kind: "board", bi: b, view };
    }
  }
  for (const [bi, B] of BOARDS.entries()) if (f >= B.from && f < B.to) {
    const sh = shakeAt(f);
    return { kind: "board", bi, view: { s: 6, cx: 160 - sh.x, cy: 90 - sh.y, free: true } };
  }
  return { kind: "sign", view: viewAt(f) };
}

// ---------------------------------------------------------------- 模拟 + 出帧
const realOf = (w) => { for (let f = 0; f <= N; f++) if (tw(f) >= w - 1e-6) return f / FPS; return N / FPS; };
const cues = {
  fps: FPS, frames: N, bpm: 150, beat0: F.release / FPS,
  leader: F.leader / FPS, strike: F.hero / FPS, freeze: 3 / FPS, charge: [F.die / FPS, F.hero / FPS], die: F.die / FPS, flicker: [2 / FPS, 4 / FPS, 5 / FPS], bolt0: 0,
  bulbs: [...new Set(bulbs.map((b) => b.ta))].sort((a, b) => a - b).map(realOf),
  chars: [0, 1].map((ci) => realOf(Math.max(...bulbs.filter((b) => b.ci === ci).map((b) => b.ta)))),
  surge: F.surge / FPS, sub: SUB.map((s) => s.fl / FPS),
  strike2: F.strike2 / FPS, relight: [...new Set(bulbs.map((b) => b.re))].sort((a, b) => a - b).map(realOf), back: F.back / FPS,
  drop: F.drop / FPS, flashes: [tw(8)],
  // 全片新增
  zoom1: [0, 3, 6, 9].map((k) => (SEG.zoom1 + k) / FPS),
  fill: [0, 2, 4, 6, 8, 10].map((k) => (SEG.fill + k) / FPS),
  trans: [SEG.t2, SEG.t3, SEG.t4, SEG.t5].map((T) => T / FPS),
  boards: { b2: SEG.b2 / FPS, b3: SEG.b3 / FPS, b4: SEG.b4 / FPS, b5: SEG.b5 / FPS, end: SEG.end / FPS },
  text: [
    ...BD.textCues.b2.map((k) => (SEG.b2 + k) / FPS),
    ...BD.textCues.b3.map((k) => (SEG.b3 + k) / FPS),
    ...BD.textCues.b4.map((k) => (SEG.b4 + k) / FPS),
    ...BD.textCues.b5.map((k) => (SEG.b5 + k) / FPS),
  ].sort((a, b) => a - b),
  heat: [24, 36, 48, 60].map((k) => (SEG.b2 + k) / FPS),
  wrong: (SEG.b3 + 27) / FPS,
  bar: Array.from({ length: 11 }, (_, i) => (SEG.b5 + 12 + i * 2) / FPS),
  press: (SEG.b5 + BD.B5.press) / FPS,
  strikes: [{ t: F.hero4 / FPS, big: 0.8 }, { t: F.hero4b / FPS, big: 0.45 }, { t: F.hero3 / FPS, big: 1 }],
  leaders: [(F.hero4 - 3) / FPS, F.leader3 / FPS],
  charge3: [SEG.b4 / FPS, F.hero4 / FPS],
  freezes: [[F.hero4, F.hero4 + 4], [F.hero4b, F.hero4b + 2], [F.hero3, F.hero3 + 4]].map(([a, b]) => [a / FPS, b / FPS]),
  surge3: F.release3 / FPS, zoom3: [F.release3, F.release3 + 3, F.release3 + 6].map((f) => f / FPS),
  sig: F.sig / FPS, drop2: F.drop2 / FPS,
};

const ff = PREVIEW || RANGE ? { stdin: { write: () => true, end() {}, once() {} }, on: (e, cb) => cb() } : spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${OW}x${OH}`, "-framerate", String(FPS), "-i", "-",
  "-vf", "format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-tune", "animation",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", join(OUT, "video.mp4")], { stdio: ["pipe", "inherit", "inherit"] });
const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once("drain", res)));

let prevT = 0;
const spawned = new Set();
const sel = (f) => (RANGE ? f >= RANGE[0] && f <= RANGE[1] : PREVIEW ? f % PREVIEW === 0 : true);
const PNG = PREVIEW || RANGE;
if (PNG) mkdirSync(join(OUT, "preview"), { recursive: true });
const savePng = (buf, f) => new Promise((res, rej) => {
  const q = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${OW}x${OH}`, "-i", "-",
    ...(RANGE ? [] : ["-vf", "scale=960:540:flags=neighbor"]), join(OUT, "preview", `${String(f).padStart(4, "0")}.png`)], { stdio: ["pipe", "inherit", "inherit"] });
  q.on("close", (c) => (c ? rej(new Error("ffmpeg " + c)) : res()));
  q.stdin.end(buf);
});
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
  if (f === F.hero4 + 4 && !spawned.has("b4")) { spawned.add("b4"); BD.spawn4(SR); }
  if (f === F.hero3 + 1 && !spawned.has("s3")) {
    spawned.add("s3");
    for (let i = 0; i < 40; i++) { const a = SR.range(-Math.PI, 0.2), sp = SR.range(80, 300); sparksBlue.spawn(P.SPARK, ROD.x, ROD.top + 2, Math.cos(a) * sp, Math.sin(a) * sp, SR.range(0.35, 0.9)); }
    lights.add(ROD.x, ROD.top, 56, "#cfe8ff", 0.6, 0.45);
  }
  if (f === F.release3 && !spawned.has("surge3")) {
    spawned.add("surge3");
    for (let i = 0; i < 48; i++) {
      const u = SR.next() * 2 * (BOARD.w + BOARD.h);
      const [x, y] = u < BOARD.w ? [BOARD.x + u, BOARD.y] : u < BOARD.w + BOARD.h ? [BOARD.x + BOARD.w, BOARD.y + u - BOARD.w] : u < 2 * BOARD.w + BOARD.h ? [BOARD.x + u - BOARD.w - BOARD.h, BOARD.y + BOARD.h] : [BOARD.x, BOARD.y + u - 2 * BOARD.w - BOARD.h];
      const a = Math.atan2(y - 72, x - 160) + SR.range(-0.4, 0.4), sp = SR.range(90, 260);
      sparksPink.spawn(P.SPARK, x, y, Math.cos(a) * sp, Math.sin(a) * sp - 60, SR.range(0.4, 0.9));
    }
    lights.add(160, 72, 120, "#ff9cf0", 0.5, 0.4);
  }
  if (f === F.drop2 && !spawned.has("drop2")) { spawned.add("drop2"); lights.add(160, 158, 44, "#bff4ff", 0.6, 0.35); }
  for (const sys of [sparksBlue, sparksPink, lights, BD.sparks4]) {
    const n = Math.max(1, Math.ceil(dt * 120 - 1e-9));
    if (dt > 0) for (let k = 0; k < n; k++) sys.update(dt / n);
  }
  const pl = plan(f);
  if (PNG && !sel(f)) continue;
  if (pl.kind === "sign") drawSign(f);
  else if (pl.kind === "fill") drawFill(f);
  else drawBoard(pl.bi, f);
  const buf = upscale(pl.view);
  if (PNG) await savePng(buf, f);
  else await write(buf);
}
ff.stdin.end();
await new Promise((res) => ff.on("close", res));
writeFileSync(join(OUT, "cues.json"), JSON.stringify(cues, null, 1));
console.error(`bulbs ${bulbs.length}, levels ${MAXLV}, palette ${PALETTE.length}, frames ${N}`);
