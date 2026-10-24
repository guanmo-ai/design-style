/** 007 · Minimalism —— 共用工具：按基线排字（字宽来自真实字体度量）、发丝线、引线、那个点 */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C, FONT, LINE} from '../tokens';
import {ADV} from './metrics';

export type P = {f: number};
export const W = 1920;
export const H = 1080;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const c01 = (t: number) => Math.min(1, Math.max(0, t));
export const n2 = (v: number) => Math.round(v * 100) / 100;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const sineInOut = (t: number) => (1 - Math.cos(Math.PI * c01(t))) / 2;
/** 出现 × 退场：at 起 dur 帧淡入，out 起 outDur 帧淡出 */
export const vis = (f: number, at: number, out = 1e9, dur = 14, outDur = 10) =>
  tween(f, at, dur, 0, 1, E.out) * (1 - tween(f, out, outDur, 0, 1, E.inOut));

/* ───────── 字 ───────── */
export type FontKey = 'd100' | 'd200' | 'd300' | 't300' | 't400' | 't500' | 'mono' | 'sc300' | 'sc400' | 'sc500';
const FAM: Record<FontKey, [string, number]> = {
  d100: [FONT.display, 100],
  d200: [FONT.display, 200],
  d300: [FONT.display, 300],
  t300: [FONT.text, 300],
  t400: [FONT.text, 400],
  t500: [FONT.text, 500],
  mono: [FONT.mono, 400],
  sc300: [FONT.sc, 300],
  sc400: [FONT.sc, 400],
  sc500: [FONT.sc, 500],
};
const isCJK = (ch: string) => /[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch);
const table = (k: FontKey) => ADV[k.startsWith('sc') ? 'sc300' : k];
export const adv = (ch: string, k: FontKey) => (isCJK(ch) ? 1 : table(k)[ch] ?? 0.56);
/** 文字宽度（像素）：字宽之和 + 字距（最后一个字后面不算） */
export const tw = (s: string, k: FontKey, size: number, ls = 0) =>
  [...s].reduce((a, ch) => a + adv(ch, k), 0) * size + ls * size * Math.max(0, [...s].length - 1);

export const font = (k: FontKey, size: number, ls = 0): React.CSSProperties => ({
  fontFamily: FAM[k][0],
  fontWeight: FAM[k][1],
  fontSize: size,
  letterSpacing: ls ? `${ls}em` : undefined,
});

/** 一行字：x 为对齐点，y 为基线。字距会在最后一个字后面多出一段，右 / 中对齐时补回来 */
export const Txt: React.FC<{
  x: number;
  y: number;
  k?: FontKey;
  size: number;
  c?: string;
  ls?: number;
  anchor?: 'start' | 'middle' | 'end';
  o?: number;
  children: React.ReactNode;
}> = ({x, y, k = 't400', size, c = C.ink, ls = 0, anchor = 'start', o = 1, children}) => {
  if (o <= 0.001) return null;
  const fix = anchor === 'end' ? ls * size : anchor === 'middle' ? (ls * size) / 2 : 0;
  return (
    <text x={n2(x + fix)} y={n2(y)} fill={c} textAnchor={anchor} opacity={o < 1 ? o : undefined} style={font(k, size, ls)}>
      {children}
    </text>
  );
};

/** 逐字母：每个字母一个 <text>，位置按真实字宽算好；fx(i) 给出第 i 个字母的透明度与位移 */
export const Letters: React.FC<{
  text: string;
  x: number;
  y: number;
  k: FontKey;
  size: number;
  ls?: number;
  c?: string;
  fx: (i: number, n: number) => {o: number; dx?: number; dy?: number};
}> = ({text, x, y, k, size, ls = 0, c = C.ink, fx}) => {
  const chars = [...text];
  let cx = x;
  return (
    <>
      {chars.map((ch, i) => {
        const at = cx;
        cx += adv(ch, k) * size + ls * size;
        const {o, dx = 0, dy = 0} = fx(i, chars.length);
        if (o <= 0.001 || ch === ' ') return null;
        return (
          <text key={i} x={n2(at + dx)} y={n2(y + dy)} fill={c} opacity={o < 1 ? n2(o) : undefined} style={font(k, size)}>
            {ch}
          </text>
        );
      })}
    </>
  );
};

/* ───────── 线 ───────── */
/** 一根线：p 为画出的比例；from='center' 时从中点向两边长 */
export const Hair: React.FC<{x1: number; y1: number; x2: number; y2: number; p?: number; w?: number; c?: string; o?: number; from?: 'start' | 'center' | 'end'; dash?: string}> = ({
  x1,
  y1,
  x2,
  y2,
  p = 1,
  w = LINE.main,
  c = C.ink,
  o = 1,
  from = 'start',
  dash,
}) => {
  if (p <= 0.001 || o <= 0.001) return null;
  let a = 0;
  let b = p;
  if (from === 'center') {
    a = 0.5 - p / 2;
    b = 0.5 + p / 2;
  } else if (from === 'end') {
    a = 1 - p;
    b = 1;
  }
  return (
    <line
      x1={n2(lerp(x1, x2, a))}
      y1={n2(lerp(y1, y2, a))}
      x2={n2(lerp(x1, x2, b))}
      y2={n2(lerp(y1, y2, b))}
      stroke={c}
      strokeWidth={w}
      opacity={o < 1 ? n2(o) : undefined}
      strokeDasharray={dash}
      vectorEffect="non-scaling-stroke"
    />
  );
};

/** 引线：从物件上的一个小点出发，斜着出去再水平走到标签；p 为画出的比例 */
export const Leader: React.FC<{x: number; y: number; kx: number; ky: number; ex: number; p: number; c?: string}> = ({x, y, kx, ky, ex, p, c = C.ink}) => {
  if (p <= 0.001) return null;
  const l1 = Math.hypot(kx - x, ky - y);
  const l2 = Math.abs(ex - kx);
  const L = (l1 + l2) * p;
  const t1 = Math.min(1, L / l1);
  const t2 = L > l1 ? (L - l1) / l2 : 0;
  return (
    <g>
      <circle cx={x} cy={y} r={4 * Math.min(1, p * 4)} fill={c} />
      <line x1={x} y1={y} x2={n2(lerp(x, kx, t1))} y2={n2(lerp(y, ky, t1))} stroke={c} strokeWidth={LINE.note} />
      {t2 > 0 && <line x1={kx} y1={ky} x2={n2(lerp(kx, ex, t2))} y2={ky} stroke={c} strokeWidth={LINE.note} />}
    </g>
  );
};

/* ───────── 那个点 ───────── */
export const Dot: React.FC<{x: number; y: number; r: number; c?: string; o?: number}> = ({x, y, r, c = C.accent, o = 1}) =>
  r > 0.05 && o > 0.001 ? <circle cx={n2(x)} cy={n2(y)} r={n2(r)} fill={c} opacity={o < 1 ? n2(o) : undefined} /> : null;

/** 落点的一圈涟漪（发丝线） */
export const Ripple: React.FC<{f: number; at: number; x: number; y: number; r0: number; r1: number; dur?: number; c?: string}> = ({f, at, x, y, r0, r1, dur = 40, c = C.ink}) => {
  const p = tween(f, at, dur, 0, 1, E.out);
  if (p <= 0 || p >= 1) return null;
  return <circle cx={x} cy={y} r={n2(lerp(r0, r1, p))} fill="none" stroke={c} strokeWidth={LINE.note} opacity={n2(0.45 * (1 - p))} />;
};

/** 一个矩形（可圆角），用四个数描述，方便在幕与幕之间插值 */
export type Box = {x: number; y: number; w: number; h: number; r?: number};
export const mixBox = (a: Box, b: Box, t: number): Box => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  r: lerp(a.r ?? 0, b.r ?? 0, t),
});
/** 四边形四个角 → path */
export const quad = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${n2(x)} ${n2(y)}`).join('L') + 'Z';
