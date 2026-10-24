/**
 * 007 · Minimalism —— 17.6–19.6s 坏例对照
 *   花哨无焦点 vs 极简有焦点。两秒看懂。
 */
import React from 'react';
import {E, POP, SNAP, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {LINES} from './script';
import {AT} from './timeline';
import {Hair, Txt, Why, lerp, n2, P, vis} from './ui';

export const VS_SPLIT = 1072;
export const VS_LABEL = 1088;

const Bad: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${n2(x)} ${n2(y)}) scale(${n2(s)})`}>
    <rect x={0} y={0} width={520} height={620} fill="#1a1020" rx={12} />
    <rect x={16} y={16} width={488} height={48} fill="#C23B2E" />
    <text x={32} y={48} fill="#fff" style={{fontFamily: "'Bangers'", fontSize: 28}}>
      MEGA SALE!!!
    </text>
    {['HOT', 'NEW', 'VIP', '50%', '抢'].map((t, i) => (
      <text key={t} x={40 + (i % 3) * 160} y={120 + Math.floor(i / 3) * 70} fill={['#C4A35A', '#2A6B7C', '#F27A1A', '#3D5A99', '#C23B2E'][i]} style={{fontFamily: "'Oswald'", fontWeight: 700, fontSize: 36}}>
        {t}
      </text>
    ))}
    {[0, 1, 2].map((i) => (
      <rect key={i} x={24 + i * 160} y={280} width={144} height={120} fill={['#2A6B7C', '#C4A35A', '#3D5A99'][i]} />
    ))}
    <rect x={24} y={420} width={220} height={52} fill="#C23B2E" />
    <rect x={260} y={420} width={220} height={52} fill="#C4A35A" />
    <rect x={24} y={488} width={456} height={44} fill="#3D5A99" />
    <text x={260} y={580} textAnchor="middle" fill="#fff" style={{fontFamily: "'Fredoka'", fontSize: 22}}>
      点这里 / 也点这里 / 再点
    </text>
  </g>
);

const Good: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${n2(x)} ${n2(y)}) scale(${n2(s)})`}>
    <rect x={0} y={0} width={520} height={620} fill={C.paperHi} stroke={C.ink} strokeWidth={1.5} />
    <text x={40} y={80} fill={C.ink} style={{fontFamily: "'Inter Display'", fontWeight: 200, fontSize: 44}}>
      Less, but better.
    </text>
    <text x={40} y={124} fill={C.greyDk} style={{fontFamily: "'Noto Sans SC'", fontWeight: 300, fontSize: 20}}>
      一栏标题。一件事。
    </text>
    <text x={40} y={280} fill={C.ink} style={{fontFamily: "'Inter Display'", fontWeight: 100, fontSize: 88}}>
      ¥12
    </text>
    <text x={40} y={324} fill={C.grey} style={{fontFamily: "'Noto Sans SC'", fontWeight: 300, fontSize: 16}}>
      设计手册 · 单次
    </text>
    <rect x={40} y={500} width={440} height={56} fill={C.ink} />
    <line x1={40} y1={556} x2={480} y2={556} stroke={C.accent} strokeWidth={3} />
    <text x={260} y={536} textAnchor="middle" fill={C.paper} style={{fontFamily: "'Noto Sans SC'", fontWeight: 400, fontSize: 20}}>
      确认支付
    </text>
  </g>
);

export const Versus: React.FC<P> = ({f}) => {
  if (f < AT.vs - 4 || f >= AT.poster) return null;
  const inn = spr(f, AT.vs, SNAP, 20);
  const leave = tween(f, AT.poster - 12, 12, 0, 1, E.inOut);
  const split = spr(f, VS_SPLIT, POP, 16);
  const lab = vis(f, VS_LABEL, AT.poster - 8, 8, 8);
  const xL = lerp(700, 180, inn);
  const xR = lerp(700, 1220, inn);
  return (
    <g opacity={n2(1 - leave)}>
      <Bad x={xL} y={lerp(240, 160, inn)} s={0.92 * inn} />
      <Good x={xR} y={lerp(240, 160, inn)} s={0.92 * inn} />
      <Hair x1={960} y1={140} x2={960} y2={lerp(140, 820, split)} o={0.5} />
      <g opacity={n2(lab)}>
        <Txt x={180} y={140} k="sc500" size={22} c={C.greyDk}>
          无焦点
        </Txt>
        <Txt x={1740} y={140} k="sc500" size={22} anchor="end">
          有焦点
        </Txt>
      </g>
      <Why o={vis(f, AT.vs + 4, AT.poster - 6, 8, 8)} kicker="对照" line={LINES[6]} en="FOCUS VERSUS NOISE" />
    </g>
  );
};
