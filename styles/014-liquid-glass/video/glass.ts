/**
 * 014 · 液态玻璃 —— 玻璃的剧本：每一帧有哪几块玻璃、什么形状、什么材质、上面压着什么字
 *
 * 四组玻璃（组内的形状用 smooth-min 合成，靠近就长“颈”）：
 *   g0  开场的胶囊（压着“液态玻璃”）→ 手机标签栏 + 搜索（两块融成一块）→ 片尾回到胶囊
 *   g1  主角那一滴：水滴 → 镜片 → 五个年代的玻璃 → 分出来的两滴（会合成一块）→ 迷你播放条 → 水滴
 *   g2  第三滴（“更多”按钮）→ 长成菜单 → 网页的导航条
 *   g3  网页右下角的圆按钮
 * 坐标全部是屏幕坐标（1920×1080）：玻璃不跟着页面走。
 */
import {interpolate, spring} from 'remotion';
import {E} from '../../../src/lib/anim';
import {ERAS, Material} from '../tokens';
import type {GroupMat, Shape} from './gl';
import {AT, camV} from './timeline';

type S = {cx: number; cy: number; hw: number; hh: number; r: number};
type M = Material & {k: number; opacity: number};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpS = (a: S, b: S, t: number): S => ({
  cx: lerp(a.cx, b.cx, t),
  cy: lerp(a.cy, b.cy, t),
  hw: lerp(a.hw, b.hw, t),
  hh: lerp(a.hh, b.hh, t),
  r: lerp(a.r, b.r, t),
});
const lerpM = (a: M, b: M, t: number): M => {
  const u = Math.max(0, Math.min(1, t));
  const o = {} as M;
  for (const key of Object.keys(a) as (keyof M)[]) {
    const va = a[key] as unknown;
    const vb = b[key] as unknown;
    if (Array.isArray(va)) (o[key] as unknown) = (va as number[]).map((x, i) => lerp(x, (vb as number[])[i], u));
    else (o[key] as unknown) = lerp(va as number, vb as number, u);
  }
  return o;
};
const circle = (cx: number, cy: number, r: number): S => ({cx, cy, hw: r, hh: r, r});
const pill = (cx: number, cy: number, hw: number, hh: number, r = hh): S => ({cx, cy, hw, hh, r});

/** 落地弹簧：过冲约 5% */
const SPR = {damping: 15, mass: 0.7, stiffness: 170};
const spr = (f: number, at: number) => spring({frame: f - at, fps: 60, config: SPR});
const tw = (f: number, a: number, d: number, ease = E.inOut) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

// ───────── 材质 ─────────
const mk = (m: Partial<M>): M => ({
  bevel: 44, edge: 0.9, mag: 0.06, frost: 0, tint: [1, 1, 1, 0.04], chroma: 0.06, rim: 0.9, shadow: 0.22,
  gloss: 0, border: 0, k: 30, opacity: 1, ...m,
});
export const CLEAR = mk({});
export const LABEL = mk({bevel: 26, edge: 0.8, mag: 0.03, frost: 6, tint: [1, 1, 1, 0.36], chroma: 0.05});
export const PLAYER = mk({bevel: 30, edge: 0.8, mag: 0.03, frost: 14, tint: [1, 1, 1, 0.46], chroma: 0.05});
export const MENU = mk({bevel: 36, edge: 0.8, mag: 0.03, frost: 9, tint: [1, 1, 1, 0.4], chroma: 0.05});
const ERA_M: M[] = ERAS.map((e) => mk({...e.m}));
const hide = (m: M): M => ({...m, opacity: 0});

// ───────── 关键形状 ─────────
export const B0 = pill(1450, 935, 340, 80); // 开场胶囊
const aX = (f: number) => 1240 - 5.6 * f; // 开场水滴：匀速往左滚
const A_Y = 600;
const A_R = 170;
const LENS = pill(1400, 540, 400, 280, 140);
/** 01 弯光：镜片像放大镜一样在 Aa 上来回移动，坡度变化时后面的字一直在被弯 */
const bendLens = (f: number): S => {
  const u = (f - 190) / 180;
  return {...LENS, cx: LENS.cx - 20 + 110 * Math.sin(u * Math.PI * 2), cy: LENS.cy + 22 * Math.sin(u * Math.PI * 4)};
};
const ERA_S: S[] = [
  pill(1400, 540, 300, 72, 72), // Aqua：果冻按钮
  pill(1400, 540, 380, 250, 16), // Aero：窗口
  pill(1400, 540, 280, 300, 56), // iOS 7：控制中心
  pill(1400, 540, 340, 220, 40), // Glassmorphism：卡片
  circle(1400, 540, 190), // Liquid Glass：一滴
];
export const ERA_AT = ERAS.map((_, k) => AT.eras + 14 + 46 * k); // 每 46 帧换一次材质
const DROP_R = 118;
const SPLIT = {l: circle(1100, 540, DROP_R), m: circle(1400, 540, DROP_R), r: circle(1700, 540, DROP_R)};
const JOINED = {l: circle(1236, 540, DROP_R), m: circle(1364, 540, DROP_R)};
const MENU_S = pill(1620, 600, 230, 200, 44);
// 界面页（与页面里画的手机 / 浏览器对齐）
export const TAB = pill(430, 935, 150, 38);
export const SEARCH = circle(624, 935, 38);
export const PLAY = pill(480, 838, 196, 42);
export const NAV = pill(1330, 262, 300, 40);
export const CTA = circle(1730, 860, 46);

export type Label = {
  text: string;
  x: number;
  y: number;
  size: number;
  weight?: number;
  family?: string;
  align?: CanvasTextAlign;
  color?: string; // 'auto'：按玻璃后面的亮度自动选黑 / 白
  alpha?: number;
  icon?: 'prev' | 'play' | 'more' | 'search' | 'plus';
};

export type Frame = {shapes: Shape[]; groups: GroupMat[]; labels: Label[]; readout: Record<string, number>};

const toGroup = (m: M, c: S): GroupMat => ({
  bevel: m.bevel, edge: m.edge, mag: m.mag, frost: m.frost, tint: m.tint, chroma: m.chroma, rim: m.rim,
  shadow: m.shadow, gloss: m.gloss, border: m.border, k: m.k, opacity: m.opacity, cx: c.cx, cy: c.cy,
});

export const glassAt = (f: number, dy = 0): Frame => {
  const shapes: Shape[] = [];
  const mats: [M, S][] = [
    [hide(LABEL), B0],
    [hide(CLEAR), LENS],
    [hide(CLEAR), LENS],
    [hide(CLEAR), CTA],
  ];
  const labels: Label[] = [];
  const readout: Record<string, number> = {};
  // 液体的惯性：镜头甩得越快，玻璃沿运动方向拉得越长、上下越扁（体积大致不变）
  const st = Math.min(1, Math.abs(camV(f)) / 70) * 0.16;
  const add = (g: number, s: S) =>
    shapes.push({...s, cy: s.cy + dy, hw: s.hw * (1 + st), hh: s.hh * (1 - st * 0.55), r: s.r * (1 - st * 0.55), group: g});
  const set = (g: number, m: M, c: S) => (mats[g] = [m, c]);

  // ── g0：开场胶囊 → 标签栏 + 搜索 → 胶囊 ──
  if (f < AT.bend) {
    const p = tw(f, 112, 30);
    const s = lerpS(B0, {...B0, cy: B0.cy + 40, hw: 40, hh: 40, r: 40}, p);
    add(0, s);
    set(0, {...LABEL, opacity: 1 - p}, s);
    labels.push(...b0Labels(1 - tw(f, 104, 16)));
  } else if (f >= AT.ui + 26 && f < AT.end) {
    const p = spr(f, AT.ui + 26);
    const t = {...TAB, hw: TAB.hw * p, hh: TAB.hh * p, r: TAB.r * p};
    const q = {...SEARCH, hw: SEARCH.hw * p, hh: SEARCH.hh * p, r: SEARCH.r * p};
    add(0, t);
    add(0, q);
    set(0, LABEL, t);
    const a = tw(f, AT.ui + 40, 20);
    ['首页', '新发现', '资料库'].forEach((s, i) =>
      labels.push({text: s, x: 345 + i * 86, y: 945 + dy, size: 26, weight: i === 0 ? 900 : 700, align: 'center', color: 'auto', alpha: a * (i === 0 ? 1 : 0.7)}),
    );
    labels.push({text: '', x: 624, y: 935 + dy, size: 30, icon: 'search', color: 'auto', alpha: a});
  } else if (f >= AT.end) {
    const p = spr(f, AT.end - 6);
    const t = lerpS(TAB, B0, p);
    const q = lerpS(SEARCH, B0, p);
    add(0, t);
    add(0, q);
    set(0, LABEL, t);
    labels.push(...b0Labels(tw(f, AT.end + 40, 30)));
  }

  // ── g1：主角那一滴 ──
  // 开场 / 片尾那一滴：每拍轻轻抖一下（±3%，周期 = 1 拍，循环接得上）
  const jig = 0.03 * Math.sin((f / 30) * Math.PI * 2);
  const A = (x: number) => ({cx: x, cy: A_Y, hw: A_R * (1 + jig), hh: A_R * (1 - jig), r: A_R});
  if (f < 110) {
    const s = A(aX(f));
    add(1, s);
    set(1, CLEAR, s);
  } else if (f < AT.eras - 20) {
    const p = spr(f, 110);
    const s = lerpS(A(aX(110) - 5.6 * Math.min(f - 110, 4)), bendLens(f), p);
    add(1, s);
    // 弯光：先压平（bevel 44 → 0，玻璃变成一扇平窗，后面的字不弯），再一点点加坡
    const flat = tw(f, 158, 36);
    const up = tw(f, 214, 76);
    const bevel = 44 * (1 - flat) + 44 * up;
    const ch = 0.06 * (1 - flat) + 0.06 * tw(f, 296, 44);
    readout.bevel = bevel;
    readout.chroma = ch;
    set(1, {...CLEAR, bevel, mag: (0.06 * bevel) / 44, chroma: ch}, s);
  } else if (f < AT.merge + 16) {
    // 二十五年：同一块玻璃换五次材质
    let s: S = bendLens(AT.eras - 20);
    let m: M = {...CLEAR};
    let era = 0;
    for (let k = 0; k < ERAS.length; k++) {
      const p = spr(f, ERA_AT[k] - 10);
      if (f < ERA_AT[k] - 10) break;
      s = lerpS(s, ERA_S[k], p);
      m = lerpM(m, ERA_M[k], p);
      era = k;
    }
    readout.era = era;
    add(1, s);
    set(1, m, s);
    labels.push(...eraLabels(f, era, s, dy));
  } else if (f < AT.ui - 18) {
    // 融合：一滴分三滴，左边两滴再合成一块
    const sp = spr(f, AT.merge + 16);
    const jp = spr(f, 704);
    const l = lerpS(lerpS(ERA_S[4], SPLIT.l, sp), JOINED.l, jp);
    const m = lerpS(lerpS(ERA_S[4], SPLIT.m, sp), JOINED.m, jp);
    add(1, l);
    add(1, m);
    set(1, CLEAR, m);
    readout.gap = m.cx - l.cx - 2 * DROP_R;
    const a = tw(f, AT.merge + 40, 16);
    labels.push({text: '', x: l.cx, y: l.cy + dy, size: 56, icon: 'prev', color: '#0B0C10', alpha: a});
    labels.push({text: '', x: m.cx, y: m.cy + dy, size: 56, icon: 'play', color: '#0B0C10', alpha: a});
  } else if (f < AT.end - 20) {
    // 两滴合成的那块 → 手机上的迷你播放条
    const p = spr(f, AT.ui - 18);
    const l = lerpS(JOINED.l, PLAY, p);
    const m = lerpS(JOINED.m, PLAY, p);
    add(1, l);
    add(1, m);
    set(1, lerpM(CLEAR, PLAYER, p), m);
    const a = tw(f, AT.ui + 10, 20);
    labels.push({text: 'Blue Hour', x: 318, y: 849 + dy, size: 30, weight: 900, family: "'Inter Display'", color: 'auto', alpha: a});
    labels.push({text: '', x: 636, y: 838 + dy, size: 34, icon: 'play', color: 'auto', alpha: a});
  } else {
    // 片尾：回到开场那一滴
    const p = spr(f, AT.end - 20);
    const tgt = f < 1150 ? A(1520) : A(aX(f - 1200));
    const s = lerpS(PLAY, tgt, p);
    add(1, s);
    set(1, lerpM(PLAYER, CLEAR, p), s);
  }

  // ── g2：第三滴 → 菜单 → 网页导航 ──
  if (f >= AT.merge + 16 && f < AT.ui - 18) {
    const sp = spr(f, AT.merge + 16);
    const mp = spr(f, 752);
    const s = lerpS(lerpS(ERA_S[4], SPLIT.r, sp), MENU_S, mp);
    add(2, s);
    set(2, lerpM(CLEAR, MENU, mp), s);
    const a = tw(f, AT.merge + 40, 16) * (1 - tw(f, 752, 10));
    labels.push({text: '', x: s.cx, y: s.cy + dy, size: 56, icon: 'more', color: '#0B0C10', alpha: a});
    const b = tw(f, 772, 18);
    ['收藏', '分享', '加入歌单'].forEach((t, i) => {
      labels.push({text: ['♥', '↗', '+'][i] + '   ' + t, x: MENU_S.cx - 170, y: MENU_S.cy - 96 + i * 100 + dy, size: 44, weight: 900, color: '#0B0C10', alpha: b * Math.min(1, Math.max(0, (f - 772 - i * 5) / 12))});
    });
  } else if (f >= AT.ui - 18 && f < AT.end + 50) {
    const p = spr(f, AT.ui - 18);
    const q = tw(f, AT.end - 4, 40);
    const s0 = lerpS(MENU_S, NAV, p);
    const s = lerpS(s0, circle(1520, 600, 40), q);
    add(2, s);
    set(2, {...lerpM(MENU, LABEL, p), opacity: 1 - q}, s);
    const a = tw(f, AT.ui + 14, 18) * (1 - tw(f, AT.end - 10, 14));
    ['作品', '关于', '订阅'].forEach((t, i) =>
      labels.push({text: t, x: 1130 + i * 200, y: 273 + dy, size: 30, weight: 900, align: 'center', color: 'auto', alpha: a}),
    );
  }

  // ── g3：网页右下角的圆按钮 ──
  if (f >= AT.ui + 50 && f < AT.end + 50) {
    const p = spr(f, AT.ui + 50);
    const q = tw(f, AT.end - 4, 40);
    const s = lerpS({...CTA, hw: 0, hh: 0, r: 0}, CTA, p);
    const s2 = lerpS(s, circle(1520, 600, 30), q);
    add(3, s2);
    set(3, {...CLEAR, bevel: 30, opacity: 1 - q}, s2);
    labels.push({text: '', x: s2.cx, y: s2.cy + dy, size: 40, icon: 'plus', color: 'auto', alpha: p * (1 - tw(f, AT.end - 10, 14))});
  }

  const groups = mats.map(([m, c]) => toGroup(m, {...c, cy: c.cy + dy}));
  return {shapes, groups, labels, readout};
};

const b0Labels = (a: number): Label[] => [
  {text: '液态玻璃', x: B0.cx - 296, y: B0.cy + 22, size: 62, weight: 900, color: '#0B0C10', alpha: a},
  {text: 'Liquid Glass', x: B0.cx + 296, y: B0.cy + 13, size: 34, weight: 700, family: "'Inter Display'", align: 'right', color: '#0B0C10', alpha: a},
];

const eraLabels = (f: number, era: number, s: S, dy: number): Label[] => {
  const a = Math.min(1, Math.max(0, (f - ERA_AT[era]) / 10));
  const x0 = s.cx - s.hw;
  const y0 = s.cy - s.hh + dy;
  switch (era) {
    case 0:
      return [{text: '确定', x: s.cx, y: s.cy + 15 + dy, size: 42, weight: 900, align: 'center', color: '#FFFFFF', alpha: a}];
    case 1:
      return [
        {text: 'Windows Vista', x: x0 + 28, y: y0 + 46, size: 28, weight: 700, family: "'Inter'", color: '#0B0C10', alpha: a},
        {text: '—   ▢   ✕', x: s.cx + s.hw - 28, y: y0 + 46, size: 26, weight: 700, align: 'right', color: '#0B0C10', alpha: a},
      ];
    case 2:
      return [{text: '控制中心', x: x0 + 40, y: y0 + 70, size: 36, weight: 900, color: '#0B0C10', alpha: a}];
    case 3:
      return [
        {text: 'Glassmorphism', x: x0 + 40, y: y0 + 70, size: 36, weight: 700, family: "'Inter Display'", color: '#FFFFFF', alpha: a},
        {text: '$ 4,280.00', x: x0 + 40, y: s.cy + s.hh - 48 + dy, size: 64, weight: 700, family: "'Inter Display'", color: '#FFFFFF', alpha: a},
      ];
    default:
      return [];
  }
};
