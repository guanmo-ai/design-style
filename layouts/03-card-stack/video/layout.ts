/**
 * 布局 03 · Card Stack —— 同一批 4 张卡片贯穿全片，在九种「世界」之间变形。
 * 每种世界 = 4 个 Pose（画布坐标 + 深度 / 旋转 / 压暗）。层叠不是手摆的：
 * stack() 按槽位算出 offset、scale、opacity、lift；世界切换用 Bento 同款 REFLOW + stagger。
 */
import {Easing} from 'remotion';
import {E, tween} from '../../../src/lib/anim';

export const DURATION = 1320;
export const FPS = 60;
export const BEAT = 30;

export type LayoutName =
  | 'HOOK'
  | 'KEY'
  | 'IOS'
  | 'NOTE'
  | 'SHEET'
  | 'WALLET'
  | 'STRIPE'
  | 'ISSUE'
  | 'DECK'
  | 'EXPLODE'
  | 'WIRE'
  | 'CROWD'
  | 'FLAT'
  | 'FIX'
  | 'END';

export const familyOf = (name: LayoutName): 'KEY' | 'IOS' | 'STRIPE' | 'DECK' | 'EXPLODE' | 'WIRE' | 'PIT' | 'END' => {
  if (name === 'HOOK' || name === 'KEY' || name === 'FIX') return 'KEY';
  if (name === 'IOS' || name === 'NOTE' || name === 'SHEET' || name === 'WALLET') return 'IOS';
  if (name === 'STRIPE' || name === 'ISSUE') return 'STRIPE';
  if (name === 'DECK') return 'DECK';
  if (name === 'EXPLODE') return 'EXPLODE';
  if (name === 'WIRE') return 'WIRE';
  if (name === 'CROWD' || name === 'FLAT') return 'PIT';
  return 'END';
};

export type Pose = {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  z: number;
  rot: number;
  sc: number;
  o: number;
  dim: number;
  blur: number;
};

const P = (x: number, y: number, w: number, h: number, r: number, extra: Partial<Pose> = {}): Pose => ({
  x,
  y,
  w,
  h,
  r,
  z: 0,
  rot: 0,
  sc: 1,
  o: 1,
  dim: 0,
  blur: 0,
  ...extra,
});

/** 经典层叠：后层往左上露出，顶卡轻抬 + 微旋 + 压暗 */
const stack = (
  ox: number,
  oy: number,
  w: number,
  h: number,
  r: number,
  opt: {sx?: number; sy?: number; sz?: number; lift?: number; rot0?: number; dim?: number; dsc?: number} = {},
): Pose[] => {
  const sx = opt.sx ?? 24;
  const sy = opt.sy ?? 38;
  const sz = opt.sz ?? 36;
  const lift = opt.lift ?? 14;
  const rot0 = opt.rot0 ?? -1.2;
  const dim = opt.dim ?? 0.11;
  const dsc = opt.dsc ?? 0.018;
  return [0, 1, 2, 3].map((i) =>
    P(ox - i * sx, oy - i * sy - (i === 0 ? lift : 0), w, h, r, {
      z: -i * sz,
      rot: i === 0 ? rot0 : i % 2 ? 0.65 : -0.55,
      sc: 1 - i * dsc + (i === 0 ? 0.008 : 0),
      dim: i * dim,
    }),
  );
};

const shrink = (p: Pose, s: number, cx: number, cy: number): Pose => ({
  ...p,
  x: cx + (p.x - 960) * s,
  y: cy + (p.y - 540) * s,
  w: p.w * s,
  h: p.h * s,
  r: Math.max(6, p.r * s),
});

export const PHONE = {x: 1288, y: 78, w: 392, h: 924, r: 56};
export const BROWSER = {x: 72, y: 88, w: 1776, h: 880, r: 18};

const KEY = stack(1110, 292, 680, 380, 28);
const HOOK = stack(620, 340, 680, 380, 28, {lift: 6});
const IOS = [
  P(1308, 292, 352, 548, 32, {z: 40, rot: 0, dim: 0}),
  P(1308, 248, 352, 548, 32, {z: 12, rot: 0.2, dim: 0.12}),
  P(1314, -80, 340, 168, 22, {z: 70, o: 0, dim: 0}),
  P(1308, 920, 352, 400, 28, {z: 80, o: 0.12, dim: 0}),
];
const NOTE = [
  P(1308, 308, 352, 548, 32, {z: 28, dim: 0.22}),
  P(1308, 248, 352, 548, 32, {z: 8, dim: 0.3}),
  P(1314, 122, 340, 172, 22, {z: 80, dim: 0}),
  P(1308, 880, 352, 400, 28, {z: 70, o: 0.22}),
];
const SHEET = [
  P(1308, 292, 352, 548, 32, {z: 18, dim: 0.36}),
  P(1308, 248, 352, 548, 32, {z: 6, dim: 0.42}),
  P(1314, 122, 340, 172, 22, {z: 50, dim: 0.08}),
  P(1308, 348, 352, 430, 28, {z: 90, dim: 0}),
];
const WALLET = [
  P(1308, 236, 352, 548, 32, {z: 16, dim: 0.18}),
  P(1308, 292, 352, 548, 32, {z: 44, dim: 0}),
  P(1314, 36, 340, 172, 22, {z: 10, o: 0.12}),
  P(1308, 820, 352, 400, 28, {z: 8, o: 0.08}),
];
const STRIPE = [
  P(992, 168, 700, 620, 16, {z: 36, rot: 0, dim: 0}),
  P(1010, 132, 664, 620, 16, {z: 16, rot: 0.15, dim: 0.1}),
  P(1026, 102, 632, 620, 16, {z: -2, rot: -0.1, dim: 0.2}),
  P(1040, 76, 604, 620, 16, {z: -18, rot: 0.08, dim: 0.3}),
];
const ISSUE = [
  P(1010, 132, 664, 620, 16, {z: 14, rot: 0.12, dim: 0.14}),
  P(992, 168, 700, 620, 16, {z: 38, rot: 0, dim: 0}),
  P(1026, 102, 632, 620, 16, {z: -2, rot: -0.1, dim: 0.22}),
  P(1040, 76, 604, 620, 16, {z: -18, rot: 0.08, dim: 0.3}),
];
const DECK = [
  P(780, 260, 292, 420, 18, {z: 28, rot: -11, dim: 0}),
  P(930, 286, 292, 420, 18, {z: 12, rot: -2.5, dim: 0.08}),
  P(1080, 314, 292, 420, 18, {z: -4, rot: 7.5, dim: 0.16}),
  P(1230, 348, 292, 420, 18, {z: -20, rot: 16, dim: 0.24}),
];
const EXPLODE = [
  P(700, 148, 560, 292, 22, {z: 48, rot: -2.2, dim: 0}),
  P(880, 318, 560, 292, 22, {z: 16, rot: -0.4, dim: 0.06}),
  P(1060, 488, 560, 292, 22, {z: -16, rot: 1.1, dim: 0.12}),
  P(1240, 658, 560, 292, 22, {z: -48, rot: 2.4, dim: 0.18}),
];
const WIRE = stack(1080, 200, 620, 320, 22, {sx: 40, sy: 62, sz: 48, lift: 18, dim: 0.04, dsc: 0.012});
const CROWD = [
  P(760, 300, 600, 320, 18, {z: 20, rot: -3.5, dim: 0.02}),
  P(820, 268, 600, 320, 18, {z: 8, rot: 2.8, dim: 0.06}),
  P(700, 244, 600, 320, 18, {z: -4, rot: -1.6, dim: 0.1}),
  P(860, 220, 600, 320, 18, {z: -16, rot: 4.2, dim: 0.14}),
];
const FLAT = [0, 1, 2, 3].map((i) => P(780 + i * 8, 360 + i * 5, 640, 340, 16, {z: -i * 2, rot: 0, dim: 0, sc: 1}));
const FIX = stack(700, 280, 680, 380, 28, {sx: 28, sy: 44, lift: 16});
const END = KEY.map((p) => shrink(p, 0.2, 960, 300));

export const LAYOUTS: Record<LayoutName, Pose[]> = {
  HOOK,
  KEY,
  IOS,
  NOTE,
  SHEET,
  WALLET,
  STRIPE,
  ISSUE,
  DECK,
  EXPLODE,
  WIRE,
  CROWD,
  FLAT,
  FIX,
  END,
};

export type Trans = {at: number; to: LayoutName; dur: number; stagger: number; order: number[]};
export const TRANS: Trans[] = [
  {at: 48, to: 'KEY', dur: 46, stagger: 3, order: [0, 1, 2, 3]},
  {at: 150, to: 'IOS', dur: 38, stagger: 3, order: [0, 1, 2, 3]},
  {at: 198, to: 'NOTE', dur: 22, stagger: 2, order: [2, 0, 1, 3]},
  {at: 232, to: 'SHEET', dur: 24, stagger: 2, order: [3, 0, 2, 1]},
  {at: 288, to: 'WALLET', dur: 26, stagger: 2, order: [1, 0, 2, 3]},
  {at: 330, to: 'STRIPE', dur: 40, stagger: 3, order: [0, 1, 3, 2]},
  {at: 438, to: 'ISSUE', dur: 28, stagger: 2, order: [1, 0, 2, 3]},
  {at: 510, to: 'DECK', dur: 42, stagger: 3, order: [3, 2, 1, 0]},
  {at: 690, to: 'EXPLODE', dur: 44, stagger: 4, order: [0, 1, 2, 3]},
  {at: 870, to: 'WIRE', dur: 40, stagger: 3, order: [0, 1, 2, 3]},
  {at: 1080, to: 'CROWD', dur: 26, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1134, to: 'FLAT', dur: 22, stagger: 1, order: [0, 1, 2, 3]},
  {at: 1170, to: 'FIX', dur: 28, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1200, to: 'END', dur: 40, stagger: 2, order: [0, 1, 2, 3]},
];

export const HIT = 12;
export const REFLOW = Easing.bezier(0.6, 0, 0.12, 1);
export const COLOR_DUR = 12;
const COLOR = Easing.bezier(0.45, 0, 0.55, 1);

export const SCENE = {
  KEY: {in: 56, out: 140},
  IOS: {in: 164, out: 322},
  STRIPE: {in: 344, out: 500},
  DECK: {in: 524, out: 678},
  EXPLODE: {in: 704, out: 858},
  WIRE: {in: 888, out: 1068},
  PIT: {in: 1090, out: 1192},
  END: {in: 1220, out: 9999},
};

export const BEATS = {note: 198, sheet: 232, wallet: 288, issue: 438, zoom: 258};

export const RULES_AT = [888, 924, 960, 996, 1032];
export const PIT = {crowd: 1080, flat: 1134, fix: 1170, end: 1200};

export const GHOSTS = 3;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  r: lerp(a.r, b.r, t),
  z: lerp(a.z, b.z, t),
  rot: lerp(a.rot, b.rot, t),
  sc: lerp(a.sc, b.sc, t),
  o: lerp(a.o, b.o, t),
  dim: lerp(a.dim, b.dim, t),
  blur: lerp(a.blur, b.blur, t),
});

/** 第 i 张卡片在第 f 帧：处在哪两种世界之间、走到了多少 */
export const cardState = (f: number, i: number) => {
  let from: LayoutName = 'HOOK';
  let to: LayoutName = 'HOOK';
  let p = 1;
  let pc = 1;
  for (const t of TRANS) {
    const start = t.at + t.order.indexOf(i) * t.stagger;
    if (f < t.at) break;
    from = to;
    to = t.to;
    const x = Math.min(1, Math.max(0, (f - start) / t.dur));
    p = REFLOW(x);
    pc = COLOR(Math.min(1, Math.max(0, (f - start) / COLOR_DUR)));
  }
  if (from === to) p = pc = 1;
  const rect = lerpPose(LAYOUTS[from][i], LAYOUTS[to][i], p);
  if (f < 48) {
    const enter = tween(f, 6 + i * 8, 36, 0, 1, E.out);
    return {
      from,
      to,
      p: enter,
      pc: enter,
      pose: lerpPose({...rect, y: rect.y + 140, z: rect.z - 80, o: 0, sc: rect.sc * 0.9}, rect, enter),
    };
  }
  return {from, to, p, pc, pose: rect};
};

export const T = (name: LayoutName) => TRANS.find((t) => t.to === name)!.at;

export const worldAt = (f: number): LayoutName => {
  let cur: LayoutName = 'HOOK';
  for (const t of TRANS) {
    if (f < t.at) break;
    cur = t.to;
  }
  return cur;
};

/** 误区段多出来的 3 张空卡片 */
export const ghostState = (f: number, g: number): Pose | null => {
  const on = tween(f, PIT.crowd, 20, 0, 1, E.out) * (1 - tween(f, PIT.flat - 6, 16, 0, 1, E.inOut));
  if (on <= 0.001) return null;
  const dest = [
    P(980, 210, 560, 300, 16, {z: -24, rot: 8, dim: 0.12, o: on}),
    P(640, 180, 560, 300, 16, {z: -30, rot: -7, dim: 0.16, o: on}),
    P(900, 140, 560, 300, 16, {z: -36, rot: 5, dim: 0.2, o: on}),
  ][g];
  const wobble = Math.sin((f / FPS) * 3.2 + g * 1.4) * 5;
  return {...dest, y: dest.y + (1 - on) * 36 + wobble, rot: dest.rot + wobble * 0.12, o: on};
};

/** 落地之后也不许静：呼吸、焦点脉冲、爆炸继续拉开 */
export const poseLive = (f: number, i: number, pose: Pose): Pose => {
  const t = f / FPS;
  const fam = familyOf(worldAt(f));
  const still = fam === 'END' ? 0.25 : fam === 'WIRE' ? 0.7 : fam === 'PIT' && f >= PIT.flat && f < PIT.fix ? 0.15 : 1;
  const dy = Math.sin(t * 2.15 + i * 0.85) * 3.4 * still * (i === 0 ? 1.3 : 0.75);
  const drot = Math.sin(t * 1.55 + i * 1.1) * 0.5 * still;
  const ddim = i === 0 || (fam === 'PIT' && f >= PIT.flat && f < PIT.fix) ? 0 : 0.025 * (0.5 + 0.5 * Math.sin(t * 1.9 + i));
  let lift = 0;
  if (fam === 'KEY') lift = i === 0 ? 5 * (0.5 + 0.5 * Math.sin(t * 2.5)) : 0;
  let dx = 0;
  let extraY = 0;
  if (fam === 'EXPLODE') {
    const drift = tween(f, 710, 120, 0, 1, E.out);
    dx = i * 10 * drift;
    extraY = i * 8 * drift;
  }
  if (fam === 'DECK') {
    dx = Math.sin(t * 1.2 + i) * 2.5;
  }
  if (fam === 'IOS') {
    dx += Math.sin(f / 26) * 10;
    extraY += Math.cos(f / 32) * 7;
  }
  return {
    ...pose,
    x: pose.x + dx,
    y: pose.y + dy - lift + extraY,
    rot: pose.rot + drot,
    dim: Math.min(0.55, pose.dim + ddim),
  };
};

export type Cam = {s: number; x: number; y: number; r: number; ox: number; oy: number};
export const camAt = (f: number): Cam => {
  const t = f / FPS;
  const fam = familyOf(worldAt(f));
  let s = 1.034 - 0.024 * tween(f, 0, 80, 0, 1, E.out);
  let x = 4 * Math.sin(t * 0.85);
  let y = 3 * Math.cos(t * 1.05);
  let r = 0.18 * Math.sin(t * 0.65);
  s += 0.007 * Math.sin(t * 1.25);
  const ios = tween(f, 150, 26, 0, 1, E.out) * (1 - tween(f, 330, 20, 0, 1, E.inOut));
  s += 0.035 * ios;
  const zoom = tween(f, BEATS.zoom, 16, 0, 1, E.inOut) * (1 - tween(f, 292, 14, 0, 1, E.inOut));
  s += 0.2 * zoom;
  y += 48 * zoom;
  const st = tween(f, 330, 22, 0, 1, E.out) * (1 - tween(f, 510, 18, 0, 1, E.inOut));
  x += 16 * st;
  const exp = tween(f, 690, 28, 0, 1, E.out) * (1 - tween(f, 870, 20, 0, 1, E.inOut));
  s -= 0.07 * exp;
  if (f >= PIT.crowd && f < PIT.flat) {
    const a = 4 * Math.exp(-(f - PIT.crowd) / 18);
    x += a * Math.sin(f * 1.8);
    y += a * Math.cos(f * 2.2);
  }
  const ox = fam === 'IOS' ? 1484 : fam === 'EXPLODE' ? 1100 : 960;
  const oy = fam === 'IOS' ? 620 : 520;
  return {s, x, y, r, ox, oy};
};
