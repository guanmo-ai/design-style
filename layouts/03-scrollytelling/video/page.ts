/**
 * 布局 03 · Scrollytelling v2 —— 全片就是“一次滚动”。
 *
 * 整支短片是一张 17280px 高的长网页，S(f) 是第 f 帧的滚动位置（scrollY）。
 * 画面上的每一个动作都由 S 推出来：
 *   · 普通内容：屏幕 y = 页面 y − S
 *   · sticky 舞台：屏幕 y = clamp(页面 y, S, section 底 − 一屏) − S（和浏览器的 position: sticky 同一条公式）
 *   · 舞台里的变化：按 S 经过的区间插值 → 倒着滚，画面也倒着变
 * 每一次“滑动”都从拍点开始（ease-out：起手最快），所以最快的一刻落在拍点上。
 */
import {Easing} from 'remotion';

export const W = 1920;
export const VH = 1080;
export const TRIGGER = VH * 0.5; // 触发线：视口 50%
export const BEAT = 30; // 120 BPM @ 60fps

export type SecId = 'AB' | 'C' | 'D' | 'E' | 'G' | 'H' | 'I';
export type Sec = {id: SecId; top: number; h: number};
export const SECS: Sec[] = [
  {id: 'AB', top: 0, h: 3240}, // 开场 + 01 定义 + 02 结构（一个 sticky 舞台贯穿）
  {id: 'C', top: 3240, h: 2700}, // 03 · 2012 Snow Fall（覆盖式）
  {id: 'D', top: 5940, h: 3240}, // 04 · 2014—2018（并排式）
  {id: 'E', top: 9180, h: 3240}, // 05 · 苹果产品页（逐帧）
  {id: 'G', top: 12420, h: 1620}, // 06 · 四种排法
  {id: 'H', top: 14040, h: 2160}, // 07 · 五条规则（钉住的清单，匀速滚、逐条点亮）
  {id: 'I', top: 16200, h: 1080}, // 片尾
];
export const PAGE_H = 17280;
export const MAX_S = PAGE_H - VH;
export const sec = (id: SecId) => SECS.find((s) => s.id === id)!;

/* ───────────── 滚动：每一次滑动 [起始帧, 目标 scrollY, 时长, 缓动] ───────────── */
type Ease = 'out' | 'inOut' | 'lin';
const EASE: Record<Ease, (t: number) => number> = {
  out: Easing.bezier(0.12, 0.82, 0.24, 1), // 手指一划：起手最快，惯性滑停
  inOut: Easing.bezier(0.62, 0, 0.18, 1), // 换章的长距离滑动
  lin: (t) => t,
};
export type Flick = [number, number, number, Ease?];
export const FLICKS: Flick[] = [
  // 01 定义：四行字依次过线（960 / 1260 / 1560 / 1860）
  [90, 960, 30],
  [120, 1260, 30],
  [150, 1560, 30],
  [180, 1860, 30],
  // 02 结构（210 起镜头倾斜成 X 光）：倒着滚 → 再滚一遍 → 到底松开 → 进下一章
  [240, 600, 26, 'inOut'],
  [270, 1860, 28, 'inOut'],
  [300, 2700, 24, 'inOut'],
  [318, 3240, 27, 'inOut'],
  // 03 · 2012 Snow Fall：两张卡片盖过雪景
  [372, 3780, 24],
  [396, 4320, 22],
  // 04 · 2014—2018
  [414, 5940, 24, 'inOut'],
  [450, 6480, 28],
  [480, 7020, 26],
  // 05 · 苹果：转一整圈
  [504, 9180, 24, 'inOut'],
  [540, 9900, 30],
  [570, 10620, 26],
  // 06 · 四种排法：匀速慢滚，四块面板依次点亮
  [594, 12420, 24, 'inOut'],
  [618, 12960, 54, 'lin'],
  // 07 · 五条规则：进章后匀速滚（约 8px/帧，不糊），五条依次点亮
  [672, 14040, 18, 'inOut'],
  [690, 15120, 132, 'lin'],
  // 片尾：滑到底，多冲一点再弹回来
  [846, 16260, 24, 'inOut'],
  [870, 16200, 20],
];
/** 每次滑动的起始帧（= 拍点 / 音效点） */
export const FLICK_AT = FLICKS.map((k) => k[0]);

export const S = (f: number): number => {
  let v = 0;
  for (const [at, to, d, e = 'out'] of FLICKS) {
    if (f < at) break;
    const t = Math.min(1, (f - at) / d);
    v = v + (to - v) * EASE[e](t);
  }
  return v;
};
/** 滚动速度（px / 帧） */
export const speed = (f: number) => Math.abs(S(f + 0.5) - S(f - 0.5));
/** 第一次滚过 y 的帧（给配乐和面板点亮用） */
export const frameAtS = (y: number, from = 0) => {
  for (let f = from; f < 900; f += 0.25) if (S(f) >= y) return f;
  return 900;
};

/** sticky：舞台在页面里的 y（top: 0，高一屏） */
export const stickyY = (s: Sec, scroll: number) => Math.min(Math.max(s.top, scroll), s.top + s.h - VH);

/* ───────────── 插值工具 ───────────── */
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const span = (s: number, a: number, b: number) => smooth(c01((s - a) / (b - a)));
export const lin = (s: number, a: number, b: number) => c01((s - a) / (b - a));
export const eo = (t: number) => 1 - Math.pow(1 - c01(t), 3);
export const eio = (t: number) => {
  const x = c01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** 帧区间进度（带缓动） */
export const tf = (f: number, a: number, d: number, e: (t: number) => number = eo) => e(c01((f - a) / d));

/* ───────────── 02 结构：X 光视角（页面倾斜成 3D）───────────── */
export const XRAY = {in: 206, inDur: 34, out: 312, outDur: 33};
export const xrayMix = (f: number) => {
  const a = Easing.bezier(0.65, 0, 0.25, 1);
  if (f < XRAY.in) return 0;
  if (f < XRAY.in + XRAY.inDur) return a((f - XRAY.in) / XRAY.inDur);
  if (f < XRAY.out) return 1;
  if (f < XRAY.out + XRAY.outDur) return 1 - a((f - XRAY.out) / XRAY.outDur);
  return 0;
};
export type Cam = {px: number; py: number; qx: number; qy: number; k: number; rx: number; rz: number; d: number};
/** X 光里各层离开页面的高度（px）：步骤文字一层、sticky 舞台一层 */
export const STEPS_Z = 90;
export const STAGE_Z = 210;
export const cam = (f: number): Cam => {
  const m = xrayMix(f);
  const s = S(f);
  const k = Math.exp(lerp(0, Math.log(0.36), m));
  // 镜头在 X 光里缓缓绕一点（视差让“分层”看得出来）
  const drift = c01((f - XRAY.in) / (XRAY.out + XRAY.outDur - XRAY.in));
  return {
    px: 960,
    py: lerp(s + VH / 2, 1750, m),
    qx: lerp(960, 1200, m),
    qy: lerp(540, 600, m),
    k,
    rx: (52 + 4 * drift) * m,
    rz: (-36 + 9 * drift) * m,
    d: 2600,
  };
};
/** CSS transform：translate(q) perspective(d) rotateX rotateZ scale(k) translate(-p) */
export const camCss = (c: Cam) =>
  `translate(${c.qx}px, ${c.qy}px) perspective(${c.d}px) rotateX(${c.rx}deg) rotateZ(${c.rz}deg) scale(${c.k}) translate(${-c.px}px, ${-c.py}px)`;
/** 页面坐标 (x, y, z) → 屏幕坐标（和上面那串 CSS 同一套矩阵） */
export const project = (c: Cam, x: number, y: number, z = 0) => {
  let X = (x - c.px) * c.k;
  let Y = (y - c.py) * c.k;
  let Z = z * c.k;
  const az = (c.rz * Math.PI) / 180;
  [X, Y] = [X * Math.cos(az) - Y * Math.sin(az), X * Math.sin(az) + Y * Math.cos(az)];
  const ax = (c.rx * Math.PI) / 180;
  [Y, Z] = [Y * Math.cos(ax) - Z * Math.sin(ax), Y * Math.sin(ax) + Z * Math.cos(ax)];
  const w = 1 - Z / c.d;
  return {x: c.qx + X / w, y: c.qy + Y / w};
};

/* ───────────── 各章的步骤位置（S 停在这里时，这一步正好在触发线上）───────────── */
export const DEF_AT = [960, 1260, 1560, 1860]; // 01 定义：四行字
export const DEF_LINE_Y = DEF_AT.map((b) => b + TRIGGER);
export const SNOW_AT = [3780, 4320];
export const DATA_AT = [5940, 6480, 7020];
export const APPLE_RANGE = [9180, 11340]; // 舞台钉住的区间 = 转一整圈
/** 五条规则：舞台钉住的 1080px 里，每 216px 点亮一条 */
export const RULE_STEP = 216;
export const RULE_AT = [0, 1, 2, 3, 4].map((i) => 14040 + i * RULE_STEP);
/** 每条规则开始点亮的帧（和配乐共用；= frameAtS(RULE_AT[i])） */
export const RULES_AT = [690, 716, 743, 769, 796];
export const PATTERN_TH = [12520, 12640, 12760, 12880];
export const PATTERNS_AT = PATTERN_TH.map((y) => Math.round(frameAtS(y, 590)));
