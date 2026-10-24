/**
 * 007 · Minimalism —— 确认 15.0–18.4s（极简产品）
 *   按 → 勾 → 空。同一屏不晾 >0.8s。
 */
import React from 'react';
import {E, POP, SNAP, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C, LINE} from '../tokens';
import {AT} from './timeline';
import {Cam2, camTrack, Dot, lerp, n2, P, Txt, vis, World} from './ui';

export const PAY_PRESS = 924;
export const PAY_OK = 942;
export const EMPTY_AT = 972;
export const PLUS_AT = 1008;
export const DRAFT_AT = 1032;
export const FOLD_AT = 1068;
export const END_GO = AT.recap;

export const CARD = {x: 600, y: 160, w: 720, h: 760, r: 32};
const BTN = {x: 672, y: 720, w: 576, h: 72, r: 36};

export const camPay = (f: number): Cam2 =>
  camTrack(f, [
    [AT.pay, {ox: 960, oy: 540, s: 1.04}],
    [PAY_PRESS, {ox: 960, oy: 600, s: 1.12}],
    [PAY_OK, {ox: 960, oy: 560, s: 1.08}],
    [EMPTY_AT, {ox: 960, oy: 540, s: 1.08}],
    [PLUS_AT, {ox: 960, oy: 540, s: 1.14}],
    [DRAFT_AT, {ox: 960, oy: 500, s: 1.1}],
    [FOLD_AT, {ox: 1100, oy: 480, s: 1.16}],
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
  const draft = {x: 960, y: 460};
  const t = tween(f, EMPTY_AT, 20, 0, 1, E.inOut);
  const enter = tween(f, AT.pay, 18, 0, 1, E.inOut);
  const tD = tween(f, DRAFT_AT - 6, 12, 0, 1, E.inOut);
  const tF = tween(f, FOLD_AT - 4, 14, 0, 1, E.inOut);
  let x = lerp(lerp(320, btn.x, enter), plus.x, t);
  let y = lerp(lerp(540, btn.y, enter), plus.y, t);
  x = lerp(x, draft.x, tD * (1 - tF));
  y = lerp(y, draft.y, tD * (1 - tF));
  x = lerp(x, plus.x + 220 * tF, tF);
  y = lerp(y, plus.y - 40 * tF, tF);
  return {x, y, r: lerp(13, 15, t)};
};

const Pill: React.FC<{f: number; at: number; t: string}> = ({f, at, t}) => {
  const o = vis(f, at, at + 24, 5, 7);
  if (o <= 0.001) return null;
  const s = 0.84 + 0.16 * spr(f, at, POP, 12);
  return (
    <g transform={`translate(140 236) scale(${n2(s)})`} opacity={n2(o)}>
      <rect x={0} y={-22} width={t.length * 15 + 20} height={30} rx={4} fill={C.ink} />
      <Txt x={10} y={0} k="mono" size={13} ls={0.08} c={C.paperHi}>
        {t}
      </Txt>
    </g>
  );
};

const Draft: React.FC<P> = ({f}) => {
  const inn = spr(f, DRAFT_AT, POP, 16);
  const fold = spr(f, FOLD_AT, SNAP, 16);
  const s = inn * (1 - fold);
  if (s <= 0.01) return null;
  const x = 960 + 320 * fold;
  const y = 460 - 60 * fold;
  return (
    <g transform={`translate(${n2(x)} ${n2(y)}) rotate(${n2(-12 * fold)}) scale(${n2(s)})`} opacity={n2(1 - fold)}>
      <Txt x={0} y={0} k="d200" size={56} anchor="middle">
        07:00
      </Txt>
      <Txt x={0} y={36} k="sc300" size={16} ls={0.08} c={C.grey} anchor="middle">
        新闹钟
      </Txt>
    </g>
  );
};

const Captions: React.FC<P> = ({f}) => (
  <g>
    <Txt x={120} y={168} k="sc300" size={32} ls={0.06} o={vis(f, AT.pay + 6, EMPTY_AT, 8, 6)}>
      付款页只留一个动作。
    </Txt>
    <Txt x={1800} y={150} k="mono" size={14} ls={0.16} c={C.greyDk} anchor="end" o={vis(f, AT.pay + 6, END_GO - 8, 10, 8)}>
      极简产品 · PAY
    </Txt>
    <Pill f={f} at={PAY_PRESS} t="CONFIRM" />
    <Pill f={f} at={PAY_OK} t="CHECK" />
    <Pill f={f} at={EMPTY_AT} t="EMPTY" />
    <Pill f={f} at={DRAFT_AT} t="DRAFT" />
    <Pill f={f} at={FOLD_AT} t="FOLD" />
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
          <Txt x={960} y={280} k="mono" size={14} ls={0.18} c={C.greyDk} anchor="middle" o={tween(f, AT.pay + 6, 8)}>
            CONFIRM
          </Txt>
          <Txt x={960} y={430} k="d100" size={96} anchor="middle" o={tween(f, AT.pay + 10, 10)}>
            ¥ 12
          </Txt>
          <Txt x={960} y={490} k="sc300" size={20} ls={0.1} c={C.greyDk} anchor="middle" o={tween(f, AT.pay + 16, 8)}>
            手册 · 永久
          </Txt>
          <line x1={672} y1={560} x2={1248} y2={560} stroke={C.hair} strokeWidth={1} />
          <Txt x={672} y={620} k="sc300" size={18} c={C.grey} o={tween(f, AT.pay + 18, 8)}>
            支付方式
          </Txt>
          <Txt x={1248} y={620} k="t400" size={18} anchor="end" o={tween(f, AT.pay + 18, 8)}>
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
          <Draft f={f} />
          <g transform={`translate(960 560) scale(${n2(1 - 0.08 * pressAmt(f, PLUS_AT))}) translate(-960 -560)`} opacity={n2(1 - tween(f, DRAFT_AT, 8, 0, 0.55, E.out) * (1 - tween(f, FOLD_AT + 8, 10)))}>
            <circle cx={960} cy={560} r={36} fill="none" stroke={C.ink} strokeWidth={LINE.main} />
            <path d="M948 560H972M960 548V572" stroke={C.ink} strokeWidth={LINE.main} />
          </g>
          <Txt x={960} y={680} k="sc300" size={28} ls={0.1} anchor="middle" o={1 - tween(f, DRAFT_AT, 8) * (1 - tween(f, FOLD_AT + 6, 10))}>
            没有待办。
          </Txt>
          <Txt x={960} y={728} k="t300" size={18} c={C.grey} anchor="middle" o={1 - tween(f, DRAFT_AT, 8) * (1 - tween(f, FOLD_AT + 6, 10))}>
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
