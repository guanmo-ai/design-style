/**
 * 布局 03 · Card Stack —— 同一批 4 张卡片贯穿全片，在九种「世界」之间变形。
 * 运动对标 Bento（REFLOW + stagger + 拍点交棒）和 Swiss（共享元素接力、有目的推拉摇）。
 * 位置用 SNAP 弹簧过冲；镜头用 SMOOTH；进场用 POP。禁止呼吸/微振冒充丝滑。
 */
import {Easing} from 'remotion';
import {POP, SNAP, SMOOTH, spr, track, tween} from '../../../src/lib/anim';

export const DURATION = 1320;
export const FPS = 60;
export const BEAT = 30;
/** 重排开始比拍点早这么多帧：最快一刻（过冲）落在拍上，和 Bento HIT 同一招 */
export const HIT = 14;
/** 章与章共享元素交棒的重叠（帧） */
export const OVERLAP = 18;

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
/** at = 拍点 − HIT，弹簧过冲落在拍上；章与章用 36–44 帧变形，和下一章重叠 12–24 帧 */
export const TRANS: Trans[] = [
  {at: 34, to: 'KEY', dur: 40, stagger: 3, order: [0, 1, 2, 3]},
  {at: 136, to: 'IOS', dur: 36, stagger: 3, order: [0, 1, 2, 3]},
  {at: 184, to: 'NOTE', dur: 22, stagger: 2, order: [2, 0, 1, 3]},
  {at: 218, to: 'SHEET', dur: 24, stagger: 2, order: [3, 0, 2, 1]},
  {at: 274, to: 'WALLET', dur: 26, stagger: 2, order: [1, 0, 2, 3]},
  {at: 316, to: 'STRIPE', dur: 38, stagger: 3, order: [0, 1, 3, 2]},
  {at: 424, to: 'ISSUE', dur: 26, stagger: 2, order: [1, 0, 2, 3]},
  {at: 496, to: 'DECK', dur: 40, stagger: 3, order: [3, 2, 1, 0]},
  {at: 676, to: 'EXPLODE', dur: 42, stagger: 4, order: [0, 1, 2, 3]},
  {at: 856, to: 'WIRE', dur: 38, stagger: 3, order: [0, 1, 2, 3]},
  {at: 1066, to: 'CROWD', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1120, to: 'FLAT', dur: 20, stagger: 1, order: [0, 1, 2, 3]},
  {at: 1156, to: 'FIX', dur: 26, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1186, to: 'END', dur: 40, stagger: 2, order: [0, 1, 2, 3]},
];

export const REFLOW = Easing.bezier(0.6, 0, 0.12, 1);
export const COLOR_DUR = 12;

export const SCENE = {
  KEY: {in: 56, out: 148},
  IOS: {in: 150, out: 330},
  STRIPE: {in: 330, out: 510},
  DECK: {in: 510, out: 690},
  EXPLODE: {in: 690, out: 870},
  WIRE: {in: 870, out: 1080},
  PIT: {in: 1080, out: 1200},
  END: {in: 1200, out: 9999},
};

export const BEATS = {
  key: 48,
  ios: 150,
  note: 198,
  sheet: 232,
  wallet: 288,
  zoom: 258,
  stripe: 330,
  issue: 438,
  deck: 510,
  explode: 690,
  wire: 870,
  crowd: 1080,
  flat: 1134,
  fix: 1170,
  end: 1200,
};

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

/** 第 i 张卡片在第 f 帧：SNAP 过冲插值 + 颜色 SMOOTH（比位置更快，学 Bento COLOR_DUR） */
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
  if (f < 48) {
    const enter = spr(f, 4 + i * 7, POP, 36);
    const hidden: Pose = {...pose, y: pose.y + 168, z: pose.z - 90, o: 0, sc: pose.sc * 0.78, rot: pose.rot - 8};
    pose = lerpPose(hidden, pose, enter);
    pose = {...pose, o: Math.min(1, Math.max(0, pose.o))};
    return {from, to, p: enter, pc: enter, pose};
  }
  // 爆炸：落地之后沿深度轴继续拉开（单向，不是振荡）
  if ((from === 'EXPLODE' || to === 'EXPLODE') && f >= BEATS.explode) {
    const drift = tween(f, BEATS.explode + 16, 150, 0, 1);
    pose = {
      ...pose,
      x: pose.x + i * 14 * drift,
      y: pose.y + i * 11 * drift,
      z: pose.z - i * 10 * drift,
    };
  }
  // 规则：对应那条拍点上，这张卡 POP 一下再落回（一次，不是脉冲循环）
  if ((from === 'WIRE' || to === 'WIRE') && f >= RULES_AT[0] && f < PIT.crowd) {
    const at = RULES_AT[i] ?? RULES_AT[0];
    const hit = spr(f, at, POP, 28);
    const back = spr(f, at + 16, SMOOTH, 22);
    const k = Math.max(0, hit - back);
    pose = {...pose, sc: pose.sc * (1 + 0.07 * k), y: pose.y - 10 * k};
  }
  pose = {...pose, o: Math.min(1, Math.max(0, pose.o))};
  return {from, to, p, pc, pose};
};

/** 视觉拍点 = TRANS.at + HIT（给字幕 / B-roll / 音效用） */
export const T = (name: LayoutName) => TRANS.find((t) => t.to === name)!.at + HIT;

export const worldAt = (f: number): LayoutName => {
  let cur: LayoutName = 'HOOK';
  for (const t of TRANS) {
    if (f < t.at) break;
    cur = t.to;
  }
  return cur;
};

/** 误区段多出来的 3 张空卡片：SNAP 弹入，FLAT 时被收走。无摆动。 */
export const ghostState = (f: number, g: number): Pose | null => {
  const inn = spr(f, PIT.crowd + g * 5, SNAP, 28);
  const out = spr(f, PIT.flat - 8, SMOOTH, 20);
  const on = Math.max(0, inn - out);
  if (on <= 0.001) return null;
  const dest = [
    P(980, 210, 560, 300, 16, {z: -24, rot: 8, dim: 0.12}),
    P(640, 180, 560, 300, 16, {z: -30, rot: -7, dim: 0.16}),
    P(900, 140, 560, 300, 16, {z: -36, rot: 5, dim: 0.2}),
  ][g];
  return {
    ...dest,
    y: dest.y + (1 - inn) * 80,
    sc: 0.86 + 0.14 * inn,
    o: Math.min(1, on),
  };
};

/** 相邻帧位移：给关键路径运动模糊用 */
export const poseVel = (f: number, i: number) => {
  const a = cardState(Math.max(0, f), i).pose;
  const b = cardState(Math.max(0, f - 1), i).pose;
  return Math.hypot(a.x - b.x, a.y - b.y) + Math.hypot(a.w - b.w, a.h - b.h) * 0.28 + Math.abs(a.rot - b.rot) * 2.4;
};

export const motionBlurPx = (vel: number) => {
  if (vel < 2.2) return 0;
  return Math.min(7.5, (vel - 2.2) * 0.28);
};

export type Cam = {s: number; x: number; y: number; r: number; ox: number; oy: number};

/**
 * 有目的的镜头：每一段都盯一个兴趣点。
 * iOS：登机牌 Gate → 通知 → Sheet → 条码 → 抽出 Apple Card。
 * 章与章提前 12–18 帧起手，SMOOTH 落幅；冲击点用 POP。
 */
export const camAt = (f: number): Cam => {
  const s = track(f, [
    {f: 0, v: 1.2},
    {f: 8, v: 1.0, d: 52, e: 'smooth'},
    {f: 132, v: 1.12, d: 26, e: 'smooth'},
    {f: 176, v: 1.2, d: 20, e: 'smooth'},
    {f: 198, v: 1.28, d: 16, e: 'pop'},
    {f: 220, v: 1.1, d: 18, e: 'smooth'},
    {f: 232, v: 1.16, d: 16, e: 'pop'},
    {f: 258, v: 1.42, d: 16, e: 'smooth'},
    {f: 280, v: 1.16, d: 16, e: 'smooth'},
    {f: 288, v: 1.22, d: 14, e: 'pop'},
    {f: 312, v: 1.02, d: 22, e: 'smooth'},
    {f: 330, v: 1.08, d: 24, e: 'smooth'},
    {f: 422, v: 1.12, d: 18, e: 'smooth'},
    {f: 438, v: 1.14, d: 16, e: 'pop'},
    {f: 492, v: 0.96, d: 24, e: 'smooth'},
    {f: 510, v: 0.92, d: 32, e: 'smooth'},
    {f: 600, v: 0.98, d: 44, e: 'smooth'},
    {f: 672, v: 0.84, d: 28, e: 'smooth'},
    {f: 690, v: 0.82, d: 36, e: 'smooth'},
    {f: 852, v: 0.98, d: 24, e: 'smooth'},
    {f: 870, v: 1.0, d: 32, e: 'smooth'},
    {f: 960, v: 1.05, d: 48, e: 'smooth'},
    {f: 1064, v: 1.1, d: 20, e: 'smooth'},
    {f: 1080, v: 1.12, d: 16, e: 'pop'},
    {f: 1134, v: 1.04, d: 20, e: 'smooth'},
    {f: 1170, v: 1.02, d: 22, e: 'smooth'},
    {f: 1200, v: 1.0, d: 40, e: 'smooth'},
  ]);
  const x = track(f, [
    {f: 0, v: 40},
    {f: 10, v: 0, d: 48, e: 'smooth'},
    {f: 132, v: 36, d: 26, e: 'smooth'},
    {f: 198, v: 28, d: 16, e: 'smooth'},
    {f: 232, v: 18, d: 18, e: 'smooth'},
    {f: 316, v: -20, d: 24, e: 'smooth'},
    {f: 330, v: -8, d: 22, e: 'smooth'},
    {f: 496, v: 12, d: 26, e: 'smooth'},
    {f: 510, v: 40, d: 36, e: 'smooth'},
    {f: 600, v: -30, d: 50, e: 'smooth'},
    {f: 690, v: 0, d: 32, e: 'smooth'},
    {f: 870, v: 0, d: 28, e: 'smooth'},
    {f: 1080, v: 8, d: 18, e: 'smooth'},
    {f: 1200, v: 0, d: 36, e: 'smooth'},
  ]);
  const y = track(f, [
    {f: 0, v: 18},
    {f: 10, v: 0, d: 48, e: 'smooth'},
    {f: 176, v: -8, d: 20, e: 'smooth'},
    {f: 198, v: -56, d: 16, e: 'pop'},
    {f: 220, v: 28, d: 18, e: 'smooth'},
    {f: 232, v: 46, d: 16, e: 'pop'},
    {f: 258, v: 88, d: 16, e: 'smooth'},
    {f: 280, v: 12, d: 16, e: 'smooth'},
    {f: 288, v: -6, d: 14, e: 'smooth'},
    {f: 316, v: 0, d: 20, e: 'smooth'},
    {f: 690, v: 10, d: 28, e: 'smooth'},
    {f: 870, v: 0, d: 28, e: 'smooth'},
    {f: 1200, v: 0, d: 36, e: 'smooth'},
  ]);
  const ox = track(f, [
    {f: 0, v: 960},
    {f: 132, v: 1484, d: 28, e: 'smooth'},
    {f: 316, v: 1100, d: 24, e: 'smooth'},
    {f: 330, v: 1180, d: 22, e: 'smooth'},
    {f: 496, v: 1080, d: 26, e: 'smooth'},
    {f: 690, v: 1100, d: 28, e: 'smooth'},
    {f: 856, v: 1180, d: 24, e: 'smooth'},
    {f: 1066, v: 960, d: 24, e: 'smooth'},
    {f: 1200, v: 960, d: 36, e: 'smooth'},
  ]);
  const oy = track(f, [
    {f: 0, v: 520},
    {f: 132, v: 560, d: 28, e: 'smooth'},
    {f: 176, v: 470, d: 20, e: 'smooth'},
    {f: 198, v: 210, d: 16, e: 'pop'},
    {f: 220, v: 620, d: 18, e: 'smooth'},
    {f: 232, v: 640, d: 16, e: 'smooth'},
    {f: 258, v: 760, d: 16, e: 'smooth'},
    {f: 280, v: 520, d: 16, e: 'smooth'},
    {f: 288, v: 500, d: 14, e: 'smooth'},
    {f: 316, v: 520, d: 22, e: 'smooth'},
    {f: 690, v: 500, d: 28, e: 'smooth'},
    {f: 870, v: 420, d: 28, e: 'smooth'},
    {f: 1066, v: 520, d: 24, e: 'smooth'},
    {f: 1200, v: 300, d: 40, e: 'smooth'},
  ]);
  return {s, x, y, r: 0, ox, oy};
};

/** 交棒 / 交互拍点上的冲击抖动（衰减正弦，不是循环呼吸） */
export const CAM_HITS: [number, number][] = [
  [48, 5],
  [150, 6],
  [198, 7],
  [232, 6],
  [258, 8],
  [288, 6],
  [330, 5],
  [438, 5],
  [510, 6],
  [690, 7],
  [1080, 8],
  [1170, 6],
  [1200, 4],
];
