/**
 * 010 · 片尾：对标 008 Risograph `End` 骨架，剪纸语言。
 * 窗花落回开场位置（Swiss 红方块回位）→ 中英标题 → 一句带走的话 → 底栏三件套。
 * 禁止收成一点当收束，禁止门笺替代信息幕。
 */
import React from 'react';
import {POP, SMOOTH, spr} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT} from './timeline';
import {W, n1} from './layers';
import {FolkFlower} from './opening';
import {Txt} from './ui';

const EN: {ch: string; x: number}[] = [
  {ch: 'P', x: 668},
  {ch: 'A', x: 746},
  {ch: 'P', x: 824},
  {ch: 'E', x: 898},
  {ch: 'R', x: 974},
  {ch: 'C', x: 1108},
  {ch: 'U', x: 1186},
  {ch: 'T', x: 1260},
];

export const Take: React.FC<{f: number}> = ({f}) => {
  const t0 = AT.take;
  const t = f - t0;
  const land = spr(f, t0 - 18, SMOOTH, 40);
  const y = 268 + (1 - land) * 90;
  const scale = 0.22 + 0.30 * land;
  const spin = 6 + t * 0.055;
  const sway = Math.sin(t * 0.04) * 2.4;
  const hang = Math.min(1, land);
  const en0 = t0 + 18;
  const zh = spr(f, t0 + 46, POP, 28);
  const line = spr(f, t0 + 64, POP, 28);
  const foot = spr(f, t0 + 80, POP, 28);
  return (
    <g>
      <rect width={W} height={1080} fill={C.wall} />
      <g opacity={hang}>
        <rect x={956} y={0} width={8} height={n1(Math.max(12, y - 412 * scale))} rx={3} fill={C.folk} />
        <circle cx={960} cy={16} r={9} fill={C.folk} />
      </g>
      {land > 0.02 && (
        <g transform={`translate(960 ${n1(y + sway)})`} opacity={Math.min(1, land)}>
          <FolkFlower f={f} scale={scale} spin={spin} punchAt={1} compact={1} />
        </g>
      )}
      {EN.map((g, i) => {
        const k = spr(f, en0 + i * 3, POP, 28);
        if (k < 0.02) return null;
        return (
          <text
            key={`${g.ch}${i}`}
            x={g.x}
            y={n1(668 + (1 - k) * 36)}
            fontFamily="Jost"
            fontSize={92}
            fontWeight={800}
            textAnchor="middle"
            fill={C.folk}
            opacity={Math.min(1, k)}
            filter="url(#shMid)"
          >
            {g.ch}
          </text>
        );
      })}
      {zh > 0.02 && (
        <g opacity={Math.min(1, zh)} transform={`translate(0 ${n1((1 - zh) * 18)})`}>
          <rect x={780} y={698} width={360} height={64} rx={4} fill={C.folk} mask="url(#zhCut)" filter="url(#shMid)" />
        </g>
      )}
      {line > 0.02 && (
        <g opacity={Math.min(1, line)} transform={`translate(0 ${n1((1 - line) * 14)})`}>
          <Txt x={960} y={820} size={34} font="cn" w={700} c={C.ink} anchor="middle">
            一层一色，影子落在下一张上。
          </Txt>
        </g>
      )}
      {foot > 0.02 && (
        <g opacity={Math.min(1, foot)}>
          <rect x={72} y={932} width={1776} height={3} rx={1.5} fill={C.folk} />
          <g transform={`translate(0 ${n1((1 - foot) * 10)})`}>
            <Txt x={72} y={980} size={20} font="mono" w={700} c={C.ink} ls={1.2}>
              DESIGN STYLE  010
            </Txt>
            <Txt x={960} y={980} size={20} font="mono" w={700} c={C.ink} anchor="middle" ls={1.1}>
              @guanmo_ai
            </Txt>
            <Txt x={1848} y={980} size={16} font="mono" w={500} c={C.grey} anchor="end" ls={0.6}>
              github.com/guanmo-ai/design-style
            </Txt>
          </g>
        </g>
      )}
      <defs>
        <mask id="zhCut" maskUnits="userSpaceOnUse" x="780" y="698" width="360" height="64">
          <rect x="780" y="698" width="360" height="64" rx="4" fill="white" />
          <text x="960" y="744" fontFamily="Noto Sans SC" fontSize="36" fontWeight="900" textAnchor="middle" fill="black">
            剪纸层叠
          </text>
        </mask>
      </defs>
    </g>
  );
};
