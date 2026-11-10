/**
 * 宣传片的工具层：时间轴、缓动、签名物理（“盖章”）、确定性随机数、字体、画布。
 * 所有画面都是时间 t 的纯函数（t 可以是小数：运动模糊按子帧取样）。
 */
import React, {useLayoutEffect, useRef} from 'react';
import {staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import TLJSON from '../timeline.json';

export const TL = TLJSON;
export const BEAT = TL.beat;
export const DURATION = TL.duration;
export const W = 1920;
export const H = 1080;
/** 主角：同一个圆，圆心和半径全片不变（墙和片尾除外） */
export const CX = 960;
export const CY = 540;
export const R = 210;

export type SceneDef = (typeof TL.scenes)[number];
export type SceneProps = {t: number; len: number};

// —— 数学 ——
export const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** t 落在 [a, a+d] 里的进度 0..1 */
export const seg = (t: number, a: number, d: number) => cl((t - a) / d);
export const eo = (p: number, n = 3) => 1 - Math.pow(1 - cl(p), n);
export const ei = (p: number, n = 3) => Math.pow(cl(p), n);
export const eio = (p: number) => {
  p = cl(p);
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
};
/** 过冲约 5—10% 的落位 */
export const back = (p: number, s = 1.7) => {
  p = cl(p);
  const q = p - 1;
  return 1 + q * q * ((s + 1) * q + s);
};
/** 阻尼弹簧：0 → 1，带余振（x = 帧） */
export const spring = (x: number, freq = 0.55, damp = 0.22) => (x <= 0 ? 0 : 1 - Math.exp(-damp * x) * Math.cos(freq * x));
/** 从 0 长到 1（a 帧开始，d 帧到位，带过冲） */
export const pop = (t: number, a: number, d = 9, s = 1.9) => (t < a ? 0 : back(seg(t, a, d), s));

/**
 * 签名物理“盖章”：每个拍点整片被盖一次。
 * 落下：7 帧从 1+amt 压回 1；换章前 5 帧先吸一口气（缩到 0.93），再被下一章盖下去。
 */
export const slap = (t: number, amt = 0.3, d = 7) => (t < 0 ? 1 : 1 + amt * (1 - eo(t / d, 4)));
export const inhale = (t: number, len: number, amt = 0.07, d = 5) => 1 - amt * ei(seg(t, len - d, d), 2);
export const pulse = (t: number, len: number, amt = 0.3) => slap(t, amt) * inhale(t, len);

// —— 确定性随机 ——
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// —— SVG 小件 ——
export const P = (pts: number[][]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
/** 绕 (x,y) 缩放 / 旋转的组 */
export const G: React.FC<{x?: number; y?: number; s?: number; sx?: number; sy?: number; r?: number; dx?: number; dy?: number; o?: number; children?: React.ReactNode}> = ({
  x = CX,
  y = CY,
  s = 1,
  sx,
  sy,
  r = 0,
  dx = 0,
  dy = 0,
  o,
  children,
}) => (
  <g opacity={o} transform={`translate(${x + dx} ${y + dy}) rotate(${r}) scale(${sx ?? s} ${sy ?? s}) translate(${-x} ${-y})`}>
    {children}
  </g>
);

/** 一行字从遮罩里升起来（不淡入）。x/y = 基线左端；p = 0..1 */
export const Rise: React.FC<{x: number; y: number; size: number; p: number; children: React.ReactNode; w?: number; style?: React.CSSProperties; anchor?: 'start' | 'middle' | 'end'}> = ({
  x,
  y,
  size,
  p,
  children,
  w = 1600,
  style,
  anchor = 'start',
}) => {
  const ox = anchor === 'start' ? 0 : anchor === 'middle' ? w / 2 : w;
  return (
    <svg x={x - ox} y={y - size * 1.02} width={w} height={size * 1.32} overflow="hidden">
      <text x={ox} y={size * 1.02 + (1 - eo(p, 4)) * size * 1.3} fontSize={size} textAnchor={anchor} style={style}>
        {children}
      </text>
    </svg>
  );
};

// —— 画布：每帧同步重画（时间的纯函数） ——
export const Cv: React.FC<{w?: number; h?: number; x?: number; y?: number; draw: (g: CanvasRenderingContext2D, c: HTMLCanvasElement) => void; dep: unknown; style?: React.CSSProperties}> = ({
  w = W,
  h = H,
  x = 0,
  y = 0,
  draw,
  dep,
  style,
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext('2d', {willReadFrequently: true})!;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.filter = 'none';
    draw(g, c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep, w, h]);
  return <canvas ref={ref} width={w} height={h} style={{position: 'absolute', left: x, top: y, width: w, height: h, ...style}} />;
};

// —— 字体（全部是仓库 scripts/fetch_fonts.sh 下载的开源字体；Newsreader / DM Sans 来自画廊） ——
export const FONT = {
  sc: '"Noto Sans SC"',
  serif: '"Noto Serif SC"',
  mono: '"Geist Mono"',
  jb: '"JetBrains Mono"',
  brand: 'Newsreader',
  ui: '"DM Sans"',
};
let fontsLoaded = false;
export const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const L = (family: string, file: string, weight = '400', format: 'truetype' | 'opentype' | 'woff2' = 'truetype', dir = 'fonts') =>
    loadFont({family, url: staticFile(`${dir}/${file}`), weight, format});
  L('Noto Sans SC', 'NotoSansSC-Medium.otf', '500', 'opentype');
  L('Noto Sans SC', 'NotoSansSC-Bold.otf', '700', 'opentype');
  L('Noto Sans SC', 'NotoSansSC-Black.otf', '900', 'opentype');
  L('Noto Serif SC', 'NotoSerifSC.ttf', '200 900');
  L('Geist Mono', 'GeistMono.ttf', '100 900');
  L('JetBrains Mono', 'JetBrainsMono.ttf', '100 800');
  L('Jost', 'Jost.ttf', '100 900');
  L('Heros', 'TeXGyreHeros-Bold.otf', '700', 'opentype');
  L('Heros', 'TeXGyreHeros-Regular.otf', '400', 'opentype');
  L('Oswald', 'Oswald.ttf', '200 700');
  L('Fredoka', 'Fredoka.ttf', '300 700');
  L('Bangers', 'Bangers-Regular.ttf');
  L('Unbounded', 'Unbounded.ttf', '200 900');
  L('Silkscreen', 'Silkscreen-Regular.ttf');
  L('Archivo', 'Archivo.ttf', '100 900');
  L('Poiret One', 'PoiretOne-Regular.ttf');
  L('Inter Display', 'InterDisplay-Bold.ttf', '700');
  L('Inter Display', 'InterDisplay-SemiBold.ttf', '600');
  L('Anton', 'Anton-Regular.ttf');
  L('Instrument Serif', 'InstrumentSerif-Regular.ttf');
  L('Huangyou', 'ZCOOLQingKeHuangYou.ttf');
  L('Newsreader', 'Newsreader-latin.woff2', '200 800', 'woff2', 'promo');
  L('DM Sans', 'DMSans-latin.woff2', '100 1000', 'woff2', 'promo');
};

/** 一整幅 1920×1080 的 SVG 画面 */
export const Svg: React.FC<{children?: React.ReactNode; bg?: string; style?: React.CSSProperties}> = ({children, bg, style}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, background: bg, ...style}}>
    {children}
  </svg>
);
/** 每个组件实例一个不会撞的 id 前缀（运动模糊会把同一画面叠好几层） */
export const useUid = () => 'u' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
