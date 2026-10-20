/**
 * Design Style · 001 · 包豪斯 Bauhaus（1919—1933）
 * 15s · 1920×1080 · 60fps · 120 BPM（1 拍 = 30 帧，所有剪辑点都落在拍子上）
 *
 * 包豪斯远不止红黄蓝 —— 一所学校，九种样子：
 *   0–120     开场：蓝圆 / 红方 / 黄三角砸下 → 飞到左上角成为台标 → 「包豪斯，远不止红黄蓝。」
 *   120–720   九个章节（每章 1–1.5 秒，圆 / 方 / 三角三种形状轮流做转场）
 *             01 色彩 · 02 形与色 · 03 字体 · 04 海报 · 05 建筑 · 06 家具 · 07 灯具 · 08 纺织 · 09 舞台
 *   720–780   回顾：九宫格收拢 ——「一所学校，九种样子。」
 *   780–900   片尾
 *
 * 场景本身在 chapters.tsx，共用小部件在 ui.tsx，配乐在 ../audio/make_music.py。
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {E, Key, POP, shake, SMOOTH, SNAP, spr, track, tween} from '../../../src/lib/anim';
import {Grain, Vignette} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {Chapter, CHAPTERS} from './chapters';
import {cjk, H, latin, mixed, mono, Rise, triPoints, W} from './ui';

loadFont({family: 'Jost', url: staticFile('fonts/Jost.ttf'), weight: '100 900', format: 'truetype'});
loadFont({family: 'JetBrains Mono', url: staticFile('fonts/JetBrainsMono.ttf'), weight: '100 800', format: 'truetype'});
for (const [weight, name] of [[500, 'Medium'], [700, 'Bold'], [900, 'Black']] as const) {
  loadFont({family: 'Noto Sans SC', url: staticFile(`fonts/NotoSansSC-${name}.otf`), weight: String(weight), format: 'opentype'});
}

export const BAUHAUS_DURATION = 900;
const RECAP = 720;
const END = 780;
const WIPE = 10; // 转场时长：在新章节的第一拍之前完成

/* ------------------------------------------------------------------ */
/* 开场：三个基本形                                                    */
/* ------------------------------------------------------------------ */

type Hero = {x: Key[]; y: Key[]; s: Key[]; r: Key[]};
const FLY = 46;
const CIRCLE: Hero = {
  x: [{f: 0, v: 740}, {f: FLY, v: 120, d: 30, e: 'smooth'}],
  y: [{f: 0, v: 560}, {f: FLY, v: 100, d: 30, e: 'smooth'}],
  s: [{f: 0, v: 470}, {f: 0, v: 600, d: 26, e: 'pop'}, {f: FLY, v: 44, d: 30, e: 'smooth'}],
  r: [{f: 0, v: 0}],
};
const SQUARE: Hero = {
  x: [{f: 0, v: 1760}, {f: 6, v: 1180, d: 26}, {f: FLY + 2, v: 180, d: 30, e: 'smooth'}],
  y: [{f: 0, v: -300}, {f: 6, v: 380, d: 26}, {f: FLY + 2, v: 100, d: 30, e: 'smooth'}],
  s: [{f: 0, v: 380}, {f: FLY + 2, v: 40, d: 30, e: 'smooth'}],
  r: [{f: 0, v: 38}, {f: 6, v: 0, d: 30}, {f: FLY + 2, v: 90, d: 30, e: 'smooth'}],
};
const TRIANGLE: Hero = {
  x: [{f: 0, v: 1335}, {f: FLY + 4, v: 240, d: 30, e: 'smooth'}],
  y: [{f: 0, v: 1500}, {f: 22, v: 700, d: 24}, {f: FLY + 4, v: 104, d: 30, e: 'smooth'}],
  s: [{f: 0, v: 440}, {f: FLY + 4, v: 52, d: 30, e: 'smooth'}],
  r: [{f: 0, v: -24}, {f: 22, v: 0, d: 26}, {f: FLY + 4, v: 120, d: 30, e: 'smooth'}],
};

const HeroShape: React.FC<{kind: 'circle' | 'square' | 'triangle'; hero: Hero; f: number; color: string}> = ({kind, hero, f, color}) => {
  const x = track(f, hero.x);
  const y = track(f, hero.y);
  const s = track(f, hero.s);
  const r = track(f, hero.r);
  const style = {mixBlendMode: 'multiply' as const};
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      {kind === 'circle' && <circle r={s / 2} fill={color} style={style} />}
      {kind === 'square' && <rect x={-s / 2} y={-s / 2} width={s} height={s} fill={color} style={style} />}
      {kind === 'triangle' && <polygon points={triPoints(s)} fill={color} style={style} />}
    </g>
  );
};

const RINGS: [number, number, number, number][] = [
  [2, 740, 560, 470],
  [16, 1180, 380, 330],
  [32, 1335, 700, 360],
];

const Hook: React.FC<{f: number}> = ({f}) => (
  <g>
    <rect x={-40} y={-40} width={W + 80} height={H + 80} fill={C.paper} />
    {RINGS.map(([at, x, y, max]) => {
      if (f < at || f > at + 30) return null;
      const p = tween(f, at, 30, 0, 1, E.out);
      return <circle key={at} cx={x} cy={y} r={max * (0.55 + 0.45 * p)} fill="none" stroke={C.ink} strokeWidth={5 * (1 - p) + 0.5} strokeOpacity={0.45 * (1 - p)} />;
    })}
    <HeroShape kind="circle" hero={CIRCLE} f={f} color={C.blue} />
    <HeroShape kind="square" hero={SQUARE} f={f} color={C.red} />
    <HeroShape kind="triangle" hero={TRIANGLE} f={f} color={C.yellow} />

    <g transform={`translate(${96 + tween(f, FLY, 30, 0, 194, E.inOut)} 0)`}>
      <Rise f={f} at={14} dy={20}>
        <text x={0} y={112} fill={C.ink}>
          <tspan style={{...latin(30, 600), letterSpacing: 1}}>design style</tspan>
          <tspan dx={14} style={cjk(28, 700)} fillOpacity={0.55}>
            包豪斯
          </tspan>
        </text>
      </Rise>
    </g>
    <Rise f={f} at={18} out={104} dy={20}>
      <text x={1824} y={112} textAnchor="end" fill={C.ink} style={{...latin(30, 600), letterSpacing: 1}}>
        day 01
      </text>
    </Rise>
    <Rise f={f} at={22} out={50} dy={20}>
      <text x={96} y={1000} fill={C.ink} style={cjk(30, 700)}>
        每天一个设计风格
      </text>
    </Rise>
    <Rise f={f} at={28} out={50} dy={20}>
      <text x={1824} y={1000} textAnchor="end" fill={C.gray} style={{...mono(22, 500), letterSpacing: 1}}>
        ● ■ ▲
      </text>
    </Rise>

    {/* 标题 */}
    <Rise f={f} at={60} dy={50}>
      <text x={960} y={578} textAnchor="middle" fill={C.ink} style={{...cjk(132, 900), letterSpacing: -2}}>
        包豪斯，远不止<tspan fill={C.red}>红</tspan>
        <tspan fill={C.yellow}>黄</tspan>
        <tspan fill={C.blue}>蓝</tspan>。
      </text>
    </Rise>
    <rect x={960 - 120} y={624} width={240 * spr(f, 66, SNAP, 26)} height={12} fill={C.ink} />
    <Rise f={f} at={70} dy={24}>
      <text x={960} y={708} textAnchor="middle" fill={C.gray} style={mixed(38, 500)}>
        一所学校的 9 种样子 · 1919—1933 · 魏玛 / 德绍 / 柏林
      </text>
    </Rise>
  </g>
);

/* ------------------------------------------------------------------ */
/* 章节外框：台标 / 进度 / 章节标签                                     */
/* ------------------------------------------------------------------ */

const isDark = (bg: string) => bg === C.ink || bg === C.blue || bg === C.red;

const Chrome: React.FC<{ch: Chapter; i: number; t: number}> = ({ch, i, t}) => {
  if (t < 0) return null;
  const fg = isDark(ch.bg) ? C.paper : C.ink;
  const tag = ch.bg === C.red ? C.ink : C.red;
  const tp = spr(t, 0, POP, 22);
  return (
    <g>
      {/* 台标：开场的三个几何体停在这里 */}
      <circle cx={120} cy={100} r={22} fill={ch.bg === C.blue ? C.paper : C.blue} />
      <rect x={160} y={80} width={40} height={40} fill={ch.bg === C.red ? C.paper : C.red} />
      <polygon points={triPoints(52)} transform="translate(240 104)" fill={C.yellow} />
      <text x={290} y={112} fill={fg}>
        <tspan style={{...latin(30, 600), letterSpacing: 1}}>design style</tspan>
        <tspan dx={14} style={cjk(28, 700)} fillOpacity={0.55}>
          包豪斯
        </tspan>
      </text>

      {/* 进度 */}
      <text x={1610} y={112} textAnchor="end" fill={fg} style={{...latin(30, 600), letterSpacing: 1}}>
        {ch.no}
        <tspan fillOpacity={0.45}> / 09</tspan>
      </text>
      {CHAPTERS.map((_, j) => {
        const x = 1634 + j * 22;
        if (j === i) {
          return (
            <g key={j} transform={`translate(${x + 7} 100) scale(${0.4 + 0.6 * tp}) translate(${-x - 7} -100)`}>
              <rect x={x - 2} y={91} width={18} height={18} fill={tag} />
            </g>
          );
        }
        return j < i ? <rect key={j} x={x} y={93} width={14} height={14} fill={fg} /> : <rect key={j} x={x + 1} y={94} width={12} height={12} fill="none" stroke={fg} strokeOpacity={0.5} strokeWidth={2} />;
      })}

      {/* 章节标签 */}
      <g transform={`translate(140 948) scale(${tp}) translate(-140 -948)`}>
        <rect x={96} y={904} width={88} height={88} fill={tag} />
        <text x={140} y={964} textAnchor="middle" fill={C.paper} style={latin(44, 700)}>
          {ch.no}
        </text>
      </g>
      <Rise f={t} at={1} dy={24}>
        <text x={212} y={950} fill={fg}>
          <tspan style={cjk(58, 900)}>{ch.cn}</tspan>
          <tspan dx={18} style={latin(40, 500)} fillOpacity={0.55}>
            {ch.en}
          </tspan>
        </text>
      </Rise>
      <Rise f={t} at={4} dy={18}>
        <text x={214} y={994} fill={fg} fillOpacity={0.75} style={mixed(26, 500)}>
          {ch.credit}
        </text>
      </Rise>
    </g>
  );
};

/** 转场：圆 / 方 / 三角三种形状轮流“长”出下一章 */
const WipeShape: React.FC<{kind: number; p: number} & React.SVGProps<SVGElement>> = ({kind, p, ...rest}) => {
  if (kind === 0) return <circle cx={960} cy={540} r={1120 * p} {...(rest as React.SVGProps<SVGCircleElement>)} />;
  if (kind === 1)
    return (
      <rect
        x={-1100 * p}
        y={-1100 * p}
        width={2200 * p}
        height={2200 * p}
        transform={`translate(960 540) rotate(${90 * (1 - p)})`}
        {...(rest as React.SVGProps<SVGRectElement>)}
      />
    );
  return <polygon points={triPoints(4400 * p)} transform="translate(960 600)" {...(rest as React.SVGProps<SVGPolygonElement>)} />;
};

const ChapterLayer: React.FC<{ch: Chapter; i: number; f: number}> = ({ch, i, f}) => {
  const t = f - ch.start;
  const p = tween(f, ch.start - WIPE, WIPE, 0, 1, E.in);
  const clipped = t < 0;
  const Scene = ch.Scene;
  const body = (
    <g>
      <rect x={-40} y={-40} width={W + 80} height={H + 80} fill={ch.bg} />
      <Scene t={t} />
      <Chrome ch={ch} i={i} t={t} />
    </g>
  );
  if (!clipped) return body;
  return (
    <g>
      <clipPath id={`wipe-${i}`}>
        <WipeShape kind={i % 3} p={p} />
      </clipPath>
      <g clipPath={`url(#wipe-${i})`}>{body}</g>
      <WipeShape kind={i % 3} p={p} fill="none" stroke={C.yellow} strokeWidth={16} strokeLinejoin="miter" />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* 回顾：九宫格                                                        */
/* ------------------------------------------------------------------ */

const CW = 576;
const CH = 324;
const Recap: React.FC<{f: number}> = ({f}) => {
  const t = f - RECAP;
  const band = tween(f, RECAP + 22, 14, 0, 1, E.inOut);
  return (
    <g>
      <rect x={-40} y={-40} width={W + 80} height={H + 80} fill={C.ink} />
      {CHAPTERS.map((ch, i) => {
        const c = i % 3;
        const r = Math.floor(i / 3);
        const x = 78 + c * 594;
        const y = 36 + r * 342;
        const order = 2 - c + (2 - r);
        let tr: string;
        if (i === CHAPTERS.length - 1) {
          const p = spr(t, 0, SMOOTH, 24);
          tr = `translate(${x * p} ${y * p}) scale(${1 + (0.3 - 1) * p})`;
        } else {
          const p = spr(t, 4 + order * 3, POP, 26);
          if (p <= 0.001) return null;
          tr = `translate(${x + CW / 2} ${y + CH / 2}) scale(${0.3 * p}) translate(${-W / 2} ${-H / 2})`;
        }
        const tagP = spr(t, 12 + order * 3, POP, 22);
        const tag = ch.bg === C.red ? C.ink : C.red;
        const Scene = ch.Scene;
        return (
          <g key={i} transform={tr}>
            <clipPath id={`recap-${i}`}>
              <rect width={W} height={H} />
            </clipPath>
            <g clipPath={`url(#recap-${i})`}>
              <rect width={W} height={H} fill={ch.bg} />
              <Scene t={ch.dur + t} />
              <rect width={W} height={H} fill="none" stroke={C.paper} strokeOpacity={0.3} strokeWidth={8} />
              <g transform={`translate(0 ${(1 - tagP) * 160})`}>
                <rect x={0} y={H - 150} width={ch.cn.length > 2 ? 660 : 560} height={150} fill={tag} />
                <text x={52} y={H - 44} fill={C.paper}>
                  <tspan style={latin(88, 700)}>{ch.no}</tspan>
                  <tspan dx={36} style={cjk(88, 900)}>
                    {ch.cn}
                  </tspan>
                </text>
              </g>
            </g>
          </g>
        );
      })}
      {/* 字幕条 */}
      {band > 0 && (
        <g>
          <rect x={0} y={486} width={W * band} height={108} fill={C.paper} />
          <rect x={0} y={486} width={22} height={108} fill={C.red} opacity={band} />
          <Rise f={f} at={RECAP + 28} dy={20}>
            <text x={110} y={562} fill={C.ink} style={cjk(62, 900)}>
              一所学校，九种样子。
            </text>
            <text x={1810} y={556} textAnchor="end" fill={C.ink} style={{...latin(34, 500), letterSpacing: 1}}>
              1919—1933 · weimar · dessau · berlin
            </text>
          </Rise>
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* 片尾                                                                */
/* ------------------------------------------------------------------ */

const EndCard: React.FC<{f: number}> = ({f}) => {
  const circleIn = spr(f, 784, SNAP, 34);
  const squareIn = spr(f, 798, POP, 30);
  return (
    <g>
      <rect x={-40} y={-40} width={W + 80} height={H + 80} fill={C.yellow} />
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
          design style
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
          github.com/guanmo-ai/design-style
        </text>
      </Rise>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* 主合成                                                              */
/* ------------------------------------------------------------------ */

const HITS: [number, number][] = [
  [15, 7],
  [32, 9],
  ...CHAPTERS.map((ch) => [ch.start, 5] as [number, number]),
  [336, 3],
  [346, 3],
  [356, 3],
  [572, 3],
  [RECAP, 8],
  [782, 10],
];

export const Bauhaus: React.FC = () => {
  const f = useCurrentFrame();
  const cam = shake(f, HITS);
  const endP = tween(f, END - 8, 8, 0, 1, E.in);
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <Audio src={staticFile('001-bauhaus/music.wav')} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g transform={`translate(${cam.x} ${cam.y})`}>
          {f < CHAPTERS[0].start && <Hook f={f} />}
          {CHAPTERS.map((ch, i) =>
            f >= ch.start - WIPE && f < Math.min(ch.start + ch.dur, RECAP) ? <ChapterLayer key={ch.no} ch={ch} i={i} f={f} /> : null,
          )}
          {f >= RECAP && f < END && <Recap f={f} />}
          {f >= END - 8 && (
            <g>
              {f < END && (
                <clipPath id="end-wipe">
                  <circle cx={960} cy={540} r={1120 * endP} />
                </clipPath>
              )}
              <g clipPath={f < END ? 'url(#end-wipe)' : undefined}>
                <EndCard f={f} />
              </g>
            </g>
          )}
        </g>
      </svg>
      <Grain opacity={0.075} />
      <Vignette strength={f >= END ? 0.05 : 0.14} />
    </AbsoluteFill>
  );
};
