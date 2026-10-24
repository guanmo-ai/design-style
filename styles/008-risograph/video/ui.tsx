/** 008 · Risograph —— 栏、按基线定位的文字、字体 */
import React from 'react';
import {staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {E, tween} from '../../../src/lib/anim';
import {FONT, GRID} from '../tokens';

type CSS = React.CSSProperties;
const STEP = GRID.module + GRID.gutter;
export const cx = (i: number) => GRID.mx + i * STEP;
export const cw = (n: number) => n * GRID.module + (n - 1) * GRID.gutter;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const c01 = (t: number) => Math.min(1, Math.max(0, t));

let fontsP: Promise<unknown> | null = null;
export const loadFonts = () => {
  if (fontsP) return fontsP;
  const L = (family: string, file: string, weight: string, stretch?: string) =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, stretch, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  fontsP = Promise.all([
    L('Archivo', 'Archivo.ttf', '100 900', '62% 125%'),
    L('Space Mono', 'SpaceMono-Regular.ttf', '400'),
    L('Space Mono', 'SpaceMono-Bold.ttf', '700'),
    L('Noto Sans SC', 'NotoSansSC-Regular.otf', '400'),
    L('Noto Sans SC', 'NotoSansSC-Medium.otf', '500'),
    L('Noto Sans SC', 'NotoSansSC-Bold.otf', '700'),
    L('Noto Sans SC', 'NotoSansSC-Black.otf', '900'),
  ]);
  return fontsP;
};

// 字体度量（hhea，em）：用来把基线放到指定的 y 上
const METRIC = {display: [0.878, 0.21], mono: [1.12, 0.361], sc: [1.16, 0.288]} as const;
type Family = keyof typeof METRIC;
export const baseOf = (k: Family, size: number, lh = size) => (lh - (METRIC[k][0] + METRIC[k][1]) * size) / 2 + METRIC[k][0] * size;
export const CAP = 0.688; // Archivo 大写高度
export const CJK = 0.86; // 思源黑体字面顶部距基线

/** Archivo：wght 字重、wdth 字宽（62—125） */
export const disp = (size: number, wght = 900, wdth = 100, ls = -0.02): CSS => ({
  fontFamily: FONT.display,
  fontSize: size,
  fontWeight: wght,
  fontStretch: `${wdth}%`,
  fontVariationSettings: `'wght' ${wght}, 'wdth' ${wdth}`,
  letterSpacing: `${ls}em`,
  fontKerning: 'none',
  whiteSpace: 'nowrap',
});
export const mono = (size: number, w = 400, ls = 0.02): CSS => ({fontFamily: FONT.mono, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, whiteSpace: 'nowrap'});
export const sc = (size: number, w = 900, ls = 0.02): CSS => ({fontFamily: FONT.sc, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, whiteSpace: 'nowrap'});

/** 文字：x 为左边（align=center 时为中线，right 时为右边），y 为第一行基线 */
export const T: React.FC<{x: number; y: number; k?: Family; size: number; lh?: number; align?: 'left' | 'center' | 'right'; style?: CSS; children: React.ReactNode}> = ({
  x,
  y,
  k = 'display',
  size,
  lh,
  align = 'left',
  style,
  children,
}) => {
  const L = lh ?? size;
  const W = 3000;
  const left = align === 'left' ? x : align === 'center' ? x - W / 2 : x - W;
  return (
    <div style={{position: 'absolute', left, width: align === 'left' ? undefined : W, textAlign: align, top: y - baseOf(k, size, L), lineHeight: `${L}px`, ...style}}>
      {children}
    </div>
  );
};

/** Archivo 900 / 100% 的字宽（em，来自字体文件的 hmtx；关掉字距调整后，浏览器排出来的位置和这里算的一样） */
export const ADV: Record<string, number> = {R: 0.778, I: 0.369, S: 0.722, O: 0.833, G: 0.833, A: 0.778, P: 0.722, H: 0.833};
export const LSB: Record<string, number> = {R: 0.074, I: 0.074, S: 0.043, O: 0.045, G: 0.045, A: 0.01, P: 0.074, H: 0.074};
/** 一行字每个字母的左边位置（未加 x0） */
export const advances = (word: string, size: number, ls: number) => {
  const xs: number[] = [];
  let x = 0;
  for (const ch of word) {
    xs.push(x);
    x += (ADV[ch] + ls) * size;
  }
  return {xs, w: x - ls * size};
};

/** 出现：从下方 dy 处滑到位，退场淡出 */
export const Show: React.FC<{f: number; at: number; out?: number; dy?: number; dx?: number; style?: CSS; children: React.ReactNode}> = ({f, at, out = 1e9, dy = 18, dx = 0, style, children}) => {
  const o = tween(f, at, 14, 0, 1, E.out) * (1 - tween(f, out, 8, 0, 1, E.inOut));
  if (o <= 0.001) return null;
  const p = 1 - tween(f, at, 22, 0, 1, E.out);
  return <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translate(${p * dx}px, ${p * dy}px)`, ...style}}>{children}</div>;
};
