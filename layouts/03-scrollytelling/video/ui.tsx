/** 页面里的通用零件：section、sticky 舞台、逐字点亮的文字（Apple 式 text scrub）、渐变字、光晕 */
import React from 'react';
import {FONT, GRAD, gradCss} from '../tokens';
import {Sec, TRIGGER, VH, W, c01, lerp, stickyY} from './page';

/** 一个 section：页面里一块绝对定位的长条，坐标系 = section 内部 y。保留 3D（X 光视角要用） */
export const Section: React.FC<{sec: Sec; children: React.ReactNode; bg?: string}> = ({sec, children, bg}) => (
  <div style={{position: 'absolute', left: 0, top: sec.top, width: W, height: sec.h, background: bg, transformStyle: 'preserve-3d'}}>
    {children}
  </div>
);

/** sticky 舞台：y = clamp(scrollY, section 顶, section 底 − 一屏)，和浏览器同一条公式 */
export const Stage: React.FC<{sec: Sec; s: number; children: React.ReactNode; style?: React.CSSProperties; clip?: boolean}> = ({
  sec,
  s,
  children,
  style,
  clip = true,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: stickyY(sec, s) - sec.top,
      width: W,
      height: VH,
      overflow: clip ? 'hidden' : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Abs: React.FC<{x?: number; y?: number; w?: number; h?: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({
  x = 0,
  y = 0,
  w,
  h,
  children,
  style,
}) => <div style={{position: 'absolute', left: x, top: y, width: w, height: h, ...style}}>{children}</div>;

/** 颜色插值 */
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], c01(t)))).join(',')})`;
};
/** 渐变上的某一点（0–1） */
export const gradAt = (t: number) => {
  const x = c01(t) * (GRAD.length - 1);
  const i = Math.min(GRAD.length - 2, Math.floor(x));
  return mix(GRAD[i], GRAD[i + 1], x - i);
};

export const DIM = '#2C2C2F';
export const WHITE = '#F5F5F7';
export const GRAY = '#86868B';

/**
 * 逐字点亮：一行字越过触发线时，从左到右一个字一个字变亮（倒着滚就倒着暗回去）。
 * y = 这一行中心在页面里的 y；s = scrollY。
 */
export const Scrub: React.FC<{
  text: string;
  y: number;
  s: number;
  size: number;
  /** 点亮这一行需要滚过的距离 */
  range?: number;
  /** 从哪一个字开始用渐变色 */
  gradFrom?: number;
  font?: string;
  weight?: number;
  style?: React.CSSProperties;
  dim?: string;
  lit?: string;
}> = ({text, y, s, size, range = 220, gradFrom, font = FONT.sc, weight = 700, style, dim = DIM, lit = WHITE}) => {
  const chars = [...text];
  const p = (s + TRIGGER - (y - range * 0.5)) / range; // 0 → 1：这一行从线下滑到线上
  const n = chars.length;
  return (
    <div style={{fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.08, letterSpacing: '-0.02em', whiteSpace: 'nowrap', ...style}}>
      {chars.map((ch, i) => {
        const t = c01(p * (n + 2) - i);
        const on = gradFrom !== undefined && i >= gradFrom;
        const col = on ? mix(dim, rgbHex(gradAt((i - gradFrom!) / Math.max(1, n - 1 - gradFrom!))), t) : mix(dim, lit, t);
        return (
          <span key={i} style={{color: col}}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};
const rgbHex = (rgb: string) => {
  const m = rgb.match(/\d+/g)!.map(Number);
  return '#' + m.map((v) => v.toString(16).padStart(2, '0')).join('');
};

/** 渐变字 */
export const Grad: React.FC<{children: React.ReactNode; deg?: number; style?: React.CSSProperties; bg?: string}> = ({children, deg = 90, style, bg}) => (
  <span
    style={{
      backgroundImage: bg ?? gradCss(deg),
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
      ...style,
    }}
  >
    {children}
  </span>
);

/** 一团柔光（径向渐变，不用 blur 滤镜，便宜） */
export const Glow: React.FC<{x: number; y: number; r: number; color: string; o?: number; sx?: number}> = ({x, y, r, color, o = 1, sx = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - r * sx,
      top: y - r,
      width: 2 * r * sx,
      height: 2 * r,
      borderRadius: '50%',
      opacity: o,
      background: `radial-gradient(closest-side, ${color} 0%, ${color.replace(/[\d.]+\)$/, '0.35)')} 40%, rgba(0,0,0,0) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/** 小标题：01 — 定义 */
export const Eyebrow: React.FC<{n?: string; children: React.ReactNode; style?: React.CSSProperties; color?: string}> = ({n, children, style, color = GRAY}) => (
  <div style={{fontFamily: FONT.sc, fontWeight: 600, fontSize: 28, color, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 18, ...style}}>
    {n && <span style={{fontFamily: FONT.mono, fontWeight: 500, fontSize: 24, color: WHITE, opacity: 0.9}}>{n}</span>}
    {n && <span style={{width: 36, height: 1.5, background: color, opacity: 0.6}} />}
    <span>{children}</span>
  </div>
);

/** 一行字从遮罩里升起来（帧驱动，用在“页面加载”的那一下） */
export const Rise: React.FC<{t: number; children: React.ReactNode; dist?: number; style?: React.CSSProperties}> = ({t, children, dist = 0.7, style}) => (
  <span style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em', ...style}}>
    <span style={{display: 'inline-block', transform: `translateY(${(1 - t) * dist * 100}%)`, opacity: c01(t * 1.6)}}>{children}</span>
  </span>
);

/** 触发线：一条极细的发光横线 */
export const Hairline: React.FC<{y: number; o: number; draw?: number; color?: string; w?: number; x?: number}> = ({y, o, draw = 1, color = '255,255,255', w = W, x = 0}) => (
  <div
    style={{
      position: 'absolute',
      left: x + (w * (1 - draw)) / 2,
      top: y - 0.5,
      width: w * draw,
      height: 1,
      opacity: o,
      background: `linear-gradient(90deg, rgba(${color},0) 0%, rgba(${color},0.55) 30%, rgba(${color},0.55) 70%, rgba(${color},0) 100%)`,
    }}
  />
);
