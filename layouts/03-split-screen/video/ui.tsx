/** 布局 03 · Split Screen —— 字体、章节页（带视差）、遮罩出字、光标、数字滚轮、小标签 */
import React from 'react';
import {Easing, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {clamp, tween, E} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';

type CSS = React.CSSProperties;

let fontsP: Promise<unknown> | null = null;
export const loadFonts = () => {
  if (fontsP) return fontsP;
  const L = (family: string, file: string, weight: string, stretch?: string) =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, stretch, format: file.endsWith('.otf') ? 'opentype' : file.endsWith('.woff2') ? 'woff2' : 'truetype'});
  fontsP = Promise.all([
    L('Archivo', 'Archivo.ttf', '100 900', '62% 125%'),
    L('Space Mono', 'SpaceMono-Regular.ttf', '400'),
    L('Space Mono', 'SpaceMono-Bold.ttf', '700'),
    L('Noto Sans SC', 'NotoSansSC-Regular.otf', '400'),
    L('Noto Sans SC', 'NotoSansSC-Medium.otf', '500'),
    L('Noto Sans SC', 'NotoSansSC-Bold.otf', '700'),
    L('Noto Sans SC', 'NotoSansSC-Black.otf', '900'),
    // 各期风格的字体（每个半边穿一种风格）
    L('Jost', 'Jost.ttf', '100 900'), // 001 包豪斯
    L('TeX Gyre Heros', 'TeXGyreHeros-Regular.otf', '400'), // 002 瑞士
    L('TeX Gyre Heros', 'TeXGyreHeros-Bold.otf', '700'),
    L('Oswald', 'Oswald.ttf', '200 700'), // 003 构成主义
    L('Fredoka', 'Fredoka.ttf', '300 700', '75% 125%'), // 004 孟菲斯
    L('Bangers', 'Bangers-Regular.ttf', '400'), // 005 波普
    L('JetBrains Mono', 'JetBrainsMono.ttf', '100 800'),
    L('Space Grotesk', 'SpaceGrotesk.ttf', '300 700'), // 009 新粗野
    L('Tinos', 'Tinos-400.woff2', '400'),
    L('Tinos', 'Tinos-700.woff2', '700'),
  ]);
  return fontsP;
};

// ───────── 字 ─────────
/** Archivo：wght 字重、wdth 字宽（62—125） */
export const disp = (size: number, wdth = 100, ls = -0.03, wght = 900): CSS => ({
  fontFamily: FONT.display,
  fontSize: size,
  fontWeight: wght,
  fontStretch: `${wdth}%`,
  fontVariationSettings: `'wght' ${wght}, 'wdth' ${wdth}`,
  letterSpacing: `${ls}em`,
  lineHeight: 1,
});
export const mono = (size: number, w = 400, ls = 0): CSS => ({fontFamily: FONT.mono, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1.3, whiteSpace: 'pre'});
export const sc = (size: number, w = 700, ls = 0): CSS => ({fontFamily: FONT.sc, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1.2});

// ───────── 数学 ─────────
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rad = (deg: number) => (deg * Math.PI) / 180;
export const hexToRgb = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
export const mix = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};
export const rgba = (h: string, a: number) => {
  const [r, g, b] = hexToRgb(h);
  return `rgba(${r},${g},${b},${a})`;
};

// ───────── 缓动 ─────────
/** 传送带：起步稍慢、中段极快、落定干脆（配合运动模糊） */
export const BELT = Easing.bezier(0.72, 0, 0.14, 1);
/** 中线滑动：有分量，落定不过冲 */
export const SLIDE = Easing.bezier(0.6, 0, 0.12, 1);
/** 拉链：先猛冲再长长地落定 */
export const ZIP = Easing.bezier(0.05, 0.9, 0.12, 1);
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const appear = (f: number, at: number, d = 10) => tween(f, at, d, 0, 1, E.out);
/** 轻微过冲的弹出（0 → 1，过冲约 6%） */
export const popEase = Easing.bezier(0.34, 1.45, 0.5, 1);

// ───────── 章节页 ─────────
export type Side = 'L' | 'R';
export type ChProps = {
  f: number; // 本章局部帧
  side: Side; // 这份内容属于哪一半（每半各画一遍整幅，再被中线裁开）
  X: number; // 中线 x（θ = 0 时有意义）
  theta: number; // 中线旋转角（弧度，0 = 竖线，π/2 = 横线；左半 → 上半）
  enter: number; // 传送带送进来的进度 0 → 1（静止时 1）
  exit: number; // 送出去的进度 0 → 1（静止时 0）
  dir: [number, number]; // 本半边传送带的行进方向（单位向量）
};

const PAR = 90;
/** 章节页：整幅底色 + 一层内容。内容比页面晚到 / 早走 PAR 像素，画面有层次 */
export const Page: React.FC<{p: ChProps; bg: string; under?: React.ReactNode; children?: React.ReactNode; style?: CSS}> = ({p, bg, under, children, style}) => {
  const k = (-(1 - p.enter) + p.exit) * PAR;
  return (
    <div style={{position: 'absolute', inset: 0, background: bg, overflow: 'hidden', ...style}}>
      {under}
      <div style={{position: 'absolute', inset: 0, transform: `translate(${p.dir[0] * k}px, ${p.dir[1] * k}px)`}}>{children}</div>
    </div>
  );
};

/** 遮罩出字：内容从遮罩底边升起（delay 以帧计），上下各留 pad 防止裁掉字的上下沿 */
export const Rise: React.FC<{f: number; at: number; d?: number; pad?: number; from?: number; children: React.ReactNode; style?: CSS; ease?: (t: number) => number}> = ({f, at, d = 22, pad = 18, from = 1, children, style, ease = EXPO}) => {
  const t = tween(f, at, d, 0, 1, ease);
  return (
    <div style={{overflow: 'hidden', padding: `${pad}px 0`, margin: `${-pad}px 0`, ...style}}>
      <div style={{transform: `translateY(${(1 - t) * from * 110}%)`, opacity: t > 0 ? 1 : 0}}>{children}</div>
    </div>
  );
};

// ───────── 小零件 ─────────
/** 规则角标：RULE 0N · 标题（章节自己画，跟着传送带走） */
export const RuleTag: React.FC<{f: number; n: number; title: string; fg: string; sub: string; at?: number}> = ({f, n, title, fg, sub, at = 6}) => (
  <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
    <Rise f={f} at={at} d={16} pad={8}>
      <span style={{...mono(22, 700, 0.14), color: sub}}>{`RULE 0${n}`}</span>
    </Rise>
    <Rise f={f} at={at + 3} d={16} pad={8}>
      <span style={{...sc(30, 900), color: fg}}>{title}</span>
    </Rise>
  </div>
);

/** 光标（箭头）：(x, y) 是箭头尖；press 0 → 1 缩一下，ring 0 → 1 扩出点击圈 */
export const Cursor: React.FC<{x: number; y: number; fill?: string; stroke?: string; press?: number; ring?: number; ringColor?: string; scale?: number}> = ({x, y, fill = C.paper, stroke = C.ink, press = 0, ring = 0, ringColor = C.paper, scale = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, zIndex: 50}}>
    {ring > 0 && ring < 1 && <div style={{position: 'absolute', left: -40 * ring - 8, top: -40 * ring - 8, width: 80 * ring + 16, height: 80 * ring + 16, borderRadius: '50%', border: `3px solid ${ringColor}`, opacity: 1 - ring}} />}
    <svg width={44} height={56} viewBox="0 0 22 28" style={{position: 'absolute', left: 0, top: 0, transform: `scale(${scale * (1 - 0.12 * press)})`, transformOrigin: '2px 2px', overflow: 'visible'}}>
      <path d="M2 2 L2 22 L7.4 17.2 L11 26 L14.6 24.5 L11 15.8 L18.4 15.8 Z" fill={fill} stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  </div>
);

/** 数字滚轮：一位数字的竖向滚轮，v 可以是小数（滚动中），h 是单个字的行高 */
export const Wheel: React.FC<{v: number; h: number; style?: CSS}> = ({v, h, style}) => {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <div style={{height: h, overflow: 'hidden', position: 'relative', ...style}}>
      <div style={{transform: `translateY(${-v * h}px)`}}>
        {digits.map((d, i) => (
          <div key={i} style={{height: h, lineHeight: `${h}px`, textAlign: 'center'}}>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
};

/** 给 0 → 1 的进度套上多个关键帧：[进度, 值] */
export const ramp = (t: number, pts: [number, number][]) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [a, va] = pts[i - 1];
      const [b, vb] = pts[i];
      return va + ((vb - va) * (t - a)) / (b - a);
    }
  }
  return pts[pts.length - 1][1];
};
export {clamp, tween, E};
