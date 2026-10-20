/** 001 · 包豪斯 —— 视频共用的小部件与排版工具 */
import React from 'react';
import {E, POP, SNAP, spr, tween} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';

export const W = 1920;
export const H = 1080;

export const cjk = (size: number, weight = 900): React.CSSProperties => ({fontFamily: FONT.cjk, fontSize: size, fontWeight: weight});
export const latin = (size: number, weight = 600): React.CSSProperties => ({fontFamily: FONT.latin, fontSize: size, fontWeight: weight});
export const mono = (size: number, weight = 500): React.CSSProperties => ({fontFamily: FONT.mono, fontSize: size, fontWeight: weight});
/** 拉丁字母用 Jost，中文自动回落到思源黑体 */
export const mixed = (size: number, weight = 600): React.CSSProperties => ({fontFamily: `'Jost', ${FONT.cjk}`, fontSize: size, fontWeight: weight});

export const polar = (r: number, deg: number): [number, number] => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];
export const pts = (p: number[][]) => p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');

/** 以重心为原点的正三角形 */
export const triPoints = (s: number) => {
  const h = (s * Math.sqrt(3)) / 2;
  return `0,${(-2 * h) / 3} ${s / 2},${h / 3} ${-s / 2},${h / 3}`;
};
export const triPath = (s: number) => {
  const h = (s * Math.sqrt(3)) / 2;
  return `M 0 ${(-2 * h) / 3} L ${s / 2} ${h / 3} L ${-s / 2} ${h / 3} Z`;
};
export const circlePath = (r: number) => `M ${-r} 0 A ${r} ${r} 0 1 1 ${r} 0 A ${r} ${r} 0 1 1 ${-r} 0 Z`;
export const squarePath = (s: number) => `M ${-s / 2} ${-s / 2} H ${s / 2} V ${s / 2} H ${-s / 2} Z`;

/** 上滑淡入 */
export const Rise: React.FC<{f: number; at: number; out?: number; dy?: number; children: React.ReactNode}> = ({f, at, out, dy = 40, children}) => {
  const p = spr(f, at, SNAP, 30);
  const o = out !== undefined ? 1 - tween(f, out, 12, 0, 1, E.inOut) : 1;
  const oy = out !== undefined ? -tween(f, out, 12, 0, 30, E.in) : 0;
  return (
    <g opacity={Math.min(1, p * 1.4) * o} transform={`translate(0 ${(1 - p) * dy + oy})`}>
      {children}
    </g>
  );
};

/** 设计标注：锚点 + 引线 + 深色标签 */
export const Spec: React.FC<{f: number; at: number; ax: number; ay: number; lx: number; ly: number; text: string; w: number; id: string; line?: string; box?: string}> = ({
  f,
  at,
  ax,
  ay,
  lx,
  ly,
  text,
  w,
  id,
  line: lineColor = C.paper,
  box = C.ink,
}) => {
  if (f < at) return null;
  const p = spr(f, at, POP, 24);
  const line = tween(f, at, 10, 0, 1);
  const wipe = tween(f, at + 3, 12, 0, 1);
  const hh = 40;
  const tx = Math.min(Math.max(ax, lx), lx + w);
  const ty = ay < ly ? ly : ly + hh;
  return (
    <g>
      <line x1={ax} y1={ay} x2={ax + (tx - ax) * line} y2={ay + (ty - ay) * line} stroke={lineColor} strokeWidth={2} />
      <circle cx={ax} cy={ay} r={7 * p} fill={C.red} stroke={lineColor} strokeWidth={2.5} />
      <clipPath id={`spec-${id}`}>
        <rect x={lx} y={ly} width={w * wipe} height={hh} />
      </clipPath>
      <g clipPath={`url(#spec-${id})`}>
        <rect x={lx} y={ly} width={w} height={hh} fill={box} />
        <text x={lx + 14} y={ly + 27} fill={box === C.ink ? C.paper : C.ink} style={{...mono(18, 500), fontFamily: `'JetBrains Mono', ${FONT.cjk}`}}>
          {text}
        </text>
      </g>
    </g>
  );
};
