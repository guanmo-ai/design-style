/** 布局 02 · Masonry —— 排版工具与小部件 */
import React from 'react';
import {E, POP, spr, tween} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';

type CSS = React.CSSProperties;
export const serif = (size: number, ls = -0.02, italic = false): CSS => ({fontFamily: FONT.serif, fontSize: size, fontWeight: 400, fontStyle: italic ? 'italic' : 'normal', letterSpacing: `${ls}em`, lineHeight: 1});
export const disp = (size: number, w = 600, ls = -0.03): CSS => ({fontFamily: FONT.display, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1});
export const sc = (size: number, w = 500, ls = 0.02): CSS => ({fontFamily: FONT.sc, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1});
export const mono = (size: number, w = 500): CSS => ({fontFamily: FONT.mono, fontSize: size, fontWeight: w, lineHeight: 1});
export const ui = (size: number, w = 500): CSS => ({fontFamily: FONT.text, fontSize: size, fontWeight: w, lineHeight: 1});

/** 内容的出现 / 消失：上移 + 淡入，退场只淡出（卡片马上要动，不抢戏） */
export const vis = (f: number, at: number, out: number) => tween(f, at, 20, 0, 1, E.out) * (1 - tween(f, out, 8, 0, 1, E.inOut));
export const Show: React.FC<{f: number; at: number; out: number; dy?: number; style?: CSS; children: React.ReactNode}> = ({f, at, out, dy = 18, style, children}) => {
  const o = vis(f, at, out);
  if (o <= 0.001) return null;
  const y = (1 - tween(f, at, 28, 0, 1, E.out)) * dy;
  return <div style={{position: 'absolute', opacity: o, transform: `translateY(${y}px)`, ...style}}>{children}</div>;
};

/** 逐字出现（标题用）：每个字错开 d 帧，从下往上 */
export const Rise: React.FC<{f: number; at: number; out: number; text: string; d?: number; style?: CSS}> = ({f, at, out, text, d = 2, style}) => {
  const o = 1 - tween(f, out, 8, 0, 1, E.inOut);
  if (o <= 0.001 || f < at) return null;
  return (
    <span style={{display: 'inline-flex', opacity: o, ...style}}>
      {[...text].map((ch, k) => {
        const t = tween(f, at + k * d, 26, 0, 1, E.out);
        return (
          <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', opacity: Math.min(1, t * 1.6), transform: `translateY(${(1 - t) * 0.42}em)`}}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/** 标注胶囊（Figma 式的测量标签） */
export const Pill: React.FC<{f: number; at: number; out: number; x: number; y: number; color?: string; children: React.ReactNode}> = ({f, at, out, x, y, color = C.accent, children}) => {
  const s = spr(f, at, POP, 30);
  const o = Math.min(1, s * 2) * (1 - tween(f, out, 8));
  if (o <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * s})`, opacity: o, background: color, color: '#fff', ...mono(19), padding: '7px 10px 8px', borderRadius: 8, whiteSpace: 'nowrap', zIndex: 40}}>
      {children}
    </div>
  );
};

/** 小标签（章节标题上方的那一行） */
export const Kicker: React.FC<{children: React.ReactNode; color: string; dot?: string}> = ({children, color, dot = C.accent}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
    <span style={{width: 10, height: 10, borderRadius: 5, background: dot}} />
    <span style={{...sc(24, 500, 0.08), color}}>{children}</span>
  </div>
);
