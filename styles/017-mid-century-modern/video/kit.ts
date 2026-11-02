/**
 * 各章共用：镜头、换章的纸、落下 / 抛 / 翻面这几种纸片动作。全部是时间 t（帧）的纯函数。
 */
import {C} from '../tokens';
import {bump, ease, lerp, prog, slap, spline, wobble} from './motion';
import type {Pose} from './paper';
import {AT, DURATION, H, W} from './timeline';

export const D2R = Math.PI / 180;

/**
 * 换章：一整张彩纸被拍进来（18 帧），毛边在前；每次换一个方向（右 / 上 / 左 / 下 / 右 / 上），进来时歪着、落定时摆正。
 * 纸的几何：原点在毛边上，纸往 +x 延伸；a 决定从哪边进来。
 */
export const SHEET_DUR = 18;
type Dir = 'R' | 'T' | 'L' | 'B';
export const SHEETS: {t0: number; fill: string; dir: Dir}[] = [
  {t0: AT.sheet1, fill: C.blue, dir: 'R'},
  {t0: AT.sheet2, fill: C.turq, dir: 'T'},
  {t0: AT.sheet3, fill: C.sun, dir: 'L'},
  {t0: AT.sheet4, fill: C.pink, dir: 'B'},
  {t0: AT.sheet5, fill: C.blue, dir: 'R'},
  {t0: AT.sheet6, fill: C.paper, dir: 'T'},
];
const SHEET_PATH: Record<Dir, {a: number; from: [number, number]; to: [number, number]}> = {
  R: {a: 0, from: [2050, 540], to: [-320, 540]},
  L: {a: 180, from: [-130, 540], to: [2240, 540]},
  T: {a: -90, from: [960, -130], to: [960, 1400]},
  B: {a: 90, from: [960, 1210], to: [960, -320]},
};
export const sheetPose = (t: number, s: {t0: number; dir: Dir}): Pose => {
  const u = prog(t, s.t0, SHEET_DUR);
  const e = ease.inOut(u);
  const P = SHEET_PATH[s.dir];
  return {x: lerp(P.from[0], P.to[0], e), y: lerp(P.from[1], P.to[1], e), a: P.a + 7 * (1 - ease.out(u)) * (s.dir === 'L' || s.dir === 'B' ? -1 : 1), h: u < 1 ? 14 : 4, s: 1};
};
export const covered = (t: number, t0: number) => t >= t0 + SHEET_DUR;

// ───────── 重击：镜头往里一冲再回来（往落点偏一点、转一点），落点溅起一圈彩纸碎片 ─────────
export type Impact = {t: number; x: number; y: number; k: number; ch?: number};
export const IMPACTS: Impact[] = [
  {t: AT.big, x: 620, y: 800, k: 0.08, ch: 0},
  ...[AT.bass, AT.eames, AT.record, AT.house, AT.app, AT.rules].map((t) => ({t, x: 960, y: 540, k: 0.035})),
  {t: AT.bass + 56, x: 1560, y: 950, k: 0.05, ch: 1},
  {t: AT.eames + 54.5, x: 1100, y: 650, k: 0.035},
  {t: AT.record + 16, x: 720, y: 540, k: 0.07, ch: 3},
  {t: AT.record + 42, x: 600, y: 760, k: 0.05},
  {t: AT.house + 38, x: 1240, y: 600, k: 0.05, ch: 4},
  {t: AT.app + 14, x: 960, y: 560, k: 0.06, ch: 5},
  {t: AT.app + 75, x: 960, y: 820, k: 0.08, ch: 5},
  ...[0, 1, 2, 3, 4].map((i) => ({t: AT.rules + 25 + 25 * i, x: 230 + 365 * i, y: 600, k: 0.035, ch: i === 4 ? 6 : undefined})),
];
const punch = (u: number) => (u <= 0 ? 0 : ((1 - Math.exp(-u / 1.0)) * Math.exp(-u / 7)) / 0.65);

// ───────── 镜头：每章慢慢推近，换纸时拉回；每次重击往里冲一下；O 砸下时沉一下 ─────────
const camKeys: [number, number][] = [[-60, 1.0], [0, 1.0], [AT.sheet1, 1.04]];
for (const s of SHEETS.slice(1)) camKeys.push([s.t0 - SHEET_DUR, 1.0], [s.t0, 1.035]);
camKeys.push([AT.end - 40, 1.0], [DURATION, 1.0]);
camKeys.sort((a, b) => a[0] - b[0]);
const camS = spline(camKeys);
export const cam = (t: number) => {
  let s = camS(t);
  let x = 960;
  let y = 540 - 9 * bump((t - AT.big) / 3) - 9 * bump((t - AT.big - DURATION) / 3);
  let r = 0;
  IMPACTS.forEach((m, i) => {
    for (const shift of [0, DURATION]) {
      const p = punch(t - m.t - shift);
      if (!p) continue;
      s *= 1 + m.k * p;
      x += (m.x - 960) * m.k * 1.6 * p;
      y += (m.y - 540) * m.k * 1.6 * p;
      r += (i % 2 ? 1 : -1) * m.k * 9 * p;
    }
  });
  return {x, y, s, r};
};
export const camTransform = (t: number) => {
  const c = cam(t);
  return `translate(${W / 2} ${H / 2}) scale(${c.s.toFixed(5)}) rotate(${c.r.toFixed(3)}) translate(${(-c.x).toFixed(2)} ${(-c.y).toFixed(2)})`;
};
export const toScreen = (t: number, x: number, y: number) => {
  const c = cam(t);
  const a = c.r * D2R;
  const dx = x - c.x;
  const dy = y - c.y;
  return [W / 2 + c.s * (dx * Math.cos(a) - dy * Math.sin(a)), H / 2 + c.s * (dx * Math.sin(a) + dy * Math.cos(a))];
};

/** 碎片：落点四周 12 片，往外飞、在空中翻，20 帧后落回桌上（有摩擦地停住） */
export const SCRAP_COLS = [C.red, C.sun, C.pink, C.turq, C.blue, C.paper, C.ink];
const rndK = (i: number, salt: number) => {
  const v = Math.sin(i * 91.7 + salt * 13.1) * 43758.5453;
  return v - Math.floor(v);
};
export const scrapPose = (m: Impact, j: number, t: number): Pose | null => {
  const u = t - m.t;
  if (u < 0) return null;
  const th = (j / 12) * Math.PI * 2 + (rndK(j, m.t) - 0.5) * 0.6;
  const v0 = 13 + 13 * rndK(j + 5, m.t);
  const tau = 9;
  const dist = 40 + v0 * tau * (1 - Math.exp(-u / tau));
  const air = Math.min(1, u / 20);
  return {
    x: m.x + Math.cos(th) * dist,
    y: m.y + Math.sin(th) * dist * 0.8,
    a: th * 57 + 540 * (1 - Math.exp(-u / 10)) * (j % 2 ? 1 : -1),
    h: u < 20 ? 4 + (40 + 50 * rndK(j + 9, m.t)) * Math.sin(Math.PI * air) : 4,
    s: 1.3,
  };
};

/** 从镜头上方落到桌上：h 从 hmax 落到 4（越落越快），落地轻压；之后转角回正 */
export const drop = (t: number, land: number, dur: number, hmax: number, x: number, y: number, a0: number, a1: number, dx = 0, dy = 0, s = 1): Pose | null => {
  if (t < land - dur) return null;
  if (t >= land) return {x, y, a: a1 + wobble(t, land, 2.2, 16, 8), h: 4, s: s * slap(t, land, 0.04, 3.5)};
  const u = prog(t, land - dur, dur);
  const e = ease.out(u);
  return {x: x + dx * (1 - e), y: y + dy * (1 - e), a: lerp(a0, a1, e), h: 4 + hmax * (1 - u * u), s};
};

/**
 * 接力：一块纸从 a 被提起来、飞到 b，途中可以翻面（sy 从 1 走到 −1，看到背面）、放大缩小。
 * 返回这一刻的姿态和露出的是不是背面。
 */
export const carry = (t: number, t0: number, t1: number, a: Pose, b: Pose, opt: {flip?: boolean; hmax?: number; swing?: number; seed?: number} = {}) => {
  const u = prog(t, t0, t1 - t0);
  const e = ease.inOut(u);
  let a1 = b.a ?? 0;
  const a0 = a.a ?? 0;
  while (a1 - a0 > 180) a1 -= 360;
  while (a1 - a0 < -180) a1 += 360;
  const sw = opt.swing ?? 0;
  const flip = opt.flip ? Math.cos(Math.PI * ease.inOut(Math.min(1, Math.max(0, (u - 0.15) / 0.7)))) : 1;
  const p: Pose = {
    x: lerp(a.x, b.x, e) + Math.sin(Math.PI * e) * sw * Math.cos(opt.seed ?? 0),
    y: lerp(a.y, b.y, e) + Math.sin(Math.PI * e) * sw * Math.sin(opt.seed ?? 0),
    a: lerp(a0, a1, e) + (t >= t1 ? wobble(t, t1, 2.4, 16, 8) : 0),
    h: t >= t1 ? 4 : lerp(a.h ?? 4, 4, e) + (opt.hmax ?? 60) * Math.pow(Math.sin(Math.PI * u), 0.8),
    s: lerp(a.s ?? 1, b.s ?? 1, e) * (t >= t1 ? slap(t, t1, 0.04, 3.5) : 1),
    sx: lerp(a.sx ?? 1, b.sx ?? 1, e),
    sy: lerp(Math.abs(a.sy ?? 1), Math.abs(b.sy ?? 1), e) * Math.max(0.04, Math.abs(flip)),
  };
  return {p, back: flip < 0};
};

/** 字母从画外抛进来 / 飞走：给规则卡、年份大字共用 */
export const leave = (t: number, t0: number, p: Pose, dy = -1400, dur = 24): Pose => {
  if (t < t0) return p;
  const u = prog(t, t0, dur);
  return {...p, y: p.y + dy * ease.in(u), h: (p.h ?? 4) + 70 * ease.out(Math.min(1, u * 2)), a: (p.a ?? 0) - 20 * ease.in(u)};
};
