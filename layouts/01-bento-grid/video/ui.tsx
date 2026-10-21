/** 布局 01 · Bento Grid —— 排版工具与小部件 */
import React from 'react';
import {E, POP, SNAP, spr, tween} from '../../../src/lib/anim';
import {ACCENT, FONT} from '../tokens';

type CSS = React.CSSProperties;
export const disp = (size: number, w = 600, ls = -0.03): CSS => ({fontFamily: FONT.display, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1});
export const sc = (size: number, w = 500, ls = 0.02): CSS => ({fontFamily: FONT.sc, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1});
export const mono = (size: number, w = 500): CSS => ({fontFamily: FONT.mono, fontSize: size, fontWeight: w, lineHeight: 1});
export const gradText: CSS = {backgroundImage: ACCENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent'};

/** 内容的出现 / 消失：上移 + 淡入，退场只淡出（卡片马上要动，不抢戏） */
export const vis = (f: number, at: number, out: number) => tween(f, at, 20, 0, 1, E.out) * (1 - tween(f, out, 8, 0, 1, E.inOut));
export const Show: React.FC<{f: number; at: number; out: number; dy?: number; style?: CSS; children: React.ReactNode}> = ({f, at, out, dy = 18, style, children}) => {
  const o = vis(f, at, out);
  if (o <= 0.001) return null;
  const y = (1 - tween(f, at, 28, 0, 1, E.out)) * dy;
  return <div style={{position: 'absolute', opacity: o, transform: `translateY(${y}px)`, ...style}}>{children}</div>;
};

/** 数字滚动 */
export const count = (f: number, at: number, dur: number, target: number, digits = 0) => {
  const v = target * tween(f, at, dur, 0, 1, E.out);
  return v.toLocaleString('en-US', {minimumFractionDigits: digits, maximumFractionDigits: digits});
};

/** 标注胶囊（Figma 式的测量标签） */
export const Pill: React.FC<{f: number; at: number; out: number; x: number; y: number; children: React.ReactNode}> = ({f, at, out, x, y, children}) => {
  const s = spr(f, at, POP, 30);
  const o = Math.min(1, s * 2) * (1 - tween(f, out, 8));
  if (o <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * s})`, opacity: o, background: '#FF2D6F', color: '#fff', ...mono(20), padding: '7px 11px 8px', borderRadius: 8, whiteSpace: 'nowrap'}}>
      {children}
    </div>
  );
};

export const pop = (f: number, at: number) => spr(f, at, SNAP, 30);
