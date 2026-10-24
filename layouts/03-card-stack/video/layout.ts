/**
 * 布局 03 · Card Stack v8 —— 意义优先。
 * 一件事：层叠 = 深度排序 + 同时只读一张 + 用身体换层（抽 / 提 / 压）。
 * 6 张真作品贯穿。相邻 TRANS.to 必须不同。
 */
import {POP, SNAP, SMOOTH, spr, track} from '../../../src/lib/anim';

export const DURATION = 1320;
export const FPS = 60;
export const HIT = 12;
export const CARDS = 6;
export const EXTRAS = 4;

export type LayoutName =
  | 'MESS' | 'MESS2' | 'MESS3'
  | 'STACK' | 'STACK2' | 'STACK3'
  | 'PULL' | 'LAND' | 'LAND2' | 'LAND3'
  | 'FLAT' | 'FLAT2'
  | 'LIFT' | 'TOP' | 'TOP2'
  | 'FAN' | 'FAN2'
  | 'PICK' | 'PRESS' | 'PRESS2'
  | 'FOLIO' | 'FOLIO2' | 'FOLIO3' | 'FOLIO_PULL'
  | 'BOARD' | 'BOARD2' | 'MOVE' | 'BOARD3'
  | 'PROOF' | 'PROOF2' | 'COMMIT'
  | 'NOISE' | 'FIX' | 'FIX2'
  | 'END' | 'END2';

export type Family = 'HOOK' | 'STACK' | 'PULL' | 'LIFT' | 'PRESS' | 'FOLIO' | 'BOARD' | 'PROOF' | 'PIT' | 'END';

export const familyOf = (name: LayoutName): Family => {
  if (name.startsWith('MESS')) return 'HOOK';
  if (name.startsWith('STACK')) return 'STACK';
  if (name === 'PULL' || name.startsWith('LAND')) return 'PULL';
  if (name.startsWith('FLAT') || name === 'LIFT' || name.startsWith('TOP')) return 'LIFT';
  if (name.startsWith('FAN') || name === 'PICK' || name.startsWith('PRESS')) return 'PRESS';
  if (name.startsWith('FOLIO')) return 'FOLIO';
  if (name.startsWith('BOARD') || name === 'MOVE') return 'BOARD';
  if (name.startsWith('PROOF') || name === 'COMMIT') return 'PROOF';
  if (name === 'NOISE' || name.startsWith('FIX')) return 'PIT';
  return 'END';
};

export type Pose = {x: number; y: number; w: number; h: number; r: number; z: number; rot: number; sc: number; o: number; dim: number};

const P = (x: number, y: number, w: number, h: number, r: number, extra: Partial<Pose> = {}): Pose => ({
  x, y, w, h, r, z: 0, rot: 0, sc: 1, o: 1, dim: 0, ...extra,
});

const I = [0, 1, 2, 3, 4, 5];

const mess = (spread: number): Pose[] => {
  const x0 = [380, 700, 1020, 520, 1140, 840];
  const y0 = [140, 90, 180, 400, 360, 500];
  const rot = [-9, 7, -5, 12, -11, 6];
  return I.map((i) =>
    P(x0[i] + spread * (i - 2.5) * 14, y0[i] + spread * (i % 2 ? 10 : -8), 400, 500, 6, {
      rot: rot[i] * (1 + spread * 0.12),
      z: 12 - i,
      dim: 0,
    }),
  );
};

/** 工作叠：front 在最前。tray 在左侧等候。gone 抽走。 */
const working = (front: number[], tray: number[], gone: number[], lift: number, nudge = 0): Pose[] => {
  const out: Pose[] = I.map(() => P(0, 0, 10, 10, 6, {o: 0}));
  gone.forEach((i, g) => {
    out[i] = P(-460 - g * 20, 40 + g * 30, 380, 520, 8, {rot: -20, o: 0.2, z: 50, sc: 0.88, dim: 0.2});
  });
  tray.forEach((i, t) => {
    out[i] = P(40, 120 + t * 220 + nudge, 168, 210, 6, {z: -2, dim: 0.3, rot: t % 2 ? 1.2 : -1});
  });
  front.forEach((i, d) => {
    const top = d === 0;
    out[i] = P(
      820 - d * 34 + nudge * (top ? 0 : 1),
      120 - d * 24 - (top ? lift : 0),
      500,
      700,
      8,
      {rot: top ? -1.3 : d % 2 ? 1.05 : -0.75, z: 40 - d * 9, dim: d * 0.11},
    );
  });
  return out;
};

const STACK_A = [0, 1, 2, 3];
const TRAY_A = [4, 5];
const AFTER_PULL = [1, 2, 3, 4];
const TRAY_B = [5];
const AFTER_LIFT = [2, 1, 3, 4];
const AFTER_PRESS = [1, 2, 3, 4];

const flat = (open: number, front: number[]): Pose[] =>
  I.map((i) => {
    const d = front.indexOf(i);
    if (d < 0) {
      const t = i === 5 ? 0 : 1;
      return P(40, 140 + t * 220, 160, 200, 6, {z: -2, dim: 0.32, o: 0.85});
    }
    return P(640 + d * (28 + open * 36), 80 + d * (70 + open * 28), 720 - d * 8, 92 + open * 8, 6, {
      z: 36 - d,
      dim: d * 0.08,
      rot: d === 0 ? -0.4 : d % 2 ? 0.3 : -0.2,
    });
  });

const fan = (wide: number, pick: number, front: number[]): Pose[] =>
  I.map((i) => {
    const d = front.indexOf(i);
    if (d < 0) return P(40, 200, 140, 180, 6, {o: 0.35, dim: 0.4, z: -4});
    if (pick === i) {
      return P(700, 60, 560, 780, 8, {z: 50, rot: -1, dim: 0});
    }
    const t = (d - 1.5) / 2;
    return P(120 + d * 280 * wide, 180 + Math.abs(t) * 70, 240, 560, 7, {
      rot: t * 14,
      z: 16 - Math.abs(d - 1),
      dim: pick >= 0 ? 0.22 : Math.abs(t) * 0.1,
    });
  });

const folio = (split: number, pulled: boolean): Pose[] =>
  I.map((i) => {
    if (i === 0 && pulled) return P(-400, 80, 360, 500, 8, {o: 0.22, rot: -16, z: 40});
    if (i === 1) return P(120 + split * 8, 90, 520, 740, 8, {z: 30, rot: -1.2, dim: 0});
    if (i === 5) return P(40, 860, 140, 160, 6, {o: 0.5, dim: 0.25, z: -2});
    const k = i === 0 ? 0 : i === 2 ? 1 : i === 3 ? 2 : 3;
    return P(780 + k * 22 + split * 10, 140 + k * 16, 460 - k * 4, 640 - k * 4, 8, {
      z: 18 - k,
      rot: k % 2 ? 1 : -0.8,
      dim: 0.08 + k * 0.06,
    });
  });

const board = (moved: boolean, bump = 0): Pose[] =>
  I.map((i) => {
    let col = i < 2 ? 0 : i < 4 ? 1 : 2;
    let row = i < 2 ? i : i < 4 ? i - 2 : i - 4;
    if (moved && i === 1) {
      col = 1;
      row = 2;
    }
    return P(40 + col * 620 + bump * (col - 1) * 6, 80 + row * 300 + (moved && i === 1 ? -12 : 0), 580, 260, 10, {
      z: moved && i === 1 ? 28 : 12 - row,
      rot: moved && i === 1 ? -0.6 : row % 2 ? 0.3 : -0.2,
      dim: col === 2 ? 0.1 : 0,
    });
  });

const proofs = (mode: 'fan' | 'wide' | 'commit'): Pose[] =>
  I.map((i) => {
    if (mode === 'commit') {
      if (i === 1) return P(700, 50, 560, 800, 8, {z: 48, rot: -1});
      const t = i < 1 ? i : i - 1;
      return P(40 + (t % 3) * 200, 160 + Math.floor(t / 3) * 280, 170, 230, 6, {z: 2, dim: 0.24, rot: (t - 2) * 2});
    }
    const t = (i - 2.5) / 2.8;
    const wide = mode === 'wide' ? 1.12 : 1;
    return P(50 + i * 300 * wide, 120 + Math.abs(t) * 80, 260, 680, 7, {
      rot: t * 12,
      z: 18 - Math.abs(i - 2),
      dim: Math.abs(t) * 0.1,
    });
  });

const noise = (wild: number): Pose[] =>
  I.map((i) =>
    P(80 + (i % 3) * 560 + (i % 2 ? wild * 40 : -wild * 28), 60 + Math.floor(i / 3) * 460 + (i % 2) * wild * 20, 360, 280, 8, {
      rot: (i - 2.5) * 8 * (1 + wild),
      z: 8 - i,
      dim: 0.04,
    }),
  );

const fix = (lift: number): Pose[] =>
  I.map((i) => {
    if (i > 3) return P(960, 540, 40, 40, 6, {o: 0, z: -20});
    return P(820 - i * 34, 130 - i * 24 - (i === 0 ? lift : 0), 500, 700, 8, {
      rot: i === 0 ? -1.3 : i % 2 ? 1 : -0.7,
      z: 36 - i * 10,
      dim: i * 0.11,
    });
  });

const shrink = (s: number): Pose[] =>
  I.map((i) => {
    if (i > 3) return P(960, 260, 16, 16, 4, {o: 0, z: -20});
    const x = 820 - i * 34;
    const y = 130 - i * 24;
    return P(960 + (x - 960) * s, 250 + (y - 540) * s, 500 * s, 700 * s, 6, {
      z: 20 - i,
      rot: i === 0 ? -1 : i % 2 ? 0.7 : -0.5,
      dim: i * 0.1,
    });
  });

export const LAYOUTS: Record<LayoutName, Pose[]> = {
  MESS: mess(0),
  MESS2: mess(0.7),
  MESS3: mess(1.15),
  STACK: working(STACK_A, TRAY_A, [], 8),
  STACK2: working(STACK_A, TRAY_A, [], 18),
  STACK3: working(STACK_A, TRAY_A, [], 26, 4),
  PULL: working(AFTER_PULL, TRAY_B, [0], 6),
  LAND: working(AFTER_PULL, TRAY_B, [0], 16),
  LAND2: working(AFTER_PULL, TRAY_B, [0], 10, 4),
  LAND3: working(AFTER_PULL, TRAY_B, [0], 20, -2),
  FLAT: flat(0.15, AFTER_PULL),
  FLAT2: flat(0.55, AFTER_PULL),
  LIFT: working(AFTER_LIFT, TRAY_B, [0], 20),
  TOP: working(AFTER_LIFT, TRAY_B, [0], 12),
  TOP2: working(AFTER_LIFT, TRAY_B, [0], 22, 3),
  FAN: fan(1, -1, AFTER_LIFT),
  FAN2: fan(1.12, -1, AFTER_LIFT),
  PICK: fan(1, 1, AFTER_PRESS),
  PRESS: working(AFTER_PRESS, TRAY_B, [0], 16),
  PRESS2: working(AFTER_PRESS, TRAY_B, [0], 8, 2),
  FOLIO: folio(0, false),
  FOLIO2: folio(1, false),
  FOLIO3: folio(1.4, false),
  FOLIO_PULL: folio(1, true),
  BOARD: board(false),
  BOARD2: board(false, 8),
  MOVE: board(true),
  BOARD3: board(true, -6),
  PROOF: proofs('fan'),
  PROOF2: proofs('wide'),
  COMMIT: proofs('commit'),
  NOISE: noise(0.7),
  FIX: fix(14),
  FIX2: fix(24),
  END: shrink(0.2),
  END2: shrink(0.16),
};

export type Trans = {at: number; to: LayoutName; dur: number; stagger: number; order: number[]};
const ALL = I;
const REV = [...I].reverse();
const MIX = [1, 0, 2, 4, 3, 5];
const seq = (at: number, to: LayoutName, order = ALL): Trans => ({at, to, dur: 26, stagger: 2, order});

export const TRANS: Trans[] = [
  seq(18, 'MESS2', MIX),
  seq(48, 'MESS3', ALL),
  seq(90, 'STACK', [0, 1, 2, 3, 4, 5]),
  seq(120, 'STACK2', ALL),
  seq(144, 'STACK3', ALL),
  seq(174, 'PULL', [0, 1, 2, 3, 4, 5]),
  seq(210, 'LAND', ALL),
  seq(246, 'LAND2', REV),
  seq(282, 'LAND3', ALL),
  seq(330, 'FLAT', MIX),
  seq(366, 'FLAT2', ALL),
  seq(402, 'LIFT', [2, 1, 3, 4, 5, 0]),
  seq(450, 'TOP', ALL),
  seq(486, 'TOP2', ALL),
  seq(534, 'FAN', ALL),
  seq(570, 'FAN2', MIX),
  seq(606, 'PICK', ALL),
  seq(654, 'PRESS', [1, 2, 3, 4, 5, 0]),
  seq(690, 'PRESS2', ALL),
  seq(738, 'FOLIO', ALL),
  seq(774, 'FOLIO2', ALL),
  seq(798, 'FOLIO3', ALL),
  seq(822, 'FOLIO_PULL', ALL),
  seq(870, 'BOARD', MIX),
  seq(906, 'BOARD2', ALL),
  seq(954, 'MOVE', [1, 0, 2, 3, 4, 5]),
  seq(1002, 'BOARD3', ALL),
  seq(1050, 'PROOF', ALL),
  seq(1086, 'PROOF2', MIX),
  seq(1134, 'COMMIT', ALL),
  seq(1170, 'NOISE', ALL),
  seq(1206, 'FIX', ALL),
  seq(1230, 'FIX2', ALL),
  seq(1242, 'END', ALL),
  seq(1278, 'END2', ALL),
];

export const COLOR_DUR = 10;

export const SCENE = {
  HOOK: {in: 0, out: 126},
  STACK: {in: 90, out: 210},
  PULL: {in: 174, out: 360},
  LIFT: {in: 330, out: 540},
  PRESS: {in: 510, out: 750},
  FOLIO: {in: 720, out: 900},
  BOARD: {in: 870, out: 1080},
  PROOF: {in: 1050, out: 1200},
  PIT: {in: 1170, out: 1266},
  END: {in: 1242, out: 9999},
};

export const BEATS = {
  mess: 24,
  stack: 102,
  pull: 186,
  land: 234,
  flat: 342,
  lift: 414,
  fan: 546,
  press: 666,
  folio: 750,
  folioPull: 834,
  board: 882,
  move: 966,
  proof: 1062,
  commit: 1146,
  noise: 1182,
  fix: 1218,
  end: 1254,
};

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

export const drive = (f: number, inn: number, out: number) => Math.min(1, Math.max(0, (f - inn) / Math.max(1, out - inn)));

export const cardState = (f: number, i: number) => {
  let from: LayoutName = 'MESS';
  let to: LayoutName = 'MESS';
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
    const enter = spr(f, i * 3, POP, 22);
    pose = lerpPose({...pose, y: pose.y + 140, o: 0, sc: pose.sc * 1.15, rot: pose.rot - 10}, pose, enter);
  }
  if (to === 'STACK' || to === 'STACK2' || to === 'STACK3') {
    const k = drive(f, 90, 174);
    if (i === 0) pose = {...pose, y: pose.y - 8 * k};
  }
  if (to === 'PULL' && i === 0) {
    const k = drive(f, 174, 220);
    pose = {...pose, x: pose.x - 40 * k, rot: pose.rot - 8 * k};
  }
  if (to === 'LAND' || to === 'LAND2' || to === 'LAND3') {
    const k = drive(f, 210, 330);
    if (i === 1) pose = {...pose, y: pose.y - 7 * k};
  }
  if ((to === 'LIFT' || to === 'TOP' || to === 'TOP2') && i === 2) {
    const k = drive(f, 402, 534);
    pose = {...pose, y: pose.y - 12 * k, z: pose.z + 6 * k};
  }
  if (to === 'FAN' || to === 'FAN2') {
    const k = drive(f, 534, 606);
    pose = {...pose, x: pose.x + (i - 2.5) * 6 * k};
  }
  if (to === 'PRESS' || to === 'PRESS2') {
    const k = drive(f, 654, 738);
    if (i === 1) pose = {...pose, y: pose.y - 6 * k};
  }
  if (to === 'FOLIO' || to === 'FOLIO2' || to === 'FOLIO3') {
    const k = drive(f, 738, 822);
    pose = {...pose, x: pose.x + (i === 1 ? -6 : 4) * k};
  }
  if (to === 'FOLIO_PULL') {
    const k = drive(f, 822, 870);
    pose = {...pose, x: pose.x + (i === 0 ? -10 : 3) * k};
  }
  if (to === 'BOARD3' || to === 'MOVE') {
    const k = drive(f, 954, 1050);
    if (i === 1) pose = {...pose, y: pose.y - 8 * k};
  }
  if (to === 'NOISE') {
    const k = drive(f, 1170, 1206);
    pose = {...pose, rot: pose.rot + (i % 2 ? 4 : -4) * k};
  }
  if (to === 'END' || to === 'END2') {
    const k = drive(f, 1242, 1320);
    pose = {...pose, sc: pose.sc * (1 - 0.06 * k), y: pose.y - 4 * k};
  }
  pose = {...pose, o: Math.min(1, Math.max(0, pose.o))};
  return {from, to, p, pc, pose};
};

export const extraState = (f: number, g: number): Pose | null => {
  const inn = spr(f, 1170 + g * 4, SNAP, 18);
  const out = spr(f, 1206, SMOOTH, 16);
  const on = Math.max(0, inn - out);
  if (on <= 0.001) return null;
  const dest = P(80 + (g % 2) * 980, 40 + Math.floor(g / 2) * 520, 300, 200, 8, {z: -8 - g, rot: (g - 1.5) * 10});
  const drift = drive(f, 1170, 1200);
  return {...dest, x: dest.x + drift * (g - 1.5) * 18, y: dest.y + (1 - inn) * 70, sc: 0.82 + 0.18 * inn, o: Math.min(1, on)};
};

export const poseVel = (f: number, i: number) => {
  const a = cardState(Math.max(0, f), i).pose;
  const b = cardState(Math.max(0, f - 1), i).pose;
  return Math.hypot(a.x - b.x, a.y - b.y) + Math.hypot(a.w - b.w, a.h - b.h) * 0.28 + Math.abs(a.rot - b.rot) * 2.4;
};

export const motionBlurPx = (vel: number) => (vel < 6 ? 0 : Math.min(2.2, (vel - 6) * 0.1));

export type Cam = {s: number; x: number; y: number; ox: number; oy: number};

export const camAt = (f: number): Cam => {
  const s = track(f, [
    {f: 0, v: 1.08},
    {f: 18, v: 0.98, d: 18, e: 'smooth'},
    {f: 36, v: 1.0, d: 16, e: 'smooth'},
    {f: 54, v: 0.97, d: 16, e: 'smooth'},
    {f: 72, v: 1.01, d: 16, e: 'smooth'},
    {f: 90, v: 1.03, d: 16, e: 'pop'},
    {f: 108, v: 1.0, d: 16, e: 'smooth'},
    {f: 126, v: 1.02, d: 16, e: 'smooth'},
    {f: 144, v: 0.99, d: 16, e: 'smooth'},
    {f: 162, v: 1.01, d: 14, e: 'smooth'},
    {f: 174, v: 1.0, d: 14, e: 'smooth'},
    {f: 192, v: 1.04, d: 14, e: 'smooth'},
    {f: 210, v: 1.06, d: 14, e: 'pop'},
    {f: 228, v: 1.03, d: 14, e: 'smooth'},
    {f: 246, v: 1.02, d: 14, e: 'smooth'},
    {f: 264, v: 1.04, d: 14, e: 'smooth'},
    {f: 282, v: 1.03, d: 14, e: 'smooth'},
    {f: 300, v: 1.0, d: 14, e: 'smooth'},
    {f: 318, v: 0.97, d: 14, e: 'smooth'},
    {f: 330, v: 0.96, d: 16, e: 'smooth'},
    {f: 348, v: 0.98, d: 14, e: 'smooth'},
    {f: 366, v: 0.95, d: 14, e: 'smooth'},
    {f: 384, v: 0.99, d: 14, e: 'smooth'},
    {f: 402, v: 1.04, d: 16, e: 'pop'},
    {f: 420, v: 1.01, d: 14, e: 'smooth'},
    {f: 438, v: 1.03, d: 14, e: 'smooth'},
    {f: 456, v: 1.0, d: 14, e: 'smooth'},
    {f: 474, v: 1.02, d: 14, e: 'smooth'},
    {f: 492, v: 0.99, d: 14, e: 'smooth'},
    {f: 510, v: 0.97, d: 14, e: 'smooth'},
    {f: 534, v: 0.94, d: 16, e: 'smooth'},
    {f: 552, v: 0.96, d: 14, e: 'smooth'},
    {f: 570, v: 0.95, d: 14, e: 'smooth'},
    {f: 588, v: 0.98, d: 14, e: 'smooth'},
    {f: 606, v: 1.02, d: 16, e: 'pop'},
    {f: 624, v: 1.0, d: 14, e: 'smooth'},
    {f: 642, v: 1.03, d: 14, e: 'smooth'},
    {f: 654, v: 1.06, d: 14, e: 'pop'},
    {f: 672, v: 1.03, d: 14, e: 'smooth'},
    {f: 690, v: 1.01, d: 14, e: 'smooth'},
    {f: 708, v: 0.98, d: 14, e: 'smooth'},
    {f: 726, v: 0.96, d: 14, e: 'smooth'},
    {f: 738, v: 0.96, d: 16, e: 'smooth'},
    {f: 756, v: 0.98, d: 14, e: 'smooth'},
    {f: 774, v: 0.97, d: 14, e: 'smooth'},
    {f: 792, v: 0.99, d: 14, e: 'smooth'},
    {f: 810, v: 1.01, d: 14, e: 'smooth'},
    {f: 828, v: 1.0, d: 14, e: 'smooth'},
    {f: 846, v: 0.98, d: 14, e: 'smooth'},
    {f: 864, v: 0.96, d: 14, e: 'smooth'},
    {f: 870, v: 0.96, d: 16, e: 'smooth'},
    {f: 888, v: 0.98, d: 14, e: 'smooth'},
    {f: 906, v: 0.97, d: 14, e: 'smooth'},
    {f: 924, v: 0.99, d: 14, e: 'smooth'},
    {f: 942, v: 1.0, d: 14, e: 'smooth'},
    {f: 954, v: 1.02, d: 14, e: 'pop'},
    {f: 972, v: 1.0, d: 14, e: 'smooth'},
    {f: 990, v: 0.98, d: 14, e: 'smooth'},
    {f: 1008, v: 0.97, d: 14, e: 'smooth'},
    {f: 1026, v: 0.95, d: 14, e: 'smooth'},
    {f: 1050, v: 0.94, d: 16, e: 'smooth'},
    {f: 1068, v: 0.96, d: 14, e: 'smooth'},
    {f: 1086, v: 0.95, d: 14, e: 'smooth'},
    {f: 1104, v: 0.98, d: 14, e: 'smooth'},
    {f: 1122, v: 1.01, d: 14, e: 'smooth'},
    {f: 1134, v: 1.04, d: 14, e: 'pop'},
    {f: 1152, v: 1.01, d: 14, e: 'smooth'},
    {f: 1170, v: 0.98, d: 14, e: 'pop'},
    {f: 1188, v: 1.0, d: 14, e: 'smooth'},
    {f: 1206, v: 1.08, d: 16, e: 'pop'},
    {f: 1224, v: 1.04, d: 14, e: 'smooth'},
    {f: 1242, v: 1.02, d: 16, e: 'smooth'},
    {f: 1260, v: 1.05, d: 14, e: 'smooth'},
    {f: 1278, v: 1.06, d: 14, e: 'smooth'},
    {f: 1296, v: 1.04, d: 12, e: 'smooth'},
    {f: 1314, v: 1.03, d: 10, e: 'smooth'},
  ]);
  const x = track(f, [
    {f: 0, v: 8},
    {f: 18, v: 0, d: 18, e: 'smooth'},
    {f: 174, v: -12, d: 16, e: 'smooth'},
    {f: 330, v: 6, d: 16, e: 'smooth'},
    {f: 738, v: -8, d: 16, e: 'smooth'},
    {f: 870, v: 0, d: 16, e: 'smooth'},
    {f: 1242, v: 0, d: 18, e: 'smooth'},
  ]);
  const y = track(f, [
    {f: 0, v: 6},
    {f: 18, v: 0, d: 18, e: 'smooth'},
    {f: 90, v: -8, d: 16, e: 'smooth'},
    {f: 402, v: -10, d: 16, e: 'pop'},
    {f: 654, v: -6, d: 16, e: 'smooth'},
    {f: 954, v: -4, d: 16, e: 'smooth'},
    {f: 1242, v: -8, d: 18, e: 'smooth'},
  ]);
  const ox = track(f, [
    {f: 0, v: 960},
    {f: 90, v: 980, d: 16, e: 'smooth'},
    {f: 174, v: 900, d: 16, e: 'smooth'},
    {f: 330, v: 960, d: 16, e: 'smooth'},
    {f: 738, v: 700, d: 18, e: 'smooth'},
    {f: 870, v: 960, d: 16, e: 'smooth'},
    {f: 1134, v: 980, d: 16, e: 'smooth'},
    {f: 1242, v: 960, d: 18, e: 'smooth'},
  ]);
  const oy = track(f, [
    {f: 0, v: 540},
    {f: 90, v: 480, d: 16, e: 'smooth'},
    {f: 330, v: 420, d: 16, e: 'smooth'},
    {f: 534, v: 500, d: 16, e: 'smooth'},
    {f: 738, v: 500, d: 16, e: 'smooth'},
    {f: 1134, v: 460, d: 16, e: 'smooth'},
    {f: 1242, v: 260, d: 18, e: 'smooth'},
  ]);
  return {s, x, y, ox, oy};
};

export const CAM_HITS: [number, number][] = [
  [90, 5],
  [186, 7],
  [234, 5],
  [414, 6],
  [666, 7],
  [834, 5],
  [966, 6],
  [1146, 6],
  [1218, 6],
  [1254, 4],
];
