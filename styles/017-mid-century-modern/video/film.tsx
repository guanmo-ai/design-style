/**
 * 017 · 中世纪现代 —— 画面（照 003 / 004 的骨架：开场先搭海报，然后一章一件代表作、一张新彩纸当底）
 *
 *   开场 0—96    海报在 1.5 秒里搭出来：太阳落下 · 钟心落下、12 根辐条从钟心炸开 · 12 颗球 2.5 帧一颗落满一圈 ·
 *               MID- / CENTURY 抛上桌 · MODERN 六个字从镜头上方砸下来（O 最后，第 3 拍）· 指针转一圈
 *   90—125      辐条从钟上弹起来；一整张蓝纸从右边滑进来盖住桌面（换章 = 换一张纸）；
 *               辐条在空中翻面（正面墨、背面白），落到蓝纸上拼成 Bass《金臂人》的折线手臂（第 5 拍）
 *   125—178     01 片头 · Saul Bass《金臂人》1955：手臂一节节落定，另外 5 根白纸条按十六分音符扎进来
 *   178—210     绿松石纸滑进来 → 02
 *
 * 签名物理：影子 = 高度（paper.tsx）。所有位置都是时间 t 的纯函数；60 帧连续 + 运动模糊。
 */
import React from 'react';
import {C} from '../tokens';
import {GEO} from './geo';
import {arc, bump, clamp, ease, lerp, prog, rnd, slap, spline, wobble} from './motion';
import {Body, Piece, type Pose, Shadow} from './paper';
import {AT, H, W} from './timeline';

const D2R = Math.PI / 180;

// ───────── 镜头：开场慢慢推近，O 砸下时沉一下 ─────────
const camS = spline([[-60, 1.0], [0, 1.0], [96, 1.04], [114, 1.0], [210, 1.03]]);
const camBump = (t: number) => 9 * bump((t - AT.big) / 3);
export const cam = (t: number) => ({x: 960, y: 540 - camBump(t), s: camS(t), r: 0});
export const camTransform = (t: number) => {
  const c = cam(t);
  return `translate(${W / 2} ${H / 2}) scale(${c.s.toFixed(5)}) translate(${-c.x} ${(-c.y).toFixed(2)})`;
};
export const toScreen = (t: number, x: number, y: number) => {
  const c = cam(t);
  return [W / 2 + c.s * (x - c.x), H / 2 + c.s * (y - c.y)];
};

// ───────── 海报的布局 ─────────
export const CX = 960;
export const CY = 318;
const spokeAng = (i: number) => i * 30 - 90;
const tipOf = (i: number) => ({x: CX + GEO.spokeLen[i] * Math.cos(spokeAng(i) * D2R), y: CY + GEO.spokeLen[i] * Math.sin(spokeAng(i) * D2R)});
const BALL_COL = [C.red, C.turq, C.blue, C.sun, C.pink, C.turq, C.ink, C.blue, C.red, C.turq, C.sun, C.blue];
const MOD_X = 180;
const MOD_BASE = 1012;
const MOD_COL = [C.red, C.blue, C.sun, C.turq, C.pink, C.ink];
const MOD_LAND = [37.5, AT.big, 43.75, 50, 56.25, 62.5];
const MID_X = 80;

/** 从镜头上方落到桌上：h 从 hmax 落到 4（越落越快），落地轻压；之后转角回正 */
const drop = (t: number, land: number, dur: number, hmax: number, x: number, y: number, a0: number, a1: number, dx = 0, dy = 0): Pose | null => {
  if (t < land - dur) return null;
  if (t >= land) return {x, y, a: a1 + wobble(t, land, 2.2, 16, 8), h: 4, s: slap(t, land, 0.04, 3.5)};
  const u = prog(t, land - dur, dur);
  const e = ease.out(u);
  return {x: x + dx * (1 - e), y: y + dy * (1 - e), a: lerp(a0, a1, e), h: 4 + hmax * (1 - u * u)};
};

// 太阳：第 0 帧正在落（影子还很远）
const sunPose = (t: number) => drop(t, 4, 26, 90, 1540, 300, -18, 0, 60, -40);
// 腰果：从左边贴着桌面滑进来
const beanPose = (t: number): Pose => {
  const e = ease.out(prog(t, -16, 34));
  return {x: lerp(-900, 330, e), y: 840, a: lerp(8, -12, e), h: 4, s: 1.25};
};
const discPose = (t: number) => drop(t, -4, 14, 80, CX, CY, 0, 0);
const dotPose = (t: number) => drop(t, 14, 9, 60, CX, CY, 0, 0);

// 辐条：钟心落下后，按顺时针 0.9 帧一根从钟心滑出来（炸开）
const spokeOut = (i: number) => -5 + 0.9 * i;

// 01 Bass：折线手臂的 7 节（从左下往右上），另外 5 根是四周的横竖纸条
const ARM: [number, number][] = [[230, 1160], [470, 850], [410, 795], [760, 560], [700, 500], [1040, 330], [990, 280], [1360, 120]];
const ARM_LAND = (k: number) => AT.bass + 6 + 1.6 * k;
const BASS_BARS: {x: number; y: number; a: number; sx: number; land: number}[] = [
  {x: 1380, y: 640, a: 0, sx: 1.5, land: 131},
  {x: 1640, y: 470, a: 90, sx: 1.6, land: 137.25},
  {x: 340, y: 300, a: 0, sx: 1.4, land: 143.5},
  {x: 1500, y: 700, a: 0, sx: 1.9, land: 149.75},
  {x: 1150, y: 880, a: 90, sx: 1.2, land: 156},
];

/** 辐条在钟上的样子（含落地的转角回正） */
const spokeOnClock = (i: number, t: number): Pose | null => {
  const st = spokeOut(i);
  if (t < st - 2) return null;
  const L = GEO.spokeLen[i];
  const e = ease.out(prog(t, st, 10));
  const r = lerp(L * 0.12, L / 2, e);
  const th = spokeAng(i) * D2R;
  return {x: CX + r * Math.cos(th), y: CY + r * Math.sin(th), a: spokeAng(i) + wobble(t, st + 10, 2, 14, 7), h: 4 + 14 * (1 - e)};
};

/** 辐条的目标：前 7 根是手臂的 7 节，后 5 根是四周的纸条 */
const bassTarget = (i: number) => {
  if (i < 7) {
    const [x0, y0] = ARM[i];
    const [x1, y1] = ARM[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0) + 30;
    return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, a: Math.atan2(y1 - y0, x1 - x0) / D2R, sx: len / GEO.spokeLen[i], land: ARM_LAND(i)};
  }
  return BASS_BARS[i - 7];
};

/** 一根辐条全程的样子，以及这一刻露出哪一面（正面墨 / 背面白） */
export const spokePose = (i: number, t: number): {p: Pose; back: boolean} | null => {
  const base = spokeOnClock(i, t);
  if (!base) return null;
  const lift0 = AT.lift + 0.5 * i;
  if (t < lift0) return {p: base, back: false};
  const from = spokeOnClock(i, lift0)!;
  const tg = bassTarget(i);
  const t0 = lift0;
  const t1 = tg.land;
  const u = prog(t, t0, t1 - t0);
  const e = ease.inOut(u);
  // 翻面：绕纸条的长边转 180°（sy 从 1 走到 −1）
  const flip = Math.cos(Math.PI * ease.inOut(clamp((u - 0.15) / 0.7)));
  let a1 = tg.a;
  while (a1 - (from.a ?? 0) > 180) a1 -= 360;
  while (a1 - (from.a ?? 0) < -180) a1 += 360;
  const p: Pose = {
    x: lerp(from.x, tg.x, e) + Math.sin(Math.PI * e) * (rnd(i, 5) - 0.5) * 260,
    y: lerp(from.y, tg.y, e) + Math.sin(Math.PI * e) * (rnd(i, 6) - 0.5) * 200,
    a: lerp(from.a ?? 0, a1, e) + (t >= t1 ? wobble(t, t1, 2.4, 16, 8) : 0),
    h: t >= t1 ? 4 : 4 + 70 * Math.pow(arc(u), 0.8),
    sx: lerp(1, tg.sx, e),
    sy: Math.abs(flip) < 0.04 ? 0.04 : Math.abs(flip),
    s: t >= t1 ? slap(t, t1, 0.04, 3.5) : 1,
  };
  return {p, back: flip < 0};
};

const ballPose = (i: number, t: number) => {
  const tip = tipOf(i);
  const land = 2 + 2.5 * i;
  return drop(t, land, 11, 72, tip.x, tip.y, -30, 0, 26 * Math.cos(spokeAng(i) * D2R), 26 * Math.sin(spokeAng(i) * D2R));
};

const minuteA = (t: number) => -30 + 360 * ease.inOut(prog(t, 48, 30)) + wobble(t, 78, 3, 16, 9);
const hourA = (t: number) => -150 + 30 * ease.inOut(prog(t, 48, 30));

export const midPose = (i: number, t: number) => {
  const L = GEO.mid.letters[i];
  return drop(t, 22 + 2 * i, 12, 60, MID_X + L.x, 190 + L.y, -40, (rnd(i, 7) - 0.5) * 5, -160, 120);
};
export const centuryPose = (i: number, t: number) => {
  const L = GEO.century.letters[i];
  return drop(t, 30 + 2 * i, 12, 60, MID_X + L.x, 322 + L.y, -40, (rnd(i + 9, 7) - 0.5) * 5, -160, 120);
};
export const modPose = (i: number, t: number) => {
  const L = GEO.modern.letters[i];
  const big = i === 1;
  return drop(t, MOD_LAND[i], big ? 16 : 12, big ? 220 : 150, MOD_X + L.x, MOD_BASE + L.y, (rnd(i, 4) - 0.5) * 30, (rnd(i, 7) - 0.5) * 4, 0, -80);
};

// ───────── 换章：一整张彩纸从右边滑进来 ─────────
const sheetX = (t: number, t0: number) => lerp(2000, -300, ease.inOut(prog(t, t0, 18)));
const SheetIn: React.FC<{t: number; t0: number; fill: string}> = ({t, t0, fill}) => {
  if (t < t0) return null;
  const p: Pose = {x: sheetX(t, t0), y: 0, h: t < t0 + 18 ? 14 : 4};
  return (
    <>
      <Shadow parts={[{d: GEO.sheet, fill}]} p={p} />
      <Body parts={[{d: GEO.sheet, fill}]} p={{...p, h: 0}} />
    </>
  );
};
/** 某张纸已经完全盖住画面 */
const covered = (t: number, t0: number) => t >= t0 + 18;
/** 给外框用：这一刻纸的左边缘在屏幕上的 x */
export const sheetEdge = (t: number) => {
  if (t >= AT.sheet2) return {x: toScreen(t, sheetX(t, AT.sheet2), 0)[0], bg: C.turq, under: C.blue};
  if (t >= AT.sheet1) return {x: toScreen(t, sheetX(t, AT.sheet1), 0)[0], bg: C.blue, under: C.paper};
  return {x: W + 100, bg: C.paper, under: C.paper};
};

// ───────── 画面 ─────────
const Poster: React.FC<{t: number}> = ({t}) => {
  const sun = sunPose(t);
  const disc = discPose(t);
  const dot = dotPose(t);
  const balls = Array.from({length: 12}, (_, i) => ({i, p: ballPose(i, t)}));
  return (
    <>
      <rect x={-2000} y={-2000} width={W + 4000} height={H + 4000} fill={C.paper} />
      {sun && <Piece d={GEO.sun} fill={C.sun} p={{...sun, s: (sun.s ?? 1) * 1.1}} />}
      <Piece d={GEO.bean} fill={C.pink} p={beanPose(t)} />
      {t >= 70 && <Piece d={GEO.star} fill={C.blue} p={{x: 1790, y: 700, a: 10 + t * 0.4, h: 4 + 60 * (1 - ease.in2(prog(t, 70, 9)))}} />}
      {t >= 76 && <Piece d={GEO.starS} fill={C.red} p={{x: 1730, y: 780, a: -t * 0.6, h: 4 + 60 * (1 - ease.in2(prog(t, 76, 9)))}} />}
      {t >= 74 && <Piece d={GEO.starS} fill={C.turq} p={{x: 640, y: 120, a: t * 0.5, h: 4 + 60 * (1 - ease.in2(prog(t, 74, 9)))}} />}
      {/* 钟：辐条（还没弹起来的）→ 球 → 钟心 → 指针 → 钟心点 */}
      {Array.from({length: 12}, (_, i) => {
        const sp = spokePose(i, t);
        return sp && t < AT.lift + 0.5 * i ? <Piece key={i} d={GEO.spokes[i]} fill={C.ink} p={sp.p} /> : null;
      })}
      {balls.filter((b) => b.p && (b.p.h ?? 4) < 10).map(({i, p}) => <Piece key={i} d={GEO.balls[i]} fill={BALL_COL[i]} p={p!} />)}
      {disc && <Piece d={GEO.disc} fill={C.ink} p={disc} />}
      {t >= 38 && <Piece d={GEO.hour} fill={C.paper} p={{x: CX, y: CY, a: hourA(t), h: 4 + 50 * (1 - ease.in2(prog(t, 38, 8)))}} />}
      {t >= 42 && <Piece d={GEO.minute} fill={C.paper} p={{x: CX, y: CY, a: minuteA(t), h: 5 + 50 * (1 - ease.in2(prog(t, 42, 8)))}} />}
      {dot && <Piece d={GEO.discDot} fill={C.sun} p={dot} />}
      {balls.filter((b) => b.p && (b.p.h ?? 4) >= 10).map(({i, p}) => <Piece key={i} d={GEO.balls[i]} fill={BALL_COL[i]} p={p!} />)}
      {/* 字 */}
      {GEO.mid.letters.map((L, i) => {
        const p = midPose(i, t);
        return p ? <Piece key={`a${i}`} d={L.d} fill={C.ink} p={p} /> : null;
      })}
      {GEO.century.letters.map((L, i) => {
        const p = centuryPose(i, t);
        return p ? <Piece key={`b${i}`} d={L.d} fill={C.ink} p={p} /> : null;
      })}
      {GEO.modern.letters.map((L, i) => {
        const p = modPose(i, t);
        return p ? <Piece key={`c${i}`} d={L.d} fill={MOD_COL[i]} p={p} /> : null;
      })}
    </>
  );
};

// 01 的大字：1955，白色手剪，十六分音符一个个拍下去（右下）
const yearPose = (i: number, t: number) => {
  const L = GEO.y1955.letters[i];
  return drop(t, 158 + 4 * i, 10, 140, 1280 + L.x, 1010 + L.y, (rnd(i, 3) - 0.5) * 30, (rnd(i, 8) - 0.5) * 5, 0, -60);
};
const Year: React.FC<{t: number}> = ({t}) => (
  <>
    {GEO.y1955.letters.map((L, i) => {
      const p = yearPose(i, t);
      return p ? <Piece key={i} d={L.d} fill={C.paper} p={p} /> : null;
    })}
  </>
);

/** 空中的辐条（弹起来以后，在所有纸上面飞；翻到背面是白的） */
const FlyingSpokes: React.FC<{t: number; landed: boolean}> = ({t, landed}) => (
  <>
    {Array.from({length: 12}, (_, i) => {
      const sp = spokePose(i, t);
      if (!sp || t < AT.lift + 0.5 * i) return null;
      const down = (sp.p.h ?? 4) < 8 && t > AT.bass;
      if (down !== landed) return null;
      return <Piece key={i} d={GEO.spokes[i]} fill={sp.back ? C.paper : C.ink} p={sp.p} />;
    })}
  </>
);

export const Film: React.FC<{t: number; k: number}> = ({t}) => (
  <g transform={camTransform(t)}>
    {!covered(t, AT.sheet1) && <Poster t={t} />}
    {!covered(t, AT.sheet1) && <PosterText t={t} />}
    <SheetIn t={t} t0={AT.sheet1} fill={C.blue} />
    {!covered(t, AT.sheet2) && <FlyingSpokes t={t} landed />}
    {!covered(t, AT.sheet2) && <Year t={t} />}
    <SheetIn t={t} t0={AT.sheet2} fill={C.turq} />
    {!covered(t, AT.sheet2) && <FlyingSpokes t={t} landed={false} />}
  </g>
);

/** 海报右上的小字（印在太阳上），按行从遮罩里升起 */
export const PosterText: React.FC<{t: number}> = ({t}) => {
  if (t < 64 || covered(t, AT.sheet1)) return null;
  const e = ease.out(prog(t, 64, 16));
  const e2 = ease.out(prog(t, 70, 16));
  return (
    <g>
      <svg x={1300} y={150} width={540} height={60} overflow="hidden">
        <text x={540} y={46 + (1 - e) * 60} textAnchor="end" fontFamily="'Noto Sans SC', sans-serif" fontWeight={900} fontSize={44} fill={C.ink} letterSpacing={14}>中世纪现代</text>
      </svg>
      <svg x={1300} y={212} width={540} height={40} overflow="hidden">
        <text x={540} y={28 + (1 - e2) * 40} textAnchor="end" fontFamily="'Jost', sans-serif" fontWeight={600} fontSize={22} fill={C.ink} letterSpacing={6}>1945 — 1965 · NO. 017</text>
      </svg>
    </g>
  );
};

/** 这一刻屏幕上最快的东西每帧走多少 px（决定运动模糊取几个子帧） */
export const filmSpeed = (t: number) => {
  const pts = (u: number) => {
    const out: number[][] = [];
    const add = (p: Pose | null | undefined, ext = 0) => {
      if (!p) return;
      out.push(toScreen(u, p.x, p.y));
      if (ext) {
        const a = (p.a ?? 0) * D2R;
        out.push(toScreen(u, p.x + ext * Math.cos(a), p.y + ext * Math.sin(a)));
      }
    };
    add(sunPose(u));
    add(beanPose(u));
    for (let i = 0; i < 12; i++) {
      add(spokePose(i, u)?.p, 160);
      add(ballPose(i, u));
    }
    for (let i = 0; i < 4; i++) add(midPose(i, u));
    for (let i = 0; i < 7; i++) add(centuryPose(i, u));
    for (let i = 0; i < 6; i++) add(modPose(i, u));
    for (let i = 0; i < 4; i++) add(yearPose(i, u));
    out.push([sheetX(u, AT.sheet1), 0], [sheetX(u, AT.sheet2), 0]);
    out.push(toScreen(u, CX + 236 * Math.cos(minuteA(u) * D2R), CY + 236 * Math.sin(minuteA(u) * D2R)));
    return out;
  };
  const a = pts(t - 0.5);
  const b = pts(t + 0.5);
  let v = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) v = Math.max(v, Math.hypot(b[i][0] - a[i][0], b[i][1] - a[i][1]));
  return Math.min(80, v);
};

/** 左下 h 读数：这一刻在看哪一块纸 */
export const focusAt = (t: number): {p: Pose | null; fill: string} => {
  if (t < 2) return {p: sunPose(t), fill: C.sun};
  if (t < 34) {
    const i = clamp(Math.floor((t - 2 + 11) / 2.5), 0, 11);
    return {p: ballPose(i, t), fill: BALL_COL[i]};
  }
  if (t < AT.big + 6) {
    let k = 0;
    for (const i of [0, 2, 3, 4, 5]) if (MOD_LAND[i] - 12 <= t) k = i;
    if (t >= MOD_LAND[5]) k = 1;
    return {p: modPose(k, t), fill: MOD_COL[k]};
  }
  if (t < AT.lift) return {p: modPose(1, t), fill: C.blue};
  const sp = spokePose(3, t);
  return {p: sp?.p ?? null, fill: sp?.back ? C.paper : C.ink};
};
