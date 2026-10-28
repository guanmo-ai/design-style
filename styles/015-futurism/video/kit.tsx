/**
 * 015 · 未来主义 —— 画面的基本件（全片用一张 1920×1080 的 SVG 画）
 *
 *   Echoes   残影：把“过去的自己”按 k·Δt 往回取样画出来（远的先画，本体最后画），不透明度 0.6^k
 *   Word     一个字母一个字母排的 Archivo：wdth 跟速度走、可以整体前倾（惯性）
 *   Wedge / ForceLines   力线：楔形，尖端收向运动前方，长度 ∝ 速度，最多 6 条
 *   Rise     按行从遮罩里升起（不用淡入）
 * 都是时间的纯函数；残影和运动模糊都靠“在过去的时刻再算一遍”。
 */
import React from 'react';
import {C, ECHO, FONT, FORCE, wdthOf} from '../tokens';
import {ADV, CAP, WDTH_SAMPLES} from './metrics';
import {clamp, ease, lerp, prog} from './motion';

export const W = 1920;
export const H = 1080;
export {CAP};

/* ───────── 字宽表 ───────── */
const nearestW = (w: number) => (w >= 850 ? 900 : w >= 750 ? 800 : 700);
export const advOf = (ch: string, wdth: number, wght = 900) => {
  const row = ADV[nearestW(wght)][ch] ?? ADV[nearestW(wght)]['O'];
  const s = WDTH_SAMPLES;
  const w = clamp(wdth, s[0], s[s.length - 1]);
  let i = 1;
  while (i < s.length - 1 && w > s[i]) i++;
  const u = (w - s[i - 1]) / (s[i] - s[i - 1]);
  return lerp(row[i - 1], row[i], u);
};
/** 每个字母左边的位置（相对起点，px）与整行宽度 */
export const layout = (text: string, size: number, wdth: number, wght = 900, ls = 0) => {
  const xs: number[] = [];
  let x = 0;
  for (const ch of text) {
    xs.push(x);
    x += (advOf(ch, wdth, wght) + ls) * size;
  }
  return {xs, width: x - ls * size};
};

/* ───────── 残影 ───────── */
export const echoAlpha = (k: number) => Math.pow(ECHO.alpha, k);

/**
 * 残影：render(τ, k) 画 τ 时刻的自己；k = 0 是本体（τ = t）。
 * state(τ) 给出这个东西在 τ 时刻的状态向量（位置、角度、相位……）：和本体几乎一样的那几层不画——
 * 所以停下时残影“收进”本体，而不是在边上留一圈彩色的毛边。
 */
export const Echoes: React.FC<{
  t: number;
  render: (tau: number, k: number) => React.ReactNode;
  state?: (tau: number) => number[];
  n?: number;
  dt?: number;
  eps?: number;
}> = ({t, render, state, n = ECHO.n, dt = ECHO.dt, eps = 0.6}) => {
  const s0 = state?.(t);
  const out: React.ReactNode[] = [];
  for (let k = n; k >= 1; k--) {
    const tau = t - k * dt;
    if (s0 && state) {
      const s = state(tau);
      let d = 0;
      for (let i = 0; i < s.length; i++) d = Math.max(d, Math.abs(s[i] - s0[i]));
      if (d < eps) continue;
    }
    out.push(
      <g key={k} opacity={echoAlpha(k)}>
        {render(tau, k)}
      </g>,
    );
  }
  out.push(<g key={0}>{render(t, 0)}</g>);
  return <>{out}</>;
};

/** 状态差大于 eps 的残影有几层（读数用） */
export const echoCount = (t: number, state: (tau: number) => number[], eps = 2, n: number = ECHO.n, dt: number = ECHO.dt) => {
  const s0 = state(t);
  let c = 0;
  for (let k = 1; k <= n; k++) {
    const s = state(t - k * dt);
    let d = 0;
    for (let i = 0; i < s.length; i++) d = Math.max(d, Math.abs(s[i] - s0[i]));
    if (d >= eps) c++;
  }
  return c;
};

/* ───────── 字 ───────── */
type WordProps = {
  text: string;
  x: number;
  y: number; // 基线
  size: number;
  wdth?: number;
  wght?: number;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
  ls?: number; // 字距（em）
  lean?: number; // 前倾（度）：正值 = 字头往 +x 倒
  sy?: number; // 纵向拉伸（以基线为原点）
  rot?: number; // 绕 (x, y) 旋转（度）
  opacity?: number;
  letter?: (i: number, ch: string) => {dx?: number; dy?: number; sy?: number; fill?: string; hide?: boolean} | undefined;
};
const fmt = (v: number) => v.toFixed(2);
export const Word: React.FC<WordProps> = ({text, x, y, size, wdth = 100, wght = 900, fill = C.ink, anchor = 'start', ls = -0.01, lean = 0, sy = 1, rot = 0, opacity = 1, letter}) => {
  if (opacity <= 0.001) return null;
  const L = layout(text, size, wdth, wght, ls);
  const x0 = anchor === 'start' ? 0 : anchor === 'middle' ? -L.width / 2 : -L.width;
  const style: React.CSSProperties = {
    fontFamily: FONT.display,
    fontWeight: wght,
    fontStretch: `${wdth.toFixed(1)}%`,
    fontVariationSettings: `'wght' ${wght}, 'wdth' ${wdth.toFixed(2)}`,
    fontKerning: 'none',
  };
  const tr = [`translate(${fmt(x)} ${fmt(y)})`];
  if (rot) tr.push(`rotate(${rot.toFixed(3)})`);
  if (lean) tr.push(`skewX(${(-lean).toFixed(3)})`);
  if (sy !== 1) tr.push(`scale(1 ${sy.toFixed(4)})`);
  return (
    <g transform={tr.join(' ')} opacity={opacity < 1 ? opacity : undefined} style={style} fontSize={size} fill={fill}>
      {[...text].map((ch, i) => {
        const o = letter?.(i, ch);
        if (o?.hide || ch === ' ') return null;
        const lx = x0 + L.xs[i] + (o?.dx ?? 0);
        const ly = o?.dy ?? 0;
        return (
          <text key={i} x={fmt(lx)} y={fmt(ly)} fill={o?.fill} transform={o?.sy && o.sy !== 1 ? `translate(0 ${fmt(ly)}) scale(1 ${o.sy.toFixed(4)}) translate(0 ${fmt(-ly)})` : undefined}>
            {ch}
          </text>
        );
      })}
    </g>
  );
};
/** 字宽：速度 → wdth（62 停 → 125 全速） */
export {wdthOf};

/** 中文 / 等宽：普通 SVG 文字 */
export const Txt: React.FC<{x: number; y: number; size: number; children: React.ReactNode; fam?: 'sc' | 'mono'; w?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; ls?: number; opacity?: number; sx?: number; lean?: number}> = ({
  x,
  y,
  size,
  children,
  fam = 'sc',
  w = 900,
  fill = C.ink,
  anchor = 'start',
  ls = 0,
  opacity = 1,
  sx = 1,
  lean = 0,
}) => {
  if (opacity <= 0.001) return null;
  const tr = sx !== 1 || lean ? `translate(${fmt(x)} ${fmt(y)}) skewX(${(-lean).toFixed(3)}) scale(${sx.toFixed(4)} 1) translate(${fmt(-x)} ${fmt(-y)})` : undefined;
  return (
    <text
      x={fmt(x)}
      y={fmt(y)}
      fontFamily={fam === 'sc' ? FONT.sc : FONT.mono}
      fontWeight={w}
      fontSize={size}
      fill={fill}
      textAnchor={anchor}
      letterSpacing={ls ? fmt(ls * size) : undefined}
      opacity={opacity < 1 ? opacity : undefined}
      transform={tr}
    >
      {children}
    </text>
  );
};

/* ───────── 力线 ───────── */
export type Pt = {x: number; y: number};
/** 楔形：宽端 a（宽 w0），尖端 b（宽 w1） */
export const wedgePts = (a: Pt, b: Pt, w0: number, w1 = 0) => {
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  return [
    [a.x + (nx * w0) / 2, a.y + (ny * w0) / 2],
    [b.x + (nx * w1) / 2, b.y + (ny * w1) / 2],
    [b.x - (nx * w1) / 2, b.y - (ny * w1) / 2],
    [a.x - (nx * w0) / 2, a.y - (ny * w0) / 2],
  ]
    .map((p) => `${fmt(p[0])},${fmt(p[1])}`)
    .join(' ');
};
export const Wedge: React.FC<{a: Pt; b: Pt; w0: number; w1?: number; fill: string; opacity?: number}> = ({a, b, w0, w1 = 0, fill, opacity = 1}) =>
  opacity <= 0.001 || Math.hypot(b.x - a.x, b.y - a.y) < 1 ? null : <polygon points={wedgePts(a, b, w0, w1)} fill={fill} opacity={opacity < 1 ? opacity : undefined} />;

/**
 * 一组力线：尖端都收向 front（运动前方的一点），宽端在后方扇开；长度 = 速度 × lenPerSpeed，最多 6 条。
 * dir：运动方向（弧度）；spread：宽端扇开的半高（px）；速度低于 minSpeed 时缩回尖端
 */
export type ForceSpec = {off: number; w: number; fill: string; len?: number};
export const ForceLines: React.FC<{front: Pt; dir: number; v: number; spec: ForceSpec[]; spread?: number; gap?: number; kLen?: number}> = ({front, dir, v, spec, spread = 1, gap = 24, kLen = FORCE.lenPerSpeed}) => {
  const L = Math.max(0, Math.abs(v) - FORCE.minSpeed) * kLen;
  if (L < 2) return null;
  const ux = Math.cos(dir);
  const uy = Math.sin(dir);
  const nx = -uy;
  const ny = ux;
  return (
    <>
      {spec.slice(0, FORCE.max).map((s, i) => {
        const len = L * (s.len ?? 1);
        const tip = {x: front.x - ux * gap + nx * s.off * 0.12, y: front.y - uy * gap + ny * s.off * 0.12};
        const base = {x: tip.x - ux * len + nx * s.off * spread, y: tip.y - uy * len + ny * s.off * spread};
        return <Wedge key={i} a={base} b={tip} w0={s.w * clamp(len / 300, 0.25, 1)} fill={s.fill} />;
      })}
    </>
  );
};

/* ───────── 从遮罩里升起 ───────── */
/** 一行字从遮罩底下升上来：at 开始，d 帧（ease-out）；box = 遮罩（x, y 顶, w, h） */
export const Rise: React.FC<{t: number; at: number; d?: number; box: [number, number, number, number]; children: React.ReactNode; out?: number; dOut?: number}> = ({t, at, d = 16, box, children, out, dOut = 12}) => {
  const u = ease.out(prog(t, at, d));
  if (u <= 0) return null;
  const o = out !== undefined ? ease.in(prog(t, out, dOut)) : 0;
  if (o >= 1) return null;
  const [x, y, w, h] = box;
  const dy = (1 - u) * h * 1.05 - o * h * 1.05;
  return (
    <svg x={x} y={y} width={w} height={h} overflow="hidden" viewBox={`${x} ${y} ${w} ${h}`}>
      <g transform={`translate(0 ${fmt(dy)})`}>{children}</g>
    </svg>
  );
};

/** 绕 (cx, cy) 的镜头：缩放 s、旋转 rot（度）、再平移 (dx, dy)（屏幕像素） */
export const camT = (cx: number, cy: number, s: number, rot = 0, dx = 0, dy = 0) =>
  `translate(${fmt(W / 2 + dx)} ${fmt(H / 2 + dy)}) rotate(${rot.toFixed(3)}) scale(${s.toFixed(5)}) translate(${fmt(-cx)} ${fmt(-cy)})`;

/** 颜色混合（hex） */
export const mixHex = (a: string, b: string, u: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u))).toString(16).padStart(2, '0')).join('');
};

/** 指数插值（推镜用：每帧放大同样的倍数） */
export const zoomLerp = (a: number, b: number, u: number) => a * Math.pow(b / a, u);
