/**
 * 布局 03 · Card Stack v7 —— 16 张卡贯穿。
 * 开场风暴同屏 16；8 种方案变形接力；14 种动效。相邻 TRANS.to 必须不同。
 */
import {POP, SNAP, SMOOTH, spr, track} from '../../../src/lib/anim';

export const DURATION = 1320;
export const FPS = 60;
export const HIT = 12;
export const CARDS = 16;
export const EXTRAS = 8;

export type LayoutName =
  | 'STORM' | 'STORM2' | 'CASCADE' | 'CASCADE2' | 'PILE' | 'PILE2'
  | 'MAG' | 'MAG2' | 'MAG_PULL' | 'MAG_LAND' | 'MAG3'
  | 'LAYER' | 'LAYER2' | 'LAYER_LIFT' | 'LAYER_TOP'
  | 'PROOF' | 'PROOF2' | 'PICK' | 'PRESS'
  | 'BOARD' | 'BOARD2' | 'MOVE' | 'BOARD3'
  | 'ALBUM' | 'ALBUM2' | 'SHUFFLE' | 'ALBUM3'
  | 'NOTE' | 'NOTE2' | 'PUSH' | 'NOTE3'
  | 'PAY' | 'PAY_FAN' | 'PAY2' | 'PAY3'
  | 'FOLIO' | 'FOLIO2' | 'TEACH' | 'TEACH2'
  | 'NOISE' | 'NOISE2' | 'FLAT' | 'FIX' | 'FIX2'
  | 'END' | 'END2';

export type Family = 'OPEN' | 'MAG' | 'LAYER' | 'PROOF' | 'BOARD' | 'ALBUM' | 'NOTE' | 'PAY' | 'FOLIO' | 'PIT' | 'END';

export const familyOf = (name: LayoutName): Family => {
  if (name.startsWith('STORM') || name.startsWith('CASCADE') || name.startsWith('PILE')) return 'OPEN';
  if (name.startsWith('MAG')) return 'MAG';
  if (name.startsWith('LAYER')) return 'LAYER';
  if (name === 'PROOF' || name === 'PROOF2' || name === 'PICK' || name === 'PRESS') return 'PROOF';
  if (name.startsWith('BOARD') || name === 'MOVE') return 'BOARD';
  if (name.startsWith('ALBUM') || name === 'SHUFFLE') return 'ALBUM';
  if (name.startsWith('NOTE') || name === 'PUSH') return 'NOTE';
  if (name.startsWith('PAY')) return 'PAY';
  if (name.startsWith('FOLIO') || name.startsWith('TEACH')) return 'FOLIO';
  if (name === 'NOISE' || name === 'NOISE2' || name === 'FLAT' || name.startsWith('FIX')) return 'PIT';
  return 'END';
};

export type Pose = {x: number; y: number; w: number; h: number; r: number; z: number; rot: number; sc: number; o: number; dim: number};

const P = (x: number, y: number, w: number, h: number, r: number, extra: Partial<Pose> = {}): Pose => ({
  x, y, w, h, r, z: 0, rot: 0, sc: 1, o: 1, dim: 0, ...extra,
});

const I = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const SIZE: [number, number][] = [
  [380, 520], [160, 160], [440, 250], [140, 300],
  [300, 420], [360, 200], [180, 340], [460, 270],
  [220, 360], [280, 160], [150, 230], [400, 310],
  [200, 200], [160, 380], [340, 190], [190, 280],
];

const storm = (spread: number, spin: number): Pose[] =>
  I.map((i) => {
    const a = (i / 16) * Math.PI * 2 + spin * 0.7 + 0.2;
    const rad = 340 + (i % 5) * 90 + spread * 70;
    const [w, h] = SIZE[i];
    return P(960 + Math.cos(a) * rad - w / 2, 520 + Math.sin(a) * rad * 0.62 - h / 2, w, h, 8, {
      rot: (i - 8) * 11 + spin * 26,
      z: 24 - i,
      sc: 0.92 + (i % 3) * 0.06,
    });
  });

const cascade = (jolt: number): Pose[] =>
  I.map((i) => {
    const c = i % 4;
    const r = Math.floor(i / 4);
    const w = 430 + (i % 3) * 12;
    const h = 236 + (i % 2) * 16;
    return P(16 + c * 478 + (i % 2 ? jolt : -jolt), 12 + r * 268 + (c % 2 ? jolt * 0.35 : 0), w, h, 8, {
      rot: (i % 2 ? 2.4 : -1.8) + jolt * 0.08,
      z: 20 - i,
    });
  });

const pile = (lift: number): Pose[] =>
  I.map((i) =>
    P(780 - i * 16, 160 - i * 12 - (i === 0 ? lift : 0), 420 - i * 3, 560 - i * 3, 8, {
      rot: i === 0 ? -1.6 : i % 2 ? 1.5 : -1.0,
      z: 40 - i * 2,
      dim: Math.min(0.42, i * 0.028),
      sc: 1 - i * 0.012 + (i === 0 ? 0.02 : 0),
    }),
  );

const mag = (pull: number, land: number): Pose[] =>
  I.map((i) => {
    if (i < 4) {
      const front = (i + (pull ? 1 : 0)) % 4;
      const gone = pull && i === 0;
      return P(
        gone ? -520 : 720 - front * 40,
        gone ? 20 : 80 - front * 28 - (land && front === 0 ? 18 : 0),
        520,
        760,
        8,
        {rot: gone ? -20 : front === 0 ? -1.4 : front % 2 ? 1.1 : -0.7, z: gone ? 60 : 36 - front * 10, o: gone ? 0.28 : 1, dim: front * 0.1, sc: gone ? 0.9 : 1},
      );
    }
    const k = i - 4;
    return P(36 + (k % 2) * 52, 24 + Math.floor(k / 2) * 172, 44, 156, 3, {
      rot: -90 + (k % 2 ? 2 : -2),
      z: -4 - k,
      dim: 0.06,
    });
  });

const layers = (lift: number): Pose[] =>
  I.map((i) => {
    const depth = (i - lift + 16) % 16;
    const up = i === lift;
    return P(80 + depth * 8, 16 + depth * 64 - (up ? 22 : 0), 1760 - depth * 6, 70, 6, {
      z: up ? 50 : 30 - depth,
      dim: up ? 0 : Math.min(0.38, depth * 0.03),
      rot: up ? -0.4 : depth % 2 ? 0.25 : -0.2,
      sc: up ? 1.03 : 1,
    });
  });

const proofs = (mode: 'fan' | 'wide' | 'pick' | 'press'): Pose[] =>
  I.map((i) => {
    if (mode === 'press') {
      const d = (i + 15) % 16;
      return P(780 - d * 16, 80 - d * 12 - (i === 1 ? 16 : 0), 440, 640, 8, {
        z: i === 1 ? 44 : 20 - d,
        dim: i === 1 ? 0 : 0.12 + d * 0.02,
        rot: i === 1 ? -1.2 : d % 2 ? 1 : -0.8,
      });
    }
    if (mode === 'pick') {
      if (i === 1) return P(640, 40, 640, 860, 8, {z: 50, rot: -0.8});
      const t = i < 1 ? i : i - 1;
      const side = t < 8 ? 0 : 1;
      const k = t % 8;
      return P(side ? 1400 : 40, 30 + k * 128, 160, 150, 6, {z: 2, rot: (k - 4) * 2, dim: 0.18, sc: 0.94});
    }
    const t = (i - 7.5) / 7.5;
    const wide = mode === 'wide' ? 1.18 : 1;
    return P(10 + i * 118 * wide, 80 + Math.abs(t) * 110, 210, 620, 6, {
      rot: t * 22,
      z: 18 - Math.abs(i - 7),
      dim: Math.abs(t) * 0.1,
    });
  });

const board = (moved: boolean, bump = 0): Pose[] =>
  I.map((i) => {
    const col = i < 6 ? 0 : i < 11 ? 1 : 2;
    const row = i < 6 ? i : i < 11 ? i - 6 : i - 11;
    const slide = moved && i === 5;
    const c = slide ? 1 : col;
    const r = slide ? 5 : row;
    return P(28 + c * 632 + bump * (c - 1) * 8, 28 + r * 172 + (slide ? -10 : 0), 600, 152, 10, {
      z: slide ? 30 : 12 - r,
      rot: slide ? -0.7 : (r % 2 ? 0.35 : -0.25),
      dim: c === 2 ? 0.1 : 0,
    });
  });

const album = (mode: 'spread' | 'wild' | 'shuffle' | 'stack'): Pose[] =>
  I.map((i) => {
    if (mode === 'stack') {
      return P(780 - i * 20, 120 - i * 14 - (i === 0 ? 14 : 0), 360, 460, 8, {
        rot: i === 0 ? -2 : i % 2 ? 3 : -2,
        z: 30 - i,
        dim: i * 0.04,
      });
    }
    const c = i % 4;
    const r = Math.floor(i / 4);
    const jx = mode === 'wild' ? (i % 2 ? 48 : -36) : mode === 'shuffle' ? (i % 3 - 1) * 56 : (i % 2 ? 14 : -10);
    const jy = mode === 'wild' ? (c % 2 ? 28 : -18) : mode === 'shuffle' ? (r % 2 ? 22 : -14) : (c % 2 ? 10 : 0);
    const rot = mode === 'shuffle' ? (i - 8) * 11 : mode === 'wild' ? (i - 8) * 6 : (i % 2 ? 5 : -4);
    return P(30 + c * 472 + jx, 16 + r * 266 + jy, 300, 380, 6, {
      rot,
      z: 16 - (i % 8),
    });
  });

const notes = (press: number): Pose[] =>
  I.map((i) => {
    const col = i < 8 ? 0 : 1;
    const row = i % 8;
    const top = row === 0;
    return P(40 + col * 940, 20 + row * 128 - (top ? press * 18 : press * 2), 880, 168, 18, {
      z: 30 - row + col,
      dim: Math.min(0.32, row * 0.035),
      rot: top ? -0.4 : row % 2 ? 0.35 : -0.25,
      sc: top ? 1.03 : 1 - row * 0.01,
    });
  });

const pay = (mode: 'deck' | 'fan' | 'draw' | 'close'): Pose[] =>
  I.map((i) => {
    if (mode === 'draw' && i === 0) return P(-480, 60, 560, 350, 18, {z: 50, rot: -24, o: 0.35, sc: 0.9});
    if (mode === 'fan' || mode === 'draw') {
      const t = (i - 7.5) / 8;
      return P(420 + t * 620, 300 + Math.abs(t) * 50, 520, 330, 18, {
        rot: t * 30,
        z: 22 - Math.abs(i - 3),
        dim: i === 0 && mode === 'draw' ? 0.28 : Math.abs(t) * 0.07,
      });
    }
    const d = i;
    return P(700 - d * 14, 280 - d * 10 - (mode === 'deck' && i === 0 ? 12 : 0), 540, 340, 18, {
      rot: i === 0 ? -2.2 : d % 2 ? 1.6 : -1.1,
      z: 24 - d,
      dim: d * 0.028,
    });
  });

const folio = (split: number): Pose[] =>
  I.map((i) => {
    const g = i < 5 ? 0 : i < 11 ? 1 : 2;
    const k = i < 5 ? i : i < 11 ? i - 5 : i - 11;
    return P(70 + g * 620 + k * 20 + split * g * 14, 90 + k * 16 - (k === 0 ? 14 : 0), 500 - k * 4, 700 - k * 4, 8, {
      z: 20 - k + g,
      rot: k === 0 ? -1.2 : k % 2 ? 1 : -0.7,
      dim: k * 0.08,
    });
  });

const teach = (spread: number): Pose[] =>
  I.map((i) =>
    P(20 + (i % 4) * 478 + i * 10 * spread, 16 + Math.floor(i / 4) * 266 + i * 12 * spread, 430, 230, 8, {
      z: 20 - i,
      rot: (i - 8) * 4 * spread,
      dim: 0.04 * Math.floor(i / 4),
    }),
  );

const noise = (wild: number): Pose[] =>
  I.map((i) =>
    P(20 + (i % 5) * 380 + (i % 2 ? wild * 50 : -wild * 36), 16 + Math.floor(i / 5) * 350 + (i % 3) * wild * 20, 300, 240, 8, {
      rot: (i - 8) * 8 * (1 + wild),
      z: 10 - i,
      dim: 0.05,
    }),
  );

const flat = (): Pose[] => I.map((i) => P(20 + (i % 4) * 478, 16 + Math.floor(i / 4) * 266, 450, 240, 8, {z: 1, rot: 0, dim: 0}));

const fix = (lift: number): Pose[] =>
  I.map((i) => {
    if (i > 3) return P(960, 540, 80, 80, 6, {o: 0, z: -20});
    return P(820 - i * 36, 160 - i * 26 - (i === 0 ? lift : 0), 480, 660, 8, {
      rot: i === 0 ? -1.4 : i % 2 ? 1.1 : -0.8,
      z: 36 - i * 10,
      dim: i * 0.12,
    });
  });

const shrink = (s: number): Pose[] =>
  I.map((i) => {
    if (i > 3) return P(960, 260, 20, 20, 4, {o: 0, z: -20});
    const x = 820 - i * 36;
    const y = 160 - i * 26;
    return P(960 + (x - 960) * s, 250 + (y - 540) * s, 480 * s, 660 * s, 6, {
      z: 20 - i,
      rot: i === 0 ? -1 : i % 2 ? 0.8 : -0.5,
      dim: i * 0.1,
    });
  });

export const LAYOUTS: Record<LayoutName, Pose[]> = {
  STORM: storm(0, 0),
  STORM2: storm(1.15, 0.35),
  CASCADE: cascade(0),
  CASCADE2: cascade(18),
  PILE: pile(8),
  PILE2: pile(22),
  MAG: mag(0, 0),
  MAG2: mag(0, 1),
  MAG_PULL: mag(1, 0),
  MAG_LAND: mag(1, 1),
  MAG3: mag(1, 1).map((p, i) => (i === 1 ? {...p, y: p.y - 16, z: p.z + 8} : {...p, dim: Math.min(0.5, p.dim + 0.05)})),
  LAYER: layers(0),
  LAYER2: layers(0),
  LAYER_LIFT: layers(11),
  LAYER_TOP: layers(11),
  PROOF: proofs('fan'),
  PROOF2: proofs('wide'),
  PICK: proofs('pick'),
  PRESS: proofs('press'),
  BOARD: board(false),
  BOARD2: board(false, 8),
  MOVE: board(true),
  BOARD3: board(true, -6),
  ALBUM: album('spread'),
  ALBUM2: album('wild'),
  SHUFFLE: album('shuffle'),
  ALBUM3: album('stack'),
  NOTE: notes(0),
  NOTE2: notes(6),
  PUSH: notes(22),
  NOTE3: notes(10),
  PAY: pay('deck'),
  PAY_FAN: pay('fan'),
  PAY2: pay('draw'),
  PAY3: pay('close'),
  FOLIO: folio(0),
  FOLIO2: folio(1),
  TEACH: teach(0.2),
  TEACH2: teach(1),
  NOISE: noise(0.4),
  NOISE2: noise(1.2),
  FLAT: flat(),
  FIX: fix(16),
  FIX2: fix(28),
  END: shrink(0.22),
  END2: shrink(0.17),
};

// LAYER and LAYER2 must differ — bump LAYER2
LAYOUTS.LAYER2 = layers(0).map((p, i) => ({...p, y: p.y + (i % 2 ? 6 : -4), x: p.x + 8}));
LAYOUTS.LAYER_TOP = layers(11).map((p, i) => ({...p, y: p.y + (i === 11 ? -10 : 6)}));

export type Trans = {at: number; to: LayoutName; dur: number; stagger: number; order: number[]};
const ALL = I;
const REV = [...I].reverse();
const MIX = [0, 5, 10, 15, 2, 7, 12, 4, 9, 14, 1, 6, 11, 3, 8, 13];
const seq = (at: number, to: LayoutName, order = ALL): Trans => ({at, to, dur: 24, stagger: 1, order});

export const TRANS: Trans[] = [
  seq(18, 'STORM2', MIX),
  seq(42, 'CASCADE', ALL),
  seq(66, 'CASCADE2', REV),
  seq(90, 'PILE', MIX),
  seq(114, 'PILE2', ALL),
  seq(162, 'MAG', ALL),
  seq(186, 'MAG2', ALL),
  seq(210, 'MAG_PULL', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
  seq(246, 'MAG_LAND', ALL),
  seq(264, 'MAG3', ALL),
  seq(282, 'LAYER', MIX),
  seq(306, 'LAYER2', ALL),
  seq(330, 'LAYER_LIFT', REV),
  seq(366, 'LAYER_TOP', ALL),
  seq(402, 'PROOF', ALL),
  seq(426, 'PROOF2', MIX),
  seq(450, 'PICK', ALL),
  seq(486, 'PRESS', ALL),
  seq(522, 'BOARD', MIX),
  seq(546, 'BOARD2', ALL),
  seq(570, 'MOVE', ALL),
  seq(606, 'BOARD3', ALL),
  seq(642, 'ALBUM', MIX),
  seq(666, 'ALBUM2', ALL),
  seq(690, 'SHUFFLE', REV),
  seq(726, 'ALBUM3', ALL),
  seq(762, 'NOTE', ALL),
  seq(786, 'NOTE2', ALL),
  seq(810, 'PUSH', MIX),
  seq(846, 'NOTE3', ALL),
  seq(882, 'PAY', ALL),
  seq(906, 'PAY_FAN', MIX),
  seq(930, 'PAY2', ALL),
  seq(966, 'PAY3', ALL),
  seq(1002, 'FOLIO', ALL),
  seq(1026, 'FOLIO2', ALL),
  seq(1050, 'TEACH', MIX),
  seq(1086, 'TEACH2', ALL),
  seq(1122, 'NOISE', ALL),
  seq(1146, 'NOISE2', MIX),
  seq(1170, 'FLAT', ALL),
  seq(1194, 'FIX', ALL),
  seq(1218, 'FIX2', ALL),
  seq(1242, 'END', ALL),
  seq(1266, 'END2', ALL),
  seq(1290, 'END', ALL),
];

export const COLOR_DUR = 10;

export const SCENE = {
  OPEN: {in: 0, out: 186},
  MAG: {in: 162, out: 306},
  LAYER: {in: 282, out: 426},
  PROOF: {in: 402, out: 546},
  BOARD: {in: 522, out: 666},
  ALBUM: {in: 642, out: 786},
  NOTE: {in: 762, out: 906},
  PAY: {in: 882, out: 1026},
  FOLIO: {in: 1002, out: 1146},
  PIT: {in: 1122, out: 1266},
  END: {in: 1242, out: 9999},
};

export const BEATS = {
  storm: 18,
  grid: 54,
  pile: 102,
  mag: 174,
  pull: 222,
  land: 258,
  layer: 294,
  lift: 342,
  fan: 414,
  pick: 462,
  board: 534,
  move: 582,
  album: 654,
  shuffle: 702,
  note: 774,
  push: 822,
  pay: 894,
  draw: 942,
  folio: 1014,
  explode: 1062,
  noise: 1134,
  flat: 1182,
  fix: 1206,
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
  let from: LayoutName = 'STORM';
  let to: LayoutName = 'STORM';
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
    const enter = spr(f, i * 1.2, POP, 22);
    pose = lerpPose({...pose, y: pose.y + 160, o: 0, sc: pose.sc * 1.4, rot: pose.rot - 16, z: pose.z - 40}, pose, enter);
  }
  if (familyOf(to) === 'OPEN') {
    const k = drive(f, 0, 160);
    pose = {...pose, rot: pose.rot + (i % 2 ? 2 : -2) * k, x: pose.x + Math.sin(i) * 6 * k};
  }
  if (to === 'MAG_PULL' && i === 0) {
    const k = drive(f, 210, 250);
    pose = {...pose, x: pose.x - 50 * k, rot: pose.rot - 6 * k};
  }
  if ((to === 'LAYER_LIFT' || to === 'LAYER_TOP') && i === 11) {
    const k = drive(f, 330, 390);
    pose = {...pose, y: pose.y - 10 * k, z: pose.z + 8 * k};
  }
  if (to === 'PROOF' || to === 'PROOF2') {
    const k = drive(f, 402, 450);
    pose = {...pose, x: pose.x + (i - 7.5) * 6 * k, rot: pose.rot * (1 + 0.08 * k)};
  }
  if (to === 'SHUFFLE' || to === 'ALBUM2') {
    const k = drive(f, 666, 726);
    pose = {...pose, rot: pose.rot + (i % 2 ? 4 : -4) * k};
  }
  if (to === 'PUSH' && i === 0) {
    const k = drive(f, 810, 850);
    pose = {...pose, y: pose.y - 8 * k};
  }
  if (to === 'TEACH' || to === 'TEACH2') {
    const k = drive(f, 1050, 1120);
    pose = {...pose, x: pose.x + (i % 4) * 8 * k, y: pose.y + Math.floor(i / 4) * 6 * k};
  }
  if (to === 'NOISE' || to === 'NOISE2') {
    const k = drive(f, 1122, 1170);
    pose = {...pose, rot: pose.rot + (i % 2 ? 5 : -5) * k, x: pose.x + (i - 8) * 4 * k};
  }
  if (to === 'END' || to === 'END2') {
    const k = drive(f, 1242, 1320);
    pose = {...pose, sc: pose.sc * (1 - 0.08 * k), y: pose.y - 6 * k};
  }

  pose = {...pose, o: Math.min(1, Math.max(0, pose.o))};
  return {from, to, p, pc, pose};
};

export const extraState = (f: number, g: number): Pose | null => {
  const inn = spr(f, 1122 + g * 3, SNAP, 20);
  const out = spr(f, 1194, SMOOTH, 16);
  const on = Math.max(0, inn - out);
  if (on <= 0.001) return null;
  const dest = P(80 + (g % 4) * 460, 40 + Math.floor(g / 4) * 500, 320, 220, 8, {z: -10 - g, rot: (g - 3.5) * 10});
  const drift = drive(f, 1122, 1170);
  return {...dest, x: dest.x + drift * (g - 3.5) * 16, y: dest.y + (1 - inn) * 80 + drift * 12, sc: 0.8 + 0.2 * inn, o: Math.min(1, on)};
};

export const poseVel = (f: number, i: number) => {
  const a = cardState(Math.max(0, f), i).pose;
  const b = cardState(Math.max(0, f - 1), i).pose;
  return Math.hypot(a.x - b.x, a.y - b.y) + Math.hypot(a.w - b.w, a.h - b.h) * 0.28 + Math.abs(a.rot - b.rot) * 2.4;
};

export const motionBlurPx = (vel: number) => (vel < 6 ? 0 : Math.min(2.4, (vel - 6) * 0.1));

export type Cam = {s: number; x: number; y: number; ox: number; oy: number};

export const camAt = (f: number): Cam => {
  const s = track(f, [
    {f: 0, v: 1.04},
    {f: 12, v: 0.98, d: 20, e: 'smooth'},
    {f: 42, v: 0.96, d: 18, e: 'smooth'},
    {f: 90, v: 1.02, d: 18, e: 'pop'},
    {f: 162, v: 0.98, d: 18, e: 'smooth'},
    {f: 210, v: 1.02, d: 16, e: 'smooth'},
    {f: 246, v: 1.06, d: 14, e: 'pop'},
    {f: 264, v: 1.02, d: 14, e: 'smooth'},
    {f: 282, v: 0.94, d: 18, e: 'smooth'},
    {f: 330, v: 0.98, d: 16, e: 'pop'},
    {f: 402, v: 0.94, d: 18, e: 'smooth'},
    {f: 450, v: 1.0, d: 16, e: 'pop'},
    {f: 522, v: 0.96, d: 18, e: 'smooth'},
    {f: 570, v: 1.0, d: 16, e: 'pop'},
    {f: 642, v: 0.96, d: 18, e: 'smooth'},
    {f: 690, v: 0.94, d: 16, e: 'pop'},
    {f: 762, v: 0.96, d: 18, e: 'smooth'},
    {f: 810, v: 1.0, d: 16, e: 'pop'},
    {f: 882, v: 1.0, d: 18, e: 'smooth'},
    {f: 930, v: 1.06, d: 16, e: 'pop'},
    {f: 1002, v: 0.94, d: 18, e: 'smooth'},
    {f: 1050, v: 0.9, d: 18, e: 'smooth'},
    {f: 1122, v: 0.98, d: 16, e: 'pop'},
    {f: 1170, v: 0.96, d: 16, e: 'smooth'},
    {f: 1194, v: 1.06, d: 16, e: 'pop'},
    {f: 1242, v: 1.02, d: 18, e: 'smooth'},
    {f: 1290, v: 1.08, d: 16, e: 'smooth'},
    {f: 1314, v: 1.03, d: 12, e: 'smooth'},
  ]);
  const x = track(f, [
    {f: 0, v: 20},
    {f: 18, v: 0, d: 20, e: 'smooth'},
    {f: 162, v: -8, d: 16, e: 'smooth'},
    {f: 282, v: 8, d: 16, e: 'smooth'},
    {f: 522, v: 0, d: 16, e: 'smooth'},
    {f: 762, v: -10, d: 16, e: 'smooth'},
    {f: 1002, v: 8, d: 16, e: 'smooth'},
    {f: 1242, v: 0, d: 18, e: 'smooth'},
  ]);
  const y = track(f, [
    {f: 0, v: 12},
    {f: 18, v: 0, d: 20, e: 'smooth'},
    {f: 90, v: -6, d: 16, e: 'smooth'},
    {f: 330, v: -8, d: 16, e: 'pop'},
    {f: 642, v: 4, d: 16, e: 'smooth'},
    {f: 810, v: -4, d: 16, e: 'smooth'},
    {f: 1050, v: 4, d: 16, e: 'smooth'},
    {f: 1242, v: -10, d: 18, e: 'smooth'},
  ]);
  const ox = track(f, [
    {f: 0, v: 960},
    {f: 18, v: 960, d: 16, e: 'smooth'},
    {f: 162, v: 900, d: 18, e: 'smooth'},
    {f: 282, v: 960, d: 18, e: 'smooth'},
    {f: 450, v: 960, d: 16, e: 'smooth'},
    {f: 762, v: 960, d: 16, e: 'smooth'},
    {f: 930, v: 960, d: 16, e: 'smooth'},
    {f: 1242, v: 960, d: 18, e: 'smooth'},
  ]);
  const oy = track(f, [
    {f: 0, v: 540},
    {f: 90, v: 500, d: 18, e: 'smooth'},
    {f: 162, v: 480, d: 16, e: 'smooth'},
    {f: 330, v: 500, d: 16, e: 'pop'},
    {f: 402, v: 540, d: 16, e: 'smooth'},
    {f: 762, v: 540, d: 16, e: 'smooth'},
    {f: 882, v: 500, d: 16, e: 'smooth'},
    {f: 1242, v: 260, d: 18, e: 'smooth'},
  ]);
  return {s, x, y, ox, oy};
};

export const CAM_HITS: [number, number][] = [
  [18, 6],
  [90, 5],
  [222, 7],
  [342, 6],
  [462, 6],
  [582, 6],
  [702, 5],
  [822, 6],
  [942, 6],
  [1062, 6],
  [1134, 7],
  [1206, 6],
  [1254, 4],
];
