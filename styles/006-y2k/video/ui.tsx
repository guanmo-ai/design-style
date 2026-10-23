/** 006 · Y2K —— 公共零件：底（铝 + 细条纹 + 网格）、页眉页脚、Aqua 控件、像素表情、铬精灵、转场 */
import React, {useLayoutEffect, useRef} from 'react';
import {random} from 'remotion';
import {E, spr, tween} from '../../../src/lib/anim';
import {C, ENV, F} from '../tokens';
import {AT, CHAPTERS} from './timeline';
// @ts-ignore —— 纯 JS 模块（图片管线也在浏览器里直接用它）
import Y2KM from './material.js';

export type P = {f: number};
export const W = 1920;
export const H = 1080;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const c01 = (t: number) => Math.min(1, Math.max(0, t));
export const n1 = (v: number) => v.toFixed(1);
export const SMOOTH_IN = {damping: 16, mass: 0.8, stiffness: 140};
export const BOUNCY = {damping: 9, mass: 0.6, stiffness: 180};
/** 进场：t0 之后弹到 1（不过冲用 tween，带一点回弹用 spr） */
export const inS = (f: number, t0: number, cfg = SMOOTH_IN) => (f < t0 ? 0 : spr(f, t0, cfg));
export const inT = (f: number, t0: number, d = 18, e = E.out) => tween(f, t0, d, 0, 1, e);
export const outT = (f: number, t0: number, d = 12) => 1 - tween(f, t0, d, 0, 1, E.in);
/** 打字：每秒 cps 个字 */
export const typed = (s: string, f: number, t0: number, cps = 40) => {
  const n = Math.floor(Math.max(0, f - t0) * (cps / 60));
  return [...s].slice(0, n).join('');
};
/** 每拍一次的呼吸（Aqua 默认按钮就是这样一明一暗地“跳”） */
export const throb = (f: number, period = 60) => 0.5 - 0.5 * Math.cos(((f % period) / period) * Math.PI * 2);

/* ─────────── 文字 ─────────── */
type FontKey = keyof typeof F;
export const Txt: React.FC<{
  x: number; y: number; size: number; font?: FontKey; w?: number; c?: string; anchor?: 'start' | 'middle' | 'end'; ls?: number; o?: number; children: React.ReactNode;
}> = ({x, y, size, font = 'cn', w = 500, c = C.ink, anchor = 'start', ls = 0, o, children}) => (
  <text x={n1(x)} y={n1(y)} fontFamily={F[font]} fontSize={size} fontWeight={font === 'cn' || font === 'latin' ? w : 400} fill={c} textAnchor={anchor} letterSpacing={ls} opacity={o}>
    {children}
  </text>
);
/** 估字宽（排版标签用）：中文 1 个字号；Michroma 宽 0.86；Silkscreen 0.62；其余拉丁 0.56 */
export const tw = (s: string, size: number, font: FontKey = 'cn', ls = 0) =>
  [...s].reduce((a, ch) => a + (/[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 1 : ch === ' ' ? 0.32 : font === 'tech' ? 0.86 : font === 'pixel' ? 0.62 : 0.56) * size + ls, 0);

/* ─────────── 底：铝面渐变 + 2px 细条纹 + 80px 网格 + 套准标记 ─────────── */
export const Defs: React.FC<P> = ({f}) => (
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.paperTop} />
      <stop offset="0.55" stopColor="#E4E8EE" />
      <stop offset="1" stopColor={C.paperBottom} />
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.32" r="0.6">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
      <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
    </radialGradient>
    <pattern id="pinBg" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="2" fill="#FFFFFF" opacity="0.38" />
    </pattern>
    <pattern id="pin" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill="#ECEEF2" />
      <rect width="4" height="2" fill="#F8F9FB" />
    </pattern>
    <pattern id="pinT" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="2" fill="#FFFFFF" opacity="0.5" />
    </pattern>
    <linearGradient id="gTitle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#F4F5F7" />
      <stop offset="1" stopColor={C.silver} />
    </linearGradient>
    <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#6FA8FF" />
      <stop offset="0.5" stopColor={C.aqua} />
      <stop offset="0.52" stopColor={C.aquaDeep} />
      <stop offset="1" stopColor={C.aquaLight} />
    </linearGradient>
    <linearGradient id="gWhite" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="0.5" stopColor="#E9ECF1" />
      <stop offset="0.52" stopColor="#DADFE7" />
      <stop offset="1" stopColor="#FFFFFF" />
    </linearGradient>
    <linearGradient id="gLime" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#E6FF8A" />
      <stop offset="0.5" stopColor={C.lime} />
      <stop offset="0.52" stopColor="#AEDC1E" />
      <stop offset="1" stopColor="#E9FF9C" />
    </linearGradient>
    <linearGradient id="gHi" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
      <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.1" />
    </linearGradient>
    <linearGradient id="gTrack" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#B9C0CC" />
      <stop offset="1" stopColor="#F2F4F7" />
    </linearGradient>
    <linearGradient id="gChrome" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2A4FB8" />
      <stop offset="0.32" stopColor="#9DB6EE" />
      <stop offset="0.49" stopColor="#FFFFFF" />
      <stop offset="0.51" stopColor="#1A2236" />
      <stop offset="0.75" stopColor="#3B4458" />
      <stop offset="1" stopColor="#A9B3C6" />
    </linearGradient>
    <linearGradient id="gIri" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FF9AD5" />
      <stop offset="0.25" stopColor="#FFE58A" />
      <stop offset="0.5" stopColor="#9BFFD9" />
      <stop offset="0.75" stopColor="#8FB8FF" />
      <stop offset="1" stopColor="#D79BFF" />
    </linearGradient>
    {/* 理发店转筒：进度条上的斜条纹，往右一直走 */}
    <pattern id="stripes" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform={`translate(${n1((f * 0.9) % 22)} 0) rotate(-45)`}>
      <rect width="11" height="22" fill="#FFFFFF" />
    </pattern>
    {[
      ['r', C.red, '#FF9A8A'],
      ['y', C.yellow, '#FFE08A'],
      ['g', C.green, '#A8F08A'],
    ].map(([k, a, b]) => (
      <radialGradient key={k} id={`tl_${k}`} cx="0.5" cy="0.75" r="0.75">
        <stop offset="0" stopColor={b} />
        <stop offset="1" stopColor={a} />
      </radialGradient>
    ))}
    <filter id="soft14" x="-20%" y="-20%" width="140%" height="160%">
      <feGaussianBlur stdDeviation="14" />
    </filter>
    <filter id="soft6" x="-20%" y="-50%" width="140%" height="200%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
    <filter id="soft2" x="-20%" y="-50%" width="140%" height="200%">
      <feGaussianBlur stdDeviation="2" />
    </filter>
  </defs>
);

export const reg = (x: number, y: number, r = 9) => (
  <g key={`${x}${y}`} stroke={C.ink} strokeWidth={0.9} fill="none" opacity={0.6}>
    <circle cx={x} cy={y} r={r * 0.55} />
    <line x1={x - r} y1={y} x2={x + r} y2={y} />
    <line x1={x} y1={y - r} x2={x} y2={y + r} />
  </g>
);
const GRID_D = (() => {
  let d = '';
  for (let x = 80; x <= 1840; x += 80) d += `M${x} 104V990`;
  for (let y = 120; y <= 990; y += 80) d += `M80 ${y}H1840`;
  return d;
})();
/** 底：一层就够，每一幕自己带一份（转场时新的一幕连底一起盖上来） */
export const Background: React.FC<{grid?: number}> = ({grid = 0.07}) => (
  <g>
    <rect width={W} height={H} fill="url(#bg)" />
    <rect width={W} height={H} fill="url(#pinBg)" />
    <rect width={W} height={H * 0.8} fill="url(#glow)" />
    <path d={GRID_D} stroke={C.ink} strokeWidth={0.5} opacity={grid} fill="none" />
  </g>
);
export const Svg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}>
    {children}
  </svg>
);

/* ─────────── 刻度尺 ─────────── */
export const Ruler: React.FC<{x0: number; x1: number; y: number; p?: number}> = ({x0, x1, y, p = 1}) => {
  let d = `M${x0} ${y}H${n1(lerp(x0, x1, p))}`;
  for (let i = 0, x = x0; x <= lerp(x0, x1, p); x += 10, i++) d += `M${x} ${y}v${-(i % 10 === 0 ? 9 : i % 5 === 0 ? 5 : 3)}`;
  return <path d={d} stroke={C.ink} strokeWidth={0.8} opacity={0.55} fill="none" />;
};

/* ─────────── 页眉 · 页脚（全片常驻） ─────────── */
export const Hud: React.FC<P> = ({f}) => {
  const k = inT(f, 0, 26, E.inOut); // 两条线从中间往两边画出来
  let cur = 0;
  CHAPTERS.forEach(([, t], i) => {
    if (f >= t - 6) cur = i;
  });
  const fade = f >= AT.rules - 8 ? 1 - inT(f, AT.rules - 8, 14) : 1; // 规则和片尾不需要章节条
  // 当前章的下划线：位置和宽度都用弹簧滑过去
  const xs = CHAPTERS.map((_, i) => 80 + i * 124);
  const ws = CHAPTERS.map(([c]) => 40 + tw(c, 15));
  let ux = xs[0];
  let uw = ws[0];
  CHAPTERS.forEach(([, t], i) => {
    if (i === 0) return;
    const p = f < t - 6 ? 0 : spr(f, t - 6, {damping: 18, mass: 0.6, stiffness: 200});
    ux = lerp(ux, xs[i], p);
    uw = lerp(uw, ws[i], p);
  });
  const t1 = inT(f, 8, 20);
  return (
    <g>
      {[reg(40, 40), reg(W - 40, 40), reg(40, H - 40), reg(W - 40, H - 40)]}
      <g opacity={t1}>
        <Txt x={80} y={66} size={13} font="tech" ls={2.6}>{`DESIGN STYLE  ⁄  N°006`}</Txt>
        <Txt x={960} y={66} size={12} font="pixel" c={C.grey} ls={1.5} anchor="middle">Y2K_FUTURISM.SIT · 1.44 MB</Txt>
        <Txt x={1840} y={66} size={13} font="tech" ls={2.6} anchor="end">1997 — 2004</Txt>
      </g>
      <line x1={n1(960 - 880 * k)} y1={86} x2={n1(960 + 880 * k)} y2={86} stroke={C.ink} strokeWidth={1} opacity={0.8} />
      <line x1={n1(960 - 880 * k)} y1={994} x2={n1(960 + 880 * k)} y2={994} stroke={C.ink} strokeWidth={1} opacity={0.8} />
      <g opacity={t1 * fade}>
        {CHAPTERS.map(([c], i) => (
          <g key={c}>
            <Txt x={xs[i]} y={1032} size={12} font="pixel" c={i === cur ? C.aqua : C.grey} ls={1}>{`0${i}`}</Txt>
            <Txt x={xs[i] + 30} y={1033} size={15} w={i === cur ? 700 : 500} c={i === cur ? C.ink : C.grey}>{c}</Txt>
          </g>
        ))}
        <rect x={n1(ux)} y={1004} width={n1(uw)} height={3} fill={C.aqua} />
      </g>
      <g opacity={t1}>
        <Txt x={1640} y={1033} size={15} w={700} anchor="end">Design Style 风格 006</Txt>
        <Txt x={1840} y={1033} size={13} font="tech" ls={1} anchor="end">@guanmo_ai</Txt>
      </g>
    </g>
  );
};
/** 每章左上角的章号 + 出处（“03 ⁄ 06   MACWORLD SF · 05.01.2000”） */
export const Kicker: React.FC<{f: number; t0: number; n: number; src: string}> = ({f, t0, n, src}) => {
  const k = inT(f, t0, 16);
  return (
    <g opacity={k} transform={`translate(${n1(-16 * (1 - k))} 0)`}>
      <Txt x={80} y={128} size={15} font="tech" c={C.aqua} ls={2}>{`0${n} ⁄ 06`}</Txt>
      <Txt x={190} y={128} size={12} font="pixel" c={C.grey} ls={1.2}>{typed(src, f, t0 + 4, 70)}</Txt>
    </g>
  );
};
/** 大标题（中文）+ 两行说明，逐行从下面滑上来 */
export const Head: React.FC<{f: number; t0: number; x?: number; y: number; title: string; lines?: string[]; size?: number}> = ({f, t0, x = 80, y, title, lines = [], size = 54}) => {
  const row = (i: number) => {
    const k = inS(f, t0 + i * 5);
    return {opacity: c01(k * 1.4), transform: `translate(0 ${n1(28 * (1 - k))})`};
  };
  return (
    <g>
      <g style={row(0)}>
        <Txt x={x} y={y} size={size} w={900} ls={-0.5}>{title}</Txt>
      </g>
      {lines.map((l, i) => (
        <g key={i} style={row(i + 1)}>
          <Txt x={x} y={y + size * 0.95 + i * 36} size={24} w={500}>{l}</Txt>
        </g>
      ))}
    </g>
  );
};
/** 胶囊标签 */
export const Pill: React.FC<{x: number; y: number; label: string; fill?: string; c?: string; k?: number; font?: FontKey; size?: number; anchor?: 'start' | 'end'}> = ({x, y, label, fill = C.ink, c = C.white, k = 1, font = 'cn', size = 16, anchor = 'start'}) => {
  if (k <= 0.001) return null;
  const w = tw(label, size, font, font === 'tech' ? 1 : 0) + 40;
  const h = size * 2.1;
  const x0 = anchor === 'end' ? x - w : x;
  return (
    <g transform={`translate(${n1(x0 + w / 2)} ${n1(y + h / 2)}) scale(${k.toFixed(4)}) translate(${n1(-w / 2)} ${n1(-h / 2)})`}>
      <rect width={w} height={h} rx={h / 2} fill={fill} />
      <rect x={h * 0.3} y={1.5} width={w - h * 0.6} height={h * 0.42} rx={h * 0.21} fill="#FFFFFF" opacity={0.28} />
      <Txt x={w / 2} y={h * 0.68} size={size} font={font} w={700} c={c} anchor="middle" ls={font === 'tech' ? 1 : 0}>{label}</Txt>
    </g>
  );
};

/* ─────────── Aqua 控件 ─────────── */
/** 果冻按钮：上半截一条白色高光，中线处颜色断一下，底部反光；glow = 默认按钮的呼吸 */
export const GelButton: React.FC<{x: number; y: number; w: number; h: number; label: string; blue?: boolean; glow?: number; press?: number}> = ({x, y, w, h, label, blue = true, glow = 0, press = 0}) => {
  const r = h / 2;
  return (
    <g transform={`translate(${n1(x + w / 2)} ${n1(y + h / 2)}) scale(${(1 - press * 0.04).toFixed(4)}) translate(${n1(-w / 2)} ${n1(-h / 2)})`}>
      {blue && <rect x={0} y={h * 0.18} width={w} height={h} rx={r} fill={C.aqua} opacity={0.22 + 0.3 * glow} filter="url(#soft14)" />}
      <rect x={0} y={2} width={w} height={h} rx={r} fill={C.ink} opacity={0.18} filter="url(#soft2)" />
      <rect x={0} y={0} width={w} height={h} rx={r} fill={`url(#${blue ? 'gBlue' : 'gWhite'})`} stroke={blue ? '#1144A8' : '#9AA3B5'} strokeWidth={1} />
      {blue && <rect x={0} y={0} width={w} height={h} rx={r} fill="#9FD0FF" opacity={0.35 * glow} />}
      <rect x={r * 0.5} y={2} width={w - r} height={h * 0.46} rx={h * 0.23} fill="url(#gHi)" />
      <Txt x={w / 2} y={h * 0.66} size={h * 0.42} w={700} c={blue ? C.white : C.ink} anchor="middle">{label}</Txt>
    </g>
  );
};
/** 进度条：凹槽 + 蓝色果冻 + 走动的斜条纹 + 高光 */
export const Progress: React.FC<{x: number; y: number; w: number; h: number; p: number}> = ({x, y, w, h, p}) => {
  const fw = Math.max(h - 2, (w - 2) * c01(p));
  return (
    <g transform={`translate(${n1(x)} ${n1(y)})`}>
      <rect width={w} height={h} rx={h / 2} fill="url(#gTrack)" stroke="#8A93A6" strokeWidth={1} />
      {p > 0.001 && (
        <g>
          <rect x={1} y={1} width={n1(fw)} height={h - 2} rx={h / 2 - 1} fill="url(#gBlue)" />
          <rect x={1} y={1} width={n1(fw)} height={h - 2} rx={h / 2 - 1} fill="url(#stripes)" opacity={0.35} />
          <rect x={h * 0.4} y={2.5} width={n1(Math.max(0, fw - h * 0.8))} height={n1(h * 0.36)} rx={n1(h * 0.18)} fill="url(#gHi)" />
        </g>
      )}
    </g>
  );
};
export const Traffic: React.FC<{x: number; y: number; r?: number}> = ({x, y, r = 9}) => (
  <g>
    {(
      [
        ['r', '#9E2A22'],
        ['y', '#A57418'],
        ['g', '#2D7A22'],
      ] as const
    ).map(([k, rim], i) => (
      <g key={k} transform={`translate(${x + i * r * 3.1} ${y})`}>
        <circle r={r} fill={rim} />
        <circle r={r - 0.8} fill={`url(#tl_${k})`} />
        <ellipse cy={-r * 0.45} rx={r * 0.62} ry={r * 0.38} fill="#FFFFFF" opacity={0.85} />
      </g>
    ))}
  </g>
);
/** Aqua 窗口：细条纹窗体 + 拉丝标题栏 + 红黄绿 + 大投影 */
export const Window: React.FC<{x: number; y: number; w: number; h: number; title: string; children?: React.ReactNode}> = ({x, y, w, h, title, children}) => (
  <g>
    <rect x={x} y={y + 24} width={w} height={h} rx={12} fill={C.ink} opacity={0.28} filter="url(#soft14)" />
    <rect x={x} y={y} width={w} height={h} rx={11} fill="url(#pin)" stroke="#8C94A6" strokeWidth={1} />
    <path d={`M${x + 11} ${y}H${x + w - 11}Q${x + w} ${y} ${x + w} ${y + 11}V${y + 44}H${x}V${y + 11}Q${x} ${y} ${x + 11} ${y}Z`} fill="url(#gTitle)" />
    <rect x={x} y={y} width={w} height={44} rx={11} fill="url(#pinT)" opacity={0.6} />
    <line x1={x} y1={y + 44.5} x2={x + w} y2={y + 44.5} stroke="#9AA2B2" strokeWidth={1} />
    <Traffic x={x + 26} y={y + 22} />
    <Txt x={x + w / 2} y={y + 28} size={16} w={500} c="#2A3142" anchor="middle">{title}</Txt>
    {children}
  </g>
);

/* ─────────── 像素表情（本片原创，12×12） ─────────── */
export const EMOJI: Record<string, [string, string]> = {
  heart: ['#FF2E88', '............|..##....##..|.####..####.|############|############|############|.##########.|..########..|...######...|....####....|.....##.....|............'],
  face: ['#FFB000', '...######...|..########..|.##########.|####.##.####|####.##.####|############|############|##.######.##|###.####.###|.###....###.|..########..|...######...'],
  phone: [C.ink, '.....#......|.....#......|...######...|...#....#...|...#....#...|...######...|...#.#.##...|...######...|...#.#.##...|...######...|...#.#.##...|...######...'],
  sun: ['#FF6A00', '.....##.....|.#...##...#.|..#......#..|....####....|...######...|##.######.##|##.######.##|...######...|....####....|..#......#..|.#...##...#.|.....##.....'],
  spark: [C.aqua, '.....##.....|.....##.....|....####....|....####....|..########..|############|############|..########..|....####....|....####....|.....##.....|.....##.....'],
  mail: [C.ink, '............|############|##........##|#.#......#.#|#..#....#..#|#...#..#...#|#....##....#|#..........#|#..........#|############|............|............'],
  note: ['#7B4DFF', '....########|....########|....##....##|....##....##|....##....##|....##....##|....##....##|..####..####|.#####.#####|.#####.#####|..###...###.|............'],
};
export const emojiCells = (name: string) => {
  const rows = EMOJI[name][1].split('|');
  const out: [number, number][] = [];
  rows.forEach((r, j) => [...r].forEach((ch, i) => ch === '#' && out.push([i, j])));
  return out;
};
/** 一个表情：s = 一个像素多大；n = 画到第几个像素（逐个点亮） */
export const Emoji: React.FC<{name: string; x: number; y: number; s: number; n?: number; c?: string}> = ({name, x, y, s, n = 999, c}) => {
  const cells = emojiCells(name).slice(0, n);
  let d = '';
  for (const [i, j] of cells) d += `M${n1(x + i * s)} ${n1(y + j * s)}h${n1(s)}v${n1(s)}h${n1(-s)}Z`;
  return <path d={d} fill={c || EMOJI[name][0]} shapeRendering="crispEdges" />;
};

/* ─────────── 铬：画布层 + 静态精灵 ─────────── */
export type ChromeCfg = Record<string, any>;
export const base = (o: ChromeCfg): ChromeCfg => ({w: W, h: H, scale: 1, bevel: 26, smooth: 2.4, shadowBlur: 16, shadow: [0, 20, 0.55, 0], env: ENV, ...o});
/** 逐帧重画的铬层（字的形状不变时，高度场只算一次，之后每帧只改 uniform） */
export const Chrome: React.FC<{cfg: ChromeCfg; style?: React.CSSProperties}> = ({cfg, style}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(cfg);
  useLayoutEffect(() => {
    if (ref.current) Y2KM.draw(ref.current, cfg);
  }, [key]);
  return <canvas ref={ref} style={{position: 'absolute', left: 0, top: 0, width: cfg.w, height: cfg.h, ...style}} />;
};
/** 静态铬精灵（星星等）：只渲染一次，存成位图，之后只做 CSS 位移 / 旋转 / 缩放 */
const SPR = new Map<string, HTMLCanvasElement>();
let sprGL: HTMLCanvasElement | null = null;
const sprite = (cfg: ChromeCfg) => {
  const k = JSON.stringify(cfg);
  let c = SPR.get(k);
  if (c) return c;
  sprGL = sprGL || document.createElement('canvas');
  Y2KM.draw(sprGL, cfg);
  c = document.createElement('canvas');
  c.width = sprGL.width;
  c.height = sprGL.height;
  c.getContext('2d')!.drawImage(sprGL, 0, 0);
  SPR.set(k, c);
  return c;
};
export const Sprite: React.FC<{cfg: ChromeCfg; x: number; y: number; rot?: number; s?: number; o?: number}> = ({cfg, x, y, rot = 0, s = 1, o = 1}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const src = sprite(cfg);
    if (c.width !== src.width) c.width = src.width;
    if (c.height !== src.height) c.height = src.height;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(src, 0, 0);
  }, [JSON.stringify(cfg)]);
  if (s <= 0.001 || o <= 0.001) return null;
  return (
    <canvas
      ref={ref}
      style={{position: 'absolute', left: x - cfg.w / 2, top: y - cfg.h / 2, width: cfg.w, height: cfg.h, opacity: o, transform: `rotate(${n1(rot)}deg) scale(${s.toFixed(4)})`}}
    />
  );
};
/** 铬四角星：Y2K 的“闪一下” */
export const STAR = (R: number) => base({w: R * 3, h: R * 3, scale: 2, bevel: Math.max(6, R * 0.32), smooth: 1.2, shadowBlur: 6, shadow: [0, R * 0.25, 0.4, 0], cam: [R * 1.5, -R * 0.9, R * 22], shapes: [{d: Y2KM.star(R * 1.5, R * 1.5, R)}]});
export const Star: React.FC<{f: number; t0: number; x: number; y: number; R: number; spin?: number}> = ({f, t0, x, y, R, spin = 0}) => {
  const k = f < t0 ? 0 : spr(f, t0, BOUNCY);
  const tw2 = 1 + 0.08 * Math.sin((f - t0) * 0.12 + x);
  return <Sprite cfg={STAR(R)} x={x} y={y} s={k * tw2} rot={(1 - k) * -90 + spin * (f - t0)} />;
};
export const starD = (cx: number, cy: number, R: number) => Y2KM.star(cx, cy, R) as string;

/* ─────────── 标注：引线 + 圆点 + 标签（教学用） ─────────── */
export const Callout: React.FC<{f: number; t0: number; x: number; y: number; x2: number; y2: number; label: string; sub?: string; c?: string; anchor?: 'start' | 'end'}> = ({f, t0, x, y, x2, y2, label, sub, c = C.ink, anchor = 'start'}) => {
  const k = inT(f, t0, 16, E.inOut);
  if (k <= 0) return null;
  const tk = inT(f, t0 + 8, 12);
  const dx = anchor === 'start' ? 12 : -12;
  return (
    <g>
      <circle cx={x} cy={y} r={5 * inS(f, t0, BOUNCY)} fill={C.white} stroke={c} strokeWidth={2} />
      <path d={`M${x} ${y}L${n1(lerp(x, x2, k))} ${n1(lerp(y, y2, k))}`} stroke={c} strokeWidth={1.2} />
      <g opacity={tk} transform={`translate(${n1((1 - tk) * dx)} 0)`}>
        <Txt x={x2 + dx} y={y2 + 6} size={20} w={700} c={c} anchor={anchor}>{label}</Txt>
        {sub && (
          <Txt x={x2 + dx} y={y2 + 28} size={11} font="pixel" c={C.grey} anchor={anchor} ls={1}>{sub}</Txt>
        )}
      </g>
    </g>
  );
};

/* ─────────── 转场：下一幕用 clip-path 盖上来 ─────────── */
const circlePath = (x: number, y: number, r: number) => `M${n1(x - r)} ${n1(y)}a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0Z`;
export type Wipe = {kind: 'bubble' | 'gel' | 'horizon' | 'pixel' | 'glitch' | 'glass'; x?: number; y?: number};
/** p: 0 → 1（1 = 完全盖满）。返回 CSS clip-path 值 */
export const wipeClip = (w: Wipe, p: number, seed: string) => {
  if (p >= 1) return undefined;
  if (w.kind === 'bubble' || w.kind === 'gel') {
    const x = w.x ?? 960;
    const y = w.y ?? 540;
    const R = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 20;
    return `path('${circlePath(x, y, Math.max(0.1, R * p))}')`;
  }
  if (w.kind === 'horizon') return `inset(0 0 ${n1((1 - p) * 100)}% 0)`;
  if (w.kind === 'glass') return `inset(0 ${n1((1 - p) * 100)}% 0 0 round 0 40px 40px 0)`;
  // 像素 / 故障：80px 网格的方块（或横条）按随机顺序点亮
  let d = '';
  if (w.kind === 'pixel') {
    for (let j = 0; j < 14; j++)
      for (let i = 0; i < 24; i++) {
        const t = random(`${seed}${i}-${j}`) * 0.7 + (Math.abs(i - 12) / 12) * 0.3;
        if (t < p) d += `M${i * 80} ${j * 80 - 20}h80v80h-80Z`;
      }
  } else {
    for (let j = 0; j < 36; j++) {
      const t = random(`${seed}g${j}`);
      if (t < p) d += `M0 ${j * 30}h${W}v30h${-W}Z`;
    }
  }
  return `path('${d || 'M0 0Z'}')`;
};
/** 转场的边：泡泡的彩虹边 / 果冻的蓝边 / 地平线的亮线 / 玻璃的折射边 */
export const WipeEdge: React.FC<{w: Wipe; p: number}> = ({w, p}) => {
  if (p <= 0 || p >= 1) return null;
  if (w.kind === 'bubble' || w.kind === 'gel') {
    const x = w.x ?? 960;
    const y = w.y ?? 540;
    const R = (Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 20) * p;
    const o = 1 - p * 0.6;
    return w.kind === 'bubble' ? (
      <g opacity={o}>
        <circle cx={x} cy={y} r={R} fill="none" stroke="url(#gIri)" strokeWidth={10 + 20 * p} opacity={0.55} filter="url(#soft6)" />
        <circle cx={x} cy={y} r={R} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.9} />
      </g>
    ) : (
      <g opacity={o}>
        <circle cx={x} cy={y} r={R} fill="none" stroke={C.bondi} strokeWidth={14 + 30 * p} opacity={0.45} filter="url(#soft6)" />
        <circle cx={x} cy={y} r={R} fill="none" stroke="#BFF4FF" strokeWidth={3} />
      </g>
    );
  }
  if (w.kind === 'horizon') {
    const y = H * p;
    return (
      <g>
        <rect x={0} y={y - 40} width={W} height={40} fill="url(#gHi)" opacity={0.6} />
        <rect x={0} y={y - 2} width={W} height={4} fill="#FFFFFF" />
        <rect x={0} y={y + 2} width={W} height={10} fill={C.ink} opacity={0.12} filter="url(#soft2)" />
      </g>
    );
  }
  if (w.kind === 'glass') {
    const x = W * p;
    return (
      <g>
        <rect x={x - 44} y={0} width={44} height={H} fill="#FFFFFF" opacity={0.35} />
        <rect x={x - 3} y={0} width={3} height={H} fill="#FFFFFF" />
        <rect x={x - 44} y={0} width={6} height={H} fill="#9FC2FF" opacity={0.5} />
        <rect x={x} y={0} width={16} height={H} fill={C.ink} opacity={0.1} filter="url(#soft6)" />
      </g>
    );
  }
  return null;
};
