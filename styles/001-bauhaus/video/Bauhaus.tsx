/**
 * Motion Style · 001 · 包豪斯 Bauhaus（1919—1933）
 * 15s · 1920×1080 · 60fps · 120 BPM（1 拍 = 30 帧）
 *
 * 一组几何体（蓝圆 / 红方 / 黄三角）贯穿全片，在六个段落之间连续变形：
 *   A 0–90     开场：三个基本形依次砸下
 *   B 90–240   标题：用圆与直线现场“搭”出小写 bauhaus
 *   C 240–390  1923 康定斯基问卷：形状褪色 → 依次填回答案色
 *   D 390–660  一张海报的诞生：网格 / 基本形 / 粗线 / 全小写 / 不对称平衡（带设计标注）
 *   E 660–780  一百年后：▶ ● ■ —— 播放、录制、停止
 *   F 780–900  片尾
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {colorTrack, E, Key, POP, shake, SNAP, spr, track, tween} from '../../../src/lib/anim';
import {Grain, Vignette} from '../../../src/lib/Grain';
import {C, FONT} from '../tokens';

loadFont({family: 'Jost', url: staticFile('fonts/Jost.ttf'), weight: '100 900', format: 'truetype'});
loadFont({family: 'JetBrains Mono', url: staticFile('fonts/JetBrainsMono.ttf'), weight: '100 800', format: 'truetype'});

export const BAUHAUS_DURATION = 900;
const W = 1920;
const H = 1080;

/* ------------------------------------------------------------------ */
/* 贯穿全片的三个几何体                                                */
/* ------------------------------------------------------------------ */

type Hero = {x: Key[]; y: Key[]; s: Key[]; r: Key[]};

const CIRCLE: Hero = {
  x: [{f: 0, v: 740}, {f: 62, v: 120, d: 30, e: 'smooth'}, {f: 226, v: 1360, d: 30, e: 'smooth'}, {f: 372, v: 790, d: 30, e: 'smooth'}, {f: 662, v: 960, d: 28, e: 'smooth'}],
  y: [{f: 0, v: 560}, {f: 62, v: 100, d: 30, e: 'smooth'}, {f: 226, v: 535, d: 30, e: 'smooth'}, {f: 372, v: 590, d: 30, e: 'smooth'}, {f: 662, v: 560, d: 28, e: 'smooth'}],
  s: [{f: 0, v: 470}, {f: 0, v: 600, d: 26, e: 'pop'}, {f: 62, v: 44, d: 30, e: 'smooth'}, {f: 226, v: 270, d: 30}, {f: 372, v: 700, d: 30}, {f: 662, v: 112, d: 28}],
  r: [{f: 0, v: 0}],
};

const SQUARE: Hero = {
  x: [{f: 0, v: 1760}, {f: 6, v: 1180, d: 26}, {f: 64, v: 180, d: 30, e: 'smooth'}, {f: 228, v: 960, d: 30, e: 'smooth'}, {f: 396, v: 1585, d: 30}, {f: 664, v: 1180, d: 28, e: 'smooth'}],
  y: [{f: 0, v: -300}, {f: 6, v: 380, d: 26}, {f: 64, v: 100, d: 30, e: 'smooth'}, {f: 228, v: 550, d: 30, e: 'smooth'}, {f: 396, v: 330, d: 30}, {f: 664, v: 560, d: 28, e: 'smooth'}],
  s: [{f: 0, v: 380}, {f: 64, v: 40, d: 30, e: 'smooth'}, {f: 228, v: 240, d: 30}, {f: 396, v: 230, d: 30}, {f: 664, v: 98, d: 28}],
  r: [{f: 0, v: 38}, {f: 6, v: 0, d: 30}, {f: 64, v: 90, d: 30, e: 'smooth'}, {f: 228, v: 180, d: 30}, {f: 396, v: 270, d: 30}, {f: 664, v: 360, d: 28}],
};

const TRIANGLE: Hero = {
  x: [{f: 0, v: 1335}, {f: 66, v: 240, d: 30, e: 'smooth'}, {f: 230, v: 560, d: 30, e: 'smooth'}, {f: 384, v: 1150, d: 30}, {f: 660, v: 740, d: 28, e: 'smooth'}],
  y: [{f: 0, v: 1500}, {f: 22, v: 700, d: 24}, {f: 66, v: 104, d: 30, e: 'smooth'}, {f: 230, v: 583, d: 30, e: 'smooth'}, {f: 384, v: 640, d: 30}, {f: 660, v: 560, d: 28, e: 'smooth'}],
  s: [{f: 0, v: 440}, {f: 66, v: 52, d: 30, e: 'smooth'}, {f: 230, v: 300, d: 30}, {f: 384, v: 540, d: 30}, {f: 660, v: 136, d: 28}, {f: 758, v: 5400, d: 26, e: 'in'}],
  r: [{f: 0, v: -24}, {f: 22, v: 0, d: 26}, {f: 66, v: 120, d: 30, e: 'smooth'}, {f: 230, v: 240, d: 30}, {f: 384, v: 360, d: 30}, {f: 660, v: 450, d: 28}],
};

// 康定斯基段落：褪色（只剩轮廓）→ 依次填回
const DRAIN = 232;
const FILL = {triangle: 285, square: 315, circle: 345};

const triPoints = (s: number) => {
  const h = (s * Math.sqrt(3)) / 2;
  return `0,${(-2 * h) / 3} ${s / 2},${h / 3} ${-s / 2},${h / 3}`;
};

const HeroShape: React.FC<{
  kind: 'circle' | 'square' | 'triangle';
  hero: Hero;
  frame: number;
  color: string;
  fillAt: number;
}> = ({kind, hero, frame, color, fillAt}) => {
  const x = track(frame, hero.x);
  const y = track(frame, hero.y);
  let s = track(frame, hero.s);
  const r = track(frame, hero.r);

  // 褪色 / 填回
  const drained = tween(frame, DRAIN, 18, 0, 1, E.inOut);
  const refill = spr(frame, fillAt, POP, 28);
  const fillOpacity = frame < fillAt ? 1 - drained : refill;
  const strokeOpacity = drained * (1 - tween(frame, 366, 16, 0, 1));
  if (frame >= fillAt && frame < fillAt + 40) s *= 0.84 + 0.16 * refill;

  // 按下（片段 E）
  if (kind === 'triangle' && frame >= 750 && frame < 762) {
    s *= 1 - 0.12 * Math.sin(((frame - 750) / 12) * Math.PI);
  }

  const common = {
    fill: color,
    fillOpacity,
    stroke: C.ink,
    strokeOpacity,
    strokeWidth: 6,
    strokeLinejoin: 'miter' as const,
    style: {mixBlendMode: 'multiply' as const},
  };

  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      {kind === 'circle' && <circle r={s / 2} {...common} />}
      {kind === 'square' && <rect x={-s / 2} y={-s / 2} width={s} height={s} {...common} />}
      {kind === 'triangle' && <polygon points={triPoints(s)} {...common} />}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* 通用小部件                                                          */
/* ------------------------------------------------------------------ */

const cjk = (size: number, weight = 900): React.CSSProperties => ({fontFamily: FONT.cjk, fontSize: size, fontWeight: weight});
const latin = (size: number, weight = 600): React.CSSProperties => ({fontFamily: FONT.latin, fontSize: size, fontWeight: weight});
const mono = (size: number, weight = 500): React.CSSProperties => ({fontFamily: FONT.mono, fontSize: size, fontWeight: weight});

/** 上滑淡入的文字 */
const Rise: React.FC<{f: number; at: number; out?: number; dy?: number; children: React.ReactNode}> = ({f, at, out, dy = 40, children}) => {
  const p = spr(f, at, SNAP, 30);
  const o = out !== undefined ? 1 - tween(f, out, 14, 0, 1, E.inOut) : 1;
  const oy = out !== undefined ? -tween(f, out, 14, 0, 30, E.in) : 0;
  return (
    <g opacity={Math.min(1, p * 1.4) * o} transform={`translate(0 ${(1 - p) * dy + oy})`}>
      {children}
    </g>
  );
};

/** 设计标注：锚点 + 引线 + 深色标签 */
const Spec: React.FC<{
  f: number;
  at: number;
  out: number;
  ax: number;
  ay: number;
  lx: number;
  ly: number;
  num?: string;
  text: string;
  w: number;
}> = ({f, at, out, ax, ay, lx, ly, num, text, w}) => {
  const p = spr(f, at, POP, 24);
  const line = tween(f, at, 12, 0, 1);
  const wipe = tween(f, at + 4, 14, 0, 1);
  const o = 1 - tween(f, out, 12, 0, 1, E.inOut);
  if (f < at) return null;
  const hh = 40;
  // 引线连接到标签最近的边
  const tx = Math.min(Math.max(ax, lx), lx + w);
  const ty = ay < ly ? ly : ly + hh;
  return (
    <g opacity={o}>
      <line x1={ax} y1={ay} x2={ax + (tx - ax) * line} y2={ay + (ty - ay) * line} stroke={C.red} strokeWidth={2} />
      <circle cx={ax} cy={ay} r={7 * p} fill={C.red} stroke={C.paper} strokeWidth={2.5} />
      <clipPath id={`clip-${at}-${lx}`}>
        <rect x={lx} y={ly} width={w * wipe} height={hh} />
      </clipPath>
      <g clipPath={`url(#clip-${at}-${lx})`}>
        <rect x={lx} y={ly} width={w} height={hh} fill={C.ink} />
        {num && (
          <>
            <rect x={lx} y={ly} width={46} height={hh} fill={C.red} />
            <text x={lx + 23} y={ly + 27} textAnchor="middle" fill={C.paper} style={mono(18, 700)}>
              {num}
            </text>
          </>
        )}
        <text x={lx + (num ? 60 : 14)} y={ly + 27} fill={C.paper} style={{...mono(18, 500), fontFamily: `${FONT.mono.split(',')[0]}, ${FONT.cjk}`}}>
          {text}
        </text>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* B · 用几何“搭”出来的小写 bauhaus                                    */
/* ------------------------------------------------------------------ */

const XH = 240; // x 高
const SW = 46; // 笔画粗细
const ASC = 120; // 上伸部
const R = (XH - SW) / 2; // 圆形碗的中线半径
const RS = (XH - SW) / 4; // s 的半径

type Glyph = {w: number; paths: string[]; disc?: {cx: number; cy: number}};
const L = SW / 2;
const GLYPHS: Record<string, Glyph> = {
  b: {
    w: SW + 2 * R,
    paths: [`M ${L} ${-ASC} L ${L} ${XH}`, `M ${L + R} ${L} A ${R} ${R} 0 1 1 ${L + R - 0.01} ${L}`],
    disc: {cx: L + R, cy: XH / 2},
  },
  a: {
    w: SW + 2 * R,
    paths: [`M ${L + R} ${L} A ${R} ${R} 0 1 0 ${L + R + 0.01} ${L}`, `M ${L + 2 * R} 0 L ${L + 2 * R} ${XH}`],
    disc: {cx: L + R, cy: XH / 2},
  },
  u: {
    w: SW + 2 * R,
    paths: [`M ${L} 0 L ${L} ${XH / 2} A ${R} ${R} 0 0 0 ${L + 2 * R} ${XH / 2} L ${L + 2 * R} 0`, `M ${L + 2 * R} ${XH / 2} L ${L + 2 * R} ${XH}`],
  },
  h: {
    w: SW + 2 * R,
    paths: [`M ${L} ${-ASC} L ${L} ${XH}`, `M ${L} ${XH} L ${L} ${XH / 2} A ${R} ${R} 0 0 1 ${L + 2 * R} ${XH / 2} L ${L + 2 * R} ${XH}`],
  },
  s: {
    w: SW + 2 * RS,
    paths: [
      `M ${L + 2 * RS} ${L + RS} A ${RS} ${RS} 0 1 0 ${L + RS} ${L + 2 * RS} A ${RS} ${RS} 0 1 1 ${L} ${L + 3 * RS}`,
    ],
  },
};
const WORD = 'bauhaus';
const GAP = 34;
const DISC_COLORS: Record<number, [string, number]> = {0: [C.blue, 150], 1: [C.red, 165], 4: [C.yellow, 180]};

const Wordmark: React.FC<{f: number}> = ({f}) => {
  const k = 0.8;
  let cursor = 0;
  const items = WORD.split('').map((ch, i) => {
    const g = GLYPHS[ch];
    const x0 = cursor;
    cursor += g.w + GAP;
    return {ch, g, x0, i};
  });
  const total = cursor - GAP;
  const tx = W / 2 - (total * k) / 2;
  return (
    <g transform={`translate(${tx} ${290 + ASC * k}) scale(${k})`}>
      {items.map(({g, x0, i}) => {
        const start = 92 + i * 7;
        const exit = tween(f, 220 + i * 2, 16, 0, 1, E.in);
        const disc = DISC_COLORS[i];
        const dp = disc ? spr(f, disc[1], POP, 26) : 0;
        return (
          <g key={i} transform={`translate(${x0} ${-exit * 120})`} opacity={1 - exit}>
            {disc && g.disc && <circle cx={g.disc.cx} cy={g.disc.cy} r={(R - SW / 2 + 2) * dp} fill={disc[0]} />}
            {g.paths.map((d, j) => {
              const p = tween(f, start + j * 5, 26, 0, 1, E.out);
              return (
                <path
                  key={j}
                  d={d}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - p}
                  fill="none"
                  stroke={C.ink}
                  strokeWidth={SW}
                  strokeLinecap="butt"
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* D · 海报元素                                                        */
/* ------------------------------------------------------------------ */

const GridLines: React.FC<{f: number}> = ({f}) => {
  const out = 1 - tween(f, 636, 14, 0, 1, E.inOut);
  if (f < 388 || out <= 0) return null;
  const lines: number[] = [];
  for (let i = 0; i < 12; i++) {
    lines.push(96 + i * 146, 96 + i * 146 + 122);
  }
  return (
    <g opacity={out}>
      {lines.map((x, i) => {
        const p = tween(f, 390 + i * 1.5, 34, 0, 1, E.out);
        return <line key={i} x1={x} y1={0} x2={x} y2={H * p} stroke={C.ink} strokeOpacity={0.13} strokeWidth={1.5} />;
      })}
      {[96, 984].map((y, i) => {
        const p = tween(f, 404 + i * 4, 34, 0, 1, E.out);
        return <line key={`h${i}`} x1={0} y1={y} x2={W * p} y2={y} stroke={C.ink} strokeOpacity={0.13} strokeWidth={1.5} />;
      })}
      {/* 裁切标记 */}
      {[
        [48, 48, 1, 1],
        [W - 48, 48, -1, 1],
        [48, H - 48, 1, -1],
        [W - 48, H - 48, -1, -1],
      ].map(([x, y, sx, sy], i) => (
        <g key={`c${i}`} opacity={tween(f, 410, 16)} stroke={C.ink} strokeWidth={1.5}>
          <line x1={x} y1={y + sy * 22} x2={x} y2={y + sy * 4} />
          <line x1={x + sx * 22} y1={y} x2={x + sx * 4} y2={y} />
        </g>
      ))}
    </g>
  );
};

const PosterElements: React.FC<{f: number}> = ({f}) => {
  if (f < 520 || f > 700) return null;
  const barIn = spr(f, 540, SNAP, 30);
  const barOut = tween(f, 662, 20, 0, 1, E.in);
  const typeIn = spr(f, 570, SNAP, 30);
  const typeOut = tween(f, 658, 14, 0, 1, E.in);
  const yearIn = spr(f, 600, POP, 30);
  const fade = 1 - tween(f, 660, 14, 0, 1);
  return (
    <g>
      {/* 粗线 */}
      <rect x={1000 + (1 - barIn) * 900 + barOut * 1000} y={796} width={824} height={26} fill={C.ink} />
      {/* 竖排全小写 */}
      <g transform={`translate(270 ${984 + (1 - typeIn) * 420 + typeOut * 1000}) rotate(-90)`} opacity={Math.min(1, typeIn * 1.5)}>
        <text x={0} y={0} fill={C.ink} style={{...latin(212, 700), letterSpacing: -4}}>
          bauhaus
        </text>
      </g>
      {/* 年份 */}
      <g opacity={Math.min(1, yearIn * 1.6) * fade} transform={`translate(1824 1004) scale(${1.25 - 0.25 * yearIn}) translate(-1824 -1004)`}>
        <text x={1824} y={1004} textAnchor="end" fill={C.ink} style={{...latin(150, 700), letterSpacing: -3}}>
          1919
        </text>
      </g>
      {/* 信息块 */}
      <g opacity={fade}>
        <Rise f={f} at={600} dy={24}>
          <text x={1470} y={560} fill={C.ink} style={cjk(54)}>
            包豪斯
          </text>
        </Rise>
        {['staatliches bauhaus', 'weimar · dessau · berlin', '1919 — 1933'].map((t, i) => (
          <Rise key={t} f={f} at={606 + i * 4} dy={20}>
            <text x={1470} y={612 + i * 36} fill={C.ink} style={{...latin(25, 500), letterSpacing: 0.5}}>
              {t}
            </text>
          </Rise>
        ))}
      </g>
    </g>
  );
};

const Balance: React.FC<{f: number}> = ({f}) => {
  if (f < 612 || f > 660) return null;
  const p = tween(f, 612, 14, 0, 1);
  const o = 1 - tween(f, 636, 12, 0, 1, E.inOut);
  const mx = 960 + (884 - 960) * p;
  const my = 540 + (604 - 540) * p;
  const cross = (x: number, y: number, col: string, dash?: string) => (
    <g stroke={col} strokeWidth={2} strokeDasharray={dash}>
      <line x1={x - 26} y1={y} x2={x + 26} y2={y} />
      <line x1={x} y1={y - 26} x2={x} y2={y + 26} />
      <circle cx={x} cy={y} r={11} fill="none" />
    </g>
  );
  return (
    <g opacity={o}>
      {cross(960, 540, C.ink, '4 4')}
      <line x1={960} y1={540} x2={mx} y2={my} stroke={C.red} strokeWidth={2} />
      {cross(mx, my, C.red)}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* E · 光标                                                            */
/* ------------------------------------------------------------------ */

const Cursor: React.FC<{f: number}> = ({f}) => {
  if (f < 712 || f > 772) return null;
  const p = tween(f, 712, 40, 0, 1, E.inOut);
  const x = 1480 + (772 - 1480) * p;
  const y = 1010 + (592 - 1010) * p;
  const press = f >= 750 && f < 762 ? 1 - 0.18 * Math.sin(((f - 750) / 12) * Math.PI) : 1;
  const o = 1 - tween(f, 760, 8, 0, 1);
  return (
    <g transform={`translate(${x} ${y}) scale(${1.5 * press})`} opacity={o}>
      <path d="M0 0 L0 30 L8 23 L13.5 35 L18 33 L12.6 21.5 L23 21.5 Z" fill={C.ink} stroke={C.white} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
};


/** 冲击波：几何体落地时扩散的细环 */
const RINGS: [number, number, number, number][] = [
  [2, 740, 560, 470],
  [16, 1180, 380, 330],
  [32, 1335, 700, 360],
  [392, 790, 590, 560],
];
const Shockwaves: React.FC<{f: number}> = ({f}) => (
  <g>
    {RINGS.map(([at, x, y, max]) => {
      const t = f - at;
      if (t < 0 || t > 30) return null;
      const p = tween(f, at, 30, 0, 1, E.out);
      return <circle key={at} cx={x} cy={y} r={max * (0.55 + 0.45 * p)} fill="none" stroke={C.ink} strokeWidth={5 * (1 - p) + 0.5} strokeOpacity={0.45 * (1 - p)} />;
    })}
  </g>
);

/* ------------------------------------------------------------------ */
/* 主合成                                                              */
/* ------------------------------------------------------------------ */

export const Bauhaus: React.FC = () => {
  const f = useCurrentFrame();
  const cam = shake(f, [
    [15, 7],
    [32, 9],
    [390, 8],
    [405, 4],
    [420, 4],
    [540, 4],
    [570, 3],
    [600, 5],
    [782, 10],
  ]);
  const push = 1 + tween(f, 636, 30, 0, 0.018, E.soft);

  const iconInk = (base: string): [number, string][] => [
    [668, base],
    [688, C.ink],
  ];

  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <Audio src={staticFile('001-bauhaus/music.wav')} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect width={W} height={H} fill={C.paper} />
        <g transform={`translate(${cam.x} ${cam.y}) translate(960 540) scale(${push}) translate(-960 -540)`}>
          <GridLines f={f} />
          <Shockwaves f={f} />

          {/* E · 播放器胶囊（位于几何体之下） */}
          {f >= 672 && f < 776 && (
            <g
              transform={`translate(960 560) scale(${spr(f, 676, SNAP, 28) * (1 - tween(f, 758, 12, 0, 1, E.in))})`}
              opacity={1 - tween(f, 760, 10, 0, 1)}
            >
              <rect x={-330} y={-110} width={660} height={220} rx={110} fill={C.white} />
              <rect x={-330} y={-110} width={660} height={220} rx={110} fill="none" stroke={C.ink} strokeOpacity={0.12} strokeWidth={2} />
            </g>
          )}

          {/* 三个几何体 */}
          {f < 784 && (
            <g opacity={1}>
              <g opacity={f >= 758 ? 1 - tween(f, 758, 8, 0, 1) : 1}>
                <HeroShape kind="circle" hero={CIRCLE} frame={f} color={colorTrack(f, iconInk(C.blue))} fillAt={FILL.circle} />
                <HeroShape kind="square" hero={SQUARE} frame={f} color={colorTrack(f, iconInk(C.red))} fillAt={FILL.square} />
              </g>
              <HeroShape
                kind="triangle"
                hero={TRIANGLE}
                frame={f}
                color={colorTrack(f, [
                  [668, C.yellow],
                  [688, C.ink],
                  [756, C.ink],
                  [764, C.yellow],
                ])}
                fillAt={FILL.triangle}
              />
            </g>
          )}

          {/* A · 开场文字 */}
          {f < 240 && (
            <g>
              <g transform={`translate(${96 + tween(f, 62, 30, 0, 194, E.inOut)} 0)`}>
                <Rise f={f} at={14} out={222} dy={20}>
                  <text x={0} y={112} fill={C.ink} style={{...latin(30, 600), letterSpacing: 1}}>
                    motion style
                  </text>
                </Rise>
              </g>
              <Rise f={f} at={18} out={222} dy={20}>
                <text x={1824} y={112} textAnchor="end" fill={C.ink} style={{...latin(30, 600), letterSpacing: 1}}>
                  day 01
                </text>
              </Rise>
              <Rise f={f} at={24} out={58} dy={20}>
                <text x={96} y={1000} fill={C.ink} style={cjk(30, 700)}>
                  每天一个设计风格
                </text>
              </Rise>
              <Rise f={f} at={30} out={58} dy={20}>
                <text x={1824} y={1000} textAnchor="end" fill={C.gray} style={{...mono(22, 500), letterSpacing: 1}}>
                  ● ■ ▲
                </text>
              </Rise>
            </g>
          )}

          {/* B · 标题 */}
          {f >= 88 && f < 244 && (
            <g>
              <Wordmark f={f} />
              <rect x={245} y={640} width={tween(f, 158, 26, 0, 200, E.out) * (1 - tween(f, 220, 14, 0, 1, E.in))} height={14} fill={C.red} />
              <Rise f={f} at={170} out={222}>
                <text x={245} y={738} fill={C.ink}>
                  <tspan style={cjk(72)}>包豪斯</tspan>
                  <tspan dx={28} style={{...latin(62, 500), letterSpacing: -1}}>
                    1919—1933
                  </tspan>
                </text>
              </Rise>
              <Rise f={f} at={184} out={224}>
                <text x={245} y={806} fill={C.gray} style={cjk(34, 500)}>
                  现代设计，从这里开始。
                </text>
              </Rise>
              <Rise f={f} at={190} out={224}>
                <text x={1675} y={738} textAnchor="end" fill={C.gray} style={{...latin(26, 500), letterSpacing: 2}}>
                  weimar · dessau · berlin
                </text>
              </Rise>
            </g>
          )}

          {/* C · 康定斯基问卷 */}
          {f >= 240 && f < 392 && (
            <g>
              <Rise f={f} at={246} out={366}>
                <text x={960} y={234} textAnchor="middle" fill={C.ink}>
                  <tspan style={{...latin(64, 600)}}>1923</tspan>
                  <tspan dx={18} style={cjk(64)}>
                    · 康定斯基的问卷
                  </tspan>
                </text>
              </Rise>
              <Rise f={f} at={256} out={368}>
                <text x={960} y={302} textAnchor="middle" fill={C.gray} style={cjk(34, 500)}>
                  三角、方、圆 —— 各是什么颜色？
                </text>
              </Rise>
              {(
                [
                  [560, '黄', 'yellow', C.yellow, FILL.triangle],
                  [960, '红', 'red', C.red, FILL.square],
                  [1360, '蓝', 'blue', C.blue, FILL.circle],
                ] as const
              ).map(([x, zh, en, hex, at]) => (
                <Rise key={zh} f={f} at={at + 2} out={366} dy={26}>
                  <text x={x} y={762} textAnchor="middle" fill={C.ink}>
                    <tspan style={cjk(44)}>{zh}</tspan>
                    <tspan dx={12} style={{...latin(34, 500)}}>
                      {en}
                    </tspan>
                  </text>
                  <text x={x} y={806} textAnchor="middle" fill={C.gray} style={{...mono(22, 500), letterSpacing: 1}}>
                    {hex}
                  </text>
                </Rise>
              ))}
            </g>
          )}

          {/* D · 海报 */}
          <PosterElements f={f} />
          <Balance f={f} />
          {f >= 440 && f < 660 && (
            <g>
              <Spec f={f} at={450} out={636} ax={96} ay={96} lx={96} ly={30} num="01" text="网格 · 12 栏 · 槽宽 24" w={330} />
              <Spec f={f} at={480} out={636} ax={790} ay={940} lx={560} ly={1010} num="02" text="基本形 · ● ø700 · #1F4FA3" w={400} />
              <Spec f={f} at={510} out={636} ax={1150} ay={330} lx={990} ly={236} text="▲ 540 · #F2B419 · 正片叠底" w={330} />
              <Spec f={f} at={518} out={636} ax={1585} ay={215} lx={1470} ly={150} text="■ 230 · #DB3A26" w={230} />
              <Spec f={f} at={540} out={636} ax={1620} ay={796} lx={1490} ly={730} num="03" text="粗线 · 26px" w={230} />
              <Spec f={f} at={570} out={636} ax={190} ay={984} lx={96} ly={1010} num="04" text="无衬线 · 全小写" w={262} />
              <Spec f={f} at={616} out={636} ax={884} ay={604} lx={920} ly={650} num="05" text="不对称平衡" w={210} />
            </g>
          )}

          {/* E · 一百年后 */}
          {f >= 680 && f < 772 && (
            <g opacity={1 - tween(f, 758, 10, 0, 1)}>
              <Rise f={f} at={692}>
                <text x={960} y={362} textAnchor="middle" fill={C.ink}>
                  <tspan style={latin(72, 600)}>100</tspan>
                  <tspan dx={8} style={cjk(68)}>
                    年后，你每天都在按它们。
                  </tspan>
                </text>
              </Rise>
              {(
                [
                  [740, '播放'],
                  [960, '录制'],
                  [1180, '停止'],
                ] as const
              ).map(([x, t], i) => (
                <Rise key={t} f={f} at={704 + i * 4} dy={20}>
                  <text x={x} y={738} textAnchor="middle" fill={C.gray} style={cjk(28, 500)}>
                    {t}
                  </text>
                </Rise>
              ))}
            </g>
          )}
          <Cursor f={f} />
        </g>

        {/* F · 片尾 */}
        {f >= 780 && <EndCard f={f} />}
      </svg>
      <Grain opacity={0.075} />
      <Vignette strength={f >= 780 ? 0.05 : 0.14} />
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{f: number}> = ({f}) => {
  const circleIn = spr(f, 784, SNAP, 34);
  const squareIn = spr(f, 798, POP, 30);
  return (
    <g>
      <rect width={W} height={H} fill={C.yellow} />
      {/* 右侧构成 */}
      <circle cx={1640 + (1 - circleIn) * 600} cy={500} r={330} fill={C.blue} />
      <rect x={1236} y={662 - (1 - squareIn) * 700} width={220} height={220} fill={C.red} />
      <rect x={1236} y={882} width={588} height={22} fill={C.ink} transform={`translate(${(1 - spr(f, 806, SNAP, 28)) * 700} 0)`} />

      <Rise f={f} at={786} dy={24}>
        <g transform="translate(120 104)">
          <circle cx={0} cy={0} r={18} fill={C.blue} />
          <rect x={30} y={-18} width={36} height={36} fill={C.red} />
          <polygon points={`${96},${-20} ${117},${17} ${75},${17}`} fill={C.ink} />
        </g>
        <text x={262} y={115} fill={C.ink} style={{...latin(30, 600), letterSpacing: 1}}>
          motion style
        </text>
      </Rise>
      <Rise f={f} at={788} dy={60}>
        <text x={110} y={440} fill={C.ink} style={{...cjk(156), letterSpacing: -2}}>
          每天一个
        </text>
      </Rise>
      <Rise f={f} at={794} dy={60}>
        <text x={110} y={618} fill={C.ink} style={{...cjk(156), letterSpacing: -2}}>
          设计风格
        </text>
      </Rise>
      <Rise f={f} at={808} dy={24}>
        <text x={120} y={738} fill={C.ink}>
          <tspan style={latin(38, 600)}>day 01</tspan>
          <tspan dx={22} style={cjk(38, 900)}>
            包豪斯
          </tspan>
          <tspan dx={14} style={latin(38, 500)}>
            bauhaus
          </tspan>
        </text>
      </Rise>
      <Rise f={f} at={816} dy={24}>
        <text x={120} y={800} fill={C.ink} fillOpacity={0.62}>
          <tspan style={latin(38, 600)}>day 02</tspan>
          <tspan dx={22} style={cjk(38, 700)}>
            明天见 →
          </tspan>
        </text>
      </Rise>
      <Rise f={f} at={826} dy={16}>
        <text x={120} y={990} fill={C.ink} style={latin(30, 600)}>
          @guanmo_ai
        </text>
        <text x={1824} y={990} textAnchor="end" fill={C.ink} style={mono(24, 500)}>
          github.com/guanmo-ai/motion-style
        </text>
      </Rise>
    </g>
  );
};
