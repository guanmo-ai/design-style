/** 011 · Claymorphism —— 字体、按基线排字、HUD */
import React from 'react';
import {staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {E, tween} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';
import {AT, CHAPTERS} from './timeline';

type CSS = React.CSSProperties;

let fontsP: Promise<unknown> | null = null;
export const loadFonts = () => {
  if (fontsP) return fontsP;
  const L = (family: string, file: string, weight: string, stretch?: string) =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, stretch, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  fontsP = Promise.all([
    L('Fredoka', 'Fredoka.ttf', '300 700', '75% 125%'),
    L('JetBrains Mono', 'JetBrainsMono.ttf', '100 800'),
    L('Noto Sans SC', 'NotoSansSC-Regular.otf', '400'),
    L('Noto Sans SC', 'NotoSansSC-Medium.otf', '500'),
    L('Noto Sans SC', 'NotoSansSC-Bold.otf', '700'),
    L('Noto Sans SC', 'NotoSansSC-Black.otf', '900'),
  ]);
  return fontsP;
};

const METRIC = {display: [1.0, 0.32], mono: [1.05, 0.32], sc: [1.16, 0.288]} as const;
type Family = keyof typeof METRIC;
export const baseOf = (k: Family, size: number, lh = size) => (lh - (METRIC[k][0] + METRIC[k][1]) * size) / 2 + METRIC[k][0] * size;

export const disp = (size: number, w = 700, ls = -0.03): CSS => ({
  fontFamily: FONT.display,
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
export const mono = (size: number, w = 500, ls = 0.06): CSS => ({
  fontFamily: FONT.mono,
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
  const o = tween(f, at, 18, 0, 1, E.soft) * (1 - tween(f, out, 14, 0, 1, E.soft));
  if (o <= 0.001) return null;
  const p = 1 - tween(f, at, 26, 0, 1, E.soft);
  return <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translate(${p * dx}px, ${p * dy}px)`, ...style}}>{children}</div>;
};

export const Hud: React.FC<{f: number}> = ({f}) => {
  const hide = tween(f, 0, 1) * (1 - tween(f, 88, 16)) + tween(f, AT.end - 8, 12);
  const o = (1 - Math.min(1, hide)) * tween(f, 88, 16, 0, 1, E.out);
  if (o <= 0.01) return null;
  let k = 0;
  CHAPTERS.forEach(([, , at], j) => {
    if (f >= at) k = j;
  });
  const p = tween(f, CHAPTERS[k][2], 14, 0, 1, E.out);
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 36, height: 36, opacity: o, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', pointerEvents: 'none'}}>
      <div>
        <span style={{...disp(22, 600, -0.02), color: C.ink}}>Claymorphism</span>
        <span style={{...sc(16, 500, 0.08), color: C.muted, marginLeft: 12}}>粘土拟态</span>
      </div>
      <div style={{opacity: 0.3 + 0.7 * p, transform: `translateY(${(1 - p) * 10}px)`}}>
        <span style={{...mono(14, 600, 0.1), color: C.muted, marginRight: 12}}>{`0${k + 1} / 0${CHAPTERS.length}`}</span>
        <span style={{...sc(16, 700, 0.06), color: C.ink}}>{CHAPTERS[k][0]}</span>
      </div>
    </div>
  );
};
