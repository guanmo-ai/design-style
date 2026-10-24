/**
 * 007 · Minimalism —— 确认 15.5–19.0s（f930–1140）
 *   同一套语言换容器：一张纸从手册里弹出来。一个金额，一个按钮。
 *   按下去 → 勾画上 → 纸被清空，只剩「没有待办」和一个加号。
 */
import React from 'react';
import {E, SNAP, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C, LINE} from '../tokens';
import {AT} from './timeline';
import {Cam2, camTrack, Dot, lerp, n2, P, Txt, vis, World} from './ui';

export const PAY_PRESS = 984;
export const PAY_OK = 1008;
export const EMPTY_AT = 1056;
export const END_GO = AT.end;

export const CARD = {x: 600, y: 160, w: 720, h: 760, r: 32};
const BTN = {x: 672, y: 720, w: 576, h: 72, r: 36};

export const camPay = (f: number): Cam2 =>
  camTrack(f, [
    [AT.pay, {ox: 960, oy: 540, s: 1.04}],
    [PAY_PRESS, {ox: 960, oy: 600, s: 1.12}],
    [PAY_OK, {ox: 960, oy: 560, s: 1.08}],
    [EMPTY_AT, {ox: 960, oy: 540, s: 1.06}],
    [END_GO, {ox: 960, oy: 540, s: 1}],
  ]);

const pressAmt = (f: number, at: number) => {
  const down = tween(f, at, 5, 0, 1, E.in);
  const up = tween(f, at + 5, 10, 0, 1, E.out);
  return down * (1 - up);
};

const Check: React.FC<{p: number; x: number; y: number}> = ({p, x, y}) => {
  if (p <= 0.001) return null;
  const d1 = 18;
  const d2 = 34;
  const a = Math.min(1, p * 1.6);
  const b = Math.min(1, Math.max(0, p * 1.6 - 0.6));
  return (
    <g stroke={C.paperHi} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1={x} y1={y} x2={n2(x + d1 * a)} y2={n2(y + d1 * 0.7 * a)} />
      {b > 0 && <line x1={x + d1} y1={y + d1 * 0.7} x2={n2(x + d1 + d2 * b)} y2={n2(y + d1 * 0.7 - d2 * 0.85 * b)} />}
    </g>
  );
};

export const dotPay = (f: number) => {
  const btn = {x: BTN.x + BTN.w / 2, y: BTN.y + BTN.h / 2};
  const plus = {x: 960, y: 560};
  const t = tween(f, EMPTY_AT, 20, 0, 1, E.inOut);
  const enter = tween(f, AT.pay, 18, 0, 1, E.inOut);
  return {
    x: lerp(lerp(320, btn.x, enter), plus.x, t),
    y: lerp(lerp(540, btn.y, enter), plus.y, t),
    r: lerp(13, 15, t),
  };
};

const Captions: React.FC<P> = ({f}) => (
  <g>
    <Txt x={120} y={172} k="sc300" size={40} ls={0.08} o={vis(f, 938, 1020, 10, 8)}>
      付款页只留一个动作。
    </Txt>
    <Txt x={120} y={172} k="sc300" size={40} ls={0.08} o={vis(f, 1060, 1130, 10, 8)}>
      做完了，就空着。
    </Txt>
    <Txt x={1800} y={150} k="mono" size={14} ls={0.16} c={C.greyDk} anchor="end" o={vis(f, 936, 1130, 12, 10)}>
      CHECKOUT · EMPTY
    </Txt>
  </g>
);

export const Pay: React.FC<P> = ({f}) => {
  const enter = spr(f, AT.pay, SMOOTH, 28);
  const leave = tween(f, END_GO - 12, 12, 0, 1, E.in);
  const empty = spr(f, EMPTY_AT, SMOOTH, 26);
  const ok = spr(f, PAY_OK, SNAP, 18);
  const press = pressAmt(f, PAY_PRESS);
  const s = (0.72 + 0.28 * enter) * (1 - 0.08 * leave);
  const btnS = 1 - 0.06 * press;
  const d = dotPay(f);
  if (enter <= 0.01 && f < AT.pay) return null;
  return (
    <g opacity={n2((0.12 + 0.88 * enter) * (1 - leave))}>
      <World c={camPay(f)}>
      <g transform={`translate(960 540) scale(${n2(s)}) translate(-960 -540)`}>
        <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={CARD.r} fill={C.paperHi} stroke={C.ink} strokeWidth={LINE.main} />
        <g opacity={n2(1 - empty)}>
          <Txt x={960} y={280} k="mono" size={14} ls={0.18} c={C.greyDk} anchor="middle" o={tween(f, 938, 10)}>
            CONFIRM
          </Txt>
          <Txt x={960} y={430} k="d100" size={96} anchor="middle" o={tween(f, 944, 12)}>
            ¥ 12
          </Txt>
          <Txt x={960} y={490} k="sc300" size={20} ls={0.1} c={C.greyDk} anchor="middle" o={tween(f, 954, 10)}>
            手册 · 永久
          </Txt>
          <line x1={672} y1={560} x2={1248} y2={560} stroke={C.hair} strokeWidth={1} />
          <Txt x={672} y={620} k="sc300" size={18} c={C.grey} o={tween(f, 960, 10)}>
            支付方式
          </Txt>
          <Txt x={1248} y={620} k="t400" size={18} anchor="end" o={tween(f, 960, 10)}>
            已绑定
          </Txt>
          <g transform={`translate(${BTN.x + BTN.w / 2} ${BTN.y + BTN.h / 2}) scale(${n2(btnS)}) translate(${n2(-(BTN.x + BTN.w / 2))} ${n2(-(BTN.y + BTN.h / 2))})`}>
            <rect x={BTN.x} y={BTN.y} width={BTN.w} height={BTN.h} rx={BTN.r} fill={C.ink} />
            <Txt x={960} y={BTN.y + 46} k="sc400" size={22} ls={0.1} c={C.paperHi} anchor="middle" o={1 - ok}>
              确认支付
            </Txt>
            <g opacity={n2(ok)}>
              <Txt x={930} y={BTN.y + 46} k="sc400" size={22} ls={0.1} c={C.paperHi} anchor="middle">
                已支付
              </Txt>
              <Check p={ok} x={1088} y={BTN.y + 28} />
            </g>
          </g>
        </g>
        <g opacity={n2(empty)}>
          <Txt x={960} y={360} k="mono" size={14} ls={0.18} c={C.greyDk} anchor="middle">
            EMPTY
          </Txt>
          <circle cx={960} cy={560} r={36} fill="none" stroke={C.ink} strokeWidth={LINE.main} />
          <path d="M948 560H972M960 548V572" stroke={C.ink} strokeWidth={LINE.main} />
          <Txt x={960} y={680} k="sc300" size={28} ls={0.1} anchor="middle">
            没有待办。
          </Txt>
          <Txt x={960} y={728} k="t300" size={18} c={C.grey} anchor="middle">
            做完了就空着。
          </Txt>
        </g>
        {f < END_GO && <Dot x={d.x} y={d.y} r={d.r} />}
      </g>
      </World>
      <Captions f={f} />
    </g>
  );
};
