/** 010 · 片尾：三句可带走的话 + 六格定妆 + @guanmo_ai */
import React from 'react';
import {spr} from '../../../src/lib/anim';
import {C, HILLS} from '../tokens';
import {AT, LINES} from './timeline';
import {W, n1} from './layers';
import {Txt} from './ui';

const THUMBS: {en: string; zh: string; fill: string}[] = [
  {en: 'FOLK', zh: '镂空', fill: C.folk},
  {en: 'STRATA', zh: '层叠', fill: HILLS[2]},
  {en: 'DIORAMA', zh: '纸板', fill: HILLS[4]},
  {en: 'SILHOUETTE', zh: '剪影', fill: C.ink},
  {en: 'TORN', zh: '毛边', fill: '#C9A28A'},
  {en: 'TYPE', zh: '剪字', fill: C.sun},
];

export const Take: React.FC<{f: number}> = ({f}) => {
  const sway = Math.sin((f - AT.take) * 0.05) * 4;
  return (
    <g>
      <rect width={W} height={1080} fill={C.wall} />
      <g transform={`translate(${n1(sway)} 0)`}>
        <circle cx={1680} cy={180} r={90} fill={C.folk} opacity={0.9} />
        <circle cx={1680} cy={180} r={62} fill={C.wall} />
        <circle cx={1680} cy={180} r={18} fill={C.folk} />
      </g>
      {LINES.map((line, i) => {
        const k = spr(f, AT.take + 8 + i * 40, {damping: 12, mass: 0.7, stiffness: 170});
        if (k < 0.01) return null;
        return (
          <g key={i} opacity={k} transform={`translate(${n1((1 - k) * -36)} ${n1(88 + i * 196)})`} filter="url(#shNear)">
            <rect x={72} width={1180} height={172} rx={22} fill={C.paper} />
            <rect x={72} width={14} height={172} rx={8} fill={i === 0 ? C.folk : i === 1 ? HILLS[3] : C.sun} />
            <Txt x={114} y={72} size={18} font="mono" c={C.sun} ls={1.4}>
              {`0${i + 1}  TAKE AWAY`}
            </Txt>
            <Txt x={114} y={124} size={32} font="cn" w={900} c={C.ink}>
              {line}
            </Txt>
          </g>
        );
      })}
      {THUMBS.map((t, i) => {
        const k = spr(f, AT.take + 118 + i * 8, {damping: 11, mass: 0.6, stiffness: 190});
        if (k < 0.01) return null;
        const x = 72 + i * 296;
        return (
          <g key={t.en} opacity={k} transform={`translate(${n1(x)} ${n1(720 + (1 - k) * 24)})`} filter="url(#shMid)">
            <rect width={276} height={168} rx={18} fill={t.fill} />
            <Txt x={20} y={56} size={13} font="mono" c={C.paper} ls={1.2}>
              {t.en}
            </Txt>
            <Txt x={20} y={118} size={36} font="cn" w={900} c={C.paper}>
              {t.zh}
            </Txt>
          </g>
        );
      })}
      {(() => {
        const handle = spr(f, AT.take + 168, {damping: 14, mass: 0.8, stiffness: 140});
        if (handle < 0.01) return null;
        return (
          <g opacity={handle} transform={`translate(0 ${n1((1 - handle) * 16)})`}>
            <rect x={760} y={920} width={400} height={72} rx={18} fill={C.paper} filter="url(#shNear)" />
            <Txt x={960} y={966} size={26} font="display" w={600} c={C.ink} anchor="middle" ls={1.2}>
              @guanmo_ai
            </Txt>
          </g>
        );
      })()}
    </g>
  );
};
