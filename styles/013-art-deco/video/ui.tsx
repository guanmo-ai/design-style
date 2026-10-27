/** 013 · Art Deco —— 字体、金、三线、阶梯切角，以及“从中轴向两边长出来”的镜像字幕 */
import React from 'react';
import {staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {E, tween} from '../../../src/lib/anim';
import {C, FONT, GOLD_STOPS, LINE, STEP} from '../tokens';
import {SWEEPS} from './timeline';

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

// ───────── 金 ─────────
/** 高光扫过：每次沿渐变方向平移一整个反射周期（2 × 渐变向量），首尾相位一致，循环无缝 */
export const sweep = (f: number) => SWEEPS.reduce((n, t) => n + tween(f, t, 44, 0, 1, E.inOut), 0);
export const GoldDefs: React.FC<{f: number}> = ({f}) => {
  const s = sweep(f);
  const stops = GOLD_STOPS.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />);
  return (
    <>
      <linearGradient id="gold" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={520} y2={560} spreadMethod="reflect" gradientTransform={`translate(${s * 1040} ${s * 1120})`}>
        {stops}
      </linearGradient>
      {/* 按钮：实心金块用一条更短的渐变，面上也有明暗 */}
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
    </>
  );
};

/** 把 a 以不透明度 k 叠到 b 上，直接算出实色（大面积低透明度叠加在 Chromium 里会分块） */
export const mix = (a: string, b: string, k: number) => {
  const p = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const pa = p(a);
  const pb = p(b);
  return '#' + [0, 1, 2].map((i) => Math.round(pb[i] + (pa[i] - pb[i]) * k).toString(16).padStart(2, '0')).join('');
};

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
  // SVG 的字距加在每个字后面：右对齐时补回最后一个字距，左右两半才真正对称
  <text x={anchor === 'end' ? x + ls * size : x} y={y} fontFamily={family} fontWeight={weight} fontSize={size} fill={fill} letterSpacing={`${ls}em`} textAnchor={anchor} opacity={op}>
    {children}
  </text>
);

/**
 * 镜像字幕：一句话从中轴劈成两半，左半句靠右对齐、右半句靠左对齐，同时从中轴里“长”出来，退场时缩回中轴。
 * big 用细宋大字，sub 用黑体说明（手机上要看得清：≥ 40px）
 */
export const Pair: React.FC<{
  f: number;
  id: string;
  at: number;
  out: number;
  big: [string, string];
  sub?: [string, string];
  gap?: number;
  y?: number;
  ax?: number;
  bigSize?: number;
  bigFamily?: string;
  bigLs?: number;
  fam?: [string, string];
}> = ({f, id, at, out, big, sub, gap = 420, y = 520, ax = AX, bigSize = 104, bigFamily = FONT.serif, bigLs = 0.18, fam}) => {
  const p = tween(f, at, 22, 0, 1, E.out) * (1 - tween(f, out, 14, 0, 1, E.in));
  if (p <= 0.001) return null;
  const q = tween(f, at + 8, 22, 0, 1, E.out) * (1 - tween(f, out, 12, 0, 1, E.in));
  return (
    <g>
      {([-1, 1] as const).map((side) => {
        const edge = ax + side * gap;
        const cid = `${id}${side}`;
        const anchor = side < 0 ? 'end' : 'start';
        return (
          <g key={side}>
            <clipPath id={cid}>
              <rect x={side < 0 ? edge + 30 - p * 1000 : edge - 30} y={0} width={p * 1000} height={H} />
            </clipPath>
            <g clipPath={`url(#${cid})`}>
              <g transform={`translate(${-side * (1 - p) * 70} 0)`}>
                <T x={edge} y={y} size={bigSize} family={fam ? fam[side < 0 ? 0 : 1] : bigFamily} weight={(fam ? fam[side < 0 ? 0 : 1] : bigFamily).includes('Poiret') ? 400 : 600} fill={G} ls={bigLs} anchor={anchor}>
                  {big[side < 0 ? 0 : 1]}
                </T>
                {sub && (
                  <g opacity={q} transform={`translate(${-side * (1 - q) * 40} 0)`}>
                    <T x={edge} y={y + 84} size={42} family={FONT.sc} weight={500} fill={C.ivory} ls={0.04} anchor={anchor}>
                      {sub[side < 0 ? 0 : 1]}
                    </T>
                  </g>
                )}
              </g>
            </g>
          </g>
        );
      })}
    </g>
  );
};
