/** 003 · Constructivism —— 几何、排字与小工具（全片用 SVG 画：形、字、网点都在同一个坐标系里） */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {BEAT, C, FONT, N, U} from '../tokens';

export type P = {f: number};
export type Pt = {x: number; y: number};
export const W = 1920;
export const H = 1080;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const c01 = (t: number) => Math.min(1, Math.max(0, t));
export const pt = (x: number, y: number): Pt => ({x, y});
export const add = (a: Pt, b: Pt, k = 1): Pt => ({x: a.x + b.x * k, y: a.y + b.y * k});
export const mix = (a: Pt, b: Pt, t: number): Pt => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
export const dir = (deg: number): Pt => ({x: Math.cos((deg * Math.PI) / 180), y: Math.sin((deg * Math.PI) / 180)});
/** 沿主轴 u、副轴 n 走：p + U·u + N·n */
export const on = (p: Pt, u: number, n = 0): Pt => ({x: p.x + U.x * u + N.x * n, y: p.y + U.y * u + N.y * n});
export const pts = (a: Pt[]) => a.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
export const beat = (k: number) => k * BEAT;

/** 楔形：尖端 tip、指向角 ang（度）、长 len、底边半宽 hw */
export const wedge = (tip: Pt, ang: number, len: number, hw: number): Pt[] => {
  const d = dir(ang);
  const n = {x: -d.y, y: d.x};
  const b = {x: tip.x - d.x * len, y: tip.y - d.y * len};
  return [tip, {x: b.x + n.x * hw, y: b.y + n.y * hw}, {x: b.x - n.x * hw, y: b.y - n.y * hw}];
};

/** 中心 c、长 w（沿 ang）、宽 h 的旋转矩形 */
export const bar = (c: Pt, ang: number, w: number, h: number): Pt[] => {
  const d = dir(ang);
  const n = {x: -d.y, y: d.x};
  const a = w / 2;
  const b = h / 2;
  return [
    {x: c.x - d.x * a - n.x * b, y: c.y - d.y * a - n.y * b},
    {x: c.x + d.x * a - n.x * b, y: c.y + d.y * a - n.y * b},
    {x: c.x + d.x * a + n.x * b, y: c.y + d.y * a + n.y * b},
    {x: c.x - d.x * a + n.x * b, y: c.y - d.y * a + n.y * b},
  ];
};

export const Poly: React.FC<{p: Pt[]; fill: string; o?: number; style?: React.CSSProperties}> = ({p, fill, o = 1, style}) =>
  o <= 0.001 ? null : <polygon points={pts(p)} fill={fill} opacity={o < 1 ? o : undefined} style={style} />;

/* ─────────── 字 ─────────── */
// Oswald：hhea 1.193 / 0.289，大写高度 0.81 em；思源黑体 Black：汉字字面约 0.88 em 高、基线以上 0.84 em
export const CAP = 0.81;
export const CJK = 0.84;
type TxtProps = {
  x: number;
  y: number; // 基线
  size: number;
  w?: number;
  ls?: number; // 字距（em）
  fill?: string;
  rot?: number; // 绕 (x, y) 旋转（度）
  anchor?: 'start' | 'middle' | 'end';
  sc?: boolean; // 中文
  o?: number;
  children: React.ReactNode;
  extra?: React.SVGProps<SVGTextElement>;
};
export const Txt: React.FC<TxtProps> = ({x, y, size, w = 700, ls = 0, fill = C.ink, rot = 0, anchor, sc, o = 1, children, extra}) =>
  o <= 0.001 ? null : (
    <text
      x={x}
      y={y}
      fontFamily={sc ? FONT.sc : FONT.cond}
      fontWeight={w}
      fontSize={size}
      letterSpacing={ls ? `${(ls * size).toFixed(2)}` : undefined}
      fill={fill}
      textAnchor={anchor}
      opacity={o < 1 ? o : undefined}
      transform={rot ? `rotate(${rot.toFixed(3)} ${x.toFixed(2)} ${y.toFixed(2)})` : undefined}
      {...extra}
    >
      {children}
    </text>
  );

/** 盖章：字在拍点上“砸”下来 —— 从 1.5 倍、透明，6 帧内落到 1 倍 */
export const stamp = (f: number, at: number, from = 1.5, d = 7) => {
  if (f < at) return {s: from, o: 0};
  const p = tween(f, at, d, 0, 1, E.out);
  return {s: lerp(from, 1, p), o: c01((f - at) / 2.5)};
};
/** 让一组元素绕点 (x, y) 缩放（盖章用） */
export const Scale: React.FC<{x: number; y: number; s: number; o?: number; children: React.ReactNode}> = ({x, y, s, o = 1, children}) =>
  o <= 0.001 ? null : (
    <g transform={s !== 1 ? `translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})` : undefined} opacity={o < 1 ? o : undefined}>
      {children}
    </g>
  );

/** 署名牌：左上角两行（人 · 作品 · 年份），带一条红色短线；每章都一样的位置，观众知道去哪看 */
export const Credit: React.FC<{f: number; at: number; out?: number; a: string; b: string; dark?: boolean; x?: number; y?: number}> = ({f, at, out = 1e9, a, b, dark, x = 96, y = 96}) => {
  const o = tween(f, at, 8) * (1 - tween(f, out, 6));
  if (o <= 0.001) return null;
  const p = tween(f, at, 14, 0, 1, E.out);
  const ink = dark ? C.paper : C.ink;
  return (
    <g opacity={o}>
      <rect x={x} y={y} width={56 * p} height={8} fill={C.red} />
      <g transform={`translate(${(1 - p) * -30} 0)`}>
        <Txt x={x} y={y + 50} size={30} w={700} sc fill={ink}>{a}</Txt>
        <Txt x={x} y={y + 86} size={22} w={500} sc fill={ink} o={0.72}>{b}</Txt>
      </g>
    </g>
  );
};

/* ─────────── 网点（照片蒙太奇的“照片”） ─────────── */
/**
 * 把一张“灰度图”（函数 tone(x, y) → 0 白 … 1 黑）转成 45° 网点，返回一条 path（几千个圆合成一个元素，渲染很快）。
 * 网点半径 = 网距 × 0.5 × √tone × 1.18（让黑部的点彼此相连）
 */
export const halftone = (x0: number, y0: number, w: number, h: number, step: number, tone: (x: number, y: number) => number) => {
  const out: string[] = [];
  const cx = x0 + w / 2;
  const cy = y0 + h / 2;
  const K = Math.ceil((Math.hypot(w, h) / 2 + step) / step);
  const q = step * Math.SQRT1_2;
  for (let a = -K; a <= K; a++) {
    for (let b = -K; b <= K; b++) {
      // 45° 网格：沿 (1, 1) 与 (-1, 1) 两个方向各走 a、b 格
      const x = cx + (a - b) * q;
      const y = cy + (a + b) * q;
      if (x < x0 - step || x > x0 + w + step || y < y0 - step || y > y0 + h + step) continue;
      const t = tone(x, y);
      if (t <= 0.02) continue;
      const r = step * 0.5 * Math.sqrt(Math.min(1, t)) * 1.18;
      out.push(`M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`);
    }
  }
  return out.join('');
};

/** 斜切转场：一块多边形沿副轴扫过画面（d 帧，at 时刚好盖满） */
export const slashPoly = (p: number, back = false): Pt[] => {
  // p: 0 → 1，带子从左上（-N 方向）扫到右下
  const span = 2600;
  const c = on({x: 960, y: 540}, 0, lerp(-span, span, p) * (back ? -1 : 1));
  return bar(c, -30, 6000, span * 2);
};

/** 提示牌：右上角两行（这一章教的“招”），与左上角的署名牌对称；panel = 垫一块纸色底（背景太花时用） */
export const Tip: React.FC<{f: number; at: number; out?: number; a: string; b: string; dark?: boolean; x?: number; y?: number; left?: boolean; panel?: boolean}> = ({f, at, out = 1e9, a, b, dark, x = 1824, y = 96, left, panel}) => {
  const o = tween(f, at, 8) * (1 - tween(f, out, 6));
  if (o <= 0.001) return null;
  const p = tween(f, at, 14, 0, 1, E.out);
  const ink = dark ? C.paper : C.ink;
  const sgn = left ? 1 : -1;
  const wMax = Math.max(a.length * 30, b.length * 22) + 8;
  return (
    <g opacity={o}>
      {panel && <rect x={left ? x - 28 : x - wMax - 28} y={y - 28} width={wMax + 56} height={150} fill={C.paper} />}
      <rect x={left ? x : x - 56 * p} y={y} width={56 * p} height={8} fill={C.red} />
      <g transform={`translate(${(1 - p) * 30 * -sgn} 0)`}>
        <Txt x={x} y={y + 50} size={30} w={700} sc fill={ink} anchor={left ? 'start' : 'end'}>{a}</Txt>
        <Txt x={x} y={y + 86} size={22} w={500} sc fill={ink} o={0.72} anchor={left ? 'start' : 'end'}>{b}</Txt>
      </g>
    </g>
  );
};

/** 凸包（单调链）：把 3D 体块投影后的顶点包成一个剪影 */
export const hull = (ps: Pt[]): Pt[] => {
  const a = [...ps].sort((p, q) => p.x - q.x || p.y - q.y);
  const cr = (o: Pt, p: Pt, q: Pt) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  const lo: Pt[] = [];
  for (const p of a) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: Pt[] = [];
  for (const p of a.reverse()) {
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};

/** 绕点 (cx, cy) 的镜头：缩放 s、旋转 rot、平移 (dx, dy) */
export const cam = (cx: number, cy: number, s: number, rot = 0, dx = 0, dy = 0) =>
  `translate(${(cx + dx).toFixed(2)} ${(cy + dy).toFixed(2)}) rotate(${rot.toFixed(3)}) scale(${s.toFixed(5)}) translate(${-cx} ${-cy})`;
/** 指数缩放：从 1 推到 k 倍（推镜头“钻进去”时用，速度感均匀） */
export const zoomIn = (p: number, k: number) => Math.exp(Math.log(k) * p);
/** 以 c 为圆心、半径 r、从 a1 到 a2（度）的圆弧 */
export const arcPath = (c: Pt, r: number, a1: number, a2: number) => {
  const p1 = add(c, dir(a1), r);
  const p2 = add(c, dir(a2), r);
  return `M${p1.x.toFixed(1)} ${p1.y.toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
};
