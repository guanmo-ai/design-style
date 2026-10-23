/**
 * 布局 03 · Scrollytelling v5 —— 主角是一张真网页（../demo/index.html）。
 *
 * 视频里的“浏览器”就是一个 iframe：每一帧只做一件事——把网页滚到 Y(f)，让网页自己的脚本画出这一帧。
 * 所以片子里看到的钉住、过线、倒放、断点改版，全是网页真实的行为，不是另做的动画。
 * 这里放：时间线（拍点）、每一次滑动、镜头（设备在画面里的位置 / 角度）、投影工具。
 */
import {Easing} from 'remotion';

export const W = 1920;
export const H = 1080;
export const FPS = 60;
export const BEAT = 30; // 120 BPM
export const DURATION = 900;

/* ───────────── 网页的几何（和 demo/index.html 的 CSS 一一对应）───────────── */
export const DESK = {vw: 1440, vh: 900};
export const PHONE = {vw: 390, vh: 844};
export const BREAK = 768; // ≥768 并排，<768 覆盖（规则 05）
/** 第 i 步“停稳”时的 scrollY：步骤顶边停在视口 8% 处（卡片正好在触发线附近）。
 *  并排：hero 100vh + 上留白 30vh + 每步 85vh；手机覆盖：上留白 70vh + 每步 80vh */
export const cityStepTop = (i: number, vw: number, vh: number) => (vw >= BREAK ? vh * (1.3 + 0.85 * i) : vh * (1.7 + 0.8 * i));
export const cityRest = (u: number, vw: number, vh: number) => {
  const i = Math.min(2, Math.max(0, Math.floor(u)));
  const t = u - i;
  return cityStepTop(i, vw, vh) + (cityStepTop(i + 1, vw, vh) - cityStepTop(i, vw, vh)) * t - 0.08 * vh;
};
/** 桌面 1440×900 下量出来的位置（Playwright 读 window.__anchors()；改了网页要重量） */
export const A = {
  city: [0, 1, 2, 3].map((i) => cityRest(i, 1440, 900)), // 1098 1863 2628 3393
  cityTop: 900,
  cityH: 3690,
  snow: [5554, 6319, 7084].map((y) => y - 72),
  spin0: 8948,
  spin1: 11828,
};

/* ───────────── 滚动：每一次滑动 [起始帧, 目标 scrollY, 时长, 缓动] ───────────── */
type Ease = 'out' | 'inOut' | 'lin' | 'whip';
export const EASE: Record<Ease, (t: number) => number> = {
  out: Easing.bezier(0.12, 0.82, 0.24, 1), // 手指一划：起手最快，惯性滑停
  inOut: Easing.bezier(0.62, 0, 0.18, 1), // 中距离（X 光里往回滚完再往下）
  lin: (t) => t,
  whip: Easing.bezier(0.7, 0, 0.12, 1), // 跨段快甩：蓄一下、猛地过去、稳稳停住（只有这种才加运动模糊）
};
export type Flick = [number, number, number, Ease?];
/** 主设备（桌面 1440×900）的滚动。每一下都从拍点（30 帧）或半拍（15 帧）开始 ——
 *  配乐的打击点就是这些帧（audio/make_music.py 读这张表）。
 *  v5：中段改成“一拍一下”——X 光三个半拍倒着滚，② ③ 每拍一下，跨段的快甩提前半拍起手、正好在拍点上到；
 *  和片尾手机那两下同一种手感。 */
export const FLICKS: Flick[] = [
  // ① 并排：封面 → 四步（每两拍一下，留时间读）
  [90, 1098, 32],
  [150, 1863, 28],
  [210, 2628, 28],
  [270, 3393, 28],
  // X 光（300 起镜头斜过来）：三个半拍倒着滚回第一步 → 一口气滚回来
  [330, 2628, 15],
  [345, 1863, 15],
  [360, 1098, 15],
  [375, 3393, 26, 'inOut'],
  // ② 覆盖：快甩进雪山（提前半拍起手，正好在拍点上到）→ 每拍一张卡片
  [405, 5482, 20, 'whip'],
  [450, 6247, 24],
  [480, 7012, 24],
  // ③ 逐帧：快甩进来 → 每拍一下，三下转完一圈（40px = 1 张图），每下停在好看的角度：第 20 张（拆开、侧着）
  //    → 第 44 张（背面）→ 第 72 张（正面）。不按 120° 均分——停在第 24 / 48 张时手机几乎侧对镜头，只剩一条边。
  [525, 8948, 20, 'whip'],
  [570, 9748, 24],
  [600, 10708, 24],
  [630, 11828, 26],
  // 甩回 ① 第二步（之后改用“步数”表示，宽度一变 scrollY 就跟着变）
  [675, 1863, 20, 'whip'],
];
export const FLICK_AT = FLICKS.map((k) => k[0]);
const runFlicks = (list: Flick[], f: number, v0: number) => {
  let v = v0;
  for (const [at, to, d, e = 'out'] of list) {
    if (f < at) break;
    v = v + (to - v) * EASE[e](Math.min(1, (f - at) / d));
  }
  return v;
};
export const scrollDesk = (f: number) => runFlicks(FLICKS, f, 0);

/* ───────────── 规则 05：窗口从 1440 拉窄到 390 ───────────── */
export const MORPH = {at: 708, dur: 76}; // 750 帧（拍点）正好过 768px 断点
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const eio = (t: number) => {
  const x = c01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const eo = (t: number) => 1 - Math.pow(1 - c01(t), 3);
export const eo5 = (t: number) => 1 - Math.pow(1 - c01(t), 5);
export const tf = (f: number, a: number, d: number, e: (t: number) => number = eo) => e(c01((f - a) / d));
export const morphQ = (f: number) => eio((f - MORPH.at) / MORPH.dur);
export const viewport = (f: number) => {
  const q = morphQ(f);
  return {vw: Math.round(lerp(DESK.vw, PHONE.vw, q)), vh: Math.round(lerp(DESK.vh, PHONE.vh, q)), q};
};
export const BREAK_AT = (() => {
  for (let f = MORPH.at; f < MORPH.at + MORPH.dur; f++) if (viewport(f).vw < BREAK) return f;
  return 0;
})();
/** 手机上的两次滑动（以“步数”计）+ 片尾那台电脑（同一份网页）一起滑 */
export const STEP_FLICKS: Flick[] = [
  [795, 2, 24],
  [840, 3, 26],
];
export const PHONE_FLICK_AT = STEP_FLICKS.map((k) => k[0]);
const stepU = (f: number) => runFlicks(STEP_FLICKS, f, 1);
/** 主设备这一帧的 scrollY 与视口 */
export const mainScroll = (f: number) => {
  const v = viewport(f);
  if (f < MORPH.at - 2) return {y: scrollDesk(f), ...v};
  return {y: cityRest(stepU(f), v.vw, v.vh), ...v};
};
/** 片尾那台电脑：停在第 2 步，和手机一起滑到第 3 步 */
export const deskScroll2 = (f: number) => cityRest(stepU(f), DESK.vw, DESK.vh);
/** 这一帧是否在一次“快甩”里（运动模糊只给它） */
export const inWhip = (f: number) => FLICKS.some(([at, , d, e]) => e === 'whip' && f >= at && f <= at + d);
/** 滚动速度（网页 px / 帧，桌面段才算） */
export const speed = (f: number) => (f > MORPH.at - 20 && f < MORPH.at + MORPH.dur + 4 ? 0 : Math.abs(scrollDesk(f + 0.5) - scrollDesk(f - 0.5)));

/** 每一步越过触发线（视口 50%）的帧 —— 触发线闪一下 */
export const CROSS: {f: number; dir: 1 | -1}[] = (() => {
  const lines = [0, 1, 2, 3].map((i) => cityStepTop(i, 1440, 900) - 450).concat([5554, 6319, 7084].map((y) => y - 450));
  const out: {f: number; dir: 1 | -1}[] = [];
  let prev = scrollDesk(0);
  for (let f = 1; f < MORPH.at - 2; f++) {
    const y = scrollDesk(f);
    for (const L of lines) {
      if (prev < L && y >= L) out.push({f, dir: 1});
      if (prev > L && y <= L) out.push({f, dir: -1});
    }
    prev = y;
  }
  return out;
})();

/* ───────────── 段落（帧）───────────── */
export const SC = {
  open: [0, 90],
  side: [90, 300],
  xray: [300, 405],
  overlay: [405, 525],
  scrub: [525, 690],
  phone: [690, 810],
  end: [810, 900],
} as const;
/** X 光：镜头斜过来、两层分开 */
export const XRAY = {in: 300, inDur: 36, out: 380, outDur: 34};
export const xrayMix = (f: number) => {
  const a = Easing.bezier(0.65, 0, 0.25, 1);
  if (f < XRAY.in) return 0;
  if (f < XRAY.in + XRAY.inDur) return a((f - XRAY.in) / XRAY.inDur);
  if (f < XRAY.out) return 1;
  if (f < XRAY.out + XRAY.outDur) return 1 - a((f - XRAY.out) / XRAY.outDur);
  return 0;
};
export const STAGE_Z = 300; // X 光里 sticky 舞台抬起来的高度（网页 px）

/* ───────────── 设备与镜头 ───────────── */
export type Pose = {cx: number; cy: number; k: number; rx: number; ry: number; rz: number; z: number; op: number};
export const TITLE_H = 40; // 浏览器标题栏（网页 px）
export const BEZEL = 13; // 手机边框
export const REST: Pose = {cx: 1249, cy: 540, k: 0.82, rx: 0, ry: 0, rz: 0, z: 0, op: 1};
const XR: Pose = {cx: 1230, cy: 600, k: 0.5, rx: 54, ry: 0, rz: -32, z: 0, op: 1};
const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), t)),
  rx: lerp(a.rx, b.rx, t), ry: lerp(a.ry, b.ry, t), rz: lerp(a.rz, b.rz, t), z: lerp(a.z, b.z, t), op: lerp(a.op, b.op, t),
});
const settle = Easing.bezier(0.16, 1, 0.3, 1);
export const mainPose = (f: number): Pose => {
  // 开场：从远处斜着飞进来，在第 2 拍（60 帧）落定
  const t0 = settle(c01(f / 66));
  let p = mixPose({cx: 1330, cy: 640, k: 0.82, rx: 26, ry: -34, rz: 7, z: -1700, op: 0}, REST, t0);
  p.op = c01(f / 14);
  // X 光
  const m = xrayMix(f);
  if (m > 0) {
    const drift = c01((f - XRAY.in) / (XRAY.out + XRAY.outDur - XRAY.in));
    p = mixPose(p, {...XR, rz: XR.rz + 7 * drift, rx: XR.rx - 3 * drift, cy: XR.cy - 30 * drift}, m);
  }
  // 逐帧：镜头慢慢推近
  const d = tf(f, 532, 130, eio) * (1 - tf(f, 676, 24, eio));
  p = mixPose(p, {...REST, k: 0.9, cx: 1205, cy: 556}, d);
  // 手机：变窄的同时放大一点，并且转个小角度（像拿起来）
  const q = morphQ(f);
  p.k = lerp(p.k, 1.0, q);
  p.ry += -14 * Math.sin(Math.PI * q);
  p.rx += 5 * Math.sin(Math.PI * q);
  // 片尾：手机让到右边
  const e = tf(f, 810, 40, settle);
  p = mixPose(p, {...REST, cx: 1615, cy: 560, k: 0.74}, e);
  return p;
};
/** 片尾那台电脑 */
export const deskPose2 = (f: number): Pose => {
  const e = settle(c01((f - 816) / 44));
  const p = mixPose({cx: 1030, cy: 640, k: 0.52, rx: 10, ry: 26, rz: 0, z: -900, op: 0}, {cx: 1030, cy: 585, k: 0.52, rx: 0, ry: 0, rz: 0, z: 0, op: 1}, e);
  p.op = c01((f - 816) / 16);
  return p;
};
export const PERSP = 2400;

/** 设备盒子的尺寸（网页 px）：浏览器 = 视口 + 标题栏；手机 = 视口 + 边框 */
export const boxOf = (vw: number, vh: number, q: number) => {
  const th = TITLE_H * (1 - q);
  const bz = BEZEL * q;
  return {bw: vw + 2 * bz, bh: vh + th + 2 * bz, ox: bz, oy: bz + th, th, bz};
};
export const poseCss = (p: Pose, bw: number, bh: number) =>
  `translate(${p.cx}px, ${p.cy}px) perspective(${PERSP}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg) translateZ(${p.z}px) scale3d(${p.k}, ${p.k}, ${p.k}) translate(${-bw / 2}px, ${-bh / 2}px)`;
/** 设备盒子里的点 (x, y, z) → 屏幕坐标（和 poseCss 同一套矩阵） */
export const project = (p: Pose, bw: number, bh: number, x: number, y: number, z = 0) => {
  let X = (x - bw / 2) * p.k;
  let Y = (y - bh / 2) * p.k;
  let Z = z * p.k + p.z;
  const az = (p.rz * Math.PI) / 180;
  [X, Y] = [X * Math.cos(az) - Y * Math.sin(az), X * Math.sin(az) + Y * Math.cos(az)];
  const ay = (p.ry * Math.PI) / 180;
  [X, Z] = [X * Math.cos(ay) + Z * Math.sin(ay), -X * Math.sin(ay) + Z * Math.cos(ay)];
  const ax = (p.rx * Math.PI) / 180;
  [Y, Z] = [Y * Math.cos(ax) - Z * Math.sin(ax), Y * Math.sin(ax) + Z * Math.cos(ax)];
  const w = 1 - Z / PERSP;
  return {x: p.cx + X / w, y: p.cy + Y / w, s: p.k / w};
};
