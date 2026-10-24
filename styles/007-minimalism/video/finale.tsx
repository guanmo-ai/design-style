/**
 * 007 · 六改 16.8–24.0s —— 定妆 + 片尾
 *   定妆可当海报：少 + 删减清单 + 47/1 在地平线下方 + 虚线圆落到橙点
 *   片尾 @guanmo_ai
 */
import React from 'react';
import {E, POP, SNAP, spr, tween} from '../../../src/lib/anim';
import {C, DOT, LAYOUT} from '../tokens';
import {THESIS} from './script';
import {AT} from './timeline';
import {Dot, Hair, Letters, Txt, lerp, n2, P, Ripple} from './ui';

const HZ = LAYOUT.horizon;
const L = LAYOUT.mx;
const R = 1920 - LAYOUT.mx;
export const END_AT = AT.end;
export const POSTER_AT = AT.hold;

const GHOST = 'rgba(28,27,25,0.28)';
const GRID_X0 = 1180;
const GRID_Y0 = 168;
const PITCH = 46;
const GR = 15;
const MISSING = {i: 4, j: 6};
const STRUCK: {zh: string; dead: boolean}[] = [
  {zh: '促销字', dead: true},
  {zh: '第二色', dead: true},
  {zh: '重复入口', dead: true},
  {zh: '装饰', dead: true},
  {zh: '有用的', dead: false},
];

const PosterHold: React.FC<P> = ({f}) => {
  if (f < AT.hold - 4 || f >= AT.end) return null;
  const inn = spr(f, AT.hold, SNAP, 22);
  const leave = tween(f, AT.end - 10, 10, 0, 1, E.in);
  const o = inn * (1 - leave);
  const mx = GRID_X0 + MISSING.i * PITCH;
  const my = GRID_Y0 + MISSING.j * PITCH;
  const drop = spr(f, AT.hold + 10, POP, 20);
  return (
    <g opacity={n2(o)}>
      <Letters
        text="少"
        x={L - 4}
        y={232}
        k="d100"
        size={168}
        fx={(i) => {
          const p = tween(f, AT.hold + 4 + i * 2, 16, 0, 1, E.out);
          return {o: p, dy: (1 - p) * 24};
        }}
      />
      <Txt x={L} y={286} k="sc300" size={30} ls={0.04} o={tween(f, AT.hold + 12, 12)}>
        = 删到只剩有用的
      </Txt>
      <Txt x={L} y={320} k="t300" size={22} c={C.greyDk} o={tween(f, AT.hold + 18, 10)}>
        {THESIS.en}
      </Txt>
      <Txt x={R} y={286} k="mono" size={13} ls={0.14} c={C.greyDk} anchor="end" o={tween(f, AT.hold + 16, 10)}>
        WENIGER, ABER BESSER
      </Txt>
      {STRUCK.map((row, i) => {
        const yy = 352 + i * 26;
        const show = tween(f, AT.hold + 20 + i * 3, 8);
        const w = row.zh.length * 20;
        return (
          <g key={row.zh} opacity={n2(show)}>
            <Txt x={L} y={yy} k="mono" size={12} ls={0.12} c={row.dead ? C.grey : C.accent}>
              {`0${i + 1}`}
            </Txt>
            <Txt x={L + 40} y={yy} k="sc400" size={18} c={row.dead ? C.grey : C.accent}>
              {row.zh}
            </Txt>
            {row.dead ? <line x1={L + 38} y1={yy - 6} x2={L + 42 + w} y2={yy - 6} stroke={C.grey} strokeWidth={1} /> : null}
          </g>
        );
      })}
      <Txt x={L} y={HZ + 108} k="d100" size={80} o={tween(f, AT.hold + 36, 10)}>
        47
      </Txt>
      <Txt x={L + 148} y={HZ + 76} k="sc300" size={16} o={tween(f, AT.hold + 40, 8)}>
        样东西，删掉了
      </Txt>
      <Txt x={L + 148} y={HZ + 100} k="mono" size={11} ls={0.14} c={C.grey} o={tween(f, AT.hold + 42, 8)}>
        REMOVED
      </Txt>
      <Txt x={L + 520} y={HZ + 108} k="d100" size={80} o={tween(f, AT.hold + 44, 10)}>
        1
      </Txt>
      <Txt x={L + 580} y={HZ + 76} k="sc300" size={16} o={tween(f, AT.hold + 48, 8)}>
        个留下：有用的那一个
      </Txt>
      {Array.from({length: 8}, (_, j) =>
        Array.from({length: 6}, (_, i) => {
          if (i === MISSING.i && j === MISSING.j) return null;
          return <circle key={`${i}-${j}`} cx={GRID_X0 + i * PITCH} cy={GRID_Y0 + j * PITCH} r={GR} fill="none" stroke={GHOST} strokeWidth={1} strokeDasharray="2.5 3.5" opacity={n2(tween(f, AT.hold + 6 + i + j, 8))} />;
        }),
      )}
      <circle cx={mx} cy={my} r={GR} fill="none" stroke={C.accent} strokeWidth={1} strokeDasharray="1 5" opacity={0.7 * (1 - drop)} />
      <line x1={mx} y1={lerp(my + GR + 6, HZ - 20, drop)} x2={mx} y2={HZ - 20} stroke={C.grey} strokeWidth={1} strokeDasharray="1 6" opacity={n2(drop)} />
      <Hair x1={L} y1={HZ} x2={R} y2={HZ} p={tween(f, AT.hold + 8, 16, 0, 1, E.inOut)} from="center" o={0.85} />
      <Dot x={mx} y={HZ} r={DOT.r * drop} />
      <Txt x={mx} y={HZ + 36} k="mono" size={11} ls={0.14} c={C.grey} anchor="middle" o={tween(f, AT.hold + 28, 8)}>
        ONE LEFT
      </Txt>
    </g>
  );
};

const End: React.FC<P> = ({f}) => {
  const e = END_AT;
  const push = 1 + 0.02 * tween(f, e, 150, 0, 1, E.soft);
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
        <Letters text="少即是多" x={L - 6} y={HZ - 48} k="sc300" size={88} ls={0.2} fx={fx(e + 10, 3)} />
        <Txt x={R} y={HZ - 52} k="mono" size={16} ls={0.16} c={C.greyDk} anchor="end" o={o(e + 26)}>
          WENIGER, ABER BESSER
        </Txt>
        <Txt x={L} y={HZ + 72} k="t300" size={32} o={o(e + 20)}>
          {THESIS.zh}
        </Txt>
        <Txt x={R} y={HZ + 70} k="t300" size={24} c={C.greyDk} anchor="end" o={o(e + 28)}>
          {THESIS.en}
        </Txt>
      </g>
      <Txt x={L} y={132} k="mono" size={16} ls={0.18} c={C.greyDk} o={o(e + 16)}>
        DESIGN STYLE · 007
      </Txt>
      <Txt x={R} y={132} k="mono" size={16} ls={0.18} c={C.greyDk} anchor="end" o={o(e + 18)}>
        LESS, BUT BETTER
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

export const Finale: React.FC<P> = ({f}) => (
  <g>
    {f >= AT.hold - 4 && f < AT.end && <PosterHold f={f} />}
    {f >= END_AT && <End f={f} />}
  </g>
);
