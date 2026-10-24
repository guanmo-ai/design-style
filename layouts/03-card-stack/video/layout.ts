/**
 * 布局 03 · Card Stack v5 —— 零死区。
 * 同一批 4 张卡贯穿。每拍切到一个不同的姿态（禁止同布局空插值）。
 * SNAP 未停就接下一下；镜头每 18–24 帧换目标；场景内只做单向推进。
 */
import {POP, SNAP, SMOOTH, spr, track} from '../../../src/lib/anim';

export const DURATION = 1260;
export const FPS = 60;
export const BEAT = 30;
export const HIT = 12;
export const OVERLAP = 20;

export type LayoutName =
  | 'HOOK'
  | 'KEY'
  | 'KEY_UP'
  | 'IOS'
  | 'IOS2'
  | 'NOTE'
  | 'NOTE2'
  | 'SHEET'
  | 'SHEET2'
  | 'SCAN'
  | 'SCAN2'
  | 'WALLET'
  | 'STRIPE'
  | 'STRIPE2'
  | 'ISSUE'
  | 'ISSUE2'
  | 'MAP'
  | 'MAP2'
  | 'EXPLODE'
  | 'EXPLODE2'
  | 'RULE'
  | 'RULE2'
  | 'CROWD'
  | 'CROWD2'
  | 'FLAT'
  | 'FIX'
  | 'FIX_UP'
  | 'END'
  | 'END2';

export const familyOf = (name: LayoutName): 'KEY' | 'IOS' | 'STRIPE' | 'TEACH' | 'PIT' | 'END' => {
  if (name === 'HOOK' || name === 'KEY' || name === 'KEY_UP' || name === 'FIX' || name === 'FIX_UP') return 'KEY';
  if (name === 'STRIPE' || name === 'STRIPE2' || name === 'ISSUE' || name === 'ISSUE2' || name === 'MAP' || name === 'MAP2') return 'STRIPE';
  if (name === 'EXPLODE' || name === 'EXPLODE2' || name === 'RULE' || name === 'RULE2') return 'TEACH';
  if (name === 'CROWD' || name === 'CROWD2' || name === 'FLAT') return 'PIT';
  if (name === 'END' || name === 'END2') return 'END';
  return 'IOS';
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

const bump = (poses: Pose[], fn: (p: Pose, i: number) => Partial<Pose>): Pose[] => poses.map((p, i) => ({...p, ...fn(p, i)}));

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
const HOOK = stack(620, 340, 680, 380, 28, {lift: 2});
const KEY_UP = stack(1110, 278, 680, 380, 28, {lift: 22});
const IOS = [
  P(1308, 292, 352, 548, 32, {z: 40, dim: 0}),
  P(1308, 248, 352, 548, 32, {z: 12, rot: 0.2, dim: 0.12}),
  P(1314, -80, 340, 168, 22, {z: 70, o: 0}),
  P(1308, 920, 352, 400, 28, {z: 80, o: 0.1}),
];
const IOS2 = bump(IOS, (p, i) => (i === 0 ? {y: p.y - 16, z: p.z + 8} : {dim: Math.min(0.28, p.dim + 0.04)}));
const NOTE = [
  P(1308, 308, 352, 548, 32, {z: 28, dim: 0.22}),
  P(1308, 248, 352, 548, 32, {z: 8, dim: 0.3}),
  P(1314, 122, 340, 172, 22, {z: 80, dim: 0}),
  P(1308, 880, 352, 400, 28, {z: 70, o: 0.2}),
];
const NOTE2 = bump(NOTE, (p, i) => (i === 2 ? {y: p.y + 14, sc: p.sc * 1.02} : {y: p.y + 6, dim: Math.min(0.42, p.dim + 0.05)}));
const SHEET = [
  P(1308, 292, 352, 548, 32, {z: 18, dim: 0.36}),
  P(1308, 248, 352, 548, 32, {z: 6, dim: 0.42}),
  P(1314, 122, 340, 172, 22, {z: 50, dim: 0.08}),
  P(1308, 348, 352, 430, 28, {z: 90, dim: 0}),
];
const SHEET2 = bump(SHEET, (p, i) => (i === 3 ? {y: p.y - 28} : {dim: Math.min(0.52, p.dim + 0.06)}));
const SCAN = [
  P(1308, 268, 352, 548, 32, {z: 44, dim: 0}),
  P(1308, 228, 352, 548, 32, {z: 10, rot: 0.15, dim: 0.2}),
  P(1314, 36, 340, 172, 22, {z: 20, o: 0.14}),
  P(1308, 900, 352, 400, 28, {z: 8, o: 0.06}),
];
const SCAN2 = bump(SCAN, (p, i) => (i === 0 ? {y: p.y - 10, sc: p.sc * 1.05} : {}));
const WALLET = [
  P(1308, 236, 352, 548, 32, {z: 16, dim: 0.18}),
  P(1308, 292, 352, 548, 32, {z: 44, dim: 0}),
  P(1314, 36, 340, 172, 22, {z: 10, o: 0.1}),
  P(1308, 820, 352, 400, 28, {z: 8, o: 0.06}),
];
const STRIPE = [
  P(992, 168, 700, 620, 16, {z: 36, dim: 0}),
  P(1010, 132, 664, 620, 16, {z: 16, rot: 0.15, dim: 0.1}),
  P(1026, 102, 632, 620, 16, {z: -2, rot: -0.1, dim: 0.2}),
  P(1040, 76, 604, 620, 16, {z: -18, rot: 0.08, dim: 0.3}),
];
const STRIPE2 = bump(STRIPE, (p) => ({y: p.y + 16, h: p.h + 10}));
const ISSUE = [
  P(1010, 132, 664, 620, 16, {z: 14, rot: 0.12, dim: 0.14}),
  P(992, 168, 700, 620, 16, {z: 38, dim: 0}),
  P(1026, 102, 632, 620, 16, {z: -2, rot: -0.1, dim: 0.22}),
  P(1040, 76, 604, 620, 16, {z: -18, rot: 0.08, dim: 0.3}),
];
const ISSUE2 = bump(ISSUE, (p, i) => (i === 1 ? {y: p.y - 12, z: p.z + 10} : {dim: Math.min(0.4, p.dim + 0.05)}));
const MAP = [
  P(1026, 102, 632, 620, 16, {z: -2, rot: -0.1, dim: 0.2}),
  P(1010, 132, 664, 620, 16, {z: 14, rot: 0.1, dim: 0.12}),
  P(992, 168, 700, 620, 16, {z: 40, dim: 0}),
  P(1040, 76, 604, 620, 16, {z: -18, rot: 0.08, dim: 0.28}),
];
const MAP2 = bump(MAP, (p, i) => (i === 2 ? {y: p.y - 14, z: p.z + 8} : {}));
const EXPLODE = [
  P(700, 148, 560, 292, 22, {z: 48, rot: -2.2, dim: 0}),
  P(880, 318, 560, 292, 22, {z: 16, rot: -0.4, dim: 0.06}),
  P(1060, 488, 560, 292, 22, {z: -16, rot: 1.1, dim: 0.12}),
  P(1240, 658, 560, 292, 22, {z: -48, rot: 2.4, dim: 0.18}),
];
const EXPLODE2 = bump(EXPLODE, (p, i) => ({x: p.x + i * 22, y: p.y + i * 16, z: p.z - i * 12}));
const RULE = [
  P(640, 100, 560, 292, 22, {z: 56, rot: -2.6, dim: 0}),
  P(860, 300, 560, 292, 22, {z: 20, rot: -0.6, dim: 0.05}),
  P(1080, 500, 560, 292, 22, {z: -20, rot: 1.4, dim: 0.1}),
  P(1300, 700, 560, 292, 22, {z: -56, rot: 2.8, dim: 0.16}),
];
const RULE2 = bump(RULE, (p, i) => ({x: p.x + i * 18, y: p.y + i * 14, rot: p.rot + (i - 1.5) * 0.45}));
const CROWD = [
  P(760, 300, 600, 320, 18, {z: 20, rot: -3.5, dim: 0.02}),
  P(820, 268, 600, 320, 18, {z: 8, rot: 2.8, dim: 0.06}),
  P(700, 244, 600, 320, 18, {z: -4, rot: -1.6, dim: 0.1}),
  P(860, 220, 600, 320, 18, {z: -16, rot: 4.2, dim: 0.14}),
];
const CROWD2 = bump(CROWD, (p, i) => ({rot: p.rot * 1.4, x: p.x + (i - 1.5) * 22, y: p.y + (i % 2 ? 10 : -8)}));
const FLAT = [0, 1, 2, 3].map((i) => P(780 + i * 8, 360 + i * 5, 640, 340, 16, {z: -i * 2}));
const FIX = stack(700, 280, 680, 380, 28, {sx: 28, sy: 44, lift: 16});
const FIX_UP = stack(700, 266, 680, 380, 28, {sx: 28, sy: 44, lift: 24});
const END = KEY.map((p) => shrink(p, 0.2, 960, 300));
const END2 = KEY.map((p) => shrink(p, 0.155, 960, 276));

export const LAYOUTS: Record<LayoutName, Pose[]> = {
  HOOK,
  KEY,
  KEY_UP,
  IOS,
  IOS2,
  NOTE,
  NOTE2,
  SHEET,
  SHEET2,
  SCAN,
  SCAN2,
  WALLET,
  STRIPE,
  STRIPE2,
  ISSUE,
  ISSUE2,
  MAP,
  MAP2,
  EXPLODE,
  EXPLODE2,
  RULE,
  RULE2,
  CROWD,
  CROWD2,
  FLAT,
  FIX,
  FIX_UP,
  END,
  END2,
};

export type Trans = {at: number; to: LayoutName; dur: number; stagger: number; order: number[]};
/** at = 拍点 − HIT。相邻 to 必须不同，否则 lerp 是空操作。 */
export const TRANS: Trans[] = [
  {at: 18, to: 'KEY', dur: 28, stagger: 3, order: [0, 1, 2, 3]},
  {at: 48, to: 'KEY_UP', dur: 26, stagger: 2, order: [0, 1, 2, 3]},
  {at: 78, to: 'IOS', dur: 28, stagger: 3, order: [0, 1, 2, 3]},
  {at: 108, to: 'IOS2', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 138, to: 'NOTE', dur: 24, stagger: 2, order: [2, 0, 1, 3]},
  {at: 168, to: 'NOTE2', dur: 22, stagger: 2, order: [2, 0, 1, 3]},
  {at: 198, to: 'SHEET', dur: 24, stagger: 2, order: [3, 0, 2, 1]},
  {at: 228, to: 'SHEET2', dur: 22, stagger: 2, order: [3, 0, 2, 1]},
  {at: 258, to: 'SCAN', dur: 24, stagger: 2, order: [0, 3, 2, 1]},
  {at: 288, to: 'SCAN2', dur: 22, stagger: 2, order: [0, 1, 2, 3]},
  {at: 318, to: 'WALLET', dur: 24, stagger: 2, order: [1, 0, 2, 3]},
  {at: 348, to: 'STRIPE', dur: 28, stagger: 3, order: [0, 1, 3, 2]},
  {at: 378, to: 'STRIPE2', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 408, to: 'STRIPE', dur: 22, stagger: 2, order: [0, 1, 2, 3]},
  {at: 438, to: 'ISSUE', dur: 24, stagger: 2, order: [1, 0, 2, 3]},
  {at: 468, to: 'ISSUE2', dur: 22, stagger: 2, order: [1, 0, 2, 3]},
  {at: 498, to: 'MAP', dur: 24, stagger: 2, order: [2, 1, 0, 3]},
  {at: 528, to: 'MAP2', dur: 22, stagger: 2, order: [2, 0, 1, 3]},
  {at: 558, to: 'EXPLODE', dur: 28, stagger: 3, order: [0, 1, 2, 3]},
  {at: 588, to: 'EXPLODE2', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 648, to: 'RULE', dur: 26, stagger: 3, order: [0, 1, 2, 3]},
  {at: 678, to: 'RULE2', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 708, to: 'RULE', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 738, to: 'RULE2', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 798, to: 'RULE', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 828, to: 'CROWD', dur: 26, stagger: 2, order: [0, 1, 2, 3]},
  {at: 858, to: 'CROWD2', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 888, to: 'CROWD', dur: 22, stagger: 2, order: [0, 1, 2, 3]},
  {at: 918, to: 'CROWD2', dur: 22, stagger: 2, order: [0, 1, 2, 3]},
  {at: 948, to: 'FLAT', dur: 22, stagger: 1, order: [0, 1, 2, 3]},
  {at: 978, to: 'FIX', dur: 26, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1008, to: 'FIX_UP', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1038, to: 'FIX', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1068, to: 'END', dur: 28, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1110, to: 'END2', dur: 26, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1140, to: 'END', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1170, to: 'END2', dur: 28, stagger: 2, order: [0, 1, 2, 3]},
];

export const COLOR_DUR = 10;

export const SCENE = {
  KEY: {in: 18, out: 90},
  IOS: {in: 90, out: 390},
  STRIPE: {in: 360, out: 630},
  TEACH: {in: 558, out: 900},
  PIT: {in: 828, out: 1080},
  END: {in: 1068, out: 9999},
};

export const BEATS = {
  key: 30,
  lift: 60,
  ios: 90,
  gate: 120,
  note: 150,
  sheet: 210,
  buttons: 240,
  scan: 270,
  zoom: 300,
  wallet: 330,
  stripe: 390,
  amount: 420,
  issue: 450,
  map: 510,
  explode: 630,
  rule1: 660,
  rule2: 690,
  rule3: 720,
  rule4: 750,
  crowd: 900,
  flat: 960,
  fix: 990,
  end: 1080,
};

export const RULES_AT = [660, 690, 720, 750, 780];
export const PIT = {crowd: 900, flat: 960, fix: 990, end: 1080};
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

/** 场景内单向推进 0→1，只往前 */
export const drive = (f: number, inn: number, out: number) => {
  const t = (f - inn) / Math.max(1, out - inn);
  return Math.min(1, Math.max(0, t));
};

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
    p = spr(f, start, SNAP, t.dur);
    pc = spr(f, start, SMOOTH, COLOR_DUR);
  }
  if (from === to && f < TRANS[0].at) p = pc = 1;
  let pose = lerpPose(LAYOUTS[from][i], LAYOUTS[to][i], p);

  if (f < 36) {
    const enter = spr(f, 2 + i * 6, POP, 32);
    pose = lerpPose({...pose, y: pose.y + 170, z: pose.z - 90, o: 0, sc: pose.sc * 0.78, rot: pose.rot - 9}, pose, enter);
  }

  if ((to === 'KEY' || to === 'KEY_UP') && f < 90) {
    const k = drive(f, 48, 88);
    if (i === 0) pose = {...pose, y: pose.y - 10 * k};
  }
  if (to === 'SHEET' || to === 'SHEET2' || from === 'SHEET') {
    const k = drive(f, 198, 255);
    if (i === 3) pose = {...pose, y: pose.y - 12 * k};
  }
  if (to === 'SCAN' || to === 'SCAN2') {
    const k = drive(f, 258, 318);
    if (i === 0) pose = {...pose, sc: pose.sc * (1 + 0.03 * k), y: pose.y - 6 * k};
  }
  if (familyOf(to) === 'STRIPE') {
    const k = drive(f, 348, 548);
    pose = {...pose, y: pose.y + 8 * k};
  }
  if (familyOf(to) === 'TEACH' || familyOf(from) === 'TEACH') {
    const k = drive(f, 558, 840);
    pose = {...pose, x: pose.x + i * 14 * k, y: pose.y + i * 10 * k, z: pose.z - i * 8 * k};
  }
  if (to === 'CROWD' || to === 'CROWD2' || from === 'CROWD' || from === 'CROWD2') {
    const k = drive(f, 828, 954);
    pose = {...pose, rot: pose.rot + (i % 2 ? 1.6 : -1.4) * k, x: pose.x + (i - 1.5) * 8 * k};
  }
  if (to === 'FIX' || to === 'FIX_UP') {
    const k = drive(f, 978, 1070);
    if (i === 0) pose = {...pose, y: pose.y - 8 * k};
  }
  if (to === 'END' || to === 'END2') {
    const k = drive(f, 1068, 1248);
    pose = {...pose, sc: pose.sc * (1 - 0.05 * k), y: pose.y - 8 * k};
  }

  pose = {...pose, o: Math.min(1, Math.max(0, pose.o))};
  return {from, to, p, pc, pose};
};

export const T = (name: LayoutName) => {
  const t = TRANS.find((x) => x.to === name);
  return t ? t.at + HIT : 0;
};

export const worldAt = (f: number): LayoutName => {
  let cur: LayoutName = 'HOOK';
  for (const t of TRANS) {
    if (f < t.at) break;
    cur = t.to;
  }
  return cur;
};

export const ghostState = (f: number, g: number): Pose | null => {
  const inn = spr(f, PIT.crowd - 18 + g * 6, SNAP, 26);
  const out = spr(f, PIT.flat - 6, SMOOTH, 18);
  const on = Math.max(0, inn - out);
  if (on <= 0.001) return null;
  const dest = [
    P(980, 210, 560, 300, 16, {z: -24, rot: 8, dim: 0.12}),
    P(640, 180, 560, 300, 16, {z: -30, rot: -7, dim: 0.16}),
    P(900, 140, 560, 300, 16, {z: -36, rot: 5, dim: 0.2}),
  ][g];
  const drift = drive(f, PIT.crowd, PIT.flat);
  return {...dest, y: dest.y + (1 - inn) * 80 + drift * 14, x: dest.x + drift * (g - 1) * 10, sc: 0.86 + 0.14 * inn, o: Math.min(1, on)};
};

export const poseVel = (f: number, i: number) => {
  const a = cardState(Math.max(0, f), i).pose;
  const b = cardState(Math.max(0, f - 1), i).pose;
  return Math.hypot(a.x - b.x, a.y - b.y) + Math.hypot(a.w - b.w, a.h - b.h) * 0.28 + Math.abs(a.rot - b.rot) * 2.4;
};

export const motionBlurPx = (vel: number) => {
  if (vel < 5.5) return 0;
  return Math.min(3, (vel - 5.5) * 0.11);
};

export type Cam = {s: number; x: number; y: number; r: number; ox: number; oy: number};

/** 每 18–24 帧一个新目标，数值从不走平 */
export const camAt = (f: number): Cam => {
  const s = track(f, [
    {f: 0, v: 1.22},
    {f: 8, v: 1.06, d: 26, e: 'smooth'},
    {f: 30, v: 1.12, d: 18, e: 'pop'},
    {f: 48, v: 1.08, d: 18, e: 'pop'},
    {f: 68, v: 1.14, d: 16, e: 'smooth'},
    {f: 90, v: 1.18, d: 18, e: 'smooth'},
    {f: 120, v: 1.16, d: 18, e: 'smooth'},
    {f: 150, v: 1.2, d: 16, e: 'pop'},
    {f: 180, v: 1.14, d: 16, e: 'pop'},
    {f: 210, v: 1.1, d: 16, e: 'smooth'},
    {f: 240, v: 1.16, d: 16, e: 'pop'},
    {f: 270, v: 1.24, d: 16, e: 'smooth'},
    {f: 300, v: 1.3, d: 16, e: 'smooth'},
    {f: 330, v: 1.14, d: 16, e: 'pop'},
    {f: 360, v: 1.04, d: 20, e: 'smooth'},
    {f: 390, v: 1.1, d: 18, e: 'smooth'},
    {f: 420, v: 1.14, d: 16, e: 'pop'},
    {f: 450, v: 1.08, d: 16, e: 'pop'},
    {f: 480, v: 1.12, d: 16, e: 'smooth'},
    {f: 510, v: 1.06, d: 18, e: 'smooth'},
    {f: 540, v: 0.98, d: 18, e: 'smooth'},
    {f: 570, v: 0.9, d: 18, e: 'smooth'},
    {f: 600, v: 0.86, d: 18, e: 'smooth'},
    {f: 630, v: 0.84, d: 22, e: 'smooth'},
    {f: 660, v: 0.88, d: 18, e: 'smooth'},
    {f: 690, v: 0.92, d: 18, e: 'smooth'},
    {f: 720, v: 0.86, d: 18, e: 'smooth'},
    {f: 750, v: 0.9, d: 18, e: 'smooth'},
    {f: 780, v: 0.88, d: 18, e: 'smooth'},
    {f: 810, v: 0.96, d: 18, e: 'smooth'},
    {f: 840, v: 1.0, d: 18, e: 'smooth'},
    {f: 870, v: 1.04, d: 16, e: 'pop'},
    {f: 900, v: 1.1, d: 16, e: 'pop'},
    {f: 930, v: 1.06, d: 16, e: 'smooth'},
    {f: 960, v: 1.02, d: 16, e: 'smooth'},
    {f: 990, v: 1.08, d: 16, e: 'pop'},
    {f: 1020, v: 1.04, d: 16, e: 'smooth'},
    {f: 1050, v: 1.01, d: 16, e: 'smooth'},
    {f: 1080, v: 0.98, d: 22, e: 'smooth'},
    {f: 1110, v: 1.04, d: 18, e: 'smooth'},
    {f: 1140, v: 1.08, d: 18, e: 'smooth'},
    {f: 1170, v: 1.12, d: 18, e: 'smooth'},
    {f: 1200, v: 1.06, d: 20, e: 'smooth'},
    {f: 1230, v: 1.1, d: 18, e: 'smooth'},
    {f: 1250, v: 1.03, d: 16, e: 'smooth'},
  ]);
  const x = track(f, [
    {f: 0, v: 36},
    {f: 12, v: 0, d: 26, e: 'smooth'},
    {f: 78, v: 28, d: 20, e: 'smooth'},
    {f: 150, v: 18, d: 16, e: 'smooth'},
    {f: 210, v: 8, d: 16, e: 'smooth'},
    {f: 300, v: 12, d: 16, e: 'smooth'},
    {f: 360, v: -16, d: 20, e: 'smooth'},
    {f: 450, v: 8, d: 16, e: 'smooth'},
    {f: 558, v: 14, d: 20, e: 'smooth'},
    {f: 690, v: -12, d: 20, e: 'smooth'},
    {f: 828, v: 8, d: 18, e: 'smooth'},
    {f: 960, v: -6, d: 16, e: 'smooth'},
    {f: 1080, v: 0, d: 22, e: 'smooth'},
    {f: 1200, v: 5, d: 18, e: 'smooth'},
  ]);
  const y = track(f, [
    {f: 0, v: 16},
    {f: 12, v: 0, d: 26, e: 'smooth'},
    {f: 120, v: -10, d: 18, e: 'smooth'},
    {f: 150, v: -14, d: 14, e: 'smooth'},
    {f: 180, v: -28, d: 14, e: 'pop'},
    {f: 210, v: 24, d: 16, e: 'smooth'},
    {f: 270, v: 8, d: 16, e: 'smooth'},
    {f: 300, v: 50, d: 14, e: 'smooth'},
    {f: 330, v: -4, d: 14, e: 'smooth'},
    {f: 390, v: 2, d: 18, e: 'smooth'},
    {f: 510, v: -8, d: 18, e: 'smooth'},
    {f: 630, v: 10, d: 22, e: 'smooth'},
    {f: 750, v: -6, d: 18, e: 'smooth'},
    {f: 900, v: 8, d: 16, e: 'smooth'},
    {f: 990, v: -4, d: 16, e: 'smooth'},
    {f: 1080, v: -12, d: 22, e: 'smooth'},
    {f: 1200, v: 8, d: 18, e: 'smooth'},
  ]);
  const ox = track(f, [
    {f: 0, v: 960},
    {f: 78, v: 1484, d: 22, e: 'smooth'},
    {f: 180, v: 1496, d: 16, e: 'smooth'},
    {f: 300, v: 1488, d: 16, e: 'smooth'},
    {f: 348, v: 1180, d: 22, e: 'smooth'},
    {f: 450, v: 1164, d: 16, e: 'smooth'},
    {f: 558, v: 1080, d: 22, e: 'smooth'},
    {f: 690, v: 1140, d: 20, e: 'smooth'},
    {f: 828, v: 980, d: 20, e: 'smooth'},
    {f: 900, v: 1020, d: 16, e: 'pop'},
    {f: 990, v: 940, d: 16, e: 'pop'},
    {f: 1080, v: 960, d: 24, e: 'smooth'},
    {f: 1200, v: 968, d: 18, e: 'smooth'},
  ]);
  const oy = track(f, [
    {f: 0, v: 520},
    {f: 78, v: 540, d: 22, e: 'smooth'},
    {f: 120, v: 480, d: 16, e: 'smooth'},
    {f: 150, v: 400, d: 16, e: 'smooth'},
    {f: 180, v: 220, d: 14, e: 'pop'},
    {f: 210, v: 640, d: 16, e: 'smooth'},
    {f: 270, v: 520, d: 16, e: 'smooth'},
    {f: 300, v: 760, d: 14, e: 'smooth'},
    {f: 330, v: 480, d: 14, e: 'smooth'},
    {f: 390, v: 500, d: 18, e: 'smooth'},
    {f: 510, v: 460, d: 18, e: 'smooth'},
    {f: 630, v: 500, d: 22, e: 'smooth'},
    {f: 750, v: 540, d: 18, e: 'smooth'},
    {f: 828, v: 520, d: 18, e: 'smooth'},
    {f: 900, v: 470, d: 16, e: 'smooth'},
    {f: 1080, v: 300, d: 24, e: 'smooth'},
    {f: 1200, v: 268, d: 18, e: 'smooth'},
  ]);
  return {s, x, y, r: 0, ox, oy};
};

export const CAM_HITS: [number, number][] = [
  [30, 5],
  [90, 6],
  [150, 7],
  [210, 6],
  [300, 7],
  [330, 6],
  [390, 5],
  [450, 5],
  [630, 7],
  [900, 7],
  [990, 6],
  [1080, 4],
];
