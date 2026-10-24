/** 布局 03 · Card Stack —— Swiss 语法：Rise / Swap / Show */
import React from 'react';
import {E, POP, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';

type CSS = React.CSSProperties;
export const gro = (size: number, w = 700, ls = -0.04): CSS => ({fontFamily: FONT.display, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 0.9});
export const sc = (size: number, w = 500, ls = 0.02): CSS => ({fontFamily: FONT.sc, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1});
export const mono = (size: number, w = 500): CSS => ({fontFamily: FONT.mono, fontSize: size, fontWeight: w, lineHeight: 1});

export const vis = (f: number, at: number, out: number) => {
  const inn = spr(f, at, POP, 28);
  const leave = tween(f, out, 10, 0, 1, E.inOut);
  return Math.min(1, inn) * (1 - leave);
};

export const Show: React.FC<{f: number; at: number; out: number; dy?: number; style?: CSS; children: React.ReactNode}> = ({f, at, out, dy = 18, style, children}) => {
  const o = vis(f, at, out);
  if (o <= 0.001) return null;
  const p = spr(f, at, POP, 32);
  return (
    <div style={{position: 'absolute', opacity: o, transform: `translateY(${(1 - p) * dy}px) scale(${0.92 + 0.08 * p})`, transformOrigin: 'left center', ...style}}>
      {children}
    </div>
  );
};

export const Rise: React.FC<{f: number; at: number; out: number; text: string; d?: number; style?: CSS}> = ({f, at, out, text, d = 1, style}) => {
  const o = 1 - tween(f, out, 10, 0, 1, E.inOut);
  if (o <= 0.001 || f < at) return null;
  return (
    <span style={{display: 'inline-flex', opacity: o, overflow: 'hidden', ...style, letterSpacing: '0em'}}>
      {[...text].map((ch, k) => {
        const p = Math.min(1, spr(f, at + k * d, POP, 28));
        return (
          <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', opacity: p, transform: `translateY(${(1 - p) * 0.55}em)`}}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

export const RiseBox: React.FC<{f: number; at: number; out: number; h: number; dur?: number; style?: CSS; children: React.ReactNode}> = ({f, at, out, h, dur = 18, style, children}) => {
  const p = spr(f, at, POP, dur);
  const q = tween(f, out, 12, 0, 1, E.in);
  if (p <= 0.001 || q >= 0.999) return null;
  return (
    <div style={{position: 'absolute', overflow: 'hidden', height: h, ...style}}>
      <div style={{transform: `translateY(${(1 - Math.min(1, p)) * h - q * h}px)`}}>{children}</div>
    </div>
  );
};

export const Swap: React.FC<{f: number; at: number; h: number; a: React.ReactNode; b: React.ReactNode; style?: CSS}> = ({f, at, h, a, b, style}) => {
  const t = spr(f, at, SMOOTH, 16);
  return (
    <div style={{position: 'relative', height: h, overflow: 'hidden', ...style}}>
      {t < 1 && <div style={{position: 'absolute', inset: 0, transform: `translateY(${-t * h}px)`}}>{a}</div>}
      {t > 0 && <div style={{position: 'absolute', inset: 0, transform: `translateY(${(1 - t) * h}px)`}}>{b}</div>}
    </div>
  );
};

export const Pill: React.FC<{f: number; at: number; out: number; x: number; y: number; children: React.ReactNode; bg?: string}> = ({f, at, out, x, y, children, bg = C.red}) => {
  const s = spr(f, at, POP, 30);
  const o = Math.min(1, s * 2) * (1 - tween(f, out, 8));
  if (o <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${0.55 + 0.45 * s})`, opacity: o, background: bg, color: '#fff', ...mono(15), padding: '7px 10px', borderRadius: 4, whiteSpace: 'nowrap', zIndex: 50}}>
      {children}
    </div>
  );
};
