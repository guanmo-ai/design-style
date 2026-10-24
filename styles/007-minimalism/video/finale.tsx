/**
 * 007 · Minimalism —— 回顾 + 片尾 11.7–15s（f704–900）
 *   11.7–12.2s  镜头从手机往后拉：原来它站在一条线上，左边还有德国馆、收音机、贾德的盒子（1929 / 1958 / 1967 / 2013）
 *   12.45–12.8s 四个年代一拍删一个；线往中间收，点走到正中——回到开场的那个点
 *   13.0–15s    片尾：点、一圈涟漪、地平线再画一遍；少，即是多。@guanmo_ai
 */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C, DOT, LAYOUT, LINE} from '../tokens';
import {AT} from './timeline';
import {Dot, Hair, lerp, Letters, n2, P, Ripple, Txt, vis} from './ui';
import {Pavilion} from './space';
import {RadioStatic} from './radio';
import {JuddStatic} from './judd';
import {knob, Phone, PHONE, RECAP_AT} from './today';

const HZ = LAYOUT.horizon;
const L = LAYOUT.mx;
const R = 1920 - LAYOUT.mx;
const GAP = 14; // 小图和线之间留一点空
const SV = 0.17; // 手机缩成小图的比例
const PC = {x: PHONE.x + PHONE.w / 2, y: PHONE.y + PHONE.h / 2};
const VC = {x: 1560, y: HZ - GAP - (PHONE.h * SV) / 2};

type Era = {x: number; year: string; name: string; cut: number; draw: React.ReactNode};
export const ERA_CUTS = [742.5, 750, 757.5, 765]; // 十六分音符
const ERAS: Era[] = [
  {x: 360, year: '1929', name: '巴塞罗那德国馆', cut: ERA_CUTS[0], draw: <g transform={`translate(360 ${HZ - GAP}) scale(0.16) translate(-960 -952)`}><Pavilion f={214} dot={false} /></g>},
  {x: 760, year: '1958', name: '收音机', cut: ERA_CUTS[1], draw: <g transform={`translate(760 ${HZ - GAP}) scale(0.24) translate(-880 -750)`}><RadioStatic /></g>},
  {x: 1160, year: '1967', name: '贾德 · 堆叠', cut: ERA_CUTS[2], draw: <g transform={`translate(1160 ${HZ - GAP}) scale(0.2) translate(-1160 -900)`}><JuddStatic /></g>},
  {x: 1560, year: '2013', name: '扁平界面', cut: ERA_CUTS[3], draw: null},
];
const COLLAPSE = 766; // 线往中间收
export const END_AT = AT.end;

/** 往后拉的镜头：手机（全尺寸）→ 小图；用对数插值，像真的变焦 */
const zoom = (f: number) => {
  const t = tween(f, RECAP_AT, 26, 0, 1, E.inOut);
  const z = Math.exp(lerp(Math.log(1 / SV), 0, t));
  return {t, z, gx: lerp(PC.x, VC.x, t), gy: lerp(PC.y, VC.y, t)};
};
const cam = (f: number, x: number, y: number) => {
  const {z, gx, gy} = zoom(f);
  return {x: gx + z * (x - VC.x), y: gy + z * (y - VC.y)};
};

const del = (f: number, at: number) => 1 - tween(f, at, 6, 0, 1, E.in);

/** 点：先跟着开关一起缩小，再落到线上；最后沿着线走到正中 */
const dotRecap = (f: number) => {
  const k = knob(1);
  const kv = {x: VC.x + SV * (k.x - PC.x), y: VC.y + SV * (k.y + 150 - PC.y)};
  const a = cam(f, kv.x, kv.y);
  const drop = tween(f, RECAP_AT + 18, 14, 0, 1, E.inOut);
  const x1 = lerp(a.x, 1560, drop);
  const y1 = lerp(a.y, HZ, drop) - Math.sin(Math.PI * drop) * 24;
  const go = tween(f, COLLAPSE - 2, 16, 0, 1, E.inOut);
  return {x: lerp(x1, 960, go), y: lerp(y1, HZ, go), r: lerp(lerp(14, 9, tween(f, RECAP_AT, 24, 0, 1, E.inOut)), DOT.r, tween(f, COLLAPSE + 4, 12, 0, 1, E.out))};
};

const Recap: React.FC<P> = ({f}) => {
  const {z, gx, gy} = zoom(f);
  const tf = `translate(${n2(gx)} ${n2(gy)}) scale(${n2(z * 1000) / 1000}) translate(${-VC.x} ${n2(-VC.y)})`;
  // 线：拉镜时跟着出现，最后从两头往中间收
  const shrink = tween(f, COLLAPSE, 14, 0, 1, E.inOut);
  const lineIn = tween(f, RECAP_AT + 4, 22, 0, 1, E.out);
  const a = cam(f, L, HZ);
  const b = cam(f, R, HZ);
  const xa = lerp(a.x, 960, shrink);
  const xb = lerp(b.x, 960, shrink);
  const d = dotRecap(f);
  return (
    <g>
      {lineIn > 0 && shrink < 1 && <line x1={n2(xa)} y1={n2(a.y)} x2={n2(xb)} y2={n2(b.y)} stroke={C.ink} strokeWidth={LINE.main} opacity={n2(0.85 * lineIn)} />}
      <g transform={tf}>
        {ERAS.map((e, i) => {
          const s = del(f, e.cut);
          if (s <= 0.005) return null;
          const art =
            i === 3 ? (
              <g transform={`translate(${VC.x} ${n2(VC.y)}) scale(${SV}) translate(${-PC.x} ${-PC.y})`}>
                <Phone f={Math.min(f, 712)} dot={false} id="scr-recap" />
              </g>
            ) : (
              e.draw
            );
          const sc = s < 1 ? `translate(${e.x} ${HZ}) scale(${n2(s)}) translate(${-e.x} ${-HZ})` : undefined;
          return (
            <g key={e.year} transform={sc} opacity={s < 0.5 ? n2(s / 0.5) : undefined}>
              {art}
            </g>
          );
        })}
      </g>
      {ERAS.map((e) => {
        const p = cam(f, e.x, HZ);
        const s = del(f, e.cut) * lineIn;
        if (s <= 0.01 || shrink >= 1) return null;
        return <line key={e.year} x1={n2(p.x)} y1={n2(p.y - 6 * s)} x2={n2(p.x)} y2={n2(p.y + 6 * s)} stroke={C.ink} strokeWidth={LINE.note} />;
      })}
      {/* 年份、名字：不跟着缩放（拉镜结束时才出来） */}
      {ERAS.map((e, i) => {
        const o = tween(f, RECAP_AT + 18 + i * 2.5, 10) * del(f, e.cut);
        return (
          <g key={e.year}>
            <Txt x={e.x} y={HZ + 40} k="mono" size={16} ls={0.16} anchor="middle" o={o}>
              {e.year}
            </Txt>
            <Txt x={e.x} y={HZ + 68} k="sc300" size={16} ls={0.12} c={C.greyDk} anchor="middle" o={o}>
              {e.name}
            </Txt>
          </g>
        );
      })}
      <Txt x={120} y={172} k="sc300" size={46} ls={0.08} o={vis(f, 724, COLLAPSE - 4, 12, 10)}>
        近一百年，同一个动作：删。
      </Txt>
      <Txt x={120} y={218} k="t300" size={24} ls={0.01} c={C.greyDk} o={vis(f, 730, COLLAPSE - 4, 12, 10)}>
        Almost a century of one move: take away.
      </Txt>
      {f < END_AT && <Dot x={d.x} y={d.y} r={d.r} />}
    </g>
  );
};

/* ═══════════ 片尾：回到开场 ═══════════ */
const End: React.FC<P> = ({f}) => {
  const e = END_AT;
  const push = 1 + 0.02 * tween(f, e, 120, 0, 1, E.soft);
  const fx = (at: number, gap: number) => (i: number) => {
    const p = tween(f, at + i * gap, 20, 0, 1, E.out);
    return {o: p, dx: (1 - p) * (i + 1) * 10};
  };
  const o = (at: number) => tween(f, at, 16, 0, 1, E.out);
  return (
    <g>
      <g transform={`translate(960 ${HZ}) scale(${n2(push * 1000) / 1000}) translate(-960 ${-HZ})`}>
        <Hair x1={L} y1={HZ} x2={R} y2={HZ} p={tween(f, e + 4, 26, 0, 1, E.inOut)} from="center" o={0.85} />
        <Ripple f={f} at={e} x={960} y={HZ} r0={DOT.r} r1={260} dur={46} />
        <Ripple f={f} at={e + 8} x={960} y={HZ} r0={DOT.r} r1={150} dur={40} />
        <Dot x={960} y={HZ} r={DOT.r / push} />
        <Letters text="少即是多" x={L - 6} y={HZ - 48} k="sc300" size={96} ls={0.24} fx={fx(e + 12, 3)} />
        <Txt x={R} y={HZ - 52} k="mono" size={16} ls={0.16} c={C.greyDk} anchor="end" o={o(e + 30)}>
          LUDWIG MIES VAN DER ROHE
        </Txt>
        <Txt x={L} y={HZ + 72} k="t300" size={36} o={o(e + 24)}>
          Less is more.
        </Txt>
        <Txt x={R} y={HZ + 70} k="sc300" size={26} ls={0.3} c={C.greyDk} anchor="end" o={o(e + 32)}>
          极简主义
        </Txt>
      </g>
      <Txt x={L} y={132} k="mono" size={16} ls={0.18} c={C.greyDk} o={o(e + 20)}>
        DESIGN STYLE · 007
      </Txt>
      <Txt x={R} y={132} k="mono" size={16} ls={0.18} c={C.greyDk} anchor="end" o={o(e + 22)}>
        1929 — TODAY
      </Txt>
      <line x1={L} y1={884} x2={n2(lerp(L, R, tween(f, e + 36, 30, 0, 1, E.inOut)))} y2={884} stroke={C.hair} strokeWidth={1} />
      <g opacity={n2(o(e + 44))}>
        <text x={L} y={940} fill={C.ink} style={{fontFamily: "'Inter'", fontWeight: 500, fontSize: 24}}>
          Design Style
          <tspan dx={12} style={{fontFamily: "'Noto Sans SC'", fontWeight: 400, fontSize: 22, letterSpacing: '0.06em'}}>
            风格
          </tspan>
          <tspan dx={8}>007</tspan>
        </text>
      </g>
      <Txt x={960} y={940} k="t400" size={28} anchor="middle" o={o(e + 48)}>
        @guanmo_ai
      </Txt>
      <Txt x={R} y={940} k="t300" size={22} c={C.greyDk} anchor="end" o={o(e + 52)}>
        github.com/guanmo-ai/design-style
      </Txt>
    </g>
  );
};

export const Finale: React.FC<P> = ({f}) => (
  <g>
    {f < END_AT + 2 && <Recap f={f} />}
    {f >= END_AT && <End f={f} />}
  </g>
);
