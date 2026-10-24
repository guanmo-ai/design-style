/**
 * 007 · 六改 14.2–16.8s —— 骨架是动作，不是静帧
 *   栏线扫描（学 Swiss Flashes）· 字重对切 · 空格测量 · 五方案贴回格子
 */
import React from 'react';
import {E, POP, SNAP, spr, tween} from '../../../src/lib/anim';
import {C, DOT, LAYOUT} from '../tokens';
import {AT} from './timeline';
import {Dot, Hair, Leader, Txt, n2, P} from './ui';

export const GRID_AT = AT.bone;
export const WEIGHT_AT = AT.bone + 48;
export const SPACE_AT = AT.bone + 96;

const COLS = 12;
const MX = 120;
const MY = 96;
const GW = (1920 - MX * 2) / COLS;
const GH = 122;

export const Bone: React.FC<P> = ({f}) => {
  if (f < AT.bone - 8 || f >= AT.hold) return null;
  const inn = spr(f, AT.bone, SNAP, 16);
  const leave = tween(f, AT.hold - 12, 12, 0, 1, E.in);
  const o = inn * (1 - leave);
  const scan = tween(f, GRID_AT, 28, 0, 1, E.out);
  const w1 = spr(f, WEIGHT_AT, POP, 16);
  const w2 = spr(f, WEIGHT_AT + 12, POP, 16);
  const w3 = spr(f, WEIGHT_AT + 24, POP, 16);
  const sp = spr(f, SPACE_AT, SNAP, 18);
  return (
    <g opacity={n2(o)}>
      {Array.from({length: COLS + 1}, (_, i) => {
        const a = GRID_AT + i * 1.6;
        const flash = tween(f, a, 3, 0, 1, E.out) * (1 - tween(f, a + 4, 10, 0, 1, E.inOut));
        const stay = 0.22 * scan;
        return <Hair key={`v${i}`} x1={MX + i * GW} y1={MY} x2={MX + i * GW} y2={MY + GH * 6} o={Math.max(stay, flash)} c={flash > 0.4 ? C.accent : C.ink} w={flash > 0.5 ? 2 : 1} />;
      })}
      {Array.from({length: 7}, (_, j) => (
        <Hair key={`h${j}`} x1={MX} y1={MY + j * GH} x2={MX + GW * COLS} y2={MY + j * GH} o={0.22 * scan} />
      ))}
      <g opacity={n2(w1)}>
        <Txt x={MX + GW * 2} y={MY + GH * 2.2} k="d100" size={120}>
          Aa
        </Txt>
        <Txt x={MX + GW * 2} y={MY + GH * 2.55} k="mono" size={13} ls={0.12} c={C.grey}>
          100  标题越薄
        </Txt>
      </g>
      <g opacity={n2(w2)}>
        <Txt x={MX + GW * 5} y={MY + GH * 3.4} k="d300" size={72}>
          Aa
        </Txt>
        <Txt x={MX + GW * 5} y={MY + GH * 3.7} k="mono" size={13} ls={0.12} c={C.grey}>
          300  正文只此
        </Txt>
      </g>
      <g opacity={n2(w3)}>
        <Txt x={MX + GW * 8} y={MY + GH * 4.3} k="t500" size={28}>
          Aa
        </Txt>
        <Txt x={MX + GW * 8} y={MY + GH * 4.6} k="mono" size={13} ls={0.12} c={C.grey}>
          500  注释更小
        </Txt>
        <Dot x={MX + GW * 9.4} y={MY + GH * 4.15} r={DOT.r * w3} />
      </g>
      <g opacity={n2(sp)}>
        <rect x={MX + GW * 9} y={MY + GH} width={GW * 2} height={GH * 2} fill="none" stroke={C.accent} strokeWidth={1.5} />
        <Leader x={MX + GW * 11} y={MY + GH} kx={MX + GW * 11 + 40} ky={MY + GH - 36} ex={MX + GW * 11 + 160} p={sp} c={C.accent} />
        <Txt x={MX + GW * 11 + 48} y={MY + GH - 40} k="sc300" size={16} c={C.accent}>
          空也是内容
        </Txt>
      </g>
      {['APP', 'WEB', 'PAY', 'DATA', 'POST'].map((lab, i) => {
        const p = spr(f, SPACE_AT + 8 + i * 5, SNAP, 14);
        const x = MX + (1 + i * 2) * GW;
        const y = MY + GH * 5.35;
        return (
          <g key={lab} opacity={n2(p)}>
            <rect x={x} y={y - 28} width={GW * 1.6} height={40} fill="none" stroke={C.ink} strokeWidth={1} />
            <Txt x={x + 10} y={y} k="mono" size={12} ls={0.12}>
              {lab}
            </Txt>
          </g>
        );
      })}
      <Txt x={LAYOUT.mx} y={80} k="mono" size={13} ls={0.16} c={C.greyDk} o={tween(f, GRID_AT, 8)}>
        12 × 6  ·  ALIGN
      </Txt>
    </g>
  );
};
