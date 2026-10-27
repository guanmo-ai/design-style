/** 009 · Neo-Brutalism —— 字体、硬阴影盒子、光标、点阵、打字、按下 / 砸下的节奏 */
import React from 'react';
import {staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {clamp, spr, tween, E} from '../../../src/lib/anim';
import {C, FONT, V} from '../tokens';

type CSS = React.CSSProperties;

let fontsP: Promise<unknown> | null = null;
export const loadFonts = () => {
  if (fontsP) return fontsP;
  const L = (family: string, file: string, weight: string, stretch?: string) =>
    loadFont({
      family,
      url: staticFile(`fonts/${file}`),
      weight,
      stretch,
      format: file.endsWith('.otf') ? 'opentype' : file.endsWith('.woff2') ? 'woff2' : 'truetype',
    });
  fontsP = Promise.all([
    L('Archivo', 'Archivo.ttf', '100 900', '62% 125%'),
    L('Space Grotesk', 'SpaceGrotesk.ttf', '300 700'),
    L('Space Mono', 'SpaceMono-Regular.ttf', '400'),
    L('Space Mono', 'SpaceMono-Bold.ttf', '700'),
    L('Tinos', 'Tinos-400.woff2', '400'),
    L('Tinos', 'Tinos-700.woff2', '700'),
    L('Noto Sans SC', 'NotoSansSC-Regular.otf', '400'),
    L('Noto Sans SC', 'NotoSansSC-Medium.otf', '500'),
    L('Noto Sans SC', 'NotoSansSC-Bold.otf', '700'),
    L('Noto Sans SC', 'NotoSansSC-Black.otf', '900'),
  ]);
  return fontsP;
};

// ───────── 字 ─────────
/** Archivo 900 宽体：wdth 62—125 */
export const disp = (size: number, wdth = 125, ls = -0.03, wght = 900): CSS => ({
  fontFamily: FONT.display,
  fontSize: size,
  fontWeight: wght,
  fontStretch: `${wdth}%`,
  fontVariationSettings: `'wght' ${wght}, 'wdth' ${wdth}`,
  letterSpacing: `${ls}em`,
  lineHeight: 1,
  whiteSpace: 'nowrap',
});
export const grot = (size: number, w = 700, ls = -0.02): CSS => ({fontFamily: FONT.grotesk, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1, whiteSpace: 'nowrap'});
export const mono = (size: number, w = 700, ls = 0): CSS => ({fontFamily: FONT.mono, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1.25, whiteSpace: 'pre'});
export const sc = (size: number, w = 900, ls = 0.02): CSS => ({fontFamily: FONT.sc, fontSize: size, fontWeight: w, letterSpacing: `${ls}em`, lineHeight: 1.1, whiteSpace: 'nowrap'});
export const serif = (size: number, w = 400): CSS => ({fontFamily: FONT.browser, fontSize: size, fontWeight: w, lineHeight: 1.2, whiteSpace: 'nowrap'});

// ───────── 节奏 ─────────
/** 砸下来：一次小过冲（约 5%）再停住（只给“落地”，不给“按下”） */
export const SLAM = {damping: 17, mass: 0.6, stiffness: 280};
export const slam = (f: number, at: number) => spr(f, at, SLAM);
/** 整屏级别的大位移（上千像素）：阻尼更大，过冲只有 3% 左右，正好在拍点上停住 */
export const SLAM_BIG = {damping: 22, mass: 0.6, stiffness: 300};
export const slamBig = (f: number, at: number) => spr(f, at, SLAM_BIG);
/** 按下：4 帧线性压到底（阴影 → 0），停 hold 帧，6 帧线性弹回。不弹簧、不缓动 */
export const press = (f: number, at: number, hold = 6, release = true) => {
  if (f < at) return 0;
  const down = clamp((f - at) / 4);
  if (!release) return down;
  const up = clamp((f - at - 4 - hold) / 6);
  return down * (1 - up);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 落地的“咚”：整屏往下沉 amp 像素再回来，只朝一个方向、不来回颤（替代衰减正弦式的镜头抖动） */
export const thud = (f: number, hits: [number, number][]) => {
  let y = 0;
  for (const [at, amp] of hits) {
    const t = f - at;
    if (t >= 0 && t < 10) y += amp * Math.exp(-t / 1.8);
  }
  return y;
};
export const appear = (f: number, at: number, d = 8) => tween(f, at, d, 0, 1, E.out);

// ───────── 盒子 ─────────
export type BoxProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  border?: number;
  shadow?: number; // 偏移量（右下），0 模糊
  p?: number; // 按下进度 0—1：位移 = 阴影 × p，阴影 = 阴影 × (1 − p)
  r?: number; // 圆角
  rot?: number;
  scale?: number;
  origin?: string;
  softShadow?: string; // 只给“改造前”的默认样式用
  style?: CSS;
  children?: React.ReactNode;
};
/** 新粗野主义的全部秘密：黑描边 + 同形黑块向右下偏移；按下时元素滑到阴影的位置 */
export const Box: React.FC<BoxProps> = ({x, y, w, h, fill = C.white, border = V.border, shadow = V.shadow[1], p = 0, r = 0, rot = 0, scale = 1, origin = 'center', softShadow, style, children}) => {
  const s = shadow * (1 - p);
  const d = shadow * p;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: 'border-box',
        background: fill,
        border: border > 0 ? `${border}px solid ${C.ink}` : undefined,
        borderRadius: r,
        boxShadow: softShadow ?? (s > 0.01 ? `${s}px ${s}px 0 0 ${C.ink}` : undefined),
        transform: `translate(${d}px, ${d}px) rotate(${rot}deg) scale(${scale})`,
        transformOrigin: origin,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** 绝对定位的小工具 */
export const At: React.FC<{x: number; y: number; style?: CSS; children: React.ReactNode}> = ({x, y, style, children}) => (
  <div style={{position: 'absolute', left: x, top: y, ...style}}>{children}</div>
);

/** 居中在 (x, y) */
export const Mid: React.FC<{x: number; y: number; style?: CSS; children: React.ReactNode}> = ({x, y, style, children}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', ...style}}>{children}</div>
);

// ───────── 背景 ─────────
/** 可见的网格：30px 点阵 */
export const Dots: React.FC<{color?: string; opacity?: number; size?: number; style?: CSS}> = ({color = C.ink, opacity = 0.16, size = V.dot, style}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `radial-gradient(${color} 1.8px, transparent 2.2px)`,
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: `${size / 2}px ${size / 2}px`,
      opacity,
      ...style,
    }}
  />
);

// ───────── 光标 ─────────
const ARROW = 'M0 0 L0 50 L13 38 L23 60 L33 55 L23 34 L41 34 Z';
export const Cursor: React.FC<{x: number; y: number; p?: number; s?: number; opacity?: number}> = ({x, y, p = 0, s = 1.4, opacity = 1}) => (
  <svg
    width={70 * s}
    height={80 * s}
    viewBox="-4 -4 70 80"
    style={{position: 'absolute', left: x - 4 * s, top: y - 4 * s, overflow: 'visible', opacity, transform: `scale(${1 - 0.12 * p})`, transformOrigin: `${4 * s}px ${4 * s}px`}}
  >
    <path d={ARROW} transform="translate(5 5)" fill={C.ink} />
    <path d={ARROW} fill={C.white} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

/** 按下时从光标尖端炸开的一圈短线 */
export const Burst: React.FC<{x: number; y: number; f: number; at: number; color?: string; r0?: number}> = ({x, y, f, at, color = C.ink, r0 = 26}) => {
  const t = (f - at) / 12;
  if (t < 0 || t > 1) return null;
  const e = E.out(t);
  return (
    <svg style={{position: 'absolute', left: x - 120, top: y - 120, overflow: 'visible'}} width={240} height={240}>
      {Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        const r1 = r0 + 34 * e;
        const r2 = r1 + 34 * (1 - 0.7 * e);
        return <line key={i} x1={120 + Math.cos(a) * r1} y1={120 + Math.sin(a) * r1} x2={120 + Math.cos(a) * r2} y2={120 + Math.sin(a) * r2} stroke={color} strokeWidth={7} strokeLinecap="square" />;
      })}
    </svg>
  );
};

/** 逐字打出来的一行代码；打字时带一个光标块，打完就收掉（不闪） */
export const Typed: React.FC<{f: number; at: number; text: string; cps?: number; style?: CSS; caret?: boolean}> = ({f, at, text, cps = 2.2, style, caret = true}) => {
  if (f < at) return null;
  const n = Math.min(text.length, Math.floor((f - at) * cps));
  const done = n >= text.length;
  return (
    <span style={style}>
      {text.slice(0, n)}
      {caret && !done && <span style={{background: C.ink, color: 'transparent'}}>_</span>}
    </span>
  );
};

/** 一块“贴纸”星：八个尖 */
export const Star: React.FC<{x: number; y: number; r: number; fill: string; rot?: number; shadow?: number; children?: React.ReactNode}> = ({x, y, r, fill, rot = 0, shadow = 8, children}) => {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const rr = i % 2 === 0 ? r : r * 0.58;
    const a = (Math.PI * i) / 8 - Math.PI / 2;
    pts.push(`${(r + 10 + rr * Math.cos(a)).toFixed(1)},${(r + 10 + rr * Math.sin(a)).toFixed(1)}`);
  }
  const P = pts.join(' ');
  return (
    <div style={{position: 'absolute', left: x - r - 10, top: y - r - 10, width: 2 * r + 20, height: 2 * r + 20, transform: `rotate(${rot}deg)`}}>
      <svg width={2 * r + 20 + shadow} height={2 * r + 20 + shadow} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <polygon points={P} transform={`translate(${shadow} ${shadow})`} fill={C.ink} />
        <polygon points={P} fill={fill} stroke={C.ink} strokeWidth={V.border} strokeLinejoin="round" />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
    </div>
  );
};
