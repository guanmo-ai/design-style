/** 012 · Isometric —— 字体、按基线定位的文字、HUD 零件 */
import React from 'react';
import {staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {E, tween} from '../../../src/lib/anim';
import {C, FONT, GRID} from '../tokens';

type CSS = React.CSSProperties;
const STEP = GRID.module + GRID.gutter;
export const cx = (i: number) => GRID.mx + i * STEP;
export const cw = (n: number) => n * GRID.module + (n - 1) * GRID.gutter;
export const c01 = (t: number) => Math.min(1, Math.max(0, t));

let fontsP: Promise<unknown> | null = null;
export const loadFonts = () => {
  if (fontsP) return fontsP;
  const L = (family: string, file: string, weight: string) =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  fontsP = Promise.all([
    L('Inter Display', 'InterDisplay-Medium.ttf', '500'),
    L('Inter Display', 'InterDisplay-SemiBold.ttf', '600'),
    L('Inter Display', 'InterDisplay-Bold.ttf', '700'),
    L('Inter', 'Inter-Regular.ttf', '400'),
    L('Inter', 'Inter-Medium.ttf', '500'),
    L('Geist Mono', 'GeistMono-Regular.ttf', '400'),
    L('Geist Mono', 'GeistMono-Medium.ttf', '500'),
    L('Noto Sans SC', 'NotoSansSC-Regular.otf', '400'),
    L('Noto Sans SC', 'NotoSansSC-Medium.otf', '500'),
    L('Noto Sans SC', 'NotoSansSC-Bold.otf', '700'),
    L('Noto Sans SC', 'NotoSansSC-Black.otf', '900'),
  ]);
  return fontsP;
};

const METRIC = {display: [0.97, 0.24], mono: [1.05, 0.32], sc: [1.16, 0.288]} as const;
type Family = keyof typeof METRIC;
export const baseOf = (k: Family, size: number, lh = size) => (lh - (METRIC[k][0] + METRIC[k][1]) * size) / 2 + METRIC[k][0] * size;

export const disp = (size: number, w = 700, ls = -0.04): CSS => ({
  fontFamily: FONT.display,
  fontSize: size,
  fontWeight: w,
  letterSpacing: `${ls}em`,
  whiteSpace: 'nowrap',
});
export const mono = (size: number, w = 500, ls = 0.08): CSS => ({
  fontFamily: FONT.mono,
  fontSize: size,
  fontWeight: w,
  letterSpacing: `${ls}em`,
  whiteSpace: 'nowrap',
});
export const sc = (size: number, w = 700, ls = 0.02): CSS => ({
  fontFamily: FONT.sc,
  fontSize: size,
  fontWeight: w,
  letterSpacing: `${ls}em`,
  whiteSpace: 'nowrap',
});

export const T: React.FC<{
  x: number;
  y: number;
  k?: Family;
  size: number;
  lh?: number;
  align?: 'left' | 'center' | 'right';
  style?: CSS;
  children: React.ReactNode;
}> = ({x, y, k = 'display', size, lh, align = 'left', style, children}) => {
  const L = lh ?? size;
  const W = 2800;
  const left = align === 'left' ? x : align === 'center' ? x - W / 2 : x - W;
  return (
    <div style={{position: 'absolute', left, width: align === 'left' ? undefined : W, textAlign: align, top: y - baseOf(k, size, L), lineHeight: `${L}px`, ...style}}>
      {children}
    </div>
  );
};

export const Show: React.FC<{f: number; at: number; out?: number; dy?: number; dx?: number; style?: CSS; children: React.ReactNode}> = ({
  f,
  at,
  out = 1e9,
  dy = 16,
  dx = 0,
  style,
  children,
}) => {
  const o = tween(f, at, 16, 0, 1, E.soft) * (1 - tween(f, out, 14, 0, 1, E.soft));
  if (o <= 0.001) return null;
  const p = 1 - tween(f, at, 24, 0, 1, E.soft);
  return <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translate(${p * dx}px, ${p * dy}px)`, ...style}}>{children}</div>;
};

export const Chip: React.FC<{x: number; y: number; color: string; label: string; sub?: string}> = ({x, y, color, label, sub}) => (
  <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 10}}>
    <div style={{width: 10, height: 10, background: color, transform: 'rotate(45deg)'}} />
    <span style={{...mono(13, 500, 0.12), color: C.ink}}>{label}</span>
    {sub && <span style={{...sc(14, 500, 0.04), color: C.muted}}>{sub}</span>}
  </div>
);
