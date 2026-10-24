/**
 * 007 · Minimalism —— 片尾 19.0–22.0s（f1140–1320）
 *   从空状态的加号回到开场那个点；少即是多。@guanmo_ai
 */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C, DOT, LAYOUT} from '../tokens';
import {AT} from './timeline';
import {Dot, Hair, lerp, Letters, n2, P, Ripple, Txt} from './ui';

const HZ = LAYOUT.horizon;
const L = LAYOUT.mx;
const R = 1920 - LAYOUT.mx;
export const END_AT = AT.end;

const End: React.FC<P> = ({f}) => {
  const e = END_AT;
  const push = 1 + 0.02 * tween(f, e, 160, 0, 1, E.soft);
  const fx = (at: number, gap: number) => (i: number) => {
    const p = tween(f, at + i * gap, 18, 0, 1, E.out);
    return {o: p, dx: (1 - p) * (i + 1) * 10};
  };
  const o = (at: number) => tween(f, at, 14, 0, 1, E.out);
  return (
    <g>
      <g transform={`translate(960 ${HZ}) scale(${n2(push)}) translate(-960 ${-HZ})`}>
        <Hair x1={L} y1={HZ} x2={R} y2={HZ} p={tween(f, e + 4, 24, 0, 1, E.inOut)} from="center" o={0.85} />
        <Ripple f={f} at={e} x={960} y={HZ} r0={DOT.r} r1={240} dur={44} />
        <Ripple f={f} at={e + 8} x={960} y={HZ} r0={DOT.r} r1={140} dur={36} />
        <Dot x={960} y={HZ} r={DOT.r / push} />
        <Letters text="少即是多" x={L - 6} y={HZ - 48} k="sc300" size={96} ls={0.24} fx={fx(e + 10, 3)} />
        <Txt x={R} y={HZ - 52} k="mono" size={16} ls={0.16} c={C.greyDk} anchor="end" o={o(e + 26)}>
          LUDWIG MIES VAN DER ROHE
        </Txt>
        <Txt x={L} y={HZ + 72} k="t300" size={36} o={o(e + 20)}>
          Less is more.
        </Txt>
        <Txt x={R} y={HZ + 70} k="sc300" size={26} ls={0.3} c={C.greyDk} anchor="end" o={o(e + 28)}>
          极简主义
        </Txt>
      </g>
      <Txt x={L} y={132} k="mono" size={16} ls={0.18} c={C.greyDk} o={o(e + 16)}>
        DESIGN STYLE · 007
      </Txt>
      <Txt x={R} y={132} k="mono" size={16} ls={0.18} c={C.greyDk} anchor="end" o={o(e + 18)}>
        APP · WEB · TODAY
      </Txt>
      <line x1={L} y1={884} x2={n2(lerp(L, R, tween(f, e + 32, 26, 0, 1, E.inOut)))} y2={884} stroke={C.hair} strokeWidth={1} />
      <g opacity={n2(o(e + 38))}>
        <text x={L} y={940} fill={C.ink} style={{fontFamily: "'Inter'", fontWeight: 500, fontSize: 24}}>
          Design Style
          <tspan dx={12} style={{fontFamily: "'Noto Sans SC'", fontWeight: 400, fontSize: 22, letterSpacing: '0.06em'}}>
            风格
          </tspan>
          <tspan dx={8}>007</tspan>
        </text>
      </g>
      <Txt x={960} y={940} k="t400" size={28} anchor="middle" o={o(e + 42)}>
        @guanmo_ai
      </Txt>
      <Txt x={R} y={940} k="t300" size={22} c={C.greyDk} anchor="end" o={o(e + 46)}>
        github.com/guanmo-ai/design-style
      </Txt>
    </g>
  );
};

export const Finale: React.FC<P> = ({f}) => (f >= END_AT ? <End f={f} /> : null);
