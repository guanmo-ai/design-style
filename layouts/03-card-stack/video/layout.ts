/**
 * 布局 03 · Card Stack —— 同一批 4 张卡片贯穿全片。
 * 层叠不是手摆的：slotPose() 按“第几层”算出抬起、微旋、压暗、景深；
 * 焦点切换时，前一张沿 dismiss 弧线飞出，其余弹簧递补，飞出的那张落到最底层。
 */
import {Easing} from 'remotion';
import {E, SMOOTH, spr, tween} from '../../../src/lib/anim';

export const DURATION = 1080;
export const FPS = 60;
export const BEAT = 30;

export const CARD_W = 760;
export const CARD_H = 428;
export const CARD_R = 28;

export type CardKind = 'bars' | 'people' | 'progress' | 'spark';
export type CardDef = {
  id: string;
  kicker: string;
  title: string;
  titleEn: string;
  sub: string;
  kind: CardKind;
  a: string;
  b: string;
  aLabel: string;
  bLabel: string;
};

export const CARDS: CardDef[] = [
  {id: 'focusus', kicker: '04', title: '本周只做这一件', titleEn: 'Focusus', sub: "This week's bet", kind: 'bars', a: 'P0', b: 'You', aLabel: 'Priority', bLabel: 'Owner'},
  {id: 'inbox', kicker: '12', title: '先回最先等的人', titleEn: 'Inbox', sub: '12 waiting', kind: 'people', a: '3', b: '9', aLabel: 'Today', bLabel: 'Later'},
  {id: 'sprint', kicker: '24', title: '这一周的进度', titleEn: 'Sprint', sub: '8 of 14 done', kind: 'progress', a: '8/14', b: 'Fri', aLabel: 'Done', bLabel: 'Due'},
  {id: 'revenue', kicker: '$', title: '这周进账', titleEn: 'Revenue', sub: '$48.2k this week', kind: 'spark', a: '+12%', b: 'MoM', aLabel: 'Change', bLabel: 'vs last'},
];
export const N = CARDS.length;
export const GHOSTS = 3;

/** 章节切点 = 拍点。CYCLE 的“飞出最快”落在 HIT + 10 帧 */
export const HIT = {
  LAND: 60,
  FOCUS: 120,
  CYCLE1: 240,
  CYCLE2: 330,
  IOS: 420,
  STRIPE: 510,
  RULES: 600,
  PIT_CROWD: 810,
  PIT_FLAT: 870,
  RESTORE: 918,
  END: 960,
} as const;

export const SCENE = {
  KEY: {in: 40, out: 112},
  FOCUS: {in: 128, out: 226},
  CYCLE: {in: 248, out: 408},
  WHEN: {in: 428, out: 588},
  RULES: {in: 612, out: 798},
  PIT: {in: 822, out: 948},
  END: {in: 972, out: 9999},
};

export const RULES_AT = [618, 654, 690, 726, 762];
export const CYCLES: {at: number; dur: number}[] = [
  {at: HIT.CYCLE1, dur: 42},
  {at: HIT.CYCLE2, dur: 42},
];

export type Skin = 'dash' | 'ios' | 'stripe' | 'wire' | 'pit' | 'icon';
export const skinAt = (f: number): Skin => {
  if (f >= HIT.END - 4) return 'icon';
  if (f >= HIT.PIT_CROWD && f < HIT.RESTORE) return 'pit';
  if (f >= HIT.RULES) return 'wire';
  if (f >= HIT.STRIPE) return 'stripe';
  if (f >= HIT.IOS) return 'ios';
  return 'dash';
};

export type Variant = 'stack' | 'flat' | 'crowd' | 'icon';
export const variantAt = (f: number): Variant => {
  if (f >= HIT.END) return 'icon';
  if (f >= HIT.PIT_FLAT && f < HIT.RESTORE) return 'flat';
  if (f >= HIT.PIT_CROWD && f < HIT.PIT_FLAT) return 'crowd';
  return 'stack';
};

/** 层叠原点：教学段落靠右，误区 / 片尾回到画面中心 */
export const originAt = (f: number): {x: number; y: number} => {
  const right = {x: 1208, y: 560};
  const mid = {x: 980, y: 560};
  const end = {x: 960, y: 470};
  if (f < HIT.PIT_CROWD - 12) {
    const p = tween(f, HIT.IOS - 8, 28, 0, 1, E.inOut);
    return {x: right.x - 40 * p, y: right.y + 18 * p};
  }
  if (f < HIT.END) {
    const p = tween(f, HIT.PIT_CROWD - 10, 28, 0, 1, E.inOut);
    return {x: right.x - 40 + (mid.x - (right.x - 40)) * p, y: right.y + 18 + (mid.y - (right.y + 18)) * p};
  }
  const p = tween(f, HIT.END, 36, 0, 1, E.out);
  return {x: mid.x + (end.x - mid.x) * p, y: mid.y + (end.y - mid.y) * p};
};

export type Pose = {x: number; y: number; z: number; rot: number; sc: number; o: number; dim: number; blur: number; slot: number};

const DISMISS = Easing.bezier(0.22, 1, 0.36, 1);
const SETTLE = Easing.bezier(0.22, 0.9, 0.18, 1);

const slotPose = (slot: number, lift: number, variant: Variant): Pose => {
  if (variant === 'icon') {
    return {x: 0, y: -slot * 8, z: -slot * 12, rot: slot === 0 ? -1.1 : slot * 0.35, sc: 0.22, o: 1, dim: slot * 0.1, blur: 0, slot};
  }
  if (variant === 'flat') {
    return {x: (slot - 1.5) * 40, y: slot * 8, z: -slot * 4, rot: 0, sc: 0.9, o: 1, dim: 0, blur: 0, slot};
  }
  const crowd = variant === 'crowd';
  const stepY = crowd ? 26 : 38;
  const stepX = crowd ? 14 : 24;
  const zStep = crowd ? 24 : 36;
  const focus = slot === 0 && !crowd;
  return {
    x: -slot * stepX + (focus ? -6 : 0),
    y: -slot * stepY - (focus ? lift : 0),
    z: -slot * zStep,
    rot: focus ? -1.2 : slot % 2 ? 0.65 : -0.5,
    sc: 1 - slot * (crowd ? 0.012 : 0.018) + (focus ? 0.008 : 0),
    o: 1,
    dim: crowd ? 0.08 + slot * 0.05 : slot * 0.11,
    blur: 0,
    slot,
  };
};

const ORDERS: number[][] = [
  [0, 1, 2, 3],
  [1, 2, 3, 0],
  [2, 3, 0, 1],
];

/** 第 f 帧：谁在第 0 层（焦点）……第 3 层 */
export const orderAt = (f: number): number[] => {
  if (f < HIT.CYCLE1) return ORDERS[0];
  if (f < HIT.CYCLE2) return ORDERS[1];
  return ORDERS[2];
};

const prevOrder = (f: number): number[] => {
  if (f < HIT.CYCLE2) return ORDERS[0];
  return ORDERS[1];
};

const cycleOf = (f: number) => CYCLES.find((c) => f >= c.at && f < c.at + c.dur);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
  rot: lerp(a.rot, b.rot, t),
  sc: lerp(a.sc, b.sc, t),
  o: lerp(a.o, b.o, t),
  dim: lerp(a.dim, b.dim, t),
  blur: lerp(a.blur, b.blur, t),
  slot: t < 0.5 ? a.slot : b.slot,
});

const liftAt = (f: number): number => {
  const on = tween(f, HIT.FOCUS, 34, 0, 1, E.out);
  const hold = 1 - tween(f, HIT.PIT_FLAT, 16, 0, 1, E.inOut);
  const back = tween(f, HIT.RESTORE, 28, 0, 1, E.out);
  const end = 1 - tween(f, HIT.END, 20);
  if (f >= HIT.RESTORE) return 14 * back * end;
  if (f >= HIT.PIT_FLAT) return 14 * (1 - hold);
  return 14 * on;
};

/** 第 i 张卡片在第 f 帧的空间姿态（含进场、切换、误区、收束） */
export const poseAt = (f: number, i: number): Pose => {
  const variant = variantAt(f);
  const lift = liftAt(f);
  const order = orderAt(f);
  const slot = order.indexOf(i);
  const dest = slotPose(slot, lift, variant);

  const cyc = cycleOf(f);
  if (cyc) {
    const prev = prevOrder(f);
    const fromSlot = prev.indexOf(i);
    const p = SETTLE(Math.min(1, Math.max(0, (f - cyc.at) / cyc.dur)));
    const wasFront = fromSlot === 0;
    const nowBack = slot === N - 1;
    if (wasFront && nowBack) {
      const d = DISMISS(Math.min(1, (f - cyc.at) / 28));
      const fly: Pose = {
        x: dest.x + 168 * d,
        y: dest.y - 96 * d,
        z: 56 * d,
        rot: dest.rot + 7.2 * d,
        sc: dest.sc * (1 - 0.05 * d),
        o: 1 - Math.pow(d, 1.15),
        dim: 0,
        blur: 0.4 * d,
        slot: 0,
      };
      const backIn = tween(f, cyc.at + 18, 22, 0, 1, E.out);
      const fromBack: Pose = {...slotPose(N - 1, 0, 'stack'), y: slotPose(N - 1, 0, 'stack').y + 36, o: 0, z: -110};
      return mixPose(fly, mixPose(fromBack, dest, backIn), d > 0.62 ? (d - 0.62) / 0.38 : 0);
    }
    const a = slotPose(fromSlot, fromSlot === 0 ? lift : 0, 'stack');
    return mixPose(a, dest, p);
  }

  // 开场：从下方、更远的一层弹进槽位
  const enter = spr(f, 6 + i * 8, SMOOTH, 52);
  if (enter < 0.999 && f < HIT.FOCUS) {
    const from: Pose = {...dest, y: dest.y + 128, z: dest.z - 90, o: 0, sc: dest.sc * 0.92, rot: dest.rot * 0.2};
    return mixPose(from, dest, enter);
  }

  // 误区：多出来的“鬼卡片”不在这 4 张里；这 4 张在 crowd/flat 之间弹簧过渡
  if (f >= HIT.PIT_CROWD - 2 && f < HIT.END) {
    let fromV: Variant = 'stack';
    let at = HIT.PIT_CROWD;
    if (f >= HIT.RESTORE) {
      fromV = 'flat';
      at = HIT.RESTORE;
    } else if (f >= HIT.PIT_FLAT) {
      fromV = 'crowd';
      at = HIT.PIT_FLAT;
    }
    const p = spr(f, at, SMOOTH, 32);
    return mixPose(slotPose(orderAt(at - 1).indexOf(i), liftAt(at - 1), fromV), dest, p);
  }

  if (f >= HIT.END) {
    const p = spr(f, HIT.END, SMOOTH, 40);
    return mixPose(slotPose(slot, liftAt(HIT.END - 1), 'stack'), dest, p);
  }

  return dest;
};

/** 误区段多出来的 3 张空卡片（只在 crowd 出现） */
export const ghostPose = (f: number, g: number): Pose | null => {
  const on = tween(f, HIT.PIT_CROWD, 22, 0, 1, E.out) * (1 - tween(f, HIT.PIT_FLAT - 4, 16, 0, 1, E.inOut));
  if (on <= 0.001) return null;
  const slot = N + g;
  const dest = slotPose(slot, 0, 'crowd');
  const from: Pose = {...dest, y: dest.y + 50, o: 0, z: dest.z - 40};
  return mixPose(from, {...dest, o: on}, on);
};

export const focusIndex = (f: number) => orderAt(f)[0];
export const cycleP = (f: number) => {
  const c = cycleOf(f);
  return c ? Math.min(1, (f - c.at) / c.dur) : 0;
};
