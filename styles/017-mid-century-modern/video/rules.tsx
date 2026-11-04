/**
 * 五条规则（白纸，650—826）：五张卡一拍一张砸下来（675—775），每张卡用自己的方法演示自己；826 起卡片一张张飞走，
 * 海报的前奏（t − 900）在同一张白纸上重新落下 → 接回第 0 帧。
 */
import React from 'react';
import {C, FONT} from '../tokens';
import {GEO} from './geo';
import {drop, leave} from './kit';
import {ease, prog, rnd} from './motion';
import {Body, multiply, Piece, type Pose} from './paper';
import {AT} from './timeline';

type Card = {fill: string; ink: string; n: string; title: string[]; note: string};
const CARDS: Card[] = [
  {fill: C.red, ink: C.paper, n: '01', title: ['剪刀', '代替尺子'], note: '边慢慢抖 1—1.6px，角留尖'},
  {fill: C.sun, ink: C.ink, n: '02', title: ['影子', '= 高度'], note: '偏 (0.5h, h)，模糊 0.4h'},
  {fill: C.pink, ink: C.ink, n: '03', title: ['叠印', '出第三色'], note: '浅色压深色，multiply'},
  {fill: C.turq, ink: C.paper, n: '04', title: ['原子时代', '的形状'], note: '腰果 · 回旋镖 · 星芒'},
  {fill: C.blue, ink: C.paper, n: '05', title: ['七种', '颜色'], note: '白纸 40% · 其余各一小块'},
];
const cardLand = (k: number) => AT.rules + 25 + 25 * k;
const cardLeave = (k: number) => AT.out + 3 * k;
const CXS = [230, 595, 960, 1325, 1690];

export const cardPose = (k: number, t: number): Pose | null => {
  const p = drop(t, cardLand(k), 14, 160, CXS[k], 600, (rnd(k, 2) - 0.5) * 30, (rnd(k, 3) - 0.5) * 6, 0, 120);
  return p ? leave(t, cardLeave(k), p) : null;
};

/** 卡里的演示（以卡中心为原点，跟着卡一起动） */
const Demo: React.FC<{k: number; t: number; card: Card}> = ({k, t, card}) => {
  const u = t - cardLand(k);
  if (u < 0) return null;
  const y0 = -40;
  if (k === 0) {
    return (
      <>
        <circle cx={0} cy={y0} r={78} fill="none" stroke={card.ink} strokeWidth={2} strokeDasharray="6 6" opacity={0.6} />
        <Piece d={GEO.circleL} fill={C.paper} p={{x: 6, y: y0 + 4, a: u * 0.8, h: 4 + 30 * Math.max(0, 1 - u / 10)}} />
      </>
    );
  }
  if (k === 1) {
    const h = 4 + 26 * (0.5 - 0.5 * Math.cos((u / 40) * Math.PI * 2));
    return <Piece d={GEO.square} fill={C.paper} p={{x: 0, y: y0, a: -4, h}} />;
  }
  if (k === 2) {
    const e = ease.inOut(Math.min(1, u / 20));
    const a: Pose = {x: -70 + 26 * e, y: y0, h: 4, s: 0.85};
    const b: Pose = {x: 70 - 26 * e, y: y0, h: 4, s: 0.85};
    return (
      <>
        <Piece d={GEO.circleL} fill={C.sun} p={a} />
        <Piece d={GEO.circleL} fill={C.turq} p={b} />
        <clipPath id={`ov-${k}-${Math.round(t * 10)}`}>
          <path d={GEO.circleL} transform={`translate(${a.x} ${a.y}) scale(${0.85 * 1.0128})`} />
        </clipPath>
        <g clipPath={`url(#ov-${k}-${Math.round(t * 10)})`}>
          <Body parts={[{d: GEO.circleL, fill: multiply(C.sun, C.turq)}]} p={b} />
        </g>
      </>
    );
  }
  if (k === 3) {
    const shapes = [GEO.kidneyS, GEO.boomerang, GEO.star];
    const cols = [C.pink, C.sun, C.paper];
    return (
      <>
        {shapes.map((d, i) => {
          const p = drop(t, cardLand(k) + 4 + 4 * i, 8, 60, -80 + 80 * i, y0 + (i === 1 ? 10 : 0), -30, 0, 0, 0, i === 2 ? 1.1 : 0.9);
          return p ? <Piece key={i} d={d} fill={cols[i]} p={p} /> : null;
        })}
      </>
    );
  }
  const sw = [C.paper, C.red, C.sun, C.pink, C.turq, C.blue, C.ink];
  return (
    <>
      {sw.map((col, i) => {
        const p = drop(t, cardLand(k) + 2 + 2 * i, 8, 50, 0, y0 - 96 + 32 * i, -10, 0, 0, 0, 0.9);
        return p ? <Piece key={i} d={GEO.swatch} fill={col} p={p} /> : null;
      })}
    </>
  );
};

const CardView: React.FC<{k: number; t: number}> = ({k, t}) => {
  const p = cardPose(k, t);
  if (!p) return null;
  const c = CARDS[k];
  const s = (p.s ?? 1) * (1 + 0.0032 * (p.h ?? 4));
  return (
    <>
      <Piece d={GEO.card} fill={c.fill} p={p} />
      <g transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(p.a ?? 0).toFixed(2)}) scale(${s.toFixed(4)})`}>
        <text x={-136} y={-170} fontFamily={FONT.sans} fontWeight={700} fontSize={24} letterSpacing={3} fill={c.ink}>{c.n}</text>
        <Demo k={k} t={t} card={c} />
        <text x={-136} y={104} fontFamily={FONT.sc} fontWeight={900} fontSize={40} fill={c.ink}>{c.title[0]}</text>
        <text x={-136} y={152} fontFamily={FONT.sc} fontWeight={900} fontSize={40} fill={c.ink}>{c.title[1]}</text>
        <text x={-136} y={190} fontFamily={FONT.sc} fontWeight={500} fontSize={17} fill={c.ink} opacity={0.85}>{c.note}</text>
      </g>
    </>
  );
};

export const Rules: React.FC<{t: number}> = ({t}) => {
  const e = ease.out(prog(t, AT.rules + 2, 16));
  const out = ease.in(prog(t, AT.out, 14));
  return (
    <>
      <svg x={80} y={140} width={700} height={90} overflow="hidden">
        <text x={0} y={70 + (1 - e) * 90 - out * 90} fontFamily={FONT.sc} fontWeight={900} fontSize={64} fill={C.ink}>五条规则</text>
      </svg>
      {[0, 1, 2, 3, 4].map((k) => <CardView key={k} k={k} t={t} />)}
    </>
  );
};

export const rulesPts = (t: number): (Pose | null)[] => [0, 1, 2, 3, 4].map((k) => cardPose(k, t));
export const rulesFocus = (t: number): {p: Pose | null; fill: string} => {
  let k = 0;
  for (let i = 0; i < 5; i++) if (cardLand(i) - 14 <= t) k = i;
  return {p: cardPose(k, t), fill: CARDS[k].fill};
};
