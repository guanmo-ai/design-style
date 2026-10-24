/** 010 · Paper Cut —— 开场 0–2.5s：层从后往前叠上，红日弹出，笔记本卡片 */
import React from 'react';
import {E, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT} from './timeline';
import {World} from './layers';
import {NoteCard, Txt} from './ui';

export const Opening: React.FC<{f: number}> = ({f}) => {
  const card = spr(f, 68, {damping: 13, mass: 0.75, stiffness: 160}) * (1 - tween(f, AT.edit - 22, 18, 0, 1, E.in));
  const line = tween(f, 86, 20, 0, 1, E.out);
  return (
    <g>
      <World f={f} />
      <NoteCard x={72} y={96} w={520} h={248} k={card} />
      {card > 0.05 && (
        <g opacity={card} transform={`translate(${72 + (1 - card) * 16} 96)`}>
          <Txt x={44} y={78} size={15} font="mono" c={C.grey} ls={2.2}>
            010  ·  PAPER CUT
          </Txt>
          <Txt x={44} y={132} size={42} font="display" w={700} c={C.ink} ls={3.2}>
            PAPERCUTOUT
          </Txt>
          <Txt x={44} y={186} size={34} font="cn" w={700} c={C.navy}>
            剪纸层叠
          </Txt>
          <rect x={44} y={206} width={140 * line} height={2} fill={C.sun} />
          <Txt x={44} y={230} size={13} font="display" w={500} c={C.grey} ls={1.4}>
            strata shadows  ·  silhouette depth
          </Txt>
        </g>
      )}
    </g>
  );
};
