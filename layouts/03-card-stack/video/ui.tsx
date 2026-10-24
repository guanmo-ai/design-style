/** 布局 03 · Card Stack —— 排版工具 */
import React from 'react';
import {E, POP, spr, tween} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';

type CSS = React.CSSProperties;
export const disp = (size: number, w = 600, ls = -0.04): CSS => ({fontFamily: FONT.display, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1});
export const sc = (size: number, w = 500, ls = 0.02): CSS => ({fontFamily: FONT.sc, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1});
export const mono = (size: number, w = 500): CSS => ({fontFamily: FONT.mono, fontSize: size, fontWeight: w, lineHeight: 1});
export const ui = (size: number, w = 500): CSS => ({fontFamily: FONT.text, fontSize: size, fontWeight: w, lineHeight: 1});
export const gradText: CSS = {backgroundImage: 'linear-gradient(90deg,#FF8A3D,#FF2D6F,#A63DFF)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent'};

export const vis = (f: number, at: number, out: number) => tween(f, at, 18, 0, 1, E.out) * (1 - tween(f, out, 10, 0, 1, E.inOut));

export const Show: React.FC<{f: number; at: number; out: number; dy?: number; style?: CSS; children: React.ReactNode}> = ({f, at, out, dy = 16, style, children}) => {
  const o = vis(f, at, out);
  if (o <= 0.001) return null;
  const y = (1 - tween(f, at, 26, 0, 1, E.out)) * dy;
  return <div style={{position: 'absolute', opacity: o, transform: `translateY(${y}px)`, ...style}}>{children}</div>;
};

export const Rise: React.FC<{f: number; at: number; out: number; text: string; d?: number; style?: CSS}> = ({f, at, out, text, d = 2, style}) => {
  const o = 1 - tween(f, out, 10, 0, 1, E.inOut);
  if (o <= 0.001 || f < at) return null;
  return (
    <span style={{display: 'inline-flex', opacity: o, ...style}}>
      {[...text].map((ch, k) => {
        const t = tween(f, at + k * d, 24, 0, 1, E.out);
        return (
          <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', opacity: Math.min(1, t * 1.7), transform: `translateY(${(1 - t) * 0.38}em)`}}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

export const Kicker: React.FC<{children: React.ReactNode; color?: string; dot?: string}> = ({children, color = C.ink2, dot = C.accent}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
    <span style={{width: 8, height: 8, borderRadius: 4, background: dot}} />
    <span style={{...sc(22, 500, 0.08), color}}>{children}</span>
  </div>
);

export const count = (f: number, at: number, dur: number, target: number, digits = 0) => {
  const v = target * tween(f, at, dur, 0, 1, E.out);
  return v.toLocaleString('en-US', {minimumFractionDigits: digits, maximumFractionDigits: digits});
};

export const Pill: React.FC<{f: number; at: number; out: number; x: number; y: number; children: React.ReactNode; bg?: string}> = ({f, at, out, x, y, children, bg = C.pink}) => {
  const s = spr(f, at, POP, 30);
  const o = Math.min(1, s * 2) * (1 - tween(f, out, 8));
  if (o <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * s})`, opacity: o, background: bg, color: '#fff', ...mono(16), padding: '7px 10px', borderRadius: 8, whiteSpace: 'nowrap', zIndex: 50}}>
      {children}
    </div>
  );
};
