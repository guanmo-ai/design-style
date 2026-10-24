/**
 * 布局 03 · Card Stack v6 —— 四张竖版海报贯穿。
 * 刊·抽 / 层·提 / 样·压。相邻 TRANS.to 必须不同。镜头 18–24 帧换目标。
 */
import {POP, SNAP, SMOOTH, spr, track} from '../../../src/lib/anim';

export const DURATION = 1320;
export const FPS = 60;
export const HIT = 12;
export const OVERLAP = 22;

export type LayoutName =
  | 'SLAM'
  | 'STACK'
  | 'STACK_UP'
  | 'COVER'
  | 'COVER_OUT'
  | 'COVER2'
  | 'COVER2_UP'
  | 'COVER2_OUT'
  | 'COVER3'
  | 'COVER3_UP'
  | 'LAYER'
  | 'LAYER_MARK'
  | 'LAYER_LIFT'
  | 'LAYER_TOP'
  | 'LAYER_TOP2'
  | 'FAN'
  | 'FAN2'
  | 'PICK'
  | 'PRESS'
  | 'PRESS2'
  | 'TEACH'
  | 'TEACH2'
  | 'RULE'
  | 'RULE2'
  | 'NOISE'
  | 'NOISE2'
  | 'FLAT'
  | 'FIX'
  | 'FIX_UP'
  | 'END'
  | 'END2';

export const familyOf = (name: LayoutName): 'HOOK' | 'COVER' | 'LAYER' | 'PROOF' | 'TEACH' | 'PIT' | 'END' => {
  if (name === 'SLAM' || name === 'STACK' || name === 'STACK_UP') return 'HOOK';
  if (name.startsWith('COVER')) return 'COVER';
  if (name.startsWith('LAYER')) return 'LAYER';
  if (name === 'FAN' || name === 'FAN2' || name === 'PICK' || name === 'PRESS' || name === 'PRESS2') return 'PROOF';
  if (name === 'TEACH' || name === 'TEACH2' || name === 'RULE' || name === 'RULE2') return 'TEACH';
  if (name === 'NOISE' || name === 'NOISE2' || name === 'FLAT' || name === 'FIX' || name === 'FIX_UP') return 'PIT';
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
};

const P = (x: number, y: number, w: number, h: number, r: number, extra: Partial<Pose> = {}): Pose => ({
  x, y, w, h, r, z: 0, rot: 0, sc: 1, o: 1, dim: 0, ...extra,
});

const bump = (poses: Pose[], fn: (p: Pose, i: number) => Partial<Pose>): Pose[] => poses.map((p, i) => ({...p, ...fn(p, i)}));

const posters = (ox: number, oy: number, lift = 18): Pose[] =>
  [0, 1, 2, 3].map((i) =>
    P(ox - i * 40, oy - i * 30 - (i === 0 ? lift : 0), 520, 740, 8, {
      z: 40 - i * 18,
      rot: i === 0 ? -1.4 : i % 2 ? 1.1 : -0.8,
      sc: 1 - i * 0.018 + (i === 0 ? 0.01 : 0),
      dim: i * 0.12,
    }),
  );

const sheets = (ox: number, oy: number, front = 0): Pose[] => {
  const order = [0, 1, 2, 3];
  return order.map((id) => {
    const depth = (id - front + 4) % 4;
    return P(ox + depth * 18, oy - depth * 28, 720 - depth * 16, 400, 6, {
      z: 48 - depth * 16,
      rot: depth === 0 ? -0.6 : depth % 2 ? 0.5 : -0.4,
      dim: depth * 0.14,
      sc: 1 - depth * 0.015,
    });
  });
};

const shrink = (p: Pose, s: number, cx: number, cy: number): Pose => ({
  ...p,
  x: cx + (p.x - 960) * s,
  y: cy + (p.y - 540) * s,
  w: p.w * s,
  h: p.h * s,
  r: Math.max(3, p.r * s),
});

const SLAM = posters(620, 220, 4).map((p, i) => ({...p, y: p.y + 80, sc: p.sc * 1.18, rot: p.rot - 8 + i * 3, z: p.z - 40}));
const STACK = posters(1000, 150, 16);
const STACK_UP = posters(1000, 136, 28);
const COVER = posters(1020, 142, 20);
const COVER_OUT = [
  P(-520, 60, 520, 740, 8, {z: 70, rot: -16, o: 0.35, sc: 0.92}),
  P(1020, 150, 520, 740, 8, {z: 44, rot: -1.2, dim: 0}),
  P(980, 120, 520, 740, 8, {z: 22, rot: 1.0, dim: 0.14}),
  P(940, 92, 520, 740, 8, {z: 4, rot: -0.7, dim: 0.26}),
];
const COVER2 = [
  P(-720, 20, 520, 740, 8, {z: -8, o: 0}),
  P(1020, 142, 520, 740, 8, {z: 44, rot: -1.3, dim: 0}),
  P(980, 112, 520, 740, 8, {z: 22, rot: 1.0, dim: 0.14}),
  P(940, 84, 520, 740, 8, {z: 4, rot: -0.7, dim: 0.26}),
];
const COVER2_UP = bump(COVER2, (p, i) => (i === 1 ? {y: p.y - 16, z: p.z + 8} : {dim: Math.min(0.36, p.dim + 0.04)}));
const COVER2_OUT = [
  P(-720, 20, 520, 740, 8, {o: 0}),
  P(-500, 70, 520, 740, 8, {z: 70, rot: -14, o: 0.35, sc: 0.92}),
  P(1020, 150, 520, 740, 8, {z: 44, rot: -1.1, dim: 0}),
  P(980, 118, 520, 740, 8, {z: 20, rot: 0.9, dim: 0.16}),
];
const COVER3 = [
  P(-720, 20, 520, 740, 8, {o: 0}),
  P(-720, 40, 520, 740, 8, {o: 0}),
  P(1020, 142, 520, 740, 8, {z: 44, rot: -1.2, dim: 0}),
  P(980, 112, 520, 740, 8, {z: 20, rot: 1.0, dim: 0.16}),
];
const COVER3_UP = bump(COVER3, (p, i) => (i === 2 ? {y: p.y - 14} : {}));
const LAYER = sheets(860, 250, 0);
const LAYER_MARK = bump(LAYER, (p, i) => (i === 3 ? {y: p.y - 10, sc: p.sc * 1.03, dim: 0, z: p.z + 6} : {dim: Math.min(0.4, p.dim + 0.06)}));
const LAYER_LIFT = [
  P(878, 228, 720, 400, 6, {z: 16, dim: 0.22, rot: 0.4}),
  P(896, 200, 704, 400, 6, {z: 4, dim: 0.3, rot: -0.3}),
  P(912, 176, 688, 400, 6, {z: -6, dim: 0.36}),
  P(848, 210, 720, 400, 6, {z: 56, dim: 0, rot: -1.0, sc: 1.02}),
];
const LAYER_TOP = sheets(860, 250, 3);
const LAYER_TOP2 = bump(LAYER_TOP, (p, i) => (i === 3 ? {y: p.y - 12} : {y: p.y + 6}));
const FAN = [
  P(380, 230, 400, 560, 6, {z: 8, rot: -20, dim: 0.08}),
  P(680, 170, 400, 560, 6, {z: 28, rot: -6, dim: 0}),
  P(980, 155, 400, 560, 6, {z: 18, rot: 7, dim: 0.06}),
  P(1280, 220, 400, 560, 6, {z: 4, rot: 18, dim: 0.12}),
];
const FAN2 = bump(FAN, (p, i) => ({x: p.x + (i - 1.5) * 18, rot: p.rot * 1.12}));
const PICK = [
  P(420, 260, 340, 480, 6, {z: 4, rot: -10, dim: 0.28, sc: 0.92}),
  P(700, 140, 520, 700, 6, {z: 50, rot: -1.2, dim: 0}),
  P(1180, 250, 340, 480, 6, {z: 6, rot: 8, dim: 0.28, sc: 0.92}),
  P(1480, 300, 300, 420, 6, {z: 0, rot: 14, dim: 0.36, sc: 0.86}),
];
const PRESS = [
  P(980, 118, 520, 740, 8, {z: 18, rot: 0.8, dim: 0.2}),
  P(1020, 142, 520, 740, 8, {z: 46, rot: -1.3, dim: 0}),
  P(940, 92, 520, 740, 8, {z: 4, rot: -0.6, dim: 0.3}),
  P(900, 68, 520, 740, 8, {z: -8, rot: 0.5, dim: 0.38}),
];
const PRESS2 = bump(PRESS, (p, i) => (i === 1 ? {y: p.y - 14, sc: p.sc * 1.02} : {dim: Math.min(0.48, p.dim + 0.05)}));
const TEACH = [
  P(520, 80, 480, 320, 8, {z: 48, rot: -2.4, dim: 0}),
  P(760, 260, 480, 320, 8, {z: 20, rot: -0.5, dim: 0.05}),
  P(1000, 440, 480, 320, 8, {z: -8, rot: 1.2, dim: 0.1}),
  P(1240, 620, 480, 320, 8, {z: -36, rot: 2.6, dim: 0.16}),
];
const TEACH2 = bump(TEACH, (p, i) => ({x: p.x + i * 20, y: p.y + i * 14, z: p.z - i * 10}));
const RULE = [
  P(480, 60, 480, 320, 8, {z: 56, rot: -2.8, dim: 0}),
  P(760, 250, 480, 320, 8, {z: 24, rot: -0.7, dim: 0.04}),
  P(1040, 440, 480, 320, 8, {z: -12, rot: 1.5, dim: 0.08}),
  P(1320, 630, 480, 320, 8, {z: -48, rot: 3.0, dim: 0.14}),
];
const RULE2 = bump(RULE, (p, i) => ({x: p.x + i * 16, y: p.y + i * 12, rot: p.rot + (i - 1.5) * 0.35}));
const NOISE = [
  P(700, 280, 520, 360, 8, {z: 24, rot: -6, dim: 0.04}),
  P(820, 240, 520, 360, 8, {z: 8, rot: 4.5, dim: 0.08}),
  P(640, 210, 520, 360, 8, {z: -4, rot: -3, dim: 0.12}),
  P(880, 180, 520, 360, 8, {z: -16, rot: 7, dim: 0.16}),
];
const NOISE2 = bump(NOISE, (p, i) => ({rot: p.rot * 1.35, x: p.x + (i - 1.5) * 28, y: p.y + (i % 2 ? 14 : -10)}));
const FLAT = [0, 1, 2, 3].map((i) => P(760 + i * 6, 340 + i * 4, 560, 380, 6, {z: -i * 2}));
const FIX = posters(700, 160, 18);
const FIX_UP = posters(700, 146, 28);
const END = STACK.map((p) => shrink(p, 0.18, 960, 280));
const END2 = STACK.map((p) => shrink(p, 0.14, 960, 256));

export const LAYOUTS: Record<LayoutName, Pose[]> = {
  SLAM, STACK, STACK_UP,
  COVER, COVER_OUT, COVER2, COVER2_UP, COVER2_OUT, COVER3, COVER3_UP,
  LAYER, LAYER_MARK, LAYER_LIFT, LAYER_TOP, LAYER_TOP2,
  FAN, FAN2, PICK, PRESS, PRESS2,
  TEACH, TEACH2, RULE, RULE2,
  NOISE, NOISE2, FLAT, FIX, FIX_UP,
  END, END2,
};

export type Trans = {at: number; to: LayoutName; dur: number; stagger: number; order: number[]};
export const TRANS: Trans[] = [
  {at: 18, to: 'STACK', dur: 28, stagger: 3, order: [0, 1, 2, 3]},
  {at: 48, to: 'STACK_UP', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 78, to: 'COVER', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 108, to: 'COVER_OUT', dur: 26, stagger: 2, order: [0, 1, 2, 3]},
  {at: 138, to: 'COVER2', dur: 24, stagger: 2, order: [1, 2, 3, 0]},
  {at: 168, to: 'COVER2_UP', dur: 22, stagger: 2, order: [1, 2, 3, 0]},
  {at: 198, to: 'COVER2_OUT', dur: 26, stagger: 2, order: [1, 2, 3, 0]},
  {at: 228, to: 'COVER3', dur: 24, stagger: 2, order: [2, 3, 1, 0]},
  {at: 258, to: 'COVER3_UP', dur: 22, stagger: 2, order: [2, 3, 1, 0]},
  {at: 288, to: 'LAYER', dur: 28, stagger: 3, order: [0, 1, 2, 3]},
  {at: 318, to: 'LAYER_MARK', dur: 24, stagger: 2, order: [3, 0, 1, 2]},
  {at: 348, to: 'LAYER_LIFT', dur: 26, stagger: 2, order: [3, 0, 1, 2]},
  {at: 378, to: 'LAYER_TOP', dur: 24, stagger: 2, order: [3, 0, 1, 2]},
  {at: 408, to: 'LAYER_TOP2', dur: 22, stagger: 2, order: [3, 0, 1, 2]},
  {at: 438, to: 'LAYER_TOP', dur: 22, stagger: 2, order: [3, 2, 1, 0]},
  {at: 468, to: 'FAN', dur: 28, stagger: 3, order: [0, 1, 2, 3]},
  {at: 498, to: 'FAN2', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 528, to: 'PICK', dur: 26, stagger: 2, order: [1, 0, 2, 3]},
  {at: 558, to: 'PRESS', dur: 26, stagger: 2, order: [1, 0, 2, 3]},
  {at: 588, to: 'PRESS2', dur: 22, stagger: 2, order: [1, 0, 2, 3]},
  {at: 618, to: 'TEACH', dur: 28, stagger: 3, order: [0, 1, 2, 3]},
  {at: 648, to: 'TEACH2', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 678, to: 'RULE', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 708, to: 'RULE2', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 738, to: 'RULE', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 768, to: 'RULE2', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 798, to: 'RULE', dur: 22, stagger: 2, order: [0, 1, 2, 3]},
  {at: 828, to: 'NOISE', dur: 26, stagger: 2, order: [0, 1, 2, 3]},
  {at: 858, to: 'NOISE2', dur: 22, stagger: 2, order: [0, 1, 2, 3]},
  {at: 888, to: 'NOISE', dur: 22, stagger: 2, order: [0, 1, 2, 3]},
  {at: 918, to: 'FLAT', dur: 22, stagger: 1, order: [0, 1, 2, 3]},
  {at: 948, to: 'FIX', dur: 26, stagger: 2, order: [0, 1, 2, 3]},
  {at: 978, to: 'FIX_UP', dur: 22, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1008, to: 'FIX', dur: 22, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1038, to: 'FIX_UP', dur: 22, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1068, to: 'END', dur: 28, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1110, to: 'END2', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1140, to: 'END', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1170, to: 'END2', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1200, to: 'END', dur: 24, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1230, to: 'END2', dur: 26, stagger: 2, order: [0, 1, 2, 3]},
  {at: 1260, to: 'END', dur: 28, stagger: 2, order: [0, 1, 2, 3]},
];

export const COLOR_DUR = 10;

export const SCENE = {
  HOOK: {in: 12, out: 90},
  COVER: {in: 78, out: 318},
  LAYER: {in: 288, out: 500},
  PROOF: {in: 468, out: 640},
  TEACH: {in: 618, out: 850},
  PIT: {in: 828, out: 1080},
  END: {in: 1068, out: 9999},
};

export const BEATS = {
  slam: 30,
  lift: 60,
  cover: 90,
  pull1: 120,
  land2: 150,
  pull2: 210,
  land3: 240,
  layer: 300,
  mark: 330,
  rise: 360,
  front: 390,
  fan: 480,
  pick: 540,
  press: 570,
  explode: 630,
  r1: 690,
  r2: 720,
  r3: 750,
  noise: 840,
  flat: 930,
  fix: 960,
  end: 1080,
};

export const RULES_AT = [690, 720, 750, 780];
export const PIT = {noise: 840, flat: 930, fix: 960, end: 1080};
export const EXTRAS = 4;

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
});

export const drive = (f: number, inn: number, out: number) => {
  const t = (f - inn) / Math.max(1, out - inn);
  return Math.min(1, Math.max(0, t));
};

export const cardState = (f: number, i: number) => {
  let from: LayoutName = 'SLAM';
  let to: LayoutName = 'SLAM';
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

  if (f < 40) {
    const enter = spr(f, 1 + i * 5, POP, 30);
    pose = lerpPose({...pose, y: pose.y + 220, z: pose.z - 120, o: 0, sc: pose.sc * 1.35, rot: pose.rot - 14}, pose, enter);
  }
  if (familyOf(to) === 'COVER' && (to === 'COVER_OUT' || to === 'COVER2_OUT') && i === (to === 'COVER_OUT' ? 0 : 1)) {
    const k = drive(f, to === 'COVER_OUT' ? 108 : 198, to === 'COVER_OUT' ? 150 : 240);
    pose = {...pose, x: pose.x - 40 * k, rot: pose.rot - 4 * k};
  }
  if (to === 'LAYER_LIFT' || to === 'LAYER_TOP' || to === 'LAYER_TOP2') {
    const k = drive(f, 348, 430);
    if (i === 3) pose = {...pose, y: pose.y - 8 * k, z: pose.z + 6 * k};
  }
  if (familyOf(to) === 'PROOF' && (to === 'FAN' || to === 'FAN2')) {
    const k = drive(f, 468, 540);
    pose = {...pose, x: pose.x + (i - 1.5) * 10 * k, rot: pose.rot * (1 + 0.08 * k)};
  }
  if (familyOf(to) === 'TEACH' || familyOf(from) === 'TEACH') {
    const k = drive(f, 618, 820);
    pose = {...pose, x: pose.x + i * 12 * k, y: pose.y + i * 8 * k, z: pose.z - i * 6 * k};
  }
  if (to === 'NOISE' || to === 'NOISE2') {
    const k = drive(f, 828, 916);
    pose = {...pose, rot: pose.rot + (i % 2 ? 2 : -2) * k, x: pose.x + (i - 1.5) * 8 * k};
  }
  if (to === 'FIX' || to === 'FIX_UP') {
    const k = drive(f, 948, 1060);
    if (i === 0) pose = {...pose, y: pose.y - 8 * k};
  }
  if (to === 'END' || to === 'END2') {
    const k = drive(f, 1068, 1320);
    pose = {...pose, sc: pose.sc * (1 - 0.08 * k), y: pose.y - 10 * k};
  }

  pose = {...pose, o: Math.min(1, Math.max(0, pose.o))};
  return {from, to, p, pc, pose};
};

export const T = (name: LayoutName) => {
  const t = TRANS.find((x) => x.to === name);
  return t ? t.at + HIT : 0;
};

export const extraState = (f: number, g: number): Pose | null => {
  const inn = spr(f, 828 + g * 5, SNAP, 24);
  const out = spr(f, 918, SMOOTH, 16);
  const on = Math.max(0, inn - out);
  if (on <= 0.001) return null;
  const dest = [
    P(1040, 160, 480, 320, 8, {z: -20, rot: 10, dim: 0.1}),
    P(520, 140, 480, 320, 8, {z: -28, rot: -9, dim: 0.14}),
    P(900, 80, 480, 320, 8, {z: -34, rot: 6, dim: 0.18}),
    P(640, 90, 480, 320, 8, {z: -40, rot: -7, dim: 0.2}),
  ][g];
  const drift = drive(f, 828, 916);
  return {...dest, y: dest.y + (1 - inn) * 90 + drift * 16, x: dest.x + drift * (g - 1.5) * 12, sc: 0.84 + 0.16 * inn, o: Math.min(1, on)};
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

export type Cam = {s: number; x: number; y: number; ox: number; oy: number};

export const camAt = (f: number): Cam => {
  const s = track(f, [
    {f: 0, v: 1.28},
    {f: 10, v: 1.04, d: 26, e: 'smooth'},
    {f: 30, v: 1.1, d: 16, e: 'pop'},
    {f: 48, v: 1.06, d: 16, e: 'pop'},
    {f: 78, v: 1.14, d: 18, e: 'smooth'},
    {f: 108, v: 1.08, d: 16, e: 'smooth'},
    {f: 138, v: 1.16, d: 16, e: 'pop'},
    {f: 168, v: 1.1, d: 16, e: 'smooth'},
    {f: 198, v: 1.06, d: 16, e: 'smooth'},
    {f: 228, v: 1.14, d: 16, e: 'pop'},
    {f: 258, v: 1.1, d: 16, e: 'smooth'},
    {f: 288, v: 1.02, d: 20, e: 'smooth'},
    {f: 318, v: 1.08, d: 16, e: 'pop'},
    {f: 348, v: 1.12, d: 16, e: 'smooth'},
    {f: 378, v: 1.06, d: 16, e: 'pop'},
    {f: 408, v: 1.1, d: 16, e: 'smooth'},
    {f: 468, v: 0.94, d: 22, e: 'smooth'},
    {f: 498, v: 0.9, d: 18, e: 'smooth'},
    {f: 528, v: 1.04, d: 18, e: 'pop'},
    {f: 558, v: 1.08, d: 16, e: 'smooth'},
    {f: 588, v: 1.04, d: 16, e: 'smooth'},
    {f: 618, v: 0.86, d: 22, e: 'smooth'},
    {f: 678, v: 0.9, d: 18, e: 'smooth'},
    {f: 738, v: 0.86, d: 18, e: 'smooth'},
    {f: 798, v: 0.92, d: 18, e: 'smooth'},
    {f: 828, v: 1.04, d: 18, e: 'pop'},
    {f: 888, v: 1.1, d: 16, e: 'pop'},
    {f: 918, v: 1.02, d: 16, e: 'smooth'},
    {f: 948, v: 1.08, d: 16, e: 'pop'},
    {f: 1008, v: 1.04, d: 16, e: 'smooth'},
    {f: 1068, v: 0.98, d: 22, e: 'smooth'},
    {f: 1140, v: 1.06, d: 18, e: 'smooth'},
    {f: 1200, v: 1.1, d: 18, e: 'smooth'},
    {f: 1260, v: 1.04, d: 20, e: 'smooth'},
    {f: 1290, v: 1.08, d: 16, e: 'smooth'},
    {f: 1316, v: 1.03, d: 14, e: 'smooth'},
  ]);
  const x = track(f, [
    {f: 0, v: 40},
    {f: 12, v: 0, d: 24, e: 'smooth'},
    {f: 108, v: -24, d: 16, e: 'smooth'},
    {f: 198, v: -16, d: 16, e: 'smooth'},
    {f: 288, v: 8, d: 20, e: 'smooth'},
    {f: 468, v: 0, d: 20, e: 'smooth'},
    {f: 618, v: 12, d: 20, e: 'smooth'},
    {f: 828, v: -8, d: 18, e: 'smooth'},
    {f: 1068, v: 0, d: 22, e: 'smooth'},
    {f: 1200, v: 6, d: 18, e: 'smooth'},
  ]);
  const y = track(f, [
    {f: 0, v: 20},
    {f: 12, v: 0, d: 24, e: 'smooth'},
    {f: 78, v: -12, d: 16, e: 'smooth'},
    {f: 108, v: 8, d: 16, e: 'smooth'},
    {f: 348, v: -18, d: 16, e: 'pop'},
    {f: 468, v: 6, d: 18, e: 'smooth'},
    {f: 528, v: -10, d: 16, e: 'smooth'},
    {f: 618, v: 8, d: 20, e: 'smooth'},
    {f: 828, v: 4, d: 16, e: 'smooth'},
    {f: 1068, v: -12, d: 22, e: 'smooth'},
    {f: 1200, v: 8, d: 18, e: 'smooth'},
  ]);
  const ox = track(f, [
    {f: 0, v: 960},
    {f: 18, v: 1180, d: 22, e: 'smooth'},
    {f: 78, v: 1260, d: 18, e: 'smooth'},
    {f: 288, v: 1180, d: 22, e: 'smooth'},
    {f: 468, v: 960, d: 22, e: 'smooth'},
    {f: 528, v: 960, d: 18, e: 'smooth'},
    {f: 618, v: 1040, d: 22, e: 'smooth'},
    {f: 828, v: 960, d: 20, e: 'smooth'},
    {f: 1068, v: 960, d: 24, e: 'smooth'},
  ]);
  const oy = track(f, [
    {f: 0, v: 540},
    {f: 18, v: 480, d: 22, e: 'smooth'},
    {f: 78, v: 420, d: 18, e: 'smooth'},
    {f: 288, v: 460, d: 20, e: 'smooth'},
    {f: 348, v: 360, d: 16, e: 'pop'},
    {f: 468, v: 500, d: 20, e: 'smooth'},
    {f: 528, v: 420, d: 16, e: 'smooth'},
    {f: 618, v: 480, d: 22, e: 'smooth'},
    {f: 828, v: 500, d: 18, e: 'smooth'},
    {f: 1068, v: 280, d: 24, e: 'smooth'},
    {f: 1200, v: 250, d: 18, e: 'smooth'},
  ]);
  return {s, x, y, ox, oy};
};

export const CAM_HITS: [number, number][] = [
  [30, 6],
  [120, 7],
  [150, 6],
  [210, 7],
  [240, 6],
  [330, 6],
  [360, 7],
  [540, 5],
  [600, 6],
  [780, 7],
  [990, 7],
  [1080, 6],
  [1140, 4],
];
