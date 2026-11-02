/**
 * 各章共用：镜头、换章的纸、落下 / 抛 / 翻面这几种纸片动作。全部是时间 t（帧）的纯函数。
 */
import {C} from '../tokens';
import {bump, ease, lerp, prog, slap, spline, wobble} from './motion';
import type {Pose} from './paper';
import {AT, DURATION, H, W} from './timeline';

export const D2R = Math.PI / 180;

/** 换章：一整张彩纸从右边滑进来（18 帧），左边是剪出来的毛边 */
export const SHEET_DUR = 18;
export const SHEETS: {t0: number; fill: string}[] = [
  {t0: AT.sheet1, fill: C.blue},
  {t0: AT.sheet2, fill: C.turq},
  {t0: AT.sheet3, fill: C.sun},
  {t0: AT.sheet4, fill: C.pink},
  {t0: AT.sheet5, fill: C.blue},
  {t0: AT.sheet6, fill: C.paper},
];
export const sheetX = (t: number, t0: number) => lerp(2000, -300, ease.inOut(prog(t, t0, SHEET_DUR)));
export const covered = (t: number, t0: number) => t >= t0 + SHEET_DUR;

// ───────── 镜头：每章慢慢推近 4%，换纸时拉回；O 砸下时沉一下 ─────────
const camKeys: [number, number][] = [[-60, 1.0], [0, 1.0], [AT.sheet1, 1.04]];
for (const s of SHEETS.slice(1)) camKeys.push([s.t0 - SHEET_DUR, 1.0], [s.t0, 1.035]);
camKeys.push([AT.end - 40, 1.0], [DURATION, 1.0]);
camKeys.sort((a, b) => a[0] - b[0]);
const camS = spline(camKeys);
const camBump = (t: number) => 9 * bump((t - AT.big) / 3) + 9 * bump((t - AT.big - DURATION) / 3);
export const cam = (t: number) => ({x: 960, y: 540 - camBump(t), s: camS(t), r: 0});
export const camTransform = (t: number) => {
  const c = cam(t);
  return `translate(${W / 2} ${H / 2}) scale(${c.s.toFixed(5)}) translate(${-c.x} ${(-c.y).toFixed(2)})`;
};
export const toScreen = (t: number, x: number, y: number) => {
  const c = cam(t);
  return [W / 2 + c.s * (x - c.x), H / 2 + c.s * (y - c.y)];
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
