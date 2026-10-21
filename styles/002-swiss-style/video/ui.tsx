/** 002 · Swiss Style —— 网格、排版工具 */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C, FONT, GRID} from '../tokens';

type CSS = React.CSSProperties;
const STEP = GRID.module + GRID.gutter;
/** 第 i 栏的左边 / n 栏的宽度；第 j 行的上边 / n 行的高度 */
export const cx = (i: number) => GRID.mx + i * STEP;
export const cw = (n: number) => n * GRID.module + (n - 1) * GRID.gutter;
export const ry = (j: number) => GRID.my + j * STEP;
export const rh = cw;

// 字体度量（hhea）：用于把基线放到网格上
const METRIC = {grotesk: [1.125, 0.307], gr400: [1.148, 0.284], condensed: [1.105, 0.307], sc: [1.16, 0.288]} as const;
type Family = keyof typeof METRIC;
const family = (k: Family) => (k === 'gr400' ? FONT.grotesk : FONT[k]);
/** 行高为 lh（像素）时，第一行基线距离文字框顶部的距离 */
export const baseOf = (k: Family, size: number, lh = size) => (lh - (METRIC[k][0] + METRIC[k][1]) * size) / 2 + METRIC[k][0] * size;

export const gr = (size: number, w = 700, ls = -0.02): CSS => ({fontFamily: FONT.grotesk, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, whiteSpace: 'nowrap'});
export const sc = (size: number, w = 700, ls = 0.02): CSS => ({fontFamily: FONT.sc, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, whiteSpace: 'nowrap'});

/** 文字：x 为左边，y 为第一行基线（落在网格 / 基线上） */
export const T: React.FC<{x: number; y: number; k?: Family; size: number; lh?: number; style?: CSS; children: React.ReactNode}> = ({x, y, k = 'grotesk', size, lh, style, children}) => {
  const L = lh ?? size;
  return (
    <div style={{position: 'absolute', left: x, top: y - baseOf(k, size, L), fontFamily: family(k), fontSize: size, lineHeight: `${L}px`, ...style}}>
      {children}
    </div>
  );
};

/** 出现：从下方 dy 处滑到位（快进慢停），退场淡出 */
export const vis = (f: number, at: number, out = 1e9) => tween(f, at, 14, 0, 1, E.out) * (1 - tween(f, out, 8, 0, 1, E.inOut));
export const Show: React.FC<{f: number; at: number; out?: number; dy?: number; dx?: number; style?: CSS; children: React.ReactNode}> = ({f, at, out = 1e9, dy = 24, dx = 0, style, children}) => {
  const o = vis(f, at, out);
  if (o <= 0.001) return null;
  const p = 1 - tween(f, at, 22, 0, 1, E.out);
  return <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translate(${p * dx}px, ${p * dy}px)`, ...style}}>{children}</div>;
};

/** 12 × 6 模块网格：栏线一列列刷下来 */
export const GridLines: React.FC<{f: number; at: number; out?: number; color?: string; rows?: boolean}> = ({f, at, out = 1e9, color = C.rule, rows = true}) => {
  const fade = 1 - tween(f, out, 12, 0, 1, E.inOut);
  if (fade <= 0.001) return null;
  const H = rh(GRID.rows);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: fade}}>
      {Array.from({length: GRID.cols}, (_, i) => {
        const p = tween(f, at + i * 2, 20, 0, 1, E.out);
        return [0, GRID.module].map((dx) => (
          <div key={`${i}-${dx}`} style={{position: 'absolute', left: cx(i) + dx - (dx ? 1 : 0), top: GRID.my, width: 1, height: H * p, background: color}} />
        ));
      })}
      {rows &&
        Array.from({length: GRID.rows}, (_, j) => {
          const p = tween(f, at + 10 + j * 2, 24, 0, 1, E.out);
          return [0, GRID.module].map((dy) => (
            <div key={`${j}-${dy}`} style={{position: 'absolute', left: GRID.mx, top: ry(j) + dy - (dy ? 1 : 0), width: cw(GRID.cols) * p, height: 1, background: color}} />
          ));
        })}
    </div>
  );
};
