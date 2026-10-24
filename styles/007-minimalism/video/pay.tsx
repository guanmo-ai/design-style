/**
 * 007 · Minimalism —— 15.4–17.6s
 *   同一原则进确认：一金额、一按钮。
 */
import React from 'react';
import {E, SNAP, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT} from './timeline';
import {WIN} from './app';
import {Box, Cam2, Txt, camTrack, mixBox, n2, P} from './ui';

export const CARD: Box = {x: 560, y: 160, w: 800, h: 680, r: 8};
export const PAY_CUTS = [960, 978, 996, 1014];
export const PAY_KEEP = 1032;
export const VS_GO = AT.vs;

export const camPay = (f: number): Cam2 =>
  camTrack(f, [
    [AT.pay, {ox: 960, oy: 540, s: 1.04}],
    [PAY_CUTS[0], {ox: 960, oy: 500, s: 1.08}],
    [PAY_KEEP, {ox: 960, oy: 500, s: 1.12}],
    [VS_GO - 4, {ox: 960, oy: 540, s: 1}],
  ]);

export const Pay: React.FC<P> = ({f}) => {
  if (f < AT.pay - 4 || f >= AT.vs) return null;
  const enter = spr(f, AT.pay, SMOOTH, 22);
  const leave = tween(f, AT.vs - 14, 14, 0, 1, E.inOut);
  const body = mixBox(WIN, CARD, enter);
  const fees = 1 - tween(f, PAY_CUTS[0], 12, 0, 1, E.in);
  const promo = 1 - tween(f, PAY_CUTS[1], 12, 0, 1, E.in);
  const extra = 1 - tween(f, PAY_CUTS[2], 12, 0, 1, E.in);
  const terms = 1 - tween(f, PAY_CUTS[3], 12, 0, 1, E.in);
  const keep = spr(f, PAY_KEEP, SNAP, 18);
  const o = enter * (1 - leave * 0.2);
  const x = body.x;
  const y = body.y;
  const w = body.w;
  return (
    <g opacity={n2(o)}>
      <rect x={n2(x)} y={n2(y)} width={n2(w)} height={n2(body.h)} rx={n2(body.r ?? 0)} fill={C.paperHi} stroke={C.ink} strokeWidth={1.5} />
      <Txt x={x + 40} y={y + 56} k="mono" size={14} ls={0.16} c={C.greyDk} o={tween(f, AT.pay + 6, 8)}>
        CONFIRM
      </Txt>
      <Txt x={x + w / 2} y={y + 200} k="d100" size={96} anchor="middle" o={tween(f, AT.pay + 8, 10)}>
        ¥12
      </Txt>
      <Txt x={x + w / 2} y={y + 248} k="sc300" size={18} ls={0.08} c={C.greyDk} anchor="middle" o={tween(f, AT.pay + 14, 8)}>
        设计手册 · 单次
      </Txt>
      <g opacity={n2(fees)} transform={`translate(${n2(x + 48)} ${n2(y + 300)})`}>
        {[
          ['服务费', '¥2'],
          ['优惠券抵扣', '−¥1'],
          ['税费', '¥0.6'],
        ].map(([a, b], i) => (
          <g key={a} transform={`translate(0 ${i * 36})`}>
            <Txt x={0} y={0} k="sc300" size={16} c={C.grey}>
              {a}
            </Txt>
            <Txt x={w - 96} y={0} k="t400" size={16} anchor="end">
              {b}
            </Txt>
          </g>
        ))}
      </g>
      <g opacity={n2(promo)}>
        <rect x={x + 48} y={y + 420} width={w - 96} height={48} rx={4} fill={C.shade} />
        <Txt x={x + 68} y={y + 450} k="sc300" size={16} c={C.grey}>
          兑换码  SUMMER50
        </Txt>
        <rect x={x + w - 168} y={y + 428} width={100} height={32} rx={4} fill="#C4A35A" />
      </g>
      <g opacity={n2(extra)}>
        <rect x={x + 48} y={y + 488} width={(w - 112) / 2} height={44} rx={4} fill={C.stone} />
        <Txt x={x + 48 + (w - 112) / 4} y={y + 516} k="sc400" size={15} anchor="middle">
          稍后再说
        </Txt>
        <rect x={x + 64 + (w - 112) / 2} y={y + 488} width={(w - 112) / 2} height={44} rx={4} fill="#2A6B7C" />
        <Txt x={x + 64 + (w - 112) * 0.75} y={y + 516} k="sc400" size={15} c={C.paper} anchor="middle">
          加入会员
        </Txt>
      </g>
      <g opacity={n2(terms)}>
        <Txt x={x + w / 2} y={y + 560} k="sc300" size={13} c={C.grey} anchor="middle">
          点击即同意 16 条条款与自动续费
        </Txt>
      </g>
      <g opacity={n2(tween(f, AT.pay + 10, 10))} transform={`translate(0 ${n2((1 - keep) * 12)})`}>
        <rect x={x + 48} y={y + body.h - 100} width={w - 96} height={56} rx={2} fill={C.ink} />
        <line x1={x + 48} y1={y + body.h - 44} x2={x + w - 48} y2={y + body.h - 44} stroke={C.accent} strokeWidth={3} />
        <Txt x={x + w / 2} y={y + body.h - 64} k="sc400" size={20} c={C.paper} anchor="middle">
          确认支付
        </Txt>
      </g>
    </g>
  );
};
