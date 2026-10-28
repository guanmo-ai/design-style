/**
 * 固定外框：左上署名（编号 · 领域 · 作者《作品》年份 + 这一章的一招）、右上实时读数（v / wdth / n）、底栏 0N / 07。
 * 快切时观众始终知道自己在哪；读数让设计师直接看到“字宽 = 速度”“刹车时残影收拢”的数。
 */
import React from 'react';
import {C} from '../tokens';
import {Rise, Txt} from './kit';
import {ease, prog} from './motion';
import {CREDITS} from './timeline';

export type Probe = {v: number; wdth: number; n: number};

export const Hud: React.FC<{t: number; probe: Probe | null; dark: boolean}> = ({t, probe, dark}) => {
  const ink = dark ? C.paperHi : C.ink;
  const halo = dark ? C.ink : C.paper; // 字后面描一圈底色：背景再花也读得清
  const cr = CREDITS.find((c) => t >= c.at - 2 && t < c.to + 14);
  const idx = CREDITS.findIndex((c) => c.n !== '00' && t >= c.at - 8 && t < c.to + 8);
  const chapters = CREDITS.filter((c) => c.n !== '00');
  return (
    <g stroke={halo} strokeWidth={7} strokeLinejoin="round" paintOrder="stroke">
      {cr && (
        <g>
          <rect x={80} y={66} width={56 * ease.out(prog(t, cr.at, 12)) * (1 - ease.in(prog(t, cr.to, 10)))} height={8} fill={C.orange} />
          <Rise t={t} at={cr.at} box={[80, 82, 1100, 50]} out={cr.to} dOut={10}>
            <Txt x={80} y={120} size={34} fill={ink}>
              <tspan fontFamily="'Space Mono', monospace" fontWeight={700} fill={C.orange}>{cr.n}</tspan>
              <tspan dx={14}>{cr.field}</tspan>
              <tspan dx={18} fontWeight={700}>
                {cr.n === '07' ? 'App · 网页' : `${cr.who}《${cr.work}》${cr.year}`}
              </tspan>
            </Txt>
          </Rise>
          <Rise t={t} at={cr.at + 4} box={[80, 132, 1100, 44]} out={cr.to + 2} dOut={10}>
            <Txt x={80} y={164} size={26} w={500} fill={ink} opacity={0.82}>
              {cr.trick}
            </Txt>
          </Rise>
        </g>
      )}
      {probe && (
        <g fontFamily="'Space Mono', monospace" fontSize={22} fontWeight={700}>
          {[
            ['v', `${Math.abs(probe.v).toFixed(1)} px/帧`],
            ['wdth', probe.wdth.toFixed(0)],
            ['残影', `${probe.n} 层`],
          ].map(([k, val], i) => (
            <g key={k}>
              <text x={1600} y={96 + i * 32} fill={C.orange}>
                {k}
              </text>
              <text x={1840} y={96 + i * 32} fill={ink} textAnchor="end">
                {val}
              </text>
            </g>
          ))}
        </g>
      )}
      {idx >= 0 && (
        <g>
          {chapters.map((c, i) => (
            <rect key={c.n} x={80 + i * 64} y={1022} width={52} height={6} fill={i === idx - 1 ? C.orange : ink} opacity={i === idx - 1 ? 1 : i < idx - 1 ? 0.55 : 0.18} />
          ))}
          <Txt x={80 + 7 * 64 + 12} y={1031} size={20} fam="mono" w={700} fill={ink}>
            {`${CREDITS[idx].n} / 07`}
          </Txt>
        </g>
      )}
    </g>
  );
};
