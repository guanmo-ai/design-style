/** 013 · Art Deco —— 字体、金、三线、阶梯切角、光（沿线跑的高光、星芒）、字幕牌 */
import React from 'react';
import {staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {E, clamp, spr, tween} from '../../../src/lib/anim';
import {C, FONT, GOLD_STOPS, LINE, STEP} from '../tokens';

let fontsP: Promise<unknown> | null = null;
export const loadFonts = () => {
  if (fontsP) return fontsP;
  const L = (family: string, file: string, weight: string) =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  fontsP = Promise.all([
    L('Poiret One', 'PoiretOne-Regular.ttf', '400'),
    L('Jost', 'Jost.ttf', '100 900'),
    L('Noto Serif SC', 'NotoSerifSC.ttf', '200 900'),
    L('Noto Sans SC', 'NotoSansSC-Regular.otf', '400'),
    L('Noto Sans SC', 'NotoSansSC-Medium.otf', '500'),
    L('Noto Sans SC', 'NotoSansSC-Bold.otf', '700'),
  ]);
  return fontsP;
};

export const W = 1920;
export const H = 1080;
export const AX = 960;
export const G = 'url(#gold)';
export const GV = LINE.video;

// ───────── 金与光 ─────────
export const GoldDefs: React.FC = () => (
  <>
    <linearGradient id="gold" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={520} y2={560} spreadMethod="reflect">
      {GOLD_STOPS.map(([o, c]) => (
        <stop key={o} offset={o} stopColor={c} />
      ))}
    </linearGradient>
    <linearGradient id="goldFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={C.goldLt} />
      <stop offset="0.45" stopColor={C.gold} />
      <stop offset="1" stopColor={C.goldDk} />
    </linearGradient>
    <linearGradient id="shaft" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#0A0907" />
      <stop offset="0.5" stopColor="#231D13" />
      <stop offset="1" stopColor="#0A0907" />
    </linearGradient>
    <radialGradient id="sunDisc" cx="0.5" cy="0.35" r="0.7">
      <stop offset="0" stopColor="#FFF3CF" />
      <stop offset="0.5" stopColor={C.goldLt} />
      <stop offset="1" stopColor={C.gold} />
    </radialGradient>
    <radialGradient id="flare">
      <stop offset="0" stopColor="#FFF6DC" stopOpacity={0.95} />
      <stop offset="0.18" stopColor={C.goldLt} stopOpacity={0.55} />
      <stop offset="1" stopColor={C.gold} stopOpacity={0} />
    </radialGradient>
  </>
);

/** 把 a 以不透明度 k 叠到 b 上，直接算出实色（大面积低透明度叠加在 Chromium 里会分块） */
export const mix = (a: string, b: string, k: number) => {
  const p = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const pa = p(a);
  const pb = p(b);
  return '#' + [0, 1, 2].map((i) => Math.round(pb[i] + (pa[i] - pb[i]) * clamp(k)).toString(16).padStart(2, '0')).join('');
};

/**
 * 沿线跑的高光：一段亮线顺着路径从起点跑到终点（p 0 → 1），外面裹两层宽而淡的“光晕”。
 * 不用滤镜：滤镜区域在缩放的组里很难算，三层描边一样好看、快得多
 */
export const Streak: React.FC<{d: string; p: number; w?: number; len?: number; tf?: string}> = ({d, p, w = 3, len = 0.14, tf}) => {
  if (p <= 0 || p >= 1) return null;
  const o = len - p * (1 + len);
  const a = Math.sin(Math.PI * p) ** 0.5;
  const common = {d, fill: 'none', pathLength: 1, strokeDasharray: `${len} ${2 + len}`, strokeDashoffset: o, strokeLinecap: 'round' as const, transform: tf};
  return (
    <g opacity={a}>
      <path {...common} stroke={C.gold} strokeWidth={w * 7} opacity={0.16} />
      <path {...common} stroke={C.goldLt} strokeWidth={w * 3} opacity={0.4} />
      <path {...common} stroke="#FFF8E6" strokeWidth={w * 1.3} />
    </g>
  );
};

/** 星芒：一圈光 + 一横一竖两道细菱形 */
export const Flare: React.FC<{x: number; y: number; k: number; rot?: number}> = ({x, y, k, rot = 0}) => {
  if (k <= 0.01) return null;
  const D = (l: number, t: number) => `M${-l} 0 L0 ${-t} L${l} 0 L0 ${t} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
      <circle r={90} fill="url(#flare)" />
      <path d={D(170, 3.2)} fill="#FFF8E6" />
      <path d={D(3.2, 95)} fill="#FFF8E6" />
      <g transform="rotate(45)" opacity={0.6}>
        <path d={D(48, 2)} fill={C.goldLt} />
        <path d={D(2, 48)} fill={C.goldLt} />
      </g>
    </g>
  );
};
/** 星芒的包络：一下亮起，慢慢收 */
export const flareK = (f: number, at: number, dur = 40) => (f < at ? 0 : tween(f, at, 5, 0, 1, E.out) * (1 - tween(f, at + 5, dur, 0, 1, E.inOut)));

// ───────── 几何 ─────────
/** 两级阶梯切角的矩形（s = 0 时就是直角） */
export const stepRect = (x: number, y: number, w: number, h: number, s: number = STEP.video) => {
  const pts = [
    [x + 2 * s, y], [x + w - 2 * s, y], [x + w - 2 * s, y + s], [x + w - s, y + s], [x + w - s, y + 2 * s], [x + w, y + 2 * s],
    [x + w, y + h - 2 * s], [x + w - s, y + h - 2 * s], [x + w - s, y + h - s], [x + w - 2 * s, y + h - s], [x + w - 2 * s, y + h],
    [x + 2 * s, y + h], [x + 2 * s, y + h - s], [x + s, y + h - s], [x + s, y + h - 2 * s], [x, y + h - 2 * s],
    [x, y + 2 * s], [x + s, y + 2 * s], [x + s, y + s], [x + 2 * s, y + s],
  ];
  return 'M' + pts.map(([a, b]) => `${a.toFixed(1)} ${b.toFixed(1)}`).join(' L') + ' Z';
};

/** 阶梯切角矩形的右半边：从顶边中点出发，顺时针到底边中点（左半边用 mirror 镜像）——高光从中轴往两边跑 */
export const stepHalf = (cx: number, y: number, hw: number, h: number, s: number) => {
  const x = cx + hw;
  const b = y + h;
  return `M${cx} ${y} H${x - 2 * s} V${y + s} H${x - s} V${y + 2 * s} H${x} V${b - 2 * s} H${x - s} V${b - s} H${x - 2 * s} V${b} H${cx}`;
};
export const mirror = (cx: number) => `translate(${cx} 0) scale(-1 1) translate(${-cx} 0)`;

/** 三线框：一粗两细，粗线在外 */
export const TripleRect: React.FC<{x: number; y: number; w: number; h: number; s?: number; k?: number; stroke?: string; op?: number}> = ({x, y, w, h, s = STEP.video, k = 1, stroke = G, op = 1}) => {
  const ws = [GV.thick * k, GV.thin * k, GV.thin * k];
  return (
    <g opacity={op}>
      {ws.map((sw, i) => {
        const d = i * GV.gap * k;
        return <path key={i} d={stepRect(x + d, y + d, w - 2 * d, h - 2 * d, Math.max(0, s - d * 0.35))} fill="none" stroke={stroke} strokeWidth={sw} />;
      })}
    </g>
  );
};

export const Diamond: React.FC<{x: number; y: number; r: number; fill?: string; op?: number}> = ({x, y, r, fill = G, op = 1}) => (
  <path d={`M${x} ${y - r} L${x + r} ${y} L${x} ${y + r} L${x - r} ${y} Z`} fill={fill} opacity={op} />
);

/** 细线 + 中间一颗菱形；p 从中间往两边画出来 */
export const RuleDiamond: React.FC<{x1: number; x2: number; y: number; p?: number; sw?: number}> = ({x1, x2, y, p = 1, sw = 1.6}) => {
  const m = (x1 + x2) / 2;
  const half = ((x2 - x1) / 2 - 20) * p;
  if (p <= 0) return null;
  return (
    <g>
      <path d={`M${m - 20} ${y} H${m - 20 - half} M${m + 20} ${y} H${m + 20 + half}`} stroke={G} strokeWidth={sw} />
      <Diamond x={m} y={y} r={9 * Math.min(1, p * 2)} />
    </g>
  );
};

/** 角花：三级阶梯 + 一颗菱形 */
export const Corner: React.FC<{x: number; y: number; sx: number; sy: number; p?: number}> = ({x, y, sx, sy, p = 1}) => {
  if (p <= 0) return null;
  const k = 1.3;
  const d = `M${x} ${y + sy * 64 * k} V${y} H${x + sx * 64 * k} M${x + sx * 14 * k} ${y + sy * 42 * k} V${y + sy * 14 * k} H${x + sx * 42 * k}`;
  return (
    <g opacity={Math.min(1, p * 1.5)}>
      <path d={d} fill="none" stroke={G} strokeWidth={2.4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      <Diamond x={x + sx * 30 * k} y={y + sy * 30 * k} r={7 * p} />
    </g>
  );
};

// ───────── 字 ─────────
type TP = {
  x: number;
  y: number;
  size: number;
  family?: string;
  weight?: number;
  fill?: string;
  ls?: number; // em
  anchor?: 'start' | 'middle' | 'end';
  op?: number;
  children: React.ReactNode;
};
export const T: React.FC<TP> = ({x, y, size, family = FONT.geo, weight = 400, fill = C.ivory, ls = 0, anchor = 'start', op = 1, children}) => (
  // SVG 的字距加在每个字后面：右对齐时补回最后一个字距，左右两半才真正对称；Poiret One 只有 400，写粗了会被假加粗
  <text x={anchor === 'end' ? x + ls * size : x} y={y} fontFamily={family} fontWeight={family.includes('Poiret') ? 400 : weight} fontSize={size} fill={fill} letterSpacing={`${ls}em`} textAnchor={anchor} opacity={op}>
    {children}
  </text>
);

/**
 * 字幕牌：一块黑曜底、三线框、阶梯切角的牌子，从中轴打开。
 * 规则名（细宋、金）靠右落在中轴左边，说明（黑体、象牙）靠左落在中轴右边——一句话从中轴劈成两半
 */
export const Plaque: React.FC<{f: number; at: number; out: number; title: string; sub: string; y?: number; w?: number}> = ({f, at, out, title, sub, y = 952, w = 1260}) => {
  const k = (f < at ? 0 : spr(f, at, {damping: 16, mass: 0.6, stiffness: 220})) * (1 - tween(f, out, 12, 0, 1, E.in));
  if (k <= 0.002) return null;
  const txt = clamp(tween(f, at + 6, 14)) * (1 - tween(f, out - 4, 8));
  const h = 108;
  return (
    <g transform={`translate(${AX} 0) scale(${k} 1) translate(${-AX} 0)`}>
      <path d={stepRect(AX - w / 2, y - h / 2, w, h, 12)} fill={C.onyx} />
      <TripleRect x={AX - w / 2} y={y - h / 2} w={w} h={h} s={12} k={0.55} />
      <g opacity={txt}>
        <T x={AX - 34} y={y + 19} size={54} family={FONT.serif} weight={600} fill={G} ls={0.18} anchor="end">
          {title}
        </T>
        <Diamond x={AX} y={y} r={8} />
        <T x={AX + 34} y={y + 14} size={40} family={FONT.sc} weight={500} fill={C.ivory} ls={0.04}>
          {sub}
        </T>
      </g>
    </g>
  );
};
