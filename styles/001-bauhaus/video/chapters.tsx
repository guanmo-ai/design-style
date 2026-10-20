/**
 * 001 · 包豪斯 —— 九个章节
 * 每个场景都是 React.FC<{t}>：t 为章节内帧号（0 = 章节起点，落在节拍上），
 * 坐标系为整张 1920×1080 画面；背景色、转场与章节标签由 Bauhaus.tsx 统一绘制。
 *
 *   01 色彩   伊顿十二色相环          06 家具   布劳耶 B3 钢管椅
 *   02 形与色 康定斯基问卷            07 灯具   瓦根菲尔德 WG24 台灯
 *   03 字体   拜耶 universal 全小写   08 纺织   安妮·阿尔伯斯 壁挂
 *   04 海报   三张致敬海报            09 舞台   施莱默 三元芭蕾
 *   05 建筑   格罗皮乌斯 德绍校舍
 */
import React from 'react';
import {interpolateColors} from 'remotion';
import {clamp, E, POP, SMOOTH, SNAP, spr, tween} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';
import {cjk, latin, mixed, mono, polar, pts, Rise, Spec, triPoints} from './ui';

export type SceneFC = React.FC<{t: number}>;

/** 以 (x, y) 为中心缩放 */
const About: React.FC<{x: number; y: number; s: number; r?: number; o?: number; children: React.ReactNode}> = ({x, y, s, r = 0, o = 1, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s}) translate(${-x} ${-y})`} opacity={o}>
    {children}
  </g>
);

/** 按进度描边 */
const Draw: React.FC<{d: string; p: number} & React.SVGProps<SVGPathElement>> = ({d, p, ...rest}) =>
  p <= 0.001 ? null : <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} fill="none" {...rest} />;

const monoCjk = (size: number, weight = 500): React.CSSProperties => ({...mono(size, weight), fontFamily: `'JetBrains Mono', ${FONT.cjk}`});

/* ================================================================== */
/* 01 色彩 · 约翰内斯·伊顿的十二色相环                                 */
/* ================================================================== */

export const HUES = ['#F2B419', '#EE9A1E', '#E8781F', '#E05822', '#DB3A26', '#B5334E', '#7D3C79', '#4C4592', '#1F4FA3', '#1D7A8C', '#2E8B4E', '#8DAA2C'];
const ORANGE = HUES[2];
const VIOLET = HUES[6];
const GREEN = HUES[10];

export const ColorScene: SceneFC = ({t}) => {
  const cx = 700;
  const cy = 520;
  const Rt = 170;
  const r1 = 228;
  const r2 = 336;
  const v = (deg: number, r = Rt) => polar(r, deg);
  const O = [0, 0];
  const [V0, V1, V2] = [v(-90), v(30), v(150)];
  const [A, B, Cc] = [v(-30), v(90), v(210)];
  const [M01, M12, M20] = [v(-30, Rt / 2), v(90, Rt / 2), v(210, Rt / 2)];
  const kites: [number[][], string][] = [
    [[O, M20, V0, M01], C.yellow],
    [[O, M01, V1, M12], C.red],
    [[O, M12, V2, M20], C.blue],
  ];
  const caps: [number[][], number[], string][] = [
    [[V0, A, V1], M01, ORANGE],
    [[V1, B, V2], M12, VIOLET],
    [[V2, Cc, V0], M20, GREEN],
  ];
  const seg = (i: number) => {
    const a0 = -105 + 30 * i;
    const a1 = a0 + 30;
    const [x0, y0] = polar(r2, a0);
    const [x1, y1] = polar(r2, a1);
    const [x2, y2] = polar(r1, a1);
    const [x3, y3] = polar(r1, a0);
    return `M ${x0} ${y0} A ${r2} ${r2} 0 0 1 ${x1} ${y1} L ${x2} ${y2} A ${r1} ${r1} 0 0 0 ${x3} ${y3} Z`;
  };
  const ringRot = -70 * (1 - spr(t, 12, SMOOTH, 44));
  const guide = tween(t, 0, 30, 0, 1, E.out);

  const rows = [
    {y: 262, cn: '三原色', en: 'primary', cols: [C.yellow, C.red, C.blue], marks: ['Y', 'R', 'B'], w: 96, gap: 12, at: 4, step: 2},
    {y: 466, cn: '三间色', en: 'secondary', cols: [ORANGE, VIOLET, GREEN], marks: ['Y+R', 'R+B', 'B+Y'], w: 96, gap: 12, at: 10, step: 2},
    {y: 670, cn: '十二色相', en: '12 hues', cols: HUES, marks: [] as string[], w: 42, gap: 6, at: 18, step: 1.5},
  ];

  return (
    <g>
      <g transform={`translate(${cx} ${cy})`}>
        <circle r={r2 + 22} fill="none" stroke={C.ink} strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - guide} transform="rotate(-90)" />
        <circle r={r1 - 24} fill="none" stroke={C.ink} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="4 10" opacity={guide} />
        <g transform={`rotate(${ringRot})`}>
          {HUES.map((col, i) => {
            const p = spr(t, 12 + i * 2, POP, 26);
            if (p <= 0.001) return null;
            return <path key={i} d={seg(i)} fill={col} stroke={C.paper} strokeWidth={6} transform={`scale(${0.72 + 0.28 * p})`} opacity={clamp(p * 2)} />;
          })}
        </g>
        {caps.map(([poly, m, col], i) => {
          const p = spr(t, 6 + i * 2, POP, 24);
          return (
            <g key={i} transform={`translate(${m[0]} ${m[1]}) scale(${p}) translate(${-m[0]} ${-m[1]})`}>
              <polygon points={pts(poly)} fill={col} stroke={C.paper} strokeWidth={5} strokeLinejoin="round" />
            </g>
          );
        })}
        {kites.map(([poly, col], i) => (
          <g key={i} transform={`scale(${spr(t, i * 2, POP, 24)})`}>
            <polygon points={pts(poly)} fill={col} stroke={C.paper} strokeWidth={5} strokeLinejoin="round" />
          </g>
        ))}
      </g>

      {/* 图例 */}
      {rows.map((row) => (
        <g key={row.cn}>
          <Rise f={t} at={row.at} dy={20}>
            <text x={1180} y={row.y} fill={C.ink}>
              <tspan style={cjk(34, 900)}>{row.cn}</tspan>
              <tspan dx={14} style={latin(28, 500)} fill={C.gray}>
                {row.en}
              </tspan>
            </text>
          </Rise>
          {row.cols.map((col, j) => {
            const x = 1180 + j * (row.w + row.gap);
            const y = row.y + 24;
            const p = spr(t, row.at + 2 + j * row.step, POP, 22);
            return (
              <About key={j} x={x + row.w / 2} y={y + 48} s={p}>
                <rect x={x} y={y} width={row.w} height={96} fill={col} />
                {row.marks[j] && (
                  <text x={x + row.w / 2} y={y + 58} textAnchor="middle" fill={j === 0 && row.cn === '三原色' ? C.ink : C.paper} style={mono(17, 600)}>
                    {row.marks[j]}
                  </text>
                )}
              </About>
            );
          })}
        </g>
      ))}
    </g>
  );
};

/* ================================================================== */
/* 02 形与色 · 康定斯基 1923 年的问卷                                   */
/* ================================================================== */

export const FormScene: SceneFC = ({t}) => {
  const items = [
    {x: 560, kind: 'tri', col: C.yellow, zh: '黄', en: 'yellow', at: 12},
    {x: 960, kind: 'sq', col: C.red, zh: '红', en: 'red', at: 21},
    {x: 1360, kind: 'ci', col: C.blue, zh: '蓝', en: 'blue', at: 30},
  ] as const;
  const cy = 510;
  return (
    <g>
      <Rise f={t} at={0} dy={24}>
        <text x={960} y={236} textAnchor="middle" fill={C.paper} style={cjk(58, 900)}>
          三角、方、圆 —— 各是什么颜色？
        </text>
      </Rise>
      {items.map((it, i) => {
        const draw = tween(t, 2 + i * 2, 18, 0, 1, E.out);
        const p = spr(t, it.at, POP, 26);
        const lab = spr(t, it.at + 3, SNAP, 24);
        const shape = (props: React.SVGProps<SVGElement>) =>
          it.kind === 'tri' ? (
            <polygon points={triPoints(320)} transform="translate(0 46)" {...(props as React.SVGProps<SVGPolygonElement>)} />
          ) : it.kind === 'sq' ? (
            <rect x={-128} y={-128} width={256} height={256} {...(props as React.SVGProps<SVGRectElement>)} />
          ) : (
            <circle r={134} transform="rotate(-90)" {...(props as React.SVGProps<SVGCircleElement>)} />
          );
        return (
          <g key={i} transform={`translate(${it.x} ${cy})`}>
            <rect x={-180} y={-180} width={360} height={360} fill="none" stroke={C.paper} strokeOpacity={0.24 * draw} strokeWidth={2} strokeDasharray="10 10" />
            <text x={-166} y={-150} fill={C.paper} fillOpacity={0.45 * draw} style={mono(18, 500)}>
              {`0${i + 1}`}
            </text>
            {shape({fill: 'none', stroke: C.paper, strokeWidth: 5, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw, strokeLinejoin: 'miter'})}
            {t < it.at ? (
              <text y={38} textAnchor="middle" fill={C.paper} fillOpacity={0.5 * draw} style={latin(112, 500)}>
                ?
              </text>
            ) : (
              <g transform={`scale(${0.6 + 0.4 * p})`}>{shape({fill: it.col})}</g>
            )}
            <g opacity={clamp(lab * 1.4)} transform={`translate(0 ${(1 - lab) * 20})`}>
              <text x={0} y={272} textAnchor="middle" fill={C.paper}>
                <tspan style={cjk(56, 900)}>{it.zh}</tspan>
                <tspan dx={14} style={latin(34, 500)} fillOpacity={0.6}>
                  {it.en}
                </tspan>
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};

/* ================================================================== */
/* 03 字体 · 拜耶 universal：只用圆与直线、只用小写                     */
/* ================================================================== */

const XH = 240; // x 高
const SW = 46; // 笔画
const ASC = 120; // 上伸部
const R = (XH - SW) / 2;
const RS = (XH - SW) / 4;
const L = SW / 2;
type Glyph = {w: number; paths: string[]; circles: [number, number, number][]; disc?: [number, number]};
const GLYPHS: Record<string, Glyph> = {
  b: {
    w: SW + 2 * R,
    paths: [`M ${L} ${-ASC} L ${L} ${XH}`, `M ${L + R} ${L} A ${R} ${R} 0 1 1 ${L + R - 0.01} ${L}`],
    circles: [[L + R, XH / 2, R]],
    disc: [L + R, XH / 2],
  },
  a: {
    w: SW + 2 * R,
    paths: [`M ${L + R} ${L} A ${R} ${R} 0 1 0 ${L + R + 0.01} ${L}`, `M ${L + 2 * R} 0 L ${L + 2 * R} ${XH}`],
    circles: [[L + R, XH / 2, R]],
    disc: [L + R, XH / 2],
  },
  u: {
    w: SW + 2 * R,
    paths: [`M ${L} 0 L ${L} ${XH / 2} A ${R} ${R} 0 0 0 ${L + 2 * R} ${XH / 2} L ${L + 2 * R} 0`, `M ${L + 2 * R} ${XH / 2} L ${L + 2 * R} ${XH}`],
    circles: [[L + R, XH / 2, R]],
  },
  h: {
    w: SW + 2 * R,
    paths: [`M ${L} ${-ASC} L ${L} ${XH}`, `M ${L} ${XH} L ${L} ${XH / 2} A ${R} ${R} 0 0 1 ${L + 2 * R} ${XH / 2} L ${L + 2 * R} ${XH}`],
    circles: [[L + R, XH / 2, R]],
  },
  s: {
    w: SW + 2 * RS,
    paths: [`M ${L + 2 * RS} ${L + RS} A ${RS} ${RS} 0 1 0 ${L + RS} ${L + 2 * RS} A ${RS} ${RS} 0 1 1 ${L} ${L + 3 * RS}`],
    circles: [
      [L + RS, L + RS, RS],
      [L + RS, L + 3 * RS, RS],
    ],
  },
};
const WORD = 'bauhaus';
const GAP = 34;
const DISC: Record<number, string> = {0: C.blue, 1: C.red, 4: C.yellow};

export const TypeScene: SceneFC = ({t}) => {
  const k = 0.8;
  let cursor = 0;
  const items = WORD.split('').map((ch, i) => {
    const g = GLYPHS[ch];
    const x0 = cursor;
    cursor += g.w + GAP;
    return {g, x0, i};
  });
  const total = cursor - GAP;
  const tx = 960 - (total * k) / 2;
  const ty = 380;
  const fade = 1 - 0.65 * tween(t, 44, 16, 0, 1, E.inOut);
  const guides: [number, string][] = [
    [-ASC, 'ascender'],
    [0, 'x-height'],
    [XH, 'baseline'],
  ];
  const reveal = tween(t, 44, 28, 0, 1, (x) => x);
  const AW = 1430;
  return (
    <g>
      {/* 构造线 */}
      <g opacity={fade}>
        {guides.map(([gy, name], i) => {
          const y = ty + gy * k;
          const p = tween(t, i * 3, 16, 0, 1, E.out);
          return (
            <g key={name}>
              <line x1={150} x2={150 + 1620 * p} y1={y} y2={y} stroke={C.red} strokeWidth={2} />
              <text x={1770} y={y - 10} textAnchor="end" fill={C.red} opacity={p} style={mono(17, 500)}>
                {name}
              </text>
            </g>
          );
        })}
      </g>
      <g transform={`translate(${tx} ${ty}) scale(${k})`}>
        {items.map(({g, x0, i}) => {
          const start = 6 + i * 3;
          const dp = DISC[i] ? spr(t, 22 + i * 3, POP, 26) : 0;
          return (
            <g key={i} transform={`translate(${x0} 0)`}>
              <g opacity={fade}>
                {g.circles.map(([ccx, ccy, rr], j) => (
                  <circle key={j} cx={ccx} cy={ccy} r={rr} fill="none" stroke={C.red} strokeWidth={2.5} strokeDasharray="7 9" opacity={tween(t, 2 + i * 2, 10, 0, 1)} />
                ))}
              </g>
              {DISC[i] && g.disc && <circle cx={g.disc[0]} cy={g.disc[1]} r={(R - SW / 2 + 2) * dp} fill={DISC[i]} />}
              {g.paths.map((d, j) => (
                <Draw key={j} d={d} p={tween(t, start + j * 3, 18, 0, 1, E.out)} stroke={C.ink} strokeWidth={SW} strokeLinecap="butt" />
              ))}
            </g>
          );
        })}
      </g>
      <rect x={tx} y={612} width={200 * spr(t, 34, SNAP, 26)} height={12} fill={C.red} />

      {/* 全小写字母表 */}
      <clipPath id="type-alpha">
        <rect x={tx - 10} y={660} width={(AW + 20) * reveal} height={110} />
      </clipPath>
      <g clipPath="url(#type-alpha)">
        <text x={tx} y={742} textLength={AW} lengthAdjust="spacing" fill={C.ink} style={latin(64, 500)}>
          abcdefghijklmnopqrstuvwxyz
        </text>
      </g>
      {t >= 44 && t < 76 && <rect x={tx + AW * reveal + 4} y={690} width={6} height={62} fill={C.red} />}
      <Rise f={t} at={60} dy={16}>
        <text x={tx} y={806} fill={C.gray} style={monoCjk(21, 500)}>
          universal · 1925 —— 只用小写，一个字母只有一种形状。
        </text>
      </Rise>
    </g>
  );
};

/* ================================================================== */
/* 04 海报 · 三张致敬海报                                               */
/* ================================================================== */

const PW = 420;
const PH = 630;
const PY = 160;
const PX = [270, 750, 1230];

const Poster: React.FC<{t: number; i: number; at: number; rot: number; bg: string; children: (lt: number) => React.ReactNode}> = ({t, i, at, rot, bg, children}) => {
  if (t < at) return null;
  const p = spr(t, at, SNAP, 36);
  const y = PY - (1 - p) * 900;
  const r = rot * (1 - p);
  return (
    <g transform={`translate(${PX[i] + PW / 2} ${y + PH / 2}) rotate(${r}) translate(${-PW / 2} ${-PH / 2})`}>
      <rect x={16} y={16} width={PW} height={PH} fill={C.ink} opacity={0.32} />
      <clipPath id={`poster-${i}`}>
        <rect width={PW} height={PH} />
      </clipPath>
      <g clipPath={`url(#poster-${i})`}>
        <rect width={PW} height={PH} fill={bg} />
        {children(t - at)}
      </g>
    </g>
  );
};

export const PosterScene: SceneFC = ({t}) => {
  const a = (lt: number, d: number) => spr(lt, d, POP, 26);
  const fadeIn = (lt: number, d: number) => clamp((lt - d) / 8);
  return (
    <g>
      <Poster t={t} i={0} at={0} rot={-8} bg={C.paper}>
        {(lt) => (
          <>
            <text x={28} y={50} fill={C.ink} opacity={fadeIn(lt, 4)} style={mono(16, 600)}>
              staatliches bauhaus
            </text>
            <text x={28} y={74} fill={C.gray} opacity={fadeIn(lt, 6)} style={mono(15, 500)}>
              weimar · juli—sept
            </text>
            <circle cx={200} cy={240} r={118 * a(lt, 8)} fill={C.red} />
            <g transform={`translate(214 384) rotate(-28) scale(${spr(lt, 12, SNAP, 24)} 1)`}>
              <rect x={-100} y={-18} width={430} height={36} fill={C.ink} />
            </g>
            <About x={276} y={446} s={a(lt, 16)}>
              <rect x={214} y={384} width={124} height={124} fill={C.blue} />
            </About>
            <g transform={`translate(${74} ${606 + (1 - spr(lt, 14, SNAP, 26)) * 300}) rotate(-90)`}>
              <text x={0} y={0} fill={C.ink} style={latin(50, 600)}>
                ausstellung
              </text>
            </g>
            <text x={396} y={606} textAnchor="end" fill={C.ink} opacity={fadeIn(lt, 18)} style={{...latin(104, 700), letterSpacing: -3}}>
              1923
            </text>
          </>
        )}
      </Poster>
      <Poster t={t} i={1} at={10} rot={6} bg={C.yellow}>
        {(lt) => (
          <>
            <g opacity={fadeIn(lt, 6)} transform={`translate(0 ${(1 - spr(lt, 6, SNAP, 26)) * 40})`}>
              <text x={18} y={176} fill={C.ink} style={{...latin(168, 700), letterSpacing: -6}}>
                bau
              </text>
            </g>
            <g opacity={fadeIn(lt, 10)} transform={`translate(0 ${(1 - spr(lt, 10, SNAP, 26)) * 40})`}>
              <text x={18} y={330} fill={C.ink} style={{...latin(168, 700), letterSpacing: -6}}>
                haus
              </text>
            </g>
            <rect x={28} y={364} width={364 * spr(lt, 14, SNAP, 24)} height={26} fill={C.red} />
            <circle cx={322} cy={496} r={72 * a(lt, 18)} fill={C.ink} />
            <text x={28} y={474} fill={C.ink} opacity={fadeIn(lt, 18)} style={latin(38, 600)}>
              eröffnung
            </text>
            <text x={28} y={522} fill={C.ink} opacity={fadeIn(lt, 20)} style={latin(38, 500)}>
              4.12.1926
            </text>
            <text x={28} y={604} fill={C.ink} opacity={fadeIn(lt, 22)} style={mono(15, 600)}>
              bauhaus dessau
            </text>
          </>
        )}
      </Poster>
      <Poster t={t} i={2} at={20} rot={-5} bg={C.ink}>
        {(lt) => {
          const band = spr(lt, 6, SNAP, 28);
          return (
            <>
              <polygon points="0,640 0,500 420,170 420,310" fill={C.red} transform={`translate(${-(1 - band) * 520} ${(1 - band) * 420})`} />
              <circle cx={272} cy={196} r={104 * a(lt, 10)} fill={C.blue} />
              <About x={124} y={470} s={a(lt, 14)} r={(1 - a(lt, 14)) * -90}>
                <polygon points={triPoints(180)} transform="translate(124 470)" fill={C.yellow} />
              </About>
              <g transform={`translate(352 ${300 - (1 - spr(lt, 12, SNAP, 26)) * 300}) rotate(90)`}>
                <text x={0} y={0} fill={C.paper} style={latin(64, 700)}>
                  bauhaus
                </text>
              </g>
              <text x={28} y={604} fill={C.paper} opacity={fadeIn(lt, 20)} style={mono(15, 600)}>
                vorträge · musik · tanz
              </text>
            </>
          );
        }}
      </Poster>
    </g>
  );
};

/* ================================================================== */
/* 05 建筑 · 格罗皮乌斯的德绍校舍                                       */
/* ================================================================== */

export const ArchScene: SceneFC = ({t}) => {
  const WX = 440;
  const WR = 1620;
  const ROOF = 318;
  const GT = 372;
  const GB = 690;
  const GROUND = 800;
  const ground = tween(t, 0, 14, 0, 1);
  const tower = spr(t, 2, SNAP, 26);
  const wing = spr(t, 6, SMOOTH, 34);
  const mull = tween(t, 12, 22, 0, 1, E.inOut);
  const sunY = 430 - 140 * spr(t, 8, SMOOTH, 36);
  const refl = tween(t, 18, 40, 0, 1, E.inOut);
  const ww = WR - WX;
  const ox = WX - 420 + refl * (ww + 700);
  const cols = 28;
  return (
    <g>
      <circle cx={1470} cy={sunY} r={112} fill={C.yellow} />
      {/* 工作坊翼：玻璃幕墙 */}
      <clipPath id="arch-wing">
        <rect x={WX - 4} y={ROOF - 10} width={(ww + 8) * wing} height={GROUND - ROOF + 10} />
      </clipPath>
      <clipPath id="arch-glass">
        <rect x={WX} y={GT} width={ww} height={GB - GT} />
      </clipPath>
      <clipPath id="arch-mull">
        <rect x={WX} y={GT} width={ww * mull} height={GB - GT} />
      </clipPath>
      <g clipPath="url(#arch-wing)">
        <rect x={WX} y={ROOF} width={ww} height={GT - ROOF} fill={C.white} />
        <rect x={WX} y={GT} width={ww} height={GB - GT} fill="#2C3F59" />
        <g clipPath="url(#arch-glass)">
          <polygon points={`${ox},${GB} ${ox + 170},${GB} ${ox + 400},${GT} ${ox + 230},${GT}`} fill="#4E6A8F" opacity={0.75} />
          <polygon points={`${ox + 220},${GB} ${ox + 270},${GB} ${ox + 500},${GT} ${ox + 450},${GT}`} fill="#4E6A8F" opacity={0.55} />
        </g>
        <g clipPath="url(#arch-mull)" stroke="#E9E4DA">
          {Array.from({length: cols - 1}, (_, j) => {
            const x = WX + ((j + 1) * ww) / cols;
            return <line key={j} x1={x} x2={x} y1={GT} y2={GB} strokeWidth={3} />;
          })}
          {[1, 2, 3, 4, 5].map((k) => {
            const y = GT + (k * (GB - GT)) / 6;
            return <line key={k} x1={WX} x2={WR} y1={y} y2={y} strokeWidth={k % 2 === 0 ? 7 : 3} />;
          })}
        </g>
        <rect x={WX} y={GB} width={ww} height={46} fill={C.white} />
        <rect x={WX + 24} y={GB + 46} width={ww - 24} height={GROUND - GB - 46} fill="#3A3631" />
        {Array.from({length: 9}, (_, j) => (
          <rect key={j} x={WX + 70 + j * 124} y={GB + 64} width={84} height={20} fill="#E9E4DA" opacity={0.28} />
        ))}
        <rect x={WX} y={ROOF} width={ww} height={GROUND - ROOF} fill="none" stroke={C.ink} strokeWidth={4} />
      </g>
      {/* 楼梯塔 + 竖排字标 */}
      <g transform={`translate(0 ${GROUND}) scale(1 ${tower}) translate(0 ${-GROUND})`}>
        <rect x={300} y={240} width={140} height={GROUND - 240} fill={C.white} stroke={C.ink} strokeWidth={4} />
      </g>
      {'BAUHAUS'.split('').map((ch, i) => {
        const p = spr(t, 16 + i * 2, POP, 22);
        const y = 312 + i * 66;
        return (
          <About key={i} x={370} y={y - 18} s={p}>
            <text x={370} y={y} textAnchor="middle" fill={C.ink} style={latin(52, 600)}>
              {ch}
            </text>
          </About>
        );
      })}
      <line x1={140} x2={140 + 1640 * ground} y1={GROUND} y2={GROUND} stroke={C.ink} strokeWidth={6} />
      <Spec f={t} at={26} ax={760} ay={ROOF} lx={640} ly={200} w={250} text="平屋顶 · flat roof" id="arch-1" line={C.ink} />
      <Spec f={t} at={32} ax={1240} ay={560} lx={1290} ly={836} w={330} text="玻璃幕墙 · curtain wall" id="arch-2" line={C.ink} />
    </g>
  );
};

/* ================================================================== */
/* 06 家具 · 布劳耶的 B3 钢管椅（侧视）                                 */
/* ================================================================== */

const TUBES = ['M 0 0 L 520 0', 'M 40 0 L 40 -290 Q 40 -330 80 -330 L 497 -330', 'M 470 0 L 520 -600', 'M 40 -250 L 487 -200'];
const STRAPS: [number, number, number, number, number][] = [
  [64, -266, 476, -218, 30],
  [474, -236, 501, -566, 36],
  [60, -298, 480, -298, 24],
];

export const ChairScene: SceneFC = ({t}) => {
  const OX = 700;
  const OY = 822;
  const floor = tween(t, 0, 18, 0, 1);
  return (
    <g>
      <line x1={960 - 700 * floor} x2={960 + 700 * floor} y1={OY} y2={OY} stroke={C.paper} strokeOpacity={0.4} strokeWidth={3} />
      <ellipse cx={960} cy={OY + 4} rx={330 * floor} ry={16} fill={C.ink} opacity={0.22} />
      <g transform={`translate(${OX} ${OY})`}>
        {TUBES.map((d, i) => {
          const p = tween(t, i * 4, 20, 0, 1, E.out);
          return (
            <g key={i}>
              <Draw d={d} p={p} stroke={C.ink} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
              <Draw d={d} p={p} stroke="#D8D3CA" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
              <Draw d={d} p={p} stroke={C.white} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" transform="translate(-2 -3)" />
            </g>
          );
        })}
        {STRAPS.map(([x1, y1, x2, y2, w], i) => {
          const p = tween(t, 18 + i * 4, 14, 0, 1, E.out);
          if (p <= 0.001) return null;
          return <line key={i} x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={C.ink} strokeWidth={w} />;
        })}
      </g>
      <Spec f={t} at={30} ax={OX + 40} ay={OY - 150} lx={300} ly={560} w={310} text="ø20 钢管 · 冷弯成型" id="chair-1" />
      <Spec f={t} at={36} ax={OX + 488} ay={OY - 400} lx={1300} ly={310} w={280} text="eisengarn 铁纱布" id="chair-2" />
    </g>
  );
};

/* ================================================================== */
/* 07 灯具 · 瓦根菲尔德 WG24 台灯                                       */
/* ================================================================== */

const METAL = '#CFCAC0';
export const LAMP_ON = 32;

export const LampScene: SceneFC = ({t}) => {
  const on = t >= LAMP_ON ? spr(t, LAMP_ON, POP, 24) : 0;
  const rise = spr(t, 0, SNAP, 26);
  const dome = spr(t, 6, SNAP, 28);
  const chain = spr(t, 12, SNAP, 20);
  const pull = t >= 20 && t < 32 ? Math.sin(((t - 20) / 12) * Math.PI) : 0;
  const shade = interpolateColors(clamp((t - LAMP_ON) / 5), [0, 1], ['#5E5A53', '#FFF1C9']);
  const flash = t >= LAMP_ON ? 0.16 * (1 - tween(t, LAMP_ON, 14, 0, 1)) : 0;
  return (
    <g>
      {/* 光晕（阶梯式同心圆） */}
      {on > 0 &&
        [
          [580, 0.05],
          [440, 0.07],
          [320, 0.1],
        ].map(([r, o], i) => <circle key={i} cx={960} cy={390} r={r * (0.6 + 0.4 * on)} fill={C.yellow} opacity={o * Math.min(1, on)} />)}
      {on > 0 && <ellipse cx={960} cy={804} rx={420 * on} ry={40} fill={C.yellow} opacity={0.22} />}
      {/* 底座 + 玻璃灯杆 */}
      <g transform={`translate(0 800) scale(1 ${rise}) translate(0 -800)`}>
        <rect x={950} y={470} width={20} height={312} fill={C.paper} fillOpacity={0.14} stroke={C.paper} strokeOpacity={0.6} strokeWidth={2} />
        <line x1={960} x2={960} y1={476} y2={780} stroke={C.paper} strokeOpacity={0.75} strokeWidth={2} />
        <rect x={850} y={780} width={220} height={22} rx={5} fill={METAL} />
        <rect x={858} y={782} width={204} height={4} rx={2} fill={C.white} opacity={0.7} />
        <rect x={922} y={462} width={76} height={12} fill={METAL} />
      </g>
      {/* 拉链开关 */}
      {chain > 0 && (
        <g opacity={chain}>
          <line x1={1080} x2={1080} y1={476} y2={560 + pull * 28} stroke={METAL} strokeWidth={3} strokeDasharray="3 5" />
          <circle cx={1080} cy={566 + pull * 28} r={8} fill={METAL} />
        </g>
      )}
      {/* 乳白玻璃灯罩 */}
      <g transform={`translate(0 ${-(1 - dome) * 320})`} opacity={clamp(dome * 1.5)}>
        <path d="M 790 470 A 175 175 0 1 1 1130 470 Z" fill={shade} stroke={C.paper} strokeOpacity={0.3} strokeWidth={2} />
        {on > 0 && <ellipse cx={960} cy={462} rx={150} ry={14} fill={C.white} opacity={0.85 * Math.min(1, on)} />}
        <rect x={784} y={466} width={352} height={10} rx={3} fill={METAL} />
      </g>
      {flash > 0 && <rect x={-40} y={-40} width={2000} height={1160} fill={C.yellow} opacity={flash} />}
      <Spec f={t} at={40} ax={1050} ay={330} lx={1200} ly={236} w={330} text="乳白玻璃灯罩 · opal glass" id="lamp-1" box={C.paper} />
      <Spec f={t} at={46} ax={970} ay={650} lx={1120} ly={640} w={340} text="透明玻璃灯杆 · clear glass" id="lamp-2" box={C.paper} />
    </g>
  );
};

/* ================================================================== */
/* 08 纺织 · 安妮·阿尔伯斯的壁挂：织布机就是网格                       */
/* ================================================================== */

const WH = '#FBF8F1';
const TEX: Record<string, [string, string]> = {
  K: [C.ink, C.ink],
  W: [WH, WH],
  R: [C.red, C.red],
  Y: [C.yellow, C.yellow],
  B: [C.blue, C.blue],
  G: [C.gray, C.gray],
  RK: [C.red, C.ink],
  KW: [C.ink, WH],
  YW: [C.yellow, WH],
  GW: [C.gray, WH],
  BW: [C.blue, WH],
};
const WEAVE = [
  ['K', 'RK', 'W', 'Y', 'KW'],
  ['YW', 'R', 'K', 'GW', 'B'],
  ['W', 'KW', 'Y', 'K', 'R'],
  ['R', 'G', 'BW', 'W', 'K'],
  ['KW', 'Y', 'K', 'RK', 'W'],
  ['B', 'W', 'R', 'YW', 'K'],
];
const CB = [0, 5, 9, 16, 20, 25];
const RB = [0, 6, 11, 17, 22, 27, 31];
const TX = 460;
const TY = 170;
const CW = 40;
const RH = 20;
const ROWS = 31;
const TW = 1000;

export const TextileScene: SceneFC = ({t}) => {
  const frame = tween(t, 0, 10, 0, 1);
  const cells: React.ReactNode[] = [];
  let shuttle: {x: number; y: number} | null = null;
  for (let r = 0; r < ROWS; r++) {
    const k = ROWS - 1 - r; // 自下而上
    const s = 4 + k * 1.25;
    const p = clamp((t - s) / 3);
    if (p <= 0) continue;
    const band = RB.findIndex((b, i) => r >= b && r < RB[i + 1]);
    const dir = k % 2 === 0 ? 1 : -1;
    const w = TW * p;
    const x0 = dir > 0 ? TX : TX + TW - w;
    const y = TY + r * RH;
    for (let ci = 0; ci < CB.length - 1; ci++) {
      const a = TX + CB[ci] * CW;
      const b = TX + CB[ci + 1] * CW;
      const xa = Math.max(a, x0);
      const xb = Math.min(b, x0 + w);
      if (xb <= xa) continue;
      cells.push(<rect key={`${r}-${ci}`} x={xa} y={y} width={xb - xa + 0.6} height={RH + 0.6} fill={TEX[WEAVE[band][ci]][r % 2]} />);
    }
    if (p < 1) shuttle = {x: dir > 0 ? x0 + w : x0, y: y + RH / 2};
  }
  return (
    <g>
      {/* 经线框 */}
      <g opacity={frame}>
        <rect x={TX} y={TY} width={TW} height={ROWS * RH} fill="#E2D9C7" />
        {Array.from({length: 100}, (_, j) => (
          <line key={j} x1={TX + 5 + j * 10} x2={TX + 5 + j * 10} y1={TY - 40} y2={TY + ROWS * RH + 40} stroke={C.ink} strokeOpacity={0.16} strokeWidth={1.2} />
        ))}
      </g>
      {cells}
      {/* 织物纹理：经线 + 纬线 */}
      <g opacity={0.09} stroke={C.ink}>
        {Array.from({length: 100}, (_, j) => (
          <line key={j} x1={TX + 5 + j * 10} x2={TX + 5 + j * 10} y1={TY} y2={TY + ROWS * RH} strokeWidth={1.4} />
        ))}
        {Array.from({length: ROWS * 4}, (_, j) => (
          <line key={`h${j}`} x1={TX} x2={TX + TW} y1={TY + j * 5} y2={TY + j * 5} strokeWidth={1} />
        ))}
      </g>
      {/* 卷布轴 + 流苏 */}
      <g transform={`translate(0 ${(1 - spr(t, 0, SNAP, 24)) * -60})`}>
        <rect x={TX - 30} y={TY - 26} width={TW + 60} height={26} fill={C.ink} />
      </g>
      <g transform={`translate(0 ${(1 - spr(t, 2, SNAP, 24)) * 60})`}>
        <rect x={TX - 30} y={TY + ROWS * RH} width={TW + 60} height={22} fill={C.ink} />
        {Array.from({length: 50}, (_, j) => (
          <line key={j} x1={TX + 10 + j * 20} x2={TX + 10 + j * 20} y1={TY + ROWS * RH + 22} y2={TY + ROWS * RH + 22 + 30 * tween(t, 40, 14, 0, 1)} stroke={C.ink} strokeWidth={3} />
        ))}
      </g>
      {shuttle && (
        <polygon
          points={pts([
            [-48, 0],
            [-26, -10],
            [26, -10],
            [48, 0],
            [26, 10],
            [-26, 10],
          ])}
          transform={`translate(${shuttle.x} ${shuttle.y})`}
          fill={C.ink}
          stroke={C.yellow}
          strokeWidth={3}
        />
      )}
      <Spec f={t} at={44} ax={TX + TW} ay={330} lx={1520} ly={300} w={270} text="经线 × 纬线 · 只有直角" id="tex-1" line={C.ink} />
      <Spec f={t} at={50} ax={TX} ay={600} lx={130} ly={640} w={300} text="织布机本身就是网格" id="tex-2" line={C.ink} />
    </g>
  );
};

/* ================================================================== */
/* 09 舞台 · 施莱默的三元芭蕾                                           */
/* ================================================================== */

type DancerLook = {x: number; on: number; phase: number; torso: string; skirt: string; head: string; ball: string};
const DANCERS: DancerLook[] = [
  {x: 580, on: 0, phase: 0, torso: C.yellow, skirt: C.red, head: C.paper, ball: C.yellow},
  {x: 960, on: 6, phase: 10, torso: C.red, skirt: C.blue, head: C.yellow, ball: C.red},
  {x: 1340, on: 12, phase: 20, torso: C.blue, skirt: C.yellow, head: C.red, ball: C.paper},
];
const FEET = 800;

const Dancer: React.FC<{t: number; d: DancerLook}> = ({t, d}) => {
  const lit = t >= d.on ? spr(t, d.on, POP, 20) : 0;
  const tt = t + d.phase;
  const hop = t >= d.on ? -22 * Math.pow(Math.abs(Math.sin((Math.PI * tt) / 30)), 2) : 0;
  const sw = Math.sin((tt * 2 * Math.PI) / 60);
  const arm = (side: number) => {
    const base = side < 0 ? -150 : -30;
    const ang = base + side * 34 * sw;
    const [hx, hy] = polar(122, ang);
    const sx = side * 70;
    return {sx, sy: -336, hx: sx + hx, hy: -336 + hy};
  };
  const spin = tt * 6;
  return (
    <g transform={`translate(${d.x} ${FEET + hop})`} opacity={0.1 + 0.9 * clamp(lit)}>
      {/* 腿 */}
      <rect x={-30} y={-176} width={18} height={176} fill={C.paper} />
      <rect x={12} y={-176} width={18} height={176} fill={C.paper} />
      <rect x={-40} y={-8} width={30} height={8} fill={C.paper} />
      <rect x={10} y={-8} width={30} height={8} fill={C.paper} />
      {/* 手臂 */}
      {[-1, 1].map((side) => {
        const a = arm(side);
        return (
          <g key={side}>
            <line x1={a.sx} y1={a.sy} x2={a.hx} y2={a.hy} stroke={C.paper} strokeWidth={12} strokeLinecap="round" />
            <circle cx={a.hx} cy={a.hy} r={17} fill={d.ball} />
          </g>
        );
      })}
      {/* 倒锥形躯干 */}
      <polygon points="-84,-342 84,-342 0,-176" fill={d.torso} />
      {/* 旋转的圆盘裙 */}
      <g transform="translate(0 -176) scale(1 0.27)">
        {Array.from({length: 8}, (_, i) => {
          const a0 = spin + i * 45;
          const [x0, y0] = polar(136, a0);
          const [x1, y1] = polar(136, a0 + 45);
          return <path key={i} d={`M 0 0 L ${x0} ${y0} A 136 136 0 0 1 ${x1} ${y1} Z`} fill={i % 2 === 0 ? d.skirt : C.paper} />;
        })}
        <circle r={46} fill={C.ink} />
      </g>
      {/* 领圈 + 头 */}
      <rect x={-7} y={-380} width={14} height={36} fill={C.paper} />
      <ellipse cx={0} cy={-346} rx={64} ry={14} fill={C.paper} />
      <circle cx={0} cy={-418} r={40} fill={d.head} />
      <rect x={-40} y={-424} width={80} height={10} fill={C.ink} />
    </g>
  );
};

export const StageScene: SceneFC = ({t}) => (
  <g>
    {DANCERS.map((d, i) => {
      const lit = t >= d.on ? spr(t, d.on, POP, 18) : 0;
      if (lit <= 0) return null;
      return (
        <g key={i} opacity={Math.min(1.25, lit)}>
          <polygon points={`${d.x - 34},-10 ${d.x + 34},-10 ${d.x + 250},${FEET + 6} ${d.x - 250},${FEET + 6}`} fill={C.paper} opacity={0.09} />
          <ellipse cx={d.x} cy={FEET + 6} rx={250} ry={30} fill={C.paper} opacity={0.15} />
        </g>
      );
    })}
    <line x1={160} x2={1760} y1={FEET + 6} y2={FEET + 6} stroke={C.paper} strokeOpacity={0.25} strokeWidth={2} />
    {DANCERS.map((d, i) => (
      <Dancer key={i} t={t} d={d} />
    ))}
  </g>
);

/* ================================================================== */
/* 章节表                                                              */
/* ================================================================== */

export type Chapter = {no: string; cn: string; en: string; credit: string; bg: string; start: number; dur: number; Scene: SceneFC};

export const CHAPTERS: Chapter[] = [
  {no: '01', cn: '色彩', en: 'colour', credit: '约翰内斯·伊顿 · 色彩课 · 1919—1923', bg: C.paper, start: 120, dur: 60, Scene: ColorScene},
  {no: '02', cn: '形与色', en: 'form', credit: '瓦西里·康定斯基 · 形与色问卷 · 1923', bg: C.ink, start: 180, dur: 60, Scene: FormScene},
  {no: '03', cn: '字体', en: 'typography', credit: '赫伯特·拜耶 · universal 通用字体 · 1925', bg: C.paper, start: 240, dur: 90, Scene: TypeScene},
  {no: '04', cn: '海报', en: 'poster', credit: '致敬 约斯特·施密特 · 赫伯特·拜耶 · 1923—1926', bg: C.blue, start: 330, dur: 90, Scene: PosterScene},
  {no: '05', cn: '建筑', en: 'architecture', credit: '瓦尔特·格罗皮乌斯 · 德绍校舍 · 1926', bg: C.paper, start: 420, dur: 60, Scene: ArchScene},
  {no: '06', cn: '家具', en: 'furniture', credit: '马塞尔·布劳耶 · B3 钢管椅 · 1925', bg: C.red, start: 480, dur: 60, Scene: ChairScene},
  {no: '07', cn: '灯具', en: 'lighting', credit: '威廉·瓦根菲尔德 · WG24 台灯 · 1924', bg: C.ink, start: 540, dur: 60, Scene: LampScene},
  {no: '08', cn: '纺织', en: 'textile', credit: '安妮·阿尔伯斯 · 壁挂织物 · 1926', bg: C.paper, start: 600, dur: 60, Scene: TextileScene},
  {no: '09', cn: '舞台', en: 'stage', credit: '奥斯卡·施莱默 · 三元芭蕾 · 1922', bg: C.ink, start: 660, dur: 60, Scene: StageScene},
];
