/**
 * 布局 03 · Scrollytelling —— 全片就是“一次滚动”。
 *
 * 整支短片是一张 21060px 高的长网页，S(f) 是第 f 帧的滚动位置（scrollY）。
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
export const BEAT = 30; // 120 BPM

export type Sec = {id: SecId; top: number; h: number; bg: string; dark: boolean};
export type SecId = 'AB' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';
export const SECS: Sec[] = [
  {id: 'AB', top: 0, h: 4320, bg: '#000000', dark: true}, // 开场 + 01 定义（一个 sticky 舞台贯穿）
  {id: 'C', top: 4320, h: 2700, bg: '#F4F1EA', dark: false}, // 03 · 2012 Snow Fall（覆盖式）
  {id: 'D', top: 7020, h: 2700, bg: '#FBF7F0', dark: false}, // 04 · 数据新闻（并排式）
  {id: 'E', top: 9720, h: 3240, bg: '#000000', dark: true}, // 05 · 苹果产品页（逐帧）
  {id: 'F', top: 12960, h: 1620, bg: '#0B0B0F', dark: true}, // 06 · 2023 CSS
  {id: 'G', top: 14580, h: 1620, bg: '#F5F5F7', dark: false}, // 07 · 四种排法
  {id: 'H', top: 16200, h: 3780, bg: '#000000', dark: true}, // 08 · 五条规则（规则本身就是步骤）
  {id: 'I', top: 19980, h: 1080, bg: '#000000', dark: true}, // 片尾
];
export const PAGE_H = 21060;
export const MAX_S = PAGE_H - VH;
export const sec = (id: SecId) => SECS.find((s) => s.id === id)!;

/* ───────────── 滚动：每一次滑动 [起始帧, 目标 scrollY, 时长, 缓动] ───────────── */
type Ease = 'out' | 'inOut' | 'lin';
const EASE: Record<Ease, (t: number) => number> = {
  out: Easing.bezier(0.12, 0.82, 0.24, 1), // 手指一划：起手最快，惯性滑停
  inOut: Easing.bezier(0.6, 0, 0.2, 1), // 换章的长距离滑动
  lin: (t) => t,
};
export type Flick = [number, number, number, Ease?];
export const FLICKS: Flick[] = [
  // 开场：三下滑动，设备转过来 → 立起来 → 拆开
  [0, 360, 30, 'inOut'], // 第一下从静止起步（首帧清楚）
  [30, 720, 30],
  [60, 1080, 30],
  // 01 定义：舞台挪到右边，三个步骤依次过线
  [90, 1620, 30],
  [120, 2160, 30],
  [150, 2700, 30],
  [180, 3240, 30],
  // 02 结构：镜头拉远（210–240）→ 倒着滚回去 → 再滚一遍 → 到底松开 → 镜头推回
  [240, 1080, 22, 'inOut'],
  [266, 3240, 32, 'inOut'],
  [300, 4320, 30, 'inOut'],
  // 03 · 2012 Snow Fall
  [330, 4860, 30],
  [360, 5400, 30],
  [390, 7020, 24, 'inOut'],
  // 04 · 数据新闻
  [420, 7560, 30],
  [450, 8100, 30],
  [480, 9720, 24, 'inOut'],
  // 05 · 苹果产品页
  [510, 10260, 30],
  [540, 10800, 30],
  [570, 12960, 24, 'inOut'],
  // 06 · 2023 CSS：慢慢滚，看动画跟着滚动条走
  [600, 13500, 30, 'inOut'],
  [630, 14580, 22, 'inOut'],
  // 07 四种排法（舞台不动，看四个小窗）
  // 08 五条规则：规则本身就是步骤
  [720, 16740, 26, 'inOut'],
  [742, 17280, 18],
  [760, 17820, 18],
  [780, 18360, 12],
  [792, 18000, 9, 'inOut'], // 规则 04：倒着滚一下
  [801, 18360, 9],
  [810, 18900, 20],
  // 片尾：滑到底，多冲一点再弹回来
  [840, 20044, 24, 'inOut'],
  [864, 19980, 22],
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
/** 滚动速度（px / 帧），用来让滚动条变粗、加运动模糊 */
export const speed = (f: number) => Math.abs(S(f + 0.5) - S(f - 0.5));

/** sticky：舞台在页面里的 y（top: 0，高一屏） */
export const stickyY = (s: Sec, scroll: number) => Math.min(Math.max(s.top, scroll), s.top + s.h - VH);
/** 舞台“钉住”的程度：0 = 还没到 / 已松开，1 = 钉在视口里 */
export const isStuck = (s: Sec, scroll: number) => scroll >= s.top && scroll <= s.top + s.h - VH;

/* ───────────── 插值工具 ───────────── */
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
/** S 从 a 滚到 b 的进度（0–1，带 smoothstep） */
export const span = (s: number, a: number, b: number) => smooth(c01((s - a) / (b - a)));
export const lin = (s: number, a: number, b: number) => c01((s - a) / (b - a));

/* ───────────── 镜头：平时 = 浏览器视口；02 结构一章拉远看整段 section ───────────── */
export type Cam = {px: number; py: number; qx: number; qy: number; k: number};
const XRAY_K = 0.215;
export const XRAY = {in: 210, inDur: 30, out: 300, outDur: 30};
export const xrayMix = (f: number) => {
  const a = Easing.bezier(0.65, 0, 0.25, 1);
  if (f < XRAY.in) return 0;
  if (f < XRAY.in + XRAY.inDur) return a((f - XRAY.in) / XRAY.inDur);
  if (f < XRAY.out) return 1;
  if (f < XRAY.out + XRAY.outDur) return 1 - a((f - XRAY.out) / XRAY.outDur);
  return 0;
};
export const cam = (f: number): Cam => {
  const m = xrayMix(f);
  const s = S(f);
  const ab = sec('AB');
  return {
    px: 960,
    py: lerp(s + VH / 2, ab.top + ab.h / 2, m),
    qx: lerp(960, 600, m),
    qy: 540,
    k: Math.exp(lerp(0, Math.log(XRAY_K), m)),
  };
};
/** 页面坐标 → 屏幕坐标 */
export const toScreen = (c: Cam, x: number, y: number) => ({x: c.qx + (x - c.px) * c.k, y: c.qy + (y - c.py) * c.k});

/* ───────────── 章节（底栏用）───────────── */
export const CHAPTERS: [number, string][] = [
  [0, ''],
  [90, '01 / 08 · 定义'],
  [210, '02 / 08 · 结构'],
  [330, '03 / 08 · 2012 · Snow Fall'],
  [405, '04 / 08 · 2014—2018 · 数据新闻'],
  [495, '05 / 08 · 苹果产品页'],
  [585, '06 / 08 · 2023 · CSS'],
  [645, '07 / 08 · 四种排法'],
  [730, '08 / 08 · 五条规则'],
  [850, ''],
];
export const chapterAt = (f: number) => {
  let c = '';
  for (const [at, n] of CHAPTERS) if (f >= at) c = n;
  return c;
};

/* ───────────── 各章步骤：卡片中心在页面里的 y（S 停在 b 时，卡片正好在触发线上）───────────── */
export const stepY = (b: number, offset = TRIGGER) => b + offset;
export const DEF_STEPS = [2160, 2700, 3240].map((b) => stepY(b)); // 01 定义
export const SNOW_STEPS = [4860, 5400].map((b) => stepY(b, 600));
export const DATA_STEPS = [7560, 8100].map((b) => stepY(b));
export const APPLE_STEPS = [10260, 10800].map((b) => stepY(b, 175));
export const RULE_STEPS = [16740, 17280, 17820, 18360, 18900].map((b) => stepY(b));
/** 规则出现的帧（和配乐共用） */
export const RULES_AT = [720, 742, 760, 780, 810];
